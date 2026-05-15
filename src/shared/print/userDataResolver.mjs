function _trimText(v) {
  return String(v ?? "").trim();
}

function _parseBool(v) {
  const s = _trimText(v).toLowerCase();
  if (!s) return false;
  if (["1", "true", "yes", "ja", "on"].includes(s)) return true;
  return false;
}

function _hasAnyText(values) {
  return Object.values(values || {}).some((value) => !!_trimText(value));
}

function _normalizeProfile(profile = {}) {
  return {
    name1: _trimText(profile?.name1),
    name2: _trimText(profile?.name2),
    street: _trimText(profile?.street),
    zip: _trimText(profile?.zip),
    city: _trimText(profile?.city),
  };
}

function _normalizeLegacyFooter(settings = {}) {
  return {
    name1: _trimText(settings?.user_name1),
    name2: _trimText(settings?.user_name2),
    street: _trimText(settings?.user_street),
    zip: _trimText(settings?.user_zip),
    city: _trimText(settings?.user_city),
  };
}

function _normalizeManualFooter(settings = {}) {
  return {
    place: _trimText(settings?.["pdf.footerPlace"]),
    date: _trimText(settings?.["pdf.footerDate"]),
    name1: _trimText(settings?.["pdf.footerName1"]),
    name2: _trimText(settings?.["pdf.footerName2"]),
    recorder: _trimText(settings?.["pdf.footerRecorder"]),
    street: _trimText(settings?.["pdf.footerStreet"]),
    zip: _trimText(settings?.["pdf.footerZip"]),
    city: _trimText(settings?.["pdf.footerCity"]),
  };
}

function _pickEffective(manualValue, baseValue) {
  const manual = _trimText(manualValue);
  if (manual) return manual;
  return _trimText(baseValue);
}

export function resolvePrintUserData({ settings = {}, userProfile = null } = {}) {
  const profile = _normalizeProfile(userProfile || {});
  const legacy = _normalizeLegacyFooter(settings || {});
  const manual = _normalizeManualFooter(settings || {});

  const profileHasAny = _hasAnyText(profile);
  const legacyHasAny = _hasAnyText(legacy);
  const manualHasAny = _hasAnyText(manual);
  const useUserData = _parseBool(settings?.["pdf.footerUseUserData"]);
  const baseSource = profileHasAny ? "profile" : legacyHasAny ? "legacy" : "";
  const base = useUserData ? (profileHasAny ? profile : legacyHasAny ? legacy : profile) : {
    name1: "",
    name2: "",
    street: "",
    zip: "",
    city: "",
  };

  const footer = {
    useUserData: useUserData || manualHasAny,
    hasManualFields: manualHasAny,
    baseSource: manualHasAny ? "manual" : baseSource,
    place: manual.place,
    date: manual.date,
    name1: _pickEffective(manual.name1, base.name1),
    name2: _pickEffective(manual.name2, base.name2),
    recorder: manual.recorder,
    street: _pickEffective(manual.street, base.street),
    zip: _pickEffective(manual.zip, base.zip),
    city: _pickEffective(manual.city, base.city),
  };

  const settingsWithResolvedFooter = {
    ...(settings || {}),
    user_name1: profile.name1 || legacy.name1 || "",
    user_name2: profile.name2 || legacy.name2 || "",
    user_street: profile.street || legacy.street || "",
    user_zip: profile.zip || legacy.zip || "",
    user_city: profile.city || legacy.city || "",
    "pdf.footerUseUserData": footer.useUserData ? "true" : "false",
    "pdf.footerPlace": manual.place,
    "pdf.footerDate": manual.date,
    "pdf.footerName1": footer.name1,
    "pdf.footerName2": footer.name2,
    "pdf.footerRecorder": manual.recorder,
    "pdf.footerStreet": footer.street,
    "pdf.footerZip": footer.zip,
    "pdf.footerCity": footer.city,
  };

  return {
    settings: settingsWithResolvedFooter,
    profile,
    legacy,
    footer,
    header: {
      userName: _trimText(settings?.user_name),
      userCompany: _trimText(settings?.user_company),
    },
  };
}

export { _trimText, _parseBool };
