# M82.2 – BBM-Geometriehinweise

## Rolle von BBM

BBM ist Referenz- und sichtbare Abnahme-App für den gemeinsamen M82.2-Vertrag. Die Risikoauswertung und deutschen Nutzertexte kommen aus dem UI-Editor-kit. Im gemeinsamen Core befinden sich keine BBM-Element-IDs und keine BBM-Nachbarlisten. BBM nutzt weiterhin dieselbe Registry, lokale Pipe, Electron-HostAdapter, Layoutsession, Profilwiederherstellung und denselben nativen UI-/PDF-Editor.

## Bisheriges Problem

Die Auswahl zeigte `parentReflowRequired` als gelbe Warnung, obwohl noch keine Änderung vorlag. Bei einer konkreten unerwarteten Geometriewirkung rollte der Electron-Adapter zwar zurück, reichte anschließend jedoch `electron_unexpected_layout_effect` samt Registry-IDs als alleinige Hauptmeldung weiter. Dialog-, Vorschau- und lokaler Busy-Zustand besaßen keinen gemeinsamen garantierten Abschlussweg.

## Neuer Ablauf

- Auswahl von Eingabebereich, Gruppe oder Element bleibt neutral.
- „Geführt“ bewertet eine konkrete Zielgeometrie und bietet bei passender Grenze „In der Gruppe halten“, „Trotzdem anwenden“ und „Abbrechen“.
- „Frei“ erlaubt nach verständlicher operationsgebundener Bestätigung Gruppenverlassen und Überlappung.
- Haupttexte nennen beispielsweise „Diktatbutton“, „Kurztext/Gegenstand“, „Klasse“ oder „Verantwortlich“. Technische IDs stehen nur in „Details anzeigen“.
- Aktuelles Rechteck, Zielrechteck, Gruppe/Bereich und eine Überlappung werden mit unterschiedlichen Linienarten beziehungsweise Schraffur im echten BBM-Renderer markiert.
- Anwenden, Abbrechen, Zurück, Auswahlwechsel, Escape, Schließen und Navigation entfernen die Vorschau.
- Nach Rollback bleiben Auswahl, Baum, Modus und Editorprozess erhalten; der nächste gültige Befehl kann unmittelbar folgen.
- Eine räumliche Verschiebung ändert keine Registry-Parents und keine Fachwerte.

## Sichtbare Abnahmefälle

Die verbindliche Abnahme umfasst Eingabebereich Restarbeiten, Diktatbutton und Mikrofonsymbol, Kurztext/Gegenstand, Restzeichenanzeige, Gruppe und Eingabefeld Klasse, Metadatengruppe, Fällig am sowie Verantwortlich. Geprüft werden Auswahl ohne Warnung, Begrenzen, bewusstes Anwenden, Nachbarhinweis samt Details, Abbruch/Zurück, Freimodus, Save/Neustart-Restore, technische Ablehnung mit direkter Weiterarbeit, Element-/Gruppen-/Gesamtreset, Discard, Restarbeiten-Fachbedienung, PDF-Tab und Profil-Recovery.

## Produktgrenzen

Keine BBM-Fachlogik, Datenbank, Audio-/Whisper-/FFmpeg-Funktion oder Druck-/PDF-Fachlogik wird geändert. Technisch ungültige Zahlen/Größen, gesperrte Operationen, inkompatible Verträge und nicht sicher rückrollbare Zustände bleiben blockiert.

## Aktueller Abnahmestand

Der gepackte native Lauf bestätigt Auswahl ohne Warnung, geführt/frei, Vorschau, Begrenzen, bewusstes Anwenden, Abbrechen/Zurück, Save/Neustart-Restore, technische Ablehnung mit direkter Weiterarbeit sowie Element-, Gruppen- und Gesamtreset und Discard. Die als Development-/Diagnostic-Build paketierte BBM zeigt eindeutig „Entwicklungsversion – Testlizenz“. Sie erzeugte im normalen Benutzerprofil die echte vierseitige BBM-Protokoll-PDF mit 28 Registryelementen; Vorschau, Pagination und Druckbarkeit blieben erhalten.

Eine kleine zulässige Verschiebung des Dokumenttitels wurde neu erzeugt und gespeichert. Nach BBM-/Editor-Neustart wurde sie genau einmal wiederhergestellt. Reines Laden veränderte den Profilhash nicht. Elementreset, Gesamtreset und Discard wurden sichtbar geprüft; die automatisierte Profil-Recovery blieb grün. Die absichtlich versuchte Bereichsüberschreitung wurde mit verständlichem Anzeigenamen zurückgerollt, technische IDs standen nur unter „Details anzeigen“, und der Editor blieb unmittelbar bedienbar.

Der interne Development-Lizenzweg ist in `docs/M82_2_DEVELOPMENT_LICENSE.md` beschrieben. Der normale Release-Build blieb mit derselben abgelaufenen Benutzerlizenz bei `LICENSE_EXPIRED`; frei gesetzte Development-Umgebungsvariablen aktivierten keine Freigabe. Weder Benutzerlizenz noch Fachwerte wurden verändert.
