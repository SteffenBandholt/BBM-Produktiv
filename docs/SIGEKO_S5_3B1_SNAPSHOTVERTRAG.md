# S5.3b1 – interner Vorankündigungs-Snapshotvertrag

Basis main `94333bccd3d75e0757f4fb8d72e8dbf9441f44e4`, Branch `codex/sigeko-s53b-document-snapshot`. #251/#274/#277 einschließlich bestätigter B2/B3/B4-/Monatsfestlegung am 2026-09-09 erneut geprüft. S5.3a ist über PR #336 integriert. Die fortlaufende paketweise Bearbeitung bleibt beauftragt.

## Paketschnitt

Zunächst ausschließlich unveränderlicher, versionierter Main-Snapshot aus vorhandener Entwurfsauflösung und gemeinsamer Druckkontextfunktion. Keine vorläufigen Dokumentzeilen in SQLite. Im unmittelbaren Folgepaket werden Main-eigener Renderkontext, tatsächliche Formular-PDF, finale Dateireferenzen und Projekt-ZIP V8 gemeinsam integriert. Erst nach erfolgreicher PDF und gegebenenfalls Firmenanlage darf eine finale Dokumentfassung gespeichert werden.

Dieser Schnitt vermeidet persistierte Dokumente ohne PDF und zusätzliche Pending-/Recoveryzustände. Er legt keinen neuen allgemeinen Dokumentdienst an. Die vorhandene Firmenliste wird nicht als historische Datenkopie oder Firmen-ViewModel in den Snapshot aufgenommen. Ihr Modus bleibt ein Formularwert; spätere tatsächliche Anlage samt Hash ist maßgeblich.

## Vor Code ausgegebene A–F-Entscheidung

A. Keine editorrelevante Ausgabe; ausschließlich interner Datenvertrag.
B. Keine neue Editorfähigkeit.
C. Keine neuen DOM-Attribute, Tabellen, Spalten oder Layoutprofile.
D. Quelllesen und Snapshot-Erstellung sind Fachfunktionen; keine Editoroperationen.
E. Bestehende UI-/PDF-Parentstruktur bleibt identisch.
F. Tatsächliche SQLite-/Service-/Kontexttests, Projektidentität, Entwurfsrevision, Lizenzentzug während asynchroner Vorbereitung, Quellenwechsel, getrennte Rollen/Zahlen und tiefe Unveränderlichkeit. Volltest gegen S5.3a 1841/97 exakt abgrenzen. Keine visuelle PDF-Abnahme in diesem Datenpaket behaupten.

## API und Besitz

`createPreNotificationSnapshotService().capture({projectId, expectedRevision})` ist ausschließlich Main-intern. Keine IPC-/Preloadfreigabe. Unbekannte Eingabefelder, Clientsnapshots und vom Client bestimmte Dokumentidentitäten werden abgewiesen. ID und Erfassungszeit entstehen in Main. Die laufende SiGeKo-Lizenz wird vor Quellzugriff und nach asynchronem gemeinsamen Kontextladen geprüft. Entwurfsrevision wird vor/nach geprüft; geänderter Projektkontext führt zu einem expliziten Konflikt.

Vorhandenes `PreNotificationService.getPreNotification` bleibt Eigentümer der aktuellen Bauherr-/Rollen-/Behördenauflösung und Readiness. `getPrintRuntimeContext` bleibt Eigentümer der gemeinsamen Druckeinstellungen, Projekt-/Nutzerangaben und Logos. Ein neuer Capture liest die dann aktuellen Quellen. Ein früher zurückgegebener Snapshot verändert sich nicht, wenn Quellen oder Rückgabeobjekte später geändert werden.

## JSON-Vertrag Version 1

Top-Level: `schemaVersion`, `documentTypeId`, `projectId`, `documentId`, `createdAt`, `source`, `form`, `printRuntimeContext`, `readiness`. Dokumenttyp fest `sigeko-vorankuendigung`; keine Client-Rendererklasse. `source` enthält Entwurfs-ID/Revision, ohne gespeicherten Entwurf null/0.

Form: Baustellenadresse, zentral aufgelöster Bauherr, Bauvorhaben, optionaler freier Dritter, getrennte Planung/Ausführung, geplanter Beginn, manuelle Ganzmonate, Höchstzahl Beschäftigte, Arbeitgeberzahl, Unternehmer-ohne-Beschäftigte-Zahl, Firmenmodus, Behördenanschrift, vollständige bestehende Projektzuordnung als Behördennachweis und deren erfasster Status. Kontaktwerte sind feste sechs Felder; Pflicht-/Fehlstellen bleiben anhand der vorhandenen Readiness sichtbar. Null und Zahl 0 bleiben verschieden. Keine Dauerberechnung, keine Gleichsetzung Planer/Architekt, keine erfundenen Rollen.

Behördennachweis benutzt den vorhandenen `PROJECT_AUTHORITY_COLUMNS`-/Snapshotvalidator, Projekt- und LABOR_AUTHORITY-Identität. Anschrift muss mit dem eingeschlossenen Nachweis übereinstimmen. Grün kann nicht aus unbestätigter Quelle/Zuordnung oder fehlender/anderer erfasster Baustellenadresse entstehen. Der vorhandene konservative Adressvergleich (NFC, Leerraum, deutsche Kleinschreibung) wird unverändert aus dem bestehenden SiGeKo-Vertrag wiederverwendet; reine Schreibweisenänderungen bleiben wie im bisherigen Behördendienst gültig. Ein Capture mit roter/oranger Readiness ist keine final freigegebene PDF. Das Folgepaket muss die finale Behördenvoraussetzung an seiner tatsächlichen Erstellungsgrenze erneut prüfen.

Gemeinsamer vollständiger Druckkontext wird als JSON-Wert kopiert, einschließlich eingebetteter Logos. Keine lokale Dateipfad-Auflösung beim späteren historischen Druck behauptet. Getrennte Dokument-/Projektidentität wird validiert. Undefinierte/nicht endliche Werte, nicht serialisierbare Objekte, Zyklen und verlustbehaftete Sonderobjekte werden abgewiesen. Ausgabe wird tief eingefroren. Es werden keine Erstellungs-/Unterschriftswerte in den leeren Signaturbereich erfunden.

## Folgepaket und Grenzen

S5.3b2 benötigt vollständige eigene PDF-/UI-A–F-Entscheidung, tatsächliche Einseiten-/Textüberlauf- und Editorprüfungen, gemeinsame PrintShell/V2-Kopf-Anbindung, finale Dateireferenzen und V8-Transfer. Die vorliegende Datenprüfung ersetzt diese Nachweise nicht. Historische Dateien werden später geöffnet/angehängt, nicht aus aktuellen Firmen neu erzeugt. Fehlende Dateien nach Änderung des aus Projektbezeichnungen abgeleiteten Ordners sind sichtbar zu melden; kein stiller historischer Reprint und kein destruktiver Export ohne Dateiüberprüfung.

Rechnung #275 bleibt eingefroren. Keine neue SQLite-Tabelle, kein Exportformatwechsel, keine Mail-/Rücklaufaktion, keine Behördenrecherche oder historische Behörden-PDF-Übernahme in S5.3b1.
