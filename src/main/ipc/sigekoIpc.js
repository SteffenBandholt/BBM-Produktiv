const { createSigekoService } = require("../domain/sigeko/SigekoService");

const { createSigekoProjectService } = require("../domain/sigeko/SigekoProjectService");
const { createAuthorityService } = require("../domain/sigeko/AuthorityService");
const { createProjectAuthorityService } = require("../domain/sigeko/ProjectAuthorityService");
const { createReadinessService } = require("../domain/sigeko/ReadinessService");
const { createPreNotificationService } = require("../domain/sigeko/PreNotificationService");
const { getPreNotificationDocumentService } = require("../domain/sigeko/PreNotificationDocumentService");
const { createPreNotificationWorkflowService } = require("../domain/sigeko/PreNotificationWorkflowService");

function registerSigekoIpc({ ipcMain, service = createSigekoService(), projectService = createSigekoProjectService(),
  authorityService = createAuthorityService(), projectAuthorityService = createProjectAuthorityService(),
  readinessService = createReadinessService({ projectService, projectAuthorityService }),
  preNotificationService = createPreNotificationService({ projectService, projectAuthorityService }),
  documentService = getPreNotificationDocumentService(), workflowService = createPreNotificationWorkflowService() } = {}) {
  for (const operation of ["getPreNotificationRecipients", "savePreNotificationRecipients", "getPreNotificationCompletion", "savePreNotificationCompletion", "openSimplePreNotificationMail", "getPreNotificationWorkflow", "preparePreNotificationMail", "importPreNotificationSignedReturn",
    "openPreNotificationSignedReturn", "openPreNotificationMailDraft"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await workflowService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_WORKFLOW_ERROR" }; }
    });
  }
  for (const operation of ["previewPreNotificationPdf", "createPreNotificationPdf", "listPreNotificationDocuments",
    "openPreNotificationDocumentFile", "preparePreNotificationPdfEditor"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await documentService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_DOCUMENT_ERROR" }; }
    });
  }
  for (const operation of ["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await service[operation](payload) }; }
      catch (error) {
        return { ok: false, error: error?.message || String(error), code: error?.code || "STORAGE_ERROR", path: error?.path || null };
      }
    });
  }
  for (const operation of ["getCoordinatorProfile", "saveCoordinatorProfile", "getProjectData", "saveProjectData"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await projectService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
    });
  }
  ipcMain.handle("sigeko:getReadiness", async (_event, payload) => {
    try { return { ok: true, data: await readinessService.getReadiness(payload) }; }
    catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
  });
  for (const operation of ["listAuthorityRecords", "getAuthorityRecord", "saveAuthorityRecord", "confirmAuthorityRecord", "markAuthorityUncertain"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await authorityService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
    });
  }
  for (const operation of ["getProjectAuthorities", "assignProjectAuthority", "applyKnownProjectAuthorities"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await projectAuthorityService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
    });
  }
  for (const operation of ["getPreNotification", "savePreNotification"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await preNotificationService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
    });
  }
  ipcMain.handle("sigeko:getModuleInfo", () => ({
    ok: true,
    module: service.getModuleInfo(),
  }));
}

module.exports = Object.freeze({ registerSigekoIpc });
