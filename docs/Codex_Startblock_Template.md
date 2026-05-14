# Editor 1 - Codex-Startblock-Template

Stand: 14.05.2026
Zweck: Vorlage fuer jeden spaeteren Codex-Auftrag zu Editor 1.

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
5. docs/Konzept_und_Vertrag_FINAL.md
6. docs/Projektsteuerung_Anti_Kleinklein.md

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

Geplante Pruefung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...

Erst nach dieser Startplanung Aenderungen durchfuehren.

Wenn der Auftrag gegen eine Regel aus den gelesenen Dokumenten verstoesst, stoppe sofort und melde:

STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag fuer sauberen naechsten Schritt:
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

Tests/Pruefung:
- [TEST ODER PRUEFUNG]

Abschlussbericht muss enthalten:
- geaenderte Dateien,
- was umgesetzt wurde,
- was ausdruecklich nicht geaendert wurde,
- welche Tests gelaufen sind,
- offene Punkte,
- naechster empfohlener Schritt.
```

---

## Beispiel fuer Teil 1 - Fundament

```text
Paketname:
Editor 1 - Teil 1 Fundament: Tabellenvertrag, Registry, Variantenmodell

Ziel:
Nur die technische Grundlage fuer Editor 1 schaffen.

Nicht-Ziel:
Keine sichtbare Editor-UI.
Keine echte Tabelle anschliessen.
Keine TOP-Liste aendern.
Keine PDF-Ausgabe aendern.
Keinen Druckweg aendern.
Keine Toolbar.
Keine Marker in echten Tabellen.

Erlaubte Bereiche:
- neuer Editor-1-Grundlagenbereich unter layoutTools, sofern passend nach Repo-Pruefung
- Tests unter scripts/tests/
- Dokumentation unter docs/

Verbotene Bereiche:
- echte Protokoll-/TOP-UI
- echte PDF-Ausgabe
- Druck-/Preview-Laufwege
- bestehende Tabellen-Renderer
- ToDo-/Teilnehmerlisten-Ausgaben

Konkrete Aufgaben:
1. Pruefe die vorhandene Repo-Struktur fuer layoutTools/tableLayouts, ohne Laufwege zu aendern.
2. Lege ein kleines Editor-1-Fundament fuer Tabellenvertrag, Variantenmodell und Registry an.
3. Ergaenze Plausibilitaetsfunktionen fuer Layoutwerte.
4. Ergaenze Tests fuer Vertrag, Registry, Varianten und Plausibilitaet.
5. Dokumentiere kurz, wie spaetere Tabellen angebunden werden sollen.

Abnahmekriterien:
- Es existiert ein Tabellenvertrag mit stabilen Keys.
- Es existiert ein Variantenmodell fuer UI, PDF Hochformat, PDF Querformat.
- Es existiert eine Registry-Struktur.
- Layoutwerte koennen plausibel geprueft werden.
- Tests laufen gruen.
- Keine echte UI/PDF-Ausgabe wurde veraendert.

Tests/Pruefung:
- npm test
- zusaetzlich gezielte neue Tests nennen
```
