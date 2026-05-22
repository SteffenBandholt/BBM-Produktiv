const LAYOUT_ELEMENT_KINDS = Object.freeze({
  AREA: 'area',
  CONTAINER: 'container',
  FIELD: 'field',
  LIST: 'list',
  INPUT_AREA: 'inputArea',
  SPECIAL: 'special',
});

const SETTING_KINDS = Object.freeze({
  WIDTH: 'width',
  HEIGHT: 'height',
  SPACING: 'spacing',
  OFFSET_X: 'offsetX',
  OFFSET_Y: 'offsetY',
  COLUMN_WIDTH: 'columnWidth',
  FIELD_WIDTH: 'fieldWidth',
});

module.exports = {
  LAYOUT_ELEMENT_KINDS,
  SETTING_KINDS,
};
