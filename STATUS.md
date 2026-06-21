# STATUS.md â€” BBM-Produktiv

## Zweck
Diese Datei hÃ¤lt den tatsÃ¤chlichen Fortschritt fest.

Sie ergÃ¤nzt:
- `AGENTS.md` = Arbeitsregeln
- `PLAN.md` = Soll-Ablauf / Meilensteine

`STATUS.md` beschreibt den Ist-Stand:
- was bereits erledigt ist,
- woran zuletzt gearbeitet wurde,
- was als NÃ¤chstes dran ist,
- wo es Hindernisse gibt.

---

## Aktueller Gesamtstand

- Grundlagen 1/3 fuer den UI-Editor regulaer minimal erstellt:
  - `docs/EDITOR_BAUPLAN.md` beschreibt den aktuellen read-only Bauplan:
    `restarbeiten.ui.main` bleibt Host-/Bestandssurface, `pdf.plan.page.1`
    und `plan.canvas.default` sind nur read-only sichtbar, SurfaceInfo bleibt
    `restarbeiten.ui.main`.
  - `docs/ZIEL_APP_ANBINDUNG.md` beschreibt die BBM-Hostanbindung:
    BBM-Produktiv bleibt Host, UI-Editor-kit speichert nicht, und es gibt
    keine Aenderung an `../UI-Editor-kit`.
  - Keine Produktivlogik, keine sichtbare UI, keine echte Surface-Umschaltung,
    kein Drag, kein Resize, keine Persistenz, kein DB-/IPC-Schreibweg und kein
    Dateischreiben wurden geaendert.
  - Die Minimalgrundlagenreihe wird mit `docs/UI_ELEMENT_KATALOG.md`,
    `docs/UI_BAU_UND_PRUEFREGELN.md` und
    `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` fortgesetzt.

- Grundlagen 2/3 fuer den UI-Editor regulaer minimal erstellt:
  - `docs/UI_ELEMENT_KATALOG.md` beschreibt die aktuell zulässigen
    UI-Element- und Kontextarten sowie die Pflichtangaben fuer spaetere
    editorrelevante Elemente.
  - `docs/UI_BAU_UND_PRUEFREGELN.md` beschreibt die Bau- und Pruefregeln,
    inklusive `npm run check:ui-editor-kit`, relevanter Einzeltests, `npm test`,
    `git diff --check` und Electron-Sichtpruefung bei sichtbarer UI.
  - Keine Produktivlogik, keine sichtbare UI, kein Drag, kein Resize, keine
    Persistenz und keine DB-/IPC-Schreibwege wurden geaendert.
  - `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` schliesst die Grundlagenreihe als
    letzte Minimalgrundlage ab.

- Grundlagen 3/3 fuer den UI-Editor regulaer minimal erstellt:
  - `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` beschreibt die PDF-/Plan-/Canvas-
    Entwurfsentscheidung fuer `pdf.plan.page.1` und `plan.canvas.default`.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface; SurfaceInfo bleibt
    dort.
  - Keine PDF-Bearbeitung, keine Plan-/Canvas-Interaktion, keine Persistenz
    und keine DB-/IPC-Schreibwege wurden geaendert.

- G90 sichtbarer read-only Kontext-Hinweis zur Surface-Auswahl umgesetzt:
  - Der Hinweis `Surface-Auswahl zeigt nur read-only Kontext. Keine aktive
    Umschaltung.` ist im bestehenden UI-Editor-Panel sichtbar.
  - SurfaceInfo bleibt `restarbeiten.ui.main`.
  - Keine aktive Surface-Umschaltung, kein Drag, kein Resize und keine
    Persistenz wurden geaendert.

- G93 Abschlusscheck zu Grundlagen und Surface-Hinweis dokumentiert:
  - `docs/UI_EDITOR_GRUNDLAGEN_SURFACE_HINWEIS_ABSCHLUSSCHECK.md` bestaetigt
    die fuenf Grundlagen, den sichtbaren Hinweis und die weiterhin blockierten
    Grenzen.
  - Es wurden keine neue Produktivlogik und keine sichtbare UI geaendert.
  - Die Electron-Sichtpruefung wird nur als bereits in G90 bestanden
    referenziert.

- G94 kompakte Bedienzustands-Statuszeile im UI-Editor-Panel umgesetzt:
  - Die Statuszeile nennt Restarbeiten, read-only PDF/Plan-Kontexte und den
    nicht aktiven Speicherzustand.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; Hinweis und read-only
    Zusatzkontexte bleiben bestehen.

- G96 kleine Entwurfs-Vorschau fuer `Hinweis / Infotext` im UI-Editor-Panel
  umgesetzt:
  - Der neue Bereich zeigt `Entwurfs-Vorschau`, `Elementart: Hinweis /
    Infotext`, `Status: Vorschau, nicht gespeichert` und `Zielkontext:
    Restarbeiten`.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; der Surface-Auswahl-Hinweis,
    die Bedienzustands-Statuszeile und der Elementkatalog bleiben bestehen.

- G123 Speicherbereitschaft fuer `Hinweis / Infotext` sichtbar gemacht:
  - Der BBM-Launcher zeigt im bestehenden Speicherbereich, ob Host-Kontext,
    `projectId`, `restarbeitId`, Zielkontext, Ziel-Surface, Elementtyp und
    Hinweistext technisch/fachlich speicherbereit waeren.
  - CoreShell reicht den vorhandenen Host-Kontext-Resolver als Provider weiter;
    der Launcher normalisiert den Kontext beim Oeffnen frisch, damit eine
    nachgeladene Restarbeiten-Auswahl sichtbar wird.
  - Der Schreibweg bleibt fest `nein`, Speichern bleibt gesperrt und
    `persisted: false` bleibt sichtbar.
  - Kein `restarbeiten:createNote`, kein
    `window.bbmDb.restarbeitenCreateNote`, kein IPC-/DB-Schreibweg und keine
    Aenderung am `UI-Editor-kit`.

- G124 Create-Note-Payload-Vorschau fuer `Hinweis / Infotext` sichtbar
  gemacht:
  - Der BBM-Launcher zeigt im bestehenden Speicherbereich eine read-only
    Vorschau der spaeteren Restarbeiten-Notizpayload mit Ziel
    `restarbeiten:createNote`, `restarbeitId`, `noteText`, `projectId`,
    `previewOnly: true`, `persisted: false` und `Schreibweg freigegeben: nein`.
  - Ohne gueltigen Host-Kontext oder ohne gueltigen Hinweistext bleibt die
    Payload als unvollstaendig markiert.
  - Es gibt weiterhin keinen Speicheraufruf, keinen IPC-/DB-Schreibweg, keinen
    Submit und keine Aenderung am `UI-Editor-kit`.

- G125 Schreibfreigabe-Gate fuer `Hinweis / Infotext` vorbereitet:
  - Der BBM-Launcher zeigt im bestehenden Speicherbereich ein zentrales
    Schreibfreigabe-Gate mit `Schreibfreigabe-Gate: geschlossen`,
    `Freigabequelle: nicht gesetzt` und dem Grund, dass der echte
    Restarbeiten-Notizweg noch nicht freigegeben ist.
  - `Payload vollständig` und `technisch/fachlich speicherbereit` koennen bei
    gueltigem Host-Kontext und Hinweistext `ja` sein; das Gate bleibt trotzdem
    geschlossen, `Schreibweg freigegeben: nein`, `Button aktivierbar: nein`,
    `persisted: false` und `previewOnly: true`.
  - Es gibt weiterhin keinen Speicheraufruf, keinen IPC-/DB-Schreibweg, keinen
    Submit, kein Default-true, keine Wildcard und keine Aenderung am
    `UI-Editor-kit`.

- G126 Schreibfreigabe-Konfiguration fuer `Hinweis / Infotext` vorbereitet:
  - Das Schreibfreigabe-Gate liest jetzt eine zentrale lokale Konfiguration mit
    `Freigabequelle: Konfiguration` und `Freigabewert: false`.
  - Vollstaendige Payload, gueltiger Host-Kontext, gueltiger Hinweistext und
    DEV-Kontext oeffnen das Gate nicht; `Schreibweg freigegeben: nein`,
    `Button aktivierbar: nein`, `persisted: false` und `previewOnly: true`
    bleiben bestehen.
  - Es gibt weiterhin keinen Speicheraufruf, keine ENV-Aktivierung, keinen
    IPC-/DB-Schreibweg, keinen Submit, kein Default-true, keine Wildcard und
    keine Aenderung am `UI-Editor-kit`.

- G127 blockierten Speicher-Handler fuer `Hinweis / Infotext` vorbereitet:
  - Der BBM-Launcher hat eine lokale Handler-Funktion, die bei direktem Aufruf
    kontrolliert mit `ok: false`, `blocked: true`,
    `reason: Schreibfreigabe-Gate geschlossen`, `persisted: false` und
    `previewOnly: true` abbricht.
  - Im Speicherbereich ist sichtbar: `Speicher-Handler: vorbereitet`,
    `Handler-Status: blockiert`, `Blockiergrund: Schreibfreigabe-Gate
    geschlossen` und `Letztes Speicherergebnis: nicht ausgeführt`.
  - Es gibt weiterhin keinen Speicheraufruf, keine ENV-/DEV-Aktivierung,
    keinen IPC-/DB-Schreibweg, keinen Submit, kein Default-true, keine Wildcard
    und keine Aenderung am `UI-Editor-kit`.

- G128 Save-Adapter fuer `Hinweis / Infotext` vorbereitet:
  - Der BBM-Launcher beschreibt den spaeteren Restarbeiten-Notizweg jetzt mit
    einem lokalen Descriptor: `Adapter: vorbereitet`,
    `Zieladapter: Restarbeiten-Notizweg`,
    `Zielmethode: window.bbmDb.restarbeitenCreateNote`,
    `Zielkanal: restarbeiten:createNote` und `Ausfuehrung: blockiert`.
  - Der bestehende blockierte Speicher-Handler liest diesen Descriptor nur als
    Sicherheits-/Statusinformation; `Schreibfreigabe-Gate geschlossen`,
    `persisted: false` und `previewOnly: true` bleiben bestehen.
  - Es gibt weiterhin keinen tatsaechlichen Speicheraufruf, keine
    ENV-/DEV-Aktivierung, keinen IPC-/DB-Schreibweg, keinen Submit, kein
    Default-true, keine Wildcard und keine Aenderung am `UI-Editor-kit`.

- G129 Save-Ausfuehrung fuer `Hinweis / Infotext` vorbereitet:
  - Der BBM-Launcher hat eine zentrale lokale Funktion
    `executeReadonlyHintInfotextSave(...)`, die Payload, Hinweistext,
    Schreibfreigabe, Gate und Adapterstatus prueft.
  - Im Standardzustand liefert sie kontrolliert `ok: false`, `blocked: true`,
    `executed: false`, `persisted: false` und `previewOnly: true`.
  - Im Speicherbereich ist sichtbar: `Save-Ausfuehrung: vorbereitet`,
    `Ausfuehrung im Standardzustand: blockiert`, `Ausgefuehrt: nein` und
    `Blockiergrund: Schreibfreigabe-Gate geschlossen`.
  - Ein isolierter Fake-Adapter-Positivtest wurde bewusst nicht ergaenzt; G129
    bleibt beim blockierten Standardpfad.
  - Es gibt weiterhin keinen tatsaechlichen Speicheraufruf, keine
    ENV-/DEV-Aktivierung, keinen IPC-/DB-Schreibweg, keinen Submit, kein
    Default-true, keine Wildcard und keine Aenderung am `UI-Editor-kit`.

- G97 ergaenzt die lokale Live-Vorschau fuer `Hinweis / Infotext` im
  UI-Editor-Panel:
  - Die Entwurfs-Vorschau hat jetzt ein kleines Eingabefeld `Hinweistext` und
    eine Live-Vorschau des eingegebenen Textes.
  - Der Text bleibt nur im laufenden Panel, wird nicht gespeichert und geht
    beim Neuladen verloren.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; der Surface-Auswahl-Hinweis,
    die Bedienzustands-Statuszeile und der Elementkatalog bleiben bestehen.

- G98 ergaenzt eine nicht-persistente Host-Vorschau im Restarbeiten-Kontext:
  - Die neue Host-Vorschau zeigt `Hinweis / Infotext`, den aktuellen
    Hinweistext und `nicht gespeichert`.
  - Die Host-Vorschau aktualisiert sich gemeinsam mit der Live-Vorschau und
    bleibt rein temporaer.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; der Surface-Auswahl-Hinweis,
    die Bedienzustands-Statuszeile, der Elementkatalog und beide Vorschauen
    bleiben bestehen.

- G99 ergaenzt eine read-only Elementmodell-Vorschau im UI-Editor-Panel:
  - Die neue Vorschau zeigt `Typ: Hinweis / Infotext`, `Surface:
    restarbeiten.ui.main`, `Status: nicht gespeichert` und den aktuellen
    Hinweistext.
  - Die Elementmodell-Vorschau aktualisiert sich gemeinsam mit der Live- und
    Host-Vorschau und bleibt rein temporaer.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; der Surface-Auswahl-Hinweis,
    die Bedienzustands-Statuszeile, der Elementkatalog, die Entwurfs-Vorschau,
    die Live-Vorschau und die Host-Vorschau bleiben bestehen.

- G100 ergaenzt die lokale Entwurfspruefung im UI-Editor-Panel:
  - Die Entwurfspruefung zeigt `Status: gueltiger lokaler Entwurf` oder
    `Status: Hinweistext fehlt` plus `Speichern: nicht aktiv`.
  - Die Pruefung bleibt lokal, aktualisiert sich sofort beim Tippen und
    speichert nichts.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; der Surface-Auswahl-Hinweis,
    die Bedienzustands-Statuszeile, der Elementkatalog, die Entwurfs-
    Vorschau, die Live-Vorschau, die Host-Vorschau und die Elementmodell-
    Vorschau bleiben bestehen.

- G101 ergaenzt den lokalen Reset-Button im UI-Editor-Panel:
  - `Entwurf zuruecksetzen` stellt den Standardtext wieder her und laesst
    die lokalen Vorschauen sowie die Entwurfspruefung sofort nachziehen.
  - Der Reset bleibt lokal, speichert nichts und benutzt keinen Schreibweg.
  - SurfaceInfo bleibt `restarbeiten.ui.main`; alle bisherigen Hinweise und
    Vorschauen bleiben bestehen.

- G102 schliesst den lokalen Hinweis-/Infotext-Entwurf als Abschlusscheck ab:
  - Eingabe, Live-Vorschau, Host-Vorschau, Elementmodell-Vorschau,
    Entwurfspruefung und Reset bleiben lokal.
  - Es gibt keine Speicherung, keine Persistenz und keinen Schreibweg.
  - SurfaceInfo bleibt `restarbeiten.ui.main`.

- G103 ergaenzt eine read-only Payload-Vorschau im UI-Editor-Panel:
  - Sie zeigt `type`, `surfaceId`, `status`, `persisted` und den aktuellen
    Hinweistext.
  - Die Vorschau bleibt lokal und schreibt nichts.
  - SurfaceInfo bleibt `restarbeiten.ui.main`.
  - G104 dokumentiert die Kit-Extraktionsgrenze in
    `docs/UI_EDITOR_HINWEIS_INFOTEXT_KIT_EXTRAKTIONSGRENZE.md`; BBM bleibt
    Host und der lokale Entwurf wird noch nicht ins `UI-Editor-kit` kopiert.
  - G105 dokumentiert die fehlende Speicherfreigabe in
    `docs/UI_EDITOR_HINWEIS_INFOTEXT_SPEICHERFREIGABE_ENTSCHEIDUNG.md`; der
    lokale Entwurf bleibt ohne Speicherbutton und ohne Persistenz.
- G106 dokumentiert das spaetere Speicherziel und den noch fehlenden
  BBM-Schreibweg in
  `docs/UI_EDITOR_HINWEIS_INFOTEXT_SPEICHERZIEL_SCHREIBWEG_ENTSCHEIDUNG.md`.
- G107 analysiert die vorhandenen BBM-Schreibwege und ordnet den
  Restarbeiten-Notizweg als naechsten sinnvollen Kandidaten ein; der konkrete
  Schreibweg bleibt trotzdem noch ungebaut.
- G108 gibt den Restarbeiten-Notizweg als spaeteren Ziel-Schreibweg fuer
  `Hinweis / Infotext` frei; das ist nur eine dokumentarische Freigabe ohne
  Umsetzung.
- G109 ergaenzt einen sichtbaren, aber gesperrten Speicherbereich im
  UI-Editor-Panel; der Button bleibt deaktiviert und es wird nichts
  gespeichert.
- G110 ergaenzt im gesperrten Speicherbereich den sichtbaren
  Freigabecheck; `Hinweistext gueltig` zieht lokal mit, der Button bleibt
  deaktiviert und es wird weiterhin nichts gespeichert.
- G111 bestaetigt die Speicher-Vorbereitung als Abschluss- und
  Referenzstand; der sichtbare Speicherbereich, der Freigabecheck und der
  deaktivierte Button bleiben rein lesend.
- G112 dokumentiert den technischen Vertrag von `restarbeiten:createNote`;
  der Zielweg bleibt vorbereitet, aber weiterhin nicht angeschlossen.
- G113 analysiert die Restarbeiten-Kontextzuordnung; die eindeutige
  `restarbeitId` bleibt der entscheidende Host-Faktor vor spaeterem Speichern.
- G114 legt die spaetere Host-Uebergabe von `restarbeitId` fest; der
  UI-Editor darf die Ziel-Restarbeit nicht selbst suchen oder raten.
- G115 zeigt den fehlenden Restarbeiten-Host-Kontext sichtbar im UI-Editor-
  Panel an; die Anzeige bleibt lesend und speichert nichts.
- G116 dokumentiert den spaeteren Host-Kontext-Datenvertrag; `projectId` und
  `restarbeitId` bleiben Host-Daten und werden nicht im UI-Editor geraten.
- G117 laesst die sichtbare Restarbeit-Kontextanzeige aus einem lokalen
  Statusmodell ableiten; `projectId` und `restarbeitId` bleiben dabei leer.
- G118 normalisiert diesen lokalen Host-Kontext nur intern; es bleibt bei
  einer read-only Vorstufe ohne echte Host-Uebergabe.
- G119 bestaetigt diesen Host-Kontext als Abschlussstand; die Vorbereitung
  bleibt read-only und der Speicherweg bleibt gesperrt.
- G120 bereitet eine optionale Host-Kontext-Aufnahme im Launcher vor; der
  sichtbare Default bleibt unveraendert und der Speicherweg bleibt gesperrt.
- G121 dokumentiert die spaetere Host-Kontext-UEbergabe als
  Freigabeentscheidung; echte Quelle, Bedingungen und weiterhin blockierte
  Speicherwege sind klar begrenzt.
- G122 schliesst die echte Host-Kontext-UEbergabe aus dem
  Restarbeiten-Host an den UI-Editor an; der Speicherweg bleibt gesperrt und
  der Default ohne eindeutige Restarbeit unveraendert.

- Freigabe-/Ersatzentscheidung fuer fehlende UI-Editor-Grundlagen vorbereitet:
  - G91 dokumentiert die Entscheidungsoptionen in
    `docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md`.
  - Es wurde keine Ersatzfreigabe erteilt und keine fehlende Pflichtunterlage
    improvisiert angelegt.
  - G90 bleibt bis zur Nutzerentscheidung blockiert.
  - Keine Produktivlogik, keine sichtbare UI, keine echte Surface-Umschaltung,
    kein Drag, kein Resize und keine Persistenz wurden geaendert.

- Bedarfsanalyse fuer die fehlenden UI-Editor-Grundlagen vorbereitet:
  - G92 dokumentiert den spaeteren Inhalt der fehlenden Pflichtunterlagen in
    `docs/UI_EDITOR_GRUNDLAGEN_BEDARFSANALYSE.md`.
  - Es wurde keine Pflichtdatei angelegt und keine Freigabe erteilt.
  - G90 bleibt blockiert, bis die Grundlagen regulaer erstellt oder ein eng
    begrenzter Folgepfad ausdruecklich entschieden ist.
  - Keine Produktivlogik, keine sichtbare UI, keine echte Surface-Umschaltung,
    kein Drag, kein Resize und keine Persistenz wurden geaendert.

- G90 bleibt wegen fehlender UI-Editor-Grundlagen gestoppt:
  - G90a dokumentiert den Stopp in
    `docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md`.
  - `docs/EDITOR_BAUPLAN.md`, `docs/ZIEL_APP_ANBINDUNG.md`,
    `docs/UI_ELEMENT_KATALOG.md` und `docs/UI_BAU_UND_PRUEFREGELN.md` wurden
    mit Grundlagen 1/3 und 2/3 nachgezogen.
  - `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` schliesst die alte Luecke nun ab.
  - Der geplante sichtbare UI-Hinweis zur Surface-Auswahl wurde nicht
    umgesetzt.
  - Keine Produktivlogik, keine sichtbare UI, keine echte Surface-Umschaltung,
    kein Drag, kein Resize und keine Persistenz wurden geaendert.

- Surface-Auswahl keine aktive Surface-Umschaltung technisch abgesichert:
  - G89 dokumentiert `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Keine aktive Umschaltung, kein Drag, kein Resize, keine Persistenz und keine Schreibwege.

- Surface-Auswahl-Kontext als Referenzstand abgesichert:
  - G88 dokumentiert `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`.
  - Die Surface-Auswahl bleibt eine read-only Sichtbarkeits-/Kontextanzeige.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Eine aktive Surface bleibt ein spaeteres eigenes Paket.

- Surface-Auswahl-Kontext fachlich entschieden:
  - G87 dokumentiert `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md`.
  - Die Surface-Auswahl bleibt vorerst eine read-only Sichtbarkeits-/Kontextanzeige.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Eine echte aktive Surface bleibt ein spaeteres eigenes Paket.

- Surface-Umschaltungs-Konzept ohne Umsetzung vorbereitet:
  - G86 dokumentiert `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md`.
  - Die read-only Surface-Phase bleibt unveraendert abgeschlossen.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Die naechste echte Umschaltung bleibt nur konzeptionell vorbereitet,
    nicht umgesetzt.

- Gesamte read-only Surface-Phase als Abnahme-/Referenzstand abgeschlossen:
  - G85 dokumentiert `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md`.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - `pdf.plan.page.1` bleibt read-only sichtbar.
  - `plan.canvas.default` bleibt read-only sichtbar.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Keine echte Surface-Umschaltung, kein Drag, kein Resize und keine
    Persistenz.
  - Empfohlene naechste Phase: weitere Surface-Freigaben oder echte
    Interaktion nur als eigene, getrennte Pakete.

- Plan Canvas read-only Sichtpruefung und Referenzstand abgesichert:
  - G84 dokumentiert `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`.
  - `pdf.plan.page.1` ist weiterhin explizit read-only sichtbar.
  - `plan.canvas.default` ist weiterhin explizit read-only sichtbar.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Kein Drag, kein Resize, keine Persistenz und keine echte Umschaltung.

- plan.canvas.default explizit read-only sichtbar freigegeben:
  - G83 dokumentiert `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_POLICY_REFERENZSTAND.md`.
  - `plan.canvas.default` ist jetzt read-only sichtbar und darf in der Surface-Auswahl erscheinen.
  - `pdf.plan.page.1` bleibt read-only sichtbar.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
  - Kein Drag, kein Resize, keine Persistenz und keine echte Umschaltung.

- plan.canvas.default als naechster Kandidat bewertet:
  - G82 dokumentiert `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PLAN_CANVAS_DEFAULT.md`.
  - `plan.canvas.default` bleibt weiter blockiert und nicht auswählbar.
  - `pdf.plan.page.1` bleibt read-only sichtbar.
  - `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
  - Es gibt keine Policy-Aenderung und keine neue Freigabe.
  - G82 aendert keine Produktivlogik, keine sichtbare UI und keine
    Laufzeit-Schiene; das Paket zieht nur Doku und Guardrail nach.

- PDF Plan Seite 1 read-only Abnahmereferenz abgeschlossen:
  - G81 buendelt den bestaetigten Stand in
    `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`.
  - Freigegeben bleibt `pdf.plan.page.1` nur read-only sichtbar.
  - Host-/Bestandssurface bleibt `restarbeiten.ui.main`.
  - Weiterhin blockiert bleiben `plan.canvas.default`, unbekannte SurfaceIds,
    `*` und leere IDs.
  - Bestaetigter Klickpfad:
    `Start` -> `Projekte` -> `Nr.: 04-2026 / UI-Polish fuer BBM` ->
    `Restarbeiten` -> `UI-Editor`.
  - Ergebnis:
    `Abnahmereferenz abgeschlossen`
  - G81 aendert keine Produktivlogik, keine sichtbare UI und keine
    Laufzeit-Schiene; das Paket zieht nur Doku und Guardrail nach.

- Restarbeiten-Zielroute fuer UI-Editor-Sichtpruefung geklaert:
  - G80 dokumentiert `docs/UI_EDITOR_RESTARBEITEN_ZIELROUTE_SICHTPRUEFUNG.md`
    als reproduzierbaren Weg in den read-only Zielstand.
  - Bestaetigter Klickpfad:
    `Start` -> `Projekte` -> Projektkachel `Nr.: 04-2026 / UI-Polish fuer BBM`
    -> `Restarbeiten` -> `UI-Editor`.
  - Der sichtbare Zielstand bleibt:
    `Restarbeiten - PDF Plan Seite 1`, `restarbeiten.ui.main`, der read-only
    Hinweis und blockiertes `plan.canvas.default`.
  - Ergebnis:
    `Manuelle Sichtpruefung bestanden`
  - G80 aendert keine Produktivlogik, keine sichtbare UI und keine
    Laufzeit-Schiene; das Paket zieht nur Doku und Guardrail nach.

- Manuelle Zielrouten-Sichtpruefung fuer PDF Plan Seite 1 dokumentiert:
  - G79 legt `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md` als
    eigene Abnahme-/Sichtpruefungsreferenz an.
  - Geprueft am `2026-06-15` auf Branch
    `ui-editor-kit/pdf-plan-page-1-manuelle-sichtpruefung` per `npm start`.
  - BBM, UI-Editor-Launcher und Projekte-Ansicht waren sichtbar.
  - Sichtbare Projektkacheln umfassten unter anderem `Nr.: 125 / test`,
    `Nr.: 555 / schule` und `Nr.: 04-2026 / UI-Polish fuer BBM`.
  - Die konkrete Zielroute `Restarbeiten` war in dieser Sitzung ueber die
    sichtbaren Projektkachel-Aktionslinks nicht reproduzierbar erreichbar.
  - Ergebnis:
    `Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar`
  - G79 aendert keine Produktivlogik, keine sichtbare UI, keine Surface-
    Freigabe, kein Drag, kein Resize und keine Persistenz; das Paket zieht nur
    Doku und einen Guardrail-Test nach.

- Read-only Hinweis fuer PDF Plan Seite 1 sichtbar ergaenzt:
  - G78 ergaenzt im bestehenden UI-Editor-Panel einen kleinen Hinweis fuer
    `pdf.plan.page.1`.
  - Sichtbarer Hinweistext:
    `PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.`
  - Die Surface-Auswahl zeigt weiterhin `Restarbeiten - PDF Plan Seite 1`.
  - Die SurfaceInfo zeigt weiterhin `restarbeiten.ui.main` /
    `ui-screen` / Elementanzahl.
  - `plan.canvas.default`, unbekannte SurfaceIds, `*` und leere IDs bleiben
    blockiert.
  - Keine echte Surface-Umschaltung, kein Drag, kein Resize und keine
    Persistenz.
  - G78 aendert nur den sichtbaren Hinweis im Panel, die zugehoerigen
    Guardrail-Tests und die Referenzdoku.

- SurfaceInfo-Verhalten nach PDF Plan Seite 1 read-only Freigabe als offene
  Entscheidung dokumentiert:
  - G77 legt `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md` als
    Entscheidungsgrundlage an.
  - Die Surface-Auswahl zeigt weiterhin `Restarbeiten - PDF Plan Seite 1`.
  - Die SurfaceInfo zeigt weiterhin `restarbeiten.ui.main` /
    `ui-screen` / Elementanzahl.
  - G77 beschreibt die Varianten Beibehalten, spaeter auf Auswahl beziehen
    oder zweigeteilt anzeigen.
  - Empfehlung fuer diese Phase: SurfaceInfo nicht aendern, sondern den
    Zwischenstand bewusst dokumentieren.
  - Keine Produktivlogik, keine sichtbare UI, keine echte Umschaltung, kein
    Drag, kein Resize und keine Persistenz.

- PDF Plan Seite 1 read-only Sichtpruefung und Referenz abgesichert:
  - G76 dokumentiert den sichtbaren G75-Stand in `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md`.
  - Die sichtbare Surface-Auswahl zeigt `Restarbeiten` und `PDF Plan Seite 1`.
  - Die SurfaceInfo zeigt weiterhin den Hoststand `restarbeiten.ui.main` / `ui-screen` / Elementanzahl.
  - `plan.canvas.default`, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert.
  - Es gibt weiterhin keine echte Surface-Umschaltung, kein Drag, kein Resize und keine Persistenz.
  - Produktivcode bleibt unveraendert; G76 zieht nur Doku und Guardrail-Tests nach.

- SurfaceSwitch-Request/Command-Handler read-only vorbereitet:
  - G65 fuegt `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchCommand.js` als defensiven Request-/Command-Handler hinzu.
  - Der Handler prueft Wechselwuensche read-only gegen das SurfaceSwitch-Modell und gibt nur ein Ergebnis zurueck.
  - `restarbeiten.ui.main` bleibt das einzige erlaubte/resolved Ziel; `changed` bleibt false.
  - PDF/Plan/unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert.
  - Keine echte Umschaltung, keine sichtbare UI-Aenderung, keine Persistenz, kein Drag und kein Resize.
  - G66 schliesst den Request-/Command-Handler als Referenzstand in `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md` ab; die komplette Request-/Command-Kette, erlaubte und blockierte Ziele, Rueckgabeverhalten, Sicherheitsgrenzen und Folgepakete sind dokumentiert.
  - G67 nutzt den SurfaceSwitch-Command intern read-only im Launcher; die sichtbare Surface-Auswahl und SurfaceInfo bleiben unveraendert, `changed` bleibt false und nur `restarbeiten.ui.main` bleibt erlaubt/resolved.
  - G68 schliesst den SurfaceSwitch-Command im Launcher als Referenzstand in `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md` ab; Datenfluss, Command-/Request-Verhalten, sichtbare UI-Grenze, Sicherheitsgrenzen und Folgepakete sind dokumentiert.
  - G69 schliesst den gesamten read-only Surface-Steuerungsstand als Gesamt-Referenz in `docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md` ab; die Kette aus Bridge, Katalog, Policy, Selection, Switch und Launcher ist dokumentiert.

- SurfaceSwitch-Modell read-only im Launcher als Referenzstand abgeschlossen:
  - G75 setzt `pdf.plan.page.1` nun per read-only Policy sichtbar frei.
  - Die Surface-Auswahl kann damit `PDF Plan Seite 1` zusaetzlich zeigen; `plan.canvas.default` bleibt blockiert.
  - G64 dokumentiert den G63-Stand in `docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md`.
  - Der BBM-Launcher nutzt `buildReadonlySurfaceSwitchResultForLauncher(...)` nur intern read-only als vorgeschaltete Referenz vor der SurfaceSelection.
  - Sichtbar bleiben `Restarbeiten` und `PDF Plan Seite 1`; die SurfaceInfo bleibt `restarbeiten.ui.main` / `ui-screen` / Elementanzahl.
  - `plan.canvas.default`, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert.
  - Keine echte Umschaltung, keine sichtbare UI-Aenderung, keine Launcher-Produktivintegration, kein Drag, kein Resize und keine Persistenz.
  - G70 bestaetigt den Gesamtstand zusaetzlich als Integrations-/Freigabecheck in `docs/UI_EDITOR_SURFACE_READONLY_INTEGRATION_CHECK.md`; die read-only Kette bleibt unveraendert und nur `restarbeiten.ui.main` bleibt sichtbar/resolved.
  - G71 fuegt mit `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md` eine Freigabematrix fuer die naechste Surface-Phase hinzu; sie priorisiert kontrollierte read-only Erweiterungen und haelt Drag, Resize und Persistenz weiterhin getrennt.
  - G72 bewertet PDF/Plan-Surfaces fachlich read-only in `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`; `pdf.plan.page.1` und `plan.canvas.default` bleiben im Katalog vorhanden, aber unsichtbar und nicht auswählbar.
  - G73 bereitet mit `docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md` eine Freigabevorlage fuer spaetere einzelne Surface-Freigaben vor; sie legt Pflichtpruefungen, Minimalfreigabe und Stop-/Go-Kriterien fest, ohne Freigabe oder Produktivlogik.

- SurfaceSwitch-Modell read-only im Launcher verwendet:
  - G63 bindet `surfaceSwitchModel.js` intern defensiv im BBM-Launcher an.
  - `buildReadonlySurfaceSwitchResultForLauncher(...)` prueft Wechselwuensche read-only und liefert weiterhin nur `restarbeiten.ui.main` als `resolvedSurfaceId`.
  - Die bestehende sichtbare Surface-Auswahl bleibt `Restarbeiten`; die SurfaceInfo bleibt `restarbeiten.ui.main` / `ui-screen` / Elementanzahl.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert.
  - Keine echte Umschaltung, keine neue UI, keine Launcher-Produktivintegration, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.

- SurfaceSwitch-read-only Referenzstand abgeschlossen:
  - G62 dokumentiert den G61-Stand in `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`.
  - Referenzstand: Nur `restarbeiten.ui.main` bleibt als `resolvedSurfaceId` erlaubt.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert und fuehren defensiv auf `restarbeiten.ui.main` zurueck.
  - Keine Produktivlogik, keine Launcher-Produktivintegration, keine sichtbare UI-Aenderung, keine echte Umschaltung, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
  - G62 aendert nur Doku und einen Doku-Guardrail-Test; Electron-Sichtpruefung ist nicht noetig.

- Surface-Umschaltungsmodell read-only vorbereitet:
  - G61 legt `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js` als defensives read-only Modell fuer Surface-Wechselwuensche an.
  - Erlaubt ist nur `restarbeiten.ui.main`; `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert und werden auf `restarbeiten.ui.main` zurueckgefuehrt.
  - Dokumentiert ist der Stand in `docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md`.
  - Keine Launcher-Code-Aenderung, keine sichtbare UI-Aenderung, keine echte Umschaltung, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.

- SurfaceSelection-State im Launcher als read-only Referenzstand abgeschlossen:
  - G60 dokumentiert den G59-Stand in `docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`.
  - Referenzstand: Der BBM-Launcher nutzt den SurfaceSelection-State nur intern read-only; sichtbar bleibt `restarbeiten.ui.main` mit dem Label `Restarbeiten` und SurfaceInfo `ui-screen`/Elementanzahl.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert.
  - Keine Produktivlogik, keine sichtbare UI-Aenderung, keine echte Umschaltung, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
  - G60 aendert nur Doku und einen Doku-Guardrail-Test; Electron-Sichtpruefung ist nicht noetig.

- SurfaceSelection-State read-only im Launcher verwendet:
  - G59 bindet den vorbereiteten State aus `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionState.js` im BBM-Launcher als interne read-only Quelle an.
  - Surface-Auswahl und SurfaceInfo gehen defensiv vom State aus; sichtbar bleibt weiterhin nur `restarbeiten.ui.main` mit dem Label `Restarbeiten`.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs bleiben blockiert und erscheinen nicht im Panel.
  - Es gibt keine echte Umschaltung, keine neue UI-Struktur, keine Bearbeitungsbuttons, kein Drag, kein Resize und keine Persistenz.
  - Wegen Launcher-Code-Aenderung ist eine Electron-Sichtpruefung fuer G59 erforderlich.

- SurfaceSelection-State read-only vorbereitet:
  - G58 legt `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionState.js` als defensives read-only State-Modul an.
  - Der State erlaubt aktuell nur `restarbeiten.ui.main` als ausgewaehlte Surface und fuehrt `restarbeiten.ui.main` als einzige verfuegbare SurfaceId.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds, Wildcards und leere IDs werden als Auswahlwunsch blockiert.
  - Es gibt keine echte Umschaltung, keine neue sichtbare UI, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
  - Dokumentiert ist der Stand in `docs/UI_EDITOR_SURFACE_SELECTION_STATE_READONLY.md`.

- Surface-Auswahl read-only im Editorpanel als Referenzstand abgeschlossen:
  - G57 dokumentiert den G56-Stand in `docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md`.
  - Referenzstand: kompakte read-only Surface-Auswahl fuer `restarbeiten.ui.main` mit Label `Restarbeiten`; SurfaceInfo bleibt direkt darunter sichtbar.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar und nicht auswaehlbar.
  - Keine neue Produktivlogik, keine echte Umschaltung, keine Dropdown-/Listen-UI, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
  - Keine Electron-Sichtpruefung noetig, weil nur Doku und Guardrail-Test geaendert wurden.

- Surface-Auswahl read-only im Editorpanel sichtbar:
  - G56 bindet das bestehende read-only SurfaceSelection-Modell im BBM-Launcher an das Editorpanel an.
  - Sichtbar ist ausschliesslich `restarbeiten.ui.main` mit dem Label `Restarbeiten`.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar und nicht auswaehlbar.
  - Es gibt keine Umschaltung, keine Dropdown-/Listen-UI, keine Bearbeitungsbuttons, kein Drag, kein Resize und keine Persistenz.
  - Keine PDF-/Canvas-/Plan-Bearbeitung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB-Aenderung, keine Registry-Aenderung und keine Fachlogik.

- Surface-Auswahlmodell read-only vorbereitet:
  - G55 legt `src/renderer/uiEditor/surfaceAdapters/surfaceSelectionModel.js` als rein lesendes Modell/ViewModel an.
  - Das Modell beruecksichtigt nur SurfaceIds, die im SurfaceAdapterCatalog bekannt sind und laut SurfacePolicy `readable === true` sowie `visibleInEditor === true` melden.
  - Aktuell ist dadurch nur `restarbeiten.ui.main` im Auswahlmodell enthalten; `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben ausgeschlossen.
  - Es gibt weiterhin keine sichtbare Surface-Auswahl, keine Dropdown-/Listen-UI, keine neue Panel-Sektion und keine Launcher-Produktivnutzung.
  - Keine Bearbeitung, kein Drag, kein Resize, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB-Aenderung, keine Registry-Aenderung und keine Fachlogik.

- SurfaceInfo read-only im Editorpanel als Referenzstand abgeschlossen:
  - G54 dokumentiert den G53-Stand in `docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md`.
  - Sichtbar bleibt ausschliesslich `restarbeiten.ui.main` mit SurfaceId, SurfaceType und Elementanzahl.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben unsichtbar.
  - Die Grenze bleibt read-only: keine Surface-Liste, keine Surface-Auswahl, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
  - Produktivcode wurde nicht erweitert; es gibt weiterhin kein `localStorage`, kein `writeFile`, keinen IPC-Schreibweg, keine DB-Aenderung, keine Registry-Aenderung und keine Fachlogik.

- Erste sichtbare read-only SurfaceInfo im Editorpanel fuer Pilot-Surface vorbereitet:
  - G53 setzt `visibleInEditor: true` ausschliesslich fuer `restarbeiten.ui.main`.
  - Das bestehende Editorpanel zeigt eine kompakte read-only SurfaceInfo mit SurfaceId, Typ und Elementanzahl.
  - `pdf.plan.page.1`, `plan.canvas.default`, unbekannte SurfaceIds und Wildcards bleiben im Editor unsichtbar.
  - Es gibt keine Surface-Liste, keine Surface-Auswahl, keine Bearbeitungsbuttons und keine PDF-/Canvas-/Plan-Anzeige.
  - Drag, Resize und Persistenz bleiben fuer alle SurfaceIds gesperrt; kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- Surface-Rechte-/Policy-Schicht read-only vorbereitet:
  - G52 legt `src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js` als explizite read-only SurfacePolicy an.
  - Bekannte SurfaceIds bleiben `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`.
  - Alle bekannten SurfaceIds sind nur lesbar; `visibleInEditor`, `canDrag`, `canResize` und `canPersist` bleiben false.
  - Nur `restarbeiten.ui.main` meldet vorbereitend `canHide: true`; PDF-/Plan-Surfaces bleiben auch fuer Hide gesperrt.
  - Unbekannte SurfaceIds, Wildcards und leere IDs bleiben voll blockiert; der SurfaceAdapterCatalog prueft die Lesefreigabe defensiv ueber die Policy.
  - Keine sichtbare UI-Aenderung, keine produktive Launcher-Nutzung, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- SurfaceAdapter-Katalog read-only im Launcher vorbereitet:
  - G51 ergaenzt im BBM-Launcher den testseitigen Helper `buildReadonlySurfaceModelForLauncher(surfaceId, input)`.
  - Der Helper nutzt den zentralen `SurfaceAdapterCatalog` read-only und kann Modelle fuer `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default` abrufen/validieren.
  - Unbekannte SurfaceIds bleiben mit `UNKNOWN_SURFACE_ADAPTER` blockiert; es gibt keine Wildcard und keinen Default-Adapter.
  - Es gibt keine sichtbare Surface-Anzeige, keine neue Panel-Sektion, keine automatische Surface-Liste und keine produktive Surface-Auswahl.
  - Keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- SurfaceAdapter-Katalog als read-only Referenzstand abgeschlossen:
  - G50 dokumentiert den stabilen Katalogstand in `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md`.
  - Referenzstand: SurfaceRuntime-Bridge, Restarbeiten-UI-SurfaceAdapter, PDF-/Plan-SurfaceAdapter-Skelett und zentraler SurfaceAdapterCatalog sind read-only vorbereitet.
  - Bekannte SurfaceIds bleiben `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`; unbekannte SurfaceIds werden mit `UNKNOWN_SURFACE_ADAPTER` blockiert.
  - Datenfluss: BBM-Test/spaeter Host-Aufruf -> SurfaceAdapterCatalog -> konkreter read-only SurfaceAdapter -> neutrales SurfaceModel -> `uiEditorKitSurfaceRuntimeBridge` -> SurfaceRuntime im UI-Editor-kit -> Validierung/Normalisierung.
  - Keine Produktivlogik, keine Launcher-Nutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- SurfaceAdapter-Katalog read-only vorbereitet:
  - G49 legt `src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js` als zentralen read-only Katalog an.
  - Bekannte SurfaceIds sind `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`.
  - Der Katalog liefert bekannte AdapterIds, Adapter-Metadaten, Modellaufbau und Validierung ueber `uiEditorKitSurfaceRuntimeBridge.js`.
  - Unbekannte SurfaceIds wie `pdf.plan.page.2` oder Wildcards werden kontrolliert mit `UNKNOWN_SURFACE_ADAPTER` abgelehnt.
  - Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-/Plan-Bearbeitung, kein Drag, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- PDF-/Plan-Surface read-only vorbereitet:
  - G48 legt `src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js` als reines Adapter-Skelett an.
  - Das PDF-Modell ist `surfaceId: "pdf.plan.page.<pageNumber>"`, `surfaceType: "pdf-page"`, `coordinateSystem: "pdf-points"`, `pageNumber` und eine leere `elements`-Liste.
  - Das optionale Plan-Modell ist `surfaceId: "plan.canvas.default"`, `surfaceType: "plan"`, `coordinateSystem: "canvas-pixels"` und eine leere `elements`-Liste.
  - Beide Modelle werden ueber `uiEditorKitSurfaceRuntimeBridge.js` normalisiert und validiert.
  - Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, keine PDF-/Canvas-Renderlogik, kein Drag auf PDF/Plan, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und keine Fachlogik.

- Panel/Drag-Umstellung als Referenzstand abgeschlossen:
  - G47 dokumentiert den aktuellen Panel/Drag-Stand in `docs/UI_EDITOR_PANEL_DRAG_REFERENZSTAND.md` und in der Surface-/Panel-/Drag-Architektur.
  - Datenfluss: Mouse-/DOM-Event im BBM-Launcher -> Start-Bounds + Delta + Viewport-Bounds -> `uiEditorKitPanelRuntimeBridge` -> PanelRuntime Panel-Drag-Helper im UI-Editor-kit -> berechnete Bounds -> Style-Setzen im BBM-Launcher.
  - Referenzgrenze: DOM-/Mouse-/Pointer-Anbindung, Style-Setzen, Panel-Open/Close, Reset und Hidden-Elements bleiben im BBM-Launcher; UI-Editor-kit speichert nicht.
  - Keine Produktivcode-Aenderung, keine neue UI-Funktion, keine weitere Drag-Auslagerung, keine Persistenz, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB, keine Registry-Aenderung und kein PDF/Canvas/Plan.

- Preview-Panel-Positionsberechnung im BBM-Launcher auf PanelRuntime-Helper umgestellt:
  - G46 nutzt fuer die reine Preview-Panel-Positionsrechnung `calculatePanelDragPosition(...)` und `PANEL_DRAG_COORDINATE_SYSTEM` aus `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js`.
  - Die vorherige direkte Launcher-Nutzung von `buildDragResult(...)` aus `uiEditorKitDragRuntimeBridge.js` ist fuer Panel-Positionierung entfernt; DragRuntime bleibt kit-intern hinter dem Panel-Helper.
  - DOM-/Mouse-Event-Anbindung, Startpositionsermittlung, Style-Setzen, Panel-Open/Close, Reset und Hidden-Elements-Button/Popover bleiben im BBM-Launcher.
  - Abgesichert sind PanelRuntime-Bridge-Exports, positive und negative Delta-Bewegung, Clamp links/oben und rechts/unten, Panel-Reset, Open/Close und Hidden-Elements-Popover.
  - Keine neue UI, keine neue Panel-Funktion, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

- Panel-Drag-Sichtpruefung nach DragRuntime-Umstellung abgeschlossen:
  - G44 hat die G43-Umstellung in der lokalen Electron-DEV-App per `npm start` sichtbar geprueft.
  - Geprueft wurden UI-Editor-Button sichtbar, Panel oeffnen, Panel verschieben, Panel bleibt im sichtbaren Bereich, Panel zuruecksetzen, Panel schliessen/wieder oeffnen und Hidden-Elements-Bereich im Panel.
  - Ergebnis: sichtbares Verhalten bleibt unveraendert; keine Console-/Startfehler und kein Layoutbruch beobachtet.
  - Keine Produktivcode-Aenderung, keine neue UI-Funktion, keine weitere Drag-Auslagerung, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

- Panel-Positionsberechnung im BBM-Launcher kontrolliert ueber DragRuntime:
  - G43 nutzt `buildDragResult(...)` aus `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` fuer die reine Preview-Panel-Positionsrechnung.
  - DOM-/Mouse-Event-Anbindung, Startpositionsermittlung, Style-Setzen, Panel-Open/Close, Reset und Hidden-Elements-Button/Popover bleiben im BBM-Launcher.
  - Abgesichert sind positive und negative Delta-Bewegung, Clamp am linken/oberen sowie rechten/unteren Viewport-Rand, Panel-Reset, Open/Close und Hidden-Elements-Popover.
  - Kein Bare-Package-Import im Renderer; die DragRuntime kommt ausschliesslich ueber die Bridge.
  - Keine neue UI, keine neue Panel-Funktion, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg, keine DB und keine PDF-/Canvas-/Plan-Aktivierung.

- Panel-/Drag-Baseline im BBM-Launcher abgesichert:
  - G42 erweitert den bestehenden Launcher-Test um eine Baseline fuer das aktuelle verschiebbare Preview-Panel.
  - Abgesichert sind Launcher-Initialisierung, Panel-Open/Close, defensive Panel-Positionsnormalisierung mit Viewport-Margin, Panel-Reset, Hidden-Elements-Button/Popover und Preview-Reset beim Deaktivieren.
  - Die DragRuntime-Bridge ist im Test als verfuegbarer Vergleichspunkt ladbar, wird aber im Launcher weiterhin nicht importiert und nicht produktiv aufgerufen.
  - Die aktuelle Panel-Drag-Rechnung liegt weiterhin im BBM-Launcher; DOM-/Event-Anbindung bleibt bewusst Host-/Launcher-Aufgabe.
  - Keine sichtbare UI-Aenderung, keine neue Drag-Aktivierung, keine PDF-/Canvas-/Plan-Aktivierung, keine Persistenz, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, kein IPC-Schreibweg und keine DB-Schreiblogik.
  - Naechster sinnvoller Schritt ist eine eigene kontrollierte Berechnungsauslagerung, nicht UI-Ausbau.

- UI-Editor-kit DragRuntime in BBM per Bridge pruefbar:
  - G41 legt `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` als renderer-kompatible Bridge auf `node_modules/ui-editor-kit/src/runtime/drag/index.mjs` an.
  - Der Bridge-Test prueft Bounds-/Delta-Normalisierung und -Validierung, `applyDragDelta(...)`, `clampBoundsToConstraints(...)`, `buildDragResult(...)` und die Coordinate-Systems `css-pixels`, `pdf-points`, `canvas-pixels`.
  - Beispielrechnung: Startbounds `(10,20,100,30)` plus Delta `(15,-5)` ergeben `(25,15,100,30)`; Constraints clampen ausserhalb liegende Werte.
  - Der Launcher nutzt die DragRuntime noch nicht produktiv; es gibt keine DOM-/Pointer-/Maus-Anbindung, keine echte Verschiebung, keine UI-Aenderung, keine PDF-/Canvas-/Plan-Aktivierung, keine Persistenz, keine Registry-Aenderung und keine neuen Scopes.
  - UI-Editor-kit speichert weiterhin nicht; BBM bleibt Host fuer Registry, Scopes, Persistenz, Rechte, DB/IPC und Fachlogik.

- UI-Editor-kit SurfaceAdapter-Pilot fuer Restarbeiten read-only vorbereitet:
  - G39 legt `src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js` an.
  - Der Adapter liest den Pilot-Scope `restarbeiten.ui.main` ueber HostAdapter-/Registry-Daten, beruecksichtigt vorhandenen LayoutState fuer `visible` read-only und erzeugt ein neutrales `ui-screen`-Surface-Modell mit `css-pixels`.
  - Das Surface-Modell wird ueber die BBM-Bridge zur UI-Editor-kit Surface-Runtime normalisiert und validiert.
  - Bounds werden noch nicht gesetzt, weil keine DOM-Vermessung erfolgt; `canMove` und `canResize` bleiben false.
  - Keine Launcher-Produktivnutzung, keine sichtbare UI-Aenderung, kein Drag, kein PDF/Canvas, keine Persistenz, keine Registry-Aenderung und keine neuen Scopes.

- UI-Editor-kit Surface-Runtime in BBM per Bridge pruefbar:
  - G38 legt `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js` als renderer-kompatible Bridge auf `node_modules/ui-editor-kit/src/runtime/surface/index.mjs` an.
  - Der Bridge-Test prueft `SUPPORTED_SURFACE_TYPES`, `normalizeSurfaceModel`, `validateSurfaceModel`, `isSupportedSurfaceType`, ein `ui-screen`-Beispiel und ein `pdf-page`-Beispiel.
  - Der Launcher nutzt die Surface-Runtime noch nicht produktiv; es gibt keine UI-Aenderung, keine PDF-/Canvas-/Drag-Aktivierung, keine neue Persistenz, keine Registry-Aenderung und keinen Bare-Package-Import im Renderer.
  - UI-Editor-kit speichert weiterhin nicht; BBM bleibt Host fuer Registry, Scopes, Persistenz, Rechte, DB/IPC und Fachlogik.

- UI-Editor-kit Surface-/Panel-/Drag-/PDF-Zielarchitektur inventarisiert:
  - G36 dokumentiert in `docs/UI_EDITOR_KIT_SURFACE_PANEL_DRAG_ARCHITEKTUR.md` das Zielbild fuer Surface, SurfaceAdapter, PanelRuntime, DragRuntime, HostAdapter, Registry, ChangeRequest und LayoutState.
  - Das Dokument trennt klar: UI-Editor-kit liefert neutrale Runtime-/ViewModel-/Surface-Hilfen; BBM bleibt fuer konkrete Scopes, Registry, Persistenz, Rechte, DB/IPC, HostAdapter, Module und Fachlogik verantwortlich.
  - UI-, PDF-, Plan- und Canvas-Ansichten duerfen spaeter nur ueber neutrale Adaptermodelle angeschlossen werden.
  - Keine Produktivlogik, keine UI-Aenderung, keine neue Persistenz, keine neue Scope-Freigabe, keine PDF-Aktivierung, keine Drag-Aenderung und kein Bare-Package-Import im Renderer.

- UI-Editor Hidden-Elements-Block als Referenzstand abgeschlossen:
  - G35 dokumentiert den gesamten Hidden-Elements-Block in `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md`.
  - Der Referenzstand beschreibt Button/Popover, Datenfluss, ChangeRequest-Modell, Pilot-Persistenz, Restore ueber `getCurrentLayoutState(scopeId)`, Scope-Policy und Sicherheitsgrenzen.
  - Aktiv bleibt ausschliesslich `restarbeiten.ui.main`; weitere Scopes bleiben blockiert und brauchen eigene Folgepakete.
  - Keine neue Produktivlogik, keine neue Scope-Freigabe, keine UI-/Launcher-Funktionsaenderung, keine Registry-Aenderung, kein `localStorage`, kein `writeFile`, keine PDF-/Drucklogik und keine Fachlogik.

- UI-Editor Hidden-Elements Scope-Freigabe-Modell vorbereitet:
  - G34 fuehrt eine explizite Allowlist/Policy fuer Visibility-Persistenz ein.
  - Aktiv erlaubt bleibt ausschliesslich `restarbeiten.ui.main`; bekannte andere Scopes, unbekannte Scopes und Wildcards bleiben blockiert.
  - `canPersistVisibility: true` kann keine globale Freigabe mehr erzwingen; der Contract prueft zusaetzlich die Scope-Policy.
  - Das BBM-Repo fuer `ui_editor_layout_overrides` hat denselben Allowlist-Backstop und speichert weiterhin nur den Pilot-Scope.
  - Keine Registry-Aenderung, kein UI-Editor-kit-Speicher, keine PDF-/Drucklogik, keine Fachlogik, kein `localStorage` und kein Datei-Schreibweg.

- UI-Editor Hidden-Elements Pilot-Ruecksetzpfad im Popover abgesichert:
  - G33 erlaubt im bestehenden kompakten Hidden-Elements-Popover das Einblenden gespeicherter Pilot-Overrides fuer `restarbeiten.ui.main`.
  - Einzelnes `Einblenden` erzeugt nur fuer diesen Pilot-Scope einen validierten `persistent: true` Visibility-ChangeRequest mit `payload.visible === true`.
  - Bei mehreren aktiv einblendbaren Pilot-Overrides erscheint kompakt `Alle einblenden`; die Aktion speichert nur `overrides.visible: true` fuer validierte Registry-Elemente.
  - Der In-Memory-/Dry-Run-Pfad ohne freigegebene Capability bleibt gesperrt; dort bleiben Layout-State-only Elemente im Popover nicht einblendbar.
  - Andere Scopes, Move/Resize/Text/Fachfelder, Registry, UI-Editor-kit, PDF-/Drucklogik, Fachlogik, Drag und Target-Selection bleiben unveraendert; kein `localStorage` und kein Datei-Schreibweg.

- UI-Editor Hidden-Elements Restore fuer Pilot-Scope abgesichert:
  - G32 weist technisch nach, dass gespeicherte Visibility-Overrides fuer `restarbeiten.ui.main` nach einem neuen Adapter-/Lesezyklus wieder als Layout-State verfuegbar sind.
  - Der Restore-Pfad laeuft ueber den Restarbeiten-HostAdapter: `loadCurrentLayoutState()` liest den BBM-Speicher, `getCurrentLayoutState(scopeId)` liefert die Datensaetze an den Launcher.
  - `visible: false` wird von der Hidden-Elements-Logik als ausgeblendet gezaehlt; nach `visible: true` wird das Element nicht mehr als hidden gezaehlt.
  - Andere Scopes, unbekannte `elementId`, Nicht-Visibility-Operationen und ungueltige `payload.visible`-Werte bleiben blockiert.
  - Registry, UI-Editor-kit, PDF-/Drucklogik, Fachlogik, Drag und Target-Selection bleiben unveraendert; kein `localStorage` und kein Datei-Schreibweg.
  - G32 hat keine Produktivcode-Aenderung benoetigt; abgesichert wurde der vorhandene Pilot-Leseweg durch HostAdapter- und Launcher-Tests.

- UI-Editor Hidden-Elements Pilot-Persistenz fuer `restarbeiten.ui.main` aktiviert:
  - Ein eigener BBM-seitiger Speicherweg `ui_editor_layout_overrides` ist angelegt, mit Repository, IPC-Handlern und Preload-Methoden.
  - Aktiviert ist nur der Pilot-Scope `restarbeiten.ui.main`; andere Scopes bleiben blockiert.
  - Persistiert werden ausschliesslich validierte Visibility-Overrides mit `overrides.visible === false/true`.
  - Der Restarbeiten-HostAdapter meldet fuer diesen Scope `persistence: true`, `canPersistVisibility: true`, `dryRunOnly: false`.
  - `submitChangeRequests(...)` speichert nur `persistent: true` / `operation: "visibility"` fuer bekannte Registry-Elemente; ungueltige Payloads, unbekannte `elementId` und andere Scopes bleiben `INVALID_CHANGE_REQUEST`.
  - `getCurrentLayoutState(...)` liefert gespeicherte Override-Datensaetze als Layout-State; der Hidden-Elements-Leser beruecksichtigt jetzt auch `overrides.visible`.
  - Registry, UI-Editor-kit, PDF-/Drucklogik, Fachlogik, Drag und Target-Selection bleiben unveraendert; kein `localStorage` und kein Datei-Schreibweg.
  - Der Restore-Leseweg fuer persistierte Overrides ist durch G32 testseitig abgesichert.

- UI-Editor Hidden-Elements HostAdapter-Dry-Run fuer `persistent: true` validiert:
  - `submitChangeRequests(...)` validiert persistente Visibility-ChangeRequests jetzt ueber das G29-Override-Modell.
  - Gueltige Requests werden in einen Override-Payload uebersetzt und als Dry-Run mit `PERSISTENCE_DISABLED` blockiert.
  - Ungueltige `payload.visible`-Werte und unbekannte `elementId` werden als `INVALID_CHANGE_REQUEST` blockiert.
  - `canPersistVisibility` bleibt `false`, `dryRunOnly` bleibt `true`; es gibt weiterhin keine DB, kein IPC, kein `localStorage`, kein `writeFile`, keine Speicherdatei und kein App-Start-Wiederherstellen.

- UI-Editor Hidden-Elements Persistenzspeicher technisch vorbereitet, aber deaktiviert:
  - `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js` definiert ein neutrales, rein datenbasiertes UI-Editor-Layout-Override-Modell.
  - Enthalten sind Normalisierung, Validierung, Mapping eines `visibility`-ChangeRequests auf `overrides.visible` und eine Persistierbarkeitspruefung.
  - Die aktuelle Persistierbarkeitspruefung liefert bei `canPersistVisibility: false`, `persistence: false` oder `dryRunOnly: true` weiterhin `false`.
  - Es gibt keinen Speicherweg: keine DB-Migration, kein IPC, kein `localStorage`, kein `writeFile`, keine neue Speicherdatei, kein App-Start-Wiederherstellen und keine UI-Aenderung.
  - Abgesichert durch `scripts/tests/editorLayoutOverrideModel.test.cjs`.

- UI-Editor Hidden-Elements Speicherort und Persistenzfreigabe festgelegt:
  - `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_FREIGABE.md` dokumentiert die G28-Entscheidung.
  - Empfehlung: eigener BBM-seitiger UI-Editor-Layout-Override-Speicher hinter dem HostAdapter.
  - Zielstruktur: ein Datensatz pro `targetAppId`/`moduleId`/`scopeId`/`elementId` mit `overrides.visible`, `source`, `createdAt` und `updatedAt`.
  - TableLayouts bleiben nur technisches Vorbild; Registry, localStorage und DOM-Zustaende sind als Speicherort ausgeschlossen.
  - Erste Freigabegrenze bleibt ein spaeterer Pilot-Scope `restarbeiten.ui.main`; keine globale Modulfreigabe.
  - Persistenz bleibt deaktiviert: `canPersistVisibility: false`, `persistent: true` weiter blockiert, keine DB, kein IPC, kein writeFile, keine UI-Aenderung und kein App-Start-Wiederherstellen.

- UI-Editor Hidden-Elements Persistenz vorbereitet, aber deaktiviert:
  - Das spaetere Persistenzmodell ist in `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_VORBEREITUNG.md` dokumentiert.
  - Neutraler spaeterer Override: `scopeId`, `elementId`, `overrides.visible`.
  - Spaeterer ChangeRequest bleibt `operation: "visibility"` mit `payload.visible === false/true`.
  - `persistent: false` bleibt Standard; `persistent: true` wird weiterhin mit `PERSISTENCE_DISABLED` blockiert.
  - `getCapabilities()` meldet vorbereitend `canPersistVisibility: false`; `submitChangeRequests(...)` meldet fuer Visibility-Requests `visibilityPersistenceDisabled: true`.
  - Keine produktive Speicherung, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine automatische Wiederherstellung, keine UI-/Launcher-Aenderung und keine PDF-/Drucklogik.

- UI-Editor Hidden-Elements HostAdapter-Dry-Run abgesichert:
  - Visibility-ChangeRequests fuer Hide/Show werden ueber `onPendingChangeRequestsChanged(...)` an den HostAdapter gemeldet.
  - Hide wird als `operation: "visibility"` mit `payload.visible === false` gemeldet, Show als dieselbe Operation mit `payload.visible === true`.
  - `submitChangeRequests(...)` bleibt ein reiner Dry-Run-/Blockadepfad und liefert weiter `PERSISTENCE_DISABLED`, `persistenceDisabled: true` und `dryRunOnly: true`.
  - Die uebergebenen ChangeRequests bleiben `source: "preview"` und `persistent: false`.
  - Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik, keine Layout-State-Schreiblogik und keine sichtbare UI-Aenderung.

- UI-Editor Hide/Show als Visibility-ChangeRequest abgesichert:
  - Hide und Show werden als einheitlicher ChangeRequest `operation: "visibility"` modelliert.
  - Hide nutzt `payload: { visible: false }`, Show nutzt `payload: { visible: true }`.
  - Pro Preview-Ziel wird der bestehende Visibility-Request ueberschrieben statt ein widerspruechlicher zweiter Request erzeugt.
  - Der bestehende Kit-Vertrag bleibt erhalten: `source: "preview"` und `persistent: false`.
  - Layout-State-only Hidden-Elemente bleiben lesbar, aber `Einblenden` erzeugt dafuer noch keinen Request, weil ohne sicheres DOM-/Schreibziel keine HostAdapter-Ausfuehrung erfolgen soll.
  - Keine Persistenz, keine DB, kein IPC, kein localStorage, keine Datei-Schreiblogik und keine HostAdapter-Schreibausfuehrung.

- UI-Editor Hidden-Elements lesen echten Layout-State mit:
  - `BbmUiEditorRuntimeLauncher.js` fuehrt Registry, lesenden `getCurrentLayoutState(...)`, Pending-Visibility-ChangeRequests und in-memory Preview-State zu einer neutralen Elementliste fuer das Kit-Hidden-Elements-ViewModel zusammen.
  - Reihenfolge: Registry liefert bekannte Elemente und Labels, Layout-State liefert `visible`-Overrides, Pending-/Preview-State ueberschreibt temporaer.
  - Layout-State-only ausgeblendete Elemente erscheinen im Popover; seit G33 ist `Einblenden` nur fuer den freigegebenen Pilot-Scope `restarbeiten.ui.main` aktiv, alle anderen Layout-State-only Faelle bleiben deaktiviert.
  - Temporaer per Preview ausgeblendete Elemente koennen weiterhin ueber das Popover wieder eingeblendet werden.
  - Keine Persistenz, keine DB, kein IPC, kein localStorage, keine HostAdapter-Schreibmethode, keine Drag-/Target-Selection-Aenderung und kein Bare-Package-Import im Renderer.

- UI-Editor Hidden-Elements Persistenz-Trennschnitt festgelegt:
  - `docs/UI_EDITOR_HIDDEN_ELEMENTS_PERSISTENZ_TRENNSCHNITT.md` dokumentiert Datenquelle, Speichergrenze und Folgepakete.
  - Empfohlene Datenquelle fuer echte Hidden-Elements ist Registry plus `getCurrentLayoutState()`; dieser lesende Pfad ist inzwischen im Launcher vorbereitet.
  - Empfohlener Persistenzpfad ist ein BBM-seitiger Layout-Override hinter dem HostAdapter, nicht das UI-Editor-kit.
  - Pending ChangeRequests bleiben vorbereitete, nicht persistierte Aenderungen.
  - Keine Persistenz, keine DB, kein IPC, kein localStorage, keine neue UI und keine Launcher-Funktionsaenderung.

- UI-Editor Hidden-Elements-Popover im Preview-Panel vorbereitet:
  - Der kompakte Hidden-Elements-Button toggelt bei `Ausgeblendete: 1+` ein kleines Popover direkt im bestehenden Preview-Panel.
  - Das Popover nutzt `buildHiddenElementsPopoverViewModel` ausschliesslich ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
  - Pro Eintrag wird eine neutrale Aktion `Einblenden` angezeigt; sie wirkt nur auf temporaere Preview-Hide-Aenderungen im vorhandenen in-memory Preview-State.
  - Wenn danach keine ausgeblendeten Preview-Elemente mehr vorhanden sind, schliesst das Popover und der Button faellt auf `Ausgeblendete: 0` zurueck.
  - Keine grosse Dauerliste, keine Persistenz, keine DB, kein IPC, kein localStorage, keine Fachlogik und kein Bare-Package-Import im Renderer.

- UI-Editor Hidden-Elements-Button im Preview-Panel vorbereitet:
  - `BbmUiEditorRuntimeLauncher.js` nutzt `buildHiddenElementsButtonViewModel` ausschliesslich ueber `./uiEditorKitHiddenElementsRuntimeBridge.js`.
  - Das Preview-Panel zeigt einen kompakten Button/Platzhalter `Ausgeblendete: 0`; bei temporaer per Preview ausgeblendeten Elementen steigt der Zaehler, z. B. `Ausgeblendete: 1`.
  - Durch G24 erweitert: Die Datenquelle beruecksichtigt jetzt auch Registry plus lesenden Layout-State; wenn kein Layout-State vorhanden ist, bleibt das bisherige Preview-State-Verhalten stabil.
  - Durch G22 erweitert: Der Button kann nun ein kompaktes Popover fuer temporaere Preview-Hides oeffnen.
  - Kein Bare-Package-Import `ui-editor-kit/runtime/hidden-elements` im Renderer, keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

- UI-Editor-kit Hidden-Elements-Runtime Importvertrag und Renderer-Bridge vorbereitet:
  - BBM prueft den offiziellen Kit-Subpath `ui-editor-kit/runtime/hidden-elements` mit `scripts/tests/uiEditorKitHiddenElementsRuntimeImport.test.cjs`.
  - CommonJS und ESM sind testweise verfuegbar.
  - `src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js` re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs`.
  - `scripts/tests/uiEditorKitHiddenElementsRuntimeBridge.test.cjs` prueft Bridge-Pfad, verbotenen Bare-Import, unveraenderte Preview-/Panel-Bridge und die Launcher-Nutzung ausschliesslich ueber die Bridge.

- UI-Editor Hidden-Elements-Button konzipiert:
  - `docs/UI_EDITOR_HIDDEN_ELEMENTS_BUTTON_KONZEPT.md` dokumentiert das spaetere Bedienkonzept fuer ausgeblendete Elemente.
  - Grundregel: Hide entfernt kein Element aus Registry oder Layout-State, sondern bedeutet nur `visible = false`.
  - Das Panel soll schlank bleiben; statt dauerhafter Liste ist spaeter ein kompakter Button wie `Ausgeblendete: 3` vorgesehen.
  - Das Popover/Dropdown mit `Einblenden` fuer temporaere Preview-Hides ist durch G22 vorbereitet.
  - Folgeschritte sind abgegrenzt: G19 Hidden-Elements-ViewModel im Kit, G20 BBM Importvertrag/Bridge, G21 kompakter Button, G22 Popover, G23 Persistenz-Trennschnitt, G24 Layout-State-Lesen, G25 ChangeRequest-Modell, G26 HostAdapter-Dry-Run, G27 Persistenz-Vorbereitung und G28 Speicherort-/Freigabeentscheidung sind erledigt; G29 bis G34 bleiben separat.
  - Weiterhin keine Speicherung, keine DB, kein IPC, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

- UI-Editor-kit Panel-ViewModel im BBM-Launcher vorbereitend genutzt:
  - `BbmUiEditorRuntimeLauncher.js` importiert `buildPanelViewModel` ausschliesslich ueber `./uiEditorKitPanelRuntimeBridge.js`.
  - `buildBbmPanelViewModel(...)` fuehrt bestehende Launcher-Daten in ein neutrales Kit-Panel-ViewModel.
  - Das Preview-Panel liest daraus Titel, Ziel-ID, Preview-Ziel-ID, `allowedOps`, `lockedOps`, StatusText, Summary und Button-Freigaben.
  - Button-Handler, Schrittweiten, Preview-Operationen, Reset/Verwerfen, Drag, Panel-Position, Target Selection und DOM-Markierung bleiben im BBM-Launcher unveraendert.
  - Kein Bare-Package-Import `ui-editor-kit/runtime/panel` im Renderer und keine direkte produktive Node-Modules-Nutzung ausser ueber die Bridge.
  - Keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

- UI-Editor-kit Panel-Runtime Renderer-Bridge vorbereitet:
  - BBM hat `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js` als renderer-kompatible Bridge angelegt.
  - Die Bridge re-exportiert relativ aus `../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs`.
  - Der Electron-Renderer darf weiterhin keine Bare-Package-Imports wie `ui-editor-kit/runtime/panel` verwenden.
  - `scripts/tests/uiEditorKitPanelRuntimeBridge.test.cjs` prueft Bridge-Pfad, verbotenen Bare-Import, Fach-/Storage-/DB-/IPC-/PDF-Begriffe, unveraenderte Preview-Bridge und dass der Launcher die Panel-Runtime nur ueber die Bridge nutzt.
  - Keine direkte Bare-Package-Nutzung im Renderer, keine DOM-Aenderung, kein Drag, keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik und keine PDF-/Drucklogik.

- UI-Editor-kit Panel-Runtime Importvertrag in BBM pruefbar:
  - Das UI-Editor-kit stellt die neutrale Panel-Runtime ueber `ui-editor-kit/runtime/panel` bereit.
  - BBM prueft den offiziellen Panel-Runtime-Importvertrag mit `scripts/tests/uiEditorKitPanelRuntimeImport.test.cjs`.
  - Geprueft werden CommonJS und ESM, erwartete Exporte, Default-State, Positionsnormalisierung, Offen/Geschlossen-State und ein neutrales Panel-ViewModel mit Buttons.
  - `scripts/test.cjs` bindet den Importvertragstest in `npm test` ein.
  - `BbmUiEditorRuntimeLauncher.js` nutzt das Panel-Modell noch nicht produktiv; Panel-, Drag-, DOM- und Rendering-Integration bleiben auch nach der Bridge-Vorbereitung ein separates spaeteres Paket.
  - Keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Funktionsaenderung.

- UI-Editor Panel/Drag/Rendering inventarisiert:
  - `docs/UI_EDITOR_PANEL_DRAG_RENDERING_INVENTAR.md` dokumentiert die im BBM-Launcher verbliebene UI-nahe Logik fuer Preview-Panel, Panel-Rendering, Panel-Position, Drag, Statusanzeige, Preview-Buttons, Reset/Verwerfen und Zielbeschreibung.
  - Kitfaehige Kandidaten sind abgegrenzt: Panel-State, Panel-Position, Drag-Controller, Preview-Control-Rendering, ChangeRequest-Summary-Anzeige, Reset-/Verwerfen-UI-Logik und neutrale Zielbeschreibung/Status-ViewModels.
  - In BBM verbleiben CoreShell-/DEV-Kontext, konkrete Electron-DOM-Einbindung, HostAdapter-Erzeugung, Scope-/Registry-Auswahl, Kit-Bridge und BBM-spezifische Start-/Lifecycle-Orchestrierung.
  - Keine Runtime-/Launcher-Codeaenderung, keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Funktionsaenderung.
  - Der naechste technische Schritt nach Import- und Bridge-Nachweis ist ein eigenes Paket fuer die produktive Panel-Modell-Integration, weiterhin ohne automatische Panel-/Drag-Umbauten.

- UI-Editor-kit lokaler Standard-Bezugsweg dokumentiert:
  - Standard-Root fuer Entwicklungs-Repos ist `C:\01_Projekte`.
  - UI-Editor-kit bleibt eigenes Repo unter `C:\01_Projekte\UI-Editor-kit`; BBM und weitere Repos sind Konsumenten.
  - Standardinstallation in Konsumenten-Repos: `npm install ..\UI-Editor-kit --save`.
  - Erwarteter Eintrag: `"ui-editor-kit": "file:../UI-Editor-kit"`.
  - `docs/UI_EDITOR_KIT_LOKALER_BEZUGSWEG.md` dokumentiert den uebertragbaren lokalen Bezugsweg.
  - `npm run check:ui-editor-kit` prueft Nachbar-Repo, installierte Dependency und Preview-Runtime-Einstiege `.mjs`/`.cjs`.
  - Keine Runtime-/Launcher-Funktionsaenderung, keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.

- UI-Editor Preview-Runtime-Rueckfuehrung abgeschlossen:
  - BBM ist jetzt Konsument der Preview-Runtime; fachliche Quelle ist ausschliesslich das externe UI-Editor-kit.
  - Produktivpfad: UI-Editor-kit -> browserfaehiges `src/runtime/preview/index.mjs` -> `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js` -> `BbmUiEditorRuntimeLauncher.js`.
  - Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` ist entfernt.
  - Der Electron-Renderer nutzt bewusst die lokale Bridge, weil Bare-Package-Specifier ohne Bundler/Import-Map nicht aufgeloest werden.
  - Der Kit-ESM-Einstieg fuer den Renderer darf nicht auf `.cjs`, `require` oder `createRequire` zurueckfallen.
  - Keine Runtime-/Launcher-Funktionsaenderung, keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-/Markierungs-Aenderung.
  - Der lokale Entwicklungs-Bezugsweg ist inzwischen dokumentiert und pruefbar; ein spaeterer versionierter Produktiv-/Release-Bezug bleibt ein getrenntes Folgethema.

- UI-Editor-kit Preview-Runtime-Abgleich dokumentiert:
  - `docs/UI_EDITOR_KIT_PREVIEW_RUNTIME_ABGLEICH.md` dokumentiert den Abgleich der frueheren BBM-Preview-Runtime mit der externen UI-Editor-kit-Runtime.
  - Exportnamen, Datenstrukturen, Operation-Mapping, `allowedOps`/`lockedOps`, `previewTargetMode`, Target-Aufloesung, `pendingChangeRequests`, `unknown-host`, `source: "preview"`, `persistent: false`, Deduplizierung, Summary und Reset je Ziel sind kompatibel.
  - Dokumentierte Abweichungen: BBM nutzt ESM, das Kit CommonJS; das Kit exportiert zusaetzlich `UI_EDITOR_ID_ATTRIBUTE` und akzeptiert boolean `true` als `parent`.
  - Der offizielle Kit-Importvertrag `ui-editor-kit/runtime/preview` ist in BBM testbar; `package.json` nutzt dafuer lokal `file:../UI-Editor-kit`.
  - `scripts/tests/uiEditorKitPreviewRuntimeImport.test.cjs` prueft CommonJS, ESM, erwartete Exporte, Operation-Mapping und `unknown-host`.
  - `BbmUiEditorRuntimeLauncher.js` nutzt die Preview-Runtime jetzt produktiv aus dem UI-Editor-kit; im Electron-Renderer erfolgt das ueber `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`, weil der Renderer ohne Bundler keine Bare-Package-Specifier wie `ui-editor-kit/runtime/preview` aufloest.
  - Der produktive Pfad ist jetzt mit `scripts/tests/uiEditorKitPreviewRuntimeBridgeParity.test.cjs` abgesichert: Kit -> browserfaehiges `index.mjs` ohne `.cjs`-Rueckfall -> BBM-Bridge -> Launcher.
  - Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` ist entfernt; einzige Runtime-Quelle ist das UI-Editor-kit.
  - Keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-/Drucklogik und keine Panel-/Drag-Aenderung.
  - Rueckfuehrung abgeschlossen; der produktive Bezugsweg fuer das externe Kit bleibt ein separates Folgethema.

- UI-Editor Preview-Runtime Quelle konsolidiert:
  - Die lokale BBM-Preview-Runtime wurde entfernt.
  - `BbmUiEditorRuntimeLauncher.js` importiert die produktive Preview-Runtime ueber die renderer-kompatible Bridge `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`.
  - Direkter Package-Bare-Import ist im Electron-Renderer nicht zulaessig; die Bridge zeigt auf `../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs`.
  - `scripts/tests/editorPreviewRuntime.test.cjs` prueft die Runtime-Vertraege jetzt ueber die Bridge.
  - Keine Speicherung, keine DB, kein IPC-Schreibweg, kein localStorage, keine Fachlogik, keine PDF-Logik, keine Registry-Fachaenderung und keine Markierungslogik-Aenderung.

- UI-Editor Preview-Runtime targetAppId-Fallback hostneutral gemacht:
  - Der harte Fallback `"bbm"` wurde aus der generischen Preview-Runtime entfernt und die lokale BBM-Kopie ist inzwischen geloescht.
  - `targetAppId` wird aus HostContext, Registry oder State bestimmt; als letzter technischer Fallback dient `unknown-host`.
  - `BbmUiEditorRuntimeLauncher.js` reicht den HostAdapter-Kontext an die generische Preview-ChangeRequest-Logik weiter.
  - BBM kann weiter `targetAppId: "bbm"` liefern, aber nur ueber HostContext/HostAdapter.
  - Keine neue Preview-Funktion, keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Fachaenderung.

- UI-Editor-kit-Rueckfuehrung der Preview-Runtime umgesetzt:
  - `docs/UI_EDITOR_KIT_RUECKFUEHRUNG_VORBEREITUNG.md` dokumentiert Historie, Kit-Quelle, BBM-Bridge, Nicht-Kit-Anteile, Tests, abgegrenzte Folgethemen und Risiken.
  - Die generische Preview-Runtime liegt jetzt im externen UI-Editor-kit und wird in BBM ueber die Bridge genutzt.
  - Die lokale BBM-Kopie ist entfernt.
  - Keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Aenderung.

- UI-Editor generische Preview-Runtime-Hilfen ausgelagert und ins Kit ueberfuehrt:
  - Die frueheren fachneutralen Runtime-Einheiten unter `src/renderer/editorRuntime/preview/` sind entfernt.
  - Operation-Mapping, `allowedOps`/`lockedOps`-Auswertung, Preview-Zielmodell (`self`/`parent`) und temporaere Pending-ChangeRequest-Hilfen kommen aus dem UI-Editor-kit.
  - `BbmUiEditorRuntimeLauncher.js` bleibt der BBM-sichtbare Launcher/Panel-Orchestrator fuer DOM-Panel, Drag-Panel, HostAdapter, Zielauswahl und Status-Rendering.
  - Keine neue Preview-Funktion, keine Speicherung, kein localStorage, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Registry-Aenderung.
  - Geprueft mit gezieltem Preview-Runtime-Test, bestehendem BBM-Launcher-Test, `npm test`, `git diff --check` und Guardrail-Suche gegen verbotene Speicher-/Fachbegriffe.
  - Naechster offener Schritt: fachliche Sichtpruefung im lokalen Electron-DEV-Kontext.

- UI-Editor HostAdapter-Schnittstelle stabilisiert:
  - Der vorhandene Contract unter `src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js` wurde erweitert, keine zweite Contract-Struktur angelegt.
  - Der HostAdapter beschreibt jetzt `getHostContext`, `getRegistry`, `getCurrentLayoutState`, `getCapabilities`, `onPendingChangeRequestsChanged` und `submitChangeRequests`.
  - `submitChangeRequests` bleibt bewusst blockiert mit `PERSISTENCE_DISABLED`; `pendingChangeRequests` werden nur in-memory gemeldet.
  - Der BBM Runtime-Launcher kann optional einen HostAdapter verwenden und bleibt mit `activeUiScope`, `registeredElements`, `availableUiScopes` und `registryResolver` kompatibel.
  - Keine Speicherung, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.
  - Die spaetere UI-Editor-kit-Rueckfuehrung dieser Preview-Runtime ist inzwischen abgeschlossen; weitere HostAdapter-Arbeiten bleiben getrennte Pakete.

- UI-Editor-Trennschnitt BBM vs. UI-Editor-kit dokumentiert:
  - BBM ist als Referenzintegration und Host-App beschrieben, nicht als dauerhafter Produktort generischer UI-Editor-Runtime.
  - Generische Runtime-Teile wie Auswahlmodell, Target Selection, Preview-Panel, temporaere Preview-Operationen, `pendingChangeRequests`, ChangeRequest-Erzeugung und Guardrails sind als kit-Kandidaten abgegrenzt.
  - In BBM bleiben CoreShell-/HostAdapter-Anbindung, aktive Scope-Auswahl, BBM-Registry-Resolver, App-Anbindung und Modul-Registries.
  - Restarbeiten bleibt Referenzmodul; seine Registry, konkreten `data-ui-editor-id`-Anker, IDs und fachlichen Elementzuordnungen bleiben in BBM.
  - Keine Funktionsaenderung, keine Speicherung, keine Registry-Aenderung, keine Fachlogik und keine PDF-Aenderung.
  - Die Preview-Runtime-Rueckfuehrung ist inzwischen abgeschlossen; weitere Kit- oder HostAdapter-Schnitte bleiben getrennte Pakete.

- UI-Editor Preview-ChangeRequests vorbereitet:
  - Preview-Operationen erzeugen/aktualisieren jetzt zusaetzlich temporaere ChangeRequests im UI-Editor-State.
  - Move wird je Preview-Ziel kumuliert; Width/Height werden als Delta kumuliert; Hide/Show ueberschreibt eine `visibility`-Aenderung.
  - Das Preview-Panel zeigt `Aenderungen vorbereitet`, Operationen fuer das aktuelle Element und `Noch nicht gespeichert`.
  - `Reset` entfernt Preview-Styles und ChangeRequests fuer das aktuelle Preview-Ziel; `Aenderungen verwerfen` leert alle vorbereiteten Aenderungen und setzt alle Preview-Styles zurueck, die Auswahl bleibt erhalten.
  - Keine Speicherung, kein localStorage, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.
  - Naechster offener Schritt: fachliche Sichtpruefung im lokalen Electron-DEV-Kontext.

- UI-Editor aktiver Markierungspfad dokumentiert:
  - Der sichtbare blaue Rahmen wurde auf den bestehenden Kit-Auswahlpfad `uiEditor/targetSelection.js` zurueckgefuehrt.
  - Dokumentiert sind Klickauswahl, Rahmen-Styles, Auswahl-State und der Unterschied zwischen aktivem Markierungspfad und nicht sichtbarem Launcher-Statuspfad.
  - Empfehlung: Eine spaetere Preview-Bedienung muss an den echten sichtbaren Bediencontainer und an `onSelectionChange(selection)` des aktiven Auswahlpfads andocken.
  - Keine Preview-Logik, keine Markierungslogik, keine Registrierung, keine Speicherung, keine Fachlogik und keine PDF-Aenderung.
  - Geprueft wird mit `npm test`.

- UI-Editor Restarbeiten-Preview-Bedienung sichtbar gemacht:
  - Der bestehende UI-Editor-Launcher zeigt nach Auswahl eines registrierten Restarbeiten-Elements einen sichtbaren Preview-Bereich im vorhandenen Panel.
  - Der Bereich zeigt Element-ID und `allowedOps`; Move-, Resize-, Hide-/Show- und Reset-Buttons verwenden die vorhandene Preview-Logik.
  - Nicht erlaubte Preview-Aktionen bleiben deaktiviert; Reset bleibt bedienbar und entfernt temporaere Preview-Styles.
  - Keine neue Registrierung, keine neue Markierungslogik, keine Speicherung, keine Fachlogik, keine Restarbeiten-Fachdaten, keine DB-/IPC-Schreibwege und keine PDF-Aenderung.
  - Geprueft mit gezieltem Runtime-Test und `npm test`; alle Tests bestanden.
  - Naechster offener Schritt: fachliche Sichtpruefung im lokalen Electron-DEV-Kontext.

- UI-Editor Restarbeiten-Edit-Preview umgesetzt:
  - Der bestehende UI-Editor-Runtime-Launcher bietet fuer ausgewaehlte, registrierte Restarbeiten-UI-Elemente jetzt temporaere Preview-Aktionen im vorhandenen Panel an.
  - Move, Resize und Hide/Show werden nur ausgefuehrt, wenn die registrierten `allowedOps` des ausgewaehlten Elements die jeweilige Operation erlauben.
  - Preview-Zustand bleibt ausschliesslich im Speicher; Reset und Deaktivieren des UI-Editors entfernen die temporaeren Inline-Styles wieder.
  - Keine neue Registrierung, keine neue Markierungslogik, keine Speicherung, keine Fachlogik, keine Restarbeiten-Fachdaten, keine DB-/IPC-Schreibwege und keine PDF-Aenderung.
  - Geprueft mit gezieltem Runtime-Test, Restarbeiten-Modultest, UI-Editor-Vertragstest, Legacy-Boundary-Tests und `npm test`; alle Tests bestanden.
  - Naechster offener Schritt: fachliche Sichtpruefung im lokalen Electron-DEV-Kontext.

- M2.3 Restarbeiten Notizhistorie und Notiz-Popup umgesetzt:
  - Der Notiz-Button in der Restarbeiten-Editbox ist fuer gespeicherte Datensaetze aktiv und oeffnet ein einfaches Popup mit Historie, leerem Zustand, Eingabefeld, Hinzufuegen, Drucken und Schliessen.
  - Neue Notizen werden nur mit nicht leerem Text gespeichert; das Popup bleibt offen und aktualisiert die Historie.
  - Datenweg ergaenzt: `restarbeiten_notes`, Repository-Funktionen, IPC-/Preload-Bruecke und Renderer-DataSource fuer Listen und Anlegen von Notizen.
  - Der Drucken-Button ist als strukturierter Restarbeiten-Notizhistorie-Stub vorbereitet; keine allgemeine PDF-/Mail-Anbindung.
  - Editorfaehig bleibt nur der vorhandene feste Notiz-Button der Editbox; Popup, Fachaktionen, Speichern, Datenbankaktionen und Druckausfuehrung sind nicht editorfaehig.
  - Geprueft mit `npm test`; alle Tests bestanden.
  - Naechster offener Schritt: fachliche Sichtpruefung des Notiz-Popups im lokalen App-Kontext.

- M2.1 Restarbeiten Main/Body Detaildarstellung umgesetzt:
  - Das Blatt zeigt jetzt einen dezenten Tabellenkopf mit `Nr.`, `Gegenstand`, `Fertig bis`, `Status` und `Verantw.`.
  - Datensatzzeilen sind dreispaltig und dreizeilig aufgebaut: Nummer/Datum/Klasse, Verortung/Kurztext/Langtext, Fertig-bis mit Ampel/Status/Verantwortlich.
  - Das Wort `Ampel` erscheint nicht im Tabellenkopf; rechte Datensatzwerte wiederholen keine Bezeichner wie `Fertig bis:`, `Status:` oder `Verantwortlich:`.
  - UI-Editor-Registry wurde nur um die neuen Anzeige-/Struktur-IDs fuer Tabellenkopf, Klasse und Verortung ergaenzt.
  - Keine Datenbank-, IPC-, Preload-, PDF-/Mail-, Notiz- oder Protokoll-Aenderungen.
  - Naechster offener Schritt: fachliche Sichtpruefung und danach getrennt M2.2 planen.

- M1 RestarbeitenScreen-Grundgeruest nach dem Rueckbau aufgebaut:
  - Die kaputte sichtbare Restarbeiten-V2-UI bleibt entfernt und wird nicht wiederverwendet.
  - Restarbeiten oeffnet wieder einen neuen, bewusst gebauten M1-Screen mit Filterbar, Hauptbereich, Editbox und Quicklane-Anbindung.
  - Der Restarbeiten-UI-Editor-Scope `restarbeiten.screen` ist als explizite M1-Elementliste in der zentralen BBM-UI-Editor-Registry verfuegbar; Protokoll- und Demo-Scope bleiben erhalten.
  - PDF-Vorschau, Ausgabe, Druck, E-Mail, Notizen und Diktat bleiben fachlich als Stub/Platzhalter fuer spaetere Pakete getrennt.
  - Fachlogik, Fachdaten, Datenmodell, Repository, IPC, Datenbank, Protokoll und PDF/Druck blieben unveraendert.
  - Kein UI-Scan, keine automatische Elementerkennung und keine Migration.
  - Naechster offener Schritt: M2 fachlich getrennt planen, bevor Ausgabe/PDF/Notizen/Diktat umgesetzt werden.

- K19.17 neutraler UI-Editor-Aktivmodus zeigt registrierte UI-Elementliste rein lesend:
  - Der Statushinweis zeigt bei aktivem UI-Editor den registrierten Scope `protokoll.topsScreen` und darunter die registrierten UI-Elemente aus der BBM-Registry.
  - Keine Bearbeitung, keine Auswahl, keine Speicherung, kein DOM-Scan und keine Fachlogik.
  - Naechster offener Schritt: fachliche Sichtpruefung per `npm start` auf dem Zielsystem.

- K19.16a neutraler UI-Editor-Aktivmodus zeigt festen registrierten Scope:
  - Der Statushinweis zeigt bei aktivem UI-Editor den registrierten Scope `protokoll.topsScreen` aus der BBM-Registry.
  - Keine automatische Erkennung, kein Panel, kein Hover, keine Auswahl, keine Speicherung, kein DOM-Scan und keine Fachlogik.
  - Naechster offener Schritt: fachliche Sichtpruefung per `npm start` auf dem Zielsystem.

- K19.9a BBM-Testeinbindung nach Neuinstallation der UI-Editor-Artefakte sauber repariert:
  - Installierte Artefakt-Tests unter `uiEditor/tests/` bleiben generisch und werden nicht mehr direkt als BBM-Testmodul in `scripts/test.cjs` importiert.
  - BBM prueft installierte UI-Editor-Artefakte ueber den eigenen Test `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs`.
  - Die echte BBM-Registry bleibt separat unter `src/renderer/uiEditor/bbmUiEditorRegistry.js` abgesichert.
  - Naechster offener Schritt: fachliche/technische Abnahme auf dem Branch mit den neu installierten UI-Editor-Artefakten.
  - Risiken/Hinweise: `uiEditor/` selbst bleibt installierter Artefaktbereich und wurde nicht mit BBM-Fachlogik erweitert.

- K19.7 installierte UI-Editor-Grundstruktur mit echter BBM-Registry verbunden (historischer Stand, durch K19.9a testseitig getrennt):
  - `uiEditor/` war als installierter Einstieg mit Verweis auf den offiziellen BBM-Registry-Einstieg `src/renderer/uiEditor/bbmUiEditorRegistry.js` abgesichert.
  - K19.9a trennt die installierten Artefakte und die echte BBM-Registry wieder sauber in zwei Testbereiche.
  - Kein Editor-Panel, kein Header-Button, keine produktive Aenderung, keine Speicherung und keine Fachlogik/Fachdaten.

- K19.1 BBM zentrale UI-Editor-Registry eingefuehrt:
  - Der offizielle Einstieg fuer spaetere Editor-Anbindung ist `src/renderer/uiEditor/bbmUiEditorRegistry.js`.
  - Keine Editor-Integration, keine Speicherung und keine produktive Aenderung.

- K19.0 BBM liefert erste explizite UI-Elementliste fuer das Protokoll-Modul:
  - Feste, explizit klassifizierte UI-Strukturliste fuer `protokoll.root`, `protokoll.header`, `protokoll.toolbar`, `protokoll.list`, `protokoll.detail` und `protokoll.footer` ergaenzt.
  - Keine Editor-Integration, kein DOM-Scan, keine Speicherung und keine produktive UI-Aenderung.
  - Test prueft Pflichtfelder, eindeutige IDs, Parent-Verweise, fehlende Fachdatenfelder und fehlende Datenbank-/Speicher-/Ausfuehrungslogik.

- M20.2 UI-/PDF-Entwurfsentscheidung in Codex-Startplanung verankert:
  - Keine Editor-CodeÃ¤nderung.
  - Keine Fachmodul-Ã„nderung.
  - Keine Produktivaktivierung.

- M20.1 Editor-Lesefilter fuer Registry-Kategorien vorbereitet:
  - Keine Produktivaktivierung.
  - Kein UI-Umbau.
  - Kein Button-Fix.

- M20.0 Registry-Kategorien technisch vorbereitet:
  - Keine Produktivaktivierung.
  - Kein UI-Umbau.
  - Kein Button-Fix.

- M19.8 Registry-Kategorien test-/dokumentationsseitig abgesichert:
  - Keine Produktivaktivierung.
  - Kein Code-Umbau.
  - Kein Button-Fix.

- M19.7 technische Zielrichtung fuer Registry-Bereinigung festgelegt:
  - Keine Produktivaktivierung.
  - Kein Code-Umbau.
  - Kein Button-Fix.

- M19.6 Registry gegen Ziel-UI-Skelett abgeglichen:
  - Keine Produktivaktivierung.
  - Kein Code-Umbau.
  - Kein Button-Fix.

- M19.5 Ziel-UI-Skelett nach Editor-Regeln festgelegt:
  - Keine Produktivaktivierung.
  - Kein Code-Umbau.
  - Kein Button-Fix.

- M19.4 UI-Entwurf gegen Editor-Regeln abgeglichen:
  - Restarbeiten V2 wurde elementweise gegen die Editor-Regeln bewertet.
  - Keine Produktivaktivierung.
  - Kein Button-Fix.
  - Keine Codeaenderung.

- M19.3R Zielvertragspruefung gestartet/abgeschlossen:
  - Ergebnis ist ein Abgleich Restarbeiten V2 gegen den urspruenglichen UI-Editor-Zielvertrag.
  - Kein Button-Fix.
  - Keine Produktivaktivierung.

- M19.2 manuelle Abnahme-Pruefanweisung vorbereitet:
  - Keine Produktivaktivierung.
  - Altpfad bleibt Standard.

- M19.1b Abnahme-Checkliste testseitig abgesichert:
  - Keine Produktivaktivierung.

- M19.1a Abnahme-Checkliste dokumentiert:
  - Keine Produktivaktivierung.
  - Altpfad bleibt Standard.
  - Schreib-/Upload-/Autosave-/IPC-Wege bleiben gesperrt.

- M19.0 Produktiv-ReadOnly-Abnahmetest vor Aktivierung festgelegt:
  - Vor einer echten Produktiv-ReadOnly-Aktivierung ist ein fachlicher Abnahmetest zwingend.
  - Produktiv-ReadOnly bleibt im echten Betrieb deaktiviert.
  - Altpfad bleibt Standard; DEV-/Testfreigabe bleibt moeglich.

- M18.5 Restarbeiten V2 ReadOnly-Freigabevorbereitung abgeschlossen und eingefroren:
  - M18.0 bis M18.4 sind als ReadOnly-Freigabevorbereitung abgeschlossen.
  - Altpfad bleibt Standard.
  - DEV-/Testfreigabe bleibt moeglich.
  - Produktiv-ReadOnly bleibt technisch vorbereitet, testseitig simuliert geprueft und im echten Betrieb deaktiviert.

- M18.4 Restarbeiten V2 Produktiv-ReadOnly-Freigabe simuliert getestet:
  - Der Router-Checkpoint kann im Test gezielt auf `true` uebersteuert werden.
  - Der produktive ReadOnly-Flow laeuft dann sichtbar ueber den V2-Pfad und bleibt auf Lesen begrenzt.
  - Die echte produktive Freigabe bleibt ausserhalb des Tests deaktiviert.

- M18.3 Restarbeiten V2 Produktiv-ReadOnly-Freigabeschalter technisch vorbereitet:
  - Der Router fuehrt jetzt einen klar benannten Vorbereitungs-Checkpoint fuer die explizite Produktivfreigabe.
  - Der Checkpoint bleibt hart deaktiviert und liefert weiter `false`.
  - Die normale Restarbeiten-Lizenz allein schaltet V2 ReadOnly weiterhin nicht frei.

- M18.2 Restarbeiten V2 expliziten Produktiv-ReadOnly-Freigabeschalter fachlich definiert:
  - Der spaetere produktive Schalter ist als explizite Produktivfreigabe fuer `restarbeiten` in der vorhandenen Mutter-/Kind-Freigabelogik benannt.
  - Die normale Restarbeiten-Lizenz allein schaltet V2 ReadOnly weiterhin nicht automatisch frei.
  - Der produktive ReadOnly-Weg bleibt technisch aus; DEV-/Testfreigabe bleibt an `bbm.uiMode = "new"` gebunden.

- M18.1 Restarbeiten V2 ReadOnly-Produktivfreigabe technisch vorbereitet:
  - Der Router unterscheidet jetzt lokal zwischen Altpfad, DEV-/Testfreigabe und spaeterer produktiver ReadOnly-Freigabe.
  - Die produktive ReadOnly-Freigabe ist strukturell vorbereitet, aber ohne ausdruecklichen spaeteren Freigabeschalter nicht aktiv.
  - Schreib-, Upload-, Import-, Autosave- und neue IPC-Wege bleiben gesperrt.

- M18.0 Restarbeiten V2 naechste Ausbauphase fachlich festgelegt:
  - M18 beginnt nicht mit Schreiben, sondern mit einer kontrollierten ReadOnly-Produktivfreigabe oder deren fachlicher Vorbereitung.
  - Schreib-, Upload- und Autosave-Themen bleiben gesperrt, bis sie eigene Meilensteine erhalten.
  - Die weitere Ablösung der alten Restarbeiten-UI wird spaeter gesondert entschieden.

- M17.8 Restarbeiten V2 ReadOnly-Freigabeentscheidung dokumentiert und Abschluss vorbereitet:
  - Die M17-ReadOnly-Phase ist als lesende Vorbereitungsstrecke dokumentiert.
  - Freigegeben ist nur der ReadOnly-Pfad unter der bestehenden Umschaltbedingung; Altpfad, wenn die Freigabe fehlt, bleibt erhalten.
  - Nicht freigegeben sind Schreiben, Create, Update, Delete, Upload, Import, Autosave, neue IPC-Wege und die vollstaendige Ablösung der alten Restarbeiten-UI.

- M17.7 Restarbeiten V2 ReadOnly-Produktivfreigabe fachlich vorbereitet:
  - Die Umschaltbedingung fuer `restarbeiten` ist jetzt als kleine Router-Guard-Funktion sichtbar und testseitig abgesichert.
  - Ohne Freigabe bleibt der alte Restarbeiten-Pfad erhalten; mit Freigabe laeuft der DEV-/ReadOnly-Pfad weiter.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.6 Restarbeiten V2 echten Projektworkspace-Modulstart minimal verdrahtet:
  - Der Projektworkspace startet das Modul `restarbeiten` im DEV-Pfad jetzt kontrolliert in den vorhandenen Restarbeiten-V2-ReadOnly-Flow.
  - Die projectId laeuft vom Workspace bis in den Legacy-Leseloader; der DEV-Fallback bleibt erhalten.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.5 Restarbeiten V2 ReadOnly-Pfad im echten Projektworkspace sichtbar geprueft:
  - Der Projektworkspace dient jetzt im Test als sichtbarer Kontextstart fuer den ReadOnly-Pfad.
  - Die projectId laeuft vom Workspace bis in den Legacy-Leseloader.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.4 Legacy-ReadOnly-Pfad gegen Schreib- und Nebenwege abgesichert:
  - Der bestehende ReadOnly-Pfad bleibt strikt lesend; Guardrails pruefen fehlende Schreib-, Upload-, Autosave- und neue IPC-Wege.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.3 Echten Legacy-ReadOnly-Loader hinter die Factory gehaengt:
  - Der DEV-/ReadOnly-Pfad probiert jetzt den vorhandenen Legacy-Leseweg und faellt nur bei fehlendem Projektkontext oder Loader-Fehlern auf die DEV-Fallback-Rows zurueck.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.2 Restarbeiten V2 ReadOnly-Lesequelle im Projektkontext abgesichert:
  - Der DEV-Einstieg reicht den aktuellen Projektkontext jetzt bis in die ReadOnly-Lesequelle durch.
  - Ohne Projektkontext bleibt der bisherige DEV-Fallback aktiv.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M17.1 Restarbeiten V2 ReadOnly-Lesequelle testweise angebunden:
  - Der DEV-Zugang nutzt jetzt testweise die vorbereitete ReadOnly-Factory ueber den lesenden Weg bis in den Restarbeiten-V2-Screen.
  - Der Screen selbst bleibt unveraendert; die Kette bleibt schreibfrei.
  - geprueft mit den Restarbeiten-V2-Tests und `npm test`.

- M35.1 Restarbeiten-Quicklane ist wieder ohne E-Mail-Button:
  - Das Mail-Icon wurde aus der Quicklane entfernt.
  - Der Restarbeiten-Screen haelt keinen eigenen Mail-Transport mehr vor.
  - Quicklane, Tests und Status sind wieder auf den reinen Restarbeiten-Stand ohne Mail-Fallback ausgerichtet.

- M35 Restarbeiten-Mail-Icon faellt jetzt auch ohne Outlook und ohne Empfaenger nicht mehr still aus:
  - Der Mail-Button versucht zuerst den Outlook-Entwurf.
  - Wenn Outlook nicht greift, baut der Flow einen direkten `mailto:`-Entwurf.
  - Auch bei fehlenden Projekt-Empfaengern kann der Mail-Client damit noch aufgehen.
  - geprueft mit `npm test`.

- M34.9 Restarbeiten-Quicklane-Mail ist jetzt robuster verdrahtet:
  - Der Mail-Button erzeugt den Restarbeiten-PDF-Anhang jetzt ueber den reinen PDF-Export statt ueber die Vorschau.
  - Outlook wird zuerst versucht; falls das nicht klappt, faellt der Flow auf den normalen Mail-Client zurueck.
  - Der neue Mail-Transport haengt weiter an den aktuellen Restarbeiten-Daten und nutzt denselben Quicklane-Einstieg.
  - geprueft mit `npm test`.

- M34.8 Restarbeiten-Quicklane hat jetzt einen E-Mail-Button fuer Outlook:
  - Der neue Quicklane-Button erzeugt einen Restarbeiten-PDF-Anhang und startet danach einen Outlook-Entwurf.
  - Empfaenger, Betreff und Text werden aus dem aktuellen Restarbeiten-Projekt abgeleitet.
  - Auch ohne vorhandene Empfaenger wird Outlook jetzt geoeffnet; die Mail kann dann manuell vervollstaendigt werden.
  - Die bestehende PDF-Vorschau bleibt unveraendert; der neue Mail-Flow ist separat angebunden.
  - Guardrail-Tests fuer Restarbeiten wurden auf den neuen Mailpfad angehoben.

- M34.7 Restarbeiten-Quicklane hat jetzt einen Drucker-Button fuer die PDF-Vorschau:
  - Der neue Quicklane-Button startet den bestehenden Restarbeiten-Preview-Pfad.
  - Die Vorschau bleibt ueber `openRestarbeitenPreview()` / `printPdfAndPreviewInternal` verdrahtet.
  - Der Rest der Quicklane bleibt unveraendert.
  - geprueft mit `npm test`.

- M34.6 Restarbeiten-Quicklane-Schloss wechselt jetzt sichtbar offen/geschlossen:
  - Der Pin-Button der Restarbeiten-Quicklane nutzt nun ein eindeutiges gelbes Schloss mit offenem und geschlossenem Zustand.
  - Der bestehende Pin-Mechanismus bleibt unverändert, nur die Darstellung des Schlosses ist jetzt klar umschaltbar.
  - geprueft mit `npm test`.

- M34.5 Restarbeiten-Ampelsteuerung auf Screen-Root gehoben:
  - Der Restarbeiten-Screen setzt jetzt einen Root-Zustand `data-ampel-visible`, damit Liste und Editbox nicht nur per Einzel-`hidden`-Logik reagieren.
  - Die Ampel-Sichtbarkeit wird im Screen zentral mitgeführt und an den Router-Kontext gespiegelt.
  - Quicklane, Liste, Editbox und PDF nutzen weiter denselben `showAmpelInList`-Schalter.
  - geprueft mit `npm test`.

- M34.4 Restarbeiten-Ampelschaltung zentralisiert:
  - Der Restarbeiten-Screen bleibt die Quelle fuer `showAmpelInList`.
  - Die Quicklane schaltet weiter nur den Screen-Zustand.
  - Der PDF-Pfad bekommt `showAmpelInList` jetzt explizit ueber IPC und Printdaten mit.
  - Die Editbox wird beim Rendern erneut an den aktuellen Ampelzustand gebunden.
  - geprueft mit `npm test`.

- M34.3 Restarbeiten: Quicklane-Beschriftung und stabiles Rechtsverhalten angepasst:
  - RestarbeitenQuicklane enthält in der Ausgabegruppe jetzt `Vorschau` und `Drucken`.
  - `Vorschau` nutzt weiterhin den bestehenden M33.10-Pfad `printPdfAndPreviewInternal` (inkl. `mode: "restarbeiten"` und `devLayoutPreview: false`).
  - `Drucken` nutzt weiterhin den bestehenden M34.2-Pfad `projectsOpenRestarbeitenDir`.
  - Quicklane ist rechts sticky/stabil ausgerichtet; die Liste bleibt beim Hover ohne Breiten-/Layoutsprung stabil, inklusive responsive Rückfall auf schmale Breiten.
  - Keine neue Drucklogik und keine Header-/Filterleisten-Reorganisation.

- M34.2 Restarbeiten: Quicklane-Ausgabe um „Ordner öffnen“ ergänzt:
  - RestarbeitenQuicklane enthält in der Ausgabegruppe jetzt `Drucken` und `Ordner öffnen`.
  - `Ordner öffnen` nutzt den neuen IPC-/Preload-Pfad `projects:openRestarbeitenDir` / `projectsOpenRestarbeitenDir` und öffnet den Restarbeiten-Ausgabeordner des aktuellen Projekts.
  - Die Ordnerauflösung basiert weiter auf `buildStoragePreviewPaths(...)` inkl. `restarbeitenDir`; der Ordner wird bei Bedarf erstellt und dann per `shell.openPath(dir)` geöffnet.
  - M33-Druckpfad (`printPdfAndPreviewInternal`) inkl. interner BBM/Chromium-PDF-Vorschau bleibt unverändert.
  - Header-/Filterleisten-Reorganisation bleibt bewusst offen.

- M34.1 Restarbeiten: rechte Ausgabe-Toolbox/Quicklane vorbereitet:
  - RestarbeitenScreen rendert jetzt eine modulnahe rechte Quicklane (`RestarbeitenQuicklane`) innerhalb des Arbeitsbereichs.
  - Die Quicklane enthält eine kompakte Ausgabegruppe mit `Drucken` und nutzt denselben bestehenden M33-Druck-/Vorschaupfad.
  - Header-Button `Drucken` bleibt unverändert erhalten; `+ Restpunkt` bleibt unverändert.
  - Keine E-Mail, keine Fotos und keine neue Druckarchitektur.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/projektverwaltungModule.test.cjs`, `node scripts/tests/licenseFeatureGuards.test.cjs`, `node scripts/tests/layoutToolsRegression.test.cjs`, `node scripts/tests/printIpcToPdfAndOpen.test.cjs`, `node scripts/tests/printIpcInternalPdfPreview.test.cjs`; `npm test` in Codex Cloud weiter mit fehlendem `libatk-1.0.so.0`.


- M33.9 Restarbeiten-Drucken nutzt jetzt echte PDF-Druckvorschau (PDF erzeugen + PDF öffnen):
  - Neuer IPC `print:toPdfAndOpen` erzeugt über den bestehenden V2-PDF-Pfad (`printToPdf(...)`) die Datei und öffnet sie anschließend mit `shell.openPath(filePath)`.
  - Rückgabe ist bei Erfolg `{ ok: true, filePath }`; bei Öffnungsfehler `{ ok: false, error, filePath }`.
  - Preload-Bridge `bbmPrint.printPdfAndOpen(...)` ergänzt.
  - RestarbeitenScreen nutzt für den Button `Drucken` jetzt den PDF-und-Öffnen-Pfad statt HTML-Preview und meldet klare PDF-Statusmeldungen.
  - HTML-Vorschau (`print:openHtmlPreview`) bleibt unverändert für andere Pfade erhalten.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/projektverwaltungModule.test.cjs`, `node scripts/tests/licenseFeatureGuards.test.cjs`, `node scripts/tests/layoutToolsRegression.test.cjs`, `node scripts/tests/printIpcToPdfAndOpen.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: App-Sichtpruefung, dass Restarbeiten-Drucken eine PDF-Datei erzeugt und im System-PDF-Viewer öffnet.

- M33.8 Restarbeiten-Druckvorschau ohne DEV-Layouteditor umgesetzt:
  - `print:openHtmlPreview` setzt `devLayoutPreview` nicht mehr pauschal, sondern nur noch bei explizitem `payload.devLayoutPreview === true`; ohne explizite Anforderung bleibt die Vorschau im normalen Endanwender-Modus.
  - `layoutCalibrationEnabled` wird im Preview-IPC nur noch fuer explizite DEV-Layoutvorschau durchgereicht, sonst erzwungen `false`.
  - Restarbeiten-Preview-Aufruf setzt explizit `devLayoutPreview: false`, damit Header-Button `Drucken` keine Layouteditor-Werkzeuge/Zonen aktiviert.
  - Regressionstests fuer Restarbeiten-Preview-Payload und LayoutTools-Preview-Guard auf den neuen Opt-in-Mechanismus angehoben.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/projektverwaltungModule.test.cjs`, `node scripts/tests/licenseFeatureGuards.test.cjs`, `node scripts/tests/layoutToolsRegression.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: App-Sichtpruefung, dass Restarbeiten-Drucken eine normale PDF-nahe Vorschau ohne Tabelleneditor-Werkzeuge oeffnet.

- M33.6 Restarbeiten-V2-Vorschau in App sichtbar + Fehlerstatus umgesetzt:
  - `print:openHtmlPreview` blockiert packaged nicht mehr; bestehender V2-Preview-Pfad oeffnet sichtbar mit `show/focus` weiter ueber `createPrintWindow` + `getPrintAppUrl`.
  - RestarbeitenScreen wertet das Ergebnis von `printOpenHtmlPreview` jetzt aus und meldet Bridge-fehlt, `{ok:false,error}` und Exceptions klar in der Statuszeile.
  - Erfolgspfad setzt zusaetzlich `Druckvorschau geoeffnet.` als Rueckmeldung.
  - Restarbeiten-Tests fuer Erfolgs-/Fehler-/Bridge-/Exception-Pfade ergaenzt; LayoutTools-Regression auf packaged-faehige Preview-Guard aktualisiert.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`, `node scripts/tests/projektverwaltungModule.test.cjs`, `node scripts/tests/licenseFeatureGuards.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: App-Sichtpruefung im echten packaged Build (Preview-Fenster oeffnet/fokussiert).

- Arbeitsstand #117 Restarbeiten-Editbox-Layout:
  - Quicklane-Schloss-Icon vorbereitet.
  - Restarbeiten-Editbox-Layout optisch stabilisiert.
  - Buttonbegriff auf + Restpunkt vereinheitlicht.
  - farbige Hilfsrahmen / Outlines bleiben bewusst erhalten.
  - Fake-Diktat-Platzhalter wurden entfernt.
  - npm test lokal gruen.


- M29 Restarbeiten-Filterleiste neu gegliedert und kompakter angeordnet:
  - Klassenfilter (Alle/Mangel/Rest) ist jetzt vertikal und kleiner, aktive Auswahl bleibt visuell markiert.
  - Verortungsfilter sind als zwei Zweiergruppen aufgebaut (Level 1+2, Level 3+4) und die Label-Logik bleibt projektbezogen unverändert.
  - Metafilter sind in obere Zeile (Status + Fertig bis) und untere Zeile (Verantwortlich) aufgeteilt; Feldlabels stehen neben den Selects.
  - Schließen bleibt als eigener rechter Aktionsbereich in der Filterleiste.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs` und `node scripts/tests/projektverwaltungModule.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: visueller UI-Check der kompakten Filterleiste auf realer Laufzeitbreite.



- M27 Globaler Header links typografisch an rechte Buerozeile angeglichen:
  - `BBM ${version}` links auf 12px/15px reduziert und Font-Weight von 700 auf 600 abgesenkt.
  - `aktiv: ...` links auf 12px/15px gehalten und bei Weight 500 belassen, damit die linke Seite nicht dominanter als `rightInfo` wirkt.
  - Header-Zeilenstruktur bleibt unveraendert (`actionWrap` Zeile 2, `stickyNotice` Zeile 3); keine Zusatzzeile, keine Filterleisten-Aenderung.
  - geprueft mit `node scripts/tests/projektverwaltungModule.test.cjs` und `node scripts/tests/restarbeitenModule.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: Volltestlauf (`npm test`) auf Host/CI mit installierten Electron-Systemlibs.


- Hotfix M26.2 Testlauf repariert und Filterleiste-Begriff in Restarbeiten-Tests abgesichert:
  - MainHeader-Test akzeptiert den kompakten Header im alten und neuen UI-Modus deterministisch (rowGap 4px/5px), ohne Versions- oder Grid-Vertragsrueckbau.
  - Restarbeiten-M12/M16/M19-Tests auf aktuellen Zielstand angehoben (Token M/R, kein itemClassLabel in Metaspalte, kompakte Editbox ohne Speichern-Button).
  - ungenutzte CSS-Regel `.restarbeiten-editbox__save{...}` aus `restarbeitenListStyle.js` entfernt.
  - Fachklarstellung in Tests: gruene Restarbeiten-Leiste = Filterleiste (Filter + Schliessen), nicht globaler Header.
  - geprueft mit `node scripts/tests/projektverwaltungModule.test.cjs` und `node scripts/tests/restarbeitenModule.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: Volltestlauf (`npm test`) auf Host/CI mit installierten Electron-Systemlibs.


- M20 Restarbeiten-Editbox Verortungsvorschlaege + kompaktere Feldoptik umgesetzt:
  - Verortungsfelder `location_level_1..4` sind als freie `input`-Felder mit `datalist`-Vorschlaegen verdrahtet (Auswahl + freie Eingabe).
  - RestarbeitenScreen leitet eindeutige, sortierte Vorschlagswerte aus geladenen Rows ab und uebergibt sie an die Editbox.
  - Verortungs- und Verantwortlich-Feldoptik ist sichtbar kompakter (kleinere Labels/Controls, weniger Padding).
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: UI-Sichtpruefung der neuen Verortungs-Datalist im laufenden Client.


- M16.3 Restarbeiten-Tests und Editbox-Legacy-Firma nach M16-Merge repariert:
  - M7/M8-Tests auf M16-Fachentscheidung angepasst (Fotos nicht in der Editbox, Fotoanzeige listenseitig).
  - `setProjectFirms(...)` in der Editbox robust auf explizite Optionenpruefung fuer Legacy-Firmen umgestellt.
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`; `npm test` scheitert in Codex Cloud weiter an fehlendem `libatk-1.0.so.0`.
  - Naechster offener Schritt: CI/Host mit GUI-Libs fuer vollstaendigen `npm test`-Lauf verwenden.


- M15 Restarbeiten-UI wurde strukturell auf TopsScreen-Shell umgestellt:
  - Header mit vier Verortungsfiltern (projektbezogene Labels + Fallback Ebene 1-4)
  - Sheet/Canvas/Paper + Edit-Canvas als feste Screen-Bereiche per data-Attributen
  - Hauptliste als kompakte ul/li-Zeilen (kein table) mit einklappbarem Fotobereich
  - UI-Filterung auf location_level_1..4 (Option Alle, kombinierbar, nur Anzeige)
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`


- M14 Restarbeiten-Arbeitsblatt-UI wurde auf das Zielbild angehoben:
  - zentrierte Blattflaeche mit klarer Listen-/Arbeitsstruktur
  - Header mit Schliessen, + Restarbeit, Verortung und Metaspalten
  - Verortung als vier Ebenen (L1-L4) nebeneinander
  - pro Datensatz einklappbare Fotozeile vorbereitet (inkl. Expand/Collapse-Status)
  - Editbox bleibt unterhalb der Arbeitsblattliste
  - geprueft mit `node scripts/tests/restarbeitenModule.test.cjs`

- Hotfix M13.2: Die reale Runtime-Projektmodulliste liefert jetzt `Restarbeiten` fuer die Projektkachel; der Kachelpfad zeigt damit zur Laufzeit `Protokoll`, `Restarbeiten`, `Edit` (ohne `projectFirms`) und oeffnet `Restarbeiten` ueber `openProjectModule(...)`.

- M11 Restarbeiten-Fotoanzeige ist stabilisiert:
  - feste 2-Spalten-Ansicht mit Hauptfoto links und bis zu zwei Nebenfotos rechts
  - alle Bildflaechen im festen Landscape-Format mit `object-fit: cover`
  - keine Bilddateibearbeitung, nur Anzeigeformatierung
- Naechster offener Schritt: fachliche Sichtpruefung der Restarbeiten-Fotoansicht im UI.
- Das globale FachwÃ¶rterbuch V1 fuer das Diktat ist jetzt technisch angebunden:
  - globale `dictionary_entries`-Tabelle, Dictionary-Service und IPC-/Preload-Bruecken sind vorhanden
  - `term` und `correction` sind getrennt modelliert, Kategorie bleibt fest `Bau`
  - Diktat nutzt jetzt die globale Korrekturpipeline und bietet Undo nur fuer den letzten Diktatblock
  - der alte Projekt-Prompt zur Korrektur-Ãœbernahme ist aus dem aktiven Flow entfernt
  - geprueft mit den neuen Dictionary-Tests; der volle `npm test`-Lauf haengt weiter am bekannten `better-sqlite3`-Native-Mismatch
- layoutTools-Grundmodul ist als DEV-only Basis nutzbar und dokumentiert:
  - Pilot 1: TOP-Liste (UI/PDF) inkl. Zonen, live/persist/reset, UI/PDF getrennt
  - Pilot 2: Teilnehmerliste (PDF) inkl. Zonen, live/persist/reset (inkl. Anwesend/Verteiler "x")
  - echte PDFs bleiben ohne gruene Markierungen; DevTools oeffnen nicht automatisch
- Die layoutTools-Aktivierung wird jetzt zentral ueber die DEV-Einstellung `Layout-Kalibrierung aktivieren` geschaltet:
  - nur im DEV-Build sichtbar
  - wirkt appweit auf UI-TOP-Liste, PDF-Layoutvorschauen und Auto-Tabellen
  - gespeicherte Layoutwerte bleiben beim Ausschalten erhalten
  - echte PDF-Erzeugung bleibt ungebremst und markerfrei
  - die Print-HTML-Vorschau bekommt den Schalter jetzt auch direkt ueber `print:init` und das Print-Preload-Binding, damit DEV-Layout-Bearbeitung dort nicht mehr ausfaellt
- Der erste DEV-only Schritt fuer das TOP-Layout-Feintuning ist umgesetzt:
  - die TOP-Liste kann im DEV-Build jetzt Layout-Zonen fuer Nummernblock, Textblock und Metablock anzeigen
  - die aktive Zone wird gruen markiert
  - der Header zeigt im DEV-Layoutmodus eine kleine Layout-Toolbar mit der aktiven Zone oder dem Hinweis `Bereich waehlen`
  - im STABLE-Pfad bleibt die Zusatz-UI verborgen und nicht bedienbar
- Der naechste DEV-only Layout-Schritt ist vorbereitet:
  - die Header-Toolbar zeigt fuer die aktive Zone Dummy-Regler fuer Breite, Innen und Schrift
  - die Regler koennen die laufende UI leicht veraendern, speichern aber nichts dauerhaft
- Der Metablock bekommt jetzt die erste echte Live-Layout-Umstellung:
  - `Breite` wirkt im DEV-Modus nur fuer die aktive Zone `Metablock`
  - die Breite wird ohne Speicherung nur im laufenden Fenster um 5 px pro Klick angepasst
- Die Metablock-Breite kann jetzt ueber den bestehenden `tableLayouts`-Weg gespeichert und zurueckgesetzt werden:
  - `Speichern` schreibt nur die UI-Breite der aktuellen Metablock-Zone
  - `Reset` holt den Tabellenstandard zurueck
  - andere Zonen, PDF, Firmenliste und Teilnehmerliste bleiben unveraendert
- Der Metablock-Innenabstand kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Innen` wirkt nur fuer die aktive Zone `Metablock`
  - Breite, Innenabstand und Schriftgroesse werden gemeinsam ueber `tableLayouts` gespeichert
  - `Reset` stellt alle drei Werte auf den Standard zurueck
- Der Nummernblock kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Breite`, `Innen` und `Schrift` wirken fuer die aktive Zone `Nummernblock`
  - Speicherung und Reset laufen ueber denselben `tableLayouts`-Weg wie beim Metablock
- Der Textblock kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Breite` bleibt bewusst ein Restbereich und ist im DEV-Toolbar-Regler deaktiviert
  - `Innen` und `Schrift` wirken fuer die aktive Zone `Textblock`
- Aufraeum-/Absicherung: die zusaetzlichen Padding/Font-Layout-Variablen sind jetzt strikt DEV-only und werden in STABLE nicht angewendet (keine sichtbare STABLE-Aenderung).
- DEV-only Vorbereitung: In der Print-HTML-Vorschau der TOP-Liste sind jetzt drei PDF-Layout-Zonen (Nummernblock/Textblock/Metablock) per Click aktivierbar und gruen markierbar, ohne Layout-Shift und ohne dass Markierungen in den echten PDF-Export gelangen.
- DEV-only PDF-Feintuning (live, ohne Speichern): In der Print-HTML-Vorschau kann jetzt die Breite des PDF-Metablocks per +/- live in 1mm-Schritten angepasst werden (nur in der laufenden Vorschau).
- Bugfix: PDF-Metablock-Breite wird beim Speichern jetzt korrekt in `protokoll_tops` (PDF-Wert) persistiert und beim erneuten Oeffnen/Neustart wieder angewendet.
- Naechster offener Schritt: die DEV-only Markierung, die neue Preview-Weitergabe und die neuen Live-Werte einmal im laufenden UI gegenpruefen und erst danach weitere Layout-Schritte planen.
- Tabellenlayout-Registrierungsregel dokumentiert.
- Tabellenlayout-Inventar angelegt.
- Tabellenlayout-Registry mit technischer Tabellenklassifizierung erweitert.
- Entstehungsprozess neuer Tabellen fuer das Tabellenlayout dokumentiert.
- `protokoll_participants` ist im technischen Verzeichnis und im Tabellenlayout-Editor registriert; UI/PDF bleiben vorerst Vorschau.
- Der interne Tabellenlayout-Editor zeigt die Registry jetzt als feste Spiegelansicht mit getrennten UI- und PDF-Bereichen; gespeicherte Zusatzspalten werden dort nicht in die Spaltenstruktur hineingezogen.

- Der Ausgabe-Dialog trennt die Druckarten jetzt fachlich korrekter:
  - Protokoll drucken
  - PDF-Vorschau Ã¶ffnen
  - Firmenliste
  - ToDo-Liste
  - TOP-Liste
  - unbekannte Druckmodi werden nicht mehr still auf Protokoll zurÃ¼ckgefÃ¼hrt
  - TOP-Liste zeigt alle TOPs inkl. erledigter und aller TOP-Arten
  - ToDo-Liste zeigt projektweit nur noch offene echte ToDos
  - ToDo-Druck hat einen optionalen Verantwortlichenfilter
  - Firmenlisten drucken den aktuellen Projektstand ohne geschlossene Protokollauswahl
  - gespeicherte Firmenlisten werden nicht mehr als funktionale Ausgabeart angeboten
  - der Druckart-Einstieg akzeptiert jetzt auch den Projektkontext aus `router.context`, damit TOP-Liste nicht wegen eines zu engen Guards gesperrt bleibt
  - TOP-Liste ist im Druckart-Dialog an den vorhandenen Router-Pfad `openTopListAllPrintPreview` angeschlossen
- Der Protokoll-Pilot `protokoll_tops` ist jetzt kontrolliert an den Table-Layout-Resolver angebunden:
  - `printData.js` liefert den resolved Payload fuer den Druckweg mit
  - `printApp.js` und `PrintShell.js` lesen Layoutdaten nur, wenn sie im Payload enthalten sind
  - die echte Protokoll-TOP-Liste liest gespeicherte UI-Layoutwerte jetzt ebenfalls ueber den bestehenden IPC-/Resolver-Pfad
  - der PDF-Druckweg nutzt jetzt die gespeicherten PDF-Werte getrennt von der UI-Liste
  - ohne gespeichertes Layout bleibt die Anzeige exakt beim bisherigen Standard
  - `TopsList` hat einen optionalen Layout-Hook vorbereitet, bleibt aber im sichtbaren Standardpfad
  - geprueft mit `npm test`
- Das Tabellenlayout-System arbeitet jetzt generisch ueber `columns`:
  - der Editor erzeugt die Felder aus der Spaltendefinition
  - `projektverwaltung / project_firms` ist als registrierter naechster Pilot vorhanden
  - `protokoll_tops` bleibt rueckwaertskompatibel
- Die Projekt-Firmenliste nutzt ihre gespeicherten UI-Spaltenbreiten jetzt ueber den Tabellenlayout-Resolver:
  - `ProjectFirmsView.js` laedt `moduleId=projektverwaltung`, `tableKey=project_firms`, `orientation=portrait` ueber `tableLayoutsGetOne`
  - der PDF-Anschluss fuer `project_firms` bleibt bewusst getrennt
- Audit fuer den naechsten Tabellenlayout-Kandidaten erstellt; keine Codeaenderung.
- Teilnehmer im Protokoll als naechsten Tabellenlayout-Kandidaten geprueft; noch kein produktiver Anschluss.
- Scope-Doku fuer den Firmenlisten-Pilot erstellt; keine Codeaenderung.
- Contract-Doku fuer `project_firms` Tabellenlayout erstellt; keine Codeaenderung.
- Naechster offener Schritt: weitere Tabellen nur dann anschliessen, wenn ihre Registry-, Editor- und Preview-Daten sauber bereitstehen.
- Der interne Tabellenlayout-Editor startet jetzt standardmÃ¤ÃŸig im Vollbildmodus und hat oben rechts einen Vollbild-Schalter fuer mehr ArbeitsflÃ¤che.
- Der erste interne Tabellenlayout-Editor fuer `protokoll_tops` ist jetzt im Technik-Dialog angehaengt:
  - Zugang nur ueber `Einstellungen > Entwicklung > Technik > Tabellenlayouts`
  - Laden, Aendern, Speichern und Zuruecksetzen laufen fuer `moduleId=protokoll`, `tableKey=protokoll_tops` und die jeweilige Orientierung ueber die vorhandenen `tableLayouts`-IPC-Endpunkte
  - die Quelle wird im Editor als Standardlayout, gespeichertes Layout oder Fallback angezeigt
  - die Layoutauswahl ist wieder fachlich korrekt modul- und tabellenbezogen, nicht projektbezogen
  - Modul- und Tabellenlisten kommen aus der bekannten Registry/Definition
  - aktuell sind dort `Protokoll / TOP-Liste / protokoll_tops`, `Protokoll / Teilnehmerliste / protokoll_participants` und `Projektverwaltung / Projekt-Firmenliste / project_firms` angemeldet
  - der frÃ¼here Projekt-/Besprechungsansatz im Editor wurde wieder entfernt
  - die Vorschau ist jetzt als feste Spiegelansicht mit getrennten UI- und PDF-Bereichen umgesetzt
  - der Editor nutzt jetzt ein nahezu vollflÃ¤chiges internes ArbeitsflÃ¤chen-Overlay
  - Layoutwerte werden vor dem Speichern validiert und defensiv normalisiert
  - UI-/PDF-Hinweise im Editor wurden klarer formuliert; `project_firms` und `protokoll_participants` sind PDF-seitig nur Vorschau, `protokoll_tops` ist produktiv angeschlossen
  - ungueltige technische Werte werden nicht gespeichert
  - kaputte gespeicherte Layouts fallen auf das Standardlayout der konkreten Tabelle zurueck
  - normale Navigation und sichtbare Protokoll-UI bleiben unveraendert
  - geprueft mit `npm test`
  - die Editor-Vorschau zeigt registrierte Testdaten statt echter Projekt- oder Besprechungsdaten
- Naechster offener Schritt: spaeter entscheiden, ob weitere Tabellen eigene Preview-Daten in der Registry bekommen.
- Der Table-Layout-Resolver fuer `protokoll_tops` ist jetzt als technische Grundlage vorhanden:
  - die zentrale Registry kennt den Pilot `protokoll_tops`
  - `getResolvedTableLayout(...)` liefert Standardlayout, gespeichertes Layout oder einen sicheren Fehler fuer unbekannte Tabellen
  - kaputtes JSON faellt auf das Standardlayout zurueck
  - portrait und landscape werden getrennt behandelt
  - geprueft mit `npm test`
- Naechster offener Schritt: den Resolver spaeter nur dort anschliessen, wo er fachlich wirklich gebraucht wird, ohne UI oder Druckoptik vorwegzunehmen.
- Der Kurztext von neu angelegten Level-1-Titeln wird jetzt nicht mehr beim Blur verworfen:
  - die SharedEditbox-Kette delegiert die Kurztext-Limitierung und Counter-Aktualisierung wieder korrekt an die Editbox
  - Kurztext-Input landet sofort im Draft und in der Live-Liste
  - Blur speichert den aktuellen Titel und laesst ihn im Editor stehen
  - uebernommene Level-1-Titel bleiben read-only und ohne operative Meta
- Geprueft mit `npm test`.
- Der Level-1-Titel wird jetzt wieder sauber gespeichert:
  - Kurztext-Blur ueberschreibt den echten Titel nicht mehr mit einem alten Draft
  - nach erfolgreichem Save wird der geaenderte Titel direkt im Store und in der Liste gespiegelt
  - uebernommene Level-1-Titel bleiben read-only und ohne operative Meta
- Geprueft mit `npm test`.
- Die Protokoll-Editbox speichert jetzt automatisch:
  - Kurztext, Langtext, Haken und Meta-Felder laufen ueber den bestehenden Save-Pfad
  - der sichtbare `Speichern`-Button ist aus der Workbench ausgeblendet
  - Debounce und Blur-Flush sind durch Tests abgesichert
  - geprueft mit `npm test`
- Naechster offener Schritt: manuelle Sichtpruefung der Auto-Save-UX im Protokollscreen auf dem Zielsystem.
- Die TOP-Liste im Protokollscreen ist optisch lesbarer geworden:
  - TOP-Nummern und Kurztext wirken jetzt gleich gross
  - Liste, normale TOPs und Level-1-Titel sind farblich/helligkeitstechnisch besser getrennt
  - die Metaspalte ist breiter und Datumswerte erscheinen im Format `tt.mm.jjjj`
  - geprueft mit `npm test`
- Naechster offener Schritt: manuelle Sichtpruefung der TOP-Liste im Protokollscreen auf dem Zielsystem.
- Der alte Legacy-Protokollscreen `src/renderer/views/TopsView.js` ist entfernt; aktive Protokoll-Verdrahtung laeuft nur noch ueber `src/renderer/modules/protokoll/screens/TopsScreen.js`.
- Der TopsScreen-Diktatpfad ist wieder stabil:
  - `SharedEditboxCore` baut die Mikrofon-Buttons jetzt defensiv ein und faengt fehlende Label-Hosts ab
  - der TopsScreen crasht beim Rendern der Editbox nicht mehr
  - der kaputte `notoSans.css`-Importpfad in den Tops-Styles wurde korrigiert
  - die Diktat-Buttons nutzen jetzt die vorhandenen SVG-Assets `dictation-start.svg` und `dictation-stop.svg`
  - die Buttons sitzen direkt in der Zeile von Kurztext/Langtext neben der Restzeichenanzeige
  - bei fehlender Freischaltung werden sie gar nicht angezeigt
- Im Protokoll-Kontext ist die fachlich falsche Header-Belegung bereinigt:
  - die sichtbare Protokoll-Quicklane zeigt jetzt einen TOP-Filter statt der alten falsch belegten Header-Aktionen
  - der Filter schaltet zwischen `Alle`, `ToDo` und `Beschluss`
  - Sidebar, Druck-v2/Druckflow, Mail, PDF und Lizenzlogik blieben dabei unangetastet
- Das Settings-Zielkonzept ist jetzt als eigene Doku festgehalten:
  - [docs/settings-structure.md](docs/settings-structure.md) beschreibt die Zielstruktur fuer Allgemein, Eingabe & Erfassung, Ausgabe & Kommunikation, Module und Entwicklung
  - die Seite dient als fachliche Leitplanke fuer spaetere kleine Settings-Pakete
- Die Settings-Startseite ist jetzt sichtbar in Hauptgruppen gegliedert:
  - Allgemein, Eingabe & Erfassung, Ausgabe & Kommunikation, Module und Entwicklung stehen als eigene Ueberschriften auf der Startseite
  - die vorhandenen Kacheln bleiben erreichbar und werden nur in diese grobe Struktur einsortiert
- Die Legacy-Kachel `Profil & Druck` ist auf der Startseite aufgeteilt:
  - sichtbare Einstiege sind jetzt `Profil / Adresse`, `Ausgabe & Druck` und `Protokoll`
  - die drei Einstiege nutzen jeweils eigene schlanke Dialoge
- Der Einstieg `Profil / Adresse` hat jetzt einen eigenen schlanken Dialog:
  - er enthaelt nur Profil- und Adressfelder
  - Ausgabe-/Protokollfelder bleiben im bestehenden Legacy-Pfad fuer die anderen Einstiege
- Der Einstieg `Ausgabe & Druck` hat jetzt ebenfalls einen eigenen Dialog:
  - er enthaelt Footer, Ausgabeordner, Drucklayout und den Einstieg zu den Drucklogos
  - Protokoll- und Profilfelder bleiben ausserhalb dieses Dialogs
  - der sichtbare Startseiten-Einstieg laeuft nicht mehr ueber den grossen Legacy-Dialog
- Der Einstieg `Protokoll` hat jetzt ebenfalls einen eigenen Dialog:
  - er enthaelt nur Protokollbezeichnung, Vorbemerkung und den Schalter fuer die Ausgabe
  - der sichtbare Startseiten-Einstieg nutzt nicht mehr den grossen Legacy-Dialog
- Der alte Sammeldialog aus `SettingsView.js` ist entfernt:
  - `_createLegacySettingsContent(...)` wurde geloescht
  - die sichtbaren Startseiten-Einstiege laufen nur noch ueber die drei schlanken Dialoge
- Der alte sichtbare Sammelbegriff `Profil & Druck` wird im Startseitenfluss nicht mehr verwendet.
- Die Settings-Startseite wurde optisch beruhigt:
  - Gruppen sind als klar getrennte Bereiche mit kurzen Untertiteln dargestellt
  - leere bzw. noch nicht belegte Bereiche sind kompakter formuliert
  - die Kacheln sind ruhiger und weniger tabellenartig gestaltet
- Der sichtbare Einstieg `Archiv` steht jetzt in `Ausgabe & Kommunikation` statt in `Entwicklung`.
- Der globale Header zeigt jetzt links `BBM <Version>` und darunter den aktiven Kontext als `aktiv: <Modul> | <Projektnummer> - <Kurzbezeichnung>`.
  Rechts steht ein ruhiger Kunden-/Lizenztext aus den vorhandenen App-Settings; der alte `bereit:`-Statusblock ist aus der sichtbaren Anzeige entfernt.
  Im Projektkontext steht dort jetzt nicht mehr `Projekt-Arbeitsbereich`, sondern das aktive Modul `Protokoll`.
- Die sichtbaren Footer-Texte im Bereich `Profil & Druck` sind sprachlich vereinfacht:
  - `Footer Ort`/`Footer Datum`/`Footer Name 1/2` wurden zu kurzen, klaren Labels
  - der Toggle heisst jetzt `Profil-/Adressdaten im Footer verwenden`
  - die Settings-Schluessel und die Speicherlogik bleiben unveraendert
- Die sichtbaren Texte im Bereich `Druckinhalt` sind sprachlich geschaerft:
  - der Hinweis nennt jetzt Protokoll und PDF-Ausgabe
  - die Textgrenzen heissen jetzt `Textgrenzen fÃ¼r TOPs`
  - Kurztext-/Langtext-Grenzen werden als Eingabelaengen fuer TOPs beschrieben
- Der Legacy-Pfad `PDF-Logo` ist im UI deaktiviert:
  - die sichtbare PDF-Logo-Bearbeitung erscheint nicht mehr in `Profil & Druck`
  - `pdf.userLogo*` wird in der Ausgabe nicht mehr gerendert
  - der aktive Drucklogos-Pfad bleibt unveraendert
- Der aktive Drucklogos-Dialog ist sprachlich geschaerft:
  - der Einstieg heisst jetzt `Drucklogos verwalten`
  - die Slot-Karten sprechen von `Drucklogo 1/2/3`
  - die Bedienung nennt `Logo verwenden`, `Position horizontal` und `Position vertikal`
- Die alte Sammelmaske aus `SettingsView.js` ist entfernt:
  - die sichtbaren Startseiten-Einstiege laufen nur noch ueber die drei schlanken Dialoge
  - Drucklogos bleiben ueber den bestehenden Unterdialog erreichbar
- Projekt-Einstellungen behandeln `pdf.footerUseUserData` nicht mehr als steuerbare Projektoption:
  - der Projektsettings-Dialog speichert dieses Feld nicht mehr
  - der Projektsettings-IPC filtert es aus Whitelist und Patch
  - Altwerte im Projektsettings-Speicher bleiben technisch unkritisch, werden aber nicht mehr als Projektoption verwendet
  - neue Tests sichern den Filter im Projektsettings-IPC und den bereinigten Projektformular-Flow ab
- Projektbasierte Protokoll-Einstiege werden jetzt nicht mehr stillschweigend mit `showTops(null, ...)` aufgelÃ¶st:
  - genau eine offene Besprechung oeffnet den TopsScreen
  - keine offene Besprechung oeffnet die Besprechungsuebersicht als Startview mit Neuanlage-Einstieg
  - mehrere offene Besprechungen gehen als Datenintegritaetsfehler in die Besprechungsuebersicht
  - `TopsScreen` wird nur noch mit echter `meetingId` geladen
- Schliessen/Zurueck im TopsScreen fuehrt bei vorhandenem Projektkontext jetzt in den Projekt-Arbeitsbereich zurueck; ohne Kontext bleibt der sichere Fallback auf `showProjects()`.
- Der Move-Mode markiert im Protokoll jetzt keine direkten Nachkommen des verschobenen TOPs mehr als Ziel; der bekannte Zyklus-Fehler aus dem Domain-Check wird damit schon in der UI vermieden.
- Die Move-Mode-Darstellung unterscheidet jetzt Schiebling, erlaubte Ziele und gesperrte Ziele visuell klar:
  - Schiebling: orange Rand
  - erlaubtes Ziel: gruen nur beim aktiven Hover/Fokus
  - gesperrtes Ziel und direkte Nachkommen: rot schraffiert und nicht klickbar
- Die rote Schraffur fuer gesperrte Move-Ziele wurde feiner und etwas dezenter gezogen, ohne den blocked-Zustand zu verlieren.
- Kurztext- und Langtext-Felder im TOP-Editor loesen jetzt beim Verlassen einen Save des aktuellen Drafts aus; die Auswahl bleibt erhalten und blaue TOPs bleiben editierbar.
- NÃ¤chster offener Schritt: fachliche Sichtpruefung der neuen Besprechungsuebersicht/Startview im Projektkontext.
- Der Projekt-Arbeitsbereich oeffnet `Protokoll` jetzt wieder mit einem echten offenen Meeting-Kontext, wenn eines im Projekt vorhanden ist; andernfalls faellt der Einstieg in die Besprechungsuebersicht zurueck statt in einen leeren Tops-Start.
- Meilenstein externe Lizenz-App-Vorbereitung ist umgesetzt:
  - BBM registriert keine `license-admin:*`-IPCs mehr und startet keine Generator-/Customer-Setup-Registrierung aus `registerLicenseIpc`.
  - Preload exportiert keine Generator-/license-admin-Methoden mehr; aktive Kundenfunktionen (Status/Import/Delete/Request) bleiben.
  - Renderer zeigt keine Lizenzverwaltung/Kundenverwaltung mehr im Adminbereich; Entwicklerbereich bleibt unverÃ¤ndert erreichbar.
  - Uebergangsbereich `tools/license-app/` wurde angelegt inkl. Zielarchitektur-README und Extrakten (`licenseAdminService`, `licenseRecords`, `licenseIpc.reference`).
- NÃ¤chster offener Schritt: Extrakte in `tools/license-app/` spÃ¤ter in eigenstÃ¤ndige externe Lizenz-App Ã¼berfÃ¼hren.
- Admin-Lizenzverwaltung kann die erzeugte Antwortlizenz jetzt direkt als Outlook-Entwurf vorbereiten:
  - Neuer Button `Antwortlizenz per Outlook senden` im Lizenzeditor.
  - Sichtbarkeit nur fuer Vollversion + vorhandenen `license_file_path` mit `.bbmlic`.
  - Main-IPC `license-admin:send-response-license-mail` prueft Kunden-E-Mail, Dateipfad, Dateiendung und Datei-Existenz.
  - Outlook-Entwurf wird unter Windows via PowerShell/COM erstellt (`Outlook.Application`, `CreateItem`, `Attachments.Add`, `Display()`), ohne automatisches Senden.
  - Erfolgs-/Fehlermeldungen sind umgesetzt: `Outlook-Mail wurde vorbereitet.`, `Keine Kunden-E-Mail hinterlegt.`, `Antwortlizenz-Datei wurde nicht gefunden.`, `Outlook konnte nicht geÃ¶ffnet werden.`.
  - Fallback im UI bei Outlook-Fehler: `Ausgabeordner Ã¶ffnen` und `Mailtext kopieren`.
- NÃ¤chster offener Schritt: manuelle Endpruefung am Windows-Zielsystem mit installiertem Outlook (Entwurf anzeigen inkl. Anhang, ohne Auto-Send).
- Admin-Lizenzverwaltung dokumentiert den Machine-Setup-Lebenszyklus jetzt direkt am Vollversions-Lizenzdatensatz:
  - `Machine-Setup erstellen` speichert vor dem Build zuerst einen Vollversionsdatensatz (`license_edition=full`, `license_binding=machine`, `license_mode=full`) im aktuellen Kundenkontext.
  - Wenn diese Vorab-Speicherung nicht moeglich ist, wird klar abgebrochen mit `Vollversion muss vor Machine-Setup gespeichert werden.`.
  - Nach erfolgreichem Machine-Setup-Build werden im Lizenzdatensatz gespeichert: `setup_type=machine`, `setup_status=waiting_for_machine_id`, `setup_file_path`, `setup_created_at`.
  - Nach Mailtext-Uebernahme wird `setup_status=machine_id_received` gespeichert.
  - Nach erfolgreicher Antwortlizenz-Erzeugung wird `setup_status=response_license_created` gespeichert; `license_file_path` bleibt wie bisher erhalten.
  - In UI/Lizenzliste und Lizenzeditor gibt es jetzt den sichtbaren `Machine-Binding-Status` mit den 4 Statusstufen.
- NÃ¤chster offener Schritt: manuelle Endpruefung des kompletten Ablaufes (Vollversion speichern -> Machine-Setup -> Mailtext -> Antwortlizenz) gegen eine reale lokale Mutter-Datenbank.
- Admin-Lizenzverwaltung kann Machine-ID direkt aus Kunden-E-Mailtext uebernehmen:
  - Neuer Vollversions-Button `Lizenzanforderung aus E-Mail Ã¼bernehmen` im Lizenzformular.
  - Eingabebereich `Mailtext einfÃ¼gen` parst robust die Zeilen `Kunde`, `Kundennummer`, `Lizenz-ID`, `Machine-ID`, `App-Version` (case-insensitive, tolerant bei Leerzeichen, CRLF/LF).
  - Bei Erfolg meldet die UI `Lizenzanforderung erkannt.` und `Machine-ID wurde Ã¼bernommen.` und uebernimmt die Machine-ID in das Formular.
  - Bei Abweichung von Kundennummer oder Lizenz-ID erscheint die Warnung `Achtung: Die Lizenzanforderung passt mÃ¶glicherweise nicht zur geÃ¶ffneten Lizenz.` ohne Blockierung.
  - Wenn keine Machine-ID enthalten ist, erscheint `Keine Machine-ID im Mailtext gefunden.`.
  - Bestehender Ablauf bleibt unveraendert: Lizenz erstellen -> `.bbmlic` erzeugen -> Antwortlizenz zurueck an den Kunden.
- NÃ¤chster offener Schritt: manuelle Sichtpruefung im Adminbereich mit echtem Mailtext-Paste aus einer Kundenanfrage.
- Alter Machine-Setup-Lizenz-Startblock wurde entfernt:
  - `src/renderer/main.js` enthaelt keine `isMachineSetupWithoutLicense`-, `renderMachineSetupLicenseRequired`-, `renderMachineSetupLicenseFallback`- oder `MACHINE_SETUP_LICENSE`-Logik mehr.
  - Der Core startet wieder normal; Lizenzstatus, Lizenzanforderung und Lizenzimport gehoeren nicht mehr in den App-Start.
  - Regressionen in `scripts/tests/licenseRequest.test.cjs` und `scripts/tests/projektverwaltungModule.test.cjs` sichern ab, dass der alte Startblock nicht zurueckkommt.
  - `npm test` ist gruen.
- Lizenzverwaltung Loeschfunktion fuer Lizenzdatensaetze ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenz lÃ¶schen`, sichtbar nur bei bestehender gespeicherter Lizenz.
  - Vor dem Loeschen erscheint die Sicherheitsabfrage mit Klartext, dass nur der Lizenzdatensatz in der Lizenzverwaltung entfernt wird.
  - Nach Bestaetigung wird nur `license_records` geloescht; danach Rueckkehr ins Kundendetail mit Meldung `Lizenz wurde gelÃ¶scht.`.
  - Bei Fehler erscheint `Lizenz konnte nicht gelÃ¶scht werden.`; bei Abbruch wird nichts geloescht.
  - Neuer Main-Service `deleteLicenseRecord(id)` + IPC `license-admin:delete-license-record` + Preload `licenseAdminDeleteLicenseRecord(id)` + Renderer-Service `deleteLicense(record)` sind verbunden.
  - Tests decken Main-Service-Loeschfall, fehlende ID, IPC-Registration/-Aufruf, Preload/API, Renderer-Service und UI-Texte ab; `npm test` bleibt gruen.
- PR #46 Bugfix (Testversion speichern ohne sichtbares Datumsfeld) ist umgesetzt:
  - Bei `Lizenztyp = Testversion` setzt `buildLicenseEditorPayload` `valid_from` jetzt automatisch auf das technische Ausstellungsdatum (`YYYY-MM-DD`), wenn das Feld leer ist.
  - `valid_until` bleibt bei Testversion leer; `trial_duration_days` bleibt der fachliche Laufzeitwert.
  - Dadurch tritt beim Speichern/Erstellen der Testlizenz kein `valid_from required` mehr auf, obwohl `gueltig von/bis` in der Test-UI weiterhin nicht als Nutzerpflicht gezeigt wird.
  - Der bestehende Testlaufzeit-Start bei erster Installation / erstem Start bleibt unveraendert.
- PR #46 Bugfix (Testversion ohne validUntil im gesamten Erzeugungsweg) ist umgesetzt:
  - Save-Payload erzwingt fuer Testversion intern `license_edition=test`, `license_binding=none`, `license_mode=soft`, `machine_id=""` und laesst `valid_until` leer.
  - Damit wird Testversion ohne `validUntil` durch Save -> Generator-Payload -> Main-IPC konsistent akzeptiert; Vollversion ohne `validUntil` bleibt weiterhin Fehlerfall.
- PR #46 Bugfix (Generator-Input fuer Testversion ohne validUntil-Feld) ist umgesetzt:
  - Main-IPC `license:generate` schreibt fuer Testversion `validUntil` nicht mehr in die Input-JSON an den Generator.
  - Die alte Hilfslogik zur Ableitung `validUntil` aus `validFrom + Dauer` wurde entfernt; kein Rueckfall auf das Altmodell.
- PR #46 Hinweis externer Generator ist dokumentiert:
  - Der produktive Generator liegt extern unter `C:\\license-tool\\generate-license.cjs` und hat keine gepflegte Repo-Quelle in diesem Projekt.
  - Falls der externe Generator weiter `validUntil` fuer Testversion erzwingt, liefert die App jetzt klar den Hinweis: `Externer Lizenzgenerator ist nicht kompatibel mit Testversion ohne validUntil.`
  - In diesem Fall muss `C:\\license-tool\\generate-license.cjs` manuell kompatibel angepasst werden (Testversion ohne `validUntil`, mit Pflicht `trialDurationDays`).
- Lizenzverwaltung Nachsteuerung fuer PR #46 ist umgesetzt:
  - Lizenzformular fuehrt jetzt zwei fachlich getrennte Wege ueber `Lizenztyp`: `Testversion` und `Vollversion`.
  - `Testversion` bleibt ohne Machine-ID, zeigt Testdauer, nutzt weiter `Lizenz erstellen` + `Kunden-Setup erstellen` mit eingebetteter fertiger `customer.bbmlic`.
  - `Vollversion` ist fest an Machine-Binding gekoppelt, blendet den freien Binding-Mix aus und fuehrt in den Schritten `Machine-Setup erstellen` -> `Lizenzanforderung importieren` -> `Antwortlizenz erstellen`.
  - `Machine-Setup erstellen` baut bewusst ohne eingebettete `customer.bbmlic`; die Antwortlizenz wird weiterhin erst nach Import der Machine-ID ueber `Lizenz erstellen` erzeugt.
  - Dist-/IPC-Flow wurde minimal erweitert, damit Kunden-Setups wahlweise mit (Testversion) oder ohne (Machine-Setup) eingebettete Lizenz gebaut werden koennen.
  - Testabdeckung wurde fuer UI-Trennung, Payload-/Setup-Typ und Build-Embedding (mit/ohne `customer.bbmlic`) erweitert; `npm test` bleibt Pflicht.
- Machine-Binding Schritt 3 (Antwortlizenz-UI-Fuehrung) ist umgesetzt:
  - Admin-Lizenzformular zeigt bei `GerÃ¤tebindung = An Machine-ID binden` den Hinweis `GerÃ¤tegebundene Vollversion` mit klarer Schrittfuehrung (Import Lizenzanforderung -> `Lizenz erstellen` -> Antwortlizenz).
  - Nach erfolgreichem `Lizenz erstellen` wird bei Vollversion + Machine-Binding + vorhandener Machine-ID zusaetzlich angezeigt: `Antwortlizenz wurde erstellt.` sowie `Diese .bbmlic-Datei an den Kunden zurÃ¼ckgeben.`.
  - Ausgabepfadanzeige und Button `Ausgabeordner Ã¶ffnen` bleiben unveraendert im bestehenden Generator-Hauptablauf.
  - Kunden-Lizenzstatusbereich ergaenzt den Hinweis `Antwortlizenz erhalten?` mit Verweis auf den bestehenden Lizenzimport; kein neuer Import-Mechanismus, keine neue Navigation.
  - Tests wurden auf die neuen UI-Texte erweitert; bestehende Flows (`licenseGenerate`, Lizenzimport) bleiben unveraendert und `npm test` bleibt Pflichtpruefung.
- Machine-Binding Schritt 2 (Admin-Import) ist umgesetzt:
  - Admin-Lizenzformular hat den Button `Lizenzanforderung importieren` (nur im Lizenzformular, keine Kundenliste/Projektbereich).
  - Neuer Main-IPC `license-admin:import-license-request` oeffnet Datei-Dialog, liest JSON, validiert (`schemaVersion`, `requestType`, `product`, `machineId`, `createdAt`, `appVersion`) und liefert strukturierte Request-Daten.
  - Preload stellt `window.bbmDb.licenseAdminImportLicenseRequest()` bereit.
  - Nach erfolgreichem Import werden im Formular `Machine-ID`, `GerÃ¤tebindung=machine` und `Lizenzart=full` gesetzt; es erfolgt **kein** automatisches Speichern.
  - UI zeigt klare Erfolg-/Fehlerhinweise inkl. Produktfehler, fehlender Machine-ID sowie optional `customerName`/`licenseId`.
  - Bestehender Generatorfluss bleibt bestehen und nutzt danach weiterhin den bestehenden Ablauf `Lizenz erstellen`.
  - Keine Aenderung an `licenseVerifier.js EXPECTED_PRODUCT`, keine Setup-/Mail-/Online-Aktivierungs-Erweiterung.
  - Testabdeckung fuer Import-IPC, Preload und UI-Texte wurde erweitert; `npm test` bleibt Pflichtpruefung.
- Neuer Machine-Binding-Baustein ist umgesetzt:
  - Kunden-App kann jetzt eine Lizenzanforderungsdatei `bbm-license-request.json` speichern (nur Anfrage, keine Lizenz-/Signatur-Erzeugung).
  - Main-IPC `license:create-request` baut ein strukturiertes Request-JSON mit `schemaVersion`, `requestType`, `product`, `appVersion`, `createdAt`, `machineId` sowie optional `customerName`/`licenseId`/`notes`.
  - Machine-ID wird weiter ueber die bestehende `deviceIdentity`-Funktion geholt; Produkt bleibt fest `bbm-protokoll`.
  - Save-Dialog nutzt jetzt den vorgeschlagenen Dateinamen `bbm-license-request.json`.
  - Lizenzstatus-UI zeigt den Einstieg `Lizenzanforderung` mit Button `Lizenzanforderung speichern` und klaren Erfolgs-/Fehlermeldungen.
  - Keine Admin-Import-/Antwortlizenz-/Mail-/Setup-Aenderungen und keine Aenderung an `EXPECTED_PRODUCT`.
  - Tests fuer Payload, IPC, Preload, UI-Texte und Abgrenzungen wurden ergaenzt; `npm test` ist gruen.
- Lizenzverwaltung PR #41 Nachbesserung (Testlizenz-Startzeitpunkt) ist umgesetzt:
  - Testlizenzen tragen jetzt `trialDurationDays` signiert im Generator-Payload; der Testzeitraum startet erst bei erster erfolgreicher Lizenzinstallation/-nutzung.
  - Laufzeitpruefung fuer Testlizenzen nutzt `trialStartedAt + trialDurationDays` statt `valid_from + Dauer`; Vollversion bleibt bei `validUntil`.
  - Admin-UI zeigt fuer Testlizenz den Bereich `Testzeitraum` (14/30/60/90/Individuell, 1..365) inkl. Hinweis auf Start bei erster Installation/erstem Start; `gueltig von/bis` wird fuer Test nicht mehr als fachlicher Start/Ende dargestellt.
  - Formularlayout im Lizenzeditor wurde auf klare Feld-zu-Beschriftung-Blocks umgebaut; bei Testlizenz ist `Machine-ID` ausgeblendet.
  - Alte Entwicklungs-Parallel-Logik fuer Nutzungstage (`trial.enabled`, `trial.daysLimit`, `trial.firstStartAt`, `enforceTrialLimit`) ist aus UI/Runtime entfernt.
  - Lizenz-Admin-Datenmodell wurde minimal um `trial_duration_days` erweitert; Kunden-Setup-Fluss blieb unveraendert.
  - Testabdeckung erweitert (Generator-/Verifier-/Storage-/UI/IPC-Faelle); `npm test` ist gruen.
- Die Projektverwaltung ist als Renderer-Modul abgeschlossen.
- Ausgabe / Drucken / E-Mail ist als Renderer-Modul aufgestellt.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Drucktechnik bleibt im Main-Prozess.
- Audio / Diktat ist als Renderer-Modul begonnen.
  - `Dictate` ist das zugehoerige Lizenz-/Produktfeature; das sichtbare Feature `audio` wird fachlich als `Dictate` gefuehrt.
  - `Diktieren` ist der Entwicklungs-/Technikbereich unter `Einstellungen -> Entwicklung`.
  - `Diktierprodukt` ist die austauschbare fachliche Einheit unter `Diktieren`.
  - `Whisper` ist aktuell nur die technische Engine unter dem `Diktierprodukt`.
  - `Woerterbuch` ist ein vorbereiteter Baustein innerhalb von `Diktieren`.
  - `TranscriptionService` ist als Renderer-Adapter verankert.
  - Entwicklungs-UI fuer `Einstellungen -> Entwicklung -> Diktieren` ist als Modul-Baustein angebunden.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverÃ¤ndert.
- Im Bereich `Lizenz / bearbeiten` wird das Feature `audio` sichtbar als `Dictate` angezeigt.
  - `Audio / Diktat` bleibt Maschinenraum und ist kein auswÃ¤hlbares Projektmodul.
  - Der interne Key bleibt `audio`.
  - Die sichtbare Feature-Liste zeigt kein `audio` und `Dictate` nebeneinander.
- Im Bereich `Lizenz / bearbeiten` ist `Produktumfang` jetzt sichtbar gegliedert:
  - `Standardumfang` (app, pdf, export) ist immer enthalten und nicht abwaehlbar.
  - `Zusatzfunktionen` (mail, Dictate) bleiben auswaehlbar.
  - `Module` (Protokoll, Dummy) sind als vorbereitet markiert und noch nicht aktiv angebunden.
- Lizenzverwaltung ist als eigenes Zielmodul geplant; die Detailbeschreibung liegt unter `docs/modules/lizenzverwaltung.md`.
  - Dort ist jetzt auch der geplante Machine-Binding-Ablauf fuer Vollversionen mit Machine-ID verbindlich beschrieben.
  - Lizenzart (`Testlizenz` / `Vollversion`) und GerÃ¤tebindung (`Ohne GerÃ¤tebindung` / `An Machine-ID gebunden`) sind dort fachlich getrennt festgehalten.
- Lizenzverwaltung Paket 1 ist vorbereitet:
  - neues Modulverzeichnis `src/renderer/modules/lizenzverwaltung/` mit Skeleton-Screen
  - Einstieg `Adminbereich` als eigene Kachel auf oberster Ebene in `Einstellungen` angebunden
  - `Adminbereich` oeffnet als eigenes Popup mit Kachel `Lizenzverwaltung`
  - weiterhin kein Modulkatalog-/Projektmodul-Eintrag
- Lizenzverwaltung Paket 4 ist umgesetzt:
  - die bisherige UI `Lizenz verlaengern / bearbeiten` wurde aus `SettingsView` in das Modul `src/renderer/modules/lizenzverwaltung/` verschoben
  - `LicenseAdminScreen` enthaelt jetzt den Einstieg `Lizenz erstellen / bearbeiten`
  - der Einstieg oeffnet die verschobene UI im Adminbereich
  - `SettingsView` bleibt Host/Einstieg und zeigt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten`

- Lizenzverwaltung Paket 4 (Datensatz-Vorbereitung) ist umgesetzt:
  - zentrale Datei `licenseRecords.js` fuer Kunden- und Lizenzdatensatz vorbereitet
  - Feldlisten, Default-Strukturen und Normalisierungsfunktionen fuer Kunde/Lizenz vorhanden
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` mit aussagekraeftigeren vorbereiteten Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI und Produktumfangsstruktur bleiben unveraendert nutzbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Kunden` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Kundenmaske
  - Kundenmaske nutzt `CUSTOMER_RECORD_FIELDS` und bietet die Felder Kundennummer, Firma/Kundenname, Ansprechpartner, E-Mail, Telefon, Notizen
  - Kundenmaske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Lizenzen` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Lizenzen-Maske
  - Lizenzen-Maske nutzt `LICENSE_RECORD_FIELDS` und `LICENSE_MODES` und bietet die Felder Lizenz-ID, Kunde, Produktumfang, gueltig von, gueltig bis, Lizenzmodus, Machine-ID, Notizen
  - Lizenzen-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Produktumfang` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Produktumfang-Maske
  - Produktumfang-Maske nutzt `PRODUCT_SCOPE` und zeigt `Standardumfang` (app, pdf, export), `Zusatzfunktionen` (mail, Dictate) und `Module` (Protokoll, Dummy)
  - `Standardumfang` bleibt sichtbar und nicht abwaehlbar; `Zusatzfunktionen` sind auswÃ¤hlbar; `Module` bleiben vorbereitet und noch nicht aktiv angebunden
  - Produktumfang-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal auf app/pdf/export ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Produktumfang-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Historie` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Historie-Maske
  - Historie-Maske nutzt `LICENSE_HISTORY_FIELDS` und zeigt `erzeugt am`, `Lizenz-ID`, `Kunde`, `Produktumfang`, `gueltig bis`, `Datei / Ausgabeort`, `Notizen`
  - Historie-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Historie-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - zentrale Storage-Service-Schnittstelle `licenseStorageService.js` im Modul angelegt (In-Memory-Stub, async, ohne DB/IPC/Persistenz)
  - Service nutzt `normalizeCustomerRecord`, `normalizeLicenseRecord` und `normalizeLicenseHistoryRecord` aus `licenseRecords.js`
  - Export im Modul-Index ergaenzt; Tests decken Export, initiale Listen, Speichern mit Normalisierung und Promise-Kompatibilitaet ab
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - vorbereitete Masken `Kunden`, `Lizenzen` und `Historie` enthalten zusaetzlich den Button `Merken`
  - `Merken` validiert lokal und ruft danach den In-Memory-Storage-Service auf (`saveCustomer`, `saveLicense`, `addHistoryEntry`)
  - Erfolgsmeldung in allen drei Masken: nur temporaer/In-Memory gemerkt, keine dauerhafte Speicherung
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kunden-, Lizenzen- und Historie-Maske zeigen unterhalb der Buttons einfache In-Memory-Listenansichten
  - Listen werden ueber `listCustomers`, `listLicenses` und `listHistory` geladen
  - Nach erfolgreichem `Merken` wird die jeweilige Liste sofort aktualisiert (ohne Persistenz, nur im laufenden App-Prozess)
  - Leerer Zustand ist in allen drei Masken sichtbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - DB-Schema/Migration in `src/main/db/database.js` um getrennte Admin-Tabellen `license_customers`, `license_records`, `license_history` erweitert (nicht-destruktiv, ohne UI-/IPC-Umstellung)
  - `licenseStorageService` bleibt bewusst In-Memory; keine Lizenzdatei-Logik und kein Projektmodul-Verhalten geÃ¤ndert
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Main-Process-Service `src/main/licensing/licenseAdminService.js` fuer Admin-Lizenzdaten vorbereitet (list/save fuer Kunden und Lizenzen, Historien-Read/Write)
  - noch keine IPC-/Preload-Anbindung; Renderer-Storage bleibt In-Memory
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - IPC-/Preload-Schnitt fuer Admin-Lizenzdaten ist vorbereitet (`license-admin:*` + `licenseAdmin*` im Preload)
  - Renderer-`licenseStorageService` nutzt jetzt die Preload-/IPC-Schnitt (`window.bbmDb.licenseAdmin*`) statt In-Memory
  - Kunden, Lizenzen und Historie werden dadurch dauerhaft in `app.db` gespeichert; UI blieb minimal angepasst
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Lizenzen-Maske laedt gespeicherte Kunden per `listCustomers()` als Auswahlfeld und speichert Lizenzen mit `customer_id/customerId`-Verknuepfung.
  - Gespeicherte Lizenzen zeigen Kundennummer/Firma lesbar an; ohne vorhandene Kunden blockiert die Maske das erfolgreiche Speichern mit Hinweis.
  - Leere Lizenz-ID wird in der Lizenzen-Maske beim Pruefen/Merken automatisch als lesbare `LIC-YYYYMMDD-HHMMSS`-ID erzeugt.
  - Die erzeugte Lizenz-ID wird sichtbar ins Feld uebernommen; manuelle IDs bleiben weiterhin bearbeitbar.

- Lizenzverwaltung Neuversuch (In-Memory-Listenansichten) ist nachgezogen:
  - Testnachweise in `scripts/tests/lizenzverwaltungModule.test.cjs` fuer Kunden/Lizenzen/Historie um Listenfelder und Refresh nach `Merken` ergaenzt
  - Leerer Zustand und Adminbereich-Abgrenzung bleiben weiterhin abgesichert
- Lizenzverwaltung Meilenstein kundenbezogen ist umgesetzt:
  - Startansicht der Lizenzverwaltung ist jetzt die Kundenliste mit Kundennummer, Firma/Kundenname, Ansprechpartner und E-Mail.
  - Kundendetail fuehrt kundenbezogen zu den Lizenzen dieses Kunden, inkl. `Neue Lizenz`, `Kunde speichern`, `Zurueck zur Kundenliste`.
  - Lizenzanlage/-bearbeitung laeuft nur aus geoeffnetem Kundenkontext, zeigt den Kunden sichtbar und hat `Zurueck zum Kunden`.
  - Main-Service ergaenzt `listLicensesByCustomer(customer_id)` sowie Pflichtfeld-Checks inkl. automatischer Lizenz-ID `LIC-YYYYMMDD-HHMMSS`.
  - DB-Schema-Absicherung fuer bestehende `license_records` wurde nicht-destruktiv um fehlende Spalten-Ergaenzung erweitert.
  - Renderer-/IPC-/Preload-Datenfluss ist kundenbezogen erweitert (`license-admin:list-records-by-customer`).
  - Verhaltenstests decken Kunde speichern/listen, kundenbezogenes Lizenzspeichern/listen, Pflichtfelder und Kundenkontextlogik ab.
- Lizenzverwaltung UI-Aufraeumen (kundenbezogen) ist umgesetzt:
  - Kundenansicht zeigt jetzt `Lizenzverwaltung` + Bereich `Kunden` mit klarer Tabelle und Buttons `Neuer Kunde` / `Zurueck zum Adminbereich`.
  - Kundendetail ist als ausgerichtetes Formular umgesetzt, inkl. klarer Button-Fuehrung und sichtbarem Hinweisbereich.
  - Lizenzliste je Kunde ist als Tabelle mit Spalten fuer Lizenz-ID, Produktumfang, gueltig von/bis und Lizenzmodus dargestellt.
  - Produktumfang in der Liste zeigt kein rohes JSON mehr bei parsebaren Objekten; `{ raw: ... }` wird als Klartext, leere Arrays als `-`, gefuellte Bereiche als Kurzformat angezeigt.
  - Lizenzformular zeigt `Neue Lizenz fuer: ...`, Produktumfang als mehrzeiliges Feld, Lizenzmodus als Auswahl (`soft`/`full`) und den neuen Button `Lizenz-ID erzeugen`.
  - `Lizenz-ID erzeugen` schreibt nur bei leerem Feld sofort eine `LIC-YYYYMMDD-HHMMSS`-ID ins Feld; gesetzte IDs werden nicht ueberschrieben.
  - Bestehende Speicherlogik (Auto-ID beim Speichern, Kundenkontext-Pflicht, DB-/IPC-Fluss) bleibt unveraendert.
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenzdatei erzeugen`.
  - Erzeugung ist ohne gespeicherte Lizenz blockiert (`Bitte zuerst die Lizenz speichern.`).
  - Gespeicherte Lizenz + aktueller Kunde werden auf bestehendes `window.bbmDb.licenseGenerate(...)` gemappt.
  - Generator-Produkt bleibt technisch `bbm-protokoll` (UI bleibt `BBM-Produktiv`).
  - `license_mode` wird kompatibel gemappt (`soft -> none`, `full -> machine`, `none/machine` bleiben erhalten).
  - Features werden aus `product_scope_json` fuer Generator aufgebaut (inkl. `audio`-Kompatibilitaet als `dictate`).
  - Ohne ableitbare Features wird Erzeugung blockiert (`Produktumfang enthÃ¤lt keine erzeugbaren Features.`).
  - Bei Erfolg wird der Ausgabepfad angezeigt und `Ausgabeordner Ã¶ffnen` nutzt bestehendes `window.bbmDb.licenseOpenOutputDir(...)`.
  - Bestehende Main-IPC-Infrastruktur (`license:generate`, `license:open-output-dir`) wurde weiterverwendet, keine neue Generator-Architektur.
- Lizenzverwaltung Nachbesserung ist umgesetzt:
  - Lizenzformular trennt jetzt fachlich `Lizenzart` (Testlizenz/Vollversion) und `GerÃ¤tebindung` (none/machine); `Lizenzmodus` ist nicht mehr das fÃ¼hrende Bedienfeld.
  - Datumsfelder im Admin-Lizenzformular laufen als Date-Inputs; Generator-Payload normalisiert zusaetzlich ISO- und deutsche Eingaben (`TT.MM.JJJJ` -> `JJJJ-MM-TT`), um `VALID_FROM_REQUIRED` zu vermeiden.
  - Bei `GerÃ¤tebindung = machine` wird `Machine-ID` vor `licenseGenerate` verpflichtend geprÃ¼ft; bei `none` bleibt Machine-ID optional und wird nicht Ã¼bergeben.
  - KompatibilitÃ¤t fuer Altwerte in `license_mode` bleibt erhalten (`soft/full/none/machine` -> sinnvolle Edition/Binding-Ableitung), neue Felder `license_edition`/`license_binding` haben Vorrang.
  - DB-Schema `license_records` wurde nicht-destruktiv um optionale Spalten `license_edition` und `license_binding` ergÃ¤nzt.
  - Main-Service und Renderer-Normalisierung akzeptieren/liefern snake_case + camelCase fÃ¼r Edition/Binding.
- Lizenzverwaltung UI-Nachbesserung ist umgesetzt:
  - Nach `Kunde speichern` ist `Neue Lizenz` sofort aktiv; kein Zurueck-/Neuoeffnen noetig.
  - Im Lizenzformular wurden Buttontexte vereinheitlicht: `Lizenz speichern`, `Formular leeren`, `Zurueck`.
  - Kundendetail ist klarer getrennt in `Kundendaten` und `Lizenzen dieses Kunden`.
  - Die Lizenzliste je Kunde ist als saubere Tabelle mit Spalten fuer Lizenz-ID, Lizenzart, GerÃ¤tebindung, Produktumfang, gueltig von/bis und Aktion aufgebaut.
  - Bearbeiten erfolgt ueber sichtbaren Button `Ã–ffnen` in der Aktion-Spalte statt ueber unsichtbaren Zeilenklick.
- Lizenzverwaltung Abschluss fuer PR #39 ist umgesetzt:
  - Im Lizenzformular gibt es jetzt den kombinierten Hauptbutton `Lizenz erstellen`.
  - Der Ablauf dahinter ist: Admin-Lizenz speichern -> vorhandenen Generator aufrufen -> Ausgabepfad anzeigen -> Ausgabeordner Ã¶ffnen.
  - Es gibt keinen separaten Bedienpfad mehr mit erst `Lizenz speichern` und danach `Lizenzdatei erzeugen`.
- Lizenzverwaltung finale UI-Vereinfachung ist umgesetzt:
  - Im sichtbaren Lizenzformular wurden restliche Einzelbuttons entfernt (`Lizenz-ID erzeugen`, `Formular leeren`).
  - Lizenz-ID bleibt sichtbar, wird aber beim Hauptablauf `Lizenz erstellen` automatisch erzeugt, wenn leer.
  - Sichtbarer Hauptablauf im Formular ist jetzt auf `Lizenz erstellen` + `Zurueck` reduziert; `Ausgabeordner Ã¶ffnen` erscheint nur nach erfolgreicher Erzeugung.
- Lizenzverwaltung naechster Schritt (Kunden-Setup) ist umgesetzt:
  - Nach erfolgreicher Lizenzerzeugung wird der Lizenzpfad im Lizenzdatensatz gespeichert (`license_file_path`, `license_file_created_at`).
  - Im Lizenzformular ist `Kunden-Setup erstellen` verfuegbar; ohne bekannte erzeugte Lizenzdatei erscheint `Bitte zuerst die Lizenz erstellen.`.
  - Kunden-Setup-Build nutzt bestehende `scripts/dist.cjs`/electron-builder-Infrastruktur im optionalen Kundenmodus (kein neuer Installer-Generator).
  - Kundenmodus uebergibt `.bbmlic` als `extraResource` nach `license/customer.bbmlic`, baut nach `dist/customers/<slug>/` und setzt kundenbezogenen Setup-Dateinamen.
  - Main-/Preload-IPC fuer Build-Aufruf ist angebunden (`license-admin:create-customer-setup` / `licenseAdminCreateCustomerSetup`).
  - Lizenz-Bootstrap liest bei fehlender `userData/license.json` eine gebuendelte `resources/license/customer.bbmlic` und uebernimmt sie als installierte Lizenz; bestehende `userData/license.json` bleibt vorrangig.
  - `licenseVerifier.js` Produktpruefung bleibt unveraendert.
- Lizenzverwaltung Kunden-Setup-Nachbesserung ist umgesetzt:
  - Erfolgsmeldung fuer `Kunden-Setup wurde erstellt.` wird nur noch gesetzt, wenn ein echtes Setup-Artefakt im Kunden-Ausgabeordner gefunden wurde.
  - Fehlt Kunden-Ausgabeordner oder Setup-`.exe`, liefert der Main-Flow `CUSTOMER_SETUP_ARTIFACT_NOT_FOUND` statt false-positive Erfolg.
  - Build-Diagnose wird mitgegeben (`repoRoot`, `outputDir`, `customerSlug`, `licenseFilePath`, `exitCode`, `stdout`, `stderr`) und im UI bei Fehlern sichtbar gemacht.
- Lizenzverwaltung Kunden-Setup-Stabilisierung ist umgesetzt:
  - Build startet nicht mehr blind mit `process.execPath`, sondern ueber aufgeloeste Node-Laufzeit (`npm_node_execpath` -> `NODE_EXE` -> `node`).
  - Kunden-Setup-Build hat Timeout-Schutz; bei HÃ¤nger wird mit `CUSTOMER_SETUP_BUILD_TIMEOUT` sauber beendet.
  - Spawn-Fehler liefern `CUSTOMER_SETUP_BUILD_FAILED`; der IPC antwortet damit immer mit einem Abschlussstatus statt offenem HÃ¤nger.
  - Pro Buildlauf wird eine Logdatei unter `dist/customers/<slug>/customer-setup-build.log` geschrieben (inkl. Node-Befehl, Env, stdout/stderr, Exitcode, Artefakte).
  - Kundenmodus-Builderkonfiguration deaktiviert native Rebuilds (`npmRebuild: false`, `buildDependenciesFromSource: false`), um `better-sqlite3`-Locking in der laufenden App zu vermeiden.
- Protokoll-Modul ist eingefroren.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).
- Repo ist auf GitHub aktualisiert.
- `AGENTS.md` und `PLAN.md` sind vorhanden.
- Codex Cloud ist eingerichtet und kann das Repo lesen.
- Das Mutter-/Kind-Prinzip ist als verbindliche Leitlinie fuer die gesamte App festgehalten.
- Der erste CSS-Schritt im Modul `Protokoll` wurde umgesetzt.
- Der Speichern-/LÃ¶schen-Vertrag im Tops-Bereich wurde zwischen Verhalten und Tests synchronisiert.

## Architektur-Flag
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spaetere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fuer andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswÃ¤hlbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswÃ¤hlbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spaeter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext und oeffnet den Projekt-Arbeitsbereich.
- Ein Projektklick startet nicht direkt `Protokoll`.
- Im Projekt-Arbeitsbereich werden nur auswÃ¤hlbare Projektmodule angeboten.
- Das Protokoll-Modul ist aktuell eingefroren.
- Keine weitere Mini-Modularisierung ohne ausdruecklichen Auftrag.
- `TopsHeader` und `TopsList` wurden heimgeholt.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen.
- Weitere Ã„nderungen nur bei echtem Fehler oder konkretem Featurebedarf.

## Projektverwaltung
- Der erste Modul-Meilenstein ist abgeschlossen.
- Die Projektverwaltung ist als Renderer-Modul unter `src/renderer/modules/projektverwaltung` aufgestellt.
- Der bestehende Sidebar-Einstieg `Projekte` bleibt der einzige sichtbare Einstieg.
- Es gibt keinen zusÃ¤tzlichen Sidebar-Button `Projektverwaltung`.
- Der Router nutzt den Modulpfad.
- Die alten View-Dateien bleiben als Compatibility-Re-Exports bestehen.
- Keine DB-/IPC-Logik wurde verschoben.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).

## Ausgabe
- Das Renderer-Modul ist aufgestellt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Drucktechnik bleibt im Main-Prozess.

## Audio
- Das Renderer-Modul ist begonnen.
- `TranscriptionService` ist als Renderer-Adapter im Modul verankert.
- Die Entwicklungs-UI fuer den Bereich `Diktieren` wurde in das Audio-Modul ausgegliedert und in Settings eingehaengt.
- Die Whisper-Modellstrategie ist jetzt auf `small`/`balanced` als Default ausgerichtet:
  - DEV bleibt bei `fast`/`balanced`/`best`/`large`
  - produktive Builds packen nur noch `ggml-small.bin`
  - der Main-Service faellt bei fehlendem Wunschmodell auf `ggml-small.bin` zurueck, wenn es vorhanden ist
  - der Nutzer-Modellordner `userData/audio/models` wird im Whisper-Engine-Pfad mitberuecksichtigt
- Die Audio-Tests wurden um Default-, Fallback-, User-Model- und Packaging-Pruefungen erweitert.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverÃ¤ndert.

---

## Erledigte Meilensteine / Pakete

### Erledigt
#### Paket: PR #39 final - sichtbare Einzelbuttons im Lizenzformular entfernt
- Status: erledigt
- Beschreibung:
  - Entfernt: `Lizenz-ID erzeugen` (Button) und `Formular leeren` (Button) aus dem sichtbaren Lizenzformular.
  - Hinweistext bei Lizenz-ID auf automatischen Erstell-Ablauf angepasst.
  - Tests auf reduzierte sichtbare Bedienung aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Persistenz-/Sidebar-/Projektmodul-Aenderung

#### Paket: PR #39 Abschluss - kombinierter Button `Lizenz erstellen`
- Status: erledigt
- Beschreibung:
  - Lizenzformular auf einen klaren Hauptablauf mit einem Button `Lizenz erstellen` umgestellt.
  - Klick speichert zuerst den Lizenzdatensatz und erzeugt danach direkt die `.bbmlic` Ã¼ber die bestehende Generator-Infrastruktur.
  - Ausgabepfad bleibt sichtbar; `Ausgabeordner Ã¶ffnen` bleibt verfÃ¼gbar.
  - Tests auf neue UI-Begriffe/Bedienlogik aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein neuer Generator-IPC, keine Setup-/Sidebar-/Projektmodul-/Persistenzarchitektur-Aenderung

#### Paket: PR #39 UI-Feinschliff Kundendetail/Lizenzformular
- Status: erledigt
- Beschreibung:
  - Kundendetail-Screen so angepasst, dass `Neue Lizenz` nach erfolgreichem Kundenspeichern sofort nutzbar bleibt.
  - Lizenzformular-Buttons sprachlich auf klare Begriffe umgestellt (`Lizenz speichern`, `Formular leeren`, `Zurueck`).
  - Lizenzliste je Kunde optisch/strukturell bereinigt (eigene Aktion-Spalte mit `Ã–ffnen`; kein gesamter Zeilenklick).
  - Tests auf neue Begriffe/Struktur und Direktnutzbarkeit nach Kundenspeichern erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Sidebar-/Projektmodul-Aenderung in diesem UI-Nachschritt

#### Paket: PR #39 Nachbesserung - Lizenzart/Geraetebindung getrennt und Datumsnormalisierung
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` trennt nun `Lizenzart` und `GerÃ¤tebindung` im Formular, inklusive Machine-ID-Enable/Disable je Binding.
  - Generator-Payload nutzt jetzt Edition/Binding aus neuen Feldern (mit Legacy-Fallback), normalisiert Datumswerte und validiert Machine-ID/Data vor dem IPC-Aufruf.
  - DB-Schema und Main-Service wurden fuer optionale Felder `license_edition`/`license_binding` erweitert (nicht-destruktiv, keine neue Tabelle).
  - Normalisierer/Tests wurden auf KompatibilitÃ¤t von legacy `license_mode` + neue Felder angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/main/licensing/licenseAdminService.js`
  - `src/main/db/database.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Generator-IPC, keine Setup-/App-Sperrlogik-Aenderung, keine Sidebar-/Projektmodul-Aenderung

#### Paket: Admin-Lizenzformular an bestehende Lizenzdatei-Erzeugung angebunden
- Status: erledigt
- Beschreibung:
  - Lizenzformular in `LicenseAdminScreen` um `Lizenzdatei erzeugen` erweitert; Erzeugung nur fuer gespeicherte Lizenzen.
  - Neue Mapping-Helfer bauen Generator-Payload aus Kunde+Lizenz (customerName, licenseId, product `bbm-protokoll`, edition, binding, validFrom/validUntil, maxDevices, machineId, features).
  - Features-Mapping aus `product_scope_json` deckt Standardumfang, Zusatzfunktionen und Module ab; `audio` bleibt kompatibel als `dictate`.
  - UI zeigt Statusmeldungen fuer laufende Erzeugung, Erfolg/Fehler, Ausgabepfad und optional `Ausgabeordner Ã¶ffnen`.
  - Tests fuer Payload-Mapping, Binding-/Produkt-Mapping, Feature-Mapping und Feature-Leerfall wurden in `licenseAdminDataflow.test.cjs` erweitert.
  - Strukturtests wurden um Nachweise fuer Button, Blockiermeldungen und bestehende IPC-Infrastruktur erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Setup-Aenderung, keine Sidebar-/Projektmodul-Aenderung, keine App-Sperrlogik-Aenderung

#### Paket: Gefuehrter Lizenzumfang-Editor in der Admin-Lizenzverwaltung
- Status: erledigt
- Beschreibung:
  - Im Lizenzformular (`Neue Lizenz / Lizenz bearbeiten`) wurde ein gefuehrter Editor fuer `Produkt`, `Standardumfang`, `Zusatzfunktionen` und `Module` eingebaut.
  - UI-Nachforderung umgesetzt: `Produkt` steht separat oben; `Standardumfang`, `Zusatzfunktionen` und `Module` werden als drei klar getrennte Karten in einer responsiven 3-Spalten-Zeile dargestellt.
  - Fehlerkorrektur: `Neu / leeren` setzt den Scope-Zustand jetzt konsistent zurueck (Standardumfang aktiv, Zusatzfunktionen/Module leer) und erzeugt `product_scope_json` sofort neu aus dem sichtbaren Modell.
  - `product_scope_json` wird weiterhin ueber die bestehende Save-Logik gespeichert, jetzt aber strukturiert mit `product`, `standardumfang`, `zusatzfunktionen` und `module`.
  - Bestehende Altwerte bleiben kompatibel: `{ raw: ... }`, Freitext, leere Arrays und vorhandene Strukturwerte werden weiterhin gelesen/angezeigt.
  - Die Liste `Lizenzen dieses Kunden` zeigt den Produktumfang jetzt lesbar (inkl. `Dictate` statt `audio`).
  - Tests fuer lesbare Ausgabe und `Dictate`-Darstellung wurden in `licenseAdminDataflow.test.cjs` erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine IPC-Erweiterung

#### Paket: Zeitzonenstabiler Test fuer erzeugte Lizenz-ID
- Status: erledigt
- Beschreibung:
  - Zeitzonenabhaengiger Testfall in `scripts/tests/licenseAdminDataflow.test.cjs` stabilisiert
  - UTC-String-Zeitpunkt (`new Date("2026-04-26T13:14:15Z")`) durch lokale Datumskonstruktion ersetzt
  - Erwartete Lizenz-ID `LIC-20260426-131415` bleibt unveraendert
- Betroffene Dateien:
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, DB, UI oder Lizenzdatei-Erzeugung

#### Paket: UI-Aufraeumen Admin-Lizenzverwaltung (kundenbezogen)
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` optisch/bedienbar aufgeraeumt (Kundenliste, Kundendetail, Lizenztabelle, Lizenzformular).
  - Produktumfangsausgabe in der Kunden-Lizenzliste lesbar gemacht (`raw`-Text, Kurzformat, `-` bei leeren Arrays).
  - Lizenzformular um Button `Lizenz-ID erzeugen` erweitert, ohne bestehende Auto-ID-Sicherheitslogik beim Speichern zu aendern.
  - Tests in `scripts/tests/licenseAdminDataflow.test.cjs` und `scripts/tests/lizenzverwaltungModule.test.cjs` entsprechend erweitert/angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine Aenderung am Projektmodul/Sidebar

#### Paket: CSS-Altpfad im Modul Protokoll abbauen
- Status: erledigt
- Beschreibung:
  - modul-lokale CSS-Datei fÃ¼r Protokoll angelegt
  - CSS-Verweis in `src/renderer/modules/protokoll/styles.js` angepasst
  - alte CSS-Datei blieb bestehen
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/styles.js`
  - `src/renderer/modules/protokoll/styles/tops.css`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Commit enthÃ¤lt zusÃ¤tzlich das Entfernen von ChatGPT-Export-Artefakten

#### Paket: Speichern-/LÃ¶schen-Vertrag im Tops-Bereich stabilisieren
- Status: erledigt
- Beschreibung:
  - `topsCommands`-Testvertrag an den realen Reload-Ablauf nach `saveDraft` und `deleteSelectedTop` angepasst
  - Reload nach Speichern/LÃ¶schen im Test explizit abgedeckt (inkl. Erhalt/Entfernung der Selektion im Ablauf)
- Betroffene Dateien:
  - `scripts/tests/topsCommands.test.cjs`
  - `STATUS.md`
- Commit:
  - `50cdbc3`
- Hinweise:
  - Keine Ã„nderungen an Router, UI oder fachlicher Tops-Logik

---


#### Paket: Einstellungen/Entwicklung strukturiert auf Diktieren umgestellt
- Status: erledigt
- Beschreibung:
  - Entwicklungsbereich um den neuen Tab `Diktieren` erweitert
  - `Diktierprodukt` als fachliche Klammer eingefuehrt und `Aktuelle Engine: Whisper` sichtbar gemacht
  - bestehende Whisper-Modellauswahl unveraendert unter `Diktierprodukt` einsortiert
  - vorbereiteter Abschnitt `Woerterbuch` als `noch nicht eingerichtet` gekennzeichnet
  - Diktieren-UI nach `src/renderer/modules/audio/ui/createDictationDevSection.js` ausgelagert
  - Audio-Modultest um den neuen UI-Baustein erweitert
- Betroffene Dateien:
  - `src/renderer/modules/audio/ui/createDictationDevSection.js`
  - `src/renderer/modules/audio/index.js`
  - `src/renderer/modules/audio/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-, Sidebar-, Projektmodul- oder TranscriptionService-Aenderung

#### Paket: Lizenz-Featurelabel `audio` als `Dictate` anzeigen
- Status: erledigt
- Beschreibung:
  - sichtbares Feature-Label `audio` im Bereich `Lizenz / bearbeiten` auf `Dictate` umgestellt
  - interner Feature-Key `audio` unverÃ¤ndert gelassen
  - Ergebnisanzeige der erzeugten Lizenz zeigt den sichtbaren Feature-Namen ebenfalls als `Dictate`
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Ã„nderungen an Settings-/Diktieren-Tab, Sidebar, Projektmodul oder Whisper-Logik

#### Paket: ProjectWorkspaceScreen minimal stabilisiert
- Status: erledigt
- Beschreibung:
  - robuste Anzeige fuer Projektnummer und Projektname im Projekt-Arbeitsbereich nachgezogen
  - Nachladen ohne direkt uebergebenes Projekt bleibt ueber `window.bbmDb.projectsList()` erhalten
  - klare Meldung fuer nicht gefundenes Projekt und Ruecksprung-Button `Zur Projektliste` ueber `showProjects()` ergaenzt
  - Projektauswahl bleibt auf `Protokoll` begrenzt; Maschinenraumdienste weiterhin unsichtbar
  - passende Modul-Tests fuer robuste Anzeige, Ruecksprung und Projektlade-Faelle erweitert
- Betroffene Dateien:
  - `src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-Aenderungen, keine Protokoll-Aenderungen

#### Paket: Lizenzverwaltung Paket 1 (Adminbereich + Modul-Skeleton)
- Status: erledigt
- Beschreibung:
  - neues Admin-Modul `src/renderer/modules/lizenzverwaltung/` mit `index.js`, `README.md`, `screens/index.js` und `screens/LicenseAdminScreen.js` angelegt
  - Skeleton-Screen mit Platzhaltern `Kunden`, `Lizenzen`, `Produktumfang`, `Historie` ergÃ¤nzt
  - Entwicklungsbereich in `SettingsView` minimal um den Einstieg `Adminbereich` erweitert
  - Modulkatalog und Projektmodule bleiben unverÃ¤ndert (`Protokoll` bleibt einziges Projektmodul)
  - Testlauf um `lizenzverwaltungModule.test.cjs` ergÃ¤nzt
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein Umbau am bestehenden Lizenz-bearbeiten-Popup
  - Keine Lizenzlogik-, Produktumfangs-, Kunden- oder Historienimplementierung

#### Paket: Lizenzverwaltung Paket 2 (Adminbereich als eigenes Popup)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` aus den Entwicklung-Tabs entfernt und als eigener Einstieg/Kachel im Entwicklungs-Popup verankert
  - neues Adminbereich-Popup mit Kachel `Lizenzverwaltung` ergÃ¤nzt
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehende Entwicklung-Tabs (`Versionierung`, `Lizenz / bearbeiten`, `DB-Diagnose`, `Diktieren`, `Druck / TOP-Liste`) bleiben unverÃ¤ndert erhalten
  - Testvertrag fuer Adminbereich-/Lizenzverwaltung-Einstieg entsprechend erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, Projektmodulen, Sidebar oder Whisper/Diktier-Backends

#### Paket: Lizenzverwaltung Paket 2 (Produktumfang im Popup gliedern)
- Status: erledigt
- Beschreibung:
  - im Popup `Lizenz / bearbeiten` wurde die flache `Features`-Zeile durch den gegliederten Bereich `Produktumfang` ersetzt
  - `Standardumfang` (`app`, `pdf`, `export`) ist sichtbar und dauerhaft enthalten (nicht abwaehlbar)
  - `Zusatzfunktionen` enthalten `mail` und die sichtbare Bezeichnung `Dictate` (intern weiter `audio` kompatibel)
  - `Module` enthalten `Protokoll` und `Dummy` als klar vorbereitete, noch nicht aktiv angebundene Eintraege
  - bestehende Buttons unten (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) bleiben unveraendert erhalten
  - Testvertrag in `lizenzverwaltungModule.test.cjs` um Produktumfang-Nachweise erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Projektmodul-Katalog, Sidebar, Whisper, Diktierfunktion oder Protokoll-Modul

#### Paket: Lizenzverwaltung Paket 3 (Adminbereich in Einstellungen-Hauptebene verortet)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` als eigene Kachel direkt auf oberster Ebene in `Einstellungen` verankert
  - `Adminbereich` aus dem Entwicklung-Popup entfernt (kein Kachel- oder Tab-Einstieg mehr dort)
  - im `Adminbereich` bleibt die Kachel `Lizenzverwaltung` der sichtbare Zielpfad
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehender Bereich `Lizenz / bearbeiten` bleibt im Code als Altbestand erhalten, aber ohne sichtbaren Entwicklung-Tab-Einstieg
  - Testvertrag fuer Einstellungen/Entwicklung/Adminbereich entsprechend angepasst und erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzlogik-Aenderung
  - Keine Projektmodul-, Sidebar-, Diktier- oder Whisper-Aenderung

#### Paket: Lizenzverwaltung Paket 4 (Lizenz-erstellen-/bearbeiten-UI ins Modul verschoben)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `createLicenseEditorSection.js` eingefuehrt und die bestehende Lizenz-erstellen-/bearbeiten-UI dorthin verschoben
  - bestehende Lizenzlogik/IPC-Aufrufe und Buttons (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) unveraendert beibehalten
  - `LicenseAdminScreen` um den Einstieg `Lizenz erstellen / bearbeiten` erweitert
  - Klick auf den Einstieg oeffnet die verschobene UI aus dem Modul im Adminbereich
  - `SettingsView` enthaelt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten` mehr
  - Tests auf Modul-Export, Einstieg im `LicenseAdminScreen`, gegliederten Produktumfang und Adminbereich-Abgrenzung angepasst
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - keine neue Kundenverwaltung, Historie oder Produktumfang-Datenstruktur eingefuehrt
  - keine Projektmodul-, Sidebar-, Whisper-, Diktier- oder Lizenzdatei-Logik-Aenderung


#### Paket: Lizenzverwaltung Paket 4 (Kunden- und Lizenzdatensatz vorbereiten)
- Status: erledigt
- Beschreibung:
  - zentrale Datei `src/renderer/modules/lizenzverwaltung/licenseRecords.js` mit Feldlisten fuer Kunde und Lizenz angelegt
  - Default-Strukturen und kleine Normalisierungsfunktionen fuer beide Datensaetze eingefuehrt
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` weiter als vorbereitete Bereiche, aber mit Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI bleibt unveraendert als Einstieg nutzbar
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Datenbank/Persistenz
  - Keine Kundenverwaltung/Historie implementiert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung

#### Paket: Lizenzverwaltung naechstes Paket (Kunden-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js` angelegt
  - Kundenmaske mit Ueberschrift `Kunden`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Kundenfeldern aus `CUSTOMER_RECORD_FIELDS` umgesetzt
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal die Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Kundenmaske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, Buttons, Kunden-Einstieg und Nicht-Projektmodul-Verhalten erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Kundenliste/Historie implementiert
  - Keine Lizenzdatei- oder Produktumfang-Logik geaendert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung


#### Paket: Lizenzverwaltung naechstes Paket (Lizenzen-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js` angelegt
  - Lizenzen-Maske mit Ueberschrift `Lizenzen`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Lizenzfeldern aus `LICENSE_RECORD_FIELDS` umgesetzt
  - Lizenzmodus wird ueber `LICENSE_MODES` gerendert
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Lizenzen-Maske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, LICENSE_MODES, Buttons und Lizenzen-Einstieg erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Lizenzenliste/Historie implementiert
  - Keine Lizenzdatei-/Produktumfang-/Projektmodul-/Sidebar-/Whisper-Aenderung

## Offene Meilensteine
1. Weitere kleine Altpfade im Modul `Protokoll` abbauen

Hinweis: Der Meilenstein â€žProjektverwaltung / Projekt-Arbeitsbereichâ€œ ist abgeschlossen und dokumentiert.

---

## Zuletzt bearbeitet
- Letztes Paket:
  - Protokoll-Quicklane im TopsScreen auf einen TOP-Filter umgestellt
  - die Quicklane zeigt jetzt einen Filter-Button mit den Modi `Alle`, `ToDo` und `Beschluss`
  - `TopsScreenViewModel` filtert die sichtbare Liste nach dem gewaehlten Modus
  - Header-Buttons `Ausgabe`, `Firmen` und `Projekt` werden im Protokoll-Kontext nicht mehr als Quicklane-Aktionen gezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - reine Button-Helfer aus `CoreShell` in `src/renderer/app/coreShellButtons.js` ausgelagert
  - `CoreShell` importiert `mkNavBtn`, `mkActionBtn`, `setBtnEnabled`, `appendButtonGroup` und `createScreenRouteButton`
  - Core-Navigation, Style-Hilfe und Teilnehmer-Aktion bleiben separat gekapselt
  - `npm test` ist gruen
- Letztes Paket:
  - globaler Header im Shell-Kontext textbasiert neu aufgebaut
  - links steht jetzt `BBM <Version>` plus `aktiv: <Modul> | <Projektnummer> - <Kurzbezeichnung>`
  - rechts steht der ruhige Kunden-/Lizenztext aus den vorhandenen Settings
  - der alte `bereit:`-Statusblock und das sichtbare Statuspunktfeld sind entfernt
  - `npm test` ist nach dem Umbau erneut zu pruefen
- Letztes Paket:
  - Teilnehmer-Shell-Aktion aus `CoreShell` in `src/renderer/app/coreShellActions.js` ausgelagert
  - `CoreShell` importiert die Factory weiterhin und haengt den Teilnehmer-Button unveraendert in die Sidebar
  - Kontextsteuerung fuer Projekt/Besprechung bleibt im Shell-Teil
  - `npm test` ist gruen
- Letztes Paket:
  - leere Kontext-/Projekt-Navigationslogik aus `CoreShell` entfernt
  - `btnParticipants` und `updateContextButtons` bleiben als reine Kontextsteuerung erhalten
  - Core-Sidebar bleibt unveraendert und fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` importiert die Route-Definitionen und baut daraus weiterhin die Buttons
  - Labels, Router-Methoden und Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` erzeugt die Buttons weiter aus der ausgelagerten Route-Definition
  - Labels und Navigation unveraendert, Core-Sidebar bleibt fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - reine Shell-Style-Injektion aus `CoreShell` in `src/renderer/app/coreShellStyles.js` ausgelagert
  - `CoreShell` ruft die Style-Hilfe nur noch auf; Navigation und Router-Verdrahtung bleiben unveraendert
  - keine optische oder fachliche Aenderung
  - `npm test` ist gruen
- Letztes Paket:
  - toter old/new-UI-Modus aus `CoreShell` entfernt
  - `CoreShell.start()` startet den bestehenden Shell-Aufbau direkt ueber `_initShell()`
  - `main.js` bleibt Bootstrap und uebergibt keinen UI-Modus mehr
  - Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - alte Sidebar-Nachsortierung in `CoreShell._initUiNew()` entfernt
  - `CoreShell` delegiert den neuen UI-Modus jetzt nur noch auf den bestehenden Core-Shell-Aufbau
  - Core-Navigation bleibt unveraendert, Fachmodule bleiben aus der Sidebar draussen
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Shell-/Sidebar-Aufbau aus `main.js` in `src/renderer/app/CoreShell.js` ausgelagert
  - `main.js` bleibt beim Bootstrapping: Router erzeugen, Theme/Settings vorbereiten, `CoreShell` starten
  - Core-Navigation mit Start/Projekte/Firmen/Einstellungen/Hilfe/Beenden bleibt erhalten
  - Fachmodule tauchen weder in `main.js` noch in `CoreShell` als Sidebar-Definition auf
  - `npm test` ist gruen
- Letztes Paket:
  - Projekt-Arbeitsbereich von direktem Protokoll-Modulkatalog getrennt
  - `ProjectWorkspaceScreen` importiert `getActiveProjectModuleNavigation` und `PROTOKOLL_MODULE_ID` nicht mehr direkt
  - Router stellt die Arbeitsbereiche fuer den Projekt-Arbeitsbereich bereit und reicht sie an den Screen durch
  - Projektfirmen werden dort zusaetzlich zu Protokoll angezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - Machine-Binding Schritt 1: Lizenzanforderung speichern (`bbm-license-request.json`) inkl. Tests (Payload/IPC/Preload/UI/Grenzen)
- Letzter sinnvoller bestÃ¤tigter Stand:
  - Speichern-/LÃ¶schen-Vertrag im Tops-Bereich Ã¼ber zugehÃ¶rigen Testvertrag stabilisiert
- Letzter Cloud-Kontrolllauf:
  - `AGENTS.md` gefunden
  - `PLAN.md` gefunden
  - Codex konnte den Repo-Stand lesen
- Cloud-Kontrolllauf (zum damaligen Stand):
  - Branch: `modularisierung/projektverwaltung`
  - `HEAD` und `origin/modularisierung/projektverwaltung` waren identisch
  - der lokale Diff war leer
- Abgeschlossener Meilenstein:
  - Projekt-Arbeitsbereich ist technisch umgesetzt und stabilisiert
  - Projektklick oeffnet nicht mehr direkt Protokoll
  - Projektklick oeffnet den Projekt-Arbeitsbereich
  - einziges auswaehlbares Projektmodul ist aktuell Protokoll
  - Maschinenraumdienste erscheinen dort nicht als Projektmodule
  - Protokoll-Logik blieb unveraendert
  - `npm test` war gruen
- Beobachtung:
  - Ohne Fortschrittsdatei interpretiert Codex den Plan zu wÃ¶rtlich und nimmt erledigte Meilensteine erneut als offen an.

---

## Aktuell nÃ¤chster sinnvoller Schritt
Der naechste sinnvolle kleine Schritt nach diesem Paket ist:

### Lizenzverwaltung Paket 6 vorbereiten
- Ziel:
  - bestehende Lizenz laden, aendern und neu ausgeben als naechsten kleinen Adminschritt vorbereiten
- Wichtig:
  - Kundenverwaltung/Historie weiter nicht vorziehen
  - Audio / Diktat bleibt Maschinenraum ohne Projektmodul- oder Sidebar-Eintrag

---

## Offene Hindernisse / bekannte Probleme
- FrÃ¼here LÃ¤ufe zeigten bestehende Altprobleme, u. a.:
  - `ERR_INVALID_URL` im Zusammenhang mit ESM/CSS-Importpfaden
- Diese Probleme gelten nicht automatisch als Teil jedes neuen Mini-Pakets.
- Wenn ein neuer Meilenstein an diesen Punkten hÃ¤ngen bleibt, stoppen und offen berichten.

---

## Regeln fÃ¼r Fortschrittsfortschreibung
Nach jedem abgeschlossenen Paket oder Meilenstein ergÃ¤nzen:
1. Was wurde erledigt?
2. Welche Dateien waren betroffen?
3. Welcher Commit gehÃ¶rt dazu?
4. Was ist jetzt der nÃ¤chste offene Schritt?
5. Gab es Hindernisse oder Restrisiken?

Wichtig:
- `STATUS.md` beschreibt den Ist-Stand.
- `PLAN.md` bleibt der Soll-Plan.
- Erledigte Schritte sollen in `STATUS.md` dokumentiert werden, nicht durch stÃ¤ndiges Umschreiben von `PLAN.md`.

---

## Merksatz
- `AGENTS.md` = Hausordnung
- `PLAN.md` = Bauablaufplan
- `STATUS.md` = Bautagebuch / Ist-Stand

#### Paket: Lizenzverwaltung Paket 3 (Produktumfang intern zentral strukturiert)
- Status: erledigt
- Beschreibung:
  - zentrale Produktumfangs-Struktur `PRODUCT_SCOPE` im Modul `lizenzverwaltung` angelegt
  - `createLicenseEditorSection` auf die zentrale Struktur umgestellt (Standardumfang, Zusatzfunktionen, Module)
  - sichtbares Verhalten beibehalten: Standardumfang fix, mail/Dictate auswÃ¤hlbar, Module vorbereitet/deaktiviert
  - Features-Ausgabe bleibt kompatibel mit internem `audio`-Key fuer Dictate
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/productScope.js`
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzdatei-Strukturreform, keine Modulfreischaltung und keine Sidebar-/Projektmodul-Aenderung

#### Paket: Lizenzmodell-Korrektur BBM/Protokoll/Diktat
- Status: erledigt
- Beschreibung:
  - Lizenzmodell auf Zielbegriffe ausgerichtet: Produkt `bbm`, Modul `protokoll`, Zusatzfunktion `diktat`.
  - Runtime-Guards auf Modul/Funktion umgestellt: Protokoll erfordert `protokoll`, Diktat erfordert `protokoll` + `diktat`.
  - Lizenzstatus/Diagnose trennt Module und Funktionen; Lizenzanforderung nutzt Produkt `bbm`.
  - Rueckwaertskompatibilitaet bleibt aktiv (`bbm-protokoll`, `audio`/`dictate` als Alias).
- Betroffene Dateien:
  - `src/main/licensing/licenseFeatures.js`
  - `src/main/licensing/licenseService.js`
  - `src/main/licensing/featureGuard.js`
  - `src/main/licensing/licenseVerifier.js`
  - `src/main/ipc/licenseIpc.js`
  - `src/main/ipc/projectsIpc.js`
  - `src/main/ipc/printIpc.js`
  - `src/main/ipc/audioIpc.js`
  - `src/main/main.js`
  - `scripts/tests/licenseRequest.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/licenseStandardFeatures.test.cjs`
  - `scripts/tests/featureGuardEnforcement.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - Renderer-Lizenzstatusanzeige optional feinjustieren (Labels Produkt/Module/Funktionen), ohne Admin/GeneÂ­rator-Rueckbau.
- Risiken/Hinweise:
  - Legacy-Tests mit Alias-Begriffen bleiben teils bewusst erhalten fuer sanften Uebergang.

#### Paket: CoreShell-Layout-Auslagerung
- Status: erledigt
- Beschreibung:
  - Reine Shell-Layout-/DOM-Struktur aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` ausgelagert.
  - Host-Setup, Sidebar-Container, Content-Root, Top-/Bottom-Boxen und Host-Append bleiben funktional unveraendert.
  - Router-Verdrahtung, Navigation, Aktionen und Kontextsteuerung verbleiben in `CoreShell.js`.
- Betroffene Dateien:
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur Layout/DOM-Struktur verschoben; fachliche Navigation und Router-Kanten bewusst unangetastet gelassen.

#### Paket: Entfernen des toten Firmen/Mitarbeiter-Schalters
- Status: erledigt
- Beschreibung:
  - Toten Schalter `Beta: Firmen/Mitarbeiter v2` und die zugehoerige `useNewCompanyWorkflow`-Verdrahtung aus `main.js` und `CoreShell.js` entfernt.
  - Druck-v2-Keys und Druckeinstellungen bleiben unveraendert.
  - Core-Navigation, Teilnehmer-Aktion, Router-Verdrahtung und allgemeiner Sticky-Notice-Listener bleiben bestehen.
- Betroffene Dateien:
  - `src/renderer/main.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Bereinigung
- Risiken/Hinweise:
  - Nur der tote Schalter wurde entfernt; `print.v2.*` und sonstige Ausgabelogik sind bewusst unveraendert geblieben.

#### Paket: CoreShell-Header-Bridge-Auslagerung
- Status: erledigt
- Beschreibung:
  - Header-/Router-Bridges aus `CoreShell.js` in `src/renderer/app/coreShellHeaderBridge.js` ausgelagert.
  - Router-Bridge fuer Output-Mail, Output-Print, Closed-Protocol-Selector und Header-/Theme-/Sticky-Notice-Events bleibt funktional unveraendert.
  - CoreShell behÃ¤lt Layout, Navigation, Teilnehmer-Aktion und Router-Kanten ausserhalb der Header-Bridge.
- Betroffene Dateien:
  - `src/renderer/app/coreShellHeaderBridge.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Header-/Router-Bridges verschoben; fachliche Navigation und Layout blieben bewusst unangetastet.

#### Paket: CoreShell-Keyboard-Handling-Auslagerung
- Status: erledigt
- Beschreibung:
  - Globales Enter/Escape-Keyboard-Handling aus `CoreShell.js` in `src/renderer/app/coreShellKeyboard.js` ausgelagert.
  - Das Verhalten fuer Overlay-Buttons bleibt unveraendert.
  - Header-Bridge, Layout, Navigation, Button-Helfer und fachliche Module blieben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellKeyboard.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur das globale Keyboard-Handling verschoben; UI- und Fachlogik bleiben unveraendert.

#### Paket: CoreShell-Quit-Button-Auslagerung
- Status: erledigt
- Beschreibung:
  - Beenden-/Quit-Button aus `CoreShell.js` in `src/renderer/app/coreShellActions.js` ausgelagert.
  - Styling, `appQuit()`-Aufruf, Fallback `window.close()` und Beenden-Hinweis bleiben funktional unveraendert.
  - `CoreShell` haengt den Button nur noch in die Bottom-Box ein.
- Betroffene Dateien:
  - `src/renderer/app/coreShellActions.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Quit-Button-Erzeugung verschoben; Rest der Shell bleibt unveraendert.

#### Paket: CoreShell-Kontextsteuerung-Auslagerung
- Status: erledigt
- Beschreibung:
  - Kontextsteuerung fuer den Teilnehmer-Button aus `CoreShell.js` in `src/renderer/app/coreShellContextControls.js` ausgelagert.
  - `bbm:router-context` und die Projekt-/Besprechungshinweise bleiben funktional unveraendert.
  - `CoreShell` ruft die zurueckgegebene `updateContextButtons()`-Funktion weiterhin fuer Start und Navigation auf.
- Betroffene Dateien:
  - `src/renderer/app/coreShellContextControls.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Teilnehmer-Kontextsteuerung verschoben; restliche Shell-Komponenten bleiben unveraendert.

#### Paket: CoreShell-Navigation-Runtime-Auslagerung
- Status: erledigt
- Beschreibung:
  - Navigation-Runtime-Helfer `buttonsByKey`, `setActive` und `runNavSafe` aus `CoreShell.js` in `src/renderer/app/coreShellNavigationRuntime.js` ausgelagert.
  - `router.onSectionChange` bleibt in `CoreShell.js`; das Verhalten der Navigation bleibt unveraendert.
  - Restliche Shell-Komponenten wie Header-Bridge, Keyboard, Layout, ContextControls und Actions bleiben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellNavigationRuntime.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Navigation-Runtime-Helfer verschoben; die Navigation selbst bleibt bewusst in CoreShell verdrahtet.

#### Paket: CoreShell-Body-Grundsetup-Auslagerung
- Status: erledigt
- Beschreibung:
  - Body-Grundsetup aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` verschoben.
  - `document.body.style.margin`, `height`, `background` und `color` werden nun ueber `prepareCoreShellBody()` gesetzt.
  - Layout, Navigation und alle anderen Shell-Bausteine bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur das Body-Setup verschoben; der restliche Layout-/Shell-Aufbau bleibt bewusst unangetastet.

#### Paket: Firmenbegriffe und Labels klaeren
- Status: erledigt
- Beschreibung:
  - Sichtbare Begriffe rund um Firmen/Firmen im Projekt/Firmen hinzufuegen in `ProjectFirmsView.js`, `FirmsPoolView.js` und den zugehoerigen Router-/Test-Erwartungen geschaerft.
  - Projektbezogene Bezeichnung `Projektfirmen` durch `Firmen im Projekt` ersetzt, die Fachlogik und Sortierreihenfolge blieben unveraendert.
  - Projektpool-CTA auf `Firmen hinzufuegen` / `Aus Firmenstamm hinzufuegen` vereinheitlicht.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `src/renderer/views/FirmsPoolView.js`
  - `src/renderer/app/Router.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur sichtbare Texte/Labels angepasst; Sortierlogik, DB-/IPC-Namen und Projektfirmen-Funktionen bleiben unveraendert.

#### Paket: Doppelten Projekttitel in Firmen im Projekt entfernen
- Status: erledigt
- Beschreibung:
  - Im Header von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und der restliche Inhalt bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Doppelanzeige entfernt; Routing, Projektlogik und Firmenlogik bleiben unveraendert.

#### Paket: Projektbezeichnung im Firmen-im-Projekt-Header entfernen
- Status: erledigt
- Beschreibung:
  - Im Kopf von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und die restliche Ansicht bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Kopfzeile reduziert; globale Header-Anzeige und Projektlogik bleiben unveraendert.

#### Paket: Firmenrollen-Kachel und Rollenreihenfolge-Dialog wiederherstellen
- Status: erledigt
- Beschreibung:
  - In den Einstellungen eine sichtbare Kachel `Firmenrollen` ergaenzt.
  - Die Kachel oeffnet den Dialog `Rollenreihenfolge fÃ¼r Firmen` mit Zwei-Spalten-Liste, Hinweis, Hinzufuegen sowie Schieben/Edit/Loeschen fuer die markierte Rolle.
  - Die bestehenden Settings-Schluessel `firm_role_order` und `firm_role_labels` werden weiterhin fuer Laden und Speichern verwendet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Die bestehende Rollen-/Kategorie-Settings-Struktur bleibt unveraendert; die sichtbare UI wurde nur wieder eingeblendet, vereinfacht und sprachlich geschaerft.

#### Paket: Nummernluecken direkt nach Delete schliessen
- Status: erledigt
- Beschreibung:
  - Nach erfolgreichem Loeschen eines TOPs oder Titels wird im Protokoll die bestehende `meetingTopsFixNumberGap`-Reparatur direkt angestossen.
  - Der alte Fallback beim Schliessen des Protokolls bleibt unveraendert erhalten.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die bestehende Reparatur-Logik wird wiederverwendet; falls die Delete-Reparatur fehlschlaegt, bleibt der Close-Fallback als zweite Sicherung bestehen.

#### Paket: +Titel/Create-Kontext nach Renumber wiederherstellen
- Status: erledigt
- Beschreibung:
  - `+Titel` kann wieder ohne aktive Auswahl angelegt werden.
  - Der neu erzeugte Titel wird automatisch ausgewahlt und als Create-Kontext fuer den naechsten `+TOP` gemerkt.
  - Der bestehende Delete-/Renumber-Flow bleibt erhalten; die Nummernreparatur nach Delete laeuft weiter sofort.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Create-Kontext wird im Screen gehalten; bei weiteren Create-Regeln muss spaeter nur dieser Pfad erweitert werden.

#### Paket: Diktat/Audio von Entwicklung nach Eingabe & Erfassung verschieben
- Status: erledigt
- Beschreibung:
  - `Diktat / Audio` erscheint jetzt als eigene Kachel unter `Eingabe & Erfassung`.
  - Der Technik-Dialog enthaelt diesen Tab nicht mehr.
  - Die bestehenden Audio-Einstellungen bleiben ueber den neuen Einstieg erreichbar.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Audio-Baustein bleibt intern derselbe; nur der sichtbare Einstieg wurde umgehaengt.

#### Paket: Adminbereich aus Settings-Ãœbersicht entfernen
- Status: erledigt
- Beschreibung:
  - Der sichtbare Einstieg `Adminbereich` / `Externe Lizenzverwaltung` wurde aus der normalen Settings-Ãœbersicht entfernt.
  - `Lizenzstatus` bleibt unter `Allgemein` erhalten.
  - `Entwicklung` zeigt danach nur noch `Technik`.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der interne Lizenz-Admin-Code bleibt bewusst stehen; nur der sichtbare Settings-Einstieg ist entfernt.

#### Paket: Modul-/Feature-/Lizenzregel dokumentiert
- Status: erledigt
- Beschreibung:
  - Die Doku beschreibt jetzt die Regel fuer Fachmodule, Hilfsfunktionen, Ausgabe-Infrastruktur und externen Lizenzbau.
  - Die Kurzregel macht die fachliche Trennung in einem Blick lesbar.
- Betroffene Dateien:
  - `docs/settings-structure.md`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Nur Dokumentation wurde ergaenzt; App-Logik blieb unveraendert.

#### Paket: Globale UI-Schrift auf Noto Sans umgestellt
- Status: erledigt
- Beschreibung:
  - Die normale App-Oberflaeche nutzt jetzt zentral `Noto Sans` als UI-Schrift.
  - Die Print-/PDF-Schriften bleiben unveraendert.
  - TopsScreen, Settings, Projektverwaltung und globale Shell nutzen die gemeinsame UI-Variable.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/index.html`
  - `src/renderer/editor.html`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Tops-Textschrift bleibt als separate Modul-/Top-Regel bestehen; Print bleibt bewusst unberuehrt.

#### Paket: Settings-Ãœbersicht als Accordion poliert
- Status: erledigt
- Beschreibung:
  - Die Settings-Gruppen sind jetzt als einklappbare Accordions umgesetzt.
  - `Allgemein` ist initial offen, die anderen Gruppen starten geschlossen.
  - Kachel- und Gruppentexte sind ruhiger, dunkler und kompakter gestaltet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Accordion-Logik speichert keinen Zustand; nach Reload startet die Ãœbersicht wieder mit `Allgemein` offen.
#### Paket: Appweite Button-Styles vereinheitlicht
- Status: erledigt
- Beschreibung:
  - Die App nutzt jetzt einen konsolidierten UI-Button-Stil ueber zentrale Varianten.
  - Buttons wirken ruhiger und konsistenter; Standardaktionen sind dezenter, gefaehrliche Aktionen sind klar als `danger` markiert.
  - Settings, Tops, Projektverwaltung und die allgemeinen Shell-/Modal-Buttons nutzen die gemeinsamen Basisregeln.
  - Print-/PDF-Buttonoptik und Drucklogik blieben bewusst unveraendert.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Spezielle Fachbuttons behalten ihre jeweiligen Varianten, damit keine Layouts oder Fachaktionen verrutschen.
  - Print/PDF-CSS und Druckausgabe wurden bewusst nicht angefasst.

#### Paket: Button-Styles visuell feiner abgestimmt
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis wurde optisch feiner und leichter gemacht.
  - Hoehe, Padding, Radius, Schriftgewicht und Hover-Verhalten wurden dezent reduziert.
  - Primary, Secondary, Danger und Ghost bleiben als Varianten erhalten, wirken aber ruhiger.
  - Dialog- und Shell-Buttons nutzen die feinere Basis ohne Funktionsaenderung.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Button-Layouts mit eigenen Min-Hoehen bleiben bewusst unangetastet.
  - Druck-/PDF-Buttons wurden nicht umgebaut.

#### Paket: Button-Groesse weiter reduziert
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis ist jetzt deutlich kompakter.
  - Standardbuttons nutzen eine kleinere Hoehe, weniger Innenabstand und eine feinere Schriftgroesse.
  - Die bestehenden Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten, wirken aber leichter.
  - Der kleinere Rasterstand wurde zentral umgesetzt, ohne Klicklogik oder Dialogflows zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Einige Fach-Buttons behalten bewusst lokale Minimalhoehen, damit spezialisierte Layouts stabil bleiben.
  - Print-/PDF-Buttons und Drucklogik wurden nicht angefasst.

#### Paket: Zentrale Button-Tokens eingefuehrt
- Status: erledigt
- Beschreibung:
  - Appweite Button-Tokens wurden zentral in den globalen UI-Styles definiert.
  - Die vorhandenen Standardbuttons haengen jetzt an diesen Tokens fuer Hoehe, Padding, Radius, Schrift, Border, Hover, Focus und Disabled.
  - Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten und sind an den zentralen Token-Satz gebunden.
  - Die Button-Optik bleibt kompakt und dezent, ohne Fachlogik oder Druckpfade zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Einzelformen bleiben dort bestehen, wo sie fuer Layout oder Bedienung notwendig sind.
  - Print-/PDF-Stile wurden bewusst nicht mit den Button-Tokens gekoppelt.

#### Paket: Modul-/Feature-/Lizenzmatrix testseitig abgesichert
- Status: erledigt
- Beschreibung:
  - Die Matrix zwischen Fachmodul `Protokoll`, Hilfsfunktion `Diktat / Audio` und Lizenzstatus ist jetzt mit zusaetzlichen Regressionstests abgesichert.
  - Der positive Protokollpfad ist ebenso abgedeckt wie der geblockte Fall mit strukturiertem Payload.
  - Der cached Modulstatus in `moduleAccessState` ist direkt mit Lizenzdaten abgesichert.
  - Projektverwaltung, Settings und Ausgabe-/Mail-/PDF-Guards bleiben weiterhin testseitig getrennt pruefbar.
- Betroffene Dateien:
  - `scripts/tests/protokollProjectEntryRouting.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurden nur Tests ergaenzt; App-Logik blieb unveraendert.

#### Paket: Diktat/Audio-Freischaltung und Mikrofon-Buttons
- Status: erledigt
- Beschreibung:
  - Diktat/Audio wird jetzt ueber das Lizenzfeature `audio`/`diktat` oder den internen Entwicklungsschalter `Diktat-Testfreigabe` freigeschaltet.
  - Die Mikrofon-Buttons im TopsScreen erscheinen nur bei aktiver Freischaltung und zeigen waehrend der Aufnahme einen roten Punkt.
  - Der Entwicklungsschalter sitzt im Entwicklungsdialog und bleibt als Test-/Prueffunktion von normalen Kundenfunktionen getrennt.
  - Die Lizenz- und Settings-Gates wurden so erweitert, dass der neue Schalter im Main-/Renderer-Pfad sauber erkannt wird.
- Betroffene Dateien:
  - `src/main/ipc/audioIpc.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/renderer/features/audio/AudioFeature.js`
  - `src/renderer/features/audio-dictation/DictationController.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurde bewusst keine externe Lizenz-App und keine Generator-/Admin-UI in die normale App zurueckgebracht.
  - Die Stop-Logik fuer das Diktat bleibt bei der vorhandenen Audio-Funktionalitaet; der neue Zustand steuert vor allem Sichtbarkeit und Anzeige.
- Der Einstieg `Drucken` oeffnet jetzt zuerst eine Druckart-Auswahl:
  - `Protokoll drucken` fuehrt danach zur gewohnten Auswahl geschlossener Protokolle
  - vorhandene weitere Ausgaben bleiben ueber den ersten Schritt erreichbar, deaktivierte Optionen werden nicht als funktionierend vorgetaeuscht
  - Protokoll-PDF-Vorschau, Firmenliste, ToDo-Liste und TOP-Liste bleiben dabei erreichbar
  - gespeicherte Firmenlisten sind nicht mehr als funktionale Ausgabeart angeboten
  - Firmenliste laeuft direkt ueber den aktuellen Projektstand und braucht keine geschlossene-Protokoll-Auswahl
  - eine separate Mitarbeiter-/Personenliste ist im aktuellen Druckdialog noch nicht als eigener Modus vorhanden

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Innenabstand speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock-Innenabstand (Print-HTML Vorschau, DEV-only) wird beim Speichern jetzt ueber `protokoll_tops` in der bestehenden `tableLayouts`-Sanitization mitgetragen und nach Neustart wieder angewendet.
  - Reset stellt Breite und Innenabstand wieder auf Standard zurueck.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: PDF-Metablock-Innenabstand ebenfalls in der Toolbar als gespeicherter Default nach Save aktualisieren (rein kosmetisch)
- Risiken/Hinweise:
  - Keine PDF-Export-Logik angepasst; Markierungen bleiben DEV-only in der HTML-Vorschau.

#### Paket: PDF-Vorschau bei offener Besprechung erlauben (ohne finalen Druck freizugeben)
- Status: erledigt
- Beschreibung:
  - Die Sperre "Druck nur fuer geschlossene Besprechungen" greift jetzt nur noch beim finalen Protokolldruck.
  - PDF-Vorschau/Vorabzug und DEV-Layout-Preview werden bei offener Besprechung nicht mehr blockiert.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Kein Umbau der Drucklogik; nur die Blockierbedingung wurde um `preview` ergaenzt.

#### Paket: DEV-Layout-Preview auch in Protokoll-PDF-Vorschau wieder aktiv
- Status: erledigt
- Beschreibung:
  - Bei `printMeetingPreview` (Protokoll-PDF-Vorschau) wird im DEV-Channel wieder zusaetzlich das interaktive Print-HTML-Preview geoeffnet, damit Layout-Zonen/Toolbar aktiv sind, ohne den echten PDF-Export zu beeinflussen.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur DEV-only Zusatzfenster; STABLE bleibt ohne Layout-Werkzeuge.

#### Paket: DEV PDF-Layout Reset setzt wieder echte Standards (TOP-Liste Metablock)
- Status: erledigt
- Beschreibung:
  - Reset in der DEV-Print-HTML Vorschau nutzt jetzt fuer Breite/Innen die Werte aus `defaultLayout` (nicht aus `effectiveLayout`), damit nach vorherigem Speichern der Reset wirklich auf Standard zurueckgeht.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur Reset-/Default-Handling im DEV-Preview angepasst; Speichern/Laden bleibt ueber `tableLayouts` unveraendert.

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Schrift speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock speichert jetzt zusaetzlich zur Breite und zum Innenabstand auch die Schriftgroesse ueber `pdf.rootVars.--bbm-top-col-meta-font-size`.
  - Reset stellt Breite/Innen/Schrift wieder auf die echten Standardwerte aus `defaultLayout`.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Schrift wird aktuell als `px` gespeichert (Toolbar-Schrittweite 1px); CSS akzeptiert das auch im Print-HTML Preview.

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau lassen sich fuer den PDF-Nummernblock jetzt Breite (mm), Innen (mm) und Schrift (pt) live einstellen.
  - Keine Speicherung/kein Reset fuer Nummernblock in diesem Schritt; beim Neuoeffnen ist wieder Standard aktiv.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Speicherung/Reset fuer Nummernblock analog Metablock (separater Meilenstein)
- Risiken/Hinweise:
  - Die Nummernblock-Innenaenderung setzt aktuell `padding-left` inline auf `th/td.colNr` (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Nummernblock speichert jetzt Breite (ueber `columns[].pdfWidth`/`pdfNumberWidth`), Innenabstand (ueber `pdf.rootVars.--bbm-top-col-nr-padding-left`) und Schrift (ueber `pdf.rootVars.--bbm-top-col-nr-font-size`).
  - Reset stellt die Werte wieder auf Standard zurueck und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Die Hauptschriftgroesse des Nummernblocks ist jetzt per CSS-Variable steuerbar; Datum/Hinweis werden im Preview proportional per Inline-Style mitgefuehrt.

#### Paket: DEV PDF-Layout TOP-Liste (Textblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau laesst sich der PDF-Textblock live einstellen: Innen (mm) und Schrift (pt).
  - Breite bleibt gesperrt als "Restbereich" (keine direkte Textblock-Breitenverstellung).
  - Keine Speicherung/kein Reset fuer Textblock in diesem Schritt.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Textblock speichern/reset (separater Meilenstein)
- Risiken/Hinweise:
  - Text-Schrift wird live per Inline-Style auf `.shortText/.longText` gesetzt (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Textblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Textblock speichert jetzt Innenabstand (pdf.rootVars text padding left/right) und Schriftgroesse (pdf.rootVars `--bbm-top-col-text-font-size`).
  - Textblock-Breite bleibt "Restbereich" und wird nicht gespeichert.
  - Reset stellt die Standardwerte aus `defaultLayout` wieder her und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der UI-Regler "Innen" setzt beim Speichern aktuell links und rechts symmetrisch; Standard-Reset stellt die urspruenglichen Default-Werte (0 / 1.5mm) wieder her.

#### Paket: Refactor 1 (DevLayoutToolbar zentralisieren)
- Status: erledigt
- Beschreibung:
  - `DevLayoutToolbar` wurde aus dem Protokoll-Modul in ein zentrales Hilfsmodul verschoben: `src/renderer/layoutTools/DevLayoutToolbar.js`.
  - Protokoll (TopsHeader/TopsList) importiert die Toolbar jetzt aus dem neuen Pfad; Verhalten bleibt gleich.
  - Tests wurden minimal angepasst, damit `npm test` nach den CSS-Variablen-Umstellungen weiterhin gruen laeuft (keine Verhaltensaenderung).
- Betroffene Dateien:
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `scripts/tests/tableLayoutRegistry.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine funktionalen Aenderungen beabsichtigt; Bitte kurz manuell pruefen: TOP-UI Layout-Toolbar erscheint im DEV-Modus wie vorher.

#### Paket: Refactor 2 (TOP-Zonen aus DevLayoutToolbar auslagern)
- Status: erledigt
- Beschreibung:
  - TOP-spezifische Zonendefinitionen (Keys/Labels/Controls) wurden in eine Surface-Datei ausgelagert:
    `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`.
  - `DevLayoutToolbar` ist jetzt surface-getrieben und enthaelt keine TOP-spezifischen Labels/Zonen mehr (Fallback bleibt fuer Kompatibilitaet).
  - Protokoll bindet die Toolbar wie vorher ein; Verhalten bleibt gleich.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine Verhaltensaenderung beabsichtigt; nur Zonendefinition/Labels umgezogen.

#### Paket: DEV layoutTools Auto-Erkennung fuer einfache PDF-Tabellen
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML-Vorschau werden einfache Tabellen jetzt automatisch als layoutfaehige Surfaces erkannt, sofern sie `thead/th` oder `colgroup/col` haben und keine manuellen layoutTools-Marker tragen.
  - Manueller Protokoll-Stand bleibt priorisiert; TOP-Liste und Teilnehmerliste behalten ihre bisherigen Zonen.
  - Auto-Surfaces sind anklickbar und werden im DEV-Layoutmodus gruen markiert; echte PDF-Ausgaben bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/layoutTools/autoTableLayout.mjs`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Persistenz/Speicherpfad fuer stabile neue Auto-Surfaces vorbereiten, wenn ein echter stabiler `tableKey` feststeht
- Risiken/Hinweise:
  - Auto-Erkennung bleibt heuristisch und absichtlich konservativ; komplexe Karten-/Sonderlayouts werden weiterhin nicht automatisch als Layout-Surface behandelt.

#### Paket: DEV Layout-Einstieg ToDo-Vorschau
- Status: erledigt
- Beschreibung:
  - Der DEV-only Vorschauweg fuer `mode: "todo"` nutzt jetzt ebenfalls `print:openHtmlPreview` mit `devLayoutPreview`.
  - Normale ToDo-PDF-Erzeugung bleibt unveraendert; der neue Weg ist nur fuer die Layout-HTML-Vorschau gedacht.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der neue Einstieg bleibt bewusst DEV-only und greift nicht in die fertige PDF-Erzeugung ein.

#### Paket: DEV Auto-Tabellen Live-Regler
- Status: erledigt
- Beschreibung:
  - Fuer automatisch erkannte einfache PDF-Tabellen in der DEV-Print-HTML-Vorschau funktionieren jetzt generische Live-Regler fuer Breite, Innenabstand und Schriftgroesse.
  - Die Werte bleiben bewusst nur im laufenden Vorschau-Tab wirksam; es gibt noch keine Speicherung oder Reset-Funktion fuer Auto-Tabellen.
  - Manuelle Surfaces wie TOP-Liste und Teilnehmerliste behalten Vorrang und ihr bisheriges Verhalten bleibt erhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: falls spaeter ein stabiler `tableKey` fuer weitere Auto-Tabellen feststeht, kann ein Persistenzpfad separat vorbereitet werden
- Risiken/Hinweise:
  - Die Auto-Regler greifen nur auf einfache erkannte Tabellen in DEV; komplexe Karten-/Sonderlayouts bleiben ausgeschlossen.

#### Paket: DEV Auto-Tabellen Persistenz
- Status: erledigt
- Beschreibung:
  - Automatisch erkannte einfache PDF-Tabellen koennen ihre aktiven Auto-Zonen jetzt generisch speichern und zuruecksetzen.
  - Die Persistenz nutzt einen stabil abgeleiteten `print.*`-Surface-Key pro Preview-Tabelle; TOP-Liste und Teilnehmerliste bleiben unveraendert.
  - Live-Regler bleiben bestehen und Auto-Layouts werden beim Oeffnen der DEV-Vorschau wieder geladen.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: fachlich weitere komplexe PDF-Tabellen pruefen, bevor neue Auto-Surfaces in groesserem Umfang entstehen
- Risiken/Hinweise:
  - Der Auto-Key ist bewusst generisch; bei mehreren Tabellen derselben Klasse bekommt die spaetere Instanz einen stabilen Suffix, um Vermischung zu vermeiden.

#### Paket: DEV Auto-Layout Export
- Status: erledigt
- Beschreibung:
  - Im DEV-Layoutmodus kann die aktive Surface/Tabelle jetzt als lesbarer JSON-/Code-Snippet-Export ausgegeben werden.
  - Der Export kopiert den Snapshot in die Zwischenablage und zeigt ihn ueber den nativen Dialog an, ohne Standardlayout-Dateien automatisch zu aendern.
  - STABLE bleibt ohne layoutTools-Bedienung; manuelle Surfaces und Auto-Tabellen behalten ihr bisheriges Verhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: den Export bei Bedarf noch um eine separate Datei-Ablage erweitern, falls spaeter ein manueller Copy/Paste-Workflow nicht reicht
- Risiken/Hinweise:
  - Der Export ist absichtlich nur ein Snapshot-Hilfsweg fuer Entwickler und fuehrt keine Code-Aenderung an den Standardlayout-Dateien aus.

#### Paket: ToDo-Standardlayout aus Exportwerten fest übernommen
- Status: erledigt
- Beschreibung:
  - Die exportierten Kalibrierwerte fuer `print.todo.todoTable` sind jetzt als Standardlayout fuer die ToDo-PDF-Vorschau im Code hinterlegt.
  - Ohne gespeicherte Entwicklerwerte greifen die neuen Standardwerte; vorhandene gespeicherte DEV-Werte behalten Vorrang.
  - Auto-Erkennung, Live-Regler, Export sowie manuelle Surfaces wie TOP-Liste und Teilnehmerliste bleiben unveraendert.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Das Standardlayout ist bewusst nur fuer die ToDo-PDF-Surface `print.todo.todoTable` hinterlegt und greift nicht auf andere Tabellen ueber.

#### Paket: DEV Layoutmodus-Schalter fuer PDF-Vorschau
- Status: erledigt
- Beschreibung:
  - Die DEV-PDF-Layout-Vorschau wurde vom lokalen AN/AUS-Schalter wieder entkoppelt und folgt jetzt dem zentralen DEV-Flag aus den Einstellungen.
  - Im Zustand AN sind Toolbar, Marker und Zonenbedienung sichtbar; im Zustand AUS bleibt die Layout-Toolbar verborgen, waehrend die gespeicherten Layoutwerte weiterhin angewendet bleiben.
  - STABLE und echte PDF-Ausgaben bleiben unveraendert und markerfrei.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Schalter ist bewusst nur in den DEV-Einstellungen vorhanden und steuert nur die Sichtbarkeit/Bearbeitbarkeit der laufenden Vorschau, nicht die gespeicherten Werte.

#### Paket: DEV Layout-Kalibrierung zentral in Einstellungen
- Status: erledigt
- Beschreibung:
  - Die aktive Layout-Kalibrierung wird jetzt zentral in den Einstellungen per DEV-Checkbox gesteuert und per App-Settings-Broadcast an Renderer und PDF-Vorschauen verteilt.
  - Die lokale Preview-Schaltfläche wurde aus dem laufenden PDF-Workflow entfernt; stattdessen reagieren TopsScreen, Print-HTML-Vorschau und Auto-Tabellen auf den zentralen Zustand.
  - STABLE sieht den Schalter nicht, und echte PDFs bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/layoutTools/layoutCalibrationState.js`
  - `src/renderer/app/Router.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/main/preload.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Broadcast-Mechanismus ist bewusst leichtgewichtig; falls spaeter weitere Layout-Renderer hinzukommen, sollten sie denselben zentralen Zustand aus der App-Settings-Quelle lesen.

#### Paket: Notfall-Stabilisierung layoutTools deaktiviert
- Status: erledigt
- Beschreibung:
  - Die Layout-Kalibrierung ist aus dem aktiven Laufweg entfernt und wird nicht mehr als normale Bedienfunktion angeboten.
  - Der Entwicklungs-Dialog zeigt keinen aktiven Layout-Kalibrierungs- oder Tabelleneditor-Einstieg mehr.
  - Der interaktive Print-HTML-Layoutweg ist aus den normalen Druckeinstiegen entfernt.
  - Protokoll-PDF, TOP-Liste, ToDo und Teilnehmerliste laufen wieder ohne aktive Toolbar, Marker oder Layoutfenster.
  - Die tableLayouts-Infrastruktur bleibt als Codebasis vorhanden, ist im aktuellen Laufweg aber nicht mehr aktiv.
- Betroffene Dateien:
  - `src/renderer/layoutTools/layoutCalibrationState.js`
  - `src/main/ipc/printIpc.js`
  - `src/main/preload.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - Editor 1 spaeter neu konzipieren, falls wieder ein sauberer, entkoppelter Kalibrierweg benoetigt wird.
- Risiken/Hinweise:
  - Der technische Unterbau fuer tableLayouts bleibt im Code vorhanden, wird aber durch die normale App nicht mehr als aktiver Einstieg genutzt.

#### Paket: TOP-Toolbar aus dem aktiven Laufweg entfernt
- Status: erledigt
- Beschreibung:
  - Die sichtbare Layout-Toolbar aus der TOP-Liste wurde aus `TopsHeader` entfernt.
  - Die Layout-Zonenbedienung in der TOP-Liste wurde aus `TopsList` und `TopsScreen` entkoppelt, so dass keine aktiven Marker/Click-Zonen mehr erscheinen.
  - `layoutTools`-Schalter und Toolbar-Callbacks laufen im TOP-Screen nicht mehr an.
  - Normale TOP-Bedienung, Bearbeitung und PDF-Ausgabe bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Die technische layoutTools-Basis bleibt als Code im Repo, ist aber im TOP-Laufweg nicht mehr aktiv verdrahtet.

#### Paket: Whisper-Modellstrategie fuer DEV und Produktivbuild stabilisiert
- Status: erledigt
- Beschreibung:
  - Der Main-Service nutzt jetzt `small`/`balanced` als Defaultmodell.
  - Die vorhandenen Whisper-Qualitaeten `fast`/`balanced`/`best`/`large` bleiben einzeln waehlbar.
  - Wenn das gewaehlte Modell fehlt und `ggml-small.bin` vorhanden ist, faellt die Transkription auf `small` zurueck.
  - Fehlt auch `ggml-small.bin`, liefert der Main-Service eine klare Fehlermeldung statt still zu scheitern.
  - Die Whisper-Engine schaut zusaetzlich in `userData/audio/models` nach Modellen.
  - Produktive Builds packen nur noch `ggml-small.bin`; `ggml-base.bin`, `ggml-medium.bin` und `ggml-large.bin` werden nicht mehr automatisch mitgeliefert.
  - Die Audio-Tests decken Default, Mapping, Fallback, User-Model-Pfad und Packaging-Regel ab.
- Betroffene Dateien:
  - `src/main/services/audio/TranscriptionService.js`
  - `src/main/services/audio/engines/WhisperCppEngine.js`
  - `src/renderer/modules/audio/ui/createDictationDevSection.js`
  - `package.json`
  - `scripts/tests/audioModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - DEV- und Produktivsichtung im laufenden App-Kontext mit vorhandenem und optional userseitig abgelegtem Whisper-Modell.
- Risiken/Hinweise:
  - `npm test` ist in dieser Umgebung weiterhin durch das bereits bekannte `better-sqlite3`-Native-Modul blockiert; die Audio-Subtests selbst laufen gruen.
- Restarbeiten M5 ist jetzt umgesetzt:
  - Restarbeiten koennen neu angelegt, ausgewaehlt und in einer Editbox-Grundform bearbeitet werden
  - Speichern laedt die Liste erneut und haelt die Auswahl konsistent
  - Foto-/Diktat-/Druck-/Mail-/Loesch- und Archivpfade bleiben ausserhalb dieses Pakets
  - `npm test` laeuft gruen

- M9 ist abgeschlossen: Der M8-Fotoimport speichert Attachments jetzt IPC-seitig DB-konform mit `project_id` ueber `addRestarbeitAttachment(...)`; der zugehoerige M8-Test erzwingt den Repo-Vertrag (`restarbeit_id`, `project_id`, `file_path`) und prueft die erwarteten Attachment-Felder.

- M12 Restarbeiten-Liste fachlich layoutet:
  - 4-spaltige Tabelle blieb erhalten; Verortung als 2-zeilige Metaspalte.
  - Status-Metaspalte mit Klasse, Status, Fertig bis, Verantwortlich und Ampel (inkl. testbarem data-ampel).
  - modulnahe Style-Injektion fuer Restarbeiten-Liste hinzugefuegt.
- Naechster offener Schritt: fachliche Sichtpruefung der M12-Listenoptik im UI.

- M13 Restarbeiten-Startbutton ist umgesetzt:
  - Projekt-Arbeitsbereich zeigt jetzt auch `Restarbeiten`, wenn das Modul freigeschaltet ist
  - der Button startet ueber den vorhandenen Projektmodulpfad (`openProjectModule`)
  - Protokoll- und Projektfirmen-Einstieg bleiben unveraendert

- Hotfix M13.1: Restarbeiten-Button ist jetzt auch direkt auf der Projektkachel sichtbar und startet über openProjectModule.

- M30 Restarbeiten-Datenbasis erweitert:
  - `completed_at` und `completion_note` in Schema/Repo/Create/Update ergänzt.
  - `deleted_at` additiv ergänzt; Soft Delete als eigener Repo-/IPC-/Preload-/DataSource-Pfad vorbereitet.
  - Standard-Listenpfad blendet soft-gelöschte RP aus; optionaler Include-Flag bleibt für Rohzugriffe möglich.
  - RP-Nummernlogik bleibt stabil ohne Wiederverwendung (Soft-Delete-Datensätze zählen weiterhin in `MAX(running_number)`).
  - keine sichtbare UI-Änderung.

- M33.5 Restarbeiten:
  - Drucken im Restarbeiten-Header öffnet jetzt den bestehenden V2-Vorschaupfad (`print:openHtmlPreview`) statt direktem PDF-Write.
  - Payload bleibt modebasiert auf `mode: "restarbeiten"` inklusive gefilterter `restarbeitenRows` und `restarbeitenLocationLabels`.
  - Restarbeiten-Ordner/`restarbeitenDir` und modebasierter Feature-Guard aus M33.4/M33.4.1 bleiben unverändert.


### M33.10
- Restarbeiten-Drucken erzeugt PDF weiterhin über den V2-PDF-Pfad.
- PDF wird im Restarbeiten-Ordner gespeichert.
- PDF wird intern in der BBM/Chromium-Vorschau angezeigt.
- Externer Adobe-/Windows-Viewer ist nicht mehr der primäre Restarbeiten-Vorschauweg.

### K19.13a – BBM-Test an aktuelle UI-Editor-Installer-Artefakte angepasst
- Status: erledigt
- Beschreibung:
  - Der BBM-Artefakttest erkennt `uiEditor.global` jetzt robust ueber `id`, `uiScope`, `uiScopeId` oder einen Registry-Schluessel.
  - `uiEditor/targetAppRegistry.js` ist als neutrales Pflichtartefakt im installierten UI-Editor-Artefaktbestand enthalten.
  - Die echte BBM-Registry bleibt separat und wird weiterhin auf `protokoll.topsScreen` und `protokoll.root` geprueft.
  - Keine Speicherung, kein Editor-Panel, kein DOM-Scan, keine automatische UI-Erkennung und keine Ziel-App-Fachlogik in `uiEditor/`.
- Betroffene Dateien:
  - `scripts/tests/bbmUiEditorInstalledArtifacts.test.cjs`
  - `uiEditor/targetAppRegistry.js`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `STATUS.md`
- Commit:
  - Paket-Commit dieses Branches; PR-Verweis wird nach Erstellung gefuehrt
- Naechster offener Schritt:
  - fachliche Abnahme des installierten UI-Editor-Artefaktvertrags im Ziel-Branch.
- Risiken/Hinweise:
  - Das neue Pflichtartefakt bleibt neutral und enthaelt keine BBM-Fachlogik.

### K19.14 – Installierten UI-Editor-Launcher zur Laufzeit sichtbar machen
- Status: erledigt
- Beschreibung:
  - Der installierte UI-Editor-Launcher wird in BBM zur Laufzeit im DEV-Kontext sichtbar gemacht.
  - Der Button stammt aus dem installierten Artefaktbestand unter `uiEditor/` (`uiEditorLauncherButton.js` und `uiEditorLauncherButton.css`).
  - Der Klick toggelt nur einen neutralen Launcher-State (`uiEditorLauncherActive` / `data-ui-editor-launcher-active`).
  - `activeUiScope` ist strukturell vorbereitet und bleibt in K19.14 neutral auf `null`.
  - Kein Editor-Panel, kein Hover-Rahmen, keine Speicherung, keine Fachlogik, kein DOM-Scan und keine automatische UI-Erkennung.
- Betroffene Dateien:
  - `uiEditor/uiEditorLauncherButton.js`
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `src/renderer/app/CoreShell.js`
  - `src/renderer/ui/MainHeader.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
- Commit:
  - `aktueller Branch-HEAD / PR`
- Naechster offener Schritt:
  - Sichtpruefung im lokalen Electron-DEV-Kontext: Launcher sichtbar und Toggle-State am Button nachvollziehbar.
- Risiken/Hinweise:
  - Die produktive Scope-Auswertung, Editor-Panel, Hover-/Auswahlmodus und Speicherung bleiben ausdruecklich nicht umgesetzt.
  - `npm test` ist in dieser Umgebung durch fehlendes Electron-Systempaket `libatk-1.0.so.0` blockiert; gezielte Launcher-/Artefaktpruefungen liefen gruen.

### K19.14-clean – UI-Editor-Launcher sauber einbauen
- Status: erledigt
- Beschreibung:
  - Installierter UI-Editor-Launcher sichtbar, alte Header-DEV-Buttons entfernt.
  - Kein Panel, kein Scan, keine Speicherung, keine Fachlogik.
  - EditorLab V2 und Restarbeiten V2 werden nicht mehr als globale Headerbuttons gerendert.
- Betroffene Dateien:
  - `src/renderer/ui/MainHeader.js`
  - `src/renderer/app/CoreShell.js`
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - wird mit diesem Paket-Commit erstellt
- Naechster offener Schritt:
  - fachliche App-Sichtpruefung: UI-Editor sichtbar, EditorLab V2/Restarbeiten V2 nicht sichtbar, kein weisser Bildschirm.
- Risiken/Hinweise:
  - Es wurde kein spezieller Guardrail-Test zu `docs/UI_EDITOR_VERTRAG.md` gefunden; die Absicherung erfolgt ueber die gezielten Runtime-/Header-Tests.

### K19.14-clean-Fix – UI-Editor-Launcher sichtbar machen
- Status: erledigt
- Beschreibung:
  - Ursache behoben: Der Launcher wird jetzt direkt ueber das installierte Launcher-Artefakt importiert und muss nicht mehr auf einen spaeten Script-Tag-Load warten.
  - Das installierte CSS positioniert den neutralen UI-Editor-Launcher oben rechts mit einer Z-Ebene oberhalb des Headers.
  - `uiEditor/**/*` ist im Paket-Artefaktbestand enthalten, damit die installierten Launcher-Dateien auch ausserhalb des reinen Quellbaums verfuegbar bleiben.
  - Kein Panel, kein Scan, keine Speicherung, keine Fachlogik; EditorLab V2 und Restarbeiten V2 bleiben aus dem Header entfernt.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `uiEditor/uiEditorLauncherButton.css`
  - `package.json`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `STATUS.md`
- Commit:
  - wird mit diesem Fix-Commit erstellt
- Naechster offener Schritt:
  - fachliche App-Sichtpruefung in einer Electron-Umgebung mit Systembibliotheken: UI-Editor sichtbar, EditorLab V2/Restarbeiten V2 nicht sichtbar, kein weisser Bildschirm.
- Risiken/Hinweise:
  - In dieser Umgebung bleibt `npm start`/`npm test` ueber Electron durch fehlendes `libatk-1.0.so.0` blockiert.

### K19.15 – UI-Editor-Launcher öffnet neutralen Aktivmodus
- Status: erledigt
- Beschreibung:
  - UI-Editor-Launcher öffnet einen neutralen Aktivmodus. Der Modus zeigt nur aktiv/inaktiv und einen Statushinweis. Kein Panel, kein Hover, keine Auswahl, keine Speicherung, kein DOM-Scan und keine Fachlogik.
  - `activeUiScope` bleibt als vorbereitender Platzhalter `null`.
  - MainHeader bleibt frei von alten EditorLab-V2- und Restarbeiten-V2-Headerbuttons.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `uiEditor/uiEditorLauncherButton.css`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/editorLabV2Access.test.cjs`
  - `scripts/tests/restarbeitenV2DevAccess.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `STATUS.md`
- Commit:
  - wird mit diesem Paket-Commit erstellt
- Naechster offener Schritt:
  - Lokale Sichtpruefung per `npm start`: UI-Editor sichtbar, Klick aktiviert/deaktiviert neutral, EditorLab V2 und Restarbeiten V2 nicht sichtbar, kein weisser Bildschirm.
- Risiken/Hinweise:
  - `npm test` ist in dieser Umgebung durch fehlendes Electron-Systempaket `libatk-1.0.so.0` blockiert; die gezielten Node-Tests liefen gruen.

### K19.16 – Restarbeiten-Preview an aktiven Auswahlpfad anbinden
- Status: erledigt
- Beschreibung:
  - Die Preview-Bedienung wird im aktiven UI-Editor-Kontext als sichtbares Panel gerendert.
  - Das Panel wird beim Aktivieren sofort angezeigt und meldet ohne Auswahl `Kein Element ausgewählt`.
  - Nach einer echten Auswahl ueber `targetSelection.js` aktualisiert `onSelectionChange(selection)` das Panel mit Element-ID, allowedOps und Preview-Buttons.
  - Preview-Aktionen bleiben temporaer im Speicher; kein Schreiben in Registry, Layout-State, Fachlogik, Datenbank oder PDF.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `STATUS.md`
- Commit:
  - wird mit diesem Paket-Commit erstellt
- Naechster offener Schritt:
  - Manuelle Sichtpruefung in der echten Electron-DEV-App: UI-Editor einschalten, Restarbeiten-Element anklicken, Preview-Panel und Buttons testen.
- Risiken/Hinweise:
  - Das Panel ist bewusst an den aktiven Launcher-/Auswahlpfad angebunden und ersetzt keine Markierungslogik.
  - Falls die App mehrere ueberlagerte DEV-Panels oeffnet, kann eine kleine Positionskorrektur noetig werden; die Preview bleibt trotzdem ohne Speicherung.

### K19.17 – Restarbeiten-Editbox-Preview-Ziel auflösen
- Status: erledigt
- Beschreibung:
  - Editbox-Innerelemente wie Eingaben und Labels behalten den blauen Auswahlrahmen auf dem ausgewählten Element.
  - Die temporäre Preview-Style-Anwendung nutzt für diese Innerelemente den registrierten Parent-Container als sichtbares Preview-Ziel.
  - Das Preview-Panel zeigt das tatsächlich veränderte Preview-Ziel an.
  - Filterbar-Preview bleibt unverändert auf dem ausgewählten Ziel.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `STATUS.md`
- Commit:
  - wird mit diesem Paket-Commit erstellt
- Naechster offener Schritt:
  - Manuelle Sichtpruefung in der echten Electron-DEV-App: Restarbeiten-Editbox-Input anklicken, Preview-Ziel im Panel prüfen, Move/Resize/Hide/Show/Reset testen.
- Risiken/Hinweise:
  - Die Zielauflösung ist bewusst auf Restarbeiten-Editbox-Innerelemente begrenzt und schreibt keine Registrierung, Fachlogik oder Layoutwerte.

### K19.18 – Preview-Zielauflösung generisch machen
- Status: erledigt
- Beschreibung:
  - Die Preview-Zielauflösung im UI-Editor ist nicht mehr an Restarbeiten-, Editbox-, Filterbar- oder Feldnamen-IDs gekoppelt.
  - Das Preview-Ziel wird generisch über Registry-`parentId`, vorhandene DOM-Ancestors mit `data-ui-editor-id`, Elementtyp/Rolle und optionale Registry-Metadaten aufgelöst.
  - Unterstützte generische Metadaten sind `previewTargetMode`, `previewTarget`, `affectsContainer` und `editGranularity`; Werte wie `self` erzwingen das ausgewählte Element, Werte wie `parent`/`container` den registrierten Parent.
  - Ohne explizite Metadaten wird nur bei eingebetteten Controls/Labels vorsichtig auf den registrierten Parent-Container gewechselt.
  - Preview-Aktivierung ist nicht mehr auf den Restarbeiten-Scope hart codiert; aktive Operationen folgen der Registry über `allowedOps`/`lockedOps`.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `STATUS.md`
- Commit:
  - wird mit diesem Paket-Commit erstellt
- Naechster offener Schritt:
  - Manuelle Sichtpruefung in Restarbeiten bleibt Referenz; spaetere Module koennen dieselbe Zielauflösung ueber Registry-Daten nutzen.
- Risiken/Hinweise:
  - Alte Statuszeile K19.17 beschreibt den urspruenglichen Restarbeiten-Fix; K19.18 ersetzt dessen technische Sonderlogik durch den generischen Pfad.

### K19.19 – Restarbeiten-Registry mit generischen Preview-Metadaten ausstatten
- Status: erledigt
- Beschreibung:
  - Die Restarbeiten-Editbox liefert jetzt generische Preview-Metadaten fuer Container, Elementziele und Controls.
  - Gruppen-/Layoutcontainer nutzen `editGranularity: "container"`, `previewTargetMode: "self"` und `affectsContainer: true`.
  - Labels und Status-/Hinweiselemente nutzen `editGranularity: "element"`, `previewTargetMode: "self"` und `affectsContainer: false`.
  - Inputs, Diktat-Buttons und UI-Control-Buttons sind als `control` beschrieben und uebernehmen keine Move-/Resize-Operationen vom Parent.
  - Die UI-Editor-Runtime verwendet Parent-Ziele nur noch bei explizitem `previewTargetMode: "parent"` und zeigt Preview-Ziel, Granularitaet, Target-Mode, allowedOps und lockedOps im Panel.
  - Preview-Panel-Buttons stoppen `mousedown`, damit Panel-Klicks die aktive Auswahl nicht verlieren.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`
  - `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `scripts/tests/restarbeitenEditorRegistry.domAnchors.test.cjs`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Manuelle Sichtpruefung in der echten Electron-DEV-App: Filterbar pruefen, Editbox-Gruppe/Label/Input/Neu/Loeschen anklicken, Preview-Ziel und deaktivierte Buttons im Panel pruefen, Move/Resize/Hide/Reset testen.
- Risiken/Hinweise:
  - Durch K19.20 ueberholt: `inspect` und `rename` sind im EditorRuntime-Operationsmodell jetzt fuer Registry-Validierung bekannt.
  - Die fachliche Electron-Sichtpruefung bleibt als Nutzerabnahme offen.

### K19.20 - UI-Editor Registry-Metadaten fuer Controls konsistent machen
- Status: erledigt
- Beschreibung:
  - Restarbeiten-Controls nutzen in `restarbeitenUiElements.js` und `restarbeitenMainUiRegistry.js` jetzt konsistent `allowedOps: ["inspect"]`.
  - Aktions-Controls wie Neu, Loeschen, Notiz und Diktat sind als `type: "button"`, `role: "action"`, `editGranularity: "control"`, `previewTargetMode: "self"` und `affectsContainer: false` beschrieben.
  - Aktions-Controls erlauben nur `inspect`, `show` und `hide`; Move, Resize, Breite, Hoehe und Rename sind gesperrt.
  - Die Runtime prueft `resizeWidth` und `resizeHeight` generisch gegen `allowedOps` und `lockedOps`; `resize`, `width`, `height`, `resizeWidth` und `resizeHeight` sperren die passenden Preview-Buttons.
  - Die EditorRuntime-Operationen kennen jetzt `inspect`, `resizeWidth`, `resizeHeight` und `rename`, damit echte Registry-Eintraege validiert werden koennen.
  - Tests pruefen die echten Restarbeiten-Eintraege `restarbeiten.editbox.text.short`, `.label`, `.input`, `.action.new` und `.action.delete` ueber den zentralen UI-Editor-Export und die Main-Registry.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `src/renderer/editorRuntime/registry/editorRegistryModel.js`
  - `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`
  - `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
  - `scripts/tests/bbmUiEditorRegistry.test.cjs`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `scripts/tests/restarbeitenEditorRegistry.domAnchors.test.cjs`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Fachliche Sichtpruefung in der echten Electron-DEV-App: Kurztext-Gruppe, Kurztext-Label, Kurztext-Input, Neu/Loeschen/Notiz/Diktat im Preview-Panel anklicken und Buttonzustand pruefen.
- Risiken/Hinweise:
  - Keine Speicherung, keine PDF-Logik, keine Fachaktion und keine Restarbeiten-Sonderlogik in der Runtime.
  - Durch K19.21 ueberholt: Controls sind nicht mehr inspect-only, sondern auf `self` wieder sichtbar editierbar.
  - Die fachliche Sichtpruefung bleibt als Nutzerabnahme offen.

### K19.21 - UI-Editor Control- und Label-Granularitaet editierbar machen
- Status: erledigt
- Beschreibung:
  - Die zu restriktive inspect-only-Regel fuer Controls wurde korrigiert.
  - Generische Ops-Gruppen sind jetzt in beiden Restarbeiten-Registries konsistent: Container, Labels, Controls und Action-Controls haben getrennte allowedOps/lockedOps.
  - Labels sind eigene Elemente mit `inspect`, `move`, `width`, `hide`, `show`.
  - Inputs/Textareas/Selects sind Controls mit `inspect`, `width`, `height`, `hide`, `show`; Move bleibt gesperrt.
  - Neu, Loeschen, Notiz und Diktat sind Action-Controls mit `inspect`, `move`, `width`, `height`, `hide`, `show`; Rename bleibt gesperrt und es wird keine Fachaktion ausgeloest.
  - `previewTargetMode: "self"` wirkt weiterhin auf das ausgewaehlte Element selbst; Parent-Preview passiert nur bei ausdruecklichem `parent`/`previewTarget`.
  - Der Panel-Reset setzt nur noch das aktuell ausgewaehlte Preview-Ziel zurueck; Editor-Deaktivierung entfernt weiter alle temporaeren Preview-Styles.
  - `resizeWidth`/`resizeHeight` bleiben generisch ueber `width`, `height` oder `resize` gemappt; ein gesperrtes `resize` blockiert explizit erlaubtes `width`/`height` nicht.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`
  - `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
  - `scripts/tests/bbmUiEditorRegistry.test.cjs`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `scripts/tests/restarbeitenEditorRegistry.domAnchors.test.cjs`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Fachliche Sichtpruefung in der echten Electron-DEV-App: Label verschieben/Breite, Input Breite/Hoehe/Hide/Show, Neu/Loeschen Breite/Hoehe/Move/Hide/Show, Reset und Editor-aus-Aufraeumen pruefen.
- Risiken/Hinweise:
  - Keine Speicherung, keine PDF-Logik, keine Fachaktion und keine Restarbeiten-Sonderlogik in der Runtime.
  - Die fachliche Electron-Sichtpruefung bleibt als Nutzerabnahme offen.

### K19.22 - UI-Editor Input-Controls verschiebbar machen
- Status: erledigt
- Beschreibung:
  - Die neue Fachvorgabe fuer Input/Textarea/Select/reine Controls ist in beiden Restarbeiten-Registries konsistent umgesetzt.
  - `CONTROL_OPS` lautet jetzt `["inspect", "move", "width", "height", "hide", "show"]`.
  - Input-Controls behalten `editGranularity: "control"`, `previewTargetMode: "self"` und `affectsContainer: false`.
  - Fuer Input-Controls sind `move`, `width`, `height` und `resize` nicht mehr gesperrt; `lockedOps` enthaelt nur noch `rename`.
  - Die Runtime bleibt generisch: Parent-Preview passiert nur bei explizitem `previewTargetMode: "parent"` oder explizitem Preview-Ziel.
  - Tests pruefen mit echter Restarbeiten-Registry, dass der Kurztext-Input selbst verschoben, in Breite/Hoehe geaendert und ein-/ausgeblendet wird, waehrend Gruppe, Label und Geschwister unveraendert bleiben.
- Betroffene Dateien:
  - `src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js`
  - `src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js`
  - `scripts/tests/bbmUiEditorRegistry.test.cjs`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `scripts/tests/restarbeitenModule.test.cjs`
  - `scripts/tests/restarbeitenEditorRegistry.domAnchors.test.cjs`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Fachliche Sichtpruefung in der echten Electron-DEV-App: Kurztext-Input links/rechts/hoch/runter, Breite/Hoehe, Hide/Show, Reset und Editor-aus-Aufraeumen pruefen.
- Risiken/Hinweise:
  - Keine Speicherung, keine PDF-Logik, keine Fachaktion und keine Restarbeiten-Sonderlogik in der Runtime.
  - Die fachliche Electron-Sichtpruefung bleibt als Nutzerabnahme offen.

### K19.23 - UI-Editor Preview-Panel verschiebbar machen
- Status: erledigt
- Beschreibung:
  - Das UI-Editor-Preview-Panel hat jetzt einen Drag-Header mit `data-ui-editor-preview-drag-handle="true"`.
  - Drag startet nur ueber den Header; Panel-Inhalt und Preview-Buttons starten keinen Drag.
  - Beim Drag bleibt das Panel `position: fixed`; nach dem ersten Drag werden `left` und `top` gesetzt und `right` geleert.
  - Die Position wird gegen den sichtbaren Viewport geklemmt, damit das Panel nicht vollstaendig verschwindet.
  - `Panel zuruecksetzen` setzt nur die Panelposition auf rechts oben zurueck und veraendert keine Preview-Styles am Ziel-Element.
  - Panel-`mousedown`/`click` und Preview-Buttons stoppen Default/Bubbling, damit die aktuelle Zielauswahl erhalten bleibt.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Fachliche Sichtpruefung in der echten Electron-DEV-App: Preview-Panel am Header ziehen, Panelposition zuruecksetzen, dabei Input-/Label-/Gruppen-Preview und Auswahl-Erhalt pruefen.
- Risiken/Hinweise:
  - Keine Speicherung der Panelposition; nach Deaktivieren/Aktivieren erscheint das Panel wieder an der Standardposition.
  - Keine Registry-Aenderung, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.

### K19.24 - UI-Editor Preview-Operationen als ChangeRequests sammeln
- Status: erledigt
- Beschreibung:
  - Preview-Operationen erzeugen/aktualisieren jetzt temporaere ChangeRequests in `pendingChangeRequests`.
  - Die vorhandene ChangeRequest-Struktur aus `src/renderer/editorRuntime/changeRequests/` wird wiederverwendet: `changeId`, `targetAppId`, `moduleId`, `scopeId`, `elementId`, `operation`, `payload`, `createdAt`, `source`.
  - `move` wird je Preview-Ziel kumuliert; `width` und `height` werden als Delta kumuliert; `hide`/`show` ueberschreiben eine gemeinsame `visibility`-Aenderung.
  - `Reset` entfernt ChangeRequests fuer das aktuelle Preview-Ziel; `Aenderungen verwerfen` leert alle ChangeRequests und setzt alle Preview-Styles zurueck.
  - Das Preview-Panel zeigt die Anzahl vorbereiteter Aenderungen, Operationen fuer das aktuelle Element und den Hinweis `Noch nicht gespeichert`.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_INSPEKTOR_AUFGABENHEFT.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Fachliche Sichtpruefung in der echten Electron-DEV-App: Move/Width/Height/Hide/Show, Zaehler, Reset, Aenderungen verwerfen und Editor-aus-Aufraeumen pruefen.
- Risiken/Hinweise:
  - Keine Speicherung, kein localStorage, keine DB, kein IPC-Schreibweg, keine Fachlogik, keine PDF-Logik und keine Restarbeiten-Sonderlogik in der Runtime.
  - Die vorbereiteten ChangeRequests sind bewusst nur In-Memory-Auftraege fuer einen spaeteren Speicherschritt.

### G130 - UI-Editor Hinweis/Infotext isolierter Fake-Adapter-Positivtest
- Status: erledigt
- Beschreibung:
  - Die lokale Save-Ausfuehrungsfunktion fuer Hinweis-/Infotext kann im Test
    einen isolierten positiven Pfad ausfuehren.
  - Der positive Pfad ist nur ueber explizite Test-Injection erreichbar:
    `mode: isolated-fake-adapter-positive-test`, `writeReleaseEnabled: true`,
    `gateOpen: true` und ein injizierter Fake-Adapter.
  - Der Fake-Adapter existiert nur im Test, wird bei vollstaendiger Payload
    genau einmal aufgerufen und erhaelt `restarbeitId`, `noteText`,
    `projectId`, `previewOnly: true` und `persisted: false`.
  - Der UI-Standardpfad bleibt unveraendert geschlossen: Konfiguration
    `false`, Gate geschlossen, Save-Ausfuehrung blockiert, Speicherbutton
    deaktiviert, `persisted: false` und `previewOnly: true`.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_FAKE_ADAPTER_POSITIVTEST_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Eine echte Produktivfreigabe des Restarbeiten-Notizwegs bleibt ein
    separater spaeterer Meilenstein.
- Risiken/Hinweise:
  - Kein Produktiv-Schreibweg, keine ENV-/DEV-Aktivierung, kein DB-/IPC-
    Schreibweg, kein Submit, kein Default-true, keine Wildcard und keine
    Aenderung am `UI-Editor-kit`.

### G131 - UI-Editor Hinweis/Infotext Produktiv-Save-Freigabeentscheidung
- Status: erledigt
- Beschreibung:
  - Die Freigabeentscheidung fuer einen spaeteren echten
    Hinweis-/Infotext-Produktiv-Speicherweg ist dokumentiert.
  - Das Dokument beschreibt Zielmethode
    `window.bbmDb.restarbeitenCreateNote`, Zielkanal
    `restarbeiten:createNote`, konkrete `restarbeitId` und Payload
    `restarbeitId` plus `noteText`.
  - Mindestbedingungen, nicht zulaessige Aktivierungen und Abnahmekriterien
    fuer den spaeteren echten Speichermeilenstein sind festgehalten.
  - G131 aktiviert nichts: Gate bleibt geschlossen, Konfiguration bleibt
    `false`, Speicherbutton bleibt deaktiviert, Save-Ausfuehrung bleibt
    blockiert, `persisted: false` und `previewOnly: true` bleiben bestehen.
- Betroffene Dateien:
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_PRODUKTIV_SAVE_FREIGABEENTSCHEIDUNG.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Ein echter Produktiv-Speicherweg darf erst in einem separaten
    Folgemeilenstein nach dieser Freigabeentscheidung umgesetzt werden.
- Risiken/Hinweise:
  - Kein Produktiv-Schreibweg, keine Gate-Freigabe, kein aktivierter Button,
    kein DB-/IPC-/Datei-/localStorage-Schreibweg, kein Default-true, keine
    DEV-/ENV-Aktivierung, keine Wildcard und keine Aenderung am
    `UI-Editor-kit`.

### G132 - UI-Editor Hinweis/Infotext Produktiv-Save-Adapter hinter Gate
- Status: erledigt
- Beschreibung:
  - Der BBM-Launcher hat einen lokalen Produktiv-Save-Adapter fuer den
    spaeteren Restarbeiten-Notizweg vorbereitet.
  - Die Zielsignatur ist dokumentiert und testseitig abgesichert:
    `window.bbmDb.restarbeitenCreateNote({ restarbeitId, noteText })`;
    Zielkanal bleibt `restarbeiten:createNote`.
  - Der UI-Speicherbereich zeigt zusaetzlich
    `Produktiv-Save-Adapter: vorbereitet`,
    `Produktiv-Ausfuehrung im Standardpfad: gesperrt` und die
    Produktiv-Payload `restarbeitId, noteText`.
  - Der positive Produktiv-Adaptertest laeuft nur mit expliziter
    Testfreigabe und Stub: `mode: productive-save-adapter-gated-test`,
    `writeReleaseEnabled: true`, `gateOpen: true` und
    `useProductiveAdapter: true`.
  - Erfolgs-, Fehler-, Ausnahme- und Schutzfaelle sind testseitig
    abgesichert; der Standardpfad bleibt blockiert.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_PRODUKTIV_SAVE_ADAPTER_GATED_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Eine echte Produktivfreigabe des Restarbeiten-Notizwegs bleibt ein
    separater spaeterer Meilenstein.
- Risiken/Hinweise:
  - UI-Standardpfad weiter geschlossen: Konfiguration `false`, Gate
    geschlossen, Save-Ausfuehrung blockiert, Speicherbutton deaktiviert,
    `persisted: false` und `previewOnly: true`.
  - Keine automatische Produktivfreigabe, keine DEV-/ENV-Aktivierung, kein
    Default-true, keine Wildcard, kein localStorage, kein writeFile und keine
    Aenderung am `UI-Editor-kit`.

### G133 - UI-Editor Hinweis/Infotext Speicherbutton-Freigabeentscheidung
- Status: erledigt
- Beschreibung:
  - Die Freigabeentscheidung fuer eine spaetere echte Aktivierung des
    Hinweis-/Infotext-Speicherbuttons ist dokumentiert.
  - Das Dokument beschreibt Mindestbedingungen fuer eine spaetere
    Button-Aktivierung: gueltiger Host-Kontext, `projectId`, `restarbeitId`,
    Zielkontext `Restarbeiten`, Ziel-Surface `restarbeiten.ui.main`,
    Elementtyp `Hinweis / Infotext`, gueltiger Hinweistext, vollstaendige
    Payload, explizite Schreibfreigabe-Konfiguration `true`, offenes Gate,
    verfuegbarer Save-Adapter, erreichbarer Produktiv-Save-Adapter und keine
    laufende Speicherung.
  - Harte Sperrbedingungen und spaetere Klickregeln sind festgehalten,
    inklusive Doppelklick-Schutz, sichtbarer Erfolgs-/Fehlermeldung und
    erhaltenem Entwurf bei Fehler.
  - G133 aktiviert nichts: Speicherbutton bleibt deaktiviert, Gate bleibt
    geschlossen, Konfiguration bleibt `false`, Produktiv-Save-Adapter bleibt
    nur vorbereitet, `persisted: false` und `previewOnly: true`.
- Betroffene Dateien:
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_SPEICHERBUTTON_FREIGABEENTSCHEIDUNG.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Eine echte Speicherbutton-Aktivierung bleibt ein separater spaeterer
    Meilenstein mit expliziter Freigabe.
- Risiken/Hinweise:
  - Kein Produktiv-Speicherweg, kein echter Speicherklick, kein Gate-Flip,
    keine Aenderung der Schreibfreigabe-Konfiguration auf `true`, kein
    DB-/IPC-/Datei-/localStorage-Schreibweg und keine Aenderung am
    `UI-Editor-kit`.

### G134 - UI-Editor Hinweis/Infotext Speicherbutton-Gated-Testfreigabe
- Status: erledigt
- Beschreibung:
  - Der BBM-Launcher hat eine zentrale lokale
    Speicherbutton-ViewModel-Entscheidung fuer Hinweis-/Infotext vorbereitet.
  - Im Speicherbereich ist sichtbar/testbar:
    `Button-Aktivierungspruefung: vorbereitet`,
    `Button im Standardpfad: deaktiviert`,
    `Aktivierung nur mit expliziter Freigabe` und `buttonEnabled: false`.
  - Der isolierte Positivpfad kann nur mit expliziter Testfreigabe
    `mode: save-button-gated-test-release`, `writeReleaseEnabled: true`,
    `gateOpen: true`, vollstaendiger Payload, gueltigem Host-Kontext,
    gueltigem Hinweistext, verfuegbarem Adapter und ohne laufende Speicherung
    `buttonEnabled: true` liefern.
  - Standard-, Schutz- und Positivpfad sind testseitig abgesichert; die
    positive Button-Entscheidung ruft keinen Produktiv-Save-Adapter auf.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_SPEICHERBUTTON_GATED_TESTFREIGABE_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Ein echter Speicherbutton-Klick und Produktiv-Speicherweg bleiben separate
    spaetere Meilensteine mit expliziter Freigabe.
- Risiken/Hinweise:
  - UI-Standardpfad weiter geschlossen: Konfiguration `false`, Gate
    geschlossen, Speicherbutton deaktiviert, Save-Ausfuehrung blockiert,
    Produktiv-Save-Adapter nur vorbereitet, `persisted: false` und
    `previewOnly: true`.
  - Kein Produktiv-Speicherklick, kein automatischer
    `window.bbmDb.restarbeitenCreateNote`-Aufruf, kein
    `restarbeiten:createNote`-Aufruf, kein IPC-/DB-/Datei-/localStorage-
    Schreibweg, kein Default-true, keine Wildcard und keine Aenderung am
    `UI-Editor-kit`.

### G135 - UI-Editor Hinweis/Infotext Doppelklick-/Mehrfachspeicher-Schutz
- Status: erledigt
- Beschreibung:
  - Der BBM-Launcher hat einen lokalen Save-Guard fuer Hinweis-/Infotext
    vorbereitet.
  - Sichtbar/testbar sind `Speicherschutz: vorbereitet`,
    `Save-Status`, `Doppelklickschutz: aktiv`,
    `Mehrfachspeicherung gleicher Payload: vorbereitet`,
    `Standardpfad: gesperrt` und `canStartSave: false`.
  - Der isolierte Testpfad `mode: save-guard-isolated-test` prueft
    Doppelklickschutz, Duplikatschutz nach Erfolg und Fehlerbehandlung mit
    erhaltenem Entwurf.
  - `persisted: true` ist nur im erfolgreichen isolierten Testpfad moeglich;
    der UI-Standardpfad bleibt `persisted: false` und `previewOnly: true`.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_SAVE_DOPPELKLICK_SCHUTZ_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Ein echter Speicherklick und Produktiv-Speicherweg bleiben separate
    spaetere Meilensteine mit expliziter Freigabe.
- Risiken/Hinweise:
  - UI-Standardpfad weiter geschlossen: Gate geschlossen, Speicherbutton
    deaktiviert, kein Produktiv-Speichern, `persisted: false` und
    `previewOnly: true`.
  - Keine DEV-/ENV-Aktivierung, kein Default-true, keine Wildcard, kein
    automatischer `window.bbmDb.restarbeitenCreateNote`- oder
    `restarbeiten:createNote`-Aufruf und keine Aenderung am `UI-Editor-kit`.

### G136 - UI-Editor Hinweis/Infotext Speicherklick-Pfad hinter Gate
- Status: erledigt
- Beschreibung:
  - Der BBM-Launcher hat einen lokalen Speicherklick-Pfad fuer
    Hinweis-/Infotext hinter dem bestehenden Gate vorbereitet.
  - Sichtbar/testbar sind `Speicherklick: vorbereitet`,
    `Klickpfad im Standard: blockiert`, `Letzter Klickstatus`,
    `buttonEnabled: false`, `canStartSave: false`, `persisted: false` und
    `previewOnly: true`.
  - Der isolierte Testpfad `mode: save-click-gated-test-release` prueft den
    kontrollierten positiven Klickpfad mit Stub fuer
    `window.bbmDb.restarbeitenCreateNote`.
  - Doppelklick waehrend `saving`, identische Payload nach Erfolg und
    Fehler-/Retry-Verhalten bleiben abgesichert.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_SAVE_CLICK_GATED_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Ein Produktiv-Speicherklick im normalen UI-Pfad bleibt ein separater
    spaeterer Meilenstein mit ausdruecklicher Freigabe.
- Risiken/Hinweise:
  - UI-Standardpfad weiter geschlossen: Gate geschlossen, Speicherbutton
    deaktiviert, kein Produktiv-Speichern, `persisted: false` und
    `previewOnly: true`.
  - Keine DEV-/ENV-Aktivierung, kein Default-true, keine Wildcard, kein
    automatischer `window.bbmDb.restarbeitenCreateNote`- oder
    `restarbeiten:createNote`-Aufruf, kein IPC-/DB-/Datei-/localStorage-
    Schreibweg und keine Aenderung am `UI-Editor-kit`.

### G137 - UI-Editor Hinweis/Infotext Produktiv-Speicherbutton aktiviert
- Status: erledigt
- Beschreibung:
  - Der Hinweis-/Infotext-Speicherbutton wird im BBM-Launcher nur unter
    vollstaendigen Restarbeiten-Bedingungen aktiv.
  - Erforderlich sind Host-Kontext, `projectId`, `restarbeitId`,
    Zielkontext `Restarbeiten`, Ziel-Surface `restarbeiten.ui.main`,
    Elementtyp `Hinweis / Infotext`, gueltiger Hinweistext, vollstaendige
    Payload, offene Schreibfreigabe, verfuegbarer Produktiv-Adapter, keine
    laufende Speicherung und keine bereits gespeicherte identische Payload.
  - Der echte Klickpfad ruft ausschliesslich
    `window.bbmDb.restarbeitenCreateNote({ restarbeitId, noteText })` auf.
  - Erfolg setzt `persisted: true` und `previewOnly: false`; Fehler bleibt
    `persisted: false` und `previewOnly: true` und erhaelt den Entwurf.
  - Doppelklick waehrend `saving` und identische Mehrfachspeicherung nach
    Erfolg bleiben blockiert.
  - G137-FIX trennt Editieren und Speichern wieder sauber: Das
    Hinweis-/Infotext-Textfeld bleibt fokussierbar und editierbar, auch wenn
    Gate/Button das Speichern blockieren. Die lokale Payload-Vorschau
    uebernimmt den geaenderten `noteText`.
- Betroffene Dateien:
  - `src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js`
  - `scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
  - `docs/UI_EDITOR_HINWEIS_INFOTEXT_PRODUKTIV_SAVE_AKTIVIERUNG_REFERENZSTAND.md`
  - `docs/MODULARISIERUNGSPLAN.md`
  - `STATUS.md`
- Commit:
  - nicht erstellt; Arbeitsstand bleibt uncommitted.
- Naechster offener Schritt:
  - Sicht-/Fachabnahme im Electron-UI-Pfad und danach ggf. weitere
    UX-Verfeinerung der Erfolg-/Fehleranzeige als eigener Meilenstein.
- Risiken/Hinweise:
  - Kein automatisches Speichern beim Oeffnen, keine automatische
    Restarbeit-Auswahl, keine DEV-/ENV-Aktivierung als alleinige Bedingung,
    kein Default-true ohne vollstaendige Gate-Pruefung, keine Wildcard, kein
    localStorage/writeFile und keine Aenderung am `UI-Editor-kit`.
  - Sichtpruefung bleibt fuer die konkrete Route
    `Start -> Projekte -> 04-2026 / UI-Polish fuer BBM -> Restarbeiten ->
    UI-Editor` fachlich abzunehmen.
