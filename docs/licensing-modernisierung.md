# Lizenzverwaltung – Zielarchitektur

## Rollen

- **DEV-Version:** besitzt den administrativen Lizenzbereich und darf einmalig eine eigene kaufmännische Vollversion mit `license_admin` erzeugen.
- **Eigene kaufmännische Vollversion:** darf BBM-Lizenzen für Kunden erzeugen, aber `license_admin` nicht weiterdelegieren.
- **Normale Kundeninstallation:** sieht die Kachel **Lizenzen** nicht.

## Kunden

Lizenzkunden sind keine getrennten Personen/Firmen mehr. Sie verwenden den zentralen BBM-Firmenstamm und erhalten zusätzlich die Firmenverwendung `license_customer`.

Die bisherige Tabelle `license_customers` bleibt vorerst ausschließlich als Kompatibilitätsschicht bestehen, weil vorhandene Lizenzdatensätze darauf referenzieren. Alte Lizenzkunden werden beim Zugriff in den zentralen Firmenstamm übernommen.

## Produkte und Adapter

Die Lizenztechnik ist produktneutral. BBM ist der erste registrierte Produktadapter (`product = bbm`). Ein späteres eigenständiges Programm kann einen eigenen Adapter registrieren, ohne Teil von BBM zu sein.

Der BBM-Adapter kennt aktuell:

- Module: `protokoll`, `restarbeiten`, `rechnung`
- Zusatzfunktion: `diktat`
- administratives Sonderrecht: `license_admin`

## Signierung

Der private Schlüssel gehört nicht ins Repository und nicht in eine normale Kundeninstallation.

Der Aussteller löst ihn in dieser Reihenfolge auf:

1. Umgebungsvariable `BBM_LICENSE_PRIVATE_KEY_PATH`
2. lokaler administrativer Speicher unter `userData/license-admin/private_key.pem`

Die UI erhält weder Schlüsselinhalt noch Schlüsselpfad. Im Renderer wird nur angezeigt, ob der Signaturdienst eingerichtet ist.

## Lizenzoberfläche

Die kaufmännische Oberfläche zeigt nur die benötigten Angaben:

- Kunde / zentrale Firma
- Produkt
- Test oder Vollversion
- Testdauer bzw. Ablaufdatum
- Gerätebindung Ja/Nein
- Machine-ID bei Bindung
- Anzahl Geräte
- Module
- Zusatzfunktionen
- Notiz

Technische Werte wie Schema-Version, Produkt-Payload, Signatur und interne Lizenz-ID werden im Hintergrund verarbeitet.

## Rechnungen

Die Lizenzverwaltung enthält keine Rechnungslogik. Verkauf und Abrechnung von Lizenzen/Modulen erfolgen über das BBM-Modul **Rechnung**. Kunden- und Firmendaten bleiben dadurch gemeinsam nutzbar.
