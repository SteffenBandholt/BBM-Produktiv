# MIGRATION_PLAN.md

## Zweck

Diese Datei ist die operative Migrationsdatei für den Übergang von `TopsView` zu `TopsScreen`.

Sie beschreibt nicht die Gesamtarchitektur der App.
Der verbindliche Einstieg fuer neue Chats und neue Codex-Laeufe ist `ZUERST_LESEN_Codex.md`.
Die fuehrende Architekturgrundlage ist `ARCHITECTURE.md`.
Die fuehrende operative Umbau- und Planungsgrundlage ist `docs/MODULARISIERUNGSPLAN.md`.
Diese Datei ist nur der operative Sonderpfad fuer die Migration `TopsView -> TopsScreen`.

## Ziel

Die bestehende Electron-/Vanilla-JS-Anwendung wird kontrolliert weiterentwickelt.

Allgemein bleibt die App vorsichtig und schrittweise veränderbar.
Es gibt jedoch einen freigegebenen Sonderpfad:

## Operativer Sonderpfad: Migration `TopsView -> TopsScreen`

`TopsView` wird nicht weiter nur in kleinen Einzelinseln verändert.
Stattdessen wird der Protokoll-Arbeitsbildschirm schrittweise in `TopsScreen` überführt.

Das ist kein Komplettumbau der App.
Es betrifft genau diesen einen fachlichen Bildschirm des Protokollmoduls.

## Grundsatz

Allgemein gilt weiterhin:

- kleine, prüfbare Schritte
- wenig globale Abhängigkeiten
- geringe Risiken
- stabile App

Für die Migration `TopsView -> TopsScreen` gilt ergänzend:

- nicht weiter am alten überfrachteten Bildschirm herumflicken
- fachlich Bewährtes übernehmen
- sichtbaren Ballast entfernen
- Arbeitsfluss vor Technik
- kein Dashboard-Ansatz

## Einordnung in das Gesamtzielbild

Das Protokoll ist in der aktuellen Produktivphase fachlich wichtig.
Architektonisch bleibt es trotzdem ein Fachmodul unter mehreren.

Die Migration zu `TopsScreen` dient deshalb nicht nur der UI-Verbesserung, sondern auch der Vorbereitung auf eine sauberere modulare Einordnung des Protokollmoduls.

## Aktuelle Ausgangslage

Bekannte zentrale Bereiche:

- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/main.js`
- `src/renderer/app/Router.js`
- `src/renderer/views/`
- `src/renderer/ui/`
- `src/renderer/features/`

Diese Struktur bleibt außerhalb des Protokoll-Arbeitsbildschirms grundsätzlich respektiert.

## Allgemeine Migrationslinie außerhalb dieses Sonderpfads

Außerhalb der Migration `TopsView -> TopsScreen` bleibt die bevorzugte Reihenfolge:

1. kleine UI-Bausteine
2. isolierte Dialoge oder Popups
3. lokale View-Bereiche
4. erst später größere Strukturthemen

## Warum dieser Sonderpfad

Der Protokoll-Arbeitsbildschirm braucht einen eigenen Migrationspfad, weil er:

- fachlich weitgehend geklärt ist
- sichtbaren Ballast angesammelt hat
- als Arbeitsbildschirm ruhiger und klarer werden muss
- im Produktivrepo aktuell der wichtigste Ausbaupfad ist

## Zielbild des Migrationspfads

Der Zielbild-Screen `TopsScreen` besteht aus:

1. Steuerleiste oben
2. Protokollblatt in der Mitte
3. Editbox unten
4. Read-only ohne Editbox
5. Quicklane für Projekt, Firmen, Ausgabe
6. keine Sidebar
7. kein leerer allgemeiner Header

## Fachliche Leitplanken für die Migration

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
- Farben und Zustände
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
- Diktat direkt an Kurztext und Langtext

### Read-only

- keine Editbox
- mehr Lesefläche

## Reihenfolge des Neuaufbaus

### Schritt 1 - Neue leere `TopsScreen`-Hülle

Ziel:

- obere Steuerleiste
- mittlere Blattfläche
- untere Editbox-Fläche
- keine Sidebar
- kein leerer Header

### Schritt 2 - Protokollblatt

Ziel:

- TOP-Liste
- Nummern
- Farben
- Hierarchie
- Auswahl
- Langtext an/aus

### Schritt 3 - Editbox

Ziel:

- Kurztext
- Langtext
- Metaspalte
- Diktat an den Feldern
- Speichern
- + Titel
- + TOP
- Schieben
- Löschen oder Papierkorb

### Schritt 4 - Steuerleiste und Quicklane

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

### Schritt 5 - Read-only

Ziel:

- alte Protokolle ohne Editbox
- mehr Raum zum Lesen
- nur sinnvolle obere Aktionen

## Was bei diesem Sonderpfad vorerst nicht passieren soll

- kein Dashboard
- keine Sidebar-Rückkehr
- kein leerer allgemeiner Header
- keine globale Audio-Zielwahl
- kein zusätzlicher Protokollkopf im Blatt
- keine unnötige Umleitung auf andere App-Seiten

## Entscheidungskriterien für Migrationsschritte

Wenn mehrere Wege möglich sind, ist zu bevorzugen:

1. der Weg mit dem ruhigeren Bildschirm
2. der Weg mit weniger Navigation
3. der Weg mit klarerer Trennung von Steuerung, Anzeige und Bearbeitung
4. der Weg mit geringerem globalen Risiko
5. der Weg, der fachlich Bewährtes übernimmt

## Definition of Done für Migrationsschritte

Ein Schritt der Migration `TopsView -> TopsScreen` gilt nur dann als fertig, wenn:

1. der sichtbare Bereich klarer geworden ist
2. der fachliche Ablauf erhalten blieb
3. keine unnötige Zusatznavigation entstand
4. Sidebar- oder Header-Ballast nicht zurückkam
5. die Änderung manuell leicht prüfbar ist
6. der Bildschirm stärker wie ein Arbeitsbildschirm wirkt

## Pflichtausgabe für jeden Schritt

Nach jeder Umsetzung soll geliefert werden:

- welche Dateien geändert wurden
- welcher sichtbare Bereich betroffen war
- was am Bildschirm anders ist
- welche Prüfungen ausgeführt wurden
- welche Risiken offen bleiben
- wie ein Nicht-Entwickler den Schritt manuell testen kann

## Unmittelbarer Fokus

Der nächste Fokus dieser Migration ist nicht:

- Router-Ersatz
- globaler State
- allgemeine Technik-Umbauten ohne direkten Nutzwert

Der nächste Fokus ist:

- `TopsView` fachlich und schrittweise nach `TopsScreen` zu überführen
- zuerst Hülle, dann Blatt, dann Editbox, dann Steuerung, dann Read-only
