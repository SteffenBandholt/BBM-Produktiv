# Gate B – Core bereit

Stand: 2026-09-06, Core-Paket 8 zu #271 / Gesamtplan #277.

## Ergebnis

**Gate B ist erfuellt.** Neue bzw. reaktivierte Fachmodule koennen ohne neuen Core-Sonderfall registriert, global oder projektbezogen geoeffnet, aus dem aktiven Modulset navigiert, lizenziert, per Fach-IPC aktiviert und mit eigenen Migrationen eingebunden werden.

## Kriteriennachweis

| Kriterium aus #277 | Nachweis | Ergebnis |
| --- | --- | --- |
| Module ohne Core-Sonderfall registrierbar | kanonischer Deskriptorvertrag; keine Modul-ID-Verzweigung im generischen Router/Main | erfuellt |
| globale und projektbezogene Module generisch oeffnbar | `moduleRouteRuntime`; global/project/hybrid; Rechnung hybrid ohne Projektkontext | erfuellt |
| Modulnavigation aus aktivem Modulset | aktive Katalogauflösung; unlizenzierte Rechnung liefert kein aktives Modul | erfuellt |
| Lizenz/Capabilities konsistent | getrennte `module:*`- und `service:*`-IDs aus einer kanonischen Registry | erfuellt |
| Fach-IPC modular registriert | aktive Module registrieren ausschließlich ihren Deskriptor-Registrar | erfuellt |
| Fachmigrationen modular registriert | modulbezogene Registrare in gemeinsamer SQLite-Datei; Bestandsdaten bleiben erhalten | erfuellt |
| Core ohne Protokolltabellen/-fachlogik | Core-Schema ohne `meetings`, `tops`, `meeting_tops` und ohne Fachmodule getestet | erfuellt |
| PDF/Mail/Export fachneutral anschliessbar | neutrale Providervertraege, Mehrmodulauflösung und Capability-Prüfung | erfuellt |

Die zusaetzliche P0-Vorgabe `LicenseSubject != OwnOrganization` ist ebenfalls erfuellt.

## Automatisierte Regression

- `gateBRegression.test.cjs`: 9/9 gruen.
- Core-Pakete 4 bis 7: 25/25 gezielte Paketpruefungen gruen.
- Restarbeiten-Datenmodell, zentrale Rechnungskunden, FirmDirectory und Projektfirmen-Core: 37/37 gruen.
- Routing-/Navigation und Modulvertrag: alle Kriterienpruefungen gruen.
- Vollregression `npm test`: 0/10 Gruppen, aber keine neue Fehlerklasse gegenueber der dokumentierten Baseline.

## Baselineabgrenzung

Die neun bekannten roten Einzeltests bleiben:

1. `meetingTopsRepo` – Test-DB-Mock besitzt kein `db.transaction`; der Fehler laeuft ueber die bestehende `invoiceMigrations`-Initialisierung.
2. Drei bestehende Popup-Standard-Erwartungen.
3. `moduleAccessState` – fehlende `ui-editor-kit`-Artefakte/-Module.
4. Historische APP/PDF/MAIL/EXPORT-Alias-Erwartung.
5. Historische FeatureGuard-Standardfeature-Erwartung.
6. Development-License-Diagnostic-Modulliste.
7. Development-License/MainHeader-Kennzeichnung.

Weitere Gruppen brechen beim Laden fehlender `ui-editor-kit`-Artefakte ab. Diese Fehler waren vor den Core-Paketen vorhanden, sind in #271 dokumentiert und wurden durch Paket 8 weder veraendert noch als neuer Paketfehler bewertet.

## Scopegrenze

Gate B gibt den Core-Vorbau frei. Es meldet keine SiGeKo-Fachentwicklung, keine Rechnungsfachintegration, keine Bereinigung der bekannten Testbaseline und kein Release-/Windows-Installer-Gate als abgeschlossen.
