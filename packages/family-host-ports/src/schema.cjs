"use strict";
exports.create = function({projectKey="id"}={}) {
if (!["id","project_id"].includes(projectKey)) throw Error("Invalid project primary key");
function tableExists(dbConn, tableName) {
  const row = dbConn
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(tableName);
  return !!row;
}

function columnExists(dbConn, tableName, columnName) {
  const cols = dbConn.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function ensureFirmsAndPersonsSchema(dbConn) {
  // ------------------------------------------------------------
  // firms (GLOBAL)
  // ------------------------------------------------------------
  if (!tableExists(dbConn, "firms")) {
    dbConn.exec(`
      CREATE TABLE IF NOT EXISTS firms (
        id TEXT PRIMARY KEY,

        short TEXT,
        name TEXT NOT NULL,
        name2 TEXT,
        street TEXT,
        zip TEXT,
        city TEXT,
        phone TEXT,
        email TEXT,
        gewerk TEXT,
        notes TEXT,

        role_code INTEGER DEFAULT 60,
        project_role TEXT,

        use_project_participant INTEGER NOT NULL DEFAULT 0 CHECK (use_project_participant IN (0, 1)),
        use_customer INTEGER NOT NULL DEFAULT 0 CHECK (use_customer IN (0, 1)),

        is_trashed INTEGER NOT NULL DEFAULT 0,
        trashed_at INTEGER,
        removed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
    `);
  } else {
    const addFirmCol = (name, sqlType) => {
      if (!columnExists(dbConn, "firms", name)) {
        dbConn.exec(`ALTER TABLE firms ADD COLUMN ${name} ${sqlType};`);
      }
    };

    addFirmCol("short", "TEXT");
    addFirmCol("name", "TEXT"); // fail-safe
    addFirmCol("name2", "TEXT");
    addFirmCol("street", "TEXT");
    addFirmCol("zip", "TEXT");
    addFirmCol("city", "TEXT");
    addFirmCol("phone", "TEXT");
    addFirmCol("email", "TEXT");
    addFirmCol("gewerk", "TEXT");
    addFirmCol("notes", "TEXT");
    addFirmCol("role_code", "INTEGER DEFAULT 60");
    addFirmCol("is_trashed", "INTEGER NOT NULL DEFAULT 0");
    addFirmCol("trashed_at", "INTEGER");
    addFirmCol("removed_at", "TEXT");

    if (!columnExists(dbConn, "firms", "created_at")) {
      dbConn.exec(`
        ALTER TABLE firms
        ADD COLUMN created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
    if (!columnExists(dbConn, "firms", "updated_at")) {
      dbConn.exec(`
        ALTER TABLE firms
        ADD COLUMN updated_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
  }

  // ------------------------------------------------------------
  // persons (GLOBAL, je Firma)
  // WICHTIG: persons.name wird von Repo/Service aus first/last gebildet.
  // ------------------------------------------------------------
  if (!tableExists(dbConn, "persons")) {
    dbConn.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY,
        firm_id TEXT NOT NULL,

        name TEXT NOT NULL,

        first_name TEXT,
        last_name TEXT,

        funktion TEXT,
        rolle TEXT,
        notes TEXT,

        email TEXT,
        phone TEXT,

        is_trashed INTEGER NOT NULL DEFAULT 0,
        trashed_at INTEGER,
        removed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

        FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE RESTRICT
      );
    `);
  } else {
    const addPersonCol = (name, sqlType) => {
      if (!columnExists(dbConn, "persons", name)) {
        dbConn.exec(`ALTER TABLE persons ADD COLUMN ${name} ${sqlType};`);
      }
    };

    addPersonCol("firm_id", "TEXT");
    addPersonCol("name", "TEXT"); // NOT NULL kann per ALTER nicht nachgezogen werden
    addPersonCol("first_name", "TEXT");
    addPersonCol("last_name", "TEXT");
    addPersonCol("funktion", "TEXT");
    addPersonCol("rolle", "TEXT");
    addPersonCol("notes", "TEXT");
    addPersonCol("email", "TEXT");
    addPersonCol("phone", "TEXT");
    addPersonCol("is_trashed", "INTEGER NOT NULL DEFAULT 0");
    addPersonCol("trashed_at", "INTEGER");
    addPersonCol("removed_at", "TEXT");

    if (!columnExists(dbConn, "persons", "created_at")) {
      dbConn.exec(`
        ALTER TABLE persons
        ADD COLUMN created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
    if (!columnExists(dbConn, "persons", "updated_at")) {
      dbConn.exec(`
        ALTER TABLE persons
        ADD COLUMN updated_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
  }
}

function ensureProjectGlobalFirmsSchema(dbConn) {
  // ------------------------------------------------------------
  // project_global_firms (ZUORDNUNG: Projekt ↔ Global-Firma, Soft-Delete)
  // ------------------------------------------------------------
  if (!tableExists(dbConn, "project_global_firms")) {
    dbConn.exec(`
      CREATE TABLE IF NOT EXISTS project_global_firms (
        project_id TEXT NOT NULL,
        firm_id TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        project_role TEXT,

        removed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

        PRIMARY KEY (project_id, firm_id),
        FOREIGN KEY (project_id) REFERENCES projects(${projectKey}) ON DELETE CASCADE,
        FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE RESTRICT
      );
    `);
  } else {
    const addCol = (name, sqlType) => {
      if (!columnExists(dbConn, "project_global_firms", name)) {
        dbConn.exec(`ALTER TABLE project_global_firms ADD COLUMN ${name} ${sqlType};`);
      }
    };

    addCol("project_id", "TEXT");
    addCol("firm_id", "TEXT");
    if (!columnExists(dbConn, "project_global_firms", "is_active")) {
      dbConn.exec(`ALTER TABLE project_global_firms ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
    }
    addCol("project_role", "TEXT");
    addCol("removed_at", "TEXT");

    if (!columnExists(dbConn, "project_global_firms", "created_at")) {
      dbConn.exec(`
        ALTER TABLE project_global_firms
        ADD COLUMN created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
    if (!columnExists(dbConn, "project_global_firms", "updated_at")) {
      dbConn.exec(`
        ALTER TABLE project_global_firms
        ADD COLUMN updated_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
  }
}

function ensureProjectFirmsAndPersonsSchema(dbConn) {
  // ------------------------------------------------------------
  // project_firms (PROJEKT-LOKAL)
  // ------------------------------------------------------------
  if (!tableExists(dbConn, "project_firms")) {
    dbConn.exec(`
      CREATE TABLE IF NOT EXISTS project_firms (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,

        short TEXT,
        name TEXT NOT NULL,
        name2 TEXT,
        street TEXT,
        zip TEXT,
        city TEXT,
        phone TEXT,
        email TEXT,
        gewerk TEXT,
        notes TEXT,

        role_code INTEGER DEFAULT 60,
        project_role TEXT,

        use_project_participant INTEGER NOT NULL DEFAULT 0 CHECK (use_project_participant IN (0, 1)),
        use_customer INTEGER NOT NULL DEFAULT 0 CHECK (use_customer IN (0, 1)),

        removed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

        FOREIGN KEY (project_id) REFERENCES projects(${projectKey}) ON DELETE CASCADE
      );
    `);
  } else {
    const addCol = (name, sqlType) => {
      if (!columnExists(dbConn, "project_firms", name)) {
        dbConn.exec(`ALTER TABLE project_firms ADD COLUMN ${name} ${sqlType};`);
      }
    };

    addCol("project_id", "TEXT");
    if (!columnExists(dbConn, "project_firms", "is_active")) {
      dbConn.exec(`ALTER TABLE project_firms ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
    }
    addCol("short", "TEXT");
    addCol("name", "TEXT"); // fail-safe
    addCol("name2", "TEXT");
    addCol("street", "TEXT");
    addCol("zip", "TEXT");
    addCol("city", "TEXT");
    addCol("phone", "TEXT");
    addCol("email", "TEXT");
    addCol("gewerk", "TEXT");
    addCol("notes", "TEXT");
    addCol("role_code", "INTEGER DEFAULT 60");
    addCol("project_role", "TEXT");
    addCol("removed_at", "TEXT");

    if (!columnExists(dbConn, "project_firms", "created_at")) {
      dbConn.exec(`
        ALTER TABLE project_firms
        ADD COLUMN created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
    if (!columnExists(dbConn, "project_firms", "updated_at")) {
      dbConn.exec(`
        ALTER TABLE project_firms
        ADD COLUMN updated_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
  }

  // ------------------------------------------------------------
  // project_persons (PROJEKT-LOKAL, je Projektfirma)
  // FK muss auf project_firms(id) zeigen -> sonst "foreign key mismatch".
  // ------------------------------------------------------------
  if (!tableExists(dbConn, "project_persons")) {
    dbConn.exec(`
      CREATE TABLE IF NOT EXISTS project_persons (
        id TEXT PRIMARY KEY,
        project_firm_id TEXT NOT NULL,

        name TEXT NOT NULL,

        first_name TEXT,
        last_name TEXT,

        funktion TEXT,
        rolle TEXT,
        notes TEXT,

        email TEXT,
        phone TEXT,

        removed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

        FOREIGN KEY (project_firm_id) REFERENCES project_firms(id) ON DELETE RESTRICT
      );
    `);
  } else {
    const addCol = (name, sqlType) => {
      if (!columnExists(dbConn, "project_persons", name)) {
        dbConn.exec(`ALTER TABLE project_persons ADD COLUMN ${name} ${sqlType};`);
      }
    };

    addCol("project_firm_id", "TEXT");
    addCol("name", "TEXT");
    addCol("first_name", "TEXT");
    addCol("last_name", "TEXT");
    addCol("funktion", "TEXT");
    addCol("rolle", "TEXT");
    addCol("notes", "TEXT");
    addCol("email", "TEXT");
    addCol("phone", "TEXT");
    addCol("removed_at", "TEXT");

    if (!columnExists(dbConn, "project_persons", "created_at")) {
      dbConn.exec(`
        ALTER TABLE project_persons
        ADD COLUMN created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
    if (!columnExists(dbConn, "project_persons", "updated_at")) {
      dbConn.exec(`
        ALTER TABLE project_persons
        ADD COLUMN updated_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      `);
    }
  }
}

/**
 * Additive migration for the independent firm uses.
 *
 * Fresh databases use the neutral default (no use). Existing rows retain the
 * historic BBM behaviour and become project participants. The migration is
 * deliberately separate from both CREATE blocks so that both namespaces are
 * migrated in one SQLite transaction.
 */

return {ensureFirmsAndPersonsSchema,ensureProjectGlobalFirmsSchema,ensureProjectFirmsAndPersonsSchema};
};

exports.ensureProjectColumns=function(dbConn){
function tableExists(dbConn, tableName) {
  const row = dbConn
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(tableName);
  return !!row;
}

function columnExists(dbConn, tableName, columnName) {
  const cols = dbConn.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function ensureProjectsSchema(dbConn) {
  if (!tableExists(dbConn, "projects")) return;

  const addCol = (name, sqlType) => {
    if (!columnExists(dbConn, "projects", name)) {
      dbConn.exec(`ALTER TABLE projects ADD COLUMN ${name} ${sqlType};`);
    }
  };

  // ✅ Projektnummer
  addCol("project_number", "TEXT");

  addCol("short", "TEXT");
  addCol("street", "TEXT");
  addCol("zip", "TEXT");
  addCol("city", "TEXT");
  addCol("project_lead", "TEXT");
  addCol("project_lead_phone", "TEXT");
  addCol("start_date", "TEXT");
  addCol("geplanter_baubeginn", "TEXT");
  addCol("bauherr_firm_kind", "TEXT");
  addCol("bauherr_firm_id", "TEXT");
  addCol("end_date", "TEXT");
  addCol("notes", "TEXT");

  // Archive flag (ISO Timestamp oder NULL)
  addCol("archived_at", "TEXT");
}

ensureProjectsSchema(dbConn);
};
