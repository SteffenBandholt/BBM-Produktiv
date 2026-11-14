# M01-B – ProjectFirms-Core v2: fachliche Quellverantwortung

**14.11.2026 – isolierter DEV-Plan; keine Änderung an produktiven Anwendungen oder Datenbanken.**

## Ausgangspunkt und Provenienz

Der bestehende `@bbm/project-firms-core@0.1.0` stammt laut `BBMpro-Basis/release/artifacts/bbm-project-firms-core-0.1.0.tgz.provenance.json` aus **`SteffenBandholt/BBM-Produktiv`**, Quellcommit `a0922f64d1b11b184fd83adeabfc92b887f150cc`. Die Kapsel ist aktuell ausdrücklich `initial-extraction-not-approved`. Die Originalquellen sind `src/main/core/projectFirmsCore.js`, `src/main/domain/ProjectFirmsService` und die bestehenden Firmen-/Projekt-/Kontakt-Repositories.

Im separaten `BBMpro:dev/bbmprodev-isolation-m01` existiert ein **synthetischer, getesteter Kandidat** für:
- `global_firm` / `project_firm` mit stabilen Original-IDs und Projektgrenze;
- neue unabhängige `private_person`-Stammdaten, ohne künstliche Firmen;
- eine eindeutige Beteiligungsrelation je Projekt/Person/Firma, N:M-Rollen und zentralen erweiterbaren Rollenkatalog;
- mehrere Bauherren je Projekt, maximal einen führenden Auftraggeber;
- revisionsgesicherte, atomare Führungswechsel, Historie und dauerhafte Request-ID-Idempotenz;
- additive, idempotente Übernahme alter `projects.bauherr_firm_kind/bauherr_firm_id`-Referenzen ohne Überschreiben der Altspalten.

**Dieser Kandidat ist noch keine freigegebene Source-of-Truth-Implementierung.** Kein Paket `0.2.0` darf aus der Testschicht stillschweigend als approved deklariert werden.

## Verbindliche Vorgabe für die spätere Core-Übernahme

1. Fachliche Regeln werden in **einen** ProjectFirms-Core und die kanonischen Bestands-Repositories integriert, nicht in jedes Fachmodul kopiert. Ein Entwurf darf im DEV-Branch `src/main/core` vorbereitet, aber erst nach Freigabe in extrahierte Pakete übernommen werden.
2. Projektnummern, Firmen-IDs, Personen-IDs, Kontaktbezüge, historische Bauherrfelder und alte Status-/Soft-Delete-Daten bleiben unverändert nachlesbar.
3. Das neue Schema ist ausschließlich **additiv und versioniert**; vorhandene Referenzen bleiben gültig. Eine echte Migration ist zuerst nur auf anonymisierten/isolierten Kopien der historischen DBs durchzuführen.
4. Firmenarten, Firmenkategorien, Firmenverwendungen, Projektrollen und personenbezogene Kontakte bleiben getrennte Domänen.
5. Der neue CoreHost aus `BBMproDEV` ist die **einzige** schreibende Autorität; Launcher/AzL/Protokoll/Restarbeiten erhalten nur versionierte Ports. BBMi bleibt vollständig getrennt.
6. Zugriff auf globale Firmen über ein Projekt erfordert eine aktive Projektzuordnung. Eine projektfremde lokale Firma oder private Person darf nicht ausgelesen werden.
7. Änderungsrechte, Entitlement, Modulidentität, Benutzer-/Projektgrenze und sichere Windows-Pipe-Verbindung sind unabhängig von der Datenmodellprüfung nachzuweisen.
8. Release-Kandidat mit kanonischem `BBM-Core-Versions.json`-Pin, Prüfwert/Provenienz, Windows-Tests, Backup/Restore und expliziter Benutzerfreigabe. Kein freier Merge nach `main`, keine automatische Produktivmigration.

## Technische Nachweise

- [M01-B Architekturentscheidung und CoreHost-Arbeiten](https://github.com/SteffenBandholt/BBMpro-Basis/issues/7)
- [BBMproDEV – isolierter Mehr-Bauherren-/Rollen-Kandidat](https://github.com/SteffenBandholt/BBMpro/blob/dev/bbmprodev-isolation-m01/platform/bbmpro/core-service/builder-v2-candidate.cjs)
- [GitHub CI – gepinnte kanonische Projekt-/Firmen-Repositories](https://github.com/SteffenBandholt/BBMpro/actions/runs/43565369289)
- [ProjectFirms-Core v0.1.0 und ursprüngliche Extraktionsarbeit](https://github.com/SteffenBandholt/BBM-Produktiv/issues/385)

## Noch offen

- Abgleich der neuen Katalog-/Bauherren-Felder mit den vorhandenen tatsächlichen `ProjectFirmsService`-Methoden und Bestands-Repositories;
- Schema-/Migrationstestmatrix auf abgesicherten Altbestandskopien mit Referenzschutz;
- source-level Implementierung und veröffentlichbarer Quellpaketbuilder mit neuem Versionslock;
- Windows-11-Abnahme und gezielte Merge-Freigabe.

**Dieses Dokument führt keine Code- oder Datenbankmigration aus und ändert nicht den bestehenden ProjectFirms-Core 0.1.0.**
