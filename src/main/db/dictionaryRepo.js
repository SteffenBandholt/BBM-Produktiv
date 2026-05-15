const { randomUUID } = require("crypto");
const { initDatabase } = require("./database");

function _nowIso() {
  return new Date().toISOString();
}

function _escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _normalizeCategory(value) {
  return String(value || "Bau").trim() || "Bau";
}

function _normalizeEntryType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "term") return "term";
  if (raw === "correction") return "correction";
  throw new Error("entryType must be 'term' or 'correction'");
}

function _normalizeSource(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "base" ? "base" : "user";
}

function _normalizeActive(value, fallback = 1) {
  if (value === null || value === undefined || value === "") return fallback ? 1 : 0;
  return Number(value) === 1 ? 1 : 0;
}

function _normalizeText(value) {
  return String(value || "").trim();
}

function _buildWhereClause(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.category) {
    clauses.push("category = ?");
    params.push(_normalizeCategory(filters.category));
  }
  if (filters.entryType) {
    clauses.push("entry_type = ?");
    params.push(_normalizeEntryType(filters.entryType));
  }
  if (filters.source) {
    clauses.push("source = ?");
    params.push(_normalizeSource(filters.source));
  }
  if (filters.active === true || filters.active === false || filters.active === 0 || filters.active === 1) {
    clauses.push("active = ?");
    params.push(_normalizeActive(filters.active));
  }

  const search = _normalizeText(filters.search);
  if (search) {
    const like = `%${search.toLocaleLowerCase("de-DE")}%`;
    clauses.push(
      `(
        lower(coalesce(term_text, '')) LIKE ?
        OR lower(coalesce(wrong_text, '')) LIKE ?
        OR lower(coalesce(correct_text, '')) LIKE ?
      )`
    );
    params.push(like, like, like);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function listEntries(filters = {}) {
  const db = initDatabase();
  const where = _buildWhereClause(filters);
  return db
    .prepare(
      `
      SELECT *
      FROM dictionary_entries
      ${where.sql}
      ORDER BY
        CASE source WHEN 'base' THEN 0 ELSE 1 END,
        CASE entry_type WHEN 'correction' THEN 0 ELSE 1 END,
        lower(coalesce(term_text, wrong_text, correct_text, '')) ASC,
        created_at DESC
    `
    )
    .all(...where.params);
}

function getEntryById(id) {
  const db = initDatabase();
  const entryId = String(id || "").trim();
  if (!entryId) throw new Error("id required");
  return db
    .prepare(
      `
      SELECT *
      FROM dictionary_entries
      WHERE id = ?
      LIMIT 1
    `
    )
    .get(entryId);
}

function findExistingEntry({ entryType, termText, wrongText, correctText, source = "user" }) {
  const db = initDatabase();
  const normalizedType = _normalizeEntryType(entryType);
  const normalizedSource = _normalizeSource(source);
  const params = [_normalizeCategory("Bau"), normalizedType, normalizedSource];

  let sql = `
    SELECT *
    FROM dictionary_entries
    WHERE category = ?
      AND entry_type = ?
      AND source = ?
  `;

  if (normalizedType === "term") {
    sql += " AND lower(coalesce(term_text, '')) = lower(?)";
    params.push(_normalizeText(termText));
  } else {
    sql += " AND lower(coalesce(wrong_text, '')) = lower(?)";
    sql += " AND lower(coalesce(correct_text, '')) = lower(?)";
    params.push(_normalizeText(wrongText), _normalizeText(correctText));
  }

  sql += " LIMIT 1";
  return db.prepare(sql).get(...params);
}

function createEntry(entry) {
  const db = initDatabase();
  const now = _nowIso();
  const normalizedType = _normalizeEntryType(entry?.entryType);
  const source = _normalizeSource(entry?.source);
  const category = _normalizeCategory(entry?.category);

  const payload = {
    id: randomUUID(),
    entry_type: normalizedType,
    wrong_text: normalizedType === "correction" ? _normalizeText(entry?.wrongText) : null,
    correct_text: normalizedType === "correction" ? _normalizeText(entry?.correctText) : null,
    term_text: normalizedType === "term" ? _normalizeText(entry?.termText) : null,
    category,
    source,
    active: _normalizeActive(entry?.active, 1),
    created_at: now,
    updated_at: now,
  };

  if (normalizedType === "term") {
    if (!payload.term_text) throw new Error("termText required");
  } else {
    if (!payload.wrong_text) throw new Error("wrongText required");
    if (!payload.correct_text) throw new Error("correctText required");
  }

  db.prepare(
    `
    INSERT INTO dictionary_entries (
      id,
      entry_type,
      wrong_text,
      correct_text,
      term_text,
      category,
      source,
      active,
      created_at,
      updated_at
    )
    VALUES (
      @id,
      @entry_type,
      @wrong_text,
      @correct_text,
      @term_text,
      @category,
      @source,
      @active,
      @created_at,
      @updated_at
    )
  `
  ).run(payload);

  return getEntryById(payload.id);
}

function updateEntry(id, patch = {}) {
  const db = initDatabase();
  const entryId = String(id || "").trim();
  if (!entryId) throw new Error("id required");
  const existing = getEntryById(entryId);
  if (!existing) throw new Error("dictionary entry not found");

  const nextType = _normalizeEntryType(patch.entryType || existing.entry_type);
  const nextCategory = _normalizeCategory(patch.category || existing.category);
  const nextSource = _normalizeSource(patch.source || existing.source);
  const nextActive = _normalizeActive(
    patch.active === undefined ? existing.active : patch.active,
    Number(existing.active) === 1
  );

  const next = {
    entry_type: nextType,
    wrong_text:
      nextType === "correction"
        ? _normalizeText(
            patch.wrongText !== undefined ? patch.wrongText : patch.wrong_text !== undefined ? patch.wrong_text : existing.wrong_text
          )
        : null,
    correct_text:
      nextType === "correction"
        ? _normalizeText(
            patch.correctText !== undefined
              ? patch.correctText
              : patch.correct_text !== undefined
                ? patch.correct_text
                : existing.correct_text
          )
        : null,
    term_text:
      nextType === "term"
        ? _normalizeText(
            patch.termText !== undefined ? patch.termText : patch.term_text !== undefined ? patch.term_text : existing.term_text
          )
        : null,
    category: nextCategory,
    source: nextSource,
    active: nextActive,
    updated_at: _nowIso(),
  };

  if (nextType === "term" && !next.term_text) throw new Error("termText required");
  if (nextType === "correction" && !next.wrong_text) throw new Error("wrongText required");
  if (nextType === "correction" && !next.correct_text) throw new Error("correctText required");

  db.prepare(
    `
    UPDATE dictionary_entries
    SET
      entry_type = ?,
      wrong_text = ?,
      correct_text = ?,
      term_text = ?,
      category = ?,
      source = ?,
      active = ?,
      updated_at = ?
    WHERE id = ?
  `
  ).run(
    next.entry_type,
    next.wrong_text,
    next.correct_text,
    next.term_text,
    next.category,
    next.source,
    next.active,
    next.updated_at,
    entryId
  );

  return getEntryById(entryId);
}

function setEntryActive(id, active) {
  return updateEntry(id, { active });
}

function deleteEntry(id) {
  const db = initDatabase();
  const entryId = String(id || "").trim();
  if (!entryId) throw new Error("id required");
  const existing = getEntryById(entryId);
  if (!existing) return { deleted: false };

  if (String(existing.source || "") === "base") {
    const row = setEntryActive(entryId, 0);
    return { deleted: false, deactivated: true, entry: row };
  }

  const info = db.prepare("DELETE FROM dictionary_entries WHERE id = ?").run(entryId);
  return { deleted: info.changes > 0, deactivated: false, entry: null };
}

function seedBaseEntries(entries = []) {
  const db = initDatabase();
  const list = Array.isArray(entries) ? entries : [];
  if (!list.length) return { inserted: 0 };

  let inserted = 0;
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      const normalizedType = _normalizeEntryType(row?.entryType);
      const existing = findExistingEntry({
        entryType: normalizedType,
        termText: row?.termText,
        wrongText: row?.wrongText,
        correctText: row?.correctText,
        source: "base",
      });
      if (existing) continue;
      createEntry({
        ...row,
        entryType: normalizedType,
        source: "base",
        active: row?.active === undefined ? 1 : row.active,
      });
      inserted += 1;
    }
  });
  tx(list);
  return { inserted };
}

function applyCorrectionsToText(text) {
  const sourceText = String(text || "");
  if (!sourceText.trim()) {
    return { text: sourceText, appliedCount: 0, applied: [] };
  }

  const entries = listEntries({ entryType: "correction", active: 1 });
  const sorted = [...entries].sort((a, b) => {
    const aLen = String(a?.wrong_text || "").length;
    const bLen = String(b?.wrong_text || "").length;
    return bLen - aLen;
  });

  let out = sourceText;
  const applied = [];

  for (const entry of sorted) {
    const wrong = _normalizeText(entry?.wrong_text);
    const correct = _normalizeText(entry?.correct_text);
    if (!wrong || !correct) continue;

    const pattern = new RegExp(`\\b${_escapeRegExp(wrong)}\\b`, "gi");
    let count = 0;
    out = out.replace(pattern, () => {
      count += 1;
      return correct;
    });

    if (count > 0) {
      applied.push({
        id: entry.id,
        entryType: entry.entry_type,
        source: entry.source,
        wrongText: wrong,
        correctText: correct,
        count,
      });
    }
  }

  const appliedCount = applied.reduce((sum, item) => sum + Number(item?.count || 0), 0);
  return { text: out, appliedCount, applied };
}

module.exports = {
  applyCorrectionsToText,
  createEntry,
  deleteEntry,
  findExistingEntry,
  getEntryById,
  listEntries,
  seedBaseEntries,
  setEntryActive,
  updateEntry,
};
