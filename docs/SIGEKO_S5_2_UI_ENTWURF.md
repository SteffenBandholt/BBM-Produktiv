# SiGeKo S5.2 – vollständige UI-/PDF-Entwurfsentscheidung vor Umsetzung

**Entwurfsentscheidung vor Produktcode.** S5.1 ist über PR #334 in main `57e5cb577adaf42c05e3a94ac4871cda0afe05a7` integriert. S5.2 arbeitet auf `codex/sigeko-s52-prenotification-form`. Ausgangsbaseline 1789/97. Dieser vollständige Entwurf wird vor der UI-Umsetzung ausgegeben; keine Umsetzung oder Abnahme behauptet.

Verbindlich: #251, #274, #277; bestätigte S5.1-Planung. Dauer gemäß #274 B4 manuell in ganzen Monaten; die ältere Ableitungsregel in #251 ist ersetzt. Rechnung #275 eingefroren. Behördenrecherche/Import historischer Referenzdaten bleibt außerhalb dieses Pakets.

Gelesen: AGENTS.md, ZUERST_LESEN_Codex.md, ARCHITECTURE.md, relevante aktuelle Roadmap; die sechs führenden Dokumente unter docs/ui-editor (EDITOR_BAUPLAN, UI_ELEMENT_KATALOG, UI_BAU_UND_PRUEFREGELN, ZIEL_APP_ANBINDUNG, UI_EDITOR_VERTRAG, UI_PDF_ENTWURFSENTSCHEIDUNG). Tatsächliche m83Element/m83DomainButton/m83Slot-, m80EditorAttributes-/Ref-, Router-/Modulroute- und Acceptance-Harness-Pfade geprüft. Vorlage resources/sigeko/vorlagen/Vorankündigung-blanko.pdf mit dem PDF-Skill gerendert und visuell geprüft.

## A. Ausgabe und Paketziel

**UI.** Neue eigenständige SigekoPreNotificationScreen im Fachmodul SiGeKo. Ein zusammenhängendes, dokumentnahes Formular in Anordnung der Vorlage: Adressat, Titel, Punkte 1–9, Unterschriftsbereich. Die Bedienung ergänzt nur echte notwendige Aktionen; keine zusätzliche lange Verwaltungsmaske, keine Reiter oder Liste. Keine neue Tabelle oder Tabellenspalte.

S5.2 verwendet die in S5.1 integrierte Entwurfsschnittstelle. Keine PDF-/Mail-/Rücklaufbuttons, bevor deren Fachwege in späteren S5-Paketen tatsächlich umgesetzt sind. Dieser Entwurf ist kein PDF-Layoutvertrag und autorisiert keine Änderung am PDF-Renderer.

Die Vorlage enthält beispielhafte personenbezogene Koordinatordaten. Diese werden nicht als Standardwerte übernommen; die Anzeige verwendet ausschließlich die tatsächlich aufgelösten Projektrollen.

## B. Editorfähigkeit, Umfang und Integration

**Ja.** Neue Komponente `bbm.sigeko.preNotification`, neuer Scope `sigeko.preNotification`: exakt **98 statische Komponenten-Slots** mit Single-Refs. Zusätzlich ein vorhandenes Muster des optionalen gemeinsamen Header-Editorlaunchers: Scope insgesamt **99 Ziele**.

Bestehende Übersicht: exakt ein echter Einstieg `sigeko.screen.preNotification`; bisherige 206 Slots bleiben mit ihren IDs bestehen, danach **207 Slots / 208 Scopeziele** einschließlich ihres vorhandenen Launchers. Insgesamt deklariert dieser Entwurf **100 neue Ziele: 98 + 1 + 1**.

Die neue Ansicht ist ein eigenes Dokument, keine an die bereits lange Übersicht angehängte dritte Erfassungsmaske. Ein separater Scope vermeidet fehlende 206 Pflichtreferenzen beim Unmount der Übersicht. Registry/Manifest werden mit bestehenden gemeinsamen Mechanismen ergänzt; fremde Scope-Fingerprints bleiben unverändert.

## C. Vollständige Elementdeklaration

### Verbindliche gemeinsame Metadaten

Die folgenden beiden Tabellen beschreiben zusammen jeden einzelnen neuen Slot; keine Feldgruppe bleibt implizit. Die erste Tabelle enthält die sechs tatsächlichen DOM-Attribute wörtlich.

**Tatsächliche Attributableitung geprüft:** `m80Refs.applyAttributes` verwendet `m80Registry.m80EditorAttributes`. Dieser Helper setzt `data-ui-editor-kind = entry.type` (hier also root/group/fieldGroup/label/field/button). Es gibt in diesem produktiven Pfad keine Umwandlung zu frame oder single. `referenceKind: single` ist Slotmetadatum, kein DOM-kind.

Für jeden Slot zusätzlich:
- `id` gleich data-ui-inspector-id, `name` gleich data-ui-editor-label, `parentId` gleich data-ui-editor-parent; beim Root ist parentId null, sein tatsächlicher DOM-Attributwert ist die leere Zeichenfolge.
- `order` wie Tabelle; die jeweilige Komponente ist maßgeblich.
- `visible: true`, `editable: true`, `stableIdSource: declaration`, `registrationStatus: editorEnabled`.
- `semanticKey = refKey = id`; tatsächliche Registerreferenz komponentenlokal explizit über registerM80Ref.
- `allowedOps` entspricht der komma-getrennten Attributliste als Array; `lockedOps: [executeTargetAction, modifyDomainData, createRecord, deleteRecord]`.
- `hasVisibleText: true` für label/field/button, sonst false.
- `selectionLevels: [selectionKind]`, `spacingTargets: []`, `operationAffectedIds: {}`.
- `operationEffects`: je allowedOp groupWithChildren für selectionKind group, layoutZone für layoutZone, sonst elementOnly.
- `geometry: {maximumStoredOffset: 2400}`.
- `referenceKind: single`; presence/required in der zweiten Tabelle.
- `slot.requirements`: directSelection/move/resizeWidth/resizeHeight/setVisibility true, zusätzlich textResize true bei sichtbaren Texttypen.
- `slotId = id`. Alle 98 Screen-IDs stehen in requiredSlots. Der Übersichtseintrag wird ihrer requiredSlots-Liste hinzugefügt. Der Launcher besitzt requiredSlots [] und einen optionalen Slot.
- Normale `baseline`: x/y/textOffsetX/textOffsetY 0; width/height null; fontSize 12; visible true; spacing {}; minWidth 8; maxWidth 2400; minHeight 8; maxHeight 1600; minFontSize 6; maxFontSize 32.
- Launcher-baseline gemäß gemeinsamem launcherComponent: gleiche Basiswerte, minWidth 40/maxWidth 480/minHeight 24/maxHeight 160/minFontSize 6/maxFontSize 32.
- Keine table-/column-Metadaten, weil keine Tabelle existiert. Nicht zutreffende fieldKind/actionKind/componentKind werden nicht erfunden.
- Native Select-Optionen und fachliche Werte sind keine eigenen Editorziele.
- Punkt-4-Felder werden immer gemountet. Der Modus none blendet die zusammenhängende Kontaktgruppe fachlich aus und deaktiviert die Felder, ohne weitere dynamische IDs oder neue Datenquellen zu erzeugen.

### Alle sechs DOM-Attribute je Ziel

| Order | data-ui-inspector-id | data-ui-editor-kind | data-ui-editor-label | data-ui-editor-parent | data-ui-editor-editable | data-ui-editor-ops |
|---|---|---|---|---|---|---|
| 0 | sigeko.preNotification | root | Vorankündigung | "" | true | move,resizeWidth,resizeHeight,setVisibility |
| 1 | sigeko.preNotification.header | group | Kopfbereich | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility |
| 2 | sigeko.preNotification.header.title | label | SiGeKo – Vorankündigung | sigeko.preNotification.header | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 3 | sigeko.preNotification.header.project | label | Aktives Projekt | sigeko.preNotification.header | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 4 | sigeko.preNotification.actions | group | Vorankündigung bearbeiten | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility |
| 5 | sigeko.preNotification.actions.save | button | Speichern | sigeko.preNotification.actions | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 6 | sigeko.preNotification.actions.saveBack | button | Speichern und zurück | sigeko.preNotification.actions | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 7 | sigeko.preNotification.actions.back | button | Zurück zu SiGeKo | sigeko.preNotification.actions | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 8 | sigeko.preNotification.actions.reload | button | Neu laden | sigeko.preNotification.actions | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 9 | sigeko.preNotification.status | label | Speicherstatus | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 10 | sigeko.preNotification.readiness | label | Fehlende oder zu prüfende Angaben | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 11 | sigeko.preNotification.document | group | Vorankündigungsformular | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility |
| 12 | sigeko.preNotification.document.title | label | Vorankündigung (gem. § 2 (2) BaustellV) | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 13 | sigeko.preNotification.authority | group | Arbeitsschutzbehörde | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 14 | sigeko.preNotification.authority.title | label | An die Arbeitsschutzbehörde | sigeko.preNotification.authority | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 15 | sigeko.preNotification.authority.value | label | Zuständige Behörde | sigeko.preNotification.authority | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 16 | sigeko.preNotification.authority.edit | button | Behördenzuordnung bearbeiten | sigeko.preNotification.authority | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 17 | sigeko.preNotification.p1 | group | 1 Ort der Baustelle | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 18 | sigeko.preNotification.p1.title | label | 1 Ort der Baustelle | sigeko.preNotification.p1 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 19 | sigeko.preNotification.p1.value | label | Baustellenadresse | sigeko.preNotification.p1 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 20 | sigeko.preNotification.p1.edit | button | Projektadresse bearbeiten | sigeko.preNotification.p1 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 21 | sigeko.preNotification.p2 | group | 2 Name und Anschrift des Bauherrn | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 22 | sigeko.preNotification.p2.title | label | 2 Name und Anschrift des Bauherrn | sigeko.preNotification.p2 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 23 | sigeko.preNotification.p2.value | label | Bauherr – Name und Anschrift | sigeko.preNotification.p2 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 24 | sigeko.preNotification.p2.edit | button | Bauherr im Projekt bearbeiten | sigeko.preNotification.p2 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 25 | sigeko.preNotification.p3 | group | 3 Art des Bauvorhabens | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 26 | sigeko.preNotification.p3.title | label | 3 Art des Bauvorhabens | sigeko.preNotification.p3 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 27 | sigeko.preNotification.p3.buildingType | fieldGroup | Art des Bauvorhabens – Feldgruppe | sigeko.preNotification.p3 | true | move,resizeWidth,resizeHeight,setVisibility |
| 28 | sigeko.preNotification.p3.buildingType.label | label | Art des Bauvorhabens | sigeko.preNotification.p3.buildingType | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 29 | sigeko.preNotification.p3.buildingType.input | field | Art des Bauvorhabens | sigeko.preNotification.p3.buildingType | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 30 | sigeko.preNotification.p3.source | label | Herkunft der Bauvorhabenangabe | sigeko.preNotification.p3 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 31 | sigeko.preNotification.p3.reset | button | Lokale Bauvorhabenangabe zurücksetzen | sigeko.preNotification.p3 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 32 | sigeko.preNotification.p4 | group | 4 Name und Anschrift des verantwortlichen Dritten | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 33 | sigeko.preNotification.p4.title | label | 4 Name und Anschrift des verantwortlichen Dritten | sigeko.preNotification.p4 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 34 | sigeko.preNotification.p4.mode | fieldGroup | Beauftragter Dritter – Feldgruppe | sigeko.preNotification.p4 | true | move,resizeWidth,resizeHeight,setVisibility |
| 35 | sigeko.preNotification.p4.mode.label | label | Beauftragter Dritter | sigeko.preNotification.p4.mode | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 36 | sigeko.preNotification.p4.mode.input | field | Beauftragter Dritter | sigeko.preNotification.p4.mode | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 37 | sigeko.preNotification.p4.contact | group | Freie Angaben zum beauftragten Dritten | sigeko.preNotification.p4 | true | move,resizeWidth,resizeHeight,setVisibility |
| 38 | sigeko.preNotification.p4.contact.name | fieldGroup | Name – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 39 | sigeko.preNotification.p4.contact.name.label | label | Name | sigeko.preNotification.p4.contact.name | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 40 | sigeko.preNotification.p4.contact.name.input | field | Name | sigeko.preNotification.p4.contact.name | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 41 | sigeko.preNotification.p4.contact.street | fieldGroup | Straße / Hausnummer – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 42 | sigeko.preNotification.p4.contact.street.label | label | Straße / Hausnummer | sigeko.preNotification.p4.contact.street | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 43 | sigeko.preNotification.p4.contact.street.input | field | Straße / Hausnummer | sigeko.preNotification.p4.contact.street | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 44 | sigeko.preNotification.p4.contact.zip | fieldGroup | Postleitzahl – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 45 | sigeko.preNotification.p4.contact.zip.label | label | Postleitzahl | sigeko.preNotification.p4.contact.zip | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 46 | sigeko.preNotification.p4.contact.zip.input | field | Postleitzahl | sigeko.preNotification.p4.contact.zip | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 47 | sigeko.preNotification.p4.contact.city | fieldGroup | Ort – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 48 | sigeko.preNotification.p4.contact.city.label | label | Ort | sigeko.preNotification.p4.contact.city | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 49 | sigeko.preNotification.p4.contact.city.input | field | Ort | sigeko.preNotification.p4.contact.city | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 50 | sigeko.preNotification.p4.contact.phone | fieldGroup | Telefon – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 51 | sigeko.preNotification.p4.contact.phone.label | label | Telefon | sigeko.preNotification.p4.contact.phone | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 52 | sigeko.preNotification.p4.contact.phone.input | field | Telefon | sigeko.preNotification.p4.contact.phone | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 53 | sigeko.preNotification.p4.contact.email | fieldGroup | E-Mail – Feldgruppe | sigeko.preNotification.p4.contact | true | move,resizeWidth,resizeHeight,setVisibility |
| 54 | sigeko.preNotification.p4.contact.email.label | label | E-Mail | sigeko.preNotification.p4.contact.email | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 55 | sigeko.preNotification.p4.contact.email.input | field | E-Mail | sigeko.preNotification.p4.contact.email | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 56 | sigeko.preNotification.p5 | group | 5 Name und Anschrift des Koordinators / der Koordinatoren | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 57 | sigeko.preNotification.p5.title | label | 5 Name und Anschrift des Koordinators / der Koordinatoren | sigeko.preNotification.p5 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 58 | sigeko.preNotification.p5.planning | group | Während der Planung der Ausführung | sigeko.preNotification.p5 | true | move,resizeWidth,resizeHeight,setVisibility |
| 59 | sigeko.preNotification.p5.planning.title | label | Während der Planung der Ausführung | sigeko.preNotification.p5.planning | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 60 | sigeko.preNotification.p5.planning.value | label | SiGeKo Planung | sigeko.preNotification.p5.planning | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 61 | sigeko.preNotification.p5.execution | group | Während der Ausführung des Bauvorhabens | sigeko.preNotification.p5 | true | move,resizeWidth,resizeHeight,setVisibility |
| 62 | sigeko.preNotification.p5.execution.title | label | Während der Ausführung des Bauvorhabens | sigeko.preNotification.p5.execution | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 63 | sigeko.preNotification.p5.execution.value | label | SiGeKo Ausführung | sigeko.preNotification.p5.execution | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 64 | sigeko.preNotification.p5.edit | button | SiGeKo-Projektrollen bearbeiten | sigeko.preNotification.p5 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 65 | sigeko.preNotification.p6 | group | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 66 | sigeko.preNotification.p6.title | label | 6 Voraussichtlicher Beginn und Dauer der Arbeiten | sigeko.preNotification.p6 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 67 | sigeko.preNotification.p6.start | fieldGroup | Voraussichtlicher Beginn – Feldgruppe | sigeko.preNotification.p6 | true | move,resizeWidth,resizeHeight,setVisibility |
| 68 | sigeko.preNotification.p6.start.label | label | Voraussichtlicher Beginn | sigeko.preNotification.p6.start | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 69 | sigeko.preNotification.p6.start.input | field | Voraussichtlicher Beginn | sigeko.preNotification.p6.start | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 70 | sigeko.preNotification.p6.source | label | Herkunft des Baubeginns | sigeko.preNotification.p6 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 71 | sigeko.preNotification.p6.reset | button | Baubeginn aus Projekt übernehmen | sigeko.preNotification.p6 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 72 | sigeko.preNotification.p6.duration | fieldGroup | Voraussichtliche Dauer in ganzen Monaten – Feldgruppe | sigeko.preNotification.p6 | true | move,resizeWidth,resizeHeight,setVisibility |
| 73 | sigeko.preNotification.p6.duration.label | label | Voraussichtliche Dauer in ganzen Monaten | sigeko.preNotification.p6.duration | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 74 | sigeko.preNotification.p6.duration.input | field | Voraussichtliche Dauer in ganzen Monaten | sigeko.preNotification.p6.duration | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 75 | sigeko.preNotification.p7 | group | 7 Voraussichtliche Höchstzahl der Beschäftigten | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 76 | sigeko.preNotification.p7.title | label | 7 Voraussichtliche Höchstzahl der Beschäftigten | sigeko.preNotification.p7 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 77 | sigeko.preNotification.p7.workers | fieldGroup | Höchstzahl Beschäftigte – Feldgruppe | sigeko.preNotification.p7 | true | move,resizeWidth,resizeHeight,setVisibility |
| 78 | sigeko.preNotification.p7.workers.label | label | Höchstzahl Beschäftigte | sigeko.preNotification.p7.workers | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 79 | sigeko.preNotification.p7.workers.input | field | Höchstzahl Beschäftigte | sigeko.preNotification.p7.workers | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 80 | sigeko.preNotification.p8 | group | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 81 | sigeko.preNotification.p8.title | label | 8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte | sigeko.preNotification.p8 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 82 | sigeko.preNotification.p8.employers | fieldGroup | Anzahl Arbeitgeber – Feldgruppe | sigeko.preNotification.p8 | true | move,resizeWidth,resizeHeight,setVisibility |
| 83 | sigeko.preNotification.p8.employers.label | label | Anzahl Arbeitgeber | sigeko.preNotification.p8.employers | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 84 | sigeko.preNotification.p8.employers.input | field | Anzahl Arbeitgeber | sigeko.preNotification.p8.employers | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 85 | sigeko.preNotification.p8.selfEmployed | fieldGroup | Anzahl Unternehmer ohne Beschäftigte – Feldgruppe | sigeko.preNotification.p8 | true | move,resizeWidth,resizeHeight,setVisibility |
| 86 | sigeko.preNotification.p8.selfEmployed.label | label | Anzahl Unternehmer ohne Beschäftigte | sigeko.preNotification.p8.selfEmployed | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 87 | sigeko.preNotification.p8.selfEmployed.input | field | Anzahl Unternehmer ohne Beschäftigte | sigeko.preNotification.p8.selfEmployed | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 88 | sigeko.preNotification.p9 | group | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 89 | sigeko.preNotification.p9.title | label | 9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte | sigeko.preNotification.p9 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 90 | sigeko.preNotification.p9.firmsMode | fieldGroup | Firmenangabe – Feldgruppe | sigeko.preNotification.p9 | true | move,resizeWidth,resizeHeight,setVisibility |
| 91 | sigeko.preNotification.p9.firmsMode.label | label | Firmenangabe | sigeko.preNotification.p9.firmsMode | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 92 | sigeko.preNotification.p9.firmsMode.input | field | Firmenangabe | sigeko.preNotification.p9.firmsMode | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 93 | sigeko.preNotification.p9.hint | label | Hinweis zur Firmenlistenanlage | sigeko.preNotification.p9 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 94 | sigeko.preNotification.p9.edit | button | Projektfirmenliste öffnen | sigeko.preNotification.p9 | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 95 | sigeko.preNotification.signature | group | Unterschrift durch Bauherr oder beauftragten Dritten | sigeko.preNotification.document | true | move,resizeWidth,resizeHeight,setVisibility |
| 96 | sigeko.preNotification.signature.placeDate | label | Ort / Datum – handschriftlich zu ergänzen | sigeko.preNotification.signature | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 97 | sigeko.preNotification.signature.signer | label | Bauherr / Beauftragter Dritter – Unterschrift | sigeko.preNotification.signature | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 206 | sigeko.screen.preNotification | button | Vorankündigung öffnen | sigeko.screen.navigation | true | move,resizeWidth,resizeHeight,setVisibility,textResize |
| 98 | sigeko.preNotification.header.action.openUiEditor | button | UI-Editor öffnen | sigeko.preNotification | true | move,resizeWidth,resizeHeight,setVisibility,textResize |

### Registry- und Slotklassifikation je Ziel

| ID | type | role | componentId / scopeId | fieldKind / actionKind / componentKind | selectionKind | presence / required |
|---|---|---|---|---|---|---|
| sigeko.preNotification | root | scopeRoot | bbm.sigeko.preNotification / sigeko.preNotification | – | layoutZone | always / true |
| sigeko.preNotification.header | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.header.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.header.project | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.actions | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.actions.save | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=savePreNotification; – | button | always / true |
| sigeko.preNotification.actions.saveBack | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=savePreNotificationAndNavigate; – | button | always / true |
| sigeko.preNotification.actions.back | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateSigeko; – | button | always / true |
| sigeko.preNotification.actions.reload | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=reloadPreNotification; – | button | always / true |
| sigeko.preNotification.status | label | status | bbm.sigeko.preNotification / sigeko.preNotification | – | statusText | always / true |
| sigeko.preNotification.readiness | label | status | bbm.sigeko.preNotification / sigeko.preNotification | – | statusText | always / true |
| sigeko.preNotification.document | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.document.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.authority | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.authority.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.authority.value | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.authority.edit | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateSigekoAuthorities; – | button | always / true |
| sigeko.preNotification.p1 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p1.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p1.value | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p1.edit | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateProjectForm; – | button | always / true |
| sigeko.preNotification.p2 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p2.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p2.value | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p2.edit | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateProjectForm; – | button | always / true |
| sigeko.preNotification.p3 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p3.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p3.buildingType | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p3.buildingType.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p3.buildingType.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p3.source | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p3.reset | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=resetPreNotificationBuildingType; – | button | always / true |
| sigeko.preNotification.p4 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.mode | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.mode.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.mode.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=select; componentKind=select | field | always / true |
| sigeko.preNotification.p4.contact | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.name | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.name.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.name.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p4.contact.street | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.street.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.street.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p4.contact.zip | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.zip.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.zip.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p4.contact.city | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.city.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.city.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p4.contact.phone | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.phone.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.phone.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p4.contact.email | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p4.contact.email.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p4.contact.email.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=text; componentKind=input | field | always / true |
| sigeko.preNotification.p5 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p5.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p5.planning | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p5.planning.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p5.planning.value | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p5.execution | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p5.execution.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p5.execution.value | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p5.edit | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateSigekoRoles; – | button | always / true |
| sigeko.preNotification.p6 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p6.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p6.start | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p6.start.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p6.start.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=date; componentKind=input | field | always / true |
| sigeko.preNotification.p6.source | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p6.reset | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=resetPreNotificationPlannedStart; – | button | always / true |
| sigeko.preNotification.p6.duration | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p6.duration.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p6.duration.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=number; componentKind=input | field | always / true |
| sigeko.preNotification.p7 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p7.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p7.workers | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p7.workers.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p7.workers.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=number; componentKind=input | field | always / true |
| sigeko.preNotification.p8 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p8.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p8.employers | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p8.employers.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p8.employers.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=number; componentKind=input | field | always / true |
| sigeko.preNotification.p8.selfEmployed | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p8.selfEmployed.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p8.selfEmployed.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=number; componentKind=input | field | always / true |
| sigeko.preNotification.p9 | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p9.title | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p9.firmsMode | fieldGroup | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.p9.firmsMode.label | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p9.firmsMode.input | field | dataFieldLayout | bbm.sigeko.preNotification / sigeko.preNotification | fieldKind=select; componentKind=select | field | always / true |
| sigeko.preNotification.p9.hint | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.p9.edit | button | domainActionLayout | bbm.sigeko.preNotification / sigeko.preNotification | actionKind=navigateProjectFirms; – | button | always / true |
| sigeko.preNotification.signature | group | layout | bbm.sigeko.preNotification / sigeko.preNotification | – | group | always / true |
| sigeko.preNotification.signature.placeDate | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.preNotification.signature.signer | label | content | bbm.sigeko.preNotification / sigeko.preNotification | – | label | always / true |
| sigeko.screen.preNotification | button | domainActionLayout | bbm.sigeko.screen / sigeko.screen | actionKind=navigatePreNotification; – | button | always / true |
| sigeko.preNotification.header.action.openUiEditor | button | domainActionLayout | bbm.sigeko.preNotification.mainHeaderLauncher / sigeko.preNotification | actionKind=openUiEditor; componentKind=developmentLauncher | button | whenVisibleInstances / false |

## D. Gesperrte Fachaktionen und Datenregeln

Editoränderungen betreffen ausschließlich Layout und Darstellung. Ausführung eines Buttons, Speichern, Speichern-und-zurück, Navigation, Neuladen, lokale Override-Resets, Feldänderungen, Modulprüfung, IPC-/DB-Aktionen und spätere PDF-/Mailvorgänge sind keine Editoroperationen. Domain-Locks gelten für jedes Ziel.

Nur bestehende S5.1-Schnittstellen:
- `sigekoGetPreNotification({projectId})`.
- `sigekoSavePreNotification({projectId, expectedRevision, patch})`.

Authority, Baustellenadresse, zentraler Bauherr und beide aufgelösten SiGeKo-Rollen werden schreibgeschützt angezeigt. Bearbeiten öffnet den bereits zuständigen Bereich. Keine zweite Behördenverwaltung oder zentrale Kontaktpflege in der VA. „Wie Planung“ bleibt im bestehenden Rollenbereich; beide Rollen werden getrennt und mit ihren aktuellen Kontaktangaben dargestellt.

Lokale Felder:
- Punkt 3: building_type_override; zentraler Wert nur falls tatsächlich vorhanden. Projekttitel wird niemals als Bauvorhabenart geraten.
- Punkt 4: third_party_mode exakt none / free; sichtbare Optionen „Nicht vorhanden“ / „Freie Eingabe“. Sechs Kontaktfelder gehören nur zur VA. Wechsel auf none wird erst durch ausdrücklich erfolgreiches Speichern persistent; beim Zurückschalten vor dem Speichern darf der lokale noch nicht verworfene Kontaktentwurf erhalten bleiben. Beim Save none werden keine widersprüchlichen Kontaktwerte gesendet.
- Punkt 6: planned_start_override; tatsächlicher geplanter Baubeginn als Live-Vorgabe. Ein unverändert vorgefülltes Datum bleibt beim Speichern anderer Felder override null. Reset setzt nur den lokalen Override null und zeigt den zentralen Wert wieder. Dauer ausschließlich manuell, positive ganze Monate, nie aus Beginn/Ende berechnet.
- Punkte 7/8: drei eigene Zahlenangaben, nicht negative ganze Zahlen. Leere Eingabe bleibt null, nicht automatisch null→0 oder ""→0. Keine Ableitung aus Firmenanzahl.
- Punkt 9: firms_mode exakt unknown / attachment; die Optionen lauten „Noch nicht bekannt“ und „Firmenliste im Anhang“. Hinweis beschreibt die vorhandene Projektfirmenliste als spätere Anlage, ohne PDF-Erstellung zu behaupten. Keine Firmen-Einzelwahl oder VA-Firmenpflege.
- Unterschriftsbereich: Ort/Datum und Unterschrift bleiben vollständig frei für die handschriftliche Ergänzung, ohne Fachdatenfelder oder automatische Datumswerte.

Unvollständige Entwürfe dürfen gespeichert werden. Readiness ist keine Berechtigung und kein Fertigstatus. Für spätere finale PDFs gilt die bestätigte Behörde als eigene fachliche Voraussetzung, die S5.2 noch nicht als PDF-Aktion implementiert.

## E. Echte Parent-, Navigations-, Lade- und Bedienstruktur

Jeder deklarierte Parent ist ein tatsächlich registrierter unmittelbarer DOM-Parent. Keine unsichtbaren zusätzlichen Wrapper zwischen Ziel und deklariertem Parent; nötige Layoutbeziehungen liegen direkt auf den deklarierten Gruppen. Root wird im bestehenden View-Host gemountet. Der gemeinsame Headerlauncher folgt dem bereits etablierten externen Header-Vertrag und seinem Scope-Parent.

Dokumentfläche mit responsiver Maximalbreite, weißem Hintergrund und gut lesbarer normaler UI-Schrift. Vorlagenreihenfolge bleibt erhalten, Punkt 5 besitzt zwei nebeneinanderliegende Rollenbereiche bei ausreichender Breite, sonst untereinander. Keine feste A4-Pixelhöhe oder verkleinerte Druckschrift in der Bedienung. Ein vertikaler Scrollweg. Buttons und lange Texte umbrechen.

Aktionsleiste im Sichtbereich sticky oben, alle vier Aktionen erreichbar: Speichern / Speichern und zurück / Zurück zu SiGeKo / Neu laden. Fokus-/Scrollabstände verhindern Überdeckung der angesprungenen Felder. Schmale und niedrige Fenster werden real geprüft, ausdrücklich auch während Punkt 9 und Unterschrift sichtbar sind.

Modulrouting verwendet vorhandenes `routing.project` im SiGeKo-Deskriptor:
- Die bisherige einzelne Projekt-Navigation bleibt bestehen; kein zusätzlicher globaler VA-Projekteintrag.
- Einstieg `router.openProjectModule(projectId, "sigeko", {project, screen:"preNotification"})`.
- Zurück `router.openProjectModule(projectId, "sigeko", {project})`.
- Adapter wählt genau den bekannten Unterbildschirm und verwendet den tatsächlich vorhandenen öffentlichen View-Host `await router.show(view, {section:"sigeko", isTopsView:false, hideSidebar:true, pageTitle, activeModuleLabel:"SiGeKo"})`. Router.js definiert `async show`; ein `router._show`-Pfad existiert hier nicht. Der Adapter erhält vom vorhandenen moduleRouteRuntime nur router/moduleEntry/projectId/project/options, ausdrücklich keinen show-Callback.
- Nur fehlende/leere Screen-Option und der explizite Übersichtswert "sigeko" wählen die Übersicht; "preNotification" wählt die VA. Andere nicht leere Werte werden ausdrücklich mit false abgelehnt, ohne die aktuelle Ansicht zu ersetzen. Keine dynamischen Imports aus unvalidierten Optionen.
- Die gemeinsame Freigabeprüfung von openProjectModule bleibt wirksam.
- Keine Änderung an Router.js nötig. Der existierende generische openModuleEntry übergibt beliebige options nicht automatisch an Konstruktoren; deshalb kein wirkungsloser options.view-Ansatz.
- Modulinterner focusSection-Wert darf gezielt nach Montage in den bereits vorhandenen Rollen-/Behördenbereich scrollen.
- Projektbearbeitung über `router.showProjectForm({projectId})`, Firmen über `router.showProjectFirms(projectId)`.

Vor Ersetzen der Übersicht werden deren ungespeicherte Profil-/Rollen-/Behördenentwürfe über bestehenden `_navigate`-Verwerfschutz berücksichtigt. Der eigentliche frische Readiness-Check und genau eine native Fortfahren-Bestätigung liegen im modul-lokalen routing.project-Adapter für screen "preNotification"; dadurch gilt dieselbe Prüfung auch bei direktem autorisiertem Moduleinstieg. Der Übersichtsknopf enthält keinen zweiten Readiness-Dialog. Rot oder Orange verlangt bewusste Bestätigung zum Fortfahren; Ablehnen lässt die bestehende Ansicht erhalten. Kein falsches Grün bei technischem Lesefehler: Fehler sichtbar/retryfähig, keine alte Freigabe verwenden. Der Adapter ersetzt die Ansicht bei Abbruch oder technischem Lesefehler nicht und meldet false. Die Bestätigung ist kein fachlicher Schreibvorgang und keine eigene DOM-Editorstruktur.

VA-Laden ist unabhängig von den sonstigen Erfassungsanfragen der Übersicht. Technisch fehlende VA-Daten sperren allein die betroffene Save-Aktion, nicht unbeteiligte Erfassungsformulare. Readiness-Fehlstellen werden in der VA dargestellt und blockieren deren Bearbeitung nicht.

Antworten nur bei übereinstimmendem projectId/zentralem Projekt verwenden. Alive-/Sequenzschutz verwirft zerstörte und überholte Antworten. Mutationen erfordern bekannte passende nicht archivierte Projektdaten, gelesene Revision und keine bereits laufende Mutation.

Dirty-Schutz gilt vor den eigenen Navigationsaktionen dieser Ansicht und vor dem ausdrücklich ersetzenden „Neu laden“. Die gemeinsame Shell besitzt weiterhin keinen allgemeinen abbrechbaren Navigationsschutz; globale Headerwechsel sind dadurch nicht abgesichert. Während des Ladens sind die eigenen Navigationen und Neuladen zusätzlich gesperrt. Abbruch lässt den kompletten Entwurf erhalten. Save-and-back navigiert erst nach erfolgreichem Speichern; bei Validierungs-, CAS- oder Zugriffsfehler bleibt die Ansicht mit Eingaben sichtbar. CAS-Konflikt übernimmt keine neue Revision hinter einem alten Entwurf. Erneutes Laden fordert bewusstes Verwerfen an. Save-/Reload-Ergebnisse nach destroy wirken nicht auf den neuen Screen.

## F. Verifikation und Dateieigentum

### Nachgewiesene Integrationskorrektur vor Umsetzung

Die beiden getrennt gemounteten Scopes dürfen nicht dieselbe Profildatei ersetzen: der vorhandene Kit-Store speichert nur aktive Scopes und ersetzt die gesamte Datei. Deshalb erhält ausschließlich `sigeko.preNotification` die explizit deklarierte vorhandene `layoutStorageKey`-Option `module-sigeko-prenotification`; Übersicht bleibt `module-sigeko`. Der vorhandene Renderer-Startrestore-Cache wird anhand derselben deklarierten Identität getrennt. Keine neue Speicherengine, keine Kit-Änderung und keine Fachdaten im Schlüssel. Diese kleine gemeinsame Adapteranbindung wird separat committed und mit tatsächlichen Profildateien/Restore, unveränderten bisherigen Modulschlüsseln und A/B-Projektunabhängigkeit geprüft. Zusätzlich wird der neue, oben vollständig deklarierte Headerlauncher in die vorhandene Core-Shell-Bindung aufgenommen. Keine zusätzlichen UI-Ziele durch diese Korrektur.

Geplante technische Prüfungen sind noch keine ausgeführten PASS-Nachweise.

UI-Owner:
- neue `src/renderer/modules/sigeko/SigekoPreNotificationScreen.js`;
- neuer gleichnamiger `.uiEditorContract.js`;
- `SigekoScreen.js`, vorhandener Übersichtsvertrag, SiGeKo `index.js`.

Integrations-Owner:
- `src/renderer/ui-editor/m80Registry.js`;
- `src/renderer/ui/MainHeader.uiEditorContract.js`;
- vorhandenes Manifest/Registry-Fingerprint und gezielte Entry-/Manifesttests.

Test-Owner:
- neuer `scripts/tests/sigekoPreNotificationForm.test.cjs`;
- vorhandene Testregistrierung;
- bestehender echter Electron-Acceptance-Runner und HTML-Harness;
- bestehender SiGeKo-Workflow nur soweit neue gezielte Prüfungen/Artefakte eingebunden werden müssen.

Prüfpflicht:
1. Kit-Komponentenvalidierung mit `{components: BBM_M83_COMPONENT_CONTRACTS}`, nicht versehentlich leerer Array-Signatur; alle 98 echte Single-Refs, vollständige tatsächliche DOM-Attribute, ID-Eindeutigkeit, echte Parents, gültige Rollen/Operationen, keine Domainaktionen durch Editor.
2. Neuer Scope + gemeinsamer Launcher wirklich registriert; alte 206 Überblicksziele vorhanden; Fremdscopes unverändert.
3. Live-Vorbelegung ohne impliziten Draft; unveränderte Startvorgabe bleibt Override null; einzelne Overrides/Reset; manuelle Dauer; null/0; Ganzzahlen.
4. Punkt-4-Modi/Entwurfserhalt/gespeichertes Löschen; Punkt-9 exakt zwei Optionen, keine Einzelpflege, Fehler bei leerer Anlage.
5. Save/Reopen/Save-and-back; abgebrochene Navigation/Reload; CAS-Konflikt und Entwurfserhalt; unabhängige/überholte Reads; fehlende/fremde Projektdaten; Archive-/Lizenzschutz; Projekte A/B isoliert.
6. Frische Einstiegwarnung akzeptieren/ablehnen; Readinessfehler bleiben sichtbar; fehlende Pflichtangaben weiterhin bearbeitbar.
7. Echter Windows-/Linux-Electronlauf mit breitem, schmalem und niedrigem Fenster, direkter Bedienung, Feldreihenfolge, Dropdowns, persistenten Aktionen, erreichbarem Speichern/Zurück bei tiefem Scrollstand, ohne horizontalen Überlauf; Screenshots visuell prüfen.
8. Editor-Layoutoperation an einem neuen Ziel ändert keine Fachdaten-/Prozessdatenbank.
9. Der bisherige Test `getSigekoModuleEntry().routing === undefined` wird bewusst durch den verhaltensbezogenen Nachweis des neuen lokalen Adapters ersetzt. Keine Router-Engine erweitern.
10. Volltestvergleich gegen den tatsächlich integrierten S5.1-Stand; bekannte 97 Baselinefehler anhand Namen und Häufigkeit abgrenzen, keine pauschale Behauptung „alles CI grün“.

Der bestehende Legacy-CLI `scripts/ui-editor-contract-check.cjs` unterstützt diesen M83-Komponentenpfad nicht. Maßgeblich sind die vorhandene Kit-Komponentenvalidierung, die vollständigen gemounteten Ref-/DOM-Verträge und die echte Electron-Abnahme; kein grüner Legacy-CLI-Check wird behauptet.

Ausgangsbasis/Integration: aktueller main enthält S5.1 sowie gemeinsam genutzte S1–S4-Infrastruktur. Keine Integration von Rechnungsbranches. S5.2 ändert ausschließlich SiGeKo-UI und deren explizite gemeinsame Registry-/Headeranbindung sowie Tests/Dokumentation. PDF-/Mail-/Ablagedienste und Rechnung bleiben unverändert.

Arbeitsmodus: Goal-Lauf mit getrennten UI-, Test-/Harness- und Reviewaufgaben. Echter Computer-Use-Nachweis durch vorhandene isolierte Windows-/Linux-Electron-Harness-Erweiterung erforderlich. Abschluss erst nach behobenen Befunden, exakter Baselineabgrenzung, PR-Review, Integration und GitHub-Dokumentation; danach unmittelbar nächstes Paket.
