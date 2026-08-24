# Rechnung: Entgrenzung aller 117 UI-Editor-Ziele

Stand: 24.08.2026, Branch `rechnung-integration`, noch nicht committed oder gepusht.

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
