const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { getModuleDefinition } = require("../moduleRegistry");

function _normalizeMailRecipients(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[;,]/)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function _normalizeMailAttachmentPaths(payload) {
  const attachmentPath = String(payload?.attachmentPath || "").trim();
  const attachments = Array.isArray(payload?.attachments)
    ? payload.attachments.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const combined = [...attachments];
  if (attachmentPath) combined.push(attachmentPath);

  const deduped = [];
  const seen = new Set();
  for (const filePath of combined) {
    const key = filePath.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(filePath);
  }
  return deduped;
}

const DRAFT_MARKER = "BBM_OUTLOOK_DRAFT_OPENED";

function buildOutlookDraftScript() {
  return [
    'param([string]$PayloadPath)',
    '$ErrorActionPreference = "Stop"',
    '$json = Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8',
    '$payload = ConvertFrom-Json -InputObject $json',
    '$outlook = New-Object -ComObject Outlook.Application',
    '$mail = $outlook.CreateItem(0)',
    '$mail.To = [string]$payload.to',
    '$mail.Subject = [string]$payload.subject',
    '$mail.Body = [string]$payload.body',
    'foreach ($att in $payload.attachments) {',
    '  if (-not (Test-Path -LiteralPath $att -PathType Leaf)) { throw "Anhang nicht gefunden." }',
    '  [void]$mail.Attachments.Add([string]$att)',
    '}',
    '$mail.Display()',
    `Write-Output "${DRAFT_MARKER}"`,
    '',
  ].join("\r\n");
}

// One existing Windows/Outlook adapter. No Send(), send observation or history.
function createOutlookDraftHandler({ app, enforce, licenseError, platform = process.platform,
  spawnImpl = spawn, timeoutMs = 60000 } = {}) {
  return async function createOutlookDraft(_event, payload = {}) {
    let directory;
    try {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return { ok: false, code: "MAIL_REQUEST_INVALID", error: "Mail-Auftrag fehlt." };
      }
      // Only omission preserves the historical caller. Explicit invalid identities
      // must never fall back to another module's permission.
      const moduleId = Object.hasOwn(payload, "moduleId") ? payload.moduleId : "protokoll";
      if (typeof moduleId !== "string" || !moduleId || moduleId !== moduleId.trim().toLowerCase() ||
          !getModuleDefinition(moduleId)?.requiredCapabilities?.includes("mail")) {
        return { ok: false, blocked: true, code: "MAIL_CAPABILITY_MISSING", error: "Modul besitzt keine Mail-Capability." };
      }
      enforce(moduleId);
      if (platform !== "win32") return { ok: false, code: "MAIL_PLATFORM_UNSUPPORTED", error: "Outlook-Entwurf ist nur unter Windows verfügbar." };
      const attachments = _normalizeMailAttachmentPaths(payload);
      if (!attachments.length) return { ok: false, code: "MAIL_ATTACHMENT_REQUIRED", error: "Anhangspfad fehlt." };
      for (const file of attachments) {
        if (!path.isAbsolute(file) || !fs.statSync(file).isFile()) {
          return { ok: false, code: "MAIL_ATTACHMENT_INVALID", error: "Anhang muss eine vorhandene Datei mit absolutem Pfad sein." };
        }
        fs.accessSync(file, fs.constants.R_OK);
      }
      const data = { to: _normalizeMailRecipients(payload.to).join("; "),
        subject: String(payload.subject || "").trim(), body: String(payload.body || ""), attachments };
      directory = fs.mkdtempSync(path.join(app.getPath("temp"), "bbm-outlook-draft-"));
      const scriptPath = path.join(directory, "draft.ps1");
      fs.writeFileSync(scriptPath, "\uFEFF" + buildOutlookDraftScript(), "utf8");
      const payloadPath = path.join(directory, "payload.json");
      fs.writeFileSync(payloadPath, JSON.stringify(data), { encoding: "utf8", mode: 0o600 });
      const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-File", scriptPath,
        "-PayloadPath", payloadPath];
      return await new Promise((resolve) => {
        let settled = false;
        let stderr = "";
        let stdout = "";
        const child = spawnImpl("powershell.exe", args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
        const finish = (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(result);
        };
        const timer = setTimeout(() => {
          finish({ ok: false, code: "MAIL_DRAFT_TIMEOUT", error: "Öffnen des Outlook-Entwurfs wurde nicht bestätigt." });
          try { child.kill(); } catch (_err) { /* no success inferred */ }
        }, timeoutMs);
        child.on("error", (err) => finish({ ok: false, error: err.message }));
        child.stdout?.on("data", (chunk) => { stdout = (stdout + String(chunk)).slice(-8192); });
        child.stderr?.on("data", (chunk) => { stderr = (stderr + String(chunk)).slice(-8192); });
        child.on("close", (code) => {
          if (code === 0 && stdout.split(/\r?\n/).includes(DRAFT_MARKER)) {
            finish({ ok: true, outcome: "draft-opened", transport: "outlook" });
          } else {
            finish({ ok: false, code: "MAIL_DRAFT_NOT_CONFIRMED", error: stderr.trim() || "Outlook-Entwurf wurde nicht bestätigt." });
          }
        });
      });
    } catch (err) {
      if (err?.licenseError || /^(LICENSE_|FEATURE_NOT_ALLOWED:)/.test(String(err?.message || ""))) {
        return licenseError(err);
      }
      return { ok: false, error: err?.message || String(err) };
    } finally {
      if (directory) { try { fs.rmSync(directory, { recursive: true, force: true }); } catch (_err) { /* temporary script only */ } }
    }
  };
}

function registerMailIpc(options = {}) {
  const { app, ipcMain } = require("electron");
  const { enforceLicensedFeature, toLicenseErrorPayload } = require("../licensing/featureGuard");
  ipcMain.handle("mail:createOutlookDraft", createOutlookDraftHandler({ app,
    enforce: enforceLicensedFeature, licenseError: toLicenseErrorPayload, ...options }));
}

module.exports = { registerMailIpc, createOutlookDraftHandler, buildOutlookDraftScript, DRAFT_MARKER };
