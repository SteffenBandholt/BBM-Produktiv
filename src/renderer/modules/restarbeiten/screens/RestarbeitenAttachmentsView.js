function normalizeText(value) {
  return String(value ?? "").trim();
}

function getDisplayLabel(attachment) {
  return normalizeText(attachment?.caption) || normalizeText(attachment?.file_name) || "Ohne Bezeichnung";
}

import "./restarbeitenAttachments.css";

export default class RestarbeitenAttachmentsView {
  constructor({ documentRef = globalThis.document, onSetPrimary = null, onImportAttachments = null, onDeleteAttachment = null } = {}) {
    this.document = documentRef || globalThis.document;
    this.onSetPrimary = typeof onSetPrimary === "function" ? onSetPrimary : null;
    this.root = null;
    this.attachments = [];
    this.onImportAttachments = typeof onImportAttachments === "function" ? onImportAttachments : null;
    this.onDeleteAttachment = typeof onDeleteAttachment === "function" ? onDeleteAttachment : null;
  }

  render() {
    const root = this.document.createElement("section");
    root.className = "restarbeiten-attachments";
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
    actions.className = "restarbeiten-attachments__actions";
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
    wrapper.className = "restarbeiten-attachments__grid";

    const primary = this.attachments.find((a) => Number(a?.is_primary) === 1 || a?.is_primary === true) || this.attachments[0];
    const others = this.attachments.filter((a) => a !== primary);

    const primaryColumn = doc.createElement("div");
    primaryColumn.className = "restarbeiten-attachments__primary";
    primaryColumn.append(this._buildCard(primary, true));
    wrapper.append(primaryColumn);

    const rightCol = doc.createElement("div");
    rightCol.className = "restarbeiten-attachments__secondary";
    for (const attachment of others.slice(0, 2)) rightCol.append(this._buildCard(attachment, false));
    wrapper.append(rightCol);

    this.root.replaceChildren(actions, wrapper);
  }

  _buildCard(attachment, isPrimary) {
    const doc = this.document;
    const card = doc.createElement("article");
    card.className = isPrimary
      ? "restarbeiten-attachments__card restarbeiten-attachments__card--primary"
      : "restarbeiten-attachments__card";

    const imageFrame = doc.createElement("div");
    imageFrame.className = "restarbeiten-attachments__imageFrame";

    const path = normalizeText(attachment?.file_path);
    if (path) {
      const img = doc.createElement("img");
      img.src = path;
      img.alt = getDisplayLabel(attachment);
      img.className = "restarbeiten-attachments__image";
      imageFrame.append(img);
    } else {
      const placeholder = doc.createElement("div");
      placeholder.className = "restarbeiten-attachments__imageFallback";
      placeholder.textContent = "Kein Bildpfad vorhanden.";
      imageFrame.append(placeholder);
    }
    card.append(imageFrame);

    const label = doc.createElement("p");
    label.className = "restarbeiten-attachments__caption";
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

    const deleteBtn = doc.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Foto entfernen";
    deleteBtn.disabled = !normalizeText(attachment?.id) || !this.onDeleteAttachment;
    deleteBtn.addEventListener("click", () => {
      const id = normalizeText(attachment?.id);
      if (!id || !this.onDeleteAttachment) return;
      const confirmed = typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm("Foto wirklich entfernen?")
        : false;
      if (!confirmed) return;
      this.onDeleteAttachment(id);
    });

    card.append(label, radioWrap, deleteBtn);
    return card;
  }
}
