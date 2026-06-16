# UI-Editor SurfaceInfo Verhalten Entscheidung

## Kurzfazit

Nach der read-only Freigabe von `pdf.plan.page.1` bleibt die sichtbare
SurfaceInfo weiterhin auf `restarbeiten.ui.main`. Fuer diese Phase wird
empfohlen, dieses Verhalten nicht umzubauen, sondern als bewusstes
Zwischenverhalten zu dokumentieren und erst spaeter separat zu entscheiden.

## Aktueller Stand nach G76

- `pdf.plan.page.1` ist explizit read-only sichtbar
- `restarbeiten.ui.main` bleibt vorhanden
- `plan.canvas.default` bleibt blockiert
- unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht

## Beobachtetes Verhalten

```text
Surface-Auswahl:
- zeigt `Restarbeiten - PDF Plan Seite 1`

SurfaceInfo:
- zeigt weiterhin `restarbeiten.ui.main`
- zeigt damit den Host-/Hauptsurface-Stand, nicht zwingend die gerade
  zusaetzlich sichtbare read-only Surface
```

## Fachliche Bedeutung

- Die sichtbare read-only Freigabe von `pdf.plan.page.1` ist fachlich schon
  relevant, auch wenn die SurfaceInfo nicht umspringt.
- Nutzer koennen die Surface-Auswahl fachlich als erweiterte Sichtbarkeit
  lesen, waehrend die SurfaceInfo weiter den Hauptkontext beschreibt.
- Daraus entsteht ein moeglicher Interpretationsspielraum: sichtbar ist mehr
  als eine Surface, aber die SurfaceInfo bleibt auf dem Host-/Hauptsurface.

## Technische Bedeutung

- Das aktuelle Verhalten bestaetigt, dass keine echte Surface-Umschaltung
  stattfindet.
- `restarbeiten.ui.main` bleibt der Host-/Hauptsurface-Stand fuer die
  bestehende kompakte SurfaceInfo.
- `pdf.plan.page.1` ist zusaetzliche read-only Sichtbarkeit und keine neue
  aktive Runtime-Oberflaeche mit eigener Produktivbedienung.
- Dadurch bleiben Drag, Resize, Persistenz, DB-/IPC-Schreibwege,
  `localStorage` und `writeFile` weiterhin ausgeschlossen.

## Moegliche Varianten

### A) Aktuelles Verhalten beibehalten

- SurfaceInfo bleibt Host-/Hauptsurface-Info
- PDF Plan Seite 1 ist nur zusaetzliche read-only Sichtbarkeit
- Vorteil: keine echte Umschaltung noetig
- Risiko: Bezeichnung kann fachlich missverstaendlich sein

### B) SurfaceInfo kuenftig auf ausgewaehlte Surface beziehen

- SurfaceInfo wuerde bei PDF Plan Seite 1 auch `pdf.plan.page.1` anzeigen
- Vorteil: fachlich klarer
- Risiko: naehert sich echter Umschaltung an und braucht separate Freigabe

### C) SurfaceInfo zweigeteilt anzeigen

- Hoststand bleibt `restarbeiten.ui.main`
- zusaetzlich sichtbare read-only Surface wird separat ausgewiesen
- Vorteil: klarste Trennung
- Risiko: sichtbare UI-Erweiterung noetig

## Empfehlung

```text
SurfaceInfo-Verhalten vorerst nicht aendern.
Aktuellen Stand als bewusstes Zwischenverhalten dokumentieren.
Eine Aenderung an SurfaceInfo erst in einem eigenen spaeteren Paket umsetzen,
mit Electron-Sichtpruefung.
```

## Status nach G78

- Im bestehenden UI-Editor-Panel gibt es jetzt einen kleinen read-only Hinweis:
  `PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.`
- Dieser Read-only Hinweis ergaenzt die sichtbare Einordnung, ohne die
  SurfaceInfo umzubauen.
- SurfaceInfo bleibt weiterhin `restarbeiten.ui.main`.
- Die Empfehlung aus G77 bleibt damit unveraendert: kein stiller Umbau der
  SurfaceInfo, sondern klare Trennung zwischen Hinweis und Hoststand.

## Status nach G79

- Die getrennte manuelle Zielrouten-Sichtpruefung ist in
  `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md` dokumentiert.
- Ergebnis:
  `Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar`.
- Damit bleibt die hier dokumentierte Empfehlung unveraendert:
  SurfaceInfo nicht still umbauen, sondern den Zwischenstand und die offene
  Restarbeiten-Zielrouten-Abnahme sauber getrennt halten.

## Stop-/Go-Kriterien

### Go

- das Verhalten bleibt klar als Zwischenstand dokumentiert
- keine Produktivlogik wird geaendert
- keine sichtbare UI wird geaendert
- keine echte Surface-Umschaltung entsteht
- `plan.canvas.default` bleibt blockiert
- Tests sichern die Referenz gegen stillen Rueckbau oder stillen Umbau ab

### Stop

- SurfaceInfo wuerde ohne eigenes Paket umgebaut
- sichtbare UI wuerde erweitert
- aus read-only Sichtbarkeit wuerde echte Umschaltung
- Drag, Resize oder Persistenz wuerden implizit mitgezogen
- Wildcard oder Default-true wuerden eingefuehrt

## Entscheidung offen / nicht umgesetzt

- Die Entscheidung ueber ein spaeter anderes SurfaceInfo-Verhalten bleibt offen.
- In G77 wird nichts umgesetzt, sondern nur die Entscheidungsgrundlage
  dokumentiert.
- Aktuell bleibt Variante A die empfohlene Zwischenloesung.

## Nachtrag G81

- Die dokumentierte Entscheidung bleibt bestehen und wird jetzt in der
  Abschlussreferenz fuer den read-only PDF-Plan-Stand mitgefuehrt.
- Die SurfaceInfo selbst bleibt unveraendert auf `restarbeiten.ui.main`.
