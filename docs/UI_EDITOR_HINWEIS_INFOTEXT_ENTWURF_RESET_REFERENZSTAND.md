# UI-Editor Hinweis-Infotext Entwurf Reset Referenzstand

## Kurzfazit

Im UI-Editor-Panel gibt es einen kleinen lokalen Button `Entwurf
zurücksetzen`. Er setzt den Hinweistext wieder auf den Standardtext zurück
und bleibt komplett ohne Speicherung.

## Sichtbarer Reset-Button

- `Entwurf zurücksetzen`
- der Button ist im Entwurfsbereich sichtbar
- kein Speicherbutton

## Reset-Verhalten

- ein Klick stellt den Standardtext `Dies ist ein nicht gespeicherter Hinweis-Entwurf.` lokal wieder her
- Live-Vorschau, Host-Vorschau, Elementmodell-Vorschau und Entwurfspruefung
  aktualisieren sich sofort
- kein Submit und keine Fachaktion

## Abgrenzung: keine Speicherung

- keine Persistenz
- kein localStorage
- kein writeFile
- keine DB-/IPC-Schreibwege
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

Erforderlich, weil die sichtbare UI erweitert wurde. Geprueft wird die
Sichtbarkeit des Reset-Buttons und das lokale Ruecksetzen auf den
Standardtext, nicht Speicherung.
