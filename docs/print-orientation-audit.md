# Print-Orientation Audit

Status: Bestandsaufnahme, kein Umbau
Stand: 2026-05-08
Bezug:
- `docs/UI-TECH-CONTRACT.md`
- `docs/table-layout-service.md`
- `docs/table-layout-audit-plan.md`
- `docs/table-layout-audit-report.md`
- `docs/table-layout-protokoll-tops.md`

---

## 1. Aktueller Stand

Der vorhandene Druckweg ist aktuell auf A4-Hochformat ausgelegt und behandelt Querformat noch nicht als aktiven Layoutpfad.

Die aktuelle Kette:

1. `src/main/ipc/printIpc.js`
2. `src/main/print/printWindow.js`
3. `src/main/preload/printPreload.js`
4. `src/main/print/printData.js`
5. `src/renderer/print/index.html`
6. `src/renderer/print/printApp.js`
7. `src/renderer/print/layout/PrintShell.js`
8. `src/renderer/print/print.css`
9. `src/renderer/print/v2/v2.css`
10. `src/renderer/print/v2/v2LayoutConfig.js`
11. `src/shared/tableLayouts/protokollTopsLayout.js`

Wichtige Beobachtung:

- `printIpc.js` setzt `landscape: false` und `pageSize: "A4"` fest.
- `print.css` setzt die Hauptseite auf `--page-w: 210mm` und `--page-h: 297mm`.
- `printWindow.js` öffnet ein festes BrowserWindow mit `width: 1100` und `height: 900`, aber ohne Formatumschaltung.
- `printData.js` liefert bisher `printProfile` und `v2Layout`, aber keinen expliziten Orientierungsschalter.
- `printApp.js` und `PrintShell.js` nutzen die vorhandenen Millimeterwerte, aber keine variable Seitenorientierung.
- `v2.css` und `v2LayoutConfig.js` enthalten Header- und Abstandsparameter, aber keine Querformat-Variante.

---

## 2. Fundstellen

### 2.1 A4 / Hochformat ist aktuell festgelegt

- `src/main/ipc/printIpc.js`
  - `buildPrintToPdfOptions()` setzt `landscape: false`
  - `pageSize: "A4"`
- `src/renderer/print/print.css`
  - `@page { size: A4; }`
  - `--page-w: 210mm`
  - `--page-h: 297mm`
- `src/renderer/print/v2/v2LayoutConfig.js`
  - `page.padXmm`, `global.heightMm`, `full.heightMm`, `mini.*`
  - keine Orientierung, nur feste Basiswerte

### 2.2 Wo `orientation` aufgenommen werden müsste

Der sauberste technische Ort ist der Druck-Laufzeitkontext in `src/main/print/printData.js`.

Dort werden bereits zusammengeführt:

- `project`
- `meeting`
- `settings`
- `printProfile`
- `v2Layout`
- `userData`
- `logos`
- `interludeText`
- `nextMeeting`

Ein späterer Orientierungsschalter sollte dort als Teil des Print-Kontexts entstehen, damit Main-Prozess, Renderer und Vorschau denselben Auftrag sehen.

### 2.3 Wo `printToPDF landscape true/false` hingehört

Aktuell gehört das in `src/main/ipc/printIpc.js`, konkret in `buildPrintToPdfOptions()`.

Derzeit wird dort fest `landscape: false` geliefert.

Für eine spätere Umschaltung müsste dieser Wert aus dem Print-Kontext oder aus den Druckoptionen gespeist werden.

### 2.4 Wo die Print-Seite intern zwischen `210x297` und `297x210` wechseln müsste

Das betrifft die Renderer-Seite:

- `src/renderer/print/print.css`
- indirekt `src/renderer/print/printApp.js`
- indirekt `src/renderer/print/layout/PrintShell.js`

Denn dort ist die Seitenlogik aktuell an A4-Hochformat gebunden:

- Seitenbreite / Seitenhöhe
- Padding
- Header-Höhen
- Tabellenbreiten

Ein Querformat-Pfad müsste die Seitenmaße und die daraus abgeleiteten Layoutwerte umstellen.

---

## 3. Bewertung je Bereich

### 3.1 `src/main/ipc/printIpc.js`

Bewertung:

- zentral für `printToPDF`
- aktuell fest auf Hochformat
- geeigneter Ort für die spätere Druckoption `landscape`

Risiko:

- Wenn hier nur `landscape` umgestellt wird, ohne Renderer und Layout anzupassen, wird das Ergebnis inhaltlich oft abgeschnitten oder unbalanced.

### 3.2 `src/main/print/printWindow.js`

Bewertung:

- steuert nur das BrowserWindow der Vorschau
- das Fenster ist aktuell fest in einer normalen Desktopgröße geöffnet
- keine Formatsteuerung vorhanden

Risiko:

- Das Window selbst ist nicht die eigentliche Papierorientierung.
- Eine Änderung hier allein würde die PDF-Logik nicht lösen.

### 3.3 `src/main/preload/printPreload.js`

Bewertung:

- Bridge für `bbmPrint`
- transportiert `onInit`, `getData`, `ready`
- derzeit keine Orientierungsdaten

Risiko:

- Für Querformat müsste hier nur dann etwas passieren, wenn der Renderer einen expliziten Orientierungswert lesen soll.
- Das ist ein Transportpfad, kein Layoutort.

### 3.4 `src/main/print/printData.js`

Bewertung:

- fachlich und technisch sinnvoller Sammelpunkt für den Druckauftrag
- dort werden bereits Profil und Layoutwerte kontextualisiert
- guter Platz für `orientation`, `paperSize` oder eine abgeleitete `pageFormat`

Risiko:

- Wenn Querformat später ohne saubere Datenstruktur hier ergänzt wird, entstehen wieder verstreute Sonderpfade.

### 3.5 `src/renderer/print/index.html`

Bewertung:

- nur Bootstrapping
- keine Formatlogik
- nicht der Ort für Orientation

### 3.6 `src/renderer/print/printApp.js`

Bewertung:

- baut die Druckseiten
- kennt `printProfile`, `v2Layout`, Header, Teilnehmer, TOPs und Tail-Bereiche
- verwendet feste Seitenmaße indirekt über CSS und V2-Variablen

Querformat-Auswirkung:

- Seitenbreite und verfügbare Fläche ändern sich
- `_mmToPx` bleibt technisch gleich, aber die Layoutannahmen ändern sich
- die Pagination müsste mit anderen Breiten und ggf. anderen Höhen neu rechnen

### 3.7 `src/renderer/print/layout/PrintShell.js`

Bewertung:

- baut die V2-Tabellen-DOMs
- benutzt Colgroups, Header und Row-Rendering
- nimmt die V2-Padding- und Kopfwerte aus `v2Layout`

Querformat-Auswirkung:

- GlobalHeader, FullHeader und MiniHeader werden indirekt durch die reduzierte Breite beeinflusst
- die Tabellenbreite und der Textumbruch können sich deutlich verschieben

### 3.8 `src/renderer/print/print.css`

Bewertung:

- hier ist Hochformat faktisch hard-coded
- `@page`, `--page-w`, `--page-h`, Padding und Tabellenbreiten liegen fest

Querformat-Auswirkung:

- dieser File ist einer der wichtigsten Orte für ein späteres Format-Switching
- ohne Fallback-Mechanismus würde Querformat den aktuellen Druckfluss leicht brechen

### 3.9 `src/renderer/print/v2/v2.css`

Bewertung:

- enthält vor allem Header-, Tail- und Teilnehmerlisten-Styling
- keine eigene Querformatlogik
- ist aber von der nutzbaren Seitenbreite abhängig

Querformat-Auswirkung:

- GlobalHeader, FullHeader und MiniHeader sind nicht völlig formatneutral
- besonders kritisch:
  - `v2ProjectName`
  - `v2ProtocolTitle`
  - `v2ListStand`
  - `v2HeaderRight`
  - `v2UserBox`
- diese Elemente reagieren auf weniger Breite mit Umbruch, Höhe und potenzieller Überlappung

### 3.10 `src/renderer/print/v2/v2LayoutConfig.js`

Bewertung:

- zentrale Layoutbasis für Header und Seitenabstände
- aktuell nur eine Basisvariante
- kein Portrait/Landscape-Split

Querformat-Auswirkung:

- für Querformat müsste hier sehr wahrscheinlich eine zweite Layoutvariante oder ein abgeleiteter Satz Werte entstehen
- ohne das würden Header- und Randwerte zu stark auf Hochformat optimiert bleiben

### 3.11 `src/shared/tableLayouts/protokollTopsLayout.js`

Bewertung:

- beschreibt bereits `protokoll_tops` als `portrait`
- damit ist die Pilot-Tabelle fachlich derzeit auf Hochformat festgelegt
- die Tabelle liefert bewusst aktuelle Hochformatwerte

Querformat-Auswirkung:

- für `protokoll_tops` müsste später eine zweite Variante ergänzt werden
- die aktuelle Definition sollte als Hochformat-Referenz bestehen bleiben

---

## 4. Antwort auf die Leitfragen

### 1. Wo wird aktuell A4/Hochformat festgelegt?

Aktuell an mehreren festen Stellen:

- `src/main/ipc/printIpc.js` mit `landscape: false` und `pageSize: "A4"`
- `src/renderer/print/print.css` mit `@page { size: A4; }`
- `src/renderer/print/print.css` mit `--page-w: 210mm` und `--page-h: 297mm`
- `src/shared/tableLayouts/protokollTopsLayout.js` mit `variant: "portrait"`

### 2. Wo müsste `orientation portrait/landscape` in den Druckauftrag aufgenommen werden?

Am besten in `src/main/print/printData.js` als Teil des Print-Kontexts.

Das ist der sauberste Ort, um eine fachlich eindeutige Druckorientierung für Renderer und Main-Prozess vorzuhalten.

### 3. Wo müsste Electron `printToPDF landscape true/false` bekommen?

In `src/main/ipc/printIpc.js`, in `buildPrintToPdfOptions()`.

### 4. Wo müsste die Print-Seite intern zwischen `210x297` und `297x210` wechseln?

In der Renderer-Schicht:

- `src/renderer/print/print.css`
- ergänzend `src/renderer/print/printApp.js`
- ergänzend `src/renderer/print/layout/PrintShell.js`

### 5. Welche Auswirkungen hätte Querformat auf GlobalHeader, FullHeader und MiniHeader?

Vor allem:

- mehr horizontale Luft, aber andere vertikale Kompression
- Header-Bestandteile würden eventuell anders umbrechen
- rechte Kopffläche und Benutzerblock müssen neu balanciert werden
- der aktuelle V2-Kopf ist sichtbar an Hochformat-Annahmen gekoppelt

### 6. Welche Auswirkungen hätte Querformat auf `protokoll_tops`?

Die `protokoll_tops`-Definition müsste eine zweite Variante bekommen.

Aktuell ist sie als `portrait` beschrieben.

Querformat würde betreffen:

- Spaltenbreiten
- Umbruch im Gegenstandsbereich
- Platz für die Meta-Spalte
- potenziell andere Umbruchregeln für Langtext

### 7. Welche Änderungen wären minimal nötig, ohne den bestehenden V2-Druck zu beschädigen?

Minimal und sicher wäre:

- Orientierung erst als Druckauftrag vorbereiten
- `printData.js` um einen Formatwert erweitern
- `printIpc.js` nur den Druckauftrag auslesen, aber noch keinen UI-Schalter bauen
- Renderer zunächst nur auf den neuen Formatwert vorbereiten
- Hochformat bleibt der Default

### 8. Welche Risiken gibt es für Vorschau-Druck, Vorabzug und endgültiges Protokoll?

Risiken:

- Vorschau und finaler PDF-Druck könnten auseinanderlaufen, wenn nur einer der beiden Wege angepasst wird
- Vorabzug nutzt andere Header-/Branding-Zustände als das endgültige Protokoll
- Querformat kann die Höhe von Header, Tail und Tabelleninhalt verschieben und damit Pagination verändern
- bei zu früher UI-Auswahl besteht die Gefahr, dass fachliche Nutzer Querformat aktivieren, bevor die Layoutbasis stabil ist

---

## 5. Empfehlung für den Umsetzungsweg

### Empfohlene Reihenfolge

1. Orientierung zunächst nur als Druckauftrag und Layoutvariante vorbereiten.
2. Renderer und PDF-Pfad intern darauf vorbereiten.
3. Erst danach eine UI-Auswahl erwägen.

### Begründung

- Der aktuelle Druckweg ist eng auf Hochformat getaktet.
- Querformat betrifft nicht nur die PDF-Option, sondern auch die tatsächliche Seitengestaltung.
- Der bestehende V2-Druck soll nicht durch eine frühe UI-Umschaltung destabilisiert werden.

### Entscheidung

Querformat sollte zuerst nur als Druckauftrag vorbereitet werden, nicht direkt als UI-auswählbare Option.

Grund:

- das ist das kleinste risikoarme Paket
- es hält die bestehende V2-Route stabil
- es erlaubt eine spätere saubere Formatumschaltung, sobald die Layout-Varianten und Abstände eindeutig sind

---

## 6. Was ausdrücklich NICHT angefasst werden darf

- keine Header/Footer-Änderung
- kein Seitenkopfeditor
- keine Editor-UI
- keine Datenbank
- keine zweite PDF-Logik
- kein Querformat-Umbau im laufenden Layout
- keine Massenaenderungen
- keine optischen Nebenänderungen
- keine Änderung an `GlobalHeader`, `FullHeader`, `MiniHeader`, außer in einer später ausdrücklich beauftragten Layoutphase
- keine Änderung an der fachlichen `protokoll_tops`-Definition ohne eigenständigen Querformat-Auftrag

---

## 7. Bewertung

Der Ist-Zustand ist klar:

- A4/Hochformat ist überall der Default.
- Querformat ist noch nicht systemisch vorbereitet.
- Die beste spätere Einbauposition ist der Druckauftrag in `printData.js`, begleitet von `printIpc.js` und einem Layout-Fallback in der Renderer-Schicht.

Für den jetzigen Stand ist das richtige Ergebnis nicht „Querformat einbauen“, sondern:

- Querformat technisch vorbereiten
- Hochformat als Default unverändert lassen
- UI-Auswahl erst später
