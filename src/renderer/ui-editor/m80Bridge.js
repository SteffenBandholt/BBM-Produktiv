import { clearM80EditorInteraction, handleM80EditorEvent, handleM80EditorRequest, restoreM80StartupLayout } from "./m80HostAdapter.js";

let installed = false;
let disposers = [];
let startupRetryTimer = null;

async function ensureStartupLayout(attempt = 0) {
  const result = await restoreM80StartupLayout();
  if (result?.state !== "waitingForRegistry" || !installed || attempt >= 50) return result;
  clearTimeout(startupRetryTimer);
  startupRetryTimer = setTimeout(() => { void ensureStartupLayout(attempt + 1); }, 100);
  return result;
}

function handlePilotRenderComplete() { void ensureStartupLayout(); }

export function installBbmM80EditorBridge() {
  if (installed) return;
  installed = true;
  const api = window.uiEditor;
  if (!api || typeof api.onRequest !== "function" || typeof api.respond !== "function") return;
  disposers.push(api.onRequest(async (message) => {
    try {
      const payload = handleM80EditorRequest(message?.payload || {});
      await api.respond({ requestId: message.requestId, ok: true, payload });
    } catch (error) {
      console.error("[ui-editor] renderer request rejected", error?.code || "electron_editor_message_invalid");
      await api.respond({ requestId: message?.requestId, ok: false, errorCode: error?.code || "electron_editor_message_invalid" });
    }
  }));
  disposers.push(api.onEvent((message) => {
    try { handleM80EditorEvent(message || {}); } catch (_error) { clearM80EditorInteraction(); }
  }));
  window.addEventListener("bbm:router-context", clearM80EditorInteraction);
  window.addEventListener("bbm:m80-pilot-render-complete", handlePilotRenderComplete);
  window.addEventListener("beforeunload", clearM80EditorInteraction, { once: true });
  void ensureStartupLayout();
}

export function uninstallBbmM80EditorBridge() {
  disposers.forEach((dispose) => { try { dispose?.(); } catch (_error) { void _error; } });
  disposers = [];
  clearTimeout(startupRetryTimer);
  startupRetryTimer = null;
  clearM80EditorInteraction();
  window.removeEventListener("bbm:m80-pilot-render-complete", handlePilotRenderComplete);
  installed = false;
}
