# Restarbeiten V2 gegen UI-Editor-Zielvertrag - Pruefung M19.3R

## Zweck und Grenze
M19.3R ist eine reine Pruef- und Dokumentationsphase.

- Keine Produktivaktivierung.
- Kein Button-Fix.
- Keine UI-Neugestaltung.
- Keine produktiven Codeaenderungen.

## Gepruefte Grundlagen
- `docs/UI_EDITOR_V2_ABLAUF.md`
- `docs/RESTARBEITEN_V2_LESEWEG_ENTSCHEIDUNG.md`
- `docs/MODULARISIERUNGSPLAN.md`
- `STATUS.md`
- `docs/UI_EDITOR_V2_REGELN.md`
- `docs/UI_EDITOR_VERTRAG.md`
- `docs/RESTARBEITEN_V2_KONZEPT.md`
- `docs/RESTARBEITEN_V2_REGISTRY.md`
- `src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js`
- `src/renderer/modules/restarbeitenV2/restarbeitenV2Registry.js`
- `src/renderer/app/Router.js`
- passende Restarbeiten-V2-/Editor-V2-Tests

## A. Urspruengliche UI-Editor-Regeln
- Fachmodul entscheidet bewusst ueber UI/PDF, der Editor entscheidet nicht ueber Fachinhalt.
- Editor arbeitet fachneutral und registry-basiert, nicht per DOM-Raterei.
- Editor erzeugt/aendert/loescht keine Fachdaten.
- Vorschau/Editor-Bedienung bleibt von Produktiv-Fachaktion getrennt.
- UI- und PDF-Weg bleiben getrennt.

## B. Aktuell erfuellte Regeln
- Registry-basierter Aufbau ist vorhanden (`restarbeitenV2Registry`).
- Editor-V2-Anbindung ist fachneutral ueber Registry vorbereitet.
- V2-Screen selbst enthaelt keinen direkten IPC-/DB-Zugriff.
- ReadOnly-Freigabe bleibt produktiv deaktiviert; Altpfad bleibt Standard.
- Produktive Aktivierung ist weiterhin an explizite spaetere Freigabe gebunden.

## C. Aktuell nicht erfuellte oder nicht belastbar nachweisbare Regeln
- Klare Trennung "Editor-Kontext" vs. "Fachaktion" ist im DEV-Screen nicht sauber: Quicklane `Neu` loest eine inhaltliche Listenaktion aus (lokales Anlegen/Selektieren).
- Der Screen wirkt weiter wie DEV-/Dummy-Testflaeche; damit ist keine belastbare produktive ReadOnly-Abnahme ableitbar.
- Eine finale Zielvertrags-Form "UI-Entwurf ist rein deklarativ/editorlesbar, Fachaktionen strikt getrennt" ist aktuell nur teilweise erreicht.

## D. Dummy-/DEV-Anteile im Restarbeiten-V2-Screen
- Dummy-/Fallback-Rows (`createInitialRestarbeitenV2DummyItems`, `createRestarbeitenV2DevLegacyRows`).
- DEV-Hinweistexte wie "Nur lokale DEV-Vorschau - keine Speicherung".
- Quicklane-/Footer-Texte sind teilweise Platzhaltercharakter.
- Editor-V2-Panel ist als DEV-/Testzugang sichtbar.

## E. Echte Fach-UI (oder fachlich vorgesehene Richtung)
- ReadOnly-Leseweg ueber Legacy-Quelle -> Bridge -> Adapter/Factory -> Mapper -> V2-Screen ist vorbereitet.
- Projektkontextlauf (`projectId`) bis in den lesenden Datenweg ist vorbereitet und testseitig nachgewiesen.
- Alte Restarbeiten-UI bleibt ohne Freigabe der produktive Standardpfad.

## F. Editor-lesbar deklarierte Elemente
- Header/Quicklane/Main/Footer sind als Registry-Eintraege mit `id`, `label`, `kind`, `parentId`, `editable`, `ops`, `selector` deklariert.
- Beispiele: `restarbeitenV2.quicklane.neu`, `restarbeitenV2.main.liste`, `restarbeitenV2.footer.kurztext`.
- Struktur und Parent-Beziehungen sind explizit statt geraten.

## G. Elemente mit fachlicher Aktion (im Editor-Kontext tabu)
- Quicklane `Neu` (`restarbeitenV2.quicklane.neu`) erzeugt lokal neue Restarbeitzeile und waehlt sie aus.
- Filter-Buttons (`Alle/Offen/Erledigt`) veraendern fachnahe Listenansicht/Selektion.
- Workbench-Eingaben veraendern lokale Datensaetze (Draft-Daten) im Screen-Zustand.

Hinweis: Das ist aktuell DEV-lokal ohne Persistenz, bleibt aber trotzdem Fachaktionsverhalten und kein reiner Editorbetrieb.

## H. Warum manuelle ReadOnly-Abnahme auf aktuellem DEV-Screen nicht belastbar ist
- Sichtbare DEV-/Dummy-Elemente und lokale Create-/Filter-/Draft-Aktionen ueberlagern den Zielvertrag "ReadOnly + fachneutraler Editorkontext".
- Ein sichtbarer DEV-Screen mit lokaler Fachaktion erlaubt keine saubere Aussage, dass produktiver ReadOnly-Betrieb fachlich stabil getrennt ist.
- Deshalb darf die Freigabeentscheidung nicht aus diesem DEV-Eindruck abgeleitet werden.

## I. Naechster sinnvoller Schritt
- M19.4 - Restarbeiten V2 UI-Entwurf nach Editor-Regeln abgleichen.
- Grenzen:
  - keine Produktivaktivierung
  - kein Button-Fix als Einzelmassnahme
  - kein Quicklane-Umbau als Einzelmassnahme
  - kein ReadOnly-Abnahmetest
- Stattdessen:
  1. vorhandene Restarbeiten-V2-Registry und UI-Struktur gegen die Editor-Regeln pruefen
  2. deklarieren, welche UI-Elemente echte Entwurfsbestandteile sind
  3. deklarieren, welche Elemente nur DEV-/Dummy-Anteile sind
  4. deklarieren, welche Fachaktionen fuer den Editor tabu sind
  5. festlegen, was der Anwender optisch gestalten darf (Position, Groesse, Sichtbarkeit, Layout, spaeter PDF-Darstellung)
  6. spaetere PDF-Gestaltung getrennt halten
- Zielrichtung:
  - Fuer eine Aufgabe wird bewusst eine UI/PDF-Darstellung entworfen.
  - Diese UI wird nach den festgelegten Editor-Regeln aufgebaut.
  - Der Editor liest diese deklarierte UI-Struktur.
  - Der Editor entscheidet nicht ueber Fachbuttons/Fachfelder.
  - Der Editor veraendert keine Fachdaten.

## Ergebnis M19.3R
- Abgleich gegen den urspruenglichen Zielvertrag ist dokumentiert.
- Kein produktiver Umbau erfolgt.
- Produktiv-ReadOnly bleibt deaktiviert.
