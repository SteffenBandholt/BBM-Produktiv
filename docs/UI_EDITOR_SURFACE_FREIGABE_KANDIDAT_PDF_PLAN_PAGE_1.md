# UI-Editor Surface-Freigabe-Kandidat: pdf.plan.page.1

## Kurzfazit

`pdf.plan.page.1` war der konkrete Kandidat fuer eine spaetere
Einzelfreigabe. In G75 wurde die Surface per read-only Policy sichtbar
freigegeben. Diese Datei beschreibt die Kandidatenhistorie und verweist auf
den nun aktiven Referenzstand.

## Kandidat

- `pdf.plan.page.1`

## Aktueller Status

- im Katalog bekannt
- im Launcher sichtbar
- im Auswahlmodell enthalten
- im Selection-State erlaubt
- im Switch-Flow read-only erlaubt
- `restarbeiten.ui.main` bleibt default-resolved
- `plan.canvas.default` bleibt blockiert
- historisch war der Kandidat zuvor nicht sichtbar
- historisch war er nicht auswählbar

## Gewuenschter spaeterer Minimalumfang

```text
readable: true
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false
```

Dieser Block war die Freigabevorlage. G75 setzt ihn nun fuer
`pdf.plan.page.1` read-only um.

## Ausdruecklich nicht freigegebene Funktionen

- keine echte Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Renderintegration
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true

## Fachlicher Nutzen

- eine einzelne PDF-Seite kann als kontrollierter Referenzpunkt dienen
- fachliche Leserichtung bleibt klarer als bei einer Mischung aus UI und Plan
- die read-only Sicht kann Vergleich, Referenz und Orientierung erleichtern
- die Surface bleibt getrennt von Interaktion und Bearbeitung

## Technische Voraussetzungen

- SurfaceId bleibt explizit benannt
- SurfaceId ist im Catalog bekannt
- SurfacePolicy bleibt explizit und minimal
- andere SurfaceIds bleiben blockiert
- keine Wildcard und kein Default-true
- Sichtbarkeit bleibt separat testbar
- Electron-Sichtpruefung ist fuer sichtbare Aenderungen erforderlich

## Risiken

- eine versehentliche Auswahl-Erweiterung wuerde die klare Grenze aufweichen
- eine zu fruehe Sichtbarkeit kann als Startpunkt fuer Interaktion fehlgedeutet werden
- ein Default-Adapter oder eine Wildcard wuerde die Freigabelogik verwischen
- Drag, Resize und Persistenz duerfen nicht an die reine Sichtbarkeit gekoppelt werden

## Harte Grenzen

- `pdf.plan.page.1` bleibt read-only
- `plan.canvas.default` bleibt blockiert
- keine echte Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine PDF-Renderintegration
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Stop-/Go-Kriterien

### Go fuer den aktiven Read-only-Referenzstand

- genau `pdf.plan.page.1` ist freigegeben
- Policy bleibt explizit und minimal
- `plan.canvas.default` bleibt blockiert
- unbekannte SurfaceIds bleiben blockiert
- keine Drag-/Resize-/Persistenz-Rechte entstehen
- Tests sind angepasst
- Electron-Sichtpruefung ist erforderlich

### Stop

- mehrere SurfaceIds werden gleichzeitig sichtbar
- PDF/Plan tauchen automatisch in der Auswahl auf
- Wildcard oder Default-true entsteht
- Drag, Resize oder Persistenz werden implizit aktiv
- Schreibwege entstehen
- sichtbare UI wird ohne Electron-Sichtpruefung geaendert

## Empfohlener weiterer Ablauf

1. `pdf.plan.page.1` als aktiven read-only Referenzstand behandeln.
2. `plan.canvas.default` weiterhin getrennt blockiert lassen.
3. Tests fuer Sichtbarkeit, Blockierung und Nicht-Freigabe anderer Surfaces konservativ halten.
4. Bei sichtbarer UI die Electron-Sichtpruefung ausfuehren.
5. Drag, Resize und Persistenz als eigene, getrennte Folgepakete behandeln.
