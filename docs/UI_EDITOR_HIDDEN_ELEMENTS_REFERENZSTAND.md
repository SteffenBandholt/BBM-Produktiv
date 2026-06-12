# UI-Editor Hidden-Elements Referenzstand

## Kurzfazit

Der Hidden-Elements-Block ist als stabiler Referenzstand abgeschlossen. Der Editor kann ausgeblendete Elemente im kompakten Panelbereich sichtbar machen, temporaere Preview-Hides wieder einblenden und fuer den Pilot-Scope `restarbeiten.ui.main` persistente Visibility-Overrides speichern, wieder laden und zuruecksetzen.

Aktiv bleibt nur `restarbeiten.ui.main`. Weitere Scopes sind ueber eine Policy vorbereitet, aber nicht freigegeben.

## Was ist umgesetzt

- Hidden-Elements-Button im BBM-Preview-Panel.
- Kompaktes Popover fuer ausgeblendete Elemente.
- Anzeige temporaerer Preview-Hides.
- Anzeige geladener Layout-State-Hides.
- Hide/Show als einheitlicher `visibility`-ChangeRequest.
- Pilot-Persistenz fuer Visibility-Overrides im Scope `restarbeiten.ui.main`.
- Restore ueber `getCurrentLayoutState(scopeId)`.
- Einblenden einzelner persistenter Hidden-Elemente im Pilot-Scope.
- Kompaktes `Alle einblenden` fuer mehrere persistente Pilot-Hides.
- Scope-Freigabe ueber explizite Allowlist/Policy.

## Bedienlogik im Editorpanel

Das Panel zeigt im Preview-Kontext einen kompakten Button wie `Ausgeblendete: 0` oder `Ausgeblendete: 1`.

Bei vorhandenen Hidden Elements oeffnet der Button ein kleines Popover. Dort werden ausgeblendete Elemente mit Label und neutraler Aktion angezeigt.

`Einblenden` wirkt in zwei Faellen:

- temporaere Preview-Hides werden im in-memory Preview-State zurueckgesetzt.
- persistente Pilot-Hides aus `restarbeiten.ui.main` werden als `persistent: true` / `payload.visible === true` ueber den freigegebenen HostAdapter-Pfad gespeichert.

Layout-State-only Eintraege ohne freigegebene Persistenz-Capability bleiben nicht produktiv einblendbar.

## Datenfluss

Der aktuelle Datenfluss ist:

```text
Registry
+ Layout-State aus getCurrentLayoutState(scopeId)
+ Pending-/Preview-State
-> Hidden-Elements-ViewModel aus UI-Editor-kit
-> Button/Popover im BBM-Launcher
```

Die Registry liefert die statische Element-Landkarte. `getCurrentLayoutState(scopeId)` liefert geladene Overrides. Pending-/Preview-State ueberschreibt diese Werte temporaer im laufenden Editor. Das UI-Editor-kit baut daraus neutrale Hidden-Elements-ViewModels; der BBM-Launcher rendert Button und Popover.

## ChangeRequest-Modell

Temporäre Preview-Aenderungen bleiben nicht persistent:

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

Hide und Show nutzen dieselbe Operation:

- Hide: `payload.visible === false`
- Show: `payload.visible === true`

Pro Element wird der aktuelle Visibility-Request ersetzt statt widerspruechlich dupliziert.

## Persistenzmodell

Persistenz ist nur im Pilot-Scope freigegeben:

```text
operation: "visibility"
payload.visible: true | false
persistent: true
scopeId: "restarbeiten.ui.main"
```

Gespeichert wird ein BBM-seitiger Layout-Override mit `overrides.visible`. Andere Operationen, andere Scopes, unbekannte `elementId` und ungueltige `payload.visible`-Werte werden blockiert.

Das UI-Editor-kit speichert nicht.

## Restore-Pfad

Der Restore-Pfad laeuft ueber den HostAdapter:

1. BBM liest gespeicherte Overrides fuer den freigegebenen Scope.
2. Der Restarbeiten-HostAdapter bildet daraus neutralen Layout-State.
3. `getCurrentLayoutState("restarbeiten.ui.main")` liefert die Datensaetze an den Launcher.
4. Die Hidden-Elements-Logik zaehlt nur `visible: false` als hidden.
5. `visible: true` bleibt sichtbarer Zustand und wird nicht als hidden gezaehlt.

Es gibt keinen globalen Restore fuer weitere Scopes.

## Scope-Freigabe/Policy

Die Freigabe weiterer Hidden-Elements-Visibility-Persistenz-Scopes ist ueber eine explizite Policy vorbereitet:

- `src/renderer/editorRuntime/host/visibilityPersistenceScopePolicy.js`
- `VISIBILITY_PERSISTENCE_ALLOWED_SCOPES`
- `isVisibilityPersistenceAllowedForScope(scopeId, context)`

Aktiv erlaubt ist ausschliesslich:

```text
restarbeiten.ui.main
```

Blockiert bleiben insbesondere:

- `protokoll.topsScreen`
- `restarbeiten.screen`
- `bbm.demo.editorMove`
- unbekannte Scopes
- Wildcards wie `*`

`canPersistVisibility: true` allein reicht nicht fuer eine globale Freigabe.

## Sicherheitsgrenzen

- Persistenz nur fuer `restarbeiten.ui.main`.
- Keine globale Freigabe.
- Weitere Scopes nur ueber eigenes Folgepaket.
- Registry bleibt unverändert.
- Keine PDF-/Druckauswirkung.
- Keine Fachlogik.
- Keine Drag-Aenderung.
- Keine Target-Selection-Aenderung.
- Kein `localStorage`.
- Kein `writeFile`.
- Keine neue Persistenzart.
- Kein Bare-Package-Import im Renderer.
- Keine alten Editorpfade.
- UI-Editor-kit speichert nicht.

## Was bewusst nicht umgesetzt ist

- Keine Freigabe weiterer Scopes.
- Keine Persistenz fuer Move, Resize, Text, Fachfelder oder sonstige Operationen.
- Kein globales `canPersistVisibility`.
- Keine Registry-Mutation.
- Keine PDF-/Drucklogik.
- Keine fachliche Datenaktion.
- Kein automatisches Ableiten von Speicherschluesseln aus DOM, CSS-Klassen, sichtbaren Texten oder Reihenfolge.
- Keine Speicherung im UI-Editor-kit.

## Naechste moegliche Pakete

Moegliche Folgepakete muessen separat geschnitten werden:

- einen weiteren konkreten Scope fachlich freigeben,
- Restore und Ruecksetzen fuer genau diesen Scope nachweisen,
- Rollback-/Reset-Verhalten je Scope pruefen,
- Sichtpruefung fuer neue sichtbare UI-Aenderungen nachziehen,
- spaeter Produkt-/Lizenzregeln fuer Scope-Freigaben klaeren.
- Surface-/Panel-/Drag-Zielarchitektur separat weiterfuehren, siehe `docs/UI_EDITOR_KIT_SURFACE_PANEL_DRAG_ARCHITEKTUR.md`.

Keines dieser Folgepakete ist durch diesen Referenzstand automatisch aktiviert.

## Test-/Guardrail-Referenz

Relevante Pruefungen fuer diesen Referenzstand:

- `npm run check:ui-editor-kit`
- `node scripts/tests/uiEditorKitHiddenElementsRuntimeImport.test.cjs`
- `node scripts/tests/uiEditorKitHiddenElementsRuntimeBridge.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `node scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `node scripts/tests/uiEditorLayoutOverridesRepo.test.cjs`
- `node scripts/tests/uiEditorContract.test.cjs`
- `npm test`
- `git diff --check`

Die Referenzdoku selbst wird ueber einen Doku-Guardrail in `scripts/tests/uiEditorContract.test.cjs` auf Kernbegriffe geprueft.
