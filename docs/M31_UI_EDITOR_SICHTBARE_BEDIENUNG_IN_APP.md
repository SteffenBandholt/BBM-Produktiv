# M31 UI-Editor sichtbare Bedienung in der App

## Ergebnis

M31 bindet die in M30 abgesicherte neutrale Layoutbedienung sichtbar an die bestehende UI-Editor-Launcher-/Statusoberflaeche an.

Im aktiven UI-Editor-Modus zeigt die App fuer eine registrierte Auswahl:

- ausgewaehltes registriertes Element,
- zugeordneten Layout-Scope,
- neutrale Layoutoperation,
- Anwenden/Speichern,
- Laden,
- Reset,
- sichtbare Erfolg- oder Blockiert-Meldung.

## Scope-Anbindung

Die sichtbare App-Auswahl bleibt registrybasiert.

Fuer den vorhandenen Restarbeiten-Pilot gilt:

- sichtbarer UI-Scope: `restarbeiten.screen`
- Layout-/HostAdapter-Scope: `restarbeiten.ui.main`

Diese Zuordnung ist fest und bewusst. Es wird kein Scope aus DOM, CSS, Texten oder Reihenfolgen abgeleitet.

## Technischer Rahmen

Die sichtbare Bedienung nutzt:

- die bestehende UI-Editor-Launcher-Oberflaeche,
- die registrierte Zielauswahl,
- den M30-EditorScopeInspector,
- den M29-HostAdapter-/LayoutPersistence-Pfad.

Gespeichert werden nur neutrale Layoutwerte. Laden und Reset laufen ueber dieselben bestehenden Inspector-/HostAdapter-Methoden.

## Blockaden

Sichtbar blockiert werden:

- keine registrierte Auswahl,
- kein zugeordneter Layout-Scope,
- Element nicht im Layoutscope registriert,
- nicht layoutneutrale Operationen,
- ungueltige HostAdapter-Rueckmeldungen.

Fachwerte, DOM-/CSS-Werte, Datenbank-, IPC- oder Datensatzpayloads werden nicht als Layoutgrundlage verwendet.

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

Die sichtbare Anbindung ist abgesichert durch:

- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `scripts/tests/editorScopeInspector.test.cjs`
- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- Gesamtlauf ueber `npm test`
