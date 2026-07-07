# M30 UI-Editor Bedienoberflaeche Speichern/Laden/Reset

## Ergebnis

M30 sichert die Bedienlogik fuer den globalen UI-Editor im bestehenden EditorRuntime-Kontext ab.

Der EditorScopeInspector kann fuer bewusst registrierte UI-Elemente jetzt ein neutrales Layout-Control-Modell liefern:

- Aenderung anwenden/speichern
- gespeicherten Zustand laden/anwenden
- auf Standard zuruecksetzen

Jede Bedienaktion liefert eine sichtbare Statusrueckmeldung mit `success` oder `blocked`.

## Technischer Rahmen

Die Umsetzung verwendet ausschliesslich die vorhandene Struktur:

- EditorRuntime
- ElementRegistry
- HostAdapter
- LayoutPersistence aus M29

Der Inspector haelt pro Scope denselben HostAdapter im aktuellen Editor-Kontext, damit Speichern, Laden und Reset denselben Layoutzustand bedienen.

## Grenzen

Die Bedienung arbeitet nur mit neutralen Layoutwerten und registrierten Elementen.

Blockiert werden:

- unbekannte Element-IDs
- nicht layoutneutrale Operationen
- gesperrte oder nicht erlaubte Operationen
- Fachpayloads
- DOM-/CSS-Payloads
- Datenbank-, IPC- oder Datensatzpayloads

Der Editor scannt keine bestehende UI, erzeugt keine automatische Registry und nutzt keine DOM-Erkennung als Speichergrundlage.

## Nicht geaendert

- keine PDF-Bearbeitung
- keine PDF-Ausgabe
- kein Druck
- keine Mail
- kein Diktat/Audio
- keine Protokoll-Fachlogik
- keine Restarbeiten-Fachlogik
- keine Datenbankmigration
- keine fachlichen IPC-Wege
- keine neue Editor-Grundsatzentscheidung

## Pruefung

Die Absicherung liegt in:

- `scripts/tests/editorScopeInspector.test.cjs`
- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `scripts/tests/editorBoundary.safety.test.cjs`
- `scripts/tests/editorAltVersucheBoundary.test.cjs`
- Gesamtlauf ueber `npm test`
