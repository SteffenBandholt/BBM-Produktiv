# BBM Rechnung RE-S1.1 – Stammdaten und Leistungskatalog

Stand: 13.09.2026

## Bedienkorrektur im bestehenden PR #348

Die im ersten RE-S1.1-Stand neu eingebaute zweite Kundenpflege wurde wieder aus
den Rechnungsstammdaten entfernt. Kunden werden weiterhin ausschließlich in der
vorhandenen gemeinsamen Firmen-/Kundenverwaltung angelegt und bearbeitet. Die
Kundenauswahl im Rechnungsentwurf bleibt erhalten und verwendet unverändert
`rechnung:listCustomers` sowie die gemeinsame typisierte Firmenidentität.

Die Rechnungsstammdaten enthalten damit nur noch Rechnungstellerprofil und
Leistungskatalog. Der Stammdatenbereich erhält eine an den vorhandenen
`rechnung-live-content` gebundene Höhe. Sein vorhandenes `overflow: auto` besitzt
dadurch bei begrenzter Fensterhöhe einen realen Scrollbereich; der Katalog und
beide Speichern-Schaltflächen sind erreichbar. Die fünf entfallenen Editorziele
sind `rechnung.masterData.customers`, `.select`, `.select.label`, `.create` und
`.edit`. Es wurden keine neuen Editorziele angelegt. Der aktuelle
`rechnung.screen`-Vertrag und das Target-Manifest umfassen 146 Ziele.

## Gezielte Korrekturrunde PR #348

Die Prüfung der tatsächlichen Settingsquelle ergab, dass es keinen zentralen
persistierten MwSt.-Setting-Key gibt. Die vorhandene zentrale Rechnungsfachvorgabe
ist `DEFAULT_VAT_RATE_PERCENT` in `src/shared/rechnung/rechnungPositions.mjs`:
19 Prozent als Standard, während die zentrale Validierung ganzzahlige Sätze von
0 bis 100 zulässt. Es wurde deshalb keine zweite Einstellung erfunden.

Kataloganlage und -änderung beziehen die Vorgabe nun über diese zentrale Regel.
Die Katalogtabelle erlaubt gültige Sätze von 0 bis 100 statt ausschließlich 19.
Eine gezielte additive Kompatibilitätsmigration baut nur die frühere feste
CHECK-Constraint um und kopiert alle vorhandenen Katalogzeilen unverändert.
Rechnungsbelege werden dabei nicht gelesen oder geschrieben.

Der zentrale ESM-Vertrag für die Mehrwertsteuer wird im Main-Prozess über seinen
relativen Modulpfad geladen. Damit bleibt `DEFAULT_VAT_RATE_PERCENT` die einzige
fachliche Quelle; es entsteht weder ein neuer Setting-Key noch ein zweiter
Steuersatzwähler.

## Umfang

RE-S1.1 macht zwei vorhandene beziehungsweise ergänzte Stammdatenbereiche im
Rechnungsmodul bedienbar:

- Das eigenständige `InvoiceIssuerProfile` besitzt einen rechnungsspezifischen
  Service-, IPC-, Preload- und UI-Zugang. Das allgemeine Benutzerprofil bleibt
  getrennt und wird im Rechnungsscreen nicht mehr als Live-Anzeigequelle benutzt.
- `invoice_service_catalog` speichert Kurztext, Langtext, Einheit, Netto-
  Einzelpreis in Cent und die beim Speichern gültige zentrale Rechnungsfachvorgabe.
  Der Standard beträgt 19 Prozent; die Anzeige ist in RE-S1.1 nicht frei editierbar.

Die Katalogeinträge sind eigenständige Stammdaten. RE-S1.1 übernimmt sie nicht in
Rechnungsentwürfe und verändert keine Rechnungsposition. Bestehende Beleg- und
Parteiensnapshots bleiben unverändert.

Rechnungskunden bleiben globale Firmen mit der vorhandenen Verwendung
`invoice_customer`. Ihre Pflege liegt außerhalb dieser Stammdatenansicht in der
gemeinsamen Firmen-/Kundenverwaltung; die Auswahl im Rechnungsentwurf bleibt Teil
von `rechnung.screen`.

## Persistenzvertrag

Die Rechnungsfachmigration legt `invoice_service_catalog` ausschließlich additiv
in der gemeinsamen BBM-SQLite-Datei an. Stabile UUIDs unterscheiden Leistungen;
Änderungen aktualisieren denselben Datensatz. Es gibt keine Löschoperation in
diesem Paket. Das Rechnungstellerprofil verwendet weiter die vorhandene ID
`default` und das vorhandene partielle Upsert, sodass nicht angebotene Werte wie
`logoPath` erhalten bleiben.

## UI-/Editorvertrag

Die neue Stammdatenansicht ist Teil von `rechnung.screen`. Bereiche, Gruppen,
Felder, Labels und sichtbare Buttons sind explizit im Komponentenvertrag
registriert. Buttonausführung, Fachdatenänderung, Anlage und Speichern bleiben als
Editoroperationen gesperrt. Die Katalogauswahl in den Stammdaten und die
Kundenauswahl im Rechnungsentwurf sind Bedienlisten, keine Inhaltstabellen und
keine Ziele des Tabellenlayout-Editors. Die vollständige Entwurfsentscheidung
wurde vor der Umsetzung im Arbeitslauf ausgegeben.

## Prüfung und offene Umgebungsgrenzen

- Der gezielte RE-S1.1-Persistenztest öffnet eine dateibasierte SQLite-Datenbank
  neu, prüft das bearbeitete Profil und drei unverwechselbare Katalog-IDs und
  vergleicht einen bestehenden Rechnungsdatensatz vollständig vor/nach der
  Stammdatenarbeit.
- Die vorhandenen zentralen Kundentests prüfen zwei globale Kunden, kombinierte
  Verwendungen, Auswahl sowie eingefrorene Kundensnapshots. Der gezielte
  Screen-/Vertragstest sichert zusätzlich den erhaltenen Entwurfs-Picker und das
  Fehlen der zweiten Stammdaten-Kundenpflege.
- Der aktuelle Komponenten-Mount bindet alle 146 Rechnungselemente vollständig;
  Manifestzahl, Scope-Fingerprint und Registry-Fingerprint wurden aus dem realen
  Vertrag berechnet und mit dem vorhandenen UI-Editor-Kit geprüft.
- Ein automatisierter Lauf im echten isolierten Windows-/Electron-Prozess bei
  `1155 x 575` Pixeln hat 491 Pixel gebundene Höhe, 829 Pixel Inhalt und 338 Pixel
  nutzbaren Scrollweg gemessen. Der Katalog-Speicherknopf lag nach Mausradscrollen
  vollständig innerhalb des Bereichs. Kundenpflegeziele und die Texte
  `Kunde anlegen`/`Kunde bearbeiten` fehlten; der Entwurfs-Kundenpicker war da.
  Der Rechnungsteller-Speicherklick schrieb in die isolierte SQLite-Datei und der
  Wert war nach Schließen/Öffnen der Ansicht erhalten.
- Der Katalog-Speicherklick konnte im ersten Electron-Lauf vor der Reparatur nicht
  persistieren. Nach der einen Reparaturrunde waren Service-/DB-Neustarttests grün;
  ein isolierter echter Electron-Main-Prozess lud die zentrale Vorgabe danach
  erfolgreich als `{ "vatRatePercent": 19 }`;
  der zweite Electron-Lauf blieb jedoch bereits in der vorhandenen allgemeinen
  Startnavigation an einer ausstehenden IPC-Antwort stehen. Eine vollständige
  sichtbare Nachprüfung des Katalog-Speicherns wird deshalb nicht behauptet.
- Native Computer-Use-Steuerung war trotz drei Initialisierungsversuchen nicht
  verfügbar (`Computer Use native pipe is unavailable`). Die beschriebene
  Bedienprüfung lief automatisiert über das echte Electron-Chromium-DOM/CDP, nicht
  als manuelle Computer-Use-Abnahme.
- Der breite Rechnungs-Testblock bleibt an dokumentierten Bestandsfehlern rot,
  darunter alte 87-/131-Zielzahlen, frühere Editor-Funktionen und PDF-Hashes. Diese
  paketfremden Rotstände wurden auftragsgemäß nicht repariert.

RE-S1.2, PDF/ZUGFeRD, Buchung, Nummernkreise, Aufträge und Nachträge sind nicht
begonnen.
