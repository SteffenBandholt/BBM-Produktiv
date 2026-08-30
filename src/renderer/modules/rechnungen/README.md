# Rechnungen · Entwicklungsstand und UI-Vertrag

Das Modul ist ausschließlich in DEV sichtbar. Es enthält zwei klar getrennte
Stände:

- `RechnungenDesignScreen` bleibt die historische statische Designreferenz.
- `RechnungScreen` ist der echte, an den vorhandenen Rechnungs-API-Pfad
  angebundene Arbeitsscreen für Rechnungsgrunddaten und Belegkopf.

Positionen werden als Bau-LV, die vorhandene Netto-Summe und ein Zahlungstext
werden im Rechnungsblatt dargestellt. Eine PDF-Fachausgabe oder neue
Mehrwertsteuerlogik ist weiterhin nicht Teil des Screens. Der Kundenpfad
verwendet die vorhandene zentrale Kundenquelle; es entsteht keine zweite
Kundenverwaltung.

## UI-Editor-Status

Der echte `RechnungScreen` ist als Scope `rechnung.screen` mit 81 expliziten
Einzelzielen komponentennah registriert. Der Scope darf nur dann als `complete`
veröffentlicht werden, wenn Komponentenvertrag, gemountete Runtime-Refs, nativer
Typvertrag und Registry-Fingerprint gemeinsam grün sind.

Der UI-Editor darf ausschließlich Layout und Darstellung der registrierten
Elemente bearbeiten. Fachwerte und Fachaktionen bleiben gesperrt. Das gilt
insbesondere für `Freie Rechnung`, `Speichern`, `Proberechnung`,
`Rechnung buchen`, `Entwurf verwerfen`, `Schließen` und `Vorschau schließen`.

Die vollständige Entscheidung steht in
`docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md`.

Die Kundenauswahl bleibt als typisierte Referenz aus `kind`, `id`, optionalem
`projectId` und `label` im Screenzustand erhalten. Ohne Projekt werden nur globale
Kunden geladen; mit Projekt globale Kunden und lokale Kunden dieses Projekts.

Der sichtbare Rechnungsinhalt folgt einem Brief-/Rechnungskopf: Empfänger links,
vorhandene Ausstellername und -anschrift rechts sowie darunter Rechnungsdatum
und Leistungszeitraum als reine Anzeige. Logo-Einstellungen werden nicht in das Rechnungsmodul
kopiert. Der Bereich nach dem Titel enthält Leistungsbezug und den optionalen
Freitext; das bestehende Bau-LV bleibt unverändert. Netto ist der vorhandene
Positionswert. Normale Leistungspositionen speichern ihren eigenen MwSt.-Satz
(`vat_rate_percent`, Step-1-Standard 19 %); Netto, MwSt. und Brutto werden
daraus berechnet. NEP sowie Titel-, Text- und Hinweispositionen bleiben von
allen drei Summen ausgeschlossen.

Die Positions-Editbox zeigt bei Leistungspositionen den gespeicherten MwSt.-Satz
schreibgeschützt. Der einzige Preisumschalter ist die Checkbox `Brutto`: Sie
wechselt den sichtbaren Einzelpreis zwischen netto und brutto, während der
Nettowert als Berechnungsbasis erhalten bleibt. Titel, Text und Hinweis blenden
beide Preisbedienelemente aus. Nur die editierbaren Eingabefelder markieren
vorhandenen Inhalt beim Fokuswechsel. DRAFT-Proberechnungen
verwenden eine stabile, nicht-offizielle `PR-…`-Kennung aus der DRAFT-ID; die
Rechnungsnummer entsteht weiterhin ausschließlich bei der Buchung.

Kurztext und Langtext übernehmen die allgemeinen zentralen Textgrenzen aus
`tops.titleMax` und `tops.longMax` einschließlich ihrer Fallbacks 100/500.
Die Editbox zeigt die verbleibenden Zeichen kompakt am jeweiligen Feldlabel;
es gibt keine Rechnung-spezifischen Limit-Settings oder Counter-Speicherung.

Der rechte Briefkopf verwendet ausschließlich vorhandene Ausstellername und
-anschrift. Steuer-/USt-IdNr., IBAN/BIC sowie optionale Register- und
Geschäftsführerdaten werden – nur bei vorhandenen Werten und ohne Bankname – im
Fuß des Endlosblatts angezeigt. PDF und Datenpflege werden dadurch nicht verändert.

## Referenzquellen

- `../UI-Editor-kit/reference-target-app`: WPF-Referenz
  „Auftragsverwaltung“ mit ruhigen Karten, kompakten 32-px-Controls,
  statusorientierter Tabelle und klarer blau-grauer Hierarchie.
- BBM `SettingsView`: helle Karten, zurückhaltende Verläufe, feine Borders und
  kompakte Aktionsflächen.
- BBM-Popup „Projekt bearbeiten“: dichte Feldgruppen, echte Zweizeiligkeit und
  scrollbarer Dialogkörper zwischen festem Header und Footer.

## Zentraler BBM-Standard

Die freigegebenen Werte liegen zentral in
`src/renderer/ui/styles/popupFormStandard.css` und sind in
`docs/BBM_POPUP_FORMULARSTANDARD.md` verbindlich dokumentiert. Das Modul aktiviert
den opt-in-Standard über `.bbm-popup-standard`; `styles/rechnungenDesign.css`
enthält nur noch die rechnungsspezifische Anordnung und verweist für die
gemeinsamen Werte auf die zentralen `--bbm-popup-*`-Tokens.

| Token | Wert |
| --- | --- |
| Canvas / Surface / Subtle | `#f3f5f8` / `#ffffff` / `#f8fafc` |
| Text / Muted | `#172033` / `#667085` |
| Primary / Hover | `#235a9f` / `#194a86` |
| Border / Border strong | `#d7dee8` / `#c5cfdd` |
| Focus | `#2563eb` plus 3-px-Ring |
| Input- / Card- / Dialogradius | `8px` / `12px` / `14px` |
| Inputhöhe / Buttonhöhe | `32px` / `30px` |
| Label / Control / Body | `11.5px` / `13px` / `13px` |
| Feld- / Gruppenabstand | `4px` / `10px` |
| Kartenpadding | `14px` |
| Dialogpadding | `12px 16px` |
| Dialog-Header / -Footer | mindestens `54px` / `50px` |

Die Rechnungsübersicht des echten Screens ist eine Karten-/Listengruppe und
keine Inhaltstabelle. Deshalb wird sie nicht in den Tabellenlayout-Editor
aufgenommen. Die statische Designreferenz bleibt ebenfalls außerhalb der
Tabellenlayout-Registry.

## R3.1 Zahlungs-/Forderungsbasis

Gebuchte Rechnungen können über den Service-/IPC-Vertrag positive
Integer-Centzahlungen erhalten und korrigieren. Der Forderungsstatus wird aus
der bestehenden zentralen Bruttoberechnung, der Zahlungssumme und dem
Fälligkeitsdatum als `OPEN`, `PARTIALLY_PAID`, `PAID` oder `OVERDUE` abgeleitet;
der Rechnungsstatus selbst wird dabei nicht verändert. Eine umfangreiche
Zahlungs- oder Mahnungsübersicht ist nicht Bestandteil dieses Pakets.

Im ungepackten Entwicklungsmodus zeigt die Rechnungsübersicht einen kleinen,
nicht editorfähigen Reset-Bereich für den Rechnungsnummernkreis. Er löscht
ausschließlich den Sequenzstand und wird abgelehnt, sobald bereits eine
Rechnungsnummer desselben Jahres existiert. Rechnungen, Nummern und der
Unique-Index bleiben unverändert. Im gepackten Build bleibt der Bereich
verborgen und der Main-Prozess blockiert den IPC-Aufruf zusätzlich.

## R3.2 Rechnungsverwaltung

Die Übersicht ergänzt die bestehende Kartenliste um Entwurfskennung bzw.
Rechnungsnummer, Datum, Kunde, Art, Brutto, bezahlt, offen, Fälligkeit sowie
getrennte Beleg- und Zahlungsstatus. Ansichten für Alle, Entwürfe, Offen,
Teilbezahlt, Überfällig, Bezahlt und vorhandene Stornierungen filtern nur die
abgeleiteten Verwaltungsdaten.

Bei `BOOKED` können vorhandene R3.1-Zahlungen direkt in der Übersicht erfasst
und korrigiert werden. Die UI nimmt Eurobeträge entgegen und übergibt weiterhin
ausschließlich Integer-Centbeträge. `DRAFT` bleibt im vorhandenen Editor
bearbeitbar; `BOOKED` und `CANCELLED` bleiben inhaltlich schreibgeschützt. Es
wurden weder Zahlungstabelle noch Statusspalte, PDF-Funktion oder
Stornorechnungsworkflow ergänzt. Filter- und Zahlungsaktionen sind keine
UI-Editor-Ziele; der bestehende Vertrag umfasst weiterhin exakt 81 Referenzen.
