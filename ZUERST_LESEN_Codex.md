# ZUERST LESEN – Codex-Arbeitsgrundlage

Diese Datei ist die kurze Arbeitsgrundlage für neue Chats / neue Codex-Läufe in diesem Repo.

## Ziel des aktuellen Architekturstrangs

Die Anwendung wird konservativ modularisiert.

Wichtig:
- kein abrupter Komplettumbau
- keine künstliche Plattformmechanik
- keine aggressive Massenmigration
- kleine, prüfbare Pakete
- bestehende Funktion bleibt erhalten
- Übergänge dürfen vorübergehend bestehen, müssen aber bewusst bleiben

## Aktueller grober Stand

### Bereits erreicht
- `Protokoll` ist als Fachmodul sichtbar vorbereitet.
- `Restarbeiten` ist als eigenes Fachmodul sichtbar vorbereitet.
- Beide Module besitzen einen Moduleinstieg unter `src/renderer/modules/`.
- Der App-Kern besitzt:
  - einen kleinen statischen Modulkatalog
  - eine kleine Modul-/Screen-Auflösung
- `Restarbeiten` hat:
  - fachlichen Schnitt
  - Modulstruktur
  - kleine eigene Workbench
  - Moduleinstieg
  - Einzelbetriebsnachweis
- `Protokoll` und `Restarbeiten` koexistieren im aktuellen Modulrahmen nachweisbar.
- Erste Altpfade und Mischzustände wurden bereits reduziert.
- Der dokumentierte Abschlussstand wurde in `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md` festgehalten.

### Bewusst noch offen
- `TopsScreen` liegt weiterhin unter `src/renderer/views/`.
- Ein erheblicher Teil des Protokoll-Unterbaus liegt weiterhin unter `src/renderer/tops/`.
- Produktive modulbezogene Navigation ist noch klein.
- `Restarbeiten` ist noch nicht breit produktiv über Router/Navigation verdrahtet.
- Weitere Restmischzonen und Altpfade existieren noch.

## Harte Leitplanken

### Fachmodule
`Protokoll` und `Restarbeiten` sind getrennte Fachmodule.

### Außerhalb der Fachmodule bleiben
- gemeinsamer Bearbeitungskern
- gemeinsame Domänen
- gemeinsame Dienste
- App-Kern
- Router / Shell
- Modulkatalog
- Modul-/Screen-Auflösung

### Nicht tun
- keine Fachlogiken vermischen
- keine Plattformmechanik vorziehen
- keine breite Navigationserweiterung ohne klares Paket
- keine großen Umbauten in einem Schritt
- keine Planabschnitte falsch zuordnen
- keine Doku schreiben, die mehr behauptet als technisch erreicht wurde

## Pflichtdateien

Vor jedem neuen Paket lesen:
1. `ARCHITECTURE.md`
2. `docs/MODULARISIERUNGSPLAN.md`
3. `README-CHATGPT.md`
4. `docs/ARBEITSMODUS-CODEX.md`
5. `docs/domain/TOP-REGELN.md`

## Paket-Arbeitsmodus

Jedes Paket läuft nach demselben Muster:

1. kleinstes sinnvolles Paket bestimmen
2. nur wenige eng zusammenhängende Dateien anfassen
3. keine späteren Schritte vorziehen
4. Diff prüfen lassen
5. erst nach Freigabe committen / mergen / pushen

## Branch- und Commit-Stil

### Branch
`phaseX-paketY-<kurzname>`

### Commit
`Phase X Paket Y: <Beschreibung>`

## Planpflege ist Pflicht

Bei jedem Paket:
- Status im passenden Schritt aktualisieren
- Paketabschnitt ergänzen
- ehrlich benennen:
  - was erreicht wurde
  - was nicht erreicht wurde
  - was Übergang bleibt

## Wichtig für neue Chats

Nicht sofort umbauen.

Zuerst:
- Pflichtdateien lesen
- Stand kurz zusammenfassen
- 2–3 sinnvolle nächste kleine Pakete vorschlagen
- dann auf Auswahl warten

## Prüffrage vor jedem Paket

Ist das wirklich:
- der kleinste sinnvolle nächste Schritt,
- mit geringem Risiko,
- architekturtreu,
- ohne Großumbau,
- und sauber im Plan verortet?

Wenn nein: kleiner schneiden.