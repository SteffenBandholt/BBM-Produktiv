# BBM-ProjectFirms-Core

**Eigenständiger gemeinsamer Core für BBMpro. Entwicklungsstand – keine Freigabe.**

## Architektur

Die Quellbasis für die zentrale BBMpro-Projekt-, Firmen-, Personen- und Beteiligtenverwaltung liegt in diesem eigenen Repository. Nur der automatische, separat gestartete **BBMpro-CoreHost** darf diese gemeinsamen Stammdaten schreibend öffnen. Launcher und Fachmodule (AzL, Protokoll, Restarbeiten) verwenden ausschließlich versionierte, berechtigungsgeprüfte Core-Ports.

**BBMi ist ausgeschlossen.** Keine eigene Datenbank je Fachmodul. Print-/Dokumentausgaben über PrintCore/Storage-Core.

## Herkunft

Der ursprünglich extrahierte `@bbm/project-firms-core@0.1.0` entstammt `SteffenBandholt/BBM-Produktiv`, Quellcommit `a0922f64d1b11b184fd83adeabfc92b887f150cc` (siehe BBMpro-Basis Artefaktprovenienz). Das bestehende Paket ist **nicht freigegeben**. Bestehende Export- und Importpfade sind vor einer Übernahme zu inventarisieren. Keine Quellmigration durch Kopieren dieses Dokuments.

Eine fachlich getestete, aber noch nicht als echter Core veröffentlichte V2-Kandidatur liegt in `SteffenBandholt/BBMpro`, Branch `dev/bbmprodev-isolation-m01`, unter `platform/bbmpro/core-service/builder-v2-candidate.cjs`. Sie ist ausschließlich mit synthetischen Testdaten verwendet worden.

## Soll-Fachmodell

- Ein Projekt mit unveränderlicher ID, optionaler Projektnummer, Anschrift und Metadaten.
- Bestehende `global_firm` und `project_firm` behalten IDs, Typen, Referenzen und projektspezifischen Scope.
- `private_person` ist eigenständiger Personenstamm ohne künstliche Firma.
- Ein Beteiligter pro eindeutiger Projekt-Partei-Zuordnung, mehrere frei erweiterbare Projektrollen, gesonderte Firmenkategorien/-verwendungen.
- Mehrere Bauherren, maximal ein führender Auftraggeber je Projekt.
- Optimistische Versionierung, atomarer Wechsel des führenden Auftraggebers, Historie, wiederholbare Anfrage mit Request-ID.
- Nur additive, versionierte und separat ausdrücklich ausgelöste Migration bisheriger `bauherr_firm_kind/id`-Bezüge; Originalfelder und IDs nicht löschen oder umdeuten.

## Entwicklung / Schutz

- `main` ausschließlich freigegebene, kompatible Quellen; Änderungen zunächst auf DEV-Branch.
- Auf Windows eigenständiger Geschwisterordner `C:\01_Projekte\BBM-ProjectFirms-Core`; kein Repository unter `BBMproDEV`.
- `C:\01_Projekte\BBMproDEV` nur für DEV-Laufzeit, Profile, Testdaten, Builds und Logs.
- Kein Zugriff auf `C:\Program Files\BBM`, produktive AppData-/OneDrive-Projekte, Registrierungen, Datenbanken, WAL-Dateien, Lizenzen oder Benutzerprofile.
- Kein Installer, keine Freigabe und kein Merge, bevor die komplette CI-/Windows-11-/Migrations-/Backup-/Rechteabnahme erfolgreich ist.

## Aktueller Status

Die Repository-Startstruktur ist vorbereitet, aber die tatsächliche eigenständige Quellübernahme/Versionierung und die Windows-IPC-/CoreHost-Integration sind noch **offen**.
