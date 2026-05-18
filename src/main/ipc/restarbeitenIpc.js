const { dialog, app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const repo = require("../db/restarbeitenRepo");
const { resolveProjectFolderName, sanitizeDirName, buildStoragePreviewPaths } = require("./projectStoragePaths");

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


function detectMimeType(filePath) {
  const ext = String(path.extname(filePath) || "").toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function sanitizeBaseFileName(name) {
  const raw = String(name || "").trim() || "foto";
  return sanitizeDirName(raw).replace(/\s+/g, "_");
}

function resolveRestarbeitenPhotosDir(payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  const projectId = normalizeProjectId(source);
  const baseDir = String(source.baseDir || app.getPath("downloads") || "").trim();
  const project = source.project && typeof source.project === "object" ? source.project : {};
  const fallbackProject = {
    project_number: projectId || project.project_number || project.projectNumber || project.number || "",
    short: project.short || project.name || (projectId ? `Projekt-${projectId}` : "Projekt"),
    name: project.name || "",
  };
  const storage = buildStoragePreviewPaths({ baseDir, project: { ...project, ...fallbackProject } });
  const projectBaseDir = path.dirname(storage.protocolsDir);
  return path.join(projectBaseDir, "Restarbeiten", "Fotos");
}

function uniqueDestinationFilePath(targetDir, fileName) {
  const ext = path.extname(fileName) || ".jpg";
  const stem = fileName.slice(0, fileName.length - ext.length);
  let candidate = path.join(targetDir, fileName);
  if (!fs.existsSync(candidate)) return candidate;
  for (let i = 2; i < 5000; i += 1) {
    candidate = path.join(targetDir, `${stem}_${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  return path.join(targetDir, `${stem}_${Date.now()}${ext}`);
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
      const includeDeleted = toBool(payload && typeof payload === "object" ? payload.includeDeleted : false, false);
      const items = repo.listRestarbeitItems(projectId, { includeArchived, includeDeleted });
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


  ipcMain.handle("restarbeiten:softDeleteItem", async (_event, payload) => {
    try {
      const source = payload && typeof payload === "object" ? payload : {};
      const id = String(source.id ?? source.restarbeitId ?? source.restarbeit_id ?? "").trim();
      if (!id) throw new Error("id erforderlich");
      const item = repo.softDeleteRestarbeitItem(id);
      return { ok: true, item };
    } catch (error) {
      return { ok: false, error: error?.message || "Restarbeit konnte nicht geloescht werden." };
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


  ipcMain.handle("restarbeiten:importAttachments", async (_event, payload) => {
    try {
      const source = payload && typeof payload === "object" ? payload : {};
      const restarbeitId = normalizeRestarbeitId(source);
      const projectId = normalizeProjectId(source);
      if (!restarbeitId) throw new Error("restarbeitId erforderlich");
      if (!projectId) throw new Error("projectId erforderlich");

      const existing = repo.listRestarbeitAttachments(restarbeitId);
      const existingAttachments = Array.isArray(existing) ? existing : [];
      if (existingAttachments.length >= 3) return { ok: false, error: "Maximal 3 Fotos pro Restarbeit erlaubt." };

      const result = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "Bilder", extensions: ["jpg", "jpeg", "png", "webp"] }],
      });

      if (result?.canceled) {
        return { ok: true, canceled: true, attachments: existingAttachments };
      }

      const maxFiles = Number(source.maxFiles) > 0 ? Math.min(3, Number(source.maxFiles)) : 3;
      const capacity = Math.max(0, Math.min(3, maxFiles) - existingAttachments.length);
      const selected = Array.isArray(result?.filePaths) ? result.filePaths.slice(0, capacity) : [];

      const targetDir = resolveRestarbeitenPhotosDir(source);
      fs.mkdirSync(targetDir, { recursive: true });

      const now = Date.now();
      for (let index = 0; index < selected.length; index += 1) {
        const src = String(selected[index] || "").trim();
        if (!src) continue;
        const originalBase = sanitizeBaseFileName(path.basename(src, path.extname(src)));
        const ext = String(path.extname(src) || "").toLowerCase();
        const fileName = `${sanitizeBaseFileName(restarbeitId)}_${now}_${index + 1}_${originalBase}${ext}`;
        const destPath = uniqueDestinationFilePath(targetDir, fileName);
        fs.copyFileSync(src, destPath);
        const stats = fs.statSync(destPath);

        repo.addRestarbeitAttachment({
          restarbeit_id: restarbeitId,
          project_id: projectId,
          file_path: destPath,
          file_name: path.basename(destPath),
          original_file_name: path.basename(src),
          mime_type: detectMimeType(destPath),
          file_size: Number(stats?.size || 0),
        });
      }

      const attachments = repo.listRestarbeitAttachments(restarbeitId);
      return { ok: true, canceled: false, attachments: Array.isArray(attachments) ? attachments : [] };
    } catch (error) {
      return { ok: false, error: error?.message || "Fotos konnten nicht importiert werden." };
    }
  });

  ipcMain.handle("restarbeiten:deleteAttachment", async (_event, payload) => {
    try {
      const source = payload && typeof payload === "object" ? payload : {};
      const restarbeitId = normalizeRestarbeitId(source);
      const attachmentId = normalizeAttachmentId(source);
      if (!restarbeitId) throw new Error("restarbeitId erforderlich");
      if (!attachmentId) throw new Error("attachmentId erforderlich");

      const deleted = repo.deleteRestarbeitAttachment(restarbeitId, attachmentId);
      const warnings = [];

      for (const filePath of [deleted?.file_path, deleted?.thumbnail_path]) {
        const normalized = String(filePath || "").trim();
        if (!normalized) continue;
        try {
          fs.rmSync(normalized, { force: true });
        } catch (error) {
          warnings.push(`Datei konnte nicht entfernt werden (${normalized}): ${error?.message || "Unbekannter Fehler"}`);
        }
      }

      const attachments = repo.listRestarbeitAttachments(restarbeitId);
      return {
        ok: true,
        attachments: Array.isArray(attachments) ? attachments : [],
        ...(warnings.length ? { warning: warnings.join(" | ") } : {}),
      };
    } catch (error) {
      return { ok: false, error: error?.message || "Attachment konnte nicht entfernt werden." };
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

module.exports = { registerRestarbeitenIpc, resolveRestarbeitenPhotosDir, detectMimeType };
