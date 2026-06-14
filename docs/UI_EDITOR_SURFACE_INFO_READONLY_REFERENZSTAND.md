# UI-Editor SurfaceInfo read-only Referenzstand

## Kurzfazit

Die erste sichtbare SurfaceInfo im bestehenden Editorpanel ist als stabiler
read-only Referenzstand abgeschlossen. Sichtbar ist nur der Pilot
`restarbeiten.ui.main`. Angezeigt werden SurfaceId, SurfaceType und
Elementanzahl. Seit G56 steht darueber zusaetzlich eine kompakte read-only
Surface-Auswahl fuer denselben Pilot. Es gibt keine Umschaltung, keine
Bearbeitung, keinen Drag, kein Resize und keine Persistenz.
Seit G57 ist die Surface-Auswahl in
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` als eigener
read-only Referenzstand abgeschlossen.
Seit G58 existiert zusaetzlich ein interner read-only SurfaceSelection-State;
die SurfaceInfo-Anzeige bleibt dadurch unveraendert.
Seit G59 nutzt der BBM-Launcher diesen State read-only als interne Quelle fuer
Surface-Auswahl und SurfaceInfo; die sichtbare Ausgabe bleibt unveraendert.
Seit G60 ist diese Launcher-State-Nutzung als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
Seit G69 ist der gesamte read-only Surface-Steuerungsstand als Gesamt-Referenz
abgeschlossen:
`docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md`.

## Aktueller read-only Stand

- Das bestehende Editorpanel im BBM-Launcher zeigt eine kompakte SurfaceInfo.
- Die SurfaceInfo ist rein lesend.
- Die SurfaceInfo wird nur fuer `restarbeiten.ui.main` aufgebaut.
- Seit G56 nutzt das Panel das read-only SurfaceSelection-Modell sichtbar, aber
  nur als kompakte Anzeige fuer `restarbeiten.ui.main`.
- Seit G59 geht diese Anzeige intern vom read-only SurfaceSelection-State aus.
- Die SurfaceRuntime des UI-Editor-kit validiert das neutrale SurfaceModel
  ueber die BBM-Bridge.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Sichtbarer Pilot-Surface

```text
surfaceId: restarbeiten.ui.main
surfaceType: ui-screen
angezeigt: SurfaceId, SurfaceType, Anzahl Elemente
```

## Nicht sichtbare Surfaces

```text
sichtbar:
- restarbeiten.ui.main

nicht sichtbar:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
```

PDF-/Plan-Surfaces bleiben im Editorpanel unsichtbar. Unbekannte SurfaceIds und
Wildcards werden nicht automatisch aufgeloest.

## Policy-Grenzen

- `visibleInEditor: true` gilt nur fuer `restarbeiten.ui.main`.
- `pdf.plan.page.1` bleibt `visibleInEditor: false`.
- `plan.canvas.default` bleibt `visibleInEditor: false`.
- Unbekannte SurfaceIds, leere IDs und `*` bleiben voll blockiert.
- Die SurfacePolicy ist keine Bearbeitungsfreigabe.
- Drag, Resize und Persistenz bleiben fuer alle SurfaceIds gesperrt.

## Datenfluss Surface-Auswahl

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> kompakte read-only Surface-Auswahl im Panel
```

## Datenfluss SurfaceSelection-State

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only State ohne sichtbare Umschaltung
```

## Datenfluss SurfaceInfo

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

Der Datenfluss bleibt hostkontrolliert. Das Kit erhaelt nur das neutrale
SurfaceModel und validiert/normalisiert es; es kennt keine BBM-Fachlogik und
schreibt keine Zustaende.

## Sicherheitsgrenzen

- Read-only.
- Keine Surface-Liste.
- Keine echte Surface-Umschaltung.
- SurfaceSelection ist nur als sichtbare read-only Auswahl fuer `restarbeiten.ui.main` angebunden.
- SurfaceSelection-State ist nur als interne read-only Quelle fuer `restarbeiten.ui.main` angebunden.
- Keine Bearbeitung.
- Kein Drag.
- Guardrail-Begriff: kein Drag.
- Kein Resize.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine PDF-/Plan-Bearbeitung.
- Keine Canvas-Bearbeitung.
- Keine Fachlogik.
- Kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue UI-Funktion.
- Keine Erweiterung der sichtbaren SurfaceIds.
- Keine automatische Surface-Liste.
- Keine produktive Surface-Auswahl.
- Keine Bearbeitungsbuttons.
- Keine PDF-/Canvas-/Plan-Anzeige.
- Keine Drag- oder Resize-Aktivierung.
- Keine neue Persistenzart.
- Keine neuen Scopes.
- Keine alten Editorpfade.

## Moegliche naechste Pakete

- Sichtbare SurfaceInfo fachlich erweitern, falls benoetigt, aber weiter
  read-only und mit eigener Freigabe.
- Weitere SurfaceIds ueber ein eigenes Policy-/Freigabepaket vorbereiten.
- PDF-/Plan-Surfaces separat sichtbar machen, ohne Bearbeitung.
- Surface-Auswahl als eigenes Paket entwerfen und absichern.
- Drag/Resize fuer Surface-Elemente nur in getrennten Folgepaketen mit
  eigener Sichtpruefung und Sicherheitsgrenzen vorbereiten.

## Test- und Guardrail-Referenz

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
