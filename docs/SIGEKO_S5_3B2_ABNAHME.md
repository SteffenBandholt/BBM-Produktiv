# S5.3b2 – Vorankündigungs-PDF und endgültige Fassungen

Basis main c7103ae5e74795defb77fdc9d15809054d9cb983, Branch codex/sigeko-s53b2-vorankuendigung-pdf. Führend #251/#274/#277. Rechnung #275 bleibt eingefroren. Vollständige A–F-Entscheidung vor Produktcode: SIGEKO_S5_3B2_PDF_ENTWURF.md, SIGEKO_S5_3B2_UI_ENTWURF.md und SIGEKO_S5_3B2_WORKFLOW.md.

## Umgesetzter Umfang

Vorankündigung über vorhandene Provider-/PrintShell-Infrastruktur mit gemeinsamem V2-Kopf, 80 deklarierten PDF-Zielen, getrennten Rollen und Punkt-8-Zahlen sowie leerem Unterschriftsbereich. Zu lange Inhalte werden vor der PDF-Ausgabe mit betroffenem Feld abgewiesen. Firmenanlage verwendet den bestehenden Firmenrenderer und einmalig vorbereitete Main-Daten.

Vorhandenes Formular um Vorschau, finale Erstellung, bestehenden nativen Layouteditor-Einstieg und Auswahl/Öffnung gespeicherter Fassungen ergänzt: 13 neue Ziele, 111 Pflichtrefs/112 Scopeziele, Registry 36. Dirtyzustand verlangt ausdrücklich Speichern; keine automatische Speicherung. Archivierte Projekte können bestehende Dateien öffnen.

Neue sigeko_documents-Fassungen sind unveränderlich. Einfügen erst nach vollständiger Haupt-PDF und gegebenenfalls Firmenanlage, aktuellen Lizenz-/Behörden-/Projekt-/Ablageprüfungen sowie Byte-/Hashprüfung. Fehler bereinigen nur nachweislich eigene unveränderte Dateien. Main-eigene Editor-Kontexte auf vier und 24 Stunden begrenzt. Historische Dateien werden anhand gespeicherter Referenzen geöffnet, nicht mit Live-Daten ersetzt.

V8-Projekttransfer erhält Fassungen und tatsächliche Dateien. Import kopiert und prüft zuerst in einen exklusiv reservierten neuen Ordner; bei Fehlern keine Dokumentzeilen und Bereinigung ausschließlich dieses Ordners. Export prüft die tatsächlich archivierten PDF-Bytes und aktuelle Daten vor Entfernen des Quellprojekts. Bestehende V1–V7 bleiben erhalten. Keine allgemeine atomare Dateisystemtransaktion behauptet.

## Lokale Prüfungen

Volltest: **1942 PASS / exakt dieselben 97 Baselinefehler**, gegenüber 1858/97 auf main. **+84 PASS**, keine neuen oder entfallenen Fehlernamen, keine verlorenen PASS. Maschinenvergleich in SIGEKO_S5_3B2_TESTVERGLEICH.json. Exitcode 1 aufgrund bekannter Baseline.

Gezielt bestanden: 36 Printjobfälle, 11 Provider-/Adapterfälle, 28 neue Dokumentworkflowfälle mit realer SQLite/Dateien, 15 reale V8-ZIP-Prüfungen, 36 Formulartests (12 neu), 9 PDF-Renderer-/Adaptertests und 9 Manifestprüfungen. Bei lokalen Fachworkflowtests sind nur Render-/Fenstergrenzen injiziert; dies ist kein tatsächlicher Chromium-PDF- oder GUI-Nachweis.

Unabhängiger Review fand zwei reparierte Fehler: Schattenvariable in Druckoptionen veränderte den bisherigen Editor-Metadatenvertrag; Änderung der Standardablage während V8-Import konnte Dateien an einem überholten Pfad erfolgreich importieren. Beide durch gezielte Regressionstests abgesichert. Neue IPC-/Tabelleninventare in bestehenden Grenztests ergänzt; Lizenzentzug sperrt sämtliche neuen Preload-Aufrufe. Gemeinsame Druckanschlüsse separat committet. git diff --check bestanden.

## Noch ausstehende Integrationsnachweise

Windows-/Linux-Workflows sind vorbereitet, aber noch nicht als bestanden bewertet: tatsächliche Vorankündigung/Vorschau/Firmenanlage, 80 gemountete PDF-Ziele, Schriftänderung und Rücknahme, zwei unveränderte Fassungen, benannter Overflow ohne Datei/DB-Zeile; alle 49 bestehenden PDF-Seitenzahlen und Struktursnapshots. Formularprüfung umfasst sieben erreichbare Sticky-Aktionen bei 1280, 560 und 560×480, native Fassungswahl und historische Dateizugriffe. Windows baut den unveränderten vorhandenen Kit-Manager und prüft echten Einstieg/Reiter PDF-Ausgabe/Vorankündigungsbaum mit Screenshot.

Eine persönliche manuelle Abnahme wird nicht behauptet. PR-Review, Plattformnachweise, Integration und GitHub-Abschlussdokumentation stehen noch aus. Danach direkt S5.4; keine Unterschrifts-/Mailprozessampel oder Folgepakete in diesem Stand.
