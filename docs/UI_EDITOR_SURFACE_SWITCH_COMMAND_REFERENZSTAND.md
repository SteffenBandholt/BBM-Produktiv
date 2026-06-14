# UI-Editor SurfaceSwitch Request/Command-Referenzstand

## Kurzfazit

Der SurfaceSwitch-Request/Command-Handler ist read-only abgeschlossen. Ein
angefragter Wechsel wird defensiv ueber den Command-Handler und das
SurfaceSwitch-Modell ausgewertet, aber nicht produktiv umgesetzt. Nur
`restarbeiten.ui.main` bleibt als resolvedSurfaceId bestehen.
G67 nutzt den Command intern read-only im BBM-Launcher, ohne sichtbare
UI-Aenderung.

## Aktueller read-only Stand

- Request-/Command-Handler:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchCommand.js`
- Read-only Grundlage:
  `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
- Die Kette bleibt defensiv und unveraendert im Referenzmodus.
- `changed` bleibt immer `false`.
- Es gibt keine Launcher-Produktivintegration.
- Es gibt keine sichtbare UI-Aenderung.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Erlaubte Request-Ziele

- `restarbeiten.ui.main`

## Blockierte Request-Ziele

- `pdf.plan.page.1`
- `plan.canvas.default`
- unbekannte SurfaceIds
- `*`
- leere IDs

## Rueckgabeverhalten

Der Handler liefert read-only ein Ergebnisobjekt zurueck. Bei dem erlaubten
Ziel bleibt die Aufloesung auf `restarbeiten.ui.main` stehen. Bei blockierten
Zielen bleibt die Aufloesung ebenfalls auf `restarbeiten.ui.main`, `changed`
bleibt `false` und der Request fuehrt zu keiner produktiven Umschaltung.

Erwartete Grundform:

```js
{
  handled: true,
  allowed: true,
  readonly: true,
  requestedSurfaceId: "restarbeiten.ui.main",
  resolvedSurfaceId: "restarbeiten.ui.main",
  changed: false,
  reason: "readonly-current-surface"
}
```

Bei blockierten Zielen bleibt die Form gleich aufgebaut, aber `allowed` ist
`false` und `reason` verweist auf den read-only Blockadepfad.

## Datenfluss

```text
SurfaceSwitch-Request
-> SurfaceSwitchCommand
-> SurfaceSwitchModel
-> SurfaceSelection-State
-> SurfaceSelectionModel
-> SurfacePolicy
-> resolvedSurfaceId
-> changed bleibt false
-> keine produktive Umschaltung
```

## Sicherheitsgrenzen

- read-only
- keine echte Umschaltung
- keine Launcher-Produktivintegration
- keine sichtbare UI-Aenderung
- keine PDF-/Plan-Auswahl
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik
- kein Bare-Package-Import im Renderer
- kein `localStorage`
- kein `writeFile`
- kein IPC-Schreibweg
- keine DB-Aenderung
- keine Registry-Aenderung
- keine Fachlogik

## Ausdruecklich nicht aktiviert

- Keine neue Produktivlogik.
- Keine neue UI-Funktion.
- Keine echte Surface-Umschaltung.
- Keine PDF-/Canvas-/Plan-Surface sichtbar oder auswählbar machen.
- Kein Dropdown mit weiteren Optionen.
- Keine grosse Surface-Liste.
- Keine Bearbeitungsbuttons.
- Keine Drag-Aktivierung.
- Keine Resize-Aktivierung.
- Keine Persistenzfreigabe.

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Freigabepaket.
- Launcher-Anbindung erst nach ausdruecklicher Produktivfreigabe.
- Weitere Request-/Command-Typen nur getrennt und defensiv vorbereiten.

## Testreferenz

- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`
