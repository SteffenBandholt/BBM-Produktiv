export const CORE_SHELL_LAYOUT_SIDEBAR_WIDTH = 190;
export const CORE_SHELL_LAYOUT_PADDING = 12;

export function prepareCoreShellBody() {
  document.body.style.margin = "0";
  document.body.style.height = "100vh";
  document.body.style.background = "var(--main-bg)";
  document.body.style.color = "var(--text-main)";
}

export function createCoreShellLayout({ headerEl } = {}) {
  const host = document.getElementById("content");
  if (!host) {
    throw new Error("Root-Container #content nicht gefunden");
  }
  if (!headerEl) {
    throw new Error("Header-Element fuer CoreShell fehlt");
  }

  host.innerHTML = "";
  host.style.height = "100vh";
  host.style.display = "flex";
  host.style.flexDirection = "column";
  host.style.alignItems = "stretch";
  host.style.boxSizing = "border-box";
  host.style.fontFamily = "Calibri, Arial, sans-serif";
  host.style.color = "var(--text-main)";
  host.style.background = "var(--main-bg)";

  const bodyRow = document.createElement("div");
  bodyRow.style.flex = "1";
  bodyRow.style.display = "flex";
  bodyRow.style.alignItems = "stretch";
  bodyRow.style.boxSizing = "border-box";
  bodyRow.style.overflow = "hidden";

  const sidebar = document.createElement("div");
  sidebar.setAttribute("data-bbm-sidebar", "true");
  sidebar.style.width = `${CORE_SHELL_LAYOUT_SIDEBAR_WIDTH}px`;
  sidebar.style.minWidth = `${CORE_SHELL_LAYOUT_SIDEBAR_WIDTH}px`;
  sidebar.style.maxWidth = `${CORE_SHELL_LAYOUT_SIDEBAR_WIDTH}px`;
  sidebar.style.flex = `0 0 ${CORE_SHELL_LAYOUT_SIDEBAR_WIDTH}px`;
  sidebar.style.borderRight = "1px solid #1e293b";
  sidebar.style.padding = `${CORE_SHELL_LAYOUT_PADDING}px`;
  sidebar.style.boxSizing = "border-box";
  sidebar.style.display = "flex";
  sidebar.style.flexDirection = "column";
  sidebar.style.overflowY = "auto";
  sidebar.style.overflowX = "visible";
  sidebar.style.background = "var(--sidebar-bg)";
  sidebar.style.color = "var(--sidebar-text)";

  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.padding = `${CORE_SHELL_LAYOUT_PADDING}px`;
  content.style.boxSizing = "border-box";
  content.style.overflow = "auto";
  content.style.background = "var(--main-bg)";
  content.style.color = "var(--text-main)";

  const topBox = document.createElement("div");
  topBox.style.width = "100%";
  topBox.style.boxSizing = "border-box";
  topBox.style.padding = "0";
  topBox.style.display = "flex";
  topBox.style.flexDirection = "column";
  topBox.style.gap = "8px";

  const bottomBox = document.createElement("div");
  bottomBox.style.width = "100%";
  bottomBox.style.boxSizing = "border-box";
  bottomBox.style.padding = "0";
  bottomBox.style.marginTop = "auto";
  bottomBox.style.display = "flex";
  bottomBox.style.flexDirection = "column";
  bottomBox.style.gap = "8px";

  bodyRow.append(sidebar, content);
  sidebar.append(topBox, bottomBox);
  host.append(headerEl, bodyRow);

  return {
    host,
    contentRoot: content,
    content,
    topBox,
    bottomBox,
    sidebarWidth: CORE_SHELL_LAYOUT_SIDEBAR_WIDTH,
    padding: CORE_SHELL_LAYOUT_PADDING,
  };
}
