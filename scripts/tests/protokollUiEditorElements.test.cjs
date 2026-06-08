const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ELEMENTS_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/protokoll/uiEditor/protokollUiElements.js"
);

const REQUIRED_IDS = [
  "protokoll.root",
  "protokoll.header",
  "protokoll.toolbar",
  "protokoll.list",
  "protokoll.detail",
  "protokoll.topsScreen.quicklane",
  "protokoll.topsScreen.quicklane.group.navigation",
  "protokoll.topsScreen.quicklane.group.visibility",
  "protokoll.topsScreen.quicklane.group.filter",
  "protokoll.topsScreen.quicklane.group.output",
  "protokoll.topsScreen.quicklane.action.project",
  "protokoll.topsScreen.quicklane.action.firms",
  "protokoll.topsScreen.quicklane.action.participants",
  "protokoll.topsScreen.quicklane.action.ampel",
  "protokoll.topsScreen.quicklane.action.longtext",
  "protokoll.topsScreen.quicklane.action.topFilter",
  "protokoll.topsScreen.quicklane.action.preview",
  "protokoll.topsScreen.quicklane.action.print",
  "protokoll.topsScreen.quicklane.action.mail",
  "protokoll.footer",
];

const REQUIRED_FIELDS = [
  "id",
  "type",
  "role",
  "parentId",
  "order",
  "editable",
  "allowedOps",
  "lockedOps",
];

const FORBIDDEN_DATA_FIELDS = [
  "projectId",
  "project",
  "meetingId",
  "meeting",
  "topId",
  "top",
  "databaseId",
  "database",
  "personId",
  "person",
  "date",
  "deadline",
  "status",
  "value",
  "text",
  "content",
];

const FORBIDDEN_LOGIC_SNIPPETS = [
  "document.",
  "window.",
  "querySelector",
  "addEventListener",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "fetch(",
  "XMLHttpRequest",
  "ipcRenderer",
  "ipcMain",
  "better-sqlite3",
  "sqlite",
  "db.",
  "database.",
  "execute(",
  "eval(",
  "new Function",
  "writeFile",
  "readFile",
];

function assertNoForbiddenFields(value, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenFields(entry, [...pathParts, String(index)]));
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const key of Object.keys(value)) {
    assert.equal(
      FORBIDDEN_DATA_FIELDS.includes(key),
      false,
      `forbidden data field ${key} at ${pathParts.concat(key).join(".")}`
    );
    assertNoForbiddenFields(value[key], [...pathParts, key]);
  }
}

async function loadElements() {
  const mod = await importEsmFromFile(ELEMENTS_PATH);
  assert.equal(typeof mod.getProtokollUiEditorElements, "function");
  return mod.getProtokollUiEditorElements();
}

async function runProtokollUiEditorElementsTests(run) {
  await run("Protokoll UI-Editor-Elementliste: Funktion liefert ein Array", async () => {
    const elements = await loadElements();
    assert.equal(Array.isArray(elements), true);
    assert.equal(elements.length >= REQUIRED_IDS.length, true);
  });

  await run("Protokoll UI-Editor-Elementliste: Pflicht-IDs sind eindeutig vorhanden", async () => {
    const elements = await loadElements();
    const ids = elements.map((element) => element.id);
    assert.deepEqual(new Set(ids).size, ids.length);
    for (const id of REQUIRED_IDS) {
      assert.equal(ids.includes(id), true, `missing element id ${id}`);
    }
  });

  await run("Protokoll UI-Editor-Elementliste: Parent-IDs verweisen auf vorhandene IDs oder null", async () => {
    const elements = await loadElements();
    const ids = new Set(elements.map((element) => element.id));

    for (const element of elements) {
      if (element.parentId === null) continue;
      assert.equal(
        ids.has(element.parentId),
        true,
        `unknown parentId ${element.parentId} on ${element.id}`
      );
    }
  });

  await run("Protokoll UI-Editor-Elementliste: Pflichtfelder und Ops-Felder sind vorhanden", async () => {
    const elements = await loadElements();

    for (const element of elements) {
      for (const field of REQUIRED_FIELDS) {
        assert.equal(Object.prototype.hasOwnProperty.call(element, field), true, `missing ${field}`);
      }
      assert.equal(Array.isArray(element.allowedOps), true, `allowedOps must be array on ${element.id}`);
      assert.equal(Array.isArray(element.lockedOps), true, `lockedOps must be array on ${element.id}`);
    }
  });

  await run("Protokoll UI-Editor-Elementliste: keine Fachdatenfelder enthalten", async () => {
    const elements = await loadElements();
    assertNoForbiddenFields(elements);
  });

  await run("Protokoll UI-Editor-Elementliste: keine Datenbank-, Speicher- oder Ausfuehrungslogik enthalten", () => {
    const source = fs.readFileSync(ELEMENTS_PATH, "utf8");
    for (const snippet of FORBIDDEN_LOGIC_SNIPPETS) {
      assert.equal(source.includes(snippet), false, `forbidden logic snippet: ${snippet}`);
    }
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") {
        await out;
      }
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runProtokollUiEditorElementsTests(run).then(() => {
    if (!process.exitCode) console.log("protokollUiEditorElements.test.cjs passed");
  });
}

module.exports = { runProtokollUiEditorElementsTests };
