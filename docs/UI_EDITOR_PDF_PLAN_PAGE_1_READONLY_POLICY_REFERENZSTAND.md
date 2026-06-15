# UI-Editor PDF Plan Page 1 read-only Policy Referenzstand

## Kurzfazit

`pdf.plan.page.1` ist per Policy explizit read-only freigegeben und im
Launcher sichtbar. Die Surface bleibt rein lesend: keine echte Umschaltung,
kein Drag, kein Resize und keine Persistenz. `plan.canvas.default` bleibt
blockiert.

## Aktueller read-only Stand

- freigegeben / sichtbar: `pdf.plan.page.1`
- weiterhin erlaubt / default-resolved: `restarbeiten.ui.main`
- blockiert: `plan.canvas.default`
- blockiert: unbekannte SurfaceIds
- blockiert: `*`
- blockiert: leere IDs

## Policy

```text
restarbeiten.ui.main
readable: true
visibleInEditor: true
canHide: true
canDrag: false
canResize: false
canPersist: false

pdf.plan.page.1
readable: true
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false

plan.canvas.default
readable: true
visibleInEditor: false
canHide: false
canDrag: false
canResize: false
canPersist: false
```

## Sichtbare UI-Grenze

```text
sichtbar:
- Surface-Auswahl: Restarbeiten
- Surface-Auswahl: PDF Plan Seite 1
- SurfaceInfo: restarbeiten.ui.main / ui-screen / Elementanzahl

nicht sichtbar:
- plan.canvas.default
- unbekannte SurfaceIds
- *
```

Die Sichtbarkeit ist read-only. Sie benoetigt keine Bearbeitungsbuttons, keine
Drag-Aktivierung, keine Resize-Aktivierung und keine Persistenz.

## Nicht aktivierte Funktionen

- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-/Plan-Bearbeitung
- keine DB-/IPC-Schreibwege
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Testabdeckung

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil die sichtbare Surface-Auswahl jetzt um `pdf.plan.page.1`
erweitert ist. Geprueft werden muss, dass nur die read-only Auswahl sichtbar
ist und keine echten Bedienelemente entstanden sind.
