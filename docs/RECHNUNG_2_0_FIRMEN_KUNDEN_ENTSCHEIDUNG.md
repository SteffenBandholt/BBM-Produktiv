# Rechnung 2.0 – Verbindliche Firmen-/Kundenentscheidung

Stand: 23.08.2026
Branch: `rechnung-entwicklung`

## Entscheidung

Für BBM | Rechnung gilt die zentrale BBM-Firmenarchitektur als verbindliche Grundlage.

Eine Firma existiert im zentralen Firmenstamm genau einmal.

Davon getrennt sind ihre Rollen und projektbezogenen Verwendungen.

## Rollen und Verwendungen

Eine zentrale Firma kann insbesondere folgende Verwendungen haben:

- Rechnungskunde (`invoice_customer`)
- Projektteilnehmer (`project_participant`)

Diese Verwendungen schließen sich nicht aus.

Damit sind insbesondere folgende Fälle zulässig:

1. Firma ist nur Rechnungskunde.
2. Firma ist nur Projektteilnehmer.
3. Firma ist Rechnungskunde und Projektteilnehmer.
4. Firma ist in einem oder mehreren Projekten als Projektfirma zugeordnet und zugleich Rechnungskunde.
5. Firma ist Rechnungskunde, ohne jemals einem Projekt zugeordnet zu sein.

## Projektfirmen bleiben erhalten

Die projektbezogene Firmenlogik bleibt ausdrücklich erhalten.

Protokoll und Restarbeiten arbeiten weiterhin mit den Firmen, die dem jeweiligen Projekt zugeordnet sind.

Eine Projektfirma ist dabei kein eigener, konkurrierender Firmenstammsatz, sondern eine projektbezogene Zuordnung bzw. Verwendung einer zentralen Firma.

Globale und projektbezogene Verwendung müssen daher technisch unterscheidbar bleiben, ohne dieselbe reale Firma doppelt als Stammdatensatz anzulegen.

## Bedeutung für Rechnung

Die Rechnung darf keine eigene oder konkurrierende Kundendatenbank führen.

Rechnungskunden werden aus dem zentralen Firmenstamm ausgewählt. Voraussetzung für die Auswahl als Rechnungskunde ist die entsprechende Verwendung/Rolle `invoice_customer`.

Ob diese Firma zusätzlich Projektteilnehmer ist oder in einem konkreten Projekt als Projektfirma verwendet wird, ist davon unabhängig.

Ein projektbezogener Rechnungsbezug darf die zentrale Firmenidentität nicht ersetzen.

## Snapshot-Regel

Beim Buchen einer Rechnung wird ein unveränderlicher Kundensnapshot in der Rechnung gespeichert.

Spätere Änderungen am zentralen Firmenstamm oder an Projektzuordnungen dürfen eine bereits gebuchte Rechnung nicht verändern.

## Abgrenzung zur bisherigen Rechnung-Entwicklung

Die bisherige technische Unterscheidung im Rechnungsmodell zwischen eigenständigen Referenzarten wie `global_firm` und `project_firm` ist nicht das verbindliche Zielmodell.

Sie darf nur als Migrations-/Kompatibilitätsschicht bestehen bleiben, soweit dies zur sicheren Übernahme vorhandener Entwürfe oder Bestandsdaten erforderlich ist.

Das Zielmodell ist die stabile zentrale Firmen-ID plus separate Rollen/Verwendungen und optionaler Projektbezug.

## Nicht Teil dieser Entscheidung

Diese Entscheidung verändert noch nicht:

- PDF
- ZUGFeRD
- Storno/Gutschrift
- Zielkalkulation
- UI-Design
- Angebot/Auftrag

Sie legt ausschließlich die verbindliche fachliche Grundlage für die Firmen-/Kundenintegration von Rechnung 2.0 fest.
