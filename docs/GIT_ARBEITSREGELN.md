# Git-Arbeitsregeln für BBM

Stand: 2026-08-17

Diese Regeln gelten verbindlich für **alle ChatGPT-Chats, Codex-Läufe und manuellen Git-Arbeiten** im Repository `BBM-Produktiv`.

Ziel: Parallelentwicklung an mehreren Rechnern und mehreren BBM-Themen ermöglichen, ohne Branch-Vermischung, Rückfall auf alte Stände oder verlorene Arbeit.

## 1. `main` ist die gemeinsame Produktbasis

- `main` enthält nur freigegebenen, funktionierenden Produktstand.
- Auf `main` wird **nicht fachlich entwickelt**.
- Neue Arbeit startet grundsätzlich von einem aktuellen `origin/main`.
- Vor neuer Arbeit muss geprüft werden, ob der lokale `main` aktuell ist.

## 2. Ein Branch = ein fachliches Ziel

Ein Arbeitsbranch darf genau ein klar benanntes Ziel verfolgen.

Beispiele:

- `rechnung-entwicklung`
- `editor-pdf-bedienung`
- `firmenlogik`

Verboten ist, unabhängige Themen wie Rechnung, Protokoll, Tabelleneditor, PDF oder Restarbeiten ungeplant auf demselben Branch zu vermischen.

Wenn ein neues Thema beginnt, wird dafür ein eigener Branch angelegt.

## 3. Vor Beginn eines neuen Fachbranches synchronisieren

Bevor ein **neuer Fachbranch** oder ein neuer, unabhängiger Goal-Strang begonnen wird, sind mindestens auszuführen:

```powershell
git fetch
git status --short
git branch --show-current
git log --oneline HEAD..origin/main
```

Auswertung:

- `git status --short` muss leer sein oder die vorhandenen Änderungen müssen vorher bewusst gesichert werden.
- Ein neuer Fachbranch wird grundsätzlich von aktuellem `origin/main` angelegt.
- Zeigt `git log --oneline HEAD..origin/main` Commits, darf daraus nicht ungeprüft ein neuer Fachbranch gestartet werden.

**Wichtig:** Diese Regel bedeutet ausdrücklich **nicht**, dass ein bereits laufender Fachbranch vor jedem weiteren Goal-Lauf mit `main` synchronisiert werden muss.

## 4. Aktive Feature-Branches während eines laufenden Arbeitsblocks einfrieren

Ein laufender Fachbranch bleibt während eines zusammenhängenden Arbeitsblocks auf seinem definierten Unterbau.

Beispiel:

- `rechnung-entwicklung` wird auf dem Acer fachlich weiterentwickelt.
- Während dieses Rechnungsblocks darf `main` auf einem anderen Rechner durch freigegebene Editor-/PDF-Arbeiten weiterlaufen.
- Diese neuen `main`-Commits werden **nicht automatisch mitten in die laufende Rechnungsentwicklung gemergt**.

Verbindliche Regel:

> **Aktive Feature-Branches werden während eines laufenden Goal-/Entwicklungsblocks nicht mit `main` synchronisiert. Die Synchronisierung erfolgt erst an einem ausdrücklich festgelegten Meilenstein vor Integration oder wenn die aktuelle Arbeit zwingend auf einer neuen `main`-Änderung aufbauen muss.**

Damit wird verhindert, dass sich während einer laufenden Fachentwicklung der technische Unterbau unerwartet verändert und bereits getestete Zwischenstände unklar werden.

Ein Branch darf daher bewusst hinter `main` liegen. Das ist **kein Fehler**, solange:

- der Rückstand bekannt ist,
- der Branch nur sein eigenes Fachziel weiterentwickelt,
- keine neue Arbeit begonnen wird, die die neueren `main`-Änderungen benötigt,
- vor der späteren Integration eine kontrollierte Synchronisierung erfolgt.

## 5. Synchronisierung am Meilenstein

Ein aktiver Fachbranch wird mit `main` synchronisiert, wenn ein definierter Meilenstein erreicht ist, z. B.:

- Fachfunktion bzw. Goal-Block ist abgeschlossen,
- Zwischenstand ist committed und gepusht,
- vor Integration in `main`,
- oder eine neue `main`-Änderung wird für die weitere Facharbeit ausdrücklich benötigt.

Vor der Synchronisierung:

```powershell
git fetch
git status --short
git log --oneline HEAD..origin/main
```

Dann auf dem Fachbranch bewusst:

```powershell
git merge origin/main --no-edit
```

Keine blinden `git pull`-Aktionen auf Fachbranches.

Bei Konflikten:

- nicht pauschal `ours` oder `theirs` wählen,
- fachliche Änderungen beider Seiten erhalten,
- Konflikte gezielt auflösen,
- anschließend Tests und `git diff --check` ausführen.

Nach dem Merge muss der Fachbereich erneut fachlich geprüft werden, bevor er nach `main` integriert wird.

## 6. Neue Fachbranches nicht von veralteten Feature-Branches ableiten

Neue Arbeit grundsätzlich von aktuellem `origin/main` starten.

Ausnahme: Ein neuer Branch ist ausdrücklich ein Unter-/Integrationsbranch eines bestehenden Fachbranches. Dann muss das im Auftrag klar benannt sein.

## 7. Codex arbeitet nur im vereinbarten Scope

Jeder größere Codex-Auftrag muss enthalten:

- Ziel,
- erlaubte Bereiche,
- Nicht-Ziele,
- verbotene Bereiche,
- Abschlusskriterien,
- relevante Tests.

Bereiche außerhalb des Auftrags dürfen nicht „bei Gelegenheit“ mitgeändert werden.

Beispiel:

> Keine Protokoll-, Restarbeiten-, PDF-, UI-Editor- oder Lizenzänderungen.

## 8. Große Codex-Läufe zuerst auf Prüf-/Arbeitsbranch

Bei riskanten Integrationen oder größeren Umbauten:

1. sauberen Prüfbranch anlegen,
2. Codex dort arbeiten lassen,
3. fachlich und technisch prüfen,
4. erst danach per Fast-Forward oder bewusstem Merge in den eigentlichen Fachbranch übernehmen.

Kein direkter großer Umbau auf `main`.

## 9. Bestehende, bereits abgenommene Fixes nicht neu programmieren

Wenn ein Fehler auf einem Branch wieder auftaucht, zuerst prüfen:

- fehlt ein bereits vorhandener Commit aus `main`?
- ist der Branch bewusst auf einem älteren, eingefrorenen Unterbau?
- stammt die Regression aus Branch-Divergenz?

Erst danach Code ändern.

Bereits abgenommene Lösungen dürfen nicht unnötig neu implementiert werden.

## 10. Nach jedem Codex-Lauf sauber abschließen

Mindestens:

```powershell
git status --short
git diff --check
git log --oneline -5
```

Dann:

- relevante Tests ausführen,
- Änderungen committen,
- auf den richtigen Remote-Branch pushen,
- Arbeitsbaum sauber hinterlassen.

Uncommittete Änderungen dürfen nicht über längere Zeit unklar liegen bleiben.

## 11. Temporäre Branches nach Abschluss aufräumen

Prüf-, Integrations- und Step-Branches werden nach erfolgreicher Übernahme gelöscht.

Vor dem Löschen muss geklärt sein:

- Ist ihr fachlicher Inhalt vollständig übernommen oder bewusst verworfen?
- Gibt es noch exklusive Commits?
- Ist der Zielbranch gepusht und sauber?

Keine alten Branches nur „zur Sicherheit“ dauerhaft weiterführen.

## 12. Backup-Branches nur für riskante Umbauten

Vor riskanten History-/Branch-Bereinigungen darf ein Backup-Branch angelegt werden, z. B.:

`backup/rechnung-entwicklung-vor-bereinigung-2026-08-16`

Ein Backup-Branch:

- wird nicht als normaler Arbeitsbranch weiterentwickelt,
- wird klar als Backup benannt,
- bleibt nur so lange erhalten, wie er als Sicherheitsnetz sinnvoll ist.

## 13. Mehrere Rechner dürfen unterschiedliche Fachbranches haben

Es ist ausdrücklich erlaubt und gewollt, dass z. B.:

- Lenovo/ThinkPad auf `main` oder einem Editor-Branch arbeitet,
- Acer auf `rechnung-entwicklung` arbeitet.

Entscheidend ist:

- beide kennen den Remote-Stand von `origin/main`,
- ein laufender Fachbranch darf bewusst hinter `main` bleiben,
- Synchronisierung erfolgt am definierten Meilenstein, nicht mitten im laufenden Arbeitsblock,
- derselbe Fachbranch wird nicht unkoordiniert parallel auf zwei Rechnern weiterentwickelt.

## 14. Vor Arbeit auf einem zweiten Rechner immer Remote-Stand prüfen

Mindestens:

```powershell
git fetch --prune
git branch --show-current
git status --short
git branch -vv
```

Nicht einfach davon ausgehen, dass der lokale Clone aktuell ist.

Die Prüfung dient zunächst der **Kenntnis des Zustands**. Ein festgestellter Rückstand eines bewusst laufenden Feature-Branches löst nicht automatisch einen Merge aus.

## 15. Kein Force-Push ohne Sicherung und ausdrücklichen Grund

`git push --force` ist verboten.

Wenn eine Branch-Historie bewusst ersetzt werden muss:

- vorher Backup-Branch anlegen und pushen,
- nur `git push --force-with-lease` verwenden,
- danach Remote-Stand prüfen.

## 16. Artefakte und Diagnosematerial nicht ungeprüft committen

Screenshots, Logs, temporäre PDFs und Testartefakte gehören nur dann ins Repository, wenn sie ausdrücklich Teil der Dokumentation oder des Tests sind.

Vor `git add -A` prüfen, ob `artifacts/`, Logs oder temporäre Dateien versehentlich aufgenommen würden.

## 17. Standardablauf vor einem neuen Fachbranch / neuen unabhängigen Goal-Strang

```text
1. git fetch
2. git status --short
3. git branch --show-current
4. git log --oneline HEAD..origin/main
5. neuen Branch von aktuellem origin/main anlegen
6. Scope des Auftrags festlegen
7. erst dann Codex starten
```

## 18. Standardablauf auf einem bereits laufenden Fachbranch

```text
1. git fetch
2. git status --short
3. git branch --show-current
4. Remote-/main-Rückstand nur feststellen
5. NICHT automatisch main hineinmergen
6. vorhandenen Fachblock auf seinem definierten Unterbau fortsetzen
7. nach Goal: testen, committen, pushen
8. Synchronisierung erst am festgelegten Meilenstein
```

## 19. Standardablauf nach Codex

```text
1. fachliche Sichtprüfung
2. relevante Tests
3. git diff --check
4. git status --short
5. Commit
6. Push
7. temporäre Branches/Worktrees aufräumen
```

## Harte Stop-Regeln

Nicht weiterarbeiten, sondern zuerst klären, wenn:

- der Arbeitsbaum unerwartet dirty ist,
- der aktuelle Branch unklar ist,
- ein **neuer** Fachbranch von einem veralteten Stand gestartet werden soll,
- ein laufender Fachbranch ungeplant mitten im Arbeitsblock mit `main` synchronisiert werden soll,
- derselbe Fachbereich bereits auf einem anderen Branch/Rechner parallel geändert wird,
- ein Merge Konflikte erzeugt,
- alte und neue Architektur gleichzeitig auftauchen,
- ein vermeintlicher Bug möglicherweise nur durch Branch-Divergenz entstanden ist.

## Kurzform

**`main` ist die gemeinsame freigegebene Basis. Ein Branch = ein Ziel. Neue Fachbranches starten von aktuellem `main`. Laufende Fachbranches bleiben während ihres Arbeitsblocks eingefroren und werden erst am definierten Meilenstein mit `main` synchronisiert. Nach Codex testen, committen und pushen. Keine Fremdthemen und kein Blind-Merging.**
