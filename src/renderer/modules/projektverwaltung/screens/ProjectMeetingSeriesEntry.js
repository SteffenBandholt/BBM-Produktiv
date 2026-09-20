import { MEETING_SERIES, isSeriesEnabled } from "../../../../shared/meetingSeries.mjs";
import { beginM83ComponentBinding, completeM80PilotRender, getM80Ref, registerM80MultiRef } from "../../../ui-editor/m80Refs.js";
import { SERIES_ENTRY_COMPONENT, SERIES_ENTRY_SCOPE } from "./ProjectMeetingSeries.uiEditorContract.js";

export default class ProjectMeetingSeriesEntry {
  constructor() { this.refs = new Map([[SERIES_ENTRY_SCOPE, []]]); }
  render({ project, selectedSeriesKey = "", makeButton, onOpen }) {
    const enabled = MEETING_SERIES.filter(series => isSeriesEnabled(project, series.key));
    if (!enabled.length) return null;
    const labels = { construction: "Baubesprechung", owner: "Bauherr", planning: "Planung" };
    const root = document.createElement("section"); root.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:3px;min-width:0;margin-top:1px;padding-top:5px;border-top:1px solid var(--bbm-popup-border,#d7dee8)";
    root.dataset.projectActionRail = "true";
    this.refs.get(SERIES_ENTRY_SCOPE).push(root);
    for (const series of enabled) {
      const id = `${SERIES_ENTRY_SCOPE}.${series.key}`;
      const button = makeButton({ text: labels[series.key], titleText: series.label, actionType: "module", moduleId: "protokoll", onClick: () => onOpen(series.key, false) });
      const selected = series.key === selectedSeriesKey;
      delete button.dataset.variant;
      button.classList.add("bbm-project-series-action");
      button.dataset.projectSeriesSelected = selected ? "true" : "false";
      button.style.cssText += ";appearance:none;border:0;background:transparent;padding:0;font-size:12px;font-weight:400;line-height:1.25;min-height:0;white-space:nowrap";
      button.style.setProperty("border", "0", "important");
      button.style.setProperty("background", "transparent", "important");
      button.style.setProperty("padding", "0", "important");
      button.style.setProperty("min-height", "0", "important");
      button.style.setProperty("color", selected ? "var(--bbm-button-primary-bg, #2563eb)" : "var(--bbm-popup-text, #1f2937)", "important");
      button.dataset.seriesKey = series.key; button.dataset.historyOnly = "false";
      button.title = series.label; button.setAttribute("aria-label", series.label);
      root.append(button); if (!this.refs.has(id)) this.refs.set(id, []); this.refs.get(id).push(button);
    }
    return root;
  }
  bind(fallback) {
    this.fallback = fallback;
    beginM83ComponentBinding(SERIES_ENTRY_COMPONENT);
    registerM80MultiRef(SERIES_ENTRY_SCOPE, this.refs.get(SERIES_ENTRY_SCOPE), fallback);
    for (const series of MEETING_SERIES) {
      const id = `${SERIES_ENTRY_SCOPE}.${series.key}`; registerM80MultiRef(id, this.refs.get(id) || [], fallback);
    }
    completeM80PilotRender();
  }
  destroy() { if (this.refs.get(SERIES_ENTRY_SCOPE).includes(getM80Ref(SERIES_ENTRY_SCOPE)?.element) || getM80Ref(SERIES_ENTRY_SCOPE)?.element === this.fallback) { beginM83ComponentBinding(SERIES_ENTRY_COMPONENT); completeM80PilotRender(); } }
}
