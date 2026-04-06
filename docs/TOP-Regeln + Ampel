# TOP-Regeln BBM-App

## 1. Grundprinzip
- Ein TOP ist ein langlebiges fachliches Objekt innerhalb eines Projekts.
- Ein TOP kann über viele Protokolle hinweg bestehen bleiben.
- Je Projekt gibt es eine Folge von Protokollen: `#1`, `#2`, `#3`, ...
- Ein neues Protokoll baut auf dem vorherigen Stand auf.

## 2. Protokollkopf
- Protokollnummer wird vom System vergeben und ist nicht editierbar.
- Format: `#<Nummer>`
- Datum wird beim Anlegen mit heute vorgeschlagen.
- Datum kann vor Abschluss geändert werden.
- Nach Abschluss ist das Datum fix.
- Schlagwort ist optional und jederzeit änderbar.

## 3. Herkunft im aktuellen Protokoll
- Blau = im aktuellen offenen Protokoll neu angelegt.
- Schwarz = aus vorherigen Protokollen übernommen.
- Schriftfarbe zeigt Herkunft, nicht Status.

## 4. Hierarchie
- Level 1 = nur Titel
- Level 2 bis 4 = nur TOPs
- Maximale Tiefe = 4
- Titel unter Titeln sind nicht zulässig.
- TOPs auf Level 1 sind nicht zulässig.

## 5. Titel
- Ein Titel ist eine reine Überschrift / Kapitelstruktur.
- Beispiele: Erdarbeiten, Betonarbeiten, Architektur und Planung
- Ein Titel hat nur Kurztext.
- Kurztext = Beschreibung des Titels.
- Ein Titel hat:
  - keinen Verantwortlichen
  - kein Fertig bis
  - keine Ampel
  - keinen Langtext

## 6. Normale TOPs
- TOPs liegen auf Level 2 bis 4.
- Sie beschreiben die eigentlichen Inhalte unterhalb eines Titels.
- Sie haben mindestens einen Kurztext.
- Weitere Felder können je nach Regelwerk vorhanden sein.

## 7. Nummernlogik
- Titel auf Level 1 geben die führende Nummer der Familie vor.
- Anzeige hierarchisch, z. B.:
  - `1`
  - `1.1`
  - `1.1.1`
  - `1.1.1.1`
- Solange ein TOP in der veränderbaren Zone ist, kann sich seine Nummer noch ändern:
  - durch Verschieben
  - durch Lückenschluss
- Nach Schließen des Protokolls ist die dann gültige Nummer fix.

## 8. Anlagedatum je TOP
- Jeder TOP hat ein ursprüngliches Anlagedatum.
- Dieses wird unter der TOP-Nummer klein angezeigt.
- Das Anlagedatum ändert sich nie.

## 9. Anlegen und Schieben
- Anlegen und Schieben sind fachlich gleichzusetzen, wenn es um die Einordnung in bestehende Strukturen geht.
- Was beim Anlegen verboten ist, ist auch beim Schieben verboten.

## 10. Schieben
- Schieben nur in offenen Protokollen.
- Geschlossene Protokolle erlauben kein Schieben.
- Verschiebbar sind nur TOPs, die:
  - blau / neu sind
  - keine Kinder haben
  - nicht übernommen sind
- Verboten:
  - unter sich selbst
  - unter eigene Kinder
  - Verletzung von Level 4
  - Verschieben übernommener TOPs
- Level-1-Elemente bleiben Root.
- Bei Verschiebung wird Level angepasst und Nummer neu berechnet.

## 11. Schieben in schwarze Strukturen
- Unter schwarzen Titeln oder schwarzen TOPs dürfen neue blaue TOPs nur am Ende angehängt werden.
- Sie dürfen nicht zwischen bestehende schwarze Geschwister einsortiert werden.
- Sie dürfen nicht vor bestehende schwarze Geschwister gesetzt werden.
- Grund: Die bestehende Nummerierung schwarzer TOPs darf nicht beschädigt werden.

## 12. Löschen
- Löschen nur in offenen Protokollen.
- Löschbar sind nur blaue / neue TOPs.
- Übernommene TOPs sind nicht löschbar.
- Ein TOP mit Kindern ist nicht löschbar.
- Erst Kinder löschen, dann Parent.

## 13. Nummernlücke
- Eine Nummernlücke entsteht nur, wenn ein blauer TOP ohne Kinder gelöscht wird.
- Dann rückt der letzte blaue TOP derselben Geschwistergruppe in die Lücke.
- Das betrifft nur die blaue veränderbare Zone.
- Schwarze TOPs bleiben unberührt.

## 14. Status
Verfügbare Status:
- offen
- in arbeit
- blockiert
- verzug
- erledigt

## 15. Ampellogik
- Ampel ist ein Symbol neben Fertig bis bzw. beim Statusfeld.
- Ampel ist getrennt von der Schriftfarbe.
- Schriftfarbe:
  - blau = neu
  - schwarz = übernommen
- Status-Ausnahmen:
  - blockiert = blaue Ampel
  - verzug = rote Ampel
  - erledigt = grüne Ampel
- Für offen / in arbeit gilt Fertig-bis-Logik:
  - ohne Fertig bis = keine Ampel
  - Restzeit <= 0 Tage = rot
  - Restzeit 1–10 Tage = orange
  - Restzeit > 10 Tage = grün

## 16. Fertig bis
- Neue TOPs erhalten standardmäßig heute als Fertig-bis-Datum.
- Fertig bis ist in offenen Protokollen bearbeitbar.
- Bei Status erledigt wird Fertig bis auf heute gesetzt.

## 17. Verantwortlich / Ansprechpartner
- Verantwortlich ist fachlich die Firma.
- Wenn vorhanden, möglichst Kurzbezeichnung der Firma verwenden.
- Die Firma ist Vertragspartner und damit die verantwortliche Einheit.
- Ansprechpartner / Kontaktperson ist Zusatzinformation.
- Eine evtl. persönliche ToDo-/Haftungslogik über Ansprechpartner ist noch offen und derzeit nicht verbindlich.

## 18. Bearbeitbarkeit
### Geschlossenes Protokoll
- Ein geschlossenes Protokoll ist vollständig read only.
- Keine Erstellung
- Keine Bearbeitung
- Keine Löschung
- Keine Verschiebung

### Offenes Protokoll – neue blaue TOPs
Bearbeitbar:
- Titel/Kurztext
- Langtext
- Fertig bis
- Status
- Verantwortlich
- Ansprechpartner

### Offenes Protokoll – übernommene schwarze TOPs
Nicht bearbeitbar:
- Titel/Kurztext
- Nummer / Position
- Löschen
- Verschieben

Weiterhin bearbeitbar:
- Fertig bis
- Status
- Verantwortlich
- Ansprechpartner
- Langtext mit Markerregel

## 19. Markerregel Langtext
- Wenn der Langtext eines übernommenen / alten TOPs geändert wird, wird ein zusätzlicher Marker angehängt:
  - `(verändert <Datum>)`
- Bei jeder weiteren Änderung kommt ein weiterer zusätzlicher Marker hinzu.
- Bestehende Marker bleiben stehen.

## 20. Erledigte TOPs über Folgeprotokolle
- Wird ein TOP auf erledigt gesetzt:
  - Ampel = grün
  - Fertig bis = heute
- Im nächsten Protokoll:
  - Kurztext grau
  - Langtext grau
- Im darauf folgenden Protokoll:
  - wenn unverändert, wird der TOP ausgeblendet
- Wenn der Nutzer den Status wieder ändert, gilt diese Ausblendekette nicht unverändert weiter.

## 21. Nicht weiterführen
- Manuelles hidden / Top ausblenden ist nicht Teil des gewünschten Regelwerks.
- task / decision ist derzeit nicht Teil des verbindlichen Regelwerks.

## 22. Abschluss
- Beim Klick auf einen Button wie `Schluss jetzt!` wird das Protokoll geschlossen.
- Der abgeschlossene Protokollstand ist vollständig read only.
- Übernommene TOPs im nächsten offenen Protokoll bleiben nach den oben genannten Regeln teilweise bearbeitbar.

## 23. Prozess
- Fachlich gehört zum Abschluss:
  - PDF erzeugen
  - an Teilnehmer per Mail senden
- Technisch muss das hier noch nicht umgesetzt werden.

## 24. Noch offen
- Finale fachliche Rolle des Ansprechpartners als evtl. persönliche ToDo-/Haftungslogik
