# UI-Editor aktiver Markierungspfad

## Kurzfazit

Der sichtbar blaue Rahmen auf registrierten `data-ui-editor-id`-Elementen wird vom bestehenden UI-Editor-Kit-Auswahlpfad erzeugt.

Der zentrale aktive Kandidat ist:

- `uiEditor/targetSelection.js`
- Funktion `createTargetSelectionController()`
- Auswahlfunktion `selectResolvedTarget()`
- Rahmenfunktion `applyTargetMarker()`

`src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` importiert diesen Kit-Controller und installiert ihn ueber `installLauncherTargetSelectionController()`. Der zuletzt bearbeitete Launcher-Statuspfad ist davon zu unterscheiden: Der blaue Rahmen kann sichtbar sein, auch wenn im DOM kein `[data-ui-editor-launcher-status="true"]` gefunden wird.

## Aktiver Markierungspfad

Der App-Einstieg fuer den UI-Editor-Launcher liegt in:

- `src/renderer/app/CoreShell.js`
  - `refreshUiEditorRuntimeLauncher()`
  - ruft `installBbmUiEditorRuntimeLauncher(...)`

Der Runtime-Launcher liegt in:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - importiert `../../../uiEditor/targetSelection.js`
  - `installLauncherTargetSelectionController(doc, host, state)`
  - ruft `createTargetSelectionController(...)`

Der Kit-Auswahlcontroller liegt in:

- `uiEditor/targetSelection.js`
  - `createTargetSelectionController(options)`
  - `install()`
  - registriert `click`, `pointermove`, `pointerleave` auf dem Root

Bei Klick auf ein registriertes Ziel:

1. `handleClick(event)`
2. `resolveRegisteredTargetFromChain(...)`
3. `selectResolvedTarget(targetElement, registryElement)`
4. `applyTargetMarker(targetElement)`
5. `notifySelectionChange()`

## Datei und Funktion fuer Klickauswahl

Datei:

- `uiEditor/targetSelection.js`

Funktionen:

- `handleClick(event)`
- `selectResolvedTarget(targetElement, registryElement)`
- `notifySelectionChange()`

`handleClick()` sucht das registrierte Ziel im Event-Pfad. Danach setzt `selectResolvedTarget()` die internen Auswahlvariablen und markiert das DOM-Ziel.

## Datei und Styles fuer blauen Rahmen

Datei:

- `uiEditor/targetSelection.js`

Funktion:

- `applyTargetMarker(targetElement)`

Inline-Styles:

```js
targetElement.setAttribute("data-ui-editor-selected", "true");
targetElement.style.outline = "2px solid #2563eb";
targetElement.style.boxShadow = "0 0 0 4px rgb(37 99 235 / 18%)";
```

Hover-Markierung ist separat:

```js
targetElement.setAttribute("data-ui-editor-hovered", "true");
targetElement.style.outline = "1px dashed #0ea5e9";
targetElement.style.boxShadow = "0 0 0 3px rgb(14 165 233 / 14%)";
```

Es gibt in `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` zusaetzlich einen aehnlichen Fallback:

- `markUiEditorTargetSelection(state, targetNode, registryElement)`

Dieser setzt ebenfalls:

```js
targetNode.style.outline = "2px solid #2563eb";
targetNode.style.boxShadow = "0 0 0 4px rgb(37 99 235 / 18%)";
```

Der dazugehoerige `installLauncherDocumentClickHandler(...)` wird im aktuellen Stand jedoch nicht aufgerufen. Daher ist dieser Fallback nicht der fuehrende aktive Pfad fuer den sichtbaren blauen Rahmen.

## State fuer ausgewaehltes Element

Im Kit-Controller `uiEditor/targetSelection.js` liegen die Auswahlvariablen lokal im Closure von `createTargetSelectionController()`:

- `selectedTargetElement`
- `selectedRegistryElement`
- `selectedElementId`
- `selectedPreviousStyle`

Die oeffentliche Momentaufnahme liefert:

- `getSelection()`
- Rueckgabe ueber `cloneSelection(...)` mit:
  - `activeScopeId`
  - `elementId`
  - `element`
  - `targetElement`
  - `hasTargetElement`
  - `message`

Der Runtime-Launcher uebernimmt diese Auswahl im Callback:

- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
- `installLauncherTargetSelectionController(...)`
- `onSelectionChange(selection)`

Dort werden gesetzt:

- `state.selectedElement = selection.element`
- `state.selectedTargetNode = selection.targetElement`
- `state.selectionMessage = selection.message || ""`

## Warum der Launcher-Statuspfad nicht der sichtbare Statuspfad ist

In der echten App wurde beobachtet:

- blauer Rahmen ist sichtbar
- `document.querySelector('[data-ui-editor-launcher-status="true"]')` liefert `null`
- Texte aus `BbmUiEditorRuntimeLauncher.js` wie `UI-EDITOR-PFAD AKTIV` erscheinen nicht im DOM

Daraus folgt:

Der sichtbare blaue Rahmen beweist nicht, dass das Launcher-Statuspanel sichtbar gerendert wird. Der Rahmen kann vom installierten Auswahlcontroller `uiEditor/targetSelection.js` kommen, waehrend das Statuspanel aus `ensureLauncherStatusHint()` nicht existiert oder nicht der im echten UI genutzte Bediencontainer ist.

Wichtig ist die Trennung:

- Markierung: `uiEditor/targetSelection.js`
- Statuspanel: `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` mit `ensureLauncherStatusHint()` / `updateLauncherStatusHint()`

Der letzte Preview-Versuch hing am Statuspanel. Dieses Statuspanel ist laut DOM-Befund nicht sichtbar aktiv.

## Empfehlung fuer Andockpunkt der Preview-Bedienung

Die Preview-Bedienung sollte nicht an einem Statuspanel haengen, das in der echten App nicht nachweisbar ist.

Sauberer Andockpunkt ist der aktive Auswahlpfad:

- Quelle der Auswahl: `createTargetSelectionController(...)`
- Auswahlereignis: `onSelectionChange(selection)`
- ausgewaehlte ID: `selection.elementId` bzw. `selection.element.id`
- ausgewaehltes DOM-Ziel: `selection.targetElement`

Fuer die sichtbare Bedienung braucht es einen Bediencontainer, der im echten UI nachweisbar existiert. Der aktuelle Befund zeigt:

- Der Markierungspfad ist aktiv.
- Der Launcher-Statuscontainer `data-ui-editor-launcher-status="true"` ist nicht aktiv sichtbar.

Naechster sauberer Schritt:

1. Den echten sichtbaren UI-Editor-Bediencontainer im DOM identifizieren.
2. Dort an `onSelectionChange(selection)` andocken.
3. Die vorhandene Preview-Logik nur von dort aus aufrufen.
4. Keine neue Markierungslogik und keine neue Registrierung bauen.
