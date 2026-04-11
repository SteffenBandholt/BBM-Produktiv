# ARCHITECTURE.md

## Zweck

Diese Datei beschreibt die **fuehrende Zielarchitektur** des Modularumbaus.

Sie haelt fest:
- welches Endziel erreicht werden soll
- welche strukturellen Leitplanken dauerhaft gelten
- welche grobe Zielordnung zwischen App-Kern, gemeinsamen Bereichen und Fachmodulen gilt

Diese Datei ist **kein** Tagesstatus, **kein** Detailplan und **kein** Git- oder Arbeitsmodus-Handbuch.

---

## 1. Architekturziel

BBM wird schrittweise zu einer **modularen App** umgebaut.

Das Ziel ist:
- die App kann mit einem, mehreren oder spaeter anderen Fachmodulen laufen
- `Protokoll` ist ein Fachmodul
- `Restarbeiten` ist ein eigenes Fachmodul
- der App-Kern bleibt fuer Host-, Navigations- und Aktivierungsaufgaben zustaendig
- gemeinsame Kernbausteine, gemeinsame Domaenen und gemeinsame Dienste bleiben ausserhalb der Fachmodule

Der Umbau erfolgt:
- konservativ
- paketweise
- ohne unnoetige Grossumbauten
- ohne kuenstliche Plattformmechanik

---

## 2. Zielbild des modularen Betriebs

Der modulare Umbau dient nicht nur saubererer Code-Struktur, sondern einem klaren Betriebsziel.

Die App soll kontrolliert mit unterschiedlichem aktivem Modulumfang laufen koennen.

Insbesondere bedeutet das:
- Betrieb nur mit `Protokoll`
- Betrieb nur mit `Restarbeiten`
- Betrieb mit `Protokoll` und `Restarbeiten` zusammen
- spaetere Erweiterbarkeit auf weitere Module, ohne den Kern kuenstlich zur Plattform auszubauen

Die Aktivierung von Modulen erfolgt nicht ueber beliebige UI-Schalter, sondern ueber die fachlich vorgesehene Freigabelogik, insbesondere ueber Lizenz- oder Produktfreigaben.

Wichtig:
- nicht freigegebene Module sollen im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sein
- Router, Navigation, Modul-/Screen-Aufloesung und Moduleinstiege muessen sich am aktiven freigegebenen Modulumfang orientieren
- die dafuer noetige Aktivierungslogik gehoert in den App-Kern und den Modulrahmen
- die Fachlogik selbst bleibt in den Modulen

---

## 3. Zielstruktur

Die Zielstruktur trennt sich in diese Bereiche:

### 3.1 App-Kern / Modulrahmen
Hier liegen:
- Router / Shell
- Modulkatalog
- Modul-/Screen-Aufloesung
- modulbezogene Navigation
- Aktivierungslogik freigegebener Module

### 3.2 Gemeinsame Domaenen / gemeinsame Dienste / gemeinsame Kernbausteine
Hier liegt, was mehreren Modulen oder dem Bearbeitungskern dient, ohne selbst Fachmodul zu sein.

Dazu koennen insbesondere gehoeren:
- gemeinsame Domaenen wie Firmen, Projekte, Mitarbeiter/Beteiligte, wenn sie moduluebergreifend gebraucht werden
- gemeinsame Dienste / Addons wie Mail, Drucken, PDF, Export, Whisper
- wiederverwendbare Bearbeitungskerne und neutrale Feldbausteine

### 3.3 Fachmodule
Aktuell relevante Fachmodule:
- `Protokoll`
- `Restarbeiten`

Diese bleiben fachlich getrennt.

`TopsScreen` ist **nicht** das Modul `Protokoll`, sondern nur der Arbeitsscreen fuer die Protokollerstellung innerhalb des Moduls `Protokoll`.

Die heutige TOP-Workbench ist **nicht automatisch** der globale Standard fuer andere Module.

---

## 4. Dauerhafte Leitplanken

Bei allen Umbauten gelten dauerhaft diese Leitplanken:

- keine neue Zielarchitektur pro Chat erfinden
- keine kuenstliche Plattform-Engine
- keine allgemeine Discovery-/Registry-Architektur im grossen Stil
- kein abrupter Komplettumbau
- keine aggressive Massenmigration
- keine vorschnelle Generalisierung von Fachlogik
- bestehende Funktionalitaet bleibt erhalten
- Uebergaenge duerfen voruebergehend bestehen, muessen aber bewusst und ehrlich benannt bleiben

---

## 5. Was ausserhalb der Fachmodule bleiben soll

Ausdruecklich ausserhalb der Fachmodule bleiben:
- gemeinsamer Bearbeitungskern
- gemeinsame Domaenen
- gemeinsame Dienste
- App-Kern
- Router / Shell
- Modulkatalog
- Modul-/Screen-Aufloesung

Fachlogik soll nicht aus Bequemlichkeit in diese Bereiche zurueckgezogen werden.

---

## 6. Was architektonisch nicht passieren soll

Nicht ohne klares Paket und klare Begruendung:
- Fachlogiken vermischen
- Plattformmechanik vorziehen
- breite Navigationserweiterung ohne konkretes Paket
- neue globale Registry-Logik im grossen Stil
- aggressive Altpfadbereinigung
- Massenmigration
- Doku oder Struktur schoenreden, wenn der technische Stand das noch nicht traegt

---

## 7. Zielkriterium fuer einen wesentlichen Modularisierungszustand

Ein wesentlicher Zielzustand ist nicht schon deshalb erreicht, weil Code nur in Modulordner verschoben wurde.

Ein tragfaehiger Zustand ist erst dann erreicht, wenn der Modulrahmen fachlich und technisch tragen kann, dass:
1. `Protokoll` fuer sich freigegeben betrieben werden kann
2. `Restarbeiten` fuer sich freigegeben betrieben werden kann
3. beide Module gemeinsam betrieben werden koennen
4. nicht freigegebene Module im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sind
5. Router, Navigation, Modul-/Screen-Aufloesung und Moduleinstiege auf diesen aktiven Modulumfang korrekt reagieren

Die dafuer noetige Freigabelogik gehoert in den App-Kern und den Modulrahmen.
Die Fachlogik bleibt in den Modulen.
