function createEl(tag, { className = "", text = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

function appendText(parent, className, text, uiId = "") {
  const el = createEl("div", { className, text, uiId });
  parent.appendChild(el);
  return el;
}

export function buildRestarbeitenTableHeader() {
  const header = createEl("div", {
    className: "bbm-restarbeiten-table-header",
    uiId: "restarbeiten.main.tableHeader",
  });
  const number = createEl("div", {
    className: "bbm-restarbeiten-table-header__number",
    text: "Nr.",
    uiId: "restarbeiten.main.tableHeader.number",
  });
  const subject = createEl("div", {
    className: "bbm-restarbeiten-table-header__subject",
    text: "Gegenstand",
    uiId: "restarbeiten.main.tableHeader.subject",
  });
  const meta = createEl("div", { className: "bbm-restarbeiten-table-header__meta" });
  appendText(meta, "", "Fertig bis", "restarbeiten.main.tableHeader.dueDate");
  appendText(meta, "", "Status", "restarbeiten.main.tableHeader.status");
  appendText(meta, "", "Verantw.", "restarbeiten.main.tableHeader.responsible");
  header.append(number, subject, meta);
  return header;
}

export function buildRestarbeitenList({
  items = [],
  selectedId = null,
  showAmpel = true,
  showLongtext = true,
  onSelect,
  onPhotos,
} = {}) {
  const records = createEl("div", {
    className: "bbm-restarbeiten-records",
    uiId: "restarbeiten.main.records",
  });

  if (!items.length) {
    records.appendChild(
      createEl("div", {
        className: "bbm-restarbeiten-empty",
        text: "Keine Restarbeiten vorhanden.",
      })
    );
    return records;
  }

  for (const item of items) {
    const row = createEl("button", { className: "bbm-restarbeiten-record" });
    row.type = "button";
    row.setAttribute("data-ui-editor-template-id", "restarbeiten.record");
    row.setAttribute("data-bbm-restarbeiten-record-id", String(item.id ?? ""));
    row.setAttribute("data-fachlich-vollstaendig", String(item.isFachlichVollstaendig !== false));
    row.setAttribute("aria-selected", String(item.id === selectedId));
    row.addEventListener("click", () => onSelect?.(item.id));

    const numberColumn = createEl("div", { uiId: "restarbeiten.record.numberColumn" });
    appendText(
      numberColumn,
      "bbm-restarbeiten-record__number",
      item.numberLine === "\u2014" ? item.numberLine : `#${item.numberLine}`,
      "restarbeiten.record.number"
    );
    appendText(numberColumn, "bbm-restarbeiten-record__date", item.dateLine, "restarbeiten.record.createdAt");
    appendText(numberColumn, "bbm-restarbeiten-record__class", item.itemClassLabel, "restarbeiten.record.itemClass");
    const photos = appendText(numberColumn, "bbm-restarbeiten-record__photos", "Fotos", "restarbeiten.record.photos");
    photos.setAttribute("role", "button");
    photos.setAttribute("tabindex", "0");
    photos.addEventListener("click", (event) => {
      event?.stopPropagation?.();
      onPhotos?.(item.id);
    });

    const contentColumn = createEl("div", { uiId: "restarbeiten.record.contentColumn" });
    appendText(contentColumn, "bbm-restarbeiten-record__location", item.locationLine, "restarbeiten.record.location");
    appendText(contentColumn, "bbm-restarbeiten-record__short", item.shortTextLine || item.workLine1, "restarbeiten.record.shortText");
    if (showLongtext) {
      appendText(contentColumn, "bbm-restarbeiten-record__long", item.longTextLine || item.workLine2, "restarbeiten.record.longText");
    }

    const metaColumn = createEl("div", { className: "bbm-restarbeiten-record__meta", uiId: "restarbeiten.record.metaColumn" });
    const dueLine = createEl("div", { uiId: "restarbeiten.record.dueDate" });
    dueLine.className = "bbm-restarbeiten-record__due";
    dueLine.textContent = item.dueDateLabel;
    metaColumn.appendChild(dueLine);
    if (showAmpel) {
      const ampel = createEl("span", { className: "bbm-restarbeiten-ampel", uiId: "restarbeiten.record.ampel" });
      ampel.dataset.state = item.ampelState || "neutral";
      metaColumn.appendChild(ampel);
    }
    appendText(metaColumn, "", item.statusLabel, "restarbeiten.record.status");
    appendText(metaColumn, "", item.responsibleLabel, "restarbeiten.record.responsible");
    if (item.requiredFieldSummary) {
      appendText(metaColumn, "bbm-restarbeiten-record__required", item.requiredFieldSummary);
    }

    row.append(numberColumn, contentColumn, metaColumn);
    records.appendChild(row);
  }

  return records;
}
