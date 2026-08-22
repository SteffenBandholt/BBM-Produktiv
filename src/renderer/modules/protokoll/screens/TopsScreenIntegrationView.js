import TopsScreen from "./TopsScreen.js";

function buildToolsMarker() {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.textContent = "Tools";
  marker.title = "Protokoll-Werkzeuge";
  marker.setAttribute("aria-label", "Protokoll-Werkzeuge");
  marker.setAttribute("data-bbm-protokoll-tools-marker", "true");
  Object.assign(marker.style, {
    position: "fixed",
    right: "176px",
    top: "110px",
    width: "30px",
    height: "132px",
    zIndex: "12040",
    border: "1px solid #c9d2df",
    borderRight: "0",
    borderRadius: "10px 0 0 10px",
    background: "#ffffff",
    color: "#1f2937",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 0",
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontFamily: '"Noto Sans", Arial, sans-serif',
    fontSize: "12px",
    fontWeight: "800",
    lineHeight: "1",
    letterSpacing: "0.08em",
    boxShadow: "-4px 0 12px rgba(0,0,0,0.12)",
  });
  return marker;
}

export default class TopsScreenIntegrationView extends TopsScreen {
  render() {
    const root = super.render();
    const marker = buildToolsMarker();
    marker.addEventListener("mouseenter", async () => {
      try {
        const lane = await this.router?._ensureProjectContextQuicklane?.();
        lane?.open?.({
          projectId: this._getQuicklaneProjectId(),
          meetingId: this._getQuicklaneMeetingId(),
        });
      } catch (_e) {
        // Die Beschriftung bleibt auch ohne programmatisches Oeffnen sichtbar.
      }
    });
    marker.addEventListener("click", async () => {
      try {
        const lane = await this.router?._ensureProjectContextQuicklane?.();
        lane?.open?.({
          projectId: this._getQuicklaneProjectId(),
          meetingId: this._getQuicklaneMeetingId(),
        });
      } catch (_e) {
        // ignore
      }
    });
    root?.appendChild?.(marker);
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
