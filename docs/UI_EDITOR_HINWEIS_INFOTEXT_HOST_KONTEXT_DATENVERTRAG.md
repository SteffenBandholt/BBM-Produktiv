# UI-Editor Hinweis-Infotext Host-Kontext Datenvertrag

## Kurzfazit

Der spaetere Speicherweg fuer `Hinweis / Infotext` braucht einen klaren Host-
Kontext aus BBM-Produktiv. G116 dokumentiert nur den Datenvertrag. Es wird
keine Kontextuebergabe, kein Submit und kein Speichern umgesetzt.

## Ausgangslage

- Der UI-Editor zeigt bereits, dass der Restarbeiten-Host-Kontext fehlt.
- `Entwurf speichern` bleibt deaktiviert.
- `persisted: false` bleibt verbindlich.
- Es gibt keine IPC-/DB-Schreibaktion, keinen localStorage-Weg und kein
  `writeFile`.
- `UI-Editor-kit` speichert nicht.

## Zweck des Host-Kontext-Datenvertrags

Der Vertrag beschreibt, welche Host-Daten spaeter eindeutig vorhanden sein
muessen, bevor der Speicherbutton ueberhaupt aktiv werden darf. Er ersetzt
keine Runtime-Logik und keine fachliche Freigabe.
`projectId` und `restarbeitId` werden nicht im UI-Editor geraten.

## Erforderliche spaetere Host-Daten

```text
Host-Kontext-Datenvertrag fuer spaeteres Speichern:

projectId:
- muss vom BBM-Host kommen
- darf nicht im UI-Editor geraten werden

restarbeitId:
- muss vom konkreten Restarbeiten-Host-Kontext kommen
- darf nicht im UI-Editor gesucht, geraten oder aus Text abgeleitet werden
- muss eindeutig zur Ziel-Restarbeit gehoeren

targetContext:
- muss `Restarbeiten` sein

targetSurfaceId:
- muss exakt `restarbeiten.ui.main` sein

targetLabel:
- sichtbare Beschreibung der Ziel-Restarbeit
- darf spaeter nicht leer sein, sobald Speichern aktivierbar wird

elementType:
- muss exakt `Hinweis / Infotext` sein
```

## Erlaubte Werte / Regeln

- `projectId` und `restarbeitId` kommen nur aus dem Host.
- `targetContext` ist fest `Restarbeiten`.
- `targetSurfaceId` ist fest `restarbeiten.ui.main`.
- `targetLabel` muss eine echte, sichtbare Zielbeschreibung sein.
- `elementType` ist fest `Hinweis / Infotext`.
- Der Datenvertrag ist nur eine Vorbedingung fuer spaeteres Speichern.

## Verbotene Ableitungen

```text
Nicht zulaessig:
- globale Suche nach einer Restarbeit
- erste gefundene Restarbeit
- zuletzt geoeffnete Restarbeit ohne Host-Uebergabe
- Ableitung aus Hinweistext
- Ableitung aus SurfaceId allein
- Default-Restarbeit
- Wildcard
- Default-true-Freigabe
```

## Aktivierungsbedingungen fuer spaeteres Speichern

```text
Der Speicherbutton darf spaeter nur aktiv werden, wenn:
- Hinweistext gueltig ist
- projectId vorhanden ist
- restarbeitId eindeutig vorhanden ist
- targetContext `Restarbeiten` ist
- targetSurfaceId exakt `restarbeiten.ui.main` ist
- elementType exakt `Hinweis / Infotext` ist
- Schreibweg ausdrucklich freigegeben ist
- Speichern durch sichtbare Nutzeraktion ausgelöst wird
```

## Weiterhin nicht umgesetzt

```text
In G116 wird keine Kontextuebergabe implementiert.
Der Button `Entwurf speichern` bleibt deaktiviert.
Es wird kein Submit eingefuehrt.
Es wird keine IPC-/DB-Schreibaktion ausgelöst.
Es wird keine persistente Element-Erstellung eingefuehrt.
Die Payload-Vorschau bleibt reine Anzeige.
`persisted: false` bleibt verbindlich.
```

## Notwendige Guardrails vor Umsetzung

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
- kein SurfaceInfo-Umbau

## Notwendige Tests vor Umsetzung

- Test fuer die Dokumentation des Host-Kontext-Datenvertrags
- Test fuer `projectId` und `restarbeitId` als Host-Daten
- Test fuer `targetContext`, `targetSurfaceId`, `targetLabel` und
  `elementType`
- Test fuer die verbotenen Ableitungen
- Test fuer den blockierten Speicherzustand

## Notwendige Electron-Sichtpruefung vor Umsetzung

- Nur noetig, wenn spaeter sichtbare UI oder ein aktiver Speicherweg gebaut
  wird.
- Dann sind Zielkontext, Zielsurface und aktivierter Speicherzustand visuell
  zu pruefen.

## Abgrenzung zum UI-Editor-kit

- `UI-Editor-kit` speichert nicht.
- Der Host bleibt BBM-Produktiv.
- Keine Aenderung an `../UI-Editor-kit`.

## Empfohlener naechster Schritt

Den Vertrag nur dokumentarisch stehen lassen und erst nach einer bewussten
Host-Freigabe in Code verdrahten.

## G117: Host-Kontext-Statusmodell

- Der Renderer leitet die sichtbare Anzeige jetzt aus einem lokalen
  Statusmodell ab.
- `projectId` und `restarbeitId` bleiben dabei weiterhin `null`.
- Diese Doku bleibt die spaetere Vertragsgrundlage; das Statusmodell ist nur
  ein interner Zwischenstand.

## G118: Host-Kontext-Normalisierung

- Der lokale Host-Kontext wird intern normalisiert, ohne den Vertrag zu
  aendern.
- Ungueltige oder fehlende Werte fallen auf den Default zurueck.

## G119: Host-Kontext-Abschlusscheck

- Die Vertragsdoku bleibt als gesicherter Abschlussstand erhalten.
- Keine echte Host-Uebergabe und kein Speicherweg werden daraus.

## G120: Optionale Host-Kontext-Aufnahme

- Der Datenvertrag bleibt unveraendert und kann optional von einem Host
  befuellt werden.
- Ohne Uebergabe bleibt die Vertragslage nur dokumentarisch.
