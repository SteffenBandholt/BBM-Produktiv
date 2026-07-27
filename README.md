# BBM-Produktiv

## UI-Editor-kit Integration

BBM nutzt ab M51 das eigenständige `UI-Editor-kit` in Version `v0.2.0` als Ziel-App-Integration. Die technische Anbindung ist in [docs/M51_UI_EDITOR_KIT_V0.2.0_INTEGRATION.md](docs/M51_UI_EDITOR_KIT_V0.2.0_INTEGRATION.md) dokumentiert.

Ab M80 ist die produktführende Integration die Sidebar-Aktion `UI-Editor öffnen`: Sie verbindet die laufende Electron-App ausschließlich lokal mit dem vorhandenen separaten nativen Editor. Der Restarbeiten-Pilot nutzt explizite Registry/Refs, getrennte Labels/Felder, die bestätigte Hauptliste, neutrale Layoutänderungen, Sichtbarkeit und den vorhandenen Profil-/Rollbackweg. Fachaktionen und Fachwerte sind ausgeschlossen. Einstieg: [M80-HostAdapter](docs/M80_ELECTRON_HOSTADAPTER.md), [Pilotregistry](docs/M80_PILOT_REGISTRY.md), [Sicherheit/Diagnose](docs/M80_LIFECYCLE_SICHERHEIT_DIAGNOSE.md).

M80.1 ergänzt Registryversion und deterministischen Fingerprint, vollständige Scope-Inventare, Refresh vor jedem Öffnen/Fokussieren und bei Laufzeitereignissen sowie sicheren Profilabgleich. Nur die drei vollständig registrierten Restarbeiten-Scopes sind aktiv; alle weiteren noch nicht sicher inventarisierten BBM-Bereiche bleiben ausdrücklich gesperrt. Details: [M80.1-Bestands-App-Registrierung](docs/M80_1_BESTANDSAPP_REGISTRIERUNG.md).

M81 bindet die reale BBM-Protokoll-PDF über eine explizite 28-Element-Registry an den vorhandenen nativen M77-PDF-Arbeitsbereich an. BBM behält den bestehenden Paginierungs- und `printToPDF`-Fachweg; der Editor nutzt denselben PDF-Core, Profilweg, Readback und Rollback. Details: [M81-BBM-PDF-Adapter](docs/M81_BBM_PDF_ADAPTER.md).

Status M51: Core-Vertrag technisch angebunden und testbar; noch keine vollständige sichtbare Editor-Oberfläche und noch keine dauerhafte Layoutspeicherung.

## M52: Sichtbarer UI-Editor-Startpunkt

Ab M52 gibt es in BBM einen kleinen sichtbaren Einstieg `UI-Editor Status` in der bestehenden Navigation. Die Ansicht zeigt den Status der M51-Runtime, den aktiven Scope, das Layoutprofil, die explizit registrierten UI-Elemente und eine gepruefte Elementauswahl. Es ist noch keine vollstaendige Bearbeitung von Layout, Farben, Schrift, Drag-and-drop oder Resize. Details: [docs/M52_UI_EDITOR_SICHTBARER_STARTPUNKT.md](docs/M52_UI_EDITOR_SICHTBARER_STARTPUNKT.md).
