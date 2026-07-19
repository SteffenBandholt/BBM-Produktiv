import { createEditorLayoutMemoryStorage } from "../editorRuntime/layout/editorLayoutPersistence.js";

const BBM_MAIN_UI_LAYOUT_STORAGE_KEY = "bbm.uiEditor.layout.bbm-main.v1";

function getBrowserStorage() {
  try {
    return globalThis?.localStorage || null;
  } catch (_error) {
    return null;
  }
}

function clonePayload(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? structuredClone(payload) : null;
}

export function createBbmMainUiLayoutStorage(key = BBM_MAIN_UI_LAYOUT_STORAGE_KEY) {
  const storage = getBrowserStorage();
  const available = Boolean(storage && typeof storage.getItem === "function" && typeof storage.setItem === "function");

  function readResult() {
    if (!available) {
      return { ok: false, found: false, payload: null, reason: "LAYOUT_STORAGE_UNAVAILABLE" };
    }
    try {
      const raw = storage.getItem(key);
      if (raw === null) return { ok: true, found: false, payload: null };
      return { ok: true, found: true, payload: JSON.parse(raw) };
    } catch (_error) {
      return { ok: false, found: false, payload: null, reason: "LAYOUT_STORAGE_READ_FAILED" };
    }
  }

  return {
    available,
    persistent: available,
    readResult,
    read() {
      const result = readResult();
      if (!result.ok) {
        const error = new Error(result.reason || "LAYOUT_STORAGE_READ_FAILED");
        error.code = result.reason || "LAYOUT_STORAGE_READ_FAILED";
        throw error;
      }
      return result.found ? clonePayload(result.payload) : null;
    },
    write(nextPayload) {
      if (!available) {
        const error = new Error("LAYOUT_STORAGE_UNAVAILABLE");
        error.code = "LAYOUT_STORAGE_UNAVAILABLE";
        throw error;
      }
      const payload = clonePayload(nextPayload);
      try {
        storage.setItem(key, JSON.stringify(payload));
      } catch (_error) {
        const error = new Error("LAYOUT_STORAGE_WRITE_FAILED");
        error.code = "LAYOUT_STORAGE_WRITE_FAILED";
        throw error;
      }
      return payload;
    },
    clear() {
      if (!available) return;
      storage.removeItem(key);
    },
  };
}

export function createBbmMainUiMemoryLayoutStorage(initialPayload = null) {
  const storage = createEditorLayoutMemoryStorage(initialPayload);
  return {
    available: true,
    persistent: false,
    readResult() {
      const payload = storage.read();
      return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null };
    },
    read: storage.read,
    write: storage.write,
    clear: storage.clear,
  };
}

export { BBM_MAIN_UI_LAYOUT_STORAGE_KEY };
