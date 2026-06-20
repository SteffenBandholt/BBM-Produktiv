# UI-Editor Hinweis-Infotext Restarbeit-Kontext fehlt UI-Referenzstand

## Kurzfazit

Im sichtbaren Speicherbereich wird jetzt ehrlich angezeigt, dass der notwendige
Restarbeiten-Host-Kontext noch fehlt. Der Speicherweg bleibt dabei gesperrt.

## Sichtbare Restarbeit-Kontextanzeige

- `Restarbeit-Kontext`
- `Zielkontext: Restarbeiten`
- `restarbeitId: nicht übergeben`
- `Ziel-Restarbeit: nicht ausgewählt`
- `Kontextquelle: BBM-Restarbeiten-Host erforderlich`
- `Speichern bleibt gesperrt`
- `Restarbeit-Kontext vorhanden: nein`

## Warum `restarbeitId` noch nicht vorhanden ist

- Der UI-Editor-Launcher hat den Host-Kontext noch nicht übergeben bekommen.
- Die Entscheidung aus G114 bleibt gültig: `restarbeitId` darf nicht im UI-
  Editor gesucht oder geraten werden.
- Solange der Host sie nicht liefert, bleibt der Zustand sichtbar leer.

## Warum Speichern weiter gesperrt bleibt

- `restarbeitId` fehlt.
- Es gibt keine Kontextübergabe.
- Es gibt keinen angeschlossenen Schreibweg.
- Der Button `Entwurf speichern` bleibt deaktiviert.

## Abgrenzung zur späteren Host-Übergabe

- Später darf nur der konkrete BBM-Restarbeiten-Host die Ziel-Restarbeit
  übergeben.
- Diese Anzeige ist keine Übergabe und keine Vorstufe für einen aktiven
  Speicherweg.
- `UI-Editor-kit` speichert nicht.

## Keine IPC-/DB-Anbindung

- kein IPC-Aufruf
- kein DB-Aufruf
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- `persisted: false` bleibt sichtbar.
- Es gibt keine persistente Element-Erstellung.
- Der Entwurf bleibt rein lokal.

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt SurfaceInfo.
- keine echte Surface-Umschaltung
- kein SurfaceInfo-Umbau

## Weiterhin blockiert

- aktiver Speicherbutton
- Submit
- Speichern
- Kontextsuche oder Kontext-Raten
- persistente Element-Erstellung
- IPC-/DB-Schreibweg
- Drag
- Resize
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtprüfung

Erforderlich, weil sichtbare UI geaendert wurde. Geprueft werden Sichtbarkeit,
Lesestatus und die Trennung zwischen fehlendem Host-Kontext und gesperrtem
Speichern.

## Empfohlener naechster Schritt

Die Anzeige nur als lesenden Zwischenstand stehen lassen, bis die konkrete
Host-Übergabe bewusst freigegeben und technisch umgesetzt wird.

## G116: Host-Kontext-Datenvertrag

- Der spaetere Datenvertrag wird in
  `docs/UI_EDITOR_HINWEIS_INFOTEXT_HOST_KONTEXT_DATENVERTRAG.md`
  dokumentiert.
- `projectId` und `restarbeitId` bleiben Host-Daten und werden im
  UI-Editor nicht geraten.
