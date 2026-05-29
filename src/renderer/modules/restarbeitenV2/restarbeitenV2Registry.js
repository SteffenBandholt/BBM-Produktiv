function createEntry(id, label, kind, parentId, editable, ops, selector, extras = {}) {
  const entry = {
    id,
    label,
    kind,
    editable,
    ops,
    selector,
    ...extras,
  };
  if (parentId) {
    entry.parentId = parentId;
  }
  return entry;
}

export function createRestarbeitenV2Registry() {
  return [
    createEntry(
      "restarbeitenV2.root",
      "Restarbeiten V2",
      "frame",
      null,
      false,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.root"]'
    ),
    createEntry(
      "restarbeitenV2.header",
      "Header",
      "frame",
      "restarbeitenV2.root",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.header"]'
    ),
    createEntry(
      "restarbeitenV2.header.context",
      "Kontext",
      "field",
      "restarbeitenV2.header",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.header.context"]'
    ),
    createEntry(
      "restarbeitenV2.header.status",
      "Status",
      "field",
      "restarbeitenV2.header",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.header.status"]'
    ),
    createEntry(
      "restarbeitenV2.header.filter",
      "Filter",
      "control",
      "restarbeitenV2.header",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.header.filter"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane",
      "Quicklane",
      "frame",
      "restarbeitenV2.root",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.lock",
      "Vorhaengeschloss",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.lock"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.neu",
      "Neu",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.neu"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.filterOffen",
      "Filter Offen",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.filterOffen"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.filterErledigt",
      "Filter Erledigt",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.filterErledigt"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.filterAlle",
      "Filter Alle",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.filterAlle"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.foto",
      "Foto",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.foto"]'
    ),
    createEntry(
      "restarbeitenV2.quicklane.diktat",
      "Diktat",
      "control",
      "restarbeitenV2.quicklane",
      false,
      ["move", "hide"],
      '[data-ui-v2-id="restarbeitenV2.quicklane.diktat"]'
    ),
    createEntry(
      "restarbeitenV2.main",
      "Main",
      "frame",
      "restarbeitenV2.root",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main"]'
    ),
    createEntry(
      "restarbeitenV2.main.liste",
      "Liste",
      "frame",
      "restarbeitenV2.main",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main.liste"]'
    ),
    createEntry(
      "restarbeitenV2.main.nummer",
      "Nummer",
      "field",
      "restarbeitenV2.main.liste",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main.nummer"]'
    ),
    createEntry(
      "restarbeitenV2.main.textbereich",
      "Textbereich",
      "field",
      "restarbeitenV2.main.liste",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main.textbereich"]'
    ),
    createEntry(
      "restarbeitenV2.main.verortung",
      "Verortung",
      "field",
      "restarbeitenV2.main.liste",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main.verortung"]'
    ),
    createEntry(
      "restarbeitenV2.main.meta",
      "Meta",
      "field",
      "restarbeitenV2.main.liste",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.main.meta"]'
    ),
    createEntry(
      "restarbeitenV2.footer",
      "Footer",
      "frame",
      "restarbeitenV2.root",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer"]'
    ),
    createEntry(
      "restarbeitenV2.footer.kurztext",
      "Kurztext",
      "field",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.kurztext"]'
    ),
    createEntry(
      "restarbeitenV2.footer.langtext",
      "Langtext",
      "field",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.langtext"]'
    ),
    createEntry(
      "restarbeitenV2.footer.verortung",
      "Verortung",
      "field",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.verortung"]'
    ),
    createEntry(
      "restarbeitenV2.footer.meta",
      "Meta",
      "field",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.meta"]'
    ),
    createEntry(
      "restarbeitenV2.footer.fotos",
      "Fotos",
      "frame",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.fotos"]',
      { gridEditable: true, minWidth: 120, minHeight: 60 }
    ),
    createEntry(
      "restarbeitenV2.footer.notiz",
      "Notiz",
      "field",
      "restarbeitenV2.footer",
      true,
      ["move", "resize", "hide"],
      '[data-ui-v2-id="restarbeitenV2.footer.notiz"]',
      { gridEditable: true, minWidth: 120, minHeight: 40 }
    ),
  ];
}
