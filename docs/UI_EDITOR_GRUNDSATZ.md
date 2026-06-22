# UI-Editor-Grundsatz

## 1. Kanonischer Ansatz

Der neue UI-/PDF-Editor basiert ausschliesslich auf `SteffenBandholt/UI-Editor-kit`.

Die maßgebliche Architektur lautet:

`App -> Modul -> Scope -> Registry -> Layout-Profil -> Layout-State`

Der Editor liest bewusst registrierte UI- und PDF-Elemente.
Die Ziel-App wird editorfaehig vorbereitet, bleibt dabei aber fachlich unabhaengig.

M21-Klarstellung fuer BBM-Produktiv:
- BBM-Produktiv ist Beispiel-/Pilot-Zielapp fuer das generische UI-Editor-kit.
- `Restarbeiten` ist erreichbar, aber fachlich/funktional unfertig und nur Pilot-Scope.
- `Protokoll` ist noch nicht fertig bereinigt und fuer UI-Editor-Themen defensiv/read-only einzuordnen.
- Der UI-Editor bleibt generisch und enthaelt keine BBM-, Restarbeiten- oder Protokoll-Fachlogik.
- Die Ziel-App liefert die ElementRegistry; der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Keine Selbstuntersuchung der Ziel-App-Oberflaeche, keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.

## 2. Verbindliche Begriffe

- Modul: fachlicher Bereich innerhalb der App
- Scope: eindeutig benannter Editor-Zielbereich innerhalb eines Moduls
- Registry: klassifizierte Liste freigegebener UI-/PDF-Elemente
- Layout-Profil: benannte Layout-Variante fuer einen Scope
- Layout-State: aktueller gespeicherter Zustand eines Layout-Profils
- DOM-Anker `data-ui-editor-id`: markiertes UI-Element im Renderer-DOM
- PDF-Anker: markierte Stelle in der PDF-Ausgabe, die einem Registry-Eintrag zugeordnet ist
- HostAdapter: Bruecke zwischen Ziel-App und Editor fuer Registrierung, Pruefung und Rueckmeldung

## 3. Abgrenzung Legacy

Folgende Alt- oder Bestandsbereiche duerfen nicht als Grundlage fuer den neuen UI-/PDF-Editor verwendet werden:

- `src/renderer/editor.html`
- `src/renderer/editor.js`
- `src/main/ipc/editorIpc.js`
- alte Firmen-/Personen-Editor-Funktionen
- reine Demo-/Lab-Dateien, sofern sie nicht ausdruecklich freigegeben werden

Diese Bereiche koennen als Legacy weiter existieren, sind aber nicht kanonisch fuer den neuen Editor.

## 4. Regel fuer Codex

Bei neuen UI- oder PDF-Arbeiten gilt:

- Jedes layoutrelevante Element braucht eine stabile Registry-ID.
- UI-Elemente brauchen `data-ui-editor-id`.
- PDF-Elemente brauchen einen passenden PDF-Anker.
- Registry und DOM-/PDF-Anker muessen pruefbar zusammenpassen.
- Layoutaenderungen duerfen niemals in Fachdatentabellen gespeichert werden.
- Fachaktionen wie speichern, loeschen, senden oder hochladen sind keine Layoutoperationen.

## 5. Erster Ziel-Scope

- `moduleId`: `restarbeiten`
- `scopeId`: `restarbeiten.ui.main`
- `kind`: `ui`
- Zweck: erste echte Uebungs- und Ziel-UI fuer den neuen Editor

## 6. Nicht anfassen ohne ausdrueckliche Freigabe

- alte Editor-Dateien nicht loeschen
- alte Editor-Dateien nicht in den neuen Editor integrieren
- keine automatische Migration
- keine automatische UI-Erkennung
- keine automatische Aenderung bestehender Fachlogik

## 7. Kernaussage

Der neue UI-/PDF-Editor ist das UI-Editor-kit.
Legacy-Editor-Dateien bleiben Altbestand und sind nicht die Grundlage fuer neue UI-/PDF-Arbeiten.
