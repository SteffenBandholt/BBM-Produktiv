# UI-Inspektor Umsetzungsplan

## 1. Zweck des Umsetzungsplans
- Dieser Plan übersetzt Projektauftrag, Arbeitsvertrag und Architektur in konkrete Baupakete.
- Er ist noch kein Code.
- Er verhindert, dass der UI-Inspektor wieder als zu großes Paket begonnen wird.

M21-Klarstellung: Dieser Plan ist historischer UI-Inspektor-Kontext. Neue Arbeiten folgen dem generischen UI-Editor-kit: Die Ziel-App liefert die ElementRegistry, der Editor liest ausschliesslich diese Registry, und es gibt keine automatische UI-Erkennung, kein UI-Scanning, keinen DOM-Scan und keine automatische Registry-Befuellung.

## 2. Grundregel der Umsetzung
- Ein Meilenstein = ein klarer Zweck.
- Ein Paket = ein Branch = ein Commit = ein PR/Merge.
- Keine sichtbare UI-Funktion, solange nur ein Modulgerüst beauftragt ist.
- Keine BBM-Fachlogik im Core.
- Kein Tabellen-Kalibrator-Umbau.
- Kein Restarbeiten-Umbau als Abkürzung.
- Aufgabenheft wird nach jedem Paket aktualisiert.
- `Restarbeiten` ist in BBM erreichbar, aber fachlich/funktional unfertig und nur Pilot-Scope.
- `Protokoll` ist noch nicht fertig bereinigt und fuer UI-Editor-Themen defensiv/read-only.

## 3. Meilensteinplan ab M6

### M6 – Modulgerüst anlegen
**Ziel:**
- leeres, exportierbares UI-Inspector-Modulgerüst anlegen
- keine sichtbare Funktion
- keine App-Integration
- keine Restarbeiten-Anbindung
- nur Struktur, Exporte und Grundtests

**Voraussichtliche Zielstruktur:**
```text
src/shared/uiInspector/
- uiInspectorCore.js
- uiInspectorRegistry.js
- uiInspectorStore.js
- uiInspectorTypes.js
- index.js

src/renderer/uiInspector/
- UiInspectorRuntime.js
- UiInspectorOverlay.js
- UiInspectorPanel.js
- index.js

scripts/tests/
- uiInspectorCore.test.cjs
- uiInspectorRegistry.test.cjs
```

**Noch nicht:**
- keine echte UI öffnen
- kein Overlay anzeigen
- kein Speichern
- kein BBM-Adapter
- keine Layout-Landkarte für Restarbeiten

**Geeignet:**
- Codex Cloud

**Prüfung:**
- Importierbarkeit
- Tests für leere Registry/Core-Grundverhalten
- `npm test`, falls passend

### M7 – Layout-Landkarten-Format definieren
**Ziel:**
- formales Format für Layout-Landkarten definieren
- noch keine echte App markieren
- Beispiel-Landkarte nur als Testdaten
- Begriffe: Bereich, Container, Feld, Liste, Eingabebereich, Einstellung

**Noch nicht:**
- keine Restarbeiten-UI ändern
- kein Overlay
- kein Panel

**Geeignet:**
- Codex Cloud

**Prüfung:**
- Tests für Validierung/Normalisierung einer Landkarte
- keine App-Dateien betroffen

### M8 – Restarbeiten als erste Pilot-Landkarte dokumentieren
**Ziel:**
- Restarbeiten-Landkarte als Dokument und/oder reine Datenstruktur vorbereiten
- vorhandene UI fachlich beschreiben:
  - Kopfbereich
  - Filterleiste
  - Klassenfilter
  - Verortung
  - Meta-Filter
  - Liste
  - Editbox
- noch keine DOM-Markierung in der App
- noch keine UI-Änderung

**Geeignet:**
- Codex Cloud

**Prüfung:**
- nur Dokumentation/Testdaten
- keine Restarbeiten-Screen-Änderung

### M9 – Restarbeiten-DOM-Markierungen minimal einführen
**Ziel:**
- bestehende Restarbeiten-UI bekommt minimale, stabile Markierungen, damit der Inspektor Bereiche später finden kann
- keine sichtbare Layoutänderung
- keine Stiländerung
- keine Fachlogikänderung

**Noch nicht:**
- kein Overlay
- kein Panel
- keine Werte ändern

**Geeignet:**
- eher lokal oder Cloud mit sehr enger Prüfung
- lokale Sichtprüfung erforderlich

**Prüfung:**
- Diff darf nur Markierungen/Attribute betreffen
- Restarbeiten-Tests laufen
- Sichtprüfung: Oberfläche sieht unverändert aus

### M10 – Overlay nur anzeigen
**Ziel:**
- Layoutmodus kann Rahmen über erkannte Bereiche legen
- nur Anzeige
- keine Werte ändern
- keine Speicherung

**Geeignet:**
- lokal, weil sichtbare UI geprüft werden muss

**Prüfung durch Nutzer:**
- Sind die richtigen Bereiche gerahmt?
- Sind die Namen verständlich?
- Fehlt ein Bereich?
- Ist ein Bereich falsch gruppiert?

### M11 – Bereich anklicken und Auswahl anzeigen
**Ziel:**
- Klick auf gerahmten Bereich wählt diesen Bereich aus
- Panel oder einfache Anzeige zeigt:
  - gewählter Bereich
  - Hierarchie
  - Typ
- noch keine Werte ändern

**Geeignet:**
- lokal

**Prüfung durch Nutzer:**
- Klickt man wirklich den Bereich an, den man meint?
- Wird z. B. Meta-Container von einzelnen Feldern unterscheidbar?
- Ist die Hierarchie verständlich?

### M12 – Panel zeigt erlaubte Stellschrauben
**Ziel:**
- Panel zeigt nur erlaubte Einstellungen aus der Landkarte
- noch keine dauerhafte Speicherung
- Begriffe laientauglich:
  - Breite
  - Höhe
  - Abstand
  - nach links/rechts
  - nach oben/unten
  - Feldbreite

**Noch nicht:**
- keine echten Layoutänderungen speichern
- keine CSS-Fachsprache in der Hauptbedienung

**Geeignet:**
- lokal

**Prüfung durch Nutzer:**
- Versteht man die Stellschrauben?
- Sind es die richtigen für den gewählten Bereich?
- Werden keine technischen Begriffe angezeigt?

### M13 – Werte temporär anwenden
**Ziel:**
- Änderungen können als Vorschau auf die echte UI angewendet werden
- Abbrechen setzt zurück
- Speichern noch nicht dauerhaft oder nur bewusst begrenzt

**Geeignet:**
- lokal

**Prüfung:**
- Nur der gewählte Bereich verändert sich
- keine Liste/Editbox als Seiteneffekt, wenn Meta-Container geändert wird
- Rücksetzen funktioniert

### M14 – Speichern und Standard wiederherstellen
**Ziel:**
- Layoutwerte dauerhaft speichern
- Standard wiederherstellen
- Werte beim Öffnen anwenden
- Store-Anbindung finalisieren

**Geeignet:**
- lokal mit Tests

**Prüfung:**
- Speichern funktioniert
- Neustart/Reload übernimmt Werte
- Standard zurück funktioniert
- Aufgabenheft aktualisiert

### M15 – Zweiter Pilot außerhalb Restarbeiten
**Ziel:**
- Nachweis, dass der Inspektor nicht Restarbeiten-spezifisch ist
- mögliche Kandidaten:
  - Protokoll TOP-Liste
  - Projektfirmenliste
  - spätere Rechnungs-/Angebots-App

**Geeignet:**
- abhängig vom Pilot

**Prüfung:**
- Core bleibt unverändert allgemein
- neue App-Anbindung erfolgt über Adapter/Landkarte

## 4. MVP-Definition

**MVP bedeutet:**
- Layoutmodus aktivierbar
- echte UI-Bereiche werden gerahmt
- Bereich anklickbar
- Auswahl wird verständlich angezeigt
- einfache Stellschrauben werden angezeigt
- noch nicht zwingend dauerhaft speichern

**Nicht im MVP:**
- freies Drag-and-drop
- Export als npm-Paket
- mehrere Apps
- vollständige visuelle Regressionstests
- vollständige Wertpersistenz für alle Bereiche

## 5. Rollen je Phase

**Codex Cloud:**
- Dokumentation
- Modulgerüst
- reine Core-/Registry-Tests
- Landkartenformat
- PRs

**Lokal:**
- sichtbares Overlay
- App starten
- Bedienbarkeit prüfen
- visuelle Seiteneffekte erkennen
- Nutzerabnahme

**Nutzer:**
- prüft Sprache
- prüft sichtbare Bereiche
- prüft Bedienbarkeit
- muss keine Technik verstehen

**ChatGPT:**
- orchestriert
- begrenzt Aufträge
- prüft Diffs
- gibt nächsten Schritt frei

## 6. Harte Stopps im Umsetzungsplan

Kein Paket darf:
- Tabellen-Kalibrator als Bedienoberfläche verwenden
- BBM-Fachlogik in den Core schreiben
- Restarbeiten optisch verändern, wenn nur Markierung beauftragt ist
- neue UI-Frickelei als Abkürzung machen
- Aufgabenheft vergessen
- mehrere Meilensteine in einem PR vermischen

## 7. Prüfmodell

Je Paket dokumentieren:
- erwartete Dateien
- verbotene Dateien
- Tests/Prüfungen
- Sichtprüfung ja/nein
- Codex Cloud oder lokal
- Aufgabenheft-Update

## 8. Erster Code-Auftrag nach M5

Nach M5 folgt:
**M6 – Modulgerüst anlegen**

Noch kein Overlay.
Noch keine Restarbeiten-Integration.
Noch keine sichtbare UI.
Noch kein Speichern.
