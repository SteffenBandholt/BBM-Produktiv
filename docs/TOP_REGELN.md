# TOP-Regeln

## Ampellogik

Status hat Vorrang:
- blockiert -> blaue Ampel
- verzug -> rote Ampel
- erledigt -> grüne Ampel
- offen / in arbeit ohne Fälligkeitsdatum -> keine Ampel
- offen / in arbeit mit Fälligkeitsdatum:
  - fällig oder überfällig -> rot
  - 1 bis 10 Tage Rest -> orange
  - mehr als 10 Tage Rest -> grün

## Darstellung erledigter TOPs

Wenn status = erledigt:
- Kurztext grau
- Langtext grau
- Ampel grün
- TOP bleibt bearbeitbar, solange die Besprechung offen ist
- erledigt gewinnt gegen wichtig:
  - erledigt + wichtig = grau, nicht rot

Wenn status von erledigt auf einen anderen Status geändert wird:
- Text wird wieder normal/schwarz
- completed_in_meeting_id wird geleert
- TOP läuft wieder normal weiter

## completed_in_meeting_id

Wenn ein TOP in einem Protokoll auf erledigt gesetzt wird:
- completed_in_meeting_id = aktuelle meeting_id

Wenn ein TOP von erledigt zurück auf offen / in arbeit / blockiert / verzug gesetzt wird:
- completed_in_meeting_id wird geleert

## Übernahme erledigter TOPs

Ein erledigter TOP wird genau noch einmal in das direkt folgende Protokoll übernommen.

Beispiel:

Protokoll 2:
- TOP wird erledigt
- completed_in_meeting_id = Protokoll 2
- TOP sichtbar und grau

Protokoll 3:
- TOP wird noch einmal übernommen
- TOP sichtbar und grau
- completed_in_meeting_id bleibt Protokoll 2
- completed_in_meeting_id darf NICHT auf Protokoll 3 umgeschrieben werden

Protokoll 4:
- Wenn der TOP in Protokoll 3 weiterhin erledigt war, wird er nicht mehr übernommen
- Dadurch erscheint er in der normalen Arbeitsliste nicht mehr
- Der TOP wird nicht gelöscht
- Es wird nichts renummeriert
- Historie bleibt erhalten

## Keine Datenlöschung

Beim Ausblenden erledigter Alt-TOPs gilt:
- kein DELETE
- kein removed_at
- kein is_trashed
- kein Entfernen historischer Daten
- keine Renummerierung
- keine TopGapFlow-Änderung

## Arbeitsliste / Historie / PDF

Normale Arbeitsliste:
- zeigt aktive TOPs
- zeigt erledigte TOPs im Erledigungsprotokoll und im direkt folgenden Protokoll grau
- zeigt erledigte TOPs danach nicht mehr

Historie / vorhandene Protokolle:
- bleiben unverändert

PDF / Alle TOPs:
- darf nicht versehentlich die Arbeitslisten-Ausblendung übernehmen
- Änderungen daran nur bewusst und separat
