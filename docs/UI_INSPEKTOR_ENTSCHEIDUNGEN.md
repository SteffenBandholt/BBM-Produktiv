# UI-Inspektor Entscheidungslog

## Entscheidung 001
**Beschluss:** Der UI-Inspektor wird neu und exportierbar entwickelt.

**Begründung:** Nur ein sauberer Neustart als Modul sichert Wiederverwendbarkeit und verhindert BBM-spezifische Verkopplung.

## Entscheidung 002
**Beschluss:** Der vorhandene Tabellen-Kalibrator wird nicht zur Hauptbedienung des UI-Inspektors weiterentwickelt.

**Begründung:** Der Tabellen-Kalibrator verfolgt einen anderen Zweck und deckt nicht die geforderte, allgemeine UI-Bereichsbedienung ab.

## Entscheidung 003
**Beschluss:** Der Nutzer soll keine UI-Technik lernen müssen; technische Begriffe bleiben intern.

**Begründung:** Zielgruppe sind fachliche Anwender ohne Programmierkenntnisse.

## Entscheidung 004
**Beschluss:** Jede App liefert später eine Layout-Landkarte; der Core bleibt allgemein.

**Begründung:** So bleibt das Modul exportierbar, während App-Spezifika sauber ausgelagert werden.

## Entscheidung 005
**Beschluss:** Bestehende UIs werden nachträglich erkannt/markiert; neue UIs werden künftig von Anfang an mit Bereichs-Landkarte gebaut.

**Begründung:** Das erlaubt Bestandseinführung und zukünftige Stabilität über einen gemeinsamen Arbeitsansatz.

## Entscheidung 006
**Beschluss:** Der UI-Inspektor erhält einen verbindlichen Arbeitsvertrag.

**Begründung:** Damit ChatGPT, Codex Cloud, Codex lokal und der Nutzer nach festen Regeln arbeiten und neue Chats nicht wieder bei null beginnen.

## Entscheidung 007
**Beschluss:** Das Projekt erhält mit `docs/UI_INSPEKTOR_START_HIER.md` einen festen Einstiegspunkt.

**Begründung:** Neue Chats und Codex-Läufe sollen nicht aus verstreuten Informationen den Projektstand zusammensuchen müssen.



## Entscheidung 008
**Beschluss:** Die Architektur wird als exportierbares Schichtenmodell festgelegt.

**Begründung:** Core, Overlay, Panel, Registry, Store, Adapter und Layout-Landkarte müssen getrennt bleiben, damit der UI-Inspektor nicht BBM-spezifisch wird und später in andere Apps exportiert werden kann.


## Entscheidung 009
**Beschluss:** Der UI-Inspektor wird schrittweise ab M6 über ein Modulgerüst, Landkartenformat, Pilot-Landkarte, Markierungen, Overlay, Auswahl, Panel, temporäre Anwendung und Speicherung aufgebaut.

**Begründung:** Der Inspektor darf nicht als Großpaket entstehen. Die schrittweise Umsetzung verhindert Nebenwirkungen und hält das Modul exportierbar.


## Entscheidung 010
**Beschluss:** M11 nutzt eine Trefferliste am Klickpunkt statt klickbarer Rahmen/Handles.

**Begründung:** Bei verschachtelten UI-Bereichen ist Handle-/Rahmenklick für Laien nicht zuverlässig und unübersichtlich.

**Auswirkung:** Die Trefferliste trennt Auswahl von Rahmenanzeige und bleibt in komplexen UIs bedienbar.
