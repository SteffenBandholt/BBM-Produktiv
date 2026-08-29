"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const {
  LICENSE_MODULES,
  LICENSE_FEATURES,
  KNOWN_LICENSE_MODULE_IDS,
  KNOWN_OPTIONAL_FEATURE_IDS,
  normalizeLicensedModules,
  normalizeLicensedFeatures,
} = require("./licenseFeatures");

const PRODUCT_ADAPTERS = new Map();

function _text(value) {
  return String(value ?? "").trim();
}

function _positiveInt(value, fallback = null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const int = Math.floor(parsed);
  return int >= 1 ? int : fallback;
}

function _canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(_canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${_canonicalize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function _sanitizeFileName(value) {
  return _text(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

function _normalizeIsoDate(value) {
  const raw = _text(value);
  if (!raw) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return "";
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() + 1 !== Number(match[2]) ||
    date.getUTCDate() !== Number(match[3])
  ) return "";
  return raw;
}

function resolvePrivateKeyPath() {
  const configured = _text(process.env.BBM_LICENSE_PRIVATE_KEY_PATH);
  if (configured) return path.resolve(configured);

  // Bewusst ausserhalb von app.asar/Repo. Dieser Pfad ist nur ein lokaler
  // Administrationsspeicher; normale Kundeninstallationen besitzen die Datei nicht.
  return path.join(app.getPath("userData"), "license-admin", "private_key.pem");
}

function readPrivateKey() {
  const keyPath = resolvePrivateKeyPath();
  if (!fs.existsSync(keyPath)) {
    const error = new Error("LICENSE_PRIVATE_KEY_NOT_CONFIGURED");
    error.code = "LICENSE_PRIVATE_KEY_NOT_CONFIGURED";
    error.keyPath = keyPath;
    throw error;
  }
  return { keyPath, pem: fs.readFileSync(keyPath, "utf8") };
}

function registerProductAdapter(adapter) {
  const product = _text(adapter?.product).toLowerCase();
  if (!product) throw new Error("product required");
  if (typeof adapter?.buildLicense !== "function") throw new Error("buildLicense required");
  PRODUCT_ADAPTERS.set(product, Object.freeze({ ...adapter, product }));
  return PRODUCT_ADAPTERS.get(product);
}

function getProductAdapter(product) {
  return PRODUCT_ADAPTERS.get(_text(product).toLowerCase()) || null;
}

function listProductAdapters() {
  return Object.freeze([...PRODUCT_ADAPTERS.values()]);
}

function _buildBbmLicense(input = {}) {
  const edition = _text(input.edition).toLowerCase() === "test" ? "test" : "full";
  const binding = _text(input.binding).toLowerCase() === "machine" ? "machine" : "none";
  const customerName = _text(input.customerName);
  const licenseId = _text(input.licenseId);
  const maxDevices = _positiveInt(input.maxDevices, 1);
  const modules = normalizeLicensedModules(input.modules, input.features);
  const features = normalizeLicensedFeatures(input.features);

  if (!customerName) throw new Error("customerName required");
  if (!licenseId) throw new Error("licenseId required");
  if (modules.length < 1) throw new Error("modules required");

  const license = {
    schemaVersion: 1,
    product: "bbm",
    licenseId,
    customerName,
    edition,
    issuedAt: new Date().toISOString(),
    maxDevices,
    modules,
    features,
    binding,
  };

  if (edition === "test") {
    license.trialDurationDays = _positiveInt(input.trialDurationDays, 30);
  } else {
    const validUntil = _normalizeIsoDate(input.validUntil);
    if (!validUntil) throw new Error("validUntil required");
    license.validUntil = validUntil;
  }

  if (binding === "machine") {
    const machineId = _text(input.machineId);
    if (!machineId) throw new Error("machineId required");
    license.machineId = machineId;
  }

  const notes = _text(input.notes);
  if (notes) license.notes = notes;
  return license;
}

registerProductAdapter({
  product: "bbm",
  label: "BBM",
  extension: "bbmlic",
  moduleIds: KNOWN_LICENSE_MODULE_IDS,
  featureIds: KNOWN_OPTIONAL_FEATURE_IDS,
  buildLicense: _buildBbmLicense,
});

function issueLicense(input = {}, options = {}) {
  const product = _text(input.product || "bbm").toLowerCase();
  const adapter = getProductAdapter(product);
  if (!adapter) {
    const error = new Error(`UNKNOWN_LICENSE_PRODUCT:${product || "(leer)"}`);
    error.code = "UNKNOWN_LICENSE_PRODUCT";
    throw error;
  }

  const license = adapter.buildLicense(input);
  const { pem: privateKeyPem } = readPrivateKey();
  const canonical = _canonicalize(license);
  const signature = crypto
    .sign(null, Buffer.from(canonical, "utf8"), privateKeyPem)
    .toString("base64");

  const outputObject = { license, signature };
  const outputDirectory = _text(options.outputDirectory)
    ? path.resolve(options.outputDirectory)
    : path.join(app.getPath("userData"), "license-admin", "output");
  fs.mkdirSync(outputDirectory, { recursive: true });

  const extension = _text(adapter.extension) || "lic";
  const outputFileName = `${_sanitizeFileName(license.licenseId)}_${_sanitizeFileName(license.customerName)}.${extension}`;
  const outputPath = path.join(outputDirectory, outputFileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(outputObject, null, 2)}\n`, "utf8");

  return {
    ok: true,
    outputPath,
    license,
    product: adapter.product,
  };
}

module.exports = Object.freeze({
  LICENSE_MODULES,
  LICENSE_FEATURES,
  registerProductAdapter,
  getProductAdapter,
  listProductAdapters,
  resolvePrivateKeyPath,
  issueLicense,
});
