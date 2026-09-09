# Zentrale Bauherrzuordnung – Vorbereitung für SiGeKo S3

Base: main `03d894f075c85bb1ea7cf79c552947dd8a70e437` (PR #328).
Branch: `codex/project-bauherr-reference`.
Fachentscheidung: Steffens ausdrückliche Bestätigung, dokumentiert in #274,
Kommentar 5595638596; ersetzt den Zuordnungsstopp 5595499873.

## Umfang

Der Bauherr wird im zentralen Projektformular bewusst aus vorhandenen globalen
oder zum selben Projekt gehörenden Firmen ausgewählt. Die veränderbare
Firmenkategorie ist keine Zuordnungsregel. Es werden ausschließlich Art und ID
referenziert; Namen, Anschrift und Kontaktdaten bleiben Eigentum der Firmenpflege.
Neue Firmen werden weiterhin über die vorhandene Firmenverwaltung angelegt.

Die neue Auswahl gehört zum bestehenden Projekt-Speichern, ohne Autosave. Bei
Neuanlage verlangt das Formular eine Auswahl aus globalen Firmen; projektbezogene
Firmen können nach Projektanlage verwendet werden. Altprojekte bleiben zunächst
unzugeordnet und bearbeitbar. Bestehende interne Create-Aufrufe ohne Bauherrfeld
bleiben kompatibel; dies ist keine neue globale API-Pflichtsperre für alle Module.
Die spätere Readiness bewertet fehlende Zuordnungen als unvollständig.

Unveränderte Zuordnungen werden nicht erneut gesendet. Auch eine später fehlende
Firma wird bei anderen Projektänderungen nicht still ersetzt oder gelöscht.
Bewusstes Leeren sendet null; eine neue Wahl sendet die typisierte Firmenreferenz.
Ladefehler erhalten den Entwurf und bieten Aktualisieren; ungültige oder inzwischen
entfernte Firmen werden vor dem Schreiben abgewiesen. Archivierte Bauherrzuordnungen
sind schreibgeschützt. Andere bestehende Archivregeln werden nicht erweitert.

## Gemeinsame Daten- und Anwendungsgrenze

Zwei nullable TEXT-Spalten in der bestehenden projects-Tabelle:
`bauherr_firm_kind` und `bauherr_firm_id`. Additive wiederholbare zentrale Migration,
keine automatische Bestandszuweisung. Alle bisherigen SELECT-/INSERT-Fallbacks
erhalten die Felder. Das zentrale Create-/Update-Payload nutzt ausschließlich
`bauherr: {kind, id}` oder null; direkte Rohspalten umgehen die Validierung nicht.
Undefined oder ein fehlendes Feld erhält den bisherigen Bezug.

Der vorhandene FirmDirectoryService prüft die Quelle in derselben SQLite-Datei.
Es gibt keine zweite Kontaktverwaltung, neue Datenbank oder Fachmodullizenzpflicht.
`projects:getBuilder` / `projectsGetBuilder({projectId})` liefern
`{ok,data:{ref,firm,sourceMissing}}`. Verbraucher wie SiGeKo können damit die aktuelle
zentrale Firma lesen, ohne sie zu kopieren. Fehlende Quellen bleiben erkennbar;
Infrastrukturfehler werden nicht als erfolgreiche leere Auflösung ausgegeben.
Der gemeinsame Directory kann seine bestehenden Nutzungsdaten beim ersten Zugriff
migrieren; es wird kein pauschal schreibfreier erster Datenbankzugriff behauptet.

## Projekttransfer

Bestehender ZIP-Weg, Archivformat 5 nur bei gesetzter Bauherrreferenz. Ohne Bauherr
bleiben Version 3 beziehungsweise 4 bei SiGeKo-Daten erhalten. Version 5 schützt vor
stillem Verwerfen durch ältere Importer. Referenz und eigene Projektfirma werden
innerhalb derselben bestehenden SQLite-Importtransaktion wiederhergestellt.

Globale Bauherrfirmen werden auch ohne Projektbeteiligten-Zuordnung im vorhandenen
Abhängigkeitssnapshot erfasst. Die bestehende Transferregel bleibt bestehen:
eine globale Firma muss am Ziel mit gleicher ID und gleichem Namen vorhanden sein;
sie wird nicht automatisch neu angelegt. Fehlende/kollidierende globale Quellen,
mehrdeutige Snapshots und fremde Projektfirmen werden abgewiesen.

Eine gelöschte, nicht mehr exportierbare Bauherrquelle muss vor einem Export bewusst
korrigiert oder entfernt werden. Der Export stoppt davor und erhält das lokale
Projekt samt Dateien. Eine lediglich deaktivierte noch vorhandene Projektfirma kann
mit ihrer historischen Referenz transportiert werden. Der vorhandene nachgelagerte
Dateikopierablauf wird nicht neu gestaltet.

## UI-Editor und Prüfweg

Entscheidung vor Umsetzung: `PROJEKT_BAUHERR_UI_ENTWURF.md`.
Eigenständiger Scope `projektverwaltung.builder`, vollständiger lokaler Vertrag
mit sieben Pflichtslots und optionalem Entwicklungsstarter. Registry-Version 32,
gemeinsame Projektformular-Scopegruppe mit unverändertem plannedStart-Vertrag.
Bestehende Fachmodule und ihre Scope-Fingerprints bleiben unverändert.

Echte Kit-Komponentenvalidierung (16 Komponenten, 441 Elemente) und Manifest-/Restore-
Prüfungen grün. Der bekannte alte HTML-Parser ist kein grüner Nachweis für M83.
Der Quellenreview fand zwei Lebenszyklusfehler bei verzögerten Antworten nach
Schließen/Wiederöffnen; Launcher-Ref-Erhalt und Neustart einer abgebrochenen Ladung
wurden korrigiert und erhalten gezielte Regressionstests.

Frischer Volltest des unveränderten main: 1601 grün / 97 bekannte Baselinefehler.
Kandidatenvergleich und Windows-/Linux-Electron-Nachweis werden vor Integration
hier ergänzt. Vorhandene isolierte Abnahmeplattform, echte Produkt-IPC/SQLite,
keine Ersatzplattform und kein behaupteter persönlicher manueller PASS.

## Paketgrenzen

Dies ist ein zentrales Vorbereitungspaket, noch keine SiGeKo-Readiness-Anzeige.
Architekt/Planer und weitere Rollen werden nicht zu zentralen Pflichtrollen.
Rechnung #275 bleibt eingefroren. Behörden bleiben S4; die PDF Januar 2022 ist nur
spätere Referenz, vor Übernahme auf Aktualität zu prüfen. Keine PDF-/Mailänderung.
