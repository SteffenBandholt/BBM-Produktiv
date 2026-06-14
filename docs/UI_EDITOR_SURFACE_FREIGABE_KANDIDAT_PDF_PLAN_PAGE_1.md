# UI-Editor Surface-Freigabe-Kandidat: pdf.plan.page.1

## Kurzfazit

`pdf.plan.page.1` ist der konkrete Kandidat fuer eine spaetere
Einzelfreigabe. In G74 bleibt die Surface jedoch weiterhin blockiert,
unsichtbar und nicht auswählbar. Diese Datei beschreibt nur den Kandidaten und
noch keine Freigabe.

## Kandidat

- `pdf.plan.page.1`

## Aktueller Status

- vorhanden, aber blockiert
- im Katalog bekannt
- im Launcher nicht sichtbar
- im Auswahlmodell nicht enthalten
- im Selection-State blockiert
- im Switch-Flow nicht freigegeben
- `restarbeiten.ui.main` bleibt sichtbar / resolved

## Gewuenschter spaeterer Minimalumfang

```text
readable: true
visibleInEditor: true
canHide: false
canDrag: false
canResize: false
canPersist: false
```

Dieser Block ist nur ein Vorschlag fuer spaetere Freigabevorbereitung. Er ist
keine Umsetzung und aendert `surfacePolicy.js` nicht.

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

- eine einzelne PDF-Seite koennte spaeter als kontrollierter Referenzpunkt
  dienen
- fachliche Leserichtung waere klarer als bei einer Mischung aus UI und Plan
- eine read-only Sicht koennte Vergleich, Referenz und Orientierung erleichtern
- die Surface bleibt vorerst getrennt von Interaktion und Bearbeitung

## Technische Voraussetzungen

- SurfaceId bleibt explizit benannt
- SurfaceId ist im Catalog bekannt
- SurfacePolicy wird spaeter nur minimal und gezielt angepasst
- andere SurfaceIds bleiben blockiert
- keine Wildcard und kein Default-true
- Sichtbarkeit wird separat testbar gehalten
- Electron-Sichtpruefung ist fuer sichtbare Aenderungen vorzuplanen

## Risiken

- eine versehentliche Auswahl-Erweiterung wuerde die klare Ein-Surface-Grenze
  aufweichen
- eine zu fruehe Sichtbarkeit kann als Startpunkt fuer Interaktion fehlgedeutet
  werden
- ein Default-Adapter oder eine Wildcard wuerde die Freigabelogik verwischen
- Drag, Resize und Persistenz duerfen nicht an die reine Sichtbarkeit
  gekoppelt werden

## Harte Grenzen

- `pdf.plan.page.1` bleibt in G74 unsichtbar
- `pdf.plan.page.1` bleibt in G74 nicht auswählbar
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

### Go fuer ein spaeteres Freigabepaket

- genau `pdf.plan.page.1` wird freigegeben
- Policy wird explizit und minimal geaendert
- `plan.canvas.default` bleibt blockiert
- unbekannte SurfaceIds bleiben blockiert
- keine Drag-/Resize-/Persistenz-Rechte entstehen
- Tests werden angepasst
- Electron-Sichtpruefung ist vorgesehen

### Stop

- mehrere SurfaceIds werden gleichzeitig sichtbar
- PDF/Plan tauchen automatisch in der Auswahl auf
- Wildcard oder Default-true entsteht
- Drag, Resize oder Persistenz werden implizit aktiv
- Schreibwege entstehen
- sichtbare UI wird ohne Electron-Sichtpruefung geaendert

## Empfohlener spaeterer Freigabeablauf

1. `pdf.plan.page.1` weiterhin nur als einzelnen Kandidaten betrachten.
2. Erst spaeter SurfacePolicy minimal und gezielt anpassen.
3. Tests fuer Sichtbarkeit, Blockierung und Nicht-Freigabe anderer Surfaces
   nachziehen.
4. Bei sichtbarer UI die Electron-Sichtpruefung einplanen.
5. Drag, Resize und Persistenz als eigene, getrennte Folgepakete behandeln.
