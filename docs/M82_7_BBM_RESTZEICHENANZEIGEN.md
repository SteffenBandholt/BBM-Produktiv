# M82.7 – BBM-Restzeichenanzeigen

## Status

M82.7 ist `[A] abgenommen`. Die vorhandenen Restzeichenanzeigen für Kurz- und Langtext können im bestehenden Editor wirksam feingetunt werden, ohne Ziel-App-Topologie oder Fachlogik zu verändern.

## Registry und Refs

Die bestehenden Ziele bleiben unverändert:

- `restarbeiten.edit.short.remaining` unter `restarbeiten.edit.short.headerZone`,
- `restarbeiten.edit.long.remaining` unter `restarbeiten.edit.long.headerZone`.

Beide verwenden ihre vorhandenen DOM-Refs. Freigegeben sind exakt `move`, `textResize` und `setVisibility`. `resizeWidth`, `resizeHeight`, Tabellen- und Gruppenoperationen bleiben gesperrt.

Die Baseline entspricht dem produktiven Layout: `x=0`, `y=0`, Schriftgröße 8,667 px, Minimum 6 px, Maximum 10 px. Die Verschiebung ist auf 12 DIP je Achse begrenzt und bleibt damit in der vorhandenen Kopfzeile.

## Unveränderte Fachgrenze

Textinhalt, Restzeichenberechnung, Zeichenlimits, Kurz-/Langtextwerte, Diktatbuttons, Klassensteuerung, Parentstruktur, Displaymodell und Scrollbesitz bleiben unverändert. Es wurden keine DOM-Knoten, Wrapper, Gruppen oder Layoutzonen ergänzt.

## Sichtbare Diagnostic-Abnahme

Die paketierte Ausgabe lief mit eingebranntem Flavor `development-diagnostic`, sichtbarer Kennzeichnung „Entwicklungsversion – Testlizenz“ und einem vollständig isolierten `user-data-dir`. Die echte Benutzer-Datenbank und Benutzerlizenz wurden nicht als Laufzeitquelle verwendet.

In den sichtbaren Electron- und WPF-Fenstern wurden beide Restzeichenanzeigen ausgewählt. Geprüft wurden:

- Schrift kleiner/größer und direkte Schriftgröße,
- Steuerkreuz und direkte Position,
- Ausblenden/Einblenden,
- Undo, Save und Neustart-Restore ohne Doppelanwendung,
- Originalzustand mit anschließendem Undo,
- unveränderte Werte `56` und `333`, Nachbarelemente und Parents,
- vertikales Scrollen der vorhandenen Liste bei weiterhin verborgenem horizontalem Overflow,
- bestehende HTML-Ausgabevorschau mit 61 Zeilen,
- bestehender Protokoll-TopScreen mit unverändertem mittleren Scrollbesitz.

Der sichtbare Restarbeiten-DOM-Fingerprint blieb vor und nach Reset/Undo bei 97 Knoten identisch: `sha256:895cc5f4524bdf9658bf01a6f67f69fdcd576c392d3d98ff96aeae1708bbeba2`.

## Grenzen

Keine neue UI, Registry, Pipe, Topologie, Fachlogik, Datenbankmigration, PDF-Logik oder Audiofunktion wurde eingeführt. `docs/licensing.md` bleibt unangetastet.
