# Tabellenlayout-Scope: Teilnehmer im Protokoll

Status: fachlich geprüft und im Editor registriert

## 1. Ausgangslage

Die fachliche Teilnehmerdarstellung im Protokollkontext ist als Inhaltstabelle fuer den Tabellenlayout-Editor freigegeben und registriert.

Wichtig:

- noch kein produktiver UI-/PDF-Anschluss
- keine Drucklogik geaendert
- keine PrintModal-/Druckarten-Aenderung
- PDF bleibt fuer diese Tabelle vorerst Vorschau
- keine Teilnehmerlogik umgebaut
- keine DB-Direktnutzung im Renderer

## 2. Fundstellen

Die Teilnehmerdarstellung existiert im Code an mehreren Stellen:

- `src/renderer/ui/ParticipantsModals.js`
- `src/main/ipc/participantsIpc.js`
- `src/main/print/printData.js`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/printApp.js`
- `src/renderer/modules/ausgabe/PrintModal.js`
- `src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js`
- `src/renderer/ui/MainHeader.js`

Fachlich relevant fuer die eigentliche Teilnehmerliste sind vor allem:

- die Besprechungs-/Teilnehmer-Auswahl im Renderer
- die Meeting-Teilnehmerdaten im Main-IPC
- die Teilnehmer-Tabelle im Druckweg

Die Teilnehmerdarstellung ist also vorhanden, aber nicht als einzelne, isolierte Tabellenansicht aufgebaut wie eine klassische Fachliste.

## 3. TatsÃ¤chliche Spalten

### 3.1 Teilnehmerdialog in der UI

In `src/renderer/ui/ParticipantsModals.js` und den zugehoerigen DatenpfaÂ­den wird die Besprechungs-Teilnehmerliste mit folgenden sichtbaren Spalten gefuehrt:

- Name
- Funktion / Rolle
- Firma
- Telefon
- E-Mail
- Anwesend
- Verteiler

Zusatzlogik im Dialog:

- links: Teilnehmer dieser Besprechung
- rechts: Personen im Projekt
- Anwesend und Verteiler sind Checkboxen
- Firmenstatus kann Teilnehmer sperren
- leerer Verteiler ohne E-Mail wird als Hinweis behandelt

### 3.2 Teilnehmerdruck

Im Druckweg ist die Teilnehmerliste als eigene Tabelle vorhanden:

- Name
- Funktion
- Firma
- Telefon
- E-Mail
- Anwesend
- Verteiler

Die Tabelle wird aus Meeting-Teilnehmerdaten erzeugt und im PDF-Layout als eigener Abschnitt gerendert.

## 4. Bewertung

### Fachliche Einordnung

Die Teilnehmerdarstellung ist fachlich vorhanden und klar benannt, aber sie ist kein sauber isolierter Fachlisten-Hauptbereich wie `protokoll_tops`.

Sie besteht aus:

- einem dualen Auswahl-/Bearbeitungsdialog
- einer Drucktabelle im Protokoll-/Ausgabeweg
- Meeting-Kontext und Projektkontext sind eng beteiligt

### Eignung fuer den Tabellenlayout-Editor

Bewertung:

- klare Spaltenstruktur: ja, im Druckweg
- stabile UI: nur teilweise, weil der Dialog stark interaktiv ist
- geringe Gefahr fuer Navigation: mittel
- kein Header/Footer-Risiko: ja, wenn nur die Teilnehmer-Tabelle angeschlossen wird
- kein kompletter Druckumbau noetig: ja, aber nur fuer den Druckteil
- keine Vermischung mit Firmenstamm: ja, wenn sauber auf Meeting-Teilnehmer begrenzt

Gesamtbewertung:

- **geeignet, aber nicht als naechster kleinster Pilot**

Begruendung:

- die Tabellenstruktur ist im Druckweg brauchbar
- die UI ist aber als duales Teilnehmer-/Kandidaten-Modal aufgebaut und damit weniger klar isoliert als eine einfache Fachliste
- fuer den naechsten Tabellenlayout-Schritt ist deshalb ein noch schmalerer, klarer Kandidat sinnvoller

## 5. Empfohlener moduleId

Empfehlung:

- `moduleId: protokoll`

Begruendung:

- die Teilnehmerdarstellung gehoert fachlich zum Protokollkontext
- sie ist an Besprechungen und Protokolle gebunden
- sie ist keine Firmenstamm- oder Projektverwaltungs-Tabelle

## 6. Registrierter tableKey

Registrierter Layout-Key:

- `tableKey: protokoll_participants`

Alternative, falls eine noch naehere technische Anlehnung an den bestehenden IPC-/DB-Begriff spaeter gewuenscht wird:

- `meeting_participants`

Empfehlung fuer den Layout-Editor:

- **`protokoll_participants`** bleibt der Layout-Key

Begruendung:

- fachlich klar im Protokollmodul verortet
- nicht mit der physischen DB-Tabelle verwechselt
- sauber in die bestehende Registry-Struktur `moduleId + tableKey + orientation` integrierbar

## 7. Empfohlene erste Umsetzung

Die erste Umsetzung ist bereits erfolgt:

1. Registry-Eintrag fuer die Teilnehmerliste anlegen.
2. Die Tabelle im Editor anzeigen.
3. UI- und PDF-Vorschau nur als Vorschau behandeln.
4. Einen produktiven UI-/PDF-Anschluss bewusst noch nicht herstellen.
5. Spaeter erst pruefen, ob die duale Modal-Ansicht von denselben Layoutwerten profitieren soll.

## 8. Abgrenzung

Klar nicht verwechseln mit:

- Projekt-Firmenliste
- Firmenstamm
- Personenverwaltung
- Druck-Teilnehmerliste als separater Ausgabeabschnitt
- normale Protokoll-TOP-Liste

### Projekt-Firmenliste

Die Projekt-Firmenliste ist bereits ein eigener Layout-Pilot und bleibt fachlich getrennt.

### Firmenstamm / Personenverwaltung

Das sind Verwaltungslisten mit eigener Fachlogik und nicht der Teilnehmerkontext des Protokolls.

### Druck-Teilnehmerliste

Die Drucktabelle ist zwar fachlich nah an der Teilnehmerdarstellung, aber die Teilnehmerdarstellung im UI-Modal ist ein gemischter Dual-List-Dialog und damit nicht identisch mit einer einfachen Tabellenansicht.

### TOP-Liste

Die TOP-Liste bleibt der Protokoll-Hauptkandidat fuer die bestehende Tabellenlayout-Struktur und darf nicht mit Teilnehmerdaten vermischt werden.

## 9. Empfehlung fuer den naechsten Schritt

Empfehlung heute:

- bereits im Editor registriert
- UI- und PDF-Anschluss bleiben vorerst Vorschau
- kein produktiver Teilnehmer-UI-/PDF-Anschluss
- keine weitere Registrierung oder Umbildung ohne neues Nutzerziel

Warum:

- die Tabellenspalten sind fachlich geklaert und bereits im Editor verfuegbar
- die UI ist als Teilnehmer-/Kandidaten-Modal komplexer und weniger tabellarisch isoliert
- der produktive Anschluss bleibt deshalb bewusst noch aus

Die Teilnehmerliste ist damit registriert, aber produktiv noch nicht angeschlossen.
