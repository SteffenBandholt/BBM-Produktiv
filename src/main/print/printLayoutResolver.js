const PRINT_LAYOUT_DEFAULTS = Object.freeze({
  pagePadLeftMm: 12,
  pagePadRightMm: 12,
  pagePadTopMm: 5,
  pagePadBottomMm: 0,
  footerReserveMm: 12,
});

function clampNumber(value, min, max, fallback) {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function resolvePrintLayoutSettings(settings = {}) {
  return {
    pagePadLeftMm: clampNumber(settings["print.v2.pagePadLeftMm"], 0, 30, PRINT_LAYOUT_DEFAULTS.pagePadLeftMm),
    pagePadRightMm: clampNumber(settings["print.v2.pagePadRightMm"], 0, 30, PRINT_LAYOUT_DEFAULTS.pagePadRightMm),
    pagePadTopMm: clampNumber(settings["print.v2.pagePadTopMm"], 0, 40, PRINT_LAYOUT_DEFAULTS.pagePadTopMm),
    pagePadBottomMm: clampNumber(settings["print.v2.pagePadBottomMm"], 0, 30, PRINT_LAYOUT_DEFAULTS.pagePadBottomMm),
    footerReserveMm: clampNumber(settings["print.v2.footerReserveMm"], 0, 30, PRINT_LAYOUT_DEFAULTS.footerReserveMm),
  };
}

module.exports = { PRINT_LAYOUT_DEFAULTS, resolvePrintLayoutSettings };
