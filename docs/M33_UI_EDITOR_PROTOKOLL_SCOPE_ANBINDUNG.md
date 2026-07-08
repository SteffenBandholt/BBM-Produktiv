# M33 UI-Editor Protokoll-/TOPS-Scope-Anbindung

## Zweck

M33 bindet den globalen UI-Editor zusaetzlich fuer den vorhandenen Protokoll-/TOPS-Scope sichtbar an.

Es wurde keine neue Editor-Grundsatzentscheidung getroffen. Der Editor bleibt global, fachneutral und arbeitet nur mit registrierten UI-Editor-Elementen.

## Grundlage

- M29: neutrale Layoutaenderungen koennen gespeichert, geladen und zurueckgesetzt werden.
- M30: neutrale Controls fuer Anwenden/Speichern, Laden und Reset sind im EditorRuntime-Kontext abgesichert.
- M31: sichtbare UI-Editor-Bedienung ist in der App angebunden.
- M32: App-Smoke-Test wurde dokumentiert und bestanden.

## Umsetzung

- Der sichtbare App-Scope `protokoll.topsScreen` wird im globalen UI-Editor weiterhin ueber die vorhandene BBM-UI-Editor-Registry bereitgestellt.
- Der Layout-Scope fuer `protokoll.topsScreen` ist nun ebenfalls `protokoll.topsScreen`.
- Fuer den neutralen EditorRuntime-Pfad wurde eine Protokoll/TOPS-Registry mit den bereits vorhandenen Quicklane-IDs angelegt.
- Der HostAdapter fuer `protokoll.topsScreen` speichert, laedt und resetet ausschliesslich neutrale Layoutwerte.
- `restarbeiten.screen` bleibt unveraendert auf `restarbeiten.ui.main` abgebildet.

## Bedienbarer Scope

| Bereich | Ergebnis |
| --- | --- |
| Sichtbarer UI-Scope | `protokoll.topsScreen` |
| Layout-Scope | `protokoll.topsScreen` |
| Modul | `protokoll` |
| Bedienbare registrierte Elemente | TOPS-Quicklane, Gruppen und Quicklane-Buttons |
| Speicherart | neutraler EditorRuntime-Layoutspeicher |

## Abnahmeumfang

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Vorhandenen Protokoll-/TOPS-Scope in Registry verwenden | bestanden | `bbmUiEditorRegistry.js` bleibt Quelle fuer sichtbare Auswahl; `CoreShell` nutzt `protokoll.topsScreen` fuer TOPS |
| Sichtbare Auswahl registrierter TOPS-/Protokoll-Elemente ermoeglichen | bestanden | Runtime-Test waehlt `protokoll.topsScreen.quicklane` und zeigt die Auswahl |
| Layout-Scope korrekt anzeigen | bestanden | Runtime-Test prueft `Layout-Scope: protokoll.topsScreen` |
| Anwenden/Speichern, Laden und Reset ermoeglichen | bestanden | HostAdapter- und Inspector-Tests pruefen Apply/Load/Reset fuer `protokoll.topsScreen.quicklane` |
| Blockierte Aktionen sichtbar melden | bestanden | Inspector- und HostAdapter-Tests blockieren unbekannte Elemente und Fachpayloads |
| Restarbeiten-Pilot nicht beschaedigen | bestanden | bestehendes Mapping `restarbeiten.screen` -> `restarbeiten.ui.main` bleibt erhalten; bestehende Tests laufen weiter |
| Keine Fachwerte veraendern | bestanden | Fach-, DOM-, Datenbank- und Textpayloads werden abgelehnt |
| Keine automatische DOM-Erkennung einfuehren | bestanden | Runtime-Tests sichern weiter gegen Scan-/Auto-Registry-Begriffe ab |
| Nur registrierte UI-Editor-Elemente verwenden | bestanden | Protokoll/TOPS-HostAdapter akzeptiert nur IDs aus der Runtime-Registry |

## Nicht geaendert

- Keine PDF-Bearbeitung
- Keine PDF-Ausgabe
- Kein Druck
- Keine Mail
- Keine Diktat-/Audioaenderung
- Keine Protokoll-Fachlogik
- Keine Restarbeiten-Fachlogik
- Keine Datenbankmigration
- Keine neue Editor-Grundsatzentscheidung
- Keine grosse UI-Umbauaktion

## Pruefungen

```powershell
git diff --check
node scripts/ui-editor-contract-check.cjs --self-test
npm test
npm start
```

Ergebnis:
- `git diff --check`: bestanden
- `node scripts/ui-editor-contract-check.cjs --self-test`: bestanden
- `npm test`: bestanden, Ausgabe endete mit `Alle Tests bestanden.`
- `npm start`: App startete sichtbar; das Fenster `BBM` war vorhanden und antwortend.

## Grenze der Sichtung

Die technische Bedienfolge fuer Protokoll/TOPS ist durch Tests abgesichert. Eine zusaetzliche fachliche Klick-Abnahme im echten App-Fenster kann durch den Nutzer erfolgen, wenn die sichtbare Bedienung final fachlich bestaetigt werden soll.

## Ergebnis

M33 ist abgeschlossen:
- Protokoll-/TOPS-Scope ist im sichtbaren globalen UI-Editor bedienbar.
- Restarbeiten-Scope bleibt bedienbar.
- Der Editor bleibt fachneutral und nutzt nur registrierte Elemente.
