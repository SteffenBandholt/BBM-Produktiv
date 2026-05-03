const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsScreenIntegrationTests(run) {
  const [{ createTopsStore }, { TopsCommands }, vm, workbenchVmMod] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/state/TopsStore.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/domain/TopsCommands.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/viewmodel/TopsWorkbenchViewModel.js")),
  ]);
  const { EditboxShell } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/core/editbox/EditboxShell.js")
  );
  const focusHelper = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/topCreateFocus.js")
  );

  const {
    buildWorkbenchState,
    shouldShowWorkbench,
    buildListItemsFromState,
    editorFromTop,
    buildPatchFromDraft,
  } = vm;
  const { buildWorkbenchVm } = workbenchVmMod;

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
    assert.equal(wbNoSelection.hasSelection, false);
    assert.equal(wbNoSelection.canSave, false);
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
