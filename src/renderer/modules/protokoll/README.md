# Modul `Protokoll`

Diese Struktur ist die technische Heimat fuer das Fachmodul `Protokoll`.

Der produktive Einstieg ist eindeutig:

- `app/modules/moduleCatalog.js` registriert ausschliesslich `modules/protokoll/index.js`.
- `app/Router.js` bezieht den Arbeitsscreen ausschliesslich aus diesem Moduleinstieg.
- `index.js` registriert `screens/TopsScreenIntegrationView.js` als Arbeitsscreen.
- `screens/TopsScreenIntegrationView.js` ergaenzt den modulnahen `screens/TopsScreen.js`
  nur um die Shell-Integration.
- `views/TopsScreen.js` ist ausschliesslich ein Kompatibilitaets-Re-Export fuer Altimporte und
  kein produktiver Router- oder Modulkatalog-Einstieg.
- `renderer/tops/` ist der noch nicht vollstaendig umgezogene, modulinterne Unterbau. Der Ordner
  ist kein konkurrierender produktiver Moduleinstieg und wird nur nach gesondertem
  Import-/Runtime-/Testnachweis bereinigt.

Der aktuelle Modulbestand umfasst ausserdem:

- `index.js` mit Modulkennung, Routen, Navigation und Arbeitsscreen
- `screens/` mit dem produktiven Protokoll-Screen und seiner Shell-Integration
- `viewmodel/` mit den ersten real umgezogenen Protokoll-ViewModels
- `SharedEditboxCore.js` als modulinterner Kern fuer den generischen Editbox-Aufbau und die Value-/Read-only-Synchronisation
- `WorkbenchMetaColumn.js` als modulinterner Kern fuer die Workbench-Meta-Spalte
- `WorkbenchShellFrame.js` als modulinterner Kern fuer die technische Workbench-Huelle
- `WorkbenchActionDraftState.js` als modulinterner Kern fuer Draft-Zusammenfuehrung und Action-State

## Settings-Eigentum

`settings/ProtokollSettingsContract.js` ist der Renderer-Vertrag fuer globale und
projektbezogene Protokoll-Einstellungen. Der Main-Prozess spiegelt denselben Vertrag in
`src/main/modules/protokoll/settingsKeys.js`. Die bestehenden persistenten Schluessel bleiben
kompatibel; ihre fachliche Namespace-Grenze ist das Modul `protokoll`.

Der allgemeine Settings-Screen hostet den vom Protokollmodul gelieferten Bereich. Das
Projektformular delegiert an `ProtocolSettingsModal.js`. Der projektbezogene Settings-IPC wird
nur ueber den Protokoll-IPC-Registrar aktiviert. Die vorerst noch vorhandenen, nicht mehr
aufgerufenen Dialogimplementierungen werden erst im gesonderten Legacy-Paket bewertet.

## PDF-/Print-Grenze

Der Protokoll-Abschluss bestimmt weiterhin fachlich, welche Dokumente in welcher Reihenfolge
erzeugt werden. `renderer/tops/domain/TopsCloseFlow.js` liefert dazu ausschliesslich Operation
und Projekt-/Besprechungskontext an `features/output/PdfDocumentService.js`. Dieser gemeinsame
technische Dienst fuehrt die bereits vorhandenen Router-/`PrintModal`-Operationen aus und kennt
keine Protokoll-Dokumentart, kein Fach-ViewModel, keine Layoutregel und keinen Dateinamen.
Renderer, Satzweg, Preview, Speicherung und Druck bleiben unveraendert.

## Mail-Grenze

Der produktive Abschlussdialog liegt als `mail/ProtokollMailFlow.js` im Fachmodul. Er besitzt
Empfaengerauswahl, Protokollanhaenge, Betreff/Text und den Abschlussbezug. Den fertig aufgebauten
Payload uebergibt der bestehende Header-Adapter an `features/mail/MailTransportService.js`;
dort bleiben Outlook/mailto, Attachment-Fehlerbehandlung und technische Transportnormalisierung
fachneutral gemeinsam. Der
historische Pfad `features/mail/MailFlow.js` ist nur noch ein Kompatibilitaets-Re-Export.
`mail/ProtokollMailPayloadService.js` besitzt die aktiven Regeln fuer Projekt-/Besprechungskontext,
Empfaenger aus dem fachlichen Verteiler, Protokoll-Betreff/-Text, Anhangsliste und die Suche nach
dem gespeicherten Protokoll-PDF. `MainHeader` behaelt seine bisherigen Methodennamen nur als
Delegationspunkte fuer bestehende Aufrufer.

## Teilnehmer-/Stammdatengrenze

Globale `firms`/`persons`, allgemeine Projektzuordnungen und `project_candidates` bleiben
Core-Stammdaten bzw. Core-Projektbeziehungen. Das Protokoll referenziert diese Identitaeten nur.
`meeting_participants` besitzt Teilnahme, Anwesenheit und Verteiler einer konkreten Besprechung
und wird ausschließlich mit der Protokollmigration erzeugt. Der bisher kombinierte IPC-Bestand
ist entlang derselben Grenze registriert: Projektpool/-kandidaten im Core,
`meetingParticipants:*` ausschließlich über den guarded Protokoll-Registrar. Die statischen
Preload-Funktionen bleiben kompatibel.

Die Ordner `components/`, `domain/`, `data/`, `state/`, `viewmodel/`, `dialogs/` und `rules/`
sind absichtlich schon angelegt, damit spaetere Umzuege dort sauber anschliessen koennen.

Wichtig:

- Kein kosmetischer Vollumzug des bestehenden Tops-Unterbaus
- Keine zweite Router- oder Modulregistrierung neben `modules/protokoll/index.js`
- Gemeinsame Kernbausteine bleiben ausserhalb dieses Moduls
