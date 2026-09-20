"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "../..");

async function runIsoWeekDatePickerTests(run) {
  const moduleUrl = pathToFileURL(path.join(ROOT, "src/renderer/core/date-picker/isoWeek.mjs")).href;
  const { isoWeekInfo, buildIsoMonthWeeks } = await import(moduleUrl);

  await run("ISO-Kalenderwochen stimmen an Jahresgrenze und in KW 53", () => {
    assert.deepEqual(isoWeekInfo("2020-12-31"), { week: 53, year: 2020 });
    assert.deepEqual(isoWeekInfo("2021-01-01"), { week: 53, year: 2020 });
    assert.deepEqual(isoWeekInfo("2021-01-04"), { week: 1, year: 2021 });
    assert.deepEqual(isoWeekInfo("2026-12-31"), { week: 53, year: 2026 });
  });

  await run("KW-Kalender beginnt montags und zeigt KW je Wochenzeile", () => {
    const weeks = buildIsoMonthWeeks(2021, 0);
    assert.equal(weeks.length, 6);
    assert.equal(weeks[0].days[0].value, "2020-12-28");
    assert.equal(weeks[0].days[6].value, "2021-01-03");
    assert.deepEqual({ week: weeks[0].week, year: weeks[0].year }, { week: 53, year: 2020 });
    assert.equal(weeks[1].week, 1);
  });

  await run("Protokoll-Termin und Drucktermin verwenden dieselbe KW-Komponente", () => {
    const status = fs.readFileSync(path.join(ROOT, "src/renderer/core/status-ampel/StatusAmpelField.js"), "utf8");
    const print = fs.readFileSync(path.join(ROOT, "src/renderer/modules/ausgabe/PrintModal.js"), "utf8");
    assert.match(status, /attachIsoWeekDatePicker\(this\.dueInput/);
    assert.equal((print.match(/attachIsoWeekDatePicker\(inpDate/g) || []).length, 2);
    const picker = fs.readFileSync(path.join(ROOT, "src/renderer/core/date-picker/IsoWeekDatePicker.js"), "utf8");
    assert.match(picker, /input\.addEventListener\("pointerdown", onInputPointerDown\)/);
    assert.match(picker, /input\.addEventListener\("keydown", onInputKey\)/);
    assert.match(picker, /const indicator = doc\.createElement\("span"\)/);
    assert.match(picker, /indicator\.className = "bbm-iso-week-value"/);
    assert.doesNotMatch(picker, /trigger\.addEventListener/);
    assert.doesNotMatch(picker, /bbm-iso-week-trigger/);
    assert.match(picker, /gridTemplateColumns: "38px repeat\(7, 1fr\)"/);
    assert.match(status, /this\.duePicker\.refresh\(\)/);
    assert.doesNotMatch(status, /duePicker\.button/);
  });
}

module.exports = { runIsoWeekDatePickerTests };
