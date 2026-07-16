# M63A – Editor-Bestand und Integrationsplan M51–M62

## 1. Aktueller M51–M62-Stand

M51–M62 stellen bereits eine getrennte Kette aus `UI-Editor-kit`-Integration, sichtbarem BBM-Statuspanel, expliziten Element-Refs und Kit-Selection-Runtime bereit. M51 definiert den Zielweg `AdapterManifest -> HostAdapter -> UI-Element-Registry -> RuntimeLauncher -> ViewModels -> LayoutStateStore` und hält BBM auf Integrationsdaten, Host-Grenzen, Auswahl und neutralen LayoutStateStore begrenzt. M52 macht den Einstieg als Statuspanel sichtbar und führt `selectedElement` über die vorhandenen IPC-Funktionen `uiEditorGetElements`, `uiEditorSelectElement` und `uiEditorGetSelectedElementDetails`. M60 macht die Kit-Selection-Runtime zum Standard; M62 entfernt die alte BBM-eigene Hover-/Selection-Runtime.

Für M63 gilt deshalb: Die Selection-Runtime und M52-Auswahl bleiben führend. Der vorhandene Inspector darf nur angebunden werden, wenn er diese Auswahl übernimmt und keine zweite Registry, keine zweite Auswahlhaltung und keinen neuen Persistenzweg eröffnet.

## 2. Vorhandener EditorRuntime-Bestand

| Baustein | Zweck | Nutzung | öffentliche Funktionen / Daten | Ein-/Ausgabe | Seiteneffekte / Persistenz | Abhängigkeiten | Tests | Wiederverwendung / Konflikte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `editorLayoutControls.js` | Erzeugt Layout-Control-Panel, baut ChangeRequests, delegiert Apply/Load/Reset. | produktiv vorbereiteter Runtime-Bestand, aktuell nicht sichtbar im M52-Panel eingebaut. | `createEditorLayoutControlPanel`, `applyEditorLayoutChange`, `loadEditorLayoutState`, `resetEditorLayoutState`, `EDITOR_LAYOUT_CONTROL_IDS`. | Eingabe: `scope`, `registry`, `hostAdapter`, `elementId`, `operation`, `payload`; Ausgabe: neutrale `ok/blocked/status`-Objekte, Controls, LayoutEntry/-State. | Ruft `hostAdapter.submitChangeRequest()` und `hostAdapter.resetLayoutState()` auf; Persistenz nur über HostAdapter/LayoutStore. | `SAFE_LAYOUT_OPERATIONS`, `getEditorElementDetails`. | `editorScopeInspector.test.cjs`. | Sehr gut wiederverwendbar; Konflikt nur, wenn Panel eigene Operationen oder Persistenz parallel baut. |
| `editorScopeInspector.js` | Öffentlicher Inspector-Facade für Module, Scopes, Registry, Baum, LayoutControls und Layoutoperationen. | produktiv vorbereiteter Bestand. | `createEditorScopeInspector`, Re-Exports `findEditorScope`, `listEditorModules`, `listEditorScopes`. Instanzmethoden: `getAvailableModules`, `getAvailableScopes`, `inspectScope`, `getLayoutControlPanel`, `applyLayoutChange`, `loadLayoutState`, `resetLayoutState`. | Eingabe: `scopeId`, optional `elementId/operation/payload`; Ausgabe: Scope-Inspection, RegistryValidation, TreeResult, LayoutState, Operationsergebnisse. | Cacht HostAdapter pro Scope in einer Map; persistiert nicht selbst. | Catalog, HostAdapterFactory, RegistryValidator, RegistryTree, LayoutControls. | `editorScopeInspector.test.cjs`. | Geeigneter öffentlicher Einstieg für M63; Konflikt: eigener Catalog (`bbm`) liegt neben M51-Ziel-App-Registry (`bbm-produktiv`) und braucht Adapterentscheidung. |
| `editorLayoutPersistence.js` | Normalisiert sichere Layoutwerte und stellt neutralen LayoutStore bereit. | produktiv vorbereiteter Bestand, aktuell MemoryStorage. | `normalizeEditorLayoutValue`, `createEditorLayoutMemoryStorage`, `createEditorLayoutStore`, `SAFE_LAYOUT_OPERATIONS`. | Operationen `move`, `resize`, `hide`, `show`, `spacing`, `width`, `height`; Payloads: numerische `x/y`, Längen `width/height/gap/padding/margin`, Sichtbarkeit. | Storage-Objekt mit `read/write/clear`; Standard ist Memory, kein `localStorage`, keine DB. | keine externen Runtime-Abhängigkeiten. | `editorScopeInspector.test.cjs`, `editorRuntime.catalog.test.cjs` indirekt. | Wiederverwendbar; M63 darf keinen zweiten LayoutStateStore neben diesem und M51-Store bauen. |
| `editorLayoutStateModel.js` | Dokumentiert Felder eines LayoutState-Eintrags. | Modellbestand. | `EDITOR_LAYOUT_STATE_FIELDS`. | Felder: `layoutProfileId`, `targetAppId`, `moduleId`, `scopeId`, `elementId`, `operation`, `layoutValue`, `createdAt`, `updatedAt`. | keine. | keine. | indirekt. | Wiederverwendbar als Vertragsanker. |
| `editorChangeRequestModel.js` | Definiert Pflichtfelder und verbotene Begriffe für ChangeRequests. | Modellbestand. | `EDITOR_CHANGE_REQUEST_REQUIRED_FIELDS`, `EDITOR_FORBIDDEN_CHANGE_REQUEST_TERMS`. | Pflicht: `changeId`, `targetAppId`, `moduleId`, `scopeId`, `elementId`, `operation`, `payload`, `createdAt`, `source`. | keine. | keine. | `editorScopeInspector.test.cjs` indirekt. | Wiederverwendbar. |
| `editorChangeRequestValidator.js` | Validiert ChangeRequests gegen Scope und Registry. | produktiv vorbereiteter Bestand. | `validateEditorChangeRequest`. | Eingabe: ChangeRequest + `{scope, registry}`; Ausgabe `{ok, errors, warnings}`. | keine. | ChangeRequestModel. | `editorScopeInspector.test.cjs`. | Zentral für M63; Konflikt, falls M63 Validierung im Panel dupliziert. |
| `bbmEditorHostAdapterContract.js` | Prüft HostAdapter-Shape. | Vertragsbestand. | `REQUIRED_HOST_ADAPTER_METHODS`, `validateHostAdapterShape`. | Eingabe Adapter; Ausgabe `{ok, errors}`. | keine. | keine. | `editorRuntime.catalog.test.cjs`. | Wiederverwendbar. |
| `bbmEditorHostAdapterFactory.js` | Wählt HostAdapter je Scope. | produktiv vorbereiteter Bestand. | `createBbmEditorHostAdapter(scopeId, options)`. | Unterstützt `protokoll.topsScreen`, `restarbeiten.ui.main`; unbekannt wirft `EDITOR_SCOPE_UNSUPPORTED`. | Erzeugt scope-spezifische Adapter mit MemoryLayoutStorage, falls nichts injiziert wird. | Protokoll-/Restarbeiten-Adapter. | `editorScopeInspector.test.cjs`. | Wiederverwendbar; M63B braucht gezielte BBM-Bridge, falls M51-Scope `bbm.main` angebunden werden soll. |
| `editorRegistryModel.js` | Elementtypen, Rollen, erlaubte Operationen. | Vertragsbestand. | `EDITOR_ELEMENT_TYPES`, `EDITOR_ELEMENT_ROLES`, `EDITOR_ALLOWED_OPERATIONS`, `is...`. | Strings für Typ/Rolle/Operation. | keine. | keine. | `editorRuntime.catalog.test.cjs`. | Wiederverwendbar; M51-Feldnamen müssen angepasst werden. |
| `editorRegistryValidator.js` | Validiert Runtime-Registry. | produktiv vorbereiteter Bestand. | `validateEditorRegistry`. | Eingabe Array von Elementen mit `id/name/type/role/parentId/order/visible/editable/allowedOps/lockedOps`; Ausgabe `{ok, errors, warnings}`. | keine. | RegistryModel. | `editorRuntime.catalog.test.cjs`, `editorScopeInspector.test.cjs`. | Führender Kandidat für M63-Vertrag; M51-Registry braucht Adapter für Feldnamen. |
| `bbmEditorCatalog.js` | Bündelt editorRuntime-Module und Scopes. | produktiv vorbereiteter Bestand. | `BBM_EDITOR_CATALOG`, `listEditorModules`, `listEditorScopes`, `findEditorScope`. | Scope enthält `scopeId`, `scopeLabel`, `kind`, `registry`, `status`. | keine. | Modulregistries. | `editorRuntime.catalog.test.cjs`. | Wiederverwendbar; darf nicht als zweite M51-Registry neben Kit-Registry erweitert werden. |
| `editorScopeTypes.js` | Scope-Kind-Vertrag. | Modellbestand. | `EDITOR_SCOPE_KINDS`, `isEditorScopeKind`. | `ui`, `pdf`. | keine. | keine. | `editorRuntime.catalog.test.cjs`. | Wiederverwendbar. |
| `BbmUiEditorStatusPanel.js` | Sichtbares M52–M62 Statuspanel mit Registry-Liste, Details und Kit-Auswahl. | produktiv sichtbarer Bestand. | Klasse `BbmUiEditorStatusPanel`, `createBbmUiEditorStatusPanel`. | Nutzt IPC: `uiEditorOpen`, `uiEditorGetElements`, `uiEditorGetSelectedElementDetails`, `uiEditorSelectElement`. | Startet/stoppt Kit-Selection-Controller; keine Layoutänderung. | `bbmKitSelectionHost`, `bbmUiElementRefs`, `ui-editor-kit/dist/selection-runtime.browser.mjs`. | `m52`, `m54`, `m59`, `m60`, `m62` Tests. | Minimal zu ändern: nur Bridge einhängen, keine Inspector-Logik direkt duplizieren. |
| `bbmKitSelectionHost.js` | Host-Bridge für Kit-Selection-Runtime. | produktiv genutzt seit M59/M60. | `createBbmKitSelectionHost`. | Eingang: Registry-Elemente, selectedElement Getter, selectElement Callback, PanelRoot; Ausgabe Kit-Host mit `listSelectableTargets`, `getSelectedElementId`, `selectElement`, `getElementMeta`, `getElementRef`. | Delegiert Auswahl an M52-Auswahl; liest explizite Refs. | `bbmUiElementRefs`. | `m59KitSelectionRuntime.test.cjs`, `m60KitRuntimeStandard.test.cjs`. | Führend für Auswahl; nicht ersetzen. |
| `bbmUiElementRefs.js` | Expliziter Ref-Store für registrierte BBM-Hauptelemente. | produktiv genutzt für Kit-Auswahl. | `registerBbmUiElementRef`, `getBbmUiElementRef`, `unregisterBbmUiElementRef`, `clearBbmUiElementRefs`, `getBbmUiElementRefStatus`. | Erlaubte IDs sind statisch, nur HTMLElement-Instanzen. | In-Memory Map; keine DOM-Suche. | keine. | `m54UiElementRefs.test.cjs` und Selection-Tests. | Weiterverwenden; keine automatische DOM-Suche ergänzen. |
| Modulregistries / HostAdapter | Scope-spezifische Registries und Adapter für `restarbeiten` und `protokoll`. | produktiv vorbereiteter Runtime-Bestand. | `getRestarbeitenMainUiRegistry`, `getProtokollTopsUiRegistry`, `create...HostAdapter`. | Runtime-Registry-Array; ChangeRequests gegen Scope/Registry. | MemoryLayoutStore je Adapter. | editorRuntime Validator/Persistence. | `editorRuntime.catalog.test.cjs`, `editorScopeInspector.test.cjs`. | Wiederverwendbar als Beispiel und ggf. später Scope-Quellen; nicht für M51-Hauptscope kopieren. |

## 3. Registry-Vergleich

### Gemeinsame Felder

M51-Ziel-App-Registry und editorRuntime-Registry beschreiben jeweils explizite Elemente mit stabiler ID, lesbarem Namen/Label, Typ, Parent-Struktur, Editierbarkeit und erlaubten Operationen/Capabilities. Beide Verträge verbieten automatische Befüllung aus DOM-Scans und lassen unbekannte Elemente nicht zu.

### Unterschiedliche Felder

- M51/Kit-Registry laut Statuspanel/Host benutzt im Renderer die Form `elementId`, `label`, `type`, `scope`, `parentId`, `capabilities` beziehungsweise `allowedChanges`.
- editorRuntime verlangt `id`, `name`, `type`, `role`, `parentId`, `order`, `visible`, `editable`, `allowedOps`, `lockedOps`.
- editorRuntime hängt Scopes am `BBM_EDITOR_CATALOG` mit `targetAppId: bbm`; M51 nutzt `targetAppId: bbm-produktiv`, `uiScope: bbm.main`, `layoutScope: bbm.main-layout`.
- TableLayoutRegistry ist tabellenspezifisch (`tableKey`, Modul, UI/PDF-Verfügbarkeit, Spalten, Defaultbreiten, `editorEnabled`) und darf nicht zur allgemeinen UI-Editor-Registry werden.

### Fehlende Felder / Adapterbedarf

Für die Übergabe eines M51-Elements an `EditorScopeInspector` fehlen in der Kit-Form mindestens `role`, `order`, `visible`, `allowedOps` und `lockedOps` in editorRuntime-Namen. Diese Werte können aus vorhandenen M51-Feldern deterministisch abgeleitet werden, sofern die BBM-Bridge keine neuen Elemente erfindet: `elementId -> id`, `label/name -> name`, `allowedChanges/capabilities.layout -> allowedOps`, fehlende `lockedOps -> []`, fehlende `visible -> true`, `order` aus Registry-Reihenfolge. `role` muss aus der Registry kommen oder als explizite, dokumentierte Bridge-Konstante pro Element ergänzt werden; er darf nicht aus DOM oder Text geraten werden.

### Führende Registry

Es darf keine zweite Registry entstehen. Führend bleibt die M51/Kit-Ziel-App-Registry für den aktiven sichtbaren BBM-Hauptscope. Die editorRuntime-RegistryValidator-Form ist ein interner Adaptervertrag für den vorhandenen Inspector. Ein kleiner Adapter genügt, wenn er ausschließlich die bestehende M51-Registry transformiert und keine zusätzlichen Elemente, Scopes oder Persistenzziele anlegt. Die bestehenden Modulregistries bleiben Bestand für ihre editorRuntime-Scopes, werden aber nicht parallel zum M51-Hauptscope aktiviert.

## 4. Auswahlvertrag

M52 hält die Auswahl als `selectedElement` im bestehenden UI-Editor-HostAdapter und liefert sie über `uiEditorGetSelectedElementDetails`. Die Kit-Host-Bridge liest genau diese Auswahl über `getSelectedElement()?.elementId` und delegiert neue Auswahl über `selectElement(elementId)`. `EditorScopeInspector` erwartet für LayoutControls keinen eigenen Auswahlzustand, sondern nur `scopeId` und `elementId`. Die ChangeRequest-Zielidentifikation nutzt ebenfalls `elementId` plus Scope-Felder.

Damit kann M63B ohne zweite Auswahlhaltung arbeiten: Das Statuspanel liest das vorhandene `selectedElement.elementId`, die Bridge übersetzt nur Registry-/Scope-Metadaten und ruft `inspector.getLayoutControlPanel(scopeId, selectedElement.elementId)` beziehungsweise später `inspector.applyLayoutChange(scopeId, { elementId, operation, payload })` auf. Eigentümer der Auswahl bleibt M52/Kit-Host; der Inspector bekommt nur einen Snapshot der ausgewählten ID.

## 5. Vorhandene Layoutoperationen

Tatsächlich vorhandene, durch `SAFE_LAYOUT_OPERATIONS` und `normalizeEditorLayoutValue` unterstützte Operationen:

| Operation | Datei / Funktion | Datenformat | zulässige Werte | Validierung | HostAdapter-Aufruf | Persistenz | bestehender Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `move` | `editorLayoutPersistence.normalizeEditorLayoutValue`; `editorLayoutControls.applyEditorLayoutChange` | Payload `{x, y}` | endliche Zahlen; mindestens ein Wert | ChangeRequestValidator + `pickNumericPayload`; verbotene Payload-Keys blockiert | `submitChangeRequest(changeRequest)` | LayoutStore speichert `{x, y}` je `elementId` | `editorScopeInspector.test.cjs` nutzt `move` für Restarbeiten und Protokoll. |
| `resize` | wie oben | Payload `{width, height}` | endliche Zahl oder String mit `px`, `rem`, `em`, `%`; mindestens ein Wert | ChangeRequestValidator + `pickLengthPayload` | `submitChangeRequest` | LayoutStore speichert Breite/Höhe | indirekt über SafeOps/Validator; kein sichtbarer Panel-Pilot. |
| `hide` | wie oben | Payload optional | keine Payloadwerte nötig | Operation muss erlaubt und nicht locked sein | `submitChangeRequest` | `{visible:false}` | indirekt über SafeOps/Validator. |
| `show` | wie oben | Payload optional | keine Payloadwerte nötig | Operation muss erlaubt und nicht locked sein | `submitChangeRequest` | `{visible:true}` | indirekt über SafeOps/Validator. |
| `spacing` | wie oben | Payload `{gap, padding, margin}` | endliche Zahl oder `px/rem/em/%`; mindestens ein Wert | ChangeRequestValidator + `pickLengthPayload` | `submitChangeRequest` | LayoutStore speichert neutrale Spacing-Werte | indirekt über SafeOps/Validator. |
| `width` | wie oben | Payload `{width}` | endliche Zahl oder `px/rem/em/%` | ChangeRequestValidator + `toNeutralLength` | `submitChangeRequest` | `{width}` | indirekt; nicht als erster Pilot bevorzugt, da Nutzerauftrag ausdrücklich nicht automatisch Breite wählen. |
| `height` | wie oben | Payload `{height}` | endliche Zahl oder `px/rem/em/%` | ChangeRequestValidator + `toNeutralLength` | `submitChangeRequest` | `{height}` | indirekt. |

Zusätzlich vorhanden sind Control-/Lifecycle-Funktionen:

- Preview: In editorRuntime nicht als separate dauerhafte Operation vorhanden. Historische UI-Inspector-M13-Preview war temporär und ist nicht Teil des M63-Zielwegs.
- Apply: `applyEditorLayoutChange` baut ChangeRequest und ruft HostAdapter auf.
- Save: Apply speichert über LayoutStore; es gibt keinen separaten `save`-Button als Fachoperation.
- Load: `loadEditorLayoutState` liest `hostAdapter.getCurrentLayoutState()` und optional einen Eintrag.
- Reset: `resetEditorLayoutState` validiert Element und ruft `hostAdapter.resetLayoutState({ elementId })` auf.

Als Pilotoperation für M63B ist `move` am besten abgesichert, weil der vorhandene Inspector-Test `move` für beide Scopes vollständig durch Apply, Load und Reset führt. `width` ist zwar vorhanden, aber nicht der am stärksten belegte End-to-End-Pfad.

## 6. Save/Load/Reset/Persistenz

Der vorhandene Persistenzpfad ist:

`EditorScopeInspector -> editorLayoutControls -> HostAdapter -> validateEditorChangeRequest -> normalizeEditorLayoutValue -> createEditorLayoutStore -> Storage(read/write)`.

Der Standard-Storage ist `createEditorLayoutMemoryStorage`; er schreibt keine DB, kein `localStorage` und keine IPCs. HostAdapter für Restarbeiten und Protokoll besitzen `getCurrentLayoutState`, `submitChangeRequest` und `resetLayoutState`. LayoutStore-Einträge enthalten `layoutProfileId`, Scope-Felder, `elementId`, `operation`, `layoutValue`, `createdAt`, `updatedAt`.

M63B darf keinen neuen Persistenzweg anlegen. Falls dauerhafte Speicherung später erforderlich ist, muss sie gezielt hinter denselben HostAdapter/LayoutStore-Vertrag gelegt werden und nicht im Statuspanel oder in einer Bridge entstehen.

## 7. Alte UI-Wege und Abgrenzung

Vorhandene Alt-/Lab-/V2-Wege:

- `EditorLab` / `EditorLab V2`: historischer eigener Weg; Tests sichern, dass alte DEV-Header-/Router-Einstiege nicht sichtbar zurückkehren.
- `Editor V2 Panel`: eigener Alt-/V2-Bestand und nicht Ziel der M63-Integration.
- `TableLayoutEditor`: tabellenspezifischer Editor mit eigener TableLayoutRegistry und IPCs; relevant nur als Abgrenzung, nicht als allgemeiner UI-Editor.
- alte DEV-Schalter/Header-Buttons: durch Tests wie `editorLabV2Access`, `restarbeitenV2DevAccess`, `projektverwaltungModule` abgesichert.
- historische UI-Inspector-M13-Preview/DOM-Marker-Wege: laut Entscheidungslog historisch; keine automatische DOM-Erkennung und kein Scan als Zielrichtung.

Diese Wege dürfen in M63B nicht parallel aktiviert und nicht als zweiter UI-Editor wiederbelebt werden.

## 8. Bewertete Integrationsvarianten

### A. `BbmUiEditorStatusPanel` importiert `EditorScopeInspector` direkt

- Aufwand: gering im ersten Schritt.
- Kopplung: hoch, weil sichtbares Panel Catalog-/HostAdapter-/Runtime-Details kennen würde.
- Risiko zweite Registry: mittel bis hoch; Panel könnte M51-Elemente und editorRuntime-Catalog nebeneinander halten.
- Risiko zweite Auswahlhaltung: mittel; Panel müsste Inspector-Auswahlstatus selbst koordinieren.
- Wiederverwendung: nutzt Inspector, aber ohne saubere Grenze.
- Testbarkeit: möglich, aber Paneltests würden Runtime-Verträge direkt mitschleppen.
- Empfehlung: nicht bevorzugen.

### B. Kleine BBM-spezifische Inspector-Bridge verbindet M52-Auswahl und vorhandenen `EditorScopeInspector`

- Aufwand: klein und kontrollierbar.
- Kopplung: niedrig bis mittel; Panel kennt nur Bridge-API.
- Risiko zweite Registry: niedrig, wenn Bridge ausschließlich M51-Registry transformiert und keine eigenen Elemente enthält.
- Risiko zweite Auswahlhaltung: niedrig, wenn Bridge `selectedElementId` nur als Parameter bekommt.
- Wiederverwendung: hoch; Inspector, LayoutControls, ChangeRequest-Validierung, HostAdapter und LayoutPersistence bleiben unverändert.
- Testbarkeit: gut; Bridge kann statisch und funktional isoliert geprüft werden.
- Empfehlung: bevorzugt.

### C. Vorhandene editorRuntime wird über bestehenden öffentlichen Einstieg verwendet

- Aufwand: mittel; `createEditorScopeInspector` existiert bereits.
- Kopplung: mittel; öffentlicher Einstieg ist sauber, aber Scope-/Registry-Unterschiede zu M51 bleiben ungelöst.
- Risiko zweite Registry: mittel; bestehender `BBM_EDITOR_CATALOG` enthält andere Scopes als M51-Hauptscope.
- Risiko zweite Auswahlhaltung: niedrig, wenn nur `elementId` übergeben wird.
- Wiederverwendung: hoch für bestehende Module, aber nicht passend für `bbm.main` ohne Adapter.
- Testbarkeit: sehr gut für vorhandene Scopes.
- Empfehlung: als Ziel der Bridge nutzen, nicht direkt aus dem Panel ohne Registry-/Scope-Adapter.

## 9. Empfohlene Architektur

Empfohlen wird Variante B.

Unverändert verwenden:

- `src/renderer/ui-editor/BbmUiEditorStatusPanel.js` als sichtbarer M52–M62 Einstieg und Auswahl-Eigentümer.
- `src/renderer/ui-editor/bbmKitSelectionHost.js` als Kit-Selection-Host.
- `src/renderer/ui-editor/bbmUiElementRefs.js` als expliziter Ref-Store.
- `src/renderer/editorRuntime/inspector/editorScopeInspector.js` als vorhandener Inspector-Facade.
- `src/renderer/editorRuntime/inspector/editorLayoutControls.js` für Apply/Load/Reset-Control-Modelle.
- `src/renderer/editorRuntime/changeRequests/editorChangeRequestValidator.js` und `editorLayoutPersistence.js` für Validierung und LayoutStore.
- vorhandene HostAdapter-Verträge.

Kleine neue Bridge-Datei für M63B:

- Vorschlag: `src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js`.
- Aufgabe: M52/M51-Statuspanel-Daten (`elements`, `selectedElement`) in den vorhandenen Inspector-Vertrag durchreichen, Scope eindeutig mappen und ein read-only ControlPanel-Modell liefern.
- Keine DOM-Suche, keine Registry-Erzeugung, keine Persistenz.

Minimal zu ändernde bestehende Datei in M63B:

- `BbmUiEditorStatusPanel.js`: nur Bridge importieren und das Bridge-Ergebnis im Detailbereich anzeigen beziehungsweise später eine einzelne Pilotoperation auslösen.

Durchgereichte Daten:

- `selectedElement.elementId` als einzige Auswahl-ID.
- bestehende M51-Registry-Elemente aus `uiEditorGetElements()`.
- aktiver UI-/Layout-Scope aus `uiEditorOpen()`/Status.
- später Operation/Payload der Pilotoperation.

Eigentümer:

- Auswahl: M52/Kit-Selection-Runtime und M51-HostAdapter.
- Layoutzustand: vorhandener HostAdapter/LayoutPersistence-Pfad, nicht das Statuspanel.
- Registry: M51-Ziel-App-Registry bleibt führend; Bridge adaptiert nur für Inspector-Form.
- HostAdapter: vorhandener M51-HostAdapter für `bbm.main` oder ein dünner Adapter auf denselben Vertrag; nicht die Modulregistries als Parallelquelle.
- Persistenz: vorhandener LayoutStateStore/HostAdapter-Pfad; keine neue Storage-Schicht.

Pilotoperation für M63B:

- `move`, weil vorhandene Tests Apply/Load/Reset damit für Restarbeiten und Protokoll abdecken. M63B sollte zunächst nur das ControlPanel-/ChangeRequest-Modell für `move` prüfen und noch keine breite Bedienoberfläche bauen.

## 10. Exakter Scope für M63B

M63B sollte nur Folgendes tun:

1. `bbmEditorRuntimeInspectorBridge.js` anlegen.
2. Bridge-Test anlegen: M52-selectedElement-ID geht ohne zweite Auswahlhaltung in `getLayoutControlPanel`.
3. `BbmUiEditorStatusPanel.js` minimal erweitern, um den vorhandenen Inspector-Status für das bereits ausgewählte Element read-only darzustellen.
4. Keine Operation sichtbar ausführen, außer wenn ein separater M63B-Unterauftrag ausdrücklich den `move`-Pilot freigibt.
5. Statische Guardrails gegen zweite Registry, zweite Auswahlhaltung, alte EditorLab-Einstiege und neue Persistenz beibehalten.

## 11. Risiken und offene Punkte

- M51-Hauptscope (`bbm.main`) und editorRuntime-Catalog-Scopes (`protokoll.topsScreen`, `restarbeiten.ui.main`) sind noch nicht deckungsgleich.
- `role` und `order` fehlen möglicherweise in der M51-Renderer-Elementform; Bridge darf diese nicht aus DOM oder Text erraten.
- Dauerhafte Persistenz ist nicht abschließend entschieden; aktuell ist der editorRuntime-Pfad Memory-basiert.
- TableLayoutEditor bleibt separat und darf nicht als allgemeiner UI-Editor missverstanden werden.
- Sichtbare Bedienbarkeit kann Codex Cloud nicht fachlich abnehmen; lokale Electron-Prüfung bleibt für spätere sichtbare Schritte nötig.

## 12. Dateiliste: verwenden / adaptieren / nicht verwenden

### Verwenden

- `src/renderer/editorRuntime/inspector/editorScopeInspector.js`
- `src/renderer/editorRuntime/inspector/editorLayoutControls.js`
- `src/renderer/editorRuntime/layout/editorLayoutPersistence.js`
- `src/renderer/editorRuntime/changeRequests/editorChangeRequestValidator.js`
- `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js`
- `src/renderer/ui-editor/bbmKitSelectionHost.js`
- `src/renderer/ui-editor/bbmUiElementRefs.js`
- M51-HostAdapter/Registry als führender sichtbarer BBM-Hauptscope

### Adaptieren

- neue Bridge `src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js`
- minimal `src/renderer/ui-editor/BbmUiEditorStatusPanel.js`
- Registry-Feldnamenadapter von M51-Form auf editorRuntime-Form

### Nicht verwenden / nicht reaktivieren

- EditorLab-/EditorLab-V2-/Editor-V2-Einstiege
- TableLayoutEditor als allgemeiner UI-Editor
- alte DEV-Header-Buttons
- historische DOM-Scan-/Bestandserkennungswege
- neue lokale Registry-, Selection- oder Persistenzobjekte im Statuspanel
