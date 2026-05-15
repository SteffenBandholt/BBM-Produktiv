# Tabellenlayout-Nachstkandidat Audit

## 1. Ausgangslage

Der Pilot `protokoll_tops` ist bereits als zentral beschreibbares Tabellenlayout im Repo verankert.
Der Editor, der Resolver, die Protokoll-UI und der PDF-Druckweg kennen bereits die Trennung von `moduleId`, `tableKey` und `orientation`.

Diese Bestandsaufnahme sucht den naechsten sinnvollen Kandidaten, ohne etwas umzubauen.

## 2. Suchumfang

Untersucht wurden vor allem:

- Renderer-Module mit sichtbaren Tabellen oder listenartigen Tabellen
- Druckansichten im V2- und Legacy-Druckweg
- CSS-Dateien mit festen Tabellenbreiten, Grid- oder Table-Layouts
- vorhandene Fachlisten in Protokoll, Ausgabe und Verwaltung
- Kandidaten mit klarer Spaltenstruktur und moeglichst geringem Risiko fuer Navigation und Kopf-/Fusslogik

Nicht Ziel dieser Audit-Stufe:

- neue Tabellen registrieren
- neue Layout-Logik bauen
- Druckpfade umbauen
- Editor oder UI erweitern

## 3. Gefundene Kandidaten

### 3.1 Firmenlisten / Personenlisten

Fundstellen:

- `src/renderer/views/FirmsView.js`
- `src/renderer/views/FirmsPoolView.js`
- `src/renderer/views/ProjectFirmsView.js`
- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/print.css`
- `src/renderer/modules/ausgabe/PrintModal.js`

Kurzbeschreibung:

- In der Verwaltung gibt es echte Tabellen fuer Firmen und Personen.
- Im Druckweg existieren ebenfalls spezielle Tabellenpfade fuer Firmen.
- Die Spaltenstruktur ist klarer als bei vielen Projektlisten, aber die Darstellung ist teils gemischt mit Karten- und Formularanteilen.

### 3.2 ToDo-Liste / offene Aufgaben im Protokollkontext

Fundstellen:

- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/print.css`
- `src/renderer/modules/ausgabe/PrintModal.js`
- `src/renderer/modules/protokoll/topFilterMode.js`

Kurzbeschreibung:

- Die ToDo-Liste ist im Druckweg klar als Tabelle mit festen Spalten vorhanden.
- Sie ist fachlich sinnvoll, aber im Renderer weniger breit als eigenstaendige UI-Tabelle aufgestellt als die Firmenlisten.

### 3.3 Teilnehmerliste

Fundstellen:

- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/modules/ausgabe/PrintModal.js`
- `src/renderer/views/ProjectFirmsView.js`

Kurzbeschreibung:

- Die Teilnehmerliste ist fachlich vorhanden, aber eher als Druck- oder Begleitliste als als klarer Tabellen-Hauptbereich umgesetzt.
- Der Aufbau ist brauchbar, aber fuer den naechsten Pilot weniger klar getrennt als die Firmenlisten.

### 3.4 Projektlisten / Projektansichten

Fundstellen:

- `src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ArchiveScreen.js`

Kurzbeschreibung:

- Diese Bereiche sind stark auf Karten, Navigation und Verwaltungslogik ausgelegt.
- Sie sind fuer einen Tabellenlayout-Pilot zu breit und zu nah an der Kernnavigation.

### 3.5 Restarbeiten

Fundstellen:

- nur Plan-/Doku-Erwaehnungen, keine konkrete Implementierung im `src`-Baum

Kurzbeschreibung:

- Fachlich sinnvoll, aber aktuell noch nicht als bestehende Tabellenstruktur im Code vorhanden.
- Fuer diesen Schritt daher kein geeigneter naechster Pilot.

## 4. Bewertung je Kandidat

| Kandidat | Datei-/Bereichsbild | Fachlicher Zweck | UI relevant | PDF relevant | UI/PDF getrennte Werte sinnvoll | Risiko | Empfehlung |
|---|---|---|---|---|---|---|---|
| Firmenlisten / Personenlisten | echte Tabellen in Verwaltung und Druck | Firmen, Personen, Zustaendigkeiten | ja | ja | ja | mittel | geeignet als naechster Pilot |
| ToDo-Liste | Tabelle im Protokoll-Ausgabeweg | offene Aufgaben / Verantwortlich | teilweise | ja | ja | mittel | spaeter geeignet |
| Teilnehmerliste | Druck- und Begleitliste | Teilnehmerdarstellung | gering bis mittel | ja | ja | mittel | spaeter geeignet |
| Projektlisten | Karten-/Verwaltungsansicht | Projektuebersicht | teilweise | eher nein | eher nein | hoch | nicht geeignet |
| Restarbeiten | noch nicht implementiert | zukuenftiges Modul | noch offen | noch offen | ja, spaeter | sehr hoch | nicht geeignet fuer jetzt |

## 5. Empfehlung fuer Kandidat 2

Empfohlen als naechster Kandidat ist die **Firmenliste** bzw. der **Firmen-/Personenbereich**.

Begruendung:

- es gibt bereits echte Tabellen im Renderer und im Druckweg
- die Spalten sind klarer und stabiler als bei vielen Verwaltungsansichten
- das Risiko fuer Header/Footer und Kernnavigation ist begrenzt
- die Listen sind mit dem bestehenden Registry-/Editor-Modell gut vorstellbar
- Testdaten lassen sich fachlich plausibel abbilden

Wenn ein noch kleinerer Schritt gewuenscht ist, kann die ToDo-Liste als spaeterer, print-naher Kandidat folgen. Sie ist aber als naechster Pilot weniger gut als die Firmenliste, weil sie im UI nicht so klar als eigenstaendige Tabelle im Vordergrund steht.

## 6. Nicht empfohlene Kandidaten mit Begruendung

### Projektlisten

- zu nah an Navigation, Kartenstruktur und Verwaltungslogik
- fuer den naechsten Tabellenlayout-Pilot zu breit
- hoehere Gefahr fuer unbeabsichtigte Seiteneffekte

### Restarbeiten

- aktuell noch kein echter Code-Kandidat, sondern erst eine fachliche Zielrichtung
- zuerst muss das Modul selbst sauber vorhanden und registriert sein
- deshalb nicht der naechste Schritt

### Teilnehmerliste als erster Folgekandidat

- fachlich vorhanden, aber eher Begleit-/Druckliste
- weniger klar als eigenstaendige Tabellenoberflaeche als die Firmenlisten
- deshalb nachrangig gegenueber der Firmenliste

## 7. Empfohlener Umsetzungsplan fuer den naechsten Schritt

1. Firmenliste als neuen Pilot fachlich festziehen.
2. Die genaue Tabelle im Firmenbereich bestimmen, die zuerst layoutbar werden soll.
3. Registry-Eintrag nur fuer diese eine Tabelle anlegen.
4. Editor-/Vorschau-Daten mit klaren Beispielzeilen vorbereiten.
5. UI- und PDF-Anschluss getrennt pruefen.
6. Erst danach weitere Unterlisten oder Teilbereiche wie Personen oder ToDo evaluieren.

Der naechste Code-Schritt sollte klein bleiben und nur eine Firmen-Tabelle anfassen, nicht den ganzen Firmen- oder Projektbereich.
