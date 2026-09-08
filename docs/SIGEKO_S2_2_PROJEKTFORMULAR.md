# SiGeKo S2.2 – geplanter Baubeginn im zentralen Projektformular

Basis: main `5d67c6a` / S2.1 / PR #325. Übergabe: PR #326.
Produktcommit: `22b91045f5e50b99cbfe2cd581e8ef909940f29c`.
Status: technisch und manuell abgenommen; Integration über PR #326.

## Ziel und Paketgrenze

Container 3: gemeinsame Projektdomäne. Das bestehende produktive
`ProjectFormHubScreen` erweitert `ProjectFormScreen`; beide benutzen dieselbe
neue Datumseingabe und denselben vorhandenen Create-/Update-IPC.
`geplanter_baubeginn` ist unabhängig von `start_date` und `end_date`.
Altprojekte bleiben zunächst leer. Kein Ableiten, Backfill oder SiGeKo-Schreibweg.
Leere Eingabe wird wie bei den bestehenden Feldern als null übertragen.
Die neue Zeile sitzt rechts zwischen Start-/Enddatum und Notizen.

Keine Änderung an Datenbank, Projekt-IPC, Protokollsettings, Rechnungsmodul #275,
PDF-/Mailwegen oder Blankovorlagen. S2.3 wird nicht vorgezogen.
Abbruchgrenze: notwendiger Umbau angrenzender Protokollsettings oder ungeklärte
Feldbedeutung. Beides trat nicht ein.

## UI-Entscheidung vor Umsetzung

Ausgabe UI, editorfähig ja, ausschließlich die neue Zeilenkomponente.
Das alte Formular hat keinen vorhandenen lokalen Editorvertrag; die gesperrten
Scopes `bbm.projects` und `bbm.dialogs` bleiben gesperrt. Keine Vollregistrierung
des Altformulars und keine zweite Registry-/Editorinfrastruktur.

Komponente `bbm.projektverwaltung.plannedStart`, Scope
`projektverwaltung.plannedStart`; nachfolgend `P` als Kurzschreibweise:

| ID / Ref-Key | Typ / Rolle | Parent | Label | Ref |
|---|---|---|---|---|
| P | root / scopeRoot | keiner | Geplanter Baubeginn – Zeile | single |
| P.group | fieldGroup / layout | P | Geplanter Baubeginn – Feldgruppe | single |
| P.label | label / content | P.group | Geplanter Baubeginn | single |
| P.input | field / date | P.group | Geplanter Baubeginn | single |
| P.editor | button / domainActionLayout | P | UI-Editor | optional multi, 0 oder 1 Instanz |

Der lokale Vertrag deklariert vier Pflichtslots sowie den vorhandenen
DEV-Launcher als `whenVisibleInstances`. Alle IDs sind konstant; Registrierung
verwendet direkte beim Bau gespeicherte Referenzen, keine DOM-Suche.
`data-ui-inspector-id`, `data-ui-editor-kind`, `data-ui-editor-label`,
`data-ui-editor-parent`, `data-ui-editor-editable`, `data-ui-editor-ops` werden
durch den vorhandenen Ref-Adapter aus dem Vertrag gesetzt.

Alle Ziele sind layout-editierbar: move, resizeWidth, resizeHeight,
setVisibility; Label/Input/Button zusätzlich textResize. Sichtbare Grenzen
und Operationseffekte folgen `m83Element`/`m83DomainButton`; die vier
Grundslots haben 8..2400 Breite, 8..1600 Höhe und 6..32 Schriftgröße.
Geometriebaselines werden am tatsächlichen Element erfasst.
Fachwerte, Speichern, Anlegen, Löschen, Import, Export, Upload und Autosave
sind keine Editoroperationen. DOMAIN_LOCKS bleiben verbindlich.

Die neue Scopegruppe steht wegen des Modalvorrangs an erster Stelle; die
bisherige Reihenfolge der aktiven Scope-Inventarliste bleibt erhalten.
Schließen/Destroy entfernen ausschließlich die eigenen Komponentenrefs;
Wiederöffnen bindet sie neu. Späte DEV-Launcherantworten reaktivieren keine
geschlossene Komponente. Der optionale Button nutzt den vorhandenen
`installDevelopmentUiEditorOpenButton` und `openNativeUiEditor`.

## Prüfungen und Grenzen

Neun neue Formular-/Payload-/Ref-Prüfungen; zehn zusätzliche grüne Volltests,
einschließlich des vorhandenen dynamischen Scope-Profil-Restoretests.
Volltest main 1559/97 → Kandidat 1569/97; exakt dieselben 97 Fehlernamen,
kein fehlender bisher grüner Prüffall. Details in
`SIGEKO_S2_2_TESTVERGLEICH.json`. Alle acht bisherigen aktiven
Scope-Fingerprints gegen main bytegleich. Keine bestehende Baseline repariert.

Zwei ältere Testaufbauten simulierten pauschal jede registrierte UI gleichzeitig.
Ihre Restarbeiten-/Protokoll-Prüfung mountet jetzt ausdrücklich ihre bisherigen
Ziele, während das neue Modal in den S2.2-Prüfungen separat abgedeckt ist.
Inventarassertionen berücksichtigen ausschließlich die hinzugefügte Komponente.

CI 34254557659 und final 34254859948 (Abnahmeharness `a3b2ae1`): Windows und Linux jeweils 13 S2.1-Persistenztests,
9 S2.2-Formulartests und echte Electron-Abnahme grün. Die Abnahme lädt den
produktiven Hub samt Standard-CSS, benutzt produktiven Preload/Projekt-IPC und
isolierte SQLite-Datei. Geprüft: Mausklick auf Speichern/Abbrechen,
Wiederöffnen nach DB-Verbindungswechsel, Erhalt der bisherigen Projektfelder,
Leeren auf null, Neuanlage, fünf Ref-Ziele, Geometrie ohne Überlappung und
tatsächliche Schriftänderung ohne Datumsänderung.
Windows- und Linux-Screenshots wurden tatsächlich gesichtet: Datumseingabe und
Label lesbar, eigene Zeile ohne Überschneidung, Footer sichtbar.
Der Abnahmeharness registriert den bestehenden ElectronUiEditorSessionController
für den echten Startup-Layoutweg; kein fehlender Startup-IPC-Handler mehr.

Der historische statische `ui-editor-contract-check.cjs` bildet nicht den
vollständigen M83-Komponentenvertrag ab. Maßgeblich sind die echte
Kit-Aggregation/Validierung und `validateM83ComponentReferences`, beide grün.
Eine native Editorfenster-/Profilbedienung wird durch den Formularharness
nicht nachgewiesen. Standard-`npm test` bleibt mit dokumentierter Baseline rot.

## Manuelle Abnahme bestanden

Der ursprüngliche S2.2-Detailplan verlangt eine enge manuelle UI-Prüfung.
Auf dem Ergebnisbranch: `npm run test:sigeko:s2.2:form`.
Nach den automatischen Prüfungen führt der isolierte Dialog durch:
Altprojekt öffnen, Startdatum 01.09.2026 und geplanten Baubeginn 01.10.2026
eingeben, Speichern klicken, automatisch erneut öffnen, beide Werte und
Bedienbarkeit prüfen. Erst die abschließende Benutzerbestätigung ergibt
`manualConfirmed: true` im Bericht. Alle Testdaten bleiben im isolierten Profil.

Steffen hat den Aufruf mit `--manual` und den abschließenden PASS aus dem
isolierten Profil `bbm-ui-editor-acceptance-ZBxktr` übermittelt. Der gezeigte
Programmablauf prüft beide erwarteten Daten nach dem Wiederöffnen und verlangt
danach die ausdrückliche Bestätigung der sichtbaren Werte und Bedienbarkeit.
Dieser Terminalnachweis wird als bestandene manuelle S2.2-Abnahme dokumentiert.
Die JSON-Datei wurde nicht übertragen oder hier gelesen.

Zwei vorherige Läufe meldeten abweichende Startdaten (`2001-02-01` bzw.
`2001-09-01`). Nach Hinweis auf die getrennte Tag-/Monat-/Jahr-Eingabe bestand
der erneute Lauf ohne Codeänderung. Die genaue Ursache der früheren Eingaben
wird aus den Logs nicht als bewiesener Produktfehler oder bewiesener Bedienfehler
abgeleitet. S2.2 ist damit abgenommen; S2.3 bleibt unbegonnen.
