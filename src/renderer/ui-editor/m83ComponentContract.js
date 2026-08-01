import {
  aggregateUiComponentContracts,
  validateUiComponentContracts,
} from "../../../node_modules/ui-editor-kit/dist/ui-component-contract.mjs";

export const BBM_M83_SUPPORTED_OPERATIONS = Object.freeze([
  "move", "resize", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility",
  "spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset",
  "fitTableToViewport", "resizeColumnsProportionally", "setHorizontalOverflowMode",
  "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "setRowHeightMode",
  "resetTableColumn", "resetTable",
]);

export const GROUP_LAYOUT = Object.freeze(["move", "setVisibility"]);
export const ZONE_HEIGHT_LAYOUT = Object.freeze(["resizeHeight", "setVisibility"]);
export const TEXT_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"]);
export const COMPACT_TEXT_LAYOUT = Object.freeze(["move", "textResize", "setVisibility"]);
export const FIELD_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"]);
export const BUTTON_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
export const ICON_LAYOUT = Object.freeze(["resizeWidth", "resizeHeight", "setVisibility"]);
export const TABLE_LAYOUT = Object.freeze(["resizeHeight", "setVisibility", "fitTableToViewport", "resizeColumnsProportionally", "setRowHeightMode", "resetTable"]);
export const COLUMN_LAYOUT = Object.freeze(["resizeWidth", "textResize", "setVisibility", "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "resetTableColumn"]);
export const SPACING_LAYOUT = Object.freeze(["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"]);
export const DOMAIN_LOCKS = Object.freeze(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);

export function defaultM83Baseline(values = {}) {
  return Object.freeze({
    x: 0, y: 0, width: 100, height: 24, textOffsetX: 0, textOffsetY: 0,
    fontSize: 12, visible: true, spacing: {}, minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600,
    ...values,
  });
}

export function m83Element(values) {
  const allowedOps = Object.freeze([...(values.allowedOps || [])]);
  const selectionKind = values.selectionKind || ({
    root: "layoutZone", area: "layoutZone", group: "group", fieldGroup: "group",
    label: values.role === "status" ? "statusText" : "label", field: "field", button: "button",
    componentPart: "icon", statusIndicator: "icon", table: "table", tableHeader: "tableHeader",
    tableBody: "tableBody", tableRow: "tableRow", tableColumn: "column", tableHeaderCell: "tableHeaderCell",
    tableDataCell: "tableDataCell", tableFooter: "tableFooter", tableViewport: "tableViewport",
    horizontalScrollArea: "horizontalScrollArea",
  }[values.type] || "element");
  return Object.freeze({
    visible: true,
    editable: allowedOps.length > 0,
    ...values,
    stableIdSource: "declaration",
    semanticKey: values.semanticKey || values.id,
    registrationStatus: values.registrationStatus || (allowedOps.length > 0 ? "editorEnabled" : "editorContainer"),
    refKey: values.refKey || values.id,
    baseline: defaultM83Baseline(values.baseline),
    selectionKind,
    selectionLevels: Object.freeze([...(values.selectionLevels || [selectionKind])]),
    spacingTargets: Object.freeze([...(values.spacingTargets || [])]),
    operationEffects: Object.freeze({
      ...Object.fromEntries(allowedOps.map((operation) => [operation,
        selectionKind === "group" ? "groupWithChildren" : selectionKind === "layoutZone" ? "layoutZone" : "elementOnly"])),
      ...(values.operationEffects || {}),
    }),
    operationAffectedIds: Object.freeze({ ...(values.operationAffectedIds || {}) }),
    geometry: Object.freeze({ maximumStoredOffset: 2400, ...(values.geometry || {}) }),
    allowedOps,
    lockedOps: Object.freeze([...(values.lockedOps || [])]),
  });
}

export function m83DomainButton(values) {
  return m83Element({
    ...values,
    type: "button",
    role: "domainActionLayout",
    allowedOps: values.allowedOps || BUTTON_LAYOUT,
    lockedOps: DOMAIN_LOCKS,
    actionKind: values.actionKind || "domain",
  });
}

export function m83Slot(slotId, element, options = {}) {
  return Object.freeze({
    slotId,
    required: options.required !== false,
    referenceKind: options.referenceKind || "single",
    presence: options.presence || "always",
    requirements: Object.freeze({
      directSelection: element?.editable === true,
      ...(options.requirements || {}),
    }),
    element,
  });
}

export function m83Component({ componentId, scopeId, requiredSlots, slots }) {
  return Object.freeze({
    componentId,
    scopeId,
    requiredSlots: Object.freeze([...(requiredSlots || [])]),
    slots: Object.freeze([...(slots || [])]),
  });
}

export function aggregateBbmM83Components(components) {
  const aggregate = aggregateUiComponentContracts(components);
  const validation = validateUiComponentContracts({
    components: aggregate.components,
    registryElements: aggregate.elements,
    supportedOperations: BBM_M83_SUPPORTED_OPERATIONS,
  });
  if (!validation.ok) {
    const details = validation.errors.map((entry) => `${entry.code}: ${entry.componentId || "?"}/${entry.slotId || entry.elementId || "?"}`).join("; ");
    throw Object.assign(new Error(`BBM-Komponentenvertrag unvollstaendig: ${details}`), { code: "component_contract_invalid", details: validation.errors });
  }
  return aggregate;
}
