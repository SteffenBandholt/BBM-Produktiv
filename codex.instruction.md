# codex.instruction.md

Projekt: **baubesprechungs-manager** (Electron + Node.js + SQLite)

Ziel: Codex soll effizient arbeiten, keine ungewollten Refactors machen und den freigegebenen TopsView-Sonderumbau sauber umsetzen.

---

## 1) Grundregeln (immer)

1. Kein unnötiger Repo-Scan.
2. Arbeite nur an Dateien, die im Prompt genannt sind.
3. Für TopsView-Aufgaben dürfen zusätzlich direkt angrenzende Dateien gelesen werden, wenn sie für den sichtbaren Bildschirm zwingend nötig sind.
4. Kein node_modules / build / dist / Logs / DB-Dateien lesen oder ändern.
5. Minimaler Patch, wenn die Aufgabe klein ist.
6. Bei TopsView-Neubau sind auch gezielte Mehrdatei-Änderungen erlaubt, wenn sie Teil des freigegebenen Bildschirm-Neuaufbaus sind.
7. Nicht umformatieren.
8. Keine kosmetischen Änderungen ohne Nutzen.
9. Keine neuen Dependencies ohne ausdrückliche Freigabe.
10. Wenn Kontext fehlt, zuerst nach der nächsten konkreten Datei fragen.

---

## 2) Wichtige Sonderregel: TopsView

Die TopsView ist ein ausdrücklich freigegebener Sonderumbau.

Das bedeutet:

- Die allgemeine Vorsicht gilt weiterhin.
- Aber die TopsView darf bewusst neu zusammengesetzt werden.
- Ziel ist kein Dashboard und kein allgemeiner App-Umbau.
- Ziel ist ein klarer Arbeitsbildschirm für Protokolle.

Für TopsView gilt als verbindliches Zielbild:

- oben Steuerleiste
- Mitte Protokollblatt
- unten Editbox
- read only ohne Editbox
- keine Sidebar
- kein leerer allgemeiner Header

---

## 3) Bildschirmlogik der TopsView

### Steuerleiste oben
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

### Protokollblatt
- Nummern
- Farben/Zustände
- Hierarchie
- Titel
- optional Langtext
- Status, Termin, Verantwortliche
- klare Auswahl

### Editbox
- Kurztext
- Langtext
- Metaspalte
- Speichern
- Löschen oder vorübergehend Papierkorb
- + Titel
- + TOP
- Schieben
- Diktat direkt an den Eingabefeldern

### Read-only
- keine Editbox
- mehr Lesefläche

---

## 4) Verbotene Muster für TopsView

Codex darf in TopsView nicht neu einführen:

- Sidebar
- leeren allgemeinen Header
- Dashboard-Kacheln
- unnötige globale Navigation
- globalen Diktat-Button mit Zielwahl
- zusätzlichen Protokollkopf im Blatt

---

## 5) Kontext-Sparmodus

- Immer gezielt lesen.
- Keine Vollsuche über das Repo ohne klaren Anlass.
- Aufgaben klein schneiden.
- Nach großen Tasks Session resetten, wenn möglich.

---

## 6) Empfohlene Arbeitsweise

### Kleine Aufgabe
- minimaler unified diff

### TopsView-Baustein
- gezielte Änderungen an genau den betroffenen Dateien
- kein blinder Komplett-Refactor
- Fokus auf sichtbaren Bereich:
  - Steuerleiste
  - Protokollblatt
  - Editbox
  - Read-only
  - Quicklane

---

## 7) Pflicht: .codexignore

Lege im Repo-Root eine Datei `.codexignore` an mit:

```txt
node_modules
build
dist
out
coverage
Cache
GPUCache
Code Cache
*.log
*.db
*.bak
legacy-import