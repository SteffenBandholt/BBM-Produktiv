# G134 - UI-Editor Hinweis/Infotext Speicherbutton-Gated-Testfreigabe

## Was wurde vorbereitet?

G134 bereitet im BBM-Launcher eine zentrale Button-ViewModel-Entscheidung fuer den Hinweis-/Infotext-Speicherbutton vor.
Die Entscheidung ist lokal und rein lesend.

Sichtbar/testbar ist:

- Button-Aktivierungspruefung: vorbereitet
- Button im Standardpfad: deaktiviert
- Aktivierung nur mit expliziter Freigabe
- `buttonEnabled: false` im Standardpfad
- `persisted: false`
- `previewOnly: true`

Die vorbereitete Testfreigabe heisst:

```text
save-button-gated-test-release
```

## Warum bleibt der Standardpfad deaktiviert?

Der normale UI-Standardpfad bleibt geschlossen, weil die Schreibfreigabe-Konfiguration weiter `false` ist und das
Schreibfreigabe-Gate geschlossen bleibt.

Standardpfad:

- Schreibfreigabe-Konfiguration: `false`
- Schreibfreigabe-Gate geschlossen
- Speicherbutton deaktiviert
- Save-Ausfuehrung blockiert
- Produktiv-Save-Adapter nur vorbereitet
- `buttonEnabled: false`
- `persisted: false`
- `previewOnly: true`
- kein Produktiv-Speichern
- kein `window.bbmDb.restarbeitenCreateNote`
- kein `restarbeiten:createNote`
- kein IPC-/DB-/Datei-/localStorage-Schreibweg

## Welche Bedingungen aktivieren den Button nur im Testpfad?

`buttonEnabled: true` darf nur im isolierten Testpfad entstehen, wenn alle Bedingungen erfuellt sind:

- explizite Testfreigabe `mode: "save-button-gated-test-release"`
- `writeReleaseEnabled: true`
- `gateOpen: true`
- vollstaendige Payload
- gueltiger Host-Kontext
- gueltige `projectId`
- gueltige `restarbeitId`
- gueltiger Hinweistext
- Payload enthaelt `restarbeitId` und `noteText`
- Adapter verfuegbar
- keine laufende Speicherung
- kein bereits abgeschlossener identischer Save ohne Aenderung

Diese Testfreigabe ist keine Produktivfreigabe und aktiviert keinen echten UI-Klick.

## Warum ist kein Produktiv-Speicherweg aktiviert?

G134 trifft nur die Aktivierungsentscheidung im ViewModel. Es gibt keinen echten Speicherklick und keinen automatischen
Aufruf des Produktiv-Save-Adapters.

Weiterhin verboten und nicht umgesetzt:

- kein aktivierter Speicherbutton im normalen UI-Standardpfad
- kein echter Produktiv-Speicherklick
- kein automatischer Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein automatischer Aufruf von `restarbeiten:createNote`
- kein IPC-/DB-/Datei-/localStorage-Schreibweg im Standardpfad
- kein Default-true
- keine Wildcard
- keine automatische Auswahl einer Restarbeit
- keine DEV-Modus-Aktivierung
- keine ENV-Aktivierung
- keine Aenderung am `UI-Editor-kit`

## Welche Tests sichern Standardpfad und isolierten Positivpfad ab?

Der Runtime-Test sichert:

- Standardpfad bleibt deaktiviert, auch wenn eine vollstaendige Payload moeglich ist.
- Ohne Host-Kontext bleibt der Button deaktiviert.
- Ohne `restarbeitId` bleibt der Button deaktiviert.
- Bei leerem Hinweistext bleibt der Button deaktiviert.
- Mit gueltigem Host-Kontext, gueltigem Hinweistext und vollstaendiger Payload bleibt der Button bei geschlossenem Gate deaktiviert.
- Im isolierten Testpfad kann das ViewModel `buttonEnabled: true` liefern.
- DEV-Kontext, ENV-Kontext, vorhandene Payload, vorhandener Adapter und vorhandene `restarbeitId` aktivieren den Button nicht.
- Die positive Button-Entscheidung loest keinen Schreibaufruf aus.

## Aktueller G134-Stand

- Button-Aktivierungslogik ist vorbereitet.
- Positive Aktivierung ist nur testseitig moeglich.
- Standardpfad bleibt deaktiviert.
- Gate bleibt geschlossen.
- Speicherbutton bleibt in der UI deaktiviert.
- `persisted: false` bleibt Standard.
- `previewOnly: true` bleibt Standard.
- Es gibt kein Produktiv-Speichern.
