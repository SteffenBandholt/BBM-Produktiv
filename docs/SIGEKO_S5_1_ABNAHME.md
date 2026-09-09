# SiGeKo S5.1 – Vorankündigungsentwurf

Basis main `5b81ca770a2a8021273ec4c5aa37a862b0547282`. Ergebnisbranch `codex/sigeko-s51-prenotification-data`, PR #334. Fachliche Grundlage und weiterer Paketschnitt: `SIGEKO_S5_PAKETPLAN.md`.

## Ergebnis

Eigener aktueller Entwurf je zentralem Projekt mit lokalen Overrides, manueller ganzzahliger Monatsdauer, den Zahlenfeldern der Vorlage und freien Angaben des beauftragten Dritten. Zentrale Adresse, expliziter Bauherr, SiGeKo-Rollen und zugeordnete Arbeitsschutzbehörde werden live aufgelöst. Teiländerungen schreiben nicht in diese Quellen zurück. Fehlende Angaben lassen sich als Entwurf speichern; die Rückgabe benennt sie konkret. Firmenanlage erfordert aktuelle Teilnehmer aus dem vorhandenen FirmDirectory.

SQLite-Migration ist additiv. Stabile ID, Projekt-Fremdschlüssel, Revision und Zeitstempel; CAS schützt vor überholten Speicherständen, Archivschutz vor Änderungen an archivierten Projekten. Zwei schmale Preload-/IPC-Operationen nutzen die vorhandene dynamische Modul-/Lizenzprüfung. Projekt-ZIP V7 erhält den vollständigen Entwurf und prüft Schema, Projektbezug, Version und sämtliche Counts vor Übernahme. Alte Archivversionen bleiben unterstützt.

## Prüfung und Reparaturrunde

25 neue Domain-/SQLite-/Preloadprüfungen und 14 neue echte ZIP-Prüfungen PASS. Vorhandene V6-Transferprüfung 14 PASS; vorhandene Behördenzuordnungsprüfung 25 PASS. Unabhängiger Quellenreview ohne offene Blocker. Die Prüfung berücksichtigte auch unverändertes Speichern bei maximaler sicherer Revision; die Serviceprüfung erfolgt erst nach dem No-op-Vergleich. Fehlertexte verwenden deutsche Feldnamen.

Erster Volltest: 1786 erfolgreich / 100 Fehler. Drei zusätzliche Fehler waren die bestehenden exakten Inventarlisten für IPC, Preload und Fachtabellen; ihnen fehlten die neu eingeführten zwei Endpunkte beziehungsweise die neue Tabelle. Ausschließlich diese Erwartungen wurden im bestehenden Modulgrenztest ergänzt, keine Prüfungen entfernt oder pauschal freigegeben. Wiederholter vollständiger Test: **1789 erfolgreich / exakt dieselben 97 Baselinefehler**, 39 zusätzliche erfolgreiche Tests, keine verlorenen grünen Prüfungen und keine neuen Fehlernamen/-häufigkeiten. Vergleich in `SIGEKO_S5_1_TESTVERGLEICH.json`.

Produktcommit `3d9976b08ac754bf9c63c4b017c03ce38ab9016d`, Tree `6ba7332d0e9b4bbf900140c7b78effea273f8348`; getrennte Testkorrektur `ea602026e033c598d04b4a9b305641e5d937816a`. Der zweite Volltest enthält diese Korrektur. Allgemeine npm-CI ist wegen der bekannten Kit-/Popup-/Lizenzbaseline kein grüner Gesamtnachweis.

## Abnahmegrenze

Windows-/Linux-Matrix **34387710393 vollständig PASS** auf Testkorrekturcommit `ea602026e033c598d04b4a9b305641e5d937816a`: Linux-Job 102588069025, Windows-Job 102588069190. Beide neuen Backend-/ZIP-Suites erfolgreich; die bestehende echte Formularabnahme je 16 Prüfblöcke PASS, `rendererErrors:[]`, `manualConfirmed:false`. Allgemeine npm-CI 34387710385 separat geprüft: weiterhin fehlendes UI-Kit sowie bekannte Popup-/Lizenzfehler. Kein grüner Gesamt-CI-Status behauptet. Abschließende Änderungen betreffen ausschließlich Dokumentation.

Reines Daten-/Transferpaket: keine neue UI, kein PDF-Dokument, kein Mail-/Rücklaufstatus. Computer Use ist für den neuen Backendpfad nicht erforderlich. Die vorhandene Windows-/Linux-Electron-Matrix wird als Regression der bereits integrierten Formulare mitgeführt; sie ersetzt keine spätere VA-Formularabnahme. Keine persönliche manuelle Abnahme behauptet.

Bestehende Grenzen ausdrücklich erhalten: gemeinsame Firmenlesedienste können ihre idempotente Legacy-Verwendungsmigration ausführen; der gemeinsame ZIP-Import kopiert Dateien weiterhin nach dem DB-Commit. Keine allgemeine neue Transaktion über DB und Dateisystem behauptet. Rechnung #275 eingefroren; historische Behörden-PDF nicht übernommen, keine automatische Recherche. Nach Integration direkt S5.2 formularnahe Bedienung.
