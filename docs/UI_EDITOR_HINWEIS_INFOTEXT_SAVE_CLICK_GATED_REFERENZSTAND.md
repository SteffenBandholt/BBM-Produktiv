# G136 - UI-Editor Hinweis/Infotext Speicherklick-Pfad hinter Gate

## Entscheidung

G136 verdrahtet den lokalen Speicherklick-Pfad fuer Hinweis-/Infotext hinter dem bestehenden Gate. Der Standardpfad bleibt geschlossen:

- Speicherklick: vorbereitet
- Klickpfad im Standard: blockiert
- Letzter Klickstatus: nicht ausgefuehrt oder blockiert
- Speicherbutton deaktiviert
- Gate geschlossen
- persisted: false
- previewOnly: true

G136 aktiviert kein Produktiv-Speichern.

## Zielpfad

Der spaetere Zielpfad bleibt klar benannt, wird im Standard aber nicht ausgefuehrt:

- Zielmethode: `window.bbmDb.restarbeitenCreateNote`
- Zielkanal: `restarbeiten:createNote`
- Payload: `restarbeitId`, `noteText`
- Zieladapter: Restarbeiten-Notizweg

## Standardverhalten

Im normalen UI-Editor-Pfad gilt:

- Schreibfreigabe-Konfiguration bleibt `false`.
- Schreibfreigabe-Gate bleibt geschlossen.
- Klickpfad im Standard: blockiert.
- Speicherbutton bleibt deaktiviert.
- `persisted: false` bleibt sichtbar/testbar.
- `previewOnly: true` bleibt sichtbar/testbar.
- Es gibt keinen Aufruf von `window.bbmDb.restarbeitenCreateNote`.
- Es gibt keinen Aufruf von `restarbeiten:createNote`.
- Es gibt kein IPC-/DB-/Datei-/localStorage-Schreiben.
- Es gibt kein `localStorage`.
- Es gibt kein `writeFile`.
- Es gibt kein Submit.
- Es gibt kein Default-true.
- Es gibt keine DEV- oder ENV-Freigabe.
- Es gibt keine Wildcard.
- Es gibt keine automatische Restarbeit-Auswahl.

## Expliziter Testpfad

Der isolierte Positivtest darf nur mit der Testfreigabe `save-click-gated-test-release` laufen.

Mindestbedingungen im Test:

- gueltiger Host-Kontext
- gueltige `projectId`
- gueltige `restarbeitId`
- gueltiger Hinweistext
- vollstaendige Payload
- `writeReleaseEnabled: true`
- `gateOpen: true`
- `useProductiveAdapter: true`
- Stub fuer `window.bbmDb.restarbeitenCreateNote`

Nur dieser Testpfad darf den Stub genau kontrolliert aufrufen. Der Standardpfad bleibt davon getrennt.

## Schutzregeln

Der Speicherklick-Pfad bleibt blockiert bei:

- fehlendem Host-Kontext
- fehlender `restarbeitId`
- leerem Hinweistext
- fehlender expliziter Testfreigabe
- geschlossenem Gate
- fehlendem Adapter
- DEV-Kontext
- ENV-Kontext
- vorhandener Payload allein
- vorhandener `restarbeitId` allein

Der Doppelklick-Schutz verhindert eine zweite Ausfuehrung waehrend `saving`. Eine identische Payload nach erfolgreichem Save wird blockiert. Bei Fehler bleibt der Entwurf retry-faehig und bekommt keine Erfolgssignatur.

## Aktueller Referenzstand

- Speicherklick: vorbereitet
- Klickpfad im Standard: blockiert
- Letzter Klickstatus: nicht ausgefuehrt
- Standardpfad: kein Produktiv-Speichern
- Positive Ausfuehrung: nur isoliert mit `save-click-gated-test-release` und Stub
- `persisted: false` im Standard
- `previewOnly: true` im Standard
- `persisted: true` nur nach erfolgreichem isoliertem Testsave
- `previewOnly: false` nur nach erfolgreichem isoliertem Testsave

## Nicht zulaessig

- kein Produktiv-Speichern im Standardpfad
- kein automatischer Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein automatischer Aufruf von `restarbeiten:createNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- kein Default-true
- keine Wildcard
- keine DEV-Modus-Aktivierung
- keine ENV-Aktivierung
- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern bei leerem `noteText`
- keine Aenderung am `UI-Editor-kit`
