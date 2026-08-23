# PDF V2 – verbindliche Modulgrundlage

Stand: 2026-08-23

## Zweck

PDF V2 wurde genau dafür entwickelt, dass BBM-Module keine voneinander unabhängigen PDF-Gestaltungen und keine zweiten Druckwelten aufbauen.

Der gemeinsame V2-Aufbau ist die verbindliche Grundlage für alle produktiven BBM-PDFs, die diesen Pfad verwenden. Ein Fachmodul ergänzt unterhalb des gemeinsamen V2-Kopfes ausschließlich seinen eigenen fachlichen Inhalt.

## Unveränderlicher Grundaufbau

Jede V2-PDF beginnt mit dem vorhandenen gemeinsamen V2-Mainheader.

Der V2-Mainheader enthält insbesondere das BBM-Logo und die bereits definierte gemeinsame Kopfstruktur.

Unterhalb des V2-Mainheaders befindet sich die vorhandene Trennlinie.

Erst **unterhalb dieser Trennlinie** beginnt der jeweilige fachliche Modulinhalt.

Schematisch:

```text
V2-Mainheader mit Logo
────────────────────────────────  gemeinsame Trennlinie
Fachinhalt des jeweiligen Moduls
```

Dieser Aufbau darf von einem Fachmodul nicht durch einen eigenen, parallel erfundenen PDF-Hauptkopf ersetzt oder überlagert werden.

## Bestehende Modulnutzung

### Protokoll

Protokoll verwendet den gemeinsamen V2-Mainheader und beginnt mit seinem fachlichen PDF-Inhalt unterhalb der Trennlinie.

### Restarbeiten

Restarbeiten verwendet denselben V2-Grundaufbau. Der fachliche Inhalt beginnt ebenfalls unterhalb der Trennlinie; die Restarbeiten-PDF verwendet dabei das für dieses Modul festgelegte Querformat.

### Rechnungen

Für alle PDFs des Moduls `Rechnungen` gilt derselbe Grundsatz verbindlich.

Der vorhandene V2-Mainheader mit Logo und die vorhandene Trennlinie sind die gemeinsame PDF-Grundlage.

Unterhalb der Trennlinie beginnt **nicht** ein neu zu gestaltender Rechnungs-PDF-Kopf.

Dort beginnt genau der rechnungsspezifische Inhalt, dessen visuelle Grundlage bereits in der Rechnungs-UI festgelegt und umgesetzt ist.

Der in der Rechnungs-UI vorhandene und dort ein-/ausblendbare Rechnungskopf ist der erste rechnungsspezifische Bereich unterhalb der V2-Trennlinie.

Danach folgen die weiteren Rechnungsbereiche entsprechend dem bestehenden Rechnungs-UI-/Layoutvertrag.

## Verbindliche WYSIWYG-Regel für Rechnungen

Die Rechnungs-UI und die Rechnungs-PDF sind zwei Darstellungen desselben Layoutvertrags.

**Der Nutzer sieht in der Rechnungs-UI, was später gedruckt bzw. als PDF erzeugt wird.**

Daraus folgt:

- Die Rechnungs-PDF darf keine unabhängig neu entworfene Rechnung sein.
- Es darf kein eigener PDF-Rechnungskopf erfunden werden, wenn die UI bereits den Rechnungskopf festlegt.
- Die Positionsdarstellung der PDF muss dem festgelegten Bau-LV-Aufbau der UI entsprechen.
- Eine klassische kaufmännische Tabellen-/Warenwirtschaftsoptik ist ausdrücklich unzulässig, wenn sie von der Rechnungs-UI abweicht.
- Summen-, Zahlungs-, Empfänger- und Fußbereiche dürfen nicht ohne fachliche Freigabe anders strukturiert werden als in der UI.
- UI und PDF dürfen nur dort voneinander abweichen, wo das Druckmedium dies technisch erzwingt, insbesondere bei Seitenumbruch, Fortsetzungsseiten, Druckrändern, wiederholten Seitenköpfen/-füßen oder Seitennummerierung.

## Architekturgrenze

Die WYSIWYG-Regel bedeutet **nicht**, dass der Renderer die Rechnungs-UI einfach als Screenshot oder direktes DOM-Abbild drucken muss.

Die bestehende Trennung bleibt verbindlich:

- Fach-/Rechnungsdaten und strukturierte Daten, einschließlich späterer ZUGFeRD-Daten, bleiben fachlich strukturiert.
- Der gemeinsame V2-Druckpfad bleibt der produktive Renderer.
- UI und PDF verwenden denselben fachlichen Layoutvertrag als visuelle Quelle der Wahrheit.
- Es darf kein zweiter Renderer und keine zweite unabhängige PDF-Designlogik für Rechnungen entstehen.

## Pflicht vor jeder neuen PDF-Arbeit

Vor jeder Erstellung oder Änderung einer Fach-PDF muss Codex bzw. der ausführende Entwickler zuerst klären:

1. Welcher gemeinsame V2-Kopf und welche V2-Trennlinie gelten?
2. Welcher bereits vorhandene UI-/Layoutvertrag ist für den Fachinhalt die visuelle Referenz?
3. Welche Abweichungen sind ausschließlich drucktechnisch notwendig?

Wenn diese drei Punkte nicht eindeutig aus dem Bestand hervorgehen, darf **kein neues PDF-Layout entworfen werden**. Dann ist vor der Implementierung zu stoppen und eine fachliche Freigabe einzuholen.

## Verbotene Vorgehensweisen

Ohne ausdrückliche neue Freigabe sind insbesondere verboten:

- eigener fachfremder Hauptkopf oberhalb oder anstelle der V2-Trennlinie,
- eigenständig erfundene Rechnungsgestaltung unterhalb der Trennlinie,
- klassische Faktura-Tabelle als Ersatz des festgelegten Bau-LV-Layouts,
- Anpassung der bestehenden Rechnungs-UI an eine abweichend entwickelte PDF,
- zweiter PDF-Renderer,
- zweiter produktiver `printToPDF`-Pfad,
- vollständiges Kopieren älterer gemeinsamer PDF-Dateien über einen neueren integrierten Stand.

## Abnahmeregel

Eine neue oder geänderte Rechnungs-PDF ist erst abnahmefähig, wenn ein visueller Direktvergleich bestätigt:

**V2-Mainheader + Trennlinie + Rechnungsinhalt entsprechen der bestehenden Rechnungs-UI und dem festgelegten Rechnungs-Layoutvertrag.**

Eine PDF, die zwar dieselben Rechnungsdaten enthält, aber wie eine andere Anwendung oder wie eine klassische Faktura-Software aussieht, gilt als fachlich falsch.
