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
| 5 | App-Einstellungen und Lizenzierung zentralisieren | IN ARBEIT |
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

**Zwischenstand**
- Paket 1 bis 4 haben den App-Kern konservativ vorstrukturiert, aber keinen vollständigen Kernumbau umgesetzt.
- `src/renderer/main.js` und `src/renderer/app/Router.js` machen Kern-, Service-, Fach- und Übergangslogik sichtbarer.
- Navigation und Router wurden vorsortiert, ohne Modulregistrierung, ohne modulbasierte Navigation und ohne modulbasierte Screen-Auflösung.
- Für spätere Modulaufnahme ist nur eine sichtbare Vorstruktur vorbereitet, kein fertiger Modulrahmen.

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
Paket 1 hat `src/renderer/main.js` konservativ vorstrukturiert. Shell-/Bootstrap-Logik, service-nahe Logik und fachlich verdrahtete Altlogik sind sichtbarer getrennt; eine neue Navigation oder ein größerer Shell-Umbau wurde noch nicht begonnen. Die Shell ist damit besser lesbar vorbereitet, aber noch nicht abschließend fachlich entschlackt.

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
Paket 1 und Paket 3 haben `src/renderer/app/Router.js` konservativ vorstrukturiert. Kern-Routing, service-nahe Integrationen, fachlich/protokollzentrierte Pfade und Übergangslogik sind sichtbarer gegliedert; modulinterne Abläufe wurden noch nicht aus dem Router herausgelöst und keine modulbasierte Screen-Auflösung wurde eingeführt. Der Router ist damit besser vorbereitet, aber noch nicht auf eine reine Integrationsrolle zurückgeführt.

---

## Paket 2 – Navigation in Kernnavigation und Fachnavigation trennen
**Status:** ERLEDIGT

**Ziel**
Die Navigation in `src/renderer/main.js` so vorstrukturieren, dass Kernnavigation, fachlich/projektbezogene Navigation, aktionsbezogene Buttons und Exit-/Randaktionen klarer getrennt sind, ohne bereits eine modulbasierte Navigation einzuführen.

**Ergebnis**
- Die Navigation in `src/renderer/main.js` wurde konservativ in Kernnavigation, fachlich/projektbezogene Navigation, aktionsbezogene Buttons und Exit-/Randaktionen sichtbarer getrennt.
- Es wurde keine Modulregistrierung eingeführt.
- Es wurde keine modulbasierte Navigation eingeführt.
- Eine Router-Änderung war nicht Teil dieses Pakets; die bestehende Funktionalität sollte erhalten bleiben.

**Stand / Notiz**
Paket 2 ist als konservative Vorstrukturierung der Navigation in `src/renderer/main.js` abgeschlossen. Die Navigationsbereiche sind sichtbarer getrennt, ohne Router-Eingriffe, ohne neue Modulnavigation und ohne funktionale Neudefinition der Buttons.

---

## Paket 3 – Router auf Kern-Routing und Fachpfade zuschneiden
**Status:** ERLEDIGT

**Ziel**
`src/renderer/app/Router.js` so weiter vorbereiten, dass Kern-Routing, service-nahe Integrationen, fachlich/protokollzentrierte Pfade und Übergangslogik klarer voneinander abgegrenzt sind, ohne bereits einen Modulrahmen einzuführen.

**Ergebnis**
- `src/renderer/app/Router.js` wurde konservativ so gegliedert, dass Kern-Routing, service-nahe Integrationen, fachlich/protokollzentrierte Pfade und Übergangslogik sichtbarer getrennt sind.
- Es wurde keine Modulregistrierung eingeführt.
- Es wurde keine modulbasierte Screen-Auflösung eingeführt.
- Es wurden keine bestehenden Fachpfade gelöscht; die bestehende Funktionalität sollte erhalten bleiben.

**Stand / Notiz**
Paket 3 ist als konservative Vorstrukturierung des Routers abgeschlossen. Die interne Abschnittslogik in `src/renderer/app/Router.js` macht Kern-Routing und fachlich verdrahtete Übergangspfade sichtbarer, ohne `main.js` anzufassen oder eine tiefere fachliche Umverdrahtung vorzuziehen.

---

## Paket 4 – erste Andockstelle für spätere Modulaufnahme vorbereiten
**Status:** ERLEDIGT

**Ziel**
In `src/renderer/main.js` und vorbereitend im Zusammenspiel mit dem bestehenden Router eine kleine, konservative Andockstelle sichtbar machen, damit spätere modulbezogene Navigation sauberer anschließen kann, ohne bereits ein echtes Modulsystem einzuführen.

**Ergebnis**
- In `src/renderer/main.js` wurden sichtbare Route-/Button-Definitionen für Kernnavigation und kontextbezogene Navigation vorbereitet.
- Direkte bestehende Router-Aufrufe blieben erhalten.
- Es wurde keine Modulregistrierung eingeführt.
- Es wurde keine modulbasierte Screen-Auflösung eingeführt.
- Es wurden keine bestehenden Fachpfade gelöscht.

**Stand / Notiz**
Paket 4 ist als konservative Vorstrukturierung einer späteren Navigations-Andockstelle abgeschlossen. In `src/renderer/main.js` ist sichtbarer vorbereitet, wo spätere modulbezogene Navigation anschließen könnte, ohne eine zentrale Router-Abstraktion oder ein echtes Modulsystem einzuführen.

---

## Schritt 2.3 – Navigation entfachlichen
**Status:** IN ARBEIT

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
Paket 2 und Paket 4 haben die Navigation in `src/renderer/main.js` konservativ weiter vorbereitet. Kernnavigation, fachlich/projektbezogene Navigation, aktionsbezogene Buttons und sichtbare Route-/Button-Definitionen fuer eine spaetere modulbezogene Navigation sind klarer gegliedert; direkte bestehende Router-Aufrufe blieben erhalten, ohne Modulregistrierung, ohne modulbasierte Navigation und ohne modulbasierte Screen-Aufloesung. Die Navigation ist damit entkoppelt vorbereitet, aber noch nicht von fachlicher Verdrahtung befreit.

---

# Phase 3 – Gemeinsame Domänen sauber schneiden
**Status:** IN ARBEIT

## Schritt 3.1 – Firmen als gemeinsame Domäne schneiden
**Status:** IN ARBEIT

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
Paket 1 hat den ersten Schnitt im Renderer konservativ vorbereitet. Gemeinsame Firmen-/Stammdatenlogik in `stamm/firmen` wurde sichtbarer gemacht und gemeinsame Firmenoptionen bzw. Stammprojektionen werden staerker zentral genutzt. Projektbezogene und protokollnahe Nutzung bleibt weiterhin in den nutzenden Schichten; insbesondere `src/renderer/views/ProjectFirmsView.js` und `src/renderer/tops/data/TopsAssigneeDataSource.js` sind noch keine gemeinsame Domaene selbst, sondern weiterhin Uebergangs- bzw. Nutzungsschichten. Ein vollstaendiger Domaenenumzug wurde damit noch nicht umgesetzt.

## Paket 1 â€“ Firmenzugriffe im Renderer sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen Firmen-Zugriffspunkte im Renderer konservativ so vorbereiten, dass gemeinsame Firmen-/Stammdatenlogik sichtbarer von projektbezogener und protokollnaher Nutzung unterschieden werden kann, ohne bereits einen grossen Domaenenumbau auszuloesen.

**Ergebnis**
- `stamm/firmen` ist als gemeinsame Firmen-/Stammdatenprojektion im Renderer sichtbarer gemacht.
- Gemeinsame Firmenoptionen und Stammprojektionen werden in nutzenden Komponenten staerker zentral bezogen.
- Projektbezogene und protokollnahe Firmenlogik bleibt in den nutzenden Schichten und wurde nicht vorzeitig in eine neue Zielstruktur verschoben.

**Stand / Notiz**
Paket 1 ist als konservative Vorbereitung abgeschlossen. Im Renderer wurden die tatsaechlich zentralen Firmen-Zugriffspunkte auf wenige relevante Dateien fokussiert; gemeinsame Firmen-/Stammdatenlogik in `src/renderer/stamm/firmen` wurde sichtbarer gegliedert, waehrend `src/renderer/views/ProjectFirmsView.js` und `src/renderer/tops/data/TopsAssigneeDataSource.js` weiterhin als projektbezogene bzw. protokollnahe Uebergangs- und Nutzungsschichten kenntlich bleiben. Die bestehende Funktionalitaet wurde dabei erhalten; ein vollstaendiges Ausschneiden der gemeinsamen Firmen-Domaene ist noch offen.

---

## Schritt 3.2 – Mitarbeiter / Beteiligte als gemeinsame Domäne schneiden
**Status:** IN ARBEIT

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
Paket 2 hat den naechsten Schnitt im Renderer konservativ vorbereitet. Gemeinsame Mitarbeiter-/Beteiligten-Stammdatenlogik in `stamm/mitarbeiter` wurde sichtbarer gemacht und gemeinsame Mitarbeiteroptionen bzw. Stammprojektionen werden staerker zentral genutzt. Projektspezifische und protokollnahe Nutzung bleibt weiterhin in den nutzenden Schichten; insbesondere `src/renderer/views/ProjectFirmsView.js` und `src/renderer/meeting-participant/meetingParticipantDerivation.js` sind noch keine gemeinsame Domaene selbst, sondern weiterhin Uebergangs- bzw. Nutzungsschichten. Ein vollstaendiger Domaenenumzug wurde damit noch nicht umgesetzt.

## Paket 2 â€“ Mitarbeiter-/Beteiligtenzugriffe im Renderer sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen Mitarbeiter-/Beteiligten-Zugriffspunkte im Renderer konservativ so vorbereiten, dass gemeinsame Mitarbeiter-/Beteiligten-Stammdatenlogik sichtbarer von projektspezifischer und protokollnaher Nutzung unterschieden werden kann, ohne bereits einen grossen Domaenenumbau auszuloesen.

**Ergebnis**
- `stamm/mitarbeiter` ist als gemeinsame Mitarbeiter-/Beteiligten-Stammdatenprojektion im Renderer sichtbarer gemacht.
- Gemeinsame Mitarbeiteroptionen und Stammprojektionen werden in nutzenden Komponenten staerker zentral bezogen.
- Projektspezifische und protokollnahe Mitarbeiter-/Beteiligtenlogik bleibt in den nutzenden Schichten und wurde nicht vorzeitig in eine neue Zielstruktur verschoben.

**Stand / Notiz**
Paket 2 ist als konservative Vorbereitung abgeschlossen. Im Renderer wurden die tatsaechlich zentralen Mitarbeiter-/Beteiligten-Zugriffspunkte auf wenige relevante Dateien fokussiert; gemeinsame Mitarbeiter-/Beteiligten-Stammdatenlogik in `src/renderer/stamm/mitarbeiter` wurde sichtbarer gegliedert, waehrend `src/renderer/views/ProjectFirmsView.js` und `src/renderer/meeting-participant/meetingParticipantDerivation.js` weiterhin als projektspezifische bzw. protokollnahe Uebergangs- und Nutzungsschichten kenntlich bleiben. Die bestehende Funktionalitaet wurde dabei erhalten; ein vollstaendiges Ausschneiden der gemeinsamen Mitarbeiter-/Beteiligten-Domaene ist noch offen.

---

## Schritt 3.3 – Projekte als gemeinsame Domäne festziehen
**Status:** IN ARBEIT

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
Paket 3 hat den naechsten Schnitt im Renderer konservativ vorbereitet. Projektbezogener Runtime-/Renderer-Kontext wurde sichtbarer gemacht und der Router traegt den Projektkontext konsistenter und gibt ihn an UI-nahe Nutzung weiter. `src/renderer/ui/ProjectContextQuicklane.js` und `src/renderer/views/ProjectsView.js` bleiben weiterhin UI-nahe bzw. nutzende Schichten; `src/renderer/views/TopsScreen.js` stellt weiterhin protokollnahe Projektnutzung dar und ist noch keine gemeinsame Projektdomaene selbst. Ein vollstaendiger Domaenenumzug wurde damit noch nicht umgesetzt.

## Paket 3 â€“ Projektkontext im Renderer sichtbar festziehen
**Status:** ERLEDIGT

**Ziel**
Die zentralen Projekt-Zugriffspunkte im Renderer konservativ so vorbereiten, dass gemeinsamer Projekt-/Projektkontext sichtbarer von UI-naher und protokollnaher Nutzung unterschieden werden kann, ohne bereits einen grossen Domaenenumbau auszuloesen.

**Ergebnis**
- projektbezogener Runtime-/Renderer-Kontext ist im Renderer sichtbarer gemacht.
- der Router traegt den Projektkontext konsistenter und gibt ihn an UI-nahe Nutzung weiter.
- UI-nahe und protokollnahe Projektlogik bleibt in den nutzenden Schichten und wurde nicht vorzeitig in eine neue Zielstruktur verschoben.

**Stand / Notiz**
Paket 3 ist als konservative Vorbereitung abgeschlossen. Im Renderer wurden die tatsaechlich zentralen Projekt-Zugriffspunkte auf wenige relevante Dateien fokussiert; der projektbezogene Runtime-/Renderer-Kontext im Router wurde sichtbarer gegliedert und konsistenter an nutzende Schichten weitergegeben, waehrend `src/renderer/ui/ProjectContextQuicklane.js` und `src/renderer/views/ProjectsView.js` weiterhin UI-nahe bzw. nutzende Schichten bleiben und `src/renderer/views/TopsScreen.js` weiterhin protokollnahe Projektnutzung darstellt. Die bestehende Funktionalitaet wurde dabei erhalten; ein vollstaendiges Ausschneiden der gemeinsamen Projektdomaene ist noch offen.

---

# Phase 4 – Gemeinsame Dienste sauber schneiden
**Status:** IN ARBEIT

## Schritt 4.1 – Druck-/PDF-Infrastruktur schneiden
**Status:** IN ARBEIT

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
Paket 1 hat den ersten Dienstschnitt konservativ vorbereitet. Die technische Druck-/PDF-Infrastruktur in `src/main/ipc/printIpc.js` und `src/main/print/printData.js` wurde sichtbarer gemacht; technischer Runtime-Kontext und fachliche Dokumentinhalte wurden dort klarer getrennt. `src/renderer/ui/PrintModal.js` bleibt weiterhin UI-nahe Nutzungsschicht und nutzt den technischen Dienst, statt selbst gemeinsamer Dienst zu sein. Ein vollstaendiger Dienstumzug oder ein neuer Dienstbereich wurde damit noch nicht umgesetzt.

## Paket 1 â€“ Druck-/PDF-Zugriffe sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen Druck-/PDF-Zugriffspunkte konservativ so vorbereiten, dass gemeinsamer technischer Dienst klarer von fachlichen Ausgabeinhalten und UI-naher Nutzung unterschieden werden kann, ohne bereits einen grossen Infrastrukturumbau auszuloesen.

**Ergebnis**
- technische Druck-/PDF-Infrastruktur in `src/main/ipc/printIpc.js` und `src/main/print/printData.js` ist sichtbarer gemacht.
- technischer Runtime-Kontext und fachliche Dokumentinhalte sind dort klarer getrennt.
- `src/renderer/ui/PrintModal.js` bleibt UI-nahe Nutzungsschicht und verwendet den technischen Dienst weiter.

**Stand / Notiz**
Paket 1 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen Druck-/PDF-Zugriffspunkte wurden auf wenige relevante Dateien fokussiert; in `src/main/ipc/printIpc.js` und `src/main/print/printData.js` wurde die technische Infrastruktur sichtbarer gegliedert, waehrend `src/renderer/ui/PrintModal.js` weiterhin als UI-nahe Nutzungs- und Ablaufsteuerung erhalten bleibt. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger Dienstumzug oder ein neuer gemeinsamer Dienstbereich ist noch nicht umgesetzt.

---

## Schritt 4.2 – Mailversand schneiden
**Status:** IN ARBEIT

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
Paket 2 hat den naechsten Dienstschnitt konservativ vorbereitet. Die technische Versandlogik in `src/main/main.js` und der technische `mailto`-Fallback in `src/renderer/services/mail/sendMailPayload.js` wurden sichtbarer gemacht; fachlicher Mailaufbau und technischer Transport sind klarer getrennt. `src/renderer/ui/MainHeader.js` und `src/renderer/features/mail/MailFlow.js` bleiben weiterhin nutzende bzw. fachnahe Schichten. Ein vollstaendiger Dienstumzug oder ein neuer gemeinsamer Dienstbereich wurde damit noch nicht umgesetzt.

## Paket 2 – Mail-/Versandzugriffe sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen Mail-/Versand-Zugriffspunkte konservativ so vorbereiten, dass gemeinsamer technischer Versand klarer von fachlichen Mailinhalten und UI-naher Nutzung unterschieden werden kann, ohne bereits einen grossen Dienstumbau auszuloesen.

**Ergebnis**
- die technische Versandlogik in `src/main/main.js` ist sichtbarer gemacht.
- fachlicher Mailaufbau und technischer Transport sind klarer getrennt.
- `src/renderer/services/mail/sendMailPayload.js` ist als technischer `mailto`-Fallback klarer eingeordnet.
- `src/renderer/ui/MainHeader.js` und `src/renderer/features/mail/MailFlow.js` bleiben nutzende bzw. fachnahe Schichten.

**Stand / Notiz**
Paket 2 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen Mail-/Versand-Zugriffspunkte wurden auf wenige relevante Dateien fokussiert; in `src/main/main.js` wurde die technische Versandlogik sichtbarer gegliedert, waehrend `src/renderer/ui/MainHeader.js` und `src/renderer/features/mail/MailFlow.js` weiterhin als nutzende und fachnahe Ablaufsteuerung erhalten bleiben. `src/renderer/services/mail/sendMailPayload.js` ist als technischer `mailto`-Fallback klarer einsortiert. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger Dienstumzug oder ein neuer gemeinsamer Dienstbereich ist noch nicht umgesetzt.

---

## Schritt 4.3 – Weitere technische Zusatzdienste prüfen
**Status:** IN ARBEIT

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
Paket 3 hat den naechsten Dienstschnitt konservativ vorbereitet. Technische Zusatzdienste fuer Audio/Whisper, Projekt-Transfer und Quick Assist wurden sichtbarer gemacht; die technischen Dienst-/Addon-Einstiege in `src/main/ipc/audioIpc.js`, `src/main/ipc/projectTransferIpc.js` und `src/main/main.js` wurden klarer gegliedert. `src/main/preload.js` trennt die Renderer-Bruecken fuer Zusatzdienste klarer, waehrend `src/renderer/features/audio-dictation/DictationController.js`, `src/renderer/services/audio/TranscriptionService.js`, `src/renderer/ui/HelpModal.js` und `src/renderer/views/ProjectsView.js` weiterhin nutzende bzw. UI-nahe Schichten bleiben. Ein vollstaendiger Dienstumzug oder ein neuer Addon-Bereich wurde damit noch nicht umgesetzt.

## Paket 3 – Zusatzdienst-Zugriffe sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen technischen Zusatzdienste konservativ so vorbereiten, dass gemeinsamer technischer Dienst bzw. Addon klarer von fachnaher oder UI-naher Nutzung unterschieden werden kann, ohne bereits einen grossen Umbau oder neuen Addon-Bereich ausgeloest zu haben.

**Ergebnis**
- technische Zusatzdienste fuer Audio/Whisper, Projekt-Transfer und Quick Assist sind sichtbarer gemacht.
- die technischen Dienst-/Addon-Einstiege in `src/main/ipc/audioIpc.js`, `src/main/ipc/projectTransferIpc.js` und `src/main/main.js` sind klarer gegliedert.
- `src/main/preload.js` trennt die Renderer-Bruecken fuer Zusatzdienste klarer.
- `src/renderer/features/audio-dictation/DictationController.js`, `src/renderer/services/audio/TranscriptionService.js`, `src/renderer/ui/HelpModal.js` und `src/renderer/views/ProjectsView.js` bleiben nutzende bzw. UI-nahe Schichten.

**Stand / Notiz**
Paket 3 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen Zusatzdienst-Zugriffspunkte wurden auf wenige relevante Dateien fokussiert; technische Audio-/Whisper-, Projekt-Transfer- und Quick-Assist-Einstiege wurden sichtbarer gegliedert, waehrend die nutzenden Renderer-Schichten bewusst erhalten bleiben. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger Dienstumzug oder ein neuer gemeinsamer Addon-Bereich ist noch nicht umgesetzt.

---

# Phase 5 – App-Einstellungen und Lizenzierung zentralisieren
**Status:** IN ARBEIT

## Schritt 5.1 – App-Einstellungen zentralisieren
**Status:** IN ARBEIT

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
Paket 1 hat den ersten Kernschnitt konservativ vorbereitet. Die globale App-Einstellungslogik in `src/main/ipc/settingsIpc.js` wurde sichtbarer gemacht; globale App-Settings, projektbezogene Settings und Settings-UI-/Werkzeugfunktionen sind klarer getrennt. `src/main/preload.js` ordnet die Bruecken fuer globale und projektbezogene Settings klarer, und `src/renderer/app/Router.js` laedt sichtbarer nur die App-Kern-/Shell-relevanten globalen Settings vor. Ein vollstaendiger Zentralisierungsumbau oder ein neues Settings-System wurde damit noch nicht umgesetzt.

## Paket 1 – App-Settings-Zugriffe sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die zentralen globalen App-Einstellungs-Zugriffspunkte konservativ so vorbereiten, dass globale App-Einstellungen im App-Kern klarer von projektbezogenen Settings und UI-naher Nutzung unterschieden werden koennen, ohne bereits einen grossen Zentralisierungsumbau auszuloesen.

**Ergebnis**
- die globale App-Einstellungslogik in `src/main/ipc/settingsIpc.js` ist sichtbarer gemacht.
- globale App-Settings, projektbezogene Settings und Settings-UI-/Werkzeugfunktionen sind klarer getrennt.
- `src/main/preload.js` ordnet die Bruecken fuer globale und projektbezogene Settings klarer.
- `src/renderer/app/Router.js` laedt sichtbarer nur die App-Kern-/Shell-relevanten globalen Settings vor.

**Stand / Notiz**
Paket 1 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen App-Settings-Zugriffspunkte wurden auf wenige relevante Dateien fokussiert; in `src/main/ipc/settingsIpc.js` wurde die globale App-Einstellungslogik sichtbarer gegliedert, waehrend projektbezogene Settings getrennt bleiben und der Router nur kernrelevante globale Settings vorlaedt. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger Zentralisierungsumbau oder ein neues Settings-System ist noch nicht umgesetzt.

---

## Schritt 5.2 – Lizenzierung zentralisieren
**Status:** IN ARBEIT

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
Paket 2 hat den ersten Kernschnitt fuer die Lizenzierung konservativ vorbereitet. Die zentrale Lizenzlogik in `src/main/licensing/` wurde sichtbarer gegliedert; `src/main/ipc/licenseIpc.js` trennt Status/Diagnose, Installation und Dev-Generatorfluss klarer, und `src/main/preload.js` ordnet die Renderer-Bruecken fuer zentrale Lizenzzugaenge sowie Dev-/Werkzeugfluss besser. `docs/licensing.md` dokumentiert den aktuellen Schnitt der Lizenz-Zugriffspunkte. Ein vollstaendiger Neuaufbau oder ein finales Lizenzsystem wurde damit noch nicht umgesetzt.

## Paket 2 – Lizenzierungslogik sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die tatsaechlich zentralen Lizenzierungs-Zugriffspunkte konservativ so vorbereiten, dass zentrale Lizenzlogik im App-Kern klarer von UI-naher, fachnaher und uebergangsbezogener Nutzung unterschieden werden kann, ohne bereits einen grossen Zentralisierungsumbau oder ein neues Lizenzsystem einzufuehren.

**Ergebnis**
- die zentrale Lizenzlogik in `src/main/licensing/` wurde sichtbarer gegliedert.
- `src/main/ipc/licenseIpc.js` trennt Status/Diagnose, Installation und Dev-Generatorfluss klarer.
- `src/main/preload.js` ordnet die Renderer-Bruecken fuer zentrale Lizenzzugaenge und Dev-/Werkzeugfluss klarer.
- `docs/licensing.md` dokumentiert den aktuellen Schnitt der Lizenz-Zugriffspunkte.
- ein vollstaendiger Neuaufbau oder ein finales Lizenzsystem wurde noch nicht umgesetzt.

**Stand / Notiz**
Paket 2 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen Lizenzierungs-Zugriffspunkte wurden auf wenige relevante Dateien fokussiert; in `src/main/licensing/` wurde die Kernlogik sichtbarer gegliedert, waehrend `src/main/ipc/licenseIpc.js` Status/Diagnose, Installation und Dev-Generatorfluss klarer trennt. `src/main/preload.js` ordnet die Renderer-Bruecken fuer zentrale Lizenzzugaenge und Dev-/Werkzeugfluss besser, und `docs/licensing.md` haelt den aktuellen Schnitt der Lizenz-Zugriffspunkte fest. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger Zentralisierungsumbau oder ein finales Lizenzsystem ist noch nicht umgesetzt.

---

# Phase 6 – Gemeinsame Kernbausteine sauber schneiden
**Status:** IN ARBEIT

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

## Paket 1 – Bearbeitungskern / Editbox sichtbar schneiden
**Status:** ERLEDIGT

**Ziel**
Die tatsaechlich zentralen Bearbeitungs-Zugriffspunkte konservativ so vorbereiten, dass gemeinsamer Bearbeitungskern, protokollspezifische Workbench-Huelle und UI-nahe Verdrahtung klarer unterscheidbar werden, ohne bereits einen vollstaendigen Kernbaustein-Auszug oder ein allgemeines Workbench-System umzusetzen.

**Ergebnis**
- `src/renderer/core/editbox/EditboxShell.js` wurde sichtbarer als gemeinsamer Bearbeitungskern gegliedert.
- `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/components/TopsMetaPanel.js` und `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` unterscheiden klarer zwischen gemeinsamem Kern, protokollspezifischer Workbench-Huelle und TOP-spezifischer Meta-/Ablauflogik.
- `src/renderer/views/TopsScreen.js` bleibt weiterhin UI-/View-nahe Host- und Verdrahtungsschicht.
- Ein vollstaendiger gemeinsamer Kernbaustein-Auszug oder ein allgemein wiederverwendbares Workbench-System wurde noch nicht umgesetzt.

**Stand / Notiz**
Paket 1 ist als konservative Vorbereitung abgeschlossen. Die tatsaechlich zentralen Bearbeitungs-Zugriffspunkte wurden auf wenige relevante Renderer-Dateien fokussiert; `src/renderer/core/editbox/EditboxShell.js` wurde sichtbarer als gemeinsamer Bearbeitungskern gegliedert, waehrend `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/components/TopsMetaPanel.js` und `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` die Trennung zwischen gemeinsamem Kern, protokollspezifischer Workbench-Huelle und TOP-spezifischer Meta-/Ablauflogik klarer machen. `src/renderer/views/TopsScreen.js` bleibt bewusst UI-/View-nahe Host- und Verdrahtungsschicht. Die bestehende Funktionalitaet wurde dabei beibehalten; ein vollstaendiger gemeinsamer Kernbaustein-Auszug oder ein allgemein wiederverwendbares Workbench-System ist noch nicht umgesetzt.

---

## Schritt 6.2 – Gemeinsame Kernbausteine festziehen
**Status:** IN ARBEIT

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
Paket 1 hat den ersten Sichtbarkeits- und Trennungsschnitt konservativ vorbereitet. `src/renderer/core/editbox/EditboxShell.js` ist sichtbarer als gemeinsamer Bearbeitungskern gegliedert; `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/components/TopsMetaPanel.js` und `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` unterscheiden klarer zwischen gemeinsamem Kern, protokollspezifischer Workbench-Huelle und TOP-spezifischer Meta-/Ablauflogik. `src/renderer/views/TopsScreen.js` bleibt weiterhin UI-/View-nahe Host- und Verdrahtungsschicht. Ein vollstaendiger gemeinsamer Kernbaustein-Auszug oder ein allgemein wiederverwendbares Workbench-System wurde damit noch nicht umgesetzt.

---

## Paket 2 – gemeinsame Kernbausteine festziehen
**Status:** ERLEDIGT

**Ziel**
Die nach Paket 1 zentralen Bearbeitungs- und Metafeld-Zugriffspunkte konservativ so weiter vorbereiten, dass gemeinsamer Bearbeitungskern, wiederverwendbare Metafeld-Logik, protokollspezifische Workbench-Kopplung und UI-nahe Nutzung stabiler zugeordnet sind, ohne einen grossen Umbau oder ein neues Workbench-Framework einzufuehren.

**Ergebnis**
- Die tatsaechlich relevanten Zugriffspunkte wurden auf `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/components/TopsMetaPanel.js`, `src/renderer/tops/components/TopsResponsibleBridge.js`, `src/renderer/tops/components/TopsStatusAmpelBridge.js`, `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` und den bereits bestehenden gemeinsamen Kern in `src/renderer/core/editbox/`, `src/renderer/core/responsible/` sowie `src/renderer/core/status-ampel/` fokussiert.
- Innerhalb der TOP-seitigen Dateien wurden gemeinsame Kernnutzung, wiederverwendbare Metafeld-Bridges, protokollspezifische Meta-Draft-Kopplung und Workbench-spezifische Zugriffsregeln klarer gruppiert.
- `src/renderer/views/TopsScreen.js` bleibt weiterhin UI-/View-nahe Host- und Verdrahtungsschicht und wurde fuer dieses Paket bewusst nicht tiefer umgebaut.
- Ein grosser Datei-Umzug, ein neues Editbox-/Workbench-System oder eine vorgezogene Modulstruktur wurden nicht eingefuehrt.

**Stand / Notiz**
Paket 2 ist als konservative Festigung abgeschlossen. Der gemeinsame Bearbeitungskern bleibt in `src/renderer/core/editbox/`; die wiederverwendbaren Kernfelder fuer Verantwortlich und Status/Ampel bleiben in `src/renderer/core/responsible/` bzw. `src/renderer/core/status-ampel/`. Die TOP-seitigen Bridges und das Workbench-ViewModel machen jetzt sichtbarer, dass sie diese gemeinsamen Kernbausteine nur an die protokollspezifische Meta-Draft-Struktur und TOP-Regeln ankoppeln. Die bestehende Funktionalitaet wurde beibehalten; ein vollstaendiger gemeinsamer Kernbaustein-Auszug oder ein allgemein wiederverwendbares Workbench-System ist weiterhin nicht umgesetzt.

---

## Schritt 6.3 – Workbench-Muster vom Fachmodul trennen
**Status:** IN ARBEIT

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
Paket 3 hat den ersten Trennungsschnitt fuer das Workbench-Muster konservativ vorbereitet. `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` und `src/renderer/views/TopsScreen.js` machen sichtbarer, welche Teile als gemeinsames Workbench-Muster bzw. als UI-nahe Host-Struktur lesbar sind und welche Teile ausdruecklich als protokollspezifische Header-, Aktions-, Meta- und TOP-Regellogik im Fachmodul bleiben. Ein allgemeines Workbench-System oder ein tieferer Modulumbau wurde damit noch nicht umgesetzt.

---

## Paket 3 – Workbench-Muster vom Fachmodul trennen
**Status:** ERLEDIGT

**Ziel**
Das in der TOP-Workbench erkennbare Bearbeitungsmuster konservativ so weiter vorbereiten, dass gemeinsames Workbench-Muster, wiederverwendbare Kernbausteine, protokollspezifische Workbench-Logik und UI-nahe Host-Verdrahtung stabiler voneinander unterscheidbar werden, ohne ein allgemeines Workbench-Framework einzufuehren.

**Ergebnis**
- Die tatsaechlich relevanten Zugriffspunkte wurden auf `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` und `src/renderer/views/TopsScreen.js` begrenzt.
- `TopsWorkbench` unterscheidet jetzt klarer zwischen wiederverwendbarer Workbench-Grundstruktur, gemeinsamem Bearbeitungskern und protokollspezifischer Header-/Meta-/Draft-Huelle.
- `TopsWorkbenchViewModel` trennt sichtbarer zwischen gemeinsamem Workbench-Zustandsmuster und protokollspezifischer TOP-Action-/Meta-Bedeutung.
- `TopsScreen` bleibt bewusst UI-/View-naher Host und benennt die protokollspezifische Host-Verdrahtung ausdruecklicher.
- Ein neues Workbench-Framework, eine neue Modulstruktur oder ein tiefer API-Umbau wurden nicht eingefuehrt.

**Stand / Notiz**
Paket 3 ist als konservative Mustertrennung abgeschlossen. Das wiederverwendbare Muster bleibt weiterhin nur als interne Ordnung innerhalb der heutigen TOP-Workbench sichtbar; die eigentlichen TOP-Aktionen, TOP-Meta-Regeln, TOP-Draft-Zuschnitte und Screen-Commands bleiben klar beim Fachmodul `Protokoll`. Die bestehende Funktionalitaet wurde beibehalten. Fuer spaetere Arbeit ist nun besser lesbar, welche Teile als gemeinsames Muster taugen koennten und welche nicht stillschweigend zum globalen Standard werden duerfen.

---

# Phase 7 – Modul `Protokoll` sauber ausschneiden
**Status:** OFFEN

## Schritt 7.1 – Modulgrenze `Protokoll` festlegen
**Status:** IN ARBEIT

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
Paket 1 hat den ersten Grenzschnitt konservativ vorbereitet. In den heute zentralen Zugriffspunkten fuer `TopsScreen`, Router/Host, Tops-Domain/Data und angrenzende gemeinsame Bausteine ist sichtbarer gemacht, was eindeutig zum Fachmodul `Protokoll` gehoert, was gemeinsame Kernbausteine oder gemeinsame Domaenen/Dienste nutzt und was weiterhin App-Kern-, Host- oder Uebergangslogik bleibt. Ein grosser Modulumzug oder eine neue Modulstruktur wurde damit noch nicht begonnen.

---

## Paket 1 – Modulgrenze `Protokoll` festlegen
**Status:** ERLEDIGT

**Ziel**
Die fachliche und technische Modulgrenze von `Protokoll` konservativ so vorbereiten, dass klarer sichtbar wird, welche Teile eindeutig zum Fachmodul `Protokoll` gehoeren und welche ausdruecklich im App-Kern, in gemeinsamen Domaenen, in gemeinsamen Diensten oder in gemeinsamen Kernbausteinen bleiben.

**Ergebnis**
- Die tatsaechlich relevanten Zugriffspunkte wurden auf `src/renderer/views/TopsScreen.js`, `src/renderer/tops/domain/TopsCommands.js`, `src/renderer/tops/domain/TopsCloseFlow.js`, `src/renderer/tops/data/TopsRepository.js`, `src/renderer/tops/data/TopsAssigneeDataSource.js` und `src/renderer/app/Router.js` begrenzt.
- `TopsScreen` ist sichtbarer als Screen-Host des Fachmoduls `Protokoll` gegliedert, ohne ihn bereits in eine neue Modulstruktur zu verschieben.
- `tops/domain` und `tops/data` sind ausdruecklicher als modulinterner Unterbau markiert.
- `Router.js` macht klarer, dass der Router nur den Screen-Einstieg hostet und nicht der Ort des internen Protokoll-Modulunterbaus ist.
- `TopsCloseFlow` und `TopsAssigneeDataSource` machen sichtbarer, wo das Modul gemeinsame Dienste bzw. gemeinsame Domaenen nutzt und wo heute noch Uebergangsschichten liegen.
- Ein verfruehter Gesamtumzug, eine neue Modul-Registry oder ein globaler Architekturpfad wurden nicht eingefuehrt.

**Stand / Notiz**
Paket 1 ist als erster sichtbarer Grenzschnitt abgeschlossen. Das Fachmodul `Protokoll` ist im aktuellen Bestand jetzt lesbarer als Zusammenspiel aus Screen, modulinterner Domain/Data-Logik und TOP-Regeln erkennbar, waehrend gemeinsamer Bearbeitungskern, gemeinsame Domaenen, gemeinsame Dienste und App-Kern-/Host-Logik ausdruecklich ausserhalb bleiben. Die bestehende Funktionalitaet wurde beibehalten; die eigentliche technische Modulstruktur fuer `Protokoll` ist weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 7.2 – `TopsScreen` richtig einordnen
**Status:** IN ARBEIT

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
Paket 2 hat den naechsten Einordnungsschnitt konservativ vorbereitet. `src/renderer/views/TopsScreen.js` macht sichtbarer, dass `TopsScreen` nur der Arbeitsscreen des Moduls `Protokoll` ist, waehrend modulinterner Unterbau, gemeinsame Kernbausteine, gemeinsame Domaenen, gemeinsame Dienste und Router-/Host-Logik ausdruecklich ausserhalb bleiben. Ein Modulumzug oder ein allgemeines Screen-Framework wurde damit noch nicht begonnen.

---

## Paket 2 – `TopsScreen` richtig einordnen
**Status:** ERLEDIGT

**Ziel**
`src/renderer/views/TopsScreen.js` konservativ so weiter vorbereiten, dass klarer sichtbar wird: `TopsScreen` ist der Arbeitsscreen des Fachmoduls `Protokoll` und nicht selbst das Modul, nicht der App-Kern und nicht ein allgemeines globales Workbench-System.

**Ergebnis**
- Die tatsaechlich relevanten Zugriffspunkte wurden auf `src/renderer/views/TopsScreen.js`, `src/renderer/app/Router.js` und die bereits vorhandenen modulinternen bzw. gemeinsamen Unterbauten rund um `src/renderer/tops/` begrenzt.
- `TopsScreen` ist sichtbarer in Screen-Host, modulinterne Runtime-Zusammenstellung, Workbench-Host-Bruecke, Host-/Kontextintegration und UI-nahe Zustandssynchronisation gegliedert.
- Kleine interne Hilfsstrukturen machen lesbarer, welche Verdrahtung direkt zu `TopsScreen` als Arbeitsscreen gehoert und welche Teile nur gemeinsame Kernbausteine oder gemeinsame Domaenen/Dienste anbinden.
- `Router.js` macht noch klarer, dass der Router nur den Einstieg in den Protokoll-Arbeitsscreen hostet und nicht den internen Modulunterbau oder ein allgemeines Workbench-System.
- Eine neue Modulstruktur, ein globales Screen-Framework oder ein tiefer API-Umbau wurden nicht eingefuehrt.

**Stand / Notiz**
Paket 2 ist als konservative Einordnung abgeschlossen. `TopsScreen` ist im aktuellen Bestand jetzt lesbarer als UI-/View-naher Arbeitsscreen des Moduls `Protokoll` erkennbar. Der modulinterne Unterbau bleibt in `src/renderer/tops/`, gemeinsame Bearbeitungskerne und gemeinsame Domaenen bleiben ausdruecklich ausserhalb, und der Router bleibt App-Kern-/Screen-Host statt Protokoll-Modul selbst. Die bestehende Funktionalitaet wurde beibehalten; ein technischer Modulumzug nach `modules/protokoll/` ist weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 7.3 – Editbox und Workbench im Protokoll richtig schneiden
**Status:** IN ARBEIT

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
Paket 3 hat den naechsten Trennungsschnitt konservativ vorbereitet. In den relevanten Zugriffspunkten rund um `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` und `src/renderer/views/TopsScreen.js` ist sichtbarer gemacht, was gemeinsamer Bearbeitungskern bleibt, was hoechstens als Workbench-Muster taugt und was ausdruecklich Protokoll-Workbench bzw. TOP-spezifische Fachlogik bleibt. Ein Framework-Umbau oder Modulumzug wurde damit noch nicht begonnen.

---

## Paket 3 – Editbox und Workbench im Protokoll richtig schneiden
**Status:** ERLEDIGT

**Ziel**
Im Kontext des Fachmoduls `Protokoll` den aktuellen Bestand konservativ so weiter vorbereiten, dass gemeinsamer Bearbeitungskern, wiederverwendbares Workbench-Muster, Protokoll-Workbench und TOP-spezifische Fachlogik stabiler voneinander getrennt lesbar werden, ohne neue Frameworks, Datei-Verschiebungen oder einen Modulumzug einzufuehren.

**Ergebnis**
- Die tatsaechlich relevanten Zugriffspunkte wurden auf `src/renderer/tops/components/TopsWorkbench.js`, `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js`, `src/renderer/views/TopsScreen.js` und den bereits bestehenden gemeinsamen Bearbeitungskern in `src/renderer/core/editbox/EditboxShell.js` begrenzt.
- `TopsWorkbench` gruppiert klarer zwischen gemeinsamem Editbox-Kern im Workbench-Rahmen, protokollspezifischer Workbench-Huelle, Meta-Bridges und TOP-bezogenen Aktionszustaenden.
- `TopsWorkbenchViewModel` unterscheidet lesbarer zwischen gemeinsamem Bearbeitungs-/Workbench-Muster, Protokoll-Workbench-Struktur und ausdruecklicher TOP-Fachlogik wie Titel-Level-1-Regeln, Meta-Zuschnitt und TOP-Aktionsfreigaben.
- `TopsScreen` bleibt UI-/View-nahe Host-Schicht und macht sichtbarer, dass es nur das Screen-VM fuer die Protokoll-Workbench zusammensetzt, nicht aber selbst den gemeinsamen Bearbeitungskern oder ein allgemeines Workbench-System bereitstellt.
- Ein neues allgemeines Workbench-Framework, ein App-Kern-Umbau oder eine neue Modulstruktur wurden nicht eingefuehrt.

**Stand / Notiz**
Paket 3 ist als konservative Trennung abgeschlossen. Der generische Editbox-Kern bleibt ausserhalb des Fachmoduls wiederverwendbar. Das erkennbare Workbench-Muster bleibt weiterhin nur als interne Ordnung lesbar. Die konkrete TOP-Workbench, ihre Buttons, Meta-Huelle, Draft-Zuschnitte und TOP-Regelwirkungen bleiben klar im Fachmodul `Protokoll`. Die bestehende Funktionalitaet wurde beibehalten; ein technischer Modulumzug nach `modules/protokoll/` ist weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 7.4 – Modulstruktur `Protokoll` anlegen
**Status:** IN ARBEIT

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
Paket 4 hat die technische Heimat fuer `src/renderer/modules/protokoll/` konservativ angelegt. Die Struktur ist jetzt sichtbar vorhanden, enthaelt aber bewusst nur einen kleinen Modul-Einstieg und einen Screen-Anker auf den heutigen `TopsScreen`; ein Vollumzug des bestehenden Tops-Unterbaus wurde noch nicht begonnen.

---

## Paket 4 – Modulstruktur `Protokoll` anlegen
**Status:** ERLEDIGT

**Ziel**
Fuer das Fachmodul `Protokoll` erstmals eine minimale, aber echte technische Modulstruktur anlegen, an die spaetere Umzuege sauber anschliessen koennen, ohne den bestehenden Tops-Unterbau bereits gross umzuziehen.

**Ergebnis**
- `src/renderer/modules/protokoll/` wurde als technische Heimat angelegt.
- Mit `src/renderer/modules/protokoll/index.js` existiert jetzt ein kleiner Modul-Einstieg fuer `Protokoll`.
- Mit `src/renderer/modules/protokoll/screens/TopsScreen.js` und `src/renderer/modules/protokoll/screens/index.js` existiert eine konservative Andockstelle fuer den heutigen Arbeitsscreen, ohne dessen Bestandsdatei bereits umzuziehen.
- Die vorgesehenen Unterordner `components/`, `domain/`, `data/`, `state/`, `viewmodel/`, `dialogs/` und `rules/` wurden als Zielstruktur angelegt, aber bewusst noch nicht mit umgezogenen Bestandsdateien befuellt.
- Es wurde kein globaler Router-Umbau, keine Modul-Registry und kein Vollumzug des Tops-Unterbaus eingefuehrt.

**Stand / Notiz**
Paket 4 ist als technische Heimatstruktur abgeschlossen. Das Modul `Protokoll` besitzt jetzt einen sichtbaren Ort im Renderer-Bestand, an dem kuenftige Umzuege von Screen, Unterbau, Dialogen und Regeln sauber andocken koennen. Der aktuelle Arbeitsbestand bleibt weiterhin in seinen bisherigen Pfaden aktiv; die neue Struktur dient bewusst als kontrollierte Anschlussstelle und nicht als verfruehter Vollumzug.

---

## Schritt 7.5 – Bestehende Protokollbestandteile umziehen
**Status:** IN ARBEIT

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
Paket 5 hat den ersten echten Teil-Umzug konservativ umgesetzt. Nach `src/renderer/modules/protokoll/viewmodel/` wurden die beiden eng zusammenhaengenden Protokoll-ViewModels fuer Screen- und Workbench-Zuschnitt verschoben; die bisherigen Pfade in `src/renderer/tops/viewmodel/` bleiben als Uebergangs-Re-Exports erhalten. Ein Vollumzug des Tops-Unterbaus wurde damit bewusst noch nicht begonnen.

---

## Paket 5 – bestehende Protokollbestandteile umziehen
**Status:** ERLEDIGT

**Ziel**
Einen ersten kleinen, stabilen und nachvollziehbaren Teil des bestehenden Protokoll-Bestands in die neue technische Heimat `src/renderer/modules/protokoll/` umziehen, ohne gemeinsame Kernbausteine, gemeinsame Domaenen, gemeinsame Dienste oder App-Kernlogik mitzuziehen.

**Ergebnis**
- Als erste kleine Umzugsmenge wurden `src/renderer/tops/viewmodel/TopsScreenViewModel.js` und `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` gewaehlt.
- Beide Dateien gehoeren eindeutig zum Fachmodul `Protokoll`, haengen eng zusammen, enthalten keinen gemeinsamen Kernbaustein und haben nur begrenzte direkte Abhaengigkeiten.
- Die Implementierungen liegen jetzt real unter `src/renderer/modules/protokoll/viewmodel/`.
- Die bisherigen Pfade unter `src/renderer/tops/viewmodel/` wurden zu konservativen Re-Export-Ankern reduziert, damit bestehende Nutzung nicht hart bricht.
- `src/renderer/views/TopsScreen.js` nutzt den neuen Modulpfad fuer diese ViewModels bereits direkt und macht damit die Modulstruktur sichtbar produktiver, ohne einen breiten Import-Umbau ausgeloest zu haben.
- Gemeinsame Kernbausteine, gemeinsame Domaenen, gemeinsame Dienste, Router-/App-Kernlogik und der restliche Tops-Unterbau wurden bewusst nicht mit umgezogen.

**Stand / Notiz**
Paket 5 ist als erster kontrollierter Teil-Umzug abgeschlossen. Die neue Modulstruktur unter `src/renderer/modules/protokoll/` traegt jetzt erstmals echten fachlichen Bestand. Gleichzeitig bleiben die bisherigen Pfade als Uebergang lesbar und nutzbar. Der Umzugsstand wird bewusst nicht uebertrieben: Screen, Komponenten, Domain/Data, Dialoge und Regeln liegen weiterhin im Bestandsbereich und sind spaeteren Paketen vorbehalten.

---

## Schritt 7.6 – Modul-Einstieg definieren
**Status:** IN ARBEIT

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
Paket 6 hat den heute vorhandenen Einstieg in `src/renderer/modules/protokoll/` konservativ geschaerft. Der Modul-Einstieg benennt jetzt klarer Modulkennung, Arbeitsscreen und bereits umgezogenen modulinternen Bestand, ohne eine globale Modulregistrierung, dynamische Modulaufloesung oder Plattformmechanik einzufuehren.

---

## Paket 6 – Modul-Einstieg definieren
**Status:** ERLEDIGT

**Ziel**
Fuer `src/renderer/modules/protokoll/` einen kleinen, klaren und fachlich passenden Modul-Einstieg definieren, ohne Phase 8 mit globaler Modulregistrierung oder dynamischer Modulaufloesung vorwegzunehmen.

**Ergebnis**
- Als zentrale Einstiegspunkte wurden `src/renderer/modules/protokoll/index.js`, `src/renderer/modules/protokoll/screens/index.js`, `src/renderer/modules/protokoll/screens/TopsScreen.js` und `src/renderer/modules/protokoll/viewmodel/index.js` fokussiert.
- `index.js` macht jetzt sichtbarer, was der heutige Modul-Einstieg leisten darf: Modulkennung, Modulbezeichnung, Arbeitsscreen-ID, Arbeitsscreen-Zugriff und Sicht auf bereits umgezogenen modulinternen Bestand.
- Der Modul-Einstieg benennt ausdruecklich nur den heutigen Arbeitsscreen `TopsScreen` und die bereits real umgezogenen ViewModels; der restliche Bestand bleibt weiterhin ausserhalb und spaeteren Umzugspaketen vorbehalten.
- Es wurde keine globale Modul-Registry, keine dynamische Modulaufloesung, keine modulbasierte Plattformmechanik und kein Vollumzug eingefuehrt.

**Stand / Notiz**
Paket 6 ist als konservative Scharfstellung abgeschlossen. `src/renderer/modules/protokoll/` ist jetzt als echter kleiner Modul-Einstieg lesbar: Der Einstieg fasst den aktuellen Arbeitsscreen des Moduls und den bereits umgezogenen modulinternen Bestand sauber zusammen. Router/App-Kern, gemeinsame Kernbausteine, gemeinsame Domaenen, gemeinsame Dienste und der grosse Rest des Protokoll-Unterbaus bleiben weiterhin ausdruecklich ausserhalb.

---

# Phase 8 – Modulrahmen produktiv machen
**Status:** OFFEN

## Schritt 8.1 – Modulkatalog einführen
**Status:** IN ARBEIT

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
Paket 1 hat den ersten kleinen Modulkatalog im App-Kern konservativ angelegt. Unter `src/renderer/app/modules/` gibt es jetzt eine statische Katalogschicht, die `Protokoll` als aktives Modul fuehrt; dynamische Aufloesung, modulbasierte Navigation und Plattformmechanik wurden dabei bewusst noch nicht eingefuehrt.

---

## Paket 1 – Modulkatalog einführen
**Status:** ERLEDIGT

**Ziel**
Einen kleinen, klaren und tragfaehigen Modulkatalog einfuehren, der aktive Module im App-Kern sichtbar und strukturiert fuehrt, ohne Phase 8.2 und 8.3 mit dynamischer Aufloesung, modulbasierter Navigation oder Plattformmechanik vorwegzunehmen.

**Ergebnis**
- Als zentrale Einstiegspunkte wurden `src/renderer/modules/protokoll/index.js` als Fachmodul-Einstieg und `src/renderer/app/modules/` als passende kleine Katalogschicht im App-Kern identifiziert.
- Mit `src/renderer/app/modules/moduleCatalog.js` existiert jetzt ein kleiner statischer Modulkatalog.
- Der Katalog fuehrt aktuell genau ein aktives Modul: `Protokoll`.
- Es gibt nur kleine Kataloghilfen fuer Lesen und Nachschlagen (`getActiveModuleCatalog`, `getActiveModuleIds`, `findActiveModuleEntry`, `hasActiveModule`).
- Router/App-Kern, Screen-Aufloesung, Navigation und Shell bleiben weiterhin ausserhalb dieser Katalogschicht und wurden nicht auf modulbasierte Mechanik umgebaut.
- Es wurde keine dynamische Discovery, keine globale Plattformmechanik und kein zweites Fachmodul vorweggenommen.

**Stand / Notiz**
Paket 1 ist als konservative Katalogeinfuehrung abgeschlossen. Der App-Kern besitzt jetzt erstmals eine echte, kleine Katalogschicht fuer aktive Module. `Protokoll` ist dort sauber ueber seinen bestehenden Moduleinstieg angebunden. Die Katalogschicht bleibt bewusst statisch und klein; modulbasierte Screen-Aufloesung und Navigation sind weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 8.2 – Modul-/Screen-Auflösung einführen
**Status:** IN ARBEIT

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
Paket 2 hat die erste kleine modulbezogene Screen-Aufloesung konservativ eingefuehrt. Im App-Kern gibt es jetzt eine kleine Resolver-Schicht, ueber die der Protokoll-Arbeitsscreen aus dem aktiven Modulkatalog aufgeloest werden kann; modulbasierte Navigation oder eine breitere Plattformmechanik wurden dabei bewusst noch nicht eingefuehrt.

---

## Paket 2 – Modul-/Screen-Auflösung einführen
**Status:** ERLEDIGT

**Ziel**
Eine kleine, klare und konservative Aufloesungsschicht einfuehren, ueber die der Kern einen Screen eines aktiven Moduls gezielter ansprechen kann, ohne modulbasierte Navigation oder eine allgemeine Plattformmechanik vorwegzunehmen.

**Ergebnis**
- Als zentrale Einstiegspunkte wurden `src/renderer/app/modules/moduleCatalog.js`, `src/renderer/modules/protokoll/index.js`, `src/renderer/app/modules/moduleScreenResolver.js` und der bestehende Kernpfad `src/renderer/app/Router.js` identifiziert.
- Mit `src/renderer/app/modules/moduleScreenResolver.js` existiert jetzt eine kleine Resolver-Schicht fuer aktive Modul-Screens.
- Der Resolver arbeitet bewusst einfach ueber `moduleId` und `screenId` gegen den statischen Modulkatalog.
- `Protokoll` ist darueber jetzt ueber `PROTOKOLL_MODULE_ID` und `PROTOKOLL_WORK_SCREEN_ID` sauber erreichbar.
- `Router.showTops()` nutzt diese kleine Aufloesung jetzt konservativ fuer den Protokoll-Arbeitsscreen, faellt aber weiterhin defensiv auf den bisherigen Bestands-Pfad zurueck.
- Es wurde keine modulbasierte Navigation, keine dynamische Discovery, keine globale Plattformmechanik und kein grosser Router-Umbau eingefuehrt.

**Stand / Notiz**
Paket 2 ist als konservative Screen-Aufloesung abgeschlossen. Der App-Kern kann jetzt erstmals einen Screen eines aktiven Moduls ueber eine kleine definierte Aufloesungsschicht erreichen. `Protokoll` ist darueber sauber angebunden. Navigation, Shell und breitere Plattformmechanik bleiben weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 8.3 – Modulnavigation dynamisch machen
**Status:** IN ARBEIT

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
Paket 3 hat die erste kleine modulbezogene Navigation konservativ vorbereitet. Der App-Kern kann projektbezogene Modulnavigation jetzt aus aktiven Modulen ableiten; `Protokoll` wird darueber sichtbar, waehrend Kernnavigation und Fachaktionen weiterhin getrennt bleiben. Eine grosse Plattformnavigation wurde dabei bewusst noch nicht eingefuehrt.

---

## Paket 3 – Modulnavigation dynamisch machen
**Status:** ERLEDIGT

**Ziel**
Die bestehende Navigation im Kern erstmals kontrolliert teilweise aus aktiven Modulen speisen, ohne einen grossen Shell-Umbau, eine Plattformnavigation im grossen Stil oder eine breite Modulmechanik einzufuehren.

**Ergebnis**
- Als zentrale Einstiegspunkte wurden `src/renderer/modules/protokoll/index.js`, `src/renderer/app/modules/moduleCatalog.js`, `src/renderer/app/modules/moduleNavigation.js` und `src/renderer/main.js` fokussiert.
- Das Fachmodul `Protokoll` definiert jetzt eine kleine projektbezogene Navigationsdefinition in seinem Moduleinstieg.
- Mit `src/renderer/app/modules/moduleNavigation.js` existiert jetzt eine kleine Ableitungsschicht fuer modulbezogene Projektnavigation aus aktiven Modulen.
- `src/renderer/main.js` speist den modulbezogenen Teil der bestehenden Projektnavigation jetzt konservativ aus dieser Ableitung, waehrend Kernnavigation und Fachaktionsbuttons getrennt bleiben.
- `Protokoll` wird darueber sichtbar ueber den Eintrag `Protokolle`; mit Meeting-Kontext fuehrt er in den Arbeitsscreen, sonst in die bestehende Protokoll-/Meeting-Uebersicht.
- Es wurde keine grosse Plattformnavigation, keine dynamische Discovery, kein Vollumbau des Routers und kein zweites Modul vorweggenommen.

**Stand / Notiz**
Paket 3 ist als konservative modulbezogene Navigation abgeschlossen. Die Navigation kann jetzt erstmals einen kleinen Teil ihrer projektbezogenen Eintraege aus aktiven Modulen ableiten. `Protokoll` ist darueber sichtbar, ohne dass Kernnavigation, Fachaktionen oder die restliche Shell-Struktur in eine grosse Plattformmechanik ueberfuehrt wurden.

---

# Phase 9 – Modul `Restarbeiten` aufbauen
**Status:** OFFEN

## Schritt 9.1 – Fachschnitt `Restarbeiten` definieren
**Status:** IN ARBEIT

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
Paket 1 hat den fachlichen Schnitt fuer `Restarbeiten` konservativ vorbereitet. In den verbindlichen Architekturleitplanken ist jetzt sichtbarer festgehalten, was fachlich zu `Restarbeiten` gehoeren soll, was ausdruecklich beim Modul `Protokoll` bleibt und was weiterhin gemeinsame Kernbausteine, Domaenen, Dienste oder App-Kern bleibt; ein technischer Modulaufbau oder Dateiumzug wurde dabei bewusst noch nicht begonnen.

---

## Paket 1 – Fachschnitt `Restarbeiten` definieren
**Status:** ERLEDIGT

**Ziel**
Den fachlichen Zuschnitt des geplanten Moduls `Restarbeiten` im heutigen Bestand sauber und belastbar sichtbar machen, ohne bereits eine technische Modulstruktur, einen Umzug oder neue Plattformmechanik einzufuehren.

**Ergebnis**
- Als minimale fachlich relevante Zugriffspunkte wurden die verbindliche Architekturgrundlage in `ARCHITECTURE.md` sowie die heutigen Protokoll-/Kern-/Katalog-Anker im Bestand identifiziert.
- In `ARCHITECTURE.md` ist jetzt klarer beschrieben, was fachlich zu `Restarbeiten` gehoeren soll:
  - offene Arbeiten und offene Punkte als eigener Arbeitsgegenstand
  - eigene Uebersichts-, Listen-, Bearbeitungs- und Abschlusslogik
  - eigene fachliche Ausgabeinhalte fuer Restarbeiten
- Gleichzeitig ist ausdruecklich festgehalten, was bei `Protokoll` bleibt:
  - Protokollkopf und Teilnehmerbezug
  - TOP-Hierarchie, TOP-Nummerierung und TOP-Regeln
  - `TopsScreen` und die konkrete Protokoll-Workbench
  - protokollbezogene Ausgabeablaeufe
- Ebenso ist sichtbarer festgelegt, was weiterhin ausserhalb beider Fachmodule bleibt:
  - gemeinsamer Bearbeitungskern
  - gemeinsame Domaenen
  - gemeinsame Dienste
  - App-Kern, Router, Shell, Modulkatalog und Screen-Aufloesung
- Es wurde bewusst keine technische Modulstruktur fuer `Restarbeiten`, kein Dateiumzug und kein Router-/Navigationsumbau eingefuehrt.

**Stand / Notiz**
Paket 1 ist als fachliche Grenzziehung abgeschlossen. `Restarbeiten` ist jetzt im Zielbild nicht mehr nur als weiteres Modul benannt, sondern mit einem konservativen fachlichen Schnitt beschrieben. Die technische Heimat, der erste Umzug und eine eigene Workbench bleiben weiterhin den naechsten Paketen vorbehalten.

---

## Schritt 9.2 – Modulstruktur `Restarbeiten` anlegen
**Status:** IN ARBEIT

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
Paket 2 hat die minimale technische Heimat fuer `src/renderer/modules/restarbeiten/` angelegt. Es gibt jetzt einen kleinen Modul-Einstieg und einen konservativen Screen-Anker; ein technischer Vollausbau, ein Dateiumzug oder eine Router-/Navigationsanbindung wurden dabei bewusst noch nicht begonnen.

---

## Paket 2 – Modulstruktur `Restarbeiten` anlegen
**Status:** ERLEDIGT

**Ziel**
Fuer `Restarbeiten` eine kleine reale Modulstruktur anlegen, die als technische Heimat fuer spaetere Ausbauschritte dient, ohne bereits einen Vollumzug, neue Plattformmechanik oder eine modulbezogene Navigation einzufuehren.

**Ergebnis**
- Unter `src/renderer/modules/restarbeiten/` existiert jetzt eine echte minimale Struktur.
- Mit `src/renderer/modules/restarbeiten/index.js` gibt es einen kleinen Moduleinstieg mit Modulkennung, Modulbezeichnung und Arbeitsscreen-ID.
- Mit `src/renderer/modules/restarbeiten/screens/index.js` gibt es einen konservativen Screen-Anker fuer den spaeteren Arbeitsscreen.
- `src/renderer/modules/restarbeiten/README.md` dokumentiert ausdruecklich, dass es sich nur um die technische Heimat und noch nicht um einen Vollausbau handelt.
- Es wurde kein Dateiumzug aus bestehendem Bestand vorgenommen.
- Es wurde keine modulbezogene Navigation fuer `Restarbeiten` eingefuehrt.
- Es wurde kein Router-Grossumbau und keine Plattformmechanik eingefuehrt.

**Stand / Notiz**
Paket 2 ist als kleiner technischer Heimataufbau abgeschlossen. `Restarbeiten` besitzt jetzt erstmals einen realen Modulordner mit Einstiegspunkt und Screen-Anker. Der eigentliche fachliche Bestand, eine spaetere Workbench und moegliche Anbindungen an Kernnavigation oder Screen-Aufloesung bleiben weiterhin den folgenden Paketen vorbehalten.

---

## Schritt 9.3 – Eigene Restarbeiten-Workbench bauen
**Status:** IN ARBEIT

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
Paket 3 hat die erste kleine eigenstaendige `Restarbeiten`-Workbench konservativ aufgebaut. Sie nutzt den gemeinsamen Editbox-Kern sowie neutrale Feldbausteine fuer Verantwortlich und Status/Ampel, bleibt aber klar von der TOP-/Protokoll-Workbench getrennt; Vollausbau, produktive Integration und breitere Datenanbindung wurden bewusst noch nicht begonnen.

---

## Paket 3 – Eigene Restarbeiten-Workbench bauen
**Status:** ERLEDIGT

**Ziel**
Eine kleine eigenstaendige fachliche Workbench fuer `Restarbeiten` auf Basis gemeinsamer Kernbausteine anlegen, ohne die Protokoll-Workbench zu kopieren oder einen grossen Modul- und Routerausbau vorzuziehen.

**Ergebnis**
- Als gemeinsame Kernbausteine wurden der generische Editbox-Kern in `src/renderer/core/editbox/`, das neutrale Feld `ResponsibleField` und das neutrale Feld `StatusAmpelField` wiederverwendet.
- Ausdruecklich nicht uebernommen wurden Protokoll-/TOP-spezifische Teile wie `TopsWorkbench`, TOP-Aktionsbuttons, TOP-Draft-Strukturen, Meta-Bridges und TOP-Regeln.
- Unter `src/renderer/modules/restarbeiten/components/` gibt es jetzt mit `RestarbeitenWorkbench.js` eine erste fachlich eigenstaendige Bearbeitungsflaeche fuer offene Arbeiten.
- Die Workbench besitzt einen eigenen Draft-Zuschnitt fuer Restarbeiten, eigene lokale Aktionen und eine eigene Meta-Zuordnung, ohne Protokoll-Logik mitzuziehen.
- Der bisherige Screen-Anker wurde ueber `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js` und `src/renderer/modules/restarbeiten/screens/index.js` sinnvoll angeschlossen; die Modulstruktur traegt damit jetzt echten fachlichen Inhalt.
- Es wurde kein Router-Grossumbau, keine modulbezogene Navigation fuer `Restarbeiten` und kein technischer Vollausbau des Moduls eingefuehrt.

**Stand / Notiz**
Paket 3 ist als erster fachlicher Ausbau abgeschlossen. `Restarbeiten` besitzt jetzt innerhalb seiner Modulstruktur eine echte kleine Workbench, die gemeinsame Kernbausteine nutzt, aber nicht mehr nur ein leerer Modulrahmen ist. Produktive Datenanbindung, eigene Navigation und spaetere Modul-Integration bleiben weiterhin folgenden Paketen vorbehalten.

---

## Schritt 9.4 – Modul-Einstieg definieren
**Status:** IN ARBEIT

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
Paket 4 hat den kleinen Moduleinstieg von `Restarbeiten` konservativ geschaerft. Der Einstieg beschreibt jetzt klarer, welchen Arbeitsscreen und welchen bereits vorhandenen Modulbestand `Restarbeiten` heute schon bereitstellt; Navigation, Router-Anbindung und breitere Integration wurden dabei bewusst noch nicht eingefuehrt.

---

## Paket 4 – Modul-Einstieg `Restarbeiten` definieren
**Status:** ERLEDIGT

**Ziel**
Fuer `src/renderer/modules/restarbeiten/` einen kleinen, klaren und fachlich passenden Moduleinstieg herstellen, der den heutigen Ausbaustand lesbar macht, ohne Navigation, Router-Anbindung oder Plattformmechanik vorwegzunehmen.

**Ergebnis**
- Als zentrale Einstiegspunkte wurden `src/renderer/modules/restarbeiten/index.js`, `src/renderer/modules/restarbeiten/screens/index.js`, `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js` und `src/renderer/modules/restarbeiten/components/RestarbeitenWorkbench.js` fokussiert.
- Der Moduleinstieg benennt jetzt klarer:
  - Modulkennung und Modulbezeichnung
  - Arbeitsscreen-ID und Arbeitsscreen-Bezeichnung
  - den bereits vorhandenen modulinternen Bestand unter `components/`
  - den heutigen kleinen Faehigkeitsstand des Moduls ohne Navigation und ohne Router-Integration
- Die Exportstruktur ist lesbarer:
  - Root-Exporte fuer den Arbeitsscreen
  - Root-Exporte fuer die bestehende Restarbeiten-Workbench
  - klarer Screen-Einstieg ueber `screens/index.js`
- Es wurde keine modulbezogene Navigation fuer `Restarbeiten`, keine produktive Router-Anbindung, keine breite Integration und kein Vollausbau eingefuehrt.

**Stand / Notiz**
Paket 4 ist als konservative Scharfstellung abgeschlossen. `src/renderer/modules/restarbeiten/` ist jetzt als echter kleiner Moduleinstieg lesbar: Der Einstieg fasst den heutigen Arbeitsscreen, die erste fachliche Workbench und den kleinen aktuellen Leistungsstand des Moduls sauber zusammen. Gemeinsame Kernbausteine, Domaenen, Dienste und App-Kern bleiben weiterhin ausdruecklich ausserhalb.

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
**Status:** IN ARBEIT

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
Paket 1 hat den ersten konservativen Einzelbetriebsnachweis fuer `Restarbeiten` hergestellt. Das Modul ist jetzt im aktiven Modulkatalog des Kerns sichtbar und sein Arbeitsscreen laesst sich ueber die bestehende kleine Modul-/Screen-Aufloesung separat aufloesen; breite Navigation, produktive Router-Anbindung und Vollausbau wurden dabei bewusst noch nicht eingefuehrt.

---

## Paket 1 – Einzelbetrieb `Restarbeiten` nachweisen
**Status:** ERLEDIGT

**Ziel**
In kleinem, kontrolliertem Rahmen nachweisen, dass `Restarbeiten` als eigenes Fachmodul technisch separat ansprechbar ist, ohne eine breite Integrationswelle, produktive Navigation oder grosse Plattformmechanik auszulösen.

**Ergebnis**
- Als minimale relevante Zugriffspunkte wurden `src/renderer/modules/restarbeiten/`, der bestehende Modulkatalog in `src/renderer/app/modules/moduleCatalog.js`, die kleine Screen-Aufloesung in `src/renderer/app/modules/moduleScreenResolver.js` und die vorhandene Testsuite unter `scripts/tests/` fokussiert.
- `Restarbeiten` wird jetzt im aktiven Modulkatalog des App-Kerns gefuehrt, ohne einen Navigationseintrag oder Router-Pfad zu erhalten.
- Der Einzelbetriebsnachweis erfolgt ueber einen kleinen Integrationstest:
  - Der Moduleinstieg von `Restarbeiten` ist als aktives Modul auffindbar.
  - Der Arbeitsscreen von `Restarbeiten` ist ueber die bestehende Modul-/Screen-Aufloesung separat aufloesbar.
  - Der Nachweis bleibt bewusst auf Moduleinstieg und Work-Screen begrenzt und fuehrt keine breite Integration ein.
- Es wurde keine produktive Navigation fuer `Restarbeiten`, kein grosser Router-Umbau und keine Plattformmechanik im grossen Stil eingefuehrt.

**Stand / Notiz**
Paket 1 ist als kleiner Einzelbetriebsnachweis abgeschlossen. `Restarbeiten` ist jetzt nicht nur als Modulstruktur vorhanden, sondern im App-Kern als aktives Fachmodul nachweisbar und ueber die vorhandene Modul-/Screen-Aufloesung separat ansprechbar. Die produktive Nutzung in Navigation, Shell oder breiteren Fachpfaden bleibt weiterhin spaeteren Paketen vorbehalten.

---

## Schritt 10.3 – Szenario C testen
**Status:** IN ARBEIT

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
Paket 2 hat den ersten konservativen Zusammenspiel-Nachweis fuer `Protokoll` und `Restarbeiten` hergestellt. Beide Module werden jetzt als aktive Fachmodule im gemeinsamen Modulkatalog gefuehrt und ihre jeweiligen Work-Screens lassen sich ueber die bestehende kleine Modul-/Screen-Aufloesung getrennt nachweisen; breite Navigation, Shell-Integration und Vollausbau wurden dabei bewusst noch nicht eingefuehrt.

---

## Paket 2 – Zusammenspiel `Protokoll` + `Restarbeiten` nachweisen
**Status:** ERLEDIGT

**Ziel**
In kleinem, kontrolliertem Rahmen nachweisen, dass `Protokoll` und `Restarbeiten` im aktuellen Modulrahmen nebeneinander bestehen koennen, ohne ihre Fachlogiken, Work-Screens oder Modulzustaendigkeiten zu vermischen.

**Ergebnis**
- Als minimale relevante Zugriffspunkte wurden der Modulkatalog in `src/renderer/app/modules/moduleCatalog.js`, die kleine Screen-Aufloesung in `src/renderer/app/modules/moduleScreenResolver.js`, die beiden Moduleinstiege unter `src/renderer/modules/protokoll/` und `src/renderer/modules/restarbeiten/` sowie die Testsuite unter `scripts/tests/` fokussiert.
- Ein kleiner Integrationsnachweis prueft jetzt:
  - beide Module sind gleichzeitig als aktive Module im Katalog vorhanden
  - beide Module besitzen jeweils einen eigenen Work-Screen
  - beide Work-Screens lassen sich getrennt ueber die bestehende Modul-/Screen-Aufloesung aufloesen
  - die Modulgrenzen bleiben im Katalog sichtbar verschieden
- Fuer den damaligen Testpfad wurde kurzzeitig ein kleiner Shared-Pfadanker fuer die bereits genutzte Ampel-Regel unter `src/renderer/shared/ampel/pdfAmpelRule.js` genutzt; dieser Uebergangsanker wurde spaeter wieder entfernt, ohne Fachlogik zu verschieben.
- Es wurde keine breite Navigation fuer beide Module, kein grosser Router-Umbau und keine Plattformmechanik im grossen Stil eingefuehrt.

**Stand / Notiz**
Paket 2 ist als kleiner Koexistenz-Nachweis abgeschlossen. `Protokoll` und `Restarbeiten` sind im aktuellen Modulrahmen jetzt nicht nur einzeln, sondern auch gemeinsam als getrennte aktive Fachmodule nachweisbar. Produktive Navigation, breitere Shell-Integration und weitergehende Modulinterop bleiben weiterhin spaeteren Paketen vorbehalten.

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
**Status:** IN ARBEIT

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
Paket 1 hat den ersten kleinen Altpfad-Abbau konservativ umgesetzt. Die beiden reinen Uebergangs-Re-Exports unter `src/renderer/tops/viewmodel/` fuer die bereits nach `src/renderer/modules/protokoll/viewmodel/` umgezogenen ViewModels wurden entfernt; der verbleibende Testzugriff wurde direkt auf den neuen Modulpfad umgestellt. Ein breiter Restabbau wurde damit bewusst noch nicht begonnen.

---

## Paket 1 – Erste Altpfade und Übergangs-Re-Exports abbauen
**Status:** ERLEDIGT

**Ziel**
Einen ersten kleinen, nachvollziehbaren Restmigrationsschritt umsetzen, bei dem bereits ersetzte Altpfade und unnoetige Uebergangs-Re-Exports kontrolliert reduziert werden, ohne einen breiten Altbestand-Abbau auszuloesen.

**Ergebnis**
- Als erste Abbaustelle wurden die beiden Uebergangs-Re-Exports `src/renderer/tops/viewmodel/TopsScreenViewModel.js` und `src/renderer/tops/viewmodel/TopsWorkbenchViewModel.js` gewaehlt.
- Diese Dateien waren bereits vollstaendig durch die neuen Modulpfade unter `src/renderer/modules/protokoll/viewmodel/` ersetzt und enthielten nur noch reine Re-Exports.
- Der letzte verbliebene Testzugriff wurde auf den neuen Normalpfad `src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js` umgestellt.
- Der neue Normalpfad ueber `src/renderer/modules/protokoll/viewmodel/` ist damit sichtbarer; die alten ViewModel-Altpfade unter `src/renderer/tops/viewmodel/` bestehen fuer diese beiden Dateien nicht mehr.
- App-Kern, gemeinsame Kernbausteine, gemeinsame Domaenen, gemeinsame Dienste und der restliche Protokoll-Bestand wurden bewusst nicht angetastet.

**Stand / Notiz**
Paket 1 ist als kleiner bereinigender Restmigrationsschritt abgeschlossen. Es wurde bewusst nur eine sehr kleine, risikoarme Abbaustelle angefasst: bereits ersetzte Uebergangs-Re-Exports fuer Protokoll-ViewModels. Weitere Altpfad-Abbauten bleiben spaeteren Paketen vorbehalten.

---

## Schritt 11.2 – Monolithreste beseitigen
**Status:** IN ARBEIT

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
Paket 2 hat einen kleinen technischen Mischzustand weiter reduziert. Fuer dieselbe Ampel-Regel existierten parallel ein direkter Shared-Pfad und ein zusaetzlicher Renderer-Re-Export-Anker; der betroffene Restimport nutzt jetzt den direkten Shared-Normalpfad, und der unnoetige Zwischenanker wurde entfernt.

---

## Paket 2 – Mischzustand weiter abbauen
**Status:** ERLEDIGT

**Ziel**
Einen weiteren kleinen, risikoarmen Mischzustand abbauen, bei dem alte und neue Zugriffspfade fuer denselben fachlichen Baustein unnoetig parallel weitergetragen wurden, ohne dabei einen breiten Restabbau oder Plattformumbau ausgeloest zu haben.

**Ergebnis**
- Als kleine Abbaustelle wurde die doppelte Zugriffsfuehrung fuer `pdfAmpelRule` gewaehlt.
- Fuer dieselbe Ampel-Regel existierten parallel:
  - direkte Importe auf `src/shared/ampel/pdfAmpelRule.js`
  - ein zusaetzlicher Re-Export-Anker unter `src/renderer/shared/ampel/pdfAmpelRule.js`
- Der verbliebene Restimport in `src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js` wurde auf den direkten Shared-Normalpfad umgestellt.
- Der unnoetige Renderer-Re-Export-Anker `src/renderer/shared/ampel/pdfAmpelRule.js` wurde entfernt.
- Der normale Pfad fuer diese gemeinsame Regel ist damit wieder sichtbarer: `src/shared/ampel/pdfAmpelRule.js`.
- App-Kern, gemeinsame Kernbausteine, gemeinsame Dienste, Router und weitere Modulpfade wurden bewusst nicht angetastet.

**Stand / Notiz**
Paket 2 ist als kleiner Mischzustands-Abbau abgeschlossen. Es wurde bewusst nur eine sehr kleine Parallelstruktur bereinigt, bei der der direkte Shared-Pfad bereits die eigentliche Normalform war. Weitere Restabbauten in `views/`, `tops/`, `modules/` und im App-Kern bleiben spaeteren Paketen vorbehalten.

---

## Schritt 11.3 – Abschlussprüfung
**Status:** IN ARBEIT

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
Paket 3 hat den erreichten Architektur- und Migrationsstand in den zentralen Doku-Dateien konsolidiert. Dokumentiert ist jetzt klarer, was fuer `Protokoll`, `Restarbeiten`, Modulkatalog, Screen-Aufloesung und gemeinsamen Bearbeitungskern bereits erreicht ist und welche Uebergangs- bzw. Restmischzonen bewusst noch offen bleiben.

---

## Paket 3 – Abschlussstand dokumentieren
**Status:** ERLEDIGT

**Ziel**
Den erreichten Architektur- und Migrationsstand ehrlich und belastbar dokumentieren, ohne daraus einen neuen technischen Umbau, eine kuenstliche Vollstaendigkeitsbehauptung oder eine neue Plattformmechanik abzuleiten.

**Ergebnis**
- Als zentrale Abschlussdokumente wurden `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md` fokussiert.
- In `ARCHITECTURE.md` ist jetzt ein knapper aktueller Umsetzungsstand dokumentiert:
  - `Protokoll` und `Restarbeiten` besitzen echte Moduleinstiege
  - der App-Kern fuehrt beide Module ueber einen kleinen statischen Modulkatalog
  - eine kleine Modul-/Screen-Aufloesung ist vorhanden
  - der gemeinsame Bearbeitungskern bleibt ausserhalb der Fachmodule
- Gleichzeitig ist ausdruecklich festgehalten, was noch Uebergang bleibt:
  - `TopsScreen` liegt weiter unter `src/renderer/views/`
  - grosser Protokoll-Unterbau liegt weiter unter `src/renderer/tops/`
  - produktive modulbezogene Navigation ist nur klein und bisher im Wesentlichen fuer `Protokoll` vorhanden
  - `Restarbeiten` ist noch nicht produktiv ueber Router und Navigation verdrahtet
- In `docs/MODULARISIERUNGSPLAN.md` ist der Abschlussstand fuer Phase 11 jetzt als eigene Dokumentationsleistung festgehalten.
- Restoffenheiten werden nuechtern benannt, ohne den bereits erreichten Modularisierungsstand kleinzureden.

**Stand / Notiz**
Paket 3 ist als Abschlussdokumentation abgeschlossen. Der dokumentierte Stand unterscheidet jetzt klarer zwischen bereits modularisiertem Kernrahmen, produktiv genutzter Vorbereitung und bewusst weiter bestehendem Uebergang. Es wurde kein neuer technischer Umbau vorgenommen; dokumentiert wurde nur der tatsaechlich erreichte Stand.

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
