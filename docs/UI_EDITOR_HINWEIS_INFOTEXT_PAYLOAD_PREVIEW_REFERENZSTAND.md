# UI-Editor Hinweis-Infotext Payload Preview Referenzstand

## Kurzfazit

Im UI-Editor-Panel ist eine kleine read-only `Payload-Vorschau` fuer
`Hinweis / Infotext` sichtbar. Sie zeigt nur die technische Payload-Form des
aktuell eingegebenen Entwurfs und schreibt nichts.

## Sichtbare Payload-Vorschau

- `Payload-Vorschau`
- `type: Hinweis / Infotext`
- `surfaceId: restarbeiten.ui.main`
- `status: draft`
- `persisted: false`
- aktueller Hinweistext

## Verhalten der Live-Aktualisierung

- aendert sich der Hinweistext im Panel, aktualisiert sich auch die
  Payload-Vorschau
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
- keine Persistenz
- Speicherbutton
- Senden
- Submit
- persistente Element-Erstellung
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

Erforderlich, weil die sichtbare UI erweitert wurde. Geprueft wird nur
Sichtbarkeit und Live-Aktualisierung, nicht Speicherung.

## Bedeutung fuer spaetere Kit-Extraktion

Die Payload-Vorschau bleibt rein lokal als kleiner Referenzstand. Sie zeigt die
technische Form bereits sichtbar an, ohne daraus eine echte Kit- oder
Speicherintegration abzuleiten. Eine spaetere Extraktion bleibt getrennt in
`docs/UI_EDITOR_HINWEIS_INFOTEXT_KIT_EXTRAKTIONSGRENZE.md` beschrieben.
