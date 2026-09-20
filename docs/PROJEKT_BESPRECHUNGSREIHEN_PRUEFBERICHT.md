# Drei Besprechungsreihen – Abschluss vom 15.09.2026

Arbeitsbranch `feature/project-meeting-series`, Basis `origin/main` / `0a91ca8c10d94fa8055b7ad6f2eef9161bdd7cdc`. Kein Commit, Merge oder Push. Vorhandene unversionierte Ordner `output/` und `tmp/` erhalten. Die vorab ausgegebene Daten-/UI-/PDF-Entscheidung steht in `PROJEKT_BESPRECHUNGSREIHEN_PLAN.md`.

## Ergebnis und Migration

Ein Projekt besitzt die drei festen Reihen `construction`, `owner`, `planning`. Die Projektmaske hat Default 1; fehlender Bauherr bleibt NULL. Formular und tatsächlich verwendete Projekt-Hülle bieten Häkchen beziehungsweise direkte lizenzgeprüfte Reihenbuttons. Deaktivierte Reihen bleiben über ihren Historieneinstieg lesbar; Reaktivierung öffnet denselben Bestand.

Die Protokollmigration ergänzt Reihenfelder und ersetzt Offen-Index/Bereinigungsroutine transaktional. Widersprüchliche offene Altdaten führen zum Abbruch ohne automatisches Schließen. Der Core ergänzt die Projektmaske auch ohne freigeschaltetes Protokollmodul durch eine atomare SQLite-ALTER-Anweisung. Wiederholtes Schema-Ensure und Wiederöffnung sind geprüft. Historische IDs, Nummern, Inhalte, Status und Teilnehmerflags bleiben erhalten. SQLite-Trigger verhindern fremde TOP-Parents, Meeting-Zuordnungen und Erledigungsreferenzen.

TOP-Nummern, Vorgänger, Erledigungsfortführung, Teilnehmer/Verteiler und Folgetermine werden innerhalb derselben Reihe geführt. Der Firmen-/Personenpool bleibt projektweit. Die produktive TOP-Meta erhält Folgetermine und den autoritativen Nur-Lesen-Status; auch Papierkorb-/Abschlussaktionen prüfen Schreibberechtigung.

Der gemeinsame PDF-V2-Renderer, Satz, Dokumenttyp und PDF-Editor bleiben bestehen. Ausgabe, Vorschau und Mail zeigen die Reihe. Neue Protokolldateien tragen `seriesKey--meetingId__` vor dem Titel. Alte Baubesprechungsdateien werden anhand exakter Nummer und tatsächlich gespeicherter Titel-/Anlagedaten gefunden; unbestimmte Mehrfachtreffer werden gemeldet. Projektweite TOP-/Aufgaben-Ausgaben erhalten Reiheninformation. ZIP-Archive verwenden den separaten Marker `meetingSeriesSchemaVersion=1`; markerlose Altarchive gehören zur Baureihe. Beziehungen werden vor Import validiert, absichtlich leere Teilnehmerauswahlen bleiben leer.

## Ausgeführte Prüfungen

Nachweise unter `output/meeting-series-checks-2026-09-15/`:

| Prüfung | Ergebnis |
|---|---|
| Neue Daten-/Migrations-/Integritätsgruppen | 10/10 |
| Echte ZIP-Transfergruppen | 6/6 |
| Ausgabe-/Mail-/PrintModal-Gruppen | 9/9 |
| Legacy-PDF mit echtem SQLite-Repo-DTO | 1/1 |
| Neue Komponenten-/Parent-/Operations-/Manifestverträge | 4/4 |
| Gesamter gezielter Electron-Node-Lauf | 252/260; acht Bestandsfehler getrennt unten |
| Bestehende Firmenregressionen einschließlich Dialog | 26/26; zwei alte Layouttests zusätzlich rot |
| TOP-Commands / produktiver Screen / CloseFlow | 4/4, 53/53, 2/2 |
| M80 Editor-Anbindung | 17/17 |
| Vorherige PDF-/Editor-Kontextgruppen | 48/48 aus getrennten seriellen Läufen; M80 mit korrigiertem aktuellen Scope-Soll |
| Standardkopf-/Bauvorhabenadresse | 2/2 |
| Protokoll-Goldens: Seiten und Strukturhash | 25/25 |
| Alle V2-Snapshots gegenüber HEAD | 49/49 identisch bei konstanten vorhandenen Schriftdateien |
| M85 aktuell und HEAD | jeweils 18/22, identische vier Bestandsfehler |
| Legacy-Vertragschecker Self-Test | grün; kein Ersatz für aktuelle M83-/Mounted-Ref-Prüfung |
| Syntax geänderter/neuer JS-Dateien | 49/49 im jeweils richtigen CJS-/ESM-Modus |
| Git-Diff-Whitespaceprüfung | grün |

Start des gezielten Laufs: `node scripts/runMeetingSeriesChecks.cjs`. Er beendet sich wegen der ausdrücklich dokumentierten Bestandsfehler mit Exit 1. Der Gesamtbericht ist `results.json`; PDF-Vergleiche stehen in `v2-golden-comparison.json` und `v2-baseline-comparison.json`. Die zusammengeführten 48 Kontextnachweise stehen in `pdf-editor-context-combined48-results.json`. Die vollständige `npm test`-Gesamtsuite wurde nicht zusätzlich ausgeführt.

## Windows-Ablauf und Grenzen

`node scripts/runMeetingSeriesAcceptance.cjs` lief mit echten produktiven Router-/Projekt-/Protokoll-/Dialogkomponenten, Preload/IPC/SQLite und tatsächlichen App-Styles mehrfach vollständig grün. Eingaben und gespeicherte Werte, echte Mouse-Events, Historien-Doppelklick, drei Fenstergrößen (1400×950, 760×800, 760×360), SQLite-Wiederöffnung und Editor-Layout-Readbacks wurden geprüft. Der deaktivierte offene Owner-Bestand ist im tatsächlichen TopsStore nur lesbar; Teilnehmeröffnung behält die explizite Reihe. Layoutoperationen änderten keine Fachdaten. Die drei real erzeugten PDFs enthalten ihre eigene Überschrift, Projektadresse und nur ihre TOPs; die Mail-Anhangsuche wählt jeweils die eigene Datei. Sieben Screenshots und drei PDFs wurden erhalten und visuell geprüft.

Der finale Windows-Bericht und Artefaktkopien liegen unter `output/meeting-series-checks-2026-09-15/windows/`. Native Computer Use war nach einmaliger Prüfung nicht verfügbar. Dies ist eine technische Windows-Electron-Abnahme mit interner Entwicklungslizenz; eine menschliche Abnahme oder Kundensignaturprüfung wird nicht behauptet. Keine Outlook-Nachricht wurde gesendet. Ein erster Harnessversuch erzeugte eine eigene Test-PDF unter Downloads; ausschließlich diese exakte Datei wurde gelöscht. Anschließend waren Ausgabe und Host-Fallbackpfade vollständig markerisoliert. Produktive Datenbanken wurden nicht verändert.

Manueller Prüflauf ist bereits sichtbar geöffnet; erneuter Start aus dem Repository:

```powershell
node scripts/runMeetingSeriesAcceptance.cjs --manual
```

Kurze Nutzerabnahme:

1. Projekt bearbeiten: alle Häkchen, Bauherr `nicht angegeben`, Aktualisierungsbutton und Speichern prüfen.
2. Jeden der drei Kachelbuttons öffnen: Reihe, Nr. 1 und TOP 1/1.1 kontrollieren; eigenen Teilnehmer/Verteiler auswählen.
3. Je Reihe einen anderen Folgetermin speichern, Protokoll beenden und das nächste eröffnen: eigene Fortführung und Nummerierung prüfen.
4. Eine Reihe abwählen: Historie nur lesbar öffnen; wieder aktivieren und denselben Bestand öffnen.
5. Je Reihe PDF-Vorschau und angebotenen Mailanhang kontrollieren; keine Mail versenden. Auch schmales/niedriges Fenster prüfen.

Das X des isolierten Prüffensters beendet den Lauf und entfernt nur das markierte Testprofil; erhaltene Ergebnisartefakte bleiben bestehen. `manualConfirmed=false` bleibt bis zur tatsächlichen Nutzerabnahme.

## Bekannte Bestandsfehler

Acht rote Prüfungen im gezielten Lauf:

- Zwei alte Projektfirmen-Layoutannahmen (historische Tabelle / fehlende `projectFirmsLayoutSource`). Bereits auf der Basis im vorhandenen STATUS dokumentiert.
- Zwei `protokollProjectEntryRouting`-Guards (alte Projekt-Einstiegsannahme / blocked-Payload), HEAD und Arbeitsstand jeweils 8/10 mit identischen Fehlernamen.
- Ein `protokollRouterFallback`-Quicklane-Quelltextguard, HEAD und Arbeitsstand jeweils 33/34; `baseline-router-fallback.json` enthält den Vergleich.
- Drei alte M83-Guards (veraltete Gesamtkomponentenliste, Rechnungsref `null.element`, alter Licensing-Schutzhash), HEAD und Arbeitsstand jeweils 16/19. Die neuen 11/7 Vertragsziele sind zusätzlich separat 4/4 und mit produktiven Mounted-Refs geprüft. Licensing-Bytes sind identisch zur Basis.

Vier M85-Guards: Restarbeiten `r19-empty`-Hash, Restarbeiten-Spaltenzahl 9/13, bestehende PDF-Registryzahl 37/35, `PDF-V2-ARCH-003`. Die vollständigen Restarbeiten-Vergleiche zeigen auch weitere Manifestabweichungen; alle 49 aktuellen Snapshots stimmen mit HEAD überein. Keine Goldens, Fonts, Satzregeln oder angrenzenden Module repariert.

## ARBEITSMODUS-ABSCHLUSS

Verwendeter Modus: Goal-Arbeitslauf mit drei klar abgegrenzten Unteragenten (Daten-/Transferanalyse und Integritätsreview; Ausgabe-/PDF-/Baselineprüfung; isolierter Windows-Prüfharness). Produktivänderungen koordiniert in getrennten Dateien, Reviewbefunde im Hauptlauf repariert.

Computer-Use-Prüfung: native nicht verfügbar; technischer Windows-Ablauf wie oben ausgeführt. Alle technischen Abschlusskriterien und der beauftragte Fallbacknachweis erfüllt. Menschliche Nutzerabnahme weiterhin offen. Reparatur-/Wiederholungsrunden beseitigten Create-IPC-Maskverlust, Hub-Unterdrückung, Erledigungsreferenz, Legacy-Datum, Teilnehmer-Reihenwechsel, Folgetermin-Metaverlust und unzureichenden Read-only-Schutz; danach betroffene Tests und vollständiger Bedienablauf erneut geprüft.

## ABSCHLUSSBERICHT EDITOR 1

UI-Vertragsanbindung: zwei komponentennahe Verträge, 18 explizite Ziele mit gültigen Parents und Single-/Multi-Refs; Registry und Target-Manifest konsistent. Fachaktionen gesperrt. Keine Änderungen an Editor-1-Core, HostAdapter, Tabellenverträgen, Layouttools, PDF-Profilen, Breiten oder Paginierung. Neue Vertragsgruppen 4/4, produktive Mounted-Refs und Layoutoperationen grün; M80 17/17. Alte M83-Gesamttests bleiben wie oben eingeordnet. Nächster Schritt: fachliche Nutzerabnahme, anschließend separater Git-Abschluss nur nach Auftrag.

## Vollständige geänderte Dateien

- `STATUS.md`
- `docs/MODULARISIERUNGSPLAN.md`
- `docs/PROJEKT_BESPRECHUNGSREIHEN_PLAN.md`
- `docs/PROJEKT_BESPRECHUNGSREIHEN_PRUEFBERICHT.md`
- `scripts/runMeetingSeriesAcceptance.cjs`
- `scripts/runMeetingSeriesChecks.cjs`
- `scripts/testGroups.cjs`
- `scripts/tests/m80ElectronUiEditor.test.cjs`
- `scripts/tests/m83-0ComponentContracts.test.cjs`
- `scripts/tests/meetingSeries.test.cjs`
- `scripts/tests/meetingSeriesAcceptance.html`
- `scripts/tests/meetingSeriesOutput.test.cjs`
- `scripts/tests/meetingSeriesTransfer.test.cjs`
- `scripts/tests/meetingSeriesUiContract.test.cjs`
- `scripts/tests/projectBuilderForm.test.cjs`
- `scripts/tests/topServiceHierarchy.test.cjs`
- `src/main/db/database.js`
- `src/main/db/meetingSeriesMigration.js`
- `src/main/db/meetingTopsRepo.js`
- `src/main/db/meetingsRepo.js`
- `src/main/db/projectsRepo.js`
- `src/main/db/topsRepo.js`
- `src/main/domain/MeetingService.js`
- `src/main/domain/TopService.js`
- `src/main/ipc/meetingsIpc.js`
- `src/main/ipc/participantsIpc.js`
- `src/main/ipc/printIpc.js`
- `src/main/ipc/projectTransferIpc.js`
- `src/main/ipc/projectsIpc.js`
- `src/main/ipc/topsIpc.js`
- `src/main/preload.js`
- `src/main/print/printData.js`
- `src/renderer/app/Router.js`
- `src/renderer/app/projectProtocolRouting.js`
- `src/renderer/modules/ausgabe/PrintModal.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectBuilderField.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeries.uiEditorContract.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeriesEntry.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectMeetingSeriesField.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectsHubScreen.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js`
- `src/renderer/modules/protokoll/mail/ProtokollMailFlow.js`
- `src/renderer/modules/protokoll/mail/ProtokollMailPayloadService.js`
- `src/renderer/modules/protokoll/screens/TopsScreen.js`
- `src/renderer/tops/domain/TopsCloseFlow.js`
- `src/renderer/tops/domain/TopsCommands.js`
- `src/renderer/ui-editor/m80Registry.js`
- `src/renderer/ui/MainHeader.js`
- `src/renderer/ui/ParticipantsModalsBase.js`
- `src/renderer/utils/protocolPdfNaming.js`
- `src/renderer/views/MeetingsView.js`
- `src/shared/meetingSeries.cjs`
- `src/shared/meetingSeries.mjs`
- `ui-editor-target.json`

Unversionierte Prüfartefakte: `output/meeting-series-checks-2026-09-15/`; vorhandener Ordner `tmp/` erhalten.
