# M82.6 – BBM-TopScreen-Modulabschluss

## Status

M82.6 ist `[A] abgenommen`. Die TopScreen-Reparatur, die produktive Protokoll-Ziel-App-Anbindung, die automatisierte Regression und die sichtbare Abnahme in der isolierten Development-/Diagnostic-Ausgabe sind abgeschlossen.

## Struktur und Scrollbesitz

Die produktive Protokollansicht bleibt eine Flexspalte aus Kopfbereich, mittlerem Sheet-/Listenbereich und darunterliegender Editbox. Nur der vorhandene mittlere `sheetArea` scrollt; Kopf und Editbox liegen außerhalb. Der sichtbare Inhaltsbereich bleibt 940 px breit. Es wurden keine Wrapper, Viewports, Scrollcontainer, Grids, Parent-Layer oder editorbedingten DOM-Knoten ergänzt.

Bei Restarbeiten wurden die in M82.4 hinzugefügten Knoten `.bbm-restarbeiten-table-viewport` und `.bbm-restarbeiten-table-scroll-area` samt eigener Overflow-Regeln und Registryeinträge entfernt. Die Tabelle liegt wieder direkt im vorhandenen `paper`. Der vorhandene mittlere `main`-Bereich bleibt vertikaler Scrollbesitzer; Filterbereich und Editbox liegen außerhalb.

## Registry, Refs und Topologieschutz

BBM bleibt alleinige Eigentümerin seiner Registry. Der Editor liest ausschließlich die von BBM gelieferten Einträge und erzeugt keine Ziel-App-UI.

Die bestehende Protokolloberfläche ist über drei vollständige Scopes angebunden:

- `protokoll.screen.root`: 25 vorhandene Ziele,
- `protokoll.list.root`: 7 vorhandene beziehungsweise logische Ziele,
- `protokoll.edit.root`: 24 vorhandene Ziele.

TopsScreen und Quicklane registrieren ausschließlich vorhandene Objekt-Refs. Die drei logischen Listenspalten verwenden den bestehenden Mehrfach-Ref-Weg und die vorhandenen CSS-Breitenquellen; dafür wurden keine Spaltenwrapper erzeugt. Fachbuttons bleiben reine Layoutziele, ihre Ausführung und jede Fachwertänderung sind gesperrt.

Beim Modulwechsel sind nur die drei tatsächlich gemounteten Scopes aktiv. Nicht gemountete Scopes werden ohne Laufzeitbaseline blockiert und leer übertragen. Das Gesamtmanifest bleibt die verbindliche Inventarliste; seine sechs deklarierten UI-Scopes dürfen als geprüfter aktiver Modulsatz verwendet werden. Die Laufzeit-Registry wird weiterhin mit ihrem eigenen vollständigen Fingerprint validiert.

BBM bildet vor Layoutänderungen und Refreshes aus seinen ausdrücklich registrierten Refs einen Topologie-Snapshot aus Tagname, stabiler Editor-ID, Parent und Reihenfolge. Unerwartete Strukturänderungen führen zu `target_ui_topology_changed` und Rollback. Die sichtbaren Abnahmen bestätigten unveränderte Fingerprints:

- Protokoll: `sha256:5ff4c5befa71e7978a2c4e8a05f7de70512797ed59ae8bfa6e99f441b49d8f0f`,
- Restarbeiten: `sha256:35698e01c70bc07ae80519bef6b8bdee5bfe5e72007d014631e6ca29a8c757a3`.

## Sichtbare Diagnostic-Abnahme

Die paketierte Development-/Diagnostic-Ausgabe lief mit einer Kopie der Datenbank und einem temporären Benutzer-/Profilpfad. Die Oberfläche zeigte eindeutig „Entwicklungsversion – Testlizenz“. Die bestehende Benutzerlizenz, die produktive Datenbank und Fachwerte wurden nicht verändert.

Im Protokoll wurden Registry-Refresh, Direktauswahl von Label, Feld und vorhandener Gruppe, Text-/Breitenänderung mit 5 DIP, Gruppenbewegung mit 1 DIP, Undo, Speichern, Elementreset mit Undo sowie Neustart-Restore bedient. Der Manager meldete nach erneutem Öffnen einen gespeicherten, nicht doppelt angewandten Zustand. Kopf, Liste, Editbox, Quicklane, Scrollbesitz und Parent-Reihenfolge blieben unverändert.

Die vorhandene BBM-Druckvorschau erzeugte aus echten Projektdaten einen vierseitigen A4-Protokoll-Vorabzug über den bestehenden `printToPDF`- und Paginierungsweg. PDF-Fachlogik und Druckweg wurden nicht geändert.

Im Restarbeitenmodul wurden Filter, Listenauswahl, Editbox, Direktauswahl, Breitenänderung, Undo, Speichern, Profil-Recovery und Neustart-Restore bedient. Die vorhandene Ausgabevorschau zeigte die echten Restarbeitendaten als HTML und erzeugte weder PDF noch iframe-basierte PDF-Vorschau.

Das Restarbeitenmodul besitzt im aktuellen Produktstand eine HTML-Ausgabevorschau und keine PDF-Erzeugung. M82.6 verändert diesen Fachumfang nicht.

## Automatisierter Nachweis

Die M82.6-Tests sichern insbesondere:

- keine zusätzlichen Wrapper oder Scrollbereiche,
- direkte Parent-Struktur und vorhandene Scrollbesitzer,
- vollständige Protokoll-Scopes und aufgelöste vorhandene Refs,
- Mehrfach-Refs der logischen Listenspalten,
- Topologiestabilität bei Registryabruf, Refresh, Layoutänderung, Undo und Restore,
- modulbezogene Manifestvorprüfung,
- unveränderte Fachaktionssperren und Fachwertgrenze.

Die vollständigen BBM- und UI-Editor-kit-Pflichtläufe werden im Abschlussbericht mit ihren realen Ergebnissen dokumentiert. Globale BBM-Lint-Altbefunde bleiben getrennt und werden außerhalb M82.6 nicht bereinigt.

## Grenzen

Keine Restarbeiten-PDF, keine neue Editorfunktion, keine automatische DOM-Erkennung, keine zweite Registry, keine zweite Pipe, keine neue PDF-Runtime und keine Fachwertänderung wurden eingeführt. `docs/licensing.md`, Benutzerlizenz und produktive Benutzerdaten bleiben unangetastet.
