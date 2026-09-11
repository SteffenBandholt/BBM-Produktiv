"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, createHash } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const projectsRepo = require("../../db/projectsRepo");
const { enforceLicensedFeature, toLicenseErrorPayload } = require("../../licensing/featureGuard");
const { createProjectStorageAccess } = require("../../ipc/projectStoragePaths");
const { createOutlookDraftHandler } = require("../../ipc/mailIpc");
const { SigekoDocumentsRepository } = require("../../db/sigekoDocumentsRepo");
const { SigekoPreNotificationWorkflowsRepository } = require("../../db/sigekoPreNotificationWorkflowsRepo");
const { createProjectAuthorityService } = require("./ProjectAuthorityService");
const { parseSigekoDocumentFiles } = require("../../../shared/sigeko/documents.cjs");
const { parseSignedReturnFile, workflowStatus } = require("../../../shared/sigeko/preNotificationWorkflows.cjs");
const { validCalendarDate } = require("../../../shared/sigeko/preNotifications.cjs");
const { PROJECT_AUTHORITY_COLUMNS } = require("../../../shared/sigeko/projectAuthorities.cjs");
const { inspectDocumentFile } = require("./preNotificationDocumentFiles");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function request(payload, keys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Reflect.ownKeys(payload).length !== keys.length || keys.some(key => !Object.hasOwn(payload, key))) fail("INVALID_INPUT", "Ungültiger Rücklauf-/Mailauftrag.");
  for (const key of ["projectId", "documentId"]) if (typeof payload[key] !== "string" || !payload[key].trim() || payload[key] !== payload[key].trim()) fail("INVALID_INPUT", "Projekt und Fassung sind erforderlich.");
}
function deadline(value) {
  if (value !== null && (typeof value !== "string" || !validCalendarDate(value))) fail("INVALID_INPUT", "Erbetener Rücklauf muss ein gültiges Kalenderdatum sein.");
  return value;
}
function purpose(value) { if (!["signature", "authority"].includes(value)) fail("INVALID_INPUT", "Unbekannter Mailvorgang."); return value; }
function recipients(values) {
  if (!Array.isArray(values) || !values.length || values.length > 100 || values.some(value => typeof value !== "string" || value.length > 320 || !/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/.test(value))) fail("INVALID_INPUT", "Mindestens eine gültige Empfängeradresse erforderlich.");
  return [...new Map(values.map(value => [value.toLowerCase(), value])).values()];
}
function createPreNotificationWorkflowService({ repo = new SigekoPreNotificationWorkflowsRepository(),
  documents = new SigekoDocumentsRepository(), projects = projectsRepo, storage = createProjectStorageAccess(),
  authorities = createProjectAuthorityService(), enforce = enforceLicensedFeature,
  chooseFile = () => require("electron").dialog.showOpenDialog({ title: "Unterschriebenes PDF zuordnen", properties: ["openFile"], filters: [{ name: "PDF", extensions: ["pdf"] }] }),
  open = payload => require("../../ipc/printIpc").openInternalPdfPreview(payload),
  tempDirectory = () => require("electron").app.getPath("temp"),
  mail = null, reminderMail = null, uuid = randomUUID, clock = () => new Date().toISOString() } = {}) {
  const jobs = new Set();
  const pathsFor = projectId => storage.resolve({ moduleId: "sigeko", projectId });
  function context(payload, writing = false) {
    enforce("sigeko");
    const project = projects.getById(payload.projectId);
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    const document = documents.get(payload.projectId, payload.documentId);
    if (!document) fail("SIGEKO_DOCUMENT_NOT_FOUND", "Gespeicherte Fassung gehört nicht zu diesem Projekt oder fehlt.");
    return { project, document, row: repo.get(payload.projectId, payload.documentId), paths: pathsFor(payload.projectId) };
  }
  function checkRevision(ctx, expectedRevision) {
    if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) fail("INVALID_INPUT", "Ungültige Vorgangsrevision.");
    if ((ctx.row?.revision ?? null) !== expectedRevision) fail("PRE_NOTIFICATION_WORKFLOW_CONFLICT", "Der Vorgang wurde geändert. Bitte erneut laden.");
  }
  function guard(payload, original) {
    const current = context(payload, true);
    checkRevision(current, original.row?.revision ?? null);
    if (!isDeepStrictEqual(current.project, original.project) || !isDeepStrictEqual(current.paths, original.paths) || !isDeepStrictEqual(current.document, original.document) || !isDeepStrictEqual(current.row, original.row)) fail("PRE_NOTIFICATION_SOURCE_CHANGED", "Projekt, Fassung oder Ablage wurde geändert. Bitte erneut laden.");
    return current;
  }
  function dto(ctx) {
    const row = ctx.row;
    return { projectId: ctx.document.project_id, documentId: ctx.document.id, revision: row?.revision ?? null,
      status: workflowStatus(row), signedFile: row ? parseSignedReturnFile(row) : null,
      signedReceivedAt: row?.signed_received_at ?? null, signatureOpenedAt: row?.signature_opened_at ?? null,
      authorityOpenedAt: row?.authority_opened_at ?? null, returnRequestedBy: row?.return_requested_by ?? null, canWrite: !ctx.project.archived_at };
  }
  function next(ctx, patch, time) {
    return { document_id: ctx.document.id, project_id: ctx.document.project_id, signed_file_json: null,
      signed_received_at: null, signature_opened_at: null, authority_opened_at: null, return_requested_by: null,
      created_at: time, returned_on: null, authority_sent_on: null, ...ctx.row, ...patch, revision: (ctx.row?.revision || 0) + 1, updated_at: time };
  }
  function signed(ctx) {
    const file = ctx.row && parseSignedReturnFile(ctx.row);
    if (!file) fail("SIGEKO_SIGNED_RETURN_REQUIRED", "Bitte zuerst das unterschriebene PDF dieser Fassung zuordnen.");
    return file;
  }
  function authority(ctx) {
    const snapshot = JSON.parse(ctx.document.snapshot_json);
    const current = authorities.getProjectAuthorities({ projectId: ctx.document.project_id }).categories.find(item => item.category === "LABOR_AUTHORITY");
    const evidence = current?.assignment && Object.fromEntries(PROJECT_AUTHORITY_COLUMNS.map(key => [key, current.assignment[key]]));
    if (current?.status !== "green" || !isDeepStrictEqual(evidence, snapshot.form.authorityEvidence)) fail("AUTHORITY_NOT_READY", "Die bestätigte Behördenzuordnung passt nicht mehr zu dieser Fassung. Bitte prüfen und gegebenenfalls eine neue Fassung erstellen.");
    return snapshot.form.authority;
  }
  function files(ctx, type) {
    const originals = parseSigekoDocumentFiles(ctx.document);
    const selected = type === "signature" ? originals : [signed(ctx), ...originals.filter(file => file.kind === "firms")];
    if (type === "authority") authority(ctx);
    selected.forEach(file => inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file));
    return selected;
  }
  function regularDirectories(ctx) {
    const root = path.dirname(ctx.paths.moduleDir);
    if (ctx.paths.targets.Unterlagen !== path.join(root, "SiGeKo", "Unterlagen")) fail("SIGEKO_DOCUMENT_FILE_INVALID", "Ungültige Projektablage.");
    for (const directory of [root, ctx.paths.moduleDir, ctx.paths.targets.Unterlagen]) if (!fs.lstatSync(directory).isDirectory()) fail("SIGEKO_DOCUMENT_FILE_INVALID", "Projektablage enthält einen unzulässigen Verweis.");
  }
  function readVerified(filePath, file) {
    if (!fs.lstatSync(filePath).isFile()) fail("SIGEKO_DOCUMENT_FILE_INVALID", "PDF muss eine normale Datei sein.");
    const bytes = fs.readFileSync(filePath);
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-" || (file && (bytes.length !== file.byteSize || hash(bytes) !== file.sha256))) fail("SIGEKO_DOCUMENT_FILE_INVALID", "PDF fehlt oder wurde verändert.");
    return bytes;
  }
  async function exclusive(payload, action) {
    if (jobs.has(payload.projectId)) fail("SIGEKO_WORKFLOW_BUSY", "Für dieses Projekt läuft bereits ein Rücklauf-/Mailauftrag.");
    jobs.add(payload.projectId);
    try { return await action(); } finally { jobs.delete(payload.projectId); }
  }
  function recipientProject(payload, writing = false) {
    enforce("sigeko");
    if (typeof payload?.projectId !== "string" || !payload.projectId.trim() || payload.projectId !== payload.projectId.trim()) fail("INVALID_INPUT", "Projekt-ID erforderlich.");
    const project = projects.getById(payload.projectId);
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    return project;
  }
  function completion(ctx) {
    return { projectId: ctx.document.project_id, documentId: ctx.document.id, revision: ctx.row?.revision ?? null,
      returnRequestedBy: ctx.row?.return_requested_by ?? null, returnedOn: ctx.row?.returned_on ?? null,
      authoritySentOn: ctx.row?.authority_sent_on ?? null, canWrite: !ctx.project.archived_at };
  }
  return Object.freeze({
    getPreNotificationRecipients(payload) {
      recipientProject(payload);
      if (Object.keys(payload).join() !== "projectId") fail("INVALID_INPUT", "Ungültige Empfängerabfrage.");
      return { projectId: payload.projectId, ...repo.getRecipients(payload.projectId) };
    },
    savePreNotificationRecipients(payload) {
      recipientProject(payload, true);
      if (Object.keys(payload).sort().join() !== "expectedRevision,projectId,recipients") fail("INVALID_INPUT", "Ungültige Empfängerangaben.");
      return { projectId: payload.projectId, ...repo.saveRecipients(payload.projectId, payload.recipients, payload.expectedRevision) };
    },
    getPreNotificationCompletion(payload) {
      request(payload, ["projectId", "documentId"]);
      return completion(context(payload));
    },
    savePreNotificationCompletion(payload) {
      request(payload, ["projectId", "documentId", "expectedRevision", "returnedOn", "authoritySentOn", "returnRequestedBy"]);
      const patch = { returned_on: deadline(payload.returnedOn), authority_sent_on: deadline(payload.authoritySentOn), return_requested_by: deadline(payload.returnRequestedBy) };
      return repo.transaction(() => {
        const ctx = context(payload, true); checkRevision(ctx, payload.expectedRevision);
        const saved = repo.save(next(ctx, patch, clock()), payload.expectedRevision);
        return completion({ ...ctx, row: saved });
      });
    },
    async openSimplePreNotificationMail(payload) {
      request(payload, ["projectId", "documentId", "expectedRevision", "returnRequestedBy"]);
      const due = deadline(payload.returnRequestedBy);
      if (!due) fail("INVALID_INPUT", "Bitte das gewünschte Rückgabedatum angeben.");
      return exclusive(payload, async () => {
        let ctx = context(payload, true); checkRevision(ctx, payload.expectedRevision);
        const settings = repo.getRecipients(payload.projectId), to = recipients(settings.recipients);
        const selected = files(ctx, "signature");
        const snapshot = JSON.parse(ctx.document.snapshot_json), form = snapshot.form;
        const projectName = [ctx.project.project_number, ctx.project.name].filter(Boolean).join(" – ");
        const address = [form.address?.street, form.address?.zip, form.address?.city].filter(Boolean).join(" ");
        const displayDue = due.split("-").reverse().join(".");
        let temporary;
        try {
          temporary = fs.mkdtempSync(path.join(tempDirectory(), "bbm-sigeko-mail-files-"));
          const attachments = selected.map(file => {
            const source = inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file);
            const destination = path.join(temporary, path.basename(file.projectRelativePath));
            fs.writeFileSync(destination, readVerified(source, file), { flag: "wx", mode: 0o600 });
            return destination;
          });
          guard(payload, ctx);
          if (!isDeepStrictEqual(settings, repo.getRecipients(payload.projectId))) fail("PRE_NOTIFICATION_WORKFLOW_CONFLICT", "Empfänger wurden geändert. Bitte erneut öffnen.");
          // Save the requested date, never a sent/received state. Outlook may be discarded.
          const saved = repo.transaction(() => {
            guard(payload, ctx);
            return repo.save(next(ctx, { return_requested_by: due }, clock()), payload.expectedRevision);
          });
          ctx = { ...ctx, row: saved };
          const transport = reminderMail || require("../../mail/outlookReminderDraft.cjs").createOutlookReminderDraftHandler({
            app: require("electron").app, enforce: moduleId => { enforce(moduleId); context(payload, true); }, licenseError: toLicenseErrorPayload,
            showMessageBox: options => require("electron").dialog.showMessageBox(options),
          });
          const result = await transport(null, { moduleId: "sigeko", to, attachments,
            subject: `Vorankündigung – Bitte um Unterschrift${projectName || address ? ` – ${projectName || address}` : ""}`,
            body: `Guten Tag,\n\nanbei erhalten Sie die Vorankündigung${address ? ` für das Bauvorhaben ${address}` : ""}.\nBitte prüfen und unterschreiben Sie die Vorankündigung und senden Sie diese bis zum ${displayDue} an {{BBM_RETURN_ADDRESS}} zurück.\n\nVielen Dank.\nMit freundlichen Grüßen`,
            returnAddressToken: "{{BBM_RETURN_ADDRESS}}", returnRequestedBy: due,
            reminder: { subject: "VA schon zurück", body: `Vorankündigung: ${projectName || address}\nErbetener Rücklauf: ${displayDue}` } });
          if (result?.outcome === "draft-closed") {
            // Never lose an already confirmed external action through a late refresh failure.
            try { return { ...result, completion: completion(context(payload)) }; }
            catch (error) { return { ...result, completion: null, refreshError: error.message }; }
          }
          fail(result?.code || "MAIL_DRAFT_NOT_CONFIRMED", result?.error || "Outlook konnte nicht geöffnet werden.");
        } finally {
          if (temporary) try { fs.rmSync(temporary, { recursive: true, force: true }); } catch (_) { /* Own temporary copies only. */ }
        }
      });
    },
    getPreNotificationWorkflow(payload) {
      request(payload, ["projectId", "documentId"]);
      return dto(context(payload));
    },
    preparePreNotificationMail(payload) {
      request(payload, ["projectId", "documentId", "purpose", "returnRequestedBy"]);
      const type = purpose(payload.purpose), due = deadline(payload.returnRequestedBy), ctx = context(payload, true);
      const attachments = files(ctx, type).map(file => ({ name: path.basename(file.projectRelativePath), byteSize: file.byteSize }));
      const form = JSON.parse(ctx.document.snapshot_json).form;
      const contact = type === "authority" ? authority(ctx) : form.builder;
      const address = [form.address?.street, form.address?.zip, form.address?.city].filter(Boolean).join(" ");
      return { projectId: payload.projectId, documentId: payload.documentId, purpose: type, revision: ctx.row?.revision ?? null,
        recipients: contact?.email ? [contact.email] : [],
        subject: `Vorankündigung – ${type === "signature" ? "Bitte um Unterschrift" : "Unterschriebene Vorankündigung"}${address ? ` – ${address}` : ""}`,
        body: type === "signature" ? `Guten Tag,\n\nbitte prüfen und unterschreiben Sie die beigefügte Vorankündigung und senden Sie das unterschriebene PDF zurück.${due ? `\nErbetener Rücklauf: ${due}.` : ""}\n\nVielen Dank.` : "Guten Tag,\n\nanbei erhalten Sie die unterschriebene Vorankündigung zum bezeichneten Bauvorhaben.\n\nMit freundlichen Grüßen",
        attachments, returnRequestedBy: type === "signature" ? due : ctx.row?.return_requested_by ?? null };
    },
    async importPreNotificationSignedReturn(payload) {
      request(payload, ["projectId", "documentId", "expectedRevision"]);
      return exclusive(payload, async () => {
        const ctx = context(payload, true); checkRevision(ctx, payload.expectedRevision);
        const choice = await chooseFile();
        if (choice?.canceled) return { canceled: true };
        guard(payload, ctx);
        if (!Array.isArray(choice?.filePaths) || choice.filePaths.length !== 1 || !path.isAbsolute(choice.filePaths[0]) || path.extname(choice.filePaths[0]).toLowerCase() !== ".pdf") fail("SIGEKO_DOCUMENT_FILE_INVALID", "Bitte genau eine PDF-Datei auswählen.");
        const bytes = readVerified(choice.filePaths[0]);
        regularDirectories(ctx);
        const name = `Vorankuendigung-Ruecklauf-${uuid()}.pdf`;
        if (!/^[a-zA-Z0-9-]+\.pdf$/.test(name)) fail("SIGEKO_DOCUMENT_FILE_INVALID", "Ungültiger Rücklauf-Dateiname.");
        const filePath = path.join(ctx.paths.targets.Unterlagen, name);
        const file = { kind: "signed", projectRelativePath: `SiGeKo/Unterlagen/${name}`, sha256: hash(bytes), byteSize: bytes.length };
        let owned = false;
        try {
          fs.writeFileSync(filePath, bytes, { flag: "wx", mode: 0o600 }); owned = true;
          inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file);
          const time = clock();
          const saved = repo.transaction(() => {
            guard(payload, ctx); regularDirectories(ctx); inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file);
            return repo.save(next(ctx, { signed_file_json: JSON.stringify(file), signed_received_at: time, authority_opened_at: null }, time), payload.expectedRevision);
          });
          owned = false; // The committed row now owns these bytes; cleanup must never remove them.
          return { canceled: false, workflow: dto({ ...ctx, row: saved }) };
        } catch (error) {
          if (owned) try { readVerified(filePath, file); fs.unlinkSync(filePath); } catch (_) { /* Never remove changed or foreign files. */ }
          throw error;
        }
      });
    },
    async openPreNotificationSignedReturn(payload) {
      request(payload, ["projectId", "documentId"]);
      const ctx = context(payload), file = signed(ctx);
      const filePath = inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file);
      await open({ filePath, title: "Vorankündigung – unterschriebener Rücklauf" });
      return { opened: true };
    },
    async openPreNotificationMailDraft(payload) {
      request(payload, ["projectId", "documentId", "expectedRevision", "purpose", "recipients", "subject", "body", "returnRequestedBy"]);
      const type = purpose(payload.purpose), to = recipients(payload.recipients), due = deadline(payload.returnRequestedBy);
      if (typeof payload.subject !== "string" || !payload.subject.trim() || payload.subject.length > 1000 || /[\r\n\u0000]/.test(payload.subject) || typeof payload.body !== "string" || payload.body.length > 50000 || payload.body.includes("\u0000")) fail("INVALID_INPUT", "Bitte gültigen Betreff und Nachrichtentext eingeben.");
      return exclusive(payload, async () => {
        const ctx = context(payload, true); checkRevision(ctx, payload.expectedRevision);
        const selected = files(ctx, type);
        let temporary, opened = false;
        try {
          temporary = fs.mkdtempSync(path.join(tempDirectory(), "bbm-sigeko-mail-files-"));
          const attachments = selected.map(file => {
            const source = inspectDocumentFile(path.dirname(ctx.paths.moduleDir), file);
            const destination = path.join(temporary, path.basename(file.projectRelativePath));
            fs.writeFileSync(destination, readVerified(source, file), { flag: "wx", mode: 0o600 });
            return destination;
          });
          const recheck = () => { guard(payload, ctx); files(ctx, type); selected.forEach((file, index) => readVerified(attachments[index], file)); };
          recheck();
          const transport = mail || createOutlookDraftHandler({ app: require("electron").app, enforce, licenseError: toLicenseErrorPayload });
          const result = await transport(null, { moduleId: "sigeko", to, subject: payload.subject.trim(), body: payload.body, attachments });
          if (result?.ok !== true || result.outcome !== "draft-opened" || result.transport !== "outlook") fail(result?.code || "MAIL_DRAFT_NOT_CONFIRMED", result?.error || "Outlook hat die Entwurfsöffnung nicht bestätigt.");
          opened = true;
          const saved = repo.transaction(() => {
            recheck(); const time = clock();
            return repo.save(next(ctx, type === "signature" ? { signature_opened_at: time, return_requested_by: due } : { authority_opened_at: time }, time), payload.expectedRevision);
          });
          return { outcome: "draft-opened", transport: "outlook", workflow: dto({ ...ctx, row: saved }) };
        } catch (error) {
          if (opened) fail("SIGEKO_MAIL_OPENED_STATE_UNSAVED", "Outlook wurde geöffnet, aber der Vorgangsstand konnte nicht gespeichert werden. Bitte den geöffneten Entwurf prüfen und den Vorgang neu laden; nicht automatisch erneut öffnen.");
          throw error;
        } finally {
          if (temporary) try { fs.rmSync(temporary, { recursive: true, force: true }); } catch (_) { /* Own temporary copies only. */ }
        }
      });
    },
  });
}
module.exports = Object.freeze({ createPreNotificationWorkflowService });
