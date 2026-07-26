# M80 – Restarbeiten-Pilotregistry

Die Registry ist explizit und umfasst ausschließlich zwei Restarbeiten-Scopes:

- `restarbeiten.list.root`: Hauptliste mit Bereich, Papier, Inhaltstabelle und den drei fachlich bestätigten sichtbaren Spaltengruppen.
- `restarbeiten.edit.root`: Bearbeitungsbereich mit Kurztext-/Langtext-`fieldGroup`, getrennten Labels/Feldern und dem Button `Neu` als reines Layoutobjekt.

## Bestätigte Tabellenspalten

1. `restarbeiten.list.table.number` – Nr. / Datum / Klasse / Fotos
2. `restarbeiten.list.table.subject` – Gegenstand – Verortung / Kurztext / Langtext
3. `restarbeiten.list.table.meta` – Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich

Die Tabelle ist eine Inhaltstabelle und ausschließlich Layoutobjekt. Sichtbarkeit einzelner Spalten ist nur zulässig, soweit keine Fachlogik verändert wird. Fachwerte, Status, Verantwortliche, Termine, Ampel, Fotos, Zeilen, Sortierung, Filter und Fachaktionen sind keine Editoroperationen.

Die Registry wird nicht aus DOM, CSS, Datenbank, IPC oder Druckdaten erzeugt. Parentstruktur, Reihenfolge, Rollen und Operationen sind fest gepflegt und durch den Vertragscheck abgesichert.
