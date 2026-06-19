# UI-Editor Hinweis-Infotext Entwurf Abschlusscheck

## Kurzfazit

Der lokale Hinweis-/Infotext-Entwurf ist als kleine, zusammenhaengende Kette
abgeschlossen: Eingabe, Live-Vorschau, Host-Vorschau, Elementmodell-Vorschau,
Entwurfspruefung und Reset arbeiten lokal zusammen und schreiben nichts.

## Gepruefte Entwurfsfunktionen

- Hinweistext-Eingabe
- Live-Vorschau
- Host-Vorschau
- Elementmodell-Vorschau
- Entwurfspruefung
- `Entwurf zurücksetzen`

## Bestaetigter Ist-Stand

- Hinweistext-Eingabe ist lokal bearbeitbar.
- Live-Vorschau, Host-Vorschau und Elementmodell-Vorschau aktualisieren sich
  beim Tippen.
- Entwurfspruefung unterscheidet gueltigen lokalen Entwurf und fehlenden
  Hinweistext.
- `Speichern: nicht aktiv` bleibt sichtbar.
- `Entwurf zurücksetzen` stellt den Standardtext lokal wieder her.
- `SurfaceInfo` bleibt `restarbeiten.ui.main`.
- Es gibt keine Speicherung, keine Persistenz, keine DB-/IPC-Schreibwege,
  kein localStorage und kein writeFile.

## Eingabe- und Vorschauverhalten

- Die Eingabe steuert nur den lokalen Entwurf.
- Die Live-Vorschau zeigt den aktuellen Text sofort.
- Die Host-Vorschau spiegelt denselben Text im Restarbeiten-Kontext.
- Die Elementmodell-Vorschau bleibt read-only und zeigt Typ, Surface und
  Status des aktuellen Entwurfs.

## Validierungsverhalten

- Gueltig ist jeder Text mit mindestens einem sichtbaren Zeichen nach `trim()`.
- Leerer Text oder nur Leerzeichen fuehren zu `Status: Hinweistext fehlt`.
- Die Entwurfspruefung bleibt rein anzeigend und aktiviert kein Speichern.

## Reset-Verhalten

- `Entwurf zuruecksetzen` setzt lokal auf `Dies ist ein nicht gespeicherter
  Hinweis-Entwurf.` zurueck.
- Nach dem Reset ziehen Live-Vorschau, Host-Vorschau,
  Elementmodell-Vorschau und Entwurfspruefung sofort nach.
- Der Reset schreibt nichts und speichert nichts nach.

## Persistenzabgrenzung

- keine Persistenz
- kein localStorage
- kein writeFile
- keine DB-/IPC-Schreibwege
- UI-Editor-kit speichert nicht

## SurfaceInfo-Verhalten

- `SurfaceInfo` bleibt `restarbeiten.ui.main`.
- Es gibt keine aktive Surface-Umschaltung.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben nur read-only sichtbar.

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- kein Drag
- kein Resize
- Persistenz
- Speicherbutton
- persistente Element-Erstellung
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege
- neue Speicherwege
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefungen der vorherigen Pakete

- G96: Entwurfs-Vorschau sichtbar
- G97: lokale Live-Vorschau sichtbar
- G98: Host-Vorschau sichtbar
- G99: Elementmodell-Vorschau sichtbar
- G100: Entwurfspruefung sichtbar
- G101: Reset-Button sichtbar und lokal wirksam

## Empfohlener naechster praktischer Schritt

Nur eine fachlich freigegebene, neue UI-Editor-Aufgabe auf diesem Stand
aufsetzen. Keine weitere Speicher-, Drag- oder Surface-Logik ohne eigene
Freigabe.
