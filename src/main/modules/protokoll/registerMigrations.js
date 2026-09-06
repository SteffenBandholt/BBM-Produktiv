function registerMigrations({ db, migrations } = {}) {
  return migrations.ensureProtokollSchema(db);
}

module.exports = Object.freeze({ registerMigrations });
