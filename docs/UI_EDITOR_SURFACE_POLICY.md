# UI-Editor SurfacePolicy

## Kurzfazit

Die SurfacePolicy ist als read-only Rechte-/Freigabeschicht vorbereitet. Sie
entscheidet aktuell nur, welche bekannten SurfaceIds ueber den
SurfaceAdapterCatalog lesbar sind und welche Editor-Faehigkeiten weiterhin
gesperrt bleiben. Seit G53 ist `restarbeiten.ui.main` als erste kompakte
read-only SurfaceInfo im Editorpanel sichtbar. Seit G54 ist dieser Stand in
`docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md` als Referenz
abgeschlossen.
Seit G56 nutzt das Editorpanel das daraus abgeleitete SurfaceSelection-Modell
sichtbar, aber nur read-only fuer `restarbeiten.ui.main`.
Seit G57 ist diese sichtbare read-only Surface-Auswahl als Referenzstand in
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` dokumentiert.
Seit G58 ist ein interner read-only SurfaceSelection-State vorbereitet. Er
nutzt dieselbe `visibleInEditor`-Grenze und macht keine weitere Surface
sichtbar.
Seit G59 nutzt der BBM-Launcher diesen State read-only als interne Quelle fuer
die bestehende kompakte Surface-Auswahl und SurfaceInfo.

## Aktuelle Policy

```text
restarbeiten.ui.main
readable: true
visibleInEditor: true
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

Sichtbare Editorpanel-Info ist zusaetzlich an `visibleInEditor: true`
gebunden. Aktuell gilt das nur fuer `restarbeiten.ui.main`.

Referenzierter Editorpanel-Datenfluss seit G54:

```text
Editorpanel im BBM-Launcher
-> SurfacePolicy
-> visibleInEditor-Pruefung
-> buildReadonlySurfaceModelForLauncher(...)
-> SurfaceAdapterCatalog
-> restarbeitenMainSurfaceAdapter
-> SurfaceRuntime-Validierung ueber Bridge
-> kompakte SurfaceInfo im Panel
```

Read-only SurfaceSelection seit G55:

```text
buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> SurfaceSelection-Modell
```

Auch dieses Modell ist an `readable === true` und `visibleInEditor === true`
gebunden. Aktuell ist dadurch nur `restarbeiten.ui.main` enthalten; PDF/Plan
und unbekannte SurfaceIds bleiben ausgeschlossen.

Sichtbare Surface-Auswahl seit G56:

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfacePolicy
-> kompakte read-only Anzeige fuer restarbeiten.ui.main
```

Read-only SurfaceSelection-State im Launcher seit G59:

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> blockierte Auswahlwuensche
-> read-only State
```

## Sicherheitsgrenzen

- Keine globale Freigabe.
- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds bleiben blockiert.
- `visibleInEditor: true` nur fuer `restarbeiten.ui.main`.
- `visibleInEditor: false` fuer `pdf.plan.page.1` und `plan.canvas.default`.
- `canDrag: false` fuer alle bekannten SurfaceIds.
- `canResize: false` fuer alle bekannten SurfaceIds.
- `canPersist: false` fuer alle bekannten SurfaceIds.
- Sichtbare Surface-Auswahl nur read-only fuer `restarbeiten.ui.main`.
- Keine Surface-Umschaltung.
- SurfaceSelection-State nur intern read-only angebunden.
- Keine automatische Surface-Liste.
- SurfaceSelection ist nur als read-only Anzeige angebunden.
- Nur kompakte read-only SurfaceInfo fuer `restarbeiten.ui.main`.
- Keine produktive Umschalt- oder Bearbeitungsnutzung im Launcher.
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

- Keine grosse neue Panel-Sektion.
- Keine automatische Surface-Liste.
- Keine produktive Surface-Umschaltung.
- Keine Freigabe weiterer SurfaceIds.
- Keine Aktivierung von PDF-/Plan-/Canvas-Bearbeitung.
- Keine Drag-/Resize-/Persistenz-Ausfuehrung.

## Testreferenz

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
