# BBM Rechnung RE-S1.1 – Stammdaten und Leistungskatalog

Stand: 13.09.2026

## Umfang

RE-S1.1 macht drei vorhandene beziehungsweise ergänzte Stammdatenbereiche im
Rechnungsmodul bedienbar:

- Das eigenständige `InvoiceIssuerProfile` besitzt einen rechnungsspezifischen
  Service-, IPC-, Preload- und UI-Zugang. Das allgemeine Benutzerprofil bleibt
  getrennt und wird im Rechnungsscreen nicht mehr als Live-Anzeigequelle benutzt.
- Rechnungskunden bleiben globale Firmen mit der vorhandenen Verwendung
  `invoice_customer`. Anlage und Änderung verwenden unverändert den gemeinsamen
  Firmeneditor; es gibt keine zweite Kundenidentität.
- `invoice_service_catalog` speichert Kurztext, Langtext, Einheit, Netto-
  Einzelpreis in Cent und den vorhandenen Standardsatz von 19 Prozent. Der Satz
  ist in RE-S1.1 nicht frei editierbar.

Die Katalogeinträge sind eigenständige Stammdaten. RE-S1.1 übernimmt sie nicht in
Rechnungsentwürfe und verändert keine Rechnungsposition. Bestehende Beleg- und
Parteiensnapshots bleiben unverändert.

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
Editoroperationen gesperrt. Kunden- und Katalogauswahl sind Bedienlisten, keine
Inhaltstabellen und keine Ziele des Tabellenlayout-Editors. Die vollständige
Entwurfsentscheidung wurde vor der Umsetzung im Arbeitslauf ausgegeben.

## Prüfung und offene Umgebungsgrenzen

- Der gezielte RE-S1.1-Persistenztest öffnet eine dateibasierte SQLite-Datenbank
  neu, prüft das bearbeitete Profil und drei unverwechselbare Katalog-IDs und
  vergleicht einen bestehenden Rechnungsdatensatz vollständig vor/nach der
  Stammdatenarbeit.
- Die vorhandenen zentralen Kundentests prüfen zwei globale Kunden, kombinierte
  Verwendungen, Auswahl sowie eingefrorene Kundensnapshots.
- Der native Electron-/UI-Editor-Lauf ist in der bereitgestellten Linux-Umgebung
  nicht ausführbar: Electron fehlt `libatk-1.0.so.0`, und der verlinkte lokale
  `UI-Editor-kit`-Quellpfad ist nicht vorhanden. Deshalb wird keine tatsächliche
  Windows- oder sichtbare UI-Abnahme behauptet.
- Der Komponenten-/Manifesttest kann aus demselben fehlenden Kit-Artefakt nicht
  ausgeführt werden. Der produktive Vertrag wurde deklarativ ergänzt; die
  technische Kit-Prüfung und eine Manifest-Fingerprint-Aktualisierung bleiben bis
  zu einem Lauf mit dem vertrauenswürdigen Kit offen.

RE-S1.2, PDF/ZUGFeRD, Buchung, Nummernkreise, Aufträge und Nachträge sind nicht
begonnen.
