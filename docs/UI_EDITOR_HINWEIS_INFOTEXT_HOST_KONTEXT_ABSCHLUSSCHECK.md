# UI-Editor Hinweis-Infotext Host-Kontext Abschlusscheck

## Kurzfazit

Die Host-Kontext-Vorbereitung fuer `Hinweis / Infotext` ist als gesicherter
Abschluss- und Referenzstand dokumentiert. Es bleibt bei read-only Anzeige,
lokaler Normalisierung und gesperrtem Speicherweg.

## Gepruefter Ist-Stand

- Der UI-Editor kennt einen lokalen Host-Kontext-Status.
- Ohne echte Host-Uebergabe bleibt `isPresent: false`.
- `projectId` und `restarbeitId` bleiben ohne Host-Uebergabe `null`.
- `targetContext` bleibt `Restarbeiten`.
- `targetSurfaceId` bleibt `restarbeiten.ui.main`.
- `targetLabel` bleibt `nicht ausgewählt`.
- `elementType` bleibt `Hinweis / Infotext`.
- Im UI bleibt sichtbar, dass der Restarbeit-Kontext fehlt.
- `restarbeitId` wird nicht gesucht, nicht geraten und nicht aus Text oder
  SurfaceId abgeleitet.
- Der Button `Entwurf speichern` bleibt deaktiviert.
- Es gibt kein Speichern, keinen Submit, keine IPC-/DB-Schreibaktion,
  kein localStorage und kein writeFile.

## Host-Kontext-Datenvertrag

- `projectId` und `restarbeitId` bleiben Host-Daten.
- `targetContext` bleibt fest `Restarbeiten`.
- `targetSurfaceId` bleibt fest `restarbeiten.ui.main`.
- `targetLabel` muss spaeter sichtbar und nicht leer sein.
- `elementType` bleibt fest `Hinweis / Infotext`.

## Statusmodell

- Der Renderer arbeitet mit einem lokalen `hostContextStatus`-Modell.
- Der Defaultzustand bleibt leer und read-only.
- Die Anzeige bleibt eine Vorstufe und keine echte Host-Uebergabe.

## Normalisierung

- `normalizeHostContextStatus` trimmt gueltige Werte.
- Unvollstaendige oder ungueltige Eingaben fallen auf den Default zurueck.
- Zusatzfelder werden ignoriert.

## Sichtbarer fehlender Kontext

- `Restarbeit-Kontext` bleibt sichtbar.
- `Restarbeit-Kontext vorhanden: nein` bleibt sichtbar.
- `Speichern bleibt gesperrt` bleibt sichtbar.

## Aktivierungsbedingungen fuer spaeteres Speichern

Der Speicherbutton darf spaeter nur aktiv werden, wenn:
- Hinweistext gueltig ist.
- projectId eindeutig vom Host vorhanden ist.
- restarbeitId eindeutig vom Host vorhanden ist.
- targetContext exakt `Restarbeiten` ist.
- targetSurfaceId exakt `restarbeiten.ui.main` ist.
- elementType exakt `Hinweis / Infotext` ist.
- targetLabel sichtbar und nicht leer ist.
- Schreibweg ausdruecklich freigegeben ist.
- Speichern durch sichtbare Nutzeraktion ausgelöst wird.

## Bestaetigter Nicht-Speicher-Stand

- kein aktiver Speicherbutton
- kein Submit
- kein Speichern
- keine persistente Element-Erstellung
- keine IPC-/DB-Schreibaktion
- kein localStorage
- kein writeFile
- keine direkte Dateischreibung
- keine automatische Persistenz beim Tippen
- kein Speichern ueber Payload-Vorschau
- kein Speichern bei leerem Hinweistext
- kein Speichern ohne eindeutige `restarbeitId`
- kein Speichern in PDF-/Plan-read-only-Kontexte

## Weiterhin blockiert

- echte Host-Uebergabe
- aktiver Speicherbutton
- Submit
- Speichern
- persistente Element-Erstellung
- IPC-/DB-Schreibweg
- localStorage
- writeFile
- direkte Dateischreibung
- automatische Persistenz beim Tippen
- Speichern ueber Payload-Vorschau
- Speichern bei leerem Hinweistext
- Speichern ohne eindeutige `restarbeitId`
- Speichern in PDF-/Plan-read-only-Kontexte
- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- Drag
- Resize
- Wildcard-Freigaben
- Default-true-Freigaben

## Testabdeckung

- `npm run check:ui-editor-kit`
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefungen der vorherigen Pakete

- G118: sichtbare Restarbeit-Kontextanzeige und gesperrter Speicherzustand

## Empfohlener naechster Schritt

Den Host-Kontext weiter nur als vorbereiteten Zwischenstand behandeln, bis
ein spaeterer Host die echten Werte bewusst liefert.
