import { buildReadonlySurfaceSwitchResult } from "./surfaceSwitchModel.js";

const READONLY_RESOLVED_SURFACE_ID = "restarbeiten.ui.main";

function normalizeSurfaceId(surfaceId) {
  return String(surfaceId ?? "").trim();
}

function resolveRequestedSurfaceId(input = {}) {
  return normalizeSurfaceId(
    input.targetSurfaceId ?? input.requestedSurfaceId ?? input.surfaceId ?? ""
  );
}

export function handleReadonlySurfaceSwitchRequest(input = {}) {
  const requestedSurfaceId = resolveRequestedSurfaceId(input);
  const switchResult = buildReadonlySurfaceSwitchResult({
    ...input,
    targetSurfaceId: requestedSurfaceId,
  });

  return {
    handled: true,
    allowed: switchResult.allowed === true,
    readonly: true,
    requestedSurfaceId,
    resolvedSurfaceId: switchResult.resolvedSurfaceId || READONLY_RESOLVED_SURFACE_ID,
    changed: false,
    reason: switchResult.reason,
  };
}

export function buildReadonlySurfaceSwitchCommand(input = {}) {
  return handleReadonlySurfaceSwitchRequest(input);
}

export function executeReadonlySurfaceSwitchCommand(input = {}) {
  return handleReadonlySurfaceSwitchRequest(input);
}
