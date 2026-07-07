const QUICKLANE_ICON_CLASS = "bbm-project-context-quicklane-icon";
const AMPEL_STATUS_ICON_URL = "./assets/icons/ampel-status.svg";

function setUiEditorId(el, id) {
  if (el && id) el.setAttribute("data-ui-editor-id", id);
  return el;
}

function applyQuicklaneRootStyles(root) {
  root.style.position = "fixed";
  root.style.top = "104px";
  root.style.right = "0";
  root.style.bottom = "16px";
  root.style.zIndex = "12030";
  root.style.inlineSize = "64px";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.alignItems = "center";
  root.style.gap = "8px";
  root.style.padding = "8px 5px 8px 11px";
  root.style.border = "1px solid rgba(154, 168, 189, 0.72)";
  root.style.borderRight = "0";
  root.style.borderRadius = "10px 0 0 10px";
  root.style.background = "rgba(255, 255, 255, 0.96)";
  root.style.boxShadow = "0 10px 22px rgba(31, 41, 55, 0.1)";
  root.style.overflow = "hidden";
  root.style.transform = "translateX(46px)";
  root.style.transition = "transform 160ms ease, box-shadow 140ms ease, border-color 140ms ease";
}

function setQuicklaneOpen(root, open) {
  root.dataset.open = open ? "true" : "false";
  root.style.transform = open ? "translateX(0)" : "translateX(46px)";
  root.style.borderColor = open ? "rgba(29, 78, 216, 0.42)" : "rgba(154, 168, 189, 0.72)";
  root.style.boxShadow = open ? "0 14px 28px rgba(31, 41, 55, 0.15)" : "0 10px 22px rgba(31, 41, 55, 0.1)";
}


function createTextIcon(label) {
  const icon = document.createElement("span");
  icon.className = QUICKLANE_ICON_CLASS;
  icon.setAttribute("data-bbm-quicklane-icon", "true");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = label;
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.inlineSize = "20px";
  icon.style.blockSize = "20px";
  icon.style.fontSize = "18px";
  icon.style.lineHeight = "1";
  return icon;
}

function createAmpelIcon(active) {
  const icon = document.createElement("img");
  icon.className = QUICKLANE_ICON_CLASS;
  icon.setAttribute("data-bbm-quicklane-icon", "true");
  icon.setAttribute("aria-hidden", "true");
  icon.alt = "";
  icon.src = AMPEL_STATUS_ICON_URL;
  icon.dataset.active = active ? "true" : "false";
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.inlineSize = "16px";
  icon.style.blockSize = "30px";
  icon.style.objectFit = "contain";
  icon.style.opacity = active ? "0.92" : "0.48";
  return icon;
}

function createLongtextIcon(active) {
  const wrap = createTextIcon("");
  wrap.style.inlineSize = "18px";
  wrap.style.blockSize = "18px";
  wrap.style.flexDirection = "column";
  wrap.style.justifyContent = "space-between";

  const activeWidths = ["18px", "16px", "18px", "13px"];
  for (let i = 0; i < 4; i += 1) {
    const line = document.createElement("span");
    line.style.display = "block";
    line.style.blockSize = "2px";
    line.style.borderRadius = "999px";
    line.style.inlineSize = active ? activeWidths[i] : i === 0 ? "18px" : "8px";
    line.style.opacity = active ? "1" : i === 0 ? "0.95" : "0.18";
    line.style.background = active ? "#304255" : "#5d6a7a";
    wrap.appendChild(line);
  }

  return wrap;
}

function createButton({
  id,
  icon,
  title,
  ariaLabel = title,
  pressed = null,
  disabled = false,
  onClick = null,
}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bbm-restarbeiten-quicklane__button";
  setUiEditorId(btn, id);
  btn.title = title;
  btn.setAttribute("aria-label", ariaLabel);
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
  group.className = "bbm-restarbeiten-quicklane__group";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  setUiEditorId(group, id);
  return group;
}

function syncOpenState(root, pinned) {
  root.dataset.pinned = pinned ? "true" : "false";
  setQuicklaneOpen(root, pinned);
}

export function buildRestarbeitenQuicklane({
  pinned = false,
  showAmpel = true,
  showLongtext = true,
  onPinToggle = null,
  onProject = null,
  onFirms = null,
  onAmpelToggle = null,
  onLongtextToggle = null,
  onPreview = null,
} = {}) {
  const root = document.createElement("aside");
  root.className = "bbm-restarbeiten-quicklane";
  root.setAttribute("aria-label", "Restarbeiten Quicklane");
  setUiEditorId(root, "restarbeiten.quicklane");
  applyQuicklaneRootStyles(root);
  syncOpenState(root, pinned);

  root.addEventListener("mouseenter", () => {
    setQuicklaneOpen(root, true);
  });
  root.addEventListener("mouseleave", () => {
    if (root.dataset.pinned !== "true") setQuicklaneOpen(root, false);
  });

  const navigation = createGroup("restarbeiten.quicklane.group.navigation", "Navigation");
  const pinButton = createButton({
    id: "restarbeiten.quicklane.pin",
    icon: pinned ? "🔒" : "🔓",
    title: pinned ? "Lösen" : "Fixieren",
    ariaLabel: pinned ? "Quicklane lösen" : "Quicklane fixieren",
    pressed: pinned,
    onClick: onPinToggle,
  });
  navigation.append(
    pinButton,
    createButton({
      id: "restarbeiten.quicklane.action.project",
      icon: "📁",
      title: "Projekt",
      onClick: onProject,
    }),
    createButton({
      id: "restarbeiten.quicklane.action.firms",
      icon: "🏢",
      title: "Firmen",
      onClick: onFirms,
    })
  );

  const visibility = createGroup("restarbeiten.quicklane.group.visibility", "Sichtbarkeit");
  visibility.append(
    createButton({
      id: "restarbeiten.quicklane.action.ampel",
      icon: createAmpelIcon(showAmpel),
      title: "Ampel an/aus",
      ariaLabel: "Ampel",
      pressed: showAmpel,
      onClick: onAmpelToggle,
    }),
    createButton({
      id: "restarbeiten.quicklane.action.longtext",
      icon: createLongtextIcon(showLongtext),
      title: "Langtext an/aus",
      ariaLabel: "Langtext",
      pressed: showLongtext,
      onClick: onLongtextToggle,
    })
  );

  const output = createGroup("restarbeiten.quicklane.group.output", "Ausgabe");
  output.append(
    createButton({
      id: "restarbeiten.quicklane.action.pdfPreview",
      icon: "📄",
      title: "Ausgabevorschau",
      ariaLabel: "Ausgabevorschau",
      onClick: onPreview,
    }),
    createButton({
      id: "restarbeiten.quicklane.output.print",
      icon: "🖨",
      title: "Drucken noch nicht verfügbar",
      ariaLabel: "Drucken",
      disabled: true,
    }),
    createButton({
      id: "restarbeiten.quicklane.output.email",
      icon: "✉",
      title: "E-Mail noch nicht verfügbar",
      ariaLabel: "E-Mail",
      disabled: true,
    })
  );

  root.append(navigation, visibility, output);
  return root;
}
