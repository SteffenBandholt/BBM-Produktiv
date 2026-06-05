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

export function buildRestarbeitenList({
  items = [],
  selectedId = null,
  showAmpel = true,
  showLongtext = true,
  onSelect,
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
    row.setAttribute("aria-selected", String(item.id === selectedId));
    row.addEventListener("click", () => onSelect?.(item.id));

    const numberColumn = createEl("div", { uiId: "restarbeiten.record.numberColumn" });
    appendText(numberColumn, "bbm-restarbeiten-record__number", item.numberLine, "restarbeiten.record.number");
    appendText(numberColumn, "bbm-restarbeiten-record__date", item.dateLine, "restarbeiten.record.createdAt");

    const contentColumn = createEl("div", { uiId: "restarbeiten.record.contentColumn" });
    appendText(contentColumn, "bbm-restarbeiten-record__short", item.workLine1, "restarbeiten.record.shortText");
    if (showLongtext) {
      appendText(contentColumn, "bbm-restarbeiten-record__long", item.workLine2, "restarbeiten.record.longText");
    }

    const metaColumn = createEl("div", { className: "bbm-restarbeiten-record__meta", uiId: "restarbeiten.record.metaColumn" });
    const dueLine = createEl("div", { uiId: "restarbeiten.record.dueDate" });
    dueLine.textContent = `Fertig bis: ${item.dueDateLabel}`;
    if (showAmpel) {
      const ampel = createEl("span", { className: "bbm-restarbeiten-ampel", uiId: "restarbeiten.record.ampel" });
      ampel.dataset.state = item.ampelState || "neutral";
      dueLine.append(" ", ampel);
    }
    metaColumn.appendChild(dueLine);
    appendText(metaColumn, "", item.statusLabel, "restarbeiten.record.status");
    appendText(metaColumn, "", item.responsibleLabel, "restarbeiten.record.responsible");

    row.append(numberColumn, contentColumn, metaColumn);
    records.appendChild(row);
  }

  return records;
}
