# UI-Editor V2 Regeln

## 1. Grundsatz
Editor V2 ist ein eigenes System.

Regeln:
- der Editor kennt keine Fachlogik
- der Editor kennt keine Restarbeiten-Sonderfaelle
- der Editor funktioniert fuer jede UI gleich
- die Fach-UI liefert eine Registry
- der Editor arbeitet mit Registry, nicht mit DOM-Raten

Der Editor ist generisch und fachneutral.

## 2. Registry-Pflichtdaten
Pro Element muessen mindestens diese Daten vorliegen:
- id
- label
- kind: frame / field / control
- parentId
- editable true/false
- ops: move, resize, hide
- elementRef oder eindeutiger DOM-Bezug

Optionale Daten:
- minWidth
- minHeight
- maxWidth
- maxHeight
- fontSizeAllowed
- fontWeightAllowed
- colorRolesAllowed
- spacingAllowed
- gridEditable

Ohne diese Basis arbeitet der Editor nicht.

## 3. Auswahlregel
Eine Auswahl bedeutet genau ein Element.

Regeln:
- eine Aenderung betrifft nur dieses Element
- keine automatische Aenderung von Parent, Child oder Geschwistern
- keine Bearbeitung ohne vorherige Auswahl

Damit bleibt die Bedienung eindeutig und nachvollziehbar.

## 4. Bearbeitbare Operationen
Die Operationen richten sich nach dem Elementtyp.

### frame
- verschieben
- Groesse aendern
- ein- und ausblenden

### field
- verschieben
- Groesse aendern
- ein- und ausblenden
- Schriftgroesse und Schriftstaerke ueber feste Werte

### control
- verschieben
- Groesse nur eingeschraenkt
- ein- und ausblenden
- keine beliebige Verzerrung

Die Bearbeitung bleibt damit kontrolliert und typgerecht.

## 5. Vorschau-Regel
Bearbeitung ist zuerst nur Vorschau.

Regeln:
- Abbrechen verwirft Aenderungen
- Uebernehmen oder Speichern macht Aenderungen dauerhaft
- keine automatische Speicherung waehrend der Vorschau

Vorschau und dauerhafte Anwendung bleiben getrennt.

## 6. Rueckgaengig
Der Editor muss Rueckgaengig und Wiederholen koennen.

Mindestens:
- 20 Schritte Rueckgaengig
- Wiederholen
- ausgewaehltes Element zuruecksetzen
- alles zuruecksetzen

So bleiben auch groeßere Versuchsschritte beherrschbar.

## 7. PDF / Druck
UI-Editor V2 veraendert zuerst nur die Bildschirm-UI.

Regeln:
- Druck und PDF bleiben eigener Ausgabeweg
- vorhandener Druck-/PDF-Grundstock bleibt unberuehrt
- keine automatische Kopplung zwischen UI-Editor und PDF / Druck

Die Bildschirmbearbeitung und die Ausgabe bleiben getrennt.

## 8. Speicherregel
Gespeichert werden Abweichungen vom gemeinsamen Standardlayout.

Regeln:
- gemeinsames UI-V2-Standardlayout als Kern
- Modul-Layouts bauen darauf auf
- Benutzerlayouts spaeter zusaetzlich
- Aenderungen werden als Abweichungen vom Kern gespeichert, nicht als Zerstoerung des Standards

Der Kern bleibt damit wiederverwendbar und stabil.

## 9. Anti-Regeln
Folgendes ist verboten:
- kein Hover-Flickwerk ueber alte IDs
- keine UI-spezifischen Editor-Sonderfaelle
- keine DOM-Raterei als Hauptmechanismus
- keine unendlichen Verschachtelungen
- keine freie Font-, Farb- oder Abstandswildnis

Der Editor soll generisch, ruhig und berechenbar bleiben.

