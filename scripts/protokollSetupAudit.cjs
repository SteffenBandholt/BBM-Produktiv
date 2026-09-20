"use strict";
// Read-only preflight. Runs with the repository's Electron Node-mode ABI.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const os = require("node:os");
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "output", "protokoll-setup-2026-09-15");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function importedDlls(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.toString("ascii", 0, 2) !== "MZ") throw new Error(`Not PE: ${filePath}`);
  const pe = data.readUInt32LE(0x3c);
  if (data.toString("ascii", pe, pe + 4) !== "PE\0\0") throw new Error(`Invalid PE: ${filePath}`);
  const count = data.readUInt16LE(pe + 6);
  const optionalSize = data.readUInt16LE(pe + 20);
  const optional = pe + 24;
  const is64 = data.readUInt16LE(optional) === 0x20b;
  const importRva = data.readUInt32LE(optional + (is64 ? 112 : 96) + 8);
  const sections = Array.from({ length: count }, (_, i) => {
    const at = optional + optionalSize + i * 40;
    return { size: Math.max(data.readUInt32LE(at + 8), data.readUInt32LE(at + 16)), rva: data.readUInt32LE(at + 12), raw: data.readUInt32LE(at + 20) };
  });
  const offset = (rva) => {
    const section = sections.find((entry) => rva >= entry.rva && rva < entry.rva + entry.size);
    if (!section) throw new Error(`Invalid RVA in ${filePath}`);
    return section.raw + rva - section.rva;
  };
  const names = [];
  if (importRva) {
    for (let at = offset(importRva); data.readUInt32LE(at + 12); at += 20) {
      const start = offset(data.readUInt32LE(at + 12));
      names.push(data.toString("ascii", start, data.indexOf(0, start)));
    }
  }
  return { machine: data.readUInt16LE(pe + 4).toString(16), is64, dlls: names };
}

async function audit() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const { importEsmFromFile } = require("./tests/_esmLoader.cjs");
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const kit = require("ui-editor-kit");
  const profileRoot = path.join(process.env.APPDATA, "baubesprechungs-manager/ui-editor/profiles/module-protokoll");
  const uiPath = path.join(profileRoot, "standard.layout-profile.json");
  const pdfPath = path.join(profileRoot, "pdf-layouts/bbm-produktiv.protocol.pdf-standard.pdf-layout.json");
  const scopes = registry.listM80RegistryScopes().filter((scope) => scope.scopeId.startsWith("protokoll."));
  const uiDocument = fs.existsSync(uiPath) ? JSON.parse(fs.readFileSync(uiPath, "utf8")) : null;
  const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-protokoll-layout-audit-"));
  if (uiDocument) fs.copyFileSync(uiPath, path.join(scratchRoot, "standard.layout-profile.json"));
  const ui = uiDocument ? {
    path: uiPath, sha256: hash(fs.readFileSync(uiPath)), keys: Object.keys(uiDocument),
    scopes: uiDocument.scopes.map((saved) => {
      const current = scopes.find((scope) => scope.scopeId === saved.scopeId);
      return { scopeId: saved.scopeId, savedElements: saved.layoutState?.elements?.length, currentElements: current?.elements?.length,
        savedFingerprint: saved.registryFingerprint, currentFingerprint: current && kit.createUiScopeFingerprint(current),
        compatible: Boolean(current && saved.registryFingerprint === kit.createUiScopeFingerprint(current)) };
    }),
    loadResult: kit.loadTargetStartupLayout({ profileRoot: scratchRoot, applicationId: "bbm-produktiv", activeScopes: scopes.map((scope) => scope.scopeId), registryScopes: scopes }),
  } : { found: false };
  // Only report status; never dump complete local layout documents or user data.
  if (ui.loadResult) ui.loadResult = Object.fromEntries(Object.entries(ui.loadResult).filter(([key]) => !["scopes", "document", "layoutState"].includes(key)));
  const pdfModule = require("../src/main/ui-editor/bbmPdfAdapter.cjs");
  const pdfAdapter = pdfModule.createBbmPdfAdapter();
  const pdfRegistry = pdfAdapter.getPdfRegistry();
  const pdfDocument = fs.existsSync(pdfPath) ? JSON.parse(fs.readFileSync(pdfPath, "utf8")) : null;
  const pdf = pdfDocument ? { path: pdfPath, sha256: hash(fs.readFileSync(pdfPath)), keys: Object.keys(pdfDocument),
    savedElements: pdfDocument.layoutState?.elements?.length, currentElements: pdfRegistry.elements?.length,
    savedFingerprint: pdfDocument.registryFingerprint, currentFingerprint: pdfModule.PERSISTED_REGISTRY_FINGERPRINT,
    compatible: pdfDocument.registryFingerprint === pdfModule.PERSISTED_REGISTRY_FINGERPRINT } : { found: false };
  if (pdfDocument) {
    const scratchPdfDir = path.join(scratchRoot, "pdf-layouts");
    fs.mkdirSync(scratchPdfDir, { recursive: true });
    fs.copyFileSync(pdfPath, path.join(scratchPdfDir, path.basename(pdfPath)));
    try {
      pdfAdapter.configureProfileRoot(scratchRoot);
      const state = pdfAdapter.readPersistedPdfLayoutState();
      pdf.validated = true;
      pdf.validatedElements = state.elements.length;
      pdf.normalizedSha256 = hash(fs.readFileSync(path.join(scratchPdfDir, path.basename(pdfPath))));
    } catch (error) { pdf.validated = false; pdf.validationCode = error.code; pdf.validationMessage = error.message; }
  }
  const whisperDir = path.join(ROOT, "dev/tools/whisper.cpp/Release");
  const runtimeFiles = fs.readdirSync(whisperDir).filter((name) => /^(whisper-cli|whisper-server)\.exe$|\.dll$/i.test(name))
    .map((name) => path.join(whisperDir, name));
  runtimeFiles.push(path.join(ROOT, "dev/tools/ffmpeg/ffmpeg.exe"));
  const native = runtimeFiles.map((filePath) => ({ path: filePath, bytes: fs.statSync(filePath).size, sha256: hash(fs.readFileSync(filePath)), ...importedDlls(filePath) }));
  const modelPath = path.join(ROOT, "dev/models/ggml-small.bin");
  const localDbPath = path.join(process.env.APPDATA, "baubesprechungs-manager/app.db");
  let tableLayouts = [];
  let printLayoutSettings = {};
  if (fs.existsSync(localDbPath)) {
    const scratchDbPath = path.join(scratchRoot, "audit.db");
    fs.copyFileSync(localDbPath, scratchDbPath);
    if (fs.existsSync(localDbPath + "-wal")) fs.copyFileSync(localDbPath + "-wal", scratchDbPath + "-wal");
    const db = new (require("better-sqlite3"))(scratchDbPath, { readonly: true });
    try {
      if (db.prepare("SELECT name FROM sqlite_master WHERE name = 'table_layouts'").get()) {
        tableLayouts = db.prepare("SELECT table_key, module_id, orientation, scope_type, layout_json FROM table_layouts WHERE module_id = 'protokoll'").all().map((row) => ({ tableKey: row.table_key, orientation: row.orientation, scopeType: row.scope_type, bytes: Buffer.byteLength(row.layout_json || ""), sha256: hash(row.layout_json || "") }));
      }
      if (db.prepare("SELECT name FROM sqlite_master WHERE name = 'app_settings'").get()) {
        printLayoutSettings = Object.fromEntries(db.prepare("SELECT key, value FROM app_settings WHERE key IN ('print.v2.pagePadTopMm','print.v2.pagePadLeftMm','print.v2.pagePadRightMm','print.v2.pagePadBottomMm','print.v2.footerReserveMm')").all().map((row) => [row.key, row.value]));
      }
    } finally { db.close(); }
  }
  const licensePath = path.join(process.env.APPDATA, "baubesprechungs-manager/license.json");
  const licenseData = fs.existsSync(licensePath) ? JSON.parse(fs.readFileSync(licensePath, "utf8")) : null;
  const license = licenseData ? require("../src/main/licensing/licenseVerifier.js").verifyLicense(licenseData) : { valid: false, reason: "NO_LICENSE" };
  const status = {
    git: { branch: cp.execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim(), head: cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() },
    registryVersion: registry.BBM_M80_REGISTRY_VERSION, ui, pdf, native, tableLayouts, printLayoutSettings,
    model: { path: modelPath, bytes: fs.statSync(modelPath).size, sha256: hash(fs.readFileSync(modelPath)) },
    existingLicense: { path: licensePath, valid: license.valid, reason: license.reason, modules: license.license?.modules, features: license.license?.features },
    runtimePackage: { version: JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/ui-editor-kit/package.json"), "utf8")).version },
  };
  fs.writeFileSync(path.join(OUTPUT, "preflight.json"), JSON.stringify(status, null, 2) + "\n");
  fs.rmSync(scratchRoot, { recursive: true, force: true });
  console.log(JSON.stringify({ ui: { scopes: ui.scopes, loadResult: ui.loadResult }, pdf, native: native.map(({ path: filePath, machine, dlls }) => ({ file: path.basename(filePath), machine, dlls })), modelBytes: status.model.bytes, existingLicense: status.existingLicense }, null, 2));
}

if (require.main === module) {
  if (process.versions.electron) audit().catch((error) => { console.error(error); process.exitCode = 1; });
  else process.exitCode = cp.spawnSync(require("electron"), [__filename], { cwd: ROOT, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: "inherit", windowsHide: true }).status ?? 1;
}
module.exports = { importedDlls };
