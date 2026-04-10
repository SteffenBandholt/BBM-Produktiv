# ZUERST LESEN – Codex-Arbeitsgrundlage

Diese Datei ist die verbindliche Kurz-Arbeitsgrundlage für neue Chats / neue Codex-Läufe in diesem Repo.

Sie dient dazu, den etablierten Modularisierungs- und Migrationsstil nahtlos fortzuführen:
- konservativ
- in kleinen Paketen
- ohne unnötige Großumbauten
- mit sauberer Planpflege
- mit ehrlicher Dokumentation des tatsächlichen Stands

---

## Verbindliche Einstiegsregel für neue Chats

Jeder neue Chat und jeder neue Codex-Lauf in diesem Repo beginnt zwingend mit dem Lesen von `ZUERST_LESEN_Codex.md`.

Ohne dieses Lesen dürfen nicht begonnen werden:
- Standzusammenfassung
- Paketvorschläge
- Architektur-Einordnung
- Builder-/Reviewer-/Doc-Schritte
- Umsetzungsarbeit
- Commit-, Merge- oder Push-Vorbereitung

Erst nach dem Lesen von `ZUERST_LESEN_Codex.md` werden die weiteren Pflichtdateien in der festgelegten Reihenfolge gelesen.

Verbindliche Reihenfolge:
1. `ZUERST_LESEN_Codex.md`
2. `ARCHITECTURE.md`
3. `docs/MODULARISIERUNGSPLAN.md`
4. `README-CHATGPT.md`
5. `docs/ARBEITSMODUS-CODEX.md`
6. `docs/domain/TOP-REGELN.md`

Dabei gilt verbindlich:
- `ZUERST_LESEN_Codex.md` = verbindlicher Einstieg fuer neue Chats und neue Codex-Laeufe
- `ARCHITECTURE.md` = fuehrende Architekturgrundlage
- `docs/MODULARISIERUNGSPLAN.md` = fuehrende operative Umbau- und Planungsgrundlage

Neue Pakete duerfen verbindlich nur aus `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md` abgeleitet werden.

Vor jeder Paketwahl ist deshalb zuerst zu benennen:
1. welches relevante Endziel in `ARCHITECTURE.md` betroffen ist
2. welcher dazu passende offene Schritt in `docs/MODULARISIERUNGSPLAN.md` gehoert
3. warum dieses Paket jetzt vor anderen offenen Punkten dran ist

Vor jeder neuen Paketwahl ist zusaetzlich zuerst ein 3-Schritte-Kurzfahrplan aus `ARCHITECTURE.md` und `docs/MODULARISIERUNGSPLAN.md` abzuleiten:
1. naechster echter Schritt
2. sinnvoller Folgeschritt
3. naechster Entblocker danach

Nur Schritt 1 darf aktiv in ein Paket und einen Prompt uebersetzt werden.

Schritt 2 und 3 sind nur Orientierung und muessen nach Abschluss von Schritt 1 neu geprueft werden.

Neue Chats und neue Codex-Laeufe duerfen keine Prompt-Stapel fuer alle 3 Schritte als feste Abarbeitung behandeln.

Spontane Einzelideen, lokale Code-Schoenheitskorrekturen oder isolierte technische Kleinverbesserungen reichen als Paketbegruendung nicht aus.

Wenn ein neuer Chat an irgendeiner späteren Stelle einsteigt, gilt trotzdem dieselbe Regel:
Nicht von dort aus direkt weiterarbeiten, sondern zuerst diese Datei lesen und danach die Pflichtdateien in der festgelegten Reihenfolge nachziehen.

Wenn der tatsächliche Repo-Stand und die vorliegende Arbeitsgrundlage auseinanderlaufen, muss das ausdrücklich benannt werden, bevor weitergearbeitet wird.

---

## Arbeitsmatrix für den Modularumbau

Diese Arbeitsmatrix steuert, **wohin** ein neues Paket fachlich gehört, bevor daran gearbeitet wird.

Sie verhindert, dass neue Chats blind irgendwo anfangen, spätere Schritte vorziehen oder unklare Mischpakete bauen.

Die Arbeitsmatrix des Modularumbaus besteht verbindlich aus genau 6 Containern.

Neue Chats und neue Codex-Laeufe duerfen keine zusaetzlichen Container einfuehren.

Bestehende Container duerfen nicht ohne eigenes Doku-/Planpaket aufgespalten, umbenannt oder neu geordnet werden.

Aenderungen an der Containerstruktur gehoeren ausschliesslich in ein eigenes Doku-/Planpaket in Container 1.

### Harte Regel zur Paket-Zuordnung

Jedes neue Paket muss vor Beginn genau einem Container primär zugeordnet werden.

Wenn ein Paket nicht klar zuordenbar ist, ist es noch nicht sauber genug geschnitten.

Zusatzregel:
- Ein Paket darf Nebenwirkungen in angrenzenden Bereichen haben.
- Sein primärer Zweck muss trotzdem eindeutig genau einem Container zugeordnet werden.
- Ist die Primärzuordnung unklar, muss das Paket kleiner oder sauberer geschnitten werden.

---

### Container 1 – Regelwerk / Zielbild / Planführung

#### Zweck
Dieser Container hält Arbeitsmodus, Zielbild und Planführung stabil.

Hier wird nicht fachlich gebaut, sondern sichergestellt, dass neue Pakete korrekt eingeordnet, richtig benannt und ehrlich dokumentiert werden.

#### Gehört hinein
- `ZUERST_LESEN_Codex.md`
- `ARCHITECTURE.md`
- `docs/MODULARISIERUNGSPLAN.md`
- `README-CHATGPT.md`
- `docs/ARBEITSMODUS-CODEX.md`
- relevante Regel- oder Einordnungsdokumente, wenn ein Paket sie zwingend berührt

#### Aktueller Stand
Die Leitdokumente sind vorhanden und grundsätzlich tragfähig.

#### Offene Übergänge
- Plan und realer Repo-Stand müssen laufend synchron bleiben
- Regelreferenzen müssen zum tatsächlichen Repo passen
- Doku darf nicht hinter dem echten Stand herlaufen, aber ihn auch nicht überholen

#### Erlaubte Pakete
- kleine Planpflege
- ehrliche Standkorrekturen
- kleine Klarstellungen in der Arbeits- oder Architekturdoku, wenn ein reales Paket das verlangt

#### Verbotene Pakete
- Doku-Umbau ohne technischen Anlass
- Architektur sprachlich schöner machen als technisch gerechtfertigt
- Planphasen passend reden, nur weil ein Branch oder Wunsch dazu verleitet

#### Pflichtfrage
Geht es hier wirklich um Regelwerk, Zielbild, Planführung oder ehrliche Einordnung — und nicht in Wahrheit um Kern- oder Fachumbau?

---

### Container 2 – App-Kern / Modulrahmen

#### Zweck
Dieser Container enthält den kleinen Host-Rahmen, der Fachmodule trägt und steuert.

Dazu gehören:
- Router / Shell
- Modulkatalog
- Modul-/Screen-Auflösung
- modulbezogene Navigation
- Aktivierung freigegebener Module im Rahmen des aktuellen Ausbaustands

#### Gehört hinein
- `src/renderer/app/`
- Router-/Shell-nahe Kernstellen
- `moduleCatalog`
- Resolver
- modulbezogene Navigation
- modulbezogene Aktivierungslogik

#### Aktueller Stand
Der Modulrahmen ist klein, statisch und bewusst nicht zu einer Plattformmechanik ausgebaut.

Er trägt den aktuellen Stand mit `Protokoll` und `Restarbeiten`.

#### Offene Übergänge
- der Katalog ist bewusst statisch
- es gibt keine Discovery
- es gibt keine allgemeine Plattform- oder Registry-Logik
- der Rahmen ist tragfähig, aber absichtlich klein
- die produktive Aktivierung freigegebener Module ist als Zielbild relevant, aber noch nicht vollständig ausgebaut
- Lizenz- oder Produktfreigaben dürfen den Kern steuern, ohne Fachlogik in den Kern zu ziehen

#### Erlaubte Pakete
- kleine belastbare Nachweise des bestehenden Rahmens
- kleine Korrekturen an Katalog, Resolvern oder Navigation, wenn sie für reale Modulführung nötig sind
- kleine Kernanpassungen, die direkt durch ein bestehendes Modulpaket erzwungen werden
- kleine belastbare Schritte zur Vorbereitung oder kontrollierten Einführung lizenzbasierter Modulaktivierung

#### Verbotene Pakete
- Discovery
- globale Registry-Logik im großen Stil
- Plattformvorbau
- Shell-/Host-Generalisierung ohne konkreten Paketdruck
- Fachlogik im Kern verstecken

#### Pflichtfrage
Geht es hier wirklich um Katalog, Resolver, Navigation, Router-/Shell-Rahmen oder Aktivierung freigegebener Module — und nicht um Fachlogik eines Moduls?

---

### Container 3 – Gemeinsame Kernbausteine / gemeinsame Domänen / Dienste

#### Zweck
Dieser Container schützt die neutralen, wiederverwendbaren Bausteine vor Fachvermischung.

Hier liegt, was mehreren Modulen oder dem Bearbeitungskern dient, ohne selbst Fachmodul zu sein.

#### Gehört hinein
- `src/renderer/core/`
- neutrale Bearbeitungsbausteine
- gemeinsame technische Zustände
- gemeinsame Domänen oder Dienste, sofern sie wirklich gemeinsam sind

#### Aktueller Stand
Teile dieses Bereichs sind bereits sinnvoll außerhalb der Fachmodule verankert.

Ein breiter eigener Umbaupfad ist derzeit aber nicht der Hauptfokus.

#### Offene Übergänge
- nicht alles ist maximal sauber geschnitten
- historisch gewachsene Mischlagen sind möglich
- ein zu früher Großschnitt würde schnell künstlich werden

#### Erlaubte Pakete
- kleiner gezielter Schnitt, wenn ein reales Modulpaket ihn zwingend braucht
- neutrale Kernbausteine absichern
- reale Wiederverwendung sauber herausarbeiten

#### Verbotene Pakete
- Vorab-Generalisierung ohne echten Bedarf
- abstrakte Bereinigung als Selbstzweck
- Fachlogik als angeblich neutralen Kernbaustein ausgeben

#### Pflichtfrage
Ist das wirklich ein neutraler, wiederverwendbarer Kernbaustein — oder wird hier gerade Fachlogik aus einem Modul herausverallgemeinert?

---

### Container 4 – Fachmodul `Protokoll`

#### Zweck
Dieser Container bündelt die echte Fachlogik des Moduls `Protokoll` und den kontrollierten Abbau seiner Übergangszonen.

#### Gehört hinein
- `src/renderer/modules/protokoll/`
- modulinterne Komponenten, Regeln, ViewModels, Dialoge, Screens
- gezielte Schritte zum Abbau von Protokoll-Mischzuständen

#### Aktueller Stand
`Protokoll` ist fachlich sichtbar vorbereitet und teilweise umgezogen.

#### Offene Übergänge
- `src/renderer/modules/protokoll/screens/TopsScreen.js` ist jetzt die technische Heimat von `TopsScreen`
- `src/renderer/views/TopsScreen.js` bleibt bewusst als Uebergangs- und Kompatibilitaetsschicht bestehen
- ein großer Teil des Protokoll-Unterbaus liegt weiter unter `src/renderer/tops/`
- Mischzonen sind noch vorhanden und nicht künstlich wegzudokumentieren

#### Erlaubte Pakete
- kleine echte Entmischung
- klar ersetzte Altpfade abbauen
- kleine Übergangs-Re-Exports reduzieren
- modulnahe Bestandslogik kontrolliert weiter in die Modulheimat ziehen

#### Verbotene Pakete
- Komplettverlagerung von `TopsScreen` in einem Zug
- breiter Umbau des gesamten `tops`-Unterbaus
- Fachlogik aus Bequemlichkeit in Kern oder App-Rahmen verschieben

#### Pflichtfrage
Reduziert das Paket wirklich einen Protokoll-Mischzustand, ohne einen Komplettumbau auszulösen?

---

### Container 5 – Fachmodul `Restarbeiten`

#### Zweck
Dieser Container hält `Restarbeiten` als eigenständiges Fachmodul klein, klar und fachlich getrennt.

#### Gehört hinein
- `src/renderer/modules/restarbeiten/`
- modulinterne Screens, Komponenten und fachnahe Hilfen
- kleine produktive Sichtbarkeit dieses Moduls

#### Aktueller Stand
`Restarbeiten` ist als eigenes Fachmodul vorbereitet, mit eigener kleiner Workbench und eigenem Einstieg.

#### Offene Übergänge
- noch keine breite produktive Verdrahtung
- Navigation und Router-Anbindung sind bewusst klein
- kein Vollausbau

#### Erlaubte Pakete
- kleine produktive Sichtbarkeit
- kleine Router-/Navigationsanbindung
- modulinterne Schärfung
- belastbare Nutzungs- oder Integrationsnachweise

#### Verbotene Pakete
- breiter Produktivausbau
- Vermischung mit `Protokoll`
- Infrastruktur vorziehen, die das Modul aktuell noch gar nicht braucht

#### Pflichtfrage
Stärkt das Paket `Restarbeiten` als eigenes Fachmodul — oder macht es das Modul nur indirekt von `Protokoll` oder vom Kern abhängig?

---

### Container 6 – Nachweis / Entmischung / Konsolidierung

#### Zweck
Dieser Container ist für kleine belegende, bereinigende und konsolidierende Schritte zuständig.

Er ist kein Auffangbecken für unklare Pakete.

#### Gehört hinein
- kleine Integrationsnachweise
- kleine Altpfadbereinigungen
- kleine Re-Export-Bereinigungen
- ehrliche Zwischenstands- und Abschlussdokumentation

#### Aktueller Stand
Einzelbetrieb und Koexistenz sind bereits nachgewiesen. Erste kleine Bereinigungen wurden gemacht.

#### Offene Übergänge
- weitere kleine Nachweise können noch fehlen
- Restmischzonen sind bewusst noch vorhanden
- Konsolidierung ist noch nicht gleich Abschluss der Zielarchitektur

#### Erlaubte Pakete
- kleine belastbare Nachweise
- kleine bereinigende Schritte
- kleine konsolidierende Dokumentation
- kleine Altpfadreduktionen, wenn der fachliche Ersatz real existiert

#### Verbotene Pakete
- unklare Mischpakete unter dem Label „Konsolidierung“
- Abschluss behaupten, obwohl wesentliche Übergänge noch bestehen
- große Entmischung unter Vorwand eines Nachweispakets

#### Pflichtfrage
Ist das wirklich ein kleiner belegender, bereinigender oder konsolidierender Schritt — oder wird hier ein eigentliches Kern- oder Fachpaket nur unter Container 6 versteckt?

---

### Priorisierte Umbauachsen

Die Container sind nicht gleichrangig aktiv.

#### Aktuelle Priorität 1 – Achse A
Container 2 + Container 6  
Den vorhandenen Modulrahmen absichern und offene kleine Nachweise sauber schließen.

#### Aktuelle Priorität 2 – Achse B
Container 4 + Container 6  
`Protokoll` in kleinen echten Schritten weiter entmischen.

#### Aktuelle Priorität 3 – Achse C
Container 5 + Container 2  
`Restarbeiten` dosiert sichtbarer machen.

#### Nur reaktiv – Achse D
Container 3  
Gemeinsame Kernbausteine nur dann weiter schneiden, wenn ein konkretes reales Paket es erzwingt.

---

### Konsequenz für neue Chats

Vor jedem neuen Paket ist in dieser Reihenfolge zu prüfen:

1. Welcher Container ist primär zuständig?
2. Passt das Paket wirklich zu dessen Pflichtfrage?
3. Ist es auf der aktuellen Prioritätsachse sinnvoll eingeordnet?
4. Ist es klein genug, um als genau ein Paket bearbeitet zu werden?

Wenn das nicht klar mit Ja beantwortet werden kann, ist das Paket noch nicht sauber geschnitten.

---

## 1. Ziel des aktuellen Architekturstrangs

Die Anwendung wird schrittweise modularisiert.

Wichtig:
- kein abrupter Komplettumbau
- keine künstliche Plattformmechanik
- keine aggressive Massenmigration
- keine vorschnelle Generalisierung von Fachlogik
- kleine, prüfbare Pakete
- bestehende Funktionalität bleibt erhalten
- Übergänge dürfen vorübergehend bestehen, müssen aber bewusst und ehrlich benannt bleiben

Die Architektur soll sauberer, lesbarer und modularer werden, ohne die reale Funktionsbasis unnötig zu destabilisieren.

### Ziel des modularen Betriebs

Der modulare Umbau dient nicht nur einer saubereren Code-Struktur, sondern auch einem klaren Betriebsziel:

Die App soll so aufgebaut werden, dass sie kontrolliert mit unterschiedlichem aktivem Modulumfang laufen kann.

Insbesondere bedeutet das:
- Betrieb nur mit `Protokoll`
- Betrieb nur mit `Restarbeiten`
- Betrieb mit `Protokoll` und `Restarbeiten` zusammen
- spätere Erweiterbarkeit auf weitere Module, ohne den Kern künstlich zur Plattform auszubauen

Die Aktivierung von Modulen erfolgt dabei nicht über UI-Schalter, sondern über die fachlich vorgesehene Freigabelogik, insbesondere über Lizenz- oder Produktfreigaben.

Wichtig:
- Nicht freigegebene Module sollen nicht nur optisch versteckt, sondern im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sein.
- Router, Navigation, Modul-/Screen-Auflösung und Moduleinstiege müssen sich am aktiven freigegebenen Modulumfang orientieren.
- Die dafür nötige Aktivierungslogik gehört in den App-Kern und den Modulrahmen, nicht in die Fachlogik der Module.
- Die Fachlogik selbst bleibt in den Modulen.

Dieses Ziel wird weiter konservativ und paketweise erreicht. Die Existenz lizenzbasierter Modulfreigabe als Zielbild bedeutet nicht, dass sofort eine große Lizenz- oder Plattformmechanik vorgezogen werden darf.

---

## 2. Verbindliche Arbeitsprinzipien

Bei jeder neuen Arbeit gelten diese Regeln:

1. Immer zuerst die Pflichtdateien lesen.
2. Immer nur genau ein sinnvolles Paket bearbeiten.
3. Keine späteren Schritte vorziehen.
4. Keine breiten Rundumschläge.
5. Nur wenige, eng zusammenhängende Dateien anfassen.
6. Bestehende Funktion stabil halten.
7. Vor Freigabe nur den tatsächlichen Diff bewerten.
8. Erst nach Freigabe committen, mergen und pushen.
9. Planpflege in `docs/MODULARISIERUNGSPLAN.md` ist Pflicht.
10. Doku darf nie mehr behaupten, als technisch wirklich erreicht wurde.

Faustregel:
Wenn unklar ist, ob ein großer oder kleiner Schritt richtig ist, gilt immer der kleinere, risikoärmere Schritt.

---

## 3. Harte Leitplanken

### 3.1 Fachmodule
Aktuell relevante Fachmodule:
- `Protokoll`
- `Restarbeiten`

Diese bleiben fachlich getrennt.

### 3.2 Außerhalb der Fachmodule bleiben ausdrücklich
- gemeinsamer Bearbeitungskern
- gemeinsame Domänen
- gemeinsame Dienste
- App-Kern
- Router / Shell
- Modulkatalog
- Modul-/Screen-Auflösung

### 3.3 Nicht tun
Nicht ohne klares Paket und klare Begründung:
- keine Fachlogiken vermischen
- keine Plattformmechanik vorziehen
- keine breite Navigationserweiterung ohne klares Paket
- keine neue globale Registry-Logik im großen Stil
- keine aggressive Altpfadbereinigung
- keine Massenmigration
- keine „schöngezogene“ Doku
- keine falsche Zuordnung von Paketen zu Planphasen

Wenn ein Arbeitsschritt in Wahrheit in einen anderen Planabschnitt gehört, muss er dort eingeordnet werden. Nicht passend machen, nur weil der aktuelle Branch anders heißt.

---

## 4. Pflichtdateien – immer zuerst lesen

Nach dem verpflichtenden Einstieg über `ZUERST_LESEN_Codex.md` sind vor jedem neuen Paket die weiteren Pflichtdateien in dieser Reihenfolge zu lesen:

1. `ARCHITECTURE.md`
2. `docs/MODULARISIERUNGSPLAN.md`
3. `README-CHATGPT.md`
4. `docs/ARBEITSMODUS-CODEX.md`
5. `docs/domain/TOP-REGELN.md`

Optional zusätzlich lesen, wenn für das Paket relevant:
- modulnahe `README.md`-Dateien
- bereits angelegte Modul-Einstiege unter `src/renderer/modules/`
- betroffene Tests unter `scripts/tests/`

---

## 5. Etablierter Paket-Arbeitsmodus

Jedes Paket folgt demselben Muster:

### Schritt A – kleinsten sinnvollen Schritt bestimmen
- kleinste sinnvolle, belastbare Änderung wählen
- keine Folgepakete vorwegnehmen
- keine irrelevanten Dateien anfassen

### Schritt B – Paket umsetzen
- konservativ arbeiten
- nur zusammenhängende Stellen ändern
- keine künstlichen Abstraktionen einführen, wenn sie noch nicht nötig sind

### Schritt C – Diff prüfen lassen
- immer `git diff -- .`
- bei Bedarf zusätzlich:
  - `git status`
  - `git diff --stat -- .`

### Schritt D – erst nach Freigabe committen
Nie vorab committen.

### Schritt E – sauber mergen
Nur nach Freigabe:
- commit
- auf `main`
- pull
- merge
- branch löschen
- push
- Status prüfen

---

## 6. Branch- und Commit-Stil

### Branch-Schema
`phaseX-paketY-<kurzname>`

Beispiele:
- `phase9-paket2-modulstruktur-restarbeiten`
- `phase10-paket1-einzelbetrieb-restarbeiten`
- `phase11-paket2-mischzustand-abbauen`

### Commit-Schema
`Phase X Paket Y: <Beschreibung>`

Beispiele:
- `Phase 9 Paket 3: Eigene Restarbeiten-Workbench bauen`
- `Phase 10 Paket 2: Zusammenspiel Protokoll und Restarbeiten nachweisen`
- `Phase 11 Paket 2: Mischzustand weiter abbauen`

---

## 7. Aktuell erreichter Stand

### 7.1 `Protokoll`
`Protokoll` ist als Fachmodul sichtbar vorbereitet und teilweise umgezogen.

Erreicht:
- fachliche Modulgrenze klarer gezogen
- `TopsScreen` als Arbeitsscreen des Moduls eingeordnet
- Workbench/Editbox/TOP-Logik sauberer getrennt
- Modulheimat unter `src/renderer/modules/protokoll/` angelegt
- erste echte Bestandsdateien umgezogen
- Moduleinstieg definiert

Noch bewusst Übergang:
- `src/renderer/modules/protokoll/screens/TopsScreen.js` ist die technische Heimat von `TopsScreen`
- `src/renderer/views/TopsScreen.js` bleibt als Uebergangs- und Kompatibilitaetsschicht bestehen
- ein erheblicher Teil des Protokoll-Unterbaus liegt weiter unter `src/renderer/tops/`

### 7.2 `Restarbeiten`
`Restarbeiten` ist als eigenes Fachmodul sichtbar vorbereitet.

Erreicht:
- fachlicher Schnitt definiert
- Modulstruktur angelegt
- eigene kleine Workbench gebaut
- eigener Moduleinstieg definiert
- Einzelbetrieb nachgewiesen

Noch bewusst klein:
- keine breite produktive Router-/Navigationsverdrahtung
- kein Vollausbau des Moduls

### 7.3 App-Kern / Modulrahmen
Erreicht:
- kleiner statischer Modulkatalog
- kleine Modul-/Screen-Auflösung
- kleine modulbezogene Navigation
- Koexistenz von `Protokoll` und `Restarbeiten` nachgewiesen

Wichtig:
- App-Kern bleibt von Fachlogik getrennt
- keine große Plattformmechanik eingeführt

Der aktuelle Rahmen ist damit bereits auf mehrere Fachmodule vorbereitet.

Das Ziel ist dabei nicht nur strukturelle Ordnung, sondern kontrollierbarer Modulbetrieb:
- einzelne Module sollen abhängig vom freigegebenen Produktumfang aktiv sein können
- der Kernrahmen soll diesen aktiven Modulumfang sauber tragen
- die Freigabe soll perspektivisch lizenz- oder produktbasiert erfolgen

### 7.4 Gemeinsame Kernbausteine
Der gemeinsame Bearbeitungskern bleibt ausdrücklich außerhalb der Fachmodule, vor allem in:
- `src/renderer/core/`

Dazu gehören insbesondere:
- Editbox-Kern
- neutrale Feldbausteine
- wiederverwendbare Kernzustände

### 7.5 Erste Bereinigungen
Bereits gemacht:
- erste Übergangs-Re-Exports entfernt
- erste kleine Altpfade reduziert
- kleiner Mischzustand bei Pfaden reduziert
- Abschlussstand dokumentiert

---

## 8. Bewusst noch offen

Diese Punkte sind nicht „vergessen“, sondern bewusst noch offen:

- `src/renderer/views/TopsScreen.js` bleibt als Uebergangs- und Kompatibilitaetsschicht bestehen
- großer Protokoll-Unterbau liegt weiter unter `src/renderer/tops/`
- modulbezogene Navigation ist noch klein und im Wesentlichen für `Protokoll`
- `Restarbeiten` ist noch nicht breit produktiv über Router und Navigation verdrahtet
- weitere Restmischzonen und Altpfade sind noch vorhanden
- kein Vollabschluss der Zielarchitektur
- keine breite Plattform- oder Shell-Integration
- lizenzbasierte Aktivierung und Deaktivierung von Modulen ist als Zielbild relevant, aber noch nicht vollständig produktiv ausgebaut
- der Modulrahmen ist dafür vorbereitet, aber noch nicht abschließend bis zum finalen Freigabebetrieb geführt

Diese offenen Punkte dürfen ehrlich benannt werden. Der Stand soll nicht klein-, aber auch nicht schöngeredet werden.

---

## 9. Planpflege ist Pflicht

Bei jedem Paket muss `docs/MODULARISIERUNGSPLAN.md` passend gepflegt werden.

Pflicht dabei:
- Status des richtigen Schritts aktualisieren
- Paketabschnitt ergänzen
- ehrlich benennen:
  - was wirklich erreicht wurde
  - was bewusst nicht erreicht wurde
  - was Übergang bleibt

Wichtig:
Wenn ein Schritt in Wahrheit in einem anderen Planabschnitt liegt, dann muss der richtige Planabschnitt gepflegt werden.

---

### Pflege von `docs/MODULARISIERUNGSSTATUS.md`

Nach jedem Paket ist zu prüfen, ob `docs/MODULARISIERUNGSSTATUS.md` angepasst werden muss.

Dabei gilt:
- Wenn ein Paket den tatsächlichen Umbau-Status verändert, ist die Datei im selben Paket mitzuführen.
- Wenn sich der tatsächliche Umbau-Status nicht verändert, bleibt die Datei unverändert.

Eine Anpassung ist insbesondere nötig, wenn sich durch das Paket mindestens einer der folgenden Punkte ändert:
- Status eines Containers
- bewusst offene Punkte
- aktive Umbauachse oder Priorität
- architektonisch relevanter erreichter Stand
- nächste sinnvolle Paketrichtung

`docs/MODULARISIERUNGSSTATUS.md` bekommt dabei keinen eigenen Sonderlauf, sondern wird als Teil desselben Pakets geführt:
1 Paket = 1 Branch = 1 Commit = 1 Merge

---

## 10. Prüffragen vor jedem Paket

Vor der Umsetzung immer prüfen:

1. Ist das wirklich der kleinste sinnvolle nächste Schritt?
2. Ist das Paket architekturtreu?
3. Wird kein späterer Schritt vorgezogen?
4. Bleibt die Funktion stabil?
5. Werden nur wenige relevante Dateien geändert?
6. Ist die Doku hinterher ehrlich?
7. Wird kein künstlicher Großumbau ausgelöst?

Wenn eine dieser Fragen mit „nein“ beantwortet wird, Paket kleiner schneiden.

---

## 11. Prüffragen vor jeder Freigabe

Vor einer Freigabe immer prüfen:

1. Ist der Diff fachlich sauber?
2. Ist die Planpflege korrekt?
3. Wird der aktuelle Stand nicht übertrieben?
4. Bleiben App-Kern, gemeinsame Bausteine und Fachmodule sauber getrennt?
5. Gibt es keinen versteckten Architekturbruch?
6. Wurde wirklich nur das bearbeitet, was zum Paket gehört?

---

## 12. Typischer Arbeitsablauf im Chat

Der etablierte Ablauf für neue Chats ist:

1. `ZUERST_LESEN_Codex.md` lesen
2. weitere Pflichtdateien lesen
3. Stand knapp zusammenfassen
4. 2–3 sinnvolle nächste kleine Pakete vorschlagen
5. auf Auswahl warten
6. genau ein Paket vorbereiten
7. Paket einem Container primär zuordnen
8. Diff prüfen
9. nach Freigabe committen / mergen / pushen

Wichtig:
Nicht sofort coden, nicht sofort groß umbauen, nicht sofort mehrere Pakete auf einmal anstoßen.

---

## 13. Typischer Git-Befehlsablauf nach Freigabe

Nach Freigabe eines Pakets ist die normale Folge:

```powershell
git add <betroffene-dateien>
git commit -m "Phase X Paket Y: <Beschreibung>"
git switch main
git pull
git merge <branchname>
git branch -d <branchname>
git push
git status
```

---

## 14. Verbindlicher Git-Ablauf pro Arbeitsschritt

Es wird immer genau in **Paketen** gearbeitet, nicht in unscharfen Großaufträgen.

### Feste Begriffe
- **Phase** = größerer Themenblock im Plan
- **Paket** = kleinster konkret prüfbarer Arbeitsschritt innerhalb einer Phase

Beispiel:
- Phase 9 = `Restarbeiten` aufbauen
- Phase 9 Paket 2 = `Modulstruktur Restarbeiten anlegen`

### Harte Regel
**1 Paket = 1 Branch = 1 Commit = 1 Merge**

Keine Ausnahmen ohne ausdrückliche Anweisung.

### Verbindlicher Ablauf
1. Zuerst `main` aktualisieren
2. Dann genau **einen** Branch für genau **ein** Paket anlegen
3. Nur dieses Paket bearbeiten
4. Vor jedem Commit erst den echten Diff zeigen
5. Erst nach ausdrücklicher Freigabe committen
6. Danach sauber in `main` mergen
7. Danach Branch löschen
8. Danach pushen
9. Danach `git status` prüfen

### Verbindliches Branch-Schema
`phaseX-paketY-kurzname`

Beispiel:
`phase9-paket2-modulstruktur-restarbeiten`

### Verbindliches Commit-Schema
`Phase X Paket Y: Beschreibung`

Beispiel:
`Phase 9 Paket 2: Modulstruktur Restarbeiten anlegen`

### Verbindliche Befehlsfolge zu Beginn eines Pakets

```powershell
git switch main
git pull
git switch -c phaseX-paketY-kurzname
```

### Verbindliche Prüfbefehle vor Freigabe

```powershell
git diff -- .
```

Bei Bedarf zusätzlich:

```powershell
git status
git diff --stat -- .
```

### Verbindliche Befehlsfolge nach Freigabe

```powershell
git add <betroffene-dateien>
git commit -m "Phase X Paket Y: Beschreibung"
git switch main
git pull
git merge <branchname>
git branch -d <branchname>
git push
git status
```

---

## 15. Erfolgskriterien, Nachweise, Abbruchregeln

Diese Regeln sichern, dass Pakete nicht nur begonnen, sondern auch sauber bewertet werden.

### 15.1 Wann ein Paket als erfolgreich gilt

Ein Paket gilt nur dann als erfolgreich, wenn alle folgenden Punkte erfüllt sind:

1. Das Ziel des Pakets war vor der Umsetzung klar benannt.
2. Der primäre Container des Pakets war vor der Umsetzung klar zugeordnet.
3. Der tatsächliche Diff passt zum benannten Paket-Ziel.
4. Die bestehende Funktion bleibt stabil.
5. Die Planpflege in `docs/MODULARISIERUNGSPLAN.md` wurde passend durchgeführt.
6. Die Doku behauptet nicht mehr, als technisch wirklich erreicht wurde.
7. Es wurden keine verdeckten Nebenumbauten mitgezogen.
8. Das Paket widerspricht nicht dem Ziel eines kontrolliert freigabefähigen Modulbetriebs.

Wenn einer dieser Punkte nicht erfüllt ist, ist das Paket nicht sauber abgeschlossen.

### 15.2 Regel für Nachweise und Tests

Bei jedem Paket ist vor der Freigabe ausdrücklich zu prüfen, ob ein Nachweis nötig ist.

Dabei gilt:
- Wenn ein Paket Verhalten ändert, absichert oder einen neuen Weg im Modularrahmen einführt, muss ein passender Nachweis mitgedacht werden.
- Ein vorhandener Test ist anzupassen, wenn er durch das Paket fachlich berührt wird.
- Ein neuer Test ist anzulegen, wenn ohne ihn der behauptete Paketnutzen nicht belastbar wäre.
- Wenn bewusst kein Test oder kein zusätzlicher Nachweis angelegt wird, muss das kurz begründet werden.

Nachweise dürfen nicht künstlich größer gemacht werden als das Paket selbst.

### 15.3 Regel für veraltete Arbeitsgrundlagen

Wenn der Chat merkt oder begründet annehmen muss, dass die aktuelle Arbeitsgrundlage nicht mehr dem tatsächlichen Repo-Stand entspricht, muss das ausdrücklich benannt werden, bevor weitergearbeitet wird.

Dann gilt:
- nicht stillschweigend weiterarbeiten
- keine Diffs oder Paketbewertungen auf veralteter Grundlage schönreden
- erst Arbeitsgrundlage klären, dann fortsetzen

Das gilt insbesondere bei:
- veralteten ZIP-Ständen
- zwischenzeitlich geänderten Branch-Ständen
- nachgereichten Regeln oder Planständen
- widersprüchlichen Dateiständen

### 15.4 Abbruchregel bei falsch geschnittenen Paketen

Wenn sich während Scout, Builder, Reviewer oder Diff-Prüfung zeigt, dass ein Paket nicht sauber geschnitten ist, darf es nicht einfach trotzdem durchgezogen werden.

Das gilt insbesondere, wenn:
- das Paket zu viele Dateien berührt
- das Paket in Wahrheit in einen anderen Planabschnitt gehört
- das Paket einen späteren Schritt vorzieht
- der primäre Container nicht mehr klar ist
- ein versteckter Großumbau entsteht
- die Stabilität der bestehenden Funktion nicht mehr sicher ist

Dann gilt:
- Paket stoppen
- kleiner oder sauberer neu schneiden
- erst danach weiterarbeiten

Nicht passend machen, nur damit der begonnene Schritt irgendwie fertig wird.

### 15.5 Zielkriterium für den modularen Endzustand

Der modulare Umbau ist nicht schon deshalb ausreichend erreicht, weil Code nur in Modulordner verschoben wurde.

Ein wesentlicher Zielzustand ist erst dann erreicht, wenn der Modulrahmen fachlich und technisch tragen kann, dass:
1. `Protokoll` für sich freigegeben betrieben werden kann,
2. `Restarbeiten` für sich freigegeben betrieben werden kann,
3. beide Module gemeinsam betrieben werden können,
4. nicht freigegebene Module im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sind,
5. Router, Navigation, Modul-/Screen-Auflösung und Moduleinstiege auf diesen aktiven Modulumfang korrekt reagieren.

Die dafür nötige Freigabelogik gehört in den App-Kern und den Modulrahmen. Die Fachlogik bleibt in den Modulen.
