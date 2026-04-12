---
name: doku-paket
description: Verwende diesen Skill fuer kleine Doku-, Plan- und Regelpakete, wenn nur Doku-Dateien betroffen sind, keine Code-Aenderung noetig ist und nur minimale, gezielte Textaenderungen gemacht werden sollen.
---

# Skill: doku-paket

## Zweck

Dieser Skill ist fuer kleine Doku-, Plan- und Regelpakete in diesem Repo.

Er wird verwendet, wenn:

* nur Doku-/Plan-Dateien betroffen sind
* keine Code-Aenderung noetig ist
* keine neue Architektur erfunden werden soll
* nur kleine, gezielte Textaenderungen gemacht werden sollen

## Vor dem Start

1. `ZUERST_LESEN_Codex.md` lesen
2. `ARCHITECTURE.md` lesen
3. `docs/MODULARISIERUNGSPLAN.md` lesen
4. nur die fuer das Paket wirklich betroffenen Doku-Dateien lesen

## Arbeitsregeln

* immer nur genau ein Doku-Paket bearbeiten
* nur die ausdruecklich betroffenen Dateien aendern
* keine neue Zielarchitektur erfinden
* keine neue Planlogik einfuehren
* keine Parallelplaene aufbauen
* Doku nicht schoener schreiben als den echten technischen Stand
* nur minimale, gezielte Textaenderungen machen
* keine sprachliche Vollueberarbeitung ohne klaren Auftrag
* keine Nebenbaustellen aufmachen

## Typische erlaubte Aufgaben

* Statuswerte gegen dokumentierten Ist-Stand synchronisieren
* Fuehrungsquellen klarziehen
* Lesereihenfolge vereinheitlichen
* kleine Widersprueche zwischen Doku-Dateien bereinigen
* veraltete Begriffe in einer einzelnen Doku-Datei sauber ersetzen

## Nicht erlaubt

* Architektur neu definieren
* grosse Umstrukturierung mehrerer Doku-Dateien ohne klaren Auftrag
* Inhalte behaupten, die technisch nicht erreicht sind
* aus einem kleinen Doku-Paket einen allgemeinen Repo-Umbau machen
* Code-Dateien mit aendern, wenn das nicht ausdruecklich Teil des Pakets ist

## Wenn der Auftrag zu gross ist

Nicht blind anfangen.

Stattdessen:

* den zu grossen Auftrag als zu breit benennen
* das kleinste sinnvolle Doku-Teilpaket vorschlagen
* keine Aenderung ausfuehren, bis das Paket klar genug ist

## Erwartetes Ergebnisformat

### Ergebnis

* Was wurde geaendert?
* Welche Dateien wurden geaendert?
* Warum war das noetig?

### Pruefungen

* Welche Doku-Stellen wurden gegeneinander geprueft?
* Was wurde erfolgreich bereinigt?
* Was wurde bewusst nicht angefasst?

### Risiken / offen

* Welche Restwidersprueche oder Unsicherheiten bleiben?
* Was sollte als Naechstes geprueft werden?

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

Nicht-Ziele:

* keinen zweiten Skill anlegen
* keine bestehende Doku inhaltlich umschreiben
* keinen allgemeinen Workflow neu definieren
* keine Code-Dateien anfassen
* keine grosse Repo-Struktur einfuehren

Pruefkriterien:

* genau ein Skill `doku-paket` wurde angelegt
* der Skill ist an einer sinnvollen Stelle im Repo abgelegt
* der Zieltext wurde inhaltlich sauber uebernommen
* keine unnoetigen Begleitaenderungen wurden gemacht

Gewuenschte Ausgabe:

* Liste der geaenderten Dateien
* kurzer Hinweis, wo der Skill abgelegt wurde und warum diese Stelle sinnvoll ist
* Hinweis, ob fuer Skills im Repo schon eine Struktur vorhanden war oder neu minimal angelegt wurde
* `git diff -- <betroffene dateien>`
