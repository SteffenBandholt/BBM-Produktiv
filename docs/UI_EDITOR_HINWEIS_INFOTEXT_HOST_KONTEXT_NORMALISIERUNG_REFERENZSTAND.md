# UI-Editor Hinweis-Infotext Host-Kontext Normalisierung Referenzstand

## Kurzfazit

Der UI-Editor-Renderer normalisiert den fehlenden Host-Kontext jetzt lokal
ueber `normalizeHostContextStatus`. Das bleibt eine read-only Vorstufe fuer
die sichtbare Restarbeit-Anzeige und ist keine echte Host-Uebergabe.

## Default ohne Host-Kontext

```text
projectId: null
restarbeitId: null
targetContext: Restarbeiten
targetSurfaceId: restarbeiten.ui.main
targetLabel: nicht ausgewählt
elementType: Hinweis / Infotext
source: BBM-Restarbeiten-Host erforderlich
isPresent: false
```

Dieser Default gilt immer dann, wenn kein gueltiger Host-Kontext uebergeben
wird.
UI-Editor-kit speichert nicht.

## Geltende Normalisierungsregeln

- `projectId` und `restarbeitId` muessen vorhanden und nicht leer sein.
- `targetContext` muss `Restarbeiten` sein.
- `targetSurfaceId` muss `restarbeiten.ui.main` sein.
- `targetLabel` darf nicht leer sein.
- `elementType` muss `Hinweis / Infotext` sein.
- Freie Zusatzfelder werden ignoriert.

Gueltige Werte werden getrimmt und als vorhandener Kontext mit
`isPresent: true` zurueckgegeben. Ungueltige Werte fallen auf den Default
ohne Host-Kontext zurueck.

## Bedeutung fuer die Anzeige

- Anzeige und Kontextvorbereitung ja
- Bearbeitung nein
- Speicherung nein
- aktive Surface-Umschaltung nein
- kein Drag
- kein Resize

## Keine IPC-/DB-Anbindung

- keine IPC-/DB-Anbindung
- kein IPC-Aufruf
- kein DB-Aufruf
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung

## Persistenzverhalten

- die Normalisierung bleibt lokal
- die Anzeige bleibt read-only
- keine Persistenz
- kein Speicherweg

## SurfaceInfo-Verhalten

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- `SurfaceInfo` bleibt `restarbeiten.ui.main`
- keine aktive Surface-Umschaltung

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- Drag
- Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Erforderlich, weil der Renderer-Code fuer die bestehende UI-Anzeige geaendert
wurde. Geprueft werden die sichtbare Restarbeit-Kontextanzeige, der gesperrte
Speicherzustand und `restarbeiten.ui.main`.

## Empfohlener naechster Schritt

Die Normalisierung nur als interne Vorstufe behalten, bis ein spaeterer Host
die echten Werte bewusst liefert.

## G119: Host-Kontext-Abschlusscheck

- Die Normalisierung bleibt als Abschlussstand erhalten.
- Es folgt keine echte Host-Uebergabe und kein Speicherweg.

## G120: Optionale Host-Kontext-Aufnahme

- Die Normalisierung bleibt auch fuer einen optional uebergebenen Kontext
  die einzige Bewertung.
- Ohne Uebergabe bleibt der Default unveraendert.
