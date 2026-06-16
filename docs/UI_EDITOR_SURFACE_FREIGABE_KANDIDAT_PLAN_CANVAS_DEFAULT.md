# UI-Editor Surface-Freigabe-Kandidat: plan.canvas.default

## Kurzfazit

`plan.canvas.default` ist jetzt explizit per Policy read-only sichtbar
freigegeben. Das Dokument bleibt als enger Bewertungs- und Referenzstand
erhalten, aber der Kandidat ist nicht mehr blockiert.

## Kandidat

- `plan.canvas.default`

## Aktueller Status

- vorhanden und read-only sichtbar
- auswählbar als weitere SurfaceId im read-only Auswahlstand
- `pdf.plan.page.1` bleibt bereits read-only sichtbar
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- keine Bearbeitung, kein Drag, kein Resize und keine Persistenz

## Fachlicher Nutzen einer weiteren read-only Sichtbarkeit

- Eine Plan- oder Canvas-Fläche kann als neutrale Referenz für Layout- und
  Oberflächenkontrolle dienen.
- Fachlich ist eine feste Sicht auf die Canvas hilfreich, wenn später reine
  Orientierung oder Vergleich ohne Bearbeitung benötigt wird.
- Die Surface kann als kontrollierter Kontext für technische Sichttests
  dienen, ohne eine echte Bearbeitung zu aktivieren.

## Technischer Nutzen

- Der Katalog kennt die SurfaceId bereits.
- Das Datenmodell für PDF-/Plan-Surfaces ist vorhanden.
- Policy, Selection, Switch-Modell und Launcher-Referenz sind bereits
  vorbereitet und können minimal erweitert werden.
- Eine spätere Einzelfreigabe bleibt technisch klein nachvollziehbar, wenn
  exakt eine SurfaceId angepasst wird.

## Technische Voraussetzungen

- explizite Policy-Freigabe nur fuer `plan.canvas.default`
- `pdf.plan.page.1` bleibt unveraendert read-only sichtbar
- unbekannte SurfaceIds bleiben blockiert
- Auswahlmodelle und Tests sichern die einzelne SurfaceId ab
- die sichtbare UI bleibt weiterhin read-only und ohne Bedienlogik

## Risiken

- eine zu breite Freigabe koennte `pdf.plan.page.1` oder andere Surfaces
  ungewollt mitziehen
- Canvas-Sichtbarkeit kann faelschlich als Bearbeitungsfreigabe verstanden
  werden
- ein Default-true oder eine Wildcard wuerde die bestehende Grenze aufweichen
- Drag, Resize und Persistenz duerfen nicht heimlich mitaktiviert werden

## Harte Grenzen

```text
vorhanden und read-only sichtbar:
- plan.canvas.default

bereits read-only sichtbar:
- pdf.plan.page.1

Host-/Bestandssurface:
- restarbeiten.ui.main
```

- keine echte Surface-Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine Plan-/Canvas-Bearbeitung
- keine PDF-Bearbeitung
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Spaeterer Minimalumfang

Dieser Block bleibt die minimal benoetigte read-only Form fuer die Surface:

```text
readable: true
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false
```

## Stop-/Go-Kriterien

### Go fuer ein spaeteres Freigabepaket

- genau `plan.canvas.default` wird freigegeben
- die Policy bleibt explizit und minimal
- `pdf.plan.page.1` bleibt unveraendert read-only sichtbar
- unbekannte SurfaceIds bleiben blockiert
- keine Drag-/Resize-/Persistenz-Rechte entstehen
- Tests werden angepasst
- eine Electron-Sichtpruefung ist vorgesehen

### Stop

- mehrere SurfaceIds werden gleichzeitig neu sichtbar
- Wildcard oder Default-true entsteht
- Drag, Resize oder Persistenz werden implizit aktiv
- Schreibwege entstehen
- sichtbare UI wird ohne Electron-Sichtpruefung geaendert

## Empfohlener spaeterer Ablauf

1. Nur `plan.canvas.default` explizit freigeben.
2. Policy minimal und einzeln anpassen.
3. `pdf.plan.page.1` unveraendert read-only lassen.
4. Tests fuer Sichtbarkeit und Blockaden nachziehen.
5. Eine sichtbare Aenderung erst mit Electron-Sichtpruefung abnehmen.

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Offene Grenzen

- keine weitere Freigabe ueber `plan.canvas.default` hinaus
- keine sichtbare UI-Aenderung ohne eigene Pruefung
- keine Produktivlogik

## Nachtrag G83

- `plan.canvas.default` ist jetzt explizit read-only sichtbar freigegeben.
- Die Freigabe bleibt auf genau diese SurfaceId begrenzt.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- Drag, Resize, Persistenz und jede echte Umschaltung bleiben deaktiviert.

## Nachtrag G84

- Die Freigabe bleibt unveraendert auf `plan.canvas.default` begrenzt.
- Die Sichtpruefungsreferenz liegt jetzt in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
