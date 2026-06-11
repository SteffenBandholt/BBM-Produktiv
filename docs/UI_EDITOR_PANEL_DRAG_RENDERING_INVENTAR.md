# UI-Editor Panel / Drag / Rendering Inventar

## Kurzfazit

Der BBM-Launcher enthaelt weiterhin UI-nahe Logik rund um Preview-Panel, Statusanzeige, Panel-Position, Drag, Preview-Buttons, Reset und Verwerfen. Diese Logik ist nicht Teil der bereits ins UI-Editor-kit zurueckgefuehrten Preview-Runtime.

Die Preview-Runtime-Quelle ist abgeschlossen ins UI-Editor-kit verschoben. BBM konsumiert sie produktiv ueber:

```text
UI-Editor-kit -> src/runtime/preview/index.mjs -> src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js -> BbmUiEditorRuntimeLauncher.js
```

Dieses Dokument inventarisiert nur. Es beschreibt keine Codeverschiebung und keine Verhaltensaenderung.

## Aktueller BBM-Stand

Der relevante Launcher liegt in:

```text
src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js
```

Der Launcher ist aktuell gleichzeitig:

- DEV-gesteuerter Einstieg fuer den UI-Editor-Button
- Host-Orchestrator fuer BBM-Scope, Registry und HostAdapter
- Integrationspunkt fuer installierte UI-Editor-Artefakte
- Renderer-seitiger DOM-Orchestrator fuer Auswahl, Statuspanel und Previewpanel
- Bedienoberflaeche fuer temporaere Preview-Aenderungen
- Anwender der Kit-Preview-Runtime ueber `uiEditorKitPreviewRuntimeBridge.js`

Die generischen Operationen, Zielmodell- und Pending-ChangeRequest-Hilfen kommen bereits aus dem UI-Editor-kit. Panel, Drag, Rendering und DOM-Style-Anwendung liegen noch im BBM-Launcher.

## Inventar im Launcher

### Launcher-Aktivierung

Funktionen und Blöcke:

- `isRuntimeLauncherDevEnabled(...)`
- `installBbmUiEditorRuntimeLauncher(...)`
- `renderLauncherButton(...)`
- `syncLauncherButtonState(...)`
- `removeExistingLauncher(...)`

Aufgabe:

- DEV-Kontext pruefen
- installierte Launcher-Artefakte laden
- Button erzeugen
- Aktivzustand setzen
- beim Deaktivieren Controller, Status und Previewpanel entfernen

Einordnung:

- Bleibt primaer in BBM, weil DEV-Gating, Header-Kontext, Host-Lifecycle und konkrete Einbindung app-spezifisch sind.

### Target Selection

Funktionen und Blöcke:

- `installLauncherTargetSelectionController(...)`
- `findClickedUiEditorTarget(...)`
- `handleUiEditorDocumentClick(...)`
- `markUiEditorTargetSelection(...)`
- `clearUiEditorTargetSelection(...)`
- `clearUiEditorHoverSelection(...)`
- `removeLauncherTargetSelectionController(...)`

Aufgabe:

- installierte TargetSelection-Artefakte anbinden
- Hover- und Auswahlzustand in den Launcher-State schreiben
- DOM-Ziele ueber `data-ui-editor-id` finden
- ausgewaehltes Ziel visuell markieren
- Preview-Ziel ueber Kit-Runtime aufloesen

Einordnung:

- Die reine Auswahlmechanik kann spaeter teilweise kitnah werden.
- Die konkrete DOM-Markierung, Dokument-Eventbindung und BBM-Scope-Begrenzung bleiben zunaechst BBM-spezifische Host-Orchestrierung.

### Panel-Erzeugung

Funktionen und Blöcke:

- `ensureLauncherStatusHint(...)`
- `ensurePreviewPanel(...)`
- `removeExistingLauncherStatus(...)`
- `removeExistingPreviewPanel(...)`
- `stylePreviewPanel(...)`

Aufgabe:

- Statuspanel erzeugen
- Previewpanel erzeugen
- Basisattribute und Rollen setzen
- Inline-Styles fuer das Previewpanel setzen
- vorhandene Panels entfernen

Einordnung:

- Panel-State, Panel-Struktur und Basisrendering sind kitfaehige Kandidaten.
- Der konkrete Host-Append-Zielknoten, installierte Artefakte und BBM-Lifecycle bleiben in BBM.

### Panel-Rendering

Funktionen und Blöcke:

- `renderPreviewPanel(...)`
- `renderPreviewControls(...)`
- `renderReadonlyScopeButtons(...)`
- `updateLauncherStatusHint(...)`
- `getReadonlyLauncherStatusText(...)`
- `getReadonlyRegistryElementsText(...)`
- `getAvailableUiScopesText(...)`
- `getStatusScopeLabel(...)`

Aufgabe:

- Scope, Modul, Registry-Elemente, Hover, Auswahl und vorbereitete Aenderungen anzeigen
- Preview-Details anzeigen
- Buttonraster rendern
- Scope-Wechsel-Buttons rendern
- Statuspanel aktualisieren

Einordnung:

- Preview-Control-Rendering, ChangeRequest-Summary-Anzeige und Zielbeschreibung sind kitfaehige Kandidaten, solange sie nur neutrale ViewModels oder Textmodelle erhalten.
- Scope-Listen, Registry-Resolver und BBM-spezifische Statuskontexte bleiben in BBM.

### Panel-Drag und Position

Funktionen und Blöcke:

- `getPreviewPanelViewport(...)`
- `clampPreviewPanelPosition(...)`
- `setPreviewPanelPosition(...)`
- `resetPreviewPanelPosition(...)`
- `startPreviewPanelDrag(...)`
- `movePreviewPanelDrag(...)`
- `stopPreviewPanelDrag(...)`
- `stopPreviewPanelEvent(...)`

Aufgabe:

- feste Startposition setzen
- Panel im Viewport begrenzen
- Drag-State halten
- Mausbewegung in Panelposition umsetzen
- Drag-Listener installieren und entfernen

Einordnung:

- Drag-Controller, Panel-Position und Viewport-Clamping sind gute Kit-Kandidaten.
- BBM muss weiter entscheiden, wann ein Panel existiert und in welchem Host-Dokument es installiert wird.

### Preview-Bedienlogik

Funktionen und Blöcke:

- `applyPreviewOperation(...)`
- `createPreviewControlButton(...)`
- `getPreviewState(...)`
- `getPreviewOriginalStyle(...)`
- `getTargetBaseSize(...)`
- `applyPreviewState(...)`
- `upsertPreviewChangeRequest(...)`

Aufgabe:

- erlaubte Operation pruefen
- temporaeren Preview-State je DOM-Ziel fuehren
- Move/Resize/Hide/Show als Inline-Preview anwenden
- ChangeRequests ueber die Kit-Runtime erzeugen
- Bedienbuttons aktivieren oder deaktivieren

Einordnung:

- Buttonmodell und Bedienlogik sind teilweise kitfaehig.
- Die konkrete DOM-Style-Anwendung ist renderer- und hostnah; sie sollte erst nach einem neutralen Style-Preview-Vertrag betrachtet werden.

### Reset und Verwerfen

Funktionen und Blöcke:

- `resetPreviewForTarget(...)`
- `removePendingChangeRequestsForTarget(...)`
- `resetAllPreviewChanges(...)`
- `resetSelectedPreviewChange(...)`
- `discardPendingPreviewChanges(...)`

Aufgabe:

- Inline-Styles fuer ein Ziel zuruecksetzen
- Pending ChangeRequests fuer ein Ziel entfernen
- alle Preview-Styles zuruecksetzen
- alle vorbereiteten ChangeRequests verwerfen
- Status-/Preview-Meldung setzen

Einordnung:

- Reset-/Verwerfen-UI-Logik ist kitfaehig, wenn sie auf einem neutralen Preview-State arbeitet.
- Direktes Zurueckschreiben von DOM-Styles und HostAdapter-Notify bleiben bis zu einem separaten Vertrag in BBM.

### Statusanzeige

Funktionen und Blöcke:

- `getLauncherStatusText(...)`
- `getReadonlyLauncherStatusText(...)`
- `ensureLauncherStatusHint(...)`
- `updateLauncherStatusHint(...)`
- `renderReadonlyScopeButtons(...)`

Aufgabe:

- UI-Editor-Aktivstatus anzeigen
- aktiven Scope, Modul und Elementanzahl anzeigen
- Hover und Auswahl anzeigen
- Anzahl vorbereiteter Aenderungen anzeigen
- Statuspanel einklappen/ausblenden ueber installierten PanelController

Einordnung:

- Generische Status-ViewModels und neutrale Zielbeschreibung sind kitfaehig.
- BBM-spezifische Scope-/Modultexte und Hostzustand bleiben in BBM.

### HostAdapter-Anbindung

Funktionen und Blöcke:

- `createLauncherState(...)`
- `getHostRegistry(...)`
- `getHostContextFromState(...)`
- `notifyPendingChangeRequestsChanged(...)`
- `upsertPreviewChangeRequest(...)`

Aufgabe:

- HostAdapter oder In-Memory-Adapter einbinden
- Registry aus HostAdapter oder Resolver lesen
- HostContext an die Kit-Runtime weiterreichen
- Pending ChangeRequests in-memory an den HostAdapter melden

Einordnung:

- Der neutrale HostAdapter-Vertrag kann kitnah beschrieben werden.
- Die konkrete BBM-Erzeugung und Registry-/Scope-Auswahl bleiben in BBM.

### Registry-/Scope-Aufloesung

Funktionen und Blöcke:

- `normalizeReadonlyRegistry(...)`
- `normalizeReadonlyRegistryElements(...)`
- `normalizeAvailableUiScopes(...)`
- `setActiveScopeInState(...)`
- `getSelectedRegistryFromState(...)`
- `getRegisteredElementById(...)`

Aufgabe:

- Registry-Daten fuer Anzeige und Auswahl normalisieren
- aktive Scopes anzeigen und wechseln
- registrierte Elemente nach ID finden
- Registry aus HostAdapter, Resolver oder Fallbackdaten bestimmen

Einordnung:

- Neutrale Normalisierung kann kitfaehig sein.
- Welche Scopes existieren, welcher Scope aktiv ist und wie Registry-Daten aus BBM kommen, bleibt Host-App-Verantwortung.

### DOM-/Renderer-spezifische Teile

Funktionen und Blöcke:

- `getDocument(...)`
- `getWindow(...)`
- `ensureInstalledLauncherCss(...)`
- `loadInstalledLauncherButton(...)`
- `removeNode(...)`
- direkte `document.addEventListener(...)`- und `style`-Zugriffe
- direkte `appendChild(...)`-Nutzung

Aufgabe:

- Electron/native ESM und DOM direkt bedienen
- installierte UI-Editor-Artefakte laden
- CSS-Link einhaengen
- DOM-Knoten erzeugen, entfernen, stylen und markieren

Einordnung:

- Diese Teile bleiben vorerst in BBM oder in einem spaeteren Host-spezifischen Adapter.
- Sie duerfen nicht blind in eine generische Runtime wandern.

## Kitfaehige Kandidaten

### Panel-State

Kitfaehig als neutrales Datenmodell:

- aktiv/inaktiv
- ausgewaehltes Element
- Hover-Element
- Preview-Ziel
- vorbereitete Aenderungen
- Meldungen

Grenze:

- kein direkter BBM-Scope-Resolver
- keine konkrete DOM-Node-Persistenz im Kit-State ohne Vertrag

### Panel-Position

Kitfaehig:

- Defaultposition
- Viewport-Margin
- Clamp-Logik
- Reset auf Default

Grenze:

- konkrete CSS-Werte und Host-Layout-Konflikte muessen parametrierbar bleiben.

### Drag-Controller

Kitfaehig:

- Drag-State
- Start/Move/Stop
- Listener-Installationsvertrag
- Clamping ueber Viewport-Provider

Grenze:

- Host entscheidet, welches Panel und welcher Header Drag-Handle sind.

### Preview-Control-Rendering

Kitfaehig:

- Buttonmodell fuer Move, Resize, Hide, Show, Reset, Verwerfen
- Disabled-State auf Basis von `allowedOps`/`lockedOps`
- neutrale Action-IDs

Grenze:

- keine BBM-Texte oder Restarbeiten-Begriffe
- keine direkte Speicherung
- keine HostAdapter-Erzeugung

### ChangeRequest-Summary-Anzeige

Kitfaehig:

- Summary-ViewModel
- Anzahl vorbereiteter Aenderungen
- Operationsliste je Element/Ziel
- Hinweis `persistent: false`

Grenze:

- konkrete Paneltexte sollten spaeter als Labels/Formatter uebergeben werden.

### Reset-/Verwerfen-UI-Logik

Kitfaehig:

- Entscheidungslogik, wann Reset/Verwerfen aktiv ist
- neutrales Command-Modell
- Verbindung zu Pending-ChangeRequest-Reset

Grenze:

- DOM-Style-Ruecksetzung und Host-Notify brauchen einen separaten Adaptervertrag.

### Zielbeschreibung/Status-Texte

Kitfaehig:

- neutrale Zielbeschreibung aus Tag, `data-ui-editor-id`, Klassen und PreviewTargetMode
- Status-ViewModel fuer Auswahl, Hover, Scope und Summary

Grenze:

- fachliche Labels, App-Module und konkrete Scope-Namen kommen aus der Host-App.

## In BBM verbleibende Kandidaten

Diese Teile bleiben BBM-spezifisch:

- CoreShell-/DEV-Kontext
- konkrete DOM-Einbindung in Electron
- HostAdapter-Erzeugung
- Scope-/Registry-Auswahl
- Bridge zum UI-Editor-kit
- BBM-spezifische Start-/Lifecycle-Orchestrierung
- installierte Artefaktpfade `uiEditor/uiEditorLauncherButton.js`, `uiEditor/targetSelection.js` und CSS-Link
- Dokument-/Window-Zugriff im Electron-Renderer
- sichtbare DOM-Markierung per Outline/BoxShadow
- konkrete Preview-Style-Anwendung auf echte DOM-Ziele, bis ein neutraler Style-Adapter definiert ist

## Abhaengigkeiten

Bestehende Abhaengigkeiten im Launcher:

- installierte UI-Editor-Artefakte unter `uiEditor/`
- `uiEditorKitPreviewRuntimeBridge.js`
- `createInMemoryBbmEditorHostAdapter(...)`
- DOM APIs: `document`, `window`, `createElement`, `appendChild`, `addEventListener`, `style`
- Registry-Daten mit `id`, `parentId`, `allowedOps`, `lockedOps`, `previewTargetMode`, `editGranularity`, `affectsContainer`
- HostAdapter mit `getHostContext`, `getRegistry`, `onPendingChangeRequestsChanged`
- `data-ui-editor-id` als expliziter DOM-Anker

## Risiken einer spaeteren Auslagerung

- Panel-Rendering koennte versehentlich BBM-Scope-, Modul- oder Restarbeiten-Begriffe ins Kit ziehen.
- Drag-Logik kann Host-Layout brechen, wenn Defaultposition und Viewport-Grenzen nicht parametrierbar sind.
- DOM-Style-Preview kann zu stark an Electron/Browser-DOM gekoppelt werden.
- Reset/Verwerfen kann fachlich falsch wirken, wenn DOM-Style-Reset und Pending-ChangeRequest-Reset nicht sauber getrennt bleiben.
- Status-/Zieltexte koennen schnell Host-Fachlogik aufnehmen, wenn sie nicht als neutrales ViewModel geschnitten werden.
- Bestehende Tests nutzen Fake-DOM; sie ersetzen keine spaetere Sichtpruefung in Electron.

## Empfohlene Reihenfolge fuer spaetere Pakete

1. Neutrales Panel-State- und ViewModel-Modell im UI-Editor-kit vorbereiten.
2. Preview-Control-Buttonmodell ohne DOM-Rendering extrahieren.
3. ChangeRequest-Summary- und Zielbeschreibung als reine Formatter/ViewModel-Hilfen schneiden.
4. Drag-Controller als DOM-leichte, parametrierbare Hilfslogik vorbereiten.
5. Erst danach optional DOM-Rendering-Komponenten oder Adapter pruefen.
6. Preview-Style-Anwendung und Reset nur mit separatem Style-Adaptervertrag betrachten.
7. BBM-Launcher zuletzt auf eine einzelne Kit-Panel-Fassade umstellen, wenn Tests und Electron-Sichtpruefung stehen.

## Nicht-Ziele dieses Inventars

- keine Codeverschiebung
- keine Runtime-/Launcher-Aenderung
- keine Speicherung
- keine DB
- kein IPC
- kein localStorage
- keine Fachlogik
- keine PDF-/Drucklogik
- keine Panel-/Drag-Funktionsaenderung
- keine Restarbeiten-Sonderlogik
