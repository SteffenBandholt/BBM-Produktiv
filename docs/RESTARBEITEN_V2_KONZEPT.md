# Restarbeiten V2 Konzept

## 1. Grundsatz
Restarbeiten V2 ist eine neue technische UI-Struktur fuer das erste echte Fachmodul auf der UI-V2-/Editor-V2-Basis.

Regeln:
- die alte Restarbeiten-UI dient hoechstens fachlich als Orientierung
- der alte UI-Inspector-Pfad wird nicht repariert
- die Protokoll-Editbox wird nicht umgebaut
- Protokoll bleibt unberuehrt

Die neue Struktur wird bewusst sauber und getrennt aufgebaut.

Restarbeiten V2 nutzt den Editor V2 nur als fachneutralen Layout-Editor ueber Registry. Es gibt keine Restarbeiten-Sonderlogik im Editor V2.
Restarbeiten V2 nutzt den Editor V2 nur ueber Registry.

## 2. UI-V2-Grundarchitektur
Restarbeiten V2 nutzt die gemeinsame UI-V2-Grundarchitektur:

- Header
- Quicklane rechts
- Main
- Footer / Workbench

Die Architektur ist die Basis fuer alle weiteren UI-V2-Fachmodule.

## 3. Header
Der Header zeigt den Kontext und die wichtigsten Informationen.

Enthalten sind:
- Titel / Kontext
- Kurzstatus
- Filterbereich, sofern nicht besser in der Quicklane
- keine ueberladene Bearbeitung

Der Header bleibt klar und leicht lesbar.

## 4. Quicklane rechts
Die Quicklane sitzt rechts und fuehrt zu den haeufigsten Aktionen.

Enthalten sind:
- Neu
- Speichern, falls spaeter noetig
- Filter Offen
- Filter Erledigt
- Filter Alle
- Diktat, spaeter optional
- Foto, spaeter optional
- Drucken / Export, spaeter optional
- Vorhaengeschloss / Fixierung nach UI-V2-Regel

Die Quicklane soll Standardaktionen ohne lange Wege erreichbar machen.

## 5. Main
Der Main-Bereich zeigt Uebersicht und Auswahl.
Die Hauptansicht ist damit die Uebersicht / Auswahl.
maximale Tiefe

Inhalt:
- Restarbeitenliste
- keine Detailbearbeitung als Hauptprinzip

Main-Gruppen:
- Nummer / Kennung
- Kurztext / Langtext
- Verortung
- Status / Meta

Der Main-Bereich ist die Arbeitsuebersicht, nicht die Detailbearbeitung.

## 6. Footer / Workbench
Der Footer ist die angedockte Bearbeitungs- und Detailflaeche.

Eigenschaften:
- unten angedockt
- hoehenveraenderbar
- einklappbar
- keine frei schwebende Editbox

Die Kerngedanken sind damit: unten angedockt, höhenveränderbar und einklappbar.
Der Footer steht fuer Bearbeitung / Details.
Protokoll bleibt unberuehrt.
Protokoll bleibt unberührt.

Footer-Gruppen:
- Kurztext
- Langtext
- Verortung
- Meta
- Fotos, spaeter optional
- Notiz / Zusatz, spaeter optional

Hier liegt die eigentliche Bearbeitung der ausgewaehlten Restarbeit.

## 7. Tiefe und Gruppen
Die Struktur bleibt flach.

Maximale Tiefe:
- Ebene 1: Screen
- Ebene 2: Hauptbereich
- Ebene 3: Gruppe
- Ebene 4: Element

Gruppenlimit:
- maximal 6 Gruppen je Hauptbereich

Damit bleibt die Struktur gut wartbar und fuer den Editor eindeutig.

## 8. Editor-Regel
Der Editor V2 bearbeitet nur Layout.

Regeln:
- keine Fachlogik im Editor
- Restarbeiten-Fachlogik bleibt im Modul
- der Editor arbeitet ueber Registry

Das Fachmodul liefert also die Struktur, der Editor bearbeitet nur die Layout-Form.
