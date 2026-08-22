import ProjectFirmsParticipantsView from "./ProjectFirmsParticipantsView.js";

const PROJECT = "project_participant";
const INVOICE = "invoice_customer";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function usageSet(firm) {
  if (Array.isArray(firm?.usages)) return new Set(firm.usages.map((value) => text(value)));
  const set = new Set();
  const project = firm?.uses?.projectParticipant ?? firm?.use_project_participant ?? firm?.project_participant;
  const customer = firm?.uses?.customer ?? firm?.use_customer ?? firm?.invoice_customer;
  if (project === true || Number(project) === 1) set.add(PROJECT);
  if (customer === true || Number(customer) === 1) set.add(INVOICE);
  return set;
}

function style(el, values = {}) {
  Object.assign(el.style, values);
  return el;
}

export default class ProjectFirmsUsageView extends ProjectFirmsParticipantsView {
  _renderDetails(container) {
    super._renderDetails(container);

    const entry = this.selectedEntry || null;
    const firm = entry?.firm || null;
    const kind = entry?.kind || null;
    if (!firm || !["project", "global"].includes(kind)) return;

    const card = container.querySelector("section");
    if (!card || card.querySelector("[data-bbm-firm-customer-use]")) return;

    const codes = usageSet(firm);
    const usageRow = style(document.createElement("div"), {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      padding: "8px 0",
      borderTop: "1px solid #edf0f4",
      borderBottom: "1px solid #edf0f4",
      fontSize: "11px",
      color: "#475467",
    });
    usageRow.setAttribute("data-bbm-firm-customer-use", "true");

    const label = style(document.createElement("label"), {
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      cursor: "pointer",
      fontWeight: "750",
    });
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = codes.has(INVOICE);
    label.append(checkbox, document.createTextNode("Rechnungskunde"));

    const hint = style(document.createElement("span"), {
      color: "#98a2b3",
      fontSize: "10px",
    });
    hint.textContent = codes.has(PROJECT) ? "Projektteilnehmer und Rechnungskunde sind kombinierbar" : "Als Rechnungskunde verwendbar";
    usageRow.append(label, hint);

    checkbox.addEventListener("change", async () => {
      const api = window.bbmDb || {};
      if (typeof api.firmDirectorySetUses !== "function") {
        alert("Firmen-Verwendung ist nicht verfügbar.");
        checkbox.checked = !checkbox.checked;
        return;
      }

      const wanted = checkbox.checked;
      checkbox.disabled = true;
      const current = usageSet(firm);
      if (wanted) current.add(INVOICE);
      else current.delete(INVOICE);

      const res = await api.firmDirectorySetUses({
        ref: {
          kind: kind === "global" ? "global_firm" : "project_firm",
          id: text(firm?.id),
          projectId: kind === "project" ? this.projectId : undefined,
        },
        uses: {
          projectParticipant: current.has(PROJECT) ? 1 : 0,
          customer: current.has(INVOICE) ? 1 : 0,
        },
      });

      if (!res?.ok) {
        alert(res?.error || "Firmen-Verwendung konnte nicht gespeichert werden.");
        checkbox.checked = !wanted;
        checkbox.disabled = false;
        return;
      }

      checkbox.disabled = false;
      await this.reload();
    });

    const actions = Array.from(card.children || []).find((el) => el?.querySelector?.("button"));
    if (actions) card.insertBefore(usageRow, actions);
    else card.append(usageRow);
  }
}
