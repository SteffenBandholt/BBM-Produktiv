# G141 - UI-Editor Element-Save-Geruest Referenzstand

## Ziel

G141 bereitet das technische Geruest fuer den in G140 definierten
UI-Element-Speichervertrag vor. Es wird noch kein produktiver Speicherweg
aktiviert.

Der UI-Editor bleibt auf UI-Elementbearbeitung ausgerichtet. Er speichert
keine Restarbeiten-Notiz und nutzt `restarbeitenCreateNote` nicht als
UI-Element-Speicherweg.

## Technisch vorbereitet

Im BBM-Launcher existieren jetzt zentrale lokale Funktionen:

- `validateUiEditorElementSavePayload(payload)`
- `buildReadonlyHintInfotextUiElementSavePayload(...)`
- `executeUiEditorElementSaveContract(...)`
- `isUiEditorElementSaveSurfaceAllowed(surfaceId)`
- `isUiEditorElementSaveElementTypeAllowed(elementType)`

Diese Funktionen bleiben lokal im Launcher und erzeugen keinen neuen
IPC-/DB-Schreibweg.

## Payload-Struktur

Gueltige UI-Element-Save-Payloads enthalten mindestens:

- `projectId`
- `surfaceId`
- `elementId`
- `elementType`
- `changes`

Beispiel:

```js
{
  projectId: "04-2026",
  surfaceId: "restarbeiten.ui.main",
  elementId: "restarbeiten.hinweisInfotext.text",
  elementType: "Hinweis / Infotext",
  changes: {
    text: "Neuer Elementtext"
  }
}
```

Optional bleiben vorbereitet:

- `targetAppId`
- `moduleId`
- `updatedAt`

## Validierung

`validateUiEditorElementSavePayload` blockiert:

- fehlende `projectId`
- fehlende `surfaceId`
- fehlende `elementId`
- fehlende `elementType`
- fehlende oder leere `changes`
- unbekannte Surface
- unbekannten Elementtyp
- unbekannte Top-Level-Felder
- Diagnosefelder
- Notizfelder wie `noteText`
- `restarbeitId` als UI-Element-Save-Pflichtfeld oder Ersatzkontext

Erlaubte `changes` im ersten Vertrag:

- `text`
- `label`
- `visible`
- `order`

Validierungsregeln:

- `text` und `label` muessen nicht-leere Strings sein, wenn sie vorhanden
  sind.
- `visible` muss Boolean sein.
- `order` muss eine endliche Zahl sein.
- unbekannte Change-Keys werden blockiert.

## Allowlist

Erlaubte Surface:

- `restarbeiten.ui.main`

Erlaubte Elementtypen:

- `Hinweis / Infotext`
- `label`

Es gibt keine Wildcard-Freigabe.

## Verhalten bei fehlendem Vertrag

Wenn `window.bbmDb.uiEditorSaveElementOverride` bzw. der spaetere
Preload-/IPC-Vertrag noch nicht produktiv vorhanden ist, blockiert das
Save-Geruest mit:

`UI-Element-Speichervertrag noch nicht implementiert`

Das gilt auch bei gueltigem Payload. Der normale UI-Pfad fuehrt keinen Save
aus.

## Isolierter Positivtest

Ein positiver Save ist nur testseitig ueber eine explizite Stub-Freigabe
moeglich:

- `mode: "ui-element-save-contract-stub-test"`
- `allowExecute: true`
- injizierter Adapter

Der Adapter erhaelt genau den validierten Payload und wird im Test genau
einmal aufgerufen.

## Warum `restarbeitenCreateNote` nicht verwendet wird

`restarbeitenCreateNote` und `restarbeiten:createNote` speichern
Restarbeiten-Notizen. Eine UI-Elementaenderung ist dagegen ein
Konfigurations-/Override-Vorgang fuer ein UI-Element.

Deshalb gilt:

- kein Speichern von UI-Elementaenderungen als Restarbeiten-Notiz
- kein `noteText` als UI-Element-Save-Payload
- kein `restarbeitId` als Pflichtfeld fuer UI-Element-Speicherung
- kein automatisches Speichern beim Oeffnen
- kein localStorage
- kein writeFile

## Tests

`scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` sichert ab:

- valider Payload wird akzeptiert
- fehlende Pflichtfelder blockieren
- leere `changes` blockieren
- unbekannte Surface blockiert
- unbekannter Elementtyp blockiert
- `noteText` wird nicht akzeptiert
- `restarbeitenCreateNote` wird nicht als UI-Element-Speicherweg genutzt
- fehlender Vertrag liefert den Blockiergrund
  `UI-Element-Speichervertrag noch nicht implementiert`
- isolierter Stub-Positivtest ruft den Adapter genau einmal auf
- blosses Rendern/Oeffnen ist nicht mit `executeUiEditorElementSaveContract`
  verdrahtet
- UI-Editor bleibt auf Elementbearbeitung ausgerichtet

## Offene Schritte fuer G142

G142 kann den eigentlichen technischen Vertrag als getrenntes Paket
implementieren:

1. DB-Tabelle `ui_editor_element_overrides`.
2. Repository `uiEditorElementOverridesRepo`.
3. IPC `uiEditorElementOverrides:getMany` und
   `uiEditorElementOverrides:save`.
4. Preload `uiEditorGetElementOverrides` und
   `uiEditorSaveElementOverride`.
5. Registry-Abgleich und Allowlist als Backstop.
6. UI-Button erst nach expliziter Freigabe und erfolgreicher Vertragspruefung
   aktivieren.
