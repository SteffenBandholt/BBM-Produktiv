# Rechnungen · Entwicklungsstand und UI-Vertrag

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
