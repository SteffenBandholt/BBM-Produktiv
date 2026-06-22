# G138 - UI-Editor Hinweis/Infotext Produktiv-Save-Status Absicherung

## Entscheidung

G138 fuehrt keinen neuen Speicherweg ein. Der vorhandene Produktiv-Save bleibt
auf den bestehenden Button-Klick hinter Host-Kontext, Gate, Adapter,
Doppelklickschutz und Duplikatschutz begrenzt.

Zielmethode bleibt:

- `window.bbmDb.restarbeitenCreateNote({ restarbeitId, noteText })`

Zielkanal bleibt:

- `restarbeiten:createNote`

## Abgesicherte Statuszustaende

- Vor dem Save: `bereit`, `blockiert` oder `nicht bereit` wird aus Button-,
  Gate- und Guard-State abgeleitet.
- Waehrend Save: `saving`; der Button wird gesperrt und ein zweiter
  Save-Versuch wird blockiert.
- Nach Erfolg: `success`, `persisted: true`, `previewOnly: false`.
- Nach Fehler: `error`, `persisted: false`, `previewOnly: true`.
- Bei Duplikat: identische Payload nach Erfolg wird blockiert.

## Anzeige nach Erfolg

Nach erfolgreichem Produktiv-Save sind testbar:

- gespeicherte `restarbeitId`
- gespeicherter `noteText`
- Ergebnisreferenz oder Notiz-ID, falls der Adapter sie liefert
- letzter Save-Statusmarker `success`
- `persisted: true`
- `previewOnly: false`

## Anzeige nach Fehler

Nach Fehler bleiben testbar:

- letzter Save-Statusmarker `error`
- Fehlerhinweis
- `persisted: false`
- `previewOnly: true`
- Entwurf und Payload bleiben erhalten
- ein erneuter Versuch bleibt moeglich, solange kein Erfolgssignatur-Duplikat
  existiert

## Doppelklick und Duplikate

- Waehrend `saving` wird ein zweiter Klick blockiert.
- Nach Erfolg wird die letzte erfolgreiche Payload-Signatur gespeichert.
- Dieselbe `restarbeitId` plus derselbe `noteText` wird danach nicht erneut
  gespeichert.
- Ein geaenderter Hinweistext erzeugt eine neue Payload-Signatur und kann
  wieder gespeichert werden, wenn alle Bedingungen weiter erfuellt sind.

## Kontrolliertes Sperren

Der Produktiv-Save kann kontrolliert wieder gesperrt werden, ohne neue
Nebenwege zu erzeugen:

- Schreibfreigabe-Konfiguration auf geschlossen setzen
- Gate geschlossen lassen
- Produktiv-Save-Adapter nicht bereitstellen
- Host-Kontext oder eindeutige `restarbeitId` nicht uebergeben

Nicht zulaessig bleiben:

- ENV- oder DEV-Modus als alleinige Freigabe
- Wildcard-Freigabe
- Default-true ohne Gate-Pruefung
- Speichern ohne Button-Klick
- Speichern ohne `restarbeitId`
- Speichern bei leerem Hinweistext
- kein localStorage
- kein writeFile
- neuer IPC-/DB-Schreibweg ausserhalb des vorhandenen Zielwegs

## Tests

Abgesichert wird der Stand in:

- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`

Die Tests pruefen Erfolg, Fehler, Doppelklickschutz, Duplikatschutz,
blockierte Zustaende, fehlenden Adapter, fehlende `restarbeitId`, leeren
Hinweistext und dass Rendern/Oeffnen keinen Adapteraufruf ausloest.

## Sichtpruefung

Die Sichtpruefung erfolgt ueber:

`Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor`

Zu pruefen sind Eingabe, Speichern, Erfolg, Fehler-/Blockierstatus,
Doppelklickschutz, Duplikatschutz und erneuter Save nach geaendertem Text.
