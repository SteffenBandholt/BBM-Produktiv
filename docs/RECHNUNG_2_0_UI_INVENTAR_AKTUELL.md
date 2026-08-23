# Rechnung 2.0 – aktuelles UI-Inventar

Stand: 23.08.2026
Branch: `rechnung-entwicklung`

## 1. Zweck und Verbindlichkeit

Dieses Dokument hält den aktuellen UI-Bestand des Rechnungsmoduls fest und dient als Arbeitsgrundlage für weitere UI-Arbeiten und Codex-Aufträge.

Für die tatsächliche Editor-Registrierung ist der aktuelle Codevertrag
`src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js` maßgeblich.
Ältere Entwicklungsnotizen in `docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md` bleiben Historie, soweit sie nicht dem aktuellen Codevertrag widersprechen.

Es werden mit diesem Inventar keine Fachlogik, keine Berechnung, keine Persistenz, keine Buchung, keine PDF-Ausgabe und keine ZUGFeRD-Logik geändert.

## 2. Führender UI-Stand

### Produktiver Arbeitsstand

Der führende Stand ist:

- `src/renderer/modules/rechnungen/screens/RechnungScreen.js`
- darin der aktive `_sheetEditor()`
- Editor-Scope: `rechnung.screen`
- Komponenten-ID: `bbm.rechnung.screen`

Das Modul routet `rechnungWork` ausschließlich auf `RechnungScreen`.

Der echte Screen besteht aus drei Arbeitsansichten:

1. Rechnungsübersicht
2. Rechnungsblatt / Bearbeitung
3. Proberechnung / Entwurfsvorschau

### Nicht führend

`RechnungenDesignScreen` ist die historische statische Designreferenz. Sie ist keine zweite produktive Rechnungserstellung und nicht Bestandteil des Rechnung-Editorvertrags.

`_legacyFormEditor()` ist noch in `RechnungScreen.js` vorhanden, wird aber vom aktiven `_editor()` nicht verwendet. `_editor()` liefert ausschließlich `_sheetEditor()` zurück.

## 3. Aktueller UI-Editor-Vertrag

Der aktuelle Vertrag enthält 81 explizite Ziele.

Grundregel des M83-Vertrags:

- jedes sichtbare registrierte Ziel: verschieben, Breite ändern, Höhe ändern, Sichtbarkeit ändern
- sichtbare Text-/Feld-/Button-Ziele zusätzlich: Schriftgröße ändern
- Fachbuttons bleiben in ihrer Fachfunktion gesperrt
- gesperrte Fachoperationen: `executeTargetAction`, `modifyDomainData`, `createRecord`, `deleteRecord`

Der Editor verändert damit Layout und Darstellung, nicht die fachliche Bedeutung oder die Daten.

## 4. Vollständige Zielgruppen

### A. Scope und Hauptinhalt

- `rechnung.screen`
- `rechnung.screen.content`

### B. Rechnungsübersicht

- `rechnung.overview`
- `rechnung.overview.header`
- `rechnung.overview.title`
- `rechnung.overview.subtitle`
- `rechnung.overview.new`
- `rechnung.overview.list`

Die einzelnen dynamischen Rechnungskarten innerhalb der Liste sind bewusst keine eigenen Editor-Ziele.

### C. Rechnungsblatt – Grundgerüst und feste Zonen

- `rechnung.editor`
- `rechnung.editor.header`
- `rechnung.editor.headerCanvas`
- `rechnung.editor.title`
- `rechnung.editor.status`
- `rechnung.editor.headToggle`
- `rechnung.editor.body`
- `rechnung.editor.sheetArea`
- `rechnung.editor.sheetCanvas`
- `rechnung.editor.editArea`
- `rechnung.editor.editCanvas`
- `rechnung.editor.validation`
- `rechnung.editor.footer`

Die feste Positions-Editbox bleibt außerhalb des Rechnungsblatts als eigener Arbeitsbereich.

### D. Rechnungsgrunddaten

- `rechnung.editor.basic`
- `rechnung.editor.source`
- `rechnung.editor.documentType`
- `rechnung.editor.installmentNumber`
- `rechnung.editor.invoiceNumber`
- `rechnung.editor.customerPicker`
- `rechnung.editor.project`
- `rechnung.editor.invoiceDate`

Die eigentliche Kundenauswahl wird im aktiven Blatt kontextbezogen eingeblendet; der sichtbare Einstieg ist der registrierte `customerPicker`.

### E. Empfänger, Aussteller und Rechnungsdatenblock

- `rechnung.editor.parties`
- `rechnung.editor.customerAddress`
- `rechnung.editor.issuerBlock`
- `rechnung.editor.issuerName1`
- `rechnung.editor.issuerName2`
- `rechnung.editor.issuerStreet`
- `rechnung.editor.issuerCity`
- `rechnung.editor.invoiceMetaBlock`
- `rechnung.editor.invoiceDateDisplay`
- `rechnung.editor.servicePeriodDisplay`
- `rechnung.editor.issuerFooter`

Damit sind insbesondere die sichtbaren Ausstellerzeilen einzeln editorfähig, ohne die zugrunde liegenden Stammdaten editorfähig zu machen.

### F. Leistungszeitraum und Rechnungsbezug

- `rechnung.editor.servicePeriod`
- `rechnung.editor.servicePeriodToggle`
- `rechnung.editor.servicePeriodType`
- `rechnung.editor.serviceDate`
- `rechnung.editor.serviceMonth`
- `rechnung.editor.serviceStart`
- `rechnung.editor.serviceEnd`
- `rechnung.editor.reference`
- `rechnung.editor.constructionProject`
- `rechnung.editor.introText`

### G. Bau-LV

- `rechnung.editor.positions`
- `rechnung.editor.positions.list`
- `rechnung.editor.positions.total`

Die dynamischen LV-Zeilen, Positionsnummern, Preis-Kopfzeile und Einrückungen sind bewusst keine einzelnen Editor-Ziele. `rechnung.editor.positions.list` ist der gemeinsame Layoutbereich für die datensatzabhängige LV-Darstellung.

### H. Feste Positions-Editbox

- `rechnung.editor.positionEditor`
- `rechnung.editor.positionType`
- `rechnung.editor.positionShort`
- `rechnung.editor.positionShortRemaining`
- `rechnung.editor.positionLong`
- `rechnung.editor.positionLongRemaining`
- `rechnung.editor.positionQuantity`
- `rechnung.editor.positionUnit`
- `rechnung.editor.positionPrice`
- `rechnung.editor.positionVatRate`
- `rechnung.editor.positionPriceGross`
- `rechnung.editor.positionNep`
- `rechnung.editor.positionActions`
- `rechnung.editor.positionCreateTitle`
- `rechnung.editor.positionCreate`
- `rechnung.editor.positionMove`
- `rechnung.editor.positionDelete`

Die Fachaktionen der Buttons bleiben trotz Editor-Registrierung gesperrt.

### I. Summen und Zahlung

- `rechnung.editor.payment`
- `rechnung.editor.paymentTermDays`
- `rechnung.editor.dueDate`
- `rechnung.editor.positions.total`

MwSt.- und Bruttosumme sind sichtbar, aber nach der bestehenden Entscheidung bewusst datensatzabhängige Anzeigewerte ohne eigene Editor-IDs. Gleiches gilt derzeit für den abgeleiteten Zahlungstext. Das ist keine versehentliche Registrierungslücke und wird ohne neue Entscheidung nicht verändert.

### J. Anwendungsaktionen

- `rechnung.editor.preview`
- `rechnung.editor.book`
- `rechnung.editor.delete`
- `rechnung.editor.close`

Ein manueller Speichern-Button ist im aktiven Rechnungsblatt bewusst entfallen; DRAFT-Änderungen werden automatisch gespeichert.

### K. Proberechnung / Vorschau

- `rechnung.preview`
- `rechnung.preview.title`
- `rechnung.preview.body`
- `rechnung.preview.close`

Die Proberechnung ist eine UI-Vorschau und keine PDF-Ausgabe.

## 5. Sichtbare Elemente ohne eigene Editor-ID – Bewertung

Folgende sichtbare Elemente besitzen bewusst oder derzeit keine eigene Editor-ID:

- dynamische Rechnungskarten und deren Inhalte in der Übersicht
- dynamische LV-Zeilen, Positionsnummern, Preis-Kopfzeile und Einrückungen
- MwSt.-Summenwert
- Brutto-Summenwert
- Beschriftungen der Summenzeilen
- abgeleiteter Zahlungstext
- Überschrift `Position bearbeiten`
- kontextabhängiger Button `Auf Ebene 0 verschieben`
- mehrere rein strukturelle Wrapper im Rechnungsblatt

Bewertung:

- Dynamische Fachinhalte bleiben zu Recht über ihren registrierten Container steuerbar.
- MwSt./Brutto sind ausdrücklich als nicht einzeln editorfähige, abgeleitete Werte festgelegt.
- Rein strukturelle Wrapper benötigen nicht automatisch eine eigene ID.
- `Position bearbeiten` und `Auf Ebene 0 verschieben` sind derzeit keine dringenden Lücken; eine Registrierung wäre nur erforderlich, wenn für diese beiden sichtbaren Elemente tatsächlich eine eigene Layoutsteuerung benötigt wird.

## 6. Gefundene Bestandsunsauberkeiten

### 6.1 Historische Dokumentation enthält ältere Vertragsstände

`docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md` dokumentiert die Entwicklung über mehrere Zwischenstände hinweg. Darin stehen unter anderem ältere Zielzahlen, frühere Parent-Strukturen und frühere Komponentenbezeichnungen.

Folgerung:

- für die aktuelle 81-Ziele-Struktur gilt ausschließlich `RechnungScreen.uiEditorContract.js` als technische Wahrheit
- die Entwurfsentscheidung bleibt Änderungsverlauf und darf nicht ungeprüft als aktuelles Inventar verwendet werden

### 6.2 Dormanter Legacy-Editor liegt noch im produktiven Screen-Code

`_legacyFormEditor()` verwendet teilweise dieselben Editor-IDs wie der aktive `_sheetEditor()`, ist aktuell aber nicht aufgerufen.

Das ist im Ist-Zustand kein Laufzeitfehler, aber ein Wartungsrisiko. Der Legacy-Editor darf nicht versehentlich wieder aktiviert oder als zweite Rechnungs-UI weiterentwickelt werden.

Eine Entfernung erfolgt nicht im Rahmen dieses Inventars, weil damit bestehender Code verändert würde. Vor einer späteren Bereinigung ist gesondert zu prüfen, ob noch Tests oder Referenzen darauf zugreifen.

## 7. Ergebnis für die weitere Entwicklung

### Verbindlich weiterverfolgen

- `RechnungScreen`
- aktiver `_sheetEditor()`
- Scope `rechnung.screen`
- aktueller 81-Ziele-Vertrag
- Übersicht + Rechnungsblatt + Vorschau als zusammengehörige Arbeitsoberflächen

### Nur Referenz / nicht weiterentwickeln

- `RechnungenDesignScreen` als historische Designreferenz
- `_legacyFormEditor()` als dormanter Altbestand

### Nicht ohne neue fachliche Entscheidung ändern

- fehlende Einzel-IDs für dynamische LV-Inhalte
- fehlende Einzel-IDs für MwSt.- und Bruttosumme
- Fachaktionssperren
- automatische DRAFT-Speicherung
- Trennung zwischen UI-Vorschau und späterer PDF-Ausgabe

## 8. Nächster sinnvoller Arbeitsschritt

Vor weiterer Fachentwicklung sollte nicht eine neue Rechnungs-UI gebaut werden.

Der nächste UI-Arbeitsschritt soll ausschließlich auf dem aktuellen `RechnungScreen` aufsetzen und nur nach konkret festgestelltem Gestaltungsbedarf zusätzliche Editor-Ziele ergänzen.

Für Codex gilt dabei:

1. `RechnungScreen` und seinen 81-Ziele-Vertrag als führenden Stand verwenden.
2. `RechnungenDesignScreen` nicht in einen zweiten produktiven Weg ausbauen.
3. `_legacyFormEditor()` nicht weiterentwickeln.
4. keine Fachlogik bei reinen UI-/Editorarbeiten verändern.
5. keine neuen Editor-IDs für dynamische oder abgeleitete Fachinhalte anlegen, solange dies nicht ausdrücklich beschlossen wurde.
