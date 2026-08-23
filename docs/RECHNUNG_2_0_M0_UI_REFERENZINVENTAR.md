# BBM | Rechnung 2.0 – M0 UI-Referenzinventar

Stand: 23.08.2026  
Status: **Bestandsaufnahme / keine Implementierungsfreigabe**

## 1. Zweck

Dieses Dokument erfasst vorhandene produktive, DEV-only und historische UI-/Testflächen, die für Rechnung 2.0 als Design- oder Architekturreferenz geeignet sind.

Es ändert keine produktive UI und erteilt keinen Auftrag zur Reaktivierung alter Editor-Runtimes.

Für die weitere Entwicklung gelten weiterhin verbindlich:

- `docs/RECHNUNG_2_0_ENTWICKLUNGSPLAN.md`
- `docs/RECHNUNG_2_0_UI_ARCHITEKTUR_UND_UI_LABOR.md`

## 2. Grundsatz für die Bewertung

Eine vorhandene Oberfläche kann als Referenz geeignet sein, auch wenn ihr alter technischer Unterbau nicht weiterverwendet werden darf.

Zu unterscheiden sind:

1. **Produktive UI-Referenz** – bestehende reale BBM-Oberfläche.
2. **DEV-Designreferenz** – dauerhaft nutzbare statische Oberfläche ohne Fachlogik.
3. **Editor-/Testreferenz** – bewusst neutrale Testfläche zur Prüfung von Registrierung und Layoutfreiheit.
4. **Historische Architektur-/Bedienreferenz** – Ideen können übernommen werden, alte Runtime darf nicht reaktiviert werden.
5. **Reiner Test-Harness** – für automatisierte Prüfung nützlich, aber nicht als eigenständige Designoberfläche.

---

# 3. Besonders geeignete Referenzen

## 3.1 Rechnung – vorhandene DEV-Designreferenz

### Dateien

- `src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js`
- `src/renderer/modules/rechnungen/demoData.js`
- `src/renderer/modules/rechnungen/styles/rechnungenDesign.css`

### Bewertung

**Sehr wichtig / erhalten.**

Die bestehende Rechnungsoberfläche ist bereits eine weit entwickelte statische Designreferenz mit:

- Rechnungsübersicht,
- Suche und Filter,
- Kennzahlenkarten,
- Rechnung-bearbeiten-Dialog,
- Rechnungsdaten,
- Positionen,
- Summenbereich,
- vorhandener BBM-Formular-/Popup-Designsprache.

Sie verwendet bewusst statische Beispieldaten und besitzt keine produktive Rechnungslogik.

### Einschränkung

Die heutige Positionsdarstellung im Design-Dummy ist noch tabellarisch. Für Rechnung 2.0 gilt dagegen verbindlich die LV-artige Positionsdarstellung des Entwicklungsplans.

### Konsequenz

Die Oberfläche wird **nicht neu erfunden**, sondern als Ausgangsbasis betrachtet. Die Positionsfläche wird fachlich an die festgelegte LV-Struktur angepasst, sobald der entsprechende Meilenstein dies erlaubt.

---

## 3.2 M64 – UI-Editor-Testfläche

### Dateien

- `src/renderer/ui-editor/BbmUiEditorStatusPanel.js`
- `src/renderer/ui-editor/bbmUiEditorStatusPanel.css.js`
- `scripts/tests/m64UiEditorTestSurface.test.cjs`

### Historischer Bezug

- Commit `f4de13bd` – `M64 UI-Editor-Testfläche erweitern`
- Merge-Commit `8cd8069f`

### Inhalt

Die M64-Testfläche enthält explizit registrierte neutrale UI-Elemente:

- Testflächen-Root,
- Testkarte,
- Überschrift,
- Beispieltext,
- Beispielbutton,
- Eingabefeld-Hülle,
- Auswahlfeld-Hülle,
- Beispieltabelle.

Die Elemente besitzen explizite IDs/Refs und sind für Move/Resize vorgesehen, ohne Fachaktionen, IPC-, DB- oder Autosave-Folgen auszulösen.

### Bewertung

**Sehr wichtig / vorrangiger Kandidat für das spätere UI-Labor.**

Diese Testfläche entspricht besonders gut dem Ziel von Rechnung 2.0:

- sichtbare UI und Fachlogik sind getrennt,
- Elemente sind explizit registriert,
- einzelne Elemente bleiben editorfähig,
- die Testfläche ist neutral,
- sie kann Designideen zeigen, ohne Produktivdaten zu verändern.

Die Gestaltung mit Karten, klaren Flächen, gut lesbaren Abständen und einer ruhigen Hierarchie ist als Designreferenz ausdrücklich erhaltenswert, auch wenn die auffällige orange Testkennzeichnung nicht als Produktivdesign zu übernehmen ist.

### Vermutung zur Nutzerbeobachtung

Diese M64-Testfläche ist ein sehr wahrscheinlicher Kandidat für die bei automatisierten Codex-/Editor-Prüfungen nur kurz sichtbare Testoberfläche, die als gestalterisch gelungen aufgefallen ist.

---

## 3.3 Protokoll – produktive UI und Editorregistrierung

### Relevante Dateien

- `src/renderer/modules/protokoll/screens/TopsScreen.js`
- `src/renderer/modules/protokoll/TopsList.js`
- `src/renderer/modules/protokoll/TopsWorkbench.js`
- `src/renderer/modules/protokoll/TopsList.uiEditorContract.js`
- `src/renderer/modules/protokoll/TopsWorkbench.uiEditorContract.js`
- `src/renderer/modules/protokoll/screens/TopsScreen.uiEditorContract.js`
- `src/renderer/modules/protokoll/editor/registries/protokollTopsUiRegistry.js`
- `src/renderer/modules/protokoll/uiEditor/protokollUiElements.js`

### Bewertung

**Produktive Leit- und Architekturreferenz.**

Für Rechnung 2.0 besonders wertvoll sind:

- reale Arbeitsmodus-Struktur,
- Trennung größerer UI-Bereiche,
- explizite Editorverträge,
- registrierte Elemente,
- vorhandene Host-/Registry-Anbindung.

Die Fachlogik des Protokolls darf nicht in Rechnung übernommen werden; das Registrierungs- und Strukturprinzip ist dagegen ein wichtiges Vorbild.

---

## 3.4 Restarbeiten – produktive UI und besonders weitgehende Editorverträge

### Relevante Dateien

- `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
- `src/renderer/modules/restarbeiten/RestarbeitenEditbox.js`
- `src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js`
- `src/renderer/modules/restarbeiten/RestarbeitenList.js`
- `src/renderer/modules/restarbeiten/RestarbeitenQuicklane.js`
- zugehörige `*.uiEditorContract.js`
- `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
- `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`

### Bewertung

**Produktive Leit- und Editorarchitektur-Referenz.**

Restarbeiten ist besonders wichtig, weil mehrere eigenständige UI-Komponenten bereits jeweils eigene Editorverträge besitzen.

Für Rechnung 2.0 ist daraus der Grundsatz abzuleiten:

> Nicht erst nach Fertigstellung eine monolithische Oberfläche für den Editor erschließen, sondern fachlich eigenständige sichtbare Komponenten von Beginn an registrierbar und adressierbar bauen.

---

# 4. Ergänzende / historische Referenzen

## 4.1 EditorLab V2

### Dateien

- `src/renderer/uiV2/editorLab/EditorLabScreen.js`
- `src/renderer/uiV2/editorLab/editorLabRegistry.js`
- `src/renderer/uiV2/editorV2/*`

### Bewertung

**Bedien-/Konzeptreferenz, keine Runtime-Reaktivierung.**

Das EditorLab besitzt eine explizite Elementstruktur mit Header, Hauptbereich, Quicklane und Footer sowie registrierten Unterelementen.

Der alte Editor-V2-Core darf nicht parallel zum heutigen UI-Editor-kit reaktiviert werden. Wertvoll bleiben jedoch:

- explizite Hierarchie,
- elementweise Registrierung,
- isolierte Laboridee,
- sichtbare Hover-/Auswahlkonzepte.

---

## 4.2 ältere BBM UI-Editor-Demo

### Dateien

- `src/renderer/uiEditor/demo/BbmUiEditorDemoScreen.js`
- `src/renderer/uiEditor/demo/bbmUiEditorDemoElements.js`
- `src/renderer/uiEditor/demo/bbmUiEditorDemoLayout.js`

### Bewertung

**Technische Referenz, geringe Designpriorität.**

Die Demo zeigt eine isolierte verschiebbare Karte ohne Zugriff auf produktive BBM-UI. Sie ist für das Prinzip sicherer isolierter Testziele nützlich, gestalterisch aber weniger relevant als M64.

---

## 4.3 Drucklayout-Kalibrierung

### Dateien

- `src/renderer/modules/drucklayout/DrucklayoutScreen.js`
- `src/renderer/modules/drucklayout/DrucklayoutRenderer.js`
- `src/renderer/modules/drucklayout/DrucklayoutSampleData.js`

### Bewertung

**Werkzeug-/Preview-Referenz.**

Die Oberfläche zeigt bereits das Prinzip:

- statische Beispieldaten,
- sofort sichtbare Vorschau,
- Werte ändern,
- Vorschau erneut rendern,
- Standardwerte zurücksetzen.

Das ist kein direktes Rechnungslayout, aber ein gutes Vorbild für ein späteres Referenz-/Vergleichswerkzeug.

---

# 5. Reine Test-Harnesses

## M86.16 und M86.24

### Dateien

- `scripts/tests/m86-16RealEditorRuntimeHarness.mjs`
- `scripts/tests/m86-24VisibleEditorAcceptanceHarness.mjs`
- zugehörige HTML-/Runner-/Testdateien

### Bewertung

**Nicht als eigene Designvariante archivieren.**

Diese Harnesses mounten reale Protokoll- und Restarbeiten-Oberflächen mit statischen Testdaten und öffnen den Editor für automatisierte Sicht-/Runtimeprüfungen.

Sie erklären, warum während Tests echte Oberflächen nur kurz sichtbar werden können.

Nützlich sind sie als technische Abnahmewerkzeuge. Als Designreferenz sollen stattdessen die zugrunde liegenden produktiven Screens sowie die M64-Testfläche verwendet werden.

---

# 6. Zielbild für das spätere DEV-only UI-Labor

Das UI-Labor soll keine neue Editor-Runtime werden.

Es soll lediglich dauerhaft zugängliche Referenzansichten unter dem vorhandenen BBM-/UI-Editor-System bereitstellen.

Erste sinnvolle Referenzgruppen:

```text
UI-Labor
├── Rechnung
│   ├── Rechnung – aktueller DEV-Designstand
│   ├── Rechnung – spätere LV-Positionsvariante
│   └── weitere bewusst freigegebene Varianten
│
├── BBM-Arbeitsmodi
│   ├── Protokoll – produktive Referenz
│   └── Restarbeiten – produktive Referenz
│
└── Editor-Testflächen
    ├── M64 – UI-Editor-Testfläche
    └── ggf. bewusst erhaltene künftige Testvarianten
```

## Nicht aufnehmen

- automatische Test-Harnesses als eigenständige Nutzeransicht,
- alte konkurrierende Editor-Runtimes,
- historische Screens ohne konkreten Vergleichsnutzen,
- technische Testflächen ohne sichtbaren Design- oder Editorwert.

---

# 7. Verbindliche Konsequenz für Rechnung 2.0

Bei jeder späteren UI-Erweiterung von Rechnung 2.0 ist vor Abnahme zusätzlich zu prüfen:

1. Sind fachlich eigenständige sichtbare Elemente sinnvoll getrennt?
2. Sind die für Feintuning vorgesehenen Elemente explizit registriert?
3. Existieren stabile IDs/Refs statt nachträglicher DOM-Suche?
4. Sind Layoutänderungen von Fachaktionen und Datenänderungen getrennt?
5. Entstehen unnötige feste Kopplungen zwischen Elementen?
6. Kann die Oberfläche mit statischen Beispieldaten als Referenz dargestellt werden?
7. Wenn eine neue Test-/Dummy-UI gestalterisch wertvoll ist: wurde sie als Referenz erhalten oder dokumentiert?

---

# 8. Ergebnis der Bestandsaufnahme

Für die weitere Entwicklung müssen **keine neuen UI-Ideen aus dem Nichts erzeugt werden**.

Es existieren bereits vier starke Quellen:

1. Rechnung – vorhandener DEV-Designstand,
2. Protokoll – produktive Arbeitsmodus- und Registrierungsreferenz,
3. Restarbeiten – produktive Komponenten-/Editorvertragsreferenz,
4. M64 – neutrale, vollständig registrierte Editor-Testfläche.

Damit kann Rechnung 2.0 auf vorhandenen BBM-Entscheidungen aufbauen und UI-Neuentwicklung auf die fachlich notwendigen Unterschiede begrenzen.