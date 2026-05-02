const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runSendMailPayloadTests(run) {
  const mod = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/ausgabe/sendMailPayload.js")
  );
  const {
    sendMailPayload,
    buildMailtoUrl,
    appendAttachmentHint,
    MAX_MAILTO_LENGTH,
  } = mod;

  const originalWindow = global.window;

  const withWindow = async (windowValue, fn) => {
    global.window = windowValue;
    try {
      return await fn();
    } finally {
      global.window = originalWindow;
    }
  };

  await run("Mail-Payload: gueltiger Payload erzeugt korrekte mailto-URL", async () => {
    await withWindow(
      {
        location: {
          assign(url) {
            this.href = url;
          },
          href: "",
        },
      },
      async () => {
        const res = sendMailPayload({
          to: [" empfaenger@example.de "],
          subject: "Betreff",
          body: "Hallo",
          cc: ["cc@example.de"],
          bcc: ["bcc@example.de"],
        });

        assert.equal(res.ok, true);
        assert.equal(global.window.location.href.startsWith("mailto:"), true);
        assert.equal(global.window.location.href.includes("subject=Betreff"), true);
        assert.equal(global.window.location.href.includes("body=Hallo"), true);
        assert.equal(global.window.location.href.includes("cc=cc%40example.de"), true);
        assert.equal(global.window.location.href.includes("bcc=bcc%40example.de"), true);
      }
    );
  });

  await run("Mail-Payload: Sonderzeichen werden korrekt codiert", async () => {
    await withWindow(
      {
        location: {
          assign(url) {
            this.href = url;
          },
          href: "",
        },
      },
      async () => {
        const res = sendMailPayload({
          to: ["müller@example.de"],
          subject: "Prüfung & Rückfrage",
          body: "Grüße an Köln",
          attachments: ["bericht.pdf"],
        });

        assert.equal(res.ok, true);
        assert.equal(global.window.location.href.includes("m%C3%BCller%40example.de"), true);
        assert.equal(global.window.location.href.includes("Pr%C3%BCfung%20%26%20R%C3%BCckfrage"), true);
        assert.equal(global.window.location.href.includes("Gr%C3%BC%C3%9Fe%20an%20K%C3%B6ln"), true);
      }
    );
  });

  await run("Mail-Payload: leerer Empfaenger wird sauber behandelt", async () => {
    await withWindow(
      {
        location: {
          assign() {
            throw new Error("should not be called");
          },
          href: "",
        },
      },
      async () => {
        const res = sendMailPayload({
          to: [" ", null, ""],
          subject: "Hallo",
        });

        assert.equal(res.ok, false);
        assert.equal(res.error, "E-Mail-Empfaenger fehlt");
        assert.equal(global.window.location.href, "");
      }
    );
  });

  await run("Mail-Payload: langer Payload wird erkannt", async () => {
    const longBody = "x".repeat(MAX_MAILTO_LENGTH + 50);
    await withWindow(
      {
        location: {
          assign() {
            throw new Error("should not be called");
          },
          href: "",
        },
      },
      async () => {
        const res = buildMailtoUrl({
          to: ["test@example.de"],
          subject: "Lang",
          body: longBody,
        });

        assert.equal(res.ok, false);
        assert.equal(res.error, "E-Mail-Inhalt ist zu lang fuer mailto");
      }
    );
  });

  await run("Mail-Payload: Attachment-Hinweis bleibt im Body nachvollziehbar", async () => {
    const body = appendAttachmentHint("Hallo", ["A.pdf", "B.pdf"]);
    assert.equal(body.includes("Anhaenge fuer den Versand:"), true);
    assert.equal(body.includes("A.pdf"), true);
    assert.equal(body.includes("B.pdf"), true);
  });

  await run("Mail-Payload: fehlende Browser-Location bricht nicht still", async () => {
    await withWindow({}, async () => {
      const res = sendMailPayload({
        to: ["test@example.de"],
        subject: "Hallo",
      });

      assert.equal(res.ok, false);
      assert.equal(res.error, "Browser-Location nicht verfuegbar");
      assert.equal(typeof res.mailto, "string");
    });
  });
}

module.exports = { runSendMailPayloadTests };
