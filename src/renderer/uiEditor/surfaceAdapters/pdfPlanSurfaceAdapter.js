import {
  normalizeSurfaceModel,
  validateSurfaceModel,
} from "../uiEditorKitSurfaceRuntimeBridge.js";

export const PDF_PLAN_DEFAULT_PAGE_NUMBER = 1;
export const PDF_PLAN_PAGE_SURFACE_ID_PREFIX = "pdf.plan.page";
export const PDF_PLAN_PAGE_SURFACE_TYPE = "pdf-page";
export const PDF_PLAN_PAGE_COORDINATE_SYSTEM = "pdf-points";

export const PLAN_CANVAS_DEFAULT_SURFACE_ID = "plan.canvas.default";
export const PLAN_CANVAS_SURFACE_TYPE = "plan";
export const PLAN_CANVAS_COORDINATE_SYSTEM = "canvas-pixels";

function normalizePositiveInteger(value, fallback = PDF_PLAN_DEFAULT_PAGE_NUMBER) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function buildPdfPageSurfaceModel({ pageNumber = PDF_PLAN_DEFAULT_PAGE_NUMBER } = {}) {
  const normalizedPageNumber = normalizePositiveInteger(pageNumber);

  return normalizeSurfaceModel({
    surfaceId: `${PDF_PLAN_PAGE_SURFACE_ID_PREFIX}.${normalizedPageNumber}`,
    surfaceType: PDF_PLAN_PAGE_SURFACE_TYPE,
    pageNumber: normalizedPageNumber,
    coordinateSystem: PDF_PLAN_PAGE_COORDINATE_SYSTEM,
    elements: [],
  });
}

export function buildPlanSurfaceModel({
  surfaceId = PLAN_CANVAS_DEFAULT_SURFACE_ID,
  coordinateSystem = PLAN_CANVAS_COORDINATE_SYSTEM,
} = {}) {
  return normalizeSurfaceModel({
    surfaceId,
    surfaceType: PLAN_CANVAS_SURFACE_TYPE,
    coordinateSystem,
    elements: [],
  });
}

export function validatePdfPlanSurfaceModel(surfaceModel) {
  return validateSurfaceModel(surfaceModel);
}

export function buildValidatedPdfPageSurfaceModel(options = {}) {
  const surfaceModel = buildPdfPageSurfaceModel(options);
  const validation = validatePdfPlanSurfaceModel(surfaceModel);
  return {
    ok: validation.ok,
    surfaceModel,
    validation,
  };
}

export function buildValidatedPlanSurfaceModel(options = {}) {
  const surfaceModel = buildPlanSurfaceModel(options);
  const validation = validatePdfPlanSurfaceModel(surfaceModel);
  return {
    ok: validation.ok,
    surfaceModel,
    validation,
  };
}
