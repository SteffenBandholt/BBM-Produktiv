# UI-Editor HostAdapter Contract

## Zweck

Der HostAdapter trennt BBM als Host-App von der generischen UI-Editor-Runtime.

BBM liefert Kontext, Scope, Registry und erlaubte Faehigkeiten. Die UI-Editor-Runtime erzeugt Auswahl, Preview und temporaere `pendingChangeRequests`. Seit G31 darf nur der Pilot-HostAdapter fuer `restarbeiten.ui.main` validierte Visibility-Overrides speichern.

## Verantwortungen des BBM-Hosts

BBM stellt bereit:

- `targetAppId`: eindeutige Ziel-App-Kennung, z. B. `bbm-produktiv` oder im alten Runtime-Pfad `bbm`.
- `moduleId`: Modulkennung des aktiven UI-Bereichs.
- `activeUiScope` / `scopeId`: aktiver UI-Editor-Scope.
- `getRegistry(scopeId)`: explizite Registry fuer den Scope.
- `getCurrentLayoutState(scopeId)`: aktueller Layoutzustand oder leerer Zustand, solange noch nichts gespeichert wird.
- `getCapabilities()`: erlaubte Host-Faehigkeiten.
- `onPendingChangeRequestsChanged(changeRequests)`: Rueckmeldung ueber vorbereitete ChangeRequests, nur in-memory.

BBM darf ausserdem entscheiden, welcher Scope aktiv ist und welche Modul-Registry fuer diesen Scope geliefert wird.

## Verantwortungen der UI-Editor-Runtime

Die Runtime ist zustaendig fuer:

- Auswahl und Hover auf explizit registrierten `data-ui-editor-id`-Zielen.
- Preview-Panel und temporaere Preview-Operationen.
- `move`, `width`, `height`, `hide`, `show` als vorbereitende Layout-Aenderungen.
- Reset und Verwerfen vorbereiteter Aenderungen.
- Erzeugen und Deduplizieren von `pendingChangeRequests`.
- Respektieren von `allowedOps`, `lockedOps`, `previewTargetMode`, `editGranularity` und `affectsContainer`.

Die Runtime speichert nichts, schreibt keine Fachdaten und loest keine Fachaktion aus.

`targetAppId` fuer Preview-ChangeRequests kommt aus dem HostContext bzw. HostAdapter-Kontext oder aus der expliziten Registry. Die generische Preview-Runtime enthaelt keinen hart codierten BBM-Fallback mehr. BBM darf weiterhin `targetAppId: "bbm"` liefern, aber nur als Host-Kontext.

## Pflichtmethoden

Der aktuelle Vertrag wird in `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js` geprueft.

Ein HostAdapter muss liefern:

- `getHostContext()`
- `getRegistry(scopeId)`
- `getCurrentLayoutState(scopeId)`
- `getCapabilities()`
- `onPendingChangeRequestsChanged(changeRequests)`
- `submitChangeRequests(changeRequests)`

`submitChangeRequest(changeRequest)` kann als Kompatibilitaetsmethode vorhanden bleiben, ist aber nicht die fuehrende Runtime-Schnittstelle.

## HostContext

`getHostContext()` liefert:

- `targetAppId`
- `moduleId`
- `activeUiScope`
- `scopeId`

Der Kontext enthaelt keine Fachdaten, keine Datensatz-IDs und keine Datenbankinformationen.

## Capabilities

`getCapabilities()` liefert mindestens:

- `selection`
- `preview`
- `pendingChangeRequests`
- `persistence`
- `canPersistVisibility`
- `dryRunOnly`

Standardmaessig gilt verbindlich:

- `persistence: false`
- `canPersistVisibility: false`
- `dryRunOnly: true`

Auch wenn ein Host versehentlich Persistenz als Capability uebergibt, normalisiert der Vertrag sie auf deaktiviert.

G31 oeffnet davon nur den explizit freigegebenen Restarbeiten-Pilot abweichend:

- Scope: `restarbeiten.ui.main`
- `persistence: true`
- `canPersistVisibility: true`
- `dryRunOnly: false`
- nur fuer `operation: "visibility"` mit `persistent: true`

Eine globale Freigabe fuer alle Module ist ausgeschlossen.

## ChangeRequests

Die UI-Editor-Runtime erzeugt temporaere ChangeRequests im Speicher. Sie duerfen ueber `onPendingChangeRequestsChanged(changeRequests)` an den Host zur Anzeige oder Diagnose gemeldet werden.

Diese Rueckmeldung ist keine Speicherung.

`submitChangeRequests(changeRequests)` ist derzeit bewusst blockiert und liefert:

- `ok: false`
- `blocked: true`
- `reason: "PERSISTENCE_DISABLED"`
- `persistenceDisabled: true`
- `canPersistVisibility: false`
- `dryRunOnly: true`

Fuer Hidden-Elemente gilt derselbe Dry-Run-Vertrag:

- Hide wird als `operation: "visibility"` mit `payload.visible === false` gemeldet.
- Show wird als `operation: "visibility"` mit `payload.visible === true` gemeldet.
- `onPendingChangeRequestsChanged(changeRequests)` darf diese Requests in-memory anzeigen oder diagnostizieren.
- `submitChangeRequests(changeRequests)` darf sie nicht speichern, sondern muss weiterhin blockiert bleiben.
- Wenn ein Visibility-Request uebergeben wird, meldet die Blockadeantwort `visibilityPersistenceDisabled: true`.
- Auch `persistent: true` darf in diesem Stand nicht produktiv ausgefuehrt werden.

Eine spaetere Verarbeitung von `persistent: true` darf erst nach separater Freigabe erfolgen. Der HostAdapter muss dann Scope, `elementId`, Operation und Payload gegen Registry und Freigabeliste validieren. Bis dahin bleibt der Dry-Run verbindlich.

G29 ergaenzt dafuer nur ein technisches Datenmodell unter `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js`. Dieses Modell kann Visibility-Overrides normalisieren, validieren und aus ChangeRequests ableiten, ist aber nicht an DB, IPC, Datei- oder App-Start-Logik angebunden. Solange `persistence: false`, `canPersistVisibility: false` oder `dryRunOnly: true` gilt, bleibt `isVisibilityOverridePersistable(...)` fuer aktuelle Requests `false`.

G30 nutzt dieses Modell im HostAdapter-Dry-Run: `persistent: true` Visibility-ChangeRequests werden gegen Scope, Registry-`elementId` und Boolean-`payload.visible` validiert. Gueltige Requests bleiben mit `PERSISTENCE_DISABLED` blockiert. Ungueltige Requests werden mit `INVALID_CHANGE_REQUEST` blockiert.

G31 nutzt dieselbe Validierung fuer den Pilot-Scope produktiv: Gueltige `persistent: true` Visibility-Requests fuer `restarbeiten.ui.main` werden als `overrides.visible` gespeichert und ueber `getCurrentLayoutState(...)` wieder gelesen. Ungueltige Requests, unbekannte `elementId`, andere Scopes und Nicht-Visibility-Operationen bleiben blockiert.

G32 sichert den Restore-Leseweg ab: Der Restarbeiten-HostAdapter laedt gespeicherte Pilot-Overrides ueber `loadCurrentLayoutState()` aus dem BBM-Speicher und stellt sie ueber `getCurrentLayoutState("restarbeiten.ui.main")` bereit. Die Hidden-Elements-Logik darf daraus `visible: false` als hidden ableiten; `visible: true` zaehlt nicht als hidden. Diese Absicherung erweitert keine Capabilities und gibt keine weiteren Scopes frei.

G33 nutzt den freigegebenen Pilotpfad auch fuer das Ruecksetzen gespeicherter Hidden-Overrides: Der Launcher darf fuer `restarbeiten.ui.main` und bekannte Registry-Elemente einen `persistent: true` Visibility-ChangeRequest mit `payload.visible === true` an `submitChangeRequests(...)` uebergeben, wenn der HostAdapter `persistence: true`, `canPersistVisibility: true` und `dryRunOnly: false` meldet. Andere Scopes und In-Memory-/Dry-Run-Adapter bleiben blockiert.

G34 ergaenzt eine explizite Scope-Policy: `src/renderer/editorRuntime/host/visibilityPersistenceScopePolicy.js`. `VISIBILITY_PERSISTENCE_ALLOWED_SCOPES` enthaelt aktuell nur `restarbeiten.ui.main`. Der Contract akzeptiert persistente Visibility-Requests nur, wenn der HostAdapter-Scope selbst in dieser Policy erlaubt ist; `canPersistVisibility: true` allein reicht nicht fuer eine globale Freigabe.

## Nicht erlaubt

Ausserhalb des G31-Pilotpfads darf der HostAdapter nicht:

- Datenbank schreiben
- IPC-Schreibwege oeffnen
- Dateien schreiben
- `localStorage` oder `sessionStorage` nutzen
- Fachaktionen ausloesen
- Fachdaten transportieren
- PDF-/Drucklogik ausfuehren
- alte Editor-/EditorLab-/EditorV2-Pfade aktivieren
- Restarbeiten-, Kurztext-, Editbox- oder Filterbar-Sonderlogik in die generische Runtime tragen

## Aktuelle Implementierung

- Contract: `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js`
- Restarbeiten-Adapter: `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js`
- BBM-Runtime-Launcher: `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- CoreShell-Hostanbindung: `src/renderer/app/CoreShell.js`

Der Launcher akzeptiert weiterhin die bisherigen CoreShell-Parameter `activeUiScope`, `registeredElements`, `availableUiScopes` und `registryResolver`.

Wenn kein HostAdapter uebergeben wird, baut der Launcher daraus einen In-Memory-Adapter. Dadurch bleibt das sichtbare Verhalten unveraendert, waehrend die Schnittstelle fuer die spaetere Kit-Rueckfuehrung stabiler wird.

## Vorbereitung fuer das UI-Editor-kit

Der HostAdapter macht sichtbar, welche Eingaben die generische Runtime spaeter vom Host braucht:

- HostContext
- RegistryResolver bzw. Registry
- Capabilities
- In-Memory-Rueckmeldung von `pendingChangeRequests`
- bewusst deaktivierte Persistenz

Damit kann die generische Runtime spaeter aus BBM geloest und ins UI-Editor-kit ueberfuehrt werden, ohne BBM-CoreShell, BBM-Registry, Restarbeiten-IDs oder Fachlogik mitzunehmen.

Der empfohlene spaetere Speicherort ist kein Teil des UI-Editor-kit, sondern ein eigener BBM-seitiger UI-Editor-Layout-Override-Speicher. Der HostAdapter bildet daraus beim Lesen den neutralen Layout-State fuer die Runtime.
