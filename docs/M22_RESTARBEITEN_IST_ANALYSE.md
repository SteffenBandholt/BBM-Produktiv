# M22 Restarbeiten Ist-Analyse

## Kurzfazit

Restarbeiten ist in BBM-Produktiv technisch erreichbar und als eigenes Renderer-Modul angebunden. Der aktuelle Stand ist aber kein fachlich fertiges Produktivmodul.

Vorhanden sind:
- Modulstart ueber den Projektkontext
- eigener Restarbeiten-Screen
- Liste, Filterleiste, Blattansicht, Editbox und eigene Quicklane
- Datenmodell, Repository, IPC- und Preload-Wege fuer Restarbeiten, Projektsettings, Attachments und Notizen
- echte Create-/Update-/Soft-Delete-Wege fuer Restarbeiten
- Notiz-Popup mit Speichern und lesender Historie
- vorbereitete Foto-/Attachment-Wege im Main-Prozess
- UI-Editor-Registrierung fuer Restarbeiten als Pilot-Scope

Nicht fertig sind insbesondere:
- fachliche Abnahme der Arbeitsablaeufe
- PDF-/Druck-/Mail-Anbindung aus dem sichtbaren Restarbeiten-Screen
- Foto-UI im aktiven Screen
- Diktat-Anbindung
- abgeschlossene fachliche Regeln fuer Status, Erledigung, Archivierung, Abschluss und Ausgabe
- Konsolidierung der parallelen UI-Editor-/Runtime-Spuren

## Modulstatus

Restarbeiten ist im statischen Modulkatalog enthalten:
- `src/renderer/app/modules/moduleCatalog.js`
- `src/renderer/modules/restarbeiten/index.js`

Der produktive Default-Modulumfang enthaelt aktuell `protokoll` und `restarbeiten`. Restarbeiten ist damit technisch im aktiven Modulumfang. Das ist nicht gleichbedeutend mit fachlicher Fertigstellung.

Der Modulentry definiert:
- `moduleId`: `restarbeiten`
- `moduleLabel`: `Restarbeiten`
- `workScreenId`: `restarbeitenWork`
- Screen: `RestarbeitenScreen`
- Projekt-Navigation mit Section `restarbeiten`
- Shell-Regel `hideSidebar: true`

## Erreichbarkeit

Restarbeiten ist ueber Projektkontext erreichbar:
- Projekt-Arbeitsbereich: `ProjectWorkspaceScreen.openProjectModule(moduleId)`
- Projektkachel: `ProjectsScreen._openProjectModuleFromTile(...)`
- Router: `Router.openProjectModule(projectId, "restarbeiten", options)`

Der direkte Projektklick startet weiterhin primaer `protokoll`. Restarbeiten wird als eigener Projektmodul-Start angeboten, wenn das Modul im aktiven Modulumfang enthalten ist.

Der Router laedt den Modul-Screen ueber:
- `getActiveProjectModuleNavigation()`
- `resolveActiveModuleScreen(...)`
- `new RestarbeitenScreen({ router, projectId, project, moduleId })`

## Dateien / Einstiegspunkte

Aktives Renderer-Modul:
- `src/renderer/modules/restarbeiten/index.js`
- `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
- `src/renderer/modules/restarbeiten/screens/index.js`
- `src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js`
- `src/renderer/modules/restarbeiten/RestarbeitenMainBody.js`
- `src/renderer/modules/restarbeiten/RestarbeitenList.js`
- `src/renderer/modules/restarbeiten/RestarbeitenEditbox.js`
- `src/renderer/modules/restarbeiten/RestarbeitenQuicklane.js`
- `src/renderer/modules/restarbeiten/styles.js`
- `src/renderer/modules/restarbeiten/styles/restarbeiten.css`
- `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js`
- `src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js`

Main-/Datenwege:
- `src/main/db/database.js`
- `src/main/db/restarbeitenRepo.js`
- `src/main/ipc/restarbeitenIpc.js`
- `src/main/preload.js`

UI-Editor-/Pilot-Scope:
- `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`
- `src/renderer/uiEditor/bbmUiEditorRegistry.js`
- `src/renderer/modules/restarbeiten/editor/restarbeitenEditorScopes.js`
- `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js`
- `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
- `src/renderer/editorRuntime/catalog/bbmEditorCatalog.js`

Restarbeiten V2 / ReadOnly-Vorbereitung:
- `src/renderer/modules/restarbeitenV2/*`
- dokumentiert als ReadOnly-/Mapper-/Adaptergrenze, nicht als aktiver sichtbarer Screen.

## Datenfluss

### Geladene Daten

Der aktive Restarbeiten-Screen laedt beim `load()` parallel:
- Restarbeiten eines Projekts ueber `listRestarbeitenByProject(projectId)`
- projektspezifische Restarbeiten-Settings ueber `getRestarbeitenProjectSettings(projectId)`
- verantwortliche Projektfirmen ueber `listResponsibleProjectFirms(projectId)`

Die Liste wird im Renderer ueber `toRestarbeitenListItems(...)` normalisiert und fuer die UI formatiert.

### IPC-/DB-Funktionen

Preload stellt bereit:
- `restarbeitenListByProject`
- `restarbeitenGetProjectSettings`
- `restarbeitenCreateItem`
- `restarbeitenUpdateItem`
- `restarbeitenSoftDeleteItem`
- `restarbeitenListAttachments`
- `restarbeitenListNotes`
- `restarbeitenCreateNote`
- `restarbeitenSetPrimaryAttachment`
- `restarbeitenImportAttachments`
- `restarbeitenDeleteAttachment`

Main-IPC registriert die entsprechenden Handler in `src/main/ipc/restarbeitenIpc.js`.

Das Repository stellt bereit:
- `ensureRestarbeitProjectSettings`
- `getRestarbeitProjectSettings`
- `createRestarbeitItem`
- `updateRestarbeitItem`
- `listRestarbeitItems`
- `softDeleteRestarbeitItem`
- `addRestarbeitAttachment`
- `setPrimaryRestarbeitAttachment`
- `listRestarbeitAttachments`
- `deleteRestarbeitAttachment`
- `listRestarbeitNotes`
- `createRestarbeitNote`

### Datenbanktabellen

Das Schema enthaelt:
- `restarbeiten_items`
- `restarbeiten_project_settings`
- `restarbeiten_attachments`
- `restarbeiten_notes`

`restarbeiten_items` enthaelt u. a. Projektbezug, laufende Nummer, Verortung 1-4, Kurztext, Langtext, Klasse `rest`/`mangel`, Status, Fertig-bis-Datum, Verantwortlichenbezug, Archiv-/Erledigungs-/Loeschfelder und Zeitstempel.

`restarbeiten_attachments` enthaelt Foto-/Dateipfade, Primary-Markierung und max. 3 Attachments pro Restarbeit im Repo.

`restarbeiten_notes` enthaelt einfache Notizhistorie je Restarbeit.

### CRUD-Wege

Im aktiven Screen nutzbar:
- Liste laden
- ersten Datensatz automatisch auswaehlen
- neuen Draft erstellen
- neuen Datensatz bei Kurztext und Commit/Blur anlegen
- bestehenden Datensatz per Auto-Save aktualisieren
- Soft-Delete ueber Loeschen
- Verantwortlichen aus Projektfirmen auswaehlen
- Notizen laden und anlegen

Vorbereitet, aber im aktiven UI nicht voll fachlich angeschlossen:
- Attachment/Fotos importieren, loeschen, Hauptfoto setzen
- Restarbeiten-Ausgabe fuer Print/PDF ueber vorhandene PrintData-Parameter
- Restarbeiten V2 ReadOnly-Datenquelle

## UI-Zustand

Der aktive Screen besteht aus:
- Root `restarbeiten.root`
- Restarbeiten-Quicklane
- Filterbar
- Main/Blattansicht
- Liste mit Tabellenkopf und Datensatzzeilen
- Editbox
- Notiz-Popup

### Filterbar

Vorhandene Filter:
- Verortung Level 1-4
- Klasse: Alle / Rest / Mangel
- Status
- Fertig bis
- Verantwortlich
- Schliessen zurueck in den Projekt-Arbeitsbereich

Die Labels fuer Verortung kommen aus `restarbeiten_project_settings`, fallback: Haus, Geschoss, Einheit, Raum.

### Main / Liste

Vorhanden:
- Tabellenkopf `Nr.`, `Gegenstand`, `Fertig bis`, `Status`, `Verantw.`
- Datensatzliste als klickbare Zeilen
- Nummer, Erfassungsdatum, Klasse
- Verortung, Kurztext, optional Langtext
- Fertig-bis, Ampel, Status, Verantwortlich
- Foto-Aktionsanker in der Nummernspalte
- leerer Zustand

Provisorisch/unfertig:
- Foto-Aktionsanker ruft aktuell nur einen Stub-Hinweis auf.
- Liste ist fachlich schon strukturiert, aber noch nicht als abgenommener Produktivablauf dokumentiert.
- Erledigung/Archivierung/Abschlussfelder sind im Datenmodell vorhanden, aber im sichtbaren Arbeitsablauf nicht fertig ausgearbeitet.

### Editbox

Vorhanden:
- aktueller Datensatz / neue Nummer
- Neu
- Loeschen
- Klasse Rest/Mangel
- Kurztext mit Pflichtfeld und Zeichengrenze
- Langtext mit Zeichengrenze
- Verortung Level 1-4
- Status
- Fertig bis
- Ampel
- Verantwortlich
- Notiz-Button

Provisorisch/unfertig:
- Kein expliziter Speichern-Button; Speicherung erfolgt per Auto-Save/Commit.
- Diktat-Buttons sind sichtbar vorbereitet, aber deaktiviert.
- Notiz-Popup ist vorhanden, aber Druck ist nur vorbereitet.
- Fachliche Validierung ist minimal: Kurztext ist Pflicht; weitere fachliche Regeln sind nicht sichtbar abgeschlossen.

### Quicklane

Vorhanden:
- Fixieren/Loesen
- Projekt
- Firmen
- Ampel an/aus
- Langtext an/aus
- PDF-Vorschau
- Drucken deaktiviert
- E-Mail deaktiviert

Provisorisch/unfertig:
- PDF-Vorschau zeigt nur Stub-Meldung.
- Drucken und E-Mail sind sichtbar deaktiviert.
- Quicklane nutzt eigene Restarbeiten-Implementierung; daneben existiert auch generische/alte `ProjectContextQuicklane`-Logik mit Restarbeiten-Bezug. Das ist ein Konsolidierungsrisiko, solange beide Pfade mental vermischt werden.

## Vorhandene Funktionen

Erkennbar nutzbar:
- Modul im Projektkontext oeffnen
- Restarbeitenliste laden
- Restarbeit auswaehlen
- Restarbeit neu anlegen
- Restarbeit automatisch speichern/aktualisieren
- Restarbeit soft-loeschen
- Klasse Rest/Mangel setzen
- Status setzen
- Fertig-bis-Datum setzen
- Verortung pflegen
- Verantwortlichen aus Projektfirmen setzen oder leeren
- Liste filtern
- Ampel-/Langtext-Anzeige umschalten
- Notizhistorie oeffnen
- Notiz hinzufuegen

Technisch vorhanden, aber fachlich noch nicht durchgaengig im aktiven UI:
- Fotos/Attachments importieren, loeschen, Hauptfoto setzen
- PDF-/Druck-/Mail-Datenpfad fuer Restarbeiten
- Restarbeiten V2 ReadOnly-Normalisierung

## Unfertige Funktionen

Fuer einen ersten fachlich nutzbaren Stand fehlen mindestens:
- fachlich abgenommene Definition fuer "Restarbeit erledigt", "Mangel", "Verzug", "Abschluss", "Archivierung" und "Loeschen"
- klares Speicher- und Fehlerverhalten aus Nutzersicht
- sichtbare Fotoverwaltung im aktiven Screen
- echte Ausgabe/PDF/Druck-Anbindung aus dem Restarbeiten-Screen
- echte Mail-Anbindung oder bewusste Nicht-Ziel-Entscheidung
- fachlich klare Notiz-Druckausgabe
- Diktat-Anbindung oder klare Entfernung/Deaktivierungsentscheidung im Restarbeiten-Kontext
- fachliche Sichtpruefung mit realen Projekten und Projektfirmen

## Stubs / Platzhalter

Vorhandene Stubs/Platzhalter:
- `openRestarbeitenPreview()` meldet "PDF Voransicht folgt in M2."
- `openRestarbeitenOutput()` meldet "Ausgabe, Druck und E-Mail folgen in M2."
- `openRestarbeitPhotos()` meldet "Fotos folgen in einem spaeteren Paket."
- Diktat-Buttons in der Editbox sind deaktiviert und mit "Diktat wird spaeter angebunden" versehen.
- Quicklane-Drucken und Quicklane-E-Mail sind deaktiviert.
- Notiz-Drucken erzeugt nur ein strukturiertes Prepared-Ergebnis und setzt Status "Druck vorbereitet"; keine echte PDF-/Printstrecke.
- Restarbeiten V2 Standard-DataSource wirft bewusst "noch nicht angebunden"; Fake- und ReadOnly-Adapter dienen Tests/Vorbereitung.

## PDF / Ausgabe / Mail / Fotos / Notizen

### PDF / Ausgabe / Mail

Im Main-Prozess existiert Restarbeiten-Unterstuetzung in den Print-Datenpfaden ueber `mode === "restarbeiten"` und Parameter wie `restarbeitenRows`, `restarbeitenLocationLabels` und `showAmpelInList`.

Im aktiven Restarbeiten-Screen ist diese Strecke nicht produktiv verdrahtet:
- PDF-Vorschau ist Stub.
- Ausgabe/Druck/E-Mail ist Stub oder deaktiviert.
- Es gibt keine sichtbare fachlich abgenommene Restarbeiten-PDF-Ausgabe.

### Fotos / Attachments

Technisch vorhanden:
- DB-Tabelle `restarbeiten_attachments`
- Repo-Funktionen fuer Add/List/SetPrimary/Delete
- IPC fuer Import/Delete/SetPrimary/List
- Import kopiert Dateien in Projektordner `Restarbeiten/Fotos`
- max. 3 Attachments pro Restarbeit

Im aktiven Screen:
- Foto-Anker existiert in Listenzeilen.
- Foto-Aktion zeigt nur Stub-Meldung.
- Keine sichtbare Galerie, kein Importbutton, keine Loesch-/Hauptfoto-Bedienung.

### Notizen

Technisch und UI-seitig teilweise vorhanden:
- DB-Tabelle `restarbeiten_notes`
- IPC fuer Listen und Anlegen
- DataSource-Funktionen
- Notiz-Button in der Editbox
- Popup mit Historie, leerem Zustand, Eingabefeld, Hinzufuegen, Drucken und Schliessen

Unfertig:
- Drucken ist nur vorbereitet.
- Keine Bearbeiten-/Loeschen-Funktion fuer Notizen sichtbar.
- Keine Benutzer-/Autorenlogik sichtbar abgeschlossen.

## Tests

Vorhandene Restarbeiten-Testbereiche:
- `scripts/tests/restarbeitenModule.test.cjs`
- `scripts/tests/restarbeitenDataModel.test.cjs`
- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `scripts/tests/restarbeitenEditorRegistry.domAnchors.test.cjs`
- `scripts/tests/restarbeitenV2DevAccess.test.cjs`
- `scripts/tests/restarbeitenV2DataContract.test.cjs`
- `scripts/tests/restarbeitenV2DataSource.test.cjs`
- `scripts/tests/restarbeitenV2Mapper.test.cjs`
- `scripts/tests/restarbeitenV2ReadOnlyAdapter.test.cjs`
- `scripts/tests/restarbeitenV2LegacyReadBridge.test.cjs`
- `scripts/tests/restarbeitenV2ReadPathInventory.test.cjs`
- `scripts/tests/restarbeitenV2ReadPathDecision.test.cjs`
- `scripts/tests/restarbeitenV2ReadOnlyDataSourceFactory.test.cjs`
- ausserdem UI-Editor-/Registry-/Runtime-Tests mit Restarbeiten-Scope in `bbmUiEditorRegistry.test.cjs`, `bbmUiEditorRuntimeLauncher.test.cjs`, `editorRuntime.catalog.test.cjs`, `editorScopeInspector.test.cjs` und Boundary-Tests.

Was die Tests gut abdecken:
- Modulentry und Erreichbarkeit im Projektkontext
- Projektkachel-/Projektmodulpfade
- aktiver M1-Screen statt Platzhalter
- Main/Body-Tabellenkopf und Datensatzzeilen
- Quicklane-Methoden und Bereiche
- UI-Editor-Zielgruppen und DOM-Anker
- generischer UI-Editor-Target-Contract
- Filterbar, Editbox, Auto-Save, Soft-Delete, Notiz-Popup
- Ampellogik einschliesslich zeitstabilisiertem Draft-Test
- Datenmodell, Statusnormalisierung, Running Number, Soft Delete
- Attachments: max. 3, Primary, Delete
- Notizen: speichern/listen/Soft-Delete-Historie
- IPC-/Preload-Wege bleiben vorhanden
- V2-ReadOnly-/Mapper-/Inventargrenzen

Wichtige fachliche Luecken in Tests:
- kein echter App-End-to-End-Test mit Electron-Sichtpruefung
- keine fachliche Abnahme realer Projekt-/Firmen-/Restarbeiten-Daten
- keine echte PDF-/Druck-/Mail-Ausgabe fuer Restarbeiten
- keine sichtbare Foto-UI, Import-/Delete-/Primary-Bedienung im aktiven Screen
- keine Tests fuer komplexe Filterkombinationen mit realen Datenmengen
- keine Tests fuer Konfliktfaelle bei Auto-Save, paralleler Bearbeitung oder IPC-Fehlern aus Nutzersicht
- keine abgeschlossene fachliche Status-/Erledigt-/Archiv-Regelpruefung

## UI-Editor-Bezug

Restarbeiten ist als Pilot-Scope geeignet, weil:
- es eine begrenzte, fachlich relevante UI mit Root, Filterbar, Main, Editbox und Quicklane gibt
- die UI-Elemente explizit registriert sind
- `data-ui-editor-id` im DOM verwendet wird
- Fachaktionen wie Neu, Loeschen, Foto, Notiz, PDF, Drucken und E-Mail als geschuetzte Aktionen bzw. nicht editorfaehige Fachziele behandelt werden koennen
- Tests Registry und DOM-Anker absichern

Wichtig:
- Der generische UI-Editor darf keine Restarbeiten-Fachlogik enthalten.
- Der Editor darf keine Restarbeiten-Daten laden, speichern, loeschen, importieren oder drucken.
- Der Editor darf keine Ziel-App-Oberflaeche scannen.
- Die Ziel-App liefert die ElementRegistry; der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.

Aktuelle Risiken:
- Es gibt den etablierten BBM-UI-Editor-Scope `restarbeiten.screen`.
- Daneben gibt es eine zweite Runtime-Schiene `restarbeiten.ui.main` mit eigener Registry und HostAdapter.
- Bestehende Bewertung `docs/EDITOR_M2_M4_BEWERTUNG.md` empfiehlt, M3/M4 einzufrieren, solange nicht entschieden ist, welcher Weg kanonisch ist.
- Alte UI-Inspector-Dateien enthalten historische Restarbeiten-Landkarten/Scan-Begriffe. Diese duerfen nicht als Zielrichtung fuer neue automatische Erkennung verstanden werden.

## Risiken

- Restarbeiten wirkt durch erreichbaren Modulstart produktiver, als es fachlich ist.
- Auto-Save ohne expliziten Speichern-Button braucht fachliche Sichtpruefung, weil Nutzererwartung und Fehlerverhalten kritisch sind.
- Foto-/Attachment-Datenwege sind technisch vorhanden, aber nicht sichtbar/fachlich abgeschlossen.
- PDF-/Druck-/Mail-Wege sind teils allgemein vorbereitet, aber im Restarbeiten-Screen noch Stub.
- Notizen sind teilweise nutzbar, aber Druck/Autoren-/Historienregeln sind nicht fertig.
- Status-/Erledigungs-/Archivfelder existieren, ohne dass alle fachlichen Regeln im sichtbaren Modul abgeschlossen wirken.
- Zwei UI-Editor-/Runtime-Registrierungswege koennen spaeter Verwirrung erzeugen.
- V2-/ReadOnly-Dateien sind vorhanden, aber kein aktiver V2-Screen; sie duerfen nicht als fertige Produktivfunktion gelesen werden.
- Fachliche Bedienbarkeit ist durch Tests nicht ersetzt.

## Empfohlene naechste Meilensteine

### M23: Fachliche Nutzbarkeitsgrenze fuer Restarbeiten festlegen
- Entscheiden, was der erste echte nutzbare Restarbeiten-Stand koennen muss.
- Statuswerte, Pflichtfelder, Erledigung, Loeschen, Archivierung und Verantwortliche fachlich festlegen.
- Auto-Save-Verhalten aus Nutzersicht bestaetigen oder Anpassungsbedarf dokumentieren.
- Keine UI-Editor-Funktion bauen.

### M24: Restarbeiten Foto-UI fachlich schneiden
- Auf Basis vorhandener Attachment-Wege klaeren, ob Fotos fuer den ersten nutzbaren Stand Pflicht sind.
- Wenn ja: separate UI-/PDF-Entwurfsentscheidung vor Umsetzung.
- Import, Anzeige, Hauptfoto, Loeschen und Fehlerfaelle fachlich beschreiben.

### M25: Restarbeiten Ausgabe/PDF/Druck/Mail getrennt klaeren
- Entscheiden, welche Ausgabe zuerst gebraucht wird: Liste, Detailblatt, Notizhistorie oder Mail.
- Vor Umsetzung eine separate UI-/PDF-Entwurfsentscheidung erstellen.
- Maschinenraum-Dienste nutzen, aber keine Ausgabe-/Mail-Logik in Restarbeiten verstecken.

### M26: UI-Editor-Spuren konsolidieren
- Keine neue Editor-Funktion.
- Nur klaeren, welcher Restarbeiten-Registry-Weg kanonisch bleibt.
- Eingefrorene Runtime-Schiene `restarbeiten.ui.main` nicht weiterentwickeln, solange keine separate Entscheidung vorliegt.

## Klare Abgrenzung

Gehoert in Restarbeiten:
- Restarbeiten-Fachstatus
- Restarbeiten-Daten
- Restarbeiten-CRUD
- Verortung, Verantwortliche, Fotos, Notizen
- fachliche Ausgabeanforderungen
- fachliche UI des Restarbeiten-Moduls
- Ziel-App-ElementRegistry fuer Restarbeiten

Gehoert nicht in den generischen UI-Editor:
- Restarbeiten-Fachlogik
- Restarbeiten-DB-/IPC-Zugriff
- Speichern, Anlegen, Loeschen, Fotoimport, Notizspeicherung
- PDF-/Druck-/Mail-Ausfuehrung
- automatische UI-Erkennung
- UI-Scanning oder DOM-Scan
- automatische Registry-Befuellung
- Ableitung von Editor-Zielen aus sichtbarer UI oder DOM-Struktur

Der UI-Editor bleibt generisch. Restarbeiten liefert als Ziel-App-Scope nur die bewusst registrierte ElementRegistry.
