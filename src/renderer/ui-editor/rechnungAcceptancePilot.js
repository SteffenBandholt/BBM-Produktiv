import { openNativeUiEditor } from "../app/coreShellNavigation.js";
import { getM80Ref } from "./m80Refs.js";
import { getM80InteractionStatus, refreshM80StartupLayoutAfterRegistryMount } from "./m80HostAdapter.js";

const RECHNUNG_ACCEPTANCE_SCOPE_ID = "rechnung.screen";
const RECHNUNG_ACCEPTANCE_TARGET_IDS = Object.freeze([
  "rechnung.editor.positionQuantityDecimals.increase",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.preview",
  "rechnung.editor.headToggle",
]);
const RECHNUNG_ACCEPTANCE_FIXTURE = Object.freeze({
  id: "rechnung-product-acceptance-invoice",
  status: "DRAFT",
  source_type: "FREE",
  document_type: "INVOICE",
  invoice_number: "ENTWURF-PRODUKTPFAD",
  invoice_date: "2026-08-25",
  service_period_type: "SINGLE_DATE",
  service_date: "2026-08-25",
  service_reference: "UI-Editor Produktpfad-Abnahme",
  intro_text: "Nicht persistente Abnahmefixture im isolierten Acceptance-Profil",
  customer_ref_kind: "firm",
  customer_firm_id: "rechnung-product-acceptance-customer",
  project_id: "rechnung-product-acceptance-project",
  payment_term_days: 8,
  due_date: "2026-09-02",
  positions: Object.freeze([
    Object.freeze({ id: "rechnung-product-acceptance-position", type: "service", short_text: "Produktiver RechnungScreen", long_text: "Reale Chromium- und Native-Editor-Abnahme", quantity: "1", unit: "Stk.", unit_price_cents: 10000, vat_rate_percent: 19, is_nep: false }),
  ]),
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

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

function installProductPathAcceptanceApi({ router, screen, startupRestore }) {
  const fixture = () => ({ ...RECHNUNG_ACCEPTANCE_FIXTURE, positions: RECHNUNG_ACCEPTANCE_FIXTURE.positions.map((entry) => ({ ...entry })) });
  const openFixture = () => {
    screen.customers = [{ kind: "firm", id: "rechnung-product-acceptance-customer", label: "Produktpfad Kunde", name: "Produktpfad Kunde", street: "Testweg 1", zip: "22880", city: "Wedel" }];
    screen.projects = [{ id: "rechnung-product-acceptance-project", name: "Produktpfad Projekt" }];
    screen._open(fixture());
    screen._selectPosition(screen.positions[0]);
  };
  openFixture();
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
    },
    activate(elementId) {
      if (!RECHNUNG_ACCEPTANCE_TARGET_IDS.includes(elementId)) throw new Error(`RECHNUNG_ACCEPTANCE_TARGET_NOT_ALLOWED:${elementId}`);
      screen.overview.hidden = true;
      screen.editor.hidden = false;
      screen.preview.hidden = true;
      screen.positionMoveRootButton.hidden = true;
      const measurement = acceptanceMeasure(elementId);
      return { ...measurement, point: { x: Math.round(measurement.bounds.x + measurement.bounds.width / 2), y: Math.round(measurement.bounds.y + measurement.bounds.height / 2) } };
    },
    measure(elementId) { return acceptanceMeasure(elementId); },
    measureAll() { return Object.fromEntries(RECHNUNG_ACCEPTANCE_TARGET_IDS.map((elementId) => [elementId, acceptanceMeasure(elementId)])); },
    interaction() {
      const status = getM80InteractionStatus();
      return { selectionMode: status.selectionMode, selectedId: status.selectedId, hoverElementIds: status.hoverElementIds, hoverIndex: status.hoverIndex };
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
      screen._close();
      await tick();
      openFixture();
      await tick();
      return this.measureAll();
    },
  };
  globalThis.__bbmRechnungAcceptance = api;
  return api;
}

export async function installRechnungAcceptancePilot({ router, isolatedAcceptance = false } = {}) {
  if (!router?.contentRoot) {
    throw new Error("Rechnung-Acceptance braucht den vorhandenen BBM-Inhaltsbereich.");
  }

  const opened = await router.openGlobalModule("rechnung");
  if (opened !== true) throw new Error("RECHNUNG_ACCEPTANCE_ROUTE_FAILED");

  const screen = router.currentView;
  screen?.root?.setAttribute?.("data-bbm-rechnung-acceptance", "true");
  let productPathAcceptance = null;
  if (isolatedAcceptance === true) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const startupRestore = await refreshM80StartupLayoutAfterRegistryMount();
    productPathAcceptance = installProductPathAcceptanceApi({ router, screen, startupRestore });
  }
  const editorResult = await openNativeUiEditor({ scopeId: RECHNUNG_ACCEPTANCE_SCOPE_ID });
  if (!editorResult?.ok) throw new Error("RECHNUNG_ACCEPTANCE_UI_EDITOR_OPEN_FAILED");
  if (productPathAcceptance) productPathAcceptance.ready = true;

  return screen;
}
