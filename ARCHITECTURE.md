# ARCHITECTURE.md

## Zweck

Diese Datei beschreibt die aktuelle Zielrichtung der Weiterentwicklung.

Die App bleibt grundsätzlich eine gewachsene Electron-Anwendung.
Große globale Umbauten bleiben weiterhin die Ausnahme.

Es gibt jedoch einen bewusst freigegebenen Sonderfall:

## TopsView als zentraler Arbeitsbildschirm

Die `TopsView` ist das Herz der Protokollerstellung.
Sie wird nicht mehr nur schrittweise „modernisiert“, sondern gezielt als einzelner Arbeitsbildschirm neu zusammengesetzt.

Das ist kein Komplettumbau der ganzen App.
Es ist ein fokussierter Neuaufbau genau dieser einen Seite.

---

## Ausgangslage

Die aktuelle Anwendung ist eine Electron-App mit klassischem Renderer-Aufbau und stark DOM-zentrierter UI-Logik.

Bekannte Struktur:

- `src/main/`
  Electron-Main-Prozess und Preload

- `src/main/preload.js`
  Bridge zwischen Renderer und Electron-/IPC-Funktionen

- `src/renderer/main.js`
  Aufbau der Renderer-App-Shell

- `src/renderer/app/Router.js`
  Navigation, Kontextverwaltung, View-Wechsel

- `src/renderer/views/`
  Seitenlogik als Klassen

- `src/renderer/ui/`
  UI-Bausteine, Modals, Popups, Hilfslogik

- `src/renderer/features/`
  Fachliche Teilfunktionen

Diese Struktur bleibt außerhalb der TopsView grundsätzlich respektiert.

---

## Allgemeine Architekturprinzipien

1. Arbeitsfluss vor Technik
2. Bestehende fachliche Logik nur ändern, wenn nötig
3. Infrastruktur nur ändern, wenn es der Aufgabe wirklich dient
4. Keine globalen Umbauten ohne klaren Nutzen
5. Keine Dashboard-Logik für echte Arbeitsbildschirme
6. Sichtbare Klarheit ist wichtiger als abstrakte technische Schönheit

---

## Sonderregel TopsView

Für die TopsView gilt ausdrücklich:

- Sie darf neu aufgebaut werden.
- Sie darf als eigener Arbeitsbildschirm separat behandelt werden.
- Ziel ist nicht React um jeden Preis.
- Ziel ist ein klarer, ruhiger, fachlich starker Protokoll-Arbeitsplatz.
- Bewährte fachliche Regeln der bisherigen TopsView werden übernommen.
- Sichtbarer Ballast wird entfernt.

Das ist eine Sonderregel nur für TopsView.
Sie gilt nicht automatisch für andere Bereiche der App.

---

## Zielbild der TopsView

Die neue TopsView besteht aus drei sichtbaren Hauptbereichen plus Read-only-Verhalten.

### 1. Steuerleiste oben
Sie betrifft immer das ganze Protokoll.

Inhalt:
- Protokollnummer
- Datum
- Schlagwort
- Teilnehmer
- PDF-Vorschau
- Langtext an/aus
- Protokoll beenden
- Schließen
- Beenden-Symbol
- Quicklane:
  - Projekt
  - Firmen
  - Ausgabe

### 2. Protokollblatt in der Mitte
Es ist der Haupt-Lese- und Auswahlbereich.

Inhalt:
- TOP-Nummerierung
- Farben/Zustände
- Hierarchie
- Titel
- optional Langtext
- Status, Termin, Verantwortliche
- Auswahl

Nicht dort hinein:
- kein fixer Protokollkopf
- keine Teilnehmerliste
- keine allgemeine Navigation

### 3. Editbox unten
Sie ist die Werkbank für den ausgewählten TOP.

Inhalt:
- Kurztext
- Langtext
- Metaspalte
- Speichern
- Löschen oder vorübergehend Papierkorb
- + Titel
- + TOP
- Schieben
- Diktat direkt an Kurztext/Langtext

### 4. Read-only
Bei alten Protokollen:
- keine Editbox
- mehr Lesefläche
- Fokus auf Lesen und Vorschau

---

## Verbotene Muster für TopsView

In der TopsView vermeiden:

- Sidebar
- leerer allgemeiner Header
- Dashboard-Kacheln
- modulare Hauptnavigation während des Arbeitens
- globaler Diktat-Button mit Zielwahl
- zusätzlicher Protokollkopf im Blatt
- unnötige visuelle Füllflächen

---

## Erlaubte Architektur für TopsView

Die neue TopsView darf aus mehreren klaren Bildschirm-Bausteinen zusammengesetzt werden, zum Beispiel:

- Steuerleiste
- TOP-Blatt
- Editbox
- Read-only-Variante
- Quicklane

Wichtig ist nicht das Framework, sondern die klare Trennung der sichtbaren Aufgaben.

---

## Leitlinie für die Umsetzung

Alles, was den einzelnen TOP betrifft, gehört in die Editbox.

Alles, was das ganze Protokoll betrifft, gehört in die obere Steuerleiste.

Alles, was gelesen und ausgewählt wird, gehört ins Protokollblatt.

---

## Reihenfolge des TopsView-Neuaufbaus

1. Leere TopsView-Hülle
2. Protokollblatt
3. Editbox mit Metaspalte
4. Steuerleiste und Quicklane
5. Read-only-Verhalten

Diese Reihenfolge ist verbindlich sinnvoller als wahlloses Umbauen am alten Bildschirm.

---

## Außerhalb der TopsView

Für andere Teile der App bleibt die allgemeine vorsichtige Weiterentwicklung gültig:

- kleine Änderungen
- keine unnötigen Router-Umbauten
- keine globale Shell-Neuordnung ohne Bedarf
- keine neue Architekturkomplexität ohne klaren Gewinn

---

## Entscheidungskriterien

Wenn mehrere Wege möglich sind, ist zu bevorzugen:

1. der Weg mit dem klareren Arbeitsbildschirm
2. der Weg mit weniger sichtbarem Ballast
3. der Weg mit weniger zusätzlicher Navigation
4. der Weg mit geringerem globalen Risiko
5. der Weg, der bestehendes gutes Fachverhalten erhält

---

## Schlussregel

Das Ziel ist nicht, möglichst schnell „alles in React“ zu haben.

Das Ziel ist:
- ein starker Protokoll-Arbeitsbildschirm
- weniger Ballast
- weniger Kopplung
- klare sichtbare Bereiche
- stabile App außerhalb dieses Sonderumbaus