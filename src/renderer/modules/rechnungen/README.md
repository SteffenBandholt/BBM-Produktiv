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

## Lokale Design-Tokens

Die zentrale Quelle ist `styles/rechnungenDesign.css`. Alle Tokens sind auf
`.bbm-invoice-design` und `.bbm-invoice-design-modal` begrenzt.

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
