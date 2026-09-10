# SiGeKo S5.4 – UI-Entwurfsentscheidung für Rücklauf und Outlook

Basis: main `676713aa`, Ergebnisbranch `codex/sigeko-s54-ruecklauf-outlook`. Führend sind #277, #274 und #251 sowie die bestätigten vereinfachten Entscheidungen B3/B4. S5.3b2 ist über PR #338 integriert. Dieses Dokument wird vor Produktänderungen ausgegeben; es behauptet keine bereits bestandene S5.4-Abnahme.

## A. Art der Ausgabe und sichtbarer Aufbau

**UI.** Die bestehende Vorankündigungsmaske erhält innerhalb von `pdf` unterhalb der gespeicherten Dateien einen Abschnitt „Rücklauf und Outlook“. Alle Vorgänge beziehen sich ausdrücklich auf die bereits vorhandene ausgewählte unveränderliche PDF-Fassung. Die sieben oberen Sticky-Aktionen bleiben unverändert. Kein neues Popup, keine Tabelle, kein neuer PDF-Renderer oder Druckaufbau.

Der Abschnitt enthält den Prozessstand, die zugeordnete unterschriebene PDF mit Zuordnen-/Öffnen-Aktionen, ein optionales erbetenes Rücklaufdatum, zwei Mailvorbereitungsaktionen und einen gemeinsamen überprüfbaren Mailbereich. „Zur Unterschrift vorbereiten“ oder „An Behörde vorbereiten“ lädt Main-seitige Vorschläge. Danach können Empfänger, Betreff und Nachricht vor „Outlook-Entwurf öffnen“ geprüft und geändert werden. Die Anlagenanzeige nennt die tatsächlich vorgesehenen gespeicherten PDFs; absolute frei eingebbare Dateipfade gibt es nicht.

Ein separater Unterschrift-Merker und ein zusätzlicher Speichern-Button werden nicht gebaut. Die erfolgreiche Dateiübernahme erfasst den Rücklauf. Das optionale Rücklaufdatum wird **erst nach erfolgreichem Öffnen des Unterschrift-Outlook-Entwurfs** gespeichert; weder Eingabe noch Mailvorbereitung speichern es. Der sichtbare Hinweis nennt das ausdrücklich. Keine Outlook-Erinnerung oder Kalenderanlage in S5.4; dieser Anschluss bleibt S9.

## B. Editorfähigkeit und stabile Bestandsziele

**Editorfähig: ja.** Vorhandene Komponente `bbm.sigeko.preNotification`, Scope `sigeko.preNotification`, UI-Profil `module-sigeko-prenotification`. Die 111 bisherigen Deklarationen (einschließlich der 13 S5.3b2-Ziele) behalten IDs, Parents, Reihenfolge und Operationen. Die folgenden 32 Ziele werden ausschließlich am Ende mit Order 111–142 angehängt. Ergebnis: **143 Pflichtrefs, 144 Scopeziele einschließlich des vorhandenen Headerlaunchers**. Deklarationsreihenfolge ist keine automatische DOM-Sortierung.

Weiterhin ausschließlich `m83Element`, `m83DomainButton`, `m83Slot` und explizites `registerM80Ref`; kein DOM-Scan, keine automatisch erfundene Registry. Alle neuen Ziele `visible:true`, `editable:true`, `stableIdSource:'declaration'`, `semanticKey/refKey` identisch mit vollständiger ID, Slots `required:true`, `referenceKind:'single'`, `presence:'always'`. Ziele bleiben auch ohne Dokument/ohne Mailvorbereitung gemountet und werden fachlich deaktiviert.

## C. Vollständige neue Metadaten und sechs DOM-Attribute

Für jede Zeile der folgenden Tabelle gelten die exakten sechs Attribute: `data-ui-inspector-id` = vollständige ID; `data-ui-editor-kind` = type; `data-ui-editor-label` = name; `data-ui-editor-parent` = Parent; `data-ui-editor-editable` = `true`; `data-ui-editor-ops` = ausgeschriebene Operationsliste G beziehungsweise T.

**G** = `move,resizeWidth,resizeHeight,setVisibility`. **T** = `move,resizeWidth,resizeHeight,setVisibility,textResize`. Alle `lockedOps` exakt `executeTargetAction,modifyDomainData,createRecord,deleteRecord`. Gruppen/fieldGroup G, Labels/Felder/Buttons T. Nicht freigegebene Operationen werden nicht angeboten.

Baseline wie im vorhandenen Vertrag: `x:0,y:0,width:null,height:null,textOffsetX:0,textOffsetY:0,fontSize:12,visible:true,spacing:{},minWidth:8,maxWidth:2400,minHeight:8,maxHeight:1600,minFontSize:6,maxFontSize:32`, `geometry.maximumStoredOffset:2400`. Ausschließlich das Textarea-Feld hat wie die bestehenden SiGeKo-Mehrzeilenfelder `minHeight:24,maxHeight:720`. Reale DOM-Geometrie wird bei der Abnahme gemessen; Nullbreite/-höhe ist keine behauptete Nullpixelbox.

| order | Vollständige ID | Parent | type / role | name | actionKind / fieldKind / componentKind | Ops |
|---:|---|---|---|---|---|---|
|111|`sigeko.preNotification.pdf.workflow`|`sigeko.preNotification.pdf`|group / layout|Rücklauf und Outlook|—|G|
|112|`sigeko.preNotification.pdf.workflow.title`|`sigeko.preNotification.pdf.workflow`|label / content|Rücklauf und Outlook|—|T|
|113|`sigeko.preNotification.pdf.workflow.state`|`sigeko.preNotification.pdf.workflow`|label / status|Prozessstand der ausgewählten Fassung|—|T|
|114|`sigeko.preNotification.pdf.workflow.hint`|`sigeko.preNotification.pdf.workflow`|label / content|Hinweis zum Outlook-Prozess|—|T|
|115|`sigeko.preNotification.pdf.workflow.return`|`sigeko.preNotification.pdf.workflow`|group / layout|Unterschriebener Rücklauf|—|G|
|116|`sigeko.preNotification.pdf.workflow.return.info`|`sigeko.preNotification.pdf.workflow.return`|label / content|Zugeordnete Rücklaufdatei|—|T|
|117|`sigeko.preNotification.pdf.workflow.return.import`|`sigeko.preNotification.pdf.workflow.return`|button / domainActionLayout|Unterschriebenes PDF zuordnen|importPreNotificationSignedPdf|T|
|118|`sigeko.preNotification.pdf.workflow.return.open`|`sigeko.preNotification.pdf.workflow.return`|button / domainActionLayout|Unterschriebenes PDF öffnen|openPreNotificationSignedPdf|T|
|119|`sigeko.preNotification.pdf.workflow.return.due`|`sigeko.preNotification.pdf.workflow.return`|fieldGroup / layout|Erbetener Rücklauf – Feldgruppe|—|G|
|120|`sigeko.preNotification.pdf.workflow.return.due.label`|`sigeko.preNotification.pdf.workflow.return.due`|label / content|Erbetener Rücklauf – optional, gespeichert beim Öffnen des Unterschrift-Entwurfs|—|T|
|121|`sigeko.preNotification.pdf.workflow.return.due.input`|`sigeko.preNotification.pdf.workflow.return.due`|field / dataFieldLayout|Erbetener Rücklauf – optional, gespeichert beim Öffnen des Unterschrift-Entwurfs|fieldKind:date; componentKind:input|T|
|122|`sigeko.preNotification.pdf.workflow.actions`|`sigeko.preNotification.pdf.workflow`|group / layout|Outlook-Vorgang vorbereiten|—|G|
|123|`sigeko.preNotification.pdf.workflow.actions.signature`|`sigeko.preNotification.pdf.workflow.actions`|button / domainActionLayout|Zur Unterschrift vorbereiten|preparePreNotificationSignatureMail|T|
|124|`sigeko.preNotification.pdf.workflow.actions.authority`|`sigeko.preNotification.pdf.workflow.actions`|button / domainActionLayout|An Behörde vorbereiten|preparePreNotificationAuthorityMail|T|
|125|`sigeko.preNotification.pdf.workflow.mail`|`sigeko.preNotification.pdf.workflow`|group / layout|Outlook-Entwurf prüfen|—|G|
|126|`sigeko.preNotification.pdf.workflow.mail.purpose`|`sigeko.preNotification.pdf.workflow.mail`|label / content|Vorbereiteter Mailvorgang|—|T|
|127|`sigeko.preNotification.pdf.workflow.mail.choice`|`sigeko.preNotification.pdf.workflow.mail`|fieldGroup / layout|Empfänger auswählen – Feldgruppe|—|G|
|128|`sigeko.preNotification.pdf.workflow.mail.choice.label`|`sigeko.preNotification.pdf.workflow.mail.choice`|label / content|Empfänger aus Projektkontakten auswählen|—|T|
|129|`sigeko.preNotification.pdf.workflow.mail.choice.input`|`sigeko.preNotification.pdf.workflow.mail.choice`|field / dataFieldLayout|Empfänger aus Projektkontakten auswählen|fieldKind:select; componentKind:select|T|
|130|`sigeko.preNotification.pdf.workflow.mail.addRecipient`|`sigeko.preNotification.pdf.workflow.mail`|button / domainActionLayout|Adresse übernehmen|addPreNotificationMailRecipient|T|
|131|`sigeko.preNotification.pdf.workflow.mail.recipients`|`sigeko.preNotification.pdf.workflow.mail`|fieldGroup / layout|Empfängeradressen – Feldgruppe|—|G|
|132|`sigeko.preNotification.pdf.workflow.mail.recipients.label`|`sigeko.preNotification.pdf.workflow.mail.recipients`|label / content|Empfängeradressen – mit Semikolon trennen|—|T|
|133|`sigeko.preNotification.pdf.workflow.mail.recipients.input`|`sigeko.preNotification.pdf.workflow.mail.recipients`|field / dataFieldLayout|Empfängeradressen – mit Semikolon trennen|fieldKind:text; componentKind:input|T|
|134|`sigeko.preNotification.pdf.workflow.mail.subject`|`sigeko.preNotification.pdf.workflow.mail`|fieldGroup / layout|Betreff – Feldgruppe|—|G|
|135|`sigeko.preNotification.pdf.workflow.mail.subject.label`|`sigeko.preNotification.pdf.workflow.mail.subject`|label / content|Betreff|—|T|
|136|`sigeko.preNotification.pdf.workflow.mail.subject.input`|`sigeko.preNotification.pdf.workflow.mail.subject`|field / dataFieldLayout|Betreff|fieldKind:text; componentKind:input|T|
|137|`sigeko.preNotification.pdf.workflow.mail.body`|`sigeko.preNotification.pdf.workflow.mail`|fieldGroup / layout|Nachricht – Feldgruppe|—|G|
|138|`sigeko.preNotification.pdf.workflow.mail.body.label`|`sigeko.preNotification.pdf.workflow.mail.body`|label / content|Nachricht|—|T|
|139|`sigeko.preNotification.pdf.workflow.mail.body.input`|`sigeko.preNotification.pdf.workflow.mail.body`|field / dataFieldLayout|Nachricht|fieldKind:multilineText; componentKind:textarea|T|
|140|`sigeko.preNotification.pdf.workflow.mail.attachments`|`sigeko.preNotification.pdf.workflow.mail`|label / content|Anlagen des Outlook-Entwurfs|—|T|
|141|`sigeko.preNotification.pdf.workflow.mail.open`|`sigeko.preNotification.pdf.workflow.mail`|button / domainActionLayout|Outlook-Entwurf öffnen|openPreNotificationOutlookDraft|T|
|142|`sigeko.preNotification.pdf.workflow.status`|`sigeko.preNotification.pdf.workflow`|label / status|Rücklauf- und Outlook-Aktionsstatus|—|T|

Native `option`-Elemente sind Fachwerte, keine zusätzlichen Editorziele. `label.htmlFor` zeigt auf die vollständige jeweilige `.input`-DOM-ID. Statusfelder erhalten `role='status'`. Dateinamen, Kontakte, Zeitpunkte und Fehler ausschließlich über `textContent`, nicht HTML.

Standardlayout: vorhandener flex-column-Stack mit gap 8px/min-width 0, keine feste Abschnittshöhe, keine zusätzliche Sticky-Leiste. Aktionsgruppen flex-wrap/gap 6px; bestehende Buttondarstellung mit maximal 100% Breite, umbruchfähigem Text und padding 7px 10px. Eingaben maximal 100% breit, mindestens 34px hoch, Textarea mit sichtbaren mehreren Zeilen. Alle Inhalte im normalen Scrollbereich und auch bei 560×480 erreichbar. Keine feste Fußleiste und kein Clipping.

## D. Fachaktionen, Zustände und Schnittstellen

**Keine Editor-Fachaktionen:** Dateiimport/-öffnung, Datenbank-/IPC-Zugriffe, Empfängerübernahme, Mailvorbereitung, Outlook-Aufruf und Prozessänderungen sind ausschließlich Fachlogik. Die Darstellung der Buttons ist editorfähig; ihr fachliches Auslösen niemals. Keine Layoutoperation darf speichern, importieren oder Outlook öffnen.

### Trennung vom Formularentwurf

Workfloweingaben werden getrennt von `this.inputs` und dem Formularsnapshot geführt. `_field()` registriert im Bestand jedes Feld in `this.inputs`; neue Felder müssen deshalb in einer separaten Workflow-Sammlung geführt beziehungsweise unmittelbar aus der Entwurfssammlung entfernt werden. Mailtext-/Empfänger-/Terminänderungen verändern weder Dirtyzustand noch CAS-Revision des Formulars. Gespeicherte Fassungen bleiben bei ungespeicherten Formularänderungen fachlich eindeutig bedienbar. Keine automatische Speicherung oder Neuerzeugung des aktuellen Formulars.

Auswahlwechsel setzt die Mailvorbereitung ausdrücklich für die neue Dokument-ID zurück. Neue Workflowdaten dürfen keine andere ausgewählte Fassung befüllen. Antworten werden an `alive`, Projekt-ID, Dokument-ID und Auftragssequenz gebunden. Während Mutation sind Auswahl, konkurrierende Aktionen, eigene Navigation und Eingaben gesperrt; Doppelklick startet einen Auftrag. Dokument-/Workflowladefehler löschen keine Formularfelder. Eine Vorbereitung aus inzwischen alter Workflowrevision darf nicht mit neuer Revision weiterverwendet werden.

`canWrite` aus dem Main-Workflow und aktueller Projekt-/Ladezustand steuern neue Fachaktionen. Archiv erlaubt bestehende Rücklauf-/PDF-Öffnung, sperrt Import und neue Outlook-Vorgänge. Keine versteckte Projektwiederherstellung. Die Main-Grenze prüft Lizenz, Projekt, Dateiintegrität und CAS erneut.

### Prozessstand und Rücklauf

Rot: noch keine bestätigte Outlook-Übergabe zur Unterschrift/an Behörde. Orange: Unterschrift-Entwurf erfolgreich geöffnet. Grün: Behörden-Entwurf erfolgreich geöffnet. Texte nennen die tatsächliche Entwurfsübergabe und behaupten keinen Versandnachweis. PDF-Erstellung, Vorbereitung, Dateiauswahlabbruch oder technischer Fehler bewirken keinen Erfolg. Kein vierter Rücklaufstatus und keine Versandhistorie.

Import öffnet den Main-eigenen PDF-Dateiwähler. Bei Abbruch bleibt der Bestand unverändert. Erfolgreicher Import liefert die persistierte Dateizuordnung; ein Ersatzrücklauf ist erlaubt, erhält alte Dateien und setzt einen vorherigen Behördenabschluss zurück. Eine neue Behördenübergabe muss sich auf den neuen Rücklauf beziehen. Öffnen verwendet ausschließlich die dokumentbezogene gespeicherte Referenz; keine Rendererpfade und keine Ersatz-PDF aus Live-Daten.

Das Datum ist optional, leer entspricht `null`. Vor der Unterschrift-Vorbereitung kann es eingetragen werden; gespeichert wird es erst mit erfolgreichem Unterschrift-Entwurf. Keine separate Save-API und kein Autosave. Falls das Datum nach der Vorbereitung geändert wird, muss eine veraltete Vorbereitung ausdrücklich neu vorbereitet werden, statt unbemerkt ein anderes Datum mit altem Vorschlag zu öffnen. Die Behördenvorbereitung verändert keinen Rücklauftermin.

### Verbindliche neue bbmDb-Wrapper

Alle folgenden Antworten sind `{ok:true,data:...}` beziehungsweise `{ok:false,error,code}`. Unbekannte/fremde Projekt-/Dokumentidentität im DTO wird abgewiesen.

* `sigekoGetPreNotificationWorkflow({projectId,documentId})` liefert `{projectId,documentId,revision:null|int,status:'red'|'orange'|'green',signedFile:null|{kind,projectRelativePath,sha256,byteSize},signedReceivedAt,signatureOpenedAt,authorityOpenedAt,returnRequestedBy,canWrite}`.
* `sigekoPreparePreNotificationMail({projectId,documentId,purpose:'signature'|'authority',returnRequestedBy:null|ISOdate})` liefert `{projectId,documentId,purpose,revision,recipients:string[],subject,body,attachments:[{name,byteSize}],returnRequestedBy}`. Vorbereitung allein öffnet keine Mail und speichert keinen Prozessstand.
* `sigekoImportPreNotificationSignedReturn({projectId,documentId,expectedRevision})` liefert `{canceled:boolean,workflow?:workflowDTO}`.
* `sigekoOpenPreNotificationSignedReturn({projectId,documentId})` liefert `{opened:true}`.
* `sigekoOpenPreNotificationMailDraft({projectId,documentId,expectedRevision,purpose,recipients,subject,body,returnRequestedBy:null|ISOdate})` liefert `{outcome:'draft-opened',transport:'outlook',workflow:workflowDTO}`. Main leitet alle Anlagen selbst aus den geprüften Dokument-/Rücklaufdateien ab. Kein Renderer übermittelt absolute Pfade oder behauptete Dateien.

Bei `SIGEKO_MAIL_OPENED_STATE_UNSAVED` ist Outlook bereits geöffnet, der Prozessstand aber nicht gespeichert: konkrete Fehlermeldung zeigen, vorbereiteten Mailvorgang leeren und Workflow neu laden. **Kein automatischer Wiederholungsversuch und kein erneutes Outlook-Öffnen beim Reload.** Sonstige Fehler ändern keine Ampel. Erfolgreiche Main-Antwort wird auf exakten Outcome/Transport und passendes Workflow-DTO geprüft.

### Empfänger und gemeinsame Infrastruktur

Projektkontakte stammen aus `window.bbmDb.firmDirectoryListProjectParticipants({projectId,includeInactive:false})`, Ansprechpartner aus `firmDirectoryListPersons({ref:{...entry.ref,projectId},forUse:'project_participant'})`. Diese bestehenden APIs liefern `{ok:true,list}` und nicht die SiGeKo-`data`-Hülle. Globaler Firmenref erhält ausdrücklich aktuellen Projektkontext für die vorhandene aktive Zuordnungsprüfung. Firmenfelder `label/name/short/email`, Personenfelder `name/email` werden nur gelesen.

Kontakte sind ein Auswahlangebot; niemals automatisch alle Projektfirmen adressieren. „Adresse übernehmen“ ergänzt nur bewusst gewählte Adresse, dedupliziert ohne Groß-/Kleinschreibung. Frei bearbeitbare Empfängeradressen mit Semikolon bleiben möglich; fehlende/ungültige Empfänger sichtbar melden. Main schlägt zur Unterschrift die Bauherradresse aus dem unveränderlichen Snapshot und für die Behördenübergabe die bestätigte zuständige Behörde vor. Einen beauftragten Dritten kann der Nutzer über vorhandene Kontakte oder freie Adresse bewusst auswählen; es gibt keinen automatischen Dritten-Verteiler. Keine neue Firmen-/Personen-/Behördenpflege.

Der eigentliche Transport bleibt der vorhandene gemeinsame Outlook-Mainhandler. Kein Protokoll-Mailflow, kein mailto-Erfolgsersatz, kein Hintergrundversand. Die BBM-Anlagenanzeige zeigt die festen geprüften Prozessdateien; im geöffneten Outlook-Entwurf kann der Nutzer Empfänger, Text und Anlagen vor seinem tatsächlichen Versand weiterhin bearbeiten. Diese späteren Änderungen werden entsprechend B3 nicht überwacht.

## E. Parent- und Strukturregel

Jeder neue Parent steht im Inventar oder ist das bestehende `sigeko.preNotification.pdf`. Die DOM-Struktur bildet genau diese deklarierten Gruppen ab. Jede neue Ref wird einmal gemountet. Keine Profile/IDs nach Fassung, Person, Datum oder Datei. Vorhandener Root, Headerlauncher, Navigations-/Speicheraktionen und PDF-Layouteditor bleiben auf ihren vorhandenen Ziel- und Fachwegen.

## F. Prüfplan, vorhandene Anker und echte Lücken

Nach Umsetzung tatsächliche Kitvalidierung `validateUiComponentContracts`, Gesamtmanifest/Fingerprint und 143 Pflichtrefs/144 Scopeziele prüfen. Bestehende `sigekoPreNotificationForm.test.cjs` und Manifesttests um genaue neue Inventare ergänzen: alle sechs Attribute, eindeutige IDs, Parentcontainment, textarea-Komponentenart und unveränderte alte IDs/Order. Ein grüner Vertrag ersetzt keine Bedienprüfung.

Verhalten: keine Fassung, mehrere Fassungen, unabhängiger Workflow je Auswahl; getrennte Dirtyzustände; Empfängervorschläge und bewusste Adressübernahme; freie Empfänger; fehlerhafte DTOs; Datum ohne Autosave und erst nach bestätigter Unterschrift-Übergabe; Importabbruch/Ersatz; korrekter Dateiaufruf; CAS-Konflikte; Outlookfehler/Linux-Unsupported; besonderer bereits-geöffnet-aber-nicht-gespeichert-Fehler ohne Wiederholung; Doppelklick; Archiv; Ladefehler und verspätete Antworten nach Auswahl-/Projektwechsel/Destroy. Keine automatische Erfolgsmeldung aus Vorbereitung oder Dateiauswahl.

Bestehenden echten Electron-Formharness um neue Controls bei breitem, schmalem und niedrigem Fenster erweitern; Scrollbarkeit und unveränderte Erreichbarkeit der sieben oberen Buttons nachweisen. PDF-Regression aus S5.3b2 bleibt erhalten. Main-/Datei-/CAS-/Transporttests und exakter Volltestvergleich zur integrierten 1947-PASS/97-Fehler-Baseline werden separat im Paket geführt.

**Tatsächliche Lücken bei Erstellung dieses Entwurfs:** Die neuen Workflow-APIs und UI sind noch nicht implementiert. Neue Tests und GUI-Abnahme sind noch nicht ausgeführt. Ein Outlook-Transportstub belegt keinen real installierten Windows-Outlook-COM-Erfolg; ein echter Plattformnachweis oder eine explizit ausgewiesene verbleibende lokale Abnahme ist notwendig. Keine persönliche manuelle Nutzerabnahme behaupten.

Erlaubte UI-Produktdateien: `src/renderer/modules/sigeko/SigekoPreNotificationScreen.js` und `SigekoPreNotificationScreen.uiEditorContract.js`; passende Form-/Manifesttests und vorhandener Formharness werden koordiniert erweitert. Kein `SigekoPreNotificationForm.js` vorhanden. Main-/Preload-/DB-/Transfer-Implementierung ist ein getrennt zu koordinierender Teil desselben S5.4-Pakets. Rechnung #275 bleibt eingefroren.
