# M62 BBM Selection Legacy Cleanup

## Ziel
Nach M61 ist die UI-Editor-kit Selection-Runtime die einzige aktive Auswahlruntime im BBM-Statuspanel. M62 entfernt die nicht mehr produktiv genutzte BBM-eigene Hover-/Selection-Runtime und zieht die Tests auf die Kit-Runtime beziehungsweise die BBM-Host-Bridge um.

## Geloeschte Dateien
- `src/renderer/ui-editor/bbmUiElementSelection.js`
- `src/renderer/ui-editor/bbmUiSelectionOverlay.js`
- `src/renderer/ui-editor/bbmUiSelectedOverlay.js`

Geloeschte Symbole:
- `createBbmUiElementSelectionController`
- `createBbmUiSelectionOverlay`
- `createBbmUiSelectedOverlay`
- alte BBM-Overlay-Attribute `data-bbm-ui-selection-hover-frame` und `data-bbm-ui-selected-frame`

## Ergebnis der Fundstellenpruefung
Produktiver Code:
- Kein produktiver Import der geloeschten BBM-Runtime bleibt bestehen.
- `src/renderer/ui-editor/BbmUiEditorStatusPanel.js` erzeugt ausschliesslich den Kit-Controller aus `ui-editor-kit/dist/selection-runtime.browser.mjs`.
- Die BBM-Bruecke bleibt `src/renderer/ui-editor/bbmKitSelectionHost.js`; sie liefert Registry-Ziele, M54-Refs, M52-Auswahlstatus und den Panel-Ausschluss an die Kit-Runtime.

Aktive Tests:
- `scripts/tests/m55UiElementSelection.test.cjs` prueft die M55-Aussagen jetzt ueber die Kit-Host-Bridge statt ueber den geloeschten BBM-Controller.
- `scripts/tests/m56PersistentSelectionFrame.test.cjs` prueft Persistenz, Reset, Stop, Close und Destroy weiter ueber das Statuspanel und einen testseitigen Kit-Controller.
- `scripts/tests/m62BbmSelectionLegacyCleanup.test.cjs` prueft geloeschte Dateien, produktive Importfreiheit, fehlende Legacy-Attribute und verbotene DOM-Suche.

Historische Dokumentation:
- M55-, M56-, M59-, M60- und M61-Dokumente bleiben historisch unverfaelscht und duerfen die damals vorhandene BBM-Runtime weiter nennen.
- Aktuelle Status-/Aufgabenhefttexte stellen die alte Runtime nicht mehr als aktive Runtime dar.

Reine Legacy-Kompatibilitaet:
- Keine benoetigte Legacy-Kompatibilitaetsdatei verbleibt fuer die alte Auswahlruntime.
- Verbleibende Fundstellen in historischen Dokumenten und Statushistorie sind bewusst historische Beschreibung, kein aktiver Runtime-Pfad.

## Bestaetigte Kit-Vertraege
- Hover verwendet ausschliesslich explizite Registry-Elemente und M54-Refs.
- Auswahl verwendet weiterhin M52 `selectedElement` als Quelle.
- Auswahl desselben Ziels synchronisiert die Kit-Runtime und unterdrueckt den doppelten Hover.
- Persistenter Auswahlrahmen, Reset, Stop, Close und Destroy werden ueber Kit-Controller/Host-Bridge abgedeckt.
- Wiederholtes Oeffnen erzeugt keinen zweiten Controller pro Panel-Sitzung.
- Es wurde keine verbotene DOM-Suche, keine zweite Registry, keine neue Auswahlhaltung, keine Speicherung und kein neuer IPC eingefuehrt.

## Verbleibende Legacy-Reste
- Historische Dokumentation und historische Statuszeilen zu M55/M56/M59/M60/M61 bleiben erhalten.
- Keine produktive Legacy-Runtime bleibt erhalten.

## Offene manuelle Pruefung
- Manuelle Windows-Abnahme der sichtbaren Kit-Auswahl im echten Electron-Fenster bleibt offen: Start, Hover, Auswahl, Reset, Stop, Close/Destroy und doppelte Overlayfreiheit.
