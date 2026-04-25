export function createLicenseEditorSection({
  mkRow,
  applyPopupCardStyle,
  applyPopupButtonStyle,
  formatLicenseBinding,
  formatLicenseGenerationError,
}) {
  const licenseGenBox = document.createElement("div");
  applyPopupCardStyle(licenseGenBox);
  licenseGenBox.style.padding = "8px 10px";
  licenseGenBox.style.display = "grid";
  licenseGenBox.style.gap = "8px";

  const licenseGenTitle = document.createElement("div");
  licenseGenTitle.textContent = "Lizenz verlaengern / bearbeiten";
  licenseGenTitle.style.fontWeight = "700";

  const licenseGenHint = document.createElement("div");
  licenseGenHint.textContent =
    "Nur fuer den internen Entwicklungsbereich. Bestehende .bbmlic laden, anpassen und ueber C:\\license-tool neu erzeugen.";
  licenseGenHint.style.fontSize = "12px";
  licenseGenHint.style.opacity = "0.8";

  const loadedLicenseInfo = document.createElement("div");
  loadedLicenseInfo.style.fontSize = "12px";
  loadedLicenseInfo.style.lineHeight = "1.35";
  loadedLicenseInfo.style.padding = "8px";
  loadedLicenseInfo.style.borderRadius = "8px";
  loadedLicenseInfo.style.background = "#f8fafc";
  loadedLicenseInfo.style.border = "1px solid rgba(0,0,0,0.08)";
  loadedLicenseInfo.textContent = "Keine bestehende Lizenz geladen.";

  const licenseTemplateWrap = document.createElement("div");
  licenseTemplateWrap.style.display = "flex";
  licenseTemplateWrap.style.flexWrap = "wrap";
  licenseTemplateWrap.style.gap = "8px";

  const licenseTemplateInfo = document.createElement("div");
  licenseTemplateInfo.style.fontSize = "12px";
  licenseTemplateInfo.style.lineHeight = "1.35";
  licenseTemplateInfo.style.padding = "8px";
  licenseTemplateInfo.style.borderRadius = "8px";
  licenseTemplateInfo.style.background = "#fff7ed";
  licenseTemplateInfo.style.border = "1px solid rgba(245, 158, 11, 0.35)";
  licenseTemplateInfo.textContent = "Keine Vorlage aktiv. Du kannst eine Schnellvorlage laden oder alle Felder frei setzen.";

  const inpLicenseProduct = document.createElement("input");
  inpLicenseProduct.type = "text";
  inpLicenseProduct.value = "bbm-protokoll";

  const inpLicenseCustomer = document.createElement("input");
  inpLicenseCustomer.type = "text";
  inpLicenseCustomer.placeholder = "Musterbau GmbH";

  const inpLicenseId = document.createElement("input");
  inpLicenseId.type = "text";
  inpLicenseId.placeholder = "BBM-TEST-0001";
  inpLicenseId.readOnly = false;
  inpLicenseId.disabled = false;

  const btnLicenseIdSuggest = document.createElement("button");
  btnLicenseIdSuggest.type = "button";
  btnLicenseIdSuggest.textContent = "Neue Nummer vorschlagen";
  applyPopupButtonStyle(btnLicenseIdSuggest);

  const makeLicenseIdSuggestion = () => {
    const year = new Date().getFullYear();
    return `BBM-${year}-0001`;
  };

  const ensureLicenseIdSuggestion = () => {
    const current = String(inpLicenseId.value || "").trim();
    if (current) return;
    inpLicenseId.value = makeLicenseIdSuggestion();
  };

  const inpLicenseEdition = document.createElement("input");
  inpLicenseEdition.type = "text";
  inpLicenseEdition.value = "test";

  const inpLicenseBinding = document.createElement("select");
  [
    ["Soft-Lizenz", "none"],
    ["Vollversion (rechnergebunden)", "machine"],
  ].forEach(([labelText, value]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelText;
    inpLicenseBinding.appendChild(option);
  });

  const bindingHint = document.createElement("div");
  bindingHint.style.fontSize = "12px";
  bindingHint.style.lineHeight = "1.35";
  bindingHint.style.color = "#475569";
  bindingHint.textContent = "Soft-Lizenz: keine Rechnerbindung. Vollversion: bindet die Lizenz an die aktuelle lokale Machine-ID.";

  const valueLicenseIssuedAt = document.createElement("div");
  valueLicenseIssuedAt.textContent = "-";
  valueLicenseIssuedAt.style.fontSize = "12px";
  valueLicenseIssuedAt.style.wordBreak = "break-word";

  const valueLicenseRequestMachineId = document.createElement("div");
  valueLicenseRequestMachineId.textContent = "-";
  valueLicenseRequestMachineId.style.fontSize = "12px";
  valueLicenseRequestMachineId.style.wordBreak = "break-word";

  const inpLicenseValidFrom = document.createElement("input");
  inpLicenseValidFrom.type = "date";
  inpLicenseValidFrom.value = new Date().toISOString().slice(0, 10);

  const inpLicenseDuration = document.createElement("input");
  inpLicenseDuration.type = "number";
  inpLicenseDuration.min = "1";
  inpLicenseDuration.step = "1";
  inpLicenseDuration.value = "365";

  const inpLicenseValidUntil = document.createElement("input");
  inpLicenseValidUntil.type = "date";

  const inpLicenseMaxDevices = document.createElement("input");
  inpLicenseMaxDevices.type = "number";
  inpLicenseMaxDevices.min = "1";
  inpLicenseMaxDevices.step = "1";
  inpLicenseMaxDevices.value = "1";

  const inpLicenseNotes = document.createElement("textarea");
  inpLicenseNotes.rows = 3;
  inpLicenseNotes.placeholder = "Interne Notizen zur Lizenz";
  inpLicenseNotes.style.width = "100%";
  inpLicenseNotes.style.boxSizing = "border-box";

  const productScopeWrap = document.createElement("div");
  productScopeWrap.style.display = "grid";
  productScopeWrap.style.gap = "8px";

  const formatLicenseFeatureLabel = (feature) => {
    const normalizedFeature = String(feature || "").trim();
    return normalizedFeature === "audio" ? "Dictate" : normalizedFeature;
  };

  const normalizeLicenseFeatureKey = (feature) => {
    const normalized = String(feature || "").trim().toLowerCase();
    if (normalized === "dictate") return "audio";
    return normalized;
  };

  const mkScopeGroup = (title, note = "") => {
    const box = document.createElement("div");
    box.style.border = "1px solid rgba(0,0,0,0.08)";
    box.style.borderRadius = "8px";
    box.style.padding = "8px 10px";
    box.style.background = "#ffffff";

    const titleEl = document.createElement("div");
    titleEl.textContent = title;
    titleEl.style.fontWeight = "600";
    titleEl.style.fontSize = "12px";
    titleEl.style.marginBottom = "6px";
    box.appendChild(titleEl);

    if (note) {
      const noteEl = document.createElement("div");
      noteEl.textContent = note;
      noteEl.style.fontSize = "12px";
      noteEl.style.color = "#4b5563";
      noteEl.style.marginBottom = "6px";
      box.appendChild(noteEl);
    }

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = "8px 12px";
    box.appendChild(row);

    return { box, row };
  };

  const mkFeatureInput = (feature, { checked = true, disabled = false, hint = "" } = {}) => {
    const label = document.createElement("label");
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.gap = "6px";
    label.style.fontSize = "12px";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = feature;
    checkbox.checked = !!checked;
    checkbox.disabled = !!disabled;
    label.append(checkbox, document.createTextNode(formatLicenseFeatureLabel(feature)));
    if (hint) {
      const hintEl = document.createElement("span");
      hintEl.textContent = hint;
      hintEl.style.color = "#6b7280";
      hintEl.style.fontSize = "11px";
      label.appendChild(hintEl);
    }
    return checkbox;
  };

  const standardScope = mkScopeGroup("Standardumfang", "Immer enthalten, nicht abwaehlbar.");
  const optionalScope = mkScopeGroup("Zusatzfunktionen");
  const moduleScope = mkScopeGroup("Module", "Vorbereitet, noch nicht aktiv angebunden.");

  const standardFeatureInputs = ["app", "pdf", "export"].map((feature) => {
    const checkbox = mkFeatureInput(feature, { checked: true, disabled: true });
    standardScope.row.appendChild(checkbox.parentElement);
    return checkbox;
  });

  const optionalFeatureInputs = ["mail", "audio"].map((feature) => {
    const checkbox = mkFeatureInput(feature, { checked: feature !== "audio" });
    optionalScope.row.appendChild(checkbox.parentElement);
    return checkbox;
  });

  const moduleFeatureInputs = ["Protokoll", "Dummy"].map((moduleLabel) => {
    const checkbox = mkFeatureInput(moduleLabel, { checked: false, disabled: true, hint: "(vorbereitet)" });
    checkbox.value = moduleLabel.toLowerCase();
    moduleScope.row.appendChild(checkbox.parentElement);
    return checkbox;
  });

  productScopeWrap.append(standardScope.box, optionalScope.box, moduleScope.box);

  let activeLicenseTemplate = "";

  const setFeatureSelection = (selectedFeatures) => {
    const selected = new Set(
      (Array.isArray(selectedFeatures) ? selectedFeatures : []).map((v) => normalizeLicenseFeatureKey(v))
    );
    standardFeatureInputs.forEach((inp) => {
      inp.checked = true;
    });
    optionalFeatureInputs.forEach((inp) => {
      inp.checked = selected.has(inp.value);
    });
    moduleFeatureInputs.forEach((inp) => {
      inp.checked = false;
    });
  };

  const calcValidUntil = () => {
    const validFrom = String(inpLicenseValidFrom.value || "").trim();
    const days = Number(inpLicenseDuration.value);
    if (!validFrom || !Number.isFinite(days) || days < 1) return;
    const dt = new Date(`${validFrom}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return;
    dt.setUTCDate(dt.getUTCDate() + Math.floor(days));
    inpLicenseValidUntil.value = dt.toISOString().slice(0, 10);
  };
  calcValidUntil();
  inpLicenseValidFrom.addEventListener("change", calcValidUntil);
  inpLicenseDuration.addEventListener("input", calcValidUntil);

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const applyLicenseTemplate = (templateKey) => {
    const templates = {
      test30: {
        label: "30 Tage Test",
        edition: "test",
        binding: "none",
        durationDays: "30",
        validFrom: todayIso(),
        maxDevices: "2",
        features: ["app", "pdf", "export", "mail"],
      },
      standard365: {
        label: "1 Jahr Standard",
        edition: "standard",
        binding: "none",
        durationDays: "365",
        validFrom: todayIso(),
        maxDevices: "1",
        features: ["app", "pdf", "export"],
      },
      pro365: {
        label: "1 Jahr Pro",
        edition: "pro",
        binding: "machine",
        durationDays: "365",
        validFrom: todayIso(),
        maxDevices: "1",
        features: ["app", "pdf", "export", "mail"],
      },
    };
    const tpl = templates[String(templateKey || "").trim()];
    if (!tpl) return;
    activeLicenseTemplate = tpl.label;
    inpLicenseProduct.value = "bbm-protokoll";
    inpLicenseEdition.value = tpl.edition;
    inpLicenseBinding.value = tpl.binding;
    inpLicenseDuration.value = tpl.durationDays;
    inpLicenseValidFrom.value = tpl.validFrom;
    inpLicenseMaxDevices.value = tpl.maxDevices;
    setFeatureSelection(tpl.features);
    calcValidUntil();
    licenseTemplateInfo.textContent = `Vorlage aktiv: ${tpl.label}. Felder sind vorbelegt und koennen danach weiterhin manuell angepasst werden.`;
    updateBindingHint();
    syncLoadedLicenseInfo();
    ensureLicenseIdSuggestion();
  };

  [
    ["30 Tage Test", "test30"],
    ["1 Jahr Standard", "standard365"],
    ["1 Jahr Pro", "pro365"],
  ].forEach(([labelText, key]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = labelText;
    applyPopupButtonStyle(btn);
    btn.onclick = () => applyLicenseTemplate(key);
    licenseTemplateWrap.appendChild(btn);
  });

  const licenseGenStatus = document.createElement("div");
  licenseGenStatus.style.fontSize = "12px";
  licenseGenStatus.style.minHeight = "16px";
  licenseGenStatus.style.color = "#4b5563";

  const licenseGenResult = document.createElement("div");
  licenseGenResult.style.fontSize = "12px";
  licenseGenResult.style.lineHeight = "1.35";
  licenseGenResult.style.whiteSpace = "pre-wrap";
  licenseGenResult.style.wordBreak = "break-word";
  licenseGenResult.style.padding = "8px";
  licenseGenResult.style.borderRadius = "8px";
  licenseGenResult.style.background = "#f8fafc";
  licenseGenResult.style.border = "1px solid rgba(0,0,0,0.08)";
  licenseGenResult.textContent = "Noch keine Lizenz erzeugt.";

  const licenseGenActions = document.createElement("div");
  licenseGenActions.style.display = "flex";
  licenseGenActions.style.flexWrap = "wrap";
  licenseGenActions.style.gap = "8px";

  const btnLicenseGenerate = document.createElement("button");
  btnLicenseGenerate.type = "button";
  btnLicenseGenerate.textContent = "Lizenz verlaengern";
  applyPopupButtonStyle(btnLicenseGenerate, { variant: "primary" });

  const btnLicenseLoad = document.createElement("button");
  btnLicenseLoad.type = "button";
  btnLicenseLoad.textContent = "Lizenz laden";
  applyPopupButtonStyle(btnLicenseLoad);

  const btnLicenseLoadRequest = document.createElement("button");
  btnLicenseLoadRequest.type = "button";
  btnLicenseLoadRequest.textContent = "Lizenzanforderung laden";
  applyPopupButtonStyle(btnLicenseLoadRequest);

  const btnLicenseOpenOutput = document.createElement("button");
  btnLicenseOpenOutput.type = "button";
  btnLicenseOpenOutput.textContent = "Ausgabeordner oeffnen";
  btnLicenseOpenOutput.disabled = true;
  applyPopupButtonStyle(btnLicenseOpenOutput);

  licenseGenActions.append(btnLicenseLoad, btnLicenseLoadRequest, btnLicenseGenerate, btnLicenseOpenOutput);

  let loadedLicenseMeta = null;
  let loadedRequestMeta = null;

  const updateBindingHint = () => {
    const isMachineBound = String(inpLicenseBinding.value || "").trim() === "machine";
    bindingHint.textContent = isMachineBound
      ? "Vollversion: Die Lizenz wird an die aktuelle lokale Machine-ID gebunden. Fuer fremde Zielrechner ist dafuer eine separate Machine-ID-Anforderung noetig."
      : "Soft-Lizenz: keine Rechnerbindung. Die Lizenz kann ohne Machine-ID verwendet und weitergegeben werden.";
  };
  updateBindingHint();

  const setLicenseGenBusy = (busy) => {
    const isBusy = !!busy;
    [
      inpLicenseProduct,
      inpLicenseCustomer,
      inpLicenseId,
      inpLicenseEdition,
      inpLicenseBinding,
      inpLicenseValidFrom,
      inpLicenseDuration,
      inpLicenseValidUntil,
      inpLicenseMaxDevices,
      inpLicenseNotes,
      ...standardFeatureInputs,
      ...optionalFeatureInputs,
      ...moduleFeatureInputs,
    ].forEach((el) => {
      if (el) el.disabled = isBusy;
    });
    standardFeatureInputs.forEach((el) => {
      if (el) el.disabled = true;
    });
    moduleFeatureInputs.forEach((el) => {
      if (el) el.disabled = true;
    });
    btnLicenseLoad.disabled = isBusy;
    btnLicenseLoadRequest.disabled = isBusy;
    btnLicenseGenerate.disabled = isBusy;
    btnLicenseOpenOutput.disabled = isBusy || !btnLicenseOpenOutput.dataset.outputPath;
  };

  const syncLoadedLicenseInfo = () => {
    if (!loadedLicenseMeta) {
      loadedLicenseInfo.textContent = activeLicenseTemplate
        ? `Keine bestehende Lizenz geladen.\nAktive Vorlage: ${activeLicenseTemplate}${loadedRequestMeta?.machineId ? `\nGeladene Lizenzanforderung: ${loadedRequestMeta.machineId}` : ""}`
        : "Keine bestehende Lizenz geladen.";
      btnLicenseGenerate.textContent = "Lizenz erzeugen";
      return;
    }
    const currentLicenseId = String(inpLicenseId.value || "").trim();
    const originalLicenseId = String(loadedLicenseMeta.licenseId || "").trim();
    const sameId = currentLicenseId && originalLicenseId && currentLicenseId === originalLicenseId;
    loadedLicenseInfo.textContent = [
      `Geladen: ${loadedLicenseMeta.filePath || "-"}`,
      `Vorherige Lizenznummer: ${originalLicenseId || "-"}`,
      `IssuedAt: ${loadedLicenseMeta.issuedAt || "-"}`,
      `Modus: ${formatLicenseBinding(inpLicenseBinding.value)}`,
      `Lizenzanforderung: ${loadedRequestMeta?.machineId || "-"}`,
      sameId
        ? "Verlaengerung: Bestehende Lizenznummer wird weiterverwendet."
        : "Verlaengerung: Neue Lizenznummer eingetragen.",
    ].join("\n");
    btnLicenseGenerate.textContent = sameId ? "Lizenz verlaengern" : "Lizenz unter neuer Nummer erzeugen";
  };

  const applyLoadedLicense = (res) => {
    loadedLicenseMeta = {
      filePath: String(res?.filePath || "").trim(),
      licenseId: String(res?.licenseId || "").trim(),
      issuedAt: String(res?.issuedAt || "").trim(),
    };
    inpLicenseProduct.value = String(res?.product || "bbm-protokoll").trim() || "bbm-protokoll";
    inpLicenseCustomer.value = String(res?.customerName || "").trim();
    inpLicenseId.value = String(res?.licenseId || "").trim();
    inpLicenseEdition.value = String(res?.edition || "").trim() || "test";
    inpLicenseBinding.value = String(res?.binding || "none").trim() || "none";
    valueLicenseIssuedAt.textContent = String(res?.issuedAt || "").trim() || "-";
    inpLicenseValidFrom.value = String(res?.validFrom || "").trim();
    inpLicenseValidUntil.value = String(res?.validUntil || "").trim();
    inpLicenseMaxDevices.value = String(res?.maxDevices || 1).trim() || "1";
    inpLicenseNotes.value = String(res?.notes || "").trim();
    const loadedFeatures = Array.isArray(res?.features) ? res.features.map((v) => String(v || "").trim()) : [];
    setFeatureSelection(loadedFeatures);
    activeLicenseTemplate = "";
    licenseTemplateInfo.textContent = "Bestehende Lizenz geladen. Vorlagen koennen weiterhin genutzt werden, um Felder neu vorzubelegen.";
    updateBindingHint();
    syncLoadedLicenseInfo();
  };

  const applyLoadedRequest = (res) => {
    loadedRequestMeta = {
      filePath: String(res?.filePath || "").trim(),
      machineId: String(res?.machineId || "").trim(),
    };
    inpLicenseProduct.value = String(res?.product || "bbm-protokoll").trim() || "bbm-protokoll";
    inpLicenseBinding.value = "machine";
    valueLicenseRequestMachineId.textContent = loadedRequestMeta.machineId || "-";
    if (!String(inpLicenseCustomer.value || "").trim() && String(res?.customerHint || "").trim()) {
      inpLicenseCustomer.value = String(res?.customerHint || "").trim();
    }
    activeLicenseTemplate = "";
    licenseTemplateInfo.textContent = `Lizenzanforderung geladen: ${loadedRequestMeta.filePath || "-"}`;
    updateBindingHint();
    syncLoadedLicenseInfo();
  };

  const collectLicenseFormData = () => ({
    product: String(inpLicenseProduct.value || "").trim() || "bbm-protokoll",
    customerName: String(inpLicenseCustomer.value || "").trim(),
    licenseId: String(inpLicenseId.value || "").trim(),
    edition: String(inpLicenseEdition.value || "").trim() || "test",
    binding: String(inpLicenseBinding.value || "").trim() || "none",
    machineId:
      String(inpLicenseBinding.value || "").trim() === "machine"
        ? String(loadedRequestMeta?.machineId || "").trim()
        : "",
    validFrom: String(inpLicenseValidFrom.value || "").trim(),
    validUntil: String(inpLicenseValidUntil.value || "").trim(),
    durationDays: String(inpLicenseDuration.value || "").trim(),
    maxDevices: String(inpLicenseMaxDevices.value || "").trim(),
    features: [
      ...standardFeatureInputs.map((inp) => inp.value),
      ...optionalFeatureInputs.filter((inp) => !!inp.checked).map((inp) => inp.value),
    ],
    notes: String(inpLicenseNotes.value || "").trim(),
  });

  inpLicenseId.addEventListener("input", syncLoadedLicenseInfo);
  inpLicenseBinding.addEventListener("change", () => {
    updateBindingHint();
    syncLoadedLicenseInfo();
  });

  btnLicenseLoad.onclick = async () => {
    const api = window.bbmDb || {};
    if (typeof api.licenseLoadForEdit !== "function") {
      licenseGenStatus.textContent = "Lizenz-Lade-IPC ist nicht verfuegbar.";
      licenseGenStatus.style.color = "#b91c1c";
      return;
    }
    setLicenseGenBusy(true);
    licenseGenStatus.textContent = "Bestehende Lizenz wird geladen ...";
    licenseGenStatus.style.color = "#4b5563";
    try {
      const res = await api.licenseLoadForEdit({});
      if (res?.canceled) {
        licenseGenStatus.textContent = "Lizenz laden abgebrochen.";
        licenseGenStatus.style.color = "#4b5563";
        return;
      }
      if (!res?.ok) {
        licenseGenStatus.textContent = formatLicenseGenerationError(res?.error);
        licenseGenStatus.style.color = "#b91c1c";
        return;
      }
      applyLoadedLicense(res);
      licenseGenStatus.textContent = "Bestehende Lizenzdaten geladen.";
      licenseGenStatus.style.color = "#166534";
    } catch (err) {
      licenseGenStatus.textContent = formatLicenseGenerationError(err?.message || err);
      licenseGenStatus.style.color = "#b91c1c";
    } finally {
      setLicenseGenBusy(false);
    }
  };

  btnLicenseLoadRequest.onclick = async () => {
    const api = window.bbmDb || {};
    if (typeof api.licenseLoadRequestForGenerate !== "function") {
      licenseGenStatus.textContent = "Lizenzanforderungs-IPC ist nicht verfuegbar.";
      licenseGenStatus.style.color = "#b91c1c";
      return;
    }
    setLicenseGenBusy(true);
    licenseGenStatus.textContent = "Lizenzanforderung wird geladen ...";
    licenseGenStatus.style.color = "#4b5563";
    try {
      const res = await api.licenseLoadRequestForGenerate({});
      if (res?.canceled) {
        licenseGenStatus.textContent = "Lizenzanforderung laden abgebrochen.";
        licenseGenStatus.style.color = "#4b5563";
        return;
      }
      if (!res?.ok) {
        licenseGenStatus.textContent = formatLicenseGenerationError(res?.error);
        licenseGenStatus.style.color = "#b91c1c";
        return;
      }
      applyLoadedRequest(res);
      licenseGenStatus.textContent = "Lizenzanforderung geladen.";
      licenseGenStatus.style.color = "#166534";
    } catch (err) {
      licenseGenStatus.textContent = formatLicenseGenerationError(err?.message || err);
      licenseGenStatus.style.color = "#b91c1c";
    } finally {
      setLicenseGenBusy(false);
    }
  };

  btnLicenseGenerate.onclick = async () => {
    const api = window.bbmDb || {};
    if (typeof api.licenseGenerate !== "function") {
      licenseGenStatus.textContent = "Lizenz-Generator-IPC ist nicht verfuegbar.";
      licenseGenStatus.style.color = "#b91c1c";
      return;
    }

    const currentLicenseId = String(inpLicenseId.value || "").trim();
    if (!currentLicenseId) {
      licenseGenStatus.textContent = "Bitte eine Lizenznummer angeben.";
      licenseGenStatus.style.color = "#b91c1c";
      inpLicenseId.focus();
      return;
    }

    setLicenseGenBusy(true);
    licenseGenStatus.textContent = "Lizenz wird erzeugt ...";
    licenseGenStatus.style.color = "#4b5563";
    try {
      const originalLicenseId = String(loadedLicenseMeta?.licenseId || "").trim();
      const isRenewal = !!loadedLicenseMeta && currentLicenseId && originalLicenseId && currentLicenseId === originalLicenseId;
      const res = await api.licenseGenerate(collectLicenseFormData());
      if (!res?.ok) {
        licenseGenStatus.textContent = formatLicenseGenerationError(res?.error);
        licenseGenStatus.style.color = "#b91c1c";
        return;
      }
      btnLicenseOpenOutput.dataset.outputPath = String(res?.outputPath || "");
      btnLicenseOpenOutput.disabled = !btnLicenseOpenOutput.dataset.outputPath;
      licenseGenStatus.textContent = isRenewal ? "Lizenz erfolgreich verlaengert." : "Lizenzdatei erfolgreich erzeugt.";
      licenseGenStatus.style.color = "#166534";
      licenseGenResult.textContent = [
        `Datei: ${res?.outputPath || "-"}`,
        `Gueltig von: ${res?.validFrom || "-"}`,
        `Gueltig bis: ${res?.validUntil || "-"}`,
        `Modus: ${formatLicenseBinding(res?.binding)}`,
        `Kunde: ${res?.customerName || "-"}`,
        `Lizenznummer: ${res?.licenseId || "-"}`,
        `Machine-ID: ${res?.machineId || "-"}`,
        `Features: ${Array.isArray(res?.features) && res.features.length ? res.features.map(formatLicenseFeatureLabel).join(", ") : "-"}`,
      ].join("\n");
    } catch (err) {
      licenseGenStatus.textContent = formatLicenseGenerationError(err?.message || err);
      licenseGenStatus.style.color = "#b91c1c";
    } finally {
      setLicenseGenBusy(false);
    }
  };

  btnLicenseIdSuggest.onclick = () => {
    if (loadedLicenseMeta) return;
    inpLicenseId.value = makeLicenseIdSuggestion();
    syncLoadedLicenseInfo();
  };

  btnLicenseOpenOutput.onclick = async () => {
    const api = window.bbmDb || {};
    if (typeof api.licenseOpenOutputDir !== "function") return;
    const outputPath = String(btnLicenseOpenOutput.dataset.outputPath || "").trim();
    if (!outputPath) return;
    const res = await api.licenseOpenOutputDir({ outputPath });
    if (!res?.ok) {
      licenseGenStatus.textContent = res?.error || "Ausgabeordner konnte nicht geoeffnet werden.";
      licenseGenStatus.style.color = "#b91c1c";
    }
  };

  licenseGenBox.append(
    licenseGenTitle,
    licenseGenHint,
    mkRow("Schnellvorlagen", licenseTemplateWrap),
    licenseTemplateInfo,
    loadedLicenseInfo,
    mkRow("Produkt", inpLicenseProduct),
    mkRow("Kunde / Firma", inpLicenseCustomer),
    mkRow("Lizenznummer", inpLicenseId),
    mkRow("", btnLicenseIdSuggest),
    mkRow("Edition", inpLicenseEdition),
    mkRow("Lizenzmodus", inpLicenseBinding),
    bindingHint,
    mkRow("Machine-ID aus Lizenzanforderung", valueLicenseRequestMachineId),
    mkRow("IssuedAt (geladen)", valueLicenseIssuedAt),
    mkRow("Gueltig von", inpLicenseValidFrom),
    mkRow("Nutzungstage", inpLicenseDuration),
    mkRow("Gueltig bis", inpLicenseValidUntil),
    mkRow("Max. Geraete", inpLicenseMaxDevices),
    mkRow("Produktumfang", productScopeWrap),
    mkRow("Notizen", inpLicenseNotes),
    licenseGenActions,
    licenseGenStatus,
    licenseGenResult
  );

  ensureLicenseIdSuggestion();

  return licenseGenBox;
}
