# Installation und Abnahme für Steffen

Stand 16.09.2026: lokale Abnahmeausgabe, keine Kundenfreigabe.
Version **1.5.0**, Kanal **STABLE**, Buildflavor **release**, Windows-x64-Payload.

Setup:
`C:\01_Projekte\BBM-Produktiv\dist\protokoll-abnahme\BBM-Protokoll-1.5.0-STABLE-Abnahme-Setup.exe`

SHA-256:
`1BF2B7701F2863BD21EF531470E7BC09CB19CADC4A9B0688D7697E8DEA821B63`

## Installation

1. Für die vollständige Abnahme eine Windows-Testumgebung oder einen separaten
   Testbenutzer verwenden. Dort die Setup.exe starten. Die Installation erfolgt
   pro Benutzer. Die EXE ist nicht mit einem Codesigning-Zertifikat signiert.
2. Das Ein-Klick-Setup startet die installierte Anwendung nach erfolgreicher
   Installation automatisch. Später über **BBM-Protokoll-Abnahme** auf Desktop
   oder im Startmenü starten.
   Der Datenordner ist ausschließlich `%APPDATA%\BBM-Protokoll-Abnahme`.
   Bestehende BBM-Daten werden nicht importiert. Kein VS Code, Repository,
   UI-Editor-Kit-Verzeichnis oder Modelldownload ist für den Betrieb erforderlich.
3. Unter Einstellungen/Lizenzstatus eine vorhandene **gültig signierte Lizenz
   mit Protokoll und Diktat** regulär importieren, anschließend die App neu starten.
   Das Setup enthält keine Lizenz. Ohne gültige Freischaltung bleiben Fachfunktionen
   gesperrt. Die Abnahmeausgabe übernimmt keine `.bbmlic`-Dateizuordnung der Haupt-App.
4. Eine eigene Testablage einstellen; keine produktiven Projekt-/PDF-Verzeichnisse
   für die Abnahme wählen.

Die automatisierte lokale Installation liegt bereits unter
`C:\Users\Steffen\AppData\Local\Programs\BBM-Protokoll-Abnahme-Test`.
Die installierte EXE liegt vollständig unter
`C:\Users\Steffen\AppData\Local\Programs\BBM-Protokoll-Abnahme-Test\BBM Protokoll (Abnahme).exe`.
Sie verwendet denselben getrennten Abnahme-Datenordner und enthält nur ein
synthetisches Testprojekt sowie Testfirmendaten/BBM-Testlogo. Dieser Lauf fand
unter Steffen statt und ersetzt die Prüfung unter einem separaten Benutzer nicht.

## Abnahmeablauf

- Neues Testprojekt in der Kachelansicht anlegen, Bauherr zunächst leer lassen.
  Alle drei Besprechungsreihen aktivieren. Firma, Ansprechpartner, Projektfirma,
  Teilnehmer und Verteiler zuordnen.
- Firmendaten, Adresse, eigenes Logo und Testablage speichern. App vollständig
  schließen und über die installierte Verknüpfung erneut starten; Daten prüfen.
- Je eine Bau-, Bauherren- und Planungsbesprechung Nr. 1 mit unterscheidbarem TOP
  anlegen. Eine Reihe schließen und fortführen: deren Nr. 2/TOP-Fortführung darf
  die beiden anderen Reihen nicht verändern. Listen und Historie prüfen.
- Jede Reihe als PDF vorschauen, erzeugen und ablegen. Logo, Adresse,
  Besprechungsart, Nummer und Dateinamen prüfen. Im vorhandenen Mailablauf die
  richtige PDF als Anhang prüfen; für die Abnahme genügt ein Entwurf ohne Versand.
- Mikrofonaufnahme mit einigen deutschen Sätzen durchführen und tatsächlich
  transkribieren lassen. Standardmodell `small` ist enthalten; nicht enthaltene
  optionale Qualitätsmodelle verwenden den bestehenden small-Fallback.
- Testprojekt als ZIP exportieren und in der Testumgebung wieder importieren.
  Drei Reihen, Firmen/Personen und Historie vergleichen.
- Rechnung, SiGeKo und Restarbeiten dürfen keine erreichbaren Fachmodule sein.
  Keine UI-Editorbuttons, Editorseiten, Entwicklungseinstellungen,
  Tabellenkalibrierung oder strukturellen Drucklayout-Regler dürfen erreichbar sein.
  Logo-/Adress-/Ablageeinstellungen bleiben normale Benutzerfunktionen.
- App schließen. Ergebnis und Abweichungen notieren. Automatische Prüfergebnisse
  sind keine menschliche Abnahme.

Offen sind aktuell die gültige Testlizenz sowie die nativen Mikrofon-,
Besprechungs-, PDF-/Mail- und Projekttransfer-Abläufe aus der installierten App.
Details: [Prüfbericht](PROTOKOLL_SETUP_PRUEFBERICHT.md).
