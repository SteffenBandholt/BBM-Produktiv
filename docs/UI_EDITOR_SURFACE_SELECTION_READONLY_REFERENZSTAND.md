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

## Sicherheitsgrenzen

Guardrail-Begriff: kein Drag.
Guardrail-Begriff: keine Persistenz.

- Read-only.
- Keine echte Umschaltung.
- SurfaceSelection-State nur intern read-only angebunden.
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

- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
