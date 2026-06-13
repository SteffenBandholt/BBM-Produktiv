# UI-Editor SurfaceSelection read-only

## Kurzfazit

Das SurfaceSelection-Modell ist read-only vorbereitet und wird seit G56 im
bestehenden Editorpanel kompakt sichtbar genutzt. Die sichtbare read-only
Auswahl zeigt aktuell ausschliesslich den Pilot `restarbeiten.ui.main` als
`Restarbeiten`. Sie aktiviert keine Umschaltung, keine Bearbeitung und keine
neue Launcher-Funktion.

Seit G57 ist dieser sichtbare read-only Stand als Referenz dokumentiert:
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md`.
Seit G58 ist zusaetzlich ein interner read-only SurfaceSelection-State
vorbereitet: `docs/UI_EDITOR_SURFACE_SELECTION_STATE_READONLY.md`.

## Aktueller Modellstand

Die SurfaceSelection wird aus zwei hostseitigen Quellen abgeleitet:

- SurfaceAdapterCatalog: SurfaceId muss bekannt sein.
- SurfacePolicy: `readable === true` und `visibleInEditor === true`.

Aktuell ergibt das nur:

```text
restarbeiten.ui.main
```

Nicht auswaehlbar bleiben:

```text
pdf.plan.page.1
plan.canvas.default
unbekannte SurfaceIds
*
```

## Modell

Beispiel:

```js
{
  surfaces: [
    {
      surfaceId: "restarbeiten.ui.main",
      label: "Restarbeiten",
      surfaceType: "ui-screen",
      selected: true,
      readonly: true,
      capabilities: {
        canDrag: false,
        canResize: false,
        canPersist: false
      }
    }
  ]
}
```

Es gibt kein Default-true. Capabilities werden nur aus der SurfacePolicy
uebernommen.

## Datenfluss Modell

```text
BBM-Test / spaeter Editorpanel-Host
-> buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-Modell
```

## Datenfluss sichtbare Anzeige

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> kompakte read-only Surface-Auswahl im bestehenden Panel
```

## Datenfluss State-Vorbereitung

```text
buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only SurfaceSelection-State
```

## Sicherheitsgrenzen

Guardrail-Begriff: sichtbare read-only Auswahl.
Guardrail-Begriff: keine PDF-/Plan-Surface sichtbar.

- Sichtbare read-only Auswahl nur fuer `restarbeiten.ui.main`.
- Keine Umschaltung.
- SurfaceSelection-State ist nur vorbereitet.
- Keine Dropdown-/Listen-UI.
- Keine PDF-/Plan-Surface sichtbar.
- Keine Bearbeitung.
- Kein Drag.
- Guardrail-Begriff: kein Drag.
- Kein Resize.
- Guardrail-Begriff: kein Resize.
- Keine Persistenz.
- Guardrail-Begriff: keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine Fachlogik.
- Kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue grosse Panel-Sektion.
- Keine Surface-Liste.
- Keine produktive Surface-Umschaltung.
- Keine Erweiterung der sichtbaren SurfaceIds.
- Keine automatische PDF-/Plan-Freigabe.
- Keine Drag-/Resize-/Persistenz-Ausfuehrung.

## Testreferenz

- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
