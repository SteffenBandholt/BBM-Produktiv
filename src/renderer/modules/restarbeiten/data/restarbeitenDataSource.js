function requireBbmDb() {
  if (!window || !window.bbmDb) {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: window.bbmDb fehlt.");
  }
  return window.bbmDb;
}

function extractProjectId(projectId) {
  const normalized = String(projectId ?? "").trim();
  if (!normalized) throw new Error("Restarbeiten-Datenzugriff: projectId fehlt.");
  return normalized;
}

async function callAndNormalize(callFn, payload, entityName) {
  const response = await callFn(payload);
  if (!response || typeof response !== "object") {
    throw new Error(`Restarbeiten-${entityName}: ungueltige IPC-Antwort.`);
  }
  if (response.ok !== true) {
    throw new Error(response.error || `Restarbeiten-${entityName} konnte nicht geladen werden.`);
  }
  return response;
}

function buildCreatePayload(projectId, payload = {}) {
  const pid = extractProjectId(projectId);
  const out = { ...payload, projectId: pid };
  delete out.project_id;
  delete out.id;
  return out;
}

function buildUpdatePayload(id, patch = {}) {
  const rid = String(id ?? "").trim();
  if (!rid) throw new Error("Restarbeiten-Datenzugriff: id fehlt.");
  return { id: rid, patch: { ...patch } };
}

export async function listRestarbeitenByProject(projectId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenListByProject !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenListByProject fehlt.");
  }
  const pid = extractProjectId(projectId);
  const response = await callAndNormalize(bbmDb.restarbeitenListByProject, { projectId: pid }, "liste");
  return Array.isArray(response.items) ? response.items : [];
}

export async function getRestarbeitenProjectSettings(projectId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenGetProjectSettings !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenGetProjectSettings fehlt.");
  }
  const pid = extractProjectId(projectId);
  const response = await callAndNormalize(bbmDb.restarbeitenGetProjectSettings, { projectId: pid }, "settings");
  return response.settings && typeof response.settings === "object" ? response.settings : {};
}

export async function listResponsibleProjectFirms(projectId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.projectFirmsListByProject !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: projectFirmsListByProject fehlt.");
  }
  const pid = extractProjectId(projectId);
  const response = await callAndNormalize(bbmDb.projectFirmsListByProject, pid, "firmenliste");
  const source = Array.isArray(response.list) ? response.list : Array.isArray(response.firms) ? response.firms : [];
  return source.filter((entry) => entry && typeof entry === "object");
}

export async function createRestarbeitItem(projectId, payload = {}) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenCreateItem !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenCreateItem fehlt.");
  }
  const response = await callAndNormalize(
    bbmDb.restarbeitenCreateItem,
    buildCreatePayload(projectId, payload),
    "create"
  );
  return response.item && typeof response.item === "object" ? response.item : null;
}

export async function updateRestarbeitItem(id, patch = {}) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenUpdateItem !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenUpdateItem fehlt.");
  }
  const response = await callAndNormalize(bbmDb.restarbeitenUpdateItem, buildUpdatePayload(id, patch), "update");
  return response.item && typeof response.item === "object" ? response.item : null;
}
