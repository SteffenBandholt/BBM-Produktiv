# layoutTools (Renderer)

This folder contains DEV-only UI helpers for layout fine-tuning in the renderer.

Scope and intent:
- Works on result views by selecting *layout zones* and applying live UI previews.
- It is **not** a table editor, **not** a column editor, and does **not** implement classic table/spreadsheet logic.
- Persistence (save/reset) is delegated to the hosting module via callbacks; layoutTools itself should not talk to DB/IPC.

DEV-only contract:
- Hosting modules must ensure this UI is only enabled in the DEV build channel.
- In STABLE, there must be no layout tools, no clickable zones, no green markers, and no save/reset actions.

Pilot:
- The first pilot surface is the Protokoll TOP list (UI + print preview), implemented via a surface definition
  in `src/renderer/modules/protokoll/layoutSurfaces/`.

