# UI-Editor Hinweis-Infotext Live Preview Referenzstand

## Kurzfazit

Im UI-Editor-Panel gibt es jetzt eine kleine lokale Live-Vorschau fuer
`Hinweis / Infotext`. Der Text kann im Panel geaendert werden, bleibt aber nur
im laufenden UI-Editor sichtbar und wird nicht gespeichert.

## Sichtbare Eingabe

- Beschriftung: `Hinweistext`
- Vorbelegung: `Dies ist ein nicht gespeicherter Hinweis-Entwurf.`
- Lokaler UI-State, kein Speicherweg

## Sichtbare Live-Vorschau

- `Live-Vorschau`
- zeigt den aktuell eingegebenen Hinweistext
- aktualisiert sich sofort bei Eingabe
- bleibt im gleichen Panel-Kontext

## Abgrenzung: keine Speicherung

- keine Persistenz
- kein localStorage
- kein writeFile
- keine DB-/IPC-Schreibwege
- keine aktive Surface-Umschaltung
- UI-Editor-kit speichert nicht

## Verhalten bei Neuladen

- der Text darf beim Neuladen verloren gehen
- es gibt keinen Wiederherstellungs- oder Speicheranspruch
- die Vorschau ist nur ein kurzer lokaler Entwurf

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

Erforderlich, weil die sichtbare UI erweitert wurde. Geprueft wird nur
Sichtbarkeit und Live-Aktualisierung, nicht Speicherung.
