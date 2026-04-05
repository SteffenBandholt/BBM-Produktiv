export class TopsQuicklane {
  constructor({
    projectId = null,
    isReadOnly = false,
    onOpenProject = null,
    onOpenFirms = null,
    onOpenOutput = null,
  } = {}) {
    this.projectId = projectId || null;
    this.isReadOnly = !!isReadOnly;
    this.onOpenProject = typeof onOpenProject === "function" ? onOpenProject : null;
    this.onOpenFirms = typeof onOpenFirms === "function" ? onOpenFirms : null;
    this.onOpenOutput = typeof onOpenOutput === "function" ? onOpenOutput : null;

    this.btnProject = this._mkButton("Projekt", async () => {
      const pid = this.projectId || null;
      if (!pid || !this.onOpenProject) return;
      await this.onOpenProject(pid);
    });
    this.btnFirms = this._mkButton("Firmen", async () => {
      const pid = this.projectId || null;
      if (!pid || !this.onOpenFirms) return;
      await this.onOpenFirms(pid);
    });
    this.btnOutput = this._mkButton("Ausgabe", async () => {
      const pid = this.projectId || null;
      if (!pid || !this.onOpenOutput) return;
      await this.onOpenOutput(pid);
    });

    this.btnProject.dataset.quicklaneAction = "project";
    this.btnFirms.dataset.quicklaneAction = "firms";
    this.btnOutput.dataset.quicklaneAction = "output";

    this.update({ projectId, isReadOnly });
  }

  _mkButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = "bbm-tops-btn bbm-tops-quicklane-btn";
    btn.onclick = onClick;
    return btn;
  }

  getButtons() {
    return [this.btnProject, this.btnFirms, this.btnOutput];
  }

  update({ projectId, isReadOnly } = {}) {
    this.projectId = projectId || null;
    this.isReadOnly = !!isReadOnly;

    const canUseProject = !!this.projectId;
    this._setEnabled(this.btnProject, canUseProject && !this.isReadOnly);
    this._setEnabled(this.btnFirms, canUseProject && !this.isReadOnly);
    this._setEnabled(this.btnOutput, canUseProject);
  }

  _setEnabled(btn, enabled) {
    if (!(btn instanceof HTMLElement)) return;
    btn.disabled = !enabled;
    btn.dataset.enabled = btn.disabled ? "false" : "true";
  }

  mountInto(actionWrap) {
    if (!(actionWrap instanceof HTMLElement)) return;
    for (const btn of this.getButtons()) {
      if (!(btn instanceof HTMLElement)) continue;
      if (btn.parentElement !== actionWrap) {
        actionWrap.insertBefore(btn, actionWrap.firstChild || null);
      }
    }
  }
}
