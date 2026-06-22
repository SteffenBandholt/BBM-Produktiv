# UI-Inspektor – Start hier

## 1. Zweck dieser Datei
- Diese Datei ist der erste Einstieg in das UI-Inspektor-Projekt.
- Neue Chats und Codex-Läufe lesen diese Datei zuerst.

## 2. Lesereihenfolge
Pflichtreihenfolge:
1. `docs/UI_INSPEKTOR_START_HIER.md`
2. `docs/UI_EDITOR_VERTRAG.md`
3. `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
4. `docs/UI_INSPEKTOR_PROJEKTAUFTRAG.md`
5. `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md`
6. `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
7. `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`

## 3. Kurzfassung Projektziel
- Neues exportierbares UI-Inspector-Modul.
- Kein Tabellen-Kalibrator-Umbau.
- Kein BBM-Sonderding.
- Kein freier Drag-and-drop-Baukasten.
- Zielgruppe: fachlicher Anwender ohne Programmierkenntnisse.
- Bedienziel: echte UI-Bereiche sichtbar machen, anklicken, verständliche Stellschrauben anzeigen, später speichern/zurücksetzen.

### M21-Klarstellung
- Der Begriff UI-Inspector/UI-Inspektor beschreibt hier historischen Projektkontext; verbindliche Zielrichtung ist das generische UI-Editor-kit.
- BBM-Produktiv ist nur Beispiel-/Pilot-Zielapp, nicht fachliche Grundlage des Editors.
- `Restarbeiten` ist erreichbar, aber fachlich/funktional unfertig und nur Pilot-Scope.
- `Protokoll` ist noch nicht fertig bereinigt und fuer UI-Editor-Themen defensiv/read-only einzuordnen.
- Die Ziel-App liefert die ElementRegistry; der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Historische Begriffe wie UI-Inspector, DOM-Scan, UI-Scanning, automatische Erkennung oder automatische Registry-Befuellung sind keine Zielrichtung und fuer neue Arbeiten verboten.

## 4. Aktueller Projektstand
- M1.1 Projektfundament erledigt
- M2 Arbeitsvertrag erledigt
- M3 Projektgedächtnis erledigt
- M4 Architekturvertiefung erledigt
- M5 Umsetzungsplan ohne Code erledigt
- M6 Modulgerüst erledigt
- M7 Layout-Landkarten-Format erledigt
- M8 Restarbeiten-Pilot-Landkarte dokumentiert
- M9 Restarbeiten-DOM-Markierungen minimal eingeführt
- M10 Overlay nur anzeigen abgeschlossen
- M12.1 Restarbeiten-Gruppenmarker als echte DOM-Container ergänzt
- M13.2 Temporäre Vorschau auf ausgewählten Elementen abgeschlossen
- M13.2.1 Gerichtete Stellschrauben und Gruppenposition X/Y ergänzt
- M13.3 Rahmen-zuerst-Bedienung mit Feldnavigation ergänzt
- UI-Inspector-Modulgerüst und Layout-Landkarten-Format existieren
- Overlay kann angezeigt werden
- Restarbeiten-DOM-Markierungen vorhanden
- Gruppenmarker liegen auf echten DOM-Containern, Feldmarker darunter
- Temporäre Vorschau wirkt nur auf dem ausgewählten Element und wird beim Deaktivieren zurückgesetzt
- Position X/Y arbeitet temporär über `transform: translate(...)`
- Panel zeigt Elternbereich, Kindbereiche und Vorheriges/Nächstes Feld
- Noch keine sichtbare App-Funktion
- M13.4a DEV-Button und Scanstatus ohne Bearbeitung abgeschlossen
- M13.4a.1 Scanstatus korrigiert und Mehrfachmarker per Basis-ID zusammengefasst
- M13.4a.2 Scanroot und Listenmarker korrekt bewertet
- M13.4b Objektwahl ohne Bearbeitung abgeschlossen
- M13.4b.1 Auswahlmodus-Schalter im Scanpanel verdrahtet

## 5. Nächster geplanter Schritt
- Nächster Schritt: M13.6a UI-Editor-Panel aus Header lösen und verschiebbar halten
- M13.2 ist nur Vorschau, ohne Speicherung
- M13.2.1 trennt Richtungen, Seiten und Gruppen-/Feldsteuerung
- M13.3 führt Eltern-/Kindnavigation ein
- Noch keine Layoutänderung

## 5.1 Verbindliche Reihenfolge für neue editorfähige UIs
1. UI-Editor-Vertrag
2. UI-Landkarte
3. Tests für Pflichtstruktur
4. UI-Code
5. Rahmenmodus
6. Rahmenauswahl
7. Rahmenbearbeitung
8. Feldmodus
9. Einzelelementmodus
10. Speicherung

## 6. Harte Stopps
Nicht fortführen:
- Tabellen-Kalibrator als Bedienoberfläche des UI-Inspektors
- direkte UI-Frickelei als Ersatz für den Inspektor
- BBM-Fachlogik im Inspector-Core
- DOM-Scan, UI-Scanning, automatische UI-Erkennung oder automatische Registry-Befuellung
- vage Aufgaben wie „mach schöner“
- Codearbeiten ohne Aufgabenheft-Update

## 7. Definition für neue Chats
Ein neuer Chat soll mit dieser Zusammenfassung starten können:

„Wir bauen ein neues exportierbares UI-Inspector-Modul. Projektauftrag, Architektur, Arbeitsvertrag, Aufgabenheft und Entscheidungslog liegen im Repo. Das Modulgerüst, die Restarbeiten-Landkarte, der Scanstatus und die Auswahlmodus-Schalter sind dokumentiert. Nächster Schritt laut Aufgabenheft ist M13.6a (Panel aus dem Header lösen und als schwebende Oberfläche halten; weiterhin ohne Hover- oder Auswahlreparatur).“


## Statusupdate M13.3
- M13.3 ist erledigt.
- Temporäre Vorschau arbeitet nur auf dem ausgewählten Element.
- Originale Inline-Styles werden gemerkt und wiederhergestellt.
- Beim Deaktivieren werden alle temporären Änderungen zurückgesetzt.
- Noch keine Speicherung, kein localStorage, kein IPC, keine DB.
- Nächster Meilenstein: M13.4 (weitere UI-Inspector-Feinschärfung).
## Statusupdate M13.4a
- M13.4b.1 ist erledigt.
- DEV-Header zeigt einen lesenden UI-Editor-Scan mit Statusanzeige.
- Das Scanpanel zeigt die Auswahlmodus-Schalter Rahmen/Feld/Einzelelement.
- Keine Hover-/Klickauswahl, keine Bearbeitung, keine Speicherung.
- Nächster Schritt: M13.6a UI-Editor-Panel aus Header lösen und verschiebbar halten.

## Statusupdate M13.5a
- Der UI-Editor-Vertrag ist als verbindliche Planungsgrundlage dokumentiert.
- Die Restarbeiten-Rahmenlandkarte ist als Zielstruktur (inkl. Altstand-Abgrenzung) festgelegt.
- Protokoll bleibt ausdrücklich unberührt.
