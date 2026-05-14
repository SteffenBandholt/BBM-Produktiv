# Editor 1 – Konzept und Vertrag für normale Tabellen

Stand: 13.05.2026  
Fassung: V2 – geschärfte Arbeits- und Architekturgrundlage  
Projekt: BBM / layoutTools / Tabellen-Kalibrierung  
Zweck: Verbindlicher Konzeptvertrag für **Editor 1** vor Erstellung konkreter Codex-Aufträge.

---

## 0. Zweck dieser Fassung

Diese Fassung schärft das bisherige Konzept so, dass daraus später ein sauberer Projektauftrag und anschließend kleine, kontrollierte Codex-Aufträge abgeleitet werden können.

Diese Fassung ist noch **kein Codex-Implementierungsauftrag**.

Ziel dieser Fassung ist:

- Missverständnisse aus den bisherigen Editor-Versuchen verhindern,
- den Editor fachlich und technisch begrenzen,
- die Trennung zwischen Editor, echter UI und echter PDF-Ausgabe verbindlich machen,
- die spätere Umsetzung in kleine, prüfbare Pakete vorbereiten,
- Sonderlösungen je Tabelle vermeiden,
- wiederholtes manuelles Kleinklein an jeder einzelnen Tabelle verhindern.

---

## 1. Ausgangslage

Der bisherige layoutTools-/Tabelleneditor wurde verworfen.

Grund:

- Er war zu früh direkt in echte UI- und PDF-Laufwege eingebaut.
- Er griff in TOP-Liste, PDF-Vorschau und Druckausgabe ein.
- Dadurch entstanden Nebenwirkungen:
  - PDF-Ausgabe wurde blockiert,
  - Editor erschien an falschen Stellen,
  - Kalibrierung AN/AUS beeinflusste den normalen Druckweg,
  - Änderungen wurden teilweise nur in UI oder nur in PDF wirksam,
  - einzelne Regler hatten Nebenwirkungen auf andere Werte,
  - jede Tabelle musste wieder einzeln und neu behandelt werden.
- Weitere Einzelreparaturen wurden gestoppt.

Verbindliche Entscheidung:

> Der alte Editor wird nicht weiter repariert.  
> Editor 1 wird neu konzipiert und in klar getrennten Teilen umgesetzt.

---

## 2. Grundsatz

**Editor 1 ist ein internes DEV-only Hilfsmodul zur Tabellen-Kalibrierung.**

Er ist:

- kein Endbenutzer-Werkzeug,
- kein Admin-Werkzeug,
- kein Poweruser-Werkzeug,
- kein Bestandteil der normalen App-Bedienung,
- kein direkter Ersatz für UI- oder PDF-Ausgabewege,
- kein Druckmodus,
- keine PDF-Vorschau,
- kein Tabellen-Renderer für den Normalbetrieb.

Endbenutzer dürfen niemals sehen:

- Layout-Toolbar,
- Marker,
- grüne Rahmen,
- Zonenbedienung,
- Layout-Schalter,
- Speichern/Reset/Editorfunktionen,
- Kalibrierungsmodus,
- Entwicklungskennzeichen.

Der Editor darf nur in einem ausdrücklich aktivierten Entwicklungs-/DEV-Kontext erreichbar sein.

---

## 3. Ziel von Editor 1

Editor 1 soll **normale Tabellen und tabellenartige Listenbereiche** modulübergreifend kalibrieren.

Zielworkflow:

1. Tabelle wird im jeweiligen Fachmodul fachlich grob gebaut.
2. Tabelle stellt einen klaren Tabellenvertrag bereit.
3. Tabelle wird als registrierte Tabelle oder als modulgemeldeter Kandidat im Editor sichtbar.
4. Tabelle wird in Editor 1 ausgewählt.
5. Layoutwerte werden in einer isolierten Editor-Vorschau eingestellt.
6. Speichern schreibt die Layoutwerte dauerhaft.
7. Echte UI und echte PDF-Ausgabe lesen diese gespeicherten Werte separat.
8. Keine Marker, keine Toolbar, kein Editor im echten UI-/PDF-Laufweg.

Verbindliche Regel:

> Speichern in Editor 1 = dauerhafte Übernahme der Layoutwerte für echte UI/PDF.  
> Kein Export-Zwischenschritt.  
> Kein zusätzlicher „Übernehmen“-Schritt.  
> Keine automatische Layoutangleichung.

---

## 4. Modulübergreifender Anspruch

Editor 1 ist ein eigenständiges Hilfsmodul und dient grundsätzlich allen Fachmodulen.

Beispiele:

- Protokoll,
- ToDo,
- Restarbeiten,
- Mängel,
- Firmenlisten,
- Teilnehmerlisten,
- spätere Module.

Das Protokoll-Modul darf nur Nutzer des Editors sein, nicht Voraussetzung.

Der Editor darf keine Protokoll-Sonderlösung werden.

---

## 5. Was Editor 1 bearbeiten darf

Editor 1 darf bearbeiten:

- echte Tabellenstrukturen,
- tabellenartige UI-Listenbereiche,
- klare Spalten-/Zonenstrukturen,
- einfache Metaspalten,
- optional markierte Zelltypen innerhalb einer Spalte.

Editor 1 darf nicht bearbeiten:

- verschachtelte Tabellen,
- Kartenlayouts,
- Firmenkarten,
- Kontaktkarten,
- Personenraster,
- Tabellen-in-Tabellen,
- komplexe Sonderlayouts innerhalb einer Zelle,
- frei positionierte Dokumentlayouts,
- Druckdeckblätter,
- Formularlayouts.

Diese Fälle gehören nicht in Editor 1. Sie können später in einem getrennten Editor 2 oder in separaten Layoutwerkzeugen behandelt werden.

---

## 6. Definition „normale Tabelle“

Eine normale Tabelle im Sinne von Editor 1 ist:

- fachlich eine Tabelle oder tabellenartige Liste,
- mit klarer Spalten-/Zonenstruktur,
- mit stabilen Spalten-Keys,
- ohne verschachtelte Kartenlogik,
- ohne eingebettete Untertabellen,
- ohne komplexe Raster innerhalb einer Zelle.

Beispiele für Editor 1:

- TOP-Liste UI,
- TOP-Liste PDF,
- ToDo-Liste PDF,
- Teilnehmerliste PDF,
- einfache Firmenliste,
- einfache Restarbeitenliste,
- einfache Mängelliste.

Nicht Editor 1:

- Firmenkarten,
- Kontaktkarten,
- Personenraster,
- verschachtelte Mängelkarten,
- Tabellen in Tabellen,
- kombinierte Karten-/Tabellenansichten.

---

## 7. Wichtigste Architekturregel

> Der Editor darf niemals den echten UI-/PDF-Laufweg ersetzen.  
> Der Editor erzeugt und speichert nur Layoutwerte.  
> Die echten Tabellen lesen diese Werte separat.  
> Der Editor darf keine echte Tabelle kapern, keinen echten Druckweg kapern und keine echte PDF-Vorschau kapern.

Diese Regel ist für alle Umsetzungsteile verbindlich.

---

## 8. UI/PDF-Annäherung statt automatischer Gleichmachung

Editor 1 soll UI- und PDF-Darstellungen nicht automatisch gleich machen.

Editor 1 berechnet nicht automatisch:

- gleiche Zeilenumbrüche,
- optimale Spaltenbreiten,
- optimale Schriftgrößen,
- automatische UI/PDF-Angleichung,
- automatische Übernahme von UI-Werten nach PDF,
- automatische Übernahme von PDF-Werten nach UI.

Ziel ist eine **manuelle, kontrollierte Kalibrierung**.

Der Entwickler kann je Tabelle und Variante Stellwerte verändern:

- Spaltenbreite,
- Innenabstand,
- Schriftgröße,
- Schriftgewicht,
- Textausrichtung.

Dadurch können UI und PDF optisch angenähert werden.

Verbindliche Klarstellung:

> Editor 1 garantiert keine pixelgenaue Gleichheit zwischen UI und PDF.  
> Editor 1 garantiert keine identischen Zeilenumbrüche.  
> Editor 1 stellt Werkzeuge bereit, damit ein Entwickler die Darstellung manuell annähern kann.

---

## 9. Varianten einer Tabelle

Eine Tabelle kann mehrere Layoutvarianten haben.

Verbindlich getrennt speichern:

- UI,
- PDF Hochformat,
- PDF Querformat.

Diese Varianten gehören fachlich zusammen.

Beispiel:

```text
TOP-Liste
- UI
- PDF Hochformat
- PDF Querformat
```

Es handelt sich nicht um drei getrennte Tabellen, sondern um eine Tabelle mit Varianten.

Jede Variante hat eigene Layoutwerte.

Es gibt keine automatische Synchronisierung zwischen Varianten.

---

## 10. UI/PDF-Vergleich

Editor 1 soll zwischen Arbeitsarten unterscheiden:

- UI bearbeiten,
- PDF Hochformat bearbeiten,
- PDF Querformat bearbeiten,
- UI/PDF vergleichen.

Der Vergleich erfolgt durch Umschalten, nicht zwingend nebeneinander.

Der Vergleich dient der Sichtprüfung durch den Entwickler.

Wenn eine Variante stark geändert wird, darf Editor 1 einen Hinweis geben.

Beispiele:

- „PDF-Variante eventuell prüfen.“
- „UI-Variante eventuell prüfen.“

Keine automatische Angleichung.  
Keine automatische Prüf-Checkliste.  
Keine automatische Korrektur.

---

## 11. Tabellenvertrag als Pflicht

Editor 1 arbeitet nicht direkt an beliebigen DOM-Elementen, CSS-Klassen oder PDF-Ausgabefunktionen.

Jede bearbeitbare Tabelle muss über einen **Tabellenvertrag** angemeldet werden.

Der Tabellenvertrag ist die einzige belastbare technische Grundlage für Editor 1.

Der Tabellenvertrag definiert mindestens:

- stabile `tableKey`,
- stabile `moduleId`,
- menschenlesbaren Kurznamen,
- unterstützte Varianten,
- Spalten mit stabilen `columnKey`,
- technische Standardwerte,
- erlaubte Mindest- und Höchstwerte,
- optionale Zelltypen,
- Version des Vertrags.

Alle gespeicherten Layoutwerte beziehen sich ausschließlich auf:

```text
tableKey + variantKey + columnKey + optional cellTypeKey
```

Zufällige CSS-Klassen, DOM-Reihenfolgen, sichtbare Tabellenüberschriften oder PDF-Textinhalte dürfen niemals als dauerhafte Speicher-Schlüssel verwendet werden.

---

## 12. Mindeststruktur eines Tabellenvertrags

Eine Editor-1-Tabelle besteht mindestens aus:

```text
tableKey
moduleId
shortName
variants[]
columns[]
optional cellTypes[]
defaultLayout je Variante
schemaVersion
```

Eine Spalte besteht mindestens aus:

```text
columnKey
label
defaultWidth
minWidth
maxWidth
defaultPadding
defaultFontSize
defaultFontWeight
defaultAlign
```

Eine Variante besteht mindestens aus:

```text
variantKey
label
medium: ui | pdf
orientation: none | portrait | landscape
```

Erlaubte Standardvarianten:

```text
ui
pdfPortrait
pdfLandscape
```

---

## 13. Stabile Keys und IDs

Der Entwickler soll technische Schlüssel nicht manuell erfinden müssen.

Das System darf beim Registrieren technische IDs erzeugen:

- UUID,
- Tabellen-Key,
- Varianten-ID,
- interne Registry-ID.

Aber:

- einmal vergebene Keys dürfen nicht automatisch geändert werden,
- gespeicherte Layoutwerte dürfen nicht durch Umbenennung verloren gehen,
- menschenlesbare Kurznamen dürfen geändert werden,
- technische Keys bleiben stabil.

Der Kurzname dient nur der Anzeige im Editor.

Der technische Key dient der Speicherung und Zuordnung.

---

## 14. Registrierte Tabellen und Kandidaten

Editor 1 kennt zwei Zustände:

1. **Erkannt, aber noch nicht registriert**
2. **Registriert und bearbeitbar**

Keine weiteren Status in Editor 1:

- nicht „fertig kalibriert“,
- nicht „freigegeben“,
- nicht „in Prüfung“,
- nicht „modulaktiv“.

### 14.1 Registrierte Tabellen

Registrierte Tabellen sind vollständig bekannt:

- technische ID vorhanden,
- stabiler Tabellen-Key vorhanden,
- Kurzname vorhanden,
- Modulbezug vorhanden,
- Varianten bekannt,
- Spalten bekannt,
- dauerhaft bearbeitbar.

### 14.2 Kandidaten

Kandidaten sind Tabellen, die ein Fachmodul als grundsätzlich Editor-1-tauglich meldet, aber die noch nicht endgültig registriert wurden.

Kandidaten sind nicht Ergebnis eines freien App-Scans.

---

## 15. Verbot von App-Scanning und DOM-Raten

Editor 1 darf beim Start nicht:

- die App durchsuchen,
- Module selbstständig öffnen,
- echte UI-Bereiche scannen,
- PDF-Ausgaben scannen,
- Tabellen anhand zufälliger CSS-Klassen erraten,
- Tabellen anhand sichtbarer Überschriften erraten,
- DOM-Strukturen als dauerhafte Wahrheit verwenden.

Stattdessen gilt:

> Kandidaten werden durch Fachmodule oder durch eine ausdrücklich bereitgestellte Kandidatenquelle gemeldet.  
> Editor 1 zeigt nur registrierte Tabellen und gemeldete Kandidaten an.

Diese Regel verhindert, dass Editor 1 wieder in echte UI-/PDF-Laufwege eingreift.

---

## 16. Marker und Metadaten

Für dauerhaft bearbeitbare Tabellen dürfen stabile Marker / Metadaten verwendet werden.

Beispiele:

```html
data-layout-table-key
data-layout-module-id
data-layout-variant
data-layout-cell-type
```

Diese Marker dienen ausschließlich der stabilen Zuordnung.

Sie dürfen nicht als sichtbare Editor-Bedienelemente erscheinen.

Sie dürfen nicht dazu führen, dass der Editor echte UI oder echte PDF-Ausgabe kapert.

Speicherung darf dauerhaft nicht von zufälligen CSS-Klassen abhängen.

---

## 17. Tabellenliste

Editor 1 enthält eine zentrale Tabellenliste.

Diese Liste wird nach Modulen gruppiert.

Beispiel:

```text
Protokoll
- TOP-Liste
- Teilnehmerliste
- ToDo-Liste

Restarbeiten
- Restarbeitenliste

Mängel
- Mängelliste
```

Die Liste enthält:

- registrierte Tabellen,
- gemeldete Kandidaten.

Keine Suchfunktion in Editor 1.

Begründung:

Es gibt nicht sehr viele Tabellen. Der Editor wird selten genutzt. Eine Suchfunktion wäre in Editor 1 unnötiger Ballast.

---

## 18. Registrierung von Kandidaten

Wenn ein Kandidat ausgewählt wird, erscheint zuerst ein Registrierungsdialog.

Der Dialog zeigt:

- vorgeschlagenen Kurznamen,
- Modul,
- unterstützte Varianten,
- Spaltenanzahl,
- technischen Status,
- geplanten Tabellen-Key.

Aktionen:

- Registrieren und bearbeiten,
- Abbrechen.

Nach Registrierung wechselt Editor 1 automatisch in den Bearbeitungsmodus.

Der Mensch kann den Kurznamen bestätigen oder ändern.

Der technische Key wird nicht beliebig manuell geändert.

---

## 19. Registrierung rückgängig machen

Editor 1 bietet eine Funktion:

> Registrierung rückgängig machen

Diese Funktion entfernt nur die Registrierung.

Bereits gespeicherte Layoutwerte werden dabei nicht automatisch gelöscht.

Begründung:

Layoutwerte sollen nicht versehentlich verloren gehen.

Löschen gespeicherter Layoutwerte wäre eine separate, ausdrücklich benannte Funktion und gehört nicht automatisch zur Abmeldung einer Tabelle.

---

## 20. Globale Wirkung

Layoutwerte gelten global.

Eine eingestellte Tabelle sieht überall nach denselben gespeicherten Regeln aus:

- projektübergreifend,
- kundenübergreifend,
- modulweit,
- unabhängig vom konkreten Bauvorhaben.

Keine projektbezogenen Sonderlayouts in Editor 1.

Wenn später projektbezogene Sonderlayouts benötigt werden, ist das ein eigener späterer Auftrag und nicht Teil von Editor 1.

---

## 21. Bearbeitbare Werte

Editor 1 bearbeitet für normale Tabellen nur diese Werte:

- Spaltenbreite,
- Innenabstand,
- Schriftgröße,
- Schriftgewicht,
- Textausrichtung links / mitte / rechts.

Nicht Teil von Editor 1:

- Farben,
- Rahmen,
- Hintergründe,
- Zellhöhe,
- Spezialeffekte,
- bedingte Formatierung,
- Sortierung,
- Filterung,
- Dateninhalt,
- Fachlogik,
- Statuslogik,
- Druckreihenfolge.

---

## 22. Spalten und Zelltypen

Editor 1 arbeitet primär pro Spalte.

Zusätzlich darf Editor 1 Zelltypen innerhalb einer Spalte unterstützen, wenn diese sauber markiert sind.

Beispiel:

```text
Spalte Gegenstand:
- Kurztext
- Langtext
```

Zelltypen werden nicht automatisch geraten.

Sie müssen vom jeweiligen Modul ausdrücklich markiert werden.

Beispiel:

```html
data-layout-cell-type="shortText"
data-layout-cell-type="longText"
```

Wenn Zelltypen zu komplex werden, gehören sie nicht mehr zu Editor 1.

---

## 23. Bedienung der Werte

Editor 1 bietet zwei Bedienarten:

- Plus/Minus-Schritte für schnelles Feintuning,
- direkte Eingabefelder für exakte Werte.

Beispiel:

```text
Breite:       [-] 85 mm [+]
Innen:        [-] 1 mm  [+]
Schrift:      [-] 11 pt [+]
Gewicht:      [-] 500   [+]
Ausrichtung:  links / mitte / rechts
```

Der Editor soll einfach bleiben.

Keine komplexe Layoutsoftware.  
Kein Tabellenbaukasten.  
Kein Excel-Ersatz.

---

## 24. Arbeitszustand

Editor 1 arbeitet mit einem Bearbeitungszustand.

Regel:

- Ändern = sofort in Editor-Vorschau sichtbar,
- Speichern = dauerhaft in App/PDF gültig,
- Abbrechen/Zurück = ungespeicherte Änderungen verwerfen.

Jede kleine Änderung wird nicht sofort dauerhaft gespeichert.

Beim Verlassen mit ungespeicherten Änderungen muss Editor 1 warnen.

Optionen:

- Speichern,
- Verwerfen,
- Abbrechen.

---

## 25. Rückgängig und Reset

Keine einzelne Rückgängig-Funktion in Editor 1.

Stattdessen:

- Abbrechen/Zurück = alle ungespeicherten Änderungen verwerfen,
- Reset ganze Tabelle = zurück auf technischen App-Standard.

Reset betrifft die ganze Tabelle, nicht nur einzelne Spalten.

Der technische App-Standard muss aus dem Tabellenvertrag bzw. den dort definierten Defaultwerten kommen.

Reset darf nicht aus zufälligen aktuellen UI-/PDF-Werten rekonstruiert werden.

---

## 26. Vorschau

Editor 1 arbeitet in einer isolierten Editor-Vorschau.

Die Vorschau darf echte Projektdaten nutzen.

Datenquelle:

- aktuelles Projekt,
- aktuelle Besprechung,
- aktuelle ToDo-Liste,
- aktueller App-Kontext.

Wenn keine echten Daten vorhanden sind:

- Beispieldaten / Beispieltexte verwenden.

Die Vorschau darf nicht die echte TOP-Liste, den echten PDF-Druck oder die echte PDF-Vorschau ersetzen.

---

## 27. Tabellenwahl und Vorschau-Ablauf

Gewünschter Workflow:

1. Editor öffnen.
2. Tabelle aus zentraler Liste wählen.
3. Variante wählen.
4. Editor lädt aktuellen App-Kontext.
5. Wenn echte Daten vorhanden sind: echte Daten verwenden.
6. Wenn keine Daten vorhanden sind: Beispieldaten verwenden.
7. Eine Tabelle bearbeiten.
8. Speichern.
9. Echte UI/PDF nutzt gespeicherte Werte.

Editor 1 bearbeitet immer nur eine Tabelle gleichzeitig.

---

## 28. Beschreibung / Hinweiszeile

Editor 1 zeigt für jede Tabelle eine kurze Hinweiszeile.

Beispiel:

```text
Tabelle: TOP-Liste
Modul: Protokoll
Datenquelle: aktuelle Besprechung
Variante: PDF Hochformat
Status: registriert
```

Diese Hinweiszeile dient der Orientierung.

Sie ist keine Freigabeanzeige und kein Prüfstatus.

---

## 29. Speicherung

Editor 1 bekommt eine eigene Registry für Tabellenregistrierungen.

Die bestehende Layoutwert-Struktur bleibt für Layoutwerte zuständig, sofern sie fachlich und technisch geeignet ist.

Wenn die bestehende Struktur nicht geeignet ist, muss sie kontrolliert erweitert werden.

### 29.1 Editor-1-Registry

Speichert:

- welche Tabellen existieren,
- UUID,
- tableKey,
- Kurzname,
- Modul,
- Varianten,
- Status registriert / Kandidat,
- Vertragsversion.

### 29.2 Layoutwerte

Speichern:

- Spaltenbreite,
- Innenabstand,
- Schriftgröße,
- Schriftgewicht,
- Ausrichtung.

Zuordnung immer über:

```text
tableKey + variantKey + columnKey + optional cellTypeKey
```

---

## 30. Plausibilitätsprüfung

Beim Speichern macht Editor 1 nur einfache Plausibilitätsprüfungen.

Beispiele:

- Breite nicht 0 oder negativ,
- Breite innerhalb definierter Mindest- und Höchstwerte,
- Schriftgröße im sinnvollen Bereich,
- Innenabstand nicht größer als Spaltenbreite,
- Gewicht im sinnvollen Bereich,
- Ausrichtung gültig,
- columnKey existiert im Tabellenvertrag,
- variantKey existiert im Tabellenvertrag.

Keine automatische vollständige PDF-Renderprüfung beim Speichern.

Keine automatische UI/PDF-Gleichheitsprüfung.

Keine automatische Layoutoptimierung.

---

## 31. Startverhalten

Editor 1 zeigt beim Start nur:

- vorhandene registrierte Tabellen,
- bereits gemeldete Kandidaten.

Editor 1 soll beim Start nicht automatisch:

- die App durchsuchen,
- Module öffnen,
- Bereiche scannen,
- Druckwege ausführen,
- PDF-Ausgaben erzeugen,
- Tabellen aus DOM oder PDF erraten.

---

## 32. Vier Umsetzungsteile

Editor 1 wird in vier Teilen umgesetzt.

Jeder Teil ist ein eigener Meilenstein.

Ein späterer Teil darf nur begonnen werden, wenn der vorherige Teil getestet und freigegeben ist.

---

### Teil 1 – Fundament

Ziel:

- technische Grundlage schaffen,
- keine sichtbare Editor-UI,
- kein Eingriff in echte UI/PDF-Laufwege.

Inhalt:

- Registry-Modell,
- Tabellenvertrag,
- Variantenmodell,
- stabile IDs/Keys,
- Defaultwerte,
- Layoutwert-Schema,
- Plausibilitätsfunktionen,
- Tests,
- Dokumentation.

Nicht erlaubt:

- Editorfenster,
- sichtbare Editor-UI,
- Marker in echten Tabellen,
- Toolbar,
- Druckweg ändern,
- PDF-Vorschau ändern,
- TOP-Liste anfassen,
- ToDo-Druckweg ändern,
- Teilnehmerliste ändern,
- echte UI-Laufwege ändern.

---

### Teil 2 – Kandidaten und Registrierung

Ziel:

- gemeldete Kandidaten verwalten,
- Registrierungsprozess bauen.

Inhalt:

- registrierte Tabellen anzeigen,
- gemeldete Kandidaten anzeigen,
- Registrierungsdialog,
- Kurzname bestätigen/ändern,
- UUID automatisch vergeben,
- Registrierung rückgängig machen,
- automatische Übernahme in Bearbeitungsmodus nach Registrierung.

Nicht erlaubt:

- App-Scan,
- DOM-Scan,
- PDF-Scan,
- Kapern echter Tabellen,
- Änderung echter Druckwege.

---

### Teil 3 – Isolierte Editor-Oberfläche

Ziel:

- eigener DEV-only Kalibrier-Arbeitsplatz.

Inhalt:

- Tabelle aus Liste wählen,
- UI / PDF Hochformat / PDF Querformat wählen,
- echte Daten aus aktuellem Kontext laden,
- wenn keine Daten: Beispieldaten,
- eine Tabelle gleichzeitig bearbeiten,
- Spalte/Zelltyp auswählen,
- Breite / Innen / Schriftgröße / Gewicht / Ausrichtung,
- Plus/Minus und Eingabefelder,
- Live-Vorschau,
- Speichern / Abbrechen / Reset ganze Tabelle,
- Warnung bei ungespeicherten Änderungen.

Wichtig:

- keine echte TOP-Liste kapern,
- keinen echten PDF-Druck kapern,
- kein Editor im normalen App-Laufweg.

---

### Teil 4 – Anwendung in echter UI/PDF

Ziel:

- echte UI/PDF liest gespeicherte Werte.

Inhalt:

- gespeicherte Werte wirken in echter UI,
- gespeicherte Werte wirken in echter PDF-Ausgabe,
- keine Marker sichtbar,
- keine Toolbar,
- kein Editor im Druckweg,
- keine Endbenutzerfunktion,
- Hinweis bei starker Abweichung anderer Variante.

Teil 4 darf nur tabellenweise und kontrolliert erfolgen.

Jede Tabelle muss vorher einen Tabellenvertrag haben.

---

## 33. Harte Verbote für alle Teile

Verboten:

- automatische Layoutoptimierung,
- automatische Zeilenumbruchberechnung,
- automatische Gleichsetzung von UI und PDF,
- heimliche Übernahme von Werten zwischen Varianten,
- PDF-Renderprüfung beim Speichern,
- DOM-Scanning als Tabellenquelle,
- CSS-Klassen als dauerhafte Speicher-Keys,
- Druckweg-Kapern,
- echte UI-Kaperung,
- unsichtbare Nebenwirkungen im Normalbetrieb,
- tabellenspezifische Sonderlogik ohne Tabellenvertrag.

---

## 34. Erlaubte Architektur

Erlaubt:

- manuelles Einstellen,
- isolierte Vorschau,
- Speichern je Tabelle und Variante,
- zentrale Registry,
- zentrale Layoutwert-Speicherung,
- stabile Tabellenverträge,
- gemeldete Kandidaten,
- einfache Plausibilitätsprüfung,
- Tests für Registry, Vertrag und Layoutwerte,
- schrittweise Aktivierung echter Tabellen in Teil 4.

---

## 35. Definition of Done für das Konzept

Das Konzept gilt erst dann als umsetzungsreif, wenn diese Fragen eindeutig beantwortet sind:

1. Was ist eine Editor-1-Tabelle?
2. Wie meldet ein Modul eine Tabelle oder einen Kandidaten?
3. Welche Keys sind stabil?
4. Wo werden Registrierungen gespeichert?
5. Wo werden Layoutwerte gespeichert?
6. Welche Varianten gibt es verbindlich?
7. Welche Werte darf Editor 1 bearbeiten?
8. Was darf Editor 1 ausdrücklich nicht?
9. Wie wird verhindert, dass echte UI/PDF gekapert wird?
10. Wie wird verhindert, dass jede Tabelle wieder eine Sonderlösung bekommt?

---

## 36. Professioneller Durchführungsplan nach Konzeptfreigabe

Nach Konzeptfreigabe wird nicht direkt „der Tabelleneditor“ gebaut.

Professionelles Vorgehen:

### Phase A – Architekturanker prüfen

Ziel:

- vorhandene BBM-Struktur lesen,
- vorhandene Layout-/Tabellen-/PDF-Strukturen identifizieren,
- geeigneten Ort für Editor-1-Fundament festlegen,
- keine Änderungen an Produktivlaufwegen.

Ergebnis:

- kurze technische Bestandsaufnahme,
- Entscheidung, wo Registry, Vertrag und Tests liegen.

### Phase B – Fundament bauen

Ziel:

- Tabellenvertrag,
- Registry,
- Variantenmodell,
- Layoutwert-Schema,
- Plausibilitätsfunktionen,
- Tests.

Keine sichtbare UI.

### Phase C – Dummy-/Beispieltabelle anbinden

Ziel:

- Editor-1-Fundament an einer künstlichen Testtabelle prüfen,
- ohne TOP-Liste,
- ohne PDF-Druck,
- ohne echte Module.

### Phase D – Kandidaten/Registrierung

Ziel:

- gemeldete Kandidaten anzeigen,
- Registrierung sauber testen,
- technische Keys stabil halten.

### Phase E – Isolierte Editor-UI

Ziel:

- DEV-only Kalibrierarbeitsplatz,
- Vorschau,
- manuelles Einstellen,
- Speichern/Abbrechen/Reset.

### Phase F – Erste echte Tabelle kontrolliert anschließen

Ziel:

- genau eine echte Tabelle anschließen,
- idealerweise eine einfache Tabelle,
- nicht sofort die schwierigste TOP-/PDF-Strecke.

### Phase G – Weitere Tabellen nur nach Muster

Ziel:

- keine neuen Sonderlösungen,
- jede weitere Tabelle nutzt denselben Tabellenvertrag,
- pro Tabelle kleiner Auftrag,
- Tests bleiben Pflicht.

---

## 37. Empfohlene Werkzeugstrategie

Für die Umsetzung wird nicht ein einziger großer Agentenlauf empfohlen.

Empfohlen wird Rollenaufteilung:

### ChatGPT / Supervisor

Aufgabe:

- Konzept schärfen,
- Architektur prüfen,
- Codex-Aufträge formulieren,
- Ergebnisse bewerten,
- Grenzen kontrollieren,
- Folgepakete schneiden.

### Codex lokal

Geeignet für:

- kleine, kontrollierte Änderungen im lokalen Repository,
- Tests direkt gegen den vorhandenen Arbeitsstand,
- schnelle Reparaturen,
- sehr konkrete Pakete.

### Codex Cloud

Geeignet für:

- isolierte Branch-/PR-Aufträge,
- saubere Paketarbeit auf GitHub,
- Aufgaben, die ohne lokale Sonderumgebung laufen,
- parallele Prüfung durch PR-Diff.

### Alternative Werkzeuge

Andere Coding-Agenten können ergänzend sinnvoll sein, wenn sie das Repository sauber lesen, Dateien ändern und Tests ausführen können.

Sie ersetzen aber nicht den Konzeptvertrag.

Für BBM gilt:

> Nicht der stärkste Agent entscheidet über Erfolg, sondern die kleinste saubere Aufgabe mit harten Grenzen und Testgates.

---

## 38. Kurzfassung des Editor-1-Vertrags

```text
Editor 1 ist ein DEV-only, modulübergreifendes Hilfsmodul für normale Tabellen.

Er bearbeitet:
- echte Tabellen,
- tabellenartige UI-Listen,
- klare Spalten/Zonen,
- optional markierte Zelltypen.

Er bearbeitet nicht:
- Karten,
- verschachtelte Tabellen,
- Personenraster,
- komplexe Sonderlayouts.

Er arbeitet:
- über eine zentrale Tabellenliste,
- mit registrierten Tabellen und gemeldeten Kandidaten,
- mit stabilen Tabellenverträgen,
- mit UUIDs und verständlichen Kurznamen,
- global, nicht projektbezogen,
- getrennt für UI, PDF Hochformat, PDF Querformat,
- mit echten Daten, falls vorhanden,
- sonst mit Beispieldaten.

Er bietet:
- Breite,
- Innenabstand,
- Schriftgröße,
- Schriftgewicht,
- Ausrichtung,
- Live-Vorschau,
- Speichern,
- Abbrechen,
- Reset ganze Tabelle.

Speichern bedeutet:
- dauerhaft gültig,
- echte UI/PDF nutzt Werte,
- kein Export nötig,
- keine zweite Übernahme nötig.

Er garantiert nicht:
- pixelgleiche UI/PDF-Darstellung,
- identische Zeilenumbrüche,
- automatische Layoutoptimierung,
- automatische UI/PDF-Angleichung.

Endbenutzer sehen niemals:
- Editor,
- Marker,
- Toolbar,
- Layoutschalter,
- Kalibrierung.
```

---

## 39. Nächster sinnvoller Schritt

Der nächste Schritt ist noch kein Codex-Auftrag zur Implementierung.

Der nächste Schritt ist:

1. Diese Fassung prüfen.
2. Fehlende fachliche Regeln ergänzen.
3. Danach einen **Projektauftrag Editor 1** formulieren.
4. Erst danach Teil-1-Codex-Auftrag ableiten.

Der erste Codex-Auftrag darf nur **Teil 1 – Fundament** bauen.

Verboten im ersten Codex-Auftrag:

- sichtbare Editor-UI,
- Layout-Toolbar,
- Marker in echten Tabellen,
- TOP-Liste ändern,
- PDF-Druckweg ändern,
- ToDo-Druckweg ändern,
- Teilnehmerliste ändern,
- bestehende Laufwege kapern.

Erlaubt im ersten Codex-Auftrag:

- Registry,
- Tabellenvertrag,
- Variantenmodell,
- Speicherstruktur,
- Plausibilitätslogik,
- Tests,
- Dokumentation.
