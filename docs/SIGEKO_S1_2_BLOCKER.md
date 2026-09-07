# Historischer S1.2-Blockernachweis – durch S1.2-Fix behoben

Aktueller Nachweis: `SIGEKO_S1_2.md`. Der folgende Text dokumentiert den damaligen Stop; er beschreibt nicht den aktuellen Abschlussstand.

Stand: 2026-09-07. Nicht abgenommen, nicht commitfaehig, kein PR, kein Merge.

## Ausgangsbasis

- `main`: `d7fb63a73bfa399ae59de2230b849728c2d3c51a`; S1.1 / PR #318 enthalten.
- Lokaler Arbeitsbranch: `codex/sigeko-s1-2-entry-acceptance`.
- Der Branch hat noch keinen neuen Commit. Saemtliche S1.2-Aenderungen sind uncommitted.
- Rechnung #275 bleibt unveraendert. S1.3 wurde nicht begonnen.

## Umgesetzter, noch nicht freigegebener Teil

- Minimaler SiGeKo-Screen mit aktivem Projekt, zwei echten Navigationsaktionen und inaktiven Fachbereichshinweisen.
- Vorhandener generischer Moduleinstieg / Projektkachel, Projektkontext und bestehende Lizenzschnittmenge.
- Komponentennaher Editorvertrag mit elf verpflichtenden Einzel-Refs sowie Registrierung des bestehenden Header-Editorstarters.
- Bestehender isolierter Acceptance-Starter um `sigeko` erweitert; zwei neutrale Projektfixtures, kein Seeding ohne isoliertes Profil.
- Interne vorhandene Development-Testlizenz um das Modul ergaenzt; keine neue Lizenzengine.
- Im isolierten Profil Legacy-Kopie / Legacy-Import deaktiviert, normale Starts behalten ihr Verhalten.

## Entwurfsentscheidung

UI, kein PDF. Editorfaehig ueber vorhandenen M83-Komponentenvertrag.
`sigeko.screen` ist Root. Darunter Header (Titel, Projekt), Navigation
(Projektarbeitsbereich, Projekt wechseln), Statushinweis und geplanter Bereich
(Titel, Text). Stabile deklarierte IDs, echte Parents und Ref-Keys; Single-Refs.
Vorhandene universelle Layoutoperationen, Textgroesse bei Text; Fachdaten- und
Aktionsausfuehrung gesperrt. Keine Tabellen, keine Fachfelder, kein PDF-Scope.
Modus: einzelner Work-Arbeitsauftrag ohne Unteragenten. Native Windows-Bedienung
hier nicht durchgefuehrt.

## Tests und sauber getrennte Baseline

1. Urspruengliche Work-Baseline ohne UI-Editor-kit auf unveraendertem main:
   `npm test`: 473 gruene, 9 rote Einzeltests, 0/10 Gruppen; bekannte fehlende Kit-Artefakte.
2. Fuer belastbare Komponenten-/Ref-Tests das echte vorhandene Repository
   `SteffenBandholt/UI-Editor-kit` unveraendert als lokale Testabhaengigkeit ausgecheckt:
   `0240ef870dda7caaec7e639a6f5bf262b8037bc8`. Keine Abhaengigkeitsdatei im BBM-Repo geaendert,
   keine Ersatzplattform. Dies ist nicht automatisch dieselbe Version wie lokal unter Windows.
3. Vor jeder S1.2-Codeaenderung derselbe main mit diesem Kit erneut getestet:
   1466 gruene, 97 rote Einzeltests, 1/10 Gruppen. Die 88 zusaetzlich erreichbaren
   Fehler sind nachweislich schon auf main vorhanden, keine S1.2-Regression.
4. S1.2-Pakettests isoliert: 12/12 gruen. Darin echte Router-/Projektkachelmethoden,
   gemounteter produktiver Screen und echte Kit-Vertrags-/Ref-Validierung mit dem
   vorhandenen DOM-Testansatz. Kein Nachweis fuer praktische Fensterbedienung.
5. Volltest S1.2 mit identischer Kit-Version: 1467 gruene, 108 rote Einzeltests,
   1/10 Gruppen. Alle 97 Baselinefehler bleiben; 11 neue fehlschlagende Pruefungen.
   S1.1 ist 10/10 gruen; generische Routingtests 9/9 und modulare IPC-Tests 7/7 gruen.
   Migrationssuite 6/7 gruen; der neue siebte Fehler ist die veraltete Quelltext-Erwartung
   fuer den inzwischen um eine Isolationsoption ergaenzten Konfigurationsaufruf.

## Echter Blocker / Stop-Regel

`src/renderer/ui-editor/m80Registry.js` deklariert jetzt Registryversion 29 und
`sigeko.screen`. `ui-editor-target.json` ist noch unveraendert auf Version 28,
altem Fingerprint und sieben aktiven Scopes. Diese fehlende Ergaenzung der
bestehenden Zielregistrierung ist ein Implementierungsfehler dieses Arbeitsstands.

Nicht nur alte Testzaehler schlagen an: Der vorher gruene Test
`M82.1 BBM 31: kompatibles Profil wird im echten BBM-Startdienst ohne Editorprozess geladen`
scheitert jetzt bei `loaded.ok` (false statt true). Er prueft den bestehenden
Restarbeiten-Profilrestore. Auch die Zielmanifestvalidierung meldet:
`Ziel-App-Manifest und aktive Registry stimmen nicht ueberein.`

Damit: neue Regression JA. Nach dem Nachweis sofort gestoppt, keine weiteren
Produktcodekorrekturen vorgenommen, kein Commit / PR erstellt.

Alle neu roten Pruefungen:
- Paket 5: Main konfiguriert Migrationen aus demselben Lizenzstatus wie Fach-IPCs
- M80/M82.6 Registry: Restarbeiten, Protokoll und Rechnung sind explizit, Restbereiche bleiben gesperrt
- M82 BBM: Registryversion und Fingerprint stimmen mit der expliziten M80.2-Registry ueberein
- M82.1 BBM 02: Manifestversion folgt der Registry
- M82.1 BBM 03: Manifestfingerprint ist aktuell
- M82.1/M82.6 BBM 04: Restarbeiten, Protokoll und Rechnung besitzen sieben aktive Scopes
- M82.1 BBM 31: kompatibles Profil wird im echten BBM-Startdienst ohne Editorprozess geladen
- M82.3 BBM 02: Manifest folgt Registry und Fingerprint
- M82.6 BBM 40c: Zielmanifest akzeptiert den deklarierten aktiven Modul-Satz
- M83.0 BBM 01: alle offiziellen Scopes stammen aus zwoelf komponentennahen Vertraegen
- M84.0 Isolation: Rechnung nutzt den bestehenden Acceptance- und Editorpfad

## Naechster notwendiger Schritt (nicht umgesetzt)

Enges S1.2-Korrekturpaket: bestehendes `ui-editor-target.json` um SiGeKo-Scope /
Scope-Metadaten ergaenzen und Registryversion/Fingerprint nach dem vorhandenen
Verfahren angleichen. Vorhandene Moduldefinitionen erhalten, keine neue Plattform.
Die festen Scope-/Komponenten-Inventarerwartungen sowie die beiden geaenderten
Quelltext-Vertragserwartungen gezielt an die genehmigte Erweiterung anpassen.
Nicht durch Abschwaechen der Manifestvalidierung oder Ueberspringen des
Restoretests reparieren. Danach Paket-, Restore-, Manifest-, Isolations- und
Gesamtregression gegen exakt dieselbe Kit-/main-Baseline wiederholen.
Erst bei belastbarem Ergebnis Commit und Draft-PR; Windows-Abnahme bleibt Gate.

## Vorbereiteter Windows-Weg – noch nicht abnahmefaehig

Echtes Kit: `C:\01_Projekte\UI-Editor-kit`.
Repo: `C:\01_Projekte\BBM-Produktiv`.
`.ui-editor-kit` im Repo ist nur Konfiguration, kein Ersatz fuer das Kit.
Nach Korrektur und Bereitstellung des Branchs ist der vorhandene Befehl:

```powershell
Set-Location C:\01_Projekte\BBM-Produktiv
npm run start:ui-editor:acceptance -- --module=sigeko
```

Der Starter nutzt ein temporaeres Profil fuer zwei aufeinanderfolgende Starts
und entfernt es danach. Keine produktive DB oder Lizenzdatei verwenden.
Lokale Kit-/Manager-Buildvoraussetzungen bleiben die des vorhandenen Starters.

Noch praktisch zu pruefen, bisher NICHT ausgefuehrt:
1. SiGeKo oeffnet; S12-A / SiGeKo Testprojekt A erkennbar.
2. Projekt wechseln; S12-B / SiGeKo Testprojekt B ueber SiGeKo-Modulkachel oeffnen.
3. Zurueck zum Projektarbeitsbereich und SiGeKo erneut oeffnen; Projekt bleibt korrekt.
4. Fenster schmaler machen: Navigation und Hinweise bleiben les-/bedienbar.
5. Keine Fachaktion erscheint als fertig; Fachbereiche sind nur inaktive Hinweise.
6. SiGeKo ist im nativen UI-Editor erreichbar; Titel/Projekt/Navigation/Hinweise
   auswaehlen und erlaubte Layoutoperationen pruefen, keine Fachaktion ausloesen.
7. Editor schliessen / neu oeffnen sowie zweiten isolierten App-Start pruefen;
   getrennte Layout-/Testdaten und unveraenderte Produktivdaten bestaetigen.

Derzeit gibt es keinen veroeffentlichten S1.2-Branch und keine PR-Nummer.
