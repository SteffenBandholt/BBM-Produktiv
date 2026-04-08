# ARCHITECTURE.md

## Zweck

Diese Datei beschreibt die Architektur des Protokoll-Arbeitsbildschirms und des Protokollmoduls im laufenden Produktivrepo.

Sie ist keine allgemeine Gesamtarchitektur-Datei der ganzen App.
Die führenden Leitplanken für das Gesamtzielbild stehen in `docs/ARCHITEKTUR-LEITPLANKEN.md`.

## Einordnung in das Gesamtzielbild

Das Protokoll ist fachlich ein zentraler Arbeitsbereich der aktuellen Produktivphase.
Architektonisch bleibt es dennoch ein Fachmodul unter mehreren.

`TopsScreen` ist der Arbeitsbildschirm dieses Protokollmoduls.
Er ist nicht als neues Zentrum der gesamten App zu verstehen.

## Aktueller Fokus

Die App bleibt grundsätzlich eine gewachsene Electron-Anwendung.
Große globale Umbauten bleiben weiterhin die Ausnahme.

Es gibt jedoch einen bewusst freigegebenen Sonderfall:

## Protokoll-Arbeitsbildschirm als Sonderpfad

`TopsView` wird schrittweise durch `TopsScreen` abgelöst.

`TopsScreen` wird nicht nur kosmetisch modernisiert, sondern gezielt als einzelner Arbeitsbildschirm des Protokollmoduls neu zusammengesetzt.

Das ist kein Komplettumbau der ganzen App.
Es ist ein fokussierter Neuaufbau genau dieses einen fachlichen Bildschirms.

## Ausgangslage

Die aktuelle Anwendung ist eine Electron-App mit klassischem Renderer-Aufbau und stark DOM-zentrierter UI-Logik.

Bekannte Struktur:

- `src/main/`
- `src/main/preload.js`
- `src/renderer/main.js`
- `src/renderer/app/Router.js`
- `src/renderer/views/`
- `src/renderer/ui/`
- `src/renderer/features/`

Diese Struktur bleibt außerhalb des Protokoll-Arbeitsbildschirms grundsätzlich respektiert.

## Allgemeine Prinzipien für diesen Bildschirm

1. Arbeitsfluss vor Technik
2. Bestehende fachliche Logik nur ändern, wenn nötig
3. Infrastruktur nur ändern, wenn es der Aufgabe wirklich dient
4. Keine globalen Umbauten ohne klaren Nutzen
5. Keine Dashboard-Logik für echte Arbeitsbildschirme
6. Sichtbare Klarheit ist wichtiger als abstrakte technische Schönheit

## Sonderregel für das Protokollmodul

Für den Protokoll-Arbeitsbildschirm gilt ausdrücklich:

- Er darf gezielt neu aufgebaut werden.
- Er darf als eigener Arbeitsbildschirm separat behandelt werden.
- Ziel ist nicht Technik um der Technik willen.
- Ziel ist ein klarer, ruhiger, fachlich starker Protokoll-Arbeitsplatz.
- Bewährte fachliche Regeln der bisherigen `TopsView` werden übernommen.
- Sichtbarer Ballast wird entfernt.

Das ist eine Sonderregel für diesen Arbeitsbildschirm des Protokollmoduls.
Sie gilt nicht automatisch für andere Bereiche der App.

## Zielbild des Protokoll-Arbeitsbildschirms

Der neue Arbeitsbildschirm des Protokollmoduls besteht aus drei sichtbaren Hauptbereichen plus Read-only-Verhalten.

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
- Farben und Zustände
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
- Diktat direkt an Kurztext und Langtext

### 4. Read-only

Bei alten Protokollen:

- keine Editbox
- mehr Lesefläche
- Fokus auf Lesen und Vorschau

## Verbotene Muster

Im Protokoll-Arbeitsbildschirm vermeiden:

- Sidebar
- leerer allgemeiner Header
- Dashboard-Kacheln
- modulare Hauptnavigation während des Arbeitens
- globaler Diktat-Button mit Zielwahl
- zusätzlicher Protokollkopf im Blatt
- unnötige visuelle Füllflächen

## Erlaubte Bildschirmarchitektur

Der Protokoll-Arbeitsbildschirm darf aus mehreren klaren Bildschirm-Bausteinen zusammengesetzt werden, zum Beispiel:

- Steuerleiste
- TOP-Blatt
- Editbox
- Read-only-Variante
- Quicklane

Wichtig ist nicht das Framework, sondern die klare Trennung der sichtbaren Aufgaben.

## Leitlinie für die Umsetzung

Alles, was den einzelnen TOP betrifft, gehört in die Editbox.

Alles, was das ganze Protokoll betrifft, gehört in die obere Steuerleiste.

Alles, was gelesen und ausgewählt wird, gehört ins Protokollblatt.

## Reihenfolge des Neuaufbaus

1. Leere `TopsScreen`-Hülle
2. Protokollblatt
3. Editbox mit Metaspalte
4. Steuerleiste und Quicklane
5. Read-only-Verhalten

Diese Reihenfolge ist verbindlich sinnvoller als weiteres wahlloses Umbauen am alten Bildschirm.

## Außerhalb des Protokoll-Arbeitsbildschirms

Für andere Teile der App bleibt die allgemeine vorsichtige Weiterentwicklung gültig:

- kleine Änderungen
- keine unnötigen Router-Umbauten
- keine globale Shell-Neuordnung ohne Bedarf
- keine neue Architekturkomplexität ohne klaren Gewinn

## Entscheidungskriterien

Wenn mehrere Wege möglich sind, ist zu bevorzugen:

1. der Weg mit dem klareren Arbeitsbildschirm
2. der Weg mit weniger sichtbarem Ballast
3. der Weg mit weniger zusätzlicher Navigation
4. der Weg mit geringerem globalen Risiko
5. der Weg, der bestehendes gutes Fachverhalten erhält

## Schlussregel

Das Ziel ist nicht, möglichst schnell alles in eine neue Technik zu übertragen.

Das Ziel ist:

- ein starker Protokoll-Arbeitsbildschirm
- weniger Ballast
- weniger Kopplung
- klare sichtbare Bereiche
- stabile App außerhalb dieses Sonderumbaus
