const repo = require("../db/restarbeitenRepo");

function normalizeProjectId(payload) {
  if (payload && typeof payload === "object") {
    const candidate = payload.projectId ?? payload.project_id ?? payload.id;
    return String(candidate ?? "").trim();
  }
  return String(payload ?? "").trim();
}



function normalizeRestarbeitId(payload) {
  if (payload && typeof payload === "object") {
    const candidate = payload.restarbeitId ?? payload.restarbeit_id ?? payload.id;
    return String(candidate ?? "").trim();
  }
  return String(payload ?? "").trim();
}

function normalizeAttachmentId(payload) {
  if (payload && typeof payload === "object") {
    const candidate = payload.attachmentId ?? payload.attachment_id ?? payload.id;
    return String(candidate ?? "").trim();
  }
  return String(payload ?? "").trim();
}

function toBool(value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "ja"].includes(normalized)) return true;
  if (["0", "false", "no", "nein"].includes(normalized)) return false;
  return fallback;
}

function registerRestarbeitenIpc({ ipcMain }) {
  ipcMain.handle("restarbeiten:listByProject", async (_event, payload) => {
    try {
      const projectId = normalizeProjectId(payload);
      if (!projectId) throw new Error("projectId erforderlich");
      const includeArchived = toBool(payload && typeof payload === "object" ? payload.includeArchived : false, false);
      const items = repo.listRestarbeitItems(projectId, { includeArchived });
      return { ok: true, items: Array.isArray(items) ? items : [] };
    } catch (error) {
      return { ok: false, error: error?.message || "Restarbeiten konnten nicht geladen werden." };
    }
  });

  ipcMain.handle("restarbeiten:getProjectSettings", async (_event, payload) => {
    try {
      const projectId = normalizeProjectId(payload);
      if (!projectId) throw new Error("projectId erforderlich");
      const settings = repo.getRestarbeitProjectSettings(projectId) || null;
      return { ok: true, settings };
    } catch (error) {
      return { ok: false, error: error?.message || "Restarbeiten-Einstellungen konnten nicht geladen werden." };
    }
  });

  ipcMain.handle("restarbeiten:createItem", async (_event, payload) => {
    try {
      const projectId = normalizeProjectId(payload);
      if (!projectId) throw new Error("projectId erforderlich");
      const data = payload && typeof payload === "object" ? { ...payload } : {};
      delete data.projectId;
      delete data.project_id;
      delete data.id;
      const item = repo.createRestarbeitItem(projectId, data);
      return { ok: true, item };
    } catch (error) {
      return { ok: false, error: error?.message || "Restarbeit konnte nicht angelegt werden." };
    }
  });

  ipcMain.handle("restarbeiten:updateItem", async (_event, payload) => {
    try {
      const source = payload && typeof payload === "object" ? payload : {};
      const id = String(source.id ?? source.restarbeitId ?? source.restarbeit_id ?? "").trim();
      if (!id) throw new Error("id erforderlich");
      const patch = source.patch && typeof source.patch === "object" ? source.patch : source;
      const item = repo.updateRestarbeitItem(id, patch);
      return { ok: true, item };
    } catch (error) {
      return { ok: false, error: error?.message || "Restarbeit konnte nicht gespeichert werden." };
    }
  });

  ipcMain.handle("restarbeiten:listAttachments", async (_event, payload) => {
    try {
      const restarbeitId = normalizeRestarbeitId(payload);
      if (!restarbeitId) throw new Error("restarbeitId erforderlich");
      const attachments = repo.listRestarbeitAttachments(restarbeitId);
      return { ok: true, attachments: Array.isArray(attachments) ? attachments : [] };
    } catch (error) {
      return { ok: false, error: error?.message || "Attachments konnten nicht geladen werden." };
    }
  });

  ipcMain.handle("restarbeiten:setPrimaryAttachment", async (_event, payload) => {
    try {
      const source = payload && typeof payload === "object" ? payload : {};
      const restarbeitId = normalizeRestarbeitId(source);
      const attachmentId = normalizeAttachmentId(source);
      if (!restarbeitId) throw new Error("restarbeitId erforderlich");
      if (!attachmentId) throw new Error("attachmentId erforderlich");
      repo.setPrimaryRestarbeitAttachment(restarbeitId, attachmentId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || "Hauptfoto konnte nicht gesetzt werden." };
    }
  });

}

module.exports = { registerRestarbeitenIpc };
