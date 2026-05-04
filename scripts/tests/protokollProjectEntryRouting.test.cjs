const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runProtokollProjectEntryRoutingTests(run) {
  const { resolveProjectProtocolEntry } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/app/projectProtocolRouting.js")
  );

  const routerSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/app/Router.js"),
    "utf8"
  );
  const helperSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/app/projectProtocolRouting.js"),
    "utf8"
  );
  const meetingsViewSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/views/MeetingsView.js"),
    "utf8"
  );
  const projectWorkspaceSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js"),
    "utf8"
  );
  const projectFirmsSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/views/ProjectFirmsView.js"),
    "utf8"
  );
  const firmsPoolSource = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/views/FirmsPoolView.js"),
    "utf8"
  );

  await run("Protokoll-Projektpfad: genau eine offene Besprechung fuehrt zu Tops", () => {
    const decision = resolveProjectProtocolEntry({
      projectId: "9",
      meetings: [
        { id: "21", is_closed: 1 },
        { id: "22", is_closed: 0 },
      ],
    });

    assert.equal(decision.ok, true);
    assert.equal(decision.target, "tops");
    assert.equal(decision.reason, "single-open-meeting");
    assert.equal(decision.meetingId, "22");
    assert.equal(decision.openMeetingCount, 1);
  });

  await run("Protokoll-Projektpfad: keine offene Besprechung fuehrt in die Startview", () => {
    const decision = resolveProjectProtocolEntry({
      projectId: "9",
      meetings: [
        { id: "21", is_closed: 1 },
        { id: "22", is_closed: 1 },
      ],
    });

    assert.equal(decision.ok, true);
    assert.equal(decision.target, "meetings");
    assert.equal(decision.reason, "no-open-meeting");
    assert.equal(decision.meetingId, null);
    assert.equal(decision.openMeetingCount, 0);
  });

  await run("Protokoll-Projektpfad: mehrere offene Besprechungen bleiben ein Integritaetsfehler", () => {
    const decision = resolveProjectProtocolEntry({
      projectId: "9",
      meetings: [
        { id: "21", is_closed: 0 },
        { id: "22", is_closed: 0 },
        { id: "23", is_closed: 1 },
      ],
    });

    assert.equal(decision.ok, false);
    assert.equal(decision.target, "meetings");
    assert.equal(decision.reason, "multiple-open-meetings");
    assert.equal(decision.meetingId, null);
    assert.equal(decision.openMeetingCount, 2);
    assert.equal(decision.openMeetings.length, 2);
  });

  await run("Protokoll-Projektpfad: TopsScreen startet nicht ohne meetingId", () => {
    assert.equal(routerSource.includes("if (!effectiveMeetingId)"), true);
    assert.equal(routerSource.includes("Bitte zuerst eine Besprechung oeffnen."), true);
    assert.equal(routerSource.includes("return false;"), true);
  });

  await run("Protokoll-Projektpfad: Helper bleibt rein und importierbar", () => {
    assert.equal(helperSource.includes("resolveProjectProtocolEntry"), true);
    assert.equal(helperSource.includes("normalizeProjectProtocolMeetingList"), true);
    assert.equal(helperSource.includes("import"), false);
  });

  await run("Protokoll-Projektpfad: Startview bietet Neuanlage und Fehlerhinweis", () => {
    assert.equal(meetingsViewSource.includes("Neues Protokoll"), true);
    assert.equal(meetingsViewSource.includes("startMode"), true);
    assert.equal(meetingsViewSource.includes("integrityError"), true);
    assert.equal(meetingsViewSource.includes("meetingsCreate"), true);
    assert.equal(meetingsViewSource.includes("Datenintegritaetsfehler"), true);
    assert.equal(meetingsViewSource.includes("Kein offenes Protokoll vorhanden"), true);
  });

  await run("Protokoll-Projektpfad: Projekt-Einstiege nutzen die Projekt-Protokollauflosung", () => {
    assert.equal(projectWorkspaceSource.includes("openProjectProtocol"), true);
    assert.equal(projectFirmsSource.includes("openProjectProtocol"), true);
    assert.equal(firmsPoolSource.includes("openProjectProtocol"), true);
    assert.equal(projectWorkspaceSource.includes("showTops(meeting.id, effectiveProjectId)"), false);
    assert.equal(projectFirmsSource.includes("showTops(meetingId, pid)"), false);
    assert.equal(firmsPoolSource.includes("showTops(null, pid)"), false);
  });

  await run("Protokoll-Projektpfad: openProjectProtocol liefert blocked-Payload bei deaktiviertem Modul", async () => {
    const previousURL = global.URL;
    const previousWindow = global.window;
    const previousAlert = global.alert;
    class URLShim extends previousURL {
      constructor(spec, base) {
        if (String(base || "").startsWith("data:") && String(spec || "").includes("tops.css")) {
          super("file:///c:/_codex_stub/tops.css");
          return;
        }
        super(spec, base);
      }
    }

    global.URL = URLShim;
    global.alert = () => {};
    try {
      const { default: Router } = await importEsmFromFile(
        path.join(__dirname, "../../src/renderer/app/Router.js")
      );

      const calls = [];
      global.window = {
        bbmDb: {
          async licenseGetStatus() {
            return { ok: true, valid: true, modules: [] };
          },
          async meetingsListByProject(projectId) {
            calls.push({ type: "meetingsListByProject", projectId });
            return { ok: true, list: [] };
          },
        },
      };

      const router = new Router({
        contentRoot: {
          innerHTML: "",
          appendChild() {},
        },
      });
      router.showTops = async () => {
        calls.push({ type: "showTops" });
        return true;
      };
      router.showMeetings = async () => {
        calls.push({ type: "showMeetings" });
        return true;
      };

      const res = await router.openProjectProtocol("17", { project: { id: "17" } });
      assert.deepEqual(res, {
        ok: false,
        blocked: true,
        reason: "MODULE_DISABLED",
        moduleId: "protokoll",
        projectId: "17",
        meetingId: null,
        target: "blocked",
      });
      assert.equal(calls.some((item) => item.type === "meetingsListByProject"), false);
      assert.equal(calls.some((item) => item.type === "showTops"), false);
      assert.equal(calls.some((item) => item.type === "showMeetings"), false);
    } finally {
      global.window = previousWindow;
      global.alert = previousAlert;
      global.URL = previousURL;
    }
  });

  await run("Protokoll-Projektpfad: openProjectModule reicht blocked-Payload durch", async () => {
    const previousURL = global.URL;
    const previousWindow = global.window;
    const previousAlert = global.alert;
    class URLShim extends previousURL {
      constructor(spec, base) {
        if (String(base || "").startsWith("data:") && String(spec || "").includes("tops.css")) {
          super("file:///c:/_codex_stub/tops.css");
          return;
        }
        super(spec, base);
      }
    }

    global.URL = URLShim;
    global.alert = () => {};
    try {
      const { default: Router } = await importEsmFromFile(
        path.join(__dirname, "../../src/renderer/app/Router.js")
      );

      global.window = {
        bbmDb: {
          async licenseGetStatus() {
            return { ok: true, valid: true, modules: [] };
          },
        },
      };

      const router = new Router({
        contentRoot: {
          innerHTML: "",
          appendChild() {},
        },
      });

      const res = await router.openProjectModule("17", "protokoll", {
        project: { id: "17" },
      });

      assert.deepEqual(res, {
        ok: false,
        blocked: true,
        reason: "MODULE_DISABLED",
        moduleId: "protokoll",
        projectId: "17",
        meetingId: null,
        target: "blocked",
      });
    } finally {
      global.window = previousWindow;
      global.alert = previousAlert;
      global.URL = previousURL;
    }
  });
}

module.exports = { runProtokollProjectEntryRoutingTests };
