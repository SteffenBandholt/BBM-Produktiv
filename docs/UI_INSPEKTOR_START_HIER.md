# UI-Inspektor – Start hier

## 1. Zweck dieser Datei
- Diese Datei ist der erste Einstieg in das UI-Inspektor-Projekt.
- Neue Chats und Codex-Läufe lesen diese Datei zuerst.

## 2. Lesereihenfolge
Pflichtreihenfolge:
1. `docs/UI_INSPEKTOR_START_HIER.md`
2. `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
3. `docs/UI_INSPEKTOR_PROJEKTAUFTRAG.md`
4. `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md`
5. `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
6. `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`

## 3. Kurzfassung Projektziel
- Neues exportierbares UI-Inspector-Modul.
- Kein Tabellen-Kalibrator-Umbau.
- Kein BBM-Sonderding.
- Kein freier Drag-and-drop-Baukasten.
- Zielgruppe: fachlicher Anwender ohne Programmierkenntnisse.
- Bedienziel: echte UI-Bereiche sichtbar machen, anklicken, verständliche Stellschrauben anzeigen, später speichern/zurücksetzen.

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
- UI-Inspector-Modulgerüst und Layout-Landkarten-Format existieren
- Overlay kann angezeigt werden
- Restarbeiten-DOM-Markierungen vorhanden
- Gruppenmarker liegen auf echten DOM-Containern, Feldmarker darunter
- Temporäre Vorschau wirkt nur auf dem ausgewählten Element und wird beim Deaktivieren zurückgesetzt
- Position X/Y arbeitet temporär über `transform: translate(...)`
- Noch keine sichtbare App-Funktion

## 5. Nächster geplanter Schritt
- Nächster Schritt: M13.3 temporäre Vorschau weiter absichern oder feinschärfen
- M13.2 ist nur Vorschau, ohne Speicherung
- M13.2.1 trennt Richtungen, Seiten und Gruppen-/Feldsteuerung
- Noch keine Layoutänderung

## 6. Harte Stopps
Nicht fortführen:
- Tabellen-Kalibrator als Bedienoberfläche des UI-Inspektors
- direkte UI-Frickelei als Ersatz für den Inspektor
- BBM-Fachlogik im Inspector-Core
- vage Aufgaben wie „mach schöner“
- Codearbeiten ohne Aufgabenheft-Update

## 7. Definition für neue Chats
Ein neuer Chat soll mit dieser Zusammenfassung starten können:

„Wir bauen ein neues exportierbares UI-Inspector-Modul. Projektauftrag, Architektur, Arbeitsvertrag, Aufgabenheft und Entscheidungslog liegen im Repo. Das Modulgerüst, die Restarbeiten-Landkarte und die temporäre Vorschau sind dokumentiert. Nächster Schritt laut Aufgabenheft ist M13.3 (temporäre Vorschau weiter absichern oder feinschärfen; weiterhin ohne Speicherung).“


## Statusupdate M13.2.1
- M13.2.1 ist erledigt.
- Temporäre Vorschau arbeitet nur auf dem ausgewählten Element.
- Originale Inline-Styles werden gemerkt und wiederhergestellt.
- Beim Deaktivieren werden alle temporären Änderungen zurückgesetzt.
- Noch keine Speicherung, kein localStorage, kein IPC, keine DB.
- Nächster Meilenstein: M13.3 (temporäre Vorschau weiter absichern oder feinschärfen).
