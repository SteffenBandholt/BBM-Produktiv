# ARCHITECTURE.md

## Zweck

Diese Datei ist die verbindliche Architekturgrundlage für dieses Repo.

Sie verhindert, dass bei neuen Änderungen, neuen Entwicklern oder neuen KI-Läufen die Struktur jedes Mal neu interpretiert wird.

`BBM-Produktiv` bleibt das aktive Produktiv-Repo.

Das Ziel ist ein modularer Aufbau.

---

## Zielbild

Die App ist keine reine Protokoll-App mehr.

Sie soll als modulare Plattform funktionieren:

- mit einem Modul
- mit mehreren Modulen
- auch ohne das Modul `Protokoll`

Beispiele für Fachmodule:

- Protokoll
- Restarbeiten
- Mängelmanagement
- weitere Module

`Protokoll` ist ein Fachmodul unter mehreren.
Es ist nicht das Zentrum der Gesamtarchitektur.

---

## Verbindliche Trennung

Die App trennt sich in drei Ebenen:

1. App-Kern
2. Modulrahmen
3. Fachmodule

### App-Kern

Der App-Kern enthält nur allgemeine, modulübergreifende Grundlagen.

Dazu gehören insbesondere:

- Projektkontext
- Navigation
- gemeinsame UI-Grundlagen
- gemeinsame Daten-Infrastruktur
- Firmen und Beteiligte
- Ausgabe- und Druckmechanik

Im App-Kern gehört keine unnötige Fachlogik eines einzelnen Moduls.

### Modulrahmen

Der Modulrahmen verbindet Fachmodule mit dem App-Kern.

Er ist zuständig für Einbindung, Übergänge und Integration.
Er ist nicht die Ablage für Fachlogik.

### Fachmodule

Fachlogik gehört in Fachmodule.

Module sollen fachlich zusammenhängend und grundsätzlich neben anderen Modulen denkbar sein.

---

## Zielstruktur im Renderer

```text
src/renderer/
  app/
  modules/
  core/
  stamm/
  addons/
  ui/
  shared/