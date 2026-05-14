# Tabellenlayout-Firms Scope

## 1. Ausgangslage

Der Pilot `protokoll_tops` ist bereits als zentraler Tabellenlayout-Kandidat umgesetzt.
Fuer den naechsten Schritt soll im Firmen-/Personenbereich eine konkrete, begrenzte Tabelle festgelegt werden, die fachlich klar, technisch handhabbar und spaeter mit dem bestehenden Tabellenlayout-System steuerbar ist.

Diese Doku ist eine reine Bestandsaufnahme und trifft noch keine Implementierungsentscheidung im Code.

## 2. Gefundene Firmen-/Personentabellen

### 2.1 `FirmsView.js`

Fundstelle:

- `src/renderer/views/FirmsView.js`

Tabelle(n):

- Firmenliste im Stamm/Firmenbereich
- Personenliste zur ausgewählten Firma

### 2.2 `FirmsPoolView.js`

Fundstelle:

- `src/renderer/views/FirmsPoolView.js`

Tabelle(n):

- Projektbezogene Firmenliste
- Personenliste zur gewaehlten Firma im Projektkontext

### 2.3 `ProjectFirmsView.js`

Fundstelle:

- `src/renderer/views/ProjectFirmsView.js`

Tabelle(n):

- Projektfirmenliste links
- Personenliste rechts
- globale Zuordnungslisten im Modal

### 2.4 Druckweg

Fundstellen:

- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/print.css`
- `src/renderer/modules/ausgabe/PrintModal.js`

Tabelle(n):

- Firmenliste im Druckweg
- Teilnehmerliste im Druckweg
- ToDo-Liste im Druckweg

Diese Drucktabellen sind fachlich relevant, aber fuer den naechsten Pilot nur dann sinnvoll, wenn die dazugehoerige UI-Tabelle sauber feststeht.

## 3. Bewertung je konkreter Liste

### 3.1 Firmenliste im globalen Stamm

Datei/Fundstelle:

- `src/renderer/views/FirmsView.js`

Zweck:

- Stammdatenliste aller Firmen

Aktuelle Spalten:

- `Name`
- `Kurzbez.`

Aktuelle Layouttechnik:

- echte HTML-Tabelle
- `width: 100%`
- `borderCollapse: collapse`
- Tabellenkopf und Body im Renderer direkt gebaut

UI/PDF-Bezug:

- UI: ja
- PDF: nur indirekt, kein sauberer 1:1-Druckpilot

Risiko:

- gering bis mittel
- recht kompakt, aber eher Stammdaten-/Verwaltungsbereich

Empfehlung:

- spaeter geeignet

### 3.2 Personenliste in `FirmsView.js`

Datei/Fundstelle:

- `src/renderer/views/FirmsView.js`

Zweck:

- Personen zu einer ausgewählten Firma

Aktuelle Spalten:

- `Aktiv`
- `Name`
- `Funktion/Rolle`
- `E-Mail`
- `Telefon`

Aktuelle Layouttechnik:

- echte HTML-Tabelle
- klar strukturierte Tabellenkopfe
- abhängiger Detailbereich zur ausgewählten Firma

UI/PDF-Bezug:

- UI: ja
- PDF: nur indirekt

Risiko:

- mittel
- staerker an Auswahlzustand und Bearbeitungslogik gebunden

Empfehlung:

- spaeter geeignet

### 3.3 Projekt-Firmenliste in `ProjectFirmsView.js`

Datei/Fundstelle:

- `src/renderer/views/ProjectFirmsView.js`

Zweck:

- Firmen, die einem Projekt zugeordnet oder dort verwaltet werden

Aktuelle Spalten:

- `Kurzbez.`
- `Funktion/Gewerk`
- `Aktiv`

Aktuelle Layouttechnik:

- echte HTML-Tabelle
- kompakter dreispaltiger Aufbau
- direkt im Projektbereich gerendert

UI/PDF-Bezug:

- UI: ja
- PDF: ja, weil der Firmen-Druckweg fachlich am naechsten an dieser Struktur liegt

Risiko:

- mittel
- Projektkontext ist vorhanden, aber die Tabelle selbst ist klar abgegrenzt
- laesst sich mit Testdaten gut darstellen

Empfehlung:

- geeignet als naechster Pilot

### 3.4 Personenliste in `ProjectFirmsView.js`

Datei/Fundstelle:

- `src/renderer/views/ProjectFirmsView.js`

Zweck:

- Personen zur gewaehlten Projektfirma

Aktuelle Spalten:

- `Aktiv`
- `Name`
- `Funktion/Rolle`
- `E-Mail`
- `Telefon`

Aktuelle Layouttechnik:

- echte HTML-Tabelle
- staerker mit Projektfirma, Kandidaten und Zuordnungen verzahnt

UI/PDF-Bezug:

- UI: ja
- PDF: eher spaeter

Risiko:

- mittel bis hoch
- staerker an Auswahl- und Save-Logik gebunden als die Projekt-Firmenliste

Empfehlung:

- spaeter geeignet

### 3.5 Firmenliste im Projekt-Pool `FirmsPoolView.js`

Datei/Fundstelle:

- `src/renderer/views/FirmsPoolView.js`

Zweck:

- Firmenauswahl und Personenanzeige im Projekt-Zuordnungsfluss

Aktuelle Spalten:

- `Kurzbez.`
- `Funktion/Gewerk`
- `Aktiv`

Aktuelle Layouttechnik:

- echte HTML-Tabelle
- Teil einer Dual-List-/Zuordnungsoberflaeche

UI/PDF-Bezug:

- UI: ja
- PDF: nur indirekt

Risiko:

- hoch
- stark an Projektkontext, Auswahlzustand und Zuordnungslogik gebunden

Empfehlung:

- nicht als erster Firmenlayout-Pilot

### 3.6 Firmen-/Personenanteile im Druckweg

Datei/Fundstelle:

- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/print.css`
- `src/renderer/modules/ausgabe/PrintModal.js`

Zweck:

- Druck von Firmen-, Teilnehmer- und ToDo-Tabellen

Aktuelle Spalten:

- Firmenliste: `Firma`, `Typ`, `Aktiv`
- ToDo-Liste: `TOP`, `Kurztext`, `Status`, `Fertig bis`, `Ampel`
- Teilnehmerliste: mehrere Spalten mit Name, Rolle, Anwesenheit und Markierungen

Aktuelle Layouttechnik:

- feste Drucktabellen mit hardcodierten Spaltenbreiten
- PDF-seitig teilweise eigene CSS- und Renderpfade

UI/PDF-Bezug:

- PDF: ja
- UI: nur mittelbar oder gar nicht

Risiko:

- mittel bis hoch
- als alleiniger Einstieg zu print-lastig und weniger klar als Tabellenpilot

Empfehlung:

- spaeter geeignet, nicht als erster Firmen-Pilot

## 4. Empfohlene erste Tabelle

Empfohlen als naechster konkreter Pilot ist:

- **`project_firms`**

Gemeint ist die **Projekt-Firmenliste in `ProjectFirmsView.js`** mit den Spalten:

- `Kurzbez.`
- `Funktion/Gewerk`
- `Aktiv`

Warum genau diese Tabelle:

- sie ist eine echte, klar abgegrenzte Tabelle
- die Spaltenstruktur ist klein und stabil
- sie ist fachlich relevant, aber nicht so breit wie die grossen Verwaltungslisten
- sie laesst sich mit registrierten Testdaten gut darstellen
- sie passt zum bestehenden Registry-/Editor-Modell
- der spaetere Anschluss an den Firmen-Druckweg ist fachlich naheliegend

## 5. Warum nicht die anderen zuerst

### Nicht zuerst `firms_master`

- zwar sehr klare Tabelle
- aber eher Stammdatenbereich als die fachlich naechste Projekt-Firmenstruktur
- der PDF-Bezug ist schwächer

### Nicht zuerst `firms_pool`

- zu stark mit Projektzuordnung, Kandidaten und Mehrfachaktionen verbunden
- hoehere Gefahr, dass man neben der Tabellenlayoutfrage zugleich den Auswahlfluss mitanfasst

### Nicht zuerst die Personenlisten

- technisch zwar Tabellen
- aber enger an Auswahlzustand, Formularlogik und Abhaengigkeiten gebunden
- fuer einen zweiten Pilot unnoetig komplex

### Nicht zuerst Drucktabellen

- fuer sich fachlich relevant
- aber als naechster Pilot weniger stabil, weil sie kein klarer UI-Einstiegspunkt sind

## 6. Vorgeschlagener Registry-Key

Empfohlener Registry-Key:

- `project_firms`

Begruendung:

- entspricht dem fachlichen Aufbau der Tabelle
- ist klar vom globalen Firmenstamm abgrenzbar
- deckt die konkrete Projekt-Firmenliste besser ab als ein generischer Firmenname

Falls spaeter eine weitere Trennung gebraucht wird, koennen `firms_master` und `project_firms_persons` als getrennte Folgeeintraege folgen.

## 7. Grober Umsetzungsplan

1. `project_firms` als naechste konkrete Tabelle festlegen.
2. Die Registry um genau diese eine Tabelle erweitern.
3. Ueber den bestehenden Tabellenlayout-Editor nur diese Tabelle in den Kandidaten aufnehmen.
4. Registrierte Beispielzeilen fuer die Projekt-Firmenliste anlegen.
5. UI-Anschluss und spaeteren PDF-Anschluss getrennt pruefen.
6. Erst danach Personenlisten oder weitere Firmenlisten anschauen.

Der naechste Code-Schritt sollte klein bleiben und nur die eine Projekt-Firmenliste betreffen.
