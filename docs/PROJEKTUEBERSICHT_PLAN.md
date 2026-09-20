# Projektübersicht und Historienzugang

15.09.2026. Branch `feature/project-meeting-series`, Ausgangs-HEAD `0a91ca8c`.
Alle vorhandenen uncommittierten Besprechungsreihenänderungen bleiben erhalten.
Kein Commit, Merge oder Push. Ausgangshashes und Kopien betroffener Dateien:
`output/project-overview-2026-09-15/before-hashes.json` und `before/`.

## Startplanung / Arbeitsmodus

Goal-Arbeitslauf ohne Unteragenten. Native Computer Use wurde in dieser Sitzung
bereits geprüft und ist nicht verfügbar. Praktische technische Prüfung über
echte Electron-Mausereignisse, Windows-Fensterstatus und Screenshots der realen
Komponenten mit produktiven App-Styles; menschliche Sichtabnahme bleibt offen.

Gelesen: AGENTS, ZUERST_LESEN, ARCHITECTURE, MODULARISIERUNGSPLAN, PLAN,
PROJEKT_BESPRECHUNGSREIHEN_PLAN, die sechs führenden UI-Editor-Unterlagen,
Konzept_und_Vertrag_FINAL, Projektsteuerung_Anti_Kleinklein und Startblock.

Erlaubt: ProjectsScreen/ProjectsHubScreen, komponentennahe Übersichts- und
Reihenkomponenten/Verträge, ProjectFormScreen ausschließlich für Historie,
Registry-Aggregation/Manifest sowie zugehörige Prüfungen und Dokumentation.
Verboten: Editor-Core/HostAdapter/Profile, echte TOP-/PDF-Renderer, Satzlogik,
Nummerierung, Fortführung, Teilnehmer, Mail, ZIP, DB/Migrationen, M85-Reparaturen,
produktive Daten, neue Such-/Filter-/Listenansichten oder Abhängigkeiten.

Abbruch bei Vertragskonflikt, Datenverlustgefahr, notwendigem Nebenumbau oder
nicht lokal behebbaren neuen Regressionen. Modellmatrix: Sol / Sehr hoch,
Standard; keine automatische Modellumstellung.

## UI-Entwurfsentscheidung vor Codeänderungen

A: UI. B: editorfähig ja. Kein PDF-Umbau, keine Tabellen/Spalten/Metaspalten.
Explizit beauftragte komponentennahe Struktur, keine automatische Erkennung.

Neue vollständige Komponente `bbm.projektverwaltung.overview`, Scope
`projektverwaltung.overview`. Wiederholte Karten teilen deklarierte Multi-Refs;
IDs enthalten niemals Projektwerte. Nummer, Kurzbezeichnung und Adresse sind
optionale sichtbare Instanzen. Keine Platzhalter für fehlende Adressbestandteile.

| ID (Scope-Präfix `projektverwaltung.overview`) | Name | Typ / Rolle / Zusatz | Parent | Order / Ref |
|---|---|---|---|---|
| (Scope) | Projektübersicht | root / scopeRoot | NULL | 0 / single, Pflicht |
| .toolbar | Projektaktionen | toolbar / layout | Scope | 1 / single, Pflicht |
| .toolbar.create | + Projekt anlegen | button / domainActionLayout / createProject | .toolbar | 2 / single, Pflicht |
| .toolbar.transfer | Import / Export | button / domainActionLayout / transferProject | .toolbar | 3 / single, Pflicht |
| .grid | Projekte | area / layout | Scope | 4 / single, Pflicht |
| .card | Projektkachel | card / content | .grid | 5 / multi, optional |
| .card.header | Kachelkopf | group / layout | .card | 6 / multi, optional |
| .card.header.number | Projektnummer | label / meta | .card.header | 7 / multi, optional |
| .card.header.edit | Bearbeiten | button / domainActionLayout / editProject | .card.header | 8 / multi, optional |
| .card.name | Projektname | label / content | .card | 9 / multi, optional |
| .card.short | Kurzbezeichnung | label / content | .card | 10 / multi, optional |
| .card.address | Bauvorhabenadresse | label / content | .card | 11 / multi, optional |

Der vorhandene Einstieg bleibt eine eigene eingebettete Komponente mit Root
`projektverwaltung.meetingSeriesEntry` und drei optionalen Multi-Ref-Buttons
`.construction`, `.owner`, `.planning`, Parent jeweils Root, Order 1/2/3.
Typ root/scopeRoot bzw. button/domainActionLayout, actionKind openProtocolSeries.
Sichtbare Texte: Baubesprechung / Bauherr / Planung. Vollständige Reihenlabels
als title und aria-label. Ausschließlich aktivierte Reihen; keine Historienziele
in dieser Komponente. Ein leeres Aktionssegment erzeugt keinen künstlichen Platz.

`bbm.projektverwaltung.meetingSeries` behält alle elf vorhandenen Pflichtslots
mit IDs, Parents, Order und Single-Refs gemäß Besprechungsreihenplan. Ergänzungen:

| ID | Name | Typ / Rolle / Zusatz | Parent | Order / Ref |
|---|---|---|---|---|
| projektverwaltung.meetingSeries.construction.history | Baubesprechungen – bisherige Protokolle | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeries.construction | 11 / single, optional |
| projektverwaltung.meetingSeries.owner.history | Bauherrenbesprechungen – bisherige Protokolle | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeries.owner | 12 / single, optional |
| projektverwaltung.meetingSeries.planning.history | Planungsbesprechungen – bisherige Protokolle | button / domainActionLayout / openProtocolHistory | projektverwaltung.meetingSeries.planning | 13 / single, optional |

Je Element: `visible=true` als deklarierte Instanzsichtbarkeit, `editable=true`.
Nicht vorhandene optionale Ziele haben keine aktive Ref. `allowedOps`:
move, resizeWidth, resizeHeight, setVisibility; label/field/button zusätzlich
textResize. `lockedOps`: executeTargetAction, modifyDomainData, createRecord,
deleteRecord. Ref-Key gleich ID; Pflichtslots always, optionale Slots
whenVisibleInstances. Auswahlarten layoutZone (root/area), group (toolbar/card/
group), label, field oder button. Effekte layoutZone, groupWithChildren oder
elementOnly entsprechend Auswahlart. Baseline x/y=0, width/height=null aus
realer Komponente, fontSize=12; Grenzen Breite 8–2400, Höhe 8–1600,
Schrift 6–32. Der bestehende M83-Adapter schreibt pro Element:

- data-ui-inspector-id = ID
- data-ui-editor-kind = Typ
- data-ui-editor-label = Name
- data-ui-editor-parent = Parent-ID (Root leer)
- data-ui-editor-editable = true
- data-ui-editor-ops = allowedOps, kommagetrennt

C/D/E: Jeder Parent existiert selbst als Ziel. Die Root der eingebetteten
Reihenkomponente bleibt eine eigenständige Scope-Root. Fachliches Anlegen,
Bearbeiten, Umschalten, Historie-Öffnen, Speichern, Löschen, Upload/Import/Export,
Autosave, IPC und DB-Aktionen sind keine Editoroperationen. Nur Buttonlayout
ist editorfähig. Unveränderte angrenzende Legacy-Formularteile werden nicht
automatisch registriert. Das vorhandene Feld-/Bauherr-Layout bleibt erhalten.

F: `scripts/ui-editor-contract-check.cjs --self-test`, M83-Komponentenvertrag,
M80-Registry/Manifest und gemountete Refs im echten Electron-Ablauf. Die neuen
Sichtbarkeits-, Dirty- und Geometrieprüfungen sind vor Umsetzung noch nicht
vorhanden und werden im Paket ergänzt; kein vorhandener Nachweis wird behauptet.

## Fachlicher Ablauf

Buttons oberhalb des Rasters verwenden vorhandene Create-/Transferhandler.
Projektname ist Hauptbezeichnung; eine abweichende Kurzbezeichnung bleibt
zusätzlich erhalten. Adresse: street und zip/city aus vorhandenen Stammdaten.
Keine seitliche Aktionsspalte, Mindestkachelhöhe oder Streckung kurzer Kacheln.
Flex-Wrap für echte Buttons und anpassungsfähige Gridtracks.

Historienstatus wird ausschließlich mit vorhandener meetingsListByProject-API
gelesen. Zugang nur für im Formular deaktivierte Reihen mit Datensätzen.
Bei offenen Eingaben meldet der Zugang ausdrücklich, zuerst zu speichern oder
über Abbrechen zu verwerfen und erneut zu öffnen; er bleibt im unveränderten
Dialog. Keine implizite Speicherung oder Verwerfung. Im unveränderten Dialog
verwendet der Zugang den vorhandenen lizenzierten Modulrouter mit historyOnly.
Die bestehende Historienansicht und ihre Read-only-Öffnung werden wiederverwendet.

## Meilensteine und Abschlusskriterien

1. Entwurf und gezielte Vertragsanpassung dokumentieren.
2. Übersichts-/Reihenkomponenten und Historienzugang implementieren, direkte
   Guards ausführen; STATUS nach geprüfter Umsetzung aktualisieren.
3. 0/1/3 Reihen, Historie mit/ohne Protokolle, Reaktivierung, Navigation und
   offene Formulareingaben praktisch prüfen; lange Namen, Teiladressen,
   schmale/niedrige Fenster screenshotten und visuell prüfen. Betroffene
   Verträge, relevante bestehende Regressionen und Fixture-Cleanup prüfen.
   Automatik beenden; genau einen neuen sichtbaren manuellen Lauf bereitstellen.

Fertig nur mit tatsächlich geprüften technischen Kriterien. Menschliche
Sichtabnahme ausdrücklich separat; keine fremden/präexistenten Prüffenster
beenden. Vorhandene Baselinefehler getrennt berichten, nicht reparieren.

## Nachbesserung 18.09.2026 – Kompaktheit und KW-Text

- Ausschließlich Projektkacheln und die abgeleitete KW-Anzeige werden geändert.
- Nachbesserung nur Projektkacheln: maximal 240 CSS-Pixel, 200-Pixel-
  Mindesttrack, 8-Pixel-Raster- und Innenabstand sowie kompakte Kartenaktionen.
  Projektname 14 CSS-Pixel fett; Nummer und Bearbeiten bleiben in einer Zeile,
  während Inhalte und umbrochene Aktionen die Höhe bestimmen.
- Die vorhandene KW-Berechnung und der Kalender bleiben unverändert. Der frühere
  zusätzliche Kalenderbutton wird zu reinem Text ohne eigene Aktion; geöffnet
  wird weiterhin ausschließlich über das Datumsfeld.
- Abnahmeziel: vier Kachelspalten bei 1390 CSS-Pixeln / produktiver Skalierung,
  sauberer Einspaltenumbruch bei 750 CSS-Pixeln sowie vollständige Ampelanzeige.
- Vorschaufenster, Seitenränder, PDF, TOP-Lückenschließung, Profile und Fachdaten
  bleiben außerhalb dieser Nachbesserung.

## Nachbesserung 18.09.2026 – Reihenaktionen der Projektkachel

- Ausschließlich die drei vorhandenen Reihenaktionen `Baubesprechung`,
  `Bauherr` und `Planung` werden als kompakte Textaktionen dargestellt. Sie
  bleiben reale Buttons für Maus- und Tastaturbedienung, haben aber keinen
  sichtbaren Rahmen, Hintergrund oder Innenabstand; die Standardschriftgröße
  beträgt 12 CSS-Pixel.
- Die bestehende editorfähige Reihenkomponente samt IDs, Parents, Rollen,
  erlaubten Layoutoperationen und fachlichem Öffnungsweg bleibt unverändert.
  Die Hervorhebung der zuletzt erfolgreich geöffneten Reihe ist reine
  Laufzeitdarstellung und keine Editoroperation.
- Der vorhandene Profilspeicher `window.localStorage` wird mit einem einzigen,
  projektbezogenen Mapping wiederverwendet. Gespeichert wird nur ein gültiger
  Reihenkey nach erfolgreicher Navigation; ohne Eintrag bleibt jede Aktion in
  normaler Textfarbe. Es gibt keine neue Datenbankeinstellung, Migration oder
  Profilrücksetzung.
- Die sichtbare Fokusdarstellung der vorhandenen Button-Basis bleibt erhalten.
  Nach Navigation oder frischem Renderer-Start wird ausschließlich die zuletzt
  gewählte Aktion des jeweiligen Projekts in der bestehenden Primärfarbe gezeigt.
- Nicht verändert: Kachelgröße, Projektname und übriger Karteninhalt, KW,
  Kalender, PDF-/Druckwege, Seitenränder und TOP-Lückenschließung.
