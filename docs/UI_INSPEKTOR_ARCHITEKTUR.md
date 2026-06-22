# UI-Inspektor Architektur

## 1. Architekturziel
Der UI-Inspektor wird als neues exportierbares Modul aufgebaut.

M21-Klarstellung: Diese Datei enthaelt historischen UI-Inspektor-Kontext. Verbindliche Zielrichtung fuer neue Arbeiten ist das generische UI-Editor-kit. BBM-Produktiv ist nur Beispiel-/Pilot-Zielapp; der Editor bleibt frei von BBM-, Restarbeiten- und Protokoll-Fachlogik.

Zielbild:
- nicht BBM-spezifisch
- kein Umbau des Tabellen-Kalibrators zur Hauptlösung
- keine freie Drag-and-drop-Lösung
- echte UI-Bereiche sichtbar machen, anklickbar machen und später kontrolliert einstellbar machen

Wichtig:
- In diesem Meilenstein wird nur Architektur dokumentiert.
- Es wird kein Modulgerüst angelegt.
- Es wird keine App-Funktion geändert.

## 2. Schichtenmodell

### 2.1 Core
**Aufgaben:**
- Inspektor-Zustand verwalten
- registrierte Bereiche kennen
- aktive Auswahl verwalten
- Regeln für Auswahl-/Bearbeitungsfluss bereitstellen

**Muss einhalten:**
- keine direkte DOM-Manipulation
- keine BBM-Fachlogik
- keine app-spezifischen Begriffe

**Darf nicht:**
- Restarbeiten, Protokoll, Rechnung, TOP, Bauvorhaben kennen
- direkt CSS einer konkreten App ändern
- Fachlogik ausführen

### 2.2 Registry
**Aufgaben:**
- Layout-Landkarten aufnehmen
- Bereiche, Container, Felder und erlaubte Einstellungen kennen
- Standardwerte bereitstellen
- Typen von Einstellwerten verwalten (z. B. Breite, Höhe, Abstand, Verschiebung, Spaltenbreite)

**Rolle im System:**
- fachliche Erlaubnisliste, welche Stellschrauben pro Bereich sichtbar und änderbar sind
- keine direkte Darstellung und keine Persistenzlogik

**M21-Regel:**
- Die Ziel-App liefert die ElementRegistry.
- Der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Der Editor darf die Ziel-App-Oberflaeche nicht selbst untersuchen.
- Keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.

### 2.3 Overlay
**Aufgaben:**
- sichtbare Bereiche auf der echten UI markieren
- Hover, Auswahl und aktiven Bereich anzeigen
- Rückmeldung geben, welcher Bereich gerade getroffen wurde

**Muss einhalten:**
- keine dauerhaften Layoutänderungen speichern
- keine Fachlogik ausführen
- nur anzeigen und auswählen

### 2.4 Panel
**Aufgaben:**
- laienverständliche Bedienung anzeigen
- nur freigegebene Stellschrauben zeigen
- Werte für den ausgewählten Bereich ändern lassen

**Sprachregeln:**
- keine CSS-Fachsprache in der Hauptbedienung
- Begriffe wie Bereich, Container, Feld, Breite, Höhe, Abstand, links/rechts, oben/unten verwenden

### 2.5 Store
**Aufgaben:**
- Werte laden
- Werte speichern
- Standards wiederherstellen
- Speicher austauschbar halten (z. B. lokaler Speicher, später andere Backends)

**Muss einhalten:**
- kein app-spezifisches Fachwissen
- keine Kenntnis über konkrete BBM-Screens

### 2.6 Adapter
**Aufgaben:**
- konkrete App mit dem Inspektor verbinden
- DOM-Elemente und Layout-Landkarte zusammenbringen
- app-spezifische Umsetzung kapseln

**Beispiele:**
- BBM-Adapter
- Adapter einer späteren Rechnungs-App

### 2.7 Layout-Landkarte
**Aufgaben:**
- sichtbare Bereiche einer konkreten App beschreiben
- fachliche Namen liefern
- Hierarchie liefern
- erlaubte Stellschrauben pro Bereich liefern
- sowohl Bestand als auch neue UI unterstützen

**Nutzen:**
- Brücke zwischen generischem Inspektor und konkreter Oberfläche
- Grundlage für nachvollziehbare, kontrollierte Bedienung

## 3. Trennung allgemein / app-spezifisch

| Allgemein im Core | App-spezifisch im Adapter / in der Landkarte |
| --- | --- |
| Bereich | Restarbeiten |
| Container | Protokoll |
| Feld | Rechnung |
| Liste | TOP |
| Eingabebereich | Bauvorhaben |
| Einstellung | Positionsliste |
| Wert | Summenblock |
| Auswahl | konkrete Feldnamen je Screen |
| Overlayzustand | app-spezifische Hierarchien |

Regel:
- Allgemeine Begriffe und Abläufe bleiben im Core.
- Fachliche Domänenbegriffe bleiben außerhalb des Cores.

## 4. Bedienmodell für den Laien
Geplanter Bedienablauf:
1. Layoutmodus einschalten
2. sichtbare Bereiche werden gerahmt
3. Bereich anklicken
4. Panel zeigt verständliche Optionen
5. Werte ändern
6. übernehmen / speichern / Standard wiederherstellen

Geeignete Begriffe in der Bedienung:
- Meta-Container
- Liste
- Editbox
- Feldbreite
- Abstand links/rechts
- nach oben/unten

Verboten in der Hauptbedienung:
- gridTrack
- minmax
- fr
- DOM
- data-Attribute
- CSS-Variablenpfade
- surfaceKey

Hinweis:
- Technische Begriffe können intern existieren, werden aber nicht als primäre Nutzerbegriffe präsentiert.

## 5. Einstell-Ebenen

### 5.1 Bereichsebene
Beispiele:
- Kopfbereich
- Hauptbereich
- Eingabebereich

Typische Einstellungen:
- Gesamtbreite/-höhe
- Außenabstände
- Position im übergeordneten Layout

### 5.2 Containerebene
Beispiele:
- Filterleiste
- Meta-Container
- Summenblock

Typische Einstellungen:
- Innenabstände
- Abstände zwischen Elementen
- Breite/Höhe des Containers

### 5.3 Feldebene
Beispiele:
- Status
- Fertig bis
- Menge
- Einzelpreis

Typische Einstellungen:
- Feldbreite
- Feldhöhe
- horizontale/vertikale Verschiebung im erlaubten Rahmen

### 5.4 Listen-/Tabellenebene
Beispiele:
- normale Spalten
- Metaspalten
- Ampelspalte
- Positionsspalten

Typische Einstellungen:
- Spaltenbreiten
- Spaltenreihenfolge nur, falls explizit freigegeben
- Abstände und Darstellungsdichte im erlaubten Rahmen

### 5.5 Sonderbereiche
Beispiele:
- Editbox
- Foto-/Anlagenbereich
- Quicklane / Werkzeugleiste

Typische Einstellungen:
- Bereichsgröße
- relative Position
- Sichtbarkeitsnahe Darstellungsparameter (ohne Fachlogikänderung)

## 6. Bestand vs. neue UI

### Bestand
- UI ist bereits gewachsen
- Bereiche müssen nachträglich erkannt und markiert werden
- Inspektor hilft beim Sichtbarmachen und kontrollierten Einstellen
- Adapter und Landkarte dokumentieren nachträglich, was fachlich anfassbar ist

M21-Status: Diese Bestandspassage ist historisch. "Erkannt" bedeutet keine automatische Bestandserkennung und keinen DOM-Scan. Bestehende bekannte Elemente duerfen nur bewusst, explizit und pruefbar in der ElementRegistry der Ziel-App beschrieben werden.

### Neue UI
- bei UI-Neubau muss eine Bereichs-Landkarte mitgeliefert werden
- neue UI darf nicht anonym entstehen
- spätere Einstellbarkeit wird beim Bau mitgedacht
- Nutzer prüft fachlich, ohne technische Details kennen zu müssen

## 7. Exportierbarkeit
Leitplanken:
- Core darf keine BBM-Importe haben
- Adapter kapseln App-Spezifik
- Modul soll in andere eigene Apps übertragbar sein
- keine harten BBM-Pfade im Core
- BBM ist erster Pilot, nicht Architekturgrundlage

Folge:
- Portierung in weitere Apps erfolgt über neue Adapter + neue Landkarten, nicht über Core-Abzweigungen.

## 8. Grenzen und Nicht-Ziele
Festgelegt als Nicht-Ziele:
- kein freies Drag-and-drop
- keine automatische Magie für fremde Apps ohne Codezugriff
- keine Änderung von Fachlogik
- keine direkte UI-Frickelei
- kein Ersatz für Tests
- kein Tabellen-Kalibrator als Bedienoberfläche

## 9. Grobe spätere Zielstruktur
Nur Zielbild, keine Anlage in M4:

```text
src/shared/uiInspector/
- uiInspectorCore.js
- uiInspectorRegistry.js
- uiInspectorStore.js
- uiInspectorTypes.js

src/renderer/uiInspector/
- UiInspectorOverlay.js
- UiInspectorPanel.js
- UiInspectorRuntime.js

src/renderer/uiInspector/adapters/
- bbmRestarbeitenInspectorAdapter.js
- weitere Adapter später

docs/ui-landkarten/
- RESTARBEITEN.md
- PROTOKOLL.md
- RECHNUNG.md
```

Wichtig:
- In M4 werden diese Dateien/Ordner **nicht** angelegt.
- Die Struktur dient nur als Architektur-Zielbild für spätere Meilensteine.

## 10. Offene Architekturfragen für M5
- Wie genau wird der Store angebunden?
- Wie werden Layout-Landkarten formal beschrieben?
- Welche Einstellwert-Typen gibt es im MVP?
- Wie wird Overlay aktiviert?
- Wo sitzt der Einstieg in der App?
- Wie werden visuelle Prüfungen später gemacht?
- Was ist MVP und was kommt später?
