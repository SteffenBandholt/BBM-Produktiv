# UI-Editor Surface read-only Integrations-/Freigabecheck

## Kurzfazit

Der read-only Surface-Gesamtstand ist technisch konsistent und als
Integrationsbasis vor einem spaeteren Produktivschritt freigehalten. Sichtbar
bleibt nur `restarbeiten.ui.main`; seit G75 darf `pdf.plan.page.1` read-only
sichtbar erscheinen. Die Kette aus
SurfaceRuntime-Bridge, SurfaceAdapterCatalog, SurfacePolicy,
SurfaceSelectionModel, SurfaceSelectionState, SurfaceSwitchModel,
SurfaceSwitchCommand und Launcher-read-only-Anbindung bleibt defensiv und
ohne echte Umschaltung.

## Gepruefte Komponenten

- `SurfaceRuntime-Bridge`
- `SurfaceAdapterCatalog`
- `SurfacePolicy`
- `SurfaceSelectionModel`
- `SurfaceSelectionState`
- `SurfaceSwitchModel`
- `SurfaceSwitchCommand`
- Launcher-read-only-Anbindung

## Aktueller erlaubter Surface-Bereich

```text
erlaubt / resolved / sichtbar:
- restarbeiten.ui.main
- pdf.plan.page.1
```

## Blockierte SurfaceIds

```text
blockiert:
- plan.canvas.default
- unbekannte SurfaceIds
- *
- leere IDs
```

## Sichtbare UI-Grenze

- sichtbar bleiben `Restarbeiten` und `PDF Plan Seite 1`
- SurfaceInfo bleibt `restarbeiten.ui.main` / `ui-screen` / Elementanzahl
- keine Surface-Liste
- kein Dropdown
- keine weitere Surface-Auswahl
- keine sichtbare PDF-/Plan-Oberflaeche

Der sichtbare G75-Stand ist zusaetzlich in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` dokumentiert.
Die offene Einordnung der SurfaceInfo dazu liegt in
`docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`.

## Sicherheitsgrenzen

- read-only
- keine echte Surface-Umschaltung
- keine Launcher-Produktivintegration
- keine sichtbare UI-Aenderung
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- kein Bare-Package-Import im Renderer
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Offene Freigabeentscheidungen vor echter Umschaltung

- separate Freigabe fuer produktive Surface-Umschaltung
- `pdf.plan.page.1` ist bereits als read-only sichtbare PDF-Surface freigegeben
- `plan.canvas.default` bleibt separat blockiert
- separate Freigabe fuer weitere SurfaceIds
- separate Freigabe fuer Drag
- separate Freigabe fuer Resize
- separate Freigabe fuer Persistenz

## Moegliche naechste Pakete

- echte Surface-Umschaltung als eigenes Freigabepaket
- weitere SurfaceIds nur ueber eigene Policy-Freigabe
- sichtbare PDF-/Plan-Surfaces fuer `pdf.plan.page.1` sind read-only freigegeben
- Drag, Resize und Persistenz jeweils separat behandeln
- die Freigabematrix fuer die naechste Surface-Phase liegt in
  `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md`
- die PDF/Plan-Bewertung liegt in
  `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`
- die Surface-Policy-Freigabevorlage liegt in
  `docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md`
- der konkrete Kandidat liegt in
  `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md`
