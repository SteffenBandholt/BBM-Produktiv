"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const Database = require("better-sqlite3");
const {
  IMPORT_SPECIAL_TYPE,
  ProtocolAudioImportService,
  splitTranscriptIntoPointTexts,
  splitPointIntoShortAndLongText,
} = require("../../src/main/services/audio/ProtocolAudioImportService");
const { TranscriptionService } = require("../../src/main/services/audio/TranscriptionService");
const { AudioImportService } = require("../../src/main/services/audio/AudioImportService");
const { TopService } = require("../../src/main/domain/TopService");
const { filterImportAreaForPrint } = require("../../src/main/print/printData");
const {
  createUiScopeFingerprint,
  validateTargetStartupLayoutProfile,
} = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createHarness({ transcriptText = "Erster Satz. Rest.", shortTextLimit = 100 } = {}) {
  const state = {
    meeting: { id: "m-1", project_id: "p-1", is_closed: 0 },
    tops: [
      { id: "normal-1", project_id: "p-1", parent_top_id: null, level: 1, number: 1, title: "Titel 1", special_type: null },
      { id: "normal-2", project_id: "p-1", parent_top_id: null, level: 1, number: 2, title: "Titel 2", special_type: null },
    ],
    meetingTops: [
      { meeting_id: "m-1", top_id: "normal-1" },
      { meeting_id: "m-1", top_id: "normal-2" },
    ],
    nextId: 1,
    transcribeCalls: [],
    failOnImportedPoint: 0,
    importedPointAttempts: 0,
    transcriptText,
  };

  const db = {
    transaction(callback) {
      return (...args) => {
        const snapshot = structuredClone(state);
        try {
          return callback(...args);
        } catch (error) {
          for (const key of Object.keys(state)) delete state[key];
          Object.assign(state, snapshot);
          throw error;
        }
      };
    },
  };

  const meetingsRepo = {
    getMeetingById(id) {
      return String(id) === state.meeting.id ? { ...state.meeting } : null;
    },
  };
  const topsRepo = {
    findSpecialTopByMeeting({ meetingId, specialType }) {
      const linkedIds = new Set(state.meetingTops.filter((row) => row.meeting_id === meetingId).map((row) => row.top_id));
      return state.tops.find((top) => linkedIds.has(top.id) && top.special_type === specialType && !top.removed_at) || null;
    },
    createTop({ projectId, parentTopId, level, number, title, specialType = null }) {
      if (parentTopId) {
        state.importedPointAttempts += 1;
        if (state.failOnImportedPoint === state.importedPointAttempts) {
          throw new Error("simulierter Anlagefehler");
        }
      }
      const top = {
        id: `created-${state.nextId++}`,
        project_id: projectId,
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
      const top = state.tops.find((entry) => entry.id === topId);
      top.title = title;
      return { ...top };
    },
    getNextNumber(projectId, parentTopId) {
      const siblings = state.tops.filter((top) => top.project_id === projectId && (top.parent_top_id ?? null) === (parentTopId ?? null));
      return Math.max(0, ...siblings.map((top) => Number(top.number) || 0)) + 1;
    },
  };
  const meetingTopsRepo = {
    attachTopToMeeting(payload) {
      state.meetingTops.push({
        meeting_id: payload.meetingId,
        top_id: payload.topId,
        status: payload.status,
        due_date: payload.dueDate,
        longtext: payload.longtext,
        is_carried_over: payload.isCarriedOver ? 1 : 0,
      });
    },
  };
  const transcriptionService = {
    async transcribe(payload) {
      state.transcribeCalls.push(payload);
      return { transcript: { full_text: state.transcriptText } };
    },
  };
  const service = new ProtocolAudioImportService({
    meetingsRepo,
    topsRepo,
    meetingTopsRepo,
    audioImportsRepo: {
      getById(id) {
        return id === "audio-1" ? { id, meeting_id: "m-1", project_id: "p-1" } : null;
      },
    },
    transcriptionService,
    appSettingsRepo: {
      appSettingsGetMany() {
        return { "tops.titleMax": String(shortTextLimit) };
      },
    },
    dbProvider: () => db,
  });

  return { state, service, topsRepo };
}

function importRows(state) {
  const root = state.tops.find((top) => top.special_type === IMPORT_SPECIAL_TYPE && !top.removed_at);
  return {
    root,
    points: root ? state.tops.filter((top) => top.parent_top_id === root.id) : [],
  };
}

function withPatchedElectron(callback) {
  const originalLoad = Module._load;
  const handlers = new Map();
  const calls = [];
  const electron = {
    app: { isPackaged: false, getPath: () => os.tmpdir() },
    BrowserWindow: { fromWebContents: () => null },
    dialog: {
      async showOpenDialog(_window, options) {
        calls.push(options);
        return { canceled: true, filePaths: [] };
      },
    },
    ipcMain: { handle: (channel, listener) => handlers.set(channel, listener) },
  };
  Module._load = function patched(request) {
    if (request === "electron") return electron;
    return originalLoad.apply(this, arguments);
  };
  const modulePath = require.resolve("../../src/main/ipc/audioIpc");
  delete require.cache[modulePath];
  try {
    const { registerAudioIpc } = require(modulePath);
    registerAudioIpc();
    return callback({ handlers, calls });
  } finally {
    delete require.cache[modulePath];
    Module._load = originalLoad;
  }
}

async function withIsolatedPrintData(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-349-print-data-"));
  const userDataPath = path.join(root, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron") {
      return {
        app: {
          getPath: () => userDataPath,
          getAppPath: () => process.cwd(),
          getVersion: () => "1.5.0",
          isPackaged: true,
        },
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  const clearProductModules = () => {
    for (const cacheKey of Object.keys(require.cache)) {
      if (cacheKey.includes(`${path.sep}src${path.sep}main${path.sep}db${path.sep}`)
        || cacheKey.includes(`${path.sep}src${path.sep}main${path.sep}licensing${path.sep}`)
        || cacheKey.endsWith(`${path.sep}src${path.sep}main${path.sep}print${path.sep}printData.js`)) {
        delete require.cache[cacheKey];
      }
    }
  };
  clearProductModules();
  let database = null;
  try {
    database = require("../../src/main/db/database");
    database.configureDatabaseMigrations({ valid: true, modules: ["protokoll"] }, { allowLegacyImport: false });
    const db = database.initDatabase();
    const meetingTopsRepo = require("../../src/main/db/meetingTopsRepo");
    const topsRepo = require("../../src/main/db/topsRepo");
    const { getPrintData } = require("../../src/main/print/printData");
    return await callback({ db, getPrintData, meetingTopsRepo, topsRepo });
  } finally {
    database?.closeDatabase?.();
    Module._load = originalLoad;
    clearProductModules();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runProtocolAudioImportTests(run) {
  await run("#349 01/02: Importdienst akzeptiert nur ein offenes, passendes Protokoll", async () => {
    const harness = createHarness();
    harness.state.meeting.is_closed = 1;
    await assert.rejects(
      harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" }),
      /geschlossen/
    );
    assert.equal(harness.state.transcribeCalls.length, 0);
  });

  await run("#349 03: produktiver Audio-IPC nutzt den nativen Ein-Datei-Dialog mit den vorhandenen Formaten", async () => {
    const previousUnlock = process.env.BBM_DEV_UNLOCK_AUDIO;
    process.env.BBM_DEV_UNLOCK_AUDIO = "1";
    try {
      await withPatchedElectron(async ({ handlers, calls }) => {
        const result = await handlers.get("audio:import")(
          { sender: { id: 7 } },
          { meetingId: "m-1", projectId: "p-1", processingMode: "protocol_import" }
        );
        assert.deepEqual(result, { ok: true, canceled: true });
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].properties, ["openFile"]);
        assert.equal(calls[0].title, "Sprachdatei für Import auswählen");
        assert.deepEqual(calls[0].filters[0].extensions, ["mp3", "mp4", "wav", "m4a", "aac", "ogg", "webm", "flac", "wma"]);
      });
    } finally {
      if (previousUnlock === undefined) delete process.env.BBM_DEV_UNLOCK_AUDIO;
      else process.env.BBM_DEV_UNLOCK_AUDIO = previousUnlock;
    }
  });

  await run("#349 04: Protokollimport ruft den bestehenden TranscriptionService mit demselben AbortSignal auf", async () => {
    const harness = createHarness();
    const controller = new AbortController();
    await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1", signal: controller.signal });
    assert.equal(harness.state.transcribeCalls.length, 1);
    assert.equal(harness.state.transcribeCalls[0].audioImportId, "audio-1");
    assert.equal(harness.state.transcribeCalls[0].signal, controller.signal);
  });

  await run("#349 05-10: nur neuer/nächster Punkt trennen robust und erzeugen keine Leerpunkte", () => {
    assert.deepEqual(splitTranscriptIntoPointTexts("Alpha. neuer Punkt Beta."), ["Alpha.", "Beta."]);
    assert.deepEqual(splitTranscriptIntoPointTexts("Alpha. NÄCHSTER PUNKT, Beta."), ["Alpha.", "Beta."]);
    assert.deepEqual(splitTranscriptIntoPointTexts("Alpha ohne Befehl"), ["Alpha ohne Befehl"]);
    assert.deepEqual(splitTranscriptIntoPointTexts("Neuer Punkt: Alpha."), ["Alpha."]);
    assert.deepEqual(splitTranscriptIntoPointTexts("neuer Punkt, nächster Punkt; Alpha."), ["Alpha."]);
    assert.deepEqual(splitTranscriptIntoPointTexts("erneuer Punkt bleibt Inhalt"), ["erneuer Punkt bleibt Inhalt"]);
  });

  await run("#349 11/12: erster vollständiger Satz und Längenfallback verlieren keinen Inhalt", () => {
    assert.deepEqual(splitPointIntoShortAndLongText("Erster Satz. Zweiter Satz.", 100), {
      shortText: "Erster Satz.", longText: "Zweiter Satz.",
    });
    assert.deepEqual(splitPointIntoShortAndLongText("Ein vollständiger, langer erster Satz. Rest.", 12), {
      shortText: "Ein vollständiger, langer erster Satz.", longText: "Rest.",
    });
    const raw = "Ein sehr langer Text ohne Satzende";
    const split = splitPointIntoShortAndLongText(raw, 12);
    assert.equal(split.shortText.length, 12);
    assert.equal(`${split.shortText}${split.longText}`, raw);
  });

  await run("#349 13-17: Importtitel ist typisiert, unnummeriert und ändert normale Titelnummern nicht", async () => {
    const harness = createHarness({ transcriptText: "Alpha. Langtext. neuer Punkt Beta." });
    const result = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    const { root, points } = importRows(harness.state);
    assert.equal(result.importTitleCreated, true);
    assert.equal(root.title, "Import");
    assert.equal(root.special_type, IMPORT_SPECIAL_TYPE);
    assert.equal(root.number, 0);
    assert.equal(points.length, 2);
    assert.equal(harness.topsRepo.getNextNumber("p-1", null), 3);

    const service = new TopService({
      topsRepo: {},
      meetingsRepo: { getMeetingById: () => ({ id: "m-1", is_closed: 0, updated_at: null }) },
      meetingTopsRepo: {
        listJoinedByMeeting: () => harness.state.tops.map((top) => ({
          ...top, meeting_id: "m-1", status: "offen", due_date: null, longtext: null,
          is_carried_over: 0, is_important: 0, is_touched: 0, is_task: 0, is_decision: 0,
        })),
      },
    });
    const list = service.listByMeeting("m-1");
    assert.deepEqual(list.filter((top) => !top.isImportArea).map((top) => top.displayNumber), ["1", "2"]);
    assert.equal(list.at(-3).id, root.id);
    assert.equal(list.at(-3).displayNumber, "");
  });

  await run("#349 14/18/19: vorhandener Titel wird wiederverwendet, Punkte angehängt und gelöschter Titel neu erzeugt", async () => {
    const harness = createHarness({ transcriptText: "Erster Punkt." });
    const first = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    harness.state.transcriptText = "Zweiter Punkt.";
    const second = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    assert.equal(second.importTitleId, first.importTitleId);
    assert.deepEqual(importRows(harness.state).points.map((top) => top.number), [1, 2]);

    harness.state.tops = harness.state.tops.filter((top) => top.id !== first.importTitleId && top.parent_top_id !== first.importTitleId);
    harness.state.meetingTops = harness.state.meetingTops.filter((row) => row.top_id !== first.importTitleId && harness.state.tops.some((top) => top.id === row.top_id));
    const recreated = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    assert.notEqual(recreated.importTitleId, first.importTitleId);
    assert.equal(recreated.importTitleCreated, true);
  });

  await run("#349 20: Dienst liefert exakt den ersten Punkt des aktuellen Imports für Sprung und Auswahl", async () => {
    const harness = createHarness({ transcriptText: "Alt." });
    await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    harness.state.transcriptText = "Neu eins. nächster Punkt Neu zwei.";
    const result = await harness.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" });
    assert.equal(result.createdTopIds.length, 2);
    assert.equal(result.firstCreatedTopId, result.createdTopIds[0]);
    assert.notEqual(result.firstCreatedTopId, importRows(harness.state).points[0].id);
  });

  await run("#349 21/22: Druckfilter entfernt nur Import-Unterbaum; verschobener Punkt wird normal gedruckt", () => {
    const rows = [
      { id: "normal", parent_top_id: null, special_type: null, title: "Normal" },
      { id: "import", parent_top_id: null, special_type: IMPORT_SPECIAL_TYPE, title: "Import" },
      { id: "pending", parent_top_id: "import", special_type: null, title: "Noch im Import" },
      { id: "moved", parent_top_id: "normal", special_type: null, title: "Verschoben" },
    ];
    assert.deepEqual(filterImportAreaForPrint(rows).map((row) => row.id), ["normal", "moved"]);
  });

  await run("#349 21/22: produktiver Vorschau- und Protokoll-Datenweg verwenden denselben Importfilter", async () => {
    await withIsolatedPrintData(async ({ getPrintData, meetingTopsRepo }) => {
      const originalList = meetingTopsRepo.listJoinedByMeeting;
      meetingTopsRepo.listJoinedByMeeting = () => [
        { id: "normal", parent_top_id: null, level: 1, number: 1, title: "Normal", special_type: null },
        { id: "import", parent_top_id: null, level: 1, number: 0, title: "Import", special_type: "audio_import" },
        { id: "under-import", parent_top_id: "import", level: 2, number: 1, title: "Arbeitsstand", special_type: null },
        { id: "moved", parent_top_id: "normal", level: 2, number: 2, title: "Verschoben", special_type: null },
      ];
      try {
        for (const mode of ["preview", "protocol"]) {
          const data = await getPrintData({ mode, projectId: "p-1", meetingId: "m-1" });
          assert.deepEqual(data.tops.map((top) => top.id), ["normal", "moved"]);
        }
      } finally {
        meetingTopsRepo.listJoinedByMeeting = originalList;
      }
    });
  });

  await run("#349 13/21: der Import-Unterbaum wird nicht in die nächste Besprechung übernommen", async () => {
    await withIsolatedPrintData(async ({ db, meetingTopsRepo, topsRepo }) => {
      db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p-1", "Projekt");
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, title, is_closed) VALUES (?, ?, ?, ?, ?)")
        .run("m-1", "p-1", 1, "Alt", 1);
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, title, is_closed) VALUES (?, ?, ?, ?, ?)")
        .run("m-2", "p-1", 2, "Neu", 0);

      const normal = topsRepo.createTop({ projectId: "p-1", parentTopId: null, level: 1, number: 1, title: "Normal" });
      const importTitle = topsRepo.createTop({ projectId: "p-1", parentTopId: null, level: 1, number: 0, title: "Import", specialType: "audio_import" });
      const underImport = topsRepo.createTop({ projectId: "p-1", parentTopId: importTitle.id, level: 2, number: 1, title: "Arbeitsstand" });
      const moved = topsRepo.createTop({ projectId: "p-1", parentTopId: normal.id, level: 2, number: 1, title: "Verschoben" });
      for (const top of [normal, importTitle, underImport, moved]) {
        meetingTopsRepo.attachTopToMeeting({ meetingId: "m-1", topId: top.id, status: "offen" });
      }

      meetingTopsRepo.carryOverFromMeeting({ fromMeetingId: "m-1", toMeetingId: "m-2" });
      const carriedIds = db.prepare("SELECT top_id FROM meeting_tops WHERE meeting_id = ? ORDER BY top_id")
        .all("m-2").map((row) => row.top_id);
      assert.deepEqual(carriedIds.sort(), [normal.id, moved.id].sort());
    });
  });

  await run("#349 23: Anlagefehler, leeres Transkript und Abbruch hinterlassen keinen Importtitel oder Punkt", async () => {
    const failing = createHarness({ transcriptText: "Eins. neuer Punkt Zwei." });
    failing.state.failOnImportedPoint = 2;
    await assert.rejects(failing.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" }), /Anlagefehler/);
    assert.equal(importRows(failing.state).root, undefined);
    assert.equal(failing.state.tops.length, 2);

    const empty = createHarness({ transcriptText: "   " });
    await assert.rejects(empty.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1" }), /kein verwertbares Transkript/);
    assert.equal(importRows(empty.state).root, undefined);

    const canceled = createHarness();
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(canceled.service.importFromAudio({ audioImportId: "audio-1", meetingId: "m-1", projectId: "p-1", signal: controller.signal }), (error) => error.name === "AbortError");
    assert.equal(canceled.state.transcribeCalls.length, 0);
    assert.equal(importRows(canceled.state).root, undefined);
  });

  await run("#349 23: ungültiger Pfad und nicht unterstütztes Format erzeugen keinen Audio- oder TOP-Datensatz", () => {
    const createdImports = [];
    const service = new AudioImportService({
      meetingsRepo: { getMeetingById: () => ({ id: "m-1", project_id: "p-1", is_closed: 0 }) },
      audioImportsRepo: { createImport: (payload) => { createdImports.push(payload); return payload; } },
    });
    assert.throws(
      () => service.importAudio({ meetingId: "m-1", projectId: "p-1", filePath: path.join(os.tmpdir(), "fehlt-349.wav") }),
      /nicht gefunden/
    );

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-349-format-"));
    const unsupported = path.join(directory, "kein-audio.txt");
    try {
      fs.writeFileSync(unsupported, "kein Audio", "utf8");
      assert.throws(
        () => service.importAudio({ meetingId: "m-1", projectId: "p-1", filePath: unsupported }),
        /Nicht unterstütztes Audioformat/
      );
      assert.equal(createdImports.length, 0);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  await run("#349 23: TranscriptionService kennzeichnet nur den abgebrochenen Vorgang als canceled", async () => {
    const statuses = [];
    const controller = new AbortController();
    const service = new TranscriptionService({
      meetingsRepo: { getMeetingById: () => ({ id: "m-1", project_id: "p-1", is_closed: 0 }) },
      audioImportsRepo: {
        getById: () => ({ id: "audio-1", meeting_id: "m-1", project_id: "p-1", file_path: "x.wav" }),
        updateStatus: (payload) => statuses.push(payload),
      },
      transcriptsRepo: { upsertTranscript: () => { throw new Error("nicht erreichbar"); } },
      engine: {
        getModelAvailability: () => ({ available: true }),
        transcribe: ({ signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => {
          const error = new Error("abgebrochen"); error.name = "AbortError"; error.code = "ABORT_ERR"; reject(error);
        }, { once: true })),
      },
    });
    const promise = service.transcribe({ audioImportId: "audio-1", signal: controller.signal });
    controller.abort();
    await assert.rejects(promise, (error) => error.name === "AbortError");
    assert.equal(statuses.at(-1).status, "canceled");
    assert.equal(statuses.at(-1).errorMessage, null);
  });

  await run("#349 Migration: Bestands-TOPs bleiben erhalten und erhalten nur die nullable Typ-Spalte", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-349-migration-"));
    const db = new Database(path.join(directory, "app.db"));
    try {
      db.pragma("foreign_keys = ON");
      db.exec(`
        CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
        INSERT INTO projects (id, name) VALUES ('p-1', 'Bestand');
        CREATE TABLE tops (
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_top_id TEXT, level INTEGER NOT NULL,
          number INTEGER NOT NULL, title TEXT NOT NULL, is_hidden INTEGER NOT NULL DEFAULT 0,
          created_at TEXT, updated_at TEXT
        );
        INSERT INTO tops (id, project_id, level, number, title) VALUES ('t-1', 'p-1', 1, 1, 'Bestand');
      `);
      require("../../src/main/db/database").ensureProtokollSchema(db);
      const columns = new Set(db.prepare("PRAGMA table_info(tops)").all().map((column) => column.name));
      assert.equal(columns.has("special_type"), true);
      assert.deepEqual(db.prepare("SELECT id, title, special_type FROM tops WHERE id='t-1'").get(), { id: "t-1", title: "Bestand", special_type: null });
    } finally {
      db.close();
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  await run("#349 UI-Editor: schema-gültiges Registry-38-Bestandsprofil bleibt vollständig erhalten; produktiver Restore ist idempotent", async () => {
    const [{ createM80RegistrationDescriptor }, registry, session] = await Promise.all([
      importEsmFromFile(path.join(process.cwd(), "src/renderer/ui-editor/m80HostAdapter.js")),
      importEsmFromFile(path.join(process.cwd(), "src/renderer/ui-editor/m80Registry.js")),
      Promise.resolve(require("../../src/main/ui-editor/electronUiEditorSession")),
    ]);
    const unmountedRegistration = createM80RegistrationDescriptor();
    const migration = registry.BBM_M80_PROFILE_MIGRATIONS.find(
      (entry) => entry.addedElementId === "protokoll.topsScreen.quicklane.action.importAudio"
    );
    const declaredScopes = registry.listM80RegistryScopes();
    const activeScopes = registry.BBM_M80_ACTIVE_SCOPE_GROUPS.find((scopeIds) => scopeIds.includes(migration.scopeId));
    const activeScopeIds = new Set(activeScopes);
    const declaredById = new Map(declaredScopes.map((entry) => [entry.scopeId, entry]));
    const resolvedScope = (entry) => ({
      ...entry,
      elements: entry.elements.map((element) => ({
        ...element,
        refKey: String(element.refKey || element.id),
        referenceResolved: true,
        targetCount: 1,
        mountedInstanceCount: 1,
        capturedBaseline: {
          width: Number(element.baseline?.width) || 640,
          height: Number(element.baseline?.height) || 64,
        },
      })),
    });
    const registration = {
      ...unmountedRegistration,
      activeScopes: [...activeScopes],
      registryScopes: unmountedRegistration.registryScopes.map((entry) => (
        activeScopeIds.has(entry.scopeId) ? resolvedScope(declaredById.get(entry.scopeId)) : entry
      )),
    };
    const scope = registration.registryScopes.find((entry) => entry.scopeId === migration.scopeId);
    const addedElement = scope.elements.find((entry) => entry.id === migration.addedElementId);
    assert.equal(Number.isSafeInteger(addedElement.order), true);
    assert.equal(addedElement.parentId, migration.expectedParentId);
    const oldTargetScope = {
      ...scope,
      elements: scope.elements.filter((entry) => entry.id !== migration.addedElementId),
    };
    assert.equal(createUiScopeFingerprint(oldTargetScope), migration.fromFingerprint);
    const oldRegistryScopes = registration.registryScopes.map((entry) => (
      entry.scopeId === oldTargetScope.scopeId ? oldTargetScope : entry
    ));
    const savedElement = (scopeId, entry, index, { individual = false } = {}) => {
      const saved = { elementId: entry.id, scopeId };
      const operations = new Set(entry.allowedOps);
      const bounded = (value, minimum, maximum) => Math.min(
        Number.isFinite(maximum) ? maximum : value,
        Math.max(Number.isFinite(minimum) ? minimum : value, value)
      );
      if (operations.has("move")) {
        saved.x = individual ? index * 1.375 + 0.25 : Number(entry.baseline?.x) || 0;
        saved.y = individual ? index * 2.625 + 0.125 : Number(entry.baseline?.y) || 0;
      }
      if (operations.has("resize") || operations.has("resizeWidth")) {
        saved.width = individual
          ? bounded(120.5 + index * 3.75, entry.baseline?.minWidth, entry.baseline?.maxWidth)
          : bounded(Number(entry.baseline?.width) || 640, entry.baseline?.minWidth, entry.baseline?.maxWidth);
      }
      if (operations.has("resize") || operations.has("resizeHeight")) {
        saved.height = individual
          ? bounded(24.25 + index * 0.875, entry.baseline?.minHeight, entry.baseline?.maxHeight)
          : bounded(Number(entry.baseline?.height) || 64, entry.baseline?.minHeight, entry.baseline?.maxHeight);
      }
      if (operations.has("textMove")) {
        saved.textOffsetX = individual ? index * 0.125 : Number(entry.baseline?.textOffsetX) || 0;
        saved.textOffsetY = individual ? index * 0.25 : Number(entry.baseline?.textOffsetY) || 0;
      }
      if (operations.has("textResize")) {
        saved.fontSize = individual
          ? bounded(9.5 + (index % 7) * 0.625, entry.baseline?.minFontSize, entry.baseline?.maxFontSize)
          : Number(entry.baseline?.fontSize) || 12;
      }
      if (operations.has("setVisibility")) saved.visible = individual ? index % 6 !== 0 : entry.baseline?.visible !== false;
      if (["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].some((operation) => operations.has(operation))) {
        saved.spacing = structuredClone(entry.baseline?.spacing || {});
      }
      if (entry.tableColumnLayout) {
        saved.table = {
          tableId: entry.tableBinding.tableId,
          columnId: entry.tableColumnLayout.columnId,
          widthMode: entry.tableColumnLayout.widthMode,
          wrapMode: entry.tableColumnLayout.wrapMode,
          overflowMode: entry.tableColumnLayout.overflowMode,
        };
      }
      if (entry.tableLayout) {
        saved.table = {
          tableId: entry.tableLayout.tableId,
          horizontalOverflowMode: entry.tableLayout.horizontalOverflowMode,
          rowHeightMode: entry.tableLayout.rowHeightMode,
        };
      }
      return saved;
    };
    const previousElementsInRegistryOrder = scope.elements
      .filter((entry) => entry.id !== migration.addedElementId)
      .map((entry, index) => savedElement(scope.scopeId, entry, index, { individual: true }));
    const previousById = new Map(previousElementsInRegistryOrder.map((entry) => [entry.elementId, entry]));
    const storedPriority = [
      "protokoll.screen.root",
      "protokoll.header",
      "protokoll.header.titleGroup",
      "protokoll.header.title",
      "protokoll.header.keyword",
      "protokoll.header.context",
      "protokoll.header.actions",
      "protokoll.topsScreen.quicklane",
      "protokoll.header.action.endMeeting",
      "protokoll.topsScreen.quicklane.group.navigation",
      "protokoll.header.action.close",
      "protokoll.topsScreen.quicklane.group.visibility",
      "protokoll.header.action.openUiEditor",
    ];
    const priorityIds = new Set(storedPriority);
    const previousElements = [
      ...storedPriority.map((elementId) => previousById.get(elementId)),
      ...previousElementsInRegistryOrder.filter((entry) => !priorityIds.has(entry.elementId)),
    ];
    assert.equal(previousElements.every(Boolean), true);
    assert.notDeepEqual(
      previousElements.map((entry) => entry.elementId),
      previousElementsInRegistryOrder.map((entry) => entry.elementId)
    );
    const baseProfileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-349-isolated-userdata-"));
    try {
      const profileRoot = session.resolveBbmModuleLayoutProfileRoot(baseProfileRoot, registration).profileRoot;
      const profilePath = path.join(profileRoot, "standard.layout-profile.json");
      const profileDocument = {
        schemaVersion: 2,
        applicationId: session.APPLICATION_ID,
        profileId: "standard",
        savedAt: "2026-08-31T18:48:18.113Z",
        scopes: registration.activeScopes.map((scopeId) => {
          const registryScope = oldRegistryScopes.find((entry) => entry.scopeId === scopeId);
          assert.ok(registryScope, `Alter Registry-Scope fehlt: ${scopeId}`);
          if (scopeId === migration.scopeId) {
            return {
              scopeId,
              registryFingerprint: migration.fromFingerprint,
              layoutState: { elements: previousElements },
              explicitOperations: {
                "protokoll.header.title": ["textResize"],
                "protokoll.topsScreen.quicklane": ["move"],
              },
            };
          }
          return {
            scopeId,
            registryFingerprint: createUiScopeFingerprint(registryScope),
            layoutState: {
              elements: registryScope.elements.map((entry, index) => savedElement(scopeId, entry, index)),
            },
          };
        }),
      };
      const oldValidation = validateTargetStartupLayoutProfile(profileDocument, {
        applicationId: session.APPLICATION_ID,
        profileId: "standard",
        activeScopes: registration.activeScopes,
        registryScopes: oldRegistryScopes,
      });
      assert.equal(oldValidation.ok, true, JSON.stringify(oldValidation.errors));
      fs.mkdirSync(profileRoot, { recursive: true });
      fs.writeFileSync(profilePath, `${JSON.stringify(profileDocument, null, 2)}\n`, "utf8");
      const beforeBytes = fs.readFileSync(profilePath);
      const beforeScopes = new Map(profileDocument.scopes.map((entry) => [entry.scopeId, structuredClone(entry)]));
      const beforeTargetScope = beforeScopes.get(migration.scopeId);

      let spawned = 0;
      const controller = new session.ElectronUiEditorSessionController({
        app: {
          isPackaged: false,
          getAppPath: () => process.cwd(),
          getVersion: () => "1.5.0",
          getPath: () => baseProfileRoot,
        },
        ipcMain: { handle() {} },
        getMainWindow: () => null,
        profileRootResolver: () => baseProfileRoot,
        spawnProcess: () => {
          spawned += 1;
          throw new Error("Der isolierte Start-Restore darf keinen Editorprozess starten.");
        },
      });
      const loaded = controller.loadStartupLayout(registration);
      assert.equal(loaded.ok, true, JSON.stringify(loaded));
      assert.equal(loaded.found, true);
      assert.equal(loaded.state, "compatible");
      assert.equal(loaded.editorProcessRequired, false);
      assert.equal(spawned, 0);
      const migrated = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      const migratedScope = migrated.scopes.find((entry) => entry.scopeId === migration.scopeId);
      const migratedExistingElements = migratedScope.layoutState.elements.filter(
        (entry) => entry.elementId !== migration.addedElementId
      );
      const addedElements = migratedScope.layoutState.elements.filter(
        (entry) => entry.elementId === migration.addedElementId
      );
      assert.equal(migratedScope.registryFingerprint, migration.toFingerprint);
      assert.deepEqual(migratedExistingElements, beforeTargetScope.layoutState.elements);
      assert.deepEqual(migratedScope.explicitOperations, beforeTargetScope.explicitOperations);
      for (const migratedSibling of migrated.scopes.filter((entry) => entry.scopeId !== migration.scopeId)) {
        assert.deepEqual(migratedSibling, beforeScopes.get(migratedSibling.scopeId));
      }
      assert.equal(migratedScope.layoutState.elements.length, previousElements.length + 1);
      assert.equal(new Set(migratedScope.layoutState.elements.map((entry) => entry.elementId)).size, migratedScope.layoutState.elements.length);
      assert.equal(addedElements.length, 1);
      assert.equal(addedElements[0].visible, true);
      assert.equal(migratedScope.layoutState.elements.at(-1).elementId, migration.addedElementId);
      const currentValidation = validateTargetStartupLayoutProfile(migrated, {
        applicationId: session.APPLICATION_ID,
        profileId: "standard",
        activeScopes: registration.activeScopes,
        registryScopes: registration.registryScopes,
      });
      assert.equal(currentValidation.ok, true, JSON.stringify(currentValidation.errors));
      const loadedScope = loaded.scopes.find((entry) => entry.scopeId === migration.scopeId);
      assert.deepEqual(
        loadedScope.elements.filter((entry) => entry.elementId !== migration.addedElementId),
        beforeTargetScope.layoutState.elements
      );
      assert.equal(controller.completeStartupLayout({
        ok: true,
        profileSha256: loaded.profileSha256,
        layoutStorageKey: loaded.layoutStorageKey,
      }).ok, true);
      const archiveDir = path.join(profileRoot, "archive", session.APPLICATION_ID);
      const archivesAfterFirstRun = fs.readdirSync(archiveDir);
      assert.equal(archivesAfterFirstRun.length, 1);
      assert.deepEqual(fs.readFileSync(path.join(archiveDir, archivesAfterFirstRun[0])), beforeBytes);

      const firstMigrationBytes = fs.readFileSync(profilePath);
      const loadedAgain = controller.loadStartupLayout(registration);
      assert.equal(loadedAgain.ok, true, JSON.stringify(loadedAgain));
      assert.equal(loadedAgain.found, true);
      assert.equal(controller.completeStartupLayout({
        ok: true,
        profileSha256: loadedAgain.profileSha256,
        layoutStorageKey: loadedAgain.layoutStorageKey,
      }).ok, true);
      assert.deepEqual(fs.readFileSync(profilePath), firstMigrationBytes);
      assert.deepEqual(fs.readdirSync(archiveDir), archivesAfterFirstRun);
    } finally {
      fs.rmSync(baseProfileRoot, { recursive: true, force: true });
    }
  });

  await run("#349 24: Live-Diktat bleibt auf audio:transcribeBlob und ohne Importpunkt-Orchestrator", () => {
    const controllerSource = fs.readFileSync(path.join(process.cwd(), "src/renderer/features/audio-dictation/DictationController.js"), "utf8");
    assert.match(controllerSource, /transcriptionService\.transcribeBlob\(/);
    assert.doesNotMatch(controllerSource, /importToProtocol|protocol_import|audioImportToProtocol/);
  });
}

module.exports = { runProtocolAudioImportTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runProtocolAudioImportTests(run).then(() => { if (failed) process.exitCode = 1; });
}
