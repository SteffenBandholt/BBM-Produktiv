# UI-Editor Hinweis-Infotext Restarbeit-Kontext Uebergabeentscheidung

## Kurzfazit

Die spaetere `restarbeitId` darf nicht im UI-Editor gesucht oder geraten werden.
Sie muss vom BBM-Restarbeiten-Host eindeutig an den UI-Editor-Kontext
uebergeben werden.

## Ausgangslage

- Der Spaeterfall betrifft den Entwurf `Hinweis / Infotext`.
- `restarbeiten:createNote` braucht spaeter mindestens `restarbeitId` und
  `noteText` oder `note_text`.
- G113 hat gezeigt: `restarbeitId` liegt im Host, nicht im
  `BbmUiEditorRuntimeLauncher`.
- Der Button `Entwurf speichern` bleibt deaktiviert.
- Es gibt keinen Submit, keinen Speicherweg und keine persistente
  Element-Erstellung.
- `persisted: false` bleibt verbindlich.

## Bestaetigte Kontextquelle

- `RestarbeitenScreen`
- die aktuell gemeinte Restarbeit
- vorhandener Kontext wie `notesPopup.restarbeitId`, sofern die UI aus genau
  dieser Restarbeit heraus geoeffnet wird

## Entscheidung zur spaeteren Uebergabestrategie

```text
Entscheidung:
Die spaetere `restarbeitId` darf nicht im UI-Editor gesucht oder geraten
werden.
Die `restarbeitId` muss vom BBM-Restarbeiten-Host eindeutig an den
UI-Editor-Kontext uebergeben werden.

Zulaessige Quelle:
- RestarbeitenScreen
- konkret die aktuell gemeinte Restarbeit
- vorhandener Kontext wie `notesPopup.restarbeitId`, sofern die UI aus dieser
  konkreten Restarbeit heraus geoeffnet wird

Nicht zulaessig:
- globale Suche nach irgendeiner Restarbeit
- Ableitung aus Textinhalt
- Ableitung aus SurfaceId allein
- Default-Restarbeit
- Wildcard
- Default-true-Freigabe
```

## Notwendige Host-Daten

```text
Spaeter erforderlicher UI-Editor-Host-Kontext:
- projectId
- restarbeitId
- sichtbarer Zielkontext: Restarbeiten
- sichtbare Ziel-Restarbeit oder eindeutige Zielbeschreibung
- surfaceId: restarbeiten.ui.main
```

## Notwendige Anzeige vor spaeterer Speicherfreigabe

- sichtbarer Zielkontext: Restarbeiten
- sichtbare Ziel-Restarbeit oder eindeutige Zielbeschreibung
- Hinweistext-Gueltigkeit
- sichtbarer Hoststand `restarbeiten.ui.main`
- sichtbarer, aber deaktivierter Speicherzustand

## Weiterhin nicht umgesetzt

```text
In G114 wird keine Kontextuebergabe implementiert.
Der Button `Entwurf speichern` bleibt deaktiviert.
Es wird kein Submit eingefuehrt.
Es wird keine IPC-/DB-Schreibaktion ausgelöst.
Es wird keine persistente Element-Erstellung eingefuehrt.
Die Payload-Vorschau bleibt reine Anzeige.
`persisted: false` bleibt verbindlich.
```

## Guardrails vor Umsetzung

- keine Suche oder Erratung von `restarbeitId`
- keine Default-Restarbeit
- keine Wildcard
- keine Default-true-Freigabe
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize

## Notwendige Tests vor Umsetzung

- Test fuer eindeutige Host-Uebergabe von `restarbeitId`
- Test fuer fehlende `restarbeitId`
- Test fuer den `restarbeiten:createNote`-Vertrag
- Test fuer sichtbaren Hostkontext in der Dokumentation

## Notwendige Electron-Sichtpruefung vor Umsetzung

- Nur bei spaeterer sichtbarer UI-Aenderung erforderlich.
- Pruefen waere dann die sichtbare Ziel-Restarbeit und die Trennung von
  Anzeige und Speicherung.

## Abgrenzung zum UI-Editor-kit

- `UI-Editor-kit` speichert nicht.
- Der Host bleibt BBM-Produktiv.
- Keine Aenderung an `../UI-Editor-kit`.

## Empfohlener naechster Schritt

Die Host-Strategie spaeter in Code nur dort anschliessen, wo die konkrete
Restarbeit bereits eindeutig feststeht. Bis dahin bleibt die Uebergabe nur
Dokumentation.

## G115: Sichtbarer Host-Kontext

- Der fehlende Restarbeiten-Host-Kontext wird jetzt sichtbar angezeigt.
- Die Anzeige bleibt lesend und ersetzt keine Uebergabe.

## G116: Host-Kontext-Datenvertrag

- Die spaetere Uebergabe bleibt an `projectId` und `restarbeitId` gebunden.
- Der Datenvertrag ist dokumentiert, aber technisch noch nicht verdrahtet.

## G117: Host-Kontext-Statusmodell

- Der Renderer bildet den sichtbaren Kontext aus einem lokalen Statusmodell.
- Die Uebergabeentscheidung bleibt davon unberuehrt.

## G118: Host-Kontext-Normalisierung

- Der lokale Host-Kontext wird intern normalisiert, ohne neue Uebergabe.
- Die Entscheidung bleibt unveraendert.

## G119: Host-Kontext-Abschlusscheck

- Die Uebergabeentscheidung bleibt als Abschlussstand erhalten.
- Keine echte Host-Uebergabe und kein Speicherweg werden daraus.

## G120: Optionale Host-Kontext-Aufnahme

- Die Uebergabeentscheidung bleibt getrennt von der optionalen Aufnahme im
  Launcher.
- Es entsteht keine echte Host-Uebergabe.
