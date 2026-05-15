export function createDictationDevSection({
  applyPopupCardStyle,
  mkScaleGroup,
  applyScaleBtnBase,
  setScaleBtnActive,
  settingsApi,
}) {
  const AUDIO_WHISPER_QUALITY_KEY = "audio.whisper.quality";
  const DEFAULT_WHISPER_QUALITY = "balanced";
  const WHISPER_QUALITIES = ["fast", "balanced", "best", "large"];

  const dictationTab = document.createElement("div");
  dictationTab.style.display = "grid";
  dictationTab.style.gap = "10px";

  const dictationProductBox = document.createElement("div");
  applyPopupCardStyle(dictationProductBox);
  dictationProductBox.style.padding = "8px 10px";
  dictationProductBox.style.maxWidth = "720px";
  dictationProductBox.style.marginTop = "0";
  dictationProductBox.style.display = "grid";
  dictationProductBox.style.gap = "8px";

  const dictationProductTitle = document.createElement("div");
  dictationProductTitle.textContent = "Diktierprodukt";
  dictationProductTitle.style.fontWeight = "700";

  const dictationProductHint = document.createElement("div");
  dictationProductHint.style.fontSize = "12px";
  dictationProductHint.style.opacity = "0.8";
  dictationProductHint.textContent = "Austauschbare fachliche Einheit fuer Diktieren.";

  const currentEngine = document.createElement("div");
  currentEngine.style.fontSize = "12px";
  currentEngine.style.fontWeight = "600";
  currentEngine.textContent = "Aktuelle Engine: Whisper";

  const whisperBox = document.createElement("div");
  whisperBox.style.display = "grid";
  whisperBox.style.gap = "6px";
  whisperBox.style.padding = "6px 8px";
  whisperBox.style.border = "1px solid var(--card-border)";
  whisperBox.style.borderRadius = "8px";
  whisperBox.style.background = "var(--card-bg)";

  const whisperTitle = document.createElement("div");
  whisperTitle.textContent = "Whisper-Modelle";
  whisperTitle.style.fontWeight = "bold";
  whisperTitle.style.marginBottom = "2px";
  whisperTitle.style.fontSize = "13px";

  const whisperMsg = document.createElement("div");
  whisperMsg.style.fontSize = "11px";
  whisperMsg.style.opacity = "0.75";
  whisperMsg.style.marginTop = "2px";

  let whisperQuality = DEFAULT_WHISPER_QUALITY;
  let whisperModels = {
    fast: { available: true },
    balanced: { available: true },
    best: { available: true },
    large: { available: true },
  };

  const btnWhisperFast = document.createElement("button");
  btnWhisperFast.textContent = "Schnell";
  applyScaleBtnBase(btnWhisperFast);
  const btnWhisperBalanced = document.createElement("button");
  btnWhisperBalanced.textContent = "Ausgewogen";
  applyScaleBtnBase(btnWhisperBalanced);
  const btnWhisperBest = document.createElement("button");
  btnWhisperBest.textContent = "Beste Qualitaet";
  applyScaleBtnBase(btnWhisperBest);
  const btnWhisperLarge = document.createElement("button");
  btnWhisperLarge.textContent = "Large";
  applyScaleBtnBase(btnWhisperLarge);

  const setWhisperBtnEnabled = (btn, enabled) => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.55";
    btn.style.cursor = enabled ? "pointer" : "default";
    btn.title = enabled ? "" : "Modell nicht installiert";
  };

  const applyWhisperUi = () => {
    const fastAvailable = !!whisperModels.fast?.available;
    const balancedAvailable = !!whisperModels.balanced?.available;
    const bestAvailable = !!whisperModels.best?.available;
    const largeAvailable = !!whisperModels.large?.available;

    setScaleBtnActive(btnWhisperFast, whisperQuality === "fast" && fastAvailable);
    setScaleBtnActive(btnWhisperBalanced, whisperQuality === "balanced" && balancedAvailable);
    setScaleBtnActive(btnWhisperBest, whisperQuality === "best" && bestAvailable);
    setScaleBtnActive(btnWhisperLarge, whisperQuality === "large" && largeAvailable);
    setWhisperBtnEnabled(btnWhisperFast, fastAvailable);
    setWhisperBtnEnabled(btnWhisperBalanced, balancedAvailable);
    setWhisperBtnEnabled(btnWhisperBest, bestAvailable);
    setWhisperBtnEnabled(btnWhisperLarge, largeAvailable);
    const current = whisperModels[whisperQuality];
    if (current && current.available) {
      whisperMsg.textContent = "";
    } else {
      whisperMsg.textContent = (current && current.missingReason) || "Modell nicht installiert.";
    }
  };

  const loadWhisperQualitySettings = async () => {
    const api = settingsApi?.() || {};
    if (typeof api.appSettingsGetMany === "function") {
      const res = await api.appSettingsGetMany([AUDIO_WHISPER_QUALITY_KEY]);
      if (res?.ok) {
        const raw = String(res.data?.[AUDIO_WHISPER_QUALITY_KEY] || "").trim().toLowerCase();
        whisperQuality = WHISPER_QUALITIES.includes(raw) ? raw : DEFAULT_WHISPER_QUALITY;
      }
    }
    if (typeof api.audioWhisperModelsStatus === "function") {
      const res = await api.audioWhisperModelsStatus();
      if (res?.ok && res.models) whisperModels = res.models;
    }
    applyWhisperUi();
  };

  const saveWhisperQualitySettings = async () => {
    const api = settingsApi?.() || {};
    if (typeof api.appSettingsSetMany !== "function") {
      whisperMsg.textContent = "Settings-API fehlt (IPC noch nicht aktiv).";
      return false;
    }
    const res = await api.appSettingsSetMany({
      [AUDIO_WHISPER_QUALITY_KEY]: whisperQuality,
    });
    if (!res?.ok) {
      whisperMsg.textContent = res?.error || "Speichern fehlgeschlagen";
      return false;
    }
    whisperMsg.textContent = "Gespeichert";
    setTimeout(() => {
      if (whisperMsg.textContent === "Gespeichert") whisperMsg.textContent = "";
    }, 900);
    return true;
  };

  btnWhisperFast.onclick = async () => {
    if (!whisperModels.fast?.available) return;
    whisperQuality = "fast";
    applyWhisperUi();
    await saveWhisperQualitySettings();
  };
  btnWhisperBalanced.onclick = async () => {
    if (!whisperModels.balanced?.available) return;
    whisperQuality = "balanced";
    applyWhisperUi();
    await saveWhisperQualitySettings();
  };
  btnWhisperBest.onclick = async () => {
    if (!whisperModels.best?.available) return;
    whisperQuality = "best";
    applyWhisperUi();
    await saveWhisperQualitySettings();
  };
  btnWhisperLarge.onclick = async () => {
    if (!whisperModels.large?.available) return;
    whisperQuality = "large";
    applyWhisperUi();
    await saveWhisperQualitySettings();
  };

  const whisperRow = mkScaleGroup("Modell", [btnWhisperFast, btnWhisperBalanced, btnWhisperBest, btnWhisperLarge]);
  whisperBox.append(whisperTitle, whisperRow, whisperMsg);
  dictationProductBox.append(dictationProductTitle, dictationProductHint, currentEngine, whisperBox);

  const dictionaryBox = document.createElement("div");
  applyPopupCardStyle(dictionaryBox);
  dictionaryBox.style.padding = "8px 10px";
  dictionaryBox.style.maxWidth = "720px";
  dictionaryBox.style.marginTop = "0";
  dictionaryBox.style.display = "grid";
  dictionaryBox.style.gap = "8px";

  const dictionaryTitle = document.createElement("div");
  dictionaryTitle.textContent = "Wörterbuch V1";
  dictionaryTitle.style.fontWeight = "700";

  const dictionaryHint = document.createElement("div");
  dictionaryHint.style.fontSize = "12px";
  dictionaryHint.style.opacity = "0.8";
  dictionaryHint.textContent = "Global fuer die ganze App. Kategorie ist fest Bau.";

  const dictionaryToolbar = document.createElement("div");
  dictionaryToolbar.style.display = "flex";
  dictionaryToolbar.style.flexWrap = "wrap";
  dictionaryToolbar.style.alignItems = "center";
  dictionaryToolbar.style.gap = "8px";

  const dictionarySearch = document.createElement("input");
  dictionarySearch.type = "search";
  dictionarySearch.placeholder = "Suche im Wörterbuch";
  dictionarySearch.style.minWidth = "220px";
  dictionarySearch.style.flex = "1 1 220px";

  const dictionaryRefreshButton = document.createElement("button");
  dictionaryRefreshButton.type = "button";
  dictionaryRefreshButton.textContent = "Aktualisieren";
  applyScaleBtnBase(dictionaryRefreshButton);

  const dictionaryMessage = document.createElement("div");
  dictionaryMessage.style.fontSize = "12px";
  dictionaryMessage.style.opacity = "0.85";

  const dictionaryList = document.createElement("div");
  dictionaryList.style.display = "grid";
  dictionaryList.style.gap = "6px";
  dictionaryList.style.padding = "6px 0";

  const dictionaryForm = document.createElement("div");
  dictionaryForm.style.display = "grid";
  dictionaryForm.style.gap = "8px";
  dictionaryForm.style.padding = "8px";
  dictionaryForm.style.border = "1px solid var(--card-border)";
  dictionaryForm.style.borderRadius = "8px";
  dictionaryForm.style.background = "var(--card-bg)";

  const formHeader = document.createElement("div");
  formHeader.style.display = "flex";
  formHeader.style.justifyContent = "space-between";
  formHeader.style.alignItems = "center";
  formHeader.style.gap = "8px";

  const formTitle = document.createElement("div");
  formTitle.textContent = "Eintrag bearbeiten";
  formTitle.style.fontWeight = "700";

  const formMeta = document.createElement("div");
  formMeta.style.fontSize = "11px";
  formMeta.style.opacity = "0.75";
  formMeta.textContent = "Kategorie: Bau";

  formHeader.append(formTitle, formMeta);

  const formGrid = document.createElement("div");
  formGrid.style.display = "grid";
  formGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
  formGrid.style.gap = "8px";

  const makeField = (labelText, element) => {
    const wrap = document.createElement("label");
    wrap.style.display = "grid";
    wrap.style.gap = "4px";
    wrap.style.fontSize = "12px";
    const label = document.createElement("span");
    label.textContent = labelText;
    wrap.append(label, element);
    return wrap;
  };

  const entryTypeSelect = document.createElement("select");
  const optionTerm = document.createElement("option");
  optionTerm.value = "term";
  optionTerm.textContent = "Fachbegriff";
  const optionCorrection = document.createElement("option");
  optionCorrection.value = "correction";
  optionCorrection.textContent = "Korrektur";
  entryTypeSelect.append(optionTerm, optionCorrection);

  const termInput = document.createElement("input");
  termInput.type = "text";
  termInput.placeholder = "Bekannter Begriff";

  const wrongInput = document.createElement("input");
  wrongInput.type = "text";
  wrongInput.placeholder = "erkannt / falsch";

  const correctInput = document.createElement("input");
  correctInput.type = "text";
  correctInput.placeholder = "korrekt / soll";

  const activeRow = document.createElement("label");
  activeRow.style.display = "flex";
  activeRow.style.alignItems = "center";
  activeRow.style.gap = "6px";
  activeRow.style.fontSize = "12px";
  const activeInput = document.createElement("input");
  activeInput.type = "checkbox";
  const activeLabel = document.createElement("span");
  activeLabel.textContent = "Aktiv";
  activeRow.append(activeInput, activeLabel);

  const formActions = document.createElement("div");
  formActions.style.display = "flex";
  formActions.style.flexWrap = "wrap";
  formActions.style.gap = "8px";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Speichern";
  applyScaleBtnBase(saveButton);

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Neu";
  applyScaleBtnBase(resetButton);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Abbrechen";
  applyScaleBtnBase(cancelButton);

  formActions.append(saveButton, resetButton, cancelButton);

  formGrid.append(
    makeField("Eintragstyp", entryTypeSelect),
    makeField("Fachbegriff", termInput),
    makeField("erkannt / falsch", wrongInput),
    makeField("korrekt / soll", correctInput)
  );

  dictionaryForm.append(formHeader, formGrid, activeRow, formActions);

  dictionaryBox.append(
    dictionaryTitle,
    dictionaryHint,
    dictionaryToolbar,
    dictionaryMessage,
    dictionaryList,
    dictionaryForm
  );

  dictionaryToolbar.append(dictionarySearch, dictionaryRefreshButton);

  let dictionaryEntries = [];
  let editingEntry = null;

  const getApi = () => settingsApi?.() || {};

  const setMessage = (text) => {
    dictionaryMessage.textContent = String(text || "");
  };

  const getEntryTypeLabel = (entryType) => {
    return String(entryType || "").trim() === "term" ? "Fachbegriff" : "Korrektur";
  };

  const getSourceLabel = (source) => {
    return String(source || "").trim() === "base" ? "Grundstamm" : "Eigener Eintrag";
  };

  const getStatusLabel = (entry) => (Number(entry?.active) === 1 ? "aktiv" : "inaktiv");

  const getEntrySummary = (entry) => {
    const typeLabel = getEntryTypeLabel(entry?.entry_type);
    const sourceLabel = getSourceLabel(entry?.source);
    const statusLabel = getStatusLabel(entry);
    const categoryLabel = String(entry?.category || "Bau").trim() || "Bau";

    if (String(entry?.entry_type || "") === "term") {
      return [
        `${typeLabel} · ${sourceLabel}`,
        `Begriff: ${entry?.term_text || ""}`,
        `Status: ${statusLabel}`,
        `Kategorie: ${categoryLabel}`,
      ];
    }

    return [
      `${typeLabel} · ${sourceLabel}`,
      `erkannt: ${entry?.wrong_text || ""}`,
      `wird ersetzt durch: ${entry?.correct_text || ""}`,
      `Status: ${statusLabel}`,
      `Kategorie: ${categoryLabel}`,
    ];
  };

  const syncFormVisibility = () => {
    const isCorrection = String(entryTypeSelect.value || "correction") === "correction";
    termInput.closest("label").style.display = isCorrection ? "none" : "";
    wrongInput.closest("label").style.display = isCorrection ? "" : "none";
    correctInput.closest("label").style.display = isCorrection ? "" : "none";
  };

  const clearForm = () => {
    editingEntry = null;
    entryTypeSelect.value = "correction";
    termInput.value = "";
    wrongInput.value = "";
    correctInput.value = "";
    activeInput.checked = true;
    formTitle.textContent = "Eintrag anlegen";
    resetButton.style.display = "";
    resetButton.textContent = "Neu";
    cancelButton.style.display = "none";
    cancelButton.textContent = "Abbrechen";
    syncFormVisibility();
  };

  const fillForm = (entry) => {
    editingEntry = entry || null;
    formTitle.textContent = editingEntry ? "Eintrag bearbeiten" : "Eintrag anlegen";
    resetButton.style.display = "none";
    cancelButton.style.display = "";
    cancelButton.textContent = "Abbrechen";
    entryTypeSelect.value = String(entry?.entry_type || "correction");
    termInput.value = String(entry?.term_text || "");
    wrongInput.value = String(entry?.wrong_text || "");
    correctInput.value = String(entry?.correct_text || "");
    activeInput.checked = Number(entry?.active ?? 1) === 1;
    syncFormVisibility();
  };

  const renderEntries = () => {
    const filter = String(dictionarySearch.value || "").trim().toLocaleLowerCase("de-DE");
    const visibleEntries = filter
      ? dictionaryEntries.filter((entry) => {
          const haystack = [
            entry?.entry_type,
            entry?.source,
            entry?.term_text,
            entry?.wrong_text,
            entry?.correct_text,
          ]
            .map((value) => String(value || "").toLocaleLowerCase("de-DE"))
            .join(" ");
          return haystack.includes(filter);
        })
      : dictionaryEntries.slice();

    dictionaryList.textContent = "";
    if (!visibleEntries.length) {
      const empty = document.createElement("div");
      empty.style.fontSize = "12px";
      empty.style.opacity = "0.75";
      empty.textContent = "Keine Einträge gefunden.";
      dictionaryList.appendChild(empty);
      return;
    }

    visibleEntries.forEach((entry) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1.1fr 1.4fr auto";
      row.style.gap = "8px";
      row.style.alignItems = "start";
      row.style.padding = "8px";
      row.style.border = "1px solid var(--card-border)";
      row.style.borderRadius = "8px";
      row.style.background = "var(--card-bg)";
      row.style.minWidth = "0";

      const meta = document.createElement("div");
      meta.style.display = "grid";
      meta.style.gap = "4px";
      meta.style.fontSize = "12px";
      meta.style.minWidth = "0";

      const summaryLines = getEntrySummary(entry);
      summaryLines.forEach((line, index) => {
        const lineEl = document.createElement("div");
        lineEl.textContent = line;
        if (index === 0) {
          lineEl.style.fontWeight = "700";
        }
        meta.appendChild(lineEl);
      });

      const textCol = document.createElement("div");
      textCol.style.display = "grid";
      textCol.style.gap = "2px";
      textCol.style.fontSize = "12px";
      textCol.style.minWidth = "0";
      if (entry?.entry_type === "term") {
        const termLine = document.createElement("div");
        termLine.textContent = `Begriff: ${entry?.term_text || ""}`;
        textCol.append(termLine);
      } else {
        const wrongLine = document.createElement("div");
        wrongLine.textContent = `erkannt: ${entry?.wrong_text || ""}`;
        const correctLine = document.createElement("div");
        correctLine.textContent = `wird ersetzt durch: ${entry?.correct_text || ""}`;
        textCol.append(wrongLine, correctLine);
      }

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.flexWrap = "wrap";
      actions.style.gap = "6px";
      actions.style.justifyContent = "flex-end";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Bearbeiten";
      applyScaleBtnBase(editButton);
      editButton.onclick = () => fillForm(entry);

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.textContent = Number(entry?.active) === 1 ? "Deaktivieren" : "Aktivieren";
      applyScaleBtnBase(toggleButton);
      toggleButton.onclick = async () => {
        const api = getApi();
        if (typeof api.dictionarySetEntryActive !== "function") return;
        const res = await api.dictionarySetEntryActive({ id: entry.id, active: Number(entry?.active) !== 1 });
        setMessage(res?.ok ? "Status aktualisiert." : res?.error || "Status konnte nicht geändert werden.");
        await loadEntries();
      };

      actions.append(editButton, toggleButton);

      if (String(entry?.source || "") === "user") {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Löschen";
        applyScaleBtnBase(deleteButton);
        deleteButton.onclick = async () => {
          const api = getApi();
          if (typeof api.dictionaryDeleteEntry !== "function") return;
          const res = await api.dictionaryDeleteEntry({ id: entry.id });
          setMessage(res?.ok ? "Eintrag gelöscht." : res?.error || "Aktion fehlgeschlagen.");
          await loadEntries();
          if (editingEntry?.id === entry.id) clearForm();
        };
        actions.append(deleteButton);
      }

      row.append(meta, textCol, actions);
      dictionaryList.appendChild(row);
    });
  };

  const loadEntries = async () => {
    const api = getApi();
    if (typeof api.dictionaryListEntries !== "function") {
      dictionaryEntries = [];
      dictionaryList.textContent = "";
      setMessage("Dictionary-API fehlt (IPC noch nicht aktiv).");
      return;
    }
    const res = await api.dictionaryListEntries({ search: dictionarySearch.value || "", category: "Bau" });
    dictionaryEntries = Array.isArray(res?.entries) ? res.entries : [];
    setMessage(res?.ok ? `${dictionaryEntries.length} Einträge geladen.` : res?.error || "Einträge konnten nicht geladen werden.");
    renderEntries();
  };

  const saveEntry = async () => {
    const api = getApi();
    const entryType = String(entryTypeSelect.value || "correction");
    const payload = {
      entryType,
      active: activeInput.checked ? 1 : 0,
    };

    if (entryType === "term") {
      payload.termText = termInput.value;
    } else {
      payload.wrongText = wrongInput.value;
      payload.correctText = correctInput.value;
    }

    const fn = editingEntry?.id ? api.dictionaryUpdateEntry : api.dictionaryCreateEntry;
    if (typeof fn !== "function") {
      setMessage("Dictionary-API fehlt (IPC noch nicht aktiv).");
      return;
    }

    const res = editingEntry?.id
      ? await fn({ id: editingEntry.id, ...payload })
      : await fn(payload);
    if (!res?.ok) {
      setMessage(res?.error || "Eintrag konnte nicht gespeichert werden.");
      return;
    }

    setMessage(editingEntry?.id ? "Eintrag aktualisiert." : "Eintrag angelegt.");
    clearForm();
    await loadEntries();
  };

  entryTypeSelect.addEventListener("change", syncFormVisibility);
  dictionarySearch.addEventListener("input", renderEntries);
  dictionaryRefreshButton.onclick = async () => loadEntries();
  saveButton.onclick = async () => saveEntry();
  resetButton.onclick = () => clearForm();
  cancelButton.onclick = () => clearForm();

  clearForm();
  syncFormVisibility();

  dictationTab.append(dictationProductBox, dictionaryBox);

  return {
    tab: dictationTab,
    load: async () => {
      await loadWhisperQualitySettings();
      await loadEntries();
    },
  };
}
