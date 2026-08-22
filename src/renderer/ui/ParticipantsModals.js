import ParticipantsModalsBase from "./ParticipantsModalsBase.js";

function text(value) {
  return String(value == null ? "" : value).trim();
}

export default class ParticipantsModals extends ParticipantsModalsBase {
  _mkPersonRow(options = {}) {
    const row = super._mkPersonRow(options);
    const hintText = text(options?.leftHintText);
    if (!row || !hintText) return row;

    const hint = Array.from(row.querySelectorAll?.("span") || []).find(
      (el) => text(el?.textContent) === hintText
    );
    if (!hint) return row;

    hint.remove();

    const softHint = document.createElement("div");
    softHint.textContent = hintText;
    Object.assign(softHint.style, {
      marginTop: "4px",
      fontSize: "10px",
      lineHeight: "1.2",
      fontWeight: "400",
      color: "#98a2b3",
      whiteSpace: "normal",
    });

    const leftArea = row.firstElementChild || row;
    leftArea.appendChild(softHint);
    row.title = row.title?.replace(` | ${hintText}`, "").replace(hintText, "") || "";
    return row;
  }
}
