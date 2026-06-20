# UI-Editor Hinweis-Infotext BBM-Schreibweg Analyse

## Kurzfazit

Fuer `Hinweis / Infotext` gibt es mehrere bestehende BBM-Schreibwege, aber nur
ein Teil davon passt fachlich zum spaeteren Speichern des Entwurfs. G108 gibt
den Restarbeiten-Notizweg als spaeteren Ziel-Schreibweg frei; er ist der
naechste sinnvolle Kandidat, liegt im richtigen Hostkontext und hat bereits
einen klaren IPC-/Repo-/DB-Pfad. Die anderen vorhandenen Schreibwege sind gute
Vergleichspunkte, aber fuer diesen Entwurf fachlich zu weit entfernt oder zu
spezialisiert.

## Gepruefte BBM-Schreibwege

- `restarbeiten:createNote` ueber `src/main/ipc/restarbeitenIpc.js` und
  `src/main/db/restarbeitenRepo.js`
  - fachlich naheliegend
  - schreibt in den Restarbeiten-Kontext
  - hat bereits den BBM-Hostpfad bis zur DB
  - passt am ehesten zu einem spaeteren speicherbaren Hinweistext
- `uiEditorLayoutOverrides:save` ueber
  `src/main/ipc/uiEditorLayoutOverridesIpc.js`
  - technischer Schreibweg vorhanden
  - aber nur fuer Layout-Overrides und nicht fuer Inhalt
  - fuer `Hinweis / Infotext` derzeit fachlich falsch
- `tops:*`, `projects:*`, `projectFirms:*` und `settings:*`
  - etablierte BBM-Schreibmuster
  - aber fachlich an andere Domänen gebunden
  - fuer den Hinweistext nur als Muster, nicht als Zielweg

## Erkennbarer Zielpfad

Der spaetere Zielpfad sollte voraussichtlich am Restarbeiten-Notizweg
andocken:

```text
restarbeiten:createNote
-> src/main/ipc/restarbeitenIpc.js
-> src/main/db/restarbeitenRepo.js
-> Restarbeiten-Kontext auf `restarbeiten.ui.main`
```

Begruendung:

- `restarbeiten.ui.main` ist der dokumentierte Host-/Bestandskontext.
- Der Hinweistext ist inhaltlich naeher an einer Notiz als an Layoutdaten.
- Der bestehende Weg ist bereits BBM-seitig und ohne Wildcard oder
  Default-true gebaut.
- Ein spaeterer Schreibweg kann dort klar getestet und begrenzt werden.

## Was daraus noch nicht folgt

- kein Speicherweg gebaut
- kein Speicherbutton
- kein Submit
- keine IPC-/DB-Schreibaktion fuer `Hinweis / Infotext`
- keine Persistenz
- kein Drag
- kein Resize
- keine Aenderung an `UI-Editor-kit`

## Naechster praktischer Schritt

Wenn die Speicherung spaeter freigegeben wird, sollte zuerst ein kleiner,
expliziter Restarbeiten-Notizpfad mit Guardrails definiert werden. Bis dahin
bleibt diese Analyse nur eine Einordnung des naheliegenden BBM-Schreibwegs.
