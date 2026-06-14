# UI-Editor SurfaceSwitch read-only Referenzstand

## Kurzfazit

Der G61-Stand des SurfaceSwitch-Modells ist als stabiler read-only
Referenzstand abgeschlossen. Das Modell beschreibt nur, ob ein
SurfaceSwitch-Wunsch im aktuellen Stand erlaubt waere. Aufgeloest wird
ausschliesslich `restarbeiten.ui.main`; es gibt keine echte Umschaltung und
keine Launcher-Produktivintegration.

Seit G63 verwendet der BBM-Launcher diesen Referenzstand intern read-only. Die
sichtbare UI bleibt unveraendert.

Seit G64 ist der Launcher-Einsatz als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.

## Aktueller read-only Stand

- Modell: `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Referenzdokument der Vorbereitung:
  `docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`
- Referenzstand: dieses Dokument
- Launcher-Helfer seit G63:
  `buildReadonlySurfaceSwitchResultForLauncher(...)`
- Erlaubtes `resolvedSurfaceId`: `restarbeiten.ui.main`
- Blockierte Ziele bleiben auf `restarbeiten.ui.main` zurueckgefuehrt.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Erlaubte Wechselziele

```text
erlaubt / resolved:
- restarbeiten.ui.main
```

Ein Wunsch auf `restarbeiten.ui.main` liefert read-only:

```text
allowed: true
resolvedSurfaceId: restarbeiten.ui.main
reason: readonly-current-surface
```

## Blockierte Wechselziele

```text
blockiert:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

Blockierte Ziele liefern read-only:

```text
allowed: false
resolvedSurfaceId: restarbeiten.ui.main
reason: surface-not-selectable-readonly
```

## Datenfluss

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
-> SurfaceSwitchModel
-> erlaubtes resolvedSurfaceId
-> bestehende read-only Surface-Auswahl/SurfaceInfo
```

Der Datenfluss ist nur ein Modell- und Nachweispfad. Er rendert nichts, startet
keine Host-Aktion und fuehrt keine Surface im Launcher um.

## Sicherheitsgrenzen

- read-only.
- keine echte Umschaltung.
- keine Launcher-Produktivintegration.
- Launcher-Nutzung nur intern read-only.
- keine sichtbare UI-Aenderung.
- keine PDF-/Plan-Auswahl.
- keine Bearbeitung.
- kein Drag.
- kein Resize.
- keine Persistenz.
- kein `localStorage`.
- kein `writeFile`.
- kein IPC-Schreibweg.
- keine DB-Aenderung.
- keine Registry-Aenderung.
- keine Fachlogik.
- kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik.
- Keine neue UI-Funktion.
- Keine sichtbare Surface-Auswahl.
- Keine weitere Surface sichtbar oder auswaehlbar.
- Keine echte Surface-Umschaltung.
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
- Fehlende Grundlagen-/Regeldateien als separates Repo-Hygiene-Paket klaeren.

## Testreferenz

- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
