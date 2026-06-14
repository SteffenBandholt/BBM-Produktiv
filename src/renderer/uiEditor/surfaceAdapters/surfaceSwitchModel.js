import {
  buildReadonlySurfaceSelectionState,
  isReadonlySurfaceSelectionAllowed,
} from "./surfaceSelectionState.js";

const READONLY_CURRENT_SURFACE_REASON = "readonly-current-surface";
const SURFACE_NOT_SELECTABLE_READONLY_REASON = "surface-not-selectable-readonly";

function normalizeSurfaceId(surfaceId) {
  return String(surfaceId || "").trim();
}

function getReadonlyCurrentSurfaceId(input = {}) {
  const state = buildReadonlySurfaceSelectionState({
    ...input,
    selectedSurfaceId: input.fromSurfaceId || input.selectedSurfaceId,
  });
  return state.selectedSurfaceId;
}

export function canSwitchReadonlySurface(targetSurfaceId, input = {}) {
  const normalizedTargetSurfaceId = normalizeSurfaceId(targetSurfaceId);
  if (!normalizedTargetSurfaceId) return false;
  return isReadonlySurfaceSelectionAllowed(normalizedTargetSurfaceId, input) === true;
}

export function resolveReadonlySurfaceSwitchTarget(targetSurfaceId, input = {}) {
  const normalizedTargetSurfaceId = normalizeSurfaceId(targetSurfaceId);
  const fromSurfaceId = getReadonlyCurrentSurfaceId(input);
  if (canSwitchReadonlySurface(normalizedTargetSurfaceId, input)) {
    return normalizedTargetSurfaceId;
  }
  return fromSurfaceId;
}

export function buildReadonlySurfaceSwitchResult(input = {}) {
  const targetSurfaceId = normalizeSurfaceId(input.targetSurfaceId);
  const fromSurfaceId = getReadonlyCurrentSurfaceId(input);
  const allowed = canSwitchReadonlySurface(targetSurfaceId, input);

  return {
    allowed,
    readonly: true,
    fromSurfaceId,
    targetSurfaceId,
    resolvedSurfaceId: allowed ? targetSurfaceId : fromSurfaceId,
    reason: allowed ? READONLY_CURRENT_SURFACE_REASON : SURFACE_NOT_SELECTABLE_READONLY_REASON,
  };
}
