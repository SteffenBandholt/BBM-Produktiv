# M63B.1 – Read-only Inspector-Bridge intern, sichtbare Konsole vorbereitet

## Zweck
M63B.1 verbindet die vorhandene BBM-M51/M52-Auswahl intern read-only mit dem bestehenden `EditorScopeInspector`-Pfad. Die technische Bridge bleibt testbar und liefert interne Inspector-/Control-Metadaten, aber die sichtbare Statuspanel-Oberflaeche zeigt diese technischen Vertragsdaten nicht mehr direkt an.

## Fuehrende Registry
Fuehrend bleibt die M51/Kit-Ziel-App-Registry. Die Bridge erzeugt keine fachlich neue Registry, keine zusaetzlichen Elemente und keine parallele Modulregistry. Sie transformiert die aktuelle Elementliste nur pro Aufruf in die editorRuntime-Form, die der bestehende Inspector intern erwartet.

## Fuehrende Auswahl
Fuehrend bleibt M52 `selectedElement`, geliefert ueber das bestehende Statuspanel und die UI-Editor-kit Selection-Runtime. Die Bridge haelt keine eigene Auswahlwahrheit und liest bei jedem Aufruf die aktuelle Auswahl.

## Interne Registry-Feldabbildung
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
`role` wird nicht aus Label, CSS, Tagname, DOM-Struktur oder sichtbarer Ueberschrift abgeleitet. Die Bridge kennt nur eine kleine explizite statische Zuordnung fuer die bestehenden BBM-Hauptbereich-IDs. Elemente ohne kompatiblen Vertrag werden intern als `unsupported`/`blocked` gemeldet.

## Sichtbare Oberflaeche in M63B.1
Im Statuspanel-Detailbereich werden keine technischen Vertragsdaten angezeigt. Sichtbar ist hoechstens:

- der lesbare Name des ausgewaehlten Elements,
- der kurze neutrale Platzhalter `Bearbeitung wird vorbereitet.`,
- bei internem Fehler hoechstens `Bearbeitungsfunktionen sind derzeit nicht verfuegbar.`

Nicht sichtbar sind insbesondere Inspector-Status, `read_only`, technische Control-IDs, interne Operationsnamen, `allowedOps`, Bridge-/Runtime-Begriffe oder technische Fehlercodes.

## Bewusst nicht aktive Operationen
M63B.1 erzeugt keine aktiven Bedienelemente und ruft nicht auf:

- `applyLayoutChange`,
- `submitChangeRequest`,
- Save/Write,
- Load-Anwendung,
- `resetLayoutState`,
- `clear`,
- direkte `HTMLElement.style`-Mutation.

Es gibt keine neuen IPCs, keine Datenbanktabellen, kein `localStorage`, keine DOM-Suche und keine dynamische CSS-/JS-Ausfuehrung.

## Zielbild fuer die fertige Bedienkonsole
Der fertige UI-Editor soll keine technische Diagnoseansicht sein, sondern eine kleine praktische Bedienkonsole. M63C soll die sichtbare Struktur kompakt erweitern, ohne neue Operationen zu erfinden.

Geplante sichtbare Modi fuer M63C:

- Move
- Breite
- Hoehe
- Text
- Textposition

Geplantes Bedienmuster fuer M63C:

```text
        ▲
     ◀  •  ▶
        ▼
```

Diese Modusauswahl und das Steuerkreuz werden in M63B.1 noch nicht erzeugt.

## Fehlerverhalten
Inspector-/Adapterfehler duerfen intern Details enthalten. Sichtbar bleibt nur der nutzerfreundliche Hinweis, dass Bearbeitungsfunktionen derzeit nicht verfuegbar sind. Die Auswahlruntime, Elementauswahl und der orange Auswahlrahmen bleiben davon unberuehrt.
