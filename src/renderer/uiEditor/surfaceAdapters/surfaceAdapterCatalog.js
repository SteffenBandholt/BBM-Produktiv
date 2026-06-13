import {
  validateSurfaceModel,
} from "../uiEditorKitSurfaceRuntimeBridge.js";
import {
  RESTARBEITEN_MAIN_SURFACE_ID,
  RESTARBEITEN_MAIN_SURFACE_TYPE,
  buildRestarbeitenMainSurfaceModel,
  validateRestarbeitenMainSurfaceModel,
} from "./restarbeitenMainSurfaceAdapter.js";
import {
  PDF_PLAN_PAGE_COORDINATE_SYSTEM,
  PDF_PLAN_PAGE_SURFACE_TYPE,
  PLAN_CANVAS_DEFAULT_SURFACE_ID,
  PLAN_CANVAS_SURFACE_TYPE,
  buildPdfPageSurfaceModel,
  buildPlanSurfaceModel,
  validatePdfPlanSurfaceModel,
} from "./pdfPlanSurfaceAdapter.js";
import {
  isSurfaceReadable,
} from "./surfacePolicy.js";

export const PDF_PLAN_PAGE_1_SURFACE_ID = "pdf.plan.page.1";

function createUnknownSurfaceAdapterResult(surfaceId) {
  return {
    ok: false,
    surfaceModel: null,
    validation: {
      ok: false,
      errors: [
        {
          code: "UNKNOWN_SURFACE_ADAPTER",
          message: "Surface adapter is not registered.",
          surfaceId,
        },
      ],
    },
  };
}

const SURFACE_ADAPTER_CATALOG = Object.freeze({
  [RESTARBEITEN_MAIN_SURFACE_ID]: Object.freeze({
    surfaceId: RESTARBEITEN_MAIN_SURFACE_ID,
    surfaceType: RESTARBEITEN_MAIN_SURFACE_TYPE,
    label: "Restarbeiten UI-Surface",
    buildSurfaceModel: buildRestarbeitenMainSurfaceModel,
    validateSurfaceModel: validateRestarbeitenMainSurfaceModel,
  }),
  [PDF_PLAN_PAGE_1_SURFACE_ID]: Object.freeze({
    surfaceId: PDF_PLAN_PAGE_1_SURFACE_ID,
    surfaceType: PDF_PLAN_PAGE_SURFACE_TYPE,
    coordinateSystem: PDF_PLAN_PAGE_COORDINATE_SYSTEM,
    label: "PDF Plan Seite 1",
    buildSurfaceModel(input = {}) {
      return buildPdfPageSurfaceModel({
        ...input,
        pageNumber: 1,
      });
    },
    validateSurfaceModel: validatePdfPlanSurfaceModel,
  }),
  [PLAN_CANVAS_DEFAULT_SURFACE_ID]: Object.freeze({
    surfaceId: PLAN_CANVAS_DEFAULT_SURFACE_ID,
    surfaceType: PLAN_CANVAS_SURFACE_TYPE,
    label: "Plan Canvas Default",
    buildSurfaceModel: buildPlanSurfaceModel,
    validateSurfaceModel: validatePdfPlanSurfaceModel,
  }),
});

export function getKnownSurfaceAdapterIds() {
  return Object.keys(SURFACE_ADAPTER_CATALOG);
}

export function getSurfaceAdapterById(surfaceId) {
  const normalizedSurfaceId = String(surfaceId || "");
  if (!isSurfaceReadable(normalizedSurfaceId)) return null;
  return SURFACE_ADAPTER_CATALOG[normalizedSurfaceId] || null;
}

export function isKnownSurfaceAdapterId(surfaceId) {
  return Boolean(getSurfaceAdapterById(surfaceId));
}

export function buildSurfaceModelById(surfaceId, input = {}) {
  const adapter = getSurfaceAdapterById(surfaceId);
  if (!adapter) return null;
  return adapter.buildSurfaceModel(input);
}

export function validateSurfaceModelById(surfaceId, input = {}) {
  const adapter = getSurfaceAdapterById(surfaceId);
  if (!adapter) return createUnknownSurfaceAdapterResult(surfaceId);

  const surfaceModel = adapter.buildSurfaceModel(input);
  const validation = validateSurfaceModel(surfaceModel);
  const adapterValidation = adapter.validateSurfaceModel(surfaceModel);
  const errors = [
    ...validation.errors,
    ...adapterValidation.errors.filter((error) => {
      return !validation.errors.some((entry) => entry.code === error.code && entry.message === error.message);
    }),
  ];

  return {
    ok: errors.length === 0,
    surfaceModel,
    validation: {
      ok: errors.length === 0,
      errors,
    },
  };
}
