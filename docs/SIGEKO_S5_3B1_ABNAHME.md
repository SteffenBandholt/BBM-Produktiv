# S5.3b1 – Abnahme des internen Snapshotvertrags

Basis main `94333bccd3d75e0757f4fb8d72e8dbf9441f44e4`, Branch `codex/sigeko-s53b-document-snapshot`, [PR #337](https://github.com/SteffenBandholt/BBM-Produktiv/pull/337). Produktcommit `c4eb5f90f284aeb86aa0a2fbef3ff895b56430d5`, Baum `fad26a9b8ab59bd91b755fc437c1abfa15d662a4`. Der abschließende Commit ändert ausschließlich Dokumentation; Mergehash wird nach Integration in #251/#274/#277 dokumentiert.

## Ergebnis und Dateiumfang

Main-interne Capturefunktion in src/main/domain/sigeko/PreNotificationSnapshotService.js und JSON-Vertrag in src/shared/sigeko/preNotificationSnapshots.cjs. Bestehende Adressnormalisierung unverändert aus ProjectAuthorityService.js in den bestehenden SiGeKo-Vertrag projectAuthorities.cjs ausgelagert und von beiden Prüfwegen verwendet. Zusätzlich scripts/tests/sigekoPreNotificationSnapshot.test.cjs, scripts/testGroups.cjs, .github/workflows/sigeko-projects.yml und Paket-/Status-/Roadmapdokumentation.

Snapshot erfasst serverseitige Identität/Zeit, aktuelle Formularwerte, Entwurfsidentität/-revision, tatsächlichen Behördennachweis, vorhandenen gemeinsamen Druckkontext und Warnhinweise. Tiefe Unveränderlichkeit und verlustfreies JSON; getrennte Rollen und beide Punkt-8-Zahlen, Null und 0 bleiben verschieden. Keine Client-Snapshotannahme. Lizenz-, Entwurfs- und Projektwechsel während asynchronem Kontextladen führen zu einem konkreten Fehler.

Keine neue UI/PDF-Struktur, IPC, Tabelle, gespeicherte vorläufige Dokumentfassung oder Prozessampel. Rechnung #275 eingefroren. Der konkrete Paketschnitt und die vor Code ausgegebene A–F-Entscheidung stehen in SIGEKO_S5_3B1_SNAPSHOTVERTRAG.md.

## Prüfungen

17 neue Tests PASS, ausgeführt mit tatsächlicher SQLite, bestehenden Entwurfs-/Rollen-/Behördenservices, echtem Lizenzguard und tatsächlichem getPrintRuntimeContext. Abgedeckt sind Quellenänderungen nach Capture/JSON-Roundtrip, tiefe Unveränderlichkeit, exakte Behördenmetadaten, orange Quelle ohne Verlust des alten Nachweises, getrennte Rollen/Zahlen, unbekannte/null/0-Werte, manuelle Ganzmonate, unbekannte Eingaben, Clientidentität, Revision und gleichrevidierte Neuanlage sowie Lizenz-/Projektwechsel während der Vorbereitung. Nicht serialisierbare Werte/Getter/verborgene Eigenschaften werden abgewiesen.

Volltest 1858 PASS / exakt dieselben 97 Baselinefehler gegenüber 1841/97 auf integriertem S5.3a-main. Keine neuen/entfernten Fehler, keine verlorenen PASS, +17 Tests, keine Namensaliase. Maschinenvergleich in SIGEKO_S5_3B1_TESTVERGLEICH.json. Erwarteter Exitcode 1 wegen unveränderter Baseline.

[Windows-/Linux-Persistenz-/Formularlauf 34400974507](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34400974507): Linuxjob 102632499405 und Windowsjob 102632499130 vollständig SUCCESS; jeweils alle 17 neuen Tests PASS, bestehende reale Formulare je 22 Bedienprüfungen PASS, report.ok=true, rendererErrors=[] und manualConfirmed=false. Keine persönliche manuelle Abnahme behauptet; keine Formulargeometrie in diesem Paket geändert. Dieses reine Datenpaket beansprucht keinen neuen PDF-Satz-/Raster-Nachweis.

[Allgemeine npm-CI 34400974642](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34400974642), Job 102632499354, bleibt FAILURE wegen fehlendem ui-editor-kit sowie bekannten Popup-/Lizenzprüfungen. Kein pauschal grüner CI-Status. Die exakte Volltest-Baselineprüfung erfolgte lokal mit vorhandenem Kit.

## Review und Wiederholung

Lesende Architekturprüfung empfahl den engen Capturevertrag vor endgültiger Persistenz: keine zusätzlichen Pending-/Recoveryzustände oder Dokumente ohne Datei. Unabhängiger Review-/Testagent erstellte ausschließlich die neue Testdatei. Der Review reproduzierte eine zu strenge Adresskohärenzprüfung: bestehender Behördendienst ließ Testort/TESTORT bereits korrekt als gleich gelten, der neue Validator zunächst nicht. Repariert durch identische gemeinsame bisherige Normalisierung; tatsächlicher Regressionstest einschließlich abweichender Hausnummer grün. Entwurfsersetzung mit gleicher Revision wird zusätzlich anhand der Entwurfs-ID erkannt. Wiederholter Gesamt-Pakettest 17/17 PASS, keine verbleibenden Reviewblocker; git diff --check PASS. GitHub-Reviews und Inline-Threads vor Abschluss leer.

## Arbeitsmodus und Fortsetzung

Goal-Arbeitslauf mit unabhängigem Daten-/PDF-Architekturentwurf und gezieltem Review/Testunterauftrag; Produktänderungen zentral koordiniert. Visuelle Neuabnahme für den reinen Datenvertrag nicht erforderlich. Nach PR-Integration direkt S5.3b2 mit vollständiger PDF-/UI-Entscheidung, tatsächlichem Formular-PDF, erfolgreicher finaler Ablage und V8-Transfer. Gesamt-S5 offen. Finale Fassungen werden erst nach erfolgreicher Haupt-PDF und gewählter Firmenanlage gespeichert; alte Dateien bleiben maßgeblich.
