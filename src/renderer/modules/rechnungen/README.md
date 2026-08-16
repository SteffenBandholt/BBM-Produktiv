# Rechnungen · Entwicklungsstand und UI-Vertrag

Das Modul ist ausschließlich in DEV sichtbar. Es enthält zwei klar getrennte
Stände:

- `RechnungenDesignScreen` bleibt die historische statische Designreferenz.
- `RechnungScreen` ist der echte, an den vorhandenen Rechnungs-API-Pfad
  angebundene Arbeitsscreen für Rechnungsgrunddaten und Belegkopf.

Positionen, Summen und PDF-Fachausgabe sind im echten Arbeitsscreen noch nicht
umgesetzt. Der Kundenpfad verwendet die vorhandene zentrale Kundenquelle; es
entsteht keine zweite Kundenverwaltung.

## UI-Editor-Status

Der echte `RechnungScreen` ist als Scope `rechnung.screen` mit 45 expliziten
Einzelzielen komponentennah registriert. Der Scope darf nur dann als `complete`
veröffentlicht werden, wenn Komponentenvertrag, gemountete Runtime-Refs, nativer
Typvertrag und Registry-Fingerprint gemeinsam grün sind.

Der UI-Editor darf ausschließlich Layout und Darstellung der registrierten
Elemente bearbeiten. Fachwerte und Fachaktionen bleiben gesperrt. Das gilt
insbesondere für `Freie Rechnung`, `Speichern`, `Proberechnung`,
`Rechnung buchen`, `Entwurf verwerfen`, `Schließen` und `Vorschau schließen`.

Die vollständige Entscheidung steht in
`docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md`.

Die Kundenauswahl bleibt als typisierte Referenz aus `kind`, `id`, optionalem
`projectId` und `label` im Screenzustand erhalten. Ohne Projekt werden nur globale
Kunden geladen; mit Projekt globale Kunden und lokale Kunden dieses Projekts.

## Referenzquellen

- `../UI-Editor-kit/reference-target-app`: WPF-Referenz
  „Auftragsverwaltung“ mit ruhigen Karten, kompakten 32-px-Controls,
  statusorientierter Tabelle und klarer blau-grauer Hierarchie.
- BBM `SettingsView`: helle Karten, zurückhaltende Verläufe, feine Borders und
  kompakte Aktionsflächen.
- BBM-Popup „Projekt bearbeiten“: dichte Feldgruppen, echte Zweizeiligkeit und
  scrollbarer Dialogkörper zwischen festem Header und Footer.

## Zentraler BBM-Standard

Die freigegebenen Werte liegen zentral in
`src/renderer/ui/styles/popupFormStandard.css` und sind in
`docs/BBM_POPUP_FORMULARSTANDARD.md` verbindlich dokumentiert. Das Modul aktiviert
den opt-in-Standard über `.bbm-popup-standard`; `styles/rechnungenDesign.css`
enthält nur noch die rechnungsspezifische Anordnung und verweist für die
gemeinsamen Werte auf die zentralen `--bbm-popup-*`-Tokens.

| Token | Wert |
| --- | --- |
| Canvas / Surface / Subtle | `#f3f5f8` / `#ffffff` / `#f8fafc` |
| Text / Muted | `#172033` / `#667085` |
| Primary / Hover | `#235a9f` / `#194a86` |
| Border / Border strong | `#d7dee8` / `#c5cfdd` |
| Focus | `#2563eb` plus 3-px-Ring |
| Input- / Card- / Dialogradius | `8px` / `12px` / `14px` |
| Inputhöhe / Buttonhöhe | `32px` / `30px` |
| Label / Control / Body | `11.5px` / `13px` / `13px` |
| Feld- / Gruppenabstand | `4px` / `10px` |
| Kartenpadding | `14px` |
| Dialogpadding | `12px 16px` |
| Dialog-Header / -Footer | mindestens `54px` / `50px` |

Die Rechnungsübersicht des echten Screens ist eine Karten-/Listengruppe und
keine Inhaltstabelle. Deshalb wird sie nicht in den Tabellenlayout-Editor
aufgenommen. Die statische Designreferenz bleibt ebenfalls außerhalb der
Tabellenlayout-Registry.
