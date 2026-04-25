# Lizenzverwaltung

## Projektauftrag

### Zielbild
Die Lizenzverwaltung wird ein eigenstaendiges Admin-/Mutter-App-Modul.
Sie ersetzt langfristig die lose Lizenzbearbeitung im bisherigen Bereich `Einstellungen / Entwicklung`.
Der neue Adminbereich wird schrittweise aufgebaut.
Die bestehende Entwicklung-UI bleibt nur Uebergang.
Die Lizenzverwaltung ist keine normale Nutzer-Einstellung, sondern verwaltet Kunden, Produktumfang, Lizenzdateien und Historie.
Sie darf nicht dauerhaft lose in `SettingsView` gerendert werden.

### Zielort
App:
`Einstellungen -> Adminbereich -> Lizenzverwaltung`

Code-Ziel:
`src/renderer/modules/lizenzverwaltung/`

### Kernfunktionen
- Kunden anlegen
- Kunden bearbeiten
- Kunden wiederfinden
- Lizenzen je Kunde verwalten
- bestehende Lizenz laden
- Produktumfang ändern
- Lizenz verlängern
- Lizenz neu ausgeben
- Lizenzhistorie anzeigen
- Lizenzdateien erzeugen

### Produktumfang
Standardumfang:
- `app`
- `pdf`
- `export`

Zusatzfunktionen:
- `mail`
- `Dictate`

Module:
- `Protokoll`
- `Dummy`

### Regeln
- Standardumfang ist immer enthalten.
- Zusatzfunktionen sind zuschaltbar.
- Module sind einzeln auswählbar.
- `Protokoll` ist aktuell das einzige echte Fachmodul.
- `Dummy` ist nur Struktur-/Testmodul.
- `Dictate` ersetzt fachlich die alte sichtbare Bezeichnung `audio`.
- `audio` darf intern nur aus Kompatibilitätsgründen weiter beachtet werden, falls alte Lizenzdaten das benötigen.
- `Diktieren` ist der Technik-/Entwicklungsbereich.
- `Whisper` ist die aktuelle Engine unter `Diktierprodukt`.
- `Wörterbuch` ist ein vorbereiteter Baustein.
- `Audio / Diktat` bleibt Maschinenraum.

### Abgrenzung
Nicht Teil dieses Moduls:
- Diktierfunktion bauen
- Whisper umbauen
- Wörterbuch implementieren
- Projekt-Arbeitsbereich ändern
- Protokoll-Modul ändern
- normale Nutzer-Settings ausbauen
- Sidebar-Entscheidung fuer Endnutzer treffen

### Migrationsweg
1. Adminbereich als geschuetzten Zielbereich dokumentieren.
2. Lizenzverwaltung als eigenes Renderer-Modul anlegen.
3. Bestehende Lizenzbearbeitung aus `SettingsView` schrittweise herausloesen.
4. Produktumfang in Standardumfang, Zusatzfunktionen und Module trennen.
5. Bestehende Lizenzdaten kompatibel uebernehmen.
6. Kunden-/Lizenzdatenmodell ergaenzen.
7. Historie erzeugter Lizenzdateien ergaenzen.
8. Erst danach App-seitige Freischaltungen auswerten.

### Erste Umsetzungspakete
- Paket 1: Adminbereich und Lizenzverwaltungs-Modul-Skeleton vorbereiten.
- Paket 2: Bestehendes Lizenz-bearbeiten-Popup optisch/fachlich in Produktumfang gliedern.
- Paket 3: Produktumfang intern als Standardumfang, Zusatzfunktionen und Module abbilden.
- Paket 4: Kunden- und Lizenzdatensatz vorbereiten.
- Paket 5: Bestehende Lizenz laden, aendern und neu ausgeben.
- Paket 6: Lizenzhistorie ergaenzen.

### Abnahmekriterien
- `SettingsView` ist nicht mehr fachlicher Besitzer der Lizenzverwaltung.
- Lizenzverwaltung hat ein eigenes Modulverzeichnis.
- Produktumfang ist nicht mehr eine flache Feature-Liste.
- Standardumfang, Zusatzfunktionen und Module sind getrennt.
- `Dictate` ist als Produktfeature sauber benannt.
- `Protokoll` und `Dummy` sind als Module getrennt von Zusatzfunktionen.
- Alte Lizenzdaten bleiben kompatibel.
- Keine Adminfunktion erscheint als Projektmodul.
