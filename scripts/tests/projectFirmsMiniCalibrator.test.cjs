const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeNode(tag) {
  const listeners = new Map();
  const node = {
    tagName: String(tag || "").toUpperCase(),
    children: [],
    dataset: {},
    style: {
      setProperty(name, value) {
        this[String(name)] = String(value);
      },
      removeProperty(name) {
        delete this[String(name)];
      },
    },
    value: "",
    type: "",
    inputMode: "",
    placeholder: "",
    disabled: false,
    textContent: "",
    append(...items) {
      for (const item of items) {
        if (item == null) continue;
        this.children.push(item);
      }
    },
    appendChild(item) {
      if (item != null) this.children.push(item);
      return item;
    },
    addEventListener(type, handler) {
      const list = listeners.get(type) || [];
      list.push(handler);
      listeners.set(type, list);
    },
    dispatchEvent(evt) {
      const type = String(evt?.type || "");
      const list = listeners.get(type) || [];
      for (const handler of list.slice()) handler.call(this, evt);
      return true;
    },
    click() {
      return this.dispatchEvent({ type: "click" });
    },
    querySelectorAll(selector) {
      const wanted = String(selector || "").trim().toUpperCase();
      const out = [];
      const walk = (n) => {
        if (!n) return;
        if (!wanted || wanted === "*" || n.tagName === wanted) out.push(n);
        for (const c of n.children || []) walk(c);
      };
      walk(this);
      return out;
    },
  };
  return node;
}

function createFakeDocument() {
  return {
    createElement(tag) {
      return createFakeNode(tag);
    },
    body: createFakeNode("body"),
  };
}

function findNodesByTag(node, tagName) {
  return node?.querySelectorAll ? node.querySelectorAll(tagName) : [];
}

function findFirstButtonByText(root, text) {
  const buttons = findNodesByTag(root, "button");
  return buttons.find((b) => String(b.textContent || "") === text) || null;
}

function findInputs(root) {
  return findNodesByTag(root, "input");
}

async function runProjectFirmsMiniCalibratorTests(run) {
  const mod = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/layoutTools/projectFirmsMiniCalibratorV1.js")
  );

  await run("ProjectFirmsMiniCalibrator: load/save/reset nutzt tableLayouts* fuer project_firms UI/portrait", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();

    const calls = [];
    const api = {
      tableLayoutsGetOne: async (payload) => {
        calls.push({ type: "getOne", payload });
        return {
          ok: true,
          data: {
            source: "stored",
            effectiveLayout: {
              columns: [
                { key: "shortName", label: "Kurzbez.", uiWidth: "160px", pdfWidth: "23mm", headerLines: ["Kurzbez."] },
                { key: "role", label: "Funktion/Gewerk", uiWidth: "1fr", pdfWidth: "auto", headerLines: ["Funktion/Gewerk"] },
                { key: "active", label: "Aktiv", uiWidth: "70px", pdfWidth: "15mm", headerLines: ["Aktiv"] },
              ],
            },
          },
        };
      },
      tableLayoutsSave: async (payload) => {
        calls.push({ type: "save", payload });
        return { ok: true, data: {} };
      },
      tableLayoutsReset: async (payload) => {
        calls.push({ type: "reset", payload });
        return { ok: true, data: { removed: 1 } };
      },
    };
    global.window = { bbmDb: api };

    try {
      const calibrator = mod.createProjectFirmsMiniCalibratorV1({ api });
      const loadRes = await calibrator.load();
      assert.equal(loadRes.ok, true);

      assert.deepEqual(calls[0], {
        type: "getOne",
        payload: { moduleId: "projektverwaltung", tableKey: "project_firms", orientation: "portrait" },
      });

      const inputs = findInputs(calibrator.root);
      assert.equal(inputs.length >= 3, true);

      // Reihenfolge: shortName, role, active (wie im UI gebaut).
      assert.equal(inputs[0].value, "160");
      assert.equal(inputs[1].value, ""); // role bleibt flexibel (1fr)
      assert.equal(inputs[2].value, "70");

      // Setze role als fixe Breite und speichere.
      inputs[1].value = "320";
      const btnSave = findFirstButtonByText(calibrator.root, "Speichern");
      assert.ok(btnSave, "Speichern button missing");
      btnSave.click();
      // click ist sync, save async -> direkt auf save() gehen fuer determinismus
      await calibrator.save();

      const saveCall = calls.find((c) => c.type === "save");
      assert.ok(saveCall, "save call missing");
      assert.deepEqual(saveCall.payload.moduleId, "projektverwaltung");
      assert.deepEqual(saveCall.payload.tableKey, "project_firms");
      assert.deepEqual(saveCall.payload.orientation, "portrait");
      assert.equal(saveCall.payload.layout.columns[0].uiWidth, "160px");
      assert.equal(saveCall.payload.layout.columns[1].uiWidth, "320px");
      assert.equal(saveCall.payload.layout.columns[2].uiWidth, "70px");

      // Reset nutzt identity und laedt neu.
      await calibrator.reset();
      const resetCall = calls.find((c) => c.type === "reset");
      assert.ok(resetCall, "reset call missing");
      assert.deepEqual(resetCall.payload, {
        moduleId: "projektverwaltung",
        tableKey: "project_firms",
        orientation: "portrait",
      });
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });
}

module.exports = { runProjectFirmsMiniCalibratorTests };

