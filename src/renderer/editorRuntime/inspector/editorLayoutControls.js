import { SAFE_LAYOUT_OPERATIONS } from "../layout/editorLayoutPersistence.js";
import { getEditorElementDetails } from "./editorElementDetails.js";

const CONTROL_IDS = Object.freeze({
  applySave: "editor.layout.applySave",
  loadSaved: "editor.layout.loadSaved",
  resetDefault: "editor.layout.resetDefault",
});

function normalizeString(value) {
  return String(value ?? "").trim();
}

function clonePlain(value) {
  if (value === null || value === undefined) return value;
  return structuredClone(value);
}

function findLayoutEntry(layoutState, elementId) {
  const needle = normalizeString(elementId);
  if (!Array.isArray(layoutState) || !needle) return null;
  return layoutState.find((entry) => normalizeString(entry?.elementId) === needle) || null;
}

function toSafeLayoutOps(details) {
  const effectiveOps = Array.isArray(details?.effectiveOps) ? details.effectiveOps : [];
  return effectiveOps.filter((operation) => SAFE_LAYOUT_OPERATIONS.includes(operation));
}

function createControl({ id, label, enabled, reason = null, allowedOps = [] }) {
  return {
    id,
    label,
    kind: "button",
    enabled: Boolean(enabled),
    reason,
    allowedOps: [...allowedOps],
  };
}

function createBlockedPanel({ scope, elementId, detailsResult, layoutState }) {
  const reason = detailsResult.errors?.[0]?.code || "ELEMENT_UNAVAILABLE";
  return {
    ok: false,
    scope,
    elementId: normalizeString(elementId),
    selectedElement: null,
    currentLayoutEntry: null,
    controls: [
      createControl({
        id: CONTROL_IDS.applySave,
        label: "Aenderung anwenden/speichern",
        enabled: false,
        reason,
      }),
      createControl({
        id: CONTROL_IDS.loadSaved,
        label: "Gespeicherten Zustand laden/anwenden",
        enabled: false,
        reason,
      }),
      createControl({
        id: CONTROL_IDS.resetDefault,
        label: "Auf Standard zuruecksetzen",
        enabled: false,
        reason,
      }),
    ],
    status: {
      kind: "blocked",
      message: "Aktion blockiert: Element ist nicht registriert.",
      reason,
    },
    layoutState,
    errors: detailsResult.errors || [],
    warnings: detailsResult.warnings || [],
  };
}

export function createEditorLayoutControlPanel({ scope, registry, hostAdapter, elementId } = {}) {
  const layoutState = typeof hostAdapter?.getCurrentLayoutState === "function"
    ? hostAdapter.getCurrentLayoutState()
    : [];
  const detailsResult = getEditorElementDetails(registry, elementId);

  if (!detailsResult.ok) {
    return createBlockedPanel({ scope, elementId, detailsResult, layoutState });
  }

  const safeLayoutOps = toSafeLayoutOps(detailsResult.details);
  const currentLayoutEntry = findLayoutEntry(layoutState, elementId);
  const persistenceStatus = typeof hostAdapter?.getPersistenceStatus === "function"
    ? hostAdapter.getPersistenceStatus({ elementId: normalizeString(elementId) })
    : {};

  return {
    ok: true,
    scope,
    elementId: normalizeString(elementId),
    selectedElement: detailsResult.details,
    currentLayoutEntry: clonePlain(currentLayoutEntry),
    controls: [
      createControl({
        id: CONTROL_IDS.applySave,
        label: "Aenderung anwenden/speichern",
        enabled: safeLayoutOps.length > 0,
        reason: safeLayoutOps.length > 0 ? null : "NO_SAFE_LAYOUT_OPERATION",
        allowedOps: safeLayoutOps,
      }),
      createControl({
        id: CONTROL_IDS.loadSaved,
        label: "Gespeicherten Zustand laden/anwenden",
        enabled: true,
        allowedOps: [],
      }),
      createControl({
        id: CONTROL_IDS.resetDefault,
        label: "Auf Standard zuruecksetzen",
        enabled: true,
        allowedOps: [],
      }),
    ],
    status: {
      kind: "ready",
      message: currentLayoutEntry
        ? "Gespeicherter Layoutzustand ist verfuegbar."
        : "Standardzustand ist aktiv.",
      reason: null,
      ...persistenceStatus,
    },
    layoutState,
    errors: [],
    warnings: [],
  };
}

function buildChangeRequest({ scope, elementId, operation, payload }) {
  const timestamp = new Date().toISOString();
  return {
    changeId: `editor-layout-${timestamp}`,
    targetAppId: normalizeString(scope?.targetAppId) || "bbm",
    moduleId: normalizeString(scope?.moduleId),
    scopeId: normalizeString(scope?.scopeId),
    elementId: normalizeString(elementId),
    operation: normalizeString(operation),
    payload: payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {},
    createdAt: timestamp,
    source: "editor-runtime",
  };
}

export function applyEditorLayoutChange({ scope, registry, hostAdapter, elementId, operation, payload } = {}) {
  const panel = createEditorLayoutControlPanel({ scope, registry, hostAdapter, elementId });
  if (!panel.ok) {
    return {
      ok: false,
      blocked: true,
      reason: panel.status.reason,
      status: panel.status,
      panel,
      errors: panel.errors,
      warnings: panel.warnings,
    };
  }

  const normalizedOperation = normalizeString(operation);
  const applyControl = panel.controls.find((control) => control.id === CONTROL_IDS.applySave);
  if (!applyControl?.allowedOps.includes(normalizedOperation)) {
    return {
      ok: false,
      blocked: true,
      reason: "OPERATION_NOT_LAYOUT_CONTROL_SAFE",
      status: {
        kind: "blocked",
        message: "Aenderung wurde blockiert: Operation ist fuer dieses Element nicht als neutrale Layoutaenderung freigegeben.",
        reason: "OPERATION_NOT_LAYOUT_CONTROL_SAFE",
      },
      panel,
      errors: [],
      warnings: [],
    };
  }

  const result = hostAdapter.submitChangeRequest(
    buildChangeRequest({ scope, elementId, operation: normalizedOperation, payload })
  );

  if (!result.ok) {
    return {
      ok: false,
      blocked: true,
      reason: result.reason || "CHANGE_REQUEST_BLOCKED",
      status: {
        kind: "blocked",
        message: "Aenderung wurde blockiert.",
        reason: result.reason || "CHANGE_REQUEST_BLOCKED",
      },
      result,
      panel,
      errors: result.validation?.errors || [],
      warnings: result.validation?.warnings || [],
    };
  }

  return {
    ok: true,
    blocked: false,
    reason: null,
    status: {
      kind: "success",
      message: "Aenderung wurde angewendet und gespeichert.",
      reason: null,
    },
    layoutEntry: result.layoutEntry,
    layoutState: hostAdapter.getCurrentLayoutState(),
    result,
    panel,
    errors: [],
    warnings: [],
  };
}

export function loadEditorLayoutState({ registry, hostAdapter, elementId = null } = {}) {
  const layoutState = typeof hostAdapter?.getCurrentLayoutState === "function"
    ? hostAdapter.getCurrentLayoutState()
    : [];
  const normalizedElementId = normalizeString(elementId);

  if (normalizedElementId) {
    const detailsResult = getEditorElementDetails(registry, normalizedElementId);
    if (!detailsResult.ok) {
      return {
        ok: false,
        blocked: true,
        reason: detailsResult.errors?.[0]?.code || "ELEMENT_UNAVAILABLE",
        status: {
          kind: "blocked",
          message: "Gespeicherter Zustand wurde nicht geladen: Element ist nicht registriert.",
          reason: detailsResult.errors?.[0]?.code || "ELEMENT_UNAVAILABLE",
        },
        layoutState,
        currentLayoutEntry: null,
        errors: detailsResult.errors || [],
        warnings: detailsResult.warnings || [],
      };
    }
  }

  const currentLayoutEntry = normalizedElementId ? findLayoutEntry(layoutState, normalizedElementId) : null;
  return {
    ok: true,
    blocked: false,
    reason: null,
    status: {
      kind: "success",
      message: currentLayoutEntry || !normalizedElementId
        ? "Gespeicherter Layoutzustand wurde geladen."
        : "Kein gespeicherter Layoutzustand vorhanden; Standardzustand bleibt aktiv.",
      reason: null,
    },
    layoutState,
    currentLayoutEntry: clonePlain(currentLayoutEntry),
    errors: [],
    warnings: [],
  };
}

export function resetEditorLayoutState({ registry, hostAdapter, elementId = null } = {}) {
  const normalizedElementId = normalizeString(elementId);
  if (normalizedElementId) {
    const detailsResult = getEditorElementDetails(registry, normalizedElementId);
    if (!detailsResult.ok) {
      return {
        ok: false,
        blocked: true,
        reason: detailsResult.errors?.[0]?.code || "ELEMENT_UNAVAILABLE",
        status: {
          kind: "blocked",
          message: "Reset wurde blockiert: Element ist nicht registriert.",
          reason: detailsResult.errors?.[0]?.code || "ELEMENT_UNAVAILABLE",
        },
        layoutState: typeof hostAdapter?.getCurrentLayoutState === "function" ? hostAdapter.getCurrentLayoutState() : [],
        errors: detailsResult.errors || [],
        warnings: detailsResult.warnings || [],
      };
    }
  }

  const result = hostAdapter.resetLayoutState({ elementId: normalizedElementId || null });
  if (!result.ok) {
    return {
      ok: false,
      blocked: true,
      reason: result.reason || "RESET_BLOCKED",
      status: {
        kind: "blocked",
        message: "Reset wurde blockiert.",
        reason: result.reason || "RESET_BLOCKED",
      },
      layoutState: result.layoutState || [],
      result,
      errors: [],
      warnings: [],
    };
  }

  return {
    ok: true,
    blocked: false,
    reason: null,
    status: {
      kind: "success",
      message: "Standardzustand wurde wiederhergestellt.",
      reason: null,
    },
    layoutState: result.layoutState,
    result,
    errors: [],
    warnings: [],
  };
}

export { CONTROL_IDS as EDITOR_LAYOUT_CONTROL_IDS };
