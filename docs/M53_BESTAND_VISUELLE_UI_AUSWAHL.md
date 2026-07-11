# M53 – Bestand visuelle UI-Auswahl vor neuer Umsetzung

## 1. Zusammenfassung

M53 ist eine reine Bestandsaufnahme und kein Implementierungsversuch. Die Git-Historie zeigt drei relevante Entwicklungsstränge für sichtbare UI-Auswahl und Markierung:

1. **UI-Inspector M10 bis M13.6a** unter `src/renderer/uiInspector/`  
   Enthielt Overlay-Rahmen, Trefferliste am Klickpunkt, Auswahlhaltung, Panel, temporäre Vorschau, Reset beim Deaktivieren und Eltern-/Kind-Navigation. Dieser Strang arbeitete historisch über DOM-Marker wie `data-ui-inspector-id` und später über Scan-/Marker-Status. Er ist fachlich beendet und darf nicht direkt reaktiviert werden.
2. **Editor V2 / EditorLab V2** unter `src/renderer/uiV2/editorV2/`  
   Enthielt explizite Registry-Konzepte mit `id`, `label`, `kind`, `editable`, `ops`, `selector` oder `elementRef`, `parentId`, Hierarchietiefe und Zyklusprüfung. Zusätzlich gab es Hover- und Klickauswahl im isolierten EditorLab. Dieser Strang ist näher an der gewünschten expliziten Referenzbindung, enthält aber ebenfalls Selector-Fallbacks und eine eigene Core-/Registry-Logik.
3. **Installierte UI-Editor-Artefakte / Target Selection Runtime** unter `uiEditor/` und `src/renderer/uiEditor/`  
   Enthielt sichtbare Zielauswahl über `data-ui-editor-id`, Klickauswahl, später Hover, Statusattribute und direkte Inline-Markierung. Dieser Strang wurde vor M51/M52 installiert, ist aber nicht der neue generische Kit-Core.

Seit **M51/M52** ist die gültige Zielarchitektur anders: `ui-editor-kit` v0.2.0 ist die alleinige generische Core-Basis, BBM liefert Manifest, explizite Registry und HostAdapter. Deshalb lautet die Empfehlung: **nicht reaktivieren**, **teilweise übernehmen**, **fehlende Auswahl-/Overlay-Anbindung neu als dünne BBM-Host-/Adapter-Schicht bauen**.

## 2. Suchumfang und Methode

Untersucht wurden der aktuelle Arbeitsstand, die erreichbare Git-Historie und die Merge-Historie dieses lokalen Repositories. Es sind lokal nur der Branch `work` und dessen erreichbare Historie vorhanden; zusätzliche Remote-Branches sind in dieser Checkout-Umgebung nicht gelistet.

Ausgeführte Suchrichtungen:

- `git log --all --grep` für UI-Inspector, UI-Editor, Editor V2, Overlay, Hover und Auswahl.
- `git log --all -- <pfade>` für historische Pfade:
  - `src/renderer/uiInspector/`
  - `src/shared/uiInspector/`
  - `src/renderer/uiV2/editorV2/`
  - `src/renderer/editorRuntime/inspector/`
  - `src/renderer/uiEditor/`
  - `uiEditor/targetSelection.js`
  - `src/renderer/app/CoreShell.js`
- `git show <commit>:<pfad>` für relevante historische Dateien.
- `rg` im aktuellen Stand für Suchbegriffe wie `editorV2`, `uiInspector`, `overlay`, `hover`, `selection`, `selectedElement`, `elementRef`, `selector`, `data-ui-`, `marker`, `Auswahlmodus`, `Bearbeitungsmodus`.

## 3. Historische Entwicklung

### 3.1 UI-Inspector-Grundlage M6 bis M10

- **Commit:** `6885490`  
  **Datum:** 2026-05-22  
  **Branch/PR:** Merge-Umfeld PR #147/#148 laut Historie, genauer Ursprungsbranch lokal nicht mehr vorhanden.  
  **Pfade:** `src/shared/uiInspector/`, `scripts/tests/uiInspectorRegistry.test.cjs`, `scripts/tests/uiInspectorMapSchema.test.cjs`  
  **Zweck:** Modulgerüst, Core-/Registry-Testbasis und Layout-Landkartenformat.  
  **Funktionsumfang:** Struktur, Registry-/Schema-Prüfung; noch keine sichtbare Auswahl.  
  **Abhängigkeiten:** Shared-Registry-/Map-Schema.  
  **Zustand:** teilweise vorhanden; historischer Kontext, durch M51/M52 als Zielrichtung ersetzt.

- **Commit:** `a6545cb`  
  **Datum:** 2026-05-22  
  **Branch/PR:** PR #150 `codex/implement-ui-inspector-overlay-display` laut Merge-Historie.  
  **Dateipfad:** `src/renderer/uiInspector/UiInspectorOverlay.js`  
  **Zweck:** Sichtbares Overlay für Restarbeiten-Marker.  
  **Damals vorhanden:** Overlay-Root, Rahmen pro `data-ui-inspector-id`, Label, `querySelectorAll('[data-ui-inspector-id]')`, `getBoundingClientRect()`, `pointerEvents: none`.  
  **Abhängigkeiten:** DOM-Marker, Root-Element mit `querySelectorAll`, direkte DOM-Messung.  
  **Warum stillgelegt/ersetzt:** Historischer Pfad basierte auf Scan-/DOM-Marker-Auswertung und wurde später fachlich beendet; neue M51/M52-Architektur verbietet automatische DOM-Suche und parallele Legacy-Runtime.  
  **Zustand:** Datei ist in `main/work` noch vorhanden, aber als Legacy-/Historienpfad einzuordnen.

### 3.2 UI-Inspector-Auswahl M11/M12

- **Commit:** `2471aa6`  
  **Datum:** 2026-05-22  
  **Branch/PR:** PR #153 `codex/add-hit-list-selection-to-ui-inspector` laut Merge-Historie.  
  **Dateipfade:** `src/renderer/uiInspector/UiInspectorOverlay.js`, `src/renderer/uiInspector/UiInspectorRuntime.js`, `scripts/tests/uiInspectorOverlay.test.cjs`  
  **Zweck:** Auswahl per Trefferliste am Klickpunkt.  
  **Damals vorhanden:** Klick-Capture auf `pointerdown`, Trefferberechnung über `querySelectorAll`, Sortierung nach Fläche/Tiefe/DOM-Reihenfolge, Trefferliste, `selectedId`, ausgewählter Rahmen, Auswahl-Badge, `clearSelection()`, `getSelectedId()`, `getHitsAtPoint()`.  
  **Abhängigkeiten:** globale Capture-Listener am Dokument, DOM-Marker, direkte Rechteckmessung.  
  **Warum stillgelegt/ersetzt:** Der Pfad konnte echte UI stören, weil global abgefangene Pointer-Events und Overlay-/Panel-Interaktion in aktive App-Laufwege eingreifen konnten. Außerdem verstößt die Trefferermittlung über DOM-Scan gegen M51/M52.  
  **Zustand:** teilweise noch vorhanden, aber nicht Zielarchitektur.

- **Commit:** `c00617a` / `9ffd6fb` / `457f587` / `ca77d5f`  
  **Datum:** 2026-05-22  
  **Branch/PR:** Fix-Commits im Umfeld PR #153/#154.  
  **Dateipfade:** `src/renderer/uiInspector/UiInspectorOverlay.js`, `src/renderer/uiInspector/UiInspectorPanel.js`, Tests.  
  **Zweck:** Absicherung gegen störende Panel-Klicks, Hit-List-Lifecycle und Overlay-Refresh-Probleme.  
  **Damals vorhanden:** Guards für Panel-Klicks, Hit-List-Pointerdown-Capture, Lifecycle-Fixes.  
  **Abhängigkeiten:** weiterhin globale Event-Capture-/Overlay-Mechanik.  
  **Warum stillgelegt/ersetzt:** Die Fixes zeigen bereits das Risiko der alten Runtime: Overlay/Panel konnte die App-Bedienung beeinflussen.  
  **Zustand:** nur als historische Test- und Warnbasis verwendbar.

- **Commit:** `5ccfe8e`  
  **Datum:** 2026-05-22  
  **Branch/PR:** PR #154 `codex/add-ui-inspector-panel-for-allowed-controls` laut Merge-Historie.  
  **Dateipfad:** `src/renderer/uiInspector/UiInspectorPanel.js`  
  **Zweck:** Read-only Inspector-Panel für erlaubte Stellschrauben.  
  **Damals vorhanden:** Panel unten rechts, ausgewählter Bereich, Liste erlaubter Controls, Hinweis „Nur Anzeige“.  
  **Abhängigkeiten:** ausgewählte ID und aus Landkarte/Registry abgeleitete Controls.  
  **Warum stillgelegt/ersetzt:** Panel ist Teil des alten UI-Inspector-Pfads und nicht mit dem neuen Kit-Core verdrahtet.  
  **Zustand:** teilweise vorhanden; UI-Texte und Bedienidee wiederverwendbar, Code nicht direkt.

### 3.3 UI-Inspector M13 – Vorschau, Reset, Eltern-/Kind-Bedienung

- **Commit:** `3accb9c`  
  **Datum:** 2026-05-24  
  **Dateipfad:** `src/renderer/uiInspector/UiInspectorRuntime.js`  
  **Zweck:** gerichtete temporäre Vorschau.  
  **Damals vorhanden:** temporäre Layoutwerte für Breite, Höhe, Außen-/Innenabstände, `transform: translate(...)`, Sichtbarkeit und Schriftgröße; Originalwerte wurden gemerkt.  
  **Abhängigkeiten:** direkte Inline-Style-Lese-/Schreibzugriffe auf DOM-Elemente.  
  **Warum stillgelegt/ersetzt:** Direkte Layoutmutation an Live-DOM war genau der gefährliche Teil; neue Architektur darf Änderungen nur über explizite, neutrale Kit-/HostAdapter-Pfade und nicht als Legacy-Runtime durchführen.  
  **Zustand:** nur als Testfall-/Bedienablauf-Referenz wiederverwendbar.

- **Commit:** `fb5a962`  
  **Datum:** 2026-05-24  
  **Dateipfade:** `src/renderer/uiInspector/UiInspectorRuntime.js`, `src/renderer/uiInspector/UiInspectorPanel.js`, Tests.  
  **Zweck:** Rahmen-zuerst-Bedienung und Navigation zwischen Elternbereich, Kindbereichen und Feldern.  
  **Damals vorhanden:** Normalisierung von IDs mit `::`, Basis-ID/Instanz-ID, Gruppen-/Feldsteuerung, Panelnavigation.  
  **Abhängigkeiten:** vorhandene DOM-Marker und Marker-ID-Konventionen.  
  **Warum stillgelegt/ersetzt:** Die Grundidee ist fachlich wertvoll, aber die Ableitung aus DOM-Markern und sichtbarer UI-Struktur darf in M51/M52 nicht automatisch erfolgen.  
  **Zustand:** Bedienmodell/Tests teilweise wiederverwendbar; Runtime-Code nicht direkt.

### 3.4 Editor V2 / EditorLab V2

- **Commit:** `4e17671`  
  **Datum:** 2026-05-28  
  **Dateipfade:** `src/renderer/uiV2/editorV2/editorV2Core.js`, `src/renderer/uiV2/editorV2/editorV2Overlay.js`, `scripts/tests/editorV2Hover.test.cjs`  
  **Zweck:** Hover im isolierten EditorLab.  
  **Damals vorhanden:** `handlePointerMove`, Zielauflösung über Registry, Hover-Frame, `data-ui-editor-v2-hover-id`, Overlay-Root.  
  **Abhängigkeiten:** EditorLab-Root, EditorV2-Registry, DOM-Events.  
  **Warum stillgelegt/ersetzt:** Editor V2 war ein Neustart-/Laborpfad, nicht der finale UI-Editor-kit-Core.  
  **Zustand:** nur in Historie/teilweise aktuellen Tests; durch M51/M52 ersetzt.

- **Commit:** `433ad07`  
  **Datum:** 2026-05-28  
  **Dateipfade:** `src/renderer/uiV2/editorV2/editorV2Core.js`, `src/renderer/uiV2/editorV2/editorV2Overlay.js`, `scripts/tests/editorV2Selection.test.cjs`  
  **Zweck:** Klickauswahl im EditorLab.  
  **Damals vorhanden:** `handlePointerSelect`, Selected-Frame, Auswahl halten, separate Hover-/Selected-Rahmen.  
  **Abhängigkeiten:** lokale EditorLab-Events, Registry-Zielauflösung.  
  **Warum stillgelegt/ersetzt:** Eigene Legacy-Editor-Core-/Overlay-Logik neben UI-Editor-kit wäre heute eine parallele Runtime.  
  **Zustand:** teilweise im aktuellen Baum vorhanden, aber nicht für Produktivreaktivierung geeignet.

- **Commit:** `0ac3a19`  
  **Datum:** 2026-05-28  
  **Dateipfad:** `src/renderer/uiV2/editorV2/editorV2Registry.js`  
  **Zweck:** Registry-Schnittstelle stabilisieren.  
  **Damals vorhanden:** `id`, `label`, `kind`, `editable`, `ops`, `selector`, `elementRef`, `parentId`, erlaubte Kinds/Ops, Parent-/Child-Funktionen, Elementauflösung, Hierarchietiefe, Zyklusprüfung.  
  **Abhängigkeiten:** optional `selector` und optional `elementRef`.  
  **Warum stillgelegt/ersetzt:** Fachlich nahe am neuen Ziel, aber es ist eine zweite Registry-/Core-Logik. M51/M52 verlangt BBM-Registry plus UI-Editor-kit als einzigen generischen Core.  
  **Zustand:** historisch besonders wertvoll für Konzepte und Tests; nicht als Runtime übernehmen.

- **Commit:** `0703b83`  
  **Datum:** 2026-05-29  
  **Dateipfade:** `src/renderer/uiV2/editorV2/editorV2Core.js`, `src/renderer/uiV2/editorV2/editorV2Overlay.js`, `scripts/tests/editorV2Preview.test.cjs`  
  **Zweck:** Rahmen bei Reset und Scroll synchronisieren.  
  **Damals vorhanden:** Overlay-Resync nach Reset/Scroll.  
  **Abhängigkeiten:** DOM-Rect-Messung, Window-/Scroll-Lifecycle.  
  **Warum stillgelegt/ersetzt:** Lifecycle-Idee nützlich, direkte alte Overlay-Runtime nicht.  
  **Zustand:** Testidee wiederverwendbar.

### 3.5 Installierte UI-Editor-Artefakte / Target Selection Runtime

- **Commit:** `1a0a27b`  
  **Datum:** 2026-06-07  
  **Branch/PR:** lokaler Commit `feat(ui-editor): enable target selection runtime`.  
  **Dateipfade:** `uiEditor/targetSelection.js`, `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`, `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`  
  **Zweck:** Zielauswahl-Runtime für installierten UI-Editor-Artefaktpfad.  
  **Damals vorhanden:** Zielattribut `data-ui-editor-id`, Registry-Index, `closest(...)`, Klickauswahl, Inline-Outline/Box-Shadow, Auswahlzustand, `uiState.selectElement`, `clearSelection`, Install/Uninstall.  
  **Abhängigkeiten:** globale/Root-Click-Listener, DOM-Attribute, alte installierte Artefakte.  
  **Warum stillgelegt/ersetzt:** M51/M52 bindet nicht diese Artefakt-Runtime als Core ein, sondern das externe `ui-editor-kit` v0.2.0 mit BBM-Manifest/HostAdapter.  
  **Zustand:** aktuell noch im Baum vorhanden, aber nicht neue Architektur.

- **Commit:** `0fbf604`  
  **Datum:** 2026-06-07  
  **Branch/PR:** `feat(ui-editor): improve target selection runtime`.  
  **Dateipfad:** `uiEditor/targetSelection.js`  
  **Zweck:** Target Selection Runtime um Hover und Statusattribute erweitern.  
  **Damals/aktuell vorhanden:** `data-ui-editor-hovered`, Hover-Zustand, Hover-Marker, ggf. Auswahl-/Hover-Trennung.  
  **Abhängigkeiten:** Root-Events, DOM-Attribute, Inline-Markierung.  
  **Warum stillgelegt/ersetzt:** Sichtbare Auswahl darf nicht über alte Artefakt-Runtime und nicht über generische DOM-Attribute am Bestand wiederbelebt werden.  
  **Zustand:** aktuell vorhanden, aber Legacy-Artefakt.

### 3.6 M51/M52 – neue gültige Architektur

- **Commit:** `fea3ac7`  
  **Datum:** 2026-07-10  
  **Branch/PR:** PR #190 `codex/integrate-bbm-with-ui-editor-kit-v0.2.0`.  
  **Dateipfade:** `src/ui-editor/bbm-ui-editor-manifest.cjs`, `src/ui-editor/bbm-ui-element-registry.cjs`, `src/ui-editor/bbm-host-adapter.cjs`, `src/ui-editor/start-bbm-ui-editor-runtime.cjs`, `scripts/tests/m51UiEditorKitIntegration.test.cjs`  
  **Zweck:** BBM mit UI-Editor-kit v0.2.0 verbinden.  
  **Funktionsumfang:** Manifest, explizite Registry, HostAdapter, keine Auto-Discovery, Testabdeckung.  
  **Zustand:** aktuell gültige Architektur.

- **Commit:** `785efb3` bis `e39840f`, Merge `a961a75`  
  **Datum:** 2026-07-11  
  **Branch/PR:** PR #191 `codex/ui-editor-sichtbaren-startpunkt-integrieren`.  
  **Dateipfade:** `src/renderer/ui-editor/BbmUiEditorStatusPanel.js`, `src/main/ipc/uiEditorIpc.js`, `src/main/preload.js`, `src/renderer/app/Router.js`, `src/renderer/app/CoreShell.js`, Tests.  
  **Zweck:** Sichtbares UI-Editor-Statuspanel, sichere IPC-/Preload-Kette, Runtime-Panel-Übergabe.  
  **Funktionsumfang:** sichtbarer Status und kontrollierte Anbindung, aber keine neue Hover-/Klickauswahl.  
  **Zustand:** aktuell gültig; PR #192 zum Ausblenden von Seitenkopf/Aktionsbereich wurde laut Auftrag geschlossen und wird nicht übernommen.

## 4. Funktionsmatrix

| Funktion | Früher vorhanden | Aktuell vorhanden | Wiederverwendbar | Bewertung |
|---|---:|---:|---:|---|
| Element bei Mouseover erkennen | Ja, Editor V2 `4e17671`; später TargetSelection `0fbf604` | Teilweise im Legacy-Artefakt `uiEditor/targetSelection.js`, nicht in M51/M52-Kit-Anbindung sichtbar | Teilweise | Event-Lifecycle und Tests nutzbar; Zielauflösung muss über explizite Registry/Referenzen erfolgen. |
| Element sichtbar umranden | Ja, UI-Inspector `a6545cb`, Editor V2 `4e17671`, TargetSelection `1a0a27b` | Legacy-Artefakt vorhanden; Statuspanel vorhanden, aber keine aktive Auswahlrahmung für M51/M52-Elemente | Teilweise | CSS/Overlay-Idee wiederverwendbar; keine direkte alte Inline-Mutation übernehmen. |
| Element anklicken | Ja, UI-Inspector `2471aa6`, Editor V2 `433ad07`, TargetSelection `1a0a27b` | Legacy-Artefakt vorhanden, neue M51/M52-Anbindung noch ohne sichtbare produktive Klickauswahl | Teilweise | Capture-Regeln sehr vorsichtig neu bauen; keine globalen dauerhaften Listener. |
| Auswahl halten | Ja, `selectedId`, `currentSelected`, `selectedElementId` | HostAdapter hält `selectedElementId`; Statuspanel zeigt Kit-/Host-Zustand | Ja, konzeptionell | Zustand im Kit/HostAdapter halten, nicht in Legacy-Overlay. |
| Auswahl aufheben | Ja, `clearSelection()`, `unmount()` | HostAdapter/Legacy-Artefakt teilweise; M51/M52 noch ohne sichtbaren Auswahlmodus | Teilweise | Escape-/Deaktivierungsfluss neu an Kit-Modus koppeln. |
| Eltern-/Kind-Gruppen unterscheiden | Ja, UI-Inspector M13.3 und EditorV2-Registry Parent/Child | M51/M52-Registry hat `parentId` für fünf BBM-Elemente | Ja | Parent-Struktur aus expliziter Registry verwenden. |
| Äußeren Container markieren | Ja, M13.3 Rahmen-zuerst; historischer Hinweis zu `restarbeiten.filterleiste.verortung` | Für M51/M52 noch keine DOM-Referenzbindung | Ja, fachlich | Auswahlziel muss explizit auf Container-Ref zeigen, nicht aus innerem Feld erraten. |
| Inspector-Panel öffnen | Ja, M12/M13 Panel; M13.6a schwebend | M52 Statuspanel sichtbar | Teilweise | Status-/Panel-Layout weiterverwenden, aber Inhalt aus Kit-ViewModels/HostAdapter. |
| Elementdetails anzeigen | Ja, UI-Inspector Panel und EditorScopeInspector | Aktuell `src/renderer/editorRuntime/inspector/` und Statuspanel/Tests | Ja | Details aus Registry/Kit lesen. |
| Registry-Eintrag zuordnen | Ja, UI-Inspector über DOM-ID/Marker; EditorV2 über Registry; TargetSelection über RegistryIndex | Ja, M51/M52 Registry/HostAdapter | Ja | Nur explizite Registry, keine DOM-Autoerkennung. |
| Vorschau anzeigen | Ja, M13.2/M13.2.1 temporär | M51/M52 mit Layout-Requests/MemoryStore, aber keine visuelle Overlay-Vorschau | Unsicher | Nicht als direkte Inline-Live-DOM-Mutation übernehmen. |
| Änderungen zurücksetzen | Ja, M13.2 Reset Original-Styles; EditorV2 Preview-Reset; TargetSelection uninstall | M51/M52 HostAdapter `resetLayoutState` | Teilweise | Reset über Kit/HostAdapter; nur Marker-Lifecycle visuell lokal. |
| Escape-/Abbruchverhalten | Teilweise in Unmount/Clear-Flows; konkrete Escape-Logik nicht durchgängig belegt | Keine neue Auswahlmodus-Escape-Bindung für M51/M52 | Neu erforderlich | Minimaler, aktivierungsgebundener Escape-Handler empfehlenswert. |
| Navigation während Auswahlmodus | Teilweise: Refresh/Unmount/Switch-Scope-Fixes später M34 | M52 refresh bei SectionChange; Statuspanel integriert | Teilweise | Bei Navigation Auswahl deaktivieren/auflösen, nicht übernehmen. |
| Deaktivierung des Auswahlmodus | Ja, `unmount()`, `uninstall()`, `clearSelection()` | Legacy-Artefakt ja; M51/M52 Statuspanel ohne Auswahlmodus | Teilweise | Neu als expliziter Modus im Kit/HostAdapter-Lifecycle. |

## 5. Gründe der Stilllegung / Ablösung

Die Historie enthält mehrere Hinweise, warum der alte sichtbare Pfad nicht einfach reaktiviert werden darf:

- Der M13-Hover- und Restarbeiten-Inspector-Pfad wurde in `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md` fachlich beendet; UI-V2/Editor-V2 wurden als Neustart geplant.
- M21 hat historische Scan-/Inspector-Begriffe ausdrücklich als nicht mehr verbindliche Zielrichtung eingeordnet.
- Die alten UI-Inspector-Funktionen nutzten DOM-Marker, `querySelectorAll`, globale Capture-Listener und direkte Inline-Styles. Diese Mechanismen können echte App-Interaktion beeinflussen.
- Fix-Commits zu Hit-List, Panel-Klicks und Overlay-Lifecycle zeigen, dass genau die sichtbare Runtime störanfällig war.
- M51/M52 ersetzen die Zielarchitektur: kein DOM-Scan, keine automatische Registry, keine Core-Kopie in BBM, keine parallele Legacy-Runtime.

## 6. Sicher wiederverwendbare Teile

Wiederverwendbar sind nur **Konzepte, Tests und kleine visuelle Muster**, nicht die alte Runtime als Ganzes:

- Overlay-Darstellung mit getrenntem Root, `position: fixed`, `pointerEvents: none` für reine Rahmen.
- Visuelle Unterscheidung von Hover und Auswahl über unterschiedliche Farben.
- Event-Lifecycle als Idee: nur im aktiven Auswahlmodus installieren, beim Deaktivieren vollständig entfernen.
- Escape-/Abbruch-/Unmount-Denkmodell: alle Marker entfernen, Auswahl aufheben, Listener lösen.
- `elementRef`-Konzept aus EditorV2-Registry als Vorlage für explizite Referenzbindung.
- Parent-/Child-Logik aus Registry statt aus DOM-Scan.
- Testfälle für Hover, Klickauswahl, Reset, Scroll-/Resize-Synchronisierung und Panel-Klick-Schutz.
- UI-Texte wie „Ausgewählter Bereich“, „Kein Bereich ausgewählt“, laientaugliche Begriffe für Bereich/Container/Feld.

## 7. Nicht wiederverwendbare Teile

Nicht übernehmen oder reaktivieren:

- `querySelectorAll('[data-ui-inspector-id]')` als Scan-Mechanik.
- `closest('[data-ui-editor-id]')` als generische Bestands-UI-Suche ohne explizite Registrierung.
- MutationObserver oder automatische Bestandserkennung, falls in alten Ableitungen ergänzt.
- Globale dauerhafte `pointerdown`, `click` oder `pointermove`-Listener ohne aktivierten Modus und ohne Scope-Begrenzung.
- Alte UI-Inspector-/EditorV2-Core- oder Registry-Logik als zweite Runtime neben UI-Editor-kit.
- Direkte Live-DOM-Layoutmutation für Vorschau/Speichern.
- Alte Speicherlogik oder localStorage-/IPC-Wege aus vor-M51-Pfaden.
- Fachliche Aktionen, Fachdatenänderungen oder fachliche Buttons als Editor-Ziele.

## 8. Abgleich mit M51/M52

### 8.1 Neue gültige M51/M52-Bestandteile

- `package.json` bindet `ui-editor-kit` auf `github:SteffenBandholt/UI-Editor-kit#v0.2.0`.
- `src/ui-editor/bbm-ui-editor-manifest.cjs` beschreibt Ziel-App, UI-Scope und Layout-Scope.
- `src/ui-editor/bbm-ui-element-registry.cjs` enthält die fünf expliziten BBM-Elemente:
  - `bbm.main.shell`
  - `bbm.main.navigation`
  - `bbm.main.header`
  - `bbm.main.content`
  - `bbm.main.actions`
- `src/ui-editor/bbm-host-adapter.cjs` verwaltet HostAdapter-Funktionen wie Registry, Scope-Validierung, Auswahl und Layout-State.
- `src/renderer/ui-editor/BbmUiEditorStatusPanel.js` ist sichtbarer Status-/Startpunkt.
- `src/main/ipc/uiEditorIpc.js` und `src/main/preload.js` stellen die sichere IPC-/Preload-Kette bereit.

### 8.2 Was fehlt für visuelle Auswahl

M51/M52 liefert die fachlich richtige, explizite Registry und HostAdapter-Schicht. Es fehlt aber eine sichere, minimale **Element-ID → konkrete HTMLElement-Referenz**-Bindung für die fünf aktuellen Registry-Elemente und eine darauf aufsetzende visuelle Auswahlschicht.

Wichtig: Diese Bindung darf keine DOM-Suche sein. Sie muss beim Shell-Aufbau explizit aus den ohnehin erzeugten Elementen befüllt werden.

## 9. Prüfung explizite Referenzbindung der fünf M51/M52-Elemente

### 9.1 Aktueller Stand in `CoreShell`

`CoreShell` erzeugt bzw. erhält beim Shell-Aufbau konkrete Elemente:

- `headerEl` aus `header.render()`.
- `content`, `topBox`, `bottomBox`, `sidebar`, `bodyRow` aus `createCoreShellLayout({ headerEl })`.
- `router.contentRoot = content`.
- `router.shellLayout = { sidebar, bodyRow }`.

Damit sind **konkrete DOM-Referenzen vorhanden**, aber aktuell nicht als explizites UI-Editor-Ref-Mapping für die M51/M52-Registry exponiert.

### 9.2 Bewertung je Element

| Registry-Element | Konkrete Referenz wahrscheinlich vorhanden | Aktuell als UI-Editor-Ref registriert | Minimale sichere Ergänzung |
|---|---:|---:|---|
| `bbm.main.shell` | Ja, wahrscheinlich über Body-/Layout-Root, aber in `CoreShell` nicht eindeutig benannt | Nein | `createCoreShellLayout` sollte Root/Shell-Element explizit zurückgeben oder `bodyRow`/Wrapper klar als Shell-Ref benannt werden. |
| `bbm.main.navigation` | Ja, `sidebar` | Nein | `elementRefs.set("bbm.main.navigation", sidebar)`. |
| `bbm.main.header` | Ja, `headerEl` | Nein | `elementRefs.set("bbm.main.header", headerEl)`. |
| `bbm.main.content` | Ja, `content` | Nein | `elementRefs.set("bbm.main.content", content)`. |
| `bbm.main.actions` | Unsicher: `bottomBox` ist globale untere Navigation/Aktion, nicht zwingend `bbm.main.actions`; PR #192 darf nicht übernommen werden | Nein | Vor Umsetzung klären, welches bestehende Element fachlich „Aktionsbereich“ meint; keine Header-/Aktionsbereich-Ausblendlogik übernehmen. |

## 10. Empfohlene Zielarchitektur

Die spätere Umsetzung sollte aus vier schmalen Schichten bestehen:

1. **Explizite BBM-ElementRef-Map im Renderer**  
   `Map<elementId, HTMLElement>` wird beim Rendern befüllt. Keine `querySelectorAll`, keine automatische DOM-Erkennung.
2. **HostAdapter-Erweiterung oder Renderer-seitige Adapter-Brücke**  
   Liefert nur registrierte, gültige Element-Refs an die visuelle Auswahl. Die Registry bleibt die fachliche Quelle.
3. **Kit-kompatible Selection-/ViewModel-Anbindung**  
   Auswahlzustand bleibt im UI-Editor-kit/HostAdapter. Die visuelle Schicht liest nur „hovered/selected element id“ und zeigt Rahmen.
4. **Reine Overlay-/Marker-Schicht ohne Fachlogik**  
   Zeichnet Hover-/Selected-Rahmen über referenzierte Elemente. Installiert Listener nur im aktiven Auswahlmodus und entfernt sie vollständig beim Abbruch, bei Navigation und bei Deaktivierung.

## 11. Konkrete Dateien für spätere Umsetzung

Nur für einen späteren, getrennten Implementierungsauftrag:

- `src/renderer/app/CoreShell.js`  
  Explizite Ref-Map nach `createCoreShellLayout` befüllen und an die UI-Editor-Renderer-Anbindung übergeben.
- `src/renderer/app/coreShellLayout.js`  
  Falls `bbm.main.shell` oder `bbm.main.actions` aktuell nicht eindeutig als Element zurückgegeben wird, nur minimal bestehende Referenzen benennen/ausgeben, nicht Layout umbauen.
- `src/renderer/ui-editor/BbmUiEditorStatusPanel.js`  
  Auswahlmodus-Schalter/Status später sichtbar anbinden, ohne fachliche Aktionen auszuführen.
- Neuer kleiner Renderer-Adapter, z. B. `src/renderer/ui-editor/bbmUiEditorElementRefs.js`  
  Verwaltung der expliziten Ref-Map, keine DOM-Suche.
- Neuer kleiner visueller Adapter, z. B. `src/renderer/ui-editor/bbmUiEditorSelectionOverlay.js`  
  Reines Zeichnen von Hover-/Selected-Rahmen aus ElementRefs.
- Tests unter `scripts/tests/`, z. B. `m54UiEditorElementRefs.test.cjs` und `m55UiEditorSelectionOverlay.test.cjs`.

## 12. Kleinstmöglicher nächster Implementierungsschritt

Empfohlenes nächstes Mini-Paket nach M53:

**M54 – Explizite ElementRef-Map für die fünf BBM-M51/M52-Registry-Elemente vorbereiten, ohne sichtbares Overlay.**

Umfang:

- Nur eine kleine Ref-Map/Adapter-Datei anlegen.
- `CoreShell` übergibt vorhandene Referenzen für `header`, `navigation`, `content` und ggf. Shell-Root.
- `bbm.main.actions` nur dann mappen, wenn das vorhandene Element fachlich eindeutig ist; sonst blockiert melden.
- Test: Registry-IDs und Ref-Map-Schlüssel stimmen überein; keine DOM-Scan-Funktionen (`querySelectorAll`, `MutationObserver`) in der Ref-Map.
- Kein Overlay, kein Hover, keine Klickauswahl, keine IPC-Änderung, keine Registry-Änderung.

## 13. Risiken

- `bbm.main.actions` ist ohne weitere Fachklärung möglicherweise nicht eindeutig mit einem vorhandenen DOM-Element identisch.
- Alte Overlay-/TargetSelection-Codepfade sind verführerisch, würden aber eine parallele Runtime neben dem Kit erzeugen.
- Globale Capture-Listener können Fachklicks blockieren, wenn sie nicht streng modusgebunden sind.
- Direkte Inline-Style-Markierungen können bestehende App-Styles beschädigen, wenn Originalzustände nicht sauber wiederhergestellt werden.
- Shell-/Router-Navigation muss Auswahl und Overlay vollständig deaktivieren, sonst bleiben Rahmen oder Listener hängen.
- PR #192 darf nicht als Grundlage verwendet werden; insbesondere kein Ausblenden von Seitenkopf/Aktionsbereich übernehmen.

## 14. Offene Fragen

1. Welches konkrete, bereits existierende Element ist fachlich `bbm.main.actions`? Ist es die untere Shell-Aktionszone, ein content-naher Aktionsbereich oder ein Statuspanel-Bereich?
2. Soll `bbm.main.shell` auf einen eigenen Shell-Wrapper, `bodyRow` oder einen übergeordneten App-Root zeigen?
3. Soll Hover im ersten sichtbaren Schritt nur Rahmen zeigen oder bereits Elementdetails im Panel aktualisieren?
4. Soll Escape zunächst nur Auswahl aufheben oder den gesamten Auswahlmodus deaktivieren?
5. Soll die visuelle Auswahl per Pointer auf den explizit registrierten ElementRefs arbeiten oder zunächst per Panel-Liste „Element auswählen“ erfolgen, um Fachklick-Risiken zu minimieren?

## 15. Klare Empfehlung

### Reaktivieren

**Nein.** Keine alte UI-Inspector-, EditorV2- oder TargetSelection-Runtime vollständig reaktivieren.

Begründung: Alle alten Pfade enthalten mindestens einen heute verbotenen oder riskanten Mechanismus: DOM-Scan, Selector-Fallback, globale Capture-Listener, direkte Inline-Layoutmutation oder eigene Core-/Registry-Logik neben UI-Editor-kit.

### Teilweise übernehmen

**Ja.** Folgende Teile gezielt übernehmen:

- Overlay-Optik und Hover-/Selected-Farbschema als visuelle Vorlage.
- Lifecycle-Ideen für Install/Uninstall, Reset und Scroll-/Resize-Refresh.
- EditorV2-`elementRef`-Konzept als Denkmuster für explizite Referenzbindung.
- Parent-/Child-Navigation aus Registry-Daten.
- Testszenarien für Hover, Klick, Panel-Klick-Schutz, Reset und Navigation.
- Laientaugliche Panel-Texte.

### Neu bauen

**Ja, die eigentliche M51/M52-Anbindung neu bauen.**

Begründung: Die neue Architektur verlangt UI-Editor-kit als alleinigen Core, BBM als Ziel-App mit expliziter Registry und HostAdapter sowie eine sichere Referenzbindung ohne DOM-Autoerkennung. Die visuelle Auswahl muss deshalb als dünner, kit-kompatibler Renderer-Adapter entstehen, nicht als Kopie alter Legacy-Runtime.
