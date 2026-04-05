import TopsView from "./TopsView.js";
import { createTopsStore } from "../tops/state/TopsStore.js";
import { hasSelection, isEditable } from "../tops/state/TopsSelectors.js";

// TOPS-V2: offizieller Einstiegspunkt fuer Tops-UI.
// LEGACY-BOUNDARY: fachliche Bestandslogik bleibt bis zur v2-Ablosung in TopsView.
export default class TopsScreen {
  constructor(options = {}) {
    this.router = options.router || null;
    this.projectId = options.projectId || null;
    this.meetingId = options.meetingId || null;

    this.root = null;
    this.sheetArea = null;
    this.sheetCanvas = null;
    this.sheetPaper = null;
    this.editArea = null;
    this.editCanvas = null;
    this.quicklaneButtons = [];

    this._sidebarEl = null;
    this._sidebarDisplay = "";
    this.store = createTopsStore({
      projectId: this.projectId,
      meetingId: this.meetingId,
    });

    // LEGACY-BOUNDARY: delegiert derzeit vollstaendig an TopsView (Legacy).
    // REMOVE-IN-PHASE-X: ersetzen, sobald v2-Implementierung fachlich bereit ist.
    this._legacy = new TopsView(options);
    this._wrapLegacyHooks();

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);
        const value = target._legacy?.[prop];
        return typeof value === "function" ? value.bind(target._legacy) : value;
      },
      set: (target, prop, value, receiver) => {
        if (Reflect.has(target, prop)) return Reflect.set(target, prop, value, receiver);
        if (target._legacy && prop in target._legacy) {
          target._legacy[prop] = value;
          return true;
        }
        return Reflect.set(target, prop, value, receiver);
      },
    });
  }

  _wrapLegacyHooks() {
    // LEGACY-BOUNDARY: Hook-Wrapping ist reine Uebergangsverdrahtung.
    // REMOVE-IN-PHASE-X: entfällt mit nativen TopsScreen-v2 Hooks.
    const legacy = this._legacy;

    const applyReadOnlyState = legacy._applyReadOnlyState?.bind(legacy);
    if (applyReadOnlyState) {
      legacy._applyReadOnlyState = (...args) => {
        const res = applyReadOnlyState(...args);
        this._syncScreenState();
        return res;
      };
    }

    const renderIdleState = legacy._renderIdleState?.bind(legacy);
    if (renderIdleState) {
      legacy._renderIdleState = (...args) => {
        const res = renderIdleState(...args);
        this._syncScreenState();
        return res;
      };
    }

    const renderListOnly = legacy._renderListOnly?.bind(legacy);
    if (renderListOnly) {
      legacy._renderListOnly = (...args) => {
        const res = renderListOnly(...args);
        this._polishSheetList();
        return res;
      };
    }

    const applyEditBoxState = legacy.applyEditBoxState?.bind(legacy);
    if (applyEditBoxState) {
      legacy.applyEditBoxState = (...args) => {
        const res = applyEditBoxState(...args);
        this._polishEditWorkbench();
        return res;
      };
    }

    const updateTopBarProtocolTitle = legacy._updateTopBarProtocolTitle?.bind(legacy);
    if (updateTopBarProtocolTitle) {
      legacy._updateTopBarProtocolTitle = (...args) => {
        const res = updateTopBarProtocolTitle(...args);
        this._compactWorkingTopBar();
        return res;
      };
    }
  }

  render() {
    // LEGACY-BOUNDARY: Shell ist v2-Rahmen; Inhalt kommt aktuell noch aus Legacy-Renderbaum.
    const legacyRoot = this._legacy.render();
    this._buildShell();
    this._detachLegacyPinnedLayout();
    this._mountLegacyAreas(legacyRoot);
    this._hideSidebar();
    this._syncScreenState();
    this._enforceShellLayout(10);
    return this.root;
  }

  _buildShell() {
    const root = document.createElement("div");
    root.setAttribute("data-bbm-tops-screen", "true");
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.height = "100%";
    root.style.minHeight = "0";
    root.style.background = "linear-gradient(180deg, #f6f9fc 0%, #eef3f8 100%)";

    const sheetArea = document.createElement("section");
    sheetArea.setAttribute("data-bbm-tops-screen-area", "sheet");
    sheetArea.style.flex = "1 1 auto";
    sheetArea.style.minHeight = "0";
    sheetArea.style.overflow = "auto";
    sheetArea.style.padding = "12px 14px 14px";
    sheetArea.style.background = "transparent";

    const sheetCanvas = document.createElement("div");
    sheetCanvas.setAttribute("data-bbm-tops-screen-sheet-canvas", "true");
    sheetCanvas.style.width = "100%";
    sheetCanvas.style.maxWidth = "1280px";
    sheetCanvas.style.minHeight = "100%";
    sheetCanvas.style.margin = "0 auto";
    sheetCanvas.style.display = "flex";
    sheetCanvas.style.flexDirection = "column";

    const sheetPaper = document.createElement("div");
    sheetPaper.setAttribute("data-bbm-tops-screen-sheet-paper", "true");
    sheetPaper.style.width = "100%";
    sheetPaper.style.minHeight = "100%";
    sheetPaper.style.background = "#ffffff";
    sheetPaper.style.border = "1px solid #dce6f2";
    sheetPaper.style.borderRadius = "12px";
    sheetPaper.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.08)";
    sheetPaper.style.padding = "8px 12px 12px";
    sheetPaper.style.boxSizing = "border-box";

    const editArea = document.createElement("section");
    editArea.setAttribute("data-bbm-tops-screen-area", "edit");
    editArea.style.flex = "0 0 auto";
    editArea.style.borderTop = "1px solid #d9e2ec";
    editArea.style.background = "linear-gradient(180deg, #f8fbff 0%, #f2f7fd 100%)";
    editArea.style.padding = "6px 10px 8px";

    const editCanvas = document.createElement("div");
    editCanvas.setAttribute("data-bbm-tops-screen-edit-canvas", "true");
    editCanvas.style.width = "100%";
    editCanvas.style.maxWidth = "1280px";
    editCanvas.style.margin = "0 auto";

    this.root = root;
    this.sheetArea = sheetArea;
    this.sheetCanvas = sheetCanvas;
    this.sheetPaper = sheetPaper;
    this.editArea = editArea;
    this.editCanvas = editCanvas;

    sheetCanvas.appendChild(sheetPaper);
    sheetArea.appendChild(sheetCanvas);
    editArea.appendChild(editCanvas);
    root.append(sheetArea, editArea);

    this._buildQuicklane();
  }

  _buildQuicklane() {
    const mkButton = (label, onClick) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.padding = "1px 8px";
      btn.style.minHeight = "0";
      btn.style.fontSize = "8pt";
      btn.style.lineHeight = "1.2";
      btn.style.borderRadius = "6px";
      btn.onclick = onClick;
      return btn;
    };

    const btnProject = mkButton("Projekt", async () => {
      const pid = this.store.getState().projectId || this.router?.currentProjectId || null;
      if (!pid) return;
      if (typeof this.router?.openProjectFormModal === "function") {
        await this.router.openProjectFormModal({ projectId: pid });
      }
    });

    const btnFirms = mkButton("Firmen", async () => {
      const pid = this.store.getState().projectId || this.router?.currentProjectId || null;
      if (!pid) return;
      if (typeof this.router?.showProjectFirms === "function") {
        await this.router.showProjectFirms(pid);
      }
    });

    const btnOutput = mkButton("Ausgabe", async () => {
      const pid = this.store.getState().projectId || this.router?.currentProjectId || null;
      if (!pid) return;
      if (typeof this.router?.openPrintModal === "function") {
        await this.router.openPrintModal({ projectId: pid });
      }
    });

    this.quicklaneButtons = [btnProject, btnFirms, btnOutput];
  }

  _detachLegacyPinnedLayout() {
    const legacy = this._legacy;

    if (legacy._fixedResizeObs) {
      try {
        legacy._fixedResizeObs.disconnect();
      } catch (_e) {
        // ignore
      }
      legacy._fixedResizeObs = null;
    }

    if (legacy._fixedHorzResizeObs) {
      try {
        legacy._fixedHorzResizeObs.disconnect();
      } catch (_e) {
        // ignore
      }
      legacy._fixedHorzResizeObs = null;
    }

    legacy._syncPinnedBars = () => {};
    legacy._syncPinnedHorizontal = () => {};
  }

  _mountLegacyAreas(legacyRoot) {
    const topBar = this._legacy.topBarEl;
    const list = this._legacy.listEl;
    const box = this._legacy.box;

    if (topBar) {
      topBar.style.position = "static";
      topBar.style.top = "";
      topBar.style.left = "";
      topBar.style.right = "";
      topBar.style.height = "auto";
      topBar.style.minHeight = "30px";
      topBar.style.maxHeight = "none";
      topBar.style.padding = "1px 2px 1px";
      topBar.style.gap = "6px";
      topBar.style.margin = "0";
      topBar.style.overflowY = "visible";
      topBar.style.borderBottom = "0";
      topBar.style.boxShadow = "none";
      topBar.style.background = "transparent";

      if (this._legacy.topsTitleEl instanceof HTMLElement) {
        this._legacy.topsTitleEl.style.lineHeight = "1.05";
        this._legacy.topsTitleEl.style.paddingRight = "4px";
      }

      this.root.insertBefore(topBar, this.sheetArea);
      this._mountQuicklaneIntoTopBar();
      this._compactWorkingTopBar();
    }

    if (list) {
      list.style.margin = "0";
      list.style.paddingTop = "10px";
      list.style.paddingBottom = "12px";
      list.style.paddingLeft = "0";
      this.sheetPaper.appendChild(list);
    }

    if (box) {
      box.style.position = "static";
      box.style.left = "";
      box.style.right = "";
      box.style.bottom = "";
      box.style.maxHeight = "none";
      box.style.overflow = "visible";
      box.style.padding = "6px 8px 8px";
      box.style.borderLeft = "0";
      box.style.borderRight = "0";
      box.style.margin = "0";
      this.editCanvas.appendChild(box);
    }

    if (legacyRoot && legacyRoot.parentElement) {
      legacyRoot.parentElement.removeChild(legacyRoot);
    }

    this._legacy.root = this.root;
  }

  _mountQuicklaneIntoTopBar() {
    const topBar = this._legacy.topBarEl;
    if (!(topBar instanceof HTMLElement)) return;
    if (!Array.isArray(this.quicklaneButtons) || !this.quicklaneButtons.length) return;

    const actionWrap = Array.from(topBar.children || []).find(
      (el) => el instanceof HTMLElement && el.contains?.(this._legacy.btnCloseMeeting)
    );
    if (!(actionWrap instanceof HTMLElement)) return;

    const [btnProject, btnFirms, btnOutput] = this.quicklaneButtons;
    for (const btn of [btnProject, btnFirms, btnOutput]) {
      if (!(btn instanceof HTMLElement)) continue;
      btn.style.padding = "1px 7px";
      btn.style.minHeight = "0";
      btn.style.fontSize = "7.5pt";
      btn.style.lineHeight = "1.15";
      btn.style.borderRadius = "6px";
      if (btn.parentElement !== actionWrap) {
        actionWrap.insertBefore(btn, actionWrap.firstChild || null);
      }
    }
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

  _syncQuicklaneState() {
    const state = this.store.getState();
    const canUseProject = !!(state.projectId || this.router?.currentProjectId);
    const editable = isEditable(state);
    const [btnProject, btnFirms, btnOutput] = this.quicklaneButtons;

    const setState = (btn, enabled) => {
      if (!btn) return;
      btn.disabled = !enabled;
      btn.style.opacity = btn.disabled ? "0.55" : "1";
      btn.style.cursor = btn.disabled ? "default" : "pointer";
    };

    setState(btnProject, canUseProject && editable);
    setState(btnFirms, canUseProject && editable);
    setState(btnOutput, canUseProject);
  }

  _syncTopMetaSlot() {
    const topMeta = this._legacy.topMetaEl;
    if (!(topMeta instanceof HTMLElement)) return;

    topMeta.style.flex = "0 0 0px";
    topMeta.style.width = "0";
    topMeta.style.paddingLeft = "0";
    topMeta.style.marginLeft = "0";
    topMeta.style.overflow = "hidden";
  }

  _compactWorkingTopBar() {
    const topBar = this._legacy.topBarEl;
    if (!(topBar instanceof HTMLElement)) return;
    topBar.style.alignItems = "center";
    this._mountQuicklaneIntoTopBar();

    const actionWrap = Array.from(topBar.children || []).find(
      (el) => el instanceof HTMLElement && el.contains?.(this._legacy.btnCloseMeeting)
    );
    if (actionWrap instanceof HTMLElement) {
      actionWrap.style.marginRight = "0";
      actionWrap.style.gap = "4px";
      actionWrap.style.display = "inline-flex";
      actionWrap.style.alignItems = "center";
      actionWrap.style.justifyContent = "center";
      const actionButtons = Array.from(actionWrap.querySelectorAll("button"));
      for (const btn of actionButtons) {
        if (!(btn instanceof HTMLElement)) continue;
        btn.style.minHeight = "0";
        btn.style.padding = "1px 6px";
        btn.style.fontSize = "7.5pt";
        btn.style.lineHeight = "1.15";
        btn.style.display = "inline-flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
      }
    }

    const title = this._legacy.topsTitleEl;
    if (title instanceof HTMLElement) {
      title.style.margin = "0";
      title.style.padding = "0 3px 0 0";
      title.style.maxHeight = "30px";
      title.style.overflow = "visible";
      title.style.gap = "0";
      title.style.display = "grid";
      title.style.gridTemplateColumns = "auto auto";
      title.style.columnGap = "6px";
      title.style.rowGap = "1px";
      title.style.alignItems = "center";
      title.style.lineHeight = "1";

      const lines = Array.from(title.children || []);
      if (lines[0] instanceof HTMLElement) {
        lines[0].style.margin = "0";
        lines[0].style.fontSize = "8pt";
        lines[0].style.lineHeight = "1";
        lines[0].style.gridColumn = "1";
        lines[0].style.gridRow = "1";
      }
      if (lines[1] instanceof HTMLElement) {
        lines[1].style.margin = "0";
        lines[1].style.fontSize = "8pt";
        lines[1].style.lineHeight = "1";
        lines[1].style.gridColumn = "2";
        lines[1].style.gridRow = "1";
        const line1Children = Array.from(lines[1].children || []);
        for (const child of line1Children) {
          if (!(child instanceof HTMLElement)) continue;
          child.style.fontSize = "8pt";
          child.style.lineHeight = "1";
        }
      }
      if (lines[2] instanceof HTMLElement) {
        lines[2].style.display = "";
        lines[2].style.margin = "0";
        lines[2].style.fontSize = "8pt";
        lines[2].style.lineHeight = "1";
        lines[2].style.gridColumn = "1 / span 2";
        lines[2].style.gridRow = "2";
      }
      for (let i = 3; i < lines.length; i += 1) {
        if (lines[i] instanceof HTMLElement) lines[i].style.display = "none";
      }
    }
  }

  _inferLevelFromRow(row) {
    const numLabel = row?.firstElementChild?.querySelector("span");
    const raw = String(numLabel?.textContent || "")
      .trim()
      .replace(/\.$/, "");
    if (!raw) return 1;
    const parts = raw.split(".").filter(Boolean);
    if (!parts.length) return 1;
    return Math.max(1, Math.min(4, parts.length));
  }

  _polishSheetList() {
    const list = this._legacy.listEl;
    if (!list) return;

    for (const node of Array.from(list.children || [])) {
      if (!(node instanceof HTMLElement)) continue;

      if (node.tagName !== "LI") {
        node.style.margin = "24px auto";
        node.style.maxWidth = "620px";
        node.style.padding = "18px 14px";
        node.style.border = "1px dashed #d5e0ec";
        node.style.borderRadius = "12px";
        node.style.background = "#fcfdff";
        continue;
      }

      const li = node;
      const row = li.firstElementChild;
      if (!(row instanceof HTMLElement)) continue;

      const level = this._inferLevelFromRow(row);
      const isSelected = String(li.style.border || "").includes("#7aa7ff");
      const isMarked = String(li.style.border || "").includes("#f9a825");
      const inMoveMode = !!this._legacy.moveModeActive;

      const indent = Math.max(0, level - 1) * 12;
      li.style.margin = "6px 0";
      li.style.marginLeft = `${indent}px`;
      li.style.padding = "8px 10px";
      li.style.borderRadius = "10px";
      li.style.transition = "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease";

      if (!inMoveMode) {
        const baseBg = level === 1 ? "#f7fafc" : "#ffffff";
        if (!isSelected && !isMarked) {
          li.style.background = baseBg;
          li.style.border = "1px solid #dfe7f1";
          li.style.boxShadow = "none";
        }
        if (isSelected && !isMarked) {
          li.style.background = "#eaf3ff";
          li.style.border = "1px solid #7aa7ff";
          li.style.boxShadow = "0 0 0 2px rgba(122, 167, 255, 0.16)";
        }
      }

      row.style.alignItems = "stretch";
      row.style.gap = "12px";

      const numBlock = row.children[0];
      if (numBlock instanceof HTMLElement) {
        numBlock.style.alignSelf = "stretch";
        numBlock.style.paddingTop = "1px";
        numBlock.style.paddingRight = "8px";
        numBlock.style.borderRight = "1px solid #edf2f7";
        numBlock.style.opacity = level === 1 ? "0.95" : "0.88";
      }

      const textCol = row.children[1];
      if (textCol instanceof HTMLElement) {
        textCol.style.paddingTop = "1px";
        const titleLine = textCol.firstElementChild;
        if (titleLine instanceof HTMLElement) {
          titleLine.style.whiteSpace = "normal";
          titleLine.style.overflow = "visible";
          titleLine.style.textOverflow = "clip";
          titleLine.style.lineHeight = "1.35";
          titleLine.style.fontWeight = level === 1 ? "700" : isSelected ? "700" : "600";
        }
        const longPreview = textCol.children[1];
        if (longPreview instanceof HTMLElement) {
          longPreview.style.marginTop = "2px";
          longPreview.style.padding = "6px 8px";
          longPreview.style.borderRadius = "7px";
          longPreview.style.border = "1px solid #e3ebf5";
          longPreview.style.background = "#f6f9fc";
          longPreview.style.lineHeight = "1.4";
          longPreview.style.opacity = "0.96";
        }
      }

      const metaCol = row.children[2];
      if (metaCol instanceof HTMLElement) {
        metaCol.style.borderLeft = "1px solid #edf2f7";
        metaCol.style.paddingLeft = "10px";
        metaCol.style.marginLeft = "4px";
      }
    }
  }

  _styleWorkbenchButton(btn, tone) {
    if (!(btn instanceof HTMLElement)) return;
    btn.style.borderRadius = "6px";
    btn.style.padding = "1px 7px";
    btn.style.minHeight = "20px";
    btn.style.fontSize = "7.5pt";
    btn.style.lineHeight = "1.2";
    btn.style.fontWeight = "600";
    if (tone === "primary") {
      btn.style.background = "#2f6fb7";
      btn.style.color = "#ffffff";
      btn.style.border = "1px solid #285f9b";
      return;
    }
    if (tone === "danger") {
      btn.style.background = "#fff4e6";
      btn.style.color = "#8a4b00";
      btn.style.border = "1px solid #e7bf84";
      return;
    }
    btn.style.background = "#f5f8fc";
    btn.style.color = "#1f344a";
    btn.style.border = "1px solid #d3dfec";
  }

  _polishEditWorkbench() {
    const box = this._legacy.box;
    if (!(box instanceof HTMLElement)) return;

    box.style.background = "#ffffff";
    box.style.border = "1px solid #d5e1ee";
    box.style.borderRadius = "10px";
    box.style.boxShadow = "0 6px 14px rgba(15, 23, 42, 0.07)";
    box.style.padding = "4px 6px 6px";

    const boxHeader = box.children[0];
    const editorRow = box.children[1];
    if (!(boxHeader instanceof HTMLElement) || !(editorRow instanceof HTMLElement)) return;

    boxHeader.style.display = "flex";
    boxHeader.style.flexWrap = "wrap";
    boxHeader.style.alignItems = "center";
    boxHeader.style.gap = "4px";
    boxHeader.style.marginBottom = "4px";
    boxHeader.style.paddingBottom = "4px";
    boxHeader.style.borderBottom = "1px solid #e4ebf4";

    const boxTitle = boxHeader.children[0];
    const addActions = boxHeader.children[1];
    const headerActions = boxHeader.children[2];

    if (boxTitle instanceof HTMLElement) {
      boxTitle.style.color = "#154570";
      boxTitle.style.fontWeight = "700";
      boxTitle.style.fontSize = "8.5pt";
      boxTitle.style.minWidth = "unset";
      boxTitle.style.maxWidth = "unset";
      boxTitle.style.flex = "1 1 220px";
      boxTitle.style.padding = "1px 2px 1px 0";
    }

    if (addActions instanceof HTMLElement) {
      addActions.style.marginLeft = "0";
      addActions.style.display = "inline-flex";
      addActions.style.alignItems = "center";
      addActions.style.flexWrap = "wrap";
      addActions.style.gap = "3px";
      addActions.style.padding = "1px 5px";
      addActions.style.background = "#f7fbff";
      addActions.style.border = "1px solid #d9e6f3";
      addActions.style.borderRadius = "999px";
      this._styleWorkbenchButton(this._legacy.btnL1, "neutral");
      this._styleWorkbenchButton(this._legacy.btnChild, "neutral");
    }

    if (headerActions instanceof HTMLElement) {
      headerActions.style.marginLeft = "auto";
      headerActions.style.display = "inline-flex";
      headerActions.style.alignItems = "center";
      headerActions.style.flexWrap = "wrap";
      headerActions.style.gap = "3px";
      headerActions.style.padding = "1px 5px";
      headerActions.style.background = "#f7fbff";
      headerActions.style.border = "1px solid #d9e6f3";
      headerActions.style.borderRadius = "999px";
      this._styleWorkbenchButton(this._legacy.btnMove, "neutral");
      this._styleWorkbenchButton(this._legacy.btnSaveTop, "primary");
      this._styleWorkbenchButton(this._legacy.btnTrashTop, "danger");
    }

    editorRow.style.display = "grid";
    editorRow.style.gridTemplateColumns = "minmax(0, 1fr) 1px minmax(220px, 240px)";
    editorRow.style.alignItems = "stretch";
    editorRow.style.gap = "6px";

    const leftCol = editorRow.children[0];
    const sep = editorRow.children[1];
    const metaCol = editorRow.children[2];

    if (leftCol instanceof HTMLElement) {
      leftCol.style.gap = "4px";
      leftCol.style.minWidth = "0";
      const titleWrap = leftCol.children[0];
      const longWrap = leftCol.children[1];

      if (titleWrap instanceof HTMLElement) {
        titleWrap.style.padding = "4px 6px";
        titleWrap.style.border = "1px solid #dce7f2";
        titleWrap.style.borderRadius = "10px";
        titleWrap.style.background = "#fbfdff";
      }
      if (longWrap instanceof HTMLElement) {
        longWrap.style.marginTop = "0";
        longWrap.style.padding = "4px 6px";
        longWrap.style.border = "1px solid #dce7f2";
        longWrap.style.borderRadius = "10px";
        longWrap.style.background = "#fbfdff";
      }
    }

    if (sep instanceof HTMLElement) {
      sep.style.width = "1px";
      sep.style.margin = "0";
      sep.style.background = "#d9e4ef";
    }

    if (metaCol instanceof HTMLElement) {
      metaCol.style.flex = "1 1 auto";
      metaCol.style.width = "auto";
      metaCol.style.minWidth = "200px";
      metaCol.style.maxWidth = "none";
      metaCol.style.padding = "4px 6px";
      metaCol.style.border = "1px solid #dce7f2";
      metaCol.style.borderRadius = "10px";
      metaCol.style.background = "#f8fbff";
      metaCol.style.gap = "4px";

      if (!metaCol.querySelector('[data-bbm-workbench-meta-title="true"]')) {
        const metaTitle = document.createElement("div");
        metaTitle.setAttribute("data-bbm-workbench-meta-title", "true");
        metaTitle.textContent = "Metaspalte";
        metaTitle.style.fontSize = "8pt";
        metaTitle.style.fontWeight = "700";
        metaTitle.style.color = "#234d72";
        metaTitle.style.marginBottom = "1px";
        metaCol.prepend(metaTitle);
      }

      for (const field of Array.from(metaCol.children || [])) {
        if (!(field instanceof HTMLElement)) continue;
        if (field.getAttribute("data-bbm-workbench-meta-title") === "true") continue;
        field.style.padding = "3px 4px";
        field.style.border = "1px solid #d9e4ef";
        field.style.borderRadius = "8px";
        field.style.background = "#ffffff";

        for (const control of Array.from(field.querySelectorAll("input, select"))) {
          if (!(control instanceof HTMLElement)) continue;
          control.style.marginLeft = "0";
          control.style.width = "100%";
          control.style.boxSizing = "border-box";
        }
      }
    }

    if (window.innerWidth < 1120) {
      editorRow.style.gridTemplateColumns = "minmax(0, 1fr)";
      if (sep instanceof HTMLElement) sep.style.display = "none";
      if (metaCol instanceof HTMLElement) {
        metaCol.style.minWidth = "0";
      }
    } else if (sep instanceof HTMLElement) {
      sep.style.display = "";
    }

    const inpTitle = this._legacy.inpTitle;
    if (inpTitle instanceof HTMLElement) {
      inpTitle.style.width = "100%";
      inpTitle.style.boxSizing = "border-box";
      inpTitle.style.padding = "3px 5px";
      inpTitle.style.border = "1px solid #cad8e6";
      inpTitle.style.borderRadius = "7px";
      inpTitle.style.background = "#ffffff";
      inpTitle.style.fontSize = "8.5pt";
    }

    const taLong = this._legacy.taLongtext;
    if (taLong instanceof HTMLElement) {
      taLong.style.width = "100%";
      taLong.style.boxSizing = "border-box";
      taLong.style.padding = "4px 5px";
      taLong.style.border = "1px solid #cad8e6";
      taLong.style.borderRadius = "7px";
      taLong.style.background = "#ffffff";
      taLong.style.minHeight = "64px";
      taLong.style.resize = "vertical";
      taLong.style.lineHeight = "1.35";
      taLong.style.fontSize = "8.5pt";
    }

    this._styleWorkbenchButton(this._legacy.btnTitleDictate, "neutral");
    this._styleWorkbenchButton(this._legacy.btnLongDictate, "neutral");
  }

  _syncScreenState() {
    const list = this._legacy.listEl;
    const box = this._legacy.box;
    const hasVisibleBox = !!box && box.style.display !== "none";
    this._syncStoreFromLegacy({
      editor: {
        ...this._readEditorState(),
        hasVisibleBox,
      },
    });

    if (list) {
      list.style.paddingTop = "10px";
      list.style.paddingBottom = "12px";
      this._polishSheetList();
    }

    this._polishEditWorkbench();

    if (this.editArea) {
      this.editArea.style.display = hasVisibleBox ? "" : "none";
    }

    this._syncQuicklaneState();
    this._syncTopMetaSlot();
    this._compactWorkingTopBar();

    if (this.editArea) {
      const state = this.store.getState();
      this.editArea.dataset.bbmHasSelection = hasSelection(state) ? "true" : "false";
    }
  }

  _enforceShellLayout(steps) {
    if (steps <= 0) return;
    requestAnimationFrame(() => {
      this._syncScreenState();
      this._enforceShellLayout(steps - 1);
    });
  }

  async load() {
    this.store.setState({ isLoading: true, error: null });
    if (typeof this._legacy.load === "function") {
      try {
        await this._legacy.load();
      } catch (err) {
        this.store.setState({
          isLoading: false,
          error: err?.message ? String(err.message) : String(err || "Load failed"),
        });
        throw err;
      }
    }
    this._syncStoreFromLegacy({ isLoading: false, error: null });
    this._syncScreenState();
  }

  async destroy() {
    if (typeof this._legacy.destroy === "function") {
      await this._legacy.destroy();
    }
    this._showSidebar();
  }

  _readEditorState() {
    return {
      title: String(this._legacy?.inpTitle?.value || ""),
      longtext: String(this._legacy?.taLongtext?.value || ""),
    };
  }

  _syncStoreFromLegacy(partial = {}) {
    const legacy = this._legacy;
    const state = this.store.getState();
    this.store.setState({
      projectId: legacy?.projectId || this.projectId || null,
      meetingId: legacy?.meetingId || this.meetingId || null,
      tops: Array.isArray(legacy?.items) ? legacy.items : [],
      selectedTopId: legacy?.selectedTopId ?? null,
      editor: {
        ...state.editor,
        ...this._readEditorState(),
      },
      isReadOnly: !!legacy?.isReadOnly,
      isMoveMode: !!legacy?.moveModeActive,
      ...partial,
    });
  }
}
