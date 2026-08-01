const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createMemoryApi() {
  const state = {
    projects: [],
    appSettings: {},
    projectSettings: new Map(),
    meetings: [],
    firms: [],
    persons: [],
    candidates: [],
    meetingParticipants: [],
    tops: [],
    topPatches: new Map(),
  };
  let nextId = 1;
  const id = (prefix) => `${prefix}-${nextId++}`;

  const api = {
    projectsList: async () => ({ ok: true, list: state.projects.map((item) => ({ ...item })) }),
    projectsCreate: async (data) => {
      const project = { id: id("project"), ...data };
      state.projects.push(project);
      return { ok: true, project: { ...project } };
    },
    appSettingsSetMany: async (patch) => {
      state.appSettings = { ...state.appSettings, ...patch };
      return { ok: true };
    },
    projectSettingsSetMany: async ({ projectId, patch }) => {
      state.projectSettings.set(projectId, { ...patch });
      return { ok: true };
    },
    meetingsListByProject: async (projectId) => ({
      ok: true,
      list: state.meetings.filter((item) => item.project_id === projectId).map((item) => ({ ...item })),
    }),
    meetingsCreate: async ({ projectId, title }) => {
      const meeting = { id: id("meeting"), project_id: projectId, title, is_closed: 0 };
      state.meetings.push(meeting);
      const previous = state.meetings.find((item) => item.project_id === projectId && item.is_closed === 1);
      if (previous) {
        for (const top of state.tops.filter((item) => item.meeting_id === previous.id)) {
          state.tops.push({ ...top, meeting_id: meeting.id, is_carried_over: 1 });
        }
      }
      return { ok: true, meeting: { ...meeting } };
    },
    meetingsClose: async (meetingId) => {
      const meeting = state.meetings.find((item) => item.id === meetingId);
      if (!meeting) return { ok: false, error: "meeting missing" };
      meeting.is_closed = 1;
      return { ok: true };
    },
    meetingsUpdateTitle: async ({ meetingId, title }) => {
      const meeting = state.meetings.find((item) => item.id === meetingId);
      if (!meeting) return { ok: false, error: "meeting missing" };
      meeting.title = title;
      return { ok: true };
    },
    projectFirmsListByProject: async (projectId) => ({
      ok: true,
      list: state.firms.filter((item) => item.project_id === projectId).map((item) => ({ ...item })),
    }),
    projectFirmsCreate: async (data) => {
      const firm = { id: id("firm"), project_id: data.projectId, ...data };
      state.firms.push(firm);
      return { ok: true, firm: { ...firm } };
    },
    projectPersonsListByProjectFirm: async (projectFirmId) => ({
      ok: true,
      list: state.persons.filter((item) => item.project_firm_id === projectFirmId).map((item) => ({ ...item })),
    }),
    projectPersonsCreate: async (data) => {
      const person = {
        id: id("person"),
        project_firm_id: data.projectFirmId,
        first_name: data.firstName,
        last_name: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        ...data,
      };
      state.persons.push(person);
      return { ok: true, person: { ...person } };
    },
    projectCandidatesSet: async ({ items }) => {
      state.candidates = items.map((item) => ({ ...item }));
      return { ok: true };
    },
    meetingParticipantsSet: async ({ meetingId, items }) => {
      state.meetingParticipants = items.map((item) => ({ meetingId, ...item }));
      return { ok: true };
    },
    topsListByMeeting: async (meetingId) => ({
      ok: true,
      meeting: state.meetings.find((item) => item.id === meetingId) || null,
      list: state.tops.filter((item) => item.meeting_id === meetingId).map((item) => ({ ...item })),
    }),
    topsCreate: async ({ projectId, meetingId, level, parentTopId, title }) => {
      const top = {
        id: id("top"),
        project_id: projectId,
        meeting_id: meetingId,
        parent_top_id: parentTopId,
        level,
        title,
      };
      state.tops.push(top);
      return { ok: true, top: { ...top } };
    },
    meetingTopsUpdate: async ({ topId, patch }) => {
      state.topPatches.set(topId, { ...patch });
      return { ok: true, meetingTop: { top_id: topId, ...patch } };
    },
  };
  return { api, state };
}

function clearAcceptanceModuleCache() {
  const fragments = [
    `${path.sep}src${path.sep}main${path.sep}db${path.sep}`,
    `${path.sep}src${path.sep}main${path.sep}domain${path.sep}MeetingService.js`,
    `${path.sep}src${path.sep}main${path.sep}domain${path.sep}TopService.js`,
    `${path.sep}src${path.sep}main${path.sep}print${path.sep}printData.js`,
  ];
  for (const cacheKey of Object.keys(require.cache)) {
    if (fragments.some((fragment) => cacheKey.includes(fragment))) delete require.cache[cacheKey];
  }
}

async function withRealIsolatedDatabase(seedProtokollAcceptanceData, fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m86-acceptance-test-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron") {
      return {
        app: {
          getPath: (name) => (name === "userData" ? userDataPath : ""),
          isPackaged: true,
          getAppPath: () => process.cwd(),
          getVersion: () => "1.5.0",
        },
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  clearAcceptanceModuleCache();
  try {
    const database = require("../../src/main/db/database");
    const projectsRepo = require("../../src/main/db/projectsRepo");
    const meetingsRepo = require("../../src/main/db/meetingsRepo");
    const meetingTopsRepo = require("../../src/main/db/meetingTopsRepo");
    const topsRepo = require("../../src/main/db/topsRepo");
    const projectFirmsRepo = require("../../src/main/db/projectFirmsRepo");
    const projectPersonsRepo = require("../../src/main/db/projectPersonsRepo");
    const projectSettingsRepo = require("../../src/main/db/projectSettingsRepo");
    const { appSettingsSetMany } = require("../../src/main/db/appSettingsRepo");
    const { createMeetingService } = require("../../src/main/domain/MeetingService");
    const { createTopService } = require("../../src/main/domain/TopService");
    const { getPrintData } = require("../../src/main/print/printData");
    const db = database.initDatabase();
    const meetingService = createMeetingService({ meetingsRepo, meetingTopsRepo });
    const topService = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });

    const api = {
      projectsList: async () => ({ ok: true, list: projectsRepo.listAll() }),
      projectsCreate: async (data) => ({ ok: true, project: projectsRepo.createProject(data) }),
      appSettingsSetMany: async (patch) => {
        appSettingsSetMany(patch);
        return { ok: true };
      },
      projectSettingsSetMany: async ({ projectId, patch }) => {
        projectSettingsRepo.setMany(projectId, patch);
        return { ok: true };
      },
      meetingsListByProject: async (projectId) => ({ ok: true, list: meetingsRepo.listByProject(projectId) }),
      meetingsCreate: async (data) => ({ ok: true, meeting: meetingService.createMeeting(data) }),
      meetingsClose: async (meetingId) => ({ ok: true, ...meetingService.closeMeeting(meetingId) }),
      meetingsUpdateTitle: async ({ meetingId, title }) => ({ ok: true, ...meetingsRepo.updateMeetingTitle({ meetingId, title }) }),
      projectFirmsListByProject: async (projectId) => ({ ok: true, list: projectFirmsRepo.listActiveByProject(projectId) }),
      projectFirmsCreate: async (data) => ({ ok: true, firm: projectFirmsRepo.createProjectFirm(data) }),
      projectPersonsListByProjectFirm: async (firmId) => ({ ok: true, list: projectPersonsRepo.listActiveByProjectFirm(firmId) }),
      projectPersonsCreate: async (data) => ({ ok: true, person: projectPersonsRepo.createProjectPerson(data) }),
      projectCandidatesSet: async ({ projectId, items }) => {
        const del = db.prepare("DELETE FROM project_candidates WHERE project_id = ?");
        const ins = db.prepare("INSERT INTO project_candidates (project_id, kind, person_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
        const now = "2026-08-14T10:00:00.000Z";
        db.transaction(() => {
          del.run(projectId);
          for (const item of items) ins.run(projectId, item.kind, item.personId, item.isActive ? 1 : 0, now, now);
        })();
        return { ok: true };
      },
      meetingParticipantsSet: async ({ meetingId, items }) => {
        const del = db.prepare("DELETE FROM meeting_participants WHERE meeting_id = ?");
        const ins = db.prepare("INSERT INTO meeting_participants (meeting_id, kind, person_id, is_present, is_in_distribution, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        const now = "2026-08-14T10:00:00.000Z";
        db.transaction(() => {
          del.run(meetingId);
          for (const item of items) {
            ins.run(meetingId, item.kind, item.personId, item.isPresent ? 1 : 0, item.isInDistribution ? 1 : 0, now, now);
          }
        })();
        return { ok: true };
      },
      topsListByMeeting: async (meetingId) => ({
        ok: true,
        meeting: meetingsRepo.getMeetingById(meetingId),
        list: topService.listByMeeting(meetingId),
      }),
      topsCreate: async (data) => ({ ok: true, top: topService.createTop(data) }),
      meetingTopsUpdate: async ({ meetingId, topId, patch }) => ({
        ok: true,
        meetingTop: topService.updateMeetingFields({ meetingId, topId, patch }),
      }),
    };

    const acceptance = await seedProtokollAcceptanceData({ api, isolatedAcceptance: true });
    await fn({ acceptance, api, db, getPrintData, userDataPath });
  } finally {
    try {
      require("../../src/main/db/database").closeDatabase();
    } catch (_error) {
      // best effort after an assertion failure
    }
    clearAcceptanceModuleCache();
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function runM8622ProtokollAcceptanceSeederTests(run) {
  const seederPath = path.join(process.cwd(), "src/renderer/ui-editor/protokollAcceptanceSeeder.js");
  const {
    PROTOKOLL_ACCEPTANCE_FIXTURE,
    seedProtokollAcceptanceData,
  } = await importEsmFromFile(seederPath);

  await run("M86.2.2 Seeder: Aktivierung verlangt das validierte isolierte Acceptance-Profil", async () => {
    await assert.rejects(
      () => seedProtokollAcceptanceData({ api: {}, isolatedAcceptance: false }),
      /M86_ACCEPTANCE_SEED_REQUIRES_ISOLATED_PROFILE/
    );
  });

  await run("M86.2.2 Seeder: neutrale Projekt-, Teilnehmer-, Besprechungs- und TOP-Daten sind vollstaendig und idempotent", async () => {
    const { api, state } = createMemoryApi();
    const first = await seedProtokollAcceptanceData({ api, isolatedAcceptance: true });
    const second = await seedProtokollAcceptanceData({ api, isolatedAcceptance: true });

    assert.equal(first.project.name, "M86 Diagnoseprojekt");
    assert.equal(first.meeting.title, "#2 14.08.2026 - M86 Sichtabnahme");
    assert.equal(first.participants.length, 8);
    assert.equal(first.tops.length, 10);
    assert.equal(PROTOKOLL_ACCEPTANCE_FIXTURE.childTopCount >= 6, true);
    assert.equal(state.projects.length, 1);
    assert.match(state.appSettings["pdf.preRemarks"], /M86-Sichtabnahme/);
    assert.equal(state.meetings.length, 2);
    assert.equal(state.firms.length, 4);
    assert.equal(state.persons.length, 8);
    assert.equal(state.meetingParticipants.length, 8);
    assert.equal(state.tops.filter((top) => top.meeting_id === first.meeting.id).length, 10);
    assert.equal(second.project.id, first.project.id);
    assert.equal(second.meeting.id, first.meeting.id);
    assert.equal(state.topPatches.size, 10);
    assert.equal([...state.topPatches.values()].some((patch) => patch.is_important === true), true);
    assert.equal([...state.topPatches.values()].some((patch) => patch.status === "erledigt"), true);
    assert.equal([...state.topPatches.values()].some((patch) => String(patch.longtext).length > 200), true);
  });

  await run("M86.2.2 Integration: reale isolierte DB speist getPrintData ueber den normalen Domaenenweg", () =>
    withRealIsolatedDatabase(seedProtokollAcceptanceData, async ({ acceptance, api, db, getPrintData, userDataPath }) => {
      const beforeCounts = {
        projects: db.prepare("SELECT COUNT(*) AS count FROM projects").get().count,
        meetings: db.prepare("SELECT COUNT(*) AS count FROM meetings").get().count,
        firms: db.prepare("SELECT COUNT(*) AS count FROM project_firms").get().count,
        persons: db.prepare("SELECT COUNT(*) AS count FROM project_persons").get().count,
        participants: db.prepare("SELECT COUNT(*) AS count FROM meeting_participants").get().count,
        tops: db.prepare("SELECT COUNT(*) AS count FROM tops").get().count,
      };
      await seedProtokollAcceptanceData({ api, isolatedAcceptance: true });
      const afterCounts = {
        projects: db.prepare("SELECT COUNT(*) AS count FROM projects").get().count,
        meetings: db.prepare("SELECT COUNT(*) AS count FROM meetings").get().count,
        firms: db.prepare("SELECT COUNT(*) AS count FROM project_firms").get().count,
        persons: db.prepare("SELECT COUNT(*) AS count FROM project_persons").get().count,
        participants: db.prepare("SELECT COUNT(*) AS count FROM meeting_participants").get().count,
        tops: db.prepare("SELECT COUNT(*) AS count FROM tops").get().count,
      };
      assert.deepEqual(afterCounts, beforeCounts);
      assert.equal(fs.existsSync(path.join(userDataPath, "app.db")), true);

      const printData = await getPrintData({
        mode: "protocol",
        projectId: acceptance.project.id,
        meetingId: acceptance.meeting.id,
        orientation: "portrait",
      });
      assert.equal(printData.project.name, "M86 Diagnoseprojekt");
      assert.equal(printData.meeting.title, "#2 14.08.2026 - M86 Sichtabnahme");
      assert.equal(printData.protocolTitle, "M86 Sichtabnahme");
      assert.equal(printData.participants.length, 8);
      assert.equal(printData.tops.length, 10);
      assert.equal(printData.tops.filter((top) => Number(top.level) === 1).length >= 1, true);
      assert.equal(printData.tops.filter((top) => Number(top.level) > 1).length >= 6, true);
      assert.equal(printData.settings["pdf.footerPlace"], "Musterstadt");
      assert.equal(printData.settings["pdf.footerRecorder"], "Alex Beispiel");
      assert.match(printData.settings["pdf.preRemarks"], /M86-Sichtabnahme/);
      assert.ok(printData.tableLayouts.protokoll_tops);
      const carried = db.prepare(`
        SELECT mt.is_carried_over, mt.is_touched
        FROM meeting_tops mt
        INNER JOIN tops t ON t.id = mt.top_id
        WHERE mt.meeting_id = ? AND t.title = ?
      `).get(acceptance.meeting.id, "Fortgefuehrter Ausgangspunkt");
      assert.equal(Number(carried?.is_carried_over), 1);
      assert.equal(Number(carried?.is_touched), 1);
    })
  );

  await run("M86.2.2 Integration: echter Router ersetzt Fake-Repository und Druck bleibt an realen Projektkontext gebunden", () => {
    const diagnostic = fs.readFileSync(path.join(process.cwd(), "src/renderer/ui-editor/m80Diagnostic.js"), "utf8");
    const acceptancePilot = fs.readFileSync(path.join(process.cwd(), "src/renderer/ui-editor/protokollAcceptancePilot.js"), "utf8");
    const rendererMain = fs.readFileSync(path.join(process.cwd(), "src/renderer/main.js"), "utf8");
    const main = fs.readFileSync(path.join(process.cwd(), "src/main/main.js"), "utf8");
    const quicklane = fs.readFileSync(path.join(process.cwd(), "src/renderer/modules/protokoll/TopsScreenQuicklane.js"), "utf8");
    assert.match(diagnostic, /installProtokollAcceptancePilot/);
    assert.doesNotMatch(diagnostic, /createProtokollDiagnosticRepository|new TopsScreen|bbmDb/);
    assert.match(acceptancePilot, /await seedProtokollAcceptanceData/);
    assert.match(acceptancePilot, /await router\.showTops\(acceptance\.meeting\.id, acceptance\.project\.id\)/);
    assert.match(acceptancePilot, /await openNativeUiEditor\(\{[\s\S]*projectId: acceptance\.project\.id,[\s\S]*meetingId: acceptance\.meeting\.id/);
    assert.match(acceptancePilot, /M86_ACCEPTANCE_UI_EDITOR_OPEN_FAILED/);
    assert.match(rendererMain, /isolatedAcceptance:\s*m80Diagnostic\.isolatedAcceptance === true/);
    assert.match(main, /isolatedAcceptance:\s*uiEditorAcceptanceProfile\.enabled === true/);
    assert.match(quicklane, /title:\s*"Drucken"[\s\S]*disabled:\s*disabled \|\| !hasProject/);
  });
}

module.exports = { runM8622ProtokollAcceptanceSeederTests };
