# UI-Editor Hinweis-Infotext Speichern gesperrt UI-Referenzstand

## Kurzfazit

Im UI-Editor-Panel ist ein sichtbarer Speicherbereich vorbereitet. Er zeigt die
fachliche Zielrichtung, bleibt aber gesperrt und loest keine Speicherung aus.

## Sichtbarer Speicherbereich

- Bereichstitel: `Speichern`
- `Speicherweg: Restarbeiten-Notizweg vorbereitet`
- `Ziel: restarbeiten:createNote`
- `Status: gesperrt`
- `persisted: false`

## Deaktivierter Speicherbutton

- Button: `Entwurf speichern`
- der Button ist sichtbar, aber deaktiviert
- ein Klick darf keine Speicherung ausloesen

## Warum Speichern weiterhin gesperrt bleibt

- G109 zeigt nur die vorbereitete Zielrichtung.
- Es gibt noch keinen angeschlossenen IPC-/DB-Schreibweg.
- Es gibt keinen aktiven Speicherbutton.
- Es gibt keinen Submit und kein Senden.
- Die Payload-Vorschau bleibt reine Anzeige.

## Abgrenzung zu `restarbeiten:createNote`

- `restarbeiten:createNote` ist nur der spaetere fachliche Ziel-Schreibweg.
- Der sichtbare Speicherbereich bindet diesen Weg noch nicht technisch an.
- Es gibt keine Runtime-Verkabelung zu diesem Aufruf.

## Keine IPC-/DB-Anbindung

- kein IPC-Aufruf
- kein DB-Aufruf
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- `persisted: false` bleibt sichtbar.
- Es gibt keine persistente Element-Erstellung.
- Der Entwurf bleibt lokal und unveraendert.

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt SurfaceInfo.
- keine echte Surface-Umschaltung
- kein SurfaceInfo-Umbau

## Weiterhin blockiert

- Speichern
- aktiver Speicherbutton
- Submit
- Senden
- Drag
- Resize
- PDF-/Plan-Bearbeitung
- Wildcards
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil sichtbare UI geaendert wurde. Geprueft werden Sichtbarkeit,
Deaktivierung und die Trennung von Anzeige und Speicherung.

## Empfohlener naechster Schritt

Den sichtbaren Speicherbereich nur als gesperrten Referenzstand belassen, bis
eine spaetere technische Freigabe wirklich vorliegt.
