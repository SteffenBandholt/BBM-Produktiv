# Zielbild – BBM-Modul „Pläne“

Status: verbindlich  
Repository: `SteffenBandholt/BBM-Produktiv`  
Projekt: BBM-Produktiv  

## Leitentscheidung

Das Modul „Pläne“ wird als eigenständiges Querschnittsmodul innerhalb der bestehenden BBM-Mutteranwendung umgesetzt.

Es arbeitet ausschließlich im Kontext des aktuell geöffneten BBM-Projekts. Jeder Plan gehört zu genau einem vorhandenen Projekt und wird über stabile Projekt-, Gebäude-, Geschoss- und Plan-IDs verknüpft.

Das Modul „Restarbeiten“ nutzt die bereitgestellten Pläne, verwaltet aber keine eigenen Planbestände.

## Verbindliche Planquelle

Je Projekt wird ein externer Ordner mit den gültigen Original-PDFs festgelegt.

Beispiel:

```text
D:\Projekte\Haferkamp\01_PLAENE_GUELTIG
```

Regeln:

- Dieser Ordner ist die einzige Quelle des gültigen Originalstands.
- BBM verändert die Original-PDFs nicht.
- BBM kopiert die Original-PDFs nicht in den eigenen Projektordner.
- BBM speichert den externen Ordnerpfad projektbezogen.
- Mobile Ableitungen werden ausschließlich automatisch erzeugt.

## Mobile Planableitung

BBM erzeugt aus gültigen Original-PDFs handytaugliche WebP-Dateien.

Zielordner je BBM-Projekt:

```text
<BBM-Projektordner>\02_PLAENE_MOBIL\aktuell
<BBM-Projektordner>\02_PLAENE_MOBIL\archiv
```

BBM Mobil erhält nur Plan-ID, Projektbezug, Gebäude, Geschoss, Planstand, Prüfsumme und mobile WebP-Datei. Windows-Pfade und Original-PDFs werden nicht an BBM Mobil übertragen.

## Gesamtausbau

Das langfristige Ziel umfasst:

- projektbezogene externe Planquelle
- PDF-Dateiliste und Planmetadaten
- manuelle Gebäude- und Geschosszuordnung
- einfache Vorschläge aus Dateinamen
- WebP-Erzeugung
- Prüfsummen und Änderungserkennung
- automatischer Planwächter
- Planstände und Archiv
- Bereitstellung für BBM Mobil
- automatische PDF-Volltextanalyse
- Schriftfeldanalyse
- automatische Erkennung von Plannummer, Index, Gebäude, Geschoss und Planart
- OCR für nicht textlesbare PDFs
- optionale KI-Unterstützung für uneinheitliche Planunterlagen
- Mehrfachseitenlogik
- Auflösungsstufen und Kachelung sehr großer Pläne
- Planvergleich
- spätere erweiterte Rechte- und Archivfunktionen

Diese Punkte bleiben Teil des Zielbilds, dürfen aber nicht vor ihrem freigegebenen Meilenstein umgesetzt werden.

## Produktionsgrundsatz

Ziel ist keine Demonstration und kein Technikprototyp, sondern eine praktisch nutzbare, produktive BBM-Funktion.

Dafür gelten:

- vorhandene BBM-Projektverwaltung verwenden
- bestehende Architektur respektieren
- keine parallelen Projekt- oder Planverwaltungen
- kleine, prüfbare Ausbauschritte
- verständliche Bedienung
- robuste Fehlerbehandlung
- keine stillen Datenverluste
- keine Behauptung „fertig“, wenn nur ein Build erfolgreich war
- sichtbare Nutzerabläufe praktisch prüfen
- Lieferfähigkeit über GitHub sicherstellen

## Abgrenzung zum Modul „Restarbeiten“

Das Modul „Pläne“ ist führend für:

- Originalordner
- Planidentität
- Zuordnung zu Projekt, Gebäude und Geschoss
- Planstände
- Prüfsummen
- WebP-Ableitungen
- Mobilfreigabe

Das Modul „Restarbeiten“ ist führend für:

- Mangel oder Restarbeit
- Beschreibung
- Firma und Gewerk
- Priorität und Frist
- Status- und Prüfablauf
- Berichte
- Archivierung der Restarbeitsaufzeichnung

Eine Restarbeit speichert nur den Bezug:

```text
projectId
planId
planVersion
page
xPercent
yPercent
```

## Änderungsregel

Dieses Zielbild darf nur nach gemeinsamer Entscheidung geändert werden. Jede Änderung wird in `03_AENDERUNGSPROTOKOLL_MODUL_PLAENE.md` dokumentiert.
