"use strict";

const MEETING_SERIES = Object.freeze([
  Object.freeze({ key: "construction", label: "Baubesprechungen", title: "Baubesprechung", bit: 1 }),
  Object.freeze({ key: "owner", label: "Bauherrenbesprechungen", title: "Bauherrenbesprechung", bit: 2 }),
  Object.freeze({ key: "planning", label: "Planungsbesprechungen", title: "Planungsbesprechung", bit: 4 }),
]);
function normalizeSeriesKey(value) {
  if (value === undefined || value === null) return "construction";
  if (typeof value !== "string" || !MEETING_SERIES.some(series => series.key === value)) throw new Error("Ungültige Besprechungsreihe.");
  return value;
}
function normalizeSeriesMask(value) {
  if (value === undefined) return 1;
  if (!Number.isInteger(value) || value < 0 || value > 7) throw new Error("Ungültige Aktivierung der Besprechungsarten.");
  return value;
}
function getSeriesDefinition(key) { return MEETING_SERIES.find(series => series.key === normalizeSeriesKey(key)); }
function isSeriesEnabled(project, key) { return (normalizeSeriesMask(project?.meeting_series_mask) & getSeriesDefinition(key).bit) !== 0; }
function resolveSeriesTitle(key, configuredTitle) {
  const series = getSeriesDefinition(key);
  return series.key === "construction" ? String(configuredTitle || series.title).trim() || series.title : series.title;
}
module.exports = { MEETING_SERIES, normalizeSeriesKey, normalizeSeriesMask, getSeriesDefinition, isSeriesEnabled, resolveSeriesTitle };
