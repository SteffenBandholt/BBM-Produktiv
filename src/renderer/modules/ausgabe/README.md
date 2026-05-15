# Ausgabe / Drucken / E-Mail

Dieses Modul kapselt die rendererseitigen Einstiege fuer Ausgabe, Drucken und Mail-Anstoss.

Enthaltene Bausteine:
- `PrintModal`
- `sendMailPayload`

Hinweis:
- Die eigentliche PDF-, Druck- und Outlook-Technik bleibt im Main-Prozess.
- Das ist kein Sidebar-Modul und kein Eintrag im Modulkatalog.

Aktuell im Ausgabe-Dialog und Print-Pfad verankerte Ausgabearten:
- Protokoll drucken
- PDF-Vorschau öffnen
- Vorabzug
- Firmenliste
- ToDo-Liste
- TOP-Liste

Fachregel fuer die Listen:
- TOP-Liste zeigt alle TOPs der gewaehlten Projekt-TOPs, inklusive erledigter TOPs und aller TOP-Arten.
- ToDo-Liste zeigt projektweit nur noch offene echte ToDos.
- Der Verantwortlichenfilter gilt nur fuer ToDos.
- Firmen- und Mitarbeiter-/Personenlisten werden beim Druck immer aus dem aktuellen Projektstand zum Druckdatum erzeugt.
- Es gibt keine funktionale Auswahl gespeicherter Firmenlisten.
- Eine separate Mitarbeiter-/Personenliste ist im aktuellen Druckdialog noch nicht als eigener Modus vorhanden; falls sie spaeter wieder angeboten wird, gilt dieselbe Regel wie fuer die Firmenliste.

Der Einstieg `Drucken` oeffnet zuerst eine Auswahl der Druckarten; `Protokoll drucken` fuehrt danach in die gewohnte Auswahl geschlossener Protokolle.

Die Auswahl geschlossener Protokolle gilt nur fuer protokollbezogene Ausgaben.

Der Entwicklungsmodus `headerTest` bleibt technisch im Print-Pfad vorhanden, wird aber nicht als normale Ausgabearbeit im Dialog angeboten.
