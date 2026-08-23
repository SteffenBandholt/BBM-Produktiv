# Rechnung 2.0 – Bestandsprüfung M0 bis M3

Stand: 23.08.2026
Geprüfter Entwicklungsstand: Branch `rechnung-entwicklung`
Vergleichsbranch für zentrale Firmen-/Kundenarchitektur: `firmen-kunden-neu`

## Zweck

Diese Prüfung ordnet den tatsächlich vorhandenen Stand von `rechnung-entwicklung` gegen die verbindlichen Ziele von Rechnung 2.0 ein. Sie ist keine neue Fachspezifikation und verändert keine bestehenden Entscheidungen.

Statuswerte:
- GRÜN = im Kern vorhanden
- GELB = teilweise vorhanden / Integration oder Abschluss fehlt
- ROT = für den geforderten Stand noch nicht vorhanden

## Gesamtbild

`rechnung-entwicklung` ist deutlich weiter als ein UI-Dummy. Vorhanden sind bereits persistente Rechnungsentwürfe, Rechnungspositionen, automatische Speicherung, Buchung, atomare Rechnungsnummernvergabe, Kunden- und Aussteller-Snapshots, NEP-/Positionslogik, Rechnungsübersicht, registrierte Rechnungserstellung und eine eigene Modul-/Lizenz-ID.

Die wesentlichen offenen Blöcke vor einem produktiven Step-1-Abschluss sind:
1. Integration der neuen zentralen Firmen-/Kundenrollen aus `firmen-kunden-neu`.
2. Feste Rechnungs-PDF-Erzeugung und zentrale PDF-Dateiablage auf Basis PDF V2.
3. Storno/Gutschrift als echter Fachablauf; der Status `CANCELLED` allein reicht nicht.
4. Vollständige Produkt-/Lizenzdefinition für einen Auslieferungsfall „BBM nur mit Rechnung“.
5. ZUGFeRD-fähige strukturierte Ausgabe-/Exportgrenze; noch kein XML-Export erforderlich, aber die Rechnung muss dafür vollständig strukturiert und aus der finalen Rechnung ableitbar sein.

---

# M0 – Plan- und Bestandsbasis

## Status: GELB

### GRÜN – vorhanden
- Rechnung ist ein eigenes Modul `rechnung`.
- Rechnung besitzt einen echten produktionsnahen `RechnungScreen` und einen separaten historischen Design-Dummy.
- UI-Editor-Vertrag für den echten Rechnungsscreen ist vorhanden.
- SQLite-basierte lokale Datenhaltung ist vorhanden.
- IPC-/Service-/Repository-Schichten für Rechnung sind vorhanden.
- PDF-V2-Grundlagen sind im Gesamtprojekt vorhanden.
- Modul-/Lizenzarchitektur kennt `rechnung` als eigenständige Modul-ID.

### GELB – noch zu konsolidieren
- Der Branch `rechnung-entwicklung` und `firmen-kunden-neu` sind deutlich divergiert. Die neue verbindliche Firmen-/Kundenarchitektur liegt nicht vollständig in `rechnung-entwicklung`.
- Mehrere ältere Rechnungs-Entwurfsdokumente enthalten historische Zwischenstände. Der aktuelle Codevertrag und die neueren Inventardokumente müssen als Ist-Referenz gelten.
- Der verbindliche Rechnung-2.0-Entwicklungsplan liegt aktuell auf `firmen-kunden-neu`; er muss beim späteren Integrationsschritt auf den führenden Rechnungsentwicklungsstand übernommen bzw. konfliktfrei zusammengeführt werden.

### M0-Abschlussbedingung
M0 kann abgeschlossen werden, sobald der gemeinsame Integrationsstand für `rechnung-entwicklung` + zentrale Firmenrollen festgelegt ist und die verbindlichen Rechnungsdokumente auf diesem führenden Branch vorhanden sind.

---

# M1 – Gemeinsame PDF-V2-Grundlage

## Status: GELB

### GRÜN – vorhanden
- Globale PDF-V2-Strukturen, Satzvertrag, Header-/Footer-/Layoutgrundlagen und PDF-Editor-Basis existieren bereits im BBM-Projekt.
- Die Weiterentwicklung auf `firmen-kunden-neu` enthält zusätzliche deklarative PDF-Adapter-/Dokumenttyp-Strukturen, die für Rechnung relevant sein können und vor einer Rechnungssonderlösung geprüft werden müssen.

### ROT/GELB – für Rechnung noch offen
- Kein eigener produktiver Rechnung-PDF-Dokumenttyp ist im geprüften Rechnungsbranch als fertiger Rechnungs-PDF-Renderer erkennbar.
- Keine feste PDF-Erzeugung beim Finalisieren/Buchen der Rechnung.
- Keine verbindliche Rechnungs-PDF-Dateireferenz am Rechnungsdatensatz.
- Keine zentrale unveränderliche Dateiablage für die finale Rechnung.

### M1-Kernaussage
PDF V2 muss nicht neu erfunden werden. Der nächste PDF-Schritt besteht darin, Rechnung als eigenen Dokumenttyp sauber auf die vorhandene/weiterentwickelte PDF-V2-Basis aufzusetzen.

---

# M2 – Kaufmännisches Dokumentmodell und zentrale Ablage

## Status: GELB bis weitgehend GRÜN für Rechnung, aber noch kein vollständiges gemeinsames Dokumentmodell

### GRÜN – Rechnung bereits vorhanden
- Persistente Tabelle `invoices`.
- Statuswerte `DRAFT`, `BOOKED`, `CANCELLED` sind im Schema vorbereitet.
- `source_type` und `document_type` sind strukturiert vorhanden.
- Projekt- und Auftragsreferenzfelder sind vorbereitet.
- Leistungszeitraum ist strukturiert vorhanden.
- Rechnungspositionen werden als unabhängiger Rechnungsstand gespeichert.
- Kunden-Snapshot und Aussteller-Snapshot werden beim Buchen erzeugt.
- Gebuchte Rechnungen können über den normalen Update-/Delete-Draft-Pfad nicht geändert oder gelöscht werden.
- Rechnungsnummer wird atomar und eindeutig über eine Sequenz vergeben.
- Legacy-Migrationen und Indizes sind vorhanden.

### GELB – Architektur noch nicht auf Zielstand
- Das aktuelle Modell ist weiterhin rechnungsspezifisch (`invoices`) und noch nicht die geplante gemeinsame kaufmännische Dokumentbasis für Angebot/Auftrag/Rechnung.
- PDF-Dateireferenz/Dateiversion/Checksumme fehlen im Rechnungsmodell.
- Ein zentrales kaufmännisches Dateimodell fehlt.
- Die Kundenreferenz verwendet noch `global_firm` / `project_firm` und damit nicht den inzwischen festgelegten zentralen Firmenrollen-Ansatz.

### Bewertung
Für Step 1 ist die vorhandene Rechnungsdatenbasis wertvoll und darf nicht verworfen werden. Eine spätere Verallgemeinerung für Angebot/Auftrag muss migrationsfähig auf dieser Struktur aufbauen, nicht sie blind ersetzen.

---

# M3 – Produktive Rechnung 2.0

## Status: GELB

### GRÜN – bereits vorhanden
- Rechnungsübersicht.
- Freie Rechnung / DRAFT-Erstellung.
- DRAFT laden und bearbeiten.
- Automatische DRAFT-Speicherung.
- Freie Positionsanlage.
- Titel/Text/Hinweis/Leistungspositionen als Positionsarten.
- Kurztext/Langtext/Menge/Einheit/EP.
- Netto-/Brutto-Eingabemodus für EP.
- MwSt.-Satz je Position vorbereitet und gespeichert.
- NEP wird als eigener Positionszustand gespeichert und von Summen ausgeschlossen.
- Positionshierarchie und Schieben für freie Entwürfe sind vorbereitet.
- Rechnungsdatum, Leistungszeitpunkt/-zeitraum, Projekt-/Leistungsbezug, Freitext.
- Rechnungsempfänger-Auswahl.
- Ausstelleranzeige aus eigenen Unternehmensdaten.
- Netto/MwSt./Brutto-Berechnung im UI.
- Proberechnung/Entwurfsvorschau.
- Buchung eines Entwurfs.
- automatische fortlaufende Rechnungsnummer bei Buchung.
- Snapshot von Kunde und Aussteller bei Buchung.
- Schutz gebuchter Rechnungen vor normaler Änderung/Löschung.
- registrierte, weitgehend fertige Rechnungserstellungs-UI.

### GELB – fachlich/technisch noch offen
- Kundenanbindung auf neue zentrale Firmenrollen umstellen.
- Finale PDF-Erzeugung und feste Speicherung beim Buchen.
- Finale Rechnung muss über gespeichertes PDF reproduzierbar/aufrufbar sein.
- Storno/Gutschrift-Fachablauf fehlt trotz vorbereitetem `CANCELLED`-Status.
- Vollständige Produktlizenzierung „BBM nur Rechnung“ fehlt.
- ZUGFeRD-Ausgabemodell/Adapter fehlt noch.
- Neu festgelegte Editbox-Ergänzungen fehlen noch:
  - Positionstyp Text ohne gedrucktes Präfix „Text“.
  - kompakte Netto/MwSt./Brutto-Anzeige in der Editbox.
  - Zielkalkulation mit Brutto-Zielpreis und proportionaler Wertgewichtung.

### Noch nicht Step-1-relevant / bewusst später
- vollständige Angebot/Auftrag-Kette
- Auftrags-LV-Sperrlogik und Nachtragspositionen
- Aufmaß / Abschlagslogik im Bauabrechnungssinn
- GAEB
- Kalkulation/Nachkalkulation jenseits der nun gewünschten Zielkalkulation

---

# Zentrale Firmen-/Kundenintegration

## Befund

`rechnung-entwicklung` verwendet noch:
- `customer_ref_kind = global_firm | project_firm`
- Rechnungskundenfilter über ältere `use_customer`-Felder bzw. FirmDirectory-Ausgabe.

`firmen-kunden-neu` führt dagegen die verbindliche zentrale Rollenstruktur ein:
- eine Firma existiert genau einmal
- Rollen/Verwendungen über `firm_usages`
- `project_participant`
- `invoice_customer`

## Konsequenz

Die Rechnung darf nicht auf der alten Doppelstruktur weiter ausgebaut werden. Vor PDF-/Finalisierungsabschluss muss die Rechnungskundenauflösung auf die zentrale Firma mit Rolle `invoice_customer` umgestellt werden.

Gebuchte Rechnungen behalten weiterhin ihren Kundensnapshot; spätere Änderungen im Firmenstamm dürfen gebuchte Rechnungen nicht verändern.

---

# Lizenz-/Produktarchitektur

## Befund

Vorhanden:
- Modul-ID `rechnung`
- Lizenz-Modul-ID `rechnung`

Noch offen:
- Produktdefinition für einen eigenständigen Auslieferungsfall wie `bbm-rechnung` bzw. gleichwertige Produktkonfiguration.
- Sicherstellen, dass für „nur Rechnung“ der notwendige BBM-Core samt Firmenstamm und eigenen Unternehmensdaten verfügbar ist, ohne Protokoll/Restarbeiten freizuschalten.

---

# Empfohlener nächster Entwicklungsblock

Der nächste Codex-Auftrag sollte NICHT PDF, Storno, ZUGFeRD, Zielkalkulation und Firmenintegration gleichzeitig implementieren.

Empfohlenes Paket:

## Integrationsblock R2-I1 – zentrale Firmen-/Kundenbasis für Rechnung

Ziel:
`rechnung-entwicklung` auf die verbindliche zentrale Firmen-/Kundenarchitektur bringen, ohne die fertige Rechnungserstellungs-UI und bestehende Rechnungslogik neu zu bauen.

Pflichtumfang:
1. Relevante Firmenrollen-Struktur aus `firmen-kunden-neu` migrationssicher integrieren.
2. Rechnungskunden ausschließlich aus zentralen Firmen mit Rolle `invoice_customer` beziehen.
3. Keine konkurrierende Rechnungskunden-Datenbank und keine neuen Duplikate.
4. Bestehende DRAFTs migrations-/kompatibilitätsfähig behandeln.
5. Gebuchte Kundensnapshots unverändert lassen.
6. Rechnungserstellungs-UI optisch nicht redesignen.
7. Bestehende UI-Editor-Registrierung erhalten.
8. Tests für Kundenliste, Auswahl, DRAFT, Buchung und Snapshot anpassen/ergänzen.
9. Keine PDF-, Storno-, ZUGFeRD- oder Zielkalkulationsimplementierung in diesem Paket.

Nach erfolgreichem Abschluss dieses Integrationsblocks folgt als nächster großer Block die Rechnung-PDF-V2-Finalisierung mit fester Dateiablage.

---

# Schlussbewertung

M0: GELB
M1: GELB
M2: GELB/weitgehend GRÜN für die bestehende Rechnung
M3: GELB, mit bereits erheblichem produktionsnahem Funktionsumfang

Der wichtigste nächste Schritt ist nicht eine neue Rechnungserstellung, sondern die kontrollierte Integration der neuen zentralen Firmen-/Kundenarchitektur in den bestehenden Rechnungsstand.
