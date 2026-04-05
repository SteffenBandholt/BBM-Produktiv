export class TopsHeader {
  constructor({ onClose, onEndMeeting } = {}) {
    this.onClose = typeof onClose === "function" ? onClose : null;
    this.onEndMeeting = typeof onEndMeeting === "function" ? onEndMeeting : null;

    this.root = document.createElement("header");
    this.root.setAttribute("data-bbm-tops-header-v2", "true");

    this.titleWrap = document.createElement("div");
    this.titleWrap.className = "bbm-tops-header-title-wrap";

    this.titleEl = document.createElement("div");
    this.titleEl.className = "bbm-tops-header-title";
    this.titleEl.textContent = "Protokoll";

    this.contextEl = document.createElement("div");
    this.contextEl.className = "bbm-tops-header-context";

    this.readOnlyEl = document.createElement("div");
    this.readOnlyEl.className = "bbm-tops-header-readonly";
    this.readOnlyEl.textContent = "READ ONLY";

    this.titleWrap.append(this.titleEl, this.contextEl, this.readOnlyEl);

    this.spacer = document.createElement("div");
    this.spacer.className = "bbm-tops-header-spacer";

    this.actionsWrap = document.createElement("div");
    this.actionsWrap.className = "bbm-tops-header-actions";

    this.btnEndMeeting = document.createElement("button");
    this.btnEndMeeting.type = "button";
    this.btnEndMeeting.textContent = "Protokoll beenden";
    this.btnEndMeeting.className = "bbm-tops-btn bbm-tops-btn-end-meeting";
    this.btnEndMeeting.onclick = async () => {
      if (this.btnEndMeeting.disabled) return;
      if (this.onEndMeeting) await this.onEndMeeting();
    };

    this.btnClose = document.createElement("button");
    this.btnClose.type = "button";
    this.btnClose.textContent = "Schliessen";
    this.btnClose.className = "bbm-tops-btn bbm-tops-btn-close";
    this.btnClose.onclick = async () => {
      if (this.btnClose.disabled) return;
      if (this.onClose) await this.onClose();
    };

    this.actionsWrap.append(this.btnEndMeeting, this.btnClose);
    this.root.append(this.titleWrap, this.spacer, this.actionsWrap);
  }

  getActionsHost() {
    return this.actionsWrap;
  }

  update({ title, context, isReadOnly, canEndMeeting, isBusy } = {}) {
    this.titleEl.textContent = title || "Protokoll";
    this.contextEl.textContent = context || "";

    const busy = !!isBusy;
    const readOnly = !!isReadOnly;
    const canEnd = !!canEndMeeting;

    this.root.dataset.isBusy = busy ? "true" : "false";
    this.root.dataset.isReadOnly = readOnly ? "true" : "false";
    this.root.dataset.canEndMeeting = canEnd ? "true" : "false";

    this.btnClose.disabled = busy;
    this.btnEndMeeting.disabled = busy || readOnly || !canEnd;
  }
}
