const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollMailTransportBoundaryTests(run) {
  const { MailTransportService, normalizeMailTransportPayload } = await importEsmFromFile(
    path.join(process.cwd(), "src/renderer/features/mail/MailTransportService.js")
  );

  await run("#272 Mail 4a: gemeinsamer Transport normalisiert den fertigen Fachpayload", () => {
    assert.deepEqual(
      normalizeMailTransportPayload({
        recipients: ["a@example.test"],
        subject: "  Betreff  ",
        body: "Text",
        attachments: ["A.pdf", "a.PDF", "B.pdf", ""],
      }),
      {
        recipients: ["a@example.test"],
        subject: "Betreff",
        body: "Text",
        attachments: ["A.pdf", "B.pdf"],
        forceMailto: false,
      }
    );
  });

  await run("#272 Mail 4a: Outlook und Attachment-Fehler bleiben im gemeinsamen Dienst", async () => {
    const notifications = [];
    const service = new MailTransportService({
      openOutlookDraft: async () => ({ ok: false, result: { error: "COM blockiert" } }),
      sendMailto: async () => {
        throw new Error("mailto darf bei Attachments nicht laufen");
      },
      notify: (message) => notifications.push(message),
      logger: { error() {} },
    });
    const result = await service.send({
      recipients: ["a@example.test"],
      attachments: ["A.pdf"],
    });

    assert.equal(result.ok, false);
    assert.equal(result.attachmentError, true);
    assert.equal(notifications.some((message) => message.includes("COM blockiert")), true);
  });

  await run("#272 Mail 4a: mailto bleibt technischer Fallback ohne Attachment", async () => {
    const calls = [];
    const service = new MailTransportService({
      openOutlookDraft: async () => ({ ok: false, skipped: true }),
      sendMailto: async (payload) => calls.push(payload),
    });
    const result = await service.send({ recipients: ["a@example.test"], subject: "Info" });

    assert.deepEqual(result, { ok: true, transport: "mailto" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].subject, "Info");
  });

  await run("#272 Mail 4a: produktiver Abschlussflow liegt im Protokollmodul", () => {
    const closeFlow = read("src/renderer/tops/domain/TopsCloseFlow.js");
    const protocolFlow = read("src/renderer/modules/protokoll/mail/ProtokollMailFlow.js");
    const compatibility = read("src/renderer/features/mail/MailFlow.js");

    assert.match(closeFlow, /modules\/protokoll\/mail\/ProtokollMailFlow\.js/);
    assert.match(closeFlow, /new ProtokollMailFlow\(/);
    assert.match(protocolFlow, /_openMailClient\("", \{/);
    assert.match(read("src/renderer/ui/MainHeader.js"), /return await service\.send\(payload\)/);
    assert.match(compatibility, /ProtokollMailFlow as MailFlow/);
  });

  await run("#272 Mail 4a: gemeinsamer Transport bleibt ohne Protokoll-Fachwissen", () => {
    const source = read("src/renderer/features/mail/MailTransportService.js");
    for (const forbidden of ["protokoll", "meeting", "participant", "distribution", "protocolTitle"]) {
      assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
    }
  });
}

module.exports = { runProtokollMailTransportBoundaryTests };
