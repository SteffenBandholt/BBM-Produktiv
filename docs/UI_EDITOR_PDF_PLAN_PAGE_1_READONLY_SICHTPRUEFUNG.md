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
- ein kleiner read-only Hinweis fuer `pdf.plan.page.1` ist sichtbar
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

## Read-only Hinweis

Direkt sichtbar ist zusaetzlich:

```text
PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

- der Hinweis bleibt klein und rein informativ
- er enthaelt keine Buttons
- er loest keine Umschaltung aus
- er loest keine Speicherung aus

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
- der neue read-only Hinweis fuer `pdf.plan.page.1` ist sichtbar
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

Der zusaetzliche sichtbare Hinweisstand ist in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_HINWEIS_REFERENZSTAND.md`
als Referenz dokumentiert.

## Offene Punkte / bewusste Grenzen

- Die gesonderte manuelle Zielrouten-Abnahme ist in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md` nachgezogen.
- Ergebnis dieses G79-Nachtrags:
  `Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar`.
- Damit bleibt dieses Dokument der technische Referenz- und Guardrail-Stand;
  die direkte Restarbeiten-Zielrouten-Bestaetigung ist separat und ehrlich
  dokumentiert.
- Die sichtbare Freigabe betrifft weiterhin nur `pdf.plan.page.1`.
- `plan.canvas.default` bleibt bewusst separat blockiert.
- Die SurfaceInfo folgt weiterhin dem Hoststand `restarbeiten.ui.main`; eine
  spaetere fachliche Umdeutung ist nicht Teil von G76.
- Die formale Entscheidungsgrundlage dazu liegt jetzt in
  `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`.
- Der sichtbare Hinweis ist zusaetzlich in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_HINWEIS_REFERENZSTAND.md`
  referenziert.
- Drag, Resize, Persistenz und echte Surface-Umschaltung bleiben getrennte
  Folgepakete.

## Nachtrag G81

- Die Abschlussreferenz ist jetzt in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
  zusammengefasst.
- Der hier dokumentierte Sichtstand bleibt die technische Grundlage der
  Abschlussreferenz.

## Nachtrag G82

- `plan.canvas.default` wird nur als nachgelagerter Kandidat bewertet; der
  dokumentierte Sichtstand bleibt unveraendert.
- Die Sichtpruefung selbst bleibt die Grundlage fuer die read-only
  Abnahmekette.
