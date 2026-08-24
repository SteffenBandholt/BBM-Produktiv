import { headerUtils } from "./headerUtils.js";

export function renderV2MiniHeader({ data, pageNo, totalPages, modeLabel, content = null } = {}) {
  const header = headerUtils.el("div", "v2Header v2HeaderMini");
  if (content) {
    const editor = content.editor || {};
    if (editor.id) {
      header.dataset.uiInspectorId = editor.id;
      header.dataset.uiEditorKind = editor.kind || "header";
      header.dataset.uiEditorLabel = editor.label || "MiniHeader";
      header.dataset.uiEditorParent = editor.parentId || "";
      header.dataset.uiEditorEditable = editor.editable ? "true" : "false";
      header.dataset.uiEditorOps = Array.from(editor.operations || []).join(",");
    }
    const topRow = headerUtils.el("div", "v2MiniTopRow");
    const left = headerUtils.el("div", "v2MiniProject", String(content.primaryText || ""));
    const rightPage = headerUtils.el("div", "v2MiniRight");
    rightPage.append(
      headerUtils.el("span", "v2MiniPageLabel", "Seite "),
      headerUtils.el("span", "v2MiniPageValue", pageNo + " / " + totalPages)
    );
    topRow.append(left, rightPage);
    const secondLine = headerUtils.el("div", "v2MiniProtocolTitle", String(content.secondaryText || ""));
    secondLine.setAttribute("data-v2", "miniText");
    if (String(content.draftNotice || "").trim()) {
      secondLine.appendChild(headerUtils.el("span", "v2MiniDraftNotice", String(content.draftNotice).trim()));
    }
    const divider = headerUtils.el("div", "v2Divider v2MiniDivider");
    divider.setAttribute("data-v2", "miniLine");
    header.append(topRow, secondLine);
    header.append(headerUtils.el("div", "v2MiniGapTextLine"), divider, headerUtils.el("div", "v2MiniGapLineBody"));
    return header;
  }
  const settings = data?.settings || {};
  const titleText = headerUtils.resolveHeaderTitle({
    data,
    settings,
    meeting: data?.meeting,
    modeLabel,
  });
  const brandingText = headerUtils.resolveBranding({ data });

  const topRow = headerUtils.el("div", "v2MiniTopRow");
  const line1Project = headerUtils.el(
    "div",
    "v2MiniProject",
    headerUtils.projectLabel(data?.project)
  );
  const rightPage = headerUtils.el("div", "v2MiniRight");
  rightPage.append(
    headerUtils.el("span", "v2MiniPageLabel", "Seite "),
    headerUtils.el("span", "v2MiniPageValue", pageNo + " / " + totalPages)
  );
  topRow.append(line1Project, rightPage);

  const line2Protocol = headerUtils.el(
    "div",
    "v2MiniProtocolTitle",
    titleText
  );
  line2Protocol.setAttribute("data-v2", "miniText");
  if (brandingText) {
    line2Protocol.appendChild(
      headerUtils.el("span", "v2MiniDraftNotice", "Vorabzug - nicht freigegeben")
    );
  }

  const line = headerUtils.el("div", "v2Divider v2MiniDivider");
  line.setAttribute("data-v2", "miniLine");

  header.append(topRow, line2Protocol);
  header.append(headerUtils.el("div", "v2MiniGapTextLine"), line, headerUtils.el("div", "v2MiniGapLineBody"));

  return header;
}
