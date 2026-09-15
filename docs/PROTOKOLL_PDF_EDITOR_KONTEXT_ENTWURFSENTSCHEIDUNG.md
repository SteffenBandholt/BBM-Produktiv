# UI-/PDF-Entwurfsentscheidung: Protokoll-PDF-Kontext beim Editorstart

Stand: 2026-09-14

## Auftrag und Grenze

Die vorhandenen Protokoll-Einstiege sollen dem gemeinsamen PDF-Adapterresolver
den bereits registrierten Dokumenttyp `protocol` zusammen mit Projekt- und
Besprechungsidentität übergeben. Der gemeinsame Launcher darf einen
dokumentartspezifischen Kontext nur mit dessen tatsächlich übergebener
`documentTypeId` vorbereiten. Er darf andere Dokumenttypen nicht auf
`protocol` umdeuten und einen bereits vorbereiteten Kontext nicht durch einen
unvollständigen Kontext ersetzen.

Das Paket ändert weder die PDF-Ausgabe noch ihre Registry, Layoutprofile,
Editorziele, Parent-Struktur oder Operationen.

## A. Art der Ausgabe

- Art: keine editorrelevante neue oder geänderte Ausgabe
- UI: keine strukturelle oder sichtbare Änderung
- PDF: keine Layout-, Inhalts-, Satz- oder Rendereränderung
- Technische Wirkung: Auswahl des bereits bestehenden PDF-Dokumentkontexts vor
  dem nativen Editorstart

## B. Editorfähigkeit

- Die Kontextübergabe ist nicht editorfähig. `documentTypeId`, `projectId`,
  `meetingId` und weitere Dokumentidentitäten sind technische Fach-/IPC-Daten,
  keine Layoutziele.
- Die bestehende Protokoll-PDF bleibt über ihre vorhandene Registry
  editorfähig. Die vorhandenen 37 Registryelemente werden nicht verändert.

## C. Editorfähige Elemente

Dieses Paket erzeugt, entfernt oder ändert kein editorfähiges Element. Daher
entstehen keine neuen oder geänderten Angaben für:

- `data-ui-inspector-id`
- `data-ui-editor-kind`
- `data-ui-editor-label`
- `data-ui-editor-parent`
- `data-ui-editor-editable`
- `data-ui-editor-ops`

Die bestehenden Protokoll-PDF-Ziele behalten ihre vorhandenen IDs, Typen,
Rollen, Parents, Reihenfolgen, Sichtbarkeit, Editierbarkeit, `allowedOps` und
`lockedOps` unverändert.

## D. Nicht editorfähige Elemente und verbotene Editor-Ziele

- PDF-Dokumenttyp und Dokumentidentitäten
- `preparePdfContext`, Adapterauswahl und Vorschauerzeugung
- Fachaktionen und fachliches Speichern, Anlegen oder Löschen
- Upload, Import, Export und Autosave
- fachliche IPC-, Datenbank- und sonstige Datenaktionen
- Seitenzuweisung, Paginierung, Datensatzteilung und Umbruchregeln
- PDF-Inhalte, Bauvorhabenadresse, Logo, Trennlinien und Kopfstruktur

Für die vorhandenen Ziele bleiben alle nicht bereits erlaubten Operationen
gesperrt. Insbesondere werden keine Fachwert-, Profil-, Registry- oder
Satzoperationen ergänzt.

## E. Parent- und Strukturregel

Die vorhandene Parent-Struktur aller 37 Protokoll-PDF-Elemente bleibt
unverändert. Der Dokumentkontext ist kein Registryelement und erhält keinen
Parent. Es wird kein Element und keine Parent-Beziehung geraten oder ergänzt.

## F. Prüfung und Guardrails

Geplant sind:

- eine gezielte Laufzeitregression für `TopsScreen.load`, die
  `documentTypeId: "protocol"`, `projectId` und `meetingId` nachweist;
- eine gezielte Laufzeitregression des gemeinsamen Launchers für den expliziten
  Protokollkontext, einen unverändert weitergereichten fremden Dokumenttyp und
  einen fehlenden Dokumenttyp ohne neue Kontextvorbereitung;
- der vorhandene UI-Editor-Vertragscheck für Registry-, Parent- und
  Operationsschutz;
- passende bestehende Protokoll-/Editorstart-Regressionen;
- ein realer Windows-BBM-Ablauf vom geöffneten Projekt und Protokoll über den
  nativen Editor bis zur erzeugten Protokoll-PDF-Vorschau;
- sichtbare Kontrolle, dass die Bauvorhabenadresse unter dem Logo weiterhin
  vorhanden ist.

`PDF-V2-SATZ-015` bleibt als gemeinsamer Vorschau-/Produktvertrag unverändert.
`PDF-V2-SATZ-016` bleibt als Inhaltsvertrag der Bauvorhabenadresse unverändert.
Es ist keine Golden- oder Satzvertragsänderung vorgesehen.

## Festgelegte technische Übergabe

- Der Protokoll-Screen übergibt ausdrücklich `documentTypeId: "protocol"`.
- Der gemeinsame Launcher bereitet nur einen Kontext mit nicht leerer
  `documentTypeId` vor.
- Launcher-interne Werte wie API-Objekt, Scope und Button werden nicht als
  PDF-Dokumentkontext übertragen.
- Die übrigen explizit gelieferten Dokumentkontextwerte bleiben erhalten, damit
  andere Dokumenttypen nicht als Protokoll behandelt werden.
- Fehlt `documentTypeId`, wird `preparePdfContext` nicht aufgerufen. Ein bereits
  vom jeweiligen Fachscreen vorbereiteter Kontext bleibt dadurch bestehen.

## Umsetzungs- und Prüfstand

- `TopsScreen.load` übergibt den Protokollkontext mit
  `documentTypeId: "protocol"`, `projectId` und `meetingId`.
- Der gemeinsame Launcher übernimmt eine explizite `documentTypeId` und die
  zugehörigen Dokumentidentitäten. Ohne Dokumenttyp führt er keine neue
  PDF-Kontextvorbereitung aus; ein fremder Dokumenttyp bleibt unverändert.
- Die gezielte M86.4-Laufzeitregression, die bestehenden M86.2.2-, M86.3- und
  M80-Editorprüfungen, die SiGeKo-Fremdtypregression, der
  UI-Editor-Vertrags-Selbsttest sowie der Adresskopf-Test sind grün.
- Die reale Windows-BBM-Bedienprüfung konnte in dieser Sitzung nicht ausgeführt
  werden: Die bereitgestellte Computersteuerung meldete keine nativen Apps und
  bot keinen nativen App-Zugriff. Damit bleiben der Klickweg bis zur nativen
  Protokoll-PDF-Vorschau und deren Sichtprüfung als manueller Nachweis offen.
- Es wurden keine Registry-, Profil-, Parent-, Operations-, Layout- oder
  PDF-Satzänderungen vorgenommen.

## Nutzerabnahme und Git-Abschluss (2026-09-15)

Der Nutzer hat bestätigt: Protokoll-PDF-Editor und Vorschau einschließlich
Bauvorhabenadresse funktionieren. Der im Reparaturlauf offene manuelle Nachweis
ist damit durch den Nutzer erbracht. Codex behauptet keine zusätzliche eigene
native Bedienprüfung. Die Reparatur ist für ihren separaten Commit sowie die
kontrollierte Integration und den Push nach `main` freigegeben. Die gezielten
Kontextregressionen und die Adressprüfung werden im integrierten Stand erneut
ausgeführt; bekannte M85-Abweichungen bleiben ein getrenntes Thema.
