"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

class FakeElement {
  constructor(tagName = "DIV", width = 100, height = 24) {
    this.tagName = tagName.toUpperCase(); this.nodeName = this.tagName; this.attributes = {}; this.dataset = {}; this.className = "";
    this.parentElement = null; this.children = []; this.isConnected = true; this.hidden = false; this.textContent = ""; this.value = "";
    this._rect = { left: 0, top: 0, width, height };
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.classList = { contains: (name) => this.className.split(/\s+/).includes(name), toggle: (name, active) => { const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) names.add(name); else names.delete(name); this.className = [...names].join(" "); } };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value); }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  addEventListener() {}
  append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  getBoundingClientRect() { const width = Number.parseFloat(this.style.width) || this._rect.width; const height = Number.parseFloat(this.style.height) || this._rect.height; return { left: 0, top: 0, width, height, right: width, bottom: height }; }
}

function collectEditorElements(root) {
  const result = [];
  const visit = (element) => {
    if (element?.getAttribute?.("data-ui-inspector-id") !== null) result.push(element);
    for (const child of element?.children || []) visit(child);
  };
  visit(root);
  return result;
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return { ...element.style, width: `${rect.width}px`, height: `${rect.height}px`, paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "10.667px", boxSizing: "border-box" };
}

async function runM830ComponentContractTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const mainBody = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/restarbeiten/RestarbeitenMainBody.js"));
  const quicklaneModule = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/restarbeiten/RestarbeitenQuicklane.js"));
  const rechnungScreenModule = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"));
  const contracts = registry.listM83ComponentContracts();
  const scopes = registry.listM80RegistryScopes().filter((scope) => scope.status === "complete");
  const registryIds = scopes.flatMap((scope) => scope.elements.map((entry) => entry.id));
  const contractIds = contracts.flatMap((component) => component.slots.map((slot) => slot.element.id));
  const listContract = contracts.find((component) => component.componentId === "bbm.restarbeiten.list");

  await run("M83.0 BBM 01: alle offiziellen Scopes stammen aus zwoelf komponentennahen Vertraegen", () => {
    assert.equal(contracts.length, 12); assert.deepEqual([...contractIds].sort(), [...registryIds].sort()); assert.equal(new Set(contractIds).size, contractIds.length);
    for (const component of contracts) assert.deepEqual([...component.requiredSlots].sort(), component.slots.filter((slot) => slot.required).map((slot) => slot.slotId).sort(), component.componentId);
  });
  await run("M83.0 BBM 02: Meta-Startspalte deklariert Spalte, Kopf, Nr., Datum, Klasse und reale Zusatzinhalte", () => {
    const ids = new Set(listContract.slots.map((slot) => slot.element.id));
    for (const id of ["restarbeiten.list.table.number", "restarbeiten.list.table.number.header", "restarbeiten.list.table.number.cells", "restarbeiten.record.number", "restarbeiten.record.createdAt", "restarbeiten.record.itemClass", "restarbeiten.record.aftercare", "restarbeiten.record.photos"]) assert.equal(ids.has(id), true, id);
  });
  await run("M83.0 BBM 03: zentrale Registry aggregiert nur Komponenten und fuehrt keine Unterelement-Handliste", () => {
    const source = read("src/renderer/ui-editor/m80Registry.js"); assert.doesNotMatch(source, /m83Element\(|restarbeiten\.record\.number|protokoll\.edit\.short/); assert.match(source, /aggregateBbmM83Components\(BBM_M83_COMPONENT_CONTRACTS\)/);
  });
  await run("M83.0 BBM 04: Komponenten-IDs und Ref-Quellen enthalten keine Fachwerte oder Datenbank-IDs", () => {
    const source = contracts.map((component) => JSON.stringify(component)).join("\n") + read("src/renderer/ui-editor/m80Refs.js");
    assert.doesNotMatch(source, /data-bbm-restarbeiten-record-id|app\.db|item\.id|databaseId|recordId/); assert.ok(contractIds.every((id) => !/(?:^|\.)\d{4,}(?:\.|$)|[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(id)));
  });
  await run("M83.0 BBM 05: Restarbeiten, Protokoll und Rechnung sind vollstaendig gebuendelt", () => {
    assert.deepEqual(Object.fromEntries(contracts.map((component) => [component.componentId, component.slots.length])), { "bbm.restarbeiten.filterbar": 31, "bbm.restarbeiten.quicklane": 12, "bbm.restarbeiten.list": 32, "bbm.restarbeiten.editbox": 53, "bbm.restarbeiten.mainHeaderLauncher": 1, "bbm.protokoll.screen": 9, "bbm.protokoll.quicklane": 24, "bbm.protokoll.mainHeaderLauncher": 1, "bbm.protokoll.list.shell": 6, "bbm.protokoll.list.columns": 26, "bbm.protokoll.editbox": 38, "bbm.rechnung.screen": 131 });
    assert.deepEqual(contracts.flatMap((component) => component.slots.filter((slot) => !Number.isSafeInteger(slot.element.order)).map((slot) => slot.slotId)), []);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  const body = new FakeElement("BODY", 1600, 900);
  global.Element = FakeElement; global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = { body, head: new FakeElement("HEAD"), createElement: (tag) => new FakeElement(tag), querySelector: () => null };
  global.window = {
    getComputedStyle: computedStyle,
    dispatchEvent() {},
    bbmDb: {
      rechnungList: async () => ({ ok: true, list: [] }),
      rechnungListCustomers: async () => ({ ok: true, list: [] }),
      rechnungListProjects: async () => ({ ok: true, list: [] }),
      userProfileGet: async () => ({ ok: true, profile: null }),
    },
  };
  const items = [
    { id: 7, numberLine: "17", dateLine: "01.08.26", itemClassLabel: "Rest", nachpflegeLabel: "Nachpflege", locationLine: "Bauteil A", shortTextLine: "Kurz A", longTextLine: "Lang A", dueDateLabel: "08.08.26", ampelState: "green", statusLabel: "offen", responsibleLabel: "Firma A", requiredFieldSummary: "Pflichtangabe" },
    { id: 8, numberLine: "18", dateLine: "02.08.26", itemClassLabel: "Mangel", locationLine: "Bauteil B", shortTextLine: "Kurz B", longTextLine: "Lang B", dueDateLabel: "09.08.26", ampelState: "red", statusLabel: "offen", responsibleLabel: "Firma B" },
  ];
  try {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    const invoiceScreen = new rechnungScreenModule.default();
    const invoiceRoot = invoiceScreen.render();
    body.appendChild(invoiceRoot);
    await Promise.resolve();
    await run("M83.0 Rechnung 01: echter Rechnungsscreen mountet alle 131 Einzel-Refs mit vollstaendigem DOM-Vertrag", () => {
      const component = contracts.find((entry) => entry.componentId === "bbm.rechnung.screen");
      const scope = scopes.find((entry) => entry.scopeId === "rechnung.screen");
      const expectedIds = scope.elements.map((entry) => entry.id);
      const rendered = collectEditorElements(invoiceRoot);
      const renderedIds = rendered.map((element) => element.getAttribute("data-ui-inspector-id"));
      assert.equal(expectedIds.length, 131);
      assert.equal(component.slots.length, 131);
      assert.equal(new Set(renderedIds).size, 131);
      assert.deepEqual([...renderedIds].sort(), [...expectedIds].sort());
      assert.equal(refs.validateM83ComponentReferences([component.componentId]).ok, true);
      const byId = new Map(scope.elements.map((entry) => [entry.id, entry]));
      for (const element of rendered) {
        const id = element.getAttribute("data-ui-inspector-id");
        const entry = byId.get(id);
        const ref = refs.getM80Ref(id);
        assert.ok(entry, `${id}: unerwartete Rechnung-ID`);
        assert.equal(ref.contractTargets.length, 1, `${id}: genau ein Runtime-Ziel`);
        assert.strictEqual(ref.contractTargets[0], element, `${id}: Ref zeigt auf den gerenderten Knoten`);
        assert.equal(element.getAttribute("data-ui-editor-kind"), entry.type, `${id}: kind`);
        assert.equal(element.getAttribute("data-ui-editor-label"), entry.name, `${id}: label`);
        assert.equal(element.getAttribute("data-ui-editor-parent"), entry.parentId || "", `${id}: parent`);
        assert.equal(element.getAttribute("data-ui-editor-editable"), String(entry.editable), `${id}: editable`);
        assert.equal(element.getAttribute("data-ui-editor-ops"), entry.allowedOps.join(","), `${id}: ops`);
      }
      const decrease = refs.getM80Ref("rechnung.editor.positionQuantityDecimals.decrease").element;
      const increase = refs.getM80Ref("rechnung.editor.positionQuantityDecimals.increase").element;
      assert.equal(decrease.classList.contains("invoice-button--secondary"), true);
      assert.equal(increase.classList.contains("invoice-button--secondary"), true);
      assert.equal(decrease.tagName, "BUTTON");
      assert.equal(increase.tagName, "BUTTON");
      assert.equal(decrease.getAttribute("aria-label"), "Nachkommastellen verringern");
      assert.equal(decrease.getAttribute("title"), "Nachkommastellen verringern");
      assert.equal(increase.getAttribute("aria-label"), "Nachkommastellen erhöhen");
      assert.equal(increase.getAttribute("title"), "Nachkommastellen erhöhen");
      assert.equal(decrease.children.length, 1);
      assert.equal(increase.children.length, 1);
      assert.equal(decrease.children[0].tagName, "IMG");
      assert.equal(increase.children[0].tagName, "IMG");
      assert.match(decrease.children[0].src, /decimal-decrease\.svg$/);
      assert.match(increase.children[0].src, /decimal-increase\.svg$/);
      assert.equal(decrease.children[0].style.display, "block");
      assert.equal(increase.children[0].style.display, "block");
      assert.equal(decrease.children[0].getAttribute("aria-hidden"), "true");
      assert.equal(increase.children[0].getAttribute("aria-hidden"), "true");
      assert.equal(typeof decrease.onclick, "function");
      assert.equal(typeof increase.onclick, "function");
      const position = { id: "decimal", position_number: "01", type: "service", is_title: false, parent_id: null, short_text: "Dezimalmenge", long_text: "", quantity: "1234.5678", unit: "m", unit_price_cents: 1082500, vat_rate_percent: 19, price_input_mode: "NET", is_nep: false };
      invoiceScreen.current = { id: "decimal-test", status: "DRAFT" };
      invoiceScreen.source.value = "FREE";
      invoiceScreen.positions = [position];
      invoiceScreen._selectPosition(position);
      invoiceScreen._renderPositions();
      const listQuantity = () => {
        const row = invoiceScreen.positionsList.children.find((element) => element.classList.contains("rechnung-lv-position"));
        const pricing = row.children.find((element) => element.classList.contains("rechnung-lv-position__pricing"));
        return pricing.children[0].textContent;
      };
      const listPrice = (index) => {
        const row = invoiceScreen.positionsList.children.find((element) => element.classList.contains("rechnung-lv-position"));
        const pricing = row.children.find((element) => element.classList.contains("rechnung-lv-position__pricing"));
        return pricing.children[index].textContent;
      };
      assert.equal(invoiceScreen.positionVatRate.textContent, "19 %");
      assert.equal(invoiceScreen.positionVatRate.hidden, true);
      assert.equal(invoiceScreen.positionVatRate.style.display, "none");
      assert.equal(invoiceScreen.positionVatRateField.hidden, true);
      assert.equal(invoiceScreen.positionVatRateField.style.display, "none");
      assert.equal(refs.getM80Ref("rechnung.editor.positionVatRate.label").element.hidden, true);
      assert.equal(refs.getM80Ref("rechnung.editor.positionVatRate.label").element.style.display, "none");
      const decimalLabel = refs.getM80Ref("rechnung.editor.positionQuantityDecimals.label").element;
      assert.equal(decimalLabel.hidden, true);
      assert.equal(decimalLabel.style.display, "none");
      assert.equal(refs.getM80Ref("rechnung.editor.positionEditor.title.label").element.textContent, "Position 01 bearbeiten");
      assert.equal(invoiceScreen.positionQuantityDecimalsValue.textContent, "2");
      assert.equal(invoiceScreen.positionQuantity.value, "1234,57");
      assert.equal(listQuantity(), "1.234,57 m");
      assert.equal(listPrice(1), "10.825,00 €");
      assert.match(listPrice(2), /^\d{1,3}(?:\.\d{3})*,\d{2} €$/);
      for (const [fieldValue, listValue] of [["1234,6", "1.234,6 m"], ["1235", "1.235 m"]]) { decrease.onclick(); assert.equal(invoiceScreen.positionQuantity.value, fieldValue); assert.equal(listQuantity(), listValue); }
      assert.equal(decrease.disabled, true);
      for (const [fieldValue, listValue] of [["1234,6", "1.234,6 m"], ["1234,57", "1.234,57 m"], ["1234,568", "1.234,568 m"], ["1234,5678", "1.234,5678 m"]]) { increase.onclick(); assert.equal(invoiceScreen.positionQuantity.value, fieldValue); assert.equal(listQuantity(), listValue); }
      assert.equal(increase.disabled, true);
      decrease.onclick(); decrease.onclick();
      assert.equal(invoiceScreen.positionQuantityDecimalsValue.textContent, "2");
      assert.equal(invoiceScreen.positionQuantity.value, "1234,57");
      invoiceScreen._clearPositionEditor();
      assert.equal(refs.getM80Ref("rechnung.editor.positionEditor.title.label").element.textContent, "Position bearbeiten");
      assert.equal(invoiceScreen.positionQuantityDecimalsValue.textContent, "2");
    });

    refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
    body.appendChild(mainBody.buildRestarbeitenMainBody({ items, showAmpel: true, showLongtext: true }));
    await run("M83.0 BBM 06: reale gemountete Listenkomponente erfuellt alle Einzel- und Multi-Refs", () => assert.equal(refs.validateM83ComponentReferences(["bbm.restarbeiten.list"]).ok, true));
    await run("M86.15 BBM: produktive Restarbeiten-Quicklane bindet jeden Vertragsslot an den sichtbaren Direkt-Ref", () => {
      refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
      const quicklane = quicklaneModule.buildRestarbeitenQuicklane();
      body.appendChild(quicklane);
      refs.completeM80PilotRender();
      const validation = refs.validateM83ComponentReferences(["bbm.restarbeiten.quicklane"]);
      assert.equal(validation.ok, true, JSON.stringify(validation.errors));
      for (const slot of contracts.find((component) => component.componentId === "bbm.restarbeiten.quicklane").slots) {
        const ref = refs.getM80Ref(slot.element.id);
        assert.equal(ref.contractTargets.length, 1, slot.element.id);
        assert.notEqual(ref.contractTargets[0], quicklane.parentElement, slot.element.id);
        assert.equal(ref.contractTargets[0].getAttribute("data-ui-inspector-id"), slot.element.id, slot.element.id);
      }
      const buttonId = "restarbeiten.quicklane.action.ampel";
      let state = refs.snapshotM80State(buttonId);
      state = refs.applyM80State(buttonId, { ...state, x: 7, y: -4 }, "move");
      state = refs.applyM80State(buttonId, { ...state, width: 52 }, "resizeWidth");
      state = refs.applyM80State(buttonId, { ...state, height: 46 }, "resizeHeight");
      refs.applyM80State(buttonId, { ...state, fontSize: 15 }, "textResize");
      refs.beginM80PilotRender();
      const rerendered = quicklaneModule.buildRestarbeitenQuicklane();
      body.appendChild(rerendered);
      refs.completeM80PilotRender();
      const rerenderedButton = refs.getM80Ref(buttonId).contractTargets[0];
      assert.equal(rerenderedButton.style.translate, "7px -4px");
      assert.equal(rerenderedButton.style.width, "52px");
      assert.equal(rerenderedButton.style.height, "46px");
      assert.equal(rerenderedButton.style.fontSize, "15px");
    });
    refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
    body.appendChild(mainBody.buildRestarbeitenMainBody({ items, showAmpel: true, showLongtext: true }));
    await run("M83.0 BBM 07: Nr., Datum und Klasse sind getrennte Multi-Refs und getrennt direkt auswaehlbar", () => {
      const ids = ["restarbeiten.record.number", "restarbeiten.record.createdAt", "restarbeiten.record.itemClass"];
      ids.forEach((id) => { const ref = refs.getM80Ref(id); assert.equal(ref.contractTargets.length, 2); assert.equal(refs.getM80IdFromTarget(ref.contractTargets[0]), id); }); assert.equal(new Set(ids.map((id) => refs.getM80Ref(id).element)).size, 3);
    });
    await run("M83.0 BBM 08: Kind-Aenderung wirkt nur auf Nr. und nicht auf Datum, Klasse oder Spaltencontainer", () => {
      const number = refs.getM80Ref("restarbeiten.record.number"); const date = refs.getM80Ref("restarbeiten.record.createdAt"); const itemClass = refs.getM80Ref("restarbeiten.record.itemClass"); const column = refs.getM80Ref("restarbeiten.list.table.number");
      refs.applyM80State(number.id, { ...refs.snapshotM80State(number.id), x: 5 }, "move"); refs.applyM80State(number.id, { ...refs.snapshotM80State(number.id), fontSize: 14 }, "textResize");
      number.contractTargets.forEach((target) => { assert.equal(target.style.translate, "5px 0px"); assert.equal(target.style.fontSize, "14px"); }); assert.equal(date.contractTargets[0].style.translate, undefined); assert.equal(itemClass.contractTargets[0].style.fontSize, undefined); assert.equal(column.element.style.translate, undefined);
    });
    await run("M83.0 BBM 09: Header und Zeileninhalt bleiben getrennte Ziele", () => {
      assert.notStrictEqual(refs.getM80Ref("restarbeiten.list.table.number.header").element, refs.getM80Ref("restarbeiten.record.number").element); assert.equal(refs.getM80IdFromTarget(refs.getM80Ref("restarbeiten.list.table.number.header").element), "restarbeiten.list.table.number.header");
    });
    await run("M83.0 BBM 10: weitere vorhandene Start-, Gegenstands- und End-Metaziele sind gemountet", () => {
      for (const id of ["restarbeiten.record.aftercare", "restarbeiten.record.photos", "restarbeiten.record.location", "restarbeiten.record.shortText", "restarbeiten.record.longText", "restarbeiten.record.dueDate", "restarbeiten.record.ampel", "restarbeiten.record.status", "restarbeiten.record.responsible", "restarbeiten.record.requiredSummary"]) assert.ok(refs.getM80Ref(id), id);
    });
    await run("M83.0 BBM 11: Rerender erhaelt gespeicherten Kindzustand und erneuert Multi-Refs", () => {
      refs.completeM80PilotRender(); refs.beginM80PilotRender(); body.appendChild(mainBody.buildRestarbeitenMainBody({ items: [items[1]], showAmpel: true, showLongtext: true }));
      assert.equal(refs.validateM83ComponentReferences(["bbm.restarbeiten.list"]).ok, true); const number = refs.getM80Ref("restarbeiten.record.number"); assert.equal(number.contractTargets.length, 1); assert.equal(number.contractTargets[0].style.translate, "5px 0px"); assert.equal(number.contractTargets[0].style.fontSize, "14px");
    });
    await run("M83.0 BBM 12: Renderer behaelt drei vorhandene Spalten und erzeugt keine Wrapper oder neue Scrollstruktur", () => {
      const source = read("src/renderer/modules/restarbeiten/RestarbeitenList.js"); assert.match(source, /row\.append\(numberColumn, contentColumn, metaColumn\)/); assert.doesNotMatch(source, /editorWrapper|componentContractWrapper|createElement\(["'](?:viewport|scroll)/i);
    });
    await run("M83.0 BBM 13: fehlende reale Ref-Bindung benennt Komponente und Slot", () => {
      refs.beginM80PilotRender(); assert.throws(() => refs.validateM83ComponentReferences(["bbm.restarbeiten.list"]), (error) => error.code === "component_reference_contract_invalid" && error.details.some((entry) => entry.code === "component_slot_reference_missing" && entry.slotId === "restarbeiten.record.number"));
    });
    await run("M83.0 BBM 14: doppelter Einzel-Ref wird sofort benannt und abgelehnt", () => {
      refs.beginM80PilotRender(); refs.registerM80Ref("restarbeiten.list.root", new FakeElement("MAIN")); assert.throws(() => refs.registerM80Ref("restarbeiten.list.root", new FakeElement("MAIN")), (error) => error.code === "component_single_ref_duplicate");
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic(); global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }

  await run("M83.0 BBM 15: keine DOM-Erkennung erzeugt Registryziele und keine PDF-Funktion wurde veraendert", () => {
    const source = read("src/renderer/ui-editor/m80Registry.js") + read("src/renderer/ui-editor/m83ComponentContract.js"); assert.doesNotMatch(source, /querySelector|querySelectorAll|MutationObserver|createElement/); assert.doesNotMatch(source, /PdfAdapter|pdfRegistry|pdfLayoutSession/);
  });
  await run("M83.0 BBM 16: Schutzdatei licensing bleibt bytegenau unveraendert", () => {
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "docs/licensing.md"))).digest("hex").toUpperCase(); assert.equal(hash, "02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784");
  });
}

module.exports = { runM830ComponentContractTests };
if (require.main === module) {
  let failed = false; const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM830ComponentContractTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
