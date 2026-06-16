export const SURFACE_POLICY_PERMISSION_KEYS = Object.freeze([
  "readable",
  "visibleInEditor",
  "canHide",
  "canDrag",
  "canResize",
  "canPersist",
]);

export const BLOCKED_SURFACE_POLICY = Object.freeze({
  readable: false,
  visibleInEditor: false,
  canHide: false,
  canDrag: false,
  canResize: false,
  canPersist: false,
});

const SURFACE_POLICIES = Object.freeze({
  "restarbeiten.ui.main": Object.freeze({
    readable: true,
    visibleInEditor: true,
    canHide: true,
    canDrag: false,
    canResize: false,
    canPersist: false,
  }),
  "pdf.plan.page.1": Object.freeze({
    readable: true,
    visibleInEditor: true,
    canHide: false,
    canDrag: false,
    canResize: false,
    canPersist: false,
  }),
  "plan.canvas.default": Object.freeze({
    readable: true,
    visibleInEditor: true,
    canHide: false,
    canDrag: false,
    canResize: false,
    canPersist: false,
  }),
});

function normalizeSurfaceId(surfaceId) {
  return String(surfaceId || "").trim();
}

function buildSurfacePolicyResult(surfaceId, policy) {
  return {
    surfaceId: normalizeSurfaceId(surfaceId),
    ...policy,
  };
}

export function getKnownSurfacePolicyIds() {
  return Object.keys(SURFACE_POLICIES);
}

export function getSurfacePolicy(surfaceId) {
  const normalizedSurfaceId = normalizeSurfaceId(surfaceId);
  const policy = SURFACE_POLICIES[normalizedSurfaceId] || BLOCKED_SURFACE_POLICY;
  return buildSurfacePolicyResult(normalizedSurfaceId, policy);
}

export function isSurfaceReadable(surfaceId) {
  return getSurfacePolicy(surfaceId).readable === true;
}

export function isSurfaceVisibleInEditor(surfaceId) {
  return getSurfacePolicy(surfaceId).visibleInEditor === true;
}

export function canSurfaceHideElements(surfaceId) {
  return getSurfacePolicy(surfaceId).canHide === true;
}

export function canSurfaceDragElements(surfaceId) {
  return getSurfacePolicy(surfaceId).canDrag === true;
}

export function canSurfaceResizeElements(surfaceId) {
  return getSurfacePolicy(surfaceId).canResize === true;
}

export function canSurfacePersistChanges(surfaceId) {
  return getSurfacePolicy(surfaceId).canPersist === true;
}
