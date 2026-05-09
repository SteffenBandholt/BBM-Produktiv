const PROTOKOLL_TOPS_LAYOUT = Object.freeze({
  tableKey: "protokoll_tops",
  moduleId: "protokoll",
  variant: "portrait",
  labels: Object.freeze({
    top: "TOP",
    text: "Gegenstand",
    meta: Object.freeze(["Status", "Fertig bis", "verantw"]),
  }),
  logicalFields: Object.freeze([
    Object.freeze({
      key: "topNumber",
      label: "TOP",
      uiState: "visible",
      pdfState: "visible",
      source: "ui number column / pdf number column",
      note: "top number stays the first logical field",
    }),
    Object.freeze({
      key: "shortText",
      label: "Gegenstand / Kurztext",
      uiState: "visible",
      pdfState: "visible",
      source: "ui title / pdf short text",
      note: "main text column stays the central content column",
    }),
    Object.freeze({
      key: "longText",
      label: "Langtext",
      uiState: "inline",
      pdfState: "inline",
      source: "ui preview text / pdf longText block",
      note: "no own column; rendered inside the text column when present",
    }),
    Object.freeze({
      key: "status",
      label: "Status",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "first meta line in both renderers",
    }),
    Object.freeze({
      key: "dueDate",
      label: "Fertig bis",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "second meta line in both renderers",
    }),
    Object.freeze({
      key: "responsible",
      label: "Verantwortlich",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "third meta line in both renderers",
    }),
    Object.freeze({
      key: "ampelSymbol",
      label: "Ampel/Symbol",
      uiState: "meta",
      pdfState: "meta",
      source: "ui symbol slot / pdf dot",
      note: "symbol slot stays inside the meta column",
    }),
  ]),
  notes: Object.freeze([
    "Pilot table for the first central layout definition.",
    "UI and PDF keep the current portrait widths and labels.",
    "Long text stays in the text area and is not a separate column.",
    "No editor UI, database, header, footer, or second PDF logic here.",
  ]),
  ui: Object.freeze({
    rootVars: Object.freeze({
      "--bbm-tops-list-number-col": "64px",
      "--bbm-tops-list-meta-col": "74px",
    }),
    gridTemplateColumns: "64px minmax(0, 1fr) minmax(50px, var(--bbm-tops-list-meta-col, 74px))",
  }),
  pdf: Object.freeze({
    rootVars: Object.freeze({
      "--bbm-top-col-nr-width": "23mm",
      "--bbm-top-col-text-padding-left": "0",
      "--bbm-top-col-text-padding-right": "1.5mm",
      "--bbm-top-col-meta-width": "15ch",
      "--bbm-top-col-meta-padding-left": "5mm",
      "--bbm-top-col-meta-font-size": "6.5pt",
      "--bbm-top-col-meta-head-font-size": "8pt",
    }),
    columns: Object.freeze({
      number: Object.freeze({
        key: "top",
        className: "colNr",
        width: "23mm",
        source: "src/renderer/print/print.css .topsTable .colNr",
      }),
      text: Object.freeze({
        key: "text",
        className: "colText",
        width: "auto",
        source: "src/renderer/print/print.css .topsTable .colText",
      }),
      meta: Object.freeze({
        key: "meta",
        className: "colMeta",
        width: "15ch",
        source: "src/renderer/print/print.css .topsTable .colMeta",
      }),
    }),
  }),
});

function _resolveLayout(layoutOverride) {
  if (!layoutOverride || typeof layoutOverride !== "object") {
    return PROTOKOLL_TOPS_LAYOUT;
  }
  return {
    ...PROTOKOLL_TOPS_LAYOUT,
    ...layoutOverride,
    labels: layoutOverride.labels || PROTOKOLL_TOPS_LAYOUT.labels,
    logicalFields: layoutOverride.logicalFields || PROTOKOLL_TOPS_LAYOUT.logicalFields,
    notes: layoutOverride.notes || PROTOKOLL_TOPS_LAYOUT.notes,
    ui: layoutOverride.ui || PROTOKOLL_TOPS_LAYOUT.ui,
    pdf: layoutOverride.pdf || PROTOKOLL_TOPS_LAYOUT.pdf,
  };
}

export function getProtokollTopsLayout() {
  return PROTOKOLL_TOPS_LAYOUT;
}

export function applyProtokollTopsUiLayout(target, layoutOverride) {
  if (!target?.style?.setProperty) return;
  const layout = _resolveLayout(layoutOverride);
  target.dataset.tableKey = layout.tableKey;
  target.dataset.layoutVariant = layout.variant;
  const uiLayout = layout.ui || PROTOKOLL_TOPS_LAYOUT.ui;
  for (const [key, value] of Object.entries(uiLayout.rootVars || {})) {
    target.style.setProperty(key, value);
  }
}

export function applyProtokollTopsPdfLayout(target, layoutOverride) {
  if (!target?.style?.setProperty) return;
  const layout = _resolveLayout(layoutOverride);
  target.dataset.tableKey = layout.tableKey;
  target.dataset.layoutVariant = layout.variant;
  const pdfLayout = layout.pdf || PROTOKOLL_TOPS_LAYOUT.pdf;
  for (const [key, value] of Object.entries(pdfLayout.rootVars || {})) {
    target.style.setProperty(key, value);
  }
}
