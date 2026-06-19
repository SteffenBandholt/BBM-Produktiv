# UI-Editor Hinweis-Infotext Elementmodell Preview Referenzstand

## Kurzfazit

Im UI-Editor-Panel ist eine kleine read-only `Elementmodell-Vorschau` fuer
`Hinweis / Infotext` sichtbar. Sie zeigt nur die modellierte Form des aktuell
eingegebenen Hinweistexts und speichert nichts. Der Reset-Button stellt den
Standardtext lokal wieder her.

## Entwurfspruefung

- Sichtbarer Titel: `Entwurfspruefung`
- Bei gueltigem Text: `Status: gueltiger lokaler Entwurf`
- Bei leerem Text: `Status: Hinweistext fehlt`
- Immer sichtbar: `Speichern: nicht aktiv`
- Die Pruefung gilt lokal nach Trim; weitere Fachregeln gibt es nicht.

## Sichtbare Elementmodell-Vorschau

- `Elementmodell-Vorschau`
- `Typ: Hinweis / Infotext`
- `Surface: restarbeiten.ui.main`
- `Status: nicht gespeichert`
- aktueller Hinweistext
- bleibt neben der Entwurfspruefung sichtbar
- wird durch `Entwurf zuruecksetzen` wieder auf den Standardtext gesetzt

## Verhalten der Live-Aktualisierung

- aendert sich der Hinweistext im Panel, aktualisiert sich auch die
  Elementmodell-Vorschau und die Entwurfspruefung
- die Vorschau bleibt an den laufenden UI-Editor gebunden
- kein Button und kein Submit

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

Erforderlich, weil die sichtbare UI erweitert wurde. Geprueft wird die
Sichtbarkeit und die Live-Aktualisierung, nicht Speicherung.
