# Produktions- und Liefervertrag – BBM-Produktiv

Status: verbindlich

## Ziel

BBM-Produktiv wird als nutzbare, auslieferbare Anwendung entwickelt. Das Projektziel ist nicht nur Quellcode, sondern eine praktisch geprüfte und übergebbare Anwendung.

## Verbindliche Arbeitsmodusentscheidung

Die Regeln zur Wahl zwischen normalem Arbeitsauftrag, Goal-Arbeitslauf, Unteragenten und Computer Use stehen in `AGENTS.md` und gelten uneingeschränkt.

Vor jeder Aufgabe muss Codex ausgeben:

```text
ARBEITSMODUS

Gewählter Modus:
- normaler Arbeitsauftrag
- Goal-Arbeitslauf
- Goal-Arbeitslauf mit Unteragenten

Computer Use:
- erforderlich
- nicht erforderlich
- nicht verfügbar

Begründung:
- ...

Abschlusskriterien:
- ...
```

## Wann Computer Use verpflichtend ist

Computer Use ist zu verwenden, wenn sichtbare Bedienung oder ein vollständiger Nutzerablauf betroffen ist und die Umgebung es unterstützt, insbesondere bei:

- neuen oder geänderten Masken
- Projektwechsel
- Ordnerauswahl
- Dateiliste und Zuordnung
- WebP-Erzeugung über die Bedienoberfläche
- Fehlerdialogen
- Speichern und erneutem Laden
- Übergabe an BBM Mobil
- Druck-, PDF- oder Exportabläufen

Ein erfolgreicher Build ersetzt diese Prüfung nicht.

Wenn Computer Use nicht verfügbar ist, muss dies ausdrücklich gemeldet werden. Dann ist eine nachvollziehbare manuelle Nutzerprüfung mit klaren Schritten erforderlich.

## Unteragenten

Unteragenten dürfen bei größeren Goal-Läufen für getrennte Analyseaufgaben eingesetzt werden, beispielsweise:

- vorhandenen Projektkontext untersuchen
- Datenfluss und Persistenz analysieren
- bestehende Tests bewerten
- Seiteneffekte auf andere Module suchen
- Sicherheits- oder Dateiverarbeitungsrisiken prüfen

Produktivcode bleibt durch den Hauptagenten koordiniert. Unteragenten dürfen nicht unkoordiniert dieselben Dateien ändern oder mehrere Meilensteine parallel bearbeiten.

## Definition einer Lieferung

Ein Arbeitspaket gilt nur als geliefert, wenn:

- der Code im vereinbarten GitHub-Branch oder Pull Request sichtbar ist
- alle geänderten Dateien genannt sind
- die vorgesehenen Prüfungen tatsächlich ausgeführt wurden
- sichtbare Nutzerabläufe praktisch geprüft wurden, sofern relevant
- bekannte Risiken und offene Punkte genannt sind
- keine roten Checks verschwiegen werden
- der Meilensteinstatus aktualisiert wurde

Ein lokaler oder Cloud-Commit ohne veröffentlichten Branch oder Pull Request ist keine Lieferung.

## Definition „produktiv nutzbar“

Eine Funktion ist erst produktiv nutzbar, wenn:

- der vorgesehene Nutzerablauf vollständig funktioniert
- Eingaben dauerhaft gespeichert werden
- Fehler verständlich angezeigt werden
- Abbruch oder Neustart keinen unbemerkten Datenverlust erzeugt
- Projekttrennung eingehalten wird
- bestehende Funktionen nicht unbeabsichtigt beschädigt wurden
- Installation, Start und Update nachvollziehbar dokumentiert sind
- ein reproduzierbarer Build beziehungsweise ein auslieferbares Paket vorliegt

## Lieferstufen

### Entwicklungsstand

- lokaler Code
- noch nicht als Lieferung zu bezeichnen

### Prüfkandidat

- Branch oder Pull Request vorhanden
- technische Tests grün
- Nutzerprüfung steht noch aus

### Abgenommenes Meilensteinpaket

- technische Prüfung abgeschlossen
- fachliche Nutzerprüfung abgeschlossen
- Status dokumentiert

### Auslieferbarer Stand

- reproduzierbarer Produktionsbuild
- Installations- oder Startanleitung
- Versionskennung
- Änderungsübersicht
- Backup- und Updatehinweise, soweit betroffen
- keine bekannten blockierenden Fehler

## Abnahme durch den Nutzer

Die fachliche Abnahme erfolgt durch den Nutzer. Codex darf eine technische Prüfung nicht als Ersatz für diese Abnahme darstellen.

Nach jedem sichtbaren Meilenstein ist ein kurzer, konkreter Prüfablauf bereitzustellen, ohne unnötige Fachbegriffe.

## Verbotene Abkürzungen

Nicht zulässig sind:

- nur Mock-Oberfläche als fertige Funktion melden
- nur Build ausführen und UI als geprüft melden
- Testdaten fest im Produktivablauf belassen
- Fehler verschlucken
- spätere Meilensteine heimlich vorziehen
- breite Refactorings neben einem Fachpaket
- Lieferstatus behaupten, obwohl GitHub-Übergabe fehlt

## Abschlussbericht

Bei Goal-, UI- und Lieferaufgaben muss der Abschlussbericht zusätzlich enthalten:

```text
LIEFERNACHWEIS

Repository:
Base-Branch:
Ergebnis-Branch oder Commit:
Pull Request:
Produktionsbuild:
Praktisch geprüfter Nutzerablauf:
Ergebnis der Prüfung:
Installations-/Startweg:
Offene blockierende Fehler:
Status:
- Prüfkandidat
- abgenommenes Meilensteinpaket
- auslieferbarer Stand
- gestoppt
```
