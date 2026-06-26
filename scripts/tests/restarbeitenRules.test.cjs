const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenRulesTests(run) {
  const rules = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/restarbeiten/domain/restarbeitenRules.js")
  );
  const today = new Date(Date.UTC(2026, 5, 24));

  await run("Restarbeiten M25: Statuswerte sind auf offen, in_arbeit und erledigt begrenzt", () => {
    assert.deepEqual(rules.RESTARBEITEN_STATUS_VALUES, ["offen", "in_arbeit", "erledigt"]);
    assert.equal(rules.normalizeRestarbeitStatus("offen"), "offen");
    assert.equal(rules.normalizeRestarbeitStatus("in_arbeit"), "in_arbeit");
    assert.equal(rules.normalizeRestarbeitStatus("in arbeit"), "in_arbeit");
    assert.equal(rules.normalizeRestarbeitStatus("erledigt"), "erledigt");
    assert.equal(rules.normalizeRestarbeitStatus("verzug"), "");
    assert.equal(rules.normalizeRestarbeitStatus("zurueckgestellt"), "");
    assert.equal(rules.normalizeRestarbeitStatus("entfaellt"), "");
    assert.equal(rules.normalizeRestarbeitStatus("problem"), "");
    assert.equal(rules.normalizeRestarbeitStatus("abgenommen"), "");
    assert.equal(rules.normalizeRestarbeitStatus("", { defaultForNew: true }), "offen");
    assert.equal(rules.normalizeRestarbeitStatus("   "), "");
    assert.equal(rules.getRestarbeitStatusLabel("unbekannt"), "Status ungueltig");
  });

  await run("Restarbeiten M25: Kurztext ist harte Erstellgrenze", () => {
    assert.equal(rules.canCreateRestarbeitDraft({ short_text: "" }), false);
    assert.equal(rules.canCreateRestarbeitDraft({ short_text: "   " }), false);
    assert.equal(rules.canCreateRestarbeitDraft({ short_text: null }), false);
    assert.equal(rules.canCreateRestarbeitDraft({ short_text: "Tuer einstellen" }), true);
  });

  await run("Restarbeiten M25: Pflichtfeldvollstaendigkeit erkennt fachliche Luecken", () => {
    const complete = {
      short_text: "Tuer einstellen",
      location_level_1: "Haus A",
      status: "offen",
      responsible_label: "AB Bau",
      due_date: "2026-07-10",
    };
    assert.equal(rules.isRestarbeitFachlichVollstaendig(complete), true);
    assert.deepEqual(rules.getMissingRestarbeitRequiredFields(complete), []);

    const missing = rules.getMissingRestarbeitRequiredFields({
      short_text: "Tuer einstellen",
      status: "unbekannt",
    }).map((field) => field.label);
    assert.deepEqual(missing, ["Ort/Bereich", "Status", "Verantwortlich", "Fertig bis"]);
    assert.equal(
      rules.getRestarbeitRequiredFieldSummary({ short_text: "Tuer einstellen", status: "unbekannt" }),
      "Unvollstaendig: Ort/Bereich, Status, Verantwortlich, Fertig bis"
    );
  });

  await run("Restarbeiten M25: Ampel ist friststabil mit 10-Tage-Warnfenster", () => {
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen" }, today), "neutral");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen", due_date: "2026-06-23" }, today), "rot");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen", due_date: "2026-06-24" }, today), "orange");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen", due_date: "2026-06-25" }, today), "orange");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen", due_date: "2026-07-04" }, today), "orange");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "offen", due_date: "2026-07-05" }, today), "gruen");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "in_arbeit", due_date: "2026-06-23" }, today), "rot");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "in arbeit", due_date: "2026-06-25" }, today), "orange");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "erledigt", due_date: "2026-06-23" }, today), "neutral");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "erledigt", due_date: "2026-07-05" }, today), "neutral");
    assert.equal(rules.calculateRestarbeitAmpel({ status: "unbekannt", due_date: "2026-06-23" }, today), "neutral");
  });
}

module.exports = { runRestarbeitenRulesTests };
