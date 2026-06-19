# UI-Editor Hinweis-Infotext Entwurf Preview Referenzstand

## Kurzfazit

Im UI-Editor-Panel ist eine kleine Entwurfs-Vorschau fuer `Hinweis / Infotext`
sichtbar. Sie ist nur informativ, nicht gespeichert und bleibt an den
Restarbeiten-Kontext gebunden. Sie bildet die Grundlage fuer die lokale
Live-Vorschau mit Eingabefeld.

## Sichtbarer Vorschau-Text

- Entwurfs-Vorschau
- Elementart: Hinweis / Infotext
- Status: Vorschau, nicht gespeichert
- Zielkontext: Restarbeiten
- Hinweistext
- Live-Vorschau

## Zweck des Bereichs

- erste kleine praktische Vorschau fuer einen erlaubten Elementtyp
- nur Anzeige, keine echte Elementverwaltung
- kein Speichern und keine Surface-Aenderung
- Ausgangspunkt fuer die lokale Live-Vorschau ohne Persistenz

## Abgrenzung: keine Speicherung

- Keine Speicherung
- keine Persistenz
- kein localStorage
- kein writeFile
- keine DB-/IPC-Schreibwege
- keine aktive Surface-Umschaltung

## SurfaceInfo-Verhalten

- `SurfaceInfo` bleibt `restarbeiten.ui.main`
- keine Umstellung auf `pdf.plan.page.1`
- keine Umstellung auf `plan.canvas.default`

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- kein Drag
- kein Resize
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
