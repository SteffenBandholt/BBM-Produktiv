# UI-Editor SurfaceAdapter Referenzstand

## Kurzfazit

Der SurfaceAdapter-Katalog ist als stabiler read-only Referenzstand
abgeschlossen. BBM kann bekannte SurfaceAdapter zentral finden, neutrale
SurfaceModels bauen und diese ueber die SurfaceRuntime des UI-Editor-kit
validieren. Es gibt weiterhin keine Produktivnutzung im Launcher.

## Aktueller read-only Stand

- BBM hat eine SurfaceRuntime-Bridge:
  `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js`
- BBM hat einen read-only UI-SurfaceAdapter:
  `src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js`
- BBM hat ein read-only PDF-/Plan-SurfaceAdapter-Skelett:
  `src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js`
- BBM hat einen zentralen read-only SurfaceAdapterCatalog:
  `src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js`
- Alle Modelle bleiben neutral und werden ueber die Kit-SurfaceRuntime
  validiert.

## Vorhandene Adapter

### Restarbeiten UI-Surface

```text
surfaceId: restarbeiten.ui.main
surfaceType: ui-screen
coordinateSystem: css-pixels
```

Der Adapter liest vorhandene HostAdapter-/Registry-Daten und aktuellen
LayoutState read-only. Er vermisst kein DOM und schreibt nichts.

### PDF-Seite

```text
surfaceId: pdf.plan.page.1
surfaceType: pdf-page
coordinateSystem: pdf-points
elements: []
```

Das Modell ist nur ein leeres Surface-Skelett. Es bearbeitet keine PDF-Datei
und nutzt keine PDF- oder Canvas-Renderlogik.

### Plan-Surface

```text
surfaceId: plan.canvas.default
surfaceType: plan
coordinateSystem: canvas-pixels
elements: []
```

Das Modell ist nur ein leeres Surface-Skelett. Es bearbeitet keine Plan- oder
Canvas-Flaeche.

## Vorhandener Katalog

Der SurfaceAdapterCatalog stellt read-only Hilfen bereit:

- `getKnownSurfaceAdapterIds()`
- `getSurfaceAdapterById(surfaceId)`
- `isKnownSurfaceAdapterId(surfaceId)`
- `buildSurfaceModelById(surfaceId, input)`
- `validateSurfaceModelById(surfaceId, input)`

Der Katalog ist keine Freigabelogik fuer Produktivnutzung. Er ist nur ein
kontrollierter Such- und Testpunkt fuer bekannte Adapter.

Seit G52 ist dem Katalog eine read-only SurfacePolicy vorgeschaltet. Bekannte
Adapter werden nur geliefert, wenn die Policy fuer die SurfaceId
`readable: true` meldet. Seit G53 ist `restarbeiten.ui.main` zusaetzlich als
kompakte read-only SurfaceInfo im Editorpanel sichtbar. Das ist keine
Bearbeitungsfreigabe: Drag, Resize und Persistenz bleiben weiterhin fuer alle
SurfaceIds gesperrt; PDF und Plan bleiben `visibleInEditor: false`.
Seit G54 ist dieser sichtbare SurfaceInfo-Stand als eigener read-only
Referenzstand dokumentiert:
`docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md`.
Seit G55 existiert zusaetzlich ein read-only SurfaceSelection-Modell unter
`src/renderer/uiEditor/surfaceAdapters/surfaceSelectionModel.js`. Es nutzt den
Katalog nur zusammen mit der SurfacePolicy. Seit G56 nutzt das bestehende
Editorpanel dieses Modell sichtbar, aber nur als kompakte read-only Anzeige fuer
`restarbeiten.ui.main`.
Seit G57 ist diese Anzeige in
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` als stabiler
read-only Referenzstand abgeschlossen.
Seit G58 ist ein interner read-only SurfaceSelection-State vorbereitet. Er
bleibt an Katalog und SurfacePolicy gebunden und aktiviert keine echte
Umschaltung.
Seit G59 nutzt der BBM-Launcher diesen State read-only als interne Quelle fuer
die vorhandene kompakte Surface-Auswahl und SurfaceInfo; die sichtbare Ausgabe
bleibt unveraendert.
Seit G60 ist diese Launcher-State-Nutzung als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
Seit G61 ist ein defensives read-only Surface-Umschaltungsmodell vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Es nutzt Katalog und Policy nur
ueber den bestehenden SurfaceSelection-State und aktiviert keine echte
Umschaltung.
Seit G62 ist dieser SurfaceSwitch-Stand als read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
Seit G63 nutzt der BBM-Launcher das SurfaceSwitch-Modell intern read-only und
bleibt dabei an Katalog, Policy und SurfaceSelection gebunden.

Seit G51 kann der BBM-Launcher den Katalog read-only testseitig ueber
`buildReadonlySurfaceModelForLauncher(surfaceId, input)` verwenden. Diese
Hilfsfunktion erzeugt keine sichtbare Surface-Anzeige und aktiviert keine
produktive Surface-Auswahl.

## Bekannte SurfaceIds

```text
restarbeiten.ui.main
pdf.plan.page.1
plan.canvas.default
```

## Blockierte unbekannte SurfaceIds

Unbekannte SurfaceIds werden kontrolliert blockiert:

```text
UNKNOWN_SURFACE_ADAPTER
```

Es gibt keine Wildcard und keinen Default-Adapter. Beispiele wie
`pdf.plan.page.2`, `*` oder unbekannte App-Scopes werden nicht automatisch
erlaubt.

## Datenfluss

```text
BBM-Test / spaeter Host-Aufruf
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> konkreter read-only SurfaceAdapter
-> neutrales SurfaceModel
-> uiEditorKitSurfaceRuntimeBridge
-> SurfaceRuntime im UI-Editor-kit
-> Validierung/Normalisierung
```

Launcher-Testpfad seit G51:

```text
BBM-Launcher-Test
-> buildReadonlySurfaceModelForLauncher(surfaceId, input)
-> SurfaceAdapterCatalog
-> konkreter read-only SurfaceAdapter
-> neutrales SurfaceModel
-> SurfaceRuntime-Validierung
```

Editorpanel-Info seit G53/G54:

```text
Editorpanel im BBM-Launcher
-> SurfacePolicy
-> visibleInEditor-Pruefung
-> buildReadonlySurfaceModelForLauncher(...)
-> SurfaceAdapterCatalog
-> restarbeitenMainSurfaceAdapter
-> SurfaceRuntime-Validierung ueber Bridge
-> kompakte SurfaceInfo im Panel
```

SurfaceSelection-Modell seit G55:

```text
BBM-Test / spaeter Editorpanel-Host
-> buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-Modell
```

Sichtbare Surface-Auswahl seit G56:

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> kompakte read-only Anzeige fuer restarbeiten.ui.main
```

SurfaceSelection-State im Launcher seit G59:

```text
BBM-Test / BBM-Launcher
-> buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-State
```

Surface-Umschaltungsmodell seit G61:

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only Ergebnis
```

SurfaceSwitch-Referenzfluss seit G62:

```text
SurfaceSwitch-Wunsch
-> SurfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> erlaubtes resolvedSurfaceId
-> kein produktiver Wechsel im Launcher
```

Launcher-Nutzung seit G63:

```text
BBM-Launcher
-> buildReadonlySurfaceSwitchResultForLauncher(...)
-> SurfaceSwitchModel
-> SurfaceAdapterCatalog/SurfacePolicy ueber SurfaceSelection
-> resolvedSurfaceId restarbeiten.ui.main
```

## Sicherheitsgrenzen

- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds blockiert.
- SurfacePolicy blockiert unbekannte SurfaceIds und Wildcards vollstaendig.
- Bekannte SurfaceIds sind nur read-only lesbar.
- Editor-Sichtbarkeit nur fuer kompakte read-only Surface-Auswahl und SurfaceInfo von `restarbeiten.ui.main`.
- Keine Editor-Sichtbarkeit fuer PDF-/Plan-Surfaces.
- Keine Produktivnutzung fuer Surface-Umschaltung im Launcher.
- Keine grosse neue Panel-Sektion.
- Keine automatische Surface-Liste.
- SurfaceSelection ist nur read-only sichtbar angebunden.
- SurfaceSelection-State ist im Launcher nur read-only angebunden.
- Surface-Umschaltungsmodell ist nur read-only vorbereitet.
- SurfaceSwitch-Referenzstand aktiviert keinen produktiven Launcher-Wechsel.
- Launcher nutzt SurfaceSwitch nur intern read-only.
- Keine Surface-Umschaltung.
- Keine PDF-/Plan-Bearbeitung.
- Keine PDF-/Canvas-Renderlogik.
- Kein Drag.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine Fachlogik.
- Kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine produktive Surface-Auswahl.
- Keine echte Surface-Umschaltung.
- Keine PDF- oder Plan-Bearbeitung.
- Keine Canvas-Bearbeitung.
- Keine DragRuntime-Nutzung auf PDF/Plan.
- Keine neue Persistenzart.
- Keine neue Scope-Freigabe.
- Keine alten Editorpfade.

## Moegliche naechste Pakete

- Sichtbare Surface-Freigaben nur ueber eigene Folgepakete und nicht ueber den read-only Katalog.
- Weitere SurfaceIds nur explizit und einzeln freigeben.
- Read-only Host-Aufruf ausserhalb des Launchers testen.
- PDF-/Plan-Landkarten separat fachlich definieren.
- Echte PDF-/Plan-Bearbeitung nur in einem eigenen Paket mit eigener
  Sicht-/Fachpruefung vorbereiten.

## Testreferenz

- `node scripts/tests/uiEditorKitSurfaceRuntimeBridge.test.cjs`
- `node scripts/tests/restarbeitenSurfaceAdapter.test.cjs`
- `node scripts/tests/pdfPlanSurfaceAdapter.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
