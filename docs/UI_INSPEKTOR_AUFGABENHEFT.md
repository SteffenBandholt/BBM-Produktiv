# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M10 abgeschlossen (Overlay nur anzeigen).

Aktueller Stand:
- M1 bis M10 abgeschlossen.

## Haken-System
- `[x]` erledigt
- `[ ]` offen
- Änderungen am Status müssen bei jedem UI-Inspektor-Auftrag nachgeführt werden.

## Meilensteinliste (Checkliste)
- [x] M1 Projektklärung fachlich freigegeben
- [x] M1.1 Projektdateien im Repo angelegt
- [x] M2 Arbeitsvertrag und Regeln finalisiert
- [x] M3 Projektgedächtnis vollständig
- [x] M4 Architektur des exportierbaren Moduls final
- [x] M5 Umsetzungsplan ohne Code final
- [x] M6 erster Code-Schritt: Modulgerüst
- [x] M7 Layout-Landkarten-Format definieren
- [x] M8 Restarbeiten als erste Pilot-Landkarte dokumentieren
- [x] M9 Restarbeiten-DOM-Markierungen minimal einführen
- [x] M10 Overlay nur anzeigen
- [x] M12 Panel zeigt erlaubte Stellschrauben

## Definition of Done (DoD)
Ein UI-Inspektor-Meilenstein gilt nur als erledigt, wenn:
1. Ergebnis im Aufgabenheft eingetragen wurde
2. Checkliste passend aktualisiert wurde
3. offene Punkte/Risiken benannt wurden
4. der nächste konkrete Meilenstein genannt wurde
5. die Regeln aus `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md` eingehalten und geprüft wurden

## Pflichtregel
Kein Codex-Auftrag gilt als fertig, wenn das Aufgabenheft nicht aktualisiert wurde.

## M2 Abschlussnotiz
- M2 Arbeitsvertrag und Regeln finalisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `AGENTS.md`

## M3 Abschlussnotiz
- M3 Projektgedächtnis vollständig strukturiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_START_HIER.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `AGENTS.md`
- Einstiegspunkt für neue Chats und Codex-Läufe:
  - `docs/UI_INSPEKTOR_START_HIER.md`

## Lesereihenfolge für neue Chats
1. `docs/UI_INSPEKTOR_START_HIER.md`
2. `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
3. `docs/UI_INSPEKTOR_PROJEKTAUFTRAG.md`
4. `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md`
5. `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
6. `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`

## Aktueller Stand für neue Chats
- Projektphase: Modulgerüst vorhanden
- Implementierungscode: M6-Grundgerüst angelegt
- UI-Inspector-Modul: vorhanden (ohne sichtbare UI)
- App-Funktionen: keine Änderungen

## Nächster Schritt
Als nächster Schritt folgt:
- **M11 Bereich anklicken und Auswahl anzeigen**

Hinweis:
- M6 hat nur ein Modulgerüst gebaut, ohne sichtbare UI-Funktion


## M4 Abschlussnotiz
- M4 Architektur des exportierbaren UI-Inspektor-Moduls vertieft und als Schichtenmodell konkretisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Nächster Schritt:
  - **M5 Umsetzungsplan ohne Code finalisieren**
- Hinweis:
  - Noch kein Code, noch kein Modulgerüst


## M5 Abschlussnotiz
- M5 Umsetzungsplan ohne Code finalisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_UMSETZUNGSPLAN.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `AGENTS.md`
- Nächster Schritt:
  - **M6 erster Code-Schritt: Modulgerüst**
- Hinweis:
  - Ab M6 beginnt Code, aber nur Modulgerüst ohne sichtbare Funktion


## M6 Abschlussnotiz
- M6 erstes Code-Paket als reines UI-Inspector-Modulgerüst umgesetzt.
- Geänderte/neu angelegte Dateien:
  - `src/shared/uiInspector/uiInspectorCore.js`
  - `src/shared/uiInspector/uiInspectorRegistry.js`
  - `src/shared/uiInspector/uiInspectorStore.js`
  - `src/shared/uiInspector/uiInspectorTypes.js`
  - `src/shared/uiInspector/index.js`
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorOverlay.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `src/renderer/uiInspector/index.js`
  - `scripts/tests/uiInspectorCore.test.cjs`
  - `scripts/tests/uiInspectorRegistry.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M6 enthält nur Modulgerüst, kein Overlay, keine Restarbeiten-Anbindung, keine sichtbare App-Funktion.


## M7 Abschlussnotiz
- M7 Layout-Landkarten-Format als reines Core-/Registry-Schema definiert und mit Tests abgesichert.
- Geänderte/neu angelegte Dateien:
  - `src/shared/uiInspector/uiInspectorMapSchema.js`
  - `src/shared/uiInspector/uiInspectorRegistry.js`
  - `src/shared/uiInspector/index.js`
  - `scripts/tests/uiInspectorMapSchema.test.cjs`
  - `scripts/tests/uiInspectorRegistry.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M7 definiert nur das Layout-Landkarten-Format, noch keine echte App-Anbindung, kein Overlay, keine Restarbeiten-DOM-Markierung und keine sichtbare App-Funktion.


## M8 Abschlussnotiz
- M8 Restarbeiten als erste Pilot-Landkarte rein dokumentarisch festgehalten.
- Geänderte/neu angelegte Dateien:
  - `docs/ui-landkarten/RESTARBEITEN.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests/Prüfung:
  - `git diff --stat`
  - `git diff --name-only`
  - `git status --short --branch`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M8 hat nur dokumentiert, keine DOM-Markierungen eingebaut, kein Overlay gebaut und keine sichtbare UI-Funktion ergänzt.


## M9 Abschlussnotiz
- M9 hat in der bestehenden Restarbeiten-UI ausschließlich minimale `data-ui-inspector-id` DOM-Markierungen ergänzt.
- Kein Overlay, kein Panel, keine sichtbare UI-Funktion, keine Layoutänderung, keine Fachlogik- oder Speicherlogik-Änderung.
- Geänderte/neu angelegte Dateien:
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/ui-landkarten/RESTARBEITEN.md`
- Tests/Prüfung:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M10 Overlay nur anzeigen**


## M10 Abschlussnotiz
- M10 hat ein reines Anzeige-Overlay für vorhandene `data-ui-inspector-id` Marker eingeführt.
- Enthalten: Overlay-Rahmen + Inspector-ID-Label, aktivierbar im Restarbeiten-Screen über `Strg + Alt + I`.
- Nicht enthalten: Panel, Klickauswahl, Layoutänderung, Speicherung.
- Geänderte/neu angelegte Dateien:
  - `src/renderer/uiInspector/UiInspectorOverlay.js`
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
  - `scripts/tests/uiInspectorOverlay.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/ui-landkarten/RESTARBEITEN.md`
- Tests/Prüfung:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M11 Bereich anklicken und Auswahl anzeigen**


## M11 Abschluss (neu)
- Status: erledigt.
- Auswahl erfolgt jetzt über eine temporäre Trefferliste am Klickpunkt (statt Handle-Ansatz aus PR #152).
- Keine Panels, keine Werteanzeige, keine Speicherung, keine Layoutänderung.
- Geänderte Dateien: `src/renderer/uiInspector/UiInspectorOverlay.js`, `src/renderer/uiInspector/UiInspectorRuntime.js`, `scripts/tests/uiInspectorOverlay.test.cjs`, `scripts/tests/restarbeitenModule.test.cjs`, `docs/UI_INSPEKTOR_AUFGABENHEFT.md`, `docs/UI_INSPEKTOR_START_HIER.md`, `docs/ui-landkarten/RESTARBEITEN.md`, `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`.
- Tests: `node scripts/tests/uiInspectorCore.test.cjs`, `node scripts/tests/uiInspectorRegistry.test.cjs`, `node scripts/tests/uiInspectorMapSchema.test.cjs`, `node scripts/tests/uiInspectorOverlay.test.cjs`, `node scripts/tests/restarbeitenModule.test.cjs`, `npm test`.
- Nächster Schritt: M12 – Panel zeigt erlaubte Stellschrauben.


## M12 Abschluss
- Status: erledigt.
- Panel zeigt nur ausgewählten Bereich und erlaubte Stellschrauben (read-only).
- Keine Werteänderung, keine Speicherung, keine Layoutänderung.
- Geänderte Dateien: `src/renderer/uiInspector/UiInspectorPanel.js`, `src/renderer/uiInspector/UiInspectorRuntime.js`, `src/renderer/uiInspector/UiInspectorOverlay.js`, `scripts/tests/uiInspectorPanel.test.cjs`, `scripts/tests/restarbeitenModule.test.cjs`, `docs/UI_INSPEKTOR_AUFGABENHEFT.md`, `docs/UI_INSPEKTOR_START_HIER.md`, `docs/ui-landkarten/RESTARBEITEN.md`, `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`.
- Tests: `node scripts/tests/uiInspectorCore.test.cjs`, `node scripts/tests/uiInspectorRegistry.test.cjs`, `node scripts/tests/uiInspectorMapSchema.test.cjs`, `node scripts/tests/uiInspectorOverlay.test.cjs`, `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/uiInspectorPanel.test.cjs`, `npm test`.
- Nächster Schritt: M13 – Werte temporär anwenden, aber noch nicht speichern.


## M13 Abschlussnotiz
- Temporäre Vorschau für Breite/Höhe/Abstand links/Abstand oben/Sichtbarkeit ergänzt.
- Keine Speicherung implementiert.
- Reset pro Element und global bei Deaktivierung aktiv.
- Geänderte Dateien: `UiInspectorPanel.js`, `UiInspectorRuntime.js`, `UiInspectorTemporaryStyles.js`, Tests und Doku.
- Nächster Schritt: M14 Speichern / Standard zurück.


## M13 Nachkorrektur (PR #155 Folgefeedback)
- `width` und `height` werden in der temporären Vorschau nach unten auf mindestens `1px` begrenzt.
- `marginLeft`/`marginTop` bleiben weiterhin auch negativ möglich.
- Tests ergänzt: Untergrenzenfälle für Breite/Höhe und negatives Margin-Verhalten.
- Nächster Schritt: M14 Speichern / Standard zurück (unverändert).


## M13 Nachkorrektur (PR #155 Filterleisten-Control-Zuordnung)
- Bekannte Filterleisten-Bereiche `restarbeiten.filterleiste.verortung` und `restarbeiten.filterleiste.klassenfilter` in die M13-Container-Control-Zuordnung aufgenommen.
- `.feld`-Unterbereiche bleiben über die bestehende Field-Suffix-Regel abgedeckt.
- Tests ergänzt: `getAllowedControlsForSelectedId(...)` liefert für beide Bereiche sowie optional für `.feld` weiterhin die erwarteten Stellschrauben.
- Nächster Schritt: M14 Speichern / Standard zurück (unverändert).
