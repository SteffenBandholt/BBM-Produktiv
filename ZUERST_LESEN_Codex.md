# ZUERST LESEN – Codex-Arbeitsgrundlage

Diese Datei ist die verbindliche Kurz-Arbeitsgrundlage für neue Chats / neue Codex-Läufe in diesem Repo.

Sie dient dazu, den etablierten Modularisierungs- und Migrationsstil nahtlos fortzuführen:
- konservativ
- in kleinen Paketen
- ohne unnötige Großumbauten
- mit sauberer Planpflege
- mit ehrlicher Dokumentation des tatsächlichen Stands

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

Vor jedem neuen Paket lesen, in dieser Reihenfolge:

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
- `TopsScreen` liegt weiterhin unter `src/renderer/views/`
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

- `TopsScreen` liegt weiter unter `src/renderer/views/`
- großer Protokoll-Unterbau liegt weiter unter `src/renderer/tops/`
- modulbezogene Navigation ist noch klein und im Wesentlichen für `Protokoll`
- `Restarbeiten` ist noch nicht breit produktiv über Router und Navigation verdrahtet
- weitere Restmischzonen und Altpfade sind noch vorhanden
- kein Vollabschluss der Zielarchitektur
- keine breite Plattform- oder Shell-Integration

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

1. Pflichtdateien lesen
2. Stand knapp zusammenfassen
3. 2–3 sinnvolle nächste kleine Pakete vorschlagen
4. auf Auswahl warten
5. genau ein Paket vorbereiten
6. Diff prüfen
7. nach Freigabe committen / mergen / pushen

Wichtig:
Nicht sofort coden, nicht sofort groß umbauen, nicht sofort mehrere Pakete auf einmal anstoßen.

---

## 13. Typische Git-Befehlsfolge nach Freigabe

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