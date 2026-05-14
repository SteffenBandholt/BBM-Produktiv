# AGENTS.md — BBM-Produktiv

## Zweck
Diese Datei legt die dauerhaften Arbeitsregeln für Codex in diesem Repository fest.

Codex soll in diesem Repo vorsichtig, kleinräumig und nachvollziehbar arbeiten.
Ziel ist die weitere Modularisierung und Konsolidierung, ohne unnötige Verhaltensänderungen.

## Vor jeder Arbeit lesen
Lies zuerst diese Dateien, soweit vorhanden und für die Aufgabe relevant:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `PLAN.md` oder andere aufgabenspezifische Plandateien

Wenn sich Regeln widersprechen, gilt diese Reihenfolge:
1. direkte Nutzeranweisung
2. `AGENTS.md`
3. aufgabenspezifische Plan-Datei
4. übrige Doku

## Pflichtregeln für Editor 1 / Tabelleneditor / layoutTools
Bei allen Arbeiten an Editor 1, Tabelleneditor, layoutTools, Tabellen-Kalibrierung, Tabellen-Registry, Tabellenverträgen, UI-/PDF-Tabellenlayouts oder tableLayouts sind vor jeder Änderung zusätzlich zu lesen:

1. `docs/Editor_1_Konzept_und_Vertrag.md`
2. `docs/Editor_1_Projektsteuerung_Anti_Kleinklein.md`
3. `docs/Editor_1_Codex_Startblock_Template.md`, falls ein konkreter Codex-Auftrag vorbereitet oder ausgeführt wird

Diese Dokumente sind bindend.

Falls eine dieser Dateien fehlt, darf Codex nicht improvisieren. Dann gilt: stoppen, fehlende Datei melden und keinen Editor-1-Code ändern.

### Vor Arbeitsbeginn bei Editor-1-Aufgaben
Codex darf bei Editor-1-Aufgaben nicht sofort losarbeiten.

Vor jeder Änderung muss Codex zuerst eine kurze Startplanung ausgeben:

```text
STARTPLANUNG

Gelesene Steuerungsdateien:
- ...

Ziel dieses Pakets:
- ...

Nicht-Ziele dieses Pakets:
- ...

Erlaubte Bereiche/Dateien:
- ...

Verbotene Bereiche/Dateien:
- ...

Geplante Prüfung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...
```

Erst danach darf Codex Änderungen durchführen.

### Harte Verbote bei Editor-1-Aufgaben
Ohne ausdrücklichen Auftrag sind verboten:

- echte TOP-Liste ändern,
- echte PDF-Ausgabe ändern,
- Druckweg ändern,
- bestehende Tabellen-Renderer ändern,
- sichtbare Editor-UI bauen,
- Toolbar oder Marker in echte App-Laufwege einbauen,
- automatische DOM-/CSS-/PDF-Erkennung bauen,
- Speicherschlüssel aus CSS-Klassen, DOM-Reihenfolge oder sichtbaren Überschriften ableiten,
- UI und PDF automatisch angleichen,
- Sonderlogik pro Tabelle ohne Tabellenvertrag bauen,
- große Refactorings nebenbei durchführen.

### Stop-Pflicht bei Editor-1-Aufgaben
Bei Konflikt, Unsicherheit oder nötigem Zugriff auf verbotene Bereiche muss Codex sofort stoppen und melden:

```text
STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag für sauberen nächsten Schritt:
...
```

Keine eigenmächtigen Architekturentscheidungen.
Keine Workarounds gegen die Steuerungsdokumente.

### Abschlussbericht bei Editor-1-Aufgaben
Nach jedem Editor-1-Lauf muss Codex zusätzlich zum normalen Abschlussformat berichten:

```text
ABSCHLUSSBERICHT EDITOR 1

Geänderte Dateien:
- ...

Umgesetzt:
- ...

Ausdrücklich nicht geändert:
- ...

Tests/Prüfung:
- ...

Risiken/Restpunkte:
- ...

Nächster sinnvoller Schritt:
- ...
```

## Arbeitsmodus
Arbeite standardmäßig im Meilensteinbetrieb.

Das heißt:
- immer nur den **nächsten offenen Meilenstein** bearbeiten
- niemals mehrere offene Baustellen gleichzeitig vermischen
- nach jedem Meilenstein prüfen und kurz berichten
- erst dann mit dem nächsten Meilenstein weitermachen

Wenn keine Plan-Datei vorhanden ist:
- nicht eigenmächtig eine große Umbauaktion starten
- zuerst einen kleinen, sicheren nächsten Schritt vorschlagen
- nur diesen einen Schritt umsetzen

## Grundregeln
- Arbeite in **kleinen, reviewbaren Paketen**.
- Halte das **bestehende Verhalten stabil**, außer wenn im Auftrag ausdrücklich etwas anderes steht.
- **Keine neuen Features**, wenn sie nicht ausdrücklich verlangt sind.
- **Keine breiten Refactorings** außerhalb des aktuellen Meilensteins.
- **Keine Versions-Upgrades** oder neue Abhängigkeiten, außer wenn zwingend nötig und ausdrücklich erlaubt.
- **Keine kosmetischen Formatierungswellen** ohne fachlichen Nutzen.
- Ändere nur die Dateien, die für das aktuelle Paket wirklich nötig sind.

## Fokus des Repos
Dieses Repo befindet sich in einem kontrollierten Umbau von einer stärker monolithischen Struktur zu klareren Modulen.

Aktuell wichtige Bereiche:
- `Protokoll`

ARCHITEKTUR-LEITLINIE:
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spätere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps prüfen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale für andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswählbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswählbares Projektmodul ist `Protokoll`; `Restarbeiten` kann später als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext; ein Projektklick startet nicht direkt `Protokoll`.

ARCHITEKTUR-FLAG:
- Das Protokoll-Modul wird aktuell nicht weiter modularisiert.
- Der aktuelle Stand bleibt bestehen; keine weiteren Modularisierungsarbeiten ohne ausdrücklichen Auftrag.
- `TopsHeader` und `TopsList` sind wieder im Protokoll-Modul verankert.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen, außer bei echtem Fehler oder konkretem Featurebedarf.

Wichtig:
- Der Umbau ist **nicht abgeschlossen**.
- Altpfade und Übergangsstrukturen können noch vorhanden sein.
- Nicht gleichzeitig „aufräumen“, „verbessern“ und „neu strukturieren“, wenn das nicht ausdrücklich Teil des aktuellen Pakets ist.

## Bevorzugte Arbeitsweise
Bei Umbau- und Modularisierungsaufgaben:
1. aktuellen Meilenstein kurz zusammenfassen
2. betroffene Dateien nennen
3. Änderung minimal umsetzen
4. nur passende Prüfungen ausführen
5. Ergebnis knapp berichten

Wenn ein kleiner, sicherer Zwischenschritt möglich ist, bevorzuge diesen gegenüber einer größeren Komplettlösung.

## Was ausdrücklich vermieden werden soll
- keine stillen Architekturentscheidungen nebenbei
- keine Umbauten in angrenzenden Modulen „der Ordnung halber“
- keine Änderungen an Router, Datenbank, Navigation oder Build-Setup, wenn das aktuelle Paket das nicht verlangt
- keine erfundenen Prüfungen oder Behauptungen, dass etwas getestet wurde, wenn es nicht wirklich ausgeführt wurde
- keine Aussage „fertig“, wenn noch rote Checks, unklare Folgen oder offene Hindernisse bestehen

## Validierung
Wenn für den aktuellen Meilenstein passende Prüfungen existieren, führe sie aus.

Bevorzugte Reihenfolge:
1. kleine, direkt passende Prüfungen
2. relevante Tests für den betroffenen Bereich
3. Build/Lint nur dann, wenn sinnvoll vorhanden und nicht unverhältnismäßig für das Mini-Paket

Wenn keine zuverlässige technische Prüfung vorhanden ist, sage das offen.

Wichtig:
- Nicht so tun, als sei die fachliche Nutzerprüfung ersetzt.
- Der Mensch prüft am Ende fachlich, ob die App noch tut, was sie soll.

## Stop-Regel
Stoppe und berichte, statt weiter umzubauen, wenn mindestens einer dieser Fälle eintritt:

- der aktuelle Meilenstein wird deutlich größer als geplant
- es wären mehr Dateien oder Module betroffen als vorgesehen
- eine Architekturentscheidung ist nötig, die nicht dokumentiert ist
- die Validierung schlägt fehl und ist nicht mit kleinem, lokalem Fix lösbar
- die Aufgabe würde neue Abhängigkeiten, Upgrades oder Nebenumbauten erzwingen
- die Anforderung im Repo ist widersprüchlich oder unklar

## Ausgabeformat nach jeder Aufgabe
Antworte am Ende immer in dieser Form:

### Ergebnis
- Was wurde gemacht?

### Geänderte Dateien
- Liste aller geänderten Dateien

### Prüfung
- Welche Prüfungen wurden ausgeführt?
- Was war das Ergebnis?

### Risiken / offen
- Was ist noch offen?
- Gibt es Restrisiken?

### Status
- fertig
- oder: gestoppt bei Meilenstein X mit Begründung

## Review-Regeln
Achte bei Reviews besonders auf:
- unbeabsichtigte Verhaltensänderungen
- Paketbruch: zu viele Dateien oder zu große Seiteneffekte
- Änderungen außerhalb des aktuellen Meilensteins
- versteckte Kopplung zwischen Altstruktur und Modulstruktur
- unstimmige Importpfade
- Änderungen, die nach „kleinem Paket“ aussehen, aber faktisch mehrere Baustellen zugleich öffnen

## Git- und PR-Regeln
- Ein PR soll idealerweise nur **einen sauberen Meilenstein** oder ein klar abgegrenztes Mini-Paket enthalten.
- Keine Sammel-PRs mit mehreren unabhängigen Umbauten.
- PR-Titel und Beschreibung sollen kurz sagen:
  - welches Paket bearbeitet wurde
  - was nicht angefasst wurde
  - welche Prüfungen gelaufen sind

## Codex-Cloud-Regeln
Diese Regeln gelten für alle Aufgaben, die in Codex Cloud laufen.

- Jede Cloud-Aufgabe muss mit einem klaren Base-Branch starten.
- Der Base-Branch wird im jeweiligen Auftrag ausdrücklich genannt.
- Codex Cloud darf keinen Base-Branch selbst raten.
- Jede Cloud-Aufgabe muss auf einem eigenen Branch arbeiten, z. B. `codex/<kurzer-aufgabenname>`.
- Am Ende muss Codex Cloud entweder einen GitHub-Branch veröffentlichen oder einen Pull Request gegen den genannten Base-Branch erstellen.
- Ein Cloud-Ergebnis ohne veröffentlichten GitHub-Branch und ohne Pull Request gilt als nicht geliefert.
- Ein Commit-Hash aus der Cloud-Sandbox reicht nicht als Übergabe.
- Wenn Codex Cloud keinen Branch oder PR erstellen kann, muss der Status lauten: `gestoppt – nicht veröffentlicht`.

Die Abschlussmeldung muss immer enthalten:

- Base-Branch
- Ergebnis-Branch
- Pull-Request-Link oder klare Meldung, dass kein PR erstellt wurde
- geänderte Dateien
- ausgeführte Tests
- `git status`-Ergebnis

Codex Cloud darf nicht behaupten, ein Paket sei fertig übernommen, solange es nicht über GitHub als Branch oder PR sichtbar ist.

Lokale Übernahme erfolgt erst nach:

```bash
git fetch origin
git diff --name-status <base-branch>...origin/<cloud-branch>
npm test
```

## Wenn keine Plan-Datei existiert
Wenn `PLAN.md` oder eine vergleichbare Plandatei fehlt und die Aufgabe größer als ein Mini-Paket ist:
- nicht direkt losbauen
- zuerst einen knappen Plan mit kleinen Meilensteinen vorschlagen
- erst danach mit Meilenstein 1 beginnen

## Merksatz
Lieber ein kleiner sauberer Schritt mit klarer Abnahme als ein großer cleverer Umbau mit unklaren Folgen.

## Nach jedem abgeschlossenen Meilenstein:
- STATUS.md aktualisieren
- erledigten Schritt eintragen
- Commit-Hash oder PR erwähnen, wenn vorhanden
- nächsten offenen Schritt nennen
- offene Risiken/Hindernisse ergänzen

## Tabellenlayout-Regel
Keine Tabelle darf für den Tabellenlayout-Editor geraten werden.

Vor jeder Aufnahme in den Tabellenlayout-Editor muss zuerst fachlich geklärt und vom Nutzer bestätigt werden:

- Name der Tabelle
- Bereich/Modul
- Art: Inhaltstabelle oder Bedienliste
- Verwendung: UI, PDF oder beides
- sichtbare Spalten in echter Reihenfolge
- zusammengefasste Spalten bleiben zusammen
- `editorEnabled`: ja/nein

In den Tabellenlayout-Editor dürfen nur Inhaltstabellen.

Nicht in den Tabellenlayout-Editor dürfen:
- Auswahl-Popups
- Bedienlisten
- Dropdowns
- Filterlisten
- Protokollauswahl für Druck
- Verantwortlichen-Auswahl für ToDo-Druck
- Projekt-/Firma-/Person-Auswahl

Verboten:
- Spalten aus Datenbankfeldern erraten
- Spalten aus IPC-Feldern erraten
- Spalten aus Druckdaten erraten
- Telefon und E-Mail trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- Anwesend und Verteiler trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- zusätzliche Status-/Aktiv-/Rollen-Spalten erfinden

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

## Entstehungsprozess neuer Tabellen
Wenn eine neue fachliche Inhaltstabelle in UI oder PDF gebaut wird, muss Codex beim Bau direkt einen Tabellenlayout-Steckbrief vorbereiten.

Sobald der Tabellen-Prototyp fachlich steht, also:
- Inhalte klar
- Spalten klar
- Reihenfolge klar
- Grunddesign klar
- UI und/oder PDF grundsätzlich vorhanden

gilt die Tabelle als Feintuning-Kandidat für den Tabellenlayout-Editor.

Der Tabellenlayout-Editor ist dann der Feintuning-Schritt nach dem Prototyp:
- Spaltenbreiten einstellen
- UI- und PDF-Breiten getrennt einstellen
- speichern
- resetten
- prüfen

Dadurch dürfen spätere Breitenänderungen nicht mehr über Codex-Prompts laufen.

Für jede neue Inhaltstabelle muss dokumentiert und registriert werden:
- `tableKey`
- Anzeigename
- Bereich/Modul
- Art: Inhaltstabelle
- UI vorhanden ja/nein
- PDF vorhanden ja/nein
- sichtbare Spalten in echter Reihenfolge
- Standardbreiten UI, falls UI vorhanden
- Standardbreiten PDF, falls PDF vorhanden
- `editorEnabled`, sobald der Prototyp für das Feintuning bereit ist

Bedienlisten bleiben ausgeschlossen.

Ohne diesen Layout-Steckbrief keine spätere Breitenpflege per Codex-Prompt.
