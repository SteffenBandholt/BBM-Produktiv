# UI-Editor Hidden-Elements Persistenz-Trennschnitt

## Kurzfazit

G23 legt nur den Datenfluss und Trennschnitt fuer ausgeblendete UI-Editor-Elemente fest. Es wird keine Persistenz gebaut.

Empfehlung:

- Registry bleibt die statische Element-Landkarte und enthaelt weiterhin alle Elemente.
- Layout-State wird die spaetere konkrete Datenquelle fuer `visible = false`.
- Pending ChangeRequests beschreiben vorbereitete Hide-/Show-Aenderungen vor einer Uebernahme.
- Persistierte Layout-Overrides liegen spaeter in BBM hinter dem HostAdapter.
- Das UI-Editor-kit bleibt generisch und speichert nichts selbst.

Stand nach G24:

- BBM liest Hidden-Elements zusaetzlich aus Registry plus `getCurrentLayoutState(...)`.
- Pending-/Preview-State ueberschreibt Layout-State temporaer.
- Es wird weiterhin nichts geschrieben oder persistiert.

Stand nach G25:

- Hide/Show ist als einheitlicher Visibility-ChangeRequest abgesichert.
- Hide nutzt `operation: "visibility"` mit `payload.visible === false`.
- Show nutzt `operation: "visibility"` mit `payload.visible === true`.
- Der Request bleibt `source: "preview"` und `persistent: false`.
- Pro Preview-Ziel wird der Visibility-Request ueberschrieben, nicht dupliziert.

Stand nach G27:

- Das spaetere Persistenzmodell ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_VORBEREITUNG.md` beschrieben.
- `persistent: false` bleibt Standard fuer Preview-Requests.
- `persistent: true` wird weiterhin mit `PERSISTENCE_DISABLED` blockiert.
- Die HostAdapter-Capability `canPersistVisibility` ist vorbereitet, bleibt aber `false`.
- `submitChangeRequests(...)` meldet fuer Visibility-Requests `visibilityPersistenceDisabled: true`.
- Es gibt weiterhin keine DB-, IPC-, Datei-, localStorage- oder Layout-State-Schreiblogik.

Stand nach G28:

- Die Speicherort- und Freigabeentscheidung ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_FREIGABE.md` dokumentiert.
- Empfohlen ist ein eigener BBM-seitiger UI-Editor-Layout-Override-Speicher hinter dem HostAdapter.
- TableLayout bleibt nur technisches Vorbild und wird nicht fuer Hidden-Element-Visibility zweckentfremdet.
- Zielstruktur ist ein Datensatz pro Element-Override mit `targetAppId`, `moduleId`, `scopeId`, `elementId`, `overrides.visible`, `source`, `createdAt` und `updatedAt`.
- Erster spaeterer Pilot-Scope ist `restarbeiten.ui.main`; keine globale Freigabe.
- Persistenz bleibt deaktiviert.

Stand nach G29:

- Ein neutrales technisches Modell fuer spaetere UI-Editor-Layout-Overrides liegt unter `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js`.
- Das Modell normalisiert und validiert `targetAppId`, `moduleId`, `scopeId`, `elementId` und `overrides.visible`.
- `buildVisibilityOverrideFromChangeRequest(...)` kann einen `visibility`-ChangeRequest in einen Override-Payload uebersetzen.
- `isVisibilityOverridePersistable(...)` bleibt bei den aktuellen Capabilities `false`.
- Es gibt weiterhin keine DB-, IPC-, Datei-, localStorage-, Launcher- oder App-Start-Integration.

Stand nach G30:

- Der HostAdapter-Dry-Run validiert `persistent: true` Visibility-ChangeRequests gegen Scope, Registry-`elementId` und Boolean-`payload.visible`.
- Gueltige Requests werden in Override-Payloads uebersetzt, aber weiter mit `PERSISTENCE_DISABLED` blockiert.
- Ungueltige `visible`-Werte oder unbekannte `elementId` werden als `INVALID_CHANGE_REQUEST` blockiert.
- `canPersistVisibility` bleibt `false`; es wird weiterhin nichts geschrieben.

Stand nach G31:

- Der Pilot-Scope `restarbeiten.ui.main` hat echte Visibility-Persistenz.
- Gespeichert wird nur `overrides.visible` fuer validierte Registry-Elemente.
- Der Speicher liegt BBM-seitig hinter dem HostAdapter in `ui_editor_layout_overrides`.
- Der Restarbeiten-HostAdapter liefert gespeicherte Overrides ueber `getCurrentLayoutState(...)`.
- Andere Scopes und andere Operationen bleiben gesperrt.

Stand nach G32:

- Der Restore-Leseweg fuer den Pilot-Scope ist testseitig abgesichert.
- Nach einem neuen Adapter-/Lesezyklus liefert `getCurrentLayoutState("restarbeiten.ui.main")` gespeicherte `overrides.visible` wieder als Layout-State.
- `visible: false` wird von der Hidden-Elements-Logik als hidden erkannt; `visible: true` wird nicht als hidden gezaehlt.
- Registry, UI-Editor-kit, weitere Scopes, PDF-/Drucklogik und Fachlogik bleiben unveraendert.

Stand nach G33:

- Gespeicherte Hidden-Overrides fuer `restarbeiten.ui.main` koennen im bestehenden kompakten Popover wieder eingeblendet werden.
- Der Launcher erzeugt dafuer nur im Pilot-Scope einen validierten `persistent: true` Visibility-ChangeRequest mit `payload.visible === true`.
- Bei mehr als einem freigegebenen Eintrag erscheint kompakt `Alle einblenden`.
- Nicht freigegebene Layout-State-only Elemente bleiben nicht einblendbar; weitere Scopes bleiben gesperrt.

Stand nach G34:

- Weitere Scopes werden nur ueber eine explizite Allowlist/Policy vorbereitet.
- Aktiv erlaubt bleibt ausschliesslich `restarbeiten.ui.main`.
- Bekannte andere Scopes, unbekannte Scopes und Wildcards bleiben blockiert.
- Das Freigabeprinzip ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_SCOPE_FREIGABE.md` beschrieben.

## Aktueller Stand

Im BBM-Preview-Panel gibt es:

- einen kompakten Hidden-Elements-Button,
- ein kleines Popover,
- `Einblenden` fuer temporaere Preview-Hide-Aenderungen und seit G33 fuer gespeicherte Pilot-Overrides aus `restarbeiten.ui.main`.

Die Hidden-Elements-Datenquelle setzt sich heute zusammen aus Registry, geladenem Layout-State und laufendem in-memory Preview-State:

- `state.previewStates`
- `state.pendingChangeRequests`
- daraus abgeleitete Hidden-Elements-ViewModels aus dem UI-Editor-kit
- `getCurrentLayoutState(...)` des HostAdapters fuer geladene Layout-Overrides

Seit G24 gibt es eine lesende Registry-/Layout-State-Hidden-Ermittlung im Launcher. Seit G31 kann dieser Layout-State fuer den Pilot-Scope aus gespeicherten Visibility-Overrides kommen. Seit G32 ist dieser Restore-Leseweg testseitig abgesichert.

## Problem

Temporaeres Hide setzt im laufenden DOM aktuell nur die Preview auf unsichtbar. Nach Reset, Verwerfen, Deaktivieren oder App-Neustart ist diese Aenderung weg.

Das ist fuer Preview korrekt, aber noch kein dauerhaftes Layout-Override.

## Grundregel

Hide entfernt kein Element aus der Registry und nicht aus dem Layout-State.

Ein ausgeblendetes Element bleibt:

- registriert,
- per Element-ID adressierbar,
- Teil der Parent-/Kind-Struktur,
- spaeter ueber Hidden-Elements-Listen auffindbar.

Der fachliche Zustand lautet:

```js
{
  elementId: "example.field",
  visible: false
}
```

## Registry

Die Registry ist die statische Soll-Landkarte:

- Element existiert,
- Parent-Struktur,
- Typ/Rolle,
- erlaubte Operationen,
- Standard-Sichtbarkeit.

Die Registry soll nicht als Speicher fuer Nutzer-Overrides dienen.

Empfehlung:

- `visible` in der Registry bleibt Default-/Basiswert.
- Ausgeblendete Elemente werden nicht aus der Registry geloescht.
- Die spaetere Hidden-Liste entsteht aus Registry plus Layout-State.

## Layout-State

Der Layout-State ist die empfohlene konkrete Datenquelle fuer Hidden-Elements.

Zielstruktur sinngemaess:

```js
{
  elementId: "example.field",
  visible: false,
  source: "layout-override"
}
```

Ermittlung spaeter:

1. Registry liefert alle Elemente.
2. Layout-State liefert Overrides je `elementId`.
3. Effective-State kombiniert beides.
4. Hidden-Elements-ViewModel bekommt Elemente mit `visible: false`.

## Pending ChangeRequests

Pending ChangeRequests bleiben vorbereitete, noch nicht persistierte Aenderungen.

Rolle:

- `hide` und `show` ausdruecken,
- Ziel, Operation und Payload beschreiben,
- UI-Preview und spaetere Uebernahme vorbereiten,
- kein dauerhafter Speicher.

Empfehlung:

- Hide/Show als eigene ChangeRequest-Operationen sauber modellieren.
- Pending Requests duerfen fuer Preview und Dry-Run angezeigt werden.
- Erst nach expliziter Freigabe werden sie an Persistenz uebergeben.

## Persistierter Layout-Override

Der spaetere Speicherort soll nicht im UI-Editor-kit liegen.

Empfehlung fuer BBM:

- Persistenz hinter dem HostAdapter,
- je `targetAppId`, `moduleId`, `scopeId`, `elementId`,
- Override-Wert `visible: false` oder `visible: true`,
- keine Fachdaten im Override,
- keine Ableitung aus DOM-Reihenfolge oder CSS-Klassen.

Die genaue BBM-Speichertechnik bleibt ein separates Paket. G23 trifft keine DB-/IPC-Entscheidung.

## HostAdapter

Der HostAdapter ist die Grenze zwischen generischer Runtime und BBM.

Bestehende relevante Methoden:

- `getRegistry()`
- `getCurrentLayoutState()`
- `onPendingChangeRequestsChanged()`
- `submitChangeRequests()`
- `getCapabilities()`

Aktuell ist Persistenz im Contract deaktiviert:

- `persistence: false`
- `canPersistVisibility: false`
- `dryRunOnly: true`
- `submitChangeRequests()` blockiert mit `PERSISTENCE_DISABLED`
- Visibility-Requests werden mit `visibilityPersistenceDisabled: true` als nicht persistierbar markiert

Empfehlung:

- `getCurrentLayoutState()` spaeter als lesende Quelle fuer echte Hidden-States nutzen.
- `submitChangeRequests()` erst nach Freigabe fuer dauerhafte Uebernahme oeffnen.
- Vorher einen Dry-Run-Pfad nutzen, der ChangeRequests validiert, aber nicht speichert.

## UI-Editor-kit

Ins UI-Editor-kit gehoert:

- Hidden-Elements-ViewModel,
- Button-ViewModel,
- Popover-ViewModel,
- neutrale Aktionen wie `show`,
- reine Daten-Normalisierung.

Nicht ins UI-Editor-kit gehoert:

- BBM-Speicherung,
- DB,
- IPC,
- localStorage,
- konkrete Host-App-Entscheidungen,
- Fachlogik,
- PDF-/Drucklogik.

## BBM

In BBM bleibt:

- HostAdapter-Anbindung,
- Registry-/Scope-Auswahl,
- konkrete Layout-State-Bereitstellung,
- spaetere Persistenzentscheidung,
- Renderer-Bridge fuer Electron/native ESM,
- Sichtpruefung im echten UI.

## Risiken

- Registry darf nicht als mutable Nutzerkonfiguration missbraucht werden.
- Hidden-Elemente duerfen nicht unauffindbar werden.
- Pending ChangeRequests duerfen nicht als dauerhafter Speicher interpretiert werden.
- Persistenz darf nicht versehentlich ueber localStorage, IPC-Nebenwege oder DB-Schnellschuesse entstehen.
- Hide/Show muss mit Reset, Verwerfen und App-Neustart eindeutig zusammenspielen.

## Empfohlene Folgepakete

### G24: Hidden-Elements aus echtem Layout-State lesen

- `getCurrentLayoutState()` als lesende Quelle nutzen.
- Registry plus Layout-State zu effektivem `visible`-Status kombinieren.
- Noch kein Schreiben.

Status:

- erledigt
- Der Launcher fuehrt Registry-Elemente, Layout-State-Overrides, Pending-Visibility-ChangeRequests und Preview-State zusammen.
- Layout-State-only Hidden-Elemente koennen angezeigt werden; `Einblenden` bleibt dafuer deaktiviert, solange kein Schreibpfad existiert.
- Temporaere Preview-Hides gewinnen vor Layout-State und koennen weiter in-memory eingeblendet werden.
- Doppelte Element-IDs werden dedupliziert.

### G25: Hide/Show als ChangeRequest sauber modellieren

- Operationen und Payload fuer `visible = false/true` festlegen.
- Deduplizierung und Reset-Verhalten pruefen.
- Weiterhin ohne Persistenz.

Status:

- erledigt
- Die bestehende Kit-Preview-Runtime normalisiert `hide` und `show` auf `visibility`.
- BBM sichert den Vertrag testseitig ab: `payload.visible === false` fuer Hide, `payload.visible === true` fuer Show.
- Hide/Show fuer dasselbe Preview-Ziel ueberschreiben denselben Pending Request.
- Layout-State-only Hidden-Elemente bleiben ohne Preview-State nicht einblendbar; ein vorbereitender `visible: true`-Request dafuer folgt erst mit sicherem Dry-Run-/HostAdapter-Pfad.
- Keine Persistenz, keine DB, kein IPC, kein localStorage und keine HostAdapter-Schreibausfuehrung.

### G26: HostAdapter-Dry-Run fuer Hidden-Element-Aenderungen

- `submitChangeRequests()` oder separaten Dry-Run kontrolliert pruefen.
- Validierung ohne dauerhafte Uebernahme.

Status:

- erledigt
- Visibility-ChangeRequests fuer Hide/Show koennen dem HostAdapter ueber `onPendingChangeRequestsChanged(...)` als vorbereitete In-Memory-Aenderungen gemeldet werden.
- `submitChangeRequests(...)` bleibt bewusst blockiert und liefert weiter `PERSISTENCE_DISABLED`, `persistenceDisabled: true` und `dryRunOnly: true`.
- Der Dry-Run gibt die uebergebenen ChangeRequests nur zurueck; daraus entsteht kein Layout-State-Write und keine dauerhafte Speicherung.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik und keine HostAdapter-Schreibausfuehrung.

### G27: Persistenz erst nach Freigabe

- Speicherort und Datenmodell festlegen.
- Erst dann DB/IPC/Storage bauen.
- Separate technische und fachliche Abnahme.

Status:

- erledigt als Vorbereitung, nicht als Aktivierung.
- Das neutrale spaetere Override-Modell ist dokumentiert:
  `{ scopeId, elementId, overrides: { visible } }`.
- Das spaetere ChangeRequest-Modell ist dokumentiert:
  `operation: "visibility"`, `payload.visible`, optional spaeter `persistent: true`.
- `persistent: true` bleibt in G27 blockiert.
- `canPersistVisibility` bleibt `false`.
- `submitChangeRequests(...)` blockiert weiter mit `PERSISTENCE_DISABLED`.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine automatische Wiederherstellung und keine UI-/Launcher-Funktionsaenderung.

### G28: Wiederherstellen beim App-Start

Historische Bezeichnung ueberholt. G28 ist jetzt die Speicherort- und Persistenzfreigabeentscheidung.

Status:

- erledigt als Dokumentation, nicht als Umsetzung.
- Speicherort-Empfehlung, Ziel-Datenstruktur, Freigabegrenzen, Sicherheitsregeln und Folgepakete sind in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_FREIGABE.md` festgelegt.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine UI-Aenderung und kein Wiederherstellen beim App-Start.

### G29: Persistenzspeicher technisch vorbereiten, aber deaktiviert

Status:

- erledigt als Modell-/Validator-/Testvorbereitung.
- `editorLayoutOverrideModel.js` enthaelt nur rein datenbasierte Normalisierung, Validierung, ChangeRequest-Mapping und Persistierbarkeitspruefung.
- Die Persistierbarkeitspruefung kann nur mit spaeter explizit aktivierten Capabilities `true` liefern; im aktuellen HostAdapter-Zustand bleibt sie `false`.
- Keine produktive Schreibausfuehrung, keine DB, kein IPC, kein localStorage, kein writeFile, keine Speicherdatei, keine UI-Aenderung und kein App-Start-Wiederherstellen.

### G30: HostAdapter-Persistenz-Dry-Run mit validiertem Payload

Status:

- erledigt als validierter Dry-Run.
- `persistent: true` wird erkannt, in einen Override-Payload uebersetzt und validiert.
- Gueltige Requests bleiben mit `PERSISTENCE_DISABLED` blockiert.
- Ungueltige `visible`-Werte oder unbekannte `elementId` liefern `INVALID_CHANGE_REQUEST`.
- Keine produktive Schreibausfuehrung, keine DB, kein IPC, kein localStorage, kein writeFile, keine Speicherdatei, keine UI-Aenderung und kein App-Start-Wiederherstellen.

### G31: Pilot-Persistenz fuer einen Scope aktivieren

Status:

- erledigt.
- Nur `restarbeiten.ui.main`.
- Nur `visibility`.
- Nur validierte Registry-Elemente.
- Speicherweg: BBM-Repo `uiEditorLayoutOverridesRepo`, IPC `uiEditorLayoutOverrides:*`, Preload-Methoden, Restarbeiten-HostAdapter.
- Kein Kit-Speicher, keine Registry-Mutation, kein `localStorage`, kein `writeFile`, keine PDF-/Drucklogik.

### G32: Wiederherstellung beim App-Start fuer Pilot-Scope

Status:

- erledigt als technische Restore-Absicherung fuer den Pilot-Scope.
- `loadCurrentLayoutState()` liest persistierte Layout-Overrides aus dem BBM-Speicher.
- `getCurrentLayoutState("restarbeiten.ui.main")` stellt den geladenen Layout-State bereit.
- Die Hidden-Elements-Liste initialisiert sich daraus konsistent: `visible: false` zaehlt als hidden, `visible: true` nicht.
- Keine globale Scope-Freigabe, keine Registry-Mutation, kein UI-Editor-kit-Speicher, kein `localStorage`, kein Datei-Schreibweg und keine PDF-/Drucklogik.

### G33: UI-Pruefung und Ruecksetzfunktion

Status:

- erledigt als enger Pilot-Ruecksetzpfad im bestehenden Hidden-Elements-Popover.
- Einzelne gespeicherte Hidden-Overrides fuer `restarbeiten.ui.main` koennen per `Einblenden` auf `overrides.visible: true` gesetzt werden.
- Bei mehreren aktiv einblendbaren Pilot-Overrides erscheint `Alle einblenden`.
- Die Aktion bleibt an HostContext, Registry-Element, Capability `canPersistVisibility: true`, `dryRunOnly: false` und `submitChangeRequests(...)` gebunden.
- Keine globale Scope-Freigabe, keine Registry-Mutation, kein UI-Editor-kit-Speicher, kein `localStorage`, kein Datei-Schreibweg und keine PDF-/Drucklogik.

### G34: Freigabe weiterer Scopes vorbereiten, aber nicht aktivieren

Status:

- erledigt als Scope-Freigabe-Policy ohne weitere produktive Scope-Aktivierung.
- `VISIBILITY_PERSISTENCE_ALLOWED_SCOPES` enthaelt aktuell nur `restarbeiten.ui.main`.
- Contract, HostAdapter, Launcher-Guard und Repo-Backstop pruefen gegen diese Policy bzw. dieselbe Allowlist-Grenze.
- Weitere Scopes brauchen jeweils ein eigenes Freigabepaket mit Tests, Restore-Nachweis und Ruecksetzanforderung.

## Nicht Teil von G23

- keine Persistenz,
- keine DB,
- kein IPC,
- kein localStorage,
- keine echte Layout-State-Schreiblogik,
- keine neue UI,
- kein Popover-Umbau,
- keine Drag-Aenderung,
- keine Fachlogik,
- keine PDF-/Drucklogik.
