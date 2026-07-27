"use strict";

const fs = require("node:fs");
const path = require("node:path");
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
  validateRegistrationSnapshot,
} = require("ui-editor-kit");

const APPLICATION_ID = "bbm-produktiv";
const DISPLAY_NAME = "BBM";
const ACTIVE_SCOPES = Object.freeze(["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]);
const NATIVE_REQUEST_ACTIONS = new Set(["getRegistry", "getLayoutState", "submitChange"]);
const NATIVE_PDF_REQUEST_ACTIONS = new Set([
  "getPdfRegistry",
  "getCurrentPdfLayoutState",
  "submitPdfChangeRequest",
  "regeneratePdfPreview",
  "getPreviewMetadata",
]);
const NATIVE_EVENT_ACTIONS = new Set(["beginTargetSelection", "cancelTargetSelection", "highlightElement", "activateTarget", "editorClosed"]);
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
  };
  return { ok: false, errorCode: code, message: messages[code] || "Der separate UI-Editor konnte nicht gestartet werden." };
}

function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

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
    this.registered = false;
    this.stopping = false;
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

  #registrationSnapshot(registration, { sessionId, profileRoot }) {
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
    const snapshot = { contract, registryScopes };
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
      candidate = this.#registrationSnapshot(registration, {
        sessionId: this.currentRegistration.contract.sessionId,
        profileRoot: this.currentRegistration.contract.profileRoot,
      });
    } catch (error) {
      throw new ElectronEditorError(error?.code || ELECTRON_EDITOR_ERROR_CODES.REGISTRY_REFRESH_FAILED, error?.message || "Registry-Refresh fehlgeschlagen.");
    }
    const comparison = compareRegistrySnapshots(this.currentRegistration, candidate);
    const previousPdf = this.currentRegistration.contract.pdfContract;
    const nextPdf = candidate.contract.pdfContract;
    const pdfChanged = JSON.stringify(previousPdf) !== JSON.stringify(nextPdf);
    const guard = await this.client.request("prepareRegistryRefresh", {
      reason,
      registryVersion: candidate.contract.registryVersion,
      registryFingerprint: candidate.contract.registryFingerprint,
      comparison,
    }, "prepareRegistryRefreshAccepted");
    if ((comparison.status !== "current" || pdfChanged) && guard?.isDirty === true) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_CONFLICT, "Ungespeicherte Editoränderungen verhindern den Registry-Refresh.");
    }
    if (comparison.migrationRequiredIds.length) {
      throw new ElectronEditorError(ELECTRON_EDITOR_ERROR_CODES.REGISTRY_PROFILE_MIGRATION_REQUIRED, "Geänderte Parents oder Bedeutungen benötigen eine Profilmigration.");
    }
    if (comparison.status === "current" && !pdfChanged) {
      if (reason === "open" || reason === "focus") this.client.sendEvent("activateEditor");
      return { ok: true, started: false, focused: reason === "open" || reason === "focus", sessionId: this.sessionId, registryRefreshStatus: "current" };
    }
    await this.#disposeSession("registry_changed", true);
    const result = await this.#start(registration);
    return { ...result, registryRefreshStatus: "changed", pdfRegistryRefreshStatus: pdfChanged ? "changed" : "current", addedElementIds: comparison.addedElementIds, removedElementIds: comparison.removedElementIds };
  }

  async #start(registration) {
    const identifiers = this.sessionIdentifiersFactory();
    const profileRoot = this.profileRootResolver(this.app);
    this.ensureDirectory(profileRoot);
    const registrationSnapshot = this.#registrationSnapshot(registration, { sessionId: identifiers.sessionId, profileRoot });
    const contract = registrationSnapshot.contract;
    const executablePath = this.executableResolver({ app: this.app, ...this.pathOptions });
    const editorRuntimeRoot = this.runtimeRootResolver(executablePath);
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
      this.client = await this.#connectWithRetry(identifiers, contract);
      this.client.on("disconnect", () => { void this.#disposeSession("editor_disconnected", false); });
      this.client.on("connectionError", (_error) => { void _error; });
      this.currentRegistration = registrationSnapshot;
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
      this.getMainWindow?.()?.webContents?.send?.("uiEditor:event", message.payload);
      if (action === "editorClosed") void this.#disposeSession("editor_closed", false);
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
    return { ok: this.client?.sendEvent(message.action, { scopeId: String(message.scopeId || ""), elementId: String(message.elementId || "") }) === true };
  }

  status() {
    return {
      ok: true,
      running: Boolean(this.client?.connected && this.child?.exitCode === null),
      sessionId: this.sessionId || null,
      registryVersion: this.currentRegistration?.contract.registryVersion || null,
      registryFingerprint: this.currentRegistration?.contract.registryFingerprint || null,
      registryStatus: this.currentRegistration?.contract.registryStatus || "registrationRequired",
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

  async #disposeSession(reason, stopProcess) {
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
    if (stopProcess && (child?.exitCode === null || child?.exitCode === undefined)) {
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(1_000),
      ]);
      if (child.exitCode === null || child.exitCode === undefined) child.kill();
    }
    this.getMainWindow?.()?.webContents?.send?.("uiEditor:event", { action: "editorClosed", reason });
    this.stopping = false;
  }
}

module.exports = Object.freeze({
  APPLICATION_ID,
  ACTIVE_SCOPES,
  ElectronUiEditorSessionController,
  publicError,
  resolveEditorRuntimeRoot,
  resolveTrustedEditorExecutable,
  trustedEditorCandidates,
});
