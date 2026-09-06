# Rechnung – Revision #275

Stand: 2026-09-06, Paket 4a / R4 Auftrags-LV-Persistenz.

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

## Paket 2 / R3 – InvoiceIssuerProfile

Das Rechnungsmodul besitzt ein eigenständiges `InvoiceIssuerProfile`. Die
additive Fachmigration legt das Profil in derselben BBM-SQLite-Datei an und
initialisiert es genau einmal aus dem bestehenden `user_profile`-Stand der
`OwnOrganization`. Danach sind beide Identitäten unabhängig änderbar. Eine
Lizenzidentität wird weder gelesen noch als Rechnungsteller interpretiert.

Die Buchung verwendet bis zum getrennten Snapshot-Paket weiterhin den
bestehenden Pfad. Damit werden Einführung der Identität und Umstellung der
rechtlich wirksamen Buchung nicht in einem unprüfbaren Mischpaket verbunden.

## Paket 3 / R3 – Snapshots und Buchungsimmutabilität

Vorschau und Buchung bilden den Aussteller ausschließlich aus dem
`InvoiceIssuerProfile`; `user_profile`, `OwnOrganization` und Lizenzdaten sind
keine Live-Quelle des Rechnungsbelegs mehr. Der Snapshot enthält die
rechtlich relevanten Adress-, Steuer-, Bank-, Register- und Kontaktdaten sowie
die Profil-ID. Der Empfänger wird weiterhin aus der zentralen Firmenbasis
gesnapshottet. Nach der Buchung verändern weder Firmenstamm, Betreiberprofil
noch Rechnungstellerprofil den gespeicherten Beleg.

## Paket 4a / R4 – Auftrags-LV-Persistenz und Bestandsmigration

Die in #275 festgelegte minimale Auftrags-LV-Basis wird ausschließlich als
Rechnungsfachpersistenz vorbereitet:

- `billing_orders` besitzt stabile UUIDs, gemeinsamen Firmen-/optionalen
  Projektbezug und einen bestätigbaren Auftragskopf.
- `billing_order_positions` bewahrt sichtbare Vertragsnummern und einen
  expliziten `sort_index`; die freie Rechnungsnummerierung wird nicht verwendet.
- `billing_order_amendments` ist mit stabiler Ursprungsreferenz sowie Feldern,
  Format- und Eindeutigkeitsregeln für `N 01`, `N 02` usw. vorbereitet. Die
  operative Nummernvergabe bleibt Paket 4d.
- Datenbanktrigger schützen IDs sowie bestätigte Auftrags-, LV- und
  Nachtragsdaten auch unterhalb eines späteren Service-/IPC-Pfads.
- Die additive Rechnungsfachmigration ordnet freien Bestand als
  `NOT_APPLICABLE`, alte gebuchte Auftragsbelege als `LEGACY_SNAPSHOT` und alte
  bzw. noch nicht gebundene Auftragsentwürfe als `LEGACY_UNRESOLVED` ein.
- Es wird kein Auftrag aus Auftragsnummer, Positionstext, Positionsnummer oder
  Listenreihenfolge rekonstruiert. Historisches `positions_json` bleibt
  byte-inhaltlich unverändert.

Neue `LEGACY_UNRESOLVED`-Entwürfe können vor Paket 4c nicht gebucht werden.
Vorhandene gebuchte Auftragsbelege bleiben als historische Snapshots lesbar.

Nicht enthalten sind die 4b-Anwendungs-/IPC-Grenze, eine UI, die Erzeugung
eines Rechnungsentwurfs aus Auftrag, Nachtragsbedienung, PDF oder andere
Provider. Der Core enthält weiterhin keine Auftrags-/LV-/Nachtragsfachlogik.
