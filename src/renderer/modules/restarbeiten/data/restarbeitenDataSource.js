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
  delete out.deleted_at;
  delete out.running_number;
  return out;
}

function buildUpdatePayload(id, patch = {}) {
  const safePatch = { ...patch };
  delete safePatch.deleted_at;
  const rid = String(id ?? "").trim();
  if (!rid) throw new Error("Restarbeiten-Datenzugriff: id fehlt.");
  return { id: rid, patch: safePatch };
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


function extractRestarbeitId(restarbeitId) {
  const normalized = String(restarbeitId ?? "").trim();
  if (!normalized) throw new Error("Restarbeiten-Datenzugriff: restarbeitId fehlt.");
  return normalized;
}

function extractAttachmentId(attachmentId) {
  const normalized = String(attachmentId ?? "").trim();
  if (!normalized) throw new Error("Restarbeiten-Datenzugriff: attachmentId fehlt.");
  return normalized;
}


export async function listRestarbeitAttachments(restarbeitId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenListAttachments !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenListAttachments fehlt.");
  }
  const rid = extractRestarbeitId(restarbeitId);
  const response = await callAndNormalize(bbmDb.restarbeitenListAttachments, { restarbeitId: rid }, "attachments-liste");
  return Array.isArray(response.attachments) ? response.attachments : [];
}

export async function setPrimaryRestarbeitAttachment(restarbeitId, attachmentId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenSetPrimaryAttachment !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenSetPrimaryAttachment fehlt.");
  }
  const rid = extractRestarbeitId(restarbeitId);
  const aid = extractAttachmentId(attachmentId);
  await callAndNormalize(
    bbmDb.restarbeitenSetPrimaryAttachment,
    { restarbeitId: rid, attachmentId: aid },
    "attachments-hauptfoto"
  );
  return true;
}


export async function importRestarbeitAttachments(restarbeitId, projectId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenImportAttachments !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenImportAttachments fehlt.");
  }
  const rid = extractRestarbeitId(restarbeitId);
  const pid = extractProjectId(projectId);
  const response = await bbmDb.restarbeitenImportAttachments({ restarbeitId: rid, projectId: pid });
  if (!response || typeof response !== "object") throw new Error("Restarbeiten-attachments-import: ungueltige IPC-Antwort.");
  if (response.ok !== true) throw new Error(response.error || "Fotos konnten nicht importiert werden.");
  return {
    canceled: response.canceled === true,
    attachments: Array.isArray(response.attachments) ? response.attachments : [],
  };
}

export async function deleteRestarbeitAttachment(restarbeitId, attachmentId) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenDeleteAttachment !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenDeleteAttachment fehlt.");
  }
  const rid = extractRestarbeitId(restarbeitId);
  const aid = extractAttachmentId(attachmentId);
  const response = await bbmDb.restarbeitenDeleteAttachment({ restarbeitId: rid, attachmentId: aid });
  if (!response || typeof response !== "object") throw new Error("Restarbeiten-attachments-delete: ungueltige IPC-Antwort.");
  if (response.ok !== true) throw new Error(response.error || "Foto konnte nicht entfernt werden.");
  return {
    attachments: Array.isArray(response.attachments) ? response.attachments : [],
    warning: typeof response.warning === "string" && response.warning.trim() ? response.warning.trim() : null,
  };
}


export async function softDeleteRestarbeitItem(id) {
  const bbmDb = requireBbmDb();
  if (typeof bbmDb.restarbeitenSoftDeleteItem !== "function") {
    throw new Error("Restarbeiten-Datenzugriff nicht verfuegbar: restarbeitenSoftDeleteItem fehlt.");
  }
  const rid = String(id ?? "").trim();
  if (!rid) throw new Error("Restarbeiten-Datenzugriff: id fehlt.");
  const response = await callAndNormalize(bbmDb.restarbeitenSoftDeleteItem, { id: rid }, "soft-delete");
  return response.item && typeof response.item === "object" ? response.item : null;
}
