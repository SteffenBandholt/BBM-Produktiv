import RestarbeitenScreen from "./RestarbeitenScreen.js";

export { default as RestarbeitenScreen } from "./RestarbeitenScreen.js";

export const RESTARBEITEN_WORK_SCREEN_ID = "restarbeiten-work";
export const RESTARBEITEN_WORK_SCREEN_LABEL = "Restarbeiten";

// Konservativer Screen-Anker fuer das Fachmodul `Restarbeiten`.
// Die erste eigenstaendige Workbench wird hier angebunden, ohne Router- oder
// Navigationsintegration vorzuziehen.
export function getRestarbeitenScreenEntry() {
  return Object.freeze({
    screenId: RESTARBEITEN_WORK_SCREEN_ID,
    screenLabel: RESTARBEITEN_WORK_SCREEN_LABEL,
    screenComponent: RestarbeitenScreen,
  });
}
