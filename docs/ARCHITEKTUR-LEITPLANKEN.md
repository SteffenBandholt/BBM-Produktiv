# Architektur-Leitplanken

## Aktuelle Richtung

Dieses Repository bleibt die aktive Produktiv-Baustelle.
`TopsScreen` wird hier produktiv fertiggebaut.
Ein vollständiger modularer Umbau der gesamten App findet jetzt nicht statt.

## Ziel für den aktuellen Ausbau

Neue gemeinsame Bauteile werden bereits sauber in eine neue Struktur eingeordnet, damit der spätere modulare Umbau nicht verbaut wird.

## Verbindliche Ordnerstruktur

src/renderer/
- app/
- modules/
- core/
- stamm/
- addons/
- ui/
- shared/

## Bedeutung der Ordner

- `modules/`: Fachmodule wie Tops, Restarbeiten, Firmen, Projekte
- `core/`: wiederverwendbare Kernbausteine
- `stamm/`: gemeinsame Stammquellen
- `addons/`: Zusatz- und Ausgabemodule
- `ui/`: allgemeine UI-Bausteine
- `shared/`: sonstige allgemeine Helfer

## Aktuell relevante neue Bereiche

- `src/renderer/core/editbox`
- `src/renderer/core/responsible`
- `src/renderer/core/status-ampel`
- `src/renderer/core/textregeln`
- `src/renderer/stamm/firmen`
- `src/renderer/stamm/mitarbeiter`

## Arbeitsregel

Neue gemeinsame Bauteile werden sofort in diese Struktur gebaut.
Bestehender Altbestand wird nicht pauschal umgeräumt, sondern nur bei echter Bearbeitung gezielt in die neue Richtung gezogen.

## Einordnung wichtiger Bauteile

- Editbox = essenzieller Kernbaustein
- Verantwortlich = gemeinsamer Stecker auf Firmen/Mitarbeiter
- Status + Fertig-bis + Ampel = gemeinsames Regelpaket
- PDF = wichtiges Ausgabemodul
- Whisper = Zusatz-/Komfortmodul

## Spätere Phase

Nach einem produktiv stabilen Stand dieser App wird ein Klon erstellt.
Der vollständige modulare Architekturumbau erfolgt erst in diesem Klon.

## Prüfregel für neue Ideen

Jede neue Idee wird zuerst daran gemessen:
1. Hilft sie direkt, `TopsScreen` produktiv fertigzustellen?
2. Gehört sie als gemeinsamer Unterbau in `core` oder `stamm`?
3. Oder ist sie eine Aufgabe für den späteren Klon?

Wenn Punkt 1 nicht erfüllt ist, wird die Idee nicht ungeprüft in diesem laufenden Repo umgesetzt.
