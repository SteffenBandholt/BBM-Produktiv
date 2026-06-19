# UI-Editor Panel Elementkatalog Readonly Referenzstand

## Kurzfazit

Die kompakte Elementkatalog-Ãœbersicht im UI-Editor-Panel ist rein read-only
und ergaenzt den sichtbaren Surface- und Bedienzustand ohne neue Bedienlogik.

## Sichtbarer Elementkatalog-Text

## Elementkatalog

- Hinweis / Infotext: erlaubt
- read-only Kontext: erlaubt
- Bearbeitbare Elemente: gesperrt
- Drag / Resize: gesperrt
- Speichern / Persistenz: gesperrt

## Zweck des Bereichs

- kurze Einordnung direkt im Panel
- erlaubte und gesperrte Elementarten sichtbar machen
- keine Auswahl, keine Erstellung, keine Aktion

## SurfaceInfo-Verhalten

- `SurfaceInfo` bleibt `restarbeiten.ui.main`
- keine Umstellung auf `pdf.plan.page.1`
- keine Umstellung auf `plan.canvas.default`

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-/Plan-Bearbeitung
- keine DB-/IPC-Schreibwege
- neue Speicherwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil der Bereich im sichtbaren UI-Panel erscheint. Die
Pruefung bestaetigt nur Sichtbarkeit und Grenzen, nicht neue Funktion.
