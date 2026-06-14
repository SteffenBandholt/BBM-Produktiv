# UI-Editor SurfaceSwitch-Command im Launcher read-only Referenzstand

## Kurzfazit

Der SurfaceSwitch-Command ist im BBM-Launcher read-only als stabiler
Referenzstand abgeschlossen. Der Launcher nutzt den defensiven
Request-/Command-Helfer intern, ohne sichtbare UI-Aenderung und ohne echte
Umschaltung. Nur `restarbeiten.ui.main` bleibt als resolvedSurfaceId
erlaubt.

## Aktueller read-only Stand

- Launcher-Wrapper:
  `handleReadonlySurfaceSwitchRequestForLauncher(...)`
- Read-only Command:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchCommand.js`
- Read-only Modell:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Read-only State:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionState.js`
- Sichtbare UI bleibt unveraendert.
- `changed` bleibt immer `false`.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Launcher-Datenfluss

```text
Editorpanel im BBM-Launcher
-> read-only SurfaceSwitchCommand
-> handleReadonlySurfaceSwitchRequestForLauncher(...)
-> read-only SurfaceSwitchModel
-> resolvedSurfaceId
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only SurfaceModel
-> kompakte Surface-Auswahl im Panel
-> kompakte SurfaceInfo im Panel
```

## Command-/Request-Verhalten

```text
restarbeiten.ui.main:
- handled: true
- allowed: true
- readonly: true
- changed: false
- resolvedSurfaceId: restarbeiten.ui.main

blockierte Ziele:
- handled: true
- allowed: false
- readonly: true
- changed: false
- resolvedSurfaceId: restarbeiten.ui.main
```

## Erlaubte / blockierte Request-Ziele

```text
allowed / resolved:
- restarbeiten.ui.main

blocked:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

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

## Sicherheitsgrenzen

- read-only
- keine echte Umschaltung
- keine sichtbare UI-Aenderung
- keine PDF-/Plan-Auswahl
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik
- kein Bare-Package-Import im Renderer
- kein `localStorage`
- kein `writeFile`
- kein IPC-Schreibweg
- keine DB-Aenderung
- keine Registry-Aenderung
- keine Fachlogik

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik.
- Keine neue UI-Funktion.
- Keine echte Surface-Umschaltung.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswählbar machen.
- Kein Dropdown mit weiteren Optionen.
- Keine grosse Surface-Liste.
- Keine Bearbeitungsbuttons.
- Keine Drag-Aktivierung.
- Keine Resize-Aktivierung.
- Keine Persistenzfreigabe.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Freigabepaket.
- Weitere Request-/Command-Typen nur getrennt und defensiv vorbereiten.
- Launcher-UI nur bei expliziter Produktivfreigabe erweitern.

