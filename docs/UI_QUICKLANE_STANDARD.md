# BBM-Quicklane-Standard

Stand: 2026-08-22
Status: verbindliche UI-Regel fuer bestehende und kuenftige BBM-Module

## Grundsatz

Projekt- oder modulbezogene Schnellwerkzeuge koennen als seitliche Quicklane am rechten Fensterrand angeboten werden. Der sichtbare Randmarker aller seitlichen Quicklanes muss innerhalb der App gleich aussehen und sich gleich verhalten.

## Verbindlicher Marker-Standard

Referenz ist der bestehende ProjectContext-/Protokoll-Marker.

Alle seitlichen Quicklane-Marker verwenden deshalb dieselbe sichtbare Grundform:

- Breite: 30 px
- Hoehe: 132 px
- Position: rechter Fensterrand, 110 px von oben
- weisser Hintergrund
- Rand `#c9d2df`, rechts offen
- Radius `10px 0 0 10px`
- Schatten `-4px 0 12px rgba(0,0,0,0.16)`
- gleiche Schrift-/Markerbehandlung wie die Referenz-Quicklane

Die sichtbare Bezeichnung darf nur dann erscheinen, wenn sie von der Referenz-Quicklane in diesem Zustand ebenfalls dargestellt wird. Es gibt keine modulbezogenen Sondermarker mehr.

## Verhalten

- Eingeklappte Marker muessen am rechten Fensterrand erreichbar bleiben.
- Beim Oeffnen darf der Randmarker entsprechend der bestehenden Referenz-Quicklane verschwinden; es wird kein zusaetzlicher freischwebender Marker neben einer offenen Quicklane angezeigt.
- Die jeweilige fachliche Quicklane-Logik bleibt modulspezifisch, die Markeroptik nicht.
- Eine vorhandene Fixieren-/Loesen-Funktion darf erhalten bleiben.
- Beim Verlassen eines Moduls werden modulbezogene Quicklane-Elemente sauber entfernt.

## Technische Regel

Marker duerfen nicht durch `overflow: hidden`, `clip-path`, Modulcontainer oder Scrollbereiche abgeschnitten werden. Sie werden robust am Fensterrand bzw. in der Shell positioniert.

Neue Module bauen keinen eigenen Marker-Stil. Sie verwenden den BBM-Quicklane-Marker-Standard oder eine spaeter daraus abgeleitete gemeinsame Komponente.

## Referenz und Bestand

- ProjectContext-/Protokoll-Quicklane: visuelle Referenz fuer den Marker.
- Restarbeiten: Marker wird auf dieselbe Geometrie und Darstellung gezogen; die bestehende Restarbeiten-Fachlogik bleibt erhalten.
- Inline-Werkzeuge innerhalb einer Leiste, z. B. TOP-Filter, sind keine Quicklane-Randmarker und fallen nicht unter diese Regel.

## Abnahmekriterien fuer neue Module

Eine seitliche Quicklane gilt erst als fertig, wenn:

1. ihr Randmarker optisch dem Referenzmarker entspricht;
2. Position, Breite und Hoehe gleich sind;
3. keine modulbezogene Sonderbeschriftung oder Sonderform entsteht;
4. der Marker nicht durch Container-Clipping verschwindet;
5. offener und geschlossener Zustand der Referenzlogik folgen;
6. beim Seitenwechsel keine verwaisten Marker uebrig bleiben.

Diese Regel ist bei neuen BBM-Modulen wiederzuverwenden und nicht pro Modul neu zu erfinden.
