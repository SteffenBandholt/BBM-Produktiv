# UI-Inspektor Projektauftrag

## Was soll gebaut werden?
Ein neues, exportierbares UI-Inspektor-Modul als eigenständiges Produktbaustein-System. Es soll in verschiedene Apps eingebaut werden können und unabhängig von BBM-Fachlogik funktionieren.

M21-Klarstellung: Dieser Projektauftrag ist historischer UI-Inspektor-Kontext. Verbindliche Zielrichtung fuer neue Arbeiten ist das generische UI-Editor-kit. BBM-Produktiv ist nur Beispiel-/Pilot-Zielapp; der Editor liest ausschliesslich die von der Ziel-App gelieferte ElementRegistry und untersucht die Ziel-App-Oberflaeche nicht selbst.

## Für wen?
Für fachliche Anwender ohne Programmierkenntnisse.

Die Hauptbedienung muss alltagstauglich sein:
- keine CSS-Fachbegriffe in der Oberfläche
- keine technischen Strukturbegriffe in der Bedienung
- klare, verständliche Bezeichnungen für sichtbare UI-Bereiche

## Welches Problem wird gelöst?
Bestehende Oberflächen sind für Fachanwender schwer gezielt anpassbar. Kleine Layout-Änderungen erfordern oft Entwicklerwissen und technische Übergaben.

Der UI-Inspektor soll diese Lücke schließen:
- sichtbare UI-Bereiche auffinden
- Bereiche markieren und auswählen
- einfache Layoutwerte fachlich verständlich anpassen

## Was soll der Inspektor langfristig können?
Langfristig soll der UI-Inspektor:
1. echte UI-Bereiche sichtbar hervorheben
2. klickbare Bereichsauswahl mit eindeutiger Zuordnung bereitstellen
3. fachlich benannte Eigenschaften statt Technikbegriffe anbieten
4. sichere, nachvollziehbare Layout-Anpassungen ermöglichen
5. als exportierbares Modul in mehreren Apps nutzbar sein
6. app-spezifische Unterschiede über Adapter und Landkarten aufnehmen

## Was soll er ausdrücklich nicht werden?
Der UI-Inspektor ist ausdrücklich **nicht**:
- ein Tabellen-Kalibrator
- ein aufgebohrtes Entwicklerformular
- ein freier Drag-and-drop-Baukasten
- eine BBM-Sonderlösung
- ein Werkzeug für fremde Apps ohne Codezugriff

Außerdem kein Ziel:
- Änderungen an bestehender Fachlogik
- Änderungen an Router, Datenbank, Print/PDF, Restarbeiten, Protokoll oder Projektverwaltung im Rahmen dieses Grundlagenpakets
- automatische UI-Erkennung, UI-Scanning, DOM-Scan oder automatische Registry-Befuellung

## Unterschied Bestand / neue UI
Bestand:
- bestehende UIs sind historisch gewachsen und nicht durchgängig für eine laienfreundliche Inspektor-Bedienung vorbereitet

Neue UI:
- neue Oberflächen sollen frühzeitig mit Bereichs-Landkarte gedacht werden
- dadurch wird spätere Inspektor-Bedienung stabiler und verständlicher

## Klare Entscheidung
Der UI-Inspektor wird **sauber neu** als **exportierbares Modul** aufgebaut.

Der vorhandene Tabellen-Kalibrator wird **nicht** zur Hauptbasis des UI-Inspektors umgebaut.
