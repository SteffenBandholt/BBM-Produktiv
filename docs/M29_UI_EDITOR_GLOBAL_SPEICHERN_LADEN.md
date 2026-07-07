# M29 UI-Editor global Speichern/Laden/Reset

## Ergebnis

M29 sichert den vorhandenen EditorRuntime-/HostAdapter-Pfad fuer neutrale Layoutaenderungen ab.

Der bestehende Pilot-HostAdapter fuer `restarbeiten.ui.main` kann jetzt:

- erlaubte neutrale Layout-Change-Requests speichern,
- gespeicherte Layoutwerte ueber `getCurrentLayoutState()` wieder laden,
- gespeicherte Layoutwerte ueber `resetLayoutState()` einzeln oder vollstaendig zuruecksetzen.

## Grenze

Der Speicherpfad ist kein Fachspeicher.

Gespeichert werden nur neutrale Layoutwerte zu bewusst registrierten Editor-Elementen:

- `move`: `x`, `y`
- `resize`: `width`, `height`
- `hide` / `show`: `visible`
- `spacing`: `gap`, `padding`, `margin`
- `width`: `width`
- `height`: `height`

Andere erlaubte UI-Operationen wie `label` werden fuer diesen Layoutspeicher blockiert, bis sie fachneutral gesondert abgesichert sind.

## Guardrails

Ein Change Request wird blockiert, wenn:

- das Ziel-Element nicht in der Registry enthalten ist,
- die Operation nicht in `allowedOps` steht,
- die Operation in `lockedOps` steht,
- die Operation eine Fachaktion ist,
- der Payload Fach-, DOM-, Datenbank-, IPC- oder Datensatzwerte enthaelt,
- der Payload keinen neutralen Layoutwert enthaelt.

Der UI-Editor scannt keine bestehende UI, erzeugt keine automatische Registry und nutzt keine DOM-/CSS-Erkennung als Speichergrundlage.

## Nicht geaendert

- keine PDF-Bearbeitung
- keine PDF-Ausgabe
- kein Druck
- keine Mail
- kein Diktat/Audio
- keine Protokoll-Fachlogik
- keine Restarbeiten-Fachlogik
- keine Datenbankmigration
- keine neuen IPC-/DB-Fachwege
- keine neue sichtbare Editor-UI

## Pruefung

Die Absicherung liegt in:

- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `scripts/tests/editorRuntime.catalog.test.cjs`
- Gesamtlauf ueber `npm test`

