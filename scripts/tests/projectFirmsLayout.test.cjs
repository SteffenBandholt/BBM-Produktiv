const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  const createNode = (tag, doc) => {
    const listeners = {};
    const node = {
      tagName: String(tag || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentNode: null,
      style: {
        setProperty(name, value) {
          this[String(name)] = String(value);
        },
        removeProperty(name) {
          delete this[String(name)];
        },
      },
      dataset: {},
      className: "",
      textContent: "",
      disabled: false,
      readOnly: false,
      value: "",
      checked: false,
      tabIndex: 0,
      append(...nodes) {
        for (const child of nodes) {
          if (!child) continue;
          child.parentNode = this;
          this.children.push(child);
        }
      },
      prepend(...nodes) {
        const items = [];
        for (const child of nodes) {
          if (!child) continue;
          child.parentNode = this;
          items.push(child);
        }
        this.children = [...items, ...this.children];
      },
      appendChild(nodeChild) {
        if (nodeChild) {
          nodeChild.parentNode = this;
          this.children.push(nodeChild);
        }
        return nodeChild;
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(name, value) {
        this[String(name)] = String(value);
      },
      getAttribute(name) {
        const value = this[String(name)];
        return value === undefined ? null : value;
      },
      addEventListener(type, handler) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      async dispatchEvent(eventInput) {
        const event = typeof eventInput === "string" ? { type: eventInput } : (eventInput || {});
        if (!event.type) event.type = "click";
        if (event.target == null) event.target = this;
        event.currentTarget = this;
        event.defaultPrevented = !!event.defaultPrevented;
        event._stopped = !!event._stopped;
        event._immediateStopped = !!event._immediateStopped;
        event.preventDefault = () => {
          event.defaultPrevented = true;
        };
        event.stopPropagation = () => {
          event._stopped = true;
        };
        event.stopImmediatePropagation = () => {
          event._stopped = true;
          event._immediateStopped = true;
        };

        for (const handler of listeners[event.type] || []) {
          await handler.call(this, event);
          if (event._immediateStopped) break;
        }

        if (!event._stopped && this.parentNode) {
          return await this.parentNode.dispatchEvent(event);
        }
        return event;
      },
      async click() {
        return await this.dispatchEvent({ type: "click" });
      },
      contains(target) {
        if (target === this) return true;
        for (const child of this.children || []) {
          if (child === target) return true;
          if (child && typeof child.contains === "function" && child.contains(target)) return true;
        }
        return false;
      },
      querySelectorAll(selector) {
        const wanted = String(selector || "").trim().toUpperCase();
        const out = [];
        const walk = (nodeToWalk) => {
          if (!nodeToWalk) return;
          if (wanted && wanted !== "*" && nodeToWalk.tagName === wanted) out.push(nodeToWalk);
          for (const child of nodeToWalk.children || []) walk(child);
        };
        walk(this);
        return out;
      },
    };

    Object.defineProperty(node, "innerHTML", {
      configurable: true,
      enumerable: true,
      get() {
        return this._innerHTML || "";
      },
      set(value) {
        this._innerHTML = String(value || "");
        this.children = [];
      },
    });

    return node;
  };

  const doc = {
    activeElement: null,
    createElement(tag) {
      return createNode(tag, doc);
    },
    createElementNS(_ns, tag) {
      return createNode(tag, doc);
    },
    addEventListener() {},
    removeEventListener() {},
  };
  doc.body = createNode("body", doc);
  return doc;
}

function findNodesByTag(root, tagName) {
  const wanted = String(tagName || "").toUpperCase();
  const out = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (node.tagName === wanted) out.push(node);
    for (const child of node.children || []) stack.push(child);
  }
  return out;
}

async function withProjectFirmsViewEnvironment(fn) {
  const previousWindow = global.window;
  const previousDocument = global.document;
  const previousCustomEvent = global.CustomEvent;

  try {
    global.document = createFakeDocument();
    global.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
    return await fn();
  } finally {
    global.window = previousWindow;
    global.document = previousDocument;
    global.CustomEvent = previousCustomEvent;
  }
}

async function runProjectFirmsLayoutTests(run) {
  const { default: ProjectFirmsView } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/ProjectFirmsView.js")
  );

  await run("ProjectFirmsView: laedt project_firms per IPC und wendet gespeicherte UI-Breiten an", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const layoutCalls = [];
      const api = {
        appSettingsGetMany: async () => ({ ok: true, data: {} }),
        tableLayoutsGetOne: async (payload) => {
          layoutCalls.push(payload);
          return {
            ok: true,
            data: {
              source: "stored",
              effectiveLayout: {
                moduleId: "projektverwaltung",
                tableKey: "project_firms",
                variant: "portrait",
                columns: [
                  {
                    key: "shortName",
                    label: "Kurzbez.",
                    uiWidth: "168px",
                    pdfWidth: "24mm",
                    weight: 2,
                    required: true,
                    headerLines: ["Kurzbez."],
                  },
                  {
                    key: "role",
                    label: "Funktion/Gewerk",
                    uiWidth: "1fr",
                    pdfWidth: "auto",
                    weight: 6,
                    required: true,
                    headerLines: ["Funktion/Gewerk"],
                  },
                  {
                    key: "active",
                    label: "Aktiv",
                    uiWidth: "72px",
                    pdfWidth: "15mm",
                    weight: 1,
                    required: true,
                    headerLines: ["Aktiv"],
                  },
                ],
              },
            },
          };
        },
        projectFirmsListByProject: async (projectId) => {
          assert.equal(projectId, "project-1");
          return {
            ok: true,
            list: [
              {
                id: "pf-1",
                short: "AB",
                gewerk: "Rohbau",
                is_active: 1,
              },
            ],
          };
        },
        firmsListGlobal: async () => ({ ok: true, list: [] }),
        projectFirmsListFirmCandidatesByProject: async () => ({ ok: true, list: [] }),
      };

      global.window = {
        localStorage: {
          getItem: () => "old",
        },
        bbmDb: api,
        dispatchEvent() {},
      };

      const view = new ProjectFirmsView({
        router: {
          currentProjectId: "project-1",
        },
      });

      const root = view.render();
      await view.load();

      assert.equal(layoutCalls.length >= 1, true);
      assert.deepEqual(layoutCalls[0], {
        moduleId: "projektverwaltung",
        tableKey: "project_firms",
        orientation: "portrait",
      });
      assert.equal(view.projectFirmsLayoutSource, "stored");

      const tables = findNodesByTag(root, "TABLE");
      assert.equal(tables.length >= 2, true);

      const firmsTable = tables[0];
      const colgroup = firmsTable.children[0];
      assert.equal(colgroup.tagName, "COLGROUP");
      assert.equal(colgroup.children[0].style.width, "168px");
      assert.equal(colgroup.children[1].style.width === "1fr", false);
      assert.equal(colgroup.children[2].style.width, "72px");

      const personsTable = tables[1];
      assert.equal(String(personsTable.children[0]._innerHTML || "").includes("Funktion/Rolle"), true);
      assert.equal(String(personsTable.children[0]._innerHTML || "").includes("E-Mail"), true);
    });
  });

  await run("ProjectFirmsView: fehlender Layout-Payload faellt auf Standardlayout zurueck", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const api = {
        appSettingsGetMany: async () => ({ ok: true, data: {} }),
        tableLayoutsGetOne: async () => ({ ok: false, error: "layout missing" }),
        projectFirmsListByProject: async () => ({ ok: true, list: [] }),
        firmsListGlobal: async () => ({ ok: true, list: [] }),
        projectFirmsListFirmCandidatesByProject: async () => ({ ok: true, list: [] }),
      };

      global.window = {
        localStorage: {
          getItem: () => "old",
        },
        bbmDb: api,
        dispatchEvent() {},
      };

      const view = new ProjectFirmsView({
        router: {
          currentProjectId: "project-1",
        },
      });

      const root = view.render();
      await view.load();

      assert.equal(view.projectFirmsLayoutSource, "default");
      assert.equal(view.firmsTableColEls[0].style.width, "160px");
      assert.equal(view.firmsTableColEls[2].style.width, "70px");
      assert.equal(view.firmsTableColEls[1].style.width === "1fr", false);

      const tables = findNodesByTag(root, "TABLE");
      assert.equal(tables.length >= 2, true);
      const personsTable = tables[1];
      assert.equal(String(personsTable.children[0]._innerHTML || "").includes("Funktion/Rolle"), true);
    });
  });
}

module.exports = { runProjectFirmsLayoutTests };
