# Rechnungen · Entwicklungsstand und UI-Vertrag

> Aktueller verbindlicher Modulstand ist **RE-S1.2a (18.09.2026)** im
> gleichnamigen Abschnitt dieses Dokuments: 140 Ziele, 21 Buttons und
> integrierte Positionsdetails. Die vorhergehenden Beschreibungen der
> entfernten Editbox und des 87-Ziele-Stands sind historisch.
>
> **Entwicklungspause:** Die fachliche Nutzerabnahme ist noch nicht erfolgt.
> Der letzte manuelle Test zeigte sichtbare Darstellungsfehler; dieser Stand
> enthält keine danach nachgewiesene Reparatur oder erneute visuelle Freigabe.

Das Modul ist ausschließlich in DEV sichtbar. `RechnungScreen` ist der echte,
an den vorhandenen Rechnungs-API-Pfad angebundene Arbeitsscreen;
`RechnungenDesignScreen` bleibt die historische statische Designreferenz.

Der Rechnungsscreen zeigt Rechnungsgrunddaten, Belegkopf, Bau-LV, Summen,
Zahlungstext und Ausstellerdaten. Kunden stammen aus der vorhandenen zentralen
Kundenquelle. PDF/Druck, Buchung, Autosave und Rechnungsberechnung bleiben in
ihren vorhandenen Fachpfaden.

## Aktueller Zustand ohne RechnungsEditbox

Die verworfene alte RechnungsEditbox ist ersatzlos entfernt. Es gibt im
produktiven RechnungScreen keine Editbox-DOM-Struktur, keinen reservierten
unteren Slot, kein Overlay, keinen Positionseditor und keinen Editbox-Schalter.
Das Rechnungsblatt beziehungsweise die LV-Liste belegt den verbleibenden
Screenbereich ohne Restfläche.

Positionsdaten und die vorhandenen fachlichen Positionsfunktionen bleiben im
Modul erhalten. Der aktuelle Screen stellt dafür bewusst nicht die alte
Eingabebox und keine technische Ersatzoberfläche bereit. Ein künftiger neuer
Rechnungseditor benötigt eine eigene bestätigte UI-Entwurfsentscheidung.

Der gemeinsame fachneutrale Editbox-/Workbench-Core bleibt für Protokoll und
andere vorhandene Verbraucher bestehen. Rechnung ist kein Verbraucher dieses
Cores mehr und besitzt keine Rechnungs-spezifische Adapter-, Ref-, Reflow- oder
Profilmigration dafür.

## UI-Editor-Status

Der Scope `rechnung.screen` besitzt exakt 87 explizite, komponentennahe
Einzelziele und neun registrierte Buttons. Die vollständige Registryquelle ist
`RechnungScreen.uiEditorContract.js`.

Alle verbleibenden Rechnungsziele folgen dem ungebundenen Geometrievertrag.
Der UI-Editor darf ausschließlich Layout und Darstellung bearbeiten.
Fachaktionen wie freie Rechnung, Kundenauswahl, Speichern, Proberechnung,
Buchen, Löschen und Schließen bleiben gesperrt und dürfen durch eine
Layoutoperation nicht ausgeführt werden.

Die aktive UI-/PDF-Entwurfsentscheidung steht in
`docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md`.

## Fachliche Grenzen

- Keine zweite Kundenverwaltung.
- Keine Änderung an Positionsdaten, Menge/Nachkommastellen, Einheit/Preis,
  Brutto/NEP/MwSt. oder Summenberechnung.
- Keine Änderung an Autosave, Buchung, Navigation, Sidebar oder Actionbar.
- Keine Änderung an PDF, Druck oder V2-Satzvertrag.
- Keine Wiederherstellung oder Migration alter Editbox-Geometrie.

# RE-S1.2a - aktueller Stand (18.09.2026)

Der Scope `rechnung.screen` besitzt jetzt exakt 140 statische, komponentennahe
Einzelziele und 21 registrierte Buttons. Die fruehere Formulierung
"87 explizite" ist historisch und ueberholt.

Freie Rechnungsentwuerfe bieten im normalen Dokumentfluss eine
Positionswerkzeugleiste und integrierte Positionsdetails. Titel und freie
Leistungen lassen sich anlegen, bearbeiten, loeschen und ueber den vorhandenen
Klick-Ziel-Ablauf verschieben. Der bestehende Leistungskatalog wird ueber einen
eigenen Dialog durchsucht; eine Mehrfachauswahl wird als unabhaengige Kopien in
den Entwurf uebernommen. NEP speichert alle Positionswerte unveraendert und
nimmt die Position nur im eingeschalteten Zustand aus Netto, Umsatzsteuer und
Brutto heraus.

Die alte RechnungsEditbox bleibt entfernt: keine alte DOM-Huelle, kein fester
Editbox-Slot, kein Editbox-Overlay, kein Workbench-/Toggle-Ablauf und keine
HostAdapter-Sonderlogik. Der freigegebene Katalogauswahldialog und der neue
Container `rechnung.editor.positionDetails` gehoeren ausschliesslich zu
RE-S1.2a. PDF, Druck, Buchung und Nummernkreis bleiben unveraendert.

Die vorhergehenden Zustandsbeschreibungen dokumentieren fruehere Zwischenstaende
und ersetzen diesen aktuellen Abschnitt nicht.

Die aktuelle Navigationssuite umfasst Bauvorhaben, Betreff, integrierte
Positionsdetails und die heutigen Positionsaktionen. Ein reales Chromium-Harness
prüft alle 21 registrierten Rechnungsbuttons. Für die fachliche Nutzerabnahme
stellt `scripts/runRechnungReS12aAcceptance.cjs --manual` einen ausschließlich
temporären Testdatenbestand bereit; Buchung und PDF-Ausgabe sind darin gesperrt.
Der vollständige Repository-Test bleibt wegen dokumentierter fremder Baselines
rot und wurde nicht erneut ausgeführt. Bei Wiederaufnahme sind zuerst die
sichtbaren Darstellungsfehler im isolierten Handtest zu erfassen. Anschließende
Gestaltungsarbeit soll von Codex selbst entworfene Test-UIs als Vorlage nutzen:
kompakte Felder, Blau/Grau/Weiß und klare Gliederung. Im Sicherungslauf wurde
weder gestaltet noch repariert.
