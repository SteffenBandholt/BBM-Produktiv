const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function tableNames(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
}

function withDatabase(callback) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-paket5-"));
  const dbPath = path.join(dir, "app.db");
  const db = new Database(dbPath);
  try {
    db.pragma("foreign_keys = ON");
    return callback(db, dbPath);
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function runModuleMigrationRegistrationTests(run) {
  await run("Paket 5: Core-Schema funktioniert ohne Protokolltabellen", () => withDatabase((db, dbPath) => {
    const { ensureSchema, isDbLikelyEmpty } = require(path.join(process.cwd(), "src/main/db/database.js"));
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    ensureSchema(db, { moduleIds: [] });
    const tables = tableNames(db);
    assert.ok(tables.includes("projects"));
    assert.ok(tables.includes("firms"));
    assert.equal(tables.includes("meetings"), false);
    assert.equal(tables.includes("tops"), false);
    assert.equal(tables.includes("meeting_tops"), false);
    assert.equal(tables.includes("project_candidates"), true);
    assert.equal(tables.includes("meeting_participants"), false);
    assert.equal(tables.includes("restarbeiten_items"), false);
    assert.equal(tables.includes("invoices"), false);
    db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("core-1", "Core ohne Protokoll");
    assert.equal(isDbLikelyEmpty(dbPath), false);
  }));

  await run("Paket 5: nur ausgewaehlte Fachmigrationen laufen", () => withDatabase((db) => {
    const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    const migrated = ensureSchema(db, { moduleIds: ["restarbeiten"] });
    const tables = tableNames(db);
    assert.deepEqual(migrated, ["restarbeiten"]);
    assert.ok(tables.includes("restarbeiten_items"));
    assert.equal(tables.includes("meetings"), false);
    assert.equal(tables.includes("invoices"), false);
  }));

  await run("Paket 5: alle installierten Module migrieren gemeinsam in derselben SQLite-Datei", () => withDatabase((db) => {
    const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    const migrated = ensureSchema(db, { moduleIds: ["protokoll", "restarbeiten", "rechnung"] });
    const tables = tableNames(db);
    assert.deepEqual(migrated, ["protokoll", "restarbeiten", "rechnung"]);
    assert.ok(tables.includes("meetings"));
    assert.ok(tables.includes("tops"));
    assert.ok(tables.includes("project_candidates"));
    assert.ok(tables.includes("meeting_participants"));
    assert.ok(tables.includes("restarbeiten_items"));
    assert.ok(tables.includes("invoices"));
  }));

  await run("Paket 5: Bestands-DB wird idempotent und ohne Datenverlust migriert", () => withDatabase((db) => {
    const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
    db.exec(`
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE meetings (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, meeting_index INTEGER NOT NULL, title TEXT);
      INSERT INTO projects (id, name) VALUES ('p-1', 'Bestand');
      INSERT INTO meetings (id, project_id, meeting_index, title) VALUES ('m-1', 'p-1', 1, 'Jour fixe');
    `);
    ensureSchema(db, { moduleIds: ["protokoll", "restarbeiten", "rechnung"] });
    ensureSchema(db, { moduleIds: ["protokoll", "restarbeiten", "rechnung"] });
    assert.equal(db.prepare("SELECT name FROM projects WHERE id = 'p-1'").get().name, "Bestand");
    assert.equal(db.prepare("SELECT title FROM meetings WHERE id = 'm-1'").get().title, "Jour fixe");
    const meeting = db.prepare("SELECT created_at, updated_at FROM meetings WHERE id = 'm-1'").get();
    assert.ok(meeting.created_at);
    assert.ok(meeting.updated_at);
    assert.ok(tableNames(db).includes("invoices"));
  }));

  await run("Paket 5: Migrationsregistrare folgen dem Deskriptor ohne Fachmodul-Sonderliste", () => {
    const catalog = require(path.join(process.cwd(), "src/main/moduleMigrationRegistrars.js"));
    const registry = JSON.parse(read("src/main/module-registry.json"));
    for (const [moduleId, definition] of Object.entries(registry.modules)) {
      assert.equal(typeof catalog[definition.migrationRegistrar], "function");
      assert.match(read(`src/main/modules/${moduleId}/registerMigrations.js`), /function registerMigrations/);
    }
    const source = read("src/main/moduleMigrationRegistrars.js");
    assert.match(source, /getModuleIds\(\)\.map/);
    assert.equal(source.includes("protokoll:"), false);
    assert.equal(source.includes("restarbeiten:"), false);
    assert.equal(source.includes("rechnung:"), false);
  });

  await run("Paket 5: Main konfiguriert Migrationen aus demselben Lizenzstatus wie Fach-IPCs", () => {
    const main = read("src/main/main.js");
    assert.match(main, /const licenseStatus = checkLicense\(\)/);
    assert.match(main, /configureDatabaseMigrations\(licenseStatus, \{ allowLegacyImport: !uiEditorAcceptanceProfile.enabled \}\)/);
    assert.match(main, /registerActiveModuleIpcs\(\{\s*licenseStatus,/s);
  });

  await run("Paket 5: DB-Leerheitspruefung setzt keine Protokolltabellen voraus", () => {
    const database = read("src/main/db/database.js");
    const start = database.indexOf("function isDbLikelyEmpty");
    const end = database.indexOf("function ensureLegacyImportCopy", start);
    const source = database.slice(start, end);
    assert.match(source, /coreTables = \["projects", "firms"\]/);
    assert.equal(source.includes('"meetings"'), false);
    assert.equal(source.includes('"tops"'), false);
  });
}

module.exports = { runModuleMigrationRegistrationTests };
