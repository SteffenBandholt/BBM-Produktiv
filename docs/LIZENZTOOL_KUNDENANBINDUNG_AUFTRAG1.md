# Internes Lizenztool – verbindlicher Bedien- und Paketablauf

Stand: 2026-09-17
Grenze: internes DEV-Werkzeug; kein Commit, Merge oder Push; kein echter Lizenz-/Setup-Lauf durch Codex.

## Einstieg und Schutzgrenze

- Der einzige sichtbare Einstieg liegt in BBM-Dev unter `Einstellungen → Lizenztool → Tool starten`.
- BBM startet Electron direkt aus `C:\01_Projekte\license-tool`. Eine gebaute Lizenztool-EXE und eine lokale EXE-Auswahl sind nicht erforderlich.
- Gepackte BBM-Versionen, Abnahmeprofile und Kundendistributionen dürfen den Einstieg nicht anzeigen oder starten.
- Kundenpakete enthalten weder Lizenztool noch Generator, private Schlüssel, interne Anleitung oder UI-Editor.

## Kundenquelle

BBM registriert beim tatsächlichen Toolstart ausschließlich Quellen-ID, Rolle und Vertragsversion in `app_settings` und übergibt den kanonischen aktiven Datenbankpfad im validierten Startkontext. Das Lizenztool öffnet diese SQLite-Datenbank nur lesend und listet ausschließlich aktive globale Rechnungskunden. Es gibt keine zweite Kundenpflege und keine Ersatzkundenliste.

Vor dem Paketlauf wird der Kunde anhand seiner stabilen `firms.id` erneut gelesen. Ein gelöschter, nicht mehr als Rechnungskunde markierter oder zwischenzeitlich geänderter Datensatz blockiert den Vorgang mit einem konkreten nächsten Schritt. Quellen- und Firmenkennungen gelangen nicht in die signierte Lizenz.

## Ein-Klick-Ablauf

Der sichtbare Hauptbutton `Lizenz und Setup bauen` führt in dieser Reihenfolge aus:

1. Kunden- und Lizenzeingaben prüfen,
2. Lizenz mit dem lokal konfigurierten privaten Schlüssel signieren,
3. Lizenz mit dem öffentlichen BBM-Schlüssel verifizieren,
4. vorhandenes `BBM-Produktiv/scripts/dist.cjs` mit isoliertem Kunden-Ausgabeordner starten,
5. Installer und beide paketbezogenen Anleitungen prüfen und ablegen,
6. Paketstatus erst dann auf `Fertig` setzen.

Währenddessen ist der Hauptbutton gesperrt und der Fortschritt sichtbar. Ohne Signierschlüssel nennt die Oberfläche den Einrichtungsschritt. Ein Fehler hält den erreichten Schritt, Fehlercode, nächsten Schritt und – falls vorhanden – das interne Build-Protokoll fest. Wiederholungen erzeugen immer einen neuen Ordner.

## Ablagevertrag

Der feste sichtbare Stammordner ist:

`Dokumente\BBM-Lizenzpakete`

Jeder Lauf erhält einen eigenen Ordner aus Kunde, Lizenz-ID, BBM-Version und UTC-Zeitstempel. Bei einer Kollision wird eine fortlaufende Endung ergänzt. Der Ordner enthält:

- `Paketstatus.json` mit Status, erreichtem Schritt und Dateizuordnung,
- `Anleitung-fuer-Steffen.html`,
- `Intern-nicht-weitergeben\<Lizenz-ID>_<Kunde>.bbmlic`, optional mit internem Build-Protokoll,
- `Weitergabe-an-Lizenznehmer\<konkreter Installername>.exe`,
- `Weitergabe-an-Lizenznehmer\Anleitung-fuer-Lizenznehmer.html`.

Nur `Weitergabe-an-Lizenznehmer` wird übergeben. Die Lizenz wird in den Installer eingebettet und beim ersten BBM-Start automatisch übernommen; die Kundenanleitung nennt deshalb keine widersprüchliche Importalternative.

## UI-/Editor-Entscheidung

Die BBM-Einstiegskarte und die Lizenztool-Oberfläche sind operative DEV-/Maschinenraum-UI und nicht editorfähig. Kundenauswahl, Lizenzfelder, Build, Öffnen, Schließen, Historie sowie Datei-, Datenbank-, Signier- und Buildaktionen sind keine Editorziele. Deshalb gibt es keine `data-ui-*`-Attribute, Registry-Einträge oder Editoroperationen. Die Pakethistorie ist eine Bedienliste, keine fachliche Inhaltstabelle für den Tabellenlayout-Editor.

Die normale Bedienung liegt ohne äußeres Scrollen auf einer Bildschirmseite; Kunden und Historie sind kompakt begrenzt. `Schließen`, Ausgabeordner, Fortschritt, Hauptbutton und letzte Pakete bleiben sichtbar.

## Prüfgrenze

- Signieren und Installerbau werden in automatischen Ablaufprüfungen ersetzt; Erfolg, Verifikationsfehler, Buildfehler, unvollständiger Status und kollisionsfreie Wiederholung sind isoliert geprüft.
- Der echte Lizenz-/Setup-Lauf wird nicht automatisiert ausgelöst. Steffen führt ihn nach der Bedienabnahme selbst aus.
- UI-Editor-Vertragscheck: keine editorrelevanten Elemente in den beiden operativen Oberflächen.
