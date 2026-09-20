import { MEETING_SERIES, normalizeSeriesMask } from "../../../../shared/meetingSeries.mjs";
import { beginM83ComponentBinding, completeM80PilotRender, getM80Ref, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { SERIES_COMPONENT, SERIES_SCOPE } from "./ProjectMeetingSeries.uiEditorContract.js";
import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";

export default class ProjectMeetingSeriesField {
  constructor({ onHistory } = {}) { this.inputs = new Map(); this.refs = new Map(); this.historyKeys = new Set(); this.onHistory = onHistory; this.historyButtons = new Map(); this.alive = true; }
  render() {
    const make = (tag, id, text = "") => { const node = document.createElement(tag); node.textContent = text; this.refs.set(id, node); return node; };
    this.root = make("section", SERIES_SCOPE);
    this.root.style.cssText = "box-sizing:border-box;min-width:0;display:flex;flex-direction:column;gap:8px;padding:12px;margin-top:12px;border:1px solid #d3dfec;border-radius:8px";
    const heading = make("h3", `${SERIES_SCOPE}.heading`, "Besprechungsarten"); heading.style.cssText = "margin:0;font-size:14px";
    this.root.append(heading);
    for (const series of MEETING_SERIES) {
      const id = `${SERIES_SCOPE}.${series.key}`;
      const group = make("div", id); group.style.cssText = "display:grid;grid-template-columns:16px minmax(0,1fr);align-items:center;gap:6px 8px;min-width:0";
      const input = make("input", `${id}.input`); input.type = "checkbox"; input.id = `${id}.input`; input.checked = series.bit === 1;
      input.style.cssText = "margin:0;flex:0 0 auto;width:16px;height:16px";
      const label = make("label", `${id}.label`, series.label); label.htmlFor = input.id;
      label.style.overflowWrap = "anywhere";
      input.onchange = () => this.refreshHistory();
      group.append(input, label); this.root.append(group); this.inputs.set(series.key, input);
    }
    this.bind(); return this.root;
  }
  bind() { this.alive = true; beginM83ComponentBinding(SERIES_COMPONENT); for (const [id, node] of this.refs) registerM80Ref(id, node); completeM80PilotRender(); }
  setProject(project) { const mask = normalizeSeriesMask(project?.meeting_series_mask); this.archived = !!project?.archived_at; for (const series of MEETING_SERIES) this.inputs.get(series.key).checked = !!(mask & series.bit); this.refreshHistory(); }
  setHistory(meetings) { this.historyKeys = new Set(meetings.map(meeting => meeting.series_key || "construction")); this.refreshHistory(); }
  refreshHistory() {
    for (const series of MEETING_SERIES) {
      const id = `${SERIES_SCOPE}.${series.key}.history`;
      this.historyButtons.get(series.key)?.remove(); this.historyButtons.delete(series.key); this.refs.delete(id);
      if (this.inputs.get(series.key)?.checked !== false || !this.historyKeys.has(series.key)) continue;
      const button = document.createElement("button"); button.type = "button";
      button.textContent = `${series.label} – bisherige Protokolle`;
      button.dataset.seriesKey = series.key; button.dataset.historyOnly = "true";
      applyPopupButtonStyle(button);
      button.style.cssText += ";grid-column:2;justify-self:start;max-width:100%;white-space:normal;overflow-wrap:anywhere;padding:6px 10px;font-size:12px";
      button.disabled = !!this.busy;
      button.onclick = () => { if (!this.busy) void this.onHistory?.(series.key); };
      this.refs.get(`${SERIES_SCOPE}.${series.key}`).append(button);
      this.refs.set(id, button); this.historyButtons.set(series.key, button);
    }
    if (this.root && this.alive) this.bind();
  }
  patch() { return { meeting_series_mask: MEETING_SERIES.reduce((mask, series) => mask | (this.inputs.get(series.key).checked ? series.bit : 0), 0) }; }
  setBusy(busy) { this.busy = !!busy; for (const input of this.inputs.values()) input.disabled = !!busy || this.archived; for (const button of this.historyButtons.values()) button.disabled = !!busy; }
  destroy() { this.alive = false; if (getM80Ref(SERIES_SCOPE)?.element === this.root) { beginM83ComponentBinding(SERIES_COMPONENT); completeM80PilotRender(); } }
}
