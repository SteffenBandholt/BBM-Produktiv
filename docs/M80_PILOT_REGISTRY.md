# M80 – Restarbeiten-Pilotregistry

Die Registry ist explizit. M80.2 führt drei vollständige Restarbeiten-Scopes und alle übrigen nicht sicher inventarisierten BBM-Bereiche ausdrücklich als gesperrt:

- `restarbeiten.header.root`: tatsächlicher Filter-Header mit vollständig gepflegter Parentstruktur, getrennten Labels/Feldern und Fachbuttons als reinen Layoutobjekten.
- `restarbeiten.list.root`: Hauptliste mit Bereich, Papier, Inhaltstabelle und den drei fachlich bestätigten sichtbaren Spaltengruppen.
- `restarbeiten.edit.root`: direkt größenfähiger Root und vollständiger sichtbarer Bearbeitungsbereich mit Kopf, Kurz-/Langtext, Klasse, Verortung, Status, Termin, Ampel, Verantwortlich, Hinweisen und allen Buttons als reine Layoutobjekte.

Der frühere Scope `restarbeiten.layout.root` ist mit `M80_2_split_removed` gesperrt. `restarbeiten.layout.split` und die gekoppelte Verhältnisoperation werden nicht mehr angeboten. Die Hauptliste füllt stattdessen den verbleibenden Arbeitsbereich flexibel und scrollt innerhalb ihres eigenen Containers; die begrenzte Editbox bleibt darunter sichtbar.

## Bestätigte Tabellenspalten

1. `restarbeiten.list.table.number` – Nr. / Datum / Klasse / Fotos
2. `restarbeiten.list.table.subject` – Gegenstand – Verortung / Kurztext / Langtext
3. `restarbeiten.list.table.meta` – Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich

Die Tabelle ist eine Inhaltstabelle und ausschließlich Layoutobjekt. Sichtbarkeit einzelner Spalten ist nur zulässig, soweit keine Fachlogik verändert wird. Fachwerte, Status, Verantwortliche, Termine, Ampel, Fotos, Zeilen, Sortierung, Filter und Fachaktionen sind keine Editoroperationen.

Die Registry wird nicht aus DOM, CSS, Datenbank, IPC oder Druckdaten erzeugt. Parentstruktur, Reihenfolge, Rollen und Operationen sind fest gepflegt und durch den Vertragscheck abgesichert.

Registryversion `3`, der M80.2-Layoutvertrag und die Behandlung alter Splitwerte sind in `M80_2_RESTARBEITEN_HEADER_EDITBOX_LAYOUT.md` dokumentiert. Der in M80.1 eingeführte Fingerprint-, Refresh- und Profilvertrag bleibt unverändert führend.
