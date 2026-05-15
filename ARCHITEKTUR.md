# BBM Architektur

## Grundsatz

BBM ist die Core-App. Fachmodule sind Arbeitsbereiche innerhalb eines Projekts.

Die App muss immer starten können, auch wenn kein Fachmodul freigeschaltet ist.

## Core-Navigation

Die feste Hauptnavigation der App ist:

- Start
- Projekte
- Firmen
- Einstellungen
- Hilfe

Diese Bereiche gehören zum Core und dürfen nicht von Fachmodulen oder einer Protokoll-Lizenz abhängig sein.

## Einstellungen

Unter Einstellungen liegen Core-Funktionen:

- Nutzereinstellungen
- Druckeinstellungen
- Lizenzstatus / Lizenzimport
- Entwicklung im Entwicklerstand
- Adminbereich als Hinweis auf externe Lizenz-App

Druckeinstellungen, Logos, Header, Footer, Seitenränder und Nutzerdaten gehören zum Core.
Sie gehören nicht zum Modul Protokoll.

## Projekte als Arbeitsmittelpunkt

Die fachliche Arbeit läuft über Projekte.

Ein Projekt kann Arbeitsbereiche enthalten:

- Protokoll
- Restarbeiten
- Mängel
- weitere spätere Fachmodule

Fachmodule erscheinen innerhalb eines geöffneten Projekts, nicht in der Core-Navigation.

## Protokoll-Modul

Das Protokoll ist ein Fachmodul.

Es darf Core-Funktionen nutzen:

- Projekte
- Firmen
- Nutzerdaten
- Druckeinstellungen
- Drucksystem
- Lizenzstatus

Es darf diese Core-Funktionen aber nicht besitzen oder deren Sichtbarkeit steuern.

## Lizenzierung

Die Lizenz schaltet Fachmodule und Features frei.

Beispiele:

- Modul: protokoll
- Modul: restarbeiten
- Modul: maengel
- Feature: diktat

Die Lizenz darf Fachmodule sperren, aber nicht den Core-Start verhindern.

Ohne freigeschaltetes Modul muss BBM trotzdem starten und folgende Bereiche anzeigen:

- Start
- Projekte
- Firmen
- Einstellungen
- Lizenzstatus / Lizenzimport

## Drucksystem

Das Drucksystem ist Core.

Module liefern Inhalte.
Der Core liefert Druckrahmen, Druckeinstellungen, Logos, Header, Footer und Seitenränder.

## UI-Regeln

BBM ist eine klassische Arbeits-App.

Keine Kachelwand als Hauptbedienung.
Keine Fachmodule in der linken Core-Navigation.
Keine versteckten Core-Funktionen hinter Modul-Lizenzen.
Keine großen SettingsView-Komplettumbauten nebenbei.

## Arbeitsregel für Änderungen

Ein Pull Request darf immer nur eine Sache ändern.

Nicht mischen:

- Lizenzierung
- Drucksystem
- Settings
- Projektmodule
- UI-Grundstruktur

Wenn Core-Bereiche geändert werden, müssen Start, Projekte, Firmen und Einstellungen danach weiter funktionieren.
