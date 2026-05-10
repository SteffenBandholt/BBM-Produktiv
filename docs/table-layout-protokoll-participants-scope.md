# Tabellenlayout-Scope: Teilnehmer im Protokoll

Status: fachlich geprüft, noch nicht im Editor registriert

## 1. Ausgangslage

Der naechste moegliche Tabellenlayout-Kandidat nach `protokoll_tops` wurde auf die fachliche Teilnehmerdarstellung im Protokollkontext untersucht.

Wichtig:

- noch kein produktiver Anschluss
- keine Drucklogik geaendert
- keine PrintModal-/Druckarten-Aenderung
- kein PDF-Anschluss
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

## 6. Empfohlener tableKey

Empfohlener Kandidat, falls die Tabelle spaeter angeschlossen wird:

- `tableKey: protokoll_participants`

Alternative, falls eine noch naehere technische Anlehnung an den bestehenden IPC-/DB-Begriff bevorzugt wird:

- `meeting_participants`

Empfehlung fuer den Layout-Editor:

- **`protokoll_participants`** als Layout-Key

Begruendung:

- fachlich klar im Protokollmodul verortet
- nicht mit der physischen DB-Tabelle verwechselt
- sauber in die bestehende Registry-Struktur `moduleId + tableKey + orientation` integrierbar

## 7. Empfohlene erste Umsetzung

Wenn dieser Kandidat spaeter angegangen wird, dann nur in kleinen Schritten:

1. Registry-Eintrag fuer die Teilnehmerliste anlegen.
2. Erst die Drucktabelle als Layoutkandidat behandeln.
3. UI-Anschluss nur dann, wenn die Teilnehmerdarstellung als isolierte Tabelle im Dialog sauber berechenbar ist.
4. PDF zunaechst nur als Vorschau.
5. Erst danach pruefen, ob die duale Modal-Ansicht von denselben Layoutwerten profitieren soll.

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

- **fachlich gepr?ft, aber noch nicht im Editor registriert**
- **eine spaetere Aufnahme darf nur nach Nutzerfreigabe und mit den sichtbaren Spalten erfolgen**
- **nicht sofort als naechster Produktiv-Pilot**
- **erst weiterer Scope / Feinscope noetig**

Warum:

- die Drucktabelle ist zwar klarer als viele Verwaltungslisten
- die UI ist aber als Teilnehmer-/Kandidaten-Modal komplexer und weniger tabellarisch isoliert
- fuer den naechsten kleinen Tabellenlayout-Schritt ist daher eine noch klarer getrennte Tabelle risikoaermer

Wenn die Teilnehmerliste spaeter als Layoutkandidat gestartet wird, ist sie fachlich gut geeignet. Fuer den naechsten unmittelbaren Pilot ist sie aber eher ein **spaterer Kandidat** als der erste naechste Schritt.

