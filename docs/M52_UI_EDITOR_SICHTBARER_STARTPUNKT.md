# M52 UI-Editor sichtbarer Startpunkt

## Zweck

M52 integriert einen bewusst kleinen sichtbaren Startpunkt fuer den UI-Editor in BBM. Das Paket macht die technische M51-Anbindung erstmals aus der bestehenden BBM-Oberflaeche erreichbar, baut aber keinen vollstaendigen visuellen Layout-Editor.

## Sichtbarer Einstieg

Der Einstieg liegt in der bestehenden linken BBM-Navigation als kleiner Eintrag `UI-Editor Status` neben den vorhandenen Kernzielen. Er oeffnet eine kompakte Statusansicht und startet nicht automatisch beim App-Start.

Der Einstieg verdraengt keine Fachfunktion und gilt nur fuer den in M51 erlaubten BBM-Scope `bbm.main`. Der neue M52-Einstieg ist vom alten In-Place-Editor entkoppelt und ruft ausschliesslich `router.showUiEditor()` auf.

## Verwendete Runtime

Die Ansicht verwendet die vorhandene M51-Startfunktion:

- `src/ui-editor/start-bbm-ui-editor-runtime.cjs`
- `startBbmUiEditorRuntime()`
- `getBbmUiEditorIntegrationStatus()`

Es werden keine internen Dateien aus `ui-editor-kit` importiert und keine Core-Logik kopiert. Die Ziel-App nutzt weiterhin die explizite M51-Registry.

## Renderer-/IPC-Anbindung

Da die M51-Dateien CommonJS-Module sind und der Renderer mit `contextIsolation` und ohne `nodeIntegration` laeuft, erfolgt die Anbindung ueber eine eng begrenzte IPC-Bruecke:

- Main: `src/main/ipc/uiEditorIpc.js`
- Preload: `window.bbmDb.uiEditorOpen()`
- Preload: `window.bbmDb.uiEditorClose()`
- Preload: `window.bbmDb.uiEditorGetStatus()`
- Preload: `window.bbmDb.uiEditorGetElements()`
- Preload: `window.bbmDb.uiEditorSelectElement({ elementId })`
- Preload: `window.bbmDb.uiEditorGetSelectedElementDetails()`

Die Runtime wird pro Editor-Sitzung nur einmal initialisiert. Schliessen setzt die Sitzung und Auswahl zurueck.

## Angezeigte Statuswerte

Das Panel zeigt neutral:

- Titel `UI-Editor`
- `UI-Editor-kit v0.2.0`
- Ziel-App `BBM`
- `targetAppId`
- Runtime gestartet: Ja/Nein
- Adapter gueltig: Ja/Nein
- aktiver UI-Scope
- aktiver Layout-Scope
- aktives Layoutprofil
- Anzahl registrierter Elemente
- LayoutStore verfuegbar
- Layoutzustand fuer Scope/Profil vorhanden
- technische Verfuegbarkeit von Load/Save/Reset
- neutraler Blockcode bei Fehlern

## Elementauswahl

Die Elementliste zeigt ausschliesslich explizit registrierte Elemente aus `src/ui-editor/bbm-ui-element-registry.cjs` im Scope `bbm.main`.

Die Auswahl erfolgt nur per `elementId`. Unbekannte IDs werden durch den M51-HostAdapter blockiert und als neutraler Blockcode angezeigt. Es gibt keine Auswahl durch Klick auf die echte BBM-Oberflaeche.

Der Detailbereich zeigt nur neutrale Metadaten:

- Element-ID
- Bezeichnung
- Typ
- Scope
- Parent
- Capabilities
- erlaubte Aenderungen

## Sicherheitsgrenzen

M52 fuehrt nicht ein:

- keine DOM-Erkennung
- UI-Scan
- Hover-Scanner
- Overlay-Rahmenmodus
- automatische Registry-Befuellung
- generische IPC-Ausfuehrung
- `eval`
- unsicheres `nodeIntegration`
- Abschalten von `contextIsolation`
- Fachdatenspeicherung
- Datenbankmigration
- PDF-, Druck-, Mail- oder Audio-Funktion
- neue externe UI-Bibliothek

## Bekannte Einschraenkungen

- Es gibt noch keine vollstaendige Layoutbearbeitung.
- Es gibt kein Drag-and-drop, Resize, Farb- oder Schriftbearbeitung.
- Die vorhandene MemoryLayoutStateStore-Anbindung ist nur technisch sichtbar; M52 speichert keine dauerhaften Layoutzustaende.
- Nicht registrierte BBM-Bereiche werden nicht bearbeitet.

## Testablauf

Geplante/ausgefuehrte Pruefungen fuer M52:

1. `git diff --check`
2. M51-Integrationstest
3. `scripts/tests/m52UiEditorVisibleEntry.test.cjs`
4. vollstaendige BBM-Testsuite ueber `npm test`

## Abgrenzung zu M53

M53 kann auf diesem Startpunkt aufbauen und gezielt entscheiden, welche ungefaehrlichen Layoutoperationen sichtbar bedienbar werden. Dauerhafte Layoutspeicherung, echte Layoutbearbeitung und weitere Scopes bleiben ausdruecklich spaetere, separat zu entscheidende Pakete.
