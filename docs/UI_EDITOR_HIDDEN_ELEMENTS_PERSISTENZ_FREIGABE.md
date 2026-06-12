# UI-Editor Hidden-Elements Persistenz-Freigabe

## Kurzfazit

G28 legte Speicherort-Empfehlung, Zielstruktur, Freigabegrenzen und Umsetzungsreihenfolge fuer persistente Hidden-Element-Overrides fest.

Stand nach G34: Die Persistenz ist nur fuer den Pilot-Scope `restarbeiten.ui.main` aktiv. Der Restore-Leseweg, der kompakte Ruecksetzpfad und die Scope-Allowlist/Policy sind testseitig abgesichert.

Weiterhin deaktiviert bleiben:

- kein `localStorage`
- kein `writeFile`
- keine Speicherdatei
- keine globale Aktivierung von `canPersistVisibility: true`
- keine Persistenz fuer andere Scopes
- keine Persistenz fuer Move, Resize, Text, Fachfelder oder sonstige Operationen
- kein automatisches Wiederherstellen beim App-Start ausserhalb des freigegebenen Pilot-Layout-State-Lesewegs

## Ausgangspunkt

Aktuell werden Hidden Elements aus diesen Quellen gelesen:

1. Registry als statische Element-Landkarte.
2. lesender Layout-State ueber `getCurrentLayoutState(...)`.
3. Pending-/Preview-State im laufenden Editor.

Hide/Show ist als ChangeRequest modelliert:

```js
{
  operation: "visibility",
  payload: {
    visible: false
  },
  source: "preview",
  persistent: false
}
```

Seit G31 speichert der Restarbeiten-HostAdapter fuer `restarbeiten.ui.main` validierte `persistent: true` Visibility-ChangeRequests. Andere Scopes und andere Operationen bleiben blockiert.

Seit G33 nutzt der bestehende Hidden-Elements-Popover diesen freigegebenen Pilotpfad auch zum Einblenden gespeicherter Hidden-Overrides. Dabei wird `payload.visible === true` gespeichert; weitere Scopes bleiben deaktiviert.

Seit G34 ist die Freigabe weiterer Scopes als explizite Allowlist/Policy dokumentiert und technisch abgesichert. Aktuell enthaelt die Policy nur `restarbeiten.ui.main`; weitere Scopes brauchen eigene Freigabepakete.

## Speicherort-Optionen

### Option 1: vorhandene TableLayout-/Layout-Override-Struktur erweitern

Bewertung:

- Vorteil: Es gibt bereits ein etabliertes DB-Schema, Repo, IPC und Validierung fuer Layout-Overrides.
- Vorteil: `scope_type`, `scope_id`, `layout_json`, `created_at` und `updated_at` zeigen ein bewaehrtes Muster fuer gespeicherte Layoutwerte.
- Nachteil: Der vorhandene Weg ist tabellen- und orientierungsbezogen (`table_key`, `orientation`, Spalten-/RootVars-Validierung).
- Nachteil: Hidden-Element-Visibility ist kein Tabellenlayout und darf nicht mit Tabellenkalibrierung, PDF-Orientierung oder Spaltenvalidierung vermischt werden.

Entscheidung:

- Nicht direkt verwenden.
- Nur als technisches Vorbild fuer ein spaeteres eigenes UI-Editor-Override-Repo nutzen.

### Option 2: eigener UI-Editor-Layout-Override-Speicher

Bewertung:

- Vorteil: Klare Trennung von Tabellenlayout, PDF/Druck und UI-Editor-Visibility.
- Vorteil: Neutraler Speicher kann `targetAppId`, `moduleId`, `scopeId`, `elementId`, `overrides`, `source`, `createdAt`, `updatedAt` abbilden.
- Vorteil: Validierung kann direkt gegen HostAdapter-Scope und Registry laufen.
- Vorteil: Spaeteres Lesen ueber `getCurrentLayoutState(...)` passt sauber zum bestehenden HostAdapter-Vertrag.
- Nachteil: Erfordert spaeter ein eigenes Repo, Schema und optionalen IPC-Pfad.

Entscheidung:

- Empfohlen.
- Umsetzung bleibt in G28 ausdruecklich ausgeschlossen.

### Option 3: HostAdapter-spezifischer Layout-State

Bewertung:

- Vorteil: Der HostAdapter bleibt die Grenze zwischen generischem Editor und BBM-Speicherung.
- Vorteil: Jeder Scope kann eigene Freigaberegeln und Validierung behalten.
- Vorteil: Die Runtime muss den konkreten Speicherort nicht kennen.
- Nachteil: Ohne eigenes Speicher-Repo waere dies nur ein Adapter-Vertrag, kein dauerhafter Speicher.

Entscheidung:

- Als Zugriffsschicht empfohlen.
- Der HostAdapter soll spaeter aus dem BBM-seitigen UI-Editor-Override-Speicher lesen und daraus `getCurrentLayoutState(...)` liefern.

### Option 4: Registry veraendern

Bewertung:

- Nicht empfohlen.
- Die Registry ist die statische Landkarte und Erlaubnisliste.
- Nutzer-Overrides duerfen die Registry nicht mutieren.
- Ausgeblendete Elemente muessen registriert, auffindbar und wiederherstellbar bleiben.

Entscheidung:

- Verboten fuer persistente Hidden-Element-Zustaende.

### Option 5: localStorage

Bewertung:

- Nicht empfohlen.
- Umgeht HostAdapter, Validierung, Scope-Freigabe und spaetere Produkt-/Profilregeln.
- Erschwert Tests, Ruecksetzung, Migration und Support.

Entscheidung:

- Verboten.

### Option 6: versteckte DOM-Zustaende

Bewertung:

- Nicht empfohlen.
- DOM-Status ist kein stabiler Speicherort.
- DOM-Reihenfolge, CSS-Klassen und sichtbare Texte duerfen keine Speicherschluessel liefern.
- Versteckte DOM-Zustaende koennen Elemente unauffindbar machen.

Entscheidung:

- Verboten.

## Zielentscheidung

Persistente Visibility-Overrides gehoeren in einen eigenen BBM-seitigen UI-Editor-Layout-Override-Speicher hinter dem HostAdapter.

Verbindliche Zielregeln:

- Registry bleibt unveraendert.
- UI-Editor-kit speichert nichts selbst.
- HostAdapter bleibt die Grenze zwischen generischem Editor und BBM-Speicherung.
- HostAdapter liefert beim Lesen den fuer den Scope gueltigen Layout-State.
- Runtime bleibt generisch und kennt weder DB noch IPC noch konkrete Speichertechnik.
- TableLayout bleibt fachlich getrennt und wird nicht fuer Hidden-Element-Visibility zweckentfremdet.

## Ziel-Datenstruktur

Empfohlen ist ein Datensatz pro Element-Override:

```js
{
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
  elementId: "example.field",
  overrides: {
    visible: false
  },
  source: "ui-editor",
  createdAt: "ISO-Date",
  updatedAt: "ISO-Date"
}
```

Vorteile:

- einzelne Elemente koennen gezielt validiert, ersetzt und geloescht werden
- unbekannte `elementId` kann vor dem Speichern blockiert werden
- Reset fuer ein einzelnes Element ist einfach
- Scope-Freigabe kann pro Datensatz pruefen
- spaetere Migration ist besser kontrollierbar

Alternative Liste je Scope:

```js
{
  scopeId: "restarbeiten.ui.main",
  elements: {
    "example.field": {
      visible: false
    }
  }
}
```

Bewertung der Alternative:

- Vorteil: kompakter fuer Lesen eines ganzen Scopes.
- Nachteil: groessere Konfliktflaeche beim Schreiben.
- Nachteil: Reset oder Validierung einzelner Elemente ist weniger klar.
- Nachteil: Ein fehlerhafter Eintrag kann leichter den ganzen Scope-Payload beschaedigen.

Entscheidung:

- Primaer ein Datensatz pro Element-Override.
- Der HostAdapter darf spaeter beim Lesen daraus eine Scope-Liste fuer `getCurrentLayoutState(...)` bilden.

## ChangeRequest-Zuordnung

Der bestehende ChangeRequest-Vertrag bleibt:

- Hide: `operation: "visibility"`, `payload.visible: false`
- Show: `operation: "visibility"`, `payload.visible: true`
- `source: "preview"`
- `persistent: false` bleibt Standard

Erst nach spaeterer Freigabe darf verarbeitet werden:

```js
{
  operation: "visibility",
  payload: {
    visible: false
  },
  persistent: true
}
```

Bis dahin gilt:

- Dry-Run bleibt aktiv.
- `persistent: true` wird blockiert.
- `canPersistVisibility` bleibt `false`.
- `submitChangeRequests(...)` liefert weiter `PERSISTENCE_DISABLED`.

## Freigabegrenzen

Keine globale Freigabe fuer alle Module auf einmal.

Erster erlaubter Pilot:

- Scope: `restarbeiten.ui.main`
- Modul: `restarbeiten`
- Art: UI-Scope
- Zweck: Sichtbarkeit editorfaehiger UI-Elemente

Ausgeschlossen im ersten Schritt:

- Protokoll-Scope
- Demo-Scope
- PDF-/Druck-Scopes
- Tabellenlayout-Editor
- automatisch erkannte DOM-Elemente
- Record-/Template-Instanzen ohne stabilen Registry-Eintrag
- Fachfelder und Datenbankfelder

## Sicherheitsregeln

- Registry wird nie veraendert.
- Ausgeblendete Elemente bleiben registriert.
- Ausgeblendete Elemente muessen wiederherstellbar bleiben.
- Einblenden muss immer moeglich bleiben.
- Keine irreversible Aktion.
- Keine Speicheraktion ohne validierte `scopeId`.
- Keine Speicheraktion ohne validierte `elementId`.
- Unbekannte `elementId` muss blockiert werden.
- `operation` muss `visibility` sein.
- `payload.visible` muss boolean sein.
- Persistenz darf nicht auf Template-/Record-Instanzen unkontrolliert wirken.
- Speicherschluessel duerfen nicht aus DOM-Reihenfolge, CSS-Klassen oder sichtbaren Texten abgeleitet werden.
- Keine Auswirkung auf PDF-/Drucklogik im ersten Schritt.
- Keine Fachfeld-/Datenbankfeld-Aenderung.
- Keine Fachaktion durch Hide/Show.

## App-Start und Wiederherstellung

G28 baut kein Wiederherstellen beim App-Start.

Spaeteres Zielbild:

1. BBM laedt persistierte UI-Editor-Overrides fuer freigegebene Scopes.
2. HostAdapter validiert Scope und Element-IDs gegen Registry.
3. HostAdapter liefert einen neutralen Layout-State.
4. Runtime kombiniert Registry, Layout-State und laufenden Preview-State.
5. Hidden-Elements-Liste bleibt konsistent und erlaubt Einblenden.

## Folgepakete

### G29: Persistenzspeicher technisch vorbereiten, aber deaktiviert

Status:

- erledigt als technische Modellvorbereitung, nicht als Speicheraktivierung.
- `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js` definiert Normalisierung, Validierung, ChangeRequest-Mapping und Persistierbarkeitspruefung fuer Visibility-Overrides.
- `scripts/tests/editorLayoutOverrideModel.test.cjs` prueft gueltige Overrides, Pflichtfelder, Boolean-`visible`, unbekannte/unkontrollierte Element-IDs, `persistent: false`, blockiertes `persistent: true` bei deaktivierter Capability und fehlende Speicherwege.
- Keine produktive Schreibausfuehrung, keine DB-Migration, kein Repo, kein IPC, kein `localStorage`, kein `writeFile`, keine Speicherdatei und kein App-Start-Wiederherstellen.

### G30: HostAdapter-Persistenz-Dry-Run mit validiertem Payload

Status:

- erledigt als validierter Dry-Run, nicht als Speicheraktivierung.
- `persistent: true` Visibility-ChangeRequests werden gegen Scope, Registry-`elementId` und `payload.visible` validiert.
- Gueltige Requests werden in einen Override-Payload uebersetzt und mit `PERSISTENCE_DISABLED` blockiert.
- Ungueltige `visible`-Werte oder unbekannte `elementId` werden mit `INVALID_CHANGE_REQUEST` blockiert.
- Weiterhin keine produktive Schreibausfuehrung, keine DB-Migration, kein Repo, kein IPC, kein `localStorage`, kein `writeFile`, keine Speicherdatei und kein App-Start-Wiederherstellen.

### G31: Pilot-Persistenz fuer einen Scope aktivieren

Status:

- erledigt als enger Pilot fuer `restarbeiten.ui.main`.
- Eigener BBM-Speicher `ui_editor_layout_overrides` mit Repo, IPC und Preload-Methoden ist vorhanden.
- Gespeichert wird nur `operation: "visibility"` mit `persistent: true` und Boolean-`payload.visible`.
- `elementId` muss in der Registry bekannt und kontrollierbar sein.
- Der HostAdapter liest gespeicherte Datensaetze als neutralen Layout-State zurueck.
- Andere Scopes, andere Operationen und ungueltige Payloads werden nicht gespeichert.
- UI-Editor-kit, Registry, PDF-/Drucklogik, Fachlogik, Drag und Target-Selection bleiben unveraendert.

### G32: Wiederherstellung beim App-Start fuer Pilot-Scope

Status:

- erledigt als technische Restore-Absicherung fuer `restarbeiten.ui.main`.
- Gespeicherte Overrides werden ueber `loadCurrentLayoutState()` aus dem BBM-Speicher gelesen.
- `getCurrentLayoutState("restarbeiten.ui.main")` liefert die geladenen Datensaetze mit `overrides.visible` und top-level `visible`.
- Die Hidden-Elements-Logik erkennt `visible: false` als hidden und zaehlt `visible: true` nicht als hidden.
- Registry, UI-Editor-kit, weitere Scopes, PDF-/Drucklogik und Fachlogik bleiben unveraendert.

### G33: UI-Pruefung und Ruecksetzfunktion

Status:

- erledigt als enger Pilot-Ruecksetzpfad im bestehenden Hidden-Elements-Popover.
- Einzelne gespeicherte Hidden-Overrides fuer `restarbeiten.ui.main` koennen per `Einblenden` auf `overrides.visible: true` gesetzt werden.
- Bei mehreren aktiv einblendbaren Pilot-Overrides erscheint `Alle einblenden`.
- Die Aktion bleibt an HostContext, Registry-Element, Capability `canPersistVisibility: true`, `dryRunOnly: false` und `submitChangeRequests(...)` gebunden.
- Keine globale Scope-Freigabe, keine Registry-Mutation, kein UI-Editor-kit-Speicher, kein `localStorage`, kein Datei-Schreibweg und keine PDF-/Drucklogik.

### G34: Freigabe weiterer Scopes erst nach Test

- keine automatische Ausweitung
- jeder weitere Scope braucht eigene Freigabe, Tests und Sichtpruefung

## G28-Grenze

G28 endet mit dieser Freigabeentscheidung.

Nicht Teil von G28:

- keine DB-Migration
- kein Repo
- kein IPC
- kein `localStorage`
- kein `writeFile`
- keine neue Speicherdatei
- keine UI-Aenderung
- keine produktive Persistenz
- kein App-Start-Load

## Stand nach G29

G29 ergaenzt nur ein neutrales technisches Modell und Guardrail-Tests.

Weiterhin nicht Teil des Stands:

- keine DB-Migration
- kein produktives Repo
- kein IPC-Schreibweg
- kein `localStorage`
- kein `writeFile`
- keine neue Speicherdatei
- keine UI-Aenderung
- keine Aktivierung von `canPersistVisibility: true`
- keine produktive HostAdapter-Schreibausfuehrung
- kein App-Start-Load

## Stand nach G30

G30 erweitert nur den HostAdapter-Dry-Run:

- `persistent: true` wird erkannt und validiert.
- Validierung nutzt das neutrale Override-Modell aus G29.
- Gueltige Visibility-Requests bleiben blockiert, weil Persistenz deaktiviert ist.
- `canPersistVisibility` bleibt `false`.
- `submitChangeRequests(...)` liefert weiterhin Dry-Run-/Blockadeantworten.

Weiterhin nicht Teil des Stands:

- keine DB-Migration
- kein produktives Repo
- kein IPC-Schreibweg
- kein `localStorage`
- kein `writeFile`
- keine neue Speicherdatei
- keine UI-Aenderung
- keine produktive HostAdapter-Schreibausfuehrung
- kein App-Start-Load

## Stand nach G31

G31 aktiviert die echte Persistenz nur fuer den Pilot-Scope:

- `scopeId === "restarbeiten.ui.main"`
- `targetAppId === "bbm"`
- `moduleId === "restarbeiten"`
- `operation === "visibility"`
- `persistent === true`
- `payload.visible` ist boolean
- `elementId` ist in der Registry bekannt und nicht unkontrolliert instanzbezogen
- `getCapabilities()` meldet fuer diesen Adapter `canPersistVisibility: true`

Speicherweg:

- Main: `src/main/db/uiEditorLayoutOverridesRepo.js`
- Tabelle: `ui_editor_layout_overrides`
- IPC: `uiEditorLayoutOverrides:getMany`, `uiEditorLayoutOverrides:save`
- Preload: `uiEditorLayoutOverridesGetMany`, `uiEditorLayoutOverridesSave`
- Renderer: Restarbeiten-HostAdapter hinter der HostAdapter-Grenze

Weiterhin nicht Teil des Stands:

- keine globale Scope-Freigabe
- keine Persistenz fuer Move/Resize/Text/Fachfelder
- kein `localStorage`
- kein `writeFile`
- keine Registry-Mutation
- keine PDF-/Drucklogik
- Restore-Absicherung bleibt als G32 getrennt

## Stand nach G32

G32 aktiviert keine weitere Persistenz und keine neue UI.

Abgesichert ist:

- Ein gueltiger Visibility-Override fuer `restarbeiten.ui.main` kann gespeichert werden.
- Ein neuer HostAdapter-/Lesezyklus laedt den gespeicherten Override ueber `loadCurrentLayoutState()`.
- `getCurrentLayoutState("restarbeiten.ui.main")` liefert danach `visible: false` bzw. nach erneutem Speichern `visible: true`.
- Die Hidden-Elements-Logik nutzt diesen Layout-State und zaehlt nur `visible: false` als ausgeblendet.
- Andere Scopes, unbekannte `elementId`, Nicht-Visibility-Operationen und ungueltige `payload.visible` bleiben blockiert.

Weiterhin nicht Teil des Stands:

- keine globale Scope-Freigabe
- keine Persistenz fuer Move/Resize/Text/Fachfelder
- kein `localStorage`
- kein `writeFile`
- keine Registry-Mutation
- keine PDF-/Drucklogik
- kein UI-Editor-kit-Speicher

## Stand nach G33

G33 erweitert nur die bestehende kompakte Popover-Bedienung fuer den freigegebenen Pilot-Scope.

Aktiv ist:

- `Einblenden` fuer gespeicherte Hidden-Overrides aus `getCurrentLayoutState("restarbeiten.ui.main")`, wenn der HostAdapter `canPersistVisibility: true`, `persistence: true` und `dryRunOnly: false` meldet.
- Speicherung eines validierten `persistent: true` Visibility-ChangeRequests mit `payload.visible === true`.
- `Alle einblenden` nur dann, wenn mehr als ein aktiv einblendbarer Pilot-Eintrag vorhanden ist.

Weiterhin nicht Teil des Stands:

- keine globale Scope-Freigabe
- keine Persistenz fuer Move/Resize/Text/Fachfelder
- kein `localStorage`
- kein `writeFile`
- keine Registry-Mutation
- keine PDF-/Drucklogik
- kein UI-Editor-kit-Speicher

## Stand nach G34

G34 aktiviert keine weitere Persistenz.

Ergaenzt wurde:

- Policy-Datei `src/renderer/editorRuntime/host/visibilityPersistenceScopePolicy.js`
- Allowlist `VISIBILITY_PERSISTENCE_ALLOWED_SCOPES`
- Policy-Funktion `isVisibilityPersistenceAllowedForScope(scopeId, context)`
- Repo-Backstop mit expliziter Allowlist fuer `ui_editor_layout_overrides`
- Doku `docs/UI_EDITOR_HIDDEN_ELEMENTS_SCOPE_FREIGABE.md`

Aktiv erlaubt bleibt:

- `restarbeiten.ui.main`

Weiterhin blockiert bleiben:

- `protokoll.topsScreen`
- `restarbeiten.screen`
- `bbm.demo.editorMove`
- unbekannte Scopes
- Wildcards
- Move-/Resize-/Text-/Fachfeld-Persistenz
- Registry-Mutation
- UI-Editor-kit-Speicherung
- PDF-/Drucklogik
