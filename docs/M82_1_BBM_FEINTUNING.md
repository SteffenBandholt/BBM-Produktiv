# M82.1 – BBM-Feintuning, Start-Restore und Direktauswahl

Status: `[A] abgenommen`; Pflichtprüfungen und vollständiger sichtbarer 56-Schritt-Nachweis sind abgeschlossen.

## Ausgangsbaseline und Profile

Die fachlich korrekte Ausgangsbaseline ist der in M80.2 abgenommene Restarbeiten-Renderer aus Commit `43e9d18`. Die drei maßgeblichen Renderer-/Styledateien blieben bis zum M82-Stand unverändert. Der gültige Ausgangszustand besitzt keine Inline-Profilwerte; er wird durch Registry-Baselines plus bestehendes CSS/Rendering bestimmt.

Inventar vor M82.1:

- aktives UI-Profil `standard.layout-profile.json`, SHA-256 `CB8FFBA33115E8C423A43F9D66B7FA6B2D2BDD3A597F139EC8DC0270A1E2CBE8`;
- getrenntes PDF-Profil, SHA-256 `DE01DA4329A68FD02EFA6FCA06A0B3218A2606C13F3511B82FC9B635EE94D1F8`;
- das UI-Profil enthielt breite Fixierungen, negative Verschiebungen und übergroße Spaltenwerte für alle 87 damaligen Ziele und war für die neue Registry nicht sicher nutzbar.

Das UI-Profil wurde mit dem bestehenden M81.1-`ProfileArchiveService` bytegleich archiviert:

`archive/bbm-produktiv/20260727T205202723Z_m82-1-layout-safety_standard.layout-profile.json`

Grund: `m82-1-layout-safety`; Klassifikation: `blocked`; ursprünglicher Hash und Metadaten-Sidecar sind erhalten. Das aktive UI-Profil wurde durch den Archivdienst entfernt, damit BBM mit der fachlich korrekten Baseline startet. Das PDF-Profil blieb unverändert.

## Ursache des verzögerten Restores

Der UI-Profil-Restore lag ausschließlich in `ElectronTargetEditorSession.OpenAsync`. Dadurch war das Öffnen des Editors faktisch der Aktivierungsschalter. M82.1 lädt das Profil nun im BBM-Mainprozess, validiert Manifest, Registry und Profil über den Kit-Startdienst und wendet den Plan im Renderer über denselben M80-HostAdapter an. Erst der erfolgreiche Readback erzeugt eine Startquittung. Beim späteren Editoröffnen verhindert diese Quittung eine zweite Anwendung und einen falschen Dirty-Zustand.

Bei fehlendem Profil gilt die Baseline. Bei beschädigtem oder inkompatiblem Profil bleibt BBM bedienbar, wendet nichts teilweise an und hinterlegt nur den atomaren M81.1-Recovery-Marker.

## Direktauswahl

Der vorhandene lokale Vertrag führt `beginTargetSelection`, `cancelTargetSelection`, `highlightElement` und `targetSelectionChanged` weiter. BBM trifft ausschließlich explizit mit `registerM80Ref` registrierte Elemente. Es findet keine automatische Elementinventarisierung statt.

Beim Hover erscheinen gleichzeitig die zulässigen Kandidaten aus der Registry-Parentkette:

- Element: durchgezogener 2-px-Rahmen;
- Gruppe: gestrichelter 3-px-Rahmen plus Kinderzahl;
- Bereich: doppelter 4-px-Rahmen;
- jeweils Badge mit verständlichem Registrynamen und Auswahlstufe.

`Tab`/`Shift+Tab` wechseln die Stufe, `Enter` oder Klick bestätigt und `Esc` beendet. Nach Bestätigung bleiben Rahmen und Ziel bestehen; der native Manager synchronisiert Baum und Details.

## Stabile Restarbeiten-Layoutzonen

| Zone | Parent | Layout / Dimension | erlaubte Operationen | Wirkung | Grenzen / Überlauf / Abhängigkeiten |
| --- | --- | --- | --- | --- | --- |
| Kopf-/Filterbereich | – | flex, Breite durch BBM | Höhe, Sichtbarkeit | `layoutZone` | 56–220 DIP, eigener Überlauf |
| Restarbeiten-Liste | – | flexibler Restbereich | Root gesperrt; Tabelle/Spalten separat | je Ziel | mindestens 180 px, interner Scrollbereich |
| Eingabebereich Restarbeiten | – | fester Flex-Block | Höhe, Sichtbarkeit | `parentReflowRequired` | Baseline 276, 190–520 DIP; Liste und innere Editzone ausdrücklich abhängig |
| Textfeldsammlung | Eingabebereich | Grid, flexibel | Struktur gesperrt | – | interner Scrollbereich bei kleiner Höhe |
| Gruppe Kurztext/Gegenstand | Textfeldsammlung | Gridgruppe | Position, Sichtbarkeit | `groupWithChildren` | Kinder bewegen sich mit, werden nicht skaliert |
| Kopfzone Kurztext | Gruppe Kurztext | feste Gridspuren | Struktur gesperrt | – | Beschriftung 190, Restzeichen 30, Diktat 24, Klasse/Aktionen reserviert |
| Bezeichnung Kurztext/Gegenstand | Gruppe Kurztext | eigene Labelbreite | Position, Breite, Höhe, Textgröße, Sichtbarkeit | Breite/Höhe `parentReflowRequired`, sonst `elementOnly` | 74–190 × 18–48 DIP; normaler Umbruch, Worttrennung, kein Abschneiden |
| Texteingabe Kurztext/Gegenstand | Gruppe Kurztext | flexible Eingabezone | Position, Breite, Höhe, Textgröße, Sichtbarkeit | `elementOnly` | Fachwert bleibt außerhalb des Editors |
| Restzeichen-/Statusbereich | Kopfzone Kurztext | feste 30-px-Spur | Sichtbarkeit | `elementOnly` | keine Abhängigkeit von Labelbreite |
| Diktatbutton Kurztext | Kopfzone Kurztext | 22 × 22 px | Position, Breite, Höhe, Sichtbarkeit | `elementOnly` | Fachaktion gesperrt; Icongröße unabhängig |
| Mikrofonsymbol Kurztext | Diktatbutton | 17 × 17 px | Breite, Höhe, Sichtbarkeit | `elementOnly` | 12–22 px; Position des Buttons bleibt unverändert |
| Klasse und weitere Aktionsbuttons | Kopfzone Kurztext | reservierte feste Zonen | nur jeweils freigegebenes Layout | Ziel/Gruppe | Fachaktionen bleiben gesperrt; keine fremde Skalierung |
| Langtextgruppe | Textfeldsammlung | eigene Gridgruppe | Position, Sichtbarkeit | `groupWithChildren` | getrennte Label-, Status-, Diktat- und Eingabeziele |

## Lokale Wirkungsprüfung

Registryversion 4 ergänzt `selectionKind`, `selectionLevels`, `operationEffects`, `operationAffectedIds` und maximale Verschiebung. Standard für Einzelziele ist `elementOnly`. Gruppen und Bereiche wirken nur auf ihre expliziten Kinder. `parentReflowRequired` wirkt nur auf das Ziel und die ausdrücklich benannten abhängigen IDs.

Vor und nach jeder Änderung werden alle registrierten Bounding Rectangles verglichen. Unerwartete Reflowziele, neue Überlappung, nicht endliche Werte, negative Größen, Verlassen des sichtbaren Parents, Überschreiten von Min/Max sowie fremde Button-/Icongrößenänderungen führen zu Ablehnung und vollständigem Rollback.

## Position und Größe

`m80Refs` schreibt nur Werte, deren Operation für das konkrete Ziel erlaubt ist. Der frühere generische Zwang auf Breite, Höhe, `flex-shrink` und Boxmodell ist entfernt. Verschieben setzt nur `translate`; Größenoperationen setzen nur die gewählte Dimension; Textgröße und Sichtbarkeit bleiben separat.

Der Diktatbutton und sein Icon besitzen getrennte IDs und Referenzen. Buttonverschiebung ändert die Icongröße nicht. Icongröße ändert die Buttonposition nicht. Die Kurztext-Beschriftung besitzt eine reservierte Gridspur; ihre Breitenänderung zieht Restzeichen, Mikrofon und weitere Aktionen nicht in die frei werdende Fläche.

## Reset, Speichern und PDF-Grenze

Elementreset, Discard, Gesamtreset, Save und Rollback verwenden weiterhin dieselbe `LayoutProfileSession`. Profile speichern die tatsächlich ausgeführten Operationen explizit; Restore, Discard, Reset und Profilwechsel wenden dadurch nur verfolgte Operationen an und schreiben keine responsiv abgeleitete Nachbargeometrie zurück. Nach einem Ziel-App-Refresh wird der gelesene Zustand als saubere Sessiongrenze übernommen; Subpixel-Abweichungen bis 0,05 DIP erzeugen keinen falschen Dirty-Zustand. Nach Start-Restore bleibt die Ziel-App-Baseline Resetquelle. UI- und PDF-Profile sind getrennt; PDF-Registry, PDF-Core, Druckweg und Fachwerte wurden nicht verändert.

## Prüfungen

Die neue BBM-Suite enthält 32 benannte M82.1-Prüfungen. Der bestehende HostAdapter-Integrationstest bedient zusätzlich Hover, Stufenwechsel, Esc, exakte Klickauswahl, Diktatbuttonbewegungen, getrennte Icongröße, Labelbreite, Nachbarstabilität und ungültige Geometrie. Die vollständigen acht BBM-Testgruppen, der Node-ABI-Lauf mit anschließender Electron-Wiederherstellung, Pack, gezieltes Lint und die sichtbare 56-Schritt-Abnahme sind grün. Das globale Lint bleibt getrennt beim bekannten Altbestand von 17 Fehlern und 371 Warnungen.
