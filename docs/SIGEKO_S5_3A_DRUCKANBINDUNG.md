# S5.3a – gemeinsamer Druckkontext und expliziter Modulzugang zur Firmenliste

Aktives einzeln abgegrenztes Paket nach integrierter S5.2. Frisch geprüfter main `93bdf8837a6e8b00b6e9fe467bb9b0897d8dd6ca`, Branch `codex/sigeko-s53a-shared-print-access`. #274/#277 und letzter bestätigter Kommentarstand am 2026-09-09 erneut gelesen; keine neue abweichende Festlegung. Fachliche Grundlage: #274/#277/#251, S5-Paketplan. Rechnung #275 bleibt eingefroren.

## A–F-Entwurfsentscheidung

A. Technischer Anschluss einer vorhandenen PDF-Ausgabe; keine neue UI, keine neue Dokumentstruktur und kein geänderter Satz.
B. Keine neue Editorfreigabe. Bestehende Firmenkarten, PrintShell, Pager und V2-Köpfe bleiben unverändert. Das Paket erzeugt weder neue Targets noch eine Firmenlisten-Registry.
C. Neue editorrelevante Elemente: keine. Daher keine neuen data-ui-inspector-id/kind/label/parent/editable/ops; bestehende Descriptoren bleiben identisch. Keine neue Inhalts- oder Bedienliste.
D. Modul-/Lizenzprüfung, Auflösen eines Projektpfads, Laden des Druckkontexts, Erzeugen und Ablegen einer PDF sind Fach-/Infrastrukturaktionen, keine Editoroperationen.
E. Bestehende PDF-Parent-/Satzstruktur unverändert. Daten erhalten explizite Modulidentität über beide vorhandenen print:init-Wege und print:getData.
F. Neue Verhaltensprüfungen für Identität, Lizenzentzug, Projekt-/Zielvalidierung und echte Dateischreibgrenze im vorhandenen Printjob; Kontextgleichheit mit existierender Ausgabe. Bestehende Print-/Storage-/Provider-Tests und exakter Volltestvergleich. Keine neue visuelle Formular-PDF-Abnahme in diesem technischen Anschluss. PDF-V2-SATZ-001/002/003/005/013 bleiben geschützt; Renderer, Paginierung, Schriften und Geometrien werden nicht geändert.

## Ausgangsbasis / Integration

Führend ist ausschließlich der frisch integrierte main; keine Übernahme anderer Branches. Die fehlende gemeinsame Firmenlistenfreigabe und Kontextauflösung werden in diesem kleinen Querschnittspaket ergänzt. Bestehende Moduldefinition/FeatureGuard/ProjectStorageAccess und Printjob bleiben Eigentümer. Konfliktprüfung vor Abschluss: Print-IPC, Lizenz/Projekt/Storage, Providerregressionen; kein neuer Fachprozess und keine Änderung an Rechnung. Ausgangsbaseline 1822 PASS / 97 bekannte Fehler.

## API und Dateigrenze

Main-interner getPrintRuntimeContext({mode,projectId,meetingId,settingsOverride,orientation})-Wrapper um dieselbe _buildPrintRuntimeContext-Funktion; keine neue IPC. Druckdaten/Settings/Projektlogos/Nutzerprofil entstehen im vorhandenen gemeinsamen Aufbau.

Bestehende printPdf/printPdfAndOpen/printPdfAndPreviewInternal können für mode:'firms' eine ausdrücklich gesetzte kanonische moduleId und storage:{target:'Unterlagen'} transportieren. Nur ausdrückliche Identität aktiviert diesen Weg; eine ungültige explizite Identität darf nie auf Protokoll zurückfallen. Andere Modi mit dieser neuen Anfrageform werden abgewiesen. Legacy ohne moduleId behält seinen bisherigen Vertrag.

PDF-Capability und aktuelle Modullizenz prüfen. Projekt muss zentral existieren; keine vom Renderer gelieferte Projektkopie als Pfadquelle. Storage über vorhandenen createProjectStorageAccess. temp bleibt ausdrücklich mögliche Vorschau, keine freie targetDir-/overwrite-Umgehung. Vor Vorbereitung sowie vor und nach printToPDF erneut prüfen; bei Lizenzentzug keine Datei.

Produktdateien begrenzt auf src/main/print/printData.js, src/main/ipc/printIpc.js und gegebenenfalls einen kleinen neutralen Requesthelper in src/main/print. Kein PrintShell-/printApp-/Preload-/Firmenkarten-/Pager-/Invoicecode. Kein neuer Profilstore, Druckprozess oder gespeicherte-Firmen-PDF-Suchpfad.

## Prüfungen

Getrennter tatsächlicher Request-/Printjobtest: SiGeKo-only zulässig; Protokoll-only für SiGeKoauftrag verweigert; unbekanntes Modul, fehlendes Projekt, fremdes Ziel, anderer Modus und Pfadumgehung vor Daten-/Dateizugriff verweigert. Identität bis print:getData erhalten. Entzug während printToPDF verhindert writeFileSync. Bestehender Legacyjob unverändert. Headerkontext mit vorhandenen Einstellungen, Projektsettings, Nutzerprofil und Logos identisch; keine TOP-/Invoice-Fachdaten laden.

Nach Tests, Review, PR und Integration folgt getrennt das tatsächliche VA-Snapshot-/PDF-Paket mit vollständiger eigener Dokumententscheidung und realen PDF-Guardrails.
