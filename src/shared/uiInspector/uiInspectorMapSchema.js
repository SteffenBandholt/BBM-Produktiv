const { LAYOUT_ELEMENT_KINDS, SETTING_KINDS } = require('./uiInspectorTypes');

const ALLOWED_ELEMENT_KINDS = new Set(Object.values(LAYOUT_ELEMENT_KINDS));
const ALLOWED_SETTING_KINDS = new Set(Object.values(SETTING_KINDS));

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

function normalizeSetting(setting, elementId, index) {
  if (!setting || typeof setting !== 'object' || Array.isArray(setting)) {
    throw new Error(`UiInspectorMapSchema: setting at index ${index} of element "${elementId}" must be an object.`);
  }

  const id = normalizeText(setting.id);
  if (!id) {
    throw new Error(`UiInspectorMapSchema: setting id at index ${index} of element "${elementId}" must not be empty.`);
  }

  const kind = normalizeText(setting.kind);
  if (!ALLOWED_SETTING_KINDS.has(kind)) {
    throw new Error(`UiInspectorMapSchema: setting kind "${kind}" is not allowed.`);
  }

  const label = normalizeText(setting.label);

  const normalizedSetting = {
    ...setting,
    id,
    kind,
    label,
  };

  if (!label) {
    delete normalizedSetting.label;
  }

  return normalizedSetting;
}

function normalizeElement(element, index, seenElementIds) {
  if (!element || typeof element !== 'object' || Array.isArray(element)) {
    throw new Error(`UiInspectorMapSchema: element at index ${index} must be an object.`);
  }

  const id = normalizeText(element.id);
  if (!id) {
    throw new Error(`UiInspectorMapSchema: element id at index ${index} must not be empty.`);
  }

  if (seenElementIds.has(id)) {
    throw new Error(`UiInspectorMapSchema: duplicate element id "${id}" is not allowed.`);
  }
  seenElementIds.add(id);

  const kind = normalizeText(element.kind);
  if (!ALLOWED_ELEMENT_KINDS.has(kind)) {
    throw new Error(`UiInspectorMapSchema: element kind "${kind}" is not allowed.`);
  }

  const label = normalizeText(element.label);
  const parentId = normalizeOptionalText(element.parentId);

  const settingsInput = element.settings == null ? [] : element.settings;
  if (!Array.isArray(settingsInput)) {
    throw new Error(`UiInspectorMapSchema: settings for element "${id}" must be an array.`);
  }

  const settings = settingsInput.map((setting, settingIndex) =>
    normalizeSetting(setting, id, settingIndex)
  );

  return {
    ...element,
    id,
    kind,
    label,
    parentId,
    settings,
  };
}

function normalizeUiInspectorMap(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    throw new Error('UiInspectorMapSchema: map must be an object.');
  }

  const id = normalizeText(map.id);
  if (!id) {
    throw new Error('UiInspectorMapSchema: map id must not be empty.');
  }

  const label = normalizeText(map.label);
  const version = normalizeOptionalText(map.version);

  const elementsInput = map.elements == null ? [] : map.elements;
  if (!Array.isArray(elementsInput)) {
    throw new Error('UiInspectorMapSchema: map elements must be an array.');
  }

  const seenElementIds = new Set();
  const elements = elementsInput.map((element, index) => normalizeElement(element, index, seenElementIds));

  for (const element of elements) {
    if (element.parentId && !seenElementIds.has(element.parentId)) {
      throw new Error(
        `UiInspectorMapSchema: parentId "${element.parentId}" of element "${element.id}" does not reference a known element.`
      );
    }
  }

  return {
    ...map,
    id,
    label,
    version,
    elements,
  };
}

module.exports = {
  normalizeUiInspectorMap,
};
