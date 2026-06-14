# UI-Editor SurfaceSelection-State im Launcher Referenzstand

## Kurzfazit

Der G59-Stand ist als read-only Referenzstand abgeschlossen. Der
BBM-Launcher nutzt den SurfaceSelection-State nur als interne Quelle fuer die
vorhandene kompakte Surface-Auswahl und SurfaceInfo. Sichtbar bleibt nur
`restarbeiten.ui.main` mit dem Label `Restarbeiten`. Es gibt keine echte
Umschaltung, keine weitere Surface, keine Bearbeitung, kein Drag, kein Resize
und keine Persistenz.

Seit G61 ist darauf aufbauend ein defensives read-only
Surface-Umschaltungsmodell vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Der Launcher-Referenzstand bleibt
sichtbar unveraendert.
Seit G62 ist dieser SurfaceSwitch-Stand als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
Seit G63 nutzt der Launcher das SurfaceSwitch-Modell intern read-only, ohne
die sichtbare Surface-Auswahl oder SurfaceInfo zu veraendern.

Seit G64 ist dieser Launcher-Einsatz als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.

## Aktueller read-only Stand

- Der Launcher baut die Surface-Auswahl defensiv aus dem
  SurfaceSelection-State.
- Intern ausgewaehlt bleibt ausschliesslich `restarbeiten.ui.main`.
- Verfuegbar bleibt ausschliesslich `restarbeiten.ui.main`.
- Die sichtbare UI bleibt unveraendert.
- PDF-/Plan-Surfaces bleiben nicht sichtbar und nicht auswaehlbar.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Launcher-Datenfluss

```text
Editorpanel im BBM-Launcher
-> SurfaceSelection-State
-> erlaubte selectedSurfaceId
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only SurfaceModel
-> kompakte Surface-Auswahl im Panel
-> kompakte SurfaceInfo im Panel
```

Der Datenfluss bleibt hostkontrolliert. Der Launcher fragt nur den erlaubten
read-only Zustand ab und erzeugt daraus die bestehende kompakte Anzeige.

G61 ergaenzt nur einen internen Modellpfad fuer Wechselwuensche:

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only Ergebnis
```

G62 referenziert denselben Pfad als abgeschlossenen Referenzstand:

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
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSwitchResultForLauncher(...)
-> SurfaceSwitchModel
-> resolvedSurfaceId restarbeiten.ui.main
-> SurfaceSelection-State
-> kompakte Surface-Auswahl im Panel
-> kompakte SurfaceInfo im Panel
```

## Sichtbare UI-Grenze

Sichtbar:

```text
- Surface-Auswahl: Restarbeiten
- SurfaceInfo: restarbeiten.ui.main / ui-screen / Elementanzahl
```

Nicht sichtbar:

```text
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
```

Es gibt kein Dropdown mit weiteren Optionen, keine grosse Surface-Liste und
keine Bearbeitungsbuttons.

## Interner State

```text
selectedSurfaceId:
- restarbeiten.ui.main

availableSurfaceIds:
- restarbeiten.ui.main

blocked:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

Blockierte Auswahlwuensche werden nicht ausgewaehlt. Der State faellt
defensiv auf den einzigen erlaubten Pilot `restarbeiten.ui.main` zurueck,
sofern dieser verfuegbar ist.

## Blockierte SurfaceIds

- `pdf.plan.page.1`
- `plan.canvas.default`
- unbekannte SurfaceIds
- `*`
- leere IDs

Diese SurfaceIds duerfen durch G60 weder sichtbar noch auswaehlbar werden.

## Sicherheitsgrenzen

- Read-only.
- Keine echte Umschaltung.
- Surface-Umschaltungsmodell nur read-only als Referenz, nicht als Ausfuehrung.
- SurfaceSwitch-Referenzstand ohne Launcher-Produktivintegration.
- G63 nutzt SurfaceSwitch im Launcher nur intern read-only.
- Guardrail-Begriff: keine echte Umschaltung.
- Kein Dropdown mit weiteren Optionen.
- Keine grosse Surface-Liste.
- Keine Bearbeitung.
- Kein Drag.
- Kein Resize.
- Keine Persistenz.
- Keine PDF-/Plan-Bearbeitung.
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

- Keine neue Produktivlogik.
- Keine sichtbare UI-Aenderung.
- Keine neue Surface sichtbar gemacht.
- Keine echte Surface-Umschaltung.
- Keine echte Surface-Umschaltung durch G61.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswaehlbar.
- Keine Bearbeitungsbuttons.
- Keine Drag-/Resize-Aktivierung.
- Keine Persistenzfreigabe.
- Keine alten Editorpfade.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Konzept- und Freigabepaket.
- Das G61-Surface-Umschaltungsmodell ist nur ein defensiver Referenzstand.
- Der G62-Abschluss aktiviert weiterhin keine echte Surface-Umschaltung.
- Weitere SurfaceIds nur ueber eigene Policy-/Allowlist-Freigabe sichtbar
  machen.
- PDF-/Plan-Surfaces separat read-only sichtbar machen, falls fachlich
  benoetigt.
- Drag, Resize und Persistenz jeweils getrennt planen, testen und sichtbar
  abnehmen.
- Fehlende Grundlagen-/Regeldateien als separates Repo-Hygiene-Paket klaeren.

## Testreferenz

- `npm run check:ui-editor-kit`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
