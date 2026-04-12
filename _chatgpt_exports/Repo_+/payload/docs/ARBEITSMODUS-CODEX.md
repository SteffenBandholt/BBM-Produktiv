# ARBEITSMODUS-CODEX.md

## Zweck

Diese Datei beschreibt den verbindlichen Arbeitsmodus für die Zusammenarbeit zwischen Nutzer, ChatGPT und Codex bei Umbau- und Entwicklungsaufgaben in BBM.

Sie ergänzt:

- `README-CHATGPT.md`
- `ARCHITECTURE.md`
- `docs/MODULARISIERUNGSPLAN.md`

Diese Datei regelt nicht die Zielarchitektur selbst, sondern die Art der Abarbeitung.

---

## Grundprinzip

Größere Aufgaben werden nicht als unstrukturierter Einzelauftrag bearbeitet.

Stattdessen gilt:

1. Die Gesamtaufgabe wird in **Phasen** gegliedert.
2. Jede Phase wird in **Pakete** geschnitten.
3. Jedes Paket wird in **Schritte** gegliedert:
   - Scout
   - Builder
   - Reviewer
   - Doc
4. Codex erhält pro Schritt einen klaren Auftrag.
5. Ein Paket gilt erst nach Prüfung und Dokumentation als abgeschlossen.
6. Erst danach beginnt das nächste Paket.

---

## Rollen in diesem Arbeitsmodus

### Nutzer
- trifft fachliche und strategische Entscheidungen
- priorisiert die Arbeit
- führt selbst keine Codeänderungen aus

### ChatGPT
- zerlegt Phasen in Pakete
- zerlegt Pakete in Scout / Builder / Reviewer / Doc
- schreibt die Prompts für Codex
- prüft Codex-Ergebnisse
- schreibt Nacharbeits-Prompts
- schreibt Doku-/Planänderungs-Prompts
- gibt bei Bedarf die konkrete Git-Anweisung pro Paket vor

### Codex
- setzt die jeweils beauftragte Teilaufgabe um
- erfindet keine neue Zielarchitektur
- arbeitet innerhalb der bestehenden Leitplanken

---

## Paketstruktur

Jedes Paket hat:

- Paketname
- Ziel
- betroffene Dateien
- Nicht-Ziele
- Abschlusskriterien
- Schritte:
  - Scout
  - Builder
  - Reviewer
  - Doc

---

## Schritt 1: Scout

### Ziel
Das Paket fachlich und technisch sauber schneiden, bevor gebaut wird.

### Aufgabe von Codex
- betroffene Dateien identifizieren
- Risiken benennen
- Schnittgrenzen benennen
- sinnvolle Teiländerungen vorschlagen
- Nicht-Ziele benennen

### Wichtige Regel
Scout baut nicht den großen Umbau.
Scout dient der Vorbereitung.

### Ergebnis von Scout
- kurze Bestandsanalyse
- Vorschlag für die Umsetzung im Paket
- klare Risiken und Grenzen

---

## Schritt 2: Builder

### Ziel
Die eigentliche Umsetzung des Pakets.

### Aufgabe von Codex
- nur innerhalb der vorgegebenen Paketgrenzen arbeiten
- nur die beauftragten Dateien ändern
- keine stillen Nebenumbauten auslösen
- keine neue Architektur erfinden

### Wichtige Regel
Builder arbeitet konservativ und nachvollziehbar.

### Ergebnis von Builder
- umgesetzte Änderung
- Liste geänderter Dateien
- kurze Beschreibung der Änderung
- offene Risiken

---

## Schritt 3: Reviewer

### Ziel
Das Builder-Ergebnis unabhängig prüfen.

### Aufgabe von Codex
Prüfung gegen:

- `ARCHITECTURE.md`
- `docs/MODULARISIERUNGSPLAN.md`
- betroffene Fachregeldateien
- Struktur- und Änderungsgrenzen des Pakets

### Prüfkategorien
- Architekturprüfung
- Fachprüfung
- Strukturprüfung
- Nebenwirkungsprüfung
- Doku-/Planpflege-Prüfung

### Ergebnis von Reviewer
- Befund
- Mängel
- konkrete Nacharbeitsliste, falls nötig

---

## Schritt 4: Doc

### Ziel
Erreichten Stand dokumentieren und den Plan fortschreiben.

### Aufgabe von Codex
- betroffene Doku-Dateien aktualisieren
- Paket-/Phasenstatus im Plan pflegen
- Ergebnis und Stand / Notiz eintragen
- keine konkurrierenden Parallelpläne erzeugen

### Ergebnis von Doc
- aktualisierte Doku
- aktualisierter Planstatus
- nachvollziehbarer Arbeitsstand für spätere Chats

---

## Git-Regeln pro Paket

Die Git-Einheit ist das Arbeitspaket.

Dabei gilt:

1. Jedes neue Paket startet von `main`.
2. Für jedes Paket wird ein eigener Branch angelegt.
3. Ein Branch enthält genau ein Arbeitspaket.
4. Scout, Builder, Reviewer, Nacharbeit und Doc laufen im selben Paket-Branch.
5. Erst wenn das Paket fachlich und technisch geprüft sowie dokumentiert ist, wird nach `main` gemergt.
6. Das nächste Paket startet wieder von `main`.
7. Es werden keine Sammel-Branches für ganze Phasen geführt.

### Benennungsregel für Paket-Branches

Branch-Namen sollen sprechend sein, z. B.:

- `phase2-paket1-main-router-vorsortieren`
- `phase2-paket2-navigation-trennen`
- `phase7-paket1-protokoll-modulgrenze`

### Verbotene Git-Muster

Nicht gewollt sind:

- ein einziger Großumbau-Branch für mehrere Pakete
- ein Phasen-Branch als dauerhafte Sammelstelle
- mehrere abgeschlossene Pakete in einem gemeinsamen Branch
- Start eines neuen Pakets auf unsauberem Git-Stand

### Arbeitsregel

ChatGPT gibt pro Paket bei Bedarf auch die konkrete Git-Anweisung vor:

- Ausgangsbranch
- neuer Branch-Name
- Startbefehle
- Merge-Zeitpunkt
- Merge nur nach Prüfung und Freigabe

---

## Paket-Abschlusskriterien

Ein Paket gilt erst dann als abgeschlossen, wenn:

1. Scout durchgeführt und geprüft wurde
2. Builder durchgeführt und geprüft wurde
3. Reviewer durchgeführt wurde
4. nötige Nacharbeiten erledigt wurden
5. Doc durchgeführt wurde
6. Paketstatus und Planstatus aktualisiert wurden

Erst dann darf das nächste Paket beginnen.

---

## Nacharbeitsregel

Wenn bei der Prüfung Mängel festgestellt werden, gilt:

- kein Übergang zum nächsten Paket
- stattdessen Nacharbeits-Prompt an Codex
- erneute Prüfung
- erst danach Paketabschluss

---

## Statuslogik

### Phasenstatus
- `OFFEN`
- `IN ARBEIT`
- `ERLEDIGT`

### Paketstatus
- `OFFEN`
- `IN ARBEIT`
- `ERLEDIGT`
- `BLOCKIERT`
- `ZURÜCKGESTELLT`

### Schrittstatus
Schrittstatus muss nicht zwingend als eigene Tabelle geführt werden, muss aber im Paketverlauf nachvollziehbar sein.

---

## Standard-Checkliste pro Paket

Vor Start eines Pakets muss klar sein:

- Was ist das Ziel?
- Welche Dateien sind betroffen?
- Welche Dateien dürfen nicht verändert werden?
- Was sind die Nicht-Ziele?
- Woran wird Erfolg gemessen?
- Welche Doku muss danach aktualisiert werden?

---

## Standard-Checkliste für die Prüfung

Nach einem Builder- oder Nacharbeitslauf ist mindestens zu prüfen:

- passt die Änderung zur Architektur?
- passt die Änderung zum Plan?
- wurde Fachlogik korrekt zugeordnet?
- wurden unnötige Nebenumbauten vermieden?
- liegen neue Dateien an der richtigen Stelle?
- fehlt Doku- oder Planpflege?

---

## Arbeitsregel für Paket-Prompts an Codex

Ein Paket-Prompt oder Schritt-Prompt an Codex soll immer enthalten:

- Ziel
- Kontext
- betroffene Dateien
- Architektur-/Planbezug
- gewünschtes Ergebnis
- Nicht-Ziele
- Prüfhinweise
- ggf. erforderliche Doku-/Planpflege

---

## Abschlussregel

Nicht der einzelne Prompt ist die relevante Arbeitseinheit, sondern das **Paket**.

Nicht der einzelne Codex-Lauf ist der Abschluss, sondern:

- Umsetzung
- Prüfung
- Nacharbeit bei Bedarf
- Dokumentation
- Planpflege

Erst dann ist ein Paket wirklich abgeschlossen.