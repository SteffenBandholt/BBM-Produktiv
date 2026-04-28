// src/main/ipc/licenseIpc.js

const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const { saveLicense, loadLicense, deleteLicense } = require("../licensing/licenseStorage");
const { getMachineId } = require("../licensing/deviceIdentity");
const { verifyLicense } = require("../licensing/licenseVerifier");
const { refreshStatus } = require("../licensing/licenseService");
const licenseAdminService = require("../licensing/licenseAdminService");

const LICENSE_FILE_FILTER = [
  {
    name: "BBM Lizenz",
    extensions: ["bbmlic", "json"],
  },
];

const LICENSE_TOOL_ROOT = "C:\\license-tool";
const LICENSE_TOOL_INPUT_DIR = path.join(LICENSE_TOOL_ROOT, "input");
const LICENSE_TOOL_OUTPUT_DIR = path.join(LICENSE_TOOL_ROOT, "output");
const LICENSE_TOOL_SCRIPT = path.join(LICENSE_TOOL_ROOT, "generate-license.cjs");
const LICENSE_TOOL_PRIVATE_KEY = path.join(LICENSE_TOOL_ROOT, "keys", "private_key.pem");

function _getExpiryInfo(validUntil) {
  const raw = String(validUntil || "").trim();
  if (!raw) {
    return { daysRemaining: null, expiresSoon: false, expired: false };
  }

  const expiresAt = new Date(raw).getTime();
  if (Number.isNaN(expiresAt)) {
    return { daysRemaining: null, expiresSoon: false, expired: false };
  }

  const diffMs = expiresAt - Date.now();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const expired = diffMs < 0;
  const expiresSoon = !expired && daysRemaining <= 14;

  return { daysRemaining, expiresSoon, expired };
}

function _toStatusPayload(status) {
  const license = status?.license && typeof status.license === "object" ? status.license : {};
  const binding = String(license.binding || status?.binding || "").trim().toLowerCase() || "none";
  const expiry = _getExpiryInfo(license.validUntil);
  const payload = {
    valid: !!status?.valid,
    reason: String(status?.reason || ""),
    customerName: String(license.customerName || "").trim(),
    licenseId: String(license.licenseId || "").trim(),
    edition: String(license.edition || "").trim(),
    validUntil: String(license.validUntil || "").trim(),
    features: Array.isArray(license.features) ? license.features : [],
    binding,
    machineId: String(status?.machineId || getMachineId() || "").trim(),
    appVersion: String(app?.getVersion?.() || "").trim(),
    daysRemaining:
      typeof status?.daysRemaining === "number" ? status.daysRemaining : expiry.daysRemaining,
    expiresSoon: typeof status?.expiresSoon === "boolean" ? status.expiresSoon : expiry.expiresSoon,
    expired: typeof status?.expired === "boolean" ? status.expired : expiry.expired,
  };

  payload.diagnosticsText = _buildDiagnosticsText(payload);
  return payload;
}

function _buildDiagnosticsText(payload) {
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
    `Features: ${features.length ? features.join(",") : "-"}`,
  ].join("\n");
}

function _pickWindow(event) {
  try {
    return BrowserWindow.fromWebContents(event.sender) || null;
  } catch (_err) {
    return null;
  }
}

function _readLicenseFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const err = new Error("INVALID_FORMAT");
    err.code = "INVALID_FORMAT";
    throw err;
  }
  if (!parsed.license || typeof parsed.license !== "object" || !parsed.signature) {
    const err = new Error("INVALID_FORMAT");
    err.code = "INVALID_FORMAT";
    throw err;
  }
  return parsed;
}

function _readLicenseRequestFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return _validateLicenseRequestPayload(parsed, filePath);
}

function _validateLicenseRequestPayload(payload, filePath = "") {
  const parsed = payload;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const err = new Error("INVALID_FORMAT");
    err.code = "INVALID_FORMAT";
    throw err;
  }
  const schemaVersion = Number(parsed.schemaVersion);
  const requestType = String(parsed.requestType || "").trim();
  const product = String(parsed.product || "").trim().toLowerCase();
  const machineId = String(parsed.machineId || "").trim();
  const createdAt = String(parsed.createdAt || "").trim();
  const appVersion = String(parsed.appVersion || "").trim();
  if (schemaVersion !== 1 || requestType !== "machine-license-request") {
    const err = new Error("INVALID_REQUEST_TYPE");
    err.code = "INVALID_REQUEST_TYPE";
    throw err;
  }
  if (product !== "bbm-protokoll") {
    const err = new Error("INVALID_PRODUCT");
    err.code = "INVALID_PRODUCT";
    throw err;
  }
  if (!machineId) {
    const err = new Error("MISSING_MACHINE_ID");
    err.code = "MISSING_MACHINE_ID";
    throw err;
  }
  if (!createdAt || !appVersion) {
    const err = new Error("INVALID_FORMAT");
    err.code = "INVALID_FORMAT";
    throw err;
  }
  const appName = String(parsed.appName || "").trim();
  const customerName = String(parsed.customerName || "").trim();
  const licenseId = String(parsed.licenseId || "").trim();
  const notes = String(parsed.notes || "").trim();
  return {
    filePath: String(filePath || "").trim(),
    schemaVersion: 1,
    requestType: "machine-license-request",
    product,
    machineId,
    appName,
    appVersion,
    createdAt,
    customerName,
    licenseId,
    notes,
    customerHint: String(parsed.customerHint || customerName).trim(),
  };
}

function _buildLicenseRequestPayload(raw = {}) {
  const machineId = String(raw?.machineId || "").trim();
  if (!machineId) {
    const err = new Error("MACHINE_ID_REQUIRED_FOR_BINDING");
    err.code = "MACHINE_ID_REQUIRED_FOR_BINDING";
    throw err;
  }

  const createdAt = String(raw?.createdAt || new Date().toISOString()).trim();
  const payload = {
    schemaVersion: 1,
    requestType: "machine-license-request",
    product: "bbm-protokoll",
    appName: "BBM",
    appVersion: String(raw?.appVersion || app?.getVersion?.() || "").trim(),
    createdAt,
    machineId,
    notes: String(raw?.notes || "").trim(),
  };

  const customerName = String(raw?.customerName || "").trim();
  if (customerName) payload.customerName = customerName;

  const licenseId = String(raw?.licenseId || "").trim();
  if (licenseId) payload.licenseId = licenseId;

  return payload;
}

function _toEditableLicensePayload(parsed = {}, filePath = "") {
  const license = parsed?.license && typeof parsed.license === "object" ? parsed.license : {};
  const issuedAt = String(license.issuedAt || "").trim();
  const validFrom = String(license.validFrom || "").trim() || (issuedAt ? issuedAt.slice(0, 10) : "");
  return {
    filePath: String(filePath || "").trim(),
    product: String(license.product || "").trim(),
    customerName: String(license.customerName || "").trim(),
    licenseId: String(license.licenseId || "").trim(),
    edition: String(license.edition || "").trim(),
    binding: String(license.binding || "").trim().toLowerCase() || "none",
    boundMachineId: String(license.machineId || parsed?.machineId || "").trim(),
    issuedAt,
    validFrom,
    validUntil: String(license.validUntil || "").trim(),
    trialDurationDays: _normalizeTrialDurationDays(license.trialDurationDays),
    maxDevices:
      typeof license.maxDevices === "number"
        ? license.maxDevices
        : Number.isFinite(Number(license.maxDevices))
          ? Number(license.maxDevices)
          : 1,
    features: Array.isArray(license.features) ? license.features.map((v) => String(v || "").trim()).filter(Boolean) : [],
    notes: String(license.notes || "").trim(),
  };
}

function _isDevLicenseGenerationAllowed() {
  return !app.isPackaged;
}

function _sanitizeFilePart(value, fallback = "license") {
  const clean = String(value || "").trim() || fallback;
  const withoutInvalidPathChars = clean
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return Array.from(withoutInvalidPathChars)
    .map((ch) => (ch.charCodeAt(0) < 32 ? "_" : ch))
    .join("")
    .slice(0, 120);
}

function _normalizeIsoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const ts = new Date(`${raw}T00:00:00Z`).getTime();
  if (Number.isNaN(ts)) return "";
  return raw;
}

function _computeValidUntil(validFrom, durationDays) {
  const start = _normalizeIsoDate(validFrom);
  const days = Number(durationDays);
  if (!start || !Number.isFinite(days) || days < 1) return "";
  const dt = new Date(`${start}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + Math.floor(days));
  return dt.toISOString().slice(0, 10);
}

function _normalizeTrialDurationDays(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const days = Math.floor(num);
  if (days < 1 || days > 365) return null;
  return days;
}

function _validateGenerationPayload(raw = {}) {
  const product = String(raw?.product || "bbm-protokoll").trim() || "bbm-protokoll";
  const customerName = String(raw?.customerName || "").trim();
  const licenseId = String(raw?.licenseId || "").trim();
  const edition = String(raw?.edition || "test").trim() || "test";
  const binding = String(raw?.binding || "").trim().toLowerCase() || "none";
  const validFrom = _normalizeIsoDate(raw?.validFrom);
  const durationDays =
    raw?.durationDays === "" || raw?.durationDays === null || raw?.durationDays === undefined
      ? null
      : Number(raw.durationDays);
  const explicitValidUntil = _normalizeIsoDate(raw?.validUntil);
  const validUntil = explicitValidUntil || _computeValidUntil(validFrom, durationDays);
  const trialDurationDays = _normalizeTrialDurationDays(raw?.trialDurationDays);
  const maxDevices = Number(raw?.maxDevices);
  const features = Array.isArray(raw?.features)
    ? raw.features.map((v) => String(v || "").trim()).filter(Boolean)
    : [];
  const notes = String(raw?.notes || "").trim();

  if (!customerName) throw new Error("CUSTOMER_NAME_REQUIRED");
  if (!licenseId) throw new Error("LICENSE_ID_REQUIRED");
  if (!["none", "machine"].includes(binding)) throw new Error("BINDING_INVALID");
  if (!validFrom) throw new Error("VALID_FROM_REQUIRED");
  const isTestLicense = edition === "test" && binding === "none";
  if (!isTestLicense && !validUntil) throw new Error("VALID_UNTIL_REQUIRED");
  if (isTestLicense && !trialDurationDays) throw new Error("TRIAL_DURATION_DAYS_REQUIRED");
  if (
    !isTestLicense &&
    new Date(`${validUntil}T00:00:00Z`).getTime() < new Date(`${validFrom}T00:00:00Z`).getTime()
  ) {
    throw new Error("VALID_UNTIL_BEFORE_VALID_FROM");
  }
  if (!Number.isFinite(maxDevices) || maxDevices < 1) throw new Error("MAX_DEVICES_INVALID");
  if (!features.length) throw new Error("FEATURES_REQUIRED");

  const requestedMachineId = String(raw?.machineId || "").trim();
  const currentMachineId = binding === "machine" ? requestedMachineId || String(getMachineId() || "").trim() : "";
  if (binding === "machine" && !currentMachineId) throw new Error("MACHINE_ID_REQUIRED_FOR_BINDING");

  return {
    product,
    customerName,
    licenseId,
    edition,
    binding,
    validFrom,
    validUntil: isTestLicense ? "" : validUntil,
    trialDurationDays: isTestLicense ? trialDurationDays : null,
    durationDays: Number.isFinite(durationDays) && durationDays > 0 ? Math.floor(durationDays) : null,
    maxDevices: Math.floor(maxDevices),
    features,
    notes,
    machineId: currentMachineId || "",
  };
}

async function _runLicenseTool(inputPath, { timeoutMs = 10000 } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [LICENSE_TOOL_SCRIPT, inputPath], {
      cwd: LICENSE_TOOL_ROOT,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    let timeoutHandle = null;

    const done = (result, isReject = false) => {
      if (finished) return;
      finished = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (isReject) return reject(result);
      return resolve(result);
    };

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    child.on("error", (err) => done(err, true));
    child.on("close", (code) => {
      if (code !== 0) {
        const err = new Error(stderr.trim() || stdout.trim() || `Generator fehlgeschlagen (Exit ${code}).`);
        err.code = "GENERATOR_FAILED";
        return done(err, true);
      }
      done({ stdout, stderr, exitCode: code });
    });

    timeoutHandle = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      done({ stdout, stderr, timedOut: true, exitCode: null });
    }, timeoutMs);
  });
}

function _extractGeneratedPath(runResult, inputData) {
  const text = `${runResult?.stdout || ""}\n${runResult?.stderr || ""}`;
  const match = text.match(/[A-Z]:\\[^\r\n]+\.bbmlic/);
  if (match && fs.existsSync(match[0])) return match[0];
  const fileName = `${_sanitizeFilePart(inputData.licenseId, "license")}_${_sanitizeFilePart(
    inputData.customerName,
    "customer"
  )}.bbmlic`;
  const fallbackPath = path.join(LICENSE_TOOL_OUTPUT_DIR, fileName);
  return fs.existsSync(fallbackPath) ? fallbackPath : "";
}

function _findRepoRoot(startDir) {
  let current = path.resolve(startDir || process.cwd());
  const root = path.parse(current).root;
  while (true) {
    if (fs.existsSync(path.join(current, "package.json")) && fs.existsSync(path.join(current, "scripts", "dist.cjs"))) {
      return current;
    }
    if (current === root) break;
    current = path.dirname(current);
  }
  return "";
}

function _sanitizeCustomerSlug(value, fallback = "customer") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function _buildCustomerSetupSlug(customer = {}) {
  const customerNumber = String(customer.customer_number || customer.customerNumber || "").trim();
  const companyName = String(customer.company_name || customer.companyName || "").trim();
  const combined = [customerNumber, companyName].filter(Boolean).join(" ");
  return _sanitizeCustomerSlug(combined);
}

function _isNodeRunnable(command, { spawnSyncImpl = spawnSync } = {}) {
  const candidate = String(command || "").trim();
  if (!candidate) return false;
  try {
    const probe = spawnSyncImpl(candidate, ["-v"], {
      windowsHide: true,
      stdio: "pipe",
      encoding: "utf8",
    });
    return probe && probe.status === 0;
  } catch (_err) {
    return false;
  }
}

function resolveNodeExecutableForBuild({
  env = process.env,
  existsSync = fs.existsSync,
  execPath = process.execPath,
  isElectronRuntime = !!process.versions?.electron,
  platform = process.platform,
  spawnSyncImpl = spawnSync,
} = {}) {
  const trace = [];
  const checkExistingExecutable = (label, candidate) => {
    const value = String(candidate || "").trim();
    if (!value) return "";
    if (!existsSync(value)) {
      trace.push(`${label}:missing`);
      return "";
    }
    if (!_isNodeRunnable(value, { spawnSyncImpl })) {
      trace.push(`${label}:not-runnable`);
      return "";
    }
    trace.push(`${label}:ok`);
    return value;
  };

  const npmNodeExecPath = checkExistingExecutable("npm_node_execpath", env?.npm_node_execpath);
  if (npmNodeExecPath) return { ok: true, nodeExecutable: npmNodeExecPath, trace };

  const nodeExe = checkExistingExecutable("NODE_EXE", env?.NODE_EXE);
  if (nodeExe) return { ok: true, nodeExecutable: nodeExe, trace };

  if (!isElectronRuntime) {
    const currentExec = checkExistingExecutable("process.execPath", execPath);
    if (currentExec) return { ok: true, nodeExecutable: currentExec, trace };
  } else {
    trace.push("process.execPath:skip-electron-runtime");
  }

  if (_isNodeRunnable("node", { spawnSyncImpl })) {
    trace.push("node-path:ok");
    return { ok: true, nodeExecutable: "node", trace };
  }
  trace.push("node-path:not-runnable");

  if (platform === "win32") {
    try {
      const whereResult = spawnSyncImpl("where.exe", ["node"], {
        windowsHide: true,
        stdio: "pipe",
        encoding: "utf8",
      });
      if (whereResult?.status === 0) {
        const candidates = String(whereResult.stdout || "")
          .split(/\r?\n/)
          .map((entry) => entry.trim())
          .filter(Boolean);
        for (const candidate of candidates) {
          if (_isNodeRunnable(candidate, { spawnSyncImpl })) {
            trace.push(`where.exe:ok:${candidate}`);
            return { ok: true, nodeExecutable: candidate, trace };
          }
        }
      }
      trace.push("where.exe:not-runnable");
    } catch (_err) {
      trace.push("where.exe:error");
    }
  }

  return { ok: false, error: "NODE_EXECUTABLE_NOT_FOUND", nodeExecutable: "", trace };
}

function _collectSetupArtifacts(outputDir) {
  const normalizedOutputDir = String(outputDir || "").trim();
  if (!normalizedOutputDir || !fs.existsSync(normalizedOutputDir)) return [];
  return fs
    .readdirSync(normalizedOutputDir)
    .filter((name) => name.toLowerCase().endsWith(".exe"))
    .map((name) => path.join(normalizedOutputDir, name));
}

function _writeCustomerSetupBuildLog({
  logPath,
  nodeExecutable,
  distScriptPath,
  repoRoot,
  cwd,
  outputDir,
  customerSlug,
  customerName,
  licenseFilePath,
  envSnapshot = {},
  stdout = "",
  stderr = "",
  exitCode = null,
  artifacts = [],
}) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const lines = [
      `timestamp: ${new Date().toISOString()}`,
      `nodeExecutable: ${nodeExecutable || "-"}`,
      `distScriptPath: ${distScriptPath || "-"}`,
      `repoRoot: ${repoRoot || "-"}`,
      `cwd: ${cwd || "-"}`,
      `outputDir: ${outputDir || "-"}`,
      `customerSlug: ${customerSlug || "-"}`,
      `customerName: ${customerName || "-"}`,
      `licenseFilePath: ${licenseFilePath || "-"}`,
      `exitCode: ${exitCode === null || exitCode === undefined ? "-" : exitCode}`,
      `env.BBM_CUSTOMER_LICENSE_FILE: ${envSnapshot.BBM_CUSTOMER_LICENSE_FILE || "-"}`,
      `env.BBM_CUSTOMER_SETUP_TYPE: ${envSnapshot.BBM_CUSTOMER_SETUP_TYPE || "-"}`,
      `env.BBM_CUSTOMER_SLUG: ${envSnapshot.BBM_CUSTOMER_SLUG || "-"}`,
      `env.BBM_CUSTOMER_NAME: ${envSnapshot.BBM_CUSTOMER_NAME || "-"}`,
      `artifacts: ${artifacts.length ? artifacts.join(" | ") : "-"}`,
      "",
      "stdout:",
      String(stdout || ""),
      "",
      "stderr:",
      String(stderr || ""),
    ];
    fs.writeFileSync(logPath, `${lines.join("\n")}\n`, "utf8");
  } catch (_err) {
    // ignore log-write failures
  }
}

function _resolveCustomerSetupArtifactPath(outputDir, customerSlug) {
  const normalizedOutputDir = String(outputDir || "").trim();
  if (!normalizedOutputDir || !fs.existsSync(normalizedOutputDir)) return "";
  const safeSlug = _sanitizeCustomerSlug(customerSlug || "");
  const files = fs.readdirSync(normalizedOutputDir);
  const setupFile = files.find((name) => name.toLowerCase().endsWith(".exe") && name.includes(safeSlug));
  return setupFile ? path.join(normalizedOutputDir, setupFile) : "";
}

function _validateCustomerSetupPayload(raw = {}) {
  const customer = raw?.customer && typeof raw.customer === "object" ? raw.customer : {};
  const license = raw?.license && typeof raw.license === "object" ? raw.license : {};
  const setupType = String(raw?.setupType || raw?.setup_type || "").trim().toLowerCase() === "machine" ? "machine" : "test";
  const licenseFilePath = setupType === "test" ? String(raw?.licenseFilePath || raw?.license_file_path || "").trim() : "";
  if (setupType === "test" && !licenseFilePath) throw new Error("LICENSE_FILE_PATH_REQUIRED");
  if (setupType === "test" && !fs.existsSync(licenseFilePath)) throw new Error("LICENSE_FILE_NOT_FOUND");

  const binding = String(license.license_binding || license.licenseBinding || "").trim().toLowerCase();
  const machineId = String(license.machine_id || license.machineId || "").trim();
  if (setupType !== "machine" && binding === "machine" && !machineId) {
    throw new Error("MACHINE_ID_REQUIRED_FOR_BINDING");
  }

  return {
    customer,
    license,
    setupType,
    licenseFilePath,
    customerSlug: _buildCustomerSetupSlug(customer),
    customerName: String(customer.company_name || customer.companyName || "").trim(),
  };
}

async function _runCustomerSetupBuild(payload = {}, options = {}) {
  if (app.isPackaged) return { ok: false, error: "CUSTOMER_SETUP_BUILD_NOT_ALLOWED" };
  const repoRoot = _findRepoRoot(process.cwd());
  if (!repoRoot) return { ok: false, error: "REPO_ROOT_NOT_FOUND" };
  const distScriptPath = path.join(repoRoot, "scripts", "dist.cjs");
  if (!fs.existsSync(distScriptPath)) return { ok: false, error: "DIST_SCRIPT_NOT_FOUND" };

  const validated = _validateCustomerSetupPayload(payload);
  const outputDir = path.join(repoRoot, "dist", "customers", validated.customerSlug);
  const nodeResolver = typeof options?.nodeResolver === "function" ? options.nodeResolver : resolveNodeExecutableForBuild;
  const resolvedNode = nodeResolver();
  const nodeExe = String(resolvedNode?.nodeExecutable || "").trim();
  const envForBuild = {
    ...process.env,
    BBM_CUSTOMER_SETUP_TYPE: validated.setupType,
    BBM_CUSTOMER_SLUG: validated.customerSlug,
    BBM_CUSTOMER_NAME: validated.customerName,
  };
  if (validated.setupType === "test" && validated.licenseFilePath) {
    envForBuild.BBM_CUSTOMER_LICENSE_FILE = validated.licenseFilePath;
  } else {
    delete envForBuild.BBM_CUSTOMER_LICENSE_FILE;
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const logPath = path.join(outputDir, "customer-setup-build.log");
  const timeoutMs =
    Number.isFinite(Number(options?.timeoutMs)) && Number(options.timeoutMs) > 0
      ? Math.floor(Number(options.timeoutMs))
      : 15 * 60 * 1000;
  if (!resolvedNode?.ok || !nodeExe) {
    _writeCustomerSetupBuildLog({
      logPath,
      nodeExecutable: nodeExe,
      distScriptPath,
      repoRoot,
      cwd: repoRoot,
      outputDir,
      customerSlug: validated.customerSlug,
      customerName: validated.customerName,
      licenseFilePath: validated.licenseFilePath,
      envSnapshot: envForBuild,
      stdout: "",
      stderr: String(resolvedNode?.error || "NODE_EXECUTABLE_NOT_FOUND"),
      exitCode: null,
      artifacts: _collectSetupArtifacts(outputDir),
    });
    return {
      ok: false,
      error: "NODE_EXECUTABLE_NOT_FOUND",
      nodeExecutable: nodeExe,
      nodeResolutionTrace: Array.isArray(resolvedNode?.trace) ? resolvedNode.trace : [],
      distScriptPath,
      repoRoot,
      cwd: repoRoot,
      outputDir,
      customerSlug: validated.customerSlug,
      customerName: validated.customerName,
      licenseFilePath: validated.licenseFilePath,
      exitCode: null,
      stdout: "",
      stderr: "NODE_EXECUTABLE_NOT_FOUND",
      logPath,
      env: {
        BBM_CUSTOMER_LICENSE_FILE: envForBuild.BBM_CUSTOMER_LICENSE_FILE,
        BBM_CUSTOMER_SETUP_TYPE: envForBuild.BBM_CUSTOMER_SETUP_TYPE,
        BBM_CUSTOMER_SLUG: envForBuild.BBM_CUSTOMER_SLUG,
        BBM_CUSTOMER_NAME: envForBuild.BBM_CUSTOMER_NAME,
      },
    };
  }

  return await new Promise((resolve) => {
    const child = spawn(nodeExe, [distScriptPath], {
      cwd: repoRoot,
      env: envForBuild,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    let timeoutHandle = null;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      resolve(result);
    };

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    child.on("error", (err) => {
      const localStderr = `${stderr}\n${String(err?.message || err || "")}`.trim();
      const artifacts = _collectSetupArtifacts(outputDir);
      _writeCustomerSetupBuildLog({
        logPath,
        nodeExecutable: nodeExe,
        distScriptPath,
        repoRoot,
        cwd: repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        envSnapshot: envForBuild,
        stdout,
        stderr: localStderr,
        exitCode: null,
        artifacts,
      });
      finish({
        ok: false,
        error: "CUSTOMER_SETUP_BUILD_FAILED",
        repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        exitCode: null,
        nodeExecutable: nodeExe,
        nodeResolutionTrace: Array.isArray(resolvedNode?.trace) ? resolvedNode.trace : [],
        distScriptPath,
        cwd: repoRoot,
        stdout,
        stderr: localStderr,
        logPath,
        env: {
          BBM_CUSTOMER_LICENSE_FILE: envForBuild.BBM_CUSTOMER_LICENSE_FILE,
          BBM_CUSTOMER_SETUP_TYPE: envForBuild.BBM_CUSTOMER_SETUP_TYPE,
          BBM_CUSTOMER_SLUG: envForBuild.BBM_CUSTOMER_SLUG,
          BBM_CUSTOMER_NAME: envForBuild.BBM_CUSTOMER_NAME,
        },
      });
    });

    timeoutHandle = setTimeout(() => {
      try {
        child.kill();
      } catch (_err) {
        // ignore
      }
      const artifacts = _collectSetupArtifacts(outputDir);
      _writeCustomerSetupBuildLog({
        logPath,
        nodeExecutable: nodeExe,
        distScriptPath,
        repoRoot,
        cwd: repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        envSnapshot: envForBuild,
        stdout,
        stderr,
        exitCode: null,
        artifacts,
      });
      finish({
        ok: false,
        error: "CUSTOMER_SETUP_BUILD_TIMEOUT",
        repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        exitCode: null,
        nodeExecutable: nodeExe,
        nodeResolutionTrace: Array.isArray(resolvedNode?.trace) ? resolvedNode.trace : [],
        distScriptPath,
        cwd: repoRoot,
        stdout,
        stderr,
        logPath,
        env: {
          BBM_CUSTOMER_LICENSE_FILE: envForBuild.BBM_CUSTOMER_LICENSE_FILE,
          BBM_CUSTOMER_SETUP_TYPE: envForBuild.BBM_CUSTOMER_SETUP_TYPE,
          BBM_CUSTOMER_SLUG: envForBuild.BBM_CUSTOMER_SLUG,
          BBM_CUSTOMER_NAME: envForBuild.BBM_CUSTOMER_NAME,
        },
        artifacts,
      });
    }, timeoutMs);

    child.on("close", (code) => {
      const artifactPath = _resolveCustomerSetupArtifactPath(outputDir, validated.customerSlug);
      const artifacts = _collectSetupArtifacts(outputDir);
      const diagnostics = {
        repoRoot,
        distScriptPath,
        cwd: repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        exitCode: code,
        nodeExecutable: nodeExe,
        nodeResolutionTrace: Array.isArray(resolvedNode?.trace) ? resolvedNode.trace : [],
        stdout,
        stderr,
        logPath,
        env: {
          BBM_CUSTOMER_LICENSE_FILE: envForBuild.BBM_CUSTOMER_LICENSE_FILE,
          BBM_CUSTOMER_SETUP_TYPE: envForBuild.BBM_CUSTOMER_SETUP_TYPE,
          BBM_CUSTOMER_SLUG: envForBuild.BBM_CUSTOMER_SLUG,
          BBM_CUSTOMER_NAME: envForBuild.BBM_CUSTOMER_NAME,
        },
        artifacts,
      };
      _writeCustomerSetupBuildLog({
        logPath,
        nodeExecutable: nodeExe,
        distScriptPath,
        repoRoot,
        cwd: repoRoot,
        outputDir,
        customerSlug: validated.customerSlug,
        customerName: validated.customerName,
        licenseFilePath: validated.licenseFilePath,
        envSnapshot: envForBuild,
        stdout,
        stderr,
        exitCode: code,
        artifacts,
      });
      if (code !== 0) {
        const text = `${stdout}\n${stderr}`.toUpperCase();
        const mappedError = text.includes("ELECTRON_BUILDER_NOT_FOUND")
          ? "ELECTRON_BUILDER_NOT_FOUND"
          : "CUSTOMER_SETUP_BUILD_FAILED";
        finish({ ok: false, error: mappedError, ...diagnostics });
        return;
      }
      const hasOutputDir = fs.existsSync(outputDir);
      const hasArtifact = !!artifactPath && fs.existsSync(artifactPath);
      const pathHasSlug = hasArtifact && artifactPath.includes(validated.customerSlug);
      if (!hasOutputDir || !hasArtifact || !pathHasSlug) {
        finish({
          ok: false,
          error: "CUSTOMER_SETUP_ARTIFACT_NOT_FOUND",
          setupPath: artifactPath,
          artifactPath,
          ...diagnostics,
        });
        return;
      }
      finish({
        ok: true,
        outputDir,
        setupPath: artifactPath,
        artifactPath,
        customerSlug: validated.customerSlug,
        ...diagnostics,
      });
    });
  });
}

// Zentrale Laufzeit-/Diagnose-Einstiege des App-Kerns.
function registerLicenseStatusIpc() {
  ipcMain.handle("license:get-status", async () => {
    try {
      const status = refreshStatus();
      const payload = _toStatusPayload(status);
      console.log("[LICENSE] get-status", {
        valid: payload.valid,
        reason: payload.reason || null,
        licenseId: payload.licenseId || null,
      });
      return { ok: true, ...payload };
    } catch (err) {
      const payload = _toStatusPayload({ valid: false, reason: "INVALID_FORMAT" });
      return { ok: false, error: err?.message || String(err), ...payload };
    }
  });

  ipcMain.handle("license:get-diagnostics", async () => {
    try {
      const payload = _toStatusPayload(refreshStatus());
      return { ok: true, ...payload };
    } catch (err) {
      const payload = _toStatusPayload({ valid: false, reason: "INVALID_FORMAT" });
      return { ok: false, error: err?.message || String(err), ...payload };
    }
  });
}

// Zentrale Lizenzverwaltung fuer installierte Lizenzen und Anforderungsdateien.
function registerLicenseInstallationIpc() {
  ipcMain.handle("license:import", async (event) => {
    try {
      const result = await dialog.showOpenDialog(_pickWindow(event), {
        title: "Lizenzdatei auswaehlen",
        properties: ["openFile"],
        filters: LICENSE_FILE_FILTER,
      });

      if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
        return { ok: true, canceled: true };
      }

      const filePath = String(result.filePaths[0] || "").trim();
      console.log("[LICENSE] import:selected-file", { filePath });

      const parsed = _readLicenseFile(filePath);
      console.log("[LICENSE] import:json-read", {
        product: parsed?.license?.product || null,
        licenseId: parsed?.license?.licenseId || null,
        hasSignature: !!parsed?.signature,
      });

      const verification = verifyLicense(parsed);
      console.log("[LICENSE] import:verifyLicense", {
        valid: !!verification?.valid,
        reason: verification?.reason || null,
        product: parsed?.license?.product || null,
        licenseId: parsed?.license?.licenseId || null,
      });

      if (!verification.valid) {
        return {
          ok: false,
          error: verification.reason || "INVALID_FORMAT",
          reason: verification.reason || "INVALID_FORMAT",
          ..._toStatusPayload(verification),
        };
      }

      const stored = saveLicense(parsed);
      console.log("[LICENSE] import:saveLicense", {
        ok: !!stored,
        machineId: stored?.machineId || null,
        licenseId: stored?.license?.licenseId || null,
      });

      const refreshed = refreshStatus();
      console.log("[LICENSE] import:refreshStatus", {
        valid: !!refreshed?.valid,
        reason: refreshed?.reason || null,
        machineId: refreshed?.machineId || null,
      });

      return {
        ok: true,
        filePath,
        ..._toStatusPayload(refreshed),
      };
    } catch (err) {
      const reason = String(err?.code || err?.message || "INVALID_FORMAT").trim() || "INVALID_FORMAT";
      console.error("[LICENSE] import:error", {
        error: err?.stack || err?.message || String(err),
      });
      return {
        ok: false,
        error: reason,
        reason,
        ..._toStatusPayload({ valid: false, reason }),
      };
    }
  });

  ipcMain.handle("license:delete", async () => {
    try {
      deleteLicense();
      const status = refreshStatus();
      return { ok: true, ..._toStatusPayload(status) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("license:get-installed", async () => {
    try {
      const license = loadLicense();
      return { ok: true, license };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("license:create-request", async (event, raw) => {
    try {
      const installed = loadLicense();
      const installedLicense =
        installed?.license && typeof installed.license === "object" ? installed.license : {};
      const payload = _buildLicenseRequestPayload({
        machineId: getMachineId(),
        appVersion: app?.getVersion?.(),
        customerName:
          String(raw?.customerName || "").trim() ||
          String(installedLicense.customerName || installedLicense.customer || "").trim(),
        licenseId: String(raw?.licenseId || "").trim() || String(installedLicense.licenseId || "").trim(),
        notes: raw?.notes,
      });

      const result = await dialog.showSaveDialog(_pickWindow(event), {
        title: "Lizenzanforderung speichern",
        defaultPath: "bbm-license-request.json",
        filters: [{ name: "Lizenzanforderung", extensions: ["json"] }],
      });
      if (result.canceled || !result.filePath) return { ok: false, canceled: true };

      await fs.promises.writeFile(result.filePath, JSON.stringify(payload, null, 2), "utf8");
      return { ok: true, filePath: result.filePath };
    } catch (err) {
      return { ok: false, error: String(err?.code || err?.message || "REQUEST_SAVE_FAILED").trim() || "REQUEST_SAVE_FAILED" };
    }
  });
}

// Dev-/Werkzeuglogik:
// nur fuer den internen Generatorfluss, bewusst getrennt von installierter Laufzeitlizenzierung.
function registerLicenseDevGeneratorIpc() {
  ipcMain.handle("license:load-request-for-generate", async (event) => {
    if (!_isDevLicenseGenerationAllowed()) {
      return { ok: false, error: "LICENSE_GENERATION_NOT_ALLOWED" };
    }
    try {
      const result = await dialog.showOpenDialog(_pickWindow(event), {
        title: "Lizenzanforderung laden",
        properties: ["openFile"],
        filters: [{ name: "Lizenzanforderung", extensions: ["json"] }],
      });
      if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
        return { ok: true, canceled: true };
      }
      return { ok: true, ..._readLicenseRequestFile(String(result.filePaths[0] || "").trim()) };
    } catch (err) {
      const reason = String(err?.code || err?.message || "INVALID_FORMAT").trim() || "INVALID_FORMAT";
      return { ok: false, error: reason };
    }
  });

  ipcMain.handle("license:load-for-edit", async (event) => {
    if (!_isDevLicenseGenerationAllowed()) {
      return { ok: false, error: "LICENSE_GENERATION_NOT_ALLOWED" };
    }
    try {
      const result = await dialog.showOpenDialog(_pickWindow(event), {
        title: "Bestehende Lizenz laden",
        properties: ["openFile"],
        filters: LICENSE_FILE_FILTER,
      });
      if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
        return { ok: true, canceled: true };
      }
      const filePath = String(result.filePaths[0] || "").trim();
      const parsed = _readLicenseFile(filePath);
      return {
        ok: true,
        ..._toEditableLicensePayload(parsed, filePath),
      };
    } catch (err) {
      const reason = String(err?.code || err?.message || "INVALID_FORMAT").trim() || "INVALID_FORMAT";
      return { ok: false, error: reason };
    }
  });

  ipcMain.handle("license:generate", async (_event, raw) => {
    if (!_isDevLicenseGenerationAllowed()) {
      return { ok: false, error: "LICENSE_GENERATION_NOT_ALLOWED" };
    }

    try {
      if (!fs.existsSync(LICENSE_TOOL_ROOT)) return { ok: false, error: "LICENSE_TOOL_NOT_FOUND" };
      if (!fs.existsSync(LICENSE_TOOL_SCRIPT)) return { ok: false, error: "LICENSE_TOOL_SCRIPT_MISSING" };
      if (!fs.existsSync(LICENSE_TOOL_PRIVATE_KEY)) return { ok: false, error: "PRIVATE_KEY_MISSING" };

      const inputData = _validateGenerationPayload(raw || {});
      await fs.promises.mkdir(LICENSE_TOOL_INPUT_DIR, { recursive: true });
      await fs.promises.mkdir(LICENSE_TOOL_OUTPUT_DIR, { recursive: true });

      const inputFileName = `${Date.now()}-${_sanitizeFilePart(inputData.licenseId, "license")}.json`;
      const inputPath = path.join(LICENSE_TOOL_INPUT_DIR, inputFileName);
      await fs.promises.writeFile(
        inputPath,
        JSON.stringify(
          {
            product: inputData.product,
            customerName: inputData.customerName,
            licenseId: inputData.licenseId,
            edition: inputData.edition,
            binding: inputData.binding,
            validFrom: inputData.validFrom,
            validUntil: inputData.validUntil,
            ...(inputData.trialDurationDays ? { trialDurationDays: inputData.trialDurationDays } : {}),
            maxDevices: inputData.maxDevices,
            features: inputData.features,
            notes: inputData.notes,
            ...(inputData.binding === "machine" && inputData.machineId
              ? { machineId: inputData.machineId }
              : {}),
          },
          null,
          2
        ),
        "utf8"
      );

      const runResult = await _runLicenseTool(inputPath);
      const outputPath = _extractGeneratedPath(runResult, inputData);
      if (!outputPath) {
        if (runResult?.timedOut) {
          return { ok: false, error: "GENERATOR_TIMEOUT" };
        }
        return { ok: false, error: "OUTPUT_FILE_NOT_FOUND" };
      }

      return {
        ok: true,
        inputPath,
        outputPath,
        outputDir: LICENSE_TOOL_OUTPUT_DIR,
        customerName: inputData.customerName,
        licenseId: inputData.licenseId,
        binding: inputData.binding,
        machineId: inputData.binding === "machine" ? inputData.machineId : "",
        validFrom: inputData.validFrom,
        validUntil: inputData.validUntil,
        trialDurationDays: inputData.trialDurationDays,
        features: inputData.features,
      };
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message || err || "LICENSE_GENERATION_FAILED").trim() || "LICENSE_GENERATION_FAILED",
      };
    }
  });

  ipcMain.handle("license:open-output-dir", async (_event, raw) => {
    if (!_isDevLicenseGenerationAllowed()) {
      return { ok: false, error: "LICENSE_GENERATION_NOT_ALLOWED" };
    }
    const outputPath = String(raw?.outputPath || "").trim();
    const dirPath = outputPath ? path.dirname(outputPath) : LICENSE_TOOL_OUTPUT_DIR;
    try {
      const result = await shell.openPath(dirPath);
      if (result) return { ok: false, error: result };
      return { ok: true, dirPath };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });
}

function registerLicenseAdminDataIpc() {
  ipcMain.handle("license-admin:list-customers", async () => {
    return licenseAdminService.listCustomers();
  });

  ipcMain.handle("license-admin:save-customer", async (_event, customer) => {
    return licenseAdminService.saveCustomer(customer || {});
  });

  ipcMain.handle("license-admin:list-records", async () => {
    return licenseAdminService.listLicenses();
  });

  ipcMain.handle("license-admin:list-records-by-customer", async (_event, customerId) => {
    return licenseAdminService.listLicensesByCustomer(customerId);
  });

  ipcMain.handle("license-admin:save-record", async (_event, license) => {
    return licenseAdminService.saveLicense(license || {});
  });

  ipcMain.handle("license-admin:list-history", async () => {
    return licenseAdminService.listHistory();
  });

  ipcMain.handle("license-admin:add-history-entry", async (_event, entry) => {
    return licenseAdminService.addHistoryEntry(entry || {});
  });

  ipcMain.handle("license-admin:create-customer-setup", async (_event, payload) => {
    try {
      return await _runCustomerSetupBuild(payload || {});
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message || err || "CUSTOMER_SETUP_BUILD_FAILED").trim() || "CUSTOMER_SETUP_BUILD_FAILED",
      };
    }
  });

  ipcMain.handle("license-admin:import-license-request", async (event) => {
    try {
      const result = await dialog.showOpenDialog(_pickWindow(event), {
        title: "Lizenzanforderung importieren",
        properties: ["openFile"],
        filters: [{ name: "Lizenzanforderung", extensions: ["json"] }],
      });
      if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
        return { ok: false, canceled: true };
      }
      const request = _readLicenseRequestFile(String(result.filePaths[0] || "").trim());
      return { ok: true, request };
    } catch (err) {
      return {
        ok: false,
        error: String(err?.code || err?.message || "INVALID_FORMAT").trim() || "INVALID_FORMAT",
      };
    }
  });
}

function registerLicenseIpc() {
  registerLicenseStatusIpc();
  registerLicenseInstallationIpc();
  registerLicenseDevGeneratorIpc();
  registerLicenseAdminDataIpc();
}

module.exports = {
  registerLicenseIpc,
  _buildCustomerSetupSlug,
  _validateGenerationPayload,
  _buildLicenseRequestPayload,
  resolveNodeExecutableForBuild,
  _validateCustomerSetupPayload,
  _runCustomerSetupBuild,
};
