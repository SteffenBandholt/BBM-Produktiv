export class TopsListRow {
  constructor({ item, onClick } = {}) {
    this.item = item || {};
    this.onClick = typeof onClick === "function" ? onClick : null;
    this.root = document.createElement("li");
    this.root.className = "bbm-tops-list-row";

    this.root.dataset.topId = String(this.item.id || "");
    this.root.dataset.topLevel = String(this.item.level || 1);
    this.root.dataset.isSelected = this.item.isSelected ? "true" : "false";
    this.root.dataset.isMoveMode = this.item.isMoveMode ? "true" : "false";
    this.root.dataset.isMoveTarget =
      this.item.isMoveTarget === null || this.item.isMoveTarget === undefined
        ? "none"
        : this.item.isMoveTarget
          ? "true"
          : "false";

    const row = document.createElement("div");
    row.className = "bbm-tops-list-row-grid";

    const num = document.createElement("div");
    num.className = "bbm-tops-list-row-number";
    num.textContent = `${this.item.number || ""}`;

    const text = document.createElement("div");
    text.className = "bbm-tops-list-row-text";

    const title = document.createElement("div");
    title.className = "bbm-tops-list-row-title";
    title.textContent = this.item.title || "";

    const preview = document.createElement("div");
    preview.className = "bbm-tops-list-row-preview";
    preview.textContent = this.item.preview || "";
    preview.dataset.hasPreview = this.item.preview ? "true" : "false";

    text.append(title, preview);

    const meta = document.createElement("div");
    meta.className = "bbm-tops-list-row-meta";
    for (const line of this.item.meta || []) {
      const el = document.createElement("div");
      el.textContent = line;
      meta.appendChild(el);
    }

    row.append(num, text, meta);
    this.root.appendChild(row);

    const indent = Math.max(0, Number(this.item.level || 1) - 1) * 12;
    this.root.style.marginLeft = `${indent}px`;

    this.root.onclick = async () => {
      if (this.onClick) await this.onClick(this.item);
    };
  }
}
