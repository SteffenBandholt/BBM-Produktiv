import {
  createEmptyRestarbeitV2Draft,
  normalizeRestarbeitV2Dto,
  normalizeRestarbeitV2List,
  normalizeRestarbeitV2Patch,
} from "./restarbeitenV2Mapper.js";

function createStubError(detail = "") {
  const suffix = detail ? ` (${detail})` : "";
  return new Error(`Restarbeiten V2 DataSource ist noch nicht angebunden${suffix}`);
}

function rejectStub(detail) {
  return Promise.reject(createStubError(detail));
}

export function createRestarbeitenV2DataSource(_options = {}) {
  return {
    listRestarbeitenV2(projectId) {
      if (!projectId) {
        return rejectStub("projectId fehlt");
      }
      return rejectStub("listRestarbeitenV2");
    },
    createRestarbeitV2(projectId, draft) {
      void projectId;
      void draft;
      return rejectStub("createRestarbeitV2");
    },
    updateRestarbeitV2(id, patch) {
      void id;
      void patch;
      return rejectStub("updateRestarbeitV2");
    },
    deleteRestarbeitV2(id) {
      void id;
      return rejectStub("deleteRestarbeitV2");
    },
    listRestarbeitV2Attachments(id) {
      void id;
      return rejectStub("listRestarbeitV2Attachments");
    },
  };
}

export {
  createEmptyRestarbeitV2Draft,
  normalizeRestarbeitV2Dto,
  normalizeRestarbeitV2List,
  normalizeRestarbeitV2Patch,
};
