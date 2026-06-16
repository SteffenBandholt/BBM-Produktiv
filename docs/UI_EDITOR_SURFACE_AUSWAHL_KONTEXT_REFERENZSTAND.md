# UI-Editor Surface-Auswahl-Kontext Referenzstand

## Kurzfazit

Der Surface-Auswahl-Kontext ist als stabiler Referenzstand abgesichert. Die
Surface-Auswahl bleibt eine read-only Sichtbarkeits-/Kontextanzeige und keine
aktive Surface-Umschaltung. `SurfaceInfo` bleibt bewusst `restarbeiten.ui.main`.

## Ausgangsstand nach G87

```text
Host-/Bestandssurface:
- restarbeiten.ui.main

read-only sichtbar:
- pdf.plan.page.1
- plan.canvas.default

SurfaceInfo:
- restarbeiten.ui.main

weiterhin blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

## Fachlicher Entscheid

- Surface-Auswahl bedeutet aktuell eine read-only Sichtbarkeits-/Kontextanzeige
- keine aktive Surface-Umschaltung
- kein Bearbeitungskontext
- keine Persistenzentscheidung

Surface-Auswahl bedeutet aktuell:
- read-only Sichtbarkeits-/Kontextanzeige
- keine aktive Surface-Umschaltung
- kein Bearbeitungskontext
- keine Persistenzentscheidung

## Aktueller read-only Surface-Stand

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- `pdf.plan.page.1` ist read-only sichtbar
- `plan.canvas.default` ist read-only sichtbar
- unbekannte SurfaceIds bleiben blockiert
- `*` bleibt blockiert
- leere IDs bleiben blockiert

## Bedeutung der Surface-Auswahl

Die Surface-Auswahl beschreibt in diesem Stand die fachlich sichtbare und
freigegebene Kontextanzeige. Sie ist keine aktive Surface, sondern ein
konsequenter Read-only-Hinweis auf die bereits freigegebenen Flächen.

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine zweite SurfaceInfo
- keine Umschaltung auf `pdf.plan.page.1`
- keine Umschaltung auf `plan.canvas.default`

## Harte Grenzen

- keine echte Surface-Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Weiterhin blockierte Funktionen

- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine aktive Surface-Auswahl
- kein Bearbeitungskontext
- keine Speicherwege

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

## Empfohlener naechster Schritt

Die Surface-Auswahl bleibt vorerst als read-only Kontextanzeige bestehen.
Eine aktive Surface darf erst in einem eigenen spaeteren Paket vorbereitet
werden, getrennt von Drag, Resize und Persistenz.

## Nachtrag G89

- Die technische Guardrail-Absicherung ist jetzt zusaetzlich in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`
  dokumentiert.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar,
  aber keine aktive Bearbeitungs-Surface.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`; keine aktive
  Umschaltung, keine Persistenz und keine Schreibwege.
