# UI-Editor fehlende Grundlagen Stopp-Entscheidung

## Kurzfazit

Nach Grundlagen 2/3 sind nun vier Minimal-Grundlagen regulaer vorhanden:
`docs/EDITOR_BAUPLAN.md`, `docs/ZIEL_APP_ANBINDUNG.md`,
`docs/UI_ELEMENT_KATALOG.md` und `docs/UI_BAU_UND_PRUEFREGELN.md`. Diese
Stopp-Entscheidung bleibt als Dokumentation des damaligen G90-Stopps bestehen;
vollstaendige UI-/PDF-Umsetzungen bleiben wegen der verbleibenden PDF-/Plan-
Grundlage weiterhin nicht automatisch freigegeben.

G90 bleibt gestoppt. Die fuer UI-/PDF-Umsetzungen laut Projektregeln
verpflichtenden UI-Editor-Grundlagen sind im Repo nicht vollstaendig
vorhanden. Deshalb darf der sichtbare Hinweis zur Surface-Auswahl nicht
umgesetzt werden, solange keine Grundlage nachgezogen oder keine ausdrueckliche
Freigabeentscheidung getroffen wurde.

```text id="g90a_stop_kernsatz"
G90 bleibt gestoppt. Ein sichtbarer UI-Hinweis zur Surface-Auswahl darf erst umgesetzt werden, wenn die laut Projektregeln verpflichtenden UI-Editor-Grundlagen vorhanden oder durch eine ausdrueckliche Entscheidung ersetzt/freigegeben sind.
```

## Ausgangslage nach G89

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` bleibt read-only sichtbar.
- `plan.canvas.default` bleibt read-only sichtbar.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
- Die Surface-Auswahl bleibt read-only Kontextanzeige und keine aktive
  Surface-Umschaltung.
- Es gibt weiterhin kein Drag, kein Resize und keine Persistenz.

## Grund des G90-Stopps

G90 wollte einen sichtbaren UI-Hinweis im bestehenden UI-Editor-Panel
ergaenzen. Damit waere eine sichtbare UI-Aenderung betroffen. Fuer solche
UI-/PDF-Aufgaben verlangt `AGENTS.md` vor der Umsetzung die Beachtung der
fuehrenden UI-Editor-Unterlagen und eine vollstaendige UI-/PDF-
Entwurfsentscheidung. Die fuehrenden Unterlagen sind aktuell nicht vollstaendig
vorhanden.

## Fehlende Pflichtunterlagen

Die folgende Existenzpruefung ergab am Paketbeginn:

- `docs/UI_ELEMENT_KATALOG.md`: fehlt
- `docs/UI_BAU_UND_PRUEFREGELN.md`: fehlt
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`: fehlt

Vorhanden ist inzwischen:

- `docs/UI_EDITOR_VERTRAG.md`
- `docs/EDITOR_BAUPLAN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`
- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`

## Regelquelle / Stop-Regel

Ausloesend ist der AGENTS-Block UI-Editor:

- Vor jeder UI- oder PDF-Umsetzung muessen die fuehrenden Unterlagen beachtet
  werden.
- Wenn eine dieser Grundlagen fehlt oder unklar ist: STOPP.
- Wenn die Entwurfsentscheidung fehlt oder unvollstaendig ist: STOPP.
- Keine UI- oder PDF-Struktur darf als fertig gemeldet werden, wenn die
  Stop-Regel greift.

Zusaetzlich verlangt `AGENTS.md` fuer UI-/PDF-Aufgaben vor der Umsetzung eine
UI-/PDF-Entwurfsentscheidung. Ohne vollstaendige Entscheidung darf Codex nicht
bauen.

## Warum keine Improvisation erlaubt ist

Die fehlenden Grundlagen definieren Vertrag, Katalog, Bau-/Pruefregeln,
Ziel-App-Anbindung und Entwurfsentscheidung fuer UI-/PDF-Arbeiten. Sie duerfen
nicht durch Platzhalter ersetzt werden, weil dadurch unklar waere, welche
Elemente editorfaehig sind, welche Operationen erlaubt sind und welche
fachlichen Aktionen weiterhin gesperrt bleiben muessen.

Dieses Paket legt deshalb keine der fehlenden Pflichtdateien an und erzeugt
keine Ersatzinhalte.

## Bis zur Klaerung blockierte Arbeiten

- sichtbare UI-Aenderungen am UI-Editor-Panel
- Surface-Auswahl-Hinweis im UI
- echte Surface-Umschaltung
- SurfaceInfo-Umbau
- Drag
- Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege

## Weiterhin erlaubte Arbeiten

- reine Bestandspruefung
- Stop-/Entscheidungsdokumentation
- Regelpruefung
- Planungs-/Statuspflege
- Vorbereitung einer Freigabeentscheidung durch den Nutzer

## Entscheidungsempfehlung

Vor einer erneuten G90-Umsetzung sollte fachlich entschieden werden, ob die
fehlenden UI-Editor-Grundlagen in BBM-Produktiv nachgezogen werden oder ob fuer
dieses eng begrenzte Hinweis-Paket eine ausdrueckliche Ersatz-/Freigabe-
entscheidung gilt.

Ohne diese Klaerung bleibt G90 gestoppt.

## Naechster sauberer Schritt

Naechster sauberer Schritt ist eine ausdrueckliche Nutzerentscheidung:

- entweder die fehlenden Grundlagen vollstaendig bereitstellen,
- oder eine begrenzte, dokumentierte Freigabeentscheidung fuer den kleinen
  read-only Hinweis treffen.

Erst danach darf ein neues Umsetzungspaket fuer den sichtbaren Hinweis geplant
werden.

## Nachtrag G91

- Die Freigabe-/Ersatzentscheidung ist in
  `docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md` vorbereitet.
- G91 erteilt keine Ersatzfreigabe.
- Die fehlenden Pflichtunterlagen werden weiterhin nicht improvisiert angelegt.
- G90 bleibt bis zu einer ausdruecklichen Nutzerentscheidung blockiert.

## Nachtrag G92

- Die Bedarfsanalyse ist in
  `docs/UI_EDITOR_GRUNDLAGEN_BEDARFSANALYSE.md` vorbereitet.
- G92 ersetzt keine Pflichtunterlage und erteilt keine Freigabe.
- Die fehlenden Pflichtunterlagen werden weiterhin nicht angelegt.
- G90 bleibt blockiert, bis die Grundlagen regulaer erstellt oder eine
  ausdrueckliche Entscheidung fuer einen eng begrenzten Folgepfad vorliegt.

## Nachtrag Grundlagen 1/3

- `docs/EDITOR_BAUPLAN.md` wurde als knappe Minimal-Grundlage erstellt.
- `docs/ZIEL_APP_ANBINDUNG.md` wurde als knappe Minimal-Grundlage erstellt.
- Die Dokumente bestaetigen `restarbeiten.ui.main` als Host-/Bestandssurface
  und `pdf.plan.page.1` sowie `plan.canvas.default` als read-only Kontexte.
- Weiterhin nicht freigegeben sind aktive Surface-Umschaltung, Drag, Resize,
  Persistenz, PDF-/Plan-Bearbeitung sowie DB-/IPC-Schreibwege.
- Die uebrigen Pflichtunterlagen bleiben offen.

## Nachtrag Grundlagen 2/3

- `docs/UI_ELEMENT_KATALOG.md` wurde als knappe Minimal-Grundlage erstellt.
- `docs/UI_BAU_UND_PRUEFREGELN.md` wurde als knappe Minimal-Grundlage erstellt.
- Die Dokumente bestaetigen die aktuell zulässigen Element- und Kontextarten
  sowie die Bau-/Pruefpflichten fuer kleine UI-Aenderungen.
- Weiterhin nicht freigegeben bleibt die PDF-/Plan-Grundlage.
