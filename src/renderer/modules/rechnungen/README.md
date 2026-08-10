# Rechnungen · UI-Designreferenz

Das Modul ist ein ausschließlich in DEV sichtbarer Design-Dummy. Es verwendet
nur die statischen Beispieldaten aus `demoData.js`: keine Datenbank, keine
Berechnung, keine Speicherung, keine Rechnungs-/ZUGFeRD-/GAEB- oder PDF-Logik.

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

Die Rechnungsübersicht ist eine nicht-fachliche Dummy-Tabelle und wird bewusst
nicht in den Tabellenlayout-Editor aufgenommen (`editorEnabled: nein`). Auch
das übrige Modul ist kein UI-Editor-Ziel.
