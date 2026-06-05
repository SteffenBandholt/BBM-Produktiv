const DEFAULT_LOCATION_LABELS = ["Haus", "Geschoss", "Einheit", "Raum"];

function createEl(tag, { className = "", text = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

function createField({ label, value = "", options = [], type = "select", uiId, onChange }) {
  const wrap = createEl("label", { className: "bbm-restarbeiten-field", uiId });
  const labelEl = createEl("span", { text: label });
  const input = document.createElement(type === "input" || type === "date" ? "input" : "select");
  if (type === "date") input.type = "date";
  if (type === "select") {
    for (const option of options) {
      const opt = document.createElement("option");
      opt.value = String(option.value ?? "");
      opt.textContent = String(option.label ?? option.value ?? "");
      input.appendChild(opt);
    }
  }
  input.value = value ?? "";
  input.addEventListener("change", () => onChange?.(input.value));
  wrap.append(labelEl, input);
  return wrap;
}

export function resolveLocationLabels(settings = {}) {
  return [
    settings.level_1_label,
    settings.level_2_label,
    settings.level_3_label,
    settings.level_4_label,
  ].map((value, index) => String(value || "").trim() || DEFAULT_LOCATION_LABELS[index]);
}

export function buildRestarbeitenFilterbar({
  settings = {},
  filters = {},
  filterOptions = {},
  onFilterChange,
  onClose,
} = {}) {
  const labels = resolveLocationLabels(settings);
  const root = createEl("section", {
    className: "bbm-restarbeiten-filterbar",
    uiId: "restarbeiten.filterbar",
  });

  const locationGroup = createEl("div", {
    className: "bbm-restarbeiten-filter-group",
    uiId: "restarbeiten.filterbar.group.location",
  });
  locationGroup.appendChild(createEl("p", { className: "bbm-restarbeiten-filter-group__title", text: "Verortung" }));
  labels.forEach((label, index) => {
    const key = `level${index + 1}`;
    locationGroup.appendChild(
      createField({
        label,
        value: filters[key] || "",
        options: [{ value: "", label: "Alle" }, ...(filterOptions[key] || [])],
        uiId: `restarbeiten.filterbar.location.level${index + 1}`,
        onChange: (value) => onFilterChange?.({ [key]: value }),
      })
    );
  });

  const classGroup = createEl("div", {
    className: "bbm-restarbeiten-filter-group",
    uiId: "restarbeiten.filterbar.group.class",
  });
  classGroup.appendChild(createEl("p", { className: "bbm-restarbeiten-filter-group__title", text: "Klasse" }));
  const classToggle = createEl("div", { className: "bbm-restarbeiten-class-toggle" });
  [
    ["all", "Alle", "restarbeiten.filterbar.class.all"],
    ["rest", "Restarbeit", "restarbeiten.filterbar.class.rest"],
    ["mangel", "Mangel", "restarbeiten.filterbar.class.defect"],
  ].forEach(([value, label, uiId]) => {
    const btn = createEl("button", { text: label, uiId });
    btn.type = "button";
    btn.setAttribute("aria-pressed", String((filters.itemClass || "all") === value));
    btn.addEventListener("click", () => onFilterChange?.({ itemClass: value }));
    classToggle.appendChild(btn);
  });
  classGroup.appendChild(classToggle);

  const metaGroup = createEl("div", {
    className: "bbm-restarbeiten-filter-group",
    uiId: "restarbeiten.filterbar.group.meta",
  });
  metaGroup.appendChild(createEl("p", { className: "bbm-restarbeiten-filter-group__title", text: "Meta" }));
  metaGroup.append(
    createField({
      label: "Status",
      value: filters.status || "",
      options: [
        { value: "", label: "Alle" },
        { value: "offen", label: "Offen" },
        { value: "in arbeit", label: "In Arbeit" },
        { value: "erledigt", label: "Erledigt" },
        { value: "verzug", label: "Verzug" },
      ],
      uiId: "restarbeiten.filterbar.meta.status",
      onChange: (status) => onFilterChange?.({ status }),
    }),
    createField({
      label: "Fertig bis",
      value: filters.dueDate || "",
      type: "date",
      uiId: "restarbeiten.filterbar.meta.dueDate",
      onChange: (dueDate) => onFilterChange?.({ dueDate }),
    }),
    createField({
      label: "Verantwortlich",
      value: filters.responsible || "",
      options: [{ value: "", label: "Alle" }, ...(filterOptions.responsible || [])],
      uiId: "restarbeiten.filterbar.meta.responsible",
      onChange: (responsible) => onFilterChange?.({ responsible }),
    })
  );

  const closeBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Beenden / Schließen",
    uiId: "restarbeiten.filterbar.action.close",
  });
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => onClose?.());

  root.append(locationGroup, classGroup, metaGroup, closeBtn);
  return root;
}
