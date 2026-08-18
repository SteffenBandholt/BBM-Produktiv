# TOP-Regeln

## Fachvertrag: unabhängige TOP-Kennzeichnungen

Beschluss, ToDo und Wichtig sind drei voneinander unabhängige persistierte Kennzeichnungen. Die Ampel ist davon vollständig unabhängig, aber kein gespeicherter TOP-Kennzeichnungszustand. Diese Regel gilt für UI, PDF und PDF-Editor.

- Die Ampel wird ausschließlich über den Quicklane-Button „Ampel“ ein- oder ausgeschaltet.
- Beschluss darf den Ampelzustand niemals verändern oder die Ampel ausblenden.
- ToDo darf den Ampelzustand niemals verändern oder die Ampel ausblenden.
- Beschluss und ToDo dürfen gleichzeitig gesetzt und gleichzeitig sichtbar sein.
- Wichtig erzeugt kein eigenes Symbol, sondern färbt ausschließlich den TOP-/Titeltext rot.
- Wichtig beeinflusst Ampel, Beschluss und ToDo nicht.
- Bei Beschluss und ToDo werden beide Symbole gleichzeitig rechts nebeneinander in der Reihenfolge Beschluss, ToDo dargestellt.
- Bei normalen TOPs bleiben Ampel, Beschluss und ToDo gleichzeitig sichtbar.
- Titel beziehungsweise Level-1-TOPs besitzen weiterhin grundsätzlich keine Ampel.
- Bei übernommenen schwarzen TOPs und Titeln bleiben B/T/W sichtbar, ihre Schalter sind jedoch deaktiviert.
- Der Beschluss-Filter liest ausschließlich `is_decision`, der ToDo-Filter ausschließlich `is_task`; gemeinsam gekennzeichnete TOPs erscheinen in beiden Filtern.

Eine Priorisierung oder Ausschlusslogik zwischen diesen Zuständen ist unzulässig. Die A–G-Kombinationen werden für normale TOPs vollständig und für Titel mit der verbindlichen Ausnahme „keine Ampel“ durch den UI-Integrationstest und durch `PDF-V2-PROT-011` mit den M85-Fixtures p49 und p50 abgesichert.

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
