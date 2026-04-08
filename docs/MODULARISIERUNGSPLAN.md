# MODULARISIERUNGSPLAN.md

## Zweck

Diese Datei beschreibt den Umbau- und Entwicklungsplan für die Modularisierung der App BBM.

Sie ergänzt `ARCHITECTURE.md`.

- `ARCHITECTURE.md` definiert das Zielbild und die verbindlichen Leitplanken.
- Diese Datei beschreibt die operative Reihenfolge, die Phasen, die Schritte und den jeweils erreichten Stand.

Diese Datei ist kein loses Notizpapier, sondern ein fortlaufend gepflegtes Arbeitsinstrument.

---

## Arbeitsregel für spätere Weiterarbeit

Diese Datei ist die verbindliche operative Grundlage für den Umbau.

Neue Chats, neue Entwickler oder neue KI-/Codex-Läufe sollen den Umbauplan nicht neu erfinden, sondern anhand dieser Datei weiterarbeiten.

Dabei gilt:

1. Bestehende Phasen und Schritte werden weitergeführt, nicht parallel neu erfunden.
2. Status dürfen nur geändert werden, wenn der tatsächliche Stand dies rechtfertigt.
3. Ein Schritt ist erst dann `ERLEDIGT`, wenn das Ergebnis dokumentiert ist.
4. Bei `IN ARBEIT` muss der aktuelle Stand kurz festgehalten werden.
5. Neue Erkenntnisse werden in diesen Plan eingearbeitet, nicht in konkurrierenden Parallelplänen gesammelt.

---

## Statuslegende

- `OFFEN` = noch nicht begonnen
- `IN ARBEIT` = begonnen, aber nicht abgeschlossen
- `ERLEDIGT` = abgeschlossen und Ergebnis dokumentiert
- `BLOCKIERT` = aktuell nicht weiterführbar
- `ZURÜCKGESTELLT` = bewusst vertagt

---

## Fortschrittsübersicht

| Phase | Titel | Status |
|---|---|---|
| 1 | Architektur verbindlich festziehen | ERLEDIGT |
| 2 | App-Kern fachlich entschlacken | IN ARBEIT |
| 3 | Gemeinsame Domänen sauber schneiden | OFFEN |
| 4 | Gemeinsame Dienste sauber schneiden | OFFEN |
| 5 | App-Einstellungen und Lizenzierung zentralisieren | OFFEN |
| 6 | Gemeinsame Kernbausteine sauber schneiden | OFFEN |
| 7 | Modul `Protokoll` sauber ausschneiden | OFFEN |
| 8 | Modulrahmen produktiv machen | OFFEN |
| 9 | Modul `Restarbeiten` aufbauen | OFFEN |
| 10 | Modulfähigkeit praktisch beweisen | OFFEN |
| 11 | Altbestand zurückbauen | OFFEN |


## Arbeitsform für die Umsetzung

Die Umsetzung dieses Plans erfolgt paketweise.

Dabei gilt:

1. Eine Phase wird in **Pakete** zerlegt.
2. Jedes Paket wird in folgende Schritte gegliedert:
   - Scout
   - Builder
   - Reviewer
   - Doc
3. Scout dient der Analyse und Grenzziehung.
4. Builder dient der eigentlichen Umsetzung.
5. Reviewer dient der unabhängigen Prüfung.
6. Doc dient der Dokumentation und Planpflege.
7. Ein Paket gilt erst dann als abgeschlossen, wenn alle erforderlichen Schritte durchgeführt, geprüft und dokumentiert wurden.
8. Erst danach wird das nächste Paket begonnen.

Wichtig:

- Es werden keine konkurrierenden Parallelpläne aufgebaut.
- Pakete werden nacheinander abgearbeitet.
- Bei festgestellten Mängeln erfolgt erst Nacharbeit, dann erneute Prüfung.
- Erst danach darf das nächste Paket starten.


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

# Phase 1 – Architektur verbindlich festziehen
**Status:** ERLEDIGT

## Schritt 1.1 – Grundsatzdateien festziehen
**Status:** ERLEDIGT

**Ziel**  
Verbindliche Architektur-, Planungs- und Fachgrundlagen schaffen.

**Aufgaben**
- `ARCHITECTURE.md` finalisieren
- `docs/MODULARISIERUNGSPLAN.md` anlegen/finalisieren
- `docs/domain/TOP-REGELN.md` getrennt führen

**Abhängigkeiten**
- keine

**Ergebnis**
- zentrale Architekturdatei vorhanden
- operativer Plan vorhanden
- TOP-Fachregeln getrennt von Architektur

**Stand / Notiz**
Grundsatzstruktur wurde festgezogen. Architektur, Plan und Fachregeln sind als getrennte Dokumenttypen definiert.

---

## Schritt 1.2 – Begriffe verbindlich festlegen
**Status:** ERLEDIGT

**Ziel**  
Zentrale Begriffe und Rollen eindeutig machen.

**Aufgaben**
- App-Kern definieren
- gemeinsame Domänen / Stamm definieren
- gemeinsame Dienste / Addons definieren
- gemeinsame Kernbausteine definieren
- Fachmodule definieren
- `Protokoll` als Fachmodul definieren
- `Restarbeiten` als Fachmodul definieren
- `TopsScreen` als Screen des Moduls `Protokoll` definieren

**Abhängigkeiten**
- Schritt 1.1

**Ergebnis**
- Begriffe und Rollen eindeutig festgelegt
- zentrale Architekturbegriffe dürfen nicht mehr neu uminterpretiert werden

**Stand / Notiz**
Verbindlich festgelegt wurde insbesondere:
- `TopsScreen` = Screen
- `Protokoll` = Fachmodul
- `Restarbeiten` = anderes Fachmodul

---

## Schritt 1.3 – Alte konkurrierende Architekturtexte abbauen
**Status:** ERLEDIGT

**Ziel**  
Widersprüchliche oder doppelte Architektur-Grundlagen entfernen.

**Aufgaben**
- konkurrierende Architekturdateien im `docs`-Ordner prüfen
- überholte Dateien löschen oder in neue Grundsatzdateien überführen
- doppelte Architekturführung beenden

**Abhängigkeiten**
- Schritt 1.1
- Schritt 1.2

**Ergebnis**
- nur noch eine führende Architekturgrundlage
- keine konkurrierenden Leitplanken-Dateien mehr

**Stand / Notiz**
Bereits bereinigt:
- konkurrierende Architekturdateien in `docs` entfernt
- Zielstruktur der Doku auf zentrale Grundsatzdateien reduziert

---

# Phase 2 – App-Kern fachlich entschlacken
**Status:** IN ARBEIT

## Paket 1 – `main.js` und `Router.js` vorsortieren
**Status:** ERLEDIGT

**Ziel**
`src/renderer/main.js` und `src/renderer/app/Router.js` entlang der Zielarchitektur konservativ vorstrukturieren, ohne bereits einen tieferen Kernumbau auszulösen.

**Ergebnis**
- Kernlogik, service-nahe Logik und fachlich verdrahtete Altlogik wurden in beiden Dateien sichtbarer gegliedert.
- Es wurde keine Modulregistrierung und keine neue Navigation eingeführt.
- Es wurden keine großen Fachpfade entfernt.

**Stand / Notiz**
Paket 1 ist als konservative Vorstrukturierung von `src/renderer/main.js` und `src/renderer/app/Router.js` abgeschlossen. Die Dateien sind für Phase 2 lesbarer gegliedert, ohne große Funktionsverschiebungen oder neue Architekturpfade.

## Schritt 2.1 – App-Shell bestimmen
**Status:** IN ARBEIT

**Ziel**  
Festlegen, was die App-Shell wirklich leisten muss und was nicht.

**Aufgaben**
- Shell-Verantwortung definieren
- Layout, Grundstruktur und Screen-Host abgrenzen
- fachliche Sonderlogik aus der Shell heraushalten

**Abhängigkeiten**
- Phase 1 abgeschlossen

**Ergebnis**
- klare Shell-Verantwortung
- kein fachlicher Wildwuchs in der App-Hülle

**Stand / Notiz**
Paket 1 hat `src/renderer/main.js` konservativ vorstrukturiert. Shell-/Bootstrap-Logik, service-nahe Logik und fachlich verdrahtete Altlogik sind sichtbarer getrennt; eine neue Navigation oder ein größerer Shell-Umbau wurde noch nicht begonnen.

---

## Schritt 2.2 – Router-Verantwortung begrenzen
**Status:** IN ARBEIT

**Ziel**  
Den Router auf Navigation und Screen-Wechsel zurückführen.

**Aufgaben**
- fachliche Spezialpfade im Router identifizieren
- modulinterne Abläufe aus dem Router herauslösen
- spätere Modul-/Screen-Aufrufe vorbereiten

**Abhängigkeiten**
- Schritt 2.1

**Ergebnis**
- Router wird Integrationsschicht statt Fachsteuerung

**Stand / Notiz**
Paket 1 hat `src/renderer/app/Router.js` konservativ vorstrukturiert. Kernlogik, service-nahe Integrationen und fachlich verdrahtete Altlogik sind sichtbarer markiert; modulinterne Abläufe wurden noch nicht aus dem Router herausgelöst.

---

## Schritt 2.3 – Navigation entfachlichen
**Status:** OFFEN

**Ziel**  
Die Navigation darf nicht mehr fest um `Protokoll` herum gebaut sein.

**Aufgaben**
- harte fachliche Navigation identifizieren
- Kernnavigation und Modulnavigation trennen
- modulbasierte Navigation vorbereiten

**Abhängigkeiten**
- Schritt 2.1
- Schritt 2.2

**Ergebnis**
- Navigation kann später aus aktiven Modulen gespeist werden

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 3 – Gemeinsame Domänen sauber schneiden
**Status:** OFFEN

## Schritt 3.1 – Firmen als gemeinsame Domäne schneiden
**Status:** OFFEN

**Ziel**  
Firmen aus modulspezifischen Mischlagen lösen.

**Aufgaben**
- Firmenverwaltung und Firmenzugriffe prüfen
- gemeinsame Firmenlogik von protokollspezifischer Nutzung trennen
- Zielzuordnung nach `stamm/firmen`

**Abhängigkeiten**
- Phase 2 sinnvoll vorbereitet

**Ergebnis**
- Firmen sind gemeinsame Domäne statt Protokoll-Anhängsel

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 3.2 – Mitarbeiter / Beteiligte als gemeinsame Domäne schneiden
**Status:** OFFEN

**Ziel**  
Mitarbeiter und Beteiligte als modulübergreifende Grundlage sauber zuordnen.

**Aufgaben**
- gemeinsame Nutzung prüfen
- modulspezifische und modulübergreifende Teile trennen
- Zielzuordnung nach `stamm/mitarbeiter`

**Abhängigkeiten**
- Schritt 3.1 sinnvollerweise vorbereitet

**Ergebnis**
- Beteiligte/Mitarbeiter liegen als gemeinsame Domäne vor

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 3.3 – Projekte als gemeinsame Domäne festziehen
**Status:** OFFEN

**Ziel**  
Projektbasis und Projektkontext sauber vom Fachmodul trennen.

**Aufgaben**
- Projektkontext von modulspezifischer Logik trennen
- Zielzuordnung nach `stamm/projekte`
- Übergänge zwischen Kern und Projektdomäne klären

**Abhängigkeiten**
- Phase 2
- Schritt 3.1 / 3.2 sinnvollerweise vorbereitet

**Ergebnis**
- Projekte sind als gemeinsame Grundlage verfügbar

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 4 – Gemeinsame Dienste sauber schneiden
**Status:** OFFEN

## Schritt 4.1 – Druck-/PDF-Infrastruktur schneiden
**Status:** OFFEN

**Ziel**  
Technische Ausgabe von fachlichen Ausgabeinhalten trennen.

**Aufgaben**
- technische Druck- und PDF-Funktionen identifizieren
- Vorschau, Speichern, Drucken als gemeinsame Dienste ordnen
- fachliche Ausgabeinhalte im Modul belassen

**Abhängigkeiten**
- Phase 2 vorbereitet
- Phase 3 sinnvoll vorbereitet

**Ergebnis**
- technische Ausgabe ist gemeinsamer Dienst
- Fachmodule liefern Inhalte, nicht die ganze Drucktechnik

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 4.2 – Mailversand schneiden
**Status:** OFFEN

**Ziel**  
Technischen Mailversand zentralisieren.

**Aufgaben**
- Versandmechanik von fachlichen Mailinhalten trennen
- Zielzuordnung in gemeinsamen Dienstbereich
- klare Schnittstelle definieren

**Abhängigkeiten**
- Phase 2 vorbereitet

**Ergebnis**
- Mailversand ist gemeinsamer Dienst statt Fachmodultechnik

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 4.3 – Weitere technische Zusatzdienste prüfen
**Status:** OFFEN

**Ziel**  
Weitere modulübergreifende Technik sauber einsortieren.

**Aufgaben**
- Whisper / Diktat prüfen
- Export prüfen
- weitere technische Zusatzdienste prüfen
- Zuordnung in `addons` festziehen

**Abhängigkeiten**
- Phase 2 vorbereitet

**Ergebnis**
- modulübergreifende Technik liegt nicht mehr ungeordnet im Altbestand

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 5 – App-Einstellungen und Lizenzierung zentralisieren
**Status:** OFFEN

## Schritt 5.1 – App-Einstellungen zentralisieren
**Status:** OFFEN

**Ziel**  
Globale Einstellungen vom Fachmodul lösen.

**Aufgaben**
- globale Settings identifizieren
- von modulspezifischen Settings trennen
- in Kernstruktur überführen

**Abhängigkeiten**
- Phase 2

**Ergebnis**
- globale Steuerung liegt im App-Kern

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 5.2 – Lizenzierung zentralisieren
**Status:** OFFEN

**Ziel**  
Lizenzlogik an einer zentralen Stelle bündeln.

**Aufgaben**
- bestehende Lizenzlogik sammeln
- modulbezogene Lizenzfreigaben als Zukunftsoption prüfen
- Lizenzprüfung als Kernservice definieren

**Abhängigkeiten**
- Phase 2

**Ergebnis**
- Lizenzierung ist Kernaufgabe, nicht Modulbestandteil

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 6 – Gemeinsame Kernbausteine sauber schneiden
**Status:** OFFEN

## Schritt 6.1 – Bearbeitungskerne identifizieren
**Status:** ERLEDIGT

**Ziel**  
Wiederverwendbare Bearbeitungsbausteine fachlich von Workbench-Logik unterscheiden.

**Aufgaben**
- generische Editbox-Bestandteile identifizieren
- allgemeine Textregeln und Zustandslogik identifizieren
- wiederverwendbare Metafelder identifizieren

**Abhängigkeiten**
- Phase 1 abgeschlossen

**Ergebnis**
- Bearbeitungskerne und modulspezifische Workbench-Logik sind konzeptionell getrennt

**Stand / Notiz**
Erkenntnis festgehalten:
Die heutige Bearbeitungsfläche im `TopsScreen` besteht aus
1. generischem Kern,
2. wiederverwendbaren Fachkernfeldern,
3. modulspezifischer Workbench-Logik.

---

## Schritt 6.2 – Gemeinsame Kernbausteine festziehen
**Status:** OFFEN

**Ziel**  
Gemeinsame Bearbeitungskerne stabil und sauber zuordnen.

**Aufgaben**
- Editbox-Kern als gemeinsamen Baustein festziehen
- allgemeine Metafelder wie Verantwortlich oder Status/Fälligkeitsfeld sauber zuordnen
- fachlich vorgeprägte Elemente in gemeinsamen Kernen kritisch prüfen

**Abhängigkeiten**
- Schritt 6.1

**Ergebnis**
- wiederverwendbare Bearbeitungskerne sind definiert und sauber abgegrenzt

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 6.3 – Workbench-Muster vom Fachmodul trennen
**Status:** OFFEN

**Ziel**  
Gemeinsames Bearbeitungsmuster ermöglichen, ohne Fachlogik zu verallgemeinern.

**Aufgaben**
- generisches Bearbeitungsmuster dokumentieren
- modulspezifische Workbench-Logik ausdrücklich im jeweiligen Modul belassen
- verhindern, dass die heutige TOP-Workbench zum stillen Globalstandard wird

**Abhängigkeiten**
- Schritt 6.1
- Schritt 6.2

**Ergebnis**
- Muster wiederverwendbar, Fachlogik nicht verschleppt

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 7 – Modul `Protokoll` sauber ausschneiden
**Status:** OFFEN

## Schritt 7.1 – Modulgrenze `Protokoll` festlegen
**Status:** OFFEN

**Ziel**  
Bestimmen, was vollständig zum Fachmodul `Protokoll` gehört.

**Aufgaben**
- Protokollübersicht, Protokollverwaltung, TOP-Regeln, Abschlusslogik, Ausgabeinhalte und protokollinterne Dialoge klar zuordnen

**Abhängigkeiten**
- Phase 2 vorbereitet
- Phase 3 sinnvoll vorbereitet
- Phase 6 vorbereitet

**Ergebnis**
- Fachgrenze des Moduls `Protokoll` ist klar dokumentiert

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 7.2 – `TopsScreen` richtig einordnen
**Status:** OFFEN

**Ziel**  
`TopsScreen` sauber als Arbeitsscreen im Modul `Protokoll` einordnen.

**Aufgaben**
- `TopsScreen` nicht mehr als Architektursondersystem behandeln
- Zuordnung nach `modules/protokoll/screens/` vorbereiten

**Abhängigkeiten**
- Schritt 7.1

**Ergebnis**
- `TopsScreen` ist klar als Screen des Moduls `Protokoll` eingeordnet

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 7.3 – Editbox und Workbench im Protokoll richtig schneiden
**Status:** OFFEN

**Ziel**  
Bearbeitungskern und protokollspezifische Workbench sauber trennen.

**Aufgaben**
- generischen Editbox-Kern nicht mit dem Modul verwechseln
- protokollspezifische Workbench-Logik im Modul `Protokoll` halten
- TOP-spezifische Aktionen und Draft-Struktur nicht als allgemeine App-Standards behandeln

**Abhängigkeiten**
- Phase 6
- Schritt 7.1

**Ergebnis**
- `ProtokollWorkbench` bleibt modulspezifisch
- gemeinsame Kernbausteine bleiben außerhalb des Moduls wiederverwendbar

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 7.4 – Modulstruktur `Protokoll` anlegen
**Status:** OFFEN

**Ziel**  
Die technische Heimat des Moduls `Protokoll` schaffen.

**Aufgaben**
- `src/renderer/modules/protokoll/` aufbauen
- Unterordner anlegen:
  - `screens/`
  - `components/`
  - `domain/`
  - `data/`
  - `state/`
  - `viewmodel/`
  - `dialogs/`
  - `rules/`

**Abhängigkeiten**
- Schritt 7.1

**Ergebnis**
- Modulstruktur vorhanden

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 7.5 – Bestehende Protokollbestandteile umziehen
**Status:** OFFEN

**Ziel**  
Bestehende Protokollteile in die Modulstruktur überführen.

**Aufgaben**
- `TopsScreen`
- bestehender Tops-Unterbau
- protokollbezogene Dialoge
- protokollbezogene Regeln
- protokollbezogene Datenflüsse

**Abhängigkeiten**
- Schritt 7.2
- Schritt 7.3
- Schritt 7.4

**Ergebnis**
- `Protokoll` ist als technisches und fachliches Modul sichtbar

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 7.6 – Modul-Einstieg definieren
**Status:** OFFEN

**Ziel**  
Das Modul registrierbar und vom Kern aus ansprechbar machen.

**Aufgaben**
- `index.js` für Modulregistrierung vorbereiten
- Screens und Navigation des Moduls kapseln

**Abhängigkeiten**
- Schritt 7.4
- Schritt 7.5

**Ergebnis**
- `Protokoll` besitzt einen klaren Moduleinstieg

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 8 – Modulrahmen produktiv machen
**Status:** OFFEN

## Schritt 8.1 – Modulkatalog einführen
**Status:** OFFEN

**Ziel**  
Aktive Module definierbar machen.

**Aufgaben**
- Modulkatalog definieren
- Modulregistrierung strukturieren

**Abhängigkeiten**
- Phase 2
- Phase 7 vorbereitet

**Ergebnis**
- Module können vom Kern verwaltet werden

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 8.2 – Modul-/Screen-Auflösung einführen
**Status:** OFFEN

**Ziel**  
Den Kern auf modulbasierte Screen-Auflösung umstellen.

**Aufgaben**
- Screen-Host an Modulkatalog anbinden
- Router auf modulbasierte Aufrufe ausrichten

**Abhängigkeiten**
- Schritt 8.1

**Ergebnis**
- Kern und Module sprechen über definierte Auflösung statt feste Fachpfade

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 8.3 – Modulnavigation dynamisch machen
**Status:** OFFEN

**Ziel**  
Navigation aus aktiven Modulen ableiten.

**Aufgaben**
- Navigation aus Moduldefinitionen speisen
- Kernnavigation und Modulnavigation sauber trennen

**Abhängigkeiten**
- Schritt 8.1
- Schritt 8.2

**Ergebnis**
- modulbasierte Navigation statt hart codierter Fachnavigation

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 9 – Modul `Restarbeiten` aufbauen
**Status:** OFFEN

## Schritt 9.1 – Fachschnitt `Restarbeiten` definieren
**Status:** OFFEN

**Ziel**  
Das Modul `Restarbeiten` fachlich sauber abgrenzen.

**Aufgaben**
- Grenzen des Moduls festlegen
- Regeln, Screens und Zuständigkeiten bestimmen

**Abhängigkeiten**
- Phase 1
- Phase 3
- Phase 4
- Phase 8 vorbereitet

**Ergebnis**
- fachlicher Zuschnitt von `Restarbeiten` ist klar beschrieben

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 9.2 – Modulstruktur `Restarbeiten` anlegen
**Status:** OFFEN

**Ziel**  
Die technische Heimat des Moduls `Restarbeiten` anlegen.

**Aufgaben**
- `src/renderer/modules/restarbeiten/` aufbauen
- entsprechende Unterordner anlegen

**Abhängigkeiten**
- Schritt 9.1

**Ergebnis**
- Modulstruktur vorhanden

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 9.3 – Eigene Restarbeiten-Workbench bauen
**Status:** OFFEN

**Ziel**  
Eine eigene Bearbeitungsfläche für `Restarbeiten` auf gemeinsamen Kernen aufsetzen.

**Aufgaben**
- prüfen, welche gemeinsamen Bearbeitungskerne genutzt werden
- eigene Draft-Struktur definieren
- eigene Aktionen definieren
- eigene Regeln und Metafelder zuordnen

**Abhängigkeiten**
- Phase 6
- Schritt 9.1
- Schritt 9.2

**Ergebnis**
- `RestarbeitenWorkbench` ist fachlich eigenständig, nutzt aber gemeinsame Kernbausteine

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 9.4 – Modul-Einstieg definieren
**Status:** OFFEN

**Ziel**  
`Restarbeiten` als registrierbares Fachmodul aufsetzen.

**Aufgaben**
- Navigation
- Screens
- Startpunkt
- gemeinsame Dienste-Nutzung definieren

**Abhängigkeiten**
- Schritt 9.2
- Schritt 9.3
- Phase 8

**Ergebnis**
- `Restarbeiten` ist als eigenes Fachmodul integrierbar

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 10 – Modulfähigkeit praktisch beweisen
**Status:** OFFEN

## Schritt 10.1 – Szenario A testen
**Status:** OFFEN

**Ziel**  
BBM läuft nur mit `Protokoll`.

**Aufgaben**
- Modulstart nur mit `Protokoll` prüfen

**Abhängigkeiten**
- Phase 7
- Phase 8

**Ergebnis**
- Einzelbetrieb `Protokoll` nachweisbar

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 10.2 – Szenario B testen
**Status:** OFFEN

**Ziel**  
BBM läuft nur mit `Restarbeiten`.

**Aufgaben**
- Modulstart nur mit `Restarbeiten` prüfen

**Abhängigkeiten**
- Phase 8
- Phase 9

**Ergebnis**
- Einzelbetrieb `Restarbeiten` nachweisbar

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 10.3 – Szenario C testen
**Status:** OFFEN

**Ziel**  
BBM läuft mit beiden Modulen.

**Aufgaben**
- Parallelbetrieb `Protokoll` + `Restarbeiten` prüfen

**Abhängigkeiten**
- Schritt 10.1
- Schritt 10.2

**Ergebnis**
- Parallelbetrieb nachweisbar

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 10.4 – Szenario D vorbereiten
**Status:** OFFEN

**Ziel**  
Ein drittes Modul muss grundsätzlich möglich sein.

**Aufgaben**
- prüfen, ob ein weiteres Modul ohne Kernumbau integrierbar wäre
- Resthürden dokumentieren

**Abhängigkeiten**
- Schritt 10.3 sinnvollerweise vorbereitet

**Ergebnis**
- Modularität ist nicht nur für zwei bekannte Module gedacht

**Stand / Notiz**
Noch nicht begonnen.

---

# Phase 11 – Altbestand zurückbauen
**Status:** OFFEN

## Schritt 11.1 – Alte Fachpfade zurückbauen
**Status:** OFFEN

**Ziel**  
Nicht mehr benötigte Altpfade entfernen.

**Aufgaben**
- alte Fach-Views prüfen
- überholte Fachpfade abbauen
- Doppelstrukturen entfernen

**Abhängigkeiten**
- Phase 7
- Phase 8
- Phase 9

**Ergebnis**
- Altpfade werden nicht künstlich weitergetragen

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 11.2 – Monolithreste beseitigen
**Status:** OFFEN

**Ziel**  
Verbliebene Fachlogik aus dem Kern und Mischzonen entfernen.

**Aufgaben**
- verbliebene Fachlogik aus dem Kern herausziehen
- Mischstrukturen beenden
- versteckte Protokollzentrierung beseitigen

**Abhängigkeiten**
- Schritt 11.1

**Ergebnis**
- kein dauerhafter Mischzustand mehr

**Stand / Notiz**
Noch nicht begonnen.

---

## Schritt 11.3 – Abschlussprüfung
**Status:** OFFEN

**Ziel**  
Den erreichten Zustand gegen Zielarchitektur und Plan prüfen.

**Aufgaben**
- Ist-Zustand gegen `ARCHITECTURE.md` prüfen
- Restabweichungen dokumentieren
- offene Architektur-Schulden sichtbar machen

**Abhängigkeiten**
- Schritt 11.1
- Schritt 11.2

**Ergebnis**
- Abschlussstand dokumentiert
- Restschulden klar benannt

**Stand / Notiz**
Noch nicht begonnen.

---

## Wichtige Warnung

Der häufigste Fehlweg wäre:

- ein weiteres Fachmodul schnell dazusetzen
- den App-Kern aber protokollzentriert zu lassen
- oder eine bestehende Modul-Workbench stillschweigend als globalen Standard für andere Module zu übernehmen

Dann entsteht keine modulare Plattform, sondern nur ein weiterer Sonderfall.

Der erste echte Beweis für Modularität ist daher:

- `Protokoll` als Modul sauber schneiden
- den Kern so umbauen, dass er Fachmodule trägt
- gemeinsame Bearbeitungskerne von modulspezifischer Workbench-Logik trennen
- danach `Restarbeiten` auf denselben Rahmen setzen

---

## Arbeitsform für die Umsetzung

Die Umsetzung dieses Plans erfolgt paketweise.

Dabei gilt:

- Eine Phase wird in Arbeitspakete zerlegt.
- Ein Arbeitspaket kann mehrere aufeinander aufbauende Prompts / Schritte enthalten.
- Codex erhält pro Arbeitspaket einen Sammelprompt mit allen Schritten des Pakets.
- Diese Schritte sind von Codex nacheinander abzuarbeiten.
- Erst nach Prüfung des Gesamtergebnisses gilt ein Paket als abgeschlossen.
- Erst danach wird das nächste Paket begonnen.




## Schlussregel

Der Umbau erfolgt professionell, schrittweise und nachvollziehbar.

Nicht Ziel ist ein schneller zweiter Sonderfall.
Ziel ist eine tragfähige modulare Plattformstruktur für BBM.
