# Zentrale Bauherrauswahl – Entscheidung vor UI-Umsetzung

Base main `03d894f075c85bb1ea7cf79c552947dd8a70e437`; Nutzerbestätigung in #274,
Kommentar 5595638596. Eigenes zentrales Vorbereitungspaket vor SiGeKo S3.

A. Ausgabe: **UI**, zusätzliche eigenständige Komponente im vorhandenen zentralen
Projektformular (Seite und Modal). Keine PDF-Ausgabe oder Bestandsmigration der UI.

B. Editorfähig: **ja**. Scope `projektverwaltung.builder`, Komponente
`bbm.projektverwaltung.builder`; explizite Refs, bestehende M83-Helfer und vorhandener
Editorstarter. Das Auswahlfeld ist keine Inhaltstabelle. Bestehende Komponenten und
deren Verträge bleiben unverändert; Registry aggregiert nur den neuen Vertrag.

C. Vollständige Deklaration. Spalten entsprechen den sechs Pflichtattributen
`data-ui-inspector-id`, `data-ui-editor-kind`, `data-ui-editor-label`,
`data-ui-editor-parent`, `data-ui-editor-editable`, `data-ui-editor-ops`.
G = move,resizeWidth,resizeHeight,setVisibility; T = G,textResize.

| ID | kind | label | parent | editable | ops |
|---|---|---|---|---|---|
| projektverwaltung.builder | root | Bauherr-Zuordnung | – | true | G |
| projektverwaltung.builder.group | fieldGroup | Bauherr-Auswahl | projektverwaltung.builder | true | G |
| projektverwaltung.builder.label | label | Bauherr | projektverwaltung.builder.group | true | T |
| projektverwaltung.builder.input | field | Bauherr | projektverwaltung.builder.group | true | T |
| projektverwaltung.builder.hint | label | Hinweis zur Bauherr-Auswahl | projektverwaltung.builder | true | T |
| projektverwaltung.builder.status | label | Bauherr-Angaben und Ladestatus | projektverwaltung.builder | true | T |
| projektverwaltung.builder.refresh | button | Firmenauswahl aktualisieren | projektverwaltung.builder | true | T |
| projektverwaltung.builder.editor | button | UI-Editor | projektverwaltung.builder | true | T |

Reihenfolge wie Tabelle, visible/editable=true. Root Rolle scopeRoot, Feldgruppe
layout, Label/Hinweis content, Status status, Input dataFieldLayout mit
fieldKind/componentKind=select, Buttons domainActionLayout mit actionKind
refreshBuilderOptions/openUiEditor. Stabile IDs zugleich Slot-/Ref-Keys.
Alle sieben Hauptslots erforderlich mit Single-Ref; optionaler Entwicklungsstarter
Multi-Ref/whenVisibleInstances gemäß bestehendem Starter. Baseline x/y=0,
width/height=null, fontSize=12; min/max width=8/2400, height=8/1600, fontSize=6/32.
Operationseffekte aus bestehendem M83-Vertrag: Root layoutZone, Gruppe
groupWithChildren, übrige elementOnly.

D. Fachaktionen sind keine Editoroperationen: Auswahl ändern, Projekt speichern,
Firmen laden/anlegen/löschen, Navigation, Import/Export und IPC-/DB-Zugriffe bleiben
gesperrt (executeTargetAction, modifyDomainData, createRecord, deleteRecord).
Keine Firmenkopie, keine Kategorieableitung, kein Autosave. Neue Projekte verlangen
eine bewusste Bauherrauswahl im Formular; Altprojekte bleiben ohne automatische
Zuordnung bearbeitbar. Kompatible bestehende interne Create-Aufrufe bleiben möglich.
Eine fehlende gespeicherte Quelle bleibt erkennbar und wird bei anderen Änderungen
nicht still gelöscht. Bestehende Firmenpflege bleibt der Ort zum Anlegen von Firmen.

E. Jeder Parent existiert als tatsächlicher Container. Refs werden explizit beim
Render/Reopen gebunden und nur bei eigener Instanz beim Schließen entfernt.
Asynchrone Antworten geschlossener/ersetzter Ansichten verändern keine neue Ansicht.
Keine Fachdaten in IDs; Firmenwerte sind ausschließlich Dropdown-Inhalte.

F. Geplante Nachweise: echte Kit-Komponenten- und gemountete Ref-Validierung,
Pflichtattribute/Parents, Manifest/Scope-Fingerprints, Formularpayloads, Fehler- und
Lifecycle-Fälle. Bestehende isolierte Electron-/SQLite-Abnahmeplattform auf Windows
und Linux für Auswählen/Speichern/Wiederöffnen, schmale Ansicht und Editoroperation
ohne Fachdatenschreiben. Volltestvergleich gegen 1601/97. Der alte HTML-Vertragsparser
unterstützt das heutige M83-Vokabular nicht; er ist kein behaupteter grüner Nachweis.
Diese Entwurfsentscheidung behauptet noch keine bestandenen Prüfungen.
