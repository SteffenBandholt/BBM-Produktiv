const { initDatabase } = require("./database");

const PROFILE_FIELDS = Object.freeze(["name1", "name2", "street", "zip", "city", "country", "phone", "email", "website", "logo_path", "tax_number", "vat_id", "iban", "bic", "bank_name", "commercial_register", "register_number", "managing_director", "legal_notice"]);

function _normText(v) {
  return String(v ?? "").trim();
}

function getUserProfile() {
  const db = initDatabase();
  const row = db
    .prepare(
      `
      SELECT id, ${PROFILE_FIELDS.join(", ")}
      FROM user_profile
      WHERE id = 1
    `
    )
    .get();

  return row || null;
}

function upsertUserProfile(input = {}) {
  const db = initDatabase();
  const now = new Date().toISOString();
  const current = db.prepare(`SELECT ${PROFILE_FIELDS.join(", ")} FROM user_profile WHERE id = 1`).get() || {};
  const values = Object.fromEntries(PROFILE_FIELDS.map((field) => [field, input[field] === undefined ? _normText(current[field]) : _normText(input[field])]));

  db.prepare(
    `
    INSERT INTO user_profile (
      id,
      ${PROFILE_FIELDS.join(",\n      ")},
      created_at,
      updated_at
    )
    VALUES (1, ${PROFILE_FIELDS.map((field) => `@${field}`).join(", ")}, @now, @now)
    ON CONFLICT(id) DO UPDATE SET
      ${PROFILE_FIELDS.map((field) => `${field} = excluded.${field}`).join(",\n      ")},
      updated_at = excluded.updated_at
  `
  ).run({
    ...values,
    now,
  });

  return getUserProfile();
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
};
