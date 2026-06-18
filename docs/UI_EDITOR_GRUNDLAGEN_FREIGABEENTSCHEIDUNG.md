# UI-Editor Grundlagen Freigabeentscheidung

## Kurzfazit

Nach Grundlagen 3/3 sind nun alle fuenf Minimal-Grundlagen regulaer vorhanden:
`docs/EDITOR_BAUPLAN.md`, `docs/ZIEL_APP_ANBINDUNG.md`,
`docs/UI_ELEMENT_KATALOG.md`, `docs/UI_BAU_UND_PRUEFREGELN.md` und
`docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`. G91 bleibt als Entscheidungsdokument
fuer den damaligen Stopp erhalten; eine pauschale Ersatzfreigabe wurde
weiterhin nicht erteilt.

G91 bereitet nur die Entscheidung vor, wie mit den fehlenden UI-Editor-
Grundlagen umzugehen ist. Es wird keine Ersatzfreigabe erteilt, keine
Pflichtunterlage improvisiert und keine UI umgesetzt. G90 bleibt bis zu einer
ausdruecklichen Nutzerentscheidung blockiert.

G90 bleibt bis zur Nutzerentscheidung blockiert.

## Ausgangsstand nach G90a

- G90 bleibt gestoppt.
- Kein sichtbarer UI-Hinweis wurde eingebaut.
- Keine Produktivlogik wurde geaendert.
- Keine sichtbare UI wurde geaendert.
- Die fehlenden Pflichtunterlagen und die Stop-Regel sind in
  `docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md` dokumentiert.
- Die Surface-Auswahl bleibt read-only Kontextanzeige und keine aktive
  Surface-Umschaltung.

## Nachgezogene Pflichtunterlagen

Alle fuenf Minimal-Grundlagen sind jetzt vorhanden:

- `docs/EDITOR_BAUPLAN.md`
- `docs/ZIEL_APP_ANBINDUNG.md`
- `docs/UI_ELEMENT_KATALOG.md`
- `docs/UI_BAU_UND_PRUEFREGELN.md`
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md`

G91 selbst hat diese Dateien nicht angelegt; sie wurden erst mit Grundlagen
1/3, 2/3 und 3/3 regulaer erstellt.

## Geltende Stop-Regel

Der AGENTS-Block UI-Editor verlangt vor jeder UI- oder PDF-Umsetzung die
Beachtung der fuehrenden Unterlagen. Wenn eine dieser Grundlagen fehlt oder
unklar ist, gilt STOPP.

Zusaetzlich muss vor jeder UI-/PDF-Umsetzung eine vollstaendige UI-/PDF-
Entwurfsentscheidung vorliegen. Ohne diese Entscheidung darf nicht gebaut
werden.

## Warum keine Improvisation zulaessig ist

Die fehlenden Grundlagen sind Steuerungsunterlagen fuer editorrelevante UI- und
PDF-Arbeiten. Sie duerfen nicht durch Platzhalter oder erfundene Inhalte ersetzt
werden, weil sonst unklar waere:

- welche Elemente editorfaehig sind,
- welche Elementarten und Operationen gelten,
- welche Parent-Struktur verbindlich ist,
- welche Pruefung greift,
- welche fachlichen Aktionen gesperrt bleiben.

G91 erzeugt deshalb nur eine Entscheidungsgrundlage und keine Ersatzunterlagen.

## Entscheidungsoptionen

### Option A: Pflichtunterlagen vollstaendig und regulaer erstellen

- Sauberste Variante.
- G90 bleibt bis dahin blockiert.
- Spaetere UI-/PDF-/Editor-Umsetzungen erhalten eine volle Grundlage.
- Die Stop-Regel wird regulaer aufgeloest, sobald die Unterlagen vorhanden und
  fachlich freigegeben sind.

Konsequenz:
- Hoeherer Vorbereitungsaufwand.
- Danach belastbare Grundlage fuer mehr als nur den kleinen Hinweis.

### Option B: Ausdrueckliche Ersatzfreigabe nur fuer den kleinen read-only Hinweis

- Nur moeglich durch klare Nutzerfreigabe.
- Darf keine allgemeine UI-/PDF-Freigabe sein.
- Gilt ausschliesslich fuer den Hinweis:
  `Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.`
- Weiterhin keine aktive Umschaltung, kein Drag, kein Resize, keine Persistenz.

Konsequenz:
- G90 koennte als eng begrenztes Hinweis-Paket erneut geplant werden.
- Alle anderen UI-/PDF-/Editor-Arbeiten bleiben weiter durch die fehlenden
  Pflichtunterlagen blockiert.

### Option C: G90 dauerhaft verwerfen

- Keine UI-Aenderung.
- Bestehender Doku-/Test-Stand bleibt erhalten.
- Der G90-Hinweis wird nicht umgesetzt.

Konsequenz:
- Kein weiterer Aufwand fuer dieses Hinweis-Paket.
- Die historische Grundlagenluecke ist inzwischen geschlossen.

### Option D: Stopp beibehalten und zunaechst Grundlagen-Bedarfsanalyse erstellen

- Keine Pflichtunterlagen improvisieren.
- Nur klaeren, welche Inhalte diese Unterlagen spaeter enthalten muessen.
- G90 bleibt waehrenddessen blockiert.

Konsequenz:
- Geringeres Risiko als eine direkte Ersatzfreigabe.
- Vorarbeit fuer eine spaetere regulaere Erstellung der Grundlagen.

## Empfehlung

```text id="g91_empfehlung"
Empfehlung:
Keine Ersatzfreigabe pauschal erteilen. Zuerst entweder die fehlenden Pflichtunterlagen regulaer erstellen oder eine eng begrenzte Nutzerentscheidung nur fuer den kleinen read-only Kontext-Hinweis dokumentieren.
```

## Konsequenzen je Option

- A: hoechste Regelklarheit, G90 erst nach vollstaendigen Grundlagen.
- B: kleinster Weg fuer genau einen Hinweis, aber nur mit ausdruecklicher
  Nutzerfreigabe und ohne allgemeine Freigabewirkung.
- C: kein UI-Risiko, aber der gewuenschte Hinweis bleibt aus.
- D: kontrollierte Vorarbeit, aber G90 blieb vor der Regelklaerung blockiert.

## Weiterhin blockierte Arbeiten

- sichtbare UI-Aenderungen am UI-Editor-Panel
- Surface-Auswahl-Hinweis im UI
- SurfaceInfo-Umbau
- aktive Surface-Umschaltung
- Drag
- Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege

## Naechster sauberer Schritt

G92 hat die reine Bedarfsanalyse der fehlenden Grundlagen vorbereitet.
Grundlagen 1/3, 2/3 und 3/3 haben die Minimal-Grundlagen fuer Bauplan,
Ziel-App-Anbindung, Elementkatalog, Bau-/Pruefregeln und PDF-/Plan-
Entwurfsentscheidung erstellt. Spaetere UI-/PDF-Umsetzungen bleiben dennoch
getrennt an die Stop-Regel gebunden.
