# M32 UI-Editor App-Smoke-Test

## Zweck

M32 prueft den globalen UI-Editor im App-Kontext nach M29, M30 und M31.

Es wurde keine neue Funktion gebaut und keine neue Architekturentscheidung getroffen.

## Grundlage

- M29: neutrale Layoutaenderungen koennen gespeichert, geladen und zurueckgesetzt werden.
- M30: neutrale Controls fuer Anwenden/Speichern, Laden und Reset sind im EditorRuntime-Kontext abgesichert.
- M31: sichtbare UI-Editor-Bedienung ist in der App angebunden.

## Pruefumfang

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| App startet mit `npm start` | bestanden | Electron startete, IPCs wurden registriert, DB wurde geoeffnet, Fenster `BBM` war sichtbar und antwortend |
| UI-Editor-Launcher sichtbar im DEV-Kontext | bestanden | Sichtpruefung im laufenden BBM-Fenster: Button `UI-Editor` oben rechts sichtbar |
| Registriertes Element kann ausgewaehlt werden | technisch bestanden | `npm test`, besonders `bbmUiEditorRuntimeLauncher.test.cjs`: Klick auf registrierte Restarbeiten-/Protokoll-IDs waehlt und markiert Ziele |
| Layout-Scope wird angezeigt | technisch bestanden | `npm test`: sichtbare Layoutbedienung zeigt Auswahl und Scope-Mapping `restarbeiten.screen` -> `restarbeiten.ui.main` |
| Neutrale Layoutaenderung kann angewendet/gespeichert werden | technisch bestanden | `npm test`: `EditorScopeInspector` und Runtime-Launcher bestaetigen Apply/Save |
| Gespeicherter Zustand kann geladen/angewendet werden | technisch bestanden | `npm test`: `loadLayoutState()` liefert gespeicherten Layoutzustand |
| Reset setzt auf Standard zurueck | technisch bestanden | `npm test`: `resetLayoutState()` entfernt gespeicherten Elementzustand |
| Blockierte Aktionen zeigen sichtbare Meldung | technisch bestanden | `npm test`: unbekannte Elemente und nicht layoutneutrale Operationen werden sichtbar blockiert |
| Keine Fachwerte werden veraendert | bestanden | Tests blockieren Fach-, DOM-, Datenbank- und IPC-Payloads; keine Codeaenderung in Fachlogik |
| Keine PDF-/Druck-/Mail-/Audio-Pfade werden beruehrt | bestanden | Keine Codeaenderung; Doku-/Statuspaket bleibt ausserhalb dieser Pfade |

## Lokale App-Sichtung

`npm start` wurde ausgefuehrt.

Beobachtung:
- `electron-builder install-app-deps` lief durch.
- `electron .` startete.
- Main-Prozess registrierte die erwarteten IPCs.
- Datenbank unter `C:\Users\Steffen\AppData\Roaming\baubesprechungs-manager\app.db` wurde geoeffnet.
- Ein sichtbares, antwortendes Fenster mit Titel `BBM` war vorhanden.
- Im Fenster war der `UI-Editor`-Launcher oben rechts sichtbar.

Grenze der lokalen Sichtung:
- Die weitere Bedienfolge wurde in dieser Sitzung nicht als vollstaendige manuelle Klick-Abnahme im echten App-Fenster bestaetigt.
- Die Bedienfolge ist technisch ueber `npm test` abgedeckt.

## Pruefungen

```powershell
git diff --check
npm test
npm start
```

Ergebnis:
- `git diff --check`: bestanden
- `npm test`: bestanden, Ausgabe endete mit `Alle Tests bestanden.`
- `npm start`: App startete sichtbar; Session wurde anschliessend per `Ctrl+C` beendet.

## Nicht geaendert

- Keine PDF-Bearbeitung
- Keine PDF-Ausgabe
- Kein Druck
- Keine Mail
- Keine Diktat-/Audioaenderung
- Keine Restarbeiten-Fachlogik
- Keine Protokoll-Fachlogik
- Keine Datenbankmigration
- Keine neue Editor-Grundsatzentscheidung
- Keine UI-Umbauaktion

## Ergebnis

M32 ist als Smoke-Test- und Abnahmedokumentation abgeschlossen.

Es war keine Codekorrektur noetig.

Offener Punkt:
- Eine zusaetzliche fachliche Klick-Abnahme im echten App-Fenster kann durch den Nutzer erfolgen, wenn die sichtbare Bedienung final fachlich bestaetigt werden soll.
