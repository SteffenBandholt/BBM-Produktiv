# UI-Editor Surface read-only Phase Abnahmereferenz

## Kurzfazit

Die gesamte aktuelle read-only Surface-Phase ist als abgeschlossener
Referenzstand dokumentiert. `restarbeiten.ui.main` bleibt Host-/Bestandssurface;
`pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar;
SurfaceInfo bleibt bewusst `restarbeiten.ui.main`. Es gibt keine echte
Surface-Umschaltung, kein Drag, kein Resize und keine Persistenz.

## Abgeschlossener read-only Phasenstand

- G80 hat den reproduzierbaren Zielpfad zur Restarbeiten-Ansicht geklaert.
- G81 hat die PDF-Plan-Abnahmereferenz gebuendelt.
- G83 hat `plan.canvas.default` read-only sichtbar freigegeben.
- G84 hat den Zwei-Surface-Sichtstand dokumentarisch abgesichert.
- G85 schliesst diese Kette als gesamte read-only Surface-Phase ab.

## Freigegebene SurfaceIds

```text
read-only sichtbar:
- pdf.plan.page.1
- plan.canvas.default

Host-/Bestandssurface:
- restarbeiten.ui.main
```

## Sichtbarer Zielzustand

```text
Surface-Auswahl:
- Restarbeiten
- PDF Plan Seite 1
- Plan Canvas

SurfaceInfo:
- restarbeiten.ui.main
```

Falls die laufende UI eine kombinierte Bezeichnung oder abweichende sichtbare
Texte verwendet, gilt der tatsachlich sichtbare Text aus dem Launcher.

## SurfaceInfo-Verhalten

- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`
- keine zweite SurfaceInfo
- keine Umschaltung auf `pdf.plan.page.1`
- keine Umschaltung auf `plan.canvas.default`

## Reproduzierbarer Klickpfad

```text
Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor
```

## Weiterhin blockierte SurfaceIds

```text
weiterhin blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

## Weiterhin nicht aktivierte Funktionen

- keine echte Surface-Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- keine DB-/IPC-Schreibwege
- kein localStorage
- kein writeFile
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Testabdeckung

- `node scripts/tests/surfacePolicy.test.cjs`
- `node scripts/tests/surfaceSelectionModel.test.cjs`
- `node scripts/tests/surfaceSelectionState.test.cjs`
- `node scripts/tests/surfaceSwitchModel.test.cjs`
- `node scripts/tests/surfaceSwitchCommand.test.cjs`
- `node scripts/tests/surfaceAdapterCatalog.test.cjs`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Sichtpruefungsstand

Die sichtbaren Einzelstaende aus G80, G83 und G84 bleiben als Referenz
gueltig. G85 fuehrt keine neue manuelle Sichtpruefung ein, sondern buendelt
die bestaetigten read-only Nachweise zu einer abgeschlossenen Phase.

## Offene Grenzen

- keine weitere Surface ueber `pdf.plan.page.1` und `plan.canvas.default`
  hinaus
- keine sichtbare UI-Aenderung
- keine Produktivlogik
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz

## Empfohlene naechste Phase

Wenn spaetere Anpassungen benoetigt werden, sollen sie als eigene, klein
geschnittene Pakete folgen: weitere Surface-Freigaben, echte Umschaltung,
Drag/Resize und Persistenz getrennt voneinander und erst nach neuer Freigabe.

## Nachtrag G89

- Die technische Guardrail-Absicherung ist jetzt zusaetzlich in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`
  dokumentiert.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar,
  aber keine aktive Bearbeitungs-Surface.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`; keine aktive
  Umschaltung, keine Persistenz und keine Schreibwege.

## Nachtrag G87

- Die Surface-Auswahl ist jetzt fachlich als read-only Sichtbarkeits-/Kontextanzeige
  eingeordnet.
- Die aktuelle Auswahl bleibt keine aktive Surface-Umschaltung.
- Die Entscheidung steht in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md`.

## Nachtrag G88

- Der Surface-Auswahl-Kontext ist jetzt als Referenzstand in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`
  abgesichert.
- Die read-only Surface-Phase bleibt unveraendert abgeschlossen.

## Nachtrag G86

- Die naechste Diskussion zur echten Surface-Umschaltung wird jetzt in
  `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md`
  vorbereitet.
- Die read-only Phase bleibt unveraendert abgeschlossen.
