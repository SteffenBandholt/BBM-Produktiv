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
  constructor({ onPreviewChange } = {}) {
    this.onPreviewChange = typeof onPreviewChange === "function" ? onPreviewChange : null;
    this.previewStateByZone = {
      number: { width: 0, inset: 0, font: 0 },
      text: { width: 0, inset: 0, font: 0 },
      meta: { width: 0, inset: 0, font: 0 },
    };
    this.activeZone = null;

    this.root = document.createElement("div");
    this.root.setAttribute("data-bbm-dev-layout-toolbar", "true");
    this.root.hidden = true;

    this.headWrap = document.createElement("div");
    this.headWrap.className = "bbm-dev-layout-toolbar-head";

    this.line1El = document.createElement("div");
    this.line1El.className = "bbm-dev-layout-toolbar-line1";
    this.line1El.textContent = "Layout: TOP-Liste | Bereich waehlen";

    this.line2El = document.createElement("div");
    this.line2El.className = "bbm-dev-layout-toolbar-line2";
    this.line2El.textContent = "";

    this.controlsWrap = document.createElement("div");
    this.controlsWrap.className = "bbm-dev-layout-toolbar-controls";
    this.controlsWrap.hidden = true;

    this.controls = {
      width: this._buildControl("Breite", "width"),
      inset: this._buildControl("Innen", "inset"),
      font: this._buildControl("Schrift", "font"),
    };

    this.controlsWrap.append(this.controls.width.root, this.controls.inset.root, this.controls.font.root);

    this.headWrap.append(this.line1El, this.line2El);

    this.root.append(this.headWrap, this.controlsWrap);
  }

  update({ enabled, activeZone } = {}) {
    const isEnabled = !!enabled;
    const zoneKey = normalizeZoneKey(activeZone);
    this.activeZone = isEnabled ? zoneKey : null;
    const zoneLabel = zoneKey ? DEV_LAYOUT_ZONE_LABELS[zoneKey] : "";
    const preview = zoneKey ? this.previewStateByZone[zoneKey] || this.previewStateByZone.number : null;

    this.root.hidden = !isEnabled;
    this.root.dataset.visible = isEnabled ? "true" : "false";
    this.root.dataset.activeZone = zoneKey || "";
    this.line1El.textContent = zoneLabel ? `TOP-Liste > ${zoneLabel}` : "Layout: TOP-Liste | Bereich waehlen";
    this.line2El.textContent = zoneLabel
      ? `Breite ${preview?.width || 0} | Innen ${preview?.inset || 0} | Schrift ${preview?.font || 0}`
      : "";
    this.line2El.dataset.empty = zoneLabel ? "false" : "true";
    this.controlsWrap.hidden = !zoneLabel;
    this.controlsWrap.dataset.activeZone = zoneKey || "";
    this._syncControls(zoneKey);
  }

  _buildControl(label, key) {
    const root = document.createElement("div");
    root.className = "bbm-dev-layout-toolbar-control";
    root.dataset.control = key;

    const labelEl = document.createElement("div");
    labelEl.className = "bbm-dev-layout-toolbar-control-label";
    labelEl.textContent = label;

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "bbm-dev-layout-toolbar-control-btn";
    minus.textContent = "-";
    minus.setAttribute("aria-label", `${label} verringern`);
    minus.onclick = () => this._nudgeControl(key, -1);

    const value = document.createElement("div");
    value.className = "bbm-dev-layout-toolbar-control-value";
    value.textContent = "0";

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "bbm-dev-layout-toolbar-control-btn";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `${label} erhoehen`);
    plus.onclick = () => this._nudgeControl(key, 1);

    root.append(labelEl, minus, value, plus);
    return { root, valueEl: value, minusEl: minus, plusEl: plus, key };
  }

  _getZonePreview(zoneKey) {
    const key = normalizeZoneKey(zoneKey);
    return key ? this.previewStateByZone[key] : null;
  }

  _syncControls(zoneKey) {
    const preview = this._getZonePreview(zoneKey) || { width: 0, inset: 0, font: 0 };
    for (const [key, control] of Object.entries(this.controls)) {
      const value = Number(preview?.[key] || 0);
      control.valueEl.textContent = String(value);
      control.minusEl.disabled = !zoneKey;
      control.plusEl.disabled = !zoneKey;
      control.root.dataset.active = zoneKey ? "true" : "false";
    }
    this._emitPreviewChange(zoneKey, preview);
  }

  _nudgeControl(controlKey, delta) {
    const zoneKey = this.activeZone;
    if (!zoneKey) return;
    const preview = this.previewStateByZone[zoneKey] || { width: 0, inset: 0, font: 0 };
    const nextValue = Math.max(-3, Math.min(3, Number(preview[controlKey] || 0) + delta));
    const nextPreview = {
      ...preview,
      [controlKey]: nextValue,
    };
    this.previewStateByZone[zoneKey] = nextPreview;
    this.update({ enabled: true, activeZone: zoneKey });
  }

  _emitPreviewChange(zoneKey, preview) {
    if (!this.onPreviewChange) return;
    this.onPreviewChange({
      activeZone: normalizeZoneKey(zoneKey),
      preview: preview || { width: 0, inset: 0, font: 0 },
    });
  }
}

export { DEV_LAYOUT_ZONE_LABELS, normalizeZoneKey };
