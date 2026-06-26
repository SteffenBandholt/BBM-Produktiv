# M26 UI-/PDF-Entwurfsentscheidung: Restarbeiten Nachpflege

## A. Art der Ausgabe

- UI
- Keine PDF-Aenderung

## B. Editorfaehigkeit

- editorfaehig: nein
- Begruendung: M26 verbessert ausschliesslich die fachliche Sichtbarkeit unvollstaendiger Restarbeiten im BBM-Fachmodul. Es entstehen keine neuen editorfaehigen Elemente und keine neue UI-Editor-Funktion.

## C. Editorfaehige Elemente

M26 legt keine neuen editorfaehigen Elemente an.

Bestehende Restarbeiten-Elemente und ihre Registry-Struktur bleiben unveraendert. Die Pflichtfeldhinweise sind fachliche Validierungs-/Nachpflegeanzeigen und keine Editor-Ziele.

## D. Nicht editorfaehige Elemente / verbotene Editor-Ziele

Nicht editorfaehig und nicht Ziel von M26 sind:

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
- Nachpflegehinweise fuer vorhandene Datensaetze

## E. Parent-/Strukturregel

M26 registriert keine neuen editorfaehigen Elemente und legt keine neue Parent-Struktur fuer den UI-Editor an.

Falls bestehende Restarbeiten-Elemente angezeigt werden, gelten weiterhin die vorhandenen Registry-Parents. Sichtbare Nachpflegehinweise sind kein neues Editor-Ziel.

## F. Pruef-/Testangabe

- Fachliche M26-Regeln werden ueber Restarbeiten-Tests abgesichert.
- Bestehende UI-Editor-Vertragstests bleiben unveraendert.
- Es gibt fuer diese fachliche UI-Markierung keinen neuen separaten UI-Editor-Vertragscheck, da keine neue Registry und kein neues editorfaehiges Element eingefuehrt wird.
