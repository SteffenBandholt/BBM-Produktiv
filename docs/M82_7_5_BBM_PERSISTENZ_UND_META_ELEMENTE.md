# M82.7.5 – Gespeichertes Layout und Meta-Elemente

## Status

`[A]` – Implementierung, automatisierte Regression und sichtbare isolierte Zwei-Start-Abnahme sind abgeschlossen.

## Ursache und Lebenszyklus

Der vorhandene atomare UI-Profilstore und der Startup-Restore waren bereits die richtige Persistenzquelle. Die Layoutstyles wurden beim Schließen des Editors ebenfalls nicht entfernt. Es fehlte aber eine eindeutige Abschlusssemantik zwischen nativem Editor und Electron-Ziel-App: `editorClosed` unterschied nicht zwischen gespeichert, sauber und „ohne Speichern“. Zusätzlich wurde das Ereignis vor und während der Session-Entsorgung doppelt weitergereicht. Beim späteren App-Shutdown konnte dadurch noch auf `webContents` eines bereits zerstörten Fensters zugegriffen werden.

Der verbindliche Lebenszyklus ist jetzt:

1. `getRegistry` erfasst einmalig den tatsächlichen Arbeitszustand als Sitzungsgrenze.
2. Änderungen laufen ausschließlich über den vorhandenen generischen HostAdapter-/Ref-Weg.
3. Speichern schreibt weiterhin über den bestehenden atomaren Profilstore.
4. Der native Editor meldet beim Schließen genau eine Disposition: `saved`, `clean`, `discarded` oder `unknown`.
5. `saved` und `clean` behalten den aktuellen Zustand; `discarded` stellt exakt die Sitzungsgrenze wieder her. Ein unerwartetes `unknown` verwirft keine Änderung eigenmächtig.
6. Rerender und Datensatzwechsel binden neue DOM-Knoten an den vorhandenen Arbeitszustand.
7. Beim BBM-Neustart lädt der vorhandene Startup-Restore das gespeicherte Profil genau einmal.
8. Die Entsorgung prüft das Fenster vor dem Zugriff auf `webContents`; zerstörte Fenster erhalten kein spätes Ereignis.

Damit sind gespeicherter Zustand und ungespeicherte Sitzung technisch getrennt. Nur „Ohne Speichern“, ein expliziter Reset/Originalzustand mit anschließendem Speichern oder eine Profiländerung entfernt eine gespeicherte Layoutwirkung.

## Inventar der bestätigten Meta-Elemente

Alle Ziele zeigen auf bereits vorhandene DOM-Knoten. Es wurden keine Wrapper, Zeilen-IDs, Fachwert-IDs oder neuen Ansichten erzeugt.

| ID / Ref-Key | Parent | vorhandener DOM-Ref | Baseline und Grenzen | erlaubte Operationen | Auswahl / Scope |
| --- | --- | --- | --- | --- | --- |
| `restarbeiten.main.tableHeader.dueDate` | `restarbeiten.list.table.meta.header` | vorhandener Textknoten „Fertig bis“ im Meta-Header | X/Y 0; Schrift 8,667 DIP, 6–24 | move, textResize, setVisibility | einzelnes Element / Restarbeiten-Liste |
| `restarbeiten.main.tableHeader.status` | `restarbeiten.list.table.meta.header` | vorhandener Textknoten „Status“ im Meta-Header | X/Y 0; Schrift 8,667 DIP, 6–24 | move, textResize, setVisibility | einzelnes Element / Restarbeiten-Liste |
| `restarbeiten.main.tableHeader.responsible` | `restarbeiten.list.table.meta.header` | vorhandener Textknoten „Verantw.“ im Meta-Header | X/Y 0; Schrift 8,667 DIP, 6–24 | move, textResize, setVisibility | einzelnes Element / Restarbeiten-Liste |
| `restarbeiten.record.dueDate` | `restarbeiten.list.table.meta.cells` | vorhandene Fälligkeitszeilen aller sichtbaren Karten | X/Y 0; Schrift 10,667 DIP, 7–32 | move, textResize, setVisibility | statischer logischer Multi-Ref / Restarbeiten-Liste |
| `restarbeiten.record.ampel` | `restarbeiten.list.table.meta.cells` | vorhandene innere `span.bbm-restarbeiten-ampel` aller sichtbaren Karten | X/Y 0; 12×12 DIP, Breite/Höhe 7–48 | move, resizeWidth, resizeHeight, setVisibility | statischer logischer Multi-Ref / Restarbeiten-Liste |
| `restarbeiten.record.status` | `restarbeiten.list.table.meta.cells` | vorhandene Statuszeilen aller sichtbaren Karten | X/Y 0; Schrift 10,667 DIP, 7–32 | move, textResize, setVisibility | statischer logischer Multi-Ref / Restarbeiten-Liste |
| `restarbeiten.record.responsible` | `restarbeiten.list.table.meta.cells` | vorhandene Verantwortlichenzeilen aller sichtbaren Karten | X/Y 0; Schrift 10,667 DIP, 7–32 | move, textResize, setVisibility | statischer logischer Multi-Ref / Restarbeiten-Liste |

Die vier Zeilenziele sind bewusst logische Multi-Refs: Eine Layoutänderung gilt für denselben sichtbaren Bestandteil aller Listeneinträge. Fachwerte und fachliche Zuordnungen bleiben davon unberührt. Bei leerer Liste bleibt der Vertrag logisch auflösbar; der Datenbereich wird dabei nicht fälschlich als Kind auswählbar.

## Sichtbare Abnahme

Die Abnahme lief ausschließlich mit `npm run start:ui-editor:acceptance` in dessen isoliertem Development-/Diagnostic-Profil:

- Headerziel „Fertig bis · Überschrift“ direkt ausgewählt und von 8,667 auf 9,667 DIP vergrößert.
- Zeilenziel „Status · Listeneinträge“ direkt ausgewählt und mit Schrittweite 5 von X=0 auf X=-5 verschoben.
- Ziel „Ampel · Listeneinträge“ direkt ausgewählt und von 12×12 auf 17×12 DIP verbreitert.
- gespeichert, Editor geschlossen und die drei Wirkungen in der laufenden Ziel-App beibehalten.
- einen anderen Datensatz gewählt; der vollständige Listen-/Editbox-Rerender behielt alle Wirkungen.
- zum Modul „Firmen“ gewechselt; beim zweiten isolierten App-Start kehrte der Diagnostic-Lauf in die Restarbeitenansicht zurück.
- der zweite Start meldete `layout_profile_loaded` und `startup_layout_applied`; der Header zeigte erneut 9,667 DIP, Status und Ampel blieben sichtbar verändert und als getrennte Ziele auswählbar.
- beide App-Läufe verwendeten denselben isolierten Datenbankhash und der temporäre Acceptance-Root wurde anschließend entfernt.

## Automatisierte Prüfung

- M82.7.5-Einzeltest: 34/34 grün.
- `npm test`: 8/8 Testgruppen, kein OOM.
- `npm run test:node`: Node 22 / ABI 127 vor dem Lauf, 8/8 Gruppen und Wiederherstellung auf Electron ABI 123 im `finally`.
- gezieltes ESLint aller geänderten JavaScript-/Testharnessdateien: ohne Befund.
- `npm run pack`: grün, Electron-ABI aktiv und `npmRebuild: false` wirksam.
- globales `npm run lint`: bekannter Altstand mit 16 Fehlern und 371 Warnungen; keine geänderte M82.7.5-Datei erzeugt einen Fehler.
- `git diff --check`: grün.

## Grenzen

- Keine neue UI, kein neuer DOM-Knoten und keine zweite Profilablage.
- Keine Änderung an Tabellenbreitenquelle, Topologie, Scrollbesitzern oder Fachlogik.
- Keine Benutzerlizenz, echte Benutzerdatenbank oder Sicherungsdatenbank wurde gelesen oder verwendet.
- `docs/licensing.md` bleibt Fremdänderung und unangetastet.
- Commit, Push, Pull Request und Merge sind nicht erfolgt.
