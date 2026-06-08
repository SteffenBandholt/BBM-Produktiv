# Schriftgrößen für TOPs

Diese Übersicht fasst die aktuell im Code gesetzten Schriftgrößen für TopsScreen/UI, Editbox und PDF zusammen. Die Werte sind die in den Stylesheets deklarierten `font-size`-Angaben.

## TopsScreen UI

| Element | Selector / Variable | Schriftgröße |
|---|---|---:|
| Basis Kurztext | `--bbm-top-short-font-size` | `10pt` |
| Basis Langtext | `--bbm-top-long-font-size` | `9.5pt` |
| Header Zeile 1 | `.bbm-tops-header-line1` | `9pt` |
| Header Zeile 2 | `.bbm-tops-header-line2` | `8.5pt` |
| Header Zeile 3 | `.bbm-tops-header-line3` | `7.5pt` |
| Header Meta-Legende | `.bbm-tops-header-meta-legend` | `7pt` |
| Header Buttons | `.bbm-tops-btn` | `7.5pt` |
| Workbench Titel links | `.bbm-tops-workbench-left-title` | `9pt` |
| TOP-Liste Kurztext / Titel | `.bbm-tops-list-row-title` | `8.5pt` |
| TOP-Liste Langtext / Preview | `.bbm-tops-list-row-preview` | `9.5pt` |
| TOP-Liste Nummer | `.bbm-tops-list-row-number` | `8.5pt` |
| TOP-Liste Datum | `.bbm-tops-list-row-number-date` | `6.5pt` |
| TOP-Liste Meta | `.bbm-tops-list-row-meta` | `8pt` |
| Collapse-Button in Liste | `.bbm-tops-list-row-collapse-toggle` | `8pt` |
| Editbox Label | `.bbm-tops-workbench-editbox .editbox-label` | `8.5pt` |
| Editbox Kurztext-Eingabe | `.bbm-tops-workbench-editbox .editbox-input` | `10pt` |
| Editbox Langtext-Textarea | `.bbm-tops-workbench-editbox .editbox-textarea` | `9.5pt` |
| Editbox Zähler | `.bbm-tops-workbench-editbox .editbox-counter` | `8pt` |
| Editbox Flags | `.bbm-tops-workbench-editbox .editbox-flag` | `8pt` |
| Meta-Flags | `.bbm-tops-meta-flags .editbox-flag` | `7.7pt` |
| Status-/Fälligkeits-Label | `.bbm-tops-meta-due-with-ampel .status-ampel-label` | `7.6pt` |
| Status-/Fälligkeits-Wert | `.bbm-tops-meta-due-with-ampel .status-ampel-value` | `8pt` |
| Meta-Eingaben | `.bbm-tops-meta-panel :is(.bbm-tops-input, .status-ampel-select, .status-ampel-date, .responsible-field-select)` | `8pt` |
| Verantwortlich-Label | `.bbm-tops-meta-responsible-cell .responsible-field-label` | `8pt` |
| Meta-Status-Label | `.bbm-tops-meta-status-cell .status-ampel-label` | `7.6pt` |

## Editbox im Detail

| Element | Selector / Variable | Schriftgröße |
|---|---|---:|
| Kurztext-Feld | `.bbm-tops-workbench-editbox .editbox-input` | `10pt` |
| Langtext-Feld | `.bbm-tops-workbench-editbox .editbox-textarea` | `9.5pt` |
| Feld-Label | `.bbm-tops-workbench-editbox .editbox-label` | `8.5pt` |
| Zeichenzähler | `.bbm-tops-workbench-editbox .editbox-counter` | `8pt` |
| ToDo / Beschluss Haken | `.bbm-tops-workbench-editbox .editbox-flag` | `8pt` |
| Diktier-Button | `.bbm-tops-dictation-icon-button` | keine eigene `font-size`, Icon-basiert |

## PDF Basis

### `src/renderer/print/print.css`

| Element | Selector / Variable | Schriftgröße |
|---|---|---:|
| Basis Dokument | `html, body` | `11pt` |
| Seitenkopf | `.pageHeader` | `10px` |
| Firmen-Gruppe | `.firmGroupRow .firmGroupCell` | `11.5pt` |
| Firmen-Adresse / Kontakt | `.firmAddr, .firmContact` | `10.2pt` |
| Firmen-Personen-Header | `.firmPeopleHead` | `9.4pt` |
| Firmen-Kontakt-Header | `.firmPeopleContactHead` | `8.7pt` |
| Firmen-Personen-Zeile | `.firmPeopleRow` | `9.8pt` |
| Firmen-Leerzustand | `.firmPeopleEmpty` | `9.8pt` |
| TOP-Metaspalte | `.topsTable .colMeta` | `9.5pt` |
| Meta-Block | `.metaHead` | `9.5pt` |
| TOP-Nummer Level 1 | `.lvl1Cell` | `12.5pt` |
| TOP-Nummer Level 2-4 | `.topNumber` | `11pt` ererbt aus `html, body` |
| Nummer / Datum-Hinweis | `.nrDate`, `.nrHint` | `7pt` |
| Kurztext | `.topsTable .shortText` | `10pt` |
| Langtext | `.topsTable .longText` | `9.5pt` |

## PDF V2

### `src/renderer/print/v2/v2.css`

| Element | Selector / Variable | Schriftgröße |
|---|---|---:|
| Spine-Hinweis | `.pdfSpineNote` | `6pt` |
| Logo-Platzhalter | `.v2LogoPlaceholder` | `8pt` |
| Projekt | `.v2Project` | `10pt` |
| Projektname | `.v2ProjectName` | `15pt` |
| Protokolltitel | `.v2ProtocolTitle` | `12pt` |
| Stand | `.v2ListStand` | `10pt` |
| Draft-Badge | `.v2DraftBadge` | `8pt` |
| Großes Draft-Badge | `.v2FullDraftBadge` | `16pt` |
| Seitenzahl / Seite | `.v2Page` | `8pt` |
| Modus | `.v2Mode` | `8pt` |
| User-Box | `.v2UserBox` | `8.5pt` |
| Mini-Protokolltitel | `.v2MiniProtocolTitle` | `10pt` |
| Mini-Draft-Hinweis | `.v2MiniDraftNotice` | `12pt` |
| Teilnehmer-Tabelle Inhalt | `.v2ParticipantsTable th, .v2ParticipantsTable td` | `9.3pt` |
| Teilnehmer-Header-Zeilen | `.v2PartMarksHead, .v2PartContactHead` | `7pt` |
| Markenzeile | `.v2PartMarkRow` | `10pt` |
| Tops-Legende | `.v2TopsLegend` | `12pt` |
| Interlude-Text | `.v2TopsInterlude` | `12pt` |
| Footer | `.v2ProtocolFooter` | `12pt` |
| Vorbemerkung Titel / Text | `.v2PreRemarksTitle, .v2PreRemarksText` | `10pt` |
| Wasserzeichen | `.v2VorabzugWatermark` | `44pt` |
| Wasserzeichen groß | `.v2DraftWatermark, .v2FinalWatermark` | `72px / 88px` |

## Quellen

- `src/renderer/modules/protokoll/styles/tops.css`
- `src/renderer/print/print.css`
- `src/renderer/print/v2/v2.css`
