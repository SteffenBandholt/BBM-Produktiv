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

## Pflichtregel fÃ¼r UI-/PDF-Entwurfsentscheidung
Wenn eine Aufgabe eine UI, einen UI-Bereich, ein Layout, eine Maske, ein Formular, eine Tabelle, eine PDF-Ausgabe oder eine Druck-/PDF-Struktur neu erstellt oder verÃ¤ndert, muss Codex **vor** der Umsetzung eine UI-/PDF-Entwurfsentscheidung ausgeben.

Ohne diese Entscheidung darf Codex nicht sofort bauen.

Die UI-/PDF-Entwurfsentscheidung muss enthalten:

A. Art der Ausgabe:
- UI
- PDF
- UI und PDF
- keine editorrelevante Ausgabe

B. EditorfÃ¤higkeit:
- editorfÃ¤hig: ja/nein
- falls nein: kurze BegrÃ¼ndung

C. EditorfÃ¤hige Elemente (pro Element):
- `data-ui-inspector-id`
- `data-ui-editor-kind`
- `data-ui-editor-label`
- `data-ui-editor-parent`
- `data-ui-editor-editable`
- `data-ui-editor-ops`

D. Nicht editorfÃ¤hige Elemente / verbotene Editor-Ziele:
- Fachaktionen
- Speichern
- Anlegen
- LÃ¶schen
- Upload
- Import
- Autosave
- fachliche IPC-/Datenaktionen
- sonstige FachdatenÃ¤nderungen

E. Parent-/Strukturregel:
- jedes editorfÃ¤hige Element auÃŸer Root braucht einen gÃ¼ltigen Parent
- der Parent muss selbst als Editor-Ziel existieren

F. PrÃ¼f-/Testangabe:
- Welche vorhandene PrÃ¼fung oder welcher Guardrail-Test sichert die Regel ab?
- Falls noch keine technische PrÃ¼fung existiert: ausdrÃ¼cklich melden, nicht behaupten.

### Harte Stop-Regel fÃ¼r UI-/PDF-Aufgaben
Wenn die UI-/PDF-Entwurfsentscheidung fehlt, unvollstÃ¤ndig ist oder gegen `docs/UI_EDITOR_VERTRAG.md` verstÃ¶ÃŸt:
- `STOPP`
- keine Umsetzung
- keine Improvisation
- fehlende Entscheidung melden

## Pflichtregeln fÃ¼r Editor 1 / Tabelleneditor / layoutTools
Bei allen Arbeiten an Editor 1, Tabelleneditor, layoutTools, Tabellen-Kalibrierung, Tabellen-Registry, TabellenvertrÃ¤gen, UI-/PDF-Tabellenlayouts oder tableLayouts sind vor jeder Ã„nderung zusÃ¤tzlich zu lesen:

1. `docs/Konzept_und_Vertrag_FINAL.md`
2. `docs/Projektsteuerung_Anti_Kleinklein.md`
3. `docs/Codex_Startblock_Template.md`, falls ein konkreter Codex-Auftrag vorbereitet oder ausgefÃ¼hrt wird

Diese Dokumente sind bindend.

Falls eine dieser Dateien fehlt, darf Codex nicht improvisieren. Dann gilt: stoppen, fehlende Datei melden und keinen Editor-1-Code Ã¤ndern.

### Vor Arbeitsbeginn bei Editor-1-Aufgaben
Codex darf bei Editor-1-Aufgaben nicht sofort losarbeiten.

Vor jeder Ã„nderung muss Codex zuerst eine kurze Startplanung ausgeben:

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

Geplante PrÃ¼fung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...
```

Erst danach darf Codex Ã„nderungen durchfÃ¼hren.

### Harte Verbote bei Editor-1-Aufgaben
Ohne ausdrÃ¼cklichen Auftrag sind verboten:

- echte TOP-Liste Ã¤ndern,
- echte PDF-Ausgabe Ã¤ndern,
- Druckweg Ã¤ndern,
- bestehende Tabellen-Renderer Ã¤ndern,
- sichtbare Editor-UI bauen,
- Toolbar oder Marker in echte App-Laufwege einbauen,
- automatische DOM-/CSS-/PDF-Erkennung bauen,
- SpeicherschlÃ¼ssel aus CSS-Klassen, DOM-Reihenfolge oder sichtbaren Ãœberschriften ableiten,
- UI und PDF automatisch angleichen,
- Sonderlogik pro Tabelle ohne Tabellenvertrag bauen,
- groÃŸe Refactorings nebenbei durchfÃ¼hren.

### Stop-Pflicht bei Editor-1-Aufgaben
Bei Konflikt, Unsicherheit oder nÃ¶tigem Zugriff auf verbotene Bereiche muss Codex sofort stoppen und melden:

```text
STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag fÃ¼r sauberen nÃ¤chsten Schritt:
...
```

Keine eigenmÃ¤chtigen Architekturentscheidungen.
Keine Workarounds gegen die Steuerungsdokumente.

### Abschlussbericht bei Editor-1-Aufgaben
Nach jedem Editor-1-Lauf muss Codex zusÃ¤tzlich zum normalen Abschlussformat berichten:

```text
ABSCHLUSSBERICHT EDITOR 1

GeÃ¤nderte Dateien:
- ...

Umgesetzt:
- ...

AusdrÃ¼cklich nicht geÃ¤ndert:
- ...

Tests/PrÃ¼fung:
- ...

Risiken/Restpunkte:
- ...

NÃ¤chster sinnvoller Schritt:
- ...
```

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
- SpÃ¤tere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps prÃ¼fen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fÃ¼r andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswÃ¤hlbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswÃ¤hlbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spÃ¤ter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext; ein Projektklick startet nicht direkt `Protokoll`.

ARCHITEKTUR-FLAG:
- Das Protokoll-Modul wird aktuell nicht weiter modularisiert.
- Der aktuelle Stand bleibt bestehen; keine weiteren Modularisierungsarbeiten ohne ausdrÃ¼cklichen Auftrag.
- `TopsHeader` und `TopsList` sind wieder im Protokoll-Modul verankert.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen, auÃŸer bei echtem Fehler oder konkretem Featurebedarf.

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
Keine Tabelle darf fÃ¼r den Tabellenlayout-Editor geraten werden.

Vor jeder Aufnahme in den Tabellenlayout-Editor muss zuerst fachlich geklÃ¤rt und vom Nutzer bestÃ¤tigt werden:

- Name der Tabelle
- Bereich/Modul
- Art: Inhaltstabelle oder Bedienliste
- Verwendung: UI, PDF oder beides
- sichtbare Spalten in echter Reihenfolge
- zusammengefasste Spalten bleiben zusammen
- `editorEnabled`: ja/nein

In den Tabellenlayout-Editor dÃ¼rfen nur Inhaltstabellen.

Nicht in den Tabellenlayout-Editor dÃ¼rfen:
- Auswahl-Popups
- Bedienlisten
- Dropdowns
- Filterlisten
- Protokollauswahl fÃ¼r Druck
- Verantwortlichen-Auswahl fÃ¼r ToDo-Druck
- Projekt-/Firma-/Person-Auswahl

Verboten:
- Spalten aus Datenbankfeldern erraten
- Spalten aus IPC-Feldern erraten
- Spalten aus Druckdaten erraten
- Telefon und E-Mail trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- Anwesend und Verteiler trennen, wenn sie sichtbar eine gemeinsame Spalte sind
- zusÃ¤tzliche Status-/Aktiv-/Rollen-Spalten erfinden

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

Ohne ausdrÃ¼ckliches Ja des Nutzers:
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
- UI und/oder PDF grundsÃ¤tzlich vorhanden

gilt die Tabelle als Feintuning-Kandidat fÃ¼r den Tabellenlayout-Editor.

Der Tabellenlayout-Editor ist dann der Feintuning-Schritt nach dem Prototyp:
- Spaltenbreiten einstellen
- UI- und PDF-Breiten getrennt einstellen
- speichern
- resetten
- prÃ¼fen

Dadurch dÃ¼rfen spÃ¤tere BreitenÃ¤nderungen nicht mehr Ã¼ber Codex-Prompts laufen.

FÃ¼r jede neue Inhaltstabelle muss dokumentiert und registriert werden:
- `tableKey`
- Anzeigename
- Bereich/Modul
- Art: Inhaltstabelle
- UI vorhanden ja/nein
- PDF vorhanden ja/nein
- sichtbare Spalten in echter Reihenfolge
- Standardbreiten UI, falls UI vorhanden
- Standardbreiten PDF, falls PDF vorhanden
- `editorEnabled`, sobald der Prototyp fÃ¼r das Feintuning bereit ist

Bedienlisten bleiben ausgeschlossen.

Ohne diesen Layout-Steckbrief keine spÃ¤tere Breitenpflege per Codex-Prompt.


## UI-Inspektor-Projekt

Regeln:
- Vor Arbeiten am UI-Inspektor zuerst lesen:
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_PROJEKTAUFTRAG.md`
  - `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md`
- Die verbindliche Lesereihenfolge steht in `docs/UI_INSPEKTOR_START_HIER.md` (Startpunkt für neue Chats und Codex-Läufe).
- Keine UI-Inspektor-Aufgabe ohne Aufgabenheft-Update abschließen.
- UI-Inspektor-Core muss exportierbar und frei von BBM-Fachlogik bleiben.
- Tabellen-Kalibrator nicht als UI-Inspektor-Bedienoberfläche weiterentwickeln.
- Keine bestehenden App-Bereiche ändern, wenn der Auftrag nur Dokumentation betrifft.
- M6 ist der erste Code-Schritt, aber nur Modulgerüst.
- Kein Overlay und keine Restarbeiten-Anbindung in M6.

<!-- UI-EDITOR-KIT:START -->
# AGENTS-Block UI-Editor

Diesen Block unveraendert in die `AGENTS.md` einer Ziel-App uebernehmen.

## Fuehrende Unterlagen

Vor jeder UI- oder PDF-Umsetzung muessen diese Unterlagen beachtet werden:

- `docs/EDITOR_BAUPLAN.md`
- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`
- `docs/UI_EDITOR_VERTRAG.md`
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

Wenn eine dieser Grundlagen fehlt oder unklar ist: STOPP.

## Verbindliche Regel fuer UI/PDF-Aufgaben

Vor jeder UI- oder PDF-Umsetzung muss zuerst eine UI-/PDF-Entwurfsentscheidung vorliegen.

Die Entwurfsentscheidung muss enthalten:

- Art der Ausgabe: UI, PDF, beides oder nicht editorrelevant
- Editorfaehig: ja oder nein
- Editorfaehige Bereiche
- Editorfaehige Gruppen
- Editorfaehige Untergruppen
- Editorfaehige Komponenten
- Editorfaehige Tabellen
- Editorfaehige Spalten einschliesslich Metaspalten
- Editorfaehige Buttons
- Editorfaehige Felder
- Parent-Struktur
- Erlaubte Operationen je Element
- Gesperrte Operationen je Element
- Nicht editorfaehige fachliche Aktionen
- Pruefung mit `scripts/ui-editor-contract-check.cjs` oder klarer Hinweis, falls die Pruefung noch fehlt

## Pflichtangaben je editorrelevantem Element

Jedes editorrelevante Element muss nach dem UI-Elementkatalog klassifiziert werden.

Pflichtangaben:

- `id`
- `name`
- `type`
- `role`
- `parentId`
- `order`
- `visible`
- `editable`
- `allowedOps`
- `lockedOps`

Je nach Elementtyp sind weitere Angaben erforderlich, zum Beispiel:

- `columnRole`
- `fieldKind`
- `actionKind`
- `componentKind`

## Harte Editor-Regeln

- Kein relevantes UI-Element ohne Klassifizierung.
- Keine Tabelle ohne klassifizierte editorrelevante Spalten.
- Keine Metaspalte ohne Rolle.
- Kein Button ohne klare Trennung zwischen UI-Element und fachlicher Aktion.
- Keine Parent-Struktur raten.
- Keine bestehende UI analysieren.
- Keine bestehende UI scannen.
- Keine automatische Bestandserkennung.
- Keine automatische UI-Elementliste erzeugen.
- Keine bestehende Legacy-UI automatisch migrieren.
- Keine Elemente erfinden.
- Keine Fachdaten in IDs oder Metadaten schreiben.

## Ausschluss fachlicher Aktionen als Editor-Ziele

Nicht editorfaehig sind insbesondere:

- Fachaktionen
- fachliches Speichern
- fachliches Anlegen
- fachliches Loeschen
- Upload
- Import
- Export
- Autosave
- fachliche IPC-/Datenaktionen
- Datenbankaktionen
- fachliches Ausfuehren eines Buttons

## Pruefung nach UI-Bau

Nach dem Bau oder Umbau einer editorfaehigen UI muss ein Vertragscheck laufen.

Wenn der Check Fehler meldet:

1. Fehler nennen
2. Ursache reparieren
3. Check erneut ausfuehren
4. Ergebnis melden

Eine editorfaehige UI ist erst fertig, wenn der Vertragscheck gruen ist.

## Stop-Regel

Wenn die Entwurfsentscheidung fehlt oder unvollstaendig ist: STOPP.

Wenn Pflichtangaben fuer editorrelevante Elemente fehlen: STOPP.

Wenn der Auftrag auf UI-Analyse, Bestandsanalyse, UI-Erkennung, UI-Scan oder automatische Migration bestehender UI hinauslaeuft: STOPP.

Wenn Tabellen, Metaspalten, Buttons oder Fachaktionen nicht sauber klassifiziert sind: STOPP.

In diesem Fall darf keine UI- oder PDF-Struktur als fertig gemeldet werden.
<!-- UI-EDITOR-KIT:END -->
