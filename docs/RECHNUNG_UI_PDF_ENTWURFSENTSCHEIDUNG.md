# Rechnungsscreen – UI-/PDF-Entwurfsentscheidung

Stand: 15.08.2026
Scope: `rechnung.screen`
Komponente: `bbm.rechnung.screen`

Diese Entscheidung gilt für den echten `RechnungScreen`. Die historische
statische Designreferenz `RechnungenDesignScreen` ist nicht Gegenstand dieses
Editorvertrags.

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

Alle 45 Elemente sind sichtbar und besitzen:

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
| `rechnung.editor.issuerAddress` | Rechnungssteller | `label` | `content` | `rechnung.editor.parties` | 52 | T / – | `componentKind: label` |
| `rechnung.editor.servicePeriod` | Leistungszeitpunkt | `group` | `layout` | `rechnung.editor.body` | 60 | G / – | `componentKind: servicePeriod` |
| `rechnung.editor.servicePeriodType` | Art des Leistungszeitpunkts | `field` | `content` | `rechnung.editor.servicePeriod` | 61 | T / – | `fieldKind: select` |
| `rechnung.editor.serviceDate` | Leistungsdatum | `field` | `content` | `rechnung.editor.servicePeriod` | 62 | T / – | `fieldKind: date` |
| `rechnung.editor.serviceMonth` | Leistungsmonat | `field` | `content` | `rechnung.editor.servicePeriod` | 63 | T / – | `fieldKind: month` |
| `rechnung.editor.serviceStart` | Leistungszeitraum von | `field` | `content` | `rechnung.editor.servicePeriod` | 64 | T / – | `fieldKind: date` |
| `rechnung.editor.serviceEnd` | Leistungszeitraum bis | `field` | `content` | `rechnung.editor.servicePeriod` | 65 | T / – | `fieldKind: date` |
| `rechnung.editor.reference` | Bauvorhaben / Leistungsbezug | `field` | `content` | `rechnung.editor.body` | 70 | T / – | `fieldKind: singleLineText` |
| `rechnung.editor.payment` | Zahlungsdaten | `group` | `layout` | `rechnung.editor.body` | 80 | G / – | `componentKind: payment` |
| `rechnung.editor.paymentTermDays` | Zahlungsziel Kalendertage | `field` | `content` | `rechnung.editor.payment` | 81 | T / – | `fieldKind: integer` |
| `rechnung.editor.dueDate` | Fällig am | `field` | `content` | `rechnung.editor.payment` | 82 | T / – | `fieldKind: readOnlyDate` |
| `rechnung.editor.validation` | Validierung und Meldungen | `statusIndicator` | `status` | `rechnung.editor` | 90 | G / – | `componentKind: liveMessage` |
| `rechnung.editor.footer` | Aktionen Rechnungseditor | `group` | `layout` | `rechnung.editor` | 100 | G / – | `componentKind: actionBar` |
| `rechnung.editor.save` | Speichern | `button` | `domainActionLayout` | `rechnung.editor.footer` | 101 | T / D | `actionKind: saveDraft` |
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
- dauerhaften Rechnung-Mounted-Ref-Test mit exakt 45 Einzel-Refs
- Prüfung aller sechs `data-ui-*`-Pflichtattribute
- Parent-/Ref-Zuordnungsprüfung
- UI-Editor-Kit-Vertragscheck
- isolierte praktische Electron-Prüfung des echten Rechnungsscreens

Der Scope darf nur bei grünen Vertrags- und Runtime-Nachweisen als `complete`
veröffentlicht werden. Der globale Registrystatus bleibt wegen bewusst
blockierter, nicht inventarisierter BBM-Bereiche `incomplete`.
