const ALLOWED_PROPERTIES = new Set(['width', 'height', 'marginLeft', 'marginTop']);

function parsePixelValue(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBoundingRectBaseValue(targetElement, property) {
  if (!targetElement || typeof targetElement.getBoundingClientRect !== 'function') return 0;
  const rect = targetElement.getBoundingClientRect();
  if (!rect) return 0;
  if (property === 'width') return Number.isFinite(rect.width) ? rect.width : 0;
  if (property === 'height') return Number.isFinite(rect.height) ? rect.height : 0;
  return 0;
}

export function createUiInspectorTemporaryStyles() {
  const originalInlineByElement = new Map();
  const previewStateById = new Map();

  function ensureOriginalInlineStyle(targetElement) {
    if (!targetElement || originalInlineByElement.has(targetElement)) return;
    const cssText = String(targetElement.style?.cssText || '');
    originalInlineByElement.set(targetElement, cssText);
  }

  function applyDelta(targetElement, property, delta, id = '') {
    if (!targetElement || !ALLOWED_PROPERTIES.has(property) || !Number.isFinite(delta)) return false;
    ensureOriginalInlineStyle(targetElement);
    const inlineValue = String(targetElement.style?.[property] || '').trim();
    const currentValue = inlineValue
      ? parsePixelValue(inlineValue)
      : ((property === 'width' || property === 'height')
        ? getBoundingRectBaseValue(targetElement, property)
        : 0);
    const nextValue = currentValue + delta;
    const safeValue = (property === 'width' || property === 'height')
      ? Math.max(1, nextValue)
      : nextValue;
    targetElement.style[property] = `${safeValue}px`;
    previewStateById.set(String(id || ''), {
      ...(previewStateById.get(String(id || '')) || {}),
      [property]: targetElement.style[property],
    });
    return true;
  }

  function toggleVisibility(targetElement, id = '') {
    if (!targetElement) return false;
    ensureOriginalInlineStyle(targetElement);
    const nextVisibility = targetElement.style?.visibility === 'hidden' ? 'visible' : 'hidden';
    targetElement.style.visibility = nextVisibility;
    previewStateById.set(String(id || ''), {
      ...(previewStateById.get(String(id || '')) || {}),
      visibility: nextVisibility,
    });
    return true;
  }

  function resetElement(targetElement, id = '') {
    if (!targetElement || !originalInlineByElement.has(targetElement)) return false;
    targetElement.style.cssText = originalInlineByElement.get(targetElement) || '';
    originalInlineByElement.delete(targetElement);
    previewStateById.delete(String(id || ''));
    return true;
  }

  function resetAll() {
    for (const [element, cssText] of originalInlineByElement.entries()) {
      element.style.cssText = cssText || '';
    }
    originalInlineByElement.clear();
    previewStateById.clear();
    return true;
  }

  function getPreviewState(id = '') {
    return previewStateById.get(String(id || '')) || null;
  }

  return { applyDelta, toggleVisibility, resetElement, resetAll, getPreviewState };
}
