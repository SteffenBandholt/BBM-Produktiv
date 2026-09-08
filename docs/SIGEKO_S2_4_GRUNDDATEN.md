# SiGeKo S2.4 – Grunddaten-Bedienung

Status: technisch umgesetzt; **manuelle Windows-Abnahme offen, nicht integriert**.
PR: https://github.com/SteffenBandholt/BBM-Produktiv/pull/328
Base: main `741fa37366e07643c1257955cd119c89f1423050` (S2.3 / #327).
Branch: `codex/sigeko-s24-grunddaten`.
Geprüfter Produktcommit: `9c42f30f1b0361b76f9d1f09e3afd64e97619516`.
Geprüfter Produkttree: `e558e771fce0b114305fba12b2956bcd74f57009`.

## Ergebnis und Grenzen

Das bestehende SiGeKo-Modul bietet nun ein modulweites eigenes Profil mit Name,
Adresse, Telefon, E-Mail und lokaler Logo-Verknüpfung. Profiländerungen gelten
für alle Projekte, deren jeweilige Rolle das eigene Profil referenziert.
Dateiauswahl und Entfernen ändern zunächst nur den Entwurf; erst Profil speichern
schreibt ihn. Es gibt keine Dateikopie, Upload- oder neue Dateiverwaltung.

Planung und Ausführung besitzen getrennte Quellen: eigenes Profil, zentrale Person,
Projektperson oder freie Angaben. Die Vorgabe „Ausführung wie Planung“ übernimmt
Planung dynamisch. Der bestätigte Fall „andere Person plant, eigener SiGeKo führt
aus“ ist damit bedienbar. Modulprofil und Projektrollen werden getrennt gespeichert.

Alle Kontaktzugriffe verwenden das bestehende gemeinsame firmDirectory. Reads
legen kein SiGeKo-Projekt an. Unveränderte fehlende Personenreferenzen werden beim
Rollenspeichern nicht erneut als ungültige Änderung gesendet. Fehlende Quellen
werden angezeigt und nicht durch eigene Daten ersetzt. Fehler erhalten Entwürfe;
während Speichern sind Doppelaufrufe und lokaler Projektwechsel blockiert. Späte
Antworten einer zerstörten Ansicht verändern keine neue Ansicht. Archivrollen sind
schreibgeschützt, der bestehende Service sichert auch nachträgliche Archivierung.

Rechnung #275 bleibt eingefroren. Kein Readiness-, Behörden-, PDF-/Vorlagen-,
Protokollsettings- oder Datenbankschema-Paket. Die Behörden-PDF Stand Januar 2022
bleibt ausschließlich Referenz für S4; Aktualität erst vor späterer Übernahme prüfen.

## Editorvertrag

Die vor Umsetzung ausgegebene vollständige Entscheidung steht in
`SIGEKO_S2_4_UI_ENTWURF.md`: 107 explizite verpflichtende Screen-Slots plus bestehender
Header-Editorstarter, zusammen 108 Scope-Elemente. Direkte Ref-Bindung, reale Parents,
Single-Refs, gesperrte Fachaktionen. Registry-Version 31; keine Editor-Core-Änderung.
Alle sieben bisherigen Fremdscope-Fingerprints und der S2.2-Scope geplanter Baubeginn
bleiben bytegleich. Der SiGeKo-Scope-Fingerprint ändert sich; alte SiGeKo-Layoutprofile
können regulär als inkompatibel zurückgewiesen werden. Kein Abschwächen von Restore.

Der Legacy-HTML-Parser unterstützt das aktuelle M83-Vokabular nicht und wurde nicht
als grün behauptet. Die ausführbaren aktuellen Nachweise sind echte Kit-Komponenten-
und gemountete Ref-Validierung, sechs Pflichtattribute/Parents jedes Slots, Manifest
und tatsächlicher Profil-Restore. Einzelheiten der Parserabgrenzung im UI-Entwurf.

## Prüfungen und Baseline

- 17 neue S2.4-Formularprüfungen PASS.
- 12 S1.2-Einstiegsprüfungen und 7 Manifest-/Profil-Restore-Prüfungen PASS.
- 15 unveränderte S2.3-Persistenz-/Rollenprüfungen und 9 S2.2-Formularprüfungen PASS.
- Volltest: **1584/97 → 1601/97**. Exakt dieselben 97 Fehlernamen und Häufigkeiten;
  17 zusätzliche grüne Prüfungen, zwei absichtlich aktualisierte S1.2-Testtitel,
  keine fehlenden Bestandsprüfungen. Maschinenlesbar: `SIGEKO_S2_4_TESTVERGLEICH.json`.
- Volltest auf gestagtem Kandidaten: ältere Restarbeiten-Tests prüfen außerhalb des
  Runners die unstaged Dateiliste gegen historische Allowlisten und würden sonst
  ganze Gruppen vorzeitig abbrechen. Keine Testschwächung; alle tatsächlichen
  Änderungen wurden über den staged Diff geprüft und laufen wie im sauberen CI-Checkout.
- `git diff --check` grün.

CI und praktische Prüfung: https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34266138586
Windows/Linux verwenden dieselbe vorhandene isolierte Abnahmeplattform, echten
Produktionsscreen, Preload, unveränderte SiGeKo-IPC, gemeinsamen firmDirectory-
Registrar, aktuellen Lizenzguard und SQLite unter ausschließlicher SiGeKo-Lizenz.
Echte Mausklicks speichern Profil/Rollen; geprüfte Abläufe: zwei Projekte mit einem
Profil, andere freie Planung/eigene Ausführung, zentrale und Projektkontakte,
Projektgrenze, wie Planung, DB-Neuöffnung, Archiv- und Lizenzsperre. Reale Editor-
Fontänderung lässt sämtliche geprüften Fachdatentabellen unverändert.

CI 34266138586: **Windows und Linux vollständig PASS**, jeweils 13 S2.1-, 15 S2.3-,
9 S2.2- und 17 S2.4-Prüfungen sowie beide echten Electron-Formularabläufe. Beide
S2.4-Reports: ok=true, rendererErrors=[], manualConfirmed=false. Screenshots für
Profil/Rollen in breitem und schmalem Fenster gesichtet: lesbare getrennte Felder,
keine sichtbare horizontale Überlagerung; schmale Rollen stehen untereinander.
Geometrieprüfung bestätigt Label oberhalb und Felder innerhalb von Parent/Viewport.

Reparaturrunde ausschließlich am Testharness: erster grüner Lauf 34265694200 hatte
unter Windows zwei identische breite Screenshots durch noch nicht gezeichneten
Scrollstand. Zwei Animationsframes vor capturePage ergänzt; zweiter vollständiger
Windows-/Linux-Lauf grün, Windows-Bildnachweise jetzt unterschiedliche korrekte
Profil-/Rollenansichten. Abnahmecommit: `0b39500f5503fcac21c74db2329a5b6a1d7b7b65`,
Tree `5857a6be965369e41f7261629017a5a6eae20025`; gegenüber dem Volltestprodukt einzig
diese Einzeilenänderung im Screenshot-Harness. Produktcode unverändert.
Artefakte im Workflow: `sigeko-project-form-ubuntu-latest` und
`sigeko-project-form-windows-latest` mit JSON und jeweils vier PNGs.

Die allgemeinen npm-CI-Läufe 34265694206/34266138412 bleiben rot: dort fehlt wie zuvor das
UI-Editor-kit; dazu bekannte Popup-/Lizenzfehler. Dieser Lauf ist kein vollständiger
S2.4-Prüfnachweis. Der vollständige lokale Vergleich und der dedizierte Workflow mit
korrekt eingebundenem Kit bilden die technische Prüfung.

## Review und Arbeitsmodus

Goal-Arbeitslauf mit unabhängigen Unteraufgaben: UI-Vertragsanalyse und isolierter
Abnahmeharness; funktionale Formularprüfungen; unabhängiges Quellenreview mit
Nachprüfung. Review fand eine Protokoll-Kopplung der zunächst verwendeten alten
Kontaktkanäle. Umgestellt auf gemeinsame firmDirectory-APIs; Ersatzadapter im
Abnahmelauf entfernt. Nachprüfung: Blocker behoben, kein Restbefund im geprüften Delta.

Computer-Use lokal nicht verfügbar (kein DISPLAY/Xvfb). Automatische tatsächliche
Electron-Bedienung erfolgt auf den Windows-/Linux-CI-Rechnern; reine Start-/Unitchecks
werden nicht als praktische Abnahme gezählt. Das native Editorfenster und der native
Logo-Dateidialog wurden nicht manuell bedient; keine gegenteilige Behauptung.

Erfüllte Kriterien: Paketumfang, Daten-/Entwurfsisolation, gemeinsame Infrastruktur,
vollständiger M83-Vertrag, Baselinevergleich, Review und veröffentlichter Draft-PR.
Offen: manuelle fachliche Windows-Abnahme nach #274 B6 und anschließender Merge.

## Manuelle Windows-Abnahme

Im bestehenden BBM-Entwicklungscheckout auf den PR-Branch wechseln:

```powershell
git fetch origin
git switch codex/sigeko-s24-grunddaten
npm run test:sigeko:s2.4:form:manual
```

Der Starter verwendet ausschließlich ein isoliertes Testprofil und führt zunächst
den automatischen Ablauf aus. Anschließend führen Dialoge durch:

1. Eigenes Profil: Name `Manueller SiGeKo`; Profil speichern.
2. Planung: `Freie Angaben`, Name `Manuelle Planung`.
3. `Ausführung wie Planung` ausschalten; Ausführung `Eigenes SiGeKo-Profil` wählen.
4. Projektrollen speichern. Das Projekt wird nach DB-Neuöffnung erneut angezeigt.
5. Werte und Bedienbarkeit prüfen, nochmals Projektrollen speichern und ausdrücklich
   `Geprüft – bestanden` wählen.

Nur danach steht im Ergebnis `manualConfirmed: true`. Der Starter nennt den absoluten
Pfad zu `sigeko-project-form-result.json`. Diesen PASS samt Ergebnisdatei oder
Terminalausgabe zurückmelden. Bis dahin bleibt #328 Draft; kein Merge und kein
Beginn des folgenden Readiness-Pakets. Die native Logoauswahl kann zusätzlich im
isolierten Formular geprüft werden; der automatische Lauf prüft keinen Dateidialog.

## Geänderte Dateien

- `src/renderer/modules/sigeko/SigekoScreen.js`
- `src/renderer/modules/sigeko/SigekoScreen.uiEditorContract.js`
- `src/renderer/ui-editor/m80Registry.js` (nur Registry-Version)
- `ui-editor-target.json`
- `scripts/tests/sigekoGrunddatenForm.test.cjs`
- `scripts/tests/sigekoEntryAcceptance.test.cjs`
- `scripts/tests/sigekoEditorManifest.test.cjs`
- `scripts/tests/sigekoProjectFormAcceptance.html`
- `scripts/runSigekoProjectFormAcceptance.cjs`
- `scripts/testGroups.cjs`
- `package.json`
- `.github/workflows/sigeko-projects.yml`
- `docs/SIGEKO_S2_4_UI_ENTWURF.md`
- `docs/SIGEKO_S2_4_GRUNDDATEN.md`
- `docs/SIGEKO_S2_4_TESTVERGLEICH.json`
- `STATUS.md`
