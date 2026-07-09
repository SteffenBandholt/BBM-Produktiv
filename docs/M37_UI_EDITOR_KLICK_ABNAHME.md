# M37 UI-Editor Klick-Abnahme

## Zweck

M37 dokumentiert die manuelle Klick-Abnahme des globalen UI-Editors im echten App-Fenster.

Dieses Paket baut keine neue Funktion, trifft keine neue Architekturentscheidung und bindet keinen weiteren Scope an.

## Grundlage

- M32: App-Smoke-Test: `docs/M32_UI_EDITOR_APP_SMOKE_TEST.md`
- M36: UI-Editor-Fixstand: `docs/M36_UI_EDITOR_FIXSTAND_ABNAHME.md`

Der Fixstand nach M29 bis M36 umfasst:

- neutrale Layoutaenderungen speichern, laden und resetten
- sichtbare Bedienung im App-Kontext
- Restarbeiten-Scope
- Protokoll-/TOPS-Scope
- sauberer Scope-Wechsel
- sichtbare Bedienhinweise und Abnahmegrenzen

## Manuelle Pruefliste

| Schritt | Erwartung | Ergebnis |
| --- | --- | --- |
| App mit `npm start` starten | App startet ohne sichtbaren Startfehler | lokal gestartet; Fenster `BBM` sichtbar und antwortend |
| UI-Editor sichtbar | Button `UI-Editor` ist im DEV-Kontext sichtbar | im laufenden Fenster zu pruefen |
| UI-Editor oeffnen | Status-/Bedienpanel wird sichtbar | im laufenden Fenster zu pruefen |
| Restarbeiten-Scope auswaehlen | `restarbeiten.screen` ist als Scope auswaehlbar | im laufenden Fenster zu pruefen |
| Protokoll/TOPS-Scope auswaehlen | `protokoll.topsScreen` ist als Scope auswaehlbar | im laufenden Fenster zu pruefen |
| Aktiver Scope eindeutig sichtbar | Status zeigt `Aktiver UI-Scope: ...` | technisch durch Runtime-Test abgesichert; im Fenster fachlich zu bestaetigen |
| Registriertes Element auswaehlen | Auswahl wird sichtbar markiert und im Panel genannt | technisch durch Runtime-Test abgesichert; im Fenster fachlich zu bestaetigen |
| Scope wechseln | alte Auswahl wird geloescht und wirkt nicht im neuen Scope weiter | technisch durch Runtime-Test abgesichert; im Fenster fachlich zu bestaetigen |
| Anwenden/Speichern | Aktion bezieht sich nur auf den aktiven Layout-Scope | technisch durch HostAdapter-/Inspector-/Runtime-Tests abgesichert; im Fenster fachlich zu bestaetigen |
| Laden | geladener Zustand bezieht sich nur auf den aktiven Layout-Scope | technisch durch HostAdapter-/Inspector-/Runtime-Tests abgesichert; im Fenster fachlich zu bestaetigen |
| Reset | Reset bezieht sich nur auf den aktiven Layout-Scope | technisch durch HostAdapter-/Inspector-/Runtime-Tests abgesichert; im Fenster fachlich zu bestaetigen |
| Blockademeldung bei keiner Auswahl | Meldung ist sichtbar und verstaendlich | technisch durch Runtime-Test abgesichert; im Fenster fachlich zu bestaetigen |
| Blockademeldung bei falschem/unbekanntem Scope | Meldung ist sichtbar und verstaendlich | technisch durch Runtime-/Inspector-Tests abgesichert; im Fenster fachlich zu bestaetigen |
| Blockademeldung bei unbekanntem Element | Meldung ist sichtbar und verstaendlich | technisch durch Runtime-/HostAdapter-Tests abgesichert; im Fenster fachlich zu bestaetigen |
| Keine Fachwerte bearbeiten | keine fachlichen Werte werden geaendert | technisch durch Payload-/HostAdapter-Tests abgesichert; fachlich zu bestaetigen |
| PDF, Druck, Mail, Audio, DB-Fachlogik | nicht Teil dieser Abnahme | ausgeschlossen |

## Nicht Teil der Klick-Abnahme

- Keine PDF-Bearbeitung
- Keine PDF-Ausgabe
- Kein Druck
- Keine Mail
- Keine Audio-/Diktataenderung
- Keine Protokoll-Fachlogik
- Keine Restarbeiten-Fachlogik
- Keine Datenbankmigration
- Keine neue Modul-Anbindung
- Keine UI-Umbauten
- Keine neue Editor-Architektur

## Technische Absicherung

Die Klick-Abnahme wird durch bestehende Tests flankiert:

- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `scripts/tests/editorScopeInspector.test.cjs`
- `scripts/tests/restarbeitenEditorHostAdapter.test.cjs`
- `scripts/tests/protokollEditorHostAdapter.test.cjs`
- `scripts/tests/bbmUiEditorRegistry.test.cjs`
- `node scripts/ui-editor-contract-check.cjs --self-test`
- `npm test`

## Lokale Sichtpruefung M37

`npm start` wurde im Rahmen von M37 gestartet.

Beobachtung:

- `electron-builder install-app-deps` lief durch.
- `electron .` startete.
- Main-Prozess registrierte die erwarteten IPCs.
- Die Datenbank wurde geoeffnet.
- Ein Fenster mit Titel `BBM` war sichtbar und antwortend.

Grenze:

- Die detaillierte fachliche Klickfolge bleibt anhand der obigen Tabelle im echten App-Fenster manuell abzuzeichnen.
- Codex ersetzt keine fachliche Nutzerabnahme.

## Pruefungen fuer M37

```powershell
git diff --check
node scripts/ui-editor-contract-check.cjs --self-test
npm test
npm start
```

Ergebnis:
- `git diff --check`: bestanden
- `node scripts/ui-editor-contract-check.cjs --self-test`: bestanden
- `npm test`: bestanden; Ausgabe endete mit `Alle Tests bestanden.`
- `npm start`: bestanden; App startete, Fenster `BBM` war sichtbar und antwortend

## Ergebnis

M37 ist ein Dokumentations- und Abnahmepaket:

- Die manuelle Klick-Abnahme ist als klare Pruefliste dokumentiert.
- Die lokale App-Sichtpruefung wird dokumentiert.
- Nicht-Ziele und technische Pruefanker sind festgehalten.
