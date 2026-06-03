# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M13.6a abgeschlossen (Panel ist aus dem Header gelöst und bleibt verschiebbar). K19.13a abgeschlossen (BBM-Test ist an aktuelle UI-Editor-Installer-Artefakte angepasst).

Aktueller Stand:
- M1 bis M13.6a abgeschlossen.
- K19.0 abgeschlossen: erste explizite UI-Elementliste fuer das Protokoll-Modul, ohne Editor-Integration und ohne produktive UI-Aenderung.
- K19.7 abgeschlossen: installierter Einstieg unter `uiEditor/` war mit dem offiziellen BBM-Registry-Einstieg verbunden, ohne produktive UI-Aenderung.
- K19.9a abgeschlossen: `uiEditor/` enthaelt installierte UI-Editor-Artefakte; die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js`; `scripts/test.cjs` ist nicht direkt an installierte Artefakt-Testdateien gekoppelt.
- K19.13a abgeschlossen: Der BBM-Artefakttest erkennt `uiEditor.global` robust ueber `id`, `uiScope`, `uiScopeId` oder den Registry-Schluessel und verlangt `uiEditor/targetAppRegistry.js` als installiertes Pflichtartefakt.

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
- [x] M12.1 Restarbeiten-Gruppenmarker als echte DOM-Container ergänzen
- [x] M13.2 Temporäre Vorschau auf ausgewählten Elementen
- [x] M13.2.1 Gerichtete Stellschrauben und Gruppenposition X/Y ergänzen
- [x] M13.3 Rahmen-zuerst-Bedienung mit Feldnavigation
- [x] M13.4a UI-Editor: Dev-Button und Scanstatus ohne Bearbeitung
- [x] M13.4a.1 UI-Editor: Scanstatus korrekt machen
- [x] M13.4a.2 UI-Editor: Scanroot und Listenmarker korrekt bewerten
- [x] M13.4b UI-Editor: Objektwahl ohne Bearbeitung
- [x] M13.4b.1 UI-Editor: Auswahlmodus-Schalter im Scanpanel sichtbar verdrahten
- [x] M13.5a UI-Editor-Vertrag und Restarbeiten-Rahmenlandkarte festlegen
- [x] M13.5b Pflichtstruktur-Tests für den UI-Editor-Vertrag
- [x] M13.5c Restarbeiten-UI Rahmenstruktur editorfähig vorbereiten
- [x] M13.6 UI-Editor: Rahmenmodus nur für editorfähige Rahmenziele
- [x] M13.6a UI-Editor-Panel aus Header lösen und verschiebbar halten
- [x] K19.0 BBM liefert explizite Protokoll-UI-Elementliste ohne Scan/Integration
- [x] K19.7 Installierte UI-Editor-Grundstruktur mit echter BBM-Registry verbinden
- [x] K19.9a BBM-Testeinbindung nach Neuinstallation der UI-Editor-Artefakte trennen
- [x] K19.13a BBM-Test an aktuelle UI-Editor-Installer-Artefakte anpassen

## Statusupdate K19.13a
- `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs` erkennt den globalen UI-Editor-Scope robust ueber `id`, `uiScope`, `uiScopeId` oder einen standardisierten Registry-Schluessel.
- `uiEditor/targetAppRegistry.js` ist als neutrales installiertes Pflichtartefakt im Artefaktbestand enthalten.
- Die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js` und wird weiterhin auf `protokoll.topsScreen` und `protokoll.root` geprueft.
- Keine Ziel-App-Fachlogik in `uiEditor/`, keine Speicherung, kein Editor-Panel, kein DOM-Scan und keine automatische UI-Erkennung.

## Statusupdate K19.9a
- `uiEditor/` enthaelt installierte UI-Editor-Artefakte.
- Die BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js`.
- `scripts/test.cjs` ist nicht direkt an installierte Artefakt-Testdateien unter `uiEditor/tests/` gekoppelt.
- BBM prueft installierte UI-Editor-Artefakte ueber `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs`.
- Keine Editor-Integration, kein Panel, kein Hover-Rahmen, kein DOM-Scan, keine Speicherung und keine Fachlogik.

## Statusupdate K19.7
- Der installierte Einstieg `uiEditor/uiEditorRegistry.js` verweist jetzt auf den offiziellen BBM-Registry-Einstieg `src/renderer/uiEditor/bbmUiEditorRegistry.js`.
- `uiEditor/` bleibt als installierter Einstieg bestehen, erzeugt aber keine zweite aktive Beispiel-Registry.
- Der Beispiel-Scope ist kein aktiver Registry-Inhalt mehr.
- Keine Editor-Integration, kein Panel, kein Header-Button, kein DOM-Scan, keine Speicherung und keine produktive UI-Aenderung.
- Historische Absicherung: `uiEditor/tests/uiEditorRegistry.test.cjs`. Seit K19.9a ist `scripts/test.cjs` nicht mehr direkt an diese installierte Artefakt-Testdatei gekoppelt.

## Statusupdate K19.0
- BBM liefert fuer das Protokoll-Modul erstmals eine feste, explizit klassifizierte UI-Elementliste als Code-Artefakt.
- Die Liste beschreibt nur UI-Struktur und enthaelt keine Fachdaten, keine Datenbankwerte, keine Personen, keine Termine und keine Statuswerte.
- Keine Editor-Integration, kein DOM-Scan, keine automatische Erkennung, keine Speicherung und keine produktive UI-Aenderung.
- Abgesichert durch `scripts/tests/protokollUiEditorElements.test.cjs`.

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
- Projektphase: M13.4a.1 abgeschlossen
- Projektphase: M13.4a.2 abgeschlossen
- Projektphase: M13.4b abgeschlossen
- Projektphase: M13.4b.1 abgeschlossen
- Implementierungscode: Scanpanel mit Auswahlmodus-Schaltern vorhanden
- UI-Inspector-Modul: vorhanden und im Restarbeiten-DOM testgesichert
- App-Funktionen: keine dauerhafte Speicherung, keine Layout-Dateien, keine IPC-/DB-Pfade
- M13.4a: DEV-Header scannt den aktuellen Screen nur lesend
- M13.4a.1: Scanstatus ist jetzt auf `vollständig`/`unvollständig` und Mehrfachmarker-Basis-ID umgestellt
- M13.4a.2: Listenmarker sind zeilenabhängig und werden nur bei gerenderten Einträgen hart bewertet
- M13.4b: Objektwahl war ein No-Go-Versuch und blieb unübernommen
- M13.4b.1: Auswahlmodus-Schalter sind im sichtbaren Scanpanel verdrahtet, ohne Hover/Klick/Bearbeitung

## Nächster Schritt
Als nächster Schritt folgt:
- **M13.6b UI-Editor: Hover-Rahmen wieder sichtbar machen**

Hinweis:
- M13.2.1 ist nur temporäre Vorschau, ohne Speicherung und ohne dauerhafte Layoutänderung

## Statusupdate M13.5a
- Der UI-Editor-Vertrag ist als neue verbindliche Steuerdatei dokumentiert (`docs/UI_EDITOR_VERTRAG.md`).
- Die Restarbeiten-Rahmenlandkarte ist mit einer klaren Zielstruktur für editorfähige Neuordnung festgelegt.
- Protokoll bleibt ausdrücklich unberührt; der Vertrag gilt zuerst für neue/neu strukturierte Restarbeiten-UI.
- Reines Doku-Paket ohne Code-, Test-, CSS-, IPC-, DB- oder Print/PDF-Änderungen.

## Statusupdate M13.6a
- Das UI-Editor-Panel ist nun als schwebende Oberfläche außerhalb des Header-Layouts platziert.
- Der Header bleibt bei aktivem Editor auf seiner Höhe; der Panel-Inhalt sitzt schwebend über der App.
- Ein Drag-Handle erlaubt das Verschieben des Panels im laufenden Lauf, ohne Speicherung.
- Die Hover- und Auswahllogik blieb unberührt.


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

## M12.1 Abschlussnotiz
- M12.1 ergänzt die echten DOM-Gruppenmarker für Restarbeiten als Voraussetzung für spätere Layoutänderungen.
- Gruppenmarker sitzen auf echten Container-Elementen; Feldmarker bleiben darunter.
- Runtime-Parent-Mapping ersetzt keine fehlenden DOM-Gruppenmarker.
- Geänderte Dateien:
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/ui-landkarten/RESTARBEITEN.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
- Nächster Schritt:
  - **M13 Werte temporär anwenden, aber noch nicht speichern**

## M13.2 Abschlussnotiz
- M13.2 ergänzt die temporäre Vorschau direkt auf dem ausgewählten DOM-Element.
- Originale `style.cssText`-Werte werden vor der ersten Vorschauänderung gemerkt und bei Reset wiederhergestellt.
- Gruppenmarker und Feldmarker bleiben getrennt veränderbar; Parent/Child bekommen keine direkten Inspector-Styles, solange sie nicht selbst ausgewählt sind.
- Beim Deaktivieren des Inspectors werden alle temporären Inline-Styles zurückgesetzt.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.3 temporäre Vorschau weiter absichern oder feinschärfen**

## M13.2.1 Abschlussnotiz
- M13.2.1 trennt die temporären Stellschrauben in Richtungen und Seiten auf, damit Gruppen und Felder gezielt bearbeitet werden können.
- Position X/Y wird temporär über `transform: translate(...)` umgesetzt.
- Gruppen behalten ihren Rahmen, Felder bleiben direkt einzeln veränderbar.
- Reset ausgewählt und Deaktivieren stellen die ursprünglichen `style.cssText`-Werte wieder her.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.3 Rahmen-zuerst-Bedienung mit Feldnavigation**

## M13.3 Abschlussnotiz
- M13.3 ergänzt die Panel-Kontextanzeige für Elternbereich und Kindbereiche.
- Gruppen zeigen ihre Kinder direkt als auswählbare Ziele; Felder können zum Elternbereich und zu Vorherigem/Nächstem springen.
- Die temporäre Vorschau aus M13.2.1 bleibt unverändert und weiterhin nicht-persistent.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.4 weitere UI-Inspector-Feinschärfung**
## Statusupdate M13.4a
- M13.4a ist erledigt.
- DEV-Header scannt den aktuellen Screen nur lesend.
- Keine Auswahl, keine Bearbeitung, keine Speicherung.
- Nächster Schritt: M13.4b UI-Editor-Scan weiter verfeinern, ohne Bearbeitung.
