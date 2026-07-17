# M63B – Read-only Inspector-Bridge

## Zweck
M63B verbindet die vorhandene BBM-M51/M52-Auswahl read-only mit dem bestehenden `EditorScopeInspector`-Pfad. Die Bridge zeigt im Statuspanel neutrale Layout-Control-Metadaten fuer das aktuell ausgewaehlte Registry-Element, ohne eine Layoutoperation auszufuehren.

## Fuehrende Registry
Fuehrend bleibt die M51/Kit-Ziel-App-Registry. Die Bridge erzeugt keine fachlich neue Registry, keine zusaetzlichen Elemente und keine parallele Modulregistry. Sie transformiert die aktuelle Elementliste nur pro Aufruf in die editorRuntime-Form, die der bestehende Inspector erwartet.

## Fuehrende Auswahl
Fuehrend bleibt M52 `selectedElement`, geliefert ueber das bestehende Statuspanel und die UI-Editor-kit Selection-Runtime. Die Bridge haelt keine eigene Auswahlwahrheit und liest bei jedem Aufruf die aktuelle Auswahl.

## Registry-Feldabbildung
Die Bridge bildet die M51-Felder deterministisch ab:

| M51/Kit-Feld | editorRuntime-Feld | Regel |
| --- | --- | --- |
| `elementId` | `id` | unveraendert |
| `label`/`name` | `name` | unveraendert, Fallback nur auf gleiche ID |
| bekannte M51-ID | `type` | statische explizite Zuordnung fuer die bestehenden BBM-Hauptbereich-IDs |
| bekannte M51-ID | `role` | statische explizite Zuordnung fuer die bestehenden BBM-Hauptbereich-IDs |
| `parentId` | `parentId` | unveraendert |
| Reihenfolge in der M51-Liste | `order` | numerischer Listenindex |
| `editable`/`capabilities`/`allowedChanges` | `editable` | nur aus vorhandenen Capabilities/Aenderungsvertraegen |
| `allowedOps` oder explizite konkrete Operationsfelder in `capabilities` | `allowedOps` | nur bereits konkret benannte EditorRuntime-Operationen; `layout.read`, `layout.save` und `layout.reset` werden nicht in konkrete Operationen uebersetzt |
| `lockedOps` | `lockedOps` | vorhandene Werte, sonst `[]` |
| `visible`/`layoutDefaults.visible` | `visible` | vorhandener Wert, sonst `true` |

## Umgang mit `role` und fehlenden Feldern
`role` wird nicht aus Label, CSS, Tagname, DOM-Struktur oder sichtbarer Ueberschrift abgeleitet. Die Bridge kennt nur eine kleine explizite statische Zuordnung fuer die bestehenden BBM-Hauptbereich-IDs. Elemente ohne kompatiblen Vertrag werden als `unsupported`/`blocked` sichtbar gemeldet.

## Read-only Status
- Keine Auswahl: neutraler leerer Status ohne Controls.
- Bekannte Auswahl: Inspector-/Control-Metadaten werden read-only angezeigt; ohne konkret freigegebene Operationen bleibt `allowedOps: []`.
- Unbekannte ID: blockierter Status ohne Controls.
- Fehlender Vertrag: `unsupported`/`blocked`, ohne Raten fehlender Pflichtfelder.

## Sichtbare Informationen im Statuspanel
Im Detailbereich erscheint `Layout-Steuerung` mit:
- Inspector-Status,
- Read-only-Hinweis,
- Editierbar/Gesperrt-Status,
- Liste der erlaubten Layoutoperationen,
- Control-IDs und Control-Metadaten,
- Hinweis: In M63B werden keine Layoutaenderungen ausgefuehrt.

## Bewusst nicht aktive Operationen
M63B ruft nicht auf:
- `applyLayoutChange`,
- `submitChangeRequest`,
- Save/Write,
- Load-Anwendung,
- `resetLayoutState`,
- `clear`,
- direkte `HTMLElement.style`-Mutation.

Es gibt keine neuen IPCs, keine Datenbanktabellen, kein `localStorage`, keine DOM-Suche und keine dynamische CSS-/JS-Ausfuehrung.

## Fehlerverhalten
Inspector-/Adapterfehler werden als blockierter Status im Panel sichtbar. Die Auswahlruntime wird dadurch nicht gestoppt, die vorhandenen Statuspanel-Informationen bleiben nutzbar, und es wird keine Fallback-Registry aufgebaut.

## Scope fuer M63C
M63C darf spaeter genau eine bereits vorhandene Operation aus dem EditorLayoutControls-Pfad sichtbar ausfuehrbar machen. Die Pilotoperation ist aus dem bestehenden Inspector-Control-Panel, der fuehrenden Registry und den vorhandenen Tests zu waehlen. M63C darf keine neue Operation erfinden und muss vor jeder Ausfuehrung die bestehenden Validator-/HostAdapter-Grenzen nutzen.
