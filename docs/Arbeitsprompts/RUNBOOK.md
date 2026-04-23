# RUNBOOK.md — Codex Cloud für BBM-Produktiv

## Zweck
Diese Datei ist die praktische Bedienanleitung für wiederkehrende Codex-Cloud-Läufe in diesem Repository.

Die führenden Projektregeln stehen in:
- `AGENTS.md`
- `PLAN.md`

Diese Datei wiederholt diese Regeln nicht vollständig, sondern zeigt, wie Codex sauber gestartet und geführt wird.

---

## Grundprinzip
Codex soll in diesem Repo nicht frei „irgendwas verbessern“.

Codex soll:
1. zuerst die Repo-Regeln lesen,
2. dann den Plan lesen,
3. dann nur den nächsten sinnvollen Meilenstein bearbeiten,
4. danach prüfen, berichten und stoppen oder sauber weitermachen.

---

## Standard-Start für einen neuen Cloud-Lauf
Verwende für einen neuen größeren Lauf diesen Prompt:

```text
Arbeite im Repository BBM-Produktiv.

Lies zuerst:
- AGENTS.md
- PLAN.md
- ZUERST_LESEN_Codex.md
- ARCHITECTURE.md
- docs/MODULARISIERUNGSPLAN.md
soweit für den aktuellen Meilenstein relevant.

Behandle AGENTS.md und PLAN.md als verbindliche Grundlage.

Arbeite danach den nächsten offenen Meilenstein aus PLAN.md ab.

Regeln:
- Bearbeite nur einen Meilenstein zur Zeit.
- Keine neuen Features.
- Keine Nebenumbauten.
- Keine breiten Refactorings außerhalb des aktuellen Meilensteins.
- Halte bestehendes Verhalten stabil, außer wenn der Meilenstein ausdrücklich etwas anderes verlangt.
- Stoppe und berichte, wenn der Meilenstein größer wird als geplant oder weitere Bereiche mitzieht.

Am Ende liefere:
1. Ergebnis
2. geänderte Dateien
3. Prüfung
4. Risiken / offen
5. Status
6. Diff