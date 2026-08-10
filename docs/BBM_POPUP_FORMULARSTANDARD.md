# BBM Popup- und Formularstandard

## Status und Geltungsbereich

Dieser Standard übernimmt die visuell freigegebene Formsprache des DEV-Dummymoduls
`src/renderer/modules/rechnungen` als zentrale BBM-Referenz. Die technische Quelle ist
`src/renderer/ui/styles/popupFormStandard.css`; geladen wird sie einmal durch die
CoreShell.

Die Anwendung bleibt bewusst im Pilotbetrieb. Der Standard wird nur durch die Klasse
`bbm-popup-standard` an einem konkreten Popup- oder Modul-Root aktiviert. Ohne diese
Klasse verändern die zentralen Komponentenklassen kein bestehendes Popup. Nach dem
Pilot erfolgt keine Massenmigration; weitere Popups benötigen eine eigene visuelle
Freigabe.

## Verbindliche Tokens

| Tokenname | Wert | Zweck | Aktuelle Nutzer |
| --- | --- | --- | --- |
| `--bbm-popup-control-height` | `32px` | Einheitliche Mindesthöhe für Input, Select, Datum und Textarea | Rechnungen, Projekt bearbeiten, Settings-Piloten |
| `--bbm-popup-button-height` | `30px` | Einheitliche Mindesthöhe für Popup-Aktionen | Rechnungen, Projekt bearbeiten, Settings-Piloten |
| `--bbm-popup-control-radius` | `8px` | Radius für Controls und Buttons | Rechnungen, Projekt bearbeiten, Settings-Piloten |
| `--bbm-popup-card-radius` | `12px` | Radius für Karten und Formulargruppen | Rechnungen, Projekt bearbeiten, Settings-Piloten |
| `--bbm-popup-dialog-radius` | `14px` | Außenradius eines Dialogs | Rechnungsdialog, Projekt bearbeiten, Settings-Piloten |
| `--bbm-popup-label-font-size` | `11.5px` | Beschriftungen direkt über Feldern | alle Piloten |
| `--bbm-popup-control-font-size` | `13px` | Text in Input, Select, Datum und Textarea | alle Piloten |
| `--bbm-popup-body-font-size` | `13px` | normaler Formular- und Dialogtext | alle Piloten |
| `--bbm-popup-label-field-gap` | `4px` | Abstand zwischen Label und Control | alle Piloten |
| `--bbm-popup-group-gap` | `10px` | Abstand zwischen Feldgruppen und Karten | alle Piloten |
| `--bbm-popup-card-padding` | `14px` | Innenabstand einer Formulargruppe/Karte | alle Piloten |
| `--bbm-popup-dialog-padding-y` | `12px` | vertikaler Innenabstand im scrollbaren Dialogkörper | alle Popup-Piloten |
| `--bbm-popup-dialog-padding-x` | `16px` | horizontaler Innenabstand im scrollbaren Dialogkörper | alle Popup-Piloten |
| `--bbm-popup-footer-padding-y` | `10px` | vertikaler Innenabstand des Dialogfooters | alle Popup-Piloten |
| `--bbm-popup-footer-padding-x` | `16px` | horizontaler Innenabstand des Dialogfooters | alle Popup-Piloten |
| `--bbm-popup-footer-gap` | `8px` | Abstand zwischen Footer-Aktionen | alle Popup-Piloten |
| `--bbm-popup-textarea-height` | `68px` | kompakte, weiterhin nutzbare Mindesthöhe | Rechnungen, Projekt bearbeiten, Settings Protokoll |
| `--bbm-popup-canvas` | `#f3f5f8` | ruhiger Dialog-/Modulhintergrund | alle Piloten |
| `--bbm-popup-surface` | `#ffffff` | Controls, Karten, Header und Footer | alle Piloten |
| `--bbm-popup-surface-subtle` | `#f8fafc` | zurückhaltende Flächenabstufung | Rechnungen |
| `--bbm-popup-text` | `#172033` | primäre Textfarbe | alle Piloten |
| `--bbm-popup-muted` | `#667085` | sekundäre Texte und Hinweise | alle Piloten |
| `--bbm-popup-primary` | `#235a9f` | primäre Aktion und Akzent | alle Piloten |
| `--bbm-popup-primary-hover` | `#194a86` | Hoverzustand primärer Aktionen | alle Piloten |
| `--bbm-popup-border` | `#d7dee8` | Dialog-, Karten- und Abschnittsrahmen | alle Piloten |
| `--bbm-popup-border-strong` | `#c5cfdd` | Control-Rahmen | alle Piloten |
| `--bbm-popup-focus` | `#2563eb` | Focus-Border und Focus-Ring | alle Piloten |
| `--bbm-popup-placeholder` | `#98a2b3` | Placeholder und inaktive Aktionsbeschriftung | alle Piloten |
| `--bbm-popup-disabled-bg` | `#f1f3f6` | Hintergrund deaktivierter Controls | alle Piloten |
| `--bbm-popup-disabled-text` | `#8a94a3` | Text deaktivierter Controls | alle Piloten |

## Gemeinsame Klassen

- `bbm-popup-standard`: bewusste Aktivierung und Scope-Grenze.
- `bbm-popup-dialog`: Dialogfläche mit 14-px-Radius, Canvas und Border.
- `bbm-popup-header`, `bbm-popup-body`, `bbm-popup-footer`: gemeinsame
  Padding-, Border- und Scrollsystematik.
- `bbm-form-content`, `bbm-form-group`: 10-px-Gruppenraster.
- `bbm-form-card`: Karte mit 14-px-Padding und 12-px-Radius.
- `bbm-form-field`, `bbm-form-label`: Label-/Feld-Hierarchie mit 4-px-Gap.
- `bbm-form-button`: semantische Basis für bestehende Popup-Button-Helfer.

Inputs, Selects, Date-Felder und Textareas werden innerhalb des opt-in-Roots
gemeinsam behandelt. Checkboxen, Radio-Buttons, Datei- und Range-Controls sind
bewusst ausgeschlossen. Placeholder-, Focus- und Disabled-Zustände gehören zum
gleichen Standard.

## Pilotumfang

- DEV-Dummymodul `Rechnungen`, Übersicht und Dialog `Rechnung bearbeiten`.
- Popup `Projekt bearbeiten` mit unveränderter Zweispaltenstruktur und Fachlogik.
- Einstellungen `Profil / Adresse`.
- Einstellungen `Protokoll`.
- Einstellungen `Ausgabe & Druck`.
- Einstellungen `Drucklogos verwalten`.
- Projektverwaltung `Projekt-Einstellungen`.
- Protokoll-Ausgabe `Protokoll drucken` (nur Hauptdialog).

Bewusst noch nicht umgestellt sind die übrigen Einstellungen, `Protokoll anlegen`,
Projekt Import/Export, Firmen-, Personen- und Mitarbeiterdialoge, Teilnehmerauswahlen,
TOP-Regeln, Textkorrektur, Mail, Hilfe sowie die weiteren Druckvarianten Vorschau,
Folgetermin-Prompt und ToDo-Verantwortlichenfilter. Die bisherigen `--bbm-form-*`-Werte
bleiben für diese Altbereiche als unveränderte Fallbacks bestehen. Eine spätere
Übernahme ist ein jeweils explizit freizugebender Schritt; nach diesem Paket erfolgt
keine Massenmigration.
