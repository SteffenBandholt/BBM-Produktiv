export const RESTARBEITEN_WORK_SCREEN_ID = "restarbeiten-work";

// Konservativer Screen-Anker fuer das spaetere Fachmodul `Restarbeiten`.
// Es wird bewusst noch kein echter Screen implementiert oder angebunden.
export function getRestarbeitenScreenEntry() {
  return Object.freeze({
    screenId: RESTARBEITEN_WORK_SCREEN_ID,
    screenLabel: "Restarbeiten",
    screenComponent: null,
  });
}

