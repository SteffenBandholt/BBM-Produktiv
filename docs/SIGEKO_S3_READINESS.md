# SiGeKo S3 – Übersicht und berechnete Projektbereitschaft

Base: main `c8acbfb8c9a3c8d1c84ce1c017da762bab407566` (Bauherr-Vorstufe PR #329).
Ergebnisbranch `codex/sigeko-s3-readiness`, [PR #330](https://github.com/SteffenBandholt/BBM-Produktiv/pull/330).
Produktkopf `8f8ec18f66a02b1517669653655ed537b5ef0fe7`, Tree `795f8a64e5e94e7f82ddc0b56a821d3af38c42c4` lokal/remote identisch.

## Verbindlicher Umfang

#274 und #277, fachlich #250, spätere B2-Rollenfestlegung und B4-Dauerkorrektur geprüft. Pflicht: Projektname, bestehendes gemeinsames Straße-/Hausnummernfeld, PLZ, Ort, geplanter Baubeginn und Projektende; zugeordneter Bauherr mit Name/Anschrift; SiGeKo Planung und Ausführung mit aufgelöstem Name/Anschrift. Telefon/E-Mail nur für spätere konkrete Schriftfelder, Logo keine allgemeine Pflicht. Architekt, Dritter und VA-spezifische Felder nicht als zentrale Pflicht erfunden. Prüfung ist Vollständigkeit, keine Rechts-, Adress- oder Datumssyntaxprüfung. Keine automatische Dauerberechnung; spätere VA-Dauer nach B4 manuell in ganzen Monaten.

## Umsetzung

`ReadinessService.getReadiness({projectId})` liest vorhandenen `SigekoProjectService` und `projectsRepo.getBuilder`. Ergebnis trennt `projectData` (red/green mit konkreten issues und actions project/profile/roles) und `authorities`. Keine gespeicherte Freigabe, keine neue Migration oder Fachtabelle. Fehlende Zuordnung, verschwundene Quelle und leere Pflichtfelder bleiben unterscheidbar. Ohne gespeicherte SiGeKo-Erweiterung werden Rollen nicht stillschweigend aus dem Profil ersetzt. „Wie Planung“ verwendet die bereits aufgelöste Planung.

Preload/IPC ergänzen einen klaren Leseaufruf unter dem vorhandenen, bei jedem Aufruf aktuellen Modulguard. DB-Fehler erscheinen als technische Fehler, nicht als leere oder grüne Daten.

Vorhandener SiGeKo-Screen erhält ein Panel vor den Grunddaten. Es zeigt Status als Farbe und Text sowie konkrete Fehlstellen. „Bereitschaft aktualisieren“ liest ausschließlich gespeicherte Werte und erhält beide Entwürfe. Profil-/Rollenspeichern löst automatisch eine unabhängige Neuberechnung aus. Langsame oder fehlgeschlagene Readiness sperrt weder Grunddaten noch Navigation. Ein Lesefehler entfernt altes Grün; überholte Antworten und Antworten nach destroy werden verworfen. „Projektverwaltung öffnen“ verwendet den vorhandenen Router für die aktuelle Projekt-ID und bewahrt die bestehende Verwerfen-Warnung. „Profil und Projektrollen bearbeiten“ scrollt zum vorhandenen Grunddatenbereich.

Behörden stehen ausdrücklich auf Rot: „Noch nicht erfasst – folgt mit S4.“ Keine vorgezogene Behördenerfassung, Recherche oder PDF-Übernahme. Die Januar-2022-Referenz wird erst vor späterer Übernahme auf Aktualität geprüft. Rechnung #275 bleibt eingefroren.

## Warnung statt Sperre und spätere Anschlüsse

Der sichtbare Hinweis erklärt, dass fehlende/ungeprüfte Angaben die Grunddatenpflege nicht sperren. Readiness ist keine Berechtigung; bestehender Archiv-/Lizenzschutz bleibt eigenständig. #250 verlangt eine bewusste Fortfahren-Bestätigung vor den tatsächlichen Vorgängen Vorankündigung, SiGePlan und Bericht. Diese Einstiege entstehen erst S5–S7 und erhalten dann die Bestätigung auf Basis aktueller Readiness. S3 baut keine fiktiven Vorgänge, keine neue Routerplattform und behauptet für diese späteren Abläufe keinen End-to-End-Nachweis.

## UI-Vertrag und Prüfung

Vollständige A–F-Entwurfsentscheidung lag vor Produktänderung in `SIGEKO_S3_UI_ENTWURF.md` vor. 14 neue statische Ziele innerhalb derselben Komponente; insgesamt 121 Pflicht-Slots und 122 Scope-Ziele einschließlich bestehendem Headerstarter. Registry 33, Fingerprint `sha256:efbd9e9247a5122c5422ac818cb2305ea83e7870667d300032a8f9fbf86c8dec`. Keine zusätzliche Handliste, DOM-Erkennung oder Editorengine. Fachausführung und Datenmutation bleiben gesperrt. Tatsächliche Kit-Komponenten-/Ref-Validatoren und alle gemounteten Attribute/Parents grün; fremde Scope-Fingerprints unverändert.

Der alte HTML-Parser unterstützt das produktive M83-Vokabular weiterhin nicht; kein grüner Legacy-Parser behauptet. Maßgeblich ist die bestehende Kit-Vertragsprüfung, mit `{components: ...}` ausgeführt.

17 neue Readiness-Tests mit echter SQLite und IPC; 27 Formularprüfungen (10 neue), einschließlich offen gehaltener Prüfantworten, fehlender/gelöschter Quellen, Projektwechsel und Entwurferhalt. Unabhängiges Review wiederholt 17 Backend-, 27 Formular- und 19 Manifest-/Restore-/Entry-Prüfungen grün. Gefundener P2-Befund zur blockierenden Readiness in load/save korrigiert und unabhängig mit Deferred-Probe nachgeprüft; kein verbleibender reproduzierbarer Blocker.

Volltest `npm test`: 1641/97 → **1668/97**. Exakt gleiche Fehlernamen und Häufigkeiten, keine fehlende Bestandsprüfung. Ein vorhandener Slot-Testtitel wird passend von 107 auf 121 geändert; explizite IPC-/Preload-Inventare um den erlaubten Leseaufruf erweitert. Erster Lauf 1667/98 wegen noch alter Preload-Liste; nach Korrektur vollständiger Wiederholungslauf 1668/97. Rohvergleich und sämtliche Fehlerhäufigkeiten in `SIGEKO_S3_TESTVERGLEICH.json`. Exit 1 wegen bekannter Baseline bleibt transparent.

## Reale Windows-/Linux-Abnahme

[CI 34373164070](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34373164070), getesteter Produktkopf wie oben. Bestehende isolierte Electron-Plattform, echtes Preload/IPC/SQLite und ausschließlich SiGeKo-Lizenz. Reale Mausaktionen prüfen: initial Rot; vollständige freie Planung mit geerbter Ausführung wird beim Speichern grün; Refresh erhält zwei Entwürfe und alle sieben Domänentabellen; geleerter/entfernter Bauherr macht Rot, wieder verfügbare Zuordnung Grün; Profiländerungen wirken nur auf davon abhängige Rollen; Wechsel zum zweiten Projekt bleibt getrennt. Alle drei Nacharbeitsaktionen sichtbar/erreichbar durch Scrollen, Geometrie bei 1280 und 560 Pixel Fensterbreite, Screenshots für Panel und bisherige Grunddaten. Zentrale Navigation wird bis zur konkreten Router-Anfrage geprüft; das tatsächliche zentrale Formular ist im separaten vorhandenen Abnahmelauf enthalten. Kein neu behaupteter durchgehender Router-Rückkehrablauf.

Abnahmestatus: **Windows und Linux vollständig PASS**. Beide Reports `ok:true`, `rendererErrors:[]`, `manualConfirmed:false`; jeweils elf protokollierte Ablaufprüfungen. Screenshots beider Plattformen in breiter und schmaler Ansicht gesichtet: Texte lesbar, keine Panelüberlagerung, alle drei Aktionen durch Scrollen erreichbar. Windows-Testfenster passt auf die Arbeitsfläche 1024×720. Steffen hat die Restprüfung an Codex delegiert; persönlicher manueller PASS wird nicht behauptet.

Allgemeine [npm-CI 34373164188](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34373164188) rot: fehlendes UI-Editor-kit im Einzelcheckout sowie bekannte Popup-/Lizenzbaseline. Dedizierte Plattform checkt das vorhandene Kit auf `5e0d551d93e97c32d169ea6d5107186a44ecd47f` separat aus. Unverändert enger Altbereich des zentralen Projektformulars bei 560px bleibt getrennte bekannte Layoutgrenze; keine Behauptung, S3 repariere diesen Altbereich.

## Abschlussmodus

Goal-Arbeitslauf mit abgegrenzten Unteragenten: unabhängige Regeln/Review, Readiness-Backend/Tests, vorhandener Electron-Harness. Hauptagent koordiniert UI, Integration und Baseline. Computer-Use-Nachweis auf bestehender Windows-/Linux-Electronplattform, lokal kein Display. Abschlusskriterien erfüllt: beide Plattformen bestanden, Volltest exakt abgegrenzt, Review ohne Blocker, GitHub-PR und Ergebnisdokumentation. Nach dem CI-geprüften Produktkopf folgen ausschließlich Dokumentation und die im Abschlussvolltest geprüfte Preload-Testinventaranpassung; Produktcode und Abnahmeharness bleiben bytegleich. Integration über PR #330 nach abschließendem main-/Tree-Abgleich. Nächstes getrenntes Paket: S4 Behörden / Notfall / Versorger anhand #274/#277 und führender Fachplanung abgrenzen.
