# M28 Restarbeiten einfache Ausgabeansicht

## Kurzfazit

M28 bereitet eine einfache, rein app-interne Ausgabevorschau fuer `Restarbeiten` vor.

Die Vorschau ist kein PDF, kein Druckweg und keine Mail-Anbindung. Sie zeigt eine lesende projektbezogene Restarbeitenliste und aendert keine Daten.

## UI-/PDF-Entwurfsentscheidung

- Art der Ausgabe: UI.
- PDF: nein.
- Druck-/PDF-Struktur: nein.
- Editorfaehig: nein.
- Begruendung: Die Ausgabevorschau ist eine fachliche, lesende App-Ansicht. Es werden keine neuen editorfaehigen Elemente, keine neue UI-Editor-Registry und keine Tabellenlayout-Editor-Freigabe angelegt.
- Pruefung: Restarbeiten-ViewModel-/DOM-Tests und `npm test`. Ein UI-Editor-Vertragscheck ist fuer M28 nicht einschlaegig, weil keine neuen Editor-Ziele entstehen.

## Umfang

Die Ausgabevorschau zeigt je Restarbeit:

- Nr.
- Kurztext
- Ort/Bereich
- Verantwortlich
- Fertig bis
- Status
- Ampel / Fristbewertung
- Hinweis auf unvollstaendige Pflichtfelder

Unvollstaendige Datensaetze bleiben sichtbar und werden mit einem Unvollstaendig-Hinweis gekennzeichnet.

Erledigte Datensaetze bleiben sichtbar und sind als `erledigt` sowie fristneutral erkennbar.

## Datenregeln

- Keine Fantasiewerte erzeugen.
- Keine Platzhalter als Fachwerte ausgeben.
- Fehlende Felder bleiben leer und werden ueber den Hinweis auf unvollstaendige Pflichtfelder kenntlich.
- Die Ausgabevorschau speichert nicht.
- Die Ausgabevorschau legt nichts an.
- Die Ausgabevorschau loescht nichts.
- Die Ausgabevorschau nutzt keine neuen IPC-, Datenbank-, PDF-, Druck- oder Mailwege.

## Sortierung

Die Ausgabevorschau nutzt eine einfache nachvollziehbare Sortierung:

1. nicht erledigte Restarbeiten vor erledigten Restarbeiten
2. kritische Fristen vor unkritischen Fristen
3. danach Fertig-bis-Datum
4. danach laufende Nummer

Es wurde keine grosse neue Filterlogik gebaut. Die vorhandenen Restarbeiten-Filter bleiben die Quelle fuer die angezeigten Zeilen.

## Bewusst nicht Teil von M28

- echte PDF-Erzeugung
- Druckfunktion
- Mail-Anbindung
- Fotoausgabe
- Diktat-/Audioaenderung
- UI-Editor-kit-Aenderung
- generische Editorlogik
- Protokoll-Aenderung
- Datenbankmigration
- Lizenzierung
- Tabellenlayout-Editor-Aufnahme

## Naechster sinnvoller Schritt

Ein spaeteres Paket kann entscheiden, ob aus dieser internen Vorschau ein echter PDF-, Druck- oder Mailweg entsteht. Dafuer ist dann eine neue UI-/PDF-Entwurfsentscheidung noetig.
