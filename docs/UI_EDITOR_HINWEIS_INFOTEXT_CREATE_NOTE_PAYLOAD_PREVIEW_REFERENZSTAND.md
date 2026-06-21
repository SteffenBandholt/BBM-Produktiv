# UI-Editor Hinweis / Infotext Create-Note-Payload-Vorschau

## G124

G124 ergaenzt im BBM-Launcher eine read-only Create-Note-Payload-Vorschau
fuer den lokalen Hinweis-/Infotext-Entwurf. Die Vorschau zeigt, welche Daten
spaeter fuer den Restarbeiten-Notizweg verwendet wuerden.

Die Anzeige bleibt reine Vorschau und wird nur aus lokalen Daten gebildet:

- normalisierter Host-Kontext
- aktueller Hinweistext
- persisted: false
- previewOnly: true
- Schreibweg freigegeben: nein

## Sichtbare Vorschau

Die Vorschau zeigt nur bei fachlich vollstaendigen lokalen Daten
`Payload vollständig: ja`. Ohne gueltigen Host-Kontext oder ohne gueltigen
Hinweistext bleibt die Payload als unvollstaendig markiert.

- Create-Note-Payload-Vorschau
- Payload vollständig: ja/nein
- Ziel: `restarbeiten:createNote`
- `restarbeitId`
- `noteText`
- `projectId`
- previewOnly: true
- persisted: false
- Schreibweg freigegeben: nein

`projectId` ist nur Kontextanzeige fuer den BBM-Host und nicht als neuer
IPC-Vertrag freigegeben.

## Guardrails

- kein Aufruf von `restarbeiten:createNote`
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

- ohne gueltigen Host-Kontext bleibt die Create-Note-Payload unvollstaendig.
- mit gueltigem Host-Kontext und gueltigem Hinweistext enthaelt die Vorschau
  `restarbeitId`, `noteText`, `projectId`, Ziel `restarbeiten:createNote`,
  `previewOnly: true`, `persisted: false` und `Schreibweg freigegeben: nein`.
- mit leerem Hinweistext bleibt die Payload unvollstaendig.
- der Speicherbutton bleibt deaktiviert und ruft keinen Schreibweg auf.
