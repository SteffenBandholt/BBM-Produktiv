# UI-Editor SurfaceSwitch Request/Command-Handler read-only

## Kurzfazit

Der SurfaceSwitch-Request/Command-Handler ist nur vorbereitet. Er nimmt
Wechselwuensche defensiv entgegen, prueft sie read-only gegen das
SurfaceSwitch-Modell und gibt ein Ergebnis zurueck. Es gibt keine echte
Umschaltung, keine sichtbare UI-Aenderung und keine Persistenz.

## Aktueller read-only Stand

- Handler:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchCommand.js`
- Read-only Grundlage:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Erlaubt und resolved bleibt nur `restarbeiten.ui.main`.
- Blockiert bleiben `pdf.plan.page.1`, `plan.canvas.default`, unbekannte
  SurfaceIds, `*` und leere IDs.
- `changed` bleibt immer `false`.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Ergebnisformen

```js
{
  handled: true,
  allowed: true,
  readonly: true,
  requestedSurfaceId: "restarbeiten.ui.main",
  resolvedSurfaceId: "restarbeiten.ui.main",
  changed: false,
  reason: "readonly-current-surface"
}
```

```js
{
  handled: true,
  allowed: false,
  readonly: true,
  requestedSurfaceId: "pdf.plan.page.1",
  resolvedSurfaceId: "restarbeiten.ui.main",
  changed: false,
  reason: "surface-not-selectable-readonly"
}
```

## Datenfluss

```text
SurfaceSwitch-Request
-> SurfaceSwitch-Command-Handler
-> SurfaceSwitchModel
-> erlaubt / blockiert
-> read-only Ergebnis
```

## Sicherheitsgrenzen

- read-only.
- keine echte Umschaltung.
- keine sichtbare UI-Aenderung.
- keine PDF-/Plan-Auswahl.
- keine Bearbeitung.
- kein Drag.
- kein Resize.
- keine Persistenz.
- kein `localStorage`.
- kein `writeFile`.
- kein IPC-Schreibweg.
- keine DB-Aenderung.
- keine Registry-Aenderung.
- keine Fachlogik.
- kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik.
- Keine neue UI-Funktion.
- Keine echte Surface-Umschaltung.
- Keine neue sichtbare Surface.
- Kein Dropdown mit weiteren Optionen.
- Keine grosse Surface-Liste.
- Keine Bearbeitungsbuttons.
- Keine Drag-Aktivierung.
- Keine Resize-Aktivierung.
- Keine Persistenzfreigabe.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Freigabepaket.
- Launcher-Anbindung erst nach ausdruecklicher Produktivfreigabe.
- Weitere Request-/Command-Typen nur getrennt und defensiv vorbereiten.

## Testreferenz

- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
