# Tabellenlayout - Inventar-Auftrag V1

Stand: 14.05.2026  
Projekt: BBM-Produktiv / Tabellenlayout / Mini-Kalibrator  
Status: naechster Arbeitsauftrag vor Code-Aenderungen

---

## 1. Zweck

Dieser Auftrag dient dazu, die vorhandenen Tabellen und Tabellenlayout-Strukturen im Repo zu erfassen.

Es wird noch nichts gebaut.

Es wird nichts geloescht.

Es wird kein App-Code geaendert.

Ziel ist eine klare Entscheidungsgrundlage fuer die erste layoutfaehige Tabelle.

---

## 2. Verbindliche Grundlage

Vor Beginn sind zu lesen:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `docs/Konzept_und_Vertrag_FINAL.md`
6. `docs/Projektsteuerung_Anti_Kleinklein.md`
7. `docs/Codex_Startblock_Template.md`
8. `docs/Editor_1_Projektauftrag.md`
9. `docs/Tabellenlayout_Kurskorrektur_V1.md`

Wenn eine Datei fehlt, wird gestoppt.

---

## 3. Ziel dieses Auftrags

Erstelle ein Inventar der relevanten Tabellen und vorhandenen Tabellenlayout-Technik.

Ergebnisdatei:

```text
docs/Tabellenlayout_Inventar_V1.md
```

Diese Datei soll die Grundlage fuer die Entscheidung liefern:

```text
Welche Tabelle wird zuerst layoutfaehig gemacht?
```

---

## 4. Nicht-Ziele

Nicht erlaubt in diesem Auftrag:

- keine Code-Aenderung,
- keine UI-Aenderung,
- keine PDF-Aenderung,
- keine Druckweg-Aenderung,
- keine Tabellen umbauen,
- keine Tabellen neu bauen,
- keine Registry aendern,
- keine Tests aendern,
- keine Dateien loeschen,
- keine automatische Tabellen-Erkennung bauen,
- keine Kandidatenlogik bauen,
- keine Editor-UI bauen.

---

## 5. Zu erfassende Bereiche

Codex soll die vorhandene Repo-Struktur lesen und erfassen:

```text
src/renderer/layoutTools/
src/renderer/modules/
src/renderer/print/
src/main/ipc/
scripts/tests/
docs/
```

Es duerfen weitere Dateien gelesen werden, wenn sie fuer die Bestandsaufnahme noetig sind.

---

## 6. Zu erfassende Informationen je Tabelle

Fuer jede relevante Tabelle oder tabellenartige Ausgabe soll dokumentiert werden:

```text
tableKey, falls vorhanden
sichtbarer Name
Bereich/Modul
Verwendung: UI, PDF oder beides
Varianten: ui, pdfPortrait, pdfLandscape
sichtbare Spalten in echter Reihenfolge
heutige Quelle der Spaltenbreiten
heutige Quelle von Padding/Schriftgroesse
ob bereits zentrale Layoutwerte existieren
ob die Tabelle produktiv genutzt wird
Risiko beim Umbau
Empfehlung: Pilot / spaeter / nicht geeignet
```

---

## 7. Mindestkandidaten

Mindestens pruefen:

```text
TOP-Liste UI
TOP-Liste PDF
ToDo-Liste PDF
Teilnehmerliste PDF
Projektfirmenliste UI
Projektfirmenliste PDF, falls vorhanden
```

Falls weitere offensichtliche Inhaltstabellen gefunden werden, aufnehmen.

Bedienlisten, Dropdowns, Auswahl-Popups und Filterlisten nicht als Pilot empfehlen.

---

## 8. Zu erfassende vorhandene Technik

Neben den Tabellen selbst soll dokumentiert werden:

```text
Welche tableLayouts-Dateien existieren noch?
Welche layoutTools-Dateien existieren noch?
Welche Registry-Strukturen existieren noch?
Welche Resolver existieren noch?
Welche Repository-/DB-Strukturen existieren noch?
Welche IPC-Endpunkte existieren noch?
Welche Tests existieren noch?
Welche Teile sind im normalen App-Laufweg aktiv?
Welche Teile sind nur Unterbau?
Welche Teile sind Altlast?
```

---

## 9. Klassifizierung

Jede gefundene Struktur soll eine klare Klassifizierung bekommen:

```text
behalten
kapseln
anpassen
stilllegen
spaeter entfernen
nicht fuer V1 verwenden
```

Keine vage Formulierung wie:

```text
koennte man vielleicht nutzen
```

Wenn etwas unklar ist, muss es als unklar markiert werden.

---

## 10. Pilot-Empfehlung

Am Ende der Datei muss eine konkrete Empfehlung stehen:

```text
Empfohlene erste Pilot-Tabelle:
Begruendung:
Risiko:
Warum nicht TOP-Liste zuerst:
Naechster Auftrag:
```

Die TOP-Liste darf nur dann als erste Pilot-Tabelle empfohlen werden, wenn keine einfachere produktive Tabelle geeignet ist.

---

## 11. Format der Ergebnisdatei

Die Ergebnisdatei `docs/Tabellenlayout_Inventar_V1.md` soll mindestens diese Gliederung haben:

```markdown
# Tabellenlayout - Inventar V1

## 1. Kurzfazit

## 2. Gefundene Tabellen

| Tabelle | Bereich | UI | PDF | Risiko | Empfehlung |
|---|---|---:|---:|---|---|

## 3. Details je Tabelle

### Tabelle: ...

- tableKey:
- Verwendung:
- Varianten:
- sichtbare Spalten:
- aktuelle Breitenquelle:
- aktuelle Schrift-/Paddingquelle:
- zentrale Layoutwerte vorhanden:
- Umbau-Risiko:
- Empfehlung:

## 4. Vorhandene Tabellenlayout-Technik

## 5. Klassifizierung vorhandener Technik

## 6. Empfohlene erste Pilot-Tabelle

## 7. Nicht empfohlene Kandidaten

## 8. Offene Fragen / Risiken

## 9. Naechster Auftrag
```

---

## 12. Abnahmekriterien

Der Auftrag ist nur erfuellt, wenn:

- `docs/Tabellenlayout_Inventar_V1.md` angelegt wurde,
- keine App-Code-Dateien geaendert wurden,
- keine UI-/PDF-/Druckwege geaendert wurden,
- eine konkrete Pilot-Tabelle empfohlen wurde,
- klar ist, welche vorhandene Technik behalten/kapseln/anpassen/stilllegen ist,
- der naechste Auftrag eindeutig formuliert ist.

---

## 13. Abschlussbericht

Codex muss am Ende berichten:

```text
ABSCHLUSSBERICHT

Geaenderte Dateien:
- ...

Umgesetzt:
- ...

Ausdruecklich nicht geaendert:
- App-Code
- UI
- PDF
- Druckweg
- Tabellenrenderer

Pruefung:
- ...

Risiken / offen:
- ...

Naechster sinnvoller Schritt:
- ...
```