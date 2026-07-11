# M56 – Dauerhafter Auswahlrahmen

## Ziel

M56 erweitert den mit M55 eingefuehrten Hover- und Klick-Auswahlmodus um einen dauerhaften sichtbaren Auswahlrahmen. Nach einem Klick auf ein registriertes und gebundenes Element bleibt dieses Element orange markiert, solange das UI-Editor-Statuspanel geoeffnet ist und der bestehende Auswahlstatus ein Element enthaelt.

## Bedienablauf

1. **UI-Editor Status** oeffnen.
2. **Auswahlmodus starten**.
3. Ein gebundenes Element hovern: blauer Hoverrahmen.
4. Element anklicken: bestehender M52-Auswahlweg setzt die Auswahl.
5. Nach dem Refresh erscheint ein orangefarbener Rahmen am ausgewaehlten Element.
6. Andere Elemente koennen weiter blau gehovert werden.
7. **Auswahl zuruecksetzen** entfernt Auswahl und orangefarbenen Rahmen.
8. Schliessen oder Destroy des Statuspanels entfernt alle visuellen Rahmen.

## Unterschied Hover/Auswahl

- Hover ist blau, temporaer und nur im aktiven Auswahlmodus sichtbar.
- Auswahl ist orange, dauerhaft sichtbar und bleibt auch nach Escape oder **Auswahlmodus beenden** erhalten.
- Wenn Hover und Auswahl dasselbe Element betreffen, wird der blaue Hoverrahmen fuer dieses Ziel unterdrueckt. Der orangefarbene Auswahlrahmen hat Vorrang.
- Wenn ein anderes Element gehovert wird, koennen ein blauer Hoverrahmen und ein orangefarbener Auswahlrahmen gleichzeitig sichtbar sein.

## Bestehender Auswahlstatus als Quelle

Die visuelle Auswahl wird aus dem vorhandenen M52-Statusmodell abgeleitet. Quelle ist `this.selectedElement` im Statuspanel nach `refresh()` beziehungsweise nach dem bestehenden `uiEditorSelectElement`-Pfad. Es gibt keine neue fachliche Auswahlhaltung, keine neue IPC-Methode, keine Speicherung im LayoutStore und kein `localStorage`.

## Overlay-Lifecycle

Das neue Overlay `src/renderer/ui-editor/bbmUiSelectedOverlay.js` erzeugt ausschliesslich einen eigenen Overlay-Root mit einem orangefarbenen `position: fixed`-Rahmen und einer Beschriftung. Es veraendert das Ziel-HTMLElement nicht und nutzt nur `getBoundingClientRect()` zur Positionierung.

Der dokumentierte z-index liegt oberhalb des M55-Hoveroverlays, damit die ausgewaehlte Markierung visuell Vorrang hat.

## Verhalten bei Escape

Escape beendet nur den M55-Auswahlmodus und entfernt Hoverrahmen/Hinweis. Der bestehende Auswahlstatus bleibt unveraendert, deshalb bleibt der orangefarbene Auswahlrahmen sichtbar.

## Verhalten bei Reset

**Auswahl zuruecksetzen** verwendet weiterhin `uiEditorSelectElement({ elementId: "" })`, fuehrt danach `refresh()` aus und entfernt den orangefarbenen Auswahlrahmen.

## Verhalten beim Panel-Schliessen

Beim Schliessen oder Destroy des Statuspanels werden Auswahlmodus, Hoveroverlay, Auswahloverlay sowie Scroll-/Resize-Listener entfernt. Beim erneuten Oeffnen kann eine noch vorhandene Backend-Auswahl nach `refresh()` wieder orange angezeigt werden.

## Scroll-/Resize-Synchronisation

Solange der Auswahlrahmen sichtbar ist, installiert das Auswahloverlay genau je einen Scroll- und Resize-Listener. Diese Listener aktualisieren die Position aus `getBoundingClientRect()`. Es gibt keine dauerhafte `requestAnimationFrame`-Schleife und keinen `MutationObserver`. Beim Entfernen des Rahmens werden die Listener entfernt.

## Keine zweite Auswahlhaltung

Das Overlay haelt nur den aktuell angezeigten visuellen Bezug, der bei jeder Synchronisation aus `this.selectedElement` erneuert wird. Es ist keine zweite fachliche Auswahl-Registry und kein alternativer Auswahlstatus.

## Sicherheitsgrenzen

M56 nutzt keine DOM-Suche, keine CSS-Selektoren, keine `data-ui-*`-Zielerkennung, keine automatische UI-Erkennung, keine Legacy-Runtime, keine Layoutmutation, keine Inline-Style-Aenderung am Ziel, keine Speicherung und keine Fach- oder Nutzdatenaktion.

## Testabdeckung

`scripts/tests/m56PersistentSelectionFrame.test.cjs` prueft Auswahloverlay, Hover/Selected-Zusammenspiel, Escape/Stop/Reset/Close/Destroy, Scroll-/Resize-Lifecycle, Statuspanel-Synchronisation und Sicherheitsgrenzen. `scripts/test.cjs` fuehrt den M56-Test als Regression mit aus.

## Bekannte Einschraenkung `bbm.main.actions`

`bbm.main.actions` bleibt ohne Rahmen, solange keine eindeutige M54-HTMLElement-Referenz existiert. Es gibt keinen Fallback auf Shell und keine DOM-Suche.

## Naechster Schritt

M57 sollte als kleinster naechster Schritt die fachlich eindeutige Actions-Referenz klaeren oder bewusst weiterhin ausschliessen, bevor `bbm.main.actions` visuell oder layoutbezogen freigegeben wird.
