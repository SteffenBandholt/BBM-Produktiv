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

## Pruefung

G27 wird durch HostAdapter- und Launcher-Tests abgesichert:

- `persistent: true` fuer `operation: "visibility"` bleibt blockiert.
- `persistent: false` bleibt Preview/Dry-Run/in-memory.
- `canPersistVisibility` bleibt `false`.
- Es entstehen keine DB-/IPC-/Datei-/Storage-Schreibwege.
