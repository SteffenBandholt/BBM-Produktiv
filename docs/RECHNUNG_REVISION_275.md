# Rechnung – Revision #275

Stand: 2026-09-06, Paket 1 / R2 Bestandsbergung.

## Integrationsbasis

`main` bleibt die einzige Integrationsbasis. Der Rechnungsbestand wird nicht neu
aufgebaut und kein historischer Branch wird pauschal gemergt.

Geprüfte Stände:

| Stand | Ergebnis |
| --- | --- |
| `rechnung-integration` | vollständig Vorfahr von `main` |
| `rechnung-r2-i1-integration` | vollständig Vorfahr von `main` |
| `rechnung-r2-i2-integration` | vollständig Vorfahr von `main` |
| `backup/rechnung-entwicklung-vor-bereinigung-2026-08-16` | historische Quelle; der relevante Fachbestand ist auf `main` in neuerer Form vorhanden |
| `rechnung-entwicklung` | abgezweigter Plan-/Entwicklungsstand; produktive Fachänderungen sind auf `main` weitergeführt, gemeinsame Altinfrastruktur wird nicht übernommen |

## Auf `main` geborgener Zielbestand

- Fachmodul und UI unter `src/renderer/modules/rechnungen/`
- kanonischer hybrider Moduldeskriptor `rechnung`
- modulare IPC- und Migrationsregistrare
- `InvoiceService`, `InvoiceRepository` und Rechnungsfachmigration
- gemeinsame Firmenbasis mit fachlicher Verwendung `invoice_customer`
- freie und projektbezogene Rechnung
- Rechnungsarten, Leistungszeitraum, Zahlungsziel und Fälligkeit
- Entwurf, Vorschau, Buchung und Nummernkreis
- Positionshierarchie, EP/GP sowie Netto/MwSt./Brutto
- Rechnungs-PDF-V2 über die bestehende gemeinsame Printpipeline
- rechnungseigene Shared-Regeln und UI-Editor-Registrierung
- bestehende Rechnungsregressionen in der Testgruppe `rechnungen-design`

## Nicht übernehmen

- alte Core-, Router-, Lizenz- oder Navigationsteile
- alte direkte IPC-/Migrationsverdrahtungen außerhalb der Modulregistrare
- zweite Firmen-, Projekt- oder SQLite-Struktur
- zweite PDF-, Mail-, Export- oder Speicherengine
- ältere UI-/Editorstände, welche den aktuellen `main`-Stand zurücksetzen würden
- historische Arbeitsaufträge als neue technische Wahrheit

## Offene Reihenfolge ab Paket 2

1. Eigenständiges `InvoiceIssuerProfile` auf Basis, aber nicht als Teil, von
   `OwnOrganization` einführen und auf Bestands-DB migrieren.
2. Empfänger- und Aussteller-Snapshots sowie Buchungsimmutabilität vollständig
   gegen Stammdatenänderungen sichern; Nummernkreis und rechtlich relevante
   Belegdaten prüfen.
3. Freie Rechnung und Auftrags-LV einschließlich Nachträgen stabilisieren.
4. Abschlag, Schluss, Stundenlohn sowie Steuer-/Zahlungslogik stabilisieren.
5. PDF, Mail und Export an die gemeinsamen Providerverträge anschließen.
6. Erst nach stabilem Fachkern E-Rechnung/ZUGFeRD und danach GAEB bearbeiten.
7. Abschließende Modul-, Bestands-DB- und Mehrmodulregression durchführen.

## Aktuell belegte R3-Lücke

Der bestehende Aussteller-Snapshot wird noch direkt aus `user_profile`
gebildet. Damit fehlt das in #275 geforderte eigenständige
`InvoiceIssuerProfile`. Diese Lücke wird nicht in Paket 1 verdeckt oder durch
eine Branchübernahme umgangen, sondern ist Gegenstand des nächsten Pakets.

## Paket-1-Scope

Paket 1 verändert keinen Produktcode, keine UI und keine PDF-Ausgabe. Es hält
den geborgenen Bestand, ausgeschlossene Altinfrastruktur und die nächste
fachliche Lücke reproduzierbar fest.
