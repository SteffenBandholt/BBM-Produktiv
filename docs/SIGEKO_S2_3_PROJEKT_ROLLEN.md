# S2.3 – SiGeKo-Projekt und Rollenzuordnungen

Basis: main `26ec98f292649b7c12d9844cf30fefa1eed084c3`, PR #326 / S2.2.
Branch: `codex/sigeko-s2-3-project-roles`. Führend: #274, #277, #250.

## Fachentscheidung und Paketgrenze

Steffen hat die Rollenverknüpfung bestätigt (#274, Kommentar 5589689697):
Der eigene SiGeKo wird mit Name, Anschrift und Logo einmal im Modul gepflegt.
Bei einem übernommenen Projekt kann Planung ein anderer Koordinator sein,
während Ausführung den eigenen Modulstandard verwendet. Beide Rollen können
gezielt auf vorhandene Kontakte oder freie Projektangaben verweisen. Der
Regelfall bleibt Planung = Modulstandard, Ausführung = wie Planung.

S2.3 ist das Daten-/Anwendungspaket in Container 5: bestehende BBM-Projekte
fachlich erweitern, Rollen speichern und über die vorhandene geschützte
Preload-/IPC-Grenze lesen/schreiben. Die Modulstandard-Persistenz ist unmittelbare
Voraussetzung der bestätigten Rollenregel, keine zweite Kontaktverwaltung.

Keine neue sichtbare Oberfläche. UI-/PDF-Entwurfsentscheidung: keine
editorrelevante Ausgabe; keine Elemente, Parent-Strukturen oder Editoroperationen.
Computer Use und manuelle Windows-Bedienabnahme sind für dieses Datenpaket nicht
erforderlich. Automatisierte Electron-/SQLite-Prüfungen laufen zusätzlich in
bestehender Windows-/Linux-CI. Keine neue Testplattform oder Abhängigkeit.

Kurzfahrplan: S2.3 Datenmodell/Anwendungsgrenze prüfen und integrieren; danach
separates Grunddaten-Bedienpaket gemäß S2/S3; Behörden erst S4. Rechnung #275,
Protokollfachlogik, Editor, PDF-/Mailausgabe und Blankovorlagen bleiben unberührt.
Die Behörden-PDF (Januar 2022) bleibt Referenz für S4; Aktualität vor Übernahme
prüfen. In S2.3 wurde sie weder inhaltlich geprüft noch übernommen.

## Speicherung und Besitz

Die bestehende BBM-SQLite-Datei erhält über den vorhandenen modularen Registrar:

- `sigeko_profiles`: genau ein Datensatz `standard`, Name, Straße/Hausnummer,
  PLZ, Ort, Telefon, E-Mail, `logo_path`, `created_at`, `updated_at`.
- `sigeko_projects`: UUID, eindeutige `project_id` mit FK/Löschkaskade, getrennte
  Quellen für Planung/Ausführung, optionale Personen-FKs, freie Kontaktfelder,
  `execution_same_as_planning`, `created_at`, `updated_at`.

Die Migration läuft atomar, additiv und wiederholbar. Keine automatischen
SiGeKo-Projekte oder Profile beim Lesen bzw. Migrieren. Core-only legt die neuen
Tabellen nicht an; Deaktivierung löscht bereits gespeicherte Fachangaben nicht.
Zentrale Projekte, Bauherr-/Architektenzuordnung und Firmen bleiben unverändert.
Kein Ableiten von Planer = Architekt und keine neue zentrale Pflichtrolle.

| Rollenquelle | Speicherung | Auflösung |
|---|---|---|
| `module` | nur Quellenkennung | aktueller Modulstandard, ohne Projektkopie |
| `person` | zentrale Personen-ID | bestehende Person und Firmenanschrift |
| `project_person` | Projektpersonen-ID | bestehende Person/Firma desselben Projekts |
| `free` | projektbezogene Name-/Anschrift-/Kontaktfelder | nur diese freien Werte |

„Wie Planung“ löst die aktuelle Planungsrolle auf. Einschalten entfernt eine
vorherige separate Ausführungszuordnung. Nach Abschalten ist die separate
Ausführung zunächst Modulstandard, falls keine neue Quelle angegeben wird.
Alte verdeckte Freiangaben tauchen nicht wieder auf. Eine übergebene Rollenangabe
ersetzt diese Rolle vollständig; ausgelassene Rollen bleiben erhalten.

Kontakte werden über vorhandene Repositories gelesen. Neue Zuordnungen erfordern
verfügbare Person und Firma; Projektpersonen werden serverseitig auf das Projekt
geprüft. Entfernte Quellen ergeben `values: null, sourceMissing: true`, niemals
einen stillen Ersatz durch den eigenen SiGeKo. Bei endgültiger Personenlöschung
setzt SQLite die FK auf NULL; die gewählte Quellenart bleibt erkennbar. Ein
historischer Kontaktsnapshot ist hier nicht implementiert: unveränderliche
Dokument-Snapshots gehören in die jeweiligen späteren Dokumentpakete.

Die Logoangabe ist eine nullable Dateireferenz, entsprechend bestehender
Profiltechnik. S2.3 lädt/kopiert/verarbeitet keine Logodatei. Auswahl, Vorschau,
Dateiprüfung und Dokumentverwendung gehören in das entsprechende Bedien-/Ausgabepaket.

## Anwendungsgrenze

`SigekoProjectService` besitzt ausschließlich die folgenden Fachoperationen:

| Preload | IPC | Wirkung |
|---|---|---|
| `sigekoGetCoordinatorProfile` | `sigeko:getCoordinatorProfile` | Modulprofil lesen |
| `sigekoSaveCoordinatorProfile` | `sigeko:saveCoordinatorProfile` | explizite Profilfelder ändern |
| `sigekoGetProjectData` | `sigeko:getProjectData` | zentrales Projekt und aufgelöste Rollen lesen |
| `sigekoSaveProjectData` | `sigeko:saveProjectData` | Projekterweiterung anlegen bzw. Rollen ändern |

Speichern geschieht atomar. Fremde Felder, widersprüchliche Quellen, falsche
Projektpersonen und nicht boolesches „wie Planung“ werden abgewiesen. Leere
Kontaktfelder bleiben zulässig; Vollständigkeitsbewertung folgt erst in S3.
Fehlendes/undefined Profilfeld erhält den Wert, null/leerer Text leert ihn.
Archivierte Projekte sind lesbar, vor Rollenänderung aber wiederherzustellen.

Der bestehende modulare IPC-Guard prüft bei jedem Aufruf die aktuelle Lizenz.
Keine neue Lizenzlogik, keine Freigabe über allgemeine Settings-IPC, keine
SiGeKo-Schreibmöglichkeit für zentrale Projektdaten. Get-/Save-Fehler werden
explizit als Fehler statt Erfolg geliefert.

## Notwendiger Projekt-ZIP-Datenerhalt

Der gemeinsame Projekt-Export löscht nach erfolgreicher Sicherung das lokale
Projekt. Daher ist die additive Transferanbindung Bestandteil desselben Pakets:

- Neue Projektzeile in `data/sigeko_projects.json`, IDs/Zeitstempel unverändert.
- Archive mit SiGeKo-Zeile verwenden Format 4. Alte BBM-Importer lehnen diese
  Version ab; ohne SiGeKo bleibt Format 3. Alte Archive bleiben importierbar.
- Version 4 verlangt genau eine vollständige SiGeKo-Zeile. Fehlende, defekte,
  schemafremde oder projektfremde Daten brechen vor bzw. innerhalb der atomaren
  DB-Transaktion ab. Keine erfolgreiche Teilübernahme.
- Neue Rollen-IDs werden an die bestehende Prüfung globaler Personenabhängigkeiten
  angeschlossen. Es gibt kein ID-Remapping und keine automatische zentrale
  Kontaktanlage. Fehlende/kollidierende zentrale Zielpersonen verhindern Import.
- Projektpersonen werden zusammen mit ihren Projektfirmen importiert; eine
  Projektpersonenrolle darf nur eine Person des importierten Projekts verwenden.
- Bei fehlender SiGeKo-Tabelle stoppt der Import ausdrücklich. Transfer führt
  keine zusätzliche unlizenzierte Migration aus.
- Fehlende Protokoll-/Restarbeitentabellen werden beim Export als leer gelesen.
  Dadurch funktioniert der Rundlauf auch auf einer frischen SiGeKo-only-DB.

Der Modulstandard und seine Logodatei sind kein Projektbestand und werden im
Projekt-ZIP nicht übertragen oder überschrieben. Eine Modulreferenz verwendet
nach Import den aktuellen Standard der Zielinstallation. Ist dort keiner
hinterlegt, bleibt die Quelle ausdrücklich fehlend. Das gilt nur für aktuelle
Grunddaten; spätere bereits erzeugte Dokumente behalten ihre eigenen Snapshots.

## Prüfungen und Review

15 neue Tests verwenden echte SQLite-Dateien, produktive Migrationen,
Repositories, Fachservice, Preload, modularen IPC-Guard sowie echte ZIP-Dateien.
Vorhandener S2.1-Testaufbau wird wiederverwendet; keine Ersatz-Testplattform.
Abgedeckt: Altbestand, wiederholte Migration, Singleton/UNIQUE/FKs, Neustart,
Projektwechsel, eigenes/externes Rollenbeispiel, Quellenwechsel, Quellenverlust,
Vererbung, atomare Fehler, Archiv/Löschung, Lizenzentzug und ZIP-Rundlauf/-Fehler.

Ein historischer S1.1-Test wird fachlich fortgeschrieben: Die neue Fachmigration
ist nicht mehr schema-neutral; er prüft jetzt Erhalt aller vorhandenen Tabellen
plus ausschließlich die zwei S2.3-Tabellen. IPC-/Preload-Inventare berücksichtigen
die vier zusätzlichen Operationen. Übrige technische S1-Grenzen bleiben geprüft.

Unabhängiger Quellenreview einschließlich neuer Dateien ohne Blocker; 14 erste
Pakettests sowie der zusätzliche SiGeKo-only-ZIP-Test wurden im Review selbst
unter Electron ausgeführt. Architektur-/Transferanalyse ebenfalls separat
lesend, ohne Produktcodeänderungen durch Unteragenten.

Ein erster Volltest auf unstaged Änderungen wurde von alten Restarbeiten-V2-
Tests abgebrochen: Sie prüfen `git diff --name-only` gegen eine historische
Datei-Whitelist außerhalb des normalen Test-Reporters. Dadurch wurden nachfolgende
Prüfungen nicht ausgeführt. Dieser Lauf ist ausdrücklich kein vollständiger
Regressionsnachweis. Die Tests werden nicht aufgeweicht; der vollständige
zum Commit vorgemerkte Snapshot wird wie ein sauberer CI-Checkout erneut geprüft.
Der tatsächliche Paket-Diff wird zusätzlich vollständig per `git diff --cached`
reviewt. Kein Rechnungs-/Restarbeiten-Produktcode wurde verändert.

Der bekannte FakeDB-Fehler des meetingTopsRepo-Tests bleibt `db.transaction is
not a function`: zuvor Rechnungsmigration, jetzt bereits SiGeKo-Migration. Das
ist dieselbe unvollständige Datenbankattrappe; kein echter SQLite-Fehler.

Volltest auf gleicher UTC-Laufzeit: main **1569 grün / 97 Fehler**, Kandidat
**1584 grün / exakt dieselben 97 Fehlernamen**. Keine neuen Fehler, keine fehlenden
Bestandsprüfungen; ein fachlich fortgeschriebener S1.1-Testname ist ausdrücklich
zugeordnet. Details und Log-Hashes: `SIGEKO_S2_3_TESTVERGLEICH.json`.
Git-Diff-/Syntaxprüfung grün. [PR #327](https://github.com/SteffenBandholt/BBM-Produktiv/pull/327),
geprüfter Produktcommit `028d444fd3e6074dfed3f9bd7bf63b832d10ff2a`.
Der Remote-Git-Baum `2713aea70bc962d48ec61b3c24bf02487ecc6616` ist exakt der
lokal geprüfte Baum. Lokaler Git-Push hatte keine Anmeldung; Veröffentlichung
über die verbundene GitHub-Schnittstelle, danach erfolgreicher Fetch und
Baumvergleich. Arbeitsbranch auf diesen identischen Remote-Stand abgeglichen.

[CI 34263318599](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34263318599)
ist vollständig grün: Windows und Linux jeweils 15 S2.3-Pakettests, 13 bestehende
S2.1-Persistenztests, 9 S2.2-Formulartests und vorhandener realer Electron-Formularlauf.
Die UI selbst wurde in diesem Paket nicht verändert; keine neue manuelle
Windows-Abnahme beansprucht. Reviewer hat den zusätzlichen SiGeKo-only-Exportdelta
separat geprüft und den dazugehörigen Test selbst erneut grün ausgeführt.

Standard-CI 34263318786 bleibt rot: bekannte fehlende UI-Editor-kit-Dateien sowie
Popup-/Lizenzfehler. Alle 15 neuen S2.3-Tests sind auch dort grün. Das ersetzt den
vollständigen lokalen Vergleich nicht und wird nicht als grüne Standard-CI ausgegeben.
Nach diesem geprüften Produktstand ausschließlich Dokumentationsänderungen.
Technischer S2.3-Abschluss und Integration über PR #327; finaler Merge-Hash
wird im GitHub-Abschluss in #274/#277 dokumentiert.
