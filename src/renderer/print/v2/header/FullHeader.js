import { headerUtils } from "./headerUtils.js";

export function renderV2FullHeader({ data, pageNo, totalPages, modeLabel, content = null, draftNotice = "" } = {}) {
  const header = headerUtils.el("div", "v2Header v2HeaderFull");
  if (content) {
    header.classList.add("v2HeaderFullSlot");
    const textBlock = headerUtils.el("div", "v2FullTextBlock v2FullSlotContent");
    textBlock.appendChild(content);
    if (String(draftNotice || "").trim()) {
      header.classList.add("v2HeaderFullHasDraftNotice");
      header.appendChild(headerUtils.el("div", "v2DraftBadge v2FullDraftBadge", String(draftNotice).trim()));
    }
    const divider = headerUtils.el("div", "v2Divider v2FullDivider");
    divider.setAttribute("data-v2", "line2");
    header.append(textBlock, headerUtils.el("div", "v2FullGapProjectLine"), divider);
    return header;
  }
  const settings = data?.settings || {};
  const meeting = data?.meeting || {};
  const titleText = headerUtils.resolveHeaderTitle({ data, settings, meeting, modeLabel });
  const listStandLine = headerUtils.listStandLine({ data, meeting });
  const brandingText = headerUtils.resolveBranding({ data });

  const left = headerUtils.el("div", "v2HeaderLeft v2FullLeftWrap");
  left.appendChild(headerUtils.el("div", "v2Project", "Projekt:"));
  left.appendChild(headerUtils.el("div", "v2ProjectName", headerUtils.projectNameLine(data?.project)));
  left.appendChild(headerUtils.el("div", "v2ProtocolTitle", titleText));
  if (listStandLine) {
    const lines = String(listStandLine).split("\n");
    lines.forEach((ln) => left.appendChild(headerUtils.el("div", "v2ListStand", ln)));
  }

  const right = headerUtils.el("div", "v2HeaderRight");
  const mode = String(data?.mode || "").trim().toLowerCase();
  if (["protocol", "preview", "vorabzug", "restarbeiten"].includes(mode)) {
    const pageCounter = headerUtils.el("div", "v2FullPageCounter");
    pageCounter.append(
      headerUtils.el("span", "v2MiniPageLabel", "Seite "),
      headerUtils.el("span", "v2MiniPageValue", pageNo + " / " + totalPages)
    );
    right.appendChild(pageCounter);
  }
  const project = data?.project || null;
  const street = String(project?.street || "").trim();
  const zipCity = [project?.zip, project?.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
  const userBox = headerUtils.el("div", "v2UserBox");
  if (street) userBox.appendChild(headerUtils.el("div", "v2UserRow v2ProjectAddressStreet", street));
  if (zipCity) userBox.appendChild(headerUtils.el("div", "v2UserRow", zipCity));
  right.appendChild(userBox);

  const textBlock = headerUtils.el("div", "v2FullTextBlock");
  const row = headerUtils.el("div", "v2FullRow");
  row.append(left, right);
  textBlock.appendChild(row);

  const line2Divider = headerUtils.el("div", "v2Divider v2FullDivider");
  line2Divider.setAttribute("data-v2", "line2");

  if (brandingText) {
    header.appendChild(headerUtils.el("div", "v2DraftBadge v2FullDraftBadge", "Vorabzug - nicht freigegeben"));
  }
  header.append(textBlock, headerUtils.el("div", "v2FullGapProjectLine"), line2Divider);

  return header;
}
