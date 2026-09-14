# BBM Rechnung RE-S1.1 – Stammdaten und Leistungskatalog

Stand: 14.09.2026, technischer Abschluss im bestehenden PR #348

## Fachlicher Endstand

Die vorhandene Pflege unter `Einstellungen > Profil / Adresse` ist die einzige
aktive Quelle für die eigene Organisation und damit für den Rechnungsaussteller.
Rechnungsentwurf, Proberechnung und neue Buchung lesen den jeweils aktuellen
`user_profile`-Stand über die bestehende `OwnOrganization`-Grenze. Name,
Namenszusatz, vollständige Anschrift, Kontakt, Logo, Steuer-, Bank-, Register- und
Vertretungsangaben werden in den Ausstellersnapshot übernommen.

Bereits gebuchte Rechnungen lesen weiterhin ihren gespeicherten Snapshot. Eine
spätere Profiländerung verändert weder diesen Snapshot noch eine vorhandene finale
PDF-Datei oder deren Datenbankreferenz. Die historische Tabelle
`invoice_issuer_profiles` bleibt migrations- und bestandsseitig erhalten, ist aber
keine aktive Lese- oder Schreibquelle mehr. Ihre Werte werden weder gelöscht noch
in `user_profile` zurückkopiert.

Die zusätzliche Seite „Rechnungsstammdaten“ samt Rechnungsteller- und Kundenpflege
ist entfernt. Kunden werden ausschließlich in der gemeinsamen Firmenverwaltung
angelegt und bearbeitet; der vorhandene Kundenpicker im Rechnungsentwurf bleibt
unverändert erhalten.

## Leistungskatalog

Die Rechnungsübersicht besitzt einen direkten Einstieg „Leistungskatalog“.
Katalogauswahl, Anlage, Änderung und Speicherung verwenden die vorhandenen
Rechnungsdienste und dieselbe SQLite-Datei. Die Anzeige bleibt auf die zentrale
Rechnungsvorgabe 19 Prozent begrenzt; es gibt keine Steuersatzauswahl.

Der Katalog ist innerhalb von `.rechnung-live-content` ein lokaler, auf die
verfügbare Höhe begrenzter Scrollbereich. Dadurch bleiben Kopf, Formular sowie
Anlage- und Speicherbutton auch bei niedriger Fensterhöhe per normalem Scrollen
erreichbar. Es wurde keine globale CSS-Regel und kein neues Navigationskonzept
eingeführt.

## UI-Editor-Vertrag

Der Scope `rechnung.screen` enthält 107 aus dem realen Komponentenvertrag
abgeleitete Ziele. Alle `rechnung.masterData*`-Ziele und
`rechnung.overview.masterData` sind entfernt. Neu beziehungsweise umbenannt sind
der direkte Einstieg `rechnung.overview.catalog` und der vollständige Teilbaum
`rechnung.catalog*`. Sichtbare Buttons bleiben ausschließlich als Layoutobjekte
editorfähig; Ausführen, Fachdaten ändern, Anlegen und Löschen sind gesperrt.

Die Katalogauswahl ist eine Bedienliste, keine Inhaltstabelle. Tabellenlayout-
Registry, PDF-Vertrag und PDF-Ausgabe sind nicht betroffen. Die vollständige
Entwurfsentscheidung steht in
`docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md`.

## Technischer Nachweis

Der gezielte Persistenztest verwendet eine dateibasierte SQLite-Datenbank. Sein
historischer PDF-Bytevergleich bleibt ausdrücklich ein synthetischer
Dateireferenz-Guard; er wird nicht als Nachweis einer durch Electron erzeugten
PDF ausgegeben. Der Test prüft nach erneutem Öffnen:

- zwei unverwechselbare gemeinsame Rechnungskunden,
- drei unverwechselbare Katalogleistungen einschließlich Änderung und 19 Prozent,
- vollständige aktuelle Ausstellerwerte in Vorschau und neuer Buchung,
- unveränderten historischen Ausstellersnapshot,
- unveränderte historische Profilkopie sowie PDF-Referenz und PDF-Bytes.

Der zusätzliche Befehl `npm run test:rechnung:re-s1.1:pdf` führt einen
automatisierten Electron-Nachweis in einem frisch erzeugten Temp-Profil aus. Er
verwendet den produktiven Weg `Preload -> Rechnung-IPC -> InvoicePdfFinalizer ->
printIpc -> BrowserWindow.webContents.printToPDF`. Der Lauf vom 14.09.2026 war
grün und belegte:

- frische isolierte `app.db`, deaktivierten Legacy-Import und ausschließlich
  PDF-Pfade innerhalb des Temp-Profils,
- Buchung `2026-0001` mit dem ersten vollständigen Ausstellersnapshot und echter
  einseitiger PDF (20.971 Bytes,
  `4de3cb9c71caa0f0f8878ffb742e5f2cff4885a1bfd51a199ec618610e9c6f4d`),
- nach Änderung von Unternehmensadresse und Bankdaten Buchung `2026-0002` mit
  den aktuellen Werten und eigener echter einseitiger PDF (20.923 Bytes,
  `4e66c2787c35e54b918f8b530c864db1e85d4d42fad1d933a0fe6d01fc4281c1`),
- nach Schließen und Wiederöffnen der SQLite-Datenbank den unveränderten ersten
  Snapshot, dieselbe Dateireferenz, dieselbe Bytezahl und denselben PDF-Hash;
  die READY-Prüfung löste kein erneutes Rendern aus.

Der vollständige Bericht liegt für diesen Lauf ausschließlich im temporären
Pfad
`C:\Users\Steffen\AppData\Local\Temp\bbm-ui-editor-acceptance-Ar0ugW\rechnung-re-s1.1-pdf-result.json`.
Dies ist eine automatisierte Electron-Prüfung, keine neue Computer-Use- oder
manuelle Bedienabnahme. Die bereits bestätigten Bedienprüfungen wurden nicht
wiederholt.

## Einordnung der GitHub-Prüfung

Run 34774197021 / Job 103769166990 lief auf Head `e8bb36f9`. `npm ci` konnte die
lokale Abhängigkeit `file:../UI-Editor-kit` im isolierten GitHub-Checkout nicht
mit den benötigten Kit-Inhalten bereitstellen. Unter anderem fehlten
`dist/ui-component-contract.mjs` und
`src/core/target-app-adapter-manifest.cjs`. Das ist ein CI-/Umgebungsfehler; die
Abhängigkeitsdeklaration und der Workflow sind zwischen Basis und Head
unverändert. Mit dem vorhandenen vertrauenswürdigen Kit lassen sich beide Module
auf Basis und Head laden.

Die drei Popup-Assertions und vier fachlich echte Lizenz-Assertions sind auf der
Basis `9997910f` und auf dem Head identisch rot; in den betroffenen Produkt- und
Testdateien gibt es keinen PR-Diff. Die fünfte Lizenzmeldung des GitHub-Jobs
(`moduleAccessState`) ist ebenfalls der fehlenden Kit-Datei zugeordnet und läuft
lokal mit vorhandenem Kit grün. Damit weist der Job keine neue RE-S1.1-Regression
nach. Popup-, Lizenz-, Kit- oder allgemeine CI-Reparaturen wurden nicht
durchgeführt.

Komponenten-, Ref-, Manifest- und Fingerprint-Prüfungen werden weiterhin aus dem
realen Vertrag abgeleitet.

RE-S1.2, Buchungsfachausbau, PDF-/ZUGFeRD-Arbeit, neue Persistenz, neue IPC-Kanäle
und Änderungen an der gemeinsamen Firmenverwaltung sind nicht Bestandteil dieser
Korrektur.
