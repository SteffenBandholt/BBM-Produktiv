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
- `Restarbeiten`

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

## Wenn keine Plan-Datei existiert
Wenn `PLAN.md` oder eine vergleichbare Plandatei fehlt und die Aufgabe größer als ein Mini-Paket ist:
- nicht direkt losbauen
- zuerst einen knappen Plan mit kleinen Meilensteinen vorschlagen
- erst danach mit Meilenstein 1 beginnen

## Merksatz
Lieber ein kleiner sauberer Schritt mit klarer Abnahme als ein großer cleverer Umbau mit unklaren Folgen.