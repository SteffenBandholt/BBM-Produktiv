# UI-Editor Hinweis-Infotext Restarbeit-Kontext Analyse

## Kurzfazit

Der spaetere Speicherweg braucht nicht nur `projectId`, sondern eine eindeutig
gemeinte `restarbeitId`. Diese ID ist im heutigen Restarbeiten-Screen bereits
vorhanden, aber nur lokal im Fachmodul-Kontext und nicht im
`BbmUiEditorRuntimeLauncher`. Der UI-Editor-Draft hat zurzeit keine direkte
Zuordnung zu einer konkreten Restarbeit.

## Untersuchte Dateien / Module

- `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
- `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js`
- `src/main/ipc/restarbeitenIpc.js`
- `src/main/db/restarbeitenRepo.js`
- `src/main/preload.js`
- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- `docs/UI_EDITOR_HINWEIS_INFOTEXT_CREATE_NOTE_VERTRAG.md`

## Gefundene Quellen fuer `restarbeitId`

- aktive Restarbeit in der Restarbeiten-UI:
  - `this.selectedId`
  - `this.draft?.id`
  - `this.notesPopup.restarbeitId`
- Notes-Overlay der Restarbeiten-UI:
  - `RestarbeitenScreen._openNotesPopup()`
  - `RestarbeitenScreen._addNoteFromPopup()`
  - `RestarbeitenScreen.printRestarbeitNoteHistory()`
- DataSource:
  - `createRestarbeitNote(restarbeitId, noteText)`
  - `listRestarbeitNotes(restarbeitId)`
- IPC / Repo:
  - `restarbeiten:createNote`
  - `repo.createRestarbeitNote(restarbeitId, noteText)`

## Gefundene Quellen fuer `projectId`

- `RestarbeitenScreen` bekommt `projectId` beim Start aus dem Projektkontext
- `listRestarbeitenByProject(this.projectId)`
- `getRestarbeitenProjectSettings(this.projectId)`
- `listResponsibleProjectFirms(this.projectId)`
- `importRestarbeitAttachments(restarbeitId, projectId)`
- `src/main/ipc/restarbeitenIpc.js` erwartet `projectId` bei anderen Restarbeiten-
  Wegen, aber `restarbeiten:createNote` selbst braucht aktuell nur `restarbeitId`
  und `noteText`

## Vorhandener Kontext in der Restarbeiten-UI

- Der Restarbeiten-Screen verwaltet `selectedId` und `draft.id`.
- Die Notizfunktion nutzt die aktuell selektierte Restarbeit als
  `restarbeitId`.
- Der Notiz-Dialog zeigt bereits den Kontext der gewaehlten Restarbeit.
- Die Restarbeiten-UI kennt also die fachliche Ziel-Restarbeit bereits, aber
  nur innerhalb ihres eigenen Screens.

## Vorhandener Kontext im UI-Editor-Launcher

- Der UI-Editor-Launcher zeigt nur read-only Surface-Kontext.
- Er arbeitet mit `restarbeiten.ui.main`, PDF/Plan-read-only Kontext und dem
  Hinweis-/Infotext-Draft.
- Er traegt aktuell keine `restarbeitId`, keine aktive Restarbeiten-Auswahl und
  keinen direkten Bezug zur Restarbeiten-Liste.

## Luecke zwischen UI-Editor-Draft und `restarbeiten:createNote`

```text
UI-Editor-Draft:
- type: Hinweis / Infotext
- surfaceId: restarbeiten.ui.main
- status: draft
- persisted: false
- text: <aktueller Hinweistext>
```

- Fehlt noch: die eindeutig gemeinte `restarbeitId`.
- Fehlt noch: die klare Zuordnung zur aktuell ausgewahlten Restarbeit.
- Fehlt noch: eine sichtbare Nutzeraktion, die genau diese Restarbeit als Ziel
  bestaetigt.

## Mögliche Strategien

1. UI-Editor wird aus einer konkreten Restarbeit heraus geoeffnet und bekommt
   `restarbeitId` vom Host.
2. UI-Editor zeigt eine klare Ziel-Restarbeit im Speicherbereich an.
3. Speichern bleibt deaktiviert, solange keine eindeutige `restarbeitId`
   vorhanden ist.
4. Der Speicherbutton wird spaeter nur aktiv, wenn Hinweistext gueltig und
   `restarbeitId` eindeutig ist.

## Risiken bei falscher `restarbeitId`

- Notiz landet bei der falschen Restarbeit.
- Die Vorschau bleibt sichtbar richtig, aber der fachliche Datensatz waere
  falsch.
- Ein falscher ID-Transfer wuerde den Speicherweg unzuverlaessig machen.
- Ohne Host-Bestaetigung droht eine stille Fehlzuordnung statt einer klaren
  Blockade.

## Weiterhin nicht umgesetzte Punkte

In G113 wird kein Speicherweg angeschlossen.
Der Button `Entwurf speichern` bleibt deaktiviert.
Es wird kein Submit eingefuehrt.
Es wird keine IPC-/DB-Schreibaktion ausgelöst.
Es wird keine persistente Element-Erstellung eingefuehrt.
Die Payload-Vorschau bleibt reine Anzeige.
`persisted: false` bleibt verbindlich.

## Spater erforderlicher BBM-Kontext

- `projectId`
- `restarbeitId`
- eindeutige Zuordnung zur aktuell gemeinten Restarbeit
- gueltiger Hinweistext
- sichtbare Nutzeraktion zum Speichern

## Guardrails vor spaeterer Aktivierung

- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern ohne gueltigen Hinweistext
- kein Speichern ueber Payload-Vorschau
- kein Speichern ohne sichtbare Nutzeraktion
- kein localStorage
- kein writeFile
- keine Wildcards
- keine Default-true-Freigaben
- keine IPC-/DB-Schreibaktion ohne Host-Zuordnung

## Notwendige Tests vor spaeterer Aktivierung

- Test fuer eine eindeutig uebergebene `restarbeitId`
- Test fuer fehlende `restarbeitId`
- Test fuer gueltigen und leeren Hinweistext
- Test fuer den `restarbeiten:createNote`-Vertrag
- Test fuer die Host-Zuordnung aus der Restarbeiten-UI

## Notwendige Electron-Sichtpruefung vor spaeterer Aktivierung

- Sichtpruefung ist bei einer spaeteren Einfuehrung des Speicherbuttons
  zwingend.
- Geprueft werden sichtbare Ziel-Restarbeit, Aktivzustand und Trennung von
  Anzeige und Speichern.

## Abgrenzung zum UI-Editor-kit

- Das `UI-Editor-kit` speichert nicht.
- BBM-Produktiv bleibt Host und traegt die fachliche Restarbeiten-Zuordnung.
- Keine Aenderung an `../UI-Editor-kit`.

## Empfohlener naechster Schritt

Zuerst eine klare Host-Strategie fuer die Uebergabe von `restarbeitId`
festlegen. Danach kann der Dokumentationsstand spaeter in einen echten
Speicherweg ueberfuehrt werden.

## G114: Uebergabestrategie

- Die Folgeentscheidung ist jetzt in
  `docs/UI_EDITOR_HINWEIS_INFOTEXT_RESTARBEIT_KONTEXT_UEBERGABEENTSCHEIDUNG.md`
  dokumentiert.
- `restarbeitId` wird nicht im UI-Editor gesucht oder geraten.
- Zulassung kommt nur aus dem Host-Kontext `RestarbeitenScreen` bzw. aus
  `notesPopup.restarbeitId`, wenn die UI aus der konkreten Restarbeit heraus
  geoeffnet wurde.

## G115: Sichtbarer Host-Kontext

- Der fehlende Host-Kontext wird jetzt im UI-Editor sichtbar angezeigt.
- Die Analyse bleibt Grundlage; die Anzeige ist keine Uebergabe.
