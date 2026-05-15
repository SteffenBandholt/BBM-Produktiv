# Settings-Struktur

## Ziel

Die Einstellungen der App sollen so gegliedert sein, dass globale Einstellungen, Hilfsfunktionen und echte Fachmodule fachlich sauber getrennt bleiben.

Wenn spaeter mehrere Module freigeschaltet sind, darf die Settings-Maske nicht zu einer unuebersichtlichen Sammelmaske werden. Stattdessen sollen Einstellungen nach Zweck, Verantwortung und Sichtbarkeit gruppiert sein.

## Grundregeln

- Fachmodule sind eigenstaendige Arbeitsbereiche.
- Hilfsfunktionen unterstuetzen Fachmodule, sind aber keine eigenen Fachmodule.
- Technische Schutzplanken gehoeren nicht in normale Anwender-Einstellungen, sondern in den Entwicklungsbereich.
- Sichtbarkeit richtet sich nach Produktrolle, Lizenz und technischem Modus.
- Neue Settings sollen kleinen, klaren Bereichen zugeordnet werden.
- Bestehende Fachlogik soll nicht still in neue Sammelbereiche verschoben werden.

## Zielstruktur

### 1. Allgemein

- Profil / Adresse
- Lizenzstatus

### 2. Eingabe & Erfassung

- Diktat / Audio
- Transkription
- Audio-Optionen

### 3. Ausgabe & Kommunikation

- Firmenrollen
- Drucksignatur / Footer
- Druckränder / Seitenränder
- Drucklogos
- E-Mail / Versand
- Speicherorte / Ausgabeordner

### 4. Module

- Protokoll
  - Protokollbezeichnung
  - Vorbemerkung
    - Text
    - In Ausgabe drucken

### 5. Entwicklung

- Technik / Diagnose
- TOP-Textgrenzen
- Kopflogo / Mutter-App

## Einordnung

### Diktat / Audio

Diktat / Audio ist eine Hilfsfunktion. Es unterstuetzt die Erfassung, ist aber kein eigenstaendiges Fachmodul.

### Druck / PDF / E-Mail

Druck, PDF, E-Mail, Versand und Ausgabeordner gehoeren zusammen in den Bereich `Ausgabe & Kommunikation`.

### Firmenrollen

Firmenrollen sind Teil der Ausgabe- und Druckkonfiguration und gehoeren nicht in den Modulbereich.

### TOP-Textgrenzen

TOP-Textgrenzen sind technische Schutzplanken. Sie gehoeren in `Entwicklung`.

### Protokoll

`Protokoll` darf nur protokollspezifische Einstellungen enthalten. Alles, was allgemeiner Druck-, Kommunikations- oder Entwicklungszweck ist, gehoert nicht in den Modulbereich.

## Sichtbarkeit

### Kunden-App

- Sie zeigt nur die Einstellungen, die fuer den freigegebenen Produktumfang relevant sind.
- Technische Schutzplanken bleiben in der Regel verborgen oder nur eingeschraenkt sichtbar.
- Modulspezifische Inhalte erscheinen nur, wenn das jeweilige Modul freigeschaltet ist.

### Mutter-App / Entwicklung

- Die Mutter-App darf Diagnose-, Entwicklungs- und Verwaltungsbereiche sichtbar machen.
- Technische Schutzplanken sind dort erlaubt und gewollt.
- Der Entwicklungsbereich darf weitergehende Werkzeuge enthalten, solange sie klar von Fachmodulen getrennt bleiben.

## Was nicht passieren darf

- Keine grosse Sammelmaske, in der alle Einstellungen ungeordnet vermischt werden.
- Keine Vermischung von Fachmodul, Hilfsfunktion und Diagnose.
- Keine technische Schutzplanke im normalen Fachmodulbereich.
- Keine modulfremden Druck- oder Kommunikationsoptionen im Protokoll-Modul.
- Keine neue Struktur, die nur optisch getrennt ist, fachlich aber alles wieder vermischt.
- Keine Umbauten, die vorhandene Druck-v2-/Druckflow- oder Lizenzlogik nebenbei aendern.

## Technisches Zielbild

Als Zielbild soll eine `moduleSettingsRegistry` entstehen, die Settings fachlich zuordnet:

- globale Settings
- Hilfsfunktionen
- Module
- Entwicklung / Schutzplanken

Die Registry soll nur die Zuordnung und Sichtbarkeit beschreiben. Sie soll keine Fachlogik duplizieren und keine neue Plattform- oder Discovery-Architektur werden.

## Modul-, Feature- und Lizenzregel

### Fachmodule

- Fachmodule sind eigenstaendige Arbeitsbereiche der App.
- Aktuell ist `Protokoll` das fachliche Beispiel fuer ein Modul.
- Fachmodule muessen sauber an- und abschaltbar sein.
- Ist ein Fachmodul deaktiviert, darf es nicht mehr als sichtbare Projektkachel-Aktion erscheinen.
- Ein Projektklick oder Start aus `HomeView` darf dann nicht blind in das Modul fuehren.
- Statt eines kaputten Screens muss ein strukturierter `blocked`-Payload zurueckkommen.
- Abhaengige Ausgabe-, Mail- und PDF-Wege muessen in diesem Fall sauber blockieren.

### Hilfsfunktionen / Features

- Hilfsfunktionen sind keine eigenstaendigen Arbeitsmodule.
- `Diktat / Audio` ist das aktuelle Beispiel fuer eine Hilfsfunktion.
- Eine App nur mit Diktat ergibt fachlich keinen eigenstaendigen Arbeitsbereich.
- Hilfsfunktionen unterstuetzen aktive Fachmodule.
- Hilfsfunktionen koennen separat freigeschaltet oder gesperrt werden.
- `Diktat / Audio` gehoert in den Settings-Bereich `Eingabe & Erfassung`.

### Ausgabe & Kommunikation

- `Ausgabe & Kommunikation` ist moduluebergreifende Infrastruktur.
- Dazu gehoeren Druck, PDF, E-Mail / Versand, Archiv, Firmenrollen, Drucklogos, Footer / Drucksignatur, Drucklayout / Seitenraender und Speicherorte / Ausgabeordner.
- Diese Dinge gehoeren nicht exklusiv zum Modul `Protokoll`.
- Sie duerfen von mehreren Bereichen genutzt werden, solange die Fachabgrenzung sauber bleibt.

### Lizenzbau

- Lizenzen werden extern gebaut.
- Die normale App enthaelt keinen sichtbaren Lizenzgenerator und keine externe Lizenzverwaltung.
- In der App bleiben nur Lizenzstatus, Freischaltungsanzeige und saubere Reaktionen auf gesperrte Module oder Features.
- Admin- und Generatorfunktionen gehoeren nicht in die normale Settings-uebersicht.

### Kurzregel

- Module steuern Arbeitsbereiche.
- Features steuern Zusatzfaehigkeiten.
- Ausgabe & Kommunikation ist gemeinsame Infrastruktur.
- Lizenzen werden extern erzeugt.
- Die App zeigt nur den Status und reagiert sauber auf Freischaltung.

## Umsetzungsreihenfolge in kleinen Paketen

1. Zielstruktur dokumentieren und Bezeichnungen vereinheitlichen.
2. Sichtbare Settings-Kacheln / Bereiche nach Zweck ordnen.
3. Protokoll-spezifische Einstellungen in den Modulbereich ziehen.
4. Ausgabe-, Kommunikations- und Hilfsfunktionen sauber abgrenzen.
5. Entwicklung und technische Schutzplanken in einen klaren Bereich legen.
6. Spaetere Module nur noch ueber dieselbe Struktur aufnehmen.

## Leitsatz

Die Settings sollen fachlich lesbar bleiben: allgemein, Hilfsfunktion, Modul oder Entwicklung. Nichts davon soll verdeckt ineinanderlaufen.
