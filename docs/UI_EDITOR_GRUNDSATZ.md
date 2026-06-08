# UI-Editor-Grundsatz

Der neue UI- und PDF-Editor fuer BBM basiert auf dem Repository `SteffenBandholt/UI-Editor-kit`.

Massgebliche Struktur:

```text
App -> Modul -> Scope -> Registry -> Layout-Profil -> Layout-State
```

Erster fachlicher Ziel-Scope:

```text
restarbeiten.ui.main
```

Grundregeln:

1. UI- und PDF-Elemente werden beim Bauen bewusst registriert.
2. Der Editor liest spaeter diese Registries.
3. Die Registry ist die fachneutrale Wahrheit