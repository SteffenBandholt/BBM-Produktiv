# README-CHATGPT – BBM-Arbeitsgrundlage

Diese Datei ist der verbindliche Einstieg für ChatGPT-Arbeit am Repository `BBM-Produktiv`.

Sie gilt zusammen mit `AGENTS.md` und `ZUERST_LESEN_Codex.md` für neue Chats, Fortsetzungs-Chats und Codex-Läufe.

## Vor jeder BBM-Arbeit lesen

1. `ZUERST_LESEN_Codex.md`
2. `docs/GIT_ARBEITSREGELN.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. aufgabenspezifische Dokumentation

Bei UI-/PDF-/Editor-Aufgaben gelten zusätzlich die entsprechenden Pflichtregeln aus `AGENTS.md`.

## Verbindliche Git-Kurzregel

**`main` ist die gemeinsame Basis. Ein Branch = ein fachliches Ziel. Vor neuer Arbeit synchronisieren. Nach der Arbeit testen, committen, pushen und temporäre Branches aufräumen. Fremdthemen und veraltete Branchstände dürfen nicht ungeprüft in ein Arbeitspaket geraten.**

Die vollständigen Regeln stehen in:

`docs/GIT_ARBEITSREGELN.md`

Diese Datei ist nicht nur Empfehlung, sondern Arbeitsregel.

## Pflichtcheck vor größerer Arbeit

Vor jedem größeren Chat-/Codex-Arbeitspaket ist der reale Git-Stand zu prüfen:

```powershell
git fetch
git status --short
git branch --show-current
git log --oneline HEAD..origin/main
```

Wenn der Arbeitsbaum unerwartet Änderungen enthält, der Branch unklar ist oder der Branch hinter `origin/main` liegt, darf nicht einfach weitergebaut werden. Erst den Stand klären und sichern.

## Mehrere Rechner

Unterschiedliche Rechner dürfen auf unterschiedlichen Fachbranches arbeiten. Entscheidend ist, dass sie dieselbe aktuelle `origin/main`-Basis kennen und derselbe Fachbranch nicht unkoordiniert parallel weiterentwickelt wird.

## Bereits gelöste Fehler

Wenn ein bereits behobener Fehler wieder auftaucht, zuerst Branch- und Synchronisationsstand prüfen. Nicht vorschnell neu programmieren.

## Branch-Bereinigung

Temporäre Prüf-, Step- und Integrationsbranches werden nach erfolgreicher Übernahme entfernt. Backup-Branches sind nur Sicherheitsnetze und keine normalen Arbeitsbranches.

## Ziel

ChatGPT und Codex sollen BBM zielorientiert weiterentwickeln, ohne durch Branch-Divergenz, Misch-Branches oder ungesicherte Zwischenstände bereits erledigte Arbeit wieder zu zerstören.
