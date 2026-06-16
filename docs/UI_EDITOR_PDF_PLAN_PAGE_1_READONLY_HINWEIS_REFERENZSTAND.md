# UI-Editor PDF Plan Seite 1 read-only Hinweis Referenzstand

## Kurzfazit

Im bestehenden UI-Editor-Panel ist zusaetzlich ein kleiner read-only Hinweis
sichtbar. Er erklaert die bereits freigegebene Sichtbarkeit von
`pdf.plan.page.1`, ohne die bestehende SurfaceInfo umzubauen.

## Sichtbarer Hinweis

```text
PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

## Warum der Hinweis noetig ist

- `pdf.plan.page.1` ist sichtbar, aber weiterhin nur read-only
- die Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1` und zusaetzlich
  die read-only Plan-Canvas-Surface
- die SurfaceInfo bleibt bewusst auf `restarbeiten.ui.main`
- der Hinweis trennt deshalb sichtbare PDF-Surface und Hoststand klarer

## SurfaceInfo bleibt Hoststand

- SurfaceInfo zeigt weiterhin `restarbeiten.ui.main`
- keine Umstellung auf `pdf.plan.page.1`
- keine zweigeteilte SurfaceInfo
- keine echte Surface-Umschaltung

## Weiterhin blockierte Funktionen

- `plan.canvas.default` ist read-only sichtbar
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

- Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1` und `Plan Canvas`
- SurfaceInfo zeigt weiterhin `restarbeiten.ui.main`
- der neue Hinweis ist sichtbar
- `plan.canvas.default` erscheint als weitere read-only Surface
- keine Bearbeitung moeglich
- kein Drag
- kein Resize
- keine Persistenzfunktion sichtbar
- keine UI-Fehlermeldung sichtbar

## Nachtrag G79

- Die getrennte manuelle Zielrouten-Abnahme liegt jetzt in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md`.
- Ergebnis des Nachtrags:
  `Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar`.
- Dieser Hinweis-Referenzstand bleibt damit als technischer Sicht- und
  Guardrail-Stand bestehen; die direkte Restarbeiten-Zielroute ist separat
  dokumentiert.

## Nachtrag G80

- Die direkte Restarbeiten-Zielroute ist inzwischen in
  `docs/UI_EDITOR_RESTARBEITEN_ZIELROUTE_SICHTPRUEFUNG.md` reproduzierbar
  dokumentiert.
- Bestaetigter Klickpfad:
  `Start` -> `Projekte` -> Projektkachel `Nr.: 04-2026 / UI-Polish fuer BBM`
  -> `Restarbeiten` -> `UI-Editor`
- Der sichtbare Hinweis-Referenzstand bleibt dabei unveraendert:
  `PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.`

## Nachtrag G81

- Der Hinweisstand wird jetzt in der gebuendelten Abschlussreferenz
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
  mitgefuehrt.
- Der Hinweistext selbst, der sichtbare Zustand und die Blockaden bleiben
  unveraendert.

## Nachtrag G82

- `plan.canvas.default` wird jetzt nur als Kandidat bewertet, ohne den
  sichtbaren Hinweisstand oder die bestehende Blockade zu aendern.
- Der Hinweistext bleibt unveraendert.

## Nachtrag G83

- `plan.canvas.default` ist jetzt zusaetzlich read-only sichtbar.
- Der Hinweistext benennt deshalb auch `Plan Canvas`.
- SurfaceInfo bleibt bewusst auf `restarbeiten.ui.main`.

## Nachtrag G84

- Die Hinweisreferenz bleibt unveraendert.
- Die Plan-Canvas-Sichtpruefung ist jetzt in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
  ergaenzt.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.

## Nachtrag G85

- Der Hinweis bleibt Teil der abgeschlossenen read-only Surface-Phase.
- Der Gesamtabschluss ist in
  `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md`
  gebuendelt.
