function buildPlaceholderCard(title) {
  const card = document.createElement("section");
  card.style.border = "1px solid var(--card-border)";
  card.style.borderRadius = "10px";
  card.style.padding = "12px";
  card.style.background = "var(--card-bg)";
  card.style.minHeight = "90px";

  const heading = document.createElement("h3");
  heading.textContent = title;
  heading.style.margin = "0 0 6px";
  heading.style.fontSize = "16px";

  const hint = document.createElement("p");
  hint.textContent = "Platzhalter";
  hint.style.margin = "0";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.75";

  card.append(heading, hint);
  return card;
}

export default class LicenseAdminScreen {
  render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "12px";

    const title = document.createElement("h2");
    title.textContent = "Lizenzverwaltung";
    title.style.margin = "0";

    const adminHint = document.createElement("p");
    adminHint.textContent = "Admin-/Mutter-App-Modul";
    adminHint.style.margin = "0";

    const rolloutHint = document.createElement("p");
    rolloutHint.textContent = "Umsetzung erfolgt schrittweise";
    rolloutHint.style.margin = "0";
    rolloutHint.style.opacity = "0.85";

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    grid.style.gap = "10px";

    grid.append(
      buildPlaceholderCard("Kunden"),
      buildPlaceholderCard("Lizenzen"),
      buildPlaceholderCard("Produktumfang"),
      buildPlaceholderCard("Historie")
    );

    root.append(title, adminHint, rolloutHint, grid);
    return root;
  }
}
