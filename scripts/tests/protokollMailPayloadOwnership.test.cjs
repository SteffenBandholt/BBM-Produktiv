const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollMailPayloadOwnershipTests(run) {
  const { ProtokollMailPayloadService } = await importEsmFromFile(
    path.join(
      process.cwd(),
      "src/renderer/modules/protokoll/mail/ProtokollMailPayloadService.js"
    )
  );

  await run("#272 Mail 4b: Teilnehmer-Verteiler liefert fachliche Empfaengerauswahl", async () => {
    const originalWindow = global.window;
    global.window = {
      bbmDb: {
        meetingParticipantsList: async () => ({
          ok: true,
          items: [
            { email: "alle@example.test", is_in_distribution: 0 },
            { person_email: "verteiler@example.test", is_in_distribution: 1 },
            { email: "VERTEILER@example.test", is_in_distribution: 1 },
          ],
        }),
      },
    };
    try {
      const service = new ProtokollMailPayloadService({ router: {} });
      const options = await service.getMeetingRecipientOptions("m1");
      assert.deepEqual(options, {
        distribution: ["verteiler@example.test"],
        all: ["alle@example.test", "verteiler@example.test"],
        anyDistributionField: true,
      });
      assert.deepEqual(service.buildInitialRecipientSelection(options), ["verteiler@example.test"]);
    } finally {
      global.window = originalWindow;
    }
  });

  await run("#272 Mail 4b: Betreff und Text bleiben protokollspezifisch aufgebaut", async () => {
    const originalWindow = global.window;
    global.window = {
      bbmDb: {
        projectsList: async () => ({
          ok: true,
          list: [{ id: "p1", project_number: "4711", short: "Nord" }],
        }),
        projectSettingsGetMany: async () => ({
          ok: true,
          data: { "pdf.protocolTitle": "Jour fixe" },
        }),
        appSettingsGetMany: async () => ({
          ok: true,
          data: {
            email_subject: "{projectNumber} | {protocolTitle} #{meetingIndex} - {meetingDate}",
            email_body: "Bitte beachten.",
          },
        }),
      },
    };
    try {
      const service = new ProtokollMailPayloadService({ router: { currentProjectId: "p1" } });
      const draft = await service.buildDraft({
        projectId: "p1",
        meeting: { meeting_index: 17, meeting_date: "2026-09-06" },
      });
      assert.equal(draft.subject, "4711  |  Jour fixe #17 - 06.09.2026");
      assert.equal(draft.body, "Bitte beachten.");
    } finally {
      global.window = originalWindow;
    }
  });

  await run("#272 Mail 4b: Protokoll-PDF-Suche behaelt bestehende Dateinamenskandidaten", async () => {
    const originalWindow = global.window;
    global.window = {
      bbmDb: {
        projectsList: async () => ({
          ok: true,
          list: [{ id: "p1", project_number: "47/11", short: "Nord" }],
        }),
        appSettingsGetMany: async () => ({
          ok: true,
          data: { "pdf.protocolsDir": "C:/BBM", "pdf.protocolTitle": "Baubesprechung" },
        }),
      },
    };
    try {
      const service = new ProtokollMailPayloadService({ router: {} });
      const lookup = await service.buildProtocolPdfLookupPayload(
        { meeting_index: 17, meeting_date: "2026-09-06" },
        "p1"
      );
      assert.equal(lookup.baseDir, "C:/BBM");
      assert.deepEqual(lookup.expectedFileNames, [
        "47 11_Baubesprechung_#17-2026-09-06.pdf",
        "47 11_Nord_Baubesprechung_#17 - 06.09.2026.pdf",
      ]);
    } finally {
      global.window = originalWindow;
    }
  });

  await run("#272 Mail 4b: aktiver Flow und Header delegieren an den Modulservice", () => {
    const flow = read("src/renderer/modules/protokoll/mail/ProtokollMailFlow.js");
    const header = read("src/renderer/ui/MainHeader.js");
    assert.match(flow, /new ProtokollMailPayloadService\(\{ router: this\.router \}\)/);
    assert.match(flow, /payloadService\.getMeetingRecipientOptions/);
    assert.match(flow, /payloadService\.buildDraft/);
    assert.match(flow, /payloadService\.buildProtocolPdfLookupPayload/);
    assert.match(header, /_getProtokollMailPayloadService\(\)/);
    assert.match(header, /\.getMeetingRecipientOptions\(meetingId\)/);
    assert.match(header, /\.buildDraft\(\{/);
    assert.match(header, /\.buildProtocolPdfLookupPayload\(/);
  });
}

module.exports = { runProtokollMailPayloadOwnershipTests };
