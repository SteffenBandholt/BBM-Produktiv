"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { getModuleDefinition } = require("../moduleRegistry");

const READY = "BBM_OUTLOOK_MODAL_READY";
const CLOSED = "BBM_OUTLOOK_MODAL_CLOSED";
const TASK_SAVED = "BBM_OUTLOOK_TASK_SAVED";

// Native Outlook/Electron dialogs are technical host UI, not layout-editor targets.
// The module supplies all domain text. No Send(), sent-mail inspection or BBM history.
function buildDraftScript() {
  return [
    'param([string]$PayloadPath)',
    '$ErrorActionPreference = "Stop"',
    '$payload = ConvertFrom-Json (Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8)',
    '$outlook = New-Object -ComObject Outlook.Application',
    '$mail = $outlook.CreateItem(0)',
    '$inspector = $mail.GetInspector',
    '$account = $mail.SendUsingAccount',
    'if ($null -eq $account -and $outlook.Session.Accounts.Count -eq 1) { $account = $outlook.Session.Accounts.Item(1) }',
    '$address = if ($null -ne $account) { [string]$account.SmtpAddress } else { "" }',
    'if ($address -notmatch "^[^\\s@;,<>]+@[^\\s@;,<>]+\\.[^\\s@;,<>]+$") { throw "Outlook-Absenderadresse nicht eindeutig ermittelbar. Bitte das Standard-Sendekonto in Outlook pruefen." }',
    '$mail.To = [string]$payload.to',
    '$mail.Subject = [string]$payload.subject',
    '$mail.Body = ([string]$payload.body).Replace([string]$payload.returnAddressToken, $address)',
    'foreach ($att in $payload.attachments) {',
    '  if (-not (Test-Path -LiteralPath $att -PathType Leaf)) { throw "Anhang nicht gefunden." }',
    '  [void]$mail.Attachments.Add([string]$att)',
    '}',
    // READY is not proof of an open draft. It only ends the startup deadline.
    `Write-Output "${READY}"`,
    '[Console]::Out.Flush()',
    '$mail.Display($true)',
    `Write-Output "${CLOSED}"`,
    '',
  ].join("\r\n");
}

function buildTaskScript() {
  return [
    'param([string]$PayloadPath)',
    '$ErrorActionPreference = "Stop"',
    '$payload = ConvertFrom-Json (Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8)',
    '$due = [DateTime]::ParseExact([string]$payload.returnRequestedBy, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)',
    '$outlook = New-Object -ComObject Outlook.Application',
    '$task = $outlook.CreateItem(3)',
    '$task.Subject = [string]$payload.subject',
    '$task.Body = [string]$payload.body',
    '$task.StartDate = $due.Date',
    '$task.DueDate = $due.Date',
    '$task.ReminderTime = $due.Date.AddHours(9)',
    '$task.ReminderSet = $true',
    '$task.Save()',
    `Write-Output "${TASK_SAVED}"`,
    '',
  ].join("\r\n");
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
function invalid(message) { return Object.assign(new Error(message), { code: "MAIL_REQUEST_INVALID" }); }
function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw invalid("Mail-Auftrag fehlt.");
  const moduleId = payload.moduleId;
  if (typeof moduleId !== "string" || !moduleId || moduleId !== moduleId.trim().toLowerCase() ||
      !getModuleDefinition(moduleId)?.requiredCapabilities?.includes("mail")) {
    throw Object.assign(new Error("Modul besitzt keine Mail-Capability."), { code: "MAIL_CAPABILITY_MISSING" });
  }
  return moduleId;
}
function normalize(payload) {
  const to = (Array.isArray(payload.to) ? payload.to : String(payload.to || "").split(/[;,]/))
    .map(value => String(value || "").trim()).filter(Boolean);
  if (!to.length || to.length > 100 || to.some(value => value.length > 320 || !/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/.test(value))) throw invalid("Gueltige Empfaengeradresse erforderlich.");
  for (const subject of [payload.subject, payload.reminder?.subject]) {
    if (typeof subject !== "string" || !subject.trim() || subject.length > 1000 || /[\r\n\0]/.test(subject)) throw invalid("Gueltiger Betreff erforderlich.");
  }
  for (const body of [payload.body, payload.reminder?.body]) {
    if (typeof body !== "string" || body.length > 50000 || body.includes("\0")) throw invalid("Ungueltiger Nachrichtentext.");
  }
  if (!validDate(payload.returnRequestedBy)) throw invalid("Gueltiges Rueckgabedatum erforderlich.");
  if (typeof payload.returnAddressToken !== "string" || !payload.returnAddressToken || payload.returnAddressToken.length > 100 ||
      !payload.body.includes(payload.returnAddressToken)) throw invalid("Platzhalter fuer die Ruecksendeadresse fehlt.");
  if (!Array.isArray(payload.attachments) || !payload.attachments.length) throw invalid("PDF-Anhang fehlt.");
  const attachments = [...new Map(payload.attachments.map(file => {
    if (typeof file !== "string" || !path.isAbsolute(file) || !fs.statSync(file).isFile()) throw invalid("Anhang muss eine vorhandene Datei mit absolutem Pfad sein.");
    fs.accessSync(file, fs.constants.R_OK);
    return [file.toLowerCase(), file];
  })).values()];
  return { to: [...new Set(to)].join("; "), subject: payload.subject.trim(), body: payload.body,
    attachments, returnAddressToken: payload.returnAddressToken };
}

function createOutlookReminderDraftHandler({ app, enforce, licenseError, showMessageBox,
  platform = process.platform, spawnImpl = spawn, timeoutMs = 60000 } = {}) {
  async function execute(script, data, successMarker, waitForUser = false) {
    const directory = fs.mkdtempSync(path.join(app.getPath("temp"), "bbm-outlook-reminder-"));
    try {
      const scriptPath = path.join(directory, "outlook.ps1"), payloadPath = path.join(directory, "payload.json");
      fs.writeFileSync(scriptPath, "\uFEFF" + script, "utf8");
      fs.writeFileSync(payloadPath, JSON.stringify(data), { encoding: "utf8", mode: 0o600 });
      return await new Promise((resolve, reject) => {
        let settled = false, stdout = "", stderr = "", timer;
        const child = spawnImpl("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-File", scriptPath, "-PayloadPath", payloadPath],
          { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
        const finish = (error) => {
          if (settled) return;
          settled = true; clearTimeout(timer); app.removeListener?.("before-quit", onQuit);
          if (error) reject(error); else resolve();
        };
        const onQuit = () => {
          finish(Object.assign(new Error("Outlook-Vorgang wegen BBM-Beendigung abgebrochen."), { code: "MAIL_APP_CLOSED" }));
          try { child.kill(); } catch (_) { /* Never close Outlook itself. */ }
        };
        app.once?.("before-quit", onQuit);
        timer = setTimeout(() => {
          finish(Object.assign(new Error("Outlook hat den Vorgang nicht bestaetigt."), { code: "MAIL_OUTLOOK_TIMEOUT" }));
          try { child.kill(); } catch (_) { /* No successful result inferred. */ }
        }, timeoutMs);
        child.on("error", error => finish(error));
        child.stdout?.on("data", chunk => {
          stdout = (stdout + String(chunk)).slice(-8192);
          if (waitForUser && stdout.split(/\r?\n/).includes(READY)) clearTimeout(timer);
        });
        child.stderr?.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-8192); });
        child.on("close", code => finish(code === 0 && stdout.split(/\r?\n/).includes(successMarker)
          ? null : Object.assign(new Error(stderr.trim() || "Outlook hat den Vorgang nicht bestaetigt."), { code: "MAIL_OUTLOOK_NOT_CONFIRMED" })));
      });
    } finally {
      try { fs.rmSync(directory, { recursive: true, force: true }); } catch (_) { /* Own temporary transport files only. */ }
    }
  }
  return async function openReminderDraft(_event, payload) {
    let closed = false, quitting = false;
    // Cover the whole operation, including the native question when no child is
    // running. An answer arriving during app shutdown must not create a task.
    const onQuitting = () => { quitting = true; };
    const requireRunning = () => {
      if (quitting) throw Object.assign(new Error("Outlook-Vorgang wegen BBM-Beendigung abgebrochen."), { code: "MAIL_APP_CLOSED" });
    };
    app.once?.("before-quit", onQuitting);
    try {
      const moduleId = validate(payload);
      enforce(moduleId);
      if (platform !== "win32") return { ok: false, code: "MAIL_PLATFORM_UNSUPPORTED", error: "Outlook ist nur unter Windows verfuegbar." };
      const data = normalize(payload);
      requireRunning();
      await execute(buildDraftScript(), data, CLOSED, true);
      closed = true;
      requireRunning();
      const [year, month, day] = payload.returnRequestedBy.split("-");
      const answer = await showMessageBox({ type: "question", title: "Erinnerung erstellen?",
        message: `Erinnerung „${payload.reminder.subject}“ zum ${day}.${month}.${year} in Outlook erstellen?`,
        detail: "Die Erinnerung wird um 09:00 Uhr faellig.", buttons: ["Ja", "Nein"], defaultId: 1, cancelId: 1, noLink: true });
      requireRunning();
      if (answer?.response !== 0) return { ok: true, outcome: "draft-closed", transport: "outlook", reminder: "declined" };
      enforce(moduleId);
      requireRunning();
      await execute(buildTaskScript(), { subject: payload.reminder.subject.trim(), body: payload.reminder.body,
        returnRequestedBy: payload.returnRequestedBy }, TASK_SAVED);
      return { ok: true, outcome: "draft-closed", transport: "outlook", reminder: "created" };
    } catch (error) {
      const licensed = error?.licenseError || /^(LICENSE_|FEATURE_NOT_ALLOWED:)/.test(String(error?.message || ""));
      const failure = licensed && licenseError ? licenseError(error) : { ok: false, code: error?.code || "MAIL_OUTLOOK_FAILED", error: error?.message || String(error) };
      return { ...failure, ...(closed ? { outcome: "draft-closed", transport: "outlook", reminder: "failed" } : {}) };
    } finally {
      app.removeListener?.("before-quit", onQuitting);
    }
  };
}

module.exports = { createOutlookReminderDraftHandler, buildDraftScript, buildTaskScript, READY, CLOSED, TASK_SAVED };
