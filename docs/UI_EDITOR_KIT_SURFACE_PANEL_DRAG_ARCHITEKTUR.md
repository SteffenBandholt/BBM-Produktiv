# UI-Editor-kit Surface-, Panel-, Drag- und PDF-Zielarchitektur

## Kurzfazit

G36 beschreibt die Zielarchitektur fuer ein surface-neutrales UI-Editor-kit. Das Kit soll allgemeine Editor-Faehigkeiten fuer UI-Screens, Module, Editor-Panels und spaeter PDF-/Plan-/Canvas-Ansichten bereitstellen, ohne BBM-Fachlogik, BBM-Registry, Persistenz, DB, IPC oder konkrete Renderer-Einbindung zu kennen.

Dieses Paket ist ein Inventar- und Architekturpaket. Es aktiviert keine neue Produktivlogik.

## Aktueller Stand

### UI-Editor-kit

Vorhandene Runtime-Bereiche im Nachbarrepo `C:\01_Projekte\UI-Editor-kit`:

- `src/runtime/preview/*`
- `src/runtime/panel/*`
- `src/runtime/hiddenElements/*`

Package-Exports:

- `ui-editor-kit/runtime/preview`
- `ui-editor-kit/runtime/panel`
- `ui-editor-kit/runtime/hidden-elements`
- `ui-editor-kit/runtime/surface`
- `ui-editor-kit/runtime/drag`

Die Preview-Runtime liefert neutrale Operationen, Preview-Zielaufloesung und Pending-ChangeRequest-Hilfen.

Die Panel-Runtime liefert aktuell Panel-State, Positionsnormalisierung, Open/Closed-State, Preview-Buttonmodell und ein neutrales Panel-ViewModel.

Die Hidden-Elements-Runtime liefert Hidden-Elements-Normalisierung, Button-ViewModel und Popover-ViewModel.

Die Surface-Runtime liefert seit G37 ein neutrales Modell mit Normalisierung und Validierung fuer `ui-screen`, `panel`, `pdf-page`, `canvas` und `plan`.

Die DragRuntime liefert seit G40 neutrale Bounds-/Delta-Normalisierung, Validierung, Apply-/Clamp-Berechnung und Ergebnisbildung fuer `css-pixels`, `pdf-points` und `canvas-pixels`.

### BBM

Relevante BBM-Dateien:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`
- `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js`
- `src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js`
- `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js`
- `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js`
- `src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js`
- `src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js`
- `src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js`
- `src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js`
- `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md`
- `docs/UI_EDITOR_SURFACE_POLICY.md`
- `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js`
- `src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js`
- `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js`
- `src/renderer/uiEditor/bbmUiEditorRegistry.js`
- `src/renderer/editorRuntime/scopes/editorScopeTypes.js`

Der Electron-Renderer nutzt bewusst Bridge-Dateien mit relativem Pfad in `node_modules`, weil Bare-Package-Imports wie `ui-editor-kit/runtime/panel` im Renderer nicht zulaessig sind.

Die Surface-Bridge ist seit G38 testweise vorhanden. Sie wird noch nicht im Launcher oder in produktiven Screens genutzt.

Der erste BBM-SurfaceAdapter-Pilot ist seit G39 read-only vorhanden. Er uebersetzt `restarbeiten.ui.main` aus vorhandener Registry und aktuellem LayoutState in ein neutrales `ui-screen`-Surface-Modell und validiert es ueber die Surface-Runtime-Bridge. Er wird noch nicht produktiv im Launcher verwendet.

Das erste PDF-/Plan-SurfaceAdapter-Skelett ist seit G48 read-only vorhanden. Es erzeugt leere neutrale Modelle fuer `pdf-page` und `plan` und validiert sie ueber die Surface-Runtime-Bridge. Es wird nicht im Launcher genutzt und bindet keine PDF-, Canvas-, Plan-, Drag- oder Renderlogik an.

Der zentrale SurfaceAdapter-Katalog ist seit G49 read-only vorhanden. Er listet nur explizit bekannte SurfaceIds, verbindet sie mit den vorhandenen Adapterfunktionen und validiert Modelle ueber die Surface-Runtime-Bridge. Er wird nicht im Launcher oder produktiven UI-Pfaden genutzt.

Der Katalogstand ist seit G50 als read-only Referenz dokumentiert. Das Referenzdokument beschreibt Adapter, bekannte SurfaceIds, blockierte unbekannte SurfaceIds, Datenfluss, Sicherheitsgrenzen, Nicht-Ziele und moegliche Folgepakete.

Der BBM-Launcher kann den Katalog seit G51 read-only testseitig ueber `buildReadonlySurfaceModelForLauncher(surfaceId, input)` verwenden. Diese Hilfsfunktion ist nicht an den sichtbaren Renderpfad angebunden und erzeugt keine Panel- oder Surface-Anzeige.

Die SurfacePolicy ist seit G52 read-only vorbereitet. Sie erlaubt die bekannten
SurfaceIds nur lesend, haelt Drag, Resize und Persistenz ausgeschaltet und
blockiert unbekannte SurfaceIds sowie Wildcards vollstaendig. Seit G53 ist
`visibleInEditor: true` nur fuer `restarbeiten.ui.main` gesetzt, damit eine
kompakte read-only SurfaceInfo im Editorpanel erscheinen darf.
Der SurfaceAdapterCatalog prueft die Lesefreigabe defensiv ueber diese Policy.

Die DragRuntime-Bridge ist seit G41 testweise vorhanden. Sie wird noch nicht im Launcher oder in produktiven Screens genutzt und bindet keine DOM-, Pointer- oder Maus-Events an.

Die Panel-/Drag-Baseline des BBM-Launchers ist seit G42 testseitig abgesichert: Das bestehende Preview-Panel wird weiterhin ueber die vorhandene Launcher-Logik geoeffnet, geschlossen, verschoben, defensiv im Viewport normalisiert und zurueckgesetzt. Hidden-Elements-Button/Popover bleiben Teil derselben Baseline.

Seit G43 nutzte der BBM-Launcher die DragRuntime-Bridge kontrolliert fuer die reine Preview-Panel-Positionsberechnung. Verwendet wurde `buildDragResult(...)` mit `coordinateSystem: "css-pixels"`. Seit G46 laeuft diese Panel-Positionsrechnung ueber den PanelRuntime-Panel-Drag-Helper aus der Panel-Bridge; die DragRuntime bleibt intern im UI-Editor-kit. DOM-/Mouse-Event-Anbindung, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Hidden-Elements-Panelbestandteile bleiben im Host/Launcher.

BBM besitzt weiterhin:

- konkrete Scopes,
- Registry,
- HostAdapter,
- Persistenz fuer den Pilot-Scope `restarbeiten.ui.main`,
- Rechte/Freigabeentscheidungen,
- DB/IPC/Preload,
- konkrete DOM- und Launcher-Orchestrierung.

### PDF-/Plan-nahe Bereiche

Es gibt PDF- und layoutTools-nahe Bestandsbereiche, unter anderem:

- `src/main/ipc/printIpc.js`
- `src/main/print/printData.js`
- `src/renderer/layoutTools/*`
- `src/renderer/modules/protokoll/layoutSurfaces/*`
- `src/renderer/editorRuntime/scopes/editorScopeTypes.js` mit `ui` und `pdf`

Diese Bereiche sind keine aktive UI-Editor-kit-SurfaceRuntime. G36 bindet sie nicht an und aktiviert keine PDF-Funktion.

## Zielbild

Das UI-Editor-kit soll langfristig surface-neutrale Editor-Faehigkeiten bereitstellen:

- Surface-Normalisierung,
- Panel-State und Panel-ViewModel,
- Drag-/Positionierungslogik,
- Hidden-Elements-ViewModels,
- ChangeRequest-Modell,
- Preview-/Pending-ChangeRequest-Hilfen,
- neutrale Runtime-Hilfen fuer UI-, PDF-, Plan- und Canvas-Surfaces.

BBM bleibt Host-App und liefert:

- konkrete Module,
- konkrete Scopes und Surfaces,
- Registry,
- HostAdapter,
- Persistenz,
- Rechte,
- Datenzugriff,
- DB/IPC/Preload,
- konkrete Renderer- und PDF-Einbindung.

## Begriffe

### Surface

Eine Surface ist eine editorfaehige Oberflaeche oder Ausgabeflaeche. Beispiele:

- UI-Screen,
- Modul-Screen,
- Editor-Panel,
- PDF-Seite,
- Planansicht,
- Canvas-Ansicht.

Eine Surface ist kein Speicherort und keine Fachaktion.

### SurfaceAdapter

Ein SurfaceAdapter uebersetzt eine konkrete Oberflaeche in ein neutrales Editor-Modell. Er kennt die konkrete Host-Umgebung, aber liefert dem Kit nur neutrale Daten.

Beispiele:

- UI-Screen-Adapter fuer DOM-Elemente,
- Protokoll-Screen-Adapter,
- Restarbeiten-Screen-Adapter,
- PDF-Page-Adapter,
- Plan-/Canvas-Adapter.

### PanelRuntime

Die PanelRuntime beschreibt Panel-State, Position, Buttonmodell, Status und ViewModels. Sie rendert nicht zwingend selbst in den Host-DOM.

### DragRuntime

Die DragRuntime soll spaeter Drag-State, Start/Move/Stop, Viewport-Clamping und Positionsnormalisierung neutral bereitstellen. Sie darf nicht selbst entscheiden, welches Host-Element ein Drag-Handle ist.

### HostAdapter

Der HostAdapter ist die Grenze zwischen Kit und Host-App. Er liefert HostContext, Registry, LayoutState, Capabilities und nimmt ChangeRequests entgegen. Persistenz bleibt Host-seitig.

### Registry

Die Registry ist die hostseitige Landkarte. Sie enthaelt bekannte Elemente, Labels, Parent-Struktur und erlaubte Operationen. Sie bleibt nicht im Kit und wird nicht durch das Kit veraendert.

### ChangeRequest

Ein ChangeRequest beschreibt eine vorbereitete Aenderung neutral, zum Beispiel:

```js
{
  operation: "visibility",
  payload: {
    visible: false
  },
  source: "preview",
  persistent: false
}
```

Ob ein ChangeRequest persistiert werden darf, entscheidet der HostAdapter.

### LayoutState

LayoutState ist der vom Host gelieferte aktuelle Layoutzustand fuer eine Surface oder einen Scope. Er kann gespeicherte Overrides enthalten, bleibt aber Host-seitig erzeugt und kontrolliert.

## Neutrales Surface-Zielmodell

### UI-Screen

```js
{
  surfaceId: "protokoll.topsScreen",
  surfaceType: "ui-screen",
  elements: [
    {
      elementId: "example.element",
      label: "Beispiel",
      visible: true,
      bounds: {
        x: 0,
        y: 0,
        width: 100,
        height: 30
      },
      capabilities: {
        canHide: true,
        canMove: false,
        canResize: false
      }
    }
  ]
}
```

### PDF-Seite spaeter

```js
{
  surfaceId: "pdf.plan.page.1",
  surfaceType: "pdf-page",
  pageNumber: 1,
  coordinateSystem: "pdf-points",
  elements: []
}
```

### Canvas-/Planansicht spaeter

```js
{
  surfaceId: "plan.floor.1",
  surfaceType: "canvas-view",
  coordinateSystem: "canvas-pixels",
  zoom: 1,
  elements: []
}
```

## Trennung Kit vs. Host

### Gehoert ins UI-Editor-kit

- Surface-neutrale Datenmodelle.
- PanelState und PanelViewModel.
- DragRuntime als neutrale Positions- und Drag-State-Logik.
- Hidden-Elements-ViewModel.
- Preview-/ChangeRequest-Hilfen.
- Operation-Mapping.
- Button-/Command-ViewModels.
- Validierung neutraler Adaptermodelle.

### Muss in BBM bleiben

- konkrete Module und Screens,
- konkrete Scopes,
- konkrete Registry,
- HostAdapter-Erzeugung,
- Persistenz,
- Rechte und Lizenz-/Produktfreigaben,
- Datenzugriff,
- IPC/DB/Preload,
- PDF-/Druckausfuehrung,
- konkrete DOM-Anbindung,
- konkrete Electron-Renderer-Bridges,
- Fachlogik.

## Anschluss normaler UI-Screens

Ein UI-Screen wird nicht automatisch gescannt. Der Host stellt explizite Registry-Elemente und stabile DOM-Anker bereit.

Empfohlener Ablauf:

1. Host waehlt `surfaceId` und Scope.
2. Host liefert Registry und LayoutState.
3. SurfaceAdapter liest nur freigegebene DOM-Anker.
4. Adapter erzeugt neutrales Surface-Modell.
5. Kit baut daraus Panel-/Hidden-/Preview-ViewModels.
6. Host rendert Panel und wendet Preview optisch an.
7. HostAdapter entscheidet ueber Persistenz.

## Anschluss von PDF-/Plan-/Canvas-Ansichten spaeter

PDF, Plan und Canvas duerfen nicht wie normale DOM-Screens behandelt werden.

Empfohlener Ablauf:

1. Host definiert eine eigene Surface, z. B. `surfaceType: "pdf-page"`.
2. Host liefert ein Koordinatensystem, z. B. `pdf-points`.
3. Host liefert Elemente nur aus einer expliziten PDF-/Plan-Landkarte.
4. Kit arbeitet nur mit neutralen Bounds, Capabilities und ChangeRequests.
5. Host entscheidet, ob und wo Overrides gespeichert werden.
6. Host prueft getrennt, ob Aenderungen UI, PDF oder beides betreffen.

Wichtig: G36 aktiviert keine PDF-/Plan-/Canvas-Bearbeitung.

## Sicherheitsgrenzen

- UI-Editor-kit speichert nicht.
- Persistenz bleibt Host-seitig.
- Das Kit kennt keine BBM-Daten.
- Das Kit kennt keine DB.
- Das Kit kennt kein IPC.
- Das Kit kennt keine Fachlogik.
- Das Kit erzeugt keine globale Scope-Freigabe.
- Das Kit leitet keine Elemente aus DOM-Reihenfolge, CSS-Klassen oder sichtbaren Texten ab.
- Das Kit aktiviert keine PDF-/Drucklogik.
- Das Kit darf UI und PDF nur ueber neutrale Adaptermodelle bedienen.
- BBM-Renderer bleibt ohne Bare-Package-Import.
- Registry bleibt Host-seitig und unveraendert.

## Empfohlene Schrittfolge

### G37: Surface-Modell nur im Kit vorbereiten

- neutrales `Surface`-/`SurfaceElement`-Modell definieren,
- CommonJS/ESM-Export vorbereiten,
- reine Modell-/Validator-Tests,
- keine BBM-Produktivnutzung.

Status: erledigt im UI-Editor-kit.

### G38: BBM Surface-Bridge vorbereiten

- renderer-kompatible Bridge fuer eine spaetere `ui-editor-kit/runtime/surface`,
- Importvertrag testen,
- kein Launcher-Umbau.

Status: erledigt in BBM. Die Bridge ist pruefbar, aber nicht produktiv genutzt.

### G39: UI-Screen-SurfaceAdapter fuer BBM vorbereiten

- Registry plus DOM-Anker in neutrales Surface-Modell uebersetzen,
- nur lesend,
- keine neue Persistenz und keine UI-Aenderung.

Status: read-only Pilot fuer `restarbeiten.ui.main` erledigt. Noch keine DOM-Vermessung, keine Launcher-Nutzung und kein Drag.

### G40: DragRuntime als neutrale Kit-Hilfe vorbereiten

- Drag-State, Start/Move/Stop und Clamping als reine Funktionen,
- BBM nutzt sie noch nicht produktiv.

Status: erledigt im UI-Editor-kit als neutrale Rechenruntime ohne DOM-Events und ohne Persistenz.

### G41: BBM DragRuntime-Bridge pruefen

- renderer-kompatible DragRuntime-Bridge in BBM,
- Importvertrag und neutrale Drag-Rechnung testen,
- keine produktive Launcher-Nutzung,
- keine Persistenz- oder Scope-Aenderung.

Status nach G41: Noch keine Umstellung. Zunaechst ist nur die DragRuntime-Bridge in BBM testbar; produktive Panel-/Launcher-Nutzung bleibt separat.

### G42: Panel-/Drag-Baseline im BBM-Launcher absichern

- bestehende Launcher-Panel-Initialisierung, Open/Close und Positionsnormalisierung testseitig absichern,
- Hidden-Elements-Button/Popover als unveraenderte Panel-Baseline mitpruefen,
- DragRuntime-Bridge nur testseitig als Vergleichspunkt nutzen,
- keine Produktivnutzung der DragRuntime und keine Event-/DOM-Aenderung.

Status nach G42: Baseline ist abgesichert. Die Panel-Drag-Rechnung liegt weiterhin im BBM-Launcher; eine spaetere kontrollierte Berechnungsauslagerung in die DragRuntime bleibt ein eigenes Folgepaket mit eigener Sichtpruefung.

### G43: Panel-Positionsberechnung ueber DragRuntime vorbereiten

- `buildDragResult(...)` aus der DragRuntime-Bridge fuer reine Panel-Positionsrechnung verwenden,
- DOM-/Mouse-Event-Code im Launcher belassen,
- bestehendes sichtbares Verhalten beibehalten,
- keine neue Panel-Funktion und keine Persistenz.

Status nach G43: Die reine Positionsberechnung ist kontrolliert ueber die DragRuntime-Bridge angebunden. Event-Anbindung, DOM, Reset und Rendering bleiben Host-/Launcher-Aufgabe; PDF, Canvas, Plan, Registry und Persistenz bleiben unveraendert.

### G44: Panel-Drag-Sichtpruefung als Referenz absichern

- lokale Electron-DEV-App mit `npm start` starten,
- UI-Editor-Button, Panel-Oeffnen, Panel-Drag, Viewport-Begrenzung, Reset, Schliessen/Wieder-Oeffnen und Hidden-Elements-Bereich sichtbar pruefen,
- Ergebnis nur dokumentieren, keine weitere Drag-Auslagerung und keine neue Funktion aktivieren.

Status nach G44: Die G43-Umstellung ist sichtbar geprueft. Die DragRuntime uebernimmt weiterhin nur die Positionsberechnung; DOM-/Mouse-Events, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Rendering bleiben im BBM-Launcher. PDF, Canvas, Plan, Registry und Persistenz bleiben unveraendert.

### G46: BBM-Panelrechnung ueber PanelRuntime-Helper fuehren

- PanelRuntime-Bridge stellt `PANEL_DRAG_COORDINATE_SYSTEM`, `normalizePanelDragInput(...)`, `buildPanelDragResult(...)` und `calculatePanelDragPosition(...)` bereit,
- BBM-Launcher nutzt fuer die Preview-Panel-Positionsberechnung `calculatePanelDragPosition(...)`,
- direkte DragRuntime-Nutzung im Launcher fuer Panel-Positionierung entfernen,
- DOM-/Mouse-Event-Code, Style-Setzen, Reset, Open/Close und Hidden-Elements im Launcher belassen.

Status nach G46: Die reine Preview-Panel-Positionsrechnung laeuft ueber den PanelRuntime-Panel-Drag-Helper. Die DragRuntime bleibt kit-intern hinter dem Helper. Sichtbares Verhalten, Event-Anbindung, Reset, Open/Close und Hidden-Elements bleiben unveraendert; PDF, Canvas, Plan, Registry und Persistenz bleiben unveraendert.

### G47: Panel/Drag-Referenzstand abschliessen

Aktueller Datenfluss:

```text
Mouse-/DOM-Event im BBM-Launcher
-> Start-Bounds + Delta + Viewport-Bounds
-> uiEditorKitPanelRuntimeBridge
-> PanelRuntime Panel-Drag-Helper im UI-Editor-kit
-> berechnete Bounds
-> Style-Setzen im BBM-Launcher
```

Referenzgrenzen:

- DOM-/Mouse-/Pointer-Anbindung bleibt im BBM-Launcher,
- Style-Setzen, Panel-Open/Close, Panel-Reset und Hidden-Elements-Button/Popover bleiben im Launcher,
- UI-Editor-kit speichert nicht,
- keine Persistenz,
- kein PDF/Canvas/Plan,
- keine Registry-Aenderung und keine Fachlogik.

Status nach G47: Der Panel/Drag-Block ist dokumentarisch als Referenzstand abgeschlossen. `docs/UI_EDITOR_PANEL_DRAG_REFERENZSTAND.md` haelt Datenfluss, verwendete PanelRuntime-Funktionen, Sicherheitsgrenzen, Nicht-Ziele und Testreferenzen fest. G47 aktiviert keine neue Produktivlogik.

### G48: PDF-/Plan-Surface read-only vorbereiten

Aktuelle read-only Modelle:

```text
PDF:
surfaceId: "pdf.plan.page.<pageNumber>"
surfaceType: "pdf-page"
coordinateSystem: "pdf-points"
pageNumber: <positive integer>
elements: []

Plan:
surfaceId: "plan.canvas.default"
surfaceType: "plan"
coordinateSystem: "canvas-pixels"
elements: []
```

Referenzgrenzen:

- SurfaceRuntime validiert nur das neutrale Modell.
- `pdfPlanSurfaceAdapter.js` importiert die Runtime nur ueber `uiEditorKitSurfaceRuntimeBridge.js`.
- Keine produktive Launcher-Nutzung.
- Keine sichtbare UI-Aenderung.
- Keine PDF-Bearbeitung.
- Keine PDF-/Canvas-Renderlogik.
- Kein Drag auf PDF oder Plan.
- Keine Persistenz.
- Kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg und keine DB.
- Keine Registry-Aenderung und keine Fachlogik.

Status nach G48: PDF-/Plan-Surfaces sind in BBM nur als read-only Adapter-Skelett vorbereitet. Der Host bleibt fuer spaetere Rechte, Persistenz und echte PDF-/Planlogik zustaendig; UI-Editor-kit speichert nicht.

### G49: SurfaceAdapter-Katalog read-only vorbereiten

Bekannte SurfaceIds:

```text
restarbeiten.ui.main
pdf.plan.page.1
plan.canvas.default
```

Katalogfunktionen:

- `getKnownSurfaceAdapterIds()`
- `getSurfaceAdapterById(surfaceId)`
- `isKnownSurfaceAdapterId(surfaceId)`
- `buildSurfaceModelById(surfaceId, input)`
- `validateSurfaceModelById(surfaceId, input)`

Referenzgrenzen:

- Kein Default-Adapter fuer unbekannte SurfaceIds.
- Keine Wildcard-Freigabe.
- Unbekannte SurfaceIds liefern `UNKNOWN_SURFACE_ADAPTER`.
- SurfaceRuntime wird nur ueber `uiEditorKitSurfaceRuntimeBridge.js` importiert.
- Keine produktive Launcher-Nutzung.
- Keine sichtbare UI-Aenderung.
- Keine PDF-/Canvas-/Plan-Bearbeitung.
- Kein Drag.
- Keine Persistenz.
- Kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg und keine DB.
- Keine Registry-Aenderung und keine Fachlogik.

Status nach G49: BBM kann bekannte SurfaceAdapter read-only zentral finden, Modelle bauen und ueber die SurfaceRuntime-Bridge validieren. Host bleibt spaeter fuer Rechte, Scopes, Persistenz und echte Surface-Integration zustaendig.

### G50: SurfaceAdapter-Katalog als Referenzstand abschliessen

Referenzdokument:

- `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md`

Aktueller Datenfluss:

```text
BBM-Test / spaeter Host-Aufruf
-> SurfaceAdapterCatalog
-> konkreter read-only SurfaceAdapter
-> neutrales SurfaceModel
-> uiEditorKitSurfaceRuntimeBridge
-> SurfaceRuntime im UI-Editor-kit
-> Validierung/Normalisierung
```

Bekannte SurfaceIds:

```text
restarbeiten.ui.main
pdf.plan.page.1
plan.canvas.default
```

Harte Grenzen:

- Keine Wildcard.
- Kein Default-Adapter.
- Unbekannte SurfaceIds werden mit `UNKNOWN_SURFACE_ADAPTER` blockiert.
- Keine Produktivnutzung im Launcher.
- Keine sichtbare UI-Aenderung.
- Keine PDF-/Plan-Bearbeitung.
- Kein Drag.
- Keine Persistenz.
- UI-Editor-kit speichert nicht.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

Status nach G50: Der SurfaceAdapter-Katalog ist dokumentarisch als stabiler read-only Referenzstand abgeschlossen. G50 aktiviert keine neue Produktivlogik.

### G51: SurfaceAdapter-Katalog read-only im Launcher vorbereiten

Launcher-Hilfsfunktion:

- `buildReadonlySurfaceModelForLauncher(surfaceId, input)`

Testseitig gepruefte SurfaceIds:

```text
restarbeiten.ui.main
pdf.plan.page.1
plan.canvas.default
```

Grenzen:

- Unbekannte SurfaceIds bleiben mit `UNKNOWN_SURFACE_ADAPTER` blockiert.
- Keine Wildcard.
- Kein Default-Adapter.
- Keine sichtbare Surface-Anzeige.
- Keine neue Panel-Sektion.
- Keine produktive Surface-Auswahl.
- Keine PDF-/Canvas-/Plan-Bearbeitung.
- Kein Drag.
- Keine Persistenz.
- Keine PDF-/Plan-Renderintegration.

Status nach G51: Der Launcher kann den SurfaceAdapter-Katalog read-only testseitig verwenden. Es ist keine sichtbare Nutzung aktiviert.

### G52: SurfacePolicy read-only vorbereiten

Die SurfacePolicy definiert fuer bekannte SurfaceIds eine defensive
Rechte-/Freigabeschicht:

```text
restarbeiten.ui.main: readable true, canHide true, sonst keine Editor-/Drag-/Resize-/Persist-Freigabe
pdf.plan.page.1: readable true, keine Editor-/Hide-/Drag-/Resize-/Persist-Freigabe
plan.canvas.default: readable true, keine Editor-/Hide-/Drag-/Resize-/Persist-Freigabe
```

Unbekannte SurfaceIds, Wildcards und leere IDs bleiben voll blockiert. Der
Katalog bleibt read-only und es wird keine sichtbare Surface-Auswahl aktiviert.

### G53: Erste sichtbare read-only SurfaceInfo vorbereiten

Sichtbarer Pilot:

```text
Surface: restarbeiten.ui.main
Typ: ui-screen
Elemente: <Anzahl>
```

Grenzen:

- Nur `restarbeiten.ui.main` ist `visibleInEditor: true`.
- `pdf.plan.page.1` bleibt `visibleInEditor: false`.
- `plan.canvas.default` bleibt `visibleInEditor: false`.
- Keine Surface-Liste.
- Keine Surface-Auswahl.
- Keine Bearbeitungsbuttons.
- Kein Drag.
- Kein Resize.
- Keine Persistenz.
- Keine PDF-/Plan-/Canvas-Bearbeitung.

### G54: SurfaceInfo read-only als Referenzstand abschliessen

Referenzdokument:

- `docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md`

Aktueller Datenfluss:

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

Status nach G54: Die sichtbare SurfaceInfo ist dokumentarisch als read-only
Referenzstand abgeschlossen. Sichtbar bleibt nur `restarbeiten.ui.main`.
`pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards
bleiben unsichtbar. Es gibt keine Surface-Liste, keine Surface-Auswahl, keine
Bearbeitung, keinen Drag, kein Resize und keine Persistenz.

### G55: Surface-Auswahlmodell read-only vorbereiten

Modell:

- `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionModel.js`
- `docs/UI_EDITOR_SURFACE_SELECTION_READONLY.md`

Aktueller Datenfluss:

```text
BBM-Test / spaeter Editorpanel-Host
-> buildReadonlySurfaceSelectionModel(...)
-> getVisibleEditorSurfaceIds(...)
-> SurfaceAdapterCatalog
-> SurfacePolicy
-> read-only SurfaceSelection-Modell
```

Status nach G55: Das Auswahlmodell ist nur vorbereitet. Es enthaelt aktuell
ausschliesslich `restarbeiten.ui.main`, weil nur diese SurfaceId im Katalog
bekannt, lesbar und `visibleInEditor: true` ist. `pdf.plan.page.1`,
`plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben nicht
auswaehlbar. Es gibt keine sichtbare Auswahl, keine Dropdown-/Listen-UI, keine
Bearbeitung, keinen Drag, kein Resize und keine Persistenz.

## Nicht-Ziele von G36

- keine Produktivlogik,
- keine UI-Aenderung,
- keine neue Persistenz,
- keine neuen Scopes,
- keine PDF-Funktion,
- keine Drag-Funktionsaenderung,
- keine Registry-Aenderung,
- kein `localStorage`,
- kein `writeFile`,
- kein IPC-Schreibweg,
- kein Bare-Package-Import im Renderer,
- keine alten Editorpfade.
