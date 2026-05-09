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

---

## Absichtliche Grenzen

- keine normale Nutzerfunktion
- keine neue Hauptnavigation
- keine PDF-Vorschau im Editor
- keine Header-/Footer-Aenderung
- keine zweite Drucklogik
- keine weiteren Tabellen

---

## Naechster Schritt

Spaeter kann der Editor um eine echte Layout-Vorschau und feinere Feldvalidierung erweitert werden.
Die bestehende Protokoll-UI bleibt bis dahin unveraendert.

