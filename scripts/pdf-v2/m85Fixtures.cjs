"use strict";

const { createBbmPdfAdapter } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");

const FIXTURE_MARKER = "m85-neutral-fixture-v1";

function words(count, prefix = "neutral") {
  return Array.from({ length: count }, (_value, index) => `${prefix}-${(index % 17) + 1}`).join(" ");
}

function participant(index) {
  return {
    name: `Testperson ${String(index).padStart(2, "0")}`,
    rolle: `Rolle ${(index % 4) + 1}`,
    firm: `Testfirma ${(index % 6) + 1}`,
    handy: `000-${String(index).padStart(4, "0")}`,
    email: `person-${index}@example.invalid`,
    isPresent: index % 2,
    isInDistribution: 1,
  };
}

function top(index, options = {}) {
  const level = Number(options.level || 2);
  return {
    id: `fixture-top-${index}`,
    topNumberText: options.number || `${Math.max(1, Math.ceil(index / 10))}.${index}`,
    level,
    title: options.title || `Neutraler TOP ${index}`,
    longtext: options.longtext || "",
    status: options.status || "offen",
    due_date: options.dueDate || "2026-09-30",
    responsible_label: options.responsible || `Testrolle ${(index % 4) + 1}`,
    top_created_at: "2026-08-01",
    updated_at: "2026-08-01",
    isNewTop: options.isNewTop !== false,
    is_important: options.isImportant ? 1 : 0,
    is_touched: options.isTouched ? 1 : 0,
  };
}

function restarbeit(index, options = {}) {
  return {
    id: `fixture-restarbeit-${index}`,
    running_number: String(index),
    item_class: index % 2 ? "restarbeit" : "mangel",
    short_text: options.shortText ?? `Neutraler Restpunkt ${index}`,
    long_text: options.longText ?? "",
    location_level_1: options.location1 ?? `Haus ${(index % 3) + 1}`,
    location_level_2: options.location2 ?? `Ebene ${(index % 5) + 1}`,
    location_level_3: options.location3 ?? `Einheit ${(index % 7) + 1}`,
    location_level_4: options.location4 ?? `Raum ${(index % 11) + 1}`,
    status: options.status || "offen",
    due_date: options.dueDate ?? "2026-09-30",
    responsible_label: options.responsible ?? `Testrolle ${(index % 4) + 1}`,
    completed_at: options.completedAt ?? "",
    completion_note: options.note ?? "",
    deleted_at: options.deletedAt ?? null,
  };
}

function baseData(mode = "protocol") {
  return {
    fixtureMarker: FIXTURE_MARKER,
    mode,
    orientation: "portrait",
    project: { project_number: "FIX-85", name: "Neutrales Satzmuster" },
    meeting: {
      id: "fixture-meeting",
      meeting_no: 85,
      meeting_date: "2026-08-01",
      is_closed: 1,
    },
    protocolTitle: mode === "restarbeiten" ? "Restarbeitenliste" : "Neutrales Prüfprotokoll",
    printProfile: {
      key: mode === "restarbeiten" ? "restarbeiten" : "protocol",
      documentLabel: mode === "restarbeiten" ? "Restarbeitenliste" : "Protokoll",
    },
    settings: {
      "print.preRemarks.enabled": "false",
      "pdf.footerPlace": "Testort",
      "pdf.footerDate": "01.08.2026",
      "pdf.footerName1": "Neutrale Testperson",
      "pdf.footerRecorder": "Prüfung ohne Benutzerdaten",
      "print.nextMeeting.enabled": "false",
    },
    participants: [],
    tops: [],
    restarbeitenItems: [],
    restarbeitenLocationLabels: {
      level_1_label: "Haus",
      level_2_label: "Geschoss",
      level_3_label: "Einheit",
      level_4_label: "Raum",
    },
    showAmpelInList: true,
    logos: [],
    v2Layout: {
      globalHeaderAdaptive: true,
      globalLogoBoxHeightMm: 0,
      globalHeaderHeightMm: 8,
      pagePadLeftMm: 12,
      pagePadRightMm: 12,
      pagePadTopMm: 5,
      pagePadBottomMm: 0,
      footerReserveMm: 12,
    },
    nextMeeting: { enabled: false, date: "", time: "", place: "", extra: "" },
    appVersion: "0.0.0-m85-fixture",
    buildChannel: "TEST",
  };
}

function protocolFixture(id, title, configure) {
  const data = baseData("protocol");
  configure?.(data);
  return Object.freeze({ id, number: Number(id.slice(1, 3)), title, kind: "protocol", data });
}

function restarbeitenFixture(id, title, configure) {
  const data = baseData("restarbeiten");
  data.orientation = "landscape";
  configure?.(data);
  return Object.freeze({ id, number: Number(id.slice(1, 3)), title, kind: "restarbeiten", data });
}

function addTopSeries(data, count, options = {}) {
  for (let index = 1; index <= count; index += 1) {
    data.tops.push(top(index, {
      longtext: options.longtextWords ? words(options.longtextWords, `top-${index}`) : "",
      ...options,
    }));
  }
}

function addRestarbeitenSeries(data, count, options = {}) {
  for (let index = 1; index <= count; index += 1) {
    data.restarbeitenItems.push(restarbeit(index, {
      longText: options.longtextWords ? words(options.longtextWords, `rest-${index}`) : "",
      ...options,
    }));
  }
}

function attachEditorLayout(data, changes) {
  const adapter = createBbmPdfAdapter();
  for (const change of changes) {
    const result = adapter.submitPdfChangeRequest({
      changeId: `fixture-${change.operation}-${change.elementId}`,
      scopeId: "pdf.bbm.protocol",
      ...change,
    });
    if (!result.success) {
      throw new Error(`M85-Fixture-Layoutänderung abgewiesen: ${change.elementId}/${change.operation}/${result.errorCode}`);
    }
  }
  data.pdfEditorRegistry = adapter.getPdfRegistry();
  data.pdfEditorLayoutState = adapter.getCurrentPdfLayoutState();
}

const FIXTURES = Object.freeze([
  protocolFixture("p01-empty", "Leeres Protokoll", () => {}),
  protocolFixture("p02-one-page", "Genau eine Seite", (data) => addTopSeries(data, 4, { longtextWords: 8 })),
  protocolFixture("p03-two-pages", "Genau zwei Seiten", (data) => addTopSeries(data, 15, { longtextWords: 18 })),
  protocolFixture("p04-just-fits-first", "Datensatz passt gerade noch auf Seite 1", (data) => {
    addTopSeries(data, 5, { longtextWords: 10 });
    data.tops.push(top(6, { longtext: words(30, "g") }));
  }),
  protocolFixture("p05-just-misses-first", "Datensatz passt knapp nicht mehr auf Seite 1", (data) => {
    addTopSeries(data, 10, { longtextWords: 10 });
    data.tops.push(top(11, { longtext: words(30, "g") }));
  }),
  protocolFixture("p06-level-one-near-end", "Level-1-TOP nahe Seitenende", (data) => {
    addTopSeries(data, 7, { longtextWords: 10 });
    data.tops.push(top(8, { level: 1, number: "2", title: "Neutraler Abschnitt 2" }));
    data.tops.push(top(9, { number: "2.1", longtext: words(20, "abschnitt") }));
  }),
  protocolFixture("p07-short-longtext", "TOP mit kurzem Langtext", (data) => {
    data.tops.push(top(1, { longtext: words(18, "kurz") }));
  }),
  protocolFixture("p08-very-long-longtext", "TOP mit sehr langem Langtext", (data) => {
    data.tops.push(top(1, { longtext: words(520, "lang") }));
  }),
  protocolFixture("p09-continuation", "TOP mit Fortsetzung", (data) => {
    addTopSeries(data, 8, { longtextWords: 8 });
    data.tops.push(top(9, { longtext: words(420, "fortsetzung") }));
  }),
  protocolFixture("p10-many-short", "Mehrere kurze TOPs", (data) => addTopSeries(data, 34, { longtextWords: 3 })),
  protocolFixture("p11-small-participants", "Teilnehmerbereich klein", (data) => {
    data.participants = [participant(1), participant(2)];
    addTopSeries(data, 4, { longtextWords: 6 });
  }),
  protocolFixture("p12-large-participants", "Teilnehmerbereich groß", (data) => {
    data.participants = Array.from({ length: 32 }, (_value, index) => participant(index + 1));
    addTopSeries(data, 5, { longtextWords: 6 });
  }),
  protocolFixture("p13-short-preremarks", "Vorbemerkung kurz", (data) => {
    data.settings["print.preRemarks.enabled"] = "true";
    data.settings["pdf.preRemarks"] = "Kurze neutrale Vorbemerkung.";
    addTopSeries(data, 5, { longtextWords: 5 });
  }),
  protocolFixture("p14-long-preremarks", "Vorbemerkung lang", (data) => {
    data.settings["print.preRemarks.enabled"] = "true";
    data.settings["pdf.preRemarks"] = words(850, "vorbemerkung");
    addTopSeries(data, 3, { longtextWords: 5 });
  }),
  protocolFixture("p15-closing-near-end", "Abschlussbereich knapp am Seitenende", (data) => {
    addTopSeries(data, 20, { longtextWords: 12 });
    data.nextMeeting = { enabled: true, date: "2026-10-01", time: "09:00", place: "Testort", extra: "neutral" };
  }),
  protocolFixture("p16-changed-columns", "Veränderte TOP-Spaltenbreiten", (data) => {
    addTopSeries(data, 20, { longtextWords: 24 });
    attachEditorLayout(data, [
      { elementId: "pdf.bbm.protocol.tops", operation: "resizeColumnBoundary", payload: { table: {
        leftColumnId: "pdf.bbm.protocol.tops.column.number", rightColumnId: "pdf.bbm.protocol.tops.column.text", delta: 3.82,
      } } },
      { elementId: "pdf.bbm.protocol.tops", operation: "resizeColumnBoundary", payload: { table: {
        leftColumnId: "pdf.bbm.protocol.tops.column.text", rightColumnId: "pdf.bbm.protocol.tops.column.meta", delta: 7.92,
      } } },
    ]);
  }),
  protocolFixture("p17-changed-font", "Veränderte Schriftgröße", (data) => {
    addTopSeries(data, 22, { longtextWords: 14 });
    attachEditorLayout(data, [
      { elementId: "pdf.bbm.protocol.tops.heading.text", operation: "textResize", payload: { text: { fontSize: 10 } } },
    ]);
  }),
  protocolFixture("p18-changed-line-spacing", "Veränderter Zeilenabstand", (data) => {
    addTopSeries(data, 22, { longtextWords: 20 });
    attachEditorLayout(data, [
      { elementId: "pdf.bbm.protocol.tops.rows", operation: "setLineSpacing", payload: { lineSpacing: 1.6 } },
    ]);
  }),
  restarbeitenFixture("r19-empty", "Leere Restarbeitenliste", () => {}),
  restarbeitenFixture("r20-one-page", "Restarbeiten eine Seite", (data) => addRestarbeitenSeries(data, 4, { longtextWords: 5 })),
  restarbeitenFixture("r21-multiple-pages", "Restarbeiten mehrere Seiten", (data) => addRestarbeitenSeries(data, 45, { longtextWords: 14 })),
  restarbeitenFixture("r22-short-record", "Kurzer Restarbeit-Datensatz", (data) => addRestarbeitenSeries(data, 1, { longtextWords: 3 })),
  restarbeitenFixture("r23-very-long-record", "Sehr langer Restarbeiten-Langtext", (data) => {
    data.restarbeitenItems.push(restarbeit(1, { longText: words(700, "rest-lang") }));
  }),
  restarbeitenFixture("r24-just-before-end", "Restarbeit knapp vor Seitenende", (data) => {
    addRestarbeitenSeries(data, 12, { longtextWords: 8 });
    data.restarbeitenItems.push(restarbeit(13, { longText: words(10, "rest-passend") }));
  }),
  restarbeitenFixture("r25-just-misses-end", "Restarbeit knapp nicht mehr passend", (data) => {
    addRestarbeitenSeries(data, 12, { longtextWords: 8 });
    data.restarbeitenItems.push(restarbeit(13, { longText: words(90, "rest-wechsel") }));
  }),
  restarbeitenFixture("r26-many-short", "Viele kurze Restarbeiten", (data) => addRestarbeitenSeries(data, 70, { longtextWords: 2 })),
  restarbeitenFixture("r27-columns-unsupported", "Verriegelte Restarbeiten-Spaltenbreiten", (data) => {
    addRestarbeitenSeries(data, 12, { longtextWords: 8 });
    data.lockedRestarbeitenLayout = { orientation: "landscape", columnCount: 13 };
  }),
  protocolFixture("p28-participants-exact-boundary", "Teilnehmerzeile passt genau auf die erste Seite", (data) => {
    data.participants = Array.from({ length: 11 }, (_value, index) => participant(index + 1));
  }),
  protocolFixture("p29-participants-miss-boundary", "Letzte Teilnehmerzeile passt knapp nicht mehr", (data) => {
    data.participants = Array.from({ length: 16 }, (_value, index) => participant(index + 1));
  }),
  protocolFixture("p30-participants-three-pages", "Teilnehmerblock über mindestens drei Seiten", (data) => {
    data.participants = Array.from({ length: 40 }, (_value, index) => participant(index + 1));
  }),
  protocolFixture("p31-single-tall-participant", "Einzelne überhohe Teilnehmerzeile", (data) => {
    data.participants = [{
      ...participant(1),
      name: words(100, "teilnehmer"),
    }];
  }),
  protocolFixture("p32-preremarks-over-boundary", "Vorbemerkung knapp über Seitengrenze", (data) => {
    data.settings["print.preRemarks.enabled"] = "true";
    data.settings["pdf.preRemarks"] = words(320, "vorbemerkung");
  }),
  protocolFixture("p33-preremarks-multiple-pages", "Vorbemerkung über mehrere Seiten", (data) => {
    data.settings["print.preRemarks.enabled"] = "true";
    data.settings["pdf.preRemarks"] = words(900, "vorbemerkung");
  }),
  protocolFixture("p34-participants-preremarks-tops", "Teilnehmer, Vorbemerkung und TOPs kombiniert", (data) => {
    data.participants = Array.from({ length: 18 }, (_value, index) => participant(index + 1));
    data.settings["print.preRemarks.enabled"] = "true";
    data.settings["pdf.preRemarks"] = words(420, "vorbemerkung");
    addTopSeries(data, 12, { longtextWords: 12 });
  }),
  restarbeitenFixture("r35-very-long-short-text", "Sehr langer Restarbeiten-Kurztext", (data) => {
    data.restarbeitenItems.push(restarbeit(1, { shortText: words(650, "kurztext") }));
  }),
  restarbeitenFixture("r36-very-long-note", "Sehr lange Restarbeiten-Notiz", (data) => {
    data.restarbeitenItems.push(restarbeit(1, { note: words(700, "notiz") }));
  }),
  restarbeitenFixture("r37-two-page-record", "Ein Restarbeiten-Datensatz auf zwei Seiten", (data) => {
    data.restarbeitenItems.push(restarbeit(1, { longText: words(280, "zweiseitig") }));
  }),
  restarbeitenFixture("r38-all-columns-max", "Alle 13 Restarbeiten-Spalten stark belegt", (data) => {
    data.restarbeitenItems.push(restarbeit(1, {
      shortText: words(80, "kurz"),
      longText: words(120, "lang"),
      location1: words(12, "haus"),
      location2: words(12, "geschoss"),
      location3: words(12, "einheit"),
      location4: words(12, "raum"),
      responsible: words(16, "verantwortlich"),
      completedAt: "2026-08-01",
      note: words(90, "maßnahme"),
    }));
  }),
  restarbeitenFixture("r39-status-ampel", "Status- und Ampelvarianten", (data) => {
    data.restarbeitenItems.push(
      restarbeit(1, { status: "offen", dueDate: "2026-07-01" }),
      restarbeit(2, { status: "in_arbeit", dueDate: "2026-08-05" }),
      restarbeit(3, { status: "offen", dueDate: "2026-12-01" }),
      restarbeit(4, { status: "erledigt", completedAt: "2026-08-01" })
    );
  }),
  restarbeitenFixture("r40-long-locations", "Lange Verortungsangaben", (data) => {
    data.restarbeitenItems.push(restarbeit(1, {
      location1: words(24, "haus"),
      location2: words(24, "geschoss"),
      location3: words(24, "einheit"),
      location4: words(24, "raum"),
    }));
  }),
  restarbeitenFixture("r41-filtered-order", "Gefilterte sichtbare Reihenfolge", (data) => {
    data.restarbeitenItems.push(restarbeit(9), restarbeit(3), restarbeit(7));
  }),
  restarbeitenFixture("r42-deleted-excluded", "Gelöschte Restarbeit ausgeschlossen", (data) => {
    data.restarbeitenItems.push(
      restarbeit(1),
      restarbeit(2, { deletedAt: "2026-08-01T12:00:00.000Z" }),
      restarbeit(3)
    );
  }),
  restarbeitenFixture("r43-no-extra-page", "Kein leeres Zusatzblatt", (data) => {
    addRestarbeitenSeries(data, 12, { longtextWords: 5 });
  }),
  restarbeitenFixture("r44-repeated-head", "Wiederholter Restarbeiten-Tabellenkopf", (data) => {
    addRestarbeitenSeries(data, 55, { longtextWords: 7 });
  }),
  restarbeitenFixture("r45-footer-boundary", "Restarbeiten an der Fußreserve", (data) => {
    addRestarbeitenSeries(data, 10, { longtextWords: 7 });
    data.restarbeitenItems.push(restarbeit(11, { longText: words(150, "reserve") }));
  }),
  restarbeitenFixture("r46-landscape-contract", "A4-Querformat für 13 Spalten", (data) => {
    addRestarbeitenSeries(data, 3, { longtextWords: 8 });
  }),
  restarbeitenFixture("r47-mixed-long-fields", "Lange Texte in mehreren Spalten", (data) => {
    data.restarbeitenItems.push(restarbeit(1, {
      shortText: words(90, "kurz"),
      longText: words(140, "lang"),
      note: words(80, "notiz"),
    }));
  }),
]);

function getM85Fixtures(ids = []) {
  const requested = new Set((ids || []).map(String).filter(Boolean));
  return FIXTURES
    .filter((fixture) => !requested.size || requested.has(fixture.id))
    .map((fixture) => structuredClone(fixture));
}

module.exports = Object.freeze({ FIXTURE_MARKER, FIXTURES, getM85Fixtures });
