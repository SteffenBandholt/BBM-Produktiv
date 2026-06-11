# UI-Editor Preview-Runtime API

## Zweck

Dieses BBM-Dokument ist nur noch ein Verweis- und Integrationshinweis. Die Preview-Runtime-API buendelt die fachneutralen Hilfen fuer temporaere UI-Editor-Vorschauen; die fachliche API-Quelle liegt im externen UI-Editor-kit.

Die lokale BBM-Kopie wurde entfernt. BBM konsumiert die Runtime ueber die renderer-kompatible Bridge und ist nicht mehr der fachliche Ort der API.

Aktueller produktiver BBM-Pfad:

- UI-Editor-kit `src/runtime/preview/index.mjs`
- BBM-Bridge `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`
- Launcher `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`

Der fruehere lokale Einstieg `src/renderer/editorRuntime/preview/index.js` ist entfernt. Neue generische Preview-Runtime-Logik gehoert ins UI-Editor-kit; BBM-spezifisch bleibt nur die Bridge-/Hostintegration.

## Exportierte Funktionen

Operationen:

- `getElementAllowedOps(element)`
- `getElementLockedOps(element)`
- `getChangeRequestOperation(operation)`
- `isPreviewOperationAllowed(element, operation)`

Preview-Zielmodell:

- `getNodeUiEditorId(node)`
- `findAncestorUiEditorElementById(targetNode, elementId)`
- `normalizePreviewTargetMode(value)`
- `getPreviewTargetMode(registryElement)`
- `resolvePreviewTargetElement(options)`
- `getPreviewTargetElement(state)`
- `getPreviewTargetElementId(state, targetNode)`

Temporäre ChangeRequests:

- `UNKNOWN_PREVIEW_TARGET_APP_ID`
- `upsertPreviewChangeRequest(options)`
- `removePendingChangeRequestsForTarget(options)`
- `getPendingChangeRequestSummary(state, elementId)`

## Erwartete Datenstrukturen

Die API erwartet neutrale Registry-Elemente mit Feldern wie:

- `id`
- `parentId`
- `allowedOps`
- `lockedOps`
- `previewTargetMode`
- `previewTarget`
- `editGranularity`
- `affectsContainer`

Die API erwartet einen neutralen Runtime-State mit Feldern wie:

- `selectedElement`
- `selectedTargetNode`
- `selectedPreviewTargetNode`
- `pendingChangeRequests`
- `activeUiScope`
- `targetAppId`
- `moduleId`
- `scopeId`

Fuer Preview-ChangeRequests kann der Host-Kontext uebergeben werden:

- `hostContext.targetAppId`
- `hostContext.moduleId`
- `hostContext.scopeId`

`targetAppId` wird generisch aus HostContext, Registry oder State gelesen. Falls kein Host-Wert vorhanden ist, wird der neutrale technische Fallback `unknown-host` genutzt.

DOM-Bezug ist nur fuer explizit markierte Preview-Ziele vorgesehen:

- `getAttribute("data-ui-editor-id")`
- `parentElement`

Optionale Callbacks:

- `getRegisteredElementById(id)`
- `getNextChangeRequestId(state)`
- `notify(state)`

## Bewusst Nicht Enthalten

Nicht Teil dieser Preview-Runtime-API sind:

- DOM-Panel
- Drag-Panel
- BBM-CoreShell
- konkrete BBM-HostAdapter-Erzeugung
- aktive BBM-Scope-Auswahl
- Restarbeiten-Registry
- fachliche Elementlisten
- Speicherung
- IPC-, DB- oder Storage-Wege
- `localStorage`
- Datei-Schreibwege
- PDF-, Druck-, Mail-, Upload-, Import- oder Autosave-Logik
- alte Editor-, EditorLab-, EditorV2-, `editor.html`-, `editor.js`- oder `editorIpc.js`-Pfade

## Verwendung im UI-Editor-kit

Das Kit stellt die gleichen Exports mit neutralen Tests bereit und darf keine BBM- oder Modulbegriffe aufnehmen.

BBM bleibt Host-App. App-spezifische Werte wie `targetAppId: "bbm"` muessen aus HostContext, HostAdapter oder Registry kommen, nicht aus der generischen Preview-Runtime.

## Abschlussstand in BBM

- UI-Editor-kit ist die einzige fachliche Runtime-Quelle.
- BBM nutzt die Runtime produktiv ueber `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`.
- Der Electron-Renderer darf keinen Bare-Package-Import `ui-editor-kit/runtime/preview` verwenden.
- Das browserfaehige Kit-ESM darf nicht auf `.cjs`, `require` oder `createRequire` zurueckfallen.
- Panel, Drag, Markierung, HostAdapter und DOM-Preview-Anwendung bleiben BBM-Orchestrierung.
