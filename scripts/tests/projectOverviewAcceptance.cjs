"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");

module.exports = async function projectOverviewAcceptance({ evaluate, waitFor, click, cardClick, fill,
  invoke, projects, readProject, database, win, report, output, projectId, meetings, checkRefs }) {
  const json = JSON.stringify;
  const screenshot = async name => {
    const file = path.join(output, name + ".png");
    const image = await win.webContents.capturePage();
    fs.writeFileSync(file, image.toPNG()); report.screenshots.push(file);
    report.screenshotDimensions ||= [];
    report.screenshotDimensions.push({ name, ...image.getSize() });
  };
  const snapshot = () => json(["projects", "meetings", "tops", "meeting_tops", "meeting_participants"].map(table =>
    [table, database.initDatabase().prepare("SELECT * FROM " + table + " ORDER BY rowid").all()]));
  const openEdit = async id => {
    await projects(); await cardClick(id, "edit");
    await waitFor("!!msAcceptance.currentForm()?.historySavedState && !!msAcceptance.currentForm()?.builderField.ready");
  };
  const saveEdit = async () => { await click("save"); await waitFor("!msAcceptance.projectsScreen._projectFormModal"); };
  const fixtures = [];
  for (const data of [
    { name: "Projekt ohne freigeschaltete Besprechungsart mit einem sehr langen Namen für den vollständigen Umbau des Verwaltungsgebäudes und der Außenanlagen", project_number: "26-018", short: "Umbau Verwaltung", street: "Sehr langer Bauvorhabenstraßenname mit Gebäudeteil und Eingang 123", zip: "12345", meeting_series_mask: 0 },
    { name: "Einzelreihe", project_number: "26-017", short: "Einzelreihe", city: "Teiladresse ohne Straße", meeting_series_mask: 1 },
    { name: "Drei Reihen ohne Bauvorhabenadresse", short: "Drei Reihen", meeting_series_mask: 7 },
  ]) {
    const response = await invoke("bbmDb.projectsCreate", data);
    assert.equal(response.ok, true, json(response)); fixtures.push(response.project);
  }
  await projects();
  const beforeToolbar = snapshot(); await click("create");
  await waitFor("!!msAcceptance.currentForm()?.btnModalCancel && msAcceptance.currentForm().builderField.ready");
  await click("cancel"); await waitFor("!msAcceptance.projectsScreen._projectFormModal");
  assert.equal(snapshot(), beforeToolbar, "Opening/cancelling create must not modify fixture data");
  await click("transfer"); await waitFor("!!msAcceptance.projectsScreen._transferModalEl");
  await click("transferClose"); await waitFor("!msAcceptance.projectsScreen._transferModalEl");
  assert.equal(snapshot(), beforeToolbar, "Opening/closing transfer must not modify fixture data");
  assert.equal(await evaluate("document.querySelector('[data-project-grid]').children.length === document.querySelectorAll('[data-project-card]').length"), true);
  assert.equal(await evaluate("!document.querySelector('[data-project-grid] [data-project-action=create]') && !document.querySelector('[data-project-grid] [data-project-action=transfer]')"), true);
  for (const [index, keys] of [[], ["construction"], ["construction", "owner", "planning"]].entries()) {
    const buttons = await evaluate("msAcceptance.cardButtons(" + json(fixtures[index].id) + ")");
    assert.deepEqual(buttons.map(button => button.seriesKey), keys);
    assert.equal(buttons.some(button => button.historyOnly), false);
    assert.equal(await evaluate("!!msAcceptance.card(" + json(fixtures[index].id) + ").querySelector('[data-project-action=edit]')"), true);
  }
  const labels = await evaluate("[...msAcceptance.card(" + json(projectId) + ").querySelectorAll('button[data-series-key]')].map(b=>({text:b.textContent,title:b.title,aria:b.getAttribute('aria-label')}))");
  assert.deepEqual(labels.map(button => button.text), ["Baubesprechung", "Bauherr", "Planung"]);
  for (const button of labels) { assert.ok(button.title.length > 12); assert.equal(button.aria, button.title); }
  await openEdit(fixtures[0].id);
  assert.deepEqual(await evaluate("msAcceptance.historyButtons()"), [], "Disabled series without protocols must have no history");
  await click("cancel");
  report.checks.push("Overview toolbar uses actual create/cancel; grid contains only projects; 0/1/3 enabled entries, distinct short names, partial/absent addresses and accessible short button labels.");

  // The saved fixture has three existing protocols; disabling only changes the mask.
  await openEdit(projectId);
  for (const key of ["construction", "owner", "planning"]) await click("series." + key);
  await saveEdit();
  assert.equal((await readProject(projectId)).meeting_series_mask, 0);
  assert.deepEqual(await evaluate("msAcceptance.cardButtons(" + json(projectId) + ")"), []);
  await openEdit(projectId);
  assert.deepEqual((await evaluate("msAcceptance.historyButtons()")).map(button => button.seriesKey), ["construction", "owner", "planning"]);
  await checkRefs(["bbm.projektverwaltung.meetingSeries", "bbm.projektverwaltung.builder"], "Edit-only histories: all three optional mounted targets have valid parents and refs.");
  await screenshot("project-edit-history");
  const beforeHistory = snapshot();
  await fill("name", "Ungespeicherte Änderung bleibt im Dialog");
  await click("history.owner");
  assert.equal(await evaluate("!!msAcceptance.projectsScreen._projectFormModal?.overlayEl?.isConnected"), true);
  assert.equal(await evaluate("msAcceptance.currentForm().inpName.value"), "Ungespeicherte Änderung bleibt im Dialog");
  assert.match(await evaluate("msAcceptance.currentForm().modalMsgEl.textContent"), /Ungespeicherte Änderungen/);
  assert.equal(snapshot(), beforeHistory);
  await screenshot("project-edit-dirty-protection");
  await fill("name", (await readProject(projectId)).name);
  await click("series.owner");
  await click("history.construction");
  assert.equal(snapshot(), beforeHistory); assert.equal(await evaluate("msAcceptance.currentForm().meetingSeriesField.inputs.get('owner').checked"), true);
  await click("series.owner");
  await fill("builder", json(["global_firm", "ms-builder"]));
  await click("history.owner");
  assert.equal(snapshot(), beforeHistory); assert.equal(await evaluate("msAcceptance.currentForm().builderField.input.value"), json(["global_firm", "ms-builder"]));
  await fill("builder", "");
  await click("history.planning");
  await waitFor("msAcceptance.router.currentSeriesKey === 'planning' && msAcceptance.router.currentView?.historyOnly === true");
  assert.equal(snapshot(), beforeHistory);
  assert.deepEqual(await evaluate("msAcceptance.router.currentView.closedMeetings.map(m=>m.id)"), [meetings.planning.id]);
  await openEdit(projectId);
  for (const key of ["construction", "owner", "planning"]) await click("series." + key);
  await saveEdit(); assert.equal((await readProject(projectId)).meeting_series_mask, 7);
  for (const key of ["construction", "owner", "planning"]) {
    await projects(); await cardClick(projectId, "series", key);
    await waitFor("msAcceptance.router.currentMeetingId === " + json(meetings[key].id) + " && msAcceptance.router.currentSeriesKey === " + json(key));
  }
  report.checks.push("0 enabled with three protocols: histories exist only in edit; dirty name, checkbox and builder are retained without DB writes; planning history is isolated; reactivation restores all correct direct entries.");

  // Keep a representative disabled row with history for the human acceptance.
  const historyProject = await invoke("bbmDb.projectsCreate", { name: "Historie ausschließlich unter Bearbeiten", street: "Historienweg 4", city: "Testort", meeting_series_mask: 2 });
  assert.equal(historyProject.ok, true);
  const historic = await invoke("bbmDb.meetingsCreate", { projectId: historyProject.project.id, seriesKey: "owner", title: "Bisheriges Bauherrenprotokoll" });
  assert.equal(historic.ok, true, json(historic));
  await openEdit(historyProject.project.id); await click("series.owner"); await saveEdit();

  const geometry = [];
  for (const [name, width, height] of [["wide", 1400, 950], ["narrow", 760, 800], ["small", 560, 700], ["low", 760, 420]]) {
    win.setSize(width, height); await new Promise(resolve => setTimeout(resolve, 100)); await projects();
    const layout = await evaluate(`(async()=>{
      const root=document.querySelector('[data-ui-inspector-id="projektverwaltung.overview"]');
      const grid=document.querySelector('[data-project-grid]');
      const cards=[...grid.children].map(card=>({width:card.getBoundingClientRect().width,height:card.getBoundingClientRect().height,minHeight:getComputedStyle(card).minHeight,borderWidth:getComputedStyle(card).borderTopWidth,borderColor:getComputedStyle(card).borderTopColor,text:card.textContent}));
      const actions=[];
      for(const button of root.querySelectorAll('button')){
        button.scrollIntoView({block:'center',inline:'nearest'});
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const b=button.getBoundingClientRect();actions.push({text:button.textContent,left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height});
      }
      root.scrollIntoView({block:'start'});
      const columns=getComputedStyle(grid).gridTemplateColumns.split(/\\s+/).filter(Boolean).length;
      return {viewportWidth:innerWidth,viewportHeight:innerHeight,devicePixelRatio,rootWidth:root.clientWidth,scrollWidth:root.scrollWidth,bodyWidth:document.documentElement.clientWidth,bodyScroll:document.documentElement.scrollWidth,columns,actions,cards};
    })()`);
    assert.ok(layout.scrollWidth <= layout.rootWidth + 1, json(layout));
    assert.ok(layout.bodyScroll <= layout.bodyWidth + 1, json(layout));
    for (const button of layout.actions) {
      assert.ok(button.width > 0 && button.height > 0 && button.left >= -1 && button.right <= layout.viewportWidth + 1, json(button));
      assert.ok(button.top >= -1 && button.bottom <= layout.viewportHeight + 1, json(button));
    }
    assert.ok(layout.cards.some(card => card.height < 150), "Short cards must have no artificial 150px minimum");
    assert.ok(layout.cards.every(card => card.width <= 241), "Project cards must stay within the compact 240 CSS-pixel target: " + json(layout.cards));
    if (name === "wide") assert.ok(layout.columns >= 4, "Wide acceptance window must show at least four compact project-card columns: " + json(layout));
    assert.ok(layout.actions.filter(button => ["Bearbeiten", "Baubesprechung", "Bauherr", "Planung"].includes(button.text)).every(button => button.height <= 27), "Card action buttons must stay compact: " + json(layout.actions));
    assert.ok(layout.cards.every(card => Number.parseFloat(card.borderWidth) > 0 && card.borderColor !== "rgba(0, 0, 0, 0)"), "Real BBM border tokens must resolve: " + json(layout.cards));
    assert.equal(layout.cards.some(card => /\(Historie\)|nicht angegeben|undefined|null/.test(card.text)), false);
    await checkRefs(["bbm.projektverwaltung.overview", "bbm.projektverwaltung.meetingSeriesEntry"], "Overview " + name + ": complete mounted single/multi refs including conditional actions.");
    geometry.push({ name, ...layout }); await screenshot("project-overview-" + name);
    if (name === "small") {
      await evaluate("msAcceptance.card(" + json(fixtures[0].id) + ").scrollIntoView({block:'start'})");
      await new Promise(resolve => setTimeout(resolve, 50)); await screenshot("project-overview-small-long-name");
    }
  }
  report.overviewGeometry = geometry;
  win.setSize(760, 800); await openEdit(historyProject.project.id); await screenshot("project-edit-history-narrow");
  assert.deepEqual((await evaluate("msAcceptance.historyButtons()")).map(button => button.seriesKey), ["owner"]);
  await click("cancel");
  win.setSize(1400, 950); await projects();
  const beforeLayout = snapshot();
  await evaluate("msAcceptance.refs.applyM80State('projektverwaltung.overview.card.name',{fontSize:18},'textResize')");
  assert.equal(snapshot(), beforeLayout);
  await projects();
  report.checks.push("Actual productive-style screenshots: long names, partial addresses and all card/toolbar actions stay reachable at 1400/760/560px and low height; layout edits do not change domain data.");
  report.overviewFixtureProjectIds = [...fixtures.map(project => project.id), historyProject.project.id];
};

module.exports.runProjectOverviewAcceptanceTests = async function runProjectOverviewAcceptanceTests(run) {
  const { projectCardDetails } = await importEsmFromFile(path.join(ROOT,
    "src/renderer/modules/projektverwaltung/screens/ProjectOverview.js"));
  await run("Projektübersicht Acceptance: Karteninhalt bleibt kompakt und frei von Platzhaltern", () => {
    assert.deepEqual(projectCardDetails({ name: "Langname", short: "Kurz", project_number: "26-018",
      street: "Bauweg 1", zip: "12345", city: "Musterstadt" }), {
      name: "Langname", short: "Kurz", number: "26-018", address: "Bauweg 1\n12345 Musterstadt",
    });
    assert.deepEqual(projectCardDetails({ short: "Nur Kurzname", zip: "12345" }), {
      name: "Nur Kurzname", short: "", number: "", address: "12345",
    });
  });
  await run("Projektübersicht Acceptance: produktiver Aufbau hält Toolbar und Kartenaktionen getrennt", () => {
    const source = fs.readFileSync(path.join(ROOT,
      "src/renderer/modules/projektverwaltung/screens/ProjectOverview.js"), "utf8");
    assert.match(source, /dataset\.projectGrid = "true"/);
    assert.match(source, /grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,200px\),240px\)\)/);
    assert.match(source, /width:100%;max-width:240px/);
    assert.match(source, /action\("\.toolbar\.create"/);
    assert.match(source, /action\("\.toolbar\.transfer"/);
    assert.match(source, /dataset\.projectCard = "true"/);
    assert.match(source, /dataset\.projectAction = actionType/);
  });
};
