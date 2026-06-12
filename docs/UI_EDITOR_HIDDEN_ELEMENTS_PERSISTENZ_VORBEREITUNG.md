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

## Pruefung

G27 bis G29 werden durch Modell-, HostAdapter- und Launcher-Tests abgesichert:

- `persistent: true` fuer `operation: "visibility"` bleibt blockiert.
- `persistent: false` bleibt Preview/Dry-Run/in-memory.
- `canPersistVisibility` bleibt `false`.
- Es entstehen keine DB-/IPC-/Datei-/Storage-Schreibwege.
- Das G29-Modell akzeptiert nur `overrides.visible` als Boolean und blockiert fehlende, unbekannte oder unkontrollierte Element-IDs.
