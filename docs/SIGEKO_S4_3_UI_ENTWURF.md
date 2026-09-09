# SiGeKo S4.3 – UI-/PDF-Entwurfsentscheidung vor Umsetzung

Base main `cfbfb09a4e7c18d0dee13d266dac4e443f479adf`, integrierte Pakete S4.1/S4.2. Branch `codex/sigeko-s43-authority-ui`. Verbindlich #255/#274/#277; Rechnung #275 eingefroren.

Goal-Arbeitslauf: Oberfläche, Readiness, echte Windows-/Linux-Bedienprüfung, Review und separate PR-Integration. Vorhandene SQLite-/IPC-/Modul-/Projekt-/Editorinfrastruktur verwenden. Keine Recherche, Datenübernahme aus PDF Januar 2022 oder fehlenden YAML-Dateien, keine neuen S5–S7-Vorgänge.

## A. Ausgabe

UI im vorhandenen SiGeKo-Screen. Acht statische Statuszeilen in Vorlagenreihenfolge, ein wiederverwendbares Bestandsformular für sieben bearbeitbare Kategorien und ein getrennter Bereich für den gespeicherten Projektkontakt und seine Beurteilung. Keine Tabelle und keine PDF-Ausgabe. Bereitschaft erhält einen direkten Scrollweg zur Behördenpflege; der bestehende Platzhalter verliert diesen nun umgesetzten Bereich.

## B. Editorfähigkeit

Ja, vorhandener Scope `sigeko.screen`, Komponente `bbm.sigeko.screen`. Bestehende 121 Slots bleiben erhalten. Hinzu kommen die folgenden 85 statischen Single-Ref-Slots, insgesamt 206, mit externem Header-Editorlauncher 207 Scopeziele. Keine IDs aus Bestandsdatensätzen oder automatisch untersuchtem DOM. Selektoroptionen sind Fachdaten, keine einzelnen Editorziele.

## C. Vollständige Elementdeklaration

Spalten stehen für die sechs DOM-Attribute: ID=`data-ui-inspector-id`, Typ=`data-ui-editor-kind`, Name=`data-ui-editor-label`, Parent=`data-ui-editor-parent`, editable=`data-ui-editor-editable`, ops=`data-ui-editor-ops`. G=move,resizeWidth,resizeHeight,setVisibility. T=G plus textResize. Alle visible/editable true, stableIdSource declaration, semanticKey/refKey gleich ID. Order 121–205 in Tabellenreihenfolge. Gruppenrolle layout, Feldrolle dataFieldLayout, Labels content; `.status` und Kategorie-Statuslabels Rolle status. Buttons domainActionLayout mit angegebenem actionKind. Baseline x/y/textOffsetX/textOffsetY 0, width/height null, fontSize12, visibletrue, spacing{}; Grenzen width8–2400,height8–1600,fontSize6–32. Multiline-Felder textarea mit fieldKind multilineText, Feldgrenzen height24–720. Übrige Felder input/text oder select/select wie angegeben. Auswahlart group für group/fieldGroup, label bzw statusText für Labels, field für Felder, button für Buttons. Auswahlstufe gleich Auswahlart, spacingTargets leer, Gruppenwirkungen groupWithChildren, sonst elementOnly; geometry.maximumStoredOffset2400. Bestehende m83Element/m83DomainButton-Defaults verwenden.

| ID | Typ | Name | Parent | editable | ops | Feldart / Aktion |
|---|---|---|---|---|---|---|
| sigeko.screen.authorities | group | Behörden / Notfall / Versorger | sigeko.screen | true | G | – |
| sigeko.screen.authorities.title | label | Behörden / Notfall / Versorger | sigeko.screen.authorities | true | T | – |
| sigeko.screen.authorities.hint | label | Behördenhinweis | sigeko.screen.authorities | true | T | – |
| sigeko.screen.authorities.status | label | Behördenstatus | sigeko.screen.authorities | true | T | – |
| sigeko.screen.authorities.overview | group | Projektkontakte im Überblick | sigeko.screen.authorities | true | G | – |
| sigeko.screen.authorities.overview.labor | label | Arbeitsschutzbehörde | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.hospital | label | Krankenhaus / ZNA | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.doctor | label | D-Arzt | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.water | label | Wasser | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.electricity | label | Stromnetz | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.gas | label | Gasnetz | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.emergency | label | Notruf 112 | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.overview.police | label | Polizei | sigeko.screen.authorities.overview | true | T | – |
| sigeko.screen.authorities.refresh | button | Behörden aktualisieren | sigeko.screen.authorities | true | T | refreshSigekoAuthorities |
| sigeko.screen.authorities.apply | button | Eindeutige Treffer übernehmen | sigeko.screen.authorities | true | T | applyKnownProjectAuthorities |
| sigeko.screen.authorities.record | group | Wiederverwendbarer Bestand | sigeko.screen.authorities | true | G | – |
| sigeko.screen.authorities.record.title | label | Bestandskontakt bearbeiten | sigeko.screen.authorities.record | true | T | – |
| sigeko.screen.authorities.record.hint | label | Bestandshinweis | sigeko.screen.authorities.record | true | T | – |
| sigeko.screen.authorities.category | fieldGroup | Kategorie – Feldgruppe | sigeko.screen.authorities.record | true | G | – |
| sigeko.screen.authorities.category.label | label | Kategorie | sigeko.screen.authorities.category | true | T | – |
| sigeko.screen.authorities.category.input | field | Kategorie | sigeko.screen.authorities.category | true | T | select |
| sigeko.screen.authorities.contact | fieldGroup | Bestandskontakt – Feldgruppe | sigeko.screen.authorities.record | true | G | – |
| sigeko.screen.authorities.contact.label | label | Bestandskontakt | sigeko.screen.authorities.contact | true | T | – |
| sigeko.screen.authorities.contact.input | field | Bestandskontakt | sigeko.screen.authorities.contact | true | T | select |
| sigeko.screen.authorities.new | button | Neuen Kontakt anlegen | sigeko.screen.authorities.record | true | T | newAuthorityDraft |
| sigeko.screen.authorities.record.fields | group | Kontaktdaten und Nachweise | sigeko.screen.authorities.record | true | G | – |
| sigeko.screen.authorities.record.organization | fieldGroup | Stelle / Einrichtung / Betreiber – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.organization.label | label | Stelle / Einrichtung / Betreiber | sigeko.screen.authorities.record.organization | true | T | – |
| sigeko.screen.authorities.record.organization.input | field | Stelle / Einrichtung / Betreiber | sigeko.screen.authorities.record.organization | true | T | text |
| sigeko.screen.authorities.record.street | fieldGroup | Straße / Hausnummer – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.street.label | label | Straße / Hausnummer | sigeko.screen.authorities.record.street | true | T | – |
| sigeko.screen.authorities.record.street.input | field | Straße / Hausnummer | sigeko.screen.authorities.record.street | true | T | text |
| sigeko.screen.authorities.record.zip | fieldGroup | Postleitzahl – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.zip.label | label | Postleitzahl | sigeko.screen.authorities.record.zip | true | T | – |
| sigeko.screen.authorities.record.zip.input | field | Postleitzahl | sigeko.screen.authorities.record.zip | true | T | text |
| sigeko.screen.authorities.record.city | fieldGroup | Ort – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.city.label | label | Ort | sigeko.screen.authorities.record.city | true | T | – |
| sigeko.screen.authorities.record.city.input | field | Ort | sigeko.screen.authorities.record.city | true | T | text |
| sigeko.screen.authorities.record.phone | fieldGroup | Telefon – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.phone.label | label | Telefon | sigeko.screen.authorities.record.phone | true | T | – |
| sigeko.screen.authorities.record.phone.input | field | Telefon | sigeko.screen.authorities.record.phone | true | T | text |
| sigeko.screen.authorities.record.email | fieldGroup | E-Mail – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.email.label | label | E-Mail | sigeko.screen.authorities.record.email | true | T | – |
| sigeko.screen.authorities.record.email.input | field | E-Mail | sigeko.screen.authorities.record.email | true | T | text |
| sigeko.screen.authorities.record.emergency_phone | fieldGroup | Havarie-/Störkontakt – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.emergency_phone.label | label | Havarie-/Störkontakt | sigeko.screen.authorities.record.emergency_phone | true | T | – |
| sigeko.screen.authorities.record.emergency_phone.input | field | Havarie-/Störkontakt | sigeko.screen.authorities.record.emergency_phone | true | T | text |
| sigeko.screen.authorities.record.source | fieldGroup | Quelle – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.source.label | label | Quelle | sigeko.screen.authorities.record.source | true | T | – |
| sigeko.screen.authorities.record.source.input | field | Quelle | sigeko.screen.authorities.record.source | true | T | text |
| sigeko.screen.authorities.record.scope_street | fieldGroup | Zuständig für Straße / Hausnummer – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.scope_street.label | label | Zuständig für Straße / Hausnummer | sigeko.screen.authorities.record.scope_street | true | T | – |
| sigeko.screen.authorities.record.scope_street.input | field | Zuständig für Straße / Hausnummer | sigeko.screen.authorities.record.scope_street | true | T | text |
| sigeko.screen.authorities.record.scope_zip | fieldGroup | Bezugs-PLZ – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.scope_zip.label | label | Bezugs-PLZ | sigeko.screen.authorities.record.scope_zip | true | T | – |
| sigeko.screen.authorities.record.scope_zip.input | field | Bezugs-PLZ | sigeko.screen.authorities.record.scope_zip | true | T | text |
| sigeko.screen.authorities.record.scope_city | fieldGroup | Bezugsort – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.scope_city.label | label | Bezugsort | sigeko.screen.authorities.record.scope_city | true | T | – |
| sigeko.screen.authorities.record.scope_city.input | field | Bezugsort | sigeko.screen.authorities.record.scope_city | true | T | text |
| sigeko.screen.authorities.record.scope_district | fieldGroup | Bezirk / Kreis – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.scope_district.label | label | Bezirk / Kreis | sigeko.screen.authorities.record.scope_district | true | T | – |
| sigeko.screen.authorities.record.scope_district.input | field | Bezirk / Kreis | sigeko.screen.authorities.record.scope_district | true | T | text |
| sigeko.screen.authorities.record.scope_area | fieldGroup | Dokumentiertes Bezugsgebiet – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.scope_area.label | label | Dokumentiertes Bezugsgebiet | sigeko.screen.authorities.record.scope_area | true | T | – |
| sigeko.screen.authorities.record.scope_area.input | field | Dokumentiertes Bezugsgebiet | sigeko.screen.authorities.record.scope_area | true | T | multilineText |
| sigeko.screen.authorities.record.verification_note | fieldGroup | Fachlicher Prüfnachweis – Feldgruppe | sigeko.screen.authorities.record.fields | true | G | – |
| sigeko.screen.authorities.record.verification_note.label | label | Fachlicher Prüfnachweis | sigeko.screen.authorities.record.verification_note | true | T | – |
| sigeko.screen.authorities.record.verification_note.input | field | Fachlicher Prüfnachweis | sigeko.screen.authorities.record.verification_note | true | T | multilineText |
| sigeko.screen.authorities.record.save | button | Bestand speichern | sigeko.screen.authorities.record | true | T | saveAuthorityRecord |
| sigeko.screen.authorities.record.confirm | button | Bestandsprüfung bestätigen | sigeko.screen.authorities.record | true | T | confirmAuthorityRecord |
| sigeko.screen.authorities.record.reason | fieldGroup | Grund für Unsicherheit – Feldgruppe | sigeko.screen.authorities.record | true | G | – |
| sigeko.screen.authorities.record.reason.label | label | Grund für Unsicherheit | sigeko.screen.authorities.record.reason | true | T | – |
| sigeko.screen.authorities.record.reason.input | field | Grund für Unsicherheit | sigeko.screen.authorities.record.reason | true | T | multilineText |
| sigeko.screen.authorities.record.uncertain | button | Bestand als unsicher markieren | sigeko.screen.authorities.record | true | T | markAuthorityUncertain |
| sigeko.screen.authorities.record.status | label | Bestandsprüfstatus | sigeko.screen.authorities.record | true | T | – |
| sigeko.screen.authorities.assignment | group | Kontakt für diese Baustelle | sigeko.screen.authorities | true | G | – |
| sigeko.screen.authorities.assignment.title | label | Projektzuordnung | sigeko.screen.authorities.assignment | true | T | – |
| sigeko.screen.authorities.assignment.snapshot | label | Gespeicherter Projektkontakt | sigeko.screen.authorities.assignment | true | T | – |
| sigeko.screen.authorities.assignment.hint | label | Projektbezogener Prüfhinweis | sigeko.screen.authorities.assignment | true | T | – |
| sigeko.screen.authorities.assignment.note | fieldGroup | Projektbezogene Prüfung / Begründung – Feldgruppe | sigeko.screen.authorities.assignment | true | G | – |
| sigeko.screen.authorities.assignment.note.label | label | Projektbezogene Prüfung / Begründung | sigeko.screen.authorities.assignment.note | true | T | – |
| sigeko.screen.authorities.assignment.note.input | field | Projektbezogene Prüfung / Begründung | sigeko.screen.authorities.assignment.note | true | T | multilineText |
| sigeko.screen.authorities.assignment.confirm | button | Zuständigkeit bestätigen und zuordnen | sigeko.screen.authorities.assignment | true | T | assignConfirmedProjectAuthority |
| sigeko.screen.authorities.assignment.uncertain | button | Mit Prüfbedarf zuordnen | sigeko.screen.authorities.assignment | true | T | assignUncertainProjectAuthority |
| sigeko.screen.readiness.editAuthorities | button | Behördenkontakte bearbeiten | sigeko.screen.readiness | true | T | navigateSigekoAuthorities |

## D. Fachaktionen und Entwurfschutz

executeTargetAction, modifyDomainData, createRecord und deleteRecord für alle Slots gesperrt. Editor verändert Layout, keine Eingaben, Bestätigung, Speicherung, Zuordnung, Import oder IPC-Aktion. 112 systemfest und ausschließlich Übersicht; Polizei zusätzlich 110 getrennt vom örtlichen Kontakt. Keine 112-Mutationsauswahl.

Bestand speichern bestätigt weder Quelle noch Projektzuständigkeit. Bestandsbestätigung verlangt gespeicherte Werte und vorhandene Pflichtnachweise; Projektbestätigung verlangt separat eine konkrete Begründung (Krankenhaus/D-Arzt ausdrücklich Nähe und Eignung). Ungespeicherte Bestandsfelder sperren beide Bestätigungen, Unsicherheitsmarkierung und Projektzuordnung; sichtbarer Entwurf darf nicht mit altem gespeichertem Datensatz verwechselt werden. Erfolgreiche Speicherung/Zuordnung behauptet kein Grün: berechnete Unsicherheit bleibt sichtbar.

Hinweis: gespeicherter Projektkontakt bleibt bei Bestandsänderungen unverändert; vorhandene Zuordnungen können erneut prüfbedürftig werden. Bei fehlender Quelle bleibt der vollständige gespeicherte Snapshot sichtbar. Andere Quelle wählen oder neue Quelle erstellen und danach ausdrücklich zuordnen. Sammelübernahme nur angebotener eindeutiger fehlender Kontakte, ohne Einzelbestätigung; keine Ersetzung vorhandener Zuordnungen. Ohne Vorschläge deaktiviert. Archiviertes Projekt in dieser Oberfläche schreibgeschützt.

## E. Parent-/Lade-/Bedienstruktur

Alle Parents gemäß Tabelle tatsächlich vorhanden und explizit registriert; gesamtes Panel bleibt gemountet. Responsive vorhandene Formularstile mit umbrechenden Buttons und 220px-Grid; Felder/Buttons bleiben bei schmalem Fenster per Scrollen erreichbar. Multiline-Prüftexte in Textareas. Bestands-/Kategorieauswahl zeigt einen Kontakt im gemeinsamen Formular, Projektbereich separat den gespeicherten Snapshot.

Kategorie-/Kontaktwechsel, Neu und Navigation schützen Bestandsentwurf sowie Unsicherheits-/Projektprüfnotiz über vorhandene ausdrückliche Verwerfbestätigung. Aktualisieren erhält alle Entwürfe. Quellen-/Projektlesen läuft unabhängig von Profil-/Rollenladen und Readiness; hängende Behörden-/Readiness-Anfragen sperren keine fremden Formulare. Veraltete Antworten nach neuer Anfrage oder destroy werden verworfen, Fehler löschen alte Grünanzeigen. Mutationen nur nach geladenen passenden Daten/Revisionen; nach Erfolg Projektkontakte und Readiness neu lesen, ohne fremde Entwürfe zu überschreiben.

## F. Prüfung

Bestehende Kit-Komponentenvalidierung mit `{components: BBM_M83_COMPONENT_CONTRACTS}`, reale gemountete Ref-/Attributprüfung, Registryfingerprint und Manifest synchronisieren; fremde Scopes unverändert. Bekannter Legacy-HTML-Parser weiterhin Baseline, keine Erweiterung dieser Engine. Neue Bedien-/Async-/Payload-Tests, bestehende Grunddaten-/Readinessprüfungen an aktuellen Umfang anpassen; Volltestvergleich exakt gegen S4.2 1732/97.

Vorhandener isolierter echter Electronlauf unter Windows/Linux wird um alle acht Statuskategorien, Bestand speichern/bestätigen ohne automatische Zuordnung, Projektzuordnung/Unsicherheit, Sammelübernahme, Snapshot nach Bestandsänderung, Projektwechsel, Entwurferhalt, Archiv-/Lizenzschutz, schmale/breite Geometrie mit erreichbaren Aktionen und Screenshots erweitert. Lokales Display fehlt; CI ist der tatsächliche Computer-Use-Nachweis. Nutzer hat verbleibende UI-Prüfung an Codex delegiert; kein persönlicher manueller PASS wird behauptet.
