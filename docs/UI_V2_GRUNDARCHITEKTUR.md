# UI-V2 Grundarchitektur

## 1. Ziel
UI-V2 beschreibt die gemeinsame Grundarchitektur fuer neue Modul-UIs.
Sie legt den stabilen Kern fest, auf dem neue Oberflaechen aufbauen.

Geltungsbereich:
- neue Modul-UI
- neues gemeinsames Standardlayout
- spaetere Benutzerlayouts als zusaetzliche Ebene

Nicht Ziel:
- bestehende Fach-UIs nachtraeglich umzubauen
- Protokoll-Editbox umzubauen
- alte Pfade technisch fortzuschreiben

## 2. Grundaufbau jeder neuen Modul-UI
Jede neue Modul-UI besteht grundsaetzlich aus:
- Header
- Quicklane rechts
- Main
- Footer / Workbench

Der Aufbau ist verbindlicher Standard, nicht starres Zwangsgeruest.
Module duerfen erkennbar abweichen, solange der gemeinsame Kern erhalten bleibt.

## 3. Header
Der Header traegt den sichtbaren Kontext der jeweiligen UI.

Typische Inhalte:
- Titel / Kontext
- Filter / Suche / Status
- Hauptaktionen, soweit sie nicht besser in der Quicklane liegen

Der Header dient der Orientierung und dem schnellen Einstieg.

## 4. Quicklane
Die Quicklane sitzt rechts senkrecht neben dem Hauptbereich.

Funktionen:
- Icon-Leiste fuer Direktzugriffe
- Direktbefehle fuer Standardaktionen
- keine langen Klickwege fuer haeufige Bedienungen

Verhalten:
- Hover rein und raus
- Vorhaengeschloss zum Fixieren
- Schloss offen: Quicklane klappt automatisch ein und aus
- Schloss geschlossen: Quicklane bleibt ausgefahren sichtbar

Die Quicklane ist fuer schnelle, wiederkehrende Aktionen gedacht.

## 5. Main
Der Main-Bereich traegt die eigentliche fachliche Uebersicht.

Moegliche Formen:
- Uebersicht
- Auswahl
- Liste
- Tabelle
- Karten
- Arbeitsbereich

Grundregel:
- keine Detailbearbeitung als Hauptprinzip
- der Main-Bereich sammelt, ordnet und fuehrt zur Auswahl

## 6. Footer / Workbench
Der Footer ist der fest angedockte Arbeitsbereich fuer Bearbeitung und Details.

Eigenschaften:
- unten fest angedockt
- Hoehe veraenderbar
- einklappbar
- nicht frei schwebend

Hinweise:
- fuer neue Module generische FooterWorkbench statt Protokoll-Editbox umbauen
- Protokoll-Editbox bleibt unberuehrt

Der Footer ist der Ort fuer kontrollierte Detailarbeit, nicht fuer den eigentlichen Einstieg.

## 7. Maximale UI-Tiefe
Die maximale UI-Tiefe ist begrenzt auf vier Ebenen:
- Ebene 1: Screen
- Ebene 2: Hauptbereich
- Ebene 3: Gruppe
- Ebene 4: Element

Mehr als vier Ebenen sind verboten.
Wenn mehr Struktur gebraucht wird, sind Tabs, Akkordeon oder eine zweite Ansicht zu verwenden.

## 8. Gruppenlimit
Pro Hauptbereich sind maximal sechs Gruppen erlaubt.

Wenn mehr Gruppen noetig werden, sind Tabs, Akkordeon oder eine zweite Ansicht einzusetzen.

## 9. Elementtypen
UI-V2 kennt drei Grundtypen:
- frame = Rahmen, Gruppe, Container
- field = Eingabe-, Text- oder Listenfeld
- control = Button, Checkbox, Icon oder kleine Anzeige

Die Typen dienen der klaren Einordnung und spaeteren Bearbeitbarkeit.

## 10. Gemeinsames Standardlayout
Es gibt ein gemeinsames UI-V2-Standardlayout als Kern.

Regeln:
- alle neuen Modul-UIs bauen darauf auf
- Module duerfen eigene Abweichungen haben
- Benutzerlayouts kommen spaeter zusaetzlich
- der gemeinsame Kern bleibt erhalten

Das Standardlayout ist die stabile Basis, nicht die einzige erlaubte Form.

## 11. Typografie
Noto Sans ist die verbindliche Standardschrift der App.

Feste Schriftgroessen:
- XS = 11 px
- S = 12 px
- M = 14 px
- L = 16 px
- XL = 18 px
- XXL = 20 px

Feste Schriftstaerken:
- duenner = 300
- standard = 400
- halbfett = 600
- fett = 700

Regeln:
- keine freie Font-Auswahl
- keine krummen Schriftgroessen

## 12. Farben
Farben werden spaeter nur ueber Farbrollen gesteuert.

Farbrollen:
- Text normal
- Text schwach
- Rahmen
- Hintergrund
- Akzent
- Warnung
- Fehler
- Erfolg
- Info

Regeln:
- keine freie Farbauswahl
- Farbnutzung folgt dem Rollensystem

## 13. Abstaende
Abstaende werden als margin und padding getrennt gefuehrt.

Regeln:
- getrennt fuer oben / rechts / unten / links
- feste Stufen nur aus:
  - 0 px
  - 2 px
  - 4 px
  - 6 px
  - 8 px
  - 10 px
  - 12 px
  - 16 px
  - 20 px
  - 24 px

## 14. Raster / Spalten
Spaltenbreiten und Raster-Aufteilung duerfen spaeter nur bei freigegebenen Gruppen veraendert werden.

Regeln:
- nicht jedes Element darf das Raster aendern
- Freigabe erfolgt ueber `grid-editable` oder ein vergleichbares Registry-Merkmal

Das Raster bleibt kontrolliert und bewusst begrenzt.

