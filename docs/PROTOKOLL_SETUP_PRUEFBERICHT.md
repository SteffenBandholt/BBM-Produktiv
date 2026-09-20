# Protokoll-Setup: Prüfbericht vom 15.09.2026

## Ergebnis

Eine lokale NSIS-Setup.exe mit Windows-x64-Payload wurde erstellt, installiert
und technisch geprüft. Der Gesamtauftrag ist bei M4 **gestoppt**: keine gültige
signierte Testlizenz bereitgestellt; native Computer Use und eine getrennte
Windows-Umgebung/ein separater Testbenutzer sind nicht verfügbar. Daher keine
vollständige Funktionsabnahme und keine Kundenfreigabe.

Nachtrag 16.09.2026: Der Installations-/Startfehler ist behoben und praktisch
verifiziert. Ursache war die Kombination aus Ein-Klick-Setup und
`runAfterFinish: false`; das Setup installierte korrekt, startete die App danach
aber absichtlich nicht. Der Installer verwendet jetzt `runAfterFinish: true`
und den eindeutigen Verknüpfungsnamen `BBM-Protokoll-Abnahme`. Installation über
den vorhandenen Bestand endete mit Exitcode 0, startete die installierte EXE und
zeigte ein antwortendes, maximiertes Fenster mit der aktuellen BBM-1.5.0-
Startoberfläche. Desktop- und Startmenülink wurden jeweils real aufgelöst; ein
zusätzlicher Desktoplink-Start blieb als Einzelinstanz sichtbar. Die 54 vorab
erfassten produktiven und Abnahme-Daten-/Profildateien waren danach bytegenau
unverändert. Die weiter unten benannte lizenzierte Fachabnahme bleibt offen.

| Identität | Wert |
|---|---|
| Setup | `C:\01_Projekte\BBM-Produktiv\dist\protokoll-abnahme\BBM-Protokoll-1.5.0-STABLE-Abnahme-Setup.exe` |
| Größe | 594.320.214 Bytes |
| SHA-256 | `1BF2B7701F2863BD21EF531470E7BC09CB19CADC4A9B0688D7697E8DEA821B63` |
| Version / Kanal / Flavor | `1.5.0` / `STABLE` / `release` |
| App-ID | `de.bbm.baubesprechungsmanager.protokoll.abnahme` |
| Paketname / Verknüpfung | `bbm-protokoll-abnahme` / `BBM-Protokoll-Abnahme` |
| Daten | `%APPDATA%\BBM-Protokoll-Abnahme`, separate `session-data` |
| Lokale Testinstallation | `C:\Users\Steffen\AppData\Local\Programs\BBM-Protokoll-Abnahme-Test` |
| Branch | `feature/project-meeting-series` |
| HEAD | `0a91ca8c10d94fa8055b7ad6f2eef9161bdd7cdc` |
| Arbeitsstand | HEAD plus uncommittete Besprechungsreihenarbeit, vom Nutzer akzeptierte Kachelansicht und dieses Setup-Paket |
| Build-Quellenhash | `23efcd87a90376e6ff0cdc03f528523f79f9c7743c09f85e5d77c90f6cccc9b1` |
| Kit-Runtimehash | `c22ffc5ff71bffa8a0187bc008d51536fecf5564e815c31ad17c160a523b7a4d` |

Codesigning-Status: `NotSigned`. STABLE verwendet die reguläre Signaturprüfung
der BBM-Lizenz, keinen internen DEV-Lizenzprovider. Die ursprüngliche lokale
Lizenz wurde nur geprüft: `LICENSE_EXPIRED`. Die installierte Testausgabe hat
`NO_LICENSE`, `developmentLicense=false`, `buildFlavor=release`. Keine Lizenz
kopiert, erzeugt, verlängert oder umgangen.

## Buildumfang und Entwurfsentscheidung

Vor der Umsetzung wurden die Repo-/Editorsteuerungsunterlagen gelesen und
Startplanung, Arbeitsmodus und UI-/PDF-Entwurfsentscheidung ausgegeben.
Vollständige Entscheidung: [Plan](PROTOKOLL_SETUP_PLAN.md).

Ausgabe UI und PDF; installierte Ausgabe nicht editorfähig, ausdrücklicher
Nutzerauftrag. Keine neuen Editorziele/IDs/Parents oder Tabellenfreigaben.
Vorhandene Verträge/Registry v40 bleiben. Fachaktionen sind keine Editorziele.
Keine neue Satz- oder Umbruchregel; Auslieferungsweg für `PDF-V2-ARCH-003`
dokumentiert. Renderer behalten Paginierung, Fortsetzung, Köpfe und Fußreserve.

Zugänglich ist ausschließlich Protokoll einschließlich Projektverwaltung,
Kacheln, drei Reihen, Firmen/Personen/Teilnehmer/Verteiler, TOPs/Listen/Historie,
PDF-/Mail-/Dateidiensten, ZIP-Transfer, Einstellungen und Diktat. Bauherr bleibt
optional. Aktivierung bleibt Schnittmenge aus gültiger Lizenz und installiertem
Umfang. Rechnung, SiGeKo und Restarbeiten haben keine aktiven Fachmodule/Routes/
Modul-IPCs. Bestehende Imports erfordern teilweise deren Code/Registry im ASAR;
dieses Paket entfernt keine Renderer oder gemeinsamen Grundlagen.

Editor-IPC-Aktionen, direkte native Öffnung, Diagnose-/CLI-Starter,
Tabellenlayout-Schreibaktionen und Druckstruktur-Schreibaktionen sind gesperrt.
Editorseiten und Entwicklungs-/Rechnungseinstellungen werden nicht angeboten.
Interner Startlayout-Restore, Kit-Core und PDF-Adapter bleiben. Fachlicher
Texteditor `editor:open` bleibt. Source-/DEV-Editorbetrieb bleibt möglich.

### Gezielt eingefrorene Layoutdaten

Keine pauschale Profil-/Datenbankkopie. Aus geprüftem lokalem Auslieferungsstand:

- UI-Profil: Protokoll edit/list/screen, kompatible aktuelle Scope-Fingerprints;
  SHA `70f38d4ff84d5a8c1a45391fa01f6f6b1080f424286e7db9e1c1ec0a28f4bf4f`.
- PDF-Profil: `protocol`, 37 Elemente, vom vorhandenen Adapter validiert,
  unverändert; SHA `4025d6f5af74d7c22fe3907723100af311b3089c1d3307b96919fea66da2c2a7`.
- Vier vorhandene globale Layouts: `protokoll_tops` portrait/landscape,
  `protokoll_participants` portrait, `print.todo.todoTable` portrait.
- Fünf bestehende Druckabstände: top 3, left 19, right 15, bottom 18,
  footerReserve 12 mm. Zusammen mit Tabellenlayouts in `render-defaults.json`;
  SHA `03e47dd32b8296c280441eb196a49c6e599f642a72235325c6187cccd9dcb72f`.

Kacheln sind im akzeptierten Code definiert. Keine weiteren Projektverwaltungs-
Entwicklerprofile nötig. Paketmanifest prüft exakte Dateiliste und Hashes;
Startseeding erfolgt ausschließlich in der Abnahme-Datenwurzel und überschreibt
keine vorhandenen Dateien/Datensätze. Tabellenwerte werden über bestehende
Validierung gespeichert. Keine Firmen, Logos, Kunden-/Projektdaten, Lizenz,
Zugangsdaten oder Profilarchive werden ausgeliefert.

### Laufzeit / bestehender Buildweg

`node scripts/dist.cjs --protokoll` → electron-builder 24.13.3 → Electron 30.5.1
→ NSIS 3.0.4.1, explizit x64 und `--publish never`. Keine Versionsänderung oder
neue npm-Abhängigkeit. 90 vorhandene Produktionspakete wurden separat gestaged.
Kit-Junction wird in echte `package.json`/`src`/`dist`-Dateien überführt;
WPF/Windows-Manager/Test-/Entwicklerarchive werden nicht übernommen.

Electron/Chromium/Node, better-sqlite3 (Electron-ABI 123), archiver/extract-zip/
yauzl, pdfjs-dist und Kit-Render-Core sind enthalten. Offline-Diktat enthält
Whisper CLI/Server/DLLs, FFmpeg und `ggml-small.bin` (487.601.967 Bytes).
Zusätzlich Microsoft CRT/OpenMP x64 aus installiertem VS-2022-REDIST 14.44.35112:
Microsoft-Signaturen und x64-PE-Architektur wurden geprüft, DLLs app-lokal neben
Whisper geliefert. [Microsoft dokumentiert app-lokale Bereitstellung](https://learn.microsoft.com/en-us/cpp/windows/redistributing-visual-cpp-files?view=msvc-170)
und [die erforderliche OpenMP-DLL](https://learn.microsoft.com/en-us/cpp/windows/determining-which-dlls-to-redistribute?view=msvc-170).
Mail behält den vorhandenen Windows-/Mailclient-/Outlookweg; kein Mailclient
wird durch das Setup ersetzt.

## Prüfung

| Ausgeführt | Ergebnis / Grenze |
|---|---|
| Auslieferungstests | 7/7; Scope/Lizenzschnittmenge, Sourcebetrieb, Datenpfad, Hash-/Seedingregeln, Editor-/Tabellen-IPC, Router-/Modulkatalog |
| Reihen/PDF-/Mailgrenzen/M80 | 62/62 im gezielten Electron-Node-Lauf |
| UI-Vertragscheck | `--self-test` grün; kein automatischer Legacy-UI-Scan |
| Modul-IPCs / Serviceprovider / Migrationen | 7/7, 6/6, 7/7 |
| Kundenbuild / Audiomodul / Featureguards | 4/4, 12/12, 15/15 |
| Protokoll-Goldens | 25/25 Seitenzahlen und strukturelle SHA-256 gegen Golden-Manifest |
| M85 | 18/22; dieselben vier bereits dokumentierten Bestandsfehler, nicht repariert |
| Weitere Bestandsprüfungen | Development-Lizenz 6/8 (alte Modulanzahl/Badge-Assertion); Standardfeatures 26/27 (`app`-Alias). Betroffene Lizenz-/Headerquellen gegenüber Auftragsbeginn unverändert. Kein vollständig grüner Gesamtlauf behauptet. |
| Paketinhalt | 1.874 ASAR-Einträge, 10 kritische Dateien vorhanden, 0 Dateilinks, 0 geprüfte DB-/Lizenz-/Credential-/Managerverbote |
| NSIS / tatsächliche Installation | Build Exit 0; Installation `/S /D=...BBM-Protokoll-Abnahme-Test` Exit 0, pro Benutzer Steffen |
| Installierte Verknüpfung | Desktop/Startmenü zeigen auf installierte EXE, Argumente leer; normaler Desktopstart mit Fenster „BBM“, responding=true |
| Tatsächlicher Main/Preload | app.isPackaged=true; ASAR unter Installation; eigene userData/sessionData; STABLE/release |
| Editor-/Modulzugang installiert | Auch mit `--open-ui-editor`/Diagnoseflag: alle geprüften strukturellen Schreib-/Startaktionen denied; Router blockiert; Katalog/abgeleiteter Katalog nur Protokoll |
| Projekt/Einstellungen/Logo installiert | Öffentliche Core-IPCs: Testprojekt ohne Bauherr, Maske 7, Adresse/Firmendaten/Ablage/BBM-Testlogo gespeichert; EXE beendet, neu gestartet; Daten identisch, PNG dekodiert 256×256 |
| Einstellungen installiert | Vorhandene Settings-Komponenten im installierten Renderer automatisiert gerendert: keine Entwicklung/Rechnung/Druckstruktur-Regler; erlaubtes Speichern unverändert |
| Installierte SQLite/ZIP/Kit-Libs | Aus installierter EXE in Electron-Node-Testmodus: Memory-SQLite, tatsächlicher Bibliotheks-ZIP-Roundtrip und Kit-Import grün. Kein Projekttransfer-Nutzerablauf. |
| Diktatlaufzeit installiert | Tatsächliche synthetische deutsche SAPI-Sprachdatei → WebM/Opus → installiertes FFmpeg PCM → installiertes Whisper/small; korrekte Transkription, CRT/OpenMP aus Installation geladen. Server startet für `--help`. Kein Mikrofon-/lizenzgeschützter App-Diktatablauf. |
| Paketgleichheit | Gepacktes und installiertes ASAR SHA `B3E614F7B12C536E12FD5DF455688BC422966EF359497CE39EB835D90A6761BF` |
| Produktive Daten | Alle 51 vorab erfassten DB-/Lizenz-/Profildateien hashidentisch |
| Abschluss / Sperren | 0 eigene installierte Prozesse; fünf native Dateien einschließlich Repository-better-sqlite3 exklusiv geöffnet, alle entsperrt |

Der erste Terminal-Verknüpfungsstart erbte `ELECTRON_RUN_AS_NODE=1` aus der
Codex-Prozessumgebung (Benutzer/Maschine: nicht gesetzt). Danach nur im
Testprozess entfernt, normalen Verknüpfungsstart wiederholt und bestätigt.
Ein zu früher Inspector-Test wurde mit Fensterbereitschaft erneut ausgeführt.
Der Node-Modus stellt das Electron-GUI-Modul nicht bereit; der abschließende
Diktatnachweis verwendet deshalb die tatsächlich installierten nativen Programme.
Keine dieser Testharness-Korrekturen verändert den Installer/Benutzerbetrieb.
Ein Chromium-GPU-Shutdownhinweis steht im Core-Testlog; die geprüften Abläufe
bestanden, eine native optische Bewertung ist nicht verfügbar.

Keine echten Klicks/Tastatureingaben/Mikrofonaufnahme/Outlookbedienung durch
Computer Use ausgeführt. Programmstart erfolgte über die installierte
Verknüpfung; Core-/Rendererprüfungen waren automatisierte API-/Komponententests.
Diese ersetzen keine menschliche Abnahme.

Belege: `output/protokoll-setup-2026-09-15/` mit Build-/Installationslogs,
`artifact.json`, `preflight.json`, `package-inventory.json`, `installed-runtime.json`,
`installed-core-write.json`, `installed-core-restart.json`,
`installed-audio-results.json`, `protocol-golden-comparison.json`,
`protected-data-after.json`, `cleanup.json` und Git-Status. Das ursprüngliche
Core-Gruppenprotokoll enthält den anschließend gezielt reparierten Migrationstest;
der erfolgreiche Wiederholungslauf ist im Arbeitslauf belegt. Gebackene Datei-
und Kit-Hashes stehen in `dist/protokoll-abnahme/build-provenance.json`.

## Geänderte Dateien dieses Pakets

Vorhandene Änderungen wurden erhalten. 26 Dateien für diesen Auftrag:

- `STATUS.md`
- `docs/MODULARISIERUNGSPLAN.md`
- `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
- `docs/PROTOKOLL_SETUP_PLAN.md` (neu)
- `docs/PROTOKOLL_SETUP_PRUEFBERICHT.md` (neu)
- `docs/PROTOKOLL_SETUP_ABNAHME.md` (neu)
- `scripts/dist.cjs`
- `scripts/protokollDist.cjs` (neu)
- `scripts/protokollSetupAudit.cjs` (neu)
- `scripts/tests/moduleMigrationRegistration.test.cjs`
- `scripts/tests/protokollDistribution.test.cjs` (neu)
- `src/main/distributionPolicy.js` (neu)
- `src/main/main.js`
- `src/main/moduleRegistry.js`
- `src/main/preload.js`
- `src/main/ipc/settingsIpc.js`
- `src/main/ipc/tableLayoutsIpc.js`
- `src/main/ipc/uiEditorIpc.js`
- `src/main/ui-editor/electronUiEditorSession.js`
- `src/renderer/app/Router.js`
- `src/renderer/app/modules/moduleCatalog.js`
- `src/renderer/views/SettingsView.js`
- `resources/protokoll-layouts/manifest.json` (neu)
- `resources/protokoll-layouts/render-defaults.json` (neu)
- `resources/protokoll-layouts/module-protokoll/standard.layout-profile.json` (neu)
- `resources/protokoll-layouts/module-protokoll/pdf-layouts/bbm-produktiv.protocol.pdf-standard.pdf-layout.json` (neu)

Die Liste umfasst **26** Dateien (15 vorhandene und 11 neue). Buildausgaben,
Testbelege und gleichlautende Übergabedokumente unter `dist/`/`output/` kommen
als lokale Artefakte hinzu; keine persönlichen Daten im Setup.

## Risiken / offen

- Keine getrennte Windows-VM/Testbenutzerprüfung möglich: Lenovo, kein natives
  CUA/Sky, keine erreichbare Sandbox/VM, keine Administratorrechte/Testzugänge.
  Sichere App-/Datenisolierung unter Steffen ist nur ein technischer Fallback.
- Gültige signierte Protokoll-/Diktatlizenz fehlt; Nutzer nach einem vorhandenen
  Dateipfad gefragt. Keine positive installierte Fachfunktionsprüfung:
  drei Reihen/Firmen/Fortführung/Listen/Historie, PDF-Vorschau/Logo/Adresse/Art,
  richtiger Mailanhang, App-Mikrofon/Transkription, Projekt-ZIP-Export/Wiederimport.
- Bekannte Bestandschecks nicht grün; keine M85-/Lizenz-/Headernebenreparatur.
- Menschliche Abnahme durch Steffen bleibt erforderlich. Anleitung:
  [Installation und Abnahme](PROTOKOLL_SETUP_ABNAHME.md).

## Status

M1/M2/M3 technisch abgeschlossen. **Gestoppt bei M4 wegen fehlender Lizenz und
nativer isolierter Bedienprüfung.** Setup lokal zur weiteren Nutzerabnahme
bereitgestellt. Kein Commit, Merge, Push, Branchwechsel oder externe Veröffentlichung.
Git-HEAD unverändert, Arbeitsbaum weiterhin mit vorhandenen und neuen Änderungen.

### ABSCHLUSSBERICHT EDITOR 1

Geänderte Dateien: obige Liste. Umgesetzt: Editor-Auslieferungsgrenze und
gezielte Layoutseeds. Ausdrücklich nicht geändert: Fachrenderer, Tabellen-
Registry/Spaltenverträge, Paginierung/Druckweg, TOP-/Meetingfachlogik, Lizenzcode,
produktive Daten. Tests: obige Ergebnisse. Restpunkt: lizenzierte native
Fach-/PDF-Abnahme. Nächster sinnvoller Schritt: gültige Lizenz und vollständiger
Abnahmeablauf in separater Windows-Umgebung; kein weiterer Editorumbau.

### ARBEITSMODUS-ABSCHLUSS

Verwendeter Modus: Goal-Arbeitslauf. Unteragenten: keine.
Computer Use: nativ nicht verfügbar; keine nativen Klicks/Eingaben ausgeführt.
Automatisierter installierter Ablauf: Verknüpfung starten, Core-Projekt/
Firmendaten/Logo/Ablage speichern, beenden/neu starten, Daten und verbotene
Editor-/Modulzugänge prüfen; native Diktatprogramme separat ausführen.
Erfüllte Kriterien: lokales x64-Setup, Paket-/Daten-/Lizenzgrenzen, Layoutseeds,
installierter Start/Corepersistenz, native Laufzeittranskription, Prozessabschluss.
Nicht erfüllte Kriterien: separater Windows-Benutzer/VM und lizenzierte native
Besprechungs-/PDF-/Mail-/Mikrofon-/Projekttransfer-Bedienung.
Reparatur/Wiederholung: zwei alte Editorrouterseiten zusätzlich gesperrt,
Migrationsguard angepasst, Installer neu gebaut; Testumgebung/Readiness korrigiert,
installierte Prüfungen erfolgreich wiederholt. Kein Baselinefehler maskiert.
