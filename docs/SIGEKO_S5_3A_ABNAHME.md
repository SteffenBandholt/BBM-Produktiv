# S5.3a – Abnahme des gemeinsamen Druckzugangs

Basis main `93bdf8837a6e8b00b6e9fe467bb9b0897d8dd6ca`, Ergebnisbranch `codex/sigeko-s53a-shared-print-access`, [PR #336](https://github.com/SteffenBandholt/BBM-Produktiv/pull/336). Produktcommit `515895667fd969552c2a52f511990484df572cca`, Baum `6ca40548a4324e9c5b76244f5602cf5da749b421`. Der Abschlusscommit ändert ausschließlich Dokumentation. Mergehash wird nach Integration in #251/#274/#277 dokumentiert.

## Ergebnis und Dateiumfang

Gemeinsamer getPrintRuntimeContext in src/main/print/printData.js, expliziter Modul-/Projekt-/Storagezugang in src/main/print/sharedFirmsPrintAccess.js, Einbindung in vorhandene Jobs in src/main/ipc/printIpc.js. Zusätzlich scripts/tests/sharedFirmsPrintAccess.test.cjs, scripts/tests/printJobLifecycle.test.cjs, scripts/testGroups.cjs, .github/workflows/sigeko-projects.yml und Paketdokumentation/Status/Roadmap.

Keine neue Dokumentstruktur, kein eigener Firmenrenderer oder Profilstore, keine Änderung an PrintShell/Pager/Provider-/Legacy-Ausgabe. Rechnung #275 eingefroren. Vollständige vor Code ausgegebene A–F-Entscheidung: SIGEKO_S5_3A_DRUCKANBINDUNG.md.

## Tests und genaue Baseline

11 neue SQLite-/Lizenz-/Kontexttests PASS. 19 bestehende Printjobprüfungen PASS, davon 8 neu. Der Jobtest verwendet den tatsächlichen Print-IPC mit kontrollierten OS-/Fenstergrenzen; dies ist keine neue visuelle Abnahme eines fachlichen VA-Dokuments.

Volltest: 1841 PASS / 97 bekannte Fehler gegenüber 1822/97 auf integriertem S5.2-main. Exakter Vergleich von Fehlernamen und Häufigkeiten: keine neuen/entfernten Fehler, keine verlorenen PASS; +19 PASS, keine Namensaliase. Detail in SIGEKO_S5_3A_TESTVERGLEICH.json. Erwarteter Volltest-Exitcode 1 wegen unveränderter Baseline.

[Formular-/Persistenzlauf 34398518851](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34398518851): Linuxjob 102624272980 und Windowsjob 102624273276 vollständig SUCCESS. Neue Access-/Printjobtests ebenfalls PASS. Bestehende reale Electron-/SQLite-Bedienung je 22 Prüfungen, report.ok=true, rendererErrors=[], manualConfirmed=false. Keine persönliche manuelle Abnahme behauptet. Keine Formulargeometrie in diesem Paket geändert.

[PDF-Acceptance 34398518866](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34398518866): Linuxjob 102624273385 und Windowsjob 102624273210 SUCCESS. Tatsächlicher bestehender technischer PDF-/Storage-/Vorschau-/Editor-Regenerationsweg PASS. Auf Linux alle 49 bestehenden Golden-Seitenzahlen und vollständigen strukturellen Snapshots unverändert. Damit bestehende PDF-Verträge regressionsgeprüft; die fachliche Vorankündigungs-PDF folgt getrennt.

[Allgemeine npm-CI 34398518819](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34398518819) weiterhin FAILURE: unverändert fehlendes ui-editor-kit im allgemeinen Job sowie bekannte Popup-/Lizenzbaseline. Diese CI ist kein grüner Volltest; die vollständige exakte Baselineprüfung erfolgte lokal mit dem vorhandenen Kit.

## Review und Wiederholungsrunde

Unabhängiger lesender Reviewagent hat zwei konkrete Randfälle reproduziert: Lizenzentzug während asynchroner Modusauflösung ließ zunächst einen Datenread zu; ein zwischenzeitlich angelegtes gleichnamiges Dokument konnte überschrieben werden. Korrekturen: erneute Prüfung unmittelbar vor getPrintData und exklusives wx-Schreiben ausschließlich im neuen expliziten Modulweg. Beide Fälle sind durch tatsächliche Jobtests gesichert; Lizenzfall hat null Datenreads/Fenster/Dateien, Dateifall bewahrt ursprüngliche Bytes und meldet EEXIST. Anschließendes Review ohne offene Blocker, git diff --check PASS. GitHub-Reviews und Inline-Threads vor Abschluss leer; frischer main weiterhin Ausgangsbasis.

## Arbeitsmodus und Fortsetzung

Goal-Arbeitslauf mit unabhängigem Review; Produktänderungen zentral koordiniert. Konkrete Randfälle repariert und erneut geprüft. Paketkriterien erfüllt, keine neuen Regressionen. Nach PR-Prüfung/Integration automatisch S5.3b mit eigener vollständiger PDF-Entwurfsentscheidung, Snapshot, gemeinsamem V2-Kopf und echten Dokument-Guardrails. Gesamt-S5 bleibt offen.
