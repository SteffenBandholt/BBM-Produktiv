const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createDictionaryService } = require("../../src/main/services/dictionary/DictionaryService.js");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function createMemoryDictionaryRepo() {
  const rows = [];
  let seq = 0;

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const matchesFilters = (entry, filters = {}) => {
    if (filters.category && String(entry.category || "") !== String(filters.category)) return false;
    if (filters.entryType && String(entry.entry_type || "") !== String(filters.entryType)) return false;
    if (filters.source && String(entry.source || "") !== String(filters.source)) return false;
    if (filters.active === true || filters.active === false || filters.active === 0 || filters.active === 1) {
      if (Number(entry.active) !== (Number(filters.active) === 1 ? 1 : 0)) return false;
    }
    const search = String(filters.search || "").trim().toLocaleLowerCase("de-DE");
    if (search) {
      const haystack = [entry.term_text, entry.wrong_text, entry.correct_text, entry.entry_type, entry.source]
        .map((value) => String(value || "").toLocaleLowerCase("de-DE"))
        .join(" ");
      if (!haystack.includes(search)) return false;
    }
    return true;
  };

  const makeEntry = (input) => ({
    id: input.id || `entry-${++seq}`,
    entry_type: input.entryType,
    wrong_text: input.wrongText || null,
    correct_text: input.correctText || null,
    term_text: input.termText || null,
    category: input.category || "Bau",
    source: input.source || "user",
    active: input.active === undefined ? 1 : Number(input.active) === 1 ? 1 : 0,
    created_at: input.created_at || "2026-01-01T00:00:00.000Z",
    updated_at: input.updated_at || "2026-01-01T00:00:00.000Z",
  });

  return {
    seedBaseEntries(entries) {
      for (const entry of Array.isArray(entries) ? entries : []) {
        const exists = rows.some(
          (row) =>
            row.source === "base" &&
            row.entry_type === entry.entryType &&
            String(row.term_text || "").toLocaleLowerCase("de-DE") ===
              String(entry.termText || "").toLocaleLowerCase("de-DE") &&
            String(row.wrong_text || "").toLocaleLowerCase("de-DE") ===
              String(entry.wrongText || "").toLocaleLowerCase("de-DE") &&
            String(row.correct_text || "").toLocaleLowerCase("de-DE") ===
              String(entry.correctText || "").toLocaleLowerCase("de-DE")
        );
        if (!exists) {
          rows.push(
            makeEntry({
              ...entry,
              source: "base",
              active: entry.active === undefined ? 1 : entry.active,
            })
          );
        }
      }
      return { inserted: rows.length };
    },
    listEntries(filters = {}) {
      return rows.filter((entry) => matchesFilters(entry, filters)).map(clone);
    },
    createEntry(entry) {
      const next = makeEntry(entry);
      rows.push(next);
      return clone(next);
    },
    updateEntry(id, patch = {}) {
      const row = rows.find((item) => String(item.id) === String(id));
      if (!row) throw new Error("dictionary entry not found");
      if (patch.entryType) row.entry_type = patch.entryType;
      if (patch.termText !== undefined) row.term_text = patch.termText || null;
      if (patch.wrongText !== undefined) row.wrong_text = patch.wrongText || null;
      if (patch.correctText !== undefined) row.correct_text = patch.correctText || null;
      if (patch.category) row.category = patch.category;
      if (patch.source) row.source = patch.source;
      if (patch.active !== undefined) row.active = Number(patch.active) === 1 ? 1 : 0;
      row.updated_at = "2026-01-01T00:00:00.000Z";
      return clone(row);
    },
    setEntryActive(id, active) {
      return this.updateEntry(id, { active });
    },
    deleteEntry(id) {
      const idx = rows.findIndex((item) => String(item.id) === String(id));
      if (idx < 0) return { deleted: false, deactivated: false, entry: null };
      const entry = rows[idx];
      if (entry.source === "base") {
        entry.active = 0;
        return { deleted: false, deactivated: true, entry: clone(entry) };
      }
      rows.splice(idx, 1);
      return { deleted: true, deactivated: false, entry: null };
    },
    applyCorrectionsToText(text) {
      let out = String(text || "");
      const applied = [];
      const corrections = rows
        .filter((entry) => entry.entry_type === "correction" && Number(entry.active) === 1)
        .sort((a, b) => String(b.wrong_text || "").length - String(a.wrong_text || "").length);

      for (const entry of corrections) {
        const wrong = String(entry.wrong_text || "").trim();
        const correct = String(entry.correct_text || "").trim();
        if (!wrong || !correct) continue;
        const pattern = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
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

      return { text: out, appliedCount: applied.reduce((sum, item) => sum + item.count, 0), applied };
    },
  };
}

async function runDictionaryModuleTests(run) {
  const [{ DictationController }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/features/audio-dictation/DictationController.js")),
  ]);

  const dictionaryRepoSource = read("src/main/db/dictionaryRepo.js");
  const dictionaryServiceSource = read("src/main/services/dictionary/DictionaryService.js");
  const databaseSource = read("src/main/db/database.js");
  const schemaSource = read("src/main/db/schema.sql");
  const preloadSource = read("src/main/preload.js");
  const editBoxStateSource = read("src/renderer/features/editor/EditBoxStateService.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");

  await run("Dictionary: Schema und Preload enthalten die neue globale Tabelle", () => {
    assert.equal(dictionaryRepoSource.includes("dictionary_entries"), true);
    assert.equal(dictionaryRepoSource.includes("applyCorrectionsToText"), true);
    assert.equal(dictionaryServiceSource.includes('DEFAULT_CATEGORY = "Bau"'), true);
    assert.equal(databaseSource.includes("dictionary_entries"), true);
    assert.equal(schemaSource.includes("dictionary_entries"), true);
    assert.equal(preloadSource.includes("dictionaryListEntries"), true);
    assert.equal(preloadSource.includes("dictionaryCreateEntry"), true);
    assert.equal(preloadSource.includes("dictionaryUpdateEntry"), true);
    assert.equal(preloadSource.includes("dictionaryDeleteEntry"), true);
    assert.equal(preloadSource.includes("dictionaryApplyToText"), true);
  });

  await run("Dictionary: Service speichert term/correction und respektiert Kategorie, Quelle und Loeschen", () => {
    const repo = createMemoryDictionaryRepo();
    const service = createDictionaryService({ repo });

    const term = service.createEntry({ entryType: "term", termText: "Bauleiter" });
    assert.equal(term.category, "Bau");
    assert.equal(term.source, "user");
    assert.equal(term.entry_type, "term");
    assert.equal(term.term_text, "Bauleiter");

    const correction = service.createEntry({
      entryType: "correction",
      wrongText: "rohrbau",
      correctText: "Rohbau",
    });
    assert.equal(correction.category, "Bau");
    assert.equal(correction.source, "user");
    assert.equal(correction.entry_type, "correction");

    const updated = service.updateEntry(correction.id, {
      wrongText: "rohrbau",
      correctText: "Rohbau",
      active: 0,
    });
    assert.equal(updated.source, "user");
    assert.equal(updated.active, 0);

    const userDelete = service.deleteEntry(term.id);
    assert.equal(userDelete.deleted, true);
    assert.equal(userDelete.deactivated, false);

    const baseEntry = service.listEntries({ source: "base", entryType: "correction" })[0];
    assert.equal(Boolean(baseEntry), true);
    const baseDelete = service.deleteEntry(baseEntry.id);
    assert.equal(baseDelete.deleted, false);
    assert.equal(baseDelete.deactivated, true);
    assert.equal(service.listEntries({ source: "base", active: 1 }).some((row) => row.id === baseEntry.id), false);
  });

  await run("Dictionary: Korrekturen werden case-insensitiv und exakt angewendet, Begriffe nicht", () => {
    const repo = createMemoryDictionaryRepo();
    const service = createDictionaryService({ repo });

    service.createEntry({ entryType: "term", termText: "Sonderwort" });
    service.createEntry({ entryType: "correction", wrongText: "alpha", correctText: "SollText" });
    service.createEntry({ entryType: "correction", wrongText: "rohrbau", correctText: "Rohbau" });

    const result = service.applyCorrectionsToText("ALPHA Sonderwort rohrbau rohrbau");
    assert.equal(result.text, "SollText Sonderwort Rohbau Rohbau");
    assert.equal(result.appliedCount, 3);
    assert.deepEqual(
      result.applied.map((entry) => `${entry.wrongText} -> ${entry.correctText}`),
      ["rohrbau -> Rohbau", "alpha -> SollText"]
    );
  });

  await run("Dictionary: Diktat nutzt Korrekturen und Undo betrifft nur den letzten Block", async () => {
    const fakeView = {
      inpTitle: {
        value: "",
        focus() {},
        _handlers: {},
        addEventListener(type, fn) {
          this._handlers[type] = fn;
        },
      },
      taLongtext: {
        value: "Vorher",
        focus() {},
        _handlers: {},
        addEventListener(type, fn) {
          this._handlers[type] = fn;
        },
      },
      _titleMax() {
        return 100;
      },
      _longMax() {
        return 500;
      },
      _clampStr(value, maxLen) {
        return String(value || "").slice(0, maxLen);
      },
      _normTitle(value) {
        return String(value || "").trim();
      },
      _normLong(value) {
        return String(value || "").replace(/\r\n/g, "\n").trimEnd();
      },
      _updateCharCounters() {
        this.counterUpdates = (this.counterUpdates || 0) + 1;
      },
      statuses: [],
      setDictationStatus(payload) {
        this.statuses.push(payload);
      },
      clearDictationStatus() {
        this.statuses.push({ cleared: true });
      },
    };

    const previousWindow = global.window;
    global.window = { bbmDb: {} };
    try {
      const controller = new DictationController({
        view: fakeView,
        ensureAudioAvailable: async () => true,
      });

      await controller._applyDictationTextToField("Rohbau", "shortText", {
        rawText: "rohrbau",
        dictionary: {
          summaryText: "Wörterbuch: 1 Korrekturen angewendet",
          appliedCount: 1,
          applied: [{ wrongText: "rohrbau", correctText: "Rohbau" }],
        },
      });
      assert.equal(fakeView.inpTitle.value, "Rohbau");
      assert.equal(fakeView.statuses.at(-1).summaryText, "Wörterbuch: 1 Korrekturen angewendet");
      assert.equal(fakeView.statuses.at(-1).canUndo, true);
      assert.equal(fakeView.statuses.at(-1).details[0].wrongText, "rohrbau");
      assert.equal(fakeView.statuses.at(-1).details[0].correctText, "Rohbau");
      assert.equal(controller.undoLastDictation(), true);
      assert.equal(fakeView.inpTitle.value, "");

      fakeView.taLongtext.value = "Vorher";
      await controller._applyDictationTextToField("Rohbau", "longText", {
        rawText: "rohrbau",
        dictionary: {
          summaryText: "Wörterbuch: 1 Korrekturen angewendet",
          appliedCount: 1,
          applied: [{ wrongText: "rohrbau", correctText: "Rohbau" }],
        },
      });
      assert.equal(fakeView.taLongtext.value, "Vorher\nRohbau");
      fakeView.taLongtext.value = "Vorher\nRohbau geändert";
      fakeView.taLongtext._handlers.input();
      assert.equal(fakeView.statuses.at(-1).canUndo, false);
      assert.equal(
        fakeView.statuses.at(-1).undoDisabledReason,
        "Rückgängig nicht mehr möglich, weil der diktierte Text bereits geändert wurde."
      );
      assert.equal(controller.undoLastDictation(), false);
      assert.equal(fakeView.taLongtext.value, "Vorher\nRohbau geändert");
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Dictionary: Editor-State entfernt den alten Prompt-Aufruf", () => {
    assert.equal(editBoxStateSource.includes("_tryShowPendingTermPrompt"), false);
  });

  await run("Dictionary: kein neues Modul im Modulkatalog", () => {
    assert.equal(moduleCatalogSource.includes("dictionary"), false);
    assert.equal(moduleCatalogSource.includes("audio"), false);
    assert.equal(moduleCatalogSource.includes("diktieren"), false);
  });
}

module.exports = { runDictionaryModuleTests };
