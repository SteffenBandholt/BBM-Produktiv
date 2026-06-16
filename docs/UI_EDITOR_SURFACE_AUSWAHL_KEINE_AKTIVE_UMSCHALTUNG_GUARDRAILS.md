# UI-Editor Surface-Auswahl keine aktive Umschaltung Guardrails

## Kurzfazit

Die Surface-Auswahl bleibt eine read-only Sichtbarkeits-/Kontextanzeige.
Sie ist aktuell keine aktive Surface-Umschaltung, loest keine Persistenz aus
und faehrt keinen Drag-/Resize- oder Schreibpfad an.

## Abgesicherte Entscheidung

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- `pdf.plan.page.1` bleibt read-only sichtbar
- `plan.canvas.default` bleibt read-only sichtbar
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`
- unbekannte SurfaceIds bleiben blockiert
- `*` bleibt blockiert
- leere IDs bleiben blockiert

## Gepruefte Guardrails

- keine aktive Surface-Umschaltung
- kein Bearbeitungskontext
- kein Drag
- kein Resize
- keine Persistenz
- keine Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Weiterhin blockiert

- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- keine aktive Surface-Logik fuer die Auswahl

## Testabdeckung

- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
