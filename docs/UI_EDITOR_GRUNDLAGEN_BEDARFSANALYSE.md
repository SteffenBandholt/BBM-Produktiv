# UI-Editor Grundlagen Bedarfsanalyse

## Kurzfazit

Nach Grundlagen 3/3 sind nun alle fuenf Minimal-Grundlagen regulaer vorhanden:
`docs/EDITOR_BAUPLAN.md`, `docs/ZIEL_APP_ANBINDUNG.md`,
`docs/UI_ELEMENT_KATALOG.md`, `docs/UI_BAU_UND_PRUEFREGELN.md` und
`docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`. Diese Bedarfsanalyse bleibt als
Vorgeschichte zu G92 erhalten.

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

## Bedarfsanalyse-Rueckblick

Bereits regulaer minimal erstellt:

- `docs/EDITOR_BAUPLAN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`
- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

## Erwarteter Inhalt je fehlender Pflichtunterlage

### `docs/EDITOR_BAUPLAN.md`

- Zweck des Editors
- Aufbau des UI-Editor-Panels
- Surface-/Panel-/Element-Konzept
- erlaubte und nicht erlaubte Bedienhandlungen
- Abgrenzung zu echter Surface-Umschaltung
- Abgrenzung zu Drag/Resize/Persistenz

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

## Nachtrag Grundlagen 1/3

Mit Grundlagen 1/3 wurden zwei der damals fehlenden Pflichtunterlagen
regulaer erstellt:

- `docs/EDITOR_BAUPLAN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`

Das ist keine UI-/PDF-Umsetzung und keine Ersatzfreigabe fuer die uebrigen
Grundlagen.

## Nachtrag Grundlagen 2/3

Mit Grundlagen 2/3 wurden zwei weitere Minimal-Grundlagen regulaer erstellt:

- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`

Damit sind die UI-Editor-Basics fuer Elementkatalog und Bau-/Pruefregeln nun
knapp und belastbar vorhanden. Offen bleibt nur noch die
`docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`.

G118 normalisiert den lokalen Host-Kontext nur intern; daran aendert sich
nichts an der Freigabelage dieser Grundlagen.

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
2. `docs/ZIEL_APP_ANBINDUNG.md`
3. `docs/UI_ELEMENT_KATALOG.md`
4. `docs/UI_BAU_UND_PRUEFREGELN.md`
5. `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

## Empfohlener naechster Schritt

Die Grundlagenreihe ist nun vollstaendig. Spaetere UI-/PDF-Umsetzungen bleiben
dennoch an die Stop-Regel und den Freigabeumfang gebunden.
