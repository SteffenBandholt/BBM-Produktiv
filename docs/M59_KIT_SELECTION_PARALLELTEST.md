# M59 – UI-Editor-kit Selection-Runtime im BBM-Paralleltest

## Zweck
M59 integriert die generische Selection-Runtime aus dem UI-Editor-kit erstmals kontrolliert in BBM. Ziel ist ein praktischer Vergleich mit der bewährten BBM-Auswahlruntime, ohne diese zu ersetzen.

## M59-Kit-Merge-Commit-Pin
Die Abhängigkeit `ui-editor-kit` ist auf diesen Commit gepinnt:

`github:SteffenBandholt/UI-Editor-kit#af1fbabd0b875a4ab382ed84c5cd986c3c7acb14`

Der erwartete Selection-Vertrag ist `selection-target-contract-v1.0`.

## Bestehende BBM-Runtime
Die M55/M56-Runtime bleibt erhalten und ist weiterhin die Voreinstellung. Sie nutzt die bestehenden expliziten BBM-Refs, den blauen Hoverrahmen und den orangefarbenen dauerhaften Auswahlrahmen.

## Neue Kit-Runtime
Die Kit-Runtime wird nur erzeugt, wenn im Statuspanel auf `UI-Editor-kit` umgeschaltet wird. Sie wird über `createSelectionController({ host, document, window, overlayOptions })` angebunden. BBM kopiert keinen Kit-Controller- oder Overlay-Code. Geladen wird der Browser-Bundle direkt aus `../../../node_modules/ui-editor-kit/dist/selection-runtime.browser.mjs`; ein dynamisches `import("ui-editor-kit")` wird im Renderer nicht verwendet.

## Runtime-Umschaltung
Das Statuspanel zeigt `Auswahl-Laufzeit` mit den Optionen:

- `BBM`
- `UI-Editor-kit`

Die Auswahl gilt nur für die aktuelle Renderer-Sitzung. Es gibt keine Speicherung in Datei, LayoutStore, localStorage, IPC oder Benutzereinstellung.

## Exklusivitätsregel
Es darf immer nur eine Runtime aktiv sein.

Beim Wechsel von BBM zu Kit stoppt BBM zuerst und der BBM-Auswahlrahmen wird deaktiviert. Erst danach wird der Kit-Controller erzeugt. Beim Wechsel von Kit zu BBM wird der Kit-Controller gestoppt, zerstört und erst danach die BBM-Runtime wieder verbunden.

## Gemeinsame Auswahlwahrheit
Beide Runtimes verwenden denselben bestehenden BBM-Auswahlstatus aus M52. Die Kit-Bridge delegiert `selectElement(elementId)` an die vorhandene Auswahlmethode des Statuspanels. Es gibt keinen zweiten fachlichen `selectedElementId`-Store.

## Host-Bridge
Die neue Datei `src/renderer/ui-editor/bbmKitSelectionHost.js` verbindet BBM mit dem neutralen Kit-Vertrag.

Verbindliche Quellen:

- `listSelectableTargets()` nutzt die vorhandene M51/M52-Elementliste des Statuspanels.
- `getElementRef(elementId)` nutzt ausschließlich den M54-Ref-Store.
- `getSelectedElementId()` liest den bestehenden M52-Auswahlstatus.
- `selectElement(elementId)` delegiert an die vorhandene M52-Auswahlmethode.
- `getElementMeta(elementId)` liest aus derselben Registry-Liste.

## InteractionRoot
`getInteractionRoot()` liefert ausschließlich die explizite M54-Referenz `bbm.main.shell`. Ist diese Referenz nicht vorhanden, wird `null` geliefert. Es gibt kein document-weites Scannen.

## Ausschluss des Statuspanels
`isExcludedTarget(eventTarget)` schließt das Statuspanel und dessen Kinder über die explizite Panel-Referenz und `contains()` aus. Es werden keine CSS-Selektoren verwendet.

## Lifecycle
Beim Schließen des Panels werden Auswahlmodus, BBM-Controller, Kit-Controller, Hoverrahmen und Auswahlrahmen bereinigt. Beim erneuten Öffnen ist die Runtime-Voreinstellung wieder `BBM`; die fachliche Auswahl kann weiter angezeigt werden, aber Controller werden neu und ohne Duplikate aufgebaut.

## Fehler und Rückfall
Wenn die Kit-Runtime nicht erzeugt werden kann, bleibt BBM bedienbar und das Statuspanel zeigt den Fehler. Die Runtime fällt auf `BBM` zurück. Bei einem Kit-Fehler während des Modus wird Kit gestoppt und zerstört; BBM wird nicht automatisch gestartet, bis der Nutzer es erneut auswählt.

## Manueller Windows-Test
1. BBM starten.
2. UI-Editor Status öffnen.
3. Standard „BBM“ kontrollieren.
4. BBM-Auswahlmodus starten und kurz prüfen.
5. Modus stoppen.
6. Laufzeit auf „UI-Editor-kit“ umstellen.
7. Kit-Auswahlmodus starten.
8. Über Seitenkopf hovern: blauer Rahmen.
9. Seitenkopf anklicken: orangefarbener Rahmen.
10. Navigation hovern: blau, Seitenkopf bleibt orange.
11. Navigation anklicken: orange wechselt.
12. Escape: blau verschwindet, orange bleibt.
13. Scrollen und Fenstergröße ändern: orange bleibt korrekt ausgerichtet.
14. Auswahl zurücksetzen: orange verschwindet.
15. Laufzeit zurück auf „BBM“ stellen.
16. BBM-Auswahlmodus erneut testen.
17. Normale Navigation prüfen.
18. Panel schließen und sicherstellen, dass kein Rahmen bleibt.

## Rückbau
Ein Rückbau von M59 besteht aus dem Entfernen der Kit-Bridge, des Runtime-Schalters und des M59-Tests. Die BBM-Runtime-Dateien aus M55/M56 bleiben davon unabhängig erhalten.

## Entscheidungskriterien für M60
Für M60 sollte entschieden werden:

- Ist die Kit-Auswahl unter Windows visuell gleichwertig zur BBM-Runtime?
- Bleiben Hover, Klick, Escape, Scroll und Resize stabil?
- Gibt es keine Listener- oder Overlay-Duplikate nach mehrfacher Umschaltung?
- Ist die Fehleranzeige für Anwender verständlich genug?
- Kann die Kit-Runtime schrittweise Standard werden, oder bleibt weiterer Paralleltest nötig?
