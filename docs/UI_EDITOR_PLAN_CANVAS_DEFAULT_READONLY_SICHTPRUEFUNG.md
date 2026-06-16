# UI-Editor Plan Canvas read-only Sichtpruefung

## Kurzfazit

Der Zwei-Surface-read-only-Stand aus G83 ist als Referenz abgesichert. Sichtbar
bleiben `pdf.plan.page.1` und `plan.canvas.default`; die SurfaceInfo bleibt
bewusst auf `restarbeiten.ui.main`. Es gibt keine echte Umschaltung, keine
Bearbeitung, kein Drag, kein Resize und keine Persistenz.

## Ausgangsstand nach G83

- `pdf.plan.page.1` ist explizit read-only sichtbar
- `plan.canvas.default` ist explizit read-only sichtbar
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- UI-Editor-kit speichert nicht

## Reproduzierbarer Klickpfad

```text
Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor
```

## Sichtbarer Zielzustand

```text
Surface-Auswahl:
- Restarbeiten
- PDF Plan Seite 1
- Plan Canvas

SurfaceInfo:
- restarbeiten.ui.main
```

Falls die Surface-Auswahl im laufenden UI als kombinierte Bezeichnung
erscheint, gilt der exakt sichtbare Text aus dem Launcher. Der aktuelle
Referenzstand zeigt die drei Eintraege `Restarbeiten`, `PDF Plan Seite 1` und
`Plan Canvas`.

## Surface-Auswahl

- `Restarbeiten` bleibt als Host-/Bestandsoberflaeche sichtbar
- `PDF Plan Seite 1` bleibt read-only sichtbar
- `Plan Canvas` bleibt read-only sichtbar
- unbekannte SurfaceIds, `*` und leere IDs erscheinen nicht

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine zweite SurfaceInfo wird eingefuehrt
- keine Umschaltung auf `pdf.plan.page.1`
- keine Umschaltung auf `plan.canvas.default`

## Read-only Hinweise

```text
PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

- rein informativ
- keine Bedienlogik
- keine Umschaltung
- keine Persistenz

## Freigegebene SurfaceIds

```text
read-only sichtbar:
- pdf.plan.page.1
- plan.canvas.default

Host-/Bestandssurface:
- restarbeiten.ui.main
```

## Weiterhin blockierte SurfaceIds

```text
weiterhin blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

## Nicht aktivierte Funktionen

- keine echte Surface-Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- keine Wildcard
- kein Default-true
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

G83 hat den sichtbaren Zustand bereits bestaetigt. G84 referenziert diesen
bestaetigten Stand nur noch und sichert ihn dokumentarisch ab; eine erneute
Sichtpruefung ist fuer diese reine Referenz-/Guardrail-Aktualisierung nicht
zwingend noetig.

## Offene Grenzen

- keine weitere Surface ueber `plan.canvas.default` und `pdf.plan.page.1` hinaus
- keine sichtbare UI-Aenderung
- keine Produktivlogik
- keine echte Surface-Umschaltung

## Nachtrag G84

- Die Sichtpruefungsreferenz ist jetzt in diesem Dokument gebuendelt.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
