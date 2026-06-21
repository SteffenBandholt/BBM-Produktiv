# G137 - UI-Editor Hinweis/Infotext Produktiv-Speicherbutton Aktivierung

G137 aktiviert den echten Produktiv-Speicherbutton fuer Hinweis-/Infotext-Entwuerfe nur unter engen, expliziten Bedingungen.

## Entscheidung

Der Produktiv-Speicherweg ist nicht mehr generell blockiert. Er wird ausschliesslich freigegeben, wenn alle fachlichen und technischen Bedingungen gleichzeitig erfuellt sind.

G137 aktiviert keinen automatischen Save beim Oeffnen des UI-Editors. Speichern erfolgt nur nach einem aktiven Button-Klick.

## Editieren bleibt vom Speicher-Gate getrennt

Der Hinweis-/Infotext muss im Edit-Panel jederzeit lokal editierbar bleiben.
Das gilt auch dann, wenn:

- der Host-Kontext noch fehlt
- das Schreibfreigabe-Gate geschlossen ist
- der Speicherbutton deaktiviert ist
- der Produktiv-Save-Adapter nicht verfuegbar ist
- der Hinweistext leer ist

Das Speicher-Gate blockiert nur Speichern, nicht Fokus, Texteingabe oder
lokale Payload-Vorschau. Ein `mousedown` auf dem Hinweis-/Infotext-Textfeld
darf deshalb nicht per `preventDefault()` den Browser-Fokus verhindern.

## Bedingungen fuer Button-Aktivierung

Der Speicherbutton darf nur aktiv sein, wenn alle Bedingungen erfuellt sind:

- Host-Kontext vorhanden: ja
- `projectId` vorhanden: ja
- `restarbeitId` vorhanden: ja
- Zielkontext: `Restarbeiten`
- Ziel-Surface: `restarbeiten.ui.main`
- Elementtyp: `Hinweis / Infotext`
- Hinweistext gueltig: ja
- Payload vollstaendig: ja
- Schreibfreigabe-Konfiguration explizit aktiv
- Schreibfreigabe-Gate offen
- Produktiv-Save-Adapter verfuegbar
- keine Speicherung laeuft
- dieselbe Payload wurde nicht bereits erfolgreich gespeichert

## Echte Speicher-Signatur

Der echte Speicherweg verwendet den bestehenden Restarbeiten-Notizvertrag:

```js
window.bbmDb.restarbeitenCreateNote({
  restarbeitId,
  noteText,
});
```

Der Zielkanal bleibt:

```text
restarbeiten:createNote
```

Die Produktiv-Payload enthaelt nur:

- `restarbeitId`
- `noteText`

`projectId` bleibt Kontextinformation im UI-Editor und wird nicht als zusaetzliches Pflichtfeld in den bestehenden IPC-Vertrag gedrueckt.

## Erfolg und Fehler

Bei Erfolg:

- genau ein Save-Versuch wurde ausgefuehrt
- Erfolg wird sichtbar zurueckgemeldet
- `persisted: true`
- `previewOnly: false`
- die gespeicherte Payload-Signatur wird gemerkt

Bei Fehler:

- Fehler wird sichtbar zurueckgemeldet
- Entwurf und Hinweistext bleiben erhalten
- `persisted: false`
- `previewOnly: true`
- erneuter Versuch bleibt moeglich, sobald die Bedingungen weiter erfuellt sind

## Doppelklick- und Mehrfachspeicherschutz

G137 schuetzt gegen versehentliche Mehrfachspeicherung:

- waehrend einer laufenden Speicherung bleibt ein zweiter Klick blockiert
- eine bereits erfolgreich gespeicherte identische Payload wird blockiert
- geaenderter Hinweistext erzeugt eine neue Payload-Signatur und kann erneut gespeichert werden

## Nicht zulaessig

- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern bei leerem Hinweistext
- kein automatisches Speichern beim Oeffnen
- keine automatische Restarbeit-Auswahl
- kein Default-true ohne vollstaendige Gate-Pruefung
- keine Wildcard-Freigabe
- keine DEV-Modus-Freigabe als alleinige Bedingung
- keine ENV-Freigabe als alleinige Bedingung
- kein Speichern ausserhalb von `window.bbmDb.restarbeitenCreateNote`
- kein localStorage
- kein writeFile

## Aktueller Referenzstand

- Schreibfreigabe-Konfiguration: explizit aktiv
- Gate: nur bei vollstaendigem Restarbeiten-Kontext offen
- Speicherbutton: nur bei vollstaendigem Gate und verfuegbarem Produktiv-Adapter aktiv
- Save-Ausfuehrung: nur nach Button-Klick
- Zielmethode: `window.bbmDb.restarbeitenCreateNote`
- Zielkanal: `restarbeiten:createNote`
- Erfolgsstatus nach bestaetigtem Save: `persisted: true`, `previewOnly: false`
- Fehlerstatus: `persisted: false`, `previewOnly: true`

## Tests

Der Referenzstand wird in `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` abgesichert:

- Button bleibt ohne Host-Kontext deaktiviert.
- Button bleibt ohne `restarbeitId` deaktiviert.
- Button bleibt bei leerem Hinweistext deaktiviert.
- Button wird mit vollstaendigem Restarbeiten-Kontext und verfuegbarem Produktiv-Adapter aktiv.
- Textfeld bleibt editierbar, auch wenn Gate/Button das Speichern blockieren.
- Aenderungen im Textfeld aktualisieren `noteText` in der Payload-Vorschau.
- Klick uebergibt genau `{ restarbeitId, noteText }`.
- Doppelklick wird blockiert.
- identische Mehrfachspeicherung wird blockiert.
- Fehler wird sichtbar als Fehlerstatus behandelt.
