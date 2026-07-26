# M80 – UI-/PDF-Entwurfsentscheidung

Status: umgesetzt und praktisch geprüft.

## A. Art der Ausgabe

- UI: ja, Restarbeiten-Pilot in der laufenden BBM-Oberfläche.
- PDF: nein. Der Editor zeigt für BBM ausschließlich `BBM-PDF noch nicht angebunden – folgt in M81.`

## B. Editorfähigkeit

Editorfähig: ja, ausschließlich als Layout. Fachwerte, Datenbindung, Fachlogik und Tabellenfunktion bleiben unverändert.

## C. Editorfähige Elemente

Jedes Element trägt `data-ui-inspector-id`, `data-ui-editor-kind`, `data-ui-editor-label`, `data-ui-editor-parent`, `data-ui-editor-editable` und `data-ui-editor-ops`.

- `restarbeiten.list.root` – Root, nicht selbst editierbar.
- `restarbeiten.list.area` → Parent Root.
- `restarbeiten.list.paper` → Parent Area.
- `restarbeiten.list.table` → Inhaltstabelle; Tabellenbreite, Position, technisch sinnvolle Höhe, Schrift/Textposition und Sichtbarkeit.
- `restarbeiten.list.table.number` → `Nr. / Datum / Klasse / Fotos`.
- `restarbeiten.list.table.subject` → `Gegenstand – Verortung / Kurztext / Langtext`.
- `restarbeiten.list.table.meta` → `Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich`, `columnRole = metaColumn`.
- `restarbeiten.edit.root` – Root, nicht selbst editierbar.
- `restarbeiten.edit.area` und `restarbeiten.edit.fields` → Bereich/Gruppe.
- `restarbeiten.edit.short` und `restarbeiten.edit.long` → `fieldGroup`.
- `.label` und `.field` → getrennte Geschwister mit jeweils eigener ID, Referenz und Sichtbarkeit.
- `restarbeiten.edit.action.new` → fachlicher Button ausschließlich als Layoutobjekt.

Erlaubt sind capability-gesteuert `move`, `resizeWidth`, `resizeHeight`, `textMove`, `textResize` und `setVisibility`.

## D. Nicht editorfähige Ziele

Nicht erlaubt sind Fachwerte, Status, Verantwortliche, Termine, Ampellogik, Fotos, Zeilen, Sortierung/Filter, fachliches Speichern/Anlegen/Löschen, Upload, Import, Export, Autosave, fachliche IPC-/Datenbankaktionen oder das Ausführen eines Buttons.

## E. Parent-/Strukturregel

Jedes Element außer dem jeweiligen Root besitzt einen existierenden registrierten Parent. Labels und Felder sind Geschwister unter ihrer `fieldGroup`; ein Label ist nie Parent eines Feldes. Die drei bestätigten sichtbaren Spaltengruppen bleiben zusammen und werden nicht aus Datenbank-, IPC- oder Druckfeldern abgeleitet.

## F. Prüfung

- `scripts/ui-editor-contract-check.cjs` über beide Registry-Scopes.
- `scripts/tests/m80ElectronUiEditor.test.cjs` prüft IDs, Parents, Rollen, Operationen, Fachaktionssperren und sechs DOM-Pflichtattribute.
- Sichtbarer Entwicklungs- und gepackter E2E-Lauf prüft Auswahl, Markierung, Live-Layout, unabhängige Sichtbarkeit, Tabellenbreite, Save/Load, Neustart-Restore, Discard, Reset und Rollback.

M81 bleibt die vollständige BBM-PDF-Anbindung an den bestehenden PDF-Arbeitsbereich.
