# BBM-Produktiv

## UI-Editor-kit Integration

BBM nutzt ab M51 das eigenständige `UI-Editor-kit` in Version `v0.2.0` als Ziel-App-Integration. Die technische Anbindung ist in [docs/M51_UI_EDITOR_KIT_V0.2.0_INTEGRATION.md](docs/M51_UI_EDITOR_KIT_V0.2.0_INTEGRATION.md) dokumentiert.

Status M51: Core-Vertrag technisch angebunden und testbar; noch keine vollständige sichtbare Editor-Oberfläche und noch keine dauerhafte Layoutspeicherung.

## M52: Sichtbarer UI-Editor-Startpunkt

Ab M52 gibt es in BBM einen kleinen sichtbaren Einstieg `UI-Editor Status` in der bestehenden Navigation. Die Ansicht zeigt den Status der M51-Runtime, den aktiven Scope, das Layoutprofil, die explizit registrierten UI-Elemente und eine gepruefte Elementauswahl. Es ist noch keine vollstaendige Bearbeitung von Layout, Farben, Schrift, Drag-and-drop oder Resize. Details: [docs/M52_UI_EDITOR_SICHTBARER_STARTPUNKT.md](docs/M52_UI_EDITOR_SICHTBARER_STARTPUNKT.md).

## M53 UI-Editor Sichtbarkeitsentwurf
M53 erlaubt im bestehenden UI-Editor-Statuspanel erstmals kontrollierte Layoutaenderungen fuer registrierte BBM-Elemente. Der Umfang ist bewusst eng: nur `visible` true/false, nur als Entwurf, Apply/Discard/Load/Reset und nur im Sitzungsspeicher. Es gibt keine freie Layoutbearbeitung, keine Groessen-/Positions-/Styleaenderung und keine direkte DOM-Auswahl.
