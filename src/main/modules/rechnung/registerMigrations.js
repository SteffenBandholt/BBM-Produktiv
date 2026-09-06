function registerMigrations({ db, migrations } = {}) {
  return migrations.ensureInvoiceSchema(db);
}

module.exports = Object.freeze({ registerMigrations });
