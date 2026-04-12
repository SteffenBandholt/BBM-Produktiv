# docs/MODULARISIERUNGSPLAN.md

## Zweck

Diese Datei ist die **fuehrende operative Roadmap** fuer den laufenden Modularisierungsumbau.

Sie fuehrt:
- Phasen
- Schritte
- Status
- Abhaengigkeiten
- Prioritaeten
- operative Paketrichtung

Diese Datei ist **kein** Architekturpapier und **kein** Codex-Ausfuehrungsmanual.

---

## 1. Operative Arbeitsgrundsaetze

Der Umbau erfolgt:
- paketweise
- konservativ
- in kleinen pruefbaren Schritten
- ohne unnoetige Grossumbauten
- mit ehrlicher Dokumentation des realen Stands

Ein Paket ist nur dann sauber genug, wenn:
- sein Ziel klar benannt ist
- es einem offenen Planschritt zugeordnet ist
- es genau einem Container primaer zugeordnet ist
- es klein genug bleibt
- es keine spaeteren Schritte unnoetig vorzieht

Vor jeder neuen Paketwahl ist aus dieser Datei und `ARCHITECTURE.md` ein 3-Schritte-Kurzfahrplan abzuleiten.
Aktiv bearbeitet wird davon immer nur **Schritt 1**.

---

## 2. Arbeitsmatrix fuer den Modularumbau

Die Arbeitsmatrix besteht verbindlich aus genau **6 Containern**.

### Container 1 – Regelwerk / Zielbild / Planfuehrung
Arbeitsgrundlagen, ehrliche Planpflege, Doku-Nachzuege, Einordnung

### Container 2 – App-Kern / Modulrahmen
Router, Shell, Modulkatalog, Resolver, modulbezogene Navigation, Aktivierungslogik

### Container 3 – Gemeinsame Kernbausteine / gemeinsame Domaenen / Dienste
Neutraler wiederverwendbarer Kern ausserhalb der Fachmodule

### Container 4 – Fachmodul `Protokoll`
Modulinterne Logik und kontrollierter Abbau von Protokoll-Mischzonen

### Container 5 – Fachmodul `Restarbeiten`
Eigenstaendige, kleine und klar getrennte Weiterentwicklung von `Restarbeiten`

### Container 6 – Nachweis / Entmischung / Konsolidierung
Kleine belegende, bereinigende und konsolidierende Schritte

---

## 3. Aktive Umbauachsen

Die Container sind nicht gleichrangig aktiv.

### Prioritaet 1 – Achse A
**Container 2 + Container 6**
- Modulrahmen weiter absichern
- aktiven Modulumfang weiter schaerfen
- kontrollierten Modulbetrieb weiter vorbereiten
- noch ohne grosse Lizenz- oder Plattformmechanik

### Prioritaet 2 – Achse B
**Container 4 + Container 6**
- `Protokoll` schrittweise weiter entmischen
- kleine echte Altpfadreduktion
- Mischzonen gezielt verkleinern

### Prioritaet 3 – Achse C
**Container 5 + Container 2**
- `Restarbeiten` dosiert sichtbarer und tragfaehiger machen
- kleine produktive Anbindung
- weiterhin ohne Grossausbau

### Nur reaktiv – Achse D
**Container 3**
- gemeinsame Kernbausteine nur dann weiter schneiden, wenn reale Pakete es erzwingen

---

## 4. Phasenuebersicht

| Phase | Ziel | Status |
|---|---|---|
| 1 | Architektur verbindlich festziehen | ERLEDIGT |
| 2 | App-Kern fachlich entschlacken | IN ARBEIT |
| 3 | Gemeinsame Domaenen sauber schneiden | IN ARBEIT |
| 4 | Gemeinsame Dienste sauber schneiden | IN ARBEIT |
| 5 | App-Einstellungen und Lizenzierung zentralisieren | IN ARBEIT |
| 6 | Gemeinsame Kernbausteine sauber schneiden | IN ARBEIT |
| 7 | Modul `Protokoll` sauber ausschneiden | IN ARBEIT |
| 8 | Modulrahmen produktiv machen | IN ARBEIT |
| 9 | Modul `Restarbeiten` aufbauen | IN ARBEIT |
| 10 | Modulfaehigkeit praktisch beweisen | IN ARBEIT |
| 11 | Altbestand zurueckbauen | IN ARBEIT |
| 12 | Aktiven Modulumfang im Kern expliziter machen | IN ARBEIT |

---

## 5. Aktueller operativer Fokus

Der aktuell sinnvolle Hauptfokus liegt auf **Achse B und Achse C**, flankiert von Container 6:

- `Protokoll` schrittweise weiter entmischen
- `Restarbeiten` dosiert sichtbarer und tragfaehiger machen
- kleine Nachweise und Konsolidierungen mitziehen, wo sie den Umbau direkt belegen
- der erreichte Screen-Stand in `Protokoll` bleibt dabei sichtbar abgesichert

Der Kernrahmen bleibt weiter wichtig, aber die bereits erreichten kleinen Kernschritte sind fuer die naechsten Mini-Pakete nicht mehr der dominante erste Fokus.

Wenn der reale Repo-Stand einen kleineren und ehrlicheren naechsten Schritt zeigt, darf die Reihenfolge innerhalb der aktiven Achsen angepasst werden.

---

## 6. Operative Statusbilder je Hauptbereich

### 6.1 Container 2 – App-Kern / Modulrahmen
**Status:** aktiv, priorisiert

**Erreicht**
- kleiner statischer Modulkatalog
- kleiner Modulrahmen traegt `Protokoll` und `Restarbeiten`
- bekannte Module und aktiver Modulumfang sind klarer getrennt
- kleine Modul-/Screen-Aufloesung
- kleine modulbezogene Navigation
- vorbereitende Freigabelogik ist vorhanden
- aktiver Modulumfang wird an einer zweiten kleinen Kernstelle sichtbar genutzt
- `showTops()` nutzt keinen Fallback mehr ueber `views/TopsScreen.js`

**Noch offen**
- kein vollstaendig produktiver freigabebasierter Betrieb
- Aktivierung / Nicht-Aktivierung freigegebener bzw. nicht freigegebener Module ist noch nicht vollstaendig durchgezogen
- weitere kleine Kernstellen fuer den aktiven Modulumfang sind noch moeglich

### 6.2 Container 4 – Fachmodul `Protokoll`
**Status:** weit vorbereitet, Uebergangscontainer aktiv

**Erreicht**
- sichtbare Modulheimat
- Moduleinstieg
- Teile des Bestands umgezogen
- Fachschnitt klarer
- `src/renderer/modules/protokoll/screens/TopsScreen.js` ist die technische Heimat
- `src/renderer/views/TopsScreen.js` bleibt Uebergangs- und Kompatibilitaetsschicht
- modulnaher Style-Einstieg ist eingefuehrt
- `TopsScreen` bindet Styles nicht mehr direkt ueber den globalen `tops/`-Pfad ein
- `TopsScreen` ist fuer die bisher bearbeitete Kleinschnitt-Achse weitgehend von direkten Tiefenimports entlastet
- `TopsList` liegt als modulinterner Listen-Einstieg unter `modules/protokoll/`
- ein kleiner Nachweis fuer den entmischten Screen-Stand ist vorhanden

**Noch offen**
- grosser Unterbau liegt weiter unter `src/renderer/tops/`
- tieferer Unterbau und weitere Restentmischung in `Protokoll` bleiben offen
- weitere direkte `tops/`-Altpfade sind fuer spaetere Minischritte noch vorhanden

### 6.3 Container 5 – Fachmodul `Restarbeiten`
**Status:** sichtbar, klein, kontrolliert ausbaufaehig

**Erreicht**
- Modulstruktur
- kleine Workbench
- Moduleinstieg
- Einzelbetrieb
- Koexistenz mit `Protokoll`
- kleiner projektbezogener Navigationseintrag ist vorhanden
- `Restarbeiten` ist im aktiven Modulumfang sichtbar

**Noch offen**
- noch keine breite produktive Verdrahtung
- Navigation / Router nur klein angebunden
- noch kein freigabebezogener Produktivbetrieb
- weiterer Ausbau bleibt bewusst dosiert

### 6.4 Container 6 – Nachweis / Entmischung / Konsolidierung
**Status:** aktiv, flankierend

**Erreicht**
- erste Integrationsnachweise
- erste kleine Bereinigungen
- erste Konsolidierungsschritte
- kleine Nachweise zur Kernnavigation, Router-Entkopplung und Modulsichtbarkeit sind nachgezogen
- der entmischte `TopsScreen`-Zwischenstand ist per Test abgesichert

**Noch offen**
- weitere kleine Nachweise sinnvoll
- weitere Altpfade und Restmischzonen vorhanden
- Konsolidierung ist noch nicht Endabschluss

---

## 7. Naechste 3 Schritte

Vor jeder aktiven neuen Paketwahl diesen Kurzfahrplan neu pruefen.

### Schritt 1 – aktiv
Kleinstes realistisches Paket auf der aktuell priorisierten Achse ableiten und sauber einem Container zuordnen.

### Schritt 2 – Orientierung
Danach den naechsten sinnvollen Folgeschritt auf derselben Achse oder einer direkt angrenzenden Achse bestimmen.

### Schritt 3 – Orientierung
Danach den naechsten groesseren Entblocker bestimmen, der den modularen Betrieb weiter tragfaehig macht.

Wichtig:
- nur **Schritt 1** wird aktiv in ein Paket und einen Prompt uebersetzt
- Schritt 2 und 3 sind nur Orientierung
- nach Abschluss von Schritt 1 wird der Kurzfahrplan neu geprueft

---

## 8. Planpflege

Bei jedem Paket ist zu pruefen, ob diese Datei gepflegt werden muss.

Pflege ist noetig, wenn sich durch das Paket mindestens eines davon veraendert:
- Status eines Schritts oder einer Phase
- aktueller Fokus
- offene Punkte eines Hauptbereichs
- naechste sinnvolle Paketrichtung
- relevante Abhaengigkeiten

Dabei gilt:
- nur den real erreichten Stand eintragen
- Uebergaenge ehrlich benennen
- keine Parallelplaene anlegen
- keine Fortschritte groesser schreiben, als sie technisch sind
