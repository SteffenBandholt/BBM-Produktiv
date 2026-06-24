# M25 UI-/PDF-Entwurfsentscheidung: Restarbeiten Pflichtfelder, Status und Ampel

## A. Art der Ausgabe

- UI
- Keine PDF-Aenderung

## B. Editorfaehigkeit

- editorfaehig: nein
- Begruendung: M25 sichert fachliche Pflichtfeld-, Status- und Ampelregeln im BBM-Fachmodul Restarbeiten ab. Es entstehen keine neuen editorfaehigen Elemente und keine neue UI-Editor-Funktion.

## C. Editorfaehige Elemente

M25 legt keine neuen editorfaehigen Elemente an.

Bestehende Restarbeiten-Elemente bleiben in ihrer bestehenden Registry-Struktur. Die sichtbare Pflichtfeldvollstaendigkeit nutzt vorhandene Restarbeiten-UI-Bereiche und fuehrt keine neue Editor-Operation ein.

## D. Nicht editorfaehige Elemente / verbotene Editor-Ziele

Nicht editorfaehig und nicht Ziel von M25 sind:

- Fachaktionen
- Speichern
- Anlegen
- Loeschen
- Upload
- Import
- Autosave
- fachliche IPC-/Datenaktionen
- Datenbankaktionen
- Statuswechsel als fachliche Aktion
- Ampelberechnung
- Pflichtfeldvalidierung

## E. Parent-/Strukturregel

M25 registriert keine neuen editorfaehigen Elemente. Es wird keine neue Parent-Struktur fuer den UI-Editor angelegt.

Falls bestehende Restarbeiten-Elemente angezeigt werden, gelten weiterhin die vorhandenen Registry-Parents. Die sichtbare fachliche Validierung ist kein neues Editor-Ziel.

## F. Pruef-/Testangabe

- Fachliche M25-Regeln werden ueber Restarbeiten-Tests abgesichert.
- Bestehende UI-Editor-Vertragstests bleiben unveraendert.
- Es gibt fuer diese reine fachliche UI-Markierung keinen neuen separaten UI-Editor-Vertragscheck. Es wird keine neue Editor-Registry und kein neues editorfaehiges Element eingefuehrt.
