"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createUiScopeFingerprint } = require("ui-editor-kit");
const {
  IMPORT_SPECIAL_TYPE,
  buildImportPoints,
  splitTranscriptIntoPointTexts,
  ProtocolAudioImportService,
} = require("../../src/main/services/audio/ProtocolAudioImportService");
const { filterImportAreaForPrint } = require("../../src/main/print/printData");
const { TopService } = require("../../src/main/domain/TopService");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function savedRegistryElement(scopeId, entry) {
  const saved = { elementId: entry.id, scopeId };
  const operations = new Set(entry.allowedOps || []);
  if (operations.has("move")) {
    saved.x = entry.baseline?.x;
    saved.y = entry.baseline?.y;
  }
  if (operations.has("resize") || operations.has("resizeWidth")) {
    saved.width = Number.isFinite(entry.baseline?.width)
      ? entry.baseline.width
      : Math.min(entry.baseline?.maxWidth || 2400, Math.max(entry.baseline?.minWidth || 1, 640));
  }
  if (operations.has("resize") || operations.has("resizeHeight")) {
    saved.height = Number.isFinite(entry.baseline?.height)
      ? entry.baseline.height
      : Math.min(entry.baseline?.maxHeight || 1600, Math.max(entry.baseline?.minHeight || 1, 64));
  }
  if (operations.has("textMove")) {
    saved.textOffsetX = entry.baseline?.textOffsetX;
    saved.textOffsetY = entry.baseline?.textOffsetY;
  }
  if (operations.has("textResize")) saved.fontSize = entry.baseline?.fontSize;
  if (operations.has("setVisibility")) saved.visible = entry.baseline?.visible;
  if ([...operations].some((operation) => operation.startsWith("spacing"))) {
    saved.spacing = { ...(entry.baseline?.spacing || {}) };
  }
  if (entry.tableColumnLayout) {
    saved.table = {
      tableId: entry.tableBinding.tableId,
      columnId: entry.id,
      widthMode: entry.tableColumnLayout.widthMode,
      wrapMode: entry.tableColumnLayout.wrapMode,
      overflowMode: entry.tableColumnLayout.overflowMode,
    };
  }
  if (entry.tableLayout) {
    saved.table = {
      tableId: entry.id,
      horizontalOverflowMode: entry.tableLayout.horizontalOverflowMode,
      rowHeightMode: entry.tableLayout.rowHeightMode,
    };
  }
  return saved;
}

function createServiceHarness({ transcriptText = "Erster Satz. Weitere Einzelheit.", failOnPoint = 0 } = {}) {
  const state = {
    meeting: { id: "m-1", project_id: "p-1", series_key: "construction", is_closed: 0 },
    tops: [
      { id: "normal-1", project_id: "p-1", series_key: "construction", parent_top_id: null, level: 1, number: 1, title: "Normal", special_type: null },
    ],
    meetingTops: [{ meeting_id: "m-1", top_id: "normal-1" }],
    transcriptText,
    createdPointAttempts: 0,
  };
  let sequence = 0;
  const db = {
    transaction(callback) {
      return () => {
        const snapshot = structuredClone(state);
        try {
          return callback();
        } catch (error) {
          Object.keys(state).forEach((key) => delete state[key]);
          Object.assign(state, snapshot);
          throw error;
        }
      };
    },
  };
  const meetingsRepo = {
    getMeetingById: () => ({ ...state.meeting }),
    assertMeetingWritable() {
      if (Number(state.meeting.is_closed) === 1) throw new Error("Besprechung ist geschlossen");
      return { ...state.meeting };
    },
  };
  const topsRepo = {
    findSpecialTopByMeeting({ meetingId, specialType }) {
      const linked = new Set(state.meetingTops.filter((row) => row.meeting_id === meetingId).map((row) => row.top_id));
      return state.tops.find((top) => linked.has(top.id) && top.special_type === specialType) || null;
    },
    createTop({ projectId, seriesKey, parentTopId, level, number, title, specialType = null }) {
      if (parentTopId) {
        state.createdPointAttempts += 1;
        if (failOnPoint && state.createdPointAttempts === failOnPoint) throw new Error("simulierter Schreibfehler");
      }
      const top = {
        id: `top-${++sequence}`,
        project_id: projectId,
        series_key: seriesKey,
        parent_top_id: parentTopId ?? null,
        level,
        number,
        title,
        special_type: specialType,
      };
      state.tops.push(top);
      return { ...top };
    },
    updateTitle({ topId, title }) {
      const top = state.tops.find((row) => row.id === topId);
      top.title = title;
      return { ...top };
    },
    getNextNumber(projectId, parentTopId, seriesKey) {
      return Math.max(0, ...state.tops
        .filter((top) => top.project_id === projectId && top.series_key === seriesKey && (top.parent_top_id ?? null) === (parentTopId ?? null))
        .map((top) => Number(top.number) || 0)) + 1;
    },
  };
  const meetingTopsRepo = {
    attachTopToMeeting({ meetingId, topId, longtext = null }) {
      state.meetingTops.push({ meeting_id: meetingId, top_id: topId, longtext });
    },
  };
  const service = new ProtocolAudioImportService({
    meetingsRepo,
    topsRepo,
    meetingTopsRepo,
    audioImportsRepo: { getById: () => ({ id: "audio-1", meeting_id: "m-1", project_id: "p-1" }) },
    transcriptionService: {
      async transcribe() {
        return { transcript: { full_text: state.transcriptText } };
      },
    },
    appSettingsRepo: { appSettingsGetMany: () => ({ "tops.titleMax": "20" }) },
    dbProvider: () => db,
  });
  return { state, service };
}

async function runProtocolAudioImportRebuildTests(run) {
  const quicklaneSource = read("src/renderer/modules/protokoll/TopsScreenQuicklane.js");
  const ipcSource = read("src/main/ipc/audioIpc.js");
  const preloadSource = read("src/main/preload.js");
  const screenSource = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
  const audioFeatureSource = read("src/renderer/features/audio/AudioFeature.js");
  const { TranscriptionService } = await importEsmFromFile(
    path.join(ROOT, "src/renderer/modules/audio/TranscriptionService.js")
  );
  const TopsScreen = (await importEsmFromFile(
    path.join(ROOT, "src/renderer/modules/protokoll/screens/TopsScreen.js")
  )).default;
  const { buildListItemsFromState } = await importEsmFromFile(
    path.join(ROOT, "src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js")
  );

  await run("Audioimport Neu A: Import ist die fuenfte feste Quicklane-Aktion direkt nach Teilnehmer", () => {
    const participants = quicklaneSource.indexOf('title: "Teilnehmer"');
    const importAction = quicklaneSource.indexOf(': "Audiodatei importieren"');
    const visibility = quicklaneSource.indexOf('const visibility = createGroup');
    assert.ok(participants >= 0 && importAction > participants && visibility > importAction);
    assert.match(quicklaneSource.slice(participants, visibility), /id:\s*null[\s\S]*dataset\.quicklaneAction = "audio-import"/);
  });

  await run("Audioimport Neu A: Importsymbol zeigt Audiodatei, Schallwelle und Importpfeil", () => {
    const iconStart = quicklaneSource.indexOf("function createAudioImportIcon()");
    const buttonStart = quicklaneSource.indexOf("icon: importRunning", iconStart);
    const buttonEnd = quicklaneSource.indexOf("disabled: importRunning", buttonStart);
    assert.ok(iconStart >= 0 && buttonStart > iconStart && buttonEnd > buttonStart);
    assert.match(quicklaneSource.slice(iconStart, buttonStart), /audio-file-import/);
    assert.match(quicklaneSource.slice(iconStart, buttonStart), /M3 2\.75h8l4 4v14\.5H3z/);
    assert.match(quicklaneSource.slice(iconStart, buttonStart), /M5\.5 14v1 M8 12v5/);
    assert.match(quicklaneSource.slice(iconStart, buttonStart), /M19 5v10/);
    assert.match(quicklaneSource.slice(buttonStart, buttonEnd), /createAudioImportIcon\(\)/);
    assert.equal((quicklaneSource.match(/"Audiodatei importieren"/g) || []).length, 2);
  });

  await run("Audioimport Neu A: Runtime-Import wird kein neues Editorziel", () => {
    assert.match(quicklaneSource, /if \(id\) btn\.setAttribute\("data-ui-editor-id", id\)/);
    assert.equal(screenSource.includes("protokoll.topsScreen.quicklane.action.import"), false);
  });

  await run("Audioimport Neu A: spaetes Lizenzresultat synchronisiert die Quicklane", () => {
    const start = audioFeatureSource.indexOf("_setAudioLicenseState(licensed");
    const end = audioFeatureSource.indexOf("async _loadAudioLicenseState", start);
    assert.ok(start >= 0 && end > start);
    assert.match(audioFeatureSource.slice(start, end), /this\._syncQuicklaneState\?\.\(\)/);
    assert.match(audioFeatureSource.slice(end), /res\?\.valid === true/);
    assert.doesNotMatch(audioFeatureSource.slice(end), /!!res\?\.ok && !!res\?\.valid/);
  });

  await run("Audioimport Neu A: Dateidialog-IPC waehlt nur eine Datei und schreibt noch keine Importdaten", () => {
    const start = ipcSource.indexOf('ipcMain.handle("audio:chooseProtocolImportFile"');
    const end = ipcSource.indexOf('ipcMain.handle("audio:runProtocolImport"', start);
    const handler = ipcSource.slice(start, end);
    assert.ok(start >= 0 && end > start);
    assert.match(handler, /dialog\.showOpenDialog/);
    assert.match(handler, /properties:\s*\["openFile"\]/);
    assert.match(handler, /canceled:\s*true,\s*filePath:\s*null/);
    assert.doesNotMatch(handler, /audioImportService|transcriptionService|tops/i);
    assert.match(preloadSource, /audioChooseProtocolImportFile:\s*\(\)\s*=>\s*ipcRenderer\.invoke\("audio:chooseProtocolImportFile"\)/);
  });

  await run("Audioimport Neu A: Renderer-Bruecke gibt Auswahl und Abbruch unveraendert zurueck", async () => {
    const selected = { ok: true, canceled: false, filePath: "C:\\Test\\sprache.wav" };
    const selectedService = new TranscriptionService({
      audioChooseProtocolImportFile: async () => selected,
    });
    assert.deepEqual(await selectedService.chooseProtocolImportFile(), selected);

    const canceled = { ok: true, canceled: true, filePath: null };
    const canceledService = new TranscriptionService({
      audioChooseProtocolImportFile: async () => canceled,
    });
    assert.deepEqual(await canceledService.chooseProtocolImportFile(), canceled);

    const operations = [];
    const operationService = new TranscriptionService({
      audioRunProtocolImport: async (payload) => (operations.push(payload), { ok: true }),
      audioCancelProtocolImport: async (payload) => (operations.push(payload), { ok: true, canceled: true }),
      audioOnProtocolImportProgress: (callback) => (callback({ percent: 25 }), () => operations.push("unsubscribed")),
    });
    assert.deepEqual(await operationService.runProtocolImport({ operationId: "op-1" }), { ok: true });
    assert.deepEqual(await operationService.cancelProtocolImport("op-1"), { ok: true, canceled: true });
    const unsubscribe = operationService.onProtocolImportProgress(() => {});
    unsubscribe();
    assert.deepEqual(operations, [{ operationId: "op-1" }, { operationId: "op-1" }, "unsubscribed"]);
  });

  await run("Audioimport Neu A: Screen behaelt Auswahl nur temporaer; Abbruch und Read-only bleiben folgenlos", async () => {
    const createScreen = (result, state = { isReadOnly: false }) => {
      const screen = Object.create(TopsScreen.prototype);
      const dialogEvents = [];
      let progressCallback = null;
      screen.store = { getState: () => state };
      screen._protocolAudioImportBusy = false;
      screen._protocolAudioImportFilePath = null;
      screen._protocolAudioImportOperationId = null;
      screen._protocolAudioImportProgressUnsubscribe = null;
      screen._protocolAudioImportDialog = null;
      screen._getQuicklaneMeetingId = () => "meeting-1";
      screen._getQuicklaneProjectId = () => "project-1";
      screen._ensureAudioAvailable = async () => true;
      screen._syncQuicklaneState = () => {};
      screen._reloadTops = async () => {};
      screen._syncScreenState = () => {};
      screen.dialogs = {
        openProtocolAudioImportProgress(options) {
          dialogEvents.push({ type: "open", ...options });
          let open = true;
          return {
            update(progress) { dialogEvents.push({ type: "progress", progress }); },
            async showSuccess(pointCount) { dialogEvents.push({ type: "success", pointCount }); open = false; },
            showError(message) { dialogEvents.push({ type: "error", message }); },
            showCanceling() { dialogEvents.push({ type: "canceling" }); },
            close() { dialogEvents.push({ type: "close" }); open = false; },
            isOpen: () => open,
          };
        },
      };
      screen.audioTranscriptionService = {
        calls: 0,
        async chooseProtocolImportFile() {
          this.calls += 1;
          return result;
        },
        onProtocolImportProgress(callback) {
          progressCallback = callback;
          return () => dialogEvents.push({ type: "unsubscribe" });
        },
        async runProtocolImport(payload) {
          dialogEvents.push({ type: "run", payload });
          progressCallback?.({ operationId: "anderer-import", phase: "saving", message: "fremd" });
          progressCallback?.({ operationId: payload.operationId, phase: "transcription", message: "Transkription läuft" });
          progressCallback?.({ operationId: payload.operationId, phase: "saving", message: "Protokollpunkte werden gespeichert" });
          return { ok: true, firstCreatedTopId: null, pointCount: 2 };
        },
      };
      screen._audioImportDialogEvents = dialogEvents;
      return screen;
    };

    const selected = createScreen({ ok: true, canceled: false, filePath: "C:\\Test\\sprache.wav" });
    assert.equal(await selected._chooseProtocolAudioImportFile(), true);
    assert.equal(selected._protocolAudioImportFilePath, null);
    assert.equal(selected._protocolAudioImportBusy, false);
    assert.equal(selected._audioImportDialogEvents[0].type, "open");
    assert.equal(selected._audioImportDialogEvents[0].filePath, "C:\\Test\\sprache.wav");
    assert.ok(selected._audioImportDialogEvents.findIndex((entry) => entry.type === "open") < selected._audioImportDialogEvents.findIndex((entry) => entry.type === "run"));
    assert.deepEqual(selected._audioImportDialogEvents.filter((entry) => entry.type === "progress").map((entry) => entry.progress.phase), ["transcription", "saving"]);
    assert.deepEqual(selected._audioImportDialogEvents.find((entry) => entry.type === "success"), { type: "success", pointCount: 2 });

    const canceled = createScreen({ ok: true, canceled: true, filePath: null });
    assert.equal(await canceled._chooseProtocolAudioImportFile(), false);
    assert.equal(canceled._protocolAudioImportFilePath, null);
    assert.equal(canceled._protocolAudioImportBusy, false);

    const busy = createScreen({ ok: true, canceled: false, filePath: "C:\\Test\\sprache.wav" });
    busy._protocolAudioImportBusy = true;
    assert.equal(await busy._chooseProtocolAudioImportFile(), false);
    assert.equal(busy.audioTranscriptionService.calls, 0);

    const failed = createScreen({ ok: true, canceled: false, filePath: "C:\\Test\\sprache.wav" });
    failed.audioTranscriptionService.runProtocolImport = async () => ({ ok: false, error: "Whisper-Fehler" });
    assert.equal(await failed._chooseProtocolAudioImportFile(), false);
    assert.deepEqual(failed._audioImportDialogEvents.find((entry) => entry.type === "error"), {
      type: "error",
      message: "Whisper-Fehler",
    });
    failed._protocolAudioImportDialog.close();

    const readOnly = createScreen({ ok: true, canceled: false, filePath: "C:\\Test\\sprache.wav" }, { isReadOnly: true });
    assert.equal(await readOnly._chooseProtocolAudioImportFile(), false);
    assert.equal(readOnly.audioTranscriptionService.calls, 0);
  });

  await run("Audioimport Neu B/C: Punktmarker sind robust und entfernen angrenzende Interpunktion", () => {
    const transcript = "Auftakt bleibt, NEUER PUNKT: Erste Aussage; nÄcHsTeR pUnKt! Zweite Aussage";
    assert.deepEqual(splitTranscriptIntoPointTexts(transcript), [
      "Auftakt bleibt",
      "Erste Aussage",
      "Zweite Aussage",
    ]);
    assert.deepEqual(splitTranscriptIntoPointTexts("„Neuer Punkt“: Inhalt in Anführungszeichen"), [
      "Inhalt in Anführungszeichen",
    ]);
    assert.deepEqual(splitTranscriptIntoPointTexts("kein neuer Punktestand hier"), ["kein neuer Punktestand hier"]);
  });

  await run("Audioimport Neu B/C: erster Absatz trennt Kurz- und Langtext, weitere erzeugen Absätze", () => {
    const transcript = "Kurzer Titel. ABSATZ: Ausführlicher Text. absatz; Zweiter Langtextblock. Neuer Punkt! Zweiter TOP, Absatz—Langtext.";
    const points = buildImportPoints(transcript);
    assert.deepEqual(points, [
      {
        shortText: "Kurzer Titel.",
        longText: "Ausführlicher Text.\n\nZweiter Langtextblock.",
      },
      {
        shortText: "Zweiter TOP",
        longText: "Langtext.",
      },
    ]);
  });

  await run("Audioimport Neu B/C: ohne Absatz bleibt der vollständige Text ungekürzt im Kurztext", () => {
    const fullText = "Erster vollständiger Satz. Der gesamte weitere Inhalt bleibt trotz Feldgrenze ebenfalls im Kurztext.";
    assert.deepEqual(buildImportPoints(fullText, 5), [
      { shortText: fullText, longText: "" },
    ]);
    assert.deepEqual(buildImportPoints("Absatz: Inhalt nach führendem Marker bleibt erhalten."), [
      { shortText: "Inhalt nach führendem Marker bleibt erhalten.", longText: "" },
    ]);
    assert.deepEqual(buildImportPoints("Titel („Absatz“): Langtext bleibt erhalten."), [
      { shortText: "Titel", longText: "Langtext bleibt erhalten." },
    ]);
    assert.deepEqual(buildImportPoints("Absatzplanung bleibt ohne gesprochenen Einzelmarker normaler Text."), [
      {
        shortText: "Absatzplanung bleibt ohne gesprochenen Einzelmarker normaler Text.",
        longText: "",
      },
    ]);
  });

  await run("Audioimport Neu C: Importtitel und Punkte werden wiederverwendbar und atomar angelegt", async () => {
    const secondTitle = "Punkt zwei bleibt ohne Trennkommando vollständig im Kurztext und überschreitet die konfigurierte Testgrenze.";
    const harness = createServiceHarness({ transcriptText: `Punkt eins Absatz Langtext. Neuer Punkt ${secondTitle}` });
    const first = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    const root = harness.state.tops.find((top) => top.special_type === IMPORT_SPECIAL_TYPE);
    assert.equal(root.title, "Import");
    assert.equal(root.number, 0);
    assert.equal(first.pointCount, 2);
    assert.equal(harness.state.meetingTops.find((row) => row.top_id === first.createdTopIds[0]).longtext, "Langtext.");
    assert.equal(harness.state.tops.find((top) => top.id === first.createdTopIds[1]).title, secondTitle);

    harness.state.transcriptText = "Dritter Punkt.";
    const second = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    assert.equal(second.importTitleId, first.importTitleId);
    assert.equal(harness.state.tops.filter((top) => top.special_type === IMPORT_SPECIAL_TYPE).length, 1);
  });

  await run("Audioimport Neu C: Schreibfehler, Abbruch und zwischenzeitliches Schliessen hinterlassen keine Teilanlage", async () => {
    const failing = createServiceHarness({ transcriptText: "Eins. Neuer Punkt Zwei.", failOnPoint: 2 });
    await assert.rejects(
      failing.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" }),
      /simulierter Schreibfehler/
    );
    assert.equal(failing.state.tops.some((top) => top.special_type === IMPORT_SPECIAL_TYPE), false);

    const aborted = createServiceHarness();
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      aborted.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1", signal: controller.signal }),
      { name: "AbortError" }
    );
    assert.equal(aborted.state.tops.some((top) => top.special_type === IMPORT_SPECIAL_TYPE), false);

    const closed = createServiceHarness();
    closed.service.transcriptionService.transcribe = async () => {
      closed.state.meeting.is_closed = 1;
      return { transcript: { full_text: "Darf nicht gespeichert werden." } };
    };
    await assert.rejects(
      closed.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" }),
      /geschlossen/
    );
    assert.equal(closed.state.tops.some((top) => top.special_type === IMPORT_SPECIAL_TYPE), false);
  });

  await run("Audioimport Neu D: Druckfilter entfernt nur den aktuellen Import-Unterbaum", () => {
    const rows = [
      { id: "normal", parent_top_id: null, special_type: null },
      { id: "import", parent_top_id: null, special_type: IMPORT_SPECIAL_TYPE },
      { id: "under-import", parent_top_id: "import", special_type: null },
      { id: "moved", parent_top_id: "normal", special_type: null },
    ];
    assert.deepEqual(filterImportAreaForPrint(rows).map((row) => row.id), ["normal", "moved"]);
  });

  await run("Audioimport Neu C/D: Importtitel ist unbeweglich, verschobene Importpunkte sind normale TOPs", () => {
    const tops = new Map([
      ["import", { id: "import", project_id: "p-1", series_key: "construction", parent_top_id: null, level: 1, special_type: IMPORT_SPECIAL_TYPE }],
      ["point", { id: "point", project_id: "p-1", series_key: "construction", parent_top_id: "import", level: 2, special_type: null }],
      ["normal", { id: "normal", project_id: "p-1", series_key: "construction", parent_top_id: null, level: 1, special_type: null }],
    ]);
    const moves = [];
    const service = new TopService({
      topsRepo: {
        getTopById: (id) => tops.get(id) || null,
        getNextNumber: () => 1,
        moveTop: (move) => (moves.push(move), move),
      },
      meetingsRepo: {
        getOpenMeetingByProject: () => ({ id: "m-1" }),
        assertMeetingWritable: () => ({ id: "m-1" }),
      },
      meetingTopsRepo: { getMeetingTop: () => ({ is_carried_over: 0 }) },
    });
    assert.throws(() => service.moveTop({ topId: "import", targetParentId: "normal" }), /Import-Bereich/);
    service.moveTop({ topId: "point", targetParentId: "normal" });
    assert.deepEqual(moves[0], { topId: "point", targetParentId: "normal", newLevel: 2, newNumber: 1 });
  });

  await run("Audioimport Neu C: der typisierte Importtitel bleibt in der Liste wirklich unnummeriert", () => {
    const items = buildListItemsFromState({
      tops: [{
        id: "import",
        parent_top_id: null,
        level: 1,
        number: 0,
        displayNumber: "",
        title: "Import",
        special_type: IMPORT_SPECIAL_TYPE,
      }],
      selectedTopId: null,
      collapsedLevel1Ids: [],
      topFilter: "all",
    });
    assert.equal(items[0].number, "");
  });

  await run("Audioimport Neu B-D: produktive IPCs halten Fortschritt und gezielten Abbruch getrennt vom Live-Diktat", () => {
    assert.match(ipcSource, /activeProtocolImports\.set\(operationKey, controller\)/);
    assert.match(ipcSource, /controller\.abort\(\)/);
    assert.match(ipcSource, /audio:protocolImportProgress/);
    assert.match(preloadSource, /audioOnProtocolImportProgress/);
    assert.match(ipcSource, /ipcMain\.handle\("audio:transcribeBlob"/);
    assert.doesNotMatch(ipcSource.slice(ipcSource.indexOf('ipcMain.handle("audio:cancelProtocolImport"'), ipcSource.indexOf("// Technische Audio-Dienst-Einstiege")), /transcribeBlob|_serverState\.process\.kill/);
  });

  await run("Audioimport Neu Bestandsschutz: Registry-40-Profil bleibt bei zwei isolierten Starts bytegleich", async () => {
    const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
    const { ElectronUiEditorSessionController, resolveBbmModuleLayoutProfileRoot } =
      require("../../src/main/ui-editor/electronUiEditorSession");
    assert.equal(registry.BBM_M80_REGISTRY_VERSION, 40);
    const activeScopes = [...registry.BBM_M80_ACTIVE_SCOPE_GROUPS.find((group) => group.includes("protokoll.screen.root"))];
    const registryScopes = registry.listM80RegistryScopes().map((scope) => scope.status === "complete"
      ? { ...scope, elements: scope.elements.map((entry) => ({
        ...entry,
        referenceResolved: true,
        ...(entry.baseline?.width === null || entry.baseline?.height === null
          ? { capturedBaseline: { width: 640, height: 64 } }
          : {}),
      })) }
      : scope);
    const registration = {
      applicationId: "bbm-produktiv",
      displayName: "BBM",
      framework: "electron",
      registryVersion: 40,
      registryStatus: "incomplete",
      activeScopes,
      registryScopes,
      supportedOperations: JSON.parse(read("ui-editor-target.json")).supportedOperations,
      uiCapability: "layout",
      pdfCapability: "unavailable",
      labelFieldSeparation: true,
      visibilityCapability: true,
    };
    const document = {
      schemaVersion: 2,
      applicationId: "bbm-produktiv",
      profileId: "standard",
      savedAt: "2026-09-20T00:00:00.000Z",
      scopes: activeScopes.map((scopeId) => ({
        scopeId,
        registryFingerprint: createUiScopeFingerprint(registryScopes.find((scope) => scope.scopeId === scopeId)),
        layoutState: {
          elements: registryScopes
            .find((scope) => scope.scopeId === scopeId)
            .elements.map((entry) => savedRegistryElement(scopeId, entry)),
        },
      })),
    };
    const profileBase = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-audio-registry40-"));
    try {
      const profileRoot = resolveBbmModuleLayoutProfileRoot(profileBase, registration).profileRoot;
      fs.mkdirSync(profileRoot, { recursive: true });
      const profilePath = path.join(profileRoot, "standard.layout-profile.json");
      fs.writeFileSync(profilePath, JSON.stringify(document), "utf8");
      const before = fs.readFileSync(profilePath);
      const beforeHash = crypto.createHash("sha256").update(before).digest("hex");
      const controller = new ElectronUiEditorSessionController({
        app: { getAppPath: () => ROOT, getVersion: () => "1.5.0", getPath: () => profileBase },
        ipcMain: { handle() {} },
        getMainWindow: () => null,
        profileRootResolver: () => profileBase,
        spawnProcess: () => assert.fail("Beim Profil-Restore darf kein Editorprozess starten."),
      });
      for (let start = 0; start < 2; start += 1) {
        const loaded = controller.loadStartupLayout(registration);
        assert.equal(loaded.ok, true, JSON.stringify(loaded));
        assert.equal(loaded.found, true);
        assert.equal(controller.completeStartupLayout({ ok: true, profileSha256: loaded.profileSha256 }).ok, true);
      }
      const after = fs.readFileSync(profilePath);
      assert.deepEqual(after, before);
      assert.equal(crypto.createHash("sha256").update(after).digest("hex"), beforeHash);
    } finally {
      fs.rmSync(profileBase, { recursive: true, force: true });
    }
  });
}

module.exports = { runProtocolAudioImportRebuildTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try {
      await test();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error);
    }
  };
  runProtocolAudioImportRebuildTests(run).then(() => {
    if (failed) process.exitCode = 1;
  }).catch((error) => {
    process.exitCode = 1;
    console.error(error?.stack || error);
  });
}
