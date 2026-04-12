export class CreateMeetingModal {
  constructor({ view }) {
    this.view = view;
  }

  async handleCreateMeeting(params) {
    return this.openCreateMeetingModal(params);
  }

  openCreateMeetingModal({ dateISO, keyword = "", editParticipants = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.35)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";

      const panel = document.createElement("div");
      panel.style.background = "#fff";
      panel.style.borderRadius = "12px";
      panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
      panel.style.width = "min(520px, calc(100vw - 32px))";
      panel.style.padding = "16px";

      const h = document.createElement("div");
      h.textContent = "Neue Besprechung";
      h.style.fontWeight = "700";
      h.style.fontSize = "16px";
      h.style.marginBottom = "12px";
      panel.appendChild(h);

      const row = (labelText, inputEl) => {
        const r = document.createElement("div");
        r.style.display = "flex";
        r.style.flexDirection = "column";
        r.style.gap = "6px";
        r.style.marginBottom = "12px";

        const lab = document.createElement("div");
        lab.textContent = labelText;
        lab.style.fontSize = "12px";
        lab.style.color = "#444";
        r.appendChild(lab);

        r.appendChild(inputEl);
        return r;
      };

      const inpDate = document.createElement("input");
      inpDate.type = "date";
      if (typeof dateISO === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)) inpDate.value = dateISO;
      inpDate.style.padding = "10px 12px";
      inpDate.style.borderRadius = "10px";
      inpDate.style.border = "1px solid rgba(0,0,0,0.2)";
      panel.appendChild(row("Datum der Besprechung", inpDate));

      const inpKw = document.createElement("input");
      inpKw.type = "text";
      inpKw.placeholder = "Schlagwort (optional)";
      inpKw.value = String(keyword || "");
      inpKw.style.padding = "10px 12px";
      inpKw.style.borderRadius = "10px";
      inpKw.style.border = "1px solid rgba(0,0,0,0.2)";
      panel.appendChild(row("Schlagwort", inpKw));

      const chkWrap = document.createElement("label");
      chkWrap.style.display = "flex";
      chkWrap.style.alignItems = "center";
      chkWrap.style.gap = "10px";
      chkWrap.style.margin = "6px 0 14px 0";
      chkWrap.style.userSelect = "none";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!editParticipants;

      const chkText = document.createElement("div");
      chkText.textContent = "Teilnehmer nach dem Anlegen öffnen";
      chkText.style.fontSize = "13px";

      chkWrap.appendChild(chk);
      chkWrap.appendChild(chkText);
      panel.appendChild(chkWrap);

      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.justifyContent = "flex-end";
      btnRow.style.gap = "10px";

      const btnCancel = document.createElement("button");
      btnCancel.textContent = "Abbrechen";
      btnCancel.style.padding = "10px 14px";
      btnCancel.style.borderRadius = "10px";
      btnCancel.style.border = "1px solid rgba(0,0,0,0.2)";
      btnCancel.style.background = "#fff";

      const btnOk = document.createElement("button");
      btnOk.textContent = "Übernehmen";
      btnOk.style.padding = "10px 14px";
      btnOk.style.borderRadius = "10px";
      btnOk.style.border = "1px solid rgba(0,0,0,0.2)";
      btnOk.style.background = "#fff";
      btnOk.style.fontWeight = "700";

      btnRow.appendChild(btnCancel);
      btnRow.appendChild(btnOk);
      panel.appendChild(btnRow);

      const cleanup = (res) => {
        try {
          overlay.remove();
        } catch (_e) {
          // ignore
        }
        resolve(res);
      };

      btnCancel.onclick = () => cleanup(null);
      overlay.onclick = (ev) => {
        if (ev.target === overlay) cleanup(null);
      };

      const submit = () => {
        const vDate = String(inpDate.value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(vDate)) {
          alert("Bitte ein gültiges Datum auswählen.");
          return;
        }
        cleanup({
          dateISO: vDate,
          keyword: String(inpKw.value || "").trim(),
          editParticipants: !!chk.checked,
        });
      };

      btnOk.onclick = submit;
      inpDate.onkeydown = (ev) => {
        if (ev.key === "Enter") submit();
        if (ev.key === "Escape") cleanup(null);
      };
      inpKw.onkeydown = (ev) => {
        if (ev.key === "Enter") submit();
        if (ev.key === "Escape") cleanup(null);
      };

      document.addEventListener("keydown", function escHandler(ev) {
        if (ev.key === "Escape") {
          document.removeEventListener("keydown", escHandler);
          cleanup(null);
        }
      });

      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      setTimeout(() => {
        try {
          inpDate.focus();
        } catch (_e) {
          // ignore
        }
      }, 0);
    });
  }
}
