const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const { ensureCustomerSchema } = require("./schema");

const DEFAULT_FILENAME = "customers.db";

function resolveCustomerDbPath({ databasePath, userDataPath, filename = DEFAULT_FILENAME } = {}) {
  if (databasePath) return path.resolve(String(databasePath));
  if (!userDataPath) throw new Error("databasePath or userDataPath required");
  return path.resolve(String(userDataPath), filename);
}

function openCustomerDatabase({
  databasePath,
  userDataPath,
  filename = DEFAULT_FILENAME,
  readonly = false,
  backupOnOpen = false,
} = {}) {
  const resolvedPath = resolveCustomerDbPath({ databasePath, userDataPath, filename });
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  if (backupOnOpen && !readonly && fs.existsSync(resolvedPath)) {
    fs.copyFileSync(resolvedPath, `${resolvedPath}.bak`);
  }

  const db = new Database(resolvedPath, readonly ? { readonly: true, fileMustExist: true } : undefined);
  db.pragma("foreign_keys = ON");
  if (readonly) {
    db.pragma("query_only = ON");
  } else {
    ensureCustomerSchema(db);
  }

  return {
    db,
    databasePath: resolvedPath,
    backupPath: `${resolvedPath}.bak`,
    close() {
      if (db.open) db.close();
    },
  };
}

module.exports = {
  DEFAULT_FILENAME,
  resolveCustomerDbPath,
  openCustomerDatabase,
};
