
---

## `docs/MODULARISIERUNGSPLAN.md`

```md
# MODULARISIERUNGSPLAN.md

## Zweck

Diese Datei beschreibt den Umbauplan für die Modularisierung der App BBM.

Sie ergänzt `ARCHITECTURE.md`.
`ARCHITECTURE.md` definiert das Zielbild und die Leitplanken.
Diese Datei beschreibt die operative Reihenfolge, die Phasen und die dazugehörigen Aufgaben.

---

## Ausgangspunkt

BBM ist aktuell noch stark von der bestehenden Protokollstruktur geprägt.

Gleichzeitig ist das strategische Ziel klar:

- die App soll als modulare Plattform funktionieren
- `Protokoll` ist ein Fachmodul unter mehreren
- `Restarbeiten` ist ein weiteres Fachmodul
- die App soll mit einem, mehreren oder später anderen Modulen laufen können

Wichtig:

`TopsScreen` ist nicht das Modul `Protokoll`, sondern nur der Arbeitsscreen für die Protokollerstellung innerhalb des Moduls `Protokoll`.

---

## Grundsatz für die Reihenfolge

Der App-Kern wird konzeptionell zuerst definiert, aber an realen Fachmodulen praktisch validiert.

Das bedeutet:

- die Architektur wird zuerst festgelegt
- die Trennung wird dann an einem echten Modul überprüft
- der Kern wird nicht als abstraktes Wunschsystem ohne realen Modulbezug gebaut

Der erste reale Prüfstein ist das Modul `Protokoll`.

Nicht weil `Protokoll` das Zentrum der Zielarchitektur bleiben soll,
sondern weil es bereits existiert und als reales Fachmodul die schärfste Trennung erzwingt.

---

## Phase 1 – Architektur verbindlich festziehen

### Ziel
Die Grundarchitektur und die Begriffe dürfen nicht weiter driftig oder widersprüchlich sein.

### Aufgaben

#### 1.1 Grundsatzdateien festziehen
- `ARCHITECTURE.md` finalisieren
- `docs/MODULARISIERUNGSPLAN.md` finalisieren
- fachliche Regeldateien getrennt halten, z. B. `docs/domain/TOP-REGELN.md`

#### 1.2 Begriffe verbindlich festlegen
- App-Kern
- gemeinsame Domänen / Stamm
- gemeinsame Dienste / Addons
- Fachmodul
- Modul `Protokoll`
- Modul `Restarbeiten`
- `TopsScreen` als Screen des Moduls `Protokoll`

#### 1.3 Alte widersprüchliche Architekturtexte entfernen oder ersetzen
- alte Leitplanken-Dateien prüfen
- veraltete oder widersprüchliche Dateien löschen oder in neue Grundsatzdateien überführen

### Ergebnis
- kein Widerspruch in Zielbild und Benennung
- spätere Chats und Entwickler arbeiten von denselben Grundlagen aus

---

## Phase 2 – App-Kern fachlich entschlacken

### Ziel
Die App-Hülle soll keine fest eingebaute Protokoll-Architektur mehr sein.

### Aufgaben

#### 2.1 App-Shell bestimmen
- festlegen, was die Shell wirklich leisten muss
- Layout, Grundstruktur und Screen-Host sauber definieren
- unnötige fachliche Sonderlogik aus der Shell fernhalten

#### 2.2 Router-Verantwortung begrenzen
- Router auf Navigation und Screen-Wechsel zurückführen
- fachliche Spezialpfade und modulinterne Abläufe aus dem Router herauslösen
- spätere Modul-/Screen-Aufrufe vorbereiten

#### 2.3 Navigation entfachlichen
- feste, fachlich hart codierte Navigation identifizieren
- Navigation in Kernnavigation und Modulnavigation trennen
- spätere modulbasierte Navigation vorbereiten

### Ergebnis
- App-Kern kennt keine protokollzentrierte App-Struktur mehr
- App-Kern wird tragfähiger für mehrere Module

---

## Phase 3 – Gemeinsame Domänen sauber schneiden

### Ziel
Gemeinsame fachliche Grundlagen sollen nicht mehr im Protokollbereich oder in allgemeinen Mischstrukturen hängen.

### Aufgaben

#### 3.1 Firmen als gemeinsame Domäne schneiden
- Firmenverwaltung und Firmenzugriffe prüfen
- gemeinsame Firmenlogik von protokollspezifischer Nutzung trennen
- Zielzuordnung nach `stamm/firmen`

#### 3.2 Mitarbeiter / Beteiligte als gemeinsame Domäne schneiden
- gemeinsame Nutzung prüfen
- Zielzuordnung nach `stamm/mitarbeiter`

#### 3.3 Projekte als gemeinsame Domäne festziehen
- Projektkontext von modulspezifischer Fachlogik trennen
- Zielzuordnung nach `stamm/projekte`

### Ergebnis
- gemeinsame Stammdaten hängen nicht mehr an einem einzelnen Modul
- spätere Module können dieselben Grundlagen nutzen

---

## Phase 4 – Gemeinsame Dienste sauber schneiden

### Ziel
Technische Fähigkeiten sollen nicht mehr in Fachmodulen oder im Altbestand verklebt sein.

### Aufgaben

#### 4.1 Druck-/PDF-Infrastruktur schneiden
- technische Druck- und PDF-Funktionen identifizieren
- Vorschau, Speichern, Drucken als gemeinsame Dienste ordnen
- fachliche Ausgabeinhalte im jeweiligen Modul belassen

#### 4.2 Mailversand schneiden
- technischen Versand zentralisieren
- modulbezogene Inhalte vom Versandmechanismus trennen
- Zielzuordnung in gemeinsamen Dienstbereich

#### 4.3 Weitere technische Zusatzdienste prüfen
- Whisper / Diktat
- Export
- weitere modulübergreifende Fähigkeiten
- sinnvolle Zuordnung in `addons`

### Ergebnis
- gemeinsame Dienste sind als gemeinsame Fähigkeiten nutzbar
- Fachmodule müssen nicht jeweils eigene Technikinseln bauen

---

## Phase 5 – App-Einstellungen und Lizenzierung zentralisieren

### Ziel
Globale Steuerung darf nicht an Fachmodulen hängen.

### Aufgaben

#### 5.1 App-Einstellungen zentralisieren
- globale Settings identifizieren
- von modulspezifischen Settings trennen
- in Kernstruktur überführen

#### 5.2 Lizenzierung zentralisieren
- bestehende Lizenzlogik an einer Stelle bündeln
- prüfen, ob modulbezogene Lizenzfreigaben später nötig sind
- Lizenzprüfung als Kernservice definieren

### Ergebnis
- globale Steuerung liegt im App-Kern
- Fachmodule bleiben fachlich fokussiert

---

## Phase 6 – Modul `Protokoll` sauber ausschneiden

### Ziel
Das Modul `Protokoll` soll als echte Fachmoduleinheit sichtbar und tragfähig werden.

### Aufgaben

#### 6.1 Modulgrenze `Protokoll` festlegen
- bestimmen, was vollständig zum Modul `Protokoll` gehört
- Protokollübersicht, Protokollverwaltung, TOP-Regeln, Abschlusslogik, Ausgabeinhalte und protokollinterne Dialoge klar zuordnen

#### 6.2 `TopsScreen` richtig einordnen
- `TopsScreen` als Arbeitsscreen im Modul `Protokoll` behandeln
- nicht als Modul und nicht als globale Sonderarchitektur behandeln

#### 6.3 Modulstruktur `Protokoll` anlegen
- `src/renderer/modules/protokoll/` aufbauen
- sinnvolle Unterordner definieren:
  - `screens/`
  - `components/`
  - `domain/`
  - `data/`
  - `state/`
  - `viewmodel/`
  - `dialogs/`
  - `rules/`

#### 6.4 Bestehende Protokollbestandteile umziehen
- `TopsScreen`
- bestehender Tops-Unterbau
- protokollbezogene Dialoge
- protokollbezogene Regeln
- protokollbezogene Datenflüsse

#### 6.5 Modul-Einstieg definieren
- `index.js` für Modulregistrierung vorbereiten
- Screens und Navigation des Moduls kapseln

### Ergebnis
- `Protokoll` existiert als echtes Fachmodul
- `TopsScreen` ist sauber als Screen dieses Moduls eingeordnet

---

## Phase 7 – Modulrahmen produktiv machen

### Ziel
Der App-Kern soll Fachmodule tragen, statt selbst Facharchitektur zu sein.

### Aufgaben

#### 7.1 Modulkatalog einführen
- aktive Module definierbar machen
- Modulregistrierung strukturieren

#### 7.2 Modul-/Screen-Auflösung einführen
- Screen-Host an Modulkatalog anbinden
- Router auf modulbasierte Aufrufe ausrichten

#### 7.3 Modulnavigation dynamisch machen
- Navigation aus aktiven Modulen speisen
- Kernnavigation und Modulnavigation sauber trennen

### Ergebnis
- der Kern arbeitet mit Modulen
- nicht mehr mit fest eingebauten Fachwegen

---

## Phase 8 – Modul `Restarbeiten` aufbauen

### Ziel
Ein zweites echtes Fachmodul soll auf demselben Rahmen aufsetzen.

### Aufgaben

#### 8.1 Fachschnitt `Restarbeiten` definieren
- Grenzen des Moduls festlegen
- Regeln, Screens und Zuständigkeiten bestimmen

#### 8.2 Modulstruktur `Restarbeiten` anlegen
- `src/renderer/modules/restarbeiten/` aufbauen
- entsprechende Unterordner anlegen

#### 8.3 Modul-Einstieg definieren
- Navigation
- Screens
- Startpunkt
- gemeinsame Dienste-Nutzung

### Ergebnis
- `Restarbeiten` ist kein Anbau an `Protokoll`, sondern ein eigenes Fachmodul

---

## Phase 9 – Modulfähigkeit praktisch beweisen

### Ziel
Die Architektur muss praktisch tragfähig sein, nicht nur theoretisch.

### Aufgaben

#### 9.1 Szenario A testen
- BBM läuft nur mit `Protokoll`

#### 9.2 Szenario B testen
- BBM läuft nur mit `Restarbeiten`

#### 9.3 Szenario C testen
- BBM läuft mit beiden Modulen

#### 9.4 Szenario D vorbereiten
- ein drittes Modul muss grundsätzlich möglich sein, ohne Kernarchitektur neu zu erfinden

### Ergebnis
- Modularität ist praktisch überprüft
- Austauschbarkeit ist nicht mehr nur behauptet

---

## Phase 10 – Altbestand zurückbauen

### Ziel
Übergangslösungen und Monolithreste sollen verschwinden.

### Aufgaben

#### 10.1 Alte Fachpfade zurückbauen
- nicht mehr benötigte Alt-Views prüfen
- alte fachliche Pfade abbauen
- Doppelstrukturen entfernen

#### 10.2 Monolithreste beseitigen
- verbliebene Fachlogik aus dem Kern herausziehen
- Mischstrukturen beenden

#### 10.3 Abschlussprüfung
- Ist-Zustand gegen `ARCHITECTURE.md` prüfen
- Restabweichungen dokumentieren
- offene Architektur-Schulden sichtbar machen

### Ergebnis
- kein dauerhafter Mischzustand mehr
- klare Plattformstruktur

---

## Priorisierte Reihenfolge

Die operative Priorität lautet:

1. Architektur verbindlich festziehen
2. App-Kern fachlich entschlacken
3. gemeinsame Domänen schneiden
4. gemeinsame Dienste schneiden
5. App-Einstellungen und Lizenzierung zentralisieren
6. Modul `Protokoll` sauber ausschneiden
7. Modulrahmen produktiv machen
8. Modul `Restarbeiten` aufbauen
9. Modulfähigkeit praktisch beweisen
10. Altbestand zurückbauen

---

## Wichtige Warnung

Der häufigste Fehlweg wäre:

- ein weiteres Fachmodul schnell dazusetzen
- den App-Kern aber protokollzentriert zu lassen

Dann entsteht keine modulare Plattform, sondern nur ein zweiter Sonderfall neben dem ersten.

Der erste echte Beweis für Modularität ist daher:

- `Protokoll` als Modul sauber schneiden
- den Kern so umbauen, dass er Fachmodule trägt
- danach `Restarbeiten` auf denselben Rahmen setzen

---

## Arbeitsregel für spätere Weiterarbeit

Diese Datei ist die verbindliche operative Grundlage für den Umbau.

Neue Chats, neue Entwickler oder neue KI-/Codex-Läufe sollen den Umbauplan nicht neu erfinden, sondern anhand dieser Phasen und Schritte weiterarbeiten.

Wenn sich Erkenntnisse ändern, wird diese Datei angepasst.
Nicht jeder neue Lauf erfindet eine neue Reihenfolge.

---

## Schlussregel

Der Umbau erfolgt professionell, schrittweise und nachvollziehbar.

Nicht Ziel ist ein schneller zweiter Sonderfall.
Ziel ist eine tragfähige modulare Plattformstruktur für BBM.