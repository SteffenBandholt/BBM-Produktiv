# S2.4 – UI-/PDF-Entwurfsentscheidung (vor Umsetzung)

Base: main `741fa37366e07643c1257955cd119c89f1423050`; Fortsetzung #274/#277 nach S2.3 / PR #327.

A. Ausgabe: **UI**, Grunddaten im vorhandenen SiGeKo-Screen. Keine PDF-Ausgabe.

B. Editorfähig: **ja**, bestehender Scope `sigeko.screen`, Komponente `bbm.sigeko.screen`. Keine Inhaltstabelle: Personen-Dropdowns sind Bedienauswahl und bleiben außerhalb des Tabelleneditors.

C. Vollständige explizite Elementdeklaration unten. Spalten entsprechen `data-ui-inspector-id`, `data-ui-editor-kind`, `data-ui-editor-label`, `data-ui-editor-parent`, `data-ui-editor-editable`, `data-ui-editor-ops`. `G` = `move,resizeWidth,resizeHeight,setVisibility`, `T` = G plus `textResize`. Reihenfolge ist Tabellenreihenfolge (`order` ab 0); alle `visible=true`, `editable=true`, stabile IDs/semanticKey/refKey aus Deklaration, Single-Refs, alle Slots verpflichtend. Typ ist zugleich kind. Root: Rolle scopeRoot; Gruppen: layout; Felder: dataFieldLayout; Buttons: domainActionLayout; Rückmeldungen `.notice`, `.profile.status`, `.roles.status`: status; übrige Labels: content. Eingabeart steht in letzter Spalte; componentKind input/select/checkbox entsprechend. Baseline: x/y=0, width/height=null, fontSize=12, min/max width=8/2400, height=8/1600, fontSize=6/32. Gruppeneffekte groupWithChildren, Root layoutZone, sonst elementOnly.

D. **Gesperrt für jedes Element**: executeTargetAction, modifyDomainData, createRecord, deleteRecord. Fachliches Speichern, Dateiauswahl, Entfernen der Logo-Verknüpfung, Navigation, IPC- und Datenbankaktionen sind niemals Editoroperationen. Buttonlayouts bleiben editierbar. Kein Autosave. Profil und Rollen separat speichern; Logo nur bestehende lokale Dateireferenz, keine Upload-/Dateiverwaltung. Bestehende zentrale Kontakte ausschließlich lesen.

E. Parent-Struktur entspricht den realen Containern. Alle Felder bleiben gemountet; bei anderer Quelle oder „wie Planung“ werden nicht zutreffende Eingaben deaktiviert. Keine aus Fachdaten abgeleiteten IDs, keine DOM-Erkennung. Vorhandene Kit-Helfer und explizite Ref-Registrierung; Lifecycle bei vollständigem Render/destroy.

F. Prüfungen: vorhandener `scripts/ui-editor-contract-check.cjs`; echte M83-Komponenten-/Ref-Validierung und Registry-/Manifest-/Profil-Restore-Tests; neue fachliche Formularprüfungen und isolierter Electron-/SQLite-Bedienablauf auf vorhandener Abnahmeplattform. Volltest mit exaktem Vergleich gegen 1584 grün / 97 bekannte Fehler. Windows-Abnahme durch Nutzer gemäß #274 B6 vor Merge. Diese Entscheidung behauptet noch keine bestandene Prüfung.

Alte SiGeKo-Layoutprofile können wegen des erweiterten Scope-Vertrags inkompatibel sein; reguläre Fingerprint-Prüfung bleibt wirksam. Alle fremden Scopes einschließlich geplanter Baubeginn müssen unverändert bleiben.

| ID | kind | label | parent | editable | ops | fieldKind |
|---|---|---|---|---|---|---|
| sigeko.screen | root | SiGeKo-Arbeitsbereich | – | true | G | – |
| sigeko.screen.header | group | Kopfbereich | sigeko.screen | true | G | – |
| sigeko.screen.title | label | SiGeKo | sigeko.screen.header | true | T | – |
| sigeko.screen.project | label | Aktives Projekt | sigeko.screen.header | true | T | – |
| sigeko.screen.navigation | group | Navigation | sigeko.screen | true | G | – |
| sigeko.screen.workspace | button | Projektarbeitsbereich | sigeko.screen.navigation | true | T | – |
| sigeko.screen.projects | button | Projekt wechseln | sigeko.screen.navigation | true | T | – |
| sigeko.screen.notice | label | Umsetzungsstand | sigeko.screen | true | T | – |
| sigeko.screen.planned | group | Geplante Bereiche – noch nicht umgesetzt | sigeko.screen | true | G | – |
| sigeko.screen.planned.title | label | Geplante Bereiche | sigeko.screen.planned | true | T | – |
| sigeko.screen.planned.text | label | Noch nicht umgesetzte Bereiche | sigeko.screen.planned | true | T | – |
| sigeko.screen.basic | group | Grunddaten | sigeko.screen | true | G | – |
| sigeko.screen.basic.title | label | Grunddaten | sigeko.screen.basic | true | T | – |
| sigeko.screen.profile | group | Eigenes SiGeKo-Profil | sigeko.screen.basic | true | G | – |
| sigeko.screen.profile.title | label | Eigenes SiGeKo-Profil | sigeko.screen.profile | true | T | – |
| sigeko.screen.profile.hint | label | Profilhinweis | sigeko.screen.profile | true | T | – |
| sigeko.screen.profile.fields | group | Profildaten | sigeko.screen.profile | true | G | – |
| sigeko.screen.profile.name | fieldGroup | Name – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.name.label | label | Name | sigeko.screen.profile.name | true | T | – |
| sigeko.screen.profile.name.input | field | Name | sigeko.screen.profile.name | true | T | text |
| sigeko.screen.profile.street | fieldGroup | Straße / Hausnummer – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.street.label | label | Straße / Hausnummer | sigeko.screen.profile.street | true | T | – |
| sigeko.screen.profile.street.input | field | Straße / Hausnummer | sigeko.screen.profile.street | true | T | text |
| sigeko.screen.profile.zip | fieldGroup | Postleitzahl – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.zip.label | label | Postleitzahl | sigeko.screen.profile.zip | true | T | – |
| sigeko.screen.profile.zip.input | field | Postleitzahl | sigeko.screen.profile.zip | true | T | text |
| sigeko.screen.profile.city | fieldGroup | Ort – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.city.label | label | Ort | sigeko.screen.profile.city | true | T | – |
| sigeko.screen.profile.city.input | field | Ort | sigeko.screen.profile.city | true | T | text |
| sigeko.screen.profile.phone | fieldGroup | Telefon – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.phone.label | label | Telefon | sigeko.screen.profile.phone | true | T | – |
| sigeko.screen.profile.phone.input | field | Telefon | sigeko.screen.profile.phone | true | T | text |
| sigeko.screen.profile.email | fieldGroup | E-Mail – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.email.label | label | E-Mail | sigeko.screen.profile.email | true | T | – |
| sigeko.screen.profile.email.input | field | E-Mail | sigeko.screen.profile.email | true | T | text |
| sigeko.screen.profile.logo | fieldGroup | Logo auswählen – Feldgruppe | sigeko.screen.profile.fields | true | G | – |
| sigeko.screen.profile.logo.label | label | Logo auswählen | sigeko.screen.profile.logo | true | T | – |
| sigeko.screen.profile.logo.input | field | Logo auswählen | sigeko.screen.profile.logo | true | T | file |
| sigeko.screen.profile.logoPath | label | Gewähltes Logo | sigeko.screen.profile | true | T | – |
| sigeko.screen.profile.logoClear | button | Logo entfernen | sigeko.screen.profile | true | T | – |
| sigeko.screen.profile.save | button | Profil speichern | sigeko.screen.profile | true | T | – |
| sigeko.screen.profile.status | label | Profilstatus | sigeko.screen.profile | true | T | – |
| sigeko.screen.roles | group | Projektrollen | sigeko.screen.basic | true | G | – |
| sigeko.screen.roles.title | label | SiGeKo im Projekt | sigeko.screen.roles | true | T | – |
| sigeko.screen.roles.hint | label | Rollenhinweis | sigeko.screen.roles | true | T | – |
| sigeko.screen.roles.panels | group | Planung und Ausführung | sigeko.screen.roles | true | G | – |
| sigeko.screen.planning | group | Planung | sigeko.screen.roles.panels | true | G | – |
| sigeko.screen.planning.title | label | Planung | sigeko.screen.planning | true | T | – |
| sigeko.screen.planning.source | fieldGroup | Zuordnung aus – Feldgruppe | sigeko.screen.planning | true | G | – |
| sigeko.screen.planning.source.label | label | Zuordnung aus | sigeko.screen.planning.source | true | T | – |
| sigeko.screen.planning.source.input | field | Zuordnung aus | sigeko.screen.planning.source | true | T | select |
| sigeko.screen.planning.contact | fieldGroup | Person – Feldgruppe | sigeko.screen.planning | true | G | – |
| sigeko.screen.planning.contact.label | label | Person | sigeko.screen.planning.contact | true | T | – |
| sigeko.screen.planning.contact.input | field | Person | sigeko.screen.planning.contact | true | T | select |
| sigeko.screen.planning.free | group | Freie Angaben | sigeko.screen.planning | true | G | – |
| sigeko.screen.planning.free.name | fieldGroup | Name – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.name.label | label | Name | sigeko.screen.planning.free.name | true | T | – |
| sigeko.screen.planning.free.name.input | field | Name | sigeko.screen.planning.free.name | true | T | text |
| sigeko.screen.planning.free.street | fieldGroup | Straße / Hausnummer – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.street.label | label | Straße / Hausnummer | sigeko.screen.planning.free.street | true | T | – |
| sigeko.screen.planning.free.street.input | field | Straße / Hausnummer | sigeko.screen.planning.free.street | true | T | text |
| sigeko.screen.planning.free.zip | fieldGroup | Postleitzahl – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.zip.label | label | Postleitzahl | sigeko.screen.planning.free.zip | true | T | – |
| sigeko.screen.planning.free.zip.input | field | Postleitzahl | sigeko.screen.planning.free.zip | true | T | text |
| sigeko.screen.planning.free.city | fieldGroup | Ort – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.city.label | label | Ort | sigeko.screen.planning.free.city | true | T | – |
| sigeko.screen.planning.free.city.input | field | Ort | sigeko.screen.planning.free.city | true | T | text |
| sigeko.screen.planning.free.phone | fieldGroup | Telefon – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.phone.label | label | Telefon | sigeko.screen.planning.free.phone | true | T | – |
| sigeko.screen.planning.free.phone.input | field | Telefon | sigeko.screen.planning.free.phone | true | T | text |
| sigeko.screen.planning.free.email | fieldGroup | E-Mail – Feldgruppe | sigeko.screen.planning.free | true | G | – |
| sigeko.screen.planning.free.email.label | label | E-Mail | sigeko.screen.planning.free.email | true | T | – |
| sigeko.screen.planning.free.email.input | field | E-Mail | sigeko.screen.planning.free.email | true | T | text |
| sigeko.screen.planning.resolved | label | Gespeicherte Zuordnung | sigeko.screen.planning | true | T | – |
| sigeko.screen.execution | group | Ausführung | sigeko.screen.roles.panels | true | G | – |
| sigeko.screen.execution.title | label | Ausführung | sigeko.screen.execution | true | T | – |
| sigeko.screen.execution.same | fieldGroup | Ausführung wie Planung – Feldgruppe | sigeko.screen.execution | true | G | – |
| sigeko.screen.execution.same.label | label | Ausführung wie Planung | sigeko.screen.execution.same | true | T | – |
| sigeko.screen.execution.same.input | field | Ausführung wie Planung | sigeko.screen.execution.same | true | T | checkbox |
| sigeko.screen.execution.source | fieldGroup | Zuordnung aus – Feldgruppe | sigeko.screen.execution | true | G | – |
| sigeko.screen.execution.source.label | label | Zuordnung aus | sigeko.screen.execution.source | true | T | – |
| sigeko.screen.execution.source.input | field | Zuordnung aus | sigeko.screen.execution.source | true | T | select |
| sigeko.screen.execution.contact | fieldGroup | Person – Feldgruppe | sigeko.screen.execution | true | G | – |
| sigeko.screen.execution.contact.label | label | Person | sigeko.screen.execution.contact | true | T | – |
| sigeko.screen.execution.contact.input | field | Person | sigeko.screen.execution.contact | true | T | select |
| sigeko.screen.execution.free | group | Freie Angaben | sigeko.screen.execution | true | G | – |
| sigeko.screen.execution.free.name | fieldGroup | Name – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.name.label | label | Name | sigeko.screen.execution.free.name | true | T | – |
| sigeko.screen.execution.free.name.input | field | Name | sigeko.screen.execution.free.name | true | T | text |
| sigeko.screen.execution.free.street | fieldGroup | Straße / Hausnummer – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.street.label | label | Straße / Hausnummer | sigeko.screen.execution.free.street | true | T | – |
| sigeko.screen.execution.free.street.input | field | Straße / Hausnummer | sigeko.screen.execution.free.street | true | T | text |
| sigeko.screen.execution.free.zip | fieldGroup | Postleitzahl – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.zip.label | label | Postleitzahl | sigeko.screen.execution.free.zip | true | T | – |
| sigeko.screen.execution.free.zip.input | field | Postleitzahl | sigeko.screen.execution.free.zip | true | T | text |
| sigeko.screen.execution.free.city | fieldGroup | Ort – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.city.label | label | Ort | sigeko.screen.execution.free.city | true | T | – |
| sigeko.screen.execution.free.city.input | field | Ort | sigeko.screen.execution.free.city | true | T | text |
| sigeko.screen.execution.free.phone | fieldGroup | Telefon – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.phone.label | label | Telefon | sigeko.screen.execution.free.phone | true | T | – |
| sigeko.screen.execution.free.phone.input | field | Telefon | sigeko.screen.execution.free.phone | true | T | text |
| sigeko.screen.execution.free.email | fieldGroup | E-Mail – Feldgruppe | sigeko.screen.execution.free | true | G | – |
| sigeko.screen.execution.free.email.label | label | E-Mail | sigeko.screen.execution.free.email | true | T | – |
| sigeko.screen.execution.free.email.input | field | E-Mail | sigeko.screen.execution.free.email | true | T | text |
| sigeko.screen.execution.resolved | label | Gespeicherte Zuordnung | sigeko.screen.execution | true | T | – |
| sigeko.screen.roles.save | button | Projektrollen speichern | sigeko.screen.roles | true | T | – |
| sigeko.screen.roles.status | label | Rollenstatus | sigeko.screen.roles | true | T | – |

## Präzisierung des Prüfankers nach Ausführung

Der alte HTML-Parser `scripts/ui-editor-contract-check.cjs` unterstützt nur das frühere Vokabular (`move,resize,hide,layout`), nicht die seit M83 produktiv verwendeten Typen und Operationen. Auf den unverändert übernommenen elf Einstiegselementen entstehen bereits dieselben Typ-/Operationsfehler; die ausgegebene vollständige M83-Metadatenliste liefert 189 solcher Parsermeldungen. Das ist **kein bestandener Legacy-Check**. Der Parser und Editor-Core werden in diesem Paket nicht verändert.

Maßgeblicher technischer Nachweis für diese bestehende M83-Anbindung: echte Kit-Funktionen `validateUiComponentContracts` (bei Registry-Aggregation) und `validateUiComponentReferenceBindings` (über `validateM83ComponentReferences`) sowie die neuen Formularprüfungen aller 107 tatsächlich gemounteten Slots, sechs Pflichtattribute, realer Parents und Datenaktionssperren. Manifest- und echte Profil-Restore-Prüfungen bleiben unverändert wirksam. Der Review hat die Abgrenzung bestätigt.

Kontaktquellen werden ausschließlich über den vorhandenen neutralen `firmDirectory`-Dienst gelesen. Der isolierte Electronlauf registriert dessen echten IPC-Registrar unter reiner SiGeKo-Lizenz; keine ersatzweise registrierten Protokoll-Kontaktkanäle.

## Nachbesserung der manuellen Abnahme – vor Umsetzung

Nutzerbefund: Speichern/Ende nicht erkennbar, Testfenster möglicherweise größer als
sichtbarer Bildschirm. A: UI, ausschließlich isolierte native Abnahmefenstersteuerung.
B: keine neuen editorfähigen Ziele; alle 107 Produkt-Slots bleiben unverändert.
C/E: IDs, Parents, Operationen und Produktformular werden nicht verändert. Native
Fenstergrenzen verwenden die verfügbare Monitor-Arbeitsfläche. D: Der vorhandene
native Fensterschließen-Button ist Teststeuerung außerhalb des DOM-/Layouteditors,
keine Fachspeicherung. Nach der Wiederöffnungsprüfung öffnet X die ausdrückliche
PASS/FAIL-Frage; X alleine gilt niemals als bestandene Abnahme. F: bestehender
Windows-/Linux-Electron-Abnahmelauf; zusätzlicher tatsächlicher Close-Versuch prüft,
dass das Fenster erhalten und lediglich die Abschlussanfrage gesetzt wird. Die
abschließende manuelle Nutzerbestätigung bleibt zwingend offen.
