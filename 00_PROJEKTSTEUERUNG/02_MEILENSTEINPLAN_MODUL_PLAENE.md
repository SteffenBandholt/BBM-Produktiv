# Meilensteinplan – BBM-Modul „Pläne“

Status: verbindlich  
Arbeitsweise: strikt nacheinander  

## Harte Steuerungsregel

- Es wird immer nur der nächste freigegebene Meilenstein bearbeitet.
- Keine Funktion aus späteren Meilensteinen wird nebenbei eingebaut.
- Neue Ideen kommen ins Backlog oder Änderungsprotokoll.
- Ein Meilenstein beginnt erst nach Abnahme des vorherigen.
- Abweichungen sind nur nach gemeinsamer Entscheidung zulässig.
- Praktische Nutzbarkeit hat Vorrang vor technischer Eleganz auf Vorrat.

## M0 – Projektsteuerung festschreiben

Ziel:

- Zielbild dokumentieren
- Meilensteine festlegen
- Änderungsverfahren festlegen
- Arbeitsmodus, Computer Use und Liefernachweis verbindlich machen

Abnahme:

- alle Steuerungsdateien liegen im Repository
- kein Produktionscode wurde verändert
- nächster freigegebener Schritt ist M1

## M1 – Modulgerüst im bestehenden Projektkontext

Ziel:

- Modul „Pläne“ in BBM-Produktiv einordnen
- ausschließlich aktuell geöffnetes Projekt verwenden
- bestehende Projekt-ID und Projektordner verwenden
- keine projektlosen Pläne
- keine zweite Projektverwaltung

Nicht-Ziele:

- keine PDF-Analyse
- keine WebP-Erzeugung
- keine Planwächterfunktion
- keine Restarbeiten-Anbindung

Abnahme:

- ohne aktives Projekt keine Planverwaltung
- Projektwechsel trennt Daten sichtbar
- Projekt A zeigt keine Daten von Projekt B
- bestehende Module bleiben unverändert funktionsfähig

## M2 – Externen Planordner projektbezogen anbinden

Ziel:

- externen Ordner je Projekt auswählen und speichern
- PDFs im Ordner auflisten
- Originale nicht verändern oder kopieren
- manuellen Prüflauf bereitstellen

Abnahme:

- Pfad bleibt nach Neustart erhalten
- PDF-Liste gehört eindeutig zum Projekt
- Originaldateien bleiben unangetastet
- fehlender oder nicht erreichbarer Ordner wird verständlich gemeldet

## M3 – Manuelle Planzuordnung und einfache Dateinamenvorschläge

Ziel:

- vorhandene Gebäude und Geschosse des Projekts verwenden
- Plan manuell zuordnen
- einfache Vorschläge aus Dateinamen erzeugen
- Nutzer bestätigt oder korrigiert

Nicht-Ziele:

- keine Volltextanalyse
- keine OCR
- keine KI

Abnahme:

- Zuordnung bleibt gespeichert
- keine Projektstruktur wird heimlich erweitert
- Vorschläge sind korrigierbar
- unbekannte Werte führen zu klarer Nutzerentscheidung

## M4 – WebP-Erzeugung

Ziel:

- ausgewählte PDF-Seite in ein lesbares WebP umwandeln
- mobile Datei im projektbezogenen Ordner speichern
- Original-PDF extern belassen
- Fehler sicher behandeln

Abnahme:

- Linien und Texte sind auf dem Zielgerät brauchbar
- keine leeren oder beschädigten Ausgabedateien bei Fehlern
- Original wird weder verändert noch kopiert
- erzeugte Datei ist eindeutig mit Projekt und Plan verknüpft

## M5 – Planbereitstellung für BBM Mobil

Ziel:

- freigegebene mobile Pläne über den BBM-Datenvertrag bereitstellen
- Auswahl nach Projekt, Gebäude und Geschoss
- Plan-ID und Planstand in mobilen Erfassungen speichern

Abnahme:

- BBM Mobil erhält nur passende Pläne
- Plan ist mobil sichtbar
- Marker bleibt mit Plan-ID und Planstand verbunden
- keine lokalen Windows-Pfade werden übertragen

## M6 – Prüfsummen und manuelle Änderungserkennung

Ziel:

- SHA-256 des Originals speichern
- Änderungen beim manuellen Einlesen erkennen
- Status aktuell, geändert, WebP fehlt, veraltet oder Fehler führen

Abnahme:

- identische PDF erzeugt keine unnötige Neuerstellung
- geänderte PDF wird erkannt
- bisherige mobile Datei bleibt bei Fehlern erhalten

## M7 – Automatischer Planwächter

Ziel:

- Originalordner überwachen
- neue, geänderte, umbenannte, verschobene und gelöschte PDFs erkennen
- Schreibvorgänge 3–5 Sekunden abwarten
- WebP-Aktualisierung vormerken oder ausführen

Abnahme:

- unvollständig kopierte Dateien werden nicht verarbeitet
- Fehler führen nicht zum Verlust der bisherigen Mobilversion
- Löschungen bleiben historisch nachvollziehbar
- BBM Mobil erkennt neue bereitstehende Planstände

## M8 – Planstände und Archiv

Ziel:

- frühere Planstände erhalten
- aktuelle und ungültige Stände unterscheiden
- alte mobile Ableitungen archivieren
- bestehende Restarbeiten auf dem damaligen Planstand halten

Abnahme:

- alte Erfassung springt nicht auf neuen Planstand
- neue Erfassung verwendet aktuellen Plan
- Historie ist nachvollziehbar

## M9 – Erweiterte PDF-Analyse

Ziel:

- PDF-Metadaten und Volltext auswerten
- Schriftfeldinformationen erkennen
- Plannummer, Index, Planart, Gebäude und Geschoss vorschlagen
- Erkennungssicherheit anzeigen

Abnahme:

- Vorschläge bleiben bestätigungspflichtig
- unsichere Erkennung wird nicht als Tatsache gespeichert

## M10 – OCR und optionale KI-Unterstützung

Ziel:

- gescannte oder nicht textlesbare Pläne per OCR untersuchen
- uneinheitliche Schriftfelder optional per KI interpretieren
- keine ungeprüfte automatische Fachzuordnung

Abnahme:

- Original bleibt unverändert
- Quelle und Sicherheit jedes Vorschlags sind nachvollziehbar
- Nutzer bestätigt fachliche Zuordnung

## M11 – Mehrseitige und sehr große Pläne

Ziel:

- relevante Seiten auswählen
- mehrere WebP-Seiten verwalten
- Auflösungsstufen oder Kacheln für große Pläne erzeugen
- flüssige mobile Anzeige ermöglichen

Abnahme:

- Seite und Planstand bleiben eindeutig
- mobile Anzeige ist praktisch bedienbar

## M12 – Planvergleich

Ziel:

- zwei Planstände vergleichen
- geänderte Bereiche sichtbar machen
- Ergebnis nachvollziehbar dokumentieren

## M13 – Erweiterte Archiv- und Rechtefunktionen

Nur bei tatsächlichem Bedarf:

- erweiterte Suche und Filter
- Rollen und Freigaben
- Bearbeitungshistorie
- Archivkomfort

## Abnahme- und Lieferregel je Meilenstein

Jeder Meilenstein muss liefern:

- klar abgegrenzten Branch oder Commit
- vollständige Liste geänderter Dateien
- ausgeführte technische Prüfungen
- bei UI-Aufgaben einen praktisch geprüften Nutzerablauf
- offene Risiken und Nicht-Ziele
- Aktualisierung von STATUS.md
- eindeutigen Status: fertig oder gestoppt

Ein Build allein ist keine fachliche Abnahme.
