import RechnungenDesignScreen from "./screens/RechnungenDesignScreen.js";
import RechnungScreen from "./screens/RechnungScreen.js";

export async function isRechnungenDesignAvailable({ api = globalThis.window?.bbmDb } = {}) {
  if (typeof api?.appGetBuildChannel !== "function") return false;
  try {
    const result = await api.appGetBuildChannel();
    return result?.ok === true && String(result?.channel || "").trim().toUpperCase() === "DEV";
  } catch (_error) {
    return false;
  }
}

export { RechnungScreen, RechnungenDesignScreen };
