# Editor 1 - Projektauftrag vor Neubau

Stand: 14.05.2026  
Projekt: BBM-Produktiv / layoutTools / Editor 1  
Status: Vorbereitungsauftrag, noch kein Implementierungsauftrag

---

## 1. Zweck

Dieses Dokument beschreibt den professionellen Projektauftrag fuer den Neubau von Editor 1.

Editor 1 wird nicht als grosses Feature auf einmal gebaut. Editor 1 wird in kleinen, pruefbaren Paketen aufgebaut.

Dieses Dokument ist die Bruecke zwischen:

- `docs/Konzept_und_Vertrag_FINAL.md`
- `docs/Projektsteuerung_Anti_Kleinklein.md`
- spaeteren Codex-Auftraegen

---

## 2. Ziel

Editor 1 soll ein internes DEV-only Hilfsmodul zur manuellen Kalibrierung normaler Tabellen werden.

Editor 1 soll spaeter erlauben:

- registrierte Tabellen auszuwaehlen,
- Varianten getrennt zu bearbeiten,
- UI, PDF Hochformat und PDF Querformat getrennt zu kalibrieren,
- Spaltenbreiten, Innenabstaende, Schriftgroessen, Schriftgewicht und Ausrichtung manuell einzustellen,
- Werte dauerhaft zu speichern,
- echte UI/PDF-Ausgaben die gespeicherten Werte separat lesen zu lassen.

Editor 1 soll nicht automatisch UI und PDF angleichen.

---

## 3. Nicht-Ziele

Nicht Ziel des Neubaus, insbesondere nicht in den ersten Paketen:

- kein kompletter Tabelleneditor in einem Schritt,
- keine sichtbare Editor-UI in Teil 1,
- keine Endbenutzerfunktion,
- keine normale App-Bedienung,
- keine Toolbar oder Marker in echten Tabellen,
- keine echte TOP-Liste aendern,
- keine echte PDF-Ausgabe aendern,
- keinen Druckweg aendern,
- keine automatische DOM-/CSS-/PDF-Erkennung,
- keine automatische Layoutoptimierung,
- keine automatische UI/PDF-Gleichmachung,
- keine Sonderlogik pro Tabelle ohne Tabellenvertrag.

---

## 4. Verbindliche Grundlagen

Vor jedem Auftrag zu Editor 1 sind zu lesen:

1. `AGENTS.md`
2. `ZUERST_LESEN_Codex.md`
3. `ARCHITECTURE.md`
4. `docs/MODULARISIERUNGSPLAN.md`
5. `docs/Konzept_und_Vertrag_FINAL.md`
6. `docs/Projektsteuerung_Anti_Kleinklein.md`
7. `docs/Codex_Startblock_Template.md`

Wenn eine Datei fehlt oder widerspruechlich ist, wird gestoppt.

---

## 5. Reihenfolge vor dem Neubau

Vor dem ersten Codepaket muessen diese Schritte abgeschlossen sein:

1. Steuerungsdokumente pruefen und lesbar halten.
2. Diese Projektauftragsdatei im Repo fuehren.
3. Eine technische Bestandsaufnahme der vorhandenen `layoutTools`-/`tableLayouts`-Struktur erstellen.
4. Entscheiden, welche vorhandenen Unterbau-Teile wiederverwendet, gekapselt, stillgelegt oder ignoriert werden.
5. Erst danach Teil 1A als kleines Fundament-Paket starten.

---

## 6. Technische Bestandsaufnahme

Die naechste Arbeit vor Implementierung ist eine reine Bestandsaufnahme.

Sie darf keine App-Code-Aenderung erzeugen.

Zu klaeren:

- Welche `layoutTools`-Dateien existieren noch?
- Welche `tableLayouts`-Dateien existieren noch?
- Welche IPC-Endpunkte existieren noch?
- Welche DB-/Repository-Strukturen existieren noch?
- Welche Tests existieren noch?
- Welche Teile sind produktiv aktiv?
- Welche Teile sind nur technischer Unterbau?
- Welche Teile sind Altlast des verworfenen Editors?
- Welche Teile koennen fuer Editor 1 verwendet werden?
- Welche Teile duerfen nicht angeruehrt werden?

Ergebnis der Bestandsaufnahme:

- `docs/Editor_1_Bestandsaufnahme.md`

---

## 7. Entscheidung nach Bestandsaufnahme

Nach der Bestandsaufnahme muss eine klare Entscheidung getroffen werden.

Moegliche Klassifizierung je vorhandener Struktur:

- behalten,
- kapseln,
- anpassen,
- stilllegen,
- spaeter entfernen,
- nicht fuer Editor 1 verwenden.

Ohne diese Entscheidung darf kein Fundament gebaut werden.

---

## 8. Teil 1A - erstes moegliches Codepaket

Erst nach der Bestandsaufnahme darf Teil 1A vorbereitet werden.

Paketname:

```text
Editor 1 - Teil 1A Fundament: Tabellenvertrag und Variantenmodell ohne UI
```

Ziel:

- Tabellenvertrag definieren,
- Variantenmodell definieren,
- Layoutwert-Schema definieren,
- Plausibilitaetsfunktionen definieren,
- Tests ergaenzen.

Nicht-Ziel:

- keine Editor-UI,
- keine echte Tabelle,
- keine TOP-Liste,
- keine PDF-Ausgabe,
- kein Druckweg,
- keine SettingsView,
- kein PrintModal,
- kein TopsScreen,
- keine echte App-Navigation.

---

## 9. Erlaubte Bereiche fuer Teil 1A

Die erlaubten Bereiche werden nach der Bestandsaufnahme final festgelegt.

Voraussichtlich erlaubt:

```text
src/renderer/modules/layoutTools/editor1/
scripts/tests/
docs/
```

Alternativ kann die Bestandsaufnahme einen saubereren gemeinsamen Ort vorschlagen, z. B. fuer shared Contracts.

---

## 10. Verbotene Bereiche fuer Teil 1A

Bis auf ausdrueckliche spaetere Freigabe verboten:

```text
src/renderer/modules/protokoll/
src/renderer/modules/ausgabe/
src/renderer/print/
src/main/ipc/printIpc.js
src/renderer/views/SettingsView.js
src/renderer/views/ProjectFirmsView.js
```

Ebenfalls verboten:

- echte Druckwege,
- echte PDF-Vorschau,
- echte TOP-Liste,
- echte Teilnehmerliste,
- echte ToDo-Liste.

---

## 11. Abnahmekriterien fuer Teil 1A

Teil 1A ist nur abgenommen, wenn:

- ein klarer Tabellenvertrag existiert,
- ein Variantenmodell fuer `ui`, `pdfPortrait`, `pdfLandscape` existiert,
- Layoutwerte eindeutig ueber `tableKey + variantKey + columnKey + optional cellTypeKey` adressiert werden,
- Plausibilitaetsregeln getestet sind,
- keine echte UI/PDF-Ausgabe geaendert wurde,
- `npm test` gruen ist,
- der Abschlussbericht die nicht geaenderten Bereiche ausdruecklich nennt.

---

## 12. Arbeitsprinzip

Editor 1 wird professionell gebaut:

```text
Bestandsaufnahme
Entscheidung
Fundament
Dummy-Beweis
isolierte DEV-only UI
erste einfache echte Tabelle
TOP/PDF erst spaeter
```

Nicht professionell waere:

```text
Editor komplett bauen
sichtbare UI sofort zeigen
TOP und PDF direkt anschliessen
spaeter reparieren
```

Das ist verboten.
