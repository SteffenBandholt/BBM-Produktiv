# UI-Editor Hinweis-Infotext Host-Kontext Statusmodell Referenzstand

## Kurzfazit

Der UI-Editor-Renderer nutzt jetzt ein lokales read-only Statusmodell fuer den
fehlenden Restarbeiten-Host-Kontext. Die Anzeige wird daraus abgeleitet, ohne
echte Host-Uebergabe und ohne Speichern.

## Zweck des Statusmodells

- die sichtbare Restarbeit-Kontextanzeige aus einem kleinen lokalen Objekt
  ableiten
- den Status bewusst lesend und stabil halten
- klar machen, dass `projectId` und `restarbeitId` noch fehlen

## Aktuelle Werte des Statusmodells

```text
projectId: null
restarbeitId: null
targetContext: Restarbeiten
targetSurfaceId: restarbeiten.ui.main
targetLabel: nicht ausgewählt
elementType: Hinweis / Infotext
source: BBM-Restarbeiten-Host erforderlich
isPresent: false
```

## Warum `projectId` und `restarbeitId` weiterhin fehlen

- Es gibt bewusst keine echte Host-Uebergabe.
- Der UI-Editor sucht oder errät keine IDs.
- Der Zustand bleibt deshalb absichtlich leer und read-only.

## Warum Speichern weiter gesperrt bleibt

- `isPresent` ist `false`.
- `Entwurf speichern` bleibt deaktiviert.
- Es gibt keinen Submit, keine IPC-/DB-Schreibaktion und keine Persistenz.
- `persisted: false` bleibt sichtbar.

## Abgrenzung zur spaeteren echten Host-Uebergabe

- Das Modell ist nur ein interner Zwischenstand im Renderer.
- Spaeter darf erst der Host echte Werte liefern.
- Dieses Dokument gibt keine Speicherfreigabe.
- UI-Editor-kit speichert nicht.

## Keine IPC-/DB-Anbindung

- keine IPC-/DB-Anbindung
- kein IPC-Aufruf
- kein DB-Aufruf
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- der Entwurf bleibt lokal
- die Anzeige bleibt read-only
- keine persistente Element-Erstellung

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt SurfaceInfo
- keine echte Surface-Umschaltung
- kein SurfaceInfo-Umbau

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- Drag
- Resize
- Speichern
- Submit
- IPC-/DB-Schreibweg
- lokale oder externe Speicherwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtprüfung

Erforderlich, weil der Renderer-Code fuer die bestehende UI-Anzeige geaendert
wurde. Geprueft werden die sichtbare Restarbeit-Kontextanzeige, der gesperrte
Speicherzustand und `restarbeiten.ui.main`.

## Empfohlener naechster Schritt

Den lokalen Statusstand nur als Zwischenmodell behalten, bis eine spaetere
Host-Freigabe die echten Werte bewusst liefert.

## G118: Host-Kontext-Normalisierung

- Der Renderer normalisiert den lokalen Host-Kontext vor der Anzeige.
- Die Werte bleiben read-only und werden nicht als echte Host-Uebergabe
  verstanden.

## G119: Host-Kontext-Abschlusscheck

- Der Statusmodell-Stand bleibt als Abschlussstand erhalten.
- Keine neue Freigabe und kein Speicherweg folgen daraus.

## G120: Optionale Host-Kontext-Aufnahme

- Das Statusmodell kann spaeter optional mit Host-Daten gefuellt werden.
- Der Default bleibt ohne Uebergabe unveraendert.
