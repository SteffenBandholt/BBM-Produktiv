# G139 - UI-Editor Hinweis/Infotext Elementbearbeitung Fachkorrektur

## Entscheidung

G139 korrigiert den normalen UI-Editor-Pfad fachlich zurueck auf
Elementbearbeitung. Der UI-Editor bearbeitet UI-Elemente und darf den
Restarbeiten-Notizweg nicht als Ersatz fuer einen fehlenden
UI-Element-Speichervertrag verwenden.

G137/G138 hatten den Produktiv-Save fuer Hinweis-/Infotext zu stark in
Richtung Restarbeiten-Notizspeichern gefuehrt. Das war fachlich die falsche
Hauptspur fuer den UI-Editor.

## Sichtbarer Stand

- Der Bereich heisst wieder `Elementbearbeitung`.
- Das Textfeld ist als `Elementtext` gefuehrt.
- Der normale Button heisst `Aenderungen speichern`.
- Der Hauptstatus zeigt `UI-Element-Speicherstatus`.
- Der Blockiergrund lautet:
  `Speichervertrag fuer UI-Elementaenderungen fehlt noch`.
- Technische Alt- und Diagnoseinformationen sind unter
  `Diagnose / Entwicklerdetails` eingeordnet.

## Gefundene Speicherwege

Im Repo sind fuer den UI-Editor aktuell diese begrenzten Speicherwege
nachweisbar:

- `uiEditorLayoutOverrides:*` fuer Pilot-Sichtbarkeits- und Layout-Overrides.
- `tableLayouts:*` fuer Tabellenlayouts.

Ein allgemeiner UI-Element-Speichervertrag fuer Text- oder
Eigenschaftsaenderungen am Hinweis-/Infotext-Element wurde nicht gefunden.

## Fachliche Korrektur

Der Restarbeiten-Notizweg bleibt eine Diagnose-/Altspur und ist nicht der
normale Speicherweg fuer UI-Elementaenderungen:

- `window.bbmDb.restarbeitenCreateNote` wird im normalen UI-Pfad nicht
  ausgefuehrt.
- `restarbeiten:createNote` wird im normalen UI-Pfad nicht ausgefuehrt.
- Eine Payload aus `restarbeitId` und `noteText` ist eine Notiz-Payload, kein
  UI-Element-Speichervertrag.
- Es gibt keinen IPC-/DB-Schreibweg fuer UI-Elementaenderungen.
- Es gibt kein Submit, kein localStorage und kein writeFile.

## Aktueller G139-Stand

- Editieren bleibt moeglich.
- Der Speicherbutton bleibt deaktiviert, solange kein korrekter
  UI-Element-Speichervertrag existiert.
- `persisted: false` bleibt der Standard.
- `previewOnly: true` bleibt der Standard.
- Der Restarbeiten-Notizweg wird nicht als Ersatzspeicher genutzt.
- Eine spaetere Freigabe benoetigt einen eigenen, dokumentierten Vertrag fuer
  UI-Elementaenderungen.

## Pruefbezug

Der Referenzstand wird durch
`scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` abgesichert. Der Test
prueft insbesondere, dass dieses Dokument existiert und die Kernbegriffe zur
Fachkorrektur, zum fehlenden UI-Element-Speichervertrag und zur nicht
verwendeten Restarbeiten-Notizspur enthaelt.
