import {
  getKnownSurfaceAdapterIds,
  getSurfaceAdapterById,
  isKnownSurfaceAdapterId,
} from "./surfaceAdapterCatalog.js";
import {
  getSurfacePolicy,
  isSurfaceReadable,
  isSurfaceVisibleInEditor,
} from "./surfacePolicy.js";

const SURFACE_SELECTION_LABELS = Object.freeze({
  "restarbeiten.ui.main": "Restarbeiten",
  "plan.canvas.default": "Plan Canvas",
});

function normalizeSurfaceId(surfaceId) {
  return String(surfaceId || "").trim();
}

function getCandidateSurfaceIds(surfaceIds = null) {
  return Array.isArray(surfaceIds)
    ? surfaceIds.map(normalizeSurfaceId).filter(Boolean)
    : getKnownSurfaceAdapterIds();
}

function getSurfaceSelectionLabel(surfaceId, adapter = null) {
  return SURFACE_SELECTION_LABELS[surfaceId] || String(adapter?.label || surfaceId).trim();
}

export function isSurfaceSelectableInEditor(surfaceId) {
  const normalizedSurfaceId = normalizeSurfaceId(surfaceId);
  if (!normalizedSurfaceId) return false;
  return (
    isKnownSurfaceAdapterId(normalizedSurfaceId) === true &&
    isSurfaceReadable(normalizedSurfaceId) === true &&
    isSurfaceVisibleInEditor(normalizedSurfaceId) === true
  );
}

export function getVisibleEditorSurfaceIds(input = {}) {
  const candidateSurfaceIds = getCandidateSurfaceIds(input.surfaceIds);
  return candidateSurfaceIds.filter((surfaceId) => isSurfaceSelectableInEditor(surfaceId));
}

export function buildReadonlySurfaceSelectionModel(input = {}) {
  const visibleSurfaceIds = getVisibleEditorSurfaceIds(input);
  const normalizedSelectedSurfaceId = normalizeSurfaceId(input.selectedSurfaceId);
  const selectedSurfaceId = visibleSurfaceIds.includes(normalizedSelectedSurfaceId)
    ? normalizedSelectedSurfaceId
    : visibleSurfaceIds[0] || "";

  return {
    surfaces: visibleSurfaceIds.map((surfaceId) => {
      const adapter = getSurfaceAdapterById(surfaceId);
      const policy = getSurfacePolicy(surfaceId);
      return {
        surfaceId,
        label: getSurfaceSelectionLabel(surfaceId, adapter),
        surfaceType: String(adapter?.surfaceType || "").trim(),
        selected: surfaceId === selectedSurfaceId,
        readonly: true,
        capabilities: {
          canDrag: policy.canDrag === true,
          canResize: policy.canResize === true,
          canPersist: policy.canPersist === true,
        },
      };
    }),
  };
}
