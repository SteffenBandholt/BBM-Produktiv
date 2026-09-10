# S5.3b2 – verbindlicher UI-Entwurf

Vom Hauptagenten ausgewertet und für S5.3b2 vor Code festgelegt. Basis main c7103ae5e74795defb77fdc9d15809054d9cb983, Branch codex/sigeko-s53b2-vorankuendigung-pdf. Die vollständige 81-Ziele-PDF-Entscheidung steht in SIGEKO_S5_3B2_PDF_ENTWURF.md; Workflow-/Dateivertrag in SIGEKO_S5_3B2_WORKFLOW.md. Beide Entscheidungen werden zusammen verwendet. Keine Mail-/Rücklaufaktionen aus S5.4; Rechnung #275 bleibt eingefroren.

## A. Art der Ausgabe und sichtbarer Aufbau

UI im bestehenden `SigekoPreNotificationScreen`, ohne neue Route und ohne eigene Liste als Screen. Drei zusätzliche Aktionen in der vorhandenen oben fixierten, umbrechenden Aktionsleiste: **PDF-Vorschau**, **PDF erstellen**, **PDF-Layout bearbeiten**. Die bestehenden vier Aktionen Speichern / Speichern und zurück / Zurück zu SiGeKo / Neu laden bleiben als erste vier Elemente erhalten.

Unter den bestehenden Readiness-Hinweisen, vor dem Formular, ein kompakter Abschnitt **PDF-Fassungen**: native Auswahl gespeicherter Fassungen, kurze Angaben zur ausgewählten Fassung, zwei Aktionen **Gespeicherte PDF öffnen** und **Firmenanlage öffnen**, eine Status-/Fehlerzeile. Die aktuelle neueste Fassung ist nach dem Laden vorausgewählt. Nach erfolgreicher neuer Erstellung ist genau diese Fassung ausgewählt. Ältere Fassungen bleiben über denselben Select erreichbar; eine reine Letzte-Fassung-Anzeige würde die einmal erzeugten unveränderlichen Fassungen ohne fachlichen Öffnungsweg zurücklassen. Dafür genügt der native Select; keine Tabelle, keine erfundenen Spalten, keine Zeilenaktionen, kein zweiter Tabelleneditor.

Optionstext: lokal formatiertes Erstellungsdatum mit Uhrzeit, kurzer sicherer Dateiname. Option-value ist serverseitige Dokument-ID; keine Ableitung der ID aus Titel/Datum. Bei gleichem Zeitstempel macht der Dateiname die Fassung unterscheidbar. Sortierung Main-seitig newest first, deterministischer ID-Tiebreaker. Nach einfachem Bestandsreload bleibt vorhandene Auswahl erhalten; ist sie nicht mehr vorhanden, neueste Fassung auswählen und dies im Status benennen.

Infozeile: „Erstellt am … · <Dateiname> · mit Firmenanlage“ bzw. „ohne Firmenanlage“. Keine Ampelfarbe und kein Wort „versendet“, „erledigt“ oder „abgeschlossen“. Leerzustand: „Noch keine PDF-Fassung erstellt.“ Firmenanlagenbutton bleibt als Pflichtref gemountet und wird ohne Anlage deaktiviert; Infozeile nennt den Grund. So stimmt auch der leere/archivierte Zustand mit dem vollständigen Komponentenvertrag überein.

## B. Editorfähigkeit

Ja, ausschließlich Präsentation über denselben vorhandenen komponentennahen M83-Vertrag `bbm.sigeko.preNotification`, Scope `sigeko.preNotification`. Kein zweiter Scope, kein neuer Headerlauncher und kein zusätzliches UI-Profil. Es kommen exakt **13 erforderliche Einzelrefs** hinzu: vorhandene 98 → **111 Pflichtslots**, mit unverändertem optionalem MainHeaderlauncher **112 Scopeziele**. Registryversion 35 → **36**, Fingerprint aus tatsächlichem Gesamtvertrag neu berechnen. Fremde Scopes und die SiGeKo-Übersicht bleiben unverändert.

Neue Deklarationen an die vorhandene Liste anhängen, sodass alle 98 bisherigen `order`-Werte stabil bleiben. Der DOM-Bau fügt die drei Aktionselemente in `actions` und den neuen Abschnitt an der beschriebenen sichtbaren Stelle ein. Deklarative Reihenfolge ist stabile Registry-Metadatenfolge, keine automatische DOM-Sortierung und kein fachliches Umsortieren.

`m83Element` / `m83DomainButton` / `m83Slot` bleiben die einzige Deklarationsquelle. Keine automatische DOM-Erkennung. Alle neuen Ziele `visible:true`, `editable:true`, `stableIdSource:'declaration'`, `semanticKey/refKey` jeweils identisch mit vollständiger ID. `m83Slot` jeweils `required:true`, `referenceKind:'single'`, `presence:'always'`.

## C. Vollständige neue Elemente

Baseline für alle neuen Ziele aus demselben vorhandenen `defaultM83Baseline`: `x:0,y:0,width:null,height:null,textOffsetX:0,textOffsetY:0,fontSize:12,visible:true,spacing:{},minWidth:8,maxWidth:2400,minHeight:8,maxHeight:1600,minFontSize:6,maxFontSize:32`; `geometry.maximumStoredOffset:2400`. Nullbreite/-höhe bedeuten vorhandene reale DOM-Erfassung, keine Nullpixelbox. Tatsächlich gemessene breite/schmale/kurze Fensterwerte müssen im Formulartest erfasst werden; hier wird keine noch nicht ausgeführte DOM-Messung behauptet.

Operationen `G = move,resizeWidth,resizeHeight,setVisibility`; `T = move,resizeWidth,resizeHeight,setVisibility,textResize`. Gruppen/fieldGroup G, Texte/Felder/Buttons T. Für jedes Element `lockedOps` exakt bestehendes `DOMAIN_LOCKS = executeTargetAction,modifyDomainData,createRecord,deleteRecord`. Keine Fachaktion, Auswahländerung, PDF-Erzeugung oder Öffnung darf vom Editor ausgeführt werden. Weitere nicht freigegebene Operationen werden nicht angeboten.

| order | Vollständige ID | Parent | type / role | name | actionKind / fieldKind / componentKind | Ops |
|---:|---|---|---|---|---|---|
| 98 | `sigeko.preNotification.actions.pdfPreview` | `sigeko.preNotification.actions` | button / domainActionLayout | PDF-Vorschau | previewPreNotificationPdf | T |
| 99 | `sigeko.preNotification.actions.pdfCreate` | `sigeko.preNotification.actions` | button / domainActionLayout | PDF erstellen | createPreNotificationPdf | T |
| 100 | `sigeko.preNotification.actions.pdfLayout` | `sigeko.preNotification.actions` | button / domainActionLayout | PDF-Layout bearbeiten | editPreNotificationPdfLayout | T |
| 101 | `sigeko.preNotification.pdf` | `sigeko.preNotification` | group / layout | PDF-Fassungen | — | G |
| 102 | `sigeko.preNotification.pdf.title` | `sigeko.preNotification.pdf` | label / content | PDF-Fassungen | — | T |
| 103 | `sigeko.preNotification.pdf.selection` | `sigeko.preNotification.pdf` | fieldGroup / layout | Gespeicherte Fassung – Feldgruppe | — | G |
| 104 | `sigeko.preNotification.pdf.selection.label` | `sigeko.preNotification.pdf.selection` | label / content | Gespeicherte Fassung | — | T |
| 105 | `sigeko.preNotification.pdf.selection.input` | `sigeko.preNotification.pdf.selection` | field / dataFieldLayout | Gespeicherte Fassung | fieldKind:select; componentKind:select | T |
| 106 | `sigeko.preNotification.pdf.info` | `sigeko.preNotification.pdf` | label / content | Angaben zur PDF-Fassung | — | T |
| 107 | `sigeko.preNotification.pdf.actions` | `sigeko.preNotification.pdf` | group / layout | Gespeicherte Dateien öffnen | — | G |
| 108 | `sigeko.preNotification.pdf.actions.open` | `sigeko.preNotification.pdf.actions` | button / domainActionLayout | Gespeicherte PDF öffnen | openPreNotificationPdf | T |
| 109 | `sigeko.preNotification.pdf.actions.openFirms` | `sigeko.preNotification.pdf.actions` | button / domainActionLayout | Firmenanlage öffnen | openPreNotificationFirmsPdf | T |
| 110 | `sigeko.preNotification.pdf.status` | `sigeko.preNotification.pdf` | label / status | PDF-Status | — | T |

Exakte sechs DOM-Attribute; die Werte stammen wie bisher aus `registerM80Ref`/Komponentenvertrag:

| data-ui-inspector-id | data-ui-editor-kind | data-ui-editor-label | data-ui-editor-parent | data-ui-editor-editable | data-ui-editor-ops |
|---|---|---|---|---|---|
| `sigeko.preNotification.actions.pdfPreview` | `button` | PDF-Vorschau | `sigeko.preNotification.actions` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.actions.pdfCreate` | `button` | PDF erstellen | `sigeko.preNotification.actions` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.actions.pdfLayout` | `button` | PDF-Layout bearbeiten | `sigeko.preNotification.actions` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf` | `group` | PDF-Fassungen | `sigeko.preNotification` | `true` | `move,resizeWidth,resizeHeight,setVisibility` |
| `sigeko.preNotification.pdf.title` | `label` | PDF-Fassungen | `sigeko.preNotification.pdf` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.selection` | `fieldGroup` | Gespeicherte Fassung – Feldgruppe | `sigeko.preNotification.pdf` | `true` | `move,resizeWidth,resizeHeight,setVisibility` |
| `sigeko.preNotification.pdf.selection.label` | `label` | Gespeicherte Fassung | `sigeko.preNotification.pdf.selection` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.selection.input` | `field` | Gespeicherte Fassung | `sigeko.preNotification.pdf.selection` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.info` | `label` | Angaben zur PDF-Fassung | `sigeko.preNotification.pdf` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.actions` | `group` | Gespeicherte Dateien öffnen | `sigeko.preNotification.pdf` | `true` | `move,resizeWidth,resizeHeight,setVisibility` |
| `sigeko.preNotification.pdf.actions.open` | `button` | Gespeicherte PDF öffnen | `sigeko.preNotification.pdf.actions` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.actions.openFirms` | `button` | Firmenanlage öffnen | `sigeko.preNotification.pdf.actions` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |
| `sigeko.preNotification.pdf.status` | `label` | PDF-Status | `sigeko.preNotification.pdf` | `true` | `move,resizeWidth,resizeHeight,setVisibility,textResize` |

Native `option`-Elemente sind fachliche Datenauswahlwerte, keine zusätzlichen Editorziele. `label.htmlFor` zeigt auf die gleichlautende DOM-ID `sigeko.preNotification.pdf.selection.input`. Der Status bekommt wie vorhandene Statusfelder `role='status'`. Dateiname/Datumswerte nur textContent, nicht HTML.

Sichtbare Standardgestaltung: PDF-Abschnitt flex column, gap 8px, width 100%, min-width 0, leicht abgesetzter Rahmen wie vorhandene Aktionsleiste; keine fixe Höhe. Auswahl mit width 100%, min-height 34px, padding 6px und vorhandener Schrift. Aktionen flex row mit wrap und gap 6px. Buttons nutzen exakt bestehende `_button`-Geometrie (max-width 100%, padding 7px 10px, white-space normal, font inherit). Status/Info können umbrechen; kein Ellipsis, kein fixer überdeckender Footer. Die Sticky-Leiste behält bestehende top:0/Z-Index und enthält sieben Buttons; Niedrigfensterprüfung muss nachweisen, dass sie nicht den gesamten Arbeitsbereich einnimmt.

## D. Fachaktionen, Speichern und Zustände

**Kein Autosave:** PDF-Vorschau, PDF erstellen und PDF-Layout bearbeiten benutzen ausdrücklich den gespeicherten aktuellen Entwurf. Bei Dirtyzustand sind diese drei Buttons deaktiviert und der PDF-Status erklärt „Bitte Änderungen zuerst speichern.“ Das vorhandene Speichern/Save-and-back bleibt erreichbar. Kein verstecktes Speichern in Druckaktionen, keine Bestätigungsschleife vor jedem PDF. Nach bewusster Speicherung und erfolgreichem CAS sind die Aktionen wieder verfügbar. Für initiale leere Entwürfe gilt `expectedRevision:0`, sofern der Main-Snapshotbuilder sie akzeptiert; künstliches Anlegen eines DB-Entwurfs allein durch Vorschau ist nicht erforderlich.

**Vorschau:** temporäre PDF aus serverseitigem Snapshot, keine finale Fassung/Dateireferenz, keine Prozessampeländerung. Fehlende Angaben dürfen nach bestehender Readiness-Logik sichtbar sein; tatsächliche Finalvoraussetzungen bleiben separat. Fachliche Angaben werden nicht aus Rendererinputs in den Snapshot injiziert.

**Erstellen:** neue Fassung, vorhandene Fassungen unverändert. Main prüft dieselbe übergebene Entwurfsrevision und die tatsächlichen Finalvoraussetzungen einschließlich aktuell bestätigter zuständiger Arbeitsschutzbehörde. Eine geladene grüne UI-Anzeige ist keine hinreichende Erlaubnis. Rückgabe erst nach erfolgreicher Ausgabe, Datei-/Anlagenprüfung und Persistenz; UI zeigt keine erfundene Fassung vor dieser Antwort. Nach Fehlern bleiben Entwurf und bisher ausgewählte Fassung erhalten. Erfolgreiche PDF-Erstellung ist noch kein S5.4-Unterschrift-/Behördenabschluss.

**Öffnen gespeicherter Dateien:** Ausgewählte Dokument-ID plus `kind:'main'|'firms'` senden. Main löst ausschließlich gespeicherte, projektzugehörige Referenz auf und prüft Datei/Hash, dann vorhandene interne PDF-Vorschau. Keine absolute frei eingebbare Datei vom Renderer. Öffnen verändert weder Entwurf noch Datei; daher auch bei Dirtyzustand möglich und ohne Verwerfbestätigung. Fehlende/veränderte Dateien sichtbar melden, nicht neu aus Live-Daten erzeugen. Auswahl einer älteren Fassung ändert den Formularentwurf nicht.

**Busy:** zusätzlicher operationseigener `pdfBusy`/Sequenzschutz oder ein einheitlicher vorhandener Busyguard, jedoch nicht verschachtelt `save()` aufrufen, während busy bereits gesetzt ist. Während Vorschau-/Erstellen-/Editorstart keine zweite Erzeugung, keine Reload-/Save-/eigene Navigation und keine veränderbaren Formularinputs. Ein Doppelklick startet genau einen Auftrag. Während reinem Laden des Dokumentbestands darf der Entwurf weiter bearbeitet werden; eigene `documentsLoading`/Sequenz-ID, keine Änderung der vorhandenen `ready`-/Dirty-/CAS-Werte. Liste/Öffnen sind solange gezielt gesperrt. Fehler beim Bestandsladen dürfen geladenen Formularinhalt nicht löschen. Bestehendes „Neu laden“ lädt nach seiner vorhandenen Dirtybestätigung auch den Dokumentbestand neu; kein weiterer Reloadbutton nötig.

**Archiv:** neue Vorschau aus aktuellem Entwurf, Erstellen und Layoutvorbereitung sind deaktiviert (der neue Dokumentworkflow prüft dafür ein schreibbares Projekt; der vorhandene reine Capture erzeugt allein noch keine Datei). Bereits gespeicherte Fassungen und Anlagen bleiben auswähl-/öffnungsfähig. Keine versteckte Wiederherstellung. **Konflikt:** `PRE_NOTIFICATION_CONFLICT` erhält Eingaben, setzt vorhandenen Konfliktzustand und sperrt neue Erzeugung/Editorvorbereitung bis bewusst neu geladen wurde. Öffnen alter Dateien bleibt möglich. Technischer PDF-Fehler ist kein CAS-Konflikt; erneuter Versuch ohne Neuverlust möglich.

**Lebenszyklus:** jede asynchrone Antwort an `alive`, Projekt-ID und Auftragssequenz binden. Nach Destroy/Projektwechsel keine Befüllung eines anderen Screens, keine nachträgliche native Editoröffnung. Main kann eine bereits laufende finale Erzeugung abschließen; deren Fassung ist beim nächsten Bestandsladen sichtbar. Für Preview/Editor Main-eigenen Kontext begrenzt halten; beim Beenden des Jobs bzw. der dazugehörigen Editorsitzung freigeben. Kein unbefristeter Cache und keine sofortige Freigabe nach `open()`-Antwort, wenn der Editor später noch regenerieren muss. Die globale Shellnavigation hat weiterhin keinen allgemeinen beforeLeave-Guard; nicht als durch diese Screenänderung gelöst ausgeben.

## E. Nachgewiesener Editorpfad und Parent-Regel

Alle neuen Parent-IDs stehen entweder in der obigen Tabelle oder im vorhandenen Root-/actions-Vertrag. Selektorauswahl, gespeicherte Fassungen und PDF-Fachaktionen erhalten niemals eigene Layoutprofile nach Datensatz-ID. UI-Profil bleibt `module-sigeko-prenotification`; PDF-Profil bleibt der separate fachliche PDF-Descriptor, vorgeschlagen `module-sigeko-vorankuendigung`.

**Tatsächlich vorhandene Brücke:**

1. `src/main/preload.js` stellt `window.uiEditor.preparePdfContext(context)`, `getPdfDocumentTypeStatus({documentTypeId})`, `registerPdfDocumentType({documentTypeId})` und `open(registration)` bereit. Prepare öffnet kein Fenster.
2. `src/main/ui-editor/electronUiEditorSession.js::preparePdfContext` ruft den vorhandenen `pdfAdapter.setActiveDocumentContext` auf. Der Resolver in `pdfAdapterRegistry.cjs` wählt den registrierten Dokumenttyp anhand `documentTypeId`; ohne verfügbare akzeptierte Registry ist er unavailable.
3. `src/renderer/app/coreShellNavigation.js::openNativeUiEditor` baut den echten gemounteten `createM80RegistrationDescriptor`, prüft den aktiven Scope und ruft `window.uiEditor.open(registration)` auf. Danach aktiviert es den UI-Scope über vorhandenes `scopeChanged`.
4. Der reale native Editor besitzt den Reiter **PDF-Ausgabe**, nachgewiesen in `UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Views/EditorWindow.xaml`. Dort liegen PDF-Speichern, Undo, Profil-/Previewstatus und Regeneration. Die vorhandene API bietet keinen nachgewiesenen Startparameter, der diesen Reiter direkt auswählt. Der neue Button darf daher nicht behaupten, dass unmittelbar eine reine PDF-Editoransicht startet.
5. `scripts/runSigekoPdfAcceptance.cjs` weist bereits echte Adapter-Schriftänderung und Neuerzeugung derselben technischen PDF über `resolver.setActiveDocumentContext` / `submitPdfChangeRequest` / `regeneratePdfPreview` nach. Das ist kein vorhandener Nachweis des neuen VA-Buttons oder einer vollständigen nativen UI-Bedienung.

**Konkreter geplanter Buttonweg:** Zuerst Main-internen Snapshot-/Editorcontext für den gespeicherten Entwurf vorbereiten lassen. Context an Renderer enthält nur sichere Identität/Handle und Regenerationsmetadaten, keinen vertrauten Clientsnapshot; typischer Envelope `{documentTypeId:'sigeko-vorankuendigung',projectId,documentId,providerRequest:{moduleId:'sigeko',providerId:'sigeko-vorankuendigung',projectId,documentId,storage:{target:'Unterlagen'},data:{contextId}}}`. Der genaue Handlevertrag gehört zum Main-Workflow, nicht zur UI-Registry.

Danach `window.uiEditor.preparePdfContext(context)` ausdrücklich auf `ok`/richtigen Dokumenttyp prüfen; erst dann `openNativeUiEditor({scopeId:'sigeko.preNotification'})`. Kein projectId/meetingId-Dummy: der bestehende Helper bereitet selbst nur Protokollkontext bei gleichzeitigem projectId+meetingId vor. Der VA-Button setzt deshalb den PDF-Kontext vorher und ruft den Helper ohne solche Protokollparameter. Eigenen Button nicht als MainHeaderlauncher binden; dessen ursprüngliche Ref bleibt unberührt.

Native Editoröffnung erfolgt aus registriertem Formular auch ohne bereits finale Fassung. Kein vorgeschalteter Zwang zu erfolgreichem ersten PDF-Render: sonst könnte ein ungünstiges Layout mit Overflow gerade den Editorstart verhindern, der zur Layoutkorrektur nötig ist. Die native PDF-Registry/der Baum kann bereitstehen, Vorschau anfangs fehlen; Regeneration verwendet den vorbereiteten unveränderlichen Snapshot. Sichtbarer PDF-Status nach Öffnung: „Layouteditor geöffnet. Im Editor den Bereich ‚PDF-Ausgabe‘ wählen.“ Dies beschreibt den echten vorhandenen Weg. Keine Änderungen am Kit für Autoselektion in diesem Paket.

Bei fehlendem Manager/Bridge/Descriptor/abgewiesener Registrierung: konkreter Fehler im vorhandenen PDF-Status, kein Demoeditor, kein alternativer Store, kein Erfolgstext. Unbekannte/inkompatible Registry nicht durch ungeprüften automatischen `registerPdfDocumentType`-Aufruf reparieren. Der als Produkt eingebundene neue Descriptor muss im vorhandenen akzeptierten/Built-in-Verfahren verfügbar sein; bestehenden Registrierungsprozess benutzen.

## F. Prüfplan, tatsächliche Lücken und Dateien

Vor Umsetzung vollständiges Dokument ausgeben; danach echten Kitvalidator `validateUiComponentContracts({components:[...]})` sowie Gesamtmanifest/Fingerprint und 111 Pflichtrefs/112 Scopeziele prüfen. Alle sechs DOM-Attribute, Parentcontainment, `fieldKind:select`, native Optionen außerhalb des Inventars, keine Fachwerte in Metadaten. Alte Targets/IDs/Order müssen unverändert bleiben; nur 13 neue.

Neue Verhaltensfälle: leerer und mehrfassiger Bestand, neueste vorausgewählt, bewusste alte Auswahl, Auswahlreload stabil, Main-fremdes Projekt/Dokument zurückgewiesen, Anlagenbutton korrekt aktiviert, Dirty ohne Autosave, Save/CAS-Konflikt verhindert PDF, Doppelklick, technische Fehler ohne Entwurfsverlust, Archiv mit lesbaren alten Dateien, Dateifehler ohne Live-Neuerzeugung, verspätete Antwort nach Destroy, Bestandsladefehler unabhängig vom Formular. Editorweg prüft Reihenfolge prepare → open; prepare failure öffnet nichts; keinerlei erfundene meetingId; Managerfehler sichtbar; Kontext bis Editor-Regeneration gültig; finale Datei wird durch Layouteditor nie überschrieben.

Echte Electron-Abnahme erweitert bestehenden Formharness: sieben obere Aktionen bei breitem, schmalem und niedrigem Fenster vollständig erreichbar; tief scrollen und Speichern-und-zurück erreichbar; nativer Fassungsselect bedienbar; echte Vorschau-/Dateiöffnung, zwei erzeugte Fassungen und alte Dateiinhaltshashes unverändert; echte Firmenanlage nur bei passender Fassung. PDF-spezifische Inhalte/81 Targets/Overflow gehen in den separaten PDF-Harness. Native Windows-Editorbedienung zusätzlich nachweisen, wenn der Button als vollständig praktisch abgenommen ausgegeben werden soll; reine API-/Resolverprüfung ersetzt das nicht. Linux darf „Manager nicht installiert“ korrekt behandeln, aber das nicht als erfolgreiche native Editorbedienung zählen.

Voraussichtliche Produktänderungen: bestehender SigekoPreNotificationScreen und dessen uiEditorContract; vorhandene m80Registry-Versionsangabe/Manifest; neue modulbezogene Main-/Preload-PDF-Workflowaufrufe gemäß gesondertem Daten-/Persistenzvertrag. Kein MainHeaderumbau, Routerumbau oder Tabelleneditor. Bestehende Form-/Entry-/Manifesttests nur um konkrete neue Inventare/Fälle ergänzen; tatsächlichen Volltest gegen vorherige 1858/97-Baseline abgleichen.

**Tatsächliche Integrationslücken:**

- Main-Funktionen/IPC/Preload für PDF-Vorschau, finale Erstellung, Dokumentbestand, geprüften Dateiopen und Main-eigenen Editorcontext existieren für VA noch nicht. Vorgeschlagene Namen zur Abstimmung im Hauptpaket: `sigekoPreviewPreNotificationPdf`, `sigekoCreatePreNotificationPdf`, `sigekoListPreNotificationDocuments`, `sigekoOpenPreNotificationDocumentFile`, `sigekoPreparePreNotificationPdfEditor`. Keine davon als bereits vorhanden behaupten.
- Finale Dokumentpersistenz/Dateireferenzen/V8 und fachlicher Provider/Descriptor/Renderer sind erst Bestandteil des gemeinsamen Folgepakets. Form-UI darf ohne diese Rückgaben keinen vermeintlichen Bestand erfinden.
- Standard-Headerlauncher ist DEV-sichtbar; der neue Fachbutton kann denselben vorhandenen Starter verwenden, benötigt aber wirklich installierten Manager und vollständige aktuelle Formularregistry. Im Host wurde kein neuer fachlicher Lizenzalias benötigt; tatsächliche SiGeKo/PDF-Freigabe weiterhin in Main-Workflow/Provider prüfen.
- Direkte native PDF-Reiterwahl ist nicht nachgewiesen. Der hier dokumentierte vorhandene Reiterweg benötigt keine neue Kit-API. Sollte unmittelbare Autoselektion zum Abnahmeziel werden, muss das als separates gemeinsames Anschlussdefizit behandelt werden.
- Projektordner aus veränderbaren Projektbezeichnungen und fehlende/veränderte Dateireferenzen müssen Main-seitig korrekt erkannt werden; UI zeigt Fehler und erzeugt keine Ersatzdatei.

Nur lesend analysiert und dieses Entwurfsdokument geschrieben; keine Produktdatei geändert, kein Testlauf und keine neue GUI-/PDF-Abnahme durchgeführt.
