# UI-Editor Hinweis/Infotext Produktiv-Save Freigabeentscheidung

## G131 Entscheidung

Der echte Produktiv-Speicherweg fuer Hinweis-/Infotext-Entwuerfe darf erst in einem Folgemeilenstein umgesetzt werden.
G131 selbst aktiviert nichts.

Der aktuelle Stand bleibt:

- Gate bleibt geschlossen
- Schreibfreigabe-Konfiguration bleibt `false`
- Speicherbutton bleibt deaktiviert
- Save-Ausfuehrung bleibt blockiert
- `persisted: false`
- `previewOnly: true`

## Ziel des spaeteren Produktiv-Speicherwegs

Aus einem gueltigen Hinweis-/Infotext-Entwurf soll spaeter eine Restarbeiten-Notiz erzeugt werden.

Der spaetere Zielweg ist:

- Zielmethode: `window.bbmDb.restarbeitenCreateNote`
- Zielkanal: `restarbeiten:createNote`
- Zielkontext: konkrete `restarbeitId`
- Payload: `restarbeitId`, `noteText`

`projectId` bleibt Kontextinformation aus dem Host-Kontext. Der fachliche Save-Zielkontext ist die eindeutig uebergebene Restarbeit.

## Mindestbedingungen fuer spaetere Freigabe

Ein spaeterer echter Produktiv-Speichermeilenstein darf nur freigegeben werden, wenn mindestens diese Bedingungen erfuellt sind:

- gueltiger Host-Kontext
- gueltige `projectId`
- gueltige `restarbeitId`
- gueltiger Hinweistext
- vollstaendige Payload
- explizite Schreibfreigabe-Konfiguration
- Gate offen
- Save-Adapter verfuegbar
- Fehlerbehandlung vorhanden
- erfolgreiche Notizerzeugung wird sichtbar zurueckgemeldet
- `persisted: true` oder ein sinnvoller Erfolgstatus wird erst nach bestaetigtem Ergebnis gesetzt

## Nicht zulaessig

Nicht zulaessig sind:

- keine automatische Restarbeit-Auswahl
- kein Default-true
- keine DEV-Modus-Freigabe
- keine ENV-Freigabe
- keine Wildcard
- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern bei leerem Hinweistext
- kein stilles Speichern ohne sichtbare Rueckmeldung

## Abnahmekriterien fuer den spaeteren echten Speichermeilenstein

Vor einer echten Produktivfreigabe muessen mindestens diese Kriterien erfuellt sein:

- Button nur aktiv, wenn alle Bedingungen erfuellt sind
- Klick loest genau einen Save-Versuch aus
- korrekte Payload wird uebergeben
- Erfolg wird sichtbar
- Fehler wird sichtbar
- bei Fehler bleibt Entwurf erhalten
- keine Mehrfachspeicherung durch Doppelklick
- Tests fuer Erfolg, Fehler, leere Payload, fehlenden Host-Kontext und fehlende `restarbeitId`
- `npm test` gruen
- Electron-Sichtpruefung

## Aktueller G131-Stand

G131 ist nur Entscheidung, Dokumentation und Testreferenz.

Es gibt weiterhin:

- kein Produktiv-Schreibweg
- keinen Produktiv-Schreibweg
- keinen echten Aufruf von `window.bbmDb.restarbeitenCreateNote`
- keinen echten Aufruf von `restarbeiten:createNote`
- keinen IPC-Schreibweg
- keinen DB-Schreibweg
- keinen Datei-Schreibweg
- kein localStorage
- keinen aktivierten Speicherbutton
- keine Aenderung der Schreibfreigabe-Konfiguration auf `true`
- keine Aenderung am `UI-Editor-kit`
