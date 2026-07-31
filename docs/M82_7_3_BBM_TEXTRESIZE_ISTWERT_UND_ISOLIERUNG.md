# M82.7.3 – BBM-`textResize`-Istwert und isolierte Abnahme

Status: `[A]`

## Forensischer Datenbankbefund

Verglichen wurden ausschließlich temporäre Kopien von:

- `app.db`, SHA-256 `8EA14AC75EB32F211EAFF8E548956573F8FB7FE1A9F21B6AE9E030B99C32EF24`
- `app.db.bak`, SHA-256 `2088047224B31D1A3178D721156A3D84B6E3A9F1C79C38648B1AC83AFE6C93DD`

Beide Dateien besitzen 57 Schemaobjekte, 31 Tabellen, identische Primärschlüssel und identische Zeilenzahlen. `PRAGMA integrity_check` ergab jeweils `ok`; die Fremdschlüsselprüfung blieb leer. Es wurde genau eine geänderte Zelle gefunden:

- Tabelle: `restarbeiten_items`
- Primärschlüssel: `07ac420e-0e4a-4d65-bb82-5666c7ad1542`
- Spalte: `updated_at`
- Sicherung: `2026-07-30T09:48:58.661Z`
- aktuelle Datenbank: `2026-07-31T07:06:44.285Z`

Es gibt keine hinzugefügte oder entfernte Zeile, keine Schemaänderung und keine Änderung an Fachwerten, Einstellungen, Session-, Fenster-, MRU-, Cache-, Registry-, Layout-, Profil- oder Lizenzdaten. Die aktuelle Datenbank ist logisch konsistent. Eine Rücksicherung ist nicht begründet und wurde nicht ausgeführt; über eine spätere Rücksicherung kann ausschließlich der Nutzer entscheiden.

## Exakte Schreibursache

Der normale Entwicklungsstart lief über `npm start` → `start:raw` → Electron → `src/main/main.js`. `getDbPaths()` in `src/main/db/database.js` bezog `app.db` mangels eines expliziten Abnahmeprofil-Schalters unmittelbar aus `app.getPath("userData")`. Der vorhandene Diagnostic-/DevelopmentLicense-Weg änderte nur Diagnoseoberfläche und Lizenzidentität, nicht den Electron-`userData`-Pfad.

Der Electron-Main-Prozess öffnete diese Datenbank. Beim sichtbaren Auswählen eines Restarbeiten-Ziels verlor das vorhandene Kurztextfeld den Fokus. Sein bestehender Blur-/Autosave-Pfad sendete einen inhaltlich unveränderten Vollpatch über `restarbeiten:updateItem` an `restarbeitenRepo.updateRestarbeitItem`; dessen SQL-Update setzte `updated_at` neu. Start und Shutdown erzeugten im forensischen Vergleich keine weitere logische Änderung.

## Isolierter Abnahmeweg

Der eindeutige Befehl lautet:

```text
npm run start:ui-editor:acceptance
```

Der Launcher erzeugt ein markiertes Verzeichnis `bbm-ui-editor-acceptance-*` unter dem System-Tempordner. Vor allen Datenbank- und IPC-Imports setzt der Main-Prozess `userData` und `sessionData` auf dessen Unterordner. Zwei aufeinanderfolgende Starts verwenden dasselbe isolierte Profil, damit Save und Neustart-Restore real geprüft werden können. Anschließend wird nur dieses validierte Temp-Profil im `finally` entfernt.

Der normale `npm start` setzt keine Electron-Pfade um. Paketierte Builds lehnen den Abnahmeschalter ab. Der Launcher entfernt frei gesetzte Lizenz-, Flavor-, Audio- und Netzwerkserver-Umgebungsvariablen und verwendet den vorhandenen internen Provider `bbm-internal-development-license-v1` mit der Buildidentität `DEV / development-diagnostic`. Die Benutzerlizenz wird weder gelesen noch erzeugt oder überschrieben.

## Sichtbare Abnahme

Im ersten isolierten Start wurden sichtbar geprüft:

- Restzeichenanzeige Kurztext: Istwert `8,66667 DIP`, Kleiner `7,667`, Größer `8,667`, Direkteingabe `9,5`, Undo und Original/Reset
- Restzeichenanzeige Langtext: Istwert `8,66667 DIP`
- normale Bezeichnung: Istwert `10 DIP`
- Kurztextfeld: Istwert `10,6667 DIP`
- Bewegung und Sichtbarkeit am freigegebenen Restzeichen-Ziel
- Speichern des Kurztextwerts `7,667 DIP`

Nach vollständigem Schließen und erneutem Start meldete der Editor für dasselbe Ziel `Schriftgröße: 7,667 DIP`; der Startlog bestätigte `layout_profile_loaded` und `startup_layout_applied`. Topologie, vorhandener Scrollbesitz und Fachtexte blieben unverändert. Beide Abnahmestarts endeten mit Exitcode 0 und das isolierte Profil wurde entfernt.

## Automatisierte Prüfung

- M82.7.3 BBM: 13/13 grün
- Isolations-/Sentineltests: 8/8 grün
- `npm test`: 8/8 Gruppen, kein OOM
- `npm run test:node`: 8/8 Gruppen; Node ABI 127, danach Electron ABI 123 wiederhergestellt
- gezieltes ESLint: keine neuen Fehler
- UI-Editor-kit: M82.7.3 10/10, M82.7.2 8/8, Einfachmodus 22/22, 103 Manager- und 106 Reference-App-Tests sowie `npm test` grün

Die echte `app.db`, `app.db.bak`, Benutzerlizenz und `docs/licensing.md` blieben vor und nach den Abnahmeläufen bytegleich.
