function normalizeText(value) {
  return String(value ?? "").trim();
}

function getDisplayLabel(attachment) {
  return normalizeText(attachment?.caption) || normalizeText(attachment?.file_name) || "Ohne Bezeichnung";
}

export default class RestarbeitenAttachmentsView {
  constructor({ documentRef = globalThis.document, onSetPrimary = null, onImportAttachments = null } = {}) {
    this.document = documentRef || globalThis.document;
    this.onSetPrimary = typeof onSetPrimary === "function" ? onSetPrimary : null;
    this.root = null;
    this.attachments = [];
    this.onImportAttachments = typeof onImportAttachments === "function" ? onImportAttachments : null;
  }

  render() {
    const root = this.document.createElement("section");
    root.style.display = "grid";
    root.style.gap = "8px";
    this.root = root;
    this._renderContent();
    return root;
  }

  setAttachments(attachments) {
    this.attachments = Array.isArray(attachments) ? attachments.slice(0, 3) : [];
    this._renderContent();
  }

  _renderContent() {
    if (!this.root) return;
    const doc = this.document;
    const actions = doc.createElement("div");
    actions.style.display = "grid";
    actions.style.gap = "6px";
    if (this.attachments.length < 3 && this.onImportAttachments) {
      const addBtn = doc.createElement("button");
      addBtn.type = "button";
      addBtn.textContent = "Foto hinzufügen";
      addBtn.addEventListener("click", () => this.onImportAttachments());
      actions.append(addBtn);
    } else if (this.attachments.length >= 3) {
      const maxHint = doc.createElement("div");
      maxHint.textContent = "Maximal 3 Fotos vorhanden.";
      actions.append(maxHint);
    }

    if (!this.attachments.length) {
      const empty = doc.createElement("div");
      empty.textContent = "Noch keine Fotos vorhanden.";
      this.root.replaceChildren(actions, empty);
      return;
    }

    const wrapper = doc.createElement("div");
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns = "2fr 1fr";
    wrapper.style.gap = "10px";

    const primary = this.attachments.find((a) => Number(a?.is_primary) === 1 || a?.is_primary === true) || this.attachments[0];
    const others = this.attachments.filter((a) => a !== primary);

    wrapper.append(this._buildCard(primary, true));

    const rightCol = doc.createElement("div");
    rightCol.style.display = "grid";
    rightCol.style.gap = "8px";
    for (const attachment of others) rightCol.append(this._buildCard(attachment, false));
    wrapper.append(rightCol);

    this.root.replaceChildren(actions, wrapper);
  }

  _buildCard(attachment, isPrimary) {
    const doc = this.document;
    const card = doc.createElement("article");
    card.style.border = isPrimary ? "2px solid #3b82f6" : "1px solid var(--card-border, #cfcfcf)";
    card.style.borderRadius = "10px";
    card.style.padding = "8px";
    card.style.display = "grid";
    card.style.gap = "6px";

    const path = normalizeText(attachment?.file_path);
    if (path) {
      const img = doc.createElement("img");
      img.src = path;
      img.alt = getDisplayLabel(attachment);
      img.style.width = "100%";
      img.style.height = isPrimary ? "140px" : "90px";
      img.style.objectFit = "cover";
      card.append(img);
    } else {
      const placeholder = doc.createElement("div");
      placeholder.textContent = "Kein Bildpfad vorhanden.";
      card.append(placeholder);
    }

    const label = doc.createElement("div");
    label.textContent = getDisplayLabel(attachment);

    const radioWrap = doc.createElement("label");
    const radio = doc.createElement("input");
    radio.type = "radio";
    radio.name = "restarbeiten-primary-attachment";
    radio.value = normalizeText(attachment?.id);
    radio.checked = !!isPrimary;
    radio.disabled = !radio.value;
    radio.addEventListener("change", () => {
      if (!radio.checked || !this.onSetPrimary) return;
      this.onSetPrimary(radio.value);
    });
    const caption = doc.createElement("span");
    caption.textContent = " Hauptfoto";
    radioWrap.append(radio, caption);

    card.append(label, radioWrap);
    return card;
  }
}
