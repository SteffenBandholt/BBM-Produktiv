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
