# README-CHATGPT.md

## Zweck dieser Datei

Diese Datei ist die Arbeitsanweisung für neue Chats, die an BBM weiterarbeiten.

Sie soll verhindern, dass bei jedem neuen Chat:

- die Architektur neu erfunden wird
- Begriffe neu vermischt werden
- alte Entscheidungen ignoriert werden
- Änderungen ohne Prüf- und Dokumentationsregeln passieren

Diese Datei ist kein Architekturpapier.
Die Architektur steht in `ARCHITECTURE.md`.
Der operative Umbauplan steht in `docs/MODULARISIERUNGSPLAN.md`.
Fachregeln stehen in den jeweiligen Regeldateien, z. B. `docs/domain/TOP-REGELN.md`.

---

## 1. Projektkontext

Repository:
`https://github.com/SteffenBandholt/BBM-Produktiv`

Das Repo ist die führende Arbeitsgrundlage.
Es gilt immer der aktuelle Stand im Repo, nicht ein älterer Chatstand.

Wenn Aussagen aus einem älteren Chat dem aktuellen Repo widersprechen, gilt der aktuelle Repo-Stand.

---

## 2. Rollen

### Rolle des Nutzers
Der Nutzer trifft die fachlichen und strategischen Entscheidungen.
Er entscheidet über Zielrichtung, Prioritäten und verbindliche Regeln.

Der Nutzer schreibt oder ändert selbst keinen Code.

### Rolle von ChatGPT
ChatGPT unterstützt bei:

- Architektur
- Planung
- Strukturierung
- Analyse
- Formulierung von Aufgaben
- Formulierung von Änderungs-Prompts für Codex
- Prüfung von Codex-Ergebnissen
- Dokumentation des erreichten Standes in Form von Änderungsanweisungen

ChatGPT entscheidet nicht eigenmächtig gegen die festgelegte Zielarchitektur.

### Rolle von Codex
Codex dient zur Umsetzung konkreter Änderungsaufgaben im Code und in der Repo-Dokumentation.

Codex ist nicht die Instanz, die die Architektur neu definiert.
Codex arbeitet innerhalb der bereits festgelegten Architektur, Leitplanken und Arbeitsregeln.

---

## 3. Verbindliche Grunddateien, die zuerst zu lesen sind

Ein neuer Chat soll zuerst diese Dateien lesen und als verbindliche Grundlage behandeln:

1. `ARCHITECTURE.md`
2. `docs/MODULARISIERUNGSPLAN.md`
3. `docs/domain/TOP-REGELN.md` (wenn die Arbeit das Modul `Protokoll` / TOP-Regeln betrifft)
4. `docs/licensing.md` (wenn Lizenzierung betroffen ist)
5. `docs/UI-TECH-CONTRACT.md` (wenn UI-/technische Vertragsregeln betroffen sind)

Diese Reihenfolge ist wichtig.

---

## 4. Bei Widersprüchen zwischen Quellen gilt diese Reihenfolge

1. der aktuelle Stand im Repo
2. `ARCHITECTURE.md`
3. `docs/MODULARISIERUNGSPLAN.md`
4. die jeweils betroffene Fachregeldatei, z. B. `docs/domain/TOP-REGELN.md`
5. technische Spezialdokumente
6. ältere Chat-Aussagen

Ein älterer Chat ist niemals höher zu gewichten als der aktuelle dokumentierte Repo-Stand.

---

## 5. Verbindliche Architektur-Kernaussagen

Diese Punkte gelten als festgelegt und werden nicht in jedem neuen Chat neu verhandelt:

- BBM wird zu einer modularen App-Plattform ausgebaut.
- Die App soll mit einem, mehreren oder später anderen Fachmodulen laufen können.
- `Protokoll` ist ein Fachmodul.
- `Restarbeiten` ist ein eigenes Fachmodul.
- `TopsScreen` ist nicht das Modul `Protokoll`, sondern nur der Arbeitsscreen für die Protokollerstellung innerhalb des Moduls `Protokoll`.
- Die App trennt sich in:
  - App-Kern
  - gemeinsame Domänen / Stamm
  - gemeinsame Dienste / Addons
  - gemeinsame Kernbausteine
  - Fachmodule
- Firmen, Projekte, Mitarbeiter/Beteiligte gehören in gemeinsame Domänen, wenn sie modulübergreifend gebraucht werden.
- Lizenzierung und globale App-Einstellungen gehören in den App-Kern.
- Mail, Drucken, PDF, Export, Whisper sind gemeinsame Dienste / Addons, keine Fachmodule.
- Wiederverwendbare Bearbeitungskerne sind erlaubt und erwünscht.
- Modulspezifische Workbench-Logik bleibt im jeweiligen Fachmodul.
- Die heutige TOP-Workbench ist nicht automatisch der globale Standard für andere Module.

Diese Punkte gelten als Arbeitsbasis.

---

## 6. Wie neue Chats arbeiten sollen

Ein neuer Chat soll nicht sofort blind Änderungen vorschlagen oder Code umbauen.

Die Reihenfolge ist:

1. Grunddateien lesen
2. aktuelle Aufgabe gegen Architektur und Plan einordnen
3. prüfen, welche Phase / welcher Schritt im `docs/MODULARISIERUNGSPLAN.md` betroffen ist
4. erst dann Änderungsvorschlag, Prüfplan oder Umsetzungsauftrag formulieren

Wenn eine Aufgabe nicht sauber zur Zielarchitektur passt, muss das klar benannt werden.

---

## 7. Wie gepromptet wird

Prompts an ChatGPT oder Codex sollen möglichst klar folgende Punkte enthalten:

- Ziel der Aufgabe
- betroffener Bereich / betroffene Dateien
- gewünschtes Ergebnis
- Grenzen der Änderung
- was ausdrücklich nicht verändert werden soll
- welcher Architektur- oder Planschritt betroffen ist

Beispielhafte Struktur:

- Ziel
- Kontext
- betroffene Dateien
- Regeln / Leitplanken
- gewünschte Ausgabe
- Nicht-Ziele

Unklare „mach mal“-Prompts sind zu vermeiden, wenn dadurch Architektur oder Zuständigkeiten unsauber würden.

---

## 8. Pflichtbestandteile jedes Codex-Prompts

Jeder Codex-Prompt soll möglichst enthalten:

- Ziel
- Kontext
- betroffene Dateien
- Architektur-/Planbezug
- gewünschtes Ergebnis
- Nicht-Ziele
- Prüfhinweise
- ggf. erforderliche Doku-/Planpflege

---

## 9. Wie mit Codex gearbeitet wird

Codex bekommt keine freie Architekturerfindung.

Codex soll:

- innerhalb der bestehenden Leitplanken arbeiten
- konkrete Aufgaben umsetzen
- Änderungen auf klar benannte Dateien oder Bereiche begrenzen
- keine stillen Strukturbrüche einführen
- keine konkurrierenden Architekturpfade aufbauen

Codex soll nicht eigenmächtig:

- neue Zielarchitektur erfinden
- Modulgrenzen uminterpretieren
- Fachlogik in den App-Kern zurückziehen
- große Nebenumbauten ohne Auftrag auslösen

---

## 10. Wie Codex-Ergebnisse geprüft werden

Ein Codex-Ergebnis gilt nicht automatisch als richtig.

Nach jeder Umsetzung ist zu prüfen:

### A. Architekturprüfung
- Passt die Änderung zu `ARCHITECTURE.md`?
- Passt die Änderung zum `docs/MODULARISIERUNGSPLAN.md`?
- Wurde Fachlogik korrekt zugeordnet?
- Wurde keine verbotene Mischstruktur erzeugt?

### B. Fachprüfung
- Passt die Änderung zu den Fachregeln?
- Wurde bestehendes Fachverhalten ungewollt verändert?
- Wurden verbotene Regeln eingeführt?

### C. Strukturprüfung
- Liegen neue Dateien an der richtigen Stelle?
- Wurde keine neue Altstruktur aufgebaut?
- Wurde Wiederverwendung sauber von Fachlogik getrennt?

### D. Änderungsprüfung
- Wurden nur die beauftragten Bereiche geändert?
- Gab es unnötige Nebenumbauten?
- Gibt es offene Risiken oder Folgearbeiten?

---

## 11. Wie Ergebnisse dokumentiert werden

Jede abgeschlossene Umsetzung oder Teilleistung soll dokumentiert werden.

Mindestens festzuhalten sind:

- welche Dateien geändert wurden
- welches Ziel verfolgt wurde
- was fachlich oder strukturell geändert wurde
- was geprüft wurde
- welche Risiken oder offenen Punkte bleiben

Wenn ein Schritt des `docs/MODULARISIERUNGSPLAN.md` erreicht wurde, muss dort der Status gepflegt werden:

- `OFFEN`
- `IN ARBEIT`
- `ERLEDIGT`
- `BLOCKIERT`
- `ZURÜCKGESTELLT`

Ein Schritt darf erst auf `ERLEDIGT` gesetzt werden, wenn das Ergebnis dokumentiert wurde.

Wenn der aktuelle Chat keinen direkten Schreibzugriff auf das Repo hat, schreibt ChatGPT keinen Code und ändert keine Dateien selbst.
Stattdessen formuliert ChatGPT einen konkreten Änderungs-Prompt an Codex, damit Codex die erforderlichen Doku-Änderungen ins Repo übernimmt.

---

## 12. Wie im Plan protokolliert wird

Wenn eine Arbeit zu einem Schritt im `docs/MODULARISIERUNGSPLAN.md` gehört, dann soll der Plan aktualisiert werden.

Dabei gilt:

- Status anpassen
- Ergebnis eintragen
- `Stand / Notiz` ergänzen
- ggf. neue Abhängigkeiten oder offene Punkte ergänzen

Es sollen keine neuen Parallelpläne entstehen.
Der bestehende Plan ist fortzuschreiben.

Wenn der aktuelle Chat den Plan nicht selbst aktualisieren kann, muss ChatGPT einen fertigen Änderungs-Prompt an Codex schreiben.

Dieser Änderungs-Prompt muss mindestens enthalten:

- betroffene Datei
- betroffener Schritt
- neuer Status
- neuer Text für `Ergebnis`
- neuer Text für `Stand / Notiz`
- ggf. weitere konkret einzutragende Änderungen

---

## 13. Form des Änderungs-Prompts an Codex

Wenn ChatGPT eine Plan- oder Dokuänderung nicht selbst schreiben kann, soll der Änderungs-Prompt an Codex so formuliert sein, dass Codex die Änderung ohne Rückfrage umsetzen kann.

Der Prompt soll enthalten:

- Ziel der Änderung
- betroffene Datei
- konkret zu ändernder Abschnitt
- neuer Zieltext
- was unverändert bleiben soll
- ggf. Begründung anhand von `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md`

Der Prompt soll so konkret sein, dass keine zweite Architekturdeutung nötig wird.

---

## 14. Umgang mit Altbestand

Altbestand wird nicht blind verschoben.

Es gilt:

- neue Bauteile sofort in Zielrichtung einordnen
- aktiv bearbeitete Altbereiche bei echter Arbeit in die Zielrichtung ziehen
- Übergangslösungen nicht zum Dauerzustand machen
- keine unnötigen Großumbauten ohne klaren Nutzen

---

## 15. Umgang mit Unsicherheit

Wenn unklar ist, wo etwas hingehört, ist zuerst zu prüfen:

1. ist es App-Kern?
2. ist es gemeinsame Domäne?
3. ist es gemeinsamer Dienst / Addon?
4. ist es gemeinsamer Kernbaustein?
5. ist es Fachmodul-Logik?

Bei Unsicherheit darf nicht stillschweigend geraten werden.
Die Unklarheit ist dann ausdrücklich zu benennen und gegen die Grunddateien zu prüfen.

---

## 16. Wichtige Schutzregeln

Ein neuer Chat soll insbesondere vermeiden:

- die Architektur neu zu erfinden
- `TopsScreen` mit dem Modul `Protokoll` gleichzusetzen
- Fachlogik in den App-Kern zurückzuziehen
- die heutige TOP-Workbench als globalen Standard für andere Module zu behandeln
- konkurrierende neue Leitplankendateien anzulegen
- den Plan nicht zu pflegen
- Änderungen ohne saubere Prüfung als „fertig“ zu behandeln

---

## 17. Standardvorgehen für neue Aufgaben

Bei einer neuen Aufgabe ist in dieser Reihenfolge zu arbeiten:

1. Aufgabe verstehen
2. Grunddateien lesen
3. betroffene Planphase / betroffenen Planschritt zuordnen
4. Architekturverträglichkeit prüfen
5. Änderungs-, Prüf- oder Codex-Prompt formulieren
6. Codex-Ergebnis prüfen
7. erforderliche Doku- und Planänderungen als Änderungs-Prompt an Codex formulieren

---

## 18. Ziel der Zusammenarbeit

Das Ziel ist nicht, in jedem Chat neue Theorie zu produzieren.

Das Ziel ist:

- auf bestehender Architektur weiterarbeiten
- Umbau und Entwicklung nachvollziehbar machen
- Entscheidungen im Repo festhalten
- Fortschritt sichtbar dokumentieren
- spätere Chats nahtlos anschlussfähig machen

---

## 19. Kurzfassung für jeden neuen Chat

Vor jeder größeren Antwort oder Änderung gilt:

- zuerst `ARCHITECTURE.md` lesen
- dann `docs/MODULARISIERUNGSPLAN.md` lesen
- bei Protokoll-Themen zusätzlich `docs/domain/TOP-REGELN.md` lesen
- Architektur nicht neu erfinden
- Plan fortschreiben statt Parallelplan erzeugen
- Ergebnis prüfen und dokumentieren
- notwendige Doku- oder Planänderungen als Prompt an Codex formulieren

---

## 20. Arbeitsmodus für Umbau- und Entwicklungsaufgaben

Größere Aufgaben werden nicht als unstrukturierter Einzelauftrag bearbeitet.

Stattdessen gilt folgende Arbeitsform:

1. Die Gesamtaufgabe wird in **Pakete** geschnitten.
2. Jedes Paket wird in **mehrere klar abgegrenzte Prompts / Arbeitsschritte** zerlegt.
3. Codex erhält pro Paket **einen Sammelprompt**, der alle Schritte des Pakets enthält.
4. Codex soll diese Schritte **streng nacheinander** abarbeiten.
5. Spätere Schritte eines Pakets dürfen nicht vorgezogen werden.
6. Nach Abschluss des gesamten Pakets wird das Ergebnis geprüft.
7. Erst nach erfolgreicher Prüfung gilt das Paket als abgeschlossen.
8. Danach wird das nächste Paket vorbereitet.

Wichtig:

- Nicht die ganze Phase wird auf einmal an Codex gegeben.
- Nicht jeder Einzelschritt wird als eigener isolierter Mini-Chat behandelt.
- Die sinnvolle Arbeitseinheit ist das **Paket**.
- Die sinnvolle Prüfeinheit ist ebenfalls das **Paket**.

Ein Paket-Prompt an Codex muss daher enthalten:

- Ziel des Pakets
- Grenzen des Pakets
- betroffene Dateien
- die Schritte / Prompts in Reihenfolge
- klare Nicht-Ziele
- gewünschte Abschlussausgabe

---

## 21. Prüfregel für Pakete

Ein Paket gilt erst dann als abgeschlossen, wenn:

- Codex alle Schritte des Pakets in Reihenfolge abgearbeitet hat
- das Gesamtergebnis des Pakets vorliegt
- die Änderung gegen Architektur, Plan und Fachregeln geprüft wurde
- offene Risiken benannt wurden
- notwendige Doku- oder Planänderungen als Codex-Prompt vorbereitet oder umgesetzt wurden

Erst danach wird das nächste Paket begonnen.