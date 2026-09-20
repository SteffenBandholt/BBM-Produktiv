# Protokoll Windows-Setup zur lokalen Abnahme

Auftrag vom 15.09.2026. Basis: `feature/project-meeting-series`, HEAD
`0a91ca8c10d94fa8055b7ad6f2eef9161bdd7cdc` plus der gesamte aktuelle
Arbeitsbaum einschließlich der vom Nutzer akzeptierten Kachelüberarbeitung.
Kein Commit, Merge, Push, Tag, Branchwechsel oder externe Veröffentlichung.

## Arbeitsmodus und Grenzen

Goal-Arbeitslauf ohne Unteragenten, ein Meilenstein zur Zeit. Primär Container 2:
Auslieferungsumfang im bestehenden App-/Modulrahmen. Erlaubt sind Buildskripte,
gezielte Auslieferungsgrenzen, Layout-Auslieferungsdaten, passende Prüfungen und
Dokumentation. Keine Fach-, TOP-, Datenmodell- oder PDF-Satzreparatur; keine
Versionserhöhung, neuen npm-Abhängigkeiten oder M85-Baselinereparaturen.

1. M1: Arbeitsstand, Abhängigkeiten, Layoutquellen und Datenisolierung prüfen.
2. M2: Protokollumfang, Editorgrenzen und reproduzierbare Layoutauslieferung.
3. M3: vorhandenen Electron-/NSIS-Weg für Windows x64 verwenden, Paket prüfen.
4. M4: tatsächlich installierte Ausgabe prüfen, fehlende native Nachweise nennen,
   Installations-/Abnahmeanleitung und exakte Artefaktidentität übergeben.

Nur tatsächlich ausgeführte Prüfungen gelten als Nachweis. Keine automatische
Prüfung ist menschliche Abnahme. Bei Datenrisiko, Vertragskonflikt, notwendigem
Nebenumbau oder nicht lokal behebbarer neuer Regression STOPP.

## Ausgabeentscheidung vor Umsetzung

UI und PDF: ausschließlich vorhandene abgenommene Produktstruktur ausliefern;
Entwicklungsstartwege sperren. Diese installierte Ausgabe ist nicht editorfähig.
Keine neuen Editorbereiche, Gruppen, Untergruppen, Komponenten, Tabellen,
Spalten/Metaspalten, Buttons oder Felder. Bestehende komponentennahe Verträge,
IDs, Marker und Parentstrukturen bleiben unverändert; keine neue Registrierung.
Damit gibt es in diesem Paket keine neuen Elementmetadaten zu definieren.
Erlaubte Editoroperationen in der Ausgabe: keine. Gesperrt: sämtliche UI-/PDF-
Bearbeitungsoperationen einschließlich Save/Restore/Undo/Reset durch den Nutzer.
Der interne nichtinteraktive Layout-Restore für normale Darstellung bleibt.

Fachliches Speichern/Anlegen/Löschen, Upload, Import, Export, Autosave, fachliche
IPC-/DB-Aktionen sind weiterhin keine Editorziele. Bestehende gültige Parents
werden nicht umgebaut. Fachliche Textbearbeitung (`editor:open`) ist kein
UI-Struktureditor und muss erhalten bleiben.

Prüfanker: `scripts/ui-editor-contract-check.cjs --self-test`, M80 und
Besprechungsreihen-/Komponentenverträge. Neue Paket-/Zugangsgrenzen brauchen
zusätzliche gezielte Prüfungen; vor diesem Paket existieren diese noch nicht.
Keine Satzvertragsänderung. Berührt ist die Auslieferung derselben Layoutquelle
für `PDF-V2-ARCH-003`; `PDF-V2-SATZ-*` und `PDF-V2-PROT-*` bleiben unverändert.
Protokoll-Golden-Fixtures müssen Seitenzahl und Strukturhash erhalten.

## Geplanter Buildumfang / Identität

Bestehender Build: Electron 30, electron-builder 24, NSIS Windows x64.
Quellversion bleibt 1.5.0, regulärer STABLE-/release-Kanal mit signierter Lizenz.
Separate lokale Abnahmeidentität und Datenwurzel verhindern eine Übernahme oder
Migration produktiver BBM-Daten. Diese Ausgabe ist keine Kundenfreigabe.
Die genaue Identität wird vor Build/Installation im Prüfbericht festgehalten.

Protokoll: Projektverwaltung, alle drei Reihen, Firmen/Personen/Teilnehmer/
Verteiler, TOPs/Listen/Historie, gemeinsame PDF-/Mail-/Dateidienste, ZIP-Transfer,
Settings und Diktat. Bauherr optional. Modulaktivierung bleibt Schnittmenge aus
Auslieferungsumfang und gültiger Lizenz; Auslieferung darf keine Lizenz erweitern.
Rechnung und SiGeKo sind nicht zugänglich. Kein interner DEV-Lizenzprovider in
STABLE. Keine Kunden-/Projekt-/Test-DB, Lizenz, Zugangsdaten oder persönlichen
Profil-/Diagnosearchive im Installer.

## Abhängigkeiten nach Modularisierung

- Electron/Chromium/Node liefern die Desktop-/JS-Laufzeit ohne VS Code.
- better-sqlite3 muss zur Electron-ABI passen und außerhalb ASAR ladbar sein.
- archiver/extract-zip/yauzl: Projekttransfer; pdfjs-dist: interne PDF-Vorschau.
- UI-Editor-Kit: CJS-Core, Browsermodule und PDF-/Layoutadapter bleiben zur
  normalen Darstellung erforderlich. Der lokale npm-Link muss beim Packen in
  echte Paketdateien überführt werden; kein Laufzeitlink zum Nachbarrepository.
- UI-Editor-Manager/WPF/.NET: nur Entwicklungsprogramm; Entfernung erst nach
  Nachweis, dass der normale Layout-/PDF-Pfad keinen Editorprozess startet.
- Whisper CLI/Server plus ihre DLLs, FFmpeg und ggml-small.bin: Offline-Diktat.
  Die vorhandene Qualitätswahl fällt bei fehlenden optionalen Modellen auf small
  zurück. Native C/C++-Laufzeitimporte sind vor Auslieferung zu prüfen.
- Mail verwendet den vorhandenen Windows-/Outlook-/Mailclientweg; dessen externe
  Einrichtung wird nicht durch den Installer ersetzt oder erfunden.

## Prüfumgebung / offene Nachweise

Lenovo-Hauptrechner bestätigt. Native CUA ist deaktiviert; kein node_repl/Sky-
Werkzeug, keine erreichbare WindowsSandbox.exe/VM und keine Administratorrechte.
Eine getrennte Windows-Umgebung oder ein separater Testbenutzer ist daher noch
nicht verfügbar. Sichere lokale App-/Datenisolierung ist nur ein technischer
Fallback und darf nicht als vollständiger VM-/Testbenutzernachweis gelten.
Eine signierte Testlizenz für Protokoll/Diktat wurde beim Nutzer angefragt.

Abschluss ist nur mit belegten Kriterien zulässig. Fehlende Mikrofon-/Outlook-
Bedienung, Installerbedienung oder menschliche Abnahme werden konkret ausgewiesen.
Eigene Prüfläufe und native Bibliothekssperren nach Abschluss beenden.


## Protokoll-Setup M2 – 15.09.2026

Auslieferungsgrenzen/Editorzugänge und eingefrorene Layouts umgesetzt.
Neue Tests 7/7; relevante Reihen-/PDF-/Mail-/M80-Prüfungen 62/62; Vertragscheck-Selbsttest grün.
Genau zwei Profile, vier benannte globale Tabellenlayouts und fünf Druckabstände, keine persönliche Datenübernahme.
Identität: de.bbm.baubesprechungsmanager.protokoll.abnahme, BBM Protokoll (Abnahme), Version 1.5.0, STABLE/release; Daten ausschließlich APPDATA/BBM-Protokoll-Abnahme.
Nächster Schritt M3: NSIS/Paketprüfung. Offen: gültige Lizenz, native Windows-Testumgebung/Bedienung.
Kein Commit/PR.


## Abschluss M3/M4

M3 abgeschlossen: Setup erstellt/installiert, Paket und installierter Core technisch geprüft. M4 gestoppt wegen fehlender gültiger Lizenz und nativer isolierter Windows-Bedienung. Belege, vollständige Dateiliste und Grenzen im PROTOKOLL_SETUP_PRUEFBERICHT.md; Anleitung in PROTOKOLL_SETUP_ABNAHME.md. Prüfläufe beendet, native Bibliotheken entsperrt. Kein Git-Abschluss.

## Nachtrag Installations-/Verknüpfungsabnahme – 16.09.2026

Ein-Klick-Setup startet die installierte App jetzt nach Abschluss; Desktop und
Startmenü verwenden den eindeutigen Namen `BBM-Protokoll-Abnahme`. Vorhandene
Installation wurde ohne Deinstallation aktualisiert. Installierte EXE,
Verknüpfungsstart, sichtbares BBM-1.5.0-Fenster und bytegenauer Erhalt von 54
geschützten produktiven/Abnahmedateien sind geprüft. Keine Fachänderung, kein
Commit/Push. Die lizenzierte fachliche M4-Abnahme bleibt getrennt offen.
