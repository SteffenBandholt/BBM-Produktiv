# Tabellenlayout-Contract: project_firms

## 1. Ausgangslage

Der Tabellenlayout-Pilot `protokoll_tops` ist bereits technisch und fachlich umgesetzt.
Der naechste Firmen-/Personen-Kandidat ist laut Scope-Doku die Projekt-Firmenliste in `ProjectFirmsView.js`.
Der UI-Anschluss fuer `project_firms` ist inzwischen umgesetzt; dieser Contract bleibt als fachliche Referenz fuer die generische Spaltenstruktur und den offenen PDF-Schritt bestehen.

Diese Doku legt den fachlichen und technischen Contract fest, bevor fuer `project_firms` Code gebaut wird.

## 2. Fachliche Zuordnung

`project_firms` ist fachlich **Projektverwaltung**.

Begruendung:

- die Tabelle lebt in `src/renderer/views/ProjectFirmsView.js`
- sie ist an den Projektkontext gebunden
- sie beschreibt Projekt-Firmen, nicht den globalen Firmenstamm
- der Kontext ist klar fachlich auf Projektverwaltung ausgerichtet

Nicht passend als Hauptzuordnung:

- `protokoll` - zu weit vom fachlichen Ort entfernt
- `firms` - zu generisch, weil es hier nicht um den globalen Firmenstamm geht
- `project` - zu unspezifisch

## 3. Empfohlener moduleId

Empfohlener `moduleId` fuer den naechsten Pilot:

- `projektverwaltung`

Begruendung:

- entspricht dem vorhandenen fachlichen Modulbegriff im Codebaum
- passt zur strukturellen Einordnung der Datei `ProjectFirmsView.js`
- grenzt die Tabelle klar vom Protokollmodul und vom globalen Firmenstamm ab

## 4. tableKey

Empfohlener `tableKey`:

- `project_firms`

Das ist der konkrete, tabellenbezogene Schluessel fuer die Projekt-Firmenliste.

## 5. Tabellenlabel

Empfohlenes Label im Tabellenlayout-Editor:

- `Projekt-Firmenliste`

Optional ergaenzend:

- `Projektfirmen`

Die besser lesbare Fachbezeichnung fuer den Editor ist `Projekt-Firmenliste`.

## 6. Spaltenmodell

Fuer den ersten Pilot sind folgende Spalten verbindlich:

- `Kurzbez.`
- `Funktion/Gewerk`
- `Aktiv`

Aktuelle Fachbedeutung:

- `Kurzbez.` = kuerzeste Projektkennung der Firma
- `Funktion/Gewerk` = fachliche Einordnung oder Gewerk im Projekt
- `Aktiv` = Firma ist in der Projekt-/TOP-Auswahl sichtbar

Bezug zur aktuellen UI:

- die Tabelle in `ProjectFirmsView.js` hat exakt diese dreispaltige Struktur
- das macht sie fuer den ersten layoutbaren Firmenkandidat gut geeignet
- das Layout wird im Registry-/Editor-Modell als `columns`-Liste gepflegt
- jede Spalte traegt Label, UI-Breite, PDF-Breite, Gewichtung und Preview-Wert

## 7. UI-Layoutwerte

Empfohlene UI-Spaltenwerte fuer den ersten Pilot:

- `Kurzbez.`: kompakte feste Breite, z. B. `160px`
- `Funktion/Gewerk`: flexible Hauptspalte, z. B. `1fr`
- `Aktiv`: schmale Statusspalte, z. B. `70px`

Technische Einordnung:

- die aktuelle UI ist bereits dreispaltig und sehr kompakt
- das Layout ist klar genug fuer einen registrierten Tabellenlayout-Eintrag
- der Pilot kann mit festen bzw. leicht flexiblen Grid-Track-Werten arbeiten

Empfohlene Zielstruktur fuer die Registry:

- UI-Spalte 1: `160px`
- UI-Spalte 2: `1fr`
- UI-Spalte 3: `70px`

## 8. PDF-Layoutwerte / Entscheidung

Fuer diesen Schritt ist ein PDF-Bezug fachlich plausibel, aber **noch nicht zwingend aktiv zu verbinden**.

Empfehlung:

- PDF-Layout vorbereiten
- im ersten Umsetzungsschritt aber noch nicht produktiv anschliessen

Begruendung:

- die Projekt-Firmenliste ist fachlich nah an den Firmen-Druckpfaden
- gleichzeitig gibt es fuer `project_firms` noch keinen sauberen, eigenstaendigen PDF-Tabellenpiloten
- der sichere kleinste naechste Schritt ist deshalb: UI-Layout modellieren, PDF-Struktur schon im Contract vorsehen, aber erst spaeter in den Druckweg ziehen

Empfohlene PDF-Spaltenwerte fuer spaeter:

- `Kurzbez.`: z. B. `23mm`
- `Funktion/Gewerk`: z. B. `auto` oder `1fr`
- `Aktiv`: z. B. `15ch` oder ein kompakter Statuswert

Empfohlene Entscheidung fuer jetzt:

- PDF vorerst **deaktiviert / nicht angeschlossen**
- der Contract kann die PDF-Felder aber bereits vorsehen

Aktueller Stand:

- die UI der Projekt-Firmenliste nutzt bereits gespeicherte UI-Spaltenbreiten ueber den Tabellenlayout-Resolver
- der PDF-Pfad fuer `project_firms` bleibt bewusst noch getrennt und unverdrahtet

## 9. Preview-Testdaten

Sinnvolle Vorschau-Testdaten fuer `project_firms`:

- Projektfirma mit aktivem Eintrag
- Projektfirma mit langem Gewerktext
- Projektfirma mit inaktivem Eintrag

Beispielwerte:

- `Kurzbez.`: `AB`, `ME`, `HK`
- `Funktion/Gewerk`: `Rohbau`, `Elektro`, `HLS`
- `Aktiv`: `ja` / `nein`

Die Testdaten sollten:

- die schmale Kurzbez.-Spalte pruefen
- lange Gewerktexte sichtbar machen
- den Aktiv-Status klar demonstrieren

## 10. Risiken

Risiken bei `ProjectFirmsView.js`:

- der Bereich ist an den Projektkontext gebunden
- die Seite enthaelt neben der Tabelle auch Formulare und Zuordnungslogik
- es gibt einen UI-/Projektfluss mit mehreren Zustaenden
- eine zu breite Einbindung koennte leicht den Projektkontext, Auswahlzustand oder Zuordnungslogik beruehren

Warum das fuer den naechsten Pilot trotzdem akzeptabel ist:

- die konkrete Tabelle selbst ist klar und klein
- der Tabellenlayout-Contract kann streng auf die dreispaltige Liste begrenzt werden
- das Risiko liegt eher im Umschalt-/Umfeldbereich als in der Tabelle selbst

## 11. Umsetzungsplan fuer den naechsten Code-Schritt

1. `project_firms` als registrierte Tabelle im Tabellenlayout-System vorbereiten.
2. Einmalig die Registry fuer `projektverwaltung` mit der Projekt-Firmenliste erweitern.
3. Die drei verbindlichen Spalten als UI-Layoutwert in den Contract uebernehmen.
4. PDF-Felder nur vorbereiten, noch nicht in den Druckweg einfliessen lassen.
5. Preview-Testdaten fuer die Tabellenlayout-Vorschau definieren.
6. Erst danach pruefen, ob der PDF-Bezug fuer `project_firms` in einem zweiten kleinen Schritt sinnvoll ist.

Empfohlene Prioritaet:

- zuerst UI-Layout fuer `project_firms`
- danach erst PDF-Anschluss, falls fachlich noetig
