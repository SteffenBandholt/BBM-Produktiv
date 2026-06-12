# UI-Editor Hidden-Elements Button Konzept

## Kurzfazit

Ausgeblendete UI-Editor-Elemente sind im sichtbaren Layout nicht mehr anklickbar. Sie duerfen dadurch aber nicht aus Registry, Layout-State oder spaeterem Persistenzmodell verschwinden.

Das Editorpanel soll trotzdem schlank bleiben. Deshalb wird fuer spaetere Pakete kein dauerhaft sichtbarer Elementlistenbereich vorgesehen, sondern ein kompakter Panel-Button fuer ausgeblendete Elemente.

Dieses Dokument startete als Konzept und Trennschnitt. Der spaetere Stand ist unten historisch nachgefuehrt: Button und kompaktes Popover sind vorbereitet; echte Layout-State-Hidden-Ermittlung wird seit G24 lesend beruecksichtigt. Persistenz und Schreiben bleiben weiterhin ausgeschlossen.

## Problem

Wenn ein Element per Preview/Editor ausgeblendet wird, ist es fuer normale Klickauswahl nicht mehr erreichbar. Ohne zusaetzliche Bedienmoeglichkeit koennte der Anwender das Element nicht gezielt wieder einblenden.

Gleichzeitig waere eine dauerhaft sichtbare Liste aller ausgeblendeten Elemente im Panel zu breit fuer den aktuellen Bedienansatz. Das Panel soll eine kompakte Arbeitsflaeche bleiben.

## Grundregel

Hide bedeutet nur:

```text
visible = false
```

Hide bedeutet nicht:

- Element aus der Registry entfernen
- Element aus dem Layout-State entfernen
- Element aus dem Host-Kontext entfernen
- DOM-/Fachobjekt loeschen
- Speicherung oder Fachaktion ausloesen

Ausgeblendete Elemente muessen spaeter ueber Registry/Layout-State auffindbar bleiben, auch wenn sie im sichtbaren DOM nicht mehr anklickbar sind.

## Bedienziel

Das Panel bleibt schlank:

- keine dauerhafte Hidden-Element-Liste im Panel
- keine grosse Zweitnavigation
- kein permanenter Verwaltungsbereich
- nur ein kompakter Einstieg, wenn ausgeblendete Elemente existieren

## Loesungsidee

Im Editorpanel wird spaeter ein kompakter Button vorgesehen, zum Beispiel:

```text
Ausgeblendete: 3
```

oder:

```text
Wieder einblenden...
```

Der Button zeigt nur den Zustand und oeffnet bei Bedarf eine temporaere Auswahl.

## Button-Zustaende

### Keine ausgeblendeten Elemente

Moegliche Varianten:

- Button ist deaktiviert
- Button ist nicht sichtbar

Die Entscheidung bleibt einem spaeteren UI-Paket vorbehalten. Wichtig ist nur: Es entsteht keine leere Liste und kein zusaetzlicher Bedienaufwand.

### Ein oder mehrere ausgeblendete Elemente

Der Button ist aktiv und zeigt die Anzahl:

```text
Ausgeblendete: 1
Ausgeblendete: 3
```

Die Anzahl wird aus einem neutralen Hidden-Elements-ViewModel kommen, nicht aus DOM-Scanning.

## Popover-/Dropdown-Idee

Erst beim Klick auf den kompakten Button erscheint spaeter ein kleines Popover oder Dropdown.

Beispiel:

```text
Elementname 1   [Einblenden]
Elementname 2   [Einblenden]
Elementname 3   [Einblenden]
```

Regeln:

- Liste nur temporaer anzeigen
- keine dauerhafte Panel-Verbreiterung
- pro Eintrag genau eine UI-Aktion: `Einblenden`
- keine Fachaktion ausfuehren
- kein Speichern ausloesen
- keine DB-/IPC-Aktion ausloesen

## Trennschnitt

### UI-Editor-kit

Kitfaehig sind neutrale Datenmodelle und ViewModels:

- Hidden-Elements-ViewModel
- Anzahl ausgeblendeter Elemente
- Liste neutraler Eintraege mit `id`, `label`, optional `type`/`role`
- Buttonmodell fuer den kompakten Einstieg
- Command-/Action-Beschreibung `show`
- Regeln fuer aktiv/deaktiviert

Das Kit kennt dabei keine BBM-Fachbegriffe, keine Host-App, keine Speicherung und keine DB-/IPC-Wege.

### BBM

In BBM bleiben:

- konkrete Registry-/Scope-Aufloesung
- Zugriff auf den aktuellen Launcher-State
- DOM-/Renderer-Einbindung
- Panel-Button-Platzierung im bestehenden BBM-Launcher
- spaetere Verbindung zur Preview-/ChangeRequest-Logik
- Electron-Sichtpruefung

BBM entscheidet spaeter, wann der Button im bestehenden Panel angezeigt wird und wie das Popover in den Host-DOM eingehangen wird.

## Risiken

- Das Panel darf durch Hidden-Element-Verwaltung nicht ueberladen werden.
- Ausgeblendete Elemente muessen aus Registry/Layout-State auffindbar bleiben.
- Einblenden darf keine Fachlogik beruehren.
- Einblenden darf nicht mit Speicherung verwechselt werden.
- DOM-Scanning darf nicht als Ersatz fuer Registry/Layout-State eingefuehrt werden.
- Popover-Fokus und Bedienbarkeit muessen spaeter in Electron sichtbar geprueft werden.

## Spaetere technische Reihenfolge

### G19

Neutrales Hidden-Elements-ViewModel im UI-Editor-kit vorbereiten.

Ziel:

- reine Datenstruktur
- keine DOM-Zugriffe
- keine Host-App-Integration
- keine Speicherung

### G20

BBM Importvertrag/Bridge fuer das Hidden-Elements-Modell pruefen.

Ziel:

- offizieller Kit-Importvertrag
- renderer-kompatibler Zugriff ueber Bridge, falls noetig
- keine Launcher-UI

Status:

- erledigt
- BBM prueft `ui-editor-kit/runtime/hidden-elements` per CommonJS und ESM.
- `src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js` zeigt auf `../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs`.
- Der Launcher nutzt die Bridge noch nicht produktiv.

### G21

Kompakten Button im BBM-Panel ohne Popover anzeigen.

Ziel:

- Button sichtbar oder deaktiviert nach ViewModel-Zustand
- noch keine Liste
- noch keine Einblenden-Aktion

Status:

- erledigt
- `BbmUiEditorRuntimeLauncher.js` importiert `buildHiddenElementsButtonViewModel` ausschliesslich ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
- Das Preview-Panel zeigt einen kompakten Button/Platzhalter mit `Ausgeblendete: 0`.
- Bei temporaer per Preview ausgeblendeten Elementen zaehlt der Button aus dem vorhandenen in-memory Preview-State hoch.
- Der Klick ist bewusst nur ein neutraler Platzhalter: kein Popover, keine Liste, keine Einblenden-Aktion.
- Echte Hidden-Ermittlung aus Registry/Layout-State und Persistenz bleiben spaetere Pakete.

### G22

Popover/Dropdown mit `Einblenden`-Aktion ergaenzen.

Ziel:

- temporaere Liste
- pro Element ein neutraler Show-Command
- keine Speicherung

Status:

- erledigt
- Der Button toggelt bei `Ausgeblendete: 1+` ein kleines Popover direkt im bestehenden Preview-Panel.
- Das Popover nutzt `buildHiddenElementsPopoverViewModel` ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
- Die Liste ist nur temporaer sichtbar und bleibt klein.
- Pro Eintrag gibt es eine neutrale Aktion `Einblenden`.
- `Einblenden` ist fuer temporaere Preview-Hide-Aenderungen umgesetzt und nutzt nur den vorhandenen in-memory Preview-State.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine echte Layout-State-Speicherung.

### G23

Persistenz und echte Speicherung separat klaeren.

Ziel:

- erst nach stabiler Preview-/UI-Bedienung
- kein Vermischen mit Button-/Popover-Einfuehrung
- klare Storage-/HostAdapter-Entscheidung

Status:

- erledigt als Trennschnitt, nicht als Implementierung
- Dokumentiert in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_TRENNSCHNITT.md`.
- Empfohlene Datenquelle fuer echte Hidden-Elements: Registry plus Layout-State.
- Empfohlener spaeterer Persistenzpfad: BBM-seitiger Layout-Override hinter dem HostAdapter.
- UI-Editor-kit bleibt generisch und speichert nichts selbst.
- Keine Persistenz, keine DB, kein IPC, kein localStorage und keine neue UI.

### G24 bis G28

Empfohlene Folgepakete:

- G25: Hide/Show als ChangeRequest sauber modellieren.
- G26: HostAdapter-Dry-Run fuer Hidden-Element-Aenderungen.
- G27: Persistenz erst nach Freigabe.
- G28: Wiederherstellen beim App-Start.

### G24

Hidden-Elements aus echtem Layout-State lesen, noch ohne Schreiben.

Status:

- erledigt
- Der Launcher baut die Hidden-Elements-Eingabe aus Registry, lesendem `getCurrentLayoutState(...)`, Pending-Visibility-ChangeRequests und in-memory Preview-State.
- Reihenfolge: Registry liefert bekannte Elemente und Labels, Layout-State liefert `visible`-Overrides, Pending-/Preview-State gewinnt temporaer.
- Doppelte Element-IDs werden dedupliziert.
- Layout-State-hidden Elemente koennen im Popover erscheinen; `Einblenden` bleibt fuer diese Eintraege ohne Preview-State deaktiviert, bis ein Schreibpaket existiert.
- Temporaere Preview-Hides koennen weiterhin ueber `Einblenden` aufgehoben werden.
- Keine Persistenz, keine DB, kein IPC, kein localStorage und keine HostAdapter-Schreibmethode.

## Nicht-Ziele dieses Pakets

- keine Persistenz
- keine Layout-State-Schreiblogik
- keine Speicherung
- keine DB
- kein IPC
- kein localStorage
- keine Fachlogik
- keine PDF-/Drucklogik
- keine Restarbeiten-Sonderlogik
- keine Drag-Aenderung
- keine DOM-Rendering-Aenderung
