# Projektübersicht – Umsetzung und Prüfung

15.09.2026, Branch `feature/project-meeting-series`, HEAD unverändert `0a91ca8c`.
Kein Commit, Merge oder Push. Entwurfsentscheidung vor Codeänderungen:
[PROJEKTUEBERSICHT_PLAN.md](PROJEKTUEBERSICHT_PLAN.md).

## Ergebnis

Anlegen und Import/Export stehen als echte kompakte Standardbuttons über einem
Raster ausschließlich tatsächlicher Projekte. Die vollständige neue
Übersichts-Komponente bindet ihre Editor-Refs ausdrücklich. Kacheln zeigen
Nummer/Bearbeiten im Kopf, den Projektnamen, eine abweichende Kurzbezeichnung
und die vorhandenen Bauvorhabenadressbestandteile. Fehlende Bestandteile
erzeugen keine Platzhalter. Die alten undefinierten Kachel-Farbvariablen werden
in der neuen Komponente durch die vorhandenen BBM-Standardtokens ersetzt.

Aktivierte Reihen sind direkt über Baubesprechung/Bauherr/Planung erreichbar;
vollständige Bezeichnungen stehen in title und aria-label. Keine seitliche
Aktionsspalte, künstliche Mindestkachelhöhe oder deaktivierte Kachelbuttons.
Eine Kachel ohne freigeschaltete Reihe behält Bearbeiten.

Historienbuttons stehen nur in Projekt bearbeiten bei deaktivierten Reihen
mit vorhandenen Protokollen. Sie verwenden die vorhandene History-/Read-only-
Ansicht über den bestehenden lizenzierten Router. Offene Änderungen an Name,
Häkchen oder Bauherr verhindern den Historienwechsel mit ausdrücklicher Meldung;
Dialog und Eingaben bleiben bestehen. Speichern oder ausdrückliches Abbrechen
ist weiterhin eine Nutzeraktion. Abwählen löscht keine Protokolle; Reaktivierung
führt in dieselben vorhandenen Reihen zurück.

## Geänderte Dateien dieses Pakets

Die Liste gilt gegenüber dem zu Auftragsbeginn gesicherten Arbeitsbaum und
enthält nicht die übrigen bereits vorhandenen Featureänderungen.

- `src/renderer/modules/projektverwaltung/screens/ProjectOverview.js` (neu)
- `src/renderer/modules/projektverwaltung/screens/ProjectOverview.uiEditorContract.js` (neu)
- `src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectsHubScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeriesEntry.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeriesField.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeries.uiEditorContract.js`
- `src/renderer/ui-editor/m80Registry.js`
- `ui-editor-target.json`
- `scripts/runMeetingSeriesAcceptance.cjs`
- `scripts/tests/projectOverviewAcceptance.cjs` (neu)
- `scripts/tests/meetingSeriesAcceptance.html`
- `scripts/tests/meetingSeriesUiContract.test.cjs`
- `scripts/tests/m80ElectronUiEditor.test.cjs`
- `scripts/tests/m83-0ComponentContracts.test.cjs`
- `docs/PROJEKTUEBERSICHT_PLAN.md` (neu)
- `docs/PROJEKTUEBERSICHT_PRUEFBERICHT.md` (neu)
- `STATUS.md`

Reine Prüfartefakte/Diagnosewrapper unter `output/project-overview-2026-09-15/`
gehören nicht zum Produktcode. Ausgangshashes von 55 Featuredateien sichern die
Paketgrenze; 41 davon blieben bytegenau erhalten. Kein Eingriff in produktive DBs,
DB-/Migrationscode, Nummerierung, Fortführung, Teilnehmer, TOP-Renderer,
PDF/Satz/Mail/ZIP, Editor-Core, HostAdapter oder Profile. Alle nicht betroffenen
Manifest-Scopes, einschließlich vorhandener PDF-Summaries, sind erhalten.

## Prüfungen

- `node scripts/ui-editor-contract-check.cjs --self-test`: grün. Dieser Legacy-
  Self-Test ist ergänzend, kein Nachweis der neuen produktiven M83-Ziele allein.
- `node scripts/runMeetingSeriesChecks.cjs meetingSeriesUiContract m80ElectronUiEditor`:
  23/23 grün (6 Klassifizierungs-/Parent-/Manifestprüfungen, 17 M80-Regressionen).
  Registry/Manifest Version 40. Neue Übersichts-Komponente 12 Slots, davon fünf
  verpflichtende Single-Refs; wiederholte Karten optional als Multi-Refs.
  Freischaltungsvertrag 14 Slots, davon elf Pflichtslots; Kacheleinstieg vier
  optionale Multi-Ref-Slots ohne Historienziele.
- Ausgewählte bestehende Reihen-/Bauherr-/Transfer-/Ausgabe-/Routing-/Editor-
  Regressionen: 120/123. Die drei roten Routing-/Quicklaneprüfungen sind anhand
  des bereits vorhandenen Ausgangsreports namensgleich als Baseline bestätigt.
- Allgemeine M83-Suite: 16/19; die drei Bestandsfehler betreffen den alten
  SiGeKo-/Komponentenanzahlvergleich, Rechnungs-DOM-Testrefs und einen alten
  Lizenzdatei-Hash. Gegen den Ausgangsreport bestätigt; nicht repariert.
  Die neuen Komponenten-, Parent-, Slot- und Mounted-Ref-Prüfungen sind grün.
- `node --check` für Harness und neuen UI-Abnahmehelfer: grün.
- `git diff --check`: grün (vorhandene Git-CRLF-Hinweise ohne Fehler).

Der finale echte Electron-/Chromium-Lauf mit produktiven Komponenten,
CoreShell, App-entry-Styles, Preload und IPC enthält 25 erfolgreiche Checkgruppen,
keine Rendererfehler und beendet sich automatisch mit Exit 0. Das markierte
isolierte Testprofil wird entfernt. Berichte/Screenshots bleiben erhalten.

Praktisch ausgeführt: Create öffnen/abbrechen, Transfer öffnen/schließen,
Bearbeiten öffnen, Häkchen speichern, Histories öffnen, Read-only-Protokoll
öffnen, Teilnehmerdialog abbrechen, alle drei direkten Reihenbuttons bedienen,
deaktivieren und reaktivieren, offene Name-/Häkchen-/Bauherränderungen schützen.
Vor/nach Lese-/Layoutaktionen vergleichen echte SQLite-Domainsnapshots.
Bauherr bleibt optional mit nicht angegeben; Firmenauswahl aktualisieren bleibt.
Der vorhandene umfassendere Harness prüft weiterhin Teilnehmer, echte PDFs und
eindeutige gespeicherte Mailanhänge. Keine Outlooknachricht wird erstellt/gesendet.

Geometrie: 1400×950, 760×800, 560×700 und 760×420. Jede sichtbare Aktion wird
per Scrollen in den Viewport gebracht und auf Erreichbarkeit geprüft;
Übersichts- und Dokumentbreite erzeugen keinen horizontalen Überlauf. Lange
Namen, eigenständige Kurzbezeichnungen, Teiladresse, fehlende Adresse und
Projektnummern sind in den echten Screenshots enthalten. Auf diesem Windows-
System wird 1 CSS-px Rahmen bei DPI-Skalierung als ca. 0,6015 CSS-px berechnet;
der Guard prüft deshalb den tatsächlich sichtbaren positiven Rahmen und die
aufgelöste Standardfarbe statt einer falschen exakten Zeichenfolge.

Artefakte:

- [Finaler automatischer Bericht](../output/project-overview-2026-09-15/final-verification/meeting-series-result.json)
- [Übersicht breit](../output/project-overview-2026-09-15/final-verification/project-overview-wide.png)
- [Übersicht schmal](../output/project-overview-2026-09-15/final-verification/project-overview-narrow.png)
- [Langer Name bei 560 px](../output/project-overview-2026-09-15/final-verification/project-overview-small-long-name.png)
- [Bearbeiten mit Historie](../output/project-overview-2026-09-15/final-verification/project-edit-history.png)
- [Schutz offener Änderungen](../output/project-overview-2026-09-15/final-verification/project-edit-dirty-protection.png)
- [Bearbeiten schmal](../output/project-overview-2026-09-15/final-verification/project-edit-history-narrow.png)

Screenshots wurden tatsächlich visuell angesehen; die menschliche Sichtabnahme
ist dadurch nicht ersetzt. Die frühe Prüfiteration fand einen Syntaxfehler im
neuen QA-Selektor sowie den DPI-unpassenden exakten Rahmenvergleich. Beide
Prüffehler sind korrigiert; der komplette Ablauf wurde anschließend grün wiederholt.
Die visuelle Iteration ersetzte die undefinierten alten Rahmenvariablen und
kürzte die Historienmeldung, damit der Dialogtitel bei breitem Fenster erhalten bleibt.

## Manueller Lauf und Cleanup

Separater Lebensdauertest: nach PASS sichtbar/fokussiert, tatsächliche
Bearbeiten-/Abbrechen-Mausereignisse erfolgreich und ohne Projektänderung;
nach 20 Sekunden weiterhin lebendig/sichtbar. BrowserWindow.close löst das
reguläre closed-Ereignis aus; Exit 0, closedAt gesetzt, eigenes Profil entfernt.
Der Launcher und vier beobachtete Electron-Prozesse sind anschließend nicht
mehr vorhanden. Keine fremden/präexistenten Prozesse wurden beendet.

Nachweise unter `manual-lifecycle/`: manual-lifecycle.json, cleanup.json und
process-cleanup.json. Automatische Prüfungen sind vollständig beendet.

Ein neuer echter `--manual`-Lauf ist für den Nutzer geöffnet: PID 32032,
Windows-HWND 5112784, sichtbares reagierendes Fenster, 25 Checks PASS. Seine DB
liegt ausschließlich im markierten temporären Profil. Nachweis:
`manual/windows-window-evidence.json`. Der Lauf hat keinen Timeout und wartet
auf Schließen-X; erst danach erfolgen Editor-Shutdown, DB-Close, Fenster-/
Electron-Exit und sichere Profilbereinigung. manualConfirmed bleibt false.

Start aus `C:\01_Projekte\BBM-Produktiv`:

```powershell
node scripts/runMeetingSeriesAcceptance.cjs --manual
```

Für reproduzierbare Artefakte optional vorab:

```powershell
$env:BBM_MEETING_SERIES_OUTPUT = 'C:\01_Projekte\BBM-Produktiv\output\project-overview-2026-09-15\manual'
```

## Arbeitsmodus-Abschluss / Editor-Vertragsabschluss

Goal-Arbeitslauf, Unteragenten keine. Native Computer Use nicht verfügbar;
tatsächliche technische Bedienprüfung über Electron-Mausereignisse und Windows-
Prozess-/Fensterstatus ausgeführt. Keine Alt-UI-Erkennung, Tabellenaufnahme,
Editor-1-Oberfläche, HostAdapter-, Save/Restore-/Profil- oder PDF-Satzänderung.

Technische Abschlusskriterien erfüllt: neue Kachelstruktur, korrekt begrenzte
Reihenbuttons, Edit-Historie mit/ohne Protokolle, Dirty-Schutz/Reaktivierung,
richtige Navigation, komplette Verträge/Refs, produktive Screenshots ohne
Horizontalüberlauf, automatische Beendigung, manuelles Schließ-Cleanup und
sichtbarer manueller Start. Reparatur-/Wiederholungsrunde tatsächlich ausgeführt.

Offen: menschliche Sichtabnahme und die getrennten alten Regressionstestfehler.
Keine M85-/Golden-/Bestandsbereinigung. Nächster Schritt ausschließlich
menschliche Sichtabnahme dieses Pakets; kein Git-Abschluss beauftragt.
