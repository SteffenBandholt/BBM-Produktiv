# UI-Editor V2 Ablauf

## 1. Reihenfolge
Der Umbau folgt dieser Reihenfolge:
- M14.0a: UI-V2 und Editor-V2 Regeln dokumentieren
- M14.0b: Tests fuer diese Regeln
- M14.1: EditorLab-Testflaeche bauen
- M14.2: Editor V2 Hover / Markierung im EditorLab
- M14.3: Editor V2 Klickauswahl im EditorLab
- M14.4: Editor V2 temporaeres Verschieben / Groesse im EditorLab
- M14.5: Editor V2 Registry-Schnittstelle stabilisieren
- M14.6: Editor V2 sichtbare Bedienoberflaeche im EditorLab
- M14.7: EditorLab V2 als Dev-Testzugang sichtbar machen
- M14.8: Erst danach Restarbeiten V2 anschliessen
- M15.0a: Editor V2 als fachneutrales Modul dokumentieren
- M15.0: Restarbeiten V2 fachlich/technisch vorbereiten
- M15.1: Restarbeiten V2 Registry-Test vorbereiten
- weitere Ausbauschritte folgen nur bei Bedarf

Undo/Redo ist fuer spaeter geparkt und ist kein Blocker fuer die Restarbeiten-V2-Anbindung.

Die Reihenfolge bleibt absichtlich streng.

## 2. EditorLab
EditorLab ist die neutrale Testflaeche fuer Editor V2.

Eigenschaften:
- keine Fachlogik
- dient als Beweis, dass der Editor grundsaetzlich funktioniert
- erst EditorLab, dann Fachmodul

Beispielstruktur:
- EditorLab
  - Header
  - Quicklane
  - Main
    - Gruppe A
    - Gruppe B
  - Footer
    - Gruppe C
    - Gruppe D

EditorLab enthaelt:
- frame
- field
- control

## 3. Fachmodule
Fachmodule werden erst nach EditorLab angeschlossen.

Regeln:
- Restarbeiten V2 wird das erste Fachmodul nach EditorLab
- Protokoll bleibt unberuehrt
- die alte Restarbeiten-UI ist nicht die technische Grundlage fuer Editor V2
- die alte UI darf fachlich als Orientierung dienen

Der Editor wird also zuerst fachneutral bewiesen und erst danach fachlich angebunden.

## 4. Abnahmeprinzip
Tests reichen nicht allein aus.

Regeln:
- echte App-Sichtpruefung bleibt Pflicht
- kein Commit bei sichtbarem No-Go
- kein Mergen trotz gruener Tests, wenn die UI nicht stimmt

Technische Nachweise und Sichtpruefung gehoeren zusammen.

## 5. Arbeitsweise
Der Arbeitsstil bleibt bewusst klein.

Regeln:
- kleine Pakete
- ein Paket = ein Ziel
- temporaeres Verschieben
- temporäres Verschieben
- Groesse
- Größe
- keine Mischung aus Editor-Core und Fach-UI
- keine Mischung aus UI-Code und PDF / Druck
- keine gleichzeitige Bearbeitung von frame / field / control, wenn nur frame geplant ist

Protokoll bleibt unberührt.
echte App-Sichtprüfung

Das haelt die Folgepakete klein, pruefbar und sauber trennbar.
