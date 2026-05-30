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

## M19.6 Registry-Abgleich gegen Ziel-UI-Skelett (Pruefung, kein Umbau)

### Grenze fuer M19.6
- Keine Produktivaktivierung.
- Kein Code-Umbau.
- Kein Button-Fix.
- Keine Quicklane-Bereinigung.
- Keine ReadOnly-Abnahme.

### Registry-Tabelle
| Registry-ID | Ziel-UI-Bereich laut M19.5 | aktueller Bereich / parentId | kind | label | selector | editable | ops | passt zum Ziel-Skelett | Charakter | Editor-lesbar | optisch gestaltbar | Fachaktion enthalten | Bewertung | Begruendung |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `restarbeitenV2.root` | Modulrahmen | Root / `-` | frame | Restarbeiten V2 | `[data-ui-v2-id="restarbeitenV2.root"]` | false | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | zentraler Strukturanker |
| `restarbeitenV2.header` | Header | Header / `restarbeitenV2.root` | frame | Header | `[data-ui-v2-id="restarbeitenV2.header"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | passt direkt zum Zielbereich Header |
| `restarbeitenV2.header.context` | Status-/Kontextanzeige | Header / `restarbeitenV2.header` | field | Kontext | `[data-ui-v2-id="restarbeitenV2.header.context"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | lesende Kontextanzeige |
| `restarbeitenV2.header.status` | Status-/Kontextanzeige | Header / `restarbeitenV2.header` | field | Status | `[data-ui-v2-id="restarbeitenV2.header.status"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | lesende Statusanzeige |
| `restarbeitenV2.header.filter` | Ansichtsfilter | Header / `restarbeitenV2.header` | control | Filter | `[data-ui-v2-id="restarbeitenV2.header.filter"]` | false | move,hide | teilweise | unklar | teilweise | spaeter | teilweise | noch klaeren | Filterlabel passt, finale Trennung zur Fachwirkung offen |
| `restarbeitenV2.quicklane` | Quicklane / Ansichtssteuerung | Quicklane / `restarbeitenV2.root` | frame | Quicklane | `[data-ui-v2-id="restarbeitenV2.quicklane"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | Bereich ist vorgesehen, Inhalt muss fachaktionsfrei bleiben |
| `restarbeitenV2.quicklane.lock` | Quicklane / Ansichtssteuerung | Quicklane / `restarbeitenV2.quicklane` | control | Vorhaengeschloss | `[data-ui-v2-id="restarbeitenV2.quicklane.lock"]` | false | move,hide | teilweise | DEV-Dummy | ja | spaeter | nein | nur DEV | aktuell keine klare Zielrolle belegt |
| `restarbeitenV2.quicklane.neu` | Quicklane / Ansichtssteuerung | Quicklane / `restarbeitenV2.quicklane` | control | Neu | `[data-ui-v2-id="restarbeitenV2.quicklane.neu"]` | false | move,hide | nein | Fachaktion | ja | unklar | ja | spaeter trennen | `Neu` ist im Editor-Kontext nicht zulaessig |
| `restarbeitenV2.quicklane.filterOffen` | Ansichtsfilter | Quicklane / `restarbeitenV2.quicklane` | control | Filter Offen | `[data-ui-v2-id="restarbeitenV2.quicklane.filterOffen"]` | false | move,hide | teilweise | unklar | ja | ja | ja | spaeter trennen | aktuell gekoppelt mit fachnaher Listensteuerung |
| `restarbeitenV2.quicklane.filterErledigt` | Ansichtsfilter | Quicklane / `restarbeitenV2.quicklane` | control | Filter Erledigt | `[data-ui-v2-id="restarbeitenV2.quicklane.filterErledigt"]` | false | move,hide | teilweise | unklar | ja | ja | ja | spaeter trennen | aktuell gekoppelt mit fachnaher Listensteuerung |
| `restarbeitenV2.quicklane.filterAlle` | Ansichtsfilter | Quicklane / `restarbeitenV2.quicklane` | control | Filter Alle | `[data-ui-v2-id="restarbeitenV2.quicklane.filterAlle"]` | false | move,hide | teilweise | unklar | ja | ja | ja | spaeter trennen | aktuell gekoppelt mit fachnaher Listensteuerung |
| `restarbeitenV2.quicklane.foto` | Quicklane / Ansichtssteuerung | Quicklane / `restarbeitenV2.quicklane` | control | Foto | `[data-ui-v2-id="restarbeitenV2.quicklane.foto"]` | false | move,hide | teilweise | DEV-Dummy | ja | spaeter | nein | nur DEV | im Zielbild nur Anzeigebezug, keine Upload-Fachaktion |
| `restarbeitenV2.quicklane.diktat` | Quicklane / Ansichtssteuerung | Quicklane / `restarbeitenV2.quicklane` | control | Diktat | `[data-ui-v2-id="restarbeitenV2.quicklane.diktat"]` | false | move,hide | teilweise | DEV-Dummy | ja | spaeter | nein | nur DEV | Diktat ist laut Zielbild keine Editor-Aktion |
| `restarbeitenV2.main` | Main / Restarbeiten-Liste | Main / `restarbeitenV2.root` | frame | Main | `[data-ui-v2-id="restarbeitenV2.main"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | Hauptbereich passt |
| `restarbeitenV2.main.liste` | Main / Restarbeiten-Liste | Main / `restarbeitenV2.main` | frame | Liste | `[data-ui-v2-id="restarbeitenV2.main.liste"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | Listenstruktur ist Kernbestandteil |
| `restarbeitenV2.main.nummer` | einzelne Restarbeiten-Zeile | Main / `restarbeitenV2.main.liste` | field | Nummer | `[data-ui-v2-id="restarbeitenV2.main.nummer"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | passt zu Zeilenaufbau |
| `restarbeitenV2.main.textbereich` | Kurztext-/Langtext-Anzeige | Main / `restarbeitenV2.main.liste` | field | Textbereich | `[data-ui-v2-id="restarbeitenV2.main.textbereich"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | passt zu Anzeigefeldern |
| `restarbeitenV2.main.verortung` | Verortung / Bereich / Ebene | Main / `restarbeitenV2.main.liste` | field | Verortung | `[data-ui-v2-id="restarbeitenV2.main.verortung"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | fachlich vorgesehener Anzeigeanteil |
| `restarbeitenV2.main.meta` | Status-/Ampelanzeige | Main / `restarbeitenV2.main.liste` | field | Meta | `[data-ui-v2-id="restarbeitenV2.main.meta"]` | true | move,resize,hide | teilweise | unklar | ja | ja | teilweise | noch klaeren | Ampel/Status vorgesehen, genaue Abgrenzung offen |
| `restarbeitenV2.footer` | Footer / Kontextbereich | Footer / `restarbeitenV2.root` | frame | Footer | `[data-ui-v2-id="restarbeitenV2.footer"]` | true | move,resize,hide | ja | echte Ziel-UI | ja | ja | nein | bleibt | Zielbereich explizit vorhanden |
| `restarbeitenV2.footer.kurztext` | Detail-/Anzeigezone | Footer / `restarbeitenV2.footer` | field | Kurztext | `[data-ui-v2-id="restarbeitenV2.footer.kurztext"]` | true | move,resize,hide | teilweise | unklar | teilweise | spaeter | ja | spaeter trennen | derzeit als Eingabefeld statt reine Anzeige |
| `restarbeitenV2.footer.langtext` | Langtext-/Notiz-Anzeige | Footer / `restarbeitenV2.footer` | field | Langtext | `[data-ui-v2-id="restarbeitenV2.footer.langtext"]` | true | move,resize,hide | teilweise | unklar | teilweise | spaeter | ja | spaeter trennen | derzeit als Eingabefeld statt reine Anzeige |
| `restarbeitenV2.footer.verortung` | Verortung / Bereich / Ebene | Footer / `restarbeitenV2.footer` | field | Verortung | `[data-ui-v2-id="restarbeitenV2.footer.verortung"]` | true | move,resize,hide | teilweise | unklar | teilweise | spaeter | ja | spaeter trennen | derzeit mit fachnaher Mutation gekoppelt |
| `restarbeitenV2.footer.meta` | Status-/Ampelanzeige | Footer / `restarbeitenV2.footer` | field | Meta | `[data-ui-v2-id="restarbeitenV2.footer.meta"]` | true | move,resize,hide | teilweise | unklar | teilweise | spaeter | ja | spaeter trennen | derzeit mit Statusaenderung gekoppelt |
| `restarbeitenV2.footer.fotos` | Foto-/Anlagenbereich (Anzeige) | Footer / `restarbeitenV2.footer` | frame | Fotos | `[data-ui-v2-id="restarbeitenV2.footer.fotos"]` | true | move,resize,hide | teilweise | DEV-Dummy | teilweise | spaeter | nein | nur DEV | Zielbild: Anzeige ja, keine Upload-Aktion |
| `restarbeitenV2.footer.notiz` | Langtext-/Notiz-Anzeige | Footer / `restarbeitenV2.footer` | field | Notiz | `[data-ui-v2-id="restarbeitenV2.footer.notiz"]` | true | move,resize,hide | teilweise | unklar | teilweise | spaeter | ja | spaeter trennen | derzeit als Eingabefeld statt reine Anzeige |

### Nicht als Registry-ID abbildbar (aber fuer Zielbild relevant)
- einzelne Restarbeiten-Zeile (dynamische Zeilenknoten in `main.liste`): Ziel-UI ja, aktuell teils fachnah (Selektion), spaeter sauber trennen.
- Detail-/Lesebereich als Lesezone: Ziel-UI ja, aktuelle Workbench-Eingabemuster teils fachaktiv.
- Editor-V2-Panel / Editor-Zugang: Werkzeugcharakter, nicht fachliche Ziel-UI.

### Festhaltung M19.6
- Passt bereits gut zum Ziel-Skelett:
  - `restarbeitenV2.header`, `restarbeitenV2.header.context`, `restarbeitenV2.header.status`
  - `restarbeitenV2.quicklane` (als Bereich)
  - `restarbeitenV2.main`, `restarbeitenV2.main.liste`, `restarbeitenV2.main.nummer`, `restarbeitenV2.main.textbereich`, `restarbeitenV2.main.verortung`
  - `restarbeitenV2.footer` (als Bereich)
- DEV-/Dummy-Charakter:
  - `restarbeitenV2.quicklane.lock`, `restarbeitenV2.quicklane.foto`, `restarbeitenV2.quicklane.diktat`, `restarbeitenV2.footer.fotos`
- Fachaktionscharakter (im Editor-Kontext tabu):
  - `restarbeitenV2.quicklane.neu`
  - `restarbeitenV2.quicklane.filterAlle`, `restarbeitenV2.quicklane.filterOffen`, `restarbeitenV2.quicklane.filterErledigt`
  - `restarbeitenV2.footer.kurztext`, `restarbeitenV2.footer.langtext`, `restarbeitenV2.footer.verortung`, `restarbeitenV2.footer.meta`, `restarbeitenV2.footer.notiz` (aktuelle Eingabekopplung)
- Spaeter optisch gestaltbar:
  - alle klaren Struktur-/Anzeigeelemente (Position, Groesse, Sichtbarkeit, Layout)
- Unklar/offen:
  - `restarbeitenV2.header.filter`, `restarbeitenV2.main.meta` sowie die endgueltige Lese-vs.-Eingabeabgrenzung im Footer

### Vorbereitung fuer spaetere technische Bereinigung (ohne Umbau in M19.6)
- Fachaktions-Controls in Quicklane aus Editor-Kontext entkoppeln (`Neu`, fachaktive Filterlogik).
- Footer-Felder von fachlicher Mutation auf klare Anzeige-/Leselogik trennen oder in separaten Fachmodus verschieben.
- DEV-/Dummy-Controls als reine DEV-Elemente markieren oder aus Ziel-Registry perspektivisch herausfuehren.

## M19.7 Technische Zielrichtung fuer spaetere Registry-Bereinigung (Pruefung, kein Umbau)

### Grenze fuer M19.7
- Keine Produktivaktivierung.
- Kein Code-Umbau.
- Keine Registry-Aenderung im Code.
- Kein Button-Fix.
- Keine Quicklane-Bereinigung im Code.

### Zielkategorien fuer spaetere Bereinigung
- bleibt im Editor-Kontext
- wird spaeter als DEV-only markiert
- wird spaeter aus dem Editor-Kontext herausgenommen
- wird spaeter reines Anzeigeelement
- gehoert spaeter in separaten Fachmodus
- bleibt offen / fachlich zu klaeren

### Zuordnung der Registry-Eintraege
| Registry-ID | Zielrichtung M19.7 | Begruendung |
|---|---|---|
| `restarbeitenV2.root` | bleibt im Editor-Kontext | Strukturanker der deklarativen UI |
| `restarbeitenV2.header` | bleibt im Editor-Kontext | Ziel-UI-Bereich Header |
| `restarbeitenV2.header.context` | wird spaeter reines Anzeigeelement | Kontextanzeige ohne Fachaktion |
| `restarbeitenV2.header.status` | wird spaeter reines Anzeigeelement | Statusanzeige ohne Fachaktion |
| `restarbeitenV2.header.filter` | bleibt offen / fachlich zu klaeren | unklare Trennung Anzeige-Filter vs. fachaktive Wirkung |
| `restarbeitenV2.quicklane` | bleibt im Editor-Kontext | Bereich bleibt, Inhalt spaeter klar getrennt |
| `restarbeitenV2.quicklane.lock` | wird spaeter als DEV-only markiert | derzeit ohne klare fachliche Zielrolle |
| `restarbeitenV2.quicklane.neu` | gehoert spaeter in separaten Fachmodus | `Neu` bleibt als Fachaktion im Editor-Kontext tabu |
| `restarbeitenV2.quicklane.filterAlle` | wird spaeter aus dem Editor-Kontext herausgenommen | aktuell fachaktiv gekoppelt, muss von reiner Ansichtssteuerung getrennt werden |
| `restarbeitenV2.quicklane.filterOffen` | wird spaeter aus dem Editor-Kontext herausgenommen | aktuell fachaktiv gekoppelt, muss von reiner Ansichtssteuerung getrennt werden |
| `restarbeitenV2.quicklane.filterErledigt` | wird spaeter aus dem Editor-Kontext herausgenommen | aktuell fachaktiv gekoppelt, muss von reiner Ansichtssteuerung getrennt werden |
| `restarbeitenV2.quicklane.foto` | wird spaeter als DEV-only markiert | Foto/Upload bleibt keine Editor-Aktion |
| `restarbeitenV2.quicklane.diktat` | wird spaeter als DEV-only markiert | Diktat bleibt keine Editor-Aktion |
| `restarbeitenV2.main` | bleibt im Editor-Kontext | Ziel-UI-Bereich Main |
| `restarbeitenV2.main.liste` | bleibt im Editor-Kontext | Ziel-UI-Bereich Liste |
| `restarbeitenV2.main.nummer` | wird spaeter reines Anzeigeelement | Zeilenstruktur/Anzeige |
| `restarbeitenV2.main.textbereich` | wird spaeter reines Anzeigeelement | Anzeige von Kurz-/Langtext |
| `restarbeitenV2.main.verortung` | wird spaeter reines Anzeigeelement | Anzeige von Verortung/Bereich |
| `restarbeitenV2.main.meta` | bleibt offen / fachlich zu klaeren | Status-/Ampellogik fachlich final abzugrenzen |
| `restarbeitenV2.footer` | bleibt im Editor-Kontext | Ziel-UI-Bereich Footer/Kontext |
| `restarbeitenV2.footer.kurztext` | bleibt offen / fachlich zu klaeren | entweder reine Anzeige oder separater Fachmodus |
| `restarbeitenV2.footer.langtext` | bleibt offen / fachlich zu klaeren | entweder reine Anzeige oder separater Fachmodus |
| `restarbeitenV2.footer.verortung` | bleibt offen / fachlich zu klaeren | entweder reine Anzeige oder separater Fachmodus |
| `restarbeitenV2.footer.meta` | bleibt offen / fachlich zu klaeren | entweder reine Anzeige oder separater Fachmodus |
| `restarbeitenV2.footer.fotos` | wird spaeter reines Anzeigeelement | Foto-/Anlagenbereich nur Anzeige, kein Upload |
| `restarbeitenV2.footer.notiz` | bleibt offen / fachlich zu klaeren | entweder reine Anzeige oder separater Fachmodus |

### Klare Leitplanken
- `Neu` wird nicht einzeln repariert; bleibt als Symptom einer Fachaktion dokumentiert.
- Fachaktives Anlegen gehoert spaeter nur in separaten Fachmodus, nicht in den Editor.
- Fachaktive Filter werden spaeter klar von reiner Ansichtssteuerung getrennt.
- Footer-Eingaben werden spaeter entweder reine Anzeigeelemente oder in separaten Fachmodus verschoben.
- Foto/Upload bleibt keine Editor-Aktion.
- Diktat bleibt keine Editor-Aktion.
- Editor darf Darstellung aendern, aber keine Fachdaten.

### Empfohlener naechster technischer Schritt
- M19.8: Registry-Kategorien technisch vorbereiten und Doku-Guardrail absichern.
  - Fokus: reine Vorbereitungsmarkierungen/Vertragsklarheit ohne UI-Umbau.
  - Kein Aktivierungsschritt, kein Fachaktions-Fix.
