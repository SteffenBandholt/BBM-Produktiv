const ACCEPTANCE_PROJECT_NUMBER = "M86-DIAG";
const ACCEPTANCE_PROJECT_NAME = "M86 Diagnoseprojekt";
const ACCEPTANCE_SOURCE_MEETING_TITLE = "#1 07.08.2026 - M86 Ausgangsstand";
const ACCEPTANCE_MEETING_TITLE = "#2 14.08.2026 - M86 Sichtabnahme";
const ACCEPTANCE_CARRIED_TOP_TITLE = "Fortgefuehrter Ausgangspunkt";

const ACCEPTANCE_PROJECT = Object.freeze({
  project_number: ACCEPTANCE_PROJECT_NUMBER,
  name: ACCEPTANCE_PROJECT_NAME,
  short: "M86 Diagnose",
  street: "Musterweg 1",
  zip: "00000",
  city: "Musterstadt",
  project_lead: "Alex Beispiel",
  project_lead_phone: "0000 000000",
  start_date: "2026-08-01",
  end_date: "2026-12-31",
  notes: "Neutrales, isoliertes Acceptance-Projekt fuer die M86-Sichtabnahme.",
});

const ACCEPTANCE_PROJECT_SETTINGS = Object.freeze({
  "pdf.protocolTitle": "M86 Sichtabnahme",
  "pdf.footerPlace": "Musterstadt",
  "pdf.footerDate": "14.08.2026",
  "pdf.footerName1": "Alex Beispiel",
  "pdf.footerName2": "Robin Muster",
  "pdf.footerRecorder": "Alex Beispiel",
  "pdf.footerStreet": "Musterweg 1",
  "pdf.footerZip": "00000",
  "pdf.footerCity": "Musterstadt",
});

const ACCEPTANCE_APP_SETTINGS = Object.freeze({
  "pdf.preRemarks": "Neutrale Vorbemerkung fuer die isolierte M86-Sichtabnahme. Alle Namen, Firmen und Inhalte sind Platzhalter.",
  "print.preRemarks.enabled": "1",
  "tops.ampelEnabled": "1",
});

const ACCEPTANCE_FIRMS = Object.freeze([
  Object.freeze({
    short: "PLAN",
    name: "Planung Beispiel",
    role_code: 10,
    gewerk: "Planung",
    persons: Object.freeze([
      Object.freeze({ firstName: "Alex", lastName: "Beispiel", funktion: "Protokollfuehrung", rolle: "Planung", email: "alex.beispiel@example.invalid", phone: "0000 000001", present: true, distribution: true }),
      Object.freeze({ firstName: "Robin", lastName: "Muster", funktion: "Projektleitung", rolle: "Leitung", email: "robin.muster@example.invalid", phone: "0000 000002", present: true, distribution: true }),
    ]),
  }),
  Object.freeze({
    short: "BAU",
    name: "Bauausfuehrung Beispiel",
    role_code: 20,
    gewerk: "Ausfuehrung",
    persons: Object.freeze([
      Object.freeze({ firstName: "Kim", lastName: "Probe", funktion: "Bauleitung", rolle: "Ausfuehrung", email: "kim.probe@example.invalid", phone: "0000 000003", present: true, distribution: true }),
      Object.freeze({ firstName: "Sam", lastName: "Platzhalter", funktion: "Polier", rolle: "Baustelle", email: "sam.platzhalter@example.invalid", phone: "0000 000004", present: false, distribution: true }),
    ]),
  }),
  Object.freeze({
    short: "TGA",
    name: "Technik Muster",
    role_code: 30,
    gewerk: "Technik",
    persons: Object.freeze([
      Object.freeze({ firstName: "Mika", lastName: "Neutral", funktion: "Fachplanung", rolle: "Technik", email: "mika.neutral@example.invalid", phone: "0000 000005", present: true, distribution: true }),
      Object.freeze({ firstName: "Toni", lastName: "Beispiel", funktion: "Montageleitung", rolle: "Technik", email: "toni.beispiel@example.invalid", phone: "0000 000006", present: true, distribution: false }),
    ]),
  }),
  Object.freeze({
    short: "PRUEF",
    name: "Pruefung Neutral",
    role_code: 50,
    gewerk: "Pruefung",
    persons: Object.freeze([
      Object.freeze({ firstName: "Elli", lastName: "Muster", funktion: "Qualitaetssicherung", rolle: "Pruefung", email: "elli.muster@example.invalid", phone: "0000 000007", present: false, distribution: true }),
      Object.freeze({ firstName: "Noah", lastName: "Demo", funktion: "Dokumentation", rolle: "Pruefung", email: "noah.demo@example.invalid", phone: "0000 000008", present: true, distribution: false }),
    ]),
  }),
]);

const ACCEPTANCE_TOPS = Object.freeze([
  Object.freeze({ key: "root-fortgefuehrt", parentKey: null, title: ACCEPTANCE_CARRIED_TOP_TITLE, status: "in Bearbeitung", dueDate: "2026-08-25", longtext: "Der neutrale Ausgangspunkt wurde in der aktuellen Besprechung fachlich geaendert. Damit sind Uebernahme und Beruehrungskennzeichnung ueber den echten Domaenenweg pruefbar.", important: true, task: true, decision: false, responsibleIndex: 0 }),
  Object.freeze({ key: "root-planung", parentKey: null, title: "Planungsstand und offene Punkte", status: "in Bearbeitung", dueDate: "2026-08-28", longtext: "Die neutralen Grundlagen fuer die weitere Sichtabnahme werden gemeinsam geprueft und nachvollziehbar dokumentiert.", important: true, task: false, decision: false, responsibleIndex: 0 }),
  Object.freeze({ key: "kind-einrichtung", parentKey: "root-planung", title: "Baustelleneinrichtung koordinieren", status: "offen", dueDate: "2026-08-21", longtext: "Zufahrt, Lagerflaechen und die neutrale Beschilderung werden bis zum naechsten Termin abgestimmt.", important: false, task: true, decision: false, responsibleIndex: 2 }),
  Object.freeze({ key: "kind-schnittstellen", parentKey: "root-planung", title: "Schnittstellen der beteiligten Gewerke mit ausfuehrlicher Beschreibung abstimmen", status: "in Bearbeitung", dueDate: "2026-09-04", longtext: "Dieser bewusst lange Langtext prueft den realen Umbruch und eine moegliche TOP-Fortsetzung. Planung, Ausfuehrung und Technik gleichen ihre neutralen Annahmen ab. Offene Punkte werden mit Termin und Verantwortung festgehalten, ohne reale Projekt- oder Kundendaten zu verwenden.", important: true, task: true, decision: false, responsibleIndex: 4 }),
  Object.freeze({ key: "kind-freigaben", parentKey: "root-planung", title: "Freigaben dokumentieren", status: "erledigt", dueDate: "2026-08-14", longtext: "Die beispielhafte Freigabe wurde dokumentiert und dient nur der isolierten Acceptance-Pruefung.", important: false, task: false, decision: true, responsibleIndex: 1 }),
  Object.freeze({ key: "kind-material", parentKey: "root-planung", title: "Materialbemusterung abstimmen", status: "offen", dueDate: "2026-09-11", longtext: "Die Auswahl bleibt neutral; Hersteller-, Produkt- und Kundendaten sind nicht Bestandteil der Fixture.", important: false, task: true, decision: false, responsibleIndex: 3 }),
  Object.freeze({ key: "kind-termine", parentKey: "root-planung", title: "Terminfolge pruefen", status: "in Bearbeitung", dueDate: "2026-09-18", longtext: "Die Beispieltermine werden auf Abhaengigkeiten und ausreichend Puffer geprueft.", important: true, task: true, decision: false, responsibleIndex: 5 }),
  Object.freeze({ key: "kind-abnahmen", parentKey: "root-planung", title: "Abnahmen vorbereiten", status: "offen", dueDate: "2026-10-02", longtext: "Pruefpunkte, neutrale Platzhalter und Verantwortungen werden fuer die Abnahme zusammengestellt.", important: false, task: false, decision: false, responsibleIndex: 6 }),
  Object.freeze({ key: "kind-verfolgung", parentKey: "root-planung", title: "Offene Punkte nachverfolgen", status: "erledigt", dueDate: "2026-08-14", longtext: "Die erste neutrale Pruefrunde ist abgeschlossen; der Eintrag zeigt einen erledigten Status.", important: false, task: true, decision: false, responsibleIndex: 7 }),
  Object.freeze({ key: "root-ausblick", parentKey: null, title: "Ausblick und naechste Schritte", status: "offen", dueDate: "2026-10-09", longtext: "Der Abschlussbereich enthaelt einen kurzen Ausblick auf die naechste neutrale Besprechung.", important: false, task: false, decision: false, responsibleIndex: 1 }),
]);

const REQUIRED_API_METHODS = Object.freeze([
  "projectsList",
  "projectsCreate",
  "appSettingsSetMany",
  "projectSettingsSetMany",
  "meetingsListByProject",
  "meetingsCreate",
  "meetingsClose",
  "meetingsUpdateTitle",
  "projectFirmsListByProject",
  "projectFirmsCreate",
  "projectPersonsListByProjectFirm",
  "projectPersonsCreate",
  "projectCandidatesSet",
  "meetingParticipantsSet",
  "topsListByMeeting",
  "topsCreate",
  "meetingTopsUpdate",
]);

function requireAcceptanceApi(api) {
  for (const method of REQUIRED_API_METHODS) {
    if (typeof api?.[method] !== "function") {
      throw new Error(`M86_ACCEPTANCE_API_MISSING:${method}`);
    }
  }
}

function requireOk(result, operation) {
  if (result?.ok === true) return result;
  throw new Error(`M86_ACCEPTANCE_${operation}_FAILED:${String(result?.error || "unknown")}`);
}

function pickList(result) {
  if (Array.isArray(result?.list)) return result.list;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase("de-DE") ===
    String(right || "").trim().toLocaleLowerCase("de-DE");
}

async function ensureProject(api) {
  const listed = requireOk(await api.projectsList(), "PROJECT_LIST");
  let project = pickList(listed).find((item) =>
    sameText(item?.project_number ?? item?.projectNumber, ACCEPTANCE_PROJECT_NUMBER)
  );
  if (!project) {
    const created = requireOk(await api.projectsCreate({ ...ACCEPTANCE_PROJECT }), "PROJECT_CREATE");
    project = created.project;
  }
  if (!project?.id) throw new Error("M86_ACCEPTANCE_PROJECT_ID_MISSING");
  requireOk(await api.appSettingsSetMany({ ...ACCEPTANCE_APP_SETTINGS }), "APP_SETTINGS");
  requireOk(await api.projectSettingsSetMany({
    projectId: project.id,
    patch: { ...ACCEPTANCE_PROJECT_SETTINGS },
  }), "PROJECT_SETTINGS");
  return project;
}

async function ensureParticipants(api, projectId) {
  const participants = [];
  for (const firmFixture of ACCEPTANCE_FIRMS) {
    const firmsResult = requireOk(
      await api.projectFirmsListByProject(projectId),
      "PROJECT_FIRM_LIST"
    );
    let firm = pickList(firmsResult).find((item) => sameText(item?.short, firmFixture.short));
    if (!firm) {
      const created = requireOk(await api.projectFirmsCreate({
        projectId,
        short: firmFixture.short,
        name: firmFixture.name,
        role_code: firmFixture.role_code,
        gewerk: firmFixture.gewerk,
        notes: "Neutrale M86-Acceptance-Firma.",
      }), "PROJECT_FIRM_CREATE");
      firm = created.firm;
    }
    if (!firm?.id) throw new Error(`M86_ACCEPTANCE_FIRM_ID_MISSING:${firmFixture.short}`);

    for (const personFixture of firmFixture.persons) {
      const personsResult = requireOk(
        await api.projectPersonsListByProjectFirm(firm.id),
        "PROJECT_PERSON_LIST"
      );
      let person = pickList(personsResult).find((item) =>
        sameText(item?.first_name ?? item?.firstName, personFixture.firstName) &&
        sameText(item?.last_name ?? item?.lastName, personFixture.lastName)
      );
      if (!person) {
        const created = requireOk(await api.projectPersonsCreate({
          projectFirmId: firm.id,
          firstName: personFixture.firstName,
          lastName: personFixture.lastName,
          funktion: personFixture.funktion,
          rolle: personFixture.rolle,
          email: personFixture.email,
          phone: personFixture.phone,
          notes: "Neutrale M86-Acceptance-Person.",
        }), "PROJECT_PERSON_CREATE");
        person = created.person;
      }
      if (!person?.id) throw new Error(`M86_ACCEPTANCE_PERSON_ID_MISSING:${personFixture.lastName}`);
      participants.push(Object.freeze({ person, firm, fixture: personFixture }));
    }
  }

  requireOk(await api.projectCandidatesSet({
    projectId,
    items: participants.map(({ person }) => ({
      kind: "project_person",
      personId: person.id,
      isActive: true,
    })),
  }), "PROJECT_CANDIDATES");
  return participants;
}

async function ensureMeeting(api, projectId, participants) {
  const listed = requireOk(await api.meetingsListByProject(projectId), "MEETING_LIST");
  let meeting = pickList(listed).find((item) =>
    Number(item?.is_closed ?? item?.isClosed ?? 0) === 0
  );
  if (!meeting) {
    let sourceMeeting = pickList(listed).find((item) => sameText(item?.title, ACCEPTANCE_SOURCE_MEETING_TITLE));
    if (!sourceMeeting) {
      const sourceCreated = requireOk(await api.meetingsCreate({
        projectId,
        title: ACCEPTANCE_SOURCE_MEETING_TITLE,
      }), "SOURCE_MEETING_CREATE");
      sourceMeeting = sourceCreated.meeting;
      if (!sourceMeeting?.id) throw new Error("M86_ACCEPTANCE_SOURCE_MEETING_ID_MISSING");
      const sourceTopCreated = requireOk(await api.topsCreate({
        projectId,
        meetingId: sourceMeeting.id,
        level: 1,
        parentTopId: null,
        title: ACCEPTANCE_CARRIED_TOP_TITLE,
      }), "SOURCE_TOP_CREATE");
      const sourceTop = sourceTopCreated.top;
      if (!sourceTop?.id) throw new Error("M86_ACCEPTANCE_SOURCE_TOP_ID_MISSING");
      const responsible = participants[0];
      requireOk(await api.meetingTopsUpdate({
        meetingId: sourceMeeting.id,
        topId: sourceTop.id,
        patch: {
          status: "offen",
          dueDate: "2026-08-20",
          longtext: "Neutraler Ausgangstext vor der Uebernahme in die M86-Sichtabnahme.",
          is_important: false,
          is_task: true,
          responsible_kind: "project_person",
          responsible_id: responsible.person.id,
          responsible_label: `${responsible.person.name || "Alex Beispiel"} (${responsible.firm.short})`,
        },
      }), "SOURCE_TOP_UPDATE");
      requireOk(await api.meetingsClose(sourceMeeting.id), "SOURCE_MEETING_CLOSE");
    }
    const created = requireOk(await api.meetingsCreate({
      projectId,
      title: ACCEPTANCE_MEETING_TITLE,
    }), "MEETING_CREATE");
    meeting = created.meeting;
  }
  if (!meeting?.id) throw new Error("M86_ACCEPTANCE_MEETING_ID_MISSING");
  if (!sameText(meeting.title, ACCEPTANCE_MEETING_TITLE)) {
    requireOk(await api.meetingsUpdateTitle({
      meetingId: meeting.id,
      title: ACCEPTANCE_MEETING_TITLE,
    }), "MEETING_TITLE");
    meeting = { ...meeting, title: ACCEPTANCE_MEETING_TITLE };
  }
  return meeting;
}

async function ensureMeetingParticipants(api, meetingId, participants) {
  requireOk(await api.meetingParticipantsSet({
    meetingId,
    items: participants.map(({ person, fixture }) => ({
      kind: "project_person",
      personId: person.id,
      isPresent: fixture.present,
      isInDistribution: fixture.distribution,
    })),
  }), "MEETING_PARTICIPANTS");
}

async function ensureTops(api, { projectId, meetingId, participants }) {
  const loaded = requireOk(await api.topsListByMeeting(meetingId), "TOP_LIST");
  const byTitle = new Map(pickList(loaded).map((top) => [String(top?.title || "").trim(), top]));
  const byKey = new Map();

  for (const fixture of ACCEPTANCE_TOPS) {
    let top = byTitle.get(fixture.title) || null;
    if (!top) {
      const parentTop = fixture.parentKey ? byKey.get(fixture.parentKey) : null;
      if (fixture.parentKey && !parentTop?.id) {
        throw new Error(`M86_ACCEPTANCE_PARENT_TOP_MISSING:${fixture.parentKey}`);
      }
      const created = requireOk(await api.topsCreate({
        projectId,
        meetingId,
        level: parentTop ? Number(parentTop.level || 1) + 1 : 1,
        parentTopId: parentTop?.id || null,
        title: fixture.title,
      }), "TOP_CREATE");
      top = created.top;
      byTitle.set(fixture.title, top);
    }
    if (!top?.id) throw new Error(`M86_ACCEPTANCE_TOP_ID_MISSING:${fixture.key}`);
    byKey.set(fixture.key, top);

    const responsible = participants[fixture.responsibleIndex];
    requireOk(await api.meetingTopsUpdate({
      meetingId,
      topId: top.id,
      patch: {
        status: fixture.status,
        dueDate: fixture.dueDate,
        longtext: fixture.longtext,
        is_important: fixture.important,
        is_task: fixture.task,
        is_decision: fixture.decision,
        responsible_kind: "project_person",
        responsible_id: responsible.person.id,
        responsible_label: `${responsible.person.name || `${responsible.fixture.firstName} ${responsible.fixture.lastName}`} (${responsible.firm.short})`,
      },
    }), "TOP_UPDATE");
  }

  return [...byKey.values()];
}

export async function seedProtokollAcceptanceData({ api, isolatedAcceptance = false } = {}) {
  if (isolatedAcceptance !== true) {
    throw new Error("M86_ACCEPTANCE_SEED_REQUIRES_ISOLATED_PROFILE");
  }
  requireAcceptanceApi(api);

  const project = await ensureProject(api);
  const participants = await ensureParticipants(api, project.id);
  const meeting = await ensureMeeting(api, project.id, participants);
  await ensureMeetingParticipants(api, meeting.id, participants);
  const tops = await ensureTops(api, {
    projectId: project.id,
    meetingId: meeting.id,
    participants,
  });

  return Object.freeze({
    project,
    meeting,
    participants: Object.freeze(participants.map(({ person }) => person)),
    tops: Object.freeze(tops),
  });
}

export const PROTOKOLL_ACCEPTANCE_FIXTURE = Object.freeze({
  projectNumber: ACCEPTANCE_PROJECT_NUMBER,
  projectName: ACCEPTANCE_PROJECT_NAME,
  meetingTitle: ACCEPTANCE_MEETING_TITLE,
  participantCount: ACCEPTANCE_FIRMS.reduce((total, firm) => total + firm.persons.length, 0),
  topCount: ACCEPTANCE_TOPS.length,
  childTopCount: ACCEPTANCE_TOPS.filter((top) => !!top.parentKey).length,
});
