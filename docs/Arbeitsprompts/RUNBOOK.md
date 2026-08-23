# RUNBOOK.md — Codex Cloud für BBM-Produktiv

## Zweck
Diese Datei ist die praktische Bedienanleitung für wiederkehrende Codex-Cloud-Läufe in diesem Repository.

Die führenden Projektregeln stehen in:
- `AGENTS.md`
- `PLAN.md`
- `docs/MODULUEBERGREIFENDE_AENDERUNGEN_REGEL.md`

Diese Datei wiederholt diese Regeln nicht vollständig, sondern zeigt, wie Codex sauber gestartet und geführt wird.

---

## Grundprinzip
Codex soll in diesem Repo nicht frei „irgendwas verbessern“.

Codex soll:
1. zuerst die Repo-Regeln lesen,
2. dann den Plan lesen,
3. dann nur den nächsten sinnvollen Meilenstein bearbeiten,
4. danach prüfen, berichten und stoppen oder sauber weitermachen.

Zusätzlich gilt verbindlich:
- Sobald ein Auftrag gemeinsam genutzte BBM-Strukturen berührt oder Auswirkungen auf andere Module haben kann, ist vor der Änderung zu stoppen.
- Die betroffenen Strukturen, Dateien, möglichen Rückwirkungen und erforderlichen Tests sind zuerst zu benennen.
- Erst nach ausdrücklicher Freigabe darf die modulübergreifende Änderung umgesetzt werden.
- Eine nicht freigegebene Auswirkung auf ein anderes Fachmodul gilt als Abnahmefehler.

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
- docs/MODULUEBERGREIFENDE_AENDERUNGEN_REGEL.md
soweit für den aktuellen Meilenstein relevant.

Behandle AGENTS.md, PLAN.md und die Regel für modulübergreifende Änderungen als verbindliche Grundlage.

Arbeite danach den nächsten offenen Meilenstein aus PLAN.md ab.

Regeln:
- Bearbeite nur einen Meilenstein zur Zeit.
- Keine neuen Features.
- Keine Nebenumbauten.
- Keine breiten Refactorings außerhalb des aktuellen Meilensteins.
- Halte bestehendes Verhalten stabil, außer wenn der Meilenstein ausdrücklich etwas anderes verlangt.
- Stoppe und berichte, wenn der Meilenstein größer wird als geplant oder weitere Bereiche mitzieht.
- Verändere keine gemeinsam genutzte BBM-Struktur ohne vorherige ausdrückliche Freigabe.
- Wenn eine solche Änderung erforderlich wird: Ursache, betroffene Module, Dateien, Risiken und Rückwirkungstests benennen und vor der Umsetzung stoppen.

Am Ende liefere:
1. Ergebnis
2. geänderte Dateien
3. Prüfung
4. Risiken / offen
5. Status
6. Diff
```
