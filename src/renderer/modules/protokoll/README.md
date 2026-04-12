# Modul `Protokoll`

Diese Struktur ist die technische Heimat fuer das Fachmodul `Protokoll`.

Aktuell ist nur ein kleiner Einstieg angelegt:

- `index.js` als kleiner Modul-Einstieg mit Modulkennung, Arbeitsscreen und Sicht auf bereits umgezogenen Modulbestand
- `screens/` mit einem konservativen Einstieg auf den heutigen `TopsScreen`
- `viewmodel/` mit den ersten real umgezogenen Protokoll-ViewModels
- `TopsHeader.js` als modulinterner Header-Einstieg fuer Protokoll

Die Ordner `components/`, `domain/`, `data/`, `state/`, `viewmodel/`, `dialogs/` und `rules/`
sind absichtlich schon angelegt, damit spaetere Umzuege dort sauber anschliessen koennen.

Wichtig:

- Noch kein Vollumzug des bestehenden Tops-Unterbaus
- Noch kein Router-Umbau
- Noch keine globale Modulregistrierung
- Noch keine modulbasierte Plattformmechanik
- Gemeinsame Kernbausteine bleiben ausserhalb dieses Moduls
