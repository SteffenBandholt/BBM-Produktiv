"use strict";

const { TextDecoder } = require("node:util");

function decodeCsvBuffer(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return bytes.subarray(3).toString("utf8");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (_error) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const FIELD_ALIASES = Object.freeze({
  short: ["kurzname", "kurz", "kurzbez", "kurzbezeichnung", "kuerzel", "kurzel"],
  name1: ["firma", "firmenname", "firma zeile 1", "firmaz1", "name", "name1", "bezeichnung"],
  name2: ["firma zeile 2", "firmaz2", "name2", "zusatz", "firmenzusatz"],
  street: ["strasse", "straße", "straße/postfach", "strasse/postfach", "anschrift", "adresse"],
  zip: ["plz", "postleitzahl"],
  city: ["ort", "stadt"],
  phone: ["telefon", "tel", "phone"],
  email: ["email", "e-mail", "mail"],
  gewerk: ["branche", "gewerk", "leistungsbereich", "fachlos", "los", "funktion"],
});

const NORMALIZED_ALIASES = Object.freeze(
  Object.fromEntries(
    Object.entries(FIELD_ALIASES).map(([key, aliases]) => [
      key,
      aliases.map(normalizeHeader),
    ])
  )
);

function countUnquoted(line, delimiter) {
  let quoted = false;
  let count = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (!quoted && ch === delimiter) {
      count += 1;
    }
  }
  return count;
}

function detectDelimiter(text) {
  const firstLine = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).find((line) => line.trim()) || "";
  return [";", "\t", ","]
    .map((delimiter) => ({ delimiter, count: countUnquoted(firstLine, delimiter) }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ";";
}

function parseCsv(text, delimiter = detectDelimiter(text)) {
  const input = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = !quoted;
      continue;
    }
    if (!quoted && ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
}

function inferMapping(headers) {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(
    Object.entries(NORMALIZED_ALIASES).map(([field, aliases]) => [
      field,
      normalized.findIndex((header) => aliases.includes(header)),
    ])
  );
}

function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function findExisting(source, existingFirms = []) {
  const email = norm(source.email);
  if (email) {
    const byEmail = existingFirms.find((firm) => norm(firm?.email) === email);
    if (byEmail) return byEmail;
  }
  const name = norm(source.name1);
  const zip = norm(source.zip);
  const city = norm(source.city);
  return existingFirms.find((firm) => {
    if (norm(firm?.name) !== name) return false;
    if (zip && norm(firm?.zip) && norm(firm?.zip) !== zip) return false;
    if (city && norm(firm?.city) && norm(firm?.city) !== city) return false;
    return true;
  }) || null;
}

function buildRawData(headers, row) {
  return headers
    .map((header, index) => {
      const value = String(row[index] || "").trim();
      return value ? `${header}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function parseFirmCsvText(csvText, { existingFirms = [] } = {}) {
  const delimiter = detectDelimiter(csvText);
  const rows = parseCsv(csvText, delimiter);
  if (rows.length < 2) {
    throw new Error("CSV enthält keine importierbaren Datenzeilen.");
  }

  const headers = rows[0].map((value) => String(value || "").trim());
  const mapping = inferMapping(headers);
  if (!Number.isInteger(mapping.name1) || mapping.name1 < 0) {
    throw new Error(
      "Firmenspalte konnte nicht erkannt werden. Unterstützt werden u. a. 'Firma', 'Firmenname' und 'Firma Zeile 1'."
    );
  }

  const read = (row, field) => {
    const index = mapping[field];
    return Number.isInteger(index) && index >= 0 ? String(row[index] || "").trim() : "";
  };

  let ignoredWithoutCompany = 0;
  const items = [];

  rows.slice(1).forEach((row, index) => {
    const item = {
      row_id: `csv-${index + 2}`,
      take: 0,
      short: read(row, "short"),
      name1: read(row, "name1"),
      name2: read(row, "name2"),
      street: read(row, "street"),
      zip: read(row, "zip"),
      city: read(row, "city"),
      phone: read(row, "phone"),
      email: read(row, "email"),
      gewerk: read(row, "gewerk"),
      notes: "",
      address_raw: buildRawData(headers, row),
    };

    if (!item.name1) {
      ignoredWithoutCompany += 1;
      return;
    }

    const existing = findExisting(item, existingFirms);
    item.status_base = existing ? "vorhanden" : "neu";
    item.existing_firm_id = existing?.id || "";
    item.existing_firm = existing || null;
    items.push(item);
  });

  return {
    rowsCount: Math.max(0, rows.length - 1),
    ignoredWithoutCompany,
    items,
    headers,
    mapping,
    delimiter,
  };
}

module.exports = {
  FIELD_ALIASES,
  decodeCsvBuffer,
  detectDelimiter,
  parseCsv,
  inferMapping,
  parseFirmCsvText,
};
