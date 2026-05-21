# UI-Inspektor Zielarchitektur

## Architekturziel
Der UI-Inspektor wird als exportierbares Modul aufgebaut.

Kernprinzip:
- allgemeiner Core ohne BBM-Fachlogik
- App-spezifisches Wissen nur in klar abgegrenzten Integrationsschichten

## Modulare Trennung
Die Zielarchitektur trennt diese Bausteine:

1. **Core**
   - enthält allgemeine Inspektor-Logik
   - kennt keine BBM-Fachdaten und keine BBM-Screens

2. **Overlay**
   - visualisiert markierbare UI-Bereiche
   - steuert Hervorhebung, Fokus, Auswahlrückmeldung

3. **Panel**
   - zeigt laienverständliche Bedienoberfläche
   - bietet fachlich benannte Änderoptionen

4. **Registry**
   - verwaltet registrierte Bereichstypen und Bearbeitungsoptionen
   - bleibt technisch allgemein

5. **Store**
   - hält Inspektor-Zustand (aktiv, Auswahl, Änderstatus)
   - bleibt von App-Fachlogik entkoppelt

6. **Adapter**
   - bindet konkrete App-Strukturen an den Core an
   - enthält app-spezifische Übersetzung von Bereichsdaten

7. **Layout-Landkarte**
   - beschreibt echte sichtbare UI-Bereiche pro App
   - liefert fachliche Bereichsnamen und editierbare Eigenschaften

## Trennregel Core vs. App
- Der Core darf keine BBM-Fachlogik enthalten.
- App-spezifisches gehört ausschließlich in Adapter und Layout-Landkarten.
- Der Core bleibt dadurch portierbar und wiederverwendbar.

## Beispielhafte spätere Zielstruktur
Diese Struktur ist ein Zielbild, noch keine Implementierung:

- `src/shared/uiInspector/`
- `src/renderer/uiInspector/`

Wichtig:
- In diesem Meilenstein werden dort noch keine Code-Dateien angelegt.
- Es wird nur das Projektfundament dokumentiert.
