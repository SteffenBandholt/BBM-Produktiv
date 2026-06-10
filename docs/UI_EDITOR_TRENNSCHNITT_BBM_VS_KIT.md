# UI-Editor-Trennschnitt BBM vs. UI-Editor-kit

## 1. Kurzfazit

BBM ist aktuell die Referenzintegration und Host-App fuer den UI-Editor-Preview-Stand. Die in BBM sichtbare Preview beweist den Laufweg in einer echten Ziel-App, ist aber nicht der dauerhafte Produktort fuer generische UI-Editor-Runtime.

Die generische Runtime muss spaeter ins UI-Editor-kit zurueckgefuehrt werden. BBM behaelt danach nur HostAdapter, aktive Scope-Auswahl, App-Anbindung, Modul-Registries und konkrete DOM-Anker der jeweiligen BBM-Module.

Restarbeiten ist nur das erste Referenzmodul. IDs, Registry-Eintraege und DOM-Anker aus Restarbeiten duerfen nicht zur generischen Runtime-Regel werden.

## 2. Generische UI-Editor-Logik

Diese Teile sind fachneutral oder sollen fachneutral werden:

- Auswahlmodell: Auswahl, Hover, aktiver Zielpfad, Parent-Auswahl per Modifier und Status-Rueckmeldung sind generische Editor-Konzepte.
- Target Selection: `uiEditor/targetSelection.js` ist bereits ein installiertes UI-Editor-kit-Artefakt. Es arbeitet ueber explizite Registry-Elemente und `data-ui-editor-id`, nicht ueber automatische Bestandserkennung.
- Preview-Panel: Anzeige von aktiver Auswahl, Scope, Ziel-ID, Operationen, Guardrail-Hinweisen und vorbereiteten Aenderungen ist generisch.
- Verschiebbares Panel: Drag-/Collapse-/Hide-Verhalten des Editor-Panels ist generische Bedienoberflaeche.
- Preview-Operationen: `move`, `width`, `height`, `hide`, `show` bzw. die Runtime-Aktionen `resizeWidth` und `resizeHeight` sind generische, temporaere Layout-Preview-Operationen.
- Reset / Aenderungen verwerfen: Zuruecksetzen des aktuellen Preview-Ziels und Verwerfen aller temporaeren Preview-Aenderungen sind generische Runtime-Funktionen.
- `pendingChangeRequests`: Das Sammeln nicht persistenter ChangeRequests im Runtime-State ist generisch. Es schreibt nichts und ist noch keine Speicherung.
- ChangeRequest-Erzeugung: Erzeugt werden temporaere Requests mit `targetAppId`, `moduleId`, `scopeId`, `elementId`, `operation`, `payload`, `createdAt`, `source` und Preview-Metadaten.
- `allowedOps` / `lockedOps`: Operationen werden aus der Registry gelesen und durch Sperrlisten begrenzt. Fachaktionen bleiben ausgeschlossen.
- `previewTargetMode`: Das Preview-Ziel kann z. B. `self` oder ein Parent-Ziel sein. Die Regel ist generisch, die konkreten Werte kommen aus der Registry.
- `editGranularity`: Granularitaet wie Container, Element oder Control beschreibt generisch, wie fein ein Ziel bearbeitet wird.
- `affectsContainer`: Die Aussage, ob eine Operation den Container betrifft, ist eine generische Metainformation.
- Operation-Mapping: `resizeWidth` wird fuer ChangeRequests zu `width`, `resizeHeight` zu `height`; `hide` und `show` werden als `visibility` zusammengefuehrt.
- Generische Guardrails: keine Speicherung, kein `localStorage`, keine DB, kein IPC-Schreibweg, kein DOM-Scan, keine automatische Migration, keine Fachaktion und keine PDF-Logik.

Aktuelle Orte:

- `uiEditor/targetSelection.js`: generische Auswahl-/Panel-Controller aus dem UI-Editor-kit.
- `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`: derzeitiger BBM-Host fuer viel generische Runtime-Logik.
- `src/renderer/editorRuntime/changeRequests/`: fachneutraler ChangeRequest-Vertrag und Validator.
- `src/renderer/editorRuntime/registry/`: fachneutraler Registry-Vertrag und Validator.
- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`: Runtime- und Guardrail-Nachweise im BBM-Kontext.

## 3. BBM-spezifische Host-Integration

Diese Teile sind BBM-spezifisch und duerfen in BBM bleiben:

- CoreShell-Einstieg: `src/renderer/app/CoreShell.js` installiert den Runtime-Launcher ueber `installBbmUiEditorRuntimeLauncher(...)`.
- Aktive App-/Scope-Anbindung: `resolveActiveHostUiScope(router)` ordnet BBM-Routen bzw. aktive Sections einem UI-Editor-Scope zu.
- BBM-Registry-Resolver: `src/renderer/uiEditor/bbmUiEditorRegistry.js` liefert `targetAppId`, `availableUiScopes`, aktiven Scope und Registry-Elemente fuer BBM.
- BBM-spezifische Launcher-Installation: `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` bindet den Launcher in den BBM-Header ein und verwendet installierte Artefaktpfade.
- HostAdapter-Rahmen: BBM darf die Ziel-App-Umgebung bereitstellen: `document`, `window`, Header-Ziel, aktiver Scope, Registry-Resolver, Dev-Aktivierung und Ziel-App-Informationen.
- App-Anbindung: BBM entscheidet, welche Module und Scopes im Host sichtbar sind. Diese Entscheidung gehoert nicht ins kit.

Hier bleiben duerfen also Host-Bootstrap, aktive Scope-Auswahl, BBM-Ziel-App-Metadaten, Registry-Resolver, Routing-Anbindung, DEV-Gating und die Verbindung zwischen Shell und UI-Editor-Runtime.

## 4. Restarbeiten-spezifische Modul-Integration

Diese Teile sind Restarbeiten-spezifisch und muessen im Modul bzw. in BBM bleiben:

- Restarbeiten-UI-Elementliste: `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js` beschreibt konkrete Restarbeiten-Elemente.
- Restarbeiten-Registry: `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js` beschreibt den Restarbeiten-Main-UI-Scope.
- DOM-Anker: konkrete `data-ui-editor-id`-Attribute sitzen in Restarbeiten-Komponenten wie `RestarbeitenScreen`, `RestarbeitenFilterbar`, `RestarbeitenMainBody`, `RestarbeitenList`, `RestarbeitenEditbox` und `RestarbeitenQuicklane`.
- Modul-Operationen: `allowedOps` und `lockedOps` je Restarbeiten-Element sind fachliche Modulkonfiguration, nicht generische Runtime.
- Modul-Metadaten: `previewTargetMode`, `editGranularity` und `affectsContainer` sind generisch auswertbar, die konkrete Zuordnung gehoert aber zur Restarbeiten-Registry.
- DOM-Anker-Tests: Restarbeiten-Tests sichern, dass registrierte IDs im echten Modul-DOM vorkommen und explizit bleiben.

Restarbeiten-spezifisch bleiben insbesondere IDs wie `restarbeiten.editbox.text.short.input`, konkrete Feld-/Button-Zuordnungen, sichtbare DOM-Anker, Modulstruktur, Restarbeiten-Scope und alle fachlichen Bedeutungen der Elemente.

## 5. Kandidaten fuer Rueckfuehrung ins UI-Editor-kit

Spaeter ins UI-Editor-kit gehoeren:

- Auswahl-/Target-Selection-Controller aus `uiEditor/targetSelection.js` als bereits vorhandenes kit-Artefakt.
- Runtime-State fuer Auswahl, Preview-State und `pendingChangeRequests`.
- Registry-Normalisierung und Parent-/Target-Pfad-Aufloesung.
- Preview-Ziel-Aufloesung ueber `previewTargetMode`.
- Operationserlaubnis ueber `allowedOps` und `lockedOps`.
- Mapping `resizeWidth`/`resizeHeight` auf `width`/`height` und `hide`/`show` auf `visibility`.
- Preview-Style-Anwendung fuer Move, Width, Height und Visibility als temporaere DOM-Wirkung.
- Reset, Verwerfen und Aufraeumen beim Deaktivieren.
- Preview-Panel-Rendering inklusive Drag-Verhalten, sofern es hostneutral parametrisiert wird.
- ChangeRequest-Erzeugung fuer nicht persistente Preview-Requests.
- Fachneutrale Registry- und ChangeRequest-Vertraege aus `src/renderer/editorRuntime/registry/` und `src/renderer/editorRuntime/changeRequests/`, falls sie als kit-Vertrag weitergefuehrt werden.
- Guardrail-Tests gegen Speicherung, Scan, IPC-Schreibwege, Fachaktionen, PDF-Logik und Ziel-App-Sonderlogik.

Vor der Rueckfuehrung zu entkoppeln:

- BBM-Namen, BBM-Dateipfade und installierte Artefaktpfade.
- Header-/CoreShell-Abhaengigkeit.
- feste `targetAppId`-Annahmen wie `bbm-produktiv`.
- direkte Registry-Resolver aus BBM.
- Status-/Paneltexte, die BBM-spezifische Annahmen tragen.
- Tests mit Restarbeiten-IDs als einzige Referenz. Es braucht zusaetzliche neutrale Sample-Registries.

Vorher noetige Tests:

- kit-Test mit neutraler Sample-Registry ohne BBM- und Restarbeiten-Begriffe.
- HostAdapter-Test fuer Scope, RegistryResolver, Ziel-App-Info und Runtime-Callbacks.
- Guardrail-Test: keine Ziel-App-Fachbegriffe in generischer Runtime.
- Browser-/Electron-Wirkungstest fuer echten Rahmen, Panel, Klickauswahl und temporaere Styles.
- Vertragscheck fuer ChangeRequests und Registry-Elemente einschliesslich Operation-Aliase.

## 6. Nicht ins UI-Editor-kit uebernehmen

Nicht ins kit gehoeren:

- BBM-CoreShell und `resolveActiveHostUiScope(...)`.
- `src/renderer/uiEditor/bbmUiEditorRegistry.js` als BBM-Registry-Resolver.
- BBM-Ziel-App-Metadaten und BBM-Modulfreigaben.
- Restarbeiten-Registry und Restarbeiten-UI-Elementliste.
- Restarbeiten-spezifische IDs, Feldnamen, Buttonnamen und DOM-Anker.
- Fachlogik, Fachdaten, Datenbank, IPC-Schreibwege, Upload, Import, Export, Speichern oder Autosave.
- PDF-/Druck-/Mail-Logik.
- Electron-/BBM-spezifische Dateipfade und Header-Integration.
- alte Editorpfade oder Demo-/Altaktivierungen aus BBM.

## 7. Risiken

- BBM und UI-Editor-kit koennen auseinanderlaufen, solange generische Runtime in BBM weiterwaechst.
- Generische Logik kann schleichend BBM- oder Restarbeiten-spezifisch werden, wenn neue Preview-Faelle direkt im Launcher geloest werden.
- Fake-DOM-Tests sichern nicht alle Electron-Wirkungen ab. Sichtbare Rahmen, Panelposition und echte Klickpfade brauchen weiterhin echte Laufzeitpruefung.
- ChangeRequest-Operationen und Validator-Vertrag muessen vor einer kit-Rueckfuehrung sauber abgeglichen werden, besonders `width`, `height`, `visibility`, `resizeWidth` und `resizeHeight`.
- DOM-Anker bleiben explizit. Eine automatische Bestandserkennung oder Migration wuerde gegen den Editor-Vertrag laufen.

## 8. Empfohlener naechster Schritt

Naechstes kleines Paket:

BBM-HostAdapter-Schnittstelle stabilisieren und dokumentieren, bevor Logik ins UI-Editor-kit verschoben wird.

Der Adapter sollte nur fachneutrale Ein- und Ausgaenge beschreiben:

- Eingaben: `document`, `window`, Host-Ziel, aktiver Scope, verfuegbare Scopes, RegistryResolver, Ziel-App-Info.
- Ausgaben/Callbacks: Auswahlwechsel, Hoverwechsel, Preview-State, temporaere `pendingChangeRequests`, Runtime-Status.
- Ausdruecklich nicht enthalten: Speicherung, Datenbank, IPC-Schreibwege, Fachaktionen, PDF-Logik und automatische UI-Erkennung.

Erst danach sollte die eigentliche UI-Editor-kit-Rueckfuehrung vorbereitet werden. Speicherung bleibt weiterhin kein Teil des naechsten Pakets.
