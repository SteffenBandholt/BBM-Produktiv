# LayoutTools Persistence Notes (DEV-only)

`layoutTools/` itself does not persist anything.
Persistence is implemented by the hosting surface/module via callbacks (save/reset) and the existing
`tableLayouts*` IPC/DB plumbing.

This note documents the conventions used by the current pilots:
- Protokoll TOP-Liste (UI + PDF): `tableKey = protokoll_tops`
- Protokoll Teilnehmerliste (PDF): `tableKey = protokoll_participants`

## Identity (where a layout is stored)

Layouts are stored/loaded via the `tableLayouts` identity:
- `moduleId`: the owning module (pilot: `protokoll`)
- `tableKey`: the table/surface key (for example: `protokoll_tops`, `protokoll_participants`)
- `orientation`: `portrait` / `landscape`
- optional scope fields (scopeType/scopeId) if the IPC supports it

Important: UI and PDF must use the same identity, but **must not overwrite each other's values**.
Separation is achieved inside the stored layout object.

## UI vs PDF separation (pilot: protokoll_tops)

The stored layout contains both UI and PDF fields. The pilot uses the shared helper:
- `extractProtokollTopsEditorValues(layout)`
- `buildProtokollTopsLayoutOverlay(values, orientation)`

Conventions:
- UI fine-tuning writes `ui*` values (e.g. `uiNumberWidth`, `uiTextInset`, `uiMetaFontSize`).
- PDF fine-tuning writes `pdf*` values (e.g. `pdfMetaWidth`, `pdfMetaInset`, `pdfMetaFontSize`).
- Reset must reset only the relevant medium's overrides by using `tableLayoutsReset` for the same identity.

## PDF width gotcha (pilot: protokoll_tops)

For `protokoll_tops`, sanitization may reconstruct PDF widths from `layout.columns[].pdfWidth`.
Therefore, when persisting a PDF column width override, the save path must also update the corresponding
entry in `columns[]` (e.g. for meta/number/text) so the stored value survives normalization.

## Participants PDF notes (pilot: protokoll_participants)

For `protokoll_participants` (PDF):
- PDF widths are stored in `layout.columns[].pdfWidth` (for example: `"34mm"`).
- PDF inset/font are stored in `layout.pdf.rootVars` (table-specific variables per zone/column).
- Reset should only affect the active zone by:
  - restoring that column's `pdfWidth` from the table's default layout
  - deleting only the active zone's `pdf.rootVars` entries

## Live preview

Live preview values are only applied to the running UI/preview window (CSS vars / inline styles) and must:
- never leak into STABLE builds
- never appear in the real generated PDF output (no green markers in export)
