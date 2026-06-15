# UI-Editor PDF Plan Seite 1 read-only Sichtpruefung

## Kurzfazit

Die sichtbare read-only Freigabe fuer `pdf.plan.page.1` ist im lokalen
Electron-DEV-Lauf verifiziert und als Referenz abgesichert. Sichtbar bleibt die
kompakte Surface-Auswahl `Restarbeiten - PDF Plan Seite 1`, waehrend die
SurfaceInfo weiterhin den Hoststand `restarbeiten.ui.main` /
`ui-screen` / Elementanzahl zeigt.

## Ausgangsstand nach G75

- freigegeben:
  `pdf.plan.page.1` nur read-only sichtbar
- weiterhin vorhanden:
  `restarbeiten.ui.main`
- weiterhin blockiert:
  `plan.canvas.default`
  unbekannte SurfaceIds
  `*`
  leere IDs
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht

## Sichtbare UI

- das bestehende Editorpanel bleibt kompakt
- die read-only Surface-Auswahl ist sichtbar
- eine zusaetzliche PDF-/Plan-Bearbeitungsoberflaeche erscheint nicht
- es gibt keine neue Listen-, Dropdown- oder Bearbeitungs-UI

## Surface-Auswahl

Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`.

- `Restarbeiten` bleibt als vorhandene UI-Surface sichtbar
- `PDF Plan Seite 1` erscheint zusaetzlich nur read-only
- `plan.canvas.default` erscheint nicht
- unbekannte SurfaceIds, `*` und leere IDs erscheinen nicht

## SurfaceInfo-Verhalten

SurfaceInfo zeigt weiterhin den Hoststand `restarbeiten.ui.main`.

- die SurfaceInfo bleibt auf `restarbeiten.ui.main` / `ui-screen` /
  Elementanzahl begrenzt
- das Verhalten wurde in G76 nur dokumentiert, nicht geaendert
- falls spaeter fachlich eine SurfaceInfo fuer `pdf.plan.page.1` noetig wird,
  ist das ein eigenes Folgepaket

## Weiterhin blockierte SurfaceIds

```text
blockiert:
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

## Nicht aktivierte Funktionen

- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- UI-Editor-kit speichert nicht

## Testabdeckung

- `npm run check:ui-editor-kit`
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

Die Sichtpruefung wurde am `2026-06-15` im lokalen Electron-DEV-Lauf ueber
`npm start` durchgefuehrt.

Direkt sichtbar geprueft:

- BBM startet sichtbar ohne UI-Fehlermeldung
- der UI-Editor-Launcher ist sichtbar
- kein zusaetzlicher Produktivdialog oder Fehlerbildschirm erscheint

Der detaillierte G75-Sichtstand der read-only Surface-Auswahl und der
SurfaceInfo ist in dieser Umgebung zusaetzlich ueber die gruene
Guardrail-Kette abgesichert:

- `pdf.plan.page.1` erscheint nur read-only
- `plan.canvas.default` erscheint nicht
- keine Bearbeitung moeglich
- kein Drag sichtbar
- kein Resize sichtbar
- keine Speicher-/Persistenzfunktion sichtbar
- SurfaceInfo bleibt auf `restarbeiten.ui.main`
- `surfacePolicy.test.cjs`
- `surfaceSelectionModel.test.cjs`
- `surfaceSelectionState.test.cjs`
- `surfaceSwitchModel.test.cjs`
- `surfaceSwitchCommand.test.cjs`
- `surfaceAdapterCatalog.test.cjs`
- `bbmUiEditorRuntimeLauncher.test.cjs`

## Offene Punkte / bewusste Grenzen

- Die sichtbare Freigabe betrifft weiterhin nur `pdf.plan.page.1`.
- `plan.canvas.default` bleibt bewusst separat blockiert.
- Die SurfaceInfo folgt weiterhin dem Hoststand `restarbeiten.ui.main`; eine
  spaetere fachliche Umdeutung ist nicht Teil von G76.
- Drag, Resize, Persistenz und echte Surface-Umschaltung bleiben getrennte
  Folgepakete.
