# M27 Restarbeiten Ausgabe- und Abnahmegrenze

## Kurzfazit

M27 legt fachlich fest, was die erste einfache Ausgabe fuer `Restarbeiten` enthalten soll und was bewusst noch nicht Teil dieses Pakets ist.

M27 baut keine Ausgabe. Es gibt keine technische PDF-Erzeugung, keine Druckfunktion, keine Mail-Anbindung, keine Fotoausgabe, keine Diktat-/Audioaenderung, keine UI-Editor-kit-Aenderung, keine Protokollaenderung und keine Datenbankmigration.

Die einfache Ausgabe ist zunaechst eine projektbezogene Restarbeitenliste. Sie dient Kontrolle, Abstimmung und Abnahmevorbereitung, nicht einer finalen Detailakte.

## Einordnung

- Art der Ausgabe: fachliche Doku zur spaeteren Ausgabe, keine editorrelevante Ausgabeumsetzung.
- Editorfaehig: nein.
- Begruendung: M27 beschreibt die Ausgabegrenze nur fachlich. Es entstehen keine UI-Elemente, keine PDF-Struktur, keine Tabellenlayout-Registry, keine UI-Editor-Registry und keine Editor-Operationen.
- Technische Pruefung: Fuer M27 gibt es keinen UI-/PDF-Vertragscheck, weil keine technische UI- oder PDF-Struktur gebaut wird.

## Ziel der ersten einfachen Ausgabe

Die erste einfache Ausgabe soll die aktuell relevanten Restarbeiten eines Projekts nachvollziehbar als Liste darstellen.

Sie soll beantworten:
- Welche Restarbeiten sind im Projekt gefuehrt?
- Wo befinden sie sich?
- Wer ist verantwortlich?
- Bis wann sollen sie erledigt sein?
- In welchem Status sind sie?
- Wie ist die Fristlage?
- Welche Eintraege sind fachlich noch unvollstaendig?
- Welche Eintraege sind bereits erledigt?

Die Ausgabe darf fachlich einfach bleiben. Sie muss keine Detailseiten, keine Fotos, keine Notizen und keine automatische Mailverteilung enthalten.

## Grundumfang

Die einfache Ausgabe ist eine projektbezogene Restarbeitenliste.

Sie umfasst Restarbeiten aus dem aktuellen Projektkontext. Projektfremde Restarbeiten duerfen nicht enthalten sein.

Soft-geloeschte Restarbeiten gehoeren nicht in die einfache Standardausgabe.

Filterung und Sortierung werden in M27 nur fachlich beschrieben. M27 legt keinen technischen Filter-, Druck- oder PDF-Weg fest.

## Auszugebende Felder

Die einfache Liste enthaelt mindestens:

1. Nr.
2. Kurztext
3. Ort/Bereich
4. Verantwortlich
5. Fertig bis
6. Status
7. Ampel / Fristbewertung
8. Hinweis auf unvollstaendige Pflichtfelder

### Nr.

Die laufende Nummer identifiziert die Restarbeit innerhalb des Projekts.

Es werden keine neuen Nummern fuer die Ausgabe erzeugt. Die Ausgabe verwendet den vorhandenen fachlichen Nummernstand.

### Kurztext

Der Kurztext beschreibt die Restarbeit knapp.

Wenn ein vorhandener Alt-Datensatz keinen Kurztext hat, darf kein Platzhalter erzeugt werden. Der Eintrag bleibt ausgabefaehig, muss aber als unvollstaendig gekennzeichnet werden.

### Ort/Bereich

Ort/Bereich beschreibt die fachliche Verortung der Restarbeit.

Wenn mehrere Verortungsebenen vorhanden sind, darf die Ausgabe sie lesbar zusammenfassen. Fehlende Verortung darf nicht durch Fantasiewerte ersetzt werden.

### Verantwortlich

Verantwortlich zeigt die vorhandene Projektfirma, das Gewerk oder das freie Verantwortlichenlabel.

Wenn die Verantwortlichkeit fehlt, bleibt das Feld leer oder fachlich als fehlend erkennbar. Es darf kein Wert wie `unbekannt` erzeugt werden, wenn dieser nicht wirklich gespeichert ist.

### Fertig bis

Fertig bis zeigt das vorhandene Faelligkeitsdatum.

Wenn kein Datum vorhanden ist, bleibt der Eintrag ausgabefaehig, wird aber als unvollstaendig gekennzeichnet. Die Fristbewertung ist dann neutral oder als nicht bewertbar erkennbar.

### Status

Status zeigt einen der fuer den ersten Nutzstand vorgesehenen Statuswerte:
- `offen`
- `in_arbeit`
- `erledigt`

Unbekannte oder leere Statuswerte duerfen nicht still normalisiert werden. Falls ein solcher Altzustand technisch vorhanden ist, muss er als unvollstaendig oder pruefbeduerftig erkennbar bleiben.

### Ampel / Fristbewertung

Die Ampel folgt der M25/M26-Regelbasis:
- `erledigt` ist fristneutral.
- Ohne Fertig-bis ist die Fristbewertung neutral oder nicht bewertbar.
- Ueberfaellig und nicht erledigt ist rot.
- Heute oder innerhalb der naechsten 10 Tage und nicht erledigt ist orange.
- Mehr als 10 Tage in der Zukunft und nicht erledigt ist gruen.

Die Ausgabe darf die Bewertung als Farbe, Text oder beides darstellen. M27 legt keine technische Darstellung fest.

### Hinweis auf unvollstaendige Pflichtfelder

Unvollstaendige Datensaetze muessen in der Ausgabe erkennbar sein.

Als unvollstaendig gelten insbesondere fehlende Pflichtfelder aus M24/M25:
- Kurztext
- Ort/Bereich
- Status
- Verantwortlich
- Fertig bis

Der Hinweis soll knapp bleiben, aber fachlich klar machen, dass der Eintrag noch Nachpflege braucht.

## Behandlung unvollstaendiger Datensaetze

Unvollstaendige Restarbeiten bleiben ausgabefaehig.

Sie duerfen nicht automatisch aus der Ausgabe fallen, weil sonst Alt-Datensaetze und Nachpflegefaelle fachlich unsichtbar wuerden.

Fuer unvollstaendige Datensaetze gilt:
- fehlende Felder bleiben leer oder werden als fehlend markiert
- keine Fantasiewerte erzeugen
- keine technischen Platzhalter als Fachwerte ausgeben
- keine automatische Status-, Verantwortlichkeits- oder Datumsnormalisierung
- Hinweis auf unvollstaendige Pflichtfelder ausgeben

Die Ausgabe ist damit auch ein Kontrollinstrument fuer Nachpflege.

## Behandlung erledigter Restarbeiten

Erledigte Restarbeiten duerfen in der einfachen Ausgabe enthalten sein.

Wenn sie enthalten sind, muessen sie klar als erledigt erkennbar sein:
- Status `erledigt` sichtbar ausgeben
- keine rote oder orange Fristwarnung ausgeben
- Fristbewertung erledigt/neutral behandeln

Erledigte Restarbeiten duerfen fachlich filterbar oder separat sortierbar beschrieben werden. M27 baut diese Filterung nicht technisch.

Erledigte Restarbeiten duerfen nicht automatisch geloescht oder aus der fachlichen Nachvollziehbarkeit entfernt werden.

## Fachliche Sortierung und Filterung

M27 beschreibt nur die fachliche Zielrichtung.

Sinnvolle Standardsortierung fuer eine einfache Ausgabe:
1. nicht erledigte Restarbeiten vor erledigten Restarbeiten
2. kritische Fristen vor unkritischen Fristen
3. danach Fertig-bis-Datum aufsteigend
4. danach laufende Nummer aufsteigend

Sinnvolle Filteroptionen fuer spaetere technische Pakete:
- alle Restarbeiten
- nur offen/in Arbeit
- nur erledigt
- nur unvollstaendige Nachpflegefaelle
- nach Verantwortlichem
- nach Ort/Bereich

Diese Sortier- und Filterregeln sind keine technische Umsetzung in M27.

## Bewusst nicht Teil von M27

Nicht Teil von M27:
- technische PDF-Erzeugung
- Druckfunktion
- Mail-Anbindung
- Outlook- oder `mailto:`-Flow
- Fotoausgabe
- Detailanhaenge
- Notizhistorie in der Ausgabe
- Diktat-/Audioaenderung
- neue UI
- neue PDF- oder Druckstruktur
- UI-Editor-kit-Aenderung
- Tabellenlayout-Editor-Registrierung
- Protokollaenderung
- Datenbankmigration
- neue IPC-/Preload-/Repository-Wege
- neue Fachlogik, die ueber Dokumentation und Absicherung des bestehenden Stands hinausgeht

PDF, Druck, Mail, Fotos und Detailanhaenge bleiben spaetere Pakete.

## Abnahmegrenze

M27 ist fachlich erfuellt, wenn dokumentiert ist:
- dass die erste Ausgabe eine projektbezogene Restarbeitenliste ist
- welche Felder in diese Liste gehoeren
- dass unvollstaendige Datensaetze ausgabefaehig bleiben und gekennzeichnet werden
- dass erledigte Datensaetze enthalten sein duerfen, aber erkennbar erledigt sein muessen
- dass keine Fantasiewerte oder Platzhalter erzeugt werden
- dass Sortierung und Filterung nur fachlich beschrieben sind
- dass PDF, Druck, Mail, Fotos und Detailanhaenge spaeter kommen

Technische Ausgabeumsetzung ist erst ein Folgepaket und braucht dann eine eigene UI-/PDF-Entwurfsentscheidung sowie passende Tests.

## Naechster sinnvoller Schritt

Nach M27 kann ein spaeteres kleines Umsetzungspaket geschnitten werden, das genau einen Ausgabeweg vorbereitet.

Vor einem solchen Paket muss separat entschieden werden:
- ob zuerst eine interne einfache Listen-Vorschau, PDF, Druck oder Export gebaut wird
- ob die Ausgabe nur die aktuelle Filteransicht oder einen fest definierten Standardumfang nutzt
- welche technische Pruefung die Ausgabeabsicherung uebernimmt
- ob und wann eine Tabellenlayout-Editor-Aufnahme fachlich bestaetigt wird

Ohne diese Folgeentscheidung bleibt M27 eine fachliche Abnahmegrenze, kein technischer Ausgabeauftrag.
