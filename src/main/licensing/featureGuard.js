const { app } = require("electron");
const { requireFeature, getStatus } = require("./licenseService");
const {
  LICENSE_MODULES,
  LICENSE_FEATURES,
  normalizeLicensedModules,
  normalizeLicensedFeatures,
} = require("./licenseFeatures");

// Zentrale Kernlogik fuer nutzende Stellen:
// liefert nur kompakte Lizenzinfos fuer technische Dienste und UI-nahe Diagnose.
function _extractLicenseInfo(status) {
  const license = status?.license && typeof status.license === "object" ? status.license : {};

  return {
    customerName: String(
      license.customerName || license.customer || license.customer_name || license.customer_name_full || ""
    ).trim(),
    licenseId: String(license.licenseId || license.id || "").trim(),
    edition: String(license.edition || "").trim(),
    validUntil: String(license.validUntil || "").trim(),
    modules: normalizeLicensedModules(license.modules, license.features),
    features: normalizeLicensedFeatures(license.features),
    appVersion: String(app?.getVersion?.() || "").trim(),
    licensedToText: buildLicensedToText(status),
  };
}


function buildLicensedToText(statusOrLicense) {
  const source = statusOrLicense && typeof statusOrLicense === "object" ? statusOrLicense : {};
  const isStatusShape = Object.prototype.hasOwnProperty.call(source, "valid") || Object.prototype.hasOwnProperty.call(source, "license");
  const valid = isStatusShape ? !!source.valid : true;
  const license = isStatusShape
    ? source.license && typeof source.license === "object"
      ? source.license
      : {}
    : source;

  if (!valid) return "Nicht lizenziert";

  const customerName = String(
    license.customerName || license.customer || license.customer_name || license.customer_name_full || ""
  ).trim();
  if (customerName) return `Lizenziert für ${customerName}`;

  const licenseId = String(license.licenseId || license.id || "").trim();
  if (licenseId) return `Lizenziert für Lizenz ${licenseId}`;

  return "Nicht lizenziert";
}

function createLicenseBadgeText(licenseInfo = {}) {
  const year = new Date().getFullYear();
  const version = String(licenseInfo?.appVersion || "").trim();
  const customerName = String(licenseInfo?.customerName || "").trim();
  const licenseId = String(licenseInfo?.licenseId || "").trim();
  const edition = String(licenseInfo?.edition || "").trim();

  const parts = [`(c) BBM ${year}`];
  if (version) parts.push(`v${version}`);
  parts.push(`Lizenz: ${customerName || licenseId || "-"}`);
  if (edition) parts.push(edition);
  return parts.join(" | ");
}

function _readEnvFlag(name) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return null;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return null;
}

// Uebergangs-/Altlogik:
// Dev-Override bleibt vorerst hier gebuendelt, damit er nicht in einzelnen Addons verteilt wird.
function isDevAudioOverrideEnabled() {
  // Dev override: set BBM_DEV_UNLOCK_AUDIO=true (DEV only).
  const explicit = _readEnvFlag("BBM_DEV_UNLOCK_AUDIO");
  if (explicit === true) return !app.isPackaged;
  if (explicit === false) return false;
  return !app.isPackaged;
}

// Uebergangs-/Altlogik:
// Legacy-Audio-Suggestions bleiben sichtbar getrennt von der eigentlichen Kern-Lizenzpruefung.
function isDevAudioSuggestionsEnabled() {
  // Dev-only legacy audio suggestions flow.
  const explicit = _readEnvFlag("BBM_DEV_ENABLE_AUDIO_SUGGESTIONS");
  if (explicit === true) return !app.isPackaged;
  if (explicit === false) return false;
  return false;
}


// Zentraler Guard fuer technische Dienste/Addons:
// Views und Fachablaeufe fragen nicht direkt die Lizenzdatei ab, sondern laufen ueber diesen Einstieg.
function enforceLicensedFeature(feature) {
  const normalizedFeature = String(feature || "").trim().toLowerCase();
  if (normalizedFeature === LICENSE_FEATURES.DIKTAT && isDevAudioOverrideEnabled()) {
    return _extractLicenseInfo(getStatus({ fresh: true }));
  }
  try {
    requireFeature(normalizedFeature);
    return _extractLicenseInfo(getStatus({ fresh: true }));
  } catch (err) {
    const rawMessage = String(err?.message || "");
    if (rawMessage.startsWith("LICENSE_INVALID:") || rawMessage.startsWith("FEATURE_NOT_ALLOWED:")) {
      err.licenseError = true;
    }

    throw err;
  }
}

function toLicenseErrorPayload(err) {
  const message = String(err?.message || "");

  if (message.startsWith("LICENSE_INVALID:")) {
    const reason = message.slice("LICENSE_INVALID:".length) || "UNKNOWN";
    const errorMessage = mapLicenseReasonToMessage(reason);
    return {
      ok: false,
      licenseError: true,
      code: "LICENSE_INVALID",
      reason,
      error: errorMessage,
      message: errorMessage,
      status: safeGetStatus(),
    };
  }

  if (message.startsWith("FEATURE_NOT_ALLOWED:")) {
    const feature = message.slice("FEATURE_NOT_ALLOWED:".length) || "unknown";
    const errorMessage = mapFeatureToMessage(feature);
    return {
      ok: false,
      licenseError: true,
      code: "FEATURE_NOT_ALLOWED",
      reason: feature,
      error: errorMessage,
      message: errorMessage,
      status: safeGetStatus(),
    };
  }

  return {
    ok: false,
    licenseError: true,
    code: "LICENSE_ERROR",
    reason: "UNKNOWN",
    error: "Lizenzfehler.",
    message: "Lizenzfehler.",
    status: safeGetStatus(),
  };
}

function safeGetStatus() {
  try {
    return getStatus();
  } catch (_err) {
    return null;
  }
}

// UI-/View-nahe Rueckmeldung:
// Fehler werden hier in kompakte Payloads/Meldungen fuer Renderer und technische IPCs uebersetzt.
function mapLicenseReasonToMessage(reason) {
  switch (reason) {
    case "NO_LICENSE":
      return "Keine Lizenz installiert.";
    case "INVALID_FORMAT":
      return "Lizenzdatei ist ungueltig.";
    case "INVALID_SIGNATURE":
      return "Lizenzsignatur ist ungueltig.";
    case "PUBLIC_KEY_MISSING":
    case "PUBLIC_KEY_INVALID":
      return "Lizenzpruefung ist lokal nicht vollstaendig eingerichtet.";
    case "WRONG_PRODUCT":
      return "Diese Lizenz gehoert zu einem anderen Produkt.";
    case "WRONG_MACHINE":
      return "Diese Lizenz gehoert zu einem anderen Rechner.";
    case "LICENSE_EXPIRED":
      return "Die Lizenz ist abgelaufen.";
    default:
      return "Lizenz ist ungueltig.";
  }
}

// UI-/View-nahe Rueckmeldung:
// Feature-Ablehnungen bleiben textlich zentral, damit nutzende Stellen keine eigenen Meldungen bauen muessen.
function mapFeatureToMessage(feature) {
  switch (feature) {
    case LICENSE_MODULES.PROTOKOLL:
      return "Modul Protokoll ist fuer diese Lizenz nicht freigeschaltet.";
    case LICENSE_FEATURES.DIKTAT:
      return "Funktion Diktat ist fuer diese Lizenz nicht freigeschaltet.";
    default:
      return `Feature nicht freigeschaltet: ${feature}`;
  }
}

module.exports = {
  LICENSE_FEATURES,
  createLicenseBadgeText,
  enforceLicensedFeature,
  isDevAudioOverrideEnabled,
  isDevAudioSuggestionsEnabled,
  buildLicensedToText,
  toLicenseErrorPayload,
};
