# UI-Editor Surface-Auswahl read-only Kontext-Hinweis Referenzstand

## Kurzfazit

Der sichtbare Hinweis unter der Surface-Auswahl ist als reiner read-only
Kontext-Hinweis umgesetzt. Er erklaert die Auswahl, aktiviert aber keine neue
Surface und keine Bearbeitung.

## Sichtbarer Hinweistext

`Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.`

## Zweck des Hinweises

- kurze Klarstellung direkt im Panel
- keine neue Bedienlogik
- keine Speicherung
- keine aktive Surface-Umschaltung

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine zweite SurfaceInfo
- keine Umstellung auf `pdf.plan.page.1`
- keine Umstellung auf `plan.canvas.default`

## Weiterhin blockierte Funktionen

- keine aktive Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine DB-/IPC-Schreibwege

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich und vorgesehen, weil der Hinweis im sichtbaren UI-Panel erscheint.
