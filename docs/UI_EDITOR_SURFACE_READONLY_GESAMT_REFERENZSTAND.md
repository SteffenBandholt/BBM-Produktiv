# UI-Editor Surface read-only Gesamt-Referenzstand

## Kurzfazit

Der gesamte read-only Surface-Steuerungsstand ist als stabile Referenz
abgeschlossen. Im BBM-Launcher bleiben `restarbeiten.ui.main`,
`pdf.plan.page.1` und `plan.canvas.default` sichtbar; die SurfaceInfo
bleibt dabei auf `restarbeiten.ui.main`. Die Kette aus SurfaceAdapterCatalog,
SurfacePolicy,
SurfaceSelectionModel, SurfaceSelectionState, SurfaceSwitchModel und
SurfaceSwitchCommand arbeitet defensiv read-only. Es gibt keine echte
Surface-Umschaltung; sichtbare UI-Ergaenzungen bleiben auf die kompakte
Surface-Auswahl, den kleinen Read-only Hinweis und die bestehende SurfaceInfo
begrenzt.

## Aktueller Gesamtstand

- SurfaceRuntime-Bridge vorhanden.
- SurfaceAdapterCatalog vorhanden.
- SurfacePolicy vorhanden.
- SurfaceSelectionModel vorhanden.
- SurfaceSelectionState vorhanden.
- SurfaceSwitchModel vorhanden.
- SurfaceSwitchCommand vorhanden.
- BbmUiEditorRuntimeLauncher nutzt die read-only Kette defensiv.
- G70 bestaetigt den Gesamtstand zusaetzlich als Integrations-/Freigabecheck.
- G71 haelt die naechste Surface-Phase ueber eine Freigabematrix in
  `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md` offen.
- G72 bewertet PDF/Plan-Surfaces read-only in
  `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`, ohne Sichtbarkeit
  oder Auswahl freizugeben.
- G73 bereitet die Surface-Policy-Freigabevorlage in
  `docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md` vor, ohne eine Freigabe
  auszusprechen.
- G74 konkretisiert `pdf.plan.page.1` als einzelnen Freigabe-Kandidaten in
  `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md`, ohne die
  Policy zu aendern.
- G75 setzt `pdf.plan.page.1` nun per read-only Policy sichtbar frei; die
  Surface-Auswahl zeigt damit mehr als einen Eintrag.
- G76 sichert diesen sichtbaren G75-Stand zusaetzlich in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` ab; die
  Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`, waehrend die
  SurfaceInfo weiterhin `restarbeiten.ui.main` bleibt.
- G77 dokumentiert diese SurfaceInfo-Grenze als offene Entscheidung in
  `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`; empfohlen bleibt,
  das Verhalten vorerst nicht umzubauen.
- G78 ergaenzt dazu einen kleinen sichtbaren read-only Hinweis im bestehenden
  Panel; die SurfaceInfo bleibt trotzdem unveraendert auf
  `restarbeiten.ui.main`.
- G79 dokumentiert die getrennte manuelle Zielrouten-Sichtpruefung in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md`; BBM, Launcher
  und Projekte-Ansicht waren sichtbar, die konkrete Restarbeiten-Zielroute war
  in dieser Sitzung aber nicht reproduzierbar erreichbar.
- G83 setzt `plan.canvas.default` zusaetzlich read-only sichtbar frei; die
  Surface-Auswahl kann damit `Plan Canvas` anzeigen, waehrend die SurfaceInfo
  bewusst `restarbeiten.ui.main` bleibt.
- Die SurfaceInfo im Editorpanel bleibt im Default-Fall
  `restarbeiten.ui.main` / `ui-screen` / Elementanzahl.
- `changed` bleibt `false`.
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.
- UI-Editor-kit speichert nicht.

## Komponentenuebersicht

- `SurfaceRuntime-Bridge`: validiert das neutrale SurfaceModel im Kit.
- `SurfaceAdapterCatalog`: listet und validiert bekannte SurfaceIds.
- `SurfacePolicy`: definiert die read-only Sichtbarkeit und Blockaden.
- `SurfaceSelectionModel`: baut die sichtbare read-only Surface-Auswahl.
- `SurfaceSelectionState`: haelt den internen read-only Auswahlzustand.
- `SurfaceSwitchModel`: prueft Wechselwuensche defensiv gegen den State.
- `SurfaceSwitchCommand`: nimmt read-only Request-/Command-Wuensche an.
- `BbmUiEditorRuntimeLauncher`: bindet die read-only Kette im Launcher an.

## Gesamtdatenfluss

```text
BBM-Launcher
-> SurfaceSwitchCommand
-> SurfaceSwitchModel
-> SurfaceSelectionState
-> SurfaceSelectionModel
-> SurfacePolicy
-> SurfaceAdapterCatalog
-> SurfaceRuntime-Validierung
-> read-only SurfaceModel
-> Surface-Auswahl Restarbeiten
-> Read-only Hinweis fuer pdf.plan.page.1
-> SurfaceInfo restarbeiten.ui.main
```

Der Datenfluss bleibt modellhaft und defensiv. Er aktiviert keine produktive
Umschaltung, keine Bearbeitung und keine Speicherwege.

## Sichtbare UI-Grenze

```text
sichtbar:
- Surface-Auswahl: Restarbeiten
- Surface-Auswahl: PDF Plan Seite 1
- Surface-Auswahl: Plan Canvas
- Read-only Hinweis: PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.
- SurfaceInfo: restarbeiten.ui.main / ui-screen / Elementanzahl

nicht sichtbar:
- unbekannte SurfaceIds
- *
```

Die sichtbare Grenze bleibt stabil und kompakt. Es gibt keine Surface-Liste,
kein Dropdown und keine weiteren auswaehlbaren SurfaceIds.

## Erlaubte und blockierte SurfaceIds

```text
erlaubt / sichtbar / resolved:
- restarbeiten.ui.main
- pdf.plan.page.1
- plan.canvas.default

blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

## Sicherheitsgrenzen

- read-only
- keine echte Umschaltung
- keine neue Bedienlogik
- keine PDF-/Plan-Auswahl als Bearbeitung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- kein Bare-Package-Import im Renderer
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Ausdruecklich nicht aktiviert

- keine echte Surface-Umschaltung
- keine PDF-/Plan-Auswahl
- keine PDF-/Plan-Bearbeitung
- keine Surface-Liste mit mehreren Optionen
- kein Dropdown mit weiteren Optionen
- keine Bearbeitungsbuttons
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- UI-Editor-kit speichert nicht

## Moegliche naechste Pakete

- Echte Surface-Umschaltung nur als eigenes Freigabepaket.
- Weitere SurfaceIds nur ueber eigene Policy-/Allowlist-Freigabe sichtbar
  machen.
- PDF-/Plan-Surfaces separat read-only sichtbar machen, falls fachlich
  benoetigt.
- Drag, Resize und Persistenz jeweils getrennt planen, testen und sichtbar
  abnehmen.
- Launcher-UI nur bei expliziter Produktivfreigabe erweitern.

## Nachtrag G81

- Die gebuendelte Abnahmereferenz fuer `pdf.plan.page.1` ist jetzt in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
  zusammengefasst.
- Der Gesamt-Referenzstand bleibt unveraendert: `restarbeiten.ui.main`
  bleibt Hoststand, `pdf.plan.page.1` bleibt read-only sichtbar, und
  `plan.canvas.default` bleibt blockiert.

## Nachtrag G82

- `plan.canvas.default` wird jetzt nur als naechster Kandidat dokumentiert,
  ohne Freigabe und ohne Aenderung an der read-only Kette.
- Der Gesamt-Referenzstand bleibt bestehen: `pdf.plan.page.1` ist
  read-only sichtbar, `restarbeiten.ui.main` bleibt Hoststand, und
  `plan.canvas.default` bleibt blockiert.

## Nachtrag G84

- Der Zwei-Surface-read-only-Stand ist jetzt zusaetzlich in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
  abgesichert.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
- `restarbeiten.ui.main` bleibt Hoststand.

## Nachtrag G85

- Die gesamte read-only Surface-Phase ist jetzt als Abschlussreferenz in
  `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md`
  gebuendelt.
- `restarbeiten.ui.main` bleibt Hoststand.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.
- Weitere Surface-Freigaben, echte Umschaltung, Drag und Persistenz bleiben
  getrennte Folgepakete.
