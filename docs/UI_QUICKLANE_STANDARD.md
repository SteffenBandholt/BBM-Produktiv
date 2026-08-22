# BBM-Quicklane-Standard

Stand: 2026-08-22
Status: verbindliche UI-Regel fuer bestehende und kuenftige BBM-Module

## Grundsatz

Projekt- oder modulbezogene Schnellwerkzeuge koennen als seitliche Quicklane am rechten Fensterrand angeboten werden. Eine eingeklappte Quicklane darf niemals vollstaendig verschwinden oder nur ueber eine unsichtbare Hover-Zone erreichbar sein.

## Verbindlicher Marker

- Der sichtbare Marker einer eingeklappten Quicklane heisst immer **Tools**.
- Der Marker sitzt dauerhaft am rechten Fensterrand und bleibt auch dann sichtbar, wenn die eigentliche Quicklane ausserhalb des sichtbaren Bereichs steht.
- Der Marker darf nicht durch `overflow: hidden`, `clip-path`, Modulcontainer oder Scrollbereiche abgeschnitten werden.
- Der Marker ist ein echter erreichbarer Bedieneinstieg; reine unsichtbare Hover-Flaechen oder nur dekorative Striche sind kein Ersatz.

## Verhalten

- Hover oder Klick auf **Tools** oeffnet die Quicklane.
- Ohne Fixierung darf die Quicklane nach Verlassen wieder einklappen.
- Eine Fixieren-/Loesen-Funktion darf die Quicklane dauerhaft offen halten.
- Beim Oeffnen darf der Marker mit der Quicklane nach links wandern, muss aber sichtbar und bedienbar bleiben.
- Beim Verlassen eines Moduls werden Quicklane und Marker sauber entfernt.

## Technische Regel

Quicklane und Marker muessen ausserhalb von geclippten Fachinhalten gemountet werden oder technisch so entkoppelt sein, dass Modul-`overflow` und `clip-path` den Marker nicht beeinflussen koennen. Der Marker soll `position: fixed` beziehungsweise eine gleichwertig robuste Shell-Loesung verwenden.

Alte Clipping-Loesungen, bei denen die gesamte Quicklane beschnitten wird und nur ein zufaelliger Rest sichtbar bleibt, sind fuer neue Implementierungen nicht zulaessig.

## Referenz

- Protokoll: Referenz fuer Bedienprinzip und kompakte seitliche Werkzeugleiste.
- Restarbeiten: gleicher Quicklane-Grundsatz; Markerbezeichnung **Tools**, dauerhaft am rechten Fensterrand erreichbar.

## Abnahmekriterien fuer neue Module

Eine Quicklane gilt erst als fertig, wenn alle folgenden Punkte sichtbar geprueft sind:

1. eingeklappt ist **Tools** sichtbar;
2. Klick und Hover oeffnen die Quicklane;
3. die Leiste kann wieder einklappen;
4. ein Fixieren-Zustand bleibt offen;
5. Marker und Leiste werden von keinem Modulcontainer abgeschnitten;
6. Wechsel auf eine andere Seite entfernt die alte Quicklane vollstaendig.

Diese Regel ist bei neuen BBM-Modulen wiederzuverwenden und nicht pro Modul neu zu erfinden.
