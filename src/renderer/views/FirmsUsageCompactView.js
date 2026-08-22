import FirmsUsageIntegrationView from "./FirmsUsageIntegrationView.js";

const PROJECT = "project_participant";
const INVOICE = "invoice_customer";

function usageCodes(firm) {
  if (Array.isArray(firm?.usages)) {
    return firm.usages.map((value) => String(value || "").trim());
  }
  const result = [];
  if (firm?.project_participant === true) result.push(PROJECT);
  if (firm?.invoice_customer === true) result.push(INVOICE);
  return result;
}

function makeMarker(letter, title) {
  const marker = document.createElement("span");
  marker.textContent = letter;
  marker.title = title;
  Object.assign(marker.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    border: "1px solid #d6dde8",
    background: "#f8fafc",
    color: "#344054",
    fontSize: "11px",
    fontWeight: "800",
    lineHeight: "1",
    boxSizing: "border-box",
  });
  return marker;
}

function renderMarkers(container, firm, { invoiceLicensed = false } = {}) {
  container.innerHTML = "";
  const codes = new Set(usageCodes(firm));
  let count = 0;

  if (codes.has(PROJECT)) {
    container.append(makeMarker("P", "Projektteilnehmer"));
    count += 1;
  }
  if (invoiceLicensed && codes.has(INVOICE)) {
    container.append(makeMarker("R", "Rechnungskunde"));
    count += 1;
  }

  if (!count) {
    const none = document.createElement("span");
    none.textContent = "–";
    none.style.color = "#98a2b3";
    container.append(none);
  }
}

export default class FirmsUsageCompactView extends FirmsUsageIntegrationView {
  _injectUsageControls(options = {}) {
    super._injectUsageControls(options);

    const panel = this.firmGridEl?.querySelector?.("[data-bbm-firm-usages]") || null;
    if (!panel) return;

    panel.querySelector?.("[data-bbm-usage-legend]")?.remove();
    if (options?.mode !== "create") return;

    const legend = document.createElement("div");
    legend.setAttribute("data-bbm-usage-legend", "true");
    legend.textContent = this.invoiceModuleLicensed
      ? "Kennzeichnung in der Firmenliste: P = Projektteilnehmer · R = Rechnungskunde"
      : "Kennzeichnung in der Firmenliste: P = Projektteilnehmer";
    Object.assign(legend.style, {
      fontSize: "10.5px",
      color: "#667085",
      lineHeight: "1.3",
      marginTop: "2px",
    });
    panel.append(legend);
  }

  _renderFirmsOnly() {
    super._renderFirmsOnly();

    const headRow = this.tableBodyEl?.parentElement?.querySelector?.("thead tr") || null;
    const usageHead = headRow?.querySelector?.("[data-bbm-usage-head]") || null;
    if (usageHead) {
      usageHead.textContent = "Verw.";
      usageHead.style.width = this.invoiceModuleLicensed ? "72px" : "42px";
      usageHead.title = "Verwendung";
    }

    const rows = Array.from(this.tableBodyEl?.children || []);
    rows.forEach((row, index) => {
      const cell = row.querySelector?.("[data-bbm-usage-cell]") || null;
      const firm = this.firms?.[index] || null;
      if (!cell || !firm) return;

      Object.assign(cell.style, {
        width: this.invoiceModuleLicensed ? "72px" : "42px",
        whiteSpace: "nowrap",
      });

      let markers = cell.querySelector?.("[data-bbm-usage-markers]") || null;
      if (!markers) {
        cell.innerHTML = "";
        markers = document.createElement("div");
        markers.setAttribute("data-bbm-usage-markers", "true");
        Object.assign(markers.style, {
          display: "flex",
          alignItems: "center",
          gap: "4px",
        });
        cell.append(markers);
      }
      renderMarkers(markers, firm, { invoiceLicensed: this.invoiceModuleLicensed });
    });
  }

  _renderFirmDetails() {
    super._renderFirmDetails();
    if (!this.selectedFirm || !this.detailBodyEl) return;

    const row = this.detailBodyEl.querySelector?.("[data-bbm-firm-usage-badges]") || null;
    if (!row) return;
    renderMarkers(row, this.selectedFirm, { invoiceLicensed: this.invoiceModuleLicensed });
  }
}
