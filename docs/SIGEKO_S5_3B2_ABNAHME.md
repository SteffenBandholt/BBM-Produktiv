# S5.3b2 – Vorankündigungs-PDF und endgültige Fassungen

Basis main c7103ae5e74795defb77fdc9d15809054d9cb983, Branch codex/sigeko-s53b2-vorankuendigung-pdf. Führend #251/#274/#277. Rechnung #275 bleibt eingefroren. Vollständige A–F-Entscheidung vor Produktcode: SIGEKO_S5_3B2_PDF_ENTWURF.md, SIGEKO_S5_3B2_UI_ENTWURF.md und SIGEKO_S5_3B2_WORKFLOW.md.

## Umgesetzter Umfang

Vorankündigung über vorhandene Provider-/PrintShell-Infrastruktur mit gemeinsamem V2-Kopf, 81 deklarierten PDF-Zielen, getrennten Rollen und Punkt-8-Zahlen sowie leerem Unterschriftsbereich. Zu lange Inhalte werden vor der PDF-Ausgabe mit betroffenem Feld abgewiesen. Firmenanlage verwendet den bestehenden Firmenrenderer und einmalig vorbereitete Main-Daten.

Vorhandenes Formular um Vorschau, finale Erstellung, bestehenden nativen Layouteditor-Einstieg und Auswahl/Öffnung gespeicherter Fassungen ergänzt: 13 neue Ziele, 111 Pflichtrefs/112 Scopeziele, Registry 36. Dirtyzustand verlangt ausdrücklich Speichern; keine automatische Speicherung. Archivierte Projekte können bestehende Dateien öffnen.

Neue sigeko_documents-Fassungen sind unveränderlich. Einfügen erst nach vollständiger Haupt-PDF und gegebenenfalls Firmenanlage, aktuellen Lizenz-/Behörden-/Projekt-/Ablageprüfungen sowie Byte-/Hashprüfung. Fehler bereinigen nur nachweislich eigene unveränderte Dateien. Main-eigene Editor-Kontexte auf vier und 24 Stunden begrenzt. Historische Dateien werden anhand gespeicherter Referenzen geöffnet, nicht mit Live-Daten ersetzt.

V8-Projekttransfer erhält Fassungen und tatsächliche Dateien. Import kopiert und prüft zuerst in einen exklusiv reservierten neuen Ordner; bei Fehlern keine Dokumentzeilen und Bereinigung ausschließlich dieses Ordners. Export prüft die tatsächlich archivierten PDF-Bytes und aktuelle Daten vor Entfernen des Quellprojekts. Bestehende V1–V7 bleiben erhalten. Keine allgemeine atomare Dateisystemtransaktion behauptet.

## Lokale Prüfungen

Volltest: **1947 PASS / exakt dieselben 97 Baselinefehler**, gegenüber 1858/97 auf main. **+89 PASS**, keine neuen oder entfallenen Fehlernamen, keine verlorenen PASS. Maschinenvergleich in SIGEKO_S5_3B2_TESTVERGLEICH.json. Exitcode 1 aufgrund bekannter Baseline.

Gezielt bestanden: 38 Printjobfälle, 11 Provider-/Adapterfälle, 28 neue Dokumentworkflowfälle mit realer SQLite/Dateien, 15 reale V8-ZIP-Prüfungen, 36 Formulartests (12 neu), 12 PDF-Renderer-/Adaptertests und 9 Manifestprüfungen. Bei lokalen Fachworkflowtests sind nur Render-/Fenstergrenzen injiziert; dies ist kein tatsächlicher Chromium-PDF- oder GUI-Nachweis.

Unabhängiger Review fand drei reparierte Fehler: Schattenvariable in Druckoptionen veränderte den bisherigen Editor-Metadatenvertrag; Änderung der Standardablage während V8-Import konnte Dateien an einem überholten Pfad erfolgreich importieren. Zusätzlich konnte das Lesen von win.webContents nach Zerstörung des Druckfensters die Fehlerbereinigung unterbrechen; die vorab erfasste Referenz verhindert diesen Hänger. Alle drei durch gezielte Regressionstests abgesichert. Neue IPC-/Tabelleninventare in bestehenden Grenztests ergänzt; Lizenzentzug sperrt sämtliche neuen Preload-Aufrufe. Gemeinsame Druckanschlüsse separat committet. git diff --check bestanden.

## Plattformnachweise

Geprüfter Produktstand: 49fba31c10aa774c9085ecea4f4aa6abe858fbc2. PDF-CI 34437646316 unter Windows und Linux PASS: tatsächliche Vorankündigung, interne Vorschau, Firmenanlage, 81 gemountete PDF-Ziele mit allen sechs Attributen, Schriftänderung 9 auf 10 pt und Rücknahme, zwei unveränderte Fassungen, benannter Overflow ohne Datei/DB-Zeile. Alle 49 bestehenden PDF-Seitenzahlen und vollständigen strukturellen Snapshots unverändert.

Formular-CI 34437646334 unter Linux mit 24 und Windows mit 25 realen Bedienprüfungen PASS, jeweils rendererErrors=[]. Sieben Sticky-Aktionen bei 1280, 560 und 560×480, native Fassungswahl, echte Vorschau/finale Dateien/Firmenanlage und historische Dateizugriffe. Unter Windows startet die echte Formularaktion den unveränderten produktiven Kit-Manager, UIAutomation wählt dessen tatsächlichen Reiter PDF-Ausgabe, der Vorankündigungsbaum zeigt 81 registrierte Ziele, native Diagnose bleibt leer. Screenshot geprüft. Das belegt Öffnen und Reiterwahl; Fontänderung/Undo/Regeneration werden separat durch den realen PDF-/Adapterlauf belegt, nicht als native Mausklickabnahme ausgegeben.

Das bestehende native Kit-Fenster ist auf dem 1024×768-CI-Desktop beim ersten Öffnen teilweise außerhalb des sichtbaren Bereichs; keine vollständige Kleinbildschirmabnahme des generischen Kit-Editors behauptet. Die SiGeKo-Formularaktionen selbst sind auch bei 560×480 vollständig erreichbar. Der Kit wird in diesem Fachpaket nicht umgebaut.

## Reparaturen aus der realen Abnahme

Die alte Windows-Vorschauerkennung prüfte nur eine horizontale Linie, die im Vorankündigungsformular Kontakttext traf und eine korrekt gezeichnete Seite fälschlich ablehnte. Mehrere räumlich getrennte Zeilen bestätigen nun dieselben Seitenränder, weiterhin mit Mindestweißfläche und tatsächlichem Text. Zwei Regressionstests sichern den beobachteten Fehlalarm und Ablehnung leerer/grauer/schmaler/isoliert weißer Flächen ab.

Die native Startdiagnose identifizierte anschließend pdf_invalid_page_zone: Der erste einzelne Headerblock definierte die gesamte Headerzone und schloss den zweiten aus. Vollständige A–F-Ergänzung vor der Reparatur im PDF-Entwurf. Ein realer gemeinsamer PrintShell-Kopfcontainer ist nun alleiniger Header mit zwei gesperrten Untergruppen; kein Ausweiten auf eine seitenweite Ersatz-Kopfzone. Gemeinsamer Container separat in 1d78ee2c155cd3ffdcb4660bc7cb9f03d3fb9878; SiGeKo-Vertrag in 49fba31c10aa774c9085ecea4f4aa6abe858fbc2. Registryversion 2 mit 81 Zielen. Die Windows-Vorschau vor und nach diesem Strukturfix ist pixelgleich: SHA-256 da020e0447c696c5e86bc577a541b0285f9a4fd7f11cc841eddf0efac1a13ce2. Unabhängiger Review der Reparatur ohne Restblocker.

## Abschluss und verbleibende Grenzen

PR #338 gegen main; abschließender Commit ausschließlich Dokumentation. Nachweise und operative Planung werden gemeinsam abgeschlossen. Allgemeine npm-CI bleibt separat bekannte Kit-/Popup-/Lizenzumgebungsbaseline; die exakten 97 Fehler beziehen sich auf den vollständigen lokalen Lauf mit vorhandenem Kit. Kein pauschaler grüner npm-CI-Status behauptet.

Keine persönliche manuelle Abnahme behauptet. Geprüfte Arbeitsweise: Goal-Lauf mit unabhängiger Fehleranalyse/Review, reale Electron-/Windows-UIAutomation-Bedienung und PDF-Ausgabe. Alle Paket-Abnahmekriterien erfüllt; die genannte allgemeine Kit-Fenstergröße ist kein behobener Bestandteil dieses Pakets. Fachliche Rücklauf-/Unterschrifts-/Mailampel folgt separat in S5.4. Rechnung #275 bleibt eingefroren.
