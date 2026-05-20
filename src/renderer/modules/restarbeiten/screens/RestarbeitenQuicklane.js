function createIconButton(doc, { label, title, iconText, iconNode = null, onClick } = {}) {
  const btn = doc.createElement("button");
  btn.type = "button";
  btn.className = "restarbeiten-quicklane__iconButton";
  btn.title = title || label || "";
  btn.setAttribute("aria-label", label || title || "");
  btn.onclick = typeof onClick === "function" ? onClick : null;

  const icon = iconNode || doc.createElement("span");
  if (!iconNode) {
    icon.className = "restarbeiten-quicklane__icon";
    icon.textContent = iconText || "";
  } else if (!icon.className) {
    icon.className = "restarbeiten-quicklane__icon";
  }
  btn.append(icon);
  return btn;
}

function createToolItem(doc, { iconNode = null, iconText = "", title = "", actionHandler = null } = {}) {
  const item = doc.createElement("div");
  item.title = title;
  item.style.width = "40px";
  item.style.height = "40px";
  item.style.border = "1px solid #dfdfdf";
  item.style.borderRadius = "10px";
  item.style.background = "#ffffff";
  item.style.display = "flex";
  item.style.alignItems = "center";
  item.style.justifyContent = "center";
  item.style.fontSize = "20px";
  item.style.lineHeight = "1";
  item.style.userSelect = "none";
  item.style.transition = "background 140ms ease-out, border-color 140ms ease-out";

  if (typeof actionHandler === "function") {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.onclick = actionHandler;
    item.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      actionHandler();
    });
  }

  if (iconNode) {
    item.append(iconNode);
  } else {
    item.textContent = iconText || "";
  }
  return item;
}

function createAmpelIcon(doc, { enabled = true } = {}) {
  const wrap = doc.createElement("span");
  wrap.className = "restarbeiten-quicklane__ampelIcon";
  wrap.dataset.enabled = enabled ? "1" : "0";

  const lampTop = doc.createElement("span");
  const lampMid = doc.createElement("span");
  const lampBottom = doc.createElement("span");
  lampTop.className = "restarbeiten-quicklane__ampelLamp restarbeiten-quicklane__ampelLamp--top";
  lampMid.className = "restarbeiten-quicklane__ampelLamp restarbeiten-quicklane__ampelLamp--mid";
  lampBottom.className = "restarbeiten-quicklane__ampelLamp restarbeiten-quicklane__ampelLamp--bottom";
  wrap.append(lampTop, lampMid, lampBottom);
  return wrap;
}

function createPrinterIcon(doc) {
  const svg = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "svg")
    : doc.createElement("svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.style.width = "18px";
  svg.style.height = "18px";
  svg.style.display = "block";
  svg.style.fill = "none";
  svg.style.stroke = "currentColor";
  svg.style.strokeWidth = "1.7";
  svg.style.strokeLinecap = "round";
  svg.style.strokeLinejoin = "round";

  const body = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  body.setAttribute("d", "M7 9V5h10v4");

  const frame = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "rect")
    : doc.createElement("rect");
  frame.setAttribute("x", "5");
  frame.setAttribute("y", "9");
  frame.setAttribute("width", "14");
  frame.setAttribute("height", "7");
  frame.setAttribute("rx", "1.8");

  const paper = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  paper.setAttribute("d", "M8 13h8v6H8z");

  const line1 = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  line1.setAttribute("d", "M9 12.2h6");
  const line2 = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  line2.setAttribute("d", "M9 14.3h6");

  svg.append(body, frame, paper, line1, line2);
  return svg;
}

function createMailIcon(doc) {
  const svg = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "svg")
    : doc.createElement("svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.style.width = "18px";
  svg.style.height = "18px";
  svg.style.display = "block";
  svg.style.fill = "none";
  svg.style.stroke = "currentColor";
  svg.style.strokeWidth = "1.7";
  svg.style.strokeLinecap = "round";
  svg.style.strokeLinejoin = "round";

  const envelope = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  envelope.setAttribute("d", "M4.5 7.5h15v9h-15z");

  const flapLeft = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  flapLeft.setAttribute("d", "M4.8 7.9 12 13.2");

  const flapRight = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  flapRight.setAttribute("d", "M19.2 7.9 12 13.2");

  const atSign = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  atSign.setAttribute("d", "M15.2 14.5a2.2 2.2 0 1 1-1.4-3.9c1.1 0 1.9.7 1.9 1.7v2.2");

  svg.append(envelope, flapLeft, flapRight, atSign);
  return svg;
}

function createLockIcon(doc, { open = false } = {}) {
  const svg = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "svg")
    : doc.createElement("svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.style.width = "18px";
  svg.style.height = "18px";
  svg.style.display = "block";
  svg.style.fill = "none";
  svg.style.stroke = "currentColor";
  svg.style.strokeWidth = "1.8";
  svg.style.strokeLinecap = "round";
  svg.style.strokeLinejoin = "round";

  const body = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "rect")
    : doc.createElement("rect");
  body.setAttribute("x", "6");
  body.setAttribute("y", "10");
  body.setAttribute("width", "12");
  body.setAttribute("height", "9");
  body.setAttribute("rx", "2");

  const shackle = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  shackle.setAttribute("d", open ? "M9 10V7.5a3 3 0 0 1 6 0V9" : "M9 10V7.5a3 3 0 0 1 6 0V10");
  if (open) shackle.setAttribute("transform", "rotate(-18 12 10)");

  const keyhole = typeof doc?.createElementNS === "function"
    ? doc.createElementNS("http://www.w3.org/2000/svg", "path")
    : doc.createElement("path");
  keyhole.setAttribute("d", "M12 13.5v2");

  svg.append(body, shackle, keyhole);
  return svg;
}

function createYellowLockIconFixed(doc, { open = false } = {}) {
  const icon = doc.createElement("span");
  icon.className = "restarbeiten-quicklane__lockIcon";
  icon.textContent = open ? "\uD83D\uDD13" : "\uD83D\uDD12";
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.width = "18px";
  icon.style.height = "18px";
  icon.style.fontSize = "18px";
  icon.style.lineHeight = "1";
  icon.style.color = "#f4b400";
  return icon;
}

function createYellowLockIcon(doc, { open = false } = {}) {
  const icon = doc.createElement("span");
  icon.className = "restarbeiten-quicklane__lockIcon";
  icon.textContent = open ? "🔓" : "🔒";
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.width = "18px";
  icon.style.height = "18px";
  icon.style.fontSize = "18px";
  icon.style.lineHeight = "1";
  icon.style.color = "#f4b400";
  return icon;
}

export default class RestarbeitenQuicklane {
  constructor({
    onTogglePin = null,
    onOpenFirms = null,
    onOpenPreview = null,
    onOpenEmail = null,
    onToggleLight = null,
    onToggleLongtext = null,
    ampelEnabled = true,
    longtextEnabled = true,
  } = {}) {
    this.onTogglePin = typeof onTogglePin === "function" ? onTogglePin : null;
    this.onOpenFirms = typeof onOpenFirms === "function" ? onOpenFirms : null;
    this.onOpenPreview = typeof onOpenPreview === "function" ? onOpenPreview : null;
    this.onOpenEmail = typeof onOpenEmail === "function" ? onOpenEmail : null;
    this.onToggleLight = typeof onToggleLight === "function" ? onToggleLight : null;
    this.onToggleLongtext = typeof onToggleLongtext === "function" ? onToggleLongtext : null;
    this._ampelEnabled = !!ampelEnabled;
    this._longtextEnabled = !!longtextEnabled;
    this.root = null;
    this.tabBtn = null;
    this.headerEl = null;
    this.bodyEl = null;
    this.pinBtn = null;
    this.ampelBtn = null;
    this.longtextBtn = null;
    this._isPinned = false;
    this._isOpen = false;
    this._closeTimer = null;
  }

  setPinned(nextPinned) {
    this._isPinned = !!nextPinned;
    this.setOpen(this._isPinned || this._isOpen);
    if (!this.pinBtn) return;
    this.pinBtn.title = this._isPinned ? "Lösen" : "Fixieren";
    this.pinBtn.setAttribute("aria-pressed", this._isPinned ? "true" : "false");
    this.pinBtn.dataset.pinned = this._isPinned ? "1" : "0";
    const doc = this.pinBtn.ownerDocument || globalThis.document;
    this.pinBtn.replaceChildren(createYellowLockIconFixed(doc, { open: !this._isPinned }));
    this.pinBtn.dataset.open = this._isOpen ? "1" : "0";
    this.pinBtn.style.color = "#f4b400";
    this.pinBtn.style.background = "transparent";
    this.pinBtn.style.border = "0";
  }

  setOpen(nextOpen) {
    this._isOpen = !!nextOpen;
    if (!this.root) return;
    this.root.dataset.open = this._isOpen ? "1" : "0";
    this.root.style.width = (this._isOpen || this._isPinned) ? "56px" : "56px";
    this.root.style.transform = (this._isOpen || this._isPinned)
      ? "translateX(0)"
      : "translateX(calc(100% - 22px))";
  }

  setAmpelEnabled(nextEnabled) {
    this._ampelEnabled = !!nextEnabled;
    if (!this.ampelBtn) return;
    this.ampelBtn.title = this._ampelEnabled ? "Ampel aus" : "Ampel an";
    this.ampelBtn.setAttribute("aria-pressed", this._ampelEnabled ? "true" : "false");
    const icon = this.ampelBtn.firstChild;
    if (icon) icon.dataset.enabled = this._ampelEnabled ? "1" : "0";
  }

  setLongtextEnabled(nextEnabled) {
    this._longtextEnabled = !!nextEnabled;
    if (!this.longtextBtn) return;
    this.longtextBtn.title = this._longtextEnabled ? "Langtext aus" : "Langtext an";
    this.longtextBtn.setAttribute("aria-pressed", this._longtextEnabled ? "true" : "false");
    this.longtextBtn.dataset.active = this._longtextEnabled ? "true" : "false";
    this.longtextBtn.style.background = this._longtextEnabled ? "#eef7ff" : "#ffffff";
    this.longtextBtn.style.borderColor = this._longtextEnabled ? "#b6d4ff" : "#d8d8d8";
    this.longtextBtn.style.color = this._longtextEnabled ? "#0b4db4" : "#222";
    const icon = this.longtextBtn.firstChild;
    if (icon) {
      icon.dataset.enabled = this._longtextEnabled ? "1" : "0";
      const lines = icon.children || [];
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line) continue;
        if (this._longtextEnabled) {
          const widths = ["18px", "16px", "18px", "13px"];
          line.style.width = widths[i] || "18px";
          line.style.opacity = "1";
          line.style.background = "#304255";
        } else {
          line.style.width = i === 0 ? "18px" : "8px";
          line.style.opacity = i === 0 ? "0.95" : "0.18";
          line.style.background = "#5d6a7a";
        }
      }
    }
  }

  _scheduleClose() {
    if (this._isPinned) return;
    if (this._closeTimer) clearTimeout(this._closeTimer);
    this._closeTimer = setTimeout(() => {
      this._closeTimer = null;
      if (this._isPinned) return;
      this.setOpen(false);
    }, 320);
  }

  _cancelClose() {
    if (!this._closeTimer) return;
    clearTimeout(this._closeTimer);
    this._closeTimer = null;
  }

  render(documentRef = globalThis.document) {
    const doc = documentRef;
    const root = doc.createElement("aside");
    root.className = "restarbeiten-quicklane";
    root.setAttribute("data-bbm-restarbeiten-quicklane", "true");
    root.dataset.pinned = "0";
    root.dataset.open = "0";
    root.style.position = "fixed";
    root.style.top = "86px";
    root.style.right = "0";
    root.style.height = "100%";
    root.style.width = "56px";
    root.style.background = "#f7f7f7";
    root.style.boxShadow = "-8px 0 22px rgba(0,0,0,0.14)";
    root.style.borderLeft = "1px solid #dfdfdf";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.transform = "translateX(calc(100% - 22px))";
    root.style.pointerEvents = "auto";
    root.style.transition = "transform 220ms ease-out";
    root.style.willChange = "transform";
    root.style.zIndex = "24";
    root.style.overflow = "hidden";

    const tab = doc.createElement("button");
    tab.type = "button";
    tab.textContent = "Tools";
    tab.title = "Restarbeiten";
    tab.setAttribute("aria-label", "Restarbeiten");
    tab.style.position = "absolute";
    tab.style.left = "-22px";
    tab.style.top = "96px";
    tab.style.width = "22px";
    tab.style.height = "124px";
    tab.style.border = "1px solid #d9d9d9";
    tab.style.borderRight = "none";
    tab.style.borderRadius = "10px 0 0 10px";
    tab.style.background = "#f1f1f1";
    tab.style.color = "#333";
    tab.style.cursor = "pointer";
    tab.style.display = "flex";
    tab.style.alignItems = "center";
    tab.style.justifyContent = "center";
    tab.style.padding = "8px 0";
    tab.style.writingMode = "vertical-rl";
    tab.style.transform = "rotate(180deg)";
    tab.style.fontSize = "11px";
    tab.style.fontWeight = "700";
    tab.style.letterSpacing = "0.08em";
    tab.style.boxShadow = "-4px 0 12px rgba(0,0,0,0.08)";

    const header = doc.createElement("div");
    header.style.display = "flex";
    header.style.flexDirection = "column";
    header.style.alignItems = "center";
    header.style.gap = "6px";
    header.style.padding = "8px";
    header.style.borderBottom = "1px solid #e8e8e8";
    header.style.background = "#fafafa";

    const pinRow = doc.createElement("div");
    pinRow.className = "restarbeiten-quicklane__pinRow";
    const pinBtn = doc.createElement("button");
    pinBtn.type = "button";
    pinBtn.className = "restarbeiten-quicklane__pinButton";
    pinBtn.onclick = () => {
      this.setPinned(!this._isPinned);
      this.onTogglePin?.(this._isPinned);
    };
    this.pinBtn = pinBtn;
    this.setPinned(false);
    const pinIcon = createYellowLockIconFixed(doc, { open: true });
    pinBtn.replaceChildren(pinIcon);
    header.append(pinBtn);

    const body = doc.createElement("div");
    body.style.flex = "1 1 auto";
    body.style.padding = "10px 8px";
    body.style.overflowY = "auto";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.alignItems = "center";
    body.style.gap = "10px";

    const firmsSection = createToolItem(doc, {
      iconText: "🏢",
      title: "Firmen",
      actionHandler: () => this.onOpenFirms?.(),
    });

    const ampelSection = createToolItem(doc, {
      iconNode: createAmpelIcon(doc, { enabled: this._ampelEnabled }),
      title: "Ampel an/aus",
      actionHandler: () => this.onToggleLight?.(),
    });
    this.ampelBtn = ampelSection;

    const previewSection = createToolItem(doc, {
      iconNode: createPrinterIcon(doc),
      title: "PDF-Vorschau",
      actionHandler: () => this.onOpenPreview?.(),
    });

    const mailSection = createToolItem(doc, {
      iconText: "E-Mail",
      title: "E-Mail",
      actionHandler: () => this.onOpenEmail?.(),
    });

    const longtextSection = createToolItem(doc, {
      title: "Langtext an/aus",
      actionHandler: () => this.onToggleLongtext?.(),
    });
    const longtextWrap = doc.createElement("span");
    longtextWrap.className = "restarbeiten-quicklane__longtextIcon";
    longtextWrap.dataset.enabled = this._longtextEnabled ? "1" : "0";
    longtextWrap.style.display = "flex";
    longtextWrap.style.flexDirection = "column";
    longtextWrap.style.justifyContent = "space-between";
    longtextWrap.style.alignItems = "center";
    longtextWrap.style.width = "18px";
    longtextWrap.style.height = "18px";
    longtextWrap.style.pointerEvents = "none";
    for (let i = 0; i < 4; i += 1) {
      const line = doc.createElement("span");
      line.className = `restarbeiten-quicklane__longtextLine restarbeiten-quicklane__longtextLine--${i + 1}`;
      line.style.display = "block";
      line.style.height = "2px";
      line.style.borderRadius = "999px";
      line.style.background = "#3d4a5c";
      line.style.transition = "opacity 140ms ease-out, width 140ms ease-out, background 140ms ease-out";
      longtextWrap.append(line);
    }
    longtextSection.replaceChildren(longtextWrap);
    this.longtextBtn = longtextSection;

    body.append(firmsSection, ampelSection, previewSection, mailSection, longtextSection);
    root.append(tab, header, body);
    this.root = root;
    this.setAmpelEnabled(this._ampelEnabled);
    this.setLongtextEnabled(this._longtextEnabled);
    this.tabBtn = tab;
    this.headerEl = header;
    this.bodyEl = body;

    root.addEventListener("mouseenter", () => {
      this._cancelClose();
      if (!this._isPinned) this.setOpen(true);
    });
    root.addEventListener("mouseleave", () => {
      this._scheduleClose();
    });

    return root;
  }
}
