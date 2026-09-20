# Drei Besprechungsreihen im Projekt

Basis: origin/main / 0a91ca8c, 15.09.2026. Arbeitsbranch feature/project-meeting-series. Kein Commit, Merge oder Push. Auftrag ist eine zusammenhängende Funktion; keine allgemeine Modularisierung.

## Entscheidung vor Umsetzung

Identität: (project_id, series_key), feste Schlüssel construction, owner, planning. Meetings und TOP-Stammsätze erhalten series_key mit construction als historischem Default. Projekte erhalten meeting_series_mask (1 construction, 2 owner, 4 planning), Default 1. Migration transaktional, wiederholbar, ohne Änderungen an bisherigen IDs, Nummern, Inhalten oder Status. Projektweiten Offen-Index und Startbereinigung ersetzen; widersprüchliche offene Altdaten melden statt automatisch schließen. Vorgänger ausschließlich innerhalb der Reihe und vor der aktuellen Nummer. Keine Firmen-/Personenkopien. Fehlender Bauherr bleibt NULL.

Archive erhalten meetingSeriesSchemaVersion=1 unabhängig vom vorhandenen Gesamtformat. Markerlose Archive werden construction zugeordnet. Beziehungen vor dem Import validieren. Dateien erhalten technische Reihen-/Meetingkennung vor frei wählbaren Titeln; Legacy-Dateisuche nur construction und ohne unbestimmte Mehrfachtreffer.

## UI-/PDF-Entwurfsentscheidung

A: UI und PDF. B: neue UI-Bereiche editorfähig ja; PDF benutzt unveränderte bestehende V2-Ziele. Keine neuen Tabellen, Spalten, Layoutprofile oder PDF-Dokumenttypen.

Vollständige Komponenten: bbm.projektverwaltung.meetingSeries (Scope projektverwaltung.meetingSeries) und bbm.projektverwaltung.meetingSeriesEntry (Scope projektverwaltung.meetingSeriesEntry). IDs/refKeys sind die folgenden deklarierten IDs, nie Fachdatensatzwerte. Aktivierung Single-Refs, Einstieg Multi-Refs (wiederholte Kacheln), optionale Buttons mit whenVisibleInstances. Alle sichtbaren Ziele editable=true; Reihenfolge wie unten, visible=true bedeutet deklarierte Sichtbarkeit bei vorhandener Instanz.

| ID | Name | Typ / Rolle / Zusatz | Parent | Order |
|---|---|---|---|---|
| projektverwaltung.meetingSeries | Besprechungsarten | root / scopeRoot | NULL | 0 |
| projektverwaltung.meetingSeries.heading | Besprechungsarten | label / content | projektverwaltung.meetingSeries | 1 |
| projektverwaltung.meetingSeries.construction | Baubesprechungen | fieldGroup / layout | projektverwaltung.meetingSeries | 2 |
| projektverwaltung.meetingSeries.construction.label | Baubesprechungen | label / content | projektverwaltung.meetingSeries.construction | 3 |
| projektverwaltung.meetingSeries.construction.input | Baubesprechungen | field / dataFieldLayout / checkbox | projektverwaltung.meetingSeries.construction | 4 |
| projektverwaltung.meetingSeries.owner | Bauherrenbesprechungen | fieldGroup / layout | projektverwaltung.meetingSeries | 5 |
| projektverwaltung.meetingSeries.owner.label | Bauherrenbesprechungen | label / content | projektverwaltung.meetingSeries.owner | 6 |
| projektverwaltung.meetingSeries.owner.input | Bauherrenbesprechungen | field / dataFieldLayout / checkbox | projektverwaltung.meetingSeries.owner | 7 |
| projektverwaltung.meetingSeries.planning | Planungsbesprechungen | fieldGroup / layout | projektverwaltung.meetingSeries | 8 |
| projektverwaltung.meetingSeries.planning.label | Planungsbesprechungen | label / content | projektverwaltung.meetingSeries.planning | 9 |
| projektverwaltung.meetingSeries.planning.input | Planungsbesprechungen | field / dataFieldLayout / checkbox | projektverwaltung.meetingSeries.planning | 10 |
| projektverwaltung.meetingSeriesEntry | Protokollreihen-Einstieg | root / scopeRoot | NULL | 0 |
| projektverwaltung.meetingSeriesEntry.construction | Baubesprechungen | button / domainActionLayout / openProtocolSeries | projektverwaltung.meetingSeriesEntry | 1 |
| projektverwaltung.meetingSeriesEntry.owner | Bauherrenbesprechungen | button / domainActionLayout / openProtocolSeries | projektverwaltung.meetingSeriesEntry | 2 |
| projektverwaltung.meetingSeriesEntry.planning | Planungsbesprechungen | button / domainActionLayout / openProtocolSeries | projektverwaltung.meetingSeriesEntry | 3 |
| projektverwaltung.meetingSeriesEntry.construction.history | Baubesprechungen Historie | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeriesEntry | 4 |
| projektverwaltung.meetingSeriesEntry.owner.history | Bauherrenbesprechungen Historie | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeriesEntry | 5 |
| projektverwaltung.meetingSeriesEntry.planning.history | Planungsbesprechungen Historie | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeriesEntry | 6 |

C: data-ui-inspector-id=id; data-ui-editor-kind=type der obigen M83-Klassifizierung (root/fieldGroup/label/field/button); data-ui-editor-label=name; data-ui-editor-parent=Parent (Root leer); data-ui-editor-editable=true; data-ui-editor-ops=allowedOps. Produktionsbindung über bestehenden M83/M80-Ref-Weg. Auswahlart layoutZone/group/label/field/button. Baselines x/y=0, Schrift=12, sichtbare Standardgröße aus echter Komponente; Grenzen 8–2400px Breite, 8–1600px Höhe, Schrift 6–32. Operationseffekte Root=layoutZone, Gruppe=groupWithChildren, Einzelziel=elementOnly.

AllowedOps pro Ziel: move, resizeWidth, resizeHeight, setVisibility; Label/Feld/Button zusätzlich textResize. LockedOps pro Ziel: executeTargetAction, modifyDomainData, createRecord, deleteRecord. Fachliches Umschalten/Öffnen/Speichern/Anlegen/Löschen/Upload/Import/Export/Autosave/IPC/DB bleiben ausgeschlossen. Parent existiert jeweils selbst als Ziel. Bauherr nutzt vorhandenen vollständigen Vertrag; keine Neubestandsregistrierung angrenzender Legacy-UI.

D/E: Fachaktionen keine Editorziele; reale deklarierte Parentstruktur und explizite Ref-Auflösung, keine DOM-Erkennung. F: vorhandener Legacy-Vertragscheck ergänzend; M83-Komponenten- und Mounted-Ref-Prüfung erforderlich, neue fachliche Prüfungen noch zu ergänzen.

PDF: bestehender GlobalHeader, FullHeader, MiniHeader und Trennlinie; protokollspezifischer Body unverändert. Besprechungsart bleibt Fachkontext, Dokumenttyp Protokoll. Betroffene Nachweise PDF-V2-SATZ-002/003/004/013/015/016 und PDF-V2-PROT-001/003/004/006. Keine gewollte Satz-/Layoutänderung. Seitenzahlen und Strukturhashes gegen vorhandene Goldens vergleichen; bekannte Baselineabweichungen separat berichten.

## Meilensteine

1. Datenmodell/Migration, Nummerierung, TOP-Grenzen und Teilnehmerfortführung isoliert prüfen.
2. Projektformular, optionaler Bauherr, direkte Kachelbuttons, History/Read-only und Editorrefs.
3. Reihengetrennte Folgetermine und vollständiger Protokollablauf.
4. PDF/Mail/Dateisuche, projektweite Auswertungen, Export-/Import-Rundlauf.
5. Automatisierte Regressionen und Windows-Electron-Abnahme mit echten Komponenten/App-Styles.

Abbruch: widersprüchliche Verträge, Datenverlustgefahr, neue Abhängigkeiten oder Nebenumbau. Native Computersteuerung einmal geprüft: native pipe nicht vorhanden. Technische Electron-Abnahme plus isolierten manuellen Start liefern.

## Abschluss der Meilensteine

Präzisierung des Attributnachweises: Der vorhandene M83/M80-Adapter schreibt den katalogisierten Typ direkt in `data-ui-editor-kind`, wie beim bestehenden Bauherr-Vertrag. Die anfangs genannte Legacy-Kurzform frame/single wurde in der Entscheidung entsprechend präzisiert; keine Adapter- oder Klassifizierungsänderung. Der Legacy-Self-Test prüft seine eigenen Beispiele, die aktuellen Ziele werden durch M83-/Mounted-Ref-Prüfungen abgesichert.

- M1: Daten-/Migrationsnachweis erweitert auf 10/10, einschließlich echter ALTER-/Index-Rollbacks, historischer Teilnehmerflags und Erledigungsreferenzgrenzen.
- M2: produktive Projekt-Hüllen, optionaler Bauherr und unmittelbare lizenzgeprüfte Kachelbuttons; neue Vertragsgruppen 4/4 und tatsächliche Ref-/Layoutprüfung grün.
- M3: vollständige Folgetermin-Meta und autoritativer Read-only-Status bis zum produktiven Screen/CloseFlow; Reparaturen erneut geprüft.
- M4: ZIP 6/6, Ausgabe 9/9 und echtes Legacy-Repo-DTO 1/1; reale PDFs/Mailanhänge eindeutig, Protokoll-Goldens 25/25 unverändert.
- M5: Windows-Electron-Ablauf mehrfach vollständig grün; gezielte Regressionen 252/260 mit acht bestätigten Bestandsfehlern, M85 wie HEAD 18/22. Isolierter manueller Start bereit.

Technischer Auftrag abgeschlossen. Fachliche Nutzerabnahme offen; kein Commit/Merge/Push. Vollständige Ergebnisse, Grenzen, Dateiübersicht und Startbefehl: `PROJEKT_BESPRECHUNGSREIHEN_PRUEFBERICHT.md`.
