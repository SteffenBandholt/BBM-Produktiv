# AGENTS.md

## Zweck

Diese Datei regelt den **operativen Arbeitsmodus fuer Codex** in diesem Repo.

Sie ist **kein** Architekturhandbuch, **kein** Planersatz und **keine** Einstiegsdatei fuer neue Chats.

Fuehrend bleiben:
1. `ZUERST_LESEN_Codex.md`
2. `ARCHITECTURE.md`
3. `docs/MODULARISIERUNGSPLAN.md`

Wenn Aussagen aus `AGENTS.md` dazu im Widerspruch stehen, gelten die drei Dateien oben.

---

## Aufgabe dieser Datei

`AGENTS.md` beantwortet nur diese Fragen:

- Wie setzt Codex ein Paket praktisch um?
- Wie klein muessen Pakete geschnitten werden?
- Welche Standardpruefungen gelten?
- Wie soll die Rueckgabe aussehen?
- Wann muss Codex stoppen statt blind weiterzubauen?
- Wie laeuft Git pro Paket?

Alles andere gehoert nicht fuehrend in diese Datei.

---

## Arbeitsmodus fuer Codex

Codex arbeitet immer paketweise.

Dabei gilt:

- immer nur **ein** aktives Paket
- nur der beauftragte Schritt wird umgesetzt
- keine Parallelbaustellen
- keine spaeteren Schritte vorziehen
- nur wenige, eng zusammenhaengende Dateien aendern
- keine verdeckten Nebenumbauten

Wenn ein Auftrag zu gross, zu unklar oder zu breit ist:
- nicht blind anfangen
- den Auftrag als zu gross benennen
- das kleinste sinnvolle Teilpaket vorschlagen

---

## Verbindliche Knappheit und Git-Start

Rueckgaben fuer neue Pakete muessen knapp, arbeitsbezogen und formatgebunden sein.

Nicht erlaubt:
- lange Analyse-Einleitungen
- Theorie-Runden ohne direkten Arbeitsnutzen
- freie Architektur-Wiederholungen
- Platzhalter in Git-Befehlen

Vor jedem Codex-Auftrag muessen immer konkret angegeben werden:
- Codex-Modell
- Reasoning
- Begruendung
- Git-Start mit echtem Branch-Namen

Git-Start ist immer konkret anzugeben, zum Beispiel:

```powershell
git switch main
git pull
git switch -c phase12-paket1-kurzname

---
## Paketregeln

Ein Paket ist nur dann sauber genug, wenn:

- Ziel klar benannt ist
- primaer betroffene Dateien klar benannt sind
- Nicht-Ziele klar benannt sind
- der Eingriff klein und pruefbar bleibt
- der Zweck eindeutig ist

Nicht erlaubt:

- aus einem kleinen Paket einen Rundumschlag machen
- spaetere Schritte vorziehen
- Paketgrenzen still aufweichen
- fachfremde Nebenreparaturen ohne Auftrag mitziehen

---

## Harte Ausfuehrungsgrenzen

Codex soll nicht:

- neue Architektur erfinden
- Discovery-, Registry- oder Plattformlogik vorziehen
- Router, Shell oder IPC breit umbauen, wenn das nicht ausdruecklich Teil des Pakets ist
- Fachlogik aus Bequemlichkeit in den Kern ziehen
- Altbestand aggressiv im grossen Stil bereinigen
- Doku schoener schreiben als den echten technischen Stand

Wenn ein Paket in Wahrheit groesseren Umbau ausloest:
- stoppen
- Problemursache klar benennen
- kleinstes sinnvolles Folgepaket vorschlagen

---

## Git-Regeln pro Paket

Jedes Paket soll auch git-seitig sauber getrennt bearbeitet werden.

Dabei gilt:

1. Jedes neue Paket startet von `main`.
2. Fuer jedes Paket wird ein eigener Branch angelegt.
3. Ein Branch enthaelt genau ein Paket.
4. Nacharbeit zum Paket bleibt im selben Branch.
5. Vor Commit und Merge ist der aktuelle Stand zu pruefen.
6. Merge nach `main` erst nach Pruefung und Freigabe.
7. Das naechste Paket startet wieder von `main`.

Vor der Abnahme eines Pakets mindestens pruefen:

- `git status`
- `git diff --stat`
- `git diff`

Nicht gewollt sind:

- mehrere Pakete in einem Branch
- neue Arbeit auf unsauberem Git-Stand
- Commit oder Merge ohne vorherige Pruefung
- Sammel-Branches fuer verschiedene Paketarten

---

## Standardkommandos und Mindestpruefung

Wenn fuer das Paket sinnvoll und technisch moeglich, gelten diese repo-weiten Standardkommandos:

- Start: `npm start`
- Lint: `npm run lint`
- Tests: `npm test`

Bei kleinen Doku-Paketen reichen in der Regel:

- relevante Doku-Pruefung
- `git status`
- `git diff --stat`
- `git diff`

Bei kleinen Struktur- oder Modulpaketen mindestens pruefen:

- `git status`
- `git diff --stat`
- `git diff`
- zusaetzlich die kleinsten sinnvoll passenden Tests oder Checks fuer den betroffenen Bereich

Wenn ein kompletter App-Start, Lint oder Gesamttest fuer das kleine Paket nicht sinnvoll ist:

- nicht blind alles laufen lassen
- klar benennen, was bewusst nicht geprueft wurde und warum

Checks nicht erfinden.
Nur reale im Repo vorhandene und zum Paket passende Kommandos verwenden.

---

## Doku- und Planpflege

Wenn ein Paket den dokumentierten Stand real veraendert, ist zu pruefen, ob Doku oder Plan mitgezogen werden muessen.

Dabei gilt:

- `docs/MODULARISIERUNGSPLAN.md` ist die fuehrende operative Planungsgrundlage
- keine konkurrierenden Parallelplaene anlegen
- keine Doku-Aussagen einfuehren, die technisch noch nicht erreicht sind

Wenn keine echte Statusaenderung vorliegt:
- Doku nicht unnoetig anfassen

---

## Ergebnisformat fuer jede Aufgabe

Jede Rueckgabe von Codex soll enthalten:

### Ergebnis
- Was wurde geaendert?
- Welche Dateien wurden geaendert?
- Warum ist die Aenderung sinnvoll?

### Pruefungen
- Welche Checks wurden ausgefuehrt?
- Was war erfolgreich?
- Was war nicht moeglich oder fehlgeschlagen?

### Risiken / offen
- Welche Unsicherheiten bleiben?
- Welche Randfaelle wurden nicht geprueft?
- Was sollte als Naechstes kontrolliert werden?

### Manueller Check fuer Nicht-Entwickler
- 3 bis 6 einfache Schritte, um die Aenderung zu pruefen

### Kurzfazit
- Status: `FERTIG` / `TEILWEISE FERTIG` / `BLOCKIERT`
- Ein Satz mit Begruendung

---

## Stopregeln

Stoppen und klar melden, wenn:

- das Paket deutlich groesser wird als beauftragt
- der primaere Zweck des Pakets kippt
- ein versteckter Grossumbau entsteht
- Router, Shell, IPC oder Modulrahmen unerwartet breit betroffen sind
- die Stabilitaet der bestehenden Funktion unklar wird
- Pruefungen fehlschlagen und nicht mit kleinem lokalem Fix geklaert werden koennen
- Ziel, Plan und realer Repo-Stand nicht sauber zusammenpassen

Dann gilt:

- nicht blind weiterbauen
- Problemursache klar benennen
- kleinstes sinnvolles Folge- oder Nacharbeitspaket vorschlagen

---

## Skills

Wenn passende Repo-Skills vorhanden sind, sollen sie genutzt werden.

Der Skill ersetzt aber nicht:
- Paketgrenzen
- Pruefpflicht
- ehrliche Risikobewertung
- Stopregeln

---

## Zielzustand dieser Datei

`AGENTS.md` soll ein **reines Codex-Ausfuehrungsmanual** sein.

Nicht mehr und nicht weniger.
