# Rechnungen · Entwicklungsstand und UI-Vertrag

Das Modul ist ausschließlich in DEV sichtbar. `RechnungScreen` ist der echte,
an den vorhandenen Rechnungs-API-Pfad angebundene Arbeitsscreen;
`RechnungenDesignScreen` bleibt die historische statische Designreferenz.

Der Rechnungsscreen zeigt Rechnungsgrunddaten, Belegkopf, Bau-LV, Summen,
Zahlungstext und Ausstellerdaten. Kunden stammen aus der vorhandenen zentralen
Kundenquelle. PDF/Druck, Buchung, Autosave und Rechnungsberechnung bleiben in
ihren vorhandenen Fachpfaden.

## Aktueller Zustand mit Rechnungs-Editbox

Die kompakte Positions-Editbox ist wieder Bestandteil des produktiven
`RechnungScreen`. Sie arbeitet auf dem aktuellen Positionsmodell und wurde
nicht durch Rücknahme des heutigen Rechnungsstands hergestellt.

Enthalten sind Kurz-/Langtext, Menge mit 0 bis 4 Nachkommastellen, Einheit,
Netto-/Brutto-Preiseingabe, MwSt.-Anzeige, NEP, Titel/Position anlegen,
Löschen/Schieben sowie eine kompakte Netto-/MwSt.-/Brutto-Summenanzeige.

Gebuchte Rechnungen und positionsgebundene `FROM_ORDER`-Rechnungen bleiben
gegen Positionsänderungen geschützt. Customer-`customerId`, Kundensnapshot,
OwnOrganization, Buchung, PDF und Druck bleiben unverändert.

Der Leistungskatalog ist weiterhin aus der Rechnungsübersicht erreichbar und
zusätzlich direkt aus der Kundenverwaltung aufrufbar.

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
