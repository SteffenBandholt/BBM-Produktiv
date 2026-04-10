# MODULARISIERUNGSSTATUS

Diese Datei hält den **tatsächlichen aktuellen Stand** des laufenden Modularumbaus fest.

Sie ergänzt:
- `ZUERST_LESEN_Codex.md` als Regel- und Arbeitsgrundlage
- `docs/MODULARISIERUNGSPLAN.md` als Plan- und Paketführung

Diese Datei ist bewusst **kein** Regelwerk und **keine** To-do-Liste ohne Einordnung.  
Sie dient dazu, dass neue Chats und neue Arbeitsläufe schnell und ehrlich erkennen können:
- was bereits erreicht ist
- was nur teilweise erreicht ist
- was bewusst Übergang bleibt
- welche Container aktuell im Fokus stehen
- welche nächsten kleinen Schritte sinnvoll sind
- was noch nicht behauptet werden darf

## Pflege dieser Datei

Diese Datei ist nach jedem Paket darauf zu prüfen, ob der tatsächliche Umbau-Status angepasst werden muss.

Sie wird nur dann geändert, wenn das bearbeitete Paket den realen Status wirklich verändert.

Typische Gründe für eine Aktualisierung sind:
- ein Container hat einen neuen Status
- ein offener Punkt wurde kleiner oder erledigt
- ein neuer offener Punkt ist entstanden
- die aktive Umbauachse hat sich verschoben
- ein architektonisch relevanter Schritt wurde erreicht
- die nächste sinnvolle Paketrichtung hat sich verändert

Wenn ein Paket den Status nicht verändert, bleibt diese Datei unverändert.

Die Pflege dieser Datei erfolgt immer im selben Paket-Branch und im selben Commit wie das zugehörige Paket.

---

## 1. Zielbild des laufenden Umbaus

Die Anwendung soll in einen tragfähigen modularen Aufbau überführt werden.

Das Zielbild ist:
- `Protokoll` und `Restarbeiten` sind fachlich getrennte Module
- der App-Kern bleibt für Host-Aufgaben zuständig
- gemeinsame Kernbausteine bleiben außerhalb der Fachmodule
- Mischzonen und Altpfade werden schrittweise reduziert, nicht in einem Großumbau
- der reale Stand bleibt jederzeit ehrlich dokumentiert
- der Modulrahmen soll perspektivisch einen kontrollierten, lizenz- oder produktbasierten Modulbetrieb tragen

Das Ziel ist **nicht**:
- eine künstliche Plattform-Engine
- eine allgemeine Discovery-/Registry-Architektur im großen Stil
- ein abrupter Komplettumbau
- eine aggressive Massenmigration
- eine schöner geschriebene Doku als der echte technische Stand trägt

---

## 2. Gesamtstand in Kurzform

### `Protokoll`
`Protokoll` ist als Fachmodul sichtbar vorbereitet und teilweise umgezogen.

Erreicht:
- fachliche Modulgrenze klarer gezogen
- `TopsScreen` als Arbeitsscreen des Moduls eingeordnet
- Workbench/Editbox/TOP-Logik sauberer getrennt
- Modulheimat unter `src/renderer/modules/protokoll/` angelegt
- erste echte Bestandsdateien umgezogen
- Moduleinstieg definiert

Noch bewusst Übergang:
- `TopsScreen` liegt weiter unter `src/renderer/views/`
- ein erheblicher Teil des Protokoll-Unterbaus liegt weiter unter `src/renderer/tops/`

### `Restarbeiten`
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

### App-Kern / Modulrahmen
Erreicht:
- kleiner statischer Modulkatalog
- bekannter Modulbestand und aktiver Modulumfang im Katalog expliziter getrennt
- kleine Betriebsmodi sind aus dem statischen Katalog kontrolliert ableitbar
- kleine Modul-/Screen-Auflösung
- kleine modulbezogene Navigation
- Koexistenz von `Protokoll` und `Restarbeiten` nachgewiesen

Wichtig:
- der Kern ist noch bewusst klein
- keine Plattformmechanik im großen Stil
- keine Lizenzlogik im Modulkatalog
- kontrollierter freigabefähiger Modulbetrieb ist Zielbild, aber noch nicht produktiv vollständig umgesetzt

### Nachweise / Bereinigung
Erreicht:
- Einzelbetrieb `Restarbeiten` nachgewiesen
- Koexistenz `Protokoll` + `Restarbeiten` nachgewiesen
- erste Übergangs-Re-Exports entfernt
- erste kleine Altpfade reduziert
- Zwischen- bzw. Abschlussstand eines erreichten Abschnitts dokumentiert

Noch offen:
- weitere Restmischzonen
- weitere kleine Nachweise
- späterer Übergang von strukturellem Modulrahmen zu kontrolliert aktivierbarem Modulumfang

---

## 3. Status je Container

### Container 1 – Regelwerk / Zielbild / Planführung
**Status:** tragfähig, aktiv gepflegt

**Bereits erreicht**
- `ZUERST_LESEN_Codex.md` als harte Einstiegsgrundlage geschärft
- Container-Logik und Git-Ablauf definiert
- Zielbild und Arbeitsmodus klarer gefasst

**Noch offen**
- Regelwerk, Plan und tatsächlicher Repo-Stand müssen laufend synchron gehalten werden
- neue Erkenntnisse aus echten Paketen müssen sauber nachgezogen werden

**Darf aktuell nicht passieren**
- Doku schöner machen als den technischen Stand
- unklare oder zu große Pakete durch Formulierungen passend reden

### Container 2 – App-Kern / Modulrahmen
**Status:** aktiv, priorisiert

**Bereits erreicht**
- kleiner statischer Modulkatalog
- bekannter Modulbestand und aktiver Modulumfang im Katalog sind klein getrennt
- kleine Betriebsmodi fuer `Protokoll`, `Restarbeiten` und beide zusammen sind nachweisbar ableitbar
- kleine Screen-/Entry-Auflösung
- kleine modulbezogene Navigation
- Rahmen trägt `Protokoll` und `Restarbeiten`

**Noch offen**
- aktiver Modulumfang ist im Katalog expliziter, aber noch nicht über Freigabelogik gesteuert
- freigabefähiger Modulbetrieb ist Zielbild, aber noch nicht fertig eingeführt
- produktive Aktivierung / Nicht-Aktivierung freigegebener bzw. nicht freigegebener Module ist noch nicht vollständig durchgezogen

**Darf aktuell nicht passieren**
- Discovery oder Registry im großen Stil
- Plattformvorbau
- Fachlogik in den Kern ziehen

### Container 3 – Gemeinsame Kernbausteine / gemeinsame Domänen / Dienste
**Status:** vorhanden, aktuell nur reaktiv

**Bereits erreicht**
- wichtige gemeinsame Kernbausteine liegen außerhalb der Fachmodule
- gemeinsamer Bearbeitungskern bleibt grundsätzlich getrennt

**Noch offen**
- nicht jeder historische Schnitt ist schon maximal sauber
- weitere Nachschärfung nur bei echtem Bedarf aus konkreten Paketen

**Darf aktuell nicht passieren**
- abstrakte Vorab-Generalisierung
- Fachlogik als angeblich neutraler Kern ausgegeben

### Container 4 – Fachmodul `Protokoll`
**Status:** weit vorbereitet, Übergangscontainer aktiv

**Bereits erreicht**
- sichtbare Modulheimat
- Moduleinstieg
- Teile des Bestands umgezogen
- Fachschnitt klarer

**Noch offen**
- `TopsScreen` liegt weiter unter `views/`
- großer Unterbau liegt weiter unter `tops/`
- Mischzustände sind noch nicht klein genug, um `Protokoll` als vollständig entmischt zu bezeichnen

**Darf aktuell nicht passieren**
- Komplettverlagerung in einem Zug
- Großumbau des `tops`-Unterbaus
- Vermischung von Protokoll-Fachlogik mit Kernlogik

### Container 5 – Fachmodul `Restarbeiten`
**Status:** vorbereitet, klein, kontrolliert ausbaufähig

**Bereits erreicht**
- Modulstruktur
- kleine Workbench
- Moduleinstieg
- Einzelbetrieb nachgewiesen
- Koexistenz mit `Protokoll` nachgewiesen

**Noch offen**
- noch keine breite produktive Verdrahtung
- Navigation / Router nur klein angebunden
- noch kein freigabebezogener Produktivbetrieb

**Darf aktuell nicht passieren**
- breiter Produktivausbau ohne klaren Paketdruck
- Vermischung mit `Protokoll`
- unnötiger Infrastrukturausbau

### Container 6 – Nachweis / Entmischung / Konsolidierung
**Status:** aktiv, flankierend

**Bereits erreicht**
- erste wichtige Integrationsnachweise
- erste kleine Bereinigungen
- erste Konsolidierungsschritte dokumentiert

**Noch offen**
- weitere kleine Nachweise sinnvoll
- weitere Altpfade und Restmischzonen vorhanden
- Konsolidierung ist noch nicht Endabschluss

**Darf aktuell nicht passieren**
- unklare Mischpakete als „Konsolidierung“ tarnen
- zu große Entmischung als Nachweispaket verkaufen
- „fertig“ behaupten, obwohl wesentliche Übergänge noch da sind

---

## 4. Aktive Umbauachsen

### Aktuelle Priorität 1 – Achse A
**Container 2 + Container 6**

Fokus:
- Modulrahmen weiter absichern
- aktiven Modulumfang klarer machen
- Nachweise für kontrollierten Modulbetrieb vorbereiten
- noch ohne große Lizenz- oder Plattformmechanik

### Aktuelle Priorität 2 – Achse B
**Container 4 + Container 6**

Fokus:
- `Protokoll` schrittweise weiter entmischen
- kleine echte Altpfadreduktion
- Mischzonen nicht schönreden, sondern gezielt verkleinern

### Aktuelle Priorität 3 – Achse C
**Container 5 + Container 2**

Fokus:
- `Restarbeiten` dosiert sichtbarer und tragfähiger machen
- kleine produktive Anbindung
- weiterhin ohne Großausbau

### Nur reaktiv – Achse D
**Container 3**

Fokus:
- gemeinsame Kernbausteine nur dann weiter schneiden, wenn reale Pakete es erzwingen

---

## 5. Bereits architektonisch relevante erreichte Schritte

Diese Liste ist bewusst keine vollständige Git-Historie, sondern eine Einordnung des erreichten Umbaufortschritts.

### `Protokoll`
- Modulgrenze festgelegt
- `TopsScreen` richtig eingeordnet
- Editbox / Workbench / TOP-Logik besser getrennt
- Modulstruktur angelegt
- Bestandsdateien umgezogen
- Moduleinstieg definiert

### App-Kern / Modulrahmen
- Modulkatalog eingeführt
- Modul-Screen-Auflösung eingeführt
- Modulnavigation dynamisch gemacht

### `Restarbeiten`
- Fachschnitt definiert
- Modulstruktur angelegt
- eigene kleine Workbench gebaut
- Moduleinstieg definiert
- Einzelbetrieb nachgewiesen

### Zusammenspiel / Konsolidierung
- Koexistenz `Protokoll` + `Restarbeiten` nachgewiesen
- kleine Betriebsmodi `nur Protokoll`, `nur Restarbeiten` und `beide zusammen` nachweisbar gemacht
- erste Altpfade und Übergangs-Re-Exports abgebaut
- Mischzustand weiter reduziert
- Abschlussstand eines erreichten Abschnitts dokumentiert

---

## 6. Bewusst offene Punkte

Diese Punkte sind offen und dürfen nicht stillschweigend als erledigt behandelt werden:

- `TopsScreen` liegt weiter unter `src/renderer/views/`
- großer Protokoll-Unterbau liegt weiter unter `src/renderer/tops/`
- modulbezogene Navigation ist noch klein und im Wesentlichen für `Protokoll`
- `Restarbeiten` ist noch nicht breit produktiv über Router und Navigation verdrahtet
- weitere Restmischzonen und Altpfade sind noch vorhanden
- aktiver Modulumfang ist im Katalog expliziter gemacht, aber noch nicht vollstaendig als freigabegesteuerter Kernbegriff etabliert
- lizenzbasierte Aktivierung und Deaktivierung von Modulen ist Zielbild, aber noch nicht vollständig produktiv umgesetzt
- kein Vollabschluss der Zielarchitektur
- keine breite Plattform- oder Shell-Integration

---

## 7. Was aktuell schon gesagt werden darf – und was nicht

### Das darf gesagt werden
- Es gibt bereits einen kleinen realen Modulrahmen.
- `Protokoll` und `Restarbeiten` existieren als getrennte Fachmodule im Umbaupfad.
- Einzelbetrieb `Restarbeiten` ist nachgewiesen.
- Koexistenz `Protokoll` + `Restarbeiten` ist nachgewiesen.
- Kleine Betriebsmodi sind aus dem statischen Katalog nachweisbar ableitbar.
- Der Kern bleibt bewusst klein und ohne große Plattformmechanik.

### Das darf noch nicht behauptet werden
- Der Modularumbau sei abgeschlossen.
- `Protokoll` sei vollständig entmischt.
- `Restarbeiten` sei bereits breit produktiv eingebunden.
- lizenzbasierter Modulbetrieb sei bereits vollständig realisiert.
- der Modulrahmen sei schon eine allgemeine Plattformarchitektur.

---

## 8. Nächste sinnvolle Paketrichtung

Die nächste sinnvolle Hauptbewegung liegt auf **Achse A**.

### Fachlich sinnvoller nächster Schwerpunkt
Den **aktiven Modulumfang im Kern expliziter machen**, ohne schon Lizenzlogik im großen Stil einzuführen.

Ein erster kleiner Kernschnitt dafuer ist jetzt im Modulkatalog vorhanden: bekannter Modulbestand und aktiver Ausschnitt sind dort getrennt. Der naechste sinnvolle Schritt waere weiterhin erst danach eine kleine, kontrollierte Vorbereitung echter Freigabelogik statt vorschneller Produktivmechanik.

Das wäre ein sinnvoller Zwischenschritt zwischen:
- heutigem statischen Modulrahmen
und
- späterem kontrolliert freigabefähigen Modulbetrieb

### Mögliche nächste kleine Pakete
1. kleine vorbereitende Schritte Richtung freigabefähiger Modulaktivierung prüfen
2. anschließend wieder gezielt `Protokoll` weiter entmischen oder `Restarbeiten` dosiert sichtbarer machen

Diese Reihenfolge darf angepasst werden, wenn der echte Diff oder der tatsächliche Repo-Stand einen kleineren und ehrlicheren Schritt zeigt.

---

## 9. Arbeitsregel für neue Chats

Ein neuer Chat soll diese Datei nicht als Ersatz für das Regelwerk lesen, sondern in dieser Reihenfolge arbeiten:

1. `ZUERST_LESEN_Codex.md`
2. weitere Pflichtdateien gemäß Codex
3. `docs/MODULARISIERUNGSSTATUS.md`
4. danach erst Standzusammenfassung, Paketvorschläge und weitere Arbeit

Wenn der tatsächliche Repo-Stand von diesem Status abweicht, muss das ausdrücklich benannt und diese Datei passend nachgezogen werden.
