import DrucklayoutScreen from "./DrucklayoutScreen.js";

export { DrucklayoutScreen };
export { renderDrucklayoutTable } from "./DrucklayoutTable.js";
export { topsLayout } from "./layouts/topsLayout.js";

export function createDrucklayoutDevScreen() {
  return new DrucklayoutScreen();
}
