# UI-Editor Surface-Umschaltungsmodell read-only

## Kurzfazit

Das Surface-Umschaltungsmodell ist read-only vorbereitet. Es beschreibt nur,
ob ein angefragter Surface-Wechsel im aktuellen Referenzstand erlaubt waere.
Aktuell ist ausschliesslich der bestehende Pilot `restarbeiten.ui.main`
erlaubt. Es gibt keine echte Umschaltung, keine sichtbare UI-Aenderung und
keine Persistenz.

## Aktueller read-only Stand

- Modell: `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Erlaubtes Ziel: `restarbeiten.ui.main`
- Blockierte Ziele: `pdf.plan.page.1`, `plan.canvas.default`, unbekannte
  SurfaceIds, `*` und leere IDs
- Grundlage: `SurfaceSelection-State`, `SurfaceSelectionModel`,
  `SurfacePolicy` und `SurfaceAdapterCatalog`

## Ergebnis erlaubter Wechselwunsch

```js
{
  allowed: true,
  readonly: true,
  fromSurfaceId: "restarbeiten.ui.main",
  targetSurfaceId: "restarbeiten.ui.main",
  resolvedSurfaceId: "restarbeiten.ui.main",
  reason: "readonly-current-surface"
}
```

## Ergebnis blockierter Wechselwunsch

Beispiel fuer `pdf.plan.page.1`:

```js
{
  allowed: false,
  readonly: true,
  fromSurfaceId: "restarbeiten.ui.main",
  targetSurfaceId: "pdf.plan.page.1",
  resolvedSurfaceId: "restarbeiten.ui.main",
  reason: "surface-not-selectable-readonly"
}
```

## Datenfluss

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only Ergebnis
```

Das Modell loest kein Rendering, keinen Panel-Umbau und keine Host-Aktion aus.

## Sicherheitsgrenzen

- Read-only.
- Keine echte Umschaltung.
- Keine sichtbare Surface-Liste.
- Keine PDF-/Plan-Surface-Freigabe.
- kein Drag.
- kein Resize.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine Fachlogik.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik im Launcher.
- Keine sichtbare UI-Aenderung.
- Keine weitere Surface sichtbar oder auswaehlbar.
- Keine PDF-/Canvas-/Plan-Bearbeitung.
- Keine Bearbeitungsbuttons.
- Keine Drag-/Resize-Aktivierung.
- Keine Persistenzfreigabe.

## Testreferenz

- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
