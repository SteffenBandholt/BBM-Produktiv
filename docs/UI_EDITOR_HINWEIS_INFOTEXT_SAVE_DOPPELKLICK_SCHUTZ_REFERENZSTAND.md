# G135 - UI-Editor Hinweis/Infotext Save-Doppelklick-Schutz Referenzstand

## Entscheidung

G135 bereitet fuer den Hinweis-/Infotext-Speicherweg einen lokalen Schutz gegen
Doppelklick und identische Mehrfachspeicherung vor.

Der Standardpfad bleibt gesperrt:

- Gate geschlossen
- Speicherbutton deaktiviert
- canStartSave: false
- kein Produktiv-Speichern
- persisted: false
- previewOnly: true

## Was wurde vorbereitet?

Im BBM-Launcher gibt es einen lokalen Save-Guard fuer den spaeteren
Restarbeiten-Notizweg.

Sichtbar/testbar sind:

- Speicherschutz: vorbereitet
- Save-Status: idle / saving / success / error / blocked
- Doppelklickschutz: aktiv
- Mehrfachspeicherung gleicher Payload: vorbereitet
- Standardpfad: gesperrt
- duplicateBlocked
- inFlightBlocked
- lastSavedPayloadSignature
- currentPayloadSignature

## Warum bleibt der Standardpfad deaktiviert?

Der normale UI-Standardpfad bekommt keine Freigabe. Vorhandener Host-Kontext,
vollstaendige Payload, gueltiger Hinweistext, vorhandener Adapter, DEV-Kontext,
ENV-Kontext oder vorhandene restarbeitId oeffnen den Speicherweg nicht.

Es gibt keinen Default-true, keine Wildcard und keine automatische Auswahl
einer Restarbeit.

## Wie wird Doppelklick verhindert?

Der isolierte Testpfad setzt den Guard waehrend eines Save-Versuchs auf
`saving`. Ein zweiter paralleler Versuch wird mit `inFlightBlocked` blockiert.
Der Fake-Adapter wird dabei nicht doppelt aufgerufen.

Der testseitige Positivpfad ist nur mit expliziter Testfreigabe erreichbar:

- mode: save-guard-isolated-test
- writeReleaseEnabled: true
- gateOpen: true
- Fake-Adapter vorhanden

## Wie wird identische Mehrfachspeicherung verhindert?

Nach einem erfolgreichen isolierten Test-Save wird die
`lastSavedPayloadSignature` gesetzt. Ein erneuter Versuch mit derselben
`currentPayloadSignature` wird als Duplikat erkannt und blockiert.

Eine geaenderte Payload haette eine andere Signatur und waere spaeter wieder
versuchbar, aber nur im isolierten Testpfad mit expliziter Freigabe.

## Wie bleibt der Entwurf bei Fehler erhalten?

Wenn der Fake-Adapter fehlschlaegt oder eine Exception wirft:

- Save-Status: error
- persisted: false
- previewOnly: true
- Payload und Hinweistext bleiben erhalten
- lastSavedPayloadSignature wird nicht gesetzt
- ein spaeterer Versuch wird nicht wegen einer Erfolgssignatur blockiert

## Nicht aktiviert

- kein Produktiv-Speichern
- kein aktivierter Speicherbutton im Standardpfad
- kein automatischer Aufruf von `window.bbmDb.restarbeitenCreateNote`
- kein automatischer Aufruf von `restarbeiten:createNote`
- kein `window.bbmDb.restarbeitenCreateNote`
- kein `restarbeiten:createNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- keine DEV-Modus-Aktivierung
- keine ENV-Aktivierung
- keine Aenderung am `UI-Editor-kit`

## Tests

Abgesichert in `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`:

- Standardpfad bleibt blockiert: Button deaktiviert, Gate geschlossen,
  canStartSave: false, persisted: false, previewOnly: true.
- Waehrend `saving` wird ein zweiter Save-Versuch blockiert und der
  Fake-Adapter nicht doppelt aufgerufen.
- Nach erfolgreichem isoliertem Test-Save wird identische Payload per
  duplicateBlocked blockiert; persisted true gilt nur fuer diesen isolierten
  Testpfad.
- Fehlerfall: Ergebnis error, persisted: false, Entwurf/Payload bleibt
  erhalten, keine Erfolgssignatur wird gesetzt.
- Keine implizite Aktivierung durch DEV, ENV, vorhandene Payload, vorhandenen
  Adapter oder vorhandene restarbeitId.
