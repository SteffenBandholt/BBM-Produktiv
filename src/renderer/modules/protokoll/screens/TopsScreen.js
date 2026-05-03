import { TopsHeader } from "../TopsHeader.js";
import { TopsList } from "../TopsList.js";
import { TopsWorkbench } from "../TopsWorkbench.js";
import { TopsCommands } from "../TopsCommands.js";
import { TopsCloseFlow } from "../TopsCloseFlow.js";
import { TopsRepository } from "../TopsRepository.js";
import { TopsAssigneeDataSource } from "../TopsAssigneeDataSource.js";
import { createTopsStore } from "../createTopsStore.js";
import { getSelectedTop, hasSelection } from "../TopsSelectors.js";
import { TopsViewDialogs } from "../TopsViewDialogs.js";
import { buildHeaderState } from "../buildHeaderState.js";
import { ensureProtokollModuleStyles } from "../styles.js";
import { buildListItemsFromState } from "../buildListItemsFromState.js";
import { editorFromTop } from "../editorFromTop.js";
import { buildPatchFromDraft } from "../buildPatchFromDraft.js";
import { canCreateChildFromState } from "../canCreateChildFromState.js";
import { canDeleteFromState } from "../canDeleteFromState.js";
import { canMoveFromState } from "../canMoveFromState.js";
import { shouldShowWorkbench } from "../shouldShowWorkbench.js";
import { buildWorkbenchVm } from "../buildWorkbenchVm.js";
import { focusCreatedTopAfterReload } from "../topCreateFocus.js";
import { normalizeTopFilterMode } from "../topFilterMode.js";

function buildInitialProtocolScreenState({ projectId = null, meetingId = null } = {}) {
  return {
    projectId,
    meetingId,
    tops: [],
    selectedTopId: null,
    editor: {},
    isReadOnly: false,
    isMoveMode: false,
    isLoading: false,
    isWriting: false,
    topFilter: "all",
    error: null,
    meetingMeta: null,
  };
}

// TOPS-V2: eigenstaendiger Screen inkl. nativer Close-/Output-Flow.
export default class TopsScreen {
  constructor(options = {}) {
    this.router = options.router || null;
    this.projectId = options.projectId || null;
    this.meetingId = options.meetingId || null;
    this.returnContext = options.returnContext || null;

    this.root = null;
    this.header = null;
    this.sheetArea = null;
    this.sheetCanvas = null;
    this.sheetPaper = null;
    this.editArea = null;
    this.editCanvas = null;

    this._sidebarEl = null;
    this._sidebarDisplay = "";
    this._suppressNextWorkbenchTextBlur = false;
    this.workbench = null;
    this.topsList = null;
    this.closeFlow = null;
    this.dialogs = null;
    this._dialogViewAdapter = this._createDialogViewAdapter();

    this._buildProtocolModuleRuntime(options);
  }

  // ---------------------------------------------------------------------------
  // Fachmodul `Protokoll`: Screen-Host und modulinterner Unterbau
  // ---------------------------------------------------------------------------

  // Fachmodul `Protokoll`:
  // TopsScreen ist der Screen-Host des Moduls und baut den heutigen Protokoll-Unterbau zusammen.
  _buildProtocolModuleRuntime(options = {}) {
    this.topsRepository = options.topsRepository || new TopsRepository();
    this.assigneeDataSource = options.assigneeDataSource || new TopsAssigneeDataSource();
    this.store = createTopsStore(
      buildInitialProtocolScreenState({
        projectId: this.projectId,
        meetingId: this.meetingId,
      })
    );
    this.commands = new TopsCommands({
      store: this.store,
      repository: this.topsRepository,
    });

    // Fachmodul `Protokoll` mit gemeinsamer Dienstnutzung:
    // Close-/Output-Flow bleibt fachlich im Modul, nutzt aber Router- und Mail-/Print-Dienste.
    this.closeFlow = new TopsCloseFlow({
      ...options,
      topsRepository: this.topsRepository,
    });
    this._syncCloseFlowContext();
  }

  render() {
    this._buildShell();
    this._hideSidebar();
    this._syncScreenState();
    return this.root;
  }

  // ---------------------------------------------------------------------------
  // Arbeitsscreen `TopsScreen`: sichtbare Screen-Bereiche und UI-Host
  // ---------------------------------------------------------------------------

  _buildShell() {
    ensureProtokollModuleStyles();
    const root = document.createElement("div");
    root.setAttribute("data-bbm-tops-screen", "true");

    const sheetArea = document.createElement("section");
    sheetArea.setAttribute("data-bbm-tops-screen-area", "sheet");

    const sheetCanvas = document.createElement("div");
    sheetCanvas.setAttribute("data-bbm-tops-screen-sheet-canvas", "true");

    const sheetPaper = document.createElement("div");
    sheetPaper.setAttribute("data-bbm-tops-screen-sheet-paper", "true");

    const editArea = document.createElement("section");
    editArea.setAttribute("data-bbm-tops-screen-area", "edit");
    editArea.dataset.bbmWorkbenchVisible = "false";

    const editCanvas = document.createElement("div");
    editCanvas.setAttribute("data-bbm-tops-screen-edit-canvas", "true");

    this.root = root;
    this.sheetArea = sheetArea;
    this.sheetCanvas = sheetCanvas;
    this.sheetPaper = sheetPaper;
    this.editArea = editArea;
    this.editCanvas = editCanvas;

    this._buildProtocolScreenRegions();

    sheetCanvas.appendChild(sheetPaper);
    sheetArea.appendChild(sheetCanvas);
    editArea.appendChild(editCanvas);
    root.append(this.header.root, sheetArea, editArea);
  }

  _buildProtocolScreenRegions() {
    this._buildHeader();
    this._buildList();
    this._buildProtocolWorkbenchHost();
  }

  _buildHeader() {
    this.header = new TopsHeader({
      onClose: async () => {
        await this._returnAfterClose();
      },
      onEndMeeting: async () => {
        if (this.store.getState().isWriting) return;
        await this.closeFlow?.run?.();
        await this._reloadTops({ keepSelection: true });
        this._syncScreenState();
      },
      onKeywordClick: async () => this._openKeywordDialog(),
    });
    this.dialogs = new TopsViewDialogs({ view: this._dialogViewAdapter });
  }

  _buildList() {
    this.topsList = new TopsList({
      onRowClick: async (item) => this._handleListRowClick(item),
    });
    this.sheetPaper.appendChild(this.topsList.root);
  }

  // ---------------------------------------------------------------------------
  // Screen-Host-Bruecke: protokollspezifische UI-Verdrahtung zur Workbench
  // ---------------------------------------------------------------------------

  // UI-/View-nahe Host-Logik im Modul `Protokoll`:
  // Der Screen bleibt Verdrahtungsschicht; gemeinsamer Bearbeitungskern liegt weiterhin ausserhalb.
  _buildProtocolWorkbenchHost() {
    this.workbench = new TopsWorkbench(this._createProtocolWorkbenchUiAdapter());
    this.editCanvas.appendChild(this.workbench.root);
  }

  _createProtocolWorkbenchActionBridge() {
    return {
      onDraftChange: (draft) => this._handleWorkbenchDraftChange(draft),
      onButtonPointerDown: () => this._markWorkbenchButtonPointerDown(),
      onTextBlur: async (payload) => this._handleWorkbenchTextBlur(payload),
      onSave: async () => this._handleWorkbenchSave(),
      onDelete: async () => this._handleWorkbenchDelete(),
      onToggleMove: async () => this._handleWorkbenchToggleMove(),
      onCreateLevel1: async () => this._handleWorkbenchCreateLevel1(),
      onCreateChild: async () => this._handleWorkbenchCreateChild(),
    };
  }

  _createProtocolWorkbenchDataBridge() {
    return {
      loadCompanies: async () => {
        return await this.assigneeDataSource.loadCompaniesByProject(this._getQuicklaneProjectId());
      },
      loadEmployeesByCompany: async (companyId) => {
        return await this.assigneeDataSource.loadEmployeesByCompany(companyId);
      },
    };
  }

  // Protokollspezifische Screen-Verdrahtung:
  // Router-, Projektkontext- und Datenquellenzugriffe bleiben Host-/Integrationslogik und nicht Kernbaustein.
  _createProtocolWorkbenchUiAdapter() {
    return {
      ...this._createProtocolWorkbenchActionBridge(),
      ...this._createProtocolWorkbenchDataBridge(),
    };
  }

  _setTopFilter(filterMode) {
    const topFilter = normalizeTopFilterMode(filterMode);
    const current = normalizeTopFilterMode(this.store.getState().topFilter);
    if (topFilter === current) {
      return false;
    }
    this.store.setState({ topFilter });
    this._syncScreenState();
    return true;
  }

  setTopFilter(filterMode) {
    return this._setTopFilter(filterMode);
  }

  getTopFilter() {
    return normalizeTopFilterMode(this.store.getState().topFilter);
  }

  // ---------------------------------------------------------------------------
  // Host-/Kontextintegration: Router-, Sidebar- und gemeinsame Domaenenzugriffe
  // ---------------------------------------------------------------------------

  _hideSidebar() {
    const sidebar = document.querySelector('[data-bbm-sidebar="true"]');
    if (!sidebar) return;
    if (!this._sidebarEl) {
      this._sidebarEl = sidebar;
      this._sidebarDisplay = sidebar.style.display || "";
    }
    sidebar.style.display = "none";
  }

  _showSidebar() {
    if (!this._sidebarEl) return;
    this._sidebarEl.style.display = this._sidebarDisplay;
    this._sidebarEl = null;
    this._sidebarDisplay = "";
  }

  _getQuicklaneProjectId() {
    const state = this.store.getState();
    return state.projectId || this.router?.currentProjectId || null;
  }

  // Gemeinsame Domaene, modulnah verbraucht:
  // TopsScreen nutzt den vorhandenen Projektkontext, ist aber nicht selbst die Projektdomaene.
  _getProjectScreenContext() {
    const state = this.store.getState();
    return {
      projectId: state.projectId || this.router?.currentProjectId || null,
      projectLabel: String(this.router?.context?.projectLabel || "").trim(),
    };
  }

  _syncHeaderState() {
    if (!(this.header instanceof TopsHeader)) return;
    const state = this.store.getState();
    const projectContext = this._getProjectScreenContext();
    const headerState = buildHeaderState({
      ...state,
      projectLabel: projectContext.projectLabel,
    });
    this.header.update({
      titleLine: headerState.titleLine,
      keywordLine: headerState.keywordLine,
      contextLine: headerState.contextLine,
      isReadOnly: headerState.isReadOnly,
      canEndMeeting: !!state.meetingId,
      isBusy: !!state.isLoading || !!state.isWriting,
      canEditKeyword: !!state.meetingId,
      showMetaLegend: !!state.meetingId,
    });
  }

  _createDialogViewAdapter() {
    const owner = this;
    return {
      get meetingId() {
        const state = owner.store.getState();
        return state.meetingId || owner.meetingId || null;
      },
      set meetingMeta(value) {
        const nextMeta = value || null;
        owner.store.setState({
          meetingMeta: nextMeta,
          isReadOnly: nextMeta ? Number(nextMeta.is_closed) === 1 : false,
        });
      },
      get meetingMeta() {
        return owner.store.getState().meetingMeta || null;
      },
      set isReadOnly(value) {
        owner.store.setState({ isReadOnly: !!value });
      },
      get isReadOnly() {
        return !!owner.store.getState().isReadOnly;
      },
      _parseMeetingTitleParts() {
        const headerState = buildHeaderState(owner.store.getState());
        return {
          meetingIndex: headerState.meetingNo || "",
          meetingDateText: headerState.meetingDate || "",
          meetingKeyword: headerState.keywordLine || "",
        };
      },
      _updateTopBarProtocolTitle() {
        owner._syncScreenState();
      },
    };
  }

  async _openKeywordDialog() {
    const state = this.store.getState();
    if (!state.meetingId) return;
    if (!(this.dialogs instanceof TopsViewDialogs)) return;
    await this.dialogs.handleOpenMeetingKeyword();
  }

  _syncListState() {
    if (!(this.topsList instanceof TopsList)) return;
    this.topsList.setItems(buildListItemsFromState(this.store.getState()));
  }

  async _handleListRowClick(item) {
    const top = item?.raw || null;
    if (!top) return;
    const state = this.store.getState();
    const movingTop = state.isMoveMode ? getSelectedTop(state) : null;

    if (state.isMoveMode && movingTop && !state.isReadOnly) {
      if (state.isWriting) return;
      if (!item.isMoveTarget) return;
      this.store.setState({ isWriting: true });
      this.store.setState({ error: null });
      try {
        const res = await this.topsRepository.moveTop({
          topId: movingTop.id,
          targetParentId: top.id || null,
        });
        if (!res?.ok) {
          this.store.setState({ error: res?.error || "move failed" });
          return;
        }
        await this._reloadTops({ keepSelection: true, selectTopId: movingTop.id });
        this._syncScreenState();
        return;
      } catch (err) {
        const error = err?.message ? String(err.message) : String(err || "move failed");
        this.store.setState({ error });
        return;
      } finally {
        this.store.setState({ isWriting: false });
      }
    }

    if (state.isWriting) return;
    this.commands.selectTop(top.id);
    this.commands.updateDraft(editorFromTop(top));
    this._syncScreenState();
  }

  // ---------------------------------------------------------------------------
  // Screen-Zustand: UI-nahe Synchronisation des Protokoll-Arbeitsscreens
  // ---------------------------------------------------------------------------

  _buildProtocolWorkbenchScreenVm(state, selectedTop) {
    return buildWorkbenchVm(state, selectedTop);
  }

  _syncProtocolWorkbenchHostState() {
    if (!(this.workbench instanceof TopsWorkbench)) return;

    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    const vm = this._buildProtocolWorkbenchScreenVm(state, selectedTop);

    this.workbench.setState(vm);
  }

  _syncScreenState() {
    const state = this.store.getState();
    this._syncCloseFlowContext();
    this._syncHeaderState();
    this._syncListState();
    this._syncProtocolWorkbenchHostState();
    if (this.router?.context?.ui) {
      this.router.context.ui.topFilter = normalizeTopFilterMode(state.topFilter || "all");
      this.router.context.ui.onTopFilterChange = (mode) => this.setTopFilter(mode);
    }

    if (this.editArea) {
      this.editArea.dataset.bbmWorkbenchVisible = shouldShowWorkbench(state) ? "true" : "false";
      this.editArea.dataset.bbmHasSelection = hasSelection(state) ? "true" : "false";
    }
  }

  _syncCloseFlowContext() {
    const state = this.store.getState();
    if (!(this.closeFlow instanceof TopsCloseFlow)) return;
    this.closeFlow.setContext({
      projectId: state.projectId || this.projectId || this.router?.currentProjectId || null,
      meetingId: state.meetingId || this.meetingId || null,
      meetingMeta: state.meetingMeta || null,
      isReadOnly: !!state.isReadOnly,
    });
  }

  async _returnAfterClose() {
    const projectId =
      this.projectId ||
      this.returnContext?.projectId ||
      this.store?.getState?.()?.projectId ||
      this.router?.currentProjectId ||
      null;

    const projectOptions =
      this.returnContext?.project && typeof this.returnContext.project === "object"
        ? { project: this.returnContext.project }
        : {};

    if (projectId && typeof this.router?.showProjectWorkspace === "function") {
      await this.router.showProjectWorkspace(projectId, projectOptions);
      return true;
    }

    if (typeof this.router?.showProjects === "function") {
      await this.router.showProjects();
      return true;
    }

    return false;
  }

  _handleWorkbenchDraftChange(draft) {
    this.commands.updateDraft(draft || {});
    this._syncProtocolWorkbenchHostState();
  }

  _markWorkbenchButtonPointerDown() {
    this._suppressNextWorkbenchTextBlur = true;
  }

  async _handleWorkbenchSave() {
    await this._saveActiveDraft({ resetMoveMode: true });
  }

  async _handleWorkbenchTextBlur(_payload = {}) {
    if (this._suppressNextWorkbenchTextBlur) {
      this._suppressNextWorkbenchTextBlur = false;
      return;
    }
    await this._saveActiveDraft({ resetMoveMode: false });
  }

  async _saveActiveDraft({ resetMoveMode = false } = {}) {
    const state = this.store.getState();
    if (state.isWriting) return false;
    const selectedTop = getSelectedTop(state);
    if (!selectedTop) return false;

    const patch = buildPatchFromDraft(selectedTop, state.editor || {});
    if (!Object.keys(patch).length) return true;

    this.store.setState({ isWriting: true });
    try {
      this.store.setState({ error: null });
      const res = await this.commands.saveDraft(patch);
      if (!res?.ok) return false;
      this.commands.updateDraft(editorFromTop(getSelectedTop(this.store.getState())));
      if (resetMoveMode) {
        this.commands.toggleMoveMode(false);
      }
      return true;
    } finally {
      this.store.setState({ isWriting: false });
      this._syncScreenState();
    }
  }

  async _handleWorkbenchDelete() {
    const state = this.store.getState();
    if (state.isWriting) return;
    const selectedTop = getSelectedTop(state);
    if (!canDeleteFromState(state, selectedTop)) return;

    this.store.setState({ isWriting: true });
    try {
      this.store.setState({ error: null });
      const saveRes = await this.commands.saveDraft({
        ...(buildPatchFromDraft(selectedTop, state.editor || {}) || {}),
        is_hidden: 1,
      });
      if (!saveRes?.ok) return;
      const res = await this.commands.deleteSelectedTop();
      if (!res?.ok) return;
      this.commands.updateDraft(editorFromTop(getSelectedTop(this.store.getState())));
      this.commands.toggleMoveMode(false);
      this._syncScreenState();
    } finally {
      this.store.setState({ isWriting: false });
    }
  }

  async _handleWorkbenchToggleMove() {
    const state = this.store.getState();
    if (state.isWriting) return;
    const selectedTop = getSelectedTop(state);
    if (!state.isMoveMode && !canMoveFromState(state, selectedTop)) return;
    const saved = await this._saveActiveDraft({ resetMoveMode: false });
    if (saved === false) return;
    this.commands.toggleMoveMode();
    this._syncScreenState();
  }

  async _handleWorkbenchCreateLevel1() {
    const state = this.store.getState();
    if (state.isWriting) return;
    if (state.isReadOnly || !state.meetingId || !state.projectId) return;

    let createdId = null;
    let shouldFocusCreatedTop = false;
    this.store.setState({ error: null });
    const saved = await this._saveActiveDraft({ resetMoveMode: false });
    if (saved === false) return;
    this.store.setState({ isWriting: true });
    try {
      let res;
      try {
        res = await this.topsRepository.createTop({
          projectId: state.projectId,
          meetingId: state.meetingId,
          level: 1,
          parentTopId: null,
          title: "(ohne Bezeichnung)",
        });
      } catch (err) {
        const error = err?.message ? String(err.message) : String(err || "create failed");
        this.store.setState({ error });
        return;
      }
      if (!res?.ok) {
        this.store.setState({ error: res?.error || "create failed" });
        return;
      }
      createdId = res?.top?.id || null;
      shouldFocusCreatedTop = !!createdId;
      await this._reloadTops({ keepSelection: true, selectTopId: createdId || null });
      this._syncScreenState();
    } finally {
      this.store.setState({ isWriting: false });
    }

    if (shouldFocusCreatedTop) {
      this._syncScreenState();
      await focusCreatedTopAfterReload({
        createdTopId: createdId,
        selectedTopId: this.store.getState().selectedTopId,
        topsListRoot: this.topsList?.root,
        workbench: this.workbench,
        awaitNextPaint: () => this._awaitNextPaint(),
      });
    }
  }

  async _handleWorkbenchCreateChild() {
    const state = this.store.getState();
    if (state.isWriting) return;
    const selectedTop = getSelectedTop(state);
    if (!canCreateChildFromState(state, selectedTop)) return;

    const level = Number(selectedTop.level) + 1;
    if (!Number.isFinite(level) || level > 4) return;

    let createdId = null;
    let shouldFocusCreatedTop = false;
    this.store.setState({ error: null });
    const saved = await this._saveActiveDraft({ resetMoveMode: false });
    if (saved === false) return;
    this.store.setState({ isWriting: true });
    try {
      let res;
      try {
        res = await this.topsRepository.createTop({
          projectId: state.projectId,
          meetingId: state.meetingId,
          level,
          parentTopId: selectedTop.id,
          title: "(ohne Bezeichnung)",
        });
      } catch (err) {
        const error = err?.message ? String(err.message) : String(err || "create failed");
        this.store.setState({ error });
        return;
      }
      if (!res?.ok) {
        this.store.setState({ error: res?.error || "create failed" });
        return;
      }
      createdId = res?.top?.id || null;
      shouldFocusCreatedTop = !!createdId;
      await this._reloadTops({ keepSelection: true, selectTopId: createdId || null });
      this._syncScreenState();
    } finally {
      this.store.setState({ isWriting: false });
    }

    if (shouldFocusCreatedTop) {
      this._syncScreenState();
      await focusCreatedTopAfterReload({
        createdTopId: createdId,
        selectedTopId: this.store.getState().selectedTopId,
        topsListRoot: this.topsList?.root,
        workbench: this.workbench,
        awaitNextPaint: () => this._awaitNextPaint(),
      });
    }
  }

  async _reloadTops({ keepSelection = true, selectTopId = null } = {}) {
    const before = this.store.getState();
    const prevSelectedId = before.selectedTopId ?? null;

    const res = await this.commands.loadTops({
      meetingId: this.meetingId || before.meetingId || null,
      projectId: this.projectId || before.projectId || null,
    });

    const tops = Array.isArray(res?.list) ? res.list : [];
    let nextSelectedId = null;

    if (selectTopId !== null && selectTopId !== undefined) {
      nextSelectedId = tops.some((t) => String(t?.id) === String(selectTopId)) ? selectTopId : null;
    } else if (keepSelection && prevSelectedId !== null && prevSelectedId !== undefined) {
      nextSelectedId = tops.some((t) => String(t?.id) === String(prevSelectedId)) ? prevSelectedId : null;
    }

    this.commands.selectTop(nextSelectedId);
    const selectedTop = tops.find((t) => String(t?.id) === String(nextSelectedId ?? "")) || null;
    this.commands.updateDraft(editorFromTop(selectedTop));
    this.commands.toggleMoveMode(false);
    this.store.setState({
      meetingMeta: res?.meeting || null,
    });
  }

  _awaitNextPaint() {
    return new Promise((resolve) => {
      const raf =
        typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame.bind(window)
          : typeof requestAnimationFrame === "function"
            ? requestAnimationFrame
            : null;

      if (raf) {
        raf(() => resolve());
        return;
      }

      setTimeout(resolve, 0);
    });
  }

  async load() {
    await this._reloadTops({ keepSelection: true });
    this._syncScreenState();
  }

  // ---------------------------------------------------------------------------
  // Lebenszyklus / Uebergangsgrenze
  // ---------------------------------------------------------------------------

  async destroy() {
    await this.closeFlow?.destroy?.();
    this._showSidebar();
  }
}
