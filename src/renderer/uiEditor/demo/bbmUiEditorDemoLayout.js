const DEMO_ELEMENT_ID = "bbm.demo.card.moveable";
const DEFAULT_DEMO_LAYOUT_VALUE = Object.freeze({ x: 120, y: 80 });
const MOVE_STEP = 20;

const neutralDemoLayouts = new Map();

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeLayoutValue(layoutValue = {}) {
  return {
    x: toFiniteNumber(layoutValue?.x, DEFAULT_DEMO_LAYOUT_VALUE.x),
    y: toFiniteNumber(layoutValue?.y, DEFAULT_DEMO_LAYOUT_VALUE.y),
  };
}

function cloneLayoutEntry(entry) {
  const layoutValue = normalizeLayoutValue(entry?.layoutValue);
  return {
    elementId: DEMO_ELEMENT_ID,
    layoutValue,
  };
}

function createDemoLayoutEntry(layoutValue = DEFAULT_DEMO_LAYOUT_VALUE) {
  return {
    elementId: DEMO_ELEMENT_ID,
    layoutValue: normalizeLayoutValue(layoutValue),
  };
}

function createDemoLayoutStore(entries = neutralDemoLayouts) {
  return {
    load(elementId = DEMO_ELEMENT_ID) {
      if (elementId !== DEMO_ELEMENT_ID) return createDemoLayoutEntry();
      return cloneLayoutEntry(entries.get(DEMO_ELEMENT_ID) || createDemoLayoutEntry());
    },
    save(entry = createDemoLayoutEntry()) {
      const nextEntry = createDemoLayoutEntry(entry?.layoutValue);
      entries.set(DEMO_ELEMENT_ID, nextEntry);
      return cloneLayoutEntry(nextEntry);
    },
    reset() {
      const nextEntry = createDemoLayoutEntry();
      entries.set(DEMO_ELEMENT_ID, nextEntry);
      return cloneLayoutEntry(nextEntry);
    },
    clear() {
      entries.clear();
    },
  };
}

function moveDemoLayoutValue(layoutValue = DEFAULT_DEMO_LAYOUT_VALUE, direction = "") {
  const current = normalizeLayoutValue(layoutValue);
  if (direction === "left") return { x: current.x - MOVE_STEP, y: current.y };
  if (direction === "right") return { x: current.x + MOVE_STEP, y: current.y };
  if (direction === "up") return { x: current.x, y: current.y - MOVE_STEP };
  if (direction === "down") return { x: current.x, y: current.y + MOVE_STEP };
  return current;
}

const bbmUiEditorDemoLayoutStore = createDemoLayoutStore();

export {
  DEMO_ELEMENT_ID,
  DEFAULT_DEMO_LAYOUT_VALUE,
  MOVE_STEP,
  bbmUiEditorDemoLayoutStore,
  createDemoLayoutEntry,
  createDemoLayoutStore,
  moveDemoLayoutValue,
  normalizeLayoutValue,
};
