# Lizenzverwaltung

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
