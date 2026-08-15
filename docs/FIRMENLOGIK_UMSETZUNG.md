# Firmenlogik – technische Umsetzung

Stand: 2026-08-15

## Regelgrenze

`src/main/domain/firms/FirmDirectoryService.js` ist die modulneutrale Regelgrenze. Sie kennt genau `global_firm` und `project_firm`, aber kein Rechnungs-, Protokoll- oder Restarbeitenmodul. `project_global_firms` bleibt eine Zuordnung.

Kanonische Identität ist `(kind, id)`; `projectId` begrenzt lokale Referenzen. Sichtbare Labels sind Anzeige- und Snapshotwerte, keine Identität.

Die Intents sind:

- Verwaltung: `get`, `listAll`, `create`, `update`
- fachliche Listen: `listProjectParticipants`, `listCustomers`, `listPersons`
- Nutzungspflege: `checkUseChange`, `setUses`
- Erweiterungsgrenze: `prepareLocalToGlobal`

Die vorhandenen Endpunkte bleiben bestehen. Firmen- und Projektfirmen-CRUD sowie Kandidatenlisten delegieren auf die gemeinsame Schicht; neue Verbraucher verwenden `firmDirectory:*`.

## Daten und Migration

Beide Firmentabellen besitzen `use_project_participant` und `use_customer` mit neutralem Default `0` und SQLite-CHECK. Bei einer vorhandenen Tabelle wird die fehlende Teilnehmer-Spalte innerhalb einer Transaktion ergänzt und für sämtliche vorhandenen Zeilen auf `1` gesetzt; Kunde bleibt `0`. Soft-Delete-/Trash-Zustände, IDs und Referenzen werden nicht verändert. Nach der Änderung werden Wertebereich und Zeilenzahlen geprüft. Wiederholtes Ausführen ist ohne Änderung möglich.

Restarbeiten behalten `responsible_project_firm_id` und erhalten additiv `responsible_global_firm_id`. Neue Writes validieren genau eine typisierte, aktive Projektteilnehmerreferenz. Alte lokale Zeilen werden beim Lesen als `project_firm` projiziert; `responsible_label` bleibt Snapshot.

## Verwendungsänderung

`setUses` arbeitet transaktional und unterstützt `expectedUpdatedAt`. Vor dem Abschalten der Teilnehmernutzung werden aktive globale Projektzuordnungen, aktive Personen/Kandidaten, offene TOP-Verantwortlichkeiten und offene Restarbeiten geprüft. Ein Blocker liefert `FIRM_USE_BLOCKED` samt strukturierten Impacts; es wird keine Referenz gelöscht.

Für eine spätere lokale-zu-globale Übernahme liefert `prepareLocalToGlobal` einen nicht mutierenden Plan mit möglichen Namenskonflikten und den noch erforderlichen Entscheidungen. Ein Scope-Wechsel per Flag ist ausgeschlossen. Der produktive Migrationsdialog ist nicht Bestandteil dieser Umsetzung.

## Modulvarianten

- Nur Rechnung: globale Kunden können ohne `projectId` gelistet und über Ursprung `invoice` angelegt werden.
- Ohne Rechnung: Firmen, Projektfirmen, Teilnehmer, TOP, Restarbeiten und Druck importieren kein Rechnungsmodul.
- Kombiniert: dieselbe Firma kann beide Flags tragen; beide Fachlisten liefern dieselbe typisierte Identität.

Lizenzkunden bleiben technisch und fachlich getrennt.

## Projekttransfer

Neue Archive tragen `formatVersion: 3` und `firmLogicSchemaVersion: 1`, lokale Nutzungsflags, Restarbeiten sowie Snapshots globaler Abhängigkeiten. Alte lokale Firmenzeilen ohne Flags erhalten beim Import deterministisch Teilnehmer `1`, Kunde `0`. Globale IDs müssen vor Beginn der Importtransaktion vorhanden und bei neuen Archiven namenskompatibel sein. Fehlende oder kollidierende Abhängigkeiten brechen vor jedem Write ab. Zukünftige unbekannte Archiv-/Firmenlogikversionen werden abgewiesen.
