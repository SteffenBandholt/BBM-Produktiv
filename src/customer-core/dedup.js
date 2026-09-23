const DUPLICATE_STATUS = Object.freeze({
  NO_MATCH: "NO_MATCH",
  POSSIBLE_MATCH: "POSSIBLE_MATCH",
  ALREADY_LINKED: "ALREADY_LINKED",
});

function foldText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeCompanyName(value) {
  return foldText(value)
    .replace(/\b(gmbh|mbh|ag|kg|ohg|ug|haftungsbeschrankt|e k|ek|gbr)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en-US");
}

function normalizeVatId(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizePostalCode(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeStreet(value) {
  return foldText(value)
    .replace(/\bstrasse\b/g, "str")
    .replace(/\bstraße\b/g, "str")
    .replace(/\bstr\.?\b/g, "str")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCity(value) {
  return foldText(value);
}

function customerFingerprint(value = {}) {
  return Object.freeze({
    name1: normalizeCompanyName(value.name1),
    name2: normalizeCompanyName(value.name2),
    street: normalizeStreet(value.street),
    postalCode: normalizePostalCode(value.postalCode),
    city: normalizeCity(value.city),
    email: normalizeEmail(value.email),
    vatId: normalizeVatId(value.vatId),
  });
}

function addReason(reasons, code, weight, detail) {
  reasons.push(Object.freeze({ code, weight, detail }));
}

function evaluateCandidate(input, candidate) {
  const source = customerFingerprint(input);
  const target = customerFingerprint(candidate);
  const reasons = [];
  let score = 0;

  if (source.vatId && target.vatId && source.vatId === target.vatId) {
    score += 100;
    addReason(reasons, "VAT_ID_EXACT", 100, "USt-IdNr. stimmt überein");
  }

  const name1Exact = Boolean(source.name1 && target.name1 && source.name1 === target.name1);
  const name2Exact = Boolean(source.name2 && target.name2 && source.name2 === target.name2);
  if (name1Exact) {
    score += 45;
    addReason(reasons, "NAME1_EXACT", 45, "Firmenname stimmt überein");
  }
  if (name2Exact) {
    score += 10;
    addReason(reasons, "NAME2_EXACT", 10, "Name 2 stimmt überein");
  }

  const addressParts = [
    ["street", "Straße"],
    ["postalCode", "PLZ"],
    ["city", "Ort"],
  ];
  let matchedAddressParts = 0;
  let comparableAddressParts = 0;
  for (const [field] of addressParts) {
    if (source[field] && target[field]) {
      comparableAddressParts += 1;
      if (source[field] === target[field]) matchedAddressParts += 1;
    }
  }
  if (comparableAddressParts >= 2 && matchedAddressParts === comparableAddressParts) {
    const weight = comparableAddressParts === 3 ? 35 : 25;
    score += weight;
    addReason(
      reasons,
      comparableAddressParts === 3 ? "ADDRESS_EXACT" : "ADDRESS_PARTIAL_EXACT",
      weight,
      comparableAddressParts === 3 ? "Anschrift stimmt überein" : "Mindestens zwei Anschriftsmerkmale stimmen überein"
    );
  }

  if (source.email && target.email && source.email === target.email) {
    score += 35;
    addReason(reasons, "EMAIL_EXACT", 35, "E-Mail-Adresse stimmt überein");
  }

  const isPossible =
    reasons.some((reason) => reason.code === "VAT_ID_EXACT") ||
    score >= 60 ||
    (name1Exact && reasons.some((reason) => reason.code === "EMAIL_EXACT" || reason.code.startsWith("ADDRESS_")));

  return Object.freeze({
    customerId: candidate.customerId,
    customerNumber: candidate.customerNumber,
    name1: candidate.name1,
    name2: candidate.name2,
    status: candidate.status,
    score,
    reasons: Object.freeze(reasons),
    possibleMatch: isPossible,
  });
}

function findDuplicateCandidates(input, customers = []) {
  return customers
    .map((candidate) => evaluateCandidate(input, candidate))
    .filter((result) => result.possibleMatch)
    .sort((a, b) =>
      b.score - a.score ||
      String(a.customerNumber || "").localeCompare(String(b.customerNumber || ""), "de")
    );
}

function evaluateDuplicateState({ linkedCustomer = null, input, customers = [] } = {}) {
  if (linkedCustomer) {
    return Object.freeze({
      status: DUPLICATE_STATUS.ALREADY_LINKED,
      linkedCustomer,
      candidates: Object.freeze([]),
    });
  }
  const candidates = findDuplicateCandidates(input || {}, customers);
  return Object.freeze({
    status: candidates.length ? DUPLICATE_STATUS.POSSIBLE_MATCH : DUPLICATE_STATUS.NO_MATCH,
    linkedCustomer: null,
    candidates: Object.freeze(candidates),
  });
}

module.exports = {
  DUPLICATE_STATUS,
  foldText,
  normalizeCompanyName,
  normalizeEmail,
  normalizeVatId,
  normalizePostalCode,
  normalizeStreet,
  normalizeCity,
  customerFingerprint,
  evaluateCandidate,
  findDuplicateCandidates,
  evaluateDuplicateState,
};
