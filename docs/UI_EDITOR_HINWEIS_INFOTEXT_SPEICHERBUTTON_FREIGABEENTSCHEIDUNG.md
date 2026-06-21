# G133 - UI-Editor Hinweis/Infotext Speicherbutton-Freigabeentscheidung

## Entscheidung

Der Speicherbutton fuer den Hinweis-/Infotext-Entwurf darf erst in einem Folgemeilenstein aktiviert werden.
G133 aktiviert den Button nicht.

G133 ist nur Entscheidung, Dokumentation und Testreferenz:

- kein echter Speicherbutton aktiv
- kein echter Speicherklick
- kein Gate-Flip
- kein Produktiv-Speichern
- kein Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein Aufruf von `restarbeiten:createNote`

## Mindestbedingungen fuer spaetere Button-Aktivierung

Eine spaetere Aktivierung des Speicherbuttons darf nur erfolgen, wenn alle Bedingungen erfuellt sind:

- gueltiger Host-Kontext vorhanden
- gueltige `projectId`
- gueltige `restarbeitId`
- Zielkontext `Restarbeiten`
- Ziel-Surface `restarbeiten.ui.main`
- Elementtyp `Hinweis / Infotext`
- Hinweistext gueltig und nicht leer
- Payload vollstaendig
- Payload enthaelt `restarbeitId` und `noteText`
- Schreibfreigabe-Konfiguration explizit `true`
- Schreibfreigabe-Gate offen
- Save-Adapter verfuegbar
- Produktiv-Save-Adapter erreichbar
- Zielmethode `window.bbmDb.restarbeitenCreateNote`
- Zielkanal `restarbeiten:createNote`
- keine laufende Speicherung
- kein bereits abgeschlossener identischer Save ohne Aenderung

## Harte Sperrbedingungen

Der Speicherbutton muss gesperrt bleiben bei:

- fehlender `restarbeitId`
- leerem Hinweistext
- ungueltigem Host-Kontext
- falscher Surface
- falschem Elementtyp
- Konfiguration false
- Gate geschlossen
- DEV-Modus allein
- ENV-Variable allein
- vorhandener Payload allein
- vorhandenem Adapter allein
- bereits laufender Speicherung

Diese Sperren duerfen nicht durch Default-Werte, Wildcards oder implizite Wahrheitswerte uebergangen werden.

## Spaetere Klickregeln

Wenn der Speicherbutton in einem spaeteren Meilenstein freigegeben wird, gelten mindestens diese Regeln:

- Klick darf genau einen Save-Versuch ausloesen.
- Doppelklick darf keine Mehrfachnotiz erzeugen.
- Button muss waehrend Save gesperrt werden.
- Erfolg muss sichtbar zurueckgemeldet werden.
- Fehler muss sichtbar zurueckgemeldet werden.
- Bei Fehler gilt: Entwurf bleibt erhalten.
- Erst nach bestaetigtem Erfolg darf `persisted: true` oder ein sinngleicher Erfolgsstatus erscheinen.
- `previewOnly: false` darf nur im bestaetigten Erfolgsfall des echten Save-Wegs gelten.

## Nicht zulaessig

- kein Default-true
- keine Wildcard
- keine automatische Restarbeit-Auswahl
- keine DEV-Modus-Aktivierung
- keine ENV-Aktivierung ohne zusaetzlich explizite Freigabeentscheidung
- kein stilles Speichern
- kein Speichern ohne sichtbare Rueckmeldung
- kein Speichern ausserhalb des Restarbeiten-Notizwegs
- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern ohne `noteText`

## Aktueller G133-Stand

- Speicherbutton bleibt deaktiviert.
- Gate bleibt geschlossen.
- Konfiguration bleibt false.
- Produktiv-Save-Adapter bleibt nur vorbereitet.
- `persisted` bleibt false.
- `previewOnly` bleibt true.
- Standardpfad bleibt blockiert.
- Es gibt kein Produktiv-Speichern.
