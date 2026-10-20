# Rechnungen · Entwicklungsstand und UI-Vertrag

Das Modul ist ausschließlich in DEV sichtbar. `RechnungScreen` ist der echte,
an den vorhandenen Rechnungs-API-Pfad angebundene Arbeitsscreen;
`RechnungenDesignScreen` bleibt die historische statische Designreferenz.

Der Rechnungsscreen zeigt Rechnungsgrunddaten, Belegkopf, Bau-LV, Summen,
Zahlungstext und Ausstellerdaten. Kunden stammen aus der vorhandenen zentralen
Kundenquelle. PDF/Druck, Buchung, Autosave und Rechnungsberechnung bleiben in
ihren vorhandenen Fachpfaden.

## Aktueller Zustand mit gemeinsamer LeistungsEditbox

Die Rechnung verwendet wieder den bereits am 30.08.2026 erreichten gemeinsamen
Editbox-/Workbench-Unterbau. Maßgeblicher historischer Stand ist Commit
`b80bd8dcda` („Rechnung auf gemeinsame Editbox-Basis umstellen“).

Die Rechnung besitzt keine zweite eigene Editbox. Sie bindet den gemeinsamen
`SharedEditboxCore` und `WorkbenchShellFrame` ausschließlich über
`RechnungLeistungsEditboxBinding` an ihre Positionsfachlogik an.

Enthalten sind Kurz-/Langtext, Menge mit 0 bis 4 Nachkommastellen, Einheit,
Einzelpreis, Positionsart, NEP, Titel/Position anlegen, Löschen/Schieben und
rechnungsspezifische Metadaten. Bruttoeingaben werden verlustfrei über
`price_input_cents` wieder angezeigt.

Gebuchte Rechnungen und positionsgebundene `FROM_ORDER`-Rechnungen bleiben
gegen Positionsänderungen geschützt. Customer-`customerId`, Kundensnapshot,
OwnOrganization, Buchung, PDF und Druck bleiben unverändert.

Der Leistungskatalog ist aus der Rechnungsübersicht und aus der
Kundenverwaltung erreichbar; beim Schließen wird in die jeweilige
Ausgangsansicht zurückgekehrt.

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
