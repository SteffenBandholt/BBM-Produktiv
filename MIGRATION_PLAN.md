
---

## `MIGRATION_PLAN.md`

```md
# MIGRATION_PLAN.md

## Ziel

Die bestehende Electron-/Vanilla-JS-Anwendung wird kontrolliert weiterentwickelt.

Die allgemeine App bleibt vorsichtig und schrittweise veränderbar.
Es gibt jedoch einen freigegebenen Sonderpfad:

## TopsView-Sonderumbau

Die TopsView wird nicht weiter nur in kleinen React-Inseln zerlegt.
Sie wird als zentraler Arbeitsbildschirm gezielt neu zusammengesetzt.

Das ist kein Komplettumbau der App.
Es betrifft genau diesen einen Kernbildschirm.

---

## Grundsatz

Allgemein gilt weiterhin:

- kleine, prüfbare Schritte
- wenig globale Abhängigkeiten
- geringe Risiken
- stabile App

Für TopsView gilt ergänzend:

- nicht weiter am alten überfrachteten Bildschirm herumflicken
- fachlich Bewährtes übernehmen
- sichtbaren Ballast entfernen
- Arbeitsfluss vor Technik
- kein Dashboard-Ansatz

---

## Aktuelle Ausgangslage

Bekannte zentrale Bereiche:

- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/main.js`
- `src/renderer/app/Router.js`
- `src/renderer/views/`
- `src/renderer/ui/`
- `src/renderer/features/`

Diese Struktur bleibt außerhalb der TopsView grundsätzlich respektiert.

---

## Allgemeine Migrationslinie außerhalb der TopsView

Außerhalb der TopsView bleibt die bevorzugte Reihenfolge:

1. kleine UI-Bausteine
2. isolierte Dialoge oder Popups
3. lokale View-Bereiche
4. erst später größere Strukturthemen

---

## Sonderpfad TopsView

Die TopsView folgt ab jetzt einem eigenen Pfad.

### Warum
Weil sie:
- das Herz der Protokollerstellung ist
- fachlich weitgehend geklärt ist
- sichtbaren Ballast angesammelt hat
- als Arbeitsbildschirm ruhiger und klarer werden muss

### Zielbild
Die TopsView besteht aus:

1. Steuerleiste oben
2. Protokollblatt in der Mitte
3. Editbox unten
4. Read-only ohne Editbox
5. Quicklane für Projekt, Firmen, Ausgabe
6. keine Sidebar
7. kein leerer allgemeiner Header

---

## Fachliche Leitplanken für TopsView

### Steuerleiste
Links:
- Protokollnummer
- Datum
- Schlagwort

Rechts:
- Teilnehmer
- PDF-Vorschau
- Langtext an/aus
- Protokoll beenden
- Schließen
- Beenden-Symbol

Quicklane:
- Projekt
- Firmen
- Ausgabe

### Protokollblatt
- Nummern
- Farben/Zustände
- Hierarchie
- Titel
- optional Langtext
- Status, Termin, Verantwortliche
- klare Auswahl

Nicht im Blatt:
- kein fixer Protokollkopf
- keine Teilnehmerliste

### Editbox
- Kurztext
- Langtext
- Metaspalte
- Speichern
- Löschen oder vorübergehend Papierkorb
- + Titel
- + TOP
- Schieben
- Diktat direkt an Kurztext/Langtext

### Read-only
- keine Editbox
- mehr Lesefläche

---

## Reihenfolge des TopsView-Neuaufbaus

### Schritt 1 – Neue leere TopsView-Hülle
Ziel:
- obere Steuerleiste
- mittlere Blattfläche
- untere Editbox-Fläche
- keine Sidebar
- kein leerer Header

### Schritt 2 – Protokollblatt
Ziel:
- TOP-Liste
- Nummern
- Farben
- Hierarchie
- Auswahl
- Langtext an/aus

### Schritt 3 – Editbox
Ziel:
- Kurztext
- Langtext
- Metaspalte
- Diktat an den Feldern
- Speichern
- + Titel
- + TOP
- Schieben
- Löschen/Papierkorb

### Schritt 4 – Steuerleiste und Quicklane
Ziel:
- Teilnehmer
- PDF-Vorschau
- Protokoll beenden
- Schließen
- Beenden-Symbol
- Quicklane:
  - Projekt
  - Firmen
  - Ausgabe

### Schritt 5 – Read-only
Ziel:
- alte Protokolle ohne Editbox
- mehr Raum zum Lesen
- nur sinnvolle obere Aktionen

---

## Was bei TopsView vorerst nicht passieren soll

- kein Dashboard
- keine Sidebar-Rückkehr
- kein leerer allgemeiner Header
- keine globale Audio-Zielwahl
- kein zusätzlicher Protokollkopf im Blatt
- keine unnötige Umleitung auf andere App-Seiten

---

## Entscheidungskriterien für TopsView-Schritte

Wenn mehrere Wege möglich sind, ist zu bevorzugen:

1. der Weg mit dem ruhigeren Bildschirm
2. der Weg mit weniger Navigation
3. der Weg mit klarerer Trennung von:
   - Steuerung
   - Anzeige
   - Bearbeitung
4. der Weg mit geringerem globalen Risiko
5. der Weg, der fachlich Bewährtes übernimmt

---

## Definition of Done für TopsView-Schritte

Ein TopsView-Schritt gilt nur dann als fertig, wenn:

1. der sichtbare Bereich klarer geworden ist
2. der fachliche Ablauf erhalten blieb
3. keine unnötige Zusatznavigation entstand
4. Sidebar/Header-Ballast nicht zurückkam
5. die Änderung manuell leicht prüfbar ist
6. die Seite stärker wie ein Arbeitsbildschirm wirkt

---

## Pflichtausgabe für jeden TopsView-Schritt

Nach jeder Umsetzung soll geliefert werden:

- welche Dateien geändert wurden
- welcher sichtbare Bereich betroffen war
- was am Bildschirm anders ist
- welche Prüfungen ausgeführt wurden
- welche Risiken offen bleiben
- wie ein Nicht-Entwickler den Schritt manuell testen kann

---

## Unmittelbarer Fokus

Der nächste Fokus für TopsView ist nicht:
- Router-Ersatz
- globaler State
- allgemeine React-Inseln

Der nächste Fokus ist:
- die TopsView als Arbeitsbildschirm gezielt neu zusammensetzen
- zuerst Hülle, dann Blatt, dann Editbox, dann Steuerung, dann Read-only