import { getTopFilterBadge, getTopFilterLabel, normalizeTopFilterMode } from "../../modules/protokoll/topFilterMode.js";

const FILTER_OPTIONS = Object.freeze([
  { mode: "all", label: "Alle" },
  { mode: "todo", label: "ToDo" },
  { mode: "decision", label: "Beschluss" },
]);

export class TopsQuicklane {
  constructor({
    projectId = null,
    isReadOnly = false,
    isWriting = false,
    topFilter = "all",
    onFilterChange = null,
  } = {}) {
    this.projectId = projectId || null;
    this.isReadOnly = !!isReadOnly;
    this.isWriting = !!isWriting;
    this._filterMode = normalizeTopFilterMode(topFilter);
    this.onFilterChange = typeof onFilterChange === "function" ? onFilterChange : null;
    this._filterMenuOpen = false;

    this.root = document.createElement("div");
    this.root.className = "bbm-tops-quicklane-wrap";
    this.root.style.position = "relative";
    this.root.style.display = "inline-flex";
    this.root.style.alignItems = "center";

    this.btnFilter = this._mkButton();
    this.filterMenu = this._buildFilterMenu();
    this.root.append(this.btnFilter, this.filterMenu);

    this._docMouseDown = (e) => {
      if (!this._filterMenuOpen) return;
      if (this.root.contains(e.target)) return;
      this._setFilterMenuOpen(false);
    };
    document.addEventListener("mousedown", this._docMouseDown, true);

    this.update({ projectId, isReadOnly, isWriting, topFilter: this._filterMode });
  }

  _mkButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bbm-tops-btn bbm-tops-quicklane-btn";
    btn.dataset.quicklaneAction = "top-filter";
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      this._setFilterMenuOpen(!this._filterMenuOpen);
    });
    this._renderButtonContent(btn);
    return btn;
  }

  _renderButtonContent(btn = this.btnFilter) {
    if (!(btn instanceof HTMLElement)) return;
    btn.replaceChildren();

    const iconWrap = document.createElement("span");
    iconWrap.style.position = "relative";
    iconWrap.style.display = "inline-flex";
    iconWrap.style.alignItems = "center";
    iconWrap.style.justifyContent = "center";
    iconWrap.style.width = "18px";
    iconWrap.style.height = "18px";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.style.width = "16px";
    svg.style.height = "16px";
    svg.style.display = "block";

    const funnel = document.createElementNS("http://www.w3.org/2000/svg", "path");
    funnel.setAttribute(
      "d",
      "M3 5h18l-7 8v5l-4 2v-7L3 5z"
    );
    funnel.setAttribute("fill", "currentColor");
    svg.appendChild(funnel);

    const badge = document.createElement("span");
    badge.className = "bbm-tops-quicklane-filter-badge";
    badge.textContent = getTopFilterBadge(this._filterMode);
    badge.style.position = "absolute";
    badge.style.right = "-3px";
    badge.style.bottom = "-3px";
    badge.style.width = "10px";
    badge.style.height = "10px";
    badge.style.borderRadius = "999px";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.fontSize = "7px";
    badge.style.lineHeight = "1";
    badge.style.fontWeight = "800";
    badge.style.background = "#ffffff";
    badge.style.color = "#1d4ed8";
    badge.style.border = "1px solid currentColor";

    iconWrap.append(svg, badge);
    btn.append(iconWrap);
    btn.title = `TOP-Filter: ${getTopFilterLabel(this._filterMode)}`;
    btn.setAttribute("aria-label", `TOP-Filter: ${getTopFilterLabel(this._filterMode)}`);
  }

  _buildFilterMenu() {
    const menu = document.createElement("div");
    menu.className = "bbm-tops-quicklane-filter-menu";
    menu.style.position = "absolute";
    menu.style.top = "calc(100% + 4px)";
    menu.style.right = "0";
    menu.style.minWidth = "160px";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "0";
    menu.style.padding = "4px";
    menu.style.border = "1px solid var(--card-border)";
    menu.style.borderRadius = "8px";
    menu.style.background = "var(--card-bg)";
    menu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
    menu.style.zIndex = "40";

    for (const option of FILTER_OPTIONS) {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = option.label;
      item.dataset.filterMode = option.mode;
      item.style.display = "block";
      item.style.width = "100%";
      item.style.textAlign = "left";
      item.style.border = "none";
      item.style.background = "transparent";
      item.style.color = "var(--text-main)";
      item.style.padding = "8px 10px";
      item.style.borderRadius = "6px";
      item.style.minHeight = "30px";
      item.style.cursor = "pointer";
      item.onmouseenter = () => {
        if (item.disabled) return;
        item.style.background = "var(--btn-outline-hover-bg)";
      };
      item.onmouseleave = () => {
        item.style.background = "transparent";
      };
      item.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.disabled) return;
        this._setFilterMode(option.mode);
        this._setFilterMenuOpen(false);
        if (this.onFilterChange) {
          await this.onFilterChange(this._filterMode);
        }
      };
      menu.appendChild(item);
    }

    return menu;
  }

  _setFilterMenuOpen(nextOpen) {
    this._filterMenuOpen = !!nextOpen;
    if (this.filterMenu) {
      this.filterMenu.style.display = this._filterMenuOpen ? "flex" : "none";
    }
  }

  _setFilterMode(mode) {
    this._filterMode = normalizeTopFilterMode(mode);
    this._renderButtonContent();
    this._syncMenuState();
  }

  _syncMenuState() {
    if (!this.filterMenu) return;
    const items = Array.from(this.filterMenu.querySelectorAll("button[data-filter-mode]"));
    for (const item of items) {
      const active = String(item.dataset.filterMode || "") === this._filterMode;
      item.dataset.active = active ? "true" : "false";
      item.style.fontWeight = active ? "700" : "600";
      item.style.background = active ? "rgba(30, 64, 175, 0.08)" : "transparent";
    }
  }

  getButtons() {
    return [this.root];
  }

  update({ projectId, isReadOnly, isWriting, topFilter } = {}) {
    this.projectId = projectId || null;
    this.isReadOnly = !!isReadOnly;
    this.isWriting = !!isWriting;
    this._filterMode = normalizeTopFilterMode(topFilter ?? this._filterMode);
    this._renderButtonContent();
    this._syncMenuState();

    const canUseProject = !!this.projectId;
    const enabled = canUseProject && !this.isReadOnly && !this.isWriting;
    this._setEnabled(this.root, enabled);
    if (!enabled) this._setFilterMenuOpen(false);
  }

  _setEnabled(el, enabled) {
    if (!(el instanceof HTMLElement)) return;
    el.style.opacity = enabled ? "1" : "0.45";
    el.style.cursor = enabled ? "pointer" : "default";
    el.dataset.enabled = enabled ? "true" : "false";
    const btn = this.btnFilter;
    if (btn) {
      btn.disabled = !enabled;
    }
  }

  mountInto(actionWrap) {
    if (!(actionWrap instanceof HTMLElement)) return;
    if (this.root.parentElement !== actionWrap) {
      actionWrap.insertBefore(this.root, actionWrap.firstChild || null);
    }
  }
}
