# UI-Editor Hinweis-Infotext Host-Kontext Uebergabe Restarbeiten Referenzstand

## Kurzfazit

G122 schliesst die echte Host-Kontext-Uebergabe aus dem BBM-Restarbeiten-Host
an den UI-Editor an. Uebergeben wird nur der Host-Kontext fuer eine eindeutig
gemeinte Restarbeit. Speichern bleibt weiter gesperrt.

## Ausgangslage

- G121 hat die Freigabeentscheidung dokumentiert.
- Der Launcher kann optional einen Host-Kontext aufnehmen.
- `normalizeHostContextStatus` bleibt die normative Pruefung.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.

## Freigegebener Umfang

- echte Host-Kontext-Uebergabe nur bei eindeutiger Restarbeit
- sichtbarer Host-Kontext im UI-Editor
- keine neue Speicherung und kein neuer Schreibweg
- keine Aenderung an `../UI-Editor-kit`

## TatsÃ¤chlicher technischer Uebergabepunkt

- `RestarbeitenScreen.getUiEditorHostContext()`
- `CoreShell.resolveUiEditorHostContext(router)`
- `installBbmUiEditorRuntimeLauncher({ hostContext })`

Der Host liefert den Kontext nur, wenn die aktuelle Restarbeit eindeutig ist.
CoreShell reicht diesen Kontext nur weiter und installiert ihn nicht selbst.

## Verwendete Host-Daten

- `projectId`
- `restarbeitId`
- `targetContext: Restarbeiten`
- `targetSurfaceId: restarbeiten.ui.main`
- `targetLabel`
- `elementType: Hinweis / Infotext`
- `source: BBM-Restarbeiten-Host`

## Verhalten bei gueltigem Host-Kontext

- `Restarbeit-Kontext vorhanden: ja`
- konkrete `restarbeitId`
- konkrete `Ziel-Restarbeit`
- `Kontextquelle: BBM-Restarbeiten-Host`
- `Speichern bleibt gesperrt`
- Button `Entwurf speichern` bleibt deaktiviert

## Verhalten bei fehlendem Host-Kontext

- `restarbeitId: nicht uebergeben`
- `Ziel-Restarbeit: nicht ausgewÃ¤hlt`
- `Restarbeit-Kontext vorhanden: nein`
- `Speichern bleibt gesperrt`
- Button `Entwurf speichern` bleibt deaktiviert

## Verhalten bei ungueltigem Host-Kontext

- falsche SurfaceId bleibt blockiert
- falscher Elementtyp bleibt blockiert
- leeres `targetLabel` bleibt blockiert
- fehlende `projectId` oder `restarbeitId` bleiben blockiert
- `isPresent` faellt auf `false` zurueck

## Warum Speichern weiterhin gesperrt bleibt

- kein aktiver Speicherbutton
- kein Submit
- kein Speichern
- keine persistente Element-Erstellung
- kein Speichern ueber Payload-Vorschau
- kein Speichern beim Tippen

## Keine IPC-/DB-Anbindung

- keine IPC-/DB-Schreibaktion
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- `persisted: false` bleibt verbindlich
- der Host-Kontext wird nur gelesen und angezeigt
- keine neue Persistenz wird aktiviert

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt SurfaceInfo
- keine aktive Surface-Umschaltung
- kein SurfaceInfo-Umbau

## Weiterhin blockiert

- Speichern
- Submit
- aktive Surface-Umschaltung
- Drag
- Resize
- PDF-/Plan-Bearbeitung
- IPC-/DB-Schreibweg
- neues Speicherziel

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil Renderer- und Host-Code geaendert wurden. Zu pruefen sind
der Default ohne Host-Kontext und der konkrete Restarbeiten-Kontext mit
sichtbarer `restarbeitId` und `Ziel-Restarbeit`.

## Empfohlener naechster Schritt

Den neuen Host-Kontext nur als lesende Voraussetzung stehen lassen und den
Speicherweg weiterhin getrennt behandeln.
