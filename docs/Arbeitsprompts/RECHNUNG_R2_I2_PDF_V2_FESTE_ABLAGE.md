# Codex-Auftrag – R2-I2 Rechnung PDF V2 + feste Ablage

Branch: `rechnung-entwicklung`

## Ziel

Die bestehende produktive BBM-PDF-V2-Infrastruktur wird um einen eigenen Rechnung-PDF-Dokumenttyp erweitert. Eine erfolgreich gebuchte Rechnung erzeugt aus ihrem finalen Rechnungsstand ein festes, lokal gespeichertes PDF, das dauerhaft über eine persistente Dateireferenz mit der Rechnung verknüpft und später wieder geöffnet werden kann.

Keine zweite PDF-Engine und kein rechnungsspezifischer Parallelweg.

## Vor Beginn vollständig lesen

- `docs/RECHNUNG_2_0_R2_I2_PDF_BESTANDSINVENTAR.md`
- `docs/PDF_SATZVERTRAG_V2.md`
- `docs/RECHNUNG_2_0_M0_M3_BESTANDSPRUEFUNG.md`
- `docs/RECHNUNG_2_0_POSITIONEN_EDITBOX_ERGAENZUNGEN.md`
- `docs/RECHNUNG_2_0_FIRMEN_KUNDEN_ENTSCHEIDUNG.md`
- aktuelle Rechnungsschichten in `src/main/db`, `src/main/domain/rechnung`, `src/main/ipc/rechnungIpc.js`
- aktuelle PDF-Kette in `src/main/ipc/printIpc.js`, `src/main/print/**`, `src/renderer/print/**`
- auf Branch `firmen-kunden-neu` die neuere generische PDF-Dokumenttyp-Architektur:
  - `src/main/ui-editor/pdfDocumentTypeRegistry.cjs`
  - `src/main/ui-editor/pdfAdapterRegistry.cjs`
  - `src/main/ui-editor/declarativePdfAdapter.cjs`
  - zugehörige Anbindung in `electronUiEditorSession.js`, `uiEditorIpc.js` und Print-Pfad

Vor Änderungen den tatsächlichen Bestandsstand prüfen. Vorhandene brauchbare Logik wiederverwenden.

## Fachliche Pflichtanforderungen

1. Rechnung erhält einen eigenen produktiven PDF-Dokumenttyp auf derselben V2-Basis wie die übrigen BBM-PDFs.
2. Kein `if Rechnung => komplett eigener Renderer/Editor/Store`-Parallelweg.
3. Neuere generische PDF-Dokumenttyp-/Adapter-Struktur aus `firmen-kunden-neu` kontrolliert und konfliktarm übernehmen, soweit für Mehrdokumentfähigkeit erforderlich.
4. Protokoll und Restarbeiten müssen funktional und visuell unverändert bleiben.
5. Finale Rechnungsdaten ausschließlich aus dem gebuchten Rechnungsstand verwenden.
6. Kunde ausschließlich aus `customer_snapshot` der gebuchten Rechnung.
7. Aussteller ausschließlich aus `issuer_snapshot` der gebuchten Rechnung.
8. Keine Live-Auflösung finaler PDF-Inhalte aus später veränderten Stammdaten.
9. Rechnungsnummer, Rechnungsdatum, Leistungszeitraum, Bauvorhaben/Leistungsbezug, Einleitung, Zahlungsziel/Fälligkeit und vorhandene Fußdaten korrekt darstellen.
10. Positionen im Bau-LV-Stil, nicht als klassische Warenwirtschaftstabelle.
11. Leistungsposition: Positionsnummer + Kurztext, Langtext, Menge/Einheit, EP, GP.
12. EP und GP rechts ausrichten.
13. NEP: Menge, Einheit, EP sichtbar; statt GP `NEP`; nicht in Summen einrechnen.
14. Titel-, Text- und Hinweispositionen nicht summieren.
15. Typ `Text`: internes Typmerkmal bleibt, aber das Wort `Text` wird im PDF nicht vor den Inhalt gedruckt.
16. Typ `Hinweis`: Kennzeichnung `Hinweis` bleibt sichtbar.
17. Summenblock aus der bestehenden zentralen Rechnungsberechnung ableiten: Netto, Steuer nach tatsächlich vorhandenen Steuersätzen, Brutto.
18. Keine fest verdrahtete 19-%-Summenlogik im Renderer.
19. Mehrseitige Rechnung muss die bestehende V2-Paginierungsfamilie und einen Folgeseitenkopf verwenden.
20. Rechnung-PDF muss editorseitig einen eigenen stabilen PDF-Scope/Descriptor besitzen. Fachwerte bleiben gesperrt; nur ausdrücklich registrierte Layoutwerte sind editorfähig.

## Feste lokale Ablage

21. Finale PDF-Datei lokal im Dateisystem speichern.
22. Projektbezug ist optional; projektlose freie Rechnungen müssen ebenfalls eindeutig gespeichert werden können.
23. Dateiname muss stabil aus der offiziellen Rechnungsnummer ableitbar und Windows-sicher sein.
24. Eine finale Rechnung darf nicht bei jedem Öffnen still neu gerendert werden. Öffnen verwendet die gespeicherte Datei.
25. Gespeicherte Rechnung muss aus der Rechnungsübersicht bzw. dem vorhandenen Rechnungsscreen über einen minimalen vorhandenen/ergänzten Aufruf wieder geöffnet werden können. Kein UI-Redesign.

## Zentrale Dateireferenz

26. Eine additive, migrationssichere zentrale Dateistruktur in SQLite einführen bzw. vorhandene passende Struktur verwenden.
27. Struktur ausdrücklich nicht nur auf Rechnung fest verdrahten, damit Angebot/Auftrag später dieselbe Dateibasis nutzen können.
28. Mindestens speichern:
   - Datei-ID
   - kaufmännischer Dokument-/Rechnungsbezug
   - Dokumenttyp
   - Dateityp `PDF`
   - Dateiname
   - lokaler Pfad
   - Version
   - Dateigröße
   - SHA-256-Checksumme
   - Erzeugungszeitpunkt
29. Eine gebuchte Rechnung hat für den finalen Step-1-Stand genau eine aktive finale PDF-Referenz. Die Struktur darf Versionierung später zulassen, ohne jetzt unnötige Versionsfachlogik einzuführen.
30. Fremdschlüssel-/Löschregeln dürfen gebuchte Rechnungen oder finale Dateien nicht versehentlich kaskadierend vernichten.

## Finalisierung und Fehlerkonsistenz

31. Rechnungsnummer wird weiterhin nur über den bestehenden Buchungsvorgang vergeben.
32. DRAFT erzeugt keine finale Rechnungsdatei.
33. Das feste PDF gehört fachlich zur erfolgreichen Finalisierung/Buchung.
34. Implementiere eine robuste Konsistenzstrategie zwischen DB-Buchung und Dateierzeugung. Es darf nach einem Fehler nicht still der Eindruck entstehen, die Rechnung sei vollständig finalisiert, obwohl die finale PDF-Datei fehlt oder nicht referenziert ist.
35. Keine neue Rechnungsnummer aufgrund eines bloßen PDF-Wiederholungsversuchs erzeugen.
36. Bei Fehlern müssen Wiederholung/Recovery deterministisch möglich sein, ohne Doppelnummer oder mehrere unklare Finaldateien zu produzieren.
37. Dateireferenz erst dann als final gültig speichern, wenn Datei vorhanden, lesbar und Checksumme ermittelt ist.

## PDF-Editor / Architektur

38. Prüfe die neuere Architektur von `firmen-kunden-neu` und übernimm nur die erforderlichen, kompatiblen generischen Bausteine; nicht blind den ganzen Branch mergen.
39. Bestehenden Protokoll-PDF-Adapter nicht in einen Rechnungssonderadapter umbiegen.
40. Rechnung benötigt eigene Dokumenttyp-ID, eigenen PDF-Scope und eigenes Layoutprofil innerhalb derselben generischen Architektur.
41. Layout-/Registrierungsänderungen müssen additive Kompatibilität und vorhandene Profile beachten.
42. Kein zweiter Profilstore.
43. Keine Fachaktion über den UI-/PDF-Editor freischalten.

## UI-Abgrenzung

44. `RechnungScreen` und dessen bestehender 81-Ziele-UI-Vertrag bleiben führend.
45. Kein Redesign.
46. `RechnungenDesignScreen` nicht produktiv machen.
47. `_legacyFormEditor()` nicht weiterentwickeln.
48. Falls für gebuchte Rechnungen eine Aktion `PDF öffnen` erforderlich ist, nur minimal in den bestehenden Screen integrieren und editorseitig gemäß bestehendem UI-Vertrag sauber registrieren, falls sie als dauerhaft sichtbares Layoutziel aufgenommen wird.
49. Die bestehende UI-Proberechnung bleibt von der finalen PDF-Ausgabe fachlich getrennt.

## Nicht Teil dieses Auftrags

- ZUGFeRD-XML oder PDF/A-3-Einbettung
- Storno/Gutschrift
- Zielkalkulation
- Leistungspositionenkatalog
- Angebot/Auftrag
- Auftrags-LV / Nachträge
- GAEB
- Mahnwesen / DATEV
- vollständige gemeinsame kaufmännische Dokumentmigration
- allgemeines UI-Redesign

## Tests / Abnahme

Mindestens automatisiert absichern:

1. Rechnung ist als eigener PDF-Dokumenttyp/Printpfad registriert.
2. Protokoll-PDF-Bestandstests bleiben unverändert grün bzw. weisen keine neue Regression auf.
3. Restarbeiten-PDF-Bestandstests keine neue funktionale Regression.
4. Gebuchte Rechnung rendert aus Snapshots und nicht aus veränderten Live-Stammdaten.
5. Textposition druckt kein Präfix `Text`.
6. Hinweisposition behält `Hinweis`.
7. NEP wird korrekt dargestellt und nicht summiert.
8. Netto/Steuer/Brutto bei mindestens zwei unterschiedlichen Steuersätzen korrekt.
9. Mehrseitiger LV-Fall mit Folgeseitenkopf.
10. DRAFT erhält keine finale PDF-Referenz.
11. BOOKED erhält genau eine gültige finale PDF-Dateireferenz.
12. Referenz enthält Dateigröße und SHA-256.
13. Datei existiert tatsächlich am referenzierten Pfad.
14. Projektlose und projektbezogene Rechnung funktionieren.
15. Gespeichertes PDF wird beim Öffnen verwendet; kein stilles Regenerieren.
16. Fehler bei Dateierzeugung/Finalisierung hinterlässt keinen inkonsistenten scheinbar fertigen Zustand.
17. Wiederholungsfall produziert keine zweite Rechnungsnummer.
18. UI-Editor-/PDF-Registry-Verträge bleiben gültig.
19. gezieltes ESLint für geänderte Dateien.
20. `git diff --check`.
21. relevante Testgruppen plus vollständiges `npm test` ausführen. Bereits vorhandene Baselinefehler nicht ungeprüft reparieren; falls globale Tests rot bleiben, Baselinevergleich wie bei R2-I1 durchführen und echte Regressionen von Bestandsfehlern trennen.

## Abschlussbericht

Am Ende ausgeben:

- kurze Ergebniszusammenfassung
- Architekturentscheidung/übernommene generische PDF-Bausteine
- genaue geänderte Dateien
- neue/angepasste DB-Struktur und Migrationen
- tatsächlicher Speicherpfad-/Dateinamensmechanismus
- Testresultate
- Baselinevergleich bei roten Gesamttests
- offene Risiken
- `git status`

Kein Commit und kein Push. Nach Umsetzung zur Abnahme stoppen.
