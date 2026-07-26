# M80 – Restarbeiten-Pilotregistry

Die Registry ist explizit. M80.1 erweitert den Pilot auf drei vollständige Restarbeiten-Scopes und führt alle übrigen nicht sicher inventarisierten BBM-Bereiche ausdrücklich als gesperrt:

- `restarbeiten.layout.root`: gemeinsames Hauptlayout mit konsistenter Trennposition und Mindesthöhen für Hauptliste und Editbox.
- `restarbeiten.list.root`: Hauptliste mit Bereich, Papier, Inhaltstabelle und den drei fachlich bestätigten sichtbaren Spaltengruppen.
- `restarbeiten.edit.root`: vollständiger sichtbarer Bearbeitungsbereich mit Kopf, Kurz-/Langtext, Klasse, Verortung, Status, Termin, Ampel, Verantwortlich, Hinweisen und allen Buttons als reine Layoutobjekte.

## Bestätigte Tabellenspalten

1. `restarbeiten.list.table.number` – Nr. / Datum / Klasse / Fotos
2. `restarbeiten.list.table.subject` – Gegenstand – Verortung / Kurztext / Langtext
3. `restarbeiten.list.table.meta` – Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich

Die Tabelle ist eine Inhaltstabelle und ausschließlich Layoutobjekt. Sichtbarkeit einzelner Spalten ist nur zulässig, soweit keine Fachlogik verändert wird. Fachwerte, Status, Verantwortliche, Termine, Ampel, Fotos, Zeilen, Sortierung, Filter und Fachaktionen sind keine Editoroperationen.

Die Registry wird nicht aus DOM, CSS, Datenbank, IPC oder Druckdaten erzeugt. Parentstruktur, Reihenfolge, Rollen und Operationen sind fest gepflegt und durch den Vertragscheck abgesichert.

Registryversion `2`, Fingerprint, Scope-Inventare, Refresh und die vollständige Liste gesperrter Scopes sind in `M80_1_BESTANDSAPP_REGISTRIERUNG.md` dokumentiert.
