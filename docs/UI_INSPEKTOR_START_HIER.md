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
- UI-Inspector-Modulgerüst und Layout-Landkarten-Format existieren
- Overlay kann angezeigt werden
- Restarbeiten-DOM-Markierungen vorhanden
- Noch keine sichtbare App-Funktion

## 5. Nächster geplanter Schritt
- Nächster Schritt: M11 Bereich anklicken und Auswahl anzeigen
- M10 zeigt nur Overlay-Rahmen über Marker
- Noch kein Panel
- Noch keine Klickauswahl
- Noch keine Layoutänderung
- Noch keine Speicherung

## 6. Harte Stopps
Nicht fortführen:
- Tabellen-Kalibrator als Bedienoberfläche des UI-Inspektors
- direkte UI-Frickelei als Ersatz für den Inspektor
- BBM-Fachlogik im Inspector-Core
- vage Aufgaben wie „mach schöner“
- Codearbeiten ohne Aufgabenheft-Update

## 7. Definition für neue Chats
Ein neuer Chat soll mit dieser Zusammenfassung starten können:

„Wir bauen ein neues exportierbares UI-Inspector-Modul. Projektauftrag, Architektur, Arbeitsvertrag, Aufgabenheft und Entscheidungslog liegen im Repo. Das Modulgerüst und die erste Restarbeiten-Pilot-Landkarte sind dokumentiert. Nächster Schritt laut Aufgabenheft ist M10 (Overlay nur anzeigen; weiterhin ohne Panel und ohne sichtbare Fachfunktion).“


## Statusupdate M13.1
- M13.1 ist erledigt.
- Hierarchische Bereichsauswahl im Panel eingeführt (Parent/Child + Instanzen #1/#2).
- Auswahl bleibt read-only: keine Layoutänderung, keine Speicherung.
- PR #155 bleibt blockiert und wurde nicht übernommen.
- Nächster Meilenstein: M13.2 – Temporäre Vorschau.

## Statusupdate M12
- M12 ist erledigt.
- Auswahl läuft weiterhin über Trefferliste am Klickpunkt.
- Panel zeigt den ausgewählten Bereich und die erlaubten Stellschrauben.
- Noch keine Anwendung, noch keine Speicherung, noch keine Layoutänderung.
- Nächster Meilenstein: M13 (Werte temporär anwenden, noch nicht speichern).
