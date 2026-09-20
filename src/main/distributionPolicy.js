"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { app } = require("electron");
const { readPackagedBuildMetadata } = require("./buildIdentity");

const PROTOKOLL_DISTRIBUTION_ID = "protokoll-acceptance";
const PROTOKOLL_APP_ID = "de.bbm.baubesprechungsmanager.protokoll.abnahme";
const PROTOKOLL_USER_DATA_DIRECTORY = "BBM-Protokoll-Abnahme";
const CUSTOMER_DISTRIBUTION_ID = "customer";
const CUSTOMER_PROFILE_ID_PATTERN = /^c-[a-f0-9]{24}$/;
const DISABLED_EDITOR_RESULT = Object.freeze({ ok: false, code: "UI_EDITOR_DISABLED_IN_DISTRIBUTION", message: "Der UI-/PDF-Struktureditor ist in dieser Ausgabe nicht verfügbar." });
const LAYOUT_FILES = Object.freeze([
  "module-protokoll/standard.layout-profile.json",
  "module-protokoll/pdf-layouts/bbm-produktiv.protocol.pdf-standard.pdf-layout.json",
  "render-defaults.json",
]);
const PRINT_LAYOUT_KEYS = Object.freeze(["print.v2.pagePadTopMm", "print.v2.pagePadLeftMm", "print.v2.pagePadRightMm", "print.v2.pagePadBottomMm", "print.v2.footerReserveMm"]);
const TABLE_LAYOUT_IDENTITIES = Object.freeze(["protokoll_tops/portrait", "protokoll_tops/landscape", "protokoll_participants/portrait", "print.todo.todoTable/portrait"]);

function resolveDistributionPolicy({ electronApp = app, metadata } = {}) {
  const packaged = electronApp?.isPackaged === true;
  const packageMetadata = metadata || readPackagedBuildMetadata({ electronApp });
  const protokoll = packaged && packageMetadata.distributionId === PROTOKOLL_DISTRIBUTION_ID;
  const customer = packaged && packageMetadata.distributionId === CUSTOMER_DISTRIBUTION_ID;
  const customerProfileId = String(packageMetadata.customerProfileId || "").trim().toLowerCase();
  if (customer && !CUSTOMER_PROFILE_ID_PATTERN.test(customerProfileId)) {
    throw new Error("Invalid customer distribution profile metadata");
  }
  return Object.freeze({
    id: protokoll ? PROTOKOLL_DISTRIBUTION_ID : customer ? CUSTOMER_DISTRIBUTION_ID : "full",
    moduleIds: protokoll ? Object.freeze(["protokoll"]) : null,
    uiEditorEnabled: !protokoll && !customer,
    allowLegacyImport: !protokoll && !customer,
    appId: protokoll
      ? PROTOKOLL_APP_ID
      : customer
        ? `de.bbm.baubesprechungsmanager.customer.${customerProfileId}`
        : "de.bbm.baubesprechungsmanager",
    userDataDirectory: protokoll
      ? PROTOKOLL_USER_DATA_DIRECTORY
      : customer
        ? path.join("BBM-Kunden", customerProfileId)
        : null,
    customerProfileId: customer ? customerProfileId : null,
  });
}

function configureDistributionProfile({ electronApp = app, policy = resolveDistributionPolicy({ electronApp }) } = {}) {
  if (!policy.userDataDirectory) return null;
  const userDataPath = path.join(electronApp.getPath("appData"), policy.userDataDirectory);
  const sessionDataPath = path.join(userDataPath, "session-data");
  fs.mkdirSync(sessionDataPath, { recursive: true });
  electronApp.setPath("userData", userDataPath);
  electronApp.setPath("sessionData", sessionDataPath);
  return { userDataPath, sessionDataPath };
}

// Ship only reviewed geometry/layout definitions. Never import an existing BBM
// database, license, settings, logo, profile archive or developer preference.
function readDeliveryLayouts(resourcesPath) {
  const sourceRoot = path.join(resourcesPath, "protokoll-layouts");
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "manifest.json"), "utf8"));
  if (manifest.schemaVersion !== 1 || manifest.applicationId !== "bbm-produktiv" ||
      !Array.isArray(manifest.files) || manifest.files.length !== LAYOUT_FILES.length ||
      new Set(manifest.files.map((entry) => entry.path)).size !== LAYOUT_FILES.length ||
      manifest.files.some((entry) => !LAYOUT_FILES.includes(entry.path))) {
    throw new Error("Invalid Protokoll delivery layout manifest");
  }
  // Validate every resource before writing any file; keep future user data.
  return manifest.files.map((entry) => {
    const bytes = fs.readFileSync(path.join(sourceRoot, entry.path));
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (hash !== entry.sha256) throw new Error(`Invalid delivery layout hash: ${entry.path}`);
    JSON.parse(bytes.toString("utf8"));
    return { ...entry, bytes };
  });
}

function seedDistributionLayouts({ electronApp = app, policy = resolveDistributionPolicy({ electronApp }), resourcesPath = process.resourcesPath } = {}) {
  if (policy.id !== PROTOKOLL_DISTRIBUTION_ID) return { seeded: [] };
  const validated = readDeliveryLayouts(resourcesPath);
  const seeded = [];
  for (const entry of validated.filter((entry) => entry.path.startsWith("module-protokoll/"))) {
    const destination = path.join(electronApp.getPath("userData"), "ui-editor", "profiles", entry.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    try {
      fs.writeFileSync(destination, entry.bytes, { flag: "wx" });
      seeded.push(entry.path);
    } catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  return { seeded };
}

async function seedDistributionRenderDefaults({ electronApp = app, policy = resolveDistributionPolicy({ electronApp }), resourcesPath = process.resourcesPath, tableLayoutsRepo, database } = {}) {
  if (policy.id !== PROTOKOLL_DISTRIBUTION_ID) return { seededTables: [] };
  const defaults = JSON.parse(readDeliveryLayouts(resourcesPath).find((entry) => entry.path === "render-defaults.json").bytes.toString("utf8"));
  if (defaults.schemaVersion !== 1 || !Array.isArray(defaults.tableLayouts) || defaults.tableLayouts.length !== TABLE_LAYOUT_IDENTITIES.length ||
      new Set(defaults.tableLayouts.map((row) => `${row.tableKey}/${row.orientation}`)).size !== TABLE_LAYOUT_IDENTITIES.length ||
      defaults.tableLayouts.some((row) => row.moduleId !== "protokoll" || Object.keys(row).some((key) => !["moduleId", "tableKey", "orientation", "layout"].includes(key)) || !TABLE_LAYOUT_IDENTITIES.includes(`${row.tableKey}/${row.orientation}`)) ||
      !defaults.printLayoutSettings || Object.keys(defaults.printLayoutSettings).length !== PRINT_LAYOUT_KEYS.length ||
      Object.entries(defaults.printLayoutSettings).some(([key, value]) => !PRINT_LAYOUT_KEYS.includes(key) || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 40)) {
    throw new Error("Invalid Protokoll delivery render defaults");
  }
  const tables = tableLayoutsRepo || require("./db/tableLayoutsRepo");
  const db = database || require("./db/database").initDatabase();
  const seededTables = [];
  for (const row of defaults.tableLayouts) {
    const identity = { tableKey: row.tableKey, moduleId: "protokoll", orientation: row.orientation, scopeType: "global", scopeId: "" };
    if (!tables.getStoredTableLayout(identity)) {
      await tables.saveTableLayout({ ...identity, layout: row.layout });
      seededTables.push(`${row.tableKey}/${row.orientation}`);
    }
  }
  const insert = db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)");
  db.transaction(() => { for (const [key, value] of Object.entries(defaults.printLayoutSettings)) insert.run(key, String(value)); })();
  return { seededTables };
}

module.exports = Object.freeze({ PROTOKOLL_DISTRIBUTION_ID, PROTOKOLL_APP_ID, PROTOKOLL_USER_DATA_DIRECTORY, CUSTOMER_DISTRIBUTION_ID, CUSTOMER_PROFILE_ID_PATTERN, DISABLED_EDITOR_RESULT, LAYOUT_FILES, PRINT_LAYOUT_KEYS, TABLE_LAYOUT_IDENTITIES, resolveDistributionPolicy, configureDistributionProfile, seedDistributionLayouts, seedDistributionRenderDefaults, readDeliveryLayouts });
