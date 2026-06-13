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
`readable: true` meldet. Diese Policy ist keine UI-Freigabe: Alle bekannten
SurfaceIds bleiben `visibleInEditor: false`, `canDrag: false`,
`canResize: false` und `canPersist: false`.

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

## Sicherheitsgrenzen

- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds blockiert.
- SurfacePolicy blockiert unbekannte SurfaceIds und Wildcards vollstaendig.
- Bekannte SurfaceIds sind nur read-only lesbar.
- Keine Editor-Sichtbarkeit ueber die Policy.
- Keine Produktivnutzung im Launcher.
- Keine sichtbare Surface-Anzeige im Launcher.
- Keine neue Panel-Sektion.
- Keine automatische Surface-Liste.
- Keine sichtbare UI-Aenderung.
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

- Keine Launcher-Integration.
- Keine sichtbare Launcher-Nutzung.
- Keine produktive Surface-Auswahl.
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
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
