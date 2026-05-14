# Editor 1 – Codex-Startblock-Template

Stand: 14.05.2026  
Zweck: Vorlage für jeden späteren Codex-Auftrag zu Editor 1.

---

## Vorlage

```text
Du arbeitest im Repository BBM-Produktiv.

Arbeite nicht sofort los.

Vor Beginn zwingend lesen:
1. AGENTS.md
2. ZUERST_LESEN_Codex.md
3. ARCHITECTURE.md
4. docs/MODULARISIERUNGSPLAN.md
5. docs/Editor_1_Konzept_und_Vertrag.md
6. docs/Editor_1_Projektsteuerung_Anti_Kleinklein.md

Danach zuerst ausgeben:

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

Erst nach dieser Startplanung Änderungen durchführen.

Wenn der Auftrag gegen eine Regel aus den gelesenen Dokumenten verstößt, stoppe sofort und melde:

STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag für sauberen nächsten Schritt:
...

Paketname:
[HIER PAKETNAME EINSETZEN]

Ziel:
[HIER ZIEL EINSETZEN]

Nicht-Ziel:
[HIER NICHT-ZIELE EINSETZEN]

Erlaubte Bereiche:
[HIER ERLAUBTE BEREICHE EINSETZEN]

Verbotene Bereiche:
[HIER VERBOTENE BEREICHE EINSETZEN]

Konkrete Aufgaben:
1. [AUFGABE]
2. [AUFGABE]
3. [AUFGABE]

Abnahmekriterien:
- [KRITERIUM]
- [KRITERIUM]
- [KRITERIUM]

Tests/Prüfung:
- [TEST ODER PRÜFUNG]

Abschlussbericht muss enthalten:
- geänderte Dateien,
- was umgesetzt wurde,
- was ausdrücklich nicht geändert wurde,
- welche Tests gelaufen sind,
- offene Punkte,
- nächster empfohlener Schritt.
```

---

## Beispiel für Teil 1 – Fundament

```text
Paketname:
Editor 1 – Teil 1 Fundament: Tabellenvertrag, Registry, Variantenmodell

Ziel:
Nur die technische Grundlage für Editor 1 schaffen.

Nicht-Ziel:
Keine sichtbare Editor-UI.
Keine echte Tabelle anschließen.
Keine TOP-Liste ändern.
Keine PDF-Ausgabe ändern.
Keinen Druckweg ändern.
Keine Toolbar.
Keine Marker in echten Tabellen.

Erlaubte Bereiche:
- neuer Editor-1-Grundlagenbereich unter layoutTools, sofern passend nach Repo-Prüfung
- Tests unter scripts/tests/
- Dokumentation unter docs/

Verbotene Bereiche:
- echte Protokoll-/TOP-UI
- echte PDF-Ausgabe
- Druck-/Preview-Laufwege
- bestehende Tabellen-Renderer
- ToDo-/Teilnehmerlisten-Ausgaben

Konkrete Aufgaben:
1. Prüfe die vorhandene Repo-Struktur für layoutTools/tableLayouts, ohne Laufwege zu ändern.
2. Lege ein kleines Editor-1-Fundament für Tabellenvertrag, Variantenmodell und Registry an.
3. Ergänze Plausibilitätsfunktionen für Layoutwerte.
4. Ergänze Tests für Vertrag, Registry, Varianten und Plausibilität.
5. Dokumentiere kurz, wie spätere Tabellen angebunden werden sollen.

Abnahmekriterien:
- Es existiert ein Tabellenvertrag mit stabilen Keys.
- Es existiert ein Variantenmodell für UI, PDF Hochformat, PDF Querformat.
- Es existiert eine Registry-Struktur.
- Layoutwerte können plausibel geprüft werden.
- Tests laufen grün.
- Keine echte UI/PDF-Ausgabe wurde verändert.

Tests/Prüfung:
- npm test
- zusätzlich gezielte neue Tests nennen
```
