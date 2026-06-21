# UI-Editor Hinweis/Infotext Fake-Adapter-Positivtest Referenzstand

## G130

G130 ergaenzt fuer die Hinweis-/Infotext-Save-Ausfuehrung einen isolierten Fake-Adapter-Positivtest.
Dieser Abschnitt ist der Referenzstand fuer den isolierter Fake-Adapter-Positivtest.
Der Test beweist nur, dass die lokale Save-Ausfuehrungsfunktion mit einer vollstaendigen Payload arbeiten kann, wenn alle Test-Abhaengigkeiten ausdruecklich injiziert werden.

## Isolierter Testpfad

Der positive Pfad ist nur aktiv, wenn der Test alle folgenden Werte explizit uebergibt:

- `mode: isolated-fake-adapter-positive-test`
- `writeReleaseEnabled: true`
- `gateOpen: true`
- `Fake-Adapter`
- vollstaendige Payload mit `restarbeitId` und `noteText`

Der Fake-Adapter existiert nur im Speicher des Tests. Er sammelt die empfangene Payload und wird im Positivfall genau einmal aufgerufen.

Das Ergebnis des isolierten Testpfads darf `executed: true` melden. Trotzdem bleiben `persisted: false` und `previewOnly: true` gesetzt.

## Standardpfad bleibt geschlossen

Der Standardpfad bleibt geschlossen:

- Schreibfreigabe-Konfiguration bleibt `false`
- Gate bleibt geschlossen
- Save-Ausfuehrung bleibt blockiert
- Speicherbutton bleibt deaktiviert
- `persisted: false`
- `previewOnly: true`

Vorhandene Payload, vorhandene `restarbeitId`, ein vorbereiteter Adapter, DEV-Kontext oder fehlende Test-Injection duerfen das Gate nicht oeffnen.

## Harte Grenzen

- kein Produktiv-Schreibweg
- kein echter Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein echter Aufruf von `restarbeiten:createNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein aktivierter Speicherbutton
- keine ENV-Variable
- keine DEV-Modus-Aktivierung
- UI-Editor-kit bleibt unveraendert
