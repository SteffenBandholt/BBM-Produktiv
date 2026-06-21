# UI-Editor Hinweis / Infotext Speicherbereitschaft Referenzstand

## G123

G123 ergaenzt im BBM-Launcher eine sichtbare Speicherbereitschaft fuer den
lokalen Hinweis-/Infotext-Entwurf. Die Anzeige bleibt rein lokal und wird nur
aus bereits vorhandenen Daten abgeleitet:

- normalisierter Host-Kontext
- aktueller Hinweistext
- fest gesperrter Schreibfreigabe-Status

Der BBM-Launcher darf den Host-Kontext beim Oeffnen ueber den vorhandenen
CoreShell-Resolver frisch normalisieren. Dadurch bleibt die Anzeige aktuell,
wenn die Restarbeiten-Ansicht ihren eindeutigen Datensatz erst nach dem
Routenwechsel geladen oder ausgewahlt hat.

## Sichtbare Anzeige

Die Anzeige unterscheidet zwischen pruefbarer Speicherbereitschaft und
tatsaechlicher Freigabe.

- Host-Kontext vorhanden: ja/nein
- projectId vorhanden: ja/nein
- restarbeitId vorhanden: ja/nein
- Zielkontext: Restarbeiten
- Ziel-Surface: restarbeiten.ui.main
- Elementtyp: Hinweis / Infotext
- Hinweistext gueltig: ja/nein
- technisch/fachlich speicherbereit
- Schreibweg freigegeben: nein
- Speichern: gesperrt
- persisted: false

Bei gueltigem Host-Kontext und gueltigem Hinweistext darf
`technisch/fachlich speicherbereit` sichtbar `ja` sein. Daraus folgt keine
Freigabe zum Schreiben.

## Guardrails

- kein `restarbeiten:createNote`
- kein `window.bbmDb.restarbeitenCreateNote`
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- kein aktivierter Speicherbutton
- kein Default-true
- keine Wildcard
- keine automatische Restarbeit-Auswahl
- UI-Editor-kit bleibt unveraendert

Der Button `Entwurf speichern` bleibt deaktiviert. Es wird keine echte Notiz
erzeugt.

## Testabdeckung

`scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` prueft:

- ohne Host-Kontext bleiben Host-Kontext, `projectId` und `restarbeitId` auf
  `nein`, Speichern bleibt gesperrt und `persisted: false` sichtbar.
- mit gueltigem Host-Kontext und gueltigem Hinweistext wird die technische
  Speicherbereitschaft angezeigt, waehrend `Schreibweg freigegeben: nein`,
  `Speichern: gesperrt` und `persisted: false` unveraendert bleiben.
- mit leerem Hinweistext wird `Hinweistext gueltig: nein` angezeigt und
  Speichern bleibt gesperrt.
- der deaktivierte Speicherbutton ruft keinen Schreibweg auf.
