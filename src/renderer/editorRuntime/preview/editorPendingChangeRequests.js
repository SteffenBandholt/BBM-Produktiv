import { getChangeRequestOperation } from "./editorPreviewOperations.js";
import {
  getPreviewTargetElementId,
  getPreviewTargetMode,
} from "./editorPreviewTargetModel.js";

export function removePendingChangeRequestsForTarget({
  state = {},
  targetNode = null,
  notify = null,
} = {}) {
  if (!Array.isArray(state.pendingChangeRequests)) return 0;
  const targetElementId = getPreviewTargetElementId(state, targetNode);
  if (!targetElementId) return 0;
  const previousCount = state.pendingChangeRequests.length;
  state.pendingChangeRequests = state.pendingChangeRequests.filter((request) => request?.targetElementId !== targetElementId);
  if (previousCount !== state.pendingChangeRequests.length && typeof notify === "function") notify(state);
  return previousCount - state.pendingChangeRequests.length;
}

export function upsertPreviewChangeRequest({
  state = {},
  registry = {},
  registryElement = null,
  targetNode = null,
  operation = "",
  payload = {},
  getNextChangeRequestId = null,
  notify = null,
} = {}) {
  if (!registryElement || !targetNode) return null;
  if (!Array.isArray(state.pendingChangeRequests)) state.pendingChangeRequests = [];

  const normalizedOperation = getChangeRequestOperation(operation);
  const targetElementId = getPreviewTargetElementId(state, targetNode);
  if (!normalizedOperation || !targetElementId) return null;

  const existing = state.pendingChangeRequests.find((request) => (
    request?.targetElementId === targetElementId &&
    request?.operation === normalizedOperation
  ));
  const now = new Date().toISOString();
  const baseRequest = existing || {
    changeId: typeof getNextChangeRequestId === "function" ? getNextChangeRequestId(state) : "",
    targetAppId: registry.targetAppId || "bbm",
    moduleId: registry.moduleId || "",
    scopeId: registry.uiScope || state.activeUiScope || "",
    elementId: registryElement.id,
    operation: normalizedOperation,
    payload: {},
    createdAt: now,
    source: "preview",
    previewTargetMode: getPreviewTargetMode(registryElement),
    targetElementId,
    persistent: false,
  };

  if (normalizedOperation === "move") {
    baseRequest.payload = {
      dx: (Number(baseRequest.payload?.dx) || 0) + (Number(payload.dx) || 0),
      dy: (Number(baseRequest.payload?.dy) || 0) + (Number(payload.dy) || 0),
    };
  } else if (normalizedOperation === "width" || normalizedOperation === "height") {
    baseRequest.payload = {
      delta: (Number(baseRequest.payload?.delta) || 0) + (Number(payload.delta) || 0),
    };
  } else if (normalizedOperation === "visibility") {
    baseRequest.payload = {
      visible: operation === "show",
    };
  }

  baseRequest.elementId = registryElement.id;
  baseRequest.previewTargetMode = getPreviewTargetMode(registryElement);
  baseRequest.targetElementId = targetElementId;
  baseRequest.updatedAt = now;

  if (!existing) state.pendingChangeRequests.push(baseRequest);
  if (typeof notify === "function") notify(state);
  return baseRequest;
}

export function getPendingChangeRequestSummary(state = {}, elementId = "") {
  const requests = Array.isArray(state.pendingChangeRequests) ? state.pendingChangeRequests : [];
  const normalizedElementId = String(elementId || "").trim();
  const elementRequests = normalizedElementId
    ? requests.filter((request) => request?.elementId === normalizedElementId || request?.targetElementId === normalizedElementId)
    : [];
  const operations = Array.from(new Set(elementRequests.map((request) => request?.operation).filter(Boolean)));
  return {
    total: requests.length,
    operations,
  };
}
