# PDF-Editor – UI als verbindliche Baseline

Stand: 2026-08-18
Status: verbindliche Gestaltungs- und Bedienregel für BBM-PDFs

## Grundsatz

Die BBM-Oberfläche (UI) gibt die gestalterische Baseline für die zugehörige PDF vor.

Die PDF soll die fachliche und visuelle Anordnung der UI grundsätzlich wiedergeben. Abweichungen sind nur dort zulässig, wo das Papierformat, die Seitenränder, der Seitenumbruch, die Paginierung oder andere zwingende Druckanforderungen eine Anpassung verlangen.

Der PDF-Editor ist **kein Werkzeug zum nachträglichen Nachbauen der UI**. Er dient ausschließlich dem **Feintuning** einer bereits sinnvollen PDF-Baseline.

Kurzform:

`UI -> PDF-Baseline -> PDF-Editor-Feintuning`

Nicht zulässig ist:

`UI -> abweichende PDF -> Nutzer muss PDF im Editor erst nachbauen`

## Verbindliche Folgen

1. **UI ist Ausgangsdesign**
   - Fachlich gleiche sichtbare Elemente sollen in UI und PDF erkennbar gleich angeordnet sein.
   - Reihenfolge, Gruppierung und visuelle Zuordnung sollen sich an der UI orientieren.

2. **PDF darf nur druckbedingt abweichen**
   - Papierformat und nutzbare Seitenfläche,
   - Seitenränder,
   - Paginierung und Seitenumbruch,
   - notwendige Verdichtung oder Wiederholung von Tabellenköpfen,
   - sonstige nachgewiesene Druckzwänge.

   Diese Abweichungen dürfen nicht als Vorwand für ein grundsätzlich anderes PDF-Layout dienen.

3. **PDF-Editor macht nur Feintuning**
   Typische zulässige Feinarbeiten sind:
   - Position geringfügig korrigieren,
   - Schriftgröße feinjustieren,
   - Sichtbarkeit ein-/ausschalten,
   - Textposition innerhalb eines Containers anpassen,
   - Spaltengrenzen innerhalb der gültigen Seitenfläche feinjustieren,
   - druckbedingte Abstände korrigieren.

4. **Feintuning bleibt PDF-spezifisch**
   Eine Änderung im PDF-Editor verändert die BBM-UI nicht.
   Die UI bleibt die Baseline; das gespeicherte PDF-Profil beschreibt nur die bewusste PDF-Abweichung davon.

5. **Eigenständige sichtbare Fachelemente müssen erreichbar sein**
   Jedes sichtbare Element, das der Nutzer sinnvoll separat feinjustieren können soll, muss als eigenes verständlich benanntes PDF-Editor-Ziel registriert sein.

   Beispiele:
   - Red Flag / Wichtig-Kennzeichnung,
   - Statuspunkt,
   - Seitennummer / Seitenwert,
   - Tabellenüberschrift,
   - Titel,
   - Datum,
   - Verantwortlicher.

   Technische Sammelcontainer dürfen ein solches Fachelement nicht unnötig unzugänglich machen.

6. **Container und Kind bleiben logisch getrennt**
   - Wird ein Container bzw. eine Tabellenspalte bearbeitet, folgt die komplette zugehörige Struktur.
   - Wird bewusst ein Kind wie eine Überschrift oder ein Symbol ausgewählt, darf nur dieses Kind feinjustiert werden.

7. **Seitenfläche bleibt harte Grenze**
   Das PDF-Feintuning darf die durch Papierformat und Seitenränder definierte nutzbare Fläche nicht überschreiten. Wer darüber hinausgehen will, muss zuerst die Seitenränder ändern.

8. **Vorschau und Produkt-PDF müssen identisch reagieren**
   Nach dem Speichern eines PDF-Feintunings müssen Editor-Vorschau, normale Vorschau und erzeugte Produkt-PDF denselben gespeicherten Layoutzustand verwenden.

## Beispiel: Red Flag

Ist die Red Flag in der UI fachlich dem Titel zugeordnet und dort rechts angeordnet, soll die PDF-Baseline diese Zuordnung grundsätzlich übernehmen.

Eine abweichende Standardposition der Red Flag in der PDF ist nur zulässig, wenn ein konkreter Druckzwang dies erfordert.

Soll die Red Flag im Druck anschließend leicht anders stehen, wird sie als eigenes PDF-Editor-Ziel ausgewählt und nur für die PDF feinjustiert.

## Entwicklungsregel für Codex und manuelle Arbeiten

Bei jeder Änderung einer PDF-Baseline gilt vor einer Editor-Sonderlösung:

1. UI-Ausgangsanordnung bestimmen.
2. Prüfen, ob die PDF-Baseline diese Anordnung bereits sinnvoll übernimmt.
3. Abweichungen nur mit konkretem Druckgrund zulassen.
4. Erst danach PDF-Editor-Feintuning vorsehen.
5. Keine neue PDF-Sonderanordnung bauen, wenn die UI bereits die richtige fachliche Struktur vorgibt.

## Abnahmekriterium

Eine PDF-Baseline ist erst fachlich akzeptabel, wenn sie ohne Nutzer-Feintuning bereits eine sinnvolle druckbare Abbildung der UI darstellt.

Der PDF-Editor darf anschließend Komfort und Feinarbeit ermöglichen, aber nicht Voraussetzung dafür sein, dass die PDF überhaupt wie BBM aussieht.
