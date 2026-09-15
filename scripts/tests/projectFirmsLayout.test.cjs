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
      removeEventListener(type, handler) {
        if (!listeners[type]) return;
        listeners[type] = listeners[type].filter((candidate) => candidate !== handler);
      },
      listenerCount(type) {
        return (listeners[type] || []).length;
      },
      focus() {
        doc.activeElement = this;
      },
      remove() {
        if (!this.parentNode) return;
        this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        this.parentNode = null;
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
        const rawSelector = String(selector || "").trim();
        const wanted = rawSelector.toUpperCase();
        const out = [];
        const walk = (nodeToWalk) => {
          if (!nodeToWalk) return;
          const matchesFirmId = rawSelector === "[data-firm-id]" && nodeToWalk.dataset?.firmId !== undefined;
          if (matchesFirmId || (wanted && wanted !== "*" && nodeToWalk.tagName === wanted)) out.push(nodeToWalk);
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
  const previousAlert = global.alert;

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
    global.alert = previousAlert;
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

  await run("ProjectFirmsView: kanonische Verwendung und Altformate liefern nur freie Projektteilnehmer", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const directoryFirms = [
        { id: "canonical", name: "Kanonisch", uses: { projectParticipant: 1, customer: 0 } },
        { id: "canonical-customer", name: "Nur Kunde", uses: { projectParticipant: 0, customer: 1 }, usages: ["project_participant"] },
        { id: "array", name: "Array-Altformat", usages: ["project_participant"] },
        { id: "legacy-column", name: "Spalten-Altformat", use_project_participant: 1 },
        { id: "legacy-boolean", name: "Boolean-Altformat", project_participant: true },
        { id: "invoice-only", name: "Rechnung Altformat", usages: ["invoice_customer"] },
      ];
      global.window = {
        bbmDb: {
          firmsListGlobal: async () => ({ ok: true, list: directoryFirms }),
          projectFirmsListFirmCandidatesByProject: async () => ({
            ok: true,
            list: [{ id: "array", kind: "global_firm" }],
          }),
        },
      };
      const view = new ProjectFirmsView({ projectId: "project-1" });

      await view._loadData();

      const state = view._resolveAssignDialogState();

      assert.equal(view.allGlobalFirms.length, directoryFirms.length);
      assert.deepEqual(state.available.map((firm) => firm.id), [
        "canonical",
        "legacy-column",
        "legacy-boolean",
      ]);
      assert.equal(state.emptyMessage, "");
    });
  });

  await run("ProjectFirmsView: kanonische Firma wird angeboten, zugeordnet und nach Reload nicht erneut angeboten", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const alerts = [];
      const assignedIds = new Set();
      const assignCalls = [];
      global.window = { bbmDb: {} };
      global.alert = (message) => alerts.push(String(message));
      const view = new ProjectFirmsView({ projectId: "project-1" });
      view.allGlobalFirms = [
        { id: "participant", name: "Sichtbarer Projektteilnehmer", uses: { projectParticipant: 1, customer: 0 } },
        { id: "customer", name: "Unsichtbarer Rechnungskunde", uses: { projectParticipant: 0, customer: 1 } },
      ];
      view.assignedGlobalFirms = [];
      global.window.bbmDb.projectFirmsAssignGlobalFirm = async (payload) => {
        assignCalls.push(payload);
        assignedIds.add(payload.firmId);
        return { ok: true };
      };
      view.reload = async () => {
        view.assignedGlobalFirms = view.allGlobalFirms.filter((firm) => assignedIds.has(firm.id));
      };

      await view._openAssignDialog();

      const visibleTexts = findNodesByTag(global.document.body, "DIV").map((node) => node.textContent);
      assert.equal(visibleTexts.includes("Sichtbarer Projektteilnehmer"), true);
      assert.equal(visibleTexts.includes("Unsichtbarer Rechnungskunde"), false);

      const participantRow = findNodesByTag(global.document.body, "BUTTON")
        .find((node) => node.dataset.firmId === "participant");
      const assignButton = findNodesByTag(global.document.body, "BUTTON")
        .find((node) => node.textContent === "Zuordnen");
      assert.ok(participantRow);
      assert.ok(assignButton);

      await participantRow.click();
      await assignButton.click();

      assert.deepEqual(assignCalls, [{ projectId: "project-1", firmId: "participant" }]);
      assert.deepEqual(view.assignedGlobalFirms.map((firm) => firm.id), ["participant"]);

      await view._openAssignDialog();
      assert.deepEqual(alerts, [
        "Alle als Projektteilnehmer freigegebenen Firmen aus dem Firmenstamm sind diesem Projekt bereits zugeordnet.",
      ]);
    });
  });

  await run("ProjectFirmsView: Zuordnungsdialog nutzt Popupstandard und nur die Firmenliste scrollt", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      global.window = { innerHeight: 360, bbmDb: {} };
      const view = new ProjectFirmsView({ projectId: "project-1" });
      view.allGlobalFirms = Array.from({ length: 4 }, (_value, index) => ({
        id: `firm-${index + 1}`,
        name: index === 2 ? "Gesuchte Fassadenfirma" : `Projektfirma ${index + 1}`,
        uses: { projectParticipant: 1, customer: 0 },
      }));

      await view._openAssignDialog();

      const overlay = global.document.body.children.find((node) => node.dataset.bbmPopupOverlay === "1");
      const modal = overlay?.children[0];
      assert.ok(overlay);
      assert.ok(modal);
      assert.equal(modal.className.includes("bbm-popup-standard"), true);
      assert.equal(modal.className.includes("bbm-popup-dialog"), true);
      assert.equal(modal.style.display, "flex");
      assert.equal(modal.style.maxHeight, "100%");
      assert.equal(modal.style.overflow, "hidden");
      assert.equal(modal.style.gridTemplateRows, undefined);
      assert.equal(modal.children.length, 3);

      const [header, body, footer] = modal.children;
      assert.equal(header.className, "bbm-popup-header");
      assert.equal(body.className, "bbm-popup-body bbm-form-content");
      assert.equal(footer.className, "bbm-popup-footer");
      assert.equal(body.style.overflow, "hidden");
      assert.equal(body.children.length, 4);

      const [, search, status, listWrap] = body.children;
      assert.equal(listWrap.style.overflow, "auto");
      assert.equal(listWrap.style.minHeight, "0");
      assert.equal(listWrap.style.maxHeight, "420px");
      assert.equal(listWrap.querySelectorAll("[data-firm-id]").length, 4);

      search.value = "Fassade";
      await search.dispatchEvent({ type: "input" });
      assert.equal(status.textContent, "1 von 4 Firmen");
      assert.deepEqual(
        listWrap.querySelectorAll("[data-firm-id]").map((node) => node.dataset.firmId),
        ["firm-3"]
      );

      const closeButton = findNodesByTag(header, "BUTTON")
        .find((node) => node.getAttribute("aria-label") === "Dialog schließen");
      await closeButton.click();

      view.allGlobalFirms = Array.from({ length: 40 }, (_value, index) => ({
        id: `long-${index + 1}`,
        name: `Lange Firmenliste ${String(index + 1).padStart(2, "0")}`,
        uses: { projectParticipant: 1, customer: 0 },
      }));
      await view._openAssignDialog();

      const longOverlay = global.document.body.children.find((node) => node.dataset.bbmPopupOverlay === "1");
      const longModal = longOverlay.children[0];
      const longBody = longModal.children[1];
      const longListWrap = longBody.children[3];
      assert.equal(longModal.style.maxHeight, "100%");
      assert.equal(longBody.style.overflow, "hidden");
      assert.equal(longListWrap.style.overflow, "auto");
      assert.equal(longListWrap.querySelectorAll("[data-firm-id]").length, 40);
      assert.equal(longModal.children[0].className, "bbm-popup-header");
      assert.equal(longModal.children[2].className, "bbm-popup-footer");

      const longCloseButton = findNodesByTag(longModal.children[0], "BUTTON")
        .find((node) => node.getAttribute("aria-label") === "Dialog schließen");
      await longCloseButton.click();
    });
  });

  await run("ProjectFirmsView: X, Abbrechen und Escape schließen, räumen Handler auf und geben Fokus zurück", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const windowListeners = new Map();
      const assignCalls = [];
      global.window = {
        innerHeight: 360,
        bbmDb: {
          projectFirmsAssignGlobalFirm: async (payload) => {
            assignCalls.push(payload);
            return { ok: true };
          },
        },
        addEventListener(type, handler) {
          if (!windowListeners.has(type)) windowListeners.set(type, []);
          windowListeners.get(type).push(handler);
        },
        removeEventListener(type, handler) {
          windowListeners.set(type, (windowListeners.get(type) || []).filter((candidate) => candidate !== handler));
        },
      };
      const trigger = global.document.createElement("button");
      global.document.body.append(trigger);
      const view = new ProjectFirmsView({ projectId: "project-1" });
      view.allGlobalFirms = [
        { id: "participant", name: "Projektteilnehmer", uses: { projectParticipant: 1, customer: 0 } },
      ];

      const assertClosed = (overlay) => {
        assert.equal(global.document.body.children.includes(overlay), false);
        assert.equal(global.document.activeElement, trigger);
        assert.equal(overlay.listenerCount("focus"), 0);
        assert.equal(overlay.listenerCount("mousedown"), 0);
        assert.equal(overlay.listenerCount("keydown"), 0);
        assert.equal((windowListeners.get("resize") || []).length, 0);
      };

      trigger.focus();
      await view._openAssignDialog();
      let overlay = global.document.body.children.find((node) => node.dataset.bbmPopupOverlay === "1");
      const closeButton = findNodesByTag(overlay, "BUTTON")
        .find((node) => node.getAttribute("aria-label") === "Dialog schließen");
      await closeButton.click();
      assertClosed(overlay);

      trigger.focus();
      await view._openAssignDialog();
      overlay = global.document.body.children.find((node) => node.dataset.bbmPopupOverlay === "1");
      const cancelButton = findNodesByTag(overlay, "BUTTON")
        .find((node) => node.textContent === "Abbrechen");
      await cancelButton.click();
      assertClosed(overlay);

      trigger.focus();
      await view._openAssignDialog();
      overlay = global.document.body.children.find((node) => node.dataset.bbmPopupOverlay === "1");
      const search = findNodesByTag(overlay, "INPUT")[0];
      search.focus();
      await search.dispatchEvent({ type: "keydown", key: "Escape" });
      assertClosed(overlay);
      assert.deepEqual(assignCalls, []);
    });
  });

  await run("ProjectFirmsView: drei fachliche Leerzustände bleiben unterscheidbar", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const messages = [];
      global.window = { bbmDb: {} };
      global.alert = (message) => messages.push(String(message));
      const view = new ProjectFirmsView({ projectId: "project-1" });

      view.allGlobalFirms = [];
      view.assignedGlobalFirms = [];
      await view._openAssignDialog();

      view.allGlobalFirms = [
        { id: "customer", uses: { projectParticipant: 0, customer: 1 } },
      ];
      await view._openAssignDialog();

      view.allGlobalFirms = [
        { id: "participant", uses: { projectParticipant: 1, customer: 0 } },
      ];
      view.assignedGlobalFirms = [{ id: "participant" }];
      await view._openAssignDialog();

      assert.deepEqual(messages, [
        "Im Firmenstamm sind keine Firmen vorhanden.",
        "Im Firmenstamm sind Firmen vorhanden, aber keine ist als Projektteilnehmer freigegeben.",
        "Alle als Projektteilnehmer freigegebenen Firmen aus dem Firmenstamm sind diesem Projekt bereits zugeordnet.",
      ]);
    });
  });

  await run("ProjectFirmsView: Firmenstamm-Ladefehler bleibt eine Fehlermeldung", async () => {
    await withProjectFirmsViewEnvironment(async () => {
      const messages = [];
      global.alert = (message) => messages.push(String(message));
      global.window = {
        localStorage: { getItem: () => "old" },
        bbmDb: {
          appSettingsGetMany: async () => ({ ok: true, data: {} }),
          tableLayoutsGetOne: async () => ({ ok: false, error: "layout missing" }),
          projectFirmsListByProject: async () => ({ ok: true, list: [] }),
          firmsListGlobal: async () => ({ ok: false, error: "Gezielter Firmenstamm-Ladefehler" }),
          projectFirmsListFirmCandidatesByProject: async () => ({ ok: true, list: [] }),
        },
        dispatchEvent() {},
      };
      const view = new ProjectFirmsView({ projectId: "project-1" });
      view.render();

      await view.load();

      assert.deepEqual(messages, ["Gezielter Firmenstamm-Ladefehler"]);
    });
  });
}

module.exports = { runProjectFirmsLayoutTests };
