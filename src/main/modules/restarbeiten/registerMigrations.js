function registerMigrations({ db, migrations } = {}) {
  return migrations.ensureRestarbeitenSchema(db);
}

module.exports = Object.freeze({ registerMigrations });
