# BBM – Revisionsabschluss / Gesamtplan

Stand: 06.09.2026

Verbindliche GitHub-Grundlagen: #268, #269, #271, #272, #273, #274, #275, #276 und #277.

## 1. Zielbild

BBM wird nicht neu gebaut. Der vorhandene produktive Bestand wird kontrolliert konsolidiert.

```text
BBM-Plattform
├─ Core / gemeinsame Domänen
├─ gemeinsame technische Dienste
├─ Fachmodule
│  ├─ Protokoll
│  ├─ Restarbeiten
│  ├─ Rechnung
│  ├─ SiGeKo
│  └─ Pläne
└─ Clients
   ├─ Desktop / Electron
   └─ BBM Mobil
```

Grundregel:

```text
Fachmodul -> Core / gemeinsame Dienste
Client -> Core-/Fachmodul-Anwendungsgrenzen
```

Nicht zulässig sind Core-Abhängigkeiten von Fachlogik, zweite Projekt-/Firmen-/PDF-/Mail-Grundarchitekturen in Fachmodulen oder direkter Mobilzugriff auf SQLite, Electron-IPC oder Renderer.

## 2. Prioritäten

### P0 – Core-Konsolidierung
Führend: #271.

Zuerst abschließen:
- kanonische Modul-/Capability-IDs
- Modulregistry / Moduldeskriptoren
- generischer globaler und projektbezogener Modulstart
- Core- und Modulnavigation
- Projektfirmen als Core-Funktion
- Lizenz-/Capability-Trennung
- modulbezogene IPC-Registrierung
- modulbezogene DB-Migrationsregistrierung
- Core-DB-Prüfung ohne Protokollpflicht
- fachneutrale PDF-/Mail-/Export-Providergrenzen
- Identitätsgrenze `LicenseSubject != OwnOrganization`

P0 ist der kritische Pfad. Neue Module dürfen diesen Stand nicht durch lokale Ersatzarchitekturen umgehen.

### P1 – vorhandene produktive Module stabilisieren / integrieren

**Restarbeiten #273**
- Foto-UI an vorhandene Attachment-API anbinden
- Haupt-Ladefehler sauber behandeln
- tote lokale Preview-Logik entfernen
- Notiz-Druck an gemeinsamen Druckweg anbinden bzw. UI korrekt kennzeichnen
- `restarbeitenV2` nur nach Import-/Runtime-/Testnachweis bewerten
- vollständige Regression

**Protokoll #272**
- produktiven Pfad `modules/protokoll` vs. `tops` nachweisen
- protokollspezifische Settings sauber besitzen/namespacen
- PDF/Mail über gemeinsame technische Dienste führen
- Teilnehmer/Verteiler von allgemeinen Stammdaten getrennt halten
- Legacy nur nach Nachweis bereinigen

**Rechnung #275**
Nach ausreichendem P0-Core-Vorbau:
- vorhandenen Rechnungsbestand selektiv bergen
- Identitäten, Snapshots und Buchungsimmutabilität härten
- Fachworkflow stabilisieren
- PDF/Mail/Export über gemeinsame Provider
- erst danach ZUGFeRD / E-Rechnung / GAEB

### P2 – SiGeKo end-to-end
Führend: #274 und #250–#260.

```text
S1 Modulrahmen
 -> S2 Projekterweiterung + Grunddaten
 -> S3 Übersicht / Readiness
 -> S4 Behörden / Notfall / Versorger
 -> S5 Vorankündigung
 -> S6 SiGePlan V1
 -> S7 Begehungen / TOPs / Fotos / Bericht
 -> S8 Übergabe an Restarbeiten
 -> S9 Mail / Outlook / Abschluss
```

Keine allgemeine KI-, Recherche-, Termin-, Historien- oder Mobilplattform vorziehen.

### P3 – BBM Mobil / Sync / Offline
Führend: #276.

```text
M0 Architekturvertrag
 -> M1 fachneutraler Sync-Unterbau
 -> M2 Restarbeiten-Pilot
 -> M3 Pilot härten
 -> M4 weitere Module
```

M0 entscheidet vor Implementierung Host-/Netzmodell, Authentisierung, Autorisierung, Transport, Versionierung, Offline-Queue, Konflikte, Idempotenz, Media-Transport und lokale Datensicherheit.

Restarbeiten bleibt erster Mobilpilot.

## 3. Verbindliche Umsetzungsreihenfolge

### Phase A – Ausgangsbasis sichern
1. `main` als Produktivbasis verwenden.
2. relevante Branches/PRs vor jedem Integrationspaket prüfen.
3. Baseline-Tests und bekannte Altfehler dokumentieren.
4. keine ungeprüfte Massenübernahme aus Altbranches.

### Phase B – Core-Vorbau #271
1. Modul-/Capability-Vertrag
2. Router / Navigation
3. Projektfirmen-Core
4. IPC-Registrierung
5. Migrationsregistrierung
6. Providergrenzen PDF/Mail/Export
7. OwnOrganization-Identitätsgrenze
8. Core-/Modulkombinationen regressionsprüfen

**Gate B:** Fachmodule können ohne Core-Sonderfall registriert, geöffnet, lizenziert und migriert werden.

### Phase C – bestehende Module bereinigen
- Restarbeiten gezielt schließen
- Protokoll Besitz-/Legacy-Punkte bereinigen
- keine funktionierende Fachlogik neu implementieren

### Phase D – Rechnung integrieren
- Bestand bergen
- Identitäten/Snapshots
- Fachworkflow
- PDF/Mail/Export
- E-Rechnung/ZUGFeRD/GAEB

### Phase E – SiGeKo umsetzen
- S1 bis S9 gemäß #274
- Übergabe an Restarbeiten erst nach stabiler Restarbeiten-Anwendungsgrenze

### Phase F – Mobil M0/M1
Erst nach tragfähigen Desktop-/Core-Anwendungsgrenzen.

### Phase G – Restarbeiten-Mobilpilot
- M2 Pilot
- M3 Härten
- danach weitere mobile Fachmodule

### Phase H – Produktionshärtung
Nach jedem größeren Paket und vor Auslieferung:
- Bestands-DB-Migration
- Modul-Kombinationen
- Berechtigungen/Lizenz
- PDF/Mail/Export
- Windows Packaging/Installer-Smoke-Test
- Regression bestehender produktiver Module

## 4. Abhängigkeiten

| Bereich | Hauptabhängigkeit | Kritische Blockade |
|---|---|---|
| Core #271 | #268/#269 | keine vorgelagerte technische Blockade |
| Protokoll #272 | #269/#271 | Core-Sonderfallbereinigung |
| Restarbeiten #273 | #269/#271 | Projektfirmen/Provider teilweise |
| Rechnung #275 | #271 | Modul/IPC/Migration/Identität |
| SiGeKo #274 | #271 + Core-Domänen | Modulrahmen, Migrationen, Provider |
| SiGeKo -> Restarbeiten | #273 + #274 | stabile Import-/Application-Grenze |
| Mobil #276 | #269/#271 + Pilotmodul | M0-Entscheidungen |
| Mobil Restarbeiten | #273 + M1 | Sync-/Media-Unterbau |

## 5. Offene Risiken

1. **Core bleibt Protokoll-zentriert.** Gegenmaßnahme: #271 als echtes Gate behandeln.
2. **Altbranches bringen veraltete Infrastruktur zurück.** Gegenmaßnahme: Fachcode selektiv bergen, `main` als Integrationsbasis.
3. **Legacy wird zu früh gelöscht.** Gegenmaßnahme: Import-/Runtime-/Test-/Branch-Nachweis vor Entfernung.
4. **Rechnungsidentitäten werden vermischt.** Gegenmaßnahme: LicenseSubject, OwnOrganization, InvoiceIssuerProfile und Beleg-Snapshots strikt trennen.
5. **Fachmodule bauen zweite gemeinsame Dienste.** Gegenmaßnahme: gemeinsame Provider, Fachinhalt bleibt im Modul.
6. **Mobil wird zu früh technisch festgelegt.** Gegenmaßnahme: M0 vor Sync-/App-Bau.
7. **Migrationen funktionieren nur auf leerer DB.** Gegenmaßnahme: Bestands-DB als Pflichtprüfung.
8. **PDF/Mail/Export bleiben fachlich mit Protokoll vermischt.** Gegenmaßnahme: technische Dienste neutralisieren.
9. **SiGeKo wird überladen.** Gegenmaßnahme: S1–S9 strikt einhalten.
10. **Zu viele parallele Großbaustellen.** Gegenmaßnahme: Integrationsphasen und Gates einhalten.
11. **Pläne wurden in Revision 03–07 nicht separat detailrevidiert.** Vor größeren Pläne-Arbeiten Core-Abgleich durchführen; vorhandene Pläne-Projektsteuerung bleibt gültig.
12. **Packaging/Installer nur indirekt abgesichert.** Nach größeren Integrationsstufen reale Windows-/NSIS-Abnahme durchführen.

## 6. Verbindliche Gates

### Gate B – Core bereit
- Module ohne Core-Sonderfall registrierbar
- globale und projektbezogene Module generisch öffnbar
- Navigation aus aktivem Modulset
- Lizenz/Capabilities konsistent
- Fach-IPC modular registriert
- Fachmigrationen modular registriert
- Core ohne Protokolltabellen/-fachlogik lauffähig
- PDF/Mail/Export fachneutral anschließbar

### Gate D – Rechnung integrationsbereit
- Identitätsvertrag umgesetzt
- Snapshots/Immutabilität gesichert
- Bestandsmigration geprüft
- vorhandene Rechnungstests als Regressionbasis aktiv

### Gate E – SiGeKo integrationsbereit
- Modulrahmen stabil
- `geplanter_baubeginn` sauber in Core-Projektdomäne integriert
- Fachmigrationen auf Bestands-DB
- PDF/Speicher/Mail-Grenzen nutzbar

### Gate F – Mobil M0 abgeschlossen
- Host/Netzmodell entschieden
- AuthN/AuthZ entschieden
- Sync-/Versionsvertrag entschieden
- Konflikt-/Idempotenzregeln entschieden
- Offline-/Queue-Modell entschieden
- Media-Transport entschieden
- lokale Datensicherheit entschieden

## 7. Nächster verbindlicher Arbeitsauftrag

**Als nächstes #271 umsetzen.**

Parallel zulässig, solange keine P0-Infrastruktur dupliziert wird:
- Restarbeiten Foto-/Load-/Legacy-Bereinigung
- Protokoll Import-/Runtime-/Settings-Nachweise
- Rechnung Bestandsinventar ohne Integration
- SiGeKo fachliche Vorbereitung ohne Parallel-Core
- Mobil M0-Fragen vorbereiten, aber noch keinen Sync-Unterbau implementieren

## 8. Revisionsabschluss

Die Revision 01–07 ist mit #277 konsolidiert.

Ab jetzt gelten:
- #269 als Core-/Besitzgrenze,
- #271 als technischer P0-Auftrag,
- #272–#276 als Fachmodul-/Clientgrundlagen,
- #277 und dieses Dokument als verbindliche Gesamtpriorisierung, Abhängigkeits- und Umsetzungsreihenfolge.
