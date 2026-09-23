import FirmsUsageIntegrationView from "./FirmsUsageIntegrationView.js";

const PROJECT = "project_participant";

function isProjectParticipant(firm) {
  const value = firm?.uses?.projectParticipant ?? firm?.use_project_participant ?? firm?.project_participant;
  return value === true || Number(value) === 1;
}

function makeMarker() {
  const marker = document.createElement("span");
  marker.textContent = "P";
  marker.title = "Projektteilnehmer";
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

function renderMarker(container, firm) {
  container.innerHTML = "";
  if (isProjectParticipant(firm)) {
    container.append(makeMarker());
  } else {
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
    legend.textContent = "Kennzeichnung in der Firmenliste: P = Projektteilnehmer";
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
      usageHead.style.width = "42px";
      usageHead.title = "Projektverwendung";
    }

    Array.from(this.tableBodyEl?.children || []).forEach((row, index) => {
      const cell = row.querySelector?.("[data-bbm-usage-cell]") || null;
      const firm = this.firms?.[index] || null;
      if (!cell || !firm) return;
      Object.assign(cell.style, { width: "42px", whiteSpace: "nowrap" });
      let markers = cell.querySelector?.("[data-bbm-usage-markers]") || null;
      if (!markers) {
        cell.innerHTML = "";
        markers = document.createElement("div");
        markers.setAttribute("data-bbm-usage-markers", "true");
        cell.append(markers);
      }
      renderMarker(markers, firm);
    });
  }

  _renderFirmDetails() {
    super._renderFirmDetails();
    if (!this.selectedFirm || !this.detailBodyEl) return;
    const row = this.detailBodyEl.querySelector?.("[data-bbm-firm-usage-badges]") || null;
    if (row) renderMarker(row, this.selectedFirm);
  }
}
