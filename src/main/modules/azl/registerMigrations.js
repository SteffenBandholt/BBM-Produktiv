const { ensureAzlSchema } = require("bbm-azl/host/bbmProduktiv.cjs");

function registerMigrations({ db } = {}) {
  ensureAzlSchema(db);
}

module.exports = Object.freeze({ registerMigrations });
