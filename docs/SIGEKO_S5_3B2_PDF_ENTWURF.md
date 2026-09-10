# S5.3b2 – verbindlicher PDF-Entwurf

Vom Hauptagenten ausgewertet und für S5.3b2 vor Code festgelegt. Basis main c7103ae5e74795defb77fdc9d15809054d9cb983, Branch codex/sigeko-s53b2-vorankuendigung-pdf. S5.3a und S5.3b1 integriert; Rechnung #275 eingefroren. Ergänzende UI-Entscheidung: SIGEKO_S5_3B2_UI_ENTWURF.md. Der verbindliche Workflow-/Dateivertrag in SIGEKO_S5_3B2_WORKFLOW.md konkretisiert die gemeinsamen Anschlüsse und verwendet den bereits integrierten Snapshotvertrag aus S5.3b1.

## A. Art der Ausgabe

PDF: eine A4-Hochformatseite mit dem vorhandenen V2-Global-/FullHeader, danach Behördenanschrift und Formularpunkte 1–9, zwei getrennten Koordinatorrollen, zwei Zahlen unter Punkt 8 und leerem handschriftlichem Abschluss. Fachliche Referenz ist `resources/sigeko/vorlagen/Vorankündigung-blanko.pdf`, visuell gesichtet über `/workspace/scratch/8cca96c4094b/s5-va-template.png`. Die dort vorgedruckten persönlichen Koordinatordaten sind keine Quelle. Das historische Behördenverzeichnis wird nicht eingelesen.

Keine Punkt-9-Firmentabelle: ausschließlich „Noch nicht bekannt“ oder ein eindeutiger Verweis auf die einmalig über die vorhandene Firmenlisten-PDF erzeugte Anlage. Diese Anlage bleibt eine getrennte vorhandene Dokumentausgabe; keine zweite Firmenkartenimplementierung, keine neuen Tabellenspalten.

**Bedienung ist vollständig separat deklariert:** SIGEKO_S5_3B2_UI_ENTWURF.md legt die neuen Aktionen, Ref-IDs, Dirty-/Speicherzustände, Fehleranzeigen und Inventarwerte fest. Der Layoutstart bereitet den Main-Dokumentkontext vor und öffnet den vorhandenen nativen Editor; dort wird der bestehende Bereich PDF-Ausgabe gewählt.

## B. Editorfähigkeit

Ja, über den vorhandenen PDF-Adapter/Profil-/Vorschauweg. Dokumenttyp `sigeko-vorankuendigung`, Scope `pdf.bbm.sigeko-vorankuendigung`, `layoutModel: fixed-layout`, Einheit mm, Registryversion 1. Profilidentität `module-sigeko-vorankuendigung`, Dokumentidentität bestehend über `projectId` + `documentId`. Das UI-Profil `module-sigeko-prenotification` bleibt getrennt.

Textziele erhalten ausschließlich **textResize**. Diese Operation ist für Text im realen `createDeclarativePdfAdapter` implementiert und durch Grenzen prüfbar. Kein move/resizeHeight/setLineSpacing/setTextAlignment behaupten: der generische Adapter implementiert sie bei Text derzeit nicht. `setVisibility` wird für die verpflichtenden Formularangaben bewusst gesperrt. Strukturziele dienen vollständiger Parent-Deklaration und sind nicht editierbar. Papierformat, Reihenfolge, Seitenzuweisung, Fußreserve, Inhalte und Fachaktionen bleiben gesperrt.

A4 210 × 297 mm; Ränder oben 5, rechts 12, unten 0, links 12 mm. Gemeinsame Fußreserve 12 mm bleibt Rendererbesitz. Die folgenden Geometrien sind eine bewusst festgelegte nominale Einseiten-Baseline bei logoarmem Standardkopf, **keine bereits gemessene Abnahmebehauptung**. Der gemeinsame Kopf kann durch reale Logos/Nutzer-/Projektangaben höher werden. Das Formular beginnt dann im normalen Dokumentfluss darunter; echte Messung muss vor print:ready entscheiden, ob alles noch vor der Fußreserve liegt. Nominales y ist daher nicht als absolute Positionierung zu implementieren. Falls die reale Standardfixture nicht passt, Entwurf vor weiteren Codeänderungen präzisieren; keine stille Schriftenverkleinerung.

## C. Vollständige Zieldeklaration

Alle IDs nachfolgend sind konkrete vollständige Werte. `name` entspricht `data-ui-editor-label`; `kind` entspricht genau dem PDF-Registry-Kind und damit `data-ui-editor-kind` (kein UI-frame/single-Mapping). `visible:true` für alle; `editable:true` nur mit textResize. `allowedOps` und `capabilities` sind genau die letzte Tabellenspalte als Liste; sonst leer. `order` entspricht exakt der angegebenen fortlaufenden Nummer. `pageArea` ist `document` für Root/Seite, `header` für Kopfcontainer und Global-/FullHeader und `body` für Body sowie alle seine Nachfahren.

Für alle Elemente: `lockedOps = PDF_TARGET_OPERATIONS.filter(op => !allowedOps.includes(op))` plus `changeText`, `modifyDomainData`, `setPageBreakRule`, `changePageAssignment`, `create`, `delete`, `save`, `upload`, `import`, `export`, `autosave`, `invokeDomainAction`. Weder IDs noch Metadaten enthalten Projekt-, Behörden-, Personen- oder Snapshotwerte.

`baseline = {x,y,width,height,visible:true}` plus bei Text `fontSize`, `lineSpacing:1.15`, `textAlignment:'left'`. Typografische Grenzwerte für Text `minFontSize:8,maxFontSize:12`; für Dokumenttitel maxFontSize:14. Struktur ohne Fontgrenzen. Geometrische `layoutBounds` für Root/Seite 0≤x≤210, 0≤y≤297, 1≤width≤210, 1≤height≤297; sonst 12≤x≤198, 5≤y≤285, 1≤width≤186, 1≤height≤280. Da Geometrieoperationen gesperrt sind, sind dies keine freigegebenen Verschiebungs-/Größenaktionen. Tatsächlicher Seitenrand-, Überlappungs- und Text-Overflow-Nachweis erfolgt im End-DOM.

`refKey` ist immer `sigekoVaPdf.` + Suffix (Root `document`). `rendererKey`: Root `.printRoot`, Seite `.page`, Kopfcontainer `.v2StandardProviderHeader`, GlobalHeader `.v2GlobalHeaderBlock`, FullHeader `.v2HeaderFull`, Body `.sigekoVaBody`; alle übrigen Ziele `[data-sigeko-va-pdf="SUFFIX"]` mit genau dem in der ID nach dem Scope angegebenen Suffix. Diese Selektoren werden beim bewussten Rendern gesetzt, nicht aus sichtbaren Texten oder DOM-Reihenfolge abgeleitet. Die vorhandene Funktion `applyBbmPdfEditorLayout` setzt die sechs Metadatenattribute aus der Registry. Separate generierte Listen außerhalb dieses dokumentierten Komponentenvertrags sind nicht nötig.


| order | id | parentId | kind / role | name | x / y / width / height mm; font pt | allowedOps |
|---:|---|---|---|---|---|---|
| 0 | `pdf.bbm.sigeko-vorankuendigung` | `` | document / layout | Vorankündigung | 0 / 0 / 210 / 297 | — |
| 1 | `pdf.bbm.sigeko-vorankuendigung.page` | `pdf.bbm.sigeko-vorankuendigung` | page / layout | A4-Seite | 0 / 0 / 210 / 297 | — |
| 2 | `pdf.bbm.sigeko-vorankuendigung.header` | `pdf.bbm.sigeko-vorankuendigung.page` | header / layout | Gemeinsamer V2-Kopfbereich | 12 / 5 / 186 / 49 | — |
| 3 | `pdf.bbm.sigeko-vorankuendigung.globalHeader` | `pdf.bbm.sigeko-vorankuendigung.header` | group / layout | Gemeinsamer V2-GlobalHeader | 12 / 5 / 186 / 8 | — |
| 4 | `pdf.bbm.sigeko-vorankuendigung.fullHeader` | `pdf.bbm.sigeko-vorankuendigung.header` | group / layout | Gemeinsamer V2-FullHeader | 12 / 14 / 186 / 40 | — |
| 5 | `pdf.bbm.sigeko-vorankuendigung.body` | `pdf.bbm.sigeko-vorankuendigung.page` | area / layout | Vorankündigungsformular | 12 / 56 / 186 / 227 | — |
| 6 | `pdf.bbm.sigeko-vorankuendigung.authority` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | Zuständige Arbeitsschutzbehörde | 12 / 56 / 186 / 21 | — |
| 7 | `pdf.bbm.sigeko-vorankuendigung.authority.label` | `pdf.bbm.sigeko-vorankuendigung.authority` | label / fieldLabel | An die Arbeitsschutzbehörde | 12 / 56 / 186 / 5; 9 pt | textResize |
| 8 | `pdf.bbm.sigeko-vorankuendigung.authority.name` | `pdf.bbm.sigeko-vorankuendigung.authority` | value / content | Behördenname | 12 / 61 / 186 / 8; 9 pt | textResize |
| 9 | `pdf.bbm.sigeko-vorankuendigung.authority.street` | `pdf.bbm.sigeko-vorankuendigung.authority` | value / content | Behördenstraße / Hausnummer | 12 / 69 / 186 / 4; 9 pt | textResize |
| 10 | `pdf.bbm.sigeko-vorankuendigung.authority.zip` | `pdf.bbm.sigeko-vorankuendigung.authority` | value / content | Behörden-PLZ | 12 / 73 / 20 / 4; 9 pt | textResize |
| 11 | `pdf.bbm.sigeko-vorankuendigung.authority.city` | `pdf.bbm.sigeko-vorankuendigung.authority` | value / content | Behördenort | 34 / 73 / 164 / 4; 9 pt | textResize |
| 12 | `pdf.bbm.sigeko-vorankuendigung.title` | `pdf.bbm.sigeko-vorankuendigung.body` | label / fieldLabel | Vorankündigung (gem. § 2 (2) BaustellV) | 12 / 78 / 186 / 7; 12 pt | textResize |
| 13 | `pdf.bbm.sigeko-vorankuendigung.p1` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 1 Ort der Baustelle | 12 / 87 / 186 / 16 | — |
| 14 | `pdf.bbm.sigeko-vorankuendigung.p1.label` | `pdf.bbm.sigeko-vorankuendigung.p1` | label / fieldLabel | 1 Ort der Baustelle | 12 / 87 / 186 / 5; 8.5 pt | textResize |
| 15 | `pdf.bbm.sigeko-vorankuendigung.p2` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 2 Name und Anschrift des Bauherrn | 12 / 105 / 186 / 22 | — |
| 16 | `pdf.bbm.sigeko-vorankuendigung.p2.label` | `pdf.bbm.sigeko-vorankuendigung.p2` | label / fieldLabel | 2 Name und Anschrift des Bauherrn | 12 / 105 / 186 / 5; 8.5 pt | textResize |
| 17 | `pdf.bbm.sigeko-vorankuendigung.p3` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 3 Art des Bauvorhabens | 12 / 129 / 186 / 13 | — |
| 18 | `pdf.bbm.sigeko-vorankuendigung.p3.label` | `pdf.bbm.sigeko-vorankuendigung.p3` | label / fieldLabel | 3 Art des Bauvorhabens | 12 / 129 / 186 / 5; 8.5 pt | textResize |
| 19 | `pdf.bbm.sigeko-vorankuendigung.p4` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 4 Name und Anschrift des verantwortlichen Dritten | 12 / 144 / 186 / 23 | — |
| 20 | `pdf.bbm.sigeko-vorankuendigung.p4.label` | `pdf.bbm.sigeko-vorankuendigung.p4` | label / fieldLabel | 4 Name und Anschrift des verantwortlichen Dritten | 12 / 144 / 186 / 5; 8.5 pt | textResize |
| 21 | `pdf.bbm.sigeko-vorankuendigung.p5` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 5 Name und Anschrift des Koordinators / der Koordinatoren | 12 / 169 / 186 / 34 | — |
| 22 | `pdf.bbm.sigeko-vorankuendigung.p5.label` | `pdf.bbm.sigeko-vorankuendigung.p5` | label / fieldLabel | 5 Name und Anschrift des Koordinators / der Koordinatoren | 12 / 169 / 186 / 5; 8.5 pt | textResize |
| 23 | `pdf.bbm.sigeko-vorankuendigung.p6` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | 12 / 205 / 186 / 14 | — |
| 24 | `pdf.bbm.sigeko-vorankuendigung.p6.label` | `pdf.bbm.sigeko-vorankuendigung.p6` | label / fieldLabel | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | 12 / 205 / 186 / 5; 8.5 pt | textResize |
| 25 | `pdf.bbm.sigeko-vorankuendigung.p7` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 7 Voraussichtliche Höchstzahl der Beschäftigten | 12 / 221 / 186 / 13 | — |
| 26 | `pdf.bbm.sigeko-vorankuendigung.p7.label` | `pdf.bbm.sigeko-vorankuendigung.p7` | label / fieldLabel | 7 Voraussichtliche Höchstzahl der Beschäftigten | 12 / 221 / 186 / 5; 8.5 pt | textResize |
| 27 | `pdf.bbm.sigeko-vorankuendigung.p8` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | 12 / 236 / 186 / 14 | — |
| 28 | `pdf.bbm.sigeko-vorankuendigung.p8.label` | `pdf.bbm.sigeko-vorankuendigung.p8` | label / fieldLabel | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | 12 / 236 / 186 / 5; 8.5 pt | textResize |
| 29 | `pdf.bbm.sigeko-vorankuendigung.p9` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | 12 / 252 / 186 / 10 | — |
| 30 | `pdf.bbm.sigeko-vorankuendigung.p9.label` | `pdf.bbm.sigeko-vorankuendigung.p9` | label / fieldLabel | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | 12 / 252 / 186 / 5; 8.5 pt | textResize |
| 31 | `pdf.bbm.sigeko-vorankuendigung.p1.street` | `pdf.bbm.sigeko-vorankuendigung.p1` | value / content | Baustelle Straße / Hausnummer | 12 / 93 / 186 / 4; 9 pt | textResize |
| 32 | `pdf.bbm.sigeko-vorankuendigung.p1.zip` | `pdf.bbm.sigeko-vorankuendigung.p1` | value / content | Baustelle PLZ | 12 / 98 / 20 / 4; 9 pt | textResize |
| 33 | `pdf.bbm.sigeko-vorankuendigung.p1.city` | `pdf.bbm.sigeko-vorankuendigung.p1` | value / content | Baustelle Ort | 34 / 98 / 164 / 4; 9 pt | textResize |
| 34 | `pdf.bbm.sigeko-vorankuendigung.p2.name` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr Name | 12 / 111 / 94 / 4; 9 pt | textResize |
| 35 | `pdf.bbm.sigeko-vorankuendigung.p2.street` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr Straße / Hausnummer | 12 / 116 / 94 / 4; 9 pt | textResize |
| 36 | `pdf.bbm.sigeko-vorankuendigung.p2.zip` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr Postleitzahl | 12 / 121 / 20 / 4; 9 pt | textResize |
| 37 | `pdf.bbm.sigeko-vorankuendigung.p2.city` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr Ort | 34 / 121 / 72 / 4; 9 pt | textResize |
| 38 | `pdf.bbm.sigeko-vorankuendigung.p2.phone` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr Telefon | 112 / 111 / 86 / 4; 9 pt | textResize |
| 39 | `pdf.bbm.sigeko-vorankuendigung.p2.email` | `pdf.bbm.sigeko-vorankuendigung.p2` | value / content | Bauherr E-Mail | 112 / 116 / 86 / 4; 9 pt | textResize |
| 40 | `pdf.bbm.sigeko-vorankuendigung.p4.name` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter Name | 12 / 150 / 94 / 4; 9 pt | textResize |
| 41 | `pdf.bbm.sigeko-vorankuendigung.p4.street` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter Straße / Hausnummer | 12 / 155 / 94 / 4; 9 pt | textResize |
| 42 | `pdf.bbm.sigeko-vorankuendigung.p4.zip` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter Postleitzahl | 12 / 160 / 20 / 4; 9 pt | textResize |
| 43 | `pdf.bbm.sigeko-vorankuendigung.p4.city` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter Ort | 34 / 160 / 72 / 4; 9 pt | textResize |
| 44 | `pdf.bbm.sigeko-vorankuendigung.p4.phone` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter Telefon | 112 / 150 / 86 / 4; 9 pt | textResize |
| 45 | `pdf.bbm.sigeko-vorankuendigung.p4.email` | `pdf.bbm.sigeko-vorankuendigung.p4` | value / content | Dritter E-Mail | 112 / 155 / 86 / 4; 9 pt | textResize |
| 46 | `pdf.bbm.sigeko-vorankuendigung.p3.value` | `pdf.bbm.sigeko-vorankuendigung.p3` | value / content | Art des Bauvorhabens | 12 / 135 / 186 / 7; 9 pt | textResize |
| 47 | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `pdf.bbm.sigeko-vorankuendigung.p5` | group / layout | Während der Planung der Ausführung | 12 / 175 / 90 / 28 | — |
| 48 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.label` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | label / fieldLabel | Während der Planung der Ausführung | 12 / 175 / 90 / 8; 8 pt | textResize |
| 49 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.name` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – Name | 12 / 183 / 90 / 4; 8.5 pt | textResize |
| 50 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.street` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – Straße / Hausnummer | 12 / 187 / 90 / 4; 8.5 pt | textResize |
| 51 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.zip` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – Postleitzahl | 12 / 191 / 18 / 4; 8.5 pt | textResize |
| 52 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.city` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – Ort | 32 / 191 / 70 / 4; 8.5 pt | textResize |
| 53 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.phone` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – Telefon | 12 / 195 / 90 / 4; 8.5 pt | textResize |
| 54 | `pdf.bbm.sigeko-vorankuendigung.p5.planning.email` | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | value / content | Während der Planung der Ausführung – E-Mail | 12 / 199 / 90 / 4; 8.5 pt | textResize |
| 55 | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `pdf.bbm.sigeko-vorankuendigung.p5` | group / layout | Während der Ausführung des Bauvorhabens | 108 / 175 / 90 / 28 | — |
| 56 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.label` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | label / fieldLabel | Während der Ausführung des Bauvorhabens | 108 / 175 / 90 / 8; 8 pt | textResize |
| 57 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.name` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – Name | 108 / 183 / 90 / 4; 8.5 pt | textResize |
| 58 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.street` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – Straße / Hausnummer | 108 / 187 / 90 / 4; 8.5 pt | textResize |
| 59 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.zip` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – Postleitzahl | 108 / 191 / 18 / 4; 8.5 pt | textResize |
| 60 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.city` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – Ort | 128 / 191 / 70 / 4; 8.5 pt | textResize |
| 61 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.phone` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – Telefon | 108 / 195 / 90 / 4; 8.5 pt | textResize |
| 62 | `pdf.bbm.sigeko-vorankuendigung.p5.execution.email` | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | value / content | Während der Ausführung des Bauvorhabens – E-Mail | 108 / 199 / 90 / 4; 8.5 pt | textResize |
| 63 | `pdf.bbm.sigeko-vorankuendigung.p6.start.label` | `pdf.bbm.sigeko-vorankuendigung.p6` | label / fieldLabel | Beginn | 12 / 211 / 30 / 5; 8.5 pt | textResize |
| 64 | `pdf.bbm.sigeko-vorankuendigung.p6.start.value` | `pdf.bbm.sigeko-vorankuendigung.p6` | value / content | Voraussichtlicher Beginn | 44 / 211 / 55 / 5; 9 pt | textResize |
| 65 | `pdf.bbm.sigeko-vorankuendigung.p6.duration.label` | `pdf.bbm.sigeko-vorankuendigung.p6` | label / fieldLabel | Voraussichtliche Dauer | 108 / 211 / 58 / 5; 8.5 pt | textResize |
| 66 | `pdf.bbm.sigeko-vorankuendigung.p6.duration.value` | `pdf.bbm.sigeko-vorankuendigung.p6` | value / content | Dauer in ganzen Monaten | 168 / 211 / 14 / 5; 9 pt | textResize |
| 67 | `pdf.bbm.sigeko-vorankuendigung.p6.duration.unit` | `pdf.bbm.sigeko-vorankuendigung.p6` | label / fieldLabel | Monate | 184 / 211 / 14 / 5; 8 pt | textResize |
| 68 | `pdf.bbm.sigeko-vorankuendigung.p7.value` | `pdf.bbm.sigeko-vorankuendigung.p7` | value / content | Höchstzahl Beschäftigte | 12 / 227 / 186 / 5; 9 pt | textResize |
| 69 | `pdf.bbm.sigeko-vorankuendigung.p8.employers.label` | `pdf.bbm.sigeko-vorankuendigung.p8` | label / fieldLabel | Anzahl Arbeitgeber | 12 / 242 / 69 / 7; 8.5 pt | textResize |
| 70 | `pdf.bbm.sigeko-vorankuendigung.p8.employers.value` | `pdf.bbm.sigeko-vorankuendigung.p8` | value / content | Anzahl Arbeitgeber | 83 / 242 / 20 / 7; 9 pt | textResize |
| 71 | `pdf.bbm.sigeko-vorankuendigung.p8.selfEmployed.label` | `pdf.bbm.sigeko-vorankuendigung.p8` | label / fieldLabel | Anzahl Unternehmer ohne Beschäftigte | 108 / 242 / 67 / 7; 8 pt | textResize |
| 72 | `pdf.bbm.sigeko-vorankuendigung.p8.selfEmployed.value` | `pdf.bbm.sigeko-vorankuendigung.p8` | value / content | Anzahl Unternehmer ohne Beschäftigte | 178 / 242 / 20 / 7; 9 pt | textResize |
| 73 | `pdf.bbm.sigeko-vorankuendigung.p9.value` | `pdf.bbm.sigeko-vorankuendigung.p9` | value / content | Firmenangabe / Anlagenverweis | 12 / 258 / 186 / 4; 9 pt | textResize |
| 74 | `pdf.bbm.sigeko-vorankuendigung.signature` | `pdf.bbm.sigeko-vorankuendigung.body` | group / layout | Handschriftlicher Abschluss | 12 / 264 / 186 / 18 | — |
| 75 | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | `pdf.bbm.sigeko-vorankuendigung.signature` | group / layout | Ort / Datum | 12 / 264 / 80 / 18 | — |
| 76 | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate.blank` | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | area / layout | Ort / Datum – Leerbereich | 12 / 264 / 80 / 13 | — |
| 77 | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate.label` | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | label / fieldLabel | Ort / Datum | 12 / 278 / 80 / 4; 8 pt | textResize |
| 78 | `pdf.bbm.sigeko-vorankuendigung.signature.signer` | `pdf.bbm.sigeko-vorankuendigung.signature` | group / layout | Bauherr / Beauftragter Dritter | 112 / 264 / 86 / 18 | — |
| 79 | `pdf.bbm.sigeko-vorankuendigung.signature.signer.blank` | `pdf.bbm.sigeko-vorankuendigung.signature.signer` | area / layout | Bauherr / Beauftragter Dritter – Leerbereich | 112 / 264 / 86 / 13 | — |
| 80 | `pdf.bbm.sigeko-vorankuendigung.signature.signer.label` | `pdf.bbm.sigeko-vorankuendigung.signature.signer` | label / fieldLabel | Bauherr / Beauftragter Dritter | 112 / 278 / 86 / 4; 8 pt | textResize |

### Exakte DOM-Metadaten pro Ziel

| data-ui-inspector-id | data-ui-editor-kind | data-ui-editor-label | data-ui-editor-parent | data-ui-editor-editable | data-ui-editor-ops |
|---|---|---|---|---|---|
| `pdf.bbm.sigeko-vorankuendigung` | `document` | Vorankündigung | `` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.page` | `page` | A4-Seite | `pdf.bbm.sigeko-vorankuendigung` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.header` | `header` | Gemeinsamer V2-Kopfbereich | `pdf.bbm.sigeko-vorankuendigung.page` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.globalHeader` | `group` | Gemeinsamer V2-GlobalHeader | `pdf.bbm.sigeko-vorankuendigung.header` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.fullHeader` | `group` | Gemeinsamer V2-FullHeader | `pdf.bbm.sigeko-vorankuendigung.header` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.body` | `area` | Vorankündigungsformular | `pdf.bbm.sigeko-vorankuendigung.page` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.authority` | `group` | Zuständige Arbeitsschutzbehörde | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.authority.label` | `label` | An die Arbeitsschutzbehörde | `pdf.bbm.sigeko-vorankuendigung.authority` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.authority.name` | `value` | Behördenname | `pdf.bbm.sigeko-vorankuendigung.authority` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.authority.street` | `value` | Behördenstraße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.authority` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.authority.zip` | `value` | Behörden-PLZ | `pdf.bbm.sigeko-vorankuendigung.authority` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.authority.city` | `value` | Behördenort | `pdf.bbm.sigeko-vorankuendigung.authority` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.title` | `label` | Vorankündigung (gem. § 2 (2) BaustellV) | `pdf.bbm.sigeko-vorankuendigung.body` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p1` | `group` | 1 Ort der Baustelle | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p1.label` | `label` | 1 Ort der Baustelle | `pdf.bbm.sigeko-vorankuendigung.p1` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2` | `group` | 2 Name und Anschrift des Bauherrn | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p2.label` | `label` | 2 Name und Anschrift des Bauherrn | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p3` | `group` | 3 Art des Bauvorhabens | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p3.label` | `label` | 3 Art des Bauvorhabens | `pdf.bbm.sigeko-vorankuendigung.p3` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4` | `group` | 4 Name und Anschrift des verantwortlichen Dritten | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p4.label` | `label` | 4 Name und Anschrift des verantwortlichen Dritten | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5` | `group` | 5 Name und Anschrift des Koordinators / der Koordinatoren | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p5.label` | `label` | 5 Name und Anschrift des Koordinators / der Koordinatoren | `pdf.bbm.sigeko-vorankuendigung.p5` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6` | `group` | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p6.label` | `label` | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p7` | `group` | 7 Voraussichtliche Höchstzahl der Beschäftigten | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p7.label` | `label` | 7 Voraussichtliche Höchstzahl der Beschäftigten | `pdf.bbm.sigeko-vorankuendigung.p7` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p8` | `group` | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p8.label` | `label` | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.p8` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p9` | `group` | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p9.label` | `label` | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.p9` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p1.street` | `value` | Baustelle Straße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.p1` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p1.zip` | `value` | Baustelle PLZ | `pdf.bbm.sigeko-vorankuendigung.p1` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p1.city` | `value` | Baustelle Ort | `pdf.bbm.sigeko-vorankuendigung.p1` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.name` | `value` | Bauherr Name | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.street` | `value` | Bauherr Straße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.zip` | `value` | Bauherr Postleitzahl | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.city` | `value` | Bauherr Ort | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.phone` | `value` | Bauherr Telefon | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p2.email` | `value` | Bauherr E-Mail | `pdf.bbm.sigeko-vorankuendigung.p2` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.name` | `value` | Dritter Name | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.street` | `value` | Dritter Straße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.zip` | `value` | Dritter Postleitzahl | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.city` | `value` | Dritter Ort | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.phone` | `value` | Dritter Telefon | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p4.email` | `value` | Dritter E-Mail | `pdf.bbm.sigeko-vorankuendigung.p4` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p3.value` | `value` | Art des Bauvorhabens | `pdf.bbm.sigeko-vorankuendigung.p3` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `group` | Während der Planung der Ausführung | `pdf.bbm.sigeko-vorankuendigung.p5` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.label` | `label` | Während der Planung der Ausführung | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.name` | `value` | Während der Planung der Ausführung – Name | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.street` | `value` | Während der Planung der Ausführung – Straße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.zip` | `value` | Während der Planung der Ausführung – Postleitzahl | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.city` | `value` | Während der Planung der Ausführung – Ort | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.phone` | `value` | Während der Planung der Ausführung – Telefon | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.planning.email` | `value` | Während der Planung der Ausführung – E-Mail | `pdf.bbm.sigeko-vorankuendigung.p5.planning` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `group` | Während der Ausführung des Bauvorhabens | `pdf.bbm.sigeko-vorankuendigung.p5` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.label` | `label` | Während der Ausführung des Bauvorhabens | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.name` | `value` | Während der Ausführung des Bauvorhabens – Name | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.street` | `value` | Während der Ausführung des Bauvorhabens – Straße / Hausnummer | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.zip` | `value` | Während der Ausführung des Bauvorhabens – Postleitzahl | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.city` | `value` | Während der Ausführung des Bauvorhabens – Ort | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.phone` | `value` | Während der Ausführung des Bauvorhabens – Telefon | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p5.execution.email` | `value` | Während der Ausführung des Bauvorhabens – E-Mail | `pdf.bbm.sigeko-vorankuendigung.p5.execution` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6.start.label` | `label` | Beginn | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6.start.value` | `value` | Voraussichtlicher Beginn | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6.duration.label` | `label` | Voraussichtliche Dauer | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6.duration.value` | `value` | Dauer in ganzen Monaten | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p6.duration.unit` | `label` | Monate | `pdf.bbm.sigeko-vorankuendigung.p6` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p7.value` | `value` | Höchstzahl Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.p7` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p8.employers.label` | `label` | Anzahl Arbeitgeber | `pdf.bbm.sigeko-vorankuendigung.p8` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p8.employers.value` | `value` | Anzahl Arbeitgeber | `pdf.bbm.sigeko-vorankuendigung.p8` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p8.selfEmployed.label` | `label` | Anzahl Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.p8` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p8.selfEmployed.value` | `value` | Anzahl Unternehmer ohne Beschäftigte | `pdf.bbm.sigeko-vorankuendigung.p8` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.p9.value` | `value` | Firmenangabe / Anlagenverweis | `pdf.bbm.sigeko-vorankuendigung.p9` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.signature` | `group` | Handschriftlicher Abschluss | `pdf.bbm.sigeko-vorankuendigung.body` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | `group` | Ort / Datum | `pdf.bbm.sigeko-vorankuendigung.signature` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.signature.placeDate.blank` | `area` | Ort / Datum – Leerbereich | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.signature.placeDate.label` | `label` | Ort / Datum | `pdf.bbm.sigeko-vorankuendigung.signature.placeDate` | `true` | `textResize` |
| `pdf.bbm.sigeko-vorankuendigung.signature.signer` | `group` | Bauherr / Beauftragter Dritter | `pdf.bbm.sigeko-vorankuendigung.signature` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.signature.signer.blank` | `area` | Bauherr / Beauftragter Dritter – Leerbereich | `pdf.bbm.sigeko-vorankuendigung.signature.signer` | `false` | `` |
| `pdf.bbm.sigeko-vorankuendigung.signature.signer.label` | `label` | Bauherr / Beauftragter Dritter | `pdf.bbm.sigeko-vorankuendigung.signature.signer` | `true` | `textResize` |

## D. Nicht editorfähige Elemente und Aktionen

Die gemeinsame V2-Kopfstruktur wird als Strukturgrenze benannt, ihre vorhandenen Unterelemente erhalten keine zusätzliche VA-eigene Bearbeitungslogik. Firmenkarten der Anlage bleiben unverändert. Die Linien über Ort/Datum und Unterschrift sind CSS des registrierten Abschlussbereichs, keine eigenständig beweglichen Dekorationen. Die eigentlichen Leerflächen sind echte registrierte, gesperrte Bereiche. Keine Signatur, kein Datum und kein Ort werden automatisch eingesetzt.

Nicht freigegeben: Snapshot speichern/ändern, PDF erzeugen/finalisieren/ersetzen, Vorschau öffnen, Anlagen erstellen/auswählen, Upload/Rücklauf, Outlook, IPC/SQL, Quellen verändern, formale Rollenentscheidungen, Statuswechsel. Diese Aktionen werden außerhalb des Editors über den Fachprozess behandelt. Die auf 1–9 gedruckten Nummern sind feste Beschriftungen, keine umsortierbaren Tabellenzeilen. „Monate“ bleibt die Einheit manuell gespeicherter positiver ganzer Zahlen; keine Datumsdifferenz, keine Dezimalumrechnung. Null ist leer, Zahl 0 wird als 0 gedruckt.

## E. Parent-/Struktur- und Satzregel

Dokument → genau eine Seite → gemeinsamer GlobalHeader, gemeinsamer FullHeader, Body. Body → Behördenblock, Formularüberschrift, Punkte 1–9, Abschluss. Koordinatorrollen sind Kinder von Punkt 5 mit getrennten Kontaktwerten. Ort/Datum und Unterschrift sind Kinder des Abschlusses, ihre Leerfläche und Beschriftung sind jeweils getrennte Kinder. Alle Parent-IDs stehen in der vollständigen Tabelle. Unbelegte optionale Werte behalten eine echte leere Textbox mit Mindesthöhe; keine Phantomziele durch bedingtes Weglassen.

**Einseiten-Entscheidung:** Der bestehende Providerweg ist ausdrücklich einseitig. `printApp` erzeugt dort eine Seite, `PrintShell` verlangt einseitige ContentSlots, `validateProviderDocumentLayout` kontrolliert diesen Vertrag. Der vorhandene `_paginateGeneric` arbeitet ausschließlich mit Tabellenzeilen (`_buildGenericRowElement`, tbody); er ist kein fertiger Formular-/Freitextpager. Deshalb in diesem engen Paket keine scheinbare Wiederverwendung durch erfundene Tabellenzeilen und keine unabhängige VA-Paginierung. Zu langer Text oder zu großer realer Kopf führt vor Dateischreiben zu einem gezielten sichtbaren Fehler, der den betroffenen Punkt/das Feld nennt. Der unveränderte Entwurf bleibt erhalten, es gibt keine finale PDF oder erfolgreiche Finalreferenz. Die Anwendung darf weder clippen, ellipsieren, abschneiden, relevante Werte weglassen noch automatisch bis zur Unlesbarkeit verkleinern.

Prüfen nach geladenen Schriften und nach exakt demselben Editorlayout wie die PDF: horizontale Blattgrenzen; reale Höhe jeder Textbox (scrollHeight/clientHeight und scrollWidth/clientWidth); Überschneidungen von Eltern/Kindern ausgenommen, Geschwisterspalten und aufeinanderfolgende Formblöcke aber separat; Titel/Body/Kopf; Unterkante aller Texte und Unterschriftslinie oberhalb Fußreserve; genau eine Seite. Normale Texte dürfen innerhalb ihrer deklarierten Box mit pre-wrap/overflow-wrap umbrechen. Ein Wort-/Zeilenlimit ersetzt die Messung nicht. Sollte uneingeschränkter Mehrseiten-Freitext verlangt sein, braucht das einen vorgelagerten neutralen Content-Block-Satzanschluss an dieselbe PrintShell; diese Fähigkeit ist derzeit nicht vorhanden und nicht Bestandteil dieses engen Entwurfs.

## F. Prüfnachweise und noch fehlende technische Prüfungen

Vorhanden: Kit `validatePdfRegistry`, `validatePdfTargetContract`; deklarativer Adapter für Profile/Regeneration/Schriftgrenzen; `applyBbmPdfEditorLayout` und `collectBbmPdfPreviewMetadata`; technischer Provider mit echtem Einseiten-Overflow-Abbruch; gemeinsamer produktiver printToPDF-Weg; M85-Satz-Goldenfixtures für bestehende Dokumente. Legacy-UI-Vertrags-CLI ist kein Nachweis für neue PDF-Targets.

**Noch zu schreiben, vor Produktfreigabe zwingend:** VA-Registry und Parentinventar mit allen hier deklarierten Zielen, mounted DOM samt exakten sechs Attributen und tatsächlichen Renderbounds; textResize-Zulassung/Grenzen/Readback/Restore und gesperrte Fachaktionen; unbekannte Provider-/Snapshot-/Projektidentität; falscher Snapshottyp/-version; Quelle verändert nach Snapshot ohne rückwirkende PDF-Änderung; serverseitiger Snapshot statt Clientschattenkopie; null/0, echte Kalenderdaten, positive Ganzmonate; optionale leere Rolle/Dritter; beide unterschiedlichen Koordinatoren; beide Punkt-8-Zahlen; echte Umlaute, lange Wörter/mehrzeilige Adresse/4096-Zeichen-Bauvorhaben; hohe Logos/großer Kopf; vorherige finale Datei erhalten bei Render-/Schreibfehler; Punkt-9-Anlage vorhanden+passender Hash; fehlende/zu alte Zuständigkeitsbestätigung vor finaler Erstellung verweigert. Vorschau darf fehlende Angaben anzeigen, darf nicht als finales bestätigtes Dokument gespeichert werden.

Echte Electron-PDFs auf Windows und Linux: mindestens vollständige Standardfixture, optionale Felder leer, alle Null-/Nullzahlkontraste, zwei getrennte Rollen und handschriftlicher Leerbereich; sichtbare PNG-Rasterprüfung sowie PDF-Textprüfung. Abbruchfixture mit absichtlichem Overflow muss ohne finale Datei enden. Keine GUI/PDF-Abnahme als erbracht ausgeben, solange nur unit/fake DOM lief. Änderungen an `printApp`/`PrintShell` berühren PDF-V2-SATZ-001/002/003/005/013; bestehende M85-Goldenfälle müssen für Protokoll/Restarbeiten/Rechnung unverändert bleiben. Eigene VA-Regeln `PDF-V2-SIGEKO-VA-001` bis `008`: Einseite, V2-Kopf, 1–9-Reihenfolge, Quellen-Snapshot, getrennte Rollen/Zahlen, leere Signatur, vollständige Textmessung, unveränderte Anlagenreferenz. Die IDs sind im Entwurf vorgeschlagen, noch kein grüner technischer Nachweis.

## Verbindliche technische Konkretisierung

Der vollständige Anschluss-/Datei-/Transfervertrag steht in SIGEKO_S5_3B2_WORKFLOW.md. Er ersetzt die vorgelagerten Analysevorschläge: Der integrierte S5.3b1-Snapshot wird unverändert als Datenvertrag benutzt; keine zweite reduzierte Behörden- oder Kontaktstruktur. Der Main-Fachworkflow stellt dem registrierten Provider ausschließlich geprüfte Kontext- oder Dokumentidentitäten bereit. Clientschattenkopien sind keine Datenquelle.

Gemeinsame Druckdaten können Main-intern einmal vorbereitet und an tatsächliches Druckfenster plus Job-ID gebunden werden. Die tatsächliche Firmenanlage wird dauerhaft mit der Haupt-PDF referenziert. Historische Anlagen werden bytegleich geöffnet; kein späterer Live-Firmenreprint. Lizenz, Projekt, Ablage und bestätigte Behördenzuordnung werden an der Dateigrenze erneut geprüft.

Endgültige Fassung erst nach vollständigen geprüften Dateien; V8-Transfer erhält diese Fassungen. Readiness und S5.4-Mailprozess bleiben getrennt. Tatsächliche Nachweise und etwaige verbleibende Einschränkungen stehen in SIGEKO_S5_3B2_ABNAHME.md; dieser Entwurf behauptet keine bereits bestandene Abnahme.


## A–F-Ergänzung vor Reparatur: nativer gemeinsamer Kopfbereich (2026-09-10)

A. PDF; keine neue Formularbedienung. B. Der Kopfcontainer und beide Untergruppen sind strukturelle Editorziele, nicht bearbeitbar. C. Genau ein zusätzliches explizites Ziel; die folgenden Angaben ersetzen für die beiden vorhandenen Kopfziele die bisherige Typ-/Parentzuordnung:

| data-ui-inspector-id | data-ui-editor-kind | data-ui-editor-label | data-ui-editor-parent | data-ui-editor-editable | data-ui-editor-ops |
|---|---|---|---|---|---|
| pdf.bbm.sigeko-vorankuendigung.header | header | Gemeinsamer V2-Kopfbereich | pdf.bbm.sigeko-vorankuendigung.page | false | leer |
| pdf.bbm.sigeko-vorankuendigung.globalHeader | group | Gemeinsamer V2-GlobalHeader | pdf.bbm.sigeko-vorankuendigung.header | false | leer |
| pdf.bbm.sigeko-vorankuendigung.fullHeader | group | Gemeinsamer V2-FullHeader | pdf.bbm.sigeko-vorankuendigung.header | false | leer |

Neuer Container: role=layout, pageArea=header, visible=true, editable=false, allowedOps/capabilities=[], vollständige vorhandene lockedOps für Strukturziele. Baseline x=12/y=5/width=186/height=49 mm; layoutBounds wie andere gesperrte Kopfziele. Ref sigekoVaPdf.header, Rendererref .v2StandardProviderHeader. Einfügung an order=2; folgende Deklarationen rücken um eins weiter, stabile IDs bleiben erhalten. Registryversion 2, insgesamt 81 PDF-Ziele. GlobalHeader und FullHeader behalten ihre bestehenden geometrischen Baselines.

D. Sämtliche Fachaktionen und Text-/Geometrie-/Seitenoperationen bleiben am Kopf gesperrt. E. PrintShell umfasst beim vorhandenen standardmäßigen Providerkopf die beiden bisherigen Kopfblöcke mit genau einem realen Blockcontainer. Der bestehende Abstand zum Body folgt außerhalb dieses Containers. Kein künstlicher zusammengesetzter DOM-Ref und keine vorgetäuschte Bounding-Box. Der native Kit-Adapter erhält genau einen vollständigen Kopfbereich statt zweier konkurrierender Zonen.

F. Native Zonen-Regression gegen den tatsächlichen first-header-Vertrag, gemountete 81 Ziele und vollständige Parents, echte Windows-Editor-Ausgabe, PDF-Regeneration/Undo sowie Windows/Linux-PDFs und alle 49 unveränderten Golden-Seitenzahlen/Strukturhashes. Betroffene bestehende Vertrags-IDs PDF-V2-SATZ-001/002/003/005/013; die acht VA-Regeln bleiben erhalten. Fehlercode pdf_invalid_page_zone aus Job 102743525775 ist der konkrete Reparaturanlass. Keine Abschwächung auf eine seitenweite Ersatz-Kopfzone.
