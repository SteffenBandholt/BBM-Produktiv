# BBM-Firmenmodell

## Grundsatz

BBM kennt zwei bewusst getrennte Firmenwelten:

1. zentrale Stammfirmen im Firmenstamm `firms`
2. lokale Projektfirmen in `project_firms`

Eine lokale Projektfirma gilt nur in genau einem Projekt. Sie erscheint nicht automatisch im zentralen Firmenstamm.

Eine zentrale Stammfirma ist projektuebergreifend verfuegbar und kann einem oder mehreren Projekten zugeordnet werden.

## Anlegen

### Firma innerhalb eines Projekts

Wird eine Firma innerhalb eines Projekts angelegt, entsteht immer eine lokale Projektfirma in `project_firms`.

Typische Faelle sind einmalige Projektbeteiligte wie Nutzergruppen, Lehrerkollegien oder andere nur fuer dieses Projekt relevante Organisationen.

### Firma ueber den Firmenstamm

Wird eine Firma ueber `Firmen` in der Sidebar angelegt, entsteht eine zentrale Stammfirma in `firms`.

Diese Firma kann danach einem oder mehreren Projekten zugeordnet werden.

## Projektbezug zentraler Firmen

Die Zuordnung einer zentralen Firma zu einem konkreten Projekt erfolgt ueber:

`project_global_firms(project_id, firm_id, ...)`

Eine zentrale Firma bleibt dabei ein einzelner Stammdatensatz und wird nicht pro Projekt kopiert.

## Projektfirma in Firmenstamm uebernehmen

Eine lokale Projektfirma kann bewusst ueber die Aktion `In Firmenstamm uebernehmen` in eine zentrale Stammfirma ueberfuehrt werden.

Dabei gilt:

1. aus den Daten der Projektfirma wird eine zentrale Firma angelegt
2. die zentrale Firma erhaelt die Verwendung `project_participant`
3. lokale Ansprechpartner der Projektfirma werden in die zentrale Personenwelt uebernommen
4. die neue zentrale Firma wird dem aktuellen Projekt ueber `project_global_firms` zugeordnet
5. erst nach erfolgreicher Uebernahme werden lokale Ansprechpartner und die lokale Projektfirma entfernt
6. bei einer bereits vorhandenen gleichnamigen Stammfirma wird die automatische Uebernahme gestoppt, damit keine Dublette entsteht

Die Uebernahme ist eine bewusste Nutzeraktion und geschieht nicht automatisch.

## Personen / Ansprechpartner

### Lokale Projektfirma

Ansprechpartner einer lokalen Projektfirma liegen in `project_persons` und gehoeren nur zu dieser Projektfirma in diesem Projekt.

### Zentrale Stammfirma

Ansprechpartner einer zentralen Stammfirma liegen in `persons` und referenzieren die Stammfirma ueber `firm_id`.

Bei einer Uebernahme der Projektfirma in den Firmenstamm werden ihre lokalen Ansprechpartner in zentrale Ansprechpartner ueberfuehrt.

## Verwendungen zentraler Stammfirmen

Zentrale Firmen koennen mehrere Verwendungen besitzen:

- `project_participant` – als Projektteilnehmer verwendbar
- `invoice_customer` – als Rechnungskunde / kaufmaennischer Geschaeftspartner verwendbar

Eine zentrale Firma kann damit sein:

- nur Projektteilnehmer
- nur Rechnungskunde
- Projektteilnehmer und Rechnungskunde

Die Verwendungen werden nicht ueber `role_code` abgebildet. `role_code` bleibt eine separate fachliche Bestandslogik.

## Lizenzabhaengige Verwendung Rechnungskunde

Die Verwendung `invoice_customer` wird in der Oberflaeche nur angeboten und angezeigt, wenn das Modul Rechnung lizenziert ist.

Beim Anlegen einer zentralen Firma gilt:

- kein Rechnungsmodul: standardmaessig Projektteilnehmer
- nur Rechnungsmodul: standardmaessig Rechnungskunde
- Rechnungsmodul plus projektbezogene Module: aktive Auswahl zwischen Projektteilnehmer, Rechnungskunde oder beidem

Bereits gespeicherte Rechnungs-Verwendungen werden durch eine fehlende Rechnungslizenz nicht geloescht, sondern nur nicht angeboten bzw. angezeigt.

## Technische Verwendungsablage

Mehrfach-Verwendungen zentraler Firmen werden in `firm_usages` abgelegt:

- `firm_id`
- `usage_code`
- Zeitstempel

Primaerschluessel ist `(firm_id, usage_code)`.

## Kaufmaennische Vorgaenge

Angebot, Auftrag und Rechnung referenzieren spaeter eine zentrale Stammfirma als Geschaeftspartner bzw. Rechnungskunde.

Ein Projekt ist dabei optional. Kaufmaennische Vorgaenge erzwingen keine Projektzuordnung.

## Verbindliche Ordnung

- `firms` = zentrale Stammfirmen
- `persons` = zentrale Ansprechpartner zentraler Stammfirmen
- `firm_usages` = Mehrfach-Verwendungen zentraler Stammfirmen
- `project_global_firms` = Zuordnung zentraler Stammfirma zu einem Projekt
- `project_firms` = lokale Firmen, die nur in einem Projekt existieren
- `project_persons` = lokale Ansprechpartner einer Projektfirma

Damit bleibt der zentrale Firmenstamm schlank, waehrend einmalige Projektbeteiligte trotzdem sauber innerhalb eines Projekts verwaltet werden koennen.
