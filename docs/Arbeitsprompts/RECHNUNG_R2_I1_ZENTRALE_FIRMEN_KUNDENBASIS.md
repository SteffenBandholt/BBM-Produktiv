# Codex-Auftrag – Rechnung R2-I1: Zentrale Firmen-/Kundenbasis

Stand: 23.08.2026
Zielbranch: `rechnung-entwicklung`
Quell-/Referenzbranch für die neue Firmenarchitektur: `firmen-kunden-neu`

## Ziel

Den bestehenden Rechnung-Entwicklungsstand auf die verbindliche zentrale BBM-Firmenarchitektur umstellen, ohne die vorhandene Rechnungserstellung neu zu bauen oder optisch zu verändern.

Verbindliche Fachentscheidung:
`docs/RECHNUNG_2_0_FIRMEN_KUNDEN_ENTSCHEIDUNG.md`

Eine Firma existiert zentral genau einmal. Projektbezogene Firmenverwendungen bleiben erhalten. Rechnungskunden sind zentrale Firmen mit der Rolle/Verwendung `invoice_customer`. Eine Firma kann zugleich Projektteilnehmer und Rechnungskunde sein. Firmen können auch ausschließlich Rechnungskunden sein.

## Bestehende Strukturen zuerst prüfen und wiederverwenden

Auf `firmen-kunden-neu` insbesondere prüfen und gezielt übernehmen bzw. in `rechnung-entwicklung` integrieren:

- `src/main/db/firmUsagesRepo.js`
- zentrale Firmenstruktur in `src/main/db/firmsRepo.js`
- `src/main/domain/FirmService.js`
- projektbezogene Firmenzuordnung / `projectFirmsRepo.js`
- zugehörige IPC-/Preload-Wege
- relevante Firmen-/Verwendungsansichten nur soweit für die Rechnungskundenrolle technisch erforderlich

Auf `rechnung-entwicklung` insbesondere erhalten und anpassen:

- `src/main/db/invoiceMigrations.js`
- `src/main/db/invoiceRepository.js`
- `src/main/domain/rechnung/InvoiceService.js`
- `src/main/ipc/rechnungIpc.js`
- `src/renderer/modules/rechnungen/screens/RechnungScreen.js`
- bestehende Rechnung-Tests
- bestehender UI-Editor-Vertrag und alle registrierten Rechnungselemente

## Sollmodell

1. Zentrale Firmen-ID ist die fachliche Identität des Rechnungskunden.
2. `invoice_customer` ist eine Rolle/Verwendung der zentralen Firma.
3. Projektzuordnung bleibt separat und optional.
4. Protokoll und Restarbeiten behalten ihre projektbezogene Firmenlogik.
5. Keine neue Kundentabelle und keine zweite konkurrierende Firmenidentität anlegen.
6. Eine Firma darf Rechnungskunde sein, auch wenn sie keinem Projekt zugeordnet ist.
7. Eine in einem Projekt verwendete Firma darf zugleich Rechnungskunde sein.

## Rechnungskundenauswahl

Die Rechnungskundenliste muss alle aktiven zentralen Firmen mit der Rolle `invoice_customer` liefern.

Nicht zulässig ist als Zielmodell eine Filterung, die Rechnungskunden nur deshalb ausschließt oder dupliziert, weil sie zusätzlich in einem Projekt verwendet werden.

Ein optionaler Projektbezug der Rechnung bleibt erhalten, darf aber die zentrale Firmenidentität des Kunden nicht ersetzen.

## Bestehende Entwürfe / Migration

Die bisherige Rechnung verwendet Referenzarten wie `global_firm` und `project_firm`.

Diese Altstruktur darf nicht ungeprüft entfernt werden.

Codex muss:

- vorhandene Datenwege und mögliche Bestandsdaten analysieren,
- eine sichere Migrations-/Kompatibilitätsstrategie implementieren,
- vorhandene DRAFTs soweit eindeutig möglich auf die zentrale Firmen-ID überführen,
- bei nicht eindeutig auflösbaren Altdaten keine stille falsche Zuordnung vornehmen,
- gebuchte Kundensnapshots unverändert lassen.

Die alte Referenzart darf nur als Kompatibilitätsinformation bestehen bleiben, wenn sie zur sicheren Bestandsübernahme benötigt wird. Neue Rechnungsentwürfe müssen dem zentralen Zielmodell folgen.

## Snapshot-Regel

Beim Buchen muss weiterhin ein vollständiger Kundensnapshot erzeugt werden.

Gebuchte Rechnungen müssen unveränderlich gegenüber späteren Änderungen an:

- zentralem Firmenstamm,
- Rollen/Verwendungen,
- Projektzuordnungen

bleiben.

## UI

Die vorhandene führende Rechnung-UI `RechnungScreen -> _sheetEditor()` bleibt erhalten.

Keine optische Neugestaltung.

Die bestehende Rechnungskundenauswahl wird lediglich an das neue Datenmodell angeschlossen.

Alle vorhandenen UI-Editor-Registrierungen, IDs, Parents und Layoutoperationen bleiben erhalten. Neue sichtbare UI-Elemente sind nur zulässig, wenn sie für eine sichere Migration zwingend erforderlich sind; andernfalls keine UI-Erweiterung.

## Tests / Abnahme

Mindestens automatisiert absichern:

1. Firma nur mit `invoice_customer` erscheint als Rechnungskunde.
2. Firma mit `invoice_customer` + `project_participant` erscheint genau einmal als Rechnungskunde.
3. Projektzuordnung derselben Firma erzeugt keinen zweiten Kundendatensatz.
4. Firma ohne `invoice_customer` erscheint nicht als Rechnungskunde.
5. Rechnung kann mit einem Kunden ohne Projektzuordnung als DRAFT angelegt und gespeichert werden.
6. Rechnung kann mit einer zugleich projektbezogen verwendeten Firma als Kunde angelegt werden.
7. Optionaler Projektbezug der Rechnung bleibt funktionsfähig.
8. Buchung erzeugt Kundensnapshot aus der zentralen Firma.
9. Nachträgliche Firmenänderung verändert eine gebuchte Rechnung nicht.
10. Nachträgliche Änderung/Entfernung der Rolle `invoice_customer` verändert eine gebuchte Rechnung nicht.
11. Bestehende eindeutig migrierbare DRAFTs bleiben verwendbar.
12. Nicht eindeutig migrierbare Altverweise werden nicht still falsch zugeordnet.
13. Bestehende Rechnungstests bleiben grün bzw. werden fachlich korrekt angepasst.
14. UI-Editor-Vertrags-/Registry-Tests der Rechnung bleiben grün.
15. Protokoll- und Restarbeiten-Firmenlogik darf durch diesen Auftrag nicht regressieren.

## Ausdrücklich nicht Teil dieses Auftrags

- PDF-Erzeugung oder PDF V2
- ZUGFeRD
- Storno/Gutschrift
- Zielkalkulation
- neue Summenanzeige
- Leistungskatalog
- Angebot/Auftrag
- neues Rechnungs-UI-Design
- generelle Neuorganisation von Protokoll oder Restarbeiten
- allgemeine Bereinigung aller Legacy-Firmencodes außerhalb des für Rechnung notwendigen Integrationswegs

## Arbeitsweise

- Bestehende Architektur zuerst vollständig analysieren.
- Keine Parallelarchitektur aufbauen.
- Änderungen als ein zusammenhängendes Paket umsetzen.
- Scope nicht erweitern.
- Tests ausführen und Ergebnis mit geänderten Dateien, Migration und bekannten Restrisiken zusammenfassen.

## Abnahmeziel

R2-I1 ist abgeschlossen, wenn neue Rechnungen ausschließlich über die zentrale Firmenidentität mit `invoice_customer` arbeiten, Projektfirmen in Protokoll/Restarbeiten weiterhin funktionieren, Bestandsentwürfe sicher behandelt werden und gebuchte Snapshots unverändert bleiben.
