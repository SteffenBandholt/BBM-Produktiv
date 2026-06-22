# G140 - UI-Editor Speichervertrag fuer echte UI-Elementaenderungen

## Ausgangslage nach G139

Der UI-Editor ist fachlich wieder auf UI-Elementbearbeitung ausgerichtet. Er
ist kein Restarbeiten-Notizformular. Der Restarbeiten-Notizweg bleibt deshalb
nicht als UI-Element-Speicherweg verwendbar.

Im normalen UI-Pfad gilt weiter:

- Editieren bleibt moeglich.
- Speichern bleibt blockiert.
- Blockiergrund: `Speichervertrag fuer UI-Elementaenderungen fehlt noch`.
- Es gibt kein automatisches Speichern beim Oeffnen.
- Es gibt kein localStorage und kein writeFile.

## Vorhandene Speicherwege

### `uiEditorLayoutOverrides`

Gefundene Bausteine:

- DB-Tabelle: `ui_editor_layout_overrides`
- Repository: `src/main/db/uiEditorLayoutOverridesRepo.js`
- IPC: `uiEditorLayoutOverrides:getMany`
- IPC: `uiEditorLayoutOverrides:save`
- Preload: `window.bbmDb.uiEditorLayoutOverridesGetMany`
- Preload: `window.bbmDb.uiEditorLayoutOverridesSave`
- HostAdapter-Nutzung:
  `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js`

Fachlicher Inhalt:

- `targetAppId`
- `moduleId`
- `scopeId`
- `elementId`
- `overrides.visible`
- `createdAt`
- `updatedAt`

Bewertung:

Dieser Weg ist fuer den Pilot-Scope `restarbeiten.ui.main` bewusst auf
Visibility-Overrides begrenzt. Das Repository akzeptiert nur `visible` als
Override-Key und blockiert andere Scopes. Es ist deshalb geeignet fuer
Sichtbarkeit, aber nicht als allgemeiner Speichervertrag fuer UI-Elementtext,
Label, Beschriftung, Reihenfolge oder weitere Eigenschaften.

### `tableLayouts`

Gefundene Bausteine:

- DB-Tabelle: `table_layouts`
- Repository: `src/main/db/tableLayoutsRepo.js`
- IPC: `tableLayouts:getMany`
- IPC: `tableLayouts:getOne`
- IPC: `tableLayouts:save`
- IPC: `tableLayouts:reset`
- IPC: `tableLayouts:listDefinitions`
- Preload: `window.bbmDb.tableLayoutsGetMany`
- Preload: `window.bbmDb.tableLayoutsGetOne`
- Preload: `window.bbmDb.tableLayoutsSave`
- Preload: `window.bbmDb.tableLayoutsReset`
- Preload: `window.bbmDb.tableLayoutsListDefinitions`

Fachlicher Inhalt:

- `tableKey`
- `moduleId`
- `orientation`
- `scopeType`
- `scopeId`
- `schemaVersion`
- `layout`
- `createdAt`
- `updatedAt`

Bewertung:

Dieser Weg ist fuer Tabellenlayouts und deren validierte Layoutwerte
vorgesehen. Er ist nicht der richtige Speicherort fuer freie
UI-Elementtexte, Labels oder allgemeine Element-Eigenschaften. Eine Nutzung
fuer Hinweis-/Infotext-Text waere eine fachliche Vermischung.

### Settings-, Project- und Fach-IPC-Wege

Gefundene Muster:

- `appSettings:*`
- `projectSettings:*`
- `projects:*`
- `restarbeiten:*`

Bewertung:

Diese Wege speichern App-/Projekt- oder Fachmoduldaten. Sie sind nicht fuer
neutrale UI-Elementaenderungen gedacht. Besonders `restarbeitenCreateNote`
und der Kanal `restarbeiten:createNote` speichern Restarbeiten-Notizen und
sind nicht als UI-Element-Speicherweg geeignet.

## Fachlich korrekter Zielvertrag

Der neue Vertrag soll sich an den bestehenden Mustern orientieren:

- eigene DB-Tabelle
- eigenes Repository mit Normalisierung und Validierung
- eigene IPC-Kanaele
- eigene Preload-Methoden unter `window.bbmDb`
- keine Wildcard-Freigabe
- keine automatische Auswahl einer Restarbeit
- kein Restarbeiten-Notizspeichern

Vorgeschlagene Namen:

- Preload Save: `window.bbmDb.uiEditorSaveElementOverride(payload)`
- Preload Load: `window.bbmDb.uiEditorGetElementOverrides(filter)`
- IPC Save: `uiEditorElementOverrides:save`
- IPC Load: `uiEditorElementOverrides:getMany`
- Repository: `src/main/db/uiEditorElementOverridesRepo.js`
- Tabelle: `ui_editor_element_overrides`

## Payload-Struktur

Mindeststruktur:

```js
{
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  projectId: "04-2026",
  surfaceId: "restarbeiten.ui.main",
  elementId: "restarbeiten.table.status.label",
  elementType: "label",
  changes: {
    text: "Neuer Text",
    visible: true,
    order: 20
  },
  updatedAt: "2026-06-22T10:00:00.000Z"
}
```

Pflichtfelder:

- `projectId`
- `surfaceId`
- `elementId`
- `elementType`
- `changes`

Empfohlene technische Identitaet:

- `targetAppId`
- `moduleId`
- `projectId`
- `surfaceId`
- `elementId`

Validierung:

- `projectId` muss vorhanden sein.
- `surfaceId` muss bekannt und explizit freigegeben sein.
- `elementId` muss in der Registry existieren.
- `elementType` muss zum Registry-Eintrag passen.
- `changes` muss ein Objekt sein.
- Erlaubte Change-Keys muessen je Elementtyp begrenzt werden.
- `text`/`label` duerfen nicht leer gespeichert werden, wenn das Element
  fachlich Text verlangt.
- `visible` darf nur Boolean sein.
- `order` darf nur eine endliche Zahl sein.
- Unbekannte Keys werden blockiert.

## Lade-/Speicherlogik fuer Folgepaket

Grobablauf fuer ein spaeteres Implementierungspaket:

1. DB-Schema `ui_editor_element_overrides` ergaenzen.
2. Repository mit Normalisierung, Registry-Abgleich und Allowlist bauen.
3. IPC `uiEditorElementOverrides:getMany` und
   `uiEditorElementOverrides:save` registrieren.
4. Preload-Methoden `uiEditorGetElementOverrides` und
   `uiEditorSaveElementOverride` bereitstellen.
5. HostAdapter erhaelt eine klar getrennte Capability fuer
   UI-Elementaenderungen, getrennt von Visibility-Pilot-Persistenz.
6. Launcher darf den Button erst aktivieren, wenn Vertrag, Host-Kontext,
   Registry-Ziel, Payload und explizite Freigabe vollstaendig sind.
7. Erfolg und Fehler muessen sichtbar zurueckgemeldet werden.

## Nicht zulaessig

- `restarbeitenCreateNote` als UI-Element-Speicherweg.
- `restarbeiten:createNote` als UI-Element-Speicherweg.
- `uiEditorLayoutOverrides` fuer Text-/Label-Aenderungen.
- `tableLayouts` fuer freie UI-Elementtexte.
- Speicherung von Debug-Payloads.
- Speicherung von Diagnosezustand.
- Speicherung von temporaerem Preview-Status.
- localStorage.
- writeFile.
- Wildcard-Freigaben.
- Default-true.
- Speichern beim blossen Oeffnen.

## Aktueller G140-Stand

G140 definiert nur den Vertrag. Es wird kein produktiver Speicherweg
implementiert. Der UI-Editor bleibt editierbar, aber echte
UI-Elementaenderungen bleiben blockiert, bis der Vertrag in einem
Folgemeilenstein umgesetzt und getestet ist.

## Tests

`scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` prueft:

- Dieses Referenzdokument existiert.
- Kernbegriffe wie `UI-Element`, `Speichervertrag`, `projectId`,
  `surfaceId`, `elementId`, `changes`, `uiEditorLayoutOverrides`,
  `tableLayouts`, `restarbeitenCreateNote` und
  `nicht als UI-Element-Speicherweg` sind dokumentiert.
- Der Launcher bleibt auf Elementbearbeitung ausgerichtet.
- Der bestehende Blockiergrund bleibt sichtbar/testbar.
- Die vorgeschlagenen neuen Vertragsnamen sind noch nicht im Preload
  implementiert.
- Der Restarbeiten-Notizweg wird im Launcher-Standardpfad nicht aufgerufen.
