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

export const UNIVERSAL_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
export const GROUP_LAYOUT = UNIVERSAL_LAYOUT;
export const ZONE_HEIGHT_LAYOUT = UNIVERSAL_LAYOUT;
export const TEXT_LAYOUT = Object.freeze([...UNIVERSAL_LAYOUT, "textResize"]);
export const COMPACT_TEXT_LAYOUT = TEXT_LAYOUT;
export const FIELD_LAYOUT = TEXT_LAYOUT;
export const BUTTON_LAYOUT = TEXT_LAYOUT;
export const ICON_LAYOUT = UNIVERSAL_LAYOUT;
export const TABLE_LAYOUT = Object.freeze([...UNIVERSAL_LAYOUT, "fitTableToViewport", "resizeColumnsProportionally", "setRowHeightMode", "resetTable"]);
export const COLUMN_LAYOUT = Object.freeze([...UNIVERSAL_LAYOUT, "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "resetTableColumn"]);
export const SPACING_LAYOUT = Object.freeze(["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"]);
export const DOMAIN_LOCKS = Object.freeze(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);

const VISIBLE_TEXT_TYPES = new Set(["button", "field", "label", "tableDataCell", "tableHeaderCell"]);

export function hasM83VisibleText(values = {}) {
  if (typeof values.hasVisibleText === "boolean") return values.hasVisibleText;
  return VISIBLE_TEXT_TYPES.has(values.type);
}

export function resolveM83AllowedOperations(values = {}) {
  const hasVisibleText = hasM83VisibleText(values);
  const required = values.visible === false
    ? []
    : [...UNIVERSAL_LAYOUT, ...(hasVisibleText ? ["textResize"] : [])];
  return Object.freeze([...new Set([...required, ...(values.allowedOps || [])])]);
}

export function defaultM83Baseline(values = {}, { unboundedGeometry = false } = {}) {
  return Object.freeze({
    x: 0, y: 0, width: null, height: null, textOffsetX: 0, textOffsetY: 0,
    fontSize: 12, visible: true, spacing: {},
    ...(unboundedGeometry ? {} : { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600 }),
    ...values,
  });
}

export function m83Element(values) {
  const { unboundedGeometry = false, ...elementValues } = values;
  const hasVisibleText = hasM83VisibleText(elementValues);
  const allowedOps = resolveM83AllowedOperations(elementValues);
  const requiredOperations = new Set([
    ...(elementValues.visible === false ? [] : UNIVERSAL_LAYOUT),
    ...(elementValues.visible === false || !hasVisibleText ? [] : ["textResize"]),
  ]);
  const lockedOps = Object.freeze([...(elementValues.lockedOps || [])]);
  const invalidLocks = lockedOps.filter((operation) => requiredOperations.has(operation));
  if (invalidLocks.length) throw new TypeError(`Universelle Layoutoperation darf nicht gesperrt werden: ${invalidLocks.join(", ")}`);
  const selectionKind = elementValues.selectionKind || ({
    root: "layoutZone", area: "layoutZone", group: "group", fieldGroup: "group",
    label: elementValues.role === "status" ? "statusText" : "label", field: "field", button: "button",
    componentPart: "icon", statusIndicator: "icon", table: "table", tableHeader: "tableHeader",
    tableBody: "tableBody", tableRow: "tableRow", tableColumn: "column", tableHeaderCell: "tableHeaderCell",
    tableDataCell: "tableDataCell", tableFooter: "tableFooter", tableViewport: "tableViewport",
    horizontalScrollArea: "horizontalScrollArea",
  }[elementValues.type] || "element");
  return Object.freeze({
    visible: true,
    ...elementValues,
    editable: elementValues.visible !== false,
    hasVisibleText,
    stableIdSource: "declaration",
    semanticKey: elementValues.semanticKey || elementValues.id,
    registrationStatus: elementValues.registrationStatus || (elementValues.visible === false ? "editorContainer" : "editorEnabled"),
    refKey: elementValues.refKey || elementValues.id,
    baseline: defaultM83Baseline({
      ...(!unboundedGeometry && (elementValues.componentKind === "textarea" || elementValues.fieldKind === "multilineText")
        ? { minHeight: 24, maxHeight: 720 }
        : {}),
      ...(elementValues.baseline || {}),
    }, { unboundedGeometry }),
    selectionKind,
    selectionLevels: Object.freeze([...(elementValues.selectionLevels || [selectionKind])]),
    spacingTargets: Object.freeze([...(elementValues.spacingTargets || [])]),
    operationEffects: Object.freeze({
      ...Object.fromEntries(allowedOps.map((operation) => [operation,
        selectionKind === "group" ? "groupWithChildren" : selectionKind === "layoutZone" ? "layoutZone" : "elementOnly"])),
      ...(elementValues.operationEffects || {}),
    }),
    operationAffectedIds: Object.freeze({ ...(elementValues.operationAffectedIds || {}) }),
    geometry: Object.freeze({ ...(unboundedGeometry ? {} : { maximumStoredOffset: 2400 }), ...(elementValues.geometry || {}) }),
    allowedOps,
    lockedOps,
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
  const universalRequirements = element?.visible === false ? {} : {
    directSelection: element?.editable === true,
    move: true,
    resizeWidth: true,
    resizeHeight: true,
    setVisibility: true,
    ...(element?.hasVisibleText === true ? { textResize: true } : {}),
  };
  return Object.freeze({
    slotId,
    required: options.required !== false,
    referenceKind: options.referenceKind || "single",
    presence: options.presence || "always",
    requirements: Object.freeze({
      ...(options.requirements || {}),
      ...universalRequirements,
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
