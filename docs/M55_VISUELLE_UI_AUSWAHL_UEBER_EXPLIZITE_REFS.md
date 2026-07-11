# M55 – Visuelle UI-Auswahl ueber explizite Refs

## Ziel und sichtbarer Bedienablauf

M55 ergaenzt im bestehenden Bildschirm **UI-Editor Status** einen kontrollierten Auswahlmodus fuer die in M54 explizit gebundenen CoreShell-Bereiche. Der Nutzer startet den Modus ueber **Auswahlmodus starten**, bewegt die Maus ueber einen BBM-Bereich, sieht genau einen ruhigen Rahmen mit Bezeichnung und `elementId` und kann diesen Bereich anklicken. Die Auswahl laeuft ueber den bestehenden M52-Auswahlweg und aktualisiert danach die Elementdetails im Statuspanel.

Escape, **Auswahlmodus beenden**, Schliessen des Statuspanels oder Panel-Destroy stoppen den Modus und entfernen Listener sowie Overlay.

## Bezug zu M53 und M54

M53 dokumentierte historische Auswahl- und Overlay-Loesungen. M54 band die aktuellen CoreShell-HTMLElement-Referenzen explizit an Registry-IDs. M55 nutzt diese M54-Referenzen als einzige Zielquelle und reaktiviert keine alte Runtime.

## Wiederverwendete historische Konzepte

Uebernommen wurde nur das sichtbare Grundprinzip eines `position: fixed`-Rahmens mit kleiner Beschriftung sowie der Lifecycle-Gedanke, dass Hover/Selection nur in einem ausdruecklich aktivierten Modus laufen.

## Ausdruecklich nicht uebernommene Legacy-Teile

Nicht uebernommen wurden DOM-Scan, Selector-Fallbacks, Trefferlisten, globale Dauer-Capture-Sperren, alte TargetSelection-Runtime, UI-Inspector-Core, EditorV2-Core, Drag/Resize, Vorschau, Speicherung und Layoutmutation.

## Controller-Aufbau

`src/renderer/ui-editor/bbmUiElementSelection.js` stellt `createBbmUiElementSelectionController(options)` bereit. Der Controller besitzt nur `start()`, `stop()`, `destroy()`, `isActive()` und `getState()`. Er verwaltet temporaere Listener, Hoverzustand und den Aufruf des bestehenden Auswahlcallbacks.

## Overlay-Aufbau

`src/renderer/ui-editor/bbmUiSelectionOverlay.js` erzeugt nur einen Overlay-Root, einen Hoverrahmen, eine Beschriftung und einen Bedienhinweis. Es sucht keine Ziele, kennt keine Registry und faengt keine Events ab.

## Zielaufloesung ueber explizite Refs

Die Zielaufloesung betrachtet ausschliesslich die aktuell registrierten M54-Refs fuer:

- `bbm.main.navigation`
- `bbm.main.header`
- `bbm.main.content`
- `bbm.main.shell`

Fuer das Eventziel wird mit `HTMLElement.contains(...)` geprueft, welche gebundene Referenz passt. Wenn Shell und ein Kindbereich passen, gewinnt die kleinere gebundene Flaeche. Es gibt keine zweite Parent-Hierarchie und keine automatische DOM-Erkennung.

## Event-Lifecycle

Beim Start werden Listener einmalig am gebundenen Shell-Element sowie temporaer an dessen Dokument/Fenster fuer Escape, Scroll und Resize installiert. Beim Stop werden alle Listener entfernt, Hoverzustand und Overlay geloescht und keine alten HTMLElement-Referenzen gehalten.

## Klickabfang nur im aktiven Modus

Nur im aktiven Auswahlmodus wird der konkrete Zielklick per `preventDefault`, `stopPropagation` und `stopImmediatePropagation` abgefangen. Dadurch wechselt zum Beispiel ein Navigationsklick waehrend der Auswahl nicht gleichzeitig die Seite. Nach Stop bleiben Klicks unangetastet.

## Panel-Ausschluss

Das Statuspanel uebergibt seinen eigenen Root explizit an den Controller. Klicks innerhalb dieses Roots werden nicht als `bbm.main.content` oder Shell-Auswahl behandelt. Es gibt keine nachtraegliche DOM-Suche nach dem Panel.

## Escape/Stop

Escape stoppt den Modus. Gleiches gilt fuer den Button **Auswahlmodus beenden**, das Schliessen des Statuspanels und `destroy()`.

## Scroll-/Resize-Verhalten

Scroll und Resize aktualisieren nur den aktuellen Hoverrahmen. Die Listener existieren ausschliesslich waehrend aktivem Auswahlmodus. Es gibt keinen permanenten `requestAnimationFrame` und keinen `MutationObserver`.

## Sicherheitsgrenzen

M55 nutzt keine DOM-Suche, keine Selector-Strings, keine `data-ui-*`-Erkennung, keine automatische Registrierung, keine zweite Registry, keine Legacy-Imports, keine Fach- oder Nutzdaten-Aenderung, keine Speicherung und keine HTMLElement-Uebertragung ueber IPC.

## Testabdeckung

`scripts/tests/m55UiElementSelection.test.cjs` prueft Controller-Lifecycle, Zielaufloesung, Panel-Ausschluss, Hover-Overlay, Scroll/Resize-Aktualisierung, Klickauswahl, Klickfreiheit nach Stop und Sicherheitsgrenzen. `scripts/test.cjs` fuehrt den M55-Test als Regression mit aus.

## Bekannte Einschraenkung `bbm.main.actions`

`bbm.main.actions` bleibt absichtlich nicht auswaehlbar, solange M54 keine eindeutige HTMLElement-Referenz bindet. Das Statuspanel nennt diese ID als nicht verfuegbar.

## Naechster Schritt

M56 sollte als kleinstmoeglicher Schritt fachlich klaeren, ob und wo ein eindeutiger Actions-Bereich in der CoreShell existieren soll, bevor `bbm.main.actions` gebunden oder fuer Auswahl/Layout freigegeben wird.
