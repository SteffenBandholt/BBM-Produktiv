import {
  normalizeSurfaceModel,
  validateSurfaceModel,
} from "../uiEditorKitSurfaceRuntimeBridge.js";
import { createRestarbeitenMainUiHostAdapter } from "../../modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js";

export const RESTARBEITEN_MAIN_SURFACE_ID = "restarbeiten.ui.main";
export const RESTARBEITEN_MAIN_SURFACE_TYPE = "ui-screen";
export const RESTARBEITEN_MAIN_SURFACE_COORDINATE_SYSTEM = "css-pixels";

function normalizeArray(value = []) {
  return Array.isArray(value) ? value : [];
}

function getRegistryElements(registry = null) {
  if (Array.isArray(registry)) return registry;
  if (registry && Array.isArray(registry.elements)) return registry.elements;
  return [];
}

function getElementVisibleFromLayoutState(elementId, layoutState = []) {
  const stateEntry = normalizeArray(layoutState).find((entry) => entry?.elementId === elementId);
  if (!stateEntry || typeof stateEntry !== "object") return null;
  if (typeof stateEntry.overrides?.visible === "boolean") return stateEntry.overrides.visible;
  if (typeof stateEntry.visible === "boolean") return stateEntry.visible;
  return null;
}

function getElementVisible(registryElement = {}, layoutState = []) {
  const layoutVisible = getElementVisibleFromLayoutState(registryElement.id, layoutState);
  if (typeof layoutVisible === "boolean") return layoutVisible;
  return typeof registryElement.visible === "boolean" ? registryElement.visible : true;
}

function getElementLabel(registryElement = {}) {
  return String(registryElement.name || registryElement.label || registryElement.id || "").trim();
}

function getElementCapabilities(registryElement = {}) {
  const allowedOps = normalizeArray(registryElement.allowedOps).map((entry) => String(entry));
  return {
    canHide: allowedOps.includes("hide") || allowedOps.includes("show"),
    canMove: false,
    canResize: false,
  };
}

function createDefaultHostAdapter() {
  return createRestarbeitenMainUiHostAdapter({ storageApi: null });
}

export function buildRestarbeitenMainSurfaceModel({ hostAdapter = createDefaultHostAdapter() } = {}) {
  const registry = typeof hostAdapter?.getRegistry === "function" ? hostAdapter.getRegistry(RESTARBEITEN_MAIN_SURFACE_ID) : [];
  const layoutState = typeof hostAdapter?.getCurrentLayoutState === "function" ? hostAdapter.getCurrentLayoutState(RESTARBEITEN_MAIN_SURFACE_ID) : [];
  const elements = getRegistryElements(registry).map((registryElement) => ({
    elementId: String(registryElement.id || "").trim(),
    label: getElementLabel(registryElement),
    visible: getElementVisible(registryElement, layoutState),
    capabilities: getElementCapabilities(registryElement),
  }));

  return normalizeSurfaceModel({
    surfaceId: RESTARBEITEN_MAIN_SURFACE_ID,
    surfaceType: RESTARBEITEN_MAIN_SURFACE_TYPE,
    coordinateSystem: RESTARBEITEN_MAIN_SURFACE_COORDINATE_SYSTEM,
    elements,
  });
}

export function validateRestarbeitenMainSurfaceModel(surfaceModel) {
  return validateSurfaceModel(surfaceModel);
}

export function buildValidatedRestarbeitenMainSurfaceModel(options = {}) {
  const surfaceModel = buildRestarbeitenMainSurfaceModel(options);
  const validation = validateRestarbeitenMainSurfaceModel(surfaceModel);
  return {
    ok: validation.ok,
    surfaceModel,
    validation,
  };
}
