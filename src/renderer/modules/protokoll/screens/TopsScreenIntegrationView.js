import TopsScreen from "./TopsScreen.js";

export default class TopsScreenIntegrationView extends TopsScreen {
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
