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
- Top-Liste (alle)
- Gespeicherte Firmenlisten

Der Einstieg `Drucken` oeffnet zuerst eine Auswahl der Druckarten; `Protokoll drucken` fuehrt danach in die gewohnte Auswahl geschlossener Protokolle.

Der Entwicklungsmodus `headerTest` bleibt technisch im Print-Pfad vorhanden, wird aber nicht als normale Ausgabearbeit im Dialog angeboten.
