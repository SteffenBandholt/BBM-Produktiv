# Tabelleneditor – Erste Bestandsaufnahme Tabellen- und Spaltenlogik

Status: erste fachliche/technische Aufnahme  
Stand: 2026-05-08  
Bezug: `docs/table-layout-service.md`, `docs/table-layout-audit-plan.md`, `docs/UI-TECH-CONTRACT.md`

---

## 1. Ziel dieser Aufnahme

Diese Datei ist der erste konkrete Audit-Bericht vor der Umsetzung des Tabelleneditors.

Ziel ist nicht, direkt Code zu bauen.

Ziel ist zuerst die Entscheidung:

- Was passt bereits?
- Was muss angepasst werden?
- Was sollte nicht weiter verkompliziert, sondern im Zuge des Tabelleneditors sauber neu gebaut werden?

---

## 2. Bisher untersuchte Bereiche

Erste Sichtung betrifft:

- Protokoll-Modul im Renderer
- TOP-Liste in der UI
- V2-PDF-Druck
- PrintShell
- print.css
- v2.css
- V2-Layout-Konfiguration
- vorhandene Druck-/Vorschau-Struktur

Noch nicht vollständig untersucht:

- alle alten Views außerhalb des Protokoll-Moduls
- alle Modals für Teilnehmer/Kandidaten
- Datenbank-Migration für Tabellenlayouts
- komplette Seitenumbruchlogik
- echte PDF-Ausgaben aus lokalen Testdaten

---

## 3. Erste Kernerkenntnis

Die vorhandene Spaltenlogik ist fachlich teilweise brauchbar, technisch aber verstreut.

Es gibt nicht eine zentrale Tabellenbeschreibung, sondern mehrere Stellen:

- UI-Render-Code
- UI-CSS
- PDF-Render-Code
- PDF-CSS
- V2-Layout-Konfiguration
- teilweise Mess-/Paginationslogik

Das erklärt, warum Feintuning bisher mühsam ist.

Der Tabelleneditor darf daher nicht einfach oben drauf gesetzt werden.

Vorher muss mindestens für die Pilot-Tabelle eine zentrale Layoutbeschreibung entstehen.

---

## 4. Technische Fundstellen

### 4.1 Protokoll-Modul Einstieg

Relevante Datei:

- `src/renderer/modules/protokoll/index.js`

Das Protokoll-Modul ist als eigenes Modul vorhanden. Dort wird das Modul `protokoll` mit dem Screen `TopsScreen` verdrahtet.

Bewertung:

- gut als fachlicher Modulanker
- geeignet für Pilot
- nicht alles liegt sauber im Modul, aber der Einstieg ist klar

---

### 4.2 UI: TOP-Liste

Relevante Dateien:

- `src/renderer/modules/protokoll/screens/TopsScreen.js`
- `src/renderer/modules/protokoll/TopsList.js`
- `src/renderer/modules/protokoll/styles/tops.css`

Die UI-TOP-Liste ist keine klassische HTML-Tabelle, sondern eine Listen-/Grid-Darstellung.

Technisch sichtbar:

- `TopsList.js` baut eine `ul` mit `li`-Zeilen.
- Jede Zeile bekommt drei Hauptbereiche: Nummer, Text, Meta.
- `tops.css` definiert die Spalten über CSS Grid.
- Wichtige Breiten liegen als CSS-Variablen oder feste Werte im CSS.

Auffällig:

- UI und PDF haben ähnliche fachliche Spalten, aber unterschiedliche technische Umsetzung.
- UI nutzt Pixel/Grid.
- PDF nutzt Tabelle/mm/ch.
- Dadurch gibt es keine gemeinsame Spaltendefinition.

Fachliche Spalten der UI-TOP-Liste:

- TOP-Nummer
- Kurztext / Gegenstand
- optional Langtext
- Status
- Fertig bis
- verantwortlich
- Ampel / Symbol

---

### 4.3 PDF: PrintShell

Relevante Datei:

- `src/renderer/print/layout/PrintShell.js`

Die PrintShell baut Tabellen für den V2-Druck.

Technisch sichtbar:

- `_buildTableHead(type)` erzeugt Tabellenköpfe je Tabellentyp.
- `_buildTopRow(row)` erzeugt TOP-Zeilen.
- `_buildGenericRow(row)` erzeugt ToDo-, Firmen- und generische Zeilen.
- `_buildColGroup(type)` gibt für TOPs ein Colgroup aus.
- `_buildIntro(page)` baut die Teilnehmerliste als eigene Tabelle.

Auffällig:

- Tabellenköpfe sind hart im Render-Code hinterlegt.
- TOP-Spalten werden im Code als `colNr`, `colText`, `colMeta` erzeugt.
- Teilnehmer-Spalten werden ebenfalls direkt im Code erzeugt.
- ToDo- und Firmenlisten haben eigene Pfade.

Bewertung:

- fachlich nachvollziehbar
- technisch zu wenig zentral für einen Tabelleneditor
- für Pilot geeignet, aber vorher bereinigen/anpassen

---

### 4.4 PDF: print.css

Relevante Datei:

- `src/renderer/print/print.css`

Dort liegen viele feste Tabellenregeln.

Beispiele:

- `.topsTable`
- `.firmsTable`
- `.firmsCardsTable`
- `.todoTable`
- `.topsTable .colNr`
- `.topsTable .colMeta`
- `.todoTable th:nth-child(...)`
- `.firmsTable th:nth-child(...)`

Auffällig:

- Spaltenbreiten sind teilweise direkt im CSS verdrahtet.
- Teilweise wird mit mm gearbeitet.
- Teilweise wird mit Prozenten gearbeitet.
- Teilweise wird mit ch gearbeitet.
- Das ist für einen Editor schwer sauber steuerbar.

Bewertung:

- vorhandene Werte können als Startlayout dienen
- aber die Steuerung muss aus CSS-Festwerten herausgelöst werden

---

### 4.5 PDF: v2.css

Relevante Datei:

- `src/renderer/print/v2/v2.css`

Dort liegen V2-Kopfbereiche und Teilnehmerlisten-Regeln.

Beispiele:

- `.v2ParticipantsTable`
- `.v2PartColName`
- `.v2PartColRole`
- `.v2PartColFirm`
- `.v2PartColContact`
- `.v2PartColMarks`
- `.v2GlobalHeader`
- `.v2HeaderFull`
- `.v2HeaderMini`

Auffällig:

- V2-Seitenkopf ist bereits strukturiert.
- Teilnehmerliste hat feste Breiten in mm.
- Kopfbereiche und Tabellenbreite hängen zusammen.
- Querformat ist noch nicht als sauberer Layoutpfad sichtbar.

Bewertung:

- V2-Druck ist geeignete Basis
- Seitenkopfeditor muss später hier anschließen
- Tabelleneditor darf V2-Köpfe nicht unkontrolliert verändern

---

### 4.6 V2-Layout-Konfiguration

Relevante Datei:

- `src/renderer/print/v2/v2LayoutConfig.js`

Dort sind Grundwerte für Seite, GlobalHeader, FullHeader und MiniHeader hinterlegt.

Auffällig:

- Headerwerte sind bereits zentraler als Tabellenwerte.
- Das ist ein guter Ansatz für den späteren Seitenkopfeditor.
- Tabellenwerte sind dagegen noch nicht vergleichbar zentral.

Bewertung:

- für Seitenkopfeditor später guter Ansatzpunkt
- für Tabelleneditor noch kein ausreichender Tabellen-Anker

---

## 5. Erste Entscheidungsmatrix

| Bereich / Tabelle | Fachlicher Stand | Technischer Stand | Entscheidung | Begründung |
|---|---|---|---|---|
| Protokoll TOP-Liste UI | passend | eigene Listen-/Grid-Logik, nicht zentral mit PDF verbunden | B - anpassen | fachlich guter Pilot, aber Layoutwerte müssen zentralisiert werden |
| Protokoll TOP-Tabelle PDF | passend | Render-Code + CSS hart verdrahtet | B - anpassen | fachlich brauchbar, aber Spaltenlogik liegt verstreut |
| Teilnehmerliste PDF | vermutlich passend | eigene Tabelle in PrintShell + feste Breiten in v2.css | B - später anpassen | nicht Pilot, aber klarer Kandidat für späteren Tabellenservice |
| ToDo-Liste PDF | vermutlich passend | generische Rows + nth-child CSS-Breiten | B oder C offen | erst genauer prüfen, ob fachlich eigenständige Tabelle oder Ableitung aus TOPs |
| Firmenliste PDF | teilweise Sonderfall | Tabellen- und Kartenlayout gemischt | C für Editor-v1 ausklammern | keine normale Tabelle, sollte nicht erster Pilot sein |
| V2-Seitenköpfe | fachlich vorhanden | relativ klar strukturiert über V2-Komponenten und Config | behalten, später Seitenkopfeditor | nicht mit Tabelleneditor-v1 vermischen |
| Hochformat/Querformat | fachlich notwendig | aktuell noch nicht sauber als Layoutvariante sichtbar | B - vorbereiten | muss in den Layout-Service, aber nicht blind in alle Druckpfade eingreifen |

---

## 6. Empfehlung Pilot

Pilot soll die Protokoll TOP-Liste sein.

Aber nicht mit Entscheidung A „behalten“, sondern mit Entscheidung B „anpassen“.

Begründung:

- fachlich zentral für das Protokoll
- in UI und PDF bereits vorhanden
- Nutzer sieht die Tabelle direkt
- Vorschau-Druck kann genutzt werden
- vorhandene Struktur ist nahe genug dran
- aber Spaltenlogik ist nicht zentral genug

Pilot-Ziel:

> Eine zentrale Tabellenbeschreibung für die Protokoll-TOP-Liste schaffen, ohne den ganzen Druck neu zu bauen.

---

## 7. Was beim Pilot NICHT passieren darf

- keine komplette Neuentwicklung des Druckmoduls
- keine zweite PDF-Engine
- keine Veränderung aller Tabellen gleichzeitig
- keine Header-/Footer-Umbauten
- keine unkontrollierte Querformat-Umstellung
- keine globale CSS-Reparatur quer durchs Repo

---

## 8. Was beim Pilot passieren sollte

### Schritt 1

Fachliche Definition der Pilot-Tabelle festlegen.

Möglicher technischer Tabellenname:

- `protokoll_tops`

Fachliche Spalten:

- TOP
- Gegenstand / Kurztext
- Langtext, falls sichtbar
- Status
- Fertig bis
- Verantwortlich
- Ampel/Symbol

### Schritt 2

Vorhandene UI-/PDF-Werte als Startlayout dokumentieren.

Beispiel:

- UI Nummernspalte derzeit Pixel/Grid
- PDF Nummernspalte derzeit mm
- PDF Meta-Spalte derzeit ch
- Textspalte derzeit Restbreite

### Schritt 3

Kleine zentrale Layoutbeschreibung erstellen.

Noch kein großer Editor.

Erst Ziel:

- eine Datei/ein Service liefert Spaltennamen und Breiten
- UI und PDF können daraus lesen
- vorhandenes Layout bleibt optisch möglichst gleich

### Schritt 4

Danach erst Editor-UI bauen.

---

## 9. Erste Architektur-Empfehlung

Nicht sofort Datenbank und Editor bauen.

Zuerst eine kleine interne Layoutdefinition für `protokoll_tops` erstellen.

Beispielhafte Richtung:

```text
protokoll_tops
  orientation: portrait
  columns:
    - key: topNumber
      label: TOP
      uiWidth: 64px
      pdfWidth: 23mm
    - key: text
      label: Gegenstand
      uiWidth: auto
      pdfWidth: auto
    - key: meta
      label: Status / Fertig bis / verantw
      uiWidth: 74px
      pdfWidth: 15ch