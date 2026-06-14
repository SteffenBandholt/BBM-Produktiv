# UI-Editor PDF/Plan Surface read-only Bewertung

## Kurzfazit

PDF- und Plan-Surfaces sind technisch im Katalog vorhanden, aber fachlich und
im Launcher weiter read-only blockiert. Sichtbar bleibt ausschliesslich
`restarbeiten.ui.main`. Diese Bewertung ordnet den spaeteren Nutzen einer
moeglichen Sichtbarkeit ein, ohne die jetzige Grenze zu verschieben.

## Aktueller PDF/Plan-Stand

- `pdf.plan.page.1` ist im Katalog vorhanden
- `plan.canvas.default` ist im Katalog vorhanden
- beide Surfaces sind aktuell nicht sichtbar
- beide Surfaces sind aktuell nicht auswaehlbar
- beide Surfaces sind aktuell nicht als echte Interaktionsziele aktiviert
- `restarbeiten.ui.main` bleibt sichtbar / resolved

## Vorhandene SurfaceIds

```text
vorhanden, aber blockiert:
- pdf.plan.page.1
- plan.canvas.default

sichtbar / resolved:
- restarbeiten.ui.main
```

## Aktueller Blockierstatus

- `surfaceAdapterCatalog.js` kennt die PDF-/Plan-Surfaces
- `surfacePolicy.js` setzt fuer beide keine Editor-Sichtbarkeit
- `surfaceSelectionModel.js` nimmt nur sichtbare Editor-Surfaces auf
- `surfaceSelectionState.js` und `surfaceSwitchModel.js` halten die read-only
  Ein-Surface-Grenze
- `surfaceSwitchCommand.js` resolved weiterhin nur `restarbeiten.ui.main`

## Fachlicher Nutzen einer spaeteren Sichtbarkeit

### `pdf.plan.page.1`

- Zweck waere eine fachliche read-only Sicht auf eine konkrete PDF-Seite
- sichtbar werden koennten Seite, SurfaceId und ein kontrollierter
  Navigations-/Referenzkontext
- sinnvoll waere das nur, wenn Nutzer PDF-Inhalte fachlich vergleichen oder
  referenzieren sollen, ohne zu bearbeiten
- noch nicht sinnvoll waere eine Bedienoberflaeche mit Auswahl, Drag oder
  Bearbeitung

### `plan.canvas.default`

- Zweck waere eine fachliche read-only Sicht auf eine Plan- oder Canvas-Fläche
- sichtbar werden koennten SurfaceId, Oberflächentyp und ein neutraler
  Referenzkontext
- sinnvoll waere das nur, wenn Plan-/Canvas-Bezug spaeter als feste
  Referenzflaeche geprueft werden muss
- noch nicht sinnvoll waere eine Interaktion mit Position, Groesse oder
  Bearbeitungswerkzeugen

## Technische Voraussetzungen

- eigene SurfaceId-Freigabe pro Surface
- explizite Policy-Freigabe fuer Sichtbarkeit
- getrennte Tests fuer Sichtbarkeit, Auswahl und Blockaden
- weiterhin keine Launcher-Produktivintegration
- weiterhin keine Persistenz
- weiterhin keine Drag-/Resize-Freigabe

## Risiken

- Sichtbarkeit kann als stille Vorstufe fuer Interaktion missverstanden werden
- PDF/Plan ohne saubere Policy koennen die aktuelle Ein-Surface-Grenze
  verwischen
- ein vorzeitiger Default-Adapter oder eine Wildcard-Freigabe wuerde die
  Freigabelogik aufweichen
- Drag/Resize/Persistenz duerfen nicht heimlich an eine bloesse Sichtbarkeit
  gekoppelt werden

## Harte Grenzen

- PDF/Plan bleiben in G72 unsichtbar
- PDF/Plan bleiben nicht auswählbar
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- keine PDF-/Plan-Renderintegration
- keine Plan-/Canvas-Interaktion
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Stop-/Go-Kriterien

### Go fuer spaetere read-only Sichtbarkeit

- klare fachliche SurfaceId-Freigabe liegt vor
- Policy-Freigabe erfolgt explizit
- Sichtbarkeit bleibt eindeutig read-only
- keine Bearbeitungsbuttons entstehen
- keine Persistenz entsteht
- Tests sichern PDF/Plan weiter gegen Drag, Resize und Persistenz ab
- Electron-Sichtpruefung ist moeglich

### Stop

- PDF/Plan werden automatisch sichtbar
- PDF/Plan werden ohne explizite Policy-Freigabe auswaehlbar
- Drag, Resize oder Persistenz werden implizit aktiviert
- ein Default-Adapter oder eine Wildcard entsteht
- Schreibwege entstehen
- Surface-Auswahl zeigt mehrere Eintraege ohne Freigabeschritt

## Empfohlene naechste Schritte

1. PDF/Plan weiter read-only fachlich getrennt bewerten.
2. Erst danach ueber eine Sichtbarkeit fuer `pdf.plan.page.1` oder
   `plan.canvas.default` entscheiden.
3. Eine spaetere Freigabe immer von einer expliziten Policy und einem eigenen
   Testpaket begleiten lassen.
4. Vor jeder weiteren Surface-Phase die aktuelle Ein-Surface-Grenze
   testseitig konservieren.

Die spaetere explizite Freigabevorlage ist in
`docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md` vorbereitet, gibt aber
selbst noch nichts frei.

Der erste konkrete Kandidat fuer spaetere Einzelfreigabe ist
`docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md`.
