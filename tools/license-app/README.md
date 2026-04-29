# license-app Übergangsbereich

## Zielarchitektur
- BBM prüft/importiert nur Lizenzen.
- Eine externe Lizenz-App erzeugt und verwaltet Lizenzen.
- Private Schlüssel liegen ausschließlich in der externen Lizenz-App.
- Das BBM-Kundensetup bleibt für alle Kunden einheitlich.

## Inhalt dieses Übergangsbereichs
Dieser Ordner sichert bestehende Bausteine für die spätere externe Lizenz-App, ohne sie in BBM weiter produktiv zu nutzen:

- `extracts/licenseAdminService.js`
  - bestehende Kunden-/Lizenzverwaltungslogik (Service-Schicht)
- `extracts/licenseRecords.js`
  - bestehende Normalisierung von Kunden-/Lizenzdatensätzen
- `extracts/licenseIpc.reference.js`
  - Referenzstand mit Generator-/Machine-Request-relevanter IPC-Logik als Extraktbasis

## Wichtige Grenzen
- Keine privaten Schlüssel in diesem Ordner.
- Keine erzeugten Lizenzdateien in diesem Ordner.
- Dieser Ordner ist ein Übergangs- und Sicherungsbereich für die Entkopplung.
