# M83.0 – Komponentenbasierte Vollregistrierung

## Ursache des Altproblems

Bis M82.7.5 wurden alle offiziellen Ziele in `m80Registry.js` zentral aufgezählt. Produktive DOM-Marker und Ref-Aufrufe lagen dagegen in den jeweiligen Komponenten. Manifestzählungen, Fingerprinttests und bekannte-ID-Tests prüften nur die zentrale Liste. Deshalb konnte ein Container als vollständig gelten, obwohl vorhandene Kinder wie Nr., Datum oder Klasse nie Bestandteil der Registry und damit auch nie Bestandteil der Ref-Prüfung waren.

## Neuer BBM-Komponentenvertrag

Die sechs offiziellen Scopes werden aus acht UI-Komponentenverträgen aggregiert, die direkt als Begleitdateien bei ihren produktiven Komponenten liegen:

- Restarbeiten-Filterbar: 31 Ziele,
- Restarbeiten-Liste: 32 Ziele,
- Restarbeiten-Editbox: 53 Ziele,
- Protokoll-Screen: 10 Ziele und Quicklane: 15 Ziele,
- Protokoll-Listen-Shell: 4 Ziele und logische Spalten: 3 Ziele,
- Protokoll-Editbox: 24 Ziele.

Jedes Bündel deklariert `componentId`, Scope, Pflichtslots, Single-/Multi-Ref-Semantik und vollständige Elementverträge. `m80Registry.js` importiert und aggregiert nur noch diese Komponenten. Es enthält keine zentrale Unterelement-Handliste mehr.

## Ref- und Laufzeitmodell

Die bestehenden produktiven Ref-Aufrufe bleiben explizit. `m80Refs.js` gleicht den gemounteten Zustand gegen die Komponentenverträge ab:

- Single-Refs müssen genau ein Ziel besitzen und dürfen nicht durch einen anderen Knoten überschrieben werden.
- Multi-Refs binden alle sichtbaren Instanzen eines logischen Templateziels.
- Leere Listen bleiben mit null gemounteten Instanzen gültig.
- Direkte Auswahl ordnet das Kind vor einem gemeinsam gebundenen Parent.
- Unvollständige Bindings blockieren den Scope mit dem konkreten Guardrail-Code.

## Vollnachweis Restarbeiten-Liste

Die bestehende erste zusammengefasste Spalte bleibt unverändert aufgebaut und registriert nun getrennt:

- Spaltencontainer, Spaltenkopf und Datenbereich,
- Nr., Datum, Klasse, optionalen Nachpflegehinweis und Fotos,
- die vorhandenen Gegenstandsbestandteile Verortung, Kurztext und optionalen Langtext,
- die vorhandenen End-Metaziele Fertig bis, Ampel, Status, Verantwortlich und optionalen Pflichtfeldhinweis.

Die IDs sind statische Template-IDs. Es werden keine Datensatz- oder Datenbank-IDs verwendet. Die produktive Zeile behält exakt ihre drei bestehenden Kinder `numberColumn`, `contentColumn` und `metaColumn`; es wurden keine Wrapper, Viewports oder Scrollbesitzer ergänzt.

## Guardrails

Statische Validierung prüft Pflichtslots, Registrydeckung, Parents, ID-Quelle, Capabilities, Baselines und Grenzen. Die gemountete Validierung prüft Ref-Auflösung, Zielanzahl und direkte Auswahl. Fehler wie `component_required_slot_missing`, `component_slot_reference_missing`, `component_single_ref_duplicate`, `component_parent_missing`, `component_capability_unsupported`, `component_resize_bounds_missing` und `component_child_selection_swallowed` benennen Komponente und Slot.

## Vorgehen für neue BBM-UIs

Eine neue oder strukturell geänderte editorfähige Komponente muss gleichzeitig ihren vollständigen Begleitvertrag und ihre explizite Ref-Auflösung liefern. Die zentrale Registry darf nur das Bündel aggregieren. Eine UI-Aufgabe ist ohne grünen Komponenten- und Laufzeitvertrag nicht abgeschlossen.

## PDF-Vorbereitung

Für spätere PDF-Komponenten gilt dasselbe Architekturprinzip: Renderer und expliziter Layoutvertrag gehören zusammen; keine automatische PDF-Erkennung; stabile IDs und vollständige Slots; Operationen über den vorhandenen PDF-HostAdapter. M83.0 ändert weder PDF-Code noch PDF-Ausgabe.

## Sichtbare Abnahme

Die isolierte Acceptance mit `npm run start:ui-editor:acceptance` ist erfolgreich nachgetragen. Meta-Spalte, Nr., Datum und Klasse sind als unterschiedliche stabile Ziele auswählbar; eine Kindänderung bleibt auf das Kind begrenzt. Die Listenampel wendet ihren Multi-Ref-Layoutwert auf alle sichtbaren Zeilen an, neu gerenderte Zeilen übernehmen ihn. Speichern und automatischer zweiter Acceptance-Start stellen den Wert wieder her. Es entstanden keine neue Scrollleiste und keine Topologieänderung.
