# S5.4 – Rücklauf und Outlook

Entscheidung vor Umsetzung auf main `676713aa395cd6d6d4aa7633d5fc8bb251bb2a11`.
Verbindlich: #251, #274 B3/B4/B6 und #277; B3/B4 ersetzen die ältere Fremdversandbestätigung.

## Paket und Grenzen

Ein zusammenhängender Vorgang zur ausgewählten unveränderlichen Vorankündigungsfassung:
signiertes PDF zuordnen/öffnen, Unterschrifts- oder Behördenmail vorbereiten, bestehenden
gemeinsamen Outlook-Adapter aufrufen, bestätigte Entwurfsöffnung speichern.
Bestehende PDF-Bytes werden übernommen, niemals aus heutigen Firmendaten nachgedruckt.
Rechnung #275, Behördenrecherche, Kalendererinnerung und tatsächliche Versandbeobachtung
sind keine Bestandteile. PDF-Ausgabe und gemeinsamer Mailtransport bleiben unverändert.

## Daten und Ampel

Separate Tabelle `sigeko_pre_notification_workflows`: `document_id`, `project_id`,
`signed_file_json`, `signed_received_at`, `signature_opened_at`, `authority_opened_at`,
`return_requested_by`, `revision`, `created_at`, `updated_at`.
Dokument-ID ist Primärschlüssel; zusammengesetzter Fremdschlüssel sichert Dokument/Projekt.
Finale Dokumentzeilen bleiben unveränderlich. Revision/CAS schützt den aktuellen Zustand.
Es gibt keine Ereignis-/Mailhistorie und keinen beobachteten Sendestatus.

- Rot: noch keine bestätigte Übergabe. Auch eine vorhandene PDF allein bleibt offen.
- Orange: Unterschriftsentwurf wurde in Outlook geöffnet.
- Grün: Behördenentwurf mit zugeordnetem Rücklauf wurde in Outlook geöffnet.

Eine neue Fassung beginnt unabhängig. Rücklaufimport allein erzeugt kein Grün.
Import ersetzt die aktuelle Rücklaufzuordnung; bisherige Dateien werden nicht gelöscht.
Bei Ersatz wird eine bisherige Behördenübergabe zurückgesetzt, da sie andere Bytes betraf.
Ein eigener optionaler Unterschrift-Merker entfällt: die zugeordnete Datei wird angezeigt.
`return_requested_by` ist ein optionales Kalenderdatum und wird beim erfolgreichen Öffnen
des Unterschriftsentwurfs gespeichert; keine separate Erinnerung oder automatische Speicherung.

## Datei- und Prozessgrenze

Main öffnet den nativen PDF-Dateidialog. Abbruch verändert nichts. Nur normale PDF-Dateien
werden unter einem neuen eindeutigen Namen exklusiv in der vorhandenen SiGeKo-Unterlagenablage
kopiert. Hash/Größe/Pfadprüfung, erneute Lizenz-/Projekt-/Ablage-/Revisionsprüfung und DB-Transaktion
gehen dem Erfolg voraus. Fehler räumen ausschließlich nachweislich selbst erzeugte Bytes auf.
Der Import prüft keine kryptografische oder inhaltliche Unterschrift; die Nutzerzuordnung ist maßgeblich.

Main bestimmt die Anlagen aus der gewählten Finalfassung: Unterschrift = Original plus vorhandene
Firmenanlage; Behörde = zugeordneter Rücklauf plus vorhandene Firmenanlage. Aktuelle bestätigte
Behördenzuordnung muss zum Behördennachweis der Fassung passen. Empfänger/Betreff/Text bleiben
bearbeitbar. Projektkontakte stammen aus dem gemeinsamen FirmDirectory, niemals aus einer neuen
Kontaktverwaltung. Keine automatische Auswahl aller Projektfirmen.

Vor Outlook werden geprüfte Bytes in ein eigenes temporäres Anlagenverzeichnis kopiert; die
gleichen Bytes werden vor und nach dem Adapteraufruf geprüft. Der bestehende
`createOutlookDraftHandler` aus `mailIpc.js` bleibt die einzige COM-/PowerShell-Implementierung.
Nur sein exaktes `draft-opened`/`outlook`-Ergebnis erlaubt eine Zustandsänderung. Der Renderer
kann keinen erfolgreichen Versand oder eine erfolgreiche Öffnung quittieren.
Scheitert die Speicherung nach tatsächlicher Öffnung, meldet Main ausdrücklich
`SIGEKO_MAIL_OPENED_STATE_UNSAVED`; keine automatische Wiederholung und kein falscher Erfolg.
Temporäre Anlagen werden anschließend entfernt. Outlook enthält bereits kopierte Anhänge.
Eine absolute Atomizität mit externen Dateimanipulationen oder Outlook wird nicht behauptet.

## Übertragung und Abnahme

Transfer V9 nur bei vorhandenen Workflowzeilen. Strikte Pflichtpayload/Counts/Schema,
Dokument-/Projektzuordnung und kollisionsfreie Dateipfade; signierte Bytes an allen bestehenden
V8-Dateigrenzen mitprüfen. V1–V8 unverändert. Keine Quelllöschung nach zwischenzeitlicher
Workflow-/Dateiänderung; bestehende exklusive Zielreservierung und Rollback verwenden.

Gezielte SQLite-, Datei-, CAS-, Lizenz-/Archiv-, Fehler-/Erfolg- und Transferprüfungen;
bestehender realer Windows/Linux-Formularharness und unabhängiger Review.
Volltest gegen 1947 PASS / exakt 97 bekannte Fehler. Tatsächliches Outlook-COM ist ein
gesonderter Windowsnachweis gemäß B6; ein Transportstub ersetzt ihn nicht.
Die vollständige A–F-UI-Entscheidung steht vor UI-Änderungen in `SIGEKO_S5_4_UI_ENTWURF.md`.
