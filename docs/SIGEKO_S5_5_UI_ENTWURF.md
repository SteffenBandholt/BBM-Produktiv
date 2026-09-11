# S5.5 – Vereinfachte Vorankündigung

Verbindliche Nutzerentscheidung vom 11.09.2026. Ersetzt für die produktive
Bedienung den S5.4-Rücklauf-/Entwurfsstatusprozess. S5.4 bleibt historischer
Abnahmenachweis. Umsetzung auf `main` / `e3f1197f`, Kit-Pin `5e0d551`.

## Arbeitsmodus und Grenzen

Goal-Arbeitslauf; ein koordinierter Unteragent für den gemeinsamen Outlookadapter.
Primär Fachmodul SiGeKo (Container 5), notwendige neutrale Outlook-Erweiterung
in Container 3 separat prüfen/committen. Kein Modellwechsel wird behauptet.
Erlaubt: SiGeKo-Screen/Verträge, Workflow-Service/-Repository/-Schema,
projektbezogene Empfängereinstellungen, IPC/Preload, Projekttransfer,
neutrale Outlook-Erweiterung, zugehörige Tests und Dokumentation.
Nicht enthalten: Rechnung, S6/SiGePlan, PDF-Satz, Kit-Entwicklung, allgemeine
Terminverwaltung, automatischer Versand oder Versandnachweis.
Windows/Outlook ist hier nicht verfügbar; diese Abnahme bleibt explizit offen.

## Bestätigter Ablauf

PDF mit bestehender Pipeline erstellen, im Projekt speichern und über vorhandene
PDF-Vorschau drucken. Empfänger zuvor in SiGeKo-Projektdaten frei eingeben oder
aus vorhandenen Adressdaten übernehmen. Kein automatischer Kontaktneuanlageweg.
Rückgabedatum eingeben; Outlook direkt mit Empfängern, PDF/Firmenanlage und
vorbereitetem Text öffnen. Text fordert Rückgabe bis Datum an Absenderadresse.
Nach Schließen des Entwurfs (auch Verwerfen) fragt BBM Ja/Nein zur Outlook-Aufgabe
„VA schon zurück“ zum Rückgabedatum. Nein erzeugt nichts. Kein Send-Nachweis.
BBM speichert manuell nur „VA zurück“ und „VA an Behörde“, jeweils mit Datum.
Keine Rücklaufdatei erforderlich, kein Behörden-Mailvorgang in diesem UI,
kein Mailformular und keine automatisch fortgeschriebene Prozessampel.
Vorhandene PDF-Fassungen und historische Rücklaufdaten bleiben erhalten.

## A/B – Ausgabe und Editorfähigkeit

UI, editorfähig ja. Bestehender Formular- und PDF-Vertrag unverändert.
Keine neue Inhaltstabelle. Empfängerauswahl ist eine Bedienauswahl.
Native Outlookfenster und Electron-Ja/Nein-Dialog sind keine BBM-Editorziele.

## C – vollständige Änderungsliste

IDs sind jeweils `Scope + Suffix`. Bestehende übrige Ziele behalten sämtliche
Metadaten. Die folgenden expliziten Deklarationen sind die vollständige neue
Teilstruktur; keine Erkennung aus DOM/Fachdaten.

Für jede Zeile gelten die sechs Attribute:
`data-ui-inspector-id` = ID; `data-ui-editor-kind` = deklarierter Elementtyp (M83-Vertrag); `data-ui-editor-label` = Name;
`data-ui-editor-parent` = Parent-ID; `data-ui-editor-editable` = true;
`data-ui-editor-ops` = move,resizeWidth,resizeHeight,setVisibility,
zusätzlich textResize für label/field/button.
`refKey` = ID, Single-Ref, required/always. Order = Reihenfolge der expliziten
Komponentendeklaration, sichtbar true, role layout für Gruppen, content für
Labels, status für Statuslabel, dataFieldLayout für Felder,
domainActionLayout für Buttons. Bestehende M83-Baselines/Grenzen gelten:
minWidth/minHeight 8, maxWidth 2400/maxHeight 1600, Schrift 6–32.

Scope `sigeko.preNotification`, Parent außerhalb der Teilstruktur `.pdf`:

| Suffix | Name | Typ / fieldKind | Parent-Suffix |
|---|---|---|---|
| .pdf.workflow | Versand und Abschluss | group | .pdf |
| .pdf.workflow.title | Versand und Abschluss | label | .pdf.workflow |
| .pdf.workflow.recipients | Empfänger | label | .pdf.workflow |
| .pdf.workflow.editRecipients | Empfänger im Projekt festlegen | button | .pdf.workflow |
| .pdf.workflow.due | Rückgabe bis – Feldgruppe | fieldGroup | .pdf.workflow |
| .pdf.workflow.due.label | Rückgabe bis | label | .pdf.workflow.due |
| .pdf.workflow.due.input | Rückgabe bis | field/date | .pdf.workflow.due |
| .pdf.workflow.open | In Outlook öffnen | button | .pdf.workflow |
| .pdf.workflow.returned | VA zurück – Feldgruppe | fieldGroup | .pdf.workflow |
| .pdf.workflow.returned.label | VA zurück | label | .pdf.workflow.returned |
| .pdf.workflow.returned.input | VA zurück | field/checkbox | .pdf.workflow.returned |
| .pdf.workflow.returnedOn | Rücklaufdatum – Feldgruppe | fieldGroup | .pdf.workflow |
| .pdf.workflow.returnedOn.label | Rücklaufdatum | label | .pdf.workflow.returnedOn |
| .pdf.workflow.returnedOn.input | Rücklaufdatum | field/date | .pdf.workflow.returnedOn |
| .pdf.workflow.authoritySent | VA an Behörde – Feldgruppe | fieldGroup | .pdf.workflow |
| .pdf.workflow.authoritySent.label | VA an Behörde | label | .pdf.workflow.authoritySent |
| .pdf.workflow.authoritySent.input | VA an Behörde | field/checkbox | .pdf.workflow.authoritySent |
| .pdf.workflow.authoritySentOn | Versanddatum – Feldgruppe | fieldGroup | .pdf.workflow |
| .pdf.workflow.authoritySentOn.label | Versanddatum | label | .pdf.workflow.authoritySentOn |
| .pdf.workflow.authoritySentOn.input | Versanddatum | field/date | .pdf.workflow.authoritySentOn |
| .pdf.workflow.save | Angaben speichern | button | .pdf.workflow |
| .pdf.workflow.status | Speicher-/Outlookmeldung | label/status | .pdf.workflow |

Scope `sigeko.screen`, Parent außerhalb `.basic`:

| Suffix | Name | Typ / fieldKind | Parent-Suffix |
|---|---|---|---|
| .vaRecipients | Vorankündigung – Empfänger im Projekt | group | .basic |
| .vaRecipients.title | Vorankündigung – Empfänger | label | .vaRecipients |
| .vaRecipients.addresses | E-Mail-Adressen – Feldgruppe | fieldGroup | .vaRecipients |
| .vaRecipients.addresses.label | E-Mail-Adressen (mit Semikolon trennen) | label | .vaRecipients.addresses |
| .vaRecipients.addresses.input | E-Mail-Adressen (mit Semikolon trennen) | field/text | .vaRecipients.addresses |
| .vaRecipients.choice | Aus Adressdaten – Feldgruppe | fieldGroup | .vaRecipients |
| .vaRecipients.choice.label | Aus Adressdaten übernehmen | label | .vaRecipients.choice |
| .vaRecipients.choice.input | Aus Adressdaten übernehmen | field/select | .vaRecipients.choice |
| .vaRecipients.add | Adresse übernehmen | button | .vaRecipients |
| .vaRecipients.save | Empfänger speichern | button | .vaRecipients |
| .vaRecipients.status | Empfängerstatus | label/status | .vaRecipients |

Alte untergeordnete Workflow-Ziele entfallen aus Vertrag und Mount gemeinsam.
IDs .pdf.workflow/title/status werden mit passender neuer Beschriftung erhalten.

## D/E – Sperren und Parentstruktur

Alle Ziele sperren executeTargetAction,modifyDomainData,createRecord,deleteRecord.
Speichern, Mailübergabe, Adressübernahme, Navigation, Druck, Erinnerungsanlage
und Checkbox-Fachwerte sind niemals Editoroperationen. Buttons bleiben lediglich
im Layout bearbeitbar. Jeder Parent ist deklariert; Root bleibt bestehend.
Keine Tabellen-/Spaltenregistrierung, keine Kit-/Registry-Core-Sonderlogik.

## F – Prüfungen und Abschlusskriterien

Komponentenvertrag/Mounted-Refs, Manifest-Fingerprint und universelle M83-Slots
prüfen. Neue Tests: Empfänger speichern/reopen/freie Eingabe/Adressübernahme,
manuelle Datumsangaben ohne Rücklaufdatei, Version/Projektgrenzen, CAS-Konflikte,
Migration und Transfer alter/neuer Archive ohne Datenverlust; direkte Mail ohne
Ampeländerung, Schließen/Verwerfen, Nein ohne Aufgabe, Ja mit Datumsaufgabe,
Fehler und Lizenzgrenzen. Praktischer Windows-/Outlooklauf bleibt ein eigener
Abnahmenachweis und wird nicht durch Mocktests ersetzt.
