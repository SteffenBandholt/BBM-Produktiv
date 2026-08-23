# BBM – Verbindliche Regel für modulübergreifende Änderungen

Stand: 23.08.2026
Geltung: gesamtes Repository `BBM-Produktiv`
Status: verbindliche Entwicklungsregel

## Zweck

BBM besteht aus mehreren Fachmodulen und gemeinsam genutzten Kernstrukturen. Ein Entwicklungsauftrag für ein einzelnes Modul darf deshalb keine stillschweigenden Auswirkungen auf andere Module oder den BBM-Kern verursachen.

Diese Regel gilt für alle Entwicklungsarbeiten, insbesondere für Codex-Aufträge.

## 1. Grundsatz

Ein Entwicklungsauftrag darf grundsätzlich nur den ausdrücklich freigegebenen Modul-Scope verändern.

Muss zur Umsetzung eine gemeinsam genutzte BBM-Struktur verändert werden, ist dies vor der Änderung als modulübergreifender Eingriff zu kennzeichnen und abzustimmen.

Eigenmächtige Änderungen an gemeinsam genutzten Strukturen sind unzulässig.

## 2. Gemeinsam genutzte BBM-Strukturen

Als gemeinsam genutzt gelten insbesondere:

- Modulregistrierung
- Navigation
- Router
- Lizenz- und Release-Logik
- zentrale Firmenverwaltung
- gemeinsame Datenbankstrukturen
- gemeinsame PDF-/Print-Infrastruktur
- UI-Editor-Kern und gemeinsame Registries
- Preload- und IPC-Grundstruktur
- zentrale Speicherpfade und Dateiverwaltung
- gemeinsame Header, Startseiten und modulübergreifende UI-Komponenten
- sonstige Infrastruktur, die von mehr als einem Fachmodul verwendet wird

Die Aufzählung ist nicht abschließend. Entscheidend ist, ob eine Änderung Auswirkungen außerhalb des beauftragten Moduls haben kann.

## 3. Pflicht vor einer modulübergreifenden Änderung

Vor der Umsetzung muss der Entwickler bzw. Codex ausdrücklich benennen:

1. welche gemeinsame Struktur geändert werden soll,
2. warum die Änderung für den aktuellen Auftrag erforderlich ist,
3. welche anderen Module oder Funktionen betroffen sein können,
4. welche konkreten Dateien bzw. technischen Bereiche betroffen sind,
5. welches bestehende Verhalten unverändert bleiben muss,
6. welche Tests bzw. Abnahmen die Rückwirkungsfreiheit nachweisen sollen.

Danach ist zu stoppen und eine ausdrückliche Freigabe einzuholen.

Ohne diese Freigabe darf die modulübergreifende Änderung nicht umgesetzt werden.

## 4. Verhalten während eines Entwicklungsauftrags

Wird erst während der Umsetzung erkennbar, dass der freigegebene Modul-Scope nicht ausreicht und gemeinsame BBM-Strukturen verändert werden müssten, gilt:

- Arbeit am betroffenen Punkt stoppen,
- keine provisorische oder stillschweigende Änderung durchführen,
- Abhängigkeit und erforderliche Änderung dokumentieren,
- Auswirkungen auf andere Module benennen,
- Freigabe abwarten.

Der aktuelle Auftrag darf nicht eigenmächtig um diesen Scope erweitert werden.

## 5. Schutz bestehender Fachmodule

Ein Auftrag für ein Fachmodul darf bestehendes Verhalten anderer Fachmodule nicht verändern, sofern dies nicht ausdrücklich freigegeben wurde.

Insbesondere gilt:

- Rechnung darf Protokoll oder Restarbeiten nicht verändern.
- Protokoll darf Rechnung oder Restarbeiten nicht verändern.
- Restarbeiten darf Protokoll oder Rechnung nicht verändern.
- Änderungen am BBM-Core müssen mit allen betroffenen Fachmodulen verträglich sein.

## 6. Abnahme

Eine nicht freigegebene modulübergreifende Auswirkung gilt als Abnahmefehler, auch wenn die eigentliche Fachfunktion des beauftragten Moduls technisch funktioniert.

Beispiele für Abnahmefehler:

- ein anderes Modul verschwindet aus der Navigation,
- ein bestehender Druckweg verändert sein Verhalten,
- ein gemeinsamer Header oder Router wird unbeabsichtigt verändert,
- Lizenz- oder Release-Logik schaltet andere Module anders frei,
- gemeinsame Datenstrukturen verändern bestehende Fachfunktionen.

## 7. Prüfpflicht

Bei jedem Entwicklungsauftrag mit Berührung gemeinsamer Strukturen muss zusätzlich zur Fachprüfung eine Rückwirkungsprüfung erfolgen.

Mindestens zu prüfen sind die unmittelbar betroffenen Nachbarmodule und die gemeinsam genutzte Infrastruktur.

Ein grüner Fachtest des beauftragten Moduls ersetzt diese Rückwirkungsprüfung nicht.

## 8. Ausnahme

Eine modulübergreifende Änderung ist nur zulässig, wenn sie vorab ausdrücklich als Teil des Auftrags freigegeben wurde.

Die Freigabe muss erkennen lassen:

- welche gemeinsame Struktur geändert werden darf,
- welches Ziel damit verfolgt wird,
- welche Module betroffen sein dürfen,
- welche Bereiche ausdrücklich unverändert bleiben müssen.

## 9. Verbindlichkeit

Diese Regel ist Bestandteil des BBM-Entwicklungsablaufs und gilt für alle zukünftigen Entwicklungsaufträge.

Sie darf nicht durch einen Einzelauftrag stillschweigend außer Kraft gesetzt werden.
