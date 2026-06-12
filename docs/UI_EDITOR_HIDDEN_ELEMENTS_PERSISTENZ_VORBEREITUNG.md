# UI-Editor Hidden-Elements Persistenz-Vorbereitung

## Zweck

G27 bereitet den spaeteren Persistenzvertrag fuer ausgeblendete UI-Editor-Elemente vor, aktiviert aber keine produktive Speicherung.

## Spateres neutrales Override-Modell

Ein spaeter persistierter Visibility-Override kann neutral so beschrieben werden:

```js
{
  scopeId: "restarbeiten.ui.main",
  elementId: "example.field",
  overrides: {
    visible: false
  }
}
```

Der Override enthaelt keine Fachdaten, keine Datensatz-IDs und keine Ableitung aus DOM-Reihenfolge, CSS-Klassen oder sichtbaren Ueberschriften.

## Spaterer ChangeRequest

Der vorbereitete ChangeRequest-Vertrag fuer Hide/Show bleibt:

```js
{
  operation: "visibility",
  payload: {
    visible: false
  },
  source: "preview",
  persistent: false
}
```

Fuer eine spaetere Uebernahme waere derselbe Request mit `persistent: true` denkbar. In G27 darf das aber noch nicht produktiv ausgefuehrt werden.

## Aktueller Blockadevertrag

Aktuell gilt:

- `persistent: false` bleibt Standard fuer Preview-Requests.
- `persistent: true` wird nicht produktiv ausgefuehrt.
- `getCapabilities().persistence` bleibt `false`.
- `getCapabilities().canPersistVisibility` bleibt `false`.
- `getCapabilities().dryRunOnly` bleibt `true`.
- `submitChangeRequests(...)` blockiert weiter mit `PERSISTENCE_DISABLED`.
- Visibility-Requests werden mit `visibilityPersistenceDisabled: true` als nicht persistierbar gemeldet.

## Grenzen

Nicht enthalten:

- keine DB-Schreiblogik
- kein IPC-Schreibweg
- kein `localStorage` oder `sessionStorage`
- kein Datei-Schreibweg
- keine automatische Wiederherstellung beim App-Start
- keine Launcher-/UI-/Drag-/Target-Selection-Aenderung
- keine PDF-/Drucklogik
- keine Fachlogik

## Verantwortlichkeiten

- Das UI-Editor-kit speichert niemals selbst.
- BBM entscheidet spaeter ueber den konkreten Speicherort.
- Der HostAdapter bleibt die Grenze fuer eine spaetere Uebernahme.
- Registry und Layout-State bleiben lesende Quellen fuer die Hidden-Elements-Ermittlung, solange Persistenz nicht freigegeben ist.

## Stand nach G28

Die Speicherort- und Freigabeentscheidung ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_FREIGABE.md` festgelegt.

Empfehlung:

- eigener BBM-seitiger UI-Editor-Layout-Override-Speicher hinter dem HostAdapter
- ein Datensatz pro Element-Override
- erster spaeterer Pilot-Scope: `restarbeiten.ui.main`
- keine globale Freigabe fuer alle Module
- keine PDF-/Druckauswirkung im ersten Persistenzschritt

Weiterhin gilt:

- `canPersistVisibility` bleibt `false`
- `persistent: true` bleibt blockiert
- keine echte Speicherung
- keine DB-Migration
- kein IPC-Schreibweg
- kein `localStorage`
- kein `writeFile`
- kein Wiederherstellen beim App-Start

## Stand nach G29

Die technische Grundlage fuer spaetere UI-Editor-Layout-Overrides ist vorbereitet:

- `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js`
- `normalizeEditorLayoutOverride(input)`
- `validateEditorLayoutOverride(input)`
- `buildVisibilityOverrideFromChangeRequest(changeRequest)`
- `isVisibilityOverridePersistable(changeRequest, capabilities)`

Das Modell ist rein datenbasiert. Es normalisiert und validiert nur den spaeteren Override-Payload:

```js
{
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
  elementId: "example.field",
  overrides: {
    visible: false
  },
  source: "ui-editor",
  createdAt: "ISO-Date",
  updatedAt: "ISO-Date"
}
```

Weiterhin gilt:

- `canPersistVisibility` bleibt `false`
- `persistent: true` bleibt im HostAdapter blockiert
- `isVisibilityOverridePersistable(...)` liefert im aktuellen Capability-Zustand `false`
- kein DB-, IPC-, Datei-, `localStorage`- oder App-Start-Weg wurde ergaenzt

## Stand nach G30

Der HostAdapter-Dry-Run validiert `persistent: true` Visibility-ChangeRequests:

- `operation` muss `visibility` sein
- `payload.visible` muss boolean sein
- `scopeId` muss zum freigegebenen HostAdapter-Scope passen
- `elementId` muss in der Registry bekannt und kontrollierbar sein
- der Request wird in einen Override-Payload uebersetzt

Das Ergebnis bleibt blockiert:

- gueltige persistente Visibility-Requests liefern weiter `PERSISTENCE_DISABLED`
- ungueltige Requests liefern `INVALID_CHANGE_REQUEST`
- `canPersistVisibility` bleibt `false`
- es wird nichts gespeichert

## Stand nach G31

Die Pilot-Persistenz ist fuer `restarbeiten.ui.main` aktiv.

Aktiviert wurde:

- eigener BBM-seitiger Speicher `ui_editor_layout_overrides`
- Repository und IPC hinter dem HostAdapter
- Preload-Methoden fuer den Renderer
- `canPersistVisibility: true` nur im Restarbeiten-HostAdapter fuer `restarbeiten.ui.main`
- Speicherung validierter `persistent: true` Visibility-ChangeRequests
- Lesen gespeicherter Overrides ueber `getCurrentLayoutState(...)`

Weiterhin blockiert bleibt:

- andere Scopes
- andere Operationen als `visibility`
- ungueltige `payload.visible`-Werte
- unbekannte oder unkontrollierte `elementId`
- Registry-Mutation
- UI-Editor-kit-Speicherung
- `localStorage`, Datei-Schreibwege, PDF-/Drucklogik und Fachlogik

## Stand nach G32

Der Restore-Pfad fuer gespeicherte Hidden-Element-Visibility-Overrides ist fuer den Pilot-Scope abgesichert.

Nachgewiesen wurde:

- Ein gueltiger Override fuer `restarbeiten.ui.main` wird gespeichert.
- Ein neuer HostAdapter-/Lesezyklus laedt den gespeicherten Override ueber `loadCurrentLayoutState()`.
- `getCurrentLayoutState("restarbeiten.ui.main")` liefert danach `overrides.visible` und top-level `visible`.
- `visible: false` wird von der Hidden-Elements-Logik als hidden erkannt.
- Nach Speichern von `visible: true` wird das Element nicht mehr als hidden gezaehlt.
- Die Registry wird nicht mutiert.

Weiterhin blockiert bleibt:

- andere Scopes
- andere Operationen als `visibility`
- ungueltige `payload.visible`-Werte
- unbekannte oder unkontrollierte `elementId`
- UI-Editor-kit-Speicherung
- `localStorage`, Datei-Schreibwege, PDF-/Drucklogik und Fachlogik

## Pruefung

G27 bis G32 werden durch Modell-, HostAdapter-, Storage-/IPC- und Launcher-Tests abgesichert:

- `persistent: true` fuer `operation: "visibility"` wird nur im Pilot-Scope gespeichert.
- `persistent: false` bleibt Preview/Dry-Run/in-memory.
- `canPersistVisibility` ist nur fuer `restarbeiten.ui.main` aktiv.
- Es entstehen keine `localStorage`- oder Datei-Schreibwege.
- Das G29-Modell akzeptiert nur `overrides.visible` als Boolean und blockiert fehlende, unbekannte oder unkontrollierte Element-IDs.
- Der G31-HostAdapter speichert nur validierte Visibility-Overrides und liest sie als Layout-State zurueck.
- Der G32-Restore-Test simuliert einen neuen Adapter-/Lesezyklus und prueft, dass die Hidden-Elements-Logik `visible: false` als hidden und `visible: true` nicht als hidden behandelt.
