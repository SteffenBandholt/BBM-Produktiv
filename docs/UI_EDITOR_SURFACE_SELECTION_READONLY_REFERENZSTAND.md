# UI-Editor SurfaceSelection read-only Referenzstand

## Kurzfazit

Die kompakte Surface-Auswahl im bestehenden Editorpanel ist als stabiler
read-only Referenzstand abgeschlossen. Sichtbar und auswaehlbar ist nur
`restarbeiten.ui.main` mit dem Label `Restarbeiten`. Die SurfaceInfo bleibt
direkt darunter sichtbar. Es gibt keine echte Umschaltung, keine grosse
Surface-Liste, kein Dropdown, keine Bearbeitung, keinen Drag, kein Resize und
keine Persistenz.

Seit G58 ist ein interner read-only SurfaceSelection-State vorbereitet. Dieser
State aendert den sichtbaren Referenzstand nicht und aktiviert keine echte
Umschaltung.
Seit G59 verwendet der BBM-Launcher diesen State read-only als interne Quelle.
Der sichtbare Referenzstand bleibt unveraendert.
Seit G60 ist diese Launcher-State-Nutzung als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
Seit G61 ist ein defensives read-only Surface-Umschaltungsmodell vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`. Der sichtbare Referenzstand bleibt
unveraendert.
Seit G62 ist dieser SurfaceSwitch-Stand als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
Seit G63 nutzt der BBM-Launcher das SurfaceSwitch-Modell intern read-only. Der
sichtbare Referenzstand bleibt unveraendert.

Seit G64 ist der Launcher-Einsatz als eigener read-only Referenzstand
abgeschlossen:
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.

Seit G65 ist zusaetzlich ein defensiver read-only
SurfaceSwitch-Request/Command-Handler vorbereitet:
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md`.
Der G66-Referenzstand dazu steht in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md`.
G67 nutzt den Command intern read-only im Launcher, ohne sichtbare
Umschaltung.
Der G68-Referenzstand dazu steht in
`docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md`.

## Aktueller read-only Stand

- Das bestehende Editorpanel zeigt eine kompakte Surface-Auswahl.
- Die Anzeige ist rein lesend.
- Die Anzeige basiert auf dem SurfaceSelection-State, dem SurfaceSelectionModel,
  der SurfacePolicy und dem SurfaceAdapterCatalog.
- Sichtbar bleibt nur der Pilot `restarbeiten.ui.main`.
- PDF-/Plan-Surfaces bleiben unsichtbar und nicht auswaehlbar.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Sichtbare Surface-Auswahl

```text
sichtbar / auswaehlbar:
- restarbeiten.ui.main

Label:
- Restarbeiten
```

Die Anzeige ist keine echte Auswahlsteuerung. Sie zeigt den aktuellen
freigegebenen Pilot-Surface an und fuehrt keine Umschaltung aus.

## Nicht sichtbare / nicht auswaehlbare Surfaces

```text
nicht sichtbar / nicht auswaehlbar:
- pdf.plan.page.1
- plan.canvas.default
- unbekannte SurfaceIds
- *
```

Es gibt keine Wildcard, keinen Default-Adapter und keine automatische Freigabe
weiterer SurfaceIds.

## Policy-Grenzen

- `visibleInEditor: true` gilt nur fuer `restarbeiten.ui.main`.
- `pdf.plan.page.1` bleibt `visibleInEditor: false`.
- `plan.canvas.default` bleibt `visibleInEditor: false`.
- Unbekannte SurfaceIds, leere IDs und `*` bleiben voll blockiert.
- Die SurfacePolicy ist keine Bearbeitungsfreigabe.
- Drag, Resize und Persistenz bleiben fuer alle SurfaceIds gesperrt.

## Datenfluss

```text
Editorpanel im BBM-Launcher
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> visibleInEditor-Pruefung
-> SurfaceAdapterCatalog
-> read-only SurfaceModel
-> kompakte Surface-Auswahl im Panel
-> kompakte SurfaceInfo im Panel
```

Read-only State-Anbindung seit G59:

```text
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSelectionForLauncher(...)
-> buildReadonlySurfaceSelectionState(...)
-> SurfaceSelectionModel
-> SurfacePolicy
-> visibleInEditor-Pruefung
-> SurfaceAdapterCatalog
-> read-only SurfaceSelection-State
```

Der Datenfluss bleibt hostkontrolliert. Das UI-Editor-kit validiert und
normalisiert neutrale Modelle, kennt aber keine BBM-Fachlogik und schreibt
keine Zustaende.

Read-only Umschaltungsmodell seit G61:

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
Editorpanel im BBM-Launcher
-> buildReadonlySurfaceSwitchResultForLauncher(...)
-> resolvedSurfaceId restarbeiten.ui.main
-> kompakte read-only Surface-Auswahl
-> kompakte SurfaceInfo
```

## Sicherheitsgrenzen

Guardrail-Begriff: kein Drag.
Guardrail-Begriff: keine Persistenz.

- Read-only.
- Keine echte Umschaltung.
- SurfaceSelection-State nur intern read-only angebunden.
- Surface-Umschaltungsmodell nur intern read-only vorbereitet.
- SurfaceSwitch-Referenzstand nur dokumentarisch abgeschlossen.
- SurfaceSwitch wird im Launcher nur intern read-only verwendet.
- Keine grosse Surface-Liste.
- Kein Dropdown mit weiteren Optionen.
- Keine Bearbeitung.
- Kein Drag.
- Kein Resize.
- Keine Persistenz.
- Kein `localStorage`.
- Kein `writeFile`.
- Kein IPC-Schreibweg.
- Keine DB-Aenderung.
- Keine Registry-Aenderung.
- Keine PDF-/Plan-Bearbeitung.
- Keine Canvas-Bearbeitung.
- Keine Fachlogik.
- Kein Bare-Package-Import im Renderer.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Ausdruecklich nicht aktiviert

- Keine neue Surface sichtbar gemacht.
- Keine echte Surface-Umschaltung.
- Keine echte Surface-Umschaltung durch G61.
- Keine Dropdown-/Listen-UI mit weiteren Optionen.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswaehlbar.
- Keine Bearbeitungsbuttons.
- Keine Drag-/Resize-Aktivierung.
- Keine Persistenzfreigabe.
- Keine neue Produktivlogik.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung separat konzipieren und absichern.
- Weitere SurfaceIds nur ueber eigene Policy-/Allowlist-Freigabe sichtbar
  machen.
- PDF-/Plan-Surfaces nur in einem eigenen read-only oder Bearbeitungspaket
  sichtbar machen.
- Drag, Resize und Persistenz jeweils als getrennte Folgepakete behandeln.

## Testreferenz

- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
