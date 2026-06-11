# UI-Editor-kit Preview-Runtime Rueckfuehrung

## Kurzfazit

Status: abgeschlossen.

Die frueher ausgelagerten Preview-Runtime-Hilfen unter `src/renderer/editorRuntime/preview/` wurden fachneutral ins UI-Editor-kit ueberfuehrt und in BBM entfernt. BBM ist jetzt Konsument der Runtime, nicht mehr deren fachliche Quelle.

Nach dem externen Kit-Paket G6 liegt die generische Preview-Runtime im UI-Editor-kit technisch umgesetzt vor und ist ueber den offiziellen Package-Subpath `ui-editor-kit/runtime/preview` exportiert. Der BBM-Abgleich ist in `docs/UI_EDITOR_KIT_PREVIEW_RUNTIME_ABGLEICH.md` dokumentiert. Ergebnis: BBM und Kit sind fachlich kompatibel; seit G8 nutzt `BbmUiEditorRuntimeLauncher.js` die Kit-Preview-Runtime produktiv. Der Electron-Renderer importiert sie ueber die lokale Bridge `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`, weil nur Node den Bare-Package-Subpath direkt aufloest. Der produktive Pfad ist: Kit -> browserfaehiges `index.mjs` -> BBM-Bridge -> Launcher.

Die lokale BBM-Preview-Runtime ist nicht mehr vorhanden. Dieses Paket aendert keine HostAdapter-, Panel-, Drag-, Speicher-, DB-, IPC-, Fach- oder PDF-/Drucklogik.

## Historie

- Zunaechst wurden generische Preview-Hilfen aus dem BBM-Launcher in lokale BBM-Module ausgelagert.
- Danach wurden Zielstruktur, API-Vertrag und Guardrails fuer das UI-Editor-kit vorbereitet.
- BBM und UI-Editor-kit wurden fachlich abgeglichen; die Runtime-Vertraege sind kompatibel.
- Das UI-Editor-kit erhielt CommonJS-, ESM- und Package-Subpath-Exporte.
- BBM stellte produktiv auf die Kit-Runtime um und nutzt wegen Electron/native ESM eine lokale Renderer-Bridge.
- Die lokale BBM-Preview-Runtime wurde entfernt; neue generische Preview-Runtime-Logik gehoert ins UI-Editor-kit.

## Aktueller BBM-Stand

In BBM liegen keine generischen Preview-Hilfen mehr unter `src/renderer/editorRuntime/preview/`.

Der BBM-Launcher bleibt bewusst der Host-Orchestrator:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- DOM-Panel und Status-/Preview-Rendering
- Drag-Panel
- HostAdapter-Anbindung
- TargetSelection und Klickauswahl
- Verbindung zur BBM-Registry und zum aktiven Scope

Die manuelle Electron-Pruefung ist bestanden: Preview, granulare Auswahl, verschiebbares Panel, vorbereitete Aenderungen, Reset, Verwerfen und Deaktivieren funktionieren weiter ohne Speicherung.

## Ins Kit ueberfuehrte Kandidaten

### Preview-Operation-Auswertung

Die fruehere BBM-Operationslogik ist im Kit enthalten:

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

Das fruehere BBM-Zielmodell ist im Kit enthalten:

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

Die fruehere BBM-Logik fuer temporaere Pending-ChangeRequests ist im Kit enthalten:

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

Das Kit bietet diese fachneutralen Exports ueber `ui-editor-kit/runtime/preview` an:

```js
import {
  getElementAllowedOps,
  getPreviewTargetMode,
  upsertPreviewChangeRequest,
} from "ui-editor-kit/runtime/preview";
```

Node-Tests pruefen den offiziellen Package-Vertrag weiterhin ueber:

```js
import { getChangeRequestOperation } from "ui-editor-kit/runtime/preview";
const previewRuntime = require("ui-editor-kit/runtime/preview");
```

Der produktiv aktive Electron-Renderer-Import laeuft wegen fehlender Browser-Aufloesung fuer Bare-Package-Specifier ueber:

```js
import { getChangeRequestOperation } from "./uiEditorKitPreviewRuntimeBridge.js";
```

Die Bridge re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs`. Dieser Kit-Einstieg muss browserfaehiges natives ESM bleiben und darf im Renderer nicht auf `.cjs` zurueckfallen.

Der lokale Entwicklungs-Bezugsweg ist in `docs/UI_EDITOR_KIT_LOKALER_BEZUGSWEG.md` dokumentiert. Standard ist:

```powershell
npm install ..\UI-Editor-kit --save
```

Damit erwartet BBM in `package.json`:

```json
"ui-editor-kit": "file:../UI-Editor-kit"
```

Geprueft wird dieser Bezug mit `npm run check:ui-editor-kit`.

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

Die bestehenden BBM-Tests `scripts/tests/editorPreviewRuntime.test.cjs` laufen jetzt gegen die BBM-Bridge und damit gegen die Kit-Runtime. BBM prueft den offiziellen Kit-Subpath mit `scripts/tests/uiEditorKitPreviewRuntimeImport.test.cjs`, inklusive CommonJS, ESM und `unknown-host`-Fallback. Der produktive Renderer-Pfad ueber die Bridge wird zusaetzlich mit `scripts/tests/uiEditorKitPreviewRuntimeBridgeParity.test.cjs` abgesichert.

## Abgegrenzte Folgethemen

Die Rueckfuehrung der Preview-Runtime ist abgeschlossen. Diese Punkte sind bewusst getrennte Folgepakete:

- Spaeteren versionierten Produktiv-/Release-Bezug fuer das externe UI-Editor-kit klaeren; der lokale Entwicklungs-Bezug per `file:../UI-Editor-kit` ist dokumentiert und pruefbar.
- Lokale BBM-Preview-Runtime ist entfernt; neue generische Runtime-Logik muss ins UI-Editor-kit.
- ChangeRequest-Vertrag mit dem bestehenden Kit- oder BBM-Modell abgleichen.
- `targetAppId` kommt jetzt aus dem HostContext, der Registry oder dem Runtime-State; die generische Preview-Runtime nutzt keinen BBM-Fallback mehr.
- Entscheiden, ob `data-ui-editor-id` der verbindliche Kit-DOM-Anker bleibt oder als Attributname parametrierbar wird.
- Preview-Style-Anwendung ist noch nicht in diesen Modulen enthalten; sie bleibt derzeit im BBM-Launcher.
- Panel-Rendering und Drag-Verhalten sind noch nicht entkoppelt.
- HostAdapter-Interface fuer echte Kit-Nutzung als neutrale Schnittstelle dokumentieren oder uebernehmen.
- Tests im Kit duerfen nicht von BBM-Dateipfaden, CoreShell, Restarbeiten oder Electron abhaengen.

## Risiken

- BBM und UI-Editor-kit koennen wieder auseinanderlaufen, wenn neue generische Preview-Logik im Launcher statt im Kit entsteht.
- Der neutrale Fallback `targetAppId: "unknown-host"` ist nur ein technischer Sicherheitswert; produktive Hosts sollen `targetAppId` ueber HostContext oder Registry liefern.
- DOM-Naehe bleibt durch `data-ui-editor-id` bewusst vorhanden; das ist erlaubt, darf aber nicht zu automatischem DOM-Scan oder Bestandserkennung ausgebaut werden.
- Fake-DOM-Tests ersetzen keine echte Sichtpruefung fuer Panel, Auswahlrahmen und temporaere Styles.
- Eine spaetere Persistenz darf nicht versehentlich mit dieser Preview-Runtime vermischt werden.

## Empfohlener naechster Schritt

Naechstes kleines Paket:

Den spaeteren versionierten Produktiv-/Release-Bezug fuer das externe UI-Editor-kit klaeren. Die Preview-Runtime-Rueckfuehrung selbst ist abgeschlossen; eine Bezugsweg-Entscheidung darf keine Runtime-/Launcher-Logik nebenbei veraendern. Der lokale Entwicklungs-Bezug bleibt `npm install ..\UI-Editor-kit --save`.

Ein spaeteres Bezugsweg-Paket muss getrennt pruefen:

- API-Kompatibilitaet
- Modulformat/Importweg
- neutrale Kit-Tests
- keine BBM-/Restarbeiten-Begriffe in der Kit-Runtime
- keine Speicher-, DB-, IPC- oder PDF-Wege
- unveraendertes Verhalten in BBM nach Rueckanbindung
