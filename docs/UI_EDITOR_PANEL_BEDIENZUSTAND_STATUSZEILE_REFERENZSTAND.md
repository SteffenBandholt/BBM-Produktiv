# UI-Editor Panel Bedienzustand Statuszeile Referenzstand

## Kurzfazit

Die kompakte Statuszeile im UI-Editor-Panel bestaetigt den aktuellen
Bedienzustand, ohne eine neue Bedienlogik, Surface-Umschaltung oder
Speicherfunktion einzufuehren.

## Sichtbarer Statuszeilentext

`Bearbeitung: Restarbeiten | Zusatzkontexte: PDF/Plan read-only | Speichern: nicht aktiv`

## Zweck der Statuszeile

- kurzer Orientierungstext direkt im Panel
- Restarbeiten-/Hostkontext klar sichtbar
- read-only PDF/Plan-Kontexte klar sichtbar
- kein Bedienknopf, keine Aktion, keine Persistenz

## SurfaceInfo-Verhalten

- `SurfaceInfo` bleibt `restarbeiten.ui.main`
- keine Umstellung auf `pdf.plan.page.1`
- keine Umstellung auf `plan.canvas.default`

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- kein Drag
- kein Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege
- neue Speicherwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil die Statuszeile im sichtbaren UI-Panel erscheint. Die
Pruefung bestaetigt nur Sichtbarkeit und Grenzen, nicht neue Funktion.
