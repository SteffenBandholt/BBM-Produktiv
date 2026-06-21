# G128 UI-Editor Hinweis/Infotext Save-Adapter Referenzstand

## Ziel

G128 bereitet fuer den lokalen Hinweis-/Infotext-Entwurf einen Save-Adapter als reine Beschreibung vor.

Der Adapter beschreibt den spaeteren Restarbeiten-Notizweg, fuehrt ihn aber nicht aus.

## Sichtbarer Stand

Im Speicherbereich des UI-Editors ist sichtbar:

- Save-Adapter
- Adapter: vorbereitet
- Zieladapter: Restarbeiten-Notizweg
- Zielmethode: window.bbmDb.restarbeitenCreateNote
- Zielkanal: restarbeiten:createNote
- Ausfuehrung: blockiert
- Grund: Schreibfreigabe-Gate geschlossen
- persisted: false
- previewOnly: true

## Descriptor

Der lokale Descriptor lautet sinngemaess:

- adapterPrepared: true
- targetAdapter: Restarbeiten-Notizweg
- targetMethod: window.bbmDb.restarbeitenCreateNote
- targetChannel: restarbeiten:createNote
- executionBlocked: true
- blockReason: Schreibfreigabe-Gate geschlossen
- persisted: false
- previewOnly: true

Der bestehende blockierte Speicher-Handler darf diesen Descriptor lesen, aber nicht ausfuehren.

## Grenzen

Auch mit gueltigem Host-Kontext, vollstaendiger Payload, gueltigem Hinweistext, vorhandener restarbeitId oder DEV-Kontext bleibt der Adapter blockiert.

Es gibt weiterhin:

- kein tatsaechlicher Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein tatsaechlicher Aufruf von `restarbeiten:createNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- kein aktivierter Speicherbutton
- kein Default-true
- keine Wildcard
- keine ENV-Variable
- keine DEV-Modus-Aktivierung
- keine automatische Auswahl einer Restarbeit
- UI-Editor-kit bleibt unveraendert

## Ergebnis

G128 beschreibt den spaeteren Zieladapter sichtbar und testbar.

Die Ausfuehrung bleibt blockiert, das Gate bleibt geschlossen, der Speicherbutton bleibt deaktiviert, `persisted: false` und `previewOnly: true` bleiben gesetzt.
