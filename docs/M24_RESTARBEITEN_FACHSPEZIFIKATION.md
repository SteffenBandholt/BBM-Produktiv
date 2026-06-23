# M24 Restarbeiten Fachspezifikation

## Kurzfazit

Der erste echte Nutzstand von `Restarbeiten` ist eine textbasierte, projektbezogene Restarbeitenliste mit klarer Verantwortung, Fristbewertung, Statusfuehrung, Erledigung, kontrolliertem Loeschen und einfacher Ausgabe.

Diese Spezifikation ist verbindlich fuer die naechsten Umsetzungspakete. Sie baut noch nichts und aendert keine Fachlogik.

Verbindlich fuer M24:
- Restarbeiten bleibt BBM-Fachmodul.
- Der UI-Editor bleibt generisch.
- Keine Restarbeiten-Fachlogik wird in das UI-Editor-kit verschoben.
- Keine automatische UI-Erkennung, kein UI-Scanning und keine automatische Registry-Befuellung.

## Ziel des ersten Nutzstands

Der erste Nutzstand soll Bauleitung und Projektteam ermoeglichen, Restarbeiten im Projekt alltagstauglich zu fuehren:
- erfassen
- verorten
- verantwortlicher Firma oder freiem Verantwortlichenlabel zuordnen
- terminieren
- nach Status und Frist bewerten
- bearbeiten
- erledigen
- falsch erfasste Eintraege kontrolliert ausblenden
- als einfache Liste fuer Abstimmung oder Kontrolle ausgeben

Der erste Nutzstand ist erreicht, wenn die unten genannten Muss-Funktionen fachlich abgenommen sind. Er ist nicht abhaengig von Foto-Workflow, Mailversand, Diktat oder vollstaendiger Historie.

## Verbindliche Muss-Funktionen

Muss fuer den ersten Nutzstand:
- Restarbeiten im Projektkontext oeffnen.
- Vorhandene Restarbeiten eines Projekts laden.
- Neue Restarbeit anlegen.
- Bestehende Restarbeit bearbeiten.
- Restarbeit mit Kurztext, Ort/Bereich, Verantwortlichkeit, Status und Fertig-bis fuehren.
- Status `offen`, `in_arbeit` und `erledigt` fachlich nutzen.
- Frist ueber Ampel bewerten.
- Ueberfaellige Eintraege sichtbar machen.
- Restarbeit bewusst auf erledigt setzen.
- Falsch erfasste oder doppelte Eintraege per Soft-Delete aus der normalen Liste entfernen.
- Nach Status, Verantwortlichkeit, Klasse und Verortung filtern.
- Einfache Listen-Ausgabe fuer Kontrolle/Abstimmung bereitstellen.
- Speicher- und Fehlerverhalten aus Anwendersicht nachvollziehbar anzeigen oder fachlich eindeutig begrenzen.

## Bewusst ausgeschlossene Funktionen fuer spaeter

Nicht Teil des ersten Nutzstands:
- Fotoimport im aktiven Screen.
- Fotogalerie, Hauptfoto-Bedienung und Smartphone-Import.
- Bildbearbeitung, Zuschnitt oder Thumbnail-Erzeugung.
- Mailversand mit PDF-Anhang.
- Diktat fuer Kurztext, Langtext oder Notizen.
- vollstaendige revisionssichere Feldhistorie.
- Rollen-/Rechtekonzept fuer Freigabe oder Abnahme.
- tiefe Archivverwaltung mit eigener Archivansicht.
- Notizen als zwingender Bestandteil der Ausgabe.
- automatische UI-Erkennung oder UI-Editor-Ableitung.
- Konsolidierung paralleler UI-Editor-/Runtime-Spuren.

## Pflichtfelder

Eine Restarbeit braucht fuer den ersten Nutzstand diese Pflichtfelder:
- Kurztext/Titel
- Ort/Bereich
- Status
- Verantwortlich
- Fertig bis

### Kurztext/Titel

Pflicht vor dem ersten Speichern eines neuen Datensatzes.

Der Kurztext beschreibt knapp, welche Restarbeit zu erledigen ist. Ohne Kurztext darf kein neuer Datensatz angelegt werden.

### Ort/Bereich

Pflicht fuer fachlich vollstaendige Restarbeiten.

Mindestens ein Verortungsfeld muss befuellt sein. Wenn die konkrete Projektstruktur noch nicht vollstaendig gepflegt ist, reicht fuer den ersten Nutzstand ein eindeutig lesbarer Ort/Bereich in einer vorhandenen Verortungsebene.

### Status

Pflicht immer.

Default fuer neue Restarbeiten ist `offen`. Ein unbekannter oder leerer Status darf nicht als fachlich gueltiger Zustand gelten.

### Verantwortlich

Pflicht fuer fachlich vollstaendige Restarbeiten.

Zulaessig ist:
- Projektfirma
- Gewerk
- freies Verantwortlichenlabel

Eine konkrete Person ist im ersten Nutzstand nicht Pflicht.

### Fertig bis

Pflicht fuer fachlich vollstaendige Restarbeiten.

Ein neuer Entwurf darf kurzzeitig ohne Fertig-bis-Datum existieren. Vor fachlicher Ausgabe oder Abnahme muss das Datum vorhanden sein oder der Eintrag sichtbar als unvollstaendig gelten.

## Optionale Felder

Optional im ersten Nutzstand:
- Langbeschreibung
- weitere Verortungsebenen
- Klasse `rest` oder `mangel`
- Notizen
- Fotos/Anlagen
- Erledigungsnotiz
- interne Projektsettings fuer Verortungslabels

Prioritaet wird im ersten Nutzstand nicht als eigenes Pflichtfeld eingefuehrt. Die fachliche Dringlichkeit ergibt sich zunaechst aus Fertig-bis, Ampel, Status und Klasse.

## Felder, die leer bleiben duerfen

Leer bleiben duerfen:
- Langbeschreibung
- Notizen
- Fotos/Anlagen
- Erledigungsnotiz
- weitere Verortungsebenen, wenn mindestens eine Verortungsebene befuellt ist
- konkrete Person hinter Firma/Gewerk

Leer bleiben duerfen nur vorlaeufig:
- Verantwortlich
- Fertig bis
- Ort/Bereich

Diese vorlaeufig leeren Pflichtfelder machen den Datensatz fachlich unvollstaendig.

## Felder vor dem Speichern

Vor dem ersten technischen Speichern eines neuen Datensatzes muss mindestens vorhanden sein:
- Kurztext/Titel

Vor fachlicher Abnahme oder Ausgabe muss vorhanden sein:
- Kurztext/Titel
- Ort/Bereich
- Status
- Verantwortlich
- Fertig bis

Grund: Der aktuelle Arbeitsstand nutzt Auto-Save. Deshalb darf ein Arbeitsentwurf entstehen, aber eine fachlich nutzbare Restarbeit muss vollstaendig gekennzeichnet sein.

## Statusmodell

### Statuswerte im ersten Nutzstand

Verbindliche Statuswerte:
- `offen`
- `in_arbeit`
- `erledigt`

`offen` bedeutet:
- erfasst
- nicht erledigt
- noch nicht bestaetigt in Bearbeitung
- frist- und ampelseitig aktiv

`in_arbeit` bedeutet:
- Verantwortliche Stelle arbeitet daran oder Bearbeitung ist zugesagt
- nicht erledigt
- frist- und ampelseitig aktiv

`erledigt` bedeutet:
- fachlich als abgeschlossen markiert
- nicht mehr fristkritisch
- bleibt nachvollziehbar sichtbar oder filterbar

### Spaetere Statuswerte

Spaeter moeglich, aber nicht fuer den ersten Nutzstand:
- `zurueckgestellt`
- `entfaellt`
- `problem`
- `abgenommen`

Diese Werte duerfen erst eingefuehrt werden, wenn daraus konkrete Fachablaeufe folgen.

## Erlaubte Statuswechsel

Erlaubt:
- `offen` -> `in_arbeit`
- `offen` -> `erledigt`
- `in_arbeit` -> `erledigt`
- `in_arbeit` -> `offen`
- `erledigt` -> `offen`
- `erledigt` -> `in_arbeit`

Rueckwechsel aus `erledigt` sind erlaubt, wenn die Erledigung fachlich widerrufen wird oder Nacharbeit entsteht.

## Verbotene Statuswechsel

Verboten im ersten Nutzstand:
- automatischer Wechsel auf `erledigt` wegen erreichtem oder ueberschrittenem Fertig-bis-Datum
- automatischer Wechsel auf `in_arbeit` wegen Verantwortlichenzuweisung
- automatischer Wechsel auf `offen` wegen geaendertem Fertig-bis-Datum
- automatischer Wechsel aus oder in spaetere Statuswerte, solange diese nicht Teil des Nutzstands sind
- Statuswechsel durch den generischen UI-Editor

Statuswechsel muessen fachliche Nutzeraktionen oder explizite Restarbeiten-Logik sein.

## Statuswirkung auf Ampel, Archiv und Sichtbarkeit

Ampel:
- `offen` und `in_arbeit` werden fristaktiv bewertet.
- `erledigt` ist nicht fristaktiv und zeigt keine rote/orange Warnung.

Archiv:
- `erledigt` macht einen Eintrag archivfaehig, archiviert ihn aber nicht automatisch.
- `offen` und `in_arbeit` duerfen nicht automatisch archiviert werden.

Sichtbarkeit:
- `offen` und `in_arbeit` erscheinen in der normalen aktiven Liste.
- `erledigt` darf in der normalen Liste sichtbar bleiben oder per Filter ausgeblendet werden, verschwindet aber nicht automatisch.
- Soft-geloeschte Eintraege erscheinen nicht in der normalen Liste.

## Ampel-/Fristenregeln

Die Ampel bewertet nur Fristlage und Erledigungszustand. Sie bewertet nicht Qualitaet, Schwere oder Schuld.

Verbindliche Regeln:
- Status `erledigt`: neutral, unabhaengig vom Fertig-bis-Datum.
- Kein Fertig-bis-Datum: neutral, aber fachlich unvollstaendig.
- Fertig bis in der Vergangenheit und Status nicht `erledigt`: rot.
- Fertig bis heute und Status nicht `erledigt`: orange.
- Fertig bis in den naechsten 10 Tagen und Status nicht `erledigt`: orange.
- Fertig bis spaeter als 10 Tage in der Zukunft und Status nicht `erledigt`: gruen.

`offen` und `in_arbeit` werden gleich bewertet. Der Unterschied der Statuswerte liegt in der fachlichen Bearbeitung, nicht in der Fristlogik.

Eine ueberfaellige Restarbeit bleibt rot, bis:
- sie auf `erledigt` gesetzt wird, oder
- das Fertig-bis-Datum bewusst fachlich geaendert wird.

Die Ampel darf keinen Status automatisch aendern.

## Speichern/Auto-Save-Entscheidung

Fuer den ersten Nutzstand bleibt Auto-Save das fachliche Zielverhalten.

Begruendung:
- Der vorhandene Arbeitsstand ist bereits auf Auto-Save ausgerichtet.
- Ein Speichern-Button wuerde neue UI- und Ablaufentscheidungen erzwingen.
- M24 soll keine neue UI bauen.

### Sofort speicherbare Felder

Auto-Save darf fuer diese normalen Bearbeitungsfelder genutzt werden:
- Kurztext
- Langbeschreibung
- Verortung
- Status
- Fertig bis
- Verantwortlich
- Klasse `rest`/`mangel`

Dabei gilt:
- neuer Datensatz erst, wenn Kurztext vorhanden ist
- bestehender Datensatz darf feldweise aktualisiert werden
- Pflichtfeldluecken muessen fachlich sichtbar bleiben oder als unvollstaendig gelten

### Bestaetigungspflichtige Aenderungen

Diese Aktionen brauchen bewusste Nutzeraktion:
- Loeschen/Soft-Delete
- Archivieren
- Erledigung zuruecknehmen, wenn dadurch eine abgeschlossene Restarbeit wieder aktiv wird
- Fotoimport oder Anlageloeschung, sobald Foto-UI spaeter umgesetzt wird
- Mailversand oder Druckausfuehrung, sobald Ausgabewege spaeter umgesetzt werden

### Unvollstaendige Pflichtfelder

Bei unvollstaendigen Pflichtfeldern gilt:
- Datensatz darf als Arbeitsentwurf existieren, wenn technisch bereits angelegt.
- Datensatz gilt nicht als fachlich vollstaendig.
- Ausgabe/Abnahme muss unvollstaendige Eintraege sichtbar machen oder blockieren.
- Fehlende Pflichtfelder duerfen nicht stillschweigend mit Platzhalterwerten aufgefuellt werden.

### Verlassen eines Datensatzes

Beim Verlassen eines Datensatzes:
- Normale Feldwerte werden per Auto-Save gespeichert.
- Wenn Auto-Save fehlschlaegt, muss ein spaeteres Umsetzungspaket eine klare Fehlerrueckmeldung sicherstellen.
- Es gibt keinen stillen Datenverlust als akzeptiertes Fachverhalten.
- Kritische Aktionen bleiben bestaetigungspflichtig und duerfen nicht nur durch Verlassen eines Feldes passieren.

## Erledigen, Loeschen, Archivieren

### Erledigen

Eine Restarbeit gilt als erledigt, wenn:
- der Status bewusst auf `erledigt` gesetzt wird
- die Restarbeit fachlich abgeschlossen ist
- die Verantwortung nicht mehr offen ist

Eine Erledigungsnotiz ist optional. Eine spaetere Abnahme durch Auftraggeber oder Bauherr ist nicht Teil des ersten Nutzstands.

### Loeschen

Loeschen ist erlaubt fuer:
- versehentlich angelegte Eintraege
- doppelte Eintraege
- sachlich falsche Eintraege, die nicht als erledigt/archiviert gefuehrt werden sollen

Loeschen erfolgt im ersten Nutzstand als Soft-Delete:
- Eintrag verschwindet aus der normalen Liste.
- Laufende Nummer wird nicht wiederverwendet.
- Anlage-/Aenderungsdaten bleiben im Datenbestand erhalten, soweit technisch vorhanden.

### Archivieren

Archivieren ist spaeterer Bedienumfang.

Fachliche Regel fuer spaeter:
- Archivieren betrifft erledigte oder entfallene Eintraege, die fachlich erhalten bleiben muessen.
- Archivieren ist kein Ersatz fuer Soft-Delete falscher Eintraege.
- Archivierte Eintraege duerfen nicht mit geloeschten Eintraegen verwechselt werden.

### Historie

Im ersten Nutzstand muss erhalten bleiben:
- Anlagezeit
- Aktualisierungszeit
- Erledigungszeit, soweit technisch vorhanden
- Soft-Delete-Zeit, soweit technisch vorhanden
- Notizen als separate Eintraege, wenn genutzt

Nicht Pflicht im ersten Nutzstand:
- vollstaendige Feldwechselhistorie
- Autor je Feldwechsel
- Begruendung je Statuswechsel

## Verantwortliche/Firmen/Gewerke

Fachlich Pflicht ist eine erkennbare Verantwortlichkeit.

Fuer den ersten Nutzstand reicht:
- Firma
- Gewerk
- freies Verantwortlichenlabel

Eine konkrete Person ist nicht Pflicht.

Wenn noch keine Firma zugeordnet ist:
- Der Datensatz darf als Arbeitsentwurf existieren.
- Verantwortlich darf temporaer leer sein.
- Fuer fachliche Ausgabe/Abnahme muss die fehlende Zuordnung sichtbar sein oder der Eintrag gilt als unvollstaendig.

UI-Bewertung fuer fehlende Zuordnung:
- fehlende Verantwortlichkeit ist kein Fehler beim Entwurf
- fehlende Verantwortlichkeit ist ein fachlicher Vollstaendigkeitsmangel
- sie darf nicht als `unbekannt` normalisiert werden, wenn der Anwender das nicht bewusst gesetzt hat

## Notizen

Notizen sind optional.

Rolle im ersten Nutzstand:
- interne Ergaenzungen
- Rueckfragen
- Verlaufshinweise
- kurze Klarstellungen

Notizen sind Teil der einfachen Restarbeiten-Historie, wenn sie genutzt werden. Sie ersetzen keine Pflichtfelder und keine Statusentscheidung.

Druck/PDF/Mail:
- Notizen muessen im ersten Nutzstand nicht gedruckt werden.
- Notizen muessen im ersten Nutzstand nicht in Mail enthalten sein.
- Wenn Notizen spaeter in PDF/Druck/Mail erscheinen, muss separat entschieden werden, ob alle Notizen, nur aktuelle Notizen oder nur freigegebene Notizen ausgegeben werden.

Spaeter:
- Autor/Zeitpunkt sichtbar machen
- Notizen bearbeiten/loeschen oder bewusst unveraenderlich lassen
- Notizen in Detail-PDF oder Historienausgabe aufnehmen

## Fotos/Anlagen

Fotos und Anlagen sind im ersten Nutzstand nicht Pflicht.

Sie duerfen vorbereitet bleiben, aber:
- keine Foto-Pflicht fuer Erledigung
- keine Foto-Pflicht fuer Ausgabe
- kein Smartphone-Import im ersten Nutzstand
- keine Bildbearbeitung im ersten Nutzstand

Spaeter zu ergaenzen:
- sichtbarer Import
- Anzeige im aktiven Screen
- Hauptfoto-Auswahl
- Loeschen
- maximale Anzahl je Restarbeit
- Verhalten bei fehlender Datei
- optionale Ausgabe in PDF/Druck/Mail

## PDF/Druck/Mail

### Zwingend fuer den ersten Nutzstand

Zwingend ist eine einfache fachliche Ausgabe der Liste oder eine bewusst dokumentierte Sperre, solange die Ausgabe technisch noch nicht fertig ist.

Fachlich bevorzugter erster Ausgabeumfang:
- laufende Nummer
- Ort/Bereich
- Kurztext
- Status
- Fertig bis
- Ampel
- Verantwortlich
- Klasse `rest`/`mangel`

Die Ausgabe muss nicht schoen final layoutet sein, aber sie muss fuer Abstimmung und Kontrolle lesbar sein.

### Darf noch Stub/Platzhalter bleiben

Darf im ersten Nutzstand noch fehlen:
- Mailversand
- Detail-PDF je Restarbeit
- Fotoausgabe
- Notizhistorie in der Ausgabe
- Archivausgabe
- Diktatbezogene Ausgabe

### Spaetere Inhalte

Spaeter fuer PDF/Druck/Mail zu klaeren:
- Projektkopf und Projektbeteiligte
- Filterstand der Ausgabe
- Notizen ja/nein
- Fotos ja/nein
- erledigte/archivierte Eintraege ja/nein
- Mailadressaten und Mailtext
- Ablageort und Dateiname

## Fachliche Abnahmefaelle

Diese Abnahmefaelle sind fachliche Prueffaelle. Sie sind keine technischen Unit-Tests.

1. Neues Projekt mit mindestens einer Projektfirma oeffnen und `Restarbeiten` starten.
2. Neue Restarbeit mit Kurztext, Ort, Verantwortlichem, Fertig-bis und Status `offen` anlegen.
3. Neue Restarbeit ohne Kurztext beginnen und pruefen, dass kein fachlich gueltiger Datensatz entsteht.
4. Restarbeit ohne Ort/Bereich als unvollstaendig bewerten.
5. Restarbeit ohne Verantwortlichen als unvollstaendig bewerten.
6. Restarbeit ohne Fertig-bis als unvollstaendig und ampelseitig neutral bewerten.
7. Fertig-bis gestern bei Status `offen` zeigt rot.
8. Fertig-bis heute bei Status `offen` zeigt orange.
9. Fertig-bis in den naechsten 10 Tagen bei Status `in_arbeit` zeigt orange.
10. Fertig-bis in mehr als 10 Tagen bei Status `offen` zeigt gruen.
11. Status `erledigt` zeigt keine rote oder orange Fristwarnung, auch wenn Fertig-bis in der Vergangenheit liegt.
12. Status von `offen` nach `in_arbeit` wechseln und Eintrag weiter als fristaktiv sehen.
13. Status von `in_arbeit` nach `erledigt` wechseln und Eintrag als erledigt erkennen.
14. Erledigung zuruecknehmen und Eintrag wieder als fristaktiv sehen.
15. Verantwortliche Firma zuweisen, wechseln und leeren; leerer Zustand gilt als unvollstaendig.
16. Freies Verantwortlichenlabel nutzen, wenn keine Projektfirma vorhanden ist.
17. Notiz hinzufuegen und als optionalen Verlaufshinweis sehen.
18. Restarbeit mit fehlenden Fotos trotzdem fachlich nutzen.
19. Falsch angelegte Restarbeit per Soft-Delete aus der normalen Liste entfernen.
20. Erledigte Restarbeit nicht loeschen, sondern sichtbar halten oder spaeter archivieren.
21. Filter nach Status anwenden und aktive sowie erledigte Eintraege nachvollziehbar unterscheiden.
22. Filter nach Verantwortlichem anwenden und fehlende Verantwortlichkeit erkennen.
23. Einfache Listen-Ausgabe mit Nummer, Ort, Kurztext, Status, Fertig-bis, Ampel und Verantwortlichem fachlich pruefen.
24. Mailversand, Diktat und Foto-Workflow als bewusst nicht erforderliche Funktionen fuer den ersten Nutzstand abnehmen.

## Abgrenzung zum generischen UI-Editor

Eindeutig in Restarbeiten gehoert:
- Pflichtfeldlogik
- Statusmodell
- Statuswechsel
- Ampel-/Fristenlogik
- Auto-Save-Fachentscheidung
- Erledigen, Loeschen, Archivieren
- Verantwortliche/Firmen/Gewerke
- Notizen
- Fotos/Anlagen
- PDF-/Druck-/Mail-Anforderungen
- fachliche Abnahmefaelle
- fachliche Fehler- und Vollstaendigkeitsbewertung

Darf nicht in den UI-Editor:
- Restarbeiten-Daten laden oder speichern
- DB-/IPC-Wege nutzen
- Status setzen oder berechnen
- Ampel berechnen
- Pflichtfelder validieren
- Auto-Save, Loeschen, Archivieren oder Erledigen ausfuehren
- Fotoimport, Notizspeicherung, PDF/Druck/Mail ausfuehren
- Ziel-App-Oberflaeche scannen
- DOM-Struktur inspizieren
- UI automatisch erkennen
- Registry automatisch befuellen
- BBM-Fachentscheidungen treffen

Restarbeiten darf als Ziel-App liefern:
- explizite ElementRegistry
- Scope-ID und Scope-Metadaten
- bewusst registrierte UI-Elemente
- Parent-Struktur registrierter Elemente
- erlaubte und gesperrte Editor-Operationen auf UI-Ebene
- Markierung nicht editorfaehiger Fachaktionen

Verbindlich:
- Die Ziel-App liefert die ElementRegistry.
- Der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Der Editor untersucht die Ziel-App-Oberflaeche nicht selbst.

## Empfohlene naechste Meilensteine M25/M26

### M25: Umsetzungspaket Pflichtfelder, Status und Ampel schneiden

M25 sollte als kleines Umsetzungspaket die erste fachliche Nutzbarkeit technisch absichern:
- Pflichtfeldvollstaendigkeit sichtbar machen
- Statuswerte auf `offen`, `in_arbeit`, `erledigt` fuer den ersten Nutzstand schaerfen
- Ampelregel mit 10-Tage-Warnfenster fachlich absichern
- Erledigt-Zustand fristneutral behandeln
- Auto-Save-Fehler-/Unvollstaendigkeitsverhalten festlegen

Wenn UI sichtbar geaendert wird, ist vorher eine UI-/PDF-Entwurfsentscheidung noetig.

### M26: Einfache Restarbeiten-Ausgabe fachlich/technisch schneiden

M26 sollte die erste Ausgabe separat klaeren:
- Liste statt Detail-PDF als erster Umfang
- Inhalte gemaess dieser Spezifikation
- kein Mailzwang
- keine Foto-/Notizpflicht
- Maschinenraum-Dienste nutzen, aber keine Ausgabe-Fachlogik in den UI-Editor verschieben

Wenn PDF/Druck gebaut oder geaendert wird, ist vorher eine UI-/PDF-Entwurfsentscheidung noetig.
