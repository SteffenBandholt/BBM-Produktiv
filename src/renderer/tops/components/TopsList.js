export class TopsList {
  constructor({ onRowClick } = {}) {
    this.onRowClick = typeof onRowClick === "function" ? onRowClick : null;
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
    rowEl.dataset.topId = String(item.id || "");
    rowEl.dataset.topLevel = String(item.level || 1);
    rowEl.dataset.isSelected = item.isSelected ? "true" : "false";
    rowEl.dataset.isMoveMode = item.isMoveMode ? "true" : "false";
    rowEl.dataset.visualState = String(item.visualState || "carried");
    rowEl.dataset.titleTone = String(item.titleTone || "black");
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
    num.textContent = `${item.number || ""}`;
    if (item.showStar) {
      const star = document.createElement("span");
      star.className = "bbm-tops-list-row-star";
      star.textContent = "*";
      num.append(" ", star);
    }

    const text = document.createElement("div");
    text.className = "bbm-tops-list-row-text";

    const title = document.createElement("div");
    title.className = "bbm-tops-list-row-title";
    title.dataset.tone = String(item.titleTone || "black");
    title.textContent = item.title || "";

    const preview = document.createElement("div");
    preview.className = "bbm-tops-list-row-preview";
    preview.textContent = item.preview || "";
    preview.dataset.hasPreview = item.preview ? "true" : "false";

    text.append(title, preview);

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
      if (index === 1 && item.ampelColor) {
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

    const indent = Math.max(0, Number(item.level || 1) - 1) * 12;
    rowEl.style.marginLeft = `${indent}px`;

    rowEl.onclick = async () => {
      if (this.onRowClick) await this.onRowClick(item);
    };

    return rowEl;
  }
}
