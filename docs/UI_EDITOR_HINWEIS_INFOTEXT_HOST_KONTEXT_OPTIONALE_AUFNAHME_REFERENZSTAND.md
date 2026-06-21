# UI-Editor Hinweis-Infotext Host-Kontext Optionale Aufnahme Referenzstand

## Kurzfazit

Der UI-Editor-Launcher kann optional einen Host-Kontext aufnehmen und intern
ueber `normalizeHostContextStatus` auswerten. Ohne Uebergabe bleibt der
bestehende Default unveraendert.

## Zweck der optionalen Host-Kontext-Aufnahme

- den spaeteren Host-Kontext intern schon einmal entgegennehmen koennen
- die Normalisierung zentral wiederverwenden
- den sichtbaren Default ohne Host-Kontext unveraendert lassen

## Default ohne Host-Kontext

- `restarbeitId: nicht übergeben`
- `Restarbeit-Kontext vorhanden: nein`
- `Speichern bleibt gesperrt`
- `Entwurf speichern` bleibt deaktiviert

## Verhalten bei gueltigem testseitigem Host-Kontext

- `projectId` vorhanden
- `restarbeitId` vorhanden
- `targetContext: Restarbeiten`
- `targetSurfaceId: restarbeiten.ui.main`
- `targetLabel` nicht leer
- `elementType: Hinweis / Infotext`
- `isPresent: true`

Der Speicherbutton bleibt trotzdem deaktiviert.

## Verhalten bei ungueltigem Host-Kontext

- falsche SurfaceId bleibt blockiert
- falscher Elementtyp bleibt blockiert
- leeres `targetLabel` bleibt blockiert
- fehlende `projectId` oder `restarbeitId` bleiben blockiert
- `isPresent` faellt auf `false` zurueck

## Warum noch keine echte Uebergabe aus `RestarbeitenScreen` erfolgt

- es wird noch kein `notesPopup.restarbeitId` angeschlossen
- die Ziel-Restarbeit wird nicht im Editor gesucht oder geraten
- der Host bleibt fuer die spaetere echte Uebergabe zustaendig

## Warum Speichern weiterhin gesperrt bleibt

- kein aktiver Speicherbutton
- kein Submit
- kein Speichern
- keine persistente Element-Erstellung
- kein aktiver Speicherweg
- UI-Editor-kit speichert nicht.

## Keine IPC-/DB-Anbindung

- keine IPC-/DB-Anbindung
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- die Aufnahme bleibt intern
- die Anzeige bleibt read-only
- `persisted: false` bleibt verbindlich

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt SurfaceInfo
- keine echte Surface-Umschaltung
- kein SurfaceInfo-Umbau

## Weiterhin blockiert

- echte Host-Uebergabe
- aktiver Speicherbutton
- Submit
- Speichern
- persistente Element-Erstellung
- IPC-/DB-Schreibweg
- localStorage
- writeFile
- direkte Dateischreibung
- automatische Persistenz beim Tippen
- Speichern ueber Payload-Vorschau
- Speichern bei leerem Hinweistext
- Speichern ohne eindeutige `restarbeitId`
- Speichern in PDF-/Plan-read-only-Kontexte
- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- Drag
- Resize
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil Renderer-Code geaendert wurde. Die Sichtpruefung bleibt an
den bestehenden read-only Speicherzustand und `restarbeiten.ui.main` gebunden.

## Empfohlener naechster Schritt

Die optionale Aufnahme nur als internen Vorbereitungspfad stehen lassen, bis
der Host sie spaeter bewusst mit echten Daten befuellt.

## G121: Host-Kontext-UEbergabe Freigabeentscheidung

- Die optionale Aufnahme bleibt getrennt von der spaeteren echten
  Host-Kontext-UEbergabe.
- Eine Umsetzung braucht weiterhin die explizite Host-Freigabe mit
  eindeutiger `restarbeitId`, `projectId` und Zielkontext `Restarbeiten`.

## G122: Host-Kontext-UEbergabe aus Restarbeiten anschliessen

- Die optionale Aufnahme wird jetzt von der echten Restarbeiten-UEbergabe
  gefuellt, wenn der Host eine eindeutige Restarbeit liefert.
- Der Default bleibt ohne eindeutige Restarbeit unveraendert.
