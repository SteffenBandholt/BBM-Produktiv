# M61 – UI-Editor-kit Selection-Runtime exklusiv im Statuspanel

## Ziel
M61 entfernt die bisherige BBM-eigene Hover-/Selection-Runtime aus dem UI-Editor-Statuspanel. Die sichtbare Auswahl im Statuspanel laeuft damit ausschliesslich ueber die Selection-Runtime des UI-Editor-kits.

## Umgesetzt
- Das Statuspanel erzeugt keinen BBM-Auswahlcontroller mehr.
- Das Runtime-Dropdown wurde entfernt; die Statusanzeige meldet fest `UI-Editor-kit`.
- Kit-Initialisierung, Hover, Auswahl, Reset und Synchronisation laufen ueber den Kit-Controller und die bestehende Host-Bridge.
- Kit-Fehler werden weiterhin sichtbar als letzter Runtime-Fehler angezeigt.
- Es gibt keinen stillen Rueckfall mehr auf die alte BBM-Runtime.
- Schliessen und Destroy stoppen und zerstoeren nur noch den Kit-Controller.

## Bewusst nicht geaendert
- Keine Registry-Aenderung.
- Keine DOM-Suche und keine automatische UI-Erkennung.
- Keine Aenderung am UI-Editor-kit-Repo.
- Keine Aenderung an Layoutspeicherung, Fachdaten, IPC-Fachaktionen oder Datenbank.
- M54-Refs und M52-Auswahl bleiben die Integrationsbasis.
- Kein Umbau des gesamten Statuspanels.

## Pruefung
- `scripts/tests/m59KitSelectionRuntimeIntegration.test.cjs` prueft weiter Host-Bridge, Kit-Exklusivitaet, fehlendes Runtime-Dropdown, Lifecycle, Fehlerstatus und Sicherheitsgrenzen.
- `scripts/tests/m60KitRuntimeStandard.test.cjs` wurde auf die M61-Regel angepasst und prueft, dass Kit-Fehler sichtbar bleiben, ohne auf BBM zurueckzufallen.
- `scripts/test.cjs` fuehrt beide Tests als Teil der vollstaendigen Testsuite aus; `npm test` konnte in Codex Cloud wegen fehlender Electron-Systembibliothek `libatk-1.0.so.0` nicht vollstaendig laufen.

## Manuelle Abnahme offen
Codex Cloud kann die sichtbare Windows-/Electron-Bedienung nicht fachlich beurteilen. Manuell zu pruefen bleiben: UI-Editor oeffnen, Hover, Auswahl, Reset, Schliessen/Oeffnen ohne doppelte Listener oder Overlays sowie sichtbare Kit-Fehlermeldung.
