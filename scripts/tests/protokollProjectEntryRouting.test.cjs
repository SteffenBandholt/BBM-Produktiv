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
}

module.exports = { runProtokollProjectEntryRoutingTests };
