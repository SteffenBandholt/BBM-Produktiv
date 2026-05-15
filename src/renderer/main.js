// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.1
// src/renderer/main.js

import Router from "./app/Router.js";
import CoreShell from "./app/CoreShell.js";
import { DEFAULT_THEME_SETTINGS, applyThemeForSettings } from "./theme/themes.js";
import { applyPopupButtonStyle, applyPopupCardStyle } from "./ui/popupButtonStyles.js";

// App-Kern-Bootstrap: zentrale Startkonstanten und lokale Storage-/Settings-Keys.
const APP_VERSION = "1.0";
const PRINT_V2_PAD_LEFT_KEY = "print.v2.pagePadLeftMm";
const PRINT_V2_PAD_RIGHT_KEY = "print.v2.pagePadRightMm";
const PRINT_V2_PAD_TOP_KEY = "print.v2.pagePadTopMm";
const PRINT_V2_PAD_BOTTOM_KEY = "print.v2.pagePadBottomMm";
const PRINT_V2_FOOTER_RESERVE_KEY = "print.v2.footerReserveMm";
const PRINT_LAYOUT_DEFAULTS = {
  [PRINT_V2_PAD_LEFT_KEY]: "19",
  [PRINT_V2_PAD_RIGHT_KEY]: "15",
  [PRINT_V2_PAD_TOP_KEY]: "3",
  [PRINT_V2_PAD_BOTTOM_KEY]: "18",
  [PRINT_V2_FOOTER_RESERVE_KEY]: "12",
};
const WHATSNEW_KEY_PREFIX = "bbm_whatsnew_seen_";

// Gemeinsame service-nahe Helfer: Settings-/Storage-Zugriffe ohne UI-Verdrahtung.
const toSeenKey = (version) => `${WHATSNEW_KEY_PREFIX}${String(version || "").trim() || "unknown"}`;

const isSeenValue = (v) => {
  const s = String(v == null ? "" : v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
};

const readWhatsNewSeen = async (version) => {
  const key = toSeenKey(version);
  try {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([key]);
      if (res?.ok) {
        const data = res.data || {};
        if (isSeenValue(data[key])) return true;
      }
    }
  } catch (_e) {
    // ignore and continue with localStorage fallback
  }

  try {
    return isSeenValue(window.localStorage?.getItem?.(key));
  } catch (_e) {
    return false;
  }
};

const writeWhatsNewSeen = async (version) => {
  const key = toSeenKey(version);
  try {
    const api = window.bbmDb || {};
    if (typeof api.appSettingsSetMany === "function") {
      const res = await api.appSettingsSetMany({ [key]: "1" });
      if (res?.ok) return;
    }
  } catch (_e) {
    // ignore and continue with localStorage fallback
  }

  try {
    window.localStorage?.setItem?.(key, "1");
  } catch (_e) {
    // ignore
  }
};

const showStartupOverlay = ({ durationMs = 3000 } = {}) => {
  if (document.querySelector('[data-bbm-startup-overlay="true"]')) return;

  const overlay = document.createElement("div");
  overlay.setAttribute("data-bbm-startup-overlay", "true");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "rgba(15,23,42,0.18)";
  overlay.style.zIndex = "11000";
  overlay.style.pointerEvents = "none";
  overlay.style.opacity = "1";
  overlay.style.transition = "opacity 260ms ease";

  const card = document.createElement("div");
  card.style.width = "75vw";
  card.style.height = "75vh";
  card.style.maxWidth = "1100px";
  card.style.maxHeight = "760px";
  card.style.minWidth = "360px";
  card.style.minHeight = "260px";
  card.style.borderRadius = "14px";
  card.style.background = "rgba(15,23,42,0.92)";
  card.style.boxShadow = "0 20px 50px rgba(0,0,0,0.35)";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.alignItems = "center";
  card.style.justifyContent = "center";
  card.style.gap = "14px";

  const img = document.createElement("img");
  img.src = "./assets/icon-BBM.png";
  img.alt = "BBM";
  img.style.width = "clamp(200px, 26vw, 360px)";
  img.style.height = "auto";
  img.style.objectFit = "contain";

  const text = document.createElement("div");
  text.textContent = "Initialisiere ...";
  text.style.color = "#e2e8f0";
  text.style.fontSize = "14px";
  text.style.fontWeight = "600";
  text.style.letterSpacing = "0.3px";

  card.append(img, text);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    }, 280);
  }, Math.max(500, Number(durationMs) || 3000));
};


const ensureInitialPrintLayoutDefaults = async () => {
  const api = window.bbmDb || {};
  if (typeof api.appSettingsGetMany !== "function") return;
  if (typeof api.appSettingsSetMany !== "function") return;

  const keys = Object.keys(PRINT_LAYOUT_DEFAULTS);
  try {
    const res = await api.appSettingsGetMany(keys);
    if (!res?.ok) return;
    const data = res.data || {};
    const hasAnySavedValue = keys.some((key) => String(data[key] || "").trim() !== "");
    if (hasAnySavedValue) return;
    await api.appSettingsSetMany(PRINT_LAYOUT_DEFAULTS);
  } catch (_e) {
    // ignore
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // App-Kern-Orchestrierung: konserviert die bestehende Startreihenfolge.
  await ensureInitialPrintLayoutDefaults();

  const router = new Router();

  applyThemeForSettings(DEFAULT_THEME_SETTINGS);

  const coreShell = new CoreShell({
    router,
    version: APP_VERSION,
  });

  coreShell.start();
});
