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

function createClassToggle({ value = "all", options = [], onChange } = {}) {
  const classToggle = createEl("div", { className: "bbm-restarbeiten-class-toggle" });
  for (const option of options) {
    const btn = createEl("button", { text: option.label, uiId: option.uiId });
    btn.type = "button";
    btn.className = "bbm-restarbeiten-word-switch";
    btn.setAttribute("aria-pressed", String(value === option.value));
    btn.addEventListener("click", () => onChange?.(option.value));
    classToggle.appendChild(btn);
  }
  return classToggle;
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
  classGroup.appendChild(
    createClassToggle({
      value: filters.itemClass || "all",
      options: [
        { value: "all", label: "Alle", uiId: "restarbeiten.filterbar.class.all" },
        { value: "rest", label: "Rest", uiId: "restarbeiten.filterbar.class.rest" },
        { value: "mangel", label: "Mangel", uiId: "restarbeiten.filterbar.class.defect" },
      ],
      onChange: (itemClass) => onFilterChange?.({ itemClass }),
    })
  );

  const metaGroup = createEl("div", {
    className: "bbm-restarbeiten-filter-group",
    uiId: "restarbeiten.filterbar.group.meta",
  });
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
    text: "Schließen",
    uiId: "restarbeiten.filterbar.action.close",
  });
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => onClose?.());

  const actions = createEl("div", {
    className: "bbm-restarbeiten-filter-actions",
    uiId: "restarbeiten.filterbar.actions",
  });
  actions.appendChild(closeBtn);

  root.append(locationGroup, classGroup, metaGroup, actions);
  return root;
}
