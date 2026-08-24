# Rechnungsscreen – UI-/PDF-Entwurfsentscheidung

Stand: 24.08.2026
Scope: `rechnung.screen`
Komponente: `bbm.rechnung.screen`

## Invoice-PDF in der V2-Shell – 24.08.2026

### Korrekturstand Satzbild und Seitenfooter – 24.08.2026

Der bestehende PDF-Scope und der gemeinsame V2-Pfad bleiben erhalten. Der
rechte Aussteller-/Datumsblock endet am rechten Satzspiegel. Der rote
Proberechnungshinweis bleibt wegen des bestehenden Previewvertrags erhalten,
sitzt auf Seite 1 jedoch innerhalb dieses fachlichen rechten Kopfblocks und
nicht mehr als mittiger oder liniennaher FullHeader-Marker.

Das bestehende Bau-LV bleibt die bestätigte Inhaltstabelle. Seine sechs
sichtbaren Spalten lauten in echter Reihenfolge `Pos`, `Gegenstand`, `Menge`,
`Einheit`, `EP`, `GP`; die PDF-Baselines lauten 14/67/20/21/32/32 mm und
summieren sich weiterhin auf 186 mm. Menge/Einheit beginnt damit auf der
UI-Referenzachse weiter links. Leistungspositionen besitzen keine horizontalen
Zwischenlinien. GP und Summenblock enden deckungsgleich an der rechten
Satzspiegelkante.

Der bestehende Footer `pdf.bbm.invoice.footer` bleibt editorfähig nur für
`setVisibility`, ist aber nun Kind von `pdf.bbm.invoice.page-template` und hat
`pageArea: footer`. Er wird auf jeder Rechnungsseite innerhalb der vorhandenen
12-mm-Footerreserve ausgegeben. Seitenzuweisung, Wiederholung und
Footerreserve bleiben nicht editorfähig. Die technische Prüfung erfolgt über
i48/i49, `rechnungPdf.test.cjs`, `m85PdfSatzvertrag.test.cjs` und den
UI-Editor-Vertragscheck.

Art der Ausgabe: PDF. Die bestehende Rechnungs-UI wird nicht verändert. Der
V2-Satz besitzt GlobalHeader, FullHeader-/Body-/MiniHeader-Slots,
Paginierung, Satzspiegel und Fußreserve. Das Rechnungsmodul liefert nur die
fachlichen Slot-Inhalte aus `data.invoice`.

Editorfähig: ja, ausschließlich für die explizit registrierten
Invoice-PDF-Layoutziele unter `pdf.bbm.invoice`. GlobalHeader, Kopfart,
Seitenzählung, Seitenränder, Fußreserve, Paginierung und Datensatzteilung sind
keine Invoice-Editorziele.

Die sechs Attribute jedes gerenderten Ziels sind in dieser Tabelle direkt
abgebildet: `id` = `data-ui-inspector-id`, `kind` =
`data-ui-editor-kind`, `label` = `data-ui-editor-label`, `parent` =
`data-ui-editor-parent`, `editable` = `data-ui-editor-editable`, `ops` =
`data-ui-editor-ops`.

| id | kind | label | parent | editable | ops |
|---|---|---|---|---|---|
| `pdf.bbm.invoice` | `document` | Rechnung | – | `false` | – |
| `.page-template` | `page` | A4-Seite | `pdf.bbm.invoice` | `false` | – |
| `.header` | `header` | Rechnungs-FullHeader | `.page-template` | `true` | `setVisibility` |
| `.recipient` | `group` | Rechnungsempfänger | `.header` | `true` | `setVisibility` |
| `.meta` | `group` | Rechnungsdaten | `.header` | `true` | `setVisibility` |
| `.meta.label` | `label` | Rechnungsdaten-Bezeichnung | `.meta` | `false` | – |
| `.meta.value` | `value` | Rechnungsdaten-Wert | `.meta` | `false` | – |
| `.context` | `group` | Bauvorhaben / Leistungsbezug | `.header` | `true` | `setVisibility` |
| `.body` | `area` | Rechnungsinhalt | `.page-template` | `false` | – |
| `.intro` | `text` | Einleitung | `.body` | `true` | `setVisibility` |
| `.positions` | `table` | Bau-LV | `.body` | `true` | `resizeWidth,resizeColumnBoundary` |
| `.positions.rows` | `repeatingArea` | Bau-LV-Zeilen | `.positions` | `false` | – |
| `.positions.column.number` | `tableColumn` | Pos | `.positions` | `true` | `resizeWidth` |
| `.positions.column.description` | `tableColumn` | Gegenstand | `.positions` | `true` | `resizeWidth` |
| `.positions.column.quantity` | `tableColumn` | Menge | `.positions` | `true` | `resizeWidth` |
| `.positions.column.unit` | `tableColumn` | Einheit | `.positions` | `true` | `resizeWidth` |
| `.positions.column.unit-price` | `tableColumn` | EP | `.positions` | `true` | `resizeWidth` |
| `.positions.column.total-price` | `tableColumn` | GP / NEP | `.positions` | `true` | `resizeWidth` |
| `.totals` | `group` | Rechnungssummen | `.body` | `true` | `setVisibility` |
| `.payment` | `text` | Zahlungstext | `.body` | `true` | `setVisibility` |
| `.footer` | `footer` | Aussteller-Fuß | `.page-template` | `true` | `setVisibility` |
| `.mini-header` | `header` | Rechnungs-MiniHeader | `.page-template` | `true` | `setVisibility` |

Alle abgekürzten IDs beginnen mit `pdf.bbm.invoice`. Jedes Nicht-Root-Ziel hat
einen registrierten Parent. Bedingte Inhalte wie Kontext, Intro, MiniHeader und
Abschluss werden nur gerendert, wenn der jeweilige Fach-/Seitenzustand vorliegt.

Nicht editorfähig sind Speichern, Buchen, Löschen, Berechnen,
Rechnungsnummernvergabe, Previewstatus, IPC, Datenbankzugriffe, Upload, Import,
Export und Autosave. Der technische Vertragsnachweis erfolgt über
`invoicePdfAdapter.cjs`, `rechnungPdf.test.cjs`, die Invoice-Fixtures i48/i49
und `scripts/ui-editor-contract-check.cjs`.

## Rechter Rechnungskopf – feine UI-Editor-Refs 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Der sichtbare Stand und die
Geometrie bleiben unverändert. Die bisherigen groben Ziele
`rechnung.editor.issuerAddress` und `rechnung.editor.issuerMeta` werden im
aktiven Rechnungsscreen vollständig ersetzt, damit keine zwei Editor-Ziele auf
denselben DOM-Bereich zeigen.

Neue Parent-Struktur und Operationen:

- `rechnung.editor.issuerBlock` (`group`, Layoutoperationen, Parent
  `rechnung.editor.parties`)
  - `issuerName1`, `issuerName2`, `issuerStreet`, `issuerCity` (je `label`,
    Textlayout-Operationen)
- `rechnung.editor.invoiceMetaBlock` (`group`, Layoutoperationen, Parent
  `rechnung.editor.parties`)
  - `invoiceDateDisplay`, `servicePeriodDisplay` (je `label`,
    Textlayout-Operationen)

Alle acht neuen Ziele besitzen die sechs `data-ui-*`-Attribute, sind echte
gemountete DOM-Elemente und haben ausschließlich registrierte Parents.
Fachaktionen, Fachdaten, Autosave, PDF und ZUGFeRD bleiben nicht editorfähig.

## Briefkopf-Sichtprüfung und lokale Musterkunden 19.08.2026

Art der Ausgabe: ausschließlich UI. Die bestehenden Ziele
`rechnung.editor.parties`, `rechnung.editor.issuerAddress` und
`rechnung.editor.basic` bleiben unverändert die editorfähigen Layoutziele.
Bank- und Steuerangaben ergänzen nur den Text der bereits registrierten
Ausstelleranzeige; es entstehen weder neue Editor-IDs noch neue Fachaktionen.
Die Checkboxen `rechnung.editor.positionNep` und
`rechnung.editor.positionPriceGross` behalten ihre Funktion und ihre
Fachaktionssperren, erhalten aber eine kompaktere Darstellung.

Der Ausstellerblock beginnt ohne Überschrift mit höchstens zwei betonten
Namenszeilen, danach Adresse, Steuerzeile und nur IBAN/BIC. Steuer-, Bank- und
Rechnungsdaten nutzen eine feste Label-/Doppelpunkt-/Wert-Achse; der Bankname
bleibt im Profil, aber außerhalb des sichtbaren Rechnungsblocks. Die aus den
vorhandenen Registerfeldern abgeleitete Fußzeilendatenreihe wird vorbereitet,
aber nur bei tatsächlichen Werten in einem späteren UI-/PDF-Paket gerendert.

Die Ausstelleranzeige verwendet nur vorhandene Profilwerte: IBAN sowie optional
BIC und entweder USt-IdNr. oder – falls diese fehlt – Steuernummer.
Handelsregister, Registernummer und Geschäftsführung bleiben vorhandene
Profilfelder für eine spätere Fußzeile und sind in diesem UI-Paket nicht
gerendert. PDF, ZUGFeRD, Profilpflege, Autosave und Datenbanklogik bleiben
außerhalb des Pakets.

## Rechnungskopf bereinigt, Aussteller-Fußdaten 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Der sichtbare rechte Kopf zeigt
ohne Überschrift nur vorhandene Ausstellernamen, Straße sowie PLZ/Ort und mit
kleinem Abstand die reinen Anzeigezeilen `Rechnungsdatum` und
`Leistungszeitraum`. Belegart, Abschlagsnummer und alle Kopf-Controls bleiben
technisch unverändert, sind dort jedoch nicht sichtbar.

Editorfähig sind zusätzlich `rechnung.editor.issuerMeta` (Gruppe, Rolle
`content`, Parent `rechnung.editor.parties`, `componentKind: issuerMeta`) und
`rechnung.editor.issuerFooter` (Gruppe, Rolle `content`, Parent
`rechnung.editor.body`, `componentKind: issuerFooter`). Beide erlauben nur
Layout-/Sichtbarkeitsoperationen; Fachdaten, Autosave, Persistenz und die
Ausführung von Fachaktionen bleiben gesperrt. Alle Parents sind selbst
registrierte Ziele.

Im Fuß des Endlosblatts werden nur vorhandene Werte gerendert: Aussteller- und
Adresszeile, USt-IdNr. und/oder Steuernummer, IBAN/BIC sowie optional
`commercial_register`, `register_number` und `managing_director`. Leere Werte
erzeugen keine Platzhalter und der Bankname wird nicht gerendert. Die Fußzeile
ist Blattinhalt, keine feste Editor-Fußzeile. PDF, ZUGFeRD, Profilpflege,
Autosave und Datenbanklogik bleiben außerhalb des Pakets.

## Rechter Rechnungskopfblock 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Die vorhandenen editorfähigen
Layoutziele `rechnung.editor.parties`, `rechnung.editor.issuerAddress` und
`rechnung.editor.issuerMeta` bleiben unverändert; ihre sechs `data-ui-*`
Attribute, Parents und erlaubten reinen Layoutoperationen ändern sich nicht.

Auf Blattbreiten ab 781 px endet der rechte Kopfblock in einem 270-px-Bereich
am rechten Innenrand des Blatts. Dadurch rückt er gegenüber der bisherigen
310-px-Spalte nach rechts, ohne am Rand zu kleben. Die Informationsachse für
Rechnungsdatum und Leistungszeitraum bleibt bei `102px 8px minmax(0, 1fr)`.
Beide Namenszeilen haben Gewicht 600, Straße, PLZ/Ort und die beiden
Metazeilen Gewicht 500. Fachaktionen, Fachdaten, Autosave, PDF und ZUGFeRD
bleiben nicht editorfähig und unverändert.

## Rechter Kopfblock: Grid-Geometrie 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Die bestehenden Editor-Ziele
`rechnung.editor.parties`, `rechnung.editor.issuerAddress` und
`rechnung.editor.issuerMeta` sowie ihre Parents, Attribute und erlaubten
Layoutoperationen bleiben unverändert. Fachaktionen, Fachdaten und Autosave
bleiben gesperrt.

Das Desktop-Briefkopfgrid lautet nun `minmax(0, 1fr) 270px` mit `58px` Gap.
Bei der 940-px-Blattbreite und 42-px-Innenrändern bleiben 856 px nutzbare
Breite: Empfänger 528 px, Gap 58 px, rechte Kopfspalte 270 px. Der Block beginnt
bei x=628 und endet bei x=898, also mit dem unveränderten rechten Innenabstand
von 42 px. Die Label-/Doppelpunkt-/Wert-Achse bleibt `102px 8px minmax(0, 1fr)`;
die Schriftgewichte bleiben 600 für beide Namenszeilen und 500 für alle übrigen
Kopfzeilen.

## Rechter Kopfbereich mit zwei Teilblöcken 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Der bereits registrierte äußere
Kopfbereich `rechnung.editor.parties` enthält direkt die bestehenden Ziele
`rechnung.editor.issuerAddress` als Teilblock A und
`rechnung.editor.issuerMeta` als Teilblock B. Ihre IDs, Parents, Attribute und
reinen Layoutoperationen bleiben unverändert; Fachaktionen, Fachdaten und
Autosave sind keine Editor-Ziele.

Desktop-Geometrie: Das Briefkopfgrid endet in einer 360-px-rechten Spalte mit
58 px Gap. Teilblock A ist 270 px breit und rechtsbündig darin verankert;
Teilblock B ist 360 px breit und ebenfalls rechtsbündig. Beide Inhalte bleiben
linksbündig. Dadurch endet beides am gleichen rechten 42-px-Blattinnenrand,
während der Datums-/Zeitraumblock 90 px weiter nach links reichen darf. Die
Metadatenachse und die Gewichte 600 (Namen) beziehungsweise 500 (übrige Zeilen)
bleiben unverändert.

## Kopf- und LV-Rechtskante 21.08.2026

Art der Ausgabe: ausschließlich UI, kein PDF. Die gemeinsame Referenz ist die
rechte Content-Kante des Rechnungsblatts: `rechnung-sheet__letterhead`,
`rechnung-sheet__positions` und `rechnung-lv-list` verwenden alle dieselbe
volle Inline-Breite der Blatt-Content-Box. Der rechte Kopfcontainer endet daher
auf derselben Achse wie der LV-Außenrand.

Bei 940 px Blattbreite und 42 px Innenrand liegt diese Kante für LV und Kopf bei
x=898; die Abweichung beträgt 0 px. Die Teilblöcke bleiben rechts verankert,
verwenden jedoch `fit-content` mit 210 px beziehungsweise 270 px Mindestbreite.
Damit wird keine unsichtbare Restbreite rechts vom Text mehr als linker Eindruck
wahrgenommen. Inhalte bleiben linksbündig, die Metadatenachse und Gewichte
bleiben unverändert.

## Zentrale Textlimits und Restzeichenanzeigen 19.08.2026

Art der Ausgabe: UI, kein PDF. Die Rechnungs-Editbox verwendet ausschließlich
den vorhandenen `TextLimitSettingsService` für `tops.titleMax` und
`tops.longMax`, einschließlich dessen zentraler Fallbacks 100 beziehungsweise
500. Es entstehen keine Rechnungs-spezifischen Settings und keine eigene
Speicherlogik.

Die sichtbar registrierten Statuslabels
`rechnung.editor.positionShortRemaining` und
`rechnung.editor.positionLongRemaining` haben jeweils den Parent
`rechnung.editor.positionEditor`, Typ `label`, Rolle `status`, die üblichen
sechs `data-ui-*`-Attribute sowie reine Layout-/Text-/Sichtbarkeitsoperationen.
Sie zeigen nur verbleibende Zeichen; Settings-Lesen, Eingabeinhalt, Autosave,
Persistenz und Fachaktionen bleiben gesperrt. Der Vertrag umfasst damit 73
Ziele. M83-Rechnungskomponentenvertrag und UI-Editor-Vertragscheck prüfen
Registrierung, Parent-Struktur und die gemounteten Refs.

## MwSt. / Brutto Step 1 19.08.2026

Normale Leistungspositionen speichern den eigenen ganzzahligen Positionswert
`vat_rate_percent`. Fehlt er bei einem bestehenden Entwurf, wird er beim
Normalisieren rückwärtskompatibel mit dem Step-1-Standard `19` ergänzt. Ein
späterer Leistungskatalog kann beim Übernehmen einen expliziten Satz liefern;
danach ist dieser Wert Bestandteil der Rechnungsposition und hat keine
Rückbindung an spätere Katalogänderungen.

Die bestehende Netto-Anzeige `rechnung.editor.positions.total` bleibt ein
editorfähiges Layoutziel unter `rechnung.editor.payment`. Das sichtbare Feld
`rechnung.editor.positionVatRate` ist ein schreibgeschütztes Anzeigefeld; es
zeigt den an der Position gespeicherten MwSt.-Satz. `rechnung.editor.positionPriceGross`
ist der einzige Umschalter für die EP-Eingabeart und zeigt als Checkbox `Brutto`.
MwSt.- und Bruttosumme bleiben abgeleitete,
datensatzabhängige Anzeigewerte ohne eigene Editor-IDs. Berechnung,
automatische Speicherung, Buchung und eine spätere Katalogübernahme bleiben
gesperrte Fachlogik. NEP sowie Titel-, Text- und Hinweispositionen werden weder
in Netto noch MwSt. oder Brutto einbezogen.

Der Vertrag umfasst nun 81 registrierte Ziele. PDF, ZUGFeRD, Rechnungskopf und
Stammdaten sind nicht Teil dieses Pakets. Technisch abgesichert wird dies durch
Positions-, Buchungs- und Navigationsprüfungen sowie den bestehenden
UI-Editor-Vertragscheck.

## MwSt.-Editbox, Fokus und Proberechnungskennung 19.08.2026

Das Feld `rechnung.editor.positionVatRate` sowie der Brutto-Haken sind nur bei
der Positionsart `Leistungspos.` sichtbar. Titel, Text und Hinweis blenden beide
aus. Kurztext, Langtext, Menge, Einheit und Einzelpreis werden ausschließlich
beim tatsächlichen Fokuswechsel vollständig markiert; Select, Checkboxen,
Buttons und nicht-editierbare Felder bleiben ausgenommen.

Die Proberechnung zeigt bei DRAFTs die aus der stabilen DRAFT-ID abgeleitete
Kennung `PR-…` und den Hinweis, dass sie keine Rechnungsnummer ist. Sie ist
keine neue Sequenz, reserviert keine Nummer und ist nicht editorfähig. Die
offizielle Rechnungsnummer wird weiterhin nur bei der Buchung vergeben.

Text und Hinweis sind fachlich abgeleitete LV-Inhalte ohne einzelne
Editor-IDs. Sie werden sichtbar als `Text` beziehungsweise `Hinweis`
gekennzeichnet, erhalten keine Positionsnummer und erhöhen keinen
Leistungspositionszähler.

## Automatische DRAFT-Speicherung 19.08.2026

Der echte Rechnungsscreen speichert jede Änderung eines DRAFTs unmittelbar über
den vorhandenen Update-DRAFT-Pfad. Änderungen werden seriell verarbeitet, damit
Positionswechsel und das Anlegen weiterer Positionen keine vorherigen Eingaben
überschreiben. Dies betrifft Titel, Kurz- und Langtext, Menge, Einheit, EP,
NEP, Rechnungsempfänger, Rechnungsdatum, Leistungszeitraum, Bauvorhaben /
Leistungsbezug und Freitext.

Die sichtbaren Fachaktionen `rechnung.editor.save` und
`rechnung.editor.positionApply` entfallen vollständig. Der komponentennahe
Vertrag umfasst dadurch 69 statt 71 Ziele. Erhalten bleiben die bestehenden
Positionsaktionen `+Titel`, `+Position`, `Schieben`, `Position loeschen` sowie
die Actionbar-Aktionen Kopf, Proberechnung, Rechnung buchen, Schließen und
Entwurf verwerfen. Die automatische Persistenz, Buchung, Nummernvergabe und
Statuswechsel bleiben Fachlogik und sind keine Editoroperationen.

## Positionshierarchie-Update Meilenstein 2

Die untere feste Positions-Editbox erhaelt die reale Aktionsgruppe
`rechnung.editor.positionActions`. Ihre bewusst registrierten Kinder sind
`rechnung.editor.positionCreateTitle`, `rechnung.editor.positionCreate` und
`rechnung.editor.positionMove` sowie die bestehenden Fachaktionen
`positionDelete` und `positionApply`. Alle fuenf Buttons bleiben reine
Layoutziele: `executeTargetAction`, `modifyDomainData`, `createRecord` und
`deleteRecord` sind gesperrt.

Die vorhandene Gruppe `rechnung.editor.positions.list` ist der einzige
editorfaehige Bereich fuer die dynamische LV-Darstellung. Titelzeilen,
Positionsnummern und Einrueckungen bekommen keine einzelnen Editor-IDs, weil
sie fachliche, datensatzabhaengige Elemente sind. Die LV bleibt keine Tabelle.
Die Ref-Anzahl steigt von 69 auf 71; der Parent aller Positionsaktionen ist die
reale Aktionsgruppe.

## Positionsdarstellung-Nachschaerfung Meilenstein 2

Die dynamische LV-Liste bleibt innerhalb der bestehenden Gruppe
`rechnung.editor.positions.list`. Eine einmalige, abgeleitete Preis-Kopfzeile
und die Positionen selbst erhalten keine eigenen Editor-IDs: Sie sind
datensatzabhaengige Anzeigeinhalte und keine eigenstaendigen Editor-Ziele.
Normale Leistungspositionen bestehen sichtbar aus Kurztext, optionalem
Langtext und einer Preiszeile auf festen Achsen. Die Positionen haben keinen
eigenen Hintergrund, sondern liegen direkt auf dem hellen Rechnungsblatt; nur
eine Haarlinie und ein zarter Zwischenstreifen trennen sie ohne Zebra- oder
Kartenoptik. Die Kopfzeile benennt `Pos. / Gegenstand`, `Menge / Einheit`,
`EP` und `GP`; die Zeilen enthalten ausschließlich die Werte. Titel
 sowie Text- und Hinweispositionen erhalten keine
Preiszeile. Die vorhandenen 69 registrierten Ziele, Elternbeziehungen und
gesperrten Fachaktionen bleiben unveraendert.

## Rechnungsblatt-Update 18.08.2026

Der echte DRAFT-Arbeitsweg ist ein direkt bearbeitbares Rechnungsblatt. Die 69
stabilen IDs, Attributpflichten und Operationsmengen dieses Dokuments bleiben
erhalten. Die geänderte Zuordnung lautet: `rechnung.editor` ist das
Rechnungsblatt, `rechnung.editor.header` die Anwendungsaktionen außerhalb des
Blatts, `rechnung.editor.body` der Rechnungsblattinhalt,
`rechnung.editor.positions` das Bau-LV, `rechnung.editor.positionEditor` die
kompakte direkte Positionsbearbeitung und `rechnung.editor.payment` der
Summen- und Zahlungstextbereich. `rechnung.editor.positions.total` ist dessen
Kind. Die LV-Liste ist keine Tabelle und kein Tabellenlayout-Editor-Ziel.

Der UI-Editor bearbeitet weiterhin ausschließlich Layout und Darstellung.
Kundenwahl, Feldwerte, Speichern, Positionsaktionen, Buchung, Vorschau und
Schließen bleiben gesperrte Fachaktionen.

Diese Entscheidung gilt für den echten `RechnungScreen`. Die historische
statische Designreferenz `RechnungenDesignScreen` ist nicht Gegenstand dieses
Editorvertrags.

## Brief-/Rechnungskopf-Update 18.08.2026

Der UI-Kopf wird als Briefkopf angeordnet: Empfänger links, der bestehende
Rechnungssteller rechts, danach Rechnungsdatum und Leistungszeitraum. Die
vorhandene MainHeader-Logik mit optionalem `header.logoPath` wird nicht in den
Rechnungsscreen gekoppelt; ohne eine eigene Rechnungsdatenquelle wird kein Logo
erfunden. Titel, Rechnungsnummer, Leistungsbezug und optionaler Freitext folgen
darunter. Das Bau-LV bleibt unverändert und eine sichtbare Trennlinie markiert
seinen Beginn.

`Summe Netto`, `19 % MwSt.` und `Summe Brutto` werden im MwSt.-Step-1-Paket aus
den gespeicherten Leistungspositionen abgeleitet. Bei gemischten
Positionssätzen lautet die Beschriftung neutral `MwSt.`. Die vorhandenen 73
registrierten UI-Ziele und ihre Fachaktionssperren bleiben unverändert.

## Endlosblatt-Korrektur 18.08.2026

Der scrollbare Sheet-Bereich bildet eine einzige, durchgehende helle
Rechnungsblattflaeche. Der Blattkoerper hat im laufenden Arbeitsbereich keinen
Rahmen, Schatten oder gerundete Unterkante; Positionen, Summen und weiterer
Rechnungsinhalt liegen auf derselben Flaeche. Die feste Positions-Editbox bleibt
als eigener Bereich unterhalb des Sheets und wird nicht Teil des Blatts. Diese
Geometriekorrektur aendert keine registrierten Editorziele, Fachaktionen oder
PDF-Ausgabe.

## A. Art der Ausgabe

- UI: ja
- PDF: nein
- UI und PDF: nein
- keine editorrelevante Ausgabe: nein

Die sichtbare Proberechnung ist eine UI-Vorschau des Belegkopfs. Sie ist keine
PDF-Ausgabe und keine PDF-Satzstruktur.

## B. Editorfähigkeit

- editorfähig: ja
- Umfang: ausschließlich Layout und Darstellung der bewusst registrierten
  Elemente

Nicht editorfähig sind Fachwerte, Datenbindung, Berechnung, Persistenz,
Buchung und die fachliche Ausführung sichtbarer Buttons.

## C. Editorfähige Elemente

Alle 81 Elemente sind sichtbar und besitzen:

- `visible: true`
- `editable: true`
- `data-ui-inspector-id` = `id`
- `data-ui-editor-kind` = `type`
- `data-ui-editor-label` = `name`
- `data-ui-editor-parent` = `parentId`, beim Root exakt leer
- `data-ui-editor-editable` = `true`
- `data-ui-editor-ops` = `allowedOps`

Operationsmengen:

- `G`: `move`, `resizeWidth`, `resizeHeight`, `setVisibility`
- `T`: `move`, `resizeWidth`, `resizeHeight`, `setVisibility`, `textResize`
- `D`: gesperrt sind `executeTargetAction`, `modifyDomainData`, `createRecord`,
  `deleteRecord`

| id | name | type | role | parentId | order | allowedOps / lockedOps | Zusatz |
|---|---|---|---|---|---:|---|---|
| `rechnung.screen` | Rechnungen | `root` | `scopeRoot` | – | 0 | G / – | `componentKind: moduleScreen` |
| `rechnung.screen.content` | Inhaltsbereich Rechnungen | `area` | `layout` | `rechnung.screen` | 10 | G / – | `componentKind: contentArea` |
| `rechnung.overview` | Rechnungsübersicht | `area` | `layout` | `rechnung.screen.content` | 20 | G / – | `componentKind: overview` |
| `rechnung.overview.header` | Kopf Rechnungsübersicht | `group` | `layout` | `rechnung.overview` | 21 | G / – | `componentKind: header` |
| `rechnung.overview.title` | Rechnungen | `label` | `content` | `rechnung.overview.header` | 22 | T / – | `componentKind: label` |
| `rechnung.overview.subtitle` | Rechnungsgrunddaten und Belegköpfe | `label` | `content` | `rechnung.overview.header` | 23 | T / – | `componentKind: label` |
| `rechnung.overview.new` | Freie Rechnung | `button` | `domainActionLayout` | `rechnung.overview.header` | 24 | T / D | `actionKind: createDraft` |
| `rechnung.overview.list` | Rechnungsbelege | `group` | `content` | `rechnung.overview` | 25 | G / – | `componentKind: cardList` |
| `rechnung.editor` | Rechnungseditor | `area` | `layout` | `rechnung.screen.content` | 30 | G / – | `componentKind: workDialog` |
| `rechnung.editor.header` | Kopf Rechnungseditor | `group` | `layout` | `rechnung.editor` | 31 | G / – | `componentKind: header` |
| `rechnung.editor.title` | Belegart | `label` | `content` | `rechnung.editor.header` | 32 | T / – | `componentKind: label` |
| `rechnung.editor.status` | Rechnungsstatus | `statusIndicator` | `status` | `rechnung.editor.header` | 33 | G / – | `componentKind: statusBadge` |
| `rechnung.editor.body` | Belegkopfdaten | `area` | `layout` | `rechnung.editor` | 40 | G / – | `componentKind: formBody` |
| `rechnung.editor.basic` | Grunddaten | `group` | `layout` | `rechnung.editor.body` | 41 | G / – | `componentKind: formGroup` |
| `rechnung.editor.source` | Herkunft | `field` | `content` | `rechnung.editor.basic` | 42 | T / – | `fieldKind: select` |
| `rechnung.editor.documentType` | Belegart | `field` | `content` | `rechnung.editor.basic` | 43 | T / – | `fieldKind: select` |
| `rechnung.editor.installmentNumber` | Abschlagsnummer | `field` | `content` | `rechnung.editor.basic` | 44 | T / – | `fieldKind: integer` |
| `rechnung.editor.invoiceNumber` | Rechnungsnummer | `field` | `content` | `rechnung.editor.basic` | 45 | T / – | `fieldKind: readOnlyText` |
| `rechnung.editor.customer` | Rechnungskunde | `field` | `content` | `rechnung.editor.basic` | 46 | T / – | `fieldKind: select` |
| `rechnung.editor.project` | Projekt | `field` | `content` | `rechnung.editor.basic` | 47 | T / – | `fieldKind: select` |
| `rechnung.editor.invoiceDate` | Rechnungsdatum | `field` | `content` | `rechnung.editor.basic` | 48 | T / – | `fieldKind: date` |
| `rechnung.editor.parties` | Rechnungsparteien | `group` | `layout` | `rechnung.editor.body` | 50 | G / – | `componentKind: partySummary` |
| `rechnung.editor.customerAddress` | Rechnungsanschrift Kunde | `label` | `content` | `rechnung.editor.parties` | 51 | T / – | `componentKind: label` |
| `rechnung.editor.issuerBlock` | Ausstellerblock | `group` | `layout` | `rechnung.editor.parties` | 52 | G / – | `componentKind: issuerBlock` |
| `rechnung.editor.issuerName1` | Aussteller Name 1 | `label` | `content` | `rechnung.editor.issuerBlock` | 53 | T / – | `componentKind: label` |
| `rechnung.editor.issuerName2` | Aussteller Name 2 | `label` | `content` | `rechnung.editor.issuerBlock` | 54 | T / – | `componentKind: label` |
| `rechnung.editor.issuerStreet` | Aussteller Straße | `label` | `content` | `rechnung.editor.issuerBlock` | 55 | T / – | `componentKind: label` |
| `rechnung.editor.issuerCity` | Aussteller PLZ Ort | `label` | `content` | `rechnung.editor.issuerBlock` | 56 | T / – | `componentKind: label` |
| `rechnung.editor.invoiceMetaBlock` | Rechnungsdatenblock | `group` | `layout` | `rechnung.editor.parties` | 57 | G / – | `componentKind: invoiceMetaBlock` |
| `rechnung.editor.invoiceDateDisplay` | Rechnungsdatum Anzeige | `label` | `content` | `rechnung.editor.invoiceMetaBlock` | 58 | T / – | `componentKind: label` |
| `rechnung.editor.servicePeriodDisplay` | Leistungszeitraum Anzeige | `label` | `content` | `rechnung.editor.invoiceMetaBlock` | 59 | T / – | `componentKind: label` |
| `rechnung.editor.servicePeriod` | Leistungszeitpunkt | `group` | `layout` | `rechnung.editor.body` | 60 | G / – | `componentKind: servicePeriod` |
| `rechnung.editor.servicePeriodToggle` | Leistungszeitraum bearbeiten | `button` | `domainActionLayout` | `rechnung.editor.servicePeriod` | 60 | T / D | `actionKind: toggleServicePeriodEditor` |
| `rechnung.editor.servicePeriodType` | Art des Leistungszeitpunkts | `field` | `content` | `rechnung.editor.servicePeriod` | 61 | T / – | `fieldKind: select` |
| `rechnung.editor.serviceDate` | Leistungsdatum | `field` | `content` | `rechnung.editor.servicePeriod` | 62 | T / – | `fieldKind: date` |
| `rechnung.editor.serviceMonth` | Leistungsmonat | `field` | `content` | `rechnung.editor.servicePeriod` | 63 | T / – | `fieldKind: month` |
| `rechnung.editor.serviceStart` | Leistungszeitraum von | `field` | `content` | `rechnung.editor.servicePeriod` | 64 | T / – | `fieldKind: date` |
| `rechnung.editor.serviceEnd` | Leistungszeitraum bis | `field` | `content` | `rechnung.editor.servicePeriod` | 65 | T / – | `fieldKind: date` |
| `rechnung.editor.reference` | Bauvorhaben / Leistungsbezug | `field` | `content` | `rechnung.editor.body` | 70 | T / – | `fieldKind: singleLineText` |
| `rechnung.editor.constructionProject` | Bauvorhaben | `field` | `content` | `rechnung.editor.body` | 71 | T / – | `fieldKind: singleLineText` |
| `rechnung.editor.positions` | Rechnungspositionen | `group` | `layout` | `rechnung.editor.body` | 72 | G / – | `componentKind: positionWorkbench` |
| `rechnung.editor.positions.total` | Positionssumme | `label` | `content` | `rechnung.editor.positions` | 73 | T / – | `componentKind: label` |
| `rechnung.editor.positions.list` | Positionsliste | `group` | `content` | `rechnung.editor.positions` | 74 | G / – | `componentKind: cardList` |
| `rechnung.editor.positionEditor` | Positionseditor | `group` | `layout` | `rechnung.editor.positions` | 75 | G / – | `componentKind: positionEditor` |
| `rechnung.editor.positionType` | Positionstyp | `field` | `content` | `rechnung.editor.positionEditor` | 76 | T / – | `fieldKind: select` |
| `rechnung.editor.positionShort` | Kurztext | `field` | `content` | `rechnung.editor.positionEditor` | 77 | T / – | `fieldKind: singleLineText` |
| `rechnung.editor.positionShortRemaining` | Restzeichen Kurztext | `label` | `status` | `rechnung.editor.positionEditor` | 77.1 | T / – | `componentKind: counter` |
| `rechnung.editor.positionLong` | Langtext | `field` | `content` | `rechnung.editor.positionEditor` | 78 | T / – | `fieldKind: multilineText` |
| `rechnung.editor.positionLongRemaining` | Restzeichen Langtext | `label` | `status` | `rechnung.editor.positionEditor` | 78.1 | T / – | `componentKind: counter` |
| `rechnung.editor.positionQuantity` | Menge | `field` | `content` | `rechnung.editor.positionEditor` | 79 | T / – | `fieldKind: decimal` |
| `rechnung.editor.positionUnit` | Einheit | `field` | `content` | `rechnung.editor.positionEditor` | 80 | T / – | `fieldKind: singleLineText` |
| `rechnung.editor.positionPrice` | Einzelpreis netto/brutto | `field` | `content` | `rechnung.editor.positionEditor` | 81 | T / – | `fieldKind: currency` |
| `rechnung.editor.positionVatRate` | MwSt. | `field` | `content` | `rechnung.editor.positionEditor` | 82 | T / – | `fieldKind: readOnlyText` |
| `rechnung.editor.positionPriceGross` | Brutto | `field` | `content` | `rechnung.editor.positionEditor` | 82 | T / – | `fieldKind: checkbox` |
| `rechnung.editor.positionNep` | NEP | `field` | `content` | `rechnung.editor.positionEditor` | 82 | T / – | `fieldKind: checkbox` |
| `rechnung.editor.positionActions` | Positionsaktionen | `group` | `layout` | `rechnung.editor.positionEditor` | 83 | G / â€“ | `componentKind: actionGroup` |
| `rechnung.editor.positionCreateTitle` | +Titel | `button` | `domainActionLayout` | `rechnung.editor.positionActions` | 84 | T / D | `actionKind: createPositionTitle` |
| `rechnung.editor.positionCreate` | +Position | `button` | `domainActionLayout` | `rechnung.editor.positionActions` | 85 | T / D | `actionKind: createPosition` |
| `rechnung.editor.positionMove` | Schieben | `button` | `domainActionLayout` | `rechnung.editor.positionActions` | 86 | T / D | `actionKind: movePosition` |
| `rechnung.editor.positionDelete` | Position loeschen | `button` | `domainActionLayout` | `rechnung.editor.positionActions` | 87 | T / D | `actionKind: deletePosition` |
| `rechnung.editor.payment` | Zahlungsdaten | `group` | `layout` | `rechnung.editor.body` | 80 | G / – | `componentKind: payment` |
| `rechnung.editor.issuerFooter` | Aussteller-Fußdaten | `group` | `content` | `rechnung.editor.body` | 81 | G / – | `componentKind: issuerFooter` |
| `rechnung.editor.paymentTermDays` | Zahlungsziel Kalendertage | `field` | `content` | `rechnung.editor.payment` | 81 | T / – | `fieldKind: integer` |
| `rechnung.editor.dueDate` | Fällig am | `field` | `content` | `rechnung.editor.payment` | 82 | T / – | `fieldKind: readOnlyDate` |
| `rechnung.editor.validation` | Validierung und Meldungen | `statusIndicator` | `status` | `rechnung.editor` | 90 | G / – | `componentKind: liveMessage` |
| `rechnung.editor.footer` | Aktionen Rechnungseditor | `group` | `layout` | `rechnung.editor` | 100 | G / – | `componentKind: actionBar` |
| `rechnung.editor.preview` | Proberechnung | `button` | `domainActionLayout` | `rechnung.editor.footer` | 102 | T / D | `actionKind: previewDraft` |
| `rechnung.editor.book` | Rechnung buchen | `button` | `domainActionLayout` | `rechnung.editor.footer` | 103 | T / D | `actionKind: bookDraft` |
| `rechnung.editor.delete` | Entwurf verwerfen | `button` | `domainActionLayout` | `rechnung.editor.footer` | 104 | T / D | `actionKind: deleteDraft` |
| `rechnung.editor.close` | Schließen | `button` | `domainActionLayout` | `rechnung.editor.footer` | 105 | T / D | `actionKind: close` |
| `rechnung.preview` | Proberechnung | `area` | `layout` | `rechnung.screen.content` | 110 | G / – | `componentKind: previewDialog` |
| `rechnung.preview.title` | Proberechnung / Entwurf | `label` | `content` | `rechnung.preview` | 111 | T / – | `componentKind: label` |
| `rechnung.preview.body` | Vorschau Belegkopf | `area` | `layout` | `rechnung.preview` | 112 | G / – | `componentKind: previewBody` |
| `rechnung.preview.close` | Vorschau schließen | `button` | `domainActionLayout` | `rechnung.preview` | 113 | T / D | `actionKind: closePreview` |

Die drei zusammengesetzten Ziele behalten ihre fachlich genaue Zusatzsemantik,
verwenden aber nur vom nativen Adapter unterstützte Grundtypen:

- `rechnung.overview.list`: `group` mit `componentKind: cardList`
- `rechnung.editor`: `area` mit `componentKind: workDialog`
- `rechnung.preview`: `area` mit `componentKind: previewDialog`

Es gibt keine editorfähige Tabelle, keine Tabellenspalte und keine Metaspalte
im Rechnungsscope. Die Karten-/Listengruppe ist kein Tabellenlayout-Editor-Ziel.

## D. Nicht editorfähige Elemente / verbotene Editor-Ziele

Nicht editorfähig sind:

- Fachaktionen
- fachliches Speichern
- fachliches Anlegen
- fachliches Löschen
- Upload
- Import
- Export
- Autosave
- fachliche IPC-/Datenaktionen
- Datenbankaktionen
- fachliches Ausführen eines Buttons
- Rechnungs-, Kunden-, Projekt-, Datums-, Zahlungs- und Adresswerte

Insbesondere darf der UI-Editor nicht ausführen:

- Neue/Freie Rechnung
- Speichern
- Proberechnung
- Rechnung buchen
- Entwurf löschen/verwerfen
- Schließen
- Vorschau schließen

Die Buttons sind nur als sichtbare Layoutobjekte editorfähig. Ihre
Fachausführung bleibt durch die Operationsmenge `D` gesperrt.

## E. Parent-/Strukturregel

- `rechnung.screen` ist der einzige Root und besitzt keinen Parent.
- Jedes andere Element besitzt genau den in Abschnitt C angegebenen Parent.
- Jeder Parent ist selbst registriertes Editorziel.
- Die Parentstruktur bildet die real deklarierte UI ab.
- Es werden keine Parents geraten, keine Wrapper ergänzt und keine Elemente aus
  DOM, CSS, sichtbaren Texten oder Fachdaten abgeleitet.

## F. Prüf-/Testangabe

Die Entscheidung wird abgesichert durch:

- statische M83-Komponentenvertragsprüfung
- nativen M80-Typ- und Operationsvertrag
- Registry-/Manifest-/Fingerprint-Prüfung
- dauerhaften Rechnung-Mounted-Ref-Test mit exakt 81 Einzel-Refs
- Prüfung aller sechs `data-ui-*`-Pflichtattribute
- Parent-/Ref-Zuordnungsprüfung
- UI-Editor-Kit-Vertragscheck
- isolierte praktische Electron-Prüfung des echten Rechnungsscreens

Der Scope darf nur bei grünen Vertrags- und Runtime-Nachweisen als `complete`
veröffentlicht werden. Der globale Registrystatus bleibt wegen bewusst
blockierter, nicht inventarisierter BBM-Bereiche `incomplete`.
