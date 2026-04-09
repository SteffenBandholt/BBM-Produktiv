# ARCHITECTURE.md

## Zweck

Diese Datei ist die verbindliche Architekturgrundlage für BBM.

Sie legt fest, wie die App strukturell gedacht ist, damit neue Chats, neue Entwickler oder neue KI-/Codex-Läufe die Architektur nicht immer wieder neu interpretieren.

Diese Datei beschreibt das Zielbild und die festen Leitplanken.
Sie ist kein Arbeitsprotokoll und kein Detailregelwerk einzelner Fachbereiche.

---

## Zielbild

BBM wird zu einer modularen App-Plattform ausgebaut.

Die App soll so aufgebaut sein, dass sie:

- nur mit dem Modul `Protokoll` laufen kann
- nur mit dem Modul `Restarbeiten` laufen kann
- mit mehreren Modulen parallel laufen kann
- später mit weiteren Modulen erweitert werden kann

Das Modul `Protokoll` ist damit nicht das Zentrum der Gesamtarchitektur, sondern ein Fachmodul unter mehreren.

---

## Grundprinzip der Architektur

Die App trennt sich in vier klar unterscheidbare Bereiche:

1. App-Kern
2. Gemeinsame Domänen / Stamm
3. Gemeinsame Dienste / Addons
4. Fachmodule

Diese Trennung ist verbindlich.

---

## 1. App-Kern

Der App-Kern enthält alles, was unabhängig von einem konkreten Fachmodul gebraucht wird.

Dazu gehören insbesondere:

- App-Start und Bootstrap
- App-Shell / Grundlayout
- Modulregistrierung
- Navigation-Grundgerüst
- Screen-Host / Routing-Grundmechanik
- globaler Projektkontext
- globale App-Einstellungen
- Lizenzierung
- gemeinsame technische Dienstschnittstellen

Der App-Kern darf keine unnötige Fachlogik einzelner Module enthalten.

Insbesondere gehören nicht in den App-Kern:

- TOP-Regeln
- Protokoll-Abschlusslogik
- Restarbeiten-Fachlogik
- modulinterne Spezialdialoge
- modulinterne Bearbeitungslogik

---

## 2. Gemeinsame Domänen / Stamm

Gemeinsame Domänen enthalten fachliche Grundlagen, die von mehreren Modulen genutzt werden.

Dazu gehören voraussichtlich:

- Firmen
- Mitarbeiter / Beteiligte
- Projekte
- weitere gemeinsame Stammdaten

Diese Bereiche gehören nicht in ein einzelnes Fachmodul, wenn sie modulübergreifend benötigt werden.

---

## 3. Gemeinsame Dienste / Addons

Gemeinsame Dienste liefern technische oder modulübergreifende Fähigkeiten.

Dazu gehören voraussichtlich:

- Mailversand
- Drucken
- PDF-Infrastruktur
- Export
- Diktat / Whisper
- weitere technische Zusatzfunktionen

Wichtig:

Die technische Fähigkeit gehört in gemeinsame Dienste.
Die fachliche Inhaltserzeugung bleibt im jeweiligen Fachmodul.

Beispiel:

- wie ein PDF erzeugt, gespeichert oder gedruckt wird = gemeinsamer Dienst
- welche Daten im Protokoll-PDF stehen = Modul `Protokoll`
- welche Daten in einer Restarbeiten-Ausgabe stehen = Modul `Restarbeiten`

Gemeinsame Dienste sind keine Fachmodule.

---

## 4. Fachmodule

Fachmodule enthalten konkrete fachliche Arbeitslogik.

Beispiele:

- `Protokoll`
- `Restarbeiten`
- `Mängelmanagement`
- weitere spätere Module

Ein Fachmodul enthält insbesondere:

- Screens
- Komponenten
- modulinterne Dialoge
- Domain-Logik
- State
- ViewModels
- modulinterne Datenzugriffe
- fachliche Regeln
- modulbezogene Ausgabeinhalte

Fachlogik bleibt in Fachmodulen.

---

## Das Modul `Protokoll`

`Protokoll` ist ein Fachmodul.

Es enthält die gesamte Protokoll-Fachlichkeit, insbesondere:

- Protokollübersichten
- Protokollverwaltung
- Teilnehmerbezug im Protokollkontext
- TOP-/Protokollregeln
- Abschlusslogik
- protokollbezogene Ausgabe
- den Arbeitsscreen für die Protokollerstellung

### Rolle von `TopsScreen`

`TopsScreen` ist **nicht** das Modul `Protokoll`.

`TopsScreen` ist nur ein Screen innerhalb des Moduls `Protokoll`, genauer:
der Arbeitsscreen für die Protokollerstellung.

Diese Unterscheidung ist verbindlich.

Es gilt also:

- `TopsScreen` = Screen
- `Protokoll` = Fachmodul
- `Restarbeiten` = anderes Fachmodul
- BBM = App-Plattform, die Fachmodule trägt

---

## Das Modul `Restarbeiten`

`Restarbeiten` ist ein eigenes Fachmodul.

Es darf nicht als Unterbereich des Moduls `Protokoll` gedacht oder gebaut werden.

Es soll fachlich und technisch so aufgebaut werden, dass es:

- allein betrieben werden kann
- gemeinsam mit `Protokoll` betrieben werden kann
- dieselben gemeinsamen Domänen und Dienste nutzen kann, ohne in Protokollstrukturen zu hängen

### Fachlicher Schnitt von `Restarbeiten`

`Restarbeiten` umfasst die fachliche Arbeit an offenen Arbeiten, offenen Punkten und deren Nachverfolgung.

Dazu gehören insbesondere:

- eine eigene Übersicht und ein eigener Arbeitsscreen für offene Arbeiten
- die fachliche Sicht auf offene Arbeiten über Projekt- und Protokollgrenzen hinweg
- eigene Filter-, Listen-, Bearbeitungs- und Abschlussregeln für offene Arbeiten
- eigene Ausgabeinhalte für Restarbeiten, soweit sie fachlich nicht Protokollausgabe sind

Nicht zu `Restarbeiten` gehören:

- Protokollkopf, Protokollnummer, Teilnehmerbezug und Protokollabschluss
- TOP-Hierarchie, TOP-Nummerierung und TOP-spezifische Bearbeitungsregeln
- der Protokoll-Arbeitsscreen `TopsScreen` und die konkrete Protokoll-Workbench
- Protokoll-PDF, Protokoll-Mailfluss und andere ausdrücklich protokollbezogene Ausgabeabläufe

`Restarbeiten` darf offene Arbeiten aus dem Protokollkontext nutzen oder ableiten,
ist aber fachlich nicht nur eine Unteransicht des Moduls `Protokoll`.

### Abgrenzung zu gemeinsamen Bausteinen

Außerhalb von `Restarbeiten` bleiben ausdrücklich:

- gemeinsamer Bearbeitungskern wie Editbox-Kern, generische Zustandslogik und wiederverwendbare Metafeldbausteine
- gemeinsame Domänen wie Projekte, Firmen und Mitarbeiter/Beteiligte
- gemeinsame Dienste wie Mail, Druck, PDF-Infrastruktur und Diktat/Whisper
- App-Kern, Router, Shell, Modulkatalog, Screen-Auflösung und modulbezogene Navigation

`Restarbeiten` nutzt diese Bausteine, besitzt aber eigene Fachregeln, eigene fachliche Screens und eigene Arbeitsabläufe.

---

## Wiederverwendbare Bearbeitungsbausteine

Die App darf gemeinsame Bearbeitungsmuster und gemeinsame Kernbausteine besitzen.

Dabei gilt verbindlich:

- wiederverwendet werden sollen Kernbausteine
- nicht wiederverwendet werden soll fachmodulspezifische Bearbeitungslogik als versteckter Standard für andere Module

### Einordnung der heutigen Editbox / Workbench-Idee

Die heutige Bearbeitungsfläche im `TopsScreen` ist nicht als Ganzes ein allgemeiner App-Baustein.

Sie besteht aus drei Ebenen:

1. **generischer Kern**
   - Textbearbeitung
   - Zustandslogik
   - Counter / Textregeln
   - Meta-Slot-Prinzip

2. **wiederverwendbare Fachkernfelder**
   - Verantwortlich
   - Status / Fertig-bis / Ampel
   - ggf. weitere allgemeine Metafelder

3. **modulspezifische Workbench-Logik**
   - TOP-spezifische Aktionen
   - TOP-spezifische Draft-Struktur
   - TOP-spezifische Regeln
   - TOP-spezifische Meta-Kopplung

### Verbindliche Konsequenz

- generische Editbox-Bausteine bleiben in gemeinsamen Kernbereichen
- wiederverwendbare Metafelder bleiben in gemeinsamen Kernbereichen
- modulspezifische Workbenches bleiben in den Fachmodulen

Das bedeutet:

- das Bedienmuster darf wiederverwendet werden
- die Fachlogik darf nicht einfach aus einem Modul ins andere kopiert werden

Beispiel:

- Modul `Protokoll` → eigene `ProtokollWorkbench`
- Modul `Restarbeiten` → eigene `RestarbeitenWorkbench`

Nicht gewollt ist, dass die heutige TOP-Workbench stillschweigend zum globalen Standard für alle späteren Module wird.

---

## Modul-Sicht auf die App

Die App ist nicht mehr als „Protokoll-App mit Anbauten“ zu verstehen.

Die richtige Sicht ist:

- Die App trägt Fachmodule.
- Fachmodule nutzen gemeinsame Grundlagen.
- Fachmodule sind fachlich getrennt.
- Gemeinsame Infrastruktur bleibt außerhalb der Fachmodule.

---

## Zielstruktur

Die Zielstruktur der Anwendung folgt dieser Grundordnung:

```text
src/
  main/
    app/
    ipc/
    services/
    settings/
    licensing/

  renderer/
    app/
      bootstrap/
      shell/
      navigation/
      routing/
      context/
      modules/

    stamm/
      firmen/
      mitarbeiter/
      projekte/

    addons/
      mail/
      print/
      pdf/
      whisper/
      export/

    modules/
      protokoll/
        screens/
        components/
        domain/
        data/
        state/
        viewmodel/
        dialogs/
        rules/

      restarbeiten/
        screens/
        components/
        domain/
        data/
        state/
        viewmodel/
        dialogs/
        rules/

      weitere-module/

    ui/
      components/
      overlays/
      layout/

    shared/
      utils/
      date/
      text/
      validation/

    core/
      editbox/
      responsible/
      status-ampel/
      textregeln/
      weitere-kernbausteine/
