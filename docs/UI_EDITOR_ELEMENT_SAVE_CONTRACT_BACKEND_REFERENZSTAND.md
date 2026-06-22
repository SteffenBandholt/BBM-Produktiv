# G142 - UI-Editor Element-Speichervertrag als Backend-/IPC-/Preload-Geruest

## Was ist umgesetzt?

- Ein eigener Backend-Vertrag fuer UI-Element-Overrides ist angelegt.
- Der Speicherweg geht nicht ueber Restarbeiten-Notizen.
- Der Produktivpfad bleibt im UI weiter gesperrt.
- Die Renderer-Seite kann den Vertrag pruefen, aber nicht automatisch ausfuehren.

## Technische Bestandteile

- DB-Tabelle: `ui_editor_element_overrides`
- Repository: `src/main/db/uiEditorElementOverridesRepo.js`
- IPC: `uiEditorElementOverrides:list`
- IPC: `uiEditorElementOverrides:save`
- Preload: `window.bbmDb.uiEditorGetElementOverrides`
- Preload: `window.bbmDb.uiEditorSaveElementOverride`

## Verwendete Struktur

- `id`
- `project_id`
- `surface_id`
- `element_id`
- `element_type`
- `changes_json`
- `created_at`
- `updated_at`

Die Identitaet ist eindeutig ueber:

- `project_id`
- `surface_id`
- `element_id`

Ein erneutes Speichern derselben Kombination fuehrt zu einem Upsert und aktualisiert denselben Datensatz.

## Gueltige Payload

- `projectId`
- `surfaceId`
- `elementId`
- `elementType`
- `changes`

## Gueltige Allowlist

- Surface: `restarbeiten.ui.main`
- Elementtypen: `Hinweis / Infotext`, `label`
- Change-Keys: `text`, `label`, `visible`, `order`

## Serverseitige Validierung

- `projectId` darf nicht leer sein.
- `surfaceId` darf nicht leer sein.
- `elementId` darf nicht leer sein.
- `elementType` darf nicht leer sein.
- `changes` muss ein Objekt sein.
- `changes` muss mindestens einen erlaubten Key enthalten.
- Unbekannte Change-Keys werden abgelehnt.
- `noteText` wird abgelehnt.
- `restarbeitId` wird abgelehnt.
- Diagnosefelder werden abgelehnt.
- Nur die allowlistbare Surface und die allowlistbaren Elementtypen sind zulaessig.

## Ergebnisformat

Erfolgsfall:

```js
{
  ok: true,
  persisted: true,
  projectId,
  surfaceId,
  elementId,
  elementType,
  changes,
  resultReference,
  updatedAt
}
```

Fehlerfall:

```js
{
  ok: false,
  persisted: false,
  error: "...",
  reason: "..."
}
```

## Warum nicht `restarbeitenCreateNote`?

- Der UI-Editor fuer UI-Elemente ist fachlich nicht der Restarbeiten-Notizspeicher.
- Der Vertrag speichert Elementaenderungen in einer eigenen Struktur.
- So bleiben `restarbeitenCreateNote` und `restarbeiten:createNote` sauber von UI-Elementaenderungen getrennt.

## Warum bleibt der normale UI-Pfad gesperrt?

- G142 legt nur die technische Kette an.
- Der UI-Button ist weiterhin nicht zur Produktivfreigabe aktiviert.
- Die Freigabe bleibt explizit getrennt von der technischen Verfuegbarkeit.
- Kein automatisches Speichern beim Oeffnen.

## Tests

- `scripts/tests/uiEditorElementOverridesRepo.test.cjs`
- `scripts/tests/uiEditorElementOverridesIpc.test.cjs`
- `scripts/tests/uiEditorElementOverridesPreload.test.cjs`
- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`

## Offene Schritte fuer G143

- Die Freigabeentscheidung fuer den echten UI-Produktivpfad explizit trennen.
- Ggf. weiteren Renderer-Guard auf den echten Save-Pfad legen.
- Sichtbares Produktivspeichern erst nach bewusster Freigabe aktivieren.
