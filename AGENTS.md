# AGENTS.md â€” BBM-Produktiv

## Zweck
Diese Datei legt die dauerhaften Arbeitsregeln fÃ¼r Codex in diesem Repository fest.

Codex soll in diesem Repo vorsichtig, kleinrÃ¤umig und nachvollziehbar arbeiten.
Ziel ist die weitere Modularisierung und Konsolidierung, ohne unnÃ¶tige VerhaltensÃ¤nderungen.

## Vor jeder Arbeit lesen
Lies zuerst diese Dateien, soweit vorhanden und fÃ¼r die Aufgabe relevant:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `PLAN.md` oder andere aufgabenspezifische Plandateien

Wenn sich Regeln widersprechen, gilt diese Reihenfolge:
1. direkte Nutzeranweisung
2. `AGENTS.md`
3. aufgabenspezifische Plan-Datei
4. Ã¼brige Doku

## Arbeitsmodus
Arbeite standardmÃ¤ÃŸig im Meilensteinbetrieb.

Das heiÃŸt:
- immer nur den **nÃ¤chsten offenen Meilenstein** bearbeiten
- niemals mehrere offene Baustellen gleichzeitig vermischen
- nach jedem Meilenstein prÃ¼fen und kurz berichten
- erst dann mit dem nÃ¤chsten Meilenstein weitermachen

Wenn keine Plan-Datei vorhanden ist:
- nicht eigenmÃ¤chtig eine groÃŸe Umbauaktion starten
- zuerst einen kleinen, sicheren nÃ¤chsten Schritt vorschlagen
- nur diesen einen Schritt umsetzen

## Grundregeln
- Arbeite in **kleinen, reviewbaren Paketen**.
- Halte das **bestehende Verhalten stabil**, auÃŸer wenn im Auftrag ausdrÃ¼cklich etwas anderes steht.
- **Keine neuen Features**, wenn sie nicht ausdrÃ¼cklich verlangt sind.
- **Keine breiten Refactorings** auÃŸerhalb des aktuellen Meilensteins.
- **Keine Versions-Upgrades** oder neue AbhÃ¤ngigkeiten, auÃŸer wenn zwingend nÃ¶tig und ausdrÃ¼cklich erlaubt.
- **Keine kosmetischen Formatierungswellen** ohne fachlichen Nutzen.
- Ã„ndere nur die Dateien, die fÃ¼r das aktuelle Paket wirklich nÃ¶tig sind.

## Fokus des Repos
Dieses Repo befindet sich in einem kontrollierten Umbau von einer stÃ¤rker monolithischen Struktur zu klareren Modulen.

Aktuell wichtige Bereiche:
- `Protokoll`

ARCHITEKTUR-LEITLINIE:
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spaetere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fuer andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswÃ¤hlbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswÃ¤hlbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spaeter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext; ein Projektklick startet nicht direkt `Protokoll`.

ARCHITEKTUR-FLAG:
- Das Protokoll-Modul wird aktuell nicht weiter modularisiert.
- Der aktuelle Stand bleibt bestehen; keine weiteren Modularisierungsarbeiten ohne ausdrÃ¼cklichen Auftrag.
- `TopsHeader` und `TopsList` sind wieder im Protokoll-Modul verankert.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen, ausser bei echtem Fehler oder konkretem Featurebedarf.

Wichtig:
- Der Umbau ist **nicht abgeschlossen**.
- Altpfade und Ãœbergangsstrukturen kÃ¶nnen noch vorhanden sein.
- Nicht gleichzeitig â€žaufrÃ¤umenâ€œ, â€žverbessernâ€œ und â€žneu strukturierenâ€œ, wenn das nicht ausdrÃ¼cklich Teil des aktuellen Pakets ist.

## Bevorzugte Arbeitsweise
Bei Umbau- und Modularisierungsaufgaben:
1. aktuellen Meilenstein kurz zusammenfassen
2. betroffene Dateien nennen
3. Ã„nderung minimal umsetzen
4. nur passende PrÃ¼fungen ausfÃ¼hren
5. Ergebnis knapp berichten

Wenn ein kleiner, sicherer Zwischenschritt mÃ¶glich ist, bevorzuge diesen gegenÃ¼ber einer grÃ¶ÃŸeren KomplettlÃ¶sung.

## Was ausdrÃ¼cklich vermieden werden soll
- keine stillen Architekturentscheidungen nebenbei
- keine Umbauten in angrenzenden Modulen â€žder Ordnung halberâ€œ
- keine Ã„nderungen an Router, Datenbank, Navigation oder Build-Setup, wenn das aktuelle Paket das nicht verlangt
- keine erfundenen PrÃ¼fungen oder Behauptungen, dass etwas getestet wurde, wenn es nicht wirklich ausgefÃ¼hrt wurde
- keine Aussage â€žfertigâ€œ, wenn noch rote Checks, unklare Folgen oder offene Hindernisse bestehen

## Validierung
Wenn fÃ¼r den aktuellen Meilenstein passende PrÃ¼fungen existieren, fÃ¼hre sie aus.

Bevorzugte Reihenfolge:
1. kleine, direkt passende PrÃ¼fungen
2. relevante Tests fÃ¼r den betroffenen Bereich
3. Build/Lint nur dann, wenn sinnvoll vorhanden und nicht unverhÃ¤ltnismÃ¤ÃŸig fÃ¼r das Mini-Paket

Wenn keine zuverlÃ¤ssige technische PrÃ¼fung vorhanden ist, sage das offen.

Wichtig:
- Nicht so tun, als sei die fachliche NutzerprÃ¼fung ersetzt.
- Der Mensch prÃ¼ft am Ende fachlich, ob die App noch tut, was sie soll.

## Stop-Regel
Stoppe und berichte, statt weiter umzubauen, wenn mindestens einer dieser FÃ¤lle eintritt:

- der aktuelle Meilenstein wird deutlich grÃ¶ÃŸer als geplant
- es wÃ¤ren mehr Dateien oder Module betroffen als vorgesehen
- eine Architekturentscheidung ist nÃ¶tig, die nicht dokumentiert ist
- die Validierung schlÃ¤gt fehl und ist nicht mit kleinem, lokalem Fix lÃ¶sbar
- die Aufgabe wÃ¼rde neue AbhÃ¤ngigkeiten, Upgrades oder Nebenumbauten erzwingen
- die Anforderung im Repo ist widersprÃ¼chlich oder unklar

## Ausgabeformat nach jeder Aufgabe
Antworte am Ende immer in dieser Form:

### Ergebnis
- Was wurde gemacht?

### GeÃ¤nderte Dateien
- Liste aller geÃ¤nderten Dateien

### PrÃ¼fung
- Welche PrÃ¼fungen wurden ausgefÃ¼hrt?
- Was war das Ergebnis?

### Risiken / offen
- Was ist noch offen?
- Gibt es Restrisiken?

### Status
- fertig
- oder: gestoppt bei Meilenstein X mit BegrÃ¼ndung

## Review-Regeln
Achte bei Reviews besonders auf:
- unbeabsichtigte VerhaltensÃ¤nderungen
- Paketbruch: zu viele Dateien oder zu groÃŸe Seiteneffekte
- Ã„nderungen auÃŸerhalb des aktuellen Meilensteins
- versteckte Kopplung zwischen Altstruktur und Modulstruktur
- unstimmige Importpfade
- Ã„nderungen, die nach â€žkleinem Paketâ€œ aussehen, aber faktisch mehrere Baustellen zugleich Ã¶ffnen

## Git- und PR-Regeln
- Ein PR soll idealerweise nur **einen sauberen Meilenstein** oder ein klar abgegrenztes Mini-Paket enthalten.
- Keine Sammel-PRs mit mehreren unabhÃ¤ngigen Umbauten.
- PR-Titel und Beschreibung sollen kurz sagen:
  - welches Paket bearbeitet wurde
  - was nicht angefasst wurde
  - welche PrÃ¼fungen gelaufen sind

## Codex-Cloud-Regeln
Diese Regeln gelten fÃ¼r alle Aufgaben, die in Codex Cloud laufen.

- Jede Cloud-Aufgabe muss mit einem klaren Base-Branch starten.
- Der Base-Branch wird im jeweiligen Auftrag ausdrÃ¼cklich genannt.
- Codex Cloud darf keinen Base-Branch selbst raten.
- Jede Cloud-Aufgabe muss auf einem eigenen Branch arbeiten, z. B. `codex/<kurzer-aufgabenname>`.
- Am Ende muss Codex Cloud entweder einen GitHub-Branch verÃ¶ffentlichen oder einen Pull Request gegen den genannten Base-Branch erstellen.
- Ein Cloud-Ergebnis ohne verÃ¶ffentlichten GitHub-Branch und ohne Pull Request gilt als nicht geliefert.
- Ein Commit-Hash aus der Cloud-Sandbox reicht nicht als Ãœbergabe.
- Wenn Codex Cloud keinen Branch oder PR erstellen kann, muss der Status lauten: `gestoppt â€“ nicht verÃ¶ffentlicht`.

Die Abschlussmeldung muss immer enthalten:

- Base-Branch
- Ergebnis-Branch
- Pull-Request-Link oder klare Meldung, dass kein PR erstellt wurde
- geÃ¤nderte Dateien
- ausgefÃ¼hrte Tests
- `git status`-Ergebnis

Codex Cloud darf nicht behaupten, ein Paket sei fertig Ã¼bernommen, solange es nicht Ã¼ber GitHub als Branch oder PR sichtbar ist.

Lokale Ãœbernahme erfolgt erst nach:

```bash
git fetch origin
git diff --name-status <base-branch>...origin/<cloud-branch>
npm test
```

## Wenn keine Plan-Datei existiert
Wenn `PLAN.md` oder eine vergleichbare Plandatei fehlt und die Aufgabe grÃ¶ÃŸer als ein Mini-Paket ist:
- nicht direkt losbauen
- zuerst einen knappen Plan mit kleinen Meilensteinen vorschlagen
- erst danach mit Meilenstein 1 beginnen

## Merksatz
Lieber ein kleiner sauberer Schritt mit klarer Abnahme als ein groÃŸer cleverer Umbau mit unklaren Folgen.

## Nach jedem abgeschlossenen Meilenstein:
- STATUS.md aktualisieren
- erledigten Schritt eintragen
- Commit-Hash oder PR erwÃ¤hnen, wenn vorhanden
- nÃ¤chsten offenen Schritt nennen
- offene Risiken/Hindernisse ergÃ¤nzen

## Tabellenlayout-Regel
Keine Tabelle darf fuer den Tabellenlayout-Editor geraten werden.

Vor jeder Aufnahme in den Tabellenlayout-Editor muss zuerst fachlich geklärt und vom Nutzer bestaetigt werden:

- Name der Tabelle
- Bereich/Modul
- Art: Inhaltstabelle oder Bedienliste
- Verwendung: UI, PDF oder beides
- sichtbare Spalten in echter Reihenfolge
- zusammengefasste Spalten bleiben zusammen
- `editorEnabled`: ja/nein

In den Tabellenlayout-Editor duerfen nur Inhaltstabellen.

Nicht in den Tabellenlayout-Editor duerfen:
- Auswahl-Popups
- Bedienlisten
- Dropdowns
- Filterlisten
- Protokollauswahl fuer Druck
- Verantwortlichen-Auswahl fuer ToDo-Druck
- Projekt-/Firma-/Person-Auswahl

Verboten:
- Spalten aus Datenbankfeldern erraten
- Spalten aus IPC-Feldern erraten
- Spalten aus Druckdaten erraten
- Telefon und E-Mail trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- Anwesend und Verteiler trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- zusaetzliche Status-/Aktiv-/Rollen-Spalten erfinden

Pflichtfrage vor Aufnahme:

"Ich habe diese Tabelle gefunden:

Name:
Bereich/Modul:
Art:
Verwendung:
Sichtbare Spalten:
1.
2.
3.

Soll diese Tabelle in den Tabellenlayout-Editor aufgenommen werden?"

Ohne ausdrückliches Ja des Nutzers:
- kein Registry-Eintrag
- keine Editor-Freigabe
- keine Spaltenlayout-Definition
