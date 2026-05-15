const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");

const { saveLicense, loadLicense, deleteLicense } = require("../licensing/licenseStorage");
const { getMachineId } = require("../licensing/deviceIdentity");
const { verifyLicense } = require("../licensing/licenseVerifier");
const { refreshStatus } = require("../licensing/licenseService");
const {
  normalizeLicensedModules,
  normalizeLicensedFeatures,
} = require("../licensing/licenseFeatures");

const LICENSE_FILE_FILTER = [{ name: "BBM Lizenz", extensions: ["bbmlic", "json"] }];

function _pickWindow(event) {
  try { return BrowserWindow.fromWebContents(event.sender) || null; } catch { return null; }
}

function _getExpiryInfo(validUntil) {
  const raw = String(validUntil || "").trim();
  if (!raw) return { daysRemaining: null, expiresSoon: false, expired: false };
  const expiresAt = new Date(raw).getTime();
  if (Number.isNaN(expiresAt)) return { daysRemaining: null, expiresSoon: false, expired: false };
  const diffMs = expiresAt - Date.now();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { daysRemaining, expiresSoon: diffMs >= 0 && daysRemaining <= 14, expired: diffMs < 0 };
}

function _buildDiagnosticsText(payload) {
  const modules = Array.isArray(payload?.modules) ? payload.modules : [];
  const features = Array.isArray(payload?.features) ? payload.features : [];
  return [
    `Lizenzstatus: ${payload?.valid ? "gueltig" : "ungueltig"}`,
    `Grund: ${payload?.reason || "-"}`,
    `Kunde: ${payload?.customerName || "-"}`,
    `Lizenz-ID: ${payload?.licenseId || "-"}`,
    `Edition: ${payload?.edition || "-"}`,
    `Binding: ${payload?.binding || "none"}`,
    `Gueltig bis: ${payload?.validUntil || "-"}`,
    `Machine-ID: ${payload?.machineId || "-"}`,
    `App-Version: ${payload?.appVersion || "-"}`,
    `Module: ${modules.length ? modules.join(",") : "-"}`,
    `Funktionen: ${features.length ? features.join(",") : "-"}`,
  ].join("\n");
}

function _toStatusPayload(status) {
  const license = status?.license && typeof status.license === "object" ? status.license : {};
  const expiry = _getExpiryInfo(license.validUntil);
  const payload = {
    valid: !!status?.valid,
    reason: String(status?.reason || ""),
    customerName: String(license.customerName || "").trim(),
    licenseId: String(license.licenseId || "").trim(),
    edition: String(license.edition || "").trim(),
    validUntil: String(license.validUntil || "").trim(),
    product: String(license.product || "").trim(),
    modules: normalizeLicensedModules(license.modules, license.features),
    features: normalizeLicensedFeatures(license.features),
    binding: String(license.binding || status?.binding || "").trim().toLowerCase() || "none",
    machineId: String(status?.machineId || getMachineId() || "").trim(),
    appVersion: String(app?.getVersion?.() || "").trim(),
    daysRemaining: typeof status?.daysRemaining === "number" ? status.daysRemaining : expiry.daysRemaining,
    expiresSoon: typeof status?.expiresSoon === "boolean" ? status.expiresSoon : expiry.expiresSoon,
    expired: typeof status?.expired === "boolean" ? status.expired : expiry.expired,
  };
  payload.diagnosticsText = _buildDiagnosticsText(payload);
  return payload;
}

function _readLicenseFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.license || !parsed.signature) {
    const err = new Error("INVALID_FORMAT"); err.code = "INVALID_FORMAT"; throw err;
  }
  return parsed;
}

function _buildLicenseRequestPayload(raw = {}) {
  const machineId = String(raw?.machineId || "").trim();
  if (!machineId) { const e = new Error("MACHINE_ID_REQUIRED_FOR_BINDING"); e.code = e.message; throw e; }
  const payload = {
    schemaVersion: 1,
    requestType: "machine-license-request",
    product: "bbm",
    appName: "BBM",
    appVersion: String(raw?.appVersion || app?.getVersion?.() || "").trim(),
    createdAt: String(raw?.createdAt || new Date().toISOString()).trim(),
    machineId,
    notes: String(raw?.notes || "").trim(),
  };
  const customerName = String(raw?.customerName || "").trim();
  if (customerName) payload.customerName = customerName;
  const licenseId = String(raw?.licenseId || "").trim();
  if (licenseId) payload.licenseId = licenseId;
  return payload;
}

function registerLicenseStatusIpc() {
  ipcMain.handle("license:get-status", async () => _toStatusPayload(refreshStatus()));
  ipcMain.handle("license:get-diagnostics", async () => {
    const status = refreshStatus();
    return { ok: !!status?.valid, ..._toStatusPayload(status) };
  });
}

function registerLicenseInstallationIpc() {
  ipcMain.handle("license:import", async (event) => {
    try {
      const result = await dialog.showOpenDialog(_pickWindow(event), { title: "Lizenzdatei auswählen", properties: ["openFile"], filters: LICENSE_FILE_FILTER });
      if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
      const parsed = _readLicenseFile(result.filePaths[0]);
      const verification = verifyLicense(parsed);
      if (!verification.valid) return { ok: false, error: verification.reason || "INVALID_FORMAT", ..._toStatusPayload(verification) };
      saveLicense(parsed);
      return { ok: true, filePath: result.filePaths[0], ..._toStatusPayload(refreshStatus()) };
    } catch (err) {
      const reason = String(err?.code || err?.message || "INVALID_FORMAT");
      return { ok: false, error: reason, ..._toStatusPayload({ valid: false, reason }) };
    }
  });

  ipcMain.handle("license:delete", async () => {
    try { deleteLicense(); return { ok: true, ..._toStatusPayload(refreshStatus()) }; }
    catch (err) { return { ok: false, error: err?.message || String(err) }; }
  });

  ipcMain.handle("license:get-installed", async () => {
    try { return { ok: true, license: loadLicense() }; }
    catch (err) { return { ok: false, error: err?.message || String(err) }; }
  });

  ipcMain.handle("license:create-request", async (event, raw) => {
    try {
      const installed = loadLicense();
      const installedLicense = installed?.license && typeof installed.license === "object" ? installed.license : {};
      const payload = _buildLicenseRequestPayload({
        machineId: getMachineId(),
        appVersion: app?.getVersion?.(),
        customerName: String(raw?.customerName || "").trim() || String(installedLicense.customerName || installedLicense.customer || "").trim(),
        licenseId: String(raw?.licenseId || "").trim() || String(installedLicense.licenseId || "").trim(),
        notes: raw?.notes,
      });
      const result = await dialog.showSaveDialog(_pickWindow(event), {
        title: "Lizenzanforderung speichern", defaultPath: "bbm-license-request.json", filters: [{ name: "Lizenzanforderung", extensions: ["json"] }],
      });
      if (result.canceled || !result.filePath) return { ok: false, canceled: true };
      await fs.promises.writeFile(result.filePath, JSON.stringify(payload, null, 2), "utf8");
      return { ok: true, filePath: result.filePath };
    } catch (err) {
      return { ok: false, error: String(err?.code || err?.message || "REQUEST_SAVE_FAILED").trim() || "REQUEST_SAVE_FAILED" };
    }
  });
}

function registerLicenseIpc() {
  registerLicenseStatusIpc();
  registerLicenseInstallationIpc();
}

module.exports = { registerLicenseIpc, _buildLicenseRequestPayload };
