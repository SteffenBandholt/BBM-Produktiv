function normalizeKey(value) {
  return String(value || "").trim();
}

// Kleine pure Aufloesungshilfe fuer Modul-Eintraege.
// Sie kennt keinen Modulkatalog, keine Navigation und keine Plattformmechanik.
export function resolveModuleScreenFromEntry(moduleEntry, screenId) {
  const normalizedScreenId = normalizeKey(screenId);
  if (!moduleEntry || !normalizedScreenId) return null;

  const screens = moduleEntry?.screens && typeof moduleEntry.screens === "object"
    ? moduleEntry.screens
    : null;
  if (!screens) return null;

  const screenEntry = screens[normalizedScreenId] || null;
  if (!screenEntry) return null;
  if (typeof screenEntry === "function") return screenEntry;
  if (screenEntry && typeof screenEntry === "object") {
    return screenEntry.screenComponent || null;
  }
  return null;
}

export function resolveModuleWorkScreenFromEntry(moduleEntry) {
  const workScreenId = normalizeKey(moduleEntry?.workScreenId);
  if (!moduleEntry || !workScreenId) return null;
  return resolveModuleScreenFromEntry(moduleEntry, workScreenId);
}
