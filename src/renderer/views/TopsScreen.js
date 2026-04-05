import TopsView from "./TopsView.js";
import { createTopsStore } from "../tops/state/TopsStore.js";
import { getSelectedTop, hasSelection } from "../tops/state/TopsSelectors.js";
import { TopsRepository } from "../tops/data/TopsRepository.js";
import { TopsCommands } from "../tops/domain/TopsCommands.js";
import { TopsQuicklane } from "../tops/components/TopsQuicklane.js";
import { TopsWorkbench } from "../tops/components/TopsWorkbench.js";
import { TopsList } from "../tops/components/TopsList.js";
import { TopsHeader } from "../tops/components/TopsHeader.js";

const TOPS_V2_STYLE_TAG = "bbm-tops-v2-styles";

function ensureTopsV2Styles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[data-${TOPS_V2_STYLE_TAG}="true"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../tops/styles/tops.css", import.meta.url).href;
  link.setAttribute(`data-${TOPS_V2_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}

// TOPS-V2: eigenstaendiger Screen.
// LEGACY-REST: TopsView wird nur noch fuer den Output/Close-Flow als Bruecke gehalten.
export default class TopsScreen {
  constructor(options = {}) {
    this.router = options.router || null;
    this.projectId = options.projectId || null;
    this.meetingId = options.meetingId || null;

    this.root = null;
    this.header = null;
    this.sheetArea = null;
    this.sheetCanvas = null;
    this.sheetPaper = null;
    this.editArea = null;
    this.editCanvas = null;

    this._sidebarEl = null;
    this._sidebarDisplay = "";
    this.quicklane = null;
    this.workbench = null;
    this.topsList = null;

    this.topsRepository = options.topsRepository || new TopsRepository();
    this.store = createTopsStore({
      projectId: this.projectId,
      meetingId: this.meetingId,
      tops: [],
      selectedTopId: null,
      editor: {},
      isReadOnly: false,
      isMoveMode: false,
      isLoading: false,
      error: null,
      meetingMeta: null,
    });
    this.commands = new TopsCommands({
      store: this.store,
      repository: this.topsRepository,
    });

    // LEGACY-REST: nur fuer "Protokoll beenden"/Output-Flow.
    this._legacyBridge = new TopsView({
      ...options,
      topsRepository: this.topsRepository,
    });
  }

  render() {
    this._buildShell();
    this._hideSidebar();
    this._syncScreenState();
    return this.root;
  }

  _buildShell() {
    ensureTopsV2Styles();
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

    this._buildHeader();
    this._buildQuicklane();
    this._buildList();
    this._buildWorkbench();

    sheetCanvas.appendChild(sheetPaper);
    sheetArea.appendChild(sheetCanvas);
    editArea.appendChild(editCanvas);
    root.append(this.header.root, sheetArea, editArea);
  }

  _buildHeader() {
    this.header = new TopsHeader({
      onClose: async () => {
        if (typeof this.router?.showProjects === "function") {
          await this.router.showProjects();
        }
      },
      onEndMeeting: async () => {
        if (typeof this._legacyBridge?._runCloseMeetingOutputFlow === "function") {
          await this._legacyBridge._runCloseMeetingOutputFlow();
          await this._reloadTops({ keepSelection: true });
          this._syncScreenState();
        }
      },
    });
  }

  _buildQuicklane() {
    this.quicklane = new TopsQuicklane({
      projectId: this._getQuicklaneProjectId(),
      isReadOnly: !!this.store.getState().isReadOnly,
      onOpenProject: async (projectId) => {
        if (typeof this.router?.openProjectFormModal === "function") {
          await this.router.openProjectFormModal({ projectId });
        }
      },
      onOpenFirms: async (projectId) => {
        if (typeof this.router?.showProjectFirms === "function") {
          await this.router.showProjectFirms(projectId);
        }
      },
      onOpenOutput: async (projectId) => {
        if (typeof this.router?.openPrintModal === "function") {
          await this.router.openPrintModal({ projectId });
        }
      },
    });
    this._mountQuicklaneIntoHeader();
  }

  _buildList() {
    this.topsList = new TopsList({
      onRowClick: async (item) => this._handleListRowClick(item),
    });
    this.sheetPaper.appendChild(this.topsList.root);
  }

  _buildWorkbench() {
    this.workbench = new TopsWorkbench({
      onDraftChange: (draft) => this._handleWorkbenchDraftChange(draft),
      onSave: async () => this._handleWorkbenchSave(),
      onDelete: async () => this._handleWorkbenchDelete(),
      onToggleMove: async () => this._handleWorkbenchToggleMove(),
      onCreateLevel1: async () => this._handleWorkbenchCreateLevel1(),
      onCreateChild: async () => this._handleWorkbenchCreateChild(),
    });
    this.editCanvas.appendChild(this.workbench.root);
  }

  _mountQuicklaneIntoHeader() {
    const host = this.header?.getActionsHost?.();
    if (!(host instanceof HTMLElement)) return;
    if (!(this.quicklane instanceof TopsQuicklane)) return;
    this.quicklane.mountInto(host);
  }

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

  _syncQuicklaneState() {
    const state = this.store.getState();
    if (!(this.quicklane instanceof TopsQuicklane)) return;
    this.quicklane.update({
      projectId: this._getQuicklaneProjectId(),
      isReadOnly: !!state.isReadOnly,
    });
    this._mountQuicklaneIntoHeader();
  }

  _buildHeaderContext(state) {
    const m = state?.meetingMeta || null;
    const parts = [];
    const projectLine = String(this.router?.context?.projectLabel || "").trim();
    if (projectLine) parts.push(projectLine);

    const meetingNo = String(m?.meeting_number ?? m?.meetingNumber ?? "").trim();
    const meetingDate = String(m?.meeting_date ?? m?.meetingDate ?? "").trim();
    const meetingKeyword = String(m?.keyword || m?.meeting_keyword || "").trim();
    const meetingLine = [meetingNo, meetingDate].filter(Boolean).join(" - ");
    if (meetingLine) parts.push(meetingLine);
    if (meetingKeyword) parts.push(meetingKeyword);

    if (!parts.length) return state?.meetingId ? "Protokoll" : "kein Protokoll aktiv";
    return parts.join(" | ");
  }

  _syncHeaderState() {
    if (!(this.header instanceof TopsHeader)) return;
    const state = this.store.getState();
    this.header.update({
      title: "Protokoll",
      context: this._buildHeaderContext(state),
      isReadOnly: !!state.isReadOnly,
      canEndMeeting: !!state.meetingId,
      isBusy: !!state.isLoading,
    });
  }

  _buildListItemsFromState() {
    const state = this.store.getState();
    const tops = Array.isArray(state.tops) ? state.tops : [];
    const selectedId = state.selectedTopId;
    const selectedTop = getSelectedTop(state);
    const movingTop = state.isMoveMode ? selectedTop : null;
    const rows = [];

    for (const top of tops) {
      const due = (top?.due_date || top?.dueDate || "").toString().trim();
      const status = (top?.status || "").toString().trim();
      const responsible = (top?.responsible_label || top?.responsibleLabel || "").toString().trim();
      const meta = [];
      if (due) meta.push(`Fertig bis: ${due}`);
      if (status) meta.push(`Status: ${status}`);
      if (responsible) meta.push(`Verantw.: ${responsible}`);

      let isMoveTarget = null;
      if (state.isMoveMode && movingTop) {
        isMoveTarget = this._isAllowedMoveTarget(top, movingTop);
      }

      rows.push({
        id: top?.id,
        level: Number(top?.level) || 1,
        title: String(top?.title || ""),
        number: `${top?.displayNumber ?? top?.number ?? ""}.`,
        preview: String(top?.longtext || ""),
        meta,
        isSelected: String(top?.id) === String(selectedId ?? ""),
        isMoveMode: !!state.isMoveMode,
        isMoveTarget,
        raw: top,
      });
    }
    return rows;
  }

  _syncListState() {
    if (!(this.topsList instanceof TopsList)) return;
    this.topsList.setItems(this._buildListItemsFromState());
  }

  _hasChildren(topId) {
    const state = this.store.getState();
    const tops = Array.isArray(state.tops) ? state.tops : [];
    const key = String(topId ?? "");
    return tops.some((t) => String(t?.parent_top_id ?? "") === key);
  }

  _isBlue(top) {
    return Number(top?.is_carried_over) !== 1;
  }

  _isAllowedMoveTarget(target, movingTop) {
    if (!movingTop || !target) return false;
    if (String(target.id) === String(movingTop.id)) return false;
    const tl = Number(target.level);
    if (!Number.isFinite(tl)) return false;
    return tl >= 1 && tl <= 3;
  }

  async _handleListRowClick(item) {
    const top = item?.raw || null;
    if (!top) return;
    const state = this.store.getState();
    const movingTop = state.isMoveMode ? getSelectedTop(state) : null;

    if (state.isMoveMode && movingTop && !state.isReadOnly) {
      if (!item.isMoveTarget) return;
      await this.topsRepository.moveTop({
        topId: movingTop.id,
        targetParentId: top.id || null,
      });
      this.commands.toggleMoveMode(false);
      await this._reloadTops({ keepSelection: true, selectTopId: movingTop.id });
      this._syncScreenState();
      return;
    }

    this.commands.selectTop(top.id);
    this.commands.updateDraft(this._editorFromTop(top));
    this._syncScreenState();
  }

  _shouldShowWorkbench(state) {
    const selectedTop = getSelectedTop(state);
    const hasSelection = !!selectedTop;
    const hasMeeting = !!state?.meetingId;
    if (hasSelection) return true;
    if (!hasMeeting) return false;
    if (state?.isReadOnly) return false;
    return true;
  }

  _editorFromTop(top) {
    if (!top) {
      return {
        title: "",
        longtext: "",
        due_date: null,
        status: "-",
        responsible_label: "",
        is_important: 0,
        is_hidden: 0,
        is_decision: 0,
      };
    }
    return {
      title: String(top.title || ""),
      longtext: String(top.longtext || ""),
      due_date: top.due_date || top.dueDate || null,
      status: String(top.status || "-"),
      responsible_label: String(top.responsible_label || top.responsibleLabel || ""),
      is_important: Number(top.is_important) === 1 ? 1 : 0,
      is_hidden: Number(top.is_hidden) === 1 ? 1 : 0,
      is_decision: Number(top.is_decision) === 1 ? 1 : 0,
    };
  }

  _buildPatchFromDraft(selectedTop, draft) {
    if (!selectedTop || !draft) return {};
    const patch = {};

    const title = String(draft.title || "");
    if (title !== String(selectedTop.title || "")) patch.title = title;

    const longtext = String(draft.longtext || "");
    if (longtext !== String(selectedTop.longtext || "")) patch.longtext = longtext;

    const dueDate = (draft.due_date || null) || null;
    const selectedDue = (selectedTop.due_date || selectedTop.dueDate || null) || null;
    if (dueDate !== selectedDue) patch.due_date = dueDate;

    const status = String(draft.status || "-");
    if (status !== String(selectedTop.status || "-")) patch.status = status;

    const responsibleLabel = String(draft.responsible_label || "");
    if (responsibleLabel !== String(selectedTop.responsible_label || selectedTop.responsibleLabel || "")) {
      patch.responsible_label = responsibleLabel;
    }

    for (const k of ["is_important", "is_hidden", "is_decision"]) {
      const nextVal = Number(draft[k]) === 1 ? 1 : 0;
      const curVal = Number(selectedTop[k]) === 1 ? 1 : 0;
      if (nextVal !== curVal) patch[k] = nextVal;
    }

    return patch;
  }

  _canCreateChildFromState(state, selectedTop) {
    if (state.isReadOnly || !selectedTop) return false;
    const level = Number(selectedTop.level);
    return Number.isFinite(level) && level < 4;
  }

  _canDeleteFromState(state, selectedTop) {
    if (state.isReadOnly || !selectedTop) return false;
    if (!this._isBlue(selectedTop)) return false;
    if (this._hasChildren(selectedTop.id)) return false;
    return true;
  }

  _canMoveFromState(state, selectedTop) {
    if (state.isReadOnly || !selectedTop) return false;
    if (!this._isBlue(selectedTop)) return false;
    if (this._hasChildren(selectedTop.id)) return false;
    return true;
  }

  _syncWorkbenchState() {
    if (!(this.workbench instanceof TopsWorkbench)) return;
    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    this.workbench.setState({
      editor: state.editor || this._editorFromTop(selectedTop),
      isReadOnly: !!state.isReadOnly,
      hasSelection: !!selectedTop,
      isMoveMode: !!state.isMoveMode,
      canSave: !!selectedTop,
      canDelete: this._canDeleteFromState(state, selectedTop),
      canMove: this._canMoveFromState(state, selectedTop),
      canCreateChild: this._canCreateChildFromState(state, selectedTop),
    });
  }

  _syncScreenState() {
    const state = this.store.getState();
    this._syncHeaderState();
    this._syncQuicklaneState();
    this._syncListState();
    this._syncWorkbenchState();

    if (this.editArea) {
      this.editArea.dataset.bbmWorkbenchVisible = this._shouldShowWorkbench(state) ? "true" : "false";
      this.editArea.dataset.bbmHasSelection = hasSelection(state) ? "true" : "false";
    }
  }

  _handleWorkbenchDraftChange(draft) {
    this.commands.updateDraft(draft || {});
    this._syncWorkbenchState();
  }

  async _handleWorkbenchSave() {
    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    if (!selectedTop) return;
    const patch = this._buildPatchFromDraft(selectedTop, state.editor || {});
    if (!Object.keys(patch).length) return;
    await this.commands.saveDraft(patch);
    await this._reloadTops({ keepSelection: true, selectTopId: selectedTop.id });
    this._syncScreenState();
  }

  async _handleWorkbenchDelete() {
    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    if (!this._canDeleteFromState(state, selectedTop)) return;

    await this.commands.saveDraft({ is_hidden: 1 });
    await this.commands.deleteSelectedTop();
    await this._reloadTops({ keepSelection: false });
    this._syncScreenState();
  }

  async _handleWorkbenchToggleMove() {
    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    if (!state.isMoveMode && !this._canMoveFromState(state, selectedTop)) return;
    this.commands.toggleMoveMode();
    this._syncScreenState();
  }

  async _handleWorkbenchCreateLevel1() {
    const state = this.store.getState();
    if (state.isReadOnly || !state.meetingId || !state.projectId) return;

    const res = await this.topsRepository.createTop({
      projectId: state.projectId,
      meetingId: state.meetingId,
      level: 1,
      parentTopId: null,
      title: "(ohne Bezeichnung)",
    });
    const createdId = res?.top?.id || null;
    await this._reloadTops({ keepSelection: true, selectTopId: createdId || null });
    this._syncScreenState();
  }

  async _handleWorkbenchCreateChild() {
    const state = this.store.getState();
    const selectedTop = getSelectedTop(state);
    if (!this._canCreateChildFromState(state, selectedTop)) return;

    const level = Number(selectedTop.level) + 1;
    if (!Number.isFinite(level) || level > 4) return;

    const res = await this.topsRepository.createTop({
      projectId: state.projectId,
      meetingId: state.meetingId,
      level,
      parentTopId: selectedTop.id,
      title: "(ohne Bezeichnung)",
    });
    const createdId = res?.top?.id || null;
    await this._reloadTops({ keepSelection: true, selectTopId: createdId || null });
    this._syncScreenState();
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
    this.commands.updateDraft(this._editorFromTop(selectedTop));
    this.commands.toggleMoveMode(false);
    this.store.setState({
      meetingMeta: res?.meeting || null,
    });
  }

  async load() {
    await this._reloadTops({ keepSelection: true });
    this._syncScreenState();
  }

  async destroy() {
    if (typeof this._legacyBridge?.destroy === "function") {
      await this._legacyBridge.destroy();
    }
    this._showSidebar();
  }
}
