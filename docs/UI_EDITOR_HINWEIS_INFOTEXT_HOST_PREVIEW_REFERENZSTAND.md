# UI-Editor Hinweis-Infotext Host Preview Referenzstand

## Kurzfazit

Im Restarbeiten-/Host-Kontext erscheint eine kleine nicht-persistente
`Host-Vorschau` fuer `Hinweis / Infotext`. Sie zeigt nur den aktuellen
Eingabetext aus dem UI-Editor-Panel und bleibt rein temporaer.

## Sichtbare Host-Vorschau

- `Host-Vorschau`
- `Hinweis / Infotext`
- eingegebener Hinweistext
- `nicht gespeichert`

## Verhalten der Live-Aktualisierung

- aendert sich der Hinweistext im Panel, aktualisiert sich die Host-Vorschau
- die Vorschau bleibt an den laufenden UI-Editor gebunden
- kein extra Button und kein Submit

## Abgrenzung: keine Speicherung

- keine Persistenz
- kein localStorage
- kein writeFile
- keine DB-/IPC-Schreibwege
- keine aktive Surface-Umschaltung
- UI-Editor-kit speichert nicht

## Verhalten bei Neuladen

- der Text darf beim Neuladen verloren gehen
- es gibt keinen Speicher- oder Wiederherstellungsweg

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
- keine Plan-/Canvas-Interaktion
- neue Speicherwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil die sichtbare UI erweitert wurde. Die Pruefung bestaetigt
Sichtbarkeit und Live-Aktualisierung, nicht Speicherung.
