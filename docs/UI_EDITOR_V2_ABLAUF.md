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
- M15.2: Restarbeiten V2 Registry-Skeleton anlegen
- M15.3: Restarbeiten V2 Screen-Skeleton ohne Fachfunktion
- M15.9: Restarbeiten V2 DEV lokale Neu-Funktion ohne Speicherung
  - Quicklane `Neu` erzeugt lokal Dummy-Restarbeiten, waehlt sie direkt aus und aktualisiert Liste plus Workbench ohne Persistenz.
- M15.10: Restarbeiten V2 DEV lokale Filterfunktion ohne Speicherung
  - Quicklane-Filter `Alle`, `Offen` und `Erledigt` schalten rein lokal, halten Auswahl wenn sichtbar und fallen sonst auf eine sinnvolle lokale Auswahl oder keine Auswahl zurueck.
- M15.11: Restarbeiten V2 DEV-Screen intern entflechten
  - Dummy-Daten, ViewModel-Logik und einfache DOM-Helfer sind in kleine Module ausgelagert, ohne das sichtbare Verhalten zu aendern.
- M16.0: Restarbeiten V2 Datenvertrag und Adapter-Grenze festlegen
  - Der fachliche Datenvertrag, die spaetere Adapter-Grenze und die Trennung zu UI und Editor V2 werden dokumentiert, ohne Produktivcode anzufassen.
- M16.1: Restarbeiten V2 DataSource-Interface als Stub anlegen
  - Ein technischer Stub bereitet die spaetere Grenze zwischen Screen/ViewModel und Adapter/IPC/DB vor, ohne echte Daten anzubinden.
- M16.2: Restarbeiten V2 Mapper fuer bestehende Daten vorbereiten
  - Die Mapping-Helfer normalisieren Legacy- und Bestandsfelder in das neue RestarbeitV2Dto-Format, ohne echte Datenanbindung.
- M16.3: Restarbeiten V2 Screen mit injizierter DataSource vorbereiten
  - Der Screen kann optional eine DataSource annehmen und geladenen Datenbestand rein lokal weiterverarbeiten, der Dummy-Modus bleibt der Standard.
- M16.4: Restarbeiten V2 DEV-Zugang mit Fake-DataSource pruefen
  - Der bestehende DEV-Zugang laedt sichtbar ueber eine lokale Fake-DataSource und zeigt, dass der optionale Ladepfad im Entwicklerzugang funktioniert.
- M16.5: Restarbeiten V2 ReadOnly-Adapter vorbereiten
  - Ein lesender Adapter kann spaeter Legacy- oder Bestandsdaten ueber eine injizierte Quelle ins V2-DTO-Format normalisieren, ohne Schreibwege zu oeffnen.
- M16.6: Restarbeiten V2 DEV-Zugang ueber ReadOnly-Adapter pruefen
  - Der DEV-Zugang zeigt die sichtbare Kette von einer lokalen Legacy-Quelle ueber den ReadOnly-Adapter bis in den Screen, ohne echte Anbindung.
- M16.7: Restarbeiten V2 Legacy-Lese-Bridge vorbereiten
  - Eine kleine Bridge kann spaeter vorhandene Lesefunktionen als injizierte Quelle an den ReadOnly-Adapter weiterreichen, ohne Schreibwege zu oeffnen.
- M16.8: Restarbeiten V2 bestehende Lesewege inventarisieren
  - Die vorhandenen Restarbeiten-Lesewege werden dokumentiert und auf ihre Eignung fuer die spaetere Legacy-Bridge eingeordnet.
- M16.9: Restarbeiten V2 Leseweg-Kandidat festlegen
  - Ein bestehender lesender Weg wird verbindlich als spaetere Grundlage fuer die ReadOnly-Kette festgelegt.
- M17.0: Restarbeiten V2 ReadOnly-Leseanbindung vorbereiten
  - Die eng begrenzte technische Vorbereitung verbindet den gewaehlten Leseweg ueber Bridge und Adapter, ohne Schreib- oder UI-Umbauten.
- M17.1: Restarbeiten V2 ReadOnly-Lesequelle testweise anbinden
  - Der DEV-Zugang nutzt die vorbereitete ReadOnly-Factory testweise fuer die lesende Kette bis in den Screen.
- M17.2: Restarbeiten V2 ReadOnly-Lesequelle im Projektkontext absichern
  - Der DEV-Einstieg gibt jetzt den aktuellen Projektkontext weiter und faellt nur ohne Projekt auf den DEV-Standard zurueck.
- M17.3: Echten Legacy-ReadOnly-Loader hinter die Factory haengen
  - Der DEV-/ReadOnly-Pfad probiert jetzt den vorhandenen Legacy-Leseloader und faellt nur bei fehlendem Projektkontext oder Fehlern auf die DEV-Fallback-Rows zurueck.
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
