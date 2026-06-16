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

## Nachtrag G90a

- G90 bleibt gestoppt, weil verpflichtende UI-Editor-Grundlagen fehlen.
- Dokumentiert in:
  `docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md`
- Fehlend sind:
  - `docs/EDITOR_BAUPLAN.md`
  - `docs/UI_ELEMENT_KATALOG.md`
  - `docs/UI_BAU_UND_PRUEFREGELN.md`
  - `docs/ZIEL_APP_ANBINDUNG.md`
  - `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`
- Der geplante sichtbare UI-Hinweis zur Surface-Auswahl wurde nicht gebaut.
- Keine Produktivlogik, keine sichtbare UI-Aenderung, keine echte
  Surface-Umschaltung, kein Drag, kein Resize und keine Persistenz wurden
  aktiviert.

## Nachtrag G91

- G91 dokumentiert die Optionen A bis D fuer eine Nutzerentscheidung in
  `docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md`.
- Es gibt weiterhin keine allgemeine UI-/PDF-Freigabe.
- Der Hinweis zur Surface-Auswahl bleibt bis zur Nutzerentscheidung blockiert.
- Drag, Resize, Persistenz, SurfaceInfo-Umbau und aktive Surface-Umschaltung
  bleiben gesperrt.
