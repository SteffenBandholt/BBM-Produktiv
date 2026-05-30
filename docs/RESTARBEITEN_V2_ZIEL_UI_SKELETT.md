# Restarbeiten V2 Ziel-UI-Skelett nach Editor-Regeln (M19.5)

## Zweck und Grenze
M19.5 legt nur das Ziel-UI-Skelett fachlich/dokumentarisch fest.

- Kein Code-Umbau.
- Keine UI-Implementierung.
- Kein Button-Fix.
- Keine Quicklane-Bereinigung.
- Keine Produktivaktivierung.
- Keine ReadOnly-Abnahme.

## Zielprinzip
- Das Fachmodul entwirft bewusst UI/PDF-Darstellung.
- Die UI wird nach Editor-Regeln deklarativ aufgebaut.
- Der Editor liest diese Struktur.
- Der Editor darf Darstellung aendern, nicht Fachbedeutung.
- Fachaktionen bleiben ausserhalb des Editor-Kontexts.
- PDF-Perspektive bleibt getrennt vom UI-Editor-Laufweg.

## Ziel-UI-Bereiche

### 1) Header
- Zweck: Modulidentitaet, Kontext, lesende Statushinweise.
- gehoert zur echten Ziel-UI: ja
- editor-lesbar: ja
- optisch gestaltbar: ja
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC

### 2) Quicklane / Ansichtssteuerung
- Zweck: reine Ansichts-, Filter- und Layoutsteuerung.
- gehoert zur echten Ziel-UI: ja
- editor-lesbar: ja
- optisch gestaltbar: ja
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC
- Klarstellung:
  - Quicklane darf im Ziel-Skelett nur Ansichts-/Filter-/Layoutsteuerung enthalten.
  - Quicklane darf keine Fachdatensaetze erzeugen.
  - Ein Button wie `Neu` ist im Editor-Kontext keine zulaessige Fachaktion.
  - Falls spaeter neue Restarbeit fachlich angelegt wird, dann nur in separatem Fachmodus ausserhalb des Editor-Kontexts.

### 3) Main / Restarbeiten-Liste
- Zweck: strukturierte Uebersicht von Restarbeiten als Anzeige-/Auswahlflaeche.
- gehoert zur echten Ziel-UI: ja
- editor-lesbar: ja
- optisch gestaltbar: ja
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC

### 4) Detail-/Anzeigezone
- Zweck: Anzeige der Informationen zur ausgewaehlten Restarbeit (lesen/visuell strukturieren).
- gehoert zur echten Ziel-UI: ja
- editor-lesbar: ja
- optisch gestaltbar: ja
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC

### 5) Footer / Kontextbereich
- Zweck: zusaetzliche Kontextinformationen und strukturierte Anzeigegruppen.
- gehoert zur echten Ziel-UI: ja
- editor-lesbar: ja
- optisch gestaltbar: ja
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC

### 6) Editor-V2-Panel / Editor-Zugang
- Zweck: Zugang zur Layout-/Darstellungsbearbeitung.
- gehoert zur echten Ziel-UI: nein (Werkzeugzugang)
- editor-lesbar: ja
- optisch gestaltbar: spaeter
- erlaubt fuer Editor: Position, Groesse, Sichtbarkeit, Layout (am Werkzeugpanel selbst)
- verboten fuer Editor: Fachdaten aendern/erzeugen/loeschen, Speichern, Upload, Import, Autosave, neuer IPC

### 7) spaeterer PDF-Bereich (getrennte Perspektive)
- Zweck: spaetere Druck-/PDF-Darstellung als eigener Ausgabekontext.
- gehoert zur echten Ziel-UI: nein (separate Perspektive)
- editor-lesbar: spaeter
- optisch gestaltbar: spaeter
- erlaubt fuer Editor: keine direkte UI-Code-Mischung
- verboten fuer Editor: Vermischung von UI-Editor-Laufweg mit PDF-Fach-/Ausgabelogik

## Ziel-UI-Elemente (Mindestumfang)
- Modulheader / Titelbereich
- Status-/Kontextanzeige
- Ansichtsfilter
- Restarbeiten-Liste
- einzelne Restarbeiten-Zeile
- Detail-/Lesebereich
- Kurztext-Anzeige
- Langtext-/Notiz-Anzeige (falls fachlich vorgesehen)
- Verortung / Bereich / Ebene (falls fachlich vorgesehen)
- Status-/Ampelanzeige (falls fachlich vorgesehen)
- Foto-/Anlagenbereich nur als Anzeige, nicht als Upload-Aktion
- Diktat nicht als Editor-Aktion
- Editor-Panel nur fuer Layout-/Darstellungsbearbeitung

## A) Echte Ziel-UI-Bestandteile
- Header
- Quicklane als Ansichts-/Filter-/Layoutsteuerung (ohne Fachaktionen)
- Main / Restarbeiten-Liste
- Detail-/Anzeigezone
- Footer / Kontextbereich
- deklarierte UI-Struktur, die editor-lesbar ist

## B) DEV-/Dummy-Anteile (nicht zielbildlich)
- Dummy-/Fallback-Daten als Entwicklungsstuetze
- DEV-Platzhaltertexte oder nur testweise Bedienhilfen
- Mischformen, in denen UI-Entwurf und Fachaktion ungetrennt auftreten

## C) Fachaktionen ausserhalb des Editors
- Anlegen neuer Restarbeiten
- fachliches Speichern von Restarbeiten
- fachliches Aendern/Loeschen von Restarbeiten
- Upload/Import von Dateien
- Autosave
- neue IPC-Wege fuer Fachpersistenz

## D) Spaeter optisch gestaltbar durch Anwender
- Position
- Groesse
- Sichtbarkeit
- Layout
- spaeter getrennt: PDF-Darstellung

## E) Offene fachliche Entscheidungen
- endgueltige fachliche Trennung zwischen reiner Anzeige- und Fachmodus-Bedienung
- genaue Abgrenzung, welche Filter rein ansichtsbezogen sind und welche fachlich wirken
- fachliche Festlegung, wie ein separater Nicht-Editor-Modus fuer `Neu`/Anlegen aussehen soll

## Verbindliche Trennung
- Der Editor veraendert Darstellung, nicht Fachbedeutung.
- Der Editor erzeugt, aendert oder loescht keine Fachdaten.
- Produktiv-ReadOnly bleibt hiervon unberuehrt und weiterhin deaktiviert.
