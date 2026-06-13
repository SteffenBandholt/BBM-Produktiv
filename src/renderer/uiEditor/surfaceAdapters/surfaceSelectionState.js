import {
  getKnownSurfaceAdapterIds,
} from "./surfaceAdapterCatalog.js";
import {
  getVisibleEditorSurfaceIds,
  isSurfaceSelectableInEditor,
} from "./surfaceSelectionModel.js";

const READONLY_SELECTION_REASON = "readonly-single-surface";
const BLOCKED_SELECTION_REASON = "surface-selection-blocked";

function normalizeSurfaceId(surfaceId) {
  return String(surfaceId || "").trim();
}

function uniqueSurfaceIds(surfaceIds = []) {
  return Array.from(new Set(
    surfaceIds
      .map((surfaceId) => normalizeSurfaceId(surfaceId))
      .filter(Boolean)
  ));
}

function getCandidateSurfaceIds(input = {}) {
  const requestedSurfaceId = normalizeSurfaceId(input.selectedSurfaceId);
  const configuredSurfaceIds = Array.isArray(input.surfaceIds)
    ? input.surfaceIds
    : getKnownSurfaceAdapterIds();
  return uniqueSurfaceIds([
    ...configuredSurfaceIds,
    requestedSurfaceId,
  ]);
}

function getReadonlySelectionInput(input = {}) {
  return {
    ...input,
    surfaceIds: getKnownSurfaceAdapterIds(),
  };
}

export function isReadonlySurfaceSelectionAllowed(surfaceId, input = {}) {
  const normalizedSurfaceId = normalizeSurfaceId(surfaceId);
  if (!normalizedSurfaceId) return false;
  const selectionInput = getReadonlySelectionInput(input);
  const availableSurfaceIds = getVisibleEditorSurfaceIds(selectionInput);
  return (
    availableSurfaceIds.includes(normalizedSurfaceId) &&
    isSurfaceSelectableInEditor(normalizedSurfaceId) === true
  );
}

export function resolveReadonlySelectedSurfaceId(input = {}) {
  const requestedSurfaceId = normalizeSurfaceId(input.selectedSurfaceId);
  const selectionInput = getReadonlySelectionInput(input);
  const availableSurfaceIds = getVisibleEditorSurfaceIds(selectionInput);
  if (isReadonlySurfaceSelectionAllowed(requestedSurfaceId, input)) {
    return requestedSurfaceId;
  }
  return availableSurfaceIds[0] || "";
}

export function buildReadonlySurfaceSelectionState(input = {}) {
  const requestedSurfaceId = normalizeSurfaceId(input.selectedSurfaceId);
  const selectionInput = getReadonlySelectionInput(input);
  const availableSurfaceIds = getVisibleEditorSurfaceIds(selectionInput);
  const selectedSurfaceId = resolveReadonlySelectedSurfaceId(input);
  const candidateSurfaceIds = getCandidateSurfaceIds(input);
  const blockedSurfaceIds = candidateSurfaceIds.filter((surfaceId) => {
    return !availableSurfaceIds.includes(surfaceId);
  });
  const selectionAllowed = requestedSurfaceId
    ? isReadonlySurfaceSelectionAllowed(requestedSurfaceId, input)
    : true;

  return {
    selectedSurfaceId,
    requestedSurfaceId,
    readonly: true,
    availableSurfaceIds,
    blockedSurfaceIds,
    selectionAllowed,
    reason: selectionAllowed ? READONLY_SELECTION_REASON : BLOCKED_SELECTION_REASON,
  };
}
