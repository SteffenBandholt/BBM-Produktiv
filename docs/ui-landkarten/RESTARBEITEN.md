# UI-Landkarte Restarbeiten

## 1. Zweck
- Diese Datei beschreibt die Restarbeiten-Oberfläche als erste Pilot-Landkarte für den UI-Inspektor.
- Sie ist fachliche Dokumentation und Vorbereitung.
- Sie verändert die App nicht.

## 2. Status
- M9 DOM-Markierungen minimal eingeführt.
- Marker-IDs sind technisch in der bestehenden Restarbeiten-UI verankert.
- Ab M10 kann ein visuelles Overlay die Marker rahmen und die Inspector-ID anzeigen.
- Ab M12 zeigt ein Inspector-Panel die für den gewählten Bereich erlaubten Stellschrauben.
- Noch keine Anwendung.
- Noch keine Speicherung.
- Noch keine Layoutänderung.

## 3. Fachliche Bereichsstruktur

Restarbeiten
- Kopfbereich
  - Filterleiste
    - Klassenfilter
    - Verortungsfilter
    - Meta-Filter
- Hauptbereich
  - Restarbeiten-Liste
    - Text-/Beschreibungsteil
    - normale Spalten
    - Metaspalten
    - Ampel-/Statusdarstellung
- Eingabebereich
  - Editbox
    - Kurztext
    - Langtext / Notiz
    - Status
    - Fertig bis
    - Verantwortlich
    - Erledigt
    - Foto-/Anlagenbereich, falls vorhanden oder fachlich vorgesehen

## 4. Erste technische Landkarten-IDs
- `restarbeiten.root`
- `restarbeiten.header`
- `restarbeiten.filterleiste`
- `restarbeiten.filterleiste.klassenfilter`
- `restarbeiten.filterleiste.klassenfilter.feld`
- `restarbeiten.filterleiste.verortung`
- `restarbeiten.filterleiste.verortung.feld`
- `restarbeiten.filterleiste.meta`
- `restarbeiten.filterleiste.meta.fertig_bis`
- `restarbeiten.filterleiste.meta.status`
- `restarbeiten.filterleiste.meta.verantwortlich`
- `restarbeiten.filterleiste.meta.erledigt`
- `restarbeiten.main`
- `restarbeiten.liste`
- `restarbeiten.liste.textbereich`
- `restarbeiten.liste.metabereich`
- `restarbeiten.editbox`
- `restarbeiten.editbox.header`
- `restarbeiten.editbox.verortung`
- `restarbeiten.editbox.kurztext`
- `restarbeiten.editbox.kurztext.label`
- `restarbeiten.editbox.kurztext.restzeichen`
- `restarbeiten.editbox.langtext`
- `restarbeiten.editbox.langtext.label`
- `restarbeiten.editbox.langtext.restzeichen`
- `restarbeiten.editbox.meta`

Hinweis:
- Die IDs wurden in M9 als `data-ui-inspector-id` in bestehende DOM-Struktur ergänzt.
- Es wurden keine zusätzlichen sichtbaren Wrapper gebaut; Marker folgen der vorhandenen Struktur.

## 5. Einstell-Ebenen

### Bereichsebene
- Kopfbereich
- Hauptbereich
- Eingabebereich

### Containerebene
- Filterleiste
- Klassenfilter
- Verortungsfilter
- Meta-Filter
- Editbox-Metabereich

### Feldebene
- Fertig bis
- Status
- Verantwortlich
- Erledigt
- Kurztext
- Langtext

### Listenebene
- Textbereich
- Metabereich
- Ampel/Statusbereich

### Sonderbereiche
- Foto-/Anlagenbereich
- ggf. Quicklane / Werkzeugleiste, falls fachlich vorhanden

## 6. Denkbare Stellschrauben

Noch nicht umsetzen, nur dokumentieren.

Meta-Filter:
- Breite
- Höhe
- Abstand links/rechts
- Abstand oben/unten
- nach links/rechts
- nach oben/unten
- Feldbreiten:
  - Fertig bis
  - Status
  - Verantwortlich
  - Erledigt

Filterleiste:
- Abstand zwischen Containern
- Containerbreiten
- vertikale Ausrichtung

Liste:
- Textspaltenbreite
- Metaspaltenbreite
- Ampelspaltenbreite
- Zeilenhöhe

Editbox:
- Kurztextbreite
- Langtexthöhe
- Metabereichbreite
- Abstand zwischen Eingabefeldern

## 7. Harte Grenzen
- M8 verändert keine Restarbeiten-Dateien.
- M8 verändert keine CSS-Dateien.
- M8 verändert keine Datenbank.
- M8 verändert keine Fachlogik.
- M8 verändert keine Router-/IPC-/Preload-Dateien.
- M8 baut kein Overlay.
- M8 baut kein Panel.
- M8 speichert keine Layoutwerte.

## 8. Offene Prüffragen für spätere lokale Sichtung
- Sind alle sichtbaren Restarbeiten-Bereiche korrekt benannt?
- Fehlt ein Bereich?
- Ist Meta-Filter wirklich ein eigener Container?
- Ist Verortung ein eigener Container?
- Ist die Liste in Textbereich und Metabereich sinnvoll trennbar?
- Gehört Foto/Anlagen fachlich zur Liste, zur Editbox oder als eigener Sonderbereich?
- Welche Stellschrauben sind für den Nutzer wirklich verständlich?


## M11 Hinweis
- Ab M11 erfolgt die Bereichsauswahl über eine temporäre Trefferliste am Klickpunkt.
- Keine Handles pro Rahmen als primärer Auswahlweg.
- Keine Einstellfunktion in M11.


## M13.1 Auswahlhierarchie (Panel)
- Die Auswahl wird hierarchisch dargestellt (Parent vor Child).
- Mehrfach vorhandene Marker werden instanzscharf als `#1`, `#2`, `#3` geführt.
- Parent-Bereiche (z. B. `restarbeiten.filterleiste.verortung`) bleiben separat auswählbar neben Child-Feldern (`...verortung.feld #n`).
