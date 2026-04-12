# ZUERST_LESEN_Codex.md

## Zweck

Diese Datei ist die verbindliche **Startdatei** fuer neue Chats und neue Codex-Laeufe in diesem Repo.

Sie regelt nur:
- den Einstieg
- die Lesereihenfolge
- die Quellenprioritaet
- die harte Ableitung neuer Pakete
- die feste 6-Container-Ordnung

Sie ist **kein** Architekturhandbuch, **kein** Umbauplan, **kein** Git-Handbuch und **kein** Statusbericht.

---

## 1. Verbindliche Einstiegsregel

Jeder neue Chat und jeder neue Codex-Lauf beginnt zwingend mit dem Lesen von `ZUERST_LESEN_Codex.md`.

Vorher duerfen **nicht** begonnen werden:
- Standzusammenfassung
- Paketvorschlaege
- Architektur-Einordnung
- Builder-/Reviewer-/Doc-Schritte
- Umsetzungsarbeit
- Commit-, Merge- oder Push-Vorbereitung

Wenn ein Chat spaeter einsteigt, gilt dieselbe Regel:
Nicht direkt weiterarbeiten, sondern zuerst diese Datei lesen und danach die Pflichtdateien in der festgelegten Reihenfolge nachziehen.

Wenn der tatsaechliche Repo-Stand und die Arbeitsgrundlage auseinanderlaufen, muss das **zuerst ausdruecklich benannt** werden.

## 1.1 Verbindliches Antwortformat fuer neue Chats

Neue Chats duerfen keine langen Analyse-Einleitungen, keine Theorie-Wiederholungen und kein Architektur-Nacherzaehlen liefern.

Die erste arbeitsbezogene Antwort ist knapp und formatgebunden.

Pflichtformat:

### Repo-Abgleich
- passt / passt nicht
- maximal 3 Saetze

### 3-Schritte-Kurzfahrplan
- 3 kurze Punkte
- nur Schritt 1 wird aktiv

### Aktives Paket
- Paketname
- Container
- Ziel
- Nicht-Ziele

### Git-Start
- vor jedem Codex-Auftrag sind konkrete Git-Startbefehle mit echtem Branch-Namen anzugeben

### Codex-Auftrag
- Codex-Modell
- Reasoning
- Begruendung
- dann erst der eigentliche Prompt

Nicht erlaubt:
- lange Vorreden
- freie Theorie
- Wiederholung von Architekturinhalt ohne Arbeitsnutzen
- Platzhalter wie `<branchname>`, `<dateien>` oder aehnliche Dummy-Texte

## 1.2 Verbindliche Git-Pruefung vor jeder Ergebnisbewertung

Ein Codex-Ergebnis darf nicht fachlich bewertet oder freigegeben werden, wenn der Git-Pruefblock fehlt.

Pflicht vor jeder Bewertung sind immer:

- `git status --short`
- `git diff --stat -- <echte betroffene dateien>`
- `git diff -- <echte betroffene dateien>`

Dabei gilt:
- es sind echte betroffene Dateien anzugeben
- keine Platzhalter
- keine allgemeine Formulierung statt echter Git-Ausgabe

Fehlt dieser Git-Pruefblock, ist das Ergebnis nicht bewertbar.

Dann darf weder `ANNEHMEN` noch `KLEINE NACHARBEIT` noch `VERWERFEN` fachlich ausgesprochen werden, bevor die Git-Pruefung nachgeliefert wurde.

---

## 2. Pflichtdateien und Lesereihenfolge

Verbindliche Reihenfolge:

1. `ZUERST_LESEN_Codex.md`
2. `ARCHITECTURE.md`
3. `docs/MODULARISIERUNGSPLAN.md`
4. `AGENTS.md` nur fuer die operative Ausfuehrung
5. weitere Fach- oder Spezialdateien nur, wenn das konkrete Paket sie wirklich braucht

Dabei gilt verbindlich:
- `ZUERST_LESEN_Codex.md` = Einstieg und harte Startregeln
- `ARCHITECTURE.md` = fuehrende Architekturgrundlage
- `docs/MODULARISIERUNGSPLAN.md` = fuehrende operative Umbau- und Planungsgrundlage
- `AGENTS.md` = operative Ausfuehrungsregeln fuer Codex, nicht Ziel- oder Planersatz

---

## 3. Harte Quellenprioritaet

Neue Pakete duerfen verbindlich nur aus folgenden beiden Fuehrungsquellen abgeleitet werden:

1. `ARCHITECTURE.md`
2. `docs/MODULARISIERUNGSPLAN.md`

Vor jeder Paketwahl ist deshalb zuerst zu benennen:
1. welches relevante Endziel in `ARCHITECTURE.md` betroffen ist
2. welcher dazu passende offene Schritt in `docs/MODULARISIERUNGSPLAN.md` gehoert
3. warum dieses Paket jetzt vor anderen offenen Punkten dran ist

Spontane Einzelideen, lokale Code-Schoenheitskorrekturen oder isolierte technische Kleinverbesserungen reichen als Paketbegruendung nicht aus.

---

## 4. Verbindlicher 3-Schritte-Kurzfahrplan

Vor jeder neuen Paketwahl ist zuerst ein 3-Schritte-Kurzfahrplan aus `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md` abzuleiten:

1. naechster echter Schritt
2. sinnvoller Folgeschritt
3. naechster Entblocker danach

Dabei gilt:
- nur **Schritt 1** darf aktiv in ein Paket und einen Prompt uebersetzt werden
- Schritt 2 und 3 sind nur Orientierung
- nach Abschluss von Schritt 1 muessen Schritt 2 und 3 neu geprueft werden
- neue Chats und neue Codex-Laeufe duerfen keine Prompt-Stapel fuer alle 3 Schritte als feste Abarbeitung behandeln

---

## 5. Verbindliche Arbeitsmatrix

Die Arbeitsmatrix des Modularumbaus besteht verbindlich aus genau **6 Containern**.

Neue Chats und neue Codex-Laeufe duerfen:
- keine zusaetzlichen Container einfuehren
- bestehende Container nicht ohne eigenes Doku-/Planpaket aufspalten, umbenennen oder neu ordnen

Aenderungen an der Containerstruktur gehoeren ausschliesslich in ein eigenes Doku-/Planpaket in **Container 1**.

Jedes neue Paket muss vor Beginn genau **einem** Container primaer zugeordnet werden.
Wenn ein Paket nicht klar zuordenbar ist, ist es noch nicht sauber genug geschnitten.

### Die 6 Container

1. **Container 1 – Regelwerk / Zielbild / Planfuehrung**
2. **Container 2 – App-Kern / Modulrahmen**
3. **Container 3 – Gemeinsame Kernbausteine / gemeinsame Domaenen / Dienste**
4. **Container 4 – Fachmodul `Protokoll`**
5. **Container 5 – Fachmodul `Restarbeiten`**
6. **Container 6 – Nachweis / Entmischung / Konsolidierung**

Fuer Details, Prioritaetsachsen und operative Einordnung gilt fuehrend:
`docs/MODULARISIERUNGSPLAN.md`

---

## 6. Harte Arbeitsregeln fuer neue Pakete

Vor jedem neuen Paket ist in dieser Reihenfolge zu pruefen:

1. Welches Endziel ist betroffen?
2. Welcher offene Planschritt gehoert dazu?
3. Welcher Container ist primaer zustaendig?
4. Ist das der kleinste sinnvolle Entblocker?
5. Ist das Paket klein genug, um als genau ein Paket bearbeitet zu werden?

Wenn das nicht klar beantwortet werden kann:
- nicht trotzdem anfangen
- Paket kleiner oder sauberer schneiden

---

## 7. Was diese Datei ausdruecklich nicht leisten soll

Diese Datei ist **nicht** zustaendig fuer:
- ausfuehrliche Zielarchitektur
- operative Roadmap im Detail
- Git-Handbuch
- ausfuehrliche Checklisten
- Ergebnisformat
- Statusbericht
- historische Verlaufsprotokolle

Dafuer gelten:
- Zielarchitektur: `ARCHITECTURE.md`
- operative Roadmap: `docs/MODULARISIERUNGSPLAN.md`
- Codex-Ausfuehrung: `AGENTS.md`

---

## 8. Abbruchregel bei Widerspruch

Wenn beim Lesen oder Arbeiten auffaellt, dass
- Ziel,
- Plan,
- aktueller Repo-Stand
oder
- Arbeitsgrundlage

nicht sauber zusammenpassen, dann gilt:

- nicht stillschweigend weiterarbeiten
- Widerspruch zuerst klar benennen
- erst danach neues Paket ableiten

Ohne diese Klaerung darf kein neues Paket sauber gestartet werden.

## 9. Verbindliche Modellwahl fuer Codex-Auftraege

Vor jedem Auftrag an Codex sind immer ausdruecklich anzugeben:

- verwendetes Codex-Modell
- verwendete Reasoning-Stufe
- kurze Begruendung der Wahl

Dabei gilt als Standard:

- Modell: `gpt-5.4-mini`
- Reasoning: `medium`

Diese Standardwahl ist zu verwenden, wenn kein technischer Grund fuer ein staerkeres oder teureres Modell besteht.

Ziel ist immer die wirtschaftlich effizienteste Wahl aus Kosten und Leistungsfaehigkeit.

Nur wenn es fuer den konkreten Auftrag technisch wirklich noetig ist, darf davon abgewichen werden.

Dann muss ausdruecklich benannt werden:

- welches Modell stattdessen verwendet wird
- welche Reasoning-Stufe stattdessen verwendet wird
- warum die Abweichung technisch notwendig ist

Ohne diese Angabe soll kein neuer Codex-Auftrag formuliert werden.