# Lizenzverwaltung

## Projektauftrag

### Zielbild
Die Lizenzverwaltung wird ein eigenstaendiges Admin-/Mutter-App-Modul.
Sie ersetzt langfristig die lose Lizenzbearbeitung im bisherigen Bereich Einstellungen / Entwicklung.
Der neue Adminbereich wird schrittweise aufgebaut.
Die bestehende Entwicklung-UI bleibt nur Uebergang.

### Warum
Die Lizenzverwaltung ist keine normale Nutzer-Einstellung.
Sie verwaltet Kunden, Produktumfang, Lizenzdateien und Historie.
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
- Lizenz verlaengern
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

Regeln:
- Standardumfang ist immer enthalten.
- Zusatzfunktionen sind zuschaltbar.
- Module sind einzeln auswaehlbar.
- `Protokoll` ist aktuell das einzige echte Fachmodul.
- `Dummy` ist nur Struktur-/Testmodul.
- `Dictate` ersetzt fachlich die alte sichtbare Bezeichnung `audio`.
- `audio` darf intern nur aus Kompatibilitaetsgruenden weiter beachtet werden, falls alte Lizenzdaten das benoetigen.

### Abgrenzung
Nicht Teil dieses Moduls:
- Diktierfunktion bauen
- Whisper umbauen
- Woerterbuch implementieren
- Projekt-Arbeitsbereich aendern
- Protokoll-Modul aendern
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
Paket 1:
Adminbereich und Lizenzverwaltungs-Modul-Skeleton vorbereiten.

Paket 2:
Bestehendes Lizenz-bearbeiten-Popup optisch/fachlich in Produktumfang gliedern.

Paket 3:
Produktumfang intern als Standardumfang, Zusatzfunktionen und Module abbilden.

Paket 4:
Kunden- und Lizenzdatensatz vorbereiten.

Paket 5:
Bestehende Lizenz laden, aendern und neu ausgeben.

Paket 6:
Lizenzhistorie ergaenzen.

### Abnahmekriterien
- `SettingsView` ist nicht mehr fachlicher Besitzer der Lizenzverwaltung.
- Lizenzverwaltung hat ein eigenes Modulverzeichnis.
- Produktumfang ist nicht mehr eine flache Feature-Liste.
- Standardumfang, Zusatzfunktionen und Module sind getrennt.
- `Dictate` ist als Produktfeature sauber benannt.
- `Protokoll` und `Dummy` sind als Module getrennt von Zusatzfunktionen.
- Alte Lizenzdaten bleiben kompatibel.
- Keine Adminfunktion erscheint als Projektmodul.

## Rolle
- echtes Admin-/Mutter-App-Modul
- kein normales Nutzer-Setting
- kein Projektmodul
- nicht lose in `SettingsView`

## Verortung
- Adminbereich wird neu angelegt
- `Entwicklung` bleibt Übergang
- Admin-/Mutter-App-Funktionen werden schrittweise in den Adminbereich überführt

## Ziel
- Kunden verwalten
- Lizenzen je Kunde verwalten
- Produktumfang festlegen
- Lizenzdateien erzeugen
- bestehende Lizenz laden
- Lizenz erweitern / verlängern / neu ausgeben
- Lizenzhistorie führen

## Produktumfang
- Standardumfang: `app`, `pdf`, `export`
- Zusatzfunktionen: `mail`, `Dictate`
- Module: `Protokoll`, `Dummy`

## Regeln
- Standardumfang ist immer enthalten
- Zusatzfunktionen sind zuschaltbar
- Module sind einzeln auswählbar
- `Dummy` ist nur Struktur-/Testmodul
- `Dictate` ist Lizenz-/Produktfeature
- `Diktieren` ist Technik-/Entwicklungsbereich
- `Whisper` ist aktuelle Engine unter `Diktierprodukt`
- `Wörterbuch` ist vorbereiteter Baustein
- `Audio / Diktat` bleibt Maschinenraum

## Nicht-Ziele
- keine Diktierfunktion
- kein Whisper-Umbau
- keine Projektmodul-Logik
- keine normale Nutzer-Settings-Funktion
- keine Sidebar-Entscheidung

## Migrationsweg
- bestehende Lizenz-/Entwicklungsfunktionen bleiben zunächst Übergang
- `SettingsView` wird schrittweise entlastet
- Zielpfad später: `src/renderer/modules/lizenzverwaltung/`

## Abnahmekriterien
- Lizenzverwaltung ist als eigenes Zielmodul beschrieben
- `ARCHITECTURE.md`, `PLAN.md` und `STATUS.md` enthalten nur kurze Verweise
- Hauptdateien ufern nicht aus
