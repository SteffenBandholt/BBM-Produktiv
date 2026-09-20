import { MEETING_SERIES } from "../../../../shared/meetingSeries.mjs";
import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../../ui-editor/m83ComponentContract.js";

export const SERIES_SCOPE = "projektverwaltung.meetingSeries";
export const SERIES_COMPONENT = "bbm.projektverwaltung.meetingSeries";
export const SERIES_ENTRY_SCOPE = "projektverwaltung.meetingSeriesEntry";
export const SERIES_ENTRY_COMPONENT = "bbm.projektverwaltung.meetingSeriesEntry";
const element = values => m83Element({ ...values, lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32 } });
const fields = [
  element({ id: SERIES_SCOPE, name: "Besprechungsarten", type: "root", role: "scopeRoot", parentId: null, order: 0 }),
  element({ id: `${SERIES_SCOPE}.heading`, name: "Besprechungsarten", type: "label", role: "content", parentId: SERIES_SCOPE, order: 1 }),
  ...MEETING_SERIES.flatMap((series, index) => {
    const id = `${SERIES_SCOPE}.${series.key}`, order = 2 + index * 3;
    return [
      element({ id, name: series.label, type: "fieldGroup", role: "layout", parentId: SERIES_SCOPE, order }),
      element({ id: `${id}.label`, name: series.label, type: "label", role: "content", parentId: id, order: order + 1 }),
      element({ id: `${id}.input`, name: series.label, type: "field", role: "dataFieldLayout", fieldKind: "checkbox", componentKind: "checkbox", parentId: id, order: order + 2 }),
    ];
  }),
];
export const projectMeetingSeriesUiEditorContract = m83Component({
  componentId: SERIES_COMPONENT, scopeId: SERIES_SCOPE,
  requiredSlots: fields.map(field => field.id), slots: [
    ...fields.map(field => m83Slot(field.id, field)),
    ...MEETING_SERIES.map((series, index) => m83Slot(`${SERIES_SCOPE}.${series.key}.history`,
      m83DomainButton({ id: `${SERIES_SCOPE}.${series.key}.history`, name: `${series.label} – bisherige Protokolle`,
        parentId: `${SERIES_SCOPE}.${series.key}`, order: index + 11, actionKind: "openProtocolHistory" }),
      { required: false, presence: "whenVisibleInstances" })),
  ],
});
const entries = [
  element({ id: SERIES_ENTRY_SCOPE, name: "Protokollreihen-Einstieg", type: "root", role: "scopeRoot", parentId: null, order: 0 }),
  ...MEETING_SERIES.map((series, index) => m83DomainButton({ id: `${SERIES_ENTRY_SCOPE}.${series.key}`, name: series.label, parentId: SERIES_ENTRY_SCOPE, order: index + 1, actionKind: "openProtocolSeries" })),
];
export const projectMeetingSeriesEntryUiEditorContract = m83Component({
  componentId: SERIES_ENTRY_COMPONENT, scopeId: SERIES_ENTRY_SCOPE, requiredSlots: [],
  slots: entries.map(entry => m83Slot(entry.id, entry, { required: false, referenceKind: "multi", presence: "whenVisibleInstances" })),
});
