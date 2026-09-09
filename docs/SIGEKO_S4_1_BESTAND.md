# S4.1 – Wiederverwendbarer Behörden-/Notfall-/Versorgerbestand

## Startplanung vor Umsetzung

Base main `ef11803ea6104844a6733bbd75c72b2ce3382cc5` / integriertes S3 PR #330, Arbeitsbaum sauber. Ergebnisbranch `codex/sigeko-s41-authority-records`. Führend #255 mit technischen Kommentaren, #274 Abschnitt 7/S4 und #277. Goal-Arbeitslauf mit unabhängigem Scope-/Code-Review und abgegrenzten Implementierungs-/Prüfaufgaben. Computer Use für dieses reine Daten-/API-Paket nicht erforderlich; bestehende Windows-/Linux-Persistenz- und Formular-CI als Integrationsnachweis.

S4 wird strikt paketweise aufgebaut: S4.1 strukturierter wiederverwendbarer Bestand mit Anwendungsgrenze und Prüfregeln; S4.2 projektbezogene Zuordnung/Snapshots und konservativer Bestandslookup einschließlich Readiness/Projekttransfer; S4.3 Bedienoberfläche für Übernahme und Ausnahmeprüfung. Jeder Schritt separat testen, reviewen, integrieren und dokumentieren. S4.1 allein ist kein abgeschlossenes S4 und noch kein nutzbarer Behördenworkflow.

## Fachlicher Vertrag

Acht stabile Kategorien in Vorlagenreihenfolge: LABOR_AUTHORITY, HOSPITAL, ACCIDENT_DOCTOR, WATER, ELECTRICITY, GAS, EMERGENCY_112, POLICE. Notarzt 112 ist feste Systemangabe; Polizei führt zusätzlich zur festen 110 einen veränderbaren örtlichen Datensatz. Sieben Kategorien haben pflegbare Bestandsdatensätze. Keine zusätzliche Pflichtkategorie BG BAU oder Feuerwehr.

Bestand gehört fachlich SiGeKo, ist installationsweit wiederverwendbar und liegt in der bestehenden BBM-Datenbank. Keine neue allgemeine Firmenverwaltung, kein Core-Import aus SiGeKo, keine eigene DB. Die projektbezogene Zuordnung folgt separat; ein bestätigter Bestandsdatensatz bedeutet noch keine bestätigte Eignung für jedes beliebige Projekt.

Datensatz: stabile ID/Kategorie; organization, street, zip, city, phone, email, emergency_phone, source; strukturierter dokumentierter Bezugsbereich scope_street, scope_zip, scope_city, scope_district, scope_area; verification_note; verification_status unverified/confirmed/uncertain, verified_at, verification_method, uncertainty_reason, revision, created_at/updated_at. Keine manuell schreibbaren Metadaten über den allgemeinen Patch. Kategorie nach Anlage unveränderlich. Jede echte Änderung an fachlichen Werten hebt die vorherige Bestätigung auf; reine No-op-Speicherung erhält sie. Revision schützt vor Überschreiben oder Bestätigen eines inzwischen veränderten Datensatzes.

Entwurf darf unvollständig sein. Expliziter manueller Prüfabschluss verlangt Organisation, vollständige Kontaktanschrift, Quelle, dokumentierten Bezugsbereich (scope_area oder scope_zip + scope_city), fachliche Prüfnotiz und den jeweiligen Pflichtkontakt. Bei Wasser/Strom/Gas ist emergency_phone Pflicht, allgemeine Zentrale phone optional. Krankenhaus, D-Arzt und örtliche Polizei benötigen phone. Für die Arbeitsschutzbehörde genügt gemäß dem allgemeinen Kontaktbegriff in #255 phone oder email; keine zusätzliche Telefonpflicht. Prüfnotiz muss je Kategorie Zuständigkeit, Notaufnahme-/D-Arzt-Eignung beziehungsweise richtigen Betreiber und verifizierten Havariekontakt festhalten. Die konkrete projektbezogene Nähe wird erst bei der späteren Projektzuordnung beurteilt. BBM prüft in S4.1 das Vorhandensein dieser Nachweise, nicht automatisch deren inhaltliche Richtigkeit. method=manual und geprüftes Datum werden erst beim ausdrücklichen Prüfabschluss gesetzt. Eine konkrete Unsicherheit lässt sich mit Grund kennzeichnen; kein willkürlicher automatischer Verfallszeitraum.

S4.2 darf aus PLZ/Kreis/Freitext allein keine grüne Projektzuständigkeit ableiten. Eindeutig passender, bestätigter Bestand soll ohne erneute Bestätigung übernommen werden; unklare Fälle mit konkretem Grund. Historische Projektsnapshots werden nicht durch spätere Bestandsänderungen überschrieben. Automatische Web-/KI-Recherche bleibt laut #255#issuecomment-5557139024 ein späteres Paket. Der Nutzer wird durch diesen technischen Vorbau nicht zum dauerhaften manuellen Suchdienst erklärt.

## Paketgrenzen und vorhandene Quellen

Keine Produkt-UI/PDF-Änderung; Ausgabe nicht editorrelevant, keine neuen Ziele/Parents/Operationen. Daher kein UI-Vertragsumbau. Bestehende Readiness bleibt bis S4.2 ehrlich ohne erfasste Behördenzuordnung. Keine Projektarchive für installationsweiten Bestand und keine Übernahme von Seed-Daten in diesem Paket. Rechnung #275 bleibt eingefroren.

Die beiden Blankovorlagen liegen in resources/sigeko/vorlagen. Die Behörden-PDF ist im vorhandenen Upload-Verzeichnis gefunden, Stand laut Nutzer Januar 2022; keine Daten daraus übernommen, Aktualität vor späterer Übernahme prüfen. Behoerden_Lookup.yaml, EVU_Stoerfall_SH_HH_Umland.yaml und PLZ_Kreis_Zuordnung.yaml sind in den vorliegenden Arbeitsdateien nicht vorhanden. Das blockiert den schema-/datenfreien Vorbau nicht.

## Abschlusskriterien

Additive idempotente Modulmigration auf bestehender SQLite-Datei; Core-only ohne neue Fachtabelle; vorhandene Projekt-/Rollenwerte unverändert. API strikt validiert und über aktuellen Modulguard geschützt. Bestätigung, nachfolgende Änderung, konkrete Unsicherheit, parallele veraltete Eingaben, Rollback, Neustart, Modulentzug und erlaubte Kategorien mit echter DB geprüft. Volltest gegen 1668/97, alle Namen und Häufigkeiten abgrenzen. Keine neue Regression, unabhängiges Review ohne Restblocker, PR gegen main integriert und #255/#274/#277 aktualisiert. Stop nur bei konkretem ungeklärtem Fachwiderspruch, neuer Regression oder fehlendem belastbarem Nachweis.

## Umgesetzte Anwendungsgrenze

`listAuthorityRecords({category?})`, `getAuthorityRecord({id})`, `saveAuthorityRecord({id?,expectedRevision?,patch})`, `confirmAuthorityRecord({id,expectedRevision})` und `markAuthorityUncertain({id,expectedRevision,reason})`. Der gemeinsame modulbewachte IPC nutzt die gleichnamigen `sigeko:`-Kanäle; Preload jeweils mit Präfix `sigeko` und großgeschriebenem Methodennamen. Keine generischen SQL-, Datei- oder Rechercheaktionen.

Anlage ohne ID; Organisation und pflegbare Kategorie erforderlich, fehlende übrige Angaben als Entwurf zulässig. Bestehende Daten nur mit gelesener positiver Revision ändern oder bestätigen. Revision startet bei 1; erfolgreiche Änderung erhöht sie. Liste und Einzelabruf liefern die gespeicherten Werte plus rein berechnete `confirmationIssues` mit konkretem Feld und Hinweis. Unbekannte Eingabefelder, direkte Status-/Zeitstempel-/Revisionspatches und feste Notrufkategorie werden abgewiesen. Kategorie einer bestehenden ID bleibt unverändert; eine andere Kategorie erfordert eine neue Anlage.

Bestätigung setzt serverseitig Datum und Methode, nicht rückdatierbare Werte aus dem Renderer. Konkrete Unsicherheit hält den früheren Prüfzeitpunkt als Information fest, trägt aber den eindeutigen Status uncertain und den Grund. Nach tatsächlicher Datenkorrektur steht der Datensatz wieder auf unverified. Es gibt keine automatische Löschung oder automatische Wiederbestätigung. Ein unverändert bestätigter Datensatz wird durch bloßes Wiederholen nicht künstlich neu datiert.

Speicheroperationen sind transaktional; das Repository aktualisiert zusätzlich nur bei passender gespeicherter Revision. Die Modulmigration erzeugt eine leere dritte SiGeKo-Tabelle und lässt die bestehende Projekt-/Profilstruktur unberührt. Kein Projekt-Export des installationsweiten Bestands, keine Verknüpfung mit konkreten Projekten in diesem Paket.
