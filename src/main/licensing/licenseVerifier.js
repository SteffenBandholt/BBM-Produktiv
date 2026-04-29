// src/main/licensing/licenseVerifier.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getMachineId } = require("./deviceIdentity");
const { isLicensedProduct } = require("./licenseFeatures");

const PUBLIC_KEY_PATH = path.join(__dirname, "public_key.pem");
const EXPECTED_PRODUCT = "bbm";

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function readPublicKey() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    const err = new Error(`PUBLIC_KEY_MISSING:${PUBLIC_KEY_PATH}`);
    err.code = "PUBLIC_KEY_MISSING";
    throw err;
  }

  const publicKey = String(fs.readFileSync(PUBLIC_KEY_PATH, "utf8") || "").trim();
  if (
    !publicKey ||
    !publicKey.includes("-----BEGIN PUBLIC KEY-----") ||
    publicKey.includes("PLACEHOLDER_REPLACE_WITH_REAL_PUBLIC_KEY")
  ) {
    const err = new Error(`PUBLIC_KEY_INVALID:${PUBLIC_KEY_PATH}`);
    err.code = "PUBLIC_KEY_INVALID";
    throw err;
  }

  return publicKey;
}

function verifySignature(license, signature) {
  try {
    const publicKey = readPublicKey();
    const canonical = canonicalize(license);
    const signatureBuffer = Buffer.from(String(signature || ""), "base64");

    return {
      valid: crypto.verify(
        null,
        Buffer.from(canonical, "utf8"),
        publicKey,
        signatureBuffer
      ),
      reason: null,
    };
  } catch (err) {
    return {
      valid: false,
      reason: err?.code || "INVALID_SIGNATURE",
    };
  }
}

function isIsoDateString(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  const parsed = new Date(raw);
  return !Number.isNaN(parsed.getTime());
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.floor(num);
  if (int < 1) return null;
  return int;
}

function verifyLicense(licenseData) {
  if (!licenseData) {
    return { valid: false, reason: "NO_LICENSE" };
  }

  const { license, signature, machineId } = licenseData;

  if (!license || typeof license !== "object" || !signature) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const requiredFields = [
    "schemaVersion",
    "product",
    "licenseId",
    "customerName",
    "edition",
    "issuedAt",
    "maxDevices",
    "features",
  ];

  for (const field of requiredFields) {
    const value = license[field];
    const missing =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (missing) {
      return { valid: false, reason: "INVALID_FORMAT" };
    }
  }

  if (!Array.isArray(license.features)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  if (typeof license.maxDevices !== "number" || license.maxDevices < 1) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const edition = String(license.edition || "").trim().toLowerCase();
  if (!["test", "full"].includes(edition)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const binding = String(license.binding || "").trim().toLowerCase() || "none";
  if (!["none", "machine"].includes(binding)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  if (!isIsoDateString(license.issuedAt)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }
  if (edition === "full" && !isIsoDateString(license.validUntil)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  if (!isLicensedProduct(license.product)) {
    return { valid: false, reason: "WRONG_PRODUCT", license };
  }

  const signatureCheck = verifySignature(license, signature);
  if (!signatureCheck.valid) {
    return { valid: false, reason: signatureCheck.reason || "INVALID_SIGNATURE", license };
  }

  const currentMachineId = getMachineId();
  const boundMachineId = String(license.machineId || machineId || "").trim();
  if (binding === "machine") {
    if (!boundMachineId) {
      return { valid: false, reason: "INVALID_FORMAT", license, machineId: currentMachineId };
    }
    if (boundMachineId !== currentMachineId) {
      return { valid: false, reason: "WRONG_MACHINE", license, machineId: currentMachineId };
    }
  }

  const now = Date.now();
  let expiresAt = null;
  if (edition === "test" && binding === "none") {
    const trialDurationDays = parsePositiveInt(license.trialDurationDays);
    if (!trialDurationDays) {
      return { valid: false, reason: "INVALID_FORMAT", license };
    }
    const startedAtRaw = String(licenseData.trialStartedAt || licenseData.installedAt || "").trim();
    if (startedAtRaw) {
      const startedAt = new Date(startedAtRaw).getTime();
      if (Number.isNaN(startedAt)) {
        return { valid: false, reason: "INVALID_FORMAT", license };
      }
      expiresAt = startedAt + trialDurationDays * 24 * 60 * 60 * 1000;
    }
  } else {
    expiresAt = new Date(license.validUntil).getTime();
  }

  if (expiresAt !== null && Number.isNaN(expiresAt)) {
    return { valid: false, reason: "INVALID_FORMAT", license };
  }

  if (expiresAt !== null && now > expiresAt) {
    return {
      valid: false,
      reason: "LICENSE_EXPIRED",
      license,
      machineId: currentMachineId,
      expired: true,
    };
  }

  const msRemaining = expiresAt === null ? null : expiresAt - now;
  const daysRemaining = msRemaining === null ? null : Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const expiresSoon = typeof daysRemaining === "number" ? daysRemaining <= 14 : false;

  return {
    valid: true,
    reason: null,
    license,
    machineId: currentMachineId,
    binding,
    expiresSoon,
    daysRemaining,
    expired: false,
  };
}

module.exports = {
  verifyLicense,
};
