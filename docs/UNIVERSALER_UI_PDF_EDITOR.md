# Universeller UI- und PDF-Editor: Registrierungsvertrag

## Zielzustand

Der UI-Editor-kit-Core, die BBM-Session, der allgemeine Launcher, Selection,
Scope-Wechsel sowie Save/Load/Reset sind fachneutral. Fachwissen liegt nur in
expliziten App- und Modulregistrierungen. Nicht registrierte UI- oder PDF-Ziele
existieren für den Editor nicht; automatische DOM- oder PDF-Erkennung ist
ausgeschlossen.

Die appseitige Sammelstelle ist
`src/renderer/app/modules/moduleEditorRegistrations.js`. Sie ist kein
Editor-Core, sondern der explizite BBM-Modulkatalog für Editor-Konsumenten.
`src/renderer/ui-editor/m80Registry.js`, die Runtime-Factory und der Launcher
lesen ausschließlich diesen Katalog.

## So wird ein neues UI editorfähig

1. Das Fachmodul deklariert komponentennahe Verträge mit stabilen Scope-,
   Element-, Parent- und Ref-IDs, Baselines, `allowedOps`, `lockedOps` und
   Operationseffekten. Die produktive Komponente bindet die expliziten Single-
   oder Multi-Refs.
2. Das Fachmodul exportiert genau eine UI-Registrierung mit
   `scopeGroupId`, `layoutStorageKey`, `registryVersion`, `scopeIds`,
   `componentContracts`, optionalem Launcher, optionalem PDF-Dokumenttyp und
   optionalen deklarativen Profilmigrationen.
3. Falls die ältere Inspector-Runtime für den Scope benötigt wird, liefert
   dieselbe Fachregistrierung `editorRuntimeScopes` einschließlich
   `createHostAdapter`.
4. Die Registrierung wird einmal in den appseitigen
   `moduleEditorRegistrations`-Katalog aufgenommen. Editor-Core, M80-Registry,
   Session, allgemeiner Launcher, Selection, Profilverwaltung und IPC bleiben
   unverändert.

Eine additive Layoutprofilmigration wird fachseitig als `additiveElement` mit
Scope, From-/To-Fingerprint, neuer Element-ID, erwartetem Parent und
Archivbezeichnung registriert. Die Session archiviert das Altprofil und führt
die Beschreibung generisch aus. Fach- oder Datenmigrationen sind dort verboten.

## So wird ein neuer PDF-Typ editorfähig

1. Der dokumenttypspezifische Fachadapter stellt Contract, Registry, Baseline,
   Layoutzustand, Operationen, Vorschau-Metadaten und Profilzugriff bereit.
2. Sein Main-seitiger Registrar ruft einmal `registerPdfEditorAdapter` mit
   `documentTypeId`, `layoutStorageKey`, Adapter und Regeneration auf. Die
   Regeneration kann vollständig fachseitig als `regenerate(context)`
   registriert werden. Bestehende gemeinsame Druckdienste dürfen alternativ
   über `buildRegenerationRequest(context)` genutzt werden.
3. Der Fachbootstrap importiert den Registrar. Der zentrale UI-Editor-IPC
   enthält weder Dokumenttyp, Profilpfad noch Druckmodus; der Resolver wählt den
   Adapter ausschließlich über den aktiven `documentTypeId`.

Jeder PDF-Typ erhält unter der gemeinsamen Profilbasis seine eigene Wurzel aus
`layoutStorageKey`. Paginierung, Datensatzteilung, Tabellenkopfwiederholung,
Kopfart, Fußreserve und `setPageBreakRule` bleiben außerhalb der
Editoroperationen im jeweiligen BBM-Renderervertrag.

## Architektur-Guardrails

- `scripts/tests/universalEditorArchitecture.test.cjs` registriert ein neutrales
  UI mit drei Scopes und einen neutralen zweiten PDF-Typ. Es prüft Registry,
  Sessionöffnung, Scope-Gruppe, Elemente, bidirektionale Selection,
  Move/Resize/TextResize/Visibility, getrenntes Save/Load/Reset,
  Modul-/Dokumentwechsel, Profiltrennung und registrierte Regeneration.
- Derselbe Test scannt die definierten generischen Infrastrukturdateien auf
  Fachentscheidungen. Die neutralen Fixture-Namen dürfen dort ebenfalls nicht
  auftreten.
- `scripts/tests/m86-15UniversalEditorContract.test.cjs` prüft den universellen
  Operationsvertrag an allen produktiven Komponenten und Refs.
- `scripts/tests/m86-24VisibleEditorAcceptance.test.cjs` bedient den realen
  nativen Editor für Protokoll und Restarbeiten und prüft Save, Close und
  Neustart-Restore mit getrennten Profilen.
- `scripts/tests/m85PdfSatzvertrag.test.cjs` schützt Renderer, Paginierung,
  Seitenzahl, Struktur-Goldens und den dokumenttypneutralen Profilweg.
