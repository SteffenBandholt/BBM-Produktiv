# UI-Editor SurfaceSelection read-only

## Kurzfazit

Das SurfaceSelection-Modell ist read-only vorbereitet. Es beschreibt, welche
SurfaceIds spaeter in einer kontrollierten Auswahl erscheinen duerften. Es
aktiviert keine sichtbare Auswahl im Editorpanel und aendert keinen
Launcher-Renderpfad.

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

## Datenfluss

```text
BBM-Test / spaeter Editorpanel-Host
-> buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-Modell
```

## Sicherheitsgrenzen

- Keine sichtbare Auswahl.
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

- Keine neue Panel-Sektion.
- Keine Surface-Liste.
- Keine produktive Surface-Auswahl.
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
