# UI-Editor SurfaceSelection read-only

## Kurzfazit

Das SurfaceSelection-Modell ist read-only vorbereitet und wird seit G56 im
bestehenden Editorpanel kompakt sichtbar genutzt. Die sichtbare read-only
Auswahl zeigt aktuell ausschliesslich den Pilot `restarbeiten.ui.main` als
`Restarbeiten`. Sie aktiviert keine Umschaltung, keine Bearbeitung und keine
neue Launcher-Funktion.

Seit G57 ist dieser sichtbare read-only Stand als Referenz dokumentiert:
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md`.
Seit G58 ist zusaetzlich ein interner read-only SurfaceSelection-State
vorbereitet: `docs/UI_EDITOR_SURFACE_SELECTION_STATE_READONLY.md`.
Seit G59 nutzt der BBM-Launcher diesen State read-only als interne Quelle fuer
die bestehende kompakte Anzeige. Die sichtbare Ausgabe bleibt unveraendert.
Seit G60 ist der Launcher-State-Referenzstand abgeschlossen:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
Seit G61 ist ein defensives read-only Surface-Umschaltungsmodell vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Es bleibt bei
`restarbeiten.ui.main` als einzig aufloesbarer SurfaceId.
Seit G62 ist dieser SurfaceSwitch-Stand als read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
Seit G63 verwendet der BBM-Launcher das SurfaceSwitch-Modell intern read-only;
die kompakte Auswahl bleibt sichtbar unveraendert.

Seit G64 ist dieser Launcher-Einsatz als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.
Der G66-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md` dokumentiert.
G67 nutzt den Command intern read-only im Launcher, ohne sichtbare
Umschaltung.
Der G68-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md` dokumentiert.
Der G69-Gesamt-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md` dokumentiert.

## Aktueller Modellstand

Die SurfaceSelection wird aus zwei hostseitigen Quellen abgeleitet:

- SurfaceAdapterCatalog: SurfaceId muss bekannt sein.
- SurfacePolicy: `readable === true` und `visibleInEditor === true`.

Aktuell ergibt das nur:

```text
restarbeiten.ui.main
```

Nicht auswaehlbar bleiben:

```text
pdf.plan.page.1
plan.canvas.default
unbekannte SurfaceIds
*
```

## Modell

Beispiel:

```js
{
  surfaces: [
    {
      surfaceId: "restarbeiten.ui.main",
      label: "Restarbeiten",
      surfaceType: "ui-screen",
      selected: true,
      readonly: true,
      capabilities: {
        canDrag: false,
        canResize: false,
        canPersist: false
      }
    }
  ]
}
```

Es gibt kein Default-true. Capabilities werden nur aus der SurfacePolicy
uebernommen.

## Datenfluss Modell

```text
BBM-Test / spaeter Editorpanel-Host
-> buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-Modell
```

## Datenfluss sichtbare Anzeige

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> kompakte read-only Surface-Auswahl im bestehenden Panel
```

## Datenfluss State-Vorbereitung

```text
buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only SurfaceSelection-State
```

## Datenfluss Umschaltungsmodell

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only Ergebnis
```

Referenzfluss seit G62:

```text
SurfaceSwitch-Wunsch
-> SurfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> erlaubtes resolvedSurfaceId
-> kein produktiver Wechsel im Launcher
```

Launcher-Nutzung seit G63:

```text
BBM-Launcher
-> buildReadonlySurfaceSwitchResultForLauncher(...)
-> resolvedSurfaceId restarbeiten.ui.main
-> buildReadonlySurfaceSelectionForLauncher(...)
-> kompakte read-only Surface-Auswahl
```

## Sicherheitsgrenzen

Guardrail-Begriff: sichtbare read-only Auswahl.
Guardrail-Begriff: keine PDF-/Plan-Surface sichtbar.

- Sichtbare read-only Auswahl nur fuer `restarbeiten.ui.main`.
- Keine Umschaltung.
- SurfaceSelection-State wird im Launcher nur read-only als Quelle genutzt.
- Surface-Umschaltungsmodell ist nur ein read-only Referenzmodell.
- SurfaceSwitch-Referenzstand aktiviert keine echte Umschaltung.
- SurfaceSwitch wird im Launcher nur intern read-only genutzt.
- Keine Dropdown-/Listen-UI.
- Keine PDF-/Plan-Surface sichtbar.
- Keine Bearbeitung.
- Kein Drag.
- Guardrail-Begriff: kein Drag.
- Kein Resize.
- Guardrail-Begriff: kein Resize.
- Keine Persistenz.
- Guardrail-Begriff: keine Persistenz.
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

- Keine neue grosse Panel-Sektion.
- Keine Surface-Liste.
- Keine produktive Surface-Umschaltung.
- Keine echte Surface-Umschaltung.
- Keine Erweiterung der sichtbaren SurfaceIds.
- Keine automatische PDF-/Plan-Freigabe.
- Keine Drag-/Resize-/Persistenz-Ausfuehrung.

## Testreferenz

- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
