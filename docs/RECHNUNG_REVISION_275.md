# Rechnung – Revision #275

Stand: 2026-09-06, Paket 4c mit Korrekturpaket 4c-fix.

## Paket 4c-fix – konsistente Snapshotspalten

Ausgangsbasis: `main` / `b5b3b005aefa136c42070767e2f7482254ef2406`,
einschließlich PR #313 und #314. Die zuvor angehaltene lokale 4c-Arbeit wurde
gegen den Blockernachweis in #275 geprüft und der Fehler vor Korrektur erneut
reproduziert: `invoices_current_migration` fehlte `order_snapshot_at`.

Die Korrektur ergänzt ausschließlich die beiden bereits für 4c festgelegten
Spalten `order_snapshot_at TEXT` und `order_snapshot_json TEXT` in zwei
vorhandenen Tabellendefinitionen: reguläre Neuanlage und historischer
Kompatibilitäts-Neuaufbau. Die additive Spaltenliste enthält sie bereits.
Kopierspalten und Zielspalten sind damit konsistent. Bestehende Snapshotwerte
werden unverändert kopiert; Altbelege ohne solche Werte behalten NULL.

Gegenüber dem angehaltenen 4c-Stand sind nur diese vier Produktzeilen geändert.
Service, Repository, IPC, Preload, Screen und die neun bestehenden Snapshottests
sind per Dateihash unverändert. Weil 4c noch nicht committed/in main enthalten
war, umfasst die Integration den geprüften vorhandenen 4c-Bestand plus Fix.
Es entsteht keine zusätzliche Fachfunktion, keine neue UI und kein 4d-Scope.

### Nachweis

- Ursprünglichen Legacy-Migrationsfehler vor Korrektur reproduziert.
- Drei Fix-Prüfungen grün: ursprünglicher realer Legacy-Test; frische, additive
  und historisch neu aufgebaute DB; Erhalt bereits vorhandener Snapshotbytes.
- Wiederholte Migration bewahrt Schema und Daten; historische Beleg-/Empfänger-/
  Ausstellerwerte und fremde Bestandsspalten bleiben erhalten.
- Der bisher im Volltest verdeckte Legacy-Test läuft jetzt zusätzlich vor dem
  bekannten ui-editor-kit-Abbruch. Die ursprüngliche Suite bleibt erhalten.
- Bestehende 4c-Pakettests unverändert 9/9 grün.
- Relevante Rechnung-/Core-Regression: 92 grün, nur bekannte Screen-Erwartung
  `Rechnungspositionen` rot. Der neue Migrationsfehler ist beseitigt.
- Volltest: 455 grün / neun bekannte Einzelfehler, weiterhin 0/10 Gruppen durch
  dokumentierte Baselinefehler und fehlende ui-editor-kit-Artefakte. Fehlersignaturen
  wurden mit der main-Baseline identisch verglichen. Keine neue Regression.

### Mitgeführter 4c-Vertrag

`InvoiceService.createDraftFromOrder` liest ausschließlich über BillingOrderService
einen bestätigten Auftrag innerhalb derselben SQLite-Transaktion und legt genau
einen neuen Entwurf je Anlageaufruf an. Die Bindung erfolgt einmal pro Rechnung,
nicht als Beschränkung auf eine Rechnung je Auftrag. Der Entwurf besitzt eigene
Positions-IDs, Quell-IDs, unveränderte Vertragsnummern/Reihenfolge, Auftragskopf,
Snapshotzeitpunkt und Snapshot-JSON. Er übernimmt keine Nachträge.

Speichern, Vorschauen und Buchen prüfen den gespeicherten Snapshot und lesen die
Auftragsquelle nicht erneut. Auftragsbezogene Quellfelder und Positionen bleiben
über Service-/DB-Guards gesperrt. LEGACY_UNRESOLVED wird nicht nachträglich gebunden.
Die freie Rechnung behält ihren bisherigen Positionsnormalisierer. Der bestehende
Screen umgeht dessen Neunummerierung und Umsortierung bei gebundenen Snapshots.
Diese bereits vorhandenen 4c-Anpassungen wurden im Fixlauf nicht erweitert.

Paket 4d ist nicht begonnen. PR, finaler Main-Commit und CI-Nachweis werden nach
Integration in #275 dokumentiert; das Gesamtissue bleibt offen.

## Paket 4b – minimale Anwendungsgrenze

`BillingOrderService` ist der einzige produktive Zugang zum vorhandenen
`BillingOrderRepository`. Der Service enthält keine SQL-Anweisungen. Das
Repository erhält nur eine Transaktionshülle für atomare Prüfung und Änderung;
Schema, Migrationen und SQLite-Datei bleiben unverändert.

| Operation | Payload | Wirkung / Grenze |
| --- | --- | --- |
| `get` | `{ id }` | Bestehenden Auftrag einschließlich LV und gespeicherter Nachträge lesen; DRAFT, CONFIRMED und CANCELLED bleiben unterscheidbar. |
| `createDraft` | Auftragskopffelder | DRAFT anlegen; UUID und Status ausschließlich serverseitig. |
| `addPosition` | `{ id, position }` | Vertragsposition ausschließlich an DRAFT aufnehmen; Nummer und `sort_index` unverändert übernehmen. |
| `confirmOrder` | `{ id }` | Kopf und gesamtes LV prüfen und atomar bestätigen; anschließend nur lesbar. |

Der Minimalumfang dient der schrittweisen Erfassung einer Vertragsquelle.
Allgemeine Auftragsbearbeitung, Löschen/Stornieren und Nachtragsaktionen werden
nicht als neue Serviceoperationen angeboten. Vorhandene Nachträge sind beim
Lesen Bestandsdaten; daraus entsteht keine Freigabe zur Rechnungsübernahme.

Zulässige Kopffelder: `order_number`, `order_date`, `customer_firm_id`,
optionales `project_id`, `service_reference`. Positionsfelder entsprechen dem
4a-Bestand ohne `id`, `order_id`, Status oder Zeitstempel. UUIDs werden nicht aus
Nummern abgeleitet. Firmen-/Projektbeziehungen bleiben durch die vorhandenen
Fremdschlüssel abgesichert.

Die Grenze validiert Objekte und Feldlisten strikt: echtes Kalenderdatum,
UUID beim Zugriff, ganzzahliger nichtnegativer `sort_index`, eindeutige Nummern
und Reihenfolge, vorhandener früherer Parent desselben LV (damit keine Zyklen),
Positionstypen und nichtnegative ganzzahlige Centwerte. Mengen werden als
Dezimalstrings mit Punkt übergeben; eine UI-Lokalisierung ist nicht Teil dieses
Pakets. Nullable Preis-/Mengenfelder bleiben nullable. Bestätigung erfordert
mindestens eine Leistungsposition. Ungültiger Entwurfsbestand bleibt DRAFT;
er wird weder still normalisiert noch durch Bestätigung legitimiert.

Alle vier Operationen prüfen die aktuelle Rechnungsfreigabe über den bestehenden
Lizenzdienst, zusätzlich zum bestehenden modularen IPC-Guard. Preload stellt
`rechnungOrderGet`, `rechnungOrderCreateDraft`, `rechnungOrderAddPosition` und
`rechnungOrderConfirm` bereit. Der bestehende Rechnungsregistrar bindet die
Kanäle `rechnung:order:get`, `:createDraft`, `:addPosition`, `:confirm` ein.
IPC transportiert nur zum Service und liefert dessen Fehlercodes zurück.

LEGACY_UNRESOLVED ist weiterhin ein Rechnungszustand, kein Auftrag.
Rechnungs-/Legacy-Payloads, fremde Statusfelder und `source_order_id` werden
hier abgewiesen. Es gibt keine Suche/Zuordnung nach Auftragsnummer und keinen
Schreibzugriff auf Rechnungen. Selbst eine Legacy-Rechnung mit zufällig bereits
passender Quell-ID und Auftragsnummer bleibt ungelöst. Ein UUID-Auftragsabruf
belegt ausschließlich das Auftragsobjekt, niemals die Bindung einer Rechnung.

Nachweis: acht gezielte Service-/IPC-/Preload-/Guard-/Architekturtests,
die sechs unveränderten 4a-Tests sowie Rechnungs-/Core-Regressionen. Der Volltest
wird mit der vor Änderung aufgenommenen main-Baseline abgeglichen. Bekannte
neun Einzelfehler und fehlende ui-editor-kit-Artefakte bleiben getrennt; isoliert
besteht zusätzlich die historische Screen-Erwartung `Rechnungspositionen`.

Paket 4c kann den Service erweitern, um einen bestätigten Auftrag atomar als
Rechnungssnapshot zu übernehmen. Diese Operation, UI, Nachtragsnummernvergabe,
Abschlag/Schluss und sämtliche Ausgabeprovider sind hier nicht implementiert.

## Integrationsbasis

Paket 4b setzt auf `6bc4f6aa9157876cf6569ec71c5462dd91e2f947` auf;
Paket 4a / PR #313 ist darin enthalten.

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
