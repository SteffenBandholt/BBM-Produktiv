# SiGeKo S4.3 – Bedienung und Readiness

Basis: S4.2 integriert über PR #332, main `cfbfb09a4e7c18d0dee13d266dac4e443f479adf`. S4.3 wird als eigenes Paket über PR #333 geprüft. Rechnung #275 bleibt eingefroren.

## Verhalten

Der vorhandene SiGeKo-Screen zeigt acht feste Statuszeilen, einen gemeinsamen Bestandseditor und die getrennte Baustellenzuordnung. 112 und 110 bleiben systemfest. Speichern, fachliche Bestandsbestätigung und Projektbeurteilung sind getrennte Aktionen. Krankenhaus/D-Arzt verlangen eine begründete Nähe-/Eignungsprüfung; eindeutige bestätigte nichtmedizinische Adresstreffer können gesammelt übernommen werden. Der gespeicherte Projektkontakt und seine Nachweise bleiben nach Bestandsänderungen oder Quellenverlust sichtbar, mit aktuellem Prüfbedarf.

Readiness übernimmt den berechneten Behördenstatus und nennt konkrete Kategorien/Gründe. Rot/Orange verhindern keine Grunddatenpflege. Aktualisieren erhält Bestandsfelder und Prüfnotizen sowie fremde Profil-/Rollenentwürfe. Kategorien-, Kontakt- und Projektwechsel schützen ungespeicherte Angaben. Bei Fehlern bleiben keine alten grünen Projektanzeigen stehen. Quellen- und Projektantwort werden gemeinsam als Behördenpanel ausgewertet; Profil-/Rollenbedienung und Readiness laufen unabhängig davon.

## Review und Korrekturen

- Sammelübernahme war bei ungespeicherten Bestandsfeldern noch aktiv. Sie berücksichtigt nun wie Einzelzuordnung den Entwurfschutz, einschließlich neuem leerem Kontakt und beider Prüfnotizen.
- Schnelle Behördenantwort konnte vor bekanntem Projekt-/Archivstatus globale Bestandsaktionen freigeben. Mutationen verlangen nun einen geladenen passenden aktiven Projektstand. Vier Deferred-Testvarianten prüfen verzögertes Projektlesen beziehungsweise Kontaktlisten mit anschließend aktivem oder archiviertem Projekt.
- Bei dieser Prüfung wurde eine bestehende Ladeabhängigkeit sichtbar: Ein geladenes Profil blieb bis zum Abschluss der Rollenladung gesperrt. Jeder Grunddatenzweig aktualisiert seine Freigaben jetzt bei eigenem Abschluss; keine Behörden-/Rollenwartezeit sperrt ein bereits geladenes Profil.

Die beiden P2-Befunde wurden unabhängig anhand der produktiven Methoden nachgeprüft. Abschließender Quellenreview ohne Restblocker.

## Technische Prüfungen

43 Formularprüfungen (16 neue S4.3-Fälle), 19 Readiness-Prüfungen (2 neue), 12 Einstiegs- und 7 Manifestprüfungen bestanden. Genau 85 neue statische Ziele gemäß der vor Umsetzung ausgegebenen A–F-Entscheidung: 206 Pflichtslots, 207 Scopeziele einschließlich Header-Editorlauncher. Vollständige Kit-Komponentenvalidierung, sechs reale Ref-Attribute und Parents geprüft. Registry 34, Fingerprint `sha256:ac1c61ce1cd614c4384349315f12bf0d70dbc652b31b338b48d1d81a350457d3`; fremde Scope-Fingerprints unverändert.

Volltest auf Produktcommit `446b102dbb2e470f55327a60d57f53955697d3b5`, Tree `add3293adcd3478b72dc359df77b02e036c3875e`: **1750 grün / exakt dieselben 97 Baselinefehler**, +18 erfolgreiche Tests. Drei bewusst aktualisierte Testtitel sind explizit zugeordnet; keine verlorenen grünen Tests. Exakte Namens-/Häufigkeitsabgrenzung in `SIGEKO_S4_3_TESTVERGLEICH.json`.

Allgemeine npm-CI 34383400072 zeigt weiterhin die bekannte fehlende Kit-/Popup-/Lizenzbaseline. Kein grüner Gesamt-CI-Status behauptet; maßgeblich sind vollständiger lokaler Vergleich und die gesonderte reale SiGeKo-Matrix.

## Echte Windows-/Linux-Abnahme

Bestehender isolierter Electronlauf um sieben Kontakte mit echter Maus-/Preload-/IPC-/SQLite-Speicherung, ausdrückliche Bestandsprüfung, medizinische Projektbeurteilung, Sammelübernahme, A/B-Isolation, SQLite-Reopen, Snapshotstabilität, Quellenverlust, Entwürfe, Archiv/Lizenz und breite/schmale Geometrie erweitert. 16 tatsächliche Prüfblöcke, sechs neue Behörden-Screenshots. Keine Fake-DOM-Geometrie als tatsächliche Bedienabnahme ausgegeben; kein persönlicher manueller PASS behauptet.

Erster CI-Versuch 34383400109 erreichte alle Linux-Codeprüfungen, scheiterte anschließend vor dem Fensterstart an einem externen Google-APT-Hashfehler beim Displaysetup. Windows wurde durch den Matrixabbruch mitgestoppt. Die Wiederholung scheiterte identisch. Separater CI-Commit `77ebf3ca309dd070efa6fca7c50a2b9783861ca6` beschränkt beide APT-Aufrufe auf die vorhandene Ubuntu-Quelldatei (`test -s` davor), ohne Signatur-/Hashprüfung abzuschalten. `fail-fast: false` lässt Windows unabhängig weiterlaufen. Unabhängig geprüft; ausschließlich Workflow geändert, Produkt-/Harnessdateien gegenüber dem Volltest unverändert. Neuer Lauf 34383932389: Linux einschließlich echtem Electron-Formularlauf PASS, 16 Prüfblöcke, keine Rendererfehler. Alle sechs Behörden-Screenshots visuell geprüft; Felder und Aktionen innerhalb der Fensterbreite, lange Inhalte umbrechend und per Scrollen erreichbar. Windows ebenfalls vollständig PASS: 16 Prüfblöcke, rendererErrors leer, manualConfirmed false; breite/schmale Geometrie und Screenshots geprüft, finales Fenster passt in die 1024×720-Arbeitsfläche. Gesamtlauf **34383932389 Windows/Linux erfolgreich**, Jobs 102575327555 und 102575328048.

## Paketgrenze und Fortsetzung

S4 verwendet ausschließlich gemeinsame Infrastruktur plus kleine eigene Fachtabellen. Keine automatische Web-/KI-Recherche, kein Import aus der Januar-2022-PDF oder fehlenden YAML-Dateien, keine behauptete Aktualität historischer Adressen. Keine S5–S7-Vorgänge oder PDF-/Mailwege umgesetzt. S4 ist mit den getrennt geprüften Paketen S4.1 (PR #331), S4.2 (PR #332) und S4.3 (PR #333) technisch abgeschlossen. Abschließender Dokumentationscommit verändert ausschließlich Status, Bericht und Testvergleich; Produkt-/Harnessstand bleibt exakt wie in der erfolgreichen Windows/Linux-CI. Main-Merge wird anschließend in #255/#274/#277 dokumentiert. Nächster fachlicher Schritt ist S5 Vorankündigung; keine S5-Umsetzung Bestandteil dieses Pakets.
