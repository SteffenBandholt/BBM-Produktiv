# Bewertung M2-M4 gegen den bestehenden UI-Editor-kit-Mechanismus

## Kurzfazit
M2 liefert neutrale Runtime-Grundlagen und greift nicht in die funktionierende UI-Editor-Registrierung ein.

M3 und M4 bauen eine eigene Runtime-Schiene fuer `restarbeiten.ui.main` auf. Diese Schiene ersetzt den bereits funktionierenden UI-Editor-kit-Mechanismus nicht, sondern laeuft parallel dazu. Fuer den aktuellen Stand sollten M3 und M4 daher eingefroren werden, bis klar ist, ob sie wirklich gebraucht werden oder wieder entfernt werden koennen.

Der bestehende funktionierende UI-Editor-kit-Mechanismus bleibt massgeblich:
- Codex registriert UI-Elemente beim Bauen.
- Der UI-Editor liest diese Registrierung.
- Der UI-Editor erkennt und markiert die registrierten UI-Bereiche.

## Bewertungstabelle

| Datei / Bereich | Herkunft | Zweck | Eingriff in funktionierende UI-Registrierung | Ersetzt vorhandene UI-Editor-kit-Logik | Bewertung | Begründung |
|---|---|---|---|---|---|---|
| `src/renderer/editorRuntime/scopes/editorScopeTypes.js` | M2 | Neutraler Scope-Typenraum fuer den Runtime-Unterbau | nein | nein | behalten | Reines Hilfsmodul ohne UI-, PDF- oder Editor-Integration. |
| `src/renderer/editorRuntime/registry/editorRegistryModel.js` | M2 | Fachneutrales Registry-Modell | nein | nein | behalten | Datenmodell fuer den neuen Runtime-Unterbau, ohne bestehenden Editor zu ersetzen. |
| `src/renderer/editorRuntime/registry/editorRegistryValidator.js` | M2 | Validierung von Registry-Form und Parent-Beziehungen | nein | nein | behalten | Rein lesende Plausibilitaetspruefung, keine neue UI-Registrierung. |
| `src/renderer/editorRuntime/layout/editorLayoutStateModel.js` | M2 | Layout-State-Modell fuer spaetere Diagnose/Inspector-Pfade | nein | nein | behalten | Nur Modellierung, keine UI- oder Fachlogik. |
| `src/renderer/editorRuntime/catalog/bbmEditorCatalog.js` | M3 | Katalog fuer Runtime-Scope `restarbeiten.ui.main` | ja, indirekt | nein | einfrieren | Zweiter Katalog-/Scope-Weg neben der funktionierenden UI-Editor-kit-Registrierung. Nützlich nur als Runtime-Schicht, nicht als Ersatz. |
| `src/renderer/modules/restarbeiten/editor/restarbeitenEditorScopes.js` | M3 | Scope-Definition fuer `restarbeiten.ui.main` | ja, indirekt | nein | einfrieren | Erzeugt einen zweiten Scope-Kanal fuer Restarbeiten-Runtime. Parallel zur bestehenden UI-Editor-Registrierung. |
| `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js` | M3 | Runtime-Registry fuer Restarbeiten | ja, indirekt | nein | einfrieren | Zweite Registrierungsquelle fuer denselben Fachbereich. Sie ersetzt die funktionierende UI-Editor-kit-Registry nicht. |
| `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js` | M4 | Host-Adapter-Vertrag | nein | nein | behalten | Neutrale Vertragspruefung, keine UI- oder PDF-Logik. |
| `src/renderer/editorRuntime/changeRequests/editorChangeRequestModel.js` | M4 | Fachneutrales Change-Request-Modell | nein | nein | behalten | Nur Datenvertrag fuer spaetere Runtime-Pruefungen. |
| `src/renderer/editorRuntime/changeRequests/editorChangeRequestValidator.js` | M4 | Read-only Change-Request-Validierung | nein | nein | behalten | Blockiert nur, schreibt nichts und ersetzt keine bestehende UI-Editor-Logik. |
| `src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js` | M4 | Factory fuer Runtime-Host-Adapter | ja, indirekt | nein | einfrieren | Zweiter Host-/Adapter-Weg fuer Runtime-Diagnose, nicht Teil des funktionierenden UI-Editor-kit-Kerns. |
| `src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js` | M4 | Read-only HostAdapter fuer `restarbeiten.ui.main` | ja, indirekt | nein | einfrieren | Liefert Registry und Layout-State fuer Runtime-Diagnose, ohne Schreibzugriff. |

## Pruefhinweise
- Es gibt bereits eine funktionierende UI-Editor-Registrierung im etablierten Pfad `src/renderer/uiEditor/bbmUiEditorRegistry.js` mit den Scope-Eintraegen fuer Protokoll, Demo und Restarbeiten.
- M2-M4 importieren keine Legacy-Dateien wie `src/renderer/editor.js`, `src/renderer/editor.html` oder `src/main/ipc/editorIpc.js`.
- M2-M4 importieren keine Demo-/Lab-Editorpfade aus `src/renderer/uiEditor/demo`, `src/renderer/uiV2/editorLab` oder `src/renderer/uiV2/editorV2`.
- Es entsteht keine neue Markierungslogik und keine neue UI-Registrierung fuer den bestehenden funktionierenden Mechanismus.

## Empfehlung
- M2 behalten.
- M3 einfrieren.
- M4 einfrieren.

## Offener Punkt
Wenn der Runtime-Unterbau spaeter wirklich in den produktiven UI-Editor-Mechanismus ueberfuehrt werden soll, braucht es eine separate Entscheidung, welcher der beiden Wege kanonisch ist und welcher nur Beifang bleibt.
