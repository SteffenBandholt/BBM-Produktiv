# M80.2 – Restarbeiten-Header, Editbox und flexibler Listenbereich

## Status

`[A] abgenommen` – Entwurfsentscheidung, sichtbare native Abnahme und der stabilisierte BBM-Pflichtprüfungsblock sind abgeschlossen.

## Tatsächlicher Layoutvertrag

Die Restarbeiten-Seite besitzt drei voneinander getrennte Layoutaufgaben:

1. `restarbeiten.header.root` ist die feste Kopfzeile oberhalb des Arbeitsbereichs. Der sichtbare Header ist die vorhandene Filterleiste; eine zusätzliche Überschrift oder Statusanzeige wird nicht erfunden. Die seitliche Quicklane ist kein Bestandteil des Headers und bleibt gesperrt.
2. `restarbeiten.list.root` ist der flexible Listenbereich. Er nimmt den verbleibenden Platz ein; der vorhandene Hauptlistencontainer scrollt vertikal.
3. `restarbeiten.edit.root` ist der feste, begrenzte Bearbeitungsbereich unterhalb der Liste.

Der Screen nutzt eine eigene Headerzeile und darunter den Arbeitsbereich. Er übernimmt mit `height: 100%` exakt die vom CoreShell bereitgestellte Inhaltshöhe und erzeugt keinen äußeren Seitenscroll. Der Arbeitsbereich ordnet Liste und Editbox als Flex-Spalte an. `min-height: 0`, kontrolliertes `overflow` und eine Mindesthöhe von 180 px für den Listenbereich verhindern, dass lange Listen hinter Header oder Editbox weiterlaufen. Die Datensatzanzahl und die Gesamthöhe des Listeninhalts sind keine Layoutoperationen.

## Registryversion und Scopes

- Registryversion: `3`
- aktive vollständige Scopes: `restarbeiten.header.root`, `restarbeiten.list.root`, `restarbeiten.edit.root`
- `restarbeiten.layout.root` ist mit Grund `M80_2_split_removed` ausdrücklich gesperrt
- `restarbeiten.layout.split` wird nicht mehr geliefert und besitzt keine produktive Capability

Der Registry-Fingerprint wird weiterhin deterministisch aus der expliziten Registry erzeugt. Der vorhandene Refresh erkennt damit den Wechsel von Version 2 auf Version 3. Registry und Refs werden nicht aus DOM, CSS, Datenbank, IPC oder Druckdaten abgeleitet.

## Header-Registry

Der Header-Scope enthält 31 explizite Elemente:

- Header-Root und Filterleistencontainer
- Gruppen für Verortung, Klasse, Metadaten und Aktionen
- vier Verortungsfelder, jeweils mit getrenntem Label und Feld
- Klassenfilter und die drei sichtbaren Klassenbuttons
- Status, Fertig bis und Verantwortlich, jeweils mit getrenntem Label und Feld
- Schließen-Button

Der Header-Root erlaubt `resizeWidth`, `resizeHeight` und `setVisibility`. `move` ist nicht freigegeben, weil eine freie Verschiebung den sicheren Zeilenvertrag und den Überlagerungsschutz aufheben würde. Mindest- und Höchstmaße begrenzen die Bearbeitung auf sinnvolle Werte. Fachbuttons sind ausschließlich Layoutobjekte; Ausführung und Fachdatenänderung bleiben gesperrt.

## Editbox-Registry

`restarbeiten.edit.root` behält seine stabile ID und alle 49 bereits registrierten Kindelemente. Der Root erlaubt direkt `resizeWidth`, `resizeHeight` und `setVisibility`; `move` ist wegen des Flex-/Überlagerungsvertrags nicht freigegeben. Die Baseline enthält Mindest- und Höchstmaße. Breiten- oder Höhenänderungen verkleinern den verfügbaren Listenbereich, verdecken aber keinen Listeninhalt.

## Hauptliste

`restarbeiten.list.root`, die Inhaltstabelle und die drei fachlich bestätigten Spaltengruppen bleiben unverändert registriert:

1. Nr. / Datum / Klasse / Fotos
2. Gegenstand – Verortung / Kurztext / Langtext
3. Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich

Der Listenbereich selbst bleibt ein flexibles Layoutobjekt. Inhaltslänge, Datensatzanzahl und eine künstliche Gesamthöhe der vollständigen Liste werden nicht angeboten.

## Profile, Reset und Fehlerfälle

- Unveränderte IDs und weiterhin erlaubte Capabilities behalten kompatible Profilwerte.
- Neue Header-IDs starten mit ihrer Ziel-App-Baseline.
- Der entfernte Split und seine Werte werden vom vorhandenen capability-basierten Profilabgleich ignoriert beziehungsweise archiviert und nicht mehr angewendet.
- Entfernte Capabilities werden aus dem aktiven Profilzustand entfernt.
- Reset stellt die Registry-Baseline wieder her; Discard und Rollback verwenden weiterhin den vorhandenen atomaren Profil- und HostAdapter-Weg.

## Grenzen

- keine neue Editoroberfläche und keine Splitsteuerung
- keine Fachlogik- oder Fachdatenänderung
- keine Änderung am PDF-/Druckweg
- keine automatische UI-Erkennung
- kein Browser-, Netzwerk- oder Cloudpfad
- M81 und M82 bleiben offen

## Prüfung

Automatisiert sichern insbesondere `scripts/tests/m80-2HeaderEditboxLayout.test.cjs`, `scripts/tests/m80-1RegistrationRefresh.test.cjs` und `scripts/tests/m80ElectronUiEditor.test.cjs` Registry, Refs, Grenzen, Profile, Refresh, Scrollvertrag und die M80-/M80.1-Regression ab. Der allgemeine Vertragscheck bleibt `scripts/ui-editor-contract-check.cjs`.

Die sichtbare Abnahme erfolgte mit echten gepackten BBM- und Editorfenstern sowie 60 isolierten In-Memory-Diagnoseeinträgen. Geprüft wurden Header-, Listen- und Editbox-Markierung, direkte Größenänderung, internes Scrollen ohne Überlagerung, Fachbutton-Auswahlschutz, Save, Neustart-Restore, Reset, Discard, provozierter Rollback, Registry-Refresh und genau eine Editorinstanz. Danach wurden Prozesse, Diagnoseprofil und Screenshots entfernt.

M80.2a stabilisiert den Abschlussnachweis ohne Änderung des Layoutvertrags: Der vollständige Testbestand läuft in acht festen Child-Prozess-Gruppen, und der ESM-Testloader verwendet pro Datei nur einen Modulgraphen. `test:node` schaltet native Abhängigkeiten vor dem Lauf auf Node ABI 127 und stellt Electron ABI 123 auch bei Fehlern im `finally`-Pfad wieder her. `pack` aktiviert Electron-ABI vorab und unterbindet einen zweiten unkoordinierten Builder-Rebuild. Das gezielte ESLint ist grün; der bekannte globale Repo-Lintbestand von 17 Fehlern und 371 Warnungen bleibt getrennt dokumentiert.
