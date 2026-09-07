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
- Native Windows/.NET-10-Vertragsprüfungen sind vorbereitet, lokal mangels .NET
  nicht ausführbar. Dazu gehört ein CI-Job mit separater Basis-/Head-Prüfung im Kit.
- Automatische Freigabeprüfung hat den Kit-Push wegen fehlender expliziter
  Veröffentlichungsfreigabe abgelehnt. Kein Push/PR/Merge als erfolgt behauptet.

S1.4/S1.4a bleiben bis zum bestandenen nativen Vertragsnachweis blockiert.
Gesicherter alter S1.4a-Arbeitsstand wurde nicht eingespielt. S1.5 nicht begonnen.
Eine echte Overlay-PDF, Editorbedienung, Windows-Paketierung oder Druckpipeline
sind kein in diesem Vertragspaket erbrachter Nachweis.
