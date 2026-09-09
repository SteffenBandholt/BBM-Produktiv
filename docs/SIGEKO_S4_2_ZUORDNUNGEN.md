# SiGeKo S4.2 – Projektzuordnungen, Snapshot und Lookup

Basis: integriertes S4.1, main `a4ed659291e5e24074c5d1a4c9f909d5acb6a199`, #255 sowie #274/#277. Rechnung #275 bleibt eingefroren.

## Entscheidung vor Umsetzung

A. Keine editorrelevante Ausgabe. B. Keine neue Oberfläche oder PDF-Struktur; vorhandene Readiness-Anbindung folgt separat in S4.3. C. Keine neuen Editorziele. D. Fachliche IPC-/Speicher-/Importaktionen sind keine Editoroperationen. E. Keine veränderte Parentstruktur. F. Reale SQLite-/IPC-/ZIP-Tests und Vergleich mit dem S4.1-Volltest (1693 erfolgreich, 97 bekannte Fehler); bestehende Windows-/Linux-Formularprüfung bleibt erhalten.

## Kleines Fachmodell

`sigeko_project_authorities` enthält eine aktuelle Zuordnung je BBM-Projekt und editierbarer Kategorie. Ein projektbezogener Fremdschlüssel mit Löschkaskade, stabile ID und Revision sichern die Zuordnung. Quelle-ID und Quellrevision sind Herkunftsangaben ohne Fremdschlüssel zum globalen Bestand. Der serverseitig aus sämtlichen Bestandsfeldern kopierte Snapshot liegt in einer SQLite-Textspalte; keine zweite JSON-Hauptpersistenz. Gespeichert werden außerdem die Baustellenadresse, die ausdrückliche projektbezogene Beurteilung und deren Begründung.

Bestandsänderungen schreiben bestehende Snapshots niemals um. Eine ausdrückliche neue Zuordnung ersetzt den aktuellen Projektkontakt. Unveränderliche Dokumentstände werden erst bei den späteren tatsächlichen Dokumentpaketen angelegt. Projekt-ZIP V6 transportiert nur die Zuordnungen mit Snapshots, niemals den globalen Behördenbestand. Fehlende oder inhaltlich abweichende Quellen am Ziel bleiben erkennbar; identische ID und Revision allein beweisen keine Übereinstimmung.

## Lookup und Prüfung

112 ist systemfest, Polizei enthält zusätzlich 110. Für die sieben bearbeitbaren Kategorien gilt: fehlende Kontakte Rot; vorhandene, aber unsichere Kontakte Orange mit konkretem Grund. Grün erfordert eine bestätigte unveränderte Quelle, unveränderte vollständige Baustellenadresse und belegte Projektzuständigkeit.

Automatisch übernehmbar ist genau ein bestätigter und vollständiger Datensatz mit dokumentiertem `scope_street`, `scope_zip` und `scope_city`, die sämtlich zur Baustellenadresse passen. Normalisierung beschränkt sich auf Unicode-NFC, Groß-/Kleinschreibung und Leerraum; keine angenommene Geokodierung, Abkürzungsauflösung, Entfernung oder Aktualitätsfrist. Bekannte widersprechende exakte Kandidaten verhindern automatische Eindeutigkeit. Grobe regionale Treffer allein widerlegen einen eindeutigen exakten Nachweis nicht und bleiben manuell prüfbar.

Krankenhaus und D-Arzt verlangen zusätzlich eine ausdrückliche projektbezogene Bestätigung der Nähe und Eignung. Ein bestätigter Bestandskontakt mit exaktem Adressbezug allein beweist dies nicht. Eine bereits so bestätigte aktuelle Zuordnung bleibt bei unveränderter Adresse und Quelle gültig.

Die manuelle Projektbestätigung bindet außerdem die damals bekannten exakten Kandidaten über einen serverseitigen SHA-256-Prüfwert ihrer vollständigen Datensätze. Bereits bewusst geklärte Konflikte bleiben nachvollziehbar. Neue oder geänderte widersprüchliche Kandidaten nach dieser Bestätigung führen erneut zu Orange; eine alte Notiz bestätigt keine später hinzugekommene Gegenevidenz.

Lesen und Vorschau speichern nichts. Eine ausdrückliche Sammelaktion übernimmt bekannte eindeutige Treffer ohne erneute Einzelbestätigung. Sowohl diese Aktion als auch manuelle Zuordnung prüfen Baustellenadresse, Quellrevision und erwartete Zuordnungsrevision innerhalb derselben Transaktion. Manuelle Beurteilung verlangt eine konkrete Begründung; eine unbestätigte Quelle bleibt trotz Projektbeurteilung Orange. Archivierte Projekte sind schreibgeschützt, Readiness erzeugt keine zusätzliche Arbeitssperre.

## Paketgrenze

Keine automatische Web-/KI-Recherche, kein Import aus der Behörden-PDF Januar 2022 oder fehlenden Alt-YAML-Dateien, keine neue Kontaktplattform. Keine UI, keine S5–S7-Prozessaktionen, keine Dokumenthistorie auf Vorrat.

## Prüfung und Integration

PR #332: Produktcommit `234b70c716f6b194d36f190dd3390f0329fecb2b`, Produkttree `9bff99d884d4daf8e87690828550df7cdce3a048` identisch mit lokal geprüftem Tree.

- 25 neue echte SQLite-/API-/Preload-/Lizenztests und 14 reale ZIP-Tests bestanden. Zehn vorhandene Bauherr-Transferprüfungen ebenfalls bestanden.
- Unabhängiger Review fand einen Fall neuer widersprüchlicher Evidenz nach manueller Bestätigung. Hashbindung korrigiert; beide Varianten (zweiter exakter Treffer sowie erster exakter Gegentreffer zu einer regionalen Quelle) unabhängig in Electron/SQLite nachgeprüft. Lesen verändert dabei weder Zuordnung noch Snapshot; ausdrückliche Neubestätigung bindet die aktuelle Lage.
- Erstvolltest: 1730/99, ausschließlich zwei veraltete IPC-Inventarlisten zusätzlich rot. Erwartete Endpunktlisten um die drei tatsächlich separat geprüften APIs ergänzt. Abschließender Volltest: **1732 grün / exakt dieselben 97 Baselinefehler**, +39 erfolgreiche Prüfungen, keine verschwundenen grünen Tests. Namen und Häufigkeiten in `SIGEKO_S4_2_TESTVERGLEICH.json`.
- Windows-/Linux-CI **34381539474 vollständig PASS**, je 39 neue S4.2-Prüfungen und bestehende reale Formularabnahme (11 Checks, rendererErrors leer, manualConfirmed false). PR #332 wird mit geprüftem Produktstand und anschließendem reinen Dokumentationsdelta integriert.
- Allgemeine npm-CI 34381539608 weiterhin bekannte fehlende Kit-/Popup-/Lizenzbaseline; Protokoll separat geprüft. Kein grüner Gesamt-CI-Status behauptet.

S4.2 verändert keine Oberfläche. Der bestehende echte Formularlauf prüft weiterhin S2.4/S3 samt ausdrücklichem S4-UI-Platzhalter. Die produktive Behördenanzeige und Readiness-Anbindung werden erst im nachfolgenden S4.3 ergänzt. Kein persönlicher manueller PASS behauptet.
