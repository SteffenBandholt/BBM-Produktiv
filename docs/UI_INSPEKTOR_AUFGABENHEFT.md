# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M13.6a abgeschlossen (Panel ist aus dem Header gelöst und bleibt verschiebbar). K19.16a abgeschlossen (neutraler BBM-UI-Editor-Aktivmodus zeigt festen Registry-Scope). M62 abgeschlossen (alte BBM-Auswahlruntime entfernt; Statuspanel nutzt ausschliesslich Kit-Runtime). M63B.1 abgeschlossen (interne read-only Inspector-Bridge, sichtbare Konsole vorbereitet).

Statusupdate: M36 abgeschlossen (UI-Editor Fixstand nach M29 bis M35 dokumentiert).

Aktueller Stand:
- M1 bis M13.6a abgeschlossen.
- K19.0 abgeschlossen: erste explizite UI-Elementliste fuer das Protokoll-Modul, ohne Editor-Integration und ohne produktive UI-Aenderung.
- K19.7 abgeschlossen: installierter Einstieg unter `uiEditor/` war mit dem offiziellen BBM-Registry-Einstieg verbunden, ohne produktive UI-Aenderung.
- K19.9a abgeschlossen: `uiEditor/` enthaelt installierte UI-Editor-Artefakte; die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js`; `scripts/test.cjs` ist nicht direkt an installierte Artefakt-Testdateien gekoppelt.
- K19.13a abgeschlossen: Der BBM-Artefakttest erkennt `uiEditor.global` robust ueber `id`, `uiScope`, `uiScopeId` oder den Registry-Schluessel und verlangt `uiEditor/targetAppRegistry.js` als installiertes Pflichtartefakt.
- K19.16a abgeschlossen: Der neutrale UI-Editor-Aktivmodus zeigt den festen aktiven BBM-Registry-Scope `protokoll.topsScreen`; bei leerem Scope wird `nicht erkannt` angezeigt.
- M21 abgeschlossen: BBM-Produktiv ist als Beispiel-/Pilot-Zielapp vom generischen UI-Editor-kit getrennt dokumentiert; `Restarbeiten` ist erreichbarer unfertiger Pilot-Scope, `Protokoll` defensiv/read-only.
- M32 abgeschlossen: App-Start und sichtbarer Launcher wurden lokal geprueft; die Save/Load/Reset-Bedienfolge und Blockaden sind durch `npm test` abgedeckt.
- M33 abgeschlossen: Der globale UI-Editor ist zusaetzlich fuer registrierte TOPS-Quicklane-Elemente im Scope `protokoll.topsScreen` bedienbar; Restarbeiten bleibt bedienbar.
- M34 abgeschlossen: Aktiver UI-Scope, Auswahl und Layout-Scope sind beim Wechsel zwischen Restarbeiten und Protokoll/TOPS eindeutig; alte Auswahlen werden geloescht und unbekannte Scopes sichtbar blockiert.
- M35 abgeschlossen: Bedienhinweise und Abnahmegrenzen sind sichtbar festgezogen; der Editor bleibt fachneutral und bearbeitet keine Fachwerte.
- M36 abgeschlossen: Der globale UI-Editor-Fixstand nach M29 bis M35 ist als Abnahmestand dokumentiert.

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
- [x] M21 BBM-Zielapp sauber vom generischen UI-Editor-kit trennen
- [x] M32 Globalen UI-Editor im App-Kontext per Smoke-Test und Abnahmeprotokoll pruefen
- [x] M33 Globalen UI-Editor fuer den Protokoll-/TOPS-Scope sichtbar anbinden
- [x] M34 UI-Editor Scope-Wechsel und Bedienfuehrung absichern
- [x] M35 UI-Editor Bedienhinweise und Abnahmegrenzen festziehen
- [x] M36 UI-Editor Fixstand nach M29 bis M35 dokumentieren und absichern
- [x] M56 Dauerhaften Auswahlrahmen im UI-Editor-Statuspanel anzeigen
- [x] M59 UI-Editor-kit Selection-Runtime kontrolliert im BBM-Statuspanel parallel testbar machen
- [x] M60 UI-Editor-kit Selection-Runtime im Statuspanel als Standard verwenden
- [x] M61 UI-Editor-kit Selection-Runtime exklusiv im Statuspanel verwenden
- [x] M62 Alte BBM-Auswahlruntime sicher entfernen und Kit-Vertraege weiter pruefen
- [x] M63A Editor-Bestand und Integrationsplan dokumentieren
- [x] M63B M51/M52-Auswahl read-only an EditorScopeInspector anbinden
- [x] M63C Kleine Layout-Bedienkonsole fuer ausgewaehltes Element


## Statusupdate M63C
- M63C korrigiert die sichtbare Bedienung auf drei Modi und ein gemeinsames Steuerkreuz: `[Move] [Breite] [Hoehe]` plus Pfeile und deaktiviertem Mittelpunkt.
- Schrittweite ist fuer M63C zunaechst `5`; die konkrete Operation kommt ausschliesslich aus explizitem `allowedOps`.
- Pilotfreigabe: nur `bbm.uiEditorTest.card` (`Testkarte`) erhaelt `allowedOps: ["move", "resize"]`; `bbm.main.navigation`, Header, Main und Sidebar bleiben ohne aktive move/resize-Freigabe. `capabilities: ["layout"]` wird nicht in konkrete Operationen uebersetzt.
- Die Bridge haelt keinen eigenen Layoutzustand und nutzt keinen lokalen Map-Speicher mehr.
- Layoutschritte laufen ueber `EditorScopeInspector` -> `EditorLayoutControls` -> `ChangeRequestValidator` -> BBM-main-HostAdapter -> vorhandenen `EditorLayoutStore` -> sichtbare Anwendung am registrierten M54-Ziel.
- Breite/Hoehe starten beim ersten Groessenschritt aus Registry-/Layout-Standard, gespeichertem Layoutwert oder einmalig aus `getBoundingClientRect()` des expliziten M54-Refs; Mindestgroesse 20 px. M63C validiert dies visuell an einer freien Testkarte statt am festen CoreShell-Grid.
- Keine Textgroesse, keine Textposition, keine freie Werteingabe, kein Drag-and-drop, keine direkte Style-Mutation im Panel/Bridge, keine neue Registry, keine neue Auswahlhaltung und keine neue Persistenz.
- Neue Doku: `docs/M63C_LAYOUT_CONTROL_CONSOLE.md`.
- Neuer Guardrail-Test: `scripts/tests/m63cLayoutControlConsole.test.cjs`; `scripts/test.cjs` fuehrt ihn mit aus.
- Offener Punkt: manuelle Windows-/Electron-Sichtpruefung nachholen.

## Statusupdate M63B
- M63B bindet die bestehende M51/M52-Auswahl read-only an den vorhandenen `EditorScopeInspector`-Layout-Control-Pfad an.
- Neue Bridge: `src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js`.
- Fuehrend bleiben M51/Kit-Ziel-App-Registry und M52 `selectedElement`; die Bridge haelt keine eigene Auswahlwahrheit und erzeugt keine zusaetzlichen Registry-Elemente.
- M63B.1 korrigiert die sichtbare Statuspanel-Oberflaeche: Der Detailbereich zeigt hoechstens den lesbaren Elementnamen und den neutralen Platzhalter `Bearbeitung wird vorbereitet.`.
- Technische Inspector-/Bridge-/Runtime-Daten, Control-IDs, interne Operationsnamen, `allowedOps` und Fehlercodes bleiben intern und werden nicht sichtbar ausgegeben.
- `layout.read`, `layout.save` und `layout.reset` werden weiterhin nicht in konkrete EditorRuntime-Operationen uebersetzt; ohne explizites `allowedOps` bleibt die interne Anzeige bei `allowedOps: []`.
- Fehlende `role`-/Pflichtvertraege werden intern als `unsupported`/`blocked` behandelt; es wird nichts aus Label, CSS, Tagname oder DOM-Struktur geraten.
- Keine Apply-/Save-/Load-/Reset-Ausfuehrung, keine LayoutStore-Schreiboperation, keine DOM-Suche, keine IPC-Erweiterung und keine direkte Style-Mutation.
- Neue Doku: `docs/M63B_READONLY_INSPECTOR_BRIDGE.md`.
- Neuer Guardrail-Test: `scripts/tests/m63bReadonlyInspectorBridge.test.cjs`; `scripts/test.cjs` fuehrt ihn mit aus.
- Naechster sinnvoller Schritt: M63C darf die kompakte Bedienkonsole mit Modusauswahl und Steuerkreuz vorbereiten; Pilot aus vorhandenen Controls/Tests waehlen, keine neue Operation erfinden.
- Offener Punkt: manuelle Windows-Abnahme fuer die sichtbare Statuspanel-Darstellung nachholen.

## Statusupdate M62
- M62 entfernt die nicht mehr produktiv genutzte BBM-eigene Hover-/Selection-Runtime aus `src/renderer/ui-editor/`.
- Geloescht sind `bbmUiElementSelection.js`, `bbmUiSelectionOverlay.js` und `bbmUiSelectedOverlay.js`.
- Das Statuspanel besitzt ausschliesslich den Kit-Controller und die bestehende M59-Host-Bridge.
- M55/M56-Vertraege bleiben ueber Kit-Bridge-/Statuspanel-Tests abgesichert: Hover auf expliziten M54-Refs, Auswahl desselben Ziels ohne doppelten Hover, Reset, Stop, Close/Destroy und keine doppelten Listener/Controller.
- Neue Doku: `docs/M62_BBM_SELECTION_LEGACY_CLEANUP.md`.
- Neuer Test: `scripts/tests/m62BbmSelectionLegacyCleanup.test.cjs`; M55/M56-Tests wurden auf Kit-Bridge-Vertraege umgestellt.
- Offener Punkt: manuelle Windows-Abnahme fuer sichtbaren Kit-Start, Hover, Auswahl, Reset, Stop, Close/Destroy und doppelte Overlayfreiheit nachholen.

## Statusupdate M61
- M61 entfernt die BBM-eigene Hover-/Selection-Runtime aus dem UI-Editor-Statuspanel.
- Das Statuspanel zeigt kein Runtime-Dropdown mehr; die Auswahl-Laufzeit ist fest `UI-Editor-kit`.
- Hover, Auswahl, Reset und Synchronisation laufen ueber den Kit-Controller und die bestehende M59-Host-Bridge.
- Kit-Fehler bleiben sichtbar, fuehren aber nicht mehr zu einem stillen Rueckfall auf die alte BBM-Runtime.
- Schliessen und Destroy bereinigen den Kit-Controller; wiederholtes Oeffnen erzeugt keinen zweiten Kit-Controller pro Panel-Sitzung.
- Neue Doku: `docs/M61_KIT_RUNTIME_ONLY.md`.
- Angepasste Tests: `scripts/tests/m59KitSelectionRuntimeIntegration.test.cjs` und `scripts/tests/m60KitRuntimeStandard.test.cjs`; `scripts/test.cjs` fuehrt beide weiter aus.
- Offener Punkt: manuelle Windows-Abnahme fuer sichtbaren Kit-Start, Hover, Auswahl, Reset, Fehlermeldung und doppelte Overlayfreiheit nachholen.

## Statusupdate M60
- M60 macht die generische UI-Editor-kit Selection-Runtime im Entwicklungsbetrieb zur Standard-Auswahlruntime des UI-Editor-Statuspanels.
- Beim Oeffnen startet das Panel sitzungsbezogen mit `selectionRuntime === "kit"` und initialisiert den Kit-Controller kontrolliert nach dem Laden der bestehenden BBM-Registry-Elemente.
- Die BBM-Runtime bleibt vollstaendig erhalten, im Dropdown auswaehlbar und ist der dokumentierte Rueckfallweg.
- Bei fehlerhafter Kit-Initialisierung werden angefangene Kit-Controller/Overlays bereinigt, `selectionRuntime` faellt auf `"bbm"` zurueck und der Runtime-Fehler bleibt sichtbar.
- Schliessen, Destroy und Runtime-Wechsel stoppen und zerstoeren Kit-Controller sauber; wiederholtes Oeffnen erzeugt keine mehrfachen Kit-Controller pro Panel-Sitzung.
- Neue Doku: `docs/M60_KIT_RUNTIME_STANDARD.md`.
- Neue Tests: `scripts/tests/m60KitRuntimeStandard.test.cjs`; `scripts/test.cjs` fuehrt den Test mit aus.
- Offener Punkt: manuelle Windows-Abnahme fuer sichtbares Dropdown, Kit-Start, BBM-Rueckfall und doppelte Overlayfreiheit nachholen.

## Statusupdate M59
- M59 integriert die generische Selection-Runtime aus UI-Editor-kit M58 kontrolliert in BBM.
- Die Abhängigkeit ist auf `af1fbabd0b875a4ab382ed84c5cd986c3c7acb14` gepinnt.
- Standard im Statuspanel bleibt `BBM`; `UI-Editor-kit` ist als sitzungsbezogener Testmodus umschaltbar.
- Die Host-Bridge `src/renderer/ui-editor/bbmKitSelectionHost.js` nutzt die bestehende Registry-Liste, den M54-Ref-Store und den M52-Auswahlstatus.
- M55/M56 bleiben erhalten; es gibt keinen neuen fachlichen Selection Store, keine Speicherung der Runtime-Auswahl, keine DOM-Suche und keinen neuen IPC-Kanal.
- Neue Doku: `docs/M59_KIT_SELECTION_PARALLELTEST.md`.
- Neue Tests: `scripts/tests/m59KitSelectionRuntimeIntegration.test.cjs`; `scripts/test.cjs` führt den Test mit aus.
- Nächster sinnvoller Schritt: Windows-Paralleltest durchführen und für M60 entscheiden, ob die Kit-Runtime weiter stabilisiert oder als künftiger Standard vorbereitet wird.





## Statusupdate M56-Fix PR #196
- Randfehler korrigiert: Klick auf ein zuvor gehovertes Element entfernt den blauen Hoverrahmen sofort, ohne weitere Mausbewegung.
- Der Controller prueft den aktuellen Auswahlstatus nun auch bei unveraendertem Hoverziel erneut und stellt `syncHoverWithSelection()` fuer die Statuspanel-Synchronisation bereit.
- Keine neue fachliche Auswahlhaltung; die Pruefung liest weiterhin live aus dem bestehenden `selectedElement`-Pfad.
- `scripts/tests/m56PersistentSelectionFrame.test.cjs` deckt den tatsaechlichen Hover-Klick-Ablauf, Auswahlwechsel, Reset und Escape ab.

## Statusupdate M56
- M56 ergaenzt im bestehenden UI-Editor-Statuspanel einen dauerhaften orangefarbenen Auswahlrahmen fuer das aktuell im M52-Statusmodell ausgewaehlte Element.
- Quelle bleibt ausschliesslich `selectedElement` nach `refresh()` beziehungsweise nach dem bestehenden `uiEditorSelectElement`-Pfad.
- Hover bleibt blau und temporaer im aktiven Auswahlmodus; Auswahl bleibt orange sichtbar, auch nach Escape oder Auswahlmodus-Stopp.
- `bbm.main.actions` bleibt ohne Rahmen, solange keine M54-HTMLElement-Referenz existiert.
- Neue Doku: `docs/M56_DAUERHAFTER_AUSWAHLRAHMEN.md`.
- Neue Tests: `scripts/tests/m56PersistentSelectionFrame.test.cjs`; `scripts/test.cjs` fuehrt den Test mit aus.
- Naechster Schritt: M57 klaert als kleinstmoegliches Paket die fachlich eindeutige Actions-Referenz oder bestaetigt den weiteren Ausschluss.

## Statusupdate M55
- M55 ergaenzt im bestehenden UI-Editor-Statuspanel einen ausdruecklich startbaren Auswahlmodus fuer die vier M54-Refs.
- Gebundene auswählbare Ziele bleiben `bbm.main.shell`, `bbm.main.navigation`, `bbm.main.header` und `bbm.main.content`.
- `bbm.main.actions` bleibt bewusst ungebunden und nicht auswaehlbar.
- Zielaufloesung erfolgt nur ueber explizite HTMLElement-Refs und `contains(...)`; keine DOM-Suche, keine Legacy-Runtime, kein EditorV2-/UI-Inspector-Core.
- Neue Doku: `docs/M55_VISUELLE_UI_AUSWAHL_UEBER_EXPLIZITE_REFS.md`.
- Naechster Schritt: M56 klaert einen eindeutigen Actions-Bereich, bevor Actions gebunden werden kann.

## Statusupdate M54
- M54 bindet die vorhandenen CoreShell-HTMLElement-Referenzen explizit an die M51/M52-Registry-IDs.
- Gebunden sind `bbm.main.shell -> host`, `bbm.main.navigation -> sidebar`, `bbm.main.header -> headerEl` und `bbm.main.content -> content/contentRoot`.
- `bbm.main.actions` bleibt bewusst ungebunden, weil aktuell kein einzelner vorhandener HTMLElement-Aktionsbereich fachlich eindeutig passt.
- Neue Doku: `docs/M54_EXPLIZITE_UI_ELEMENT_REFERENZEN.md`.
- Der alte RuntimeLauncher wird in `CoreShell` nicht mehr automatisch parallel gestartet; die M52-Navigation `UI-Editor Status` bleibt erhalten.
- Kein Auswahlmodus, kein Overlay, kein Hover, keine Layoutmutation, keine DOM-Suche und keine IPC-Übertragung von HTMLElement-Objekten.
- Naechster Schritt: M55 klein planen, insbesondere den fachlich eindeutigen Actions-Bereich klaeren, bevor `bbm.main.actions` gebunden wird.

## Statusupdate M53
- M53 ist als reines Analysepaket dokumentiert.
- Neue Bestandsdoku: `docs/M53_BESTAND_VISUELLE_UI_AUSWAHL.md`.
- Historische UI-Inspector-, EditorV2- und TargetSelection-Pfade wurden gegen M51/M52 abgeglichen.
- Keine Auswahlruntime, kein Overlay, keine UI-, IPC-, Registry- oder HostAdapter-Aenderung wurde umgesetzt.
- Empfehlung: keine Legacy-Reaktivierung; nur Konzepte/Tests/visuelle Muster teilweise uebernehmen und die spaetere ElementRef-Bindung minimal neu auf Basis von UI-Editor-kit, BBM-Registry und HostAdapter bauen.
- Naechster sinnvoller Schritt: M54 explizite ElementRef-Map fuer die fuenf BBM-M51/M52-Registry-Elemente vorbereiten, noch ohne sichtbares Overlay.

## Statusupdate M36
- Der globale UI-Editor-Fixstand nach M29 bis M35 ist dokumentiert.
- Fixiert sind neutrale Layoutaenderungen, Speichern/Laden/Reset, sichtbare App-Bedienung, Restarbeiten-Scope, Protokoll/TOPS-Scope, Scope-Wechsel und Bediengrenzen.
- Neue Doku: `docs/M36_UI_EDITOR_FIXSTAND_ABNAHME.md`.
- Keine PDF-/Druck-/Mail-/Audio-, Protokoll- oder Restarbeiten-Fachlogik wurde geaendert.
- Keine weitere Modul-Anbindung, keine UI-Umbauten und keine neue Editor-Architektur wurden eingefuehrt.

## Statusupdate M35
- Die sichtbare UI-Editor-Bedienung ergaenzt klare Bediengrenzen: nur neutrale Layoutaenderungen, keine Fachwerte.
- PDF, Druck, Mail, Audio und DB-Fachlogik werden sichtbar als nicht Teil dieses Editors benannt.
- Das Layoutpanel zeigt ausgewaehltes Element, Layout-Scope, erlaubte neutrale Layoutoperationen und Block-/Statusmeldungen.
- Kein ausgewaehltes Element und unbekannte Elemente im aktiven Scope werden sichtbar blockiert.
- Neue Doku: `docs/M35_UI_EDITOR_BEDIENHINWEISE_ABNAHMEGRENZEN.md`.
- Keine PDF-/Druck-/Mail-/Audio-, Protokoll- oder Restarbeiten-Fachlogik wurde geaendert.
- `git diff --check`, Runtime-Test, Installations-/Neutralitaetstest, Vertrags-Selftest, `npm test` und `npm start` liefen gruen.

## Statusupdate M34
- Der globale UI-Editor zeigt den aktiven UI-Scope eindeutig als `Aktiver UI-Scope`.
- Ein Wechsel zwischen `protokoll.topsScreen` und `restarbeiten.screen` loescht die bisherige Auswahl und verhindert, dass alte Ziele im falschen Scope weiterwirken.
- Layoutaktionen bleiben an den aktuell aufgeloesten Layout-Scope gebunden: `protokoll.topsScreen` oder `restarbeiten.ui.main`.
- Unbekannte Scopes zeigen eine sichtbare blockierte Layoutmeldung.
- Neue Doku: `docs/M34_UI_EDITOR_SCOPE_WECHSEL_BEDIENFUEHRUNG.md`.
- Keine PDF-/Druck-/Mail-/Audio-, Protokoll- oder Restarbeiten-Fachlogik wurde geaendert.
- Naechster Schritt: fachliche Klick-Abnahme durch den Nutzer, falls die sichtbare Scope-Wechsel-Bedienfolge im echten App-Fenster zusaetzlich bestaetigt werden soll.

## Statusupdate M33
- Der globale UI-Editor nutzt fuer `protokoll.topsScreen` nun einen neutralen EditorRuntime-/Layout-Scope.
- Registrierte TOPS-Quicklane-Elemente koennen sichtbar ausgewaehlt werden; Layout-Scope, Anwenden/Speichern, Laden und Reset sind verfuegbar.
- Neue Doku: `docs/M33_UI_EDITOR_PROTOKOLL_SCOPE_ANBINDUNG.md`.
- Der Restarbeiten-Pilot bleibt ueber `restarbeiten.screen` -> `restarbeiten.ui.main` unveraendert bedienbar.
- Unbekannte Elemente und Fach-/DOM-/Datenbankpayloads werden blockiert.
- Keine PDF-/Druck-/Mail-/Audio-, Protokoll- oder Restarbeiten-Fachlogik wurde geaendert.
- Naechster Schritt: fachliche Klick-Abnahme durch den Nutzer, falls die sichtbare TOPS-Bedienfolge im echten App-Fenster zusaetzlich bestaetigt werden soll.

## Statusupdate M32
- Der globale UI-Editor wurde nach M29/M30/M31 als reines Smoke-Test- und Abnahmepaket geprueft.
- Neue Abnahmedoku: `docs/M32_UI_EDITOR_APP_SMOKE_TEST.md`.
- `npm start` startete die App sichtbar; das Fenster `BBM` war vorhanden und antwortend.
- Der UI-Editor-Launcher war im DEV-Kontext sichtbar.
- Registrierte Auswahl, Layout-Scope, Anwenden/Speichern, Laden, Reset und sichtbare Blockaden sind technisch durch `npm test` abgedeckt.
- Es wurde keine Codekorrektur vorgenommen.
- Keine PDF-/Druck-/Mail-/Audio-, Protokoll- oder Restarbeiten-Fachlogik wurde geaendert.
- Naechster Schritt: fachliche Klick-Abnahme durch den Nutzer, falls die sichtbare Bedienfolge im echten App-Fenster zusaetzlich bestaetigt werden soll.

## Statusupdate M21
- BBM-Produktiv ist Beispiel-/Pilot-Zielapp fuer das generische UI-Editor-kit, nicht fachliche Grundlage des Editors.
- Der UI-Editor bleibt generisch und enthaelt keine BBM-, Restarbeiten- oder Protokoll-Fachlogik.
- `Restarbeiten` ist in BBM erreichbar, bleibt aber fachlich/funktional unfertig und ist nur Pilot-Scope.
- `Protokoll` ist noch nicht fertig bereinigt und fuer UI-Editor-Themen defensiv/read-only einzuordnen.
- Die Ziel-App liefert die ElementRegistry; der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Keine Selbstuntersuchung der Ziel-App-Oberflaeche, keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.
- Alte UI-Inspector-/Scan-Begriffe bleiben nur als historischer Kontext stehen und sind fuer neue Arbeiten keine Zielrichtung.
- Reines Doku-/Statuspaket ohne Code-, Fachlogik-, DB-, IPC-, UI-, Protokoll- oder Restarbeiten-Funktionsaenderung.

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

## M63A Analysebefund – Editor-Bestand und Integrationsplan
- M63A ist als reine Analyse- und Dokumentationsstufe abgeschlossen.
- Der vorhandene Bestand unter `src/renderer/editorRuntime/`, `src/renderer/ui-editor/`, Modul-Editorregistries und relevante Tests wurde ausgewertet.
- Befund: `EditorScopeInspector`, `editorLayoutControls`, `editorChangeRequestValidator`, HostAdapter-Vertrag und `editorLayoutPersistence` sind wiederverwendbar und duerfen fuer M63 nicht neu erfunden werden.
- Fuehrend fuer die sichtbare Auswahl bleibt M52/M60: UI-Editor-kit Selection-Runtime -> `bbmKitSelectionHost` -> M52 `selectedElement`.
- Fuehrend fuer die sichtbare Ziel-App-Registry bleibt die M51/Kit-Registry; keine zweite Registry und keine zweite Auswahlhaltung duerfen entstehen.
- Empfehlung fuer M63B: kleine BBM-spezifische Inspector-Bridge, die die vorhandene Auswahl-ID und Registry-Metadaten an den vorhandenen Inspector weiterreicht.
- Pilotoperation fuer spaetere Umsetzung: `move`, weil Apply/Load/Reset dafuer im vorhandenen Inspector-Test bereits end-to-end belegt sind.
- Keine produktive UI-Erweiterung, keine Layoutoperation, keine Persistenz und kein alter EditorLab-/V2-Einstieg wurden in M63A aktiviert.
- Dokumentation: `docs/M63A_EDITOR_BESTAND_UND_INTEGRATIONSPLAN.md`.
- Neuer Guardrail-Test: `scripts/tests/m63aEditorIntegrationAudit.test.cjs`.
- Naechster sinnvoller Schritt: M63B als read-only Bridge-Paket mit statischem/funktionalem Bridge-Test vorbereiten.

## M63C.4 Korrektur – Testfläche ausserhalb des Bedienpanels

- Die M63C-Testkarte wird nicht mehr als Kind des ausgeschlossenen UI-Editor-Bedienpanels gerendert.
- Der UI-Editor-Arbeitsbereich enthaelt Bedienpanel und Testflaeche als getrennte Geschwisterbereiche.
- `getPanelRoot()` bleibt auf das Bedienpanel begrenzt; Klicks in der Testflaeche laufen ueber die bestehende Kit-Auswahlruntime.
- Der Realintegrationstest `scripts/tests/m63cRealRegistryPanelIntegration.test.cjs` sichert ab, dass die Testkarte ausserhalb von `panelRoot` liegt, per echtem Klick in `selectedElement` uebernommen wird und Panelbuttons keine Zielauswahl ausloesen.

## M64 Abschlussnotiz – UI-Editor-Testfläche
- M64 erweitert die bisherige einzelne Testkarte zu einer kleinen expliziten UI-Editor-Testfläche.
- Registrierte Testelemente: Testflächen-Root, Testkarte, Überschrift, Beispieltext, Beispielbutton-Hülle, Eingabefeld-Hülle, Auswahlfeld-Hülle und Beispieltabelle.
- Alle Testelemente werden manuell über die führende Registry geführt und beim Rendern per explizitem HTMLElement-Ref gebunden.
- Button, Eingabefeld und Auswahlfeld bleiben neutrale Hüllen: keine Fachaktion, keine Dateneingabe, keine Auswahlwertänderung, kein IPC und keine Datenbankaktion.
- Die Testfläche bleibt außerhalb des ausgeschlossenen Bedienpanels; Auswahl und Layoutschritte laufen weiter über Kit-Auswahl, Inspector-Bridge, HostAdapter und Layout-State.
- Neuer Guardrail-Test: `scripts/tests/m64UiEditorTestSurface.test.cjs`.
- Nächster Schritt: manuelle Electron-/Windows-Sichtprüfung aller M64-Testelemente mit Auswahlrahmen und Move-/Resize-Schritten.

## M64 Korrektur – Parent-Vertrag und Integrationsauswahl
- Der M64-Parent-Override in der Inspector-Bridge wurde entfernt; Parent-IDs werden ausschließlich aus der führenden Registry übernommen.
- `bbm.uiEditorTest.workspace` ist kein zweites Root-Element mehr; die Testfläche ist als Container unter `bbm.main.content` eingeordnet.
- Der M64-Test prüft nun Kit-Auswahl, Elementdetails, Overlay-Ref-Auflösung und Layoutwirkung für alle M64-Testelemente.
- Fachaktions-Guardrails sichern ab, dass Button-, Eingabe- und Auswahl-Hüllen ausschließlich Editor-Auswahlziele sind.

## M64 Korrektur 2 – Ein-Root-Startpfad
- Die allgemeine Mehrfach-Root-Aufweichung wurde zurückgenommen; der Runtime-Vertrag bleibt bei genau einem Registry-Root.
- Einziger Root der BBM-Registry ist wieder `bbm.main.shell`.
- `bbm.uiEditorTest.workspace` ist als Testflächen-Container unter `bbm.main.content` eingeordnet und wird nicht mehr als Root behandelt.
- Der M64-Test prüft nun zusätzlich den echten `startBbmUiEditorRuntime()`-Pfad und den echten IPC-Status-/Elementpfad über `uiEditorIpc._m52`.

## M64 Korrektur 3 – ergonomische Prüfanordnung
- Die M64-Testfläche ist für wiederholte manuelle Tests in einen sichtbaren Prüfarbeitsbereich mit Testfläche und kompaktem Steuerpanel eingeordnet.
- Auf Desktop-Breiten liegt das Steuerpanel neben der Testfläche und bleibt per Sticky-Verhalten sichtbar.
- Unter ca. 1100px fällt die Prüfanordnung auf eine einspaltige Darstellung zurück.
- Auswahl- und Layoutvertrag bleiben unverändert; die Testfläche bleibt außerhalb des ausgeschlossenen Bedienpanel-Roots.

## M64 Korrektur 4 – Sitzungs-Verwerfen und Editor-Schalter
- Die M64-Prüffläche erhält eine Sitzungs-Baseline aus dem vorhandenen HostAdapter/Layout-State.
- Die Mitte des Steuerkreuzes verwirft Änderungen des ausgewählten Elements auf den Zustand beim Öffnen der aktuellen Editor-Sitzung.
- Das rechte Steuerpanel zeigt offene Sitzungsänderungen und bietet „Alle Änderungen verwerfen“ sowie „Editor ausschalten/einschalten“.
- Rücknahmen laufen über Inspector-Bridge und HostAdapter/Layout-State; das Panel setzt keine DOM-Styles direkt zurück.
- Ausschalten stoppt Auswahlmodus und Overlays, ohne Sitzungsänderungen automatisch zu verwerfen.

## M64 Korrektur 5 – saubere Runtime-Sitzungsverwaltung
- Die M64-Sitzungs-Baseline liegt nicht mehr im sichtbaren Statuspanel, sondern in der neutralen Inspector-/Runtime-Schicht.
- Das Statuspanel nutzt nur öffentliche Bridge-Befehle für Sitzungsstart, Status, Element-Verwerfen, Alles-Verwerfen und Sitzungsende.
- Die interne `__getHostAdapter`-Hintertür wurde entfernt; die Bridge greift nicht direkt auf HostAdapter- oder LayoutStore-Interna zu.
- Verwerfen, Editor ein-/ausschalten und Schließen bleiben funktional; Guardrails sichern die Architekturgrenzen ab.

## M64 Korrektur 6 – IPC-Elementvertrag für Verwerfen-Mitte
- Der IPC-Elementklon überträgt `editable` und `lockedOps` explizit aus der führenden Registry.
- Die Kreuzmitte bleibt im Panel weiterhin von `selectedElement.editable` abhängig; keine Ableitung aus IDs, DOM oder allowedOps.
- Der M64-Test prüft den echten IPC-Auswahl-/Detailpfad und die Aktivierung der Kreuzmitte nach einer Layoutänderung.

## M65 Abschlussnotiz – Layout speichern, laden und wiederherstellen
- M65 ergänzt den M64-Sitzungsablauf um explizites Speichern und Laden über öffentliche Inspector-/Bridge-Methoden.
- Der BBM-Main-HostAdapter trennt aktuelle Sitzungswerte von gespeicherten Layoutwerten: Layoutschritte ändern zuerst die aktuelle Darstellung, `saveLayoutSession` übernimmt diese Werte in den vorhandenen Storage-Adapter.
- Beim Öffnen des Panels wird ein gespeicherter Layoutzustand über `loadSavedLayout` geladen und danach als Sitzungsbaseline verwendet.
- Das rechte Steuerpanel zeigt Speicherstatus und den neuen Button „Änderungen speichern“; Bedienbuttons bleiben vom Editor ausgeschlossen und erhalten keine Registry-ID.
- Verwerfen nach dem Speichern kehrt zum zuletzt gespeicherten Zustand zurück, nicht zum ursprünglichen Registry-Default.
- Neuer Guardrail-/Roundtrip-Test: `scripts/tests/m65LayoutPersistenceRoundtrip.test.cjs`.
- Nicht umgesetzt: keine Profilverwaltung, kein Autosave, keine direkte Panel- oder DOM-Persistenz, keine produktive Fachmaske und keine PDF-Änderung.
- Hinweis: Die Cloud-Umgebung erlaubt keine praktische Windows-/Electron-Neustartprüfung; der Roundtrip ist automatisiert über einen injizierten persistenten Storage-Adapter sowie den separaten BBM-Main-Storage-Adapter abgesichert.

## M65 Korrektur – dauerhafte Speicherung ehrlich melden
- Der produktive BBM-Main-Storage-Adapter fällt bei fehlendem Browser-Storage nicht mehr still auf Memory zurück.
- `createBbmMainUiLayoutStorage()` meldet `available` und `persistent` explizit und unterscheidet kein gespeichertes Layout, erfolgreich gelesenen Payload und Lesefehler.
- `saveLayoutSession()` meldet Erfolg nur noch bei verfügbarer persistenter Speicherung und erfolgreicher Verifikation; bei Fehler bleibt die Session-Baseline unverändert.
- `loadSavedLayout()` unterscheidet `savedLayoutFound: true`, `savedLayoutFound: false` und Ladefehler.
- Das Panel zeigt „Noch kein Layout gespeichert“, „Gespeichertes Layout geladen“, „Gespeichertes Layout konnte nicht geladen werden.“ und „Layout konnte nicht dauerhaft gespeichert werden.“ passend zum Ergebnis.
- Der Speichern-Button berücksichtigt `persistenceAvailable` und `persistencePersistent` aus dem öffentlichen Inspector-/Bridge-Status.
- M65-Tests decken nun leeren Storage, fehlenden produktiven Browser-Storage, beschädigtes JSON, Schreibfehler und erfolgreichen Browser-Storage-Roundtrip ab.

## M66 Abschlussnotiz – Layout auf Standard zurücksetzen
- M66 ergänzt neben ↶ und „Alle Änderungen verwerfen“ den dritten getrennten Rücksetzweg „Auf Standard zurücksetzen“.
- Vor Ausführung erscheint ein Sicherheitsdialog mit „Abbrechen“ und destruktiv gekennzeichnetem Bestätigungsbutton.
- Der Reset läuft über die öffentliche Inspector-/Bridge-/HostAdapter-Kette; das Panel greift nicht direkt auf Storage oder DOM-Styles zu.
- Der persistente BBM-Main-Scope `bbm-produktiv / bbm.main / bbm.main-layout / default` wird gelöscht; andere Scopes/Profile und Fachdaten bleiben ausgeschlossen.
- Die sichtbaren registrierten M64-Testelemente springen sofort auf Registry-/Layout-Defaults; fehlende Default-Größen entfernen Inline-width/height.
- Nach erfolgreichem Reset ist der Standardzustand neue Sitzungsbaseline und das Panel meldet „Standardlayout aktiv“ ohne offene Änderungen.
- Neuer Guardrail-/Roundtrip-Test: `scripts/tests/m66ResetLayoutToDefaults.test.cjs`.
- Hinweis: Die Cloud-Umgebung erlaubt keine praktische Windows-/Electron-Neustartprüfung; der Neustartpfad ist automatisiert über neue Adapter-/Storage-Instanzen abgesichert.

## M66 Korrektur – Rückrollbarkeit und Statusfelder
- Der Standard-Reset löscht persistente Layoutdaten nicht mehr vor der sichtbaren Default-Anwendung.
- Vor dem Reset werden persistenter Zustand und Sessionzustand gesichert; bei Fehlern werden Session, sichtbare Refs und Persistenz bestmöglich auf den vorherigen Zustand zurückgeführt.
- Erforderliche Refs werden vor destruktiven Speicheroperationen validiert; nicht editierbare technische Elemente ohne Layoutwert blockieren nicht unnötig.
- Das Bedienpanel leitet die Button-Aktivierung nicht mehr aus Anzeigetexten ab, sondern nutzt strukturierte Felder wie `savedLayoutFound`, `deviatesFromDefaults` und `standardLayoutActive`.
- Der M66-Test deckt jetzt echtes Dialog-Abbrechen, Scope-/Profil-Isolation und Rollbacks bei Ref-/Apply-/Löschfehlern ab.

### M66-Korrektur: Standardreset auf CSS-/Registry-Ursprung

Für die M64-Testfläche bedeutet „Auf Standard zurücksetzen“ nicht das Schreiben gemessener oder erfundener Pixelwerte. Der HostAdapter löscht Editor-Inlinewerte (`transform`, `width`, `height`) und setzt nur freigegebene Zustände wie `visible` gemäß Registry/Layout-Default. Fehlen Layoutentries, gilt dies als Standardzustand; CSS und natürlicher Dokumentfluss liefern dann Breite, Höhe und Anordnung. Das Bedienpanel darf daraus keine eigene Default-Wahrheit ableiten.

## M67 Abschlussnotiz – ausgewähltes Element dauerhaft auf Standard
- Status: umgesetzt im automatisierten Runtime-/Panelpfad; praktische Windows-/Electron-Prüfung in Codex Cloud nicht verfügbar.
- Umgesetzt:
  - Neuer Panelbutton „Element auf Standard …“ nahe beim ↶-Einzelverwerfen.
  - Zweistufiger Bestätigungsdialog mit „Abbrechen“ und „Element zurücksetzen“.
  - Öffentliche Bridge-/Inspector-Operation für den Einzelreset des ausgewählten Elements.
  - HostAdapter-Reset löscht nur den persistenten Defaultprofil-Eintrag des Elements, entfernt nur dessen Sessioneintrag und setzt nur dessen sichtbare Editor-Inlinewerte zurück.
  - Baseline wird nach Erfolg nur für dieses Element auf Standard aktualisiert.
  - Andere Elemente, Kind-/Elternelemente, fremde Profile und fremde Scopes bleiben unverändert.
- Tests/Prüfung:
  - Neuer Test `scripts/tests/m67ResetElementToDefaults.test.cjs` deckt Einzelreset, Kind-Isolation, Session-Isolation, Baseline-Verhalten, Abbrechen, fehlenden Ref, Persistenzfehler, Scope-/Profil-Isolation, nicht editierbares Element und Guardrails ab.
  - M64/M65/M66/M67 Einzeltests laufen in Codex Cloud grün.
- Offen:
  - Lokale Windows-/Electron-Bedienprüfung: speichern, neu starten, Elementreset abbrechen/bestätigen, erneutes Verschieben und ↶, erneuter Neustart.
