# UI-Editor Panel/Drag Referenzstand

## Kurzfazit

Der Panel/Drag-Stand ist nach G46 als stabiler Referenzstand festgehalten.
BBM nutzt fuer die reine Preview-Panel-Positionsberechnung den PanelRuntime-
Panel-Drag-Helper aus dem UI-Editor-kit. Die direkte DragRuntime-Nutzung im
Launcher fuer Panel-Positionierung ist entfernt.

## Umgesetzter Stand

- `BbmUiEditorRuntimeLauncher.js` bleibt Host fuer DOM-, Mouse- und spaeter
  moegliche Pointer-Anbindung.
- `uiEditorKitPanelRuntimeBridge.js` stellt die PanelRuntime aus dem
  UI-Editor-kit renderer-kompatibel bereit.
- Der PanelRuntime-Panel-Drag-Helper berechnet aus Startbounds, Delta und
  Viewportbounds die naechsten Panel-Bounds.
- Die DragRuntime bleibt intern im UI-Editor-kit hinter dem Panel-Drag-Helper.
- Style-Setzen, Panel-Open/Close, Panel-Reset und Hidden-Elements-Button/
  Popover bleiben im BBM-Launcher.

## Datenfluss

```text
Mouse-/DOM-Event im BBM-Launcher
-> Start-Bounds + Delta + Viewport-Bounds
-> uiEditorKitPanelRuntimeBridge
-> PanelRuntime Panel-Drag-Helper im UI-Editor-kit
-> berechnete Bounds
-> Style-Setzen im BBM-Launcher
```

## Verwendete Funktionen

Aus `ui-editor-kit/runtime/panel` ueber die BBM-Bridge:

- `PANEL_DRAG_COORDINATE_SYSTEM`
- `calculatePanelDragPosition(input)`
- `buildPanelDragResult(input)` als bereitgestellter Helper
- `normalizePanelDragInput(input)` als bereitgestellter Helper

Produktiv verwendet der Launcher fuer die Preview-Panel-Positionierung
`calculatePanelDragPosition(...)` mit `css-pixels`.

## Sicherheitsgrenzen

- DOM-/Mouse-/Pointer-Anbindung bleibt im BBM-Launcher.
- UI-Editor-kit speichert nicht.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB.
- Keine Registry-Aenderung.
- Keine Fachlogik.
- Kein PDF/Canvas/Plan.
- Keine neue UI-Funktion.

## Bewusst nicht umgesetzt

- Keine weitere Drag-Auslagerung.
- Kein generischer Drag-Controller im Launcher.
- Keine PDF-, Canvas- oder Plan-Aktivierung.
- Keine neue Panel-Funktion.
- Keine neue Persistenzart.
- Keine alten Editorpfade.

## Test-/Pruefreferenz

- `npm run check:ui-editor-kit`
- `node scripts/tests/uiEditorKitPanelRuntimeBridge.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

Die Electron-Sichtpruefung wurde in G46 bestanden. Fuer G47 ist keine erneute
Sichtpruefung erforderlich, solange nur Dokumentation oder Status geaendert
wird.
