const QUICKLANE_ICON_CLASS = "bbm-project-context-quicklane-icon";

function setUiEditorId(el, id) {
  if (el && id) el.setAttribute("data-ui-editor-id", id);
  return el;
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
  const wrap = createTextIcon("");
  wrap.style.inlineSize = "16px";
  wrap.style.blockSize = "26px";
  wrap.style.borderRadius = "8px";
  wrap.style.background = "#1f1f1f";
  wrap.style.padding = "3px 0";
  wrap.style.boxSizing = "border-box";
  wrap.style.flexDirection = "column";
  wrap.style.justifyContent = "space-between";

  const lamps = [
    active
      ? { color: "#5b2323", opacity: "0.32", shadow: "none" }
      : { color: "#ff3b30", opacity: "1", shadow: "0 0 10px rgba(255,59,48,0.8)" },
    { color: "#f4c542", opacity: "0.45", shadow: "none" },
    active
      ? { color: "#22c55e", opacity: "1", shadow: "0 0 10px rgba(34,197,94,0.85)" }
      : { color: "#1f4d2f", opacity: "0.32", shadow: "none" },
  ];

  for (const lampState of lamps) {
    const lamp = document.createElement("span");
    lamp.style.inlineSize = "6px";
    lamp.style.blockSize = "6px";
    lamp.style.borderRadius = "999px";
    lamp.style.display = "block";
    lamp.style.background = lampState.color;
    lamp.style.opacity = lampState.opacity;
    lamp.style.boxShadow = lampState.shadow;
    wrap.appendChild(lamp);
  }

  return wrap;
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
  root.dataset.open = pinned ? "true" : "false";
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
  syncOpenState(root, pinned);

  root.addEventListener("mouseenter", () => {
    root.dataset.open = "true";
  });
  root.addEventListener("mouseleave", () => {
    if (root.dataset.pinned !== "true") root.dataset.open = "false";
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
      title: "PDF-Vorschau",
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
