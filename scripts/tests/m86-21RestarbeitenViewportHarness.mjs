import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import { createCoreShellLayout } from "../../src/renderer/app/coreShellLayout.js";
import { injectCoreShellBaseStyles } from "../../src/renderer/app/coreShellStyles.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";
import { listM80RegistryScopes } from "../../src/renderer/ui-editor/m80Registry.js";

const EPSILON = 0.75;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function rect(node) {
  const value = node.getBoundingClientRect();
  return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
}

function sampleRest() {
  return {
    id: "m86-21-rest",
    running_number: 1,
    item_class: "rest",
    status: "offen",
    short_text: "M86.21 Restarbeit",
    long_text: "Sichtbarer M86.21 Langtext.",
    due_date: "2026-08-12",
    responsible_label: "Pr\u00fcfung",
    ampelState: "orange",
    location_level_1: "Geb\u00e4ude",
    location_level_2: "EG",
    location_level_3: "Raum",
    location_level_4: "01",
  };
}

async function waitForStyle() {
  const style = document.querySelector('link[data-bbm-restarbeiten-m1-styles="true"]');
  if (!style) throw new Error("M86.21: Restarbeiten-Stylesheet fehlt.");
  if (style.sheet) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("M86.21: Restarbeiten-Stylesheet wurde nicht geladen.")), 5000);
    style.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
    style.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("M86.21: Restarbeiten-Stylesheet ist nicht lesbar.")); }, { once: true });
  });
}

function describeNode({ id, node, parentId = null, parent = null }) {
  const style = getComputedStyle(node);
  return {
    id,
    domNode: node.tagName.toLowerCase(),
    className: node.className || "",
    parentId,
    parentNode: parent?.tagName?.toLowerCase?.() || node.parentElement?.tagName?.toLowerCase?.() || null,
    rect: rect(node),
    width: style.width,
    minWidth: style.minWidth,
    maxWidth: style.maxWidth,
    margin: style.margin,
    padding: style.padding,
    border: style.border,
    transform: style.transform,
    display: style.display,
    flex: style.flex,
    gridTemplateColumns: style.gridTemplateColumns,
    overflowX: style.overflowX,
  };
}

function refTargets(ref) {
  return (ref?.contractTargets || (ref?.element ? [ref.element] : [])).filter((target) => target?.isConnected);
}

function isVisible(node) {
  const style = getComputedStyle(node);
  const bounds = rect(node);
  return node.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden" && bounds.width > EPSILON && bounds.height > EPSILON;
}

function mountRestarbeitenInCoreShell() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.documentElement.style.cssText = "width:100%;height:100%;overflow:hidden";
  document.body.style.cssText = "width:100%;height:100vh;margin:0;overflow:hidden";
  document.body.replaceChildren();
  const host = document.createElement("div");
  host.id = "content";
  document.body.appendChild(host);
  injectCoreShellBaseStyles();
  const header = document.createElement("header");
  header.style.cssText = "height:152px;flex:0 0 152px;box-sizing:border-box";
  const layout = createCoreShellLayout({ headerEl: header });
  const screen = new RestarbeitenScreen({ projectId: "m86-21", project: { id: "m86-21" } });
  screen.items = [sampleRest(), { ...sampleRest(), id: "m86-21-rest-2", short_text: "Weitere Restarbeit" }];
  screen.selectedId = "m86-21-rest";
  screen.draft = sampleRest();
  layout.contentRoot.appendChild(screen.render());
  return { layout, screen };
}

export async function runM8621RestarbeitenViewport() {
  try {
    const { layout, screen } = mountRestarbeitenInCoreShell();
    await waitForStyle();
    await tick();
    const root = screen.root;
    const knownNodes = [
      ["bbm.main.shell", layout.host, null, document.documentElement],
      ["bbm.main.content", layout.contentRoot, "bbm.main.shell", layout.host],
      ["restarbeiten.root", root, null, layout.contentRoot],
      ["restarbeiten.header.root", root.querySelector(".bbm-restarbeiten-header"), "restarbeiten.root", root],
      ["restarbeiten.filterbar", root.querySelector(".bbm-restarbeiten-filterbar"), "restarbeiten.root", root],
      ["restarbeiten.workspace.list", root.querySelector(".bbm-restarbeiten-workspace__list"), "restarbeiten.root", root],
      ["restarbeiten.main", root.querySelector(".bbm-restarbeiten-main"), "restarbeiten.workspace.list", root.querySelector(".bbm-restarbeiten-workspace__list")],
      ["restarbeiten.workspace.edit", root.querySelector(".bbm-restarbeiten-workspace__edit"), "restarbeiten.root", root],
      ["restarbeiten.edit.root", root.querySelector(".bbm-restarbeiten-editbox"), "restarbeiten.workspace.edit", root.querySelector(".bbm-restarbeiten-workspace__edit")],
      ["restarbeiten.quicklane", root.querySelector(".bbm-restarbeiten-quicklane"), "restarbeiten.root", root],
    ].filter(([, node]) => node);
    const entries = listM80RegistryScopes()
      .filter((scope) => scope.scopeId.startsWith("restarbeiten.") && scope.status === "complete")
      .flatMap((scope) => scope.elements);
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const registryTargets = entries.flatMap((entry) => refTargets(getM80Ref(entry.id))
      .filter(isVisible)
      .map((node) => ({ entry, node })));
    const viewportRight = rect(layout.contentRoot).right;
    const overflowingRegistryBounds = registryTargets
      .filter(({ node }) => rect(node).right > viewportRight + EPSILON)
      .map(({ entry, node }) => describeNode({ id: entry.id, node, parentId: entry.parentId, parent: getM80Ref(entry.parentId)?.element || root }));
    const structural = knownNodes.map(([id, node, parentId, parent]) => describeNode({ id, node, parentId, parent }));
    const overflowingVisibleNodes = [...root.querySelectorAll("*")]
      .filter(isVisible)
      .filter((node) => rect(node).right > viewportRight + EPSILON)
      .map((node) => describeNode({ id: node.getAttribute("data-ui-editor-id") || null, node, parent: node.parentElement }));
    const widths = {
      documentElement: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
      body: { scrollWidth: document.body.scrollWidth, clientWidth: document.body.clientWidth },
      shell: { scrollWidth: layout.host.scrollWidth, clientWidth: layout.host.clientWidth },
      content: { scrollWidth: layout.contentRoot.scrollWidth, clientWidth: layout.contentRoot.clientWidth },
      restarbeitenRoot: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth },
      list: { scrollWidth: root.querySelector(".bbm-restarbeiten-main").scrollWidth, clientWidth: root.querySelector(".bbm-restarbeiten-main").clientWidth },
      editbox: { scrollWidth: root.querySelector(".bbm-restarbeiten-editbox").scrollWidth, clientWidth: root.querySelector(".bbm-restarbeiten-editbox").clientWidth },
    };
    const listNode = root.querySelector(".bbm-restarbeiten-main");
    const verticalScrollOwner = {
      node: "restarbeiten.main",
      overflowY: getComputedStyle(listNode).overflowY,
      scrollHeight: listNode.scrollHeight,
      clientHeight: listNode.clientHeight,
    };
    const horizontalOverflow = Object.entries(widths)
      .filter(([, value]) => value.scrollWidth > value.clientWidth)
      .map(([id, value]) => ({ id, ...value, overflow: value.scrollWidth - value.clientWidth }));
    const parentOverflow = registryTargets
      .map(({ entry, node }) => {
        const parent = getM80Ref(entry.parentId)?.element;
        if (!parent || !isVisible(parent) || node.parentElement !== parent || getComputedStyle(node).position === "fixed") return null;
        const childBounds = rect(node);
        const parentBounds = rect(parent);
        return childBounds.right > parentBounds.right + EPSILON
          ? { elementId: entry.id, parentId: entry.parentId, child: childBounds, parent: parentBounds }
          : null;
      })
      .filter(Boolean);
    return {
      ok: horizontalOverflow.length === 0 && overflowingRegistryBounds.length === 0 && parentOverflow.length === 0,
      widths,
      horizontalOverflow,
      overflowingRegistryBounds,
      parentOverflow,
      structural,
      overflowingVisibleNodes,
      verticalScrollOwner,
      registryTargetCount: registryTargets.length,
      registryEntryCount: byId.size,
    };
  } catch (error) {
    return { ok: false, error: error?.stack || String(error) };
  } finally {
    resetM80PilotWorkingStatesForDiagnostic();
  }
}
