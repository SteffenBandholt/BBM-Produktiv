# BBM-Firmenmodell

## Grundsatz

Eine Firma existiert in BBM genau einmal im zentralen Firmenstamm `firms`.

Projekte, Protokoll, Restarbeiten, SiGeKo und kaufmaennische Vorgaenge legen keine eigenen Kopien derselben Firma an. Sie referenzieren die zentrale Firma.

## Verwendungen / Rollen

Eine Firma kann gleichzeitig mehrere Verwendungen haben. Fuer den ersten verbindlichen Stand gelten:

- `project_participant` – Firma kann als Projektteilnehmer verwendet und Projekten zugeordnet werden.
- `invoice_customer` – Firma kann als Rechnungskunde / kaufmaennischer Geschaeftspartner verwendet werden.

Eine Firma kann damit sein:

- nur Projektteilnehmer
- nur Rechnungskunde
- Projektteilnehmer und Rechnungskunde

Die Verwendungen werden nicht ueber das vorhandene Feld `role_code` abgebildet. `role_code` bleibt Bestandslogik fuer fachliche Sortierung/Rollen und hat eine andere Bedeutung.

## Projektbezug

Die Zuordnung einer zentralen Firma zu einem konkreten Projekt ist eine eigene Relation:

`project_global_firms(project_id, firm_id, ...)`

Die Projektzuordnung ist nicht dasselbe wie die allgemeine Verwendung `project_participant`:

- `project_participant` sagt: Die Firma darf/funktioniert als Projektteilnehmer.
- `project_global_firms` sagt: Die Firma ist diesem konkreten Projekt zugeordnet.

Eine Firma kann mehreren Projekten zugeordnet sein.

## Personen / Mitarbeiter

Personen gehoeren ebenfalls in die zentrale Personenwelt `persons` und referenzieren eine zentrale Firma ueber `firm_id`.

Projektbezogene Teilnehmerzustande (z. B. anwesend, Verteiler, aktiv in einem Projekt) sind Beziehungen bzw. Zustandsdaten des Projekts/Protokolls und keine Kopien der Person.

## Legacy-Bestand

Die Tabellen `project_firms` und `project_persons` enthalten historische lokale Projektkopien. Diese Daten werden in diesem Umbau nicht geloescht.

Verbindliche Migrationsregel:

1. Bestehende lokale Projektfirmen bleiben lesbar, bis sie sicher migriert wurden.
2. Neue Firmen werden nur noch im zentralen Firmenstamm angelegt.
3. Neue Projektzuordnungen verwenden `project_global_firms`.
4. Lokale Projektfirmen werden schrittweise einer zentralen Firma zugeordnet bzw. in den zentralen Stamm ueberfuehrt.
5. Erst nach erfolgreicher Datenmigration und Referenzumstellung duerfen `project_firms` / `project_persons` entfernt werden.

## Kaufmaennische Vorgaenge

Angebot, Auftrag und Rechnung referenzieren spaeter die zentrale Firma als Geschaeftspartner/Rechnungskunde.

Ein Projekt ist dabei optional. Die Firma ist nicht "im Projekt" gespeichert, nur weil ein kaufmaennischer Vorgang auf dasselbe Projekt verweist.

## Technische Verwendungsablage

Mehrfach-Verwendungen werden in `firm_usages` abgelegt:

- `firm_id`
- `usage_code`
- Zeitstempel

Primaerschluessel ist `(firm_id, usage_code)`. Dadurch kann eine Firma mehrere Verwendungen gleichzeitig besitzen, ohne doppelte Firmenstammsaetze zu erzeugen.
