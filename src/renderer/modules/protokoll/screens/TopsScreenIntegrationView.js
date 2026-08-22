import TopsScreen from "./TopsScreen.js";

function applySharedToolsBehavior(lane) {
  if (!lane || lane._bbmProtocolToolsStandardApplied === true) return lane;

  const originalApplyState = typeof lane._applyState === "function"
    ? lane._applyState.bind(lane)
    : null;
  if (!originalApplyState) return lane;

  lane._applyState = function applyUnifiedQuicklaneState() {
    originalApplyState();

    const isRestarbeiten = typeof this._isRestarbeitenMode === "function"
      ? this._isRestarbeitenMode()
      : String(this.router?.activeSection || "").trim() === "restarbeiten";
    if (isRestarbeiten) return;

    const shouldRender = this._enabled === true && this.router?.context?.ui?.isTopsView === true;
    if (!shouldRender) {
      if (this.edgeGripEl) {
        this.edgeGripEl.style.display = "none";
        this.edgeGripEl.style.pointerEvents = "none";
      }
      return;
    }

    const isOpen = typeof this._isQuicklaneOpen === "function"
      ? this._isQuicklaneOpen()
      : !!(this._isOpen || this._isPinned || this._isHoveringTab || this._isHoveringPanel);

    if (this.root) {
      this.root.style.width = isOpen ? "176px" : "56px";
      this.root.style.right = isOpen ? "0" : "-56px";
      this.root.style.transform = "none";
    }

    if (this.edgeGripEl) {
      this.edgeGripEl.textContent = "Tools";
      this.edgeGripEl.style.display = isOpen ? "none" : "flex";
      this.edgeGripEl.style.pointerEvents = isOpen ? "none" : "auto";
      this.edgeGripEl.style.right = "0";
      this.edgeGripEl.style.visibility = "visible";
      this.edgeGripEl.style.opacity = "1";
    }
  };

  lane._bbmProtocolToolsStandardApplied = true;
  lane._applyState();
  return lane;
}

export default class TopsScreenIntegrationView extends TopsScreen {
  render() {
    const root = super.render();
    Promise.resolve(this.router?._ensureProjectContextQuicklane?.())
      .then((lane) => applySharedToolsBehavior(lane))
      .catch(() => {});
    return root;
  }

  _openQuicklaneMail() {
    if (typeof this.router?.openClosedProtocolSelector === "function") {
      return this.router.openClosedProtocolSelector({ mode: "mail" });
    }
    return super._openQuicklaneMail();
  }

  async _openQuicklaneFirms() {
    const projectId = this._getQuicklaneProjectId();
    if (!projectId || typeof this.router?.showProjectFirms !== "function") return false;

    await this.router.showProjectFirms(projectId, {
      returnContext: {
        section: "tops",
        projectId,
        meetingId: this._getQuicklaneMeetingId(),
        topsReturnContext: this.returnContext || null,
      },
    });
    return true;
  }
}
