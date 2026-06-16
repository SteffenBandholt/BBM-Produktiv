# UI-Editor Grundlagen Bedarfsanalyse

## Kurzfazit

G92 ist eine reine Bedarfsanalyse. Sie beschreibt, welche Inhalte die fehlenden
UI-Editor-Grundlagen spaeter enthalten muessen, ohne die fehlenden
Pflichtdateien anzulegen oder eine Ersatzfreigabe zu erteilen. G90 bleibt
blockiert.

```text id="g92_kernsatz"
Diese Bedarfsanalyse ersetzt keine der fehlenden Pflichtunterlagen. Sie legt keine Pflichtgrundlage an und erteilt keine Freigabe fuer G90 oder spaetere UI-/PDF-Umsetzungen.
```

## Ausgangsstand nach G91

- G91 hat die Freigabe-/Ersatzentscheidung vorbereitet.
- Es wurde keine pauschale Ersatzfreigabe erteilt.
- Die fehlenden Pflichtunterlagen sind weiterhin nicht vorhanden.
- G90 bleibt bis zu einer ausdruecklichen Nutzerentscheidung blockiert.
- Die Surface-Auswahl bleibt read-only Kontextanzeige ohne aktive Umschaltung.

## Zweck der Bedarfsanalyse

Die Bedarfsanalyse soll die spaetere Erstellung der fehlenden Grundlagen
vorbereiten, damit die nachfolgenden UI-/PDF-Schritte nicht improvisiert
werden muessen. Sie beschreibt nur den Bedarf, nicht die fertige Datei.

## Fehlende Pflichtunterlagen

- `docs/EDITOR_BAUPLAN.md`
- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

## Erwarteter Inhalt je fehlender Pflichtunterlage

### `docs/EDITOR_BAUPLAN.md`

- Zweck des Editors
- Aufbau des UI-Editor-Panels
- Surface-/Panel-/Element-Konzept
- erlaubte und nicht erlaubte Bedienhandlungen
- Abgrenzung zu echter Surface-Umschaltung
- Abgrenzung zu Drag/Resize/Persistenz

### `docs/UI_ELEMENT_KATALOG.md`

- zulaessige Elementtypen
- Pflichtfelder je Element
- Identitaeten und IDs
- read-only vs. bearbeitbar
- keine Wildcard-Elemente
- kein Default-true

### `docs/UI_BAU_UND_PRUEFREGELN.md`

- Regeln fuer UI-Bau
- Pruefregeln vor Umsetzung
- Stop-Regeln
- Testpflichten
- Electron-Sichtpruefung bei sichtbarer UI
- keine Umsetzung bei fehlender Grundlage

### `docs/ZIEL_APP_ANBINDUNG.md`

- Ziel-App-Kontext
- Host-/Bestandssurface
- zulaessige Integrationspunkte
- verbotene Schreibwege
- DB-/IPC-Abgrenzung
- keine Persistenz ohne Freigabe

### `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

- PDF-/Plan-Kontext
- read-only Bedeutung
- Koordinatensysteme
- keine PDF-Bearbeitung
- keine Plan-/Canvas-Interaktion
- spaetere Freigabepunkte

## Abgrenzung: keine Ersatzfreigabe

Diese Analyse erweitert keine bestehende Freigabe. Sie benennt nur den Bedarf
fuer die spaetere Erstellung der Grundlagen und laesst G90 weiterhin blockiert.

## Abgrenzung: keine Pflichtdatei wurde angelegt

Die fuenf fehlenden Pflichtunterlagen wurden nicht erzeugt, nicht befuellt und
nicht als Platzhalter vorbereitet.

## Weiterhin blockierte Arbeiten

- sichtbare UI-Aenderungen am UI-Editor-Panel
- Surface-Auswahl-Hinweis im UI
- SurfaceInfo-Umbau
- aktive Surface-Umschaltung
- Drag
- Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege

## Moegliche Reihenfolge zur spaeteren Erstellung

1. `docs/EDITOR_BAUPLAN.md`
2. `docs/UI_ELEMENT_KATALOG.md`
3. `docs/UI_BAU_UND_PRUEFREGELN.md`
4. `docs/ZIEL_APP_ANBINDUNG.md`
5. `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

## Empfohlener naechster Schritt

Die fehlenden Pflichtunterlagen sollten spaeter regulaer und in der oben
benannten Reihenfolge erstellt werden. Bis dahin bleibt G90 blockiert.
