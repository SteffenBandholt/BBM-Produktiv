import { getTopFilterBadge, getTopFilterLabel, normalizeTopFilterMode } from "./topFilterMode.js";

const ICON_CLASS = "bbm-tops-screen-quicklane-icon";
const AMPEL_STATUS_ICON_URL = "./assets/icons/ampel-status.svg";
const FILTER_OPTIONS = Object.freeze([
  { mode: "all", label: "Alle" },
  { mode: "todo", label: "ToDo" },
  { mode: "decision", label: "Beschluss" },
]);

function createTextIcon(label) {
  const icon = document.createElement("span");
  icon.className = ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = label;
  return icon;
}

function createAmpelIcon(active) {
  const img = document.createElement("img");
  img.className = `${ICON_CLASS} bbm-tops-screen-quicklane-icon--ampel`;
  img.setAttribute("aria-hidden", "true");
  img.alt = "";
  img.src = AMPEL_STATUS_ICON_URL;
  img.dataset.active = active ? "true" : "false";
  return img;
}

function createLongtextIcon(active) {
  const wrap = createTextIcon("");
  wrap.className = `${ICON_CLASS} bbm-tops-screen-quicklane-icon--longtext`;
  const widths = active ? ["18px", "16px", "18px", "13px"] : ["18px", "8px", "8px", "8px"];
  for (let i = 0; i < 4; i += 1) {
    const line = document.createElement("span");
    line.style.inlineSize = widths[i];
    line.style.opacity = active ? "1" : i === 0 ? "0.95" : "0.18";
    line.style.background = active ? "#304255" : "#5d6a7a";
    wrap.appendChild(line);
  }
  return wrap;
}

function createFilterIcon(mode) {
  const iconWrap = document.createElement("span");
  iconWrap.className = `${ICON_CLASS} bbm-tops-screen-quicklane-icon--filter`;
  iconWrap.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M3 5h18l-7 8v5l-4 2v-7L3 5z");
  path.setAttribute("fill", "currentColor");
  svg.appendChild(path);

  const badge = document.createElement("span");
  badge.className = "bbm-tops-screen-quicklane-filter-badge";
  badge.textContent = getTopFilterBadge(mode);
  iconWrap.append(svg, badge);
  return iconWrap;
}

function createButton({ id, icon, title, ariaLabel = title, pressed = null, disabled = false, onClick = null }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bbm-tops-screen-quicklane__button";
  btn.title = title;
  btn.setAttribute("aria-label", ariaLabel);
  btn.setAttribute("data-ui-editor-id", id);
  if (pressed !== null) btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  btn.appendChild(typeof icon === "string" ? createTextIcon(icon) : icon);
  if (disabled) {
    btn.disabled = true;
    btn.tabIndex = -1;
    btn.setAttribute("aria-disabled", "true");
  } else if (typeof onClick === "function") {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      onClick(event);
    });
  }
  return btn;
}

function createGroup(id, label) {
  const group = document.createElement("div");
  group.className = "bbm-tops-screen-quicklane__group";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  group.setAttribute("data-ui-editor-id", id);
  return group;
}

export class TopsScreenQuicklane {
  constructor(callbacks = {}) {
    this.callbacks = callbacks || {};
    this.root = document.createElement("aside");
    this.root.className = "bbm-tops-screen-quicklane";
    this.root.setAttribute("aria-label", "TOPS Quicklane");
    this.root.setAttribute("data-ui-editor-id", "protokoll.topsScreen.quicklane");
    this.root.dataset.pinned = "false";
    this.root.dataset.open = "false";
    this.filterMenu = null;
    this.pinned = false;
    this.lastState = {};
  }

  update({
    topFilter = "all",
    showAmpel = true,
    showLongtext = false,
    hasProject = true,
    hasMeeting = true,
    isReadOnly = false,
    isBusy = false,
  } = {}) {
    this.lastState = { topFilter, showAmpel, showLongtext, hasProject, hasMeeting, isReadOnly, isBusy };
    const mode = normalizeTopFilterMode(topFilter);
    const disabled = !!isBusy;
    this.root.replaceChildren();
    this._syncPinnedState();

    const navigation = createGroup("protokoll.topsScreen.quicklane.group.navigation", "Navigation");
    navigation.append(
      createButton({
        id: "protokoll.topsScreen.quicklane.pin",
        icon: this.pinned ? "🔒" : "🔓",
        title: this.pinned ? "Lösen" : "Fixieren",
        ariaLabel: this.pinned ? "Quicklane lösen" : "Quicklane fixieren",
        pressed: this.pinned,
        disabled,
        onClick: () => this._togglePinned(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.project",
        icon: "📁",
        title: "Projekt",
        disabled: disabled || !hasProject,
        onClick: () => this.callbacks.onProject?.(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.firms",
        icon: "🏢",
        title: "Firmen",
        disabled: disabled || !hasProject,
        onClick: () => this.callbacks.onFirms?.(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.participants",
        icon: "👥",
        title: "Teilnehmer",
        disabled: disabled || !hasProject || !hasMeeting,
        onClick: () => this.callbacks.onParticipants?.(),
      })
    );

    const visibility = createGroup("protokoll.topsScreen.quicklane.group.visibility", "Sichtbarkeit");
    visibility.append(
      createButton({
        id: "protokoll.topsScreen.quicklane.action.ampel",
        icon: createAmpelIcon(showAmpel),
        title: "Ampel an/aus",
        ariaLabel: "Ampel",
        pressed: showAmpel,
        disabled,
        onClick: () => this.callbacks.onAmpelToggle?.(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.longtext",
        icon: createLongtextIcon(showLongtext),
        title: "Langtext an/aus",
        ariaLabel: "Langtext",
        pressed: showLongtext,
        disabled,
        onClick: () => this.callbacks.onLongtextToggle?.(),
      })
    );

    const filter = createGroup("protokoll.topsScreen.quicklane.group.filter", "TOP-Filter");
    const filterButton = createButton({
      id: "protokoll.topsScreen.quicklane.action.topFilter",
      icon: createFilterIcon(mode),
      title: `TOP-Filter: ${getTopFilterLabel(mode)}`,
      ariaLabel: `TOP-Filter: ${getTopFilterLabel(mode)}`,
      disabled,
      onClick: () => this._toggleFilterMenu(mode),
    });
    filterButton.dataset.quicklaneAction = "top-filter";
    filter.append(filterButton);

    const output = createGroup("protokoll.topsScreen.quicklane.group.output", "Ausgabe");
    output.append(
      createButton({
        id: "protokoll.topsScreen.quicklane.action.preview",
        icon: "📄",
        title: "PDF-Vorschau",
        disabled: disabled || !hasProject || !hasMeeting,
        onClick: () => this.callbacks.onPreview?.(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.print",
        icon: "🖨",
        title: "Drucken",
        disabled: disabled || !hasProject,
        onClick: () => this.callbacks.onPrint?.(),
      }),
      createButton({
        id: "protokoll.topsScreen.quicklane.action.mail",
        icon: "✉",
        title: "E-Mail",
        disabled: disabled || isReadOnly,
        onClick: () => this.callbacks.onMail?.(),
      })
    );

    this.root.append(navigation, visibility, filter, output);
  }

  _toggleFilterMenu(currentMode) {
    if (this.filterMenu?.parentElement) {
      this.filterMenu.remove();
      this.filterMenu = null;
      return;
    }

    const menu = document.createElement("div");
    menu.className = "bbm-tops-screen-quicklane-filter-menu";
    for (const option of FILTER_OPTIONS) {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = option.label;
      item.dataset.filterMode = option.mode;
      item.dataset.active = option.mode === currentMode ? "true" : "false";
      item.addEventListener("click", (event) => {
        event.preventDefault();
        this.callbacks.onTopFilterChange?.(option.mode);
        menu.remove();
        this.filterMenu = null;
      });
      menu.appendChild(item);
    }
    this.filterMenu = menu;
    this.root.appendChild(menu);
  }

  _togglePinned() {
    this.pinned = !this.pinned;
    this._syncPinnedState();
    this.update(this.lastState);
  }

  _syncPinnedState() {
    this.root.dataset.pinned = this.pinned ? "true" : "false";
    this.root.dataset.open = this.pinned ? "true" : "false";
  }
}
