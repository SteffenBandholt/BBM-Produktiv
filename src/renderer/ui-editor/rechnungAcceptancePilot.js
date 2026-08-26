import { openNativeUiEditor } from "../app/coreShellNavigation.js";
import { getM80IdsFromTarget, getM80Ref } from "./m80Refs.js";
import { getM80InteractionStatus, handleM80EditorRequest, refreshM80StartupLayoutAfterRegistryMount } from "./m80HostAdapter.js";
import { listM80RegistryScopes } from "./m80Registry.js";

const RECHNUNG_ACCEPTANCE_SCOPE_ID = "rechnung.screen";
const RECHNUNG_ACCEPTANCE_TARGET_IDS = Object.freeze([
  "rechnung.editor.customerPicker",
  "rechnung.editor.preview",
  "rechnung.editor.headToggle",
  "rechnung.editor.book",
  "rechnung.editor.delete",
  "rechnung.editor.close",
]);
const REMOVED_EDITBOX_IDS = Object.freeze([
  "rechnung.editor.editToggle",
  "rechnung.editor.editArea",
  "rechnung.editor.editCanvas",
  "rechnung.editor.positionEditor",
  "rechnung.editor.positionType",
  "rechnung.editor.positionShort",
  "rechnung.editor.positionLong",
  "rechnung.editor.positionQuantityBlock",
  "rechnung.editor.positionQuantityDecimals",
  "rechnung.editor.positionQuantity",
  "rechnung.editor.positionUnit",
  "rechnung.editor.positionPrice",
  "rechnung.editor.positionVatRate",
  "rechnung.editor.positionPriceGross",
  "rechnung.editor.positionNep",
  "rechnung.editor.positionActions",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.positionMoveRoot",
  "rechnung.editor.editboxTotals",
]);
const REMOVED_EDITBOX_SELECTORS = Object.freeze([
  ".rechnung-screen__edit-area",
  ".rechnung-screen__edit-canvas",
  ".rechnung-editbox-workbench",
  ".rechnung-editbox-shell",
  ".rechnung-live-position-editor",
]);
const RECHNUNG_ACCEPTANCE_FIXTURE = Object.freeze({
  status: "DRAFT",
  source_type: "FREE",
  document_type: "INVOICE",
  invoice_number: "ENTWURF-PRODUKTPFAD",
  invoice_date: "2026-08-25",
  service_period_type: "SINGLE_DATE",
  service_date: "2026-08-25",
  service_reference: "UI-Editor Produktpfad-Abnahme",
  intro_text: "Nicht persistente Abnahmefixture im isolierten Acceptance-Profil",
  customer_ref_kind: null,
  customer_firm_id: null,
  project_id: null,
  payment_term_days: 8,
  due_date: "2026-09-02",
  positions: Object.freeze(Array.from({ length: 10 }, (_, index) => Object.freeze({
    id: `rechnung-product-acceptance-position-${index + 1}`,
    type: "service",
    short_text: `Produktiver RechnungScreen ${index + 1}`,
    long_text: "Reale Chromium- und Native-Editor-Abnahme",
    quantity: String(index + 1),
    unit: "Stk.",
    unit_price_cents: 10000,
    vat_rate_percent: 19,
    is_nep: false,
  }))),
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function boundsOf(element) {
  const bounds = element?.getBoundingClientRect?.();
  return bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom } : null;
}

function acceptanceMeasure(elementId) {
  const target = getM80Ref(elementId)?.element;
  if (!target?.getBoundingClientRect) throw new Error(`RECHNUNG_ACCEPTANCE_TARGET_MISSING:${elementId}`);
  const bounds = target.getBoundingClientRect();
  const style = getComputedStyle(target);
  const parentStyle = target.parentElement ? getComputedStyle(target.parentElement) : null;
  return {
    elementId,
    bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
    inline: { width: target.style.width, height: target.style.height, minWidth: target.style.minWidth, maxWidth: target.style.maxWidth, minHeight: target.style.minHeight, maxHeight: target.style.maxHeight, flex: target.style.flex, alignSelf: target.style.alignSelf, justifySelf: target.style.justifySelf },
    computed: { width: style.width, height: style.height, minWidth: style.minWidth, maxWidth: style.maxWidth, minHeight: style.minHeight, maxHeight: style.maxHeight, display: style.display, overflow: style.overflow, padding: style.padding, borderWidth: style.borderWidth, lineHeight: style.lineHeight, whiteSpace: style.whiteSpace },
    parent: parentStyle ? { display: parentStyle.display, gridTemplateColumns: parentStyle.gridTemplateColumns, gridTemplateRows: parentStyle.gridTemplateRows, flex: parentStyle.flex, alignItems: parentStyle.alignItems, justifyItems: parentStyle.justifyItems } : null,
  };
}

async function installProductPathAcceptanceApi({ router, screen, startupRestore }) {
  const runtimeErrors = [];
  const recordRuntimeError = (event) => runtimeErrors.push(String(event?.error?.stack || event?.reason?.stack || event?.message || event?.reason || "unknown runtime error"));
  globalThis.addEventListener?.("error", recordRuntimeError);
  globalThis.addEventListener?.("unhandledrejection", recordRuntimeError);

  const sidebarSnapshot = () => {
    const sidebar = router.shellLayout?.sidebar || null;
    const bodyRow = router.shellLayout?.bodyRow || null;
    const style = sidebar ? getComputedStyle(sidebar) : null;
    return {
      present: Boolean(sidebar),
      display: style?.display || "",
      visible: Boolean(sidebar && style?.display !== "none" && sidebar.getBoundingClientRect().width > 0),
      width: sidebar?.getBoundingClientRect?.().width || 0,
      hiddenDataset: bodyRow?.dataset?.sidebarHidden || "",
    };
  };
  const fixture = () => ({ ...RECHNUNG_ACCEPTANCE_FIXTURE, positions: RECHNUNG_ACCEPTANCE_FIXTURE.positions.map((entry) => ({ ...entry })) });
  const loadOrCreateFixture = async () => {
    const listed = await globalThis.window?.bbmDb?.rechnungList?.();
    let current = listed?.ok ? (listed.list || []).find((entry) => entry.service_reference === RECHNUNG_ACCEPTANCE_FIXTURE.service_reference) : null;
    if (!current) {
      const created = await globalThis.window?.bbmDb?.rechnungCreateDraft?.(fixture());
      if (!created?.ok || !created.data) throw new Error(`RECHNUNG_ACCEPTANCE_FIXTURE_CREATE_FAILED:${created?.error || "unknown"}`);
      current = created.data;
    } else {
      const loaded = await globalThis.window?.bbmDb?.rechnungGet?.(current.id);
      if (!loaded?.ok || !loaded.data) throw new Error(`RECHNUNG_ACCEPTANCE_FIXTURE_LOAD_FAILED:${loaded?.error || "unknown"}`);
      current = loaded.data;
    }
    return current;
  };
  const openFixture = async () => {
    const current = await loadOrCreateFixture();
    if (!screen.profile) {
      screen.profile = { name1: "Produktpfad Aussteller", street: "Pruefweg 2", zip: "22880", city: "Wedel", tax_number: "12/345/67890", iban: "DE02120300000000202051", bic: "BYLADEM1001" };
    }
    screen._open(current);
  };
  const overviewSidebar = sidebarSnapshot();
  await openFixture();
  const editorSidebar = sidebarSnapshot();
  const invoiceScope = listM80RegistryScopes().find((entry) => entry.scopeId === RECHNUNG_ACCEPTANCE_SCOPE_ID);

  const measureScreen = () => {
    const editor = boundsOf(getM80Ref("rechnung.editor")?.element);
    const headerCanvas = boundsOf(getM80Ref("rechnung.editor.headerCanvas")?.element);
    const sheetArea = boundsOf(getM80Ref("rechnung.editor.sheetArea")?.element);
    const positionRows = [...(screen.positionsList?.querySelectorAll?.(".rechnung-lv-position") || [])];
    return {
      viewport: { width: globalThis.innerWidth, height: globalThis.innerHeight },
      editor,
      headerCanvas,
      sheetArea,
      sheetCanvas: boundsOf(getM80Ref("rechnung.editor.sheetCanvas")?.element),
      sheetBody: boundsOf(getM80Ref("rechnung.editor.body")?.element),
      verticalContract: {
        unexplainedHeight: editor && headerCanvas && sheetArea ? editor.height - headerCanvas.height - sheetArea.height : null,
        sheetBottomOffset: editor && sheetArea ? editor.bottom - sheetArea.bottom : null,
      },
      removedDomCounts: Object.fromEntries(REMOVED_EDITBOX_SELECTORS.map((selector) => [selector, document.querySelectorAll(selector).length])),
      removedRegistryIds: REMOVED_EDITBOX_IDS.filter((elementId) => invoiceScope?.elements?.some((entry) => entry.id === elementId)),
      removedRuntimeRefs: REMOVED_EDITBOX_IDS.filter((elementId) => Boolean(getM80Ref(elementId))),
      scopeElementCount: invoiceScope?.elements?.length || 0,
      positionRowCount: positionRows.length,
      positionDataCount: screen.positions.length,
      totals: { net: screen.positionsTotal?.textContent || "", vat: screen.invoiceVat?.textContent || "", gross: screen.invoiceTotal?.textContent || "" },
      sidebar: sidebarSnapshot(),
      runtimeErrors: [...runtimeErrors],
    };
  };

  const api = {
    ready: false,
    targetIds: [...RECHNUNG_ACCEPTANCE_TARGET_IDS],
    startupRestore,
    route: {
      currentViewClass: screen.constructor?.name || "",
      rootInProductContent: router.contentRoot?.contains?.(screen.root) === true,
      scopeId: screen.uiEditorScopeId || RECHNUNG_ACCEPTANCE_SCOPE_ID,
      coreShellStyles: Boolean(document.querySelector('style[data-bbm-core-shell-styles="true"]')),
      popupStandardStyles: Boolean(document.querySelector('link[data-bbm-popup-form-standard-styles="true"]')?.sheet),
      rechnungStyles: Boolean(document.querySelector('link[data-bbm-rechnungen-design-styles="true"]')?.sheet),
      scopeElementCount: invoiceScope?.elements?.length || 0,
      overviewSidebar,
      editorSidebar,
    },
    activate(elementId) {
      if (!RECHNUNG_ACCEPTANCE_TARGET_IDS.includes(elementId)) throw new Error(`RECHNUNG_ACCEPTANCE_TARGET_NOT_ALLOWED:${elementId}`);
      screen.overview.hidden = true;
      screen.editor.hidden = false;
      screen.preview.hidden = true;
      const measurement = acceptanceMeasure(elementId);
      return { ...measurement, point: { x: Math.round(measurement.bounds.x + measurement.bounds.width / 2), y: Math.round(measurement.bounds.y + measurement.bounds.height / 2) } };
    },
    measure(elementId) { return acceptanceMeasure(elementId); },
    measureAll() { return Object.fromEntries(RECHNUNG_ACCEPTANCE_TARGET_IDS.map((elementId) => [elementId, acceptanceMeasure(elementId)])); },
    measureScreen,
    layoutState() { return handleM80EditorRequest({ action: "getLayoutState" }); },
    interaction() {
      const status = getM80InteractionStatus();
      return { selectionMode: status.selectionMode, selectedId: status.selectedId, hoverElementIds: status.hoverElementIds, hoverIndex: status.hoverIndex };
    },
    hitTest(elementId, { x = 0.5, y = 0.5 } = {}) {
      const target = getM80Ref(elementId)?.element;
      if (!target) throw new Error(`RECHNUNG_ACCEPTANCE_TARGET_MISSING:${elementId}`);
      const bounds = target.getBoundingClientRect();
      const point = { x: bounds.x + Math.max(0, Math.min(1, Number(x))) * bounds.width, y: bounds.y + Math.max(0, Math.min(1, Number(y))) * bounds.height };
      const hit = document.elementFromPoint(point.x, point.y);
      return { point, requestedId: elementId, requestedContainsHit: target === hit || target.contains(hit), hit: hit ? { tagName: hit.tagName, className: hit.className, elementIds: getM80IdsFromTarget(hit) } : null };
    },
    async select(elementId) {
      const status = getM80InteractionStatus();
      if (status.selectionMode !== true) throw new Error("RECHNUNG_ACCEPTANCE_SELECTION_MODE_INACTIVE");
      const target = getM80Ref(elementId)?.element;
      if (!target) throw new Error(`RECHNUNG_ACCEPTANCE_TARGET_MISSING:${elementId}`);
      const bounds = target.getBoundingClientRect();
      const init = { bubbles: true, cancelable: true, clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 };
      target.dispatchEvent(new MouseEvent("mousemove", init));
      await tick();
      const afterHover = this.interaction();
      if (!afterHover.hoverElementIds.includes(elementId)) return { ok: false, afterHover, afterClick: this.interaction() };
      target.dispatchEvent(new MouseEvent("click", init));
      await tick();
      const afterClick = this.interaction();
      return { ok: afterClick.selectedId === elementId, afterHover, afterClick };
    },
    async reopenInvoice() {
      screen.closeButton.click();
      await tick();
      const afterCloseSidebar = sidebarSnapshot();
      await openFixture();
      await tick();
      return { measurements: this.measureAll(), screen: measureScreen(), lifecycle: { afterCloseSidebar, afterOpenSidebar: sidebarSnapshot() } };
    },
  };
  globalThis.__bbmRechnungAcceptance = api;
  return api;
}

export async function installRechnungAcceptancePilot({ router, isolatedAcceptance = false } = {}) {
  if (!router?.contentRoot) throw new Error("Rechnung-Acceptance braucht den vorhandenen BBM-Inhaltsbereich.");
  const opened = await router.openGlobalModule("rechnung");
  if (opened !== true) throw new Error("RECHNUNG_ACCEPTANCE_ROUTE_FAILED");
  const screen = router.currentView;
  screen?.root?.setAttribute?.("data-bbm-rechnung-acceptance", "true");
  let productPathAcceptance = null;
  if (isolatedAcceptance === true) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const startupRestore = await refreshM80StartupLayoutAfterRegistryMount();
    productPathAcceptance = await installProductPathAcceptanceApi({ router, screen, startupRestore });
  }
  const editorResult = await openNativeUiEditor({ scopeId: RECHNUNG_ACCEPTANCE_SCOPE_ID });
  if (!editorResult?.ok) throw new Error("RECHNUNG_ACCEPTANCE_UI_EDITOR_OPEN_FAILED");
  if (productPathAcceptance) productPathAcceptance.ready = true;
  return screen;
}
