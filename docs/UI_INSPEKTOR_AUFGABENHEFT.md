# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M13.6a abgeschlossen (Panel ist aus dem Header gelöst und bleibt verschiebbar). K19.16a abgeschlossen (neutraler BBM-UI-Editor-Aktivmodus zeigt festen Registry-Scope).

Aktueller Stand:
- M1 bis M13.6a abgeschlossen.
- K19.79 abgeschlossen: SurfaceSelection-State wird im BBM-Launcher read-only als interne Quelle fuer Surface-Auswahl und SurfaceInfo genutzt; sichtbar bleibt nur `restarbeiten.ui.main`/`Restarbeiten`, ohne echte Umschaltung, Drag, Resize oder Persistenz.
- K19.78 abgeschlossen: SurfaceSelection-State read-only vorbereitet; nur `restarbeiten.ui.main` kann ausgewaehlt sein, PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert, ohne echte Umschaltung oder Persistenz.
- K19.77 abgeschlossen: Surface-Auswahl read-only im Editorpanel als Referenzstand dokumentiert; sichtbar bleibt nur `restarbeiten.ui.main`/`Restarbeiten`, ohne echte Umschaltung, Dropdown, Drag, Resize oder Persistenz.
- K19.76 abgeschlossen: Surface-Auswahl read-only im Editorpanel sichtbar; sichtbar bleibt nur `restarbeiten.ui.main`/`Restarbeiten`, ohne Umschaltung, PDF/Plan-Freigabe, Drag, Resize oder Persistenz.
- K19.75 abgeschlossen: Surface-Auswahlmodell read-only vorbereitet; Modell enthaelt aktuell nur `restarbeiten.ui.main`, ohne sichtbare Auswahl, PDF/Plan-Freigabe, Drag, Resize oder Persistenz.
- K19.74 abgeschlossen: SurfaceInfo read-only im Editorpanel als Referenzstand dokumentiert; sichtbar bleibt nur `restarbeiten.ui.main`, PDF/Plan und unbekannte SurfaceIds bleiben unsichtbar, ohne neue Produktivlogik.
- K19.73 abgeschlossen: Erste sichtbare read-only SurfaceInfo fuer `restarbeiten.ui.main` im Editorpanel vorbereitet; PDF/Plan bleiben unsichtbar, ohne Surface-Auswahl, Drag, Resize oder Persistenz.
- K19.72 abgeschlossen: Surface-Rechte-/Policy-Schicht read-only vorbereitet; bekannte SurfaceIds sind nur lesbar, Editor-Sichtbarkeit, Drag, Resize und Persistenz bleiben aus, unbekannte SurfaceIds/Wildcards sind voll blockiert.
- K19.71 abgeschlossen: BBM-Launcher kann den SurfaceAdapter-Katalog read-only testseitig nutzen; es gibt keine sichtbare Surface-Anzeige und keine Produktivnutzung.
- K19.70 abgeschlossen: SurfaceAdapter-Katalog ist als read-only Referenzstand dokumentiert; bekannte SurfaceIds, Blockaden, Datenfluss und Sicherheitsgrenzen sind festgehalten.
- K19.69 abgeschlossen: SurfaceAdapter-Katalog ist read-only vorbereitet; bekannte SurfaceIds sind zentral auffindbar und unbekannte SurfaceIds werden kontrolliert blockiert.
- K19.68 abgeschlossen: PDF-/Plan-Surfaces sind read-only als BBM-Adapter-Skelett vorbereitet; die Modelle validieren ueber die SurfaceRuntime-Bridge, ohne Produktivnutzung, Renderlogik, Drag oder Persistenz.
- K19.67 abgeschlossen: Panel/Drag-Umstellung ist als Referenzstand dokumentiert; Datenfluss, PanelRuntime-Helper, Host-Grenzen, Sicherheitsgrenzen und Testreferenzen sind festgehalten.
- K19.66 abgeschlossen: BBM nutzt fuer die reine Preview-Panel-Positionsberechnung den PanelRuntime-Panel-Drag-Helper ueber `uiEditorKitPanelRuntimeBridge.js`; direkte DragRuntime-Nutzung im Launcher fuer Panel-Positionierung ist entfernt.
- K19.65 abgeschlossen: Panel-Drag-Sichtpruefung nach der G43-Umstellung in der lokalen Electron-DEV-App bestanden; Button, Panel-Oeffnen, Drag, Viewport-Begrenzung, Reset, Schliessen/Wieder-Oeffnen und Hidden-Elements-Bereich bleiben sichtbar stabil.
- K19.64 abgeschlossen: Die reine Preview-Panel-Positionsberechnung im BBM-Launcher nutzt kontrolliert `buildDragResult(...)` aus der UI-Editor-kit DragRuntime-Bridge; DOM-/Event-Anbindung, Reset und Rendering bleiben im Host/Launcher.
- K19.63 abgeschlossen: Panel-/Drag-Baseline im BBM-Launcher ist testseitig abgesichert; bestehende Panel-Initialisierung, Open/Close, Positionsnormalisierung, Hidden-Elements-Button/Popover und DragRuntime-Nichtnutzung bleiben unveraendert.
- K19.62 abgeschlossen: BBM kann die UI-Editor-kit DragRuntime ueber `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` testweise laden; Bounds, Delta, Apply, Clamp und Coordinate-Systems werden geprueft, ohne produktives Verschieben.
- K19.61 abgeschlossen: Read-only SurfaceAdapter-Pilot fuer `restarbeiten.ui.main` erzeugt ein neutrales `ui-screen`-Surface-Modell aus Registry plus LayoutState und validiert es ueber die UI-Editor-kit Surface-Bridge; keine Produktivnutzung.
- K19.60 abgeschlossen: BBM kann die UI-Editor-kit Surface-Runtime ueber `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js` testweise laden; `ui-screen` und `pdf-page` werden normalisiert/validiert, ohne Launcher- oder Produktivnutzung.
- K19.59 abgeschlossen: UI-Editor-kit Zielarchitektur fuer Surface-, Panel-, Drag- und spaetere PDF-/Plan-/Canvas-Faehigkeit ist in `docs/UI_EDITOR_KIT_SURFACE_PANEL_DRAG_ARCHITEKTUR.md` dokumentiert; keine Produktivlogik aktiviert.
- K19.58 abgeschlossen: Hidden-Elements-Block ist als stabiler Referenzstand in `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md` dokumentiert; keine neue Produktivlogik und keine weitere Scope-Freigabe.
- K19.57 abgeschlossen: Freigabe weiterer Hidden-Elements-Scopes ist als Allowlist/Policy vorbereitet; aktiv bleibt nur `restarbeiten.ui.main`.
- K19.56 abgeschlossen: Gespeicherte Hidden-Element-Visibility-Overrides koennen im bestehenden kompakten Popover fuer den Pilot-Scope `restarbeiten.ui.main` einzeln oder per `Alle einblenden` auf sichtbar zurueckgesetzt werden; weitere Scopes bleiben gesperrt.
- K19.55 abgeschlossen: Restore gespeicherter Hidden-Element-Visibility-Overrides ist fuer den Pilot-Scope `restarbeiten.ui.main` testseitig abgesichert; `getCurrentLayoutState(...)` liefert nach neuem Lesezyklus `visible: false/true` an die Hidden-Elements-Logik.
- K19.54 abgeschlossen: Pilot-Persistenz fuer Hidden-Element-Visibility-Overrides ist nur fuer `restarbeiten.ui.main` aktiv; gespeichert wird ausschliesslich `overrides.visible` ueber BBM-seitiges Repo/IPC hinter dem HostAdapter.
- K19.53 abgeschlossen: HostAdapter-Dry-Run validiert `persistent: true` Visibility-ChangeRequests und blockiert sie weiterhin ohne Speicherung.
- K19.52 abgeschlossen: Hidden-Elements-Persistenzspeicher ist technisch als neutrales Modell mit Validierung vorbereitet; Persistenz bleibt deaktiviert und es gibt keinen Speicherweg.
- K19.51 abgeschlossen: Speicherort, Zielstruktur, Freigabegrenzen und Folgepakete fuer Hidden-Elements-Persistenz sind dokumentiert; Persistenz bleibt deaktiviert.
- K19.50 abgeschlossen: Hidden-Elements-Persistenz ist vorbereitet und dokumentiert; `canPersistVisibility` bleibt `false`, `persistent: true` bleibt mit `PERSISTENCE_DISABLED` blockiert und es gibt weiterhin keine produktive Speicherung.
- K19.49 abgeschlossen: HostAdapter-Dry-Run fuer Hidden-Element-Visibility-ChangeRequests ist abgesichert; keine Persistenz und keine sichtbare UI-Aenderung.
- K19.48 abgeschlossen: Hide/Show ist als einheitlicher Visibility-ChangeRequest abgesichert; keine Persistenz und keine HostAdapter-Schreibausfuehrung.
- K19.47 abgeschlossen: Hidden-Elements werden im BBM-Launcher zusaetzlich lesend aus Registry plus Layout-State beruecksichtigt; keine Schreiblogik und keine Persistenz.
- K19.46 abgeschlossen: Hidden-Elements Datenquelle und Persistenz-Trennschnitt sind dokumentiert; keine Speicherlogik und keine Launcher-Funktionsaenderung.
- K19.45 abgeschlossen: BBM zeigt ein kompaktes Hidden-Elements-Popover im Preview-Panel; `Einblenden` funktioniert fuer temporaere Preview-Hide-Aenderungen, ohne Persistenz.
- K19.44 abgeschlossen: BBM zeigt im Preview-Panel einen kompakten Hidden-Elements-Button/Platzhalter ueber die UI-Editor-kit Hidden-Elements-Bridge; kein Popover, keine Einblenden-Aktion, keine Persistenz.
- K19.43 abgeschlossen: BBM prueft den UI-Editor-kit Hidden-Elements-Runtime-Importvertrag und hat eine renderer-kompatible Bridge vorbereitet; die damals fehlende Launcher-/Panel-Nutzung ist durch K19.44 ueberholt.
- K19.42 abgeschlossen: Bedienkonzept fuer ausgeblendete Elemente als kompakter Panel-Button mit spaeterem Popover dokumentiert; keine UI- oder Launcher-Aenderung.
- K19.41 abgeschlossen: BBM nutzt das UI-Editor-kit Panel-ViewModel vorbereitend im Launcher ueber die Panel-Bridge; sichtbares Verhalten soll unveraendert bleiben.
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
- [x] K19.41 Panel-ViewModel im BBM-Launcher vorbereitend nutzen
- [x] K19.42 Hidden-Elements Button-Konzept dokumentieren
- [x] K19.43 Hidden-Elements Runtime-Importvertrag und Renderer-Bridge vorbereiten
- [x] K19.44 Kompakten Hidden-Elements-Button im BBM-Preview-Panel anzeigen
- [x] K19.45 Kompaktes Hidden-Elements-Popover im BBM-Preview-Panel vorbereiten
- [x] K19.46 Hidden-Elements Datenquelle und Persistenz-Trennschnitt festlegen
- [x] K19.47 Hidden-Elements aus echtem Layout-State lesen, noch ohne Schreiben
- [x] K19.48 Hide/Show als ChangeRequest sauber modellieren
- [x] K19.49 HostAdapter-Dry-Run fuer Hidden-Element-Visibility-ChangeRequests absichern
- [x] K19.50 Hidden-Elements-Persistenz vorbereiten, aber deaktiviert lassen
- [x] K19.51 Hidden-Elements Speicherort und Persistenzfreigabe festlegen
- [x] K19.52 Hidden-Elements Persistenzspeicher technisch vorbereiten, aber deaktiviert lassen
- [x] K19.53 Validierten HostAdapter-Dry-Run fuer persistent=true Visibility-ChangeRequests vorbereiten
- [x] K19.54 Pilot-Persistenz fuer Hidden-Element-Visibility-Overrides in restarbeiten.ui.main aktivieren
- [x] K19.55 Restore gespeicherter Hidden-Element-Visibility-Overrides fuer restarbeiten.ui.main absichern
- [x] K19.56 Hidden-Elements Pilot-Ruecksetzpfad im kompakten Popover absichern
- [x] K19.57 Hidden-Elements Scope-Freigabe-Policy vorbereiten
- [x] K19.58 Hidden-Elements-Block als Referenzstand abschliessen
- [x] K19.59 UI-Editor-kit Surface-/Panel-/Drag-/PDF-Zielarchitektur inventarisieren
- [x] K19.60 UI-Editor-kit Surface-Runtime in BBM per Bridge pruefen
- [x] K19.61 Read-only SurfaceAdapter-Pilot fuer restarbeiten.ui.main vorbereiten
- [x] K19.62 UI-Editor-kit DragRuntime in BBM per Bridge pruefen
- [x] K19.63 Panel-/Drag-Baseline im BBM-Launcher absichern
- [x] K19.64 Panel-Positionsberechnung kontrolliert ueber UI-Editor-kit DragRuntime vorbereiten
- [x] K19.65 Panel-Drag-Sichtpruefung nach DragRuntime-Umstellung als Referenz absichern
- [x] K19.66 BBM-Launcher auf PanelRuntime-Panel-Drag-Helper umstellen
- [x] K19.67 Panel/Drag-Umstellung als Referenzstand abschliessen
- [x] K19.68 PDF-/Plan-Surface read-only vorbereiten
- [x] K19.69 SurfaceAdapter-Katalog read-only vorbereiten
- [x] K19.70 SurfaceAdapter-Katalog als read-only Referenzstand abschliessen
- [x] K19.71 SurfaceAdapter-Katalog read-only im Launcher vorbereiten
- [x] K19.72 Surface-Rechte-/Policy-Schicht read-only vorbereiten
- [x] K19.73 Erste sichtbare read-only SurfaceInfo fuer Pilot-Surface vorbereiten
- [x] K19.74 SurfaceInfo read-only im Editorpanel als Referenzstand abschliessen
- [x] K19.75 Surface-Auswahlmodell read-only vorbereiten
- [x] K19.76 Surface-Auswahl read-only im Editorpanel sichtbar machen
- [x] K19.77 Surface-Auswahl read-only im Editorpanel als Referenzstand abschliessen
- [x] K19.78 SurfaceSelection-State read-only vorbereiten
- [x] K19.79 SurfaceSelection-State read-only im Launcher verwenden

## Statusupdate K19.79
- `BbmUiEditorRuntimeLauncher.js` nutzt den read-only SurfaceSelection-State als interne Quelle fuer die vorhandene Surface-Auswahl und SurfaceInfo.
- Ausgewaehlt bleibt ausschliesslich `restarbeiten.ui.main`.
- Sichtbar bleibt die kompakte Anzeige `Restarbeiten`; PDF/Plan, unbekannte SurfaceIds, Wildcards und leere IDs erscheinen nicht.
- Blockierte Auswahlwuensche fallen defensiv auf den Pilot zurueck oder werden ohne Panelbruch abgefangen.
- Keine echte Umschaltung, keine neue UI-Struktur, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.

## Statusupdate K19.78
- `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionState.js` baut einen defensiven read-only SurfaceSelection-State.
- Der State enthaelt `selectedSurfaceId`, `requestedSurfaceId`, `availableSurfaceIds`, `blockedSurfaceIds`, `readonly`, `selectionAllowed` und `reason`.
- Aktuell kann nur `restarbeiten.ui.main` ausgewaehlt sein.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert.
- Keine echte Umschaltung, keine sichtbare UI-Aenderung, keine Launcher-Produktivintegration, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.

## Statusupdate K19.77
- `docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` dokumentiert den stabilen read-only Stand der kompakten Surface-Auswahl im Editorpanel.
- Sichtbar und auswaehlbar bleibt ausschliesslich `restarbeiten.ui.main` mit dem Label `Restarbeiten`.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar und nicht auswaehlbar.
- Die SurfaceInfo bleibt direkt unter der Surface-Auswahl sichtbar.
- Keine echte Umschaltung, keine grosse Surface-Liste, kein Dropdown, keine Bearbeitung, kein Drag, kein Resize, keine Persistenz und keine neue Produktivlogik.

## Statusupdate K19.76
- `BbmUiEditorRuntimeLauncher.js` nutzt das read-only SurfaceSelection-Modell fuer eine kompakte Anzeige im bestehenden Editorpanel.
- Sichtbar ist nur `restarbeiten.ui.main` mit dem Label `Restarbeiten`.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar und nicht auswaehlbar.
- Keine Umschaltung, keine Dropdown-/Listen-UI, keine Bearbeitungsbuttons, kein Drag, kein Resize und keine Persistenz.
- Keine PDF-/Plan-/Canvas-Bearbeitung, keine Registry-Aenderung, keine DB-/IPC-Schreiblogik und keine Fachlogik.

## Statusupdate K19.75
- `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionModel.js` baut ein read-only SurfaceSelection-Modell aus SurfaceAdapterCatalog und SurfacePolicy.
- Aufgenommen werden nur SurfaceIds, die bekannt, `readable === true` und `visibleInEditor === true` sind.
- Aktuell ist nur `restarbeiten.ui.main` im Modell enthalten.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben nicht auswaehlbar.
- Keine sichtbare Surface-Auswahl, keine Dropdown-/Listen-UI, keine neue Panel-Sektion, keine Bearbeitung, kein Drag, kein Resize, keine Persistenz und keine Launcher-Produktivnutzung.

## Statusupdate K19.74
- `docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md` dokumentiert den stabilen read-only Stand der kompakten SurfaceInfo im Editorpanel.
- Sichtbar bleibt ausschliesslich `restarbeiten.ui.main`.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar.
- Datenfluss: Editorpanel -> SurfacePolicy -> `visibleInEditor` -> `buildReadonlySurfaceModelForLauncher(...)` -> SurfaceAdapterCatalog -> `restarbeitenMainSurfaceAdapter` -> SurfaceRuntime-Validierung ueber Bridge -> kompakte SurfaceInfo.
- Keine Surface-Liste, keine Surface-Auswahl, keine Bearbeitung, kein Drag, kein Resize, keine Persistenz, keine PDF-/Plan-Bearbeitung und keine neue Produktivlogik.

## Statusupdate K19.73
- `restarbeiten.ui.main` ist als einzige SurfaceId `visibleInEditor: true`.
- Das bestehende Editorpanel zeigt eine kompakte read-only SurfaceInfo mit SurfaceId, Typ und Elementanzahl.
- `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben im Editor unsichtbar.
- Keine Surface-Liste, keine Surface-Auswahl und keine Bearbeitungsbuttons fuer Surface.
- Kein Drag, kein Resize, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

## Statusupdate K19.72
- `src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js` definiert eine explizite read-only Policy fuer `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`.
- Alle bekannten SurfaceIds bleiben `visibleInEditor: false`, `canDrag: false`, `canResize: false` und `canPersist: false`.
- `canHide: true` ist nur fuer `restarbeiten.ui.main` vorbereitet; PDF-/Plan-Surfaces bleiben auch fuer Hide gesperrt.
- Unbekannte SurfaceIds, Wildcards und leere IDs bleiben voll blockiert.
- Der SurfaceAdapterCatalog prueft bekannte Adapter defensiv gegen `readable: true`.
- Keine sichtbare Surface-Anzeige, keine neue Panel-Sektion, keine produktive Surface-Auswahl, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag und keine Persistenz.

## Statusupdate K19.71
- `BbmUiEditorRuntimeLauncher.js` exportiert `buildReadonlySurfaceModelForLauncher(surfaceId, input)` als read-only Testhelfer.
- Testseitig koennen `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default` als neutrale SurfaceModels abgerufen/validiert werden.
- Unbekannte SurfaceIds bleiben mit `UNKNOWN_SURFACE_ADAPTER` blockiert; es gibt keine Wildcard und keinen Default-Adapter.
- Keine sichtbare Surface-Anzeige, keine neue Panel-Sektion, keine automatische Surface-Liste und keine produktive Surface-Auswahl.
- Keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

## Statusupdate K19.70
- `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md` dokumentiert den stabilen read-only SurfaceAdapter-Stand.
- Bekannte SurfaceIds bleiben `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`.
- Unbekannte SurfaceIds werden mit `UNKNOWN_SURFACE_ADAPTER` blockiert; es gibt keine Wildcard und keinen Default-Adapter.
- Datenfluss: BBM-Test/spaeter Host-Aufruf -> SurfaceAdapterCatalog -> konkreter read-only SurfaceAdapter -> neutrales SurfaceModel -> `uiEditorKitSurfaceRuntimeBridge` -> SurfaceRuntime im UI-Editor-kit -> Validierung/Normalisierung.
- Keine Produktivlogik, keine Launcher-Nutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.
- UI-Editor-kit speichert nicht; BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik.

## Statusupdate K19.69
- `src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js` listet die bekannten read-only SurfaceAdapter zentral.
- Bekannte SurfaceIds sind `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`.
- Der Katalog baut und validiert Surface-Modelle ueber `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js`.
- Unbekannte SurfaceIds und Wildcards werden kontrolliert mit `UNKNOWN_SURFACE_ADAPTER` abgelehnt; es gibt keinen Default-Adapter.
- Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.
- Host bleibt spaeter fuer Rechte, Scopes, Persistenz und echte Surface-Integration zustaendig.

## Statusupdate K19.68
- `src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js` erzeugt ein read-only PDF-Surface-Modell mit `surfaceType: "pdf-page"`, `coordinateSystem: "pdf-points"`, `pageNumber` und leerer `elements`-Liste.
- Optional erzeugt derselbe Adapter ein read-only Plan-Surface-Modell mit `surfaceType: "plan"`, `coordinateSystem: "canvas-pixels"` und leerer `elements`-Liste.
- Die Modelle werden ausschliesslich ueber `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js` normalisiert und validiert.
- Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-Renderlogik, kein Drag auf PDF/Plan, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.
- Host bleibt fuer spaetere Rechte, Persistenz und echte PDF-/Planlogik zustaendig; UI-Editor-kit speichert nicht.

## Statusupdate K19.67
- `docs/UI_EDITOR_PANEL_DRAG_REFERENZSTAND.md` dokumentiert den stabilen Panel/Drag-Stand.
- Datenfluss: Mouse-/DOM-Event im BBM-Launcher -> Start-Bounds + Delta + Viewport-Bounds -> `uiEditorKitPanelRuntimeBridge` -> PanelRuntime Panel-Drag-Helper im UI-Editor-kit -> berechnete Bounds -> Style-Setzen im BBM-Launcher.
- DOM-/Mouse-/Pointer-Anbindung, Style-Setzen, Panel-Open/Close, Panel-Reset und Hidden-Elements-Button/Popover bleiben im BBM-Launcher.
- UI-Editor-kit speichert nicht; keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung, keine Fachlogik und kein PDF/Canvas/Plan.
- Keine Produktivcode-Aenderung, keine neue UI-Funktion und keine weitere Drag-Auslagerung.

## Statusupdate K19.66
- `BbmUiEditorRuntimeLauncher.js` importiert fuer Panel-Positionierung `calculatePanelDragPosition(...)` und `PANEL_DRAG_COORDINATE_SYSTEM` ueber `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js`.
- Die direkte Launcher-Nutzung von `buildDragResult(...)` aus `uiEditorKitDragRuntimeBridge.js` ist fuer Panel-Positionierung entfernt; die DragRuntime bleibt intern im UI-Editor-kit hinter dem Panel-Helper.
- DOM-/Mouse-Event-Anbindung, Startpositionsmessung, Style-Setzen, Panel-Open/Close, Panel-Reset und Hidden-Elements-Button/Popover bleiben im BBM-Launcher.
- Tests pruefen PanelRuntime-Bridge-Exports, positive/negative Delta-Bewegung, Clamp links/oben und rechts/unten, Panel-Reset, Open/Close und Hidden-Elements-Popover.
- Keine neue UI, keine neue Panel-Funktion, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

## Statusupdate K19.65
- Lokale Electron-Sichtpruefung per `npm start` bestanden.
- Geprueft wurden UI-Editor-Button sichtbar, Panel oeffnen, Panel verschieben, Panel bleibt im sichtbaren Bereich, Panel zuruecksetzen, Panel schliessen/wieder oeffnen und Hidden-Elements-Bereich im Panel.
- Die DragRuntime bleibt auf reine Positionsberechnung begrenzt; DOM-/Mouse-Events, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Rendering bleiben im BBM-Launcher.
- Keine Produktivcode-Aenderung, keine neue UI-Funktion, keine weitere Drag-Auslagerung, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

## Statusupdate K19.64
- `BbmUiEditorRuntimeLauncher.js` importiert `buildDragResult(...)` ausschliesslich ueber `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js`.
- Der kleine Helper `calculatePreviewPanelDragPositionWithRuntime(...)` bildet Startposition, Delta und Viewport-Grenzen auf `coordinateSystem: "css-pixels"` ab.
- DOM-/Mouse-Event-Anbindung, Startpositionsmessung, Style-Setzen, Panel-Open/Close, Panel-Reset und Hidden-Elements-Button/Popover bleiben im BBM-Launcher.
- Tests pruefen positive und negative Delta-Bewegung, Clamp am linken/oberen sowie rechten/unteren Viewport-Rand, Panel-Reset, Open/Close und Hidden-Elements-Popover.
- Kein Bare-Package-Import im Renderer, keine neue UI, keine neue Panel-Funktion, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

## Statusupdate K19.63
- `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs` sichert die aktuelle Panel-/Drag-Baseline des BBM-Launchers ab.
- Geprueft sind Launcher-Initialisierung, Preview-Panel-Open/Close, defensive Panel-Positionsnormalisierung im Viewport, Panel-Reset, Hidden-Elements-Button/Popover und Preview-Reset beim Deaktivieren.
- `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` bleibt testseitig ladbar, wird vom Launcher aber weiterhin nicht importiert und nicht produktiv aufgerufen.
- Die aktuelle Panel-Drag-Rechnung und DOM-/Event-Anbindung bleiben im BBM-Launcher/Host; eine spaetere kontrollierte Berechnungsauslagerung bleibt ein eigenes Folgepaket.
- Keine sichtbare UI-Aenderung, keine neue Drag-Aktivierung, keine Pointer-/Maus-/DOM-Event-Aenderung, keine PDF-/Canvas-/Plan-Aktivierung, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg und keine DB-Schreiblogik.
- UI-Editor-kit speichert nicht; BBM bleibt Host fuer DOM/Event-Anbindung, Registry, Scopes, Persistenz, Rechte, DB/IPC und Fachlogik.

## Statusupdate K19.62
- `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` ist als renderer-kompatible Bridge auf `node_modules/ui-editor-kit/src/runtime/drag/index.mjs` vorbereitet.
- `scripts/tests/uiEditorKitDragRuntimeBridge.test.cjs` prueft Bridge-Ladbarkeit, Drag-Funktionen, unterstuetzte Coordinate-Systems, Ablehnung unbekannter Systeme, Bounds-/Delta-Rechnung, Constraint-Clamping und negative Bounds.
- Der Test ist in `scripts/test.cjs` eingebunden.
- Keine Produktivnutzung im Launcher, keine sichtbare UI-Aenderung, keine DOM-/Pointer-/Maus-Anbindung, keine echte Verschiebung, keine PDF-/Canvas-/Plan-Aktivierung, keine Persistenz, keine Registry-Aenderung und keine neuen Scopes.
- UI-Editor-kit speichert nicht; BBM bleibt Host fuer Registry, Scopes, Persistenz, Rechte, DB/IPC und Fachlogik.
- Eine spaetere kontrollierte Launcher-/Panel-Nutzung bleibt ein eigenes Paket.

## Statusupdate K19.61
- `src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js` baut read-only ein Surface-Modell fuer `restarbeiten.ui.main`.
- Datenquelle sind vorhandene HostAdapter-/Registry-Daten und der aktuelle LayoutState; `visible` wird read-only aus `overrides.visible` beruecksichtigt.
- Das Modell nutzt `surfaceType: "ui-screen"` und `coordinateSystem: "css-pixels"` und wird ueber `uiEditorKitSurfaceRuntimeBridge.js` normalisiert/validiert.
- Bounds bleiben bewusst weg, weil keine DOM-Vermessung erfolgt.
- `canHide` folgt hide/show-faehigen Registry-Elementen; `canMove` und `canResize` bleiben false, solange Drag nicht freigegeben ist.
- Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, keine Drag-/PDF-/Canvas-Aktivierung, keine Persistenz, keine Registry-Aenderung und keine neuen Scopes.
- Naechste getrennte Folgepakete: kontrollierte Launcher-/Panel-Nutzung nach DragRuntime-Bridge, jeweils separat.

## Statusupdate K19.60
- `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js` ist als renderer-kompatible Bridge auf `node_modules/ui-editor-kit/src/runtime/surface/index.mjs` vorbereitet.
- `scripts/tests/uiEditorKitSurfaceRuntimeBridge.test.cjs` prueft Bridge-Ladbarkeit, Surface-Funktionen, unterstuetzte Typen, Ablehnung unbekannter Typen sowie `ui-screen`- und `pdf-page`-Beispielmodelle.
- Der Test ist in `scripts/test.cjs` eingebunden.
- Keine Produktivnutzung im Launcher, keine sichtbare UI-Aenderung, keine PDF-/Canvas-/Drag-Aktivierung, keine neue Persistenz, keine Registry-Aenderung und keine neuen Scopes.
- UI-Editor-kit speichert nicht; BBM bleibt Host fuer Registry, Scopes, Persistenz, Rechte, DB/IPC und Fachlogik.
- Naechste getrennte Folgepakete bleiben: G39 UI-Screen-SurfaceAdapter, G40 DragRuntime, G41 DragRuntime-Bridge und danach optionale BBM-Panel-Drag-Nutzung.

## Statusupdate K19.59
- `docs/UI_EDITOR_KIT_SURFACE_PANEL_DRAG_ARCHITEKTUR.md` dokumentiert das Zielbild fuer Surface, SurfaceAdapter, PanelRuntime, DragRuntime, HostAdapter, Registry, ChangeRequest und LayoutState.
- Aktueller Stand von UI-Editor-kit Preview-/Panel-/Hidden-Elements-Runtimes, BBM-Bridges, HostAdapter, Registry-/Scope-Dateien und PDF-/Plan-nahen Bereichen ist inventarisiert.
- Das neutrale Surface-Zielmodell fuer `ui-screen`, `pdf-page` und `canvas-view` ist rein dokumentarisch beschrieben.
- UI-Editor-kit speichert nicht; Persistenz bleibt Host-seitig und Scope-/Surface-basiert kontrolliert.
- Keine Produktivlogik, keine UI-Aenderung, keine neue Persistenz, keine neue Scope-Freigabe, keine PDF-Aktivierung, keine Drag-Aenderung und kein Bare-Package-Import im Renderer.
- Historische Folgepakete G37 bis G48 sind inzwischen bis zum read-only PDF-/Plan-Surface-Skelett umgesetzt; echte PDF-/Plan-Bearbeitung bleibt ein separates spaeteres Paket.

## Statusupdate K19.58
- Der Hidden-Elements-Block ist als Referenzstand abgeschlossen.
- `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md` dokumentiert Kurzfazit, Bedienlogik, Datenfluss, ChangeRequest-Modell, Persistenzmodell, Restore-Pfad, Scope-Policy, Sicherheitsgrenzen, bewusst nicht umgesetzte Punkte, Folgepakete und Test-/Guardrail-Referenzen.
- Aktiv bleibt ausschliesslich `restarbeiten.ui.main`; weitere Scopes, globale Freigabe, Move-/Resize-/Text-Persistenz, Registry-Mutation, UI-Editor-kit-Speicher, `localStorage`, Dateiablage, PDF-/Drucklogik und Fachlogik bleiben ausgeschlossen.
- Dieses Paket ist Doku/Test; keine produktive UI-/Launcher-/HostAdapter-/DB-/IPC-Funktionsaenderung.
- Folgepaket bleibt getrennt: jede echte weitere Scope-Freigabe braucht eigenes Paket mit Tests, Restore- und Ruecksetzabsicherung.

## Statusupdate K19.57
- Die Freigabe weiterer Hidden-Elements-Visibility-Persistenz-Scopes ist als explizite Allowlist/Policy vorbereitet.
- Aktiv bleibt ausschliesslich `restarbeiten.ui.main`.
- Bekannte andere Scopes, unbekannte Scopes und Wildcards bleiben blockiert.
- `canPersistVisibility: true` reicht ohne Policy-Freigabe nicht aus.
- UI-Editor-kit, Registry, PDF-/Drucklogik, Fachlogik, Drag, Target-Selection, `localStorage` und Dateiablage bleiben unveraendert.
- Abgesichert durch Policy-/Catalog-, HostAdapter-, Repo- und Launcher-Tests.
- Folgepaket bleibt getrennt: jede echte weitere Scope-Freigabe braucht eigenes Paket mit Restore- und Ruecksetztests.

## Statusupdate K19.56
- Der bestehende kompakte Hidden-Elements-Popover erlaubt fuer gespeicherte Pilot-Overrides in `restarbeiten.ui.main` jetzt `Einblenden`.
- Die Runtime erzeugt dafuer einen validierten `persistent: true` Visibility-ChangeRequest mit `payload.visible === true`.
- Bei mehreren aktiv einblendbaren Pilot-Overrides erscheint kompakt `Alle einblenden`.
- Layout-State-only Elemente ohne freigegebene Persistenz-Capability bleiben deaktiviert.
- Keine globale Scope-Freigabe, keine Persistenz fuer Move/Resize/Text/Fachfelder, keine Registry-Mutation, kein UI-Editor-kit-Speicher, kein `localStorage`, kein Datei-Schreibweg, keine PDF-/Drucklogik, keine Fachlogik und keine Drag-/Target-Selection-Aenderung.
- Abgesichert durch Launcher- und HostAdapter-Tests; Electron-Sichtpruefung ist fuer G33 erforderlich, weil die Popover-Bedienung sichtbar erweitert wurde.
- Folgepaket bleibt getrennt: G34 weitere Scopes erst nach eigener Freigabe.

## Statusupdate K19.55
- Die Wiederherstellung gespeicherter Hidden-Element-Visibility-Overrides ist fuer den Pilot-Scope `restarbeiten.ui.main` abgesichert.
- Der technische Restore-Pfad laeuft ueber den Restarbeiten-HostAdapter: `loadCurrentLayoutState()` liest gespeicherte Overrides, `getCurrentLayoutState("restarbeiten.ui.main")` liefert den Layout-State an den Launcher.
- Ein neuer Adapter-/Lesezyklus wurde testseitig simuliert: `visible: false` wird als hidden erkannt, nach `visible: true` wird das Element nicht mehr als hidden gezaehlt.
- Andere Scopes, unbekannte `elementId`, Nicht-Visibility-Operationen und ungueltige `payload.visible` bleiben blockiert.
- Registry, UI-Editor-kit, PDF-/Drucklogik, Fachlogik, Drag, Target-Selection, `localStorage` und Dateiablage bleiben unveraendert.
- Keine Produktivcode-Aenderung war fuer G32 noetig; der vorhandene G31-Leseweg wurde durch HostAdapter- und Launcher-Tests abgesichert.
- Folgepakete bleiben getrennt: G33 UI-Pruefung/Reset, G34 weitere Scopes.

## Statusupdate K19.54
- Die echte Persistenz fuer Hidden-Element-Visibility-Overrides ist nur fuer den Pilot-Scope `restarbeiten.ui.main` aktiv.
- Speicherweg: `ui_editor_layout_overrides` in der BBM-Datenbank, `src/main/db/uiEditorLayoutOverridesRepo.js`, `src/main/ipc/uiEditorLayoutOverridesIpc.js` und Preload-Methoden `uiEditorLayoutOverridesGetMany` / `uiEditorLayoutOverridesSave`.
- Der Restarbeiten-HostAdapter meldet fuer diesen Scope `persistence: true`, `canPersistVisibility: true`, `dryRunOnly: false`.
- Gespeichert werden nur validierte `persistent: true` ChangeRequests mit `operation: "visibility"` und boolean `payload.visible`.
- Gespeicherte Overrides werden ueber `getCurrentLayoutState(...)` als neutrale Layout-State-Datensaetze mit `overrides.visible` gelesen.
- Andere Scopes, Nicht-Visibility-Operationen, ungueltige Payloads, unbekannte `elementId` und unkontrollierte Instanzen bleiben blockiert.
- Registry, UI-Editor-kit, PDF-/Drucklogik, Fachlogik, Drag und Target-Selection bleiben unveraendert; kein `localStorage` und kein Datei-Schreibweg.
- App-Start-/Restore-Absicherung ist durch K19.55/G32 nachgezogen.
- Abgesichert durch neue Storage-/IPC-Tests, HostAdapter-Tests und den bestehenden Hidden-Elements-Layout-State-Leser im Launcher.
- Folgepakete bleiben getrennt: G33 UI-Pruefung/Reset, G34 weitere Scopes.

## Statusupdate K19.53
- `persistent: true` Visibility-ChangeRequests werden im HostAdapter-Dry-Run jetzt gegen das G29-Override-Modell validiert.
- Gueltige Requests werden in einen Override-Payload uebersetzt, aber mit `PERSISTENCE_DISABLED` blockiert.
- Ungueltige `payload.visible`-Werte und unbekannte `elementId` werden mit `INVALID_CHANGE_REQUEST` blockiert.
- `canPersistVisibility` bleibt `false`, `dryRunOnly` bleibt `true`.
- Keine echte Speicherung, keine DB-Migration, kein IPC, kein localStorage, kein writeFile, keine neue Speicherdatei, keine HostAdapter-Schreibausfuehrung, kein App-Start-Wiederherstellen und keine UI-/Launcher-/Drag-/Target-Selection-/PDF-/Fachlogik-Aenderung.
- Abgesichert durch `scripts/tests/restarbeitenEditorHostAdapter.test.cjs` und `scripts/tests/editorLayoutOverrideModel.test.cjs`; bestehende Launcher-Tests bleiben relevante Guardrails.
- Folgepakete bleiben getrennt: G31 Pilot-Persistenz, G32 App-Start-Wiederherstellung, G33 UI-Pruefung/Reset, G34 weitere Scopes.

## Statusupdate K19.52
- `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js` bereitet ein neutrales UI-Editor-Layout-Override-Modell vor.
- Enthalten sind `normalizeEditorLayoutOverride`, `validateEditorLayoutOverride`, `buildVisibilityOverrideFromChangeRequest` und `isVisibilityOverridePersistable`.
- Das Modell validiert Pflichtfelder, Boolean-`overrides.visible`, bekannte bzw. kontrollierbare `elementId` und optional erlaubte Scopes.
- `persistent: false` bleibt nicht persistierbar; `persistent: true` bleibt bei `canPersistVisibility: false`, `persistence: false` oder `dryRunOnly: true` blockiert.
- Keine echte Speicherung, keine DB-Migration, kein IPC, kein localStorage, kein writeFile, keine neue Speicherdatei, keine HostAdapter-Schreibausfuehrung, kein App-Start-Wiederherstellen und keine UI-/Launcher-/Drag-/Target-Selection-/PDF-/Fachlogik-Aenderung.
- Abgesichert durch `scripts/tests/editorLayoutOverrideModel.test.cjs`; bestehende HostAdapter- und Launcher-Tests bleiben relevante Guardrails.
- Folgepakete bleiben getrennt: G30 validierter HostAdapter-Dry-Run, G31 Pilot-Persistenz, G32 App-Start-Wiederherstellung, G33 UI-Pruefung/Reset, G34 weitere Scopes.

## Statusupdate K19.51
- `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_FREIGABE.md` legt die G28-Entscheidung fest.
- Empfohlener Speicherort ist ein eigener BBM-seitiger UI-Editor-Layout-Override-Speicher hinter dem HostAdapter.
- Ziel-Datenstruktur ist ein Datensatz pro Element-Override mit `targetAppId`, `moduleId`, `scopeId`, `elementId`, `overrides.visible`, `source`, `createdAt` und `updatedAt`.
- Erste spaetere Freigabegrenze ist nur der Pilot-Scope `restarbeiten.ui.main`; keine globale Freigabe fuer alle Module.
- Registry, localStorage und versteckte DOM-Zustaende sind als Speicherort ausgeschlossen; TableLayouts bleiben nur technisches Vorbild.
- Folgepakete sind abgegrenzt: G29 Speicher technisch vorbereiten, G30 validierter HostAdapter-Dry-Run, G31 Pilot-Persistenz, G32 App-Start-Wiederherstellung, G33 UI-Pruefung/Reset, G34 weitere Scopes.
- Keine echte Speicherung, keine DB-Migration, kein IPC, kein localStorage, kein writeFile, keine neue Speicherdatei, keine UI-/Launcher-/Drag-/Target-Selection-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.
- `canPersistVisibility` bleibt `false`; `persistent: true` bleibt blockiert.

## Statusupdate K19.50
- Das spaetere Hidden-Elements-Persistenzmodell ist dokumentiert: neutraler Override mit `scopeId`, `elementId` und `overrides.visible` oder spaeterer `visibility`-ChangeRequest.
- `persistent: false` bleibt Standard fuer Preview-Requests.
- `persistent: true` darf noch nicht produktiv ausgefuehrt werden und wird weiter mit `PERSISTENCE_DISABLED` blockiert.
- `getCapabilities()` enthaelt vorbereitend `canPersistVisibility: false`; versehentlich uebergebene Persistenz-Capabilities werden auf deaktiviert normalisiert.
- `submitChangeRequests(...)` meldet fuer Visibility-Requests zusaetzlich `visibilityPersistenceDisabled: true`.
- Das UI-Editor-kit speichert weiterhin nichts selbst; BBM entscheidet spaeter separat ueber den konkreten Speicherort.
- Keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine automatische Wiederherstellung beim App-Start, keine UI-/Launcher-/Drag-/Target-Selection-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.
- Folgepakete bleiben abgegrenzt: G28 Speicherort-/Freigabeentscheidung ist erledigt; G29 bis G34 fuehren erst spaeter schrittweise zur technischen Vorbereitung, Pilot-Persistenz, App-Start-Wiederherstellung und weiteren Scope-Freigaben.

## Statusupdate K19.49
- Visibility-ChangeRequests fuer Hidden-Element-Hide/Show werden ueber `onPendingChangeRequestsChanged(...)` an den HostAdapter gemeldet.
- Hide wird als `operation: "visibility"` mit `payload.visible === false` gemeldet; Show nutzt dieselbe Operation mit `payload.visible === true`.
- Die Requests bleiben Preview-Requests mit `source: "preview"` und `persistent: false`.
- `submitChangeRequests(...)` bleibt bewusst blockiert und liefert `PERSISTENCE_DISABLED`, `persistenceDisabled: true` und `dryRunOnly: true`.
- Der Dry-Run speichert nichts und schreibt keinen Layout-State.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine Drag-/Target-Selection-Aenderung, keine sichtbare UI-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.
- Folgepakete bleiben abgegrenzt: G27 Persistenz-Vorbereitung, G28 Speicherort-/Freigabeentscheidung und danach G29 bis G34.

## Statusupdate K19.48
- Hide und Show sind als einheitlicher Visibility-ChangeRequest abgesichert.
- Hide erzeugt bzw. nutzt `operation: "visibility"` mit `payload.visible === false`.
- Show erzeugt bzw. nutzt `operation: "visibility"` mit `payload.visible === true`.
- Der bestehende Kit-Vertrag bleibt erhalten: `source: "preview"` und `persistent: false`.
- Pro Preview-Ziel wird ein vorhandener Visibility-Request ueberschrieben, sodass keine widerspruechlichen Hide-/Show-Requests entstehen.
- Pending-/Preview-State ueberschreibt Layout-State weiterhin nur temporaer.
- Layout-State-only Hidden-Elemente bleiben ohne Preview-State im Popover sichtbar, aber `Einblenden` bleibt dafuer deaktiviert, bis ein sicherer HostAdapter-Dry-Run oder Schreibpfad existiert.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine HostAdapter-Schreibausfuehrung, keine Drag-/Target-Selection-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.
- Folgepakete bleiben abgegrenzt: G26 HostAdapter-Dry-Run, G27 Persistenz-Vorbereitung, G28 Speicherort-/Freigabeentscheidung und danach G29 bis G34.

## Statusupdate K19.47
- `BbmUiEditorRuntimeLauncher.js` baut die Hidden-Elements-Eingabe jetzt aus Registry, lesendem `getCurrentLayoutState(...)`, Pending-Visibility-ChangeRequests und in-memory Preview-State.
- Registry liefert bekannte Elemente und Labels; Layout-State liefert `visible`-Overrides.
- Pending-/Preview-State ueberschreibt Layout-State temporaer, damit Preview-Hide/Show weiter Vorrang hat.
- Doppelte Element-IDs werden dedupliziert.
- Layout-State-only Hidden-Elemente koennen im Popover erscheinen; `Einblenden` bleibt fuer diese Eintraege deaktiviert, solange kein sicherer Schreibpfad existiert.
- Temporaere Preview-Hides koennen weiter ueber `Einblenden` in-memory aufgehoben werden.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine neue UI, kein Popover-Umbau, keine Drag-/Target-Selection-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.
- Folgepakete bleiben abgegrenzt: G25 ChangeRequest-Modell, G26 HostAdapter-Dry-Run, G27 Persistenz-Vorbereitung, G28 Speicherort-/Freigabeentscheidung und danach G29 bis G34.

## Statusupdate K19.46
- `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_TRENNSCHNITT.md` dokumentiert den Trennschnitt fuer echte Hidden-Elements-Daten und spaetere Persistenz.
- Registry bleibt die statische Element-Landkarte; Elemente werden bei Hide nicht geloescht.
- Echte Hidden-Elements sollen spaeter aus Registry plus `getCurrentLayoutState()` abgeleitet werden.
- Pending ChangeRequests bleiben vorbereitete, nicht persistierte Hide-/Show-Aenderungen.
- Dauerhafte Persistenz gehoert spaeter als BBM-seitiger Layout-Override hinter den HostAdapter; das UI-Editor-kit speichert nichts.
- Folgepakete sind abgegrenzt: G24 Layout-State-Lesen, G25 ChangeRequest-Modell, G26 HostAdapter-Dry-Run, G27 Persistenz-Vorbereitung, G28 Speicherort-/Freigabeentscheidung und danach G29 bis G34.
- Keine Persistenz, keine DB, kein IPC, kein localStorage, keine neue UI, kein Popover-Umbau, keine Drag-/Target-Selection-Aenderung, keine Fachlogik und keine PDF-/Drucklogik.

## Statusupdate K19.45
- `BbmUiEditorRuntimeLauncher.js` importiert `buildHiddenElementsPopoverViewModel` ausschliesslich ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
- Der kompakte Hidden-Elements-Button toggelt bei `Ausgeblendete: 1+` ein kleines Popover direkt im bestehenden Preview-Panel.
- Das Popover zeigt nur temporaer die aus dem in-memory Preview-State ermittelten ausgeblendeten Elemente.
- Pro Eintrag gibt es eine neutrale Aktion `Einblenden`; sie hebt nur temporaere Preview-Hide-Aenderungen auf und nutzt die vorhandene Preview-State-/ChangeRequest-Mechanik.
- Bei `Ausgeblendete: 0` bleibt das Popover geschlossen; nach dem letzten Einblenden schliesst es ebenfalls.
- Kein Bare-Package-Import `ui-editor-kit/runtime/hidden-elements`, keine grosse Dauerliste, keine Drag-/Target-Selection-Aenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

## Statusupdate K19.44
- `BbmUiEditorRuntimeLauncher.js` importiert `buildHiddenElementsButtonViewModel` ausschliesslich ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
- Das Preview-Panel zeigt einen kompakten Hidden-Elements-Button/Platzhalter mit `Ausgeblendete: 0`.
- Bei temporaer per Preview ausgeblendeten Elementen zaehlt der Button aus dem vorhandenen in-memory Preview-State hoch.
- Durch K19.45 ueberholt: Der Button kann nun ein kompaktes Popover oeffnen und temporaere Preview-Hides wieder einblenden.
- Echte Hidden-Ermittlung aus Registry/Layout-State und Persistenz bleiben separate Folgepakete.
- Kein Bare-Package-Import `ui-editor-kit/runtime/hidden-elements`, keine Drag-/Target-Selection-Aenderung, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

## Statusupdate K19.43
- BBM prueft den offiziellen Kit-Subpath `ui-editor-kit/runtime/hidden-elements` mit `scripts/tests/uiEditorKitHiddenElementsRuntimeImport.test.cjs`.
- CommonJS und ESM werden getestet; sichtbar ausgeblendete Elemente, Button-ViewModel, Popover-ViewModel und neutrale `show`-Aktionen sind abgesichert.
- `src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js` re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs`.
- `scripts/tests/uiEditorKitHiddenElementsRuntimeBridge.test.cjs` sichert Bridge-Pfad, fehlenden Bare-Import, Launcher-Nutzung nur ueber die Bridge und unveraenderte Preview-/Panel-Bridges ab.
- Durch K19.44 ueberholt: `BbmUiEditorRuntimeLauncher.js` nutzt die Hidden-Elements-Runtime nun fuer den kompakten Button.
- K19.43 selbst enthielt noch keinen Button, kein Popover, keine DOM-Aenderung, kein Drag, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

## Statusupdate K19.42
- `docs/UI_EDITOR_HIDDEN_ELEMENTS_BUTTON_KONZEPT.md` dokumentiert das Bedienkonzept fuer ausgeblendete Elemente.
- Grundregel: Hide entfernt kein Element aus Registry oder Layout-State; Hide bedeutet nur `visible = false`.
- Das Editorpanel soll schlank bleiben und spaeter nur einen kompakten Button wie `Ausgeblendete: 3` erhalten.
- Durch K19.45 ueberholt: Popover/Dropdown mit Einblenden-Aktion ist fuer temporaere Preview-Hides vorbereitet.
- Folgeschritte sind abgegrenzt: G19 Hidden-Elements-ViewModel im UI-Editor-kit, G20 BBM Importvertrag/Bridge, G21 kompakter Button und G22 Popover sind erledigt; G23 Persistenz bleibt separat.
- Weiterhin keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Drag-/DOM-Aenderung.

## Statusupdate K19.41
- `BbmUiEditorRuntimeLauncher.js` importiert `buildPanelViewModel` ausschliesslich ueber `./uiEditorKitPanelRuntimeBridge.js`.
- `buildBbmPanelViewModel(...)` baut aus bestehenden Launcher-Daten ein neutrales Kit-Panel-ViewModel.
- Das Preview-Panel liest Titel, Ziel-ID, Preview-Ziel-ID, `allowedOps`, `lockedOps`, StatusText, Summary und Button-Freigaben aus dem ViewModel.
- Drag, Panel-Position, Target Selection, DOM-Markierung, Button-Handler, Preview-Operationen und Reset/Verwerfen bleiben im BBM-Launcher.
- Kein Bare-Package-Import `ui-editor-kit/runtime/panel` im Renderer und keine direkte produktive Node-Modules-Nutzung ausser ueber die Bridge.
- Keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine beabsichtigte sichtbare Funktionsaenderung.

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
