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
- Projektverwaltung `Protokoll anlegen`.
- Firmenstamm `Neue Firma` und `Neuer Mitarbeiter`/`Mitarbeiter bearbeiten`.
- Separates produktives Editorfenster `Firma bearbeiten`.
- Projektfirmen `Aus Firmenstamm hinzufügen`, `Neue Firma`/`Firma bearbeiten`
  und `Neuer Mitarbeiter`/`Mitarbeiter bearbeiten`.
- Teilnehmerauswahl `Personalpool` und Teilnehmerverwaltung `Teilnehmer` auf der
  gemeinsamen `ParticipantsModals`-Basis.
- Projektverwaltung `Projekt Import / Export`.
- Firmen-/Personenimport auf der produktiven `FirmsView`-Basis: `Firmen importieren`,
  `Import Kontakte (CSV)`, die Detaildialoge `Firma bearbeiten` und
  `Mitarbeiter zuordnen` sowie die daraus erreichbaren Dialoge `Firma neu` und
  `Firma anlegen`. Dieselbe Basis wird aus dem Firmenstamm und aus den
  Projektfirmen verwendet; die Tabellenzeilen bleiben bewusst kompakte Listenzeilen.
- Protokoll `Text korrigieren`.
- Protokoll-Mail `Protokoll versenden` im produktiven Abschluss-Flow.
- Hilfe `Hilfe` und der daraus geöffnete Informationsdialog `Info`.
- Gemeinsame geschlossene Protokollauswahl für Ausgabe, Vorschau, Mail und Druck
  (`ClosedProtocolSelector`). Die Listenzeilen behalten ihre eigene kompakte Dichte.
- Ausgabe `Nächste Besprechung` und `ToDo-Liste drucken`
  (Verantwortlichenfilter).
- Gemeinsame PDF-Vorschau für Protokoll, gespeicherte PDF, Firmenliste, ToDo-Liste
  und TOP-Liste. Standardisiert sind nur Dialograhmen und Header/Body-Hülle; die
  eingebettete PDF-/Dokumentvorschau bleibt unverändert.

Die in dieser Welle migrierten eigenständigen Dialoge verwenden die gemeinsame
`createPopupOverlay`-Fläche. Sie beginnt unter der real gemessenen Unterkante des
globalen Mainheaders und im Protokoll unter der tiefer liegenden fachlichen
Header-Unterkante. Bei geringer Höhe bleiben Header und Footer sichtbar; der
Dialogkörper beziehungsweise die inneren Detailkarten übernehmen den Scroll.

Weiterhin produktiv aktiv, aber bewusst noch nicht umgestellt sind die übrigen
Einstellungsvarianten außerhalb der bisherigen Piloten und
`Restarbeiten._openNotesPopup()`. Ebenfalls aktiv erreichbar, aber nicht Teil dieser
Welle ist `MainHeader._openMailSendModal()` nach der geschlossenen
Protokollauswahl im E-Mail-Weg der Projekt-Quicklane.

Technisch vorhanden, derzeit aber ohne produktive Aufrufstelle sind
`DictationController._showTermCorrectionPrompt()`/`maybeOfferTermCorrection()`,
`TopsScreen._openTopRulesDialog()`,
`SettingsView._openPdfPreRemarksPopup()`,
`MainHeader._promptMeetingSelection()`,
`MainHeader._openStoredProjectPdfSelectionPopup()`. Der Wörterbuch-/Diktat-Prompt wurde
daher nicht künstlich reaktiviert oder migriert. Die Quicklane erwartet außerdem
`router.openProtocolMailModal`, für das aktuell keine produktive Implementierung
registriert ist.

Als eindeutig alte, nicht produktiv montierte Varianten bleiben `CompanyDialog`,
`EmployeeDialog` und `xEmployeeEditModal`/`FirmsPoolView` dokumentiert. Der reine
Hinweis-Stummel `PrintModal.openStoredFirmsPdfSelection()` wurde ebenfalls nicht zu
einem Dialog ausgebaut. Noch nichts davon wird gelöscht.

Die Re-Export-Datei
`src/renderer/modules/protokoll/TopsViewDialogs.js` ist keine zweite TOP-Regeln-
Variante, sondern nur der aktive Modulpfad zur bestehenden Dialogbasis. Auch
`CloseMeetingOutputFlow` und `TopsCloseFlow` enthalten keine zusätzliche Mail-UI,
sondern delegieren an die nun migrierte `MailFlow`-Variante. Die vorbereitete
Kompatibilitätsdatei `src/renderer/ui/PrintModal.js` ist nur ein Re-Export der
produktiven Ausgabe-Implementierung und keine zusätzliche Vorschauvariante.
Die bisherigen `--bbm-form-*`-Werte bleiben für diese Altbereiche als unveränderte
Fallbacks bestehen. Eine spätere Übernahme ist ein jeweils explizit freizugebender
Schritt; nach diesem Paket erfolgt keine Massenmigration.
