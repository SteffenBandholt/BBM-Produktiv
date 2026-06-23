# M23 Restarbeiten Nutzbarkeitsgrenze

## Kurzfazit

Der erste echte Nutzstand von `Restarbeiten` ist erreicht, wenn ein Bauprojekt Restarbeiten erfassen, verantwortlichen Firmen zuweisen, terminlich bewerten, verfolgen, erledigen und als einfache pruefbare Liste ausgeben kann.

M23 baut noch nichts. Dieses Dokument legt nur die fachliche Grenze fest, an der spaetere Umsetzungen gemessen werden.

Fuer den ersten Nutzstand gilt:
- Restarbeiten bleibt Fachmodul in BBM.
- Der generische UI-Editor bleibt frei von Restarbeiten-Fachlogik.
- Pflicht ist ein stabiler Erfassungs-, Bearbeitungs-, Status- und Ausgabeablauf.
- Fotos, Mailversand, Diktat und umfangreiche Historie koennen spaeter folgen, sofern die Kernnutzung ohne sie fachlich abgenommen wird.

## Ziel des ersten Nutzstands

Der erste Nutzstand soll eine einfache, fachlich verlaessliche Restarbeitenliste pro Projekt ermoeglichen.

Ein Anwender muss mindestens koennen:
- Restarbeit im Projekt anlegen
- Restarbeit beschreiben und verorten
- Verantwortliche Firma oder ein freies Verantwortlichenlabel zuweisen
- Fertig-bis-Datum setzen
- Status nachvollziehbar aendern
- ueber Ampel/Frist erkennen, was kritisch ist
- erledigte Restarbeiten erkennen
- versehentliche oder falsche Eintraege kontrolliert entfernen oder ausblenden
- eine einfache Liste fuer Abstimmung, Kontrolle oder Uebergabe ausgeben

Nicht Ziel des ersten Nutzstands ist ein vollstaendiges Maengelmanagement, ein Foto-Workflow mit Smartphone-Synchronisation, ein automatischer Mailprozess oder eine vollstaendige revisionssichere Historie.

## Muss-Funktionen

Zwingend fuer den ersten Nutzstand:
- Restarbeiten im Projektkontext oeffnen
- Liste vorhandener Restarbeiten laden
- neue Restarbeit anlegen
- bestehende Restarbeit bearbeiten
- Restarbeit mit Kurztext, Ort, Verantwortlichem, Status und Fertig-bis fuehren
- Status und Frist fachlich sichtbar bewerten
- Restarbeit erledigen
- falsche Eintraege kontrolliert loeschen oder ausblenden
- Filter fuer Status, Verantwortliche, Klasse und Verortung nutzen
- einfache Ausgabe der aktuellen Liste erzeugen oder fachlich als bewusst noch fehlend sperren
- Fehler- und Speicherverhalten fuer Anwender nachvollziehbar machen

## Kann-spaeter-Funktionen

Spaeter moeglich, aber nicht zwingend fuer den ersten Nutzstand:
- Fotoimport und Fotogalerie im aktiven Screen
- Hauptfoto und bis zu drei Fotos pro Restarbeit als Bedienablauf
- Smartphone-Import
- Bildzuschnitt oder Thumbnail-Erzeugung
- Mailversand mit PDF-Anhang
- detaillierte Notizhistorie in Ausgabe/PDF
- Diktat fuer Kurztext, Langtext oder Notizen
- umfangreiche Archivansicht
- Rollen-/Rechtekonzept fuer Bearbeitung und Freigabe
- echte revisionssichere Historie mit Autor, Zeit und Aenderungsgrund
- kanonische Bereinigung paralleler UI-Editor-/Runtime-Spuren

## Darf im ersten Nutzstand fehlen

Ausdruecklich zulaessige Luecken im ersten Nutzstand:
- kein Mailversand
- keine Diktat-Anbindung
- keine Foto-UI, wenn der erste Nutzstand als textbasierte Restarbeitenliste abgenommen wird
- keine Notizdruckausgabe, wenn Notizen als interne Arbeitshilfe markiert bleiben
- keine tiefe Archivverwaltung
- keine automatische Synchronisation mit anderen Modulen
- keine automatische UI-Erkennung oder UI-Editor-Ableitung

## Pflichtfelder

Eine Restarbeit braucht fuer den ersten Nutzstand mindestens:
- Kurztext/Titel: Pflicht, beschreibt den Gegenstand knapp
- Ort/Bereich: Pflicht in mindestens einem Verortungsfeld oder als klarer Freitext
- Status: Pflicht, Default `offen`
- Verantwortlich: Pflicht als Projektfirma, Gewerk oder freies Verantwortlichenlabel
- Fertig bis: Pflicht fuer termingebundene Restarbeiten

Optional im ersten Nutzstand:
- Langbeschreibung
- weitere Verortungsebenen
- Klasse `Rest` oder `Mangel`
- Prioritaet
- Notizen
- Fotos/Anlagen
- Erledigungsnotiz

Noch fachlich zu entscheiden:
- Ob `Fertig bis` in jedem Fall Pflicht ist oder ob ein Status/Flag `ohne Termin` erlaubt wird.
- Ob Prioritaet ein eigenes Feld wird oder zunaechst durch Ampel/Frist und Status ersetzt wird.
- Ob eine Person hinter der Firma Pflicht wird oder Firma/Gewerk fuer den ersten Nutzstand genuegt.

## Statusmodell

Mindeststatus fuer den ersten Nutzstand:
- `offen`: Restarbeit ist erfasst und noch nicht begonnen oder nicht bestaetigt.
- `in_arbeit`: Verantwortliche Stelle arbeitet daran oder Bearbeitung ist zugesagt.
- `erledigt`: Arbeit ist fachlich als erledigt markiert.

Sinnvolle spaetere Statuswerte:
- `zurueckgestellt`: bewusst nicht aktuell zu bearbeiten.
- `entfaellt`: fachlich nicht mehr erforderlich.
- `problem`: Mangel/Problemfall, der nicht normal abgearbeitet werden kann.

Fuer den ersten Nutzstand reicht die Unterscheidung `Rest`/`Mangel` als Klasse neben dem Status aus. Ein eigener Status `Mangel/Problem` ist erst noetig, wenn daraus ein anderer Bearbeitungs- oder Eskalationsweg folgt.

Erlaubte Statuswechsel im ersten Nutzstand:
- `offen` -> `in_arbeit`
- `offen` -> `erledigt`
- `in_arbeit` -> `erledigt`
- `in_arbeit` -> `offen`, wenn die Zusage oder Bearbeitung zurueckgenommen wird
- `erledigt` -> `offen`, wenn die Erledigung fachlich widerrufen wird

Nicht stillschweigend passieren darf:
- automatisches Erledigen nur wegen erreichtem Datum
- automatisches Loeschen erledigter Eintraege
- automatisches Umklassifizieren von `Rest` zu `Mangel`
- automatischer Statuswechsel durch den UI-Editor

## Ampel-/Fristenregeln

Die Ampel bewertet die Frist, nicht die fachliche Qualitaet.

Vorgeschlagene Mindestregel:
- rot: Fertig-bis-Datum ist vor dem heutigen Datum und Status ist nicht `erledigt`
- orange: Fertig-bis-Datum ist heute oder innerhalb eines kurzen Warnfensters faellig und Status ist nicht `erledigt`
- gruen: Fertig-bis-Datum liegt ausserhalb des Warnfensters in der Zukunft und Status ist nicht `erledigt`
- neutral: kein Fertig-bis-Datum vorhanden oder Status `erledigt`

Bei ueberfaelligen Restarbeiten:
- Die Ampel bleibt rot, bis der Status auf `erledigt` gesetzt oder das Fertig-bis-Datum fachlich angepasst wird.
- Eine Ueberfaelligkeit darf den Status nicht automatisch aendern.

Ohne Fertig-bis-Datum:
- Der Eintrag bleibt fachlich sichtbar, aber die Ampel ist neutral.
- Wenn `Fertig bis` als Pflichtfeld bestaetigt wird, muss ein fehlendes Datum als unvollstaendig erkennbar sein.

Bei erledigten Restarbeiten:
- Die Ampel ist neutral oder visuell erledigt, aber nicht rot/orange.
- Das urspruengliche Fertig-bis-Datum bleibt als Information erhalten.

## Regeln fuer Erledigen, Loeschen, Archivieren

Eine Restarbeit ist erledigt, wenn:
- der Status bewusst auf `erledigt` gesetzt wurde
- die fachlich verantwortliche Person/Firma die Leistung als abgeschlossen betrachtet
- offene Pflichtfelder nicht mehr unklar sind

Fuer den ersten Nutzstand reicht eine einfache Erledigt-Markierung. Eine separate Abnahme durch Auftraggeber, Bauleitung oder Kunde kann spaeter folgen.

Loeschen:
- Loeschen ist nur fuer falsch erfasste, doppelte oder versehentliche Eintraege vorgesehen.
- Produktiv sollte Loeschen als Soft-Delete erfolgen.
- Geloeschte Eintraege sollen nicht in der normalen Liste erscheinen.
- Laufende Nummern sollen nicht wiederverwendet werden.

Archivieren:
- Archivieren ist fuer fachlich erledigte oder nicht mehr aktive Restarbeiten gedacht, die erhalten bleiben muessen.
- Archivieren ersetzt nicht das Loeschen falscher Eintraege.
- Eine Archivansicht ist fuer den ersten Nutzstand nicht zwingend, solange geloeschte und erledigte Eintraege nicht verwechselt werden.

Historie:
- Fuer den ersten Nutzstand muessen Anlagezeit, Aktualisierung und Erledigungszeit fachlich nachvollziehbar bleiben, soweit technisch bereits vorhanden.
- Eine vollstaendige Aenderungshistorie mit jedem Feldwechsel ist spaeter.

## Verantwortliche/Firmen

Zuweisung im ersten Nutzstand:
- bevorzugt ueber Projektfirma oder Gewerk
- ersatzweise ueber freies Verantwortlichenlabel

Eine konkrete Person ist fuer den ersten Nutzstand nicht zwingend, solange die Verantwortung im Projektalltag ueber Firma/Gewerk eindeutig genug ist.

Wenn keine Firma vorhanden ist:
- Der Eintrag darf mit freiem Verantwortlichenlabel angelegt werden.
- Alternativ darf `unbekannt`/leer nur als unvollstaendig sichtbar bleiben, nicht als stiller Normalzustand.

Fachliche Mindestregel:
- Verantwortlichkeit muss vor Ausgabe oder Abnahme erkennbar sein.
- Eine Restarbeit ohne Verantwortlichen ist ein Arbeitsentwurf oder unvollstaendig, nicht fertig gefuehrt.

## Notizen

Notizen sind im ersten Nutzstand hilfreich, aber nicht zwingend.

Rolle:
- Ergaenzende Verlaufskommentare
- Rueckfragen, Telefonnotizen, Klarstellungen
- interne Arbeitsnotizen

Fuer den ersten Nutzstand:
- Notizen duerfen vorhanden sein.
- Notizen muessen nicht zwingend druckbar sein.
- Notizen muessen nicht zwingend Teil einer vollstaendigen Historie sein.

Spaeter zu klaeren:
- ob Notizen auf PDF-Ausgaben erscheinen
- ob Notizen bearbeitet oder geloescht werden duerfen
- ob Autor/Zeitpunkt sichtbar sein muessen
- ob Notizen rechtlich/fachlich Teil der Abnahmeakte sind

## Fotos/Anlagen

Fotos sind fachlich wertvoll, aber fuer den ersten Nutzstand nicht zwingend, sofern der erste Nutzstand als textbasierte Liste abgenommen wird.

Fuer einen ersten Nutzstand ohne Fotos gilt:
- Foto-/Attachment-Struktur darf vorbereitet bleiben.
- Sichtbare Foto-Bedienung muss entweder fehlen oder klar als nicht fertig markiert sein.
- Fotos duerfen nicht stillschweigend als Pflicht fuer fachliche Erledigung gelten.

Wenn Fotos in M24 als Pflicht fuer den ersten Nutzstand festgelegt werden, muessen mindestens geklaert werden:
- Importweg
- Anzeige im aktiven Screen
- Hauptfoto
- Loeschen
- maximale Anzahl
- Verhalten bei fehlender Datei
- Ausgabe/PDF-Verwendung

## PDF/Druck/Mail

Fuer den ersten Nutzstand ist eine einfache Ausgabe fachlich wichtig, weil Restarbeiten typischerweise abgestimmt, verteilt oder nachverfolgt werden.

Mindestanforderung:
- Entweder eine einfache druck-/exportfaehige Liste ist verfuegbar,
- oder der erste Nutzstand wird ausdruecklich als rein interne Arbeitsliste ohne Ausgabe abgenommen.

Empfohlen fuer den ersten Nutzstand:
- einfache Liste mit Nummer, Ort, Kurztext, Status, Fertig bis, Verantwortlichem und Ampel
- keine Pflicht fuer Detail-PDF
- keine Pflicht fuer Fotos im PDF
- keine Pflicht fuer Notizen im PDF
- kein Pflicht-Mailversand

Mail:
- Mailversand ist spaeter.
- Der erste Nutzstand darf ohne Mail gelten, wenn die Ausgabe anderweitig fachlich nutzbar ist.

## Speichern/Auto-Save

Fuer Restarbeiten muss vor Umsetzung fachlich entschieden werden, ob Auto-Save als bewusstes Produktverhalten akzeptiert ist.

Variante A: Auto-Save bleibt der erste Nutzstand
- Feldverlassen oder Commit speichert Aenderungen.
- Der Anwender braucht klare Rueckmeldung bei Fehlern.
- Pflichtfeldverletzungen duerfen nicht still unklar bleiben.
- Kritische Aktionen wie Loeschen, Erledigen oder Archivieren brauchen bewusste Nutzeraktion.

Variante B: Expliziter Speichern-Button
- Aenderungen bleiben lokal, bis der Anwender speichert.
- Abbrechen/Verwerfen muss fachlich definiert werden.
- Mehr UI-Logik waere noetig und gehoert in ein spaeteres Umsetzungspaket.

M23-Empfehlung:
- Fuer den ersten Nutzstand Auto-Save nur beibehalten, wenn Status-/Fehleranzeige und Pflichtfeldverhalten fuer Anwender eindeutig sind.
- Loeschen, Archivieren und Erledigen duerfen nicht stillschweigend durch Auto-Save passieren.

## Fachliche Abnahmefaelle

Vor dem ersten Nutzstand muessen fachlich mindestens diese Szenarien abgenommen werden:

1. Neues Projekt mit Projektfirmen oeffnen und Restarbeiten starten.
2. Neue Restarbeit mit Kurztext, Ort, Verantwortlichem, Status und Fertig-bis anlegen.
3. Restarbeit ohne Pflichtfeld erkennen und fachlich korrekt behandeln.
4. Bestehende Restarbeit bearbeiten und Aenderung nach erneutem Oeffnen wiederfinden.
5. Verantwortliche Firma wechseln und wieder entfernen oder ersetzen.
6. Faellige, ueberfaellige und zukuenftige Restarbeiten in der Ampel korrekt erkennen.
7. Restarbeit von `offen` nach `in_arbeit` und `erledigt` fuehren.
8. Erledigte Restarbeit bleibt nachvollziehbar und verschwindet nicht unkontrolliert.
9. Falsch angelegte Restarbeit kontrolliert loeschen/ausblenden.
10. Filter nach Status, Verantwortlichem, Klasse und Ort anwenden.
11. Einfache Ausgabe oder bewusst gesperrter Ausgabeweg fachlich bewerten.
12. Nutzung ohne Foto, ohne Mail und ohne Diktat fachlich pruefen.

Diese Abnahmefaelle sind fachliche Szenarien. Sie ersetzen keine technischen Unit-Tests und behaupten keinen heutigen Fertigstand.

## Klare Abgrenzung zum generischen UI-Editor

Gehoert eindeutig in Restarbeiten:
- Pflichtfelder und Validierung
- Statusmodell
- Ampel-/Fristenlogik
- Erledigen, Loeschen, Archivieren
- Verantwortliche/Firmen
- Notizen
- Fotos/Anlagen
- Ausgabeanforderungen
- Speicherverhalten
- fachliche Abnahmefaelle
- ElementRegistry fuer den Restarbeiten-Scope als Ziel-App-Beitrag

Darf nicht in den generischen UI-Editor:
- Restarbeiten-Statuslogik
- Ampelberechnung
- Pflichtfeldvalidierung
- Speichern, Auto-Save, Loeschen, Archivieren oder Erledigen
- DB-/IPC-Zugriffe
- Fotoimport, Notizspeicherung, PDF/Druck/Mail-Ausfuehrung
- automatische UI-Erkennung
- UI-Scanning oder DOM-Scan
- automatische Registry-Befuellung
- Ableitung von Fachzielen aus sichtbarer UI

Zulaessig fuer Restarbeiten als Ziel-App:
- explizite ElementRegistry liefern
- Scope-Informationen fuer bewusst registrierte UI-Elemente liefern
- nicht editorfaehige Fachaktionen als gesperrt markieren

Verbindliches Prinzip:
- Die Ziel-App liefert die ElementRegistry.
- Der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Der Editor untersucht die Ziel-App-Oberflaeche nicht selbst.

## Empfohlene naechste Meilensteine M24/M25

### M24: Restarbeiten ersten Nutzstand fachlich spezifizieren

M24 sollte aus dieser Nutzbarkeitsgrenze eine umsetzbare Fachspezifikation machen:
- Pflichtfeldentscheidung finalisieren
- Statuswerte und Statuswechsel final bestaetigen
- Auto-Save-Variante entscheiden
- Loeschen/Archivieren/Erledigen als Nutzerablauf beschreiben
- fachliche Abnahmefaelle als Checkliste festschreiben

Noch keine UI-Editor-Funktion und keine automatische Erkennung.

### M25: Umsetzungspaket fuer den ersten Nutzstand schneiden

M25 sollte erst nach M24 entscheiden, welches kleine technische Paket folgt:
- entweder Pflichtfeld-/Status-/Erledigt-Verhalten
- oder einfache Ausgabe/PDF-Liste
- oder Foto-UI, falls Fotos fachlich doch Pflicht fuer den ersten Nutzstand werden

M25 darf nur ein kleines Umsetzungspaket sein und muss UI-/PDF-Entwurfsentscheidung enthalten, wenn UI oder PDF geaendert wird.
