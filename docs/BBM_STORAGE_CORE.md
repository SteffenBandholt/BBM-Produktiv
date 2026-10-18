# BBM-Storage-Core – Architekturvorgabe

Stand: 2026-10-18

## Ziel

Projektbezogene Dateiablagen werden künftig über einen gemeinsamen **BBM-Storage-Core** verwaltet.

Der Core soll für BBM-Produktiv und für eigenständig laufende BBM-Module denselben Speichervertrag bereitstellen.

## Grundprinzip

Der Nutzer wählt genau einmal einen **Projekt-Stammordner**.

Beispiel:

```text
D:\Projekte
```

BBM erzeugt darunter die Projektstruktur automatisch, zum Beispiel:

```text
D:\Projekte\bbm\2616 - BT17\
├─ Protokolle\
├─ Vorabzug\
├─ Listen\
├─ Restarbeiten\
├─ AzL\
│  ├─ Angebote\
│  └─ Ausgaben\
└─ SiGeKo\
   ├─ Unterlagen\
   ├─ SiGePläne\
   ├─ Zeichnungen\
   └─ Berichte\
```

## Verbindliche Regeln

1. Module speichern keine eigenen absoluten Benutzerpfade.
2. Der Host liefert den projektbezogenen Speicherbereich über einen gemeinsamen Storage-Vertrag.
3. Standalone-Apps verwenden denselben Vertrag mit einem eigenen kleinen Host-Adapter für die Stammordner-Einstellung.
4. Die Modulstruktur ist identisch, unabhängig davon, ob das Modul in BBM-Produktiv oder standalone läuft.
5. Neue Module registrieren nur ihre benötigten Unterordner/Ziele.
6. Vorschau, Ordneranlage, Dateiablage und „Ordner öffnen“ müssen denselben aufgelösten Pfad verwenden.
7. Der Nutzer soll nicht für jedes Projekt oder Modul erneut Ordner auswählen müssen.

## Bestehender Ausgangspunkt

In BBM-Produktiv existiert bereits `src/main/ipc/projectStoragePaths.js`.

Dort sind aktuell unter anderem registriert:

- `azl -> AzL/Angebote, AzL/Ausgaben`
- `sigeko -> SiGeKo/Unterlagen, SiGePläne, Zeichnungen, Berichte`

Die bestehende Implementierung verwendet derzeit `pdf.protocolsDir` als globalen Basisordner mit Downloads-Fallback. Diese Logik ist der technische Ausgangspunkt, soll aber fachlich zu einem allgemeinen **Projekt-Stammordner** und technisch zu einem host-unabhängigen BBM-Storage-Core weiterentwickelt werden.

## Nächster Schritt

Vor weiteren modulspezifischen Speichererweiterungen:

- Core-API definieren
- Host-/Standalone-Adapter definieren
- bestehende Pfadlogik migrieren
- Rückwärtskompatibilität für bestehende Einstellungen prüfen
- anschließend azL-Ausgaben über PrintCore in `AzL/Ausgaben` anbinden
