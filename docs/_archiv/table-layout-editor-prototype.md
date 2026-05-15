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
ZusÃ¤tzlich gibt es oben rechts einen internen Vollbild-Schalter fÃ¼r mehr ArbeitsflÃ¤che.
Der Editor startet dabei standardmÃ¤ÃŸig direkt im Vollbildmodus.
Er nutzt jetzt ein groesstenteils vollflÃ¤chiges internes ArbeitsflÃ¤chen-Overlay.

---

## Kann bereits

- Layout fuer `protokoll_tops` laden
- registrierte Module und Tabellen aus der zentralen Tabellenregistry anzeigen
- die Registry klassifiziert Tabellen mit `tableKind`, `editorEnabled`, `uiAvailable`, `pdfAvailable`, `uiProductive` und `pdfProductive`
- die Eingabefelder werden aus den Spaltendefinitionen der Tabelle erzeugt
- der Editor zeigt nur ausdruecklich freigegebene Inhaltstabellen mit `tableKind = content` und `editorEnabled = true`
- Bedienlisten und Auswahl-Popups gehoeren nicht in den Editor
- Spalten werden nicht aus Datenfeldern erraten
- neue Inhaltstabellen kommen erst als fachlich geklaerter Prototyp mit Layout-Steckbrief in den Editor; danach ist der Editor der Feintuning-Schritt fuer Breiten und Vorschau
- aktuell sind `Protokoll / TOP-Liste / protokoll_tops`, `Protokoll / Teilnehmerliste / protokoll_participants` und `Projektverwaltung / Projekt-Firmenliste / project_firms` registriert
- nur `protokoll_tops` ist produktiv an UI und PDF angeschlossen
- Orientierung waehlen: `portrait` / `landscape`
- der Editor merkt sich die zuletzt gewaehlte Orientierung intern
- aktuelle Werte anzeigen
- Spaltenbreiten, Spaltenueberschriften und Preview-Werte pro Spalte editieren
- ueber vorhandene `tableLayouts`-IPC speichern
- auf Standard zuruecksetzen
- Quelle wird sichtbar als `Standardlayout protokoll_tops`, `gespeichertes Layout` oder `Fallback`
- Editor-Vorschau mit Testdaten aus der Registry
- Spiegelansicht mit zwei festen Bereichen: UI-Ansicht und PDF-Ansicht
- die beiden Bereiche lesen ihre Spalten ausschliesslich aus der Registry
- keine Projekt- oder Besprechungsdaten in der Vorschau
- Hinweise erscheinen, wenn eine Tabelle keine UI- oder PDF-Ansicht hat
- PDF-Werte sind im Editor nur eine technische Naeherung, kein echter PDF-Renderer
- UI-Werte steuern die Spaltenbreiten in der App, wenn die Tabelle produktiv angeschlossen ist
- PDF-Werte steuern nur PDF-Spaltenbreiten, wenn ein PDF-Druckpfad fuer die Tabelle angeschlossen ist
- bei `projektverwaltung / project_firms` ist PDF nur Vorschau; ein produktiver PDF-Druck ist noch nicht angeschlossen
- bei `protokoll / protokoll_participants` sind UI und PDF aktuell nur Vorschau; ein produktiver Anschluss an Teilnehmer-UI und PDF-Druck ist noch nicht angeschlossen
- bei `protokoll / protokoll_tops` sind UI- und PDF-Breiten produktiv angeschlossen
- Reset betrifft nur die aktuell gewaehlte Kombination aus Modul, Tabelle und Orientierung
- Speichern betrifft nur die aktuell gewaehlte Tabelle, nicht ein globales Layout
- Layoutwerte werden vor dem Speichern validiert und defensiv normalisiert
- Ungueltige technische Werte werden nicht gespeichert
- kaputte gespeicherte Layouts fallen auf das Standardlayout der konkreten Tabelle zurueck
- gespeicherte UI-Werte wirken jetzt auch in der echten Protokoll-TOP-Liste
- gespeicherte PDF-Werte wirken im echten PDF-Druck, nicht in der normalen UI-Liste
- gespeicherte Spaltenwerte werden generisch aus `columns` aufgebaut
- spaetere Tabellen koennen ihre Spalten direkt in der Registry definieren
- ungespeicherte Aenderungen muessen vorher gespeichert werden
- normale Nutzer sehen diese Funktion nicht

Die Orientierung bearbeitet hier nur die Layoutvariante. Sie schaltet den normalen Druck noch nicht automatisch um.
Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.
Die Vorschau nutzt registrierte Testdaten.
UI- und PDF-Ansicht werden parallel als Spiegelansicht angezeigt und verwenden dieselben registrierten Beispielzeilen.
Die PDF-Vorschau ist im Editor nur eine technische Naeherung und ersetzt keinen echten PDF-Renderer.
Spaetere Tabellen liefern ihre eigenen Preview-Daten ueber die Registry.

---

## Absichtliche Grenzen

- keine normale Nutzerfunktion
- keine neue Hauptnavigation
- keine echte PDF-Erzeugung im Editor
- keine Header-/Footer-Aenderung
- keine zweite Drucklogik
- keine weiteren Tabellen
- keine ungespeicherten Layoutwerte im Testdruck
- keine Projekt-/Besprechungsauswahl

---

## Naechster Schritt

Spaeter kann der Editor um eine echte Layout-Vorschau und feinere Feldvalidierung erweitert werden.
Die bestehende Protokoll-UI bleibt bis dahin unveraendert.
