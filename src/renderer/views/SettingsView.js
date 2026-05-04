// src/renderer/views/SettingsView.js
//
// Nutzerdaten werden primär aus user_profile geladen und dort gespeichert.
// Legacy-Werte aus app_settings bleiben nur als Fallback/Migrationsquelle.
// Persistenz: ueber window.bbmDb.userProfileGet/userProfileUpsert + appSettingsGetMany/appSettingsSetMany.

import { applyPopupButtonStyle, applyPopupCardStyle } from "../ui/popupButtonStyles.js";
import { createPopupOverlay, registerPopupCloseHandlers } from "../ui/popupCommon.js";
import { OVERLAY_TOP } from "../ui/zIndex.js";
import {
  DEFAULT_THEME_SETTINGS,
  applyThemeForSettings,
  normalizeThemeSettings,
  parseCssColor,
} from "../theme/themes.js";
import { createDictationDevSection } from "../modules/audio/index.js";

const DEFAULT_V2_PRE_REMARKS_TEXT =
  "folgende Punkte gelten als fest vereinbart, Diesen Text anpassen unter Einstellungen - Druckeinstellungen - Vorbemergung";
const DEFAULT_V2_PRE_REMARKS_ENABLED = true;
const PRINT_LAYOUT_MM_LIMITS = {
  "print.v2.pagePadTopMm": { min: 0, max: 40, step: 1, fallback: 2 },
  "print.v2.pagePadLeftMm": { min: 0, max: 30, step: 1, fallback: 12 },
  "print.v2.pagePadRightMm": { min: 0, max: 30, step: 1, fallback: 12 },
  "print.v2.pagePadBottomMm": { min: 0, max: 30, step: 1, fallback: 0 },
  "print.v2.footerReserveMm": { min: 0, max: 30, step: 1, fallback: 12 },
};
const PRINT_LAYOUT_DEFAULT_VALUES = {
  "print.v2.pagePadTopMm": "2",
  "print.v2.pagePadLeftMm": "12",
  "print.v2.pagePadRightMm": "12",
  "print.v2.pagePadBottomMm": "0",
  "print.v2.footerReserveMm": "12",
};
const THEME_DEFAULT_KEYS = [
  "defaults.ui.themeHeaderBaseColor",
  "defaults.ui.themeSidebarBaseColor",
  "defaults.ui.themeMainBaseColor",
  "defaults.ui.themeHeaderTone",
  "defaults.ui.themeSidebarTone",
  "defaults.ui.themeMainTone",
];

export default class SettingsView {
  constructor({ router } = {}) {
    this.router = router || null;

    this.root = null;
    this.msgEl = null;

    this.inpName = null;
    this.inpCompany = null;
    this.userName = "";
    this.userCompany = "";
    this.inpUserName1 = null;
    this.inpUserName2 = null;
    this.inpUserStreet = null;
    this.inpUserZip = null;
    this.inpUserCity = null;
    this.inpLogoSize = null;
    this.inpLogoPadLeft = null;
    this.inpLogoPadTop = null;
    this.inpLogoPadRight = null;
    this.inpLogoPosition = null;
    this.inpLogoEnabled = null;
    this.inpThemeHeaderTone = null;
    this.inpThemeSidebarTone = null;
    this.inpThemeMainTone = null;
    this.inpThemeHeaderBaseColor = null; // mapped to color picker value
    this.inpThemeSidebarBaseColor = null; // mapped to color picker value
    this.inpThemeMainBaseColor = null; // mapped to color picker value
    this.inpThemeHeaderName = null;
    this.inpThemeSidebarName = null;
    this.inpThemeMainName = null;
    this.inpThemeHeaderR = null;
    this.inpThemeHeaderG = null;
    this.inpThemeHeaderB = null;
    this.inpThemeSidebarR = null;
    this.inpThemeSidebarG = null;
    this.inpThemeSidebarB = null;
    this.inpThemeMainR = null;
    this.inpThemeMainG = null;
    this.inpThemeMainB = null;
    this.inpThemeHeaderDefault = null;
    this.inpThemeSidebarDefault = null;
    this.inpThemeMainDefault = null;
    this.inpThemeGlobalDefault = null;
    this.lblThemeHeaderTone = null;
    this.lblThemeSidebarTone = null;
    this.lblThemeMainTone = null;
    this.previewThemeHeaderColor = null; // kept for compatibility, not rendered
    this.previewThemeSidebarColor = null; // kept for compatibility, not rendered
    this.previewThemeMainColor = null; // kept for compatibility, not rendered
    this.pickThemeHeaderColor = null;
    this.pickThemeSidebarColor = null;
    this.pickThemeMainColor = null;
    this.lblThemeHeaderColorValue = null;
    this.lblThemeSidebarColorValue = null;
    this.lblThemeMainColorValue = null;
    this.errThemeHeaderColor = null;
    this.errThemeSidebarColor = null;
    this.errThemeMainColor = null;
    this.inpThemeHeaderHex = null;
    this.inpThemeSidebarHex = null;
    this.inpThemeMainHex = null;
    this.selThemeHeaderModel = null;
    this.selThemeSidebarModel = null;
    this.selThemeMainModel = null;
    this.canvasThemeHeaderSv = null;
    this.canvasThemeSidebarSv = null;
    this.canvasThemeMainSv = null;
    this.canvasThemeHeaderHue = null;
    this.canvasThemeSidebarHue = null;
    this.canvasThemeMainHue = null;
    this.cursorThemeHeaderSv = null;
    this.cursorThemeSidebarSv = null;
    this.cursorThemeMainSv = null;
    this.cursorThemeHeaderHue = null;
    this.cursorThemeSidebarHue = null;
    this.cursorThemeMainHue = null;
    this._themePickerState = {
      header: { h: 0, s: 0, v: 1 },
      sidebar: { h: 0, s: 0, v: 1 },
      main: { h: 0, s: 0, v: 1 },
    };
    this.inpSecurityPinEnabled = null;
    this.inpSecurityCurrentPin = null;
    this.inpSecurityNewPin = null;
    this.inpSecurityConfirmPin = null;
    this.btnSecurityPinSave = null;
    this.btnSecurityPinDisable = null;
    this._securityPinEnabled = false;
    this._securityPinSaving = false;

    this.inpPdfLogoEnabled = null;
    this.inpPdfLogoFile = null;
    this.imgPdfLogoPreview = null;
    this.pdfLogoDummyEl = null; // <-- Dummy-Platzhalter (graues Feld)
    this.btnPdfLogoRemove = null;
    this.pdfLogoPathEl = null;
    this.inpPdfLogoWidth = null;
    this.inpPdfLogoTop = null;
    this.inpPdfLogoRight = null;
    this.pdfLogoQualityEl = null;
    this._pdfLogoFilePath = "";
    this.inpPdfProtocolTitle = null;
    this.inpPdfTrafficLightAll = null;
    this.inpPdfFooterPlace = null;
    this.inpPdfFooterDate = null;
    this.inpPdfFooterName1 = null;
    this.inpPdfFooterName2 = null;
    this.inpPdfFooterRecorder = null;
    this.inpPdfFooterStreet = null;
    this.inpPdfFooterZip = null;
    this.inpPdfFooterCity = null;
    this.inpPdfProtocolsDir = null;
    this.inpPdfPreRemarks = null;
    this.btnPdfProtocolsBrowse = null;
    this.inpPdfFooterUseUserData = null;
    this.pdfFooterUseUserData = false;
    this.pdfPreRemarks = DEFAULT_V2_PRE_REMARKS_TEXT;
    this.pdfPreRemarksEnabled = DEFAULT_V2_PRE_REMARKS_ENABLED;
    this.btnPdfSettingsSave = null;
    this.btnPdfFooterUseUserData = null;
    this._pdfLogoDataUrl = "";
    this._pdfLogoPx = null;
    this.printLogoEnabledInputs = [null, null, null];
    this.printLogoFileInputs = [null, null, null];
    this.printLogoPreviewImgs = [null, null, null];
    this.printLogoPreviewFrames = [null, null, null];
    this.printLogoPlaceholderEls = [null, null, null];
    this.printLogoRemoveBtns = [null, null, null];
    this.printLogoSizeSelects = [null, null, null];
    this.printLogoAlignChecks = [null, null, null];
    this.printLogoVAlignChecks = [null, null, null];
    this.inpPrintHeaderAdaptive = null;
    this._printLogoDataUrls = ["", "", ""];
    this._printLogoSaving = false;
    this._printLogoSaveTimer = null;

    this.btnSave = null;
    this.btnArchive = null;
    this.saving = false;
    this._logoSaving = false;
    this._logoSaveTimer = null;
    this._themeSaving = false;
    this._themeSaveTimer = null;
    this._themeSaveMode = "user";
    this._themeRuntimeDefaults = { ...DEFAULT_THEME_SETTINGS };
    this._themeLastValid = {
      header: this._themeAreaDefaultRgb("header"),
      sidebar: this._themeAreaDefaultRgb("sidebar"),
      main: this._themeAreaDefaultRgb("main"),
    };
    this._pdfLogoSaving = false;
    this._pdfLogoSaveTimer = null;
    this._pdfSettingsSaving = false;
    this._pdfSettingsSaveTimer = null;
    this._pdfLogoLoadToken = 0;

    this.roleOrder = [];
    this.roleLabels = {};
    this.roleListEl = null;
    this.btnAddRole = null;
    this.inpAddRole = null;
    this.btnRoleMove = null;
    this.btnRoleMoveUp = null;
    this.btnRoleMoveDown = null;
    this.btnRoleDelete = null;
    this.btnRoleRename = null;
    this.roleActionBarEl = null;
    this.roleMoveHintEl = null;
    this.roleSelectedCode = null;
    this.roleMoveModeActive = false;
    this._roleMoveMouseDownHandler = null;
    this._roleMoveKeyDownHandler = null;
    this.roleRenameCode = null;
    this.roleRenameInputEl = null;
    this._roleSelectionAfterReload = null;

    this.deleteConfirmOverlayEl = null;
    this.deleteConfirmMsgEl = null;
    this.deleteConfirmOkBtn = null;
    this.deleteConfirmCancelBtn = null;
    this._deleteConfirmResolve = null;

    this.renameOverlayEl = null;
    this.renameInputEl = null;
    this.renameOkBtn = null;
    this.renameCancelBtn = null;
    this._renameResolve = null;

    this.settingsModalOverlayEl = null;
    this.settingsModalEl = null;
    this.settingsModalTitleEl = null;
    this.settingsModalBodyEl = null;
    this.settingsModalCloseBtn = null;
    this.settingsModalFooterEl = null;
    this.settingsModalSaveBtn = null;
    this._settingsModalSaveFn = null;
    this._settingsModalCloseOnly = false;
    this._settingsModalOpen = false;
    this._settingsInputs = null;
    this._bodyLockCount = 0;
    this._bodyOverflowBackup = null;
    this.devUnlocked = false;
    this._devUnlockHandler = null;
    this._devUnlockMsgTimer = null;
    this._devPopupOpen = false;
  }

  _formatLicenseReason(reason, fallbackError = "") {
    const code = String(reason || "").trim().toUpperCase();
    if (code === "NO_LICENSE") return "Keine Lizenz installiert";
    if (code === "LICENSE_EXPIRED") return "Lizenz abgelaufen";
    if (code === "INVALID_FORMAT") return "Ungueltige Lizenzdatei";
    if (code === "INVALID_SIGNATURE") return "Lizenzdatei konnte nicht verifiziert werden";
    if (code === "WRONG_PRODUCT") return "Lizenz gehoert zu einem anderen Produkt";
    if (code === "WRONG_MACHINE") return "Lizenz gehoert zu einem anderen Rechner";
    if (code === "PUBLIC_KEY_MISSING") return "Oeffentlicher Lizenzschluessel fehlt";
    if (code === "PUBLIC_KEY_INVALID") return "Oeffentlicher Lizenzschluessel ist ungueltig";
    return String(fallbackError || "Lizenzstatus konnte nicht geladen werden.");
  }

  _formatLicenseDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "-";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(dt);
    } catch (_e) {
      return raw;
    }
  }

  _formatLicenseWarning(res, fallbackReason = "") {
    if (res?.expired) return "Lizenz ist abgelaufen";

    const daysRemaining = Number(res?.daysRemaining);
    if (res?.expiresSoon && Number.isFinite(daysRemaining)) {
      if (daysRemaining <= 0) return "Lizenz laeuft heute ab";
      if (daysRemaining === 1) return "Lizenz laeuft in 1 Tag ab";
      return `Lizenz laeuft in ${daysRemaining} Tagen ab`;
    }

    return this._formatLicenseReason(res?.reason, fallbackReason);
  }

  _formatLicenseBinding(binding) {
    const code = String(binding || "").trim().toLowerCase() || "none";
    if (code === "machine") return "Vollversion (rechnergebunden)";
    return "Soft-Lizenz";
  }

  _setMsg(t) {
    if (!this.msgEl) return;
    this.msgEl.textContent = t || "";
  }

  _applyState() {
    const busy = !!this.saving;
    const logoBusy = busy || this._logoSaving || this._pdfLogoSaving;
    const themeBusy = busy || this._themeSaving;
    const securityBusy = busy || this._securityPinSaving;
    const pdfSettingsBusy = busy || this._pdfSettingsSaving;
    const printLogosBusy = busy || this._printLogoSaving;
    if (this.inpName) this.inpName.disabled = busy;
    if (this.inpCompany) this.inpCompany.disabled = busy;
    if (this.inpUserName1) this.inpUserName1.disabled = busy;
    if (this.inpUserName2) this.inpUserName2.disabled = busy;
    if (this.inpUserStreet) this.inpUserStreet.disabled = busy;
    if (this.inpUserZip) this.inpUserZip.disabled = busy;
    if (this.inpUserCity) this.inpUserCity.disabled = busy;
    if (this.inpLogoSize) this.inpLogoSize.disabled = logoBusy;
    if (this.inpLogoPadLeft) this.inpLogoPadLeft.disabled = logoBusy;
    if (this.inpLogoPadTop) this.inpLogoPadTop.disabled = logoBusy;
    if (this.inpLogoPadRight) this.inpLogoPadRight.disabled = logoBusy;
    if (this.inpLogoPosition) this.inpLogoPosition.disabled = logoBusy;
    if (this.inpLogoEnabled) this.inpLogoEnabled.disabled = logoBusy;
    if (this.inpThemeHeaderR) this.inpThemeHeaderR.disabled = themeBusy;
    if (this.inpThemeHeaderG) this.inpThemeHeaderG.disabled = themeBusy;
    if (this.inpThemeHeaderB) this.inpThemeHeaderB.disabled = themeBusy;
    if (this.inpThemeSidebarR) this.inpThemeSidebarR.disabled = themeBusy;
    if (this.inpThemeSidebarG) this.inpThemeSidebarG.disabled = themeBusy;
    if (this.inpThemeSidebarB) this.inpThemeSidebarB.disabled = themeBusy;
    if (this.inpThemeMainR) this.inpThemeMainR.disabled = themeBusy;
    if (this.inpThemeMainG) this.inpThemeMainG.disabled = themeBusy;
    if (this.inpThemeMainB) this.inpThemeMainB.disabled = themeBusy;
    if (this.inpThemeHeaderHex) this.inpThemeHeaderHex.disabled = themeBusy;
    if (this.inpThemeSidebarHex) this.inpThemeSidebarHex.disabled = themeBusy;
    if (this.inpThemeMainHex) this.inpThemeMainHex.disabled = themeBusy;
    if (this.selThemeHeaderModel) this.selThemeHeaderModel.disabled = themeBusy;
    if (this.selThemeSidebarModel) this.selThemeSidebarModel.disabled = themeBusy;
    if (this.selThemeMainModel) this.selThemeMainModel.disabled = themeBusy;
    if (this.canvasThemeHeaderSv) this.canvasThemeHeaderSv.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.canvasThemeSidebarSv) this.canvasThemeSidebarSv.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.canvasThemeMainSv) this.canvasThemeMainSv.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.canvasThemeHeaderHue) this.canvasThemeHeaderHue.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.canvasThemeSidebarHue) this.canvasThemeSidebarHue.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.canvasThemeMainHue) this.canvasThemeMainHue.style.pointerEvents = themeBusy ? "none" : "auto";
    if (this.inpThemeGlobalDefault) this.inpThemeGlobalDefault.disabled = themeBusy;
    if (this.inpSecurityCurrentPin) this.inpSecurityCurrentPin.disabled = securityBusy;
    if (this.inpSecurityNewPin) this.inpSecurityNewPin.disabled = securityBusy;
    if (this.inpSecurityConfirmPin) this.inpSecurityConfirmPin.disabled = securityBusy;
    if (this.btnSecurityPinSave) this.btnSecurityPinSave.disabled = securityBusy;
    if (this.btnSecurityPinDisable) this.btnSecurityPinDisable.disabled = securityBusy || !this._securityPinEnabled;
    if (this.inpPdfLogoEnabled) this.inpPdfLogoEnabled.disabled = logoBusy;
    if (this.inpPdfLogoFile) this.inpPdfLogoFile.disabled = logoBusy;
    if (this.pdfLogoPathEl) this.pdfLogoPathEl.disabled = logoBusy;
    if (this.inpPdfLogoWidth) this.inpPdfLogoWidth.disabled = logoBusy;
    if (this.inpPdfLogoTop) this.inpPdfLogoTop.disabled = logoBusy;
    if (this.inpPdfLogoRight) this.inpPdfLogoRight.disabled = logoBusy;
    if (this.btnPdfLogoRemove) this.btnPdfLogoRemove.disabled = logoBusy;
    if (this.inpPdfProtocolTitle) this.inpPdfProtocolTitle.disabled = pdfSettingsBusy;
    if (this.inpPdfTrafficLightAll) this.inpPdfTrafficLightAll.disabled = pdfSettingsBusy;
    if (this.inpPdfProtocolsDir) this.inpPdfProtocolsDir.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterPlace) this.inpPdfFooterPlace.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterDate) this.inpPdfFooterDate.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterName1) this.inpPdfFooterName1.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterName2) this.inpPdfFooterName2.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterRecorder) this.inpPdfFooterRecorder.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterStreet) this.inpPdfFooterStreet.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterZip) this.inpPdfFooterZip.disabled = pdfSettingsBusy;
    if (this.inpPdfFooterCity) this.inpPdfFooterCity.disabled = pdfSettingsBusy;
    if (this.btnPdfFooterUseUserData) this.btnPdfFooterUseUserData.disabled = pdfSettingsBusy;
    if (this.btnPdfProtocolsBrowse) this.btnPdfProtocolsBrowse.disabled = pdfSettingsBusy;
    if (this.btnPdfSettingsSave) this.btnPdfSettingsSave.disabled = pdfSettingsBusy;
    for (const inp of this.printLogoEnabledInputs || []) {
      if (inp) inp.disabled = printLogosBusy;
    }
    for (const inp of this.printLogoFileInputs || []) {
      if (inp) inp.disabled = printLogosBusy;
    }
    for (const btn of this.printLogoRemoveBtns || []) {
      if (btn) btn.disabled = printLogosBusy;
    }
    for (const sel of this.printLogoSizeSelects || []) {
      if (sel) sel.disabled = printLogosBusy;
    }
    if (this.inpPrintHeaderAdaptive) this.inpPrintHeaderAdaptive.disabled = printLogosBusy;
    for (const checks of this.printLogoAlignChecks || []) {
      if (!checks) continue;
      if (checks.left) checks.left.disabled = printLogosBusy;
      if (checks.center) checks.center.disabled = printLogosBusy;
      if (checks.right) checks.right.disabled = printLogosBusy;
    }
    for (const checks of this.printLogoVAlignChecks || []) {
      if (!checks) continue;
      if (checks.top) checks.top.disabled = printLogosBusy;
      if (checks.middle) checks.middle.disabled = printLogosBusy;
      if (checks.bottom) checks.bottom.disabled = printLogosBusy;
    }
    this._updateRoleActionsState();
    if (this.btnSave) this.btnSave.disabled = busy;
    // bewusst NICHT mehr disable'n (bekannter Delete-UI-Bug)
    if (this.btnAddRole) this.btnAddRole.disabled = false;
    if (this.inpAddRole) this.inpAddRole.disabled = false;
    this._renderRoleOrderList();
  }

  _normalizeUserText(value, maxLen = 80) {
    const v = String(value || "").trim();
    if (!v) return "";
    return v.length > maxLen ? v.slice(0, maxLen) : v;
  }

  _isTouchedTextValue(value) {
    return String(value ?? "").trim() !== "";
  }

  _buildTouchedPayloadFromValues(values = {}) {
    const payload = {};
    for (const [key, value] of Object.entries(values || {})) {
      if (!key) continue;
      if (!this._isTouchedTextValue(value)) continue;
      payload[`meta.touched.${key}`] = "1";
    }
    return payload;
  }

  _buildTouchedPayloadForKeys(keys = []) {
    const payload = {};
    for (const key of keys || []) {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) continue;
      payload[`meta.touched.${normalizedKey}`] = "1";
    }
    return payload;
  }

  _normalizePdfPreRemarks(value) {
    const raw = String(value || "").replace(/\r\n?/g, "\n");
    const lines = raw.split("\n").slice(0, 5);
    const normalized = lines
      .map((line) => line.replace(/[ \t]+$/g, ""))
      .join("\n")
      .trim();
    if (!normalized) return "";
    return normalized.length > 300 ? normalized.slice(0, 300) : normalized;
  }

  async _openPdfPreRemarksPopup() {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: OVERLAY_TOP });
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const modal = document.createElement("div");
    applyPopupCardStyle(modal);
    modal.style.width = "min(740px, calc(100vw - 24px))";
    modal.style.maxHeight = "calc(100vh - 24px)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.overflow = "hidden";
    modal.style.background = "#fff";
    modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    modal.style.padding = "0";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";
    head.style.padding = "12px 14px";
    head.style.borderBottom = "1px solid #e2e8f0";

    const title = document.createElement("div");
    title.textContent = "Vorbemerkung";
    title.style.fontWeight = "800";
    title.style.fontSize = "16px";

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Schliessen";
    applyPopupButtonStyle(btnClose);

    head.append(title, btnClose);

    const body = document.createElement("div");
    body.style.padding = "14px";
    body.style.overflow = "auto";
    body.style.display = "grid";
    body.style.gap = "8px";

    const enabledWrap = document.createElement("label");
    enabledWrap.style.display = "inline-flex";
    enabledWrap.style.alignItems = "center";
    enabledWrap.style.gap = "8px";
    enabledWrap.style.fontSize = "13px";
    enabledWrap.style.userSelect = "none";

    const chkEnabled = document.createElement("input");
    chkEnabled.type = "checkbox";
    chkEnabled.checked = !!this.pdfPreRemarksEnabled;
    const enabledText = document.createElement("span");
    enabledText.textContent = "Vorbemerkung drucken";
    enabledWrap.append(chkEnabled, enabledText);

    const infoRow = document.createElement("div");
    infoRow.style.display = "flex";
    infoRow.style.justifyContent = "space-between";
    infoRow.style.alignItems = "center";
    infoRow.style.gap = "10px";

    const help = document.createElement("div");
    help.textContent = "(max 300 Zeichen in 5 Zeilen)";
    help.style.fontSize = "12px";
    help.style.opacity = "0.75";

    const badge = document.createElement("span");
    badge.style.fontSize = "12px";
    badge.style.opacity = "0.9";
    badge.title = "Restliche Zeichen";
    badge.style.padding = "1px 7px";
    badge.style.border = "1px solid #ddd";
    badge.style.borderRadius = "999px";
    badge.style.background = "#fff";
    badge.style.minWidth = "44px";
    badge.style.textAlign = "right";
    badge.style.fontVariantNumeric = "tabular-nums";

    infoRow.append(help, badge);

    const ta = document.createElement("textarea");
    ta.rows = 5;
    ta.maxLength = 300;
    ta.style.width = "100%";
    ta.style.resize = "vertical";
    ta.style.fontFamily = "var(--bbm-font-ui)";
    ta.style.fontSize = "11pt";
    ta.style.lineHeight = "1.35";
    ta.value = String(this.pdfPreRemarks || "");

    const normalizeLocal = () => {
      let v = String(ta.value || "").replace(/\r\n?/g, "\n");
      const lines = v.split("\n");
      if (lines.length > 5) v = lines.slice(0, 5).join("\n");
      if (v.length > 300) v = v.slice(0, 300);
      if (v !== ta.value) ta.value = v;
      badge.textContent = String(Math.max(0, 300 - ta.value.length));
    };
    normalizeLocal();
    ta.addEventListener("input", normalizeLocal);
    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      // Enter erzeugt im Textfeld immer einen Zeilenumbruch (kein Weiterreichen an uebergeordnete Handler).
      e.preventDefault();
      e.stopPropagation();
      const start = Number(ta.selectionStart || 0);
      const end = Number(ta.selectionEnd || start);
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      ta.value = `${before}\n${after}`;
      const nextPos = start + 1;
      ta.selectionStart = nextPos;
      ta.selectionEnd = nextPos;
      normalizeLocal();
    });

    body.append(enabledWrap, infoRow, ta);

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.gap = "8px";
    footer.style.padding = "10px 14px";
    footer.style.borderTop = "1px solid #e2e8f0";

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Abbrechen";
    applyPopupButtonStyle(btnCancel);

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Speichern";
    applyPopupButtonStyle(btnSave, { variant: "primary" });

    footer.append(btnCancel, btnSave);
    modal.append(head, body, footer);
    overlay.appendChild(modal);

    return new Promise((resolve) => {
      const close = (result) => {
        overlay.removeEventListener("mousedown", onOverlayDown);
        overlay.removeEventListener("keydown", onOverlayKeyDown);
        btnClose.removeEventListener("click", onCancel);
        btnCancel.removeEventListener("click", onCancel);
        btnSave.removeEventListener("click", onSave);
        try {
          overlay.remove();
        } catch {
          // ignore
        }
        resolve(result);
      };

      const onCancel = () => close(false);
      const onOverlayDown = (e) => {
        if (e.target !== overlay) return;
        onCancel();
      };
      const onOverlayKeyDown = (e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        onCancel();
      };
      const onSave = async () => {
        normalizeLocal();
        const normalized = this._normalizePdfPreRemarks(ta.value);
        const payload = {
          "pdf.preRemarks": normalized,
          "print.preRemarks.enabled": chkEnabled.checked ? "true" : "false",
          ...this._buildTouchedPayloadFromValues({
            "pdf.preRemarks": normalized,
          }),
          ...this._buildTouchedPayloadForKeys(["print.preRemarks.enabled"]),
        };
        const res = await api.appSettingsSetMany(payload);
        if (!res?.ok) {
          alert(res?.error || "Speichern fehlgeschlagen");
          return;
        }
        this.pdfPreRemarks = normalized;
        this.pdfPreRemarksEnabled = !!chkEnabled.checked;
        if (this.router?.context) {
          this.router.context.settings = {
            ...(this.router.context.settings || {}),
            "pdf.preRemarks": normalized,
            "print.preRemarks.enabled": chkEnabled.checked ? "true" : "false",
          };
        }
        close(true);
      };

      overlay.addEventListener("mousedown", onOverlayDown);
      overlay.addEventListener("keydown", onOverlayKeyDown);
      btnClose.addEventListener("click", onCancel);
      btnCancel.addEventListener("click", onCancel);
      btnSave.addEventListener("click", onSave);

      document.body.appendChild(overlay);
      setTimeout(() => {
        try {
          ta.focus();
          ta.selectionStart = ta.value.length;
          ta.selectionEnd = ta.value.length;
        } catch {
          // ignore
        }
      }, 0);
    });
  }

  _normalizeUserZip(value, maxLen = 10) {
    const v = String(value || "").trim().replace(/\D+/g, "");
    if (!v) return "";
    const lim = Math.max(1, Number(maxLen) || 10);
    return v.length > lim ? v.slice(0, lim) : v;
  }

  _normalizeUserProfileRecord(profile) {
    if (!profile || typeof profile !== "object") return null;
    return {
      name1: this._normalizeUserText(profile.name1, 80),
      name2: this._normalizeUserText(profile.name2, 80),
      street: this._normalizeUserText(profile.street, 80),
      zip: this._normalizeUserZip(profile.zip, 5),
      city: this._normalizeUserText(profile.city, 80),
    };
  }

  _resolveUserSettingsState({ data = {}, profile = null } = {}) {
    const legacy = {
      userName: this._normalizeUserText(data.user_name, 80),
      userCompany: this._normalizeUserText(data.user_company, 80),
      name1: this._normalizeUserText(data.user_name1, 80),
      name2: this._normalizeUserText(data.user_name2, 80),
      street: this._normalizeUserText(data.user_street, 80),
      zip: this._normalizeUserZip(data.user_zip, 5),
      city: this._normalizeUserText(data.user_city, 80),
    };
    const profileRecord = this._normalizeUserProfileRecord(profile);
    const profileHasAny = !!profileRecord && Object.values(profileRecord).some((value) => !!String(value || "").trim());
    const legacyProfileHasAny = Object.values({
      name1: legacy.name1,
      name2: legacy.name2,
      street: legacy.street,
      zip: legacy.zip,
      city: legacy.city,
    }).some((value) => !!String(value || "").trim());

    const resolvedProfile = {
      name1: profileHasAny && profileRecord.name1 ? profileRecord.name1 : legacy.name1,
      name2: profileHasAny && profileRecord.name2 ? profileRecord.name2 : legacy.name2,
      street: profileHasAny && profileRecord.street ? profileRecord.street : legacy.street,
      zip: profileHasAny && profileRecord.zip ? profileRecord.zip : legacy.zip,
      city: profileHasAny && profileRecord.city ? profileRecord.city : legacy.city,
    };
    const profileFallbackUsed =
      (!profileHasAny && legacyProfileHasAny) ||
      (profileHasAny &&
        Object.entries(resolvedProfile).some(([key, value]) => value !== (profileRecord?.[key] || "")));

    return {
      userName: legacy.userName,
      userCompany: legacy.userCompany,
      userName1: resolvedProfile.name1,
      userName2: resolvedProfile.name2,
      userStreet: resolvedProfile.street,
      userZip: resolvedProfile.zip,
      userCity: resolvedProfile.city,
      profileRecord: resolvedProfile,
      profileHasAny,
      legacyProfileHasAny,
      profileFallbackUsed,
    };
  }

  _isPrintLayoutMmKey(key) {
    return Object.prototype.hasOwnProperty.call(PRINT_LAYOUT_MM_LIMITS, String(key || "").trim());
  }

  _normalizePrintLayoutMmValue(value, key) {
    const limits = PRINT_LAYOUT_MM_LIMITS[String(key || "").trim()];
    if (!limits) return String(value ?? "");
    const fallback = Number.isFinite(Number(limits.fallback)) ? Number(limits.fallback) : 0;
    const raw = String(value ?? "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(fallback);
    const rounded = Math.round(n);
    const min = Number.isFinite(Number(limits.min)) ? Number(limits.min) : 0;
    const max = Number.isFinite(Number(limits.max)) ? Number(limits.max) : rounded;
    const clamped = Math.max(min, Math.min(max, rounded));
    return String(clamped);
  }

  _normalizePrintLayoutMmLimits(key) {
    return PRINT_LAYOUT_MM_LIMITS[String(key || "").trim()] || null;
  }

  _resetPrintLayoutFields() {
    const keys = Object.keys(PRINT_LAYOUT_DEFAULT_VALUES);
    for (const key of keys) {
      const inp = this._settingsInputs?.get?.(key);
      if (!inp) continue;
      inp.value = PRINT_LAYOUT_DEFAULT_VALUES[key];
    }
  }

  _clampLogoNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const v = Math.round(n);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  _logoDefaults() {
    return {
      size: 20,
      padLeft: 0,
      padTop: 0,
      padRight: 0,
      position: "left",
      enabled: true,
    };
  }

  _normalizeLogoPosition(value, fallback = "left") {
    const s = String(value || "").trim().toLowerCase();
    if (s === "right" || s === "rechts") return "right";
    if (s === "left" || s === "links") return "left";
    return fallback;
  }

  _getLogoInputValues() {
    const defaults = this._logoDefaults();
    const size = this._clampLogoNumber(this.inpLogoSize?.value, 12, 48, defaults.size);
    const padLeft = this._clampLogoNumber(
      this.inpLogoPadLeft?.value,
      0,
      40,
      defaults.padLeft
    );
    const padTop = this._clampLogoNumber(this.inpLogoPadTop?.value, 0, 20, defaults.padTop);
    const padRight = this._clampLogoNumber(
      this.inpLogoPadRight?.value,
      0,
      80,
      defaults.padRight
    );
    const position = this._normalizeLogoPosition(this.inpLogoPosition?.value, defaults.position);
    const enabled = !!this.inpLogoEnabled?.checked;
    return { size, padLeft, padTop, padRight, position, enabled };
  }

  _applyLogoInputs({ size, padLeft, padTop, padRight, position, enabled }) {
    if (this.inpLogoSize) this.inpLogoSize.value = String(size);
    if (this.inpLogoPadLeft) this.inpLogoPadLeft.value = String(padLeft);
    if (this.inpLogoPadTop) this.inpLogoPadTop.value = String(padTop);
    if (this.inpLogoPadRight) this.inpLogoPadRight.value = String(padRight);
    if (this.inpLogoPosition) this.inpLogoPosition.value = this._normalizeLogoPosition(position, "left");
    if (this.inpLogoEnabled) this.inpLogoEnabled.checked = !!enabled;
  }

  _scheduleLogoSave() {
    if (this._logoSaveTimer) {
      clearTimeout(this._logoSaveTimer);
      this._logoSaveTimer = null;
    }
    this._logoSaveTimer = setTimeout(() => {
      this._logoSaveTimer = null;
      this._saveLogoSettings();
    }, 200);
  }

  async _saveLogoSettings() {
    if (this._logoSaving) return false;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const { size, padLeft, padTop, padRight, position, enabled } = this._getLogoInputValues();
    this._applyLogoInputs({ size, padLeft, padTop, padRight, position, enabled });

    this._logoSaving = true;
    try {
      const res = await api.appSettingsSetMany({
        "header.logoSizePx": size,
        "header.logoPadLeftPx": padLeft,
        "header.logoPadTopPx": padTop,
        "header.logoPadRightPx": padRight,
        "header.logoPosition": position,
        "header.logoEnabled": enabled ? "true" : "false",
      });
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          "header.logoSizePx": size,
          "header.logoPadLeftPx": padLeft,
          "header.logoPadTopPx": padTop,
          "header.logoPadRightPx": padRight,
          "header.logoPosition": position,
          "header.logoEnabled": enabled ? "true" : "false",
        };
      }

      window.dispatchEvent(new Event("bbm:header-refresh"));
      return true;
    } catch (err) {
      console.error("[SettingsView] _saveLogoSettings failed", {
        message: err?.message || String(err),
        stack: err?.stack || null,
      });
      alert(err?.message || "Speichern fehlgeschlagen");
      return false;
    } finally {
      this._logoSaving = false;
    }
  }

  _themeDefaults() {
    return { ...(this._themeRuntimeDefaults || DEFAULT_THEME_SETTINGS) };
  }

  _setThemeRuntimeDefaults(values = {}) {
    const normalized = normalizeThemeSettings({
      ...DEFAULT_THEME_SETTINGS,
      ...values,
      headerUseDefault: false,
      sidebarUseDefault: false,
      mainUseDefault: false,
    });
    this._themeRuntimeDefaults = {
      ...DEFAULT_THEME_SETTINGS,
      headerBaseColor: normalized.headerBaseColor,
      sidebarBaseColor: normalized.sidebarBaseColor,
      mainBaseColor: normalized.mainBaseColor,
      headerTone: normalized.headerTone,
      sidebarTone: normalized.sidebarTone,
      mainTone: normalized.mainTone,
      headerUseDefault: false,
      sidebarUseDefault: false,
      mainUseDefault: false,
    };
  }

  _readThemeStartDefaultsFromData(data = {}) {
    const defaults = this._themeDefaults();
    return {
      headerBaseColor: String(
        data["defaults.ui.themeHeaderBaseColor"] || defaults.headerBaseColor || ""
      ).trim() || defaults.headerBaseColor,
      sidebarBaseColor: String(
        data["defaults.ui.themeSidebarBaseColor"] || defaults.sidebarBaseColor || ""
      ).trim() || defaults.sidebarBaseColor,
      mainBaseColor: String(
        data["defaults.ui.themeMainBaseColor"] || defaults.mainBaseColor || ""
      ).trim() || defaults.mainBaseColor,
      headerTone: this._clampThemeTone(data["defaults.ui.themeHeaderTone"], defaults.headerTone),
      sidebarTone: this._clampThemeTone(data["defaults.ui.themeSidebarTone"], defaults.sidebarTone),
      mainTone: this._clampThemeTone(data["defaults.ui.themeMainTone"], defaults.mainTone),
    };
  }

  _clampThemeTone(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return Math.round(n);
  }

  _updateThemeToneLabels() {
    const mk = (n) => {
      const t = this._clampThemeTone(n, 0);
      if (t <= 10) return `${t} (Hell)`;
      if (t >= 90) return `${t} (Dunkel)`;
      return `${t}`;
    };
    if (this.lblThemeHeaderTone) this.lblThemeHeaderTone.textContent = mk(this.inpThemeHeaderTone?.value);
    if (this.lblThemeSidebarTone) this.lblThemeSidebarTone.textContent = mk(this.inpThemeSidebarTone?.value);
    if (this.lblThemeMainTone) this.lblThemeMainTone.textContent = mk(this.inpThemeMainTone?.value);
  }

  _setThemeColorError(area, text) {
    const msg = String(text || "");
    if (area === "header" && this.errThemeHeaderColor) this.errThemeHeaderColor.textContent = msg;
    if (area === "sidebar" && this.errThemeSidebarColor) this.errThemeSidebarColor.textContent = msg;
    if (area === "main" && this.errThemeMainColor) this.errThemeMainColor.textContent = msg;
  }

  _themeAreaDefaultHex(area) {
    const defaults = this._themeDefaults();
    if (area === "header") return defaults.headerBaseColor || DEFAULT_THEME_SETTINGS.headerBaseColor;
    if (area === "sidebar") return defaults.sidebarBaseColor || DEFAULT_THEME_SETTINGS.sidebarBaseColor;
    return defaults.mainBaseColor || DEFAULT_THEME_SETTINGS.mainBaseColor;
  }

  _themeHexToRgb(hex, fallback = { r: 255, g: 255, b: 255 }) {
    const fb =
      fallback && typeof fallback === "object" ? fallback : { r: 255, g: 255, b: 255 };
    const parsed = parseCssColor(hex);
    if (!parsed?.rgb) return fallback && typeof fallback === "object" ? { ...fallback } : null;
    return {
      r: this._clampThemeRgb(parsed.rgb.r, fb.r),
      g: this._clampThemeRgb(parsed.rgb.g, fb.g),
      b: this._clampThemeRgb(parsed.rgb.b, fb.b),
    };
  }

  _themeAreaDefaultRgb(area) {
    return this._themeHexToRgb(this._themeAreaDefaultHex(area));
  }

  _themeRgbToHex({ r, g, b }) {
    const toHex2 = (n) => this._clampThemeRgb(n, 0).toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  }

  _clampThemeRgb(value, fallback) {
    if (value == null || value === "") return fallback;
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < 0) return 0;
    if (n > 255) return 255;
    return Math.round(n);
  }

  _clamp01(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  _clampHue(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    let h = n % 360;
    if (h < 0) h += 360;
    return h;
  }

  _themeRgbToHsv(rgb) {
    const r = this._clampThemeRgb(rgb?.r, 0) / 255;
    const g = this._clampThemeRgb(rgb?.g, 0) / 255;
    const b = this._clampThemeRgb(rgb?.b, 0) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  }

  _themeHsvToRgb(hsv) {
    const h = this._clampHue(hsv?.h, 0);
    const s = this._clamp01(hsv?.s, 0);
    const v = this._clamp01(hsv?.v, 1);
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    return {
      r: this._clampThemeRgb((rp + m) * 255, 0),
      g: this._clampThemeRgb((gp + m) * 255, 0),
      b: this._clampThemeRgb((bp + m) * 255, 0),
    };
  }

  _getThemeAreaInputs(area) {
    if (area === "header") {
      return {
        model: this.selThemeHeaderModel,
        r: this.inpThemeHeaderR,
        g: this.inpThemeHeaderG,
        b: this.inpThemeHeaderB,
        hex: this.inpThemeHeaderHex,
        svCanvas: this.canvasThemeHeaderSv,
        hueCanvas: this.canvasThemeHeaderHue,
        svCursor: this.cursorThemeHeaderSv,
        hueCursor: this.cursorThemeHeaderHue,
        preview: this.previewThemeHeaderColor,
        value: this.lblThemeHeaderColorValue,
      };
    }
    if (area === "sidebar") {
      return {
        model: this.selThemeSidebarModel,
        r: this.inpThemeSidebarR,
        g: this.inpThemeSidebarG,
        b: this.inpThemeSidebarB,
        hex: this.inpThemeSidebarHex,
        svCanvas: this.canvasThemeSidebarSv,
        hueCanvas: this.canvasThemeSidebarHue,
        svCursor: this.cursorThemeSidebarSv,
        hueCursor: this.cursorThemeSidebarHue,
        preview: this.previewThemeSidebarColor,
        value: this.lblThemeSidebarColorValue,
      };
    }
    return {
      model: this.selThemeMainModel,
      r: this.inpThemeMainR,
      g: this.inpThemeMainG,
      b: this.inpThemeMainB,
      hex: this.inpThemeMainHex,
      svCanvas: this.canvasThemeMainSv,
      hueCanvas: this.canvasThemeMainHue,
      svCursor: this.cursorThemeMainSv,
      hueCursor: this.cursorThemeMainHue,
      preview: this.previewThemeMainColor,
      value: this.lblThemeMainColorValue,
    };
  }

  _setThemeAreaRgbInputs(area, rgb) {
    const refs = this._getThemeAreaInputs(area);
    if (refs.r) refs.r.value = String(this._clampThemeRgb(rgb?.r, 0));
    if (refs.g) refs.g.value = String(this._clampThemeRgb(rgb?.g, 0));
    if (refs.b) refs.b.value = String(this._clampThemeRgb(rgb?.b, 0));
  }

  _readThemeAreaRgb(area, fallback) {
    const refs = this._getThemeAreaInputs(area);
    return {
      r: this._clampThemeRgb(refs.r?.value, fallback.r),
      g: this._clampThemeRgb(refs.g?.value, fallback.g),
      b: this._clampThemeRgb(refs.b?.value, fallback.b),
    };
  }

  _ensureThemeAreaEditableOnInput(area) {
    void area;
  }

  _bindThemeCanvasDrag(canvas, onInput) {
    if (!canvas || typeof onInput !== "function") return;
    canvas.addEventListener("pointerdown", (evDown) => {
      const id = evDown.pointerId;
      const step = (e) => onInput(e);
      step(evDown);
      const onMove = (e) => {
        if (e.pointerId !== id) return;
        step(e);
      };
      const onEnd = (e) => {
        if (e.pointerId !== id) return;
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onEnd);
        canvas.removeEventListener("pointercancel", onEnd);
      };
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onEnd);
      canvas.addEventListener("pointercancel", onEnd);
      if (typeof canvas.setPointerCapture === "function") canvas.setPointerCapture(id);
    });
  }

  _syncThemePickerStateFromRgb(area, rgb) {
    const hsv = this._themeRgbToHsv(rgb);
    this._themePickerState[area] = {
      h: this._clampHue(hsv.h, 0),
      s: this._clamp01(hsv.s, 0),
      v: this._clamp01(hsv.v, 1),
    };
  }

  _drawThemePicker(area) {
    const refs = this._getThemeAreaInputs(area);
    const st = this._themePickerState[area] || { h: 0, s: 0, v: 1 };
    const sv = refs.svCanvas;
    const hue = refs.hueCanvas;
    if (!sv || !hue) return;

    const svCtx = sv.getContext("2d");
    if (svCtx) {
      const w = sv.width;
      const h = sv.height;
      const pure = this._themeHsvToRgb({ h: st.h, s: 1, v: 1 });
      svCtx.fillStyle = `rgb(${pure.r},${pure.g},${pure.b})`;
      svCtx.fillRect(0, 0, w, h);
      const white = svCtx.createLinearGradient(0, 0, w, 0);
      white.addColorStop(0, "rgba(255,255,255,1)");
      white.addColorStop(1, "rgba(255,255,255,0)");
      svCtx.fillStyle = white;
      svCtx.fillRect(0, 0, w, h);
      const black = svCtx.createLinearGradient(0, 0, 0, h);
      black.addColorStop(0, "rgba(0,0,0,0)");
      black.addColorStop(1, "rgba(0,0,0,1)");
      svCtx.fillStyle = black;
      svCtx.fillRect(0, 0, w, h);
    }

    const hueCtx = hue.getContext("2d");
    if (hueCtx) {
      const grad = hueCtx.createLinearGradient(0, 0, 0, hue.height);
      grad.addColorStop(0.0, "#ff0000");
      grad.addColorStop(0.17, "#ffff00");
      grad.addColorStop(0.34, "#00ff00");
      grad.addColorStop(0.51, "#00ffff");
      grad.addColorStop(0.68, "#0000ff");
      grad.addColorStop(0.85, "#ff00ff");
      grad.addColorStop(1.0, "#ff0000");
      hueCtx.fillStyle = grad;
      hueCtx.fillRect(0, 0, hue.width, hue.height);
    }

    if (refs.svCursor) {
      refs.svCursor.style.left = `${Math.round(st.s * (sv.width - 1))}px`;
      refs.svCursor.style.top = `${Math.round((1 - st.v) * (sv.height - 1))}px`;
    }
    if (refs.hueCursor) {
      refs.hueCursor.style.top = `${Math.round((st.h / 360) * (hue.height - 1))}px`;
    }
  }

  _handleThemeSvCanvasInput(area, e) {
    this._ensureThemeAreaEditableOnInput(area);
    const refs = this._getThemeAreaInputs(area);
    const canvas = refs.svCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);
    const s = rect.width <= 0 ? 0 : x / rect.width;
    const v = rect.height <= 0 ? 1 : 1 - y / rect.height;
    const st = this._themePickerState[area] || { h: 0, s: 0, v: 1 };
    this._themePickerState[area] = { ...st, s: this._clamp01(s, st.s), v: this._clamp01(v, st.v) };
    const rgb = this._themeHsvToRgb(this._themePickerState[area]);
    this._themeLastValid[area] = { ...rgb };
    this._setThemeAreaRgbInputs(area, rgb);
    if (refs.hex) refs.hex.value = this._themeRgbToHex(rgb);
    this._drawThemePicker(area);
    this._setThemeColorError(area, "");
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _handleThemeHueCanvasInput(area, e) {
    this._ensureThemeAreaEditableOnInput(area);
    const refs = this._getThemeAreaInputs(area);
    const canvas = refs.hueCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);
    const h = rect.height <= 0 ? 0 : (y / rect.height) * 360;
    const st = this._themePickerState[area] || { h: 0, s: 0, v: 1 };
    this._themePickerState[area] = { ...st, h: this._clampHue(h, st.h) };
    const rgb = this._themeHsvToRgb(this._themePickerState[area]);
    this._themeLastValid[area] = { ...rgb };
    this._setThemeAreaRgbInputs(area, rgb);
    if (refs.hex) refs.hex.value = this._themeRgbToHex(rgb);
    this._drawThemePicker(area);
    this._setThemeColorError(area, "");
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _handleThemeHexInput(area, normalizeOnBlur) {
    this._ensureThemeAreaEditableOnInput(area);
    const refs = this._getThemeAreaInputs(area);
    const raw = String(refs.hex?.value || "").trim();
    const fallback = this._themeLastValid[area] || this._themeAreaDefaultRgb(area);
    const m = raw.match(/^#?([0-9a-fA-F]{6})$/);
    if (!m) {
      if (normalizeOnBlur && refs.hex) refs.hex.value = this._themeRgbToHex(fallback);
      if (!normalizeOnBlur) this._setThemeColorError(area, "Hex erwartet #RRGGBB.");
      return;
    }
    const rgb = this._themeHexToRgb(`#${m[1]}`, fallback);
    this._themeLastValid[area] = { ...rgb };
    this._setThemeAreaRgbInputs(area, rgb);
    if (refs.hex) refs.hex.value = this._themeRgbToHex(rgb);
    this._syncThemePickerStateFromRgb(area, rgb);
    this._drawThemePicker(area);
    this._setThemeColorError(area, "");
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _parseThemeNameToRgb(rawName) {
    const raw = String(rawName || "").trim();
    if (!raw) return null;
    const direct = parseCssColor(raw);
    if (direct?.rgb) {
      return {
        r: this._clampThemeRgb(direct.rgb.r, 0),
        g: this._clampThemeRgb(direct.rgb.g, 0),
        b: this._clampThemeRgb(direct.rgb.b, 0),
      };
    }

    const aliases = {
      rose: "#FF007F",
      rosa: "#FFC0CB",
      weinrot: "#722F37",
      samtgruen: "#3E6B48",
      "samtgrün": "#3E6B48",
    };
    const aliasHex = aliases[raw.toLowerCase()] || null;
    if (!aliasHex) return null;
    return this._themeHexToRgb(aliasHex, null);
  }

  _handleThemeNameInput(area) {
    const refs = this._getThemeAreaInputs(area);
    this._ensureThemeAreaEditableOnInput(area);
    const rgb = this._parseThemeNameToRgb(refs.name?.value || "");
    if (rgb) {
      this._themeLastValid[area] = { ...rgb };
      this._setThemeAreaRgbInputs(area, this._themeLastValid[area]);
      this._setThemeColorError(area, "");
    }
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _normalizeThemeRgbInput(area, channel) {
    const fallback = { ...(this._themeLastValid[area] || this._themeAreaDefaultRgb(area)) };
    const refs = this._getThemeAreaInputs(area);
    const inp = refs[channel];
    if (!inp) return;
    const next = this._clampThemeRgb(inp.value, fallback[channel]);
    inp.value = String(next);
    this._themeLastValid[area] = { ...fallback, [channel]: next };
    this._setThemeColorError(area, "");
    this._syncThemePickerStateFromRgb(area, this._themeLastValid[area]);
    this._drawThemePicker(area);
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _handleThemeRgbInput(area, channel) {
    this._ensureThemeAreaEditableOnInput(area);
    const fallback = { ...(this._themeLastValid[area] || this._themeAreaDefaultRgb(area)) };
    const refs = this._getThemeAreaInputs(area);
    const inp = refs[channel];
    if (!inp) return;
    const parsed = this._clampThemeRgb(inp.value, null);
    if (parsed == null) {
      this._setThemeColorError(area, "RGB nur 0-255. Letzter gueltiger Wert bleibt aktiv.");
      this._applyThemePreviewFromInputs();
      return;
    }
    const clamped = this._clampThemeRgb(parsed, fallback[channel]);
    if (String(inp.value) !== String(clamped)) inp.value = String(clamped);
    this._themeLastValid[area] = { ...fallback, [channel]: clamped };
    this._setThemeColorError(area, "");
    this._syncThemePickerStateFromRgb(area, this._themeLastValid[area]);
    this._drawThemePicker(area);
    this._applyThemePreviewFromInputs();
    this._scheduleThemeSave();
  }

  _applyThemeDefaultForArea(area) {
    const rgb = this._themeAreaDefaultRgb(area);
    this._themeLastValid[area] = { ...rgb };
    this._setThemeAreaRgbInputs(area, rgb);
    this._setThemeColorError(area, "");
    this._syncThemePickerStateFromRgb(area, rgb);
    this._drawThemePicker(area);
    this._updateThemeColorPreview(area, rgb);
  }

  _updateThemeColorPreview(area, color) {
    let rgb = null;
    if (color && typeof color === "object") {
      rgb = {
        r: this._clampThemeRgb(color.r, 0),
        g: this._clampThemeRgb(color.g, 0),
        b: this._clampThemeRgb(color.b, 0),
      };
    } else {
      rgb = this._themeHexToRgb(color, this._themeAreaDefaultRgb(area));
    }
    const refs = this._getThemeAreaInputs(area);
    const hex = this._themeRgbToHex(rgb);
    const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const text = `${hex} | ${rgbText}`;
    if (refs.preview) refs.preview.style.backgroundColor = rgbText;
    if (refs.value) refs.value.textContent = text;
    if (refs.hex) refs.hex.value = hex;
  }

  _getThemeInputValues() {
    const useDefaultGlobal = false;
    const collect = (area) => {
      const defRgb = this._themeAreaDefaultRgb(area);
      const last = this._themeLastValid[area] || defRgb;
      const rgb = useDefaultGlobal ? defRgb : this._readThemeAreaRgb(area, last);
      this._themeLastValid[area] = { ...rgb };
      this._setThemeAreaRgbInputs(area, rgb);
      return { rgb };
    };

    const header = collect("header");
    const sidebar = collect("sidebar");
    const main = collect("main");
    const normalized = normalizeThemeSettings({
      headerBaseColor: this._themeRgbToHex(header.rgb),
      sidebarBaseColor: this._themeRgbToHex(sidebar.rgb),
      mainBaseColor: this._themeRgbToHex(main.rgb),
      headerTone: 50,
      sidebarTone: 50,
      mainTone: 50,
      headerUseDefault: useDefaultGlobal,
      sidebarUseDefault: useDefaultGlobal,
      mainUseDefault: useDefaultGlobal,
    });
    return {
      ...normalized,
      headerColorName: "",
      sidebarColorName: "",
      mainColorName: "",
      headerR: header.rgb.r,
      headerG: header.rgb.g,
      headerB: header.rgb.b,
      sidebarR: sidebar.rgb.r,
      sidebarG: sidebar.rgb.g,
      sidebarB: sidebar.rgb.b,
      mainR: main.rgb.r,
      mainG: main.rgb.g,
      mainB: main.rgb.b,
    };
  }

  _applyThemeInputs(values = {}) {
    const v = normalizeThemeSettings(values);
    const headerUseDefault = !!v.headerUseDefault;
    const sidebarUseDefault = !!v.sidebarUseDefault;
    const mainUseDefault = !!v.mainUseDefault;
    const headerRgb = headerUseDefault
      ? this._themeAreaDefaultRgb("header")
      : this._themeHexToRgb(v.headerBaseColor, this._themeAreaDefaultRgb("header"));
    const sidebarRgb = sidebarUseDefault
      ? this._themeAreaDefaultRgb("sidebar")
      : this._themeHexToRgb(v.sidebarBaseColor, this._themeAreaDefaultRgb("sidebar"));
    const mainRgb = mainUseDefault
      ? this._themeAreaDefaultRgb("main")
      : this._themeHexToRgb(v.mainBaseColor, this._themeAreaDefaultRgb("main"));
    this._themeLastValid = {
      header: { ...headerRgb },
      sidebar: { ...sidebarRgb },
      main: { ...mainRgb },
    };
    // Werkseinstellung wird über den Reset-Button gesetzt, nicht über eine Checkbox.
    this._setThemeAreaRgbInputs("header", headerRgb);
    this._setThemeAreaRgbInputs("sidebar", sidebarRgb);
    this._setThemeAreaRgbInputs("main", mainRgb);
    this._syncThemePickerStateFromRgb("header", headerRgb);
    this._syncThemePickerStateFromRgb("sidebar", sidebarRgb);
    this._syncThemePickerStateFromRgb("main", mainRgb);
    this._drawThemePicker("header");
    this._drawThemePicker("sidebar");
    this._drawThemePicker("main");
    if (this.inpThemeHeaderR) this.inpThemeHeaderR.disabled = false;
    if (this.inpThemeHeaderG) this.inpThemeHeaderG.disabled = false;
    if (this.inpThemeHeaderB) this.inpThemeHeaderB.disabled = false;
    if (this.inpThemeSidebarR) this.inpThemeSidebarR.disabled = false;
    if (this.inpThemeSidebarG) this.inpThemeSidebarG.disabled = false;
    if (this.inpThemeSidebarB) this.inpThemeSidebarB.disabled = false;
    if (this.inpThemeMainR) this.inpThemeMainR.disabled = false;
    if (this.inpThemeMainG) this.inpThemeMainG.disabled = false;
    if (this.inpThemeMainB) this.inpThemeMainB.disabled = false;
    this._updateThemeColorPreview("header", headerRgb);
    this._updateThemeColorPreview("sidebar", sidebarRgb);
    this._updateThemeColorPreview("main", mainRgb);
    this._setThemeColorError("header", "");
    this._setThemeColorError("sidebar", "");
    this._setThemeColorError("main", "");
    if (this.selThemeHeaderModel) this.selThemeHeaderModel.value = "rgb";
    if (this.selThemeSidebarModel) this.selThemeSidebarModel.value = "rgb";
    if (this.selThemeMainModel) this.selThemeMainModel.value = "rgb";
  }

  _applyThemePreviewFromInputs() {
    const v = this._getThemeInputValues();
    this._updateThemeColorPreview("header", { r: v.headerR, g: v.headerG, b: v.headerB });
    this._updateThemeColorPreview("sidebar", { r: v.sidebarR, g: v.sidebarG, b: v.sidebarB });
    this._updateThemeColorPreview("main", { r: v.mainR, g: v.mainG, b: v.mainB });
    if (this.router?.context) {
      this.router.context.settings = {
        ...(this.router.context.settings || {}),
        "ui.themeHeaderBaseColor": v.headerBaseColor,
        "ui.themeSidebarBaseColor": v.sidebarBaseColor,
        "ui.themeMainBaseColor": v.mainBaseColor,
        "ui.themeHeaderTone": v.headerTone,
        "ui.themeSidebarTone": v.sidebarTone,
        "ui.themeMainTone": v.mainTone,
        "ui.themeHeaderUseDefault": v.headerUseDefault ? "true" : "false",
        "ui.themeSidebarUseDefault": v.sidebarUseDefault ? "true" : "false",
        "ui.themeMainUseDefault": v.mainUseDefault ? "true" : "false",
        "dev_color_default_enabled": v.headerUseDefault ? "true" : "false",
        "dev_color_header_default": v.headerUseDefault ? "true" : "false",
        "dev_color_header_name": v.headerColorName,
        "dev_color_header_r": v.headerR,
        "dev_color_header_g": v.headerG,
        "dev_color_header_b": v.headerB,
        "dev_color_sidebar_default": v.sidebarUseDefault ? "true" : "false",
        "dev_color_sidebar_name": v.sidebarColorName,
        "dev_color_sidebar_r": v.sidebarR,
        "dev_color_sidebar_g": v.sidebarG,
        "dev_color_sidebar_b": v.sidebarB,
        "dev_color_main_default": v.mainUseDefault ? "true" : "false",
        "dev_color_main_name": v.mainColorName,
        "dev_color_main_r": v.mainR,
        "dev_color_main_g": v.mainG,
        "dev_color_main_b": v.mainB,
      };
    }
    applyThemeForSettings(v);
    window.dispatchEvent(new Event("bbm:theme-refresh"));
  }

  _scheduleThemeSave() {
    if (this._themeSaveTimer) {
      clearTimeout(this._themeSaveTimer);
      this._themeSaveTimer = null;
    }
    this._themeSaveTimer = setTimeout(() => {
      this._themeSaveTimer = null;
      if (this._themeSaveMode === "startDefaults") {
        this._saveThemeStartDefaults();
      } else {
        this._saveThemeSettings();
      }
    }, 200);
  }

  async _saveThemeSettings() {
    if (this._themeSaving) return false;
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const v = this._getThemeInputValues();
    this._applyThemeInputs(v);

    this._themeSaving = true;
    try {
      const res = await api.appSettingsSetMany({
        "ui.themeHeaderBaseColor": v.headerBaseColor,
        "ui.themeSidebarBaseColor": v.sidebarBaseColor,
        "ui.themeMainBaseColor": v.mainBaseColor,
        "ui.themeHeaderTone": v.headerTone,
        "ui.themeSidebarTone": v.sidebarTone,
        "ui.themeMainTone": v.mainTone,
        "ui.themeHeaderUseDefault": v.headerUseDefault ? "true" : "false",
        "ui.themeSidebarUseDefault": v.sidebarUseDefault ? "true" : "false",
        "ui.themeMainUseDefault": v.mainUseDefault ? "true" : "false",
        "dev_color_default_enabled": v.headerUseDefault ? "true" : "false",
        "dev_color_header_default": v.headerUseDefault ? "true" : "false",
        "dev_color_header_name": v.headerColorName,
        "dev_color_header_r": v.headerR,
        "dev_color_header_g": v.headerG,
        "dev_color_header_b": v.headerB,
        "dev_color_sidebar_default": v.sidebarUseDefault ? "true" : "false",
        "dev_color_sidebar_name": v.sidebarColorName,
        "dev_color_sidebar_r": v.sidebarR,
        "dev_color_sidebar_g": v.sidebarG,
        "dev_color_sidebar_b": v.sidebarB,
        "dev_color_main_default": v.mainUseDefault ? "true" : "false",
        "dev_color_main_name": v.mainColorName,
        "dev_color_main_r": v.mainR,
        "dev_color_main_g": v.mainG,
        "dev_color_main_b": v.mainB,
      });
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          "ui.themeHeaderBaseColor": v.headerBaseColor,
          "ui.themeSidebarBaseColor": v.sidebarBaseColor,
          "ui.themeMainBaseColor": v.mainBaseColor,
          "ui.themeHeaderTone": v.headerTone,
          "ui.themeSidebarTone": v.sidebarTone,
          "ui.themeMainTone": v.mainTone,
          "ui.themeHeaderUseDefault": v.headerUseDefault ? "true" : "false",
          "ui.themeSidebarUseDefault": v.sidebarUseDefault ? "true" : "false",
          "ui.themeMainUseDefault": v.mainUseDefault ? "true" : "false",
          "dev_color_default_enabled": v.headerUseDefault ? "true" : "false",
          "dev_color_header_default": v.headerUseDefault ? "true" : "false",
          "dev_color_header_name": v.headerColorName,
          "dev_color_header_r": v.headerR,
          "dev_color_header_g": v.headerG,
          "dev_color_header_b": v.headerB,
          "dev_color_sidebar_default": v.sidebarUseDefault ? "true" : "false",
          "dev_color_sidebar_name": v.sidebarColorName,
          "dev_color_sidebar_r": v.sidebarR,
          "dev_color_sidebar_g": v.sidebarG,
          "dev_color_sidebar_b": v.sidebarB,
          "dev_color_main_default": v.mainUseDefault ? "true" : "false",
          "dev_color_main_name": v.mainColorName,
          "dev_color_main_r": v.mainR,
          "dev_color_main_g": v.mainG,
          "dev_color_main_b": v.mainB,
        };
      }

      applyThemeForSettings(v);
      window.dispatchEvent(new Event("bbm:theme-refresh"));
      return true;
    } catch (err) {
      console.error("[SettingsView] _saveThemeSettings failed", {
        message: err?.message || String(err),
        stack: err?.stack || null,
      });
      alert(err?.message || "Speichern fehlgeschlagen");
      return false;
    } finally {
      this._themeSaving = false;
    }
  }

  async _loadThemeStartDefaults() {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      return false;
    }
    const res = await api.appSettingsGetMany(THEME_DEFAULT_KEYS);
    if (!res?.ok) return false;
    const startDefaults = this._readThemeStartDefaultsFromData(res.data || {});
    this._setThemeRuntimeDefaults(startDefaults);
    const themeSettings = normalizeThemeSettings({
      ...startDefaults,
      headerUseDefault: false,
      sidebarUseDefault: false,
      mainUseDefault: false,
      headerTone: 50,
      sidebarTone: 50,
      mainTone: 50,
    });
    this._applyThemeInputs(themeSettings);
    return true;
  }

  async _saveThemeStartDefaults() {
    if (this._themeSaving) return false;
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const v = this._getThemeInputValues();
    const payload = {
      "defaults.ui.themeHeaderBaseColor": v.headerBaseColor,
      "defaults.ui.themeSidebarBaseColor": v.sidebarBaseColor,
      "defaults.ui.themeMainBaseColor": v.mainBaseColor,
      "defaults.ui.themeHeaderTone": String(v.headerTone),
      "defaults.ui.themeSidebarTone": String(v.sidebarTone),
      "defaults.ui.themeMainTone": String(v.mainTone),
    };

    this._themeSaving = true;
    try {
      const res = await api.appSettingsSetMany(payload);
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }
      this._setThemeRuntimeDefaults({
        headerBaseColor: v.headerBaseColor,
        sidebarBaseColor: v.sidebarBaseColor,
        mainBaseColor: v.mainBaseColor,
        headerTone: v.headerTone,
        sidebarTone: v.sidebarTone,
        mainTone: v.mainTone,
      });

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          ...payload,
        };
      }

      applyThemeForSettings(this.router?.context?.settings || {});
      window.dispatchEvent(new Event("bbm:theme-refresh"));
      return true;
    } catch (err) {
      console.error("[SettingsView] _saveThemeStartDefaults failed", {
        message: err?.message || String(err),
        stack: err?.stack || null,
      });
      alert(err?.message || "Speichern fehlgeschlagen");
      return false;
    } finally {
      this._themeSaving = false;
    }
  }

  async _applyThemeStartDefaultsToUser() {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function" || typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const loadRes = await api.appSettingsGetMany(THEME_DEFAULT_KEYS);
    if (!loadRes?.ok) {
      alert(loadRes?.error || "Start-Defaults konnten nicht geladen werden.");
      return false;
    }
    const defaults = this._readThemeStartDefaultsFromData(loadRes.data || {});
    this._setThemeRuntimeDefaults(defaults);

    const payload = {
      "ui.themeHeaderBaseColor": defaults.headerBaseColor,
      "ui.themeSidebarBaseColor": defaults.sidebarBaseColor,
      "ui.themeMainBaseColor": defaults.mainBaseColor,
      "ui.themeHeaderTone": String(defaults.headerTone),
      "ui.themeSidebarTone": String(defaults.sidebarTone),
      "ui.themeMainTone": String(defaults.mainTone),
      "ui.themeHeaderUseDefault": "false",
      "ui.themeSidebarUseDefault": "false",
      "ui.themeMainUseDefault": "false",
      "dev_color_default_enabled": "false",
      "dev_color_header_default": "false",
      "dev_color_sidebar_default": "false",
      "dev_color_main_default": "false",
      "dev_color_header_r": String(this._themeHexToRgb(defaults.headerBaseColor, { r: 0, g: 0, b: 0 })?.r ?? 0),
      "dev_color_header_g": String(this._themeHexToRgb(defaults.headerBaseColor, { r: 0, g: 0, b: 0 })?.g ?? 0),
      "dev_color_header_b": String(this._themeHexToRgb(defaults.headerBaseColor, { r: 0, g: 0, b: 0 })?.b ?? 0),
      "dev_color_sidebar_r": String(this._themeHexToRgb(defaults.sidebarBaseColor, { r: 0, g: 0, b: 0 })?.r ?? 0),
      "dev_color_sidebar_g": String(this._themeHexToRgb(defaults.sidebarBaseColor, { r: 0, g: 0, b: 0 })?.g ?? 0),
      "dev_color_sidebar_b": String(this._themeHexToRgb(defaults.sidebarBaseColor, { r: 0, g: 0, b: 0 })?.b ?? 0),
      "dev_color_main_r": String(this._themeHexToRgb(defaults.mainBaseColor, { r: 0, g: 0, b: 0 })?.r ?? 0),
      "dev_color_main_g": String(this._themeHexToRgb(defaults.mainBaseColor, { r: 0, g: 0, b: 0 })?.g ?? 0),
      "dev_color_main_b": String(this._themeHexToRgb(defaults.mainBaseColor, { r: 0, g: 0, b: 0 })?.b ?? 0),
    };
    const saveRes = await api.appSettingsSetMany(payload);
    if (!saveRes?.ok) {
      alert(saveRes?.error || "Werkseinstellung konnte nicht aktiviert werden.");
      return false;
    }

    if (this.router?.context) {
      this.router.context.settings = {
        ...(this.router.context.settings || {}),
        ...payload,
        ...loadRes.data,
      };
    }
    this._applyThemeInputs({
      headerBaseColor: defaults.headerBaseColor,
      sidebarBaseColor: defaults.sidebarBaseColor,
      mainBaseColor: defaults.mainBaseColor,
      headerTone: defaults.headerTone,
      sidebarTone: defaults.sidebarTone,
      mainTone: defaults.mainTone,
      headerUseDefault: false,
      sidebarUseDefault: false,
      mainUseDefault: false,
    });
    applyThemeForSettings(this.router?.context?.settings || {});
    window.dispatchEvent(new Event("bbm:theme-refresh"));
    return true;
  }

  async _reloadSecurityPinState() {
    const api = window.bbmDb || {};
    if (typeof api.securitySettingsPinStatus !== "function") return;
    const res = await api.securitySettingsPinStatus();
    if (!res?.ok) return;
    this._securityPinEnabled = !!res.enabled;
    if (this.inpSecurityPinEnabled) this.inpSecurityPinEnabled.checked = this._securityPinEnabled;
    this._applyState();
  }

  async _saveSecurityPin() {
    const api = window.bbmDb || {};
    if (typeof api.securitySettingsPinSet !== "function") {
      alert("Security-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const currentPin = (this.inpSecurityCurrentPin?.value || "").replace(/\D+/g, "").slice(0, 4);
    const newPin = (this.inpSecurityNewPin?.value || "").replace(/\D+/g, "").slice(0, 4);
    const confirmPin = (this.inpSecurityConfirmPin?.value || "").replace(/\D+/g, "").slice(0, 4);

    if (!/^\d{4}$/.test(newPin)) {
      alert("Neue PIN muss genau 4 Ziffern haben.");
      return false;
    }
    if (newPin !== confirmPin) {
      alert("PIN und Wiederholung stimmen nicht ueberein.");
      return false;
    }

    this._securityPinSaving = true;
    this._applyState();
    try {
      const res = await api.securitySettingsPinSet({ pin: newPin, currentPin });
      if (!res?.ok) {
        alert(res?.error || "PIN konnte nicht gespeichert werden.");
        return false;
      }
      if (this.inpSecurityCurrentPin) this.inpSecurityCurrentPin.value = "";
      if (this.inpSecurityNewPin) this.inpSecurityNewPin.value = "";
      if (this.inpSecurityConfirmPin) this.inpSecurityConfirmPin.value = "";
      await this._reloadSecurityPinState();
      this._setMsg("PIN gespeichert");
      return true;
    } finally {
      this._securityPinSaving = false;
      this._applyState();
    }
  }

  async _disableSecurityPin() {
    const api = window.bbmDb || {};
    if (typeof api.securitySettingsPinDisable !== "function") {
      alert("Security-API fehlt (IPC noch nicht aktiv).");
      return false;
    }
    const currentPin = (this.inpSecurityCurrentPin?.value || "").replace(/\D+/g, "").slice(0, 4);
    this._securityPinSaving = true;
    this._applyState();
    try {
      const res = await api.securitySettingsPinDisable({ currentPin });
      if (!res?.ok) {
        alert(res?.error || "PIN konnte nicht deaktiviert werden.");
        return false;
      }
      if (this.inpSecurityCurrentPin) this.inpSecurityCurrentPin.value = "";
      if (this.inpSecurityNewPin) this.inpSecurityNewPin.value = "";
      if (this.inpSecurityConfirmPin) this.inpSecurityConfirmPin.value = "";
      await this._reloadSecurityPinState();
      this._setMsg("PIN deaktiviert");
      return true;
    } finally {
      this._securityPinSaving = false;
      this._applyState();
    }
  }

  _pdfLogoDefaults() {
    return {
      enabled: true,
      widthMm: 35,
      topMm: 8,
      rightMm: 8,
    };
  }

  _parseBool(value, fallback) {
    if (value == null || value === "") return fallback;
    const s = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "ja", "on"].includes(s)) return true;
    if (["0", "false", "no", "nein", "off"].includes(s)) return false;
    return fallback;
  }

  _clampPdfLogoNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const v = Math.round(n);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  _getPdfLogoInputValues() {
    const defaults = this._pdfLogoDefaults();
    const enabled = this._parseBool(this.inpPdfLogoEnabled?.checked, defaults.enabled);
    const widthMm = this._clampPdfLogoNumber(this.inpPdfLogoWidth?.value, 10, 60, defaults.widthMm);
    const topMm = this._clampPdfLogoNumber(this.inpPdfLogoTop?.value, 0, 30, defaults.topMm);
    const rightMm = this._clampPdfLogoNumber(
      this.inpPdfLogoRight?.value,
      0,
      30,
      defaults.rightMm
    );
    return { enabled, widthMm, topMm, rightMm };
  }

  _applyPdfLogoInputs({ enabled, widthMm, topMm, rightMm }) {
    if (this.inpPdfLogoEnabled) this.inpPdfLogoEnabled.checked = !!enabled;
    if (this.inpPdfLogoWidth) this.inpPdfLogoWidth.value = String(widthMm);
    if (this.inpPdfLogoTop) this.inpPdfLogoTop.value = String(topMm);
    if (this.inpPdfLogoRight) this.inpPdfLogoRight.value = String(rightMm);
  }

  _setPdfLogoFilePath(pathValue, { skipSave = false } = {}) {
    const next = String(pathValue || "");
    this._pdfLogoFilePath = next;
    if (this.pdfLogoPathEl) {
      this.pdfLogoPathEl.value = next;
      if (!next) this.pdfLogoPathEl.placeholder = "Kein Logo gewaehlt";
    }
    if (!skipSave) this._schedulePdfLogoSave();
  }

  _schedulePdfLogoSave() {
    if (this._pdfLogoSaveTimer) {
      clearTimeout(this._pdfLogoSaveTimer);
      this._pdfLogoSaveTimer = null;
    }
    this._pdfLogoSaveTimer = setTimeout(() => {
      this._pdfLogoSaveTimer = null;
      this._savePdfLogoSettings();
    }, 200);
  }

  async _savePdfLogoSettings() {
    if (this._pdfLogoSaving) return false;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const { enabled, widthMm, topMm, rightMm } = this._getPdfLogoInputValues();
    this._applyPdfLogoInputs({ enabled, widthMm, topMm, rightMm });

    this._pdfLogoSaving = true;
    try {
      const res = await api.appSettingsSetMany({
        "pdf.userLogoEnabled": enabled ? "true" : "false",
        "pdf.userLogoWidthMm": widthMm,
        "pdf.userLogoTopMm": topMm,
        "pdf.userLogoRightMm": rightMm,
        "pdf.userLogoPngDataUrl": this._pdfLogoDataUrl || "",
        "pdf.userLogoFilePath": this._pdfLogoFilePath || "",
      });
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          "pdf.userLogoEnabled": enabled ? "true" : "false",
          "pdf.userLogoWidthMm": widthMm,
          "pdf.userLogoTopMm": topMm,
          "pdf.userLogoRightMm": rightMm,
          "pdf.userLogoPngDataUrl": this._pdfLogoDataUrl || "",
          "pdf.userLogoFilePath": this._pdfLogoFilePath || "",
        };
      }
      return true;
    } finally {
      this._pdfLogoSaving = false;
    }
  }

  _pdfSettingsDefaults() {
    return {
      protocolTitle: "Baubesprechung",
      trafficLightAllEnabled: true,
      footerUseUserData: false,
      protocolsDir: "C:\\Downloads",
      preRemarks: DEFAULT_V2_PRE_REMARKS_TEXT,
      preRemarksEnabled: DEFAULT_V2_PRE_REMARKS_ENABLED,
    };
  }

  _getNormalizedUserFooterDefaults() {
    return {
      name1: this._normalizeUserText(this.inpUserName1?.value, 80),
      name2: this._normalizeUserText(this.inpUserName2?.value, 80),
      street: this._normalizeUserText(this.inpUserStreet?.value, 80),
      zip: this._normalizeUserZip(this.inpUserZip?.value, 5),
      city: this._normalizeUserText(this.inpUserCity?.value, 80),
    };
  }

  _todayDdMmYyyy() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  }

  _applyPdfFooterUserDefaultsFromUser(values, { overwriteExisting = false } = {}) {
    const data = values || this._getNormalizedUserFooterDefaults();
    const pairs = [
      [this.inpPdfFooterName1, data.name1],
      [this.inpPdfFooterName2, data.name2],
      [this.inpPdfFooterStreet, data.street],
      [this.inpPdfFooterZip, data.zip],
      [this.inpPdfFooterCity, data.city],
    ];

    for (const [input, value] of pairs) {
      if (!input) continue;
      const current = String(input.value || "").trim();
      if (current && !overwriteExisting) continue;
      const next = String(value || "").trim();
      if (!next) continue;
      input.value = next;
    }
  }

  _applyPdfFooterPlaceDateDefaults({ city } = {}) {
    let changed = false;
    if (this.inpPdfFooterPlace) {
      const current = String(this.inpPdfFooterPlace.value || "").trim();
      const next = String(city || "").trim();
      if (!current && next) {
        this.inpPdfFooterPlace.value = next;
        changed = true;
      }
    }
    if (this.inpPdfFooterDate) {
      const current = String(this.inpPdfFooterDate.value || "").trim();
      if (!current) {
        this.inpPdfFooterDate.value = this._todayDdMmYyyy();
        changed = true;
      }
    }
    return changed;
  }

  _getPdfSettingsInputValues() {
    const defaults = this._pdfSettingsDefaults();
    const protocolTitle = this._normalizeUserText(this.inpPdfProtocolTitle?.value, 80);
    const trafficLightAllEnabled = this._parseBool(
      this.inpPdfTrafficLightAll?.checked,
      defaults.trafficLightAllEnabled
    );
    const protocolsDirRaw = (this.inpPdfProtocolsDir?.value ?? "").toString().trim();
    const protocolsDir = protocolsDirRaw || defaults.protocolsDir;
    const footerUseUserData = this._parseBool(
      this.pdfFooterUseUserData,
      defaults.footerUseUserData
    );
    const footerPlace = this._normalizeUserText(this.inpPdfFooterPlace?.value, 80);
    const footerDate = this._normalizeUserText(this.inpPdfFooterDate?.value, 40);
    const footerName1 = this._normalizeUserText(this.inpPdfFooterName1?.value, 80);
    const footerName2 = this._normalizeUserText(this.inpPdfFooterName2?.value, 80);
    const footerRecorder = this._normalizeUserText(this.inpPdfFooterRecorder?.value, 80);
    const footerStreet = this._normalizeUserText(this.inpPdfFooterStreet?.value, 80);
    const footerZip = this._normalizeUserZip(this.inpPdfFooterZip?.value);
    const footerCity = this._normalizeUserText(this.inpPdfFooterCity?.value, 80);
    const preRemarks = this._normalizePdfPreRemarks(this.pdfPreRemarks ?? defaults.preRemarks);
    const preRemarksEnabled = this._parseBool(this.pdfPreRemarksEnabled, defaults.preRemarksEnabled);

    return {
      protocolTitle,
      trafficLightAllEnabled,
      protocolsDir,
      preRemarks,
      preRemarksEnabled,
      footerUseUserData,
      footerPlace,
      footerDate,
      footerName1,
      footerName2,
      footerRecorder,
      footerStreet,
      footerZip,
      footerCity,
    };
  }

  _applyPdfSettingsInputs(values) {
    if (!values) return;
    if (this.inpPdfProtocolTitle) this.inpPdfProtocolTitle.value = values.protocolTitle || "";
    if (this.inpPdfTrafficLightAll) this.inpPdfTrafficLightAll.checked = !!values.trafficLightAllEnabled;
    this.pdfFooterUseUserData = !!values.footerUseUserData;
    if (this.inpPdfProtocolsDir) {
      const defaults = this._pdfSettingsDefaults();
      this.inpPdfProtocolsDir.value = String(values.protocolsDir || "").trim() || defaults.protocolsDir;
    }
    if (this.inpPdfFooterPlace) this.inpPdfFooterPlace.value = values.footerPlace || "";
    if (this.inpPdfFooterDate) this.inpPdfFooterDate.value = values.footerDate || "";
    if (this.inpPdfFooterName1) this.inpPdfFooterName1.value = values.footerName1 || "";
    if (this.inpPdfFooterName2) this.inpPdfFooterName2.value = values.footerName2 || "";
    if (this.inpPdfFooterRecorder) this.inpPdfFooterRecorder.value = values.footerRecorder || "";
    if (this.inpPdfFooterStreet) this.inpPdfFooterStreet.value = values.footerStreet || "";
    if (this.inpPdfFooterZip) this.inpPdfFooterZip.value = values.footerZip || "";
    if (this.inpPdfFooterCity) this.inpPdfFooterCity.value = values.footerCity || "";
    this.pdfPreRemarks = this._normalizePdfPreRemarks(values.preRemarks || "");
    this.pdfPreRemarksEnabled = this._parseBool(values.preRemarksEnabled, false);
  }

  _schedulePdfSettingsSave({ markTouched = true } = {}) {
    if (this._pdfSettingsSaveTimer) {
      clearTimeout(this._pdfSettingsSaveTimer);
      this._pdfSettingsSaveTimer = null;
    }
    this._pdfSettingsSaveTimer = setTimeout(() => {
      this._pdfSettingsSaveTimer = null;
      this._savePdfSettings({ markTouched });
    }, 200);
  }

  async _savePdfSettings({ markTouched = true } = {}) {
    if (this._pdfSettingsSaving) return false;
    if (this.saving) return false;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const defaults = this._pdfSettingsDefaults();
    const useUserData = this._parseBool(this.pdfFooterUseUserData, defaults.footerUseUserData);
    if (useUserData) {
      this._applyPdfFooterUserDefaultsFromUser(undefined, { overwriteExisting: true });
    }

    const values = this._getPdfSettingsInputValues();
    this._applyPdfSettingsInputs(values);

    this._pdfSettingsSaving = true;

    try {
      const payload = {
        "pdf.protocolTitle": values.protocolTitle,
        "pdf.trafficLightAllEnabled": values.trafficLightAllEnabled ? "true" : "false",
        "pdf.protocolsDir": values.protocolsDir,
        "pdf.preRemarks": values.preRemarks,
        "print.preRemarks.enabled": values.preRemarksEnabled ? "true" : "false",
        "pdf.footerPlace": values.footerPlace,
        "pdf.footerDate": values.footerDate,
        "pdf.footerName1": values.footerName1,
        "pdf.footerName2": values.footerName2,
        "pdf.footerRecorder": values.footerRecorder,
        "pdf.footerStreet": values.footerStreet,
        "pdf.footerZip": values.footerZip,
        "pdf.footerCity": values.footerCity,
        "pdf.footerUseUserData": values.footerUseUserData ? "true" : "false",
      };
      if (markTouched) {
        Object.assign(
          payload,
          this._buildTouchedPayloadFromValues({
            "pdf.protocolTitle": values.protocolTitle,
            "pdf.protocolsDir": values.protocolsDir,
            "pdf.preRemarks": values.preRemarks,
            "pdf.footerPlace": values.footerPlace,
            "pdf.footerDate": values.footerDate,
            "pdf.footerName1": values.footerName1,
            "pdf.footerName2": values.footerName2,
            "pdf.footerRecorder": values.footerRecorder,
            "pdf.footerStreet": values.footerStreet,
            "pdf.footerZip": values.footerZip,
            "pdf.footerCity": values.footerCity,
          }),
          this._buildTouchedPayloadForKeys([
            "pdf.trafficLightAllEnabled",
            "print.preRemarks.enabled",
            "pdf.footerUseUserData",
          ])
        );
      }
      const res = await api.appSettingsSetMany(payload);
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          "pdf.protocolTitle": values.protocolTitle,
          "pdf.trafficLightAllEnabled": values.trafficLightAllEnabled ? "true" : "false",
          "pdf.protocolsDir": values.protocolsDir,
          "pdf.preRemarks": values.preRemarks,
          "print.preRemarks.enabled": values.preRemarksEnabled ? "true" : "false",
          "pdf.footerPlace": values.footerPlace,
          "pdf.footerDate": values.footerDate,
          "pdf.footerName1": values.footerName1,
          "pdf.footerName2": values.footerName2,
          "pdf.footerRecorder": values.footerRecorder,
          "pdf.footerStreet": values.footerStreet,
          "pdf.footerZip": values.footerZip,
          "pdf.footerCity": values.footerCity,
          "pdf.footerUseUserData": values.footerUseUserData ? "true" : "false",
        };
      }
      return true;
    } finally {
      this._pdfSettingsSaving = false;
    }
  }

  _normalizePrintLogoSize(value) {
    const s = String(value || "").trim().toLowerCase();
    if (s === "small" || s === "medium" || s === "large") return s;
    return "medium";
  }

  _normalizePrintLogoAlign(value) {
    const s = String(value || "").trim().toLowerCase();
    if (s === "left" || s === "center" || s === "right") return s;
    return "center";
  }

  _normalizePrintLogoVAlign(value) {
    const s = String(value || "").trim().toLowerCase();
    if (s === "top" || s === "middle" || s === "bottom") return s;
    return "bottom";
  }

  _previewLogoMaxHeightPx(sizeValue) {
    const size = this._normalizePrintLogoSize(sizeValue);
    if (size === "small") return 44;
    if (size === "large") return 72;
    return 58;
  }

  _applyPrintLogoPreviewSize(slotIndex, sizeValue) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const img = this.printLogoPreviewImgs?.[idx];
    if (!img) return;
    img.style.maxHeight = String(this._previewLogoMaxHeightPx(sizeValue)) + "px";
  }

  _applyPrintLogoSize(slotIndex, value) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const normalized = this._normalizePrintLogoSize(value);
    const sel = this.printLogoSizeSelects?.[idx];
    if (!sel) return;
    sel.value = normalized;
    this._applyPrintLogoPreviewSize(idx, normalized);
  }

  _applyPrintLogoAlign(slotIndex, value) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const normalized = this._normalizePrintLogoAlign(value);
    const checks = this.printLogoAlignChecks?.[idx];
    if (checks) {
      if (checks.left) checks.left.checked = normalized === "left";
      if (checks.center) checks.center.checked = normalized === "center";
      if (checks.right) checks.right.checked = normalized === "right";
    }
    const frame = this.printLogoPreviewFrames?.[idx];
    if (frame) {
      frame.style.justifyContent = normalized === "left"
        ? "flex-start"
        : normalized === "right"
          ? "flex-end"
          : "center";
    }
  }

  _applyPrintLogoVAlign(slotIndex, value) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const normalized = this._normalizePrintLogoVAlign(value);
    const checks = this.printLogoVAlignChecks?.[idx];
    if (checks) {
      if (checks.top) checks.top.checked = normalized === "top";
      if (checks.middle) checks.middle.checked = normalized === "middle";
      if (checks.bottom) checks.bottom.checked = normalized === "bottom";
    }
    const frame = this.printLogoPreviewFrames?.[idx];
    if (frame) {
      frame.style.alignItems = normalized === "top"
        ? "flex-start"
        : normalized === "middle"
          ? "center"
          : "flex-end";
    }
  }

  _setPrintLogoDataUrl(slotIndex, dataUrl) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const next = String(dataUrl || "");
    this._printLogoDataUrls[idx] = next;

    const placeholder = this.printLogoPlaceholderEls?.[idx];
    if (placeholder) {
      placeholder.style.display = next ? "none" : "flex";
    }

    const img = this.printLogoPreviewImgs?.[idx];
    if (img) {
      if (next) {
        img.src = next;
        img.style.display = "block";
      } else {
        img.src = "";
        img.style.display = "none";
      }
    }

    const fileInp = this.printLogoFileInputs?.[idx];
    if (fileInp) fileInp.value = "";
  }

  _applyPrintLogoInputsFromSettings(data) {
    const legacyPreset = this._normalizePrintLogoSize(data["print.logoSizePreset"]);
    if (this.inpPrintHeaderAdaptive) {
      this.inpPrintHeaderAdaptive.checked = this._parseBool(data["print.v2.globalHeaderAdaptive"], false);
    }
    for (let i = 0; i < 3; i++) {
      const keyNo = String(i + 1);
      const enabled = this._parseBool(data["print.logo" + keyNo + ".enabled"], false);
      const dataUrl = String(data["print.logo" + keyNo + ".pngDataUrl"] || "").trim();
      const sizeRaw = data["print.logo" + keyNo + ".size"];
      const size = sizeRaw == null || String(sizeRaw).trim() === ""
        ? legacyPreset
        : this._normalizePrintLogoSize(sizeRaw);
      const align = this._normalizePrintLogoAlign(data["print.logo" + keyNo + ".align"]);
      const vAlign = this._normalizePrintLogoVAlign(data["print.logo" + keyNo + ".vAlign"]);
      const inp = this.printLogoEnabledInputs?.[i];
      if (inp) inp.checked = !!enabled;
      this._applyPrintLogoSize(i, size);
      this._applyPrintLogoAlign(i, align);
      this._applyPrintLogoVAlign(i, vAlign);
      this._setPrintLogoDataUrl(i, dataUrl);
    }
  }

  _getPrintLogoValues() {
    const values = {
      headerAdaptive: !!this.inpPrintHeaderAdaptive?.checked,
      slots: [
        { enabled: false, size: "medium", align: "center", vAlign: "bottom", dataUrl: "" },
        { enabled: false, size: "medium", align: "center", vAlign: "bottom", dataUrl: "" },
        { enabled: false, size: "medium", align: "center", vAlign: "bottom", dataUrl: "" },
      ],
    };
    for (let i = 0; i < 3; i++) {
      values.slots[i].enabled = !!this.printLogoEnabledInputs?.[i]?.checked;
      values.slots[i].size = this._normalizePrintLogoSize(this.printLogoSizeSelects?.[i]?.value);
      values.slots[i].align = this._normalizePrintLogoAlign(
        this.printLogoAlignChecks?.[i]?.left?.checked
          ? "left"
          : this.printLogoAlignChecks?.[i]?.right?.checked
            ? "right"
            : "center"
      );
      values.slots[i].vAlign = this._normalizePrintLogoVAlign(
        this.printLogoVAlignChecks?.[i]?.top?.checked
          ? "top"
          : this.printLogoVAlignChecks?.[i]?.middle?.checked
            ? "middle"
            : "bottom"
      );
      values.slots[i].dataUrl = String(this._printLogoDataUrls?.[i] || "").trim();
    }
    return values;
  }

  async _savePrintLogoSettings() {
    if (this._printLogoSaving) return false;
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const values = this._getPrintLogoValues();
    this._printLogoSaving = true;
    this._applyState();
    try {
      const payload = {};
      payload["print.v2.globalHeaderAdaptive"] = values.headerAdaptive ? "true" : "false";
      for (let i = 0; i < 3; i++) {
        const keyNo = String(i + 1);
        payload["print.logo" + keyNo + ".enabled"] = values.slots[i].enabled ? "true" : "false";
        payload["print.logo" + keyNo + ".size"] = values.slots[i].size;
        payload["print.logo" + keyNo + ".align"] = values.slots[i].align;
        payload["print.logo" + keyNo + ".vAlign"] = values.slots[i].vAlign;
        payload["print.logo" + keyNo + ".pngDataUrl"] = values.slots[i].dataUrl;
      }
      // Legacy fallback fuer bestehende Renderer-Pfade mit globalem Preset.
      payload["print.logoSizePreset"] = values.slots[0].size;
      const res = await api.appSettingsSetMany(payload);
      if (!res?.ok) {
        alert(res?.error || "Logo-Einstellungen konnten nicht gespeichert werden.");
        return false;
      }
      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          ...payload,
        };
      }
      return true;
    } finally {
      this._printLogoSaving = false;
      this._applyState();
    }
  }

  _schedulePrintLogoSave() {
    if (this._printLogoSaveTimer) clearTimeout(this._printLogoSaveTimer);
    this._printLogoSaveTimer = setTimeout(async () => {
      this._printLogoSaveTimer = null;
      await this._savePrintLogoSettings();
    }, 250);
  }


  async _handlePrintLogoFileInput(slotIndex) {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 2) return;
    const file = this.printLogoFileInputs?.[idx]?.files?.[0] || null;
    if (!file) return;
    try {
      const dataUrl = await this._convertImageFileToPngDataUrl(file);
      if (!dataUrl) {
        alert("Logo konnte nicht gelesen werden.");
        return;
      }
      this._setPrintLogoDataUrl(idx, dataUrl);
      if (this.printLogoEnabledInputs?.[idx]) {
        this.printLogoEnabledInputs[idx].checked = true;
      }
      this._schedulePrintLogoSave();
    } catch (_e) {
      alert("Logo konnte nicht verarbeitet werden.");
    } finally {
      if (this.printLogoFileInputs?.[idx]) {
        this.printLogoFileInputs[idx].value = "";
      }
    }
  }

  async _handlePdfLogoFileInput() {
    const file = this.inpPdfLogoFile?.files?.[0] || null;
    if (!file) return;

    try {
      const dataUrl = await this._convertImageFileToPngDataUrl(file);
      if (!dataUrl) {
        alert("Logo konnte nicht gelesen werden.");
        return;
      }
      const pathValue = (file.path || file.name || "").toString();
      if (pathValue) this._setPdfLogoFilePath(pathValue, { skipSave: true });
      this._setPdfLogoDataUrl(dataUrl);
    } catch (_e) {
      alert("Logo konnte nicht verarbeitet werden.");
    } finally {
      if (this.inpPdfLogoFile) this.inpPdfLogoFile.value = "";
    }
  }

  async _convertImageFileToPngDataUrl(file) {
    const maxWidth = 800;
    let bitmap = null;
    let img = null;
    let revoke = null;

    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file);
      } catch (_e) {
        bitmap = null;
      }
    }

    if (!bitmap) {
      const url = URL.createObjectURL(file);
      revoke = () => URL.revokeObjectURL(url);
      img = await new Promise((resolve) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => resolve(null);
        el.src = url;
      });
    }

    const src = bitmap || img;
    if (!src) {
      if (revoke) revoke();
      return "";
    }

    const width = Number(src.width || src.naturalWidth || 0);
    const height = Number(src.height || src.naturalHeight || 0);
    if (!width || !height) {
      if (bitmap?.close) bitmap.close();
      if (revoke) revoke();
      return "";
    }

    const scale = width > maxWidth ? maxWidth / width : 1;
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (bitmap?.close) bitmap.close();
      if (revoke) revoke();
      return "";
    }

    ctx.drawImage(src, 0, 0, outW, outH);
    if (bitmap?.close) bitmap.close();
    if (revoke) revoke();

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!blob) return "";

    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });

    return String(dataUrl || "");
  }

  async _loadImageSizeFromDataUrl(dataUrl) {
    if (!dataUrl) return null;
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async _loadPdfLogoPixelSize(dataUrl) {
    const token = ++this._pdfLogoLoadToken;
    const dims = await this._loadImageSizeFromDataUrl(dataUrl);
    if (token !== this._pdfLogoLoadToken) return;
    this._pdfLogoPx = dims;
    this._updatePdfLogoQuality();
  }

  _setPdfLogoDataUrl(dataUrl, { skipSave = false } = {}) {
    const next = String(dataUrl || "");
    this._pdfLogoDataUrl = next;

    // Dummy/Preview umschalten
    if (this.pdfLogoDummyEl) {
      this.pdfLogoDummyEl.style.display = next ? "none" : "flex";
    }

    if (this.imgPdfLogoPreview) {
      if (next) {
        this.imgPdfLogoPreview.src = next;
        this.imgPdfLogoPreview.style.display = "block";
      } else {
        this.imgPdfLogoPreview.src = "";
        this.imgPdfLogoPreview.style.display = "none";
      }
    }

    if (this.inpPdfLogoFile) this.inpPdfLogoFile.value = "";

    if (next) {
      this._loadPdfLogoPixelSize(next);
    } else {
      this._pdfLogoPx = null;
      this._updatePdfLogoQuality();
    }

    if (!skipSave) this._schedulePdfLogoSave();
  }

  _updatePdfLogoQuality() {
    if (!this.pdfLogoQualityEl) return;
    const { widthMm } = this._getPdfLogoInputValues();
    const okPx = Math.round((widthMm * 150) / 25.4);
    const goodPx = Math.round((widthMm * 300) / 25.4);

    const pxWidth = Number(this._pdfLogoPx?.width || 0);
    const pxHeight = Number(this._pdfLogoPx?.height || 0);

    let dpiEff = 0;
    if (pxWidth > 0 && widthMm > 0) {
      dpiEff = Math.round((pxWidth * 25.4) / widthMm);
    }

    let status = "Kein Logo gesetzt";
    let statusColor = "#666";

    if (pxWidth > 0) {
      if (dpiEff < 150) {
        status = "Wird im Druck unscharf...";
        statusColor = "#c62828";
      } else if (dpiEff < 300) {
        status = "OK";
        statusColor = "#ef6c00";
      } else {
        status = "Sehr scharf";
        statusColor = "#2e7d32";
      }
    }

    const logoInfo = pxWidth > 0 ? `${pxWidth}x${pxHeight}px` : "-";
    const dpiInfo = dpiEff > 0 ? `${dpiEff} dpi` : "-";

    this.pdfLogoQualityEl.innerHTML = `
      <div style="font-weight:600; color:${statusColor};">Qualitaet: ${status}</div>
      <div>Fuer ${widthMm} mm: empfohlen >= ${okPx}px (ok) / ${goodPx}px (sehr scharf). Dein Logo: ${logoInfo} (~${dpiInfo}).</div>
    `.trim();
  }

  _forceEnableAddRoleInput() {
    if (!this.inpAddRole) return;
    this.inpAddRole.disabled = false;
    this.inpAddRole.removeAttribute("disabled");
    this.inpAddRole.readOnly = false;
    this.inpAddRole.style.pointerEvents = "auto";
  }

  _enableAddRoleControls() {
    if (this.btnAddRole) this.btnAddRole.disabled = false;
    this._forceEnableAddRoleInput();
  }

  _resolveDeleteConfirm(ok) {
    if (this.deleteConfirmOverlayEl) this.deleteConfirmOverlayEl.style.display = "none";
    this._unlockBodyScroll();
    const fn = this._deleteConfirmResolve;
    this._deleteConfirmResolve = null;
    if (typeof fn === "function") fn(!!ok);
  }

  _confirmDeleteCategory(message) {
    if (this.deleteConfirmOverlayEl) this.deleteConfirmOverlayEl.style.display = "flex";
    this._lockBodyScroll();
    if (this.deleteConfirmMsgEl) this.deleteConfirmMsgEl.textContent = message || "";
    if (this.deleteConfirmOkBtn) this.deleteConfirmOkBtn.disabled = false;
    if (this.deleteConfirmCancelBtn) this.deleteConfirmCancelBtn.disabled = false;
    if (this.deleteConfirmOverlayEl) this.deleteConfirmOverlayEl.tabIndex = -1;
    return new Promise((resolve) => {
      this._deleteConfirmResolve = resolve;
      if (this.deleteConfirmOverlayEl) this.deleteConfirmOverlayEl.focus();
    });
  }

  _resolveRename(ok) {
    if (this.renameOverlayEl) this.renameOverlayEl.style.display = "none";
    this._unlockBodyScroll();
    const fn = this._renameResolve;
    this._renameResolve = null;
    if (typeof fn === "function") fn(!!ok);
  }

  _promptRenameCategory(current) {
    if (this.renameOverlayEl) this.renameOverlayEl.style.display = "flex";
    this._lockBodyScroll();
    if (this.renameInputEl) {
      this.renameInputEl.value = current || "";
      this.renameInputEl.focus();
      this.renameInputEl.select();
    }
    if (this.renameOkBtn) this.renameOkBtn.disabled = false;
    if (this.renameCancelBtn) this.renameCancelBtn.disabled = false;
    return new Promise((resolve) => {
      this._renameResolve = resolve;
    });
  }

  _activateAddRoleInput() {
    if (!this.inpAddRole) return;
    this._forceEnableAddRoleInput();
    try {
      this.inpAddRole.focus();
      this.inpAddRole.click();
    } catch {
      // ignore
    }
  }

  _defaultRoleLabels() {
    return {
      10: "Bauherr",
      20: "Planer",
      30: "Sachverstaendige",
      40: "Ing.-Bueros",
      50: "Gewerke",
      60: "Sonstige",
    };
  }

  _fallbackRoleCode() {
    return 60;
  }

  _defaultRoleOrder() {
    return [10, 20, 30, 40, 50, 60];
  }

  _normalizeRoleLabels(raw) {
    const defaults = this._defaultRoleLabels();
    let parsed = null;

    try {
      const obj = JSON.parse(raw || "{}");
      if (obj && typeof obj === "object" && !Array.isArray(obj)) parsed = obj;
    } catch {
      parsed = null;
    }

    const out = { ...defaults };
    if (parsed) {
      for (const [k, v] of Object.entries(parsed)) {
        const n = Number(k);
        if (!Number.isFinite(n) || n <= 0) continue;
        const label = String(v ?? "").trim();
        if (!label) continue;
        out[n] = label;
      }
    }

    return out;
  }

  _normalizeRoleOrder(raw, labelsMap) {
    const baseOrder = this._defaultRoleOrder();
    const labelCodes = Object.keys(labelsMap || {})
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0);

    let parsed = [];
    try {
      const arr = JSON.parse(raw || "[]");
      if (Array.isArray(arr)) parsed = arr;
    } catch {
      parsed = [];
    }

    const out = [];
    const seen = new Set();
    for (const v of parsed) {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) continue;
      if (seen.has(n)) continue;
      out.push(n);
      seen.add(n);
    }

    for (const n of baseOrder) {
      if (seen.has(n)) continue;
      out.push(n);
      seen.add(n);
    }

    const extras = labelCodes.filter((n) => !seen.has(n));
    extras.sort((a, b) => a - b);
    for (const n of extras) out.push(n);

    return out;
  }

  _roleOptions() {
    const labels = this.roleLabels || this._defaultRoleLabels();
    const order =
      Array.isArray(this.roleOrder) && this.roleOrder.length ? this.roleOrder : this._defaultRoleOrder();

    return order.map((code) => ({
      code,
      label: labels[code] || `Rolle ${code}`,
    }));
  }

  _renderRoleOrderList() {
    if (!this.roleListEl) return;

    const options = this._roleOptions();
    const labelByCode = new Map(options.map((o) => [o.code, o.label]));
    const busy = !!this.saving;

    this.roleListEl.innerHTML = "";

    const list = Array.isArray(this.roleOrder) ? this.roleOrder : [];
    const visible = list.filter((code) => labelByCode.has(code));

    if (!visible.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 2;
      emptyCell.textContent = "Keine Rollen vorhanden";
      emptyCell.style.padding = "12px";
      emptyCell.style.opacity = "0.75";
      emptyRow.append(emptyCell);
      this.roleListEl.appendChild(emptyRow);
      this._updateRoleActionsState();
      return;
    }

    visible.forEach((code, index) => {
      const row = document.createElement("tr");
      row.style.borderBottom = "1px solid #eef2f7";
      row.style.cursor = "pointer";
      row.style.background = String(this.roleSelectedCode || "") === String(code) ? "#dff0ff" : "transparent";

      row.onclick = () => {
        if (busy) return;
        this._selectRole(code);
      };

      const orderCell = document.createElement("td");
      orderCell.style.padding = "10px 12px";
      orderCell.style.whiteSpace = "nowrap";
      orderCell.textContent = String(index + 1);

      const labelCell = document.createElement("td");
      labelCell.style.padding = "10px 12px";
      labelCell.textContent = labelByCode.get(code) || `Rolle ${code}`;

      row.append(orderCell, labelCell);
      this.roleListEl.appendChild(row);
    });

    this._updateRoleActionsState();
  }

  _updateRoleActionsState() {
    const hasSelection = this.roleSelectedCode !== null && this.roleSelectedCode !== undefined;
    const busy = !!this.saving;
    const canDelete =
      hasSelection && String(this.roleSelectedCode) !== String(this._fallbackRoleCode());
    if (this.btnRoleMove) {
      this.btnRoleMove.disabled = busy || !hasSelection;
      this.btnRoleMove.style.opacity = this.btnRoleMove.disabled ? "0.55" : "1";
      this.btnRoleMove.style.background = this.roleMoveModeActive ? "#e8f2ff" : "#f3f3f3";
      this.btnRoleMove.style.border = this.roleMoveModeActive
        ? "1px solid #7aa7ff"
        : "1px solid #ddd";
      this.btnRoleMove.textContent = "Schieben";
      this.btnRoleMove.title = this.roleMoveModeActive
        ? "Markierte Rolle mit den Pfeilen verschieben"
        : "Schieben aktivieren";
      this.btnRoleMove.setAttribute("aria-pressed", this.roleMoveModeActive ? "true" : "false");
    }
    const selectedIndex = Array.isArray(this.roleOrder)
      ? this.roleOrder.findIndex((c) => String(c) === String(this.roleSelectedCode))
      : -1;
    const canMoveUp = hasSelection && selectedIndex > 0;
    const canMoveDown =
      hasSelection && Array.isArray(this.roleOrder) && selectedIndex >= 0 && selectedIndex < this.roleOrder.length - 1;
    if (this.btnRoleMoveUp) {
      this.btnRoleMoveUp.disabled = busy || !this.roleMoveModeActive || !canMoveUp;
      this.btnRoleMoveUp.style.opacity = this.btnRoleMoveUp.disabled ? "0.55" : "1";
      this.btnRoleMoveUp.style.display = this.roleMoveModeActive ? "" : "none";
    }
    if (this.btnRoleMoveDown) {
      this.btnRoleMoveDown.disabled = busy || !this.roleMoveModeActive || !canMoveDown;
      this.btnRoleMoveDown.style.opacity = this.btnRoleMoveDown.disabled ? "0.55" : "1";
      this.btnRoleMoveDown.style.display = this.roleMoveModeActive ? "" : "none";
    }
    if (this.roleMoveHintEl) {
      this.roleMoveHintEl.style.display = this.roleMoveModeActive ? "" : "none";
      this.roleMoveHintEl.textContent = this.roleMoveModeActive
        ? "Markierte Rolle mit den Pfeilen verschieben."
        : "";
    }
    if (this.btnRoleDelete) {
      this.btnRoleDelete.disabled = busy || !canDelete;
      this.btnRoleDelete.style.opacity = this.btnRoleDelete.disabled ? "0.55" : "1";
    }
    if (this.btnRoleRename) {
      this.btnRoleRename.disabled = busy || !hasSelection;
      this.btnRoleRename.style.opacity = this.btnRoleRename.disabled ? "0.55" : "1";
    }
  }

  _selectRole(code) {
    this.roleSelectedCode = code;
    this._renderRoleOrderList();
  }

  _toggleRoleMoveMode() {
    if (this.saving) return;
    if (!this.roleSelectedCode) return;
    this.roleMoveModeActive = !this.roleMoveModeActive;
    if (this.roleMoveModeActive) {
      this._attachRoleMoveMouseDown();
      this._attachRoleMoveKeyDown();
    } else {
      this._detachRoleMoveMouseDown();
      this._detachRoleMoveKeyDown();
    }
    if (this.roleMoveModeActive) {
      this.roleRenameCode = null;
      this.roleRenameInputEl = null;
    }
    this._renderRoleOrderList();
  }

  _attachRoleMoveMouseDown() {
    if (this._roleMoveMouseDownHandler) return;
    this._roleMoveMouseDownHandler = () => {
      if (!this.roleMoveModeActive) return;
      this.roleMoveModeActive = false;
      this._detachRoleMoveMouseDown();
      this._detachRoleMoveKeyDown();
      this._renderRoleOrderList();
    };
    document.addEventListener("mousedown", this._roleMoveMouseDownHandler, true);
  }

  _detachRoleMoveMouseDown() {
    if (!this._roleMoveMouseDownHandler) return;
    document.removeEventListener("mousedown", this._roleMoveMouseDownHandler, true);
    this._roleMoveMouseDownHandler = null;
  }

  _attachRoleMoveKeyDown() {
    if (this._roleMoveKeyDownHandler) return;
    this._roleMoveKeyDownHandler = (e) => {
      if (!this.roleMoveModeActive) return;
      if (this.roleRenameCode) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this._moveSelectedRole(-1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this._moveSelectedRole(1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        this.roleMoveModeActive = false;
        this._detachRoleMoveMouseDown();
        this._detachRoleMoveKeyDown();
        this._renderRoleOrderList();
      }
    };
    document.addEventListener("keydown", this._roleMoveKeyDownHandler, true);
  }

  _detachRoleMoveKeyDown() {
    if (!this._roleMoveKeyDownHandler) return;
    document.removeEventListener("keydown", this._roleMoveKeyDownHandler, true);
    this._roleMoveKeyDownHandler = null;
  }

  _handleRoleKeyDown(e) {
    if (!this._settingsModalOpen) return;

    if (this.roleRenameCode) {
      this._handleRoleRenameKey(e);
      return;
    }

    if (!this.roleMoveModeActive) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this._moveSelectedRole(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this._moveSelectedRole(1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      this._toggleRoleMoveMode();
    }
  }

  _handleRoleRenameKey(e) {
    if (!this.roleRenameCode) return;
    if (e.key === "Enter") {
      e.preventDefault();
      this._commitRoleInlineRename({ commit: true });
    }
    if (e.key === "Escape") {
      e.preventDefault();
      this._commitRoleInlineRename({ commit: false });
    }
  }

  _commitRoleInlineRename({ commit } = {}) {
    if (!this.roleRenameCode) return true;
    const code = this.roleRenameCode;
    const raw = this.roleRenameInputEl?.value ?? "";
    const label = String(raw).trim();

    if (commit) {
      if (!label) return false;
      this.roleLabels = { ...(this.roleLabels || {}) };
      this.roleLabels[code] = label;
    }

    this.roleRenameCode = null;
    this.roleRenameInputEl = null;
    this._renderRoleOrderList();
    if (commit) {
      this._saveRoleMeta();
    }
    return true;
  }

  _startRenameSelectedRole() {
    if (this.saving) return;
    if (!this.roleSelectedCode) return;
    this.roleMoveModeActive = false;
    this.roleRenameCode = this.roleSelectedCode;
    this._renderRoleOrderList();
  }

  async _deleteSelectedRole() {
    if (this.saving) return;
    if (!this.roleSelectedCode) return;
    const list = Array.isArray(this.roleOrder) ? this.roleOrder : [];
    const idx = list.findIndex((c) => String(c) === String(this.roleSelectedCode));
    const nextCode = idx >= 0 ? list[idx + 1] ?? list[idx - 1] ?? null : null;
    this._roleSelectionAfterReload = nextCode;
    await this._deleteRoleCategory(this.roleSelectedCode);
  }

  async _moveSelectedRole(delta) {
    if (this.saving) return;
    const list = Array.isArray(this.roleOrder) ? [...this.roleOrder] : [];
    const idx = list.findIndex((c) => String(c) === String(this.roleSelectedCode));
    if (idx < 0) return;
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    const tmp = list[idx];
    list[idx] = list[target];
    list[target] = tmp;
    this.roleOrder = list;
    this._renderRoleOrderList();
    await this._saveRoleMeta();
  }

  async _moveRole(index, delta) {
    if (this.saving) return;
    const list = Array.isArray(this.roleOrder) ? [...this.roleOrder] : [];
    const a = index;
    const b = index + delta;
    if (a < 0 || b < 0 || a >= list.length || b >= list.length) return;
    const tmp = list[a];
    list[a] = list[b];
    list[b] = tmp;
    this.roleOrder = list;
    this._renderRoleOrderList();
    await this._saveRoleMeta();
  }

  async _renameRoleCategory(code) {
    if (this.saving) return;
    const current = (this.roleLabels && this.roleLabels[code]) || `Rolle ${code}`;
    const ok = await this._promptRenameCategory(current);
    if (!ok) return;
    const next = this.renameInputEl?.value ?? "";
    const label = String(next).trim();
    if (!label) return;

    this.roleLabels = { ...(this.roleLabels || {}) };
    this.roleLabels[code] = label;
    this._renderRoleOrderList();
    await this._saveRoleMeta();
  }

  async _addRoleCategory() {
    if (this.saving) return;
    const label = (this.inpAddRole?.value || "").trim();
    if (!label) return;

    const order = Array.isArray(this.roleOrder) ? [...this.roleOrder] : [];
    const codes = [...order, ...Object.keys(this.roleLabels || {}).map((k) => Number(k))].filter((n) =>
      Number.isFinite(n)
    );

    const max = codes.length ? Math.max(...codes) : 0;
    const newCode = Math.trunc(max) + 10;

    this.roleLabels = { ...(this.roleLabels || {}) };
    this.roleLabels[newCode] = label;
    this.roleOrder = [...order, newCode];

    this._renderRoleOrderList();
    await this._saveRoleMeta();

    if (this.inpAddRole) this.inpAddRole.value = "";
  }

  async _deleteRoleCategory(code) {
    if (this.saving) return;
    if (code === this._fallbackRoleCode()) return;

    const labels = this.roleLabels || this._defaultRoleLabels();
    const fallbackCode = this._fallbackRoleCode();
    const label = labels[code] || `Rolle ${code}`;
    const fallbackLabel = labels[fallbackCode] || this._defaultRoleLabels()[fallbackCode];

    const ok = await this._confirmDeleteCategory(
      `Rolle/Kategorie "${label}" wird geloescht. Firmen werden auf "${fallbackLabel}" umgestellt. Fortfahren?`
    );
    if (!ok) return;

    const api = window.bbmDb || {};
    if (typeof api.settingsCategoriesDelete !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return;
    }

    this.saving = true;
    this._setMsg("Loesche...");
    this._applyState();

    let infoMsg = "";
    try {
      const res = await api.settingsCategoriesDelete({
        code,
        fallbackCode,
      });
      if (!res?.ok) {
        alert(res?.error || "Loeschen fehlgeschlagen");
        return;
      }

      const firms = Number(res?.reassignedCounts?.firms || 0);
      const projectFirms = Number(res?.reassignedCounts?.projectFirms || 0);
      infoMsg = `Umgehaengt: Stamm ${firms}, Projekt ${projectFirms}`;
    } finally {
      this.saving = false;
      this._applyState();
      await this._reload();
      if (infoMsg) this._setMsg(infoMsg);
      this._enableAddRoleControls();
      try {
        window.focus();
      } catch {
        // ignore
      }
      setTimeout(() => {
        this._enableAddRoleControls();
        this._activateAddRoleInput();
      }, 100);
    }
  }

  async _saveRoleMeta() {
    if (this.saving) return false;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    this.saving = true;
    this._setMsg("Speichere...");
    this._applyState();

    try {
      const res = await api.appSettingsSetMany({
        firm_role_order: JSON.stringify(this.roleOrder || []),
        firm_role_labels: JSON.stringify(this.roleLabels || {}),
      });
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      this._setMsg("Gespeichert");
      return true;
    } finally {
      this.saving = false;
      this._applyState();
    }
  }

  _createFirmRoleOrderPopupContent() {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "12px";
    wrap.style.minWidth = "min(920px, calc(100vw - 80px))";
    wrap.style.maxWidth = "1040px";

    const intro = document.createElement("div");
    intro.style.display = "grid";
    intro.style.gap = "4px";

    const introHint = document.createElement("div");
    introHint.textContent =
      "Legt fest, in welcher Reihenfolge Firmenrollen in Listen und im Druck erscheinen.";
    introHint.style.fontSize = "12px";
    introHint.style.opacity = "0.8";
    intro.append(introHint);

    const actionBar = document.createElement("div");
    actionBar.style.display = "flex";
    actionBar.style.gap = "8px";
    actionBar.style.flexWrap = "wrap";
    actionBar.style.alignItems = "center";
    this.roleActionBarEl = actionBar;

    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.textContent = "Schieben";
    applyPopupButtonStyle(moveBtn);
    moveBtn.onclick = () => {
      this._toggleRoleMoveMode();
    };
    this.btnRoleMove = moveBtn;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    applyPopupButtonStyle(editBtn);
    editBtn.onclick = async () => {
      if (!this.roleSelectedCode) return;
      await this._renameRoleCategory(this.roleSelectedCode);
    };
    this.btnRoleRename = editBtn;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Löschen";
    applyPopupButtonStyle(deleteBtn);
    deleteBtn.onclick = async () => {
      if (!this.roleSelectedCode) return;
      await this._deleteSelectedRole();
    };
    this.btnRoleDelete = deleteBtn;

    const moveControls = document.createElement("div");
    moveControls.style.display = "flex";
    moveControls.style.gap = "8px";
    moveControls.style.flexWrap = "wrap";
    moveControls.style.alignItems = "center";

    const btnUp = document.createElement("button");
    btnUp.type = "button";
    btnUp.textContent = "▲ Hoch";
    applyPopupButtonStyle(btnUp);
    btnUp.onclick = async () => {
      await this._moveSelectedRole(-1);
    };
    this.btnRoleMoveUp = btnUp;

    const btnDown = document.createElement("button");
    btnDown.type = "button";
    btnDown.textContent = "▼ Runter";
    applyPopupButtonStyle(btnDown);
    btnDown.onclick = async () => {
      await this._moveSelectedRole(1);
    };
    this.btnRoleMoveDown = btnDown;

    this.roleMoveHintEl = document.createElement("div");
    this.roleMoveHintEl.style.fontSize = "12px";
    this.roleMoveHintEl.style.opacity = "0.8";
    this.roleMoveHintEl.style.display = "none";

    moveControls.append(btnUp, btnDown, this.roleMoveHintEl);
    actionBar.append(moveBtn, editBtn, deleteBtn, moveControls);

    const addBar = document.createElement("div");
    addBar.style.display = "flex";
    addBar.style.gap = "8px";
    addBar.style.flexWrap = "wrap";
    addBar.style.alignItems = "end";

    const addLabel = document.createElement("label");
    addLabel.style.display = "grid";
    addLabel.style.gap = "4px";
    addLabel.style.minWidth = "260px";

    const addLabelText = document.createElement("span");
    addLabelText.textContent = "Neue Rolle";
    addLabelText.style.fontSize = "12px";
    addLabelText.style.fontWeight = "700";

    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.placeholder = "z. B. Gutachter";
    addInput.style.width = "100%";
    addInput.style.minWidth = "240px";
    this.inpAddRole = addInput;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Rolle hinzufügen";
    applyPopupButtonStyle(addBtn, { variant: "primary" });
    addBtn.onclick = async () => {
      await this._addRoleCategory();
    };
    this.btnAddRole = addBtn;

    addInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addBtn.click();
    });
    addInput.addEventListener("input", () => {
      addBtn.disabled = !String(addInput.value || "").trim();
    });
    addBtn.disabled = !String(addInput.value || "").trim();

    addLabel.append(addLabelText, addInput);
    addBar.append(addLabel, addBtn);

    const tableWrap = document.createElement("div");
    tableWrap.style.border = "1px solid #dbe3ea";
    tableWrap.style.borderRadius = "8px";
    tableWrap.style.overflow = "auto";
    tableWrap.style.background = "#fff";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "13px";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const text of ["Nr.", "Rolle/Kategorie"]) {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.textAlign = "left";
      th.style.padding = "10px 12px";
      th.style.borderBottom = "1px solid #dbe3ea";
      th.style.background = "#f8fafc";
      th.style.position = "sticky";
      th.style.top = "0";
      th.style.zIndex = "1";
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    this.roleListEl = tbody;
    this.roleRenameInputEl = null;

    table.append(thead, tbody);
    tableWrap.append(table);
    wrap.append(intro, actionBar, addBar, tableWrap);

    if (!this.roleSelectedCode && Array.isArray(this.roleOrder) && this.roleOrder.length) {
      this.roleSelectedCode = this.roleOrder[0];
    }
    this._renderRoleOrderList();

    return wrap;
  }

  async _openFirmRoleOrderPopup() {
    const content = this._createFirmRoleOrderPopupContent();
    this._openSettingsModal({
      title: "Rollenreihenfolge für Firmen",
      content: [content],
      saveFn: async () => (await this._saveRoleMeta()) !== false,
      closeOnly: false,
    });
  }

  async _reload() {
    this._setMsg("");
    this._applyState();

    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany !== "function") {
      this._setMsg("Settings-API fehlt (IPC noch nicht aktiv).");
      this._applyState();
      return;
    }

    let profile = null;
    if (typeof api.userProfileGet === "function") {
      const resProfile = await api.userProfileGet();
      if (!resProfile?.ok) {
        this._setMsg(resProfile?.error || "Fehler beim Laden der Nutzerdaten");
      } else {
        profile = resProfile.profile || null;
      }
    }

    const res = await api.appSettingsGetMany([
      "user_name",
      "user_company",
      "user_name1",
      "user_name2",
      "user_street",
      "user_zip",
      "user_city",
      "firm_role_order",
      "firm_role_labels",
      "header.logoSizePx",
      "header.logoPadLeftPx",
      "header.logoPadTopPx",
      "header.logoPadRightPx",
      "header.logoPosition",
      "header.logoEnabled",
      "ui.themeHeaderBaseColor",
      "ui.themeSidebarBaseColor",
      "ui.themeMainBaseColor",
      "ui.themeHeaderTone",
      "ui.themeSidebarTone",
      "ui.themeMainTone",
      "ui.themeHeaderMode",
      "ui.themeSidebarMode",
      "ui.themeMainMode",
      "ui.themeHeaderUseDefault",
      "ui.themeSidebarUseDefault",
      "ui.themeMainUseDefault",
      "defaults.ui.themeHeaderBaseColor",
      "defaults.ui.themeSidebarBaseColor",
      "defaults.ui.themeMainBaseColor",
      "defaults.ui.themeHeaderTone",
      "defaults.ui.themeSidebarTone",
      "defaults.ui.themeMainTone",
      "dev_color_default_enabled",
      "dev_color_header_default",
      "dev_color_header_name",
      "dev_color_header_r",
      "dev_color_header_g",
      "dev_color_header_b",
      "dev_color_sidebar_default",
      "dev_color_sidebar_name",
      "dev_color_sidebar_r",
      "dev_color_sidebar_g",
      "dev_color_sidebar_b",
      "dev_color_main_default",
      "dev_color_main_name",
      "dev_color_main_r",
      "dev_color_main_g",
      "dev_color_main_b",
      "pdf.userLogoPngDataUrl",
      "pdf.userLogoEnabled",
      "pdf.userLogoWidthMm",
      "pdf.userLogoTopMm",
      "pdf.userLogoRightMm",
      "pdf.userLogoFilePath",
      "print.logo1.enabled",
      "print.logo1.size",
      "print.logo1.align",
      "print.logo1.vAlign",
      "print.logo1.pngDataUrl",
      "print.logo2.enabled",
      "print.logo2.size",
      "print.logo2.align",
      "print.logo2.vAlign",
      "print.logo2.pngDataUrl",
      "print.logo3.enabled",
      "print.logo3.size",
      "print.logo3.align",
      "print.logo3.vAlign",
      "print.logo3.pngDataUrl",
      "print.logoSizePreset",
      "print.v2.globalHeaderAdaptive",
      "pdf.protocolTitle",
      "pdf.trafficLightAllEnabled",
      "pdf.protocolsDir",
      "pdf.preRemarks",
      "print.preRemarks.enabled",
      "pdf.footerPlace",
      "pdf.footerDate",
      "pdf.footerName1",
      "pdf.footerName2",
      "pdf.footerRecorder",
      "pdf.footerStreet",
      "pdf.footerZip",
      "pdf.footerCity",
      "pdf.footerUseUserData",
    ]);
    if (!res?.ok) {
      this._setMsg(res?.error || "Fehler beim Laden der Einstellungen");
      this._applyState();
      return;
    }

    const data = res.data || {};
    const userState = this._resolveUserSettingsState({ data, profile });
    this.userName = userState.userName;
    this.userCompany = userState.userCompany;

    const userName1 = userState.userName1;
    const userName2 = userState.userName2;
    const userStreet = userState.userStreet;
    const userZip = userState.userZip;
    const userCity = userState.userCity;

    if (userState.profileFallbackUsed && typeof api.userProfileUpsert === "function") {
      const resProfile = await api.userProfileUpsert(userState.profileRecord);
      if (!resProfile?.ok) {
        this._setMsg(resProfile?.error || "Fehler beim Speichern der Nutzerdaten");
      }
    }

    if (this.inpUserName1) this.inpUserName1.value = userName1;
    if (this.inpUserName2) this.inpUserName2.value = userName2;
    if (this.inpUserStreet) this.inpUserStreet.value = userStreet;
    if (this.inpUserZip) this.inpUserZip.value = this._normalizeUserZip(userZip, 5);
    if (this.inpUserCity) this.inpUserCity.value = userCity;
    const defaults = this._logoDefaults();
    const size = this._clampLogoNumber(data["header.logoSizePx"], 12, 48, defaults.size);
    const padLeft = this._clampLogoNumber(data["header.logoPadLeftPx"], 0, 40, defaults.padLeft);
    const padTop = this._clampLogoNumber(data["header.logoPadTopPx"], 0, 20, defaults.padTop);
    const padRight = this._clampLogoNumber(data["header.logoPadRightPx"], 0, 80, defaults.padRight);
    const position = this._normalizeLogoPosition(data["header.logoPosition"], defaults.position);
    const logoEnabled = this._parseBool(data["header.logoEnabled"], defaults.enabled);
    this._applyLogoInputs({ size, padLeft, padTop, padRight, position, enabled: logoEnabled });

    const startThemeDefaults = this._readThemeStartDefaultsFromData(data);
    this._setThemeRuntimeDefaults(startThemeDefaults);
    const themeDefaults = this._themeDefaults();
    const headerDefaultRgb = this._themeAreaDefaultRgb("header");
    const sidebarDefaultRgb = this._themeAreaDefaultRgb("sidebar");
    const mainDefaultRgb = this._themeAreaDefaultRgb("main");
    const legacyHeaderDefault = this._parseBool(data["dev_color_header_default"], true);
    const legacySidebarDefault = this._parseBool(data["dev_color_sidebar_default"], true);
    const legacyMainDefault = this._parseBool(data["dev_color_main_default"], true);
    const legacyGlobalUseDefault = this._parseBool(
      data["dev_color_default_enabled"],
      legacyHeaderDefault && legacySidebarDefault && legacyMainDefault
    );
    const headerUseDefault = this._parseBool(data["ui.themeHeaderUseDefault"], legacyGlobalUseDefault);
    const sidebarUseDefault = this._parseBool(data["ui.themeSidebarUseDefault"], legacyGlobalUseDefault);
    const mainUseDefault = this._parseBool(data["ui.themeMainUseDefault"], legacyGlobalUseDefault);
    const legacyHeaderRgb = {
      r: headerUseDefault
        ? headerDefaultRgb.r
        : this._clampThemeRgb(data["dev_color_header_r"], headerDefaultRgb.r),
      g: headerUseDefault
        ? headerDefaultRgb.g
        : this._clampThemeRgb(data["dev_color_header_g"], headerDefaultRgb.g),
      b: headerUseDefault
        ? headerDefaultRgb.b
        : this._clampThemeRgb(data["dev_color_header_b"], headerDefaultRgb.b),
    };
    const legacySidebarRgb = {
      r: sidebarUseDefault
        ? sidebarDefaultRgb.r
        : this._clampThemeRgb(data["dev_color_sidebar_r"], sidebarDefaultRgb.r),
      g: sidebarUseDefault
        ? sidebarDefaultRgb.g
        : this._clampThemeRgb(data["dev_color_sidebar_g"], sidebarDefaultRgb.g),
      b: sidebarUseDefault
        ? sidebarDefaultRgb.b
        : this._clampThemeRgb(data["dev_color_sidebar_b"], sidebarDefaultRgb.b),
    };
    const legacyMainRgb = {
      r: mainUseDefault
        ? mainDefaultRgb.r
        : this._clampThemeRgb(data["dev_color_main_r"], mainDefaultRgb.r),
      g: mainUseDefault
        ? mainDefaultRgb.g
        : this._clampThemeRgb(data["dev_color_main_g"], mainDefaultRgb.g),
      b: mainUseDefault
        ? mainDefaultRgb.b
        : this._clampThemeRgb(data["dev_color_main_b"], mainDefaultRgb.b),
    };
    const headerRgb = this._themeHexToRgb(data["ui.themeHeaderBaseColor"], legacyHeaderRgb);
    const sidebarRgb = this._themeHexToRgb(data["ui.themeSidebarBaseColor"], legacySidebarRgb);
    const mainRgb = this._themeHexToRgb(data["ui.themeMainBaseColor"], legacyMainRgb);
    const themeSettings = normalizeThemeSettings({
      headerBaseColor: this._themeRgbToHex(headerRgb),
      sidebarBaseColor: this._themeRgbToHex(sidebarRgb),
      mainBaseColor: this._themeRgbToHex(mainRgb),
      headerTone: data["ui.themeHeaderTone"] ?? (headerUseDefault ? themeDefaults.headerTone : 50),
      sidebarTone: data["ui.themeSidebarTone"] ?? (sidebarUseDefault ? themeDefaults.sidebarTone : 50),
      mainTone: data["ui.themeMainTone"] ?? (mainUseDefault ? themeDefaults.mainTone : 50),
      headerMode: data["ui.themeHeaderMode"] ?? null,
      sidebarMode: data["ui.themeSidebarMode"] ?? null,
      mainMode: data["ui.themeMainMode"] ?? null,
      headerUseDefault,
      sidebarUseDefault,
      mainUseDefault,
    });
    themeSettings.headerColorName = (data["dev_color_header_name"] ?? "").toString();
    themeSettings.sidebarColorName = (data["dev_color_sidebar_name"] ?? "").toString();
    themeSettings.mainColorName = (data["dev_color_main_name"] ?? "").toString();
    themeSettings.headerR = headerRgb.r;
    themeSettings.headerG = headerRgb.g;
    themeSettings.headerB = headerRgb.b;
    themeSettings.sidebarR = sidebarRgb.r;
    themeSettings.sidebarG = sidebarRgb.g;
    themeSettings.sidebarB = sidebarRgb.b;
    themeSettings.mainR = mainRgb.r;
    themeSettings.mainG = mainRgb.g;
    themeSettings.mainB = mainRgb.b;
    this._applyThemeInputs(themeSettings);
    applyThemeForSettings(themeSettings);
    if (this.router?.context) {
      this.router.context.settings = {
        ...(this.router.context.settings || {}),
        "ui.themeHeaderBaseColor": themeSettings.headerBaseColor,
        "ui.themeSidebarBaseColor": themeSettings.sidebarBaseColor,
        "ui.themeMainBaseColor": themeSettings.mainBaseColor,
        "ui.themeHeaderTone": themeSettings.headerTone,
        "ui.themeSidebarTone": themeSettings.sidebarTone,
        "ui.themeMainTone": themeSettings.mainTone,
        "ui.themeHeaderUseDefault": themeSettings.headerUseDefault ? "true" : "false",
        "ui.themeSidebarUseDefault": themeSettings.sidebarUseDefault ? "true" : "false",
        "ui.themeMainUseDefault": themeSettings.mainUseDefault ? "true" : "false",
        "defaults.ui.themeHeaderBaseColor": this._themeRuntimeDefaults.headerBaseColor,
        "defaults.ui.themeSidebarBaseColor": this._themeRuntimeDefaults.sidebarBaseColor,
        "defaults.ui.themeMainBaseColor": this._themeRuntimeDefaults.mainBaseColor,
        "defaults.ui.themeHeaderTone": String(this._themeRuntimeDefaults.headerTone),
        "defaults.ui.themeSidebarTone": String(this._themeRuntimeDefaults.sidebarTone),
        "defaults.ui.themeMainTone": String(this._themeRuntimeDefaults.mainTone),
        "dev_color_default_enabled": themeSettings.headerUseDefault ? "true" : "false",
        "dev_color_header_default": themeSettings.headerUseDefault ? "true" : "false",
        "dev_color_header_name": themeSettings.headerColorName,
        "dev_color_header_r": themeSettings.headerR,
        "dev_color_header_g": themeSettings.headerG,
        "dev_color_header_b": themeSettings.headerB,
        "dev_color_sidebar_default": themeSettings.sidebarUseDefault ? "true" : "false",
        "dev_color_sidebar_name": themeSettings.sidebarColorName,
        "dev_color_sidebar_r": themeSettings.sidebarR,
        "dev_color_sidebar_g": themeSettings.sidebarG,
        "dev_color_sidebar_b": themeSettings.sidebarB,
        "dev_color_main_default": themeSettings.mainUseDefault ? "true" : "false",
        "dev_color_main_name": themeSettings.mainColorName,
        "dev_color_main_r": themeSettings.mainR,
        "dev_color_main_g": themeSettings.mainG,
        "dev_color_main_b": themeSettings.mainB,
      };
    }

    const pdfLogoDefaults = this._pdfLogoDefaults();
    const enabled = this._parseBool(data["pdf.userLogoEnabled"], pdfLogoDefaults.enabled);
    const widthMm = this._clampPdfLogoNumber(
      data["pdf.userLogoWidthMm"],
      10,
      60,
      pdfLogoDefaults.widthMm
    );
    const topMm = this._clampPdfLogoNumber(data["pdf.userLogoTopMm"], 0, 30, pdfLogoDefaults.topMm);
    const rightMm = this._clampPdfLogoNumber(
      data["pdf.userLogoRightMm"],
      0,
      30,
      pdfLogoDefaults.rightMm
    );
    const dataUrl = (data["pdf.userLogoPngDataUrl"] ?? "").toString();
    const logoFilePath = (data["pdf.userLogoFilePath"] ?? "").toString();

    this._applyPdfLogoInputs({ enabled, widthMm, topMm, rightMm });
    this._setPdfLogoDataUrl(dataUrl, { skipSave: true });
    this._setPdfLogoFilePath(logoFilePath, { skipSave: true });

    const legacyPdfLogoDataUrl = String(data["pdf.userLogoPngDataUrl"] || "").trim();
    const printLogo1DataUrl = String(data["print.logo1.pngDataUrl"] || "").trim();
    if (!printLogo1DataUrl && legacyPdfLogoDataUrl && typeof api.appSettingsSetMany === "function") {
      const fallbackSize = this._normalizePrintLogoSize(data["print.logoSizePreset"]);
      try {
        const migrateRes = await api.appSettingsSetMany({
          "print.logo1.enabled": "true",
          "print.logo1.size": fallbackSize,
          "print.logo1.pngDataUrl": legacyPdfLogoDataUrl,
        });
        if (migrateRes?.ok) {
          data["print.logo1.enabled"] = "true";
          data["print.logo1.size"] = fallbackSize;
          data["print.logo1.pngDataUrl"] = legacyPdfLogoDataUrl;
        }
      } catch (_e) {
        // Migration ist optional; bei Fehlern nicht den Settings-Dialog blockieren.
      }
    }

    this._applyPrintLogoInputsFromSettings(data);

    const pdfSettingsDefaults = this._pdfSettingsDefaults();
    const protocolTitleRaw = data["pdf.protocolTitle"];
    const protocolTitle =
      protocolTitleRaw == null
        ? pdfSettingsDefaults.protocolTitle
        : String(protocolTitleRaw);
    const trafficLightAllEnabled = this._parseBool(
      data["pdf.trafficLightAllEnabled"],
      pdfSettingsDefaults.trafficLightAllEnabled
    );
    const protocolsDirRaw = data["pdf.protocolsDir"];
    const protocolsDirNormalized = protocolsDirRaw == null ? "" : String(protocolsDirRaw).trim();
    const protocolsDir = protocolsDirNormalized || pdfSettingsDefaults.protocolsDir;
    const preRemarksRaw = data["pdf.preRemarks"];
    const preRemarks =
      preRemarksRaw == null ? pdfSettingsDefaults.preRemarks : String(preRemarksRaw);
    const preRemarksEnabled = this._parseBool(
      data["print.preRemarks.enabled"],
      pdfSettingsDefaults.preRemarksEnabled
    );
    const footerUseUserData = this._parseBool(
      data["pdf.footerUseUserData"],
      pdfSettingsDefaults.footerUseUserData
    );
    const footerPlace = (data["pdf.footerPlace"] ?? "").toString();
    const footerDate = (data["pdf.footerDate"] ?? "").toString();
    const footerName1 = (data["pdf.footerName1"] ?? "").toString();
    const footerName2 = (data["pdf.footerName2"] ?? "").toString();
    const footerRecorder = (data["pdf.footerRecorder"] ?? "").toString();
    const footerStreet = (data["pdf.footerStreet"] ?? "").toString();
    const footerZip = (data["pdf.footerZip"] ?? "").toString();
    const footerCity = (data["pdf.footerCity"] ?? "").toString();

    this._applyPdfSettingsInputs({
      protocolTitle,
      trafficLightAllEnabled,
      protocolsDir,
      preRemarks,
      preRemarksEnabled,
      footerUseUserData,
      footerPlace,
      footerDate,
      footerName1,
      footerName2,
      footerRecorder,
      footerStreet,
      footerZip,
      footerCity,
    });

    if (!protocolsDirNormalized) {
      this._schedulePdfSettingsSave({ markTouched: false });
    }

    if (footerUseUserData) {
      this._applyPdfFooterUserDefaultsFromUser();
    }

    const defaultsChanged = this._applyPdfFooterPlaceDateDefaults({ city: userCity });
    if (defaultsChanged) {
      this._schedulePdfSettingsSave({ markTouched: false });
    }

    this.roleLabels = this._normalizeRoleLabels(data.firm_role_labels || "");
    this.roleOrder = this._normalizeRoleOrder(data.firm_role_order || "", this.roleLabels);
    if (this._roleSelectionAfterReload !== null && this._roleSelectionAfterReload !== undefined) {
      this.roleSelectedCode = this._roleSelectionAfterReload;
      this._roleSelectionAfterReload = null;
    } else if (!this.roleSelectedCode && this.roleOrder.length) {
      this.roleSelectedCode = this.roleOrder[0];
    }
    this._renderRoleOrderList();
    await this._reloadSecurityPinState();
    this._applyState();
  }

  async _save() {
    if (this.saving) return false;

    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany !== "function") {
      alert("Settings-API fehlt (IPC noch nicht aktiv).");
      return false;
    }

    const user_name = this._normalizeUserText(this.inpName?.value ?? this.userName, 80);
    const user_company = this._normalizeUserText(this.inpCompany?.value ?? this.userCompany, 80);
    const user_name1 = this._normalizeUserText(this.inpUserName1?.value, 80);
    const user_name2 = this._normalizeUserText(this.inpUserName2?.value, 80);
    const user_street = this._normalizeUserText(this.inpUserStreet?.value, 80);
    const user_zip = this._normalizeUserZip(this.inpUserZip?.value, 5);
    const user_city = this._normalizeUserText(this.inpUserCity?.value, 80);
    this._applyPdfFooterUserDefaultsFromUser({
      name1: user_name1,
      name2: user_name2,
      street: user_street,
      zip: user_zip,
      city: user_city,
    }, { overwriteExisting: true });

    const pdfValues = this._getPdfSettingsInputValues();
    const pdfValuesForSave = {
      ...pdfValues,
      footerName1: user_name1,
      footerName2: user_name2,
      footerStreet: user_street,
      footerZip: user_zip,
      footerCity: user_city,
    };

    this.userName = user_name;
    this.userCompany = user_company;
    if (this.inpUserName1) this.inpUserName1.value = user_name1;
    if (this.inpUserName2) this.inpUserName2.value = user_name2;
    if (this.inpUserStreet) this.inpUserStreet.value = user_street;
    if (this.inpUserZip) this.inpUserZip.value = user_zip;
    if (this.inpUserCity) this.inpUserCity.value = user_city;
    this._applyPdfSettingsInputs(pdfValuesForSave);

    this.saving = true;
    this._setMsg("Speichere...");
    this._applyState();

    try {
      if (typeof api.userProfileUpsert === "function") {
        const resProfile = await api.userProfileUpsert({
          name1: user_name1,
          name2: user_name2,
          street: user_street,
          zip: user_zip,
          city: user_city,
        });
        if (!resProfile?.ok) {
          alert(resProfile?.error || "Speichern der Nutzerdaten fehlgeschlagen");
          return false;
        }
        if (resProfile?.profile) {
          const p = resProfile.profile;
          if (this.inpUserName1) this.inpUserName1.value = (p.name1 ?? "").toString();
          if (this.inpUserName2) this.inpUserName2.value = (p.name2 ?? "").toString();
          if (this.inpUserStreet) this.inpUserStreet.value = (p.street ?? "").toString();
          if (this.inpUserZip) this.inpUserZip.value = this._normalizeUserZip((p.zip ?? "").toString(), 5);
          if (this.inpUserCity) this.inpUserCity.value = (p.city ?? "").toString();
        }
      }

    const payload = {
      user_name,
      user_company,
        user_name1,
        user_name2,
        user_street,
        user_zip,
        user_city,
        "pdf.protocolTitle": pdfValuesForSave.protocolTitle,
        "pdf.trafficLightAllEnabled": pdfValuesForSave.trafficLightAllEnabled ? "true" : "false",
        "pdf.preRemarks": pdfValuesForSave.preRemarks,
        "print.preRemarks.enabled": pdfValuesForSave.preRemarksEnabled ? "true" : "false",
        "pdf.footerPlace": pdfValuesForSave.footerPlace,
        "pdf.footerDate": pdfValuesForSave.footerDate,
        "pdf.footerName1": pdfValuesForSave.footerName1,
        "pdf.footerName2": pdfValuesForSave.footerName2,
        "pdf.footerRecorder": pdfValuesForSave.footerRecorder,
        "pdf.footerStreet": pdfValuesForSave.footerStreet,
        "pdf.footerZip": pdfValuesForSave.footerZip,
        "pdf.footerCity": pdfValuesForSave.footerCity,
        "pdf.footerUseUserData": pdfValuesForSave.footerUseUserData ? "true" : "false",
        ...this._buildTouchedPayloadFromValues({
          user_name,
          user_company,
          user_name1,
          user_name2,
          user_street,
          user_zip,
          user_city,
          "pdf.protocolTitle": pdfValuesForSave.protocolTitle,
          "pdf.preRemarks": pdfValuesForSave.preRemarks,
          "pdf.footerPlace": pdfValuesForSave.footerPlace,
          "pdf.footerDate": pdfValuesForSave.footerDate,
          "pdf.footerName1": pdfValuesForSave.footerName1,
          "pdf.footerName2": pdfValuesForSave.footerName2,
          "pdf.footerRecorder": pdfValuesForSave.footerRecorder,
          "pdf.footerStreet": pdfValuesForSave.footerStreet,
          "pdf.footerZip": pdfValuesForSave.footerZip,
          "pdf.footerCity": pdfValuesForSave.footerCity,
        }),
        ...this._buildTouchedPayloadForKeys([
          "pdf.trafficLightAllEnabled",
          "print.preRemarks.enabled",
          "pdf.footerUseUserData",
        ]),
        };
      const res = await api.appSettingsSetMany(payload);
        if (!res?.ok) {
          alert(res?.error || "Speichern fehlgeschlagen");
          return false;
        }

      if (this.router?.context) {
        this.router.context.settings = {
          ...(this.router.context.settings || {}),
          user_name,
          user_company,
          user_name1,
          user_name2,
          user_street,
          user_zip,
          user_city,
          "pdf.protocolTitle": pdfValuesForSave.protocolTitle,
          "pdf.trafficLightAllEnabled": pdfValuesForSave.trafficLightAllEnabled ? "true" : "false",
          "pdf.preRemarks": pdfValuesForSave.preRemarks,
          "print.preRemarks.enabled": pdfValuesForSave.preRemarksEnabled ? "true" : "false",
          "pdf.footerPlace": pdfValuesForSave.footerPlace,
          "pdf.footerDate": pdfValuesForSave.footerDate,
          "pdf.footerName1": pdfValuesForSave.footerName1,
          "pdf.footerName2": pdfValuesForSave.footerName2,
          "pdf.footerRecorder": pdfValuesForSave.footerRecorder,
          "pdf.footerStreet": pdfValuesForSave.footerStreet,
          "pdf.footerZip": pdfValuesForSave.footerZip,
          "pdf.footerCity": pdfValuesForSave.footerCity,
          "pdf.footerUseUserData": pdfValuesForSave.footerUseUserData ? "true" : "false",
        };
      }
      window.dispatchEvent(new Event("bbm:header-refresh"));

        this._setMsg("Gespeichert");
        return true;
      } finally {
        this.saving = false;
        this._applyState();
      }
    }

  _appendSettingsModalContentItem(target, item) {
    if (!target || item == null) return;
    if (Array.isArray(item)) {
      for (const child of item) {
        this._appendSettingsModalContentItem(target, child);
      }
      return;
    }
    if (item instanceof Node) {
      target.appendChild(item);
      return;
    }
    if (typeof item === "string") {
      target.appendChild(document.createTextNode(item));
      return;
    }
    if (typeof item.render === "function") {
      this._appendSettingsModalContentItem(target, item.render());
      return;
    }
    target.appendChild(document.createTextNode(String(item)));
  }

  _applyPdfFooterUserDefaultsToInputs(targets = {}, values, { overwriteExisting = false } = {}) {
    const data = values || this._getNormalizedUserFooterDefaults();
    const pairs = [
      [targets.name1, data.name1],
      [targets.name2, data.name2],
      [targets.street, data.street],
      [targets.zip, data.zip],
      [targets.city, data.city],
    ];

    for (const [input, value] of pairs) {
      if (!input) continue;
      const current = String(input.value || "").trim();
      if (current && !overwriteExisting) continue;
      const next = String(value || "").trim();
      if (!next) continue;
      input.value = next;
    }
  }

  async _createProfileAddressContent() {
    const api = window.bbmDb || {};
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";
    wrap.style.minWidth = "min(560px, calc(100vw - 80px))";

    const info = document.createElement("div");
    info.style.fontSize = "12px";
    info.style.opacity = "0.85";
    info.textContent = "Nutzerprofil, Adresse und globale Stammdaten.";
    wrap.append(info);

    const inputs = new Map();
    this._settingsInputs = inputs;

    const renderField = (field) => {
      const row = document.createElement("label");
      row.style.display = "grid";
      row.style.gap = "4px";

      const lbl = document.createElement("span");
      lbl.textContent = field.label || field.key;
      lbl.style.fontSize = "12px";

      const inp = document.createElement("input");
      inp.type = "text";
      inp.style.width = "100%";
      row.append(lbl, inp);
      inputs.set(field.key, inp);
      return row;
    };

    const makeCard = (titleText, hintText, fields) => {
      const card = document.createElement("div");
      applyPopupCardStyle(card);
      card.style.padding = "10px";
      card.style.display = "grid";
      card.style.gap = "8px";

      const heading = document.createElement("div");
      heading.textContent = titleText;
      heading.style.fontWeight = "800";
      card.append(heading);

      const hint = document.createElement("div");
      hint.textContent = hintText;
      hint.style.fontSize = "12px";
      hint.style.opacity = "0.78";
      card.append(hint);

      for (const field of fields) {
        card.append(renderField(field));
      }
      return card;
    };

    const profileCard = makeCard("Profil", "Name, Firma und Anzeigedaten", [
      { key: "user_name", label: "Nutzername" },
      { key: "user_company", label: "Firma" },
    ]);
    const addressCard = makeCard("Adresse", "Strasse, PLZ und Ort", [
      { key: "user_name1", label: "Name 1" },
      { key: "user_name2", label: "Name 2" },
      { key: "user_street", label: "Strasse" },
      { key: "user_zip", label: "PLZ" },
      { key: "user_city", label: "Ort" },
    ]);

    wrap.append(profileCard, addressCard);

    let profile = null;
    if (typeof api.userProfileGet === "function") {
      const resProfile = await api.userProfileGet();
      if (resProfile?.ok) {
        profile = resProfile.profile || null;
      }
    }
    const footerDefaults = profile
      ? this._normalizeUserProfileRecord(profile)
      : this._getNormalizedUserFooterDefaults();

    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([
        "user_name",
        "user_company",
        "user_name1",
        "user_name2",
        "user_street",
        "user_zip",
        "user_city",
      ]);
      if (res?.ok) {
        const data = res.data || {};
        const userState = this._resolveUserSettingsState({ data, profile });
        const values = {
          user_name: userState.userName,
          user_company: userState.userCompany,
          user_name1: userState.userName1,
          user_name2: userState.userName2,
          user_street: userState.userStreet,
          user_zip: userState.userZip,
          user_city: userState.userCity,
        };
        for (const [key, inp] of inputs.entries()) {
          if (inp) inp.value = String(values[key] ?? "");
        }
      }
    }

    this.inpName = inputs.get("user_name") || null;
    this.inpCompany = inputs.get("user_company") || null;
    this.inpUserName1 = inputs.get("user_name1") || null;
    this.inpUserName2 = inputs.get("user_name2") || null;
    this.inpUserStreet = inputs.get("user_street") || null;
    this.inpUserZip = inputs.get("user_zip") || null;
    this.inpUserCity = inputs.get("user_city") || null;

    this._openSettingsModal({
      title: "Profil / Adresse",
      content: [wrap],
      saveFn: async () => {
        if (typeof api.userProfileUpsert !== "function" || typeof api.appSettingsSetMany !== "function") {
          alert("Settings-API fehlt (IPC noch nicht aktiv).");
          return false;
        }

        const user_name = this._normalizeUserText(inputs.get("user_name")?.value, 80);
        const user_company = this._normalizeUserText(inputs.get("user_company")?.value, 80);
        const user_name1 = this._normalizeUserText(inputs.get("user_name1")?.value, 80);
        const user_name2 = this._normalizeUserText(inputs.get("user_name2")?.value, 80);
        const user_street = this._normalizeUserText(inputs.get("user_street")?.value, 80);
        const user_zip = this._normalizeUserZip(inputs.get("user_zip")?.value, 5);
        const user_city = this._normalizeUserText(inputs.get("user_city")?.value, 80);

        const resProfile = await api.userProfileUpsert({
          name1: user_name1,
          name2: user_name2,
          street: user_street,
          zip: user_zip,
          city: user_city,
        });
        if (!resProfile?.ok) {
          alert(resProfile?.error || "Speichern der Nutzerdaten fehlgeschlagen");
          return false;
        }

        const payload = {
          user_name,
          user_company,
          user_name1,
          user_name2,
          user_street,
          user_zip,
          user_city,
          ...this._buildTouchedPayloadFromValues({
            user_name,
            user_company,
            user_name1,
            user_name2,
            user_street,
            user_zip,
            user_city,
          }),
        };

        const res = await api.appSettingsSetMany(payload);
        if (!res?.ok) {
          alert(res?.error || "Speichern fehlgeschlagen");
          return false;
        }

        this.userName = user_name;
        this.userCompany = user_company;
        if (this.router?.context) {
          this.router.context.settings = {
            ...(this.router.context.settings || {}),
            user_name,
            user_company,
            user_name1,
            user_name2,
            user_street,
            user_zip,
            user_city,
          };
        }
        if (typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new Event("bbm:header-refresh"));
        }
        this._setMsg("Gespeichert");
        return true;
      },
      closeOnly: false,
    });
  }

  async _createDictationAudioContent() {
    const mkScaleGroup = (labelText, buttons) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gap = "6px";
      const lbl = document.createElement("div");
      lbl.textContent = labelText;
      lbl.style.fontWeight = "700";
      lbl.style.fontSize = "12px";
      const btnWrap = document.createElement("div");
      btnWrap.style.display = "flex";
      btnWrap.style.gap = "6px";
      btnWrap.style.flexWrap = "wrap";
      btnWrap.append(...buttons);
      row.append(lbl, btnWrap);
      return row;
    };
    const applyScaleBtnBase = (el) => {
      el.style.padding = "6px 10px";
      el.style.borderRadius = "8px";
      el.style.border = "1px solid rgba(0,0,0,0.18)";
      el.style.fontWeight = "600";
      el.style.cursor = "pointer";
      el.style.minHeight = "30px";
      el.style.boxShadow = "none";
    };
    const setScaleBtnActive = (el, active) => {
      el.style.background = active ? "#1976d2" : "#fff";
      el.style.color = active ? "white" : "#1565c0";
      el.style.borderColor = active ? "rgba(25,118,210,0.65)" : "rgba(0,0,0,0.18)";
    };
    const dictationSection = createDictationDevSection({
      applyPopupCardStyle,
      mkScaleGroup,
      applyScaleBtnBase,
      setScaleBtnActive,
      settingsApi: () => window.bbmDb || {},
    });
    if (typeof dictationSection.load === "function") {
      await dictationSection.load();
    }

    this._openSettingsModal({
      title: "Diktat / Audio",
      content: [dictationSection.tab],
      closeOnly: true,
    });
  }

  async _createOutputPrintContent() {
    const api = window.bbmDb || {};
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";
    wrap.style.minWidth = "min(720px, calc(100vw - 80px))";

    const info = document.createElement("div");
    info.style.fontSize = "12px";
    info.style.opacity = "0.85";
    info.textContent = "Footer, Druckränder, Drucklogos und Ausgabeordner.";
    wrap.append(info);

    const inputs = new Map();
    this._settingsInputs = inputs;

    const renderField = (field) => {
      const row = document.createElement("label");
      row.style.display = "grid";
      row.style.gap = "4px";

      const lbl = document.createElement("span");
      lbl.textContent = field.label || field.key;
      lbl.style.fontSize = "12px";

      let inp;
      if (field.type === "checkbox") {
        inp = document.createElement("input");
        inp.type = "checkbox";
        const box = document.createElement("span");
        box.style.display = "inline-flex";
        box.style.alignItems = "center";
        box.style.gap = "8px";
        box.append(inp, document.createTextNode(field.checkboxLabel || "Aktiv"));
        row.append(lbl, box);
      } else {
        inp = field.multiline ? document.createElement("textarea") : document.createElement("input");
        inp.style.width = "100%";
        if (field.type === "number") {
          const limits = this._normalizePrintLayoutMmLimits(field.key);
          if (limits) {
            inp.type = "number";
            inp.min = String(limits.min);
            inp.max = String(limits.max);
            inp.step = String(limits.step);
            inp.inputMode = "numeric";
          }
        }
        if (inp.tagName === "TEXTAREA") inp.rows = field.rows || 4;
        row.append(lbl, inp);
      }
      inputs.set(field.key, inp);
      return row;
    };

    const footerCard = document.createElement("div");
    applyPopupCardStyle(footerCard);
    footerCard.style.padding = "10px";
    footerCard.style.display = "grid";
    footerCard.style.gap = "8px";
    const footerTitle = document.createElement("div");
    footerTitle.textContent = "Footer / Drucksignatur";
    footerTitle.style.fontWeight = "800";
    footerCard.append(footerTitle);
    const footerHint = document.createElement("div");
    footerHint.textContent = "Fusszeilenangaben und Profil-/Adressbezug.";
    footerHint.style.fontSize = "12px";
    footerHint.style.opacity = "0.78";
    footerCard.append(footerHint);

    const footerFields = [
      { key: "pdf.footerPlace", label: "Ort" },
      { key: "pdf.footerDate", label: "Datum" },
      { key: "pdf.footerName1", label: "Name 1" },
      { key: "pdf.footerName2", label: "Name 2" },
      { key: "pdf.footerRecorder", label: "Protokollfuehrer" },
      { key: "pdf.footerStreet", label: "Strasse" },
      { key: "pdf.footerZip", label: "PLZ" },
      { key: "pdf.footerCity", label: "Ort (Adresse)" },
      { key: "pdf.footerUseUserData", label: "Profil-/Adressdaten im Footer verwenden", type: "checkbox" },
    ];
    for (const field of footerFields) {
      footerCard.append(
        renderField({
          ...field,
          type: field.type || "text",
          checkboxLabel: "Aktiv",
        })
      );
    }

    const storageCard = document.createElement("div");
    applyPopupCardStyle(storageCard);
    storageCard.style.padding = "10px";
    storageCard.style.display = "grid";
    storageCard.style.gap = "8px";
    const storageTitle = document.createElement("div");
    storageTitle.textContent = "Ausgabeordner / Speicherort";
    storageTitle.style.fontWeight = "800";
    storageCard.append(storageTitle);
    const storageHint = document.createElement("div");
    storageHint.textContent = "Ablageordner fuer Protokoll-PDFs und Ausgabe.";
    storageHint.style.fontSize = "12px";
    storageHint.style.opacity = "0.78";
    storageCard.append(storageHint);
    const protocolsDirRow = document.createElement("label");
    protocolsDirRow.style.display = "grid";
    protocolsDirRow.style.gap = "4px";
    const protocolsDirLabel = document.createElement("span");
    protocolsDirLabel.textContent = "Ausgabeordner";
    protocolsDirLabel.style.fontSize = "12px";
    const inpProtocolsDir = document.createElement("input");
    inpProtocolsDir.type = "text";
    inpProtocolsDir.style.width = "100%";
    protocolsDirRow.append(protocolsDirLabel, inpProtocolsDir);
    storageCard.append(protocolsDirRow);
    inputs.set("pdf.protocolsDir", inpProtocolsDir);

    const logosCard = document.createElement("div");
    applyPopupCardStyle(logosCard);
    logosCard.style.padding = "10px";
    logosCard.style.display = "grid";
    logosCard.style.gap = "8px";
    const logosTitle = document.createElement("div");
    logosTitle.textContent = "Drucklogos";
    logosTitle.style.fontWeight = "800";
    logosCard.append(logosTitle);
    const logosHint = document.createElement("div");
    logosHint.textContent = "Drucklogos weiterhin ueber den bestehenden Dialog verwalten.";
    logosHint.style.fontSize = "12px";
    logosHint.style.opacity = "0.78";
    logosCard.append(logosHint);
    const btnLogos = document.createElement("button");
    btnLogos.type = "button";
    btnLogos.textContent = "Drucklogos verwalten";
    applyPopupButtonStyle(btnLogos);
    btnLogos.onclick = async () => {
      await this._openPrintLogosPopup();
    };
    logosCard.append(btnLogos);

    const layoutCard = document.createElement("div");
    applyPopupCardStyle(layoutCard);
    layoutCard.style.padding = "10px";
    layoutCard.style.display = "grid";
    layoutCard.style.gap = "8px";
    const layoutTitle = document.createElement("div");
    layoutTitle.textContent = "Drucklayout";
    layoutTitle.style.fontWeight = "800";
    layoutCard.append(layoutTitle);
    const layoutHint = document.createElement("div");
    layoutHint.textContent = "Seitenraender und Footer-Abstand.";
    layoutHint.style.fontSize = "12px";
    layoutHint.style.opacity = "0.78";
    layoutCard.append(layoutHint);
    const layoutFields = [
      { key: "print.v2.pagePadTopMm", label: "Rand oben (mm)", type: "number" },
      { key: "print.v2.pagePadLeftMm", label: "Rand links (mm)", type: "number" },
      { key: "print.v2.pagePadRightMm", label: "Rand rechts (mm)", type: "number" },
      { key: "print.v2.pagePadBottomMm", label: "Rand unten (mm)", type: "number" },
      { key: "print.v2.footerReserveMm", label: "Footer-Reserve (mm)", type: "number" },
    ];
    for (const field of layoutFields) {
      layoutCard.append(
        renderField({
          ...field,
          type: "number",
        })
      );
    }
    const layoutActions = document.createElement("div");
    layoutActions.style.display = "flex";
    layoutActions.style.gap = "8px";
    layoutActions.style.flexWrap = "wrap";
    const btnResetLayout = document.createElement("button");
    btnResetLayout.type = "button";
    btnResetLayout.textContent = "Standardwerte wiederherstellen";
    applyPopupButtonStyle(btnResetLayout);
    btnResetLayout.onclick = () => {
      this._resetPrintLayoutFields();
    };
    layoutActions.append(btnResetLayout);
    layoutCard.append(layoutActions);

    wrap.append(footerCard, storageCard, logosCard, layoutCard);

    let profile = null;
    if (typeof api.userProfileGet === "function") {
      const resProfile = await api.userProfileGet();
      if (resProfile?.ok) {
        profile = resProfile.profile || null;
      }
    }

    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([
        "pdf.footerPlace",
        "pdf.footerDate",
        "pdf.footerName1",
        "pdf.footerName2",
        "pdf.footerRecorder",
        "pdf.footerStreet",
        "pdf.footerZip",
        "pdf.footerCity",
        "pdf.footerUseUserData",
        "pdf.protocolsDir",
        "print.v2.pagePadTopMm",
        "print.v2.pagePadLeftMm",
        "print.v2.pagePadRightMm",
        "print.v2.pagePadBottomMm",
        "print.v2.footerReserveMm",
      ]);
      if (res?.ok) {
        const data = res.data || {};
        const footerUseUserData = this._parseBool(data["pdf.footerUseUserData"], false);
        for (const [key, inp] of inputs.entries()) {
          if (!inp) continue;
          const value = data[key];
          if (inp.type === "checkbox") {
            inp.checked = this._parseBool(value, false);
          } else if (this._isPrintLayoutMmKey(key)) {
            inp.value = this._normalizePrintLayoutMmValue(value, key);
          } else {
            inp.value = String(value ?? "");
          }
        }
        if (footerUseUserData) {
          this._applyPdfFooterUserDefaultsToInputs(
            {
              name1: inputs.get("pdf.footerName1"),
              name2: inputs.get("pdf.footerName2"),
              street: inputs.get("pdf.footerStreet"),
              zip: inputs.get("pdf.footerZip"),
              city: inputs.get("pdf.footerCity"),
            },
            footerDefaults,
            { overwriteExisting: false }
          );
        }
        if (!String(data["pdf.protocolsDir"] || "").trim()) {
          inputs.get("pdf.protocolsDir").value = this._pdfSettingsDefaults().protocolsDir;
        }
      }
    }

    this.inpPdfFooterPlace = inputs.get("pdf.footerPlace") || null;
    this.inpPdfFooterDate = inputs.get("pdf.footerDate") || null;
    this.inpPdfFooterName1 = inputs.get("pdf.footerName1") || null;
    this.inpPdfFooterName2 = inputs.get("pdf.footerName2") || null;
    this.inpPdfFooterRecorder = inputs.get("pdf.footerRecorder") || null;
    this.inpPdfFooterStreet = inputs.get("pdf.footerStreet") || null;
    this.inpPdfFooterZip = inputs.get("pdf.footerZip") || null;
    this.inpPdfFooterCity = inputs.get("pdf.footerCity") || null;
    this.inpPdfFooterUseUserData = inputs.get("pdf.footerUseUserData") || null;
    this.inpPdfProtocolsDir = inputs.get("pdf.protocolsDir") || null;
    this.btnPdfFooterUseUserData = null;
    this.btnPdfProtocolsBrowse = null;
    this.btnPdfSettingsSave = null;
    this.inpPdfProtocolTitle = null;
    this.inpPdfTrafficLightAll = null;

    this._openSettingsModal({
      title: "Ausgabe & Druck",
      content: [wrap],
      saveFn: async () => {
        if (typeof api.appSettingsSetMany !== "function") return false;

        const footerPlace = this._normalizeUserText(inputs.get("pdf.footerPlace")?.value, 80);
        const footerDate = this._normalizeUserText(inputs.get("pdf.footerDate")?.value, 40);
        const footerName1 = this._normalizeUserText(inputs.get("pdf.footerName1")?.value, 80);
        const footerName2 = this._normalizeUserText(inputs.get("pdf.footerName2")?.value, 80);
        const footerRecorder = this._normalizeUserText(inputs.get("pdf.footerRecorder")?.value, 80);
        const footerStreet = this._normalizeUserText(inputs.get("pdf.footerStreet")?.value, 80);
        const footerZip = this._normalizeUserZip(inputs.get("pdf.footerZip")?.value);
        const footerCity = this._normalizeUserText(inputs.get("pdf.footerCity")?.value, 80);
        const footerUseUserData = this._parseBool(inputs.get("pdf.footerUseUserData")?.checked, false);
        if (footerUseUserData) {
          this._applyPdfFooterUserDefaultsToInputs(
            {
              name1: inputs.get("pdf.footerName1"),
              name2: inputs.get("pdf.footerName2"),
              street: inputs.get("pdf.footerStreet"),
              zip: inputs.get("pdf.footerZip"),
              city: inputs.get("pdf.footerCity"),
            },
            footerDefaults,
            { overwriteExisting: false }
          );
        }
        const protocolsDir = String(inputs.get("pdf.protocolsDir")?.value || "").trim() || this._pdfSettingsDefaults().protocolsDir;
        const layoutValues = {
          "print.v2.pagePadTopMm": this._normalizePrintLayoutMmValue(inputs.get("print.v2.pagePadTopMm")?.value, "print.v2.pagePadTopMm"),
          "print.v2.pagePadLeftMm": this._normalizePrintLayoutMmValue(inputs.get("print.v2.pagePadLeftMm")?.value, "print.v2.pagePadLeftMm"),
          "print.v2.pagePadRightMm": this._normalizePrintLayoutMmValue(inputs.get("print.v2.pagePadRightMm")?.value, "print.v2.pagePadRightMm"),
          "print.v2.pagePadBottomMm": this._normalizePrintLayoutMmValue(inputs.get("print.v2.pagePadBottomMm")?.value, "print.v2.pagePadBottomMm"),
          "print.v2.footerReserveMm": this._normalizePrintLayoutMmValue(inputs.get("print.v2.footerReserveMm")?.value, "print.v2.footerReserveMm"),
        };

        const payload = {
          "pdf.footerPlace": footerPlace,
          "pdf.footerDate": footerDate,
          "pdf.footerName1": footerName1,
          "pdf.footerName2": footerName2,
          "pdf.footerRecorder": footerRecorder,
          "pdf.footerStreet": footerStreet,
          "pdf.footerZip": footerZip,
          "pdf.footerCity": footerCity,
          "pdf.footerUseUserData": footerUseUserData ? "true" : "false",
          "pdf.protocolsDir": protocolsDir,
          ...layoutValues,
          ...this._buildTouchedPayloadFromValues({
            "pdf.footerPlace": footerPlace,
            "pdf.footerDate": footerDate,
            "pdf.footerName1": footerName1,
            "pdf.footerName2": footerName2,
            "pdf.footerRecorder": footerRecorder,
            "pdf.footerStreet": footerStreet,
            "pdf.footerZip": footerZip,
            "pdf.footerCity": footerCity,
            "pdf.protocolsDir": protocolsDir,
            ...layoutValues,
          }),
          ...this._buildTouchedPayloadForKeys(["pdf.footerUseUserData"]),
        };

        const res = await api.appSettingsSetMany(payload);
        if (!res?.ok) {
          alert(res?.error || "Speichern fehlgeschlagen");
          return false;
        }

        if (this.router?.context) {
          this.router.context.settings = {
            ...(this.router.context.settings || {}),
            ...payload,
          };
        }
        this._setMsg("Gespeichert");
        return true;
      },
      closeOnly: false,
    });
  }

  async _createProtocolContent() {
    const api = window.bbmDb || {};
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";
    wrap.style.minWidth = "min(620px, calc(100vw - 80px))";

    const info = document.createElement("div");
    info.style.fontSize = "12px";
    info.style.opacity = "0.85";
    info.textContent = "Protokollspezifische Einstellungen.";
    wrap.append(info);

    const inputs = new Map();
    this._settingsInputs = inputs;

    const renderField = (field) => {
      const row = document.createElement("label");
      row.style.display = "grid";
      row.style.gap = "4px";

      const lbl = document.createElement("span");
      lbl.textContent = field.label || field.key;
      lbl.style.fontSize = "12px";

      let inp;
      if (field.type === "checkbox") {
        inp = document.createElement("input");
        inp.type = "checkbox";
        const box = document.createElement("span");
        box.style.display = "inline-flex";
        box.style.alignItems = "center";
        box.style.gap = "8px";
        box.append(inp, document.createTextNode(field.checkboxLabel || "Aktiv"));
        row.append(lbl, box);
      } else {
        inp = field.multiline ? document.createElement("textarea") : document.createElement("input");
        inp.style.width = "100%";
        if (inp.tagName === "TEXTAREA") inp.rows = field.rows || 5;
        row.append(lbl, inp);
      }
      inputs.set(field.key, inp);
      return row;
    };

    const titleCard = document.createElement("div");
    applyPopupCardStyle(titleCard);
    titleCard.style.padding = "10px";
    titleCard.style.display = "grid";
    titleCard.style.gap = "8px";
    const titleHeading = document.createElement("div");
    titleHeading.textContent = "Protokollbezeichnung / Protokolltitel";
    titleHeading.style.fontWeight = "800";
    titleCard.append(titleHeading);
    const titleHint = document.createElement("div");
    titleHint.textContent = "Protokolltitel und sichtbare Bezeichnung.";
    titleHint.style.fontSize = "12px";
    titleHint.style.opacity = "0.78";
    titleCard.append(titleHint);
    titleCard.append(
      renderField({
        key: "pdf.protocolTitle",
        label: "Protokolltitel",
      })
    );

    const remarksCard = document.createElement("div");
    applyPopupCardStyle(remarksCard);
    remarksCard.style.padding = "10px";
    remarksCard.style.display = "grid";
    remarksCard.style.gap = "8px";
    const remarksHeading = document.createElement("div");
    remarksHeading.textContent = "Vorbemerkung";
    remarksHeading.style.fontWeight = "800";
    remarksCard.append(remarksHeading);
    const remarksHint = document.createElement("div");
    remarksHint.textContent = "Hinweistext fuer das Protokoll und die optionale Ausgabe.";
    remarksHint.style.fontSize = "12px";
    remarksHint.style.opacity = "0.78";
    remarksCard.append(remarksHint);
    remarksCard.append(
      renderField({
        key: "pdf.preRemarks",
        label: "Vorbemerkung",
        multiline: true,
        rows: 5,
      })
    );
    remarksCard.append(
      renderField({
        key: "print.preRemarks.enabled",
        label: "Vorbemerkung in der Ausgabe drucken",
        type: "checkbox",
        checkboxLabel: "Aktiv",
      })
    );

    wrap.append(titleCard, remarksCard);

    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany(["pdf.protocolTitle", "pdf.preRemarks", "print.preRemarks.enabled"]);
      if (res?.ok) {
        const data = res.data || {};
        for (const [key, inp] of inputs.entries()) {
          if (!inp) continue;
          const value = data[key];
          if (inp.type === "checkbox") {
            inp.checked = this._parseBool(value, false);
          } else if (key === "pdf.preRemarks") {
            inp.value = this._normalizePdfPreRemarks(value);
          } else {
            inp.value = String(value ?? "");
          }
        }
      }
    }

    this.inpPdfProtocolTitle = inputs.get("pdf.protocolTitle") || null;
    this.inpPdfTrafficLightAll = null;
    this.inpPdfProtocolsDir = null;
    this.inpPdfFooterPlace = null;
    this.inpPdfFooterDate = null;
    this.inpPdfFooterName1 = null;
    this.inpPdfFooterName2 = null;
    this.inpPdfFooterRecorder = null;
    this.inpPdfFooterStreet = null;
    this.inpPdfFooterZip = null;
    this.inpPdfFooterCity = null;
    this.inpPdfFooterUseUserData = null;
    this.btnPdfFooterUseUserData = null;
    this.btnPdfProtocolsBrowse = null;
    this.btnPdfSettingsSave = null;
    this.pdfPreRemarks = this._normalizePdfPreRemarks(inputs.get("pdf.preRemarks")?.value || "");
    this.pdfPreRemarksEnabled = this._parseBool(inputs.get("print.preRemarks.enabled")?.checked, false);

    this._openSettingsModal({
      title: "Protokoll",
      content: [wrap],
      saveFn: async () => {
        if (typeof api.appSettingsSetMany !== "function") return false;

        const protocolTitle = this._normalizeUserText(inputs.get("pdf.protocolTitle")?.value, 80);
        const preRemarks = this._normalizePdfPreRemarks(inputs.get("pdf.preRemarks")?.value);
        const preRemarksEnabled = this._parseBool(inputs.get("print.preRemarks.enabled")?.checked, false);

        const payload = {
          "pdf.protocolTitle": protocolTitle,
          "pdf.preRemarks": preRemarks,
          "print.preRemarks.enabled": preRemarksEnabled ? "true" : "false",
          ...this._buildTouchedPayloadFromValues({
            "pdf.protocolTitle": protocolTitle,
            "pdf.preRemarks": preRemarks,
          }),
          ...this._buildTouchedPayloadForKeys(["print.preRemarks.enabled"]),
        };

        const res = await api.appSettingsSetMany(payload);
        if (!res?.ok) {
          alert(res?.error || "Speichern fehlgeschlagen");
          return false;
        }

        this.pdfPreRemarks = preRemarks;
        this.pdfPreRemarksEnabled = preRemarksEnabled;
        if (this.router?.context) {
          this.router.context.settings = {
            ...(this.router.context.settings || {}),
            "pdf.protocolTitle": protocolTitle,
            "pdf.preRemarks": preRemarks,
            "print.preRemarks.enabled": preRemarksEnabled ? "true" : "false",
          };
        }
        this._setMsg("Gespeichert");
        return true;
      },
      closeOnly: false,
    });
  }

  _createLicenseSettingsContent() {
    const api = window.bbmDb || {};
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";
    wrap.style.minWidth = "min(560px, calc(100vw - 80px))";
    wrap.style.maxWidth = "700px";

    const card = document.createElement("div");
    applyPopupCardStyle(card);
    card.style.padding = "10px";
    card.style.display = "grid";
    card.style.gap = "8px";

    const title = document.createElement("div");
    title.textContent = "Lizenzstatus";
    title.style.fontWeight = "800";
    title.style.fontSize = "14px";

    const note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.lineHeight = "1.45";
    note.textContent =
      "Lizenzstatus wird hier nur angezeigt. Lizenzverwaltung und Generator sind in die externe Lizenz-App ausgelagert.";

    const status = document.createElement("div");
    status.style.padding = "8px 10px";
    status.style.border = "1px solid rgba(0,0,0,0.08)";
    status.style.borderRadius = "8px";
    status.style.background = "#f8fafc";
    status.style.fontSize = "12px";
    status.style.whiteSpace = "pre-line";
    status.textContent = "Lizenzstatus wird geladen ...";

    const btnReload = document.createElement("button");
    btnReload.type = "button";
    btnReload.textContent = "Status aktualisieren";
    applyPopupButtonStyle(btnReload);

    const renderStatus = (res, fallbackError = "") => {
      const valid = !!res?.valid;
      const reason = String(res?.reason || "").trim();
      const licenseId = String(res?.licenseId || "").trim() || "-";
      const customer = String(res?.customerName || "").trim() || "-";
      const machineId = String(res?.machineId || "").trim() || "-";
      const validUntil = this._formatLicenseDate(res?.validUntil);
      const reasonText = this._formatLicenseReason(reason, fallbackError);
      const warningText = this._formatLicenseWarning(res, fallbackError);

      status.textContent = valid
        ? `Gueltig fuer: ${customer}\nLizenz-ID: ${licenseId}\nMachine-ID: ${machineId}\nGueltig bis: ${validUntil}\nHinweis: ${warningText}`
        : `Ungueltig\nGrund: ${reasonText}\nLizenz-ID: ${licenseId}\nMachine-ID: ${machineId}`;
    };

    const loadStatus = async () => {
      if (typeof api.licenseGetStatus !== "function") {
        renderStatus({ valid: false, reason: "INVALID_FORMAT" }, "Lizenz-IPC ist nicht verfuegbar.");
        return;
      }
      try {
        const res = await api.licenseGetStatus();
        if (!res?.ok) {
          renderStatus(res || {}, res?.error || "Lizenzstatus konnte nicht geladen werden.");
          return;
        }
        renderStatus(res || {});
      } catch (e) {
        renderStatus({}, e?.message || "Lizenzstatus konnte nicht geladen werden.");
      }
    };

    btnReload.addEventListener("click", loadStatus);
    card.append(title, note, status, btnReload);
    wrap.append(card);

    void loadStatus();
    return wrap;
  }


  async _openPrintLogosPopup() {
    const api = window.bbmDb || {};
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";
    wrap.style.minWidth = "min(860px, calc(100vw - 80px))";
    wrap.style.maxWidth = "1020px";

    const mkRow = (labelText, valueNode) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "160px 1fr";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      const label = document.createElement("div");
      label.textContent = labelText;
      label.style.fontWeight = "700";
      label.style.fontSize = "12px";
      label.style.color = "#334155";
      const value = valueNode instanceof HTMLElement ? valueNode : document.createElement("div");
      if (!(valueNode instanceof HTMLElement)) value.textContent = String(valueNode ?? "-");
      value.style.minWidth = "0";
      value.style.fontSize = "12px";
      value.style.wordBreak = "break-word";
      row.append(label, value);
      return row;
    };

    const headerCard = document.createElement("div");
    applyPopupCardStyle(headerCard);
    headerCard.style.padding = "10px";
    headerCard.style.display = "grid";
    headerCard.style.gap = "8px";
    const headerTitle = document.createElement("div");
    headerTitle.textContent = "Header";
    headerTitle.style.fontWeight = "800";
    const inpPrintHeaderAdaptive = document.createElement("input");
    inpPrintHeaderAdaptive.type = "checkbox";
    const headerRow = document.createElement("label");
    headerRow.style.display = "inline-flex";
    headerRow.style.alignItems = "center";
    headerRow.style.gap = "8px";
    headerRow.append(inpPrintHeaderAdaptive, document.createTextNode("Header-Adaptive aktiv"));
    headerCard.append(headerTitle, headerRow);
    wrap.append(headerCard);

    const enabledInputs = [null, null, null];
    const fileInputs = [null, null, null];
    const previewImgs = [null, null, null];
    const previewFrames = [null, null, null];
    const placeholderEls = [null, null, null];
    const removeBtns = [null, null, null];
    const sizeSelects = [null, null, null];
    const alignChecks = [null, null, null];
    const vAlignChecks = [null, null, null];

    const mkRadioGroup = (name, values, selected) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.gap = "8px";
      const refs = {};
      for (const [value, label] of values) {
        const lab = document.createElement("label");
        lab.style.display = "inline-flex";
        lab.style.alignItems = "center";
        lab.style.gap = "4px";
        lab.style.cursor = "pointer";
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = name;
        inp.value = value;
        inp.checked = value === selected;
        const txt = document.createElement("span");
        txt.textContent = label;
        lab.append(inp, txt);
        row.append(lab);
        refs[value] = inp;
      }
      return { row, refs };
    };

    const mkSlotCard = (idx) => {
      const card = document.createElement("div");
      applyPopupCardStyle(card);
      card.style.padding = "10px";
      card.style.display = "grid";
      card.style.gap = "8px";

      const title = document.createElement("div");
      title.textContent = `Drucklogo ${idx + 1}`;
      title.style.fontWeight = "800";

      const enabled = document.createElement("input");
      enabled.type = "checkbox";
      enabledInputs[idx] = enabled;
      const enabledRow = document.createElement("label");
      enabledRow.style.display = "inline-flex";
      enabledRow.style.alignItems = "center";
      enabledRow.style.gap = "8px";
      enabledRow.style.cursor = "pointer";
      enabledRow.append(enabled, document.createTextNode("Logo verwenden"));

      const file = document.createElement("input");
      file.type = "file";
      file.accept = "image/*";
      fileInputs[idx] = file;

      const frame = document.createElement("div");
      frame.style.display = "flex";
      frame.style.justifyContent = "center";
      frame.style.alignItems = "center";
      frame.style.minHeight = "110px";
      frame.style.border = "1px dashed rgba(0,0,0,0.15)";
      frame.style.borderRadius = "8px";
      frame.style.background = "#f8fafc";
      previewFrames[idx] = frame;

      const placeholder = document.createElement("div");
      placeholder.textContent = "Kein Logo gewählt";
      placeholder.style.fontSize = "12px";
      placeholder.style.opacity = "0.75";
      placeholderEls[idx] = placeholder;

      const img = document.createElement("img");
      img.alt = `Logo ${idx + 1}`;
      img.style.display = "none";
      img.style.maxWidth = "100%";
      img.style.objectFit = "contain";
      previewImgs[idx] = img;
      frame.append(placeholder, img);

      const size = document.createElement("select");
      for (const [value, label] of [["small", "Klein"], ["medium", "Mittel"], ["large", "Gross"]]) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        size.append(opt);
      }
      sizeSelects[idx] = size;

      const align = mkRadioGroup(`printLogoAlign_${idx}`, [["left", "Links"], ["center", "Mitte"], ["right", "Rechts"]], "center");
      alignChecks[idx] = align.refs;
      const vAlign = mkRadioGroup(`printLogoVAlign_${idx}`, [["top", "Oben"], ["middle", "Mitte"], ["bottom", "Unten"]], "bottom");
      vAlignChecks[idx] = vAlign.refs;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Logo entfernen";
      applyPopupButtonStyle(removeBtn);
      removeBtns[idx] = removeBtn;
      removeBtn.onclick = () => {
        if (file) file.value = "";
        if (img) {
          img.src = "";
          img.style.display = "none";
        }
        if (placeholder) placeholder.style.display = "flex";
        if (enabled) enabled.checked = false;
        this._schedulePrintLogoSave();
      };

      enabled.addEventListener("change", () => this._schedulePrintLogoSave());
      file.addEventListener("change", async () => {
        await this._handlePrintLogoFileInput(idx);
      });
      size.addEventListener("change", () => this._schedulePrintLogoSave());
      align.row.querySelectorAll("input").forEach((inp) => inp.addEventListener("change", () => this._schedulePrintLogoSave()));
      vAlign.row.querySelectorAll("input").forEach((inp) => inp.addEventListener("change", () => this._schedulePrintLogoSave()));

      card.append(
        title,
        enabledRow,
        file,
        frame,
        mkRow("Größe in mm", size),
        mkRow("Position horizontal", align.row),
        mkRow("Position vertikal", vAlign.row),
        removeBtn
      );
      return card;
    };

    for (let i = 0; i < 3; i++) {
      wrap.append(mkSlotCard(i));
    }

    this.inpPrintHeaderAdaptive = inpPrintHeaderAdaptive;
    this.printLogoEnabledInputs = enabledInputs;
    this.printLogoFileInputs = fileInputs;
    this.printLogoPreviewImgs = previewImgs;
    this.printLogoPreviewFrames = previewFrames;
    this.printLogoPlaceholderEls = placeholderEls;
    this.printLogoRemoveBtns = removeBtns;
    this.printLogoSizeSelects = sizeSelects;
    this.printLogoAlignChecks = alignChecks;
    this.printLogoVAlignChecks = vAlignChecks;

    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([
        "print.logo1.enabled",
        "print.logo1.size",
        "print.logo1.align",
        "print.logo1.vAlign",
        "print.logo1.pngDataUrl",
        "print.logo2.enabled",
        "print.logo2.size",
        "print.logo2.align",
        "print.logo2.vAlign",
        "print.logo2.pngDataUrl",
        "print.logo3.enabled",
        "print.logo3.size",
        "print.logo3.align",
        "print.logo3.vAlign",
        "print.logo3.pngDataUrl",
        "print.logoSizePreset",
        "print.v2.globalHeaderAdaptive",
      ]);
      if (res?.ok) this._applyPrintLogoInputsFromSettings(res.data || {});
    }

    this._openSettingsModal({
      title: "Drucklogos verwalten",
      content: [wrap],
      saveFn: async () => (await this._savePrintLogoSettings()) !== false,
      closeOnly: false,
    });
  }


  async _openDevelopmentModal() {
    const api = window.bbmDb || {};
    const has = (name) => typeof api?.[name] === "function";
    const clampInt = (val, min, max, fallback) => {
      const n = Math.floor(Number(val));
      if (!Number.isFinite(n) || n <= 0) return fallback;
      return Math.max(min, Math.min(max, n));
    };
    const mkRow = (labelText, valueNode) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "160px 1fr";
      row.style.gap = "8px";
      row.style.alignItems = "center";

      const label = document.createElement("div");
      label.textContent = labelText;
      label.style.fontWeight = "700";
      label.style.fontSize = "12px";
      label.style.color = "#334155";

      const value =
        valueNode instanceof HTMLElement ? valueNode : document.createElement("div");
      if (!(valueNode instanceof HTMLElement)) {
        value.textContent = String(valueNode ?? "-");
      }
      value.style.minWidth = "0";
      value.style.fontSize = "12px";
      value.style.wordBreak = "break-word";

      row.append(label, value);
      return row;
    };
    const mkCard = (titleText, hintText = "") => {
      const box = document.createElement("div");
      applyPopupCardStyle(box);
      box.style.padding = "8px 10px";
      box.style.marginTop = "0";
      box.style.display = "grid";
      box.style.gap = "8px";
      const title = document.createElement("div");
      title.textContent = titleText;
      title.style.fontWeight = "800";
      const hint = document.createElement("div");
      hint.textContent = hintText;
      hint.style.fontSize = "12px";
      hint.style.opacity = "0.75";
      box.append(title, hint);
      return { box, title, hint };
    };

    const section = document.createElement("div");
    section.style.display = "grid";
    section.style.gap = "10px";
    section.style.minWidth = "min(760px, calc(100vw - 80px))";
    section.style.maxWidth = "920px";

    const versionCard = mkCard("Versionierung", "SemVer und Build-Kanal verwalten.");
    const dbCard = mkCard("DB-Diagnose", "Aktive DB, Legacy und Importpfade prüfen.");
    const topsCard = mkCard("Textgrenzen für TOPs", "Maximale Länge für Kurztext und Langtext in TOPs.");
    const themeCard = mkCard("Farbschema", "Start-Defaults des Themes verwalten.");

    const btn = (label, primary = false) => {
      const el = document.createElement("button");
      el.type = "button";
      el.textContent = label;
      applyPopupButtonStyle(el, primary ? { variant: "primary" } : undefined);
      return el;
    };

    const TOPS_TITLE_KEY = "tops.titleMax";
    const TOPS_LONG_KEY = "tops.longMax";

    let versionRepoCurrent = "";
    const versionAppValue = document.createElement("div");
    versionAppValue.textContent = "-";
    versionAppValue.style.fontWeight = "700";
    const versionRepoValue = document.createElement("div");
    versionRepoValue.textContent = "-";
    versionRepoValue.style.fontWeight = "700";
    const buildChannelValue = document.createElement("div");
    buildChannelValue.textContent = "-";
    buildChannelValue.style.fontSize = "12px";
    buildChannelValue.style.opacity = "0.85";
    const releaseType = document.createElement("select");
    for (const [v, l] of [["patch", "Patch"], ["minor", "Minor"], ["major", "Major"]]) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = l;
      releaseType.append(opt);
    }
    const nextVersionValue = document.createElement("div");
    nextVersionValue.textContent = "-";
    nextVersionValue.style.fontWeight = "700";
    const versionStatus = document.createElement("div");
    versionStatus.style.fontSize = "12px";
    versionStatus.style.minHeight = "16px";
    versionStatus.style.color = "#4b5563";

    const parseSemver = (raw) => {
      const m = String(raw || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
      return m ? { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) } : { major: 0, minor: 0, patch: 0 };
    };
    const updateVersionPreview = () => {
      const cur = parseSemver(versionRepoCurrent || "0.0.0");
      const next = { ...cur };
      if (releaseType.value === "major") {
        next.major += 1; next.minor = 0; next.patch = 0;
      } else if (releaseType.value === "minor") {
        next.minor += 1; next.patch = 0;
      } else {
        next.patch += 1;
      }
      nextVersionValue.textContent = `${next.major}.${next.minor}.${next.patch}`;
    };
    const loadBuildChannel = async () => {
      if (!has("devBuildChannelGet")) return;
      const res = await api.devBuildChannelGet();
      if (res?.ok) {
        buildChannelValue.textContent = `Build-Kanal: ${String(res.channel || "stable").toUpperCase()}`;
      }
    };
    const loadVersioningData = async () => {
      if (!has("devVersionGet")) {
        versionStatus.textContent = "Versionierung ist nicht verfuegbar.";
        return;
      }
      const res = await api.devVersionGet();
      if (!res?.ok) {
        versionStatus.textContent = res?.error || "Versionen konnten nicht geladen werden.";
        return;
      }
      versionRepoCurrent = String(res.repoVersion || "").trim();
      versionAppValue.textContent = String(res.appVersion || "-");
      versionRepoValue.textContent = versionRepoCurrent || "-";
      buildChannelValue.textContent = "";
      await loadBuildChannel();
      updateVersionPreview();
      versionStatus.textContent = "";
    };
    const bumpBtn = btn("Version hochschalten", true);
    bumpBtn.onclick = async () => {
      if (!has("devVersionBump")) return;
      const res = await api.devVersionBump({ kind: releaseType.value });
      if (!res?.ok) {
        versionStatus.textContent = res?.error || "Version konnte nicht hochgeschaltet werden.";
        return;
      }
      await loadVersioningData();
      versionStatus.textContent = `Repo-Version auf ${res.repoVersion} aktualisiert.`;
    };
    const set100Btn = btn("Auf 1.0.0 setzen");
    set100Btn.style.display = "none";
    set100Btn.onclick = async () => {
      if (!has("devVersionSet")) return;
      const res = await api.devVersionSet({ version: "1.0.0" });
      if (!res?.ok) {
        versionStatus.textContent = res?.error || "Version 1.0.0 konnte nicht gesetzt werden.";
        return;
      }
      await loadVersioningData();
      versionStatus.textContent = "Repo-Version auf 1.0.0 gesetzt.";
    };
    versionCard.box.append(
      mkRow("Aktuelle App-Version", versionAppValue),
      mkRow("Repo-Version", versionRepoValue),
      mkRow("Build-Kanal", buildChannelValue),
      mkRow("Release-Typ", releaseType),
      mkRow("Naechste Version", nextVersionValue),
      (() => { const row = document.createElement("div"); row.style.display = "flex"; row.style.gap = "8px"; row.append(bumpBtn, set100Btn); return row; })(),
      versionStatus
    );

    const dbText = document.createElement("pre");
    dbText.style.margin = "0";
    dbText.style.padding = "8px";
    dbText.style.borderRadius = "8px";
    dbText.style.background = "#f8fafc";
    dbText.style.border = "1px solid rgba(0,0,0,0.08)";
    dbText.style.fontSize = "10px";
    dbText.style.whiteSpace = "pre-wrap";
    dbText.textContent = "Diagnosedaten werden geladen ...";
    const dbActions = document.createElement("div");
    dbActions.style.display = "flex";
    dbActions.style.gap = "8px";
    dbActions.style.flexWrap = "wrap";
    const btnDbReload = btn("Diagnose aktualisieren");
    const btnDbOpenActive = btn("Aktiven Pfad öffnen");
    const btnDbOpenLegacy = btn("Legacy-Pfad öffnen");
    const btnDbImport = btn("Legacy-Import");
    const loadDbDiagnostics = async () => {
      if (!has("dbDiagnosticsGet")) {
        dbText.textContent = "DB-Diagnose-API fehlt.";
        return;
      }
      const res = await api.dbDiagnosticsGet();
      if (!res?.ok) {
        dbText.textContent = res?.error || "DB-Diagnose fehlgeschlagen.";
        return;
      }
      const d = res.data || {};
      const fmt = (s = {}) => `${s.exists ? "ja" : "nein"}, ${Number(s.size || 0)} Bytes`;
      dbText.textContent = [
        `[db] using ${d.dbPath || "-"}`,
        `[db] backup ${d.backupPath || "-"} (${fmt(d.backup)})`,
        `[db] legacy ${d.legacyDbPath || "-"} (${fmt(d.legacy)})`,
        `[db] legacy-import ${d.legacyImportPath || "-"} (${fmt(d.legacyImport)})`,
        `[db] legacy-available ${d.legacyAvailable ? "ja" : "nein"}`,
        `[db] active-likely-empty ${d.activeLikelyEmpty ? "ja" : "nein"}`,
      ].join("\n");
      return d;
    };
    let lastDbDiag = null;
    btnDbReload.onclick = async () => { lastDbDiag = await loadDbDiagnostics(); };
    btnDbOpenActive.onclick = async () => {
      if (!has("dbOpenFolder")) return;
      const res = await api.dbOpenFolder({ kind: "active" });
      if (!res?.ok) alert(res?.error || "Aktiven DB-Pfad konnte nicht geoeffnet werden.");
    };
    btnDbOpenLegacy.onclick = async () => {
      if (!has("dbOpenFolder")) return;
      if (!lastDbDiag?.legacyAvailable) {
        alert("Keine Legacy-Datei verfuegbar.");
        return;
      }
      const res = await api.dbOpenFolder({ kind: "legacyImport" });
      if (!res?.ok) alert(res?.error || "Legacy-Import-Pfad konnte nicht geoeffnet werden.");
    };
    btnDbImport.onclick = async () => {
      if (!has("dbLegacyImport")) return;
      if (!window.confirm("Legacy-Datenbank wirklich uebernehmen? Die aktive DB wird vorher gesichert.")) return;
      const res = await api.dbLegacyImport();
      if (!res?.ok) {
        alert(res?.error || "Legacy-Import fehlgeschlagen.");
        return;
      }
      if (this.router?.ensureAppSettingsLoaded) await this.router.ensureAppSettingsLoaded({ force: true });
      await this._reload();
      window.dispatchEvent(new Event("bbm:header-refresh"));
      await loadDbDiagnostics();
    };
    dbActions.append(btnDbReload, btnDbOpenActive, btnDbOpenLegacy, btnDbImport);
    dbCard.box.append(dbText, dbActions);

    const topsTitle = document.createElement("input");
    topsTitle.type = "number";
    topsTitle.min = "1";
    topsTitle.step = "1";
    topsTitle.style.width = "100%";
    const topsLong = document.createElement("input");
    topsLong.type = "number";
    topsLong.min = "1";
    topsLong.step = "1";
    topsLong.style.width = "100%";
    const topsMsg = document.createElement("div");
    topsMsg.style.fontSize = "12px";
    topsMsg.style.opacity = "0.75";
    let topsTimer = null;
    const setTopsMsg = (txt) => {
      topsMsg.textContent = txt || "";
      if (topsTimer) clearTimeout(topsTimer);
      if (txt) topsTimer = setTimeout(() => (topsMsg.textContent = ""), 900);
    };
    const loadTopLimitSettings = async () => {
      if (!has("appSettingsGetMany")) return;
      const res = await api.appSettingsGetMany([TOPS_TITLE_KEY, TOPS_LONG_KEY]);
      if (!res?.ok) return;
      const data = res.data || {};
      topsTitle.value = String(clampInt(data[TOPS_TITLE_KEY], 1, 5000, 100));
      topsLong.value = String(clampInt(data[TOPS_LONG_KEY], 1, 20000, 500));
    };
    const saveTopLimitSettings = async () => {
      if (!has("appSettingsSetMany")) return false;
      const res = await api.appSettingsSetMany({
        [TOPS_TITLE_KEY]: String(clampInt(topsTitle.value, 1, 5000, 100)),
        [TOPS_LONG_KEY]: String(clampInt(topsLong.value, 1, 20000, 500)),
      });
      if (!res?.ok) {
        setTopsMsg(res?.error || "Speichern fehlgeschlagen");
        return false;
      }
      setTopsMsg("Gespeichert");
      window.dispatchEvent(new Event("bbm:tops-limits-changed"));
      return true;
    };
    topsTitle.addEventListener("change", () => saveTopLimitSettings());
    topsLong.addEventListener("change", () => saveTopLimitSettings());
    topsCard.box.append(mkRow("Kurztext max", topsTitle), mkRow("Langtext max", topsLong), topsMsg);

    const themeInfo = document.createElement("div");
    themeInfo.style.fontSize = "12px";
    themeInfo.style.opacity = "0.8";
    themeInfo.textContent = "Start-Defaults fuer das Theme pflegen oder auf den User anwenden.";
    const themeActions = document.createElement("div");
    themeActions.style.display = "flex";
    themeActions.style.gap = "8px";
    themeActions.style.flexWrap = "wrap";
    const btnThemeLoad = btn("Start-Defaults laden");
    const btnThemeSave = btn("Start-Defaults speichern");
    const btnThemeApply = btn("Auf User anwenden");
    btnThemeLoad.onclick = async () => { await this._loadThemeStartDefaults(); };
    btnThemeSave.onclick = async () => { await this._saveThemeStartDefaults(); };
    btnThemeApply.onclick = async () => { await this._applyThemeStartDefaultsToUser(); };
    themeActions.append(btnThemeLoad, btnThemeSave, btnThemeApply);
    themeCard.box.append(themeInfo, themeActions);

    const mkScaleGroup = (labelText, buttons) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gap = "6px";
      const lbl = document.createElement("div");
      lbl.textContent = labelText;
      lbl.style.fontWeight = "700";
      lbl.style.fontSize = "12px";
      const btnWrap = document.createElement("div");
      btnWrap.style.display = "flex";
      btnWrap.style.gap = "6px";
      btnWrap.style.flexWrap = "wrap";
      btnWrap.append(...buttons);
      row.append(lbl, btnWrap);
      return row;
    };
    const applyScaleBtnBase = (el) => {
      el.style.padding = "6px 10px";
      el.style.borderRadius = "8px";
      el.style.border = "1px solid rgba(0,0,0,0.18)";
      el.style.fontWeight = "600";
      el.style.cursor = "pointer";
      el.style.minHeight = "30px";
      el.style.boxShadow = "none";
    };
    const setScaleBtnActive = (el, active) => {
      el.style.background = active ? "#1976d2" : "#fff";
      el.style.color = active ? "white" : "#1565c0";
      el.style.borderColor = active ? "rgba(25,118,210,0.65)" : "rgba(0,0,0,0.18)";
    };
    const tabs = [
      { key: "version", label: "Versionierung", el: versionCard.box },
      { key: "db", label: "DB-Diagnose", el: dbCard.box },
      { key: "tops", label: "Protokoll-Textgrenzen", el: topsCard.box },
      { key: "theme", label: "Farbschema", el: themeCard.box },
    ];
    const tabHead = document.createElement("div");
    tabHead.style.display = "flex";
    tabHead.style.gap = "8px";
    tabHead.style.flexWrap = "wrap";
    tabHead.style.rowGap = "8px";
    tabHead.style.marginBottom = "8px";
    const tabBody = document.createElement("div");
    tabBody.style.display = "grid";
    tabBody.style.gap = "10px";
    const tabButtons = new Map();
    const setTab = (key) => {
      for (const tab of tabs) {
        const active = tab.key === key;
        tab.el.style.display = active ? "grid" : "none";
        const b = tabButtons.get(tab.key);
        if (b) {
          b.disabled = active;
          b.style.opacity = active ? "0.85" : "1";
        }
      }
    };
    const addTabBtn = (label, key) => {
      const b = btn(label);
      b.onclick = () => setTab(key);
      tabButtons.set(key, b);
      return b;
    };
    tabHead.append(
      addTabBtn("Versionierung", "version"),
      addTabBtn("DB-Diagnose", "db"),
      addTabBtn("Protokoll-Textgrenzen", "tops"),
      addTabBtn("Farbschema", "theme")
    );
    tabBody.append(...tabs.map((t) => t.el));
    section.append(tabHead, tabBody);

    await loadVersioningData();
    await loadDbDiagnostics();
    await loadTopLimitSettings();
    setTab("version");

    this._openSettingsModal({
      title: "Entwicklung",
      content: [section],
      closeOnly: true,
    });
  }

  async load() {
    await this._reload();
  }

  dispose() {
    if (this.settingsModalOverlayEl) {
      try {
        this.settingsModalOverlayEl.remove();
      } catch {
        // ignore
      }
    }
    this._settingsModalOpen = false;
    this._settingsModalSaveFn = null;
    this._settingsModalCloseOnly = false;
    this._unlockBodyScroll();
  }

  render() {
    if (this.settingsModalOverlayEl) {
      try {
        this.settingsModalOverlayEl.remove();
      } catch {
        // ignore
      }
    }

    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "12px";
    root.style.maxWidth = "980px";
    root.style.width = "100%";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.gap = "10px";
    head.style.flexWrap = "wrap";

    const title = document.createElement("h2");
    title.textContent = "Einstellungen";
    title.style.margin = "0";

    const msg = document.createElement("div");
    msg.style.marginLeft = "auto";
    msg.style.fontSize = "12px";
    msg.style.opacity = "0.85";
    this.msgEl = msg;

    head.append(title, msg);

    const tiles = document.createElement("div");
    tiles.style.display = "grid";
    tiles.style.gridTemplateColumns = "1fr";
    tiles.style.gap = "12px";
    tiles.style.maxWidth = "820px";

    const mkTile = ({ titleText, subText, onClick }) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.style.textAlign = "left";
      tile.style.border = "1px solid #d8dee6";
      tile.style.borderRadius = "14px";
      tile.style.background = "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
      tile.style.boxShadow = "0 1px 1px rgba(15, 23, 42, 0.03)";
      tile.style.padding = "12px 14px";
      tile.style.cursor = "pointer";
      tile.style.userSelect = "none";
      tile.style.display = "flex";
      tile.style.flexDirection = "column";
      tile.style.alignItems = "flex-start";
      tile.style.gap = "4px";
      tile.style.minHeight = "0";
      tile.style.transition = "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease";

      const t = document.createElement("div");
      t.textContent = titleText;
      t.style.fontWeight = "800";
      t.style.fontSize = "14px";
      t.style.letterSpacing = "0.01em";
      t.style.marginBottom = "0";

      const s = document.createElement("div");
      s.textContent = subText || "";
      s.style.opacity = "0.75";
      s.style.fontSize = "12px";
      s.style.lineHeight = "1.35";
      s.style.maxWidth = "62ch";

      tile.append(t, s);
      tile.addEventListener("mouseenter", () => {
        tile.style.borderColor = "#c7d2e5";
        tile.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.06)";
        tile.style.transform = "translateY(-1px)";
      });
      tile.addEventListener("mouseleave", () => {
        tile.style.borderColor = "#d8dee6";
        tile.style.boxShadow = "0 1px 1px rgba(15, 23, 42, 0.03)";
        tile.style.transform = "translateY(0)";
      });
      tile.addEventListener("click", async () => {
        if (this.saving) return;
        await onClick?.();
      });
      return tile;
    };

    const mkGroup = ({ titleText, subText, tiles = [], emptyText = "", variant = "default" }) => {
      const group = document.createElement("section");
      group.style.display = "grid";
      group.style.gap = "10px";
      group.style.padding = "14px";
      group.style.border = "1px solid #e5e7eb";
      group.style.borderRadius = "16px";
      group.style.background = variant === "dev" ? "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" : "#fff";
      group.style.borderColor = variant === "dev" ? "#dbe7f5" : "#e5e7eb";
      group.style.boxShadow = "0 1px 0 rgba(15, 23, 42, 0.02)";

      const head = document.createElement("div");
      head.style.display = "grid";
      head.style.gap = "4px";

      const groupTitle = document.createElement("div");
      groupTitle.textContent = titleText;
      groupTitle.style.fontWeight = "800";
      groupTitle.style.fontSize = "13px";
      groupTitle.style.textTransform = "uppercase";
      groupTitle.style.letterSpacing = "0.04em";
      groupTitle.style.color = "#0f172a";

      const groupText = document.createElement("div");
      groupText.textContent = subText || "";
      groupText.style.fontSize = "12px";
      groupText.style.opacity = "0.72";
      groupText.style.lineHeight = "1.35";
      groupText.style.maxWidth = "68ch";

      const body = document.createElement("div");
      body.style.display = "grid";
      body.style.gap = "10px";

      if (tiles.length) {
        body.append(...tiles);
      } else if (emptyText) {
        const note = document.createElement("div");
        note.textContent = emptyText;
        note.style.fontSize = "12px";
        note.style.opacity = "0.72";
        note.style.lineHeight = "1.35";
        note.style.padding = "10px 12px";
        note.style.border = "1px dashed #dbe3ee";
        note.style.borderRadius = "10px";
        note.style.background = "#f8fafc";
        body.append(note);
      }

      head.append(groupTitle, groupText);
      group.append(head, body);
      return group;
    };

    const tileProfileAddress = mkTile({
      titleText: "Profil / Adresse",
      subText: "Stammdaten und Adresse",
      onClick: async () => {
        await this._createProfileAddressContent();
      },
    });

    const tileOutputPrint = mkTile({
      titleText: "Ausgabe & Druck",
      subText: "Footer, Layout, Logos und Speicherorte",
      onClick: async () => {
        await this._createOutputPrintContent();
      },
    });

    const tileDictationAudio = mkTile({
      titleText: "Diktat / Audio",
      subText: "Diktieren, Transkription und Audio-Optionen",
      onClick: async () => {
        await this._createDictationAudioContent();
      },
    });

    const tileProtocol = mkTile({
      titleText: "Protokoll",
      subText: "Bezeichnung und Vorbemerkung",
      onClick: async () => {
        await this._createProtocolContent();
      },
    });

    const tileFirmRoles = mkTile({
      titleText: "Firmenrollen",
      subText: "Reihenfolge für Listen und Ausgaben",
      onClick: async () => {
        await this._openFirmRoleOrderPopup();
      },
    });

    const tileLicense = mkTile({
      titleText: "Lizenzstatus",
      subText: "Lizenz und Freischaltung",
      onClick: async () => {
        this._openSettingsModal({
          title: "Lizenz",
          content: [this._createLicenseSettingsContent()],
          closeOnly: true,
        });
      },
    });

    const tileArchive = mkTile({
      titleText: "Archiv",
      subText: "Archivierte Projekte",
      onClick: async () => {
        if (!this.router || typeof this.router.showArchive !== "function") {
          alert("Router.showArchive ist nicht verfuegbar.");
          return;
        }
        await this.router.showArchive();
      },
    });

    const tileDev = mkTile({
      titleText: "Technik",
      subText: "Diagnose und technische Grenzen",
      onClick: async () => {
        await this._openDevelopmentModal();
      },
    });

    const groupGeneral = mkGroup({
      titleText: "Allgemein",
      subText: "Persoenliche Daten und Freischaltung.",
      tiles: [tileProfileAddress, tileLicense],
    });

    const groupInput = mkGroup({
      titleText: "Eingabe & Erfassung",
      subText: "Hilfsfunktionen fuer Erfassung und Sprache.",
      tiles: [tileDictationAudio],
    });

    const groupOutput = mkGroup({
      titleText: "Ausgabe & Kommunikation",
      subText: "Druck, Versand, Archiv und Speicherorte.",
      tiles: [tileOutputPrint, tileFirmRoles, tileArchive],
    });

    const groupModule = mkGroup({
      titleText: "Module",
      subText: "Fachmodule und Erweiterungen.",
      tiles: [tileProtocol],
    });

    const groupDev = mkGroup({
      titleText: "Entwicklung",
      subText: "Technische Werkzeuge und Grenzen.",
      tiles: [tileDev],
      variant: "dev",
    });

    tiles.append(groupGeneral, groupInput, groupOutput, groupModule, groupDev);
    root.append(head, tiles);
    this.root = root;

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: OVERLAY_TOP });
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const modal = document.createElement("div");
    applyPopupCardStyle(modal);
    modal.style.width = "min(980px, calc(100vw - 24px))";
    modal.style.maxHeight = "calc(100vh - 24px)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.overflow = "hidden";
    modal.style.background = "#fff";
    modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    modal.style.padding = "0";
    modal.style.fontFamily = "var(--bbm-font-ui)";
    modal.tabIndex = -1;

    const modalHead = document.createElement("div");
    modalHead.style.display = "flex";
    modalHead.style.alignItems = "center";
    modalHead.style.justifyContent = "space-between";
    modalHead.style.gap = "10px";
    modalHead.style.padding = "12px";
    modalHead.style.borderBottom = "1px solid #e2e8f0";

    const modalTitle = document.createElement("div");
    modalTitle.style.fontWeight = "bold";
    modalTitle.textContent = "";

    const modalClose = document.createElement("button");
    modalClose.type = "button";
    modalClose.textContent = "X";
    applyPopupButtonStyle(modalClose);

    modalHead.append(modalTitle, modalClose);

    const modalBody = document.createElement("div");
    modalBody.style.display = "grid";
    modalBody.style.gap = "10px";
    modalBody.style.flex = "1 1 auto";
    modalBody.style.minHeight = "0";
    modalBody.style.overflow = "auto";
    modalBody.style.padding = "12px";

    const modalFooter = document.createElement("div");
    modalFooter.style.borderTop = "1px solid #e2e8f0";
    modalFooter.style.padding = "10px 12px";

    const modalFooterInner = document.createElement("div");
    modalFooterInner.style.display = "flex";
    modalFooterInner.style.justifyContent = "flex-end";
    modalFooterInner.style.gap = "8px";
    modalFooterInner.style.width = "100%";
    modalFooterInner.style.maxWidth = "720px";

    const modalSave = document.createElement("button");
    modalSave.type = "button";
    modalSave.textContent = "Speichern";
    applyPopupButtonStyle(modalSave, { variant: "primary" });
    modalSave.addEventListener("click", async () => {
      if (this._settingsModalCloseOnly) {
        this._closeSettingsModal();
        return;
      }
      await this._runSettingsModalSave({ closeOnSuccess: true });
    });

    modalFooterInner.append(modalSave);
    modalFooter.append(modalFooterInner);
    modal.append(modalHead, modalBody, modalFooter);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.settingsModalOverlayEl = overlay;
    this.settingsModalEl = modal;
    this.settingsModalTitleEl = modalTitle;
    this.settingsModalBodyEl = modalBody;
    this.settingsModalCloseBtn = modalClose;
    this.settingsModalFooterEl = modalFooter;
    this.settingsModalSaveBtn = modalSave;

    const closeSettingsOverlay = () => {
      if (this._settingsModalCloseOnly) {
        this._closeSettingsModal();
        return;
      }
      this._runSettingsModalSave({ closeOnSuccess: true });
    };
    registerPopupCloseHandlers(overlay, closeSettingsOverlay);

    modalClose.addEventListener("click", closeSettingsOverlay);
    this._settingsModalOpen = false;
    return root;
  }

  _openSettingsModal({ title, content, saveFn, closeOnly = false } = {}) {
    if (!this.settingsModalOverlayEl || !this.settingsModalBodyEl || !this.settingsModalTitleEl) return;
    this.settingsModalTitleEl.textContent = (title || "").toString();
    const titleNorm = String(title || "").trim().toLowerCase();
    if (this.settingsModalEl) {
      const isCompactPopup =
        titleNorm === "lizenz" || titleNorm === "entwicklung" || titleNorm === "adminbereich";
      const isPrintSettingsPopup = titleNorm === "druckeinstellungen";
      const isLayoutPopup = titleNorm === "druck-layout";
      if (isPrintSettingsPopup) {
        this.settingsModalEl.style.width = "min(760px, calc(100vw - 24px))";
      } else if (isLayoutPopup) {
        this.settingsModalEl.style.width = "min(344px, calc(100vw - 24px))";
      } else if (isCompactPopup) {
        this.settingsModalEl.style.width = "min(760px, calc(100vw - 24px))";
      } else {
        this.settingsModalEl.style.width = "min(980px, calc(100vw - 24px))";
      }
      const footerInner = this.settingsModalFooterEl?.firstElementChild;
      if (footerInner) {
        footerInner.style.maxWidth = isPrintSettingsPopup ? "600px" : "720px";
      }
    }
    this.settingsModalBodyEl.innerHTML = "";
    const nodes = Array.isArray(content) ? content : [content];
    for (const node of nodes) {
      this._appendSettingsModalContentItem(this.settingsModalBodyEl, node);
    }
    this._settingsModalSaveFn = typeof saveFn === "function" ? saveFn : null;
    this._settingsModalCloseOnly = !!closeOnly;
    if (this.settingsModalSaveBtn) {
      this.settingsModalSaveBtn.textContent = this._settingsModalCloseOnly ? "Schliessen" : "Speichern";
    }
    this._settingsModalOpen = true;
    this._lockBodyScroll();
    this.settingsModalOverlayEl.style.display = "flex";
    try {
      if (this.settingsModalEl) {
        this.settingsModalEl.focus();
      } else {
        this.settingsModalOverlayEl.focus();
      }
    } catch (_e) {
      // ignore
    }
  }

  async _runSettingsModalSave({ closeOnSuccess } = {}) {
    if (!this._settingsModalSaveFn) {
      if (closeOnSuccess) this._closeSettingsModal();
      return true;
    }

    try {
      const res = await this._settingsModalSaveFn();
      if (res === false) return false;
      if (closeOnSuccess) this._closeSettingsModal();
      return true;
    } catch (e) {
      console.error("Settings-Modal Save fehlgeschlagen:", e);
      return false;
    }
  }

  _closeSettingsModal() {
    if (!this.settingsModalOverlayEl || !this.settingsModalBodyEl) return;
    this._settingsModalOpen = false;
    this.settingsModalOverlayEl.style.display = "none";
    this.settingsModalBodyEl.innerHTML = "";
    this._settingsModalSaveFn = null;
    this._settingsModalCloseOnly = false;
    this._unlockBodyScroll();
  }

  _lockBodyScroll() {
    if (this._bodyLockCount === 0) {
      this._bodyOverflowBackup = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    }
    this._bodyLockCount += 1;
  }

  _unlockBodyScroll() {
    if (this._bodyLockCount > 0) {
      this._bodyLockCount -= 1;
    }
    if (this._bodyLockCount === 0) {
      document.body.style.overflow = this._bodyOverflowBackup || "";
      this._bodyOverflowBackup = null;
    }
  }
}
