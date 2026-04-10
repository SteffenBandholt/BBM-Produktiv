# AGENTS.md

## Zweck

Diese Datei ist die allgemeine Arbeitsgrundlage fuer Codex in diesem Repo.

Sie soll den wiederkehrenden Arbeitsmodus direkt im Repo verankern, damit Grundregeln nicht in jedem Prompt neu erklaert werden muessen.

Diese Datei definiert **nicht** die gesamte Architektur im Detail.
Fuehrende Grundlagen bleiben:

1. `ZUERST_LESEN_Codex.md`
2. `ARCHITECTURE.md`
3. `docs/MODULARISIERUNGSPLAN.md`

Wenn Aussagen aus dieser Datei dazu im Widerspruch stehen, gelten die oben genannten Dateien.

---

## Grundsatz

Dieses Repo wird kontrolliert, paketweise und ohne unnoetige Grossumbauten weiterentwickelt.

Allgemein gilt:

* immer nur **ein sinnvolles Paket**
* kleine, klar begrenzte Aenderungen
* keine neue Zielarchitektur erfinden
* keine unnoetigen Nebenumbauten
* bestehendes Verhalten nicht leichtfertig beschaedigen
* aktive Uebergangszustaende ehrlich benennen, nicht schoenreden

---

## Arbeitsmodus fuer Codex

Vor jeder Umsetzung:

1. zuerst `ZUERST_LESEN_Codex.md` lesen
2. dann `ARCHITECTURE.md` lesen
3. dann `docs/MODULARISIERUNGSPLAN.md` lesen
4. nur die weiteren Dateien lesen, die fuer das konkrete Paket wirklich noetig sind

Dann:

1. das Paket klar einordnen
2. die Paketgrenzen einhalten
3. nur die beauftragten Bereiche aendern
4. keine stillen Strukturbrueche oder Parallelpfade einfuehren

---

## Harte Regeln

Codex soll:

* immer nur das beauftragte Paket bearbeiten
* Aenderungen auf wenige, eng zusammenhaengende Dateien begrenzen
* keine neue Architektur erfinden
* keine konkurrierenden neuen Leitlinien aufbauen
* keine grossen Umbenennungen oder Verschiebungen ohne klaren Auftrag ausloesen
* Doku nicht schoener schreiben als den echten technischen Stand
* bei Doku-Paketen nur minimale, gezielte Textaenderungen machen
* offene Risiken klar benennen

Codex soll **nicht**:

* aus einem kleinen Paket einen Rundumschlag machen
* Router, Shell, IPC oder Modulrahmen breit umbauen, wenn das nicht explizit Teil des Pakets ist
* Fachlogik aus Bequemlichkeit in den Kern ziehen
* allgemeine Plattformmechanik, Discovery oder Registry-Logik vorziehen
* aus Altbestand stillschweigend eine neue Zielstruktur behaupten

---

## Paketdenken

Jede Arbeit ist genau einem Paket zuzuordnen.

Ein Paket ist nur dann sauber genug, wenn:

* es ein klares Ziel hat
* es klar benannte betroffene Dateien hat
* es klare Nicht-Ziele hat
* es in wenigen zusammenhaengenden Aenderungen bearbeitbar ist
* es nicht gleichzeitig mehrere Baustellen vermischt

Wenn ein Paket zu gross oder unklar ist:

* nicht blind anfangen
* stattdessen das kleinste sinnvolle Teilpaket benennen

---

## Git-Regeln pro Paket

Jedes Paket soll auch git-seitig klar getrennt bearbeitet werden.

Dabei gilt:

1. Jedes neue Paket startet von `main`.
2. Fuer jedes Paket wird ein eigener Branch angelegt.
3. Ein Branch enthaelt genau ein Paket.
4. Nacharbeit zum Paket bleibt im selben Branch.
5. Vor Commit und Merge ist der aktuelle Stand zu pruefen.
6. Merge nach `main` erst nach Pruefung und Freigabe.
7. Das naechste Paket startet wieder von `main`.

Vor der Abnahme eines Pakets mindestens pruefen:

* `git status`
* `git diff --stat`
* `git diff`

Nicht gewollt sind:

* mehrere Pakete in einem Branch
* neue Arbeit auf unsauberem Git-Stand
* Commit oder Merge ohne vorherige Pruefung
* Sammel-Branches fuer verschiedene Paketarten

Nicht-Ziele:

* keine neue Git-Datei anlegen
* keine Aenderung anderer Dateien
* keine Ausweitung zu einer grossen Git-Dokumentation
* keine Aenderung des restlichen Arbeitsmodus

Pruefkriterien:

* `AGENTS.md` enthaelt einen kurzen, klaren Git-Block fuer den paketweisen Arbeitsmodus
* der Git-Block ist logisch passend eingeordnet
* keine anderen Teile von `AGENTS.md` wurden unnötig umgebaut
* keine weiteren Dateien wurden geaendert

Gewuenschte Ausgabe:

* Liste der geaenderten Dateien
* kurzer Hinweis, wo der Git-Block in `AGENTS.md` eingefuegt wurde
* Hinweis, ob beim Einbau eine logisch bessere Position als erwartet gewaehlt wurde
* `git diff -- AGENTS.md`

---

## Standardkommandos und Mindestpruefung

Wenn fuer das Paket sinnvoll und technisch moeglich, gelten diese repo-weiten Standardkommandos:

* Start: `npm start`
* Lint: `npm run lint`
* Tests: `npm test`

Bei kleinen Doku-Paketen reichen in der Regel:

* relevante Doku-Pruefung
* `git status`
* `git diff --stat`
* `git diff`

Bei kleinen Strukturpaketen mindestens pruefen:

* `git status`
* `git diff --stat`
* `git diff`
* zusaetzlich die kleinsten sinnvoll passenden Tests oder Checks fuer den betroffenen Bereich

Wenn ein kompletter App-Start, Lint oder Gesamttest fuer das kleine Paket nicht sinnvoll ist:

* nicht blind alles laufen lassen
* klar benennen, was bewusst nicht geprueft wurde und warum

Checks nicht erfinden.
Nur reale im Repo vorhandene und zum Paket passende Kommandos verwenden.

Nicht-Ziele:

* keine neue Teststrategie definieren
* keine Ausweitung zu einer grossen Build-/Test-Dokumentation
* keine Aenderung anderer Dateien
* keine Aenderung des restlichen Arbeitsmodus

Pruefkriterien:

* `AGENTS.md` enthaelt einen kurzen, klaren Block fuer Standardkommandos und Mindestpruefung
* nur reale im Repo vorhandene Standardkommandos werden genannt
* der Block ist logisch passend eingeordnet
* keine weiteren Dateien wurden geaendert

Gewuenschte Ausgabe:

* Liste der geaenderten Dateien
* kurzer Hinweis, wo der neue Block in `AGENTS.md` eingefuegt wurde
* Hinweis, ob beim Einbau eine logisch bessere Position als erwartet gewaehlt wurde
* `git diff -- AGENTS.md`

---

## Doku- und Planpflicht

Wenn ein Paket den dokumentierten Stand real veraendert, ist zu pruefen, ob auch Doku oder Plan angepasst werden muessen.

Dabei gilt:

* `docs/MODULARISIERUNGSPLAN.md` ist die fuehrende operative Planungsgrundlage
* `MODULARISIERUNGSSTATUS.md` darf nur angepasst werden, wenn sich der reale Status wirklich veraendert
* keine konkurrierenden Parallelplaene anlegen
* keine Doku-Aussagen einfuehren, die technisch noch nicht erreicht sind

Wenn keine echte Statusaenderung vorliegt:

* Doku nicht unnoetig anfassen

---

## Sonderfall Protokoll-Arbeitsscreen

Der Protokoll-Arbeitsscreen ist ein fachlich wichtiger Sonderpfad.

Dabei gilt:

* `TopsScreen` ist der aktuelle Arbeitsscreen
* `Protokoll` ist das Fachmodul
* alter Bestand kann noch als Uebergang vorhanden sein
* Uebergangszonen duerfen nicht schoengefaerbt werden
* kein grosser Komplettumbau in einem Zug
* sichtbarer Ballast soll reduziert werden
* Arbeitsfluss geht vor Technikshow

Bei Arbeit am Protokoll-Arbeitsscreen besonders beachten:

* kein Dashboard-Ansatz
* keine unnoetige Zusatznavigation
* keine Rueckkehr von Sidebar- oder Header-Ballast
* fachlich bewaehrtes Verhalten erhalten
* nur klar begrenzte sichtbare oder strukturelle Teilpakete bearbeiten

---

## Ergebnisformat fuer jede Aufgabe

Jede Antwort von Codex soll enthalten:

### Ergebnis

* Was wurde geaendert?
* Welche Dateien wurden geaendert?
* Welcher Bereich ist betroffen?
* Warum ist die Aenderung sinnvoll?

### Pruefungen

* Welche Checks wurden ausgefuehrt?
* Was war erfolgreich?
* Was war nicht moeglich oder fehlgeschlagen?

### Risiken / offen

* Welche Unsicherheiten bleiben?
* Welche Randfaelle wurden nicht geprueft?
* Was sollte als Naechstes kontrolliert werden?

### Manueller Check fuer Nicht-Entwickler

* 3 bis 6 einfache Schritte, um die Aenderung zu pruefen

### Kurzfazit

* Status: `FERTIG` / `TEILWEISE FERTIG` / `BLOCKIERT`
* Ein Satz mit Begruendung

---

## Stoppregeln

Stoppen und klar melden, wenn:

* das Paket ploetzlich deutlich groesser wird als beauftragt
* Router, Shell, IPC oder Modulrahmen unerwartet breit betroffen sind
* fachliche Zuordnung unklar wird
* die Aenderung eine neue Architekturentscheidung erzwingen wuerde
* der Bildschirm unruhiger oder voller statt klarer wird
* Build, Tests oder zentrale Checks fehlschlagen

Dann:

* nicht blind weiterbauen
* Problemursache klar benennen
* kleinstes sinnvolles Folgepaket oder Nacharbeitspaket vorschlagen

---

## Ziel dieser Datei

Diese Datei soll Grundregeln wiederholbar machen.

Sie soll Prompts kuerzer und Codex-Laeufe konsistenter machen.

Sie ersetzt nicht die Architektur- und Planungsdokumente, sondern sorgt dafuer, dass Codex im Repo jedes Paket mit demselben Arbeitsmodus beginnt.

Nicht-Ziele:

* keine Aenderung anderer Dateien
* keine neue Architektur formulieren
* keine neue Planstruktur einziehen
* keine stillen Zusatzregeln erfinden
* keine Rueckkehr zu `TopsView` als fuehrendem Sonderfall

Pruefkriterien:

* `AGENTS.md` ist nachher allgemeine Repo-Arbeitsgrundlage statt veralteter `TopsView`-Sondertext
* `TopsScreen` ist korrekt als aktueller Arbeitsscreen benannt
* der allgemeine Arbeitsmodus ist fuer Doku-, Struktur- und Fachpakete nutzbar
* keine weiteren Dateien wurden geaendert

Gewuenschte Ausgabe:

* Liste der geaenderten Dateien
* kurze Beschreibung, wie die alte `TopsView`-Zentrierung ersetzt wurde
* Hinweis, ob beim Ersetzen noch ein aktueller Begriff oder Verweis in `AGENTS.md` unklar geblieben ist
* `git diff -- AGENTS.md`
