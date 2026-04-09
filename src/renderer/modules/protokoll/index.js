import TopsScreen from "./screens/TopsScreen.js";

export const PROTOKOLL_MODULE_ID = "protokoll";

// Technische Heimat fuer das Fachmodul `Protokoll`.
// Der heutige Bestand bleibt vorerst in seinen vorhandenen Pfaden und wird hier
// nur ueber kleine Einstiegspunkte angedockt.
export function getProtokollModuleEntry() {
  return Object.freeze({
    moduleId: PROTOKOLL_MODULE_ID,
    screens: {
      work: TopsScreen,
    },
  });
}

export { TopsScreen };
