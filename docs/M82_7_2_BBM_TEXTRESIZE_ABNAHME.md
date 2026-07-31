# M82.7.2 – BBM-`textResize`-Abnahme

Status: `[A]`

## Zentrale Ursache und Reparatur

Der bisherige Electron-Host setzte den gewünschten Zustand und meldete anschließend pauschal Erfolg. Er verglich weder Ausgangs-, Ziel- und realen Computed-Style-Wert noch erkannte er CSS-Übersteuerung oder einen unveränderten Wert. Der WPF-Host hatte denselben fehlenden Istwertnachweis; außerdem fehlten `TextBlock`-Unterstützung und ein binding-erhaltender Applyweg.

Der Editor sendet jetzt `fontSize`, `unit: "dip"` und den zuletzt gelesenen `expectedCurrentFontSize`. Der BBM-Host normalisiert und begrenzt den Wert, setzt ihn über den bestehenden expliziten Ref-Weg und liest danach `getComputedStyle(element).fontSize`. Erfolg wird nur gemeldet, wenn sich der reale Wert geändert hat und innerhalb 0,02 DIP zum akzeptierten Ziel passt. Bei Konflikt, Mismatch oder No-op erfolgt Rollback ohne Dirty, Undo oder Save.

Es gibt keine Element-Sonderbehandlung, keine neue CSS-Klasse, keinen Wrapper, keine globale CSS-Variable und keine BBM-ID im gemeinsamen Core.

## Vollständiges Inventar

Programmgesteuert gefunden und geprüft: 59 Ziele in fünf produktiven Scopes.

### `restarbeiten.header.root` – 14

- `restarbeiten.filterbar.location.level1.label`
- `restarbeiten.filterbar.location.level1.field`
- `restarbeiten.filterbar.location.level2.label`
- `restarbeiten.filterbar.location.level2.field`
- `restarbeiten.filterbar.location.level3.label`
- `restarbeiten.filterbar.location.level3.field`
- `restarbeiten.filterbar.location.level4.label`
- `restarbeiten.filterbar.location.level4.field`
- `restarbeiten.filterbar.meta.status.label`
- `restarbeiten.filterbar.meta.status.field`
- `restarbeiten.filterbar.meta.dueDate.label`
- `restarbeiten.filterbar.meta.dueDate.field`
- `restarbeiten.filterbar.meta.responsible.label`
- `restarbeiten.filterbar.meta.responsible.field`

### `restarbeiten.list.root` – 6

- `restarbeiten.list.table.number`
- `restarbeiten.list.table.subject`
- `restarbeiten.list.table.meta`
- `restarbeiten.list.table.number.header`
- `restarbeiten.list.table.subject.header`
- `restarbeiten.list.table.meta.header`

### `restarbeiten.edit.root` – 22

- `restarbeiten.edit.short.label`
- `restarbeiten.edit.short.remaining`
- `restarbeiten.edit.class.label`
- `restarbeiten.edit.class.control`
- `restarbeiten.edit.short.field`
- `restarbeiten.edit.long.label`
- `restarbeiten.edit.long.remaining`
- `restarbeiten.edit.long.field`
- `restarbeiten.edit.location.1.label`
- `restarbeiten.edit.location.1.field`
- `restarbeiten.edit.location.2.label`
- `restarbeiten.edit.location.2.field`
- `restarbeiten.edit.location.3.label`
- `restarbeiten.edit.location.3.field`
- `restarbeiten.edit.location.4.label`
- `restarbeiten.edit.location.4.field`
- `restarbeiten.edit.meta.status.label`
- `restarbeiten.edit.meta.status.field`
- `restarbeiten.edit.meta.due.label`
- `restarbeiten.edit.meta.due.field`
- `restarbeiten.edit.meta.responsible.label`
- `restarbeiten.edit.meta.responsible.field`

### `protokoll.screen.root` – 6

- `protokoll.header.title`
- `protokoll.header.keyword`
- `protokoll.header.context`
- `protokoll.header.meta.due`
- `protokoll.header.meta.status`
- `protokoll.header.meta.responsible`

### `protokoll.edit.root` – 11

- `protokoll.edit.header.label`
- `protokoll.edit.short.label`
- `protokoll.edit.short.field`
- `protokoll.edit.long.label`
- `protokoll.edit.long.field`
- `protokoll.edit.status.label`
- `protokoll.edit.status.field`
- `protokoll.edit.due.label`
- `protokoll.edit.due.field`
- `protokoll.edit.responsible.label`
- `protokoll.edit.responsible.field`

Für jedes Inventarziel wurden Ref, verbundener Zielknoten, lesbarer Ausgangswert, kleinerer, größerer und direkter Wert, No-op-Ablehnung, Undo/Reset, Save-/Start-Restore, Rerender und Registryrefresh programmgesteuert geprüft.

## Sichtbare paketierte Diagnostic-Abnahme

Die Abnahme lief ausschließlich mit `BBM (DEV).exe`, sichtbarer Kennzeichnung „Entwicklungsversion – Testlizenz“ und isolierten Testdatenbanken/-profilen unter `%TEMP%`.

Restarbeiten:

- Restzeichen Kurztext: 8,66667 → 7,667 → 8,667 → direkt 7,25 DIP
- gespeicherter Kurztextwert 7,25 DIP blieb nach vollständigem BBM-Neustart erhalten
- Profilhash vor/nach reinem Neustart-Restore blieb `B6AA5A7D8021872DBA0F21D947F36C8F3ADD14E78F4C9D717B3F3D5FC20B0A29`
- Restzeichen Langtext: 8,66667 → direkt 7,5 DIP; Undo zurück auf 8,667 DIP, während Kurztext 7,25 DIP blieb
- Kurztext-/Langtextbezeichnung und Haus-Bezeichnung: 10 → 2,75 → Undo 10 px (freie Diagnostic-Schrittweite 7,25 DIP)
- Kurztextfeld: 10,667 → 3,417 → Undo 10,667 px
- Elementreset Kurztext-Restzeichen: 7,25 → 8,667; Undo zurück auf 7,25 px
- Bewegung: reale X-Position 423,5902 → 422,5902 → Undo 423,5902 px
- Sichtbarkeit: `visible` → `hidden` → `visible`
- Registryrefresh erhielt 7,25 px

Protokoll mit drei isolierten Diagnostic-TOPs:

- Kurztextbezeichnung: 11,3333 → 10,333 → Undo 11,333 px
- Langtextbezeichnung: 11,3333 → 10,333 → Undo 11,333 px
- Kurztextfeld: 13,3333 → 12,333 px
- Datensatzwechsel auf TOP 2 erhielt 12,333 px; Registryrefresh ebenfalls
- Elementreset setzte auf die registrierte 12-DIP-Baseline; Undo stellte 12,333 px wieder her

## Rerender, Topologie und Scrollbesitzer

Explizite `textResize`-Werte werden in `persistentWorkingStateOperations` nur für den registrierten Ref gehalten und beim Ref-Rerender erneut über denselben Operationstyp angewandt. Registryrefresh und Datensatzwechsel erzeugten keine Doppelanwendung.

Die bestehenden Parentketten blieben erhalten. Sichtbar bestätigt wurden insbesondere:

- Protokoll: `protokoll.list.root` bleibt der horizontale und vertikale Scrollbesitzer unter `protokoll.screen.root`
- Restarbeiten: `restarbeiten.list.root` bleibt der vertikale Scrollbesitzer; `area`, `paper` und `table` behalten ihre vorhandene Parentkette
- keine Fachtexte, TOPs, Restarbeitenwerte, Nachbargeometrien oder Scrollcontainer wurden durch `textResize` verändert

## Automatisierte Prüfung

- fokussierter M82.7.2-BBM-Test: grün, 59/59 Ziele
- `npm test`: 8/8 Gruppen, kein OOM; größte UI-Gruppe ca. 77,9 MiB Heap
- `npm run test:node`: 8/8 Gruppen; Node 22.21.1 / ABI 127, abschließend Electron-ABI 123 wiederhergestellt
- gezieltes ESLint aller geänderten M82.7.2-JavaScriptdateien: 0 Fehler, 0 Warnungen
- globales `npm run lint`: bekannter Altbestand, 16 Fehler und 371 Warnungen; keine neue M82.7.2-Datei betroffen
- `npm run pack:diagnostic`: grün, `npmRebuild: false`
- `npm run pack`: grün, Electron-ABI und `npmRebuild: false`
- M80–M82.7.1, Tabellen-, Topologie-, Save-/Restore-/Reset- und Harness-Regressionen: grün

`docs/licensing.md`, Benutzerlizenz, Benutzerdatenbank, Fachlogik, TopScreen, PDF- und Audiofunktionen blieben unverändert.
