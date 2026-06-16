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
sichtbar, aber nur read-only fuer freigegebene SurfaceIds.
Seit G57 ist diese sichtbare read-only Surface-Auswahl als Referenzstand in
`docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` dokumentiert.
Seit G58 ist ein interner read-only SurfaceSelection-State vorbereitet. Er
nutzt dieselbe `visibleInEditor`-Grenze und macht keine weitere Surface
sichtbar.
Seit G59 nutzt der BBM-Launcher diesen State read-only als interne Quelle fuer
die bestehende kompakte Surface-Auswahl und SurfaceInfo.
Seit G60 ist dieser Launcher-State-Stand als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
Seit G61 ist ein defensives read-only Surface-Umschaltungsmodell vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Es nutzt dieselbe
`visibleInEditor`-Grenze und loest nur `restarbeiten.ui.main` auf.
Seit G62 ist dieser SurfaceSwitch-Stand als read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
Seit G63 nutzt der BBM-Launcher das SurfaceSwitch-Modell intern read-only; die
Policy-Grenze bleibt unveraendert.

Seit G64 ist dieser Launcher-Einsatz als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.
Der G66-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md` dokumentiert.
G67 nutzt den Command intern read-only im Launcher, ohne Persistenz oder
sichtbare UI-Aenderung.
Der G68-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md` dokumentiert.
Der G69-Gesamt-Referenzstand dazu ist in
`docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md` dokumentiert.

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
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false

plan.canvas.default
readable: true
visibleInEditor: true
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
gebunden. Aktuell gilt das fuer `restarbeiten.ui.main`,
`pdf.plan.page.1` und `plan.canvas.default`.

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
gebunden. Aktuell sind dadurch `restarbeiten.ui.main`, `pdf.plan.page.1`
und `plan.canvas.default` enthalten; unbekannte SurfaceIds bleiben
ausgeschlossen.

Sichtbare Surface-Auswahl seit G56:

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> buildReadonlySurfaceSelectionModel(...)
-> SurfacePolicy
-> kompakte read-only Anzeige fuer Restarbeiten und PDF Plan Seite 1
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

Read-only Surface-Umschaltungsmodell seit G61:

```text
Wechselwunsch
-> surfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> read-only Ergebnis
```

SurfaceSwitch-Referenzfluss seit G62:

```text
SurfaceSwitch-Wunsch
-> SurfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> erlaubtes resolvedSurfaceId
-> kein produktiver Wechsel im Launcher
```

Launcher-Nutzung seit G63:

```text
BBM-Launcher
-> buildReadonlySurfaceSwitchResultForLauncher(...)
-> SurfaceSwitchModel
-> SurfacePolicy-Grenze ueber SurfaceSelection
-> resolvedSurfaceId restarbeiten.ui.main
```

## Sicherheitsgrenzen

- Keine globale Freigabe.
- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds bleiben blockiert.
- `visibleInEditor: true` fuer `restarbeiten.ui.main`, `pdf.plan.page.1`
  und `plan.canvas.default`.
- `canDrag: false` fuer alle bekannten SurfaceIds.
- `canResize: false` fuer alle bekannten SurfaceIds.
- `canPersist: false` fuer alle bekannten SurfaceIds.
- Sichtbare Surface-Auswahl nur read-only fuer freigegebene SurfaceIds.
- Keine Surface-Umschaltung.
- SurfaceSelection-State nur intern read-only angebunden.
- Surface-Umschaltungsmodell nur intern read-only vorbereitet.
- SurfaceSwitch-Referenzstand ohne Launcher-Produktivintegration.
- Launcher nutzt SurfaceSwitch nur intern read-only.
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
- Keine echte Umschaltung.
- Keine Freigabe weiterer SurfaceIds.
- Keine Aktivierung von PDF-/Plan-/Canvas-Bearbeitung.
- Keine Drag-/Resize-/Persistenz-Ausfuehrung.

## Testreferenz

- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Status nach G75

`pdf.plan.page.1` ist jetzt per Policy read-only sichtbar freigegeben.
`plan.canvas.default` bleibt blockiert. Die Policy bleibt damit eine
explizite read-only Allowlist ohne Drag, Resize oder Persistenz.

## Status nach G76

Der sichtbare Referenzstand dazu ist in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` festgehalten.

- Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`
- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine Wildcard
- kein Default-true

## Status nach G77

Die fachlich/technische Einordnung dieses SurfaceInfo-Verhaltens ist in
`docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md` als offene
Entscheidungsgrundlage dokumentiert. Empfehlung: vorerst keine Aenderung an
der SurfaceInfo und kein stiller Uebergang in echte Umschaltung.

## Status nach G78

Das bestehende UI-Editor-Panel zeigt jetzt zusaetzlich einen kleinen
read-only Hinweis fuer `pdf.plan.page.1`:

```text
PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
```

Die SurfacePolicy bleibt unveraendert. SurfaceInfo bleibt
`restarbeiten.ui.main`, `plan.canvas.default` bleibt blockiert, und es gibt
weiterhin keine echte Umschaltung, kein Drag, kein Resize und keine
Persistenz.

## Status nach G81

Die gebuendelte Abnahmereferenz fuer `pdf.plan.page.1` ist jetzt in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
zusammengefasst. Die SurfacePolicy bleibt dabei unveraendert: `pdf.plan.page.1`
ist read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface
und `plan.canvas.default` bleibt blockiert.

## Status nach G82

`plan.canvas.default` wird jetzt nur als naechster Kandidat dokumentiert.
Die SurfacePolicy selbst wird in G82 nicht geaendert; `pdf.plan.page.1`
bleibt read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface
und `plan.canvas.default` bleibt blockiert.

## Status nach G83

`plan.canvas.default` ist jetzt explizit read-only sichtbar freigegeben.
Die SurfacePolicy bleibt weiterhin explizit und ohne Drag, Resize oder
Persistenz:

- `restarbeiten.ui.main` sichtbar
- `pdf.plan.page.1` sichtbar
- `plan.canvas.default` sichtbar
- unbekannte SurfaceIds blockiert

## Status nach G84

- Der Zwei-Surface-read-only-Stand ist jetzt zusaetzlich in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
  dokumentiert.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
