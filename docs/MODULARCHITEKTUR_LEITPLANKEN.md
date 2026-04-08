# Modularchitektur und verbindliche Leitplanken

## Zweck der Datei

Diese Datei hält verbindlich fest, wie die App architektonisch gedacht ist.  
Ziel ist, dass neue Chats, neue Entwickler oder neue Codex-Läufe die App nicht bei jeder Änderung neu interpretieren.

## Verbindliches Zielbild der App

Die App ist als modularer Baukasten gedacht.  
Sie soll mit einem Modul, mit mehreren Modulen oder auch ohne das Modul „Protokoll“ nutzbar sein.

Beispiele für Fachmodule:

- Protokoll
- Restarbeitenliste
- Mängelmanagement
- weitere Module

Das Modul „Protokoll“ ist nicht das Zentrum der App, sondern ein Modul unter mehreren.

## Architekturprinzip

Die App trennt sich verbindlich in drei Ebenen:

- App-Kern
- Modulrahmen / Integrationsschicht
- Fachmodule

Der App-Kern enthält allgemeine Funktionen wie Projektkontext, Navigation, gemeinsame UI- und Daten-Infrastruktur, Firmen und Beteiligte, Ausgabe- und Druckmechanik sowie weitere modulübergreifende Grundlagen.

Fachlogik gehört in Module und nicht in den App-Kern.

## Verbindliche Konsequenz für die laufende Migration

`TopsView` wird durch `TopsScreen` abgelöst.

Diese Migration dient nicht nur einer UI-Modernisierung, sondern der Vorbereitung auf modulare Austauschbarkeit.  
`TopsScreen` ist als Screen des Protokollmoduls zu verstehen und nicht als neuer globaler Monolith.

## Aktuell abgeschlossene Sofortmaßnahmen am Topsscreen

- Save, Delete und Move laden nach Erfolg wieder aus frischen Daten.
- Auswahl und Draft werden sauberer nachgeführt.
- Fehler werden sauberer in den State geschrieben.
- `isWriting` schützt vor Doppel- und Parallelaktionen.
- Header, Quicklane, Workbench, Edit-Felder und Meta-Bereich reagieren auf laufende Schreibaktionen.
- End-Meeting startet nicht während laufender Schreibaktionen.

## Was bewusst noch nicht erledigt ist

Die aktuelle Arbeit ist kein abgeschlossener Endzustand.

Offen sind insbesondere:

- weitere Entkopplung von Screen- und Ablauflogik
- sauberere Trennung zwischen App-Kern und Protokollmodul
- weitere Modularisierung für zusätzliche Fachmodule
- technischer Schuldenabbau und Aufräumen

## Verbindliche Leitplanken für kommende Änderungen

Neue Änderungen dürfen Protokoll-Logik nicht wieder in allgemeine App-Bereiche ziehen.

Fachlogik soll möglichst in modulnahen Bausteinen liegen.  
Neue Module müssen grundsätzlich neben Protokoll denkbar sein.  
Entscheidungen sollen das Ziel unterstützen, die App mit einem Modul, mit mehreren Modulen oder auch ohne Protokoll nutzen zu können.

`TopsScreen` soll nicht wieder zu einem neuen Monolithen anwachsen.

## Arbeitsregel für zukünftige KI-/Codex-Nutzung

Bei neuen Änderungen ist diese Datei als architektonische Grundlage zu beachten.  
Das Zielbild ist nicht bei jedem Lauf neu zu interpretieren, sondern von hier aus weiterzuentwickeln.

Bei Unsicherheit ist sauber zwischen App-Kern, Modulrahmen und Fachmodul zu unterscheiden.

## Kurzfazit

Die App entwickelt sich von einer protokollzentrierten Lösung zu einer modularen Plattform für mehrere Fachmodule.
