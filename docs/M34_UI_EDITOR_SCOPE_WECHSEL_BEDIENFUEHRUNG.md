# M34 UI-Editor Scope-Wechsel und Bedienfuehrung

## Zweck

M34 stabilisiert die Bedienfuehrung des globalen UI-Editors, sobald mehr als ein echter Scope sichtbar bedienbar ist.

Es wurde keine neue Editor-Grundsatzentscheidung getroffen. Der Editor bleibt global, fachneutral und arbeitet nur mit registrierten UI-Editor-Elementen.

## Grundlage

- M29: neutrale Layoutaenderungen koennen gespeichert, geladen und zurueckgesetzt werden.
- M30: neutrale Controls fuer Anwenden/Speichern, Laden und Reset sind abgesichert.
- M31: sichtbare Bedienung ist in der App angebunden.
- M32: App-Smoke-Test ist dokumentiert.
- M33: Restarbeiten- und Protokoll-/TOPS-Scope sind angebunden.

## Umsetzung

- Die Statusanzeige nennt den aktiven UI-Scope explizit als `Aktiver UI-Scope`.
- Beim Scope-Wechsel wird die bisherige Zielauswahl samt Markierung geloescht.
- Das Launcher-Attribut `data-ui-editor-active-ui-scope` wird beim Scope-Wechsel aktualisiert.
- Die Layoutbedienung prueft vor neutralen Layoutaktionen, ob die Auswahl zur aktuell aktiven Registry gehoert.
- Unbekannte oder nicht verfuegbare Scopes zeigen eine sichtbare blockierte Layoutmeldung mit Grund.
- Speichern/Laden/Reset bleiben an den aktuell aufgeloesten Layout-Scope gebunden.

## Scope-Verhalten

| UI-Scope | Layout-Scope | Ergebnis |
| --- | --- | --- |
| `restarbeiten.screen` | `restarbeiten.ui.main` | bleibt bedienbar |
| `protokoll.topsScreen` | `protokoll.topsScreen` | bleibt bedienbar |
| unbekannter Scope | nicht verfuegbar | Layoutbedienung wird sichtbar blockiert |

## Abnahmeumfang

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Aktiven Scope sichtbar anzeigen | bestanden | Runtime-Status zeigt `Aktiver UI-Scope: ...` |
| Alte Auswahl beim Scope-Wechsel verhindern | bestanden | Runtime-Test wechselt von TOPS nach Restarbeiten und erwartet `Auswahl: keine` |
| Auswahlzustand passt zum aktuellen Scope | bestanden | Klick auf altes TOPS-Ziel bleibt im Restarbeiten-Scope wirkungslos |
| Speichern/Laden/Reset wirken auf aktuellen Layout-Scope | bestanden | Runtime-Test prueft Apply/Load/Reset fuer `restarbeiten.ui.main` nach Scope-Wechsel |
| Blockierte Aktionen sind verstaendlich | bestanden | unbekannter Scope zeigt `Layoutbedienung blockiert: ...` |
| Unbekannte Scopes sauber behandeln | bestanden | Runtime-Test blockiert `unknown.scope` ohne LayoutInspector-Aufruf |
| Restarbeiten bleibt bedienbar | bestanden | bestehende Restarbeiten-Tests und M34-Wechseltest laufen gruen |
| Protokoll/TOPS bleibt bedienbar | bestanden | bestehende TOPS-Scope-Tests laufen gruen |
| Keine automatische DOM-Erkennung | bestanden | bestehende Runtime-Guardrails bleiben gruen |
| Keine Fachwerte veraendern | bestanden | keine Fach-, DB-, IPC- oder Datensatzpfade geaendert |

## Nicht geaendert

- Keine PDF-Bearbeitung
- Keine PDF-Ausgabe
- Kein Druck
- Keine Mail
- Keine Diktat-/Audioaenderung
- Keine Protokoll-Fachlogik
- Keine Restarbeiten-Fachlogik
- Keine Datenbankmigration
- Keine automatische DOM-Erkennung
- Keine neue Editor-Architekturentscheidung
- Keine grosse UI-Umbauaktion

## Pruefungen

```powershell
node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs
git diff --check
node scripts/ui-editor-contract-check.cjs --self-test
npm test
npm start
```

Ergebnis:
- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`: bestanden
- `node scripts/ui-editor-contract-check.cjs --self-test`: bestanden
- `npm test`: bestanden, Ausgabe endete mit `Alle Tests bestanden.`
- `npm start`: App startete sichtbar; ein Fenster `BBM` war vorhanden und antwortend.
- `git diff --check`: bestanden

## Grenze der Sichtung

Die technische Scope-Wechsel-Bedienung ist durch Tests abgesichert. Eine zusaetzliche fachliche Klick-Abnahme im echten App-Fenster kann durch den Nutzer erfolgen, wenn die sichtbare Bedienfolge final bestaetigt werden soll.

## Ergebnis

M34 ist abgeschlossen:
- Scope-Wechsel zwischen Restarbeiten und Protokoll/TOPS ist robust.
- Der aktive Scope ist sichtbar und eindeutig.
- Falsche Scope-/Element-Kombinationen werden blockiert oder gar nicht erst ausgewaehlt.
- Restarbeiten und Protokoll/TOPS bleiben bedienbar.
