# UI-Editor PDF Plan Seite 1 read-only Hinweis Referenzstand

## Kurzfazit

Im bestehenden UI-Editor-Panel ist zusaetzlich ein kleiner read-only Hinweis
sichtbar. Er erklaert die bereits freigegebene Sichtbarkeit von
`pdf.plan.page.1`, ohne die bestehende SurfaceInfo umzubauen.

## Sichtbarer Hinweis

```text
PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

## Warum der Hinweis noetig ist

- `pdf.plan.page.1` ist sichtbar, aber weiterhin nur read-only
- die Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`
- die SurfaceInfo bleibt bewusst auf `restarbeiten.ui.main`
- der Hinweis trennt deshalb sichtbare PDF-Surface und Hoststand klarer

## SurfaceInfo bleibt Hoststand

- SurfaceInfo zeigt weiterhin `restarbeiten.ui.main`
- keine Umstellung auf `pdf.plan.page.1`
- keine zweigeteilte SurfaceInfo
- keine echte Surface-Umschaltung

## Weiterhin blockierte Funktionen

- `plan.canvas.default` bleibt blockiert
- unbekannte SurfaceIds bleiben blockiert
- `*` bleibt blockiert
- leere IDs bleiben blockiert
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
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

Die sichtbare UI-Aenderung wurde am `2026-06-15` im lokalen Electron-DEV-Lauf
ueber `npm start` geprueft.

Geprueft wurde:

- Surface-Auswahl zeigt weiterhin `Restarbeiten - PDF Plan Seite 1`
- SurfaceInfo zeigt weiterhin `restarbeiten.ui.main`
- der neue Hinweis ist sichtbar
- `plan.canvas.default` erscheint nicht
- keine Bearbeitung moeglich
- kein Drag
- kein Resize
- keine Persistenzfunktion sichtbar
- keine UI-Fehlermeldung sichtbar
