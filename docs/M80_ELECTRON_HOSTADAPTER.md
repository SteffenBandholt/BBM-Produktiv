# M80 – führender Electron-HostAdapter

Der produktführende M80-Pfad ist:

`UI-Editor öffnen` → `window.uiEditor` → BBM-Maincontroller → lokale Named Pipe → nativer WPF-Editor → vorhandener Node-Core → vorhandene Profil-/Rollbacklogik.

## Führende BBM-Dateien

- `src/main/ui-editor/electronUiEditorSession.js`: genau eine Sitzung, vertrauenswürdige Pfadauflösung, Handshake, Pipe, Heartbeat und Lifecycle.
- `src/main/preload.js`: eng begrenzte `uiEditor`-API ohne generisches IPC.
- `src/renderer/ui-editor/m80Registry.js`: einzige M80-Pilotregistry.
- `src/renderer/ui-editor/m80Refs.js`: einzige explizite ID-zu-Element-Referenzauflösung.
- `src/renderer/ui-editor/m80HostAdapter.js`: Registry, LayoutState, ChangeRequest, Readback und Rollback.
- `src/renderer/ui-editor/m80Bridge.js`: feste Main-/Preload-/Renderer-Nachrichten.

Der HostAdapter akzeptiert nur registrierte IDs, freigegebene Layoutoperationen und fachfreie Payloads. Er überträgt keine DOM-Knoten oder Fachwerte. Fehler werden auf den unmittelbar vorherigen Layoutzustand zurückgerollt und strukturiert gemeldet.

Historische Pfade unter `uiEditor/`, `src/renderer/uiInspector/`, `src/renderer/uiV2/`, `src/ui-editor/`, der übrigen `src/renderer/ui-editor/`-Historie und `src/renderer/editorRuntime/` bleiben erhalten, sind für M80 aber nicht produktführend. Es wurde kein zweiter Editor ausgebaut.
