import { TopsListRow } from "./TopsListRow.js";

export class TopsList {
  constructor({ onRowClick } = {}) {
    this.onRowClick = typeof onRowClick === "function" ? onRowClick : null;
    this.root = document.createElement("ul");
    this.root.setAttribute("data-bbm-tops-list-v2", "true");
    this.root.style.margin = "0";
    this.root.style.padding = "10px 0 12px";
  }

  setItems(items = []) {
    this.root.innerHTML = "";
    const rows = Array.isArray(items) ? items : [];
    for (const item of rows) {
      const row = new TopsListRow({
        item,
        onClick: this.onRowClick,
      });
      this.root.appendChild(row.root);
    }
  }
}

