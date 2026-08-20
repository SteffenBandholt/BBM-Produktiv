# PDF-Satzvertrag V2

Stand: 2026-08-17
Inventarbasis: `main` / `54a8b432f961403202cd81341f6ddd25a06c5de2`
Vertragsversion: `m85.2-v3`

## Zweck und Geltungsgrenze

Dieses Dokument beschreibt den im aktuellen BBM-Produktcode tatsächlich vorhandenen V2-PDF-Satz. Es erfindet keine Gestaltung und ersetzt weder Renderer noch Paginierung. Eine Regel ist nur dann als `fest` markiert, wenn sie im Code und durch einen reproduzierbaren Test nachgewiesen ist. Ein reproduzierbarer Fehler wird als `offen` geführt und ausdrücklich nicht zur Satzregel erklärt.

Die einzige produktive Kette für Protokoll-PDFs ist:

`PrintModal` → `print:toPdf` → `getPrintData` → `printApp` → `_paginateTops` → `PrintShell.renderPrint` → `pdfEditorLayout` → `webContents.printToPDF`.

Der Restarbeiten-Screen verwendet für `Ausgabevorschau` und `Drucken` genau den
vorhandenen produktiven Weg
`print:toPdfAndPreviewInternal` → `getPrintData` → `printApp` →
`_paginateGeneric` → `PrintShell.renderPrint` → `webContents.printToPDF` →
interne BBM-PDF-Vorschau. Die frühere HTML-Ausgabevorschau bleibt als
historische Alternative im Repository, ist aber nicht mehr der Produktweg.

## Ebenen und Eigentum

| Ebene | Quelle der Wahrheit | Verantwortung |
|---|---|---|
| Fach- und Druckdaten | `src/main/print/printData.js` | Modus, Projekt-/Besprechungskontext, Teilnehmer, TOPs, Restarbeitenzeilen, Einstellungen und Tabellenlayout laden/normalisieren. |
| Paginierung | `src/renderer/print/printApp.js` | Reale DOM-Höhen messen, Seitenkapazität bestimmen, TOPs teilen, generische Zeilen verschieben und Abschluss platzieren. |
| Rendering | `src/renderer/print/layout/PrintShell.js` plus V2-Header | Aus dem Seitenmodell das endgültige DOM mit Voll-/Mini-Kopf, Blöcken, Tabellen und Fußreserve bauen. |
| Designwerte | `src/main/ui-editor/bbmPdfAdapter.cjs`, `src/renderer/print/pdfEditorLayout.js` | Nur explizit registrierte Layoutwerte validieren, vor der Messung bereitstellen und auf das endgültige DOM anwenden. |
| PDF-Datei | `src/main/ipc/printIpc.js` | Kontrollierten Ausgabepfad bestimmen und genau einmal `webContents.printToPDF` mit A4, Hintergrundfarben, deaktiviertem Chromium-Kopf/Fuß und Null-Druckrand aufrufen. |
| Profilzustand | bestehender UI-Editor-kit-Sitzungs-/Profilweg über die dokumenttypneutrale PDF-Adapter-Registry und den registrierten Fachadapter | Save, Restore, Reset, Discard und Rollback je `layoutStorageKey`; kein eigener BBM-Zweitstore und keine Dokumenttypentscheidung im zentralen IPC. |

## Produktiver Ablauf

1. `src/renderer/modules/ausgabe/PrintModal.js` sendet Protokollmodi an
   `window.bbmPrint.printPdf`. Der Restarbeiten-Screen baut aus seiner bereits
   sichtbaren Filterfolge einen expliziten `mode=restarbeiten`-Payload und ruft
   `window.bbmPrint.printPdfAndPreviewInternal` auf.
2. `src/main/ipc/printIpc.js` prüft die Featurefreigabe, normalisiert Modus/Ausrichtung und ruft `getPrintData` auf.
3. `src/main/print/printData.js` lädt und normalisiert die Druckdaten. Restarbeitenzeilen werden beim Modus `restarbeiten` ausschließlich aus dem expliziten Payload übernommen.
4. `printApp.handleInit` ruft `prepareBbmPdfEditorLayout` auf. Dadurch fließen freigegebene Seitenränder und TOP-Spaltenbreiten in dieselbe Messung ein.
5. `_buildPages` erzeugt normalisierte TOP- oder Listenzeilen und verzweigt zu `_paginateTops` beziehungsweise `_paginateGeneric`.
6. `_createMeasureContext` baut ein unsichtbares echtes DOM, wendet CSS und Editorlayout an und liest `getBoundingClientRect` sowie `getComputedStyle` aus.
7. Der Pager erzeugt das Seitenmodell. `PrintShell.renderPrint` baut daraus das endgültige DOM.
8. `applyBbmPdfEditorLayout` wendet dieselben freigegebenen Werte auf das End-DOM an. Der Editor weist keinem Datensatz eine Seite zu und teilt keinen Datensatz selbst.
9. `print:ready` liefert Metadaten; `printIpc` ruft `webContents.printToPDF` auf und schreibt nur in den kontrolliert ermittelten Pfad.

## Vollständiges Bestandsinventar

| Datei/Bereich | Klassifikation | Rolle und Einfluss |
|---|---|---|
| `src/shared/print/printModes.mjs` | produktiv, Quelle | Kanonische Druckmodi; kein Umbruch oder Fachinhalt. |
| `src/renderer/modules/ausgabe/PrintModal.js` | produktiv, Aufrufer | Startet Protokoll-/Listen-PDFs und interne Vorschau; keine Satzentscheidung. Enthält außerdem ältere Darstellungshelfer, die nicht die V2-Paginierungsquelle sind. |
| `src/renderer/ui/PrintModal.js` | produktiver Kompatibilitätsadapter | Reexportiert den modularen `PrintModal`; keine zweite Engine. |
| `src/main/preload.js` | produktiver Adapter | Exponiert `print:openHtmlPreview`, `print:toPdf`, interne/externe Vorschau. |
| `src/main/ipc/printIpc.js` | produktiv, Quelle für Ausgabe | Kontrollierter Pfad, Fensterlebenszyklus, Vorschauvarianten, ein `printToPDF`-Aufruf. Beeinflusst Ausgabeformat, nicht Seiteneinteilung. |
| `src/main/print/printOrientation.js` | produktiv, Quelle | A4, Hoch-/Querformat, Hintergrundfarben, keine Chromium-Kopf-/Fußzeile, Null-Druckrand. |
| `src/main/print/printData.js` | produktiv, Quelle für Druckdaten | Normalisierung, Reihenfolge und mode-spezifische Inhalte; baut zentrale V2-Layoutwerte. |
| `src/main/print/printWindow.js` | produktiv, Adapter | Verstecktes dediziertes Print-Fenster und Print-URL. |
| `src/main/preload/printPreload.js` | produktiv, Adapter | Kleine IPC-Brücke für das Print-Fenster. |
| `src/main/print/printPreload.js` | historisch/ungenutzt | Ältere zweite Preload-Datei; `printWindow.js` verweist nicht darauf. Keine Quelle. |
| `src/renderer/print/index.html` | produktiv, Einstieg | Lädt `print.css`, Header-Test-CSS, `v2.css` und `printApp.js`. |
| `src/renderer/print/printApp.js` | produktiv, Paginierungsquelle | Zeilenbau, reale Messung, Teilnehmer-/Vorbemerkungsplanung, TOP- und generische Paginierung, Abschlussverschiebung. |
| `src/renderer/print/layout/PrintShell.js` | produktiv, Renderingquelle | Endgültiges Seiten-DOM, Voll-/Mini-Kopf, Tabellenkopf je Seitentabelle, Teilnehmer, Vorbemerkung, Abschluss und Fußreserve. |
| `src/renderer/print/print.css` | produktiv, Design-/Messquelle | A4-Seitenbox, Tabellen-, TOP-, Restarbeiten- und Textgeometrie. Beeinflusst Messung und Umbruch. |
| `src/renderer/print/v2/v2.css` | produktiv, Design-/Messquelle | V2-Kopf, Teilnehmer, Vorbemerkung, Abschluss, Fußreserve und Farbtreue. |
| `src/renderer/print/v2/v2LayoutConfig.js` | produktiv, zentrale Baseline | Kopf- und Abstandsbaselines; keine Engine. |
| `src/renderer/print/v2/header/GlobalHeader.js` | produktiv, Renderer | Logos und erste Trennlinie nur auf Seite 1. |
| `src/renderer/print/v2/header/FullHeader.js` | produktiv, Renderer | Projekt, Dokumenttitel, Listenstand und Nutzerblock auf Seite 1. Protokoll, Vorschau und Vorabzug zeigen zusätzlich denselben sichtbaren Seitenzähler wie der MiniHeader. |
| `src/renderer/print/v2/header/MiniHeader.js` | produktiv, Renderer | Projekt, Dokumenttitel und sichtbarer Zähler `Seite n / gesamt` ab Seite 2. |
| `src/renderer/print/v2/header/headerUtils.js` | produktiv, Adapter | Gemeinsame Texte/Normalisierung für V2-Köpfe. |
| `src/shared/tableLayouts/protokollTopsLayout.js` | produktiv, Quelle für TOP-Spalten | Drei logische TOP-Spalten, Labels, UI-/PDF-Standardwerte und validierte Overlays. |
| `src/shared/ampel/pdfAmpelRule.js` | produktiv, Fachdarstellung | Ermittelt Ampelfarbe aus bereits gelieferten Fachwerten; der Editor ändert diese Werte nicht. |
| `src/renderer/print/pdfEditorLayout.js` | produktiv, dokumenttypneutraler Designadapter | Überführt die aktive explizite Registry in V2-Variablen/DOM-Styles und liest Vorschaugrenzen zurück. Keine Dokumenttypentscheidung und keine Seitenzuweisung. |
| `src/main/ui-editor/bbmPdfAdapter.cjs` | produktiv, Registry-/Adapterquelle | Explizite 37 Elemente, Baselines, Nutzflächen-/Bereichsgrenzen, atomare Tabellenoperationen, Rollback und Neuerzeugung. Keine Paginierung. |
| `src/main/ui-editor/restarbeitenPdfAdapter.cjs` | produktiv, Restarbeiten-Descriptor/Registrar | Explizite 20 Elemente einschließlich 9 sichtbarer Spalten und einer gemeinsamen Darstellungsoption, A4-Querformat, Grenzen, Profilkey und Regenerationsrequest. Keine Paginierung. |
| `src/main/ui-editor/pdfDocumentTypeRegistry.cjs` | produktiv, dokumenttypneutraler Vertragsspeicher | Persistiert akzeptierte Descriptor-Snapshots sowie aktive/inaktive Element-IDs, vergleicht neue/fehlende/wiederkehrende/inkompatible Elemente und archiviert vor Synchronisation. Keine Layoutwerte. |
| `src/main/ui-editor/declarativePdfAdapter.cjs` | produktiv, dokumenttypneutraler Adapter | Stellt die aktuell aktive Registry, Layoutzustand, werterhaltende Profilmigration, Spaltengrenzen und Regeneration bereit. Inaktive Profilwerte bleiben in einer registryfreien PDF-Profilhistorie neben dem strikt aktiven Hauptprofil erhalten. Keine BBM-Fachtypen. |
| `src/main/ipc/uiEditorIpc.js` | produktiv, Adapter | Bindet `generatePdfForUiEditor` an denselben `printToPDF`-Pfad. Kein zweiter Store/Renderer. |
| `src/renderer/print/headerTest/**` | nur Diagnose/Test | Separater sichtbarer Kopf-Testmodus; nicht im normalen Ausgabedialog, nicht Quelle für Protokoll-/Restarbeiten-PDF. |
| `print:openHtmlPreview` | produktive Alternative | Zeigt denselben Print-Renderer sichtbar, erzeugt aber noch keine Datei. |
| `print:toPdfAndPreviewInternal` | produktive Alternative | Erzeugt über den kanonischen Weg und öffnet Chromium-interne PDF-Vorschau. |
| `print:toPdfAndOpen` | produktive Alternative | Erzeugt kanonisch und öffnet extern über `shell.openPath`. |
| `src/renderer/modules/restarbeiten/RestarbeitenOutputPreview.js` | historische HTML-Alternative | Bleibt vorhanden, ist aber nicht mehr der Restarbeiten-Produktweg und keine PDF-Paginierungsquelle. |
| `src/renderer/print/v2/pdfSatzvertragV2.js` | Testdescriptor, verhaltensneutral | Liest nur bei explizitem Fixture-Flag Seitenmodell und DOM-Metriken; verändert keine Ausgabe. |
| `scripts/pdf-v2/**` | Test/Acceptance | Neutrale Fixture-Daten, isolierter Electron-Harness und Hashmanifest; keine Produktdaten. |
| `src/renderer/print/printApp.js` Auto-Layout-/Dev-Bereich | nur Development/Diagnose | Nur bei expliziter Development-Layoutvorschau; nicht Satzquelle und nicht im Release aktivierbar. |
| `src/renderer/modules/restarbeitenV2/**` | historischer Daten-/Read-only-Pfad | Kein aktiver PDF-Renderer und keine Satzquelle. |

## A. Unveränderliche Satzregeln und offene Grenzen

| Vertrags-ID | Regel | Dokumentarten | Codequelle | Test/Fixture | Status | Editorstatus |
|---|---|---|---|---|---|---|
| `PDF-V2-SATZ-001` | Chromium erzeugt A4. Orientierung ist explizit Hochformat oder Querformat; Standard ist Hochformat. Bei einer registrierten Editor-Regeneration setzt der generische Resolver die Orientierung ausschließlich aus `pageSettings` der aktuell wirksamen Dokumenttyp-Registry. Chromium-Ränder sind 0, der Inhalt nutzt V2-Padding. | alle kanonischen Modi | `pdfAdapterRegistry.cjs`, `printOrientation.js`, `printApp._applyPageOrientationStyle`, CSS `@page` | `pdfDocumentTypeRegistration.test.cjs` mit neutralem Portrait/Landscape sowie Protokoll/Restarbeiten, `printOrientation.test.cjs`, M85-Snapshots | fest | Papierformat gesperrt; Inhaltsränder explizit editierbar |
| `PDF-V2-SATZ-002` | Seite 1 rendert in dieser Reihenfolge GlobalHeader, FullHeader, Abstand und Body. | Protokoll, Restarbeiten, Listen | `PrintShell.renderPrint` | alle 48 Snapshots | fest | Kopfart/-reihenfolge gesperrt; einzelne Designziele teils editierbar |
| `PDF-V2-SATZ-003` | Seiten ab Nummer 2 rendern nur MiniHeader vor dem Body. | alle mehrseitigen Modi | `PrintShell.renderPrint` | mehrseitige Snapshots | fest | Kopfart/-reihenfolge gesperrt |
| `PDF-V2-SATZ-004` | Jedes Seitenmodell erhält `pageNo`/`totalPages`. FullHeader auf Seite 1 und MiniHeader auf Folgeseiten rendern sichtbar `Seite n / gesamt`; der Zähler muss vollständig innerhalb der A4-Seitenbox liegen. | Protokoll, Restarbeiten, Preview/Vorabzug | Pager, `FullHeader.js`, `MiniHeader.js` | alle Snapshots, p03, r21, DOM-Grenzprüfung | fest | Zählerwerte/Fachtext gesperrt |
| `PDF-V2-SATZ-005` | Standardmäßig werden 12 mm Fußreserve von der gemessenen Kapazität abgezogen und als absoluter Spacer gerendert. | alle | `_createMeasureContext`, `v2.css`, `PrintShell` | alle Snapshots | fest | Reserve nicht registriert/gesperrt |
| `PDF-V2-SATZ-006` | Jede gerenderte Seitentabelle baut einen eigenen Tabellenkopf. Eine leere TOP-Tabelle wird vollständig unterdrückt; leere Restarbeiten zeigen Kopf plus Leerhinweis. | Protokoll, Restarbeiten | `PrintShell._buildTable`, `renderPrint` | p01, r19 und alle Seiten mit Datensätzen | fest | Seitenwiederholung gesperrt; einzelne TOP-Kopfdesignwerte derzeit editierbar |
| `PDF-V2-SATZ-007` | Passt eine vollständige TOP-Zeile in den verbleibenden Raum, wird sie nicht geteilt. Passt sie knapp nicht und ist die Seite belegt, beginnt sie auf der Folgeseite oder wird nur nach den Splitregeln geteilt. | Protokoll/TOP | `_paginateTops` | p04, p05, p07 | fest | Seitenzuweisung/Teilung gesperrt |
| `PDF-V2-SATZ-008` | Nur der Langtext eines Nicht-Level-1-TOP darf an einer Wortgrenze geteilt werden. Nummer, Kurztext und Meta werden auf jeder Teilzeile wiederholt; es gibt kein eigenes „Fortsetzung“-Label. | Protokoll/TOP | `_findSplitText`, `_paginateTops` | p08, p09 | fest | gesperrt |
| `PDF-V2-SATZ-009` | Ein TOP-Split benötigt mindestens drei Langtextzeilen am Seitenende und mindestens drei auf der Folgeseite. | Protokoll/TOP | `MIN_LINES_PAGE_END`, `MIN_LINES_NEXT_PAGE` | p08, p09 | fest | gesperrt |
| `PDF-V2-SATZ-010` | Level-1-Zeilen sind unteilbar und werden mit dem unmittelbar folgenden ersten zulässigen Unterpunkt zusammengehalten. Reicht der Restplatz nicht für beide gemessenen Zeilen, beginnen Titel und Unterpunkt gemeinsam auf der Folgeseite. | Protokoll/TOP | Level-1-Zweig und Tail-Korrektur in `_paginateTops` | p06 | fest | gesperrt |
| `PDF-V2-SATZ-011` | Der Abschlussblock wird nur an die letzte TOP-Seite angehängt. Vorher werden letzte TOP-Zeilen seitenweise nach hinten verschoben, bis der gemessene Abschluss passt. | Protokoll/Preview/Vorabzug; Legende auch TOP-Liste | `_measureTopsTailHeight`, Tail-Schleife, `PrintShell._buildTopsTail` | p15 | fest für Fixture; übergroßer Abschluss ungetestet | Position/Größe/Sichtbarkeit derzeit explizit editierbar, Satzzuordnung gesperrt |
| `PDF-V2-SATZ-012` | Druckfarben werden mit `print-color-adjust: exact` erhalten; neue TOPs blau, wichtige rot, berührte übernommene Langtexte blau. | Protokoll/TOP | `PrintShell`, `print.css`, `v2.css` | bestehende Ampel-/Printtests | dokumentiert, aber ohne Pixel-Golden | Fachfarbe gesperrt |
| `PDF-V2-SATZ-013` | PDF-Erzeugung erfolgt nur über das dedizierte Print-Fenster und genau einen `webContents.printToPDF`-Aufruf. | alle PDF-Modi | `printIpc.js` | M81 und M85 Architekturguard | fest | nicht anwendbar |
| `PDF-V2-SATZ-014` | Die editierbare A4-Nutzfläche ist Papier minus die tatsächlich gesetzten vier Inhaltsränder. Bei 210 × 297 mm und O/R/U/L = 5/12/0/12 mm gilt X 12–198 mm, Y 5–297 mm. Kein normales PDF-Layoutziel darf diese Fläche verlassen. Verletzungen werden vor der Zustandsübernahme mit horizontaler oder vertikaler Randmeldung atomar abgewiesen; eine Randänderung wird gegen alle registrierten Ziele geprüft. | Protokoll-PDF-Editor | `bbmPdfAdapter.cjs` | M81 Nutzflächentest, M85 Print-DOM | fest | Ränder editierbar; Papierformat gesperrt |
| `PDF-V2-SATZ-015` | Editor-Vorschau, normaler Vorabzug und Produkt-PDF der Protokollfamilie verwenden denselben bestehenden Layoutvertrag. Die Editor-Vorschau liest den aktuellen Arbeitszustand; `preview` und `protocol` lesen den gespeicherten Zustand desselben Profils. Nach `Speichern` müssen Seitenränder, Tabellenbreiten, Tracks, Textpositionen, Sichtbarkeit und Schriftgrößen in allen drei Ausgaben geometrisch identisch sein. | Protokoll/Preview/Vorabzug | `printIpc.js`, `printApp.js`, `pdfEditorLayout.js` | M81 Modusguard, M85 Print-DOM und reale Drei-PDF-Bounding-Box-Abnahme | fest | keine zweite Profilquelle; Satz- und Fachoperationen gesperrt |

## B1. Dokumentartspezifische Regeln: Protokoll

| Vertrags-ID | Regel | Nachweis | Status |
|---|---|---|---|
| `PDF-V2-PROT-001` | Teilnehmer stehen vor Vorbemerkung/TOPs und werden ausschließlich an vollständigen Tabellenzeilen auf Seiten verteilt. Teilnehmerüberschrift und Tabellenkopf werden auf jeder Teilnehmer-Folgeseite wiederholt. Nur eine einzelne Zeile, die selbst höher als eine leere Seite ist, wird deterministisch an Wortgrenzen segmentiert; alle Segmente behalten dieselbe synthetische Quellidentität und Folgefragmente sind als `Fortsetzung:` gekennzeichnet. | `_buildParticipantsIntroPlan`, `_splitOversizedParticipantRow`, p11/p12/p28–p31 | fest |
| `PDF-V2-PROT-002` | Vorbemerkung steht nach Teilnehmern und vor TOPs. Passt sie nicht in den Restplatz, wird ihr Text deterministisch an Wortgrenzen auf weitere Seiten verteilt. Folgeblöcke tragen `Vorbemerkung (Fortsetzung):`; kein Wort geht verloren oder wird doppelt ausgegeben. | `_fitPreRemarksSegment`, `_paginateTops`, p13/p14/p32–p34 | fest |
| `PDF-V2-PROT-003` | TOP-Reihenfolge entspricht den in `printData` normalisierten/sortierten Druckdaten. Level 1 nutzt eine eigene unteilbare Zeile mit Keep-with-next; Unterpunkte besitzen Nummer, Kurz-/Langtext und Meta. | `printData`, `_buildTopRowData`, PrintShell | fest |
| `PDF-V2-PROT-004` | Abschlussreihenfolge: Legende, optionaler Nächster-Termin-Text, danach `Aufgestellt:` mit Footerzeilen. Der gesamte Block liegt auf der letzten TOP-Seite. | `_buildTopsTailElement`, `_buildProtocolFooterElement`, p15 | fest für getestete Größen |
| `PDF-V2-PROT-005` | Ein Protokoll ohne TOPs rendert keine leere TOP-Tabelle, aber Teilnehmer-Leerzustand und Abschlussblock. | p01, `PrintShell.renderPrint` | fest |
| `PDF-V2-PROT-006` | „Neu“, „übernommen/berührt“, „wichtig“, Status, Termin, Verantwortlich und Ampel beeinflussen Darstellung, nicht Satzsteuerung durch den Editor. | Zeilenrenderer, Ampelregel | fest, Farben nicht visuell golden-verriegelt |
| `PDF-V2-PROT-007` | Eine registrierte TOP-`TableColumn` ist eine geometrische Einheit aus Spaltentrack, Tabellenkopf und sämtlichen Datenzellen. Direktes `resizeWidth` ändert ausschließlich diese Spaltenbreite; folgende Spalten verschieben sich, Nachbarbreiten bleiben unverändert und die resultierende Tabelle darf bis zur tatsächlichen rechten Arbeitsbereichsgrenze wachsen oder schrumpfen. 0 mm entfernt Track, Kopf, Datenzellen und Lücke reversibel aus dem Renderbild, erhält aber Registry-/Profilidentität. Registrierte Min/Max sind dabei Empfehlungen. Getrennt davon verschiebt `resizeColumnBoundary` ausschließlich eine innere Grenze und ändert zwei direkte Nachbarbreiten atomar und gegenläufig bei fester Summe und verbindlichen Min-/Max-Grenzen. Der registrierte Tabellenkopf bleibt Kind seiner Spalte und darf nur seinen Text bearbeiten. | `bbmPdfAdapter.cjs`, `PrintShell._buildTableHead`, `pdfEditorLayout.js`, neutrale K17.12-, M81- und M85-Nachweise | fest |
| `PDF-V2-PROT-008` | Die bestehende Teilnehmertabelle ist ein explizites Tabellenziel mit den Tracks Name 34, Funktion 32, Firma 30, Telefon/E-Mail 72 und Anwesend/Verteiler 18 mm. Eine innere Grenze verändert nur direkte Nachbarn gegenläufig bei fester 186-mm-Gesamtsumme. Eine Änderung der Tabellenaußenbreite verändert atomar den äußersten rechten Track. Kein Track, Kopf, Zellhintergrund oder Text darf die Nutzflächenkante X = 198 mm überschreiten. Der Kopf Anwesend/Verteiler bleibt als Kind der rechten Spalte separat textpositionierbar. | vorhandene Teilnehmer-DOM-/CSS-Struktur, `bbmPdfAdapter.cjs`, `pdfEditorLayout.js` | M81 und M85 mit realem Header-/Datenzellen-Readback | fest |
| `PDF-V2-PROT-009` | Die fachliche Beschlusskennzeichnung eines Level-1-Titels folgt in der PDF-Baseline der UI-Fachposition: rechts innerhalb der Titelzeile. Der 3,8-mm-Marker endet 1 mm vor der rechten TOP-Tabellenkante. `pdf.bbm.protocol.tops.marker.decision` ist ein eigenes Bildziel unter `.tops.rows`; nur Position und Sichtbarkeit sind editierbar. Fachwert, Titel, Tabellen, Satz und UI bleiben gesperrt. | `PrintShell.appendProtocolTitleMarker`, `print.css`, `bbmPdfAdapter.cjs` | M81 und M85 p06 mit realem Print-DOM-Readback | fest |
| `PDF-V2-PROT-010` | Wichtig erzeugt kein Symbol und wirkt ausschließlich über roten Titeltext. Beschluss und ToDo sind eigenständige 3,8-mm-Marker im gemeinsamen rechten Bereich der vorhandenen Level-1-Titelzeile. Bei gleichzeitiger Kennzeichnung gilt die feste Reihenfolge Beschluss, ToDo bei gleichem Y-Bezug und 1,5 mm Abstand; der rechte Marker endet 1 mm vor der Tabellenkante und der Titel kollidiert nicht. `pdf.bbm.protocol.tops.marker.decision` und `.tops.marker.todo` erlauben unabhängig nur Position und Sichtbarkeit. Fachwerte, UI, Titel, Tabellen und Satz bleiben gesperrt. | `PrintShell.appendProtocolTitleMarker`, `print.css`, `bbmPdfAdapter.cjs` | M81 und M85 p48 mit realem Print-DOM-Readback | fest |
| `PDF-V2-PROT-011` | Beschluss, ToDo und Wichtig sind unabhängige persistierte Kennzeichnungen. Die Ampel ist ein davon unabhängiger globaler Anzeigezustand und wird ausschließlich bei normalen TOPs gerendert; Level-1-Titel besitzen weiterhin keine Ampel. Beschluss und ToDo erscheinen unabhängig und gemeinsam in der Reihenfolge Beschluss, ToDo; bei normalen TOPs bleiben zusammen mit Ampel alle drei Symbole sichtbar. Wichtig fügt kein Symbol hinzu und färbt nur den Text rot. Dieselbe Regel gilt im UI-, Mess- und finalen Print-DOM. Die getrennten Beschluss-/ToDo-Editorziele bleiben erhalten. | `TopsScreenViewModel`, `TopsList`, `TopsScreen._applyAmpelVisibility`, `pdfAmpelRule`, `PrintShell`, `printApp` | UI A–G für normale TOPs und Titel ohne Ampel; M85 p49/p50 mit realem Print-DOM und getrenntem Editor-Readback | fest |

## B2. Dokumentartspezifische Regeln: Restarbeiten

| Vertrags-ID | Regel | Nachweis | Status |
|---|---|---|---|
| `PDF-V2-REST-001` | Das Print-DOM besitzt 9 sichtbare Spalten in dieser Reihenfolge: Nr., Klasse, Gegenstand, Ort, Einheit/Raum, Fertig bis/Status, Verantwortlich, erledigt am, Notiz/Maßnahmen. Gegenstand stapelt Kurztext vor Langtext; Ort stapelt Haus vor Geschoss; Einheit/Raum stapelt beide Fachwerte; Fertig bis/Status stapelt das Datum vor der gemeinsamen Ampel-/Statuszeile. Fehlende Unterwerte erzeugen kein leeres Kind. Alle neun Tabellenüberschriften verwenden 6 pt/500 und sind horizontal sowie vertikal zentriert; der Ampelpunkt der kombinierten Statuszeile misst 2 × 2 mm. Dieselben Descriptoren bauen Mess- und Rendertabelle. | `_buildPages`, `RESTARBEITEN_PDF_COLUMNS`, gemeinsame `buildRestarbeiten*`-Funktionen, M85-Optik-Readback | fest |
| `PDF-V2-REST-002` | Ein vollständig passender Datensatz bleibt eine vollständige Zeile. Passt er nicht mehr auf eine belegte Seite, beginnt er auf der Folgeseite. Nur wenn ein einzelnes Kurztext-, Langtext- oder Notizfeld selbst höher als der freie Raum einer leeren Seite ist, wird es an Wortgrenzen geteilt; nur ein einzelnes überbreites Wort verwendet den deterministischen Zeichen-Fallback. Quell-ID bleibt stabil, Meta wird wiederholt und Folgezeilen tragen `Fortsetzung`. | `_paginateGeneric`, `_fitRestarbeitenTextSegment`, r23/r35–r38 | fest |
| `PDF-V2-REST-003` | Messung und End-DOM verwenden denselben Full-/MiniHeader, dieselbe `restarbeitenTable`, denselben 9-spaltigen `colgroup`, dieselben kombinierten Zeilen-/Ampelbuilder, dieselben Schriften und dieselben CSS-Werte. Verwendete Höhe überschreitet nie die Kapazität vor der 12-mm-Fußreserve. | `_createMeasureContext`, `PrintShell`, r21/r24/r25/r37/r38/r45 | fest |
| `PDF-V2-REST-004` | Die leere Liste rendert eine Seitentabelle mit 9-spaltigem Kopf und „Keine Restpunkte für den Druck vorhanden.“ | r19 | fest |
| `PDF-V2-REST-005` | Der Screen übergibt ausschließlich `_getFilteredItems()` ohne gelöschte Datensätze und ohne zusätzliche PDF-Sortierung. Die Reihenfolge entspricht exakt der sichtbaren Liste; Fotos/Anhänge werden nicht in `restarbeitenRows` aufgenommen. | `RestarbeitenScreen._buildRestarbeitenPdfRows`, `printData`, r41/r42 und Modultest | fest |
| `PDF-V2-REST-006` | Der Satz startet in A4-Querformat mit 273 mm Tabellenbreite bei je 12 mm horizontalem Inhaltsrand. Die 9 Baselines und Empfehlungsbereiche stehen in der folgenden Tabelle. Alle 9 Spalten sind explizite `TableColumn`-Ziele; jede ID löst denselben Track, Kopf und dieselben Datenzellen auf. Direktes `resizeWidth` ändert nur die gewählte Spalte, akzeptiert 0 mm als reversible vollständige Ausblendung und endet spätestens an der rechten Arbeitsbereichsgrenze. Innere Grenzen bleiben eine getrennte atomare, gegenläufige Zwei-Nachbar-Operation. Die Tabellenbreiten-Capability führt bei einer äußeren Breitenänderung weiterhin die letzte Spalte atomar mit und ist auf 268–273 mm begrenzt. Orientierung, Satz-/Splitregeln und Spaltenreihenfolge bleiben gesperrt. | `RESTARBEITEN_PDF_COLUMNS`, `restarbeitenPdfAdapter.cjs`, `restarbeitenPdfEditorRegistration.test.cjs`, `restarbeitenPdfVisibleAcceptance.test.cjs`, r27/r38/r47 | Satzbaseline fest; Tabellenbreiten editorfähig |
| `PDF-V2-REST-007` | Die inneren senkrechten Spaltentrennlinien sind eine gemeinsame registrierte Darstellungsoption mit Baseline EIN. Sie verwenden 0,2 mm in der vorhandenen neutralen Linienfarbe `#ddd`, laufen deckungsgleich durch Kopf und Datenzeilen und erscheinen nur zwischen tatsächlich sichtbaren Spalten. Bei AUS oder 0-mm-Spalten bleiben weder Phantomlinien noch zusätzliche Außenlinien zurück. Der boolesche Zustand nutzt ausschließlich `setVisibility` und den bestehenden PDF-Profilweg. | `restarbeitenPdfAdapter.cjs`, `pdfEditorLayout.js`, `print.css`, M85-Optik-Readback, Registrierungs-/Profil- und sichtbarer Neustarttest | editorfähige Darstellungsoption |

### Verriegeltes Restarbeiten-Spaltenlayout

| Spalte | Baseline mm | Empfehlung für direktes `resizeWidth` mm | Umbruch |
|---|---:|---:|---|
| Nr. | 9 | 7–12 | kompakt |
| Klasse | 10 | 8–14 | kompakt |
| Gegenstand | 77 | 58–102 | Kurztext vor Langtext; beide an Wortgrenzen, bei überhohem Datensatz teilbar |
| Ort | 34 | 26–48 | Haus vor Geschoss; Wortgrenze |
| Einheit/Raum | 36 | 26–48 | Einheit vor Raum; Wortgrenze |
| Fertig bis/Status | 39 | 32–49 | Datum vor gemeinsamer Ampel-/Statuszeile |
| Verantwortlich | 25 | 19–34 | Wortgrenze |
| erledigt am | 20 | 17–24 | kompakt |
| Notiz/Maßnahmen | 23 | 18–34 | Wortgrenze; bei überhohem Datensatz teilbar |

Alle Baselines summieren sich auf 273 mm. Direkte Einzelspaltenänderungen dürfen
diese Summe verkleinern oder bis zur rechten Arbeitsbereichsgrenze vergrößern;
die übrigen Breiten bleiben dabei exakt erhalten. Innere Grenzänderungen halten
ihre aktuelle Summe durch `adjacentPreserveTotal` exakt. Eine äußere
Tabellenbreitenänderung führt ausschließlich die letzte Spalte mit und bleibt
innerhalb 268–273 mm.
Der Restarbeiten-Descriptor v3 registriert genau diese neun sichtbaren Tracks
und die gemeinsame Darstellungsoption für die inneren Spaltentrennlinien.
Die vier kombinierten Baselines entsprechen jeweils der Summe ihrer früheren
Einzelspalten. Dadurch bleiben die fünf unveränderten stabilen Spaltenverträge
kompatibel; acht entfallene Einzelspalten bleiben historisch bekannt, sind aber
keine aktuellen Editorziele.

## C. Editorfähige Designwerte

M86.2 präzisiert die bestehenden, editorfähigen Designbaselines ohne die
Satzträger zu öffnen: Der logo-lose globale Kopf verwendet 8 mm, aktive Logos
bestimmen die Kopfgeometrie, der obere Seitenrand beträgt 5 mm und die
Protokoll-TOP-Spalten verwenden bei 186 mm 24,18/120,90/40,92 mm (13/65/22).
`setPageBreakRule`, Paginierung, Mindestzeilen und Fußreserve bleiben davon
unberührt und gesperrt.

K17.12 präzisiert die Bedienwirkung aller registrierten PDF-`TableColumn`-Ziele.
Eine horizontale Translation wird nicht angeboten. Direkte Millimetereingabe
und Ziehen an der rechten ausgewählten Spaltenkante senden dieselbe bestehende
`resizeWidth`-Operation und ändern ausschließlich diesen Track. Nachfolgende
Tracks verschieben sich, Nachbarbreiten bleiben unverändert. 0 mm entfernt die
vollständige Spalte ohne Phantomlücke, lässt ID, Baumziel, Undo und Profilwert
aber bestehen. Negative Werte und Überschreitungen der tatsächlichen rechten
PDF-Arbeitsbereichsgrenze werden abgewiesen. Min/Max bleiben für diesen direkten
Vorgang Empfehlungen. `resizeColumnBoundary` am Tabellenparent bleibt separat:
linke und rechte Nachbarbreite ändern sich atomar um entgegengesetzte Beträge,
die Summe bleibt fest und Min/Max dürfen hart wirken. Paginierung,
Tabellenkopfwiederholung, Fachwerte, Reihenfolge und Seitenzuweisung bleiben
unverändert gesperrt.

Bekannter separater Readback-Punkt: Die Registry-Baseline der TOP-Tabelle
meldet `y = 91 mm`, während der tatsächliche Tabellenkopf im gemessenen
produktiven Print-DOM bei etwa `y = 79 mm` beginnt. Die Track-Metadaten geben
hier den logischen Registry-Wert und nicht die reale DOM-Bounding-Box zurück.
Diese vertikale Abweichung ist nicht Bestandteil der horizontalen
Meta-Spalten-Innengeometrie und bleibt in diesem Paket ausdrücklich
unverändert.

Alle Werte stammen aus `bbmPdfAdapter.cjs`. Bei direktem `TableColumn.resizeWidth` sind `min/max` Gestaltungsempfehlungen; bei `resizeColumnBoundary` und den übrigen ausdrücklich begrenzten Operationen bleiben sie validierte Grenzen. Nach jeder erfolgreichen Änderung wird die Vorschau „veraltet“ und über denselben PDF-Weg neu erzeugt. Apply-Fehler und unzulässige Geometrien lassen den vorherigen Zustand als Rollback stehen.

Abkürzungen: `mm` = Millimeter, `pt` = Punkt, `×` = Breite × Höhe. Für Textgröße und Zeilenabstand ist nur `> 0` kodiert; es gibt keinen kodierten Höchstwert. Positions-/Größenlimits werden zusätzlich durch A4 und die jeweilige Area begrenzt.

| Element-ID | Freigegebene Operationen | Baseline | Kodierte Grenze | Paginierung / Risiko |
|---|---|---|---|---|
| `pdf.bbm.protocol` | keine | 0/0, 210×297 mm | gesperrt | keine |
| `.page-template` | `setPageMargins` | O/R/U/L = 5/12/0/12 mm | je Rand ≥0; alle Ziele müssen in X 12–198 und Y 5–297 mm bleiben | Randänderung wird vor Übernahme vollständig validiert |
| `.header` | Höhe, Sichtbarkeit | 12/5, 186×51 mm | Header-Area und Nutzfläche | direkte Neumessung; Ausblenden kann den sichtbaren Kopfvertrag unterlaufen |
| `.header.logos` | Position, Breite, Höhe, Sichtbarkeit | 12/5, 186×8 mm | Header-Area und Nutzfläche | direkte Neumessung; risikobehaftet |
| `.header.project` | Position, Breite | 12/14, 120×16 mm | Header-Area und Nutzfläche | direkte Neumessung; risikobehaftet |
| `.header.project.label` | Position, Breite, Textgröße, Ausrichtung, Sichtbarkeit | 16/14, 28×6 mm, 9 pt, links | Header-Area und Nutzfläche; Schrift >0 | direkte Neumessung |
| `.header.project.value` | wie Label | 16/20, 116×7 mm, 16 pt, links | wie oben | direkte Neumessung |
| `.header.title` | Position, Breite, Textgröße, Ausrichtung, Zeilenabstand, Sichtbarkeit | 16/28, 116×8 mm, 12,5 pt, 1,1 | Header-Area und Nutzfläche; Schrift/Abstand >0 | direkte Neumessung; risikobehaftet |
| `.header.meta` | Position, Breite, Höhe | 143/14, 55×22 mm | Header-Area und Nutzfläche | direkte Neumessung |
| `.header.meta.page-label` | Position, Breite, Textgröße, Ausrichtung, Sichtbarkeit | 143/14, 16×6 mm, 9 pt, rechts | Header-Area und Nutzfläche; Schrift >0 | gemeinsamer Wert für sichtbaren Full-/Mini-Seitenzähler |
| `.header.meta.page-value` | wie Label | 159/14, 39×6 mm, 9 pt, rechts | wie oben | darf Seitenwert nicht ändern |
| `.body` | keine | 12/56, 186×204 mm | Nutzfläche, gesperrt | keine |
| `.participants` | Position, Breite, Sichtbarkeit, äußere Breite, Spaltengrenze | 12/56, 186×32 mm | Body-Area und Nutzfläche; rechte Kante höchstens 198 mm | Tabelle und äußerster rechter Track werden atomar geändert; Seitenaufteilung bleibt Rendererbesitz |
| `.participants.title` | Position, Breite, Textgröße, Ausrichtung, Sichtbarkeit | 12/56, 186×6 mm, 10 pt | Body-Area und Nutzfläche; Schrift >0 | direkte Neumessung |
| `.participants.rows` | Zeilenabstand | 12/62, 186×26 mm, 1,1 | Body-Area und Nutzfläche; Abstand >0 | Breite folgt der Tabelle; Seitenaufteilung bleibt Rendererbesitz |
| `.participants.column.name` | Breite über Spaltengrenze | 12/62, 34×26 mm | ≥5 mm; exakte Tabellensumme | Kopf und Datenzellen gemeinsam |
| `.participants.column.function` | Breite über Spaltengrenze | 46/62, 32×26 mm | wie oben | Kopf und Datenzellen gemeinsam |
| `.participants.column.company` | Breite über Spaltengrenze | 78/62, 30×26 mm | wie oben | Kopf und Datenzellen gemeinsam |
| `.participants.column.contact` | Breite über Spaltengrenze | 108/62, 72×26 mm | wie oben | Kopf und Datenzellen gemeinsam |
| `.participants.column.attendance` | Breite über Spaltengrenze | 180/62, 18×26 mm | ≥5 mm; rechte Kante höchstens 198 mm | äußerster rechter Track; Kopf und Datenzellen gemeinsam |
| `.participants.heading.attendance` | Textposition, Textgröße, Ausrichtung, Sichtbarkeit | 180/62, 18×8 mm, 7 pt, zentriert | Parent `.participants.column.attendance`; Nutzfläche | Textziel separat, Tabellencontainer unverändert |
| `.tops` | Position, Breite, Sichtbarkeit, Spaltengrenze | 12/91, 186×120 mm | Body-Area und Nutzfläche | innere Grenzen bei fester Gesamtsumme; Ausblenden ändert sichtbaren Inhalt, nicht Fachwerte |
| `.tops.header` | Höhe, Textgröße, Ausrichtung, Sichtbarkeit | 12/91, 186×8 mm, 8 pt | Body-Area und Nutzfläche; Schrift >0 | direkte Neumessung; Sichtbarkeit kollidiert potenziell mit Tabellenkopfvertrag |
| `.tops.rows` | Zeilenabstand | 12/99, 186×112 mm, 1,35 | Abstand >0 | direkte Neumessung; p18 |
| `.tops.marker.decision` | Position, Sichtbarkeit | 193,2/99, 3,8×3,8 mm | Parent `.tops.rows`; Body-Area und aktuelle Nutzfläche | wiederholtes Bildziel; gleiche PDF-Feinjustierung für alle sichtbaren Beschlussmarker; Fachwert bleibt unverändert |
| `.tops.marker.todo` | Position, Sichtbarkeit | 193,2/99, 3,8×3,8 mm | Parent `.tops.rows`; Body-Area und aktuelle Nutzfläche | wiederholtes Bildziel; gleiche PDF-Feinjustierung für alle sichtbaren ToDo-Marker; Fachwert bleibt unverändert |
| `.tops.column.number` | Breite über Spaltengrenze, Sichtbarkeit | 12/91, 24,18×120 mm | ≥5 mm, Nutzfläche, exakte Spaltensumme 186 mm | Track, Kopf und alle Datenzellen gemeinsam; p16 |
| `.tops.column.text` | wie oben | 36,18/91, 120,90×120 mm | wie oben | Track, Kopf und alle Datenzellen gemeinsam; p16 |
| `.tops.column.meta` | wie oben | 157,08/91, 40,92×120 mm | wie oben | Track, Kopf und alle Datenzellen gemeinsam; p16 |
| `.tops.heading.number` | Textposition, Textgröße, Ausrichtung, Sichtbarkeit | 12/91, 24,18×8 mm, 8 pt | Schrift >0; Alignment-Enum; Parent `.tops.column.number` | direkte Neumessung; Spaltencontainer unverändert |
| `.tops.heading.text` | Textposition, Textgröße, Ausrichtung, Sichtbarkeit | 36,18/91, 120,90×8 mm, 8 pt | Schrift >0; Alignment-Enum; Parent `.tops.column.text` | direkte Neumessung; Spaltencontainer unverändert; p17 |
| `.tops.heading.meta` | Textposition, Textgröße, Ausrichtung, Sichtbarkeit | 157,08/91, 40,92×8 mm, 8 pt | Schrift >0; Alignment-Enum; Parent `.tops.column.meta` | direkte Neumessung; Spaltencontainer unverändert |
| `.closing` | Position, Breite, Sichtbarkeit | 12/225, 186×35 mm | Body-Area | Tail wird neu gemessen; Satzzuordnung bleibt Rendererbesitz |
| `.footer` | Position, Breite, Höhe, Sichtbarkeit | 12/260, 186×30 mm | Footer-Area X 0–210, Y 180–297, B 5–210, H 2–100 | Teil des Abschlusses, nicht der 12-mm-Seitenreserve |
| `.footer.label` | Position, Breite, Textgröße, Ausrichtung, Sichtbarkeit | 12/260, 40×6 mm, 9 pt | Footer-Area; Schrift >0 | Tail-Neumessung |
| `.footer.value` | Position, Breite, Textgröße, Ausrichtung, Zeilenabstand, Sichtbarkeit | 12/266, 186×24 mm, 8 pt, 1,35 | Footer-Area; Schrift/Abstand >0 | Tail-Neumessung; risikobehaftet |

Für jedes Element sind außerdem `setPageBreakRule`, Seitenzuweisung, manuelle Teilung, Fachtext-/Fachwertänderung, Create/Delete/Save/Upload/Import/Export/Autosave und fachliche Aktionen gesperrt. Es gibt keine Operation zum Ändern der Blockreihenfolge.

## Strukturelle Golden-Fixtures

Die 48 neutralen Fälle liegen in `scripts/pdf-v2/m85Fixtures.cjs`. Der isolierte
Electron-Harness verwendet ausschließlich diese Objekte, eigenes temporäres
`userData`/`sessionData` und die echten Renderer-CSS-Dateien. Die 26
Protokollfälle behalten einschließlich p01–p34 ihre M85.1-Goldenwerte und ergänzen p48 für die Titelkennzeichnungen; 22
Restarbeiten-Fälle decken Leerzustand, Grenzfälle, Mehrseitenlisten, alle drei
teilbaren Textfelder, einen Datensatz über mehrere Seiten, alle 9 sichtbaren
Spalten und ihre kombinierten Unterwerte, Status/Ampel, lange Verortung, sichtbare Filterreihenfolge, Löschfilter,
Kopfwiederholung, Fußreserve, Querformat und gemischte Datensätze ab. Er erfasst
je Seite:

- Seitennummer, Seitentyp und Kopfart;
- tatsächlich vorhandene Global-/Full-/Mini-Köpfe und sichtbaren Zählertext;
- Blockreihenfolge;
- neutrale Datensatzschlüssel, stabile Quell-ID und Segment
  `complete/start/continuation/end`;
- Tabellenkopf, Teilnehmer einschließlich Quell-ID/Segment, Vorbemerkung einschließlich Segment/Wortzahl, Abschluss, Aufgestellt-Bereich und Fußreserve;
- verfügbare, verwendete und verbleibende Höhe;
- Orientierung, Tabellen-/Seitenbreite, angewandte Spaltenbreiten und
  Schriftgrößen;
- Restarbeiten-Filterfolge, Leerzustand, kombinierte Zellen, Kopf-/Zell-Clipping,
  elementId-zu-Track-Geometrie und sichtbare Fortsetzungskennzeichnung.

`scripts/pdf-v2/m85GoldenManifest.cjs` speichert Seitenzahlen und SHA-256 der vollständigen neutralen Zwischenrepräsentation. Binäre PDFs werden nicht versioniert. `npm run test:m85:pdf` erzeugt alle Snapshots neu und vergleicht sie.

Die K17.8-Änderung aktualisiert ausschließlich die Strukturhashes der drei
Editor-Layout-Fixtures p16 bis p18: Die Tabellenkopf-Inhalte besitzen nun
explizite Label-Wrapper und die tatsächliche Tabellensumme folgt der
gespeicherten Spaltensumme. Seitenzahlen, Datensatzzuweisung, Fortsetzungen und
alle übrigen bestehenden 44 Strukturhashes bleiben unverändert. Der neue Fall p48 besitzt einen eigenen zusätzlichen Strukturhash.

## Harte Sperren und derzeit offene Guardrails

Grün verriegelt sind Voll-/Mini-Kopfstruktur einschließlich sichtbarem
Seitenzähler, Seitenmodell, Fußreserve, Tabellenkopf je Datenseite,
Datensatzreihenfolge, p04/p05- und r24/r25-Grenzverhalten,
Level-1-Keep-with-next, TOP- und Restarbeiten-Fortsetzungen, vollständige
Teilnehmerzeilen mit wiederholtem Kopf, Wortgrenzen der Vorbemerkung, Abschluss
auf letzter TOP-Seite, Restarbeiten-Querformat und 9-Spalten-Summe, 37
Protokoll-Registryelemente, `setPageBreakRule`, Fachoperationen und die
Einzelpfade für Renderer/Paginierung/Profil.

M85.1 schließt die vier Protokoll-Lücken `PDF-V2-SATZ-004`,
`PDF-V2-SATZ-010`, `PDF-V2-PROT-001` und `PDF-V2-PROT-002`. M85.2 schließt
`PDF-V2-REST-002`, `PDF-V2-REST-003` und `PDF-V2-REST-005`; REST-006 ist als
expliziter editorfähiger 9-Spalten-Vertrag dokumentiert. Nach gemeinsamer
automatisierter und sichtbarer Prüfung beider Dokumentarten ist M85.0 `[A]`.

## Registrybewertung nach M83.0

Die 37 Elemente bilden Dokument, Seite, Kopf, Logos, Projektzeile, Titel,
Mini-Seitenmetadaten, Body, Teilnehmer-Tabelle einschließlich ihrer fünf
bestätigten Spaltentracks und des rechten Spaltenkopfs, TOP-Tabelle
einschließlich drei Spalten/Köpfen, Abschluss und Aufgestellt-Bereich ab.
Vollständig erfasst sind die groben Protokollbereiche, die Teilnehmertracks und
die drei TOP-Spalten sowie Beschluss- und ToDo-Kennzeichnung eines Level-1-Titels. Nicht als Einzelziele erfasst sind unter anderem
Vorbemerkung, einzelne Teilnehmer-Datenzellen, Kurz-/Langtextzeilen, drei
Meta-Unterzeilen/Ampel, Legende,
Nächster-Termin-Text, Global-/Full-/Mini-Kopf als getrennte Varianten und der
Fußreserve-Spacer.

Restarbeiten-PDF besitzt nun eine eigene explizite Registry mit Dokument,
Seite, Kopf, Projekt-/Titelgruppe, Body, Tabellenbereich, Wiederholungsbereich,
9 sichtbaren Spalten und Fußreserve. Editierbar sind die 9 Spaltenbreiten, die atomare
innere Tabellengrenze sowie die technisch gekoppelte äußere Tabellenbreite
innerhalb 268–273 mm mit den dokumentierten Min-/Max-Werten.
Gesperrt bleiben Papierformat,
Spaltenreihenfolge, Tabellenkopfwiederholung, Fußreserve,
Datensatzidentität, Seitenzuweisung und Splitregeln.

Die Registrierung verwendet ausschließlich explizite Ref-/Rendererkeys und
keine automatische DOM-Erkennung. Weitere sichtbare Unterelemente dürfen erst
nach eigener fachlicher Entscheidung additiv folgen. Satzträger wie Seitenart,
Tabellenwiederholung, Fußreserve, Datensatzsegment und Blockreihenfolge bleiben
immer gesperrt.

## Änderungsregel

Jede künftige Änderung an Renderer, Paginierung, Kopf, Fuß, Tabellen, Schriftgrößen, Spaltenbreiten oder Seitenrändern muss die betroffenen Vertrags-IDs nennen, die Golden-Fixtures ausführen, Seitenzahlen und Strukturhashes vergleichen und eine gewollte Vertragsänderung ausdrücklich dokumentieren. Optisches Feintuning und Satzlogik bleiben getrennte Pakete. Eine neue Dokumentart erhält eigene Regeln; Protokollregeln dürfen nicht ungeprüft übertragen werden.
