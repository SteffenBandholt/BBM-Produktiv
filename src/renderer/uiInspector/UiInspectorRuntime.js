import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];
const PARENT_MAP = new Map([
  ['restarbeiten.filterleiste', 'restarbeiten.main'], ['restarbeiten.liste', 'restarbeiten.main'],
  ['restarbeiten.filterleiste.klassenfilter', 'restarbeiten.filterleiste'], ['restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste'], ['restarbeiten.filterleiste.meta', 'restarbeiten.filterleiste'],
  ['restarbeiten.filterleiste.klassenfilter.feld', 'restarbeiten.filterleiste.klassenfilter'], ['restarbeiten.filterleiste.verortung.feld', 'restarbeiten.filterleiste.verortung'],
  ['restarbeiten.liste.textbereich', 'restarbeiten.liste'], ['restarbeiten.liste.metabereich', 'restarbeiten.liste'],
  ['restarbeiten.editbox.header', 'restarbeiten.editbox'], ['restarbeiten.editbox.verortung', 'restarbeiten.editbox'], ['restarbeiten.editbox.kurztext', 'restarbeiten.editbox'], ['restarbeiten.editbox.langtext', 'restarbeiten.editbox'], ['restarbeiten.editbox.meta', 'restarbeiten.editbox'],
  ['restarbeiten.editbox.kurztext.label', 'restarbeiten.editbox.kurztext'], ['restarbeiten.editbox.kurztext.restzeichen', 'restarbeiten.editbox.kurztext'], ['restarbeiten.editbox.langtext.label', 'restarbeiten.editbox.langtext'], ['restarbeiten.editbox.langtext.restzeichen', 'restarbeiten.editbox.langtext'],
]);
const TOP_ORDER = ['restarbeiten.header', 'restarbeiten.main', 'restarbeiten.editbox'];

function getLabel(id, instance) { const leaf = String(id || '').split('.').pop() || id; const base = leaf.charAt(0).toUpperCase() + leaf.slice(1).replaceAll('_', ' '); return leaf === 'feld' ? `Feld #${instance}` : base; }
function getParentId(id, existing) { let cursor = PARENT_MAP.get(id) || ''; while (cursor && !existing.has(cursor)) cursor = PARENT_MAP.get(cursor) || ''; if (cursor) return cursor; const parts = String(id).split('.'); while (parts.length > 2) { parts.pop(); const c = parts.join('.'); if (existing.has(c)) return c; } return ''; }
export function buildTargets(rawTargets = []) {
  const existing = new Set(rawTargets.map((t) => t.id));
  const byId = new Map();
  for (const t of rawTargets) { if (!byId.has(t.id)) byId.set(t.id, []); byId.get(t.id).push(t); }
  const ids = Array.from(byId.keys());
  const idOrder = (id) => { const i = TOP_ORDER.indexOf(id); return i >= 0 ? i : 100 + id.split('.').length; };
  ids.sort((a,b)=>idOrder(a)-idOrder(b)||a.localeCompare(b));
  const out=[];
  for (const id of ids) {
    const parentId = getParentId(id, existing); const parent = out.find((x)=>x.id===parentId); const level = parent ? parent.level + 1 : (TOP_ORDER.includes(id)?0:1);
    const rows = byId.get(id).slice().sort((a,b)=>a.instance-b.instance);
    for (const row of rows) out.push({ ...row, parentId, level, label: getLabel(id, row.instance) });
  }
  return out;
}
function getAllowedControlsForSelectedId(selectedId) { const normalizedId = String(selectedId || '').trim(); if (!normalizedId) return []; const containerIds = new Set(['restarbeiten.root','restarbeiten.header','restarbeiten.main','restarbeiten.filterleiste','restarbeiten.filterleiste.meta','restarbeiten.editbox','restarbeiten.editbox.header','restarbeiten.editbox.verortung','restarbeiten.editbox.meta','restarbeiten.liste']); if (containerIds.has(normalizedId)) return [...CONTAINER_CONTROLS]; const fieldSuffixes = ['.feld', '.kurztext', '.langtext', '.fertig_bis', '.status', '.verantwortlich', '.label', '.restzeichen']; if (fieldSuffixes.some((suffix) => normalizedId.endsWith(suffix))) return [...FIELD_CONTROLS]; return []; }

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  const resolvedPanel = panel || createUiInspectorPanel({ onSelectTarget: (key) => { if (key) resolvedOverlay.select?.(key); } });
  let overlayActive = false;
  const targets = () => buildTargets(resolvedOverlay.getTargets?.() || []);
  function renderPanelForSelection(selectedId) { const controls = getAllowedControlsForSelectedId(selectedId); resolvedPanel.render({ selectedId, controls, targets: targets(), note: controls.length ? '' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.' }); }
  function activateOverlay(rootElement) {
    const overlayMounted = resolvedOverlay.mount(rootElement, { onSelect: (id) => renderPanelForSelection(id), onClearSelection: () => resolvedPanel.clear({ targets: targets() }) }) === true;
    if (!overlayMounted) { overlayActive = false; return false; }
    const panelMounted = resolvedPanel.mount(rootElement?.ownerDocument?.body || globalThis.document?.body) === true; overlayActive = panelMounted; if (overlayActive) renderPanelForSelection(resolvedOverlay.getSelectedId?.() || ''); return overlayActive;
  }
  function deactivateOverlay() { resolvedOverlay.unmount(); resolvedPanel.unmount(); overlayActive = false; return true; }
  function refreshOverlay() { if (!overlayActive) return false; const ok = resolvedOverlay.refresh() === true; if (ok) renderPanelForSelection(resolvedOverlay.getSelectedId?.() || ''); return ok; }
  function clearSelection() { const result = resolvedOverlay.clearSelection?.() === true; resolvedPanel.clear({ targets: targets() }); return result; }
  return { overlay: resolvedOverlay, panel: resolvedPanel, activateOverlay, deactivateOverlay, refreshOverlay, getSelectedElementId() { return resolvedOverlay.getSelectedId?.() || ''; }, clearSelection, getAllowedControlsForSelectedId, buildTargets, isOverlayActive() { return overlayActive; } };
}
