# UI-Editor Plan Canvas read-only Policy Referenzstand

## Kurzfazit

`plan.canvas.default` ist jetzt explizit per SurfacePolicy read-only sichtbar
freigegeben. Die Surface bleibt ohne Drag, Resize, Persistenz und ohne
echte Umschaltung.

## Freigegebene SurfaceId

```text
plan.canvas.default
```

## Bestehender PDF-read-only-Stand

- `pdf.plan.page.1` bleibt read-only sichtbar
- der PDF-Hinweis bleibt rein informativ
- keine Bearbeitung, kein Drag und keine Persistenz

## Host-/Bestandssurface

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- SurfaceInfo bleibt bewusst darauf stehen
- keine zweigeteilte SurfaceInfo

## Policy-Werte

```text
plan.canvas.default
readable: true
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false
```

## Sichtbare UI-Grenze

- Surface-Auswahl kann `Plan Canvas` zeigen
- Surface-Auswahl bleibt read-only
- keine Bearbeitungsbuttons
- keine Drag-/Resize-Schaltflaechen
- keine Persistenz-Schaltflaechen

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine Umschaltung auf `plan.canvas.default`
- keine zweite SurfaceInfo

## Nicht aktivierte Funktionen

- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine Plan-/Canvas-Bearbeitung
- keine PDF-Bearbeitung
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- UI-Editor-kit speichert nicht

## Testabdeckung

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Die sichtbare UI bleibt read-only und ohne Interaktion. Die abnehmende
Electron-Sichtpruefung muss nur bestaetigen, dass `Plan Canvas` sichtbar sein
kann, waehrend `restarbeiten.ui.main` als SurfaceInfo stehen bleibt.

## Nachtrag G84

- Die neue Sichtpruefungsreferenz liegt jetzt in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
