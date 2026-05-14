# Editor 1 â€“ Projektsteuerung und Anti-Kleinklein-Regeln

Stand: 14.05.2026  
Projekt: BBM-Produktiv / layoutTools / Editor 1  
Zweck: Steuerungsdokument gegen unkontrollierte Kleinarbeit, SonderlÃ¶sungen und versehentliche Eingriffe in echte UI-/PDF-Laufwege.

---

## 0. Einordnung

Dieses Dokument ist kein Fachkonzept und kein Implementierungsauftrag.

Dieses Dokument ist die verbindliche Arbeitsregel fÃ¼r alle spÃ¤teren Arbeiten an **Editor 1**.

Es beantwortet nicht die Frage:

> Was soll der Tabelleneditor fachlich kÃ¶nnen?

Diese Frage steht im Konzeptvertrag:

- `docs/Konzept_und_Vertrag_FINAL.md`

Dieses Dokument beantwortet die Frage:

> Wie verhindern wir, dass die Umsetzung wieder in Kleinklein, Sonderlogik und unkontrollierte Eingriffe abgleitet?

---

## 1. Oberste Regel

**Ein Auftrag darf immer nur eine Schicht verÃ¤ndern.**

Erlaubte Schichten sind zum Beispiel:

1. Konzept / Dokumentation
2. Datenmodell / Vertrag
3. Registry / Speicherstruktur
4. PlausibilitÃ¤tslogik
5. Tests
6. Dummy-Referenz
7. isolierte DEV-only Editor-UI
8. Anschluss einer einzelnen echten Tabelle
9. Anschluss einer einzelnen echten PDF-Variante

Nicht erlaubt ist ein Mischauftrag wie:

```text
Baue den Tabelleneditor komplett und schlieÃŸe TOP-Liste, PDF und UI direkt an.
```

Solche AuftrÃ¤ge sind zu groÃŸ und werden nicht ausgefÃ¼hrt.

---

## 2. Zielbild der Projektsteuerung

Editor 1 wird nicht in einem groÃŸen Entwicklungslauf gebaut.

Editor 1 wird in kleinen, prÃ¼fbaren Paketen umgesetzt.

Jedes Paket muss:

- ein klares Ziel haben,
- klare Nicht-Ziele haben,
- erlaubte Bereiche nennen,
- verbotene Bereiche nennen,
- Tests oder prÃ¼fbare Nachweise liefern,
- nach Abschluss verstÃ¤ndlich berichten,
- ohne Seiteneffekte in echter UI/PDF bleiben, solange das Paket dies nicht ausdrÃ¼cklich erlaubt.

---

## 3. Rollen

### 3.1 Nutzer / Auftraggeber

Der Nutzer muss nicht programmieren.

Der Nutzer entscheidet nur:

- Ist der Auftrag fachlich richtig begrenzt?
- Wurden verbotene Bereiche angefasst?
- Gibt es eine verstÃ¤ndliche Abschlussmeldung?
- Sind die Tests grÃ¼n?
- Ist der nÃ¤chste Schritt logisch vorbereitet?

### 3.2 ChatGPT / Supervisor

ChatGPT formuliert:

- KonzeptschÃ¤rfungen,
- ProjektauftrÃ¤ge,
- kleine Codex-Pakete,
- PrÃ¼f- und Abnahmefragen,
- Review-Bewertungen von Codex-Ergebnissen.

ChatGPT darf keine groÃŸen MischauftrÃ¤ge formulieren.

### 3.3 Codex lokal / Worker lokal

Codex lokal eignet sich fÃ¼r:

- kleine Codepakete,
- lokale Tests,
- Arbeiten mit der vorhandenen Entwicklungsumgebung,
- schnelle Iterationen.

Codex lokal darf nur innerhalb des jeweiligen Paketauftrags arbeiten.

### 3.4 Codex Cloud / PR-Worker

Codex Cloud eignet sich fÃ¼r:

- klar abgegrenzte Branches,
- Pull Requests,
- Dokumentationspakete,
- isolierte Refactor-/Testpakete.

Codex Cloud darf nicht parallel an denselben Dateien arbeiten wie ein lokaler Codex-Lauf.

### 3.5 ZweitprÃ¼fer

Ein anderes Werkzeug oder ein zweiter Codex-/ChatGPT-Lauf darf fÃ¼r Review genutzt werden.

Der ZweitprÃ¼fer darf keine neuen NebenauftrÃ¤ge erfinden.

---

## 4. Pflicht-Lesereihenfolge vor jedem Codex-Lauf

Vor jedem Codex-Lauf sind zwingend zu lesen:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `docs/Konzept_und_Vertrag_FINAL.md`
6. `docs/Projektsteuerung_Anti_Kleinklein.md`

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

Geplante PrÃ¼fung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...
```

Erst danach darf Codex Ã„nderungen durchfÃ¼hren.

Wenn Codex sofort mit Code beginnt, ist der Lauf ungÃ¼ltig.

---

## 6. Stop-Regeln

Codex muss stoppen, wenn eine dieser Situationen eintritt:

1. Der Auftrag widerspricht dem Konzeptvertrag.
2. Der Auftrag widerspricht diesem Steuerungsdokument.
3. FÃ¼r die Aufgabe mÃ¼sste eine verbotene Datei geÃ¤ndert werden.
4. Echte UI-/PDF-Laufwege mÃ¼ssten vorzeitig angefasst werden.
5. Eine Tabelle mÃ¼sste ohne Tabellenvertrag angebunden werden.
6. Eine automatische DOM-/PDF-/CSS-Erkennung wÃ¤re nÃ¶tig.
7. Der Auftrag ist zu groÃŸ fÃ¼r ein Paket.
8. Tests oder Nachweise sind nicht mÃ¶glich.
9. Es entstehen Architekturentscheidungen, die nicht im Konzept stehen.
10. Codex mÃ¼sste raten.

Bei Stop darf Codex keinen Workaround bauen.

Pflichtmeldung bei Stop:

```text
STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag fÃ¼r sauberen nÃ¤chsten Schritt:
...
```

---

## 7. Harte Verbote fÃ¼r alle Pakete

Verboten sind:

- heimliches Ã„ndern echter TOP-Listen,
- heimliches Ã„ndern echter PDF-Ausgaben,
- Ã„nderungen am Druckweg ohne ausdrÃ¼cklichen Auftrag,
- Ã„nderungen an bestehender UI ohne ausdrÃ¼cklichen Auftrag,
- automatische Suche nach Tabellen im DOM,
- automatische Suche nach PDF-Tabellen,
- SpeicherschlÃ¼ssel aus CSS-Klassen ableiten,
- SpeicherschlÃ¼ssel aus sichtbaren Ãœberschriften ableiten,
- SpeicherschlÃ¼ssel aus DOM-Reihenfolge ableiten,
- Sonderlogik pro Tabelle ohne Tabellenvertrag,
- automatische UI/PDF-Gleichmachung,
- automatische Layoutoptimierung,
- heimliche Ãœbernahme von UI-Werten nach PDF oder umgekehrt,
- Endbenutzerfunktionen fÃ¼r Editor 1,
- Toolbar/Marker im normalen App-Laufweg,
- neue Zielarchitektur erfinden,
- groÃŸe Refactorings nebenbei.

---

## 8. Erlaubte Grundlogik

Jede bearbeitbare Tabelle folgt spÃ¤ter demselben Muster:

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

Wenn fÃ¼r eine Tabelle ein anderer Ablauf vorgeschlagen wird, muss dies gestoppt und geprÃ¼ft werden.

---

## 9. Standard-Paketformat

Jeder spÃ¤tere Codex-Auftrag muss dieses Format haben:

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

Tests/PrÃ¼fung:
- ...

Abschlussbericht muss enthalten:
- geÃ¤nderte Dateien,
- was umgesetzt wurde,
- was ausdrÃ¼cklich nicht geÃ¤ndert wurde,
- welche Tests gelaufen sind,
- offene Punkte,
- nÃ¤chster empfohlener Schritt.
```

Ohne dieses Format wird kein Codex-Auftrag gestartet.

---

## 10. Dateigrenzen je Phase

### Phase 0 â€“ Konzept und Steuerung

Erlaubt:

- `docs/Konzept_und_Vertrag_FINAL.md`
- `docs/Projektsteuerung_Anti_Kleinklein.md`
- `AGENTS.md`
- `ZUERST_LESEN_Codex.md`

Verboten:

- App-Code,
- Tests,
- echte UI,
- echte PDF-Ausgaben.

---

### Phase 1 â€“ Fundament

Erlaubt, nach konkreter Repo-PrÃ¼fung anzupassen:

- neuer Bereich fÃ¼r Editor-1-Grundlagen,
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

### Phase 2 â€“ Dummy-Beweis

Erlaubt:

- Dummy-Tabelle,
- Dummy-Daten,
- Tests,
- isolierte Preview-Hilfen ohne echte App-Laufwege.

Verboten:

- echte Fachmodule anschlieÃŸen,
- Protokoll-TOP-Liste anschlieÃŸen,
- echten Druckweg Ã¤ndern.

---

### Phase 3 â€“ Isolierte DEV-only Editor-OberflÃ¤che

Erlaubt:

- eigene Editor-1-OberflÃ¤che,
- DEV-only Einstieg,
- Auswahl einer registrierten Dummy-/Testtabelle,
- Bearbeitung der erlaubten Werte,
- Speichern/Abbrechen/Reset im Editor-Kontext.

Verboten:

- Editor in normale Fachmodule einbauen,
- Toolbar in echte Tabellen einbauen,
- Endbenutzer sichtbar machen,
- Druckweg Ã¤ndern.

---

### Phase 4 â€“ Erste echte einfache Tabelle

Erlaubt:

- genau eine einfache echte Tabelle anschlieÃŸen,
- nur Ã¼ber Tabellenvertrag,
- nur eine klar benannte Variante,
- Tests ergÃ¤nzen.

Verboten:

- mehrere Tabellen gleichzeitig,
- TOP/PDF-Komplexstrecken ohne Musterbeweis,
- Sonderlogik auÃŸerhalb des Vertrags.

---

### Phase 5 â€“ TOP/PDF-Anschluss

Erlaubt:

- nur nach erfolgreichem Dummy-Beweis und erster einfacher echter Tabelle,
- genau eine definierte TOP-Variante pro Paket,
- gespeicherte Werte separat lesen.

Verboten:

- Druckweg ersetzen,
- PDF-Vorschau kapern,
- UI/PDF automatisch angleichen,
- mehrere Varianten gleichzeitig ohne ausdrÃ¼ckliche Freigabe.

---

## 11. Abnahmekriterien je Paket

Ein Paket ist nur abgenommen, wenn alle Punkte erfÃ¼llt sind:

1. Ziel wurde erfÃ¼llt.
2. Nicht-Ziele wurden eingehalten.
3. Verbotene Bereiche wurden nicht angefasst.
4. GeÃ¤nderte Dateien sind nachvollziehbar.
5. Tests wurden genannt und ausgefÃ¼hrt, soweit mÃ¶glich.
6. Keine neue Sonderarchitektur wurde erfunden.
7. Der nÃ¤chste Schritt ist klar.
8. Der Abschlussbericht ist fÃ¼r einen Laien verstÃ¤ndlich.

Wenn ein Punkt fehlt, wird das Paket nicht weiterverwendet.

---

## 12. Abschlussbericht von Codex

Codex muss nach jedem Lauf berichten:

```text
ABSCHLUSSBERICHT

GeÃ¤nderte Dateien:
- ...

Umgesetzt:
- ...

AusdrÃ¼cklich nicht geÃ¤ndert:
- ...

Tests/PrÃ¼fung:
- ...

Risiken/Restpunkte:
- ...

NÃ¤chster sinnvoller Schritt:
- ...
```

Nicht ausreichend sind Aussagen wie:

- â€žsollte passenâ€œ,
- â€žich habe einiges angepasstâ€œ,
- â€žkleine Verbesserungenâ€œ,
- â€žnebenbei bereinigtâ€œ.

---

## 13. PrÃ¼f-Fragen fÃ¼r den Nutzer

Der Nutzer muss nach einem Codex-Lauf nur diese Fragen prÃ¼fen:

```text
1. Welche Dateien wurden geÃ¤ndert?
2. Waren diese Dateien im Auftrag erlaubt?
3. Wurden TOP-Liste, PDF oder Druckweg unerlaubt geÃ¤ndert?
4. Gibt es Tests oder eine klare PrÃ¼fung?
5. Hat Codex erklÃ¤rt, was ausdrÃ¼cklich nicht geÃ¤ndert wurde?
6. Ist der nÃ¤chste Schritt logisch?
```

Wenn eine Antwort unklar ist, wird nicht weitergebaut.

---

## 14. Umgang mit lokalen und Cloud-LÃ¤ufen

### 14.1 Kein Parallelchaos

Codex lokal und Codex Cloud dÃ¼rfen nicht gleichzeitig an denselben Bereichen arbeiten.

Ein Paket lÃ¤uft entweder lokal oder in der Cloud.

### 14.2 Lokale LÃ¤ufe

Lokal ist bevorzugt fÃ¼r:

- Tests,
- schnelle kleine CodeÃ¤nderungen,
- Arbeiten mit vorhandener lokaler App,
- Pakete mit direktem `npm test`.

### 14.3 Cloud-LÃ¤ufe

Cloud ist bevorzugt fÃ¼r:

- isolierte PRs,
- reine Dokumentationspakete,
- Tests/Refactors mit klaren Dateigrenzen,
- externe ReviewfÃ¤higkeit.

### 14.4 Ãœbergabe zwischen lokal und Cloud

Vor Wechsel zwischen lokal und Cloud muss der Arbeitsstand sauber sein:

```powershell
git status --short --branch
```

Es darf keine unklare Mischung aus lokalen Ã„nderungen und Cloud-PR geben.

---

## 15. Branch- und Paketregel

Grundsatz:

```text
1 Paket = 1 Branch = 1 Commit = 1 Merge
```

Keine Sammelbranches fÃ¼r mehrere Phasen.

Keine Vermischung von Dokumentation, Fundament, echter UI und PDF in einem Paket.

---

## 16. Reihenfolge der Umsetzung

Verbindliche Reihenfolge:

1. Konzeptvertrag finalisieren.
2. Anti-Kleinklein-Steuerungsdokument finalisieren.
3. Pflichtlese-Hinweis in `AGENTS.md` / `ZUERST_LESEN_Codex.md` ergÃ¤nzen.
4. Projektauftrag Editor 1 formulieren.
5. Repo-Bestandsaufnahme durchfÃ¼hren.
6. Teil 1 Fundament bauen.
7. Tests fÃ¼r Fundament prÃ¼fen.
8. Dummy-Referenz bauen.
9. Isolierte Editor-UI bauen.
10. Erste einfache echte Tabelle anschlieÃŸen.
11. Erst danach TOP/PDF schrittweise anschlieÃŸen.
12. Weitere Tabellen nur nach Muster anschlieÃŸen.

---

## 17. Kein Raten

Wenn eine Information fehlt, wird nicht geraten.

Codex muss dann melden:

```text
Information fehlt:
...
Warum relevant:
...
Sicherer nÃ¤chster Schritt:
...
```

Ein fehlender Pfad, ein unbekannter Renderer oder eine unklare Speicherstruktur darf nicht durch Vermutungen ersetzt werden.

---

## 18. MaÃŸstab fÃ¼r ProfessionalitÃ¤t

Professionell ist nicht:

- mÃ¶glichst viel auf einmal bauen,
- schnell sichtbare UI zeigen,
- bestehende Wege kapern,
- Fehler spÃ¤ter reparieren,
- pro Tabelle improvisieren.

Professionell ist:

- klein schneiden,
- VertrÃ¤ge definieren,
- Tests schreiben,
- Seiteneffekte verhindern,
- Dummy zuerst,
- echte App erst nach Musterbeweis,
- bei Unsicherheit stoppen.

---

## 19. Freigabeprinzip

Kein Paket wird automatisch als Basis fÃ¼r das nÃ¤chste Paket verwendet.

Nach jedem Paket erfolgt eine Freigabeentscheidung:

```text
Freigabe: ja / nein / nacharbeiten
Grund:
...
NÃ¤chster Auftrag:
...
```

---

## 20. Kurzfassung

```text
Editor 1 wird nicht groÃŸ gebaut.
Editor 1 wird gefÃ¼hrt gebaut.

Jeder Lauf liest zuerst die Regeln.
Jeder Lauf nennt Ziel, Nicht-Ziel, erlaubte und verbotene Bereiche.
Jeder Lauf verÃ¤ndert nur eine Schicht.
Jeder Lauf liefert Tests oder prÃ¼fbare Nachweise.
Jeder Lauf berichtet verstÃ¤ndlich.

Keine echte UI/PDF-Kaperung.
Keine DOM-Raterei.
Keine SonderlÃ¶sung pro Tabelle.
Kein automatischer UI/PDF-Gleichmacher.
Keine groÃŸen MischauftrÃ¤ge.

Bei Konflikt: stoppen.
Bei Unsicherheit: stoppen.
Bei verbotenen Bereichen: stoppen.
```

