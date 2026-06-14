# UI-Editor SurfaceSelection-State read-only

## Kurzfazit

Der SurfaceSelection-State ist read-only vorbereitet. Er beschreibt intern,
welche Surface aktuell ausgewaehlt ist, welche SurfaceIds im Editor ueberhaupt
auswaehlbar waeren und welche Auswahlwuensche blockiert werden. Er aktiviert
keine echte Umschaltung, keine neue sichtbare UI und keine Persistenz.

Seit G59 verwendet der BBM-Launcher diesen State read-only als interne Quelle
fuer die vorhandene kompakte Surface-Auswahl und SurfaceInfo. Die sichtbare
Ausgabe bleibt unveraendert.

Seit G60 ist diese Launcher-Nutzung als eigener Referenzstand dokumentiert:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.

Seit G61 nutzt das read-only Surface-Umschaltungsmodell diesen State als
defensive Referenz fuer Wechselwuensche:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Auch dort bleibt nur
`restarbeiten.ui.main` aufloesbar.

## Aktueller State

```js
{
  selectedSurfaceId: "restarbeiten.ui.main",
  requestedSurfaceId: "",
  readonly: true,
  availableSurfaceIds: ["restarbeiten.ui.main"],
  blockedSurfaceIds: [
    "pdf.plan.page.1",
    "plan.canvas.default"
  ],
  selectionAllowed: true,
  reason: "readonly-single-surface"
}
```

Aktuell kann nur `restarbeiten.ui.main` ausgewaehlt sein. Das Label der
sichtbaren read-only Auswahl bleibt `Restarbeiten`.

## Blockierte Auswahlwuensche

Diese SurfaceIds duerfen nicht ausgewaehlt werden:

```text
pdf.plan.page.1
plan.canvas.default
unbekannte SurfaceIds
*
leere IDs
```

Wenn eine blockierte SurfaceId als Wunsch uebergeben wird, wird sie nicht
ausgewaehlt. Der State faellt defensiv auf den einzigen erlaubten Pilot
`restarbeiten.ui.main` zurueck, sofern dieser im aktuellen read-only Modell
verfuegbar ist.

## Datenfluss

```text
BBM-Test / BBM-Launcher
-> buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> visibleInEditor-Pruefung
-> SurfaceAdapterCatalog
-> read-only SurfaceSelection-State
-> kompakte read-only Surface-Auswahl/SurfaceInfo
```

Read-only Umschaltungsmodell seit G61:

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only Ergebnis
```

Der State ist nur read-only angebunden. Die sichtbare G56/G57-Auswahl bleibt
unveraendert und zeigt weiterhin nur `Restarbeiten`.

## Sicherheitsgrenzen

Guardrail-Begriff: kein Drag.
Guardrail-Begriff: kein Resize.
Guardrail-Begriff: keine Persistenz.

- Read-only.
- Keine echte Umschaltung.
- Keine Dropdown-/Listen-UI mit weiteren Optionen.
- Keine weitere Surface sichtbar oder auswaehlbar.
- Launcher verwendet den State nur als interne Quelle.
- Surface-Umschaltungsmodell verwendet den State nur als read-only Referenz.
- Kein Drag.
- Kein Resize.
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

- Keine sichtbare UI-Aenderung.
- Keine Surface-Umschaltung.
- Keine echte Umschaltung ueber das Surface-Umschaltungsmodell.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswaehlbar.
- Keine Bearbeitungsbuttons.
- Keine Drag-/Resize-Aktivierung.
- Keine Speicherlogik.

## Testreferenz

- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
