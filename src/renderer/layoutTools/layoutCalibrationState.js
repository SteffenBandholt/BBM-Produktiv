export const LAYOUT_CALIBRATION_SETTING_KEY = "dev.layoutCalibrationEnabled";
export const LAYOUT_CALIBRATION_CHANGED_EVENT = "bbm:layout-calibration-changed";
export const APP_SETTINGS_CHANGED_EVENT = "bbm:app-settings-changed";

export function parseLayoutCalibrationEnabled(value, fallback = false) {
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) return !!fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return !!fallback;
}

export async function loadLayoutCalibrationEnabled(api = null, fallback = false) {
  if (typeof api?.appSettingsGetMany !== "function") return !!fallback;
  try {
    const res = await api.appSettingsGetMany([LAYOUT_CALIBRATION_SETTING_KEY]);
    if (!res?.ok) return !!fallback;
    return parseLayoutCalibrationEnabled(res?.data?.[LAYOUT_CALIBRATION_SETTING_KEY], fallback);
  } catch (_err) {
    return !!fallback;
  }
}

