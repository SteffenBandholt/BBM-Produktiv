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

Es erfolgt in diesem Paket keine produktive BBM-Import-Umstellung, keine Package-Abhaengigkeit und kein Link auf das externe Kit.

## BBM-Referenzstand

BBM verwendet aktuell weiter die funktionierende ESM-Runtime:

- `src/renderer/editorRuntime/preview/editorPreviewOperations.js`
- `src/renderer/editorRuntime/preview/editorPreviewTargetModel.js`
- `src/renderer/editorRuntime/preview/editorPendingChangeRequests.js`
- `src/renderer/editorRuntime/preview/index.js`

Der BBM-Launcher bleibt Host-Orchestrator:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`

Der Launcher enthaelt weiterhin die konkrete Aktivierung, Status-/Paneldarstellung, DOM-Preview-Anwendung, Reset von Styles, Drag-Panel und HostAdapter-Anbindung. Diese Teile sind nicht Bestandteil der generischen Runtime.

## Kit-Referenzstand

Das UI-Editor-kit stellt die generische Runtime aktuell als CommonJS bereit:

- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\previewOperations.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\previewTargetModel.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\pendingChangeRequests.cjs`
- `C:\01_Projekte\UI-Editor-kit\src\runtime\preview\index.cjs`

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

Die wesentliche technische Abweichung ist die Modulform:

- BBM: ESM (`export`, `import`)
- Kit: CommonJS (`module.exports`, `require`)

Das ist bewusst und aktuell kompatibel auf API-Ebene, aber noch keine direkte Import-Kompatibilitaet.

Vor einer echten Umstellung braucht BBM eine definierte Bezugsform:

- Paket- oder Workspace-Aufloesung fuer das UI-Editor-kit
- Entscheidung, ob BBM ESM aus einem Kit-Build konsumiert oder eine CommonJS-Bruecke nutzt
- Tests, die den tatsaechlich geplanten Importweg absichern

## Abweichungen

1. Modulformat:
   - BBM nutzt ESM.
   - Kit nutzt CommonJS.
   - Eine echte Umstellung braucht einen klaren Import-/Build-Vertrag.

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

- BBM und Kit koennen wieder auseinanderlaufen, solange BBM weiter die lokale Runtime nutzt.
- Eine direkte Import-Umstellung ohne Modulformat-Entscheidung koennte Build- oder Testprobleme erzeugen.
- Ein Test mit hartem externem Pfad auf `C:\01_Projekte\UI-Editor-kit` waere fuer normale BBM-Testlaeufe und CI instabil.
- Panel-/Drag-/DOM-Orchestrierung bleibt bewusst in BBM und darf nicht versehentlich als generische Runtime behandelt werden.
- Spaetere Persistenz darf nicht mit der Preview-Runtime vermischt werden.

## Notwendige Schritte vor echter Umstellung

1. Import-/Package-Vertrag festlegen:
   - lokaler Package-Link, Workspace, vendored Build oder veroeffentlichte Kit-Version.

2. Modulformat klaeren:
   - CommonJS-Bruecke in BBM,
   - ESM-Build im Kit,
   - oder neutraler Bundle-/Exportpfad.

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
- zusaetzlich ein neuer BBM-Test fuer den dann festgelegten echten Kit-Importweg

In diesem Paket wird kein neuer externer Pfadtest ergaenzt, weil ein statischer Test gegen `C:\01_Projekte\UI-Editor-kit` die normalen BBM-Testlaeufe an eine lokale Neben-Checkout-Struktur koppeln wuerde.

## Empfohlener naechster Schritt

Naechster sinnvoller Schritt ist ein eigenes Mini-Paket:

- Import-/Package-Vertrag zwischen BBM und UI-Editor-kit festlegen.
- Noch keine produktive Umstellung.
- Entscheiden, ob das Kit einen ESM-kompatiblen Export bereitstellt oder BBM eine CommonJS-Bruecke bekommt.

Erst danach sollte ein Umstellungspaket die BBM-Preview-Runtime-Imports kontrolliert auf die Kit-Runtime umbiegen.
