const TOP_PX = 110;
const PANEL_WIDTH_PX = 64;
const TAB_WIDTH_PX = 30;

function makeButton({ icon, title, onClick, disabled = false }) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.disabled = !!disabled;
  Object.assign(button.style, {
    width: "40px",
    height: "34px",
    border: "1px solid #d7dee8",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#26323f",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? "0.45" : "1",
  });
  button.textContent = icon;
  if (!disabled && typeof onClick === "function") {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
  }
  return button;
}

export default class AzlQuicklane {
  constructor({ onProject, onFirms, onNew, onSave, onClose } = {}) {
    this.callbacks = { onProject, onFirms, onNew, onSave, onClose };
    this.root = null;
    this.grip = null;
    this.open = false;
    this.pinned = false;
    this.pinButton = null;
  }

  mount() {
    if (this.root) return this.root;

    const root = document.createElement("aside");
    root.setAttribute("data-bbm-quicklane", "azl");
    root.setAttribute("aria-label", "azL Schnellzugriff");
    Object.assign(root.style, {
      position: "fixed",
      top: TOP_PX + "px",
      right: "-" + PANEL_WIDTH_PX + "px",
      bottom: "16px",
      width: PANEL_WIDTH_PX + "px",
      zIndex: "12030",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      padding: "8px 5px 8px 11px",
      boxSizing: "border-box",
      border: "1px solid #c9d2df",
      borderRight: "0",
      borderRadius: "10px 0 0 10px",
      background: "rgba(255,255,255,.98)",
      boxShadow: "-4px 0 12px rgba(0,0,0,.14)",
      transition: "right 180ms ease-out",
      overflow: "visible",
    });

    const grip = document.createElement("button");
    grip.type = "button";
    grip.textContent = "Tools";
    grip.title = "azL Schnellzugriff";
    grip.setAttribute("aria-label", "azL Schnellzugriff öffnen");
    grip.setAttribute("aria-expanded", "false");
    Object.assign(grip.style, {
      position: "fixed",
      top: TOP_PX + "px",
      right: "0",
      width: TAB_WIDTH_PX + "px",
      height: "132px",
      zIndex: "12032",
      border: "1px solid #c9d2df",
      borderRight: "0",
      borderRadius: "10px 0 0 10px",
      background: "#ffffff",
      color: "#1f2937",
      boxShadow: "-4px 0 12px rgba(0,0,0,.16)",
      writingMode: "vertical-rl",
      transform: "rotate(180deg)",
      fontSize: "12px",
      fontWeight: "800",
      letterSpacing: ".08em",
      cursor: "pointer",
    });
    grip.addEventListener("click", () => this.setOpen(true));

    const pin = makeButton({
      icon: "🔓",
      title: "Quicklane fixieren",
      onClick: () => this.togglePinned(),
    });
    this.pinButton = pin;

    const navigation = document.createElement("div");
    navigation.setAttribute("aria-label", "Navigation");
    Object.assign(navigation.style, {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      alignItems: "center",
      paddingBottom: "8px",
      borderBottom: "1px solid #e3e6ea",
    });
    navigation.append(
      makeButton({ icon: "📁", title: "Projekt", onClick: this.callbacks.onProject }),
      makeButton({ icon: "🏢", title: "Projektfirmen", onClick: this.callbacks.onFirms })
    );

    const documentActions = document.createElement("div");
    documentActions.setAttribute("aria-label", "azL Vorgang");
    Object.assign(documentActions.style, {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      alignItems: "center",
      paddingBottom: "8px",
      borderBottom: "1px solid #e3e6ea",
    });
    documentActions.append(
      makeButton({ icon: "＋", title: "Neue azL", onClick: this.callbacks.onNew }),
      makeButton({ icon: "💾", title: "azL speichern", onClick: this.callbacks.onSave })
    );

    const moduleActions = document.createElement("div");
    moduleActions.setAttribute("aria-label", "Modul");
    Object.assign(moduleActions.style, {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      alignItems: "center",
    });
    moduleActions.append(
      makeButton({ icon: "←", title: "azL schließen", onClick: this.callbacks.onClose })
    );

    root.append(pin, navigation, documentActions, moduleActions);
    document.body.append(root, grip);

    this.root = root;
    this.grip = grip;
    this.setOpen(false);
    return root;
  }

  setOpen(open) {
    this.open = !!open;
    if (!this.root || !this.grip) return;
    this.root.style.right = this.open ? "0" : "-" + PANEL_WIDTH_PX + "px";
    this.grip.style.display = this.open ? "none" : "block";
    this.grip.setAttribute("aria-expanded", this.open ? "true" : "false");
  }

  togglePinned() {
    this.pinned = !this.pinned;
    if (this.pinButton) {
      this.pinButton.textContent = this.pinned ? "🔒" : "🔓";
      this.pinButton.title = this.pinned ? "Quicklane lösen" : "Quicklane fixieren";
      this.pinButton.setAttribute("aria-label", this.pinButton.title);
      this.pinButton.style.background = this.pinned ? "#eef7ff" : "#ffffff";
      this.pinButton.style.borderColor = this.pinned ? "#b6d4ff" : "#d7dee8";
    }
    if (!this.pinned) this.setOpen(false);
    else this.setOpen(true);
  }

  destroy() {
    this.root?.remove();
    this.grip?.remove();
    this.root = null;
    this.grip = null;
  }
}
