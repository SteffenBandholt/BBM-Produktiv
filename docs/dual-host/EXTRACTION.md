# Initiale Extraktion gemeinsamer Projekt-/Firmen- und Entitlement-Pakete

Auftrag BBMpro-Doppelhostintegration, ADR-001/002; Basis BBM-Produktiv/main bc380fc. Primär Container 3 (gemeinsame Domänen), keine UI-/PDF-Ausgabe und keine Editoränderung. Keine Modulumgestaltung. Die historischen Architekturtexte zur Mutter-App werden durch ADR-001/002 insoweit überholt; fehlende ältere Pflichtdateien docs/ARBEITSMODUS-CODEX.md und docs/domain/TOP-REGELN.md wurden festgestellt, keine Protokoll-/Editorarbeit daraus abgeleitet.

Projekt/Firmen: createProjectFirmsService ist bytegleich in packages/project-firms-core/src/index.cjs verschoben. Der alte Importpfad delegiert dorthin. Bestehende Repositoryports und deren SQL-/Bauherr-/Transaktionsregeln bleiben bestehen. Noch keine eigenständig portable Gesamt-Projektdatenbank; deren kontrollierte Extraktion und Migration ist ein weiterer Schritt. Keine neue Datenhaltung im Core oder Fachmodul.

Entitlements: Feature-Normalisierung und requireFeature/requireValidLicense werden einmal unter packages/entitlement-core gepflegt. Das alte licenseFeatures-Modul übergibt die unveränderte Modulregistry; licenseService hält weiterhin Statuscache, Datei-/Signatur-/Geräte-/Entwicklungsprüfung und delegiert nur die Berechtigungspolitik. Keine Signierfunktion im Paket, keine permissive Ersatzprüfung. getStatus muss einen tatsächlich verifizierten Status liefern.

Neue Port-/Rechteprüfung: node packages/test-extracted-cores.cjs bestanden. Erweiterte Bestandsprüfung licenseStandardFeatures + projectFirmsActiveFlow: 26 grün / 1 rot, identisch auf unangetastetem Ausgangscommit. Alter Fall APP/PDF/MAIL/EXPORT als direkte requireFeature-Aliase ist bereits auf main rot; keine neue Aliasfreigabe eingebaut. Kein vollständiger Lizenz-/DB- oder Windows-Abnahmenachweis behauptet.

Beide Kandidaten Version 0.1.0, nicht produktiv freigegeben. Kein Merge und keine Installation/Registrierung in vorhandene Anwendungen; die zwei realen AzL-Projekte und Windows-Profile werden nicht angesprochen. Migrations-/Rollback-/Bauherr-Gesamtabnahme bleibt offen. Basispaket-/Hostintegration sind eigene Draft-PRs.
