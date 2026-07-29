# M82.4 – BBM-Restarbeitenliste

## Bestätigte Inhaltstabelle

Die vorhandene Restarbeiten-Kartenliste bleibt unverändert sichtbar und fachlich bedienbar. Für die Tabellen- und Breitensteuerung ist sie ausdrücklich als UI-Inhaltstabelle mit drei zusammengefassten Hauptspalten bestätigt:

| Reihenfolge | Anzeigename | Technische Spalten-ID | Baseline | Grenzen | Modus | Umbruch / Überlauf |
|---:|---|---|---:|---:|---|---|
| 1 | Nr. / Datum / Klasse / Fotos | `restarbeiten.list.table.number` | 82 px | 50–240 px | fixed | noWrap / clip |
| 2 | Gegenstand – Verortung / Kurztext / Langtext | `restarbeiten.list.table.subject` | 560 px | 160–1200 px | proportional | wordWrap / clip |
| 3 | Fertig bis / Ampel / Status / Verantwortlich | `restarbeiten.list.table.meta` | 172 px | 110–420 px | fixed | wordWrap / clip |

Die vorhandenen Unterelemente bleiben einzeln registriert und auswählbar. Die drei Spalten ändern weder Fachwerte noch deren Zuordnung und erzeugen keine neue Tabellenansicht.

## Struktur und Direktauswahl

Der vollständige Listenscope enthält zusätzlich zu Root, Bereich und Blatt: Viewport, horizontalen Scrollbereich, Tabelle, drei Spalten, Tabellenkopf, Datenbereich, Zeilentemplate sowie je Spalte eine Header- und Datenreferenz. Tabelle, Kopf, Datenbereich, Zeile, Spalte, Überschrift, Datenbereich der Spalte, Viewport und Scrollbereich sind damit im bestehenden Baum und über die vorhandene Direktauswahl unterscheidbar. Header- und Datenziel bieten den Wechsel zur ganzen Spalte.

## Gemeinsame Breitenquelle

Die CSS-Grid-Tracks `--bbm-restarbeiten-number-column`, `--bbm-restarbeiten-subject-column` und `--bbm-restarbeiten-meta-column` sind je Spalte die einzige Breitenquelle. Derselbe `grid-template-columns`-Ausdruck steuert Tabellenkopf und jede vorhandene Kartenzeile. Der Adapter bindet Überschrift und alle sichtbaren Zellen an dieselbe Spaltenreferenz; eine Headerzelle besitzt keine eigenständige Resize-Operation.

## Viewport, Überlauf und Scrollen

Der sichtbare Listenbereich ist auf den verfügbaren BBM-Inhaltsbereich begrenzt. Der innere Scrollbereich trägt bewusst den horizontalen Überlauf, während die Tabelle selbst eine bounded width policy mit 320–1600 px und 44 px reservierter Aktionsbreite deklariert. Laufzeitmessungen liefern tatsächliche Viewport-, Tabellen- und Überlaufbreite; die Oberfläche benennt die verursachenden Spalten.

Bei normaler Breite ist „An sichtbaren Bereich anpassen“ das Standardziel. Die flexible Gegenstandsspalte wird vor den festen Randspalten verkleinert, soweit ihre Mindestbreite dies erlaubt. Bei schmaleren Fenstern bleibt ein nicht vermeidbarer Restüberlauf bewusst scrollbar; bei breiten Fenstern darf die Hauptspalte proportional Raum nutzen.

## Umbruch, Ellipsis und Zeilenhöhe

Für jede zusammengefasste Spalte können Breitenmodus, Textumbruch und Ellipsis separat gesetzt werden. Zellinhalte besitzen `min-width: 0`; lange Texte dürfen dadurch keinen Grid-Track intrinsisch verbreitern. `wordWrap` bricht innerhalb der Spalte um, `ellipsis` begrenzt den sichtbaren Text. Die Zeilenhöhe bleibt mit 54–180 px kontrolliert; Buttons, Fotos, Ampel- und Statusanzeigen werden nicht skaliert.

## Save, Restore, Reset und Discard

Spaltenbreiten und Tabellenmodi verwenden das vorhandene BBM-UI-Profil. Der Start-Restore läuft vor dem Öffnen des Editors und wendet die Werte einmal an. Spaltenreset setzt Breite, Header, Daten und Textmodus gemeinsam auf die Registry-Baseline zurück; Tabellenreset stellt alle drei Spalten und den Tabellenmodus wieder her. Scope-/Gesamtreset, Discard und Fehlerrollback verwenden unverändert den bestehenden transaktionalen Weg und berühren keine Restarbeitendaten.

## Abnahmenachweis

Automatisiert werden Registrystruktur, direkte Auswahl, Breitenkopplung, Viewportmessung, Überlauf, Fit, Mindestbreiten, feste/flexible Spalten, Umbruch, Ellipsis, Start-Restore, Reset, Discard, M82.3 sowie UI-/PDF-Regression geprüft.

Die sichtbare gepackte Development-Abnahme ergab bei ausgewählter Gegenstandsspalte unter anderem `795,46 DIP` Viewport, `864 DIP` Tabellenbreite und `68,54 DIP` bewussten horizontalen Überlauf. Schmale (900 px), mittlere (1400 px) und maximierte Fenster hielten die Liste im vorhandenen Inhaltsbereich; nicht vermeidbarer Überlauf blieb im inneren Scrollbereich. Die gespeicherte Kombination `fixed/ellipsis` wurde nach Neustart ohne Recovery-Marker wiederhergestellt. Ein Spaltenreset wechselte auf `proportional/wordWrap`; anschließendes Verwerfen stellte `fixed/ellipsis` wieder her. Die Unterzeilen zeigten sichtbar echte Ellipsis.

Die abschließende Wiederholung deckte auf, dass der interaktive Tabellenreset die validierte Ziel-App-Baseline irrtümlich erneut als Geometrierisiko bewertete und sicher zurückrollte. Der HostAdapter nimmt den vollständigen Tabellenreset sowie einen nach der eigenen Tabellen-Vorschau bestätigten Fit von dieser erneuten Laufzeit-Risikobewertung aus; freie Breiten- und Geometrieänderungen bleiben unverändert geschützt. Nach Neu-Packen meldete „Tabelle Original“ Erfolg und stellte `proportional/wordWrap/clip` sowie `718 DIP` Tabellenbreite bei `717,55 DIP` Viewport wieder her. Der bestätigte Fit meldete ebenfalls Erfolg und begrenzte die Tabelle anschließend auf `795 DIP` bei `795,26 DIP` Viewport und `0 DIP` Überlauf. Im realen Projekt 12 wurde außerdem die echte BBM-Protokoll-PDF neu erzeugt: 28 Registryelemente, aktuelle native Vorschau und zwei auswählbare A4-Seiten.
