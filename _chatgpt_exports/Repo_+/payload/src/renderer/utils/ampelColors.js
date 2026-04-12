// src/renderer/utils/ampelColors.js

export function ampelHexFrom(color) {
  const s = (color || "").toString().trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("#")) return s;
  if (s.startsWith("rgb(") || s.startsWith("rgba(")) return s;
  if (s === "green" || s === "gruen") return "#2e7d32";
  if (s === "orange" || s === "yellow" || s === "gelb") return "#ef6c00";
  if (s === "red" || s === "rot") return "#c62828";
  if (s === "blue" || s === "blau") return "#1565c0";
  return null;
}
