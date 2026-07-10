# M51 – BBM-Integration mit UI-Editor-kit v0.2.0

## Zweck
M51 bindet BBM-Produktiv als erste echte Ziel-App technisch an das eigenständige Produkt `UI-Editor-kit` im stabilen Stand `v0.2.0` an.

## Verwendete Version
- Paket: `ui-editor-kit`
- Abhängigkeit: `github:SteffenBandholt/UI-Editor-kit#v0.2.0`
- Release-Commit: `bb0804b318981a5d03a97cc3b2b5df7b1b96aabf`
- Einstieg: öffentliche Package-API, insbesondere `createTargetAppAdapterRuntime`

## Architektur
Die offizielle Kette für BBM lautet:

```text
BBM
-> AdapterManifest
-> HostAdapter
-> UI-Element-Registry
-> RuntimeLauncher
-> ViewModels
-> LayoutStateStore
```

BBM liefert nur Integrationsdaten und Host-Funktionen. Core-Logik des UI-Editor-kits wird nicht kopiert und nicht verändert.

## Dateien der BBM-Integration
- `src/ui-editor/bbm-ui-editor-manifest.cjs`
- `src/ui-editor/bbm-ui-element-registry.cjs`
- `src/ui-editor/bbm-host-adapter.cjs`
- `src/ui-editor/start-bbm-ui-editor-runtime.cjs`
- `scripts/tests/m51UiEditorKitIntegration.test.cjs`

## Verantwortung von BBM
BBM verantwortet:
- Ziel-App-ID und Manifestdaten
- explizit freigegebene UI-Elemente
- Scope-Zuordnung
- HostAdapter-Grenzen
- Auswahl registrierter Elemente
- neutralen LayoutStateStore für die Integrationsprüfung
- spätere Entscheidung über dauerhafte Layoutspeicherung

BBM verändert nicht:
- Fachlogik
- Aufgaben-, Mängel-, Projekt- oder Benutzerdaten
- PDF-, Druck-, Mail- oder Audio-Funktionen
- Datenbankstruktur oder Migrationen

## Verantwortung des UI-Editor-kits
Das UI-Editor-kit verantwortet den generischen Core-Vertrag und die Runtime-Erzeugung über die öffentliche API. BBM importiert keine internen Core-Dateien.

## Manifest
Das Manifest definiert:
- `targetAppId`: `bbm-produktiv`
- `adapterName`: `BBM UI-Editor Adapter`
- `contractVersion`: `ui-editor-kit@v0.2.0`
- `uiScope`: `bbm.main`
- `layoutScope`: `bbm.main-layout`
- `layoutProfileId`: `default`
- Capabilities für Registry, Scope-Prüfung, Auswahl, Layout-Lesen, Layout-Speichern, Layout-Reset und Status.

## Registry
Die Registry ist explizit und nicht automatisch befüllt. M51 registriert nur einen kleinen BBM-Hauptscope:

1. `bbm.main.shell` – BBM Hauptrahmen
2. `bbm.main.navigation` – Hauptnavigation
3. `bbm.main.header` – Seitenkopf
4. `bbm.main.content` – Inhaltsbereich
5. `bbm.main.actions` – Aktionsbereich

Jedes Kind-Element verweist auf einen vorhandenen Parent. Nicht registrierte Elemente existieren für den UI-Editor nicht.

## HostAdapter
Der BBM-HostAdapter stellt bereit:
- Registry lesen
- UI- und Layout-Scope validieren
- registriertes Element auswählen
- aktuellen UI-Status lesen
- LayoutState lesen
- LayoutState speichern
- LayoutState zurücksetzen
- neutrale Blockcodes bei unbekannten Scopes oder Elementen

Der HostAdapter führt keine Fachaktion aus und schreibt keine Fachdaten.

## Scopes
M51 gibt nur frei:
- UI-Scope: `bbm.main`
- Layout-Scope: `bbm.main-layout`
- Layoutprofil: `default`

Es gibt keine globale Freigabe sämtlicher BBM-Oberflächen.

## LayoutStateStore
M51 nutzt einen `MemoryLayoutStateStore` für die Integrationsprüfung. Das ist bewusst noch keine dauerhafte Speicherung. Die spätere dauerhafte Speicherung bleibt eine Ziel-App-Entscheidung für M52 oder später.

## Runtime-Start
`start-bbm-ui-editor-runtime.cjs` lädt die öffentliche API `ui-editor-kit`, übergibt Manifest, HostAdapter, Registry und LayoutStore an `createTargetAppAdapterRuntime` und gibt das Ergebnis neutral zurück. Fehler werden mit Blockcode gemeldet.

## Testablauf
Der M51-Test prüft:
- fest gepinnte Abhängigkeit auf `v0.2.0`
- Manifestdaten
- explizite Registry und eindeutige IDs
- Parent-Struktur
- HostAdapter-Blockaden für unbekannte Scopes und Elemente
- Runtime-Bootstrap über die öffentliche API-Form
- ViewModels
- Layout Save/Load/Reset
- Sicherheitsgrenzen gegen DOM-Scan, automatische Erkennung, Datenbankmigration, PDF, Druck, Mail und Audio

## Bekannte Grenzen
- Noch keine vollständige sichtbare Editor-Oberfläche.
- Noch keine dauerhafte Layoutspeicherung.
- Bestehende ältere Pilotpfade bleiben unverändert und werden nicht breit bereinigt.
- Der Runtime-Test injiziert eine öffentliche API-kompatible Testfunktion, damit die BBM-Integrationsgrenze auch ohne Netzinstallation prüfbar bleibt.

## Nächste Schritte für M52
- UI-Editor-kit-Abhängigkeit in einer Umgebung mit GitHub-Zugriff installieren und Lockfile aus npm aktualisieren.
- Dauerhafte, neutrale Layoutspeicherung für BBM fachlich entscheiden.
- Sichtbare Bedienoberfläche nur nach neuer UI-/PDF-Entwurfsentscheidung anbinden.
- Ältere Pilotpfade kontrolliert konsolidieren, falls sie dem v0.2.0-Vertrag widersprechen.
