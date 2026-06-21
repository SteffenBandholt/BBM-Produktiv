# G132 - UI-Editor Hinweis/Infotext Produktiv-Save-Adapter hinter Gate

## Entscheidung

G132 bereitet den Produktiv-Save-Adapter fuer den Hinweis-/Infotext-Entwurf im BBM-Launcher kontrolliert vor.
Der UI-Standardpfad bleibt geschlossen: `writeReleaseEnabled: false`, Gate geschlossen, Speicherbutton deaktiviert,
`persisted false` und `previewOnly true`.

G132 aktiviert keinen normalen Produktiv-Speicherweg. Eine Ausfuehrung ist nur im Test ueber eine explizite
Testfreigabe erlaubt.

## Zieladapter

- Produktiv-Save-Adapter: vorbereitet
- Zieladapter: Restarbeiten-Notizweg
- Zielmethode: `window.bbmDb.restarbeitenCreateNote`
- Zielkanal: `restarbeiten:createNote`
- Produktiv-Payload: `{ restarbeitId, noteText }`
- Erwarteter Erfolg: Rueckgabe mit `ok: true` und erzeugter `note`
- Erwarteter Fehlerfall: Rueckgabe mit `ok: false` und sichtbarem Fehlergrund

Die tatsaechliche Zielsignatur lautet:

```js
window.bbmDb.restarbeitenCreateNote({ restarbeitId, noteText })
```

## Standardpfad bleibt blockiert

Im normalen UI-Pfad gilt weiterhin:

- Schreibfreigabe-Konfiguration: `writeReleaseEnabled: false`
- Gate geschlossen
- Schreibweg freigegeben: nein
- Speicherbutton deaktiviert
- Save-Ausfuehrung blockiert
- `persisted false`
- `previewOnly true`
- kein Produktiv-Schreibweg
- kein IPC-/DB-/Datei-/localStorage-Schreibweg
- kein localStorage
- kein writeFile
- keine ENV-Freigabe
- keine DEV-Modus-Freigabe
- keine Wildcard
- keine automatische Restarbeit-Auswahl
- keine Aenderung am `UI-Editor-kit`

## Explizite Testfreigabe

Der positive Adaptertest darf nur laufen, wenn alle Testbedingungen gesetzt sind:

- `mode: "productive-save-adapter-gated-test"`
- `writeReleaseEnabled: true`
- `gateOpen: true`
- `useProductiveAdapter: true`
- ein Test-`win` mit Stub fuer `window.bbmDb.restarbeitenCreateNote`
- gueltiger Host-Kontext
- gueltige `restarbeitId`
- gueltiger Hinweistext
- vollstaendige Payload `{ restarbeitId, noteText }`

Diese explizite Testfreigabe ist keine Produktivfreigabe und oeffnet den UI-Standardpfad nicht.

## Abgesicherte Faelle

- Standardpfad bleibt blockiert und ruft den Adapter nicht auf.
- Erfolgsfall: Der Stub erhaelt genau `{ restarbeitId, noteText }`; erst danach ist das Testergebnis `persisted true`
  und `previewOnly false`.
- Fehlerfall: Ein Adapterfehler liefert `ok: false`, bleibt ohne stilles Speichern sichtbar und setzt nicht auf
  `persisted true`.
- Fehlende `restarbeitId` fuehrt zu keiner Ausfuehrung.
- Leerer Hinweistext fuehrt zu keiner Ausfuehrung.
- DEV-Kontext, vorhandene Payload oder vorhandene `restarbeitId` oeffnen das Gate nicht.

## Aktueller G132-Stand

- Produktiv-Save-Adapter ist lokal vorbereitet.
- UI zeigt den Produktiv-Save-Adapter als vorbereitet.
- UI zeigt die Produktiv-Ausfuehrung im Standardpfad als gesperrt.
- Gate bleibt geschlossen.
- Schreibfreigabe-Konfiguration bleibt `false`.
- Speicherbutton bleibt deaktiviert.
- Im Standardpfad bleibt `persisted false`.
- Im Standardpfad bleibt `previewOnly true`.
