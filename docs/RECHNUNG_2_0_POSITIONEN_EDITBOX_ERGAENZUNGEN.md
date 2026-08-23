# Rechnung 2.0 – Ergänzungen Positionen / Editbox

Stand: 23.08.2026
Branch: `rechnung-entwicklung`

Diese Ergänzungen sind fachlich verbindlich. Sie erweitern den bestehenden Rechnung-2.0-Stand, ohne die bereits festgelegte UI-Grundstruktur oder bestehende Editorentscheidungen grundsätzlich zu verändern.

## 1. Positionstyp „Text“

- In der Bearbeitungs-Editbox bleibt der Positionstyp `Text` sichtbar und auswählbar.
- In der sichtbaren Rechnungsdarstellung wird die Bezeichnung `Text` vor dem eigentlichen Text nicht ausgegeben.
- Der Inhalt erscheint als freier LV-Text ohne zusätzliches Präfix oder Typ-Label.
- Beim Positionstyp `Hinweis` bleibt die sichtbare Kennzeichnung `Hinweis` erhalten.
- Die Änderung betrifft Darstellung, nicht die interne Typisierung der Position.
- Die strukturierte interne Datenhaltung bleibt davon unberührt.

## 2. Kleine Summenanzeige in der festen Positions-Editbox

In der festen Positions-Editbox wird zusätzlich eine kompakte, nicht bearbeitbare Summenanzeige vorgesehen.

Anzuzeigen sind:

- Gesamt Netto
- MwSt.
- Gesamt Brutto

Beispiel:

```text
Gesamt Netto      8.400,00 €
+ 19 % MwSt.      1.596,00 €
Gesamt Brutto     9.996,00 €
```

Regeln:

- reine Anzeige, nicht editierbar
- läuft bei Änderungen an Menge, EP, NEP und sonstigen summenrelevanten Positionswerten unmittelbar mit
- NEP-Positionen werden nicht eingerechnet
- Titel-, Text- und Hinweispositionen werden nicht eingerechnet
- die vorhandene Rechnungsberechnung bleibt einzige Berechnungsquelle
- keine zweite unabhängige Summenlogik innerhalb der UI
- bei später mehreren MwSt.-Sätzen muss die Anzeige aus dem zentralen Summenmodell gespeist werden und darf keine feste 19-%-Sonderlogik enthalten
- die Anzeige dient nur der Arbeitsübersicht in der Editbox und verändert keine Rechnungswerte

## 3. Zielkalkulation

In der festen Positions-Editbox wird fachlich ein Button `Zielkalkulation` vorgesehen.

Die Zielkalkulation ist keine reine Layoutfunktion, sondern eine eigene Fachfunktion zur kontrollierten Anpassung von Einheitspreisen.

### 3.1 Ziel

Der Anwender gibt einen gewünschten Endpreis für die Rechnung vor.

Für Step 1 gilt als Ziel-Endpreis standardmäßig der Bruttogesamtpreis der Rechnung.

BBM ermittelt daraus die erforderlichen neuen Einheitspreise der einbezogenen Leistungspositionen.

### 3.2 Grundprinzip der Gewichtung

- vorhandene Mengen bleiben unverändert
- vorhandene Einheitspreis-/Gesamtpreisverhältnisse bilden die Gewichtung
- Positionen mit höherem Anteil am bisherigen Rechnungswert erhalten entsprechend höheren Anteil am Zielpreis
- die relativen Wertanteile der einbezogenen Leistungspositionen bleiben grundsätzlich erhalten
- die Einheitspreise werden daraus neu ermittelt

Beispiel:

```text
Pos. 1: 2.000 € Anteil 20 %
Pos. 2: 3.000 € Anteil 30 %
Pos. 3: 5.000 € Anteil 50 %

Bisher gesamt: 10.000 €
Ziel:           12.000 €

Neue Verteilung:
Pos. 1 → 2.400 €
Pos. 2 → 3.600 €
Pos. 3 → 6.000 €
```

### 3.3 Einbezogene und ausgeschlossene Positionen

Einbezogen werden normale preiswirksame Leistungspositionen.

Nicht einbezogen werden:

- NEP-Positionen
- Titelpositionen
- Textpositionen
- Hinweispositionen

Die Mengen werden durch die Zielkalkulation nicht verändert.

### 3.4 MwSt. / Bruttoziel

Das eingegebene Ziel bezieht sich auf den Bruttogesamtpreis.

Die Zielkalkulation muss das bestehende zentrale Steuer- und Summenmodell verwenden. Bei mehreren MwSt.-Sätzen darf die Logik nicht mit einer pauschalen 19-%-Rückrechnung arbeiten, sondern muss aus den vorhandenen positionsbezogenen Steuersätzen den korrekten Zielzustand ermitteln.

### 3.5 Rundung

- Einheitspreise müssen auf die im Rechnungsmodell zulässige Genauigkeit gerundet werden.
- Rundungsdifferenzen müssen kontrolliert behandelt werden.
- Die Summe nach Zielkalkulation soll den gewünschten Zielbetrag innerhalb der zulässigen Rundungsgenauigkeit tatsächlich erreichen.
- Ein stilles Verteilen von Restdifferenzen ohne nachvollziehbare Regel ist nicht zulässig.

### 3.6 Vorschau und Übernahme

Vor einer Preisänderung wird eine Vorschau gezeigt.

Mindestens sichtbar:

- bisheriger Rechnungsbetrag
- Zielbetrag
- bisheriger EP je betroffener Position
- neuer EP je betroffener Position
- bisheriger GP je betroffener Position
- neuer GP je betroffener Position
- daraus resultierende Netto-/MwSt.-/Bruttosummen

Erst nach ausdrücklicher Bestätigung werden die neuen Einheitspreise in den Entwurf übernommen.

Abbruch der Vorschau verändert keine Rechnungsdaten.

### 3.7 Status- und Buchungsgrenze

- Zielkalkulation ist ausschließlich bei bearbeitbaren Entwürfen zulässig.
- Gebuchte/finalisierte Rechnungen dürfen dadurch nicht verändert werden.
- Auftragsgebundene Rechnungen benötigen vor Freigabe der Zielkalkulation eine gesonderte fachliche Entscheidung, da dort Vertrags-/Auftrags-Einheitspreise betroffen sein können.
- Diese Frage wird nicht innerhalb dieser Ergänzung vorweggenommen.

## 4. UI-Editor-Abgrenzung

- Die zusätzlichen sichtbaren UI-Bestandteile sollen entsprechend dem Rechnung-2.0-UI-Grundsatz registrierbar und layoutseitig adressierbar sein.
- Die Fachaktion `Zielkalkulation` selbst bleibt wie andere Domain-Aktionen gegen fachliche Ausführung durch den UI-Editor gesperrt.
- Der UI-Editor darf Darstellung, Größe, Position und Sichtbarkeit im zulässigen Rahmen beeinflussen, aber keine Preise berechnen oder Rechnungsdaten verändern.

## 5. Umsetzungseinordnung

Diese Ergänzungen sind für die weitere Rechnung-2.0-Entwicklung verbindlich.

Sie lösen keine Neuentwicklung der bestehenden Rechnung-UI aus. Die bereits registrierte und führende Rechnungserstellung (`RechnungScreen` / `_sheetEditor()`) bleibt Grundlage.

Vor Umsetzung der Zielkalkulation ist die konkrete Rechenregel für Rundung und Restdifferenzen technisch zu spezifizieren und mit Tests abzusichern.
