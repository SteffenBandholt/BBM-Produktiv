export const TEXT_RULE_LEVEL = Object.freeze({
  OK: "ok",
  WARNING: "warning",
  LIMIT: "limit",
});

export const DEFAULT_TEXT_LIMITS = Object.freeze({
  shortText: 240,
  longText: 4000,
});

export const DEFAULT_WARNING_RATIO = 0.85;

function toText(value) {
  if (value == null) return "";
  return String(value);
}

function toPositiveNumber(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function toRatio(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 1) return fallback;
  return n;
}

function resolveLevel({ length, limit, warningRatio }) {
  if (length >= limit) return TEXT_RULE_LEVEL.LIMIT;
  if (length >= Math.floor(limit * warningRatio)) return TEXT_RULE_LEVEL.WARNING;
  return TEXT_RULE_LEVEL.OK;
}

export function evaluateTextLength(text, config = {}) {
  const normalizedText = toText(text);
  const limit = toPositiveNumber(config.limit, DEFAULT_TEXT_LIMITS.longText);
  const warningRatio = toRatio(config.warningRatio, DEFAULT_WARNING_RATIO);

  const length = normalizedText.length;
  const remaining = limit - length;
  const isOverLimit = remaining < 0;
  const level = resolveLevel({ length, limit, warningRatio });

  return {
    length,
    limit,
    remaining,
    level,
    isOverLimit,
  };
}

export function evaluateShortText(shortText, config = {}) {
  const limit = toPositiveNumber(config.limit, DEFAULT_TEXT_LIMITS.shortText);
  const warningRatio = toRatio(config.warningRatio, DEFAULT_WARNING_RATIO);
  return evaluateTextLength(shortText, { limit, warningRatio });
}

export function evaluateLongText(longText, config = {}) {
  const limit = toPositiveNumber(config.limit, DEFAULT_TEXT_LIMITS.longText);
  const warningRatio = toRatio(config.warningRatio, DEFAULT_WARNING_RATIO);
  return evaluateTextLength(longText, { limit, warningRatio });
}

