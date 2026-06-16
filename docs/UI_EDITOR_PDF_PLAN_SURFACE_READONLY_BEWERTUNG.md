# UI-Editor PDF/Plan Surface read-only Bewertung

## Kurzfazit

PDF- und Plan-Surfaces sind technisch im Katalog vorhanden und im Launcher
jetzt read-only sichtbar. `restarbeiten.ui.main` bleibt Host-/Bestandssurface;
Drag, Resize und Persistenz bleiben getrennt blockiert.

## Aktueller PDF/Plan-Stand

- `pdf.plan.page.1` ist im Katalog vorhanden
- `plan.canvas.default` ist im Katalog vorhanden
- `pdf.plan.page.1` ist read-only sichtbar
- `plan.canvas.default` ist read-only sichtbar
- `pdf.plan.page.1` ist nur read-only sichtbar und bleibt ohne Bearbeitung
- `plan.canvas.default` ist als Plan Canvas read-only sichtbar und bleibt ohne Bearbeitung
- beide Surfaces bleiben ohne echte Interaktionsziele
- `restarbeiten.ui.main` bleibt vorhanden und traegt weiterhin die SurfaceInfo

## Vorhandene SurfaceIds

```text
sichtbar, aber nur read-only:
- pdf.plan.page.1
- plan.canvas.default

weiterhin vorhanden:
- restarbeiten.ui.main
```

## Aktueller Blockierstatus

- `surfaceAdapterCatalog.js` kennt die PDF-/Plan-Surfaces
- `surfacePolicy.js` setzt fuer `pdf.plan.page.1` und
  `plan.canvas.default` read-only Sichtbarkeit
- `surfaceSelectionModel.js` nimmt die sichtbaren Editor-Surfaces auf
- `surfaceSelectionState.js` haelt die read-only Sichtbarkeit auf den
  expliziten read-only Stand mit Host und freigegebenen Oberflaechen
- `surfaceSwitchModel.js` und `surfaceSwitchCommand.js` erlauben
  `pdf.plan.page.1` und `plan.canvas.default` read-only, ohne echte
  Umschaltung oder Persistenz

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

## Nachtrag G82

`plan.canvas.default` ist jetzt zusaetzlich read-only sichtbar freigegeben.
Die Bewertung verweist auf das neue Referenzdokument
`docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_POLICY_REFERENZSTAND.md`.

## Status nach G75 / G76

`pdf.plan.page.1` ist nun als read-only Surface sichtbar freigegeben.
`plan.canvas.default` ist ebenfalls read-only sichtbar. Die sichtbare Surface-
Auswahl darf damit zwei read-only Oberflaechen zeigen, ohne Drag, Resize oder
Persistenz zu aktivieren.

G76 dokumentiert die sichtbare Referenz zusaetzlich:

- Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`
- SurfaceInfo bleibt auf `restarbeiten.ui.main`
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
