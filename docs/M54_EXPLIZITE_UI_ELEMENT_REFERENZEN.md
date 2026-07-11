# M54 – Explizite UI-Element-Referenzen

## Ziel

M54 verbindet die aktuelle M51/M52-Registry gezielt mit den HTMLElement-Referenzen, die beim normalen Aufbau der BBM-CoreShell bereits entstehen. Der Schritt bleibt bewusst klein: Es gibt keinen Auswahlmodus, kein Overlay, keine Hover-Rahmen und keine Layoutmutation.

## Bezug auf M53-Bestandsanalyse

M53 hat gezeigt, dass historische UI-Inspector-, EditorV2- und TargetSelection-Pfade sichtbare Auswahl und Markierung kannten, aber DOM-Suche, Selector-Fallbacks, Attribute-Scanning oder parallele Legacy-Runtimes verwendeten. M54 übernimmt deshalb keine alte Runtime. Die neue Bindung nutzt ausschließlich vorhandene Variablen aus dem CoreShell-Aufbau.

## Referenzspeicher

Der neue Speicher liegt in `src/renderer/ui-editor/bbmUiElementRefs.js` und enthält nur diese Funktionen:

- `registerBbmUiElementRef(elementId, element)`
- `getBbmUiElementRef(elementId)`
- `unregisterBbmUiElementRef(elementId)`
- `clearBbmUiElementRefs()`
- `getBbmUiElementRefStatus()`

Der Speicher kennt nur `elementId -> HTMLElement`. Label, Typ, Scope, Parent, Fähigkeiten und erlaubte Operationen bleiben ausschließlich in der M51-Registry `src/ui-editor/bbm-ui-element-registry.cjs`.

## ElementId-zu-Referenz-Tabelle

| elementId | Referenz in M54 | Status | Begründung |
|---|---|---:|---|
| `bbm.main.shell` | `host` | gebunden | `host` ist der übergeordnete CoreShell-Container aus `createCoreShellLayout()`. |
| `bbm.main.navigation` | `sidebar` | gebunden | `sidebar` ist der vorhandene Navigationscontainer. |
| `bbm.main.header` | `headerEl` | gebunden | `MainHeader.render()` liefert diese konkrete Header-Referenz. |
| `bbm.main.content` | `content` / `contentRoot` | gebunden | `contentRoot` und `content` zeigen auf den vorhandenen Inhaltscontainer. |
| `bbm.main.actions` | ungebunden | bewusst ungebunden | Die Registry nennt als Parent `bbm.main.content`; im aktuellen CoreShell-Aufbau gibt es aber keinen einzelnen, fachlich eindeutigen Aktionsbereich im Content. `topBox` und `bottomBox` gehören zur Navigation/Sidebar; der Context-Control-Bereich erzeugt keinen eindeutigen bestehenden Actions-Container. |

## Gebundene Elemente

- bbm.main.shell -> host
- bbm.main.navigation -> sidebar
- bbm.main.header -> headerEl
- bbm.main.content -> content/contentRoot
- bbm.main.actions -> ungebunden

M54 bindet vier von fünf Registry-Elementen: Shell, Navigation, Header und Content. Die Bindung erfolgt unmittelbar nach `createCoreShellLayout()` in `CoreShell.js` aus vorhandenen Variablen.

## Bewusst ungebundene Elemente

`bbm.main.actions` bleibt ungebunden. M54 erzeugt keinen künstlichen Wrapper und setzt keine falsche Referenz auf `topBox`, `bottomBox`, einen Buttoncontainer oder dynamische Aktionsschaltflächen.

## Lifecycle

Vor dem CoreShell-Aufbau werden alte Referenzen per `clearBbmUiElementRefs()` entfernt. Beim erneuten Aufbau ersetzt die kontrollierte Registrierung die alten Referenzen. Zusätzlich hat `CoreShell` einen minimalen `destroy()`-Pfad, der den Referenzspeicher leert und keine veralteten HTMLElement-Referenzen hält.

## Registry-Abgrenzung

Die Registry bleibt explizit und `autoDiscovery` bleibt `false`. Der Ref-Speicher übernimmt keine Registry-Metadaten, erzeugt keine zweite fachliche Registry und lässt nur IDs zu, die in der M51-Registry bekannt sind.

## Sicherheitsgrenzen

M54 verwendet keine Selector-Strings, keine CSS-Selektoren, kein `querySelector`, kein `querySelectorAll`, kein `getElementsBy*`, kein `getElementById`, kein `closest`, keinen `MutationObserver`, kein data-ui-Scanning und keine automatische Registrierung. Es werden keine HTMLElement-Objekte über IPC übertragen.

## Ergebnis der Legacy-Runtime-Prüfung

`BbmUiEditorRuntimeLauncher.js` ist der alte installierte Launcher-/TargetSelection-Pfad. Er lädt beziehungsweise nutzt `uiEditor/uiEditorLauncherButton.js` und `uiEditor/targetSelection.js`, kann einen alten sichtbaren Launcher erzeugen und wäre damit parallel zur gültigen M51/M52-Architektur. M54 entfernt deshalb die automatische Installation aus `CoreShell.js`. Die Legacy-Dateien bleiben als Historie/Artefakte im Repository, werden aber beim CoreShell-Start nicht mehr parallel gestartet.

Die gültige Architektur bleibt:

`UI-Editor-kit v0.2.0 -> M51-Manifest -> M51-Registry -> M51-HostAdapter -> M52-Statuspanel`.

## Testabdeckung

`scripts/tests/m54UiElementRefs.test.cjs` prüft den Ref-Speicher, die CoreShell-Bindung aus vorhandenen Variablen, das bewusst ungebundene `bbm.main.actions`, die Sicherheitsgrenzen, Legacy-Isolation und die Dokumentation. M51- und M52-Regressionstests bleiben unverändert relevant.

## Einschränkungen

M54 bietet noch keine direkte Auswahl, keinen Hover-Modus, keinen Rahmen, kein Overlay, keine Layoutvorschau und keine Persistenz. Die Statusanzeige darf nur neutrale Zahlen anzeigen, zum Beispiel `4/5` und die fehlende ID `bbm.main.actions`.

## Nächster Schritt

M55 sollte als kleinster nächster Schritt fachlich entscheiden, wie ein eindeutiger Aktionsbereich entstehen oder registriert werden soll. Erst danach darf `bbm.main.actions` gebunden werden; ein Auswahlmodus oder Overlay wäre ein separates späteres Paket.
