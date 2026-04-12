---
name: kleines-strukturpaket
description: Verwende diesen Skill fuer kleine, klar begrenzte Strukturpakete, wenn nur wenige eng zusammenhaengende Dateien betroffen sind, keine neue Architektur eingefuehrt werden soll und kein grosser Umbau ausgeloest werden darf.
---

# Skill: kleines-strukturpaket

## Zweck

Dieser Skill ist fuer kleine, klar begrenzte Strukturpakete in diesem Repo.

Er wird verwendet, wenn:

* nur wenige eng zusammenhaengende Dateien betroffen sind
* eine kleine strukturelle Verbesserung noetig ist
* kein grosser Umbau ausgeloest werden soll
* keine neue Architektur erfunden werden soll
* bestehendes Verhalten erhalten bleiben soll

Typische Faelle:

* kleiner Schnitt im Modulrahmen
* kleine Entmischung eines Uebergangsbereichs
* kleine Struktur-Nacharbeit
* kleine Klarstellung von Zustaendigkeiten zwischen Kern, gemeinsamem Bereich und Fachmodul
* kleine Reduktion eines Altpfads, wenn der Ersatz real schon vorhanden ist

## Vor dem Start

1. `ZUERST_LESEN_Codex.md` lesen
2. `ARCHITECTURE.md` lesen
3. `docs/MODULARISIERUNGSPLAN.md` lesen
4. nur die fuer das konkrete Paket wirklich noetigen Dateien lesen
5. pruefen, ob das Paket wirklich klein genug ist

## Arbeitsregeln

* immer nur genau ein Strukturpaket bearbeiten
* nur die ausdruecklich betroffenen Dateien aendern
* keine neue Zielarchitektur erfinden
* keine Discovery-, Registry- oder Plattformlogik vorziehen
* keine grossen Verschiebungen oder Umbenennungen ohne klaren Auftrag
* keine neue allgemeine Abstraktion einfuehren, wenn sie nicht zwingend gebraucht wird
* bestehendes Verhalten erhalten
* aktive Uebergangszustaende ehrlich benennen
* keine Nebenbaustellen aufmachen

## Typische erlaubte Aufgaben

* kleinen Zugriffspunkt im Modulrahmen klarer schneiden
* kleine interne Zustaendigkeit sauberer zuordnen
* kleinen Altpfad reduzieren, wenn ein realer Ersatz schon besteht
* kleine Host-/Modul-/Kern-Grenze sichtbarer machen
* kleine Strukturverdichtung in wenigen Dateien
* kleine Entkopplung vorbereiten, ohne grossen Umzug

## Nicht erlaubt

* grosser Rundumschlag ueber viele Bereiche
* neue Architekturpfade behaupten
* Router, Shell, IPC oder Modulrahmen breit umbauen, wenn das nicht ausdruecklich Teil des Pakets ist
* Fachlogik aus Bequemlichkeit in den Kern ziehen
* Modulstruktur in einem Zug gross neu ordnen
* eine kleine Strukturarbeit als Vorwand fuer Generalisierung benutzen

## Wenn der Auftrag zu gross ist

Nicht blind anfangen.

Stattdessen:

* den Auftrag als zu breit benennen
* das kleinste sinnvolle Teilpaket vorschlagen
* keine Umsetzung starten, bis das Paket klein und klar genug ist

## Erwartetes Ergebnisformat

### Ergebnis

* Was wurde geaendert?
* Welche Dateien wurden geaendert?
* Welcher strukturelle Bereich ist betroffen?
* Warum ist die Aenderung sinnvoll?

### Pruefungen

* Welche Checks wurden ausgefuehrt?
* Was war erfolgreich?
* Was wurde bewusst nicht angefasst?

### Risiken / offen

* Welche Unsicherheiten bleiben?
* Welche Randfaelle wurden nicht geprueft?
* Welche Folgearbeit koennte spaeter sinnvoll sein?

### Manueller Check fuer Nicht-Entwickler

* 3 bis 6 einfache Schritte, um die Aenderung zu kontrollieren

### Kurzfazit

* Status: FERTIG / TEILWEISE FERTIG / BLOCKIERT
* Ein Satz mit Begruendung

## Standardausgabe bei Abschluss

Immer liefern:

* Liste der geaenderten Dateien
* kurze Begruendung je Aenderung
* offene Risiken
* manueller Check
* `git diff -- <betroffene dateien>`
