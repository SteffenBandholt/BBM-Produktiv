# Protokoll TOP-Liste Layoutdefinition

Status: Pilotlayout, intern

## Basis

- `tableKey`: `protokoll_tops`
- `moduleId`: `protokoll`
- `variant`: `portrait`

## Quellen des aktuellen Bestands

- UI: `src/renderer/modules/protokoll/TopsList.js`
- UI CSS: `src/renderer/modules/protokoll/styles/tops.css`
- PDF: `src/renderer/print/printApp.js`
- PDF Shell: `src/renderer/print/layout/PrintShell.js`
- PDF CSS: `src/renderer/print/print.css`
- V2 header/config: `src/renderer/print/v2/v2.css`, `src/renderer/print/v2/v2LayoutConfig.js`

## Aktuelle Werte

- UI Spalten: `64px` | `1fr` | `minmax(50px, 74px)`
- PDF Spalten: `23mm` | `auto` | `15ch`
- Spaltennamen: `TOP` | `Gegenstand` | `Status / Fertig bis / verantw`

## Logische Felder

- TOP-Nummer
- Gegenstand / Kurztext
- Langtext, falls sichtbar
- Status
- Fertig bis
- Verantwortlich
- Ampel / Symbol

## Hinweise

- Langtext bleibt im Textbereich und ist keine eigene Spalte.
- Die echte Protokoll-TOP-Liste kann gespeicherte UI-Layoutwerte fuer `protokoll_tops` verwenden; ohne gespeichertes Layout bleibt die Standarddarstellung erhalten.
- Die echte Protokoll-TOP-Liste verwendet nur die UI-Werte; die PDF-Werte wirken ausschliesslich im echten PDF-Druckpfad.
- UI- und PDF-Werte bleiben getrennt, der Fallback geht immer auf das Standardlayout der konkreten Tabelle.
- Keine Editor-UI, keine Datenbank, keine Header/Footer-Aenderung.
- Die Layoutwerte sind bewusst auf den heutigen Stand abgebildet.
