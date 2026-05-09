# Tabellenlayout-Editor-Prototyp

Status: intern, nur fuer Entwicklung/Admin
Bezug:
- `docs/UI-TECH-CONTRACT.md`
- `docs/table-layout-storage-plan.md`
- `docs/table-layout-protokoll-tops.md`

---

## Ziel

Ein erster, kleiner Editor-Prototyp fuer `protokoll_tops` ist im bestehenden Settings-Bereich angehaengt.

Zugang:
- Einstellungen
- Entwicklung
- Technik
- Tab `Tabellenlayouts`

Der Editor ist absichtlich nicht Teil der normalen Navigation.

---

## Kann bereits

- Layout fuer `protokoll_tops` laden
- Orientierung waehlen: `portrait` / `landscape`
- der Editor merkt sich die zuletzt gewaehlte Orientierung intern
- aktuelle Werte anzeigen
- Kernwerte editieren:
  - UI Breite TOP-Spalte
  - UI Breite Text-Spalte
  - UI Breite Meta-Spalte
  - PDF Breite TOP-Spalte
  - PDF Breite Text-Spalte
  - PDF Breite Meta-Spalte
  - Spaltenueberschriften
- ueber vorhandene `tableLayouts`-IPC speichern
- auf Standard zuruecksetzen
- Quelle wird sichtbar als `Standardlayout protokoll_tops`, `gespeichertes Layout` oder `Fallback`
- PDF-Testdruck fuer das gespeicherte Layout starten
- der Testdruck nutzt nur gespeicherte Layoutwerte aus der DB und die aktuelle Orientierung
- ungespeicherte Aenderungen muessen vorher gespeichert werden
- normale Nutzer sehen diese Funktion nicht

Die Orientierung bearbeitet hier nur die Layoutvariante. Sie schaltet den normalen Druck noch nicht automatisch um.
Der PDF-Testdruck ist kein Live-Viewer und kein direkter Renderer-Preview im Editor.

---

## Absichtliche Grenzen

- keine normale Nutzerfunktion
- keine neue Hauptnavigation
- keine PDF-Vorschau im Editor
- keine Header-/Footer-Aenderung
- keine zweite Drucklogik
- keine weiteren Tabellen
- keine ungespeicherten Layoutwerte im Testdruck

---

## Naechster Schritt

Spaeter kann der Editor um eine echte Layout-Vorschau und feinere Feldvalidierung erweitert werden.
Die bestehende Protokoll-UI bleibt bis dahin unveraendert.
