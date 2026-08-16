import { TextLimitSettingsService } from "../../core/textregeln/index.js";

export class TopsViewSettingsService {
  constructor({ view, textLimitSettingsService } = {}) {
    this.view = view;
    this.textLimitSettingsService = textLimitSettingsService || new TextLimitSettingsService();
  }

  async loadAmpelSetting() {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      this.view.showAmpelInList = true;
      this.view._applyAmpelVisibility();
      if (typeof this.view._updateAmpelToggleUi === "function") this.view._updateAmpelToggleUi();
      this.view._emitAmpelStateChanged();
      return;
    }

    const res = await api.appSettingsGetMany(["tops.ampelEnabled"]);
    if (!res?.ok) {
      this.view.showAmpelInList = true;
      this.view._applyAmpelVisibility();
      if (typeof this.view._updateAmpelToggleUi === "function") this.view._updateAmpelToggleUi();
      this.view._emitAmpelStateChanged();
      return;
    }

    const data = res.data || {};
    this.view.showAmpelInList = this.view._parseBool(data["tops.ampelEnabled"], true);
    this.view._applyAmpelVisibility();
    if (typeof this.view._updateAmpelToggleUi === "function") this.view._updateAmpelToggleUi();
    this.view._emitAmpelStateChanged();
  }

  async saveAmpelSetting() {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") return;

    const res = await api.appSettingsSetMany({
      "tops.ampelEnabled": this.view.showAmpelInList ? "true" : "false",
    });
    if (!res?.ok) {
      alert(res?.error || "Speichern fehlgeschlagen");
    }
  }

  async loadLongtextSetting() {
    if (this.view._longtextSettingLoaded) return;
    const key = "tops.showLongtextInList";
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([key]);
      if (res?.ok) {
        const data = res.data || {};
        this.view.showLongtextInList = this.view._parseBool(data[key], this.view.showLongtextInList);
      }
      this.view._longtextSettingLoaded = true;
      this.view._emitLongtextStateChanged();
      return;
    }

    try {
      const raw = window.localStorage?.getItem?.(key);
      if (raw != null) {
        this.view.showLongtextInList = this.view._parseBool(raw, this.view.showLongtextInList);
      }
    } catch (_e) {
      // ignore
    }
    this.view._longtextSettingLoaded = true;
    this.view._emitLongtextStateChanged();
  }

  async saveLongtextSetting() {
    const key = "tops.showLongtextInList";
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany === "function") {
      await api.appSettingsSetMany({ [key]: this.view.showLongtextInList ? "1" : "0" });
      return;
    }
    try {
      window.localStorage?.setItem?.(key, this.view.showLongtextInList ? "1" : "0");
    } catch (_e) {
      // ignore
    }
  }

  async loadTextLimitsSetting() {
    const limits = await this.textLimitSettingsService.load();
    this.view.titleMax = limits.shortText;
    this.view.longMax = limits.longText;

    const editbox = this.view.workbench?.sharedEditboxCore?.editbox;
    if (typeof editbox?.setLimits === "function") {
      editbox.setLimits(limits);
    } else {
      if (this.view.inpTitle) this.view.inpTitle.maxLength = limits.shortText;
      if (this.view.taLongtext) this.view.taLongtext.maxLength = limits.longText;
    }

    this.view._updateCharCounters();
    if (this.view.listEl) this.view._renderListOnly();
    this.view._updateTopBarMetaLabels();
  }

  async loadListFontScaleSetting(force = false) {
    if (this.view._listFontScaleLoaded && !force) return;
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      this.view.listFontScale = "medium";
      this.view._listFontScaleLoaded = true;
      return;
    }
    const res = await api.appSettingsGetMany(["tops.fontscale.list"]);
    if (!res?.ok) {
      this.view.listFontScale = "medium";
      this.view._listFontScaleLoaded = true;
      return;
    }
    const raw = String(res?.data?.["tops.fontscale.list"] || "").trim().toLowerCase();
    this.view.listFontScale = ["small", "medium", "large"].includes(raw) ? raw : "medium";
    this.view._listFontScaleLoaded = true;
  }

  async loadEditFontScaleSetting(force = false) {
    if (this.view._editFontScaleLoaded && !force) return;
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      this.view.editFontScale = "small";
      this.view._editFontScaleLoaded = true;
      return;
    }
    const res = await api.appSettingsGetMany(["tops.fontscale.editbox"]);
    if (!res?.ok) {
      this.view.editFontScale = "small";
      this.view._editFontScaleLoaded = true;
      return;
    }
    const raw = String(res?.data?.["tops.fontscale.editbox"] || "").trim().toLowerCase();
    this.view.editFontScale = ["small", "large"].includes(raw) ? raw : "small";
    this.view._editFontScaleLoaded = true;
  }

  async loadLevel1CollapsedSetting() {
    const pid = this.view.projectId ? String(this.view.projectId) : "";
    if (!pid) {
      this.view.level1Collapsed = new Set();
      this.view._level1CollapsedLoaded = true;
      this.view._level1CollapsedProjectId = null;
      return;
    }

    if (this.view._level1CollapsedLoaded && this.view._level1CollapsedProjectId === pid) return;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      this.view.level1Collapsed = new Set();
      this.view._level1CollapsedLoaded = true;
      this.view._level1CollapsedProjectId = pid;
      return;
    }

    const res = await api.appSettingsGetMany(["tops.level1Collapsed"]);
    if (!res?.ok) {
      this.view.level1Collapsed = new Set();
      this.view._level1CollapsedLoaded = true;
      this.view._level1CollapsedProjectId = pid;
      return;
    }

    const raw = String(res?.data?.["tops.level1Collapsed"] || "").trim();
    let map = {};
    try {
      const parsed = JSON.parse(raw || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        map = parsed;
      }
    } catch (e) {
      map = {};
    }

    this.view._level1CollapsedMap = map;
    const list = Array.isArray(map[pid]) ? map[pid] : [];
    this.view.level1Collapsed = new Set(list.map((x) => String(x)));
    this.view._level1CollapsedLoaded = true;
    this.view._level1CollapsedProjectId = pid;
  }

  async saveLevel1CollapsedSetting() {
    const pid = this.view.projectId ? String(this.view.projectId) : "";
    if (!pid) return;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") return;

    if (!this.view._level1CollapsedMap || typeof this.view._level1CollapsedMap !== "object") {
      this.view._level1CollapsedMap = {};
    }

    this.view._level1CollapsedMap[pid] = Array.from(this.view.level1Collapsed || []);
    const payload = {
      "tops.level1Collapsed": JSON.stringify(this.view._level1CollapsedMap),
    };

    await api.appSettingsSetMany(payload);
  }
}
