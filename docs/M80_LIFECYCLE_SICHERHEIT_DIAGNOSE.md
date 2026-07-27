# M80 – Lifecycle, Sicherheit und Diagnose

## Lokaler Transport

Je BBM-Sitzung werden zufälliger Pipe-Name, kryptografische Nonce und Sitzungs-ID erzeugt. Die Verbindung verwendet Protokollversion, Handshake vor Nutzdaten, Current-User-only, genau eine Verbindung, feste Nachrichtentypen, Korrelations-IDs, Größenlimit, Timeouts/Heartbeat, strukturierte Fehler und kontrollierten Disconnect. HTTP, WebSocket, Webserver, Browser, Netzwerk und Cloud sind ausgeschlossen.

Ein erster Sidebar-Aufruf startet die feste vertrauenswürdige Editor-EXE. Ein weiterer Aufruf sendet nur `activateEditor`; er startet keinen zweiten Manager- oder Node-Prozess. Renderer dürfen keinen Programmpfad angeben. BBM- und Editorende räumen Pipe, Auswahlmodus und Overlay auf.

## Entwicklung und Produktion

- Entwicklung: vorbereiteter Manager unter `build/ui-editor-manager` oder kontrollierter UI-Editor-kit-Debugbuild.
- Gepackt: `resources/ui-editor/UiEditorManager.exe` und `resources/ui-editor/editor-runtime`.
- Optionaler stabiler Installationsfallback: `%LOCALAPPDATA%\UI-Editor-kit\Manager\app`.

## Diagnose

`--bbm-electron-editor-diagnostic` beziehungsweise `BBM_M80_EDITOR_DIAGNOSTIC=1` rendert einen isolierten realen Restarbeiten-Screen mit einem nicht persistenten In-Memory-Datensatz. Es werden weder Kunden-/Produktivdaten noch Fachdatenbanken geändert. Der nur dort aktive Tastengriff `Ctrl+Shift+F8` armiert einmalig einen kontrollierten Applyfehler für den sichtbaren Rollbacknachweis. `Ctrl+Shift+F9` erhöht ausschließlich im Diagnosemodus eine kontrollierte Registryrevision, meldet `registryChanged` an den Host und setzt eine neutrale Baseline-Grenze. Damit lassen sich Reload und Dirty-Konfliktschutz ohne neue ID oder geänderte Fachbedeutung nachweisen.

Nachgewiesen wurden 43 E2E-Schritte mit echten sichtbaren Fenstern: Start, Sidebar, Handshake, Registry, Auswahl/Markierung in beide Richtungen, Layoutmodi, getrennte Sichtbarkeit, Tabelle, Fachaktionsschutz, Save/Load, Neustart-Restore, Discard, Reset, Rollback, Eininstanz, PDF-Abgrenzung, Editorende, BBM-Weiterbetrieb und vollständige Prozess-/Temporärbereinigung.

Die M80.1-Erweiterungsabnahme belegt zusätzlich alle 49 sichtbaren Editbox-Elemente, die sieben Knoten der Hauptliste mit exakt drei bestätigten Spaltengruppen, einen kompatiblen Registry-Reload auf genau eine neue Instanz, den sichtbaren `registry_profile_conflict` bei ungespeicherter Änderung und den anschließenden erfolgreichen Reload nach Discard. Der BBM-Neustart stellt das gespeicherte Layout ohne falschen Dirty-Zustand wieder her.
