# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M13.6a abgeschlossen (Panel ist aus dem Header gelöst und bleibt verschiebbar). K19.16a abgeschlossen (neutraler BBM-UI-Editor-Aktivmodus zeigt festen Registry-Scope).

Aktueller Stand:
- M1 bis M13.6a abgeschlossen.
- K19.40 abgeschlossen: BBM hat eine renderer-kompatible Bridge fuer die UI-Editor-kit Panel-Runtime vorbereitet; der Launcher nutzt sie noch nicht produktiv.
- K19.39 abgeschlossen: BBM prueft den offiziellen UI-Editor-kit Panel-Runtime-Importvertrag `ui-editor-kit/runtime/panel` per CommonJS und ESM; keine produktive Launcher-Umstellung.
- K19.38 abgeschlossen: Panel-/Drag-/Rendering-Logik im BBM-Launcher inventarisiert und Trennschnitt BBM vs. UI-Editor-kit dokumentiert; keine Codeverschiebung.
- K19.37 abgeschlossen: Lokaler Standard-Bezugsweg fuer das UI-Editor-kit dokumentiert und mit `npm run check:ui-editor-kit` pruefbar gemacht; keine Runtime-/Launcher-Aenderung.
- K19.36 abgeschlossen: Abschlussmarker fuer die UI-Editor Preview-Runtime-Rueckfuehrung gesetzt; BBM ist Konsument, UI-Editor-kit ist Quelle, keine Funktionsaenderung.
- K19.30 abgeschlossen: Historisch wurde ein neutraler Export-Einstieg fuer die generische Preview-Runtime unter `src/renderer/editorRuntime/preview/index.js` vorbereitet; durch K19.35 ist diese lokale Runtime entfernt.
- K19.31 abgeschlossen: BBM wurde gegen die im externen UI-Editor-kit umgesetzte Preview-Runtime abgeglichen; die APIs und Datenstrukturen sind kompatibel. Die damals noch offene produktive Import-Umstellung ist durch K19.33/K19.36 abgeschlossen.
- K19.32 abgeschlossen: BBM prueft den offiziellen Kit-Importvertrag `ui-editor-kit/runtime/preview` testweise ueber eine lokale `file:../UI-Editor-kit`-Dependency; CommonJS und ESM funktionieren, eine produktive Launcher-Umstellung erfolgte nicht.
- K19.33 Hotfix abgeschlossen: `BbmUiEditorRuntimeLauncher.js` nutzt die Preview-Runtime produktiv aus dem UI-Editor-kit ueber die renderer-kompatible Bridge `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`; die damals noch vorhandenen lokalen BBM-Preview-Dateien wurden durch K19.35 entfernt.
- K19.34 abgeschlossen: Der produktive Preview-Runtime-Pfad Kit -> browserfaehiges ESM -> BBM-Bridge -> Launcher ist per Guardrail und Paritaetstest abgesichert; keine Verhaltensaenderung.
- K19.35 abgeschlossen: Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` wurde entfernt; einzige Runtime-Quelle ist das UI-Editor-kit.
- K19.29 abgeschlossen: Der harte `targetAppId`-Fallback `"bbm"` wurde aus der generischen Preview-ChangeRequest-Logik entfernt; BBM liefert seinen Ziel-App-Wert nur noch ueber HostContext/HostAdapter.
- K19.28 abgeschlossen: Die Rueckfuehrung der generischen Preview-Runtime ins UI-Editor-kit wurde damals dokumentarisch vorbereitet; durch K19.36 ist die Rueckfuehrung abgeschlossen.
- K19.27 abgeschlossen: Generische Preview-Operationen, Preview-Zielmodell und Pending-ChangeRequest-Hilfen wurden historisch unter `src/renderer/editorRuntime/preview/` ausgelagert; durch K19.35 ist diese lokale Runtime entfernt.
- K19.26 abgeschlossen: Die BBM-HostAdapter-Schnittstelle ist dokumentiert und testseitig stabilisiert; Runtime-Preview bleibt in-memory und ohne Speicherung.
- K19.25 abgeschlossen: Der Trennschnitt zwischen BBM-Hostintegration, Restarbeiten-Modulankern und generischer UI-Editor-Runtime ist dokumentiert; keine Funktionsaenderung.
- K19.24 abgeschlossen: Preview-Operationen erzeugen/aktualisieren temporaere ChangeRequests im UI-Editor-State; Reset, Verwerfen und Deaktivieren raeumen sie wieder auf.
- K19.0 abgeschlossen: erste explizite UI-Elementliste fuer das Protokoll-Modul, ohne Editor-Integration und ohne produktive UI-Aenderung.
- K19.7 abgeschlossen: installierter Einstieg unter `uiEditor/` war mit dem offiziellen BBM-Registry-Einstieg verbunden, ohne produktive UI-Aenderung.
- K19.9a abgeschlossen: `uiEditor/` enthaelt installierte UI-Editor-Artefakte; die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js`; `scripts/test.cjs` ist nicht direkt an installierte Artefakt-Testdateien gekoppelt.
- K19.13a abgeschlossen: Der BBM-Artefakttest erkennt `uiEditor.global` robust ueber `id`, `uiScope`, `uiScopeId` oder den Registry-Schluessel und verlangt `uiEditor/targetAppRegistry.js` als installiertes Pflichtartefakt.
- K19.16a abgeschlossen: Der neutrale UI-Editor-Aktivmodus zeigt den festen aktiven BBM-Registry-Scope `protokoll.topsScreen`; bei leerem Scope wird `nicht erkannt` angezeigt.

## Haken-System
- `[x]` erledigt
- `[ ]` offen
- Änderungen am Status müssen bei jedem UI-Inspektor-Auftrag nachgeführt werden.

## Meilensteinliste (Checkliste)
- [x] M1 Projektklärung fachlich freigegeben
- [x] M1.1 Projektdateien im Repo angelegt
- [x] M2 Arbeitsvertrag und Regeln finalisiert
- [x] M3 Projektgedächtnis vollständig
- [x] M4 Architektur des exportierbaren Moduls final
- [x] M5 Umsetzungsplan ohne Code final
- [x] M6 erster Code-Schritt: Modulgerüst
- [x] M7 Layout-Landkarten-Format definieren
- [x] M8 Restarbeiten als erste Pilot-Landkarte dokumentieren
- [x] M9 Restarbeiten-DOM-Markierungen minimal einführen
- [x] M10 Overlay nur anzeigen
- [x] M12 Panel zeigt erlaubte Stellschrauben
- [x] M12.1 Restarbeiten-Gruppenmarker als echte DOM-Container ergänzen
- [x] M13.2 Temporäre Vorschau auf ausgewählten Elementen
- [x] M13.2.1 Gerichtete Stellschrauben und Gruppenposition X/Y ergänzen
- [x] M13.3 Rahmen-zuerst-Bedienung mit Feldnavigation
- [x] M13.4a UI-Editor: Dev-Button und Scanstatus ohne Bearbeitung
- [x] M13.4a.1 UI-Editor: Scanstatus korrekt machen
- [x] M13.4a.2 UI-Editor: Scanroot und Listenmarker korrekt bewerten
- [x] M13.4b UI-Editor: Objektwahl ohne Bearbeitung
- [x] M13.4b.1 UI-Editor: Auswahlmodus-Schalter im Scanpanel sichtbar verdrahten
- [x] M13.5a UI-Editor-Vertrag und Restarbeiten-Rahmenlandkarte festlegen
- [x] M13.5b Pflichtstruktur-Tests für den UI-Editor-Vertrag
- [x] M13.5c Restarbeiten-UI Rahmenstruktur editorfähig vorbereiten
- [x] M13.6 UI-Editor: Rahmenmodus nur für editorfähige Rahmenziele
- [x] M13.6a UI-Editor-Panel aus Header lösen und verschiebbar halten
- [x] K19.0 BBM liefert explizite Protokoll-UI-Elementliste ohne Scan/Integration
- [x] K19.7 Installierte UI-Editor-Grundstruktur mit echter BBM-Registry verbinden
- [x] K19.9a BBM-Testeinbindung nach Neuinstallation der UI-Editor-Artefakte trennen
- [x] K19.13a BBM-Test an aktuelle UI-Editor-Installer-Artefakte anpassen
- [x] K19.16a UI-Editor zeigt festen registrierten Scope aus BBM-Registry
- [x] K19.24 UI-Editor Preview-Operationen als ChangeRequests sammeln
- [x] K19.25 UI-Editor-Trennschnitt BBM vs Kit dokumentieren
- [x] K19.26 BBM-HostAdapter-Schnittstelle stabilisieren
- [x] K19.27 Generische Preview-Runtime-Hilfen aus BBM-Launcher auslagern
- [x] K19.28 UI-Editor-kit-Rueckfuehrung der Preview-Runtime vorbereiten
- [x] K19.29 Preview-Runtime targetAppId-Fallback hostneutral machen
- [x] K19.30 Preview-Runtime Exportstruktur fuer Kit-Rueckfuehrung vorbereiten
- [x] K19.31 BBM gegen UI-Editor-kit Preview-Runtime abgleichen
- [x] K19.32 BBM prueft UI-Editor-kit Preview-Runtime Importvertrag
- [x] K19.33 BBM-Launcher nutzt UI-Editor-kit Preview-Runtime produktiv
- [x] K19.34 Produktiven Preview-Runtime-Pfad absichern
- [x] K19.35 Lokale BBM-Preview-Runtime entfernen
- [x] K19.36 Abschlussmarker Preview-Runtime-Rueckfuehrung setzen
- [x] K19.37 Lokalen UI-Editor-kit-Bezugsweg dokumentieren und pruefen
- [x] K19.38 UI-Editor Panel/Drag/Rendering inventarisieren
- [x] K19.39 UI-Editor-kit Panel-Runtime Importvertrag pruefen
- [x] K19.40 UI-Editor-kit Panel-Runtime Renderer-Bridge vorbereiten

## Statusupdate K19.40
- `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js` re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs`.
- Der Electron-Renderer darf keinen Bare-Package-Import `ui-editor-kit/runtime/panel` verwenden.
- `scripts/tests/uiEditorKitPanelRuntimeBridge.test.cjs` prueft Bridge-Existenz, relativen Kit-ESM-Pfad, verbotenen Bare-Import, verbotene Fach-/Storage-/DB-/IPC-/PDF-Begriffe, unveraenderte Preview-Bridge und fehlende Launcher-Integration.
- `scripts/test.cjs` fuehrt den Bridge-Test in `npm test` mit aus.
- `BbmUiEditorRuntimeLauncher.js` nutzt die Panel-Bridge noch nicht produktiv; produktive Panel-Modell-Integration bleibt ein eigenes spaeteres Paket.
- Keine Launcher-Umstellung, keine DOM-Aenderung, kein Drag, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-Funktionsaenderung.

## Statusupdate K19.39
- Das UI-Editor-kit stellt eine neutrale Panel-Runtime ueber `ui-editor-kit/runtime/panel` bereit.
- BBM prueft diesen offiziellen Importvertrag mit `scripts/tests/uiEditorKitPanelRuntimeImport.test.cjs`.
- Geprueft werden CommonJS und ESM, erwartete Exporte, Default-State, Positionsnormalisierung, Offen/Geschlossen-State und ein neutrales ViewModel mit Buttons.
- `scripts/test.cjs` fuehrt den Test in `npm test` mit aus.
- `BbmUiEditorRuntimeLauncher.js` nutzt das Panel-Modell noch nicht produktiv; die Integration bleibt ein eigenes spaeteres Paket.
- Keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-/DOM-Funktionsaenderung.

## Statusupdate K19.38
- `docs/UI_EDITOR_PANEL_DRAG_RENDERING_INVENTAR.md` inventarisiert die verbliebene UI-nahe Launcher-Logik.
- Dokumentiert sind Launcher-Aktivierung, Target Selection, Panel-Erzeugung, Panel-Rendering, Panel-Drag, Preview-Bedienlogik, Reset/Verwerfen, Statusanzeige, HostAdapter-Anbindung, Registry-/Scope-Aufloesung und DOM-/Renderer-spezifische Teile.
- Kitfaehige Kandidaten: Panel-State, Panel-Position, Drag-Controller, Preview-Control-Rendering, ChangeRequest-Summary-Anzeige, Reset-/Verwerfen-UI-Logik und Zielbeschreibung/Status-ViewModels.
- In BBM verbleiben CoreShell-/DEV-Kontext, konkrete Electron-DOM-Einbindung, HostAdapter-Erzeugung, Scope-/Registry-Auswahl, Kit-Bridge und BBM-spezifische Start-/Lifecycle-Orchestrierung.
- Keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik, keine Restarbeiten-Sonderlogik und keine Panel-/Drag-Funktionsaenderung.
- Empfohlener naechster technischer Schritt: neutrales Panel-State-/ViewModel-Modell im UI-Editor-kit vorbereiten.

## Statusupdate K19.37
- Standard-Root fuer Entwicklungs-Repos ist `C:\01_Projekte`.
- UI-Editor-kit liegt als eigenes Repo unter `C:\01_Projekte\UI-Editor-kit`; BBM und weitere Repos bleiben Konsumenten.
- Standardinstallation in Konsumenten-Repos: `npm install ..\UI-Editor-kit --save`.
- Erwarteter Eintrag in `package.json`: `"ui-editor-kit": "file:../UI-Editor-kit"`.
- `docs/UI_EDITOR_KIT_LOKALER_BEZUGSWEG.md` dokumentiert diesen lokalen, einfachen und reproduzierbaren Weg ohne npm-Publish, private Registry oder Monorepo-Umbau.
- `scripts/checkUiEditorKitDependency.cjs` prueft Nachbar-Repo, Kit-Preview-Runtime-Einstiege, BBM-Dependency und installierte `node_modules`-Runtime.
- Neues npm-Script: `npm run check:ui-editor-kit`.
- Keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.

## Statusupdate K19.36
- Preview-Runtime-Rueckfuehrung ist abgeschlossen.
- BBM ist Konsument der Preview-Runtime; fachliche Quelle ist ausschliesslich das UI-Editor-kit.
- Produktivpfad bleibt: UI-Editor-kit -> browserfaehiges `src/runtime/preview/index.mjs` -> `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js` -> `BbmUiEditorRuntimeLauncher.js`.
- Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` ist entfernt.
- Direkter Bare-Package-Import im Electron-Renderer bleibt verboten; die Bridge bleibt der renderer-spezifische BBM-Adapter.
- Renderer-ESM darf nicht auf `.cjs`, `require` oder `createRequire` zurueckfallen.
- Keine fachliche Erweiterung, keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine PDF-/Drucklogik und keine Panel-/Drag-/Markierungs-Aenderung.
- Naechstes separates Folgethema: produktiven Bezugsweg fuer das externe UI-Editor-kit klaeren.

## Statusupdate K19.35
- Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` wurde entfernt.
- Einzige fachliche Runtime-Quelle ist jetzt das UI-Editor-kit.
- Produktivpfad bleibt: UI-Editor-kit -> browserfaehiges `src/runtime/preview/index.mjs` -> `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js` -> `BbmUiEditorRuntimeLauncher.js`.
- `scripts/tests/editorPreviewRuntime.test.cjs` prueft die Runtime-Vertraege jetzt ueber die Bridge.
- `scripts/tests/uiEditorKitPreviewRuntimeBridgeParity.test.cjs` verbietet den lokalen Runtime-Ordner und sichert Bridge, Launcher-Importkante und Kit-ESM-Vertrag ab.
- Keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-/Markierungs-Aenderung.

## Statusupdate K19.34
- Produktivpfad dokumentiert und abgesichert: UI-Editor-kit -> browserfaehiges `src/runtime/preview/index.mjs` -> `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js` -> `BbmUiEditorRuntimeLauncher.js`.
- Direkter Bare-Package-Import `ui-editor-kit/runtime/preview` bleibt im Electron-Renderer verboten; Node-Tests duerfen den Package-Subpath weiter pruefen.
- Der Kit-ESM-Einstieg fuer den Renderer darf nicht auf `.cjs`, `require` oder `createRequire` zurueckfallen.
- `scripts/tests/uiEditorKitPreviewRuntimeBridgeParity.test.cjs` prueft Bridge, Launcher-Importkante und zentrale Runtime-Ergebnisse.
- Durch K19.35 ueberholt: Die lokale BBM-Preview-Runtime wurde entfernt.
- Keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-/Markierungs-Aenderung.

## Statusupdate K19.33 Hotfix
- `BbmUiEditorRuntimeLauncher.js` importiert die generische Preview-Runtime jetzt produktiv ueber `./uiEditorKitPreviewRuntimeBridge.js`.
- Node kann den offiziellen Package-Subpath `ui-editor-kit/runtime/preview` aufloesen; der Electron-Renderer ohne Bundler/Import-Map kann diesen Bare-Package-Specifier nicht aufloesen.
- Die Bridge re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs` und verhindert damit den weissen Screen durch den Bare-Import.
- Der Launcher nutzt weiterhin nur die benoetigten Runtime-Funktionen; Panel, Drag, Markierung, HostAdapter und DOM-Preview-Anwendung bleiben unveraendert in BBM.
- Durch K19.35 ueberholt: Die lokale BBM-Preview-Runtime wurde entfernt.
- Der Launcher-Test enthaelt Guardrails gegen Rueckfall auf `../editorRuntime/preview/index.js` und gegen direkten Bare-Import im Renderer.
- Keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.

## Statusupdate K19.32
- BBM kann den offiziellen UI-Editor-kit-Preview-Runtime-Export `ui-editor-kit/runtime/preview` testweise verbrauchen.
- `package.json` enthaelt dafuer die lokale Dependency `ui-editor-kit: file:../UI-Editor-kit`; `package-lock.json` wurde entsprechend aktualisiert.
- `scripts/tests/uiEditorKitPreviewRuntimeImport.test.cjs` prueft CommonJS und ESM, erwartete Exporte, Operation-Mapping und den neutralen Fallback `targetAppId: "unknown-host"`.
- Durch K19.33/K19.35 ueberholt: `BbmUiEditorRuntimeLauncher.js` nutzt die Kit-Bridge und die lokale Runtime wurde entfernt.
- Keine Entfernung der lokalen BBM-Preview-Dateien, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.

## Statusupdate K19.31
- BBM-Preview-Runtime und externe UI-Editor-kit-Preview-Runtime sind fachlich/technisch abgeglichen.
- Dokumentiert in `docs/UI_EDITOR_KIT_PREVIEW_RUNTIME_ABGLEICH.md`.
- Exportnamen, Operation-Mapping, `allowedOps`/`lockedOps`, `previewTargetMode`, Target-Aufloesung, `pendingChangeRequests`, `unknown-host`, `source: "preview"`, `persistent: false`, Deduplizierung, Summary und Reset je Ziel sind kompatibel.
- Abweichungen sind dokumentiert: BBM nutzt ESM, das Kit CommonJS; das Kit exportiert zusaetzlich `UI_EDITOR_ID_ATTRIBUTE` und akzeptiert boolean `true` als `parent`.
- Kein produktiver Importwechsel, keine externe Package-Abhaengigkeit, keine Speicherung, keine DB, kein IPC, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.
- Ein neuer Test gegen den externen Kit-Pfad wurde bewusst nicht ergaenzt, weil ein harter lokaler Neben-Checkout-Pfad normale BBM-Testlaeufe und CI instabil machen wuerde.

## Statusupdate K19.30
- Historisch buendelte `src/renderer/editorRuntime/preview/index.js` die generischen Preview-Runtime-Exports als neutralen Einstieg.
- Durch K19.35 ueberholt: `BbmUiEditorRuntimeLauncher.js` nutzt jetzt die Kit-Bridge und die lokale Runtime ist entfernt.
- `docs/UI_EDITOR_PREVIEW_RUNTIME_API.md` dokumentiert Zweck, Exports, erwartete Datenstrukturen, Nicht-Ziele und spaetere Kit-Nutzung.
- Die bestehende Kit-Rueckfuehrungsdoku verweist auf den vorbereiteten Export-Einstieg.
- Keine Codeuebertragung ins externe UI-Editor-kit, keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Markierungslogik-Aenderung.

## Statusupdate K19.29
- Der hart codierte `targetAppId`-Fallback `"bbm"` wurde historisch aus der lokalen Preview-Runtime entfernt; durch K19.35 ist diese lokale Runtime geloescht.
- `targetAppId` wird jetzt aus HostContext, Registry oder State gelesen; nur wenn nichts davon vorhanden ist, wird der neutrale Fallback `unknown-host` gesetzt.
- `BbmUiEditorRuntimeLauncher.js` reicht den HostAdapter-Kontext an die Preview-ChangeRequest-Logik weiter.
- BBM kann weiterhin `targetAppId: "bbm"` bekommen, aber nur ueber den BBM-HostAdapter/HostContext.
- Keine neue Preview-Funktion, keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Fachaenderung.

## Statusupdate K19.28
- Die damals vorbereitete Rueckfuehrung der generischen Preview-Runtime ins UI-Editor-kit ist inzwischen abgeschlossen und in `docs/UI_EDITOR_KIT_RUECKFUEHRUNG_VORBEREITUNG.md` dokumentiert.
- Dokumentiert sind Kit-Kandidaten, Nicht-Kit-Kandidaten, notwendige API/Exports, notwendige Kit-Tests, offene Entkopplungen, Risiken und der empfohlene naechste Schritt.
- Es wurde kein Code ins externe UI-Editor-kit uebertragen und keine Runtime-Funktion geaendert.
- Der bestehende Preview-Runtime-Guardrail-Test wurde nur um den allgemeinen verbotenen Begriff `ipc` erweitert.
- Keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Aenderung.

## Statusupdate K19.27
- Generische Preview-Hilfen wurden historisch aus `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js` in kleine neutrale Module unter `src/renderer/editorRuntime/preview/` ausgelagert; durch K19.35 ist diese lokale Runtime entfernt.
- Ausgelagert sind Operation-Mapping und `allowedOps`/`lockedOps`-Auswertung, Preview-Zielmodell (`self`/`parent`), sowie Erzeugung, Kumulierung, Deduplizierung, Zusammenfassung und zielbezogenes Entfernen temporaerer `pendingChangeRequests`.
- Der BBM-Launcher bleibt fuer DOM-Panel, Drag-Panel, HostAdapter-Anbindung, Zielauswahl und Status-Rendering zustaendig.
- Keine neue Preview-Funktion, keine Speicherung, kein localStorage, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Aenderung.
- Neue Tests nutzen `sample.screen`/`sample.field` und pruefen die generischen Module sowie Guardrails gegen Speicher- und Ziel-App-Sonderlogik.
- Naechster sinnvoller Schritt: fachliche Sichtpruefung in der echten Electron-DEV-App; danach kann ein spaeteres Paket weitere UI-Editor-kit-Rueckfuehrung vorbereiten.

## Statusupdate K19.26
- Die BBM-HostAdapter-Schnittstelle ist in `docs/UI_EDITOR_HOSTADAPTER_CONTRACT.md` dokumentiert.
- Der vorhandene Contract `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js` wurde erweitert statt eine zweite Contract-Struktur anzulegen.
- Der HostAdapter beschreibt jetzt HostContext, Registry, Layout-State, Capabilities, In-Memory-Pending-ChangeRequests und bewusst blockierte Persistenz.
- `BbmUiEditorRuntimeLauncher.js` kann mit einem HostAdapter arbeiten, bleibt aber mit den bisherigen CoreShell-Parametern kompatibel.
- `pendingChangeRequests` werden optional an den HostAdapter gemeldet, bleiben aber temporaer und nicht persistent.
- Keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.
- Naechster sinnvoller Schritt: generische Runtime-Teile fuer die spaetere UI-Editor-kit-Rueckfuehrung in kleine extrahierbare Einheiten schneiden, weiterhin ohne Speicherung.

## Statusupdate K19.25
- Der Trennschnitt zwischen generischer UI-Editor-Runtime, BBM-spezifischer Hostintegration und Restarbeiten-spezifischen Registry-/DOM-Ankern ist in `docs/UI_EDITOR_TRENNSCHNITT_BBM_VS_KIT.md` dokumentiert.
- BBM ist als Referenz-/Host-App festgehalten; generische Runtime-Teile sollen spaeter ins UI-Editor-kit zurueckgefuehrt werden.
- In BBM bleiben HostAdapter, aktive Scope-Auswahl, App-Anbindung, Registry-Resolver und Modul-Registries.
- Restarbeiten bleibt Referenzmodul; seine IDs, DOM-Anker, Registry-Eintraege und fachlichen Elementzuordnungen gehoeren nicht ins kit.
- Keine Code-Logik, keine Registry, keine Speicherung, keine Fachlogik und keine PDF-Logik wurden geaendert.
- Naechster sinnvoller Schritt: BBM-HostAdapter-Schnittstelle stabilisieren oder UI-Editor-kit-Rueckfuehrung vorbereiten, weiterhin ohne Speicherung.

## Statusupdate K19.24
- Preview-Operationen erzeugen jetzt zusaetzlich temporaere ChangeRequests im UI-Editor-State (`pendingChangeRequests`), ohne Speicherung.
- Verwendet wird die vorhandene ChangeRequest-Struktur aus `src/renderer/editorRuntime/changeRequests/` mit `changeId`, `targetAppId`, `moduleId`, `scopeId`, `elementId`, `operation`, `payload`, `createdAt` und `source`.
- Move wird je Preview-Ziel kumuliert; Width/Height werden als Delta kumuliert; Hide/Show wird als eine `visibility`-Aenderung ueberschrieben.
- Reset entfernt Preview-Styles und ChangeRequests nur fuer das aktuelle Preview-Ziel; `Aenderungen verwerfen` entfernt alle Preview-Styles und alle vorbereiteten ChangeRequests, die Auswahl bleibt erhalten.
- Weiterhin keine Speicherung, kein localStorage, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.

## Statusupdate K19.16a
- `CoreShell` uebergibt den festen aktiven Scope aus `src/renderer/uiEditor/bbmUiEditorRegistry.js` an den neutralen Runtime-Launcher.
- Der aktive Statushinweis zeigt `UI-Editor aktiv` und `Scope: protokoll.topsScreen`; leere Scope-Werte fallen auf `Scope: nicht erkannt` zurueck.
- Keine automatische Scope-Ermittlung, kein Router-Scan, kein DOM-Scan, kein Editor-Panel, kein Hover-Rahmen, keine Auswahl, keine Speicherung und keine Fachlogik.

## Statusupdate K19.13a
- `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs` erkennt den globalen UI-Editor-Scope robust ueber `id`, `uiScope`, `uiScopeId` oder einen standardisierten Registry-Schluessel.
- `uiEditor/targetAppRegistry.js` ist als neutrales installiertes Pflichtartefakt im Artefaktbestand enthalten.
- Die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js` und wird weiterhin auf `protokoll.topsScreen` und `protokoll.root` geprueft.
- Keine Ziel-App-Fachlogik in `uiEditor/`, keine Speicherung, kein Editor-Panel, kein DOM-Scan und keine automatische UI-Erkennung.

## Statusupdate K19.9a
- `uiEditor/` enthaelt installierte UI-Editor-Artefakte.
- Die BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js`.
- `scripts/test.cjs` ist nicht direkt an installierte Artefakt-Testdateien unter `uiEditor/tests/` gekoppelt.
- BBM prueft installierte UI-Editor-Artefakte ueber `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs`.
- Keine Editor-Integration, kein Panel, kein Hover-Rahmen, kein DOM-Scan, keine Speicherung und keine Fachlogik.

## Statusupdate K19.7
- Der installierte Einstieg `uiEditor/uiEditorRegistry.js` verweist jetzt auf den offiziellen BBM-Registry-Einstieg `src/renderer/uiEditor/bbmUiEditorRegistry.js`.
- `uiEditor/` bleibt als installierter Einstieg bestehen, erzeugt aber keine zweite aktive Beispiel-Registry.
- Der Beispiel-Scope ist kein aktiver Registry-Inhalt mehr.
- Keine Editor-Integration, kein Panel, kein Header-Button, kein DOM-Scan, keine Speicherung und keine produktive UI-Aenderung.
- Historische Absicherung: `uiEditor/tests/uiEditorRegistry.test.cjs`. Seit K19.9a ist `scripts/test.cjs` nicht mehr direkt an diese installierte Artefakt-Testdatei gekoppelt.

## Statusupdate K19.0
- BBM liefert fuer das Protokoll-Modul erstmals eine feste, explizit klassifizierte UI-Elementliste als Code-Artefakt.
- Die Liste beschreibt nur UI-Struktur und enthaelt keine Fachdaten, keine Datenbankwerte, keine Personen, keine Termine und keine Statuswerte.
- Keine Editor-Integration, kein DOM-Scan, keine automatische Erkennung, keine Speicherung und keine produktive UI-Aenderung.
- Abgesichert durch `scripts/tests/protokollUiEditorElements.test.cjs`.

## Definition of Done (DoD)
Ein UI-Inspektor-Meilenstein gilt nur als erledigt, wenn:
1. Ergebnis im Aufgabenheft eingetragen wurde
2. Checkliste passend aktualisiert wurde
3. offene Punkte/Risiken benannt wurden
4. der nächste konkrete Meilenstein genannt wurde
5. die Regeln aus `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md` eingehalten und geprüft wurden

## Pflichtregel
Kein Codex-Auftrag gilt als fertig, wenn das Aufgabenheft nicht aktualisiert wurde.

## M2 Abschlussnotiz
- M2 Arbeitsvertrag und Regeln finalisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `AGENTS.md`

## M3 Abschlussnotiz
- M3 Projektgedächtnis vollständig strukturiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_START_HIER.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `AGENTS.md`
- Einstiegspunkt für neue Chats und Codex-Läufe:
  - `docs/UI_INSPEKTOR_START_HIER.md`

## Lesereihenfolge für neue Chats
1. `docs/UI_INSPEKTOR_START_HIER.md`
2. `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
3. `docs/UI_INSPEKTOR_PROJEKTAUFTRAG.md`
4. `docs/UI_INSPEKTOR_ARBEITSVERTRAG.md`
5. `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
6. `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`

## Aktueller Stand für neue Chats
- Projektphase: M13.4a.1 abgeschlossen
- Projektphase: M13.4a.2 abgeschlossen
- Projektphase: M13.4b abgeschlossen
- Projektphase: M13.4b.1 abgeschlossen
- Implementierungscode: Scanpanel mit Auswahlmodus-Schaltern vorhanden
- UI-Inspector-Modul: vorhanden und im Restarbeiten-DOM testgesichert
- App-Funktionen: keine dauerhafte Speicherung, keine Layout-Dateien, keine IPC-/DB-Pfade
- M13.4a: DEV-Header scannt den aktuellen Screen nur lesend
- M13.4a.1: Scanstatus ist jetzt auf `vollständig`/`unvollständig` und Mehrfachmarker-Basis-ID umgestellt
- M13.4a.2: Listenmarker sind zeilenabhängig und werden nur bei gerenderten Einträgen hart bewertet
- M13.4b: Objektwahl war ein No-Go-Versuch und blieb unübernommen
- M13.4b.1: Auswahlmodus-Schalter sind im sichtbaren Scanpanel verdrahtet, ohne Hover/Klick/Bearbeitung

## Nächster Schritt
Als nächster Schritt folgt:
- **M13.6b UI-Editor: Hover-Rahmen wieder sichtbar machen**

Hinweis:
- M13.2.1 ist nur temporäre Vorschau, ohne Speicherung und ohne dauerhafte Layoutänderung

## Statusupdate M13.5a
- Der UI-Editor-Vertrag ist als neue verbindliche Steuerdatei dokumentiert (`docs/UI_EDITOR_VERTRAG.md`).
- Die Restarbeiten-Rahmenlandkarte ist mit einer klaren Zielstruktur für editorfähige Neuordnung festgelegt.
- Protokoll bleibt ausdrücklich unberührt; der Vertrag gilt zuerst für neue/neu strukturierte Restarbeiten-UI.
- Reines Doku-Paket ohne Code-, Test-, CSS-, IPC-, DB- oder Print/PDF-Änderungen.

## Statusupdate M13.6a
- Das UI-Editor-Panel ist nun als schwebende Oberfläche außerhalb des Header-Layouts platziert.
- Der Header bleibt bei aktivem Editor auf seiner Höhe; der Panel-Inhalt sitzt schwebend über der App.
- Ein Drag-Handle erlaubt das Verschieben des Panels im laufenden Lauf, ohne Speicherung.
- Die Hover- und Auswahllogik blieb unberührt.


## M4 Abschlussnotiz
- M4 Architektur des exportierbaren UI-Inspektor-Moduls vertieft und als Schichtenmodell konkretisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_ARCHITEKTUR.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Nächster Schritt:
  - **M5 Umsetzungsplan ohne Code finalisieren**
- Hinweis:
  - Noch kein Code, noch kein Modulgerüst


## M5 Abschlussnotiz
- M5 Umsetzungsplan ohne Code finalisiert.
- Geänderte Dateien:
  - `docs/UI_INSPEKTOR_UMSETZUNGSPLAN.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `AGENTS.md`
- Nächster Schritt:
  - **M6 erster Code-Schritt: Modulgerüst**
- Hinweis:
  - Ab M6 beginnt Code, aber nur Modulgerüst ohne sichtbare Funktion


## M6 Abschlussnotiz
- M6 erstes Code-Paket als reines UI-Inspector-Modulgerüst umgesetzt.
- Geänderte/neu angelegte Dateien:
  - `src/shared/uiInspector/uiInspectorCore.js`
  - `src/shared/uiInspector/uiInspectorRegistry.js`
  - `src/shared/uiInspector/uiInspectorStore.js`
  - `src/shared/uiInspector/uiInspectorTypes.js`
  - `src/shared/uiInspector/index.js`
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorOverlay.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `src/renderer/uiInspector/index.js`
  - `scripts/tests/uiInspectorCore.test.cjs`
  - `scripts/tests/uiInspectorRegistry.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M6 enthält nur Modulgerüst, kein Overlay, keine Restarbeiten-Anbindung, keine sichtbare App-Funktion.


## M7 Abschlussnotiz
- M7 Layout-Landkarten-Format als reines Core-/Registry-Schema definiert und mit Tests abgesichert.
- Geänderte/neu angelegte Dateien:
  - `src/shared/uiInspector/uiInspectorMapSchema.js`
  - `src/shared/uiInspector/uiInspectorRegistry.js`
  - `src/shared/uiInspector/index.js`
  - `scripts/tests/uiInspectorMapSchema.test.cjs`
  - `scripts/tests/uiInspectorRegistry.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M7 definiert nur das Layout-Landkarten-Format, noch keine echte App-Anbindung, kein Overlay, keine Restarbeiten-DOM-Markierung und keine sichtbare App-Funktion.


## M8 Abschlussnotiz
- M8 Restarbeiten als erste Pilot-Landkarte rein dokumentarisch festgehalten.
- Geänderte/neu angelegte Dateien:
  - `docs/ui-landkarten/RESTARBEITEN.md` (neu)
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests/Prüfung:
  - `git diff --stat`
  - `git diff --name-only`
  - `git status --short --branch`
- Nächster Schritt:
  - **M9 Restarbeiten-DOM-Markierungen minimal einführen**
- Hinweis:
  - M8 hat nur dokumentiert, keine DOM-Markierungen eingebaut, kein Overlay gebaut und keine sichtbare UI-Funktion ergänzt.


## M9 Abschlussnotiz
- M9 hat in der bestehenden Restarbeiten-UI ausschließlich minimale `data-ui-inspector-id` DOM-Markierungen ergänzt.
- Kein Overlay, kein Panel, keine sichtbare UI-Funktion, keine Layoutänderung, keine Fachlogik- oder Speicherlogik-Änderung.
- Geänderte/neu angelegte Dateien:
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/ui-landkarten/RESTARBEITEN.md`
- Tests/Prüfung:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M10 Overlay nur anzeigen**


## M10 Abschlussnotiz
- M10 hat ein reines Anzeige-Overlay für vorhandene `data-ui-inspector-id` Marker eingeführt.
- Enthalten: Overlay-Rahmen + Inspector-ID-Label, aktivierbar im Restarbeiten-Screen über `Strg + Alt + I`.
- Nicht enthalten: Panel, Klickauswahl, Layoutänderung, Speicherung.
- Geänderte/neu angelegte Dateien:
  - `src/renderer/uiInspector/UiInspectorOverlay.js`
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js`
  - `scripts/tests/uiInspectorOverlay.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/ui-landkarten/RESTARBEITEN.md`
- Tests/Prüfung:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M11 Bereich anklicken und Auswahl anzeigen**


## M11 Abschluss (neu)
- Status: erledigt.
- Auswahl erfolgt jetzt über eine temporäre Trefferliste am Klickpunkt (statt Handle-Ansatz aus PR #152).
- Keine Panels, keine Werteanzeige, keine Speicherung, keine Layoutänderung.
- Geänderte Dateien: `src/renderer/uiInspector/UiInspectorOverlay.js`, `src/renderer/uiInspector/UiInspectorRuntime.js`, `scripts/tests/uiInspectorOverlay.test.cjs`, `scripts/tests/restarbeitenModule.test.cjs`, `docs/UI_INSPEKTOR_AUFGABENHEFT.md`, `docs/UI_INSPEKTOR_START_HIER.md`, `docs/ui-landkarten/RESTARBEITEN.md`, `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`.
- Tests: `node scripts/tests/uiInspectorCore.test.cjs`, `node scripts/tests/uiInspectorRegistry.test.cjs`, `node scripts/tests/uiInspectorMapSchema.test.cjs`, `node scripts/tests/uiInspectorOverlay.test.cjs`, `node scripts/tests/restarbeitenModule.test.cjs`, `npm test`.
- Nächster Schritt: M12 – Panel zeigt erlaubte Stellschrauben.


## M12 Abschluss
- Status: erledigt.
- Panel zeigt nur ausgewählten Bereich und erlaubte Stellschrauben (read-only).
- Keine Werteänderung, keine Speicherung, keine Layoutänderung.
- Geänderte Dateien: `src/renderer/uiInspector/UiInspectorPanel.js`, `src/renderer/uiInspector/UiInspectorRuntime.js`, `src/renderer/uiInspector/UiInspectorOverlay.js`, `scripts/tests/uiInspectorPanel.test.cjs`, `scripts/tests/restarbeitenModule.test.cjs`, `docs/UI_INSPEKTOR_AUFGABENHEFT.md`, `docs/UI_INSPEKTOR_START_HIER.md`, `docs/ui-landkarten/RESTARBEITEN.md`, `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`.
- Tests: `node scripts/tests/uiInspectorCore.test.cjs`, `node scripts/tests/uiInspectorRegistry.test.cjs`, `node scripts/tests/uiInspectorMapSchema.test.cjs`, `node scripts/tests/uiInspectorOverlay.test.cjs`, `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/uiInspectorPanel.test.cjs`, `npm test`.
- Nächster Schritt: M13 – Werte temporär anwenden, aber noch nicht speichern.

## M12.1 Abschlussnotiz
- M12.1 ergänzt die echten DOM-Gruppenmarker für Restarbeiten als Voraussetzung für spätere Layoutänderungen.
- Gruppenmarker sitzen auf echten Container-Elementen; Feldmarker bleiben darunter.
- Runtime-Parent-Mapping ersetzt keine fehlenden DOM-Gruppenmarker.
- Geänderte Dateien:
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/ui-landkarten/RESTARBEITEN.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
- Tests:
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
- Nächster Schritt:
  - **M13 Werte temporär anwenden, aber noch nicht speichern**

## M13.2 Abschlussnotiz
- M13.2 ergänzt die temporäre Vorschau direkt auf dem ausgewählten DOM-Element.
- Originale `style.cssText`-Werte werden vor der ersten Vorschauänderung gemerkt und bei Reset wiederhergestellt.
- Gruppenmarker und Feldmarker bleiben getrennt veränderbar; Parent/Child bekommen keine direkten Inspector-Styles, solange sie nicht selbst ausgewählt sind.
- Beim Deaktivieren des Inspectors werden alle temporären Inline-Styles zurückgesetzt.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorCore.test.cjs`
  - `node scripts/tests/uiInspectorRegistry.test.cjs`
  - `node scripts/tests/uiInspectorMapSchema.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.3 temporäre Vorschau weiter absichern oder feinschärfen**

## M13.2.1 Abschlussnotiz
- M13.2.1 trennt die temporären Stellschrauben in Richtungen und Seiten auf, damit Gruppen und Felder gezielt bearbeitet werden können.
- Position X/Y wird temporär über `transform: translate(...)` umgesetzt.
- Gruppen behalten ihren Rahmen, Felder bleiben direkt einzeln veränderbar.
- Reset ausgewählt und Deaktivieren stellen die ursprünglichen `style.cssText`-Werte wieder her.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.3 Rahmen-zuerst-Bedienung mit Feldnavigation**

## M13.3 Abschlussnotiz
- M13.3 ergänzt die Panel-Kontextanzeige für Elternbereich und Kindbereiche.
- Gruppen zeigen ihre Kinder direkt als auswählbare Ziele; Felder können zum Elternbereich und zu Vorherigem/Nächstem springen.
- Die temporäre Vorschau aus M13.2.1 bleibt unverändert und weiterhin nicht-persistent.
- Keine Speicherung, kein localStorage, kein IPC, keine DB, kein CSS-Datei-Schreiben.
- Geänderte Dateien:
  - `src/renderer/uiInspector/UiInspectorRuntime.js`
  - `src/renderer/uiInspector/UiInspectorPanel.js`
  - `scripts/tests/uiInspectorRuntime.test.cjs`
  - `scripts/tests/uiInspectorPanel.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/UI_INSPEKTOR_START_HIER.md`
  - `docs/UI_INSPEKTOR_ENTSCHEIDUNGEN.md`
- Tests:
  - `node scripts/tests/uiInspectorRuntime.test.cjs`
  - `node scripts/tests/uiInspectorPanel.test.cjs`
  - `node scripts/tests/uiInspectorOverlay.test.cjs`
  - `node scripts/tests/restarbeitenModule.test.cjs`
  - `npm test`
- Nächster Schritt:
  - **M13.4 weitere UI-Inspector-Feinschärfung**
## Statusupdate M13.4a
- M13.4a ist erledigt.
- DEV-Header scannt den aktuellen Screen nur lesend.
- Keine Auswahl, keine Bearbeitung, keine Speicherung.
- Nächster Schritt: M13.4b UI-Editor-Scan weiter verfeinern, ohne Bearbeitung.

## K19.14 Abschlussnotiz
- Der installierte UI-Editor-Launcher wird in BBM im DEV-Kontext als eigenständiger Runtime-Launcher sichtbar.
- Der Launcher lädt den Button aus `uiEditor/uiEditorLauncherButton.js` und die Styles aus `uiEditor/uiEditorLauncherButton.css`.
- Der Klick toggelt nur den neutralen Launcher-State; `activeUiScope` bleibt als vorbereiteter Platzhalter `null`.
- Der alte DEV-Header-Scan bleibt deaktiviert und ist nicht Grundlage des K19.14-Launchers.
- Kein Editor-Panel, kein Hover-Rahmen, kein Editmodus, keine Speicherung, keine Fachlogik, kein DOM-Scan und keine automatische UI-Erkennung.
- Tests:
  - `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `npm test`
- Nächster Schritt:
  - Lokale Sichtprüfung im Electron-DEV-Kontext.

## K19.15 Abschlussnotiz
- Der sichtbare UI-Editor-Launcher toggelt jetzt einen neutralen Aktivmodus.
- Aktiv/inaktiv ist am Button, an `data-ui-editor-launcher-active` und am Body-Attribut `data-ui-editor-active` nachvollziehbar.
- Im aktiven Zustand wird der neutrale Statushinweis „UI-Editor aktiv“ angezeigt.
- `activeUiScope` bleibt als vorbereitender Platzhalter `null`.
- Kein Editor-Panel, kein Hover-Rahmen, kein Editmodus, keine Elementauswahl, keine Speicherung, kein DOM-Scan und keine Fachlogik.
- MainHeader bleibt ohne EditorLab-V2- und Restarbeiten-V2-Headerbutton.
- Tests:
  - `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `node scripts/tests/editorLabV2Access.test.cjs`
  - `node scripts/tests/restarbeitenV2DevAccess.test.cjs`
  - `npm test` (in dieser Umgebung durch fehlendes Electron-Systempaket `libatk-1.0.so.0` blockiert)
- Nächster Schritt:
  - Lokale Sichtprüfung per `npm start`.
