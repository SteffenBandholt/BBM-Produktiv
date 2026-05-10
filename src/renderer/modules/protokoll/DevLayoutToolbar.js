const DEV_LAYOUT_ZONE_LABELS = Object.freeze({
  number: "Nummernblock",
  text: "Textblock",
  meta: "Metablock",
});

function normalizeZoneKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DEV_LAYOUT_ZONE_LABELS, key) ? key : null;
}

export class DevLayoutToolbar {
  constructor() {
    this.root = document.createElement("div");
    this.root.setAttribute("data-bbm-dev-layout-toolbar", "true");
    this.root.hidden = true;

    this.line1El = document.createElement("div");
    this.line1El.className = "bbm-dev-layout-toolbar-line1";
    this.line1El.textContent = "Layout: TOP-Liste";

    this.line2El = document.createElement("div");
    this.line2El.className = "bbm-dev-layout-toolbar-line2";
    this.line2El.textContent = "Bereich waehlen";

    this.root.append(this.line1El, this.line2El);
  }

  update({ enabled, activeZone } = {}) {
    const isEnabled = !!enabled;
    const zoneKey = normalizeZoneKey(activeZone);
    const zoneLabel = zoneKey ? DEV_LAYOUT_ZONE_LABELS[zoneKey] : "";

    this.root.hidden = !isEnabled;
    this.root.dataset.visible = isEnabled ? "true" : "false";
    this.root.dataset.activeZone = zoneKey || "";
    this.line2El.textContent = zoneLabel ? `Aktive Zone: ${zoneLabel}` : "Bereich waehlen";
    this.line2El.dataset.empty = zoneLabel ? "false" : "true";
  }
}

export { DEV_LAYOUT_ZONE_LABELS, normalizeZoneKey };
