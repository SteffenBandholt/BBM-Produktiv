# UI-PDF-Entwurfsentscheidung

## Kurzfazit

Diese Entscheidung legt den Minimalrahmen fuer PDF-/Plan-/Canvas-Kontexte im
UI-Editor fest. Sie erlaubt nur read-only Sichtbarkeit und blockiert jede
Bearbeitung ohne eigene Freigabe.

## Zweck

Die Datei sagt knapp, wie mit PDF- und Plan-Kontexten im UI-Editor umzugehen
ist. Sie verhindert, dass aus einer Sichtbarkeitsanzeige versehentlich eine
aktive Bearbeitungsflaeche wird.

## Aktueller Stand

- `pdf.plan.page.1` ist read-only sichtbar.
- `plan.canvas.default` ist read-only sichtbar.
- Beide sind keine aktive Bearbeitungsflaeche.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- SurfaceInfo bleibt `restarbeiten.ui.main`.

## Bedeutung von read-only

- anzeigen
- Kontext vorbereiten
- keine Bearbeitung
- keine Speicherung
- keine aktive Umschaltung

## Koordinatensysteme

- `pdf.plan.page.1`: `pdf-points`
- `plan.canvas.default`: `canvas-pixels`

Eine Umrechnung oder Interaktion findet ohne eigene Freigabe nicht statt.
Der Surface-Auswahl-Hinweis bleibt rein informativ und greift nicht in diese
Entscheidung ein. Die kompakte Statuszeile bleibt ebenfalls informativ und
veraendert keine Koordinaten oder Surface-Wahl.

## Nicht erlaubt ohne eigene Freigabe

- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine Persistenz
- PDF markieren
- PDF beschriften
- Planobjekte anklicken
- Planobjekte verschieben
- kein Drag
- kein Resize
- keine Persistenz
- Speichern von Koordinaten
- DB-/IPC-Schreibwege

## Spaetere Freigabepunkte

- echte aktive PDF-Surface
- echte aktive Plan-/Canvas-Surface
- Koordinaten-/Elementmodell
- Speicherkonzept
- Sichtpruefung

## Pruefpflicht

- Tests
- `git diff --check`
- Electron-Sichtpruefung bei sichtbarer UI

## Stop-Regel

Bei unklarer PDF-/Plan-Entscheidung stoppen, nicht improvisieren.
