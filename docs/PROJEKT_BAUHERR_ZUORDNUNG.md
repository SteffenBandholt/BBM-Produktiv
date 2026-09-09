# Zentrale Bauherrzuordnung – Vorbereitung für SiGeKo S3

Base: main `03d894f075c85bb1ea7cf79c552947dd8a70e437` (PR #328).
Branch: `codex/project-bauherr-reference`.
Fachentscheidung: Steffens ausdrückliche Bestätigung, dokumentiert in #274,
Kommentar 5595638596; ersetzt den Zuordnungsstopp 5595499873.

## Umfang

Der Bauherr wird im zentralen Projektformular bewusst aus vorhandenen globalen
oder zum selben Projekt gehörenden Firmen ausgewählt. Die veränderbare
Firmenkategorie ist keine Zuordnungsregel. Es werden ausschließlich Art und ID
referenziert; Namen, Anschrift und Kontaktdaten bleiben Eigentum der Firmenpflege.
Neue Firmen werden weiterhin über die vorhandene Firmenverwaltung angelegt.

Die neue Auswahl gehört zum bestehenden Projekt-Speichern, ohne Autosave. Bei
Neuanlage verlangt das Formular eine Auswahl aus globalen Firmen; projektbezogene
Firmen können nach Projektanlage verwendet werden. Altprojekte bleiben zunächst
unzugeordnet und bearbeitbar. Bestehende interne Create-Aufrufe ohne Bauherrfeld
bleiben kompatibel; dies ist keine neue globale API-Pflichtsperre für alle Module.
Die spätere Readiness bewertet fehlende Zuordnungen als unvollständig.

Unveränderte Zuordnungen werden nicht erneut gesendet. Auch eine später fehlende
Firma wird bei anderen Projektänderungen nicht still ersetzt oder gelöscht.
Bewusstes Leeren sendet null; eine neue Wahl sendet die typisierte Firmenreferenz.
Ladefehler erhalten den Entwurf und bieten Aktualisieren; ungültige oder inzwischen
entfernte Firmen werden vor dem Schreiben abgewiesen. Archivierte Bauherrzuordnungen
sind schreibgeschützt. Andere bestehende Archivregeln werden nicht erweitert.

## Gemeinsame Daten- und Anwendungsgrenze

Zwei nullable TEXT-Spalten in der bestehenden projects-Tabelle:
`bauherr_firm_kind` und `bauherr_firm_id`. Additive wiederholbare zentrale Migration,
keine automatische Bestandszuweisung. Alle bisherigen SELECT-/INSERT-Fallbacks
erhalten die Felder. Das zentrale Create-/Update-Payload nutzt ausschließlich
`bauherr: {kind, id}` oder null; direkte Rohspalten umgehen die Validierung nicht.
Undefined oder ein fehlendes Feld erhält den bisherigen Bezug.

Der vorhandene FirmDirectoryService prüft die Quelle in derselben SQLite-Datei.
Es gibt keine zweite Kontaktverwaltung, neue Datenbank oder Fachmodullizenzpflicht.
`projects:getBuilder` / `projectsGetBuilder({projectId})` liefern
`{ok,data:{ref,firm,sourceMissing}}`. Verbraucher wie SiGeKo können damit die aktuelle
zentrale Firma lesen, ohne sie zu kopieren. Fehlende Quellen bleiben erkennbar;
Infrastrukturfehler werden nicht als erfolgreiche leere Auflösung ausgegeben.
Der gemeinsame Directory kann seine bestehenden Nutzungsdaten beim ersten Zugriff
migrieren; es wird kein pauschal schreibfreier erster Datenbankzugriff behauptet.

## Projekttransfer

Bestehender ZIP-Weg, Archivformat 5 nur bei gesetzter Bauherrreferenz. Ohne Bauherr
bleiben Version 3 beziehungsweise 4 bei SiGeKo-Daten erhalten. Version 5 schützt vor
stillem Verwerfen durch ältere Importer. Referenz und eigene Projektfirma werden
innerhalb derselben bestehenden SQLite-Importtransaktion wiederhergestellt.

Globale Bauherrfirmen werden auch ohne Projektbeteiligten-Zuordnung im vorhandenen
Abhängigkeitssnapshot erfasst. Die bestehende Transferregel bleibt bestehen:
eine globale Firma muss am Ziel mit gleicher ID und gleichem Namen vorhanden sein;
sie wird nicht automatisch neu angelegt. Fehlende/kollidierende globale Quellen,
mehrdeutige Snapshots und fremde Projektfirmen werden abgewiesen.

Eine gelöschte, nicht mehr exportierbare Bauherrquelle muss vor einem Export bewusst
korrigiert oder entfernt werden. Der Export stoppt davor und erhält das lokale
Projekt samt Dateien. Eine lediglich deaktivierte noch vorhandene Projektfirma kann
mit ihrer historischen Referenz transportiert werden. Der vorhandene nachgelagerte
Dateikopierablauf wird nicht neu gestaltet.

## UI-Editor und Prüfweg

Entscheidung vor Umsetzung: `PROJEKT_BAUHERR_UI_ENTWURF.md`.
Eigenständiger Scope `projektverwaltung.builder`, vollständiger lokaler Vertrag
mit sieben Pflichtslots und optionalem Entwicklungsstarter. Registry-Version 32,
gemeinsame Projektformular-Scopegruppe mit unverändertem plannedStart-Vertrag.
Bestehende Fachmodule und ihre Scope-Fingerprints bleiben unverändert.

Echte Kit-Komponentenvalidierung (16 Komponenten, 441 Elemente) und Manifest-/Restore-
Prüfungen grün. Der bekannte alte HTML-Parser ist kein grüner Nachweis für M83.
Der Quellenreview fand zwei Lebenszyklusfehler bei verzögerten Antworten nach
Schließen/Wiederöffnen; Launcher-Ref-Erhalt und Neustart einer abgebrochenen Ladung
wurden korrigiert und erhalten gezielte Regressionstests.

Frischer Volltest des unveränderten main: 1601 grün / 97 bekannte Baselinefehler.
Kandidat: **1641 grün / exakt dieselben 97 Fehlernamen und Häufigkeiten**.
40 zusätzliche grüne Prüfungen (18 Backend, 10 ZIP, 12 Formular), keine fehlende
Bestandsprüfung. Drei historische Registry-Erwartungen wurden genau um den neuen
Scope/Vertrag ergänzt; erster Kandidat 1638/100, danach 1641/97.
Maschinenlesbarer Vergleich: `PROJEKT_BAUHERR_TESTVERGLEICH.json`.
Produktcommit `1ace64ba10cf85a8f81022a283a17990ec066f8b`, Tree
`7e526e5a75be448a71b84084b22649241b99e66a`. PR #329.
Windows-/Linux-Electron-Abnahme: **34310878375 vollständig PASS**.
Geprüfter Head `77bb3e53fc4b9fb76cc4945626b266a3f1cb01b2`.
[CI und Artefakte](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34310878375). Vorhandene isolierte Abnahmeplattform, echte Produkt-IPC/SQLite,
keine Ersatzplattform und kein behaupteter persönlicher manueller PASS.

## Paketgrenzen

Dies ist ein zentrales Vorbereitungspaket, noch keine SiGeKo-Readiness-Anzeige.
Architekt/Planer und weitere Rollen werden nicht zu zentralen Pflichtrollen.
Rechnung #275 bleibt eingefroren. Behörden bleiben S4; die PDF Januar 2022 ist nur
spätere Referenz, vor Übernahme auf Aktualität zu prüfen. Keine PDF-/Mailänderung.

## Geänderte Dateien

- `.github/workflows/sigeko-projects.yml`
- `STATUS.md`
- `docs/MODULARISIERUNGSPLAN.md`
- `docs/PROJEKT_BAUHERR_TESTVERGLEICH.json`
- `docs/PROJEKT_BAUHERR_UI_ENTWURF.md`
- `docs/PROJEKT_BAUHERR_ZUORDNUNG.md`
- `scripts/runPlannedStartFormAcceptance.cjs`
- `scripts/testGroups.cjs`
- `scripts/tests/m80ElectronUiEditor.test.cjs`
- `scripts/tests/m82-1BbmFeintuning.test.cjs`
- `scripts/tests/m83-0ComponentContracts.test.cjs`
- `scripts/tests/plannedStartForm.test.cjs`
- `scripts/tests/plannedStartFormAcceptance.html`
- `scripts/tests/projectBuilder.test.cjs`
- `scripts/tests/projectBuilderForm.test.cjs`
- `scripts/tests/projectBuilderTransfer.test.cjs`
- `scripts/tests/sigekoEditorManifest.test.cjs`
- `src/main/db/database.js`
- `src/main/db/projectsRepo.js`
- `src/main/domain/projects/projectBuilder.js`
- `src/main/ipc/projectTransferIpc.js`
- `src/main/ipc/projectsIpc.js`
- `src/main/preload.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectBuilder.uiEditorContract.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectBuilderField.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js`
- `src/renderer/ui-editor/m80Registry.js`
- `ui-editor-target.json`

## Praktische Nachprüfung / Abgrenzung

Erster Lauf 34310720819: Linux brach bei der simulierten Tastaturauswahl ab;
Windows wurde durch Matrix-fail-fast abgebrochen. Kein Produktfehler daraus behauptet.
Im bestehenden Harness Electron-Taste Down und expliziter Fenster-/WebContents-Fokus
korrigiert. Folgecommit `77bb3e53fc4b9fb76cc4945626b266a3f1cb01b2`, Tree
`0503869e021d611e9f58c6873fbe26ec761b17ee`; gegenüber dem Volltestprodukt nur diese
zwei Harnesszeilen geändert. Produktcode unverändert.

Windows und Linux im Folgelauf 34310878375 vollständig PASS; beide breiten und
beide schmalen Screenshots gesichtet. Beide Reports ok=true/manualConfirmed=false.
Echte neutrale Core-IPC/SQLite ohne freigeschaltetes Fachmodul: Tastaturauswahl,
Maus-Speichern, Neustart, zentrale Leseauflösung, Fremdprojektabgrenzung, Cancel,
später entfernte Quelle mit Ablehnung/Entwurferhalt/Retry sowie explizites Leeren.
Alle 40 neuen und bestehenden Workflow-Pakettests sowie der unveränderte SiGeKo-
Formularablauf grün. Der Editor-Fontwechsel verändert keine Projektzeile.
Die neue Bauherrkomponente und der Speichern-Button sind bei 560 px innerhalb des
Viewports; Label, Auswahl, Hinweise und Aktualisieren überlagern sich nicht.
Der unveränderte obere Altbereich des Projektformulars zeigt bei dieser schmalen
Breite zusammengedrängte/überlagerte Projektleitungslabels und gekürzte Felder.
Das ist ausdrücklich keine vollständige Freigabe des alten Formularlayouts bei
560 px. Dieser Bereich wurde nicht umgestaltet oder als neuer Editorbestand erfasst.

Allgemeine npm-CI 34310878402 bleibt rot: UI-Editor-kit fehlt dort, daneben bekannte
Popup-/Lizenzfehler. Dedizierter Workflow verwendet das vorhandene Kit mit festem
Commit; lokale vollständige Baseline bleibt die maßgebliche Regressionsabgrenzung.

## Abschluss

Zentrales Vorbereitungspaket technisch geprüft und über PR #329 zur Integration
bereit. Quellenreview der Daten-/Transfergrenze und unabhängige UI-Nachprüfung ohne
Restbefund im Paketdelta; die beiden Lifecyclefunde sind behoben. Goal-Arbeitslauf
mit abgegrenzten Backend-, Transfer- und Formularprüfaufgaben. Reale UI-Abnahme über
die vorhandene Windows-/Linux-CI, lokal kein Display. Kein persönlicher manueller
PASS behauptet; die restlichen Prüfungen sind auf Steffens Auftrag übernommen.

Nach dem geprüften Head folgen ausschließlich Dokumentationsänderungen. Der
Dateibaum wird vor Merge lokal/remote exakt verglichen. Nächster separater Schritt
bleibt S3 Übersicht/Readiness; der Bauherr-Zuordnungsblocker ist damit behoben.
