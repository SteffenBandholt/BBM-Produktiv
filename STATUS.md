# STATUS.md — BBM-Produktiv

## Zweck
Diese Datei hält den tatsächlichen Fortschritt fest.

Sie ergänzt:
- `AGENTS.md` = Arbeitsregeln
- `PLAN.md` = Soll-Ablauf / Meilensteine

`STATUS.md` beschreibt den Ist-Stand:
- was bereits erledigt ist,
- woran zuletzt gearbeitet wurde,
- was als Nächstes dran ist,
- wo es Hindernisse gibt.

---

## Aktueller Gesamtstand
- Die Projektverwaltung ist als Renderer-Modul abgeschlossen.
- Ausgabe / Drucken / E-Mail ist als Renderer-Modul aufgestellt.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Drucktechnik bleibt im Main-Prozess.
- Audio / Diktat ist als Renderer-Modul begonnen.
  - Aktuell nur `TranscriptionService` als Renderer-Adapter.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverändert.
- Protokoll-Modul ist eingefroren.
- `npm test` war gruen.
- Repo ist auf GitHub aktualisiert.
- `AGENTS.md` und `PLAN.md` sind vorhanden.
- Codex Cloud ist eingerichtet und kann das Repo lesen.
- Das Mutter-/Kind-Prinzip ist als verbindliche Leitlinie fuer die gesamte App festgehalten.
- Der erste CSS-Schritt im Modul `Protokoll` wurde umgesetzt.
- Der Speichern-/Löschen-Vertrag im Tops-Bereich wurde zwischen Verhalten und Tests synchronisiert.

## Architektur-Flag
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spaetere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fuer andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswählbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswählbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spaeter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext und oeffnet spaeter einen Projekt-Arbeitsbereich.
- Im Projekt-Arbeitsbereich werden nur auswählbare Projektmodule angeboten.
- Das Protokoll-Modul ist aktuell eingefroren.
- Keine weitere Mini-Modularisierung ohne ausdruecklichen Auftrag.
- `TopsHeader` und `TopsList` wurden heimgeholt.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen.
- Weitere Änderungen nur bei echtem Fehler oder konkretem Featurebedarf.

## Projektverwaltung
- Der erste Modul-Meilenstein ist abgeschlossen.
- Die Projektverwaltung ist als Renderer-Modul unter `src/renderer/modules/projektverwaltung` aufgestellt.
- Der bestehende Sidebar-Einstieg `Projekte` bleibt der einzige sichtbare Einstieg.
- Es gibt keinen zusätzlichen Sidebar-Button `Projektverwaltung`.
- Der Router nutzt den Modulpfad.
- Die alten View-Dateien bleiben als Compatibility-Re-Exports bestehen.
- Keine DB-/IPC-Logik wurde verschoben.
- `npm test` war gruen.

## Ausgabe
- Das Renderer-Modul ist aufgestellt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Drucktechnik bleibt im Main-Prozess.

## Audio
- Das Renderer-Modul ist begonnen.
- Aktuell ist nur `TranscriptionService` als Renderer-Adapter im Modul verankert.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverändert.

---

## Erledigte Meilensteine / Pakete

### Erledigt
#### Paket: CSS-Altpfad im Modul Protokoll abbauen
- Status: erledigt
- Beschreibung:
  - modul-lokale CSS-Datei für Protokoll angelegt
  - CSS-Verweis in `src/renderer/modules/protokoll/styles.js` angepasst
  - alte CSS-Datei blieb bestehen
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/styles.js`
  - `src/renderer/modules/protokoll/styles/tops.css`
- Commit:
  - `a0585ef`
- Hinweise:
  - Commit enthält zusätzlich das Entfernen von ChatGPT-Export-Artefakten

#### Paket: Speichern-/Löschen-Vertrag im Tops-Bereich stabilisieren
- Status: erledigt
- Beschreibung:
  - `topsCommands`-Testvertrag an den realen Reload-Ablauf nach `saveDraft` und `deleteSelectedTop` angepasst
  - Reload nach Speichern/Löschen im Test explizit abgedeckt (inkl. Erhalt/Entfernung der Selektion im Ablauf)
- Betroffene Dateien:
  - `scripts/tests/topsCommands.test.cjs`
  - `STATUS.md`
- Commit:
  - `50cdbc3`
- Hinweise:
  - Keine Änderungen an Router, UI oder fachlicher Tops-Logik

---

## Offene Meilensteine
1. Weitere kleine Altpfade im Modul `Protokoll` abbauen

---

## Zuletzt bearbeitet
- Letzter sinnvoller bestätigter Stand:
  - Speichern-/Löschen-Vertrag im Tops-Bereich über zugehörigen Testvertrag stabilisiert
- Letzter Cloud-Kontrolllauf:
  - `AGENTS.md` gefunden
  - `PLAN.md` gefunden
  - Codex konnte den Repo-Stand lesen
- Beobachtung:
  - Ohne Fortschrittsdatei interpretiert Codex den Plan zu wörtlich und nimmt erledigte Meilensteine erneut als offen an.

---

## Aktuell nächster sinnvoller Schritt
Der nächste noch nicht erledigte Meilenstein ist:

### Weitere kleine Altpfade im Modul `Protokoll` abbauen
- Ziel:
  - einen weiteren kleinen, klar abgegrenzten Altpfad für `Protokoll` reduzieren
- Wichtig:
  - nur ein kleines Paket
  - keine Nebenumbauten
  - keine breiten Router-Umbauten
  - keine Änderungen außerhalb des aktuellen Meilensteins

---

## Offene Hindernisse / bekannte Probleme
- Bestehende Tests sind aktuell nicht vollständig grün.
- Frühere Läufe zeigten bestehende Altprobleme, u. a.:
  - `ERR_INVALID_URL` im Zusammenhang mit ESM/CSS-Importpfaden
- Diese Probleme gelten nicht automatisch als Teil jedes neuen Mini-Pakets.
- Wenn ein neuer Meilenstein an diesen Punkten hängen bleibt, stoppen und offen berichten.

---

## Regeln für Fortschrittsfortschreibung
Nach jedem abgeschlossenen Paket oder Meilenstein ergänzen:
1. Was wurde erledigt?
2. Welche Dateien waren betroffen?
3. Welcher Commit gehört dazu?
4. Was ist jetzt der nächste offene Schritt?
5. Gab es Hindernisse oder Restrisiken?

Wichtig:
- `STATUS.md` beschreibt den Ist-Stand.
- `PLAN.md` bleibt der Soll-Plan.
- Erledigte Schritte sollen in `STATUS.md` dokumentiert werden, nicht durch ständiges Umschreiben von `PLAN.md`.

---

## Merksatz
- `AGENTS.md` = Hausordnung
- `PLAN.md` = Bauablaufplan
- `STATUS.md` = Bautagebuch / Ist-Stand
