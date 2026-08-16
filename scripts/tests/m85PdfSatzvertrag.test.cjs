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
  editorBoundary: "PDF-V2-EDIT-001",
  pageBreakLocked: "PDF-V2-EDIT-002",
  domainLocked: "PDF-V2-EDIT-003",
  singleRenderer: "PDF-V2-ARCH-001",
  singlePagination: "PDF-V2-ARCH-002",
  singleProfile: "PDF-V2-ARCH-003",
  historical: "PDF-V2-ARCH-004",
});
const M85_1_PROTOCOL_MANIFEST_SHA256 = "9315e0fb70dc91940e1e26b461625d4cbe8f7a3c4b94ecb363d24be461f1d3e5";

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

function editorRun(elementId, changes) {
  const args = ["--fixture", "p02-one-page", "--editor-element", elementId];
  for (const [name, value] of Object.entries(changes)) args.push(`--editor-${name}`, String(value));
  return runGoldenHarness(args).results[0];
}

function editorBound(result, elementId) {
  return (result?.previewMetadata?.renderBounds || [])
    .find((entry) => entry.elementId === elementId && entry.pageNumber === 1) || null;
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
    assert.equal(registry.elements.length, 28);
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
    assert.doesNotMatch(editorIpc, /new .*ProfileStore|create.*ProfileStore/, CONTRACT.singleProfile);
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
