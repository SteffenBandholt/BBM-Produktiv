import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../../shared/text/topTextPresentation.js";

export class TopsList {
  constructor({ onRowClick, onLevel1Toggle } = {}) {
    this.onRowClick = typeof onRowClick === "function" ? onRowClick : null;
    this.onLevel1Toggle = typeof onLevel1Toggle === "function" ? onLevel1Toggle : null;
    this.root = document.createElement("ul");
    this.root.setAttribute("data-bbm-tops-list-v2", "true");
  }

  setItems(items = []) {
    this.root.innerHTML = "";
    const rows = Array.isArray(items) ? items : [];
    for (const item of rows) {
      this.root.appendChild(this._renderRow(item));
    }
  }

  _renderRow(item = {}) {
    const rowEl = document.createElement("li");
    rowEl.className = "bbm-tops-list-row";
    const moveState =
      String(item.moveState || "").trim() ||
      (item.isMoveMode ? (item.isMoveTarget ? "target" : "blocked") : "normal");
    rowEl.dataset.topId = String(item.id || "");
    rowEl.dataset.topLevel = String(item.level || 1);
    rowEl.dataset.isSelected = item.isSelected ? "true" : "false";
    rowEl.dataset.isMoveMode = item.isMoveMode ? "true" : "false";
    rowEl.dataset.moveState = moveState;
    rowEl.dataset.visualState = String(item.visualState || "carried");
    rowEl.dataset.titleTone = String(item.titleTone || "black");
    rowEl.dataset.isLevel1 = item.isTitle ? "true" : "false";
    rowEl.dataset.level1Collapsed = item.isTitle && item.isLevel1Collapsed ? "true" : "false";
    rowEl.dataset.level1TopId = String(item.level1TopId || "");
    rowEl.dataset.isMoveTarget =
      item.isMoveTarget === null || item.isMoveTarget === undefined
        ? "none"
        : item.isMoveTarget
          ? "true"
          : "false";

    const row = document.createElement("div");
    row.className = "bbm-tops-list-row-grid";

    const num = document.createElement("div");
    num.className = "bbm-tops-list-row-number";

    const numLine = document.createElement("div");
    numLine.className = "bbm-tops-list-row-number-line";

    if (item.isTitle && this.onLevel1Toggle) {
      const collapseButton = document.createElement("button");
      collapseButton.type = "button";
      collapseButton.className = "bbm-tops-list-row-collapse-toggle";
      collapseButton.dataset.collapsed = item.isLevel1Collapsed ? "true" : "false";
      collapseButton.textContent = item.isLevel1Collapsed ? "\u25B8" : "\u25BE";
      collapseButton.disabled = !!item.isMoveMode || !item.canToggleLevel1;
      collapseButton.title = item.isLevel1Collapsed ? "Aufklappen" : "Einklappen";
      collapseButton.setAttribute("aria-label", item.isLevel1Collapsed ? "Aufklappen" : "Einklappen");
      collapseButton.setAttribute("aria-expanded", item.isLevel1Collapsed ? "false" : "true");
      collapseButton.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (collapseButton.disabled) return;
        if (this.onLevel1Toggle) this.onLevel1Toggle(item);
      };
      numLine.appendChild(collapseButton);
    }

    const numLabel = document.createElement("span");
    numLabel.className = "bbm-tops-list-row-number-value";
    numLabel.textContent = `${item.number || ""}`;
    numLine.appendChild(numLabel);
    num.appendChild(numLine);

    if (item.showStar) {
      const star = document.createElement("span");
      star.className = "bbm-tops-list-row-star";
      star.textContent = "*";
      numLabel.append(" ", star);
    }

    const createdAt = String(item.createdAt || "").trim();
    if (createdAt && !item.isTitle) {
      const createdAtLine = document.createElement("div");
      createdAtLine.className = "bbm-tops-list-row-number-date";
      createdAtLine.textContent = createdAt;
      num.appendChild(createdAtLine);
    }

    const text = document.createElement("div");
    text.className = "bbm-tops-list-row-text";

    const title = document.createElement("div");
    title.className = "bbm-tops-list-row-title";
    title.dataset.tone = String(item.titleTone || "black");
    title.textContent = normalizeTopShortText(item.title);

    const preview = document.createElement("div");
    preview.className = "bbm-tops-list-row-preview";
    const previewText = normalizeTopLongText(item.preview);
    preview.textContent = previewText;
    preview.dataset.hasPreview = previewText ? "true" : "false";

    text.append(title);
    if (item.showLongtextInList !== false && previewText) {
      text.append(preview);
    }

    const meta = document.createElement("div");
    meta.className = "bbm-tops-list-row-meta";
    const statusTokens = new Set(["-", "offen", "in arbeit", "erledigt", "blockiert", "verzug"]);
    for (const [index, line] of (item.meta || []).entries()) {
      const el = document.createElement("div");
      el.className = "bbm-tops-list-row-meta-line";
      const value = String(line || "").trim();
      const normalized = value.toLowerCase();
      const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const isDeDate = /^\d{2}\.\d{2}\.\d{4}$/.test(value);
      if (statusTokens.has(normalized)) {
        el.classList.add("bbm-tops-list-row-meta-line-status");
      } else if (!isIsoDate && !isDeDate) {
        el.classList.add("bbm-tops-list-row-meta-line-responsible");
      } else if (index === 2) {
        el.classList.add("bbm-tops-list-row-meta-line-responsible");
      }
      el.textContent = line;
      if (index === 1 && item.showAmpelInList !== false && item.ampelColor) {
        const dot = document.createElement("span");
        dot.className = "bbm-tops-list-row-ampel";
        dot.dataset.color = String(item.ampelColor || "");
        dot.setAttribute("aria-label", `Ampel ${item.ampelColor}`);
        el.append(" ", dot);
      }
      meta.appendChild(el);
    }

    row.append(num, text, meta);
    rowEl.appendChild(row);

    rowEl.onclick = async () => {
      if (moveState === "current" || moveState === "blocked") return;
      if (this.onRowClick) await this.onRowClick(item);
    };

    return rowEl;
  }
}
