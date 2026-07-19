import { createEditorLayoutMemoryStorage } from "../editorRuntime/layout/editorLayoutPersistence.js";

const BBM_MAIN_UI_LAYOUT_STORAGE_KEY = "bbm.uiEditor.layout.bbm-main.v1";

function getBrowserStorage() {
  try {
    return globalThis?.localStorage || null;
  } catch (_error) {
    return null;
  }
}

export function createBbmMainUiLayoutStorage(key = BBM_MAIN_UI_LAYOUT_STORAGE_KEY) {
  const storage = getBrowserStorage();
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    return createEditorLayoutMemoryStorage();
  }

  return {
    read() {
      try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    },
    write(nextPayload) {
      const payload = nextPayload && typeof nextPayload === "object" && !Array.isArray(nextPayload) ? structuredClone(nextPayload) : null;
      storage.setItem(key, JSON.stringify(payload));
      return payload;
    },
    clear() {
      storage.removeItem(key);
    },
  };
}

export { BBM_MAIN_UI_LAYOUT_STORAGE_KEY };
