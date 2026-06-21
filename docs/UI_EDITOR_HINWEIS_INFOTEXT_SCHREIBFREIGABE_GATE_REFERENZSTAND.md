# UI-Editor Hinweis/Infotext Schreibfreigabe-Gate Referenzstand

## G125

G125 bereitet fuer den Hinweis-/Infotext-Entwurf eine zentrale, testbare
Schreibfreigabe-Sperre vor. Das Gate ist bewusst geschlossen und darf durch
vorhandenen Host-Kontext, gueltigen Hinweistext oder eine vollstaendige
Payload nicht automatisch geoeffnet werden.

## Sichtbare Anzeige

- Schreibfreigabe-Gate
- Schreibfreigabe-Gate: geschlossen
- Freigabequelle: nicht gesetzt
- Grund: echter Restarbeiten-Notizweg noch nicht freigegeben
- Payload vollständig: ja/nein
- technisch/fachlich speicherbereit: ja/nein
- Schreibweg freigegeben: nein
- Button aktivierbar: nein
- Speicherbutton: deaktiviert
- persisted: false
- previewOnly: true

## Abgrenzung

Die Payload kann fachlich vollstaendig sein, wenn normalisierter
Restarbeiten-Host-Kontext und gueltiger Hinweistext vorhanden sind. Das ist
nur eine lokale Anzeige im BBM-Launcher. Die tatsaechliche Schreibfreigabe
bleibt davon getrennt und steht fuer G125 fest auf nein.

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
