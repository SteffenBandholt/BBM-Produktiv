# UI-Editor Hinweis/Infotext Schreibfreigabe-Konfiguration Referenzstand

## G126

G126 bereitet fuer den Hinweis-/Infotext-Entwurf eine zentrale
Schreibfreigabe-Konfiguration vor. Die Konfiguration ist lokal, explizit und
bewusst geschlossen.

## Konfiguration

- Schreibfreigabe-Konfiguration
- Freigabequelle: Konfiguration
- Freigabewert: false
- writeReleaseEnabled: false
- source: configuration
- Grund: echter Restarbeiten-Notizweg noch nicht freigegeben

## Sichtbare Gate-Anzeige

- Schreibfreigabe-Gate: geschlossen
- Payload vollständig: ja/nein
- technisch/fachlich speicherbereit: ja/nein
- Schreibweg freigegeben: nein
- Button aktivierbar: nein
- Speicherbutton: deaktiviert
- persisted: false
- previewOnly: true

## Keine implizite Aktivierung

- vorhandener Host-Kontext oeffnet das Gate nicht
- vorhandene `restarbeitId` oeffnet das Gate nicht
- vollstaendige Payload oeffnet das Gate nicht
- gueltiger Hinweistext oeffnet das Gate nicht
- keine ENV-Variable
- keine DEV-Modus-Aktivierung
- fehlende Konfiguration darf niemals als Freigabe gelten

## Harte Sperren

- kein Aufruf von `restarbeiten:createNote`
- kein `window.bbmDb.restarbeitenCreateNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- kein Default-true
- keine Wildcard
- UI-Editor-kit bleibt unveraendert
