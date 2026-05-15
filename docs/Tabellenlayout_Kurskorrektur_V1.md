# Tabellenlayout - Kurskorrektur V1

Stand: 14.05.2026  
Projekt: BBM-Produktiv / Tabellenlayout / Mini-Kalibrator  
Status: verbindliche Kurskorrektur vor weiteren Arbeiten

---

## 1. Warum diese Kurskorrektur existiert

Der bisherige Gedanke eines grossen Editor-1-Neubaus ist fuer das eigentliche Ziel zu schwer.

Das eigentliche Ziel ist nicht ein grosser Tabelleneditor.

Das eigentliche Ziel ist:

```text
Tabellenspalten sollen zentral, eindeutig und ohne Kleinklein im Code in Breite, Padding und Schriftwerten steuerbar sein.
```

Der Nutzer soll spaeter nicht mehr per Codex-Prompt an verstreuten CSS-, UI- und PDF-Stellen arbeiten muessen.

---

## 2. Neue Zielrichtung

Nicht mehr primaer:

```text
Editor 1 als grosses Hilfsmodul bauen.
```

Sondern:

```text
Tabellen layoutfaehig machen.
Spaltenbreiten zentral steuerbar machen.
Neue Tabellen von Anfang an mit Layoutvertrag bauen.
Einen kleinen DEV-only Tabellen-Kalibrator nur als Komfort darueber setzen.
```

---

## 3. Was bleibt von den bisherigen Leitplanken

Diese Regeln bleiben verbindlich:

- keine automatische DOM-Erkennung,
- keine automatische PDF-Erkennung,
- keine Tabellen aus CSS-Klassen raten,
- keine echte TOP-Liste als erster Versuch,
- keine echte PDF-Ausgabe kapern,
- keinen Druckweg umbauen,
- keine Sonderlogik pro Tabelle,
- eine Tabelle pro Paket,
- Tests oder pruefbare Nachweise,
- Stop bei Unsicherheit.

---

## 4. Was gestrichen oder deutlich verschoben wird

Fuer V1 gestrichen oder auf spaeter verschoben:

- Kandidatensystem,
- Registrierungsdialog,
- automatische Tabellenfindung,
- komplexe Editor-Architektur,
- grosse Editor-UI als erster Meilenstein,
- Drag-and-drop,
- Suchfunktion,
- Zelltypen als Pflicht,
- UI/PDF-Gleichmacher,
- automatische Layoutoptimierung.

---

## 5. Neue Hauptregel

```text
Keine neue oder umgebaute Tabelle ohne Layoutvertrag.
```

Ein Layoutvertrag definiert mindestens:

- `tableKey`,
- Anzeigename,
- Varianten: `ui`, `pdfPortrait`, `pdfLandscape`, soweit vorhanden,
- stabile `columnKey` je Spalte,
- sichtbare Spaltenreihenfolge,
- Defaultbreiten,
- Mindest- und Hoechstbreiten,
- Padding,
- Schriftgroesse.

---

## 6. Zielbild fuer Breiten-Aenderungen

Spaeter soll eine Aenderung so eindeutig sein:

```text
Tabelle: protokoll_tops
Variante: pdfPortrait
Spalte: kurztext
Aenderung: +10 mm
```

Dann wird genau ein zentraler Layoutwert geaendert.

Nicht mehr erlaubt:

- Breite in CSS suchen,
- Breite im PDF-Code suchen,
- Breite im Renderer verstreut suchen,
- UI und PDF an unterschiedlichen Stellen nachziehen,
- Spalte per sichtbarer Reihenfolge raten.

---

## 7. Vorgehen fuer bestehende Tabellen

Bestehende produktive Tabellen werden nicht komplett neu gebaut.

Sie werden schrittweise layoutfaehig gemacht:

1. Ist-Zustand erfassen.
2. Spalten mit stabilen `columnKey` benennen.
3. Aktuelle Breiten als Defaultwerte uebernehmen.
4. Zentrale Layoutquelle anbinden.
5. UI/PDF liest Werte aus zentraler Quelle.
6. Test oder Sichtnachweis ergaenzen.
7. Keine optische Aenderung als Nebeneffekt.

Grundsatz:

```text
Erst Verhalten erhalten, dann Steuerbarkeit ermoeglichen.
```

---

## 8. Vorgehen fuer neue Tabellen

Neue Tabellen werden von Anfang an layoutfaehig gebaut.

Pflicht:

- `tableKey`,
- `columnKey` je Spalte,
- Variantenwerte,
- zentrale Defaults,
- keine verstreuten Breitenwerte im Renderer,
- kein spaeteres Nachruesten als Normalfall.

---

## 9. Mini-Kalibrator V1

Ein Mini-Kalibrator ist nur Komfort.

Er darf erst kommen, wenn mindestens eine echte Tabelle erfolgreich zentral layoutfaehig ist.

V1-Funktionen:

- bekannte Tabelle auswaehlen,
- Variante auswaehlen,
- Spaltenbreite aendern,
- optional Padding und Schriftgroesse aendern,
- speichern,
- resetten.

Nicht V1:

- Tabellen suchen,
- Tabellen registrieren,
- DOM scannen,
- PDF scannen,
- Layout automatisch optimieren,
- TOP/PDF gleichzeitig umbauen.

---

## 10. Naechste konkrete Reihenfolge

1. Tabellenlayout-Inventar V1 erstellen.
2. Erste Pilot-Tabelle festlegen.
3. Zentrale Layoutquelle fuer bekannte Tabellen einfuehren.
4. Erste einfache Tabelle layoutfaehig machen.
5. Beweisen: eine Spalte wird ueber einen zentralen Wert breiter.
6. Erst danach Mini-Kalibrator V1 bauen.
7. TOP/PDF erst nach bewiesenem Muster anschliessen.

---

## 11. Harte Stop-Regel

Wenn ein Auftrag wieder in Richtung grosser Editor, automatische Erkennung oder direkte TOP/PDF-Kaperung geht, wird gestoppt.

Dann gilt:

```text
STOPP: Ziel zu gross oder falscher Einstieg.
Zurueck zu: Tabelle layoutfaehig machen, zentrale Werte, eine Tabelle pro Paket.
```