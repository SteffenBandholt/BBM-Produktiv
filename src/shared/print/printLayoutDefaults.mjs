export const PRINT_LAYOUT_DEFAULT_VALUES = Object.freeze({
  "print.v2.pagePadTopMm": "5",
  "print.v2.pagePadLeftMm": "12",
  "print.v2.pagePadRightMm": "12",
  "print.v2.pagePadBottomMm": "0",
  "print.v2.footerReserveMm": "12",
});

export function isMissingPrintLayoutValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function buildMissingPrintLayoutDefaults(settings = {}) {
  const missing = {};
  for (const [key, fallback] of Object.entries(PRINT_LAYOUT_DEFAULT_VALUES)) {
    if (isMissingPrintLayoutValue(settings?.[key])) missing[key] = fallback;
  }
  return missing;
}
