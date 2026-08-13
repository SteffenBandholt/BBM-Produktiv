"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const {
  ELECTRON_EDITOR_ERROR_CODES,
  ELECTRON_TARGET_ADAPTER_VERSION,
  ElectronEditorError,
  LOCAL_TARGET_MAX_MESSAGE_BYTES,
  LOCAL_TARGET_PROTOCOL_VERSION,
  NamedPipeTargetClient,
  compareRegistrySnapshots,
  createElectronTargetContract,
  createRegistryFingerprint,
  createSessionIdentifiers,
  loadTargetStartupLayout,
  validateRegistrationSnapshot,
} = require("ui-editor-kit");

const APPLICATION_ID = "bbm-produktiv";
const DISPLAY_NAME = "BBM";
const ACTIVE_SCOPES = Object.freeze(["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]);
const NATIVE_REQUEST_ACTIONS = new Set(["getRegistry", "getLayoutState", "submitChange", "acknowledgeLayoutSave", "prepareEditorClose"]);
const NATIVE_PDF_REQUEST_ACTIONS = new Set([
  "getPdfRegistry",
  "getCurrentPdfLayoutState",
  "submitPdfChangeRequest",
  "regeneratePdfPreview",
  "getPreviewMetadata",
]);
const NATIVE_EVENT_ACTIONS = new Set(["beginTargetSelection", "cancelTargetSelection", "highlightElement", "clearGeometryPreview", "activateTarget", "editorClosed"]);
const REGISTRY_EVENT_ACTIONS = new Set(["registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]);
const TARGET_EVENT_ACTIONS = new Set(["targetSelectionChanged", ...REGISTRY_EVENT_ACTIONS]);
const RENDERER_RESPONSE_TIMEOUT_MS = 8_000;

function trustedEditorCandidates({ app, resourcesPath = process.resourcesPath, localAppData = process.env.LOCALAPPDATA } = {}) {
  const repositoryRoot = path.resolve(__dirname, "..", "..", "..");
  if (app?.isPackaged) {
    return [
      path.join(resourcesPath, "ui-editor", "UiEditorManager.exe"),
      ...(localAppData ? [path.join(localAppData, "UI-Editor-kit", "Manager", "app", "UiEditorManager.exe")] : []),
    ];
  }
  return [
    path.join(repositoryRoot, "build", "ui-editor-manager", "UiEditorManager.exe"),
    path.resolve(repositoryRoot, "..", "UI-Editor-kit", "windows-manager", "src", "UiEditorKit.Manager.Wpf", "bin", "Debug", "net10.0-windows10.0.19041.0", "UiEditorManager.exe"),
  ];
}

function resolveTrustedEditorExecutable(options = {}) {
  const executablePath = trustedEditorCandidates(options).find((candidate) => fs.existsSync(candidate));
  if (!executablePath) {
    throw new ElectronEditorError(
      ELECTRON_EDITOR_ERROR_CODES.EDITOR_NOT_INSTALLED,
      "Der separate UI-Editor ist nicht installiert. Bitte den UI-Editor Manager installieren oder den Entwicklungsbuild vorbereiten."
    );
  }
  return executablePath;
}

function resolveEditorRuntimeRoot(executablePath) {
  const packagedRuntime = path.join(path.dirname(executablePath), "editor-runtime");
  if (fs.existsSync(path.join(packagedRuntime, "src", "process", "editor-process-entry.cjs"))) return packagedRuntime;
  const kitRoot = path.resolve(__dirname, "..", "..", "..", "..", "UI-Editor-kit");
  if (fs.existsSync(path.join(kitRoot, "src", "process", "editor-process-entry.cjs"))) return kitRoot;
  throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.EDITOR_NOT_INSTALLED, "Der Editor-Core ist nicht vollständig installiert.");
}

function resolveEditorBuildIdentity(executablePath) {
  const resolvedExecutablePath = path.resolve(executablePath);
  const managerRoot = path.dirname(resolvedExecutablePath);
  const assemblyPath = path.join(managerRoot, "UiEditorManager.dll");
  const manifestPath = path.join(managerRoot, "ui-editor-build.json");
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
  catch (_error) { manifest = {}; }
  let assemblySha256 = null;
  try {
    assemblySha256 = crypto.createHash("sha256").update(fs.readFileSync(assemblyPath)).digest("hex");
  } catch (_error) { assemblySha256 = null; }
  const manifestSha256 = typeof manifest.managerAssemblySha256 === "string"
    ? manifest.managerAssemblySha256.toLowerCase()
    : null;
  return Object.freeze({
    buildId: assemblySha256 ? `ui-editor:${assemblySha256.slice(0, 16)}` : String(manifest.buildId || "ui-editor:unverified"),
    executablePath: resolvedExecutablePath,
    managerAssemblySha256: assemblySha256,
    manifestMatches: Boolean(assemblySha256 && manifestSha256 && assemblySha256 === manifestSha256),
    sourceBranch: String(manifest.sourceBranch || "unknown"),
    sourceCommit: String(manifest.sourceCommit || "unknown"),
    sourceDirty: typeof manifest.sourceDirty === "boolean" ? manifest.sourceDirty : null,
  });
}

function ensureSmallPlainObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.MESSAGE_INVALID, `${name} ist ungültig.`);
  }
  let bytes;
  try { bytes = Buffer.byteLength(JSON.stringify(value), "utf8"); }
  catch { throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.MESSAGE_INVALID, `${name} ist nicht serialisierbar.`); }
  if (bytes > LOCAL_TARGET_MAX_MESSAGE_BYTES) {
    throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.MESSAGE_TOO_LARGE, `${name} ist zu groß.`);
  }
  return value;
}

function publicError(error) {
  const code = Object.values(ELECTRON_EDITOR_ERROR_CODES).includes(error?.code)
    ? error.code
    : ELECTRON_EDITOR_ERROR_CODES.EDITOR_START_FAILED;
  const messages = {
    [ELECTRON_EDITOR_ERROR_CODES.EDITOR_NOT_INSTALLED]: "Der separate UI-Editor ist nicht installiert. Bitte den UI-Editor Manager installieren.",
    [ELECTRON_EDITOR_ERROR_CODES.EDITOR_ALREADY_RUNNING]: "Der UI-Editor läuft bereits und wird fokussiert.",
    [ELECTRON_EDITOR_ERROR_CODES.PIPE_TIMEOUT]: "Die lokale Verbindung zum UI-Editor konnte nicht rechtzeitig hergestellt werden.",
    [ELECTRON_EDITOR_ERROR_CODES.HANDSHAKE_FAILED]: "Die sichere lokale Verbindung zum UI-Editor ist fehlgeschlagen.",
    [ELECTRON_EDITOR_ERROR_CODES.REGISTRY_REFRESH_FAILED]: "Die aktuelle UI-Registry konnte nicht sicher geladen werden. Der vorherige gültige Stand bleibt erhalten.",
    [ELECTRON_EDITOR_ERROR_CODES.REGISTRY_SCOPE_BLOCKED]: "Für den aktuellen BBM-Bereich ist noch kein vollständiger, auflösbarer Editor-Scope verfügbar.",
    [ELECTRON_EDITOR_ERROR_CODES.REGISTRY_INCOMPATIBLE]: "BBM-Registry und Editor-Adapter sind nicht kompatibel.",
    [ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_CONFLICT]: "Die Registry wurde geändert, aber im Editor bestehen ungespeicherte Änderungen.",
    [ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_MIGRATION_REQUIRED]: "Die Registryänderung benötigt wegen geänderter IDs oder Parents eine ausdrückliche Profilmigration.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_INCOMPATIBLE]: "Das gespeicherte Editorlayout ist nicht mehr mit der aktuellen BBM-Version kompatibel.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_CORRUPT]: "Das gespeicherte Editorlayout ist beschädigt und wurde nicht angewendet.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_MIGRATION_AVAILABLE]: "Für das gespeicherte Editorlayout ist eine sichere Migration verfügbar.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_MIGRATION_FAILED]: "Das gespeicherte Editorlayout konnte nicht sicher migriert werden; das Altprofil bleibt erhalten.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_ARCHIVE_FAILED]: "Das Altprofil konnte nicht sicher archiviert werden und bleibt unverändert.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_BASELINE_STARTED]: "Der Editor wurde mit dem Standardlayout geöffnet.",
    [ELECTRON_EDITOR_ERROR_CODES.UI_PROFILE_RESTORE_FAILED]: "Das UI-Layout konnte nicht wiederhergestellt werden; die Editorverbindung selbst ist verfügbar.",
    [ELECTRON_EDITOR_ERROR_CODES.PDF_PROFILE_RESTORE_FAILED]: "Das PDF-Layout konnte nicht wiederhergestellt werden; der UI-Arbeitsbereich bleibt getrennt.",
    [ELECTRON_EDITOR_ERROR_CODES.PROFILE_USER_CANCELLED]: "Das Öffnen des Editors wurde abgebrochen. BBM bleibt geöffnet.",
  };
  return { ok: false, errorCode: code, message: messages[code] || "Der separate UI-Editor konnte nicht gestartet werden." };
}

function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

function createBbmModuleLayoutStorageIdentity(registration = {}) {
  const activeScopes = Array.isArray(registration.activeScopes)
    ? registration.activeScopes.map((scopeId) => String(scopeId || "").trim()).filter(Boolean)
    : [];
  const moduleIds = [...new Set(activeScopes.map((scopeId) => scopeId.split(".", 1)[0]))];
  if (moduleIds.length !== 1 || !/^[a-z0-9-]+$/.test(moduleIds[0])) {
    throw new ElectronEditorError(
      ELECTRON_EDITOR_ERROR_CODES.REGISTRY_SCOPE_BLOCKED,
      "Der globale Modullayout-Schlüssel kann nicht eindeutig aus den aktiven Scopes gebildet werden."
    );
  }
  const registryScopes = Array.isArray(registration.registryScopes) ? registration.registryScopes : [];
  const moduleId = moduleIds[0];
  return Object.freeze({
    moduleId,
    layoutStorageKey: `module-${moduleId}`,
    registryVersion: Number(registration.registryVersion),
    registryFingerprint: createRegistryFingerprint(registryScopes),
  });
}

function resolveBbmModuleLayoutProfileRoot(baseProfileRoot, registration) {
  const identity = createBbmModuleLayoutStorageIdentity(registration);
  return Object.freeze({
    profileRoot: path.join(path.resolve(baseProfileRoot), identity.layoutStorageKey),
    identity,
  });
}

function migrateCompatibleLegacyLayoutProfile(baseProfileRoot, moduleProfileRoot, registration) {
  const selectedProfiles = ["standard", "compact"];
  if (selectedProfiles.some((profileId) => fs.existsSync(path.join(moduleProfileRoot, `${profileId}.layout-profile.json`)))) return;
  if (!fs.existsSync(baseProfileRoot)) return;
  const legacy = loadTargetStartupLayout({
    profileRoot: baseProfileRoot,
    applicationId: APPLICATION_ID,
    activeScopes: registration.activeScopes,
    registryScopes: registration.registryScopes,
  });
  if (!legacy.ok || !legacy.found || !selectedProfiles.includes(legacy.profileId)) return;
  const source = path.join(baseProfileRoot, `${legacy.profileId}.layout-profile.json`);
  const destination = path.join(moduleProfileRoot, `${legacy.profileId}.layout-profile.json`);
  if (!fs.existsSync(source) || fs.existsSync(destination)) return;
  try { fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL); }
  catch (error) { if (error?.code !== "EEXIST") throw error; }
}

function profileArchiveStamp(value = new Date()) {
  return value.toISOString().replace(/[-:.]/g, "");
}

function migrateInvalidProtokollTableCellGeometryProfile({ profileRoot, loadedProfile, registration, now = () => new Date() }) {
  const activeScopes = Array.isArray(registration?.activeScopes)
    ? registration.activeScopes
    : registration?.contract?.activeScopes;
  if (!loadedProfile?.ok || !loadedProfile?.found || !loadedProfile.profilePath ||
      !Array.isArray(activeScopes) || !activeScopes.includes("protokoll.list.root")) {
    return { migrated: false, repairedElementIds: [], archivePath: null };
  }
  const persistedScope = loadedProfile.scopes?.find((scope) => scope.scopeId === "protokoll.list.root");
  const registryScope = registration.registryScopes?.find((scope) => scope.scopeId === "protokoll.list.root");
  if (!persistedScope || !registryScope || !persistedScope.explicitOperations) {
    return { migrated: false, repairedElementIds: [], archivePath: null };
  }
  const persistedById = new Map(persistedScope.elements.map((entry) => [entry.elementId, entry]));
  const registeredById = new Map(registryScope.elements.map((entry) => [entry.id, entry]));
  const repairedElementIds = [];
  for (const [elementId, operations] of Object.entries(persistedScope.explicitOperations)) {
    const entry = registeredById.get(elementId);
    if (entry?.type !== "tableDataCell" || !Array.isArray(operations) ||
        !operations.some((operation) => ["move", "resize", "resizeWidth"].includes(operation))) continue;
    const columnId = String(entry.tableBinding?.columnId || entry.parentId || "");
    const registeredColumn = registeredById.get(columnId);
    const persistedCell = persistedById.get(elementId);
    const persistedColumn = persistedById.get(columnId);
    if (registeredColumn?.type !== "tableColumn" || !persistedCell || !persistedColumn) continue;
    const offsetX = Number(persistedCell.x || 0);
    const cellWidth = Number(persistedCell.width);
    const columnWidth = Number(persistedColumn.width);
    if (![offsetX, cellWidth, columnWidth].every(Number.isFinite) || cellWidth <= 0 || columnWidth <= 0) continue;
    if (offsetX < -0.5 || cellWidth > columnWidth + 0.5 || offsetX + cellWidth > columnWidth + 0.5) {
      repairedElementIds.push(elementId);
    }
  }
  if (!repairedElementIds.length) return { migrated: false, repairedElementIds: [], archivePath: null };

  const document = JSON.parse(fs.readFileSync(loadedProfile.profilePath, "utf8"));
  for (const scope of document.scopes || []) {
    if (scope.scopeId !== "protokoll.list.root" || !scope.explicitOperations) continue;
    for (const elementId of repairedElementIds) {
      const remaining = Array.isArray(scope.explicitOperations[elementId])
        ? scope.explicitOperations[elementId].filter((operation) => !["move", "resize", "resizeWidth"].includes(operation))
        : [];
      if (remaining.length) scope.explicitOperations[elementId] = remaining;
      else delete scope.explicitOperations[elementId];
    }
  }
  const migrationTime = now();
  document.savedAt = migrationTime.toISOString();
  const archiveRoot = path.join(profileRoot, "archive", APPLICATION_ID);
  fs.mkdirSync(archiveRoot, { recursive: true });
  const archivePath = path.join(
    archiveRoot,
    `${profileArchiveStamp(migrationTime)}_invalid-table-cell-geometry_${path.basename(loadedProfile.profilePath)}`
  );
  const temporaryPath = path.join(
    path.dirname(loadedProfile.profilePath),
    `.${path.basename(loadedProfile.profilePath)}.${process.pid}.${Date.now()}.tmp`
  );
  fs.writeFileSync(temporaryPath, JSON.stringify(document, null, 2), { encoding: "utf8", flag: "wx" });
  try {
    fs.renameSync(loadedProfile.profilePath, archivePath);
    try { fs.renameSync(temporaryPath, loadedProfile.profilePath); }
    catch (error) {
      fs.renameSync(archivePath, loadedProfile.profilePath);
      throw error;
    }
  } catch (error) {
    try { fs.unlinkSync(temporaryPath); } catch (_cleanupError) { void _cleanupError; }
    throw error;
  }
  try { fs.unlinkSync(temporaryPath); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  return { migrated: true, repairedElementIds, archivePath };
}

class ElectronUiEditorSessionController {
  constructor({ app, ipcMain, getMainWindow, pdfAdapter = null, spawnProcess = spawn, clientFactory, pathOptions = {}, executableResolver, runtimeRootResolver, sessionIdentifiersFactory, profileRootResolver, ensureDirectory }) {
    this.app = app;
    this.ipcMain = ipcMain;
    this.getMainWindow = getMainWindow;
    this.pdfAdapter = pdfAdapter;
    this.spawnProcess = spawnProcess;
    this.clientFactory = clientFactory || ((options) => new NamedPipeTargetClient(options));
    this.pathOptions = pathOptions;
    this.executableResolver = executableResolver || resolveTrustedEditorExecutable;
    this.runtimeRootResolver = runtimeRootResolver || resolveEditorRuntimeRoot;
    this.sessionIdentifiersFactory = sessionIdentifiersFactory || createSessionIdentifiers;
    this.profileRootResolver = profileRootResolver || ((electronApp) => path.join(electronApp.getPath("userData"), "ui-editor", "profiles"));
    this.ensureDirectory = ensureDirectory || ((directory) => fs.mkdirSync(directory, { recursive: true }));
    this.child = null;
    this.client = null;
    this.startPromise = null;
    this.pendingRendererRequests = new Map();
    this.heartbeat = null;
    this.currentRegistration = null;
    this.pendingStartupLayouts = new Map();
    this.startupLayoutReceipts = new Map();
    this.registered = false;
    this.stopping = false;
    this.editorBuildIdentity = null;
  }

  registerIpc() {
    if (this.registered) return;
    this.registered = true;
    this.ipcMain.handle("uiEditor:open", (_event, registration) => this.open(registration));
    this.ipcMain.handle("uiEditor:close", () => this.close());
    this.ipcMain.handle("uiEditor:getStatus", () => this.status());
    this.ipcMain.handle("uiEditor:respond", (_event, message) => this.respondFromRenderer(message));
    this.ipcMain.handle("uiEditor:targetEvent", (_event, message) => this.forwardTargetEvent(message));
    this.ipcMain.handle("uiEditor:preparePdfContext", (_event, context) => this.preparePdfContext(context));
    this.ipcMain.handle("uiEditor:loadStartupLayout", (_event, registration) => this.loadStartupLayout(registration));
    this.ipcMain.handle("uiEditor:completeStartupLayout", (_event, result) => this.completeStartupLayout(result));
  }

  #readTargetManifest() {
    const appRoot = this.app.getAppPath?.() || path.resolve(__dirname, "..", "..", "..");
    const manifestPath = path.join(appRoot, "ui-editor-target.json");
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
    catch (cause) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_INCOMPATIBLE, "Ziel-App-Manifest fehlt oder ist beschädigt.", cause);
    }
    return { manifest, manifestPath };
  }

  #validateTargetManifest(contract) {
    const { manifest, manifestPath } = this.#readTargetManifest();
    const declaredScopes = Array.isArray(manifest.activeScopes) ? manifest.activeScopes.map(String) : [];
    const activeScopes = Array.isArray(contract.activeScopes) ? contract.activeScopes.map(String) : [];
    const usesCompleteInventory = JSON.stringify(declaredScopes) === JSON.stringify(activeScopes);
    if (manifest.schemaVersion !== 2 || manifest.applicationId !== APPLICATION_ID || manifest.framework !== "electron" ||
        manifest.contractVersion !== contract.contractVersion || manifest.adapterVersion !== contract.adapterVersion ||
        manifest.registryVersion !== contract.registryVersion ||
        activeScopes.length === 0 || activeScopes.some((scopeId) => !declaredScopes.includes(scopeId)) ||
        (usesCompleteInventory && manifest.registryFingerprint !== contract.registryFingerprint)) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_INCOMPATIBLE, "Ziel-App-Manifest und aktive Registry stimmen nicht überein.");
    }
    return manifestPath;
  }

  loadStartupLayout(registration) {
    console.info(`[ui-editor] startup layout requested: activeScopes=${Array.isArray(registration?.activeScopes) ? registration.activeScopes.length : 0}`);
    try {
      const baseProfileRoot = this.profileRootResolver(this.app);
      const { profileRoot, identity } = resolveBbmModuleLayoutProfileRoot(baseProfileRoot, registration);
      this.ensureDirectory(profileRoot);
      migrateCompatibleLegacyLayoutProfile(baseProfileRoot, profileRoot, registration);
      const snapshot = this.#registrationSnapshot(registration, { sessionId: "startup-layout", profileRoot, identity });
      const manifestPath = this.#validateTargetManifest(snapshot.contract);
      let result = loadTargetStartupLayout({
        profileRoot,
        applicationId: snapshot.contract.applicationId,
        activeScopes: snapshot.contract.activeScopes,
        registryScopes: snapshot.registryScopes,
      });
      const layoutRepair = migrateInvalidProtokollTableCellGeometryProfile({
        profileRoot,
        loadedProfile: result,
        registration: snapshot,
      });
      if (layoutRepair.migrated) {
        result = loadTargetStartupLayout({
          profileRoot,
          applicationId: snapshot.contract.applicationId,
          activeScopes: snapshot.contract.activeScopes,
          registryScopes: snapshot.registryScopes,
        });
        console.info(`[ui-editor] startup layout repaired: elements=${layoutRepair.repairedElementIds.join(",")}, archive=${layoutRepair.archivePath}`);
      }
      if (result.ok && result.found) this.pendingStartupLayouts.set(identity.layoutStorageKey, { ...result, manifestPath, layoutStorageKey: identity.layoutStorageKey });
      else this.pendingStartupLayouts.delete(identity.layoutStorageKey);
      const receipt = result.found ? null : {
        applied: false,
        state: result.state,
        code: result.code,
        profileId: result.profileId,
        editorProcessRequired: false,
      };
      if (receipt) this.startupLayoutReceipts.set(identity.layoutStorageKey, receipt);
      else this.startupLayoutReceipts.delete(identity.layoutStorageKey);
      console.info(`[ui-editor] startup layout loaded: module=${identity.moduleId}, profile=${result.profileId || "standard"}, found=${result.found === true}, code=${result.code}, fingerprint=${result.profileSha256 || "none"}`);
      return { ...result, manifestPath, layoutStorageKey: identity.layoutStorageKey, layoutRepair };
    } catch (error) {
      const receipt = { applied: false, state: "baseline", code: error?.code || "startup_layout_failed", editorProcessRequired: false };
      console.info(`[ui-editor] startup layout rejected: ${receipt.code}`);
      return { ok: false, found: false, applied: false, state: "baseline", code: error?.code || "startup_layout_failed", message: error?.message || "Startlayout konnte nicht validiert werden.", scopes: [], editorProcessRequired: false };
    }
  }

  completeStartupLayout(result = {}) {
    const layoutStorageKey = String(result.layoutStorageKey || (this.pendingStartupLayouts.size === 1 ? this.pendingStartupLayouts.keys().next().value : ""));
    const pending = this.pendingStartupLayouts.get(layoutStorageKey);
    this.pendingStartupLayouts.delete(layoutStorageKey);
    if (!pending || result.ok !== true || result.profileSha256 !== pending.profileSha256) {
      const receipt = { applied: false, state: "baseline", code: String(result.code || "startup_layout_apply_failed"), editorProcessRequired: false };
      if (layoutStorageKey) this.startupLayoutReceipts.set(layoutStorageKey, receipt);
      console.info(`[ui-editor] startup layout: ${receipt.code}, applied=false, reason=${String(result.message || "unavailable").replace(/[\r\n]+/g, " ")}`);
      return { ok: false, code: receipt.code };
    }
    const receipt = {
      applied: true,
      state: "compatible",
      code: "startup_layout_applied",
      profileId: pending.profileId,
      savedAt: pending.savedAt,
      profileSha256: pending.profileSha256,
      editorProcessRequired: false,
    };
    this.startupLayoutReceipts.set(layoutStorageKey, receipt);
    console.info(`[ui-editor] startup layout: startup_layout_applied, applied=true, moduleKey=${layoutStorageKey}, profile=${receipt.profileId || "standard"}, fingerprint=${receipt.profileSha256}`);
    return { ok: true, receipt: { ...receipt } };
  }

  preparePdfContext(context = {}) {
    if (!this.pdfAdapter) return { ok: false, pdfRegistryStatus: "unavailable", activeDocumentId: "" };
    const result = this.pdfAdapter.setActiveDocumentContext({ projectId: context?.projectId, meetingId: context?.meetingId });
    console.info(`[ui-editor] PDF context: ${result.pdfRegistryStatus}`);
    return result;
  }

  async open(registration, reason = "open") {
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.#openAfterRefresh(registration, reason)
      .catch((error) => publicError(error))
      .finally(() => { this.startPromise = null; });
    return this.startPromise;
  }

  #registrationSnapshot(registration, { sessionId, profileRoot, identity = createBbmModuleLayoutStorageIdentity(registration) }) {
    ensureSmallPlainObject(registration, "Ziel-App-Registrierung");
    if (registration.applicationId !== APPLICATION_ID || registration.displayName !== DISPLAY_NAME) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_INCOMPATIBLE, "Ziel-App-Kennung der Registrierung ist ungültig.");
    }
    const registryScopes = Array.isArray(registration.registryScopes) ? registration.registryScopes : [];
    const activeScopes = Array.isArray(registration.activeScopes) ? registration.activeScopes.map(String) : [];
    if (activeScopes.length === 0) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_SCOPE_BLOCKED, "Kein vollständiger Scope ist im aktuellen BBM-Bereich auflösbar.");
    }
    const pdfContract = this.pdfAdapter?.getPdfContract?.() || null;
    const contract = createElectronTargetContract({
      applicationId: registration.applicationId,
      displayName: registration.displayName,
      appVersion: this.app.getVersion?.() || "0.0.0-dev",
      registryVersion: registration.registryVersion,
      registryFingerprint: createRegistryFingerprint(registryScopes),
      registryStatus: registration.registryStatus,
      activeScopes,
      profileRoot,
      supportedOperations: registration.supportedOperations,
      transportProtocolVersion: LOCAL_TARGET_PROTOCOL_VERSION,
      sessionId,
      processId: process.pid,
      pdfCapability: pdfContract ? "available" : "unavailable",
      pdfContract,
    });
    if (registration.framework !== contract.framework || registration.uiCapability !== contract.uiCapability ||
        registration.labelFieldSeparation !== true ||
        registration.visibilityCapability !== true || contract.adapterVersion !== ELECTRON_TARGET_ADAPTER_VERSION) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_INCOMPATIBLE, "Ziel-App-Vertrag oder Adapter-Capabilities sind nicht kompatibel.");
    }
    const startupLayoutReceipt = this.startupLayoutReceipts.get(identity.layoutStorageKey) || null;
    const snapshot = { contract: { ...contract, startupLayout: startupLayoutReceipt ? { ...startupLayoutReceipt } : null }, registryScopes };
    const validation = validateRegistrationSnapshot(snapshot);
    if (!validation.ok) {
      const first = validation.errors[0];
      throw new ElectronEditorError(first?.code || ELECTRON_EDITOR_ERROR_CODES.REGISTRATION_FAILED, "BBM-Registry ist unvollständig oder ungültig.", validation.errors);
    }
    return snapshot;
  }

  async #openAfterRefresh(registration, reason) {
    const running = Boolean(this.client?.connected && this.child && this.child.exitCode === null && this.currentRegistration);
    if (!running) return this.#start(registration);
    let candidate;
    try {
      const { profileRoot, identity } = resolveBbmModuleLayoutProfileRoot(this.profileRootResolver(this.app), registration);
      candidate = this.#registrationSnapshot(registration, {
        sessionId: this.currentRegistration.contract.sessionId,
        profileRoot,
        identity,
      });
    } catch (error) {
      throw new ElectronEditorError(error?.code || ELECTRON_EDITOR_ERROR_CODES.REGISTRY_REFRESH_FAILED, error?.message || "Registry-Refresh fehlgeschlagen.");
    }
    const comparison = compareRegistrySnapshots(this.currentRegistration, candidate);
    const previousPdf = this.currentRegistration.contract.pdfContract;
    const nextPdf = candidate.contract.pdfContract;
    const pdfChanged = JSON.stringify(previousPdf) !== JSON.stringify(nextPdf);
    const profileRootChanged = this.currentRegistration.contract.profileRoot !== candidate.contract.profileRoot;
    const guard = await this.client.request("prepareRegistryRefresh", {
      reason,
      registryVersion: candidate.contract.registryVersion,
      registryFingerprint: candidate.contract.registryFingerprint,
      comparison,
    }, "prepareRegistryRefreshAccepted");
    if ((comparison.status !== "current" || pdfChanged || profileRootChanged) && guard?.isDirty === true) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_CONFLICT, "Ungespeicherte Editoränderungen verhindern den Registry-Refresh.");
    }
    if (comparison.migrationRequiredIds.length) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_MIGRATION_REQUIRED, "Geänderte Parents oder Bedeutungen benötigen eine Profilmigration.");
    }
    if (comparison.status === "current" && !pdfChanged && !profileRootChanged) {
      if (reason === "open" || reason === "focus") this.client.sendEvent("activateEditor");
      return { ok: true, started: false, focused: reason === "open" || reason === "focus", sessionId: this.sessionId, registryRefreshStatus: "current" };
    }
    await this.#disposeSession("registry_changed", true);
    const result = await this.#start(registration);
    return { ...result, registryRefreshStatus: "changed", pdfRegistryRefreshStatus: pdfChanged ? "changed" : "current", addedElementIds: comparison.addedElementIds, removedElementIds: comparison.removedElementIds };
  }

  async #start(registration) {
    const identifiers = this.sessionIdentifiersFactory();
    const baseProfileRoot = this.profileRootResolver(this.app);
    const { profileRoot, identity } = resolveBbmModuleLayoutProfileRoot(baseProfileRoot, registration);
    this.ensureDirectory(profileRoot);
    migrateCompatibleLegacyLayoutProfile(baseProfileRoot, profileRoot, registration);
    const registrationSnapshot = this.#registrationSnapshot(registration, { sessionId: identifiers.sessionId, profileRoot, identity });
    const contract = registrationSnapshot.contract;
    console.info(`[ui-editor] editor start receipt: ${contract.startupLayout?.code || "none"}, applied=${contract.startupLayout?.applied === true}`);
    const executablePath = this.executableResolver({ app: this.app, ...this.pathOptions });
    const editorRuntimeRoot = this.runtimeRootResolver(executablePath);
    this.editorBuildIdentity = resolveEditorBuildIdentity(executablePath);
    console.info(
      `[ui-editor] manager build: id=${this.editorBuildIdentity.buildId}, path=${this.editorBuildIdentity.executablePath}, ` +
      `branch=${this.editorBuildIdentity.sourceBranch}, commit=${this.editorBuildIdentity.sourceCommit}, ` +
      `dirty=${this.editorBuildIdentity.sourceDirty}, manifestMatches=${this.editorBuildIdentity.manifestMatches}`
    );
    const args = [
      "--electron-target-editor",
      `--pipe-name=${identifiers.pipeName}`,
      `--session-nonce=${identifiers.sessionNonce}`,
      `--application-id=${contract.applicationId}`,
      `--profile-root=${profileRoot}`,
      `--editor-runtime-root=${editorRuntimeRoot}`,
    ];
    try {
      this.sessionId = identifiers.sessionId;
      this.child = this.spawnProcess(executablePath, args, {
        cwd: path.dirname(executablePath),
        shell: false,
        windowsHide: false,
        detached: false,
        stdio: "ignore",
      });
      this.child.once("exit", () => { void this.#disposeSession("editor_process_exited", false); });
      this.child.once("error", (error) => { void this.#disposeSession(error?.code || "editor_process_error", false); });
      // The native peer requests the registry as part of its initial handshake.
      // Make the immutable snapshot available before opening that pipe so the
      // renderer response is validated against this very session.
      this.currentRegistration = registrationSnapshot;
      this.client = await this.#connectWithRetry(identifiers, contract);
      this.client.on("disconnect", () => { void this.#disposeSession("editor_disconnected", false); });
      this.client.on("connectionError", (_error) => { void _error; });
      this.#startHeartbeat();
      return { ok: true, started: true, focused: false, sessionId: identifiers.sessionId, registryRefreshStatus: "changed" };
    } catch (error) {
      await this.#disposeSession("editor_start_failed", true);
      throw error;
    }
  }

  async #connectWithRetry(identifiers, contract) {
    const expiresAt = Date.now() + 15_000;
    let lastError;
    let attempt = 0;
    while (Date.now() < expiresAt && (this.child?.exitCode === null || this.child?.exitCode === undefined)) {
      attempt += 1;
      const client = this.clientFactory({ pipeName: identifiers.pipeName, sessionNonce: identifiers.sessionNonce, timeoutMs: 2_000 });
      client.on("message", (message) => this.#handleNativeMessage(message));
      this.client = client;
      try {
        await client.connect({ contract });
        console.info(`[ui-editor] pipe connected after ${attempt} attempt(s)`);
        return client;
      } catch (error) {
        if (!lastError || lastError.code !== error?.code || attempt % 10 === 0) {
          console.info(`[ui-editor] connect retry ${attempt}: ${error?.code || "unknown"} ${error?.message || ""}`);
        }
        lastError = error;
        if (this.client === client) this.client = null;
        try { await client.close("connect_retry"); } catch (_closeError) { void _closeError; }
        await delay(150);
      }
    }
    throw lastError || new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.PIPE_TIMEOUT, "Editor-Pipe ist nicht erreichbar.");
  }

  #handleNativeMessage(message) {
    const action = String(message?.payload?.action || "");
    if (message.messageType === "request" && NATIVE_PDF_REQUEST_ACTIONS.has(action)) {
      void this.#handleNativePdfRequest(message, action);
      return;
    }
    if (message.messageType === "request" && NATIVE_REQUEST_ACTIONS.has(action)) {
      console.info(`[ui-editor] native request: ${action}`);
      const window = this.getMainWindow?.();
      if (!window || window.isDestroyed?.()) {
        this.client?.respond(message, {}, { code: ELECTRON_EDITOR_ERROR_CODES.HANDSHAKE_FAILED, message: "BBM-Renderer ist nicht verfügbar." });
        return;
      }
      const requestId = message.messageId;
      const timeout = setTimeout(() => {
        const pending = this.pendingRendererRequests.get(requestId);
        if (!pending) return;
        this.pendingRendererRequests.delete(requestId);
        this.client?.respond(pending.message, {}, { code: ELECTRON_EDITOR_ERROR_CODES.PIPE_TIMEOUT, message: "BBM-Renderer antwortet nicht." });
      }, RENDERER_RESPONSE_TIMEOUT_MS);
      this.pendingRendererRequests.set(requestId, { message, timeout });
      window.webContents.send("uiEditor:request", { requestId, payload: message.payload });
      return;
    }
    if (message.messageType === "event" && NATIVE_EVENT_ACTIONS.has(action)) {
      if (action === "activateTarget") this.getMainWindow?.()?.focus?.();
      if (action === "editorClosed") {
        void this.#disposeSession("editor_closed", false, message.payload);
        return;
      }
      this.getMainWindow?.()?.webContents?.send?.("uiEditor:event", message.payload);
    }
  }

  async #handleNativePdfRequest(message, action) {
    try {
      if (!this.pdfAdapter || !this.pdfAdapter.getPdfContract()) throw Object.assign(new Error("BBM-PDF ist nicht verfügbar."), { code: "pdf_document_unavailable" });
      let payload;
      if (action === "getPdfRegistry") payload = { pdfRegistry: this.pdfAdapter.getPdfRegistry() };
      else if (action === "getCurrentPdfLayoutState") payload = { layoutState: this.pdfAdapter.getCurrentPdfLayoutState() };
      else if (action === "submitPdfChangeRequest") payload = { changeResult: this.pdfAdapter.submitPdfChangeRequest(message.payload?.changeRequest) };
      else if (action === "regeneratePdfPreview") payload = { previewMetadata: await this.pdfAdapter.regeneratePdfPreview() };
      else payload = { previewMetadata: this.pdfAdapter.getPreviewMetadata() };
      this.client?.respond(message, { action: `${action}Accepted`, ...payload });
    } catch (error) {
      this.client?.respond(message, {}, { code: String(error?.code || "pdf_request_failed"), message: String(error?.message || "BBM-PDF-Anfrage fehlgeschlagen.") });
    }
  }

  respondFromRenderer(message) {
    ensureSmallPlainObject(message, "Rendererantwort");
    const requestId = String(message.requestId || "");
    const pending = this.pendingRendererRequests.get(requestId);
    if (!pending) return { ok: false, errorCode: ELECTRON_EDITOR_ERROR_CODES.MESSAGE_INVALID };
    this.pendingRendererRequests.delete(requestId);
    clearTimeout(pending.timeout);
    if (message.ok === true) {
      let payload = ensureSmallPlainObject(message.payload || {}, "Antwortpayload");
      const requestAction = String(pending.message?.payload?.action || "");
      if (requestAction === "getRegistry") {
        const registryScopes = Array.isArray(payload.registryScopes) ? payload.registryScopes : [];
        const candidate = { contract: this.currentRegistration?.contract, registryScopes };
        const validation = validateRegistrationSnapshot(candidate);
        if (!this.currentRegistration || !validation.ok || validation.fingerprint !== this.currentRegistration.contract.registryFingerprint) {
          this.client?.respond(pending.message, {}, {
            code: validation.errors?.[0]?.code || ELECTRON_EDITOR_ERROR_CODES.REGISTRY_REFRESH_FAILED,
            message: "Die Registry hat sich nach dem Preflight geändert oder ist ungültig.",
          });
          return { ok: false, errorCode: validation.errors?.[0]?.code || ELECTRON_EDITOR_ERROR_CODES.REGISTRY_REFRESH_FAILED };
        }
        payload = {
          ...payload,
          registryVersion: this.currentRegistration.contract.registryVersion,
          registryFingerprint: this.currentRegistration.contract.registryFingerprint,
          registryStatus: this.currentRegistration.contract.registryStatus,
          activeScopes: [...this.currentRegistration.contract.activeScopes],
        };
      }
      console.info(`[ui-editor] renderer response: ${requestAction}`);
      this.client?.respond(pending.message, { action: `${requestAction}Accepted`, ...payload });
    }
    else this.client?.respond(pending.message, {}, {
      code: Object.values(ELECTRON_EDITOR_ERROR_CODES).includes(message.errorCode) ? message.errorCode : ELECTRON_EDITOR_ERROR_CODES.MESSAGE_INVALID,
      message: "BBM hat die Editoranfrage sicher abgewiesen.",
    });
    return { ok: true };
  }

  async forwardTargetEvent(message) {
    ensureSmallPlainObject(message, "Ziel-App-Ereignis");
    if (!TARGET_EVENT_ACTIONS.has(message.action)) return { ok: false, errorCode: ELECTRON_EDITOR_ERROR_CODES.MESSAGE_INVALID };
    if (REGISTRY_EVENT_ACTIONS.has(message.action)) {
      const result = await this.open(message.registration, message.action);
      if (result.ok) this.client?.sendEvent(message.action, { scopeId: String(message.scopeId || ""), registryRefreshStatus: result.registryRefreshStatus });
      return result;
    }
    return { ok: this.client?.sendEvent(message.action, {
      scopeId: String(message.scopeId || ""),
      elementId: String(message.elementId || ""),
      displayName: String(message.displayName || ""),
      elementType: String(message.elementType || ""),
      selectionKind: String(message.selectionKind || ""),
      selectionLevel: String(message.selectionLevel || ""),
      parentId: String(message.parentId || ""),
      childCount: Number.isInteger(message.childCount) ? message.childCount : 0,
      cancelled: message.cancelled === true,
      boundingRect: message.boundingRect && typeof message.boundingRect === "object" ? message.boundingRect : null,
    }) === true };
  }

  status() {
    return {
      ok: true,
      running: Boolean(this.client?.connected && this.child?.exitCode === null),
      sessionId: this.sessionId || null,
      registryVersion: this.currentRegistration?.contract.registryVersion || null,
      registryFingerprint: this.currentRegistration?.contract.registryFingerprint || null,
      registryStatus: this.currentRegistration?.contract.registryStatus || "registrationRequired",
      editorBuildIdentity: this.editorBuildIdentity ? { ...this.editorBuildIdentity } : null,
    };
  }

  async close() {
    await this.#disposeSession("renderer_requested_close", true);
    return { ok: true };
  }

  async shutdown() { await this.#disposeSession("bbm_shutdown", true); }

  #startHeartbeat() {
    clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      this.client?.request("heartbeatProbe", {}, "heartbeatProbeAccepted").catch(() => {
        void this.#disposeSession("heartbeat_failed", true);
      });
    }, 4_000);
    this.heartbeat.unref?.();
  }

  async #disposeSession(reason, stopProcess, closePayload = null) {
    if (this.stopping) return;
    this.stopping = true;
    clearInterval(this.heartbeat);
    this.heartbeat = null;
    for (const pending of this.pendingRendererRequests.values()) clearTimeout(pending.timeout);
    this.pendingRendererRequests.clear();
    const client = this.client;
    const child = this.child;
    this.client = null;
    this.child = null;
    this.sessionId = null;
    this.currentRegistration = null;
    try {
      if (stopProcess && client?.connected) client.sendEvent("shutdownEditor");
      await client?.close(reason);
    } catch (_closeError) { void _closeError; }
    if (stopProcess && child && (child.exitCode === null || child.exitCode === undefined)) {
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(1_000),
      ]);
      if (child.exitCode === null || child.exitCode === undefined) child.kill();
    }
    const window = this.getMainWindow?.();
    if (window && !window.isDestroyed?.()) {
      const webContents = window.webContents;
      if (webContents && !webContents.isDestroyed?.()) {
        const disposition = ["clean", "saved", "discarded"].includes(closePayload?.disposition)
          ? closePayload.disposition
          : "unknown";
        const saveRequestId = typeof closePayload?.saveRequestId === "string" ? closePayload.saveRequestId : null;
        webContents.send("uiEditor:event", { action: "editorClosed", reason, disposition, saveRequestId });
      }
    }
    this.stopping = false;
  }
}

module.exports = Object.freeze({
  APPLICATION_ID,
  ACTIVE_SCOPES,
  ElectronUiEditorSessionController,
  createBbmModuleLayoutStorageIdentity,
  migrateInvalidProtokollTableCellGeometryProfile,
  publicError,
  resolveBbmModuleLayoutProfileRoot,
  resolveEditorBuildIdentity,
  resolveEditorRuntimeRoot,
  resolveTrustedEditorExecutable,
  trustedEditorCandidates,
});
