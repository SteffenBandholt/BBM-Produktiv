# Tabellenlayout - Inventar V1

Stand: 14.05.2026
Projekt: BBM-Produktiv / Tabellenlayout / Mini-Kalibrator

Dieses Inventar ist eine Bestandsaufnahme der heute sichtbaren Tabellen,
tabellenartigen Ausgaben und der vorhandenen Tabellenlayout-Technik.
Es aendert nichts am Produktivlaufweg und legt keine neue Registry an.

## 1. Kurzfazit

Es gibt heute genau drei explizit registrierte Tabellenlayouts in der zentralen
Registry:

- `protokoll_tops`
- `protokoll_participants`
- `project_firms`

Zusatzlich existiert ein generischer PDF-Sonderfall fuer `print.todo.todoTable`
und mehrere direkt im Print-Code verdrahtete Tabellen-/Listenpfade.

Die technisch sauberste und gleichzeitig kleinste naechste Layout-Stufe ist
aus heutiger Sicht **nicht** eine fertige produktive Tabelle, sondern eine
ungefaehrliche **Test-/Dummy-Tabelle** oder eine neue, noch nicht produktive
Tabelle.

`project_firms` ist zwar bereits registriert und fachlich klar, wird aber
bewusst **nicht** als erster Pilot verwendet, weil die Projekt-Firmenliste
produktiv, fachlich weitgehend fertig und fuer einen ersten Layoutversuch zu
empfindlich ist.

Die TOP-Liste bleibt der am tiefsten integrierte Sonderfall und ist fuer V1
nicht der naechste sichere Einstieg.

## 2. Gefundene Tabellen

| Tabelle | Bereich | UI | PDF | Risiko | Empfehlung |
|---|---|---:|---:|---|---|
| `protokoll_tops` | Protokoll | ja | ja | hoch | behalten, nicht als naechster V1-Pilot |
| `protokoll_participants` | Protokoll | ja | teilweise | mittel | spaeter / nach TOP-Pilot |
| `project_firms` | Projektverwaltung | ja | teilweise | mittel | behalten, nicht als erster Pilot; spaeter nur bei Bedarf und mit ausdruecklicher Freigabe |
| `print.todo.todoTable` | Protokoll / Druck | nein | ja | mittel | spaeter / technisch vorbereiteter Sonderfall |
| `firms`-Druckliste | Ausgabe / Druck | teilweise | ja | hoch | nicht als erster Pilot |

Legende:

- `ja` = klar vorhanden und direkt erkennbar
- `teilweise` = vorhanden, aber noch nicht sauber zentralisiert oder nur im
  Vorschau-/Unterbau verankert
- `nein` = nicht als eigene UI-Tabelle vorhanden

## 3. Details je Tabelle

### Tabelle: `protokoll_tops`

- tableKey: `protokoll_tops`
- Verwendung: UI und PDF
- Varianten: `portrait`, `landscape`
- sichtbare Spalten:
  1. TOP
  2. Gegenstand
  3. Status / Fertig bis / verantw.
- aktuelle Breitenquelle:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - UI: `ui.rootVars.--bbm-tops-list-*`
  - PDF: `pdf.columns.*.width`
  - produktiv wirksam ueber `TopsList`, `TopsScreen`, `PrintShell` und
    `printApp`
- aktuelle Schrift-/Paddingquelle:
  - `ui.rootVars` in `src/shared/tableLayouts/protokollTopsLayout.js`
  - `pdf.rootVars` in `src/shared/tableLayouts/protokollTopsLayout.js`
  - CSS-Fallbacks in `src/renderer/modules/protokoll/styles/tops.css` und
    `src/renderer/print/print.css`
- zentrale Layoutwerte vorhanden: ja
- Umbau-Risiko: hoch
- Empfehlung: behalten, aber fuer V1 nicht als naechsten neuen Pilot nehmen

Warum:

- die Tabelle ist bereits der am staerksten verdrahtete Sonderfall
- UI- und PDF-Pfad sind bereits eng gekoppelt
- die Save/Reset-Sonderlogik ist schon vorhanden

### Tabelle: `protokoll_participants`

- tableKey: `protokoll_participants`
- Verwendung: UI und PDF
- Varianten: `portrait`, `landscape`
- sichtbare Spalten:
  1. Name
  2. Funktion
  3. Firma
  4. Telefon / E-Mail
  5. Anwesend / Verteiler
- aktuelle Breitenquelle:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - Defaultwerte in `PROTOKOLL_PARTICIPANTS_COLUMNS`
  - PDF-Darstellung in `src/renderer/modules/protokoll/layoutSurfaces/participantsPdfLayoutSurface.js`
  - Print-Ausgabe und Vorschau ueber `src/renderer/print/layout/PrintShell.js`
  - Projekt-/Teilnehmer-UI ueber die Teilnehmer- und Auswahldialoge
- aktuelle Schrift-/Paddingquelle:
  - Registry-Defaultbreiten
  - `src/renderer/print/v2/v2.css` fuer den PDF-Tabellenbau
  - keine so zentrale gemeinsame Helper-Schicht wie bei `protokoll_tops`
- zentrale Layoutwerte vorhanden: teilweise
- Umbau-Risiko: mittel
- Empfehlung: spaeter angehen, nachdem eine einfachere produktive Tabelle
  centralisiert wurde

Warum:

- die Spalten sind fachlich klar, aber die Tabelle ist vom Teilnehmer- und
  Druck-Unterbau umgeben
- fuer V1 ist sie etwas weniger schlicht als `project_firms`

### Tabelle: `project_firms`

- tableKey: `project_firms`
- Verwendung: UI und PDF-Vorschau / Druckpfad im Unterbau
- Varianten: `portrait`, `landscape`
- sichtbare Spalten:
  1. Kurzbez.
  2. Funktion/Gewerk
  3. Aktiv
- aktuelle Breitenquelle:
  - `src/renderer/views/ProjectFirmsView.js`
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/main/db/tableLayoutsRepo.js`
  - `src/main/print/printData.js`
  - teilweise Print-Unterbau in `src/renderer/print/layout/PrintShell.js`
- aktuelle Schrift-/Paddingquelle:
  - feste UI-Werte in `src/renderer/views/ProjectFirmsView.js`
  - Registry-Defaultwerte in `src/shared/tableLayouts/tableLayoutRegistry.js`
  - Druck-CSS in `src/renderer/print/print.css`
- zentrale Layoutwerte vorhanden: teilweise
- Umbau-Risiko: mittel
- Empfehlung: behalten, nicht als erster Pilot; spaeter nur bei echtem Bedarf und mit ausdruecklicher Freigabe

Warum:

- die Tabelle ist bereits im Layout-Registry-Modell sichtbar
- sie hat nur drei Spalten und ist fachlich eindeutig
- sie ist produktiv, fachlich weitgehend fertig und deshalb fuer einen ersten
  Layoutversuch zu empfindlich (Risiko unbeabsichtigter Seiteneffekte in einer
  produktiven Kernliste)

### Tabelle: `print.todo.todoTable`

- tableKey: `print.todo.todoTable`
- Verwendung: PDF
- Varianten: `portrait`
- sichtbare Spalten:
  1. TOP
  2. Kurztext
  3. Status
  4. Fertig bis
  5. Ampel
- aktuelle Breitenquelle:
  - `src/renderer/print/layout/PrintShell.js`
  - generische Print-Regeln in `src/renderer/print/print.css`
  - Standardlayout-Hilfsfunktion in `src/shared/tableLayouts/tableLayoutRegistry.js`
- aktuelle Schrift-/Paddingquelle:
  - harte Werte im Print-Pfad
  - CSS-Fallbacks in `src/renderer/print/print.css`
  - kein eigener zentraler Tabellenvertrag fuer eine eigenstaendige UI
- zentrale Layoutwerte vorhanden: teilweise
- Umbau-Risiko: mittel
- Empfehlung: spaeter / technisch nur als Druck-Sonderfall behandeln

Warum:

- fachlich ist es eine echte Tabelle
- technisch ist sie aber stark an den Printweg gebunden
- sie ist kein sauberer zweiter Startpunkt vor `project_firms`

### Tabelle: Firmenliste im Druck (`firms`)

- tableKey: -
- Verwendung: PDF
- Varianten: `portrait`
- sichtbare Spalten:
  1. Firma
  2. Typ
  3. Aktiv
- aktuelle Breitenquelle:
  - `src/renderer/print/layout/PrintShell.js`
  - `src/renderer/print/print.css`
  - Datenbezug ueber `src/main/print/printData.js`
- aktuelle Schrift-/Paddingquelle:
  - harte Print-CSS-Regeln
  - Karten-/Blockanteile in der Druckausgabe
- zentrale Layoutwerte vorhanden: nein
- Umbau-Risiko: hoch
- Empfehlung: nicht als erster Pilot

Warum:

- die Ausgabe ist eine Mischform aus Tabelle und Karten-/Blockdarstellung
- die Struktur ist fuer einen ersten Layoutvertrag zu uneindeutig

## 4. Vorhandene Tabellenlayout-Technik

### Zentrale Registry und Layoutdefinitionen

- `src/shared/tableLayouts/tableLayoutRegistry.js`
- `src/shared/tableLayouts/protokollTopsLayout.js`

Die Registry ist die heutige zentrale Quelle fuer:

- Modul- und Tabellen-Definitionen
- Tabellen-Key
- sichtbare Spalten
- Varianten
- Defaultlayouts
- Preview-Daten
- Editor-Freigabe

Die TOP-Liste hat bereits einen eigenen Layout-Vertrag mit Overlay- und
Sanitizer-Hilfen.

### Persistenz und Resolvierung

- `src/main/db/tableLayoutsRepo.js`
- `src/main/ipc/tableLayoutsIpc.js`
- `src/main/db/database.js`

Diese Schicht ist fuer folgende Aufgaben aktiv:

- Layout lesen
- Layout speichern
- Layout zuruecksetzen
- Defaultlayout mit gespeichertem Overlay zusammenfuehren
- Layoutwerte validieren und bereinigen

### Renderer-Layout-Unterbau

- `src/renderer/layoutTools/autoTableLayout.mjs`
- `src/renderer/layoutTools/DevLayoutToolbar.js`
- `src/renderer/layoutTools/layoutCalibrationState.js`
- `src/renderer/layoutTools/README.md`
- `src/renderer/layoutTools/PERSISTENCE.md`

Dieser Unterbau ist DEV-only und dient dem Layout-Feintuning. Er ist nicht
selbst der Produktiv-Tabellenvertrag, sondern nur Hilfstechnik fuer Vorschau
und Kalibrierung.

### Print- und Vorschaupfade

- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/printApp.js`
- `src/renderer/print/print.css`
- `src/renderer/print/v2/v2.css`
- `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
- `src/renderer/modules/protokoll/layoutSurfaces/participantsPdfLayoutSurface.js`

Hier liegen die aktuell produktiven und halbstatischen Druck-/Vorschaupfade.
Ein Teil davon ist schon an die Registry angebunden, ein Teil ist noch hart
verdrahtet.

### Prototype-Editor

- `src/renderer/views/TableLayoutPrototypeEditor.js`

Das ist der registrierungsgetriebene DEV-Prototyp fuer die Sichtung und das
Testen von Layoutdaten. Er ist nuetzlich fuer die Bestandsaufnahme, aber kein
vollwertiger V1-Tabellenvertrag.

## 5. Klassifizierung vorhandener Technik

### behalten

- `src/shared/tableLayouts/tableLayoutRegistry.js`
- `src/shared/tableLayouts/protokollTopsLayout.js`
- `src/main/ipc/tableLayoutsIpc.js`
- `src/main/db/database.js` als Schema-Unterbau

### kapseln

- `src/renderer/layoutTools/DevLayoutToolbar.js`
- `src/renderer/layoutTools/layoutCalibrationState.js`
- `src/renderer/views/TableLayoutPrototypeEditor.js`
- `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
- `src/renderer/modules/protokoll/layoutSurfaces/participantsPdfLayoutSurface.js`

### anpassen

- `src/main/db/tableLayoutsRepo.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/printApp.js`
- `src/renderer/views/ProjectFirmsView.js`
- `src/renderer/print/v2/v2.css`

### stilllegen

- aktuelle Sonderlogik, die nur noch fuer die TOP-Liste gebraucht wird und
  spaeter durch allgemeinere Layoutpfade ersetzt werden kann

### spaeter entfernen

- harte Tabellenbreiten in `src/renderer/print/print.css`
- alte Fallback-Breiten in einzelnen Renderer-Views, sobald der zentrale
  Layoutpfad die Werte sauber traegt

### nicht fuer V1 verwenden

- `src/renderer/layoutTools/autoTableLayout.mjs`
- alle automatischen DOM-/CSS-/Print-Erkennungswege
- jede Logik, die Tabellen anhand sichtbarer Ueberschriften oder CSS-Klassen
  erraten will

## 6. Empfohlene erste Pilot-Tabelle

**Empfohlener erster Pilot (V1):**
Eine ungefaehrliche **Test-/Dummy-Tabelle** oder eine neue, noch nicht
produktive Tabelle.

**Begruendung:**

- erste Layout-Erprobung soll nicht an einer fertigen produktiven Tabelle
  erfolgen
- der erste Pilot soll bewusst isoliert und risikoarm sein (kein Eingriff in
  produktive Kernlisten)
- eine Dummy-/Testtabelle erlaubt einen sauberen Nachweis, ohne reale
  Endnutzerstrecken zu beruehren

**Risiko:**

- der Pilot muss als eigene kleine Referenz entstehen oder an eine neue,
  noch nicht produktive Tabelle gekoppelt werden (sonst besteht wieder
  Seiteneffekt-Risiko)

**Warum nicht TOP-Liste zuerst:**

- die TOP-Liste ist der komplizierteste und am staerksten spezielle Fall
- dort haengen bereits UI, PDF, Save/Reset und gemeinsame Hilfen zusammen
- ein erster Pilot sollte kleiner und weniger gekoppelt sein

**Naechster Auftrag:**

- Eine Dummy-/Testtabelle (oder eine neue, noch nicht produktive Tabelle) als
  erste echte Layout-Erprobung definieren und komplett ueber die zentrale
  Layouttechnik steuern.
- `project_firms` erst spaeter bei echtem Bedarf und nur mit ausdruecklicher
  Freigabe anfassen.

## 7. Nicht empfohlene Kandidaten

- `protokoll_tops`
  - bereits der am staerksten verdrahtete Pilot
  - zu viel Sonderlogik fuer einen ersten neuen V1-Schritt
- `protokoll_participants`
  - fachlich brauchbar, aber noch zu nah an Begleit- und Druckunterbau
- `print.todo.todoTable`
  - brauchbar, aber print-nah und nicht der kleinste produktive Einstieg
- `firms`-Druckliste
  - Mischform aus Tabelle und Kartenlayout
  - fuer V1 zu uneindeutig

## 8. Offene Fragen / Risiken

- Soll der erste Pilot als reine Dummy-/Testtabelle entstehen oder an eine neue,
  noch nicht produktive Tabelle gekoppelt werden?
- Wie wird der DEV-only Einstieg fuer die Pilot-Erprobung gewaehlt, ohne echte
  Endnutzerstrecken sichtbar zu beeinflussen?
- Welche bestehenden Print-CSS-Fallbacks duerfen im ersten Schritt bewusst
  unangetastet bleiben?
- Welche Layoutwerte sollen spaeter aus der Registry in den Print-Unterbau
  wandern und welche bleiben nur als Notfall-Fallbacks bestehen?
- Die aktuelle TOP-Sonderlogik bleibt ein Rest-Risiko, solange sie noch nicht
  allgemein genug umgebaut ist.

## 9. Naechster Auftrag

1. Einen ungefaehrlichen ersten Pilot definieren (Dummy-/Testtabelle oder neue,
   noch nicht produktive Tabelle).
2. Spalten/Keys/Defaults fuer diesen Pilot sauber festlegen und den Nachweis
   fuehren: eine Breite wird ueber einen zentralen Layoutwert geaendert.
3. Erst danach reale produktive Tabellen fuer spaetere Pakete bewerten.
4. `project_firms` erst spaeter bei echtem Bedarf und nur mit ausdruecklicher
   Freigabe anfassen.
