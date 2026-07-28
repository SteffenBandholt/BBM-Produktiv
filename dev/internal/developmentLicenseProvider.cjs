const PROVIDER_ID = "bbm-internal-development-license-v1";

function createDevelopmentLicenseStatus({ appVersion = "", displayLabel = "Entwicklungsversion – Testlizenz" } = {}) {
  return Object.freeze({
    valid: true,
    reason: null,
    developmentLicense: true,
    licenseSource: "internal-development-build",
    displayLabel,
    license: Object.freeze({
      schemaVersion: 1,
      product: "bbm-protokoll",
      licenseId: "INTERNAL-DEVELOPMENT",
      customerName: "Interne Entwicklung",
      edition: "test",
      issuedAt: "2026-01-01T00:00:00.000Z",
      maxDevices: 1,
      modules: Object.freeze(["protokoll", "restarbeiten"]),
      features: Object.freeze(["diktat"]),
      binding: "build",
    }),
    binding: "build",
    machineId: "",
    appVersion,
    daysRemaining: null,
    expiresSoon: false,
    expired: false,
  });
}

module.exports = Object.freeze({ PROVIDER_ID, createDevelopmentLicenseStatus });
