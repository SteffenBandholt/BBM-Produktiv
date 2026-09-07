# PDF-Editorvertrag – fachneutrales Vorpaket zu SiGeKo S1.4a

Basis BBM main: a2ed5f8e7fdcd32116be780418d3cbd89f36e99c (mit beiden PDF-Blankovorlagen).
Basis UI-Editor-kit main: 0240ef870dda7caaec7e639a6f5bf262b8037bc8.
Führende Planung: #277 / #274; S1.1–S1.3 abgeschlossen, Rechnung #275 eingefroren.

## Entwurfsentscheidung

Dieses Paket verändert PDF-Vertragsmetadaten, keine sichtbare UI/PDF-Struktur.
Die bestehende gemeinsame Infrastruktur erhält ein explizites
`layoutModel: "fixed-layout"`; fehlend oder `"tabular"` bleibt Legacy.
Die führende fachneutrale Entscheidung liegt im UI-Editor-kit unter
`docs/PDF_FIXED_LAYOUT_CONTRACT.md` (K16/M81).

Der Host deklariert ausschließlich tatsächlich vorhandene Layoutziele mit IDs,
Scope, Parent, Kind/Rolle, Ref-/Renderer-Key, Reihenfolge, Baselines/Grenzen und
Operationen. Root Dokument -> genau eine Seitenvorlage -> Overlay oder bewusst
registrierter Bereich/Gruppe -> Text/Wert/Bild. Es gibt keine neuen produktiven
Elemente, Buttons, Felder, Tabellen oder Fachaktionen. Technische Testfixtures
sind vollständig deklariert und nicht produktiv registriert.

JS- und nativer Vertrag erlauben nichttabellarische Dokumente und explizite
A0–A6/custom-Millimeterseiten (A2 quer: 594 × 420). Vorhandene Tabellen benötigen
weiterhin klassifizierte Spalten. Parent-/ID-/Operations-/Fachdatenprüfungen bleiben
verbindlich. Satzlogik, Seitenzuweisung und `setPageBreakRule` bleiben Hostbesitz.
Kein Print-Renderer und keine V2-Satzregel wird verändert.

## BBM-Anschluss

- `declarativePdfAdapter.cjs`: fixed-layout-Profilhash erhält denselben Modell-/
  Format-/Orientierungs-/Maßpräfix wie der native Kit-Profilhash. Legacy bleibt
  bytegleich. Modell-/Seitenwechsel kann nicht als additive Profilmigration laufen.
- `pdfDocumentTypeRegistry.cjs`: Kandidat, akzeptierte Registry, aktive Projektion
  und additive Synchronisation verwenden weiter denselben Kit-Validator.
  Modellwechsel und fixed-layout-Seitenwechsel sind inkompatibel und ersetzen
  keinen akzeptierten Bestand stillschweigend.
- Sieben neue Integrationstests in bestehender Testgruppe. Keine neue Infrastruktur.
- BBM verwendet weiterhin seine vorhandene `file:../UI-Editor-kit`-Abhängigkeit.
  Beide Repositories müssen mit diesem zusammengehörigen Vertragspaket vorliegen.

## Abnahme und Stand

- Gezielte BBM-Integration: 7/7 grün.
- Unverändertes aktuelles main mit altem Kit: 1499 grün / 99 bekannte Fehler.
- Sauberer Kandidaten-Volltest: 1506 grün / exakt dieselben 99 Fehlernamen.
  Keine fehlenden bisherigen Tests, sieben neue bestandene Fälle.
- Protokoll/Restarbeiten/Rechnung: Descriptorbytes, Registryfingerprints und native
  Profilhashes im Basis-/Kandidatenvergleich identisch; alle drei validieren.
- Kit: neue Suite 8/8; bestehende M81-Suite grün. Sämtliche npm-Teilbefehle einzeln
  gegen Basis geprüft: 64/5 vorher, 65/5 danach, dieselben fünf Baselinefehler.
  `npm test` stoppt bereits auf Basis am lokalen Pipe-EPERM; vier weitere
  vorhandene Snapshot-/Quelltextassertionen sind unverändert rot.
  `npm pack --dry-run`, `npm run release:check` und Vertrags-Selbsttest grün.
- Vollständige Fehlernamen und SHA256-Nachweise: PDF_FIXED_LAYOUT_TESTVERGLEICH.json.
- Der erste während paralleler Änderungen gestartete BBM-Lauf wurde verworfen:
  bestehender unstaged-diff-Guard brach eine Gruppe ab. Maßgeblich sind getrennte
  saubere Basis/Kandidaten mit vollständigem Prüffallvergleich.
- Native Windows/.NET-10-Vertragsprüfungen wurden nach Freigabe in CI ausgeführt;
  lokal fehlt .NET. Ergebnis und Baseline stehen im CI-Abschluss unten.
- Die erste Veröffentlichungsblockade wurde durch ausdrückliche Nutzerfreigabe
  aufgelöst. Die beiden Prüf-PRs sind veröffentlicht; Nachweise folgen unten.

Historischer Zwischenstand vor der Freigabe: S1.4/S1.4a waren bis zum nativen Vertragsnachweis blockiert.
Gesicherter alter S1.4a-Arbeitsstand wurde nicht eingespielt. S1.5 nicht begonnen.
Eine echte Overlay-PDF, Editorbedienung, Windows-Paketierung oder Druckpipeline
sind kein in diesem Vertragspaket erbrachter Nachweis.

## CI-Abschluss nach Veröffentlichungsfreigabe

Die Veröffentlichung wurde ausdrücklich freigegeben. Über die GitHub-Anbindung
wurden die lokal geprüften Trees bytegleich übertragen; der direkte Git-CLI-Push
hatte keine Anmeldung. Prüf-PRs: UI-Editor-kit #93 / BBM-Produktiv #321.

Nativer Nachweis: https://github.com/SteffenBandholt/UI-Editor-kit/actions/runs/34160014785
- Basis 0240ef8: 34 bestanden / 1 fehlgeschlagen / 0 übersprungen.
- Kit-Codehead 689ab1f0ba0be94094edeeccba8dc1cb8522c9ae:
  42 bestanden / 1 fehlgeschlagen / 0 übersprungen, acht neue Tests bestanden.
- Identischer Fehlername: VisibleUiPdfEndToEndUsesTwoRealProcessesAndCleansArtifacts.
  In beiden Jobs derselbe Prozess-Exitcode -1073741811; kein neuer Vertragsfehler.
- Der zunächst gefundene neue Analyzerfehler MSTEST0037 wurde ausschließlich
  durch Assert.HasCount im Test korrigiert. Der Folgelauf kompiliert erfolgreich.
- Der vollständige native Prüflauf ist wegen der genannten Baseline weiterhin rot.
  Sichtbare Windows-Editorbedienung wird nicht als abgenommen behauptet.

Kit-Standard-CI bleibt bei der schon lokal auf Basis reproduzierten M82.3-
Quelltextassertion rot (erwartetes altes 860/1260-Dreispaltenlayout).
BBM-Standard-CI #1041 bleibt bei den acht bekannten Popup-/Lizenzfehlern und
fehlendem ui-editor-kit im vorhandenen CI-Aufbau rot. Maßgeblicher vollständiger
BBM-Paketvergleich mit echtem Kit bleibt 1499/99 -> 1506/99 ohne neue Fehler und
mit vollständigem bisherigen Fallinventar.

Das fachneutrale Vertragspaket ist technisch geprüft. PR-/Mergezuordnung wird
in BBM #274 dokumentiert. Danach kann S1.4a als eigenes Paket fortgesetzt werden.
S1.4a ist durch dieses Vertragspaket noch nicht implementiert oder abgenommen;
S1.5 nicht begonnen, Rechnung #275 bleibt eingefroren.
