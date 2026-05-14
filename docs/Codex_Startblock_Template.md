# Editor 1 â€“ Codex-Startblock-Template

Stand: 14.05.2026  
Zweck: Vorlage fÃ¼r jeden spÃ¤teren Codex-Auftrag zu Editor 1.

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

Geplante PrÃ¼fung/Tests:
- ...

Konflikte oder Unsicherheiten:
- keine / ...

Erst nach dieser Startplanung Ã„nderungen durchfÃ¼hren.

Wenn der Auftrag gegen eine Regel aus den gelesenen Dokumenten verstÃ¶ÃŸt, stoppe sofort und melde:

STOPP
Grund:
...
Betroffene Regel:
...
Vorschlag fÃ¼r sauberen nÃ¤chsten Schritt:
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

Tests/PrÃ¼fung:
- [TEST ODER PRÃœFUNG]

Abschlussbericht muss enthalten:
- geÃ¤nderte Dateien,
- was umgesetzt wurde,
- was ausdrÃ¼cklich nicht geÃ¤ndert wurde,
- welche Tests gelaufen sind,
- offene Punkte,
- nÃ¤chster empfohlener Schritt.
```

---

## Beispiel fÃ¼r Teil 1 â€“ Fundament

```text
Paketname:
Editor 1 â€“ Teil 1 Fundament: Tabellenvertrag, Registry, Variantenmodell

Ziel:
Nur die technische Grundlage fÃ¼r Editor 1 schaffen.

Nicht-Ziel:
Keine sichtbare Editor-UI.
Keine echte Tabelle anschlieÃŸen.
Keine TOP-Liste Ã¤ndern.
Keine PDF-Ausgabe Ã¤ndern.
Keinen Druckweg Ã¤ndern.
Keine Toolbar.
Keine Marker in echten Tabellen.

Erlaubte Bereiche:
- neuer Editor-1-Grundlagenbereich unter layoutTools, sofern passend nach Repo-PrÃ¼fung
- Tests unter scripts/tests/
- Dokumentation unter docs/

Verbotene Bereiche:
- echte Protokoll-/TOP-UI
- echte PDF-Ausgabe
- Druck-/Preview-Laufwege
- bestehende Tabellen-Renderer
- ToDo-/Teilnehmerlisten-Ausgaben

Konkrete Aufgaben:
1. PrÃ¼fe die vorhandene Repo-Struktur fÃ¼r layoutTools/tableLayouts, ohne Laufwege zu Ã¤ndern.
2. Lege ein kleines Editor-1-Fundament fÃ¼r Tabellenvertrag, Variantenmodell und Registry an.
3. ErgÃ¤nze PlausibilitÃ¤tsfunktionen fÃ¼r Layoutwerte.
4. ErgÃ¤nze Tests fÃ¼r Vertrag, Registry, Varianten und PlausibilitÃ¤t.
5. Dokumentiere kurz, wie spÃ¤tere Tabellen angebunden werden sollen.

Abnahmekriterien:
- Es existiert ein Tabellenvertrag mit stabilen Keys.
- Es existiert ein Variantenmodell fÃ¼r UI, PDF Hochformat, PDF Querformat.
- Es existiert eine Registry-Struktur.
- Layoutwerte kÃ¶nnen plausibel geprÃ¼ft werden.
- Tests laufen grÃ¼n.
- Keine echte UI/PDF-Ausgabe wurde verÃ¤ndert.

Tests/PrÃ¼fung:
- npm test
- zusÃ¤tzlich gezielte neue Tests nennen
```

