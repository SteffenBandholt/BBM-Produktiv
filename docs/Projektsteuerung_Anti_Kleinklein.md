# Editor 1 – Projektsteuerung und Anti-Kleinklein-Regeln

Stand: 14.05.2026  
Projekt: BBM-Produktiv / layoutTools / Editor 1  
Zweck: Steuerungsdokument gegen unkontrollierte Kleinarbeit, Sonderlösungen und versehentliche Eingriffe in echte UI-/PDF-Laufwege.

---

## 0. Einordnung

Dieses Dokument ist kein Fachkonzept und kein Implementierungsauftrag.

Dieses Dokument ist die verbindliche Arbeitsregel für alle späteren Arbeiten an **Editor 1**.

Es beantwortet nicht die Frage:

> Was soll der Tabelleneditor fachlich können?

Diese Frage steht im Konzeptvertrag:

- `docs/Editor_1_Konzept_und_Vertrag.md`

Dieses Dokument beantwortet die Frage:

> Wie verhindern wir, dass die Umsetzung wieder in Kleinklein, Sonderlogik und unkontrollierte Eingriffe abgleitet?

---

## 1. Oberste Regel

**Ein Auftrag darf immer nur eine Schicht verändern.**

Erlaubte Schichten sind zum Beispiel:

1. Konzept / Dokumentation
2. Datenmodell / Vertrag
3. Registry / Speicherstruktur
4. Plausibilitätslogik
5. Tests
6. Dummy-Referenz
7. isolierte DEV-only Editor-UI
8. Anschluss einer einzelnen echten Tabelle
9. Anschluss einer einzelnen echten PDF-Variante

Nicht erlaubt ist ein Mischauftrag wie:

```text
Baue den Tabelleneditor komplett und schließe TOP-Liste, PDF und UI direkt an.
```

Solche Aufträge sind zu groß und werden nicht ausgeführt.

---

## 2. Zielbild der Projektsteuerung

Editor 1 wird nicht in einem großen Entwicklungslauf gebaut.

Editor 1 wird in kleinen, prüfbaren Paketen umgesetzt.

Jedes Paket muss:

- ein klares Ziel haben,
- klare Nicht-Ziele haben,
- erlaubte Bereiche nennen,
- verbotene Bereiche nennen,
- Tests oder prüfbare Nachweise liefern,
- nach Abschluss verständlich berichten,
- ohne Seiteneffekte in echter UI/PDF bleiben, solange das Paket dies nicht ausdrücklich erlaubt.

---

## 3. Rollen

### 3.1 Nutzer / Auftraggeber

Der Nutzer muss nicht programmieren.

Der Nutzer entscheidet nur:

- Ist der Auftrag fachlich richtig begrenzt?
- Wurden verbotene Bereiche angefasst?
- Gibt es eine verständliche Abschlussmeldung?
- Sind die Tests grün?
- Ist der nächste Schritt logisch vorbereitet?

### 3.2 ChatGPT / Supervisor

ChatGPT formuliert:

- Konzeptschärfungen,
- Projektaufträge,
- kleine Codex-Pakete,
- Prüf- und Abnahmefragen,
- Review-Bewertungen von Codex-Ergebnissen.

ChatGPT darf keine großen Mischaufträge formulieren.

### 3.3 Codex lokal / Worker lokal

Codex lokal eignet sich für:

- kleine Codepakete,
- lokale Tests,
- Arbeiten mit der vorhandenen Entwicklungsumgebung,
- schnelle Iterationen.

Codex lokal darf nur innerhalb des jeweiligen Paketauftrags arbeiten.

### 3.4 Codex Cloud / PR-Worker

Codex Cloud eignet sich für:

- klar abgegrenzte Branches,
- Pull Requests,
- Dokumentationspakete,
- isolierte Refactor-/Testpakete.

Codex Cloud darf nicht parallel an denselben Dateien arbeiten wie ein lokaler Codex-Lauf.

### 3.5 Zweitprüfer

Ein anderes Werkzeug oder ein zweiter Codex-/ChatGPT-Lauf darf für Review genutzt werden.

Der Zweitprüfer darf keine neuen Nebenaufträge erfinden.

---

## 4. Pflicht-Lesereihenfolge vor jedem Codex-Lauf

Vor jedem Codex-Lauf sind zwingend zu lesen:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `docs/Editor_1_Konzept_und_Vertrag.md`
6. `docs/Editor_1_Projektsteuerung_Anti_Kleinklein.md`

Wenn eine dieser Dateien nicht vorhanden ist, muss Codex dies melden und darf nicht raten.

---

## 5. Codex darf nicht sofort losarbeiten

Jeder Codex-Lauf muss zuerst eine kurze Startplanung ausgeben.

Pflichtformat:

```text
STARTPLANUNG

Gelesene Steuerungsdateien:
- ...

Ziel dieses Pakets:
- ...

Nicht-Ziele dieses Pakets:
- ...

Erlaubte Bereiche/Dateien:
- ...

Verbotene Bereiche/Dateien:
- ...

Geplante Prüfung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...
```

Erst danach darf Codex Änderungen durchführen.

Wenn Codex sofort mit Code beginnt, ist der Lauf ungültig.

---

## 6. Stop-Regeln

Codex muss stoppen, wenn eine dieser Situationen eintritt:

1. Der Auftrag widerspricht dem Konzeptvertrag.
2. Der Auftrag widerspricht diesem Steuerungsdokument.
3. Für die Aufgabe müsste eine verbotene Datei geändert werden.
4. Echte UI-/PDF-Laufwege müssten vorzeitig angefasst werden.
5. Eine Tabelle müsste ohne Tabellenvertrag angebunden werden.
6. Eine automatische DOM-/PDF-/CSS-Erkennung wäre nötig.
7. Der Auftrag ist zu groß für ein Paket.
8. Tests oder Nachweise sind nicht möglich.
9. Es entstehen Architekturentscheidungen, die nicht im Konzept stehen.
10. Codex müsste raten.

Bei Stop darf Codex keinen Workaround bauen.

Pflichtmeldung bei Stop:

```text
STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag für sauberen nächsten Schritt:
...
```

---

## 7. Harte Verbote für alle Pakete

Verboten sind:

- heimliches Ändern echter TOP-Listen,
- heimliches Ändern echter PDF-Ausgaben,
- Änderungen am Druckweg ohne ausdrücklichen Auftrag,
- Änderungen an bestehender UI ohne ausdrücklichen Auftrag,
- automatische Suche nach Tabellen im DOM,
- automatische Suche nach PDF-Tabellen,
- Speicherschlüssel aus CSS-Klassen ableiten,
- Speicherschlüssel aus sichtbaren Überschriften ableiten,
- Speicherschlüssel aus DOM-Reihenfolge ableiten,
- Sonderlogik pro Tabelle ohne Tabellenvertrag,
- automatische UI/PDF-Gleichmachung,
- automatische Layoutoptimierung,
- heimliche Übernahme von UI-Werten nach PDF oder umgekehrt,
- Endbenutzerfunktionen für Editor 1,
- Toolbar/Marker im normalen App-Laufweg,
- neue Zielarchitektur erfinden,
- große Refactorings nebenbei.

---

## 8. Erlaubte Grundlogik

Jede bearbeitbare Tabelle folgt später demselben Muster:

```text
Tabelle anmelden
Tabellenvertrag definieren
Varianten definieren
Spalten definieren
Defaultwerte definieren
Editor liest Vertrag
Editor bearbeitet nur Werte
Editor speichert Werte
echte Tabelle liest gespeicherte Werte separat
```

Wenn für eine Tabelle ein anderer Ablauf vorgeschlagen wird, muss dies gestoppt und geprüft werden.

---

## 9. Standard-Paketformat

Jeder spätere Codex-Auftrag muss dieses Format haben:

```text
Paketname:
...

Ziel:
...

Nicht-Ziel:
...

Erlaubte Bereiche:
...

Verbotene Bereiche:
...

Konkrete Aufgaben:
1. ...
2. ...
3. ...

Abnahmekriterien:
- ...

Tests/Prüfung:
- ...

Abschlussbericht muss enthalten:
- geänderte Dateien,
- was umgesetzt wurde,
- was ausdrücklich nicht geändert wurde,
- welche Tests gelaufen sind,
- offene Punkte,
- nächster empfohlener Schritt.
```

Ohne dieses Format wird kein Codex-Auftrag gestartet.

---

## 10. Dateigrenzen je Phase

### Phase 0 – Konzept und Steuerung

Erlaubt:

- `docs/Editor_1_Konzept_und_Vertrag.md`
- `docs/Editor_1_Projektsteuerung_Anti_Kleinklein.md`
- `AGENTS.md`
- `ZUERST_LESEN_Codex.md`

Verboten:

- App-Code,
- Tests,
- echte UI,
- echte PDF-Ausgaben.

---

### Phase 1 – Fundament

Erlaubt, nach konkreter Repo-Prüfung anzupassen:

- neuer Bereich für Editor-1-Grundlagen,
- neue Tests,
- Dokumentation.

Typischer Zielbereich:

```text
src/renderer/modules/layoutTools/editor1/
scripts/tests/
docs/
```

Verboten:

- echte TOP-Liste,
- echte PDF-Ausgabe,
- Druckweg,
- ToDo-Druck,
- Teilnehmerliste,
- bestehende Tabellen-Renderer,
- sichtbare Editor-UI.

---

### Phase 2 – Dummy-Beweis

Erlaubt:

- Dummy-Tabelle,
- Dummy-Daten,
- Tests,
- isolierte Preview-Hilfen ohne echte App-Laufwege.

Verboten:

- echte Fachmodule anschließen,
- Protokoll-TOP-Liste anschließen,
- echten Druckweg ändern.

---

### Phase 3 – Isolierte DEV-only Editor-Oberfläche

Erlaubt:

- eigene Editor-1-Oberfläche,
- DEV-only Einstieg,
- Auswahl einer registrierten Dummy-/Testtabelle,
- Bearbeitung der erlaubten Werte,
- Speichern/Abbrechen/Reset im Editor-Kontext.

Verboten:

- Editor in normale Fachmodule einbauen,
- Toolbar in echte Tabellen einbauen,
- Endbenutzer sichtbar machen,
- Druckweg ändern.

---

### Phase 4 – Erste echte einfache Tabelle

Erlaubt:

- genau eine einfache echte Tabelle anschließen,
- nur über Tabellenvertrag,
- nur eine klar benannte Variante,
- Tests ergänzen.

Verboten:

- mehrere Tabellen gleichzeitig,
- TOP/PDF-Komplexstrecken ohne Musterbeweis,
- Sonderlogik außerhalb des Vertrags.

---

### Phase 5 – TOP/PDF-Anschluss

Erlaubt:

- nur nach erfolgreichem Dummy-Beweis und erster einfacher echter Tabelle,
- genau eine definierte TOP-Variante pro Paket,
- gespeicherte Werte separat lesen.

Verboten:

- Druckweg ersetzen,
- PDF-Vorschau kapern,
- UI/PDF automatisch angleichen,
- mehrere Varianten gleichzeitig ohne ausdrückliche Freigabe.

---

## 11. Abnahmekriterien je Paket

Ein Paket ist nur abgenommen, wenn alle Punkte erfüllt sind:

1. Ziel wurde erfüllt.
2. Nicht-Ziele wurden eingehalten.
3. Verbotene Bereiche wurden nicht angefasst.
4. Geänderte Dateien sind nachvollziehbar.
5. Tests wurden genannt und ausgeführt, soweit möglich.
6. Keine neue Sonderarchitektur wurde erfunden.
7. Der nächste Schritt ist klar.
8. Der Abschlussbericht ist für einen Laien verständlich.

Wenn ein Punkt fehlt, wird das Paket nicht weiterverwendet.

---

## 12. Abschlussbericht von Codex

Codex muss nach jedem Lauf berichten:

```text
ABSCHLUSSBERICHT

Geänderte Dateien:
- ...

Umgesetzt:
- ...

Ausdrücklich nicht geändert:
- ...

Tests/Prüfung:
- ...

Risiken/Restpunkte:
- ...

Nächster sinnvoller Schritt:
- ...
```

Nicht ausreichend sind Aussagen wie:

- „sollte passen“,
- „ich habe einiges angepasst“,
- „kleine Verbesserungen“,
- „nebenbei bereinigt“.

---

## 13. Prüf-Fragen für den Nutzer

Der Nutzer muss nach einem Codex-Lauf nur diese Fragen prüfen:

```text
1. Welche Dateien wurden geändert?
2. Waren diese Dateien im Auftrag erlaubt?
3. Wurden TOP-Liste, PDF oder Druckweg unerlaubt geändert?
4. Gibt es Tests oder eine klare Prüfung?
5. Hat Codex erklärt, was ausdrücklich nicht geändert wurde?
6. Ist der nächste Schritt logisch?
```

Wenn eine Antwort unklar ist, wird nicht weitergebaut.

---

## 14. Umgang mit lokalen und Cloud-Läufen

### 14.1 Kein Parallelchaos

Codex lokal und Codex Cloud dürfen nicht gleichzeitig an denselben Bereichen arbeiten.

Ein Paket läuft entweder lokal oder in der Cloud.

### 14.2 Lokale Läufe

Lokal ist bevorzugt für:

- Tests,
- schnelle kleine Codeänderungen,
- Arbeiten mit vorhandener lokaler App,
- Pakete mit direktem `npm test`.

### 14.3 Cloud-Läufe

Cloud ist bevorzugt für:

- isolierte PRs,
- reine Dokumentationspakete,
- Tests/Refactors mit klaren Dateigrenzen,
- externe Reviewfähigkeit.

### 14.4 Übergabe zwischen lokal und Cloud

Vor Wechsel zwischen lokal und Cloud muss der Arbeitsstand sauber sein:

```powershell
git status --short --branch
```

Es darf keine unklare Mischung aus lokalen Änderungen und Cloud-PR geben.

---

## 15. Branch- und Paketregel

Grundsatz:

```text
1 Paket = 1 Branch = 1 Commit = 1 Merge
```

Keine Sammelbranches für mehrere Phasen.

Keine Vermischung von Dokumentation, Fundament, echter UI und PDF in einem Paket.

---

## 16. Reihenfolge der Umsetzung

Verbindliche Reihenfolge:

1. Konzeptvertrag finalisieren.
2. Anti-Kleinklein-Steuerungsdokument finalisieren.
3. Pflichtlese-Hinweis in `AGENTS.md` / `ZUERST_LESEN_Codex.md` ergänzen.
4. Projektauftrag Editor 1 formulieren.
5. Repo-Bestandsaufnahme durchführen.
6. Teil 1 Fundament bauen.
7. Tests für Fundament prüfen.
8. Dummy-Referenz bauen.
9. Isolierte Editor-UI bauen.
10. Erste einfache echte Tabelle anschließen.
11. Erst danach TOP/PDF schrittweise anschließen.
12. Weitere Tabellen nur nach Muster anschließen.

---

## 17. Kein Raten

Wenn eine Information fehlt, wird nicht geraten.

Codex muss dann melden:

```text
Information fehlt:
...
Warum relevant:
...
Sicherer nächster Schritt:
...
```

Ein fehlender Pfad, ein unbekannter Renderer oder eine unklare Speicherstruktur darf nicht durch Vermutungen ersetzt werden.

---

## 18. Maßstab für Professionalität

Professionell ist nicht:

- möglichst viel auf einmal bauen,
- schnell sichtbare UI zeigen,
- bestehende Wege kapern,
- Fehler später reparieren,
- pro Tabelle improvisieren.

Professionell ist:

- klein schneiden,
- Verträge definieren,
- Tests schreiben,
- Seiteneffekte verhindern,
- Dummy zuerst,
- echte App erst nach Musterbeweis,
- bei Unsicherheit stoppen.

---

## 19. Freigabeprinzip

Kein Paket wird automatisch als Basis für das nächste Paket verwendet.

Nach jedem Paket erfolgt eine Freigabeentscheidung:

```text
Freigabe: ja / nein / nacharbeiten
Grund:
...
Nächster Auftrag:
...
```

---

## 20. Kurzfassung

```text
Editor 1 wird nicht groß gebaut.
Editor 1 wird geführt gebaut.

Jeder Lauf liest zuerst die Regeln.
Jeder Lauf nennt Ziel, Nicht-Ziel, erlaubte und verbotene Bereiche.
Jeder Lauf verändert nur eine Schicht.
Jeder Lauf liefert Tests oder prüfbare Nachweise.
Jeder Lauf berichtet verständlich.

Keine echte UI/PDF-Kaperung.
Keine DOM-Raterei.
Keine Sonderlösung pro Tabelle.
Kein automatischer UI/PDF-Gleichmacher.
Keine großen Mischaufträge.

Bei Konflikt: stoppen.
Bei Unsicherheit: stoppen.
Bei verbotenen Bereichen: stoppen.
```
