# Tabelleneditor / Tabellen-Layout-Service – Konzept und Realisierungsleitplanken

Status: Konzept festgelegt, noch nicht umgesetzt  
Zielbereich: internes Hilfsmodul fuer Druck, Tabellenlayouts und spaetere Seitenkopf-Layouts  
Zielgruppe: Entwicklung, Codex, ChatGPT, Admin/Projektpflege – nicht normale App-Nutzer

---

## 1. Zweck dieser Datei

Diese Datei schreibt das Projekt Tabelleneditor verbindlich fuer spaetere Arbeiten fest.

Jede spaetere ChatGPT-/Codex-Instanz soll diese Datei lesen, bevor am Tabelleneditor, am Tabellen-Layout-Service, am Druckmodul oder an neuen Fachmodul-Tabellen gearbeitet wird.

Diese Datei ergaenzt den bestehenden `docs/UI-TECH-CONTRACT.md`. Der UI-Tech-Contract bleibt vorrangig verbindlich.

Wichtige Grundregel:

> Alles, was nicht ausdruecklich Ziel ist, bleibt unveraendert.

---

## 2. Ausgangslage

BBM-produktiv besitzt bereits Druckfunktionen und PDF-Vorschau.

Im Modul Protokoll existieren bereits Tabellen. Diese Tabellen sind in UI und PDF grundsaetzlich bereits aufeinander abgestimmt, aber noch nicht komfortabel feinjustierbar.

Der vorhandene Vorschau-Druck soll als Test- und Vorschauweg weiterverwendet werden.

Es soll keine zweite PDF-Logik und kein paralleler Druckweg entstehen.

---

## 3. Zielbild

BBM-produktiv bekommt einen internen Tabelleneditor.

Der Tabelleneditor dient dazu, Tabellenlayouts schnell einstellen und testen zu koennen, ohne staendig Code zu aendern.

Der Tabelleneditor steuert nicht die fachlichen Daten. Er steuert nur das Layout.

Fachmodule liefern die Daten und die fachliche Bedeutung.
Der Tabellen-Layout-Service liefert das Aussehen.

Beispiel:

- Fachmodul Restarbeiten entscheidet: Haus, Geschoss, Wohnung, Raum, Restleistung, festgestellt, verantwortlich, fertig bis, Status.
- Tabellen-Layout-Service entscheidet: Spaltenbreiten, Reihenfolge, Schriftgroessen, Linien, Zeilenhoehen, Hochformat/Querformat-Verhalten.

---

## 4. Nicht-Ziel

Der Tabelleneditor ist kein Werkzeug fuer normale App-Nutzer.

Nicht Ziel der ersten Ausbaustufe:

- kein kompletter Report-Designer
- keine freie Seitengestaltung
- keine Bearbeitung aller Druckelemente auf einmal
- kein Umbau der bestehenden A4-Drucklogik
- keine zweite PDF-Engine
- kein Refactor-Marathon
- keine versteckten Verbesserungen ausserhalb des beauftragten Bereichs

---

## 5. Grundarchitektur

Das Projekt besteht aus mehreren Bausteinen.

### 5.1 Tabellen-Layout-Service

Zentrale interne Stelle fuer Tabellenlayouts.

Aufgaben:

- Tabellen registrieren
- Tabellenlayouts laden
- Tabellenlayouts speichern
- Standardlayouts bereitstellen
- Layouts fuer UI und PDF einheitlich ausgeben
- spaeter Hochformat-/Querformat-Varianten verwalten

### 5.1.1 Technisches Tabellenverzeichnis

Jede Tabellen-Definition traegt zusaetzlich eine technische Klassifizierung.

Pflichtfelder je Tabelle:

- `tableKey`
- `tableLabel`
- `moduleId`
- `moduleLabel`
- `tableKind` mit den Werten `content` oder `control`
- `editorEnabled` als Freigabe fuer den Tabelleneditor
- `uiAvailable`
- `pdfAvailable`
- `uiProductive`
- `pdfProductive`
- `columns`
- `previewData`
- `description`

Regeln:

- Der Tabelleneditor zeigt nur Tabellen mit `tableKind = content` und `editorEnabled = true`.
- Bedienlisten duerfen technisch erfasst werden, erscheinen aber nie im Editor.
- `uiAvailable` und `pdfAvailable` sagen, ob die Tabelle im jeweiligen Bereich ueberhaupt vorgesehen ist.
- `uiProductive` und `pdfProductive` sagen, ob der jeweilige Bereich bereits produktiv angeschlossen ist oder nur als Vorschau dient.
- Die Registry bleibt die fachliche Quelle fuer die sichtbaren Editor-Listen.

### 5.2 Tabelleneditor-UI

Interne Oberflaeche zum Einstellen der Tabellenlayouts.

Funktionen:

- Modul auswaehlen
- Tabelle auswaehlen
- nur freigegebene Inhaltstabellen mit `editorEnabled = true` anzeigen
- Spaltendefinitionen aus der Registry anzeigen
- Spaltennamen, Breiten und Preview-Werte bearbeiten, soweit erlaubt
- UI- und PDF-Breiten getrennt pflegen
- Gewichtungen und weitere einfache Spaltenmetadaten mitfuehren
- Hochformat/Querformat pruefen
- UI-Vorschau anzeigen
- PDF-Vorschau ueber vorhandenen Vorschau-Druck starten
- Layout speichern
- Layout auf Standard zuruecksetzen

Hinweise:

- `uiProductive = true` bedeutet: UI-Werte wirken produktiv in der App.
- `pdfProductive = true` bedeutet: PDF-Werte wirken produktiv im Druckpfad.
- Ist einer der Werte `false`, wird das im Editor nur als Vorschau bzw. nicht angeschlossen angezeigt.

### 5.3 UI-Tabellenausgabe

Fachmodule nutzen registrierte Tabellenlayouts fuer ihre sichtbaren Tabellen.

Das Fachmodul liefert Daten.
Der Tabellen-Layout-Service liefert das Layout.

### 5.4 PDF-Tabellenausgabe

Der PDF-Druck nutzt denselben Layout-Bauplan wie die UI, soweit technisch sinnvoll moeglich.

Ziel ist eine moeglichst gleiche Darstellung zwischen UI und PDF.

UI und PDF koennen technisch nie garantiert zu 100 Prozent identisch sein, sollen aber aus derselben Layoutquelle gespeist werden.

### 5.5 Generisches Spaltenmodell

Das Layoutsystem ist spaltenbasiert.

Eine Tabelle beschreibt ihre Layoutstruktur ueber eine `columns`-Liste, nicht ueber einzelne Zellinhalte.

Jede Spalte kann dabei unter anderem enthalten:

- technischen `key`
- sichtbares `label`
- `uiWidth`
- `pdfWidth`
- optionale `weight`
- `previewValue`
- optionale Header-Zeilen

Der Tabelleneditor erzeugt seine Eingabefelder und Vorschauen aus dieser Spaltendefinition.
Die fachlichen Zellinhalte bleiben davon getrennt.

---

## 6. Tabellenname als feste Verbindung

Jede steuerbare Tabelle bekommt einen eindeutigen technischen Namen.

Beispiele:

- `protokoll_tops`
- `protokoll_todo_liste`
- `restarbeiten_uebersicht`
- `restarbeiten_pdf_liste`

Dieser Name verbindet:

- Fachmodul
- UI-Tabelle
- PDF-Tabelle
- Tabelleneditor
- gespeichertes Layout

Keine anonyme Tabelle wie „Tabelle 1“ verwenden.

---

## 7. Pilot-Modul

Pilot ist das bestehende Modul Protokoll.

Begruendung:

- dort gibt es bereits Tabellen
- UI und PDF sind bereits grundsaetzlich abgestimmt
- vorhandener Vorschau-Druck kann genutzt werden
- Risiko ist geringer als bei einem komplett neuen Modul

Vorgehen:

1. Eine geeignete bestehende Protokoll-Tabelle auswaehlen.
2. Aktuelles Layout als Standardlayout erfassen.
3. Tabelle beim Tabellen-Layout-Service registrieren.
4. Tabelleneditor nur fuer diese eine Tabelle aktivieren.
5. UI-Vorschau testen.
6. PDF-Vorschau ueber vorhandenen Vorschau-Druck testen.
7. Erst danach weitere Tabellen anschliessen.

---

## 8. Spaeteres Beispiel: Modul Restarbeiten

Das Modul Restarbeiten soll spaeter Restleistungen auf Baustellen listen.

Beispielhafte fachliche Spalten:

- Haus
- Geschoss
- Wohnung
- Raum
- Restleistung
- festgestellt
- verantwortlich
- fertig bis
- Status

Die Verortung kann in 1 bis 4 Leveln erfolgen, z.B.:

- Haus 1
- Erdgeschoss
- Wohnung 102
- Wohnzimmer

Die fachliche Struktur wird beim Entwickeln des Moduls festgelegt.
Danach wird die Tabelle mit einem festen Namen registriert, z.B. `restarbeiten_uebersicht`.

Ab dann darf das Feintuning ueber den Tabelleneditor erfolgen.

---

## 9. Hochformat und Querformat

Der Tabelleneditor muss Hochformat und Querformat beruecksichtigen.

Tabellen koennen fuer Hochformat und Querformat unterschiedliche Layoutwerte brauchen.

Mindestens zu beruecksichtigen:

- Seitenformat: A4 Hochformat
- Seitenformat: A4 Querformat
- verfuegbare Tabellenbreite je Format
- Spaltenbreiten je Format
- Schriftgroessen je Format, falls noetig
- Warnung, wenn die Tabelle breiter als der verfuegbare Druckbereich ist

Wichtig:

> Querformat ist kein Sonderfall ausserhalb des Systems. Querformat ist eine eigene Layoutvariante derselben Tabelle.

Beispiel:

- `restarbeiten_uebersicht` Hochformat: reduzierte Spalten, kompaktere Darstellung
- `restarbeiten_uebersicht` Querformat: mehr Breite, vollstaendigere Darstellung

---

## 10. Seitenkopfeditor

Bei Hochformat und Querformat koennen die Seitenkoepfe unterschiedlich aussehen.

Deshalb muss ein spaeterer Seitenkopfeditor vorgesehen werden.

Der Seitenkopfeditor ist nicht zwingend Teil der ersten Tabelleneditor-Version, muss aber architektonisch Platz bekommen.

Grundsatz:

> Tabelleneditor und Seitenkopfeditor gehoeren langfristig in denselben internen Layout-Bereich, duerfen aber nicht wild miteinander vermischt werden.

Vorschlag fuer spaetere Struktur:

- Layout-Bereich Druck
  - Tabelleneditor
  - Seitenkopfeditor
  - ggf. spaeter Fussbereich / Zusatzbereiche

Der Seitenkopfeditor soll spaeter Varianten verwalten koennen:

- Hochformat-Seitenkopf
- Querformat-Seitenkopf
- ggf. Seite 1
- ggf. Folgeseiten
- ggf. Miniheader
- ggf. Fullheader

Wichtige Grenze fuer die erste Ausbaustufe:

> Der bestehende A4-Druckrahmen mit Header, Fullheader, Miniheader, Footer sowie Seite 1 und Seite 2 wird nicht direkt umgebaut.

Stattdessen wird nur vorbereitet, dass der Seitenkopfeditor spaeter sauber angeschlossen werden kann.

---

## 11. Speicherung

Layouts sollen dauerhaft gespeichert werden.

Bevorzugte Speicherung:

- SQLite-Datenbank der App

Moegliche erste Zwischenloesung:

- JSON-Konfigurationsdatei

Langfristig bevorzugt:

- Datenbanktabellen fuer Layoutdefinitionen
- Versionierung oder Standardlayout-Ruecksetzung

Zu speichernde Mindestdaten je Tabelle:

- Tabellenname
- Modulname
- Beschreibung
- Layoutvariante: Hochformat / Querformat
- Spaltenliste
- Spaltenreihenfolge
- Spaltenbreiten
- Spaltenueberschriften
- Sichtbarkeit UI
- Sichtbarkeit PDF
- Schriftgroesse Kopfzeile
- Schriftgroesse Inhalt
- Zeilenhoehe
- Gitternetzlinien ja/nein
- Ausrichtung je Spalte

---

## 12. Vorschau

Der Tabelleneditor braucht zwei Vorschauen.

### 12.1 UI-Vorschau

Zeigt die Tabelle direkt in der App mit Testdaten oder vorhandenen Beispieldaten.

### 12.2 PDF-Vorschau

Nutzen des vorhandenen Vorschau-Drucks.

Keine neue PDF-Engine bauen.
Keine zweite Druckstrecke bauen.

Die PDF-Vorschau soll Layoutwerte aus dem Tabelleneditor temporär testen koennen, bevor sie dauerhaft gespeichert werden.

---

## 13. Warnungen und Schutz

Der Editor soll spaeter klare Warnungen geben, z.B.:

- Tabelle ist breiter als der verfuegbare Druckbereich.
- Spalte ist sehr schmal.
- Schrift ist sehr klein.
- Querformat passt besser als Hochformat.
- Lange Texte koennen umbrechen oder abgeschnitten werden.

---

## 14. Seitenumbrueche

Seitenumbrueche sind ein wichtiges spaeteres Thema.

Zu klaeren:

- Kopfzeile auf Folgeseiten wiederholen
- Zeilen nicht halb abschneiden
- lange Texte sauber umbrechen
- Tabellen ueber mehrere Seiten stabil drucken

Nicht alles muss in Version 1 geloest sein, aber das Thema darf nicht vergessen werden.

---

## 15. Umsetzungsphasen

### Phase 1 – Bestandsaufnahme

- relevante Protokoll-Tabellen finden
- UI-Darstellung finden
- PDF-Darstellung finden
- Vorschau-Druck-Anbindung pruefen
- geeignete Pilot-Tabelle festlegen

### Phase 2 – Tabellen-Layout-Service

- Service-Struktur anlegen
- Standardlayout laden
- Layout speichern
- Layout zuruecksetzen
- IPC-Anbindung erstellen

### Phase 3 – Pilot-Tabelle anschliessen

- eine Protokoll-Tabelle registrieren
- bestehendes Layout als Standard uebernehmen
- keine weiteren Tabellen anfassen

### Phase 4 – Tabelleneditor-UI

- interne Editor-Ansicht bauen
- Layoutwerte bearbeiten
- UI-Vorschau anzeigen

### Phase 5 – PDF-Vorschau

- vorhandenen Vorschau-Druck mit Layoutwerten nutzen
- Hochformat/Querformat testbar machen

### Phase 6 – Erweiterung

- weitere Protokoll-Tabellen anschliessen
- neues Modul Restarbeiten nach gleichem Muster anbinden

### Phase 7 – Seitenkopfeditor vorbereiten/umsetzen

- internen Platz im Layout-Bereich schaffen
- Hochformat-/Querformat-Seitenkopfvarianten konzeptionell trennen
- erst dann bestehende Seitenkoepfe gezielt bearbeitbar machen

---

## 16. Harte Regeln fuer spaetere Umsetzung

- Bestehenden Druckweg nicht verdoppeln.
- Bestehenden Vorschau-Druck weiterverwenden.
- A4-Rahmen mit Header, Fullheader, Miniheader, Footer, Seite 1 und Seite 2 in der ersten Ausbaustufe nicht umbauen.
- Erst eine Protokoll-Tabelle als Pilot.
- Keine Massenaenderungen.
- Keine Nebenschauplaetze.
- UI-Tech-Contract lesen und einhalten.
- Tabelleneditor ist internes Werkzeug, nicht Endnutzerfunktion.
- Hochformat und Querformat von Anfang an als Layoutvarianten mitdenken.
- Seitenkopfeditor architektonisch vorsehen, aber nicht unkontrolliert mit Version 1 vermischen.

---

## 17. Entscheidung Stand heute

Die Richtung ist bestaetigt.

Umsetzung soll in diese Richtung gehen:

1. Eigene Projektdokumentation fuer den Tabelleneditor.
2. Tabellen-Layout-Service als internes Hilfsmodul.
3. Protokoll-Modul als Pilot.
4. Vorhandener Vorschau-Druck bleibt Grundlage.
5. Hochformat und Querformat muessen beruecksichtigt werden.
6. Seitenkopfeditor bekommt spaeter einen eigenen Platz im internen Layout-Bereich.
7. Neue Fachmodule wie Restarbeiten registrieren ihre Tabellen beim Service und nutzen danach den Tabelleneditor fuer Feintuning.
