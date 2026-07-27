# M81 – BBM-PDF-Adapter

Status: `[A] abgenommen`

## Ziel und Grenze

M81 bindet die reale BBM-Protokoll-PDF an den bereits vorhandenen nativen PDF-Arbeitsbereich des UI-Editor-kits an. BBM bleibt Eigentümerin von Registry, Layoutzustand, Fachkontext, Paginierung und `webContents.printToPDF`. Der Editor bleibt fachneutral.

Nicht eingeführt wurden ein zweiter PDF-Core, ein zweiter Renderer, ein zweiter Profilpfad, Browser-/Server-/Netzwerkbetrieb oder eine Änderung des Fachdatenschemas.

## Explizite Registry

Der Scope `pdf.bbm.protocol` enthält 28 explizite Layoutobjekte mit stabilen IDs und vollständigen Parent-Beziehungen:

- Dokumentroot und A4-Hochformat-Seite,
- Kopf- und Fußbereich einschließlich Wiederholung,
- Titel,
- getrennte Beschriftungs- und Wertobjekte,
- Teilnehmerbereich,
- TOP-Tabelle mit den sichtbaren Spalten `TOP`, `Gegenstand` und `Verantwortlich/Termin`,
- Tabellenkopf und wiederholte Tabellenbereiche.

Erlaubte Operationen werden pro Element aus der Registry abgeleitet: Position, Größe, Textposition, Schriftgröße, Ausrichtung, Zeilenabstand, Sichtbarkeit, Seitenränder und kontrollierte Spaltenbreiten. Fachwerte, Fachaktionen, Datenbank-, Datei- und Druckaktionen bleiben gesperrt.

## Laufweg

Die laufende Electron-App stellt den optionalen PDF-Vertrag über dieselbe gehärtete lokale Pipe wie die UI-Integration bereit. Der native Editor verwendet den bestehenden M77-PDF-Core, die bestehende `PdfLayoutSession`, den atomaren Profilstore unter `pdf-layouts` und die vorhandene Vorschau.

Bei Regeneration führt BBM den neutralen Layoutzustand vor dem vorhandenen Paginierungsweg zu. Der bestehende Protokoll-Renderer erzeugt die Seiten und der bestehende `printToPDF`-Pfad schreibt die kontrollierte Vorschau-PDF. Der Editor liest genau diese Datei und fachwertfreie Seiten-/Elementmetadaten zurück.

Stabile kompatible Profile werden übernommen; neue Registry-Elemente beginnen mit Baseline und unbekannte Alt-IDs werden nicht angewendet. Fehlerhafte Batches werden vollständig auf den Ausgangszustand zurückgerollt. Save, Neustart-Restore, Reset und Discard verwenden den vorhandenen Profil- und Sitzungsweg.

## Nachweis

- Adapter-, Registry-, Sicherheits-, Readback-, Rollback-, Reset-/Restore- und Regenerationstests sind automatisiert.
- Die vollständigen BBM- und UI-Editor-kit-Pflichtläufe sind Bestandteil der Abnahme.
- Sichtbar geprüft wurde ein reales BBM-Protokoll mit 28 Registry-Elementen und einer real erzeugten dreiseitigen PDF.
- Titel, Label/Wert, TOP-Tabelle, zwei Spalten, Kopf und Fuß wurden ausgewählt; Layoutänderungen, veraltete Vorschau, Regeneration, Save und Neustart-Restore wurden bestätigt.
- Einzel-/Gesamt-Reset und Discard wurden bestätigt.
- Eine absichtlich ungültige Spaltensumme löste einen Batchfehler und vollständigen Rollback aus.
- Es wurde keine `ReferenceOrder`-PDF als BBM-Nachweis verwendet.

M82 bleibt offen und wurde nicht begonnen.
