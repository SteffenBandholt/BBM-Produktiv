# Protokoll-Revision #272

Stand: 2026-09-06, aufbauend auf Gesamtplan #277, abgeschlossenem Core #271 / Gate B
und abgeschlossener Restarbeiten-Stabilisierung #273.

## Ergebnis

**Revision #272 ist damit erfuellt.** Die vorhandene produktive Protokoll-Fachlogik bleibt
erhalten; ihre Besitzgrenzen zu Core und gemeinsamen technischen Diensten sind nachgewiesen.

| Revisionspunkt | Ergebnis | Integrierter Nachweis |
| --- | --- | --- |
| Produktiver Pfad | `modules/protokoll/index.js` ist der kanonische Einstieg; `renderer/tops/` bleibt erhaltener modulinterner Unterbau | PR #301, `db82d90` |
| Settings | globale und projektbezogene Protokollsettings besitzen einen gemeinsamen Modulvertrag und modulare IPC-Registrierung | PR #302, `269eafd` |
| PDF / Print | Fachflow bestimmt Dokumente und Kontext; `PdfDocumentService` führt nur gelieferte technische Operationen aus | PR #303, `0b5ec87` |
| Mailtransport | Outlook/mailto, Transportnormalisierung und technische Fehler liegen im gemeinsamen `MailTransportService` | PR #304, `280acba` |
| Mailpayload | Verteiler, Betreff/Text, Anhänge und Protokoll-PDF-Suche liegen im `ProtokollMailPayloadService` | PR #305, `e6bbb4f` |
| Teilnehmer / Verteiler | Core besitzt Stammdaten und Projektpool; Protokoll besitzt Besprechungsteilnahme, Anwesenheit und Verteiler | PR #306, `36759e8` |
| Legacy-Close-Flow | nur der import- und runtime-seitig unreferenzierte Parallelbestand wurde entfernt; nötige Re-Exports bleiben | PR #307, `51e023a` |
| Legacy-Settings | zwei aufruflose Altimplementierungen wurden entfernt; die produktiven Moduldelegationen bleiben | PR #308, `4e72710` |

## Kanonischer Runtime-Pfad

Modulkatalog und Router öffnen den Protokoll-Moduleinstieg. Dieser registriert den modulnahen
`TopsScreenIntegrationView`, der den erhaltenen produktiven TopsScreen erweitert.
`src/renderer/views/TopsScreen.js` ist ausschließlich ein Kompatibilitäts-Re-Export. Der tiefere
Bestand unter `src/renderer/tops/` ist kein konkurrierendes Fachmodul und wurde ohne funktionalen
Anlass nicht kosmetisch verschoben.

## Abschlussregression

- `protokollRevision272Regression.test.cjs`: 7/7 Kriterien grün.
- Sämtliche Paketnachweise zu Pfad, Settings, PDF, Mail, Teilnehmern und Legacy bleiben in der
  Gruppe `core-protokoll` registriert.
- Fachregressionen für Store, Selectors, Commands, CloseFlow, TOP-Hierarchie, ActionPolicy,
  Screen-Integration und den realen Protokoll-Acceptance-Pfad bleiben Bestandteil derselben Gruppe.
- Die vollständige Regression `npm test` endet weiterhin mit 0/10 grünen Gruppen, aber ohne neue
  Fehlerklasse gegenüber der vor #272 dokumentierten Baseline.

## Baselineabgrenzung

Unverändert bekannt sind:

1. `meetingTopsRepo`: Test-DB-Mock ohne `db.transaction` über die bestehende Rechnungs-Migrationsinitialisierung.
2. Fehlende `ui-editor-kit`-Artefakte bzw. -Module in mehreren Testgruppen.
3. Drei bestehende Popup-Standard-Erwartungen.
4. Historische Lizenz-/Alias-/FeatureGuard-Erwartungen.
5. Development-License-Modulliste und MainHeader-Kennzeichnung.

Diese Fehler wurden durch die Protokollpakete nicht erzeugt und nicht als Protokollfehler umklassifiziert.

## Scopegrenze

Nicht vorgezogen wurden Rechnungs-, SiGeKo- oder Mobil-Arbeiten. Es gab keinen Neuaufbau des
Protokolls, keine neue PDF- oder Mailengine, keine fachliche Änderung bestätigter TOP- oder
Besprechungsregeln und keine ungeprüfte Massenlöschung. Die in #272 als **SPÄTER** klassifizierte
tiefe Router- oder Strukturkonsolidierung bleibt ausdrücklich außerhalb dieses Abschlusses.
