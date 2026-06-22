# UI-Inspektor Arbeitsvertrag

## 1. Zweck des Arbeitsvertrags
- Der Arbeitsvertrag regelt die Zusammenarbeit zwischen Nutzer, ChatGPT und Codex.
- Er verhindert, dass bei Chatwechseln oder Codex-Läufen Ziele, Regeln und Fortschritt verloren gehen.

## 2. Rollen

### Nutzer
- gibt fachliche Ziele vor
- prüft sichtbare Bedienbarkeit
- muss keine UI-Technik, CSS, DOM, Grid, Flexbox oder Programmierung lernen
- bewertet, ob Begriffe und Bedienung laientauglich sind

### ChatGPT
- orchestriert das Projekt
- übersetzt fachliche Ziele in kontrollierte Aufgaben
- prüft Codex-Ergebnisse
- entscheidet mit dem Nutzer über nächsten Meilenstein
- achtet auf Aufgabenheft, Entscheidungslog und Projektregeln

### Codex Cloud
- geeignet für Dokumentation, Struktur, Modulgerüst, Tests, PRs
- darf keine sichtbare UI-Bedienbarkeit beurteilen
- darf keine vagen UI-Wünsche eigenständig interpretieren

### Codex lokal
- geeignet für lokale App-Prüfung, sichtbare UI, Overlay, Bedienbarkeit
- wird genutzt, wenn die App gestartet und optisch geprüft werden muss

## 3. Grundregeln
- Ein Paket = ein Branch = ein Commit = ein PR/Merge
- kleine kontrollierte Schritte
- keine Nebenänderungen
- kein Tabellen-Kalibrator-Umbau als UI-Inspektor
- kein BBM-Sonderding
- Core des UI-Inspektors bleibt exportierbar und frei von BBM-Fachlogik
- bestehende App-Bereiche werden nicht verändert, wenn der Auftrag nur Dokumentation betrifft
- M21: Fuer neue Arbeiten gilt das generische UI-Editor-kit; BBM-Produktiv ist nur Beispiel-/Pilot-Zielapp.
- M21: Die Ziel-App liefert die ElementRegistry; der Editor liest ausschliesslich diese Registry.
- M21: Keine Selbstuntersuchung der Ziel-App-Oberflaeche, keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.

## 4. Definition of Done
Ein UI-Inspektor-Auftrag ist nur fertig, wenn:
- Ziel erreicht
- betroffene Dateien plausibel
- keine verbotenen Dateien geändert
- Aufgabenheft aktualisiert
- Entscheidungslog aktualisiert, falls Entscheidung getroffen wurde
- Tests/Prüfungen dokumentiert
- nächster Schritt eingetragen
- Branch/PR sauber

## 5. Aufgabenheft-Regel
- Das Aufgabenheft ist der rote Faden.
- Nach jedem erfolgreichen Auftrag muss dort ein Haken oder Status eingetragen werden.
- Neue Chats beginnen mit dem Aufgabenheft.
- Ohne Aufgabenheft-Update gilt ein Auftrag nicht als abgeschlossen.

## 6. Entscheidungslog-Regel
- Architektur- oder Richtungsentscheidungen werden im Entscheidungslog ergänzt.
- Entscheidungen müssen kurz begründen, warum sie getroffen wurden.
- Verworfene Ansätze werden ausdrücklich dokumentiert.

## 7. Cloud-vs-Lokal-Regel

### Codex Cloud
- Dokumente
- Regeln
- Modulgerüst
- Tests
- PRs

### Lokal
- sichtbare UI prüfen
- Overlay prüfen
- Bedienbarkeit beurteilen
- Electron-App starten

## 8. Laienregel
- Keine CSS-Fachsprache in der späteren Bedienoberfläche.
- Keine Begriffe wie gridTrack, minmax, fr, DOM, data-Attribute in der Hauptbedienung.
- Der Nutzer arbeitet später mit Begriffen wie:
  - Bereich
  - Container
  - Feld
  - Breite
  - Höhe
  - Abstand
  - nach links / rechts
  - nach oben / unten
  - speichern
  - Standard wiederherstellen

## 9. Verbotene Abkürzungen
- keine direkte UI-Frickelei als Ersatz für den Inspektor
- keine vagen Codex-Aufträge wie „mach schöner“
- keine stillen Nebenänderungen
- keine App-Fachlogik ändern
- keine Vermischung von Profi-UI-Ausbildung und Inspektor-Entwicklung
- keine automatische Element- oder Registry-Erzeugung aus der bestehenden UI

## 10. Ablauf je Auftrag

### Vor Auftrag
- Aufgabenheft lesen
- Projektauftrag lesen
- Architektur lesen
- Entscheidungslog lesen
- Ziel und Nicht-Ziel festlegen

### Nach Auftrag
- Diff prüfen
- Tests/Prüfungen dokumentieren
- Aufgabenheft aktualisieren
- Entscheidungslog bei Bedarf aktualisieren
- nächsten Schritt benennen
