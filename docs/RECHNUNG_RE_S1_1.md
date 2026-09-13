# BBM Rechnung RE-S1.1 – Stammdaten und Leistungskatalog

Stand: 13.09.2026, abschließende Korrektur im bestehenden PR #348

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

Der gezielte Persistenztest verwendet eine dateibasierte SQLite-Datenbank und
prüft nach erneutem Öffnen:

- zwei unverwechselbare gemeinsame Rechnungskunden,
- drei unverwechselbare Katalogleistungen einschließlich Änderung und 19 Prozent,
- vollständige aktuelle Ausstellerwerte in Vorschau und neuer Buchung,
- unveränderten historischen Ausstellersnapshot,
- unveränderte historische Profilkopie sowie PDF-Referenz und PDF-Bytes.

Komponenten-, Ref-, Manifest- und Fingerprint-Prüfungen werden aus dem realen
Vertrag abgeleitet. Eine tatsächliche Windows-/Electron-Bedienprüfung und mögliche
Umgebungsgrenzen werden ausschließlich im Abschluss des Arbeitslaufs berichtet.

RE-S1.2, Buchungsfachausbau, PDF-/ZUGFeRD-Arbeit, neue Persistenz, neue IPC-Kanäle
und Änderungen an der gemeinsamen Firmenverwaltung sind nicht Bestandteil dieser
Korrektur.
