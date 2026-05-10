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
  constructor({ onPreviewChange, onSave, onReset } = {}) {
    this.onPreviewChange = typeof onPreviewChange === "function" ? onPreviewChange : null;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onReset = typeof onReset === "function" ? onReset : null;
    this.previewStateByZone = {
      number: { width: 0, inset: 0, font: 0 },
      text: { width: 0, inset: 0, font: 0 },
      meta: { width: 74, inset: 4, font: 11 },
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

    this.actionWrap = document.createElement("div");
    this.actionWrap.className = "bbm-dev-layout-toolbar-actions";

    this.saveButton = document.createElement("button");
    this.saveButton.type = "button";
    this.saveButton.className = "bbm-dev-layout-toolbar-action-btn";
    this.saveButton.textContent = "Speichern";
    this.saveButton.onclick = async () => {
      if (!this.onSave) return;
      await this.onSave();
    };

    this.resetButton = document.createElement("button");
    this.resetButton.type = "button";
    this.resetButton.className = "bbm-dev-layout-toolbar-action-btn";
    this.resetButton.textContent = "Reset";
    this.resetButton.onclick = async () => {
      if (!this.onReset) return;
      await this.onReset();
    };

    this.actionWrap.append(this.saveButton, this.resetButton);

    this.statusEl = document.createElement("div");
    this.statusEl.className = "bbm-dev-layout-toolbar-status";
    this.statusEl.hidden = true;

    this.root.append(this.headWrap, this.controlsWrap, this.actionWrap, this.statusEl);
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
      ? `Breite ${preview?.width || 0} px | Innen ${preview?.inset || 0} px | Schrift ${preview?.font || 0} px`
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
    value.textContent = key === "width" ? "74 px" : key === "inset" ? "4 px" : "11 px";

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
      control.valueEl.textContent = key === "width" || key === "inset" || key === "font" ? `${value} px` : String(value);
      const isMetaControl = zoneKey === "meta" && (key === "width" || key === "inset" || key === "font");
      control.minusEl.disabled = !isMetaControl;
      control.plusEl.disabled = !isMetaControl;
      control.root.dataset.active = zoneKey ? "true" : "false";
    }
    this._emitPreviewChange(zoneKey, preview);
  }

  _nudgeControl(controlKey, delta) {
    const zoneKey = this.activeZone;
    if (!zoneKey) return;
    if (zoneKey !== "meta" || !["width", "inset", "font"].includes(controlKey)) return;
    const preview = this.previewStateByZone[zoneKey] || { width: 0, inset: 0, font: 0 };
    const step = controlKey === "inset" ? 2 : controlKey === "font" ? 1 : 5;
    const min = controlKey === "inset" ? 0 : controlKey === "font" ? 9 : 50;
    const max = controlKey === "inset" ? 24 : controlKey === "font" ? 16 : 160;
    const nextValue = Math.max(min, Math.min(max, Number(preview[controlKey] || 0) + delta * step));
    const nextPreview = {
      ...preview,
      [controlKey]: nextValue,
    };
    this.previewStateByZone[zoneKey] = nextPreview;
    this.clearStatus();
    this.update({ enabled: true, activeZone: zoneKey });
  }

  _emitPreviewChange(zoneKey, preview) {
    if (!this.onPreviewChange) return;
    this.onPreviewChange({
      activeZone: normalizeZoneKey(zoneKey),
      preview: preview || { width: 0, inset: 0, font: 0 },
    });
  }

  setMetaWidth(width) {
    const value = Number(width);
    const next = Number.isFinite(value) ? Math.max(50, Math.min(160, Math.floor(value))) : 74;
    this.previewStateByZone.meta.width = next;
    if (this.activeZone === "meta") {
      this.update({ enabled: true, activeZone: "meta" });
    }
  }

  setMetaInset(inset) {
    const value = Number(inset);
    const next = Number.isFinite(value) ? Math.max(0, Math.min(24, Math.floor(value))) : 4;
    this.previewStateByZone.meta.inset = next;
    if (this.activeZone === "meta") {
      this.update({ enabled: true, activeZone: "meta" });
    }
  }

  setMetaFont(font) {
    const value = Number(font);
    const next = Number.isFinite(value) ? Math.max(9, Math.min(16, Math.floor(value))) : 11;
    this.previewStateByZone.meta.font = next;
    if (this.activeZone === "meta") {
      this.update({ enabled: true, activeZone: "meta" });
    }
  }

  setMetaValues({ width, inset, font } = {}) {
    if (width !== undefined) {
      const value = Number(width);
      this.previewStateByZone.meta.width = Number.isFinite(value)
        ? Math.max(50, Math.min(160, Math.floor(value)))
        : 74;
    }
    if (inset !== undefined) {
      const value = Number(inset);
      this.previewStateByZone.meta.inset = Number.isFinite(value)
        ? Math.max(0, Math.min(24, Math.floor(value)))
        : 4;
    }
    if (font !== undefined) {
      const value = Number(font);
      this.previewStateByZone.meta.font = Number.isFinite(value)
        ? Math.max(9, Math.min(16, Math.floor(value)))
        : 11;
    }
    if (this.activeZone === "meta") {
      this.update({ enabled: true, activeZone: "meta" });
    }
    return this.getMetaValues();
  }

  getMetaWidth() {
    return Number(this.previewStateByZone?.meta?.width || 74);
  }

  getMetaInset() {
    const value = Number(this.previewStateByZone?.meta?.inset);
    return Number.isFinite(value) ? value : 4;
  }

  getMetaFont() {
    const value = Number(this.previewStateByZone?.meta?.font);
    return Number.isFinite(value) ? value : 11;
  }

  getMetaValues() {
    return {
      width: this.getMetaWidth(),
      inset: this.getMetaInset(),
      font: this.getMetaFont(),
    };
  }

  setStatus(message = "") {
    const text = String(message || "").trim();
    this.statusEl.textContent = text;
    this.statusEl.hidden = !text;
  }

  clearStatus() {
    this.setStatus("");
  }
}

export { DEV_LAYOUT_ZONE_LABELS, normalizeZoneKey };
