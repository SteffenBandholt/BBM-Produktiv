export class TopsHeader {
  constructor({ onClose, onEndMeeting } = {}) {
    this.onClose = typeof onClose === "function" ? onClose : null;
    this.onEndMeeting = typeof onEndMeeting === "function" ? onEndMeeting : null;

    this.root = document.createElement("header");
    this.root.setAttribute("data-bbm-tops-header-v2", "true");
    this.root.style.display = "flex";
    this.root.style.alignItems = "center";
    this.root.style.gap = "10px";
    this.root.style.padding = "4px 10px";
    this.root.style.borderBottom = "1px solid #d9e2ec";
    this.root.style.background = "#ffffff";

    this.titleWrap = document.createElement("div");
    this.titleWrap.style.display = "grid";
    this.titleWrap.style.gap = "1px";
    this.titleWrap.style.minWidth = "0";

    this.titleEl = document.createElement("div");
    this.titleEl.style.fontSize = "8.5pt";
    this.titleEl.style.fontWeight = "700";
    this.titleEl.textContent = "Protokoll";

    this.contextEl = document.createElement("div");
    this.contextEl.style.fontSize = "8pt";
    this.contextEl.style.opacity = "0.9";
    this.contextEl.style.whiteSpace = "nowrap";
    this.contextEl.style.overflow = "hidden";
    this.contextEl.style.textOverflow = "ellipsis";

    this.readOnlyEl = document.createElement("div");
    this.readOnlyEl.style.fontSize = "7.5pt";
    this.readOnlyEl.style.fontWeight = "700";
    this.readOnlyEl.style.color = "#b71c1c";
    this.readOnlyEl.style.display = "none";
    this.readOnlyEl.textContent = "READ ONLY";

    this.titleWrap.append(this.titleEl, this.contextEl, this.readOnlyEl);

    this.spacer = document.createElement("div");
    this.spacer.style.flex = "1 1 auto";

    this.actionsWrap = document.createElement("div");
    this.actionsWrap.style.display = "inline-flex";
    this.actionsWrap.style.alignItems = "center";
    this.actionsWrap.style.gap = "4px";

    this.btnEndMeeting = document.createElement("button");
    this.btnEndMeeting.type = "button";
    this.btnEndMeeting.textContent = "Protokoll beenden";
    this.btnEndMeeting.style.border = "1px solid rgba(0,0,0,0.25)";
    this.btnEndMeeting.style.background = "#ef6c00";
    this.btnEndMeeting.style.color = "#fff";
    this._styleActionButton(this.btnEndMeeting);
    this.btnEndMeeting.onclick = async () => {
      if (this.btnEndMeeting.disabled) return;
      if (this.onEndMeeting) await this.onEndMeeting();
    };

    this.btnClose = document.createElement("button");
    this.btnClose.type = "button";
    this.btnClose.textContent = "Schliessen";
    this.btnClose.style.border = "1px solid rgba(0,0,0,0.25)";
    this.btnClose.style.background = "#fff";
    this.btnClose.style.color = "#222";
    this._styleActionButton(this.btnClose);
    this.btnClose.onclick = async () => {
      if (this.btnClose.disabled) return;
      if (this.onClose) await this.onClose();
    };

    this.actionsWrap.append(this.btnEndMeeting, this.btnClose);
    this.root.append(this.titleWrap, this.spacer, this.actionsWrap);
  }

  _styleActionButton(btn) {
    btn.style.padding = "1px 6px";
    btn.style.minHeight = "0";
    btn.style.fontSize = "7.5pt";
    btn.style.lineHeight = "1.15";
    btn.style.borderRadius = "6px";
  }

  getActionsHost() {
    return this.actionsWrap;
  }

  update({ title, context, isReadOnly, canEndMeeting, isBusy } = {}) {
    this.titleEl.textContent = title || "Protokoll";
    this.contextEl.textContent = context || "";
    this.readOnlyEl.style.display = isReadOnly ? "" : "none";

    const busy = !!isBusy;
    this.btnClose.disabled = busy;
    this.btnClose.style.opacity = this.btnClose.disabled ? "0.65" : "1";

    this.btnEndMeeting.disabled = busy || !!isReadOnly || !canEndMeeting;
    this.btnEndMeeting.style.display = isReadOnly ? "none" : "";
    this.btnEndMeeting.style.opacity = this.btnEndMeeting.disabled ? "0.65" : "1";
  }
}
