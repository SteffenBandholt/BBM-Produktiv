# Tabellenlayout-Inventar

Status: Doku-Inventar, keine Registrierung

Dieses Inventar sammelt die erkennbaren Tabellen und Listen der App und trennt sie nach:

- Inhaltstabelle: fachliche Tabelle/Liste, potenziell spaeter fuer den Tabellenlayout-Editor geeignet
- Bedienliste: Auswahlfenster, Popup, Dropdown, Filterliste, keine Editor-Tabelle
- Unklar: fachlich noch nicht sauber genug isoliert, keine Aufnahme ohne Nutzerfreigabe

Wichtig gemaess Tabellenlayout-Regel:

- keine Tabelle wird geraten
- keine Spalten werden aus DB-, IPC- oder Druckfeldern erraten
- nur ausdruecklich freigegebene Inhaltstabellen duerfen spaeter in den Editor
- Bedienlisten, Auswahl-Popups und Filterlisten gehoeren nicht in den Editor

## 1. Ausgangslage

Das Projekt hat bereits registrierte Tabellenlayouts fuer den Protokollbereich und fuer die projektbezogene Firmenliste.
Der interne Tabellenlayout-Editor soll nur mit fachlich geklaerten Inhaltstabellen arbeiten.

## 2. Inhaltstabellen

### 2.1 TOP-Liste / `protokoll_tops`

- Arbeitsname: TOP-Liste
- vorgeschlagener tableKey: `protokoll_tops`
- Bereich/Modul: `protokoll`
- Fundstellen:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `src/renderer/ui/MainHeader.js`
  - `src/main/print/printData.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
- Art: Inhaltstabelle
- Verwendung: UI und PDF
- aktuell im Tabelleneditor: ja
- sichtbare Spalten:
  - TOP
  - Gegenstand
  - Status
  - Fertig bis
  - verantw.
- Empfehlung: bereits registriert
- Risiko/Bemerkung:
  - ist der Pilot und fachlich klar im Protokoll verankert
  - der Druckmodus `TOP-Liste` nutzt denselben fachlichen Inhalt

### 2.2 Projekt-Firmenliste / `project_firms`

- Arbeitsname: Projekt-Firmenliste
- vorgeschlagener tableKey: `project_firms`
- Bereich/Modul: `projektverwaltung`
- Fundstellen:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/views/ProjectFirmsView.js`
  - `docs/table-layout-project-firms-contract.md`
  - `src/main/print/printData.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
- Art: Inhaltstabelle
- Verwendung: UI und PDF-Vorschau
- aktuell im Tabelleneditor: ja
- sichtbare Spalten:
  - Kurzbez.
  - Funktion/Gewerk
  - Aktiv
- Empfehlung: bereits registriert
- Risiko/Bemerkung:
  - PDF ist fuer diese Tabelle aktuell nur Vorschau, noch kein produktiver Druckanschluss
  - die Druckausgabe Firmenliste greift fachlich auf denselben Projektfirmen-Kontext zu, ist aber kein eigener Editor-Tabellenkandidat

### 2.3 Teilnehmer-/Personenverwaltung im Dialog

- Arbeitsname: Teilnehmer-/Personenverwaltung
- vorgeschlagener tableKey: -
- Bereich/Modul: Protokoll / Teilnehmerdialog
- Fundstellen:
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/renderer/meeting-participant/ui/MeetingParticipantManagementPanel.js`
  - `src/renderer/meeting-participant/ui/MeetingParticipantList.js`
  - `src/renderer/meeting-participant/ui/MeetingParticipantSelector.js`
- Art: Bedien-/Bearbeitungsliste
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - Teilnehmer
  - Firma
  - Funktion
  - Kontakt
  - Aktiv
  - Invited
  - Aktion
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - das sind Status- und Bedienfelder einer Bearbeitungsoberflaeche
  - keine Tabelle fuer den Tabellenlayout-Editor

### 2.4 Teilnehmerliste im Protokoll / Ausdruck / `protokoll_participants`

- Arbeitsname: Teilnehmerliste
- tableKey: `protokoll_participants`
- Bereich/Modul: `protokoll`
- Fundstellen:
  - `src/renderer/meeting-participant/ui/MeetingParticipantList.js`
  - `src/renderer/meeting-participant/ui/MeetingParticipantManagementPanel.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/main/ipc/participantsIpc.js`
  - `src/main/preload.js`
  - `src/main/print/printData.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
- Art: Inhaltstabelle
- Verwendung: UI und PDF-Vorschau
- aktuell im Tabelleneditor: ja
- sichtbare Spalten:
  - Name
  - Funktion
  - Firma
  - Telefon / E-Mail
  - Anwesend / Verteiler
- Empfehlung: bereits registriert
- Risiko/Bemerkung:
  - die Tabelle ist fachlich vorhanden, aber von Auswahl- und Bearbeitungsdialogen umgeben
  - produktive UI- und PDF-Anschluesse bleiben vorerst Vorschau

### 2.5 ToDo-Liste

- Arbeitsname: ToDo-Liste
- vorgeschlagener tableKey: nicht eindeutig genug fuer eine Editor-Registrierung
- Bereich/Modul: `protokoll` / Ausgabe
- Fundstellen:
  - `src/shared/print/printModes.mjs`
  - `src/main/print/printData.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `src/renderer/ui/MainHeader.js`
- Art: Inhaltstabelle
- Verwendung: PDF
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - Gruppierung nach Verantwortlichkeitsbereich
  - Position
  - Titel
  - Status
  - Fälligkeit
  - Ampel
- Empfehlung: später prüfen
- Risiko/Bemerkung:
  - fachlich ist es eine echte Ausgabeliste
  - für den Editor ist die fachliche Abgrenzung zum Aufgaben-/Responsibility-Flow noch zu pruefen

### 2.6 Firmenliste als Druckausgabe / aktuelle Projektfirmen

- Arbeitsname: Firmenliste (Druck)
- vorgeschlagener tableKey: nicht eindeutig genug als eigene Editor-Tabelle
- Bereich/Modul: `projektverwaltung` / Ausgabe
- Fundstellen:
  - `src/main/print/printData.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `src/renderer/ui/MainHeader.js`
- Art: Unklar
- Verwendung: PDF
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - keine echte Spaltentabelle, sondern Firmenblock/Karten
  - sichtbar sind Firmenblock, E-Mail, Tel, Funk und Vertreter/Personenblock
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - fachlich nahe an der Projekt-Firmenliste, aber als Karten-/Blockausgabe aufgebaut
  - fuer den Tabellenlayout-Editor zu uneindeutig

## 3. Bedienlisten

### 3.1 Druckart-Auswahl

- Arbeitsname: Druckart-Auswahl
- vorgeschlagener tableKey: -
- Bereich/Modul: Ausgabe
- Fundstellen:
  - `src/renderer/ui/MainHeader.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `src/shared/print/printModes.mjs`
- Art: Bedienliste
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten: keine
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - Startdialog fuer den Druckabzweig
  - keine Inhaltstabelle

### 3.2 Protokollauswahl zum Drucken

- Arbeitsname: Protokollauswahl zum Drucken
- vorgeschlagener tableKey: -
- Bereich/Modul: Ausgabe / Protokoll
- Fundstellen:
  - `src/renderer/ui/ClosedProtocolSelector.js`
  - `src/renderer/ui/MainHeader.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
- Art: Bedienliste
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten: keine Tabellenlayout-Spalten
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - Auswahl geschlossener Besprechungen fuer den Protokolldruck

### 3.3 ToDo-Verantwortlichen-Auswahl

- Arbeitsname: Verantwortlichen-Auswahl ToDo-Druck
- vorgeschlagener tableKey: -
- Bereich/Modul: Ausgabe
- Fundstellen:
  - `src/renderer/modules/ausgabe/PrintModal.js`
- Art: Bedienliste
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten: keine Tabellenlayout-Spalten
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - Filterdialog mit `Alle` und Verantwortlichen/Besitzer-Auswahl
  - gehoert fachlich zum Druckdialog, nicht in den Tabelleneditor

### 3.4 Projekt-/Firma-/Person-Auswahllisten

- Arbeitsname: Projekt-/Firma-/Person-Auswahllisten
- vorgeschlagener tableKey: -
- Bereich/Modul: Projektverwaltung / Teilnehmer / Firmenpool
- Fundstellen:
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/renderer/meeting-participant/ui/MeetingParticipantSelector.js`
  - `src/renderer/views/FirmsPoolView.js`
  - `src/renderer/views/ProjectFirmsView.js`
- Art: Bedienliste
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten: keine Tabellenlayout-Spalten
- Empfehlung: nicht aufnehmen
- Risiko/Bemerkung:
  - Auswahl- und Zuordnungslisten
  - keine klaren Inhaltstabellen fuer den Editor

## 4. Unklar

### 4.1 Firmenstamm / Firmenliste

- Arbeitsname: Firmenstamm-Firmenliste
- vorgeschlagener tableKey: nicht eindeutig genug
- Bereich/Modul: Firmenverwaltung
- Fundstellen:
  - `src/renderer/views/FirmsView.js`
- Art: Unklar
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - Name
  - Kurzbez.
- Empfehlung: später prüfen
- Risiko/Bemerkung:
  - die Tabellenliste ist eng mit Firmen- und Personenformularen gekoppelt
  - ohne weiteren Scope ist die Aufnahme in den Tabelleneditor zu breit

### 4.2 Personenliste im Firmenstamm

- Arbeitsname: Personenliste im Firmenstamm
- vorgeschlagener tableKey: nicht eindeutig genug
- Bereich/Modul: Firmenverwaltung
- Fundstellen:
  - `src/renderer/views/FirmsView.js`
- Art: Unklar
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - Name
  - Funktion/Rolle
  - E-Mail
  - Telefon
- Empfehlung: später prüfen
- Risiko/Bemerkung:
  - Teil der Firmenverwaltung, aber nicht als isolierte Fachliste aufgebaut

### 4.3 Firmenpool / Firmen im Projekt hinzufügen

- Arbeitsname: Firmenpool
- vorgeschlagener tableKey: nicht eindeutig genug
- Bereich/Modul: Projektverwaltung
- Fundstellen:
  - `src/renderer/views/FirmsPoolView.js`
- Art: Unklar
- Verwendung: UI
- aktuell im Tabelleneditor: nein
- sichtbare Spalten:
  - Firma
  - Typ
  - Aktiv
  - rechts: Mitarbeiterliste je Firma
- Empfehlung: später prüfen
- Risiko/Bemerkung:
  - duale Zuordnungsoberflaeche mit Listencharakter
  - kein schmaler, klarer Tabellenlayout-Kandidat

## 5. Bereits registriert

Aktuell im Tabellenlayout-Editor registriert:

- `protokoll_tops` / TOP-Liste
- `protokoll_participants` / Teilnehmerliste
- `project_firms` / Projekt-Firmenliste

Noch nicht registriert, aber als Kandidat dokumentiert:

- ToDo-Liste

## 6. Kandidaten mit Nutzerfreigabe

Diese Tabellen sind fachlich als Kandidaten dokumentiert, brauchen aber vor einer Registrierung ausdrueckliche Nutzerfreigabe:

- ToDo-Liste
- Firmenstamm-Firmenliste
- Personenliste im Firmenstamm

## 7. Nicht in den Editor

Explizit nicht in den Tabellenlayout-Editor gehoeren:

- Druckart-Auswahl
- Protokollauswahl zum Drucken
- ToDo-Verantwortlichen-Auswahl
- Projekt-/Firma-/Person-Auswahllisten
- Firmenpool / Zuordnungslisten
