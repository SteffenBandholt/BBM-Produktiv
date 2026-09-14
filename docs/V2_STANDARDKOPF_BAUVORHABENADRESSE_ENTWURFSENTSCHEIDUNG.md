# UI-/PDF-Entwurfsentscheidung: Bauvorhabenadresse im V2-Standardkopf

Stand: 2026-09-14

## Auftrag und Grenze

Der vorhandene Benutzer-/Firmenadressinhalt im gemeinsamen Standardzweig von
`FullHeader.js` wird vollständig durch die Bauvorhabenadresse aus
`data.project` ersetzt. Der bestehende FullHeader-Slot für Rechnungen und
Provider-Inhalte bleibt unverändert. Ebenso unverändert bleiben Logo,
Trennlinien, Seitenzähler, Kopfgeometrie sowie die gleichlautenden
Abschlussplatzhalter in `PrintShell.js` und `printApp.js`.

## A. Art der Ausgabe

- Art: PDF
- UI: keine Änderung
- PDF: datengetriebener Inhaltsaustausch im vorhandenen Standard-FullHeader

## B. Editorfähigkeit

- Editorfähig: ja, ausschließlich im Umfang der bereits registrierten
  Protokoll-PDF-Ziele.
- Die Projektadresswerte selbst sind nicht editorfähig. Sie sind Fachdaten aus
  `data.project` und werden nicht als frei editierbarer Text registriert.
- Restarbeiten verwendet denselben DOM-Kopf, besitzt laut
  `PDF_SATZVERTRAG_V2.md` aber weiterhin keine eigene PDF-Registry. Dieses Paket
  führt keine Restarbeiten-Registry ein.

## C. Bestehende editorfähige Elemente

Die Laufzeitattribute werden weiterhin durch `pdfEditorLayout.js` aus der
bestehenden Registry in `bbmPdfAdapter.cjs` gesetzt. Das Paket ergänzt weder
Registryeinträge noch Operationen.

| id / `data-ui-inspector-id` | name / `data-ui-editor-label` | type / `data-ui-editor-kind` | role | parentId / `data-ui-editor-parent` | order | visible | editable / `data-ui-editor-editable` | allowedOps / `data-ui-editor-ops` |
|---|---|---|---|---|---:|---|---|---|
| `pdf.bbm.protocol.header` | `Seitenkopf` | `header` | `layout` | `pdf.bbm.protocol.page-template` | 20 | ja | ja | `resizeHeight,setVisibility` |
| `pdf.bbm.protocol.header.meta` | `Kopfmetadaten` | `group` | `meta` | `pdf.bbm.protocol.header` | 60 | ja | ja | `move,resizeWidth,resizeHeight` |
| `pdf.bbm.protocol.header.meta.page-label` | `Seite · Bezeichnung` | `label` | `fieldLabel` | `pdf.bbm.protocol.header.meta` | 61 | ja | ja | `move,resizeWidth,textResize,setTextAlignment,setVisibility` |
| `pdf.bbm.protocol.header.meta.page-value` | `Seite · Wert` | `value` | `meta` | `pdf.bbm.protocol.header.meta` | 62 | ja | ja | `move,resizeWidth,textResize,setTextAlignment,setVisibility` |

Das tatsächliche Rendererziel von `pdf.bbm.protocol.header.meta` ist
`.v2HeaderRight,.v2MiniRight`. Der bereits vorhandene Adresscontainer
`.v2UserBox` liegt im FullHeader innerhalb von `.v2HeaderRight`, ist aber kein
eigenes Registry- oder Editorziel. Die beiden Seitenzählerziele werden über
`.v2MiniPageLabel` und `.v2MiniPageValue` markiert.

## D. Nicht editorfähige Elemente und verbotene Editor-Ziele

- `street`, `zip` und `city` sowie die daraus gebildeten Adresszeilen
- frei editierbarer Adresstext oder Adressplatzhalter
- Fachaktionen und fachliches Speichern, Anlegen oder Löschen
- Upload, Import, Export und Autosave
- fachliche IPC-, Datenbank- und sonstige Datenaktionen
- Seitenzuweisung, Paginierung, Datensatzteilung und Umbruchregeln
- Logo, Trennlinien, Kopfart, Blockreihenfolge und neue Layout-Elemente

Für die vorhandenen Ziele bleiben sämtliche nicht in `allowedOps` genannten
Layoutoperationen sowie `changeText`, `changeValue`, `modifyDomainData`,
`createRecord`, `deleteRecord`, `saveDomainData`, `upload`, `import`, `export`,
`autosave`, `executeTargetAction` und `setPageBreakRule` gesperrt.

## E. Parent- und Strukturregel

Die vorhandene Parent-Kette bleibt unverändert und vollständig:

`pdf.bbm.protocol` → `pdf.bbm.protocol.page-template` →
`pdf.bbm.protocol.header` → `pdf.bbm.protocol.header.meta` →
`pdf.bbm.protocol.header.meta.page-label` beziehungsweise
`pdf.bbm.protocol.header.meta.page-value`.

Die Projektadresse bleibt nicht registrierter Fachinhalt innerhalb des real
existierenden Parent-Ziels `pdf.bbm.protocol.header.meta`. Es wird kein Parent
geraten und kein neues Ziel angelegt.

## F. Prüfung und Guardrails

Betroffene bestehende Vertrags-IDs:

- `PDF-V2-SATZ-002`: Reihenfolge und vorhandener Standard-FullHeader bleiben.
- `PDF-V2-SATZ-004`: Seitenzähler und seine Position bleiben.
- `PDF-V2-SATZ-014`: der rechte Kopfbereich bleibt innerhalb der Nutzfläche.
- `PDF-V2-SATZ-015`: Vorschau, Vorabzug und Produkt-PDF verwenden denselben Kopf.
- `PDF-V2-REST-003`: Mess- und End-DOM der Restarbeiten verwenden denselben Kopf.

Der neue Inhaltsvertrag wird als `PDF-V2-SATZ-016` dokumentiert und durch einen
gezielten Electron-DOM-Guardrail abgesichert: Der Standard-FullHeader zeigt nur
die normalisierten Projektadresszeilen; bei fehlender Adresse bleibt der
vorhandene Bereich leer. Profil-/Einstellungsdaten und Ersatztexte sind keine
Fallbackquelle. Der Rechnungs-FullHeader-Slot bleibt von diesem Vertrag
ausgenommen.

Zusätzlich laufen die 49 vorhandenen strukturellen Golden-Fixtures. Seitenzahl
und vollständiger Strukturhash werden verglichen. Reale Protokoll- und
Restarbeiten-PDFs werden für vollständige, teilweise und vollständig fehlende
Adresse sowie eine lange Straße erzeugt, vollständig gerendert und visuell auf
Überlappungen beziehungsweise Verschiebungen geprüft. Der vorhandene
UI-Editor-Vertragscheck bleibt verbindlich.

## Festgelegte Darstellung

- Zeile 1: normalisiertes `data.project.street`, einschließlich der darin
  enthaltenen Hausnummer.
- Zeile 2: normalisiertes `data.project.zip` und `data.project.city`, mit genau
  einem Leerzeichen verbunden.
- Leere Bestandteile und vollständig leere Zeilen werden nicht ausgegeben.
- Fehlt `data.project` oder die gesamte Adresse, bleibt `.v2UserBox` leer.
- Keine Überschrift und kein Ersatztext.
- Die bestehende Typografie, Ausrichtung, Containerbreite und Kopfgeometrie
  bleiben erhalten. Für lange Straßen ist ausschließlich ein Wortumbruch
  innerhalb der vorhandenen Straßenzeile erlaubt; dadurch entstehen keine
  neuen Layout- oder Editorziele.

## Abschlussnachweis

### Adressbezogene Prüfungen (bestanden)

- `npm run test:v2:standard-header-address`: grün für `PDF-V2-SATZ-002`,
  `PDF-V2-SATZ-015`, `PDF-V2-SATZ-016` und `PDF-V2-REST-003`.
- Adressfälle: vollständig, teilweise, leer, fehlendes `data.project` und lange
  Straße; geprüft in Protokoll und befüllten Restarbeiten.
- Standardausgaben: Protokoll, Preview, Vorabzug, Firmenliste, ToDo-Liste,
  TOP-Liste und Restarbeiten übernehmen denselben Projektadresskopf.
- Zwölf echte PDFs wurden gerendert und visuell ohne Adressüberlauf,
  Überlappung oder Verschiebung der übrigen Kopfelemente geprüft.
- Der kontrollierte Vergleich aller 49 Fixtures zeigt identische Seitenzahlen
  und Strukturhashes; Golden-Referenzen bleiben unverändert.

### Bekannte Blocker der M85-Gesamtsuite (außerhalb des Pakets)

- Restarbeiten-Golden `r19-empty`: abweichender Referenzhash.
- Restarbeiten-Spaltenzahl: Ist 9, erwartet 13.
- Registryzahl: Ist 37, erwartet 35.
- Profilpfad-Guard `PDF-V2-ARCH-003`: rot.

Diese bereits im Ausgangsstand vorhandenen Abweichungen sind nicht Bestandteil
des Adresspakets. Sie wurden weder repariert noch durch Referenzänderungen
verdeckt; identische Blockerprüfungen wurden im Abschlusslauf nicht wiederholt.
