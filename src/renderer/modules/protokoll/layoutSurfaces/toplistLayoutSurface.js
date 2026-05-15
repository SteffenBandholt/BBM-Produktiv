export const TOPLIST_LAYOUT_SURFACE = Object.freeze({
  surfaceKey: "protokoll.toplist",
  label: "TOP-Liste",
  moduleId: "protokoll",
  zones: Object.freeze({
    list: Object.freeze({
      key: "list",
      label: "Gesamtbreite",
      controls: Object.freeze(["width"]),
    }),
    number: Object.freeze({
      key: "number",
      label: "Nummernblock",
      controls: Object.freeze(["width", "inset", "font"]),
    }),
    text: Object.freeze({
      key: "text",
      label: "Textblock",
      // Width is treated as "Textbreite" in the UI (rest area stealing/giving space via meta col),
      // not as a direct fixed column width.
      controls: Object.freeze(["width", "inset", "font"]),
    }),
    meta: Object.freeze({
      key: "meta",
      label: "Metablock",
      controls: Object.freeze(["width", "inset", "font"]),
    }),
  }),
});

export const TOPLIST_LAYOUT_ZONE_LABELS = Object.freeze({
  list: TOPLIST_LAYOUT_SURFACE.zones.list.label,
  number: TOPLIST_LAYOUT_SURFACE.zones.number.label,
  text: TOPLIST_LAYOUT_SURFACE.zones.text.label,
  meta: TOPLIST_LAYOUT_SURFACE.zones.meta.label,
});

export function normalizeToplistZoneKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TOPLIST_LAYOUT_SURFACE.zones, key) ? key : null;
}
