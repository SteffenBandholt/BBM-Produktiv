# Rechnung 2.0 – R2-I2 PDF-Bestandsinventar

Stand: 23.08.2026
Branch: `rechnung-entwicklung`

## Zweck

Dieses Inventar hält den für R2-I2 relevanten PDF-Bestand fest. Es verändert keine Produktlogik.

## 1. Bestehende produktive PDF-Basis

BBM besitzt bereits eine zentrale produktive PDF-Kette mit genau einem technischen PDF-Erzeugungsweg:

- `src/main/ipc/printIpc.js`
- `src/main/print/printData.js`
- `src/main/print/printWindow.js`
- `src/renderer/print/printApp.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/pdfEditorLayout.js`
- `src/renderer/print/v2/**`
- `src/main/ui-editor/bbmPdfAdapter.cjs`

Die PDF-Datei wird zentral im Main-Prozess erzeugt und über `webContents.printToPDF` geschrieben. Der vorhandene Pfad kann kontrollierte Ausgabeverzeichnisse anlegen und erzeugte PDFs intern wieder öffnen.

## 2. Rechnung ist noch kein produktiver PDF-Dokumenttyp

`src/shared/print/printModes.mjs` kennt aktuell unter anderem:

- `protocol`
- `preview`
- `vorabzug`
- `firms`
- `todo`
- `restarbeiten`
- `topsAll`
- `headerTest`

Ein Rechnung-Druckmodus bzw. eigener Rechnung-PDF-Dokumenttyp ist auf `rechnung-entwicklung` noch nicht vorhanden.

Die vorhandene `RechnungScreen`-Proberechnung ist eine UI-Vorschau und ausdrücklich keine PDF-Ausgabe.

## 3. Bestehender PDF-V2-Satzvertrag

`docs/PDF_SATZVERTRAG_V2.md` beschreibt die produktive V2-Basis. Verbindliche Grundprinzipien für Rechnung sind insbesondere:

- A4 über dieselbe Chromium-PDF-Engine
- gemeinsame globale Seiten-, Kopf-, Fuß- und Paginierungsinfrastruktur
- keine zweite PDF-Engine
- Layoutwerte nur über registrierte PDF-Editor-Ziele
- Fachinhalt und Paginierung bleiben vom Editor getrennt
- Protokoll und Restarbeiten dürfen durch Rechnung nicht funktional oder visuell verändert werden

Rechnung darf eine eigene Bau-LV-Darstellung erhalten; gemeinsame Satzregeln bleiben zentral.

## 4. Neuere PDF-Dokumenttyp-Architektur auf `firmen-kunden-neu`

Der Vergleichsbranch enthält eine weiterentwickelte generische Architektur für mehrere PDF-Dokumenttypen:

- `src/main/ui-editor/pdfDocumentTypeRegistry.cjs`
- `src/main/ui-editor/pdfAdapterRegistry.cjs`
- `src/main/ui-editor/declarativePdfAdapter.cjs`
- ergänzte PDF-Session-/IPC-Anbindung

Diese Struktur trennt:

- Dokumenttyp-ID
- Modul-ID
- PDF-Scope
- Layoutprofil
- Descriptor/Registry
- Druckmodi
- Adapter/Regeneration

Sie ist vor einer Rechnungssonderlösung zu verwenden bzw. gezielt kompatibel zu integrieren. Es darf kein paralleler rechnungsspezifischer PDF-Editorweg entstehen.

## 5. Rechnungsdatenbasis für finales PDF

R2-I1 hat die Rechnungsbasis bereits so weit stabilisiert, dass gebuchte Rechnungen enthalten:

- offizielle Rechnungsnummer
- Rechnungsdatum
- Leistungszeitraum
- Projekt-/Leistungsbezug
- Einleitungstext
- unabhängige Positionsdaten
- Kundensnapshot
- Ausstellersnapshot
- Zahlungsziel/Fälligkeit
- Status `BOOKED`

Das finale PDF einer gebuchten Rechnung muss ausschließlich aus diesem finalen Rechnungsstand und seinen Snapshots ableitbar sein. Spätere Änderungen an Firmenstamm, Projekt oder sonstigen Stammdaten dürfen das gespeicherte finale PDF nicht verändern.

## 6. Positionsdarstellung im Rechnung-PDF

Verbindliche fachliche Vorgaben:

- Bau-LV-Optik, keine klassische Warenwirtschaftstabelle
- Positionsnummer + Kurztext/Gegenstand
- Langtext
- Menge + Einheit sowie EP und GP
- EP und GP rechts ausgerichtet
- NEP zeigt statt GP `NEP` und fließt nicht in Summen ein
- Titel/Text/Hinweis sind nicht preiswirksam
- Positionstyp `Text`: das Wort `Text` wird im PDF nicht vorangestellt
- Positionstyp `Hinweis`: Kennzeichnung `Hinweis` bleibt sichtbar
- mehrseitiger Umbruch und Folgeseitenkopf müssen über die bestehende V2-Paginierungsfamilie erfolgen

## 7. Fehlende feste Dateiablage

Im Rechnungsmodell existiert aktuell noch keine verbindliche persistente PDF-Dateireferenz mit Dateimetadaten.

Für R2-I2 gilt der bereits vereinbarte Architekturgrundsatz einer zentralen Dateireferenz. Die Einführung soll generisch genug sein, dass Angebot und Auftrag später dieselbe Struktur nutzen können.

Mindestens zu speichern:

- stabile Datei-ID
- Dokument-/Rechnungsbezug
- Dokumenttyp
- Dateityp `PDF`
- Dateiname
- lokaler Speicherpfad
- Version
- Dateigröße
- SHA-256-Checksumme
- Erzeugungszeitpunkt

Die Datei selbst liegt lokal im Dateisystem; strukturierte Referenz und Metadaten liegen in SQLite.

## 8. Finalisierungsgrenze

Die Rechnungsnummer wird beim Buchen vergeben. Das feste finale PDF gehört fachlich zu diesem Finalisierungsvorgang.

R2-I2 muss sicherstellen:

1. Ein DRAFT erhält keine finale PDF-Datei.
2. Bei erfolgreicher Buchung wird aus dem finalen Snapshotstand genau das feste Rechnungs-PDF erzeugt.
3. Die Dateireferenz wird eindeutig mit der gebuchten Rechnung verbunden.
4. Eine gebuchte Rechnung kann ihr gespeichertes PDF später erneut öffnen.
5. Das Öffnen erzeugt die Rechnung nicht stillschweigend neu.
6. Ein Fehler bei der finalen PDF-Erzeugung darf nicht zu einem scheinbar vollständig finalisierten Zustand ohne nachweisbare finale Datei führen.

Die konkrete Transaktions-/Fehlerstrategie ist in der Implementierung so zu wählen, dass Datenbankstatus und Dateizustand konsistent bleiben.

## 9. Projektlose Rechnungen

Eine freie Rechnung kann einen optionalen Projektbezug haben. Die PDF-Ablage darf deshalb keinen Projektbezug zwingend voraussetzen.

Der vorhandene zentrale Ausgabepfad kann wiederverwendet/erweitert werden, muss für Rechnung aber sowohl projektbezogene als auch projektlose Rechnungen eindeutig und kollisionsfrei speichern.

## 10. Nicht Teil von R2-I2

- ZUGFeRD-XML / PDF-A3-Einbettung
- Storno/Gutschrift
- Zielkalkulation
- Leistungskatalog
- Angebot/Auftrag
- auftragsgebundene Rechnungen/Nachträge
- UI-Redesign
- Änderung der bestehenden Rechnungserstellungs-UI außer minimal erforderlicher Aktion zum Öffnen des finalen PDFs

## 11. Schlussfolgerung

R2-I2 ist kein Neubau einer PDF-Engine. Der Auftrag ist:

1. die neuere generische PDF-Dokumenttyp-Architektur kontrolliert in den führenden Rechnungsbranch zu integrieren, soweit für die saubere Mehrdokumentfähigkeit erforderlich;
2. `Rechnung` als eigenen PDF-V2-Dokumenttyp anzuschließen;
3. aus gebuchten Rechnungs-Snapshots ein Bau-LV-PDF zu rendern;
4. dieses PDF fest lokal zu speichern und über eine persistente zentrale Dateireferenz wieder auffindbar zu machen;
5. bestehende Protokoll-/Restarbeiten-PDFs unverändert zu lassen.
