# UI-Inspektor Aufgabenheft

## Projektstatus
Status: M13.6a abgeschlossen (Panel ist aus dem Header gelöst und bleibt verschiebbar). K19.16a abgeschlossen (neutraler BBM-UI-Editor-Aktivmodus zeigt festen Registry-Scope).

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
