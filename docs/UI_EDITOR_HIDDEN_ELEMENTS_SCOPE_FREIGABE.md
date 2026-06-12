# UI-Editor Hidden-Elements Scope-Freigabe

## Zweck

G34 bereitet das Freigabemodell fuer weitere Hidden-Elements-Visibility-Persistenz-Scopes vor, aktiviert aber keinen weiteren Scope.

Aktiv bleibt ausschliesslich:

- `restarbeiten.ui.main`

## Freigabeprinzip

Visibility-Persistenz darf nur ueber eine explizite Allowlist/Policy freigegeben werden.

Technische Policy:

- `src/renderer/editorRuntime/host/visibilityPersistenceScopePolicy.js`
- `VISIBILITY_PERSISTENCE_ALLOWED_SCOPES`
- `isVisibilityPersistenceAllowedForScope(scopeId, context)`

Regeln:

- kein Wildcard-Scope
- kein Default-true
- keine automatische Freigabe aus Registry, Catalog, DOM oder Modulnamen
- keine Freigabe nur aufgrund von `canPersistVisibility: true`
- Scope, HostContext, Registry und Capability muessen zusammenpassen

## Aktueller Pilot-Scope

Der einzige erlaubte Scope ist:

```js
{
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main"
}
```

Nur dort duerfen validierte ChangeRequests gespeichert werden:

```js
{
  operation: "visibility",
  payload: {
    visible: true
  },
  source: "preview",
  persistent: true
}
```

`payload.visible` darf `true` oder `false` sein. Andere Payloads, andere Operationen und andere Scopes bleiben blockiert.

## Weiterhin blockiert

- `protokoll.topsScreen`
- `restarbeiten.screen`
- `bbm.demo.editorMove`
- unbekannte Scopes
- Wildcards wie `*`
- Move-/Resize-/Text-/Fachfeld-Persistenz
- Registry-Mutation
- UI-Editor-kit-Speicherung
- `localStorage`
- Dateiablage
- PDF-/Drucklogik

## Ablauf fuer weitere Scopes

Jeder weitere Scope braucht ein eigenes Freigabepaket.

Vor einer Freigabe muessen geklaert und getestet sein:

- exakter `scopeId`
- `targetAppId` und `moduleId`
- Registry ist stabil und enthaelt nur persistierbare `elementId`
- keine instanzbezogenen `record`-/`template`-/`::`-IDs
- erlaubte Operation bleibt ausschliesslich `visibility`
- `payload.visible` bleibt Boolean
- HostAdapter meldet `canPersistVisibility: true` nur fuer den freigegebenen Scope
- Restore ueber `getCurrentLayoutState(scopeId)`
- Einblenden/Ruecksetzen pro Scope
- Rollback/Ruecksetzverhalten pro Scope
- Tests fuer bekannte andere und unbekannte Scopes bleiben rot/blockiert

## Testanforderungen

Vor jeder neuen Scope-Freigabe muessen mindestens nachgezogen werden:

- Policy-Test: Scope steht explizit in der Allowlist.
- HostAdapter-Test: `canPersistVisibility` ist nur fuer den neuen Scope aktiv.
- Persistenztest: Nur `operation: "visibility"` mit Boolean-`payload.visible` wird gespeichert.
- Blockadetest: andere Scopes und Wildcards bleiben blockiert.
- Restore-Test: `getCurrentLayoutState(scopeId)` liefert gespeicherte `overrides.visible`.
- Launcher-Test: Hidden-Elements-Popover bleibt konsistent.

## Stand nach G34

G34 liefert nur das Freigabemodell und Guardrails.

Es wurde keine weitere Scope-Persistenz aktiviert.

## Referenzstand nach G35

Der Hidden-Elements-Block ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md` als stabiler Referenzstand dokumentiert.

Diese Scope-Freigabe bleibt unveraendert:

- aktiv erlaubt: `restarbeiten.ui.main`
- keine globale Freigabe
- keine weiteren Scopes
- weitere Scope-Freigaben nur ueber eigenes Folgepaket

G35 ist ein Abschluss-/Referenzpaket und aktiviert keine neue Produktivlogik.
