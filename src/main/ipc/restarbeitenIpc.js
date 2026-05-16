const repo = require("../db/restarbeitenRepo");

function normalizeProjectId(payload) {
  if (payload && typeof payload === "object") {
    const candidate = payload.projectId ?? payload.project_id ?? payload.id;
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
}

module.exports = { registerRestarbeitenIpc };
