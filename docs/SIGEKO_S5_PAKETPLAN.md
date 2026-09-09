# SiGeKo S5 – Vorankündigung

Ausgangsbasis: main `5b81ca770a2a8021273ec4c5aa37a862b0547282`, S4 über PR #331–#333 abgeschlossen. Verbindlich: #277, #274, #251 und spätere bestätigte Entscheidungen B2/B3/B4 in #274. Der Nutzer hat die fortlaufende paketweise Umsetzung, Prüfung, PR-Integration und GitHub-Dokumentation ohne erneute Freigabe nach jedem Paket beauftragt.

## Reihenfolge und Grenzen

1. S5.1: persistenter Vorankündigungsentwurf, lokale Overrides, gemeinsame Datenauflösung, abgesicherte IPC und Projektarchiv-Erhalt. Keine UI-/PDF-Ausgabe, kein Mail-/Rücklaufprozess in diesem Teilpaket.
2. S5.2 abgeschlossen (PR #335, 1822/97, Windows/Linux je 22 Bedienprüfungen): formularnahe Bedienung in der Reihenfolge der Vorlage, vollständiger komponentennaher Editorvertrag, echte breite/schmale Electron-Abnahme.
3. S5.3a abgeschlossen (PR #336, 1841/97, Windows/Linux Formular und PDF PASS): gemeinsamer Druckkontext und expliziter Modulzugang zur bestehenden Firmenliste. S5.3b als nächstes: fachliches Dokument-ViewModel und gespeicherter Snapshot; Formular-PDF mit gemeinsamem V2-Kopf, PrintShell, Vorschau und Projektablage. Vorher vollständige PDF-Entwurfsentscheidung und eigene Dokument-Guardrails. Die vorhandene Firmenlisten-Ausgabe und die gemeinsame Kopfkontext-Aufbereitung benötigen zuvor ein getrennt geprüftes kleines Anschluss-/Zugriffspaket für explizite Modulidentität.
4. S5.4: Rücklaufdatei, vorbereitete Outlook-Übergabe zur Unterschrift/an Behörde und Abschluss, entsprechend den bestätigten vereinfachten Regeln. Optionaler Kalenderanschluss bleibt S9.

Anschließend ohne regulären Freigabestopp S6, S7, S8 und S9 jeweils neu gegen aktuellen main und ihren verbindlichen Scope prüfen, paketweise umsetzen und integrieren. Bei notwendigem engerem Paketschnitt innerhalb eines Schritts selbständig neu abgrenzen.

## Fachliche Festlegungen

- Zentrale Projektadresse und explizite Bauherrzuordnung ausschließlich lesen. Art des Bauvorhabens und Beginn erlauben vorgangsbezogene Overrides; null hebt den Override auf. Kein Rückschreiben.
- Dauer manuell als ganze Monatszahl; keine Ableitung aus Beginn/Ende (#274, Kommentar 5561512648 ersetzt ältere Aussagen in #251/#274).
- Verantwortlicher Dritter: keine erfundene zentrale Architekten-/Planerrolle. Ohne explizite zentrale Zuordnung „Nicht vorhanden“ oder freie Vorgangsangabe.
- Planung/Ausführung aus vorhandenen SiGeKo-Zuordnungen. Behördenadresse aus S4; keine zweite Behördenpflege.
- Punkt 8 erhält die beiden in der Vorlage vorhandenen Zahlenangaben für Arbeitgeber und Unternehmer ohne Beschäftigte. Punkt 9 ausschließlich „Noch nicht bekannt“ oder vorhandene Firmenliste als Anlage; keine einzelne Firmenpflege in der VA.
- Ort/Datum und Unterschriftsbereich bleiben für die spätere Unterschrift frei. Die in der Blankovorlage gedruckten Koordinatordaten sind keine Stammdatenquelle.
- Spätere Prozessampel aus erfolgreicher Outlook-Entwurfsübergabe gemäß B3/B4: Orange zur Unterschrift, Grün an Behörde. Kein tatsächlicher Versandnachweis und keine Versandhistorie. Dateiübernahme des Rücklaufs bleibt sachlicher Vorgang; Kalender separat.
- Readiness ist keine Berechtigung. Fehlstellenwarnung mit bewusster Bestätigung am tatsächlichen Prozesseinstieg; für finale VA-PDF gilt zusätzlich die fachliche Anforderung einer bestätigten zuständigen Behörde aus #251.

## Ausgangsbasis / Integration

Führend ist aktueller main; frühere S1.4-/S1.5-Branches sind dort integriert. Rechnungsbranches werden nicht übernommen, #275 bleibt eingefroren. Bestehende gemeinsame SQLite, Projektdomäne, Firmen-/Personenauflösung, Modul-/Lizenzguard, UI-Kit, PDF-Provider/PrintShell, Projektablage und Outlook-Transport verwenden. Der technische PDF-Provider ist ein Titel-/Textnachweis; das fachliche Formular benötigt einen eigenen Provider und Renderer an dieser bestehenden Grenze. Kein zweiter PDF-, Mail-, Ablage- oder Editor-Core.

## Arbeitsmodus und S5.1-Entwurfsentscheidung

Goal-Lauf mit klar getrennten Unteragenten für Datenmodell, Tests, Projekttransfer und unabhängige Analyse/Review. Hauptagent koordiniert IPC, Integration und Nachweise. Computer Use für das reine Datenpaket nicht erforderlich; für die folgenden UI-/PDF-Pakete tatsächlicher vorhandener Electron-Abnahmeweg.

A: keine editorrelevante Ausgabe. B: keine neue editorfähige Komponente in S5.1. C: keine neuen UI-/PDF-Elemente oder DOM-Attribute. D: Anlegen/Speichern/IPC/DB bleiben Fachaktionen, keine Editorziele. E: keine neue Parentstruktur. F: tatsächliche SQLite-Migration/Reopen, Validierung, CAS, Archiv-/Modulguard, A/B-Isolation, ZIP-Roundtrip und unveränderte Volltest-Baseline prüfen. Für S5.2/S5.3 ist vor Code jeweils eine vollständige eigene A–F-Entscheidung erforderlich.

Abschluss jedes Teilpakets erst nach passendem Diff, unabhängiger Prüfung, Tests, exaktem Vergleich der Fehlernamen/-häufigkeiten, veröffentlichtem PR, Integration und GitHub-Dokumentation. Ausgangsbaseline S4.3: 1750 erfolgreich / 97 bekannte Fehler. Keine automatische Recherche, keine Übernahme historischer Behörden-PDF-/YAML-Daten, kein Mobil-/Sync-Ausbau.

## S5.1 – konkreter Datenvertrag

`getPreNotification({projectId})` und `savePreNotification({projectId,expectedRevision,patch})` liefern den gespeicherten Entwurf, getrennte zentrale/effektive Daten und konkrete Vollständigkeits-/Behördenhinweise. `expectedRevision:0` legt erstmals an; danach muss die gelesene Revision übereinstimmen. Ein unverändertes Speichern erhält die Revision. Fehlstellen verhindern keinen Entwurf. Unbekannte Felder und Clientsnapshots werden abgewiesen; die Projekt-/Bauherr-/Rollen-/Behördenquellen werden serverseitig über bestehende Dienste gelesen.

Ein aktueller Entwurf je Projekt in `sigeko_pre_notifications`, stabile ID, Zeitstempel, Revision und Projekt-Fremdschlüssel mit Löschweitergabe. Teiländerungen erhalten übrige Werte; ausdrücklich „Nicht vorhanden“ entfernt die lokalen Angaben des Dritten. Zahlen bleiben nullable im Entwurf, Monate positiv und ganz, Beschäftigten-/Unternehmerzahlen nicht negativ und ganz. Die Firmenliste stammt aus `FirmDirectoryService.listProjectParticipants`, derselben neutralen Quelle wie die bestehende Firmenlisten-PDF. Keine VA-eigene Firmenabfrage oder Firmenkopie.

Projektarchiv V7 wird nur bei vorhandenem VA-Entwurf erzeugt, mit striktem Zeilenvertrag, vollständigen Counts und obligatorischer VA-Datei. Rollen-/Behördenzuordnungen dürfen dabei noch fehlen. Alte V1–V6-Archive bleiben unterstützt; ein zurückgestuftes Archiv mit VA-Datei wird abgewiesen. Der Export validiert den Entwurf vor dem bestehenden Entfernen des Quellprojekts. Die gemeinsame Import-Dateikopie nach DB-Commit bleibt unverändertes Bestandsverhalten; S5.1 behauptet keine neue allgemeine DB-/Dateisystem-Transaktion.

Die neuen SiGeKo-Leseoperationen erzeugen keine VA-/Projekt-/Rollen-/Behörden-Fachdaten. Vorhandene gemeinsame Firmenlesedienste führen weiterhin ihre bestehende idempotente Verwendungsmigration aus; bei inkonsistentem Legacybestand kann sie Kompatibilitätsdaten nachführen. Diese bestehende Core-Eigenschaft wird nicht als vollständig SQL-schreibfreier Weg ausgegeben und in diesem Fachpaket nicht umgebaut.
