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
Zusätzlich gibt es oben rechts einen internen Vollbild-Schalter für mehr Arbeitsfläche.
Der Editor startet dabei standardmäßig direkt im Vollbildmodus.
Er nutzt jetzt ein groesstenteils vollflächiges internes Arbeitsflächen-Overlay.

---

## Kann bereits

- Layout fuer `protokoll_tops` laden
- Modul und Tabelle bewusst auswaehlen
- Modul- und Tabellenliste kommen aus der zentralen Tabellenregistry
- aktuell ist nur `Protokoll / TOP-Liste / protokoll_tops` angemeldet
- spaetere Module melden ihre Tabellen ebenfalls in dieser Registry an
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
- Editor-Vorschau mit Testdaten aus der Registry
- UI- und PDF-Vorschau als getrennte umschaltbare Vorschau-Modi mit Testdaten aus der Registry
- keine Projekt- oder Besprechungsdaten in der Vorschau
- keine gleichzeitige Anzeige von UI- und PDF-Vorschau
- PDF-Werte sind im Editor nur eine technische Naeherung, kein echter PDF-Renderer
- Layoutwerte werden vor dem Speichern validiert und defensiv normalisiert
- Ungueltige technische Werte werden nicht gespeichert
- kaputte gespeicherte Layouts fallen auf das Standardlayout der konkreten Tabelle zurueck
- gespeicherte UI-Werte wirken jetzt auch in der echten Protokoll-TOP-Liste
- gespeicherte PDF-Werte wirken im echten PDF-Druck, nicht in der normalen UI-Liste
- ungespeicherte Aenderungen muessen vorher gespeichert werden
- normale Nutzer sehen diese Funktion nicht

Die Orientierung bearbeitet hier nur die Layoutvariante. Sie schaltet den normalen Druck noch nicht automatisch um.
Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.
Die Vorschau nutzt registrierte Testdaten.
UI- und PDF-Vorschau sind als getrennte Modi umschaltbar und verwenden dieselben registrierten Beispielzeilen.
Es wird immer nur ein Vorschau-Modus angezeigt.
Die PDF-Vorschau ist im Editor nur eine technische Naeherung und ersetzt keinen echten PDF-Renderer.
Spaetere Tabellen liefern ihre eigenen Preview-Daten ueber die Registry.

---

## Absichtliche Grenzen

- keine normale Nutzerfunktion
- keine neue Hauptnavigation
- keine PDF-Vorschau im Editor
- keine Header-/Footer-Aenderung
- keine zweite Drucklogik
- keine weiteren Tabellen
- keine ungespeicherten Layoutwerte im Testdruck
- keine Projekt-/Besprechungsauswahl

---

## Naechster Schritt

Spaeter kann der Editor um eine echte Layout-Vorschau und feinere Feldvalidierung erweitert werden.
Die bestehende Protokoll-UI bleibt bis dahin unveraendert.
