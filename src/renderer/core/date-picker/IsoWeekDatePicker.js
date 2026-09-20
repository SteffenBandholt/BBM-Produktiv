import { buildIsoMonthWeeks, formatIsoDate, isoWeekInfo, parseIsoDate } from "./isoWeek.mjs";

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function button(doc, text, label) {
  const element = doc.createElement("button");
  element.type = "button";
  element.textContent = text;
  element.setAttribute("aria-label", label || text);
  element.style.border = "1px solid #cbd5e1";
  element.style.borderRadius = "7px";
  element.style.background = "#fff";
  element.style.color = "#0f172a";
  element.style.cursor = "pointer";
  return element;
}

export function attachIsoWeekDatePicker(input, { documentRef, label = "Datum" } = {}) {
  const doc = documentRef || input?.ownerDocument || globalThis.document;
  if (!input || !doc) throw new Error("Datumsfeld fehlt.");
  const root = doc.createElement("span");
  root.className = "bbm-iso-week-date-picker";
  root.style.display = "inline-flex";
  root.style.alignItems = "center";
  root.style.gap = "4px";
  root.style.width = "100%";
  input.style.flex = "1 1 auto";
  input.style.minWidth = "0";

  const indicator = doc.createElement("span");
  indicator.className = "bbm-iso-week-value";
  indicator.setAttribute("aria-live", "polite");
  indicator.style.cssText = "flex:0 0 auto;margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;color:inherit;font-family:inherit;line-height:1.2;white-space:nowrap";
  root.append(input, indicator);
  input.setAttribute("aria-haspopup", "dialog");
  input.setAttribute("aria-expanded", "false");

  const popover = doc.createElement("div");
  popover.className = "bbm-iso-week-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", `${label}: Kalender mit ISO-Kalenderwochen`);
  Object.assign(popover.style, {
    display: "none", position: "fixed", zIndex: "2147483000", width: "320px", padding: "10px",
    border: "1px solid #cbd5e1", borderRadius: "10px", background: "#fff", color: "#0f172a",
    boxShadow: "0 14px 35px rgba(15,23,42,.22)", fontSize: "13px",
  });
  doc.body.append(popover);

  const selected = () => parseIsoDate(input.value);
  const today = new Date();
  let visible = selected() || new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  const updateIndicator = () => {
    const info = isoWeekInfo(input.value);
    indicator.textContent = info ? `KW ${info.week}` : "KW –";
  };

  const position = () => {
    const rect = root.getBoundingClientRect();
    const view = doc.defaultView || globalThis.window;
    const width = 320;
    const left = Math.max(8, Math.min(rect.left, Number(view?.innerWidth || 1024) - width - 8));
    const below = rect.bottom + 6;
    const estimatedHeight = 330;
    const top = below + estimatedHeight <= Number(view?.innerHeight || 768)
      ? below
      : Math.max(8, rect.top - estimatedHeight - 6);
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  };

  const close = () => {
    popover.style.display = "none";
    input.setAttribute("aria-expanded", "false");
  };

  const choose = (value) => {
    input.value = value;
    updateIndicator();
    const EventCtor = doc.defaultView?.Event || globalThis.Event;
    input.dispatchEvent(new EventCtor("input", { bubbles: true }));
    input.dispatchEvent(new EventCtor("change", { bubbles: true }));
    close();
    input.focus();
  };

  const render = () => {
    popover.innerHTML = "";
    const header = doc.createElement("div");
    Object.assign(header.style, { display: "grid", gridTemplateColumns: "34px 1fr 34px", alignItems: "center", gap: "6px", marginBottom: "8px" });
    const previous = button(doc, "‹", "Vorheriger Monat");
    const heading = doc.createElement("strong");
    heading.textContent = `${MONTHS[visible.getUTCMonth()]} ${visible.getUTCFullYear()}`;
    heading.style.textAlign = "center";
    const next = button(doc, "›", "Nächster Monat");
    previous.onclick = () => { visible = new Date(Date.UTC(visible.getUTCFullYear(), visible.getUTCMonth() - 1, 1)); render(); };
    next.onclick = () => { visible = new Date(Date.UTC(visible.getUTCFullYear(), visible.getUTCMonth() + 1, 1)); render(); };
    header.append(previous, heading, next);

    const grid = doc.createElement("div");
    Object.assign(grid.style, { display: "grid", gridTemplateColumns: "38px repeat(7, 1fr)", gap: "3px", alignItems: "center" });
    for (const headingText of ["KW", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]) {
      const cell = doc.createElement("span");
      cell.textContent = headingText;
      Object.assign(cell.style, { textAlign: "center", fontWeight: "700", padding: "3px 0", color: headingText === "KW" ? "#1d4ed8" : "#475569" });
      grid.append(cell);
    }
    const selectedValue = input.value;
    for (const weekRow of buildIsoMonthWeeks(visible.getUTCFullYear(), visible.getUTCMonth())) {
      const week = doc.createElement("span");
      week.textContent = String(weekRow.week);
      week.title = `ISO-Kalenderwoche ${weekRow.week}/${weekRow.year}`;
      Object.assign(week.style, { textAlign: "center", fontWeight: "800", color: "#1d4ed8" });
      grid.append(week);
      for (const day of weekRow.days) {
        const dayButton = button(doc, String(day.day), day.value);
        dayButton.dataset.date = day.value;
        Object.assign(dayButton.style, {
          padding: "5px 2px", borderColor: day.value === selectedValue ? "#1d4ed8" : "transparent",
          background: day.value === selectedValue ? "#dbeafe" : "transparent",
          color: day.inMonth ? "#0f172a" : "#94a3b8",
        });
        dayButton.onclick = () => choose(day.value);
        dayButton.onkeydown = (event) => {
          const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
          if (!delta) return;
          event.preventDefault();
          const date = parseIsoDate(day.value);
          date.setUTCDate(date.getUTCDate() + delta);
          const target = formatIsoDate(date);
          if (date.getUTCMonth() !== visible.getUTCMonth()) {
            visible = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
            render();
          }
          popover.querySelector(`[data-date="${target}"]`)?.focus();
        };
        grid.append(dayButton);
      }
    }
    popover.append(header, grid);
  };

  const open = () => {
    if (input.disabled || input.readOnly) return;
    visible = selected() || visible;
    render();
    popover.style.display = "block";
    input.setAttribute("aria-expanded", "true");
    position();
    (popover.querySelector(`[data-date="${input.value}"]`) || popover.querySelector("[data-date]"))?.focus();
  };
  const onDocumentPointer = (event) => {
    if (!root.contains(event.target) && !popover.contains(event.target)) close();
  };
  const onInput = () => updateIndicator();
  const onInputPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (input.disabled || input.readOnly) return;
    event.preventDefault();
    input.focus({ preventScroll: true });
    if (popover.style.display === "none") open();
  };
  const onInputClick = (event) => {
    if (input.disabled || input.readOnly) return;
    event.preventDefault();
    if (popover.style.display === "none") open();
  };
  const onInputKey = (event) => {
    if (!["Enter", " ", "ArrowDown"].includes(event.key) || input.disabled || input.readOnly) return;
    event.preventDefault();
    open();
  };
  const onPopoverKey = (event) => {
    if (event.key === "Escape") { event.preventDefault(); close(); input.focus(); }
  };
  input.addEventListener("pointerdown", onInputPointerDown);
  input.addEventListener("click", onInputClick);
  input.addEventListener("keydown", onInputKey);
  input.addEventListener("input", onInput);
  input.addEventListener("change", onInput);
  popover.addEventListener("keydown", onPopoverKey);
  doc.addEventListener("pointerdown", onDocumentPointer, true);
  updateIndicator();

  return {
    root,
    indicator,
    popover,
    refresh: updateIndicator,
    destroy() {
      close();
      input.removeEventListener("pointerdown", onInputPointerDown);
      input.removeEventListener("click", onInputClick);
      input.removeEventListener("keydown", onInputKey);
      input.removeEventListener("input", onInput);
      input.removeEventListener("change", onInput);
      popover.removeEventListener("keydown", onPopoverKey);
      doc.removeEventListener("pointerdown", onDocumentPointer, true);
      popover.remove();
    },
  };
}
