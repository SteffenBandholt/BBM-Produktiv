# M82.2 – Interner Development-Lizenzweg

## Zweck und Grenze

Die echte PDF-Abnahme verwendet eine ausdrücklich als Development-/Diagnostic-Build erzeugte BBM. Produktiv- und Release-Pakete verwenden weiterhin ausschließlich den regulären Lizenzpfad. Der interne Provider ersetzt keine Benutzerlizenz, schreibt keine `license.json` und verändert den normalen Electron-`userData`-Pfad nicht.

## Technische Trennung

`npm run pack:diagnostic` erzeugt zur Packzeit eine vollständige Buildidentität mit Kanal `DEV`, Flavor `development-diagnostic` und der festen Provider-ID `bbm-internal-development-license-v1`. Nur wenn alle drei Werte exakt übereinstimmen, darf der Loader den separat paketierten internen Provider laden. Im unverpackten Entwicklungsstart stammt dieselbe Identität aus der Repository-Konfiguration.

Der normale Release-Pack verwendet Kanal `STABLE` und Flavor `release`. Er entfernt die interne Provider-Ressource und nimmt keine Development-Buildidentität auf. Der Loader fällt geschlossen aus, wenn Identität, Provider oder Provider-ID fehlen beziehungsweise nicht zusammenpassen. Umgebungsvariablen werden für diese Entscheidung nicht ausgewertet; ihr manuelles Setzen kann einen Release-Build daher nicht freischalten.

Die Oberfläche kennzeichnet eine aktive interne Freigabe sichtbar und wörtlich mit „Entwicklungsversion – Testlizenz“.

## Sicherheits- und Abnahmenachweis

- Diagnostic-Build: Status gültig, sichtbare Development-Kennzeichnung, echte vierseitige BBM-PDF mit 28 Registryelementen erzeugt.
- Release-Build: abgelaufene Benutzerlizenz bleibt `LICENSE_EXPIRED` (gültig bis 4. Juni 2026).
- Release-Build mit manuell gesetzten Development-Umgebungsvariablen: keine Freischaltung; Quelle bleibt `user-license`, Build-Flavor bleibt `release`.
- Der SHA-256-Hash der bestehenden Benutzerlizenz war vor und nach der Prüfung identisch: `DEB8F744633FEF22AEE0A7FEF97F9F2AE66360EF6BDD4A1A8C0A73B94A00D6B4`.
- Der SHA-256-Hash von `docs/licensing.md` blieb `02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784`.
- Der SHA-256-Hash der Fach-Datenbank blieb `AAF880B685EA142275E5E935BDA520028A989D74B3F2597BD334EA4E6F4CBA64`.
