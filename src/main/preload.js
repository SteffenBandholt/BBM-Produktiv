// src/main/preload.js
const { contextBridge, ipcRenderer } = require("electron");

// kleine Helper: erlaubt beide Signaturen (id) oder ({...})
function _wrapIdArg(name, objKey) {
  return (arg) => {
    // arg kann z.B. projectId sein oder {projectId}
    if (arg && typeof arg === "object") return ipcRenderer.invoke(name, arg);
    const payload = {};
    payload[objKey] = arg;
    return ipcRenderer.invoke(name, payload);
  };
}

contextBridge.exposeInMainWorld("bbmDb", {
  // ============================================================
  // Projekte
  // ============================================================
  projectsList: () => ipcRenderer.invoke("projects:list"),
  projectsCreate: (data) => ipcRenderer.invoke("projects:create", data),
  projectsUpdate: (data) => ipcRenderer.invoke("projects:update", data),
  projectsAssignModule: (data) => ipcRenderer.invoke("projects:assignModule", data),
  projectsStoragePreview: (data) => ipcRenderer.invoke("projects:storagePreview", data),
  projectsOpenRestarbeitenDir: (data) => ipcRenderer.invoke("projects:openRestarbeitenDir", data),

  // Archiv
  projectsArchive: _wrapIdArg("projects:archive", "projectId"),
  projectsArchiveModule: (data) => ipcRenderer.invoke("projects:archiveModule", data),
  projectsUnarchive: _wrapIdArg("projects:unarchive", "projectId"),
  projectsListArchived: () => ipcRenderer.invoke("projects:listArchived"),
  projectsListArchiveEntries: () => ipcRenderer.invoke("projects:listArchiveEntries"),
  projectsRestoreArchive: (data) => ipcRenderer.invoke("projects:restoreArchive", data),
  projectsDeleteArchiveForever: (data) => ipcRenderer.invoke("projects:deleteArchiveForever", data),
  projectsDeleteForever: _wrapIdArg("projects:deleteForever", "projectId"),

  // ============================================================
  // Besprechungen
  // ============================================================
  meetingsListByProject: (projectId) => ipcRenderer.invoke("meetings:listByProject", projectId),
  meetingsCreate: (data) => ipcRenderer.invoke("meetings:create", data),
  meetingsClose: (meetingId) => ipcRenderer.invoke("meetings:close", meetingId),
  meetingsUpdateTitle: (data) => ipcRenderer.invoke("meetings:updateTitle", data),
  meetingsListProjectTasks: (payload) => {
    if (payload && typeof payload === "object") {
      return ipcRenderer.invoke("meetings:listProjectTasks", payload);
    }
    return ipcRenderer.invoke("meetings:listProjectTasks", { projectId: payload });
  },

  // ============================================================
  // TOPs
  // ============================================================
  topsListByMeeting: (meetingId) => ipcRenderer.invoke("tops:listByMeeting", meetingId),
  topsListByProject: (projectId) => ipcRenderer.invoke("tops:listByProject", projectId),
  topsCreate: (data) => ipcRenderer.invoke("tops:create", data),
  topsMove: (data) => ipcRenderer.invoke("tops:move", data),
  topsDelete: (data) => ipcRenderer.invoke("tops:delete", data),
  topsMarkTrashed: (data) => ipcRenderer.invoke("tops:markTrashed", data),
  topsPurgeTrashedByMeeting: (data) => ipcRenderer.invoke("tops:purgeTrashedByMeeting", data),
  topsPurgeTrashedGlobal: () => ipcRenderer.invoke("tops:purgeTrashedGlobal"),
  topsShiftLeft: (data) => ipcRenderer.invoke("tops:shiftLeft", data),
  topsShiftRight: (data) => ipcRenderer.invoke("tops:shiftRight", data),
  meetingTopsUpdate: (data) => ipcRenderer.invoke("meetingTops:update", data),
  meetingTopsFixNumberGap: (data) => ipcRenderer.invoke("meetingTops:fixNumberGap", data),

  // ============================================================
  // Audio / KI
  // ============================================================
  audioImport: (data) => ipcRenderer.invoke("audio:import", data),
  audioTranscribe: (data) => ipcRenderer.invoke("audio:transcribe", data),
  audioTranscribeBlob: (data) => ipcRenderer.invoke("audio:transcribeBlob", data),
  audioAnalyze: (data) => ipcRenderer.invoke("audio:analyze", data),
  audioGetSuggestions: (data) => ipcRenderer.invoke("audio:getSuggestions", data),
  audioCreateDemoSuggestion: (data) => ipcRenderer.invoke("audio:createDemoSuggestion", data),
  audioApplySuggestion: (data) => ipcRenderer.invoke("audio:applySuggestion", data),
  audioRejectSuggestion: (data) => ipcRenderer.invoke("audio:rejectSuggestion", data),
  audioWhisperModelsStatus: () => ipcRenderer.invoke("audio:whisperModelsStatus"),
  audioTermCorrectionsList: (data) => ipcRenderer.invoke("audio:termCorrectionsList", data),
  audioTermCorrectionUpsert: (data) => ipcRenderer.invoke("audio:termCorrectionUpsert", data),

  // ============================================================
  // GLOBAL Firmen
  // ============================================================
  firmsListGlobal: () => ipcRenderer.invoke("firms:listGlobal"),
  firmsCreateGlobal: (data) => ipcRenderer.invoke("firms:createGlobal", data),
  firmsUpdateGlobal: (data) => ipcRenderer.invoke("firms:updateGlobal", data),
  firmsDeleteGlobal: (firmId) => ipcRenderer.invoke("firms:deleteGlobal", firmId),

  // Zentrales, typisiertes Firmenverzeichnis. Bestehende APIs bleiben erhalten.
  firmDirectoryGet: (data) => ipcRenderer.invoke("firmDirectory:get", data),
  firmDirectoryListAll: (data) => ipcRenderer.invoke("firmDirectory:listAll", data),
  firmDirectoryListProjectParticipants: (data) =>
    ipcRenderer.invoke("firmDirectory:listProjectParticipants", data),
  firmDirectoryListCustomers: (data) => ipcRenderer.invoke("firmDirectory:listCustomers", data),
  firmDirectoryListPersons: (data) => ipcRenderer.invoke("firmDirectory:listPersons", data),
  firmDirectoryCreate: (data) => ipcRenderer.invoke("firmDirectory:create", data),
  firmDirectoryUpdate: (data) => ipcRenderer.invoke("firmDirectory:update", data),
  firmDirectoryCheckUseChange: (data) => ipcRenderer.invoke("firmDirectory:checkUseChange", data),
  firmDirectorySetUses: (data) => ipcRenderer.invoke("firmDirectory:setUses", data),
  firmDirectoryPrepareLocalToGlobal: (data) =>
    ipcRenderer.invoke("firmDirectory:prepareLocalToGlobal", data),

  // ============================================================
  // Rechnung: Grunddaten und Belegkopf
  // ============================================================
  rechnungDefaults: () => ipcRenderer.invoke("rechnung:defaults"),
  rechnungList: () => ipcRenderer.invoke("rechnung:list"),
  rechnungListManagement: () => ipcRenderer.invoke("rechnung:listManagement"),
  rechnungGet: (id) => ipcRenderer.invoke("rechnung:get", { id }),
  rechnungCreateDraft: (header) => ipcRenderer.invoke("rechnung:createDraft", header),
  rechnungUpdateDraft: (id, header) => ipcRenderer.invoke("rechnung:updateDraft", { id, header }),
  rechnungDeleteDraft: (id) => ipcRenderer.invoke("rechnung:deleteDraft", { id }),
  rechnungPreviewDraft: (id, header) => ipcRenderer.invoke("rechnung:previewDraft", { id, header }),
  rechnungBookDraft: (id, header) => ipcRenderer.invoke("rechnung:bookDraft", { id, header }),
  rechnungListPayments: (invoiceId) => ipcRenderer.invoke("rechnung:listPayments", { invoiceId }),
  rechnungRecordPayment: (invoiceId, payment) => ipcRenderer.invoke("rechnung:recordPayment", { invoiceId, payment }),
  rechnungCorrectPayment: (invoiceId, paymentId, payment) => ipcRenderer.invoke("rechnung:correctPayment", { invoiceId, paymentId, payment }),
  rechnungPaymentSummary: (invoiceId) => ipcRenderer.invoke("rechnung:paymentSummary", { invoiceId }),
  rechnungDevNumberSequenceGet: (sequenceKey) => ipcRenderer.invoke("rechnung:devNumberSequenceGet", { sequenceKey }),
  rechnungDevNumberSequenceReset: (sequenceKey) => ipcRenderer.invoke("rechnung:devNumberSequenceReset", { sequenceKey }),
  rechnungListCustomers: () => ipcRenderer.invoke("rechnung:listCustomers"),
  rechnungListProjects: () => ipcRenderer.invoke("rechnung:listProjects"),

  // ============================================================
  // GLOBAL Mitarbeiter (Persons) je Firma
  // ============================================================
  personsListByFirm: (firmId) => ipcRenderer.invoke("persons:listByFirm", firmId),
  personsCreate: (data) => ipcRenderer.invoke("persons:create", data),
  personsUpdate: (data) => ipcRenderer.invoke("persons:update", data),
  personsDelete: (personId) => ipcRenderer.invoke("persons:delete", personId),

  // ============================================================
  // PROJEKT Firmen (lokal) + PROJEKT Mitarbeiter (lokal)
  // ============================================================
  projectFirmsListByProject: (projectId) => ipcRenderer.invoke("projectFirms:listByProject", projectId),
  projectFirmsCreate: (data) => ipcRenderer.invoke("projectFirms:create", data),
  projectFirmsUpdate: (data) => ipcRenderer.invoke("projectFirms:update", data),
  projectFirmsDelete: (projectFirmId) => ipcRenderer.invoke("projectFirms:delete", projectFirmId),

  projectPersonsListByProjectFirm: (projectFirmId) => ipcRenderer.invoke("projectPersons:listByProjectFirm", projectFirmId),
  projectPersonsCreate: (data) => ipcRenderer.invoke("projectPersons:create", data),
  projectPersonsUpdate: (data) => ipcRenderer.invoke("projectPersons:update", data),
  projectPersonsDelete: (projectPersonId) => ipcRenderer.invoke("projectPersons:delete", projectPersonId),

  // ============================================================
  // Projekt ↔ Global-Firma Zuordnung (nur Zuordnung)
  // ============================================================
  projectFirmsListFirmCandidatesByProject: (projectId) => ipcRenderer.invoke("projectFirms:listFirmCandidatesByProject", projectId),
  projectFirmsAssignGlobalFirm: (data) => ipcRenderer.invoke("projectFirms:assignGlobalFirm", data),
  projectFirmsUnassignGlobalFirm: (data) => ipcRenderer.invoke("projectFirms:unassignGlobalFirm", data),
  projectFirmsSetActive: (data) => ipcRenderer.invoke("projectFirms:setActive", data),
  projectFirmsCanDeactivate: (data) => ipcRenderer.invoke("projectFirms:canDeactivate", data),

  // ============================================================
  // Kandidaten & Teilnehmer (INVARIANT)
  // ============================================================
  projectParticipantsPool: _wrapIdArg("projectParticipants:pool", "projectId"),
  projectCandidatesList: (data) => ipcRenderer.invoke("projectCandidates:list", data),
  projectCandidatesSet: (data) => ipcRenderer.invoke("projectCandidates:set", data),
  projectCandidatesSetActive: (data) => ipcRenderer.invoke("projectCandidates:setActive", data),

  meetingParticipantsList: (data) => ipcRenderer.invoke("meetingParticipants:list", data),
  meetingParticipantsSet: (data) => ipcRenderer.invoke("meetingParticipants:set", data),

  // ============================================================
  // Druck (HTML -> PDF)
  // ============================================================
  printOpenHtmlPreview: (data) => ipcRenderer.invoke("print:openHtmlPreview", data),
  printHtmlToPdf: (data) => ipcRenderer.invoke("print:htmlToPdf", data),
  printPdf: (data) => ipcRenderer.invoke("print:toPdf", data),
  printPdfAndOpen: (data) => ipcRenderer.invoke("print:toPdfAndOpen", data),
  printPdfAndPreviewInternal: (data) => ipcRenderer.invoke("print:toPdfAndPreviewInternal", data),

  // ============================================================
  // Tabellenlayouts (intern)
  // ============================================================
  tableLayoutsGetMany: (data) => ipcRenderer.invoke("tableLayouts:getMany", data),
  tableLayoutsGetOne: (data) => ipcRenderer.invoke("tableLayouts:getOne", data),
  tableLayoutsSave: (data) => ipcRenderer.invoke("tableLayouts:save", data),
  tableLayoutsReset: (data) => ipcRenderer.invoke("tableLayouts:reset", data),
  tableLayoutsListDefinitions: () => ipcRenderer.invoke("tableLayouts:listDefinitions"),

  // ============================================================
  // App
  // ============================================================
  appQuit: () => ipcRenderer.invoke("app:quit"),
  appGetBundledIconPath: () => ipcRenderer.invoke("app:getBundledIconPath"),
  appIsWindows: () => ipcRenderer.invoke("app:isWindows"),
  appIsPackaged: () => ipcRenderer.invoke("app:isPackaged"),
  appGetBuildChannel: () => ipcRenderer.invoke("app:getBuildChannel"),
  appGetVersion: () => ipcRenderer.invoke("app:getVersion"),
  appGetCustomerSetup: () => ipcRenderer.invoke("app:get-customer-setup"),
  openQuickAssist: () => ipcRenderer.invoke("app:openQuickAssist"),

  // ✅ Build-Kanal Umschalten (schreibt channel.json im Repo) – nur DEV-Umgebung
  devBuildChannelGet: () => ipcRenderer.invoke("dev:buildChannelGet"),
  devBuildChannelSet: (payload) => ipcRenderer.invoke("dev:buildChannelSet", payload),

  // Versionierung (DEV)
  devVersionGet: () => ipcRenderer.invoke("dev:versionGet"),
  devVersionBump: (payload) => ipcRenderer.invoke("dev:versionBump", payload),
  devVersionSet: (payload) => ipcRenderer.invoke("dev:versionSet", payload),
  devGetStoragePreview: (payload) => ipcRenderer.invoke("dev:getStoragePreview", payload),

  // ============================================================
  // App-Kern: globale App-Settings
  // ============================================================
  appSettingsGetMany: (keys) => ipcRenderer.invoke("appSettings:getMany", keys),
  appSettingsSetMany: (data) => ipcRenderer.invoke("appSettings:setMany", data),
  appSettingsOnChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const handler = (_event, payload) => callback(payload || {});
    ipcRenderer.on("app-settings:changed", handler);
    return () => ipcRenderer.removeListener("app-settings:changed", handler);
  },
  securitySettingsPinStatus: () => ipcRenderer.invoke("security:settingsPinStatus"),
  securitySettingsPinSet: (data) => ipcRenderer.invoke("security:settingsPinSet", data),
  securitySettingsPinDisable: (data) => ipcRenderer.invoke("security:settingsPinDisable", data),

  // ============================================================
  // Projektbezogene Settings
  // ============================================================
  projectSettingsGetMany: (data) => ipcRenderer.invoke("projectSettings:getMany", data),
  projectSettingsSetMany: (data) => ipcRenderer.invoke("projectSettings:setMany", data),

  // ============================================================
  // Settings-UI / Werkzeugfunktionen / Uebergangslogik
  // ============================================================
  settingsCategoriesDelete: (data) => ipcRenderer.invoke("settings:categoriesDelete", data),
  selectDirectory: (data) => ipcRenderer.invoke("dialog:selectDirectory", data),
  selectCsvFile: (data) => ipcRenderer.invoke("dialog:selectCsvFile", data),
  dictionaryListFiles: (data) => ipcRenderer.invoke("dictionary:listFiles", data),
  dictionaryExtractTermsFromFile: (data) => ipcRenderer.invoke("dictionary:extractTermsFromFile", data),
  dictionaryApplyScanResults: (data) => ipcRenderer.invoke("dictionary:applyScanResults", data),
  dictionaryListSuggestions: () => ipcRenderer.invoke("dictionary:listSuggestions"),
  dictionaryUpdateSuggestionStatus: (data) => ipcRenderer.invoke("dictionary:updateSuggestionStatus", data),
  dictionaryListTerms: () => ipcRenderer.invoke("dictionary:listTerms"),
  dictionarySetTermActive: (data) => ipcRenderer.invoke("dictionary:setTermActive", data),
  dictionaryDeleteTerm: (data) => ipcRenderer.invoke("dictionary:deleteTerm", data),
  dictionaryListEntries: (data) => ipcRenderer.invoke("dictionary:listEntries", data),
  dictionaryCreateEntry: (data) => ipcRenderer.invoke("dictionary:createEntry", data),
  dictionaryUpdateEntry: (data) => ipcRenderer.invoke("dictionary:updateEntry", data),
  dictionarySetEntryActive: (data) => ipcRenderer.invoke("dictionary:setEntryActive", data),
  dictionaryDeleteEntry: (data) => ipcRenderer.invoke("dictionary:deleteEntry", data),
  dictionaryApplyToText: (data) => ipcRenderer.invoke("dictionary:applyToText", data),

  dbDiagnosticsGet: () => ipcRenderer.invoke("db:diagnostics"),
  dbLegacyImport: () => ipcRenderer.invoke("db:legacyImport"),
  dbOpenFolder: (data) => ipcRenderer.invoke("db:openFolder", data),

  firmsImportParseCsv: (data) => ipcRenderer.invoke("firms:importParseCsv", data),
  firmsImportApplyStaging: (data) => ipcRenderer.invoke("firms:importApplyStaging", data),
  personsImportParseCsv: (data) => ipcRenderer.invoke("persons:importParseCsv", data),
  personsImportApplyStaging: (data) => ipcRenderer.invoke("persons:importApplyStaging", data),

  // ============================================================
  // App-Kern: zentrale Lizenzstatus-/Installationszugaenge
  // ============================================================
  licenseGetStatus: () => ipcRenderer.invoke("license:get-status"),
  licenseGetDiagnostics: () => ipcRenderer.invoke("license:get-diagnostics"),
  licenseImport: (data) => ipcRenderer.invoke("license:import", data),
  licenseDelete: () => ipcRenderer.invoke("license:delete"),
  licenseGetInstalled: () => ipcRenderer.invoke("license:get-installed"),
  licenseCreateRequest: (data) => ipcRenderer.invoke("license:create-request", data),

  // DEV: Audio Override Status
  devAudioUnlockStatus: () => ipcRenderer.invoke("dev:audioUnlockStatus"),
  // DEV: Audio Suggestions (legacy) Toggle
  devAudioSuggestionsEnabled: () => ipcRenderer.invoke("dev:audioSuggestionsEnabled"),

  // ============================================================
  // Editor
  // ============================================================
  editorOpen: (data) => ipcRenderer.invoke("editor:open", data),
  editorGetInit: () => ipcRenderer.invoke("editor:getInit"),
  editorDone: (data) => ipcRenderer.invoke("editor:done", data),

  // ============================================================
  // Nutzerdaten (DB)
  // ============================================================
  userProfileGet: () => ipcRenderer.invoke("userProfile:get"),
  userProfileUpsert: (data) => ipcRenderer.invoke("userProfile:upsert", data),

  // ============================================================
  // Restarbeiten
  // ============================================================
  restarbeitenListByProject: (data) => ipcRenderer.invoke("restarbeiten:listByProject", data),
  restarbeitenGetProjectSettings: (data) => ipcRenderer.invoke("restarbeiten:getProjectSettings", data),
  restarbeitenCreateItem: (data) => ipcRenderer.invoke("restarbeiten:createItem", data),
  restarbeitenUpdateItem: (data) => ipcRenderer.invoke("restarbeiten:updateItem", data),
  restarbeitenSoftDeleteItem: (data) => ipcRenderer.invoke("restarbeiten:softDeleteItem", data),
  restarbeitenListAttachments: (data) => ipcRenderer.invoke("restarbeiten:listAttachments", data),
  restarbeitenListNotes: (data) => ipcRenderer.invoke("restarbeiten:listNotes", data),
  restarbeitenCreateNote: (data) => ipcRenderer.invoke("restarbeiten:createNote", data),
  restarbeitenSetPrimaryAttachment: (data) => ipcRenderer.invoke("restarbeiten:setPrimaryAttachment", data),
  restarbeitenImportAttachments: (data) => ipcRenderer.invoke("restarbeiten:importAttachments", data),
  restarbeitenDeleteAttachment: (data) => ipcRenderer.invoke("restarbeiten:deleteAttachment", data),

});

const UI_EDITOR_MAX_MESSAGE_BYTES = 1024 * 1024;
const UI_EDITOR_TARGET_EVENTS = new Set(["targetSelectionChanged", "registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]);

function _uiEditorPayload(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} ist ungültig.`);
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > UI_EDITOR_MAX_MESSAGE_BYTES) throw new RangeError(`${label} ist zu groß.`);
  return value;
}

function _uiEditorListener(channel, callback) {
  if (typeof callback !== "function") throw new TypeError("UI-Editor-Listener fehlt.");
  const listener = (_event, message) => callback(_uiEditorPayload(message, "UI-Editor-Nachricht"));
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld("uiEditor", Object.freeze({
  getDiagnosticMode: () => ipcRenderer.invoke("uiEditor:getDiagnosticMode"),
  open: (registration) => ipcRenderer.invoke("uiEditor:open", _uiEditorPayload(registration, "UI-Editor-Registrierung")),
  close: () => ipcRenderer.invoke("uiEditor:close"),
  getStatus: () => ipcRenderer.invoke("uiEditor:getStatus"),
  preparePdfContext: (context) => ipcRenderer.invoke("uiEditor:preparePdfContext", _uiEditorPayload(context, "PDF-Dokumentkontext")),
  loadStartupLayout: (registration) => ipcRenderer.invoke("uiEditor:loadStartupLayout", _uiEditorPayload(registration, "UI-Editor-Startregistrierung")),
  completeStartupLayout: (result) => ipcRenderer.invoke("uiEditor:completeStartupLayout", _uiEditorPayload(result, "UI-Editor-Startlayout-Ergebnis")),
  respond: (message) => ipcRenderer.invoke("uiEditor:respond", _uiEditorPayload(message, "UI-Editor-Antwort")),
  sendTargetEvent: (message) => {
    const payload = _uiEditorPayload(message, "UI-Editor-Ereignis");
    if (!UI_EDITOR_TARGET_EVENTS.has(payload.action)) throw new TypeError("UI-Editor-Ereignis ist nicht erlaubt.");
    return ipcRenderer.invoke("uiEditor:targetEvent", payload);
  },
  onRequest: (callback) => _uiEditorListener("uiEditor:request", callback),
  onEvent: (callback) => _uiEditorListener("uiEditor:event", callback),
}));

contextBridge.exposeInMainWorld("bbmPrint", {
  printPdf: (data) => ipcRenderer.invoke("print:toPdf", data),
  printPdfAndOpen: (data) => ipcRenderer.invoke("print:toPdfAndOpen", data),
  printPdfAndPreviewInternal: (data) => ipcRenderer.invoke("print:toPdfAndPreviewInternal", data),
  findStoredProtocolPdf: (data) => ipcRenderer.invoke("protocol:findStoredPdf", data),
  listStoredFirmsPdfs: (data) => ipcRenderer.invoke("firms:listStoredPdfs", data),
  listStoredProjectPdfs: (data) => ipcRenderer.invoke("print:listStoredProjectPdfs", data),
});

// Zusatzdienste mit eigener Renderer-Bruecke:
// Mail und Projekt-Transfer sind technische Addons, keine Views.
contextBridge.exposeInMainWorld("bbmMail", {
  createOutlookDraft: (payload) => ipcRenderer.invoke("mail:createOutlookDraft", payload),
});
contextBridge.exposeInMainWorld("bbmProjectTransfer", {
  exportProject: (payload) => ipcRenderer.invoke("projectTransfer:export", payload),
  importProject: (filePath) => ipcRenderer.invoke("projectTransfer:import", filePath),
  listExports: () => ipcRenderer.invoke("projectTransfer:listExports"),
  importFromExport: (payload) => ipcRenderer.invoke("projectTransfer:importFromExport", payload),
  openExportFolder: () => ipcRenderer.invoke("projectTransfer:openExportFolder"),
});
