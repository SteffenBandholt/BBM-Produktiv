# layoutTools (Renderer)

This folder contains DEV-only UI helpers for layout fine-tuning in the renderer.

Scope and intent:
- Works on result views by selecting *layout zones* and applying live UI previews.
- A **surface** is a result view/screen (for example: "TOP-Liste" or "Teilnehmerliste (PDF)").
- A **zone** is a layout-tunable area inside a surface (for example: "Nummernblock", "Name").
- It is **not** a table editor, **not** a column editor, and does **not** implement classic table/spreadsheet logic.
- Persistence (save/reset) is delegated to the hosting module via callbacks; layoutTools itself should not talk to DB/IPC.

DEV-only contract:
- Hosting modules must ensure this UI is only enabled in the DEV build channel.
- In STABLE, there must be no layout tools, no clickable zones, no green markers, and no save/reset actions.

Real PDF exports:
- Layout markers must never appear in real PDF output.
- Markers must be preview-only (overlay/outline/box-shadow) and guarded behind a DEV-only preview flag.

Persistence rules (high level):
- Keep UI and PDF values separated (same identity, different fields inside the stored layout).
- Do not rename stored keys or tableKeys once in use.
- Details live in `PERSISTENCE.md`.

Current examples (pilot users):
- Protokoll TOP-Liste (UI + PDF preview):
  `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
- Protokoll Teilnehmerliste (PDF preview):
  `src/renderer/modules/protokoll/layoutSurfaces/participantsPdfLayoutSurface.js`
