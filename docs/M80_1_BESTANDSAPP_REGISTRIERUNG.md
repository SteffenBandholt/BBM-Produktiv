# M80.1 – BBM-Bestands-App-Registrierung

> Historischer Abnahmestand von M80.1. M80.2 ersetzt den damaligen Split-Scope durch den vollständig registrierten Header und direkte Größenoperationen am stabilen Editbox-Root. Der aktuelle Vertrag steht in `M80_2_RESTARBEITEN_HEADER_EDITBOX_LAYOUT.md`.

## Führender Registrierungsweg

BBM liefert bei jedem Klick auf `UI-Editor öffnen` einen frisch aus den expliziten Renderer-Refs erzeugten Registrierungsstand. Der Main-Prozess ergänzt den Ziel-App-Vertrag, berechnet den deterministischen Fingerprint, validiert Version, Registry, Refs, Scope-Status und Inventar und öffnet oder fokussiert erst danach den vorhandenen nativen Editor.

Es gibt weiterhin nur eine führende BBM-Registry unter `src/renderer/ui-editor/m80Registry.js`, einen Ref-Resolver, einen Electron-HostAdapter, den vorhandenen Editor/Node-Core und den vorhandenen atomaren Profilweg. Es existiert keine automatische DOM-Erkennung und keine zweite Schattenregistry als Wahrheit.

## Registryvertrag

- `registryVersion`: `2`
- `registryStatus`: `incomplete`, weil nicht alle produktiven BBM-Bereiche sicher inventarisiert sind
- Fingerprint: deterministisches SHA-256 über die sortierte Layout-/Vertragsstruktur
- `activeScopes`: nur vollständige, aktuell auflösbare Scopes
- Laufzeitereignisse: `registryChanged`, `registryStatusChanged`, `scopeAdded`, `scopeChanged`, `scopeRemoved`

Fachwerte, aktuelle Eingaben, Kunden-/Projektdaten, dynamische Tabellenzeilen, Fotos, Status-, Verantwortlichen- und Terminwerte gehen weder in Registry noch Fingerprint ein.

## Vollständige Scopes

### `restarbeiten.layout.root`

Nicht editierbarer Scope-Root mit dem eigenen editierbaren Container `restarbeiten.layout.split` sowie Hauptlisten- und Editboxbereich. `resizeHeight` am Split-Container ändert eine gemeinsame Trennposition; Mindesthöhen von 180 px für die Liste und 160 px für die Editbox verhindern widersprüchliche Einzelhöhen. Beide Bereiche können zusätzlich layoutbezogen in Breite und Sichtbarkeit bearbeitet werden.

### `restarbeiten.list.root`

Enthält Listenbereich, Listenblatt, Inhaltstabelle und genau die drei vom Nutzer bestätigten sichtbaren Spaltengruppen:

1. Nr. / Datum / Klasse / Fotos
2. Gegenstand – Verortung / Kurztext / Langtext
3. Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich

Die Tabelle und ihre Spalten sind ausschließlich Layoutobjekte. Fachwerte, Fotos, Zeilen, Sortierung, Filter, Status, Verantwortliche, Termine und Ampellogik bleiben gesperrt.

### `restarbeiten.edit.root`

Das Inventar enthält Root, Bearbeitungsbereich, Kopf und aktuellen Datensatzhinweis; Kurztextgruppe mit Bezeichnung, Restzeichen, Diktat, Klassenbezeichnung/-auswahl, Klassenbuttons, Neu/Löschen und Feld; Langtextgruppe mit Bezeichnung, Restzeichen, Diktat und Feld; vier Verortungsgruppen mit jeweils getrenntem Label und Feld; Status, Fertig bis und Verantwortlich mit jeweils getrenntem Label und Feld; Ampel, Pflichtfeldhinweis und Notizbutton.

Jedes sichtbare Element besitzt stabile ID, Parent, Scope, Typ, Rolle, semantischen Schlüssel, Ref, Baseline, Capabilities, `lockedOps`, Sichtbarkeit und Registrierungsstatus. Labels und Felder sind Geschwister. Alle Fachbuttons sind nur Layoutobjekte und sperren insbesondere Ausführung und Fachdatenänderung.

## Ausdrücklich gesperrte Scopes

Die folgenden vorhandenen Bereiche sind nicht sicher vollständig inventarisiert und werden daher nicht als editorfähig behauptet:

- `bbm.shell`, `bbm.home`, `bbm.projects`, `bbm.project-workspace`
- `bbm.firms`, `bbm.project-firms`, `bbm.protokoll`
- `bbm.settings`, `bbm.help`, `bbm.dialogs`
- `restarbeiten.filterbar`, `restarbeiten.quicklane`, `restarbeiten.notes`
- `restarbeiten.output-preview` – zusätzlich wegen der M81-PDF-Grenze gesperrt

## Refresh und Profilverhalten

Jeder Öffnungs- und Fokusweg validiert zuerst den aktuellen Stand. Bei kompatibler Änderung wird die laufende Editorinstanz kontrolliert beendet und genau eine neue Instanz mit der neuen Registry gestartet. Fehler ersetzen die vorherige gültige Registry nicht. Dirty-Konflikte und Parent-/Bedeutungsänderungen blockieren den Wechsel.

Stabile IDs behalten kompatible Layoutwerte. Neue IDs verwenden die Ziel-App-Baseline. Entfernte IDs werden nicht mehr angewendet und kontrolliert ignoriert/archiviert. Entfallene Capabilities entfernen nicht mehr erlaubte Profilwerte. Der vorhandene Profilpfad bleibt alleinige Persistenzautorität.

Dirty-Zustände vergleichen ausschließlich registrierte und damit persistierbare Capabilities. Nicht freigegebene Laufzeitmaße dürfen nach Restore oder Refresh keinen falschen Profilkonflikt erzeugen. Explizit gesetzte DOM-Außenmaße werden als `border-box` ohne nachträgliches `flex-shrink` angewandt, damit gespeicherte Layoutbreiten über BBM-Neustarts stabil bleiben.

## Historische Bestände

Verglichen wurden `uiEditor/`, `src/renderer/uiInspector/`, `src/renderer/uiV2/`, `src/ui-editor/`, `src/renderer/ui-editor/`, `src/renderer/editorRuntime/` und frühere Restarbeiten-/Editbox-Registries. Wiederverwendet wurden bestätigte stabile Bedeutungen und der frühere Restarbeiten-Elementbestand; Parents, Refs und sichtbare Elemente wurden gegen die heutige tatsächliche UI geprüft. Veraltete Scanner, Overlays, Selector-Fallbacks, Memory-Registries und eingebettete Editoroberflächen bleiben historisch und nicht produktführend.

## Grenzen

- Keine Fachlogik oder Fachdatenänderung.
- Keine automatische UI-Erkennung.
- Kein Browser-, Webserver-, Netzwerk- oder Cloudpfad.
- Kein zweiter Editor, Core oder Profilweg.
- M81 PDF und M82 App-Starterpaket bleiben offen.

## Praktische Abnahme

Die Abnahme lief mit `dist/win-unpacked/BBM.exe` und dem mitgepackten vorhandenen nativen Editor. Geprüft wurden die drei aktiven Scopes, alle 49 sichtbaren Editbox-Elemente, alle sieben Knoten der Hauptliste mit exakt drei Spaltengruppen, Hauptsplit und Pane-Größen, unabhängige Label-/Feldbearbeitung, Sichtbarkeit, Fachaktionssperre, Save/Load/Restore/Reset/Discard und Rollback. Ein kontrollierter Registrywechsel ersetzte die laufende Instanz erst nach erfolgreichem Refresh; ein zweiter Wechsel wurde mit ungespeicherter Änderung sichtbar blockiert und nach Discard sauber geladen. Zu jedem Zeitpunkt existierte genau eine Editorinstanz.
