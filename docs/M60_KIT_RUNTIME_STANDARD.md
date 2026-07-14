# M60 – UI-Editor-kit Selection-Runtime als Standard

## Ziel
M60 macht die in M59 parallel integrierte generische Selection-Runtime aus dem UI-Editor-kit im Entwicklungsbetrieb zur Standard-Auswahlruntime des bestehenden UI-Editor-Statuspanels.

## Startlogik
- Ein neues `BbmUiEditorStatusPanel` startet sitzungsbezogen mit `selectionRuntime === "kit"`.
- Nach dem erfolgreichen Öffnen des Statuspanels und dem Laden der bestehenden BBM-Registry-Elemente wird die Kit-Runtime kontrolliert initialisiert.
- Die Initialisierung nutzt weiterhin die M59-Host-Bridge `src/renderer/ui-editor/bbmKitSelectionHost.js`.
- Die Host-Bridge verwendet nur die bestehende Registry-Liste, den M54-Ref-Store und den M52-Auswahlstatus.
- Das Dropdown zeigt nach der Initialisierung die tatsächlich aktive Runtime.

## Rückfalllogik auf BBM
BBM bleibt der vollständige Rückfallweg.

Wenn die Kit-Runtime beim Initialisieren fehlschlägt:
- wird ein eventuell angefangener Kit-Controller gestoppt, zerstört und verworfen,
- `selectionRuntime` wird auf `"bbm"` gesetzt,
- `selectionController` zeigt wieder auf den bestehenden `bbmSelectionController`,
- der Runtime-Fehler bleibt im Statuspanel sichtbar,
- das Dropdown zeigt `BBM`, weil es immer aus der tatsächlich aktiven Runtime gerendert wird.

Bei einem Runtime-Fehler im laufenden Kit-Betrieb wird ebenfalls auf BBM zurückgestellt. Damit bleiben keine halbinitialisierten Kit-Controller oder Kit-Overlays als aktive Runtime übrig.

## Lifecycle und Cleanup
- Beim Schließen oder Zerstören des Panels wird der Kit-Controller gestoppt und zerstört.
- Beim Wechsel von Kit zu BBM wird Kit vorher bereinigt.
- Beim Wechsel zurück zu Kit wird ein neuer Controller über die bestehende Kit-Bridge erzeugt.
- Wiederholtes Öffnen oder wiederholtes Aktualisieren erzeugt pro Panel-Sitzung keinen zweiten Kit-Controller, solange ein gültiger Controller existiert.
- BBM-Hover- und BBM-Selected-Overlays bleiben erhalten, werden aber bei aktiver Kit-Runtime nicht parallel benutzt.

## Grenzen
- Keine Änderung am UI-Editor-kit-Repository.
- Keine neue Registry.
- Keine Persistenz der Runtime-Auswahl.
- Keine Fachlogik und keine Fachdaten.
- Keine Layoutänderung.
- Keine DOM-Suche, kein UI-Scan und keine automatische Bestandserkennung.

## Prüfungen
- Neuer gezielter M60-Test: `scripts/tests/m60KitRuntimeStandard.test.cjs`.
- Bestehender M59-Test bleibt als Sicherheitsprüfung für Host-Bridge, Runtime-Exklusivität und verbotene Nebenwege erhalten.
- Der vorhandene Gesamt-Testlauf bindet M60 über `scripts/test.cjs` ein.

## Offene manuelle Prüfung
Die sichtbare Windows-Abnahme bleibt offen: Im echten Electron-Fenster ist noch manuell zu prüfen, dass das Statuspanel beim Öffnen `UI-Editor-kit` aktiv zeigt, der Rückfall auf BBM sichtbar bleibt und keine doppelten Hover- oder Selected-Overlays entstehen.
