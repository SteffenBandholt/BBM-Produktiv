# PLAN.md — BBM-Produktiv

## Gesamtziel
Die Modularisierung in BBM-Produktiv soll in kleinen, sicheren und nachvollziehbaren Schritten weitergeführt werden.

Bestehendes Verhalten soll stabil bleiben, außer wenn ein Meilenstein ausdrücklich etwas anderes verlangt.

## Allgemeine Regeln
- immer nur **einen** Meilenstein aktiv bearbeiten
- keine neuen Features
- keine breiten Nebenumbauten
- keine Änderungen außerhalb des aktuellen Meilensteins
- bei Problemen erst stoppen und berichten
- erst nach erfolgreicher Prüfung mit dem nächsten Meilenstein weitermachen

## Priorität
Der aktuelle Fokus liegt auf:
1. Modul **Protokoll**
2. Konsolidierung verbliebener Altpfade

---

## Meilenstein 1
### Titel
CSS-Altpfad im Modul Protokoll abbauen

### Ziel
Ein verbliebener Style-Altpfad soll in eine modul-lokale Struktur überführt werden, ohne das Verhalten zu ändern.

### Betroffene Dateien
- `src/renderer/modules/protokoll/styles.js`
- `src/renderer/modules/protokoll/styles/tops.css`
- bestehende Altdatei nur als Quelle:
  - `src/renderer/tops/styles/tops.css`

### Nicht anfassen
- Router
- Navigation
- Datenbank
- weitere Dateien außerhalb dieses Mini-Pakets

### Fertig wenn
- die modul-lokale CSS-Datei existiert
- `styles.js` auf die modul-lokale CSS-Datei zeigt
- die alte CSS-Datei unverändert bestehen bleibt
- keine weiteren Dateien geändert wurden

### Prüfung
- geänderte Dateien auflisten
- Diff zeigen
- bestätigen, dass keine weiteren Dateien angefasst wurden

### Status
- erledigt, wenn alle Kriterien erfüllt sind
- sonst stoppen und Hindernis berichten

---

## Meilenstein 2
### Titel
Weitere kleine Altpfade im Modul Protokoll abbauen

### Ziel
Verbliebene klar abgegrenzte Altpfade unter `src/renderer/tops/` schrittweise reduzieren, wenn sie eindeutig dem Modul Protokoll zugeordnet werden können.

### Betroffene Bereiche
- `src/renderer/modules/protokoll/`
- klar benannte Einzeldateien unter `src/renderer/tops/`

### Nicht anfassen
- fachliche Logik
- Datenfluss
- globale App-Struktur

### Fertig wenn
- genau ein weiterer kleiner Altpfad in das Modul überführt wurde
- Importpfade stimmen
- kein Nebenumbau entstanden ist

### Prüfung
- nur passende kleine Prüfungen
- geänderte Dateien auflisten
- Diff zeigen
- Seiteneffekte offen benennen

### Status
- nur einen kleinen Schritt umsetzen
- nicht mehrere Altpfade auf einmal ziehen

---

## Meilenstein 3
### Titel
Speichern-/Löschen-Vertrag im Tops-Bereich stabilisieren

### Ziel
Der Ablauf beim Speichern und Löschen soll technisch und testseitig sauber zusammenpassen.

### Betroffene Bereiche
- Tops-bezogene Commands
- direkt zugehörige Tests

### Nicht anfassen
- UI-Umbauten
- Router
- nicht betroffene Tests

### Fertig wenn
- der betroffene Ablauf klar und konsistent ist
- die zugehörigen Tests zum tatsächlichen Verhalten passen
- keine angrenzenden Bereiche mitgezogen wurden

### Prüfung
- relevante betroffene Tests ausführen
- Ergebnis offen berichten
- Diff zeigen

### Status
- bei größerem Umbau stoppen und berichten

---

## Stop-Regel
Codex muss stoppen und berichten, wenn:
- ein Meilenstein deutlich größer wird als geplant
- mehr Dateien betroffen wären als erwartet
- eine Architekturentscheidung nötig wird
- eine Prüfung fehlschlägt und nicht lokal klein lösbar ist
- neue Abhängigkeiten oder Nebenumbauten nötig würden
- unklar ist, welcher Altpfad sicher verschoben werden darf

## Ausgabeformat für jeden Meilenstein
Nach jedem bearbeiteten Meilenstein:

### Ergebnis
- Was wurde gemacht?

### Geänderte Dateien
- Liste aller geänderten Dateien

### Prüfung
- Welche Prüfung wurde ausgeführt?
- Was war das Ergebnis?

### Risiken / offen
- Was ist noch offen?
- Welche Risiken bleiben?

### Status
- erledigt
- oder gestoppt mit Grund

## Abschlussregel
Nicht automatisch den gesamten Plan in einem Rutsch umbauen, wenn der Nutzer oder Auftrag das nicht ausdrücklich verlangt.

Standardverhalten:
- genau den nächsten offenen Meilenstein bearbeiten
- danach berichten
- erst dann mit dem nächsten weitermachen

