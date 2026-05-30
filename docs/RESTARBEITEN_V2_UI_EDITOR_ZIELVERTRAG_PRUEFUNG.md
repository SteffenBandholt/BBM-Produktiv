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

## M19.4 Elementabgleich (Pruefung, kein Umbau)

### Grenze fuer M19.4
- Keine Produktivaktivierung.
- Kein Button-Fix als Einzelmassnahme.
- Kein Quicklane-Umbau als Einzelmassnahme.
- Kein ReadOnly-Abnahmetest.
- Keine UI-Aenderung und keine produktiven Codeaenderungen.

### Elementtabelle
| UI-Element / Registry-ID | Bereich | Aktueller Charakter | Editor-lesbar | Fuer Editor optisch gestaltbar | Fachaktion enthalten | Bewertung | Begruendung |
|---|---|---|---|---|---|---|---|
| `restarbeitenV2.header` | Header | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | Strukturcontainer fuer Header, klar registriert |
| `restarbeitenV2.header.context` | Header | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | statische Kontextanzeige, keine Fachaktion |
| `restarbeitenV2.header.status` | Header | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | statische Statusanzeige, keine Fachaktion |
| `restarbeitenV2.header.filter` | Header | unklar | teilweise | spaeter | teilweise | noch klaeren | Label ist editor-lesbar, echte Filterlogik liegt teils in Quicklane/State |
| `restarbeitenV2.quicklane` | Quicklane | unklar | ja | ja | teilweise | spaeter trennen | Bereich ist Entwurfsstruktur, enthaelt aber Fachaktions-Controls |
| `restarbeitenV2.quicklane.lock` | Quicklane | DEV-Dummy | ja | spaeter | nein | nur DEV | nur Platzhalterlabel, keine klare Fach-/Editorfunktion im aktuellen Stand |
| `restarbeitenV2.quicklane.neu` | Quicklane | Fachaktion | ja | unklar | ja | spaeter trennen | loest lokales Anlegen/Selektieren aus; im Editor-Kontext tabu |
| `restarbeitenV2.quicklane.filterAlle` | Quicklane | Fachaktion | ja | unklar | ja | spaeter trennen | setzt Filterzustand und beeinflusst Liste/Selektion |
| `restarbeitenV2.quicklane.filterOffen` | Quicklane | Fachaktion | ja | unklar | ja | spaeter trennen | setzt Filterzustand und beeinflusst Liste/Selektion |
| `restarbeitenV2.quicklane.filterErledigt` | Quicklane | Fachaktion | ja | unklar | ja | spaeter trennen | setzt Filterzustand und beeinflusst Liste/Selektion |
| `restarbeitenV2.quicklane.foto` | Quicklane | DEV-Dummy | ja | spaeter | nein | nur DEV | aktuell ohne verdrahtete Fachaktion, nur sichtbarer Platzhalter |
| `restarbeitenV2.quicklane.diktat` | Quicklane | DEV-Dummy | ja | spaeter | nein | nur DEV | aktuell ohne verdrahtete Fachaktion, nur sichtbarer Platzhalter |
| `restarbeitenV2.main` | Main | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | Hauptbereich als strukturierter Entwurfscontainer |
| `restarbeitenV2.main.liste` | Main | echter UI-Entwurfsbestandteil | ja | ja | teilweise | bleibt | Liste als Entwurf bleibt, aber Zeilenverhalten teils fachnah |
| sichtbare Restarbeiten-Zeilen (`data-restarbeiten-v2-dummy-row`) | Main | DEV-Dummy | teilweise | unklar | ja | nur DEV | Zeilen sind klickbar und steuern Auswahl/Workbench |
| Legacy-ReadOnly-Datenanzeige (gemappte Rows) | Main | echter UI-Entwurfsbestandteil | teilweise | spaeter | nein | bleibt | Anzeigeweg passt zum Entwurf, ist aber keine Editor-Bedienfunktion |
| `restarbeitenV2.main.nummer` | Main | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | deklarierte Spalten-/Feldstruktur |
| `restarbeitenV2.main.textbereich` | Main | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | deklarierte Spalten-/Feldstruktur |
| `restarbeitenV2.main.verortung` | Main | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | deklarierte Spalten-/Feldstruktur |
| `restarbeitenV2.main.meta` | Main | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | deklarierte Spalten-/Feldstruktur |
| `restarbeitenV2.footer` | Footer | echter UI-Entwurfsbestandteil | ja | ja | nein | bleibt | Footer/Workbench-Rahmen ist klarer Entwurfsbereich |
| Detailbereich / Workbench (gesamt) | Workbench | unklar | teilweise | spaeter | ja | spaeter trennen | Entwurfsrahmen ist sinnvoll, aber Eingaben aendern lokale Daten |
| `restarbeitenV2.footer.kurztext` / Kurztext-Feld | Workbench | Fachaktion | teilweise | unklar | ja | spaeter trennen | `oninput` aktualisiert lokale Row-Daten |
| `restarbeitenV2.footer.langtext` | Workbench | Fachaktion | teilweise | unklar | ja | spaeter trennen | `oninput` aktualisiert lokale Row-Daten |
| `restarbeitenV2.footer.verortung` | Workbench | Fachaktion | teilweise | unklar | ja | spaeter trennen | `oninput` aktualisiert lokale Row-Daten |
| `restarbeitenV2.footer.meta` | Workbench | Fachaktion | teilweise | unklar | ja | spaeter trennen | Statusauswahl aendert lokale Row-Daten |
| `restarbeitenV2.footer.fotos` / Foto | Workbench | DEV-Dummy | teilweise | spaeter | nein | nur DEV | aktuell statischer "Keine Fotos"-Platzhalter im Entwurf |
| `restarbeitenV2.footer.notiz` | Workbench | Fachaktion | teilweise | unklar | ja | spaeter trennen | `oninput` aktualisiert lokale Row-Daten |
| Editor-V2-Panel (`editorv2.panel`) | Sonstiges | DEV-Dummy | ja | nein | nein | nur DEV | Test-/Bedienpanel fuer Editorentwicklung, kein Fach-UI-Element |
| Dummy-/Fallback-Daten (`createInitial...`, `createRestarbeitenV2DevLegacyRows`) | Sonstiges | DEV-Dummy | nein | nein | nein | nur DEV | reine Test-/Fallback-Datenbasis fuer DEV-Screen |

### Klare Festhaltung
- Echte UI-Entwurfsbestandteile:
  - `restarbeitenV2.header`, `restarbeitenV2.main`, `restarbeitenV2.main.liste`, `restarbeitenV2.footer`
  - `restarbeitenV2.main.nummer`, `restarbeitenV2.main.textbereich`, `restarbeitenV2.main.verortung`, `restarbeitenV2.main.meta`
  - Legacy-ReadOnly-Datenanzeige als Anzeigebestandteil (nicht als Editoraktion)
- DEV-/Dummy-Anteile:
  - `restarbeitenV2.quicklane.lock`, `restarbeitenV2.quicklane.foto`, `restarbeitenV2.quicklane.diktat`
  - sichtbare Dummy-Zeilen und Dummy-/Fallback-Datenquellen
  - Editor-V2-Panel als DEV-Zugang
- Fachaktionen (im Editor-Kontext tabu):
  - `restarbeitenV2.quicklane.neu`
  - `restarbeitenV2.quicklane.filterAlle`, `restarbeitenV2.quicklane.filterOffen`, `restarbeitenV2.quicklane.filterErledigt`
  - Workbench-Eingaben (`kurztext`, `langtext`, `verortung`, `meta`, `notiz`) mit lokaler Datenmutation
- Was der Editor lesen darf:
  - deklarierte Registry-Struktur (`id`, `label`, `kind`, `parentId`, `editable`, `ops`, `selector`)
  - zugeordnete UI-V2-Knoten fuer Layout-/Strukturzwecke
- Was spaeter optisch gestaltbar sein soll:
  - Position, Groesse, Sichtbarkeit und Layout der Entwurfscontainer/Felder
  - spaeter getrennt davon PDF-Darstellung
- Fuer Editor-Kontext tabu:
  - alle Elemente mit unmittelbarer Fachaktionsausloesung oder Datenmutation
- Noch unklar / spaeter zu entscheiden:
  - genaue Abgrenzung `header.filter` als reines Entwurfselement oder fachaktive Filterflaeche
  - welche Workbench-Felder als reine Layoutflaechen verbleiben und welche fachlich getrennt werden

## Ergebnis M19.3R
- Abgleich gegen den urspruenglichen Zielvertrag ist dokumentiert.
- Kein produktiver Umbau erfolgt.
- Produktiv-ReadOnly bleibt deaktiviert.
