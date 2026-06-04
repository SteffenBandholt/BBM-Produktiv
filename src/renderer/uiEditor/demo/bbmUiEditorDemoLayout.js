const DEMO_ELEMENT_ID = "bbm.demo.card.moveable";
const DEMO_LAYOUT_STORAGE_KEY = "bbm.uiEditor.demo.layout.v1";
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteCoordinatePair(value) {
  return isPlainObject(value) && Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y));
}

function createStoredDemoPayload(layoutValue = DEFAULT_DEMO_LAYOUT_VALUE) {
  return {
    [DEMO_ELEMENT_ID]: normalizeLayoutValue(layoutValue),
  };
}

function isValidStoredDemoPayload(payload) {
  return (
    isPlainObject(payload) &&
    Object.keys(payload).length === 1 &&
    Object.prototype.hasOwnProperty.call(payload, DEMO_ELEMENT_ID) &&
    isFiniteCoordinatePair(payload[DEMO_ELEMENT_ID])
  );
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

function isDemoStorageAdapter(candidate) {
  return (
    Boolean(candidate) &&
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function"
  );
}

function getDefaultDemoStorageAdapter() {
  const storage = globalThis?.localStorage;
  return isDemoStorageAdapter(storage) ? storage : null;
}

function readStoredDemoLayout(storageAdapter) {
  const rawPayload = storageAdapter.getItem(DEMO_LAYOUT_STORAGE_KEY);
  if (rawPayload === null || rawPayload === undefined || rawPayload === "") {
    return createDemoLayoutEntry();
  }

  let parsedPayload;
  try {
    parsedPayload = JSON.parse(String(rawPayload));
  } catch {
    parsedPayload = null;
  }

  if (!isValidStoredDemoPayload(parsedPayload)) {
    writeStoredDemoLayout(storageAdapter, DEFAULT_DEMO_LAYOUT_VALUE);
    return createDemoLayoutEntry();
  }

  return createDemoLayoutEntry(parsedPayload[DEMO_ELEMENT_ID]);
}

function writeStoredDemoLayout(storageAdapter, layoutValue = DEFAULT_DEMO_LAYOUT_VALUE) {
  const payload = createStoredDemoPayload(layoutValue);
  storageAdapter.setItem(DEMO_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
  return createDemoLayoutEntry(payload[DEMO_ELEMENT_ID]);
}

function createDemoLayoutStore(adapter = getDefaultDemoStorageAdapter() || neutralDemoLayouts) {
  const storageAdapter = isDemoStorageAdapter(adapter) ? adapter : null;
  const entries = storageAdapter ? null : adapter || neutralDemoLayouts;

  return {
    load(elementId = DEMO_ELEMENT_ID) {
      if (elementId !== DEMO_ELEMENT_ID) return createDemoLayoutEntry();
      if (storageAdapter) return readStoredDemoLayout(storageAdapter);
      return cloneLayoutEntry(entries.get(DEMO_ELEMENT_ID) || createDemoLayoutEntry());
    },
    save(entry = createDemoLayoutEntry()) {
      const nextEntry = createDemoLayoutEntry(entry?.layoutValue);
      if (storageAdapter) return writeStoredDemoLayout(storageAdapter, nextEntry.layoutValue);
      entries.set(DEMO_ELEMENT_ID, nextEntry);
      return cloneLayoutEntry(nextEntry);
    },
    reset() {
      const nextEntry = createDemoLayoutEntry();
      if (storageAdapter) return writeStoredDemoLayout(storageAdapter, nextEntry.layoutValue);
      entries.set(DEMO_ELEMENT_ID, nextEntry);
      return cloneLayoutEntry(nextEntry);
    },
    clear() {
      if (storageAdapter) {
        storageAdapter.removeItem?.(DEMO_LAYOUT_STORAGE_KEY);
        return;
      }
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
  DEMO_LAYOUT_STORAGE_KEY,
  DEFAULT_DEMO_LAYOUT_VALUE,
  MOVE_STEP,
  bbmUiEditorDemoLayoutStore,
  createDemoLayoutEntry,
  createDemoLayoutStore,
  createStoredDemoPayload,
  moveDemoLayoutValue,
  normalizeLayoutValue,
};
