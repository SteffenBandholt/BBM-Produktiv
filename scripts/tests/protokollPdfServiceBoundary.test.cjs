const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollPdfServiceBoundaryTests(run) {
  const { PdfDocumentService } = await importEsmFromFile(
    path.join(process.cwd(), "src/renderer/features/output/PdfDocumentService.js")
  );

  await run("#272 PDF: gemeinsamer Dienst fuehrt eine gelieferte Router-Operation technisch aus", async () => {
    const calls = [];
    const router = {
      async createDocument(payload) {
        calls.push(payload);
        return { ok: true, filePath: "C:/tmp/result.pdf" };
      },
    };
    const service = new PdfDocumentService({ router });
    const result = await service.create({
      operation: "createDocument",
      payload: { projectId: "p1", documentId: "d1" },
    });

    assert.deepEqual(calls, [{ projectId: "p1", documentId: "d1" }]);
    assert.deepEqual(result, { ok: true, filePath: "C:/tmp/result.pdf" });
  });

  await run("#272 PDF: gemeinsamer Dienst bleibt ohne Protokoll-Fachwissen", () => {
    const source = read("src/renderer/features/output/PdfDocumentService.js");
    for (const forbidden of [
      "protokoll",
      "meetingId",
      "printClosedMeetingDirect",
      "printFirmsDirect",
      "printTodoDirect",
      "printTopListAllDirect",
      "layoutRules",
      "fileName",
    ]) {
      assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
    }
  });

  await run("#272 PDF: Protokoll-Abschluss nutzt die gemeinsame Dienstgrenze", () => {
    const source = read("src/renderer/tops/domain/TopsCloseFlow.js");
    assert.match(source, /new PdfDocumentService\(\{ router: this\.router \}\)/);
    assert.match(source, /this\.pdfDocumentService\.create\(\{/);
    assert.doesNotMatch(source, /this\.router\?\.printClosedMeetingDirect/);
    assert.doesNotMatch(source, /this\.router\?\.printFirmsDirect/);
    assert.doesNotMatch(source, /this\.router\?\.printTodoDirect/);
    assert.doesNotMatch(source, /this\.router\?\.printTopListAllDirect/);
  });

  await run("#272 PDF: fehlende technische Operation faellt kontrolliert geschlossen aus", async () => {
    const service = new PdfDocumentService({ router: {} });
    const result = await service.create({ operation: "missing", payload: { id: "x" } });
    assert.equal(result.ok, false);
    assert.equal(result.skipped, true);
    assert.match(result.error, /nicht verfuegbar/);
  });
}

module.exports = { runProtokollPdfServiceBoundaryTests };
