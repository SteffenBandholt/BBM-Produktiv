# UI-Editor Surface-Freigabe-Kandidat: plan.canvas.default

## Kurzfazit

`plan.canvas.default` ist technisch bereits bekannt, aber in G82 weiterhin
blockiert. Dieses Dokument bewertet nur den moeglichen naechsten read-only
Kandidaten und spricht keine Freigabe aus.

## Kandidat

- `plan.canvas.default`

## Aktueller Status

- vorhanden, aber weiterhin blockiert
- nicht sichtbar
- nicht auswählbar
- `pdf.plan.page.1` bleibt bereits read-only sichtbar
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface
- keine weitere Surface wurde freigegeben

## Fachlicher Nutzen einer spaeteren read-only Sichtbarkeit

- Eine Plan- oder Canvas-Fläche koennte als neutrale Referenz fuer Layout-
  und Oberflaechenkontrolle dienen.
- Fachlich waere eine feste Sicht auf die Canvas hilfreich, wenn spaeter
  reine Orientierung oder Vergleich ohne Bearbeitung benoetigt wird.
- Die Surface koennte als kontrollierter Kontext fuer technische Sichttests
  dienen, ohne eine echte Bearbeitung zu aktivieren.

## Technischer Nutzen

- Der Katalog kennt die SurfaceId bereits.
- Das Datenmodell fuer PDF-/Plan-Surfaces ist vorhanden.
- Policy, Selection, Switch-Model und Launcher-Referenz sind bereits
  vorbereitet und koennen spaeter minimal erweitert werden.
- Eine spaetere Einzelfreigabe waere technisch klein nachvollziehbar, wenn
  exakt eine SurfaceId angepasst wird.

## Technische Voraussetzungen

- explizite Policy-Freigabe nur fuer `plan.canvas.default`
- `pdf.plan.page.1` bleibt unveraendert read-only sichtbar
- unbekannte SurfaceIds bleiben blockiert
- Auswahlmodelle und Tests werden nur fuer den konkreten Kandidaten angepasst
- eine sichtbare UI wird erst mit separater Electron-Sichtpruefung freigegeben

## Risiken

- eine zu breite Freigabe koennte `pdf.plan.page.1` oder andere Surfaces
  ungewollt mitziehen
- Canvas-Sichtbarkeit kann fälschlich als Bearbeitungsfreigabe verstanden
  werden
- ein Default-true oder eine Wildcard wuerde die bestehende Grenze aufweichen
- Drag, Resize und Persistenz duerfen nicht heimlich mitaktiviert werden

## Harte Grenzen

```text
vorhanden, aber weiterhin blockiert:
- plan.canvas.default

bereits read-only sichtbar:
- pdf.plan.page.1

Host-/Bestandssurface:
- restarbeiten.ui.main
```

- `plan.canvas.default` bleibt in G82 unsichtbar
- `plan.canvas.default` bleibt in G82 nicht auswählbar
- keine echte Surface-Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine Plan-/Canvas-Interaktion
- keine PDF-Bearbeitung
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Späterer Minimalumfang

Dieser Block ist nur ein Vorschlag fuer ein spaeteres Freigabepaket:

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
- die Policy wird explizit und minimal angepasst
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

- keine Freigabe in G82
- keine sichtbare UI-Änderung in G82
- keine Produktivlogik in G82

## Empfohlener naechster Schritt

- den Kandidaten nur dokumentarisch fuehren
- ein spaeteres Freigabepaket erst starten, wenn die Policy explizit und
  minimal geaendert wird
