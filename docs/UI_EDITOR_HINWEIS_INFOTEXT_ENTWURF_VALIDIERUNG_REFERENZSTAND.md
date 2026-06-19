# UI-Editor Hinweis-Infotext Entwurfspruefung Referenzstand

## Kurzfazit

Im UI-Editor-Panel zeigt der Hinweis-/Infotext-Entwurf jetzt zusaetzlich eine
kleine lokale `Entwurfspruefung`. Sie bewertet nur, ob der Text nach Trim
leer ist oder nicht, und bleibt komplett ohne Speicherung.

## Sichtbare Entwurfspruefung

- `Entwurfspruefung`
- `Status: gueltiger lokaler Entwurf`
- `Status: Hinweistext fehlt`
- `Speichern: nicht aktiv`

## Validierungsregel

- gueltig ist jeder Text mit mindestens einem Zeichen nach `trim()`
- leer oder nur aus Leerzeichen bestehend gilt als fehlend
- keine weiteren Fachregeln

## Sichtbarer Reset-Button

- `Entwurf zuruecksetzen`
- der Button stellt lokal den Standardtext wieder her
- kein Speicherbutton

## Verhalten des Resets

- klickt man `Entwurf zuruecksetzen`, wird der Standardtext
  `Dies ist ein nicht gespeicherter Hinweis-Entwurf.` wiederhergestellt
- Live-Vorschau, Host-Vorschau, Elementmodell-Vorschau und Entwurfspruefung
  aktualisieren sich sofort
- kein localStorage und kein writeFile

## Verhalten der Live-Aktualisierung

- aendert sich der Hinweistext, aktualisiert sich die Entwurfspruefung sofort
- Live-Vorschau, Host-Vorschau und Elementmodell-Vorschau bleiben sichtbar
- kein Button und kein Submit

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
Sichtbarkeit der Entwurfspruefung und das lokale Leer-/Gueltig-Verhalten,
nicht Speicherung.
