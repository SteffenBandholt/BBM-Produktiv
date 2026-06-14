# UI-Editor SurfaceSwitch im Launcher read-only Referenzstand

## Kurzfazit

Der G64-Stand schliesst den SurfaceSwitch-Einsatz im BBM-Launcher als stabilen
read-only Referenzstand ab. Der Launcher nutzt das Modell nur intern als
vorgeschaltete Referenz vor der SurfaceSelection; sichtbar bleibt die bestehende
kompakte Surface-Auswahl mit `Restarbeiten` und die SurfaceInfo fuer
`restarbeiten.ui.main`.

Es gibt keine echte Umschaltung, keine sichtbare UI-Aenderung und keine
Launcher-Produktivintegration.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.
Der G66-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md` dokumentiert.
G67 nutzt den Command intern read-only im Launcher; die sichtbare Surface-
Auswahl und SurfaceInfo bleiben unveraendert.
Der G68-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md` dokumentiert.

## Aktueller read-only Stand

- Launcher-Helfer:
  `buildReadonlySurfaceSwitchResultForLauncher(...)`
- Read-only Modell:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Erlaubtes / resolved Ziel: `restarbeiten.ui.main`
- Blockierte Ziele: `pdf.plan.page.1`, `plan.canvas.default`, unbekannte
  SurfaceIds, `*` und leere IDs
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Launcher-Datenfluss

```text
Editorpanel im BBM-Launcher
-> read-only SurfaceSwitchModel
-> erlaubtes resolvedSurfaceId
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only SurfaceModel
-> kompakte Surface-Auswahl im Panel
-> kompakte SurfaceInfo im Panel
```

Der Datenfluss bleibt rein modellhaft und fuehrt keine Produktivaktion im
Launcher aus.

## Erlaubte / blockierte Wechselziele

```text
erlaubt / resolved:
- restarbeiten.ui.main

blockiert:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

Ein erlaubter Wunsch bleibt auf `restarbeiten.ui.main` resolved. Blockierte
Wuensche werden defensiv ebenfalls auf `restarbeiten.ui.main` zurueckgefuehrt.

## Sichtbare UI-Grenze

```text
sichtbar:
- Surface-Auswahl: Restarbeiten
- SurfaceInfo: restarbeiten.ui.main / ui-screen / Elementanzahl

nicht sichtbar:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
```

Die Anzeige bleibt kompakt und read-only. Es gibt weder Dropdown noch grosse
Surface-Liste.

## Sicherheitsgrenzen

- read-only.
- keine echte Umschaltung.
- keine sichtbare UI-Aenderung.
- keine Launcher-Produktivintegration.
- keine PDF-/Plan-Auswahl.
- keine Bearbeitung.
- kein Drag.
- kein Resize.
- keine Persistenz.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik.
- Keine neue UI-Funktion.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswaehlbar.
- Kein Dropdown mit weiteren Optionen.
- Keine grosse Surface-Liste.
- Keine Bearbeitungsbuttons.
- Keine Drag-Aktivierung.
- Keine Resize-Aktivierung.
- Keine Persistenzfreigabe.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Konzept- und Freigabepaket.
- Weitere SurfaceIds nur ueber eigene Policy-/Allowlist-Freigabe sichtbar
  machen.
- PDF-/Plan-Surfaces separat read-only sichtbar machen, falls fachlich
  benoetigt.
- Drag, Resize und Persistenz jeweils getrennt planen, testen und sichtbar
  abnehmen.

## Testreferenz

- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
