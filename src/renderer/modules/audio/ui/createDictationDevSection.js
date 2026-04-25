export function createDictationDevSection({
  applyPopupCardStyle,
  mkScaleGroup,
  applyScaleBtnBase,
  setScaleBtnActive,
  settingsApi,
}) {
  const AUDIO_WHISPER_QUALITY_KEY = "audio.whisper.quality";

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

  let whisperQuality = "fast";
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
        whisperQuality = ["fast", "balanced", "best", "large"].includes(raw) ? raw : "fast";
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
  dictionaryBox.style.gap = "6px";

  const dictionaryTitle = document.createElement("div");
  dictionaryTitle.textContent = "Woerterbuch";
  dictionaryTitle.style.fontWeight = "700";

  const dictionaryHint = document.createElement("div");
  dictionaryHint.style.fontSize = "12px";
  dictionaryHint.style.opacity = "0.8";
  dictionaryHint.textContent = "Vorbereiteter Baustein fuer Diktieren (noch nicht eingerichtet, spaeter).";

  dictionaryBox.append(dictionaryTitle, dictionaryHint);

  dictationTab.append(dictationProductBox, dictionaryBox);

  return {
    tab: dictationTab,
    load: loadWhisperQualitySettings,
  };
}
