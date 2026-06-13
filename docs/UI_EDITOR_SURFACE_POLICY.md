# UI-Editor SurfacePolicy

## Kurzfazit

Die SurfacePolicy ist als read-only Rechte-/Freigabeschicht vorbereitet. Sie
entscheidet aktuell nur, welche bekannten SurfaceIds ueber den
SurfaceAdapterCatalog lesbar sind und welche Editor-Faehigkeiten weiterhin
gesperrt bleiben. Es gibt keine produktive UI-Nutzung.

## Aktuelle Policy

```text
restarbeiten.ui.main
readable: true
visibleInEditor: false
canHide: true
canDrag: false
canResize: false
canPersist: false

pdf.plan.page.1
readable: true
visibleInEditor: false
canHide: false
canDrag: false
canResize: false
canPersist: false

plan.canvas.default
readable: true
visibleInEditor: false
canHide: false
canDrag: false
canResize: false
canPersist: false
```

Unbekannte SurfaceIds, Wildcards und leere IDs bekommen immer die blockierte
Default-Policy:

```text
readable: false
visibleInEditor: false
canHide: false
canDrag: false
canResize: false
canPersist: false
```

## Datenfluss

```text
BBM-Test / spaeter Host-Aufruf
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> konkreter read-only SurfaceAdapter
-> neutrales SurfaceModel
-> uiEditorKitSurfaceRuntimeBridge
-> SurfaceRuntime im UI-Editor-kit
-> Validierung/Normalisierung
```

Der Katalog bleibt dadurch an eine explizite Allowlist gebunden. Eine bekannte
SurfaceId ist nur lesbar, wenn die Policy `readable: true` meldet.

## Sicherheitsgrenzen

- Keine globale Freigabe.
- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds bleiben blockiert.
- `visibleInEditor: false` fuer alle bekannten SurfaceIds.
- `canDrag: false` fuer alle bekannten SurfaceIds.
- `canResize: false` fuer alle bekannten SurfaceIds.
- `canPersist: false` fuer alle bekannten SurfaceIds.
- Keine sichtbare Surface-Auswahl.
- Keine produktive Launcher-Nutzung.
- Keine PDF-/Plan-Bearbeitung.
- Keine Canvas-Bearbeitung.
- Kein Drag auf PDF, Plan oder UI-Surfaces.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine Fachlogik.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Bewusst nicht aktiviert

- Keine Anzeige von Surfaces im Editorpanel.
- Keine neue Panel-Sektion.
- Keine automatische Surface-Liste.
- Keine produktive Surface-Auswahl.
- Keine Freigabe weiterer SurfaceIds.
- Keine Aktivierung von PDF-/Plan-/Canvas-Bearbeitung.
- Keine Drag-/Resize-/Persistenz-Ausfuehrung.

## Testreferenz

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
