# Git-Arbeitsregeln für BBM

Stand: 2026-08-16

Diese Regeln gelten verbindlich für **alle ChatGPT-Chats, Codex-Läufe und manuellen Git-Arbeiten** im Repository `BBM-Produktiv`.

Ziel: Parallelentwicklung an mehreren Rechnern und mehreren BBM-Themen ermöglichen, ohne Branch-Vermischung, Rückfall auf alte Stände oder verlorene Arbeit.

## 1. `main` ist die gemeinsame Produktbasis

- `main` enthält nur freigegebenen, funktionierenden Produktstand.
- Auf `main` wird **nicht fachlich entwickelt**.
- Neue Arbeit startet immer von einem aktuellen `origin/main`.
- Vor neuer Arbeit muss geprüft werden, ob der lokale `main` aktuell ist.

## 2. Ein Branch = ein fachliches Ziel

Ein Arbeitsbranch darf genau ein klar benanntes Ziel verfolgen.

Beispiele:

- `rechnung-entwicklung`
- `editor-pdf-bedienung`
- `firmenlogik`

Verboten ist, unabhängige Themen wie Rechnung, Protokoll, Tabelleneditor, PDF oder Restarbeiten ungeplant auf demselben Branch zu vermischen.

Wenn ein neues Thema beginnt, wird dafür ein eigener Branch angelegt.

## 3. Vor jedem größeren Chat-/Codex-Arbeitslauf synchronisieren

Vor Beginn eines neuen Goal-Laufs oder größeren Arbeitspakets sind mindestens auszuführen:

```powershell
git fetch
git status --short
git branch --show-current
git log --oneline HEAD..origin/main
```

Auswertung:

- `git status --short` muss leer sein oder die vorhandenen Änderungen müssen vorher bewusst gesichert werden.
- Zeigt `git log --oneline HEAD..origin/main` Commits, liegt der Arbeitsbranch hinter `main`.
- Dann **zuerst synchronisieren**, erst danach neue Entwicklung beginnen.

## 4. Arbeitsbranches bewusst mit `main` synchronisieren

Auf einem länger laufenden Fachbranch:

```powershell
git fetch
git merge origin/main
```

Keine blinden `git pull`-Aktionen auf Fachbranches.

Bei Konflikten:

- nicht pauschal `ours` oder `theirs` wählen,
- fachliche Änderungen beider Seiten erhalten,
- Konflikte gezielt auflösen,
- anschließend Tests und `git diff --check` ausführen.

## 5. Neue Fachbranches nicht von veralteten Feature-Branches ableiten

Neue Arbeit grundsätzlich von aktuellem `origin/main` starten.

Ausnahme: Ein neuer Branch ist ausdrücklich ein Unter-/Integrationsbranch eines bestehenden Fachbranches. Dann muss das im Auftrag klar benannt sein.

## 6. Codex arbeitet nur im vereinbarten Scope

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

## 7. Große Codex-Läufe zuerst auf Prüf-/Arbeitsbranch

Bei riskanten Integrationen oder größeren Umbauten:

1. sauberen Prüfbranch anlegen,
2. Codex dort arbeiten lassen,
3. fachlich und technisch prüfen,
4. erst danach per Fast-Forward oder bewusstem Merge in den eigentlichen Fachbranch übernehmen.

Kein direkter großer Umbau auf `main`.

## 8. Bestehende, bereits abgenommene Fixes nicht neu programmieren

Wenn ein Fehler auf einem Branch wieder auftaucht, zuerst prüfen:

- fehlt ein bereits vorhandener Commit aus `main`?
- ist der Branch veraltet?
- stammt die Regression aus Branch-Divergenz?

Erst danach Code ändern.

Bereits abgenommene Lösungen dürfen nicht unnötig neu implementiert werden.

## 9. Nach jedem Codex-Lauf sauber abschließen

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

## 10. Temporäre Branches nach Abschluss aufräumen

Prüf-, Integrations- und Step-Branches werden nach erfolgreicher Übernahme gelöscht.

Vor dem Löschen muss geklärt sein:

- Ist ihr fachlicher Inhalt vollständig übernommen oder bewusst verworfen?
- Gibt es noch exklusive Commits?
- Ist der Zielbranch gepusht und sauber?

Keine alten Branches nur „zur Sicherheit“ dauerhaft weiterführen.

## 11. Backup-Branches nur für riskante Umbauten

Vor riskanten History-/Branch-Bereinigungen darf ein Backup-Branch angelegt werden, z. B.:

`backup/rechnung-entwicklung-vor-bereinigung-2026-08-16`

Ein Backup-Branch:

- wird nicht als normaler Arbeitsbranch weiterentwickelt,
- wird klar als Backup benannt,
- bleibt nur so lange erhalten, wie er als Sicherheitsnetz sinnvoll ist.

## 12. Mehrere Rechner dürfen unterschiedliche Fachbranches haben

Es ist ausdrücklich erlaubt, dass z. B.:

- Rechner A auf `main` oder einem Editor-Branch arbeitet,
- Rechner B auf `rechnung-entwicklung` arbeitet.

Entscheidend ist:

- beide kennen denselben aktuellen `origin/main`,
- Fachbranches werden regelmäßig mit `origin/main` synchronisiert,
- derselbe Fachbranch wird nicht unkoordiniert parallel auf zwei Rechnern weiterentwickelt.

## 13. Vor Arbeit auf einem zweiten Rechner immer Remote-Stand prüfen

Mindestens:

```powershell
git fetch --prune
git branch --show-current
git status --short
git branch -vv
```

Nicht einfach davon ausgehen, dass der lokale Clone aktuell ist.

## 14. Kein Force-Push ohne Sicherung und ausdrücklichen Grund

`git push --force` ist verboten.

Wenn eine Branch-Historie bewusst ersetzt werden muss:

- vorher Backup-Branch anlegen und pushen,
- nur `git push --force-with-lease` verwenden,
- danach Remote-Stand prüfen.

## 15. Artefakte und Diagnosematerial nicht ungeprüft committen

Screenshots, Logs, temporäre PDFs und Testartefakte gehören nur dann ins Repository, wenn sie ausdrücklich Teil der Dokumentation oder des Tests sind.

Vor `git add -A` prüfen, ob `artifacts/`, Logs oder temporäre Dateien versehentlich aufgenommen würden.

## 16. Standardablauf vor Codex

```text
1. git fetch
2. git status --short
3. git branch --show-current
4. git log --oneline HEAD..origin/main
5. Scope des Auftrags festlegen
6. erst dann Codex starten
```

## 17. Standardablauf nach Codex

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
- der Branch hinter `origin/main` liegt und die neue Arbeit darauf aufbauen würde,
- derselbe Fachbereich bereits auf einem anderen Branch/Rechner parallel geändert wird,
- ein Merge Konflikte erzeugt,
- alte und neue Architektur gleichzeitig auftauchen,
- ein vermeintlicher Bug möglicherweise nur durch Branch-Divergenz entstanden ist.

## Kurzform

**`main` ist die Basis. Ein Branch = ein Ziel. Vor Codex synchronisieren. Nach Codex testen, committen, pushen und aufräumen. Keine Fremdthemen, keine alten Branchstände und kein Blind-Merging.**
