const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsScreenIntegrationTests(run) {
  const [{ createTopsStore }, { TopsCommands }, vm, workbenchVmMod, topsListMod] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/state/TopsStore.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/domain/TopsCommands.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/viewmodel/TopsWorkbenchViewModel.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/TopsList.js")),
  ]);
  const TopsScreen = (await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/screens/TopsScreen.js")
  )).default;
  const { SharedEditboxCore } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/SharedEditboxCore.js")
  );
  const { TopsMetaPanel } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/tops/components/TopsMetaPanel.js")
  );
  const { TopsResponsibleBridge } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/tops/components/TopsResponsibleBridge.js")
  );
  const { TopsAssigneeDataSource } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/tops/data/TopsAssigneeDataSource.js")
  );
  const { TopsWorkbench } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/tops/components/TopsWorkbench.js")
  );
  const ProjectContextQuicklane = (await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/ui/ProjectContextQuicklane.js")
  )).default;
  const { DictationController } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/features/audio-dictation/DictationController.js")
  );
  const { attachAudioFeature } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/features/audio/AudioFeature.js")
  );
  const { EditboxShell } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/core/editbox/EditboxShell.js")
  );
  const focusHelper = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/topCreateFocus.js")
  );
  const { TopGapFlow } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/features/tops/TopGapFlow.js")
  );
  const {
    buildWorkbenchState,
    shouldShowWorkbench,
    buildListItemsFromState,
    resolveVisibleSelectionForCollapsedFamilies,
    editorFromTop,
    buildPatchFromDraft,
  } = vm;
  const { buildWorkbenchVm } = workbenchVmMod;
  const { TopsList } = topsListMod;

  function createFakeDocument() {
    const createNode = (tag, doc) => {
      const node = {
        tagName: String(tag || "").toUpperCase(),
        ownerDocument: doc,
        children: [],
        style: {},
        dataset: {},
        className: "",
        textContent: "",
        disabled: false,
        readOnly: false,
        value: "",
        rows: 0,
        maxLength: 0,
        append(...nodes) {
          this.children.push(...nodes);
        },
        appendChild(nodeChild) {
          this.children.push(nodeChild);
          return nodeChild;
        },
        replaceChildren(...nodes) {
          this.children = [...nodes];
        },
        setAttribute(name, value) {
          this[String(name)] = String(value);
        },
        addEventListener(type, handler) {
          if (!this._listeners) this._listeners = {};
          if (!this._listeners[type]) this._listeners[type] = [];
          this._listeners[type].push(handler);
        },
        dispatchEvent(event) {
          const evt = event || {};
          const type = String(evt.type || "");
          for (const handler of this._listeners?.[type] || []) {
            handler.call(this, evt);
          }
          return true;
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
          const result = [];
          const wantFilterButtons = String(selector || "").includes("data-filter-mode");
          const walk = (nodeToWalk) => {
            if (!nodeToWalk) return;
            if (wantFilterButtons && nodeToWalk.dataset?.filterMode) {
              result.push(nodeToWalk);
            }
            for (const child of nodeToWalk.children || []) walk(child);
          };
          walk(this);
          return result;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: 40, height: 40 };
        },
        classList: {
          add() {},
          toggle() {},
        },
      };
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
      body: null,
      head: null,
      querySelector() {
        return null;
      },
      addEventListener() {},
      removeEventListener() {},
    };
    doc.body = createNode("body", doc);
    doc.head = createNode("head", doc);
    return doc;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function firstNumberGapFromItems(items = []) {
    const rows = Array.isArray(items) ? items : [];
    const groups = new Map();

    for (const row of rows) {
      const id = row?.id;
      const level = Math.floor(Number(row?.level));
      const number = Math.floor(Number(row?.number));
      if (!id || !Number.isFinite(level) || level < 1 || level > 4) continue;
      if (!Number.isFinite(number) || number < 1) continue;

      const parentTopId = row?.parent_top_id ?? null;
      const key = `${level}::${parentTopId ?? "root"}`;
      if (!groups.has(key)) groups.set(key, { level, parentTopId, items: [] });
      groups.get(key).items.push({ id, number });
    }

    const gaps = [];
    for (const group of groups.values()) {
      if (!group.items.length) continue;
      const numbers = new Set();
      let maxNumber = 0;
      for (const item of group.items) {
        numbers.add(item.number);
        if (item.number > maxNumber) maxNumber = item.number;
      }
      if (maxNumber < 1) continue;

      let missingNumber = null;
      for (let i = 1; i <= maxNumber; i += 1) {
        if (!numbers.has(i)) {
          missingNumber = i;
          break;
        }
      }
      if (missingNumber === null) continue;

      let lastTopId = null;
      for (const item of group.items) {
        if (item.number !== maxNumber) continue;
        if (lastTopId === null || String(item.id) > String(lastTopId)) lastTopId = item.id;
      }
      if (!lastTopId) continue;

      gaps.push({
        level: group.level,
        parentTopId: group.parentTopId,
        missingNumber,
        lastTopId,
      });
    }

    gaps.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      const ap = a.parentTopId ?? "";
      const bp = b.parentTopId ?? "";
      if (ap !== bp) return String(ap) < String(bp) ? -1 : 1;
      return a.missingNumber - b.missingNumber;
    });

    return gaps[0] || null;
  }

  await run("Tops v2 Integration: Auswahl -> Workbench-State + ReadOnly-Sichtbarkeit", async () => {
    const list = [
      { id: 11, level: 2, title: "A", is_carried_over: 0, parent_top_id: null },
      { id: 22, level: 3, title: "B", is_carried_over: 0, parent_top_id: null },
    ];
    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 7, is_closed: 0 }, list };
      },
    };

    const store = createTopsStore({ meetingId: null, tops: [] });
    const commands = new TopsCommands({ store, repository });

    await commands.loadTops({ meetingId: 7, projectId: 3 });

    const wbNoSelection = buildWorkbenchState(store.getState());
    const workbenchVmNoSelection = buildWorkbenchVm(store.getState(), null);
    assert.equal(wbNoSelection.hasSelection, false);
    assert.equal(wbNoSelection.canSave, false);
    assert.equal(workbenchVmNoSelection.actions.canCreateLevel1, true);
    assert.equal(workbenchVmNoSelection.actions.canCreateChild, false);
    assert.equal(shouldShowWorkbench(store.getState()), true);

    commands.selectTop(11);
    const selected = store.getState().tops.find((t) => t.id === 11);
    commands.updateDraft(editorFromTop(selected));

    const wbWithSelection = buildWorkbenchState(store.getState());
    const workbenchVm = buildWorkbenchVm(store.getState(), selected);
    assert.equal(wbWithSelection.hasSelection, true);
    assert.equal(wbWithSelection.canSave, true);
    assert.equal(wbWithSelection.canMove, true);
    assert.equal(wbWithSelection.canDelete, true);
    assert.equal(workbenchVm.editor.access.shortTextReadOnly, false);
    assert.equal(workbenchVm.editor.access.longTextReadOnly, false);
    assert.equal(shouldShowWorkbench(store.getState()), true);

    store.setState({ isReadOnly: true });
    const wbReadOnly = buildWorkbenchState(store.getState());
    assert.equal(wbReadOnly.hasSelection, true);
    assert.equal(wbReadOnly.canSave, true);
    assert.equal(wbReadOnly.canMove, false);
    assert.equal(wbReadOnly.canDelete, false);
    assert.equal(shouldShowWorkbench(store.getState()), true);
  });

  await run("Tops v2 Integration: Move-Mode markiert Targets datengetrieben", () => {
    const state = {
      meetingId: 7,
      isMoveMode: true,
      selectedTopId: 101,
      tops: [
        { id: 100, level: 2, title: "Valid", displayNumber: 2, parent_top_id: null },
        { id: 101, level: 3, title: "Self", displayNumber: 3, parent_top_id: null },
        { id: 102, level: 4, title: "Invalid", displayNumber: 4, parent_top_id: 101 },
      ],
    };

    const rows = buildListItemsFromState(state);
    const byId = new Map(rows.map((r) => [String(r.id), r]));

    assert.equal(byId.get("100").isMoveTarget, true);
    assert.equal(byId.get("101").isMoveTarget, false);
    assert.equal(byId.get("102").isMoveTarget, false);
    assert.equal(byId.get("100").moveState, "target");
    assert.equal(byId.get("101").moveState, "current");
    assert.equal(byId.get("102").moveState, "blocked");
  });

  await run("Tops v2 Integration: Listeneintrag uebernimmt und rendert TOP-Anlagedatum", () => {
    const rows = buildListItemsFromState({
      tops: [
        {
          id: 301,
          level: 2,
          title: "Datum",
          longtext: "",
          displayNumber: 7,
          created_at: "2026-04-27T10:11:12.000Z",
        },
      ],
    });

    assert.equal(rows[0].isTitle, false);
    assert.equal(rows[0].createdAt, "27.04.2026");
    assert.equal(rows[0].meta[0], undefined);

    const level1Rows = buildListItemsFromState({
      tops: [
        {
          id: 302,
          level: 1,
          title: "Titel",
          longtext: "",
          displayNumber: 1,
          due_date: "2026-04-27",
          status: "blockiert",
          responsible_label: "WTB",
        },
      ],
    });

    assert.equal(level1Rows[0].isTitle, true);
    assert.equal(level1Rows[0].meta.length, 0);
    assert.equal(level1Rows[0].ampelColor, null);
    assert.equal(level1Rows[0].metaSymbolType, null);

    const datedRows = buildListItemsFromState({
      tops: [
        {
          id: 305,
          level: 2,
          title: "Faelligkeit",
          longtext: "",
          displayNumber: 8,
          due_date: "2026-04-27",
        },
      ],
    });

    assert.equal(datedRows[0].meta[0], "27.04.2026");

    const ampelRows = buildListItemsFromState({
      tops: [
        {
          id: 306,
          level: 2,
          title: "Ampel",
          longtext: "",
          displayNumber: 9,
          due_date: "2026-04-27",
          status: "blockiert",
        },
      ],
    });

    assert.equal(ampelRows[0].meta[0], "27.04.2026");
    assert.equal(ampelRows[0].meta[1], "blockiert");
    assert.equal(ampelRows[0].ampelColor, "blue");

    const todoRows = buildListItemsFromState({
      tops: [
        {
          id: 307,
          level: 2,
          title: "ToDo",
          longtext: "",
          status: "offen",
          is_task: 1,
        },
      ],
    });
    const decisionRows = buildListItemsFromState({
      tops: [
        {
          id: 308,
          level: 2,
          title: "Beschluss",
          longtext: "",
          status: "blockiert",
          is_decision: 1,
        },
      ],
    });
    const importantRows = buildListItemsFromState({
      tops: [
        {
          id: 309,
          level: 2,
          title: "Wichtig",
          longtext: "",
          status: "offen",
          is_important: 1,
        },
      ],
    });

    assert.equal(todoRows[0].metaSymbolType, "task");
    assert.equal(decisionRows[0].metaSymbolType, "decision");
    assert.equal(importantRows[0].isImportant, true);

    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    const prevWindow = globalThis.window;
    globalThis.window = { document: globalThis.document };
    try {
      const list = new TopsList();
      list.setItems(rows);

      const row = list.root.children[0];
      const grid = row.children[0];
      const numberCell = grid.children[0];
      assert.equal(numberCell.children.length, 2);
      assert.equal(numberCell.children[0].children[0].textContent, "7.");
      assert.equal(numberCell.children[1].textContent, "27.04.2026");
      assert.equal(numberCell.children[1].className, "bbm-tops-list-row-number-date");

      list.setItems(datedRows);
      const datedRow = list.root.children[list.root.children.length - 1];
      const datedGrid = datedRow.children[0];
      const metaCell = datedGrid.children[2];
      assert.equal(metaCell.children[0].children[0].textContent, "27.04.2026");

      list.setItems(ampelRows);
      const ampelRow = list.root.children[list.root.children.length - 1];
      const ampelGrid = ampelRow.children[0];
      const ampelMetaCell = ampelGrid.children[2];
      const statusLine = ampelMetaCell.children[1];
      assert.equal(statusLine.children.length, 2);
      assert.equal(statusLine.children[0].className, "bbm-tops-list-row-meta-text");
      assert.equal(statusLine.children[0].textContent, "blockiert");
      assert.equal(statusLine.children[1].className, "bbm-tops-list-row-meta-ampel-slot");
      assert.equal(statusLine.children[1].children[0].className, "bbm-tops-list-row-ampel");
      assert.equal(statusLine.children[1].children[0].dataset.color, "blue");

      list.setItems(todoRows);
      const todoRow = list.root.children[list.root.children.length - 1];
      const todoGrid = todoRow.children[0];
      const todoStatusLine = todoGrid.children[2].children[0];
      assert.equal(todoStatusLine.children[0].textContent, "offen");
      assert.equal(todoStatusLine.children[1].children[0].src.includes("todo.png"), true);

      list.setItems(decisionRows);
      const decisionRow = list.root.children[list.root.children.length - 1];
      const decisionGrid = decisionRow.children[0];
      const decisionStatusLine = decisionGrid.children[2].children[0];
      assert.equal(decisionStatusLine.children[0].textContent, "blockiert");
      assert.equal(
        decisionStatusLine.children[1].children[0].src.includes("assets/icons/redFlag.png"),
        true
      );

      list.setItems(importantRows);
      const importantRow = list.root.children[list.root.children.length - 1];
      const importantGrid = importantRow.children[0];
      const importantTitle = importantGrid.children[1].children[0];
      assert.equal(importantRow.dataset.isImportant, "true");
      assert.equal(importantTitle.dataset.important, "true");

      const editbox = new SharedEditboxCore({});
      editbox.applyEditorState(
        {
          value: {
            title: "Wichtig",
            longtext: "",
            is_important: 1,
            is_hidden: 0,
            is_task: 0,
            is_decision: 0,
          },
          access: {},
        },
        { hasSelection: true, isReadOnly: false }
      );
      assert.equal(editbox.root.dataset.important, "true");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Projektfirmenquelle bleibt aktiv, eindeutig und ohne Auto-Default", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { document: doc };

    try {
      const dataSource = new TopsAssigneeDataSource({
        api: {
          async projectFirmsListFirmCandidatesByProject() {
            return {
              ok: true,
              list: [
                { kind: "project_firm", id: "p1", short: "WTB", name: "WTB", is_active: 1 },
                { kind: "global_firm", id: "g1", short: "WTB", name: "WTB", is_active: 1 },
                { kind: "project_firm", id: "p2", short: "chatgpt", name: "chatgpt", is_active: 1 },
                { kind: "project_firm", id: "p3", short: "Steffen", name: "Steffen", is_active: 0 },
              ],
            };
          },
          async projectParticipantsPool() {
            return { ok: true, items: [] };
          },
        },
      });

      const companies = await dataSource.loadCompaniesByProject("project-1");
      assert.equal(companies.length, 2);
      assert.equal(companies.some((item) => String(item.short || item.name1 || "").includes("Steffen")), false);

      const metaPanel = new TopsMetaPanel();
      const bridge = new TopsResponsibleBridge({
        metaPanel,
        loadCompanies: async () => companies,
      });
      bridge.mount();
      await bridge.initialize();

      assert.equal(bridge.field.getValue(), "");
      assert.equal(Array.isArray(companies), true);

      bridge.applyDraftValue("WTB");
      assert.equal(bridge.field.getValue(), "company:p1");
      assert.equal(metaPanel.getValue().responsible_label, "WTB");

      bridge.applyDraftValue("");
      assert.equal(bridge.field.getValue(), "");
      assert.equal(metaPanel.getValue().responsible_label, "");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Ohne TOP-Anlagedatum bleibt die Nummernspalte einzeilig", () => {
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const list = new TopsList();
      list.setItems([
        {
          id: 302,
          level: 2,
          title: "Ohne Datum",
          longtext: "",
          number: "8.",
          createdAt: "",
        },
      ]);

      const row = list.root.children[0];
      const grid = row.children[0];
      const numberCell = grid.children[0];
      assert.equal(numberCell.children.length, 1);
      assert.equal(numberCell.children[0].children[0].textContent, "8.");
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Tops v2 Integration: Titel mit created_at zeigt keine Datumslinie", () => {
    const rows = buildListItemsFromState({
      tops: [
        {
          id: 303,
          level: 1,
          title: "Titel",
          longtext: "",
          displayNumber: 1,
          created_at: "2026-04-27T10:11:12.000Z",
        },
      ],
    });

    assert.equal(rows[0].isTitle, true);
    assert.equal(rows[0].createdAt, "");
    assert.equal(rows[0].meta.length, 0);
    assert.equal(rows[0].ampelColor, null);

    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const list = new TopsList();
      list.setItems(rows);

      const row = list.root.children[0];
      const grid = row.children[0];
      const numberCell = grid.children[0];
      assert.equal(numberCell.children.length, 1);
      assert.equal(numberCell.children[0].children[0].textContent, "1.");
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Tops v2 Integration: Level-1-Titel blendet seine Familienkinder ein und aus", () => {
    const tops = [
      { id: 1, level: 1, title: "Titel A", displayNumber: 1 },
      { id: 11, level: 2, title: "A1", displayNumber: 11 },
      { id: 12, level: 3, title: "A2", displayNumber: 12 },
      { id: 2, level: 1, title: "Titel B", displayNumber: 2 },
      { id: 21, level: 2, title: "B1", displayNumber: 21 },
    ];

    const collapsedRows = buildListItemsFromState({
      collapsedLevel1Ids: [1],
      tops,
    });
    assert.deepEqual(
      collapsedRows.map((row) => row.id),
      [1, 2, 21]
    );
    assert.equal(collapsedRows[0].isLevel1Collapsed, true);
    assert.equal(collapsedRows[0].level1TopId, "1");
    assert.equal(collapsedRows[1].level1TopId, "2");

    const expandedRows = buildListItemsFromState({
      collapsedLevel1Ids: [],
      tops,
    });
    assert.deepEqual(
      expandedRows.map((row) => row.id),
      [1, 11, 12, 2, 21]
    );
  });

  await run("Tops v2 Integration: Ein eingeklappter Kind-TOP faellt auf den Level-1-Titel zurueck", () => {
    const fallbackId = resolveVisibleSelectionForCollapsedFamilies({
      selectedTopId: 11,
      collapsedLevel1Ids: [1],
      tops: [
        { id: 1, level: 1, title: "Titel A" },
        { id: 11, level: 2, title: "A1" },
        { id: 12, level: 3, title: "A2" },
      ],
    });

    assert.equal(fallbackId, "1");
    assert.equal(
      resolveVisibleSelectionForCollapsedFamilies({
        selectedTopId: 1,
        collapsedLevel1Ids: [1],
        tops: [
          { id: 1, level: 1, title: "Titel A" },
          { id: 11, level: 2, title: "A1" },
        ],
      }),
      null
    );
  });

  await run("Tops v2 Integration: Level-1-Titel zeigt den Ein-/Ausklapp-Button", () => {
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const list = new TopsList({
        onLevel1Toggle() {},
      });
      list.setItems([
        {
          id: 1,
          level: 1,
          title: "Titel A",
          displayNumber: 1,
          isTitle: true,
          isLevel1Collapsed: false,
          canToggleLevel1: true,
        },
      ]);

      const row = list.root.children[0];
      const grid = row.children[0];
      const numberCell = grid.children[0];
      const numberLine = numberCell.children[0];
      assert.equal(numberLine.children[0].tagName, "BUTTON");
      assert.equal(numberLine.children[0].textContent, "▾");
      assert.equal(numberLine.children[0].dataset.collapsed, "false");
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Tops v2 Integration: Filter Alle zeigt alle TOPs", () => {
    const rows = buildListItemsFromState({
      topFilter: "all",
      tops: [
        { id: 401, level: 2, title: "A", is_task: 1 },
        { id: 402, level: 2, title: "B", is_decision: 1 },
      ],
    });

    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((row) => row.id),
      [401, 402]
    );
  });

  await run("Tops v2 Integration: Filter ToDo zeigt nur ToDo-TOPs", () => {
    const rows = buildListItemsFromState({
      topFilter: "todo",
      tops: [
        { id: 411, level: 2, title: "ToDo", is_task: 1 },
        { id: 412, level: 2, title: "Beschluss", is_decision: 1 },
      ],
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 411);
  });

  await run("Tops v2 Integration: Filter Beschluss zeigt nur Beschluss-TOPs", () => {
    const rows = buildListItemsFromState({
      topFilter: "decision",
      tops: [
        { id: 421, level: 2, title: "ToDo", is_task: 1 },
        { id: 422, level: 2, title: "Beschluss", is_decision: 1 },
      ],
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 422);
  });

  await run("Tops v2 Integration: Langtext-Ausblendung nimmt die Preview aus der Liste", () => {
    const rows = buildListItemsFromState({
      showLongtextInList: false,
      tops: [
        { id: 431, level: 2, title: "Preview", longtext: "Langtext sichtbar", is_task: 0 },
      ],
    });

    assert.equal(rows[0].showLongtextInList, false);
    assert.equal(rows[0].preview, "");

    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const list = new TopsList();
      list.setItems(rows);
      const row = list.root.children[0];
      const grid = row.children[0];
      const textCell = grid.children[1];
      assert.equal(textCell.children.length, 1);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Tops v2 Integration: Ampel-Ausblendung nimmt die Ampel aus der Liste", () => {
    const rows = buildListItemsFromState({
      showAmpelInList: false,
      tops: [
        { id: 432, level: 2, title: "Ampel", status: "offen", due_date: null },
      ],
    });

    assert.equal(rows[0].showAmpelInList, false);
    assert.equal(rows[0].ampelColor, null);

    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const list = new TopsList();
      list.setItems(rows);
      const row = list.root.children[0];
      const grid = row.children[0];
      const metaCell = grid.children[2];
      const hasAmpelDot = (node) => {
        if (!node) return false;
        if (String(node.className || "") === "bbm-tops-list-row-ampel") return true;
        return Array.isArray(node.children) && node.children.some((child) => hasAmpelDot(child));
      };
      assert.equal(hasAmpelDot(metaCell), false);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Tops v2 Integration: Quicklane-Filter ruft den durchgereichten Callback auf", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      addEventListener() {},
      removeEventListener() {},
      innerWidth: 1280,
      innerHeight: 720,
    };
    try {
      const lane = new ProjectContextQuicklane({
        router: {
          context: {
            ui: {
              isTopsView: true,
              onTopFilterChange: async (mode) => {
                calls.push(mode);
              },
            },
          },
          activeView: {
            setTopFilter: async (mode) => {
              calls.push(`fallback:${mode}`);
            },
          },
        },
      });
      lane.setEnabled(true);
      lane.setContext({ projectId: 17, meetingId: 21 });

      await lane.filterSectionEl.onclick?.();
      assert.equal(lane.filterPopupEl.style.display, "flex");
      assert.ok(Number.parseInt(lane.filterPopupEl.style.left, 10) >= 12);
      await lane.filterPopupEl.children[1].onclick?.({
        preventDefault() {},
        stopPropagation() {},
      });

      assert.deepEqual(calls, ["todo"]);
      assert.equal(lane.filterBadgeEl.textContent, "T");
      assert.equal(lane.filterPopupEl.children[1].dataset.active, "true");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Ampel- und Langtext-Quicklane rufen die TopsScreen-Toggles auf", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      addEventListener() {},
      removeEventListener() {},
      innerWidth: 1280,
      innerHeight: 720,
    };
    try {
      const lane = new ProjectContextQuicklane({
        router: {
          context: {
            ui: {
              isTopsView: true,
              showAmpelInList: true,
              showLongtextInList: false,
            },
          },
          activeView: {
            showAmpelInList: true,
            showLongtextInList: false,
            toggleAmpelDisplay: async () => calls.push("ampel"),
            toggleLongtextDisplay: async () => calls.push("longtext"),
          },
        },
      });
      lane.setEnabled(true);
      lane.setContext({ projectId: 17, meetingId: 21 });

      await lane.ampelSectionEl.onclick?.();
      await lane.longtextSectionEl.onclick?.();

      assert.deepEqual(calls, ["ampel", "longtext"]);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Diktat-Buttons bleiben ohne Freischaltung verborgen", () => {
    const doc = createFakeDocument();
    const view = {
      btnTitleDictate: doc.createElement("button"),
      btnLongDictate: doc.createElement("button"),
      _audioLicensed: false,
      _audioDevOverride: false,
      isReadOnly: false,
      _busy: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      _audioLicenseMessage: "Audio-Funktion ist fuer diese Lizenz nicht freigeschaltet.",
    };
    const controller = new DictationController({ view, ensureAudioAvailable: async () => true });

    controller.updateButtons({ meetingId: "21" });

    assert.equal(view.btnTitleDictate.style.display, "none");
    assert.equal(view.btnLongDictate.style.display, "none");
  });

  await run("Tops v2 Integration: Diktat-Buttons sitzen direkt in der Editbox-Zeile", () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { document: doc };

    try {
      const core = new SharedEditboxCore({
        onStartDictation() {},
      });

      const shortLabel = core.editbox.shortLabel;
      const longLabel = core.editbox.longLabel;

      assert.equal(shortLabel.contains(core.shortDictateButton), true);
      assert.equal(shortLabel.contains(core.editbox.shortCounter), true);
      assert.equal(longLabel.contains(core.longDictateButton), true);
      assert.ok(shortLabel.children.indexOf(core.shortDictateButton) > shortLabel.children.indexOf(core.editbox.shortCounter));
      assert.ok(longLabel.children.indexOf(core.longDictateButton) > longLabel.children.indexOf(core.editbox.longCounter));
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Diktat schreibt in Kurz- und Langtextfeld", async () => {
    const doc = createFakeDocument();
    const shortInput = doc.createElement("input");
    const longInput = doc.createElement("textarea");
    const view = {
      inpTitle: shortInput,
      taLongtext: longInput,
      _audioLicensed: true,
      _audioDevOverride: false,
      isReadOnly: false,
      _busy: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      _audioLicenseMessage: "",
      _updateCharCountersCalled: 0,
      _updateCharCounters() {
        this._updateCharCountersCalled += 1;
      },
    };
    const controller = new DictationController({ view, ensureAudioAvailable: async () => true });

    await controller._applyDictationTextToField("Hallo Welt", "shortText");
    assert.equal(shortInput.value, "Hallo Welt");
    assert.equal(view._updateCharCountersCalled > 0, true);

    longInput.value = "Alt";
    await controller._applyDictationTextToField("Neuer Satz", "longText");
    assert.equal(String(longInput.value || "").includes("Neuer Satz"), true);
    assert.equal(view._updateCharCountersCalled > 1, true);
  });

  await run("AudioFeature: Diktat-Testfreigabe aktiviert die Diktat-Buttons ohne Lizenzfeature", async () => {
    const doc = createFakeDocument();
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const view = {
      btnTitleDictate: doc.createElement("button"),
      btnLongDictate: doc.createElement("button"),
      _busy: false,
      isReadOnly: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      audioSuggestionsFlow: { applyReadOnlyState() {} },
    };
    globalThis.document = doc;
    globalThis.window = {
      bbmDb: {
        appSettingsGetMany: async () => ({
          ok: true,
          data: { "dev.audioDictationUnlock": "1" },
        }),
        licenseGetStatus: async () => ({ ok: true, valid: true, features: [] }),
      },
    };

    try {
      attachAudioFeature(view);
      view.dictationController = new DictationController({
        view,
        ensureAudioAvailable: async () => true,
      });

      const licensed = await view._loadAudioLicenseState(true);
      assert.equal(licensed, true);
      assert.equal(view._audioLicensed, true);
      assert.equal(view._audioDevOverride, true);
      assert.equal(view.btnTitleDictate.style.display, "inline-flex");
      assert.equal(view.btnLongDictate.style.display, "inline-flex");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("AudioFeature: Lizenzfeature audio aktiviert die Diktat-Buttons", async () => {
    const doc = createFakeDocument();
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const view = {
      btnTitleDictate: doc.createElement("button"),
      btnLongDictate: doc.createElement("button"),
      _busy: false,
      isReadOnly: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      audioSuggestionsFlow: { applyReadOnlyState() {} },
    };
    globalThis.document = doc;
    globalThis.window = {
      bbmDb: {
        appSettingsGetMany: async () => ({
          ok: true,
          data: { "dev.audioDictationUnlock": "0" },
        }),
        licenseGetStatus: async () => ({ ok: true, valid: true, features: ["audio"] }),
      },
    };

    try {
      attachAudioFeature(view);
      view.dictationController = new DictationController({
        view,
        ensureAudioAvailable: async () => true,
      });

      const licensed = await view._loadAudioLicenseState(true);
      assert.equal(licensed, true);
      assert.equal(view._audioLicensed, true);
      assert.equal(view._audioDevOverride, false);
      assert.equal(view.btnTitleDictate.style.display, "inline-flex");
      assert.equal(view.btnLongDictate.style.display, "inline-flex");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("AudioFeature: Lizenzfeature diktat aktiviert die Diktat-Buttons", async () => {
    const doc = createFakeDocument();
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const view = {
      btnTitleDictate: doc.createElement("button"),
      btnLongDictate: doc.createElement("button"),
      _busy: false,
      isReadOnly: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      audioSuggestionsFlow: { applyReadOnlyState() {} },
    };
    globalThis.document = doc;
    globalThis.window = {
      bbmDb: {
        appSettingsGetMany: async () => ({
          ok: true,
          data: { "dev.audioDictationUnlock": "0" },
        }),
        licenseGetStatus: async () => ({ ok: true, valid: true, features: ["diktat"] }),
      },
    };

    try {
      attachAudioFeature(view);
      view.dictationController = new DictationController({
        view,
        ensureAudioAvailable: async () => true,
      });

      const licensed = await view._loadAudioLicenseState(true);
      assert.equal(licensed, true);
      assert.equal(view._audioLicensed, true);
      assert.equal(view._audioDevOverride, false);
      assert.equal(view.btnTitleDictate.style.display, "inline-flex");
      assert.equal(view.btnLongDictate.style.display, "inline-flex");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Diktat-Buttons erscheinen mit Lizenz oder Dev-Freigabe", () => {
    const doc = createFakeDocument();
    const view = {
      btnTitleDictate: doc.createElement("button"),
      btnLongDictate: doc.createElement("button"),
      _audioLicensed: false,
      _audioDevOverride: true,
      isReadOnly: false,
      _busy: false,
      meetingId: "21",
      selectedTop: { id: 1 },
      _audioLicenseMessage: "",
    };
    const controller = new DictationController({ view, ensureAudioAvailable: async () => true });

    controller.updateButtons({ meetingId: "21" });

    assert.equal(view.btnTitleDictate.style.display, "inline-flex");
    assert.equal(view.btnLongDictate.style.display, "inline-flex");
    assert.equal(view.btnTitleDictate.children.length, 1);
    assert.equal(view.btnTitleDictate.children[0].tagName, "IMG");
    assert.equal(String(view.btnTitleDictate.children[0].src || "").endsWith("dictation-start.svg"), true);

    controller._audioDictationActive = true;
    controller._audioDictationTarget = "shortText";
    controller.updateButtons({ meetingId: "21" });

    assert.equal(view.btnTitleDictate.children.length, 1);
    assert.equal(view.btnTitleDictate.children[0].tagName, "IMG");
    assert.equal(String(view.btnTitleDictate.children[0].src || "").endsWith("dictation-stop.svg"), true);
    assert.equal(String(view.btnTitleDictate.title || "").includes("Aufnahme"), true);
    assert.equal(view.btnLongDictate.disabled, true);
  });

  await run("Tops v2 Integration: Save/Delete + Reload haelt Zustand konsistent", async () => {
    const db = {
      tops: [
        {
          id: 201,
          level: 2,
          title: "Alpha",
          longtext: "",
          status: "-",
          is_carried_over: 0,
          parent_top_id: null,
        },
      ],
    };

    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 12, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
      },
      async saveTop({ topId, patch }) {
        const top = db.tops.find((t) => String(t.id) === String(topId));
        if (!top) return { ok: false, error: "not found" };
        Object.assign(top, patch || {});
        return { ok: true };
      },
      async deleteTop(topId) {
        const id = topId && typeof topId === "object" ? topId.topId : topId;
        db.tops = db.tops.filter((t) => String(t.id) !== String(id));
        return { ok: true };
      },
    };

    const store = createTopsStore({ meetingId: null, tops: [] });
    const commands = new TopsCommands({ store, repository });

    await commands.loadTops({ meetingId: 12, projectId: 99 });
    commands.selectTop(201);

    const selectedBefore = store.getState().tops.find((t) => t.id === 201);
    const patch = buildPatchFromDraft(selectedBefore, { ...editorFromTop(selectedBefore), title: "Beta" });
    assert.deepEqual(patch, { title: "Beta" });

    const saveRes = await commands.saveDraft(patch);
    assert.equal(saveRes.ok, true);

    await commands.loadTops({ meetingId: 12, projectId: 99 });
    const selectedAfterSave = store.getState().tops.find((t) => t.id === 201);
    assert.equal(selectedAfterSave.title, "Beta");

    const delRes = await commands.deleteSelectedTop();
    assert.equal(delRes.ok, true);
    await commands.loadTops({ meetingId: 12, projectId: 99 });

    assert.equal(store.getState().tops.length, 0);
    assert.equal(store.getState().selectedTopId, null);
  });

  await run("Tops v2 Integration: Auto-Save speichert Text per Debounce und Blur", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };
    try {
      const db = {
        tops: [
          {
            id: 501,
            level: 2,
            title: "Alpha",
            longtext: "Lang",
            status: "-",
            is_carried_over: 0,
            parent_top_id: null,
          },
        ],
      };
      const saveCalls = [];
      const repository = {
        async loadByMeeting() {
          return { ok: true, meeting: { id: 22, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
        },
        async saveTop({ topId, patch }) {
          saveCalls.push({ topId, patch: { ...(patch || {}) } });
          const top = db.tops.find((t) => String(t.id) === String(topId));
          if (!top) return { ok: false, error: "not found" };
          Object.assign(top, patch || {});
          return { ok: true };
        },
      };

      const screen = new TopsScreen({
        topsRepository: repository,
        router: { context: { projectLabel: "Projekt X" } },
        projectId: 99,
        meetingId: 22,
      });
      screen.render();

      await screen.commands.loadTops({ meetingId: 22, projectId: 99 });
      screen.commands.selectTop(501);
      const selected = screen.store.getState().tops.find((t) => String(t.id) === "501");
      screen.commands.updateDraft(editorFromTop(selected));

      screen._handleWorkbenchDraftChange({ draft: { title: "Alpha 1" }, source: "text" });
      assert.equal(screen.store.getState().editor.title, "Alpha 1");
      assert.equal(screen.store.getState().tops[0].title, "Alpha");
      assert.equal(screen.store.getState().tops[0].previewTitle, "Alpha 1");
      assert.equal(
        screen.topsList.root.children[0].children[0].children[1].children[0].textContent,
        "Alpha 1"
      );
      await sleep(120);
      screen._handleWorkbenchDraftChange({ draft: { title: "Alpha 2" }, source: "text" });
      assert.equal(screen.store.getState().editor.title, "Alpha 2");
      assert.equal(screen.store.getState().tops[0].title, "Alpha");
      assert.equal(screen.store.getState().tops[0].previewTitle, "Alpha 2");
      assert.equal(
        screen.topsList.root.children[0].children[0].children[1].children[0].textContent,
        "Alpha 2"
      );
      assert.equal(saveCalls.length, 0);
      await sleep(520);

      assert.equal(saveCalls.length, 1);
      assert.equal(saveCalls[0].patch.title, "Alpha 2");
      assert.equal(db.tops[0].title, "Alpha 2");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Auto-Save flush tatsaechlich beim Blur", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };
    try {
      const db = {
        tops: [
          {
            id: 502,
            level: 2,
            title: "Beta",
            longtext: "Lang",
            status: "-",
            is_carried_over: 0,
            parent_top_id: null,
          },
        ],
      };
      const saveCalls = [];
      const repository = {
        async loadByMeeting() {
          return { ok: true, meeting: { id: 23, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
        },
        async saveTop({ topId, patch }) {
          saveCalls.push({ topId, patch: { ...(patch || {}) } });
          const top = db.tops.find((t) => String(t.id) === String(topId));
          if (!top) return { ok: false, error: "not found" };
          Object.assign(top, patch || {});
          return { ok: true };
        },
      };

      const screen = new TopsScreen({
        topsRepository: repository,
        router: { context: { projectLabel: "Projekt X" } },
        projectId: 99,
        meetingId: 23,
      });

      await screen.commands.loadTops({ meetingId: 23, projectId: 99 });
      screen.commands.selectTop(502);
      const selected = screen.store.getState().tops.find((t) => String(t.id) === "502");
      screen.commands.updateDraft(editorFromTop(selected));

      screen._handleWorkbenchDraftChange({ draft: { title: "Beta old" }, source: "text" });
      screen.workbench = {
        getDraft() {
          return { ...screen.store.getState().editor, title: "Beta X" };
        },
      };
      await screen._handleWorkbenchTextBlur({ field: "shortText", draft: { title: "Beta old" } });

      assert.equal(saveCalls.length, 1);
      assert.equal(saveCalls[0].patch.title, "Beta X");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Neuer Level-1-Titel bleibt editierbar und speichert", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };
    try {
      let nextId = 601;
      const db = {
        tops: [],
      };
      const saveCalls = [];
      const repository = {
        async loadByMeeting() {
          return { ok: true, meeting: { id: 26, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
        },
        async createTop({ projectId, meetingId, level, parentTopId, title }) {
          const top = {
            id: nextId++,
            project_id: projectId,
            meeting_id: meetingId,
            level,
            number: db.tops.length + 1,
            title: title || "(ohne Bezeichnung)",
            longtext: "",
            status: "-",
            is_carried_over: 0,
            parent_top_id: parentTopId ?? null,
          };
          db.tops.push(top);
          return { ok: true, top: { ...top } };
        },
        async saveTop({ topId, patch }) {
          saveCalls.push({ topId, patch: { ...(patch || {}) } });
          const top = db.tops.find((t) => String(t.id) === String(topId));
          if (!top) return { ok: false, error: "not found" };
          Object.assign(top, patch || {});
          return { ok: true };
        },
      };

      const screen = new TopsScreen({
        topsRepository: repository,
        router: { context: { projectLabel: "Projekt X" } },
        projectId: 99,
        meetingId: 26,
      });

      screen.render();
      await screen.commands.loadTops({ meetingId: 26, projectId: 99 });
      await screen._handleWorkbenchCreateLevel1();

      const createdId = screen.store.getState().selectedTopId;
      assert.ok(createdId);
      assert.equal(screen.workbench.sharedEditboxCore.editbox.shortInput.readOnly, false);
      assert.equal(screen.store.getState().tops.length, 1);
      assert.equal(screen.store.getState().tops[0].is_carried_over, 0);

      const shortInput = screen.workbench.sharedEditboxCore.editbox.shortInput;
      shortInput.value = "Kapitel 1";
      shortInput.dispatchEvent({ type: "input" });
      assert.equal(screen.store.getState().editor.title, "Kapitel 1");
      assert.equal(screen.store.getState().tops[0].previewTitle, "Kapitel 1");
      assert.equal(
        screen.topsList.root.children[0].children[0].children[1].children[0].textContent,
        "Kapitel 1"
      );

      shortInput.value = "Kapitel 1 final";
      shortInput.dispatchEvent({ type: "input" });
      assert.equal(screen.store.getState().editor.title, "Kapitel 1 final");
      assert.equal(screen.store.getState().tops[0].previewTitle, "Kapitel 1 final");
      assert.equal(
        screen.topsList.root.children[0].children[0].children[1].children[0].textContent,
        "Kapitel 1 final"
      );

      shortInput.dispatchEvent({
        type: "blur",
      });
      await sleep(50);

      assert.equal(saveCalls.length, 1);
      assert.equal(saveCalls[0].patch.title, "Kapitel 1 final");
      assert.equal(screen.store.getState().tops[0].title, "Kapitel 1 final");
      assert.equal(screen.store.getState().tops[0].previewTitle, undefined);
      assert.equal(screen.store.getState().editor.title, "Kapitel 1 final");

      await screen._reloadTops({ keepSelection: true, selectTopId: createdId });
      assert.equal(screen.store.getState().selectedTopId, createdId);
      assert.equal(screen.store.getState().tops[0].title, "Kapitel 1 final");
      assert.equal(
        screen.topsList.root.children[0].children[0].children[1].children[0].textContent,
        "Kapitel 1 final"
      );
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Uebernommener Level-1-Titel bleibt read-only", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };
    try {
      const db = {
        tops: [
          {
            id: 701,
            level: 1,
            title: "Alt-Titel",
            longtext: "",
            status: "-",
            is_carried_over: 1,
            parent_top_id: null,
          },
        ],
      };
      const saveCalls = [];
      const repository = {
        async loadByMeeting() {
          return { ok: true, meeting: { id: 27, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
        },
        async saveTop({ topId, patch }) {
          saveCalls.push({ topId, patch: { ...(patch || {}) } });
          const top = db.tops.find((t) => String(t.id) === String(topId));
          if (!top) return { ok: false, error: "not found" };
          Object.assign(top, patch || {});
          return { ok: true };
        },
      };

      const screen = new TopsScreen({
        topsRepository: repository,
        router: { context: { projectLabel: "Projekt X" } },
        projectId: 99,
        meetingId: 27,
      });

      screen.render();
      await screen.commands.loadTops({ meetingId: 27, projectId: 99 });
      screen.commands.selectTop(701);
      const selected = screen.store.getState().tops.find((t) => String(t.id) === "701");
      screen.commands.updateDraft(editorFromTop(selected));
      screen._syncScreenState();

      assert.equal(screen.workbench.sharedEditboxCore.editbox.shortInput.readOnly, true);
      assert.equal(screen.workbench.focusShortText(), false);
      const patch = buildPatchFromDraft(selected, screen.store.getState().editor);
      assert.equal(patch.title, undefined);
      assert.equal(saveCalls.length, 0);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Haken und Meta-Felder speichern sofort", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };

    const db = {
      tops: [
        {
          id: 503,
          level: 2,
          title: "Gamma",
          longtext: "Lang",
          status: "-",
          is_carried_over: 0,
          parent_top_id: null,
        },
      ],
    };
    const saveCalls = [];
    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 24, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
      },
      async saveTop({ topId, patch }) {
        saveCalls.push({ topId, patch: { ...(patch || {}) } });
        const top = db.tops.find((t) => String(t.id) === String(topId));
        if (!top) return { ok: false, error: "not found" };
        Object.assign(top, patch || {});
        return { ok: true };
      },
    };

    const screen = new TopsScreen({
      topsRepository: repository,
      router: { context: { projectLabel: "Projekt X" } },
      projectId: 99,
      meetingId: 24,
    });

    await screen.commands.loadTops({ meetingId: 24, projectId: 99 });
    screen.commands.selectTop(503);
    const selected = screen.store.getState().tops.find((t) => String(t.id) === "503");
    screen.commands.updateDraft(editorFromTop(selected));

    screen._handleWorkbenchDraftChange({
      draft: {
        ...editorFromTop(selected),
        is_important: 1,
        is_hidden: 1,
        is_task: 1,
        is_decision: 1,
        due_date: "2026-04-27",
        status: "offen",
        responsible_label: "WTB",
      },
      source: "flags",
    });
    await sleep(50);

    assert.equal(saveCalls.length, 1);
    assert.equal(saveCalls[0].patch.is_important, 1);
    assert.equal(saveCalls[0].patch.is_hidden, 1);
    assert.equal(saveCalls[0].patch.is_task, 1);
    assert.equal(saveCalls[0].patch.is_decision, 1);
    assert.equal(saveCalls[0].patch.due_date, "2026-04-27");
    assert.equal(saveCalls[0].patch.status, "offen");
    assert.equal(saveCalls[0].patch.responsible_label, "WTB");
    globalThis.document = prevDocument;
    globalThis.window = prevWindow;
  });

  await run("Tops v2 Integration: Kein Save ohne Auswahl und kein Save im ReadOnly", async () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { bbmDb: {}, document: doc };

    const db = {
      tops: [
        {
          id: 504,
          level: 2,
          title: "Delta",
          longtext: "Lang",
          status: "-",
          is_carried_over: 0,
          parent_top_id: null,
        },
      ],
    };
    const saveCalls = [];
    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 25, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
      },
      async saveTop({ topId, patch }) {
        saveCalls.push({ topId, patch: { ...(patch || {}) } });
        const top = db.tops.find((t) => String(t.id) === String(topId));
        if (!top) return { ok: false, error: "not found" };
        Object.assign(top, patch || {});
        return { ok: true };
      },
    };

    const screen = new TopsScreen({
      topsRepository: repository,
      router: { context: { projectLabel: "Projekt X" } },
      projectId: 99,
      meetingId: 25,
    });

    await screen.commands.loadTops({ meetingId: 25, projectId: 99 });
    screen._handleWorkbenchDraftChange({ draft: { title: "Ohne Auswahl" }, source: "text" });
    await sleep(450);
    assert.equal(saveCalls.length, 0);

    screen.commands.selectTop(504);
    const selected = screen.store.getState().tops.find((t) => String(t.id) === "504");
    screen.commands.updateDraft(editorFromTop(selected));
    screen.store.setState({ isReadOnly: true });

    screen._handleWorkbenchDraftChange({ draft: { title: "Readonly" }, source: "text" });
    await sleep(450);
    assert.equal(saveCalls.length, 0);
    globalThis.document = prevDocument;
    globalThis.window = prevWindow;
  });

  await run("Tops v2 Integration: Speichern-Button bleibt aus der Workbench aus", () => {
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    globalThis.document = doc;
    globalThis.window = { document: doc };

    try {
      const workbench = new TopsWorkbench({});
      assert.equal(workbench.headerPrimaryActions.children.includes(workbench.btnSave), false);
      assert.equal(workbench.btnSave.style.display, "none");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: TopGapFlow repariert 1.1/1.2/1.3 zu 1.1/1.2", async () => {
    const state = {
      meetingId: 12,
      isReadOnly: false,
      tops: [
        { id: 11, level: 2, number: 1, parent_top_id: null },
        { id: 13, level: 2, number: 3, parent_top_id: null },
      ],
    };
    const calls = [];
    const view = {
      meetingId: 12,
      isReadOnly: false,
      store: {
        getState() {
          return state;
        },
      },
      _firstNumberGapFromItems: () => firstNumberGapFromItems(state.tops),
      async reloadList() {},
    };

    const prevWindow = globalThis.window;
    globalThis.window = {
      bbmDb: {
        async meetingTopsFixNumberGap(payload) {
          calls.push(payload);
          const top = state.tops.find((item) => String(item.id) === String(payload.fromTopId));
          if (!top) return { ok: false, error: "not found" };
          top.number = payload.toNumber;
          return { ok: true };
        },
      },
    };

    try {
      const flow = new TopGapFlow({ view });
      await flow.autoFixAfterDelete();
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], {
        meetingId: 12,
        level: 2,
        parentTopId: null,
        fromTopId: 13,
        toNumber: 2,
      });
      assert.deepEqual(
        state.tops.map((t) => t.number),
        [1, 2]
      );
    } finally {
      globalThis.window = prevWindow;
    }
  });

  await run("Tops v2 Integration: Neuer Eintrag scrollt und fokussiert den Kurztext", async () => {
    const events = [];
    const row = {
      scrollIntoView(options) {
        events.push(["scroll", options]);
      },
    };

    const result = await focusHelper.focusCreatedTopAfterReload({
      createdTopId: 42,
      selectedTopId: 42,
      topsListRoot: {
        querySelector(selector) {
          events.push(["query", selector]);
          return row;
        },
      },
      workbench: {
        focusShortText(options) {
          events.push(["focus", options]);
          return true;
        },
      },
      awaitNextPaint: async () => {},
    });

    assert.equal(result, true);
    assert.deepEqual(events, [
      ["query", '[data-top-id="42"]'],
      ["scroll", { block: "nearest", inline: "nearest" }],
      ["focus", { select: true }],
    ]);
  });

  await run("EditboxShell: focusShortText aktiviert das Kurztextfeld", () => {
    const makeClassList = () => {
      const tokens = new Set();
      return {
        add(...names) {
          for (const name of names) tokens.add(String(name));
        },
        toggle(name, force) {
          const key = String(name);
          if (force === undefined) {
            if (tokens.has(key)) tokens.delete(key);
            else tokens.add(key);
            return tokens.has(key);
          }
          if (force) tokens.add(key);
          else tokens.delete(key);
          return tokens.has(key);
        },
      };
    };

    const doc = {
      activeElement: null,
      createElement(tag) {
        const el = {
          tagName: String(tag || "").toUpperCase(),
          ownerDocument: doc,
          children: [],
          style: {},
          dataset: {},
          className: "",
          textContent: "",
          disabled: false,
          readOnly: false,
          value: "",
          rows: 0,
          maxLength: 0,
          append(...nodes) {
            this.children.push(...nodes);
          },
          appendChild(node) {
            this.children.push(node);
            return node;
          },
          setAttribute() {},
          addEventListener() {},
          focus() {
            doc.activeElement = this;
            this.wasFocused = true;
          },
          select() {
            this.wasSelected = true;
          },
          classList: makeClassList(),
        };
        return el;
      },
    };

    const shell = new EditboxShell({ documentRef: doc });
    shell.setState("normal");
    shell.setFieldAccess({
      shortTextReadOnly: false,
      longTextReadOnly: false,
      flagsDisabled: false,
    });

    const result = shell.focusShortText();

    assert.equal(result, true);
    assert.equal(doc.activeElement, shell.shortInput);
    assert.equal(shell.shortInput.wasFocused, true);
    assert.equal(shell.shortInput.wasSelected, true);
  });
}

module.exports = { runTopsScreenIntegrationTests };
