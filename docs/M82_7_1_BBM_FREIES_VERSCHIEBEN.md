# M82.7.1 – BBM-Restzeichenanzeigen frei verschieben

## Status

M82.7.1 ist `[A] abgenommen`. Die gezielte Reparatur entfernt ausschließlich die willkürliche elementbezogene Verschiebegrenze und verhindert wirkungslose Aktionen im vorhandenen Einfachmodus.

## Ursache und Reparatur

Die beiden Restzeichenanzeigen hatten zusätzlich zur technischen Profilgrenze eine lokale `maximumOffset`-Grenze von ±12 Pixeln. Nach wenigen Schritten lehnte der HostAdapter weitere Bewegungen ab, obwohl das Element visuell weiter verschoben werden konnte.

Die beiden Elemente verwenden jetzt den allgemeinen Geometrievertrag ohne diese visuelle Sondergrenze. Die bestehende technische Persistenzgrenze von ±2400 Pixeln bleibt erhalten und wird verständlich gemeldet. Registry, Parents, Capabilities, HostAdapter, Undo, Save, Restore und Topologie bleiben dieselben.

Ein während der sichtbaren Abnahme gefundener operationsbezogener Fehler wurde ebenfalls lokal behoben: Eine reine `move`-Operation darf nur X/Y anwenden und nicht gleichzeitig eine vor dem CSS-Start-Restore gemessene Schriftgröße persistieren. Renderübergreifend werden deshalb nur ausdrücklich ausgeführte Operationen erneut angewandt.

## Verhalten

- Wiederholte 5- und 10-Pixel-Schritte addieren sich zuverlässig.
- Direkte X-/Y-Werte verwenden denselben Change-Request-Weg.
- Links/Rechts und Oben/Unten sind bis zur technischen Grenze symmetrisch.
- Erfolgreiche Aktionen liefern den kumulativen alten und neuen Wert.
- Technische Ablehnung oder unveränderter Zustand erzeugen keinen zusätzlichen Dirty-/Undo-Eintrag.
- Undo, Save, Neustart-Restore und Originalzustand verwenden unverändert den bestehenden Profilweg.
- Fachwerte, Zeichenlimits, Zählerlogik, Registrystruktur, Nachbarelemente und Scrollbesitz bleiben unverändert.

## Nachweis

Automatisierte Tests decken wiederholte Bewegung, Direktwerte, ±2400/±2401, ungültige Zahlen, nicht erlaubte Operationen, Undo, Save/Restore, Reset, Registry-Refresh und Topologie ab. Der gemeinsame WPF-Test prüft außerdem Hostfehler, unveränderte Zustände und die eindeutige Statusmeldung.

Die gepackte BBM-Diagnostic-Ausgabe wurde mit eigenem `user-data-dir` und isolierter Testdatenbank sichtbar bedient. Kurztext- und Langtextanzeige wurden mehrfach in beide Richtungen, direkt auf X = -75 / Y = 35, per Undo sowie nach Save/Neustart geprüft. Beide Zustände wurden einmalig wiederhergestellt; Schrift, Sichtbarkeit und Originalzustand blieben wirksam. Die lange Liste scrollte weiterhin innerhalb ihres vorhandenen Bereichs, Editbox und Nachbarelemente behielten ihre Position, und die vorhandene Restarbeiten-Ausgabevorschau blieb bedienbar.

Für die sichtbare Protokoll-Regression wurde ausschließlich in einer zweiten isolierten Diagnostic-Testdatenbank ein minimales Diagnoseprojekt mit leerem Diagnoseprotokoll angelegt. Der echte TopScreen öffnete mit unverändertem Kopf, Listenbereich, Editbox, Quicklane und Scrollstruktur. Die Testdatenbank wurde anschließend vollständig entfernt; Benutzer- und Produktivdaten wurden weder gelesen noch verändert.

Es wurden keine Benutzerdateien, Profile, PDFs, Screenshots oder Diagnostic-Daten übernommen. `docs/licensing.md`, Benutzerlizenz und Benutzerdatenbank blieben unangetastet.
