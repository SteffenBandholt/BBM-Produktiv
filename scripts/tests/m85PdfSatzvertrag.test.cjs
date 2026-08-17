"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { FIXTURES } = require("../pdf-v2/m85Fixtures.cjs");
const {
  GOLDEN_PAGE_COUNTS,
  GOLDEN_SNAPSHOT_SHA256,
  KNOWN_OPEN_GUARDRAILS,
  KNOWN_OPEN_STRUCTURAL_GUARDRAILS,
} = require("../pdf-v2/m85GoldenManifest.cjs");
const {
  getBbmPdfRegistry,
  createBbmPdfAdapter,
} = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");

const ROOT = path.resolve(__dirname, "../..");
const CONTRACT = Object.freeze({
  first: "PDF-V2-SATZ-002",
  following: "PDF-V2-SATZ-003",
  counter: "PDF-V2-SATZ-004",
  reserve: "PDF-V2-SATZ-005",
  tableHead: "PDF-V2-SATZ-006",
  recordFit: "PDF-V2-SATZ-007",
  split: "PDF-V2-SATZ-008",
  splitMinimum: "PDF-V2-SATZ-009",
  levelOne: "PDF-V2-SATZ-010",
  participants: "PDF-V2-PROT-001",
  preRemarks: "PDF-V2-PROT-002",
  closing: "PDF-V2-PROT-003",
  restRecord: "PDF-V2-REST-002",
  restMeasure: "PDF-V2-REST-003",
  protocolMeta: "PDF-V2-PROT-006",
  editorBoundary: "PDF-V2-EDIT-001",
  pageBreakLocked: "PDF-V2-EDIT-002",
  domainLocked: "PDF-V2-EDIT-003",
  singleRenderer: "PDF-V2-ARCH-001",
  singlePagination: "PDF-V2-ARCH-002",
  singleProfile: "PDF-V2-ARCH-003",
  historical: "PDF-V2-ARCH-004",
});
const M85_1_PROTOCOL_MANIFEST_SHA256 = "8b522de3097c67770088ceaed7bdfa5def7c85034e64b2c393005d1233a92049";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function m85ProfileRoots() {
  return fs.readdirSync(os.tmpdir())
    .filter((name) => name.startsWith("bbm-m85-pdf-fixtures-"))
    .sort();
}

function runGoldenHarness(extraArgs = []) {
  const output = path.join(os.tmpdir(), `bbm-m85-snapshots-${process.pid}-${Date.now()}.json`);
  const profileRootsBefore = m85ProfileRoots();
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts/pdf-v2/runM85PdfFixtures.cjs"), "--node-launcher", "--output", output, ...extraArgs],
      { cwd: ROOT, env: process.env, encoding: "utf8", maxBuffer: 20 * 1024 * 1024, windowsHide: true }
    );
    assert.equal(
      result.status,
      0,
      `M85-Harness fehlgeschlagen. stdout=${result.stdout || ""} stderr=${result.stderr || ""}`
    );
    assert.deepEqual(
      m85ProfileRoots(),
      profileRootsBefore,
      "M85-Harness hat ein isoliertes Electron-Profil zurückgelassen."
    );
    assert.equal(fs.existsSync(output), true, "M85-Harness hat keinen Snapshot geschrieben.");
    return JSON.parse(fs.readFileSync(output, "utf8"));
  } finally {
    try { fs.rmSync(output, { force: true }); } catch (_error) { /* best-effort cleanup */ }
  }
}

function snapshotHash(snapshot) {
  return crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function resultMap(runResult) {
  return new Map((runResult?.results || []).map((entry) => [entry.id, entry]));
}

function compactRecordOrder(snapshot) {
  const ids = snapshot.pages.flatMap((page) => page.records.map((record) => record.id));
  return ids.filter((id, index) => index === 0 || ids[index - 1] !== id);
}

function editorRun(elementId, changes, fixtureId = "p02-one-page") {
  const args = ["--fixture", fixtureId, "--editor-element", elementId];
  for (const [name, value] of Object.entries(changes)) args.push(`--editor-${name}`, String(value));
  return runGoldenHarness(args).results[0];
}

function boundaryRun(delta, tableId = "pdf.bbm.protocol.tops", leftId = `${tableId}.column.text`, rightId = `${tableId}.column.meta`, fixtureId = "p02-one-page") {
  return runGoldenHarness([
    "--fixture", fixtureId,
    "--boundary-table", tableId,
    "--boundary-left", leftId,
    "--boundary-right", rightId,
    "--boundary-delta", String(delta),
  ]).results[0];
}

function editorBound(result, elementId) {
  return (result?.previewMetadata?.renderBounds || [])
    .find((entry) => entry.elementId === elementId && entry.pageNumber === 1) || null;
}

function editorBounds(result, elementId, part) {
  return (result?.previewMetadata?.renderBounds || [])
    .filter((entry) => entry.elementId === elementId && entry.pageNumber === 1 && (!part || entry.part === part));
}

async function runM85PdfSatzvertragTests(run) {
  let rendered = null;

  await run("M85 Satzvertrag: 47 neutrale Fixtures sind vollständig und eindeutig", () => {
    assert.equal(FIXTURES.length, 47);
    assert.deepEqual(FIXTURES.map((fixture) => fixture.number), Array.from({ length: 47 }, (_value, index) => index + 1));
    assert.equal(new Set(FIXTURES.map((fixture) => fixture.id)).size, 47);
    assert.equal(Object.keys(GOLDEN_SNAPSHOT_SHA256).length, 47);
    assert.equal(Object.keys(GOLDEN_PAGE_COUNTS).length, 47);
    assert.equal(JSON.stringify(FIXTURES).includes("baubesprechungs-manager"), false);
    const protocolManifestEntries = Object.entries(GOLDEN_SNAPSHOT_SHA256).filter(([id]) => id.startsWith("p"));
    assert.equal(protocolManifestEntries.length, 25);
    assert.equal(snapshotHash(protocolManifestEntries), M85_1_PROTOCOL_MANIFEST_SHA256, "p01-p34 Baseline verändert");
  });

  await run("M85 Satzvertrag: alle strukturellen Golden-Snapshots sind reproduzierbar", () => {
    rendered = runGoldenHarness();
    const byId = resultMap(rendered);
    assert.equal(byId.size, 47);
    for (const fixture of FIXTURES) {
      const actual = byId.get(fixture.id);
      assert.ok(actual, `Snapshot fehlt: ${fixture.id}`);
      assert.equal(actual.snapshot.pageCount, GOLDEN_PAGE_COUNTS[fixture.id], `${fixture.id}: Seitenzahl`);
      assert.equal(snapshotHash(actual.snapshot), GOLDEN_SNAPSHOT_SHA256[fixture.id], `${fixture.id}: Snapshot-Hash`);
    }
  });

  await run("M85 Satzvertrag: Vollkopf, Mini-Kopf, Folgeseitenzähler und Fußreserve bleiben verriegelt", () => {
    const byId = resultMap(rendered);
    for (const result of byId.values()) {
      const { id, snapshot } = result;
      snapshot.pages.forEach((page, index) => {
        assert.equal(page.pageNumber, index + 1, `${CONTRACT.counter}:${id}:${index + 1}`);
        assert.equal(page.headerKind, index === 0 ? "full" : "mini", `${index === 0 ? CONTRACT.first : CONTRACT.following}:${id}`);
        assert.equal(page.globalHeaderPresent, index === 0, `${CONTRACT.first}:${id}:${index + 1}:global`);
        assert.equal(page.fullHeaderPresent, index === 0, `${CONTRACT.first}:${id}:${index + 1}:full`);
        assert.equal(page.miniHeaderPresent, index > 0, `${CONTRACT.following}:${id}:${index + 1}:mini`);
        const expectedPageCounter = `Seite ${index + 1} / ${snapshot.pageCount}`;
        assert.equal(page.visiblePageCounterText, expectedPageCounter, `${CONTRACT.counter}:${id}:${index + 1}:visible`);
        if (result.kind === "protocol" || result.kind === "restarbeiten") {
          assert.equal(page.pageCounterWithinPage, true, `${CONTRACT.counter}:${id}:${index + 1}:bounds`);
        }
        assert.equal(page.footerReservePresent, true, `${CONTRACT.reserve}:${id}:${index + 1}`);
        assert.equal(page.blockOrder.at(-1), "footerReserve", `${CONTRACT.reserve}:${id}:${index + 1}`);
      });
    }
  });

  await run("M86.2 Leitdesign: der logo-lose Produktkopf bleibt flach und ohne Platzhalter", () => {
    const byId = resultMap(rendered);
    for (const result of byId.values()) {
      assert.equal(result.snapshot.appliedDesign.logoPlaceholderTextPresent, false, `${result.id}:kein Logo-Platzhalter`);
      assert.equal(result.snapshot.appliedDesign.globalHeaderLogoCount, 0, `${result.id}:keine leeren Logo-Slots`);
      assert.equal(result.snapshot.appliedDesign.globalHeaderHeightMm, 8, `${result.id}:flacher Kopf`);
      assert.equal(result.snapshot.appliedDesign.pagePadTopMm, 5, `${result.id}:oberer Rand`);
    }
  });

  await run("M85 Satzvertrag: Tabellenkopf, Reihenfolge, Grenzfall und TOP-Fortsetzung bleiben stabil", () => {
    const byId = resultMap(rendered);
    for (const fixture of FIXTURES) {
      const snapshot = byId.get(fixture.id).snapshot;
      const expectedOrder = fixture.kind === "protocol"
        ? fixture.data.tops.map((row) => `top:${String(row.topNumberText)}`)
        : fixture.data.restarbeitenItems
            .filter((row) => !String(row.deleted_at || "").trim())
            .map((row) => `restarbeit:${String(row.id || row.running_number)}`);
      assert.deepEqual(compactRecordOrder(snapshot), expectedOrder, `${CONTRACT.recordFit}:${fixture.id}:Reihenfolge`);
      for (const page of snapshot.pages) {
        if (page.records.length) assert.equal(page.tableHeaderPresent, true, `${CONTRACT.tableHead}:${fixture.id}:${page.pageNumber}`);
      }
    }

    assert.equal(byId.get("p04-just-fits-first").snapshot.pageCount, 1, `${CONTRACT.recordFit}:p04`);
    assert.ok(byId.get("p04-just-fits-first").snapshot.pages[0].remainingHeightMm >= 0, `${CONTRACT.recordFit}:p04`);
    assert.deepEqual(
      byId.get("p05-just-misses-first").snapshot.pages[1].records.map((record) => record.id),
      ["top:2.11"],
      `${CONTRACT.recordFit}:p05`
    );
    for (const id of ["p08-very-long-longtext", "p09-continuation"]) {
      const parts = byId.get(id).snapshot.pages.flatMap((page) => page.records);
      assert.equal(parts.some((part) => part.segment === "start"), true, `${CONTRACT.split}:${id}`);
      assert.equal(parts.some((part) => part.segment === "continuation"), true, `${CONTRACT.split}:${id}`);
      assert.equal(
        byId.get(id).snapshot.pages.every((page) => page.remainingHeightMm >= -1),
        true,
        `${CONTRACT.splitMinimum}:${id}`
      );
    }
  });

  await run("M85 Satzvertrag: Level-1 bleibt mit erstem Inhalt zusammen und Abschluss bleibt als Block zusammen", () => {
    const byId = resultMap(rendered);
    const pages = byId.get("p06-level-one-near-end").snapshot.pages;
    const levelOnePage = pages.find((page) => page.records.some((record) => record.level === 1));
    const levelOneIndex = levelOnePage.records.findIndex((record) => record.level === 1);
    assert.ok(levelOneIndex >= 0, `${CONTRACT.levelOne}:Level-1 fehlt`);
    assert.ok(levelOneIndex < levelOnePage.records.length - 1, `${CONTRACT.levelOne}:Level-1 steht allein am Seitenende`);
    assert.equal(levelOnePage.records[levelOneIndex + 1]?.id, "top:2.1", `${CONTRACT.levelOne}:Unterpunkt nicht angehängt`);
    for (const result of byId.values()) {
      const closingPages = result.snapshot.pages.filter((page) => page.closingPresent);
      if (result.kind === "protocol") {
        assert.equal(closingPages.length, 1, `${CONTRACT.closing}:${result.id}`);
        assert.equal(closingPages[0].pageNumber, result.snapshot.pageCount, `${CONTRACT.closing}:${result.id}`);
        assert.ok(
          closingPages[0].blockOrder.indexOf("closing") < closingPages[0].blockOrder.indexOf("footerReserve"),
          `${CONTRACT.closing}:${result.id}:Blockreihenfolge`
        );
      }
    }
  });

  await run("M85 Satzvertrag: Protokoll- und Restarbeiten-Überläufe sind geschlossen", () => {
    const byId = resultMap(rendered);
    for (const [contractId, fixtureIds] of Object.entries(KNOWN_OPEN_GUARDRAILS)) {
      for (const fixtureId of fixtureIds) {
        const minimum = Math.min(...byId.get(fixtureId).snapshot.pages.map((page) => page.remainingHeightMm));
        assert.ok(minimum < -1, `${contractId}:${fixtureId}:offener Befund wurde nicht erkannt`);
      }
    }
    for (const result of byId.values()) {
      assert.equal(
        result.snapshot.pages.every((page) => page.remainingHeightMm >= -1),
        true,
        `${CONTRACT.recordFit}:${result.id}:Überlauf`
      );
    }
    assert.deepEqual(KNOWN_OPEN_GUARDRAILS[CONTRACT.participants], []);
    assert.deepEqual(KNOWN_OPEN_GUARDRAILS[CONTRACT.preRemarks], []);
    assert.deepEqual(KNOWN_OPEN_STRUCTURAL_GUARDRAILS[CONTRACT.levelOne], []);
    assert.deepEqual(KNOWN_OPEN_STRUCTURAL_GUARDRAILS[CONTRACT.counter], []);
    assert.deepEqual(KNOWN_OPEN_GUARDRAILS[CONTRACT.restRecord], []);
    assert.deepEqual(KNOWN_OPEN_GUARDRAILS[CONTRACT.restMeasure], []);
  });

  await run("M85.2 Restarbeiten: Querformat, 13 Spalten, Filterfolge, Tabellenkopf und Fortsetzungen sind verriegelt", () => {
    const byId = resultMap(rendered);
    const restFixtures = FIXTURES.filter((fixture) => fixture.kind === "restarbeiten");
    assert.ok(restFixtures.length >= 20);
    const expectedColumnKeys = [
      "number", "class", "shortText", "longText", "location1", "location2", "location3",
      "location4", "status", "dueDate", "responsible", "completedAt", "completionNote",
    ];
    for (const fixture of restFixtures) {
      const snapshot = byId.get(fixture.id).snapshot;
      const sourceOrder = fixture.data.restarbeitenItems
        .filter((row) => !String(row.deleted_at || "").trim())
        .map((row) => String(row.id || row.running_number));
      assert.equal(snapshot.orientation, "landscape", `${fixture.id}:Querformat`);
      assert.deepEqual(snapshot.restarbeitenSourceOrder, sourceOrder, `${fixture.id}:Filterfolge`);
      assert.equal(snapshot.appliedDesign.restarbeitenColumnCount, 13, `${fixture.id}:Spaltenzahl`);
      assert.equal(snapshot.appliedDesign.restarbeitenTableWidthMm, 273, `${fixture.id}:Spaltenbreite`);
      assert.equal(snapshot.appliedDesign.restarbeitenColumns.every((column) => column.widthMm >= column.minWidthMm && column.widthMm <= column.maxWidthMm), true, `${fixture.id}:Breitengrenzen`);
      for (const page of snapshot.pages) {
        assert.equal(page.tableWithinPage, true, `${fixture.id}:Seite${page.pageNumber}:Tabellenbreite`);
        assert.equal(page.columnCount, 13, `${fixture.id}:Seite${page.pageNumber}:Spalten`);
        assert.deepEqual(page.columnKeys, expectedColumnKeys, `${fixture.id}:Seite${page.pageNumber}:Spaltenfolge`);
        assert.equal(page.tableHeaderPresent, true, `${fixture.id}:Seite${page.pageNumber}:Tabellenkopf`);
      }
      if (snapshot.pageCount > 1) {
        assert.ok(snapshot.pages.at(-1).records.length > 0, `${fixture.id}:leere Zusatzseite`);
      }
    }
    assert.equal(byId.get("r19-empty").snapshot.pages[0].emptyStatePresent, true);
    assert.equal(byId.get("r24-just-before-end").snapshot.pageCount, 1, `${CONTRACT.recordFit}:r24`);
    assert.equal(byId.get("r24-just-before-end").snapshot.pages[0].records.length, 13, `${CONTRACT.recordFit}:r24:vollständig`);
    assert.deepEqual(byId.get("r25-just-misses-end").snapshot.pages.map((page) => page.records.length), [12, 1], `${CONTRACT.recordFit}:r25`);
    assert.deepEqual(compactRecordOrder(byId.get("r42-deleted-excluded").snapshot), [
      "restarbeit:fixture-restarbeit-1",
      "restarbeit:fixture-restarbeit-3",
    ]);
    for (const id of ["r23-very-long-record", "r35-very-long-short-text", "r36-very-long-note", "r37-two-page-record"]) {
      const segments = byId.get(id).snapshot.pages.flatMap((page) => page.records.map((record) => record.segment));
      assert.equal(segments[0], "start", `${id}:Fortsetzungsstart`);
      assert.equal(segments.at(-1), "end", `${id}:Fortsetzungsende`);
      assert.equal(segments.some((segment) => segment === "continuation") || segments.length === 2, true, `${id}:Fortsetzung`);
    }
  });

  await run("M85 Satzvertrag: Teilnehmerzeilen werden vollständig und mit wiederholtem Tabellenkopf segmentiert", () => {
    const byId = resultMap(rendered);
    assert.deepEqual(
      byId.get("p28-participants-exact-boundary").snapshot.pages.filter((page) => page.participantsPresent).map((page) => page.participantRowCount),
      [11],
      `${CONTRACT.participants}:genau-passend`
    );
    assert.deepEqual(
      byId.get("p29-participants-miss-boundary").snapshot.pages.filter((page) => page.participantsPresent).map((page) => page.participantRowCount),
      [15, 1],
      `${CONTRACT.participants}:knapp-nicht-passend`
    );
    const threePageParticipantPages = byId.get("p30-participants-three-pages").snapshot.pages.filter((page) => page.participantsPresent);
    assert.ok(threePageParticipantPages.length >= 3, `${CONTRACT.participants}:drei-Seiten`);
    assert.equal(threePageParticipantPages.reduce((sum, page) => sum + page.participantRowCount, 0), 40);
    const tallPages = byId.get("p31-single-tall-participant").snapshot.pages.filter((page) => page.participantsPresent);
    const tallSegments = tallPages.flatMap((page) => page.participantRows);
    assert.equal(tallSegments[0]?.segment, "start", `${CONTRACT.participants}:Sonderfall-Start`);
    assert.equal(tallSegments.at(-1)?.segment, "end", `${CONTRACT.participants}:Sonderfall-Ende`);
    assert.equal(tallSegments.every((row) => row.id === "participant:1"), true, `${CONTRACT.participants}:Sonderfall-Identität`);
    for (const id of ["p12-large-participants", "p28-participants-exact-boundary", "p29-participants-miss-boundary", "p30-participants-three-pages", "p31-single-tall-participant"]) {
      const pages = byId.get(id).snapshot.pages.filter((page) => page.participantsPresent);
      assert.equal(pages.every((page) => page.tableHeaderPresent), true, `${CONTRACT.participants}:${id}:Tabellenkopf`);
      assert.equal(pages.every((page) => page.remainingHeightMm >= -1), true, `${CONTRACT.participants}:${id}:Zeilenüberlauf`);
    }
  });

  await run("M85 Satzvertrag: Vorbemerkungen werden wortgenau und sichtbar fortgesetzt", () => {
    const byId = resultMap(rendered);
    const cases = [
      ["p13-short-preremarks", 3, ["complete"]],
      ["p32-preremarks-over-boundary", 320, ["start", "end"]],
      ["p33-preremarks-multiple-pages", 900, ["start", "continuation", "continuation", "end"]],
      ["p34-participants-preremarks-tops", 420, ["start", "end"]],
    ];
    for (const [id, wordCount, expectedSegments] of cases) {
      const pages = byId.get(id).snapshot.pages.filter((page) => page.preRemarksPresent);
      assert.deepEqual(pages.map((page) => page.preRemarksSegment), expectedSegments, `${CONTRACT.preRemarks}:${id}:Segmente`);
      assert.equal(pages.reduce((sum, page) => sum + page.preRemarksWordCount, 0), wordCount, `${CONTRACT.preRemarks}:${id}:Wörter`);
      assert.equal(pages.every((page) => page.remainingHeightMm >= -1), true, `${CONTRACT.preRemarks}:${id}:Überlauf`);
    }
    const combined = byId.get("p34-participants-preremarks-tops").snapshot;
    assert.equal(combined.pages.reduce((sum, page) => sum + page.participantRowCount, 0), 18, `${CONTRACT.participants}:kombiniert`);
    assert.equal(compactRecordOrder(combined).length, 12, `${CONTRACT.recordFit}:kombiniert`);
    const printApp = read("src/renderer/print/printApp.js");
    for (const contractId of [CONTRACT.levelOne, CONTRACT.participants, CONTRACT.preRemarks]) {
      assert.match(printApp, new RegExp(contractId), `${contractId}:Guardrailfehler ohne Vertrags-ID`);
    }
  });

  await run("M85 Satzvertrag: Editor darf Satz- und Fachoperationen nicht freigeben", () => {
    const registry = getBbmPdfRegistry();
    assert.equal(registry.elements.length, 35);
    for (const element of registry.elements) {
      assert.equal(element.allowedOps.includes("setPageBreakRule"), false, `${CONTRACT.pageBreakLocked}:${element.id}`);
      assert.equal(element.lockedOps.includes("setPageBreakRule"), true, `${CONTRACT.pageBreakLocked}:${element.id}`);
      for (const operation of ["changeText", "modifyDomainData", "createRecord", "deleteRecord", "saveDomainData"]) {
        assert.equal(element.allowedOps.includes(operation), false, `${CONTRACT.domainLocked}:${element.id}:${operation}`);
        assert.equal(element.lockedOps.includes(operation), true, `${CONTRACT.domainLocked}:${element.id}:${operation}`);
      }
    }
    const adapter = createBbmPdfAdapter();
    const locked = adapter.submitPdfChangeRequest({
      changeId: "m85-page-break",
      scopeId: registry.scopeId,
      elementId: `${registry.scopeId}.tops.rows`,
      operation: "setPageBreakRule",
      payload: { value: "always" },
    });
    assert.equal(locked.errorCode, "pdf_operation_locked", CONTRACT.pageBreakLocked);
  });

  await run("M85 Satzvertrag: Editor-Overlay bleibt vor der bestehenden Paginierung", () => {
    const printApp = read("src/renderer/print/printApp.js");
    const layout = read("src/renderer/print/pdfEditorLayout.js");
    const buildPagesAt = printApp.indexOf("const pages = _buildPages(data)");
    const renderAt = printApp.indexOf("applyBbmPdfEditorLayout(renderPrint({ pages, data }), data)");
    assert.ok(buildPagesAt >= 0 && renderAt > buildPagesAt, CONTRACT.editorBoundary);
    assert.doesNotMatch(
      layout,
      /(?:current|entry|state|data)\.page(?:No|Number|Index)\s*=|forcePage|splitRecord|setPageBreakRule/,
      CONTRACT.editorBoundary
    );
    const byId = resultMap(rendered);
    for (const id of ["p16-changed-columns", "p17-changed-font", "p18-changed-line-spacing"]) {
      const snapshot = byId.get(id).snapshot;
      assert.equal(snapshot.pages[0].headerKind, "full", `${CONTRACT.editorBoundary}:${id}:full`);
      assert.equal(snapshot.pages.slice(1).every((page) => page.headerKind === "mini"), true, `${CONTRACT.editorBoundary}:${id}:mini`);
      assert.equal(snapshot.pages.every((page) => page.footerReservePresent), true, `${CONTRACT.editorBoundary}:${id}:reserve`);
    }
  });

  await run("M85 PDF-Bedienung: Position, Schrift und Seitenwert-Sichtbarkeit wirken im echten Print-DOM", () => {
    const titleId = "pdf.bbm.protocol.header.title";
    const titleBefore = editorBound(editorRun(titleId, { x: 16, y: 28 }), titleId);
    const titleAfter = editorBound(editorRun(titleId, { x: 26, y: 28 }), titleId);
    assert.ok(titleBefore && titleAfter, `${titleId}:Renderer-Readback fehlt`);
    assert.ok(Math.abs(titleBefore.appliedX - 16) <= 0.05, `${titleId}:Baseline-Readback X`);
    assert.ok(Math.abs(titleAfter.appliedX - 26) <= 0.05, `${titleId}:Move-Readback X`);
    assert.ok(Math.abs((titleAfter.box.x - titleBefore.box.x) - 10) <= 0.05, `${titleId}:reale DOM-Verschiebung X`);

    const pageValueId = "pdf.bbm.protocol.header.meta.page-value";
    const pageBefore = editorBound(editorRun(pageValueId, { x: 159, y: 14, "font-size": 9 }), pageValueId);
    const pageAfter = editorBound(editorRun(pageValueId, { x: 158, y: 14, "font-size": 14 }), pageValueId);
    assert.ok(pageBefore && pageAfter, `${pageValueId}:Renderer-Readback fehlt`);
    assert.ok(Math.abs(pageAfter.appliedX - 158) <= 0.05, `${pageValueId}:Move-Readback X`);
    assert.ok(Math.abs((pageAfter.box.x - pageBefore.box.x) + 1) <= 0.05, `${pageValueId}:reale DOM-Verschiebung X`);
    assert.ok(pageAfter.box.width > pageBefore.box.width, `${pageValueId}:Schriftgroesse blieb visuell unveraendert`);
    assert.equal(editorBound(editorRun(pageValueId, { visible: false }), pageValueId), null,
      `${pageValueId}:ausgeblendeter Seitenwert blieb im Print-DOM sichtbar`);
  });

  await run("M85 PDF-Bedienung: innere Spaltengrenze bleibt in Track, Kopf und Daten lueckenlos", () => {
    const tableId = "pdf.bbm.protocol.tops";
    const numberId = `${tableId}.column.number`;
    const textId = `${tableId}.column.text`;
    const metaId = `${tableId}.column.meta`;
    const before = editorRun(tableId, { visible: true });
    const right = boundaryRun(1);
    const left = boundaryRun(-1);
    const tableBefore = editorBounds(before, tableId)[0];
    assert.ok(tableBefore, `${tableId}:Readback fehlt`);

    for (const [result, delta] of [[right, 1], [left, -1]]) {
      const table = editorBounds(result, tableId)[0];
      assert.ok(table, `${tableId}:Grenzen-Readback fehlt`);
      assert.ok(Math.abs(table.box.x - tableBefore.box.x) <= 0.05, `${tableId}:linke Aussenkante`);
      assert.ok(Math.abs(table.box.width - tableBefore.box.width) <= 0.05, `${tableId}:Gesamtbreite`);
      assert.ok(Math.abs((table.box.x + table.box.width) - (tableBefore.box.x + tableBefore.box.width)) <= 0.05, `${tableId}:rechte Aussenkante`);

      for (const part of ["track", "header", "data"]) {
        const numberBefore = editorBounds(before, numberId, part);
        const numberAfter = editorBounds(result, numberId, part);
        const textBefore = editorBounds(before, textId, part);
        const textAfter = editorBounds(result, textId, part);
        const metaBefore = editorBounds(before, metaId, part);
        const metaAfter = editorBounds(result, metaId, part);
        assert.ok(numberBefore.length > 0 && numberAfter.length === numberBefore.length, `${numberId}:${part}:Readback`);
        assert.equal(textAfter.length, textBefore.length, `${textId}:${part}:Readback`);
        assert.equal(metaAfter.length, metaBefore.length, `${metaId}:${part}:Readback`);
        for (let index = 0; index < textAfter.length; index += 1) {
          assert.ok(Math.abs(textAfter[index].box.width - textBefore[index].box.width - delta) <= 0.05, `${textId}:${part}:Nachbarbreite`);
          assert.ok(Math.abs(metaAfter[index].box.width - metaBefore[index].box.width + delta) <= 0.05, `${metaId}:${part}:Nachbarbreite`);
          assert.ok(Math.abs((textAfter[index].box.x + textAfter[index].box.width) - metaAfter[index].box.x) <= 0.05, `${part}:Gap oder Ueberlappung Gegenstand/Meta`);
          assert.ok(Math.abs((numberAfter[index].box.x + numberAfter[index].box.width) - textAfter[index].box.x) <= 0.05, `${part}:Gap oder Ueberlappung TOP/Gegenstand`);
          assert.ok(Math.abs((metaAfter[index].box.x + metaAfter[index].box.width) - (metaBefore[index].box.x + metaBefore[index].box.width)) <= 0.05, `${part}:rechte Tabellenkante`);
        }
      }
    }
    assert.equal(editorBounds(editorRun(metaId, { visible: false }), metaId).length, 0,
      `${metaId}:vollstaendige Spalte blieb sichtbar`);
  });

  await run("M85 PDF-Bedienung: Teilnehmer-Tabelle bleibt bis zur Nutzflaechenkante lueckenlos", () => {
    const tableId = "pdf.bbm.protocol.participants";
    const contactId = `${tableId}.column.contact`;
    const attendanceId = `${tableId}.column.attendance`;
    const headingId = `${tableId}.heading.attendance`;
    const fixtureId = "p11-small-participants";
    const before = editorRun(tableId, { visible: true }, fixtureId);
    const right = boundaryRun(1, tableId, contactId, attendanceId, fixtureId);
    const left = boundaryRun(-1, tableId, contactId, attendanceId, fixtureId);
    const tableBefore = editorBound(before, tableId);
    assert.ok(tableBefore, `${tableId}:Readback fehlt`);
    assert.ok(Math.abs(tableBefore.box.x - 12) <= 0.05, `${tableId}:linke Nutzflaechenkante`);
    assert.ok(Math.abs(tableBefore.box.width - 186) <= 0.05, `${tableId}:Baselinebreite`);
    assert.ok(Math.abs(tableBefore.box.x + tableBefore.box.width - 198) <= 0.05, `${tableId}:rechte Nutzflaechenkante`);

    for (const [result, delta] of [[right, 1], [left, -1]]) {
      const table = editorBound(result, tableId);
      assert.ok(Math.abs(table.box.x - tableBefore.box.x) <= 0.05, `${tableId}:linke Aussenkante`);
      assert.ok(Math.abs(table.box.width - tableBefore.box.width) <= 0.05, `${tableId}:Gesamtbreite`);
      for (const part of ["header", "data"]) {
        const contactBefore = editorBounds(before, contactId, part);
        const contactAfter = editorBounds(result, contactId, part);
        const attendanceBefore = editorBounds(before, attendanceId, part);
        const attendanceAfter = editorBounds(result, attendanceId, part);
        assert.ok(contactBefore.length > 0 && contactAfter.length === contactBefore.length, `${contactId}:${part}:Readback`);
        assert.equal(attendanceAfter.length, attendanceBefore.length, `${attendanceId}:${part}:Readback`);
        for (let index = 0; index < contactAfter.length; index += 1) {
          assert.ok(Math.abs(contactAfter[index].box.width - contactBefore[index].box.width - delta) <= 0.05, `${contactId}:${part}:Nachbarbreite`);
          assert.ok(Math.abs(attendanceAfter[index].box.width - attendanceBefore[index].box.width + delta) <= 0.05, `${attendanceId}:${part}:Aussenspaltenbreite`);
          assert.ok(Math.abs(contactAfter[index].box.x + contactAfter[index].box.width - attendanceAfter[index].box.x) <= 0.05,
            `${tableId}:${part}:Gap oder Ueberlappung`);
          assert.ok(Math.abs(attendanceAfter[index].box.x + attendanceAfter[index].box.width - 198) <= 0.05,
            `${tableId}:${part}:rechte Nutzflaechenkante`);
        }
      }
    }

    const narrow = editorRun(tableId, { width: 185 }, fixtureId);
    const narrowTable = editorBound(narrow, tableId);
    assert.ok(Math.abs(narrowTable.box.width - 185) <= 0.05, `${tableId}:atomare Tabellenbreite`);
    assert.ok(Math.abs(narrowTable.box.x + narrowTable.box.width - 197) <= 0.05, `${tableId}:schmalere rechte Aussenkante`);
    const narrowAttendance = editorBounds(narrow, attendanceId, "header")[0];
    assert.ok(Math.abs(narrowAttendance.box.width - 17) <= 0.05, `${attendanceId}:folgt Tabellenbreite`);

    const headingBefore = editorBound(editorRun(headingId, { "text-offset-x": 0, "text-offset-y": 0 }, fixtureId), headingId);
    const headingAfter = editorBound(editorRun(headingId, { "text-offset-x": 1, "text-offset-y": 0 }, fixtureId), headingId);
    assert.ok(headingBefore && headingAfter, `${headingId}:Readback fehlt`);
    assert.ok(Math.abs(headingAfter.box.x - headingBefore.box.x - 1) <= 0.05, `${headingId}:separate Textposition`);
    assert.ok(Math.abs(editorBound(editorRun(headingId, { "text-offset-x": 1, "text-offset-y": 0 }, fixtureId), tableId).box.width - tableBefore.box.width) <= 0.05,
      `${headingId}:Tabellencontainer veraendert`);
  });

  await run("M85 PDF-Meta: Body-Zeilen nutzen die gemeinsame innere Spaltenbreite", () => {
    const baseline = resultMap(rendered).get("p02-one-page")?.metaColumnGeometry;
    assert.ok(baseline?.header && baseline?.heading && baseline.cells.length > 0, `${CONTRACT.protocolMeta}:Geometrie fehlt`);
    assert.ok(Math.abs(baseline.heading.width - baseline.cells[0].innerWidth) <= 0.05,
      `${CONTRACT.protocolMeta}:Header und Body haben unterschiedliche Innenbreiten`);
    for (const cell of baseline.cells) {
      assert.ok(Math.abs(cell.wrapper.width - cell.innerWidth) <= 0.05,
        `${CONTRACT.protocolMeta}:Meta-Container nutzt nicht die Zellinnenbreite`);
      assert.equal(cell.lines.length, 3, `${CONTRACT.protocolMeta}:Meta-Zeilen fehlen`);
      for (const line of cell.lines) {
        assert.ok(Math.abs(line.box.width - cell.innerWidth) <= 0.05,
          `${CONTRACT.protocolMeta}:${line.classes}:Zeile nutzt nicht die Zellinnenbreite`);
        assert.equal(line.maxWidth, "none", `${CONTRACT.protocolMeta}:${line.classes}:alte Maximalbreite wirkt noch`);
        assert.equal(line.position, "static", `${CONTRACT.protocolMeta}:${line.classes}:unerwartete Positionierung`);
        assert.equal(line.transform, "none", `${CONTRACT.protocolMeta}:${line.classes}:unerwarteter Transform`);
      }
      assert.equal(cell.lines[2].display, "block", `${CONTRACT.protocolMeta}:Verantwortlicher erbt die Container-Flexregel`);
      if (cell.ampelDot) {
        assert.ok(Math.abs((cell.ampelDot.x - cell.statusText.right) - 1.5) <= 0.05,
          `${CONTRACT.protocolMeta}:Statuspunkt hat keinen stabilen Abstand zum Status`);
      }
    }

    const resized = boundaryRun(1).metaColumnGeometry;
    assert.ok(resized?.cells?.length === baseline.cells.length, `${CONTRACT.protocolMeta}:Resize-Geometrie fehlt`);
    for (const cell of resized.cells) {
      for (const line of cell.lines) {
        assert.ok(Math.abs(line.box.width - cell.innerWidth) <= 0.05,
          `${CONTRACT.protocolMeta}:${line.classes}:Zeile folgt der geaenderten Spaltenbreite nicht`);
      }
      if (cell.ampelDot) {
        assert.ok(Math.abs((cell.ampelDot.x - cell.statusText.right) - 1.5) <= 0.05,
          `${CONTRACT.protocolMeta}:Statuspunkt verliert beim Resize den Statusbezug`);
        const baselineCell = baseline.cells[resized.cells.indexOf(cell)];
        assert.ok(Math.abs((cell.ampelDot.x - cell.lines[0].box.x) - (baselineCell.ampelDot.x - baselineCell.lines[0].box.x)) <= 0.05,
          `${CONTRACT.protocolMeta}:Statuspunkt wandert mit der Spaltenbreite`);
      }
    }
  });

  await run("M85 PDF-Bedienung: Tabellenkopf-Text bewegt sich innerhalb der unveraenderten Spalte", () => {
    const headingId = "pdf.bbm.protocol.tops.heading.meta";
    const columnId = "pdf.bbm.protocol.tops.column.meta";
    const before = editorRun(headingId, { "text-offset-x": 0, "text-offset-y": 0 });
    const after = editorRun(headingId, { "text-offset-x": 1, "text-offset-y": 0 });
    const headingBefore = editorBound(before, headingId);
    const headingAfter = editorBound(after, headingId);
    assert.ok(headingBefore && headingAfter, `${headingId}:Renderer-Readback fehlt`);
    assert.ok(Math.abs((headingAfter.box.x - headingBefore.box.x) - 1) <= 0.05, `${headingId}:Textverschiebung`);
    const columnBefore = editorBounds(before, columnId, "track")[0];
    const columnAfter = editorBounds(after, columnId, "track")[0];
    assert.ok(columnBefore && columnAfter, `${columnId}:Spaltentrack fehlt`);
    assert.ok(Math.abs(columnAfter.box.x - columnBefore.box.x) <= 0.05, `${columnId}:Spaltencontainer wurde mitverschoben`);
    assert.ok(Math.abs(columnAfter.box.width - columnBefore.box.width) <= 0.05, `${columnId}:Spaltenbreite wurde veraendert`);
  });

  await run("M85 Satzvertrag: Renderer, Paginierung, Profilweg und Altpfade bleiben eindeutig", () => {
    const printIpc = read("src/main/ipc/printIpc.js");
    const printApp = read("src/renderer/print/printApp.js");
    const shell = read("src/renderer/print/layout/PrintShell.js");
    const editorIpc = read("src/main/ipc/uiEditorIpc.js");
    const restScreen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const restQuicklane = read("src/renderer/modules/restarbeiten/RestarbeitenQuicklane.js");
    assert.match(printApp, /import \{[\s\S]*renderPrint[\s\S]*\} from "\.\/layout\/PrintShell\.js"/, CONTRACT.singleRenderer);
    assert.match(shell, /export function renderPrint/, CONTRACT.singleRenderer);
    assert.equal((printIpc.match(/webContents\.printToPDF\(/g) || []).length, 1, CONTRACT.singleRenderer);
    assert.equal((printApp.match(/function _paginateTops\(/g) || []).length, 1, CONTRACT.singlePagination);
    assert.equal((printApp.match(/function _paginateGeneric\(/g) || []).length, 1, CONTRACT.singlePagination);
    assert.match(printIpc, /mode \|\| ""\)[\s\S]*=== "restarbeiten"[\s\S]*\? "landscape"/, CONTRACT.restColumns);
    assert.match(editorIpc, /generatePdfForUiEditor/, CONTRACT.singleProfile);
    assert.match(editorIpc, /getSharedBbmPdfAdapter/, CONTRACT.singleProfile);
    assert.match(editorIpc, /configureProfileRoot\([\s\S]*module-protokoll/, CONTRACT.singleProfile);
    assert.doesNotMatch(editorIpc, /new .*ProfileStore|create.*ProfileStore/, CONTRACT.singleProfile);
    assert.match(printIpc, /data\.mode === "protocol"[\s\S]*readPersistedPdfLayoutState\(\)/, CONTRACT.singleProfile);
    assert.match(printApp, /data\.mode === "headerTest"/, CONTRACT.historical);
    assert.match(restScreen, /printPdfAndPreviewInternal\(this\._buildRestarbeitenPdfPayload\(\)\)/, CONTRACT.historical);
    assert.match(restScreen, /mode:\s*"restarbeiten"[\s\S]*orientation:\s*"landscape"/, CONTRACT.historical);
    assert.doesNotMatch(restScreen, /buildRestarbeitenOutputPreview|printOpenHtmlPreview|toRestarbeitenOutputRows/, CONTRACT.historical);
    assert.match(restQuicklane, /title:\s*"Drucken"[\s\S]*onClick:\s*onPrint/, CONTRACT.historical);
    assert.match(printApp, /buildRestarbeitenRow\(row\)/, CONTRACT.restMeasure);
    assert.match(
      printApp,
      /function _restarbeitenSplitCellIndex\(row, ctx\)[\s\S]*ctx\.measureRow\(buildRestarbeitenRow/,
      CONTRACT.restMeasure
    );
  });
}

if (require.main === module) {
  let failed = false;
  const standaloneRun = async (name, task) => {
    try {
      await task();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error?.message || error);
    }
  };
  runM85PdfSatzvertragTests(standaloneRun)
    .then(() => { if (failed) process.exitCode = 1; })
    .catch((error) => {
      process.exitCode = 1;
      console.error(error?.stack || error?.message || error);
    });
}

module.exports = { runM85PdfSatzvertragTests };
