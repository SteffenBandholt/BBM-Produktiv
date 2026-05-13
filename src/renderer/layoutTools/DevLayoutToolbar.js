export class DevLayoutToolbar {
  constructor({ surface, onPreviewChange, onZoneSelect, onSave, onReset } = {}) {
    // DEV-only helper UI: host modules must gate visibility/activation by build channel.
    // This toolbar:
    // - selects "layout zones" (not columns)
    // - emits live preview values to the host (no DB/IPC here)
    // - optionally triggers host-provided save/reset callbacks
    //
    // It is intentionally surface-driven (labels/zones/controls are defined by the host).

    // "surface" defines zones + labels + control availability.
    // Keep a tiny internal fallback to avoid breaking callers that don't pass it.
    this.surface =
      surface && typeof surface === "object"
        ? surface
        : {
            surfaceKey: "protokoll.toplist",
            label: "TOP-Liste",
            moduleId: "protokoll",
          zones: {
            number: { key: "number", label: "Nummernblock", controls: ["width", "inset", "font"] },
            text: { key: "text", label: "Textblock", controls: ["width", "inset", "font"] },
            meta: { key: "meta", label: "Metablock", controls: ["width", "inset", "font"] },
          },
        };
    this.onPreviewChange = typeof onPreviewChange === "function" ? onPreviewChange : null;
    this.onZoneSelect = typeof onZoneSelect === "function" ? onZoneSelect : null;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onReset = typeof onReset === "function" ? onReset : null;
    this.previewStateByZone = {
      list: { width: 940, inset: 0, font: 0 },
      number: { width: 64, inset: 5, font: 11 },
      // Text uses an actual width value so the text zone can be calibrated directly.
      text: { width: 0, inset: 5, font: 11 },
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
    this.line1El.textContent = `Layout: ${this.surface.label} | Bereich waehlen`;

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

    this.zonePickerWrap = document.createElement("div");
    this.zonePickerWrap.className = "bbm-dev-layout-toolbar-zones";
    this.zoneButtons = {};
    for (const zoneKey of ["list", "number", "text", "meta"]) {
      if (!this.surface?.zones?.[zoneKey]) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bbm-dev-layout-toolbar-zone-btn";
      btn.dataset.zone = zoneKey;
      btn.textContent = zoneKey === "text" ? "Gegenstand" : this.surface.zones[zoneKey].label;
      btn.onclick = () => {
        if (!this.onZoneSelect) return;
        this.clearStatus();
        this.onZoneSelect(zoneKey);
      };
      this.zoneButtons[zoneKey] = btn;
      this.zonePickerWrap.appendChild(btn);
    }

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

    this.root.append(this.headWrap, this.zonePickerWrap, this.controlsWrap, this.actionWrap, this.statusEl);
  }

  update({ enabled, activeZone } = {}) {
    const isEnabled = !!enabled;
    const zoneKey = this._normalizeZoneKey(activeZone);
    this.activeZone = isEnabled ? zoneKey : null;
    const zoneLabel = zoneKey ? this.surface?.zones?.[zoneKey]?.label || "" : "";
    const preview = zoneKey ? this.previewStateByZone[zoneKey] || this.previewStateByZone.number : null;

    this.root.hidden = !isEnabled;
    this.root.dataset.visible = isEnabled ? "true" : "false";
    this.root.dataset.activeZone = zoneKey || "";
    if (this.zonePickerWrap) this.zonePickerWrap.hidden = !isEnabled;
    for (const [key, btn] of Object.entries(this.zoneButtons || {})) {
      btn.dataset.active = key === zoneKey ? "true" : "false";
      btn.disabled = !isEnabled;
    }
    this.line1El.textContent = zoneLabel ? `${this.surface.label} > ${zoneLabel}` : `Layout: ${this.surface.label} | Bereich waehlen`;
    if (zoneLabel) {
      const widthLabel = zoneKey === "list" ? "Listenbreite" : zoneKey === "text" ? "Textbreite" : "Breite";
      if (zoneKey === "list") {
        this.line2El.textContent = `${widthLabel} ${preview?.width || 0} px`;
      } else {
        this.line2El.textContent = `${widthLabel} ${preview?.width || 0} px | Innen ${preview?.inset || 0} px | Schrift ${preview?.font || 0} px`;
      }
    } else {
      this.line2El.textContent = "";
    }
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
    return { root, valueEl: value, minusEl: minus, plusEl: plus, labelEl, key };
  }

  _getZonePreview(zoneKey) {
    const key = this._normalizeZoneKey(zoneKey);
    return key ? this.previewStateByZone[key] : null;
  }

  _syncControls(zoneKey) {
    const preview = this._getZonePreview(zoneKey) || { width: 0, inset: 0, font: 0 };
    if (this.controls?.width?.labelEl) {
      this.controls.width.labelEl.textContent = zoneKey === "list" ? "Listenbreite" : zoneKey === "text" ? "Textbreite" : "Breite";
    }
    for (const [key, control] of Object.entries(this.controls)) {
      const value = Number(preview?.[key] || 0);
      control.valueEl.textContent = key === "width" || key === "inset" || key === "font" ? `${value} px` : String(value);
      const zone = zoneKey ? this.surface?.zones?.[zoneKey] : null;
      const allowed = Array.isArray(zone?.controls) ? zone.controls : [];
      const isActiveControl = !!zoneKey && allowed.includes(key);
      control.minusEl.disabled = !isActiveControl;
      control.plusEl.disabled = !isActiveControl;
      control.root.dataset.active = zoneKey ? "true" : "false";
    }
    this._emitPreviewChange(zoneKey, preview);
  }

  _nudgeControl(controlKey, delta) {
    const zoneKey = this.activeZone;
    if (!zoneKey) return;
    if (!["width", "inset", "font"].includes(controlKey)) return;
    const zone = this.surface?.zones?.[zoneKey] || null;
    const allowed = Array.isArray(zone?.controls) ? zone.controls : [];
    if (!allowed.includes(controlKey)) return;
    const preview = this.previewStateByZone[zoneKey] || { width: 0, inset: 0, font: 0 };
    const step =
      zoneKey === "list" && controlKey === "width"
        ? 20
        : zoneKey === "text" && controlKey === "width"
          ? 20
        : controlKey === "inset"
          ? 2
          : controlKey === "font"
            ? 1
            : 5;
    const min =
      zoneKey === "text" && controlKey === "width"
        ? 120
        : controlKey === "inset"
          ? 0
          : controlKey === "font"
            ? 9
            : 50;
    const max =
      zoneKey === "text" && controlKey === "width"
        ? 1200
        : controlKey === "inset"
          ? 24
          : controlKey === "font"
            ? 16
            : 160;
    const effectiveMin = zoneKey === "list" && controlKey === "width" ? 720 : min;
    const effectiveMax = zoneKey === "list" && controlKey === "width" ? 1200 : max;
    const nextValue = Math.max(
      effectiveMin,
      Math.min(effectiveMax, Number(preview[controlKey] || 0) + delta * step),
    );
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
      activeZone: this._normalizeZoneKey(zoneKey),
      preview: preview || { width: 0, inset: 0, font: 0 },
    });
  }

  _normalizeZoneKey(value) {
    const key = String(value || "").trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(this.surface?.zones || {}, key) ? key : null;
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

  setNumberValues({ width, inset, font } = {}) {
    const next = {
      ...this.previewStateByZone.number,
    };
    if (width !== undefined) {
      const value = Number(width);
      next.width = Number.isFinite(value) ? Math.max(50, Math.min(160, Math.floor(value))) : 64;
    }
    if (inset !== undefined) {
      const value = Number(inset);
      next.inset = Number.isFinite(value) ? Math.max(0, Math.min(24, Math.floor(value))) : 5;
    }
    if (font !== undefined) {
      const value = Number(font);
      next.font = Number.isFinite(value) ? Math.max(9, Math.min(16, Math.floor(value))) : 11;
    }
    this.previewStateByZone.number = next;
    if (this.activeZone === "number") {
      this.update({ enabled: true, activeZone: "number" });
    }
    return this.getNumberValues();
  }

  getNumberValues() {
    const preview = this.previewStateByZone?.number || { width: 64, inset: 5, font: 11 };
    const width = Number(preview.width);
    const inset = Number(preview.inset);
    const font = Number(preview.font);
    return {
      width: Number.isFinite(width) ? width : 64,
      inset: Number.isFinite(inset) ? inset : 5,
      font: Number.isFinite(font) ? font : 11,
    };
  }

  setTextValues({ width, inset, font } = {}) {
    const next = {
      ...this.previewStateByZone.text,
    };
    if (width !== undefined) {
      const value = Number(width);
      next.width = Number.isFinite(value) ? Math.max(120, Math.min(1200, Math.floor(value))) : 0;
    }
    if (inset !== undefined) {
      const value = Number(inset);
      next.inset = Number.isFinite(value) ? Math.max(0, Math.min(24, Math.floor(value))) : 5;
    }
    if (font !== undefined) {
      const value = Number(font);
      next.font = Number.isFinite(value) ? Math.max(9, Math.min(16, Math.floor(value))) : 11;
    }
    this.previewStateByZone.text = next;
    if (this.activeZone === "text") {
      this.update({ enabled: true, activeZone: "text" });
    }
    return this.getTextValues();
  }

  getTextValues() {
    const preview = this.previewStateByZone?.text || { width: 0, inset: 5, font: 11 };
    const width = Number(preview.width);
    const inset = Number(preview.inset);
    const font = Number(preview.font);
    return {
      width: Number.isFinite(width) ? width : 0,
      inset: Number.isFinite(inset) ? inset : 5,
      font: Number.isFinite(font) ? font : 11,
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
