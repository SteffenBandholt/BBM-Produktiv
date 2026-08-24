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
  const useUserData = headerUtils.parseBool(settings["pdf.footerUseUserData"], false);
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
  const name1 = String(settings["pdf.footerName1"] || "").trim();
  const name2 = String(settings["pdf.footerName2"] || "").trim();
  const street = String(settings["pdf.footerStreet"] || "").trim();
  const zip = String(settings["pdf.footerZip"] || "").trim();
  const city = String(settings["pdf.footerCity"] || "").trim();
  const hasAnyUserField = !!(name1 || name2 || street || zip || city);
  const userBox = headerUtils.el("div", "v2UserBox");
  const userHint = "Keine Angaben - Projekt > Bearbeiten > Einstellungen";

  if (!useUserData && !hasAnyUserField) {
    userBox.appendChild(headerUtils.el("div", "v2UserPlaceholder", userHint));
  } else {
    if (name1) userBox.appendChild(headerUtils.el("div", "v2UserRow", name1));
    if (name2) userBox.appendChild(headerUtils.el("div", "v2UserRow", name2));
    if (street) userBox.appendChild(headerUtils.el("div", "v2UserRow", street));
    if (zip || city) {
      const zipCityRow = headerUtils.el("div", "v2UserRowZipCity");
      zipCityRow.appendChild(headerUtils.el("span", "v2UserZip", zip));
      zipCityRow.appendChild(headerUtils.el("span", "v2UserCity", city));
      userBox.appendChild(zipCityRow);
    }
    if (!userBox.childNodes.length) {
      userBox.appendChild(headerUtils.el("div", "v2UserPlaceholder", userHint));
    }
  }
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
