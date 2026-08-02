# M86.3 – Einheitlicher Editor-Start und Protokoll-Metaspalte

## Ziel und Abgrenzung

Protokoll und Restarbeiten verwenden im Arbeitsbereich keinen linken Navigationsbereich. Die vorhandene rechte Protokoll-Quicklane bleibt dieselbe Komponente; M86.3.1 korrigiert nur ihre vorhandene CSS-Geometrie und Erreichbarkeit. Beide Header erhalten ausschließlich in DEV-Builds den gemeinsamen Button `UI-Editor öffnen`.

Es wurden keine PDF-/Druckwege, Fachwerte, Fachaktionen, Datenbank- oder IPC-Fachwege geändert. Der Button ist kein Editorziel und ergänzt deshalb keine Registry, Komponentenvertrag, Parent-Ebene oder Editoroperation.

## Sidebar

- Protokoll behält seinen bestehenden lokalen Ausblend-/Wiederherstellungsweg.
- Restarbeiten setzt den vorhandenen Router-Shellvertrag `hideSidebar: true`. Der Router stellt beim Wechsel in andere Module deren eigenen Sidebarzustand wieder her; es gibt keine globale oder dauerhafte Sidebar-Deaktivierung.
- Der isolierte Restarbeiten-Acceptance-Installer mountet den Screen bewusst ohne den normalen Modulrouter. Er verwendet deshalb nun ebenfalls den vorhandenen Router-Aufruf `_setSidebarVisibility(false)`. Der produktive Modulvertrag und die Fachlogik bleiben unverändert.

## Development-only Editorstart

Der gemeinsame Helper prüft den expliziten Build-Kanal. Nur `DEV` erzeugt den Button; Stable-Builds erzeugen kein Button-Element und besitzen keinen aktivierten Header-Launcher.

Ein Klick erstellt den vorhandenen M80-Registrierungsdeskriptor neu, prüft den aktuellen vollständigen Modulscope beim nativen Öffnen/Fokussieren und sendet danach den vorhandenen `scopeChanged`-Pfad. Dadurch bleibt die Reihenfolge Refresh vor Open/Fokus erhalten. Die Header übergeben ausschließlich bestehende Scopes: `protokoll.screen.root` bzw. `restarbeiten.header.root`; die jeweils anderen bereits gemounteten Modulscopes bleiben Teil der vorhandenen Registry.

## Metaspalte Protokoll

Ursache war ausschließlich die Responsive-Regel bei `max-width: 640px`, die das vorhandene dreispaltige Workbench-Grid auf eine Spalte reduzierte. Entfernt wurde nur dieser Fallback. Das vorhandene Grid bleibt `Text | Gutter | Meta`; Meta, Status, Ampel, Fertig-bis, Verantwortlich und Kennzeichnungen verwenden weiterhin die bestehende rechte Workbench-Spalte.

IDs, Parents, Baselines, Bounds und M83-Komponentenverträge bleiben unverändert. Es entstand weder ein neuer Wrapper noch ein zusätzlicher Scrollcontainer.

## M86.3.1 – Erreichbarkeit und Bedienbarkeit

### Ursachenbefund

Die vier gemeldeten Symptome hatten nicht vier getrennte Strukturfehler:

- **Listeneinträge:** Im neutralen isolierten Protokollbestand war kein Listen- oder Hit-Test-Defekt reproduzierbar. `sheet` war bereits vor der Reparatur der einzige aktive vertikale Scrollbesitzer; erste und letzte vollständige Zeile waren per Mausrad erreichbar und anklickbar. Es gab keinen zweiten Scrollcontainer und keine Zeile lief hinter die Editbox.
- **Headerbuttons:** Im Ausgangszustand lag keine transparente Headerfläche über den Aktionen. `Protokoll beenden`, `Schliessen` und der Development-Button bestanden bereits den Mittelpunkt-Hit-Test. Die Tab-Reihenfolge erreichte Schlagwort, Abschluss, Schließen und Editorstart.
- **Editboxbuttons:** Hier bestanden zwei reale Störungen. Der Registry-Statushinweis des Editorstarts war ein dauerhaftes `position: fixed`-Element mit sehr hohem Z-Index und standardmäßig aktiven Pointer-Events; er lag über dem unteren rechten Workbench-Bereich. Zusätzlich überdeckte die aufgeklappte 64-Pixel-Quicklane bei schmalen Renderbreiten die rechte Hälfte von `Papierkorb`.
- **Restzeichenanzeigen:** Kurz- und Langtextzähler waren im neutralen Baselinezustand vorhanden, innerhalb der Editbox und hit-testbar. Das gemeldete Fehlen war kein Zähler- oder Griddefekt. Die Bedienprüfung belegt die Aktualisierung beider Werte nach echter Texteingabe jeweils um `-1`.
- **Quicklane:** In der großen Höhenstufe fehlten rechnerisch zwei Pixel Innenhöhe; bei kurzen Viewports war die unverkleinerte vertikale Lane zu hoch. Im aufgeklappten Zustand fehlte bei schmaler Breite ein reservierter rechter Screenbereich.
- **Restarbeiten-Acceptance:** Die Sidebar blieb nur dort sichtbar, weil der isolierte Diagnose-Installer den normalen Modulrouter und damit `shell.hideSidebar` umgeht. Der normale produktive Restarbeiten-Modulweg war nicht betroffen.

Gespeicherte UI-Editor-Werte waren nicht ursächlich: Im frischen isolierten Profil lagen keine gespeicherten Transformationen auf Screen, Header, Liste, Editbox, Workbench oder Metaspalte. Die sichtbare 13/65/22-Listenanordnung entsprach der Baseline.

### Reparaturen

- Der Registry-Hinweis erhält `pointer-events: none` und wird nach einem erfolgreichen Refresh nach 2,4 Sekunden, bei einem Fehler nach 6 Sekunden tatsächlich aus dem DOM entfernt.
- Die Quicklane öffnet zusätzlich mit `:focus-within`. Ihre vorhandenen Buttons werden bei niedrigen Viewports über zwei reine CSS-Höhenstufen komprimiert; es gibt weiterhin keinen internen Scrollcontainer.
- Die Grundhöhe der Lane wurde um die fehlenden zwei Pixel erweitert. Unter 1100 Pixel Rendererbreite reserviert der bestehende Protokollscreen mit `padding-inline-end: 64px` exakt die Lane-Breite. Dadurch überdeckt die aufgeklappte Lane weder Header noch Workbenchaktionen.
- Der isolierte Restarbeiten-Installer blendet die Shell-Sidebar über den bereits vorhandenen Router-Lebenszyklus aus.
- Der bestehende Integrationstest verlangt nun ausdrücklich alle drei Quicklane-Öffnungszustände: Hover, `:focus-within` und `data-open`.

Unverändert blieben DOM-Hierarchie, Parent-/Child-Struktur, Workbench-Grid `Text | Gutter | Meta`, Listen-Scrollstruktur, 13/65/22, Registryelemente, IDs, Refs, Baselines, Bounds, Editoroperationen, Fachlogik und PDF-/Druckwege.

### Sichtabnahme

Die Prüfung lief in echten lokalen Electron-Fenstern mit einem je Lauf frisch erzeugten, markierten und anschließend gelöschten Acceptance-Profil. Die Zielgrößen wurden unter dem realen lokalen Device-Scale-Faktor als entsprechende Renderer-Viewports geprüft:

| Zielauflösung | Renderer-Viewport | Ergebnis |
| --- | --- | --- |
| 1920 × 1080 | 1155 × 575 | Header, Editbox, beide Zähler und alle sichtbaren Buttons hit-testbar; Listenanfang/-ende erreichbar; Quicklane 456/456 px ohne Überlauf |
| 1600 × 900 | 962 × 467 | wie oben; Quicklane 386/386 px, reservierter rechter Bereich verhindert Überdeckung |
| 1366 × 768 | 822 × 388 | wie oben; Quicklane 318/318 px, keine Überdeckung und kein horizontaler Scroll |

Zusätzlich wurde von 900 × 430 wieder auf 962 × 467 vergrößert; beide Zustände blieben ohne horizontalen Dokumentüberlauf.

Tatsächlich bedient wurden:

- drei unterschiedliche Listenzeilen (`2.1`, `2.2`, `2.6`), Level-1 ein- und ausgeklappt sowie per Mausrad bis zum letzten Eintrag gescrollt;
- der Level-1-Schalter nach fünf echten `Tab`-Schritten fokussiert, mit `PageDown` den Listenbereich gescrollt und über Klicks in die native Scrollbar-Spur das vollständig sichtbare, hit-testbare Listenende erreicht;
- Kurztext und Langtext mit je einem eingegebenen Zeichen, beide Restzeichenzähler, Status, Termin, Verantwortlich sowie Wichtig/ToDo/Beschluss;
- `+TOP`, `+Titel`, `Schieben` an/aus, `Papierkorb` nur für die zuvor im isolierten Profil erzeugten Testeinträge und `Rückgängig`;
- Schlagwortdialog, `Protokoll beenden` mit sicherem `Abbrechen`, `Schliessen`/Rücksprung sowie die Tab-Navigation durch alle Headeraktionen;
- Protokoll-Editorbutton zum Öffnen und ein zweites Mal zum Fokussieren. Genau ein `UiEditorManager` lief; der nicht blockierende Statushinweis verschwand und der Protokollscreen blieb danach bedienbar;
- Restarbeiten-Editorbutton zum Öffnen und Fokussieren. Sidebar blieb ausgeblendet, Statushinweis verschwand und der Screen blieb bedienbar.

### Automatisierte Prüfung

Automatisiert sichern der M86.3-Guardrail sowie die bestehenden Restarbeiten-/Protokoll-, Launcher-, M83- und Vertragsprüfungen Sidebarvertrag, DEV/STABLE-Gating, Refresh-vor-Scope-Aktivierung, dreispaltige Meta-Anordnung, Quicklane-Fokus, Pointer-Verhalten und den einzigen Scrollbesitzer.

- Gezielte Protokoll-, Workbench-/Header-, M86.3-, Restarbeiten-, M83-, Registry-, Selection- und Harness-Tests: grün.
- `npm test`: 8/8 Gruppen grün.
- `npm run test:node`: 8/8 Gruppen grün.
- `scripts/ui-editor-contract-check.cjs` für die fünf geänderten UI-JavaScript-Dateien: 0 Fehler, keine neuen editorrelevanten Elemente.
- Gezieltes ESLint aller geänderten JavaScript-Dateien: grün.
- `git diff --check`: grün.

M86.3 ist damit `[A] abgenommen`.
