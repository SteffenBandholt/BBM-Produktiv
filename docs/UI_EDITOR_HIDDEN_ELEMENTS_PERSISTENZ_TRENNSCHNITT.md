# UI-Editor Hidden-Elements Persistenz-Trennschnitt

## Kurzfazit

G23 legt nur den Datenfluss und Trennschnitt fuer ausgeblendete UI-Editor-Elemente fest. Es wird keine Persistenz gebaut.

Empfehlung:

- Registry bleibt die statische Element-Landkarte und enthaelt weiterhin alle Elemente.
- Layout-State wird die spaetere konkrete Datenquelle fuer `visible = false`.
- Pending ChangeRequests beschreiben vorbereitete Hide-/Show-Aenderungen vor einer Uebernahme.
- Persistierte Layout-Overrides liegen spaeter in BBM hinter dem HostAdapter.
- Das UI-Editor-kit bleibt generisch und speichert nichts selbst.

## Aktueller Stand

Im BBM-Preview-Panel gibt es:

- einen kompakten Hidden-Elements-Button,
- ein kleines Popover,
- `Einblenden` fuer temporaere Preview-Hide-Aenderungen.

Aktuelle Datenquelle ist nur der laufende in-memory Preview-State im Launcher:

- `state.previewStates`
- `state.pendingChangeRequests`
- daraus abgeleitete Hidden-Elements-ViewModels aus dem UI-Editor-kit

Es gibt noch keine echte Registry-/Layout-State-Hidden-Ermittlung und keine dauerhafte Speicherung.

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
- `dryRunOnly: true`
- `submitChangeRequests()` blockiert mit `PERSISTENCE_DISABLED`

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

### G25: Hide/Show als ChangeRequest sauber modellieren

- Operationen und Payload fuer `visible = false/true` festlegen.
- Deduplizierung und Reset-Verhalten pruefen.
- Weiterhin ohne Persistenz.

### G26: HostAdapter-Dry-Run fuer Hidden-Element-Aenderungen

- `submitChangeRequests()` oder separaten Dry-Run kontrolliert pruefen.
- Validierung ohne dauerhafte Uebernahme.

### G27: Persistenz erst nach Freigabe

- Speicherort und Datenmodell festlegen.
- Erst dann DB/IPC/Storage bauen.
- Separate technische und fachliche Abnahme.

### G28: Wiederherstellen beim App-Start

- Persistierte Layout-Overrides laden.
- Effective-State bilden.
- UI und Hidden-Elements-Liste konsistent initialisieren.

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
