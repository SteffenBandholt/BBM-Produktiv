# UI-Editor Surface read-only Integrations-/Freigabecheck

## Kurzfazit

Der read-only Surface-Gesamtstand ist technisch konsistent und als
Integrationsbasis vor einem spaeteren Produktivschritt freigehalten. Sichtbar
bleiben `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`;
SurfaceInfo bleibt dabei auf `restarbeiten.ui.main`, und die Hinweisspur
bleibt rein informativ. Die Kette aus
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
- plan.canvas.default
```

## Blockierte SurfaceIds

```text
blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

## Sichtbare UI-Grenze

- sichtbar bleiben `Restarbeiten`, `PDF Plan Seite 1` und `Plan Canvas`
- ein kleiner read-only Hinweis fuer `pdf.plan.page.1` ist sichtbar
- SurfaceInfo bleibt `restarbeiten.ui.main` / `ui-screen` / Elementanzahl
- keine Surface-Liste
- kein Dropdown
- keine weitere Surface-Auswahl
- keine sichtbare PDF-/Plan-Oberflaeche

Der sichtbare G75-Stand ist zusaetzlich in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` dokumentiert.
Die offene Einordnung der SurfaceInfo dazu liegt in
`docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`.
Der sichtbare Hinweisstand ist zusaetzlich in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_HINWEIS_REFERENZSTAND.md`
dokumentiert.

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
- `plan.canvas.default` ist ebenfalls read-only sichtbar
- separate Freigabe fuer weitere SurfaceIds
- separate Freigabe fuer Drag
- separate Freigabe fuer Resize
- separate Freigabe fuer Persistenz

## Moegliche naechste Pakete

- echte Surface-Umschaltung als eigenes Freigabepaket
- weitere SurfaceIds nur ueber eigene Policy-Freigabe
- sichtbare PDF-/Plan-Surfaces fuer `pdf.plan.page.1` sind read-only freigegeben
- `plan.canvas.default` ist ebenfalls read-only sichtbar
- Drag, Resize und Persistenz jeweils separat behandeln
- die Freigabematrix fuer die naechste Surface-Phase liegt in
  `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md`
- die PDF/Plan-Bewertung liegt in
  `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`
- die Surface-Policy-Freigabevorlage liegt in
  `docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md`
- der konkrete Kandidat liegt in
  `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md`

## Nachtrag G81

- Die abschliessende Referenz fuer den read-only PDF-Plan-Stand ist in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
  gebuendelt.
- Der Integrationscheck bleibt unveraendert: `restarbeiten.ui.main` bleibt
  Hoststand, `pdf.plan.page.1` bleibt read-only sichtbar und
  `plan.canvas.default` bleibt blockiert.

## Nachtrag G82

- `plan.canvas.default` ist nun nur als naechster Kandidat dokumentiert.
- Der Integrationscheck aendert keine Freigabe und keine Sichtbarkeit.
- `pdf.plan.page.1` bleibt read-only sichtbar, `restarbeiten.ui.main` bleibt
  Hoststand und `plan.canvas.default` bleibt blockiert.

## Nachtrag G83

- `plan.canvas.default` ist jetzt zusaetzlich read-only sichtbar freigegeben.
- Die Integrationsbasis bleibt defensiv und ohne echte Umschaltung.
- `restarbeiten.ui.main` bleibt Hoststand.

## Nachtrag G84

- Der Zwei-Surface-read-only-Stand ist jetzt zusaetzlich in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
  referenziert.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
- `restarbeiten.ui.main` bleibt Hoststand.

## Nachtrag G85

- Die gesamte read-only Surface-Phase ist jetzt abgeschlossen und in
  `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md`
  gebuendelt.
- `restarbeiten.ui.main` bleibt Hoststand.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.

## Nachtrag G86

- Die naechste Diskussionsstufe zur echten Surface-Umschaltung ist jetzt in
  `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md`
  beschrieben.
- Der Integrationscheck bleibt read-only und unveraendert.
- `restarbeiten.ui.main` bleibt Hoststand.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
