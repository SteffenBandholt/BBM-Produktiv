# M82.5 – BBM-Einfachmodus

Status: `[A]` – Implementierung, vollständige Pflichtprüfungen und sichtbare paketierte Endabnahme sind abgeschlossen.

## Wiederverwendeter Ziel-App-Weg

BBM bleibt Electron-Referenzapp des gemeinsamen nativen UI-Editors. Der bestehende lokale Vertrag, die M80-Registry, der Electron-HostAdapter, die M82.1-Direktauswahl, der M82.2-Risikoweg, die M82.3-Spacing-/Kompaktfunktionen, die M82.4-Tabellenspalten und der atomare Profilweg werden unverändert weiterverwendet. Es gibt keine zweite Registry, Bridge, Pipe, Editoroberfläche oder Profilablage.

## Restarbeiten-Auswahl

Die sichtbare Restarbeiten-Liste bleibt dieselbe Inhaltstabelle mit drei bestätigten Hauptspalten:

1. Nr. / Datum / Klasse / Fotos
2. Gegenstand – Verortung / Kurztext / Langtext
3. Fertig bis / Ampel / Status / Verantwortlich

Jede Spalte bleibt die gemeinsame Breitenquelle für Überschrift und Datenbereich. Die vorhandenen Unterelemente bleiben einzeln registriert und auswählbar. Anzeigenamen erscheinen im Hauptbereich; technische IDs und Rollen stehen nur unter **Erweitert / Details anzeigen**.

## Einfache Bedienung

- **Element:** Die aktuelle Spaltenbreite ist in DIP sichtbar und kann mit `-10`, `-1`, `+1`, `+10` oder direkt geändert werden. Header und Daten verwenden automatisch denselben CSS-Grid-Track. Nachbarspalten ändern sich nicht ungefragt.
- **Text:** Die drei registrierten Spaltenüberschriften geben `textResize` mit Baseline und Grenzen frei. Kleiner/größer und direkte Schriftgröße wirken über den vorhandenen HostAdapter unmittelbar auf die Überschrift, ohne die Spaltenbreite oder Fachdaten zu verändern.
- **Tabelle:** Umbruch, Ellipsis, Original und **An sichtbaren Bereich anpassen** verwenden die vorhandenen M82.4-Operationen. Langer Inhalt darf die definierte Spaltenbreite nicht selbst vergrößern.
- **Steuerkreuz und Schrittweite:** Registrierte Einzel- und Gruppenziele verwenden dieselben capability-gesteuerten Pfeile sowie 1, 5, 10 oder freie DIP-Schritte wie WPF.
- **Save, Undo und Restore:** Jede erfolgreiche Einzeländerung aktiviert Dirty, Save und Session-Undo. Speichern und Neustart-Restore laufen über den bestehenden Layoutprofilpfad; Discard und Reset bleiben unter **Erweitert** verfügbar.

Normale Text-, Element-, Gruppen- und Tabellenänderungen benötigen im Einfachmodus keine modale Rückfrage. Technisch unmögliche Werte, nicht registrierte Operationen und unerwartete Seiteneffekte bleiben blockiert beziehungsweise werden zurückgerollt.

## Sicherheit

Die Registry enthält ausschließlich Layoutmetadaten. Restarbeitenwerte, Kundendaten, Datenbankinhalte und Fachaktionen werden weder gelesen noch geändert. Druck- und PDF-Fachlogik bleiben unverändert. `docs/licensing.md` und die Benutzerlizenz sind ausdrücklich ausgeschlossen.

## Prüfung

- BBM-Einzeltest: `scripts/tests/m82-5BbmSimpleEditorMode.test.cjs`
- Gemeinsame Core-/WPF-Tests im UI-Editor-kit
- BBM-Gesamttests, Node-Test, gezieltes ESLint, globales Lint und Pack
- Sichtbare Abnahme mit paketierter BBM und normalem Benutzerprofil

Die paketierte Development-Abnahme belegte den standardmäßig geöffneten Einfachmodus, geschlossene erweiterte Angaben, verständliche Anzeigenamen und technische IDs ausschließlich unter **Details anzeigen**. Spaltenbreite, Überschriftenschrift, Gruppe, Tabelle und Fit wurden über den vorhandenen HostAdapter geändert. Save, vollständiger Neustart-Restore und zwei exakte Undo-Schritte blieben ohne Doppelanwendung stabil; die Auswahl blieb auch nach dem erforderlichen Registry-Refresh erhalten. Bei 760, 1180 und 1550 Pixel Managerbreite blieben Einfachmodus, Undo und Save erreichbar.

Im normalen Benutzerprofil wurde anschließend über den unveränderten BBM-Druckweg eine echte zweiseitige Protokoll-PDF erzeugt. Der PDF-Arbeitsbereich lud 28 Registryelemente und zeigte beide Seiten als aktuelle Vorschau. Fachwerte, Datenbank, Benutzerlizenz und `docs/licensing.md` blieben bytegleich; die erzeugte temporäre PDF und Abnahmescreenshots wurden entfernt.
