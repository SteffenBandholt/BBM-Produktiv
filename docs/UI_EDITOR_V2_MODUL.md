# UI-Editor V2 Modul

## 1. Grundsatz
Editor V2 ist ein eigenstaendiges internes UI-Editor-Modul.

Regeln:
- Editor V2 ist fachneutral
- Editor V2 kennt keine Fachmodule
- Editor V2 kennt keine Restarbeiten-Sonderfaelle
- Editor V2 kennt keine Protokoll-Sonderfaelle
- Editor V2 arbeitet ausschliesslich ueber Registry und DOM-Bezug der Registry
- Fachmodule liefern Registry-Daten
- Fachmodule behalten ihre Fachlogik

Editor V2 ist damit kein Fachmodul, sondern das gemeinsame Layout- und Bearbeitungswerkzeug.

## 2. Aktuelle technische Lage
Editor V2 liegt intern unter:

- `src/renderer/uiV2/editorV2/`

Aktuelle Kernbausteine:
- `editorV2Core.js`
- `editorV2Overlay.js`
- `editorV2Registry.js`
- `EditorV2Panel.js`

EditorLab liegt unter:

- `src/renderer/uiV2/editorLab/`

EditorLab ist nur Testflaeche, kein Fachmodul.

## 3. Verantwortlichkeiten
Editor V2 darf:
- Registry pruefen
- Registry-Elemente aufloesen
- Hover-Rahmen anzeigen
- Selected-Rahmen anzeigen
- ein Element auswaehlen
- Preview-Aenderungen ausfuehren
- verschieben
- Groesse aendern
- Reset ausfuehren
- spaeter Layoutaenderungen vorbereiten

Editor V2 darf nicht:
- Fachlogik ausfuehren
- Restarbeiten speichern
- Protokoll bearbeiten
- Datenbank schreiben
- IPC-Fachbefehle ausfuehren
- PDF / Druck aendern
- fachliche Status aendern
- fachliche Validierung durchfuehren

## 4. Fachmodule
Jedes Fachmodul darf den Editor V2 nur ueber eine Registry anbinden.

Beispiele:
- Restarbeiten V2 liefert `restarbeitenV2.*` Registry
- Angebot V2 liefert `angebotV2.*` Registry
- Rechnung V2 liefert `rechnungV2.*` Registry

Der Editor behandelt alle gleich.

## 5. Registry-Vertrag
Jeder Eintrag braucht:
- id
- label
- kind: frame / field / control
- parentId, ausser Root
- editable
- ops
- selector oder elementRef

Erlaubte ops:
- move
- resize
- hide

Nicht erlaubt im Editor:
- save
- persist
- delete
- print
- pdf
- db
- ipc

## 6. Wiederverwendbarkeit
Festlegen:
- Der Editor V2 bleibt zunaechst internes BBM-Modul
- Er wird noch nicht als eigenes npm-Paket ausgelagert
- Die Architektur bleibt so, dass eine spaetere Auskopplung moeglich ist
- Fachabhaengigkeiten im Editor V2 sind verboten
- Imports aus Restarbeiten / Protokoll / anderen Fachmodulen in `editorV2` sind verboten

## 7. Import-Grenzen
Erlaubt:
- `editorV2` darf eigene `editorV2`-Dateien importieren
- `editorV2` darf generische UI-V2-Helfer importieren, falls spaeter vorhanden
- Fachmodule duerfen `editorV2` importieren

Verboten:
- `editorV2` importiert `src/renderer/modules/restarbeiten/**`
- `editorV2` importiert `src/renderer/modules/protokoll/**`
- `editorV2` importiert alte `uiInspector`-Dateien
- `editorV2` importiert Fachrouterlogik
- `editorV2` importiert DB / IPC / PDF / Print

## 8. EditorLab
EditorLab bleibt:
- fachneutral
- Testflaeche
- Beweisflaeche
- nicht produktives Fachmodul
- nicht Projektmodul

## 9. Restarbeiten V2
Restarbeiten V2 ist das erste echte Fachmodul, das spaeter angebunden wird.
Restarbeiten V2 darf den Editor V2 nicht veraendern.
Restarbeiten V2 liefert nur:
- UI-V2-Struktur
- Registry
- fachliche Modul-Logik ausserhalb des Editors

## 10. Abnahmeregel
Bevor ein Fachmodul angebunden wird:
- Editor V2 muss im EditorLab sichtbar funktionieren
- Tests allein reichen nicht
- Sichtpruefung bleibt Pflicht
- keine Fachmodul-Anbindung bei instabilem Editor-Verhalten
