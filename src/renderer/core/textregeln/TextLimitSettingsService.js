import { DEFAULT_TEXT_LIMITS } from "./TextRules.js";

export const TEXT_LIMIT_SETTINGS = Object.freeze({
  shortText: Object.freeze({
    key: "tops.titleMax",
    min: 1,
    max: 5000,
    fallback: DEFAULT_TEXT_LIMITS.shortText,
  }),
  longText: Object.freeze({
    key: "tops.longMax",
    min: 1,
    max: 20000,
    fallback: DEFAULT_TEXT_LIMITS.longText,
  }),
});

export const TEXT_LIMIT_SETTING_KEYS = Object.freeze({
  shortText: TEXT_LIMIT_SETTINGS.shortText.key,
  longText: TEXT_LIMIT_SETTINGS.longText.key,
});

function parseLimit(value, { min, max }, fallback) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function parseTextLimitSettings(data = {}) {
  return {
    shortText: parseLimit(
      data?.[TEXT_LIMIT_SETTING_KEYS.shortText],
      TEXT_LIMIT_SETTINGS.shortText,
      TEXT_LIMIT_SETTINGS.shortText.fallback
    ),
    longText: parseLimit(
      data?.[TEXT_LIMIT_SETTING_KEYS.longText],
      TEXT_LIMIT_SETTINGS.longText,
      TEXT_LIMIT_SETTINGS.longText.fallback
    ),
  };
}

export class TextLimitSettingsService {
  constructor({ api = null } = {}) {
    this.api = api;
  }

  _getApi() {
    return this.api || globalThis.window?.bbmDb || {};
  }

  async load() {
    const api = this._getApi();
    if (typeof api.appSettingsGetMany !== "function") {
      return { ...DEFAULT_TEXT_LIMITS };
    }

    try {
      const response = await api.appSettingsGetMany(Object.values(TEXT_LIMIT_SETTING_KEYS));
      if (!response?.ok) return { ...DEFAULT_TEXT_LIMITS };
      return parseTextLimitSettings(response.data || {});
    } catch (_error) {
      return { ...DEFAULT_TEXT_LIMITS };
    }
  }

  subscribe(onLimitsChanged) {
    const api = this._getApi();
    if (typeof api.appSettingsOnChanged !== "function" || typeof onLimitsChanged !== "function") {
      return () => {};
    }

    let active = true;
    const relevantKeys = new Set(Object.values(TEXT_LIMIT_SETTING_KEYS));
    const unsubscribe = api.appSettingsOnChanged(async (payload = {}) => {
      const changedKeys = Array.isArray(payload?.keys) ? payload.keys : [];
      if (changedKeys.length && !changedKeys.some((key) => relevantKeys.has(String(key)))) return;

      const limits = await this.load();
      if (active) onLimitsChanged(limits);
    });

    return () => {
      active = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }
}
