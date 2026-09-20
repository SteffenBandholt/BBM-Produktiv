import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";
import { beginM83ComponentBinding, completeM80PilotRender, getM80Ref, registerM80MultiRef, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { OVERVIEW_COMPONENT, OVERVIEW_SCOPE, projectOverviewUiEditorContract } from "./ProjectOverview.uiEditorContract.js";

const text = value => String(value ?? "").trim();
export function projectCardDetails(project = {}) {
  const name = text(project.name), short = text(project.short);
  return { name: name || short, short: name && short && name !== short ? short : "",
    number: text(project.project_number ?? project.projectNumber),
    address: [text(project.street), [text(project.zip), text(project.city)].filter(Boolean).join(" ")].filter(Boolean).join("\n") };
}

export default class ProjectOverview {
  constructor() { this.refs = new Map(); }
  node(tag, suffix, content = "") {
    const node = document.createElement(tag), id = OVERVIEW_SCOPE + suffix;
    node.textContent = content;
    if (!this.refs.has(id)) this.refs.set(id, []);
    this.refs.get(id).push(node);
    return node;
  }
  render({ projects, entries, getModuleActions, selectedSeriesForProject, onCreate, onTransfer, onEdit, onProject, onSeries, isBusy }) {
    this.root = this.node("section", "");
    this.root.style.cssText = "min-width:0;display:flex;flex-direction:column;gap:12px";
    const toolbar = this.node("div", ".toolbar");
    toolbar.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0";
    const button = ({ text: label, actionType, moduleId = "", navigationKey = "", titleText = "", onClick, variant = "neutral" }) => {
      const btn = document.createElement("button"); btn.type = "button"; btn.textContent = label;
      applyPopupButtonStyle(btn, { variant });
      btn.style.cssText += ";box-sizing:border-box;max-width:100%;white-space:normal;overflow-wrap:anywhere;padding:6px 10px;font-size:12px;line-height:1.25";
      btn.dataset.projectAction = actionType;
      if (moduleId) btn.dataset.moduleId = moduleId;
      if (navigationKey) btn.dataset.navigationKey = navigationKey;
      btn.title = titleText || label; btn.setAttribute("aria-label", titleText || label);
      btn.disabled = isBusy();
      btn.addEventListener("click", async event => {
        event.stopPropagation();
        if (!isBusy()) await onClick?.();
      });
      return btn;
    };
    const action = (suffix, options) => {
      const btn = button(options); this.refs.set(OVERVIEW_SCOPE + suffix, [btn]); return btn;
    };
    toolbar.append(
      action(".toolbar.create", { text: "+ Projekt anlegen", actionType: "create", variant: "primary", onClick: onCreate }),
      action(".toolbar.transfer", { text: "Import / Export", actionType: "transfer", onClick: onTransfer }),
    );
    const grid = this.node("div", ".grid"); grid.dataset.projectGrid = "true";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),240px));gap:8px;align-items:start;justify-content:start;min-width:0";
    this.root.append(toolbar, grid);
    for (const project of projects || []) {
      const details = projectCardDetails(project), card = this.node("article", ".card");
      card.dataset.projectCard = "true"; card.dataset.projectId = String(project.id || "");
      card.style.cssText = "box-sizing:border-box;width:100%;max-width:240px;min-width:0;display:flex;flex-direction:column;gap:3px;padding:8px;border:1px solid var(--bbm-popup-border,#d7dee8);border-radius:8px;background:var(--bbm-popup-surface,#fff);color:var(--bbm-popup-text,#1f2937);overflow-wrap:anywhere;cursor:pointer";
      card.tabIndex = 0; card.title = "Projekt öffnen";
      card.addEventListener("click", () => { if (!isBusy()) void onProject(project); });
      card.addEventListener("keydown", event => {
        if (event.target !== card || event.key !== "Enter") return;
        event.preventDefault(); if (!isBusy()) void onProject(project);
      });
      const header = this.node("div", ".card.header");
      header.style.cssText = "display:flex;align-items:center;flex-wrap:nowrap;gap:4px;min-width:0";
      if (details.number) {
        const number = this.node("div", ".card.header.number", `Nr. ${details.number}`);
        number.style.cssText = "min-width:0;flex:1 1 auto;font-size:11px;line-height:1.2;white-space:nowrap;opacity:.7"; header.append(number);
      }
      const edit = button({ text: "Bearbeiten", actionType: "edit", onClick: () => onEdit(project) });
      edit.style.cssText += ";flex:0 0 auto;margin-left:auto;padding:3px 6px;font-size:10.5px;line-height:1.2";
      edit.style.setProperty("min-height", "24px", "important");
      const editId = OVERVIEW_SCOPE + ".card.header.edit";
      if (!this.refs.has(editId)) this.refs.set(editId, []);
      this.refs.get(editId).push(edit); header.append(edit);
      const name = this.node("div", ".card.name", details.name);
      name.style.cssText = "min-width:0;font-weight:800;font-size:14px;line-height:1.2";
      card.append(header, name);
      if (details.short) {
        const short = this.node("div", ".card.short", details.short);
        short.style.cssText = "font-size:11.5px;line-height:1.25;opacity:.8"; card.append(short);
      }
      if (details.address) {
        const address = this.node("div", ".card.address", details.address);
        address.style.cssText = "font-size:11.5px;line-height:1.25;opacity:.85;white-space:pre-line"; card.append(address);
      }
      const moduleActions = getModuleActions(project), protocolAction = moduleActions.find(action => action.moduleId === "protokoll");
      if (protocolAction) {
        const actions = entries.render({ project, selectedSeriesKey: selectedSeriesForProject?.(project.id), makeButton: button,
          onOpen: seriesKey => onSeries(project, protocolAction, seriesKey) });
        if (actions) card.append(actions);
      }
      // Preserve any other explicitly licensed project actions in the legacy host.
      for (const moduleAction of moduleActions.filter(action => action.moduleId !== "protokoll")) {
        card.append(button({ text: moduleAction.label, actionType: "module", moduleId: moduleAction.moduleId,
          navigationKey: moduleAction.navigationKey, titleText: moduleAction.description, onClick: moduleAction.onClick }));
      }
      grid.append(card);
    }
    return this.root;
  }
  bind() {
    beginM83ComponentBinding(OVERVIEW_COMPONENT);
    for (const slot of projectOverviewUiEditorContract.slots) {
      const nodes = this.refs.get(slot.element.id) || [];
      if (slot.referenceKind === "multi") registerM80MultiRef(slot.element.id, nodes, this.root);
      else registerM80Ref(slot.element.id, nodes[0]);
    }
    completeM80PilotRender();
  }
  destroy() {
    if (getM80Ref(OVERVIEW_SCOPE)?.element === this.root) {
      beginM83ComponentBinding(OVERVIEW_COMPONENT); completeM80PilotRender();
    }
  }
}
