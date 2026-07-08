# M35 UI-Editor Bedienhinweise und Abnahmegrenzen

## Zweck

M35 macht die sichtbare Bedienfuehrung und die Abnahmegrenzen des globalen UI-Editors klarer.

Es wurde keine neue Editor-Architektur eingefuehrt, kein weiterer Fachscope angebunden und keine Fachlogik geaendert.

## Grundlage

- M29: Layoutaenderungen koennen gespeichert, geladen und zurueckgesetzt werden.
- M30: neutrale Bediencontrols sind abgesichert.
- M31: sichtbare Bedienung ist in der App angebunden.
- M32: App-Smoke-Test ist dokumentiert.
- M33: Restarbeiten- und Protokoll-/TOPS-Scope sind angebunden.
- M34: Scope-Wechsel und falsche Scope-/Element-Kombinationen sind abgesichert.

## Umsetzung

- Die Statusanzeige nennt weiterhin den aktiven UI-Scope und ergaenzt die sichtbare Bediengrenze:
  - nur neutrale Layoutaenderungen
  - keine Fachwerte
  - PDF, Druck, Mail, Audio und DB-Fachlogik sind nicht Teil dieses Editors
- Das Layoutpanel zeigt:
  - ausgewaehltes Element
  - Layout-Scope
  - erlaubte neutrale Layoutoperationen
  - aktuellen Speicher-/Lade-/Reset-Status
  - blockierende Gruende
- Wenn kein registriertes Element ausgewaehlt ist, wird die Layoutbedienung sichtbar blockiert.
- Markierte, aber im aktiven Scope nicht registrierte Elemente erzeugen eine sichtbare Blockmeldung.
- Falscher Scope, unbekannter Scope, unbekanntes Element und nicht erlaubte Layoutoperationen bleiben sichtbar blockiert.

## Abnahmegrenzen

| Bereich | Ergebnis |
| --- | --- |
| Fachwerte | werden nicht bearbeitet |
| PDF | nicht Teil dieses Editors |
| Druck | nicht Teil dieses Editors |
| Mail | nicht Teil dieses Editors |
| Audio/Diktat | nicht Teil dieses Editors |
| Datenbank-Fachlogik | nicht Teil dieses Editors |
| Automatische DOM-Erkennung | nicht eingefuehrt |
| Weitere Modul-Anbindung | nicht eingefuehrt |

## Abnahmeumfang

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Aktiver Scope sichtbar | bestanden | Runtime-Status zeigt `Aktiver UI-Scope` |
| Ausgewaehltes Element sichtbar | bestanden | Layoutpanel zeigt `Ausgewaehltes Element` |
| Erlaubte neutrale Operationen sichtbar | bestanden | Layoutpanel zeigt `Erlaubte neutrale Layoutoperationen` |
| Speicher-/Lade-/Reset-Status sichtbar | bestanden | Runtime-Status und Layoutpanel zeigen Layoutstatus |
| Kein Element ausgewaehlt | bestanden | sichtbare Blockmeldung `Kein registriertes Element ausgewaehlt` |
| Falscher/unbekannter Scope | bestanden | unbekannte Scopes blockieren sichtbar |
| Unbekanntes Element | bestanden | Auswahl-Hinweis und Layoutblockade im aktiven Scope |
| Nicht erlaubte Operation | bestanden | bestehende Inspector-Tests blockieren nicht freigegebene Operationen |
| Keine layoutneutrale Aenderung | bestanden | bestehende Inspector-Tests blockieren Fach-/DOM-/DB-Payloads |
| Restarbeiten bleibt bedienbar | bestanden | bestehende Runtime- und HostAdapter-Tests bleiben gruen |
| Protokoll/TOPS bleibt bedienbar | bestanden | bestehende Runtime- und HostAdapter-Tests bleiben gruen |

## Nicht geaendert

- Keine PDF-Bearbeitung
- Keine PDF-Ausgabe
- Kein Druck
- Keine Mail
- Keine Diktat-/Audioaenderung
- Keine Protokoll-Fachlogik
- Keine Restarbeiten-Fachlogik
- Keine Datenbankmigration
- Keine neue Editor-Architekturentscheidung
- Keine weitere Modul-Anbindung
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
- `git diff --check`: bestanden
- `node scripts/ui-editor-contract-check.cjs --self-test`: bestanden
- `npm test`: bestanden, Ausgabe endete mit `Alle Tests bestanden.`
- `npm start`: App startete sichtbar; ein Fenster `BBM` war vorhanden und antwortend.

## Grenze der Sichtung

Die technische Bedienfuehrung und die Blockademeldungen sind durch Tests abgesichert. Eine zusaetzliche fachliche Klick-Abnahme im echten App-Fenster bleibt Aufgabe der fachlichen Abnahme.

## Ergebnis

M35 ist abgeschlossen:
- UI-Editor-Bedienung ist fuer Nutzer verstaendlicher.
- Blockademeldungen sind klarer.
- Abnahmegrenzen sind sichtbar dokumentiert.
