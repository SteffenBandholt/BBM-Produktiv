# Rechnung: Entgrenzung aller 117 UI-Editor-Ziele

Stand: 24.08.2026, Branch `rechnung-integration`, noch nicht committed oder gepusht.

## Korrektur 25.08.2026 - effektive Buttongeometrie im Produktpfad

Der Abschluss nach Commit `6a9dfd0f` war durch die praktische Nutzerprüfung
widerlegt. Der damalige M86.24-Harness mountete einen eigenen RechnungScreen in
eine leere Testseite und lud weder die globale CoreShell-Styleinjektion noch
`popupFormStandard.css`. Zudem prüfte er nur drei Minusschritte und
`< 20`/`< 18`, nicht die angeforderten `6 x 6 px`. Im normalen produktiven
RechnungScreen wirkte dagegen
`.bbm-popup-standard :where(button) { min-height: 30px !important; }`; die
sichtbare Höhe blieb deshalb trotz gespeichertem Editorwert bei 30 px.

Gefundene weitere Layoutwirkungen waren der globale CoreShell-Buttonstandard,
die festen Dezimal-Gridtracks `20px 22px 20px`, Grid-Stretch, die
Flex-/Intrinsic-Breite aus Text, Padding, Rahmen und `white-space: nowrap`, die
explizite Iconbreite sowie die `width: 100%`-Vorschauaktion. Die festen
Gridtracks bleiben als unveränderter Standardaufbau erhalten, legen eine
explizit editierte Buttongröße aber nicht mehr fest: Gridbuttons erhalten bei
Breiten-/Höhenbearbeitung `justify-self: start` beziehungsweise
`align-self: start`; Flexbuttons verwenden weiterhin den exakten Flex-Basis-
und Align-Self-Weg. Die globale und die Popup-Mindesthöhe gelten nicht mehr
für `.invoice-button`. Die normale Standardhöhe bleibt ohne Editoroperation
über `height: var(--invoice-button-height)` unverändert. Inlinegröße,
Chrome-Einpassung und `overflow: hidden` haben nach einer Editoroperation
Vorrang vor Text, Padding, Rahmen und Intrinsic-Sizing.

Der neue echte Chromium-DOM-Guard prüft alle 16 registrierten Buttons jeweils
mit nur Breite, nur Höhe, beiden Dimensionen, `0 x 0 px`, sehr klein, deutlich
größer und Rückkehr zum Standard. `0 x 0 px` wurde bei allen 16 Buttons und dem
Referenzelement real als `0 x 0 px` gemessen. Messung der weiteren kombinierten
Phasen:

| ID | klein Soll | klein Ist | groß Soll | groß Ist |
|---|---:|---:|---:|---:|
| `rechnung.overview.new` | 6x6 | 5.996x5.996 | 196x90 | 195.996x90.000 |
| `rechnung.editor.headToggle` | 6x6 | 5.996x5.996 | 188x90 | 187.998x90.000 |
| `rechnung.editor.customerPicker` | 6x6 | 5.996x5.996 | 264x90 | 263.994x90.000 |
| `rechnung.editor.servicePeriodToggle` | 6x6 | 5.996x5.996 | 456x90 | 455.996x90.000 |
| `rechnung.editor.positionQuantityDecimals.decrease` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionQuantityDecimals.increase` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionCreateTitle` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionCreate` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionMove` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionDelete` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.editor.positionMoveRoot` | 6x6 | 5.996x5.996 | 217x90 | 216.992x90.000 |
| `rechnung.editor.preview` | 6x6 | 5.996x5.996 | 180x90 | 180.000x90.000 |
| `rechnung.editor.book` | 6x6 | 5.996x5.996 | 194x90 | 193.994x90.000 |
| `rechnung.editor.delete` | 6x6 | 5.996x5.996 | 199x90 | 198.994x90.000 |
| `rechnung.editor.close` | 6x6 | 5.996x5.996 | 160x90 | 160.000x90.000 |
| `rechnung.preview.close` | 6x6 | 5.996x5.996 | 1137x90 | 1136.992x90.000 |

Das bereits entgrenzte Nicht-Button-Referenzziel
`rechnung.editor.headerCanvas` lieferte für dieselben Operationen
`5.996 x 5.996 px` und `1193.994 x 90.000 px`. Button und Referenz folgen
damit derselben Vertragssemantik.

Die Realabnahme nutzte den normalen Router, den produktiven RechnungScreen,
dieselbe CoreShell-/Popup-/Rechnungs-Stylekette und den nativen WPF-UI-Editor.
Die native Ein-Pixel-Bedienung liegt wegen Windows-DPI-/Chromium-Rundung bis
zu 0.5 px um den angeforderten Wert. Alle Angaben sind reale
`getBoundingClientRect()`-Außenmaße:

| Ziel | vorher | nach Soll 6x6 | deutlich groß | gespeichert / Reopen | Electron-Neustart |
|---|---:|---:|---:|---:|---:|
| Nachkommastellen + | 21.992x30.000 | 5.902x5.921 | 125.893x85.912 | 5.780x5.799 | 5.771x5.799 |
| +Titel | 42.951x30.000 | 5.846x5.921 | 125.846x85.912 | 5.733x5.799 | 5.724x5.799 |
| +Position | 61.447x30.000 | 6.353x5.921 | 126.344x85.912 | 6.288x5.799 | 6.288x5.799 |
| Schieben | 60.103x30.000 | 6.015x5.921 | 126.006x85.912 | 5.949x5.799 | 5.940x5.799 |
| Löschen | 56.175x30.000 | 6.118x5.921 | 126.100x85.912 | 6.043x5.799 | 6.034x5.799 |
| Proberechnung | 99.568x30.000 | 6.494x5.921 | 116.485x85.912 | 6.429x5.799 | 6.429x5.799 |
| Kopfbutton | 107.284x30.000 | 6.222x5.921 | 126.222x85.912 | 6.165x5.799 | 6.156x5.799 |

Die Berichte liegen unter
`output/playwright/rechnung-buttons-product-acceptance/`. Der verpflichtende
Guard `scripts/tests/rechnungButtonEffectiveGeometry.test.cjs` scheitert nicht
nur an CSS-Strings, sondern vergleicht für alle 16 Ziele Sollgröße und reale
Chromium-BoundingBox. `scripts/tests/rechnungButtonProductAcceptance.test.cjs`
deckt den normalen Produktpfad, sichtbares Speichern, Rechnung-Reopen und einen
zweiten Electron-Prozess ab. Der korrigierte M86.24-Harness lädt nun ebenfalls
die vorher fehlende CoreShell-/Popup-Stylekette und fordert etwa `6 x 6 px`.

Der nachfolgende Nachtrag vom selben Tag dokumentiert den damaligen Stand und
ist hinsichtlich seines alten Sichtnachweises durch diese Korrektur ersetzt.

## Nachtrag 25.08.2026 - alle 16 registrierten Rechnungsbuttons vollständig entgrenzt

Das nachfolgende 117er-Inventar bleibt der historische Nachweis des damaligen
Scopes. Der aktuelle Rechnungskomponentenvertrag umfasst 131 Ziele. Darin sind
exakt diese 16 Buttons registriert:

- `rechnung.overview.new`
- `rechnung.editor.headToggle`
- `rechnung.editor.customerPicker`
- `rechnung.editor.servicePeriodToggle`
- `rechnung.editor.positionQuantityDecimals.decrease`
- `rechnung.editor.positionQuantityDecimals.increase`
- `rechnung.editor.positionCreateTitle`
- `rechnung.editor.positionCreate`
- `rechnung.editor.positionMove`
- `rechnung.editor.positionDelete`
- `rechnung.editor.positionMoveRoot`
- `rechnung.editor.preview`
- `rechnung.editor.book`
- `rechnung.editor.delete`
- `rechnung.editor.close`
- `rechnung.preview.close`

Für alle 16 fehlen `min-width`, `max-width`, `min-height` und `max-height` in
sämtlichen `.invoice-button`-CSS-Regeln, Registry/Komponentenvertrag,
HostAdapter, Inline-Styles und gespeicherten Profilwerten. Auch Text, Padding
und Rahmen erzeugen keine faktische Untergrenze: Die äußere, vom Editor
gewählte Größe bleibt exakt erhalten; Padding und Rahmen werden erforderlichenfalls
innerhalb der Zielgröße eingepasst und Inhalt darf clippen.

Der Komponentenvertrag deklariert den erwartbaren Reflow bereits vorhandener
Geschwister desselben Parents. Dieser erwartete Reflow löst keinen Rollback
aus; echte Überlagerungen, Flächenverletzungen und unerwartete Änderungen
bleiben weiterhin geschützt. IDs, Parents, Fachaktionen und Handler wurden
nicht geändert.

Der Guardrail `scripts/tests/rechnungUiEditorUnbounded.test.cjs` prüft alle
`.invoice-button`-Selektoren, exakt 16 Registrybuttons, Adapteranwendung,
Inline-Zustand sowie Save/Restart-Restore. Die sichtbare native Abnahme prüft
Nachkommastellen-Button, `+Position` und `Proberechnung` mit Minus/Plus in
beiden Dimensionen; der Nachkommastellen-Button bleibt unter 20 x 18 px. Nach
sichtbarem Speichern, Close/Remount und einem zweiten Electron-Prozess werden
kleine Breite und Höhe exakt wiederhergestellt.

## Ergebnis nach Prüfebene

- Registry/Komponentenvertrag: Der Scope `rechnung.screen` enthält 117 vollständig gemountete Ziele. Bei allen fehlen `minX`, `maxX`, `minY`, `maxY`, `minWidth`, `maxWidth`, `minHeight` und `maxHeight`; alle erlauben `move`, `resizeWidth` und `resizeHeight`.
- Adapter: Der generische M80-Host berücksichtigt nur endliche, ausdrücklich deklarierte Grenzen. Ohne Deklaration gibt es keine Ersatzgrenze und keinen Rechnungssonderfall. Die frühere Offsetgrenze `maximumStoredOffset: 2400` wird für die Rechnung nicht mehr erzeugt.
- Refs: Inline-`min-width`, `max-width`, `min-height` und `max-height` werden nur bei ausdrücklich deklarierter Grenze geschrieben; bei allen Rechnungszielen werden vorhandene Inline-Grenzen entfernt.
- CSS: Positive Mindest-/Höchstgrenzen der produktiven Rechnungs-UI wurden entfernt. Flexible Gridspalten verwenden `minmax(0, ...)`. Verbleibendes `min-width: 0` beziehungsweise `min-height: 0` löst ausschließlich die intrinsische Flex-/Grid-Mindestgröße und führt keine Grenze oberhalb der technisch zulässigen 0 px ein.
- Persistenz: Der bestehende Profilweg und der Scope-Fingerprint bleiben erhalten. Ein vollständiges Profil mit allen 117 Elementen wurde gespeichert, über das gemeinsame UI-Editor-Kit geladen und nach Neuaufbau des echten `RechnungScreen` für alle 117 Elemente exakt wiederhergestellt.
- Sichtbare Abnahme: `rechnung.editor.positionShort` wurde im nativen WPF-Editor von 571,513 px über drei normale Minusschritte und weitere 120 physische Minusklicks auf 447,820 px verkleinert. 140 physische Plusklicks vergrößerten es auf 587,293 px und damit über den Ausgangswert. Der sichtbare Button `Speichern` schrieb das Profil; Close, Remount und ein getrennter Electron-Prozess stellten die gespeicherte Breite wieder her.
- Extremwerte: Am real gemounteten `RechnungScreen` wurden x/y jeweils mit -2501 und +2501 px, Breite/Höhe mit 0 px sowie die beiden Textareas mit 10 beziehungsweise 800 px angewendet, gespeichert und wiederhergestellt.

Technisch zwingend verbleiben nur endliche Zahlen sowie Breite/Höhe größer oder gleich 0. Negative Breiten oder Höhen sind keine renderbare CSS-Geometrie. Es bestehen keine positiven Ersatzgrenzen und keine Sentinelwerte.

## Legende der Altgrenzen

- `G`: Vorher generisch künstlich begrenzt auf x/y ±2400 px, Breite 8–2400 px und Höhe 8–1600 px. Fundstelle: `src/renderer/ui-editor/m83ComponentContract.js`, bisherige Standard-Baseline und `geometry.maximumStoredOffset`.
- `T`: Wie `G`, zusätzlich ersetzte die Textarea-Sonderregel die Höhe durch 24–720 px. Fundstelle: `src/renderer/ui-editor/m83ComponentContract.js`, bisherige Textarea-/`multilineText`-Sonderregel.
- Die Tabellenangabe `G` oder `T` ordnet damit jedem der 117 Einträge sowohl seine vorherige Grenze als auch deren Fundstelle zu. Zusätzliche sichtbare CSS-Grenzen lagen in `src/renderer/modules/rechnungen/styles/rechnungenDesign.css`; sie wurden separat vollständig auf positive Min-/Max- und restriktive Trackwerte geprüft und entfernt.
- `entfernt = ja`: Keine der acht Min-/Max-Grenzen und kein Maximum-Offset verbleibt im Rechnungseintrag.
- `Persistenz = ja`: Das Element war Bestandteil des vollständigen 117er Save-/Load-/Remount-Nachweises.

## Vollständiges Inventar

| Nr. | ID | move | resizeWidth | resizeHeight | Altgrenze | entfernt | Persistenz |
|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `rechnung.screen` | ja | ja | ja | G | ja | ja |
| 2 | `rechnung.screen.content` | ja | ja | ja | G | ja | ja |
| 3 | `rechnung.overview` | ja | ja | ja | G | ja | ja |
| 4 | `rechnung.overview.header` | ja | ja | ja | G | ja | ja |
| 5 | `rechnung.overview.title` | ja | ja | ja | G | ja | ja |
| 6 | `rechnung.overview.subtitle` | ja | ja | ja | G | ja | ja |
| 7 | `rechnung.overview.new` | ja | ja | ja | G | ja | ja |
| 8 | `rechnung.overview.list` | ja | ja | ja | G | ja | ja |
| 9 | `rechnung.editor` | ja | ja | ja | G | ja | ja |
| 10 | `rechnung.editor.header` | ja | ja | ja | G | ja | ja |
| 11 | `rechnung.editor.headerCanvas` | ja | ja | ja | G | ja | ja |
| 12 | `rechnung.editor.title` | ja | ja | ja | G | ja | ja |
| 13 | `rechnung.editor.status` | ja | ja | ja | G | ja | ja |
| 14 | `rechnung.editor.headToggle` | ja | ja | ja | G | ja | ja |
| 15 | `rechnung.editor.body` | ja | ja | ja | G | ja | ja |
| 16 | `rechnung.editor.sheetArea` | ja | ja | ja | G | ja | ja |
| 17 | `rechnung.editor.sheetCanvas` | ja | ja | ja | G | ja | ja |
| 18 | `rechnung.editor.basic` | ja | ja | ja | G | ja | ja |
| 19 | `rechnung.editor.source` | ja | ja | ja | G | ja | ja |
| 20 | `rechnung.editor.documentType` | ja | ja | ja | G | ja | ja |
| 21 | `rechnung.editor.installmentNumber` | ja | ja | ja | G | ja | ja |
| 22 | `rechnung.editor.invoiceNumber` | ja | ja | ja | G | ja | ja |
| 23 | `rechnung.editor.customerPicker` | ja | ja | ja | G | ja | ja |
| 24 | `rechnung.editor.project` | ja | ja | ja | G | ja | ja |
| 25 | `rechnung.editor.invoiceDate` | ja | ja | ja | G | ja | ja |
| 26 | `rechnung.editor.parties` | ja | ja | ja | G | ja | ja |
| 27 | `rechnung.editor.customerAddress` | ja | ja | ja | G | ja | ja |
| 28 | `rechnung.editor.issuerBlock` | ja | ja | ja | G | ja | ja |
| 29 | `rechnung.editor.issuerName1` | ja | ja | ja | G | ja | ja |
| 30 | `rechnung.editor.issuerName2` | ja | ja | ja | G | ja | ja |
| 31 | `rechnung.editor.issuerStreet` | ja | ja | ja | G | ja | ja |
| 32 | `rechnung.editor.issuerCity` | ja | ja | ja | G | ja | ja |
| 33 | `rechnung.editor.invoiceMetaBlock` | ja | ja | ja | G | ja | ja |
| 34 | `rechnung.editor.invoiceDateDisplay` | ja | ja | ja | G | ja | ja |
| 35 | `rechnung.editor.invoiceDateDisplay.label` | ja | ja | ja | G | ja | ja |
| 36 | `rechnung.editor.servicePeriodDisplay` | ja | ja | ja | G | ja | ja |
| 37 | `rechnung.editor.servicePeriodDisplay.label` | ja | ja | ja | G | ja | ja |
| 38 | `rechnung.editor.servicePeriod` | ja | ja | ja | G | ja | ja |
| 39 | `rechnung.editor.servicePeriodToggle` | ja | ja | ja | G | ja | ja |
| 40 | `rechnung.editor.servicePeriodType` | ja | ja | ja | G | ja | ja |
| 41 | `rechnung.editor.serviceDate` | ja | ja | ja | G | ja | ja |
| 42 | `rechnung.editor.serviceMonth` | ja | ja | ja | G | ja | ja |
| 43 | `rechnung.editor.serviceStart` | ja | ja | ja | G | ja | ja |
| 44 | `rechnung.editor.serviceEnd` | ja | ja | ja | G | ja | ja |
| 45 | `rechnung.editor.reference` | ja | ja | ja | G | ja | ja |
| 46 | `rechnung.editor.constructionProject` | ja | ja | ja | G | ja | ja |
| 47 | `rechnung.editor.introText` | ja | ja | ja | T | ja | ja |
| 48 | `rechnung.editor.positions` | ja | ja | ja | G | ja | ja |
| 49 | `rechnung.editor.positions.total` | ja | ja | ja | G | ja | ja |
| 50 | `rechnung.editor.positions.total.label` | ja | ja | ja | G | ja | ja |
| 51 | `rechnung.editor.invoiceVat.label` | ja | ja | ja | G | ja | ja |
| 52 | `rechnung.editor.invoiceTotal.label` | ja | ja | ja | G | ja | ja |
| 53 | `rechnung.editor.positions.list` | ja | ja | ja | G | ja | ja |
| 54 | `rechnung.editor.positionEditor` | ja | ja | ja | G | ja | ja |
| 55 | `rechnung.editor.positionEditor.title.label` | ja | ja | ja | G | ja | ja |
| 56 | `rechnung.editor.editArea` | ja | ja | ja | G | ja | ja |
| 57 | `rechnung.editor.editCanvas` | ja | ja | ja | G | ja | ja |
| 58 | `rechnung.editor.positionType` | ja | ja | ja | G | ja | ja |
| 59 | `rechnung.editor.positionShort` | ja | ja | ja | G | ja | ja |
| 60 | `rechnung.editor.positionShortRemaining` | ja | ja | ja | G | ja | ja |
| 61 | `rechnung.editor.positionLong` | ja | ja | ja | T | ja | ja |
| 62 | `rechnung.editor.positionLongRemaining` | ja | ja | ja | G | ja | ja |
| 63 | `rechnung.editor.positionQuantity` | ja | ja | ja | G | ja | ja |
| 64 | `rechnung.editor.positionUnit` | ja | ja | ja | G | ja | ja |
| 65 | `rechnung.editor.positionPrice` | ja | ja | ja | G | ja | ja |
| 66 | `rechnung.editor.positionVatRate` | ja | ja | ja | G | ja | ja |
| 67 | `rechnung.editor.positionPriceGross` | ja | ja | ja | G | ja | ja |
| 68 | `rechnung.editor.positionNep` | ja | ja | ja | G | ja | ja |
| 69 | `rechnung.editor.positionActions` | ja | ja | ja | G | ja | ja |
| 70 | `rechnung.editor.positionCreateTitle` | ja | ja | ja | G | ja | ja |
| 71 | `rechnung.editor.positionCreate` | ja | ja | ja | G | ja | ja |
| 72 | `rechnung.editor.positionMove` | ja | ja | ja | G | ja | ja |
| 73 | `rechnung.editor.positionDelete` | ja | ja | ja | G | ja | ja |
| 74 | `rechnung.editor.positionMoveRoot` | ja | ja | ja | G | ja | ja |
| 75 | `rechnung.editor.payment` | ja | ja | ja | G | ja | ja |
| 76 | `rechnung.editor.issuerFooter` | ja | ja | ja | G | ja | ja |
| 77 | `rechnung.editor.paymentTermDays` | ja | ja | ja | G | ja | ja |
| 78 | `rechnung.editor.dueDate` | ja | ja | ja | G | ja | ja |
| 79 | `rechnung.editor.invoiceVat` | ja | ja | ja | G | ja | ja |
| 80 | `rechnung.editor.invoiceTotal` | ja | ja | ja | G | ja | ja |
| 81 | `rechnung.editor.paymentText` | ja | ja | ja | G | ja | ja |
| 82 | `rechnung.editor.validation` | ja | ja | ja | G | ja | ja |
| 83 | `rechnung.editor.footer` | ja | ja | ja | G | ja | ja |
| 84 | `rechnung.editor.footer.label` | ja | ja | ja | G | ja | ja |
| 85 | `rechnung.editor.preview` | ja | ja | ja | G | ja | ja |
| 86 | `rechnung.editor.book` | ja | ja | ja | G | ja | ja |
| 87 | `rechnung.editor.delete` | ja | ja | ja | G | ja | ja |
| 88 | `rechnung.editor.close` | ja | ja | ja | G | ja | ja |
| 89 | `rechnung.preview` | ja | ja | ja | G | ja | ja |
| 90 | `rechnung.preview.title` | ja | ja | ja | G | ja | ja |
| 91 | `rechnung.preview.body` | ja | ja | ja | G | ja | ja |
| 92 | `rechnung.preview.close` | ja | ja | ja | G | ja | ja |
| 93 | `rechnung.editor.source.label` | ja | ja | ja | G | ja | ja |
| 94 | `rechnung.editor.documentType.label` | ja | ja | ja | G | ja | ja |
| 95 | `rechnung.editor.installmentNumber.label` | ja | ja | ja | G | ja | ja |
| 96 | `rechnung.editor.invoiceNumber.label` | ja | ja | ja | G | ja | ja |
| 97 | `rechnung.editor.project.label` | ja | ja | ja | G | ja | ja |
| 98 | `rechnung.editor.invoiceDate.label` | ja | ja | ja | G | ja | ja |
| 99 | `rechnung.editor.servicePeriodType.label` | ja | ja | ja | G | ja | ja |
| 100 | `rechnung.editor.serviceDate.label` | ja | ja | ja | G | ja | ja |
| 101 | `rechnung.editor.serviceMonth.label` | ja | ja | ja | G | ja | ja |
| 102 | `rechnung.editor.serviceStart.label` | ja | ja | ja | G | ja | ja |
| 103 | `rechnung.editor.serviceEnd.label` | ja | ja | ja | G | ja | ja |
| 104 | `rechnung.editor.reference.label` | ja | ja | ja | G | ja | ja |
| 105 | `rechnung.editor.constructionProject.label` | ja | ja | ja | G | ja | ja |
| 106 | `rechnung.editor.introText.label` | ja | ja | ja | G | ja | ja |
| 107 | `rechnung.editor.positionType.label` | ja | ja | ja | G | ja | ja |
| 108 | `rechnung.editor.positionShort.label` | ja | ja | ja | G | ja | ja |
| 109 | `rechnung.editor.positionLong.label` | ja | ja | ja | G | ja | ja |
| 110 | `rechnung.editor.positionQuantity.label` | ja | ja | ja | G | ja | ja |
| 111 | `rechnung.editor.positionUnit.label` | ja | ja | ja | G | ja | ja |
| 112 | `rechnung.editor.positionPrice.label` | ja | ja | ja | G | ja | ja |
| 113 | `rechnung.editor.positionVatRate.label` | ja | ja | ja | G | ja | ja |
| 114 | `rechnung.editor.positionPriceGross.label` | ja | ja | ja | G | ja | ja |
| 115 | `rechnung.editor.positionNep.label` | ja | ja | ja | G | ja | ja |
| 116 | `rechnung.editor.paymentTermDays.label` | ja | ja | ja | G | ja | ja |
| 117 | `rechnung.editor.dueDate.label` | ja | ja | ja | G | ja | ja |

## Prüfungen

- `node scripts/tests/rechnungUiEditorUnbounded.test.cjs`
- `node scripts/tests/m86-15UniversalEditorContract.test.cjs`
- `node scripts/tests/m86-14GlobalLayoutRestore.test.cjs`
- `node scripts/tests/m86-9ProtokollMetaTargetContract.test.cjs`
- `node scripts/tests/m86-10ProtokollOriginalThreeColumnContract.test.cjs`
- isoliert sichtbarer Rechnungslauf mit `scripts/tests/m86-24VisibleEditorAcceptance.test.cjs`
- `node scripts/ui-editor-contract-check.cjs --self-test` und Dateicheck
- `npx eslint` für alle geänderten produktiven JavaScript-Dateien und den neuen fokussierten Test
- `git diff --check`

Der breite Repositorytest und der globale Lintlauf besitzen vorbestehende rote Befunde außerhalb dieses Pakets. Insbesondere bleiben der Schutz-Hash von `docs/licensing.md`, bestehende HomeView-/PDF-Golden-/Testharness-Verträge und unabhängige Lintfehler rot. Durch das Paket aufgedeckte Nullgeometrie-Regressionen in Protokoll wurden korrigiert und gezielt erneut grün geprüft.
