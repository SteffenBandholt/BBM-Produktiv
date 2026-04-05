export class TopsListRow {
  constructor({ item, onClick } = {}) {
    this.item = item || {};
    this.onClick = typeof onClick === "function" ? onClick : null;
    this.root = document.createElement("li");
    this.root.style.listStyle = "none";
    this.root.style.margin = "6px 0";
    this.root.style.padding = "8px 10px";
    this.root.style.borderRadius = "10px";
    this.root.style.border = "1px solid #dfe7f1";
    this.root.style.cursor = "pointer";

    this.root.dataset.topId = String(this.item.id || "");
    this.root.dataset.topLevel = String(this.item.level || 1);
    this.root.dataset.isSelected = this.item.isSelected ? "true" : "false";
    this.root.dataset.isMoveMode = this.item.isMoveMode ? "true" : "false";

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "72px minmax(0,1fr) minmax(200px,260px)";
    row.style.gap = "10px";
    row.style.alignItems = "start";

    const num = document.createElement("div");
    num.textContent = `${this.item.number || ""}`;
    num.style.opacity = "0.88";
    num.style.fontVariantNumeric = "tabular-nums";

    const text = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = this.item.title || "";
    title.style.fontWeight = this.item.isSelected ? "700" : "600";
    title.style.lineHeight = "1.35";
    const preview = document.createElement("div");
    preview.textContent = this.item.preview || "";
    preview.style.display = this.item.preview ? "" : "none";
    preview.style.marginTop = "4px";
    preview.style.fontSize = "8.5pt";
    preview.style.opacity = "0.9";
    text.append(title, preview);

    const meta = document.createElement("div");
    meta.style.fontSize = "8.5pt";
    meta.style.opacity = "0.9";
    meta.style.display = "grid";
    meta.style.gap = "2px";
    for (const line of this.item.meta || []) {
      const el = document.createElement("div");
      el.textContent = line;
      meta.appendChild(el);
    }

    row.append(num, text, meta);
    this.root.appendChild(row);

    const indent = Math.max(0, Number(this.item.level || 1) - 1) * 12;
    this.root.style.marginLeft = `${indent}px`;
    if (this.item.isSelected) {
      this.root.style.background = "#eaf3ff";
      this.root.style.border = "1px solid #7aa7ff";
      this.root.style.boxShadow = "0 0 0 2px rgba(122, 167, 255, 0.16)";
    } else {
      this.root.style.background = Number(this.item.level || 1) === 1 ? "#f7fafc" : "#ffffff";
    }
    if (this.item.isMoveMode && this.item.isMoveTarget === false) {
      this.root.style.opacity = "0.6";
    }
    if (this.item.isMoveMode && this.item.isMoveTarget === true) {
      this.root.style.outline = "2px dashed #7aa7ff";
      this.root.style.background = "#eef7ff";
    }

    this.root.onclick = async () => {
      if (this.onClick) await this.onClick(this.item);
    };
  }
}

