# UI-Editor-kit Rueckfuehrung Vorbereitung

## Kurzfazit

Die ausgelagerten Preview-Runtime-Hilfen unter `src/renderer/editorRuntime/preview/` sind echte Kandidaten fuer eine spaetere Rueckfuehrung ins UI-Editor-kit. Sie sind fachneutral, arbeiten ohne Speicherung und enthalten keine BBM-, Restarbeiten-, Electron-, DB-, IPC- oder PDF-Logik.

Dieses Paket uebertraegt noch keinen Code ins externe UI-Editor-kit. Es dokumentiert nur den Stand, die Kandidaten, die noetigen Exports, die Testanforderungen und die offenen Entkopplungen.

## Aktueller BBM-Stand

In BBM liegen die generischen Preview-Hilfen aktuell hier:

- `src/renderer/editorRuntime/preview/index.js`
- `src/renderer/editorRuntime/preview/editorPreviewOperations.js`
- `src/renderer/editorRuntime/preview/editorPreviewTargetModel.js`
- `src/renderer/editorRuntime/preview/editorPendingChangeRequests.js`

Der BBM-Launcher bleibt bewusst der Host-Orchestrator:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- DOM-Panel und Status-/Preview-Rendering
- Drag-Panel
- HostAdapter-Anbindung
- TargetSelection und Klickauswahl
- Verbindung zur BBM-Registry und zum aktiven Scope

Die manuelle Electron-Pruefung ist bestanden: Preview, granulare Auswahl, verschiebbares Panel, vorbereitete Aenderungen, Reset, Verwerfen und Deaktivieren funktionieren weiter ohne Speicherung.

## Kit-Kandidaten

### Preview-Operation-Auswertung

`editorPreviewOperations.js` ist kit-faehig:

- `getElementAllowedOps(element)`
- `getElementLockedOps(element)`
- `getChangeRequestOperation(operation)`
- `isPreviewOperationAllowed(element, operation)`

Enthaltene generische Regeln:

- `resizeWidth` wird fuer ChangeRequests zu `width`.
- `resizeHeight` wird fuer ChangeRequests zu `height`.
- `hide` und `show` werden zu `visibility`.
- `resize` kann Breite und Hoehe erlauben.
- `width` und `height` koennen einzeln erlaubt oder gesperrt werden.
- `lockedOps` ueberstimmt nicht erlaubte Operationen gezielt.

### allowedOps / lockedOps

Die Auswertung von `allowedOps` und `lockedOps` ist kit-faehig, weil sie nur Registry-Metadaten liest und keine Ziel-App kennt.

Die konkrete fachliche Befuellung bleibt ausserhalb des Kit:

- welche Elemente editierbar sind
- welche Fachbuttons nur inspiziert werden duerfen
- welche Modulbereiche gesperrt bleiben

### previewTargetMode

`editorPreviewTargetModel.js` ist kit-faehig:

- `normalizePreviewTargetMode(value)`
- `getPreviewTargetMode(registryElement)`
- `resolvePreviewTargetElement(options)`
- `getPreviewTargetElement(state)`
- `getPreviewTargetElementId(state, targetNode)`
- `getNodeUiEditorId(node)`
- `findAncestorUiEditorElementById(targetNode, elementId)`

Enthaltene generische Regeln:

- `self`, `element`, `selected` bedeuten Preview auf dem ausgewaehlten Ziel.
- `parent`, `container`, `layoutcontainer`, `layout-container` bedeuten Preview auf dem registrierten Parent-Ziel.
- Ohne explizite Angabe bleibt der Modus `auto`.
- DOM-Zugriff ist auf generisches Lesen von `data-ui-editor-id` und Parent-Walk begrenzt.

### previewTarget-Aufloesung

Die Zielaufloesung ist kit-faehig, solange sie nur diese Eingaben verwendet:

- Registry-Element
- ausgewaehlte Element-ID
- aktuell getroffenes DOM-Ziel
- optionale Host-Funktion `getRegisteredElementById`
- `data-ui-editor-id` als expliziter DOM-Anker

Nicht kit-faehig waeren Heuristiken aus sichtbaren Ueberschriften, CSS-Klassen, DOM-Reihenfolge oder fachlichen IDs. Solche Heuristiken sind nicht enthalten und duerfen bei der Rueckfuehrung nicht eingefuehrt werden.

### pendingChangeRequests

`editorPendingChangeRequests.js` ist kit-faehig:

- `upsertPreviewChangeRequest(options)`
- `removePendingChangeRequestsForTarget(options)`
- `getPendingChangeRequestSummary(state, elementId)`

Die Requests bleiben temporaer:

- `source: "preview"`
- `persistent: false`
- keine Speicherung
- kein Submit
- keine DB-/IPC-/Dateiwege

### ChangeRequest-Deduplizierung

Die Deduplizierung ist kit-faehig:

- pro `targetElementId` und Operation genau ein Request
- `move` kumuliert `dx` und `dy`
- `width` und `height` kumulieren `delta`
- `visibility` wird durch letztes `hide`/`show` ueberschrieben

### Summary

Die Summary ist kit-faehig:

- Gesamtzahl vorbereiteter Requests
- Operationen fuer ein aktuelles Element oder Preview-Ziel
- keine UI-Texte, keine Host-Annahmen, keine Speicherung

### Reset je Ziel

Der zielbezogene Reset der `pendingChangeRequests` ist kit-faehig:

- Er entfernt Requests fuer das aktuelle `targetElementId`.
- Er ruft optional einen neutralen `notify`-Callback auf.
- Er setzt keine DOM-Styles selbst zurueck.

Das tatsaechliche Zuruecksetzen von Preview-Styles liegt aktuell noch im BBM-Launcher und ist separat zu schneiden, falls es spaeter ins Kit soll.

## Nicht-Kit-Kandidaten

Nicht ins UI-Editor-kit gehoeren:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` als Ganzes
- CoreShell-Anbindung und DEV-Gating
- `resolveActiveHostUiScope(...)`
- BBM-Registry-Resolver und aktive Scope-Auswahl
- konkrete BBM-HostAdapter-Erzeugung
- Restarbeiten-Registry
- Restarbeiten-UI-Elementliste
- Restarbeiten-IDs und konkrete DOM-Anker
- konkrete Electron-App-Pfade
- Fachlogik, Fachdaten, DB, IPC, Datei-Schreibwege
- PDF-, Druck-, Mail-, Upload-, Import-, Export- und Autosave-Logik
- alte Editor-, EditorLab-, EditorV2-, `editor.html`-, `editor.js`- oder `editorIpc.js`-Pfade

## Notwendige API / Exports

Das Kit sollte fuer dieses Paket mindestens diese fachneutralen Exports anbieten:

```js
export {
  getElementAllowedOps,
  getElementLockedOps,
  getChangeRequestOperation,
  isPreviewOperationAllowed,
} from "./preview/editorPreviewOperations.js";

export {
  getNodeUiEditorId,
  findAncestorUiEditorElementById,
  normalizePreviewTargetMode,
  getPreviewTargetMode,
  resolvePreviewTargetElement,
  getPreviewTargetElement,
  getPreviewTargetElementId,
} from "./preview/editorPreviewTargetModel.js";

export {
  upsertPreviewChangeRequest,
  removePendingChangeRequestsForTarget,
  getPendingChangeRequestSummary,
} from "./preview/editorPendingChangeRequests.js";
```

Im BBM-Repo ist dafuer jetzt der neutrale Sammel-Export `src/renderer/editorRuntime/preview/index.js` vorbereitet. Er dient als stabile Importkante fuer BBM und als Vorlage fuer den spaeteren Kit-Einstieg, ohne bereits Code ins externe Kit zu uebertragen.

Die API braucht als Eingaben nur neutrale Daten:

- Registry-Element mit `id`, `parentId`, `allowedOps`, `lockedOps`, `previewTargetMode`, `previewTarget`, `editGranularity`, `affectsContainer`
- Runtime-State mit `selectedElement`, `selectedTargetNode`, `selectedPreviewTargetNode`, `pendingChangeRequests`, `activeUiScope`
- Registry-Metadaten `targetAppId`, `moduleId`, `uiScope`
- DOM-Ziele mit `getAttribute("data-ui-editor-id")` und `parentElement`
- optionale Callbacks `getRegisteredElementById`, `getNextChangeRequestId`, `notify`

## Notwendige Tests im UI-Editor-kit

Im Kit sollten mindestens diese Tests existieren:

- Operation-Mapping:
  - `resizeWidth -> width`
  - `resizeHeight -> height`
  - `hide/show -> visibility`
- Operationserlaubnis:
  - `allowedOps`
  - `lockedOps`
  - `resize` als Alias fuer Breite/Hoehe
  - einzelne Sperren fuer `width`, `height`, `resizeWidth`, `resizeHeight`
- Preview-Zielmodell:
  - `self`
  - `parent`
  - `previewTarget` als Objekt mit `mode`
  - Fallback `auto`
  - Parent-Walk ueber `data-ui-editor-id`
- Pending ChangeRequests:
  - `move` kumulieren
  - `width`/`height` kumulieren
  - `hide/show` ueberschreiben
  - Summary fuer aktuelles Element
  - Reset je Ziel
  - optionaler Notify-Callback
- Guardrails:
  - keine Ziel-App-Fachbegriffe
  - keine Speicherung
  - kein `localStorage`
  - kein `sessionStorage`
  - kein IPC
  - kein `writeFile`
  - keine DB
  - keine PDF-/Drucklogik
  - keine alten Editorpfade

Die bestehenden BBM-Tests `scripts/tests/editorPreviewRuntime.test.cjs` koennen als Vorlage dienen. Fuer das Kit muessen sie mit neutralen IDs wie `sample.screen` und `sample.field.input` laufen.

## Offene Entkopplungen

Vor einer echten Codeuebertragung sind noch diese Punkte zu klaeren:

- Zielpfad und Paketstruktur im externen UI-Editor-kit festlegen.
- Zentralen Kit-Export im externen Paket spiegeln, voraussichtlich nach dem BBM-Vorbild `preview/index.js`.
- ChangeRequest-Vertrag mit dem bestehenden Kit- oder BBM-Modell abgleichen.
- `targetAppId` kommt jetzt aus dem HostContext, der Registry oder dem Runtime-State; die generische Preview-Runtime nutzt keinen BBM-Fallback mehr.
- Entscheiden, ob `data-ui-editor-id` der verbindliche Kit-DOM-Anker bleibt oder als Attributname parametrierbar wird.
- Preview-Style-Anwendung ist noch nicht in diesen Modulen enthalten; sie bleibt derzeit im BBM-Launcher.
- Panel-Rendering und Drag-Verhalten sind noch nicht entkoppelt.
- HostAdapter-Interface fuer echte Kit-Nutzung als neutrale Schnittstelle dokumentieren oder uebernehmen.
- Tests im Kit duerfen nicht von BBM-Dateipfaden, CoreShell, Restarbeiten oder Electron abhaengen.

## Risiken

- BBM und UI-Editor-kit koennen wieder auseinanderlaufen, wenn weitere generische Preview-Logik im Launcher entsteht.
- Der neutrale Fallback `targetAppId: "unknown-host"` ist nur ein technischer Sicherheitswert; produktive Hosts sollen `targetAppId` ueber HostContext oder Registry liefern.
- DOM-Naehe bleibt durch `data-ui-editor-id` bewusst vorhanden; das ist erlaubt, darf aber nicht zu automatischem DOM-Scan oder Bestandserkennung ausgebaut werden.
- Fake-DOM-Tests ersetzen keine echte Sichtpruefung fuer Panel, Auswahlrahmen und temporaere Styles.
- Eine spaetere Persistenz darf nicht versehentlich mit dieser Preview-Runtime vermischt werden.

## Empfohlener naechster Schritt

Naechstes kleines Paket:

Den vorbereiteten BBM-Export-Einstieg `src/renderer/editorRuntime/preview/index.js` in einem getrennten Paket ins externe UI-Editor-kit uebernehmen und dort mit neutralen Kit-Tests absichern.

Erst danach sollte ein eigenes Uebertragungspaket ins UI-Editor-kit folgen. Dieses Paket muss dann getrennt pruefen:

- API-Kompatibilitaet
- neutrale Kit-Tests
- keine BBM-/Restarbeiten-Begriffe
- keine Speicher-, DB-, IPC- oder PDF-Wege
- unveraendertes Verhalten in BBM nach Rueckanbindung
