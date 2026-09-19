# README-CHATGPT – BBM-Arbeitsgrundlage

Diese Datei ist der verbindliche Einstieg für ChatGPT-Arbeit am Repository `BBM-Produktiv`.

Sie gilt zusammen mit `AGENTS.md` und `ZUERST_LESEN_Codex.md` für neue Chats, Fortsetzungs-Chats und Codex-Läufe.



## Verbindliche Kosten- und Nutzungsregel für ChatGPT / Work / Codex / API

Stand: 2026-09-19

Für alle BBM-Chats und Umsetzungsaufträge gilt:

- Das vorhandene ChatGPT-Abonnement und dessen enthaltene Nutzung werden zuerst ausgeschöpft.
- Planung, Abstimmung, fachliche Klärung und kleinere Analysen erfolgen standardmäßig im normalen Chat.
- Work/Codex/Agenten werden gezielt eingesetzt, wenn echte Repository-, Browser-, Datei- oder App-Arbeit nötig ist; unnötige lange oder wiederholte Agentenläufe sind zu vermeiden.
- **Automatische Credit-Aufladung bleibt ausgeschaltet.** Sie darf nicht ohne ausdrücklichen Auftrag des Nutzers aktiviert werden.
- Zusätzliche Credits dürfen nicht ohne ausdrückliche Nutzerfreigabe gekauft oder bewusst als Standard-Arbeitsweg eingeplant werden.
- Wenn ein enthaltenes Tariflimit für eine Aufgabe voraussichtlich erreicht ist, wird angehalten und der Nutzer informiert, statt ungefragt kostenpflichtige Zusatznutzung auszulösen.
- Die OpenAI-API ist ein getrenntes Abrechnungssystem. BBM darf keine neue OpenAI-API-Nutzung, keinen API-Key und keine kostenpflichtige API-Integration erhalten, solange der Nutzer dies nicht ausdrücklich beauftragt.
- Lokale Lösungen sind bei gleicher Eignung vorzuziehen; insbesondere bleibt die bestehende lokale Whisper-/Diktat-Verarbeitung ohne OpenAI-API.
- Diese Kostenregel ist eine Arbeitsregel, keine Produktarchitekturentscheidung: fachlich notwendige Cloud-/API-Nutzung kann später ausdrücklich beschlossen werden.

## Vor jeder BBM-Arbeit lesen

1. `ZUERST_LESEN_Codex.md`
2. `docs/GIT_ARBEITSREGELN.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. aufgabenspezifische Dokumentation

Bei UI-/PDF-/Editor-Aufgaben gelten zusätzlich die entsprechenden Pflichtregeln aus `AGENTS.md`.

Bei jeder PDF-V2-Arbeit ist zusätzlich zwingend vor der Implementierung zu lesen:

`docs/PDF_V2_VERBINDLICHE_MODULGRUNDLAGE.md`

Diese Regel ist verbindlich. PDF V2 wurde ausdrücklich als gemeinsame Modulgrundlage entwickelt. Ein Fachmodul darf unterhalb des gemeinsamen V2-Mainheaders und seiner Trennlinie kein unabhängig neues PDF-Design erfinden, wenn bereits ein verbindlicher UI-/Layoutvertrag existiert. Für Rechnungen gilt ausdrücklich: **Die Rechnungs-UI ist die visuelle Referenz; der Nutzer sieht in der UI, was später gedruckt wird.**

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
