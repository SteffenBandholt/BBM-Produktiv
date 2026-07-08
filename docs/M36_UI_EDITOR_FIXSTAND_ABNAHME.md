# M36 UI-Editor Fixstand und Abnahme

## Zweck

M36 dokumentiert den Fixstand des globalen UI-Editors nach M29 bis M35.

Dieses Paket baut keine neue Funktion, trifft keine neue Architekturentscheidung und bindet keinen weiteren Scope an.

## Fixstand

Der globale UI-Editor kann aktuell:

- neutrale Layoutaenderungen fuer registrierte Elemente anwenden und speichern
- gespeicherte neutrale Layoutzustaende laden und anwenden
- gespeicherte Layoutzustaende auf Standard zuruecksetzen
- sichtbar in der App im DEV-Kontext bedient werden
- registrierte Elemente im aktiven Scope auswaehlen
- aktiven UI-Scope, Layout-Scope, ausgewaehltes Element und erlaubte neutrale Layoutoperationen anzeigen
- Speicher-, Lade-, Reset- und Blockadestatus sichtbar melden
- Scope-Wechsel zwischen den angebundenen Scopes sauber behandeln
- falsche Scope-/Element-Kombinationen blockieren
- Bediengrenzen sichtbar anzeigen

## Angebundene Scopes

| Sichtbarer UI-Scope | Layout-Scope | Stand |
| --- | --- | --- |
| `restarbeiten.screen` | `restarbeiten.ui.main` | bedienbar |
| `protokoll.topsScreen` | `protokoll.topsScreen` | bedienbar |

Der Editor arbeitet nur mit registrierten UI-Editor-Elementen aus der Ziel-App-Registry. Nicht registrierte Elemente gelten fuer den Editor als nicht vorhanden oder werden sichtbar blockiert.

## Bediengrenzen

Der UI-Editor bearbeitet ausschliesslich neutrale Layoutwerte.

Zulaessig sind nur Operationen, die fuer das jeweilige registrierte Element freigegeben sind, zum Beispiel:

- `move`
- `resize`
- `width`
- `height`
- `spacing`
- weitere neutrale Operationen nur, wenn sie registriert und vom HostAdapter erlaubt sind

Alle Aenderungen laufen ueber den bestehenden EditorRuntime-/Inspector-/HostAdapter-Pfad. Layoutdaten und Fachdaten bleiben getrennt.

## Ausdruecklich nicht Teil des Editors

- keine PDF-Bearbeitung
- keine PDF-Ausgabe
- kein Druck
- keine Mail
- keine Audio-/Diktataenderung
- keine Protokoll-Fachlogik
- keine Restarbeiten-Fachlogik
- keine Datenbankmigration
- keine fachlichen IPC-/Datenaktionen
- keine Fachwerte
- keine Fachbutton-Ausfuehrung
- keine automatische DOM-Erkennung
- keine automatische Registry-Befuellung
- keine weitere Modul-Anbindung
- keine neue Editor-Architektur

## Abgesicherte Blockaden

Der Fixstand blockiert sichtbar:

- kein registriertes Element ausgewaehlt
- unbekannter Scope
- falscher Scope
- unbekanntes Element im aktiven Scope
- nicht erlaubte Operation
- gesperrte Operation
- nicht layoutneutrale Aenderung
- Fach-, DOM-, Datenbank- oder Datensatzpayloads

## Pruefanker

Der Stand ist insbesondere abgesichert durch:

- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `scripts/tests/editorScopeInspector.test.cjs`
- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `scripts/tests/protokollEditorHostAdapter.test.cjs`
- `scripts/tests/bbmUiEditorRegistry.test.cjs`
- `uiEditor/tests/uiEditorInstallation.test.cjs`
- `scripts/ui-editor-contract-check.cjs --self-test`
- `npm test`

## Naechste Themen erst nach diesem Fixstand

Erst nach diesem dokumentierten Fixstand duerfen separat geplant werden:

- fachliche Klick-Abnahme im echten App-Fenster
- weitere UI-Editor-Usability-Verbesserungen als eigenes Paket
- weitere bewusst registrierte UI-Editor-Elemente
- weitere Scopes oder Module, nur mit eigener Entwurfsentscheidung und eigenem Auftrag
- erweiterte Layoutoperationen, nur wenn neutral, registriert und testgesichert
- produktive Freigabe- oder Nutzerfuehrungsfragen

Nicht als Folgepaket ohne neuen Auftrag erlaubt sind:

- automatische DOM-Erkennung
- automatische Bestandsmigration
- PDF-/Druck-/Mail-/Audio-Anbindung
- Fachlogik- oder Datenbankumbau
- breite UI-Umbauten

## Pruefungen fuer M36

```powershell
git diff --check
node scripts/ui-editor-contract-check.cjs --self-test
npm test
```

Ergebnis:
- `git diff --check`: bestanden
- `node scripts/ui-editor-contract-check.cjs --self-test`: bestanden
- `npm test`: bestanden, Ausgabe endete mit `Alle Tests bestanden.`

## Ergebnis

M36 ist ein Dokumentations- und Abnahmepaket:

- Der globale UI-Editor-Fixstand nach M29 bis M35 ist dokumentiert.
- Die angebundenen Scopes sind benannt.
- Bediengrenzen und Nicht-Ziele sind festgehalten.
- Nachfolgethemen sind als spaetere, eigene Pakete abgegrenzt.
