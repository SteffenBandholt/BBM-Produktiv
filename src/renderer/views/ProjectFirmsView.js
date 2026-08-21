import ProjectFirmsBaseView from "./ProjectFirmsBaseView.js";

const PROJECT_USAGE = "project_participant";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function hasProjectUsage(firm) {
  const usages = Array.isArray(firm?.usages) ? firm.usages : [];
  return usages.map((value) => text(value)).includes(PROJECT_USAGE);
}

function personName(person) {
  return [text(person?.first_name), text(person?.last_name)].filter(Boolean).join(" ") || "(ohne Name)";
}

function personRole(person) {
  return text(person?.rolle) || text(person?.funktion) || "";
}

function style(el, values = {}) {
  Object.assign(el.style, values);
  return el;
}

export default class ProjectFirmsView extends ProjectFirmsBaseView {
  constructor(args = {}) {
    super(args);
    this.contactsByFirmId = new Map();
  }

  async _loadData() {
    await super._loadData();

    // In Projekten werden nur zentrale Firmen angeboten, die ausdrücklich
    // als Projektteilnehmer gekennzeichnet sind. Bereits zugeordnete Firmen
    // bleiben davon unberührt und weiterhin sichtbar.
    this.allGlobalFirms = (this.allGlobalFirms || []).filter((firm) => hasProjectUsage(firm));

    const api = window.bbmDb || {};
    this.contactsByFirmId = new Map();
    if (typeof api.personsListByFirm !== "function") return;

    await Promise.all(
      (this.assignedGlobalFirms || []).map(async (firm) => {
        const firmId = text(firm?.id);
        if (!firmId) return;
        try {
          const res = await api.personsListByFirm(firmId);
          this.contactsByFirmId.set(firmId, res?.ok && Array.isArray(res.list) ? res.list : []);
        } catch (_error) {
          this.contactsByFirmId.set(firmId, []);
        }
      })
    );
  }

  _renderLegacy(container) {
    // Der lokale Projektfirmen-Bestand ist nur Entwicklungs-/Spieldaten und
    // wird in der neuen zentralen Firmenwelt nicht mehr dargestellt.
    if (!container) return;
    container.innerHTML = "";
    container.style.display = "none";
  }

  _createContactsSection(firm) {
    const firmId = text(firm?.id);
    const contacts = this.contactsByFirmId.get(firmId) || [];

    const section = style(document.createElement("div"), {
      borderTop: "1px solid #edf0f4",
      paddingTop: "9px",
      marginTop: "3px",
      display: "grid",
      gap: "6px",
    });
    section.setAttribute("data-bbm-project-firm-contacts", "true");

    const heading = style(document.createElement("div"), {
      fontSize: "11px",
      fontWeight: "800",
      color: "#344054",
    });
    heading.textContent = "Ansprechpartner";
    section.append(heading);

    if (!contacts.length) {
      const empty = style(document.createElement("div"), {
        fontSize: "11px",
        color: "#98a2b3",
      });
      empty.textContent = "Keine Ansprechpartner im Firmenstamm hinterlegt";
      section.append(empty);
      return section;
    }

    const list = style(document.createElement("div"), {
      display: "grid",
      gap: "5px",
    });

    for (const person of contacts) {
      const row = style(document.createElement("div"), {
        border: "1px solid #edf0f4",
        borderRadius: "8px",
        background: "#fafbfc",
        padding: "7px 8px",
        display: "grid",
        gap: "2px",
      });

      const top = style(document.createElement("div"), {
        display: "flex",
        alignItems: "baseline",
        gap: "6px",
        flexWrap: "wrap",
      });

      const name = style(document.createElement("span"), {
        fontSize: "11.5px",
        fontWeight: "750",
        color: "#172033",
      });
      name.textContent = personName(person);
      top.append(name);

      const role = personRole(person);
      if (role) {
        const roleEl = style(document.createElement("span"), {
          fontSize: "10.5px",
          color: "#667085",
        });
        roleEl.textContent = role;
        top.append(roleEl);
      }

      const contactParts = [text(person?.email), text(person?.phone)].filter(Boolean);
      row.append(top);
      if (contactParts.length) {
        const contact = style(document.createElement("div"), {
          fontSize: "10.5px",
          color: "#667085",
          overflowWrap: "anywhere",
        });
        contact.textContent = contactParts.join(" · ");
        row.append(contact);
      }

      list.append(row);
    }

    section.append(list);
    return section;
  }

  _createFirmCard(firm) {
    const card = super._createFirmCard(firm);
    const contacts = this._createContactsSection(firm);

    // Der letzte Block der Basis-Karte enthält die Aktionen. Ansprechpartner
    // stehen davor, damit "Aus Projekt entfernen" weiterhin am Kartenende bleibt.
    const actionBlock = card.lastElementChild || null;
    if (actionBlock) card.insertBefore(contacts, actionBlock);
    else card.append(contacts);

    return card;
  }
}
