const { ensureSigekoSchema } = require("../../db/sigekoSchema");

function registerMigrations({ db } = {}) {
  ensureSigekoSchema(db);
}

module.exports = Object.freeze({ registerMigrations });
