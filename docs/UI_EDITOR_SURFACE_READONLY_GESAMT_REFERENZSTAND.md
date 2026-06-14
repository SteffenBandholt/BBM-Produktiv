# UI-Editor Surface read-only Gesamt-Referenzstand

## Kurzfazit

Der gesamte read-only Surface-Steuerungsstand ist als stabile Referenz
abgeschlossen. Im BBM-Launcher bleibt nur `restarbeiten.ui.main` sichtbar und
resolved. Die Kette aus SurfaceAdapterCatalog, SurfacePolicy,
SurfaceSelectionModel, SurfaceSelectionState, SurfaceSwitchModel und
SurfaceSwitchCommand arbeitet defensiv read-only. Es gibt keine echte
Surface-Umschaltung und keine sichtbare UI-Änderung.

## Aktueller Gesamtstand

- SurfaceRuntime-Bridge vorhanden.
- SurfaceAdapterCatalog vorhanden.
- SurfacePolicy vorhanden.
- SurfaceSelectionModel vorhanden.
- SurfaceSelectionState vorhanden.
- SurfaceSwitchModel vorhanden.
- SurfaceSwitchCommand vorhanden.
- BbmUiEditorRuntimeLauncher nutzt die read-only Kette defensiv.
- G70 bestaetigt den Gesamtstand zusaetzlich als Integrations-/Freigabecheck.
- Sichtbar im Editorpanel bleibt nur `Restarbeiten` mit der SurfaceInfo
  `restarbeiten.ui.main` / `ui-screen` / Elementanzahl.
- `changed` bleibt `false`.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Komponentenuebersicht

- `SurfaceRuntime-Bridge`: validiert das neutrale SurfaceModel im Kit.
- `SurfaceAdapterCatalog`: listet und validiert bekannte SurfaceIds.
- `SurfacePolicy`: definiert die read-only Sichtbarkeit und Blockaden.
- `SurfaceSelectionModel`: baut die sichtbare read-only Surface-Auswahl.
- `SurfaceSelectionState`: haelt den internen read-only Auswahlzustand.
- `SurfaceSwitchModel`: prueft Wechselwuensche defensiv gegen den State.
- `SurfaceSwitchCommand`: nimmt read-only Request-/Command-Wuensche an.
- `BbmUiEditorRuntimeLauncher`: bindet die read-only Kette im Launcher an.

## Gesamtdatenfluss

```text
BBM-Launcher
-> SurfaceSwitchCommand
-> SurfaceSwitchModel
-> SurfaceSelectionState
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> SurfaceRuntime-Validierung
-> read-only SurfaceModel
-> Surface-Auswahl Restarbeiten
-> SurfaceInfo restarbeiten.ui.main
```

Der Datenfluss bleibt modellhaft und defensiv. Er aktiviert keine produktive
Umschaltung, keine Bearbeitung und keine Speicherwege.

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

Die sichtbare Grenze bleibt stabil und kompakt. Es gibt keine Surface-Liste,
kein Dropdown und keine weiteren auswählbaren SurfaceIds.

## Erlaubte und blockierte SurfaceIds

```text
erlaubt / sichtbar / resolved:
- restarbeiten.ui.main

blockiert:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
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
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- kein Bare-Package-Import im Renderer
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Ausdruecklich nicht aktiviert

- keine echte Surface-Umschaltung
- keine PDF-/Plan-Auswahl
- keine PDF-/Plan-Bearbeitung
- keine Surface-Liste mit mehreren Optionen
- kein Dropdown mit weiteren Optionen
- keine Bearbeitungsbuttons
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- UI-Editor-kit speichert nicht

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Freigabepaket.
- Weitere SurfaceIds nur ueber eigene Policy-/Allowlist-Freigabe sichtbar
  machen.
- PDF-/Plan-Surfaces separat read-only sichtbar machen, falls fachlich
  benoetigt.
- Drag, Resize und Persistenz jeweils getrennt planen, testen und sichtbar
  abnehmen.
- Launcher-UI nur bei expliziter Produktivfreigabe erweitern.
