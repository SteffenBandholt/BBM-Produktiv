# UI-Editor-kit Preview-Runtime Abgleich

## Kurzfazit

BBM und das externe UI-Editor-kit sind fuer die generische Preview-Runtime fachlich kompatibel.

Die Kernlogik ist gleichwertig:

- gleiche zentrale Preview-Operationen
- gleiches Mapping auf ChangeRequest-Operationen
- gleiche `allowedOps`-/`lockedOps`-Regeln
- gleiche Zielaufloesung ueber `data-ui-editor-id`
- gleiche In-Memory-`pendingChangeRequests`
- gleicher neutraler Fallback `unknown-host`
- gleiche Deduplizierung, Kumulierung, Summary und zielbezogener Reset

Seit G8 nutzt der BBM-Launcher die Kit-Preview-Runtime produktiv:

- Package-Dependency: `ui-editor-kit` via `file:../UI-Editor-kit`
- offizieller Importpfad: `ui-editor-kit/runtime/preview`
- Node-Tests koennen den Package-Subpath direkt aufloesen
- der Electron-Renderer ohne Bundler/Import-Map kann Bare-Package-Specifier nicht aufloesen
- `BbmUiEditorRuntimeLauncher.js` importiert deshalb die lokale Renderer-Bridge `./uiEditorKitPreviewRuntimeBridge.js`
- die Bridge exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs`
- der produktive Pfad ist damit: UI-Editor-kit -> browserfaehiges `index.mjs` -> BBM-Bridge -> Launcher
- `index.mjs` darf fuer den Renderer nicht auf `.cjs` zurueckfallen
- CommonJS und ESM werden in BBM weiter testseitig geprueft

Die lokale BBM-Preview-Runtime bleibt erhalten und dient vorerst als Referenz/Fallback. Sie wird in diesem Paket nicht geloescht und nicht umgebaut.

## BBM-Referenzstand

BBM behaelt aktuell weiter die funktionierende lokale ESM-Runtime als Referenz/Fallback:

- `src/renderer/editorRuntime/preview/editorPreviewOperations.js`
- `src/renderer/editorRuntime/preview/editorPreviewTargetModel.js`
- `src/renderer/editorRuntime/preview/editorPendingChangeRequests.js`
- `src/renderer/editorRuntime/preview/index.js`

Der BBM-Launcher bleibt Host-Orchestrator:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`

Der Launcher importiert die generische Preview-Runtime jetzt ueber `./uiEditorKitPreviewRuntimeBridge.js` aus dem installierten UI-Editor-kit. Die Bridge zeigt auf den browserfaehigen ESM-Einstieg des Kits. Aktivierung, Status-/Paneldarstellung, DOM-Preview-Anwendung, Reset von Styles, Drag-Panel und HostAdapter-Anbindung bleiben weiterhin BBM-Orchestrierung und sind nicht Bestandteil der generischen Runtime.

## Kit-Referenzstand

Das UI-Editor-kit stellt die generische Runtime mit CommonJS-, ESM- und Package-Subpath-Vertrag bereit:

- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\previewOperations.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\previewTargetModel.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\pendingChangeRequests.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\index.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\index.mjs`

Offizieller Package-Export:

```js
import { getChangeRequestOperation } from "ui-editor-kit/runtime/preview";
const previewRuntime = require("ui-editor-kit/runtime/preview");
```

Das Kit enthaelt keine BBM-Host-App-Integration, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

## Exportvergleich

| Funktion | BBM | Kit | Bewertung |
|---|---:|---:|---|
| `getElementAllowedOps` | ja | ja | kompatibel |
| `getElementLockedOps` | ja | ja | kompatibel |
| `getChangeRequestOperation` | ja | ja | kompatibel |
| `isPreviewOperationAllowed` | ja | ja | kompatibel |
| `getNodeUiEditorId` | ja | ja | kompatibel |
| `findAncestorUiEditorElementById` | ja | ja | kompatibel |
| `normalizePreviewTargetMode` | ja | ja | kompatibel |
| `getPreviewTargetMode` | ja | ja | kompatibel |
| `resolvePreviewTargetElement` | ja | ja | kompatibel |
| `getPreviewTargetElement` | ja | ja | kompatibel |
| `getPreviewTargetElementId` | ja | ja | kompatibel |
| `UNKNOWN_PREVIEW_TARGET_APP_ID` | ja | ja | kompatibel |
| `upsertPreviewChangeRequest` | ja | ja | kompatibel |
| `removePendingChangeRequestsForTarget` | ja | ja | kompatibel |
| `getPendingChangeRequestSummary` | ja | ja | kompatibel |

Zusaetzlich im Kit:

- `UI_EDITOR_ID_ATTRIBUTE`

Das ist eine neutrale Konstante fuer `data-ui-editor-id` und kein Bruch fuer BBM.

## Datenstrukturvergleich

### RegistryElement

Kompatibel.

Beide Runtime-Staende erwarten ein neutrales Registry-Element mit mindestens:

- `id`
- `parentId`
- `allowedOps`
- `lockedOps`
- optional `previewTargetMode`
- optional `previewTarget`
- optional `editGranularity`
- optional `affectsContainer`

### Operation-Mapping

Kompatibel.

In beiden Staenden gilt:

- `resizeWidth` -> `width`
- `resizeHeight` -> `height`
- `hide` / `show` -> `visibility`
- sonst bleibt die Operation erhalten

### allowedOps / lockedOps

Kompatibel.

In beiden Staenden gilt:

- leere oder unbekannte Operationen sind nicht erlaubt
- direkt gesperrte Operationen sind nicht erlaubt
- `resizeWidth` ist erlaubt durch `width` oder `resize`
- `resizeHeight` ist erlaubt durch `height` oder `resize`
- `width` bzw. `height` kann gezielt sperren
- `resize` kann den Fallback sperren
- eine explizite Einzel-Erlaubnis wie `width` kann trotz `lockedOps: ["resize"]` weiter fuer `resizeWidth` gelten

### previewTargetMode

Kompatibel mit einer kleinen Erweiterung im Kit.

Beide Staende normalisieren:

- `self`, `element`, `selected` -> `self`
- `parent`, `container`, `layoutcontainer`, `layout-container` -> `parent`
- unbekannt -> `auto`

Das Kit akzeptiert zusaetzlich boolean `true` als `parent`. BBM nutzt diesen Fall aktuell nicht. Das ist eine rueckwaerts kompatible Erweiterung, keine Umstellungsvoraussetzung.

### Target-Aufloesung

Kompatibel.

Beide Staende nutzen:

- `targetNode`
- optional `selectionElement`
- optional `selectedId`
- optional `getRegisteredElementById`
- `data-ui-editor-id`
- `parentElement`

Bei `parent` wird der registrierte Parent ueber `data-ui-editor-id` gesucht. Wenn kein Parent-Ziel gefunden wird, bleibt das aktuelle Ziel erhalten.

### pendingChangeRequests

Kompatibel.

Beide Staende erzeugen/aktualisieren temporaere Requests mit:

- `changeId`
- `targetAppId`
- `moduleId`
- `scopeId`
- `elementId`
- `targetElementId`
- `operation`
- `payload`
- `createdAt`
- `updatedAt`
- `source: "preview"`
- `persistent: false`
- `previewTargetMode`

### targetAppId

Kompatibel.

In beiden Staenden gilt die Reihenfolge:

1. `hostContext.targetAppId`
2. `registry.targetAppId`
3. `state.targetAppId`
4. `unknown-host`

Es gibt keinen harten BBM-Fallback in der generischen Runtime. BBM darf `targetAppId: "bbm"` nur ueber den BBM-HostContext liefern.

### Deduplizierung und Kumulierung

Kompatibel.

In beiden Staenden wird je `targetElementId` und normalisierter Operation dedupliziert:

- `move` kumuliert `dx` und `dy`
- `width` kumuliert `delta`
- `height` kumuliert `delta`
- `visibility` ueberschreibt auf Basis des letzten `hide`/`show`

### Summary

Kompatibel.

Beide Staende liefern:

- `total`: Gesamtzahl der vorbereiteten Requests
- `operations`: eindeutige Operationen fuer `elementId` oder `targetElementId`

### Reset je Ziel

Kompatibel.

Beide Staende entfernen nur Requests fuer das aktuelle `targetElementId` und rufen optional `notify(state)` auf.

## Modulform und Import-Abweichung

Die fruehere technische Abweichung der Modulform ist fuer den Testverbrauch geloest:

- BBM: ESM (`export`, `import`)
- Kit: CommonJS (`module.exports`, `require`) plus ESM-kompatibler Einstieg (`index.mjs`)
- Package-Subpath: `ui-editor-kit/runtime/preview`

Der Subpath ist in BBM ueber die lokale `file:../UI-Editor-kit`-Dependency fuer Node-Tests aufloesbar. Der Electron-Renderer nutzt produktiv eine kleine lokale Bridge mit relativem Pfad auf die installierte Kit-Runtime, weil Bare-Package-Imports im Browser-ESM-Kontext sonst zu einem weissen Screen fuehren. Der Kit-Einstieg `index.mjs` muss dabei browserfaehiges natives ESM bleiben und darf keine `.cjs`-Dateien nachladen.

Weiter offen bleibt die kontrollierte produktive Bezugsform:

- Entscheidung, ob die lokale File-Dependency fuer Entwicklung reicht oder spaeter ein versionierter Bezug genutzt wird
- klare Rueckfallstrategie fuer die lokale BBM-Referenzruntime

## Abweichungen

1. Modulformat:
   - BBM nutzt ESM.
   - Kit bietet CommonJS und ESM-kompatiblen Subpath.
   - Der Importvertrag wird in Node testbar genutzt; der produktive Renderer-Launcher nutzt eine relative Bridge auf dieselbe Kit-Runtime.

2. Zusatzexport im Kit:
   - `UI_EDITOR_ID_ATTRIBUTE`
   - neutral und unkritisch.

3. Boolean-Behandlung bei `normalizePreviewTargetMode`:
   - Kit behandelt `true` als `parent`.
   - BBM behandelt boolean aktuell als leer.
   - BBM nutzt diesen Fall nicht; kein Funktionsbruch.

4. Interne Struktur:
   - Kit hat kleine Hilfsfunktionen wie `createBasePreviewChangeRequest` und `mergePreviewPayload`.
   - Diese sind nicht oeffentlich und aendern die API nicht.

## Risiken

- BBM und Kit koennen wieder auseinanderlaufen, wenn neue generische Preview-Logik wieder in BBM statt im Kit entsteht.
- Die lokale `file:../UI-Editor-kit`-Dependency setzt einen Nachbar-Checkout voraus und ist vor einer breiteren CI-/Produktivnutzung als Bezugsweg zu bewerten.
- Panel-/Drag-/DOM-Orchestrierung bleibt bewusst in BBM und darf nicht versehentlich als generische Runtime behandelt werden.
- Spaetere Persistenz darf nicht mit der Preview-Runtime vermischt werden.

## Notwendige Schritte nach der Import-Umstellung

1. Produktiven Bezugsweg festlegen:
   - lokale File-Dependency fuer Entwicklung,
   - Workspace,
   - vendored Build,
   - oder veroeffentlichte/versionierte Kit-Quelle.

2. Lokale Runtime-Fallbackstrategie festlegen:
   - Lokale BBM-Preview-Runtime zunaechst als Referenz/Fallback behalten.
   - Spaetere Entfernung nur in einem eigenen Paket.

3. Testvertrag ergaenzen:
   - BBM muss den spaeteren echten Importweg testen.
   - Kit muss weiter `preview-runtime.test.cjs` und Guardrails ausfuehren.

4. Migration klein schneiden:
   - erst Importkante auf eine einzelne Runtime-Fassade umstellen,
   - dann BBM-Referenzmodule entfernen oder als Kompatibilitaetsschicht behalten,
   - erst danach weitere Aufraeumarbeiten.

5. Sichtpruefung im Electron-DEV-Kontext:
   - Preview anwenden,
   - Reset je Ziel,
   - Aenderungen verwerfen,
   - Panel/Drag unveraendert.

## Tests vor echter Umstellung

Vor einer echten Umstellung muessen mindestens gruen sein:

- BBM: `scripts/tests/editorPreviewRuntime.test.cjs`
- BBM: `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- BBM: `npm test`
- Kit: `scripts/tests/preview-runtime.test.cjs`
- Kit: `scripts/tests/preview-runtime-guardrail.test.cjs`
- Kit: `npm test`
- BBM: `scripts/tests/uiEditorKitPreviewRuntimeImport.test.cjs`
- BBM: `scripts/tests/uiEditorKitPreviewRuntimeBridgeParity.test.cjs`

## Empfohlener naechster Schritt

Naechster sinnvoller Schritt ist ein eigenes Mini-Paket:

- produktiven Bezugsweg fuer das UI-Editor-kit klaeren,
- lokale BBM-Preview-Runtime als Referenz/Fallback bewerten,
- spaetere Entfernung oder Fallback-Fassade nur getrennt planen.
