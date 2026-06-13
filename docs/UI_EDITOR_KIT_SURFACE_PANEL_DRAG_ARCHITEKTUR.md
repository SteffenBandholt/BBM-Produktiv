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
- `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js`
- `src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js`
- `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js`
- `src/renderer/uiEditor/bbmUiEditorRegistry.js`
- `src/renderer/editorRuntime/scopes/editorScopeTypes.js`

Der Electron-Renderer nutzt bewusst Bridge-Dateien mit relativem Pfad in `node_modules`, weil Bare-Package-Imports wie `ui-editor-kit/runtime/panel` im Renderer nicht zulaessig sind.

Die Surface-Bridge ist seit G38 testweise vorhanden. Sie wird noch nicht im Launcher oder in produktiven Screens genutzt.

Der erste BBM-SurfaceAdapter-Pilot ist seit G39 read-only vorhanden. Er uebersetzt `restarbeiten.ui.main` aus vorhandener Registry und aktuellem LayoutState in ein neutrales `ui-screen`-Surface-Modell und validiert es ueber die Surface-Runtime-Bridge. Er wird noch nicht produktiv im Launcher verwendet.

Die DragRuntime-Bridge ist seit G41 testweise vorhanden. Sie wird noch nicht im Launcher oder in produktiven Screens genutzt und bindet keine DOM-, Pointer- oder Maus-Events an.

Die Panel-/Drag-Baseline des BBM-Launchers ist seit G42 testseitig abgesichert: Das bestehende Preview-Panel wird weiterhin ueber die vorhandene Launcher-Logik geoeffnet, geschlossen, verschoben, defensiv im Viewport normalisiert und zurueckgesetzt. Hidden-Elements-Button/Popover bleiben Teil derselben Baseline.

Seit G43 nutzt der BBM-Launcher die DragRuntime-Bridge kontrolliert fuer die reine Preview-Panel-Positionsberechnung. Verwendet wird `buildDragResult(...)` mit `coordinateSystem: "css-pixels"`. DOM-/Mouse-Event-Anbindung, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Hidden-Elements-Panelbestandteile bleiben im Host/Launcher.

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
