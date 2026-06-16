# UI-Editor PDF Plan Seite 1 read-only Abnahmereferenzstand

## Kurzfazit

G81 schliesst den read-only Stand fuer `pdf.plan.page.1` als Abnahme- und
Referenzstand ab. Die Sichtbarkeit ist bestaetigt, die Grenzen bleiben klar und
es gibt keine weitere Produktivfreigabe.

Ergebnis:

```text
Abnahmereferenz abgeschlossen
```

## Gesicherter Stand

```text
freigegeben:
- pdf.plan.page.1 nur read-only sichtbar

Host-/Bestandssurface:
- restarbeiten.ui.main

weiterhin blockiert:
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

## Reproduzierbarer Klickpfad

```text
Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor
```

## Sichtbarer Zielzustand

```text
Surface-Auswahl:
- Restarbeiten - PDF Plan Seite 1

SurfaceInfo:
- restarbeiten.ui.main

Hinweis:
- PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

## Surface-Auswahl

- `Restarbeiten - PDF Plan Seite 1` bleibt sichtbar.
- `plan.canvas.default` erscheint nicht.
- unbekannte SurfaceIds, `*` und leere IDs erscheinen nicht.

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt `restarbeiten.ui.main`.
- keine zweite SurfaceInfo wird eingefuehrt.
- keine Umschaltung auf `pdf.plan.page.1`.
- die Einordnung bleibt bewusst als Host-/Bestandssurface erhalten.

## Hinweistext

```text
PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

- rein informativ
- keine Bedienlogik
- keine Umschaltung
- keine Persistenz

## Weiterhin blockierte SurfaceIds

```text
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

## Weiterhin nicht aktivierte Funktionen

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

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Manuelle Sichtpruefung

- G80 hat die manuelle Sichtpruefung bestaetigt.
- G81 referenziert diesen bestaetigten Stand und schliesst ihn als
  Abnahmereferenz ab.
- eine weitere Electron-Sichtpruefung ist fuer dieses Abschluss-/Doku-Paket
  nicht erforderlich.

## Offene Grenzen

- keine fuer diesen Abnahmestand
- neue Freigaben, neue Surfaces oder echte Interaktionsfaehigkeiten bleiben
  spaeteren Folgepaketen vorbehalten

## Empfohlener naechster Schritt

- keine weitere Aenderung am abgenommenen read-only Stand
- nur bei neuer fachlicher Freigabe ein eigenes Folgepaket fuer weitere
  SurfaceIds oder Interaktionen starten
