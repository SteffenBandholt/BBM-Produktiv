function createNode(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function asText(value, fallback = "—") {
  const text = String(value == null ? "" : value).trim();
  return text || fallback;
}

function yesNo(value) {
  return value ? "Ja" : "Nein";
}

function createInfoRow(label, value) {
  const row = createNode("div", "bbm-ui-editor-status-row");
  const labelNode = createNode("dt");
  labelNode.textContent = label;
  const valueNode = createNode("dd");
  valueNode.textContent = asText(value);
  row.append(labelNode, valueNode);
  return row;
}

function formatList(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(", ") : "keine";
}

function setNeutralError(node, result) {
  const code = asText(result?.blockCode, "BBM_UI_EDITOR_STATUS_BLOCKED");
  node.textContent = `${code}: Der UI-Editor-Status konnte nicht geladen werden.`;
  node.hidden = false;
}

export class BbmUiEditorStatusPanel {
  constructor({ router } = {}) {
    this.router = router || null;
    this.root = null;
    this.statusNode = null;
    this.elementsNode = null;
    this.detailsNode = null;
    this.changeNode = null;
    this.errorNode = null;
    this.status = null;
    this.elements = [];
    this.selectedElement = null;
    this.currentLayoutState = null;
    this.currentDraft = null;
    this.desiredVisible = true;
    this.applyBusy = false;
    this.resetBusy = false;
  }

  render() {
    const root = createNode("section", "bbm-ui-editor-panel");
    root.setAttribute("data-bbm-ui-editor-panel", "true");

    const header = createNode("div", "bbm-ui-editor-panel__header");
    const titleBox = createNode("div");
    const title = createNode("h1");
    title.textContent = "UI-Editor";
    const subtitle = createNode("p");
    subtitle.textContent = "Technische Editor-Ansicht fuer BBM. M53 erlaubt nur Sichtbarkeit als Entwurf im Sitzungsspeicher.";
    titleBox.append(title, subtitle);

    const closeButton = createNode("button", "bbm-ui-editor-panel__close");
    closeButton.type = "button";
    closeButton.textContent = "Zurueck";
    closeButton.setAttribute("data-bbm-ui-editor-close", "true");
    closeButton.addEventListener("click", () => {
      this.close().catch(() => {});
    });
    header.append(titleBox, closeButton);

    this.errorNode = createNode("div", "bbm-ui-editor-panel__error");
    this.errorNode.hidden = true;

    const intro = createNode("div", "bbm-ui-editor-panel__notice");
    intro.textContent = "Aktuell koennen registrierte UI-Elemente geprueft und ausgewaehlt werden. Nicht registrierte BBM-Bereiche werden nicht bearbeitet.";

    const grid = createNode("div", "bbm-ui-editor-panel__grid");
    this.statusNode = createNode("section", "bbm-ui-editor-card");
    this.elementsNode = createNode("section", "bbm-ui-editor-card");
    this.detailsNode = createNode("section", "bbm-ui-editor-card");
    this.changeNode = createNode("section", "bbm-ui-editor-card");
    grid.append(this.statusNode, this.elementsNode, this.detailsNode, this.changeNode);

    root.append(header, this.errorNode, intro, grid);
    this.root = root;
    this.refresh().catch((error) => this.showLoadError(error));
    return root;
  }

  async close() {
    try {
      await window.bbmDb?.uiEditorClose?.();
    } catch (_e) {
      // ignore, navigation back is still safe
    }
    if (this.router?.activeSection && this.router.activeSection !== "uiEditor") {
      return;
    }
    await this.router?.showSettings?.();
  }

  async refresh() {
    const api = window.bbmDb || {};
    const status = typeof api.uiEditorOpen === "function" ? await api.uiEditorOpen() : { ok: false, blockCode: "BBM_UI_EDITOR_BRIDGE_MISSING" };
    if (!status?.ok) {
      this.status = status;
      this.elements = [];
      this.selectedElement = null;
      this.renderAll();
      return;
    }

    const elementsResult = typeof api.uiEditorGetElements === "function" ? await api.uiEditorGetElements() : { ok: false, elements: [] };
    const detailsResult = typeof api.uiEditorGetSelectedElementDetails === "function"
      ? await api.uiEditorGetSelectedElementDetails()
      : { ok: true, selectedElement: null };

    this.status = status;
    this.elements = Array.isArray(elementsResult?.elements) ? elementsResult.elements : [];
    this.selectedElement = detailsResult?.selectedElement || null;
    if (this.selectedElement && typeof api.uiEditorLoadLayoutState === "function") {
      this.currentLayoutState = await api.uiEditorLoadLayoutState({ elementId: this.selectedElement.elementId });
    } else {
      this.currentLayoutState = null;
    }
    const draftResult = typeof api.uiEditorGetChangeDraft === "function" ? await api.uiEditorGetChangeDraft() : { ok: true, draft: null };
    this.currentDraft = draftResult?.draft || null;
    this.desiredVisible = this.currentDraft ? this.currentDraft.nextValue : this.currentLayoutState?.visible !== false;
    this.renderAll();
  }

  showLoadError(error) {
    this.status = { ok: false, blockCode: "BBM_UI_EDITOR_RENDERER_STATUS_FAILED", message: error?.message || "" };
    this.elements = [];
    this.selectedElement = null;
    this.renderAll();
  }

  renderAll() {
    this.renderStatus();
    this.renderElements();
    this.renderDetails();
    this.renderChange();
  }

  renderStatus() {
    if (!this.statusNode) return;
    this.statusNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Status";
    const list = createNode("dl", "bbm-ui-editor-status-list");
    const status = this.status || {};

    if (!status.ok) {
      setNeutralError(this.errorNode, status);
    } else if (this.errorNode) {
      this.errorNode.hidden = true;
      this.errorNode.textContent = "";
    }

    const layout = status.layout || {};
    list.append(
      createInfoRow("Runtime gestartet", yesNo(status.runtimeStarted)),
      createInfoRow("Adapter gueltig", yesNo(status.adapterValid)),
      createInfoRow("Ziel-App", status.targetAppName || "BBM"),
      createInfoRow("targetAppId", status.targetAppId),
      createInfoRow("UI-Editor-kit", status.uiEditorKitVersion),
      createInfoRow("Aktiver UI-Scope", status.activeUiScope),
      createInfoRow("Aktiver Layout-Scope", status.activeLayoutScope),
      createInfoRow("Layoutprofil", status.activeLayoutProfileId),
      createInfoRow("Registrierte Elemente", status.registeredElementCount),
      createInfoRow("LayoutStore verfuegbar", yesNo(status.layoutStoreAvailable)),
      createInfoRow("Layoutzustand vorhanden", yesNo(layout.hasStateForScopeAndProfile)),
      createInfoRow("Load/Save/Reset technisch", `${yesNo(layout.canLoad)} / ${yesNo(layout.canSave)} / ${yesNo(layout.canReset)}`),
      createInfoRow("Blockcode", status.blockCode || "kein Block"),
      createInfoRow("Speicherung", "nur Sitzungsspeicher")
    );

    const reloadButton = createNode("button", "bbm-ui-editor-panel__secondary");
    reloadButton.type = "button";
    reloadButton.textContent = "Layoutstatus neu laden";
    reloadButton.addEventListener("click", () => this.refresh().catch((error) => this.showLoadError(error)));

    const resetSelection = createNode("button", "bbm-ui-editor-panel__secondary");
    resetSelection.type = "button";
    resetSelection.textContent = "Auswahl zuruecksetzen";
    resetSelection.addEventListener("click", () => this.selectElement("").catch((error) => this.showLoadError(error)));

    const actions = createNode("div", "bbm-ui-editor-panel__actions");
    actions.append(reloadButton, resetSelection);
    this.statusNode.append(title, list, actions);
  }

  renderElements() {
    if (!this.elementsNode) return;
    this.elementsNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Registrierte UI-Elemente";
    this.elementsNode.appendChild(title);

    if (!this.elements.length) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = "Keine registrierten Elemente im aktiven Scope.";
      this.elementsNode.appendChild(empty);
      return;
    }

    const list = createNode("div", "bbm-ui-editor-elements");
    for (const element of this.elements) {
      const button = createNode("button", "bbm-ui-editor-element");
      button.type = "button";
      button.setAttribute("data-bbm-ui-editor-element-id", element.elementId);
      button.setAttribute("aria-pressed", element.selected ? "true" : "false");
      const label = createNode("strong");
      label.textContent = asText(element.label, element.elementId);
      const meta = createNode("span");
      meta.textContent = `${element.elementId} · ${asText(element.type)}`;
      const selected = createNode("em");
      selected.textContent = element.selected ? "ausgewaehlt" : "waehlen";
      button.append(label, meta, selected);
      button.addEventListener("click", () => this.selectElement(element.elementId).catch((error) => this.showLoadError(error)));
      list.appendChild(button);
    }
    this.elementsNode.appendChild(list);
  }

  renderDetails() {
    if (!this.detailsNode) return;
    this.detailsNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Elementdetails";
    this.detailsNode.appendChild(title);

    const element = this.selectedElement;
    if (!element) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = "Noch kein registriertes Element ausgewaehlt.";
      this.detailsNode.appendChild(empty);
      return;
    }

    const list = createNode("dl", "bbm-ui-editor-status-list");
    list.append(
      createInfoRow("Element-ID", element.elementId),
      createInfoRow("Bezeichnung", element.label),
      createInfoRow("Typ", element.type),
      createInfoRow("Scope", element.scope),
      createInfoRow("Parent", element.parentId || "Root"),
      createInfoRow("Capabilities", formatList(element.capabilities)),
      createInfoRow("Erlaubte Aenderungen", formatList(element.allowedChanges)),
      createInfoRow("M53 aenderbar", element.m53Editable ? "Ja" : "Nein"),
      createInfoRow("M53 Sperre", element.m53Editable ? "keine" : element.m53LockReason)
    );
    this.detailsNode.appendChild(list);
  }


  renderChange() {
    if (!this.changeNode) return;
    this.changeNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Layoutaenderung";
    const notice = createNode("p", "bbm-ui-editor-panel__notice");
    notice.textContent = "Layoutaenderungen werden in M53 nur fuer die aktuelle Sitzung gespeichert.";
    this.changeNode.append(title, notice);

    const element = this.selectedElement;
    if (!element) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = "Kein Element ausgewaehlt.";
      this.changeNode.appendChild(empty);
      return;
    }

    const currentVisible = this.currentLayoutState?.visible !== false;
    const locked = !element.m53Editable || !this.status?.runtimeStarted || !this.status?.adapterValid;
    const list = createNode("dl", "bbm-ui-editor-status-list");
    list.append(
      createInfoRow("Aktueller Zustand", currentVisible ? "Sichtbar" : "Ausgeblendet"),
      createInfoRow("UI-Scope", element.scope),
      createInfoRow("Layout-Scope", element.layoutScope),
      createInfoRow("Layoutprofil", element.layoutProfileId),
      createInfoRow("Speicher", "Sitzungsspeicher")
    );

    const select = createNode("select", "bbm-ui-editor-panel__select");
    const visibleOption = createNode("option");
    visibleOption.value = "true";
    visibleOption.textContent = "Sichtbar";
    const hiddenOption = createNode("option");
    hiddenOption.value = "false";
    hiddenOption.textContent = "Ausgeblendet";
    select.append(visibleOption, hiddenOption);
    select.value = String(this.desiredVisible !== false);
    select.disabled = locked;
    select.addEventListener("change", () => { this.desiredVisible = select.value === "true"; });

    const fieldLabel = createNode("label", "bbm-ui-editor-panel__field");
    fieldLabel.textContent = "Gewuenschter Zustand";
    fieldLabel.appendChild(select);

    const draftBox = createNode("div", "bbm-ui-editor-panel__draft");
    if (this.currentDraft) {
      const draft = this.currentDraft;
      const draftList = createNode("dl", "bbm-ui-editor-status-list");
      draftList.append(
        createInfoRow("elementId", draft.elementId),
        createInfoRow("Elementbezeichnung", draft.elementLabel),
        createInfoRow("UI-Scope", draft.uiScope),
        createInfoRow("Layout-Scope", draft.layoutScope),
        createInfoRow("Layoutprofil", draft.layoutProfileId),
        createInfoRow("Bisheriger Wert", String(draft.previousValue)),
        createInfoRow("Neuer Wert", String(draft.nextValue)),
        createInfoRow("Operation", draft.operation),
        createInfoRow("Validierungsstatus", draft.valid ? "gueltig" : "abgelehnt"),
        createInfoRow("Blockcode", draft.blockCode || "kein Block")
      );
      draftBox.appendChild(draftList);
    } else {
      draftBox.textContent = "Noch kein Entwurf erstellt.";
    }

    const createButton = createNode("button", "bbm-ui-editor-panel__secondary");
    createButton.type = "button";
    createButton.textContent = "Entwurf erstellen";
    createButton.disabled = locked;
    createButton.addEventListener("click", () => this.createDraft().catch((error) => this.showLoadError(error)));

    const applyButton = createNode("button", "bbm-ui-editor-panel__secondary");
    applyButton.type = "button";
    applyButton.textContent = "Anwenden";
    applyButton.disabled = locked || !this.currentDraft?.valid || this.applyBusy;
    applyButton.addEventListener("click", () => this.applyDraft().catch((error) => this.showLoadError(error)));

    const discardButton = createNode("button", "bbm-ui-editor-panel__secondary");
    discardButton.type = "button";
    discardButton.textContent = "Entwurf verwerfen";
    discardButton.disabled = !this.currentDraft;
    discardButton.addEventListener("click", () => this.discardDraft().catch((error) => this.showLoadError(error)));

    const resetButton = createNode("button", "bbm-ui-editor-panel__secondary");
    resetButton.type = "button";
    resetButton.textContent = "Layout zuruecksetzen";
    resetButton.disabled = !element || this.resetBusy;
    resetButton.addEventListener("click", () => this.resetLayout().catch((error) => this.showLoadError(error)));

    const reloadButton = createNode("button", "bbm-ui-editor-panel__secondary");
    reloadButton.type = "button";
    reloadButton.textContent = "Layoutstatus neu laden";
    reloadButton.addEventListener("click", () => this.refresh().catch((error) => this.showLoadError(error)));

    const actions = createNode("div", "bbm-ui-editor-panel__actions");
    actions.append(createButton, applyButton, discardButton, resetButton, reloadButton);
    this.changeNode.append(list, fieldLabel, draftBox, actions);
  }

  async createDraft() {
    const result = await window.bbmDb?.uiEditorCreateChangeDraft?.({ visible: this.desiredVisible });
    if (!result?.ok && this.errorNode) setNeutralError(this.errorNode, result);
    await this.refresh();
  }

  async applyDraft() {
    this.applyBusy = true;
    const result = await window.bbmDb?.uiEditorApplyChangeDraft?.({});
    this.applyBusy = false;
    if (!result?.ok && this.errorNode) setNeutralError(this.errorNode, result);
    await this.refresh();
  }

  async discardDraft() {
    await window.bbmDb?.uiEditorDiscardChangeDraft?.();
    await this.refresh();
  }

  async resetLayout() {
    this.resetBusy = true;
    const result = await window.bbmDb?.uiEditorResetLayoutState?.({ elementId: this.selectedElement?.elementId });
    this.resetBusy = false;
    if (!result?.ok && this.errorNode) setNeutralError(this.errorNode, result);
    await this.refresh();
  }

  async selectElement(elementId) {
    const api = window.bbmDb || {};
    if (typeof api.uiEditorSelectElement !== "function") {
      this.status = { ok: false, blockCode: "BBM_UI_EDITOR_BRIDGE_MISSING" };
      this.renderAll();
      return;
    }
    const result = await api.uiEditorSelectElement({ elementId });
    if (!result?.ok) {
      if (this.errorNode) setNeutralError(this.errorNode, result);
      return;
    }
    await this.refresh();
  }
}

export function createBbmUiEditorStatusPanel(options = {}) {
  return new BbmUiEditorStatusPanel(options);
}
