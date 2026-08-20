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
   `documentTypeId`, `moduleId`, `scopeId`, `profileStorageKey`, Vertrags- und
   Descriptorversion, expliziter Registry, Adapterfactory und Regeneration auf. Die
   Regeneration kann vollständig fachseitig als `regenerate(context)`
   registriert werden. Bestehende gemeinsame Druckdienste dürfen alternativ
   über `buildRegenerationRequest(context)` genutzt werden. In diesem
   gemeinsamen Weg setzt der Resolver `documentTypeId` und Orientierung aus
   dem aktuell wirksamen Descriptor; ein fachseitiger Payload kann die
   registrierte Seitenausrichtung nicht übersteuern.
3. Der Fachbootstrap importiert den Registrar. Der zentrale UI-Editor-IPC
   enthält weder Dokumenttyp, Profilpfad noch Druckmodus; der Resolver wählt den
   Adapter ausschließlich über den aktiven `documentTypeId`. Ein unbekannter
   Typ darf niemals auf einen Standardtyp zurückfallen.
4. In DEV meldet ein vollständiger, noch nicht akzeptierter Descriptor
   `unregistered`. Der allgemeine Launcher zeigt dann den Registrierungsdialog.
   Die Annahme persistiert den Descriptor-Snapshot; Produktbuilds zeigen keinen
   Registrierungsbutton und verwenden nur bereits akzeptierte Typen.
5. Spätere Descriptoren werden gegen den akzeptierten Snapshot verglichen.
   Neue vollständige Elemente können gesammelt additiv übernommen werden.
   Fehlende oder inkompatible Elemente werden diagnostiziert, aber nicht
   gelöscht oder still überschrieben. Vor Änderungen werden Registry und
   betroffenes Layoutprofil archiviert; vorhandene Layoutwerte bleiben erhalten.

Jeder PDF-Typ erhält unter der gemeinsamen Profilbasis seine eigene Wurzel aus
`profileStorageKey`. Registry-/Vertragsdaten und Layoutwerte liegen in getrennten
Dokumenten. Paginierung, Datensatzteilung, Tabellenkopfwiederholung,
Kopfart, Fußreserve und `setPageBreakRule` bleiben außerhalb der
Editoroperationen im jeweiligen BBM-Renderervertrag.

## Architektur-Guardrails

- `scripts/tests/universalEditorArchitecture.test.cjs` registriert ein neutrales
  UI mit drei Scopes und einen neutralen zweiten PDF-Typ. Es prüft Registry,
  Sessionöffnung, Scope-Gruppe, Elemente, bidirektionale Selection,
  Move/Resize/TextResize/Visibility, getrenntes Save/Load/Reset,
  Modul-/Dokumentwechsel, Profiltrennung und registrierte Regeneration. Eine
  neutrale Dreispaltentabelle prüft zusätzlich jede stabile `TableColumn`-ID
  gegen ihren eigenen Renderer-Track, Tabellenkopf und ihre Datenzelle. A20,
  B30 und C40 werden unabhängig auf 10/50/0 und zurück gesetzt; Empfehlungen,
  rechte Arbeitsbereichsgrenze, getrennte konstante Grenzoperation,
  0-mm-Profilneustart und lückenlose Renderer-Reaktivierung sind verriegelt.
- Derselbe Test scannt die definierten generischen Infrastrukturdateien auf
  Fachentscheidungen. Die neutralen Fixture-Namen dürfen dort ebenfalls nicht
  auftreten.
- `scripts/tests/m86-15UniversalEditorContract.test.cjs` prüft den universellen
  Operationsvertrag an allen produktiven Komponenten und Refs.
- `scripts/tests/pdfDocumentTypeRegistration.test.cjs` prüft exakte Auflösung,
  Duplikate, A/B/C → A/C → A/B/C, additive Erweiterung um D,
  inaktives/wiederkehrendes B mit Werterhalt,
  Archivierung, Restart-Persistenz, unvollständige neue Elemente und einen
  dritten neutralen Provider ohne Core-Änderung. Zwei weitere neutrale
  Descriptoren beweisen Portrait und Landscape; derselbe Test verriegelt
  Protokoll als Portrait und Restarbeiten als Landscape.
- `scripts/tests/restarbeitenPdfEditorRegistration.test.cjs` prüft den realen
  Restarbeiten-Descriptor mit 9 sichtbaren Spalten, die inaktiven historischen
  Einzelspalten, den unveränderten Profilwert, den eigenen Profilkey und die
  Regeneration über den bestehenden V2-Druckweg.
- `scripts/tests/restarbeitenPdfVisibleAcceptance.test.cjs` bedient den
  Restarbeiten-PDF-Bereich im nativen Editor: getrennte Grenzoperation,
  Nr 9→5 bei unveränderter Klasse 10, physischer Mauszug an der sichtbaren
  rechten Spaltenkante, Nr 0 mit Baumidentität/Neustart sowie Reaktivierung
  auf 9 mm und erneuter Neustart laufen in isolierten Profilwurzeln.
- `scripts/tests/m86-24VisibleEditorAcceptance.test.cjs` bedient den realen
  nativen Editor für Protokoll und Restarbeiten und prüft Save, Close und
  Neustart-Restore mit getrennten Profilen.
- `scripts/tests/m85PdfSatzvertrag.test.cjs` schützt Renderer, Paginierung,
  Seitenzahl, Struktur-Goldens und den dokumenttypneutralen Profilweg.

Der akzeptierte PDF-Dokumenttypdatensatz trennt aktuelle Sicht und Historie:
`registry` enthält alle kompatibel bekannten Definitionen,
`activeElementIds` projiziert den aktuellen Descriptor und
`inactiveElementIds` dokumentiert derzeit fehlende IDs. Der Editor erhält nur
die aktive Projektion. Das strikt validierte aktive PDF-Hauptprofil enthält
ebenfalls nur diese Projektion; inaktive Layoutzustände liegen in der
benachbarten dokumenttypneutralen PDF-Profilhistorie, die keine Registry- oder
Contractdefinitionen enthält. Bei kompatibler Wiederkehr wird derselbe Zustand
wieder aktiv; inkompatible Wiederkehr bleibt durch die vorhandene
Konfliktprüfung gesperrt. Es gibt weder physische Profilwertlöschung noch
dokumentartspezifische Core-Logik.
