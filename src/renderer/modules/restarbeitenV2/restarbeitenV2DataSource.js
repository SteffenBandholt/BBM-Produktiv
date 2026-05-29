import {
  createEmptyRestarbeitV2Draft,
  normalizeRestarbeitV2Dto,
  normalizeRestarbeitV2List,
  normalizeRestarbeitV2Patch,
} from "./restarbeitenV2Mapper.js";

const FAKE_RESTARBEITEN_V2_ROWS = [
  {
    restarbeit_id: "DS-001",
    nummer: "DS-001",
    title: "Geladene Fake-Restarbeit",
    location: "Haus A",
    state: "open",
    completion_note: "Fake DEV-Quelle",
    note: "Nur lokal geladen",
    photos: [],
  },
  {
    restarbeit_id: "DS-002",
    nummer: "DS-002",
    title: "Fake erledigt",
    location: "Wohnung 2",
    state: "done",
    completion_note: "Fake erledigt",
    note: "Nur lokal geladen",
    photos: [],
  },
  {
    restarbeit_id: "DS-003",
    nummer: "DS-003",
    title: "Fake Prüfung",
    location: "Außenanlage",
    state: "open",
    completion_note: "Fake Prüfung",
    note: "Nur lokal geladen",
    photos: [],
  },
];

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

export function createRestarbeitenV2FakeDataSource() {
  return {
    listRestarbeitenV2(projectId) {
      void projectId;
      return Promise.resolve(normalizeRestarbeitV2List(FAKE_RESTARBEITEN_V2_ROWS));
    },
    createRestarbeitV2() {
      return Promise.reject(createStubError("fake create nicht verfuegbar"));
    },
    updateRestarbeitV2() {
      return Promise.reject(createStubError("fake update nicht verfuegbar"));
    },
    deleteRestarbeitV2() {
      return Promise.reject(createStubError("fake delete nicht verfuegbar"));
    },
    listRestarbeitV2Attachments() {
      return Promise.resolve([]);
    },
  };
}

export {
  createEmptyRestarbeitV2Draft,
  normalizeRestarbeitV2Dto,
  normalizeRestarbeitV2List,
  normalizeRestarbeitV2Patch,
};
